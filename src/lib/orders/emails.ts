import { sendEmail, storeNotifyAddress } from "@/lib/email/send";
import { button, escapeHtml, layout, money, p, siteUrl, table } from "@/lib/email/templates";
import { getSettings } from "@/lib/settings";

type OrderForEmail = {
  id: string;
  number: number;
  accessToken: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  shippingName: string;
  shippingDays: number;
  paymentMethod: "PIX" | "CARD" | "BOLETO";
  boletoUrl: string | null;
  trackingCode?: string | null;
  items: { name: string; quantity: number; unitPriceCents: number }[];
};

const orderUrl = (o: OrderForEmail) => `${siteUrl()}/pedido/${o.id}?t=${o.accessToken}`;

function itemsTable(o: OrderForEmail) {
  return table([
    ...o.items.map((i) => [`${i.quantity} × ${i.name}`, money(i.unitPriceCents * i.quantity)] as [string, string]),
    ...(o.discountCents ? ([["Desconto Pix", `− ${money(o.discountCents)}`]] as [string, string][]) : []),
    ["Frete", `${money(o.shippingCents)} <span style="color:#5a6b80">(${escapeHtml(o.shippingName)}, até ${o.shippingDays} dias úteis)</span>`],
    ["Total", `<strong>${money(o.totalCents)}</strong>`],
  ]);
}

export async function sendOrderReceived(o: OrderForEmail) {
  const how =
    o.paymentMethod === "PIX"
      ? p("Para concluir, pague o Pix pela página do pedido. A confirmação é automática.")
      : o.paymentMethod === "BOLETO"
        ? p(`Para concluir, pague o boleto até o vencimento. ${o.boletoUrl ? `<a href="${o.boletoUrl}" style="color:#0b7a72">Abrir boleto</a>.` : ""} A compensação leva até 3 dias úteis.`)
        : p("Estamos aguardando a confirmação do pagamento.");
  await sendEmail({
    to: o.customerEmail,
    subject: `Pedido nº ${o.number} recebido — Simumed`,
    html: layout(`Recebemos seu pedido nº ${o.number}`, [p(`Olá, ${escapeHtml(o.customerName.split(" ")[0])}!`), how, itemsTable(o), button(orderUrl(o), "Ver pedido")].join("")),
  });
}

export async function sendPaymentApproved(o: OrderForEmail) {
  await sendEmail({
    to: o.customerEmail,
    subject: `Pagamento aprovado — pedido nº ${o.number}`,
    html: layout(`Pagamento aprovado!`, [
      p(`Olá, ${escapeHtml(o.customerName.split(" ")[0])}! O pagamento do pedido nº ${o.number} foi aprovado e já estamos preparando o envio.`),
      itemsTable(o),
      p("Você receberá o código de rastreamento por e-mail assim que o pedido for despachado."),
      button(orderUrl(o), "Acompanhar pedido"),
    ].join("")),
  });
  const s = await getSettings();
  const notify = storeNotifyAddress(s.email);
  if (notify) {
    await sendEmail({
      to: notify,
      subject: `[Venda] Pedido nº ${o.number} pago — ${money(o.totalCents).replace(/&nbsp;/g, " ")}`,
      html: layout(`Pedido nº ${o.number} pago`, [itemsTable(o), p(`<a href="${siteUrl()}/admin/pedidos/${o.id}" style="color:#0b7a72">Abrir no painel</a>`)].join("")),
    });
  }
}

export async function sendOrderShipped(o: OrderForEmail) {
  await sendEmail({
    to: o.customerEmail,
    subject: `Pedido nº ${o.number} enviado`,
    html: layout(`Seu pedido foi enviado`, [
      p(`O pedido nº ${o.number} saiu para entrega com ${escapeHtml(o.shippingName)}.`),
      o.trackingCode ? p(`Código de rastreamento: <strong>${escapeHtml(o.trackingCode)}</strong>`) : "",
      button(orderUrl(o), "Acompanhar pedido"),
    ].join("")),
  });
}
