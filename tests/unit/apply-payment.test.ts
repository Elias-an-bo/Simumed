import { describe, expect, it } from "vitest";
import { nextStatusFor } from "@/lib/orders/status";

describe("nextStatusFor", () => {
  it("pagamento aprovado confirma pedido pendente", () => {
    expect(nextStatusFor("PENDING_PAYMENT", "approved")).toBe("PAID");
  });
  it("pedido pago nunca volta para pendente", () => {
    expect(nextStatusFor("PAID", "pending")).toBe("PAID");
    expect(nextStatusFor("SHIPPED", "in_process")).toBe("SHIPPED");
    expect(nextStatusFor("PREPARING", "approved")).toBe("PREPARING");
  });
  it("recusado ou cancelado mantém pendente (cliente pode tentar de novo)", () => {
    expect(nextStatusFor("PENDING_PAYMENT", "rejected")).toBe("PENDING_PAYMENT");
    expect(nextStatusFor("PENDING_PAYMENT", "cancelled")).toBe("PENDING_PAYMENT");
  });
  it("estorno ou contestação cancela", () => {
    expect(nextStatusFor("PAID", "refunded")).toBe("CANCELED");
    expect(nextStatusFor("PAID", "charged_back")).toBe("CANCELED");
  });
  it("aprovação em pedido cancelado não reabre sozinho", () => {
    expect(nextStatusFor("CANCELED", "approved")).toBe("CANCELED");
  });
});
