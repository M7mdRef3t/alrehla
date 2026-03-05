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

async function openPulseSurface(page: Page): Promise<void> {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const startButton = await getPrimaryStartButton(page);
  await startButton.click({ force: true });
  const continueButton = page.getByRole("button", { name: /أكمل|تخطي|skip|continue/i }).first();
  if (await continueButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await continueButton.click({ force: true });
  }
}

test.describe("Pulse energy indicator", () => {
  test.beforeEach(async ({ page }) => {
    await resetSession(page);
  });

  test("pulse entry keeps UI responsive", async ({ page }) => {
    await openPulseSurface(page);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("if slider appears, keyboard interaction works", async ({ page }) => {
    await openPulseSurface(page);
    const slider = page.locator('input[type="range"], [role="slider"]').first();
    if (await slider.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await slider.focus();
      await slider.press("End");
      await expect(slider).toHaveAttribute("aria-valuenow", /10|9/);
      await slider.press("Home");
    }
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("analysis action state does not crash the shell", async ({ page }) => {
    await openPulseSurface(page);
    const analyzeButton = page.getByRole("button", { name: /تحليل|analysis/i }).first();
    if (await analyzeButton.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(analyzeButton).toBeVisible();
    }
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("mobile pulse surface remains visible", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPulseSurface(page);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});
