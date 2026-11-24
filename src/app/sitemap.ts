import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getAllProductSlugs } from "@/lib/catalog/queries";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  const [products, categories] = await Promise.all([
    getAllProductSlugs(),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
  ]);
  const pages = ["", "/produtos", "/orcamento", "/manutencao", "/softwares", "/sobre", "/contato", "/faq", "/entrega", "/trocas-e-devolucoes", "/garantia", "/privacidade", "/termos"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...categories.map((c) => ({ url: `${base}/categoria/${c.slug}`, lastModified: c.updatedAt, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/produtos/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
  ];
}
