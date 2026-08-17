const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const hashes = [
    { id: 6, hash: '0xd0cc796e309d361298c7a0a4f72f708618c0d4b4ad0ecea9b8fd6c0ca49c82e8' }
  ];

  for (const { id, hash } of hashes) {
    console.log(`Navigating to Polygonscan for Escrow #${id}...`);
    await page.goto(`https://amoy.polygonscan.com/tx/${hash}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); 

    const screenshotPath = path.join('C:\\eescrow\\screenshot', `Polygonscan_Escrow_${id}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Saved ${screenshotPath}`);
  }
      
  await browser.close();
})();
