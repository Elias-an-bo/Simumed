import { NextResponse } from "next/server";
import { getOrderWithToken } from "@/lib/orders/access";
import { applyPaymentUpdate } from "@/lib/orders/apply-payment";
import { allowPaymentPull } from "@/lib/orders/pull-throttle";
import { getPaymentProvider } from "@/lib/payments";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let order = await getOrderWithToken(id, new URL(req.url).searchParams.get("t"));
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });

  // Fallback do webhook: consulta o Mercado Pago diretamente enquanto o cliente espera na página.
  const provider = getPaymentProvider();
  if (order.status === "PENDING_PAYMENT" && order.paymentId && provider.name === "mercadopago" && allowPaymentPull(order.id)) {
    try {
      const payment = await provider.getPayment(order.paymentId);
      if (payment.status !== order.paymentStatus) {
        await applyPaymentUpdate(order.id, payment);
        order = (await getOrderWithToken(id, order.accessToken)) ?? order;
      }
    } catch (e) {
      console.warn("[status] consulta ao Mercado Pago falhou:", e);
    }
  }
  return NextResponse.json({ status: order.status, paymentStatus: order.paymentStatus, updatedAt: order.updatedAt });
}
