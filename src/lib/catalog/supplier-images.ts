import { slugify } from "@/lib/text";

function lastSegment(url: string): string {
  return new URL(url).pathname.replace(/\/+$/, "").split("/").pop() ?? "";
}

/**
 * Fotos do próprio produto numa página do fornecedor: capa primeiro, depois galeria, sem repetir.
 * Usa as imagens da galeria principal (sem a classe "card__image", que marca produtos relacionados),
 * porque o nome do arquivo pode ser o de um endereço antigo do produto.
 * Arquivos .webp são ignorados: o robots.txt do fornecedor pede que não sejam baixados por robôs.
 */
export function extractProductImages(html: string, pageUrl: string, max = 5): string[] {
  const covers: string[] = [];
  const gallery: string[] = [];
  for (const m of html.matchAll(/<img\b([^>]*)>/gi)) {
    const attrs = m[1];
    if (/class="[^"]*card__image/i.test(attrs)) continue;
    const src = attrs.match(/\bsrc="([^"]+)"/i)?.[1];
    if (!src) continue;
    let abs: string;
    try {
      abs = new URL(src, pageUrl).toString();
    } catch {
      continue;
    }
    const path = new URL(abs).pathname;
    if (!/\/produtos\//i.test(path)) continue;
    const hit = lastSegment(abs).match(/^(cover|produto)-.+\.(jpe?g|png)$/i);
    if (!hit) continue;
    const list = hit[1].toLowerCase() === "cover" ? covers : gallery;
    if (!covers.includes(abs) && !gallery.includes(abs)) list.push(abs);
  }
  return [...covers.slice(0, 1), ...gallery].slice(0, max);
}

const STOP = new Set(["de", "da", "do", "das", "dos", "e", "em", "com", "para", "c", "p", "a", "o"]);

function tokens(s: string): Set<string> {
  return new Set(slugify(s).split("-").filter((t) => t && !STOP.has(t)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function similarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  // quanto do nome do produto aparece no link (peso maior) + semelhança geral
  return 0.7 * (inter / a.size) + 0.3 * jaccard(a, b);
}

/** Links ordenados por semelhança de nome, acima de um mínimo. */
export function rankUrlsByName(name: string, urls: string[], limit = 3, minScore = 0.3): { url: string; score: number }[] {
  const a = tokens(name);
  return urls
    .map((url) => ({ url, score: similarity(a, tokens(lastSegment(url))) }))
    .filter((x) => x.score >= minScore)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}

/** Casa um nome de produto com o link mais parecido. */
export function matchUrlByName(name: string, urls: string[], minScore = 0.6): { url: string; score: number } | null {
  return rankUrlsByName(name, urls, 1, minScore)[0] ?? null;
}

/** Grafias do código do produto como aparecem nas páginas do fornecedor (SD4003/B, SD-4003-B, SD-4003B…). */
export function codeVariants(code: string): string[] {
  const c = code.toUpperCase().trim();
  const m = c.match(/^([A-Z]+)-?(.*)$/);
  const out = new Set<string>([c]);
  const bodies = m ? [m[2]] : [c];
  const prefixes = m ? [m[1], `${m[1]}-`] : [""];
  for (const pre of prefixes)
    for (const body of bodies) for (const sep of ["/", "-", ""]) out.add(`${pre}${body.replace(/\//g, sep)}`);
  return [...out];
}

/** A página menciona o código do produto (sem confundir SD4007 com SD4007P ou SD40071)? */
export function pageHasCode(html: string, code: string): boolean {
  const text = html.toUpperCase();
  return codeVariants(code).some((v) => {
    const esc = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^A-Z0-9])${esc}(?![A-Z0-9])`).test(text);
  });
}
