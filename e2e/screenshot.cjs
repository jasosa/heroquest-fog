const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5174';
const SS_DIR = path.join(__dirname, 'qa_screenshots');
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(SS_DIR, 'initial.png'), fullPage: true });

  // Print all button texts
  const btns = await page.locator('button').allTextContents();
  console.log('Buttons on library screen:', JSON.stringify(btns));

  // Print all visible text
  const bodyText = await page.locator('body').innerText();
  console.log('\nPage text (first 1000 chars):', bodyText.substring(0, 1000));

  await browser.close();
})();
