const ACRONYMS = new Set([
  "RCP", "BLS", "ACLS", "ATLS", "PALS", "DEA", "IV", "IM", "SC", "ID", "LED", "USB", "DNA", "RNA",
  "PVC", "UTI", "ECG", "SUS", "VSEPR", "ABS", "II", "III", "IV", "VI", "HD", "LCD", "TV", "PCR",
]);

const LOWER_WORDS = new Set(["de", "da", "do", "das", "dos", "e", "em", "com", "para", "a", "o", "as", "os", "no", "na", "nos", "nas"]);

/** Gera slug de URL: sem acentos, minúsculo, hífens. */
export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normaliza nome vindo da cotação (caixa alta) para frase legível:
 * "C/" → "com", "P/" → "para", "1,70CM" → "1,70 cm", siglas preservadas.
 */
export function normalizeProductName(raw: string): string {
  let s = raw.replace(/\s+/g, " ").trim();
  s = s.replace(/\bC\//gi, "com ").replace(/\bP\//gi, "para ").replace(/\bS\//gi, "sem ");
  s = s.replace(/(\d)\s*(CM|MM|KG|ML|M)\b/gi, (_m, d: string, u: string) => `${d} ${u.toLowerCase()}`);
  s = s.replace(/\s+/g, " ").trim();

  const words = s.split(" ");
  const out = words.map((word, i) => {
    const core = word.replace(/^[("'[]+|[)"'\],.;:]+$/g, "");
    if (ACRONYMS.has(core.toUpperCase()) && core === core.toUpperCase()) return word;
    if (/\d/.test(core) && /[A-Z]/.test(core) && core.length <= 6 && !/^\d+[,.]?\d*$/.test(core)) {
      return word; // códigos como "3D", "SD4000"
    }
    const lower = word.toLocaleLowerCase("pt-BR");
    if (i === 0) return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
    if (LOWER_WORDS.has(core.toLowerCase())) return lower;
    return lower;
  });
  return out.join(" ");
}
