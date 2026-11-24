import { prisma } from "@/lib/db";
import { sellability } from "@/lib/catalog/sellability";
import { getSettings } from "@/lib/settings";
import { clampQty } from "./lines";

export interface CartProduct {
  id: string;
  sku: string;
  slug: string;
  name: string;
  priceCents: number;
  quoteOnly: boolean;
  active: boolean;
  freightOnRequest: boolean;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  image: string | null;
}

export interface PricedLine {
  productId: string;
  sku: string;
  slug: string;
  name: string;
  image: string | null;
  unitPriceCents: number;
  quantity: number;
  totalCents: number;
  freightOnRequest: boolean;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface BlockedLine {
  productId: string;
  name: string | null;
  slug: string | null;
  reason: "unavailable" | "quote";
}

export interface PricedCart {
  lines: PricedLine[];
  blocked: BlockedLine[];
  subtotalCents: number;
  freightOnRequest: boolean;
}

/** Reprecifica o carrinho com os dados do banco. Nunca confia no preço vindo do navegador. */
export function priceLines(
  input: { productId: string; quantity: number }[],
  products: CartProduct[],
  settings: { quoteThresholdCents: number },
): PricedCart {
  const byId = new Map(products.map((p) => [p.id, p]));
  const qty = new Map<string, number>();
  for (const l of input.slice(0, 100)) {
    if (typeof l?.productId !== "string") continue;
    const q = Math.round(Number(l.quantity));
    if (!Number.isFinite(q) || q <= 0) continue; // quantidade zero/negativa/inválida: ignora a linha
    qty.set(l.productId, (qty.get(l.productId) ?? 0) + q);
  }
  const lines: PricedLine[] = [];
  const blocked: BlockedLine[] = [];
  for (const [productId, q] of qty) {
    const p = byId.get(productId);
    const sell = p ? sellability(p, settings) : ({ mode: "unavailable" } as const);
    if (!p || sell.mode !== "buy") {
      blocked.push({ productId, name: p?.name ?? null, slug: p?.slug ?? null, reason: sell.mode === "quote" ? "quote" : "unavailable" });
      continue;
    }
    const quantity = clampQty(q);
    lines.push({
      productId, sku: p.sku, slug: p.slug, name: p.name, image: p.image, unitPriceCents: p.priceCents, quantity,
      totalCents: p.priceCents * quantity, freightOnRequest: p.freightOnRequest,
      weightKg: p.weightKg, lengthCm: p.lengthCm, widthCm: p.widthCm, heightCm: p.heightCm,
    });
  }
  return {
    lines,
    blocked,
    subtotalCents: lines.reduce((s, l) => s + l.totalCents, 0),
    freightOnRequest: lines.some((l) => l.freightOnRequest),
  };
}

export async function priceCart(input: { productId: string; quantity: number }[]): Promise<PricedCart> {
  const ids = [...new Set(input.map((l) => l?.productId).filter((id): id is string => typeof id === "string" && id.length < 64))].slice(0, 100);
  const [rows, settings] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true, sku: true, slug: true, name: true, priceCents: true, quoteOnly: true, active: true, freightOnRequest: true,
        weightKg: true, lengthCm: true, widthCm: true, heightCm: true,
        images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
      },
    }),
    getSettings(),
  ]);
  const products: CartProduct[] = rows.map(({ images, ...p }) => ({ ...p, image: images[0]?.url ?? null }));
  return priceLines(input, products, settings);
}
