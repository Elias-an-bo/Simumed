import { AdminTitle, Notice } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { saveCategoryMarkupsAction } from "../../actions";

export default async function CategoriesAdmin({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const [parents, settings] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { position: "asc" },
      include: { children: { orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } }, _count: { select: { products: true } } },
    }),
    prisma.settings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } }),
  ]);
  const field = (id: string, value: number | null, placeholder: string) => (
    <input name={`markup-${id}`} defaultValue={value == null ? "" : String(value)} placeholder={placeholder} inputMode="decimal" className="field num h-9 min-h-0 w-28 text-right" aria-label="Margem %" />
  );
  return (
    <>
      <AdminTitle title="Categorias e margens" />
      {ok !== undefined && <Notice>Margens salvas. {ok} preços recalculados.</Notice>}
      <p className="mb-5 max-w-2xl text-sm text-muted">
        Margem aplicada sobre o custo do fornecedor. Vazio = herda da categoria-mãe ou o padrão da loja ({settings.defaultMarkupPercent}%, em Configurações). A margem própria de um produto sempre tem prioridade.
      </p>
      <form action={saveCategoryMarkupsAction} className="card divide-y divide-line">
        {parents.map((p) => (
          <div key={p.id} className="p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-ink">{p.name}</span>
              <span className="flex items-center gap-2 text-sm">{field(p.id, p.markupPercent, `${settings.defaultMarkupPercent}`)} %</span>
            </div>
            {p.children.length > 0 && (
              <ul className="mt-2 space-y-2 border-l border-line pl-4">
                {p.children.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-4 text-sm">
                    <span>{c.name} <span className="text-xs text-muted">({c._count.products})</span></span>
                    <span className="flex items-center gap-2">{field(c.id, c.markupPercent, `${p.markupPercent ?? settings.defaultMarkupPercent}`)} %</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        <div className="flex justify-end p-4">
          <button type="submit" className="btn btn-primary">Salvar margens e recalcular preços</button>
        </div>
      </form>
    </>
  );
}
