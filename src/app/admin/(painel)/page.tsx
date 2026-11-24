import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { AdminTitle, OrderStatusBadge, QuoteStatusBadge, QUOTE_TYPE_SHORT, fmtDate } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";

export default async function AdminHome() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [sales, pending, toShip, newQuotes, orders, quotes, settings, noPhoto, estimated] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalCents: true }, _count: true, where: { paidAt: { gte: monthStart }, status: { not: "CANCELED" } } }),
    prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.order.count({ where: { status: { in: ["PAID", "PREPARING"] } } }),
    prisma.quoteRequest.count({ where: { status: "NEW" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.quoteRequest.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.settings.findUnique({ where: { id: "default" } }),
    prisma.product.count({ where: { active: true, images: { none: {} } } }),
    prisma.product.count({ where: { active: true, dimsEstimated: true } }),
  ]);
  const setup = [
    !settings?.originCep && "CEP de origem dos envios (necessário para o frete)",
    !settings?.cnpj && "CNPJ e razão social (obrigatório por lei no rodapé)",
    !settings?.whatsapp && "WhatsApp de atendimento",
    !settings?.email && "E-mail de contato",
  ].filter(Boolean) as string[];

  return (
    <>
      <AdminTitle title="Resumo" />
      {setup.length > 0 && (
        <div className="mb-6 rounded-[var(--radius-card)] border border-warn/30 bg-warn-soft p-5 text-warn">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-5" aria-hidden /> Falta configurar
          </p>
          <ul className="mt-2 list-disc pl-6 text-sm">
            {setup.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <Link href="/admin/configuracoes" className="mt-3 inline-block text-sm font-semibold underline">
            Ir para configurações
          </Link>
        </div>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Vendas no mês", formatBRL(sales._sum.totalCents ?? 0), `${sales._count} pedidos pagos`, "/admin/pedidos?status=PAID"],
          ["Para enviar", String(toShip), "pagos aguardando envio", "/admin/pedidos?status=PAID"],
          ["Aguardando pagamento", String(pending), "Pix/boleto em aberto", "/admin/pedidos?status=PENDING_PAYMENT"],
          ["Orçamentos novos", String(newQuotes), "responder em até 1 dia útil", "/admin/orcamentos?status=NEW"],
        ].map(([k, v, hint, href]) => (
          <li key={k}>
            <Link href={href} className="card block p-5 hover:shadow-[var(--shadow-lift)]">
              <p className="text-sm text-muted">{k}</p>
              <p className="num mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-ink">{v}</p>
              <p className="text-xs text-muted">{hint}</p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Últimos pedidos</h2>
            <Link href="/admin/pedidos" className="text-sm text-brand">Ver todos</Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {orders.length === 0 && <li className="py-3 text-sm text-muted">Nenhum pedido ainda.</li>}
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/pedidos/${o.id}`} className="flex items-center gap-3 py-3 text-sm hover:text-brand">
                  <span className="num font-semibold">#{o.number}</span>
                  <span className="flex-1 truncate">{o.companyName ?? o.customerName}</span>
                  <span className="num">{formatBRL(o.totalCents)}</span>
                  <OrderStatusBadge status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Últimas solicitações</h2>
            <Link href="/admin/orcamentos" className="text-sm text-brand">Ver todas</Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {quotes.length === 0 && <li className="py-3 text-sm text-muted">Nenhuma solicitação ainda.</li>}
            {quotes.map((q) => (
              <li key={q.id}>
                <Link href={`/admin/orcamentos/${q.id}`} className="flex items-center gap-3 py-3 text-sm hover:text-brand">
                  <span className="num font-semibold">#{q.number}</span>
                  <span className="text-muted">{QUOTE_TYPE_SHORT[q.type]}</span>
                  <span className="flex-1 truncate">{q.institution ?? q.name}</span>
                  <span className="text-xs text-muted">{fmtDate(q.createdAt)}</span>
                  <QuoteStatusBadge status={q.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="card mt-6 p-5 text-sm">
        <h2 className="text-lg font-bold">Catálogo</h2>
        <p className="mt-2 text-muted">
          <Link href="/admin/produtos?filtro=sem-foto" className="text-brand underline">{noPhoto} produtos sem foto</Link> ·{" "}
          <Link href="/admin/produtos?filtro=medidas-estimadas" className="text-brand underline">{estimated} com medidas estimadas</Link> (confira peso e caixa para o frete sair certo)
        </p>
      </section>
    </>
  );
}
