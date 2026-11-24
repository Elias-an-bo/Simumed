import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyMercadoPagoSignature } from "@/lib/payments/mercado-pago";

const secret = "segredo-de-teste";
function sign(dataId: string, requestId: string, ts: string) {
  const v1 = createHmac("sha256", secret).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

describe("verifyMercadoPagoSignature", () => {
  it("aceita assinatura válida", () => {
    expect(verifyMercadoPagoSignature({ xSignature: sign("123456", "req-1", "1700000000"), xRequestId: "req-1", dataId: "123456", secret })).toBe(true);
  });
  it("usa o id em minúsculas quando alfanumérico", () => {
    expect(verifyMercadoPagoSignature({ xSignature: sign("abc123", "req-1", "1"), xRequestId: "req-1", dataId: "ABC123", secret })).toBe(true);
  });
  it("rejeita assinatura adulterada, segredo errado ou cabeçalho ausente", () => {
    const good = sign("123456", "req-1", "1700000000");
    expect(verifyMercadoPagoSignature({ xSignature: good, xRequestId: "req-1", dataId: "999", secret })).toBe(false);
    expect(verifyMercadoPagoSignature({ xSignature: good, xRequestId: "req-1", dataId: "123456", secret: "outro" })).toBe(false);
    expect(verifyMercadoPagoSignature({ xSignature: null, xRequestId: "req-1", dataId: "123456", secret })).toBe(false);
    expect(verifyMercadoPagoSignature({ xSignature: "lixo", xRequestId: "req-1", dataId: "123456", secret })).toBe(false);
  });
});
