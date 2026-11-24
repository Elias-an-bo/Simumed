/**
 * Importa a cotação do fornecedor (PDF ou texto do pdftotext -layout).
 *
 *   npm run catalog:import -- caminho/cotacao.pdf
 *
 * Gera:
 *  - data/catalogo.json          (público: nomes, categorias, medidas — sem custo, sem código do fornecedor)
 *  - data/private/custos.json    (privado, fora do git: código do fornecedor e custo por SKU)
 *
 * SKUs já existentes são mantidos (casados pelo código do fornecedor); itens novos recebem o próximo SKU.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { categoryFor } from "../src/lib/catalog/category-map";
import { estimateMissingDims } from "../src/lib/catalog/markup";
import { parseCotacao } from "../src/lib/catalog/parse-cotacao";
import { normalizeProductName, slugify } from "../src/lib/text";

const input = process.argv[2];
if (!input) {
  console.error("Uso: npm run catalog:import -- <cotacao.pdf|cotacao.txt>");
  process.exit(1);
}

const text = input.toLowerCase().endsWith(".pdf")
  ? execFileSync("pdftotext", ["-layout", input, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
  : readFileSync(input, "utf8");

const items = parseCotacao(text);
if (items.length === 0) {
  console.error("Nenhum produto encontrado no arquivo.");
  process.exit(1);
}

const PUBLIC = "data/catalogo.json";
const PRIVATE = "data/private/custos.json";
type Costs = Record<string, { supplierCode: string; costCents: number; supplierUrl?: string | null }>;
const previousCosts: Costs = existsSync(PRIVATE) ? JSON.parse(readFileSync(PRIVATE, "utf8")) : {};
const skuBySupplier = new Map(Object.entries(previousCosts).map(([sku, v]) => [v.supplierCode, sku]));
let nextSku = Object.keys(previousCosts).reduce((max, sku) => Math.max(max, Number(sku.slice(3)) || 0), 0) + 1;

const usedSlugs = new Set<string>();
const catalog: unknown[] = [];
const costs: Costs = { ...previousCosts };
let estimated = 0;
let onRequest = 0;

for (const it of items) {
  const sku = skuBySupplier.get(it.supplierCode) ?? `SM-${String(nextSku++).padStart(4, "0")}`;
  const name = normalizeProductName(it.rawName);
  let slug = slugify(name);
  for (let n = 2; usedSlugs.has(slug); n++) slug = `${slugify(name)}-${n}`;
  usedSlugs.add(slug);
  const cat = categoryFor(it.categoryPath);
  const dims = estimateMissingDims({ ...it, costCents: it.costCents });
  if (dims.dimsEstimated) estimated++;
  if (dims.freightOnRequest) onRequest++;

  catalog.push({
    sku,
    slug,
    name,
    category: cat.parent.slug,
    subcategory: cat.child ? { slug: cat.child.slug, name: cat.child.name } : null,
    availability: it.availability,
    leadTimeDays: it.leadTimeDays,
    lengthCm: dims.lengthCm,
    widthCm: dims.widthCm,
    heightCm: dims.heightCm,
    weightKg: dims.weightKg,
    dimsEstimated: dims.dimsEstimated,
    freightOnRequest: dims.freightOnRequest,
    warrantyDays: it.warrantyDays,
    ncm: it.ncm,
  });
  costs[sku] = { supplierCode: it.supplierCode, costCents: it.costCents, supplierUrl: it.supplierUrl };
}

mkdirSync("data/private", { recursive: true });
writeFileSync(PUBLIC, JSON.stringify(catalog, null, 2) + "\n");
writeFileSync(PRIVATE, JSON.stringify(costs, null, 2) + "\n");
console.log(`${items.length} produtos importados → ${PUBLIC} (público) e ${PRIVATE} (privado).`);
console.log(`${estimated} com medidas estimadas · ${onRequest} com frete sob consulta.`);
