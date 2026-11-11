// Baseline gallery + perf probe: node test/gallery.js <tag> [cpuRate=4]
// Saves 1x canvas PNGs of every room and mini-game to test/gallery/<tag>_*.png and prints a JSON summary.
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const fs = require('fs');
(async () => {
  const tag = process.argv[2] || 'base', rate = +(process.argv[3] || 4);
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const t0 = Date.now();
  await page.goto('file:///data/game/dist/index.html', { waitUntil: 'load' });
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(700);
  await page.evaluate(() => { const b = document.querySelector('#nm-ok'); if (b) b.click(); }); await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelectorAll('[data-close]').forEach(b => b.click()));
  const cdp = await page.context().newCDPSession(page);
  // wrap hot paths with timers
  await page.evaluate(() => {
    const T = window.__perf = { n: 0, ms: {} }; const G = window.__game;
    const wrap = (o, k, name) => { const f = o[k]; o[k] = function (...a) { const s = performance.now(); try { return f.apply(this, a); } finally { T.ms[name] = (T.ms[name] || 0) + performance.now() - s; } }; };
    wrap(G.HOME, 'render', 'home.render'); wrap(G.HOME, 'update', 'home.update'); wrap(G.MINI, 'render', 'mini.render'); wrap(G.MINI, 'update', 'mini.update'); wrap(G.UI, 'refresh', 'ui.refresh'); wrap(G.SPR, 'frame', 'spr.frame');
    const raf = window.requestAnimationFrame; window.requestAnimationFrame = (cb) => raf((t) => { T.n++; cb(t); });
  });
  const shotCanvas = async (name) => { const b64 = await page.evaluate(() => document.getElementById('cv').toDataURL('image/png').split(',')[1]); fs.writeFileSync(`/data/game/test/gallery/${tag}_${name}.png`, Buffer.from(b64, 'base64')); };
  const colors = () => page.evaluate(() => { const c = document.getElementById('cv'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, s = new Set(); for (let i = 0; i < d.length; i += 4) s.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]); return s.size; });
  const measure = async (sec) => {
    await page.evaluate(() => { window.__perf.n = 0; window.__perf.ms = {}; });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await page.waitForTimeout(sec * 1000);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    return page.evaluate(() => { const T = window.__perf, o = { frames: T.n }; for (const k in T.ms) o[k] = +(T.ms[k] / Math.max(1, T.n)).toFixed(3); return o; });
  };
  const out = { tag, loadMs, rooms: {}, games: {}, heapMB: 0 };
  for (const r of ['balcony', 'kitchen', 'hall', 'zal', 'bath']) {
    await page.evaluate((r) => __game.HOME.goTo(r, true), r); await page.waitForTimeout(1500);
    await shotCanvas('room_' + r); out.rooms[r] = { colors: await colors(), perf: await measure(3) };
  }
  for (const g of ['catch', 'vine', 'balloon', 'bongo', 'gym']) {
    await page.evaluate((g) => { __game.GAME.S.st.energy = 100; __game.MINI.start(g, 1); }, g); await page.waitForTimeout(1500);
    await shotCanvas('game_' + g); out.games[g] = { colors: await colors(), perf: await measure(3) };
    await page.evaluate(() => { const b = document.querySelector('#r-home'); if (b) b.click(); else __game.MINI.home(); }); await page.waitForTimeout(600);
  }
  const m = await cdp.send('Performance.enable').then(() => cdp.send('Performance.getMetrics'));
  const g = (n) => (m.metrics.find(x => x.name === n) || {}).value || 0; out.heapMB = +(g('JSHeapUsedSize') / 1048576).toFixed(1); out.nodes = g('Nodes');
  await page.screenshot({ path: `/data/game/test/gallery/${tag}_page_home.png` });
  out.errors = errs; console.log(JSON.stringify(out));
  await browser.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
