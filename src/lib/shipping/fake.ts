import type { ShippingItem, ShippingOption, ShippingProvider } from "./types";

/** Cotação determinística para desenvolvimento e testes (sem chamar transportadora). */
export function fakeQuote(toCep: string, items: ShippingItem[], handlingDays: number): ShippingOption[] {
  const weight = items.reduce((s, i) => s + i.weightKg * i.quantity, 0);
  const far = Number(toCep.slice(0, 1)) >= 5 ? 1.4 : 1; // Nordeste/Sul/Centro-Oeste/Norte um pouco mais caro
  const base = Math.round((2200 + weight * 450) * far);
  return [
    { id: "fake-economico", name: "Econômico", company: "Transportadora Teste", priceCents: base, days: 7 + handlingDays },
    { id: "fake-expresso", name: "Expresso", company: "Transportadora Teste", priceCents: Math.round(base * 1.9), days: 3 + handlingDays },
  ];
}

export class FakeShippingProvider implements ShippingProvider {
  async quote({ toCep, items, handlingDays }: { fromCep: string; toCep: string; items: ShippingItem[]; handlingDays: number }) {
    return fakeQuote(toCep, items, handlingDays);
  }
}
