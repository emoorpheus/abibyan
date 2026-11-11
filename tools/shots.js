// quick room shots: node tools/shots.js <hour> <room1,room2> [items-json] [outdir]  → <outdir>/s_<room>.png (canvas 180×320)
const { chromium } = require('/vercel/sandbox/node_modules/playwright'); const fs = require('fs');
(async () => {
  const h = +process.argv[2] || 12, rooms = (process.argv[3] || 'balcony').split(','), items = process.argv[4], out = process.argv[5] || '/tmp/shots';
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] }); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.clock.setFixedTime(new Date(2026, 10, 2, h, 0)); await p.goto('file:///data/game/dist/index.html'); await p.waitForTimeout(700);
  await p.evaluate(() => { const b = document.querySelector('#nm-ok'); if (b) b.click(); }); await p.waitForTimeout(900); await p.evaluate(() => document.querySelectorAll('[data-close]').forEach((b) => b.click()));
  for (const r of rooms) {
    await p.evaluate(([r, items]) => { const s = __game.GAME.S; s.friends.visitAt = Date.now(); if (items && items !== '-') Object.assign(s.home.items, JSON.parse(items)); __game.HOME.goTo(r, true); window.advanceTime(700); }, [r, items]);
    const url = await p.evaluate(() => document.getElementById('cv').toDataURL()); fs.writeFileSync(out + '/s_' + r + '.png', Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(errs.join('\n') || 'ok'); await b.close(); process.exit(0);
})();
