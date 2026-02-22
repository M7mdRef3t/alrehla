import { test, expect, type Page } from "@playwright/test";

const START_BUTTON_NAME = /أنطلق|ابدأ الرحلة|ابدأ الرادار|ابدأ/i;

async function resetSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
}

test.describe("Landing V2", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await resetSession(page);
  });

  test("does not auto-open cocoon modal on landing", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: START_BUTTON_NAME }).first()).toBeVisible();
    await page.waitForTimeout(2500);

    await expect(page.getByRole("heading", { name: /النهاردة يوم شحن/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /ابدأ دقيقة الشحن/ })).toHaveCount(0);
  });

  test("hides global chrome on landing mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("button", { name: START_BUTTON_NAME }).first()).toBeVisible();

    await expect(page.getByRole("navigation", { name: /التنقل الرئيسي/ })).toHaveCount(0);
    await expect(page.getByLabel(/حسابي|تسجيل الدخول/)).toHaveCount(0);
    await expect(page.getByLabel(/واتساب/)).toHaveCount(0);
    await expect(page.getByText(/نستخدم أدوات قياس بسيطة/)).toHaveCount(0);
    await expect(page.getByText(/خطوة واحدة بس/)).toHaveCount(0);
  });

  test("primary CTA starts journey gate flow", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: START_BUTTON_NAME }).first().click();

    const pulseHeading = page.getByRole("heading", { name: /ضبط البوصلة/ });
    const authNotNow = page.getByRole("button", { name: /مش دلوقتي/ });
    const goalHint = page.getByText(/حدد هدفك|اختر هدفك|العيلة|شغل/).first();
    const mapHint = page.getByRole("button", { name: /أضف شخص|العيلة/ }).first();
    const firstSparkHeading = page.getByRole("heading", { name: /حاسس إن طاقتك بتخلص/ });
    const firstSparkCta = page.getByRole("button", { name: /نضّف الميدان/ });

    await Promise.race([
      pulseHeading.waitFor({ state: "visible", timeout: 12_000 }).catch(() => null),
      authNotNow.waitFor({ state: "visible", timeout: 12_000 }).catch(() => null),
      goalHint.waitFor({ state: "visible", timeout: 12_000 }).catch(() => null),
      mapHint.waitFor({ state: "visible", timeout: 12_000 }).catch(() => null),
      firstSparkHeading.waitFor({ state: "visible", timeout: 12_000 }).catch(() => null),
      firstSparkCta.waitFor({ state: "visible", timeout: 12_000 }).catch(() => null)
    ]);

    const reachedGate =
      (await pulseHeading.isVisible().catch(() => false)) ||
      (await authNotNow.isVisible().catch(() => false)) ||
      (await goalHint.isVisible().catch(() => false)) ||
      (await mapHint.isVisible().catch(() => false)) ||
      (await firstSparkHeading.isVisible().catch(() => false)) ||
      (await firstSparkCta.isVisible().catch(() => false));

    expect(reachedGate).toBeTruthy();
  });
});
