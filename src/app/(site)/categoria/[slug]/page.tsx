import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CatalogView, availabilityFromParam } from "@/components/product/CatalogView";
import { getCategoryBySlug, getCategoryTree, listProducts, type SortKey } from "@/lib/catalog/queries";
import { getSettings } from "@/lib/settings";

type Params = { ordem?: string; pagina?: string; disponibilidade?: string };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return {};
  const parent = cat.parent ? ` | ${cat.parent.name}` : "";
  return {
    title: `${cat.name}${parent}`,
    description: cat.description ?? `${cat.name} para ensino e treinamento em saúde. Compre online ou peça orçamento.`,
    alternates: { canonical: `/categoria/${cat.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Params>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();
  const [tree, settings, result] = await Promise.all([
    getCategoryTree(),
    getSettings(),
    listProducts({
      categorySlug: slug,
      sort: (sp.ordem as SortKey) ?? "relevancia",
      page: Number(sp.pagina) || 1,
      availability: availabilityFromParam(sp.disponibilidade),
    }),
  ]);
  const crumbs = [{ href: "/", label: "Início" }, { href: "/produtos", label: "Produtos" }];
  if (cat.parent) crumbs.push({ href: `/categoria/${cat.parent.slug}`, label: cat.parent.name });
  return (
    <div className="container-site py-8 md:py-12">
      <Breadcrumbs items={[...crumbs, { label: cat.name }]} />
      <header className="mb-8 mt-4 max-w-3xl">
        <h1 className="text-[30px] font-bold sm:text-[36px]">{cat.name}</h1>
        {cat.description && <p className="mt-2 text-[17px] text-muted">{cat.description}</p>}
        {cat.children.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2 lg:hidden">
            {cat.children.map((ch) => (
              <li key={ch.slug}>
                <a href={`/categoria/${ch.slug}`} className="badge border border-line bg-white px-3 py-1.5 text-[13px] text-text">
                  {ch.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </header>
      <CatalogView basePath={`/categoria/${slug}`} params={sp} tree={tree} activeSlug={slug} {...result} settings={settings} />
    </div>
  );
}
