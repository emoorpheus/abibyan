// Round 22: the picture of Абибян for the birthday card (tools/card.py) — the game's own sprite, drawn by the game
// (waving, happy eyes, blush), saved as assets/card/abibyan.png (1 px = 1 art pixel; the card scales it up crisply).
// usage: node tools/card_art.js
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.goto('file://' + path.join(__dirname, '..', 'dist', 'index.html')); await p.waitForFunction(() => window.__game && __game.SPR);
  const out = await p.evaluate(() => {
    const G = __game, ag = G.GAME.ageDef(), res = {};
    for (const [k, pose, mouth] of [['abibyan', 'wave', 'laugh'], ['abibyan_up', 'up', 'laugh']]) {
      const e = G.SPR.get({ s: Math.round(ag.s * 1.6 * 100) / 100, age: ag.age, f: 0.25, cloth: {}, pose, legs: 'stand', eyes: { mode: 'happy' }, mouth, open: 0.5, blush: 1, tail: Math.PI / 4, bob: 0 }, 'card', true);
      res[k] = e.cv.toDataURL('image/png');
    }
    return res;
  });
  for (const k in out) fs.writeFileSync(path.join(__dirname, '..', 'assets', 'card', k + '.png'), Buffer.from(out[k].split(',')[1], 'base64'));
  await b.close(); console.log('wrote assets/card/', Object.keys(out).join(', ')); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
