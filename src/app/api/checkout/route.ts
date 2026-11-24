import { NextResponse } from "next/server";
import { CheckoutError, createCheckout } from "@/lib/orders/checkout";
import { checkoutErrors, checkoutSchema } from "@/lib/orders/checkout-schema";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`checkout:${clientIp(req.headers)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas seguidas. Aguarde alguns minutos." }, { status: 429 });
  }
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Confira os campos destacados.", fields: checkoutErrors(parsed.error) }, { status: 400 });
  try {
    const result = await createCheckout(parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message, code: e.code }, { status: 409 });
    console.error("[checkout] erro inesperado:", e);
    return NextResponse.json({ error: "Não foi possível concluir o pedido agora. Tente novamente." }, { status: 500 });
  }
}
