import { chromium } from 'playwright';

const URL = process.env.SCREENSHOT_URL || 'http://localhost:3000/';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', (msg) => {
    try {
      logs.push({ type: msg.type(), text: msg.text() });
    } catch (e) {}
  });

  console.log('Opening', URL);
  await page.goto(URL, { waitUntil: 'networkidle' });

  // wait a moment for banner to appear
  await page.waitForTimeout(500);

  // debug: dump part of body HTML
  const body = await page.evaluate(() => document.body.innerHTML.slice(0, 2000));
  console.log('BODY HTML (truncated):', body);

  const agree = page.locator('text=أوافق');
  if (await agree.count() === 0) {
    console.error('Agree button not found');
    await browser.close();
    process.exit(2);
  }

  await agree.first().click();

  // allow analytics init and trackEvent to run
  await page.waitForTimeout(800);

  // check localStorage
  const consent = await page.evaluate(() => localStorage.getItem('dawayir-analytics-consent'));
  console.log('localStorage consent=', consent);

  const found = logs.find((l) => l.text.includes('Analytics') && l.text.includes('consent_given'));
  if (found) {
    console.log('PASS: consent event logged in console');
    await browser.close();
    process.exit(0);
  } else {
    console.error('FAIL: consent event not found in console logs');
    console.error('Console logs:', logs.map((l) => l.text).slice(-20));
    await browser.close();
    process.exit(3);
  }
})();
