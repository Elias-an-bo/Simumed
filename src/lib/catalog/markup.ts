export function effectiveMarkup(m: {
  product: number | null | undefined;
  category: number | null | undefined;
  parent: number | null | undefined;
  store: number;
}): number {
  return m.product ?? m.category ?? m.parent ?? m.store;
}

export const FREIGHT_MAX_WEIGHT_KG = 30;
export const FREIGHT_MAX_SIDE_CM = 100;
const CHEAP_ITEM_CENTS = 50_000;
const ESTIMATED_BOX = { lengthCm: 20, widthCm: 15, heightCm: 10, weightKg: 0.5 };

export function estimateMissingDims(p: {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  costCents: number;
}): { lengthCm: number; widthCm: number; heightCm: number; weightKg: number; dimsEstimated: boolean; freightOnRequest: boolean } {
  const missing = !(p.lengthCm > 0 && p.widthCm > 0 && p.heightCm > 0 && p.weightKg > 0);
  if (missing) {
    if (p.costCents < CHEAP_ITEM_CENTS) return { ...ESTIMATED_BOX, dimsEstimated: true, freightOnRequest: false };
    return { lengthCm: p.lengthCm, widthCm: p.widthCm, heightCm: p.heightCm, weightKg: p.weightKg, dimsEstimated: false, freightOnRequest: true };
  }
  const tooBig = p.weightKg > FREIGHT_MAX_WEIGHT_KG || Math.max(p.lengthCm, p.widthCm, p.heightCm) > FREIGHT_MAX_SIDE_CM;
  return { lengthCm: p.lengthCm, widthCm: p.widthCm, heightCm: p.heightCm, weightKg: p.weightKg, dimsEstimated: false, freightOnRequest: tooBig };
}
