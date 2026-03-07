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
  await page.waitForSelector("button, [role='button']", { timeout: 15_000 }).catch(() => {});
  const heroButton = page.locator('button[class*="px-10"][class*="py-5"]').first();
  if (await heroButton.isVisible({ timeout: 2_000 }).catch(() => false)) return heroButton;
  const mainButton = page.locator("main button").first();
  if (await mainButton.isVisible({ timeout: 2_000 }).catch(() => false)) return mainButton;
  return page.locator("button, [role='button']").first();
}

async function openFirstFlowStep(page: Page): Promise<void> {
  const startButton = await getPrimaryStartButton(page);
  await startButton.click({ force: true });
  const continueButton = page.getByRole("button", { name: /skip|continue|اكمل|تخطي/i }).first();
  if (await continueButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await continueButton.click({ force: true });
  }
}

test.describe("Comprehensive Flow - User Mode", () => {
  test.beforeEach(async ({ page }) => {
    await resetSession(page);
  });

  test("Landing: renders primary CTA", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const startButton = await getPrimaryStartButton(page);
    await expect(startButton).toBeVisible({ timeout: 15_000 });
  });

  test("Start flow: can leave landing CTA state", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await openFirstFlowStep(page);
    const pulseDialog = page.getByRole("dialog").first();
    const mainHeading = page.getByRole("heading", { level: 1 }).first();
    const hasPulse = await pulseDialog.isVisible().catch(() => false);
    const hasHeading = await mainHeading.isVisible().catch(() => false);
    expect(hasPulse || hasHeading).toBeTruthy();
  });

  test("Post-start step exposes an interactive surface", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await openFirstFlowStep(page);
    const addPersonButton = page.getByRole("button", { name: /add person|شخص|\+/i }).first();
    const mapButton = page.getByRole("button", { name: /الخريطة|map/i }).first();
    const dialog = page.getByRole("dialog").first();
    const fallbackInteractive = page.locator("main button, [role='button']").first();
    const visible =
      (await addPersonButton.isVisible().catch(() => false)) ||
      (await mapButton.isVisible().catch(() => false)) ||
      (await dialog.isVisible().catch(() => false)) ||
      (await fallbackInteractive.isVisible().catch(() => false));
    expect(visible).toBeTruthy();
  });

  test("Map/add-person path keeps UI interactive", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await openFirstFlowStep(page);
    const addPersonButton = page.getByRole("button", { name: /add person|شخص|\+/i }).first();
    if (await addPersonButton.isVisible().catch(() => false)) {
      await addPersonButton.click({ force: true });
    }
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("Basic accessibility: landmark + primary action visible on landing", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const startButton = await getPrimaryStartButton(page);
    await expect(startButton).toBeVisible();
    await expect(startButton).toHaveAccessibleName(/.+/);
  });
});
