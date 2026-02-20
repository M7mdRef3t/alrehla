import { test, expect, type Page } from "@playwright/test";

const START_BUTTON_NAME = /أنطلق|ابدأ الرحلة|ابدأ/i;

async function resetSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem("dawayir-analytics-consent", "false");
  });
  await page.reload();
}

async function dismissConsentBannerIfVisible(page: Page): Promise<void> {
  const denyButton = page.getByRole("button", { name: /لا أوافق|اسألني لاحقًا/ }).first();
  const isVisible = await denyButton.isVisible().catch(() => false);
  if (isVisible) {
    await denyButton.click();
  }
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

async function seedExistingJourney(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem(
      "dawayir-journey",
      JSON.stringify({
        currentStepId: "map",
        completedStepIds: ["baseline", "goal", "map"],
        baselineAnswers: null,
        baselineScore: 42,
        baselineCompletedAt: Date.now() - 86_400_000,
        goalId: "family",
        category: "stability",
        postStepAnswers: null,
        postStepScore: null,
        journeyStartedAt: Date.now() - 172_800_000
      })
    );
    localStorage.setItem("dawayir-journey-onboarding-done", "true");
  });
}

async function seedOnboardingDone(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("dawayir-journey-onboarding-done", "true");
    localStorage.setItem("dawayir-analytics-consent", "false");
  });
}

async function setMobileViewport(page: Page): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
}

test.describe("Core flow", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await resetSession(page);
  });

  test("landing -> pulse/auth gate -> goal -> family map", async ({ page }) => {
    await seedOnboardingDone(page);
    await page.goto("/");
    await dismissConsentBannerIfVisible(page);
    await page.getByRole("button", { name: START_BUTTON_NAME }).click();

    await completePulseIfVisible(page);
    await skipAuthIfVisible(page);
    await expect(page.getByRole("button", { name: START_BUTTON_NAME })).not.toBeVisible({ timeout: 12000 });
  });

  test("bottom nav opens map flow", async ({ page }) => {
    await seedOnboardingDone(page);
    await setMobileViewport(page);
    await page.goto("/");
    await dismissConsentBannerIfVisible(page);
    await page.getByRole("button", { name: "دوايري" }).click();
    const mapLockedMessage = page.getByText("الخريطة متوقفة حالياً من لوحة التحكم في الزمن.");
    const openMapIndicator = page.getByRole("button", { name: /أضف شخص|العيلة/ }).first();
    const goalIndicator = page.getByText(/حدد هدفك|اختر هدفك|العيلة|شغل/);
    await Promise.race([
      mapLockedMessage.waitFor({ state: "visible", timeout: 10000 }).catch(() => null),
      openMapIndicator.waitFor({ state: "visible", timeout: 10000 }).catch(() => null),
      goalIndicator.waitFor({ state: "visible", timeout: 10000 }).catch(() => null)
    ]);
    const reachedAnyState =
      (await mapLockedMessage.isVisible().catch(() => false)) ||
      (await openMapIndicator.isVisible().catch(() => false)) ||
      (await goalIndicator.isVisible().catch(() => false));
    expect(reachedAnyState).toBeTruthy();
  });

  test("achievements opens from mobile nav", async ({ page }) => {
    await seedOnboardingDone(page);
    await setMobileViewport(page);
    await page.goto("/");
    await dismissConsentBannerIfVisible(page);
    await page.getByRole("button", { name: "محطات" }).click();
    await expect(page.getByRole("heading", { name: /رحلتك|إنجازاتك/ })).toBeVisible();
  });

  test("restart journey asks for confirmation", async ({ page }) => {
    await seedExistingJourney(page);
    await page.goto("/");
    await dismissConsentBannerIfVisible(page);
    await expect(page.getByRole("button", { name: "إعادة إعداد الرحلة" })).toBeVisible();
    await page.getByRole("button", { name: "إعادة إعداد الرحلة" }).click();
    await expect(page.getByText("تأكيد إعادة الإعداد")).toBeVisible();
    await expect(page.getByText("بياناتك الحالية هتفضل محفوظة")).toBeVisible();
  });

  test("restart journey confirm starts onboarding", async ({ page }) => {
    await seedExistingJourney(page);
    await page.goto("/");
    await dismissConsentBannerIfVisible(page);
    await page.getByRole("button", { name: "إعادة إعداد الرحلة" }).click();
    await page.getByRole("button", { name: "نعم، ابدأ من جديد" }).click();
    const onboardingKey = await page.evaluate(() => localStorage.getItem("dawayir-journey-onboarding-done"));
    expect(onboardingKey).toBeNull();
    await expect(page.getByText("تأكيد إعادة الإعداد")).not.toBeVisible();
  });
});
