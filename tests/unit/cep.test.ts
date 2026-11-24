import { describe, expect, it } from "vitest";
import { formatCep, normalizeCep } from "@/lib/cep";

describe("cep", () => {
  it("normaliza CEP com máscara", () => {
    expect(normalizeCep("06720-050")).toBe("06720050");
    expect(normalizeCep(" 06720050 ")).toBe("06720050");
  });
  it("rejeita CEP inválido", () => {
    expect(normalizeCep("123")).toBeNull();
    expect(normalizeCep("00000000")).toBeNull();
  });
  it("formata", () => {
    expect(formatCep("06720050")).toBe("06720-050");
  });
});
