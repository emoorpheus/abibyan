// Round 26: node test/r26.js [build,game,later,none,webkit] → exit 1 on fail.
// «Записки под замком» (user 08.11: «зашифровать записки фразой, которую знает только Даша»; «фразу точно перед первым сердечком»;
// «если оно всё будет в гитхаб и не нужно будет включённое устройство»): his notes (texts + pictures) are in the page only as a cipher —
// AES-GCM, the key from her answer through PBKDF2-SHA256 (tools/secret_box.py when building, WebCrypto in her phone: no server, no
// internet). The first heart she finds asks her question; the right answer (any case, ё/е, spaces, punctuation) opens the note and the
// key stays in her save, so the next hearts open by themselves; «Потом» leaves the heart found and the album asks again; after 3 wrong
// answers the hint. The answer lives outside the repo (~/.config/abibyan/phrase.txt or $ABIBYAN_PHRASE_FILE): notes without it → the
// build stops and writes nothing; no notes → nothing changes. Every build here is made in a copy of the repo in /tmp (fixture notes +
// a fixture phrase): the real dist/ is never touched.
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const { ok, done, want, fs, PAGE_HELPERS } = require('./lib/h.js');
const { webkit } = require('./lib/webkit.js');
const path = require('path'), crypto = require('crypto'), { spawnSync } = require('child_process');
const W = want(), ROOT = path.join(__dirname, '..'), LOOK = path.join(ROOT, 'test', 'look');
const FX = '/tmp/r26_fx', FX0 = '/tmp/r26_fx0', PH = '/tmp/r26_phrase.txt', NOPH = '/tmp/r26_no_such_phrase.txt';
const Q = 'На чём мы ехали в первый вечер?', HINT = 'Едет по рельсам и звенит', ANSWER = 'Шёлковый трамвай', TYPED = '  ШЕЛКОВЫЙ, трамвай!! ';
const T1 = 'Ты — мой самый любимый человек.\nВторая строка.', T3 = 'Последний <секрет> & всё!', FIN = 'До луны и обратно — финальная записка №24';
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='; // 1×1: the picture for №3
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const errs = []; let browser = null;
const day = (y, m, d, h = 13) => new Date(y, m - 1, d, h, 0);
const launch = () => chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const url = (dir, f) => 'file://' + path.join(dir, 'dist', f);
const sha = (f) => { try { return crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex'); } catch (e) { return null; } };

// a copy of what build.py reads, with his notes filled in (or the empty template, as it is now)
function fixture(dir, filled) {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (const d of ['src', 'assets', 'docs', 'tools']) fs.cpSync(path.join(ROOT, d), path.join(dir, d), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'build.py'), path.join(dir, 'build.py'));
  const sec = path.join(dir, 'assets', 'secrets'); fs.rmSync(sec, { recursive: true, force: true });
  if (!filled) {
    const md = path.join(dir, 'docs', '24-secrets.md');
    fs.writeFileSync(md, fs.readFileSync(md, 'utf8').replace(/(## (?:№\d+|Финал) [^\n]*\nТекст:\n)(?:[\s\S]*?)(?=\n---\n|\n## |$)/g, '$1\n'));
    return;
  }
  const md = path.join(dir, 'docs', '24-secrets.md');
  const tpl = fs.readFileSync(md, 'utf8').replace(/(## (?:№\d+|Финал) [^\n]*\nТекст:\n)(?:[\s\S]*?)(?=\n---\n|\n## |$)/g, '$1\n');
  fs.writeFileSync(md, tpl.replace(/(## №1 [^\n]*\nТекст:\n)/, (m) => m + T1 + '\n').replace(/(## №3 [^\n]*\nТекст:\n)/, (m) => m + T3 + '\n').replace(/(## Финал[^\n]*\nТекст:\n)/, (m) => m + FIN + '\n'));
  fs.mkdirSync(sec, { recursive: true }); fs.writeFileSync(path.join(sec, '3.png'), Buffer.from(PNG, 'base64'));
}
// build.py in that copy — never while build.py still writes into /data/game (that would overwrite the real dist/)
function build(dir, phrase) {
  if (/\/data\/game/.test(fs.readFileSync(path.join(dir, 'build.py'), 'utf8'))) return { status: -1, stdout: '', stderr: 'not run: build.py writes into /data/game' };
  return spawnSync('python3', ['build.py'], { cwd: dir, encoding: 'utf8', env: { ...process.env, ABIBYAN_PHRASE_FILE: phrase } });
}
let fxb = null; // the copy with notes, built once
function fxBuilt() { if (!fxb) { fixture(FX, true); fs.writeFileSync(PH, `вопрос: ${Q}\nответ: ${ANSWER}\nподсказка: ${HINT}\n`); fxb = build(FX, PH); } return fxb; }

async function page0(ctx, o = {}) {
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push('pageerror: ' + e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 3).join(' | ')));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_FILE_NOT_FOUND/.test(m.text())) errs.push('console: ' + m.text()); });
  if (o.date) await page.clock.setFixedTime(o.date);
  if (o.nodate) await page.addInitScript(() => { window.ABI_NODATE = 1; });
  await page.goto(o.url, { waitUntil: 'load', timeout: 60000 }); await ready(page); return page;
}
async function ready(page) { await page.waitForFunction(() => window.__game && __game.APP, null, { timeout: 20000 }); await page.waitForTimeout(800); await page.evaluate(PAGE_HELPERS); }
const E = (page, fn, a) => page.evaluate(fn, a);
async function opened(ctx, o) { const p = await page0(ctx, o); await E(p, () => { const b = document.querySelector('#nm-ok'); if (b) b.click(); }); await p.waitForTimeout(400); await E(p, PAGE_HELPERS); return p; }
// the test build on 15.11 (no 21.11 shift), the tutorial done, calm: the hearts are the only thing going on (as in test/r23.js)
const settle = (q) => E(q, () => { __calm(); __game.GAME.S.tut = __game.DATA.TUT.length; __game.GAME.S.dasha.seen = 1; while (__game.UI.hasModal()) __game.UI.closeModal(); __adv(3000); while (__game.UI.hasModal()) __game.UI.closeModal(); });
async function heartsPage(ctx, u) { const q = await opened(ctx, { date: day(2026, 11, 15), url: u, nodate: true }); await settle(q); return q; }
// walk to the hidden heart and tap it: what shows then
const findCur = (q) => E(q, () => { const D = __game.DASHA, h = D.current(); if (!h) return { n: null, txt: '' };
  __game.HOME.goTo(h.room, true); __adv(600); __tap(h.x, h.y); __adv(900); const mb = document.querySelector('#modal .mbox');
  return { n: h.n, txt: mb ? mb.innerText : '', ask: !!document.querySelector('#modal #dp'), card: !!document.querySelector('#modal .hcard'), found: Object.keys(__game.GAME.S.dasha.found).map(Number) }; });
// type an answer, press «Открыть» (or Enter) and wait: the lock opens or it says «Не то…»
async function answer(q, s, enter) {
  if (!(await q.$('#dp'))) return;
  await q.fill('#dp', s); if (enter) await q.press('#dp', 'Enter'); else await q.click('#dp-ok');
  await q.waitForFunction(() => { const b = document.querySelector('#dp-ok'), e = document.querySelector('#modal .herr'); return !b || (!b.disabled && /Не то/.test(e ? e.textContent : '')); }, null, { timeout: 60000 }).catch(() => { });
}

(async () => {
  try {
    fs.mkdirSync(LOOK, { recursive: true });
    // ================= 1. the build: a cipher, never his texts; notes without her phrase → it stops =================
    if (W('build')) {
      const b = fxBuilt(), line = (b.stdout.match(/secrets:[^\n]*/) || [''])[0];
      ok(`build: a copy of the repo builds into its own dist/ with his notes + her phrase file and says they are locked («${line}»)`, b.status === 0 && /secrets: 2 texts \+ the final note, 1 picture/.test(line) && /locked/.test(line), String(b.stderr || '').trim().split('\n').slice(-3).join(' | '));
      const pages = ['index.html', 'abibyan.html', 'abibyan-test.html', 'site/index.html', 'site/test.html'].map((f) => { const p = path.join(FX, 'dist', f); return { f, h: b.status === 0 && fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '' }; });
      const secret = [T1.split('\n')[0], 'Вторая строка', T3, FIN, PNG.slice(24, 64)], leak = pages.filter((p) => !p.h || secret.some((s) => p.h.includes(s)) || /шёлков|шелков/i.test(p.h)).map((p) => p.f);
      ok(`build: none of the 5 pages has his texts, the picture or her answer in it (missing / leaking: ${leak.join(', ') || 'none'})`, leak.length === 0, leak);
      ok('build: what the pages do carry — the cipher, her question (it is asked in the game) and which numbers have a note', pages.every((p) => p.h.includes(Q) && /"n": ?\[1, ?3\]/.test(p.h) && /"ct": ?"[A-Za-z0-9+/=]{40,}"/.test(p.h)), pages.map((p) => p.f + ':' + p.h.length));
      const before = sha(path.join(FX, 'dist', 'index.html')), nb = build(FX, NOPH);
      ok(`build: notes but no phrase file → it stops with a message and writes nothing («${String(nb.stderr || '').trim().split('\n').pop()}»)`, !!before && nb.status !== 0 && nb.status !== -1 && /фраз/i.test(nb.stderr || '') && sha(path.join(FX, 'dist', 'index.html')) === before, { status: nb.status });
      const ck = spawnSync('python3', [path.join(FX, 'tools', 'secret_box.py'), 'check'], { encoding: 'utf8', env: { ...process.env, ABIBYAN_PHRASE_FILE: PH } });
      ok(`build: tools/secret_box.py check shows the question and the hint, never the answer («${String(ck.stdout || '').trim()}»)`, ck.status === 0 && ck.stdout.includes(Q) && ck.stdout.includes(HINT) && !/шёлков|шелков/i.test(ck.stdout), String(ck.stderr || '').slice(-200));
    }
    // ================= 2. the game: the first heart asks her question, the right answer opens it and is kept =================
    if (W('game')) {
      fxBuilt(); browser = browser || await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const q = await heartsPage(ctx, url(FX, 'abibyan-test.html'));
      const a = await E(q, () => { const D = __game.DASHA, h = D.current(); return { cur: h && h.n, sealed: D.sealed ? D.sealed() : 'none' }; });
      ok(`game: the notes are locked, yet hearts are hidden for the numbers that have a note — the first is №${a.cur}`, a.cur === 1 && a.sealed === true, a);
      const f = await findCur(q);
      ok(`game: heart №1 found → her question first, not the note («${String(f.txt).replace(/\s+/g, ' ').slice(0, 80)}»)`, f.ask && f.txt.includes(Q) && !f.card && !/Секрет №1/.test(f.txt) && (f.found || []).includes(1), f);
      await q.screenshot({ path: path.join(LOOK, 'r26_question.png') });
      const fld = await E(q, () => { const i = document.querySelector('#dp'); if (!i) return null; const cs = getComputedStyle(i); return { fs: parseFloat(cs.fontSize), ac: i.getAttribute('autocapitalize'), co: i.getAttribute('autocorrect'), sp: i.getAttribute('spellcheck'), cmp: i.getAttribute('autocomplete') }; });
      ok(`game: the answer field ${fld && fld.fs} px (≥ 16: no zoom on the iPhone), no capitals / autocorrect / spellcheck / autofill`, !!fld && fld.fs >= 16 && fld.ac === 'none' && fld.co === 'off' && fld.sp === 'false' && fld.cmp === 'off', fld);
      await answer(q, 'Трамвай');
      const w1 = await E(q, () => ({ txt: (document.querySelector('#modal .mbox') || {}).innerText || '', card: !!document.querySelector('#modal .hcard'), body: document.body.innerText }));
      ok(`game: a wrong answer → «${(w1.txt.match(/Не то[^\n]*/) || [''])[0]}», the question stays, no note anywhere`, /Не то/.test(w1.txt) && w1.txt.includes(Q) && !w1.card && !w1.body.includes('самый любимый'), w1.txt.slice(0, 200));
      await answer(q, 'автобус'); await answer(q, 'метро');
      const w3 = await E(q, () => (document.querySelector('#modal .herr') || {}).textContent || '');
      ok(`game: after 3 wrong answers the hint shows («${w3}»)`, w3.includes(HINT), w3);
      await answer(q, TYPED, true); await q.waitForSelector('#modal .hcard', { timeout: 15000 }).catch(() => { });
      const c1 = await E(q, () => { const c = document.querySelector('#modal .hcard'); return { txt: c ? c.innerText : '', ask: !!document.querySelector('#dp'), key: __game.GAME.S.dasha.key || '', saved: localStorage.getItem('martyn_tamagotchi_test_v1') || '' }; });
      ok(`game: the right answer in any case / ё / spaces / punctuation («${TYPED}» for «${ANSWER}») + Enter → the card «Секрет №1» with his text`, /Секрет №1/.test(c1.txt) && c1.txt.includes(T1.split('\n')[0]) && !c1.ask, c1.txt.slice(0, 200));
      ok(`game: the key is kept in her save (${c1.key.length} chars), so she answers once; his text is not stored there`, c1.key.length >= 40 && c1.saved.includes(c1.key) && !c1.saved.includes('самый любимый'), {});
      await q.screenshot({ path: path.join(LOOK, 'r26_note.png') });
      await q.reload({ waitUntil: 'load' }); await ready(q); await settle(q);
      const f3 = await findCur(q); await q.waitForSelector('#modal .hcard', { timeout: 15000 }).catch(() => { });
      const c3 = await E(q, () => { const c = document.querySelector('#modal .hcard'), im = c && c.querySelector('img.hpic'); return { txt: c ? c.innerText : '', ask: !!document.querySelector('#dp'), img: im ? im.getAttribute('src').slice(0, 22) : '' }; });
      ok(`game: after a reload the next heart (№${f3.n}; №2 has no note) opens at once — no question; its picture, «${T3}» as text and the final note`, f3.n === 3 && !f3.ask && !c3.ask && c3.txt.includes(T3) && c3.txt.includes(FIN) && c3.img === 'data:image/png;base64,', { f3: f3.n, c3 });
      await ctx.close();
    }
    // ================= 3. «Потом»: the heart stays found, the album asks again =================
    if (W('later')) {
      fxBuilt(); browser = browser || await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const p = await heartsPage(ctx, url(FX, 'abibyan-test.html')); const f = await findCur(p);
      const l = await E(p, async () => { const D = __game.DASHA, x = document.querySelector('#modal [data-close]'); if (x) x.click(); __adv(300);
        const r = { gone: !document.querySelector('#dp'), found: Object.keys(__game.GAME.S.dasha.found).map(Number) };
        const div = document.createElement('div'); div.innerHTML = D.albumHtml(); document.body.appendChild(div); D.albumBind(div);
        const c = div.querySelector('.hs[data-n="1"]'); r.cell = c ? c.className + ' | ' + c.innerText.replace(/\s+/g, ' ') : null;
        if (c) c.click(); await new Promise((k) => setTimeout(k, 150)); r.again = !!document.querySelector('#dp'); div.remove(); return r; });
      ok(`later: «Потом» closes the question, heart №1 stays found; the album shows it «Под замком» (${l.cell}) and a tap asks again`, f.ask && l.gone && l.found.includes(1) && /\bon\b/.test(l.cell || '') && /Под замком/.test(l.cell || '') && !/самый/.test(l.cell || '') && l.again, l);
      await ctx.close();
    }
    // ================= 4. no notes yet (as now): nothing changes =================
    if (W('none')) {
      fixture(FX0, false); const b = build(FX0, NOPH), line = (String(b.stdout || '').match(/secrets:[^\n]*/) || [''])[0];
      ok(`none: no notes and no phrase file → the build works as before («${line}»)`, b.status === 0 && /secrets: 0 texts, 0 pictures$/.test(line), String(b.stderr || '').trim().split('\n').slice(-2).join(' | '));
      if (b.status === 0) {
        browser = browser || await launch(); const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
        const q = await heartsPage(ctx, url(FX0, 'abibyan-test.html')); const f = await findCur(q);
        ok(`none: the test build keeps its samples — heart №${f.n} opens its card at once, no question`, f.n === 1 && f.card && !f.ask && /Здесь будет записка/.test(f.txt), { n: f.n, ask: f.ask, txt: String(f.txt).slice(0, 80) });
        const m = await heartsPage(ctx, url(FX0, 'index.html')); const r = await E(m, () => ({ on: __game.DASHA.heartsOn(), cur: !!__game.DASHA.current(), ask: !!document.querySelector('#dp') }));
        ok('none: the real game without notes hides no hearts and asks nothing', !r.on && !r.cur && !r.ask, r);
        await ctx.close();
      }
    }
    // ================= 5. Safari's engine: WebCrypto PBKDF2 + AES-GCM in WebKit =================
    if (W('webkit')) {
      const WK = webkit();
      if (!WK) ok('webkit: SKIPPED — no WebKit on this machine (test/lib/webkit.js); not checked in Safari\'s engine', true);
      else {
        fxBuilt(); const wb = await WK.launch(); const ctx = await wb.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: IOS_UA });
        const q = await heartsPage(ctx, url(FX, 'abibyan-test.html')); const f = await findCur(q);
        if (f.ask) { await answer(q, TYPED); await q.waitForSelector('#modal .hcard', { timeout: 30000 }).catch(() => { }); }
        const c = await E(q, () => { const e = document.querySelector('#modal .hcard'); return e ? e.innerText : ''; });
        ok(`webkit: in WebKit (Safari's engine) heart №${f.n} asks her question and the right answer opens the note (WebCrypto PBKDF2 + AES-GCM)`, f.n === 1 && f.ask && /Секрет №1/.test(c) && c.includes(T1.split('\n')[0]), { n: f.n, ask: f.ask, c: c.slice(0, 80) });
        await q.screenshot({ path: path.join(LOOK, 'r26_webkit.png') }); await wb.close();
      }
    }
  } catch (e) { ok('crashed: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | '), false); }
  if (!browser) browser = await launch();
  await done(errs, browser);
})();
