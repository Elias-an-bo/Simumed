import { expect, test } from "@playwright/test";

const PRODUCT = "/produtos/simulador-de-rcp-mecanico-adulto-e-infantil";

test("compra com Pix: produto → carrinho → frete → checkout → pedido pago", async ({ page }) => {
  await page.goto(PRODUCT);
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await page.goto("/carrinho");
  await expect(page.getByRole("heading", { name: "Resumo" })).toBeVisible();
  await page.locator("#cep-frete").fill("01310100");
  await page.getByRole("button", { name: "Calcular" }).click();
  await page.locator("input[name=frete]").first().check();
  await page.getByRole("link", { name: "Finalizar compra" }).click();

  await page.locator("#c-name").fill("Cliente Teste Automático");
  await page.locator("#c-email").fill("teste@exemplo.com");
  await page.locator("#c-phone").fill("11987654321");
  await page.locator("#c-document").fill("52998224725");
  await page.locator("#c-cep").fill("01310100");
  await page.locator("#c-street").fill("Avenida Paulista");
  await page.locator("#c-number").fill("1000");
  await page.locator("#c-district").fill("Bela Vista");
  await page.locator("#c-city").fill("São Paulo");
  await page.locator("#c-state").selectOption("SP");
  await expect(page.locator("input[name=frete]:checked")).toHaveCount(1);
  await expect(page.getByText("Desconto Pix")).toBeVisible();
  await page.getByRole("button", { name: "Finalizar e gerar Pix" }).click();

  await expect(page).toHaveURL(/\/pedido\//);
  await expect(page.getByRole("heading", { name: "Pague com Pix" })).toBeVisible();
  // dados pessoais não ficam guardados no navegador (computadores compartilhados em instituições)
  const stored = await page.evaluate(() => [localStorage.getItem("simumed:checkout"), sessionStorage.getItem("simumed:checkout")]);
  expect(stored).toEqual([null, null]);
  await expect(page.getByRole("link", { name: /Carrinho, 0 itens/ })).toBeVisible();
  await page.getByRole("button", { name: /Simular pagamento aprovado/ }).click();
  await expect(page.getByRole("heading", { name: "Obrigado pela compra!" })).toBeVisible();
});

test("produto caro aparece como orçamento e leva ao formulário", async ({ page }) => {
  await page.goto("/produtos?ordem=maior-preco");
  await page.locator("main a[href^='/produtos/']").first().click();
  await expect(page.getByText("Sob orçamento").first()).toBeVisible();
  await page.locator("main").getByRole("link", { name: "Solicitar orçamento", exact: true }).click();
  await expect(page).toHaveURL(/\/orcamento\?produto=/);
  await expect(page.locator("fieldset li")).toHaveCount(1);
});

test("página sem rolagem horizontal", async ({ page }) => {
  for (const path of ["/", PRODUCT, "/carrinho", "/orcamento", "/categoria/simuladores"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow, path).toBe(false);
  }
});
