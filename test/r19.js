// Round 19 (plan R19): node test/r19.js [build,ready,voice,early,site,offline,hud] → test/look/r19_ready.json. Exit 1 on fail.
// «Лёгкий и быстрый»: the voice bank (10 MB of base64 MP3) no longer sits in the main script — the game shows its first frame first,
// the voice arrives right after (inert text blocks in the one-file build, voice1/voice2.txt on the website, cached for offline).
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const { ok, done, want, fs, boot, PAGE_HELPERS } = require('./lib/h.js');
const SPEED = require('./lib/speed.js'), lim = (ms, cpu) => Math.round(ms * SPEED.start(cpu)), x86 = (ms, cpu) => (SPEED.id === 'ref' ? '' : `, ${ms} on the x86 sandbox ×${SPEED.start(cpu).toFixed(2)}`); // Round 28: a slower machine's limits
console.log(SPEED.line());
const path = require('path'), vm = require('vm'), { spawn } = require('child_process');
const W = want(), ROOT = path.join(__dirname, '..'), DIST = path.join(ROOT, 'dist'), PORT = 8768, URL = `http://localhost:${PORT}/`;
const errs = []; let browser = null;
// the bank in the sources (what tools/tts.py and tools/rec.py wrote)
const bank = (() => { const c = {}; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/speech.js'), 'utf8') + '\n' + fs.readFileSync(path.join(ROOT, 'src/voice_rec.js'), 'utf8') + '\nthis.S = SPEECH;', c);
  const n = {}; for (const k of ['lines', 'words', 'syl', 'fx', 'rec']) n[k] = Object.keys(c.S[k] || {}).length; return n; })();
const parseVoice = (txt) => { const o = {}; let sec = null; for (const ln of txt.split('\n')) { if (!ln) continue; if (ln[0] === '@') { sec = ln.slice(1); o[sec] = o[sec] || {}; continue; } const k = ln.split('\t')[0]; o[sec][k] = 1; } const n = {}; for (const k in o) n[k] = Object.keys(o[k]).length; return n; };
const INIT = `(function f() { if (window.__game && window.__game.APP && !window.__ready) window.__ready = performance.now(); else if (!window.__ready) requestAnimationFrame(f); })();
  window.__vt = 0; (function g() { if (typeof SPEECH !== 'undefined' && SPEECH.ready === 3) window.__vt = performance.now(); else requestAnimationFrame(g); })();`;
const launch = () => chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function cold(url, cpu, route) { // a fresh browser, no save: ms to the first game frame and to the whole voice
  const b = await launch(), ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), page = await ctx.newPage(); page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  if (route) await route(page); const cdp = await ctx.newCDPSession(page); if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await page.addInitScript(INIT); await page.goto(url, { waitUntil: 'load', timeout: 120000 }); await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.waitForFunction(() => window.__vt, null, { timeout: 30000 }).catch(() => { });
  const r = await page.evaluate(() => ({ ready: Math.round(window.__ready), voice: Math.round(window.__vt), sp: typeof SPEECH !== 'undefined' ? SPEECH.ready : -1 })); await b.close(); return r;
}
let srv = null; const serve = async () => { if (srv) return; srv = spawn('python3', ['-m', 'http.server', String(PORT), '-d', path.join(DIST, 'site')], { stdio: 'ignore' }); await new Promise((r) => setTimeout(r, 900)); };
(async () => {
  try {
    // ================= the build: no voice in the main script, inert blocks after it =================
    if (W('build')) {
      for (const f of ['index.html', 'abibyan-test.html']) {
        const h = fs.readFileSync(path.join(DIST, f), 'utf8'), i = h.indexOf('<script>\n'), main = h.slice(i, h.indexOf('\n</script>', i));
        const blocks = [...h.matchAll(/<script type="text\/plain" class="vb" data-g="([12])">([\s\S]*?)<\/script>/g)];
        ok(`build ${f}: the main script has no voice data (${(main.length / 1048576).toFixed(2)} MB, was 11.2)`, main.length < 1.6 * 1048576 && !/"lines":\{"/.test(main), main.length);
        ok(`build ${f}: the voice comes after it in ≥20 inert blocks of ≤256 KB (groups 1 and 2)`, blocks.length >= 20 && blocks.every((m) => m[2].length <= 262144 + 4096) && blocks.some((m) => m[1] === '1') && blocks.some((m) => m[1] === '2') && h.indexOf('class="vb"') > i + main.length, { n: blocks.length, max: Math.max(0, ...blocks.map((m) => m[2].length)) });
        const got = parseVoice(blocks.map((m) => m[2]).join('\n'));
        ok(`build ${f}: …all of the bank is there (lines ${bank.lines}, words ${bank.words}, syl ${bank.syl}, fx ${bank.fx}, rec ${bank.rec})`, ['lines', 'words', 'syl', 'fx', 'rec'].every((k) => got[k] === bank[k]), { got, bank });
      }
    }
    // ================= the first frame comes fast, the voice right after =================
    if (W('ready')) {
      const u = 'file://' + path.join(DIST, 'index.html'), r1 = [await cold(u, 1), await cold(u, 1)], r4 = [await cold(u, 4), await cold(u, 4)];
      const m1 = Math.min(...r1.map((x) => x.ready)), m4 = Math.min(...r4.map((x) => x.ready));
      fs.writeFileSync(path.join(ROOT, 'test/look/r19_ready.json'), JSON.stringify({ r1, r4 }, null, 1));
      ok(`ready: the first game frame at CPU ×1 ≤ ${lim(600, 1)} ms (was 899${x86(600, 1)}): ${m1} ms`, m1 <= lim(600, 1), r1);
      ok(`ready: …at CPU ×4${SPEED.id === 'ref' ? ' (a mid phone)' : ''} ≤ ${lim(1600, 4)} ms (was 3352${x86(1600, 4)}): ${m4} ms`, m4 <= lim(1600, 4), r4);
      ok('ready: …and the voice is all there a moment later (SPEECH.ready 3)', [...r1, ...r4].every((x) => x.sp === 3 && x.voice >= x.ready), { r1, r4 });
    }
    // ================= the voice works as before =================
    if (W('voice')) {
      const r = await boot(); browser = r.browser; r.page.on('pageerror', (e) => errs.push(e.message));
      const v = await r.page.evaluate(async () => { const A = __game.AUDIO; A.set('music', false); A.init(); const n = {}; for (const k of ['lines', 'words', 'syl', 'fx', 'rec']) n[k] = Object.keys(SPEECH[k] || {}).length;
        const p = A._plan('Привет! Я так скучал!').filter((s) => !s.gap).map((s) => s.id[0]).join(''), t = A._plan('сегодня привет друг').filter((s) => !s.gap).map((s) => s.id[0]).join('');
        const dec = async (b64) => { try { const u = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); return (await A.ctx.decodeAudioData(u.buffer)).duration; } catch (e) { return 0; } };
        const k1 = Object.keys(SPEECH.lines)[0], k2 = Object.keys(SPEECH.words)[5], k3 = Object.keys(SPEECH.rec)[0], k4 = Object.keys(SPEECH.fx)[0];
        const d = [await dec(SPEECH.lines[k1][0]), await dec(SPEECH.words[k2][0]), k3 ? await dec(SPEECH.rec[k3][0]) : 1.0, await dec(SPEECH.fx[k4][0][0])];
        const res = A.say('Привет! Я так скучал!'); return { ready: SPEECH.ready, n, p, t, d, dur: res && res.dur, left: document.querySelectorAll('script.vb').length, durs: [SPEECH.lines[k1][1], SPEECH.syl[Object.keys(SPEECH.syl)[0]].length] }; });
      ok('voice: after the start the whole bank is in SPEECH (ready 3, same counts as the sources)', v.ready === 3 && ['lines', 'words', 'syl', 'fx', 'rec'].every((k) => v.n[k] === bank[k]), v);
      ok('voice: a game line is pre-spoken (TTS / his recording), typed text is glued from words — as before', /^[LR]+$/.test(v.p) && /W/.test(v.t), { p: v.p, t: v.t });
      ok('voice: clips decode (a line, a word, his recording, a reaction) and say() plays with a duration', v.d.every((x) => x > 0.05) && v.dur > 0.5 && /^\d+(\.\d+)?$/.test(v.durs[0]) && v.durs[1] === 3, v);
      ok('voice: the text blocks are freed from the page after reading', v.left === 0, v.left);
      await browser.close(); browser = null;
    }
    // ================= the website: a light index.html + voice files =================
    if (W('site') || W('early') || W('offline')) await serve();
    if (W('site')) {
      const h = fs.readFileSync(path.join(DIST, 'site/index.html'), 'utf8'), sw = fs.readFileSync(path.join(DIST, 'site/sw.js'), 'utf8');
      const v1 = path.join(DIST, 'site/voice1.txt'), v2 = path.join(DIST, 'site/voice2.txt'), has = fs.existsSync(v1) && fs.existsSync(v2);
      ok(`site: index.html is light — no voice inside (${(h.length / 1048576).toFixed(2)} MB, was 11.3)`, h.length < 1.6 * 1048576 && !h.includes('class="vb"'), h.length);
      const g = has ? parseVoice(fs.readFileSync(v1, 'utf8') + '\n' + fs.readFileSync(v2, 'utf8')) : {};
      ok('site: voice1.txt (lines, reactions, his recordings) + voice2.txt (words, syllables) hold the whole bank', has && ['lines', 'words', 'syl', 'fx', 'rec'].every((k) => g[k] === bank[k]) && parseVoice(fs.readFileSync(v1, 'utf8')).lines === bank.lines, g);
      ok('site: the service worker precaches both voice files', /'\.\/voice1\.txt'/.test(sw) && /'\.\/voice2\.txt'/.test(sw), sw.split('\n')[1]);
      const r = await cold(URL, 4); ok(`site: over http at CPU ×4 the first frame (${r.ready} ms, ≤ ${lim(1600, 4)}) comes before the voice (${r.voice} ms), then all of it arrives`, r.ready <= lim(1600, 4) && r.sp === 3 && r.voice > r.ready, r);
    }
    if (W('early')) { // the voice files come late (a slow network) — a line said before is spoken when they arrive
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }), page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(e.message));
      await page.route('**/voice*.txt', async (rt) => { await new Promise((r) => setTimeout(r, 1500)); await rt.continue(); });
      await page.goto(URL, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.__game && __game.APP, null, { timeout: 20000 });
      const a = await page.evaluate(() => { const A = __game.AUDIO; A.set('music', false); A.init(); const ready = SPEECH.ready; const r = A.say('Привет! Я так скучал!'); return { ready, r: r === null ? null : !!r, st: A.voiceState ? A.voiceState() : null }; });
      await page.waitForTimeout(2600);
      const b = await page.evaluate(() => ({ ready: SPEECH.ready, st: __game.AUDIO.voiceState ? __game.AUDIO.voiceState() : null }));
      ok('early: before the voice arrived — SPEECH empty, the line waits', a.ready === 0 && a.st && a.st.pend === 1, a);
      ok('early: …the voice arrived (ready 3) and the waiting line was spoken', b.ready === 3 && b.st && b.st.pend === 0 && b.st.played >= 1, b);
      await browser.close(); browser = null;
    }
    if (W('offline')) { // installed once → offline the game still has its voice
      browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }), page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(e.message));
      await page.goto(URL); await page.evaluate(() => navigator.serviceWorker.ready); await page.waitForTimeout(1500); await page.reload(); await page.waitForTimeout(1200);
      const cached = await page.evaluate(async () => { const ks = await caches.keys(), c = ks.length ? await caches.open(ks[0]) : null; return c ? (await c.keys()).map((r) => r.url.split('/').pop()) : []; });
      await ctx.setOffline(true); await page.reload(); await page.waitForFunction(() => typeof SPEECH !== 'undefined' && SPEECH.ready === 3, null, { timeout: 8000 }).catch(() => { });
      const o = await page.evaluate(() => ({ ready: typeof SPEECH !== 'undefined' ? SPEECH.ready : -1, game: !!(window.__game && __game.APP), lines: typeof SPEECH !== 'undefined' ? Object.keys(SPEECH.lines).length : 0 }));
      ok('offline: the voice files are in the offline cache', cached.includes('voice1.txt') && cached.includes('voice2.txt'), cached);
      ok('offline: no network — the game starts and speaks (ready 3)', o.game && o.ready === 3 && o.lines === bank.lines, o);
      await ctx.setOffline(false); await browser.close(); browser = null;
    }
    // ================= the game HUD: no DOM writes when nothing changed =================
    if (W('hud')) {
      const r = await boot(); browser = r.browser; r.page.on('pageerror', (e) => errs.push(e.message));
      const h = await r.page.evaluate(() => { __unlock(); __calm(); const G = __game, s = G.GAME.S; s.grow.stage = Math.max(1, s.grow.stage); s.st.energy = 100; while (G.UI.hasModal()) G.UI.closeModal();
        G.MINI.start('roofs', 1); __adv(800); let muts = 0; const mo = new MutationObserver((l) => { muts += l.length; }); for (const id of ['g-lvl', 'g-coins']) { const e = document.getElementById(id); if (e) mo.observe(e, { childList: true, characterData: true, subtree: true }); }
        let ch = 0, last = ''; for (let t = 0; t < 1500; t += 50) { window.advanceTime(50); const v = (document.getElementById('g-lvl') || {}).textContent + '|' + ((document.querySelector('#g-coins span') || {}).textContent); if (v !== last) { if (last) ch++; last = v; } }
        const rec = mo.takeRecords().length; mo.disconnect(); G.MINI.home(); return { muts: muts + rec, ch }; });
      ok('hud: the level / coins in the game HUD are rewritten only when they change (not every frame)', h.muts <= h.ch * 2 + 1, h);
      await browser.close(); browser = null;
    }
  } catch (e) { ok('r19: crashed — ' + String(e.message).split('\n')[0], false); }
  if (srv) srv.kill();
  await done(errs, { close: async () => { if (browser) await browser.close(); } });
})();
