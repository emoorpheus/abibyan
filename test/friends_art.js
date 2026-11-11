// Sprite sheet of friends & pillows (all poses) next to the monkey for scale: node test/friends_art.js [out.png]
const { chromium } = require('/vercel/sandbox/node_modules/playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file:///data/game/dist/index.html'); await page.waitForTimeout(600);
  const url = await page.evaluate(() => {
    const F = __game.FART, rows = [
      ['pusya', ['idle', 'talk', 'happy', 'knead', 'wash', 'catch', 'dizzy']],
      ['monty', ['idle', 'talk', 'happy', 'think', 'sad']],
      ['mosq', ['idle', 'talk', 'happy', 'bite', 'lift']],
      ['carrot', ['idle', 'shy', 'hide', 'sleep']], ['pepper', ['idle', 'wink', 'proud', 'sleep']]];
    const cell = 70, k = 3, c = document.createElement('canvas'); c.width = cell * 12 * k; c.height = cell * rows.length * k; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    rows.forEach(([id, poses], r) => {
      x.fillStyle = r % 2 ? '#e9dcc4' : '#f6ecd8'; x.fillRect(0, r * cell * k, c.width, cell * k);
      const mk = __game.SPR.get({ s: 0.74, age: 0, f: 0, cloth: {}, pose: 'idle', legs: 'stand', eyes: { mode: 'open' }, mouth: 'smile' }, 'sheet', true);
      x.drawImage(mk.cv, 0, 0, mk.w, mk.h, (35 - mk.ox) * k, (r * cell + 66 - mk.oy) * k, mk.w * k, mk.h * k);
      const all = []; poses.forEach((p) => { all.push({ pose: p, mood: p }); if (p === 'idle' || p === 'talk') all.push({ pose: p, mood: p, f: 1 }); });
      if (id === 'carrot') all.push({ mood: 'idle', sq: 2 }, { mood: 'idle', lie: 1 }, { mood: 'sleep', lie: 1 });
      if (id === 'pepper') all.push({ mood: 'idle', lie: 1 }, { mood: 'wink', lie: 1 });
      if (id === 'pepper') all.push({ mood: 'idle', sq: 2 }, { mood: 'proud', sq: -1 });
      all.slice(0, 11).forEach((o, i) => { const e = F.sprite(id, o); x.drawImage(e.cv, 0, 0, e.w, e.h, (cell * (i + 1) + 35 - e.ox) * k, (r * cell + 66 - e.oy) * k, e.w * k, e.h * k); });
    });
    return c.toDataURL();
  });
  fs.writeFileSync(process.argv[2] || '/data/game/test/gallery/friends_sheet.png', Buffer.from(url.split(',')[1], 'base64'));
  console.log(errs.length ? 'ERRORS ' + errs.join('\n') : 'ok'); await b.close(); process.exit(errs.length ? 1 : 0);
})();
