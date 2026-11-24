import { createHmac, timingSafeEqual } from "node:crypto";
import { onlyDigits } from "@/lib/documents";
import type { CardData, PaymentMethodValue, PaymentOrder, PaymentProvider, PaymentResult } from "./types";

const API = "https://api.mercadopago.com";

/**
 * Confere a assinatura do webhook (cabeçalho x-signature "ts=...,v1=...").
 * Manifesto: id:<data.id>;request-id:<x-request-id>;ts:<ts>;  → HMAC-SHA256 com o segredo do painel do Mercado Pago.
 */
export function verifyMercadoPagoSignature(p: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
}): boolean {
  if (!p.xSignature || !p.dataId || !p.secret) return false;
  const parts = Object.fromEntries(
    p.xSignature.split(",").map((kv) => {
      const [k, ...v] = kv.split("=");
      return [k?.trim(), v.join("=").trim()];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1 || !/^[0-9a-f]+$/i.test(v1)) return false;
  const id = /^[a-z0-9]+$/i.test(p.dataId) ? p.dataId.toLowerCase() : p.dataId;
  let manifest = `id:${id};`;
  if (p.xRequestId) manifest += `request-id:${p.xRequestId};`;
  manifest += `ts:${ts};`;
  const expected = createHmac("sha256", p.secret).update(manifest).digest();
  const given = Buffer.from(v1, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  return { first_name: parts[0] ?? full, last_name: parts.slice(1).join(" ") || parts[0] || full };
}

export class MercadoPagoProvider implements PaymentProvider {
  name = "mercadopago";
  constructor(
    private accessToken: string,
    private notificationUrl: string | null,
  ) {}

  private async request(path: string, init: RequestInit & { idempotencyKey?: string } = {}) {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${this.accessToken}`,
        "content-type": "application/json",
        ...(init.idempotencyKey ? { "x-idempotency-key": init.idempotencyKey } : {}),
      },
      signal: AbortSignal.timeout(20_000),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
    return json as Record<string, any>;
  }

  async createPayment(order: PaymentOrder, method: PaymentMethodValue, card?: CardData, attempt = 1): Promise<PaymentResult> {
    const doc = onlyDigits(order.customerDocument);
    const payer: Record<string, unknown> = {
      email: order.customerEmail,
      ...splitName(order.customerName),
      identification: { type: doc.length === 14 ? "CNPJ" : "CPF", number: doc },
    };
    const body: Record<string, unknown> = {
      transaction_amount: order.totalCents / 100,
      description: `Pedido ${order.number} — Simumed`,
      external_reference: order.id,
      statement_descriptor: "SIMUMED",
      ...(this.notificationUrl ? { notification_url: this.notificationUrl } : {}),
    };
    if (method === "PIX") {
      body.payment_method_id = "pix";
      body.date_of_expiration = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    } else if (method === "BOLETO") {
      body.payment_method_id = "bolbradesco";
      body.date_of_expiration = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      payer.address = {
        zip_code: onlyDigits(order.cep),
        street_name: order.street,
        street_number: order.streetNumber,
        neighborhood: order.district,
        city: order.city,
        federal_unit: order.state,
      };
    } else {
      if (!card) throw new Error("Dados do cartão ausentes");
      body.token = card.token;
      body.installments = card.installments;
      body.payment_method_id = card.paymentMethodId;
      if (card.issuerId) body.issuer_id = card.issuerId;
    }
    body.payer = payer;

    const p = await this.request("/v1/payments", {
      method: "POST",
      body: JSON.stringify(body),
      idempotencyKey: `${order.id}-${method}-${attempt}`,
    });
    const td = p.point_of_interaction?.transaction_data;
    return {
      providerId: String(p.id),
      status: p.status,
      statusDetail: p.status_detail,
      pix: td?.qr_code
        ? { qrCode: td.qr_code, qrCodeBase64: td.qr_code_base64, expiresAt: p.date_of_expiration ? new Date(p.date_of_expiration) : null }
        : undefined,
      boletoUrl: p.transaction_details?.external_resource_url ?? undefined,
    };
  }

  async getPayment(id: string) {
    const p = await this.request(`/v1/payments/${encodeURIComponent(id)}`);
    return { id: String(p.id), status: p.status, statusDetail: p.status_detail, externalReference: p.external_reference ?? null };
  }
}
