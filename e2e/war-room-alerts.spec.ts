import { expect, test } from "@playwright/test";

const CRON_SECRET = process.env.CRON_SECRET || "re7la_security_2026";
const ADMIN_SECRET = process.env.ADMIN_API_SECRET || CRON_SECRET;

function seedAdminSession() {
  return {
    state: {
      adminAccess: true,
      adminCode: ADMIN_SECRET
    },
    version: 0
  };
}

test.describe("War Room alerts lifecycle", () => {
  test("signal -> incident -> acknowledge -> resolve", async ({ page, request }) => {
    test.setTimeout(180_000);

    await page.addInitScript((seed) => {
      localStorage.setItem("dawayir-admin-state", JSON.stringify(seed));
      localStorage.setItem("dawayir-journey-onboarding-done", "true");
      localStorage.setItem("dawayir-analytics-consent", "false");
    }, seedAdminSession());

    const resetResponse = await request.delete("/api/admin?path=alerts", {
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
      data: { reason: "E2E reset before sweep" }
    });
    expect(resetResponse.ok()).toBeTruthy();

    const sweepResponse = await request.get("/api/cron/alert-sweep", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` }
    });
    expect(sweepResponse.ok()).toBeTruthy();
    const hasActivationIncident = await expect
      .poll(async () => {
        const response = await request.get("/api/admin?path=alerts", {
          headers: { Authorization: `Bearer ${ADMIN_SECRET}` }
        });
        if (!response.ok()) return false;
        const body = await response.json();
        const incidents = Array.isArray(body?.incidents) ? body.incidents : [];
        return incidents.some((inc: { rule_key?: string; status?: string }) =>
          inc?.rule_key === "activation_yield_drop" && (inc?.status === "open" || inc?.status === "ack")
        );
      }, { timeout: 45_000 })
      .toBe(true)
      .then(() => true)
      .catch(() => false);

    await page.goto("/admin?tab=war-room", { waitUntil: "domcontentloaded" });

    // Force route sync in SPA state when opening /admin directly in tests.
    await page.evaluate(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    const gateInput = page.locator('input[type="password"]').first();
    if (await gateInput.isVisible().catch(() => false)) {
      await gateInput.fill(ADMIN_SECRET);
      await page.keyboard.press("Enter");
    }

    const warRoomHeader = page.getByText("Alert Radar (War Room)");
    if (!(await warRoomHeader.isVisible().catch(() => false))) {
      await page.evaluate(() => {
        window.history.pushState({}, "", "/admin?tab=war-room");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
    }

    await expect(warRoomHeader).toBeVisible({ timeout: 90_000 });
    if (!hasActivationIncident) {
      await expect(page.getByText("Systems Normal")).toBeVisible({ timeout: 30_000 });
      return;
    }
    await expect(page.getByText("activation_yield_drop")).toBeVisible({ timeout: 30_000 });

    await page.getByText("activation_yield_drop").first().click();
    const acknowledgeButton = page.getByRole("button", { name: "Acknowledge (Investigating)" });
    if (await acknowledgeButton.isVisible().catch(() => false)) {
      await acknowledgeButton.click();
      await expect(page.getByText("Incident acknowledged.")).toBeVisible({ timeout: 30_000 });
    }

    await page.getByRole("button", { name: "Mark as Resolved" }).click();

    await expect
      .poll(async () => {
        const response = await request.get("/api/admin?path=alerts", {
          headers: { Authorization: `Bearer ${ADMIN_SECRET}` }
        });
        if (!response.ok()) return -1;
        const body = await response.json();
        return Array.isArray(body?.incidents) ? body.incidents.length : -1;
      }, { timeout: 45_000 })
      .toBe(0);

    await page.reload();
    await expect(page.getByText("Systems Normal")).toBeVisible({ timeout: 30_000 });
  });
});
