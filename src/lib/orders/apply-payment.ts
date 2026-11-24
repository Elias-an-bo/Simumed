import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { sendPaymentApproved } from "./emails";
import { ORDER_STATUS_LABEL, nextStatusFor, type OrderStatusValue } from "./status";

const PAYMENT_LABEL: Record<string, string> = {
  approved: "aprovado",
  pending: "pendente",
  in_process: "em análise",
  authorized: "autorizado",
  rejected: "recusado",
  cancelled: "cancelado/expirado",
  refunded: "estornado",
  charged_back: "contestado",
};

/**
 * Aplica uma atualização de pagamento ao pedido. Idempotente: a mesma notificação (id + status) só conta uma vez.
 * Pedidos pagos nunca voltam para pendente. Notificações de tentativas antigas só contam se forem aprovação.
 */
export async function applyPaymentUpdate(
  orderId: string,
  payment: { id: string; status: string; statusDetail?: string | null },
): Promise<{ changed: boolean; status?: OrderStatusValue }> {
  const result = await prisma
    .$transaction(async (tx) => {
      await tx.orderEvent.create({
        data: {
          orderId,
          type: "payment",
          message: `Pagamento ${payment.id}: ${PAYMENT_LABEL[payment.status] ?? payment.status}${payment.statusDetail ? ` (${payment.statusDetail})` : ""}`,
          dedupeKey: `payment:${payment.id}:${payment.status}`,
        },
      });
      const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
      const isCurrentAttempt = !order.paymentId || order.paymentId === payment.id;
      if (!isCurrentAttempt && payment.status !== "approved") return { changed: false, from: order.status, to: order.status };
      const next = nextStatusFor(order.status, payment.status);
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: payment.status,
          ...(payment.status === "approved" && !isCurrentAttempt ? { paymentId: payment.id } : {}),
          status: next,
          ...(next === "PAID" && order.status !== "PAID" ? { paidAt: new Date() } : {}),
        },
      });
      if (next !== order.status) {
        await tx.orderEvent.create({ data: { orderId, type: "status", message: `Status: ${ORDER_STATUS_LABEL[next]}` } });
      }
      if (order.status === "CANCELED" && payment.status === "approved") {
        await tx.orderEvent.create({ data: { orderId, type: "note", message: "Atenção: pagamento aprovado em pedido cancelado. Verifique e estorne se for o caso." } });
      }
      return { changed: true, from: order.status, to: next };
    })
    .catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return null; // notificação repetida
      throw e;
    });

  if (!result) return { changed: false };
  if (result.from !== "PAID" && result.to === "PAID") {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (order) await sendPaymentApproved(order);
  }
  return { changed: result.changed, status: result.to };
}
