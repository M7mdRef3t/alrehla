import { defineConfig } from "@playwright/test";

const PORT = 5173;

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: `node ./node_modules/next/dist/bin/next dev -H 127.0.0.1 -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      VITE_GEMINI_AI_ENABLED: "false",
      ENGINE_MODE: "mock",
      CRON_SECRET: process.env.CRON_SECRET || "re7la_security_2026",
      ADMIN_API_SECRET: process.env.ADMIN_API_SECRET || "re7la_security_2026"
    }
  }
});
