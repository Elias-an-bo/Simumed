import { describe, expect, it } from "vitest";
import { sellability } from "@/lib/catalog/sellability";

const settings = { quoteThresholdCents: 1_000_000 };
const p = (over: Partial<{ priceCents: number; quoteOnly: boolean; active: boolean }> = {}) => ({
  priceCents: 150_090,
  quoteOnly: false,
  active: true,
  ...over,
});

describe("sellability", () => {
  it("produto normal pode ser comprado", () => {
    expect(sellability(p(), settings)).toEqual({ mode: "buy" });
  });
  it("sem preço vira orçamento", () => {
    expect(sellability(p({ priceCents: 0 }), settings)).toEqual({ mode: "quote", reason: "no-price" });
  });
  it("marcado manualmente vira orçamento", () => {
    expect(sellability(p({ quoteOnly: true }), settings)).toEqual({ mode: "quote", reason: "manual" });
  });
  it("acima do limite vira orçamento", () => {
    expect(sellability(p({ priceCents: 1_000_000 }), settings)).toEqual({ mode: "quote", reason: "price-threshold" });
    expect(sellability(p({ priceCents: 999_990 }), settings)).toEqual({ mode: "buy" });
  });
  it("inativo não é vendável", () => {
    expect(sellability(p({ active: false }), settings)).toEqual({ mode: "unavailable" });
  });
});
