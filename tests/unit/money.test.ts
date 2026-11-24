import { describe, expect, it } from "vitest";
import { formatBRL } from "@/lib/money";

describe("formatBRL", () => {
  it("formata centavos em reais no padrão brasileiro", () => {
    expect(formatBRL(123490)).toBe("R$ 1.234,90");
  });
  it("formata valores pequenos e zero", () => {
    expect(formatBRL(90)).toBe("R$ 0,90");
    expect(formatBRL(0)).toBe("R$ 0,00");
  });
  it("formata milhões", () => {
    expect(formatBRL(345678912)).toBe("R$ 3.456.789,12");
  });
});
