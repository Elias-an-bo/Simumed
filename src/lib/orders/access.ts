import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";

/** Busca o pedido só se o token de acesso (enviado no link ao cliente) conferir. */
export async function getOrderWithToken(id: string, token: string | null | undefined) {
  if (!token || token.length > 100 || id.length > 64) return null;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return null;
  const a = Buffer.from(order.accessToken);
  const b = Buffer.from(token);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return order;
}
