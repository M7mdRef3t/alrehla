import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log("Navigating to Manus URL...");
  await page.goto('https://manus.im/share/oWp3IaLb1uebLWfBnJJZ1h');
  
  // Wait for the main app to render
  await page.waitForTimeout(5000); 

  // Since React renders the tree, we can just grab all the text
  const content = await page.evaluate(() => {
    // Attempt to target the chat bubbles specifically
    // Manus classes typically have .whitespace-pre-wrap for chat text
    const blocks = Array.from(document.querySelectorAll('.whitespace-pre-wrap'));
    if (blocks.length > 0) {
      return blocks.map((b, i) => `--- Message ${i+1} ---\n${b.innerText}\n`).join('\n');
    }
    // Fallback: just return everything
    return document.body.innerText;
  });

  fs.writeFileSync('manus_raw.txt', content, 'utf-8');
  console.log("Done extracting. Check manus_raw.txt");
  
  await browser.close();
})();
