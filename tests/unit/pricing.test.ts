import { describe, expect, it } from "vitest";
import { installmentValue, pixPrice, priceFromCost } from "@/lib/pricing";

describe("priceFromCost", () => {
  it("aplica markup sobre o custo e termina em ,90", () => {
    expect(priceFromCost(114378, 40)).toBe(160190);
    expect(priceFromCost(100000, 40)).toBe(140090);
  });
  it("mantém valor exato quando já termina em ,90", () => {
    expect(priceFromCost(100000, 0.09)).toBe(100090);
  });
  it("não sobe R$ 1 por ruído de ponto flutuante", () => {
    expect(priceFromCost(1400, 35)).toBe(1890);
    expect(priceFromCost(5400, 35)).toBe(7290);
  });
  it("custo zero ou negativo resulta em zero", () => {
    expect(priceFromCost(0, 40)).toBe(0);
    expect(priceFromCost(-5, 40)).toBe(0);
  });
});

describe("pixPrice", () => {
  it("aplica desconto arredondando para baixo", () => {
    expect(pixPrice(160190, 5)).toBe(152180);
  });
  it("desconto zero mantém o preço", () => {
    expect(pixPrice(160190, 0)).toBe(160190);
  });
});

describe("installmentValue", () => {
  it("divide arredondando para cima", () => {
    expect(installmentValue(100000, 3)).toBe(33334);
  });
});
