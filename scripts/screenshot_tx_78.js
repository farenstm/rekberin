const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const hashes = [
    { id: 7, hash: '0xc6e16347e612ad6a8d0ffb71e18c125d3a3ddc1d4519c655a62fbba77a03a230' },
    { id: 8, hash: '0xd62858b417351f932c7955d14518ccb108483ef20d6ae78a28158bd128686aa2' }
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
