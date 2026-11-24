import { NextResponse } from "next/server";
import { getOrderWithToken } from "@/lib/orders/access";
import { applyPaymentUpdate } from "@/lib/orders/apply-payment";

/** Só para desenvolvimento/testes com PAYMENT_PROVIDER=fake: simula a aprovação do Pix/boleto. */
export async function POST(req: Request) {
  if (process.env.PAYMENT_PROVIDER !== "fake" || process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const { id, t } = (await req.json().catch(() => ({}))) as { id?: string; t?: string };
  const order = id ? await getOrderWithToken(id, t) : null;
  if (!order?.paymentId) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  return NextResponse.json(await applyPaymentUpdate(order.id, { id: order.paymentId, status: "approved" }));
}
