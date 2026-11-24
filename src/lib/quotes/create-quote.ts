import { prisma } from "@/lib/db";
import { formatDocument } from "@/lib/documents";
import { sendEmail, storeNotifyAddress } from "@/lib/email/send";
import { QUOTE_TYPE_LABEL, escapeHtml, layout, p, siteUrl, table } from "@/lib/email/templates";
import { getSettings } from "@/lib/settings";
import type { QuoteInput } from "./schema";

export async function createQuote(input: QuoteInput): Promise<{ number: number }> {
  const products = input.items.length
    ? await prisma.product.findMany({
        where: { id: { in: input.items.map((i) => i.productId) }, active: true },
        select: { id: true, name: true, sku: true },
      })
    : [];
  const byId = new Map(products.map((p) => [p.id, p]));
  const items = input.items
    .filter((i) => byId.has(i.productId))
    .map((i) => ({ productId: i.productId, name: byId.get(i.productId)!.name, sku: byId.get(i.productId)!.sku, quantity: i.quantity }));

  const quote = await prisma.quoteRequest.create({
    data: {
      type: input.type,
      name: input.name,
      email: input.email,
      phone: input.phone,
      institution: input.institution,
      document: input.document,
      city: input.city,
      state: input.state?.toUpperCase(),
      message: input.message,
      equipment: input.equipment,
      brandModel: input.brandModel,
      items: { create: items },
    },
  });

  const settings = await getSettings();
  const label = QUOTE_TYPE_LABEL[input.type];
  const itemsHtml = items.length
    ? `<ul style="padding-left:18px;margin:0 0 16px">${items.map((i) => `<li style="margin:4px 0">${i.quantity} × ${escapeHtml(i.name)} <span style="color:#5a6b80">(${i.sku})</span></li>`).join("")}</ul>`
    : "";

  await sendEmail({
    to: input.email,
    subject: `Recebemos sua solicitação nº ${quote.number} — Simumed`,
    html: layout(`Recebemos sua solicitação nº ${quote.number}`, [
      p(`Olá, ${escapeHtml(input.name.split(" ")[0])}! Obrigado pelo contato.`),
      p(`Sua solicitação de <strong>${escapeHtml(label.toLowerCase())}</strong> chegou à nossa equipe e responderemos em até 1 dia útil.`),
      itemsHtml,
      p(`Se precisar complementar, é só responder este e-mail${settings.whatsapp ? ` ou chamar no WhatsApp ${escapeHtml(settings.whatsapp)}` : ""}.`),
    ].join("")),
  });

  const notify = storeNotifyAddress(settings.email);
  if (notify) {
    await sendEmail({
      to: notify,
      replyTo: input.email,
      subject: `[${label}] nº ${quote.number} — ${input.institution ?? input.name}`,
      html: layout(`${label} nº ${quote.number}`, [
        table([
          ["Nome", escapeHtml(input.name)],
          ["E-mail", escapeHtml(input.email)],
          ["Telefone", escapeHtml(input.phone)],
          ["Instituição", escapeHtml(input.institution ?? "—")],
          ["CPF/CNPJ", escapeHtml(input.document ? formatDocument(input.document) : "—")],
          ["Cidade/UF", escapeHtml([input.city, input.state].filter(Boolean).join("/") || "—")],
          ...(input.equipment ? ([["Equipamento", escapeHtml(input.equipment)]] as [string, string][]) : []),
          ...(input.brandModel ? ([["Marca/modelo", escapeHtml(input.brandModel)]] as [string, string][]) : []),
        ]),
        itemsHtml,
        input.message ? p(escapeHtml(input.message).replace(/\n/g, "<br>")) : "",
        p(`<a href="${siteUrl()}/admin/orcamentos/${quote.id}" style="color:#0b7a72">Abrir no painel</a>`),
      ].join("")),
    });
  }
  return { number: quote.number };
}
