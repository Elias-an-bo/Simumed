import { describe, expect, it } from "vitest";
import { parseQuoteInput } from "@/lib/quotes/schema";

const valid = {
  type: "PRODUCTS",
  name: "Maria Souza",
  email: "maria@faculdade.edu.br",
  phone: "(11) 98765-4321",
  institution: "Faculdade Exemplo",
  document: "",
  message: "Gostaria de uma proposta.",
  items: JSON.stringify([{ productId: "p1", quantity: 2 }]),
  website: "",
};

describe("parseQuoteInput", () => {
  it("aceita pedido válido e normaliza telefone e itens", () => {
    const r = parseQuoteInput(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.phone).toBe("11987654321");
      expect(r.data.items).toEqual([{ productId: "p1", quantity: 2 }]);
      expect(r.data.document).toBeUndefined();
    }
  });
  it("rejeita robô (campo-isca preenchido)", () => {
    const r = parseQuoteInput({ ...valid, website: "http://spam" });
    expect(r.success).toBe(false);
  });
  it("rejeita e-mail inválido com mensagem em português", () => {
    const r = parseQuoteInput({ ...valid, email: "maria@" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors.email).toBe("Informe um e-mail válido.");
  });
  it("documento opcional, mas se vier precisa ser CPF ou CNPJ válido", () => {
    expect(parseQuoteInput({ ...valid, document: "11.222.333/0001-81" }).success).toBe(true);
    const bad = parseQuoteInput({ ...valid, document: "11.222.333/0001-80" });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(bad.errors.document).toBe("CPF ou CNPJ inválido.");
  });
  it("rejeita telefone curto", () => {
    expect(parseQuoteInput({ ...valid, phone: "1234" }).success).toBe(false);
  });
  it("manutenção exige descrição do equipamento", () => {
    const r = parseQuoteInput({ ...valid, type: "MAINTENANCE", items: "", equipment: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors.equipment).toBeDefined();
  });
  it("itens malformados são ignorados com segurança", () => {
    const r = parseQuoteInput({ ...valid, items: "não é json" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.items).toEqual([]);
  });
});
