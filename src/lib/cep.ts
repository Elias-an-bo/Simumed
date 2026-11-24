import { onlyDigits } from "./documents";

/** Retorna o CEP com 8 dígitos ou null se inválido. */
export function normalizeCep(input: string): string | null {
  const d = onlyDigits(input ?? "");
  if (d.length !== 8 || /^0+$/.test(d)) return null;
  return d;
}

export function formatCep(cep: string): string {
  const d = onlyDigits(cep);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : cep;
}
