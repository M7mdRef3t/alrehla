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

async function goToGoalPicker(page: Page): Promise<void> {
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
}

async function selectFamilyMap(page: Page): Promise<void> {
  const familyButton = page.getByRole("button", { name: /العيلة/ }).first();
  const addPersonButton = page.getByRole("button", { name: /أضف شخص/ });
  if (!(await addPersonButton.isVisible().catch(() => false))) {
    await familyButton.click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/خريطة/);
  }
  await dismissMapOnboardingIfVisible(page);
}

async function dismissMapOnboardingIfVisible(page: Page): Promise<void> {
  const onboarding = page.locator('[aria-labelledby="onboarding-title"]');
  const visible = await onboarding.isVisible({ timeout: 3000 }).catch(() => false);
  if (!visible) return;
  for (let i = 0; i < 3; i++) {
    const firstButton = onboarding.getByRole("button").first();
    const canClick = await firstButton.isVisible().catch(() => false);
    if (!canClick) break;
    await firstButton.click();
    const stillVisible = await onboarding.isVisible({ timeout: 1000 }).catch(() => false);
    if (!stillVisible) break;
  }
}

test.describe("Comprehensive Flow - User Mode", () => {
  test.beforeEach(async ({ page }) => {
    await resetSession(page);
  });

  test("Landing: renders primary CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: START_BUTTON_NAME })).toBeVisible();
  });

  test("Start flow: pulse/auth gates then goal picker", async ({ page }) => {
    await goToGoalPicker(page);
  });

  test("Goal picker: family map card is selectable", async ({ page }) => {
    await goToGoalPicker(page);
    await selectFamilyMap(page);
  });

  test("Map: add person modal opens and shows first step", async ({ page }) => {
    await goToGoalPicker(page);
    await selectFamilyMap(page);
    await page.getByRole("button", { name: /أضف شخص/ }).click();
    await expect(page.getByText(/اختر اللقب|الاسم \(اختياري\)/)).toBeVisible();
  });

  test("Basic accessibility: heading + primary action visible on landing", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: START_BUTTON_NAME })).toBeVisible();
  });
});
