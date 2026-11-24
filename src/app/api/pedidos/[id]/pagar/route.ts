import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderWithToken } from "@/lib/orders/access";
import { CheckoutError, startPayment } from "@/lib/orders/checkout";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  t: z.string().max(100),
  method: z.enum(["PIX", "CARD", "BOLETO"]),
  card: z
    .object({
      token: z.string().min(1).max(200),
      installments: z.number().int().min(1).max(24),
      paymentMethodId: z.string().min(1).max(40),
      issuerId: z.union([z.string(), z.number()]).optional().nullable().transform((v) => (v == null ? null : String(v))),
    })
    .optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!rateLimit(`pagar:${clientIp(req.headers)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas seguidas. Aguarde alguns minutos." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  const order = await getOrderWithToken(id, parsed.data.t);
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  if (parsed.data.method === "CARD" && !parsed.data.card) return NextResponse.json({ error: "Preencha os dados do cartão." }, { status: 400 });
  try {
    return NextResponse.json(await startPayment(order.id, parsed.data.method, parsed.data.card));
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message, code: e.code }, { status: 409 });
    console.error("[pagar] erro:", e);
    return NextResponse.json({ error: "Não foi possível gerar o pagamento agora." }, { status: 500 });
  }
}
