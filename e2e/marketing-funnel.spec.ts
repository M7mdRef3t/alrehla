import { expect, test } from "@playwright/test";

test.describe("Marketing Funnel", () => {
  test("captures lead with UTM and persists into marketing_leads", async ({ page, request }) => {
    const unique = Date.now();
    const email = `e2e+${unique}@alrehla.app`;
    await page.context().clearCookies();
    await page.goto(`/?utm_source=playwright&utm_medium=e2e&utm_campaign=funnel_${unique}`, {
      waitUntil: "domcontentloaded"
    });

    await page.locator("#lead-email").fill(email);
    const [leadResponse] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/marketing/lead") &&
          resp.request().method() === "POST" &&
          resp.status() === 200
      ),
      page.getByTestId("capture-lead-button").click()
    ]);
    const leadBody = (await leadResponse.json()) as { ok?: boolean };
    expect(leadBody.ok).toBeTruthy();
    await expect(page.locator("#lead-email")).toHaveValue("");
    await expect(page.getByTestId("lead-status")).toBeVisible();

    const debugResponse = await request.get(`/api/marketing/lead?email=${encodeURIComponent(email)}`, {
      headers: {
        "x-marketing-debug-key": "e2e-debug-key"
      }
    });
    expect(debugResponse.ok()).toBeTruthy();
    const debugBody = (await debugResponse.json()) as {
      ok?: boolean;
      exists?: boolean;
      lead?: { source?: string };
    };
    expect(debugBody.ok).toBeTruthy();
    expect(debugBody.exists).toBeTruthy();
    expect(debugBody.lead?.source).toBe("landing");
  });
});
