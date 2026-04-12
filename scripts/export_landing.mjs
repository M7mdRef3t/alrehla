import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import Drawing from 'dxf-writer';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

async function run() {
  console.log('Starting multi-format export for LOCAL landing page...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const targetUrl = process.env.LANDING_EXPORT_URL || 'http://localhost:3030/';
  console.log(`Navigating to: ${targetUrl}`);
  
  await page.goto(targetUrl);
  await page.waitForLoadState('networkidle');
  
  // Wait for animations and dynamic content
  await page.waitForTimeout(2000);

  // Detect full page height
  const dimensions = await page.evaluate(() => {
    return {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      deviceScaleFactor: window.devicePixelRatio,
    };
  });

  console.log(`Detected dimensions: ${dimensions.width}x${dimensions.height}`);

  // Set viewport to the full page size to avoid clipping
  await page.setViewportSize({ width: 1280, height: Math.min(dimensions.height, 10000) });

  // 1. PDF Export
  console.log('Generating High-Fidelity PDF...');
  await page.pdf({
    path: 'landing_page_local.pdf',
    printBackground: true,
    width: '1280px',
    height: `${dimensions.height}px`, 
    pageRanges: '1',
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  console.log('✅ PDF generated: landing_page_local.pdf');

  // 2. WebP Export (High Quality Full-page Screenshot)
  console.log('Generating WebP...');
  try {
    // Note: Playwright supports 'webp' extension in newer versions.
    await page.screenshot({ 
      path: 'landing_page_local.webp', 
      fullPage: true,
      quality: 100
    });
    console.log('✅ WebP generated: landing_page_local.webp');
  } catch (e) {
    console.log('Falling back to high-quality JPEG for WebP request...');
    await page.screenshot({ path: 'landing_page_local.jpg', fullPage: true, quality: 95 });
  }

  // 3. DXF Export (Wireframe structure)
  console.log('Generating DXF (Wireframe Outlines)...');
  const elements = await page.evaluate(() => {
    const rects = [];
    const all = document.querySelectorAll('div, section, header, footer, h1, h2, h3, button, a');
    all.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 2 && rect.height > 2) {
        rects.push({
          x: rect.left,
          y: rect.top,
          w: rect.width,
          h: rect.height,
          tag: el.tagName
        });
      }
    });
    return rects;
  });

  const drawing = new Drawing();
  // DXF uses different coordinate system (Y is up usually), but we'll map screen coords
  elements.forEach(r => {
    drawing.drawRect(r.x, -r.y, r.x + r.w, -(r.y + r.h));
  });
  
  fs.writeFileSync('landing_page_local.dxf', drawing.toDxfString());
  console.log('✅ DXF generated: landing_page_local.dxf');

  // 4. SVG Export
  console.log('Generating SVG...');
  const svgData = await page.evaluate(() => {
    const width = document.documentElement.scrollWidth;
    const height = document.documentElement.scrollHeight;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('\n');
    
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" dir="rtl">
      ${styles}
      <style>body { margin: 0; padding: 0; background: transparent; }</style>
      ${document.body.innerHTML}
    </div>
  </foreignObject>
</svg>`;
  });
  
  fs.writeFileSync('landing_page_local.svg', svgData);
  console.log('✅ SVG generated: landing_page_local.svg');

  // 5. HTML Snapshot (Self-Contained for Dreamweaver)
  console.log('Generating Self-Contained HTML Snapshot...');
  const htmlContent = await page.evaluate(async () => {
    const baseUrl = window.location.origin;

    // 1. Convert all Relative Paths to Absolute in the DOM
    const fixPaths = (tagName, attr) => {
      document.querySelectorAll(tagName).forEach(el => {
        const val = el.getAttribute(attr);
        if (val && val.startsWith('/')) {
          el.setAttribute(attr, baseUrl + val);
        }
      });
    };
    fixPaths('img', 'src');
    fixPaths('link', 'href');
    fixPaths('script', 'src');
    fixPaths('source', 'src');

    // 2. Inline all active CSS rules (to ensure Dreamweaver renders them)
    // We'll collect all styles from the page
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
        } catch (e) {
          // Handle cross-origin issues if any (but here it's local)
          console.warn('Could not read datasheet:', sheet.href);
          return '';
        }
      })
      .join('\n');
    
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl" class="dark">
<head>
  <meta charset="UTF-8">
  <title>Dawayir Landing Page - Professional View</title>
  <style>
    ${styles}
    /* Ensure dark mode persists in Dreamweaver */
    :root { color-scheme: dark; }
    body { margin: 0; padding: 0; background-color: #131313; color: #e5e2e1; }
  </style>
</head>
<body class="bg-background text-on-background dark">
  ${document.body.innerHTML}
</body>
</html>`;
  });
  
  fs.writeFileSync('landing_page_actual.html', htmlContent);
  console.log('✅ Self-Contained HTML Snapshot generated: landing_page_actual.html');

  await browser.close();
  console.log('All exports complete.');
}

run().catch(err => {
  console.error('❌ Export failed:', err);
  process.exit(1);
});
