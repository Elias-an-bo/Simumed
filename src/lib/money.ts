/** Formata centavos como moeda brasileira: 123490 → "R$ 1.234,90". */
export function formatBRL(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const reais = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const centavos = (abs % 100).toString().padStart(2, "0");
  return `${negative ? "-" : ""}R$ ${reais},${centavos}`;
}

/** "2.728,7528" → 272875 (arredonda para o centavo mais próximo). */
export function parseBRLToCents(value: string): number {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}
