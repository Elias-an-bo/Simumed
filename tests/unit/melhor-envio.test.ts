import { describe, expect, it } from "vitest";
import { buildMelhorEnvioBody, parseMelhorEnvioQuote } from "@/lib/shipping/melhor-envio";
import { fakeQuote } from "@/lib/shipping/fake";

const items = [{ id: "p1", weightKg: 1.5, lengthCm: 30, widthCm: 20, heightCm: 10, insuranceCents: 150_090, quantity: 2 }];

describe("Melhor Envio", () => {
  it("monta o corpo da cotação com medidas e valor segurado em reais", () => {
    expect(buildMelhorEnvioBody("06720050", "01310100", items)).toEqual({
      from: { postal_code: "06720050" },
      to: { postal_code: "01310100" },
      products: [{ id: "p1", width: 20, height: 10, length: 30, weight: 1.5, insurance_value: 1500.9, quantity: 2 }],
      options: { receipt: false, own_hand: false },
    });
  });
  it("ignora serviços com erro, usa preço/prazo personalizados e soma dias de preparo", () => {
    const json = [
      { id: 1, name: "PAC", price: "45.30", custom_price: "47.10", delivery_time: 8, custom_delivery_time: 9, company: { name: "Correios" } },
      { id: 2, name: "SEDEX", price: "89.90", delivery_time: 3, company: { name: "Correios" } },
      { id: 3, name: ".Package", error: "Dimensões excedidas", company: { name: "Jadlog" } },
    ];
    expect(parseMelhorEnvioQuote(json, 2)).toEqual([
      { id: "1", name: "PAC", company: "Correios", priceCents: 4710, days: 11 },
      { id: "2", name: "SEDEX", company: "Correios", priceCents: 8990, days: 5 },
    ]);
  });
  it("resposta inesperada vira lista vazia", () => {
    expect(parseMelhorEnvioQuote({ message: "Unauthenticated" }, 2)).toEqual([]);
  });
});

describe("frete fake (desenvolvimento)", () => {
  it("devolve duas opções determinísticas que crescem com o peso", () => {
    const a = fakeQuote("01310100", items, 2);
    const b = fakeQuote("01310100", [{ ...items[0], quantity: 4 }], 2);
    expect(a.map((o) => o.id)).toEqual(["fake-economico", "fake-expresso"]);
    expect(b[0].priceCents).toBeGreaterThan(a[0].priceCents);
    expect(a[0].days).toBeGreaterThan(a[1].days);
  });
});
