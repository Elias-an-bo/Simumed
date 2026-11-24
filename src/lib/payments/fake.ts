import { randomUUID } from "node:crypto";
import type { CardData, PaymentMethodValue, PaymentOrder, PaymentProvider, PaymentResult } from "./types";

/** 1×1 px PNG transparente (QR de mentira para desenvolvimento). */
const FAKE_QR = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";

/**
 * Pagamento de mentira para desenvolvimento/testes: Pix e boleto ficam pendentes,
 * cartão com token "recusar" é recusado e os demais aprovados.
 */
export class FakePaymentProvider implements PaymentProvider {
  name = "fake";
  async createPayment(order: PaymentOrder, method: PaymentMethodValue, card?: CardData): Promise<PaymentResult> {
    const providerId = `fake-${randomUUID()}`;
    if (method === "PIX") {
      return {
        providerId,
        status: "pending",
        pix: { qrCode: `00020126PIXDETESTE${order.number}5204000053039865802BR`, qrCodeBase64: FAKE_QR, expiresAt: new Date(Date.now() + 3600_000) },
      };
    }
    if (method === "BOLETO") return { providerId, status: "pending", boletoUrl: `https://example.com/boleto-teste/${order.number}` };
    if (card?.token === "recusar") return { providerId, status: "rejected", statusDetail: "cc_rejected_other_reason" };
    return { providerId, status: "approved", statusDetail: "accredited" };
  }
  async getPayment(id: string) {
    return { id, status: "approved", externalReference: null };
  }
}
