import { describe, expect, it } from "vitest";
import { codeVariants, pageHasCode, extractProductImages, matchUrlByName, rankUrlsByName } from "@/lib/catalog/supplier-images";

const base = "https://www.fornecedor.example";
const page = `${base}/produtos/simuladores/rcp/simulador-de-rcp`;
const html = `
  <img src="${base}/doutor/uploads/0/logo/2024/08/emp-logo-d8788.png">
  <img src="${base}/doutor/uploads/6/produtos/2024/08/cover-simulador-de-rcp-d874600eb4.JPG" alt="x">
  <img src="${base}/doutor/uploads/6/produtos/2025/08/produto-simulador-de-rcp-1cd07df87c.jpg">
  <img src="${base}/doutor/uploads/6/produtos/2025/08/produto-simulador-de-rcp-60c28686b8.jpg">
  <img src="${base}/doutor/uploads/6/produtos/2024/08/cover-simulador-de-rcp-d874600eb4.JPG">
  <img class="card__image" src="${base}/doutor/uploads/6/produtos/2024/08/cover-simulador-de-rcp-e-heimlich-bebe-aaaaaaaaaa.jpg">
`;

describe("extractProductImages", () => {
  it("pega capa primeiro e galeria do próprio produto, sem repetir", () => {
    expect(extractProductImages(html, page)).toEqual([
      `${base}/doutor/uploads/6/produtos/2024/08/cover-simulador-de-rcp-d874600eb4.JPG`,
      `${base}/doutor/uploads/6/produtos/2025/08/produto-simulador-de-rcp-1cd07df87c.jpg`,
      `${base}/doutor/uploads/6/produtos/2025/08/produto-simulador-de-rcp-60c28686b8.jpg`,
    ]);
  });
  it("respeita o limite", () => {
    expect(extractProductImages(html, page, 1)).toHaveLength(1);
  });
  it("ignora produtos relacionados com slug parecido", () => {
    expect(extractProductImages(html, page).some((u) => u.includes("heimlich"))).toBe(false);
  });
});

describe("extractProductImages com endereço renomeado", () => {
  const renamed = `${base}/produtos/simuladores/cuidados/manequim-1-70-m`;
  const html2 = `
    <img src="${base}/doutor/uploads/6/produtos/2024/08/cover-manequim-1-70-cm-46d447aa15.JPG" alt="x">
    <img src="${base}/doutor/uploads/6/produtos/2025/09/produto-manequim-1-70-cm-f4055d53fe.jpg">
    <img src="${base}/doutor/uploads/6/produtos/2025/09/produto-manequim-1-70-cm-aaaa000000.webp">
    <img class="card__image" src="${base}/doutor/uploads/6/produtos/2024/08/cover-outro-produto-03328810de.jpg">
  `;
  it("usa a galeria principal mesmo quando o nome do arquivo é o antigo, sem miniaturas de relacionados e sem .webp", () => {
    expect(extractProductImages(html2, renamed)).toEqual([
      `${base}/doutor/uploads/6/produtos/2024/08/cover-manequim-1-70-cm-46d447aa15.JPG`,
      `${base}/doutor/uploads/6/produtos/2025/09/produto-manequim-1-70-cm-f4055d53fe.jpg`,
    ]);
  });
});

describe("matchUrlByName", () => {
  const urls = [
    `${base}/produtos/modelos-anatomicos/garganta/cavidade-nasal-ampliada-e-colorida`,
    `${base}/produtos/modelos-anatomicos/garganta/cavidade-nasal`,
    `${base}/produtos/microscopios/acessorios/ocular-para-microscopio-biologico-10x-23mm`,
  ];
  it("escolhe o link com nome mais parecido", () => {
    expect(matchUrlByName("Cavidade nasal ampliada e colorida", urls)?.url).toBe(urls[0]);
    expect(matchUrlByName("Cavidade nasal", urls)?.url).toBe(urls[1]);
  });
  it("retorna null quando nada é parecido o bastante", () => {
    expect(matchUrlByName("Esqueleto de cavalo", urls)).toBeNull();
  });
});

describe("rankUrlsByName", () => {
  const urls = [
    `${base}/produtos/simuladores/rcp/simulador-de-rcp-e-desobstrucao-das-vias-aereas-ovace-heimlich-bebe`,
    `${base}/produtos/simuladores/rcp/simulador-de-rcp-eletronico-bebe`,
    `${base}/produtos/modelos-anatomicos/garganta/cavidade-nasal`,
  ];
  it("ordena candidatos por semelhança e corta pelo mínimo", () => {
    const r = rankUrlsByName("Simulador de RCP e heimlich bebê", urls, 3, 0.3);
    expect(r.map((x) => x.url)).toEqual([urls[0], urls[1]]);
  });
});

describe("codeVariants", () => {
  it("gera as grafias usadas nas páginas do fornecedor", () => {
    expect(codeVariants("SD4003/B")).toEqual(expect.arrayContaining(["SD4003/B", "SD-4003/B", "SD-4003-B", "SD-4003B", "SD4003B"]));
  });
});

describe("pageHasCode", () => {
  it("acha o código em qualquer grafia", () => {
    expect(pageHasCode("<p>O Manequim SD-4002 está de acordo…</p>", "SD4002")).toBe(true);
    expect(pageHasCode("<p>modelo sd-4003/b</p>", "SD4003/B")).toBe(true);
  });
  it("não confunde com código maior", () => {
    expect(pageHasCode("<p>Pele SD-4007P para reposição</p>", "SD4007")).toBe(false);
    expect(pageHasCode("<p>SD-40071</p>", "SD4007")).toBe(false);
  });
});
