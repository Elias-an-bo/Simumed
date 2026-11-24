import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyPaymentUpdate } from "@/lib/orders/apply-payment";
import { getPaymentProvider } from "@/lib/payments";
import { verifyMercadoPagoSignature } from "@/lib/payments/mercado-pago";

/**
 * Notificações do Mercado Pago (tipo "payment"). Confere a assinatura, busca o pagamento na API
 * (nunca confia no corpo da notificação) e aplica ao pedido de forma idempotente.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const body = (await req.json().catch(() => ({}))) as { type?: string; action?: string; data?: { id?: string | number } };
  const type = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? body.type;
  const dataId = url.searchParams.get("data.id") ?? (body.data?.id != null ? String(body.data.id) : null);

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] MERCADOPAGO_WEBHOOK_SECRET não configurado — notificação ignorada");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  const ok = verifyMercadoPagoSignature({
    xSignature: req.headers.get("x-signature"),
    xRequestId: req.headers.get("x-request-id"),
    dataId,
    secret,
  });
  if (!ok) return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  if (type !== "payment" || !dataId) return NextResponse.json({ ignored: true });

  try {
    const payment = await getPaymentProvider().getPayment(dataId);
    const order = payment.externalReference
      ? await prisma.order.findUnique({ where: { id: payment.externalReference } })
      : await prisma.order.findUnique({ where: { paymentId: payment.id } });
    if (!order) return NextResponse.json({ ignored: true, reason: "order not found" });
    await applyPaymentUpdate(order.id, payment);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[webhook] erro ao processar:", e);
    return NextResponse.json({ error: "retry" }, { status: 500 }); // o Mercado Pago tenta de novo
  }
}
