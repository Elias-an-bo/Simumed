import type { ShippingItem, ShippingOption, ShippingProvider } from "./types";

export function buildMelhorEnvioBody(fromCep: string, toCep: string, items: ShippingItem[]) {
  return {
    from: { postal_code: fromCep },
    to: { postal_code: toCep },
    products: items.map((i) => ({
      id: i.id,
      width: i.widthCm,
      height: i.heightCm,
      length: i.lengthCm,
      weight: i.weightKg,
      insurance_value: Math.round(i.insuranceCents) / 100,
      quantity: i.quantity,
    })),
    options: { receipt: false, own_hand: false },
  };
}

type MeService = {
  id?: number | string;
  name?: string;
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  custom_delivery_time?: number;
  error?: string;
  company?: { name?: string };
};

export function parseMelhorEnvioQuote(json: unknown, handlingDays: number): ShippingOption[] {
  if (!Array.isArray(json)) return [];
  const out: ShippingOption[] = [];
  for (const s of json as MeService[]) {
    if (!s || s.error || s.id === undefined) continue;
    const price = Number(s.custom_price ?? s.price);
    const days = Number(s.custom_delivery_time ?? s.delivery_time);
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(days)) continue;
    out.push({ id: String(s.id), name: s.name ?? "Entrega", company: s.company?.name ?? "", priceCents: Math.round(price * 100), days: days + handlingDays });
  }
  return out.sort((a, b) => a.priceCents - b.priceCents);
}

export class MelhorEnvioProvider implements ShippingProvider {
  private base: string;
  constructor(
    private token: string,
    env: string,
    private userAgent: string,
  ) {
    this.base = env === "production" ? "https://melhorenvio.com.br" : "https://sandbox.melhorenvio.com.br";
  }

  async quote({ fromCep, toCep, items, handlingDays }: { fromCep: string; toCep: string; items: ShippingItem[]; handlingDays: number }) {
    const res = await fetch(`${this.base}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${this.token}`,
        "user-agent": this.userAgent,
      },
      body: JSON.stringify(buildMelhorEnvioBody(fromCep, toCep, items)),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`Melhor Envio ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return parseMelhorEnvioQuote(await res.json(), handlingDays);
  }
}
