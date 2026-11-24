const ACRONYMS = new Set([
  "RCP", "BLS", "ACLS", "ATLS", "PALS", "DEA", "IV", "IM", "SC", "ID", "LED", "USB", "DNA", "RNA",
  "PVC", "UTI", "ECG", "SUS", "VSEPR", "ABS", "II", "III", "IV", "VI", "HD", "LCD", "TV", "PCR",
]);

const LOWER_WORDS = new Set(["de", "da", "do", "das", "dos", "e", "em", "com", "para", "a", "o", "as", "os", "no", "na", "nos", "nas"]);

/** Palavras que vêm sem acento na cotação do fornecedor. */
const ACCENTS: Record<string, string> = {
  injecao: "injeção", puncao: "punção", braco: "braço", antebraco: "antebraço", bebe: "bebê", padrao: "padrão",
  microscopio: "microscópio", biologico: "biológico", biologica: "biológica", medicao: "medição", articulacao: "articulação",
  articulacoes: "articulações", diametro: "diâmetro", orgao: "órgão", orgaos: "órgãos", coracao: "coração",
  pulmao: "pulmão", cerebro: "cérebro", figado: "fígado", estomago: "estômago", pancreas: "pâncreas", cranio: "crânio",
  vertebra: "vértebra", vertebras: "vértebras", toracica: "torácica", toracico: "torácico", anatomico: "anatômico",
  anatomica: "anatômica", eletronico: "eletrônico", eletronica: "eletrônica", mecanico: "mecânico", intubacao: "intubação",
  cateterizacao: "cateterização", afericao: "aferição", pressao: "pressão", seccao: "secção", secao: "seção",
  femur: "fêmur", mao: "mão", maos: "mãos", umero: "úmero", gestacao: "gestação", evolucao: "evolução",
  avaliacao: "avaliação", ulcera: "úlcera", decubito: "decúbito", glandula: "glândula", celula: "célula",
  neuronio: "neurônio", dentaria: "dentária", odontologico: "odontológico", torax: "tórax", abdomen: "abdômen",
  pelvis: "pélvis", basico: "básico", basica: "básica", avancado: "avançado", avancada: "avançada", clinico: "clínico",
  clinica: "clínica", cirurgico: "cirúrgico", pratica: "prática", modulo: "módulo", modulos: "módulos",
  acessorio: "acessório", acessorios: "acessórios", optica: "óptica", lampada: "lâmpada", iluminacao: "iluminação",
  estereoscopio: "estereoscópio", esteroscopio: "estereoscópio", acromatica: "acromática", laminas: "lâminas",
  lamina: "lâmina", botanica: "botânica", organica: "orgânica", inorganica: "inorgânica", introdutorio: "introdutório",
  pecas: "peças", peca: "peça", veterinaria: "veterinária", mandibula: "mandíbula", encefalo: "encéfalo",
  hemisferio: "hemisfério", arterias: "artérias", arteria: "artéria", arterial: "arterial", digestorio: "digestório",
  respiratorio: "respiratório", circulatorio: "circulatório", urinario: "urinário", linfatico: "linfático",
  endocrino: "endócrino", didatico: "didático", mamaria: "mamária", cordao: "cordão", ginecologico: "ginecológico",
  pelvico: "pélvico", gluteo: "glúteo", subcutanea: "subcutânea", intradermica: "intradérmica", geriatrico: "geriátrico",
  pediatrico: "pediátrico", reposicao: "reposição", flexivel: "flexível", micrometrica: "micrométrica",
  pneumotorax: "pneumotórax", drenagem: "drenagem", traqueia: "traqueia", insercao: "inserção", origem: "origem",
  musculos: "músculos", musculo: "músculo", nucleo: "núcleo", molecula: "molécula", atomicas: "atômicas",
  atomica: "atômica", orbitas: "órbitas", orbital: "orbital", aumento: "aumento", visualizacao: "visualização",
  ossea: "óssea", osseo: "ósseo", ossos: "ossos", mitose: "mitose", meiose: "meiose", genetica: "genética",
  embriao: "embrião", fecundacao: "fecundação", reproducao: "reprodução", reprodutor: "reprodutor", orbitais: "orbitais",
};

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
    let lower = word.toLocaleLowerCase("pt-BR");
    const key = core.toLocaleLowerCase("pt-BR");
    if (ACCENTS[key]) lower = lower.replace(key, ACCENTS[key]);
    if (i === 0) return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
    if (LOWER_WORDS.has(core.toLowerCase())) return lower;
    return lower;
  });
  return out.join(" ");
}
