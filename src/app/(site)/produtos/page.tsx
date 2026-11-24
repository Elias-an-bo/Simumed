import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CatalogView, availabilityFromParam } from "@/components/product/CatalogView";
import { getCategoryTree, listProducts, type SortKey } from "@/lib/catalog/queries";
import { getSettings } from "@/lib/settings";

type Params = { q?: string; ordem?: string; pagina?: string; disponibilidade?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Busca: ${q}` : "Todos os produtos",
    description: "Simuladores, modelos anatômicos, microscópios, lâminas e kits para ensino em saúde.",
    alternates: { canonical: "/produtos" },
    robots: q ? { index: false } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const [tree, settings, result] = await Promise.all([
    getCategoryTree(),
    getSettings(),
    listProducts({
      q: params.q,
      sort: (params.ordem as SortKey) ?? "relevancia",
      page: Number(params.pagina) || 1,
      availability: availabilityFromParam(params.disponibilidade),
    }),
  ]);
  return (
    <div className="container-site py-8 md:py-12">
      <Breadcrumbs items={[{ href: "/", label: "Início" }, { label: params.q ? "Busca" : "Produtos" }]} />
      <h1 className="mb-8 mt-4 text-[30px] font-bold sm:text-[36px]">
        {params.q ? (
          <>
            Resultados para <span className="text-brand">“{params.q}”</span>
          </>
        ) : (
          "Todos os produtos"
        )}
      </h1>
      <CatalogView basePath="/produtos" params={params} tree={tree} {...result} settings={settings} />
    </div>
  );
}
