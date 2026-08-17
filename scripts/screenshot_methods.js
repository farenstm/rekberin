const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('Navigating to Polygonscan...');
  await page.goto('https://amoy.polygonscan.com/address/0x1ecb0a2ad4495a1b050b519b6ace92b1e068bf92', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000); 

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
  });

  const methods = [
    'Create Escrow',
    'Confirm Receipt',
    'Request Refund',
    'Approve Refund',
    'Reject Refund',
    'Create Listing',
    'Cancel Listing',
    'Update Listing'
  ];

  for (const method of methods) {
    try {
      // Find the row containing the method text
      // We look for a td or span containing the exact method name
      // Polygonscan method badges usually contain the text directly.
      const row = page.locator(`tr:has-text("${method}")`).first();
      
      const count = await row.count();
      if (count > 0) {
        console.log(`Found row for ${method}, taking screenshot...`);
        // Scroll into view
        await row.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000); // Wait for scroll
        
        const fileName = method.replace(/ /g, '_') + '.png';
        const screenshotPath = path.join('C:\\eescrow\\screenshot', fileName);
        await row.screenshot({ path: screenshotPath });
        console.log(`Saved ${screenshotPath}`);
      } else {
        console.log(`Method ${method} not found in the current page table.`);
      }
    } catch(err) {
      console.log(`Error taking screenshot for ${method}:`, err.message);
    }
  }

  // Also take a full page screenshot just in case
  const fullPath = path.join('C:\\eescrow\\screenshot', 'Polygonscan_All_Methods.png');
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log(`Saved ${fullPath}`);

  await browser.close();
})();
