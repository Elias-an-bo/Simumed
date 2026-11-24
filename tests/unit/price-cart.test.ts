import { describe, expect, it } from "vitest";
import { priceLines, type CartProduct } from "@/lib/cart/price-cart";

const settings = { quoteThresholdCents: 1_000_000 };
const prod = (id: string, over: Partial<CartProduct> = {}): CartProduct => ({
  id, sku: `SM-${id}`, slug: id, name: `Produto ${id}`, priceCents: 10_090, quoteOnly: false, active: true,
  freightOnRequest: false, weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 10, image: null, ...over,
});

describe("priceLines", () => {
  it("reprecifica com o preço do banco e soma o subtotal", () => {
    const r = priceLines([{ productId: "a", quantity: 2 }, { productId: "b", quantity: 1 }], [prod("a"), prod("b", { priceCents: 5_090 })], settings);
    expect(r.lines.map((l) => [l.productId, l.unitPriceCents, l.quantity, l.totalCents])).toEqual([["a", 10_090, 2, 20_180], ["b", 5_090, 1, 5_090]]);
    expect(r.subtotalCents).toBe(25_270);
    expect(r.blocked).toEqual([]);
  });
  it("bloqueia produto inativo, removido ou que virou orçamento", () => {
    const r = priceLines(
      [{ productId: "a", quantity: 1 }, { productId: "x", quantity: 1 }, { productId: "q", quantity: 1 }, { productId: "t", quantity: 1 }],
      [prod("a", { active: false }), prod("q", { quoteOnly: true }), prod("t", { priceCents: 1_500_000 })],
      settings,
    );
    expect(r.lines).toEqual([]);
    expect(r.blocked.map((b) => [b.productId, b.reason])).toEqual([["a", "unavailable"], ["x", "unavailable"], ["q", "quote"], ["t", "quote"]]);
    expect(r.subtotalCents).toBe(0);
  });
  it("normaliza quantidade e junta linhas repetidas", () => {
    const r = priceLines([{ productId: "a", quantity: 0 }, { productId: "a", quantity: 2.7 }, { productId: "b", quantity: 500 }], [prod("a"), prod("b")], settings);
    expect(r.lines.map((l) => [l.productId, l.quantity])).toEqual([["a", 3], ["b", 99]]);
  });
  it("sinaliza frete sob consulta se algum item exigir", () => {
    const r = priceLines([{ productId: "a", quantity: 1 }, { productId: "b", quantity: 1 }], [prod("a"), prod("b", { freightOnRequest: true })], settings);
    expect(r.freightOnRequest).toBe(true);
  });
});
