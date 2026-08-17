const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log('Navigating to Polygonscan...');
  await page.goto('https://amoy.polygonscan.com/address/0x1ecb0a2ad4495a1b050b519b6ace92b1e068bf92', { waitUntil: 'networkidle' });
  
  await page.waitForTimeout(3000); 

  const screenshotPath = path.join('C:\\eescrow\\screenshot', `Polygonscan_Transactions.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved ${screenshotPath}`);
      
  await browser.close();
})();
