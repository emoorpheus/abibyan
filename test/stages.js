const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto('file:///data/game/dist/index.html'); await page.waitForTimeout(900);
  const url = await page.evaluate(async () => {
    await document.fonts.load('700 10px "Pixelify Sans"');
    const { DATA } = window.__game; const W = 420, H = 150, K = 3;
    const c = document.createElement('canvas'); c.width = W * K; c.height = H * K; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    const g = x.createLinearGradient(0, 0, 0, c.height); g.addColorStop(0, '#fff4e2'); g.addColorStop(1, '#f6e3c6'); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#e8cba5'; x.fillRect(0, 118 * K, c.width, 2 * K);
    const N = DATA.AGES.length - 1, xs = [30, 82, 138, 198, 262, 334];
    for (let i = 0; i < N; i++) {
      const A = DATA.AGES[i]; const sp = MONKEY.compose({ s: A.s, age: A.age, f: 0.12, cloth: {}, pose: i === N - 1 ? 'wave' : 'idle', eyes: { mode: i < 2 ? 'open' : 'happy' }, mouth: 'smile', blush: 1, noStubble: 1 });
      x.globalAlpha = 0.18; x.fillStyle = '#3b2433'; x.beginPath(); x.ellipse(xs[i] * K, 118 * K, 20 * A.s / 1.2 * K, 3.5 * K, 0, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
      x.drawImage(sp.cv, Math.round(xs[i] - sp.ox) * K, Math.round(118 - sp.oy) * K, sp.cv.width * K, sp.cv.height * K);
      x.fillStyle = '#3b2433'; x.font = `700 ${9 * K}px "Pixelify Sans", monospace`; x.textAlign = 'center'; x.fillText(A.name, xs[i] * K, 134 * K);
      x.font = `400 ${7 * K}px "Pixelify Sans", monospace`; x.fillStyle = '#7a5a6a'; x.fillText(i ? `${A.days}+ дн. заботы` : 'старт', xs[i] * K, 144 * K);
    }
    return c.toDataURL('image/png');
  });
  fs.writeFileSync('/data/game/dist/abibyan-stages.png', Buffer.from(url.split(',')[1], 'base64'));
  await browser.close(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
