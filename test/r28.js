// Round 28: node test/r28.js [speed,paths,fill,bands,sides,rooms,modal,sheet,slide,home26,off,webkit] → exit 1 on fail.
// FILL (Round 25, src/fill.js — the room's surroundings over the rest of a phone's screen) had no tests. The iPhone 17 family as in
// test/r24.js, in Chromium with the iPhone profiles and in WebKit (Safari's engine, test/lib/webkit.js):
// fill — in portrait FILL is on; #ext covers the whole screen (at most one art pixel past it), the picture sits in it where FILL says,
//   no holes outside the picture (also as the game's own loop left it); at the screen's edges the phone shows #ext (a screenshot,
//   saved to test/look/r28_*.png);
// bands — above the picture the ceiling's own colours, 4 dithered steps darker at the screen's top; below it the room's floor going on
//   (several colours in a row, not one flat colour), about as bright as the floor in the picture; the page background is the floor's
//   colour; rooms — the same in every room; sides — the side gaps are the picture's edge columns mirrored, pixel for pixel;
// modal — a window dims the bands, the sides and the page background, closing it brings the same pixels back; sheet — the shop sheet
//   goes on down to the screen's bottom; slide — mid-slide between rooms the floor below has no holes;
// home26 — iOS 26 from the home screen (a window shorter than the screen): #ext goes down to screen.height, the buttons stay in the
//   window; the same window in Safari or off iOS — only down to the window; off — on a desktop and in landscape FILL is off and the
//   page background is reset, back in portrait it is on again.
// R28_FILE=/abs/path/index.html → the same checks on another build (the mutation checks: a broken FILL must fail them).
// Not checked (no test here can): what a real iPhone 17 shows under its status bar and below a home-screen app — only on the phone.
const { chromium, devices } = require('/vercel/sandbox/node_modules/playwright');
const { ok, done, want, fs, PAGE_HELPERS } = require('./lib/h.js');
const { webkit } = require('./lib/webkit.js');
const path = require('path');
const W = want(), ROOT = path.join(__dirname, '..'), LOOK = process.env.R28_LOOK || path.join(ROOT, 'test', 'look'); // R28_LOOK: a mutation run's screenshots elsewhere
const FILE = 'file://' + (process.env.R28_FILE || path.join(ROOT, 'dist', 'index.html'));
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const AND_UA = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const errs = []; let browser = null;
const launch = () => chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
// test/r24.js's iPhone 17 family + iOS 26 from the home screen, where the window is the screen minus the top safe area (src/fill.js);
// the safe areas there (62 on top, none below) are my guess — I can't confirm them without the phone
const PHONES = [
  { id: 'ip17_safari', name: 'iPhone 17 в Safari', dev: 'iPhone 17' },
  { id: 'ip17_home', name: 'iPhone 17 с экрана «Домой»', dev: 'iPhone 17', vp: { width: 402, height: 874 }, ins: { top: 62, bottom: 34, left: 0, right: 0 } },
  { id: 'ip17_home26', name: 'iPhone 17 с экрана «Домой», окно короче экрана', dev: 'iPhone 17', vp: { width: 402, height: 812 }, scr: { width: 402, height: 874 }, ins: { top: 62, bottom: 0, left: 0, right: 0 }, standalone: true },
  { id: 'ip17pm_home', name: 'iPhone 17 Pro Max с экрана «Домой»', dev: 'iPhone 17 Pro Max', vp: { width: 440, height: 956 }, ins: { top: 62, bottom: 34, left: 0, right: 0 } },
  { id: 'ip17e_safari', name: 'iPhone 17e в Safari', dev: 'iPhone 17e' },
];
const pct = (v) => (Number.isFinite(v) ? Math.round(v * 100) + '%' : String(v));
const lumA = (c) => (c ? 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] : NaN);
const near = (a, b, t) => !!(a && b) && a.every((v, i) => Math.abs(v - b[i]) <= t);
const dmax = (a, b) => (a && b ? Math.max(...a.map((v, i) => Math.abs(v - b[i]))) : 999);
const E = (p, fn, a) => p.evaluate(fn, a);
// a phone's context — only plain options, so the same works in WebKit
function ctxFor(b, ph) {
  const d = devices[ph.dev]; if (!d) throw new Error('no Playwright profile ' + ph.dev);
  return b.newContext({ viewport: ph.vp || d.viewport, screen: ph.scr || ph.vp || d.screen, deviceScaleFactor: d.deviceScaleFactor, isMobile: d.isMobile, hasTouch: d.hasTouch, userAgent: ph.ua || IOS_UA });
}
async function page0(ctx, ph) {
  const page = await ctx.newPage(), tag = ph.id;
  page.on('pageerror', (e) => errs.push(tag + ' pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(tag + ' console: ' + m.text()); });
  if (ph.standalone) await page.addInitScript(() => { const g = { configurable: true, get: () => true }; try { Object.defineProperty(Navigator.prototype, 'standalone', g); } catch (e) { } try { Object.defineProperty(navigator, 'standalone', g); } catch (e) { } });
  if (ph.ins && !ph.wk) { const c = await ctx.newCDPSession(page); await c.send('Emulation.setSafeAreaInsetsOverride', { insets: ph.ins }); }
  await page.clock.setFixedTime(new Date(2026, 10, 4, 13, 0)); // an ordinary day, daylight
  await page.goto(FILE, { waitUntil: 'load', timeout: 90000 }); await page.waitForFunction(() => window.__game && __game.APP && __game.FILL, null, { timeout: 30000 }); await page.waitForTimeout(700);
  // the first start → home, as test/lib/h.js open() + boot() do
  await page.evaluate(() => { const b = document.querySelector('#nm-ok'); if (b) b.click(); }); await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelectorAll('[data-close]').forEach((b) => b.click()));
  await page.waitForFunction(() => __game.APP.scene === 'home' && !__game.UI.hasModal(), null, { timeout: 8000 }).catch(() => { });
  await page.evaluate(PAGE_HELPERS); await page.evaluate(() => { __unlock(); __calm(); }); await page.evaluate(fillHelpers); await page.waitForTimeout(500);
  return page;
}
// page side. __fill(): FILL's numbers and what #ext holds — first as the game's own loop left it (holes0), then right after a full
// redraw (FILL.layout() drops its cache, then FILL.draw(); no frame between the redraw and the reads). __shot(png): a screenshot's
// pixels at the screen's edges (in the side gaps: the top row, the middle, the lowest row on screen) against #ext's there.
function fillHelpers() {
  const lum = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  const med = (a) => { if (!a.length) return 0; a.sort((p, q) => p - q); return a[a.length >> 1]; };
  const rgb = (s) => { const m = String(s || '').match(/[\d.]+/g); return m && m.length >= 3 ? m.slice(0, 3).map(Number) : null; };
  const holes = (D, s) => { let n = 0; for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) { const pic = x >= s.SX && x < s.SX + 180 && y >= s.R0 && y < s.R0 + 320; if (!pic && D[(y * s.W + x) * 4 + 3] < 255) n++; } return n; };
  window.__fill = () => {
    const G = __game, F = G.FILL, cv = document.getElementById('cv'), ec = document.getElementById('ext'), html = document.documentElement, sh = document.getElementById('sheet');
    const r = { on: F.on, cls: html.classList.contains('fill'), disp: getComputedStyle(ec).display, vw: innerWidth, vh: innerHeight, scrH: screen.height, bg: html.style.backgroundColor,
      room: G.HOME.room, scene: G.APP.scene, modal: G.UI.hasModal(), sheet: G.UI.sheetOpen, cam: G.HOME.camY || 0, sheetBg: sh ? getComputedStyle(sh).backgroundColor : null };
    r.sheetRgb = rgb(r.sheetBg);
    const tb = [...document.querySelectorAll('#bar *, #hud *')].filter((e) => getComputedStyle(e).pointerEvents === 'auto' && e.getBoundingClientRect().height > 0);
    r.btnN = tb.length; r.btnMax = tb.length ? Math.max(...tb.map((e) => e.getBoundingClientRect().bottom)) : 0;
    if (!F.on) return r;
    const s0 = F.state; r.holes0 = holes(ec.getContext('2d').getImageData(0, 0, s0.W, s0.H).data, s0);
    F.layout(s0.u); F.draw(0.016, G.APP.scene, cv);
    const s = F.state, w = s.W, h = s.H, X0 = s.SX, X1 = s.SX + 180, Y0 = s.R0, Y1 = s.R0 + 320;
    const D = ec.getContext('2d').getImageData(0, 0, w, h).data, C = cv.getContext('2d').getImageData(0, 0, 180, 320).data, er = ec.getBoundingClientRect(), cr = cv.getBoundingClientRect();
    const at = (x, y) => (y * w + x) * 4, key = (A, i) => (A[i] << 16) | (A[i + 1] << 8) | A[i + 2], px = (x, y) => Array.from(D.subarray(at(x, y), at(x, y) + 3));
    const rowLum = (y) => { let L = 0; for (let x = X0; x < X1; x++) L += lum(D, at(x, y)); return L / 180; };
    Object.assign(r, { s: { u: s.u, W: w, H: h, SX: s.SX, SXR: s.SXR, R0: Y0, R1: s.R1, fullH: s.fullH }, er: { l: er.left, t: er.top, r: er.right, b: er.bottom },
      cr: { l: cr.left, t: cr.top, r: cr.right, b: cr.bottom }, bg: html.style.backgroundColor, bgRgb: rgb(html.style.backgroundColor), holes: holes(D, s) });
    if (Y0 >= 2) { // above: the ceiling's own colours right above the picture (cv's rows 0-1), darker toward the screen's top
      const ceil = new Set(); for (let i = 0; i < 180 * 2 * 4; i += 4) ceil.add(key(C, i));
      let off = 0; for (let x = 0; x < w; x++) if (!ceil.has(key(D, at(x, Y0 - 1)))) off++;
      const q = Math.max(1, Math.floor(Y0 / 4)); let up = 0, lo = 0; for (let y = 0; y < q; y++) { up += rowLum(y); lo += rowLum(Y0 - 1 - y); }
      r.top = { off, near: rowLum(Y0 - 1), far: rowLum(0), up: up / q, lo: lo / q, row: Array.from(D.subarray(at(0, Y0 - 1), at(0, Y0))).join(',') };
    }
    if (s.R1 >= 1) { // below: the floor going on, as bright as the floor in the picture (cv's last 8 rows); its last rows' colour
      const band = [], foot = [], cols = new Set(), last = [0, 0, 0]; let n = 0;
      for (let y = Y1; y < h; y++) for (let x = X0; x < X1; x++) band.push(lum(D, at(x, y)));
      for (let x = X0; x < X1; x++) cols.add(key(D, at(x, Y1)));
      for (let y = 312; y < 320; y++) for (let x = 0; x < 180; x++) foot.push(lum(C, (y * 180 + x) * 4));
      for (let y = Math.max(Y1, h - 2); y < h; y++) for (let x = X0; x < X1; x++) { const i = at(x, y); last[0] += D[i]; last[1] += D[i + 1]; last[2] += D[i + 2]; n++; }
      r.bot = { med: med(band), foot: med(foot), cols: cols.size, last: last.map((v) => Math.round(v / n)), mid: px(X0 + 90, h - 1) };
    }
    let bad = 0, n = 0, gl = 0, gn = 0; // the side gaps: the picture's edge columns mirrored
    for (let y = 0; y < 320; y++) {
      for (let k = 0; k < s.SX; k++) { n++; const a = at(X0 - 1 - k, Y0 + y), b = (y * 180 + k) * 4; if (D[a] !== C[b] || D[a + 1] !== C[b + 1] || D[a + 2] !== C[b + 2]) bad++; gl += lum(D, a); gn++; }
      for (let k = 0; k < s.SXR; k++) { n++; const a = at(X1 + k, Y0 + y), b = (y * 180 + 179 - k) * 4; if (D[a] !== C[b] || D[a + 1] !== C[b + 1] || D[a + 2] !== C[b + 2]) bad++; }
    }
    r.mir = { n, bad, lum: gn ? gl / gn : null, low: s.SX ? px(Math.floor(s.SX / 2), Y1 - 1) : null };
    return r;
  };
  window.__shot = async (b64) => {
    const s = __game.FILL.state, ec = document.getElementById('ext'), er = ec.getBoundingClientRect(), D = ec.getContext('2d').getImageData(0, 0, s.W, s.H).data;
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const k = img.width / innerWidth, vis = Math.min(s.H - 1, Math.floor((innerHeight - 1 - er.top) / s.u)), pts = [];
    const add = (name, ex, ey) => {
      const qx = er.left + (ex + 0.5) * s.u, qy = er.top + (ey + 0.5) * s.u; if (qx < 0 || qy < 0 || qx >= innerWidth || qy >= innerHeight) return;
      const i = (ey * s.W + ex) * 4, d = x.getImageData(Math.floor(qx * k), Math.floor(qy * k), 1, 1).data;
      pts.push({ name, at: [Math.round(qx), Math.round(qy)], got: [d[0], d[1], d[2]], want: [D[i], D[i + 1], D[i + 2]], diff: Math.max(Math.abs(d[0] - D[i]), Math.abs(d[1] - D[i + 1]), Math.abs(d[2] - D[i + 2])) });
    };
    if (s.SX >= 1) { const ex = Math.floor((s.SX - 1) / 2); add('left top', ex, 1); add('left middle', ex, s.R0 + 160); add('left bottom', ex, vis); }
    if (s.SXR >= 1) { const ex = s.SX + 180 + Math.floor(s.SXR / 2); add('right top', ex, 1); add('right middle', ex, s.R0 + 160); add('right bottom', ex, vis); }
    return pts;
  };
}
async function phoneChecks(p, ph, f, sec) {
  const S = (n) => sec || n, on = (n) => !!sec || W(n), s = f.s || {}, nm = ph.name;
  if (!f.on) { ok(`${S('fill')}: ${nm} (${f.vw}×${f.vh}) — FILL is on`, false, f); return; }
  if (on('fill')) {
    ok(`${S('fill')}: ${nm} (${f.vw}×${f.vh}) — FILL is on, html.fill, #ext is shown`, f.cls && f.disp === 'block', f);
    const e = f.er, u = s.u, H = s.fullH, cover = e.l <= 0.5 && e.t <= 0.5 && e.r >= f.vw - 0.5 && e.b >= H - 0.5;
    const tight = e.l > -u - 0.01 && e.t > -u - 0.01 && e.r < f.vw + u + 0.01 && e.b < H + u + 0.01, placed = Math.abs(f.cr.l - (e.l + s.SX * u)) < 0.6 && Math.abs(f.cr.t - (e.t + s.R0 * u)) < 0.6;
    ok(`${S('fill')}: ${nm} — #ext covers the whole screen ${f.vw}×${H} (${[e.l, e.t, e.r, e.b].map((v) => Math.round(v * 10) / 10).join(', ')}), at most 1 art px (${u}) past it; the picture sits at (${s.SX}, ${s.R0}) of its ${s.W}×${s.H}`, cover && tight && placed, { cover, tight, placed, e, cr: f.cr, s });
    ok(`${S('fill')}: ${nm} — no holes outside the picture (${f.holes0} as the game's own loop left it, ${f.holes} after a redraw)`, f.holes0 === 0 && f.holes === 0, { holes0: f.holes0, holes: f.holes });
    const png = await p.screenshot({ scale: 'css' }), file = `r28_${sec ? 'wk_' : ''}${ph.id}.png`; fs.mkdirSync(LOOK, { recursive: true }); fs.writeFileSync(path.join(LOOK, file), png);
    const pts = await E(p, (b) => __shot(b), png.toString('base64')), d = Math.max(0, ...pts.map((q) => q.diff));
    if (pts.length) ok(`${S('fill')}: ${nm} — at the screen's edges the phone shows #ext (${pts.length} points, Δ ≤ ${d}; test/look/${file})`, pts.length >= 4 && d <= 8, pts);
    else ok(`${S('fill')}: ${nm} — no side gaps here, the screenshot check is skipped (test/look/${file})`, true);
  }
  if (on('bands')) {
    if (f.top) { const k = f.top.far / f.top.near; ok(`${S('bands')}: ${nm} — above the picture: the ceiling's own colours right above it (${f.top.off} other px), ${pct(k)} natural ceiling brightness at the screen's top`, f.top.off === 0 && k >= 0.9 && k <= 1.1, { ...f.top, row: undefined }); }
    else ok(`${S('bands')}: ${nm} — the picture starts at the screen's top (${s.R0} rows above it)`, s.R0 < 2, s);
    if (f.bot) {
      const k = f.bot.med / f.bot.foot, d = dmax(f.bgRgb, f.bot.last);
      ok(`${S('bands')}: ${nm} — below: the floor going on (${f.bot.cols} colours in its first row: not one flat colour), ${pct(k)} as bright as the floor in the picture`, f.bot.cols >= 2 && k >= 0.7 && k <= 1.25, f.bot);
      ok(`${S('bands')}: ${nm} — the page background is the floor's colour (${f.bg} vs its last rows rgb(${f.bot.last}), Δ ${d})`, d <= 16, { bg: f.bg, last: f.bot.last });
    } else ok(`${S('bands')}: ${nm} — the picture ends at the screen's bottom (${s.R1} rows below it)`, !s.R1, s);
  }
  if (on('sides')) {
    if (f.mir.n) ok(`${S('sides')}: ${nm} — the side gaps (${s.SX} + ${s.SXR} art px) are the picture's edge columns mirrored (${f.mir.bad} of ${f.mir.n} px differ)`, f.mir.bad === 0 && f.mir.n === 320 * (s.SX + s.SXR), f.mir);
    else ok(`${S('sides')}: ${nm} — no side gaps on this screen`, true);
  }
}
async function roomsCheck(p, ph) {
  const ids = await E(p, () => __game.DATA.ROOMS.map((r) => r.id));
  ok(`rooms: the flat's rooms (${ids.join(', ')})`, ids.length >= 3, ids);
  for (const id of ids) {
    await E(p, (id) => __game.HOME.goTo(id, true), id); await p.waitForTimeout(700);
    const f = await E(p, () => __fill()), t = f.top || {}, b = f.bot || {}, kt = t.far / t.near, kb = b.med / b.foot, d = dmax(f.bgRgb, b.last);
    ok(`rooms: ${id} (${ph.name}) — no holes (${f.holes0}/${f.holes}); above: the ceiling's colours (${t.off} other px), ${pct(kt)} natural ceiling; below: the floor (${b.cols} colours, ${pct(kb)} as bright); the background Δ ${d}`,
      f.room === id && f.holes0 === 0 && f.holes === 0 && t.off === 0 && kt >= 0.9 && kt <= 1.1 && b.cols >= 2 && kb >= 0.7 && kb <= 1.25 && d <= 16, { room: f.room, cam: f.cam, top: { ...t, row: undefined }, bot: b, bg: f.bg });
  }
}
async function modalCheck(p, ph) {
  const a = await E(p, () => __fill());
  await E(p, () => { __game.UI.modal('<p>r28</p>'); }); await p.waitForTimeout(400);
  const d = await E(p, () => __fill());
  await E(p, () => __game.UI.closeModal()); await p.waitForTimeout(400);
  const b = await E(p, () => __fill());
  if (!a.top || !a.bot || !d.top || !d.bot || !b.top) { ok(`modal: ${ph.name} — FILL is on with bands above and below`, false, { a, d }); return; }
  const kt = d.top.near / a.top.near, kb = d.bot.med / a.bot.med, ks = a.mir.lum ? d.mir.lum / a.mir.lum : 0.45, kg = lumA(d.bgRgb) / lumA(a.bgRgb), dim = (k) => k > 0.3 && k < 0.6;
  ok(`modal: ${ph.name} — a window dims the band above to ${pct(kt)}, the floor below to ${pct(kb)}, the sides to ${pct(ks)}, the page background to ${pct(kg)}`, d.modal && dim(kt) && dim(kb) && dim(ks) && kg > 0.3 && kg < 0.5, { kt, kb, ks, kg, a: a.bg, d: d.bg });
  ok(`modal: ${ph.name} — closed: the same pixels are back above the picture (${b.top.row === a.top.row ? 'the same' : 'different'}) and the background (Δ ${dmax(a.bgRgb, b.bgRgb)})`, !b.modal && b.top.row === a.top.row && dmax(a.bgRgb, b.bgRgb) <= 3, { a: a.bg, b: b.bg });
}
async function sheetCheck(p, ph) {
  await E(p, () => __game.UI.openShop('food')); await p.waitForTimeout(900);
  const o = await E(p, () => __fill());
  await E(p, () => __game.UI.closeSheet()); await p.waitForTimeout(900);
  const c = await E(p, () => __fill());
  if (!o.bot) { ok(`sheet: ${ph.name} — FILL is on with a band below`, false, o); return; }
  const sc = o.sheetRgb;
  ok(`sheet: ${ph.name} — the shop sheet (${o.sheetBg}) goes on down to the screen's bottom: below the picture rgb(${o.bot.mid}), at the sides rgb(${o.mir.low}), the page background ${o.bg}`,
    o.sheet && /^rgb\(/.test(o.sheetBg || '') && near(o.bot.mid, sc, 1) && (!o.mir.low || near(o.mir.low, sc, 1)) && near(o.bgRgb, sc, 1), o);
  ok(`sheet: ${ph.name} — closed: the floor is back below (${c.bot && c.bot.cols} colours), the background is the floor's again (${c.bg})`, !c.sheet && !!c.bot && c.bot.cols >= 2 && !near(c.bgRgb, sc, 2), { bot: c.bot, bg: c.bg });
}
async function slideCheck(p, ph) {
  const r = await E(p, () => { const H = __game.HOME, ids = __game.DATA.ROOMS.map((x) => x.id), from = H.room, to = ids[(ids.indexOf(from) + 1) % ids.length]; H.goTo(to); __adv(150); return { from, to, sl: H.slide(), f: __fill() }; });
  const f = r.f, k = f.bot ? f.bot.med / f.bot.foot : NaN;
  ok(`slide: ${ph.name} — mid-slide ${r.from} → ${r.to} (${r.sl ? pct(r.sl.e) : 'no slide'}) the floor below has no holes (${f.holes}) and isn't dark (${pct(k)} of the picture's floor)`, !!r.sl && r.sl.e > 0.05 && r.sl.e < 0.95 && f.holes === 0 && k >= 0.6, { from: r.from, to: r.to, sl: r.sl, holes: f.holes, bot: f.bot });
  await p.waitForTimeout(1200);
}
(async () => {
  // ================= Round 28: the speed checks on a slower machine (test/lib/speed.js for r19's first frame, r20's idle home, inv's fps) =================
  if (W('speed')) {
    let SP = {}; try { SP = require('./lib/speed.js'); } catch (e) { SP = { err: e.message.split('\n')[0] }; }
    const A55 = Array(4).fill({ model: 'Cortex-A55' }), X86 = Array(8).fill({ model: 'Intel(R) Xeon(R) Platinum 8375C CPU @ 2.90GHz' });
    const pick = (o) => { try { return SP.pick(o); } catch (e) { return 'throws: ' + e.message; } };
    const ids = { a55: pick({ env: '', arch: 'arm64', cpus: A55 }), x86: pick({ env: '', arch: 'x64', cpus: X86 }), m2: pick({ env: '', arch: 'arm64', cpus: Array(8).fill({ model: 'Apple M2' }) }),
      forced: pick({ env: 'ref', arch: 'arm64', cpus: A55 }), bad: pick({ env: 'fast', arch: 'x64', cpus: X86 }) };
    ok(`speed: the profile goes by the machine — 4× Cortex-A55 → «${ids.a55}», an x86 box → «${ids.x86}», any other (8× Apple M2) → «${ids.m2}», the sandbox's limits; ABI_SPEED=ref wins (${ids.forced}), an unknown one is an error`,
      ids.a55 === 'a55' && ids.x86 === 'ref' && ids.m2 === 'ref' && ids.forced === 'ref' && /^throws: ABI_SPEED=fast/.test(ids.bad), SP.err || ids);
    const mk = (id) => { try { return SP.make(id); } catch (e) { return null; } }, ref = mk('ref'), a = mk('a55');
    ok(`speed: «ref» (the x86 sandbox) keeps its limits as they were — the first frame ×${ref && ref.start(1)} (CPU ×1) / ×${ref && ref.start(4)} (CPU ×4), a mid phone = CPU ×${ref && ref.mid.rate} with its limits ×${ref && ref.mid.k}`,
      !!ref && ref.start(1) === 1 && ref.start(4) === 1 && ref.mid.rate === 4 && ref.mid.k === 1, SP.err || (ref && ref.mid));
    // the profiles hold the measurements on record: the same R21 code (67a47a4) through tools/perf.js, the best of the rounds
    const runs = (f) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'look', f), 'utf8')).runs; } catch (e) { return []; } };
    const best = (files, cpu, get) => Math.min(...files.flatMap(runs).filter((r) => r.cpu === cpu).map(get));
    const X = ['r19_perf_r21.json'], A = ['r19_perf_armbian_r21_1.json', 'r19_perf_armbian_r21_2.json'], m = SP.measured || {};
    const rec = (F) => ({ ready1: best(F, 1, (r) => r.ready), ready4: best(F, 4, (r) => r.ready), home1: best(F, 1, (r) => r.home.busy), home4: best(F, 4, (r) => r.home.busy) }), R0 = { ref: rec(X), a55: rec(A) };
    const same = ['ref', 'a55'].every((id) => !!m[id] && ['ready1', 'ready4', 'home1', 'home4'].every((k) => m[id][k] === R0[id][k]));
    ok(`speed: the profiles hold what was measured on the same R21 code — the first frame ${R0.a55.ready1} vs ${R0.ref.ready1} ms (CPU ×1), ${R0.a55.ready4} vs ${R0.ref.ready4} ms (×4); idle at home ${R0.a55.home1}% busy at ×1 vs a mid phone's ${R0.ref.home4}%`, same, { m, R0 });
    ok(`speed: on «a55» a mid phone is CPU ×${a && a.mid.rate} (even unthrottled the box is slower than one), its busy/fps limits ×${a && a.mid.k.toFixed(2)}; the first frame's ×${a && a.start(1).toFixed(2)} / ×${a && a.start(4).toFixed(2)}`,
      !!a && a.mid.rate === 1 && a.mid.k > 1.5 && a.mid.k < 2.5 && a.start(1) > 3 && a.start(4) > a.start(1), SP.err || (a && a.mid));
    const os = require('os'), c = os.cpus(); console.log(`speed: this machine — ${os.arch()}, ${c.length}× ${c[0] && c[0].model} → ${SP.line ? SP.line() : SP.err}`);
  }
  // ================= Round 28: test/lib/h.js opens the build next to it =================
  // It opened /data/game/dist (master's) from any checkout, so the h.js tests run in a worktree tested master's build: a slowed-down
  // dist in the worktree (the busymut check) went unnoticed by inv's fps.
  if (W('paths')) {
    const { open } = require('./lib/h.js'), urls = [];
    for (const file of [null, 'abibyan-test.html']) { const r = await open(file ? { file, keepModals: true } : { keepModals: true }); urls.push(r.page.url()); await r.browser.close(); }
    ok(`paths: h.js opens this checkout's build (${urls[0]})`, urls[0] === 'file://' + path.join(ROOT, 'dist', 'index.html'), urls[0]);
    ok(`paths: …and with opts.file too (${urls[1]})`, urls[1] === 'file://' + path.join(ROOT, 'dist', 'abibyan-test.html'), urls[1]);
  }
  browser = await launch(); const R = {};
  if (['fill', 'bands', 'sides', 'rooms', 'modal', 'sheet', 'slide', 'home26'].some((n) => W(n))) for (const ph of PHONES) {
    const ctx = await ctxFor(browser, ph), p = await page0(ctx, ph), f = await E(p, () => __fill()); R[ph.id] = f;
    await phoneChecks(p, ph, f);
    if (ph.id === 'ip17_home') { if (W('rooms')) await roomsCheck(p, ph); if (W('modal')) await modalCheck(p, ph); if (W('sheet')) await sheetCheck(p, ph); if (W('slide')) await slideCheck(p, ph); }
    await ctx.close();
  }
  if (W('home26')) {
    const f = R.ip17_home26;
    if (!f || !f.on) ok('home26: iOS 26 from the home screen — FILL is on', false, f);
    else ok(`home26: iOS 26 from the home screen (the window ${f.vw}×${f.vh}, the screen ${f.scrH}) — #ext goes down to the screen's bottom (FILL's height ${f.s.fullH}, #ext ends at ${Math.round(f.er.b)}), the buttons stay in the window (the lowest of ${f.btnN} ends at ${Math.round(f.btnMax)})`,
      f.s.fullH === f.scrH && f.er.b >= f.scrH - 0.5 && f.btnMax <= f.vh + 0.5 && f.btnMax > f.vh * 0.8, { s: f.s, er: f.er, btnMax: f.btnMax, btnN: f.btnN });
    for (const ph of [{ ...PHONES[2], id: 'ip17_short_safari', name: 'то же окно в Safari (не с экрана «Домой»)', standalone: false }, { ...PHONES[2], id: 'android_short', name: 'то же окно с экрана «Домой», но не iOS', ua: AND_UA }]) {
      const ctx = await ctxFor(browser, ph), p = await page0(ctx, ph), g = await E(p, () => __fill());
      ok(`home26: ${ph.name} — #ext only down to the window (FILL's height ${g.s ? g.s.fullH : '—'} for the window's ${g.vh})`, g.on && g.s.fullH === g.vh && g.er.b < g.vh + g.s.u + 0.01, { s: g.s, er: g.er });
      await ctx.close();
    }
  }
  if (W('off')) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }), p = await page0(ctx, { id: 'desktop' }), f = await E(p, () => __fill());
    ok('off: a desktop window (1280×800) — FILL is off, no html.fill, #ext hidden, the page background untouched', !f.on && !f.cls && f.disp === 'none' && f.bg === '', f); await ctx.close();
    // a phone with rows below the picture (from the home screen): in Safari the iPhone 17's picture ends at the screen's bottom, and with no rows below FILL never sets the page background (botBand returns), nothing to reset
    const ph = PHONES[1], c2 = await ctxFor(browser, ph), q = await page0(c2, ph), a = await E(q, () => __fill()), vp = q.viewportSize();
    await q.setViewportSize({ width: vp.height, height: vp.width }); await q.waitForTimeout(700); const l = await E(q, () => __fill());
    await q.setViewportSize(vp); await q.waitForTimeout(700); const b = await E(q, () => __fill());
    ok(`off: ${ph.name} turned to landscape (${l.vw}×${l.vh}) — FILL goes off, the page background (${a.bg}) is reset (${JSON.stringify(l.bg)}); back in portrait it is on again with the same background (${b.bg})`,
      a.on && !!a.bg && !l.on && !l.cls && l.disp === 'none' && l.bg === '' && b.on && b.cls && !!b.bg && dmax(a.bgRgb, b.bgRgb) <= 3, { a: a.bg, l, b: b.bg }); await c2.close();
  }
  if (W('webkit')) {
    const WK = webkit();
    if (!WK) ok('webkit: SKIPPED — no WebKit runtime here (tools/webkit_setup.sh sets it up)', true);
    else {
      const wb = await WK.launch();
      try {
        for (const ph0 of [PHONES[0], PHONES[2]]) {
          const ph = { ...ph0, wk: true }, ctx = await ctxFor(wb, ph), p = await page0(ctx, ph), f = await E(p, () => __fill());
          await phoneChecks(p, ph, f, 'webkit');
          if (ph.standalone && f.on) ok(`webkit: ${ph.name} — #ext goes down to the screen's bottom (FILL's height ${f.s.fullH} of ${f.scrH})`, f.s.fullH === f.scrH && f.er.b >= f.scrH - 0.5, { s: f.s, er: f.er });
          await ctx.close();
        }
      } finally { await wb.close(); }
    }
  }
  return done(errs, browser);
})().catch(async (e) => { ok('r28 ran to the end: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '), false); if (browser) await browser.close().catch(() => { }); process.exit(1); });
