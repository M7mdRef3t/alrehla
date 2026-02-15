import { test, expect, type Page } from "@playwright/test";

const START_BUTTON_NAME = /\u0623\u0646\u0637\u0644\u0642|\u0627\u0628\u062f\u0623|\u0627\u0644\u0631\u062d\u0644\u0629/i;

async function resetSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
}

async function openPulse(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.setItem("dawayir-energy-copy-variant", "a");
  });
  await page.getByRole("button", { name: START_BUTTON_NAME }).click();
  await expect(page.getByTestId("pulse-check-shell")).toBeVisible();
  await expect(page.getByTestId("pulse-energy-slider")).toBeVisible();
}

async function setPulseCopyOverrides(page: Page, overrides: { energy?: "auto" | "a" | "b"; mood?: "auto" | "a" | "b"; focus?: "auto" | "a" | "b" }): Promise<void> {
  await page.goto("/");
  await page.evaluate((value) => {
    const key = "dawayir-admin-state";
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
    const next = {
      ...parsed,
      state: {
        ...(parsed.state ?? {}),
        pulseCopyOverrides: {
          energy: value.energy ?? "auto",
          mood: value.mood ?? "auto",
          focus: value.focus ?? "auto"
        }
      },
      version: typeof parsed.version === "number" ? parsed.version : 0
    };
    window.localStorage.setItem(key, JSON.stringify(next));
  }, overrides);
}

async function completePulse(page: Page): Promise<void> {
  const slider = page.getByTestId("pulse-energy-slider");
  await slider.focus();
  await slider.press("ArrowRight");
  await page.getByTestId("pulse-primary-action").click();

  const moodButton = page.locator(".pulse-check-mood-grid button").first();
  await expect(moodButton).toBeVisible();
  await moodButton.click();
  await page.getByTestId("pulse-primary-action").click();

  await page.locator(".grid.grid-cols-2 button").first().click();
  await page.getByTestId("pulse-primary-action").click();

  await page.getByTestId("pulse-primary-action").click();
  await expect(page.getByTestId("pulse-check-shell")).toBeHidden({ timeout: 10000 });
}

async function goToMoodStep(page: Page): Promise<void> {
  const slider = page.getByTestId("pulse-energy-slider");
  await slider.focus();
  await slider.press("ArrowRight");
  await page.getByTestId("pulse-primary-action").click();
  await expect(page.getByTestId("pulse-mood-summary")).toBeVisible();
}

async function goToFocusStep(page: Page): Promise<void> {
  await goToMoodStep(page);
  await page.locator(".pulse-check-mood-grid button").first().click();
  await page.getByTestId("pulse-primary-action").click();
  await expect(page.getByTestId("pulse-focus-summary")).toBeVisible();
}

test.describe("Pulse energy indicator", () => {
  test.beforeEach(async ({ page }) => {
    await resetSession(page);
  });

  test("shows default energy state and no footer overlap", async ({ page }) => {
    await openPulse(page);
    await expect(page.getByTestId("pulse-energy-orb")).toContainText("-");
    const orb = page.getByTestId("pulse-energy-orb");
    const slider = page.getByTestId("pulse-energy-slider");
    const footer = page.getByTestId("pulse-footer");
    const orbBox = await orb.boundingBox();
    const sliderBox = await slider.boundingBox();
    const footerBox = await footer.boundingBox();
    expect(orbBox).not.toBeNull();
    expect(sliderBox).not.toBeNull();
    expect(footerBox).not.toBeNull();
    expect((sliderBox?.y ?? 0) > (orbBox?.y ?? 0)).toBeTruthy();
    expect((footerBox?.y ?? 0) > (sliderBox?.y ?? 0)).toBeTruthy();
  });

  test("supports full submit flow with energy slider", async ({ page }) => {
    await openPulse(page);
    await completePulse(page);
  });

  test("supports keyboard control and announces Arabic value text", async ({ page }) => {
    await openPulse(page);
    const slider = page.getByTestId("pulse-energy-slider");
    await slider.focus();
    await slider.press("End");
    await expect(slider).toHaveAttribute("aria-valuenow", "10");
    await expect(slider).toHaveAttribute("aria-valuetext", /\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0637\u0627\u0642\u0629/);
    await slider.press("Home");
    await expect(slider).toHaveAttribute("aria-valuenow", "0");
  });

  test("shows strengthened mood step with summary and keeps flow progressing", async ({ page }) => {
    await openPulse(page);
    await goToMoodStep(page);
    await expect(page.getByTestId("pulse-mood-summary")).toContainText(/اختر حالة|رايق|هادئ|قلقان|متفائل/);
    await page.locator(".pulse-check-mood-grid button").nth(1).click();
    await page.getByTestId("pulse-primary-action").click();
    await expect(page.getByTestId("pulse-focus-summary")).toBeVisible();
  });

  test("shows strengthened focus step with summary and allows selecting focus", async ({ page }) => {
    await openPulse(page);
    await goToFocusStep(page);
    await page.locator(".grid.grid-cols-2 button").first().click();
    await expect(page.getByTestId("pulse-focus-summary")).toContainText(/موقف|فكرة|جسدي|ولا حاجة/);
  });

  test("applies winner overrides to mood and focus copy in next flow", async ({ page }) => {
    await setPulseCopyOverrides(page, { mood: "b", focus: "b" });
    await openPulse(page);
    await goToMoodStep(page);
    await expect(page.getByText("سمِّ الجو الداخلي بسرعة حتى نكمل بوضوح.")).toBeVisible();
    await page.locator(".pulse-check-mood-grid button").first().click();
    await page.getByTestId("pulse-primary-action").click();
    await expect(page.getByText("اختر أين تضع انتباهك أولًا.")).toBeVisible();
  });
});

test.describe("Pulse energy indicator - mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await resetSession(page);
  });

  test("fits without internal scrolling in card", async ({ page }) => {
    await openPulse(page);
    const shell = page.getByTestId("pulse-check-shell");
    const content = page.locator(".pulse-check-content");
    await expect(shell).toBeVisible();
    const overflow = await content.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(overflow).toBeLessThanOrEqual(14);
  });

  test("matches mobile visual baseline for energy card", async ({ page }) => {
    await openPulse(page);
    const shell = page.getByTestId("pulse-check-shell");
    await expect(shell).toBeVisible();
    await expect(shell).toHaveScreenshot("pulse-energy-mobile-card.png", {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      maxDiffPixelRatio: 0.02
    });
  });

  test("keeps card without internal scrolling across mood and focus steps", async ({ page }) => {
    await openPulse(page);
    await goToFocusStep(page);
    const content = page.locator(".pulse-check-content");
    const overflow = await content.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(overflow).toBeLessThanOrEqual(14);
  });
});

