import { expect, test, type Page } from "@playwright/test";

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@simumed.local";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "troque-esta-senha";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Resumo" })).toBeVisible();
}

test("painel exige login e mantém o e-mail após senha errada", async ({ page }) => {
  await page.goto("/admin/pedidos");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill("senha-errada");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.locator("#login-erro")).toHaveText("E-mail ou senha incorretos.");
  await expect(page.locator("#email")).toHaveValue(EMAIL);
});

test("salvar produto duas vezes não troca a categoria (regressão do reset do React 19)", async ({ page }) => {
  await login(page);
  await page.goto("/admin/produtos?q=SM-0013");
  await page.locator("tbody a").first().click();
  const category = page.locator("#p-cat");
  const before = await category.inputValue();
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Salvo às" })).toBeVisible();
    await expect(category).toHaveValue(before);
  }
  await page.reload();
  await expect(category).toHaveValue(before);
});

test("margem do produto muda o preço na loja", async ({ page, context }) => {
  await login(page);
  await page.goto("/admin/produtos?q=SM-0013");
  await page.locator("tbody a").first().click();
  await page.locator("#p-mk").fill("50");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Salvo às" })).toBeVisible();
  const store = await context.newPage();
  await store.goto("/produtos/simulador-de-rcp-mecanico-adulto-e-infantil");
  await expect(store.locator("main").getByText("R$ 1.018,90").first()).toBeVisible();

  await page.locator("#p-mk").fill("");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Salvo às" })).toBeVisible();
  await store.reload();
  await expect(store.locator("main").getByText("R$ 950,90").first()).toBeVisible();
});
