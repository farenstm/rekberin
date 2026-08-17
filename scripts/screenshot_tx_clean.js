const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const hashes = [
    { id: 6, hash: '0xd0cc796e309d361298c7a0a4f72f708618c0d4b4ad0ecea9b8fd6c0ca49c82e8' },
    { id: 7, hash: '0xc6e16347e612ad6a8d0ffb71e18c125d3a3ddc1d4519c655a62fbba77a03a230' },
    { id: 8, hash: '0xd62858b417351f932c7955d14518ccb108483ef20d6ae78a28158bd128686aa2' }
  ];

  for (const { id, hash } of hashes) {
    console.log(`Navigating to Polygonscan for Escrow #${id}...`);
    await page.goto(`https://amoy.polygonscan.com/tx/${hash}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); 

    // Hide cookie banners
    await page.evaluate(() => {
      const selectors = [
        '#cookie-consent', '.cc-window', '#cookiebtn', 
        'div[aria-label="cookieconsent"]', 
        '.cookie-banner', '#cookies-policy'
      ];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
      });
      // Try to click "Got it" just in case
      const btns = Array.from(document.querySelectorAll('button'));
      const cookieBtn = btns.find(b => b.textContent && b.textContent.toLowerCase().includes('got it'));
      if (cookieBtn) cookieBtn.click();
    });
    
    await page.waitForTimeout(500);

    const screenshotPath = path.join('C:\\eescrow\\screenshot', `Polygonscan_Escrow_${id}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Saved ${screenshotPath}`);
  }
      
  await browser.close();
})();
