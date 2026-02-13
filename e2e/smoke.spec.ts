import { test, expect, type Page } from "@playwright/test";

const START_BUTTON_NAME = /أنطلق|ابدأ الرحلة|ابدأ/i;

async function resetSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
}

async function completePulseIfVisible(page: Page): Promise<void> {
  const pulseHeading = page.getByRole("heading", { name: /ضبط البوصلة/ });
  const hasPulse = await pulseHeading.waitFor({ state: "visible", timeout: 12000 }).then(() => true).catch(() => false);
  if (!hasPulse) return;

  const energy = page.locator('input[type="range"]');
  await energy.focus();
  await energy.press("ArrowRight");
  await page.getByRole("button", { name: "هادئ" }).click();
  await page.getByRole("button", { name: /موقف حصل/ }).click();
  await expect(page.getByRole("button", { name: /احفظ حالتك/ })).toBeEnabled();
  await page.getByRole("button", { name: /احفظ حالتك/ }).click();
}

async function skipAuthIfVisible(page: Page): Promise<void> {
  const notNowButton = page.getByRole("button", { name: "مش دلوقتي" });
  const hasAuthModal = await notNowButton.isVisible({ timeout: 10000 }).catch(() => false);
  if (!hasAuthModal) return;
  await notNowButton.click();
}

test.describe("Core flow", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await resetSession(page);
  });

  test("landing -> pulse/auth gate -> goal -> family map", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: START_BUTTON_NAME }).click();

    await completePulseIfVisible(page);
    await skipAuthIfVisible(page);

    const familyButton = page.getByRole("button", { name: /العيلة/ }).first();
    const addPersonButton = page.getByRole("button", { name: /أضف شخص/ });
    await Promise.race([
      familyButton.waitFor({ state: "visible", timeout: 12000 }).catch(() => null),
      addPersonButton.waitFor({ state: "visible", timeout: 12000 }).catch(() => null)
    ]);
    if (!(await addPersonButton.isVisible().catch(() => false))) {
      await familyButton.click();
      await expect(page.getByRole("heading", { level: 1 })).toContainText(/خريطة/);
    }
    await expect(page.getByRole("button", { name: /أضف شخص/ })).toBeVisible();
  });
});
