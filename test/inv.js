// game-qa invariants (skill game-qa from skills.sh, + game-audio, playwright-best-practices): node test/inv.js [state,mute,persist,view,touch,fps]. Exit 1 on fail.
// The baseline checks every browser game must pass, on top of the round tests: the AI-readable state is valid, «Звуки/Музыка: Выкл» really
// silence everything (every sound goes through the sfx / music buses), the setting survives a reload, the screen fits real phones
// (no scroll, canvas fully visible, HUD on screen), a real finger tap on him works (touch, not mouse), the frame budget holds.
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const { boot, ok, done, PAGE_HELPERS } = require('./lib/h.js');
const SPEED = require('./lib/speed.js'), FPS = +(30 / SPEED.mid.k).toFixed(1), P50 = Math.round(34 * SPEED.mid.k); // Round 28: a mid phone on a slower machine
console.log(SPEED.line());
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const URL = 'file://' + require('path').join(__dirname, '..', 'dist', 'index.html'); // Round 28: the build next to this test (a worktree's own), not always master's
const launch = () => chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
// a page on a real phone profile: touch, mobile, DPR; skips the name prompt and the intro like h.js open()
async function phone(browser, vp, errs) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.clock.setFixedTime(new Date(2026, 10, 4, 13, 0));
  await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(700);
  await page.evaluate(() => { const b = document.querySelector('#nm-ok'); if (b) b.click(); }); await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelectorAll('[data-close]').forEach((b) => b.click()));
  await page.waitForFunction(() => window.__game && __game.APP.scene === 'home', null, { timeout: 6000 }).catch(() => { });
  await page.evaluate(PAGE_HELPERS); return { ctx, page };
}
(async () => {
  const { browser, page, errs } = await boot({ hour: 13 }); const E = (f, a) => page.evaluate(f, a);

  // ---------- render_game_to_text: valid, succinct, with the coordinate note ----------
  if (want('state')) {
    const t = await E(() => { const s = window.render_game_to_text(); return { len: s.length, o: JSON.parse(s) }; });
    const o = t.o, n = o.needs || {};
    ok('state: render_game_to_text is JSON with the coordinate note, scene, coins, 4 needs 0..100', /origin top-left/.test(o.note) && o.scene === 'home' && typeof o.coins === 'number' && ['food', 'fun', 'energy', 'clean'].every((k) => typeof n[k] === 'number' && n[k] >= 0 && n[k] <= 100), o);
    ok('state: …the monkey is on the 180×320 canvas', o.monkey && o.monkey.x >= 0 && o.monkey.x <= 180 && o.monkey.y >= 0 && o.monkey.y <= 320, o.monkey);
    ok('state: …and it stays succinct (< 6 KB)', t.len < 6000, t.len);
  }

  // ---------- «Звуки: Выкл» + «Музыка: Выкл» = silence (nothing bypasses the buses) ----------
  if (want('mute')) {
    const r = await E(async () => {
      const A = __game.AUDIO; A.init(); const ac = A.ctx; await ac.resume().catch(() => { });
      let made = 0; const wrap = (k) => { const o = ac[k].bind(ac); ac[k] = (...a) => { made++; return o(...a); }; };
      if (!ac.__wrapped) { ['createOscillator', 'createBufferSource', 'createMediaElementSource'].forEach(wrap); ac.__wrapped = () => made; }
      const count = async (fn, ms) => { const c0 = ac.__wrapped(); fn(); __adv(ms); await new Promise((r) => setTimeout(r, ms)); return ac.__wrapped() - c0; };
      const noise = () => { ['click', 'eat', 'coin', 'pop', 'boing', 'whoosh'].forEach((n) => A.has(n) && A.play(n)); A.say('Привет! Я Абибян!'); A.chat('zhuk', 'Жу-жу! Привет!'); __tap(90, 250); };
      A.set('sfx', false); A.set('music', false); const off = await count(noise, 1500);
      A.set('sfx', true); const on = await count(noise, 300);
      A.set('sfx', false); A.set('music', true); const mus = await count(() => { }, 2500);
      A.set('music', false); A.set('sfx', true); return { off, on, mus };
    });
    ok('mute: with «Звуки» and «Музыка» off nothing makes a sound (no oscillators / sources at all)', r.off === 0, r);
    ok('mute: …and the check can fail: with «Звуки» on the same actions do make sounds', r.on > 0, r);
    ok('mute: «Музыка» on alone plays the music', r.mus > 0, r);
  }

  // ---------- the settings buttons and a reload ----------
  if (want('persist')) {
    await E(() => { document.querySelector('#h-set').click(); }); await page.waitForTimeout(200);
    await E(() => document.querySelector('#t-sfx').click()); await page.waitForTimeout(200);
    await E(() => document.querySelector('#t-mus').click()); await page.waitForTimeout(200);
    const a = await E(() => ({ s: Object.assign({}, __game.GAME.S.settings), st: Object.assign({}, __game.AUDIO.st), lbl: [...document.querySelectorAll('#t-sfx,#t-mus')].map((b) => b.textContent) }));
    ok('persist: the settings buttons switch «Звуки» and «Музыка» off (state, audio, labels «Выкл»)', !a.s.sfx && !a.s.music && !a.st.sfx && !a.st.music && a.lbl.every((l) => l === 'Выкл'), a);
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(900); await page.evaluate(PAGE_HELPERS);
    const b = await E(() => ({ s: Object.assign({}, __game.GAME.S.settings), st: Object.assign({}, __game.AUDIO.st) }));
    ok('persist: …and stay off after a reload', !b.s.sfx && !b.s.music && !b.st.sfx && !b.st.music, b);
    await E(() => { const s = __game.GAME.S; s.settings.sfx = s.settings.music = true; __game.AUDIO.set('sfx', true); __game.AUDIO.set('music', true); __game.GAME.save(true); });
  }

  const b2 = (want('view') || want('touch')) ? await launch() : null;
  // ---------- real phones: the screen fits, nothing scrolls, the HUD is on screen ----------
  if (want('view')) {
    for (const [nm, vp] of [['iPhone SE', { width: 375, height: 667 }], ['iPhone 14', { width: 390, height: 844 }], ['iPhone Pro Max', { width: 430, height: 932 }], ['iPad', { width: 820, height: 1180 }], ['phone landscape', { width: 844, height: 390 }]]) {
      const { ctx, page: p } = await phone(b2, vp, errs);
      const v = await p.evaluate(() => { const r = document.getElementById('cv').getBoundingClientRect(), W = innerWidth, H = innerHeight;
        const hud = [...document.querySelectorAll('#h-set, #hud button, .hud button')].filter((b) => b.offsetParent).map((b) => b.getBoundingClientRect()).map((q) => ({ x: Math.round(q.x), y: Math.round(q.y), r: Math.round(q.right), b: Math.round(q.bottom) }));
        return { W, H, cv: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, hud }; });
      const c = v.cv, inside = c.x >= -1 && c.y >= -1 && c.x + c.w <= v.W + 1 && c.y + c.h <= v.H + 1;
      ok(`view: ${nm} ${vp.width}×${vp.height} — canvas fully visible, no page scroll`, inside && v.sw <= v.W + 1 && v.sh <= v.H + 1, v);
      ok(`view: ${nm} — the game is big enough (canvas ≥ 45 % of the shorter side scaled to 180×320)`, c.w >= Math.min(v.W, v.H * 180 / 320) * 0.45, c);
      ok(`view: ${nm} — every HUD button is on screen`, v.hud.length > 0 && v.hud.every((q) => q.x >= -1 && q.y >= -1 && q.r <= v.W + 1 && q.b <= v.H + 1), v.hud.slice(0, 4));
      await ctx.close();
    }
  }
  // ---------- a real finger: touch on the monkey reaches the game (pointer events from touch) ----------
  if (want('touch')) {
    const { ctx, page: p } = await phone(b2, { width: 390, height: 844 }, errs);
    await p.evaluate(() => { window.__calm(); __game.AUDIO.init(); window.__spy(); });
    const at = await p.evaluate(() => { const m = __T().monkey, r = document.getElementById('cv').getBoundingClientRect(); return { x: r.x + (m.x) * r.width / 180, y: r.y + (m.y - 14) * r.height / 320, m }; });
    const before = await p.evaluate(() => ({ c: __game.AUDIO._calls.length, s: __game.AUDIO._said.length }));
    await p.touchscreen.tap(at.x, at.y); await p.waitForTimeout(600);
    const after = await p.evaluate(() => ({ c: __game.AUDIO._calls.length, s: __game.AUDIO._said.length, calls: __game.AUDIO._calls.slice(-4), b: __game.UI.bubbleText || null }));
    ok('touch: a finger tap on him (touchscreen, phone profile) gets a reaction (sound / line)', after.c > before.c || after.s > before.s || !!after.b, { at, before, after });
    await ctx.close();
  }
  if (b2) await b2.close();

  // ---------- frame budget: update + draw of one frame on a 4× slower CPU ----------
  if (want('fps')) {
    const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: SPEED.mid.rate });
    const f = await E(() => new Promise((res) => { __calm(); const ts = []; let last = performance.now(); const t0 = last;
      const step = (t) => { ts.push(t - last); last = t; if (t - t0 < 3000) requestAnimationFrame(step); else { ts.shift(); ts.sort((a, b) => a - b); res({ n: ts.length, fps: Math.round(1000 * ts.length / (t - t0)), p50: Math.round(ts[ts.length >> 1]), p95: Math.round(ts[Math.floor(ts.length * 0.95)]) }); } };
      requestAnimationFrame(step); }));
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    console.log(`fps (${SPEED.mid.rate}× CPU):`, JSON.stringify(f));
    ok(`fps: on ${SPEED.mid.rate === 4 ? 'a 4× slower CPU' : `CPU ×${SPEED.mid.rate} (already slower than a mid phone)`} the house still runs ≥ ${FPS} fps (median frame ≤ ${P50} ms)${SPEED.id === 'ref' ? '' : ` (30 fps / 34 ms on the x86 sandbox at ×4, ×${SPEED.mid.k.toFixed(2)})`}`, f.fps >= FPS && f.p50 <= P50, f);
  }
  done(errs, browser);
})().catch((e) => { console.log('FAIL crash ' + e.stack); process.exit(1); });
