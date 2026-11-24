/**
 * Carrega o catálogo no banco. Seguro para rodar de novo:
 *  - cria categorias e produtos que não existem;
 *  - em produtos existentes, só atualiza dados do fornecedor (custo, disponibilidade, prazo) e recalcula o preço;
 *    nome, descrição, fotos e ajustes feitos no painel são preservados.
 */
import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { PARENTS } from "../src/lib/catalog/category-map";
import { effectiveMarkup } from "../src/lib/catalog/markup";
import { priceFromCost } from "../src/lib/pricing";

type CatalogItem = {
  sku: string; slug: string; name: string; category: string;
  subcategory: { slug: string; name: string } | null;
  availability: "IN_STOCK" | "ON_ORDER" | "ON_REQUEST"; leadTimeDays: number | null;
  lengthCm: number; widthCm: number; heightCm: number; weightKg: number;
  dimsEstimated: boolean; freightOnRequest: boolean; warrantyDays: number; ncm: string | null;
};

async function main() {
  const settings = await prisma.settings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });

  const catalog: CatalogItem[] = JSON.parse(readFileSync("data/catalogo.json", "utf8"));
  const costsPath = "data/private/custos.json";
  const costs: Record<string, { supplierCode: string; costCents: number }> = existsSync(costsPath)
    ? JSON.parse(readFileSync(costsPath, "utf8"))
    : {};
  if (!existsSync(costsPath)) console.warn("Aviso: data/private/custos.json não encontrado — produtos entram sem preço (sob orçamento).");

  // categorias
  const catIds = new Map<string, { id: string; markup: number | null; parentMarkup: number | null }>();
  for (const p of Object.values(PARENTS)) {
    if (!catalog.some((c) => c.category === p.slug)) continue;
    const row = await prisma.category.upsert({
      where: { slug: p.slug },
      update: {},
      create: { slug: p.slug, name: p.name, description: p.description, position: p.position },
    });
    catIds.set(p.slug, { id: row.id, markup: row.markupPercent, parentMarkup: null });
  }
  let childPos = 0;
  for (const item of catalog) {
    if (!item.subcategory || catIds.has(item.subcategory.slug)) continue;
    const parent = catIds.get(item.category)!;
    const row = await prisma.category.upsert({
      where: { slug: item.subcategory.slug },
      update: {},
      create: { slug: item.subcategory.slug, name: item.subcategory.name, parentId: parent.id, position: ++childPos },
    });
    catIds.set(item.subcategory.slug, { id: row.id, markup: row.markupPercent, parentMarkup: parent.markup });
  }

  let created = 0;
  let updated = 0;
  for (const item of catalog) {
    const cat = catIds.get(item.subcategory?.slug ?? item.category)!;
    const cost = costs[item.sku];
    const existing = await prisma.product.findUnique({ where: { sku: item.sku } });
    const markup = effectiveMarkup({ product: existing?.markupPercent, category: cat.markup, parent: cat.parentMarkup, store: settings.defaultMarkupPercent });
    const costCents = cost?.costCents ?? existing?.costCents ?? 0;
    const priceCents = priceFromCost(costCents, markup);

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          costCents,
          supplierCode: cost?.supplierCode ?? existing.supplierCode,
          priceCents,
          availability: item.availability,
          leadTimeDays: item.leadTimeDays,
        },
      });
      updated++;
    } else {
      await prisma.product.create({
        data: {
          sku: item.sku, slug: item.slug, name: item.name, categoryId: cat.id,
          supplierCode: cost?.supplierCode, costCents, priceCents,
          availability: item.availability, leadTimeDays: item.leadTimeDays,
          lengthCm: item.lengthCm, widthCm: item.widthCm, heightCm: item.heightCm, weightKg: item.weightKg,
          dimsEstimated: item.dimsEstimated, freightOnRequest: item.freightOnRequest,
          warrantyDays: item.warrantyDays, ncm: item.ncm,
        },
      });
      created++;
    }
  }

  // fotos baixadas do fornecedor (data/imagens.json): só para produtos que ainda não têm foto
  const imagesPath = "data/imagens.json";
  if (existsSync(imagesPath)) {
    const manifest: Record<string, string[]> = JSON.parse(readFileSync(imagesPath, "utf8"));
    let attached = 0;
    for (const [sku, urls] of Object.entries(manifest)) {
      const product = await prisma.product.findUnique({ where: { sku }, select: { id: true, name: true, _count: { select: { images: true } } } });
      if (!product || product._count.images > 0 || urls.length === 0) continue;
      await prisma.productImage.createMany({
        data: urls.map((url, i) => ({ productId: product.id, url, alt: i === 0 ? product.name : `${product.name} — foto ${i + 1}`, position: i })),
      });
      attached++;
    }
    console.log(`Fotos: ${attached} produtos receberam fotos.`);
  }

  // primeiro usuário do painel
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const exists = await prisma.adminUser.findUnique({ where: { email } });
    if (!exists) {
      await prisma.adminUser.create({ data: { email, name: "Administrador", passwordHash: await bcrypt.hash(password, 12) } });
      console.log(`Usuário do painel criado: ${email}`);
    }
  }

  // destaques iniciais: alguns itens de cada categoria principal, com preço
  const featuredCount = await prisma.product.count({ where: { featured: true } });
  if (featuredCount === 0) {
    for (const slug of ["simuladores", "modelos-anatomicos", "microscopios"]) {
      const parent = catIds.get(slug);
      if (!parent) continue;
      const picks = await prisma.product.findMany({
        where: { priceCents: { gt: 0, lt: settings.quoteThresholdCents }, images: { some: {} }, OR: [{ categoryId: parent.id }, { category: { parentId: parent.id } }] },
        orderBy: { priceCents: "desc" },
        take: 4,
      });
      await prisma.product.updateMany({ where: { id: { in: picks.map((p) => p.id) } }, data: { featured: true } });
    }
  }

  console.log(`Catálogo: ${created} criados, ${updated} atualizados.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
