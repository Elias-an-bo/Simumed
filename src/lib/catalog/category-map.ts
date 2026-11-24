export interface CategoryRef {
  slug: string;
  name: string;
}

export interface CategoryMapping {
  parent: CategoryRef;
  child: CategoryRef | null;
}

/** Categorias principais da Simumed, na ordem do menu. */
export const PARENTS: Record<string, CategoryRef & { description: string; position: number }> = {
  simuladores: {
    slug: "simuladores", name: "Simuladores", position: 1,
    description: "Manequins e simuladores para treino de enfermagem, RCP, intubação, injeção, parto e habilidades clínicas.",
  },
  "modelos-anatomicos": {
    slug: "modelos-anatomicos", name: "Modelos anatômicos", position: 2,
    description: "Esqueletos, torsos, órgãos, músculos e modelos patológicos para o ensino de anatomia.",
  },
  microscopios: {
    slug: "microscopios", name: "Microscópios", position: 3,
    description: "Microscópios biológicos, estereoscópios e acessórios para laboratórios de ensino.",
  },
  "laminas-preparadas": {
    slug: "laminas-preparadas", name: "Lâminas preparadas", position: 4,
    description: "Kits de lâminas de histologia, patologia, botânica e zoologia.",
  },
  "kits-moleculares": {
    slug: "kits-moleculares", name: "Kits moleculares", position: 5,
    description: "Modelos moleculares e orbitais para química orgânica e inorgânica.",
  },
  "anatomia-veterinaria": {
    slug: "anatomia-veterinaria", name: "Anatomia veterinária", position: 6,
    description: "Esqueletos e modelos anatômicos de animais para cursos de veterinária.",
  },
  outros: { slug: "outros", name: "Outros", position: 99, description: "Outros produtos." },
};

const SUPPLIER_PARENT: Record<string, string> = {
  simuladores: "simuladores",
  "modelos-anatomicos": "modelos-anatomicos",
  microscopios: "microscopios",
  "laminas-preparadas": "laminas-preparadas",
  "kit-molecular": "kits-moleculares",
  "anatomia-veterinaria": "anatomia-veterinaria",
};

const C = (slug: string, name: string): CategoryRef => ({ slug, name });

const CHILDREN: Record<string, Record<string, CategoryRef>> = {
  simuladores: {
    "cuidados-com-paciente": C("cuidados-com-o-paciente", "Cuidados com o paciente"),
    rcp: C("rcp-e-dea", "RCP e DEA"),
    "d-e-a": C("rcp-e-dea", "RCP e DEA"),
    injecao: C("injecao", "Injeção"),
    intubacao: C("intubacao-e-vias-aereas", "Intubação e vias aéreas"),
    "ginecologia-e-obstetricia": C("ginecologia-e-obstetricia", "Ginecologia e obstetrícia"),
    mamas: C("ginecologia-e-obstetricia", "Ginecologia e obstetrícia"),
    habilidades: C("habilidades-clinicas", "Habilidades clínicas"),
    suturas: C("suturas", "Suturas"),
    puncao: C("puncao-e-cateterizacao", "Punção e cateterização"),
    cateterizacao: C("puncao-e-cateterizacao", "Punção e cateterização"),
    "itens-de-consumo-e-reposicao": C("reposicao-e-consumiveis", "Reposição e consumíveis"),
  },
  "modelos-anatomicos": {
    esqueletos: C("esqueletos-e-ossos", "Esqueletos e ossos"),
    cranio: C("esqueletos-e-ossos", "Esqueletos e ossos"),
    coluna: C("esqueletos-e-ossos", "Esqueletos e ossos"),
    vertebras: C("esqueletos-e-ossos", "Esqueletos e ossos"),
    articulacoes: C("esqueletos-e-ossos", "Esqueletos e ossos"),
    pes: C("esqueletos-e-ossos", "Esqueletos e ossos"),
    pelve: C("esqueletos-e-ossos", "Esqueletos e ossos"),
    muscular: C("musculos-e-torsos", "Músculos e torsos"),
    torsos: C("musculos-e-torsos", "Músculos e torsos"),
    cabeca: C("musculos-e-torsos", "Músculos e torsos"),
    sistemas: C("orgaos-e-sistemas", "Órgãos e sistemas"),
    coracao: C("orgaos-e-sistemas", "Órgãos e sistemas"),
    pulmao: C("orgaos-e-sistemas", "Órgãos e sistemas"),
    cerebro: C("orgaos-e-sistemas", "Órgãos e sistemas"),
    rim: C("orgaos-e-sistemas", "Órgãos e sistemas"),
    figado: C("orgaos-e-sistemas", "Órgãos e sistemas"),
    estomago: C("orgaos-e-sistemas", "Órgãos e sistemas"),
    pancreas: C("orgaos-e-sistemas", "Órgãos e sistemas"),
    olho: C("orgaos-e-sistemas", "Órgãos e sistemas"),
    ouvido: C("orgaos-e-sistemas", "Órgãos e sistemas"),
    garganta: C("orgaos-e-sistemas", "Órgãos e sistemas"),
    pele: C("orgaos-e-sistemas", "Órgãos e sistemas"),
    mama: C("orgaos-e-sistemas", "Órgãos e sistemas"),
    reproducao: C("reproducao-e-genetica", "Reprodução e genética"),
    genetica: C("reproducao-e-genetica", "Reprodução e genética"),
    vagina: C("reproducao-e-genetica", "Reprodução e genética"),
    patologicos: C("patologicos", "Modelos patológicos"),
    dente: C("odontologia", "Odontologia"),
    "seccoes-de-": C("seccoes-anatomicas", "Secções anatômicas"),
    acupuntura: C("acupuntura", "Acupuntura"),
  },
  microscopios: {
    "biologico-monocular": C("microscopios-biologicos", "Microscópios biológicos"),
    "biologico-binocular": C("microscopios-biologicos", "Microscópios biológicos"),
    "biologico-trinocular": C("microscopios-biologicos", "Microscópios biológicos"),
    "estereoscopio-": C("estereoscopios", "Estereoscópios"),
    estereoscopio: C("estereoscopios", "Estereoscópios"),
    acessorios: C("acessorios-para-microscopios", "Acessórios"),
  },
};

export function categoryFor(path: [string, string]): CategoryMapping {
  const parentSlug = SUPPLIER_PARENT[path[0]] ?? "outros";
  const p = PARENTS[parentSlug];
  const childKey = path[1];
  const child =
    CHILDREN[parentSlug]?.[childKey] ??
    Object.entries(CHILDREN[parentSlug] ?? {}).find(([k]) => k.endsWith("-") && childKey.startsWith(k))?.[1] ??
    null;
  return { parent: { slug: p.slug, name: p.name }, child };
}

const NAME_RULES: [RegExp, [string, string]][] = [
  [/REPOSI[CÇ][AÃ]O|^PELE\b|^PAD\b|^TRAQUEIA\b|SISTEMA DE (DRENAGEM|PNEUMOT)/, ["simuladores", "itens-de-consumo-e-reposicao"]],
  [/^OCULAR\b|\bRET[IÍ]CULO|\bOBJETIVA\b/, ["microscopios", "acessorios"]],
  [/EST[EI]R[EI]?OSC[OÓ]PIO|ESTEREOSC/, ["microscopios", "estereoscopio"]],
  [/MICROSC[OÓ]PIO BIOL/, ["microscopios", "biologico-binocular"]],
  [/L[AÂ]MINAS PREPARADAS/, ["laminas-preparadas", ""]],
  [/SUTURA/, ["simuladores", "suturas"]],
  [/PUN[CÇ][AÃ]O|CATETER/, ["simuladores", "puncao"]],
  [/INJE[CÇ][AÃ]O/, ["simuladores", "injecao"]],
  [/SIMULADOR/, ["simuladores", "habilidades"]],
  [/DISCO|SECCION/, ["modelos-anatomicos", "seccoes-de-"]],
  [/ESQUELETO|CR[AÂ]NIO|COLUNA|ARTICULA|V[EÉ]RTEBRA|F[EÊ]MUR/, ["modelos-anatomicos", "esqueletos"]],
  [/CAVIDADE NASAL|LARINGE|FARINGE/, ["modelos-anatomicos", "garganta"]],
  [/TORSO|M[UÚ]SCUL/, ["modelos-anatomicos", "muscular"]],
];

/** Deduz o caminho de categoria pelo nome, para itens que vieram sem link na cotação. */
export function inferCategoryPath(rawName: string): [string, string] {
  const name = rawName.toUpperCase();
  for (const [re, path] of NAME_RULES) if (re.test(name)) return path;
  return ["outros", ""];
}
