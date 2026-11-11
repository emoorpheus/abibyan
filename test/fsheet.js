// friends sheet: node test/fsheet.js <out.png> — every friend in its poses, 4x, on a light floor, with the monkey (current adult + baby) for scale
const { open, fs } = require('./lib/h.js');
(async () => {
  const out = process.argv[2] || '/data/game/test/look/friends.png';
  const { browser, page } = await open();
  const url = await page.evaluate(() => {
    const { DATA } = __game, K = 4, poses = ['idle', 'talk', 'happy', 'sad'], ids = ['pusya', 'monty', 'mosq', 'zhuk'];
    const W = 300, H = 70 * ids.length + 90, c = document.createElement('canvas'); c.width = W * K; c.height = H * K; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.fillStyle = '#f3ead8'; x.fillRect(0, 0, c.width, c.height);
    ids.forEach((id, r) => { const y0 = 10 + r * 70 + 56; x.fillStyle = '#d9c9aa'; x.fillRect(0, y0 * K, c.width, K);
      poses.forEach((p, i) => { for (const f of [0, 1]) { const e = FART.sprite(id, { pose: p, f, fat: i === 3 && f ? 1 : 0 }); const cx = 24 + i * 70 + f * 34; x.drawImage(e.cv, Math.round(cx - e.ox) * K, Math.round(y0 - e.oy) * K, e.w * K, e.h * K); } }); });
    const y0 = 10 + ids.length * 70 + 70; x.fillStyle = '#d9c9aa'; x.fillRect(0, y0 * K, c.width, K);
    DATA.AGES.forEach((A, i) => { const sp = MONKEY.compose({ s: A.s, age: A.age, f: 0.12, cloth: {}, pose: 'idle', eyes: { mode: 'open' }, mouth: 'smile' }); x.drawImage(sp.cv, Math.round(20 + i * 28 - sp.ox) * K, Math.round(y0 - sp.oy) * K, sp.cv.width * K, sp.cv.height * K); });
    return c.toDataURL('image/png'); });
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64')); await browser.close(); process.exit(0);
})();
