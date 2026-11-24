import { NextResponse } from "next/server";
import { priceCart } from "@/lib/cart/price-cart";
import { normalizeCep } from "@/lib/cep";
import { quoteShipping } from "@/lib/shipping";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`frete:${clientIp(req.headers)}`, 30, 60_000)) {
    return NextResponse.json({ error: "Muitas consultas seguidas. Aguarde um minuto." }, { status: 429 });
  }
  let body: { cep?: string; items?: { productId: string; quantity: number }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  const cep = normalizeCep(body.cep ?? "");
  if (!cep) return NextResponse.json({ error: "CEP inválido. Digite os 8 números." }, { status: 400 });
  if (!Array.isArray(body.items) || body.items.length === 0) return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });

  const cart = await priceCart(body.items);
  try {
    const result = await quoteShipping(cep, cart.lines);
    if (result.kind === "on-request") return NextResponse.json({ onRequest: true });
    return NextResponse.json({ options: result.options });
  } catch (e) {
    console.error("[frete] falha na cotação:", e);
    return NextResponse.json({ error: "Não foi possível calcular o frete agora. Tente de novo em instantes." }, { status: 502 });
  }
}
