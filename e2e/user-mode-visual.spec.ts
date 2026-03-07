import { test } from "@playwright/test";

const routes = [
  { slug: "home", path: "/" },
  { slug: "pricing", path: "/pricing" },
  { slug: "dawayir", path: "/dawayir" },
];

test.describe("User Mode Visual Snapshots", () => {
  for (const route of routes) {
    test(`desktop ${route.slug}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: `artifacts/screenshots/desktop-${route.slug}.png`,
        fullPage: true,
      });
    });

    test(`mobile ${route.slug}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: `artifacts/screenshots/mobile-${route.slug}.png`,
        fullPage: true,
      });
      await context.close();
    });
  }
});
