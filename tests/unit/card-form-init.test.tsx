// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const calls: string[] = [];
vi.mock("@mercadopago/sdk-react", async () => {
  const React = await import("react");
  return {
    initMercadoPago: () => calls.push("init"),
    // o Brick real busca a instância do SDK num useEffect: a chave pública precisa já estar configurada
    CardPayment: () => {
      React.useEffect(() => {
        calls.push("brick-mounted");
      }, []);
      return null;
    },
  };
});

describe("CardForm (Mercado Pago)", () => {
  it("configura a chave pública antes do formulário de cartão montar", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const { CardForm } = await import("@/components/checkout/CardForm");
    const el = document.createElement("div");
    await act(async () => {
      createRoot(el).render(
        <CardForm provider="mercadopago" publicKey="TEST-123" amountCents={10000} maxInstallments={10} email="" onSubmit={async () => {}} />,
      );
    });
    expect(calls.indexOf("init")).toBeGreaterThanOrEqual(0);
    expect(calls.indexOf("init")).toBeLessThan(calls.indexOf("brick-mounted"));
  });
});
