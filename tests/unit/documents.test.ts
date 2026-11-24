import { describe, expect, it } from "vitest";
import { formatDocument, isValidCNPJ, isValidCPF, onlyDigits } from "@/lib/documents";

describe("documentos", () => {
  it("onlyDigits remove máscara", () => {
    expect(onlyDigits(" 529.982.247-25 ")).toBe("52998224725");
  });
  it("valida CPF", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
    expect(isValidCPF("529.982.247-24")).toBe(false);
    expect(isValidCPF("111.111.111-11")).toBe(false);
    expect(isValidCPF("123")).toBe(false);
  });
  it("valida CNPJ", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
    expect(isValidCNPJ("11.222.333/0001-80")).toBe(false);
    expect(isValidCNPJ("00.000.000/0000-00")).toBe(false);
  });
  it("formata CPF e CNPJ", () => {
    expect(formatDocument("52998224725")).toBe("529.982.247-25");
    expect(formatDocument("11222333000181")).toBe("11.222.333/0001-81");
  });
});
