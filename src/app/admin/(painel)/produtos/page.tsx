import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminTitle, Tabs } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";

const FILTERS: Record<string, { label: string; where: Prisma.ProductWhereInput }> = {
  todos: { label: "Todos", where: {} },
  "sem-foto": { label: "Sem foto", where: { images: { none: {} } } },
  orcamento: { label: "Só orçamento", where: { OR: [{ quoteOnly: true }, { priceCents: 0 }] } },
  "frete-consulta": { label: "Frete sob consulta", where: { freightOnRequest: true } },
  "medidas-estimadas": { label: "Medidas estimadas", where: { dimsEstimated: true } },
  inativos: { label: "Inativos", where: { active: false } },
};

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; filtro?: string; pagina?: string }> }) {
  const { q, filtro, pagina } = await searchParams;
  const f = filtro && FILTERS[filtro] ? filtro : "todos";
  const page = Math.max(1, Number(pagina) || 1);
  const where: Prisma.ProductWhereInput = {
    ...FILTERS[f].where,
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { supplierCode: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { sku: "asc" },
      skip: (page - 1) * 50,
      take: 50,
      include: { category: true, images: { take: 1, orderBy: { position: "asc" } } },
    }),
    prisma.product.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / 50));
  const link = (extra: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(Object.entries({ q, filtro: f === "todos" ? undefined : f, ...extra }).filter(([, v]) => v) as [string, string][]);
    return `/admin/produtos${sp.size ? `?${sp}` : ""}`;
  };
  return (
    <>
      <AdminTitle title={`Produtos (${total})`}>
        <div className="flex w-full gap-2 sm:w-auto">
          <form className="flex-1 sm:w-72">
            {f !== "todos" && <input type="hidden" name="filtro" value={f} />}
            <input name="q" defaultValue={q} placeholder="Nome, SKU ou código do fornecedor" className="field h-10 min-h-0" aria-label="Buscar produtos" />
          </form>
          <Link href="/admin/produtos/importar" className="btn btn-secondary h-10 min-h-0">Importar custos</Link>
          <Link href="/admin/produtos/novo" className="btn btn-primary h-10 min-h-0"><Plus className="size-4" aria-hidden /> Novo</Link>
        </div>
      </AdminTitle>
      <Tabs active={f} items={Object.entries(FILTERS).map(([k, v]) => ({ key: k, label: v.label, href: link({ filtro: k === "todos" ? undefined : k, pagina: undefined }) }))} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-4 py-3">Foto</th><th className="px-4 py-3">Produto</th><th className="px-4 py-3">SKU / fornecedor</th><th className="px-4 py-3 text-right">Custo</th><th className="px-4 py-3 text-right">Preço</th><th className="px-4 py-3">Situação</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-surface">
                <td className="px-4 py-2">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0].url} alt="" className="size-12 rounded-lg border border-line bg-white object-contain" />
                  ) : (
                    <span className="flex size-12 items-center justify-center rounded-lg bg-warn-soft text-[10px] font-semibold text-warn">sem foto</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <Link href={`/admin/produtos/${p.id}`} className="font-medium text-ink hover:text-brand">{p.name}</Link>
                  <span className="block text-xs text-muted">{p.category.name}</span>
                </td>
                <td className="px-4 py-2 text-xs"><span className="font-semibold">{p.sku}</span><span className="block text-muted">{p.supplierCode ?? "—"}</span></td>
                <td className="num px-4 py-2 text-right text-muted">{p.costCents ? formatBRL(p.costCents) : "—"}</td>
                <td className="num px-4 py-2 text-right font-semibold">{p.priceCents ? formatBRL(p.priceCents) : "—"}</td>
                <td className="px-4 py-2 text-xs">
                  {!p.active && <span className="badge bg-surface text-muted">inativo</span>}
                  {p.quoteOnly && <span className="badge bg-brand-soft text-brand">orçamento</span>}
                  {p.freightOnRequest && <span className="badge bg-warn-soft text-warn">frete consulta</span>}
                  {p.dimsEstimated && <span className="badge bg-warn-soft text-warn">medidas estimadas</span>}
                  {p.featured && <span className="badge bg-success-soft text-success">destaque</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav className="mt-5 flex flex-wrap gap-2" aria-label="Páginas">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={link({ pagina: n === 1 ? undefined : String(n) })} className={`num flex size-9 items-center justify-center rounded-lg border text-sm ${n === page ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>{n}</Link>
          ))}
        </nav>
      )}
    </>
  );
}
