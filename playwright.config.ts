import { devices, defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 5_000 },
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3002",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3002",
    timeout: 600_000,
    reuseExistingServer: true,
    env: {
      PORT: "3002",
      MARKETING_DEBUG_KEY: "e2e-debug-key",
      VITE_GEMINI_AI_ENABLED: "false",
      ENGINE_MODE: "mock"
    }
  }
});
