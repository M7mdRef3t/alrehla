import { expect, test, type Page } from "@playwright/test";

async function resetSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem("dawayir-analytics-consent", "false");
  });
}

async function openInventoryStep(page: Page): Promise<void> {
  await page.goto("/onboarding", { waitUntil: "domcontentloaded" });

  for (let i = 0; i < 3; i += 1) {
    await page.locator("button").first().click();
    await page.waitForTimeout(500);
  }

  await expect(page.locator('input[type="text"]').first()).toBeVisible();
}

async function expectMapSurface(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      const pathname = await page.evaluate(() => window.location.pathname);
      const body = await page.locator("body").innerText();
      return {
        pathname,
        isMapSurface:
          body.includes("لوحة الخريطة") ||
          body.includes("خريطة العلاقات") ||
          body.includes("ابدأ الاستكشاف")
      };
    }, { timeout: 15_000 })
    .toEqual({
      pathname: "/",
      isMapSurface: true
    });
}

test.describe("/onboarding navigation", () => {
  test.beforeEach(async ({ page }) => {
    await resetSession(page);
  });

  test("skip moves the user to the map instead of landing", async ({ page }) => {
    await openInventoryStep(page);

    await page.getByRole("button", { name: "تخطي" }).click();

    await expectMapSurface(page);
  });

  test("completion flow lands on the map and preserves the seeded node", async ({ page }) => {
    await openInventoryStep(page);

    await page.locator('input[type="text"]').first().fill("سارة");
    await page.getByRole("button", { name: "يلا نكمل →" }).click();

    await page.getByRole("button", { name: "قريب" }).click();
    await page.getByRole("button", { name: "شوف النتيجة →" }).click();
    await page.getByRole("button", { name: "كَمّل لخطتك ←" }).click();
    await page.getByRole("button", { name: "تخطي، دخلني الملاذ الآمن" }).click();
    await page.getByRole("button", { name: "دخول الملاذ الآمن ←" }).click();

    await expectMapSurface(page);
    await expect(page.getByText("سارة")).toBeVisible();
  });
});
