import { notFound } from "next/navigation";
import { AdminTitle, Notice, OrderStatusBadge, fmtDate } from "@/components/admin/ui";
import { formatCep } from "@/lib/cep";
import { prisma } from "@/lib/db";
import { formatDocument } from "@/lib/documents";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_LABEL, type OrderStatusValue } from "@/lib/orders/status";
import { addOrderNoteAction, updateOrderStatusAction } from "../../../actions";

const NEXT: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING_PAYMENT: ["CANCELED"],
  PAID: ["PREPARING", "SHIPPED", "CANCELED"],
  PREPARING: ["SHIPPED", "CANCELED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELED: [],
};
const ERR: Record<string, string> = { status: "Mudança de status não permitida.", rastreio: "Informe o código de rastreamento para marcar como enviado." };

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const o = await prisma.order.findUnique({ where: { id }, include: { items: true, events: { orderBy: { createdAt: "desc" } } } });
  if (!o) notFound();
  const site = process.env.SITE_URL ?? "";
  const phone = o.customerPhone.replace(/\D/g, "");
  return (
    <>
      <AdminTitle title={`Pedido #${o.number}`} back={{ href: "/admin/pedidos", label: "Pedidos" }}>
        <OrderStatusBadge status={o.status} />
      </AdminTitle>
      {sp.ok && <Notice>Pedido atualizado.</Notice>}
      {sp.erro && <Notice kind="error">{ERR[sp.erro] ?? "Não foi possível atualizar."}</Notice>}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="text-lg font-bold">Itens</h2>
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-line">
                {o.items.map((i) => (
                  <tr key={i.id}>
                    <td className="num py-2 pr-3 font-semibold">{i.quantity}×</td>
                    <td className="py-2">{i.name} <span className="text-xs text-muted">({i.sku})</span></td>
                    <td className="num py-2 text-right">{formatBRL(i.unitPriceCents * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="num mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatBRL(o.subtotalCents)}</dd></div>
              {o.discountCents > 0 && <div className="flex justify-between"><dt className="text-muted">Desconto Pix</dt><dd>− {formatBRL(o.discountCents)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Frete ({o.shippingName} · {o.shippingCompany} · {o.shippingDays} d.u.)</dt><dd>{formatBRL(o.shippingCents)}</dd></div>
              <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{formatBRL(o.totalCents)}</dd></div>
            </dl>
          </section>
          <section className="card grid gap-6 p-5 sm:grid-cols-2">
            <div>
              <h2 className="text-lg font-bold">Cliente</h2>
              <p className="mt-2 text-sm leading-relaxed">
                {o.customerName}
                {o.companyName && <><br />{o.companyName}</>}
                <br />{o.customerDocument.length === 14 ? "CNPJ" : "CPF"} {formatDocument(o.customerDocument)}
                {o.stateRegistration && <><br />IE {o.stateRegistration}</>}
                <br /><a className="text-brand" href={`mailto:${o.customerEmail}`}>{o.customerEmail}</a>
                <br /><a className="text-brand" href={`https://wa.me/55${phone}`} target="_blank" rel="noopener">{o.customerPhone}</a>
              </p>
            </div>
            <div>
              <h2 className="text-lg font-bold">Entrega</h2>
              <p className="mt-2 select-all text-sm leading-relaxed">
                {o.street}, {o.streetNumber}{o.complement ? ` — ${o.complement}` : ""}
                <br />{o.district}
                <br />{o.city}/{o.state}
                <br />CEP {formatCep(o.cep)}
              </p>
              <p className="mt-2 text-xs text-muted">Gere a etiqueta no painel do Melhor Envio com estes dados e o serviço “{o.shippingName}”.</p>
            </div>
          </section>
          <section className="card p-5">
            <h2 className="text-lg font-bold">Histórico</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {o.events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="shrink-0 text-xs text-muted">{fmtDate(e.createdAt)}</span>
                  <span>{e.message}</span>
                </li>
              ))}
            </ol>
            <form action={addOrderNoteAction.bind(null, o.id)} className="mt-4 flex gap-2">
              <input name="note" className="field h-10 min-h-0" placeholder="Adicionar anotação interna" aria-label="Anotação" />
              <button className="btn btn-secondary h-10 min-h-0" type="submit">Salvar</button>
            </form>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="card p-5 text-sm">
            <h2 className="text-lg font-bold">Pagamento</h2>
            <p className="mt-2">{o.paymentMethod === "PIX" ? "Pix" : o.paymentMethod === "CARD" ? `Cartão ${o.installments}×` : "Boleto"} · {o.paymentProvider}</p>
            <p className="text-muted">Situação: {o.paymentStatus ?? "—"}{o.paidAt ? ` · pago em ${fmtDate(o.paidAt)}` : ""}</p>
            {o.paymentId && <p className="text-xs text-muted">ID {o.paymentId}</p>}
            <p className="mt-2 text-xs text-muted">Criado em {fmtDate(o.createdAt)}</p>
            <a href={`${site}/pedido/${o.id}?t=${o.accessToken}`} target="_blank" rel="noopener" className="mt-2 inline-block text-brand underline">Página do pedido (cliente)</a>
          </section>
          {NEXT[o.status].length > 0 && (
            <section className="card p-5">
              <h2 className="text-lg font-bold">Atualizar status</h2>
              <form action={updateOrderStatusAction.bind(null, o.id)} className="mt-3 grid gap-3">
                <label className="label" htmlFor="st">Novo status</label>
                <select id="st" name="status" className="field">
                  {NEXT[o.status].map((s) => (
                    <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                  ))}
                </select>
                <label className="label" htmlFor="tr">Código de rastreamento (para “Enviado”)</label>
                <input id="tr" name="trackingCode" defaultValue={o.trackingCode ?? ""} className="field" />
                <button type="submit" className="btn btn-primary">Salvar e avisar o cliente</button>
                <p className="text-xs text-muted">Ao marcar como enviado, o cliente recebe o rastreio por e-mail. Cancelamento de pedido pago exige estorno no Mercado Pago.</p>
              </form>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
