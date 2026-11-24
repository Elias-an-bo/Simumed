/**
 * Preço de venda = custo × (1 + markup/100), arredondado para cima até terminar em ,90.
 * Custo ≤ 0 → 0 (produto sem preço vira "sob orçamento").
 */
export function priceFromCost(costCents: number, markupPercent: number): number {
  if (!Number.isFinite(costCents) || costCents <= 0) return 0;
  // arredonda a 6 casas antes do ceil para eliminar ruído de ponto flutuante (1890.0000000000002)
  const exact = Math.round(((costCents * (100 + markupPercent)) / 100) * 1e6) / 1e6;
  const raw = Math.ceil(exact);
  const base = Math.floor(raw / 100) * 100 + 90;
  return base >= raw ? base : base + 100;
}

/** Preço com desconto no Pix (arredonda para baixo). */
export function pixPrice(cents: number, discountPercent: number): number {
  if (discountPercent <= 0) return cents;
  return Math.floor((cents * (100 - discountPercent)) / 100);
}

/** Valor de cada parcela sem juros (arredonda para cima). */
export function installmentValue(cents: number, n: number): number {
  return Math.ceil(cents / Math.max(1, n));
}
