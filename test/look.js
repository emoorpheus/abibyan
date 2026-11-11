// quick visual look: node test/look.js <tag> [stage=5] — every room as a 1x canvas PNG into test/look/
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const fs = require('fs');
(async () => {
  const tag = process.argv[2] || 'look', stage = +(process.argv[3] ?? 5);
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto('file:///data/game/dist/index.html', { waitUntil: 'load' }); await page.waitForTimeout(800);
  await page.evaluate(() => { const b = document.querySelector('#nm-ok'); if (b) b.click(); }); await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelectorAll('[data-close]').forEach(b => b.click()));
  await page.evaluate((st) => { const S = __game.GAME.S; S.grow.stage = st; if (__game.GAME._ownAll) __game.GAME._ownAll(); S.tut = S.tut || {}; }, stage);
  const shot = async (name) => { const b64 = await page.evaluate(() => document.getElementById('cv').toDataURL('image/png').split(',')[1]); fs.writeFileSync(`/data/game/test/look/${tag}_${name}.png`, Buffer.from(b64, 'base64')); };
  for (const r of (process.argv[4] || 'zal,hall,kitchen,bath,balcony').split(',')) {
    await page.evaluate((r) => __game.HOME.goTo(r, true), r); await page.waitForTimeout(1200); await shot(r);
  }
  console.log(JSON.stringify(errs)); await browser.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
