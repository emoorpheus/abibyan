// render monkey variants: node mk.js out.png '[{"s":1,"f":0},...]' [zoom]
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
(async () => {
  const out = process.argv[2], specs = JSON.parse(process.argv[3] || '[{"s":1}]'), zoom = +(process.argv[4] || 4);
  const b = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 400, height: 400 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file:///data/game/dist/index.html'); await p.waitForTimeout(400);
  const url = await p.evaluate(({ specs, zoom }) => {
    const rs = specs.map(sp => MONKEY.compose(sp));
    const pad = 6; const W = rs.reduce((a, r) => a + r.w * zoom + pad, pad), H = Math.max(...rs.map(r => r.h * zoom)) + pad * 2;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.fillStyle = '#efe4d2'; x.fillRect(0, 0, W, H); let ox = pad;
    for (const r of rs) { x.drawImage(r.cv, ox, H - pad - r.h * zoom, r.w * zoom, r.h * zoom); ox += r.w * zoom + pad; }
    return c.toDataURL('image/png');
  }, { specs, zoom });
  require('fs').writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  if (errs.length) console.log('ERR', errs.join('\n')); else console.log('ok');
  await b.close(); process.exit(0);
})();
