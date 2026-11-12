// Round 23: node test/r23.js [seq,hide,hint,album,tut,url,test21,site,look] → exit 1 on fail.
// (1) the hearts come one at a time: one hidden, found → the next one in another room; (2) hidden better: a small heart (≤ 8 px),
// no bobbing, every spot partly covered / in shadow / behind glass, never where Абибян or a friend stands, easier first; hot/cold hints;
// (3) the tutorial card under the HUD, off Абибян and his bubble; (4) the repo name (Round 24: «abibyan» again, see SITE_URL in lib/h.js); (5) the test build is 21.11.2026 (its own
// save, «Начать репетицию заново», #fresh) and it is on the site as test.html.
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const { ok, done, want, fs, PAGE_HELPERS, SITE_URL, OLD_NAMES } = require('./lib/h.js');
const path = require('path'), { spawn, spawnSync } = require('child_process');
const W = want(), ROOT = path.join(__dirname, '..'), DIST = path.join(ROOT, 'dist'), FILE = 'file://' + path.join(DIST, 'index.html'), TFILE = 'file://' + path.join(DIST, 'abibyan-test.html'), FFILE = 'file://' + path.join(DIST, 'abibyan-fresh.html');
const LOOK = path.join(ROOT, 'test', 'look'), PORT = 8771, URL = SITE_URL, ROOMS5 = ['zal', 'kitchen', 'bath', 'hall', 'balcony'];
const errs = []; let browser = null, srv = null;
const day = (y, m, d, h = 13) => new Date(y, m - 1, d, h, 0);
const launch = () => chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function page0(ctx, o = {}) { // o.date = a fixed clock; o.nodate = the test build without its 21.11 (window.ABI_NODATE)
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push('pageerror: ' + e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 3).join(' | '))); page.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_FILE_NOT_FOUND/.test(m.text())) errs.push('console: ' + m.text()); });
  if (o.date) await page.clock.setFixedTime(o.date);
  if (o.nodate) await page.addInitScript(() => { window.ABI_NODATE = 1; });
  if (o.seed) await page.addInitScript((s) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(s.k, s.v); sessionStorage.setItem('seeded', 1); } }, o.seed);
  await page.goto(o.url || FILE, { waitUntil: 'load', timeout: 60000 }); await page.waitForFunction(() => window.__game && __game.APP, null, { timeout: 20000 }); await page.waitForTimeout(800);
  await page.evaluate(PAGE_HELPERS); return page;
}
const E = (page, fn, a) => page.evaluate(fn, a);
async function opened(ctx, o) { const p = await page0(ctx, o); await E(p, () => { const b = document.querySelector('#nm-ok'); if (b) b.click(); }); await p.waitForTimeout(400); await E(p, PAGE_HELPERS); return p; }
const serve = async (dir) => { if (srv) return; srv = spawn('python3', ['-m', 'http.server', String(PORT), '-d', dir], { stdio: 'ignore' }); await new Promise((r) => setTimeout(r, 900)); };
// the test build on 15.11 without the shift, the tutorial done, calm: the hearts are the only thing going on
async function heartsPage(ctx, url) { const q = await opened(ctx, { date: day(2026, 11, 15), url: url || TFILE, nodate: true }); await E(q, () => { __calm(); __game.GAME.S.tut = __game.DATA.TUT.length; __game.GAME.S.dasha.seen = 1; while (__game.UI.hasModal()) __game.UI.closeModal(); __adv(3000); while (__game.UI.hasModal()) __game.UI.closeModal(); }); return q; }
const RECT = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return r.width ? { l: r.left, t: r.top, r: r.right, b: r.bottom } : null; };
(async () => {
  try {
    fs.mkdirSync(LOOK, { recursive: true });
    // ================= 1. one heart at a time; found → the next one, in another room =================
    if (W('seq')) {
      const tpl = fs.readFileSync(path.join(ROOT, 'src', 'data.js'), 'utf8');
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const q = await heartsPage(ctx);
      const a = await E(q, () => { const D = __game.DASHA, L = D.secrets(), cur = D.current && D.current(); const C = __game.DATA.DASHA, R = C.secrets.map((x) => (C.spots[x.spot] || {}).room); return { open: L.filter((h) => !h.found).length, cur: cur && cur.n, rooms: R, same: R.filter((r, i) => i && r === R[i - 1]).length, days: C.secrets.some((x) => 'day' in x) }; });
      ok(`seq: one heart is hidden at a time (${a.open} not found on the screen), the first is №${a.cur}`, a.open === 1 && a.cur === 1, a);
      ok(`seq: no day schedule any more; every next heart is in another room (same room twice in a row: ${a.same})`, !a.days && a.same === 0 && new Set(a.rooms).size === 5, a.rooms);
      const f = await E(q, () => { const D = __game.DASHA, h = D.current(); __game.HOME.goTo(h.room, true); __adv(600); __tap(h.x, h.y); __adv(900); const mb = document.querySelector('#modal .mbox'); const r = { txt: mb ? mb.textContent : '', found: D.foundN(), room1: h.room }; const L = D.secrets(); r.vis = L.filter((x) => !x.found).length; return r; });
      ok(`seq: a tap on it → its card («${f.txt.trim().slice(0, 40)}…»), no new heart while the card is open`, /Секрет №1/.test(f.txt) && f.found === 1 && f.vis === 0, f);
      const g = await E(q, () => { while (__game.UI.hasModal()) __game.UI.closeModal(); __adv(1500); const D = __game.DASHA, h = D.current(), b = document.querySelector('.bubble'); return { cur: h && h.n, room: h && h.room, bub: b ? b.textContent : '', vis: D.secrets().filter((x) => !x.found).length }; });
      ok(`seq: the card closed → «${g.bub}» and heart №${g.cur} is hidden in another room (${g.room})`, g.cur === 2 && g.room !== f.room1 && /следующее сердечко/i.test(g.bub) && g.vis === 1, g);
      await browser.close(); browser = null;
      browser = await launch(); const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await opened(ctx2, { date: day(2026, 11, 15) });
      const m = await E(p, () => { const D = __game.DASHA, S = __game.DATA.DASHA.secrets; __game.GAME.S.tut = __game.DATA.TUT.length; S[0].text = 'Один'; S[2].text = 'Три'; S[4].text = 'Пять'; const c1 = D.current() && D.current().n; __game.GAME.S.dasha.found[1] = 1; const c2 = D.current() && D.current().n; __game.GAME.S.dasha.found[3] = 1; __game.GAME.S.dasha.found[5] = 1; const c3 = D.current(); S.forEach((x) => { x.text = ''; }); return { c1, c2, c3: c3 ? c3.n : null, none: D.current() }; });
      ok(`seq: the main build with only some texts filled (1, 3, 5) — №${m.c1}, then №${m.c2} (empty ones skipped), then nothing left; no texts → no heart`, m.c1 === 1 && m.c2 === 3 && m.c3 === null && !m.none, m);
      await browser.close(); browser = null;
    }
    // ================= 2. hidden better: small, still, partly covered, never behind Абибян / a friend, harder later =================
    if (W('hide') || W('look')) {
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const q = await heartsPage(ctx);
      const r = await E(q, (ROOMS5) => {
        const G = __game, D = G.DASHA, C = G.DATA.DASHA, S = G.GAME.S, cv = document.getElementById('cv'), ctx = cv.getContext('2d');
        const out = { size: D.heartSize ? D.heartSize() : (D._art ? D._art() : null), spots: [], noise: 0, bob: [] };
        const dbg = D.dbg || {}; dbg.glint = false;
        const realHide = D.hideMk, realFr = G.FRIENDS.render; let showMk = false, showFr = false;
        D.hideMk = () => !showMk || realHide(); G.FRIENDS.render = function () { if (showFr) return realFr.apply(this, arguments); };
        const frame = () => { G.HOME.render(ctx); return ctx.getImageData(0, 0, 180, 320).data; };
        const dpx = (a, b, i) => Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
        const masks = {};
        for (const room of ROOMS5) { G.HOME.goTo(room, true); __adv(700); dbg.off = true; const z = frame(); showMk = true; const m = frame(); showMk = false; showFr = true; const f = frame(); showFr = false; dbg.off = false;
          const mk = new Uint8Array(180 * 320), fr = new Uint8Array(180 * 320); for (let i = 0; i < 180 * 320; i++) { if (dpx(m, z, i * 4) > 0) mk[i] = 1; if (dpx(f, z, i * 4) > 0) fr[i] = 1; } masks[room] = { mk, fr }; }
        const all = C.secrets.map((x) => x.n);
        for (const n of all) {
          S.dasha.found = {}; for (const k of all) if (k < n) S.dasha.found[k] = 1; const h = D.current(); if (!h || h.n !== n) { out.spots.push({ n, err: 'not current' }); continue; }
          G.HOME.goTo(h.room, true); __adv(700);
          dbg.off = true; const z = frame(), z2 = frame(); dbg.off = false; const a = frame(); dbg.plain = true; const b = frame(); dbg.plain = false;
          let sa = 0, sb = 0, na = 0, nb = 0, hitMk = 0, hitFr = 0, noise = 0; const M = masks[h.room];
          for (let y = Math.max(0, h.y - 8); y < Math.min(320, h.y + 8); y++) for (let x = Math.max(0, h.x - 8); x < Math.min(180, h.x + 8); x++) { const i = (y * 180 + x) * 4, da = dpx(a, z, i), db = dpx(b, z, i); noise += dpx(z, z2, i); sa += da; sb += db; if (da > 24) na++; if (db > 24) nb++;
            if (da > 24) for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = x - 2; xx <= x + 2; xx++) { if (xx < 0 || yy < 0 || xx >= 180 || yy >= 320) continue; const j = yy * 180 + xx; if (M.mk[j]) hitMk++; if (M.fr[j]) hitFr++; } }
          out.noise += noise; const hit = !!D.hit(h.room, h.x, h.y);
          // still: the same pixels a second later
          __adv(1000); dbg.off = true; const z3 = frame(); dbg.off = false; const a3 = frame(); let moved = 0;
          for (let y = Math.max(0, h.y - 8); y < Math.min(320, h.y + 8); y++) for (let x = Math.max(0, h.x - 8); x < Math.min(180, h.x + 8); x++) { const i = (y * 180 + x) * 4; if ((dpx(a, z, i) > 24) !== (dpx(a3, z3, i) > 24)) moved++; }
          out.spots.push({ n, room: h.room, x: h.x, y: h.y, v: sb ? Math.round(sa / sb * 100) / 100 : 0, px: na, full: nb, hitMk, hitFr, moved, hit });
        }
        D.hideMk = realHide; G.FRIENDS.render = realFr; S.dasha.found = {}; return out;
      }, ROOMS5);
      const sp = r.spots, bad = (f) => sp.filter(f).map((s) => s.n);
      ok(`hide: the heart is small — ${r.size && r.size.w}×${r.size && r.size.h} px (was 11×10)`, !!r.size && r.size.w <= 8 && r.size.h <= 7, r.size);
      ok(`hide: 24 spots measured, nothing else changes there between two frames (noise ${r.noise})`, sp.length === 24 && sp.every((s) => !s.err) && r.noise === 0, sp.filter((s) => s.err));
      ok(`hide: every heart is partly covered / in shadow / behind glass — at most 75 % of a plain heart shows (too plain: ${bad((s) => s.v > 0.75).join(',') || 'none'}) [${sp.map((s) => s.n + ':' + s.v).join(' ')}]`, sp.every((s) => s.v <= 0.75), sp.map((s) => s.n + ':' + s.v).join(' '));
      ok(`hide: …but every one can still be seen — ≥ 12 % and ≥ 5 pixels (lost: ${bad((s) => s.v < 0.12 || s.px < 5).join(',') || 'none'})`, sp.every((s) => s.v >= 0.12 && s.px >= 5), sp.map((s) => s.n + ':' + s.px).join(' '));
      ok(`hide: no bobbing — the same pixels a second later (moved: ${bad((s) => s.moved > 0).join(',') || 'none'})`, sp.every((s) => s.moved === 0), sp.map((s) => s.moved));
      ok(`hide: never where Абибян stands (biggest him: ${bad((s) => s.hitMk).join(',') || 'none'}) or a friend sits at home (${bad((s) => s.hitFr).join(',') || 'none'})`, sp.every((s) => !s.hitMk && !s.hitFr), sp.filter((s) => s.hitMk || s.hitFr));
      ok(`hide: each heart can be tapped where it is (missed: ${bad((s) => !s.hit).join(',') || 'none'})`, sp.every((s) => s.hit), null);
      const avg = (a) => a.reduce((x, s) => x + s.v, 0) / a.length, e6 = avg(sp.slice(0, 6)), l6 = avg(sp.slice(-6));
      ok(`hide: easier first — the first 6 show ${Math.round(e6 * 100)} % on average, the last 6 ${Math.round(l6 * 100)} %`, e6 >= l6 + 0.1, { e6, l6 });
      // the smallest phones: the canvas starts at the very top, so the HUD (coins, buttons) and the bottom bar lie over the picture —
      // no heart may hide under them (it could not be seen or tapped there)
      for (const [vw, vh] of [[360, 640], [375, 667]]) {
        const ctxS = await browser.newContext({ viewport: { width: vw, height: vh } }); const qs = await heartsPage(ctxS);
        const u = await E(qs, () => { const G = __game, D = G.DASHA, S = G.GAME.S, cv = document.getElementById('cv'), r = cv.getBoundingClientRect(), k = r.width / 180, all = G.DATA.DASHA.secrets.map((x) => x.n), bad = [];
          const R = (q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? [(b.left - r.left) / k, (b.top - r.top) / k, (b.right - r.left) / k, (b.bottom - r.top) / k] : null; };
          for (const n of all) { S.dasha.found = {}; for (const q of all) if (q < n) S.dasha.found[q] = 1; const h = D.current(); if (!h) continue; G.HOME.goTo(h.room, true); __adv(700);
            const box = [h.x - 4, h.y - 3, h.x + 4, h.y + 3], over = ['#hud', '#bar', '#roomt'].filter((q) => { const b = R(q); return b && box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]; });
            const e = document.elementFromPoint(r.left + h.x * k, r.top + h.y * k); if (over.length || e !== cv) bad.push(n + ':' + h.spot + '→' + (over.join('+') || (e && (e.id || e.className)))); }
          S.dasha.found = {}; return { bad, hud: R('#hud'), bar: R('#bar') }; });
        ok(`hide ${vw}×${vh}: no heart under the HUD or the bottom bar — each is seen and tapped (under: ${u.bad.join(', ') || 'none'})`, !u.bad.length, u);
        await ctxS.close();
      }
      if (W('look')) { // a sheet: every spot zoomed ×4 (40×30 around it) in its room
        const png = await E(q, () => { const G = __game, D = G.DASHA, S = G.GAME.S, cv = document.getElementById('cv'), ctx = cv.getContext('2d'), all = G.DATA.DASHA.secrets.map((x) => x.n);
          const o = document.createElement('canvas'), Z = 4, CW = 44, CH = 34; o.width = 6 * CW * Z; o.height = 4 * (CH * Z + 14); const x = o.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#222'; x.fillRect(0, 0, o.width, o.height); x.font = 'bold 12px sans-serif';
          if (D.dbg) D.dbg.glint = false; const rh = D.hideMk; D.hideMk = () => true;
          all.forEach((n, i) => { S.dasha.found = {}; for (const k of all) if (k < n) S.dasha.found[k] = 1; const h = D.current(); if (!h) return; G.HOME.goTo(h.room, true); __adv(700); G.HOME.render(ctx);
            const cx = (i % 6) * CW * Z, cy = Math.floor(i / 6) * (CH * Z + 14); x.drawImage(cv, h.x - CW / 2, h.y - CH / 2, CW, CH, cx, cy + 14, CW * Z, CH * Z); x.fillStyle = '#fff'; x.fillText(`№${n} ${h.room} ${h.x},${h.y}`, cx + 3, cy + 11); });
          D.hideMk = rh; S.dasha.found = {}; return o.toDataURL('image/png').split(',')[1]; });
        fs.writeFileSync(path.join(LOOK, 'r23_spots.png'), Buffer.from(png, 'base64'));
        for (const room of ['zal', 'kitchen']) { await E(q, (room) => { const G = __game, D = G.DASHA, S = G.GAME.S, all = G.DATA.DASHA.secrets.map((x) => x.n); const n = all.find((k) => G.DATA.DASHA.spots[G.DATA.DASHA.secrets[k - 1].spot].room === room); S.dasha.found = {}; for (const k of all) if (k < n) S.dasha.found[k] = 1; G.HOME.goTo(room, true); __adv(800); }, room); await q.screenshot({ path: path.join(LOOK, `r23_room_${room}.png`) }); }
      }
      await browser.close(); browser = null;
    }
    // ================= 3. hot / cold: after a minute of looking he helps =================
    if (W('hint')) {
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const q = await heartsPage(ctx);
      const h = await E(q, () => { const D = __game.DASHA, H = __game.HOME, h = D.current(); H.goTo(h.room, true); __adv(700); D.down(1, 319); __spy(); const said = () => __game.AUDIO._said.slice(); __adv(75000); const s30 = said().filter((t) => /Тепло|Горячо|Холодно|Загляни/.test(t)).length; __adv(25000); const hot = said(); // Round 24: he helps after 90 s (was 60)
        const other = __game.DATA.ROOMS.map((r) => r.id).find((r) => r !== h.room); H.goTo(other, true); __adv(700); __game.AUDIO._said.length = 0; __adv(96000); const cold = said(); __game.AUDIO._said.length = 0; __adv(96000); const cold2 = said(); return { s30, hot, cold, cold2, room: h.room }; });
      ok(`hint: nothing in the first 75 s; after 1.5 minutes in the right room — «${h.hot.join(' | ')}»`, h.s30 === 0 && h.hot.some((t) => /Тепло|Горячо/.test(t)), h);
      ok(`hint: in another room — «${h.cold.join(' | ')}», then the room: «${h.cold2.join(' | ')}»`, h.cold.some((t) => /Холодно/.test(t)) && h.cold2.some((t) => /Загляни/.test(t)), h);
      await q.waitForFunction(() => __game.AUDIO.voiceReady && (window.SPEECH && SPEECH.ready & 1), null, { timeout: 20000 }).catch(() => { });
      const v = await E(q, () => { const L = __game.DATA.LINES, bad = []; let n = 0; for (const k of ['dNext', 'dHot', 'dCold', 'dRoom', 'dSecrets']) for (const t of L[k] || []) { n++; const pl = __game.AUDIO._plan(t); if (!pl.length || pl.some((s) => s.id && !/^[LR]/.test(s.id))) bad.push(t); } return { n, bad }; });
      ok(`hint: his new lines (${v.n}) are voiced whole`, v.n >= 10 && !v.bad.length, v);
      await browser.close(); browser = null;
    }
    // ================= 4. the album «Сердечки»: found / the one to look for («?» + its room) / not hidden yet =================
    if (W('album') || W('look')) {
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const q = await heartsPage(ctx);
      const a = await E(q, () => { const G = __game, S = G.GAME.S; S.dasha.found = { 1: 1, 2: 1 }; G.UI.openAlbum('hearts'); const b = document.querySelector('#sh-body'); const cells = [...b.querySelectorAll('.hs')]; return { txt: b.textContent, on: cells.filter((c) => c.classList.contains('on')).length, cur: cells.filter((c) => c.classList.contains('cur')).map((c) => c.textContent), lock: cells.filter((c) => c.classList.contains('lock')).length }; });
      ok(`album: 2 found, 1 to look for («${(a.cur[0] || '').trim()}»), 21 not hidden yet; it says one at a time`, a.on === 2 && a.cur.length === 1 && /\?/.test(a.cur[0]) && a.lock === 21 && /по одному/.test(a.txt), a);
      if (W('look')) { await q.waitForTimeout(300); await q.screenshot({ path: path.join(LOOK, 'r23_album.png') }); }
      await browser.close(); browser = null;
    }
    // ================= 5. the tutorial card under the HUD: Абибян and his bubble stay in view =================
    if (W('tut') || W('look')) {
      browser = await launch();
      for (const [w, hgt] of [[390, 844], [375, 667], [430, 932], [360, 640]]) {
        const ctx = await browser.newContext({ viewport: { width: w, height: hgt } }); const p = await opened(ctx, { date: day(2026, 11, 15) });
        const g = await E(p, (RECT) => { const R = eval(RECT); __adv(2500); const cv = document.getElementById('cv').getBoundingClientRect(), k = cv.width / 180, M = __game.HOME._mk(), bb = __bb(M.cv);
          const mk = { l: cv.left + (M.x0 + bb.x) * k, t: cv.top + (M.y0 + bb.y) * k, r: cv.left + (M.x0 + bb.x + bb.w) * k, b: cv.top + (M.y0 + bb.y + bb.h) * k };
          return { tut: R('#tut'), hud: R('#hud'), mk, bub: R('.bubble'), txt: (document.querySelector('#tut') || {}).textContent || '' }; }, RECT.toString());
        const X = (a, b) => !!a && !!b && a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
        ok(`tut ${w}×${hgt}: the card «${g.txt.slice(0, 24)}…» is under the HUD, off Абибян${g.bub ? ' and his bubble' : ''}`, !!g.tut && !X(g.tut, g.mk) && !X(g.tut, g.bub) && !X(g.tut, g.hud) && g.tut.t >= (g.hud ? g.hud.b : 0) - 1, g);
        if (w === 390) {
          if (W('look')) await p.screenshot({ path: path.join(LOOK, 'r23_tut.png') });
          const s = await E(p, (RECT) => { const R = eval(RECT); __game.UI.openShop(); __adv(400); return { tut: R('#tut'), sheet: R('#sheet'), hidden: document.querySelector('#tut').classList.contains('hidden') }; }, RECT.toString());
          ok('tut: with the shop open the card stays visible above the sheet', !s.hidden && !!s.tut && !X(s.tut, s.sheet), s);
          if (W('look')) await p.screenshot({ path: path.join(LOOK, 'r23_tut_shop.png') });
        }
        await ctx.close();
      }
      await browser.close(); browser = null;
    }
    // ================= 6. the repo name (Round 24: «abibyan» again) =================
    if (W('url')) {
      const g = fs.readFileSync(path.join(ROOT, 'docs', 'GITHUB_PAGES.md'), 'utf8'), cp = fs.readFileSync(path.join(ROOT, 'tools', 'card.py'), 'utf8');
      const stale = spawnSync('grep', ['-rlnE', '--exclude-dir=superpowers', OLD_NAMES.join('|'), 'src', 'docs', 'tools', 'build.py', 'test/r22.js', 'test/r23.js'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
      ok(`url: docs/GITHUB_PAGES.md — ${URL} and ${URL}test.html; the old name nowhere (${stale || 'clean'})`, g.includes(URL) && g.includes(URL + 'test.html') && cp.includes(URL) && !stale, { stale });
      const r = spawnSync('python3', [path.join(ROOT, 'tools', 'card.py')], { encoding: 'utf8' }), png = path.join(DIST, 'abibyan-card.png');
      const qd = spawnSync('python3', ['-c', `import cv2; im = cv2.imread('${png}'); print(cv2.QRCodeDetector().detectAndDecode(im)[0])`], { encoding: 'utf8' });
      ok(`url: the card's QR code opens ${qd.stdout.trim()}`, r.status === 0 && qd.stdout.trim() === URL, (r.stderr || '').slice(-200) + qd.stderr.slice(-200));
      const txt = spawnSync('pdftotext', [path.join(DIST, 'abibyan-card.pdf'), '-'], { encoding: 'utf8' }).stdout;
      ok('url: the card says ' + URL.replace(/^https:\/\//, ''), txt.includes(URL.replace(/^https:\/\//, '').replace(/\/$/, '')) && !OLD_NAMES.some((n) => txt.includes(n)), txt.slice(0, 300));
    }
    // ================= 7. the test build is 21.11.2026: her party with 100 000 coins, again and again =================
    if (W('test21') || W('look')) {
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const mainKey = 'martyn_tamagotchi_v1';
      const p = await page0(ctx, { url: TFILE });
      const d = await E(p, () => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate(), hm: n.getHours() * 60 + n.getMinutes(), gift: __game.DASHA.giftOn(), coins: __game.GAME.S.coins }; });
      const real = new Date(), rhm = real.getHours() * 60 + real.getMinutes();
      ok(`test21: the test build says today is ${d.d}.${d.m}.${d.y} at the real time of day, 100 000 coins, the gift box`, d.y === 2026 && d.m === 11 && d.d === 21 && Math.abs(d.hm - rhm) <= 2 && d.gift && d.coins >= 100000, { d, rhm });
      await E(p, () => { localStorage.setItem('martyn_tamagotchi_v1', '{"marker":1}'); document.querySelector('#nm-ok').click(); });
      await p.waitForTimeout(400); await E(p, PAGE_HELPERS);
      const st = await E(p, () => { for (let t = 0; t < 10000; t += 50) { __adv(50); if (__game.FRIENDS.partyKind() === 'dasha') return t; } return -1; });
      ok(`test21: open it → her party starts by itself (${st} ms)`, st >= 0, st);
      if (W('look')) { await E(p, () => { for (let t = 0; t < 30000; t += 50) { __adv(50); if (__game.DASHA.blowInfo()) break; } }); await p.waitForTimeout(300); await p.screenshot({ path: path.join(LOOK, 'r23_test21.png') }); }
      await E(p, () => { __game.FRIENDS.endParty && __game.FRIENDS.endParty(); __adv(500); while (__game.UI.hasModal()) __game.UI.closeModal(); __game.UI.openSettings(); });
      const b = await E(p, () => { const x = [...document.querySelectorAll('#modal button')].find((e) => /репетицию заново/i.test(e.textContent)); return x ? x.textContent : null; });
      ok(`test21: the settings have «${b}»`, !!b, b);
      if (b) { await Promise.all([p.waitForNavigation({ timeout: 15000 }).catch(() => { }), E(p, () => { const x = [...document.querySelectorAll('#modal button')].find((e) => /репетицию заново/i.test(e.textContent)); x.click(); const y = document.querySelector('#r-yes, [data-yes]'); if (y) y.click(); })]); await p.waitForFunction(() => window.__game && __game.APP, null, { timeout: 20000 }); await p.waitForTimeout(800); }
      const r2 = await E(p, (k) => ({ gift: __game.DASHA.giftOn(), party: Object.keys((__game.GAME.S.dasha || {}).party || {}), main: localStorage.getItem(k) }), mainKey);
      ok('test21: «Начать репетицию заново» → the gift box again, nothing done; the real save is not touched', r2.gift && !r2.party.length && r2.main === '{"marker":1}', r2);
      await E(p, () => { document.querySelector('#nm-ok').click(); }); await p.waitForTimeout(300); await E(p, () => __game.GAME.save(true));
      await p.goto(TFILE + '#fresh', { waitUntil: 'load' }); await p.waitForFunction(() => window.__game && __game.APP, null, { timeout: 20000 }); await p.waitForTimeout(800);
      const r3 = await E(p, () => ({ gift: __game.DASHA.giftOn(), hash: location.hash }));
      ok(`test21: «abibyan-test.html#fresh» starts the rehearsal over too (the box again, hash «${r3.hash}»)`, r3.gift && !/fresh/.test(r3.hash), r3);
      await E(p, () => { localStorage.setItem('martyn_tamagotchi_test_v1', JSON.stringify({ v: 8, name: 'OldStale', named: true })); localStorage.removeItem('abi_test_token'); });
      await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => window.__game && __game.APP, null, { timeout: 20000 }); await p.waitForTimeout(800);
      const staleCheck = await E(p, () => ({ gift: __game.DASHA.giftOn(), named: __game.GAME.S.named, token: localStorage.getItem('abi_test_token') }));
      ok('test21: stale test save without matching token is wiped on boot → fresh gift box', staleCheck.gift && !staleCheck.named && !!staleCheck.token, staleCheck);
      const f = await page0(ctx, { url: FFILE });
      const fd = await E(f, () => { const n = new Date(); __game.GAME.save(true); return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate(), gift: __game.DASHA.giftOn(), coins: __game.GAME.S.coins, lvl: __game.GAME.S.lvl, stage: __game.GAME.S.grow.stage, top: !!(window.ABI_TEST && window.ABI_TEST.top), key: __game.GAME.saveKey(), saved: localStorage.getItem('martyn_tamagotchi_fresh_v1') }; });
      ok('fresh: abibyan-fresh.html is on 21.11, default 60 coins, level 1, gift box, separate save key', fd.y === 2026 && fd.m === 11 && fd.d === 21 && fd.gift && fd.coins === 60 && fd.lvl === 1 && !fd.top && fd.key === 'martyn_tamagotchi_fresh_v1' && !!fd.saved, fd);
      const m = await page0(ctx, { url: FILE }); const md = await E(m, () => { const n = new Date(); return { s: n.toDateString(), test: !!window.ABI_TEST }; });
      ok(`test21: the real game keeps the real date (${md.s})`, md.s === new Date().toDateString() && !md.test, md);
      await browser.close(); browser = null;
    }
    // ================= 8. the site: test.html next to the game (voice from files, https → the microphone) =================
    if (W('site')) {
      const SITE = path.join(DIST, 'site'), has = fs.existsSync(path.join(SITE, 'test.html')), hasF = fs.existsSync(path.join(SITE, 'fresh.html'));
      const th = has ? fs.readFileSync(path.join(SITE, 'test.html'), 'utf8') : '', fh = hasF ? fs.readFileSync(path.join(SITE, 'fresh.html'), 'utf8') : '', ih = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
      ok('site: dist/site/test.html & fresh.html — test builds with the voice from files; index.html stays the real game', has && hasF && /window\.ABI_TEST = \{/.test(th) && /window\.ABI_TEST = \{/.test(fh) && /ABI_VOICE = 'files'/.test(th) && !/class="vb"/.test(th) && !/window\.ABI_TEST = \{/.test(ih) && /ABI_VOICE = 'files'/.test(ih), { has, hasF });
      const root = fs.mkdtempSync('/tmp/r23site-'); fs.symlinkSync(SITE, path.join(root, 'abibyan')); await serve(root);
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const p = await page0(ctx, { url: `http://localhost:${PORT}/abibyan/test.html` });
      await p.waitForFunction(() => typeof SPEECH !== 'undefined' && SPEECH.ready & 1, null, { timeout: 20000 }).catch(() => { });
      const s = await E(p, () => { const n = new Date(); return { test: !!window.ABI_TEST, d: n.getDate() + '.' + (n.getMonth() + 1), gift: __game.DASHA.giftOn(), voice: !!(typeof SPEECH !== 'undefined' && SPEECH.ready & 1), keys: Object.keys(localStorage) }; });
      ok(`site: /abibyan/test.html — the test build on ${s.d}, the gift box, the voice loads; its own save`, s.test && s.d === '21.11' && s.gift && s.voice && !s.keys.includes('martyn_tamagotchi_v1'), s);
      await browser.close(); browser = null; srv.kill(); srv = null;
    }
  } catch (e) { ok('crashed: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | '), false); }
  if (srv) srv.kill();
  if (!browser) browser = await launch();
  await done(errs, browser);
})();
