// Round 24: node test/r24.js [card,url,harder,iphone,webkit,private,look] → exit 1 on fail.
// (1) the card is signed «С любовью, твой Loveашик»; (2) the GitHub repo is «abibyan» again (https://emoorpheus.github.io/abibyan/);
// (3) the hearts are a bit harder to find (less of each shows, a rarer glint, a closer tap to make it glint, his help comes later);
// (4) the iPhone 17 family: Safari and «На экран Домой» (Dynamic Island / home bar safe areas), real finger taps — in Chromium with
// the iPhone profiles AND in WebKit (Safari's engine, test/lib/webkit.js); (5) a quiet release: the site is not indexed (noindex),
// docs/PRIVATE_RELEASE.md explains how to open it only by the link, and the site works from a domain's root too (Netlify / Cloudflare).
const { chromium, devices } = require('/vercel/sandbox/node_modules/playwright');
const { ok, done, want, fs, PAGE_HELPERS, SITE_URL, OLD_NAMES } = require('./lib/h.js');
const { webkit } = require('./lib/webkit.js');
const path = require('path'), { spawn, spawnSync } = require('child_process');
const W = want(), ROOT = path.join(__dirname, '..'), DIST = path.join(ROOT, 'dist'), FILE = 'file://' + path.join(DIST, 'index.html'), TFILE = 'file://' + path.join(DIST, 'abibyan-test.html');
const ONE = 'file://' + path.join(DIST, 'abibyan.html'), LOOK = path.join(ROOT, 'test', 'look'), PORT = 8773;
const errs = []; let browser = null, srv = null;
const day = (y, m, d, h = 13) => new Date(y, m - 1, d, h, 0);
const launch = () => chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
// the iPhone 17 family: in Safari (the viewport under the address bar — Playwright's profiles) and from the home screen (the whole
// screen; the Dynamic Island on top, the home bar below: safe areas 62 / 34 pt; the 17e has a notch: 47 / 34)
const PHONES = [
  { id: 'ip17_safari', name: 'iPhone 17 в Safari', dev: 'iPhone 17' },
  { id: 'ip17_home', name: 'iPhone 17 с экрана «Домой»', dev: 'iPhone 17', vp: { width: 402, height: 874 }, ins: { top: 62, bottom: 34, left: 0, right: 0 } },
  { id: 'ip17pm_home', name: 'iPhone 17 Pro Max с экрана «Домой»', dev: 'iPhone 17 Pro Max', vp: { width: 440, height: 956 }, ins: { top: 62, bottom: 34, left: 0, right: 0 } },
  { id: 'ip17e_safari', name: 'iPhone 17e в Safari', dev: 'iPhone 17e' },
  { id: 'ip17e_home', name: 'iPhone 17e с экрана «Домой»', dev: 'iPhone 17e', vp: { width: 390, height: 844 }, ins: { top: 47, bottom: 34, left: 0, right: 0 } },
];
async function phoneCtx(b, ph) { const d = devices[ph.dev]; const ctx = await b.newContext({ ...d, userAgent: IOS_UA, ...(ph.vp ? { viewport: ph.vp, screen: { width: ph.vp.width, height: ph.vp.height } } : {}) }); return ctx; }
async function page0(ctx, o = {}) { // o.date = a fixed clock; o.nodate = the test build without its 21.11; o.ins = safe areas (Chromium)
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push('pageerror: ' + e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 3).join(' | '))); page.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_FILE_NOT_FOUND|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  if (o.ins) { const c = await ctx.newCDPSession(page); await c.send('Emulation.setSafeAreaInsetsOverride', { insets: o.ins }); }
  if (o.date) await page.clock.setFixedTime(o.date);
  if (o.nodate) await page.addInitScript(() => { window.ABI_NODATE = 1; });
  await page.goto(o.url || FILE, { waitUntil: 'load', timeout: 90000 }); await page.waitForFunction(() => window.__game && __game.APP, null, { timeout: 30000 }); await page.waitForTimeout(800);
  await page.evaluate(PAGE_HELPERS); return page;
}
const E = (page, fn, a) => page.evaluate(fn, a);
const serve = async (dir) => { if (srv) return; srv = spawn('python3', ['-m', 'http.server', String(PORT), '-d', dir], { stdio: 'ignore' }); await new Promise((r) => setTimeout(r, 900)); };
const RECTS = () => { const R = (q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? { l: b.left, t: b.top, r: b.right, b: b.bottom } : null; }; return { cv: R('#cv'), hud: R('#hud'), bar: R('#bar'), tut: R('#tut'), w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight }; };
// a scene point → where a finger touches the screen
const toClient = (p, x, y) => E(p, ([x, y]) => { const r = document.getElementById('cv').getBoundingClientRect(), k = r.width / 180; return [r.left + x * k, r.top + y * k]; }, [x, y]);
const center = (p, sel) => E(p, (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return r.width ? [r.left + r.width / 2, r.top + r.height / 2] : null; }, sel);
const fingerTap = async (p, xy) => { if (!xy) return false; await p.touchscreen.tap(xy[0], xy[1]); await p.waitForTimeout(120); return true; };
// a heart's spot in the test build: the first n-1 found → №n is the hidden one
const heartN = (p, n) => E(p, (n) => { const G = __game, S = G.GAME.S, all = G.DATA.DASHA.secrets.map((x) => x.n); S.dasha.found = {}; for (const k of all) if (k < n) S.dasha.found[k] = 1; const h = G.DASHA.current(); if (h) { G.HOME.goTo(h.room, true); __adv(700); } return h; }, n);
// how much of each heart shows (the same measure as test/r23.js «hide»): the sum of its pixels' change over a plain heart drawn on top
const MEASURE = () => { const G = __game, D = G.DASHA, C = G.DATA.DASHA, S = G.GAME.S, cv = document.getElementById('cv'), ctx = cv.getContext('2d'), out = [];
  const dbg = D.dbg || {}; dbg.glint = false; const rh = D.hideMk, rf = G.FRIENDS.render; D.hideMk = () => true; G.FRIENDS.render = function () { };
  const frame = () => { G.HOME.render(ctx); return ctx.getImageData(0, 0, 180, 320).data; }, dpx = (a, b, i) => Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
  const all = C.secrets.map((x) => x.n);
  for (const n of all) { S.dasha.found = {}; for (const k of all) if (k < n) S.dasha.found[k] = 1; const h = D.current(); if (!h) { out.push({ n, v: 0, px: 0 }); continue; } G.HOME.goTo(h.room, true); __adv(700);
    dbg.off = true; const z = frame(); dbg.off = false; const a = frame(); dbg.plain = true; const b = frame(); dbg.plain = false; let sa = 0, sb = 0, na = 0;
    for (let y = Math.max(0, h.y - 8); y < Math.min(320, h.y + 8); y++) for (let x = Math.max(0, h.x - 8); x < Math.min(180, h.x + 8); x++) { const i = (y * 180 + x) * 4, da = dpx(a, z, i); sa += da; sb += dpx(b, z, i); if (da > 24) na++; }
    out.push({ n, spot: h.spot, v: sb ? Math.round(sa / sb * 100) / 100 : 0, px: na }); }
  D.hideMk = rh; G.FRIENDS.render = rf; S.dasha.found = {}; dbg.glint = true; return out; };
// the glint: how many times it flashes in a minute where the heart is (nothing else touched)
const GLINTS = () => { const G = __game, D = G.DASHA, cv = document.getElementById('cv'), ctx = cv.getContext('2d'), h = D.current(); G.HOME.goTo(h.room, true); __adv(700); D.down(1, 319); // a fresh touch: no «Тепло» (and its glint) during the minute
  const rh = D.hideMk, rf = G.FRIENDS.render; D.hideMk = () => true; G.FRIENDS.render = function () { };
  const box = () => { G.HOME.render(ctx); return ctx.getImageData(h.x - 6, h.y - 6, 13, 12).data; }; D.dbg.glint = false; __adv(50); const z = box(); D.dbg.glint = true;
  let on = false, n = 0; for (let t = 0; t < 60000; t += 50) { __adv(50); const a = box(); let d = 0; for (let i = 0; i < a.length; i += 4) d += Math.abs(a[i] - z[i]) + Math.abs(a[i + 1] - z[i + 1]) + Math.abs(a[i + 2] - z[i + 2]); const g = d > 60 && d < 4000; if (g && !on) n++; on = g; } // a glint = ≤ 5 light pixels (≤ 3825); something big passing by (a lively moment) is not a glint
  D.hideMk = rh; G.FRIENDS.render = rf; return { n, room: h.room }; };
const NEAR = (dx) => { const G = __game, D = G.DASHA, cv = document.getElementById('cv'), ctx = cv.getContext('2d'), h = D.current(); G.HOME.goTo(h.room, true); __adv(1500);
  const rh = D.hideMk; D.hideMk = () => true; D.dbg.glint = false; G.HOME.render(ctx); const z = ctx.getImageData(h.x - 6, h.y - 6, 13, 12).data; D.dbg.glint = true;
  // wait for a quiet moment (not the periodic glint), then a tap dx px off
  let got = false; for (let k = 0; k < 400 && !got; k++) { __adv(50); G.HOME.render(ctx); const a = ctx.getImageData(h.x - 6, h.y - 6, 13, 12).data; let d = 0; for (let i = 0; i < a.length; i += 4) d += Math.abs(a[i] - z[i]); if (d === 0 && k > 10) got = true; }
  D.hit(h.room, h.x + dx, h.y); let seen = false; for (let k = 0; k < 6; k++) { __adv(50); G.HOME.render(ctx); const a = ctx.getImageData(h.x - 6, h.y - 6, 13, 12).data; let d = 0; for (let i = 0; i < a.length; i += 4) d += Math.abs(a[i] - z[i]) + Math.abs(a[i + 1] - z[i + 1]) + Math.abs(a[i + 2] - z[i + 2]); if (d > 60) seen = true; }
  D.hideMk = rh; return seen; };
async function heartsPage(ctx, o = {}) { const q = await page0(ctx, { date: day(2026, 11, 15), url: TFILE, nodate: true, ...o }); await E(q, () => { const b = document.querySelector('#nm-ok'); if (b) b.click(); }); await q.waitForTimeout(400); await E(q, PAGE_HELPERS); await E(q, () => { __calm(); __game.GAME.S.tut = __game.DATA.TUT.length; __game.GAME.S.dasha.seen = 1; while (__game.UI.hasModal()) __game.UI.closeModal(); __adv(3000); while (__game.UI.hasModal()) __game.UI.closeModal(); }); return q; }
// the gift on the first start, with a finger: «Открыть» → home + the tutorial card
async function giftByFinger(p) { const xy = await center(p, '#nm-ok'); const had = !!xy; await fingerTap(p, xy); await p.waitForTimeout(500); return { had, open: await E(p, () => !document.querySelector('#nm-ok') && !!__game.GAME.S.dasha && !!__game.GAME.S.dasha.gift) }; }
// her party with fingers: «Пальцем», then a tap on every lit candle
async function partyByFinger(p) {
  const st = await E(p, () => { for (let t = 0; t < 70000; t += 50) { __adv(50); if (__game.DASHA.blowInfo() && document.querySelector('#blow-finger')) return t; if (__game.UI.hasModal()) __game.UI.closeModal(); } return -1; });
  if (st < 0) return { st };
  await fingerTap(p, await center(p, '#blow-finger')); const mode = await E(p, () => (__game.DASHA.blowInfo() || {}).mode);
  for (let k = 0; k < 8; k++) { const L = await E(p, () => __game.DASHA.candles().filter((c) => c.lit)); if (!L.length) break; for (const c of L) { await fingerTap(p, await toClient(p, c.x, c.y)); } await E(p, () => __adv(200)); }
  const left = await E(p, () => { const b = __game.DASHA.blowInfo(); return b ? b.lit : 0; });
  return { st, mode, left };
}
(async () => {
  try {
    fs.mkdirSync(LOOK, { recursive: true });
    // ================= 1. the card: «С любовью, твой Loveашик» =================
    if (W('card') || W('url')) {
      const r = spawnSync('python3', [path.join(ROOT, 'tools', 'card.py')], { encoding: 'utf8' });
      const txt = spawnSync('pdftotext', ['-layout', path.join(DIST, 'abibyan-card.pdf'), '-'], { encoding: 'utf8' }).stdout;
      const side = fs.existsSync(path.join(DIST, 'card', 'card-side.html')) ? fs.readFileSync(path.join(DIST, 'card', 'card-side.html'), 'utf8') : '';
      const line = (txt.split('\n').find((l) => /С любовью/.test(l)) || '').trim();
      ok(`card: signed on one line — «${line}»`, r.status === 0 && /С любовью,\s+твой Loveашик/.test(line), (r.stderr || '').slice(-300));
      ok('card: no empty line to sign by hand any more', !/\.sig span\{[^}]*dashed/.test(side) && /твой Loveашик/.test(side), side.length);
    }
    // ================= 2. the repo is «abibyan» =================
    if (W('url')) {
      const g = fs.readFileSync(path.join(ROOT, 'docs', 'GITHUB_PAGES.md'), 'utf8');
      const stale = spawnSync('grep', ['-rlnE', '--exclude-dir=superpowers', OLD_NAMES.join('|'), 'src', 'docs', 'tools', 'build.py', 'test/r22.js', 'test/r23.js', 'test/r24.js', 'test/lib'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim().split('\n').filter((f) => f && f !== 'test/r24.js' && f !== 'test/lib/h.js').join(', ');
      ok(`url: docs/GITHUB_PAGES.md — ${SITE_URL} and ${SITE_URL}test.html; «${OLD_NAMES[0]}» nowhere (${stale || 'clean'})`, g.includes(SITE_URL) && g.includes(SITE_URL + 'test.html') && !stale, { stale });
      const png = path.join(DIST, 'abibyan-card.png');
      const qd = spawnSync('python3', ['-c', `import cv2; im = cv2.imread('${png}'); print(cv2.QRCodeDetector().detectAndDecode(im)[0])`], { encoding: 'utf8' });
      const txt = spawnSync('pdftotext', [path.join(DIST, 'abibyan-card.pdf'), '-'], { encoding: 'utf8' }).stdout;
      ok(`url: the card's QR code opens ${qd.stdout.trim()}; the card says github.io/abibyan`, qd.stdout.trim() === SITE_URL && /github\.io\/abibyan/.test(txt) && !new RegExp(OLD_NAMES.join('|')).test(txt), qd.stderr.slice(-200));
    }
    // ================= 3. a bit harder to find =================
    if (W('harder') || W('look')) {
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const q = await heartsPage(ctx);
      const sp = await E(q, MEASURE), avg = (a) => a.reduce((x, s) => x + s.v, 0) / a.length, e6 = avg(sp.slice(0, 6)), l6 = avg(sp.slice(-6)), all = avg(sp), mx = Math.max(...sp.map((s) => s.v));
      const vs = sp.map((s) => s.n + ':' + s.v).join(' ');
      ok(`harder: less of each heart shows — at most 60 % (most: ${Math.round(mx * 100)} %), ${Math.round(all * 100)} % on average (was 52 %) [${vs}]`, mx <= 0.6 && all <= 0.45, vs);
      ok(`harder: still easier first — the first 6 show ${Math.round(e6 * 100)} %, the last 6 ${Math.round(l6 * 100)} % (≤ 38 %); none lost (≥ 12 %, ≥ 5 px)`, l6 <= 0.38 && e6 >= l6 + 0.08 && sp.every((s) => s.v >= 0.12 && s.px >= 5), { e6, l6, lost: sp.filter((s) => s.v < 0.12 || s.px < 5) });
      await heartN(q, 1); const g = await E(q, GLINTS);
      ok(`harder: it glints ${g.n} times a minute by itself (was 9; 3…5 now)`, g.n >= 3 && g.n <= 5, g);
      await heartN(q, 1); const far = await E(q, NEAR, 20); await heartN(q, 1); const near = await E(q, NEAR, 12);
      ok(`harder: a tap 20 px off — no glint (${far}); 12 px off — it glints (${near})`, !far && near, { far, near });
      await heartN(q, 1);
      const h = await E(q, () => { __game.DASHA.down(1, 319); __spy(); const L = () => __game.AUDIO._said.filter((t) => /Тепло|Горячо|Холодно|Загляни/.test(t)).length; __game.AUDIO._said.length = 0; __adv(80000); const a = L(); __adv(20000); return { at80: a, at100: L(), said: __game.AUDIO._said.slice(-3) }; });
      ok(`harder: he helps later — nothing in 80 s, «Тепло» by 100 s (${h.said.join(' | ')})`, h.at80 === 0 && h.at100 >= 1, h);
      await browser.close(); browser = null;
    }
    // ================= 4. iPhone 17 (Chromium with the iPhone profiles): fits the safe areas, real finger taps all the way =================
    if (W('iphone') || W('look')) {
      browser = await launch();
      for (const ph of PHONES) {
        const ctx = await phoneCtx(browser, ph); const p = await page0(ctx, { date: day(2026, 11, 15), ins: ph.ins });
        const ins = ph.ins || { top: 0, bottom: 0 };
        const g0 = await E(p, RECTS); const gift = await giftByFinger(p); await E(p, () => { __adv(2500); }); const g = await E(p, RECTS);
        const inside = (r) => r && r.t >= ins.top - 0.5 && r.b <= g.h - ins.bottom + 0.5 && r.l >= -0.5 && r.r <= g.w + 0.5;
        ok(`${ph.id}: ${ph.name} (${g.w}×${g.h}) — the gift opened with a finger; the scene, the top panel and the bottom bar are inside the safe area (top ${ins.top}, bottom ${ins.bottom}); nothing scrolls`, gift.had && gift.open && inside(g.cv) && inside(g.hud) && inside(g.bar) && g.sw <= g.w && g.sh <= g.h && g0.sh <= g0.h, { gift, g, ins });
        ok(`${ph.id}: the tutorial card sits under the top panel`, !!g.tut && g.tut.t >= g.hud.b - 1 && g.tut.b < g.bar.t, g.tut);
        // the buttons a finger presses: ≥ 36 px (≈ 1 cm); text fields: ≥ 16 px (smaller ones make iOS zoom in)
        const sz = await E(p, () => { const L = [...document.querySelectorAll('#hud button, #hud .btn, #bar button, #bar .btn')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => { const r = e.getBoundingClientRect(); return { id: e.id || e.className, w: Math.round(r.width), h: Math.round(r.height) }; });
          __game.UI.askName(false); const nm = document.querySelector('#nm'); const fsN = nm ? parseFloat(getComputedStyle(nm).fontSize) : 0; while (__game.UI.hasModal()) __game.UI.closeModal();
          const box = document.createElement('div'); box.className = 'mbox'; box.innerHTML = '<textarea></textarea><input type="text">'; document.getElementById('ui').appendChild(box); const fsT = parseFloat(getComputedStyle(box.querySelector('textarea')).fontSize), fsI = parseFloat(getComputedStyle(box.querySelector('input')).fontSize); box.remove();
          return { small: L.filter((b) => b.w < 36 || b.h < 36), n: L.length, fsN, fsT, fsI }; });
        ok(`${ph.id}: ${sz.n} buttons all ≥ 36 px; text fields ${sz.fsN}/${sz.fsI}/${sz.fsT} px ≥ 16 (no zoom on typing)`, sz.n >= 6 && !sz.small.length && sz.fsN >= 16 && sz.fsI >= 16 && sz.fsT >= 16, sz);
        if (W('look')) await p.screenshot({ path: path.join(LOOK, `r24_${ph.id}.png`) });
        await ctx.close();
        // the hearts (the test build): none under the panels on this screen; a finger on the hidden one opens its note
        const ctx2 = await phoneCtx(browser, ph); const q = await heartsPage(ctx2, { ins: ph.ins });
        const u = await E(q, () => { const G = __game, D = G.DASHA, S = G.GAME.S, cv = document.getElementById('cv'), r = cv.getBoundingClientRect(), k = r.width / 180, all = G.DATA.DASHA.secrets.map((x) => x.n), bad = [];
          const R = (q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? b : null; };
          for (const n of all) { S.dasha.found = {}; for (const q of all) if (q < n) S.dasha.found[q] = 1; const h = D.current(); if (!h) continue; G.HOME.goTo(h.room, true); __adv(700);
            const X = r.left + h.x * k, Y = r.top + h.y * k, e = document.elementFromPoint(X, Y), over = ['#hud', '#bar'].filter((q) => { const b = R(q); return b && X >= b.left && X <= b.right && Y >= b.top - 3 * k && Y <= b.bottom + 3 * k; });
            if (e !== cv || over.length) bad.push(n + ':' + h.spot + '→' + (over.join('+') || (e && (e.id || e.className)))); }
          S.dasha.found = {}; return bad; });
        const h1 = await heartN(q, 1); await fingerTap(q, await toClient(q, h1.x, h1.y)); await E(q, () => __adv(900));
        const card = await E(q, () => { const m = document.querySelector('#modal .mbox'); return m ? m.textContent.trim().slice(0, 40) : ''; });
        ok(`${ph.id}: no heart under the panels (${u.join(', ') || 'none'}); a finger on heart №1 opens «${card}»`, !u.length && /Секрет №1/.test(card), u);
        await ctx2.close();
      }
      // her party on the iPhone 17 (the test build, 21.11): «Пальцем» and a finger on each candle
      const ph = PHONES[1], ctx = await phoneCtx(browser, ph); const p = await page0(ctx, { url: TFILE, ins: ph.ins });
      const gift = await giftByFinger(p); const pt = await partyByFinger(p);
      ok(`iphone: the rehearsal on the iPhone 17 — the gift with a finger, her party (${pt.st} ms), «Пальцем», every candle out by finger taps (${pt.left} left)`, gift.open && pt.st >= 0 && pt.mode === 'finger' && pt.left === 0, { gift, pt });
      if (W('look')) { await E(p, () => __adv(1200)); await p.screenshot({ path: path.join(LOOK, 'r24_ip17_party.png') }); }
      await ctx.close(); await browser.close(); browser = null;
    }
    // ================= 5. WebKit — Safari's engine — as an iPhone 17 =================
    if (W('webkit') || W('look')) {
      const WK = webkit();
      if (!WK) ok('webkit: SKIPPED — no WebKit runtime here (tools/webkit_setup.sh sets it up)', true);
      else {
        const wb = await WK.launch(); const mk = () => wb.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: IOS_UA });
        let ctx = await mk(); let p = await page0(ctx, { url: ONE, date: day(2026, 11, 15) });
        const b0 = await E(p, () => { const c = document.getElementById('cv'), d = c.getContext('2d').getImageData(0, 0, 180, 320).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 60) n++; return { ua: navigator.userAgent, drawn: n, voice: typeof SPEECH !== 'undefined' ? SPEECH.ready : -1, box: !!document.querySelector('#nm-ok'), ac: typeof (window.AudioContext || window.webkitAudioContext) }; });
        ok(`webkit: abibyan.html starts in WebKit ${WK.version ? '' : ''}(Safari's engine) — the first picture (${b0.drawn} px), the voice (${b0.voice}), the gift box`, b0.drawn > 20000 && b0.voice === 3 && b0.box && b0.ac === 'function', b0);
        if (W('look')) await p.screenshot({ path: path.join(LOOK, 'r24_wk_gift.png') });
        const gift = await giftByFinger(p); await E(p, () => { __calm(); __adv(2500); while (__game.UI.hasModal()) __game.UI.closeModal(); });
        const t0 = await E(p, () => __game.GAME.S.tut); const hd = await E(p, () => { const H = __game.HOME; let best = null; for (let y = 150; y < 300; y++) for (let x = 40; x < 140; x++) if (H.monkeyAt(x, y) === 'head') { const m = H.mk, d = Math.hypot(x - m.x, y - (m.y + (m.jy || 0) - 36)); if (!best || d < best.d) best = { x, y, d }; } return best; }); // the forehead — the middle of the head is his nose (a boop)
        const head = hd ? await toClient(p, hd.x, hd.y) : await E(p, () => { const r = document.getElementById('cv').getBoundingClientRect(), k = r.width / 180; return [r.left + 92 * k, r.top + 222 * k]; });
        for (let i = 0; i < 4; i++) { await fingerTap(p, head); await E(p, () => __adv(400)); }
        const t1 = await E(p, () => __game.GAME.S.tut);
        ok(`webkit: a finger opens the gift and pets him — the tutorial goes on (step ${t0} → ${t1})`, gift.open && t1 > t0, { gift, t0, t1 });
        await ctx.close();
        // the rehearsal build: 21.11 in JavaScriptCore too, her party, the candles by finger
        ctx = await mk(); p = await page0(ctx, { url: TFILE });
        const d = await E(p, () => { const n = new Date(); return { d: n.getDate() + '.' + (n.getMonth() + 1), coins: __game.GAME.S.coins, gift: __game.DASHA.giftOn() }; });
        const g2 = await giftByFinger(p); const pt = await partyByFinger(p);
        ok(`webkit: the test build says ${d.d}, ${d.coins} coins; her party and every candle out by finger (${pt.left} left)`, d.d === '21.11' && d.coins >= 100000 && g2.open && pt.st >= 0 && pt.mode === 'finger' && pt.left === 0, { d, g2, pt });
        if (W('look')) { await E(p, () => __adv(1200)); await p.screenshot({ path: path.join(LOOK, 'r24_wk_party.png') }); }
        await ctx.close();
        // a heart by finger, kept after a reload (WebKit's storage)
        ctx = await mk(); const q = await heartsPage(ctx); const h1 = await heartN(q, 1); await fingerTap(q, await toClient(q, h1.x, h1.y)); await E(q, () => __adv(900));
        const c1 = await E(q, () => ({ card: (document.querySelector('#modal .mbox') || {}).textContent || '', n: __game.DASHA.foundN() }));
        await q.reload({ waitUntil: 'load' }); await q.waitForFunction(() => window.__game && __game.APP, null, { timeout: 30000 }); await q.waitForTimeout(600); const kept = await E(q, () => __game.DASHA.foundN());
        ok(`webkit: a finger on heart №1 → «${c1.card.trim().slice(0, 30)}…», still found after a reload (${kept})`, /Секрет №1/.test(c1.card) && c1.n === 1 && kept === 1, c1);
        await ctx.close();
        // the site (voice from files, the offline worker) under /abibyan/
        const root = fs.mkdtempSync('/tmp/r24wk-'); fs.symlinkSync(path.join(DIST, 'site'), path.join(root, 'abibyan')); await serve(root);
        ctx = await mk(); const s = await page0(ctx, { url: `http://localhost:${PORT}/abibyan/`, date: day(2026, 11, 15) });
        await s.waitForFunction(() => typeof SPEECH !== 'undefined' && SPEECH.ready === 3, null, { timeout: 30000 }).catch(() => { });
        const sw = await E(s, async () => { let scope = null; try { const r = await navigator.serviceWorker.ready.then((r) => r, () => null); scope = r && r.scope; } catch (e) { } return { voice: SPEECH.ready, scope, sw: 'serviceWorker' in navigator }; });
        ok(`webkit: the site from /abibyan/ — the voice comes from voice1/2.txt (${sw.voice}); the offline worker ${sw.scope || '(none)'}`, sw.voice === 3 && (!sw.sw || /\/abibyan\/$/.test(sw.scope || '')), sw);
        await ctx.close(); srv.kill(); srv = null; await wb.close();
      }
    }
    // ================= 6. a quiet release: by the link only =================
    if (W('private')) {
      const H = ['site/index.html', 'site/test.html', 'abibyan.html', 'abibyan-test.html', 'index.html'].map((f) => [f, fs.readFileSync(path.join(DIST, f), 'utf8')]);
      const noidx = H.filter(([f, h]) => !/<meta name="robots" content="noindex, nofollow">/.test(h)).map(([f]) => f);
      ok(`private: search engines are asked not to list it — noindex in every page (missing: ${noidx.join(', ') || 'none'})`, !noidx.length, noidx);
      const doc = path.join(ROOT, 'docs', 'PRIVATE_RELEASE.md'), t = fs.existsSync(doc) ? fs.readFileSync(doc, 'utf8') : '', gp = fs.readFileSync(path.join(ROOT, 'docs', 'GITHUB_PAGES.md'), 'utf8');
      ok('private: docs/PRIVATE_RELEASE.md — how to open it only by the link (GitHub Pages, a private repo, Netlify / Cloudflare), linked from GITHUB_PAGES.md', /по ссылке/i.test(t) && /Netlify/.test(t) && /Cloudflare/.test(t) && /приватн/i.test(t) && /noindex/.test(t) && /PRIVATE_RELEASE\.md/.test(gp), t.length);
      const z = spawnSync('unzip', ['-Z1', path.join(DIST, 'moy-abibyan-site.zip')], { encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
      ok(`private: the site zip has index.html and test.html on top (drag the folder to Netlify Drop) — ${z.length} files`, z.includes('index.html') && z.includes('test.html') && z.every((f) => !f.includes('/')), z);
      await serve(path.join(DIST, 'site')); browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 402, height: 874 } });
      const p = await page0(ctx, { url: `http://localhost:${PORT}/`, date: day(2026, 11, 15) });
      await p.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 15000 }).catch(() => { });
      await p.waitForFunction(() => typeof SPEECH !== 'undefined' && SPEECH.ready & 1, null, { timeout: 20000 }).catch(() => { });
      const s = await E(p, async () => { const r = await navigator.serviceWorker.getRegistration(); return { scope: r && r.scope, gift: !!document.querySelector('#nm-ok'), voice: SPEECH.ready }; });
      ok(`private: from a domain's root (Netlify / Cloudflare Pages) — the game starts, the voice loads, the offline worker ${s.scope}`, s.gift && (s.voice & 1) && s.scope === `http://localhost:${PORT}/`, s);
      await browser.close(); browser = null; srv.kill(); srv = null;
    }
  } catch (e) { ok('crashed: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | '), false); }
  if (srv) srv.kill();
  if (!browser) browser = await launch();
  await done(errs, browser);
})();
