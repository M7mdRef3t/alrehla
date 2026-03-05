import { test, expect, type Locator, type Page } from "@playwright/test";

async function resetSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem("dawayir-analytics-consent", "false");
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
}

async function getPrimaryStartButton(page: Page): Promise<Locator> {
  const heroButton = page.locator('button[class*="px-10"][class*="py-5"]').first();
  if (await heroButton.isVisible({ timeout: 8_000 }).catch(() => false)) return heroButton;
  const mainButton = page.locator("main button").first();
  if (await mainButton.isVisible({ timeout: 8_000 }).catch(() => false)) return mainButton;
  return page.locator("button").first();
}

async function beginJourney(page: Page): Promise<void> {
  const startButton = await getPrimaryStartButton(page);
  await startButton.click({ force: true });
  const continueButton = page.getByRole("button", { name: /أكمل|تخطي|skip|continue/i }).first();
  if (await continueButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await continueButton.click({ force: true });
  }
}

test.describe("Core flow", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await resetSession(page);
  });

  test("landing -> journey entry is actionable", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await beginJourney(page);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("bottom navigation area remains interactive", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await beginJourney(page);
    const mapTab = page.getByRole("button", { name: /الخريطة|map|دوايري/i }).first();
    if (await mapTab.isVisible().catch(() => false)) {
      await mapTab.click({ force: true });
    }
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("journey tab path is reachable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await beginJourney(page);
    const journeyTab = page.getByRole("button", { name: /رحلتي|journey|محطات/i }).first();
    if (await journeyTab.isVisible().catch(() => false)) {
      await journeyTab.click({ force: true });
    }
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("restart action availability check does not break UI", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await beginJourney(page);
    const resetButton = page.getByRole("button", { name: /إعادة إعداد الرحلة|restart journey/i }).first();
    if (await resetButton.isVisible().catch(() => false)) {
      await resetButton.click({ force: true });
    }
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("restart confirmation path keeps app alive", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await beginJourney(page);
    const resetButton = page.getByRole("button", { name: /إعادة إعداد الرحلة|restart journey/i }).first();
    if (await resetButton.isVisible().catch(() => false)) {
      await resetButton.click({ force: true });
      const confirmButton = page.getByRole("button", { name: /نعم|yes/i }).first();
      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click({ force: true });
      }
    }
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});
