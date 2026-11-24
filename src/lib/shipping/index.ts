import { FakeShippingProvider } from "./fake";
import { MelhorEnvioProvider } from "./melhor-envio";
import type { ShippingItem, ShippingOption, ShippingProvider } from "./types";
import type { PricedLine } from "@/lib/cart/price-cart";
import { getSettings } from "@/lib/settings";

export type { ShippingOption } from "./types";

export function getShippingProvider(): ShippingProvider {
  if (process.env.SHIPPING_PROVIDER === "melhorenvio") {
    const token = process.env.MELHORENVIO_TOKEN;
    if (!token) throw new Error("MELHORENVIO_TOKEN não configurado");
    return new MelhorEnvioProvider(token, process.env.MELHORENVIO_ENV ?? "sandbox", process.env.MELHORENVIO_USER_AGENT ?? "Simumed Loja");
  }
  return new FakeShippingProvider();
}

export type QuoteResult = { kind: "options"; options: ShippingOption[] } | { kind: "on-request" };

/** Cota o frete das linhas já reprecificadas. Sem CEP de origem ou sem opção → frete sob consulta. */
export async function quoteShipping(toCep: string, lines: PricedLine[]): Promise<QuoteResult> {
  if (lines.length === 0 || lines.some((l) => l.freightOnRequest)) return { kind: "on-request" };
  const settings = await getSettings();
  const fromCep = settings.originCep?.replace(/\D/g, "") ?? "";
  const provider = getShippingProvider();
  if (fromCep.length !== 8 && process.env.SHIPPING_PROVIDER === "melhorenvio") {
    console.warn("[frete] CEP de origem não configurado no painel");
    return { kind: "on-request" };
  }
  const items: ShippingItem[] = lines.map((l) => ({
    id: l.productId, weightKg: l.weightKg, lengthCm: l.lengthCm, widthCm: l.widthCm, heightCm: l.heightCm,
    insuranceCents: l.unitPriceCents, quantity: l.quantity,
  }));
  const options = await provider.quote({ fromCep: fromCep || "01001000", toCep, items, handlingDays: settings.handlingDays });
  return options.length ? { kind: "options", options } : { kind: "on-request" };
}
