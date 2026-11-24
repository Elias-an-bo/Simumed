import { parseBRLToCents } from "@/lib/money";
import { inferCategoryPath } from "./category-map";

export type ParsedAvailability = "IN_STOCK" | "ON_ORDER" | "ON_REQUEST";

export interface ParsedItem {
  supplierCode: string;
  rawName: string;
  costCents: number;
  availability: ParsedAvailability;
  leadTimeDays: number | null;
  categoryPath: [string, string];
  /** Link da página do produto no fornecedor (privado). null se não houver link de produto. */
  supplierUrl: string | null;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  warrantyDays: number;
  ncm: string | null;
}

// "XX100 - NOME ...     01       R$ 2.728,7528         R$ 2.728,75"
const HEADER = /^\s*([A-Z0-9][A-Z0-9/.\-]*)\s+-\s+(.+?)\s{2,}(\d+)\s+R\$\s*([\d.]+,\d{4})\s+R\$/;

function num(text: string, label: string): number {
  const m = text.match(new RegExp(`${label}\\s*:\\s*([\\d.,]+)`));
  if (!m) return 0;
  const n = Number(m[1].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function leftColumn(line: string): string {
  return line.trim().split(/\s{2,}/)[0] ?? "";
}

function categoryFromUrl(url: string): [string, string] | null {
  const m = url.match(/\/produtos\/(.+)$/);
  if (!m) return null;
  const segs = m[1].split("/").filter((s) => s && s !== "produtos");
  if (segs.length >= 3) return [segs[0], segs[1]];
  if (segs.length >= 1) return [segs[0], ""];
  return null;
}

function availabilityFrom(text: string): { availability: ParsedAvailability; leadTimeDays: number | null } {
  if (/dispon[ií]vel em estoque/i.test(text)) return { availability: "IN_STOCK", leadTimeDays: null };
  const m = text.match(/previs[aã]o em\s+(\d+)\s+dias/i);
  if (m) return { availability: "ON_ORDER", leadTimeDays: Number(m[1]) };
  return { availability: "ON_REQUEST", leadTimeDays: null };
}

/** Lê o texto (pdftotext -layout) de uma cotação do fornecedor. */
export function parseCotacao(text: string): ParsedItem[] {
  const lines = text.split(/\r?\n/);
  const items: ParsedItem[] = [];

  let i = 0;
  while (i < lines.length) {
    const head = lines[i].match(HEADER);
    if (!head) {
      i++;
      continue;
    }
    const nameParts = [head[2].trim()];
    let availabilityText = "";
    let url = "";
    let ncm: string | null = null;
    let inDescription = false;
    let urlOpen = false;
    let dimsLine = "";
    i++;

    for (; i < lines.length; i++) {
      const line = lines[i];
      if (HEADER.test(line)) break;
      if (/Comprimento\(cm\)/.test(line)) {
        dimsLine = line;
        i++;
        // às vezes "Altura/Peso/Garantia" caem na linha seguinte
        if (!/Peso\(Kg\)/.test(dimsLine) && i < lines.length && /Peso\(Kg\)/.test(lines[i])) {
          dimsLine += " " + lines[i];
          i++;
        }
        break;
      }
      const disp = line.match(/Disponibilidade:\s*(.+?)\s*$/);
      if (disp) availabilityText = disp[1];
      const ncmMatch = line.match(/NCM:\s*(\d+)/);
      if (ncmMatch) ncm = ncmMatch[1];

      if (/Descritivo t[ée]cnico/i.test(line)) {
        inDescription = true;
        continue;
      }
      if (!inDescription) {
        const left = leftColumn(line);
        if (left && !/^(Disponibilidade|Origem de Faturamento)/.test(left) && line.indexOf(left) < 40) {
          nameParts.push(left);
        }
        continue;
      }
      const urlMatch = line.match(/(https?:\/\/\S+)/);
      if (urlMatch) {
        url = urlMatch[1];
        urlOpen = true;
        continue;
      }
      if (urlOpen) {
        const cont = leftColumn(line);
        if (cont && !/:/.test(cont)) url += cont;
        urlOpen = false;
      }
    }

    items.push({
      supplierCode: head[1],
      rawName: nameParts.join(" ").replace(/\s+/g, " ").trim(),
      costCents: parseBRLToCents(head[4]),
      ...availabilityFrom(availabilityText),
      categoryPath: categoryFromUrl(url) ?? inferCategoryPath(nameParts.join(" ")),
      supplierUrl: categoryFromUrl(url) ? url : null,
      lengthCm: num(dimsLine, "Comprimento\\(cm\\)"),
      widthCm: num(dimsLine, "Largura\\(cm\\)"),
      heightCm: num(dimsLine, "Altura\\(cm\\)"),
      weightKg: num(dimsLine, "Peso\\(Kg\\)"),
      warrantyDays: num(dimsLine, "Garantia\\(dia\\)") || 365,
      ncm,
    });
  }
  return items;
}
