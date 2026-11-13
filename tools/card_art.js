// Round 22 → Round 34: sprites for the birthday card (tools/card.py) — the game's own sprites, drawn by the game
// (Абибян, friends: Пуся, Монти, Жук, Москит, and festive birthday cake), saved as assets/card/*.png
// usage: node tools/card_art.js
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.goto('file://' + path.join(__dirname, '..', 'dist', 'index.html'));
  await p.waitForFunction(() => window.__game && __game.SPR && __game.FART);
  const out = await p.evaluate(() => {
    const G = __game, ag = G.GAME.ageDef(), res = {};
    for (const [k, pose, mouth] of [['abibyan', 'wave', 'laugh'], ['abibyan_up', 'up', 'laugh']]) {
      const e = G.SPR.get({ s: Math.round(ag.s * 1.6 * 100) / 100, age: ag.age, f: 0.25, cloth: {}, pose, legs: 'stand', eyes: { mode: 'happy' }, mouth, open: 0.5, blush: 1, tail: Math.PI / 4, bob: 0 }, 'card', true);
      res[k] = e.cv.toDataURL('image/png');
    }
    for (const id of ['pusya', 'monty', 'zhuk', 'mosq']) {
      const e = G.FART.sprite(id, { pose: 'happy', f: 0 });
      res[id] = e.cv.toDataURL('image/png');
    }
    const ck = G.ART.food('cake');
    if (ck) res.cake = ck.toDataURL('image/png');
    // Festive two-tier birthday cake with 24 candles
    const cw = 68, ch = 48, cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const P = Painter(cv.getContext('2d')), INK = '#3b2433', cx = 34, cy = 44;
    P.shadow(cx, cy + 1, 32, 4, 0.25); P.ell(cx, cy, 31, 4.5, INK); P.ell(cx, cy - 0.5, 30, 3.8, '#ffffff');
    // bottom tier
    const b0 = cx - 26, bw = 52, bh = 14, bt = cy - bh - 2;
    P.r(b0 - 1, bt - 1, bw + 2, bh + 2, INK); P.r(b0, bt, bw, bh, '#ff8fb6'); P.r(b0, bt + bh - 3, bw, 3, '#e0558a'); P.r(b0, bt, bw, 3, '#ffd6e4');
    for (let i = 0; i < bw; i += 5) { P.r(b0 + i, bt + 3, 3, 2, '#ffd6e4'); }
    for (let i = 0; i < 6; i++) P.p(b0 + 4 + i * 8, bt + 9, i % 2 ? '#ffffff' : '#ffd04a');
    // chocolate "24" in the center
    const ds = ['111001111100111', '101101111001001'];
    ds.forEach((g, idx) => {
      const dx = cx - 8 + idx * 8;
      for (let r = 0; r < 5; r++) for (let q = 0; q < 3; q++) if (g[r * 3 + q] === '1') P.r(dx + q * 2, bt + 3 + r * 2, 2, 2, '#8a2a4a');
    });
    // top tier
    const t0 = cx - 18, tw = 36, th = 10, tt = bt - th;
    P.r(t0 - 1, tt - 1, tw + 2, th + 1, INK); P.r(t0, tt, tw, th, '#fff4e2'); P.r(t0, tt + th - 2, tw, 2, '#e8cba5'); P.r(t0, tt, tw, 2, '#ffffff');
    for (let i = 1; i < tw - 1; i += 4) P.r(t0 + i, tt + 2, 2, 2, '#ff8fb6');
    // candles on top
    const cands = [-14, -7, 0, 7, 14], cols = ['#ff4f86', '#7ad0ff', '#ffd04a', '#9ee07a', '#c9a0ff'];
    cands.forEach((off, i) => {
      const kx = cx + off, ky = tt - 7;
      P.r(kx - 1, ky + 2, 2, 6, cols[i % cols.length]); P.p(kx - 1, ky + 1, INK);
      P.r(kx - 1, ky - 2, 2, 3, '#ffb02a'); P.p(kx - 1, ky - 3, '#ff7a1a'); P.p(kx - 1, ky, '#fff6c8');
    });
    res.big_cake = cv.toDataURL('image/png');
    return res;
  });
  const artDir = path.join(__dirname, '..', 'assets', 'card');
  if (!fs.existsSync(artDir)) fs.mkdirSync(artDir, { recursive: true });
  for (const k in out) fs.writeFileSync(path.join(artDir, k + '.png'), Buffer.from(out[k].split(',')[1], 'base64'));
  await b.close();
  console.log('wrote assets/card/', Object.keys(out).join(', '));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
