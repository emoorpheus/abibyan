// sprite sheet dump (pixel-art-sprites: look at every sprite at 1× and zoomed):
// node test/lib/sheet.js '<page expr → array of canvases>' out.png [scale=6] [bg=#cfe0d0]
const { boot } = require('./h.js'); const fs = require('fs');
(async () => {
  const [expr, out, sc = '6', bg = '#cfe0d0'] = process.argv.slice(2);
  const { browser, page, errs } = await boot({ hour: 12 });
  const url = await page.evaluate(([expr, sc, bg]) => { const cvs = eval(expr), k = +sc, gap = 3; const W = cvs.reduce((a, c) => a + c.width + gap, gap), H = Math.max(...cvs.map((c) => c.height)) + gap * 2;
    const c = document.createElement('canvas'); c.width = W * k; c.height = H * k; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
    let px = gap; for (const cv of cvs) { x.drawImage(cv, px * k, (H - gap - cv.height) * k, cv.width * k, cv.height * k); px += cv.width + gap; } return c.toDataURL(); }, [expr, sc, bg]);
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64')); if (errs.length) console.log(errs.slice(0, 3)); await browser.close(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
