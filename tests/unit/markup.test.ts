import { describe, expect, it } from "vitest";
import { effectiveMarkup, estimateMissingDims } from "@/lib/catalog/markup";

describe("effectiveMarkup", () => {
  it("produto > subcategoria > categoria > padrão da loja", () => {
    expect(effectiveMarkup({ product: 50, category: 30, parent: 20, store: 40 })).toBe(50);
    expect(effectiveMarkup({ product: null, category: 30, parent: 20, store: 40 })).toBe(30);
    expect(effectiveMarkup({ product: null, category: null, parent: 20, store: 40 })).toBe(20);
    expect(effectiveMarkup({ product: null, category: null, parent: null, store: 40 })).toBe(40);
  });
});

describe("estimateMissingDims", () => {
  const base = { lengthCm: 0, widthCm: 0, heightCm: 0, weightKg: 0 };
  it("item barato sem medidas recebe caixa estimada", () => {
    expect(estimateMissingDims({ ...base, costCents: 8500 })).toEqual({
      lengthCm: 20, widthCm: 15, heightCm: 10, weightKg: 0.5, dimsEstimated: true, freightOnRequest: false,
    });
  });
  it("item caro sem medidas fica com frete sob consulta", () => {
    expect(estimateMissingDims({ ...base, costCents: 280000 })).toMatchObject({ dimsEstimated: false, freightOnRequest: true });
  });
  it("item com medidas: frete sob consulta se > 30 kg ou lado > 100 cm", () => {
    expect(estimateMissingDims({ lengthCm: 130, widthCm: 80, heightCm: 56, weightKg: 50.84, costCents: 1 })).toMatchObject({ freightOnRequest: true });
    expect(estimateMissingDims({ lengthCm: 115, widthCm: 48, heightCm: 24, weightKg: 17.77, costCents: 1 })).toMatchObject({ freightOnRequest: true });
    expect(estimateMissingDims({ lengthCm: 97, widthCm: 32, heightCm: 57, weightKg: 19.29, costCents: 1 })).toMatchObject({ freightOnRequest: false, dimsEstimated: false });
  });
});
