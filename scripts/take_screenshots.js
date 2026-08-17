const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Inject wallet state so it acts as logged in
  await page.addInitScript(() => {
    window.localStorage.setItem('escrowchain-wallet', JSON.stringify({
      state: {
        wallet: {
          address: '0x83973d081505ac696Bf456AB2a914CF7Bc76499c',
          chainId: '0x13882',
          networkName: 'Polygon Amoy Testnet',
          balanceMatic: 100,
          status: 'connected'
        }
      },
      version: 0
    }));
  });

  console.log('Navigating to local server...');
  await page.goto('http://localhost:3000');
  
  // Wait for sync to finish (the pulse loader at the top to disappear)
  await page.waitForTimeout(3000);

  // Click Transactions
  await page.click('text=Transactions');
  await page.waitForTimeout(1000);

  const escrowsToCapture = [2, 3, 4, 5, 6];
  
  for (const id of escrowsToCapture) {
    console.log(`Processing Escrow #${id}...`);
    // Go to History tab to find the transaction
    await page.click('text=History');
    await page.waitForTimeout(500);
    
    // Find the row with this ID
    const rowSelector = `text=#${id}`;
    const rowExists = await page.locator(rowSelector).count() > 0;
    
    if (rowExists) {
      // Click the row to open dashboard
      await page.click(rowSelector);
      await page.waitForTimeout(1500); // Wait for transition and data render
      
      const screenshotPath = path.join('C:\\eescrow\\screenshot', `Escrow_${id}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Saved ${screenshotPath}`);
    } else {
      console.log(`Escrow #${id} not found in History.`);
    }
  }

  await browser.close();
  console.log('Done!');
})();
