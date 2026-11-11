// Render PWA icons from the game's own pixel monkey: node tools/icons.js
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 300, height: 300 } });
  await p.goto('file:///data/game/dist/index.html'); await p.waitForTimeout(400);
  const out = await p.evaluate(() => {
    const base = (safe) => {
      const N = 64, c = PX.canvas(N, N), x = c.getContext('2d'), P = Painter(x);
      x.fillStyle = '#ffd98a'; x.fillRect(0, 0, N, N);
      P.circ(32, 30, safe ? 27 : 30, '#ffe6a8'); P.circ(32, 28, safe ? 20 : 23, '#fff0c8');
      const s = safe ? 0.82 : 1.0;
      const sp = MONKEY.compose({ s, f: 0, pose: 'idle', eyes: { mode: 'open' }, mouth: 'smile', blush: 1, noStubble: 1, tail: 0 });
      const headY = sp.oy - 67 * s; // head centre in sprite px
      x.drawImage(sp.cv, Math.round(32 - sp.ox), Math.round((safe ? 31 : 30) - headY));
      return c;
    };
    const up = (src, k) => { const c = PX.canvas(src.width * k, src.height * k), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height); return c.toDataURL('image/png'); };
    const a = base(false), m = base(true);
    return { i192: up(a, 3), i512: up(a, 8), m512: up(m, 8), apple: up(a, 3) };
  });
  const fs = require('fs'), d = '/data/game/assets/icons/';
  const w = (n, u) => fs.writeFileSync(d + n, Buffer.from(u.split(',')[1], 'base64'));
  w('icon-192.png', out.i192); w('icon-512.png', out.i512); w('icon-maskable-512.png', out.m512); w('apple-touch-icon.png', out.apple);
  console.log('icons ok'); await b.close(); process.exit(0);
})();
