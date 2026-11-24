/**
 * Baixa as fotos dos produtos no site do fornecedor e salva em public/fotos/<SKU>/<n>.webp.
 *
 *   npm run catalog:fotos            (só produtos que ainda não têm fotos)
 *   npm run catalog:fotos -- --force (baixa de novo tudo)
 *
 * Usa os links guardados em data/private/custos.json (gerado pelo catalog:import). Itens sem link são
 * casados pelo nome com o mapa do site do fornecedor e conferidos pelo código do produto na página.
 * Gera data/imagens.json (público: lista de fotos por SKU) e data/private/fotos-relatorio.json.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { extractProductImages, pageHasCode, rankUrlsByName } from "../src/lib/catalog/supplier-images";

const FORCE = process.argv.includes("--force");
const MAX_IMAGES = 5;
const UA = "SimumedCatalogo/1.0 (importacao de fotos de distribuidor)";

type Costs = Record<string, { supplierCode: string; costCents: number; supplierUrl?: string | null }>;
type Item = { sku: string; name: string };

const catalog: Item[] = JSON.parse(readFileSync("data/catalogo.json", "utf8"));
const costs: Costs = JSON.parse(readFileSync("data/private/custos.json", "utf8"));
const manifestPath = "data/imagens.json";
const manifest: Record<string, string[]> = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
const reportPath = "data/private/fotos-relatorio.json";
const report: Record<string, unknown> = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, "utf8")) : {};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string, tries = 3): Promise<Response> {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA } });
      if (res.ok || res.status === 404 || i >= tries) return res;
    } catch (e) {
      if (i >= tries) throw e;
    }
    await sleep(800 * i);
  }
}

async function productUrlsFromSitemap(origin: string): Promise<string[]> {
  const res = await get(`${origin}/sitemap.xml`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim())
    .filter((u) => /\/produtos\/[^/]+\/[^/]+/.test(u));
}

async function main() {
  const withUrl = Object.values(costs).find((c) => c.supplierUrl)?.supplierUrl;
  if (!withUrl) throw new Error("Nenhum link de fornecedor em data/private/custos.json. Rode catalog:import antes.");
  const origin = new URL(withUrl).origin;
  const sitemapUrls = await productUrlsFromSitemap(origin);
  console.log(`${sitemapUrls.length} páginas de produto no mapa do fornecedor.`);

  const queue = catalog.filter((it) => FORCE || !(manifest[it.sku]?.length));
  let done = 0;
  let withPhotos = 0;

  async function fetchPage(url: string): Promise<string | null> {
    const res = await get(url);
    if (!res.ok) return null;
    await sleep(200);
    return res.text();
  }

  async function saveImages(sku: string, sources: string[]): Promise<string[]> {
    const dir = `public/fotos/${sku}`;
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const saved: string[] = [];
    for (const src of sources) {
      const img = await get(src);
      if (!img.ok) continue;
      const buf = Buffer.from(await img.arrayBuffer());
      const n = saved.length + 1;
      await sharp(buf)
        .rotate()
        .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .webp({ quality: 80 })
        .toFile(`${dir}/${n}.webp`);
      saved.push(`/fotos/${sku}/${n}.webp`);
      await sleep(150);
    }
    if (!saved.length) rmSync(dir, { recursive: true, force: true });
    return saved;
  }

  async function worker() {
    for (;;) {
      const it = queue.shift();
      if (!it) return;
      const cost = costs[it.sku];
      const tried: unknown[] = [];
      try {
        let found: { url: string; sources: string[]; matchedBy: string; score: number; codeConfirmed: boolean } | null = null;

        // 1) link da cotação (confiável quando ainda existe)
        if (cost?.supplierUrl) {
          const html = await fetchPage(cost.supplierUrl);
          const sources = html ? extractProductImages(html, cost.supplierUrl, MAX_IMAGES) : [];
          tried.push({ url: cost.supplierUrl, fotos: sources.length });
          const codeConfirmed = html ? pageHasCode(html, cost.supplierCode) : false;
          const slug = new URL(cost.supplierUrl).pathname.split("/").pop() ?? "";
          const namesMatch = sources.length > 0 && sources.every((u) => u.toLowerCase().includes(slug.toLowerCase()));
          if (sources.length && (codeConfirmed || namesMatch)) {
            found = { url: cost.supplierUrl, sources, matchedBy: "cotacao", score: 1, codeConfirmed };
          }
        }

        // 2) páginas de nome parecido no mapa do site, conferidas pelo código do produto
        if (!found) {
          const candidates = rankUrlsByName(it.name, sitemapUrls.filter((u) => u !== cost?.supplierUrl), 3, 0.4);
          for (const c of candidates) {
            const html = await fetchPage(c.url);
            if (!html) continue;
            const codeConfirmed = cost ? pageHasCode(html, cost.supplierCode) : false;
            const sources = extractProductImages(html, c.url, MAX_IMAGES);
            tried.push({ url: c.url, score: Number(c.score.toFixed(2)), codeConfirmed, fotos: sources.length });
            if (sources.length && (codeConfirmed || c.score >= 0.95)) {
              found = { url: c.url, sources, matchedBy: "nome", score: Number(c.score.toFixed(2)), codeConfirmed };
              break;
            }
          }
        }

        if (!found) {
          report[it.sku] = { status: "nao-encontrado", tentativas: tried };
        } else {
          const saved = await saveImages(it.sku, found.sources);
          if (saved.length) {
            manifest[it.sku] = saved;
            withPhotos++;
          }
          report[it.sku] = { status: saved.length ? "ok" : "falha-download", ...found, sources: undefined, fotos: saved.length };
        }
      } catch (e) {
        report[it.sku] = { status: "erro", erro: String(e), tentativas: tried };
      }
      done++;
      if (done % 25 === 0) console.log(`${done}/${queue.length + done}…`);
      await sleep(250);
    }
  }

  await Promise.all([worker(), worker(), worker()]);
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + "\n");
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  const missing = catalog.filter((it) => !sorted[it.sku]?.length).length;
  console.log(`Fotos baixadas para ${withPhotos} produtos nesta execução. Sem foto: ${missing}. Relatório: data/private/fotos-relatorio.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
