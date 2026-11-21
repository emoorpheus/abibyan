let chromium;
try {
  chromium = require('playwright').chromium;
} catch (e) {
  chromium = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright').chromium;
}
const path = require('path'), fs = require('fs');

const ROOT = path.join(__dirname, '..');
const FILE = 'file://' + path.join(ROOT, 'dist', 'abibyan-test.html');

(async () => {
  const chromePath = fs.existsSync('/usr/local/bin/chromium') ? '/usr/local/bin/chromium' : '/Users/emoorpheus/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
  const browser = await chromium.launch({
    executablePath: chromePath,
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });

  const page = await ctx.newPage();
  await page.goto(FILE);
  await page.waitForTimeout(600);

  // 1. Balcony screenshot
  await page.evaluate(() => {
    const G = window.__game;
    G.HOME.goTo('balcony', true);
    // position duck near planter box to verify it sits cleanly in front
    G.DUCKS.laneY = G.DUCKS.laneY;
    if (G.GAME.S.ducks) {
      G.GAME.S.ducks.room = 'balcony';
      G.GAME.S.ducks.x = 70;
    }
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ROOT, 'dist', 'r38_balcony_ducks.png') });
  console.log('Saved r38_balcony_ducks.png');

  // 2. Bathroom with bathmat
  await page.evaluate(() => {
    const G = window.__game;
    if (G.DASHA && G.DASHA.openGift) G.DASHA.openGift();
    G.GAME.S.home.items.bathmat = 1;
    G.HOME.goTo('bath', true);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ROOT, 'dist', 'r38_bath_bathmat.png') });
  console.log('Saved r38_bath_bathmat.png');

  // 3. Shop - Tech tab
  await page.evaluate(() => {
    const G = window.__game;
    G.UI.openShop('tech');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ROOT, 'dist', 'r38_shop_tech.png') });
  console.log('Saved r38_shop_tech.png');

  // 4. Shop - Bath decor tab
  await page.evaluate(() => {
    const G = window.__game;
    G.UI.closeSheet();
    G.HOME.goTo('bath', true);
    G.UI.openShop('home');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ROOT, 'dist', 'r38_shop_bath.png') });
  console.log('Saved r38_shop_bath.png');

  // 5. Shop - Kitchen decor tab (confirm cactus, clock are removed)
  await page.evaluate(() => {
    const G = window.__game;
    G.UI.closeSheet();
    G.HOME.goTo('kitchen', true);
    G.UI.openShop('home');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ROOT, 'dist', 'r38_shop_kitchen.png') });
  console.log('Saved r38_shop_kitchen.png');

  await browser.close();
  console.log('All screenshots captured successfully!');
})();
