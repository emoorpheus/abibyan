const { chromium } = require('/vercel/sandbox/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto('file:///data/game/dist/index.html'); await page.waitForTimeout(700);
  await page.click('#nm-ok'); await page.waitForTimeout(1300); // r22: the first start is a gift box (no name dialog) — rename him here
  await page.evaluate(() => { __game.GAME.S.name = 'Пушок'; __game.GAME.save(true); });
  await page.evaluate(() => document.querySelectorAll('[data-close]').forEach(b => b.click()));
  const a = await page.evaluate(() => { const G = __game.GAME; G.addCoins(123); G.setKg(12.3); G.S.last = Date.now() - 3 * 3600e3; G.save(true); return { coins: G.S.coins, kg: G.S.kg, name: G.S.name, st: G.S.st, storage: G.storageOK }; });
  // simulate 3h away: patch the saved "last" timestamp
  await page.evaluate(() => { const k = Object.keys(localStorage)[0]; const d = JSON.parse(localStorage.getItem(k)); d.last = Date.now() - 3 * 3600e3; localStorage.setItem(k, JSON.stringify(d)); });
  await page.reload(); await page.waitForTimeout(1800);
  const b = await page.evaluate(() => { const G = __game.GAME; return { coins: G.S.coins, kg: G.S.kg, name: G.S.name, st: G.S.st, modal: !!document.querySelector('#modalw .mbox, #modalw > *'), keys: Object.keys(localStorage) }; });
  console.log('before', JSON.stringify(a)); console.log('after ', JSON.stringify(b));
  await page.screenshot({ path: '/data/game/test/shots/persist.png' });
  console.log(errs.length ? errs.join('\n') : 'no errors'); await browser.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
