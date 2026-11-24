import { NextResponse } from "next/server";
import { priceCart } from "@/lib/cart/price-cart";

export async function POST(req: Request) {
  let body: { items?: { productId: string; quantity: number }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (!Array.isArray(body.items)) return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  const cart = await priceCart(body.items);
  // só dados públicos
  return NextResponse.json({
    lines: cart.lines.map(({ productId, sku, slug, name, image, unitPriceCents, quantity, totalCents, freightOnRequest }) => ({
      productId, sku, slug, name, image, unitPriceCents, quantity, totalCents, freightOnRequest,
    })),
    blocked: cart.blocked,
    subtotalCents: cart.subtotalCents,
    freightOnRequest: cart.freightOnRequest,
  });
}
