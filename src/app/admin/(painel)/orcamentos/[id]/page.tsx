import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTitle, Notice, QuoteStatusBadge, QUOTE_STATUS_LABEL, QUOTE_TYPE_SHORT, fmtDate } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatDocument } from "@/lib/documents";
import { formatBRL } from "@/lib/money";
import { updateQuoteAction } from "../../../actions";

export default async function QuoteDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const q = await prisma.quoteRequest.findUnique({ where: { id }, include: { items: { include: { product: { select: { slug: true, priceCents: true, costCents: true } } } } } });
  if (!q) notFound();
  const phone = q.phone.replace(/\D/g, "");
  const totalPrice = q.items.reduce((s, i) => s + (i.product?.priceCents ?? 0) * i.quantity, 0);
  const totalCost = q.items.reduce((s, i) => s + (i.product?.costCents ?? 0) * i.quantity, 0);
  return (
    <>
      <AdminTitle title={`${QUOTE_TYPE_SHORT[q.type]} #${q.number}`} back={{ href: "/admin/orcamentos", label: "Orçamentos" }}>
        <QuoteStatusBadge status={q.status} />
      </AdminTitle>
      {sp.ok && <Notice>Salvo.</Notice>}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-5 text-sm leading-relaxed">
            <h2 className="text-lg font-bold">Contato</h2>
            <p className="mt-2">
              {q.name}{q.institution && <> — <strong>{q.institution}</strong></>}
              {q.document && <><br />{q.document.length === 14 ? "CNPJ" : "CPF"} {formatDocument(q.document)}</>}
              <br /><a className="text-brand" href={`mailto:${q.email}?subject=${encodeURIComponent(`Simumed — solicitação nº ${q.number}`)}`}>{q.email}</a>
              <br /><a className="text-brand" href={`https://wa.me/55${phone}?text=${encodeURIComponent(`Olá, ${q.name.split(" ")[0]}! Aqui é da Simumed, sobre a sua solicitação nº ${q.number}.`)}`} target="_blank" rel="noopener">{q.phone} (WhatsApp)</a>
              {(q.city || q.state) && <><br />{[q.city, q.state].filter(Boolean).join("/")}</>}
              <br /><span className="text-muted">Recebido em {fmtDate(q.createdAt)}</span>
            </p>
            {(q.equipment || q.brandModel) && (
              <p className="mt-3"><strong>Equipamento:</strong> {q.equipment}{q.brandModel ? ` · ${q.brandModel}` : ""}</p>
            )}
            {q.message && <p className="mt-3 whitespace-pre-wrap rounded-[var(--radius-control)] bg-surface p-3">{q.message}</p>}
          </section>
          {q.items.length > 0 && (
            <section className="card p-5">
              <h2 className="text-lg font-bold">Produtos</h2>
              <table className="mt-3 w-full text-sm">
                <thead className="text-xs uppercase text-muted"><tr><th className="py-1 text-left">Qtd</th><th className="text-left">Produto</th><th className="text-right">Preço site</th><th className="text-right">Custo</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {q.items.map((i) => (
                    <tr key={i.id}>
                      <td className="num py-2">{i.quantity}×</td>
                      <td className="py-2">{i.product ? <Link className="hover:text-brand" href={`/produtos/${i.product.slug}`} target="_blank">{i.name}</Link> : i.name} <span className="text-xs text-muted">{i.sku}</span></td>
                      <td className="num py-2 text-right">{i.product?.priceCents ? formatBRL(i.product.priceCents * i.quantity) : "—"}</td>
                      <td className="num py-2 text-right text-muted">{i.product?.costCents ? formatBRL(i.product.costCents * i.quantity) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="num mt-3 text-right text-sm">Total pelo preço do site: <strong>{formatBRL(totalPrice)}</strong> · custo {formatBRL(totalCost)}</p>
            </section>
          )}
        </div>
        <aside>
          <form action={updateQuoteAction.bind(null, q.id)} className="card grid gap-3 p-5">
            <h2 className="text-lg font-bold">Acompanhamento</h2>
            <label className="label" htmlFor="qs">Status</label>
            <select id="qs" name="status" defaultValue={q.status} className="field">
              {Object.entries(QUOTE_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <label className="label" htmlFor="qn">Anotações internas</label>
            <textarea id="qn" name="internalNote" rows={6} defaultValue={q.internalNote ?? ""} className="field" />
            <button className="btn btn-primary" type="submit">Salvar</button>
          </form>
        </aside>
      </div>
    </>
  );
}
