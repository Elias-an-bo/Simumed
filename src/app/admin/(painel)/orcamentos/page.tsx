import Link from "next/link";
import { AdminTitle, QuoteStatusBadge, QUOTE_STATUS_LABEL, QUOTE_TYPE_SHORT, Tabs, fmtDate } from "@/components/admin/ui";
import { prisma } from "@/lib/db";

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ status?: string; tipo?: string }> }) {
  const { status, tipo } = await searchParams;
  const st = status && status in QUOTE_STATUS_LABEL ? (status as keyof typeof QUOTE_STATUS_LABEL) : undefined;
  const tp = tipo && tipo in QUOTE_TYPE_SHORT ? (tipo as keyof typeof QUOTE_TYPE_SHORT) : undefined;
  const quotes = await prisma.quoteRequest.findMany({
    where: { ...(st ? { status: st } : {}), ...(tp ? { type: tp } : {}) },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
    take: 150,
  });
  const q = (extra: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(Object.entries({ status: st, tipo: tp, ...extra }).filter(([, v]) => v) as [string, string][]);
    return `/admin/orcamentos${sp.size ? `?${sp}` : ""}`;
  };
  return (
    <>
      <AdminTitle title="Orçamentos, manutenção e contatos" />
      <Tabs active={tp ?? "all"} items={[{ key: "all", href: q({ tipo: undefined }), label: "Todos os tipos" }, ...Object.entries(QUOTE_TYPE_SHORT).map(([k, v]) => ({ key: k, href: q({ tipo: k }), label: v }))]} />
      <Tabs active={st ?? "all"} items={[{ key: "all", href: q({ status: undefined }), label: "Qualquer status" }, ...Object.entries(QUOTE_STATUS_LABEL).map(([k, v]) => ({ key: k, href: q({ status: k }), label: v }))]} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-4 py-3">Nº</th><th className="px-4 py-3">Data</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Contato</th><th className="px-4 py-3">Itens</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {quotes.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Nada por aqui.</td></tr>}
            {quotes.map((x) => (
              <tr key={x.id} className="hover:bg-surface">
                <td className="num px-4 py-3 font-semibold"><Link className="text-brand" href={`/admin/orcamentos/${x.id}`}>#{x.number}</Link></td>
                <td className="px-4 py-3 text-muted">{fmtDate(x.createdAt)}</td>
                <td className="px-4 py-3">{QUOTE_TYPE_SHORT[x.type]}</td>
                <td className="px-4 py-3"><Link href={`/admin/orcamentos/${x.id}`} className="hover:text-brand">{x.institution ?? x.name}</Link><span className="block text-xs text-muted">{x.email}</span></td>
                <td className="num px-4 py-3">{x._count.items || "—"}</td>
                <td className="px-4 py-3"><QuoteStatusBadge status={x.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
