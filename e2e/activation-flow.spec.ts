import { expect, test } from "@playwright/test";

const ACTIVATION_URL = "/activation";

async function seedActivationSession(page: import("@playwright/test").Page, seed: { phone?: string; leadId?: string }) {
  await page.context().clearCookies();
  await page.addInitScript((data) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    if (data.phone) window.localStorage.setItem("dawayir_lead_phone", data.phone);
    if (data.leadId) window.localStorage.setItem("dawayir_lead_id", data.leadId);
    window.localStorage.setItem("dawayir-analytics-consent", "false");
  }, seed);
}

async function waitForAtLeastOneCall(calls: unknown[]) {
  await expect.poll(() => calls.length).toBeGreaterThan(0);
}

test.describe("/activation flow", () => {
  test("phone-only pulse syncs payment_requested with phone and lead metadata", async ({ page }) => {
    await seedActivationSession(page, { phone: "201234567890", leadId: "lead_123" });

    const requests: Array<{ method: string; body: Record<string, unknown> }> = [];
    await page.route("**/api/marketing/lead", async (route) => {
      const req = route.request();
      requests.push({ method: req.method(), body: req.postDataJSON() as Record<string, unknown> });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, lead: { lead_id: "lead_123", phone: "201234567890" } })
      });
    });

    await page.goto(ACTIVATION_URL, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();
    await waitForAtLeastOneCall(requests);

    expect(requests[0].method).toBe("POST");
    expect(requests[0].body.phone).toBe("201234567890");
    expect(requests[0].body.status).toBe("payment_requested");
    expect(requests[0].body.metadata).toMatchObject({ leadId: "lead_123" });
  });

  test("activation works when only phone exists and leadId is absent", async ({ page }) => {
    await seedActivationSession(page, { phone: "201111111111" });

    const requests: Array<Record<string, unknown>> = [];
    await page.route("**/api/marketing/lead", async (route) => {
      requests.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, lead: { lead_id: "lead_456", phone: "201111111111" } })
      });
    });

    await page.goto(ACTIVATION_URL, { waitUntil: "domcontentloaded" });
    await waitForAtLeastOneCall(requests);

    expect(requests[0].phone).toBe("201111111111");
    expect((requests[0].metadata as Record<string, unknown> | undefined)?.leadId).toBeUndefined();
  });

  test("proof submission sends manual proof payload", async ({ page }) => {
    await seedActivationSession(page, { phone: "201222222222", leadId: "lead_789" });

    await page.route("**/api/marketing/lead", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, lead: { lead_id: "lead_789", phone: "201222222222" } })
      });
    });

    const proofCalls: Array<Record<string, unknown>> = [];
    await page.route("**/api/activation/manual-proof", async (route) => {
      proofCalls.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, message: "ok" })
      });
    });

    await page.goto(ACTIVATION_URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.locator("button").nth(2).click({ force: true });
    await page.waitForTimeout(500);

    const inputs = page.locator("input, textarea");
    await inputs.nth(1).fill("TRX-001");
    await inputs.nth(2).fill("500");
    await page.locator('button[type="submit"]').click({ force: true });
    await page.waitForTimeout(1000);

    expect(proofCalls).toHaveLength(1);
    expect(proofCalls[0]).toMatchObject({
      email: "",
      reference: "TRX-001",
      amount: "500"
    });
  });

  test("duplicate phone across sessions keeps the same phone identifier", async ({ browser }) => {
    const makeSession = async (leadId: string) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.addInitScript((data) => {
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.localStorage.setItem("dawayir_lead_phone", "201333333333");
        window.localStorage.setItem("dawayir_lead_id", data.leadId);
        window.localStorage.setItem("dawayir-analytics-consent", "false");
      }, { leadId });

      const calls: Array<Record<string, unknown>> = [];
      await page.route("**/api/marketing/lead", async (route) => {
        calls.push(route.request().postDataJSON() as Record<string, unknown>);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true, lead: { lead_id: leadId, phone: "201333333333" } })
        });
      });

      await page.goto(ACTIVATION_URL, { waitUntil: "domcontentloaded" });
      await waitForAtLeastOneCall(calls);
      return { context, calls };
    };

    const first = await makeSession("lead_dup");
    const second = await makeSession("lead_dup_second");

    expect(first.calls[0].phone).toBe("201333333333");
    expect(second.calls[0].phone).toBe("201333333333");

    await first.context.close();
    await second.context.close();
  });
});
