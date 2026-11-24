import Link from "next/link";
import { Suspense } from "react";
import type { CategoryNode, PublicProduct } from "@/lib/catalog/queries";
import type { StoreSettings } from "@/lib/settings";
import { ProductGrid } from "./ProductCard";
import { SortSelect } from "./SortSelect";

const AVAIL = [
  { value: "", label: "Todos" },
  { value: "pronta-entrega", label: "Pronta entrega" },
  { value: "sob-encomenda", label: "Sob encomenda" },
];

export function availabilityFromParam(v?: string) {
  return v === "pronta-entrega" ? ("IN_STOCK" as const) : v === "sob-encomenda" ? ("ON_ORDER" as const) : undefined;
}

export function CatalogView({
  basePath,
  params,
  tree,
  activeSlug,
  items,
  total,
  page,
  pages,
  settings,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  tree: CategoryNode[];
  activeSlug?: string;
  items: PublicProduct[];
  total: number;
  page: number;
  pages: number;
  settings: StoreSettings;
}) {
  const href = (over: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...over })) if (v) sp.set(k, v);
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block" aria-label="Categorias">
        <h2 className="mb-3 font-[family-name:var(--font-sans)] text-sm font-semibold uppercase tracking-[0.08em] text-muted">Categorias</h2>
        <ul className="space-y-1 text-[15px]">
          <li>
            <Link href="/produtos" className={`block rounded-lg px-3 py-1.5 ${!activeSlug ? "bg-brand-soft font-semibold text-brand" : "hover:bg-surface"}`}>
              Todos os produtos
            </Link>
          </li>
          {tree.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/categoria/${c.slug}`}
                className={`flex justify-between rounded-lg px-3 py-1.5 ${activeSlug === c.slug ? "bg-brand-soft font-semibold text-brand" : "font-medium text-ink hover:bg-surface"}`}
              >
                {c.name} <span className="num text-xs text-muted">{c.count}</span>
              </Link>
              {c.children.length > 0 && (activeSlug === c.slug || c.children.some((ch) => ch.slug === activeSlug)) && (
                <ul className="my-1 ml-3 border-l border-line pl-2">
                  {c.children.map((ch) => (
                    <li key={ch.slug}>
                      <Link
                        href={`/categoria/${ch.slug}`}
                        className={`flex justify-between rounded-lg px-3 py-1 text-[14px] ${activeSlug === ch.slug ? "font-semibold text-brand" : "text-text hover:text-brand"}`}
                      >
                        {ch.name} <span className="num text-xs text-muted">{ch.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </aside>
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {AVAIL.map((a) => {
              const active = (params.disponibilidade ?? "") === a.value;
              return (
                <Link
                  key={a.value}
                  href={href({ disponibilidade: a.value || undefined, pagina: undefined })}
                  className={`badge border px-3 py-1.5 text-[13px] ${active ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-text hover:border-brand"}`}
                  aria-current={active ? "true" : undefined}
                >
                  {a.label}
                </Link>
              );
            })}
            <span className="num ml-1 text-sm text-muted">
              {total} {total === 1 ? "produto" : "produtos"}
            </span>
          </div>
          <Suspense>
            <SortSelect value={params.ordem ?? "relevancia"} />
          </Suspense>
        </div>
        {items.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-lg font-semibold text-ink">Nenhum produto encontrado.</p>
            <p className="mt-2 text-muted">
              Tente outra palavra ou <Link href="/orcamento" className="text-brand underline">peça um orçamento</Link> — buscamos o
              item para você.
            </p>
          </div>
        ) : (
          <ProductGrid products={items} settings={settings} />
        )}
        {pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Páginas">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={href({ pagina: n === 1 ? undefined : String(n) })}
                aria-current={n === page ? "page" : undefined}
                className={`num flex size-10 items-center justify-center rounded-lg border text-sm font-semibold ${n === page ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"}`}
              >
                {n}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
