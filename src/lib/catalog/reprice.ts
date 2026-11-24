import { prisma } from "@/lib/db";
import { priceFromCost } from "@/lib/pricing";
import { effectiveMarkup } from "./markup";

/** Recalcula o preço de venda (custo × markup efetivo). Retorna quantos produtos mudaram. */
export async function recomputePrices(where: { id?: string; categoryIds?: string[] } = {}): Promise<number> {
  const settings = await prisma.settings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  const products = await prisma.product.findMany({
    where: {
      ...(where.id ? { id: where.id } : {}),
      ...(where.categoryIds ? { OR: [{ categoryId: { in: where.categoryIds } }, { category: { parentId: { in: where.categoryIds } } }] } : {}),
    },
    select: {
      id: true, costCents: true, priceCents: true, markupPercent: true,
      category: { select: { markupPercent: true, parent: { select: { markupPercent: true } } } },
    },
  });
  let changed = 0;
  for (const p of products) {
    const markup = effectiveMarkup({
      product: p.markupPercent,
      category: p.category.markupPercent,
      parent: p.category.parent?.markupPercent,
      store: settings.defaultMarkupPercent,
    });
    const price = priceFromCost(p.costCents, markup);
    if (price !== p.priceCents) {
      await prisma.product.update({ where: { id: p.id }, data: { priceCents: price } });
      changed++;
    }
  }
  return changed;
}
