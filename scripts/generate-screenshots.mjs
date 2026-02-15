import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const URL = process.env.SCREENSHOT_URL || 'http://localhost:3000/';

async function capture(viewport, filename) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  try {
    await page.goto(URL, { waitUntil: 'networkidle' });
    // give the app a brief moment to render dynamic content
    await page.waitForTimeout(800);
    const out = path.join(OUT_DIR, filename);
    await page.screenshot({ path: out, fullPage: true });
    console.log('Saved', out);
  } catch (err) {
    console.error('Screenshot failed:', err);
  } finally {
    await browser.close();
  }
}

(async () => {
  console.log('Capturing screenshots from', URL);
  await capture({ width: 1200, height: 628 }, 'hero-1.png');
  await capture({ width: 800, height: 600 }, 'hero-2.png');
  await capture({ width: 640, height: 360 }, 'hero-3.png');
  console.log('Done');
})();
