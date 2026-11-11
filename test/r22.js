// Round 22 «Подарок для Дашулика»: node test/r22.js [gift,open,party,rehearsal,blow,deny,life,secrets,album,voice,site,card,look] → exit 1 on fail.
// The game is a birthday present: Даша («Дашулик») turns 24 on 21.11.2026. First start = a gift box; her birthday = the zal decorated,
// the friends, a cake with 24 candles she blows out INTO THE MICROPHONE (Chromium's fake mic plays test WAVs: a blow, a soft blow, «фууу»
// must work; speech, a voice, music, claps, a quiet room must not), «24 секрета» hidden around the flat, a page for GitHub Pages, a QR card.
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const { ok, done, want, fs, PAGE_HELPERS, SITE_URL } = require('./lib/h.js');
const path = require('path'), { spawn, spawnSync } = require('child_process');
const W = want(), ROOT = path.join(__dirname, '..'), DIST = path.join(ROOT, 'dist'), FILE = 'file://' + path.join(DIST, 'index.html'), TFILE = 'file://' + path.join(DIST, 'abibyan-test.html');
const LOOK = path.join(ROOT, 'test', 'look'), WAV = '/tmp/abibyan_blow', PORT = 8769, URL = SITE_URL; // Round 24: the repo is «abibyan» again
const errs = []; let browser = null, srv = null;
const day = (y, m, d, h = 13) => new Date(y, m - 1, d, h, 0);
const launch = (args = []) => chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', ...args] });
async function page0(ctx, o = {}) { // a page on a given date; o.seed = a save (localStorage JSON) put in once; o.init = an init script
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push('pageerror: ' + e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 3).join(' | '))); page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  if (o.date) await page.clock.setFixedTime(o.date);
  if (o.seed) await page.addInitScript((s) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(s.k, s.v); sessionStorage.setItem('seeded', 1); } }, o.seed);
  if (o.init) await page.addInitScript(o.init);
  if (/abibyan-test/.test(o.url || '') && !o.realShift) await page.addInitScript(() => { window.ABI_NODATE = 1; }); // Round 23: no 21.11 shift here
  await page.goto(o.url || FILE, { waitUntil: 'load', timeout: 60000 }); await page.waitForFunction(() => window.__game && __game.APP, null, { timeout: 20000 }); await page.waitForTimeout(800);
  await page.evaluate(PAGE_HELPERS); return page;
}
const E = (page, fn, a) => page.evaluate(fn, a);
const adv = (page, ms, until) => E(page, ([ms, until]) => { for (let t = 0; t < ms; t += 50) { __adv(50); if (until && eval(until)) return t; } return -1; }, [ms, until || null]);
const closeModals = (page) => E(page, () => { let n = 0; while (__game.UI.hasModal() && n++ < 9) __game.UI.closeModal(); });
// fast-forward the party (closing the photo window) until a condition holds
const partyTo = (page, cond, ms = 60000) => E(page, ([cond, ms]) => { for (let t = 0; t < ms; t += 50) { __adv(50); if (eval(cond)) return t; if (__game.UI.hasModal() && !eval(cond)) __game.UI.closeModal(); } return -1; }, [cond, ms]);
async function opened(ctx, date, url) { // a fresh start on «date», the gift opened with «Открыть»; returns the page
  const p = await page0(ctx, { date, url }); await E(p, () => { const b = document.querySelector('#nm-ok'); if (b) b.click(); }); await p.waitForTimeout(400); return p;
}
const SAVE_KEY = 'martyn_tamagotchi_v1';
async function seedFrom(ctx, date, edit) { // a played save from a start on «date» (gift opened, tutorial done) → {k, v}
  const p = await opened(ctx, date); const v = await E(p, (edit) => { const s = __game.GAME.S; s.tut = __game.DATA.TUT.length; if (edit) eval(edit); __game.GAME.save(true); return localStorage.getItem('martyn_tamagotchi_v1'); }, edit || null);
  await p.close(); return { k: SAVE_KEY, v };
}
const reload = async (p) => { await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => window.__game && __game.APP, null, { timeout: 20000 }); await p.waitForTimeout(700); await p.evaluate(PAGE_HELPERS); };
const serve = async (dir) => { if (srv) return; srv = spawn('python3', ['-m', 'http.server', String(PORT), '-d', dir], { stdio: 'ignore' }); await new Promise((r) => setTimeout(r, 900)); };
(async () => {
  try {
    fs.mkdirSync(LOOK, { recursive: true });
    // ================= 1. the first start is a gift box (no name dialog) =================
    if (W('gift') || W('open') || W('look')) {
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const p = await page0(ctx, { date: day(2026, 11, 15) });
      const g0 = await E(p, () => { const D = __game.DASHA; return { has: !!D, on: D && D.giftOn(), hide: D && D.hideMk(), nm: !!document.querySelector('#nm'), cap: (document.querySelector('#gift') || {}).textContent || '', btn: !!document.querySelector('#gift #nm-ok'), ui: document.querySelector('#ui').classList.contains('gifting'), scene: __game.APP.scene, box: D && D.giftBox() }; });
      ok(`gift: a first start shows a gift box «Дашулик, это тебе!» with «Открыть» — no name dialog, the HUD hidden, Абибян hidden inside`, g0.has && g0.on && g0.hide && !g0.nm && /Дашулик/.test(g0.cap) && g0.btn && g0.ui && !!g0.box, g0);
      if (W('look')) { await p.waitForTimeout(300); await p.screenshot({ path: path.join(LOOK, 'r22_gift.png') }); }
      const box = g0.box || { x: 90, y: 250, w: 30, h: 30 }, bx = box.x + box.w / 2, by = box.y + box.h / 2;
      const t1 = await E(p, ([x, y]) => { __tap(x, y); __adv(300); __tap(x, y); __adv(300); const D = __game.DASHA; return { taps: D.giftTaps(), on: D.giftOn(), named: __game.GAME.S.named }; }, [bx, by]);
      ok(`gift: two taps on the box — it jumps and wobbles, still closed (${t1.taps} taps)`, t1.taps === 2 && t1.on && !t1.named, t1);
      const t2 = await E(p, ([x, y]) => { __tap(x, y); __adv(1800); const D = __game.DASHA, s = __game.GAME.S, b = document.querySelector('.bubble'); return { on: D.giftOn(), hide: D.hideMk(), named: s.named, name: s.name, gift: s.dasha && s.dasha.gift, scene: __game.APP.scene, bub: b ? b.textContent : '', cap: !!document.querySelector('#gift'), ui: document.querySelector('#ui').classList.contains('gifting'), party: __game.FRIENDS.partyOn() }; }, [bx, by]);
      ok(`gift: the third tap opens it — Абибян jumps out: «${t2.bub}»; named Абибян, the HUD back, home; not her birthday → no party`, !t2.on && !t2.hide && t2.named && t2.name === 'Абибян' && !!t2.gift && t2.scene === 'home' && /Дашулик/.test(t2.bub) && !t2.cap && !t2.ui && !t2.party, t2);
      if (W('look')) { await E(p, () => __adv(200)); await p.screenshot({ path: path.join(LOOK, 'r22_opened.png') }); }
      await reload(p); const r = await E(p, () => ({ on: __game.DASHA.giftOn(), cap: !!document.querySelector('#gift') }));
      ok('gift: once — after a reload no box again', !r.on && !r.cap, r);
      const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } }); const q = await page0(ctx2, { date: day(2026, 11, 15) });
      const t3 = await E(q, () => { const b = document.querySelector('#nm-ok'); b.click(); const D = __game.DASHA; return { on: D.giftOn(), scene: __game.APP.scene, named: __game.GAME.S.named }; });
      ok('gift: «Открыть» opens it at once (scene home right away, as the old name dialog did)', !t3.on && t3.scene === 'home' && t3.named, t3);
      await browser.close(); browser = null;
    }
    // ================= 2. her birthday: decor, friends, a cake with 24 candles, blown out (finger here), gifts, the photo =================
    if (W('party') || W('look')) {
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const p = await opened(ctx, day(2026, 11, 21, 15));
      const a = await E(p, () => { const b = document.querySelector('.bubble'); return { bub: b ? b.textContent : '' }; });
      ok(`party: on 21.11 the box opens with «${a.bub}»`, /С днём рождения/.test(a.bub) && /Дашулик/.test(a.bub), a);
      const c0 = await E(p, () => __game.GAME.S.coins), k0 = await E(p, () => __game.GAME.S.inv.cake || 0);
      const st = await partyTo(p, "__game.FRIENDS.partyKind() === 'dasha'", 8000);
      const s1 = await E(p, () => ({ kind: __game.FRIENDS.partyKind(), room: __game.HOME.room, decor: __game.DASHA.decor(), tut: !document.querySelector('#tut') || document.querySelector('#tut').classList.contains('hidden') }));
      ok(`party: it starts by itself (${st} ms) in the zal, the zal is decorated, the tutorial card waits`, st >= 0 && s1.kind === 'dasha' && s1.room === 'zal' && s1.decor && s1.tut, s1);
      const tb = await partyTo(p, "!!__game.DASHA.blowInfo() && !!document.querySelector('#blow:not(.hidden)')", 60000);
      const b = await E(p, () => ({ info: __game.DASHA.blowInfo(), txt: document.querySelector('#blow').textContent, mic: !!document.querySelector('#blow-mic'), fin: !!document.querySelector('#blow-finger'), song: (__game.AUDIO._calls || []).length }));
      ok(`party: the cake — ${b.info && b.info.n} candles lit; «${b.txt.trim().slice(0, 60)}…» with «Подуть» and «Пальцем»`, tb >= 0 && b.info && b.info.n === 24 && b.info.lit === 24 && b.mic && b.fin && /желание/i.test(b.txt), b);
      if (W('look')) { await E(p, () => __adv(400)); await p.screenshot({ path: path.join(LOOK, 'r22_cake.png') }); }
      const w0 = await E(p, () => { for (let t = 0; t < 4000; t += 50) __adv(50); const i = __game.DASHA.blowInfo(); return i && i.lit; });
      ok(`party: the candles wait — nothing happens by itself (${w0} still lit after 4 s)`, w0 === 24, w0);
      await p.click('#blow-finger'); const fm = await E(p, () => ({ mode: __game.DASHA.blowInfo().mode, txt: document.querySelector('#blow').textContent }));
      ok(`party: «Пальцем» → «${fm.txt.trim().slice(0, 50)}»`, fm.mode === 'finger' && /пальц/i.test(fm.txt), fm);
      const sw = await E(p, () => { const C = __game.DASHA.candles(), H = __game.HOME; const xs = C.map((c) => c.x), y = C[0].y; H.down(Math.min(...xs) - 4, y);
        for (let x = Math.min(...xs) - 4; x <= Math.max(...xs) + 4; x += 2) { H.move(x, y); __adv(16); } const half = __game.DASHA.blowInfo().lit; H.up(Math.max(...xs) + 4, y); return { half, y }; });
      const sw2 = await E(p, () => { const C = __game.DASHA.candles().filter((c) => c.lit), H = __game.HOME; let n = 0; while (__game.DASHA.blowInfo() && __game.DASHA.blowInfo().lit && n++ < 6) { const L = __game.DASHA.candles().filter((c) => c.lit); for (const c of L) { H.down(c.x, c.y); H.move(c.x + 1, c.y); H.up(c.x + 1, c.y); __adv(16); } } return { left: __game.DASHA.blowInfo() ? __game.DASHA.blowInfo().lit : 0, rows: C.length }; });
      ok(`party: a swipe along the front row puts those out (${24 - sw.half} out), the rest by touching them — all 24 out`, sw.half < 24 && sw2.left === 0, { sw, sw2 });
      if (W('look')) { await E(p, () => __adv(300)); await p.screenshot({ path: path.join(LOOK, 'r22_blown.png') }); }
      const tp = await partyTo(p, "!!document.querySelector('#modal img.photo')", 60000);
      const ph = await E(p, () => { const L = __game.ALBUM.list(), e = L.find((x) => x.k === 'dasha:2026'); const s = __game.GAME.S; return { e: e ? { title: e.title, cap: e.cap } : null, done: s.dasha.party[2026], coins: s.coins, cake: s.inv.cake || 0 }; });
      if (W('look')) { await p.waitForTimeout(500); await p.screenshot({ path: path.join(LOOK, 'r22_photo.png') }); }
      ok(`party: a photo for the album «${ph.e && ph.e.title}» / «${ph.e && ph.e.cap}», the birthday marked done, gifts: +${ph.coins - c0} coins, ${ph.cake - k0} cakes in the fridge`, tp >= 0 && ph.e && /Дашулик/.test(ph.e.title) && /24/.test(ph.e.cap) && !!ph.done && ph.coins - c0 >= 100 && ph.cake - k0 === 3, ph);
      const te = await partyTo(p, "!__game.FRIENDS.partyOn()", 60000);
      const af = await E(p, () => { __adv(600); const t = document.querySelector('#tut'); return { party: __game.FRIENDS.partyOn(), busy: __game.DASHA.busy(), tut: !!t && !t.classList.contains('hidden'), decor: __game.DASHA.decor() }; });
      ok('party: the friends go home, then the tutorial goes on; the decor stays for the day', te >= 0 && !af.party && !af.busy && af.tut && af.decor, af);
      await reload(p); const rr = await E(p, () => { for (let t = 0; t < 8000; t += 50) __adv(50); return { party: __game.FRIENDS.partyKind(), decor: __game.DASHA.decor() }; });
      ok('party: once a year — a reload the same day: no second party, the decor is still up', rr.party !== 'dasha' && rr.decor, rr);
      // the same context = the same save and album
      const n2 = await ctx.newPage(); n2.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); await n2.clock.setFixedTime(day(2026, 11, 22)); await n2.goto(FILE, { waitUntil: 'load' }); await n2.waitForFunction(() => window.__game && __game.APP, null, { timeout: 20000 }); await n2.waitForTimeout(600);
      const nx = await E(n2, () => ({ decor: __game.DASHA.decor(), due: !!__game.DASHA.due(), photo: __game.ALBUM.list().some((e) => e.k === 'dasha:2026') }));
      ok('party: the next day — the decor is gone, nothing due, the photo stays in the album', !nx.decor && !nx.due && nx.photo, nx);
      await browser.close(); browser = null;
    }
    // ================= 2b. «#bday»: a rehearsal on his phone before the day (the real game too) — nothing is marked done =================
    if (W('party') || W('rehearsal')) {
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const p = await opened(ctx, day(2026, 11, 10, 15), FILE + '#bday');
      const st = await partyTo(p, "!!__game.DASHA.blowInfo() && !!document.querySelector('#blow-finger')", 70000);
      const i0 = await E(p, () => ({ kind: __game.FRIENDS.partyKind(), n: (__game.DASHA.blowInfo() || {}).n }));
      await p.click('#blow-finger'); await E(p, () => { const H = __game.HOME; let k = 0; while (__game.DASHA.blowInfo() && __game.DASHA.blowInfo().lit && k++ < 8) for (const c of __game.DASHA.candles().filter((c) => c.lit)) { H.down(c.x, c.y); H.up(c.x, c.y); __adv(16); } });
      const te = await partyTo(p, "!__game.FRIENDS.partyOn()", 70000);
      const sv = await E(p, () => ({ party: Object.keys(__game.GAME.S.dasha.party), gifts: Object.keys(__game.GAME.S.dasha.gifts) }));
      ok(`rehearsal: «#bday» on 10.11 in the real game — the party with ${i0.n} candles at once; afterwards nothing marked done (${JSON.stringify(sv)})`, st >= 0 && i0.kind === 'dasha' && i0.n === 24 && te >= 0 && !sv.party.length && !sv.gifts.length, { i0, sv, st, te });
      const seed = { k: SAVE_KEY, v: await E(p, () => { __game.GAME.save(true); return localStorage.getItem('martyn_tamagotchi_v1'); }) }; await browser.close();
      browser = await launch(); const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } }); const q = await page0(ctx2, { date: day(2026, 11, 21, 15), seed });
      const real = await partyTo(q, "__game.FRIENDS.partyKind() === 'dasha'", 15000);
      ok(`rehearsal: the real party still comes on 21.11 (${real} ms)`, real >= 0, real);
      await browser.close(); browser = null;
    }
    // ================= 3. the microphone: blow → out; talk / music / claps / a quiet room → not =================
    if (W('blow') || W('look')) {
      const r = spawnSync('python3', [path.join(ROOT, 'tools', 'blow_wavs.py'), WAV], { encoding: 'utf8' }); ok('blow: test signals made (tools/blow_wavs.py)', r.status === 0, r.stderr.slice(-300));
      browser = await launch(); const ctx0 = await browser.newContext({ viewport: { width: 390, height: 844 } }); const seed = await seedFrom(ctx0, day(2026, 11, 18)); await browser.close(); browser = null;
      const CASES = W('blow') ? [['blow', 1], ['soft', 1], ['fff', 1], ['speech', 0], ['voice', 0], ['music', 0], ['claps', 0], ['quiet', 0]] : [['blow', 1]];
      for (const [sig, yes] of CASES) {
        browser = await launch(['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + path.join(WAV, sig + '.wav')]);
        const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['microphone'] });
        const p = await page0(ctx, { date: day(2026, 11, 21, 18), seed });
        const tb = await partyTo(p, "!!__game.DASHA.blowInfo() && !!document.querySelector('#blow-mic')", 60000);
        await p.click('#blow-mic'); let info = null, lvl = 0, t0 = Date.now();
        for (let i = 0; i < 40; i++) { await p.waitForTimeout(200); info = await E(p, () => __game.DASHA.blowInfo() || { lit: 0, done: 1 }); lvl = Math.max(lvl, info.lvl || 0); if (!info.lit) break; }
        const secs = ((Date.now() - t0) / 1000).toFixed(1), out = 24 - (info.lit || 0);
        if (yes) ok(`blow: «${sig}» into the mic puts all 24 candles out (${secs} s, mode ${info.mode || 'done'})`, tb >= 0 && !info.lit, info);
        else ok(`blow: «${sig}» does not blow them out (${out} of 24 out in ${secs} s; the flames still lean to it: level ${lvl.toFixed(2)})`, tb >= 0 && out <= (sig === 'speech' ? 3 : 1) && (sig === 'quiet' || lvl > 0.05), info);
        if (yes && sig === 'blow') { const m = await E(p, () => { __adv(1500); return { mic: __game.DASHA.micOn(), music: __game.AUDIO.quietOn(), scroll: document.getElementById('stage').scrollTop }; }); ok('blow: after the candles the microphone is let go and the music comes back; the picture did not slide up', !m.mic && !m.music && m.scroll === 0, m); }
        if (W('look') && sig === 'blow') await p.screenshot({ path: path.join(LOOK, 'r22_mic.png') });
        await browser.close(); browser = null;
      }
    }
    // ================= 4. no microphone (refused / none) → the finger, said plainly =================
    if (W('deny')) {
      browser = await launch(); const ctx0 = await browser.newContext({ viewport: { width: 390, height: 844 } }); const seed = await seedFrom(ctx0, day(2026, 11, 18));
      const p = await page0(ctx0, { date: day(2026, 11, 21, 18), seed, init: () => { if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })); } });
      await partyTo(p, "!!__game.DASHA.blowInfo() && !!document.querySelector('#blow-mic')", 60000); await p.click('#blow-mic'); await p.waitForTimeout(400);
      const d = await E(p, () => ({ mode: __game.DASHA.blowInfo().mode, txt: document.querySelector('#blow').textContent }));
      ok(`deny: the microphone refused → «${d.txt.trim().slice(0, 70)}»`, d.mode === 'finger' && /пальц/i.test(d.txt) && /микрофон/i.test(d.txt), d);
      await browser.close(); browser = null;
    }
    // ================= 5. the dates =================
    if (W('life')) {
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const seed = await seedFrom(ctx, day(2026, 11, 10));
      const at = async (d, ms = 9000) => { const p = await page0(ctx, { date: d, seed }); const r = await E(p, (ms) => { let k = null; for (let t = 0; t < ms; t += 50) { __adv(50); if (__game.UI.hasModal()) __game.UI.closeModal(); k = __game.FRIENDS.partyKind() || k; if (__game.DASHA.blowInfo()) break; } const D = __game.DASHA, i = D.blowInfo(); return { due: D.due(), kind: k, n: i ? i.n : null, room: __game.HOME.room, decor: D.decor() }; }, ms); await p.close(); return r; };
      const a = await at(day(2026, 11, 20)); ok('life: 20.11 — nothing yet', !a.due && a.kind !== 'dasha' && !a.decor, a);
      const b = await at(day(2026, 11, 21, 9), 60000); ok(`life: 21.11 — the party (${b.n} candles), he takes her to the zal`, b.kind === 'dasha' && b.n === 24 && b.room === 'zal', b);
      const c = await at(day(2026, 11, 26, 20), 60000); ok('life: not in the game on her birthday — the party comes on her next visit within a week (26.11)', c.kind === 'dasha' && c.n === 24, c);
      const e = await at(day(2026, 11, 29)); ok('life: a week later (29.11) — not any more', !e.due && e.kind !== 'dasha', e);
      const f = await at(day(2027, 11, 21, 12), 60000); ok(`life: next year (21.11.2027) — again, ${f.n} candles`, f.kind === 'dasha' && f.n === 25, f);
      await browser.close(); browser = null;
    }
    // ================= 6. «24 секрета»: the skeleton — 24 places, a few each day; empty texts are not hidden; the test build shows samples =================
    if (W('secrets') || W('album') || W('look')) {
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const p = await opened(ctx, day(2026, 11, 21, 15));
      const m = await E(p, () => { const D = __game.DASHA, L = D.secrets(); return { slots: __game.DATA.DASHA.secrets.length, open: L.length, tab: false }; });
      const md = '/tmp/r22_secrets.md', tpl = fs.readFileSync(path.join(ROOT, 'docs', '24-secrets.md'), 'utf8'); // his texts come from docs/24-secrets.md
      fs.writeFileSync(md, tpl.replace(/(## №1 [^\n]*\nТекст:\n)/, '$1Ты — мой самый любимый человек.\nВторая строка.\n').replace(/(## №24 [^\n]*\nТекст:\n)/, '$1Последний <секрет> & всё!\n').replace(/(## Финал[^\n]*\nТекст:\n)/, '$1Я тебя люблю!\n'));
      const pj = spawnSync('python3', [path.join(ROOT, 'tools', 'secrets_md.py'), md], { encoding: 'utf8' }), pe = spawnSync('python3', [path.join(ROOT, 'tools', 'secrets_md.py')], { encoding: 'utf8' });
      let px = {}; try { px = JSON.parse(pj.stdout); } catch (e) { }
      ok(`secrets: docs/24-secrets.md — 24 numbered slots with the room and the place; the filled ones are read (${Object.keys(px).join(', ')}), the empty template gives none`, (tpl.match(/^## №\d+ /gm) || []).length === 24 && px[1] === 'Ты — мой самый любимый человек.\nВторая строка.' && px[24] === 'Последний <секрет> & всё!' && px.final === 'Я тебя люблю!' && Object.keys(px).length === 3 && pe.stdout.trim() === '{}', { px, e: pj.stderr.slice(-200) });
      ok(`secrets: the main build — 24 slots, none hidden yet (no texts from him): ${m.open} open`, m.slots === 24 && m.open === 0, m);
      const sch = await E(p, () => { const D = __game.DASHA, S = __game.DATA.DASHA.secrets; S.forEach((x, i) => { x.text = 'Текст ' + (i + 1); }); const r = { open: D.secrets().length, cur: D.current() && D.current().n }; S.forEach((x) => { x.text = ''; }); return r; });
      ok(`secrets: with texts — one heart at a time (Round 23): ${sch.open} hidden, №${sch.cur} first`, sch.open === 1 && sch.cur === 1, sch);
      await browser.close(); browser = null;
      browser = await launch(); const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const q = await opened(ctx2, day(2026, 11, 15), TFILE); await E(q, () => { __calm(); __game.GAME.S.tut = __game.DATA.TUT.length; while (__game.UI.hasModal()) __game.UI.closeModal(); });
      // Round 23: one at a time — walk all 24 (each is the hidden one in turn: it is tapped where it is drawn), then forget them again
      const L = await E(q, () => { const D = __game.DASHA, F = __game.GAME.S.dasha.found, out = []; let h; while ((h = D.current()) && out.length < 30) { __game.HOME.goTo(h.room, true); __adv(50); out.push({ n: h.n, room: h.room, x: h.x, y: h.y, text: h.text, hit: !!D.hit(h.room, h.x, h.y) }); F[h.n] = 1; } for (const k of Object.keys(F)) delete F[k]; return out; });
      const rooms = new Set(L.map((s) => s.room)), inside = L.every((s) => s.x >= 2 && s.x <= 179 && s.y >= 44 && s.y <= 274), hitAll = L.filter((s) => !s.hit).map((s) => s.n);
      ok(`secrets: the test build — 24 samples one after another, in ${rooms.size} rooms, all inside the picture, off the HUD and the bar`, L.length === 24 && rooms.size === 5 && inside && L.every((s) => /записка/.test(s.text)), { n: L.length, rooms: [...rooms] });
      ok(`secrets: each heart can be tapped where it is drawn (missed: ${hitAll.join(',') || 'none'})`, hitAll.length === 0, hitAll);
      const f = await E(q, () => { const h = __game.DASHA.current(); __game.HOME.goTo(h.room, true); __adv(600); __tap(h.x, h.y); __adv(900); const mb = document.querySelector('#modal .mbox'); return { n: h.n, room: h.room, txt: mb ? mb.textContent : '', found: __game.DASHA.foundN() }; });
      ok(`secrets: a tap on heart №${f.n} (${f.room}) → its card «${f.txt.trim().slice(0, 60)}», 1 found`, f.n === 1 && /Секрет/.test(f.txt) && /1 из 24/.test(f.txt) && f.found === 1, f);
      if (W('look')) { await q.waitForTimeout(400); await q.screenshot({ path: path.join(LOOK, 'r22_secret.png') }); }
      await closeModals(q);
      const tab = await E(q, () => { __game.UI.openAlbum('hearts'); const b = document.querySelector('#sh-body'); return { txt: b ? b.textContent : '', tabs: [...document.querySelectorAll('.tabs .tab, [data-tab]')].map((x) => x.textContent.trim()) }; });
      ok(`secrets: the album has «Сердечки» — «${tab.txt.trim().slice(0, 50)}»`, /Найдено 1 из 24/.test(tab.txt), tab);
      if (W('look')) { await q.waitForTimeout(400); await q.screenshot({ path: path.join(LOOK, 'r22_hearts.png') }); }
      await reload(q); const kept = await E(q, () => __game.DASHA.foundN()); ok('secrets: found hearts are kept after a reload', kept === 1, kept);
      if (W('look')) { await E(q, PAGE_HELPERS); await E(q, () => { __game.UI.closeSheet && __game.UI.closeSheet(); while (__game.UI.hasModal()) __game.UI.closeModal(); __game.HOME.goTo('zal', true); __adv(500); }); await q.screenshot({ path: path.join(LOOK, 'r22_zal_hearts.png') }); }
      if (W('album')) {
        const al = await E(q, () => { for (let i = 0; i < 45; i++) __game.ALBUM.add({ k: 'photo', src: 'data:image/png;base64,iVBORw0KGgo=' }); __game.ALBUM.add({ k: 'dasha:2026', title: 'День рождения Дашулика', src: 'data:image/png;base64,iVBORw0KGgo=' }); for (let i = 0; i < 45; i++) __game.ALBUM.add({ k: 'party', src: 'data:image/png;base64,iVBORw0KGgo=' }); return __game.ALBUM.list().filter((e) => e.k.startsWith('dasha')).length; });
        ok('album: her birthday photo is never pushed out by newer photos', al === 1, al);
      }
      await browser.close(); browser = null;
    }
    // ================= 7. the voice: his new lines are voiced whole =================
    if (W('voice')) {
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await opened(ctx, day(2026, 11, 15));
      await p.waitForFunction(() => __game.AUDIO.voiceReady && (window.SPEECH && SPEECH.ready & 1), null, { timeout: 20000 }).catch(() => { });
      const v = await E(p, () => { const L = __game.DATA.LINES, ks = Object.keys(L).filter((k) => /^d[A-Z]/.test(k)); const bad = []; for (const k of ks) for (const t of L[k]) { const pl = __game.AUDIO._plan(t); if (!pl.length || pl.some((s) => s.id && !/^[LR]/.test(s.id))) bad.push(t); } return { n: ks.length, lines: ks.reduce((a, k) => a + L[k].length, 0), bad }; });
      ok(`voice: every new birthday line (${v.lines} in ${v.n} groups) has its own clip (none spelled out of syllables)`, v.n >= 8 && v.bad.length === 0, v);
      await browser.close(); browser = null;
    }
    // ================= 8. GitHub Pages: the site works from a sub-folder (https://emoorpheus.github.io/abibyan/) =================
    if (W('site')) {
      const SITE = path.join(DIST, 'site'), files = fs.readdirSync(SITE), big = files.filter((f) => fs.statSync(path.join(SITE, f)).size > 25e6);
      const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8'), sw = fs.readFileSync(path.join(SITE, 'sw.js'), 'utf8'), man = JSON.parse(fs.readFileSync(path.join(SITE, 'manifest.webmanifest'), 'utf8'));
      const abs = /(?:href|src)=["']\/(?!\/)/.test(html) || /'\/[a-z]/.test(sw) || /^\//.test(man.start_url) || /^\//.test(man.scope);
      ok(`site: ready for GitHub Pages — ${files.length} files (web upload ≤ 100), each < 25 MB, .nojekyll, only relative paths`, files.length <= 100 && !big.length && files.includes('.nojekyll') && !abs, { files, big, abs });
      const doc = path.join(ROOT, 'docs', 'GITHUB_PAGES.md'); const g = fs.existsSync(doc) ? fs.readFileSync(doc, 'utf8') : '';
      ok('site: docs/GITHUB_PAGES.md — step by step in Russian, the link, microphone needs https', /github\.io\/abibyan/.test(g) && /Settings/.test(g) && /Pages/.test(g) && /микрофон/i.test(g), g.length);
      const root = fs.mkdtempSync('/tmp/r22site-'); fs.symlinkSync(SITE, path.join(root, 'abibyan')); await serve(root);
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await page0(ctx, { url: `http://localhost:${PORT}/abibyan/`, date: day(2026, 11, 21, 12) });
      await p.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 15000 }).catch(() => { });
      const s = await E(p, async () => { const r = await navigator.serviceWorker.getRegistration(); const m = document.querySelector('link[rel=manifest]'); return { scope: r && r.scope, man: m && m.href, gift: __game.DASHA.giftOn(), voice: !!(window.SPEECH && SPEECH.ready & 1) }; });
      ok(`site: from /abibyan/ the game starts (the gift), the offline worker's scope ${s.scope}, the voice loads`, s.gift && /\/abibyan\/$/.test(s.scope || '') && /\/abibyan\/manifest/.test(s.man || ''), s);
      await browser.close(); browser = null; srv.kill(); srv = null;
    }
    // ================= 9. the card with the QR code =================
    if (W('card')) {
      const r = spawnSync('python3', [path.join(ROOT, 'tools', 'card.py')], { encoding: 'utf8' });
      const pdf = path.join(DIST, 'abibyan-card.pdf'), png = path.join(DIST, 'abibyan-card.png');
      ok('card: tools/card.py makes dist/abibyan-card.pdf + .png', r.status === 0 && fs.existsSync(pdf) && fs.existsSync(png), r.stderr.slice(-300));
      const q = spawnSync('python3', ['-c', `import cv2; im = cv2.imread('${png}'); print(cv2.QRCodeDetector().detectAndDecode(im)[0])`], { encoding: 'utf8' });
      ok(`card: its QR code opens ${q.stdout.trim()}`, q.stdout.trim() === URL, q.stdout + q.stderr.slice(-200));
      const pg = spawnSync('pdfinfo', [pdf], { encoding: 'utf8' }); const pages = +((pg.stdout.match(/Pages:\s+(\d+)/) || [])[1] || 0), size = (pg.stdout.match(/Page size:\s+([^\n]+)/) || [])[1] || '';
      ok(`card: 2 pages (front + back), postcard size (${size})`, pages === 2 && /(\d+(\.\d+)?) x (\d+(\.\d+)?) pts/.test(size), pg.stdout.slice(0, 200));
    }
  } catch (e) { ok('crashed: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | '), false); }
  if (srv) srv.kill();
  if (!browser) browser = await launch();
  await done(errs, browser);
})();
