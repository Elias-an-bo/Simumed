import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { priceCart } from "@/lib/cart/price-cart";
import { getPaymentProvider, MP_CARD_STATUS_MESSAGE } from "@/lib/payments";
import type { CardData, PaymentMethodValue } from "@/lib/payments/types";
import { pixPrice } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { quoteShipping } from "@/lib/shipping";
import { applyPaymentUpdate } from "./apply-payment";
import type { CheckoutInput } from "./checkout-schema";
import { sendOrderReceived } from "./emails";

export class CheckoutError extends Error {
  constructor(
    public code: "cart-changed" | "freight-on-request" | "shipping-changed" | "invalid-installments" | "order-not-payable",
    message: string,
  ) {
    super(message);
  }
}

export interface CheckoutResult {
  orderId: string;
  accessToken: string;
  status: string;
  paymentStatus: string | null;
  paymentMessage?: string;
}

function totalsFor(method: PaymentMethodValue, subtotalCents: number, shippingCents: number, pixDiscountPercent: number) {
  const discountCents = method === "PIX" ? subtotalCents - pixPrice(subtotalCents, pixDiscountPercent) : 0;
  return { discountCents, totalCents: subtotalCents - discountCents + shippingCents };
}

export async function createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const settings = await getSettings();
  const cart = await priceCart(input.items);
  if (cart.blocked.length > 0 || cart.lines.length === 0) {
    throw new CheckoutError("cart-changed", "Alguns produtos do carrinho mudaram ou não estão mais disponíveis. Revise o carrinho.");
  }
  if (cart.freightOnRequest) throw new CheckoutError("freight-on-request", "O carrinho tem itens com frete sob consulta. Envie como orçamento.");

  const quote = await quoteShipping(input.address.cep, cart.lines);
  const option = quote.kind === "options" ? quote.options.find((o) => o.id === input.shippingOptionId) : undefined;
  if (!option) throw new CheckoutError("shipping-changed", "O valor ou a opção de frete mudou. Escolha o frete novamente.");

  if (input.method === "CARD") {
    if (!input.card) throw new CheckoutError("invalid-installments", "Preencha os dados do cartão.");
    if (input.card.installments > settings.maxInstallments) throw new CheckoutError("invalid-installments", `Parcelamento máximo: ${settings.maxInstallments}×.`);
  }

  const { discountCents, totalCents } = totalsFor(input.method, cart.subtotalCents, option.priceCents, settings.pixDiscountPercent);
  const order = await prisma.order.create({
    data: {
      accessToken: randomBytes(24).toString("hex"),
      customerName: input.customer.name,
      customerEmail: input.customer.email,
      customerPhone: input.customer.phone,
      customerDocument: input.customer.document,
      companyName: input.customer.companyName,
      stateRegistration: input.customer.stateRegistration,
      cep: input.address.cep,
      street: input.address.street,
      streetNumber: input.address.number,
      complement: input.address.complement,
      district: input.address.district,
      city: input.address.city,
      state: input.address.state,
      subtotalCents: cart.subtotalCents,
      discountCents,
      shippingCents: option.priceCents,
      totalCents,
      shippingServiceId: option.id,
      shippingName: option.name,
      shippingCompany: option.company,
      shippingDays: option.days,
      paymentMethod: input.method,
      paymentProvider: getPaymentProvider().name,
      installments: input.method === "CARD" ? input.card!.installments : 1,
      items: { create: cart.lines.map((l) => ({ productId: l.productId, sku: l.sku, name: l.name, unitPriceCents: l.unitPriceCents, quantity: l.quantity })) },
      events: { create: { type: "created", message: "Pedido criado no site" } },
    },
  });
  return startPayment(order.id, input.method, input.card);
}

/** Cria (ou recria) a cobrança de um pedido aguardando pagamento. */
export async function startPayment(orderId: string, method: PaymentMethodValue, card?: CardData): Promise<CheckoutResult> {
  const settings = await getSettings();
  let order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  if (order.status !== "PENDING_PAYMENT") throw new CheckoutError("order-not-payable", "Este pedido não está aguardando pagamento.");
  if (method === "CARD" && card && card.installments > settings.maxInstallments) {
    throw new CheckoutError("invalid-installments", `Parcelamento máximo: ${settings.maxInstallments}×.`);
  }

  const attempt = (await prisma.orderEvent.count({ where: { orderId, type: "payment-attempt" } })) + 1;
  if (order.paymentMethod !== method || attempt > 1) {
    const t = totalsFor(method, order.subtotalCents, order.shippingCents, settings.pixDiscountPercent);
    order = await prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod: method, discountCents: t.discountCents, totalCents: t.totalCents, installments: method === "CARD" && card ? card.installments : 1 },
      include: { items: true },
    });
  }
  await prisma.orderEvent.create({ data: { orderId, type: "payment-attempt", message: `Tentativa ${attempt}: ${method}` } });

  const provider = getPaymentProvider();
  let paymentMessage: string | undefined;
  try {
    const r = await provider.createPayment(order, method, card, attempt);
    order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId: r.providerId,
        paymentStatus: r.status,
        pixQrCode: r.pix?.qrCode ?? null,
        pixQrCodeBase64: r.pix?.qrCodeBase64 ?? null,
        pixExpiresAt: r.pix?.expiresAt ?? null,
        boletoUrl: r.boletoUrl ?? null,
      },
      include: { items: true },
    });
    if (r.status === "approved") {
      await applyPaymentUpdate(orderId, { id: r.providerId, status: r.status, statusDetail: r.statusDetail });
    } else if (r.status === "rejected") {
      await prisma.orderEvent.create({ data: { orderId, type: "payment", message: `Cartão recusado (${r.statusDetail ?? "sem detalhe"})` } });
      paymentMessage = MP_CARD_STATUS_MESSAGE[r.statusDetail ?? ""] ?? "Pagamento recusado. Tente outro cartão, Pix ou boleto.";
    } else {
      await sendOrderReceived(order);
    }
  } catch (e) {
    console.error("[checkout] falha ao criar pagamento:", e);
    await prisma.orderEvent.create({ data: { orderId, type: "payment", message: "Falha ao criar a cobrança no intermediador" } });
    paymentMessage = "Não conseguimos gerar a cobrança agora. Tente de novo em instantes ou escolha outra forma de pagamento.";
  }
  const fresh = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  return { orderId, accessToken: fresh.accessToken, status: fresh.status, paymentStatus: fresh.paymentStatus, paymentMessage };
}
