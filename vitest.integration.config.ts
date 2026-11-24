import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

const TEST_DB = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/simumed_test";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    globalSetup: ["tests/integration/global-setup.ts"],
    env: {
      DATABASE_URL: TEST_DB,
      PAYMENT_PROVIDER: "fake",
      SHIPPING_PROVIDER: "fake",
      EMAIL_PROVIDER: "console",
      STORE_NOTIFY_EMAIL: "",
    },
  },
});
