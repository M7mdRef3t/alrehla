import { test, expect } from "@playwright/test";

test.describe("Core flow", () => {
  test("landing to goal to map", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "ادخل مركز القيادة" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("إيه أكتر حاجة شغلاك دلوقتي؟");

    await page.getByRole("button", { name: "العيلة" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("خريطة العيلة");

    const onboarding = page.getByRole("dialog");
    if (await onboarding.isVisible()) {
      await page.getByRole("button", { name: "فهمت" }).click();
    }

    await expect(page.getByRole("button", { name: "أضف جبهة" })).toBeVisible();
  });
});
