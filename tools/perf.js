// Round 19: the speed & weight probe. node tools/perf.js [tag] [file=index.html] → test/look/r19_perf_<tag>.json + a summary.
// Cold start of the real build (fresh profile, no save) at CPU ×1 and ×4 (a mid phone): parse+run time until the first game frame,
// long tasks, JS heap after GC; then 4 s at home and 4 s of «Крыши»: main-thread busy %, frame p95 and the frames over 25 ms.
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const fs = require('fs'), path = require('path');
const tag = process.argv[2] || 'now', file = process.argv[3] || 'index.html', ROOT = path.join(__dirname, '..');
const sizeOf = (p) => { try { return fs.statSync(p).size; } catch (e) { return 0; } };
const dirSize = (d) => { let n = 0; try { for (const f of fs.readdirSync(d)) { const p = path.join(d, f), s = fs.statSync(p); n += s.isDirectory() ? dirSize(p) : s.size; } } catch (e) { } return n; };
const INIT = `(() => { window.__lt = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) { }
  (function f() { if (window.__game && window.__game.APP && !window.__ready) window.__ready = performance.now(); else if (!window.__ready) requestAnimationFrame(f); })(); })();`;
async function run(cpu) {
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--enable-precise-memory-info'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }), page = await ctx.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  const cdp = await ctx.newCDPSession(page); await cdp.send('Performance.enable'); if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await page.addInitScript(INIT);
  const t0 = Date.now(); await page.goto('file://' + path.join(ROOT, 'dist', file), { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 }); const wall = Date.now() - t0;
  const nav = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), ready: Math.round(window.__ready), lt: window.__lt.slice() }; });
  const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
  await cdp.send('HeapProfiler.enable'); await cdp.send('HeapProfiler.collectGarbage'); const heap = await cdp.send('Runtime.getHeapUsage');
  // 4 s at home (the name window closed) and 4 s of a game: busy share of the main thread, frame intervals
  const busy = async (setup) => { await page.evaluate(setup); await page.waitForTimeout(600);
    const a = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
    const fr = await page.evaluate(() => new Promise((res) => { const d = []; let last = performance.now(); const t1 = last + 4000; (function f(t) { d.push(t - last); last = t; if (t < t1) requestAnimationFrame(f); else res(d); })(last); }));
    const b = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
    const s = fr.slice(1).sort((x, y) => x - y), p95 = s[Math.floor(s.length * 0.95)] || 0;
    return { busy: +((b.TaskDuration - a.TaskDuration) / (b.Timestamp - a.Timestamp) * 100).toFixed(1), script: +((b.ScriptDuration - a.ScriptDuration) / (b.Timestamp - a.Timestamp) * 100).toFixed(1), frames: s.length, p95: +p95.toFixed(1), over25: s.filter((x) => x > 25).length };
  };
  const home = await busy(() => { const b = document.querySelector('#nm-ok'); if (b) b.click(); document.querySelectorAll('[data-close]').forEach((x) => x.click()); });
  const game = await busy(() => { const G = __game, s = G.GAME.S; s.phone = true; s.tut = G.DATA.TUT.length; s.grow.stage = Math.max(s.grow.stage, 1); s.st.energy = 100; while (G.UI.hasModal()) G.UI.closeModal(); G.MINI.start('roofs', 1); });
  await browser.close();
  return { cpu, wall, dcl: nav.dcl, load: nav.load, ready: nav.ready, longTasks: nav.lt.length, longest: Math.max(0, ...nav.lt.map((x) => x[1])), scriptMs: Math.round(m0.ScriptDuration * 1000), taskMs: Math.round(m0.TaskDuration * 1000), heapMB: +(heap.usedSize / 1048576).toFixed(1), home, game, errs };
}
(async () => {
  const out = { tag, file, date: new Date().toISOString(), size: { html: sizeOf(path.join(ROOT, 'dist', file)), site: dirSize(path.join(ROOT, 'dist', 'site')), siteZip: sizeOf(path.join(ROOT, 'dist', 'moy-abibyan-site.zip')), speech: sizeOf(path.join(ROOT, 'src', 'speech.js')), rec: sizeOf(path.join(ROOT, 'src', 'voice_rec.js')) }, runs: [] };
  for (const cpu of [1, 4]) out.runs.push(await run(cpu));
  fs.mkdirSync(path.join(ROOT, 'test', 'look'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'test', 'look', 'r19_perf_' + tag + '.json'), JSON.stringify(out, null, 1));
  const mb = (n) => (n / 1048576).toFixed(2) + ' MB'; console.log(`size: html ${mb(out.size.html)} · site ${mb(out.size.site)} · site zip ${mb(out.size.siteZip)}`);
  for (const r of out.runs) console.log(`cpu ×${r.cpu}: ready ${r.ready} ms (dcl ${r.dcl}, load ${r.load}) · script ${r.scriptMs} ms · long tasks ${r.longTasks} (max ${r.longest} ms) · heap ${r.heapMB} MB · home busy ${r.home.busy}% p95 ${r.home.p95} ms >25: ${r.home.over25} · roofs busy ${r.game.busy}% p95 ${r.game.p95} ms >25: ${r.game.over25}${r.errs.length ? ' · ERR ' + r.errs[0] : ''}`);
})().catch((e) => { console.error(e); process.exit(1); });
