import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const TARGET_URL = process.env.META_VERIFY_URL || process.env.SCREENSHOT_URL || "http://127.0.0.1:3000/#landing";
const OUTPUT_DIR = path.resolve(process.cwd(), "output");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "meta-funnel-report.json");

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

async function safeGoto(page, url) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    return { ok: true, stage: "domcontentloaded" };
  } catch (error) {
    return {
      ok: false,
      stage: "timeout",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function clickFirstVisibleButton(page, patterns) {
  for (const pattern of patterns) {
    const button = page.getByRole("button", { name: pattern }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click();
      return String(pattern);
    }
  }
  return null;
}

async function main() {
  ensureOutputDir();

  const report = {
    targetUrl: TARGET_URL,
    startedAt: new Date().toISOString(),
    navigation: null,
    landingState: null,
    afterLeadState: null,
    interactions: [],
    trackedRequests: [],
    errors: []
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  await context.addInitScript(() => {
    try {
      localStorage.setItem("dawayir-analytics-consent", "true");
    } catch {
      // ignore init-script storage failures
    }
  });

  const page = await context.newPage();

  page.on("request", (request) => {
    const url = request.url();
    if (
      url.includes("facebook.com/tr") ||
      url.includes("connect.facebook.net") ||
      url.includes("/rest/v1/routing_events")
    ) {
      report.trackedRequests.push({
        phase: "request",
        method: request.method(),
        url
      });
    }
  });

  page.on("response", (response) => {
    const url = response.url();
    if (
      url.includes("facebook.com/tr") ||
      url.includes("connect.facebook.net") ||
      url.includes("/rest/v1/routing_events")
    ) {
      report.trackedRequests.push({
        phase: "response",
        status: response.status(),
        url
      });
    }
  });

  try {
    report.navigation = await safeGoto(page, TARGET_URL);
    await page.waitForTimeout(8000);

    report.landingState = await page.evaluate(() => ({
      href: location.href,
      title: document.title,
      consent: localStorage.getItem("dawayir-analytics-consent"),
      fbqType: typeof window.fbq,
      buttonTexts: Array.from(document.querySelectorAll("button"))
        .map((button) => (button.textContent || "").trim())
        .filter(Boolean)
        .slice(0, 20)
    }));

    const leadClick = await clickFirstVisibleButton(page, [/ابدأ خريطتك/i, /ابدأ رحلتك/i, /ابدأ الآن/i]);
    if (leadClick) {
      report.interactions.push({ action: "lead_click", matched: leadClick });
      await page.waitForTimeout(4000);
    }

    const followupClick = await clickFirstVisibleButton(page, [/ابدأ/i, /متابعة/i, /يلا/i, /كم[ّ']?ل/i, /شوف/i, /انطلق/i]);
    if (followupClick) {
      report.interactions.push({ action: "followup_click", matched: followupClick });
      await page.waitForTimeout(2000);
    }

    report.afterLeadState = await page.evaluate(() => ({
      href: location.href,
      title: document.title,
      consent: localStorage.getItem("dawayir-analytics-consent"),
      fbqType: typeof window.fbq,
      sessionComplete: sessionStorage.getItem("dawayir-onboarding-completed-session"),
      buttonTexts: Array.from(document.querySelectorAll("button"))
        .map((button) => (button.textContent || "").trim())
        .filter(Boolean)
        .slice(0, 20)
    }));
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }

  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2), "utf8");

  console.log(`Meta funnel report written to ${OUTPUT_FILE}`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  ensureOutputDir();
  const failure = {
    targetUrl: TARGET_URL,
    failedAt: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error)
  };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(failure, null, 2), "utf8");
  console.error(JSON.stringify(failure, null, 2));
  process.exit(1);
});
