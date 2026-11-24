import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { applyPaymentUpdate } from "@/lib/orders/apply-payment";
import { CheckoutError, createCheckout, startPayment } from "@/lib/orders/checkout";
import { checkoutSchema } from "@/lib/orders/checkout-schema";
import { fakeQuote } from "@/lib/shipping/fake";

vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T,>(fn: T) => fn }));

let ids: { a: string; b: string; quote: string };

async function reset() {
  await prisma.orderEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.settings.create({ data: { id: "default", pixDiscountPercent: 5, maxInstallments: 10, originCep: "06720050", handlingDays: 2 } });
  const cat = await prisma.category.create({ data: { slug: "simuladores", name: "Simuladores" } });
  const base = { categoryId: cat.id, weightKg: 2, lengthCm: 30, widthCm: 20, heightCm: 10 };
  const a = await prisma.product.create({ data: { ...base, sku: "SM-T1", slug: "t1", name: "Produto A", priceCents: 100_090 } });
  const b = await prisma.product.create({ data: { ...base, sku: "SM-T2", slug: "t2", name: "Produto B", priceCents: 50_090 } });
  const q = await prisma.product.create({ data: { ...base, sku: "SM-T3", slug: "t3", name: "Produto C", priceCents: 50_090, quoteOnly: true } });
  ids = { a: a.id, b: b.id, quote: q.id };
}

function input(over: Record<string, unknown> = {}) {
  return checkoutSchema.parse({
    customer: { name: "Maria Souza", email: "maria@exemplo.com", phone: "(11) 98765-4321", document: "529.982.247-25" },
    address: { cep: "01310-100", street: "Av. Paulista", number: "1000", district: "Bela Vista", city: "São Paulo", state: "sp" },
    items: [
      { productId: ids.a, quantity: 2 },
      { productId: ids.b, quantity: 1 },
    ],
    shippingOptionId: "fake-economico",
    method: "PIX",
    ...over,
  });
}

describe("checkout (Postgres de teste + provedores fake)", () => {
  beforeEach(reset);

  it("Pix: total = subtotal − desconto Pix + frete, pedido aguardando com QR", async () => {
    const r = await createCheckout(input());
    const order = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId }, include: { items: true } });
    const subtotal = 2 * 100_090 + 50_090;
    const discount = subtotal - Math.floor((subtotal * 95) / 100);
    const freight = fakeQuote("01310100", [
      { id: ids.a, weightKg: 2, lengthCm: 30, widthCm: 20, heightCm: 10, insuranceCents: 100_090, quantity: 2 },
      { id: ids.b, weightKg: 2, lengthCm: 30, widthCm: 20, heightCm: 10, insuranceCents: 50_090, quantity: 1 },
    ], 2)[0].priceCents;
    expect(order.subtotalCents).toBe(subtotal);
    expect(order.discountCents).toBe(discount);
    expect(order.shippingCents).toBe(freight);
    expect(order.totalCents).toBe(subtotal - discount + freight);
    expect(order.status).toBe("PENDING_PAYMENT");
    expect(order.pixQrCode).toBeTruthy();
    expect(order.items).toHaveLength(2);
    expect(order.state).toBe("SP");
  });

  it("notificação de pagamento aprovado repetida conta uma vez só", async () => {
    const r = await createCheckout(input());
    const order = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
    const first = await applyPaymentUpdate(order.id, { id: order.paymentId!, status: "approved" });
    const second = await applyPaymentUpdate(order.id, { id: order.paymentId!, status: "approved" });
    expect(first).toMatchObject({ changed: true, status: "PAID" });
    expect(second.changed).toBe(false);
    const events = await prisma.orderEvent.count({ where: { orderId: order.id, type: "payment" } });
    expect(events).toBe(1);
    const after = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.status).toBe("PAID");
    expect(after.paidAt).toBeTruthy();
  });

  it("pedido pago não volta para pendente com notificação atrasada", async () => {
    const r = await createCheckout(input());
    const o = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
    await applyPaymentUpdate(o.id, { id: o.paymentId!, status: "approved" });
    await applyPaymentUpdate(o.id, { id: o.paymentId!, status: "pending" });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("PAID");
  });

  it("carrinho com item que virou orçamento é recusado", async () => {
    await expect(createCheckout(input({ items: [{ productId: ids.quote, quantity: 1 }] }))).rejects.toMatchObject({ code: "cart-changed" });
    expect(await prisma.order.count()).toBe(0);
  });

  it("opção de frete inexistente é recusada", async () => {
    await expect(createCheckout(input({ shippingOptionId: "nao-existe" }))).rejects.toBeInstanceOf(CheckoutError);
    expect(await prisma.order.count()).toBe(0);
  });

  it("cartão recusado deixa o pedido aguardando e permite pagar com Pix (com desconto)", async () => {
    const r = await createCheckout(input({ method: "CARD", card: { token: "recusar", installments: 3, paymentMethodId: "visa" } }));
    expect(r.paymentStatus).toBe("rejected");
    expect(r.paymentMessage).toBeTruthy();
    let o = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
    expect(o.discountCents).toBe(0);
    const retry = await startPayment(o.id, "PIX");
    o = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
    expect(retry.paymentStatus).toBe("pending");
    expect(o.paymentMethod).toBe("PIX");
    expect(o.discountCents).toBeGreaterThan(0);
    expect(o.totalCents).toBe(o.subtotalCents - o.discountCents + o.shippingCents);
  });

  it("cartão aprovado marca o pedido como pago na hora", async () => {
    const r = await createCheckout(input({ method: "CARD", card: { token: "ok", installments: 2, paymentMethodId: "visa" } }));
    expect(r.status).toBe("PAID");
  });

  it("parcelamento acima do permitido é recusado", async () => {
    await expect(createCheckout(input({ method: "CARD", card: { token: "ok", installments: 12, paymentMethodId: "visa" } }))).rejects.toMatchObject({ code: "invalid-installments" });
  });
});
