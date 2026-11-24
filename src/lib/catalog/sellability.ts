export type Sellability =
  | { mode: "buy" }
  | { mode: "quote"; reason: "no-price" | "manual" | "price-threshold" }
  | { mode: "unavailable" };

export function sellability(
  product: { priceCents: number; quoteOnly: boolean; active: boolean },
  settings: { quoteThresholdCents: number },
): Sellability {
  if (!product.active) return { mode: "unavailable" };
  if (product.priceCents <= 0) return { mode: "quote", reason: "no-price" };
  if (product.quoteOnly) return { mode: "quote", reason: "manual" };
  if (product.priceCents >= settings.quoteThresholdCents) return { mode: "quote", reason: "price-threshold" };
  return { mode: "buy" };
}
