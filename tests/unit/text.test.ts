import { describe, expect, it } from "vitest";
import { normalizeProductName, slugify } from "@/lib/text";

describe("slugify", () => {
  it("remove acentos e símbolos", () => {
    expect(slugify("Manequim Bissexual C/ Órgãos — 1,70 cm")).toBe("manequim-bissexual-c-orgaos-1-70-cm");
  });
});

describe("normalizeProductName", () => {
  it("converte caixa alta em frase e expande abreviações", () => {
    expect(
      normalizeProductName("MANEQUIM BISSEXUAL ADULTO C/ ÓRGÃOS INTERNOS P/ TREINO DE ENFERMAGEM DE 1,70CM"),
    ).toBe("Manequim bissexual adulto com órgãos internos para treino de enfermagem de 1,70 cm");
  });
  it("preserva siglas", () => {
    expect(normalizeProductName("SIMULADOR DE INTUBAÇÃO E RCP ADULTO ELETRÔNICO (BLS)")).toBe(
      "Simulador de intubação e RCP adulto eletrônico (BLS)",
    );
    expect(normalizeProductName("BRAÇO PARA TREINO DE INJEÇÃO IV, IM E SC")).toBe(
      "Braço para treino de injeção IV, IM e SC",
    );
    expect(normalizeProductName("TREINADOR DE DEA")).toBe("Treinador de DEA");
  });
  it("restaura acentos que faltam na cotação", () => {
    expect(normalizeProductName("SIMULADOR DE INJECAO E PUNCAO ARTERIAL BRACO BEBE")).toBe(
      "Simulador de injeção e punção arterial braço bebê",
    );
    expect(normalizeProductName("OCULAR PARA MICROSCOPIO BIOLOGICO C/RETÍCULO P/ MEDICAO")).toBe(
      "Ocular para microscópio biológico com retículo para medição",
    );
  });
  it("expande abreviações da cotação", () => {
    expect(normalizeProductName("MICROSCOPIO BIOLOG BINOCULAR C/OPTICA PLANA INF AUMENT.40XA1600X ILUM.5W")).toBe(
      "Microscópio biológico binocular com óptica plana infinita aumento 40X a 1600X iluminação 5W",
    );
    expect(normalizeProductName("CABECA EM DISCO SECCIONADA")).toBe("Cabeça em disco seccionada");
  });
  it("junta espaços repetidos", () => {
    expect(normalizeProductName("  KIT   TRAUMA  ")).toBe("Kit trauma");
  });
});
