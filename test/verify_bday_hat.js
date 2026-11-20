let chromium;
try {
  chromium = require('playwright').chromium;
} catch (e) {
  chromium = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright').chromium;
}
const path = require('path'), fs = require('fs'), assert = require('assert');

const ROOT = path.join(__dirname, '..');
const FILE = 'file://' + path.join(ROOT, 'dist', 'abibyan-test.html');

(async () => {
  console.log('--- Verifying Bday Hat Feature ---');

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

  // Open the initial gift box if present and mark birthday party completed
  await page.evaluate(() => {
    const btn = document.querySelector('#nm-ok');
    if (btn) btn.click();
    const G = window.__game;
    G.GAME.S.dasha.gift = 'opened';
    G.GAME.S.dasha.party[2026] = '2026-11-21';
    G.FRIENDS._endParty();
  });
  await page.waitForTimeout(400);

  const res = await page.evaluate(() => {
    const G = window.__game;
    const C = G.DATA.CLOTHES.bday_hat;
    if (!C) throw new Error('bday_hat not found in DATA.CLOTHES');

    // 1. Data check
    const dataCheck = {
      slot: C.slot,
      name: C.name,
      price: C.price,
      lvl: C.lvl
    };

    // Advance time past intro greeting
    if (window.advanceTime) window.advanceTime(6000);
    const normalWear = G.HOME.clothes();
    const hatNormal = normalWear.hat;

    // 2. Hat auto-wear during party/event
    G.FRIENDS._party({ kind: 'dasha', force: true });
    const eventWear = G.HOME.clothes();

    // End party
    G.FRIENDS._endParty();
    const afterEventWear = G.HOME.clothes();

    // 3. Purchase in shop
    G.GAME.S.coins = 5000;
    delete G.GAME.S.ownedC.bday_hat;
    const ownBefore = !!G.GAME.S.ownedC.bday_hat;
    const bought = G.GAME.buyCloth('bday_hat');
    const ownAfter = !!G.GAME.S.ownedC.bday_hat;
    const wornAfterBuy = G.GAME.S.wear.hat === 'bday_hat';

    // 4. Shop sorting check
    const hatIds = Object.keys(G.DATA.CLOTHES).filter(id => G.DATA.CLOTHES[id].slot === 'hat');
    const sorted = hatIds.slice().sort((a, b) => G.DATA.CLOTHES[a].price - G.DATA.CLOTHES[b].price);
    const lastHat = sorted[sorted.length - 1];

    return {
      dataCheck,
      hatNormal,
      eventWearHat: eventWear.hat,
      afterEventWearHat: afterEventWear.hat,
      ownBefore,
      bought,
      ownAfter,
      wornAfterBuy,
      lastHatInShop: lastHat,
      lastHatPrice: G.DATA.CLOTHES[lastHat].price
    };
  });

  console.log('Verification results:', res);

  assert.strictEqual(res.dataCheck.slot, 'hat', 'Slot must be hat');
  assert.strictEqual(res.dataCheck.price, 3000, 'Price must be 3000');
  assert.notStrictEqual(res.hatNormal, 'bday_hat', 'Normal state outside greeting/event should not wear unbought bday_hat');
  assert.strictEqual(res.eventWearHat, 'bday_hat', 'Monkey must wear bday_hat during party event even when unbought');
  assert.notStrictEqual(res.afterEventWearHat, 'bday_hat', 'Monkey must take off bday_hat after party event ends');
  assert.strictEqual(res.ownBefore, false, 'Should not be owned before buying');
  assert.strictEqual(res.bought, true, 'Should successfully buy for 3000 coins');
  assert.strictEqual(res.ownAfter, true, 'Should be owned after buying');
  assert.strictEqual(res.wornAfterBuy, true, 'Should be equipped after buying');
  assert.strictEqual(res.lastHatInShop, 'bday_hat', 'bday_hat must be sorted at the end of hats by price (3000)');

  // Take screenshot of monkey wearing the hat in the room
  await page.evaluate(() => {
    const G = window.__game;
    G.GAME.S.wear.hat = 'bday_hat';
    G.HOME.goTo('zal', true);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ROOT, 'dist', 'monkey_bday_hat_preview.png') });
  console.log('Saved screenshot dist/monkey_bday_hat_preview.png');

  // Open shop to take screenshot of the hat card
  await page.evaluate(() => {
    const G = window.__game;
    G.UI.openShop('hat');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ROOT, 'dist', 'shop_bday_hat_preview.png') });
  console.log('Saved screenshot dist/shop_bday_hat_preview.png');

  await browser.close();
  console.log('--- ALL BDAY HAT CHECKS PASSED ---');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
