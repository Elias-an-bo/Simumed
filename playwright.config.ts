import { defineConfig, devices } from "@playwright/test";

/**
 * Testes ponta a ponta. Precisam de Postgres com o catálogo carregado (npm run db:seed)
 * e usam pagamento/frete de teste. Rodar: npm run test:e2e
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100", trace: "off" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"] }, testMatch: /compra\.spec/ },
  ],
  webServer: {
    command: "npx next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 120_000,
    env: { PAYMENT_PROVIDER: "fake", SHIPPING_PROVIDER: "fake", EMAIL_PROVIDER: "console" },
  },
});
