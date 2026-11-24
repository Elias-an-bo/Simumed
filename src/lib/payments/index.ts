import { FakePaymentProvider } from "./fake";
import { MercadoPagoProvider } from "./mercado-pago";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  if (process.env.PAYMENT_PROVIDER === "mercadopago") {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
    const site = process.env.SITE_URL;
    const notify = site && site.startsWith("https://") ? `${site}/api/webhooks/mercadopago` : null;
    return new MercadoPagoProvider(token, notify);
  }
  return new FakePaymentProvider();
}

export const MP_CARD_STATUS_MESSAGE: Record<string, string> = {
  cc_rejected_insufficient_amount: "Saldo ou limite insuficiente.",
  cc_rejected_bad_filled_security_code: "Código de segurança incorreto.",
  cc_rejected_bad_filled_date: "Data de validade incorreta.",
  cc_rejected_bad_filled_other: "Confira os dados do cartão.",
  cc_rejected_call_for_authorize: "O banco pediu autorização. Ligue para o seu banco e tente de novo.",
  cc_rejected_card_disabled: "Cartão desativado. Ative com o seu banco ou use outro cartão.",
  cc_rejected_duplicated_payment: "Pagamento duplicado. Se precisar, use outro cartão.",
  cc_rejected_high_risk: "Pagamento recusado por segurança. Tente Pix ou boleto.",
  cc_rejected_max_attempts: "Muitas tentativas. Use outro cartão ou forma de pagamento.",
};
