import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseCotacao } from "@/lib/catalog/parse-cotacao";
import { categoryFor, inferCategoryPath } from "@/lib/catalog/category-map";

const text = readFileSync(new URL("../fixtures/cotacao-trecho.txt", import.meta.url), "utf8");

describe("parseCotacao", () => {
  const items = parseCotacao(text);

  it("encontra todos os itens", () => {
    expect(items.map((i) => i.supplierCode)).toEqual(["XX100", "XX200/B", "OBJ-4", "XX300", "XX400", "XX500"]);
  });

  it("junta nome em duas linhas", () => {
    expect(items[0].rawName).toBe("MANEQUIM BISSEXUAL ADULTO C/ ÓRGÃOS INTERNOS P/ TREINO DE ENFERMAGEM DE 1,70CM");
  });

  it("converte custo para centavos", () => {
    expect(items[0].costCents).toBe(272875);
    expect(items[2].costCents).toBe(3355);
  });

  it("lê disponibilidade e prazo", () => {
    expect(items[0].availability).toBe("IN_STOCK");
    expect(items[0].leadTimeDays).toBeNull();
    expect(items[1].availability).toBe("ON_ORDER");
    expect(items[1].leadTimeDays).toBe(120);
  });

  it("lê categoria do link quebrado em duas linhas", () => {
    expect(items[0].categoryPath).toEqual(["simuladores", "cuidados-com-paciente"]);
    expect(items[1].categoryPath).toEqual(["simuladores", "rcp"]);
    expect(items[2].categoryPath).toEqual(["laminas-preparadas", ""]);
  });

  it("lê medidas, peso, garantia e NCM", () => {
    expect(items[0]).toMatchObject({ lengthCm: 115, widthCm: 48, heightCm: 24, weightKg: 17.77, warrantyDays: 365, ncm: "90230000" });
    expect(items[2]).toMatchObject({ heightCm: 3.5, weightKg: 0 });
  });
});

describe("casos difíceis da cotação", () => {
  const items = parseCotacao(text);
  it("lê medidas quebradas em duas linhas", () => {
    expect(items[3]).toMatchObject({ lengthCm: 98, widthCm: 46, heightCm: 30, weightKg: 11.63, warrantyDays: 365 });
    expect(items[3].categoryPath).toEqual(["modelos-anatomicos", "esqueletos"]);
  });
  it("link de busca (sem /produtos/): categoria deduzida pelo nome", () => {
    expect(items[5].categoryPath).toEqual(["modelos-anatomicos", "garganta"]);
  });
  it("item sem link: categoria deduzida pelo nome e garantia padrão", () => {
    expect(items[4].categoryPath).toEqual(["microscopios", "acessorios"]);
    expect(items[4]).toMatchObject({ weightKg: 0, warrantyDays: 365, ncm: null });
  });
});

describe("inferCategoryPath", () => {
  it("deduz pela palavra-chave do nome", () => {
    expect(inferCategoryPath("KIT REPOSICAO SIMULADOR DE ACESSO VENOSO CENTRAL")).toEqual(["simuladores", "itens-de-consumo-e-reposicao"]);
    expect(inferCategoryPath("PAD ADULTO PARA USO EM CONJUNTO COM O DEA")).toEqual(["simuladores", "itens-de-consumo-e-reposicao"]);
    expect(inferCategoryPath("MICROSCOPIO ESTEROSCOPIO BINOCULAR C/ZOOM")).toEqual(["microscopios", "estereoscopio"]);
    expect(inferCategoryPath("MICROSCOPIO BIOLOG TRINOCULAR C/OPTICA PLANA")).toEqual(["microscopios", "biologico-binocular"]);
    expect(inferCategoryPath("CRÂNIO HUMANO INFANTIL COLORIDO")).toEqual(["modelos-anatomicos", "esqueletos"]);
    expect(inferCategoryPath("TORSO EM DISCO SECCIONADO 13 PARTES")).toEqual(["modelos-anatomicos", "seccoes-de-"]);
    expect(inferCategoryPath("CAVIDADE NASAL AMPLIADA")).toEqual(["modelos-anatomicos", "garganta"]);
    expect(inferCategoryPath("KIT C/ 80 LAMINAS PREPARADAS")).toEqual(["laminas-preparadas", ""]);
    expect(inferCategoryPath("COISA DESCONHECIDA")).toEqual(["outros", ""]);
  });
});

describe("categoryFor", () => {
  it("agrupa subcategorias do fornecedor nas da Simumed", () => {
    expect(categoryFor(["simuladores", "d-e-a"])).toEqual({
      parent: { slug: "simuladores", name: "Simuladores" },
      child: { slug: "rcp-e-dea", name: "RCP e DEA" },
    });
    expect(categoryFor(["modelos-anatomicos", "coracao"]).child?.slug).toBe("orgaos-e-sistemas");
  });
  it("categoria sem subcategoria", () => {
    expect(categoryFor(["laminas-preparadas", ""])).toEqual({
      parent: { slug: "laminas-preparadas", name: "Lâminas preparadas" },
      child: null,
    });
  });
  it("categoria desconhecida vai para Outros", () => {
    expect(categoryFor(["xyz", "abc"]).parent.slug).toBe("outros");
  });
});
