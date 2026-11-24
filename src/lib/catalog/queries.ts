import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

/** Campos que podem ir para a vitrine. Custo, markup e código do fornecedor nunca saem daqui. */
export const publicProductSelect = {
  id: true,
  sku: true,
  slug: true,
  name: true,
  shortDescription: true,
  description: true,
  priceCents: true,
  availability: true,
  leadTimeDays: true,
  weightKg: true,
  lengthCm: true,
  widthCm: true,
  heightCm: true,
  warrantyDays: true,
  quoteOnly: true,
  freightOnRequest: true,
  active: true,
  featured: true,
  updatedAt: true,
  category: { select: { slug: true, name: true, parent: { select: { slug: true, name: true } } } },
  images: { select: { url: true, alt: true }, orderBy: { position: "asc" } },
} satisfies Prisma.ProductSelect;

export type PublicProduct = Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>;

export type SortKey = "relevancia" | "menor-preco" | "maior-preco" | "nome";

export function rootCategorySlug(p: Pick<PublicProduct, "category">): string {
  return p.category.parent?.slug ?? p.category.slug;
}

export const getCategoryTree = cache(async () => {
  const parents = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { position: "asc" },
    include: {
      children: { orderBy: { name: "asc" }, include: { _count: { select: { products: { where: { active: true } } } } } },
      _count: { select: { products: { where: { active: true } } } },
    },
  });
  return parents.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    count: p._count.products + p.children.reduce((s, c) => s + c._count.products, 0),
    children: p.children.map((c) => ({ id: c.id, slug: c.slug, name: c.name, count: c._count.products })),
  }));
});

export type CategoryNode = Awaited<ReturnType<typeof getCategoryTree>>[number];

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: { parent: true, children: { orderBy: { name: "asc" } } },
  });
}

function orderFor(sort: SortKey): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "menor-preco":
      return [{ priceCents: "asc" }];
    case "maior-preco":
      return [{ priceCents: "desc" }];
    case "nome":
      return [{ name: "asc" }];
    default:
      return [{ featured: "desc" }, { availability: "asc" }, { name: "asc" }];
  }
}

export async function listProducts(opts: {
  q?: string;
  categorySlug?: string;
  availability?: "IN_STOCK" | "ON_ORDER" | "ON_REQUEST";
  sort?: SortKey;
  page?: number;
  perPage?: number;
}): Promise<{ items: PublicProduct[]; total: number; page: number; pages: number }> {
  const perPage = opts.perPage ?? 24;
  const page = Math.max(1, opts.page ?? 1);
  const where: Prisma.ProductWhereInput = { active: true };
  const q = opts.q?.trim();
  if (q) {
    const terms = q.split(/\s+/).filter(Boolean).slice(0, 6);
    where.AND = terms.map((t) => ({
      OR: [{ name: { contains: t, mode: "insensitive" } }, { sku: { equals: t.toUpperCase() } }],
    }));
  }
  if (opts.categorySlug) {
    where.OR = [{ category: { slug: opts.categorySlug } }, { category: { parent: { slug: opts.categorySlug } } }];
  }
  if (opts.availability) where.availability = opts.availability;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: publicProductSelect,
      orderBy: orderFor(opts.sort ?? "relevancia"),
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getProductBySlug(slug: string): Promise<PublicProduct | null> {
  return prisma.product.findFirst({ where: { slug, active: true }, select: publicProductSelect });
}

export async function getFeaturedProducts(take = 8): Promise<PublicProduct[]> {
  return prisma.product.findMany({
    where: { active: true, featured: true },
    select: publicProductSelect,
    orderBy: { updatedAt: "desc" },
    take,
  });
}

export async function getRelatedProducts(product: PublicProduct, take = 4): Promise<PublicProduct[]> {
  return prisma.product.findMany({
    where: { active: true, id: { not: product.id }, category: { slug: product.category.slug } },
    select: publicProductSelect,
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    take,
  });
}

export async function getAllProductSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return prisma.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } });
}
