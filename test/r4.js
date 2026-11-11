// Round 4 (user review): no TV at the start, UI reset on games/duels, electric glass kettle (Polaris PWK 1725CGLD), black microwave,
// walk-to interactions (fridge / PC chair / wardrobe), much smaller baby + 7 growth stages, whiny «Э-э-э» + head shake instead of «Агу»,
// feeding friends (they get chubby), interactive kitchen/hall/balcony things. node test/r4.js [sections,comma-separated] → test/gallery/r4_*.png
const { chromium } = require('/vercel/sandbox/node_modules/playwright'); const fs = require('fs');
const URL = 'file:///data/game/dist/index.html', KEY = 'martyn_tamagotchi_v1';
const ONLY = (process.argv[2] || '').split(',').filter(Boolean), want = (s) => !ONLY.length || ONLY.includes(s);
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
  let fails = 0; const ok = (name, cond, info) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); if (!cond) fails++; };
  const errs = [];
  async function open(hour, pre) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.clock.setFixedTime(new Date(2026, 10, 2, hour, 0));
    if (pre) await page.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', 1); } }, [KEY, JSON.stringify(pre)]);
    await page.goto(URL); await page.waitForTimeout(700);
    await page.evaluate(() => { const b = document.querySelector('#nm-ok'); if (b) b.click(); }); await page.waitForTimeout(1200);
    await page.evaluate(() => { document.querySelectorAll('[data-close]').forEach((b) => b.click()); const s = __game.GAME.S; Object.assign(s.st, { food: 80, fun: 80, energy: 80, clean: 80 }); s.friends.visitAt = Date.now(); window.advanceTime(300); });
    await page.evaluate(() => { const s = __game.GAME.S; s.phone = true; s.tut = __game.DATA.TUT.length; if (!['laptop', 'tower'].includes(s.home.items.pc)) s.home.items.pc = 'tower'; }); // Round 7: phone + tutorial + computer unlock the games (old tests assume all open)
    return page;
  }
  const H = (page) => {
    const E = (fn, a) => page.evaluate(fn, a);
    return {
      E,
      shot: async (name) => { const url = await E(() => document.getElementById('cv').toDataURL()); fs.writeFileSync('/data/game/test/gallery/r4_' + name + '.png', Buffer.from(url.split(',')[1], 'base64')); },
      page: async (name) => page.screenshot({ path: '/data/game/test/gallery/r4_' + name + '.png' }),
      go: (r) => E((r) => { __game.HOME.goTo(r, true); __game.FRIENDS._skip(0); window.advanceTime(400); }, r),
      spots: (r) => E((r) => __game.ROOMS.spots(r, __game.GAME.S.home.items), r),
      // tap in screen (canvas) coords, the way a finger does: down + up
      tap: (x, y) => E(([x, y]) => { __game.HOME.down(x, y); __game.HOME.up(x, y); window.advanceTime(50); }, [x, y]),
      tick: (ms) => E((ms) => window.advanceTime(ms), ms),
      px: (rect) => E((q) => { const [x, y, w, h] = q.map(Math.round), d = document.getElementById('cv').getContext('2d').getImageData(x, y, w, h).data, out = []; for (let i = 0; i < d.length; i += 4) out.push([d[i], d[i + 1], d[i + 2]]); return out; }, rect),
      text: () => E(() => JSON.parse(window.render_game_to_text())),
    };
  };
  const center = (r) => [r[0] + r[2] / 2, r[1] + r[3] / 2];

  // ---------- A. no TV at the start ----------
  if (want('tv')) {
    const page = await open(12), h = H(page);
    ok('new game: no TV in the zal', await h.E(() => __game.GAME.S.home.items.tv) === 'none');
    const u = await h.E(() => { const u = __game.GAME.upgradeInfo('tv'); return { cur: u.cur.v, next: u.next && u.next.v, n: u.n }; });
    ok('TV upgrade path: none → Hiper → … (6 steps incl. none)', u.cur === 'none' && u.next === 'hiper' && u.n === 6, u);
    ok('no CRT step any more', await h.E(() => !__game.DATA.UPGRADES.tv.steps.some((s) => s.v === 'crt')));
    await h.go('zal'); let sp = await h.spots('zal');
    ok('zal: no TV hotspot without a TV', !sp.tv && !sp.tvLabel, sp.tv);
    ok('text state: tv is off without a TV', (await h.text()).tv === false);
    await h.tap(154, 160); await h.tick(100);
    ok('tap on the empty mantel does not start «watching TV»', await h.E(() => !(__game.HOME.mk.act && __game.HOME.mk.act.name === 'tv')));
    await h.shot('tv_none');
    await h.E(() => { __game.UI.openShop('home'); }); await page.waitForTimeout(400);
    const card = await h.E(() => { const c = document.querySelector('.card.up[data-up="tv"]'); return c ? c.innerText : ''; });
    ok('shop: TV card «0/5», «Нет» → Hiper', /0\/5/.test(card) && /Нет/.test(card) && /Hiper 40″ IPS/.test(card), card);
    await h.page('tv_shop');
    await h.E(() => { __game.UI.closeSheet(); const s = __game.GAME.S; s.coins = 999; s.lvl = 3; __game.GAME.upgrade('tv'); window.advanceTime(200); });
    sp = await h.spots('zal');
    ok('after buying: Hiper on the mantel with a hotspot', await h.E(() => __game.GAME.S.home.items.tv) === 'hiper' && !!sp.tv);
    await page.close();
    const p2 = await open(12, { v: 2, name: 'Абибян', named: true, coins: 10, home: { items: { tv: 'crt', pc: 'old' } }, room: 'zal', grow: { pts: 0, stage: 0, days: 0 } }), h2 = H(p2);
    ok('migration: old CRT → no TV', await h2.E(() => __game.GAME.S.home.items.tv) === 'none');
    await p2.close();
  }

  // ---------- B. UI reset: games / duels / friend cards never keep sheets or modals open ----------
  if (want('reset')) {
    const page = await open(12), h = H(page);
    await h.go('balcony');
    await h.E(() => { __game.FRIENDS._skip(30); window.advanceTime(500); });
    await h.E(() => { __game.UI.openGames(); window.advanceTime(600); }); await page.waitForTimeout(300);
    ok('games sheet is open', await h.E(() => __game.UI.sheetOpen === true || !!__game.UI.sheetKind));
    // the friend is still visible above the sheet → tap him (canvas coords = scene − camY)
    const fr = await h.E(() => { const d = __game.FRIENDS.drawn.find((q) => q.kind === 'friend' && q.id === 'monty'); return d ? { x: d.x0 + d.e.w / 2, y: d.y0 + d.e.h / 2 - __game.HOME.camY } : null; });
    ok('Монти is drawn on the balcony', !!fr, fr);
    if (fr) await h.tap(fr.x, fr.y);
    await page.waitForTimeout(300);
    ok('friend card opened over the sheet → the sheet closes', await h.E(() => !__game.UI.sheetKind && !!document.querySelector('#fr-duel')));
    await h.E(() => { const b = document.querySelector('#fr-duel'); if (b) b.click(); }); await page.waitForTimeout(300);
    await h.E(() => { const b = document.querySelector('#d-go'); if (b) b.click(); }); await page.waitForTimeout(300);
    ok('duel started', (await h.text()).scene === 'game' || await h.E(() => __game.APP.scene === 'game'));
    ok('duel: no sheet and no modal over the game', await h.E(() => !__game.UI.sheetKind && !__game.UI.hasModal() && !document.querySelector('#sheet.open')));
    await h.page('reset_duel');
    await h.E(() => { __game.MINI.home(); window.advanceTime(300); });
    // any game start resets every window, whatever was open
    await h.E(() => { __game.UI.openShop('food'); __game.UI.modal('<p>test</p>'); window.advanceTime(200); });
    await h.E(() => { __game.MINI.start('catch', 1); window.advanceTime(100); });
    ok('MINI.start: sheet + modal closed', await h.E(() => __game.APP.scene === 'game' && !__game.UI.sheetKind && !__game.UI.hasModal()));
    await page.close();
  }

  // ---------- C. kitchen: electric glass kettle (Polaris PWK 1725CGLD), black microwave — both work when tapped ----------
  const spy = (h) => h.E(() => { const A = __game.AUDIO; if (!A._calls) { A._calls = []; const o = A.play; A.play = function (n, ...r) { A._calls.push(n); return o.call(this, n, ...r); }; } A._calls.length = 0; });
  const calls = (h) => h.E(() => __game.AUDIO._calls.slice());
  const lum = (q) => q.reduce((n, [r, g, b]) => n + r + g + b, 0) / Math.max(1, q.length) / 3;
  if (want('kitchen')) {
    const page = await open(12), h = H(page);
    await h.E(() => { __game.GAME._ownAll(); window.advanceTime(100); }); // Round 9: the kettle and the microwave are bought in the shop now
    await h.go('kitchen'); const sp = await h.spots('kitchen');
    ok('kitchen spots: kettle + microwave', !!(sp.kettle && sp.micro), [sp.kettle, sp.micro]);
    if (sp.kettle && sp.micro) {
      const kp = await h.px(sp.kettle);
      ok('kettle: tall electric jug (≥ 22 px)', sp.kettle[3] >= 22, sp.kettle);
      ok('kettle: black handle + power base', kp.filter(([r, g, b]) => r < 45 && g < 45 && b < 50).length >= 25);
      ok('kettle: brushed steel collar + bottom band (neutral greys)', kp.filter(([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b) < 16 && r > 110 && r < 225).length >= 20);
      ok('kettle: clear glass body (pale, cool)', kp.filter(([r, g, b]) => r > 170 && b >= r && b > 195 && b - r < 40).length >= 25);
      ok('kettle: off → no LED glow', kp.filter(([r, g, b]) => b > r + 60 && b > 150).length < 3);
      ok('text state: kettle off, microwave off', (await h.text()).things && (await h.text()).things.kettle === 'off' && (await h.text()).things.micro === 'off', (await h.text()).things);
      const mp = await h.px(sp.micro);
      ok('microwave is black now', mp.filter(([r, g, b]) => r + g + b < 160).length >= mp.length * 0.6, mp.length);
      await h.shot('kitchen_idle');
      await spy(h); await h.tap(...center(sp.kettle));
      ok('tap kettle → it boils (sound «boil»)', (await h.text()).things.kettle === 'boil' && (await calls(h)).includes('boil'), [(await h.text()).things, await calls(h)]);
      await h.tick(1500);
      const kb = await h.px([sp.kettle[0] - 4, sp.kettle[1], sp.kettle[2] + 8, sp.kettle[3] + 4]);
      ok('boiling: blue LED lights the water', kb.filter(([r, g, b]) => b > r + 60 && b > 150).length >= 8);
      await h.shot('kettle_boil');
      await h.tick(4500);
      ok('kettle switches itself off (click) and steams', (await calls(h)).includes('switch') && (await h.text()).things.kettle !== 'boil', [(await h.text()).things, await calls(h)]);
      await h.tick(6000); ok('…and goes quiet again', (await h.text()).things.kettle === 'off');
      await spy(h); await h.tap(...center(sp.micro));
      ok('tap microwave → it runs (hum)', (await h.text()).things.micro === 'run' && (await calls(h)).includes('micro'), [(await h.text()).things, await calls(h)]);
      await h.tick(1000);
      const mw = await h.px(sp.micro);
      ok('running: warm light inside the window', mw.filter(([r, g, b]) => r > 190 && g > 140 && b < 150).length >= 6);
      await h.shot('micro_run');
      await h.tick(4000);
      ok('microwave beeps «ding» and stops', (await calls(h)).includes('ding') && (await h.text()).things.micro !== 'run', [(await h.text()).things, await calls(h)]);
    }
    ok('the polka-dot kettle left the decor shop (the Polaris is the kettle now — Round 9: sold as «Чайник Polaris»)', await h.E(() => { const k = __game.DATA.DECOR.kettle; return !!k && k.v === 1 && /Polaris/.test(k.name); }));
    await page.close();
    const p2 = await open(12, { v: 2, name: 'Абибян', named: true, coins: 10, owned: { kettle: 1 }, home: { items: { tv: 'none', pc: 'old', kettle: 1 } }, room: 'kitchen', grow: { pts: 0, stage: 0, days: 0 } }), h2 = H(p2);
    const g = await h2.E(() => ({ coins: __game.GAME.S.coins, own: !!__game.GAME.S.owned.kettle, it: !!__game.GAME.S.home.items.kettle }));
    const g9 = await h2.E(() => ({ own: __game.GAME.S.owned.kettle, it: __game.GAME.S.home.items.kettle }));
    ok('old save with the polka-dot kettle: refunded (60), the Polaris given instead (Round 9)', g.coins >= 70 && g9.own === 1 && g9.it === 1, [g, g9]);
    await p2.close();
  }

  // ---------- D. lamps: balcony table lamp and hall sconces switch on/off ----------
  if (want('lamps')) {
    const page = await open(19), h = H(page);
    await h.go('balcony'); let sp = await h.spots('balcony');
    ok('balcony: the table lamp is gone, the sill is free for bought things (Round 7)', !sp.lamp, sp.lamp);
    if (sp.lamp) {
      const R = [sp.lamp[0] - 10, sp.lamp[1] - 6, sp.lamp[2] + 20, sp.lamp[3] + 12];
      const t0 = (await h.text()).things, b0 = lum(await h.px(R));
      await spy(h); await h.tap(sp.lamp[0] + sp.lamp[2] / 2, sp.lamp[1] + 8); await h.tick(100);
      const t1 = (await h.text()).things, b1 = lum(await h.px(R));
      ok('tap lamp → it switches (click) and the light changes', t1.lamp !== t0.lamp && (await calls(h)).includes('switch') && Math.abs(b1 - b0) > 4, { t0: t0.lamp, t1: t1.lamp, b0, b1 });
      await h.shot('lamp_' + (t1.lamp ? 'on' : 'off'));
    }
    await h.go('hall'); sp = await h.spots('hall');
    const sc = sp.sconces && sp.sconces[0];
    if (sc) {
      const R = [sc[0] - 8, sc[1] - 4, sc[2] + 16, sc[3] + 14];
      const t0 = (await h.text()).things, b0 = lum(await h.px(R));
      await spy(h); await h.tap(sc[0] + sc[2] / 2, sc[1] + sc[3] / 2); await h.tick(100);
      const t1 = (await h.text()).things, b1 = lum(await h.px(R));
      ok('tap sconce → both sconces switch (click), light changes', t1.sconces !== t0.sconces && (await calls(h)).includes('switch') && Math.abs(b1 - b0) > 3, { t0: t0.sconces, t1: t1.sconces, b0, b1 });
      await h.shot('hall_sconces_' + (t1.sconces ? 'on' : 'off'));
    } else ok('hall: sconce spots', false, sp);
    await page.close();
  }

  // ---------- E. growth: a much smaller baby and 10 stages (Round 8: Кроха → … → Легенда) ----------
  if (want('growth')) {
    const page = await open(12), h = H(page);
    const A = await h.E(() => __game.DATA.AGES.map((a) => ({ id: a.id, name: a.name, pts: a.pts, days: a.days })));
    ok('10 stages (Round 8): Кроха → Малыш → Карапуз → Детёныш → Школьник → Подросток → Юнец → Молодой → Взрослый → Легенда', JSON.stringify(A.map((a) => a.id)) === JSON.stringify(['newborn', 'baby', 'toddler', 'kid', 'school', 'teen', 'young', 'grown', 'adult', 'legend']) && JSON.stringify(A.map((a) => a.name)) === JSON.stringify(['Кроха', 'Малыш', 'Карапуз', 'Детёныш', 'Школьник', 'Подросток', 'Юнец', 'Молодой', 'Взрослый', 'Легенда']), A.map((a) => a.name));
    ok('each stage needs more care points and days', A.every((a, i) => !i || (a.pts > A[i - 1].pts && a.days > A[i - 1].days)), A.map((a) => [a.pts, a.days]));
    const hs = await h.E(() => { const G = __game, out = []; for (let i = 0; i < G.DATA.AGES.length; i++) { G.GAME.S.grow.stage = i; G.GAME.S.grow.seen = i; window.advanceTime(150); const cv = G.HOME.mk.sp.cv, d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let y0 = 1e9, y1 = -1; for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3]) { if (y < y0) y0 = y; y1 = y; } out.push(y1 - y0 + 1); } G.GAME.S.grow.stage = 0; G.GAME.S.grow.seen = 0; window.advanceTime(150); return out; });
    const iA = hs.length - 2; // Round 8: the adult is the 9th stage and only ~70 px tall
    ok('Кроха is tiny: ≤ 46 px tall (the adult 54–59 px — Round 9)', hs[0] <= 46 && hs[iA] >= 54 && hs[iA] <= 59, hs);
    ok('every stage up to the adult is a little bigger (1–5 px — Round 8/9)', hs.slice(0, iA + 1).every((v, i) => !i || (v - hs[i - 1] >= 1 && v - hs[i - 1] <= 5)), hs);
    ok('the legend keeps the adult size', Math.abs(hs[iA + 1] - hs[iA]) <= 3, hs);
    const ia = await h.E(() => { const D = __game.DATA, g = (id) => D.GAMES.find((q) => q.id === id).age; return { AGE: D.AGE, coffee: D.FOODS.coffee.age, kvass: D.FOODS.kvass.age, tophat: D.CLOTHES.tophat.age, gym: g('gym'), vine: g('vine') }; });
    ok('item ages name the stages (kid / teen / adult)', !!ia.AGE && ia.coffee === ia.AGE.teen && ia.kvass === ia.AGE.adult && ia.tophat === ia.AGE.adult && ia.gym === ia.AGE.teen && ia.vine === ia.AGE.kid, ia);
    const ad = await h.E(() => { const G = __game.GAME, D = __game.DATA, r = []; for (const id of ['young', 'adult']) { G.S.grow.stage = D.AGE[id]; r.push(G.adult()); } G.S.grow.stage = 0; return r; });
    ok('«Взрослый» is the first adult stage (skuf), «Юнец» is not yet', ad[0] === false && ad[1] === true, ad);
    ok('text state names the stage', (await h.text()).age === 'newborn', (await h.text()).age);
    await h.shot('growth_newborn');
    await h.E(() => { __game.UI.openGrow('grow'); }); await page.waitForTimeout(400);
    const gt = await h.E(() => document.querySelector('#sh-body') ? document.querySelector('#sh-body').innerText : '');
    ok('growth sheet lists all 10 stages', ['Кроха', 'Малыш', 'Карапуз', 'Детёныш', 'Школьник', 'Подросток', 'Юнец', 'Молодой', 'Взрослый', 'Легенда'].every((n) => gt.includes(n)), gt.slice(0, 200));
    await h.page('growth_sheet');
    await page.close();
    for (const [old, id, kg] of [[0, 'newborn', 2.2], [1, 'kid', 4.4], [2, 'teen', 6.6], [3, 'adult', 9], [4, 'legend', 12]]) {
      const p = await open(12, { v: 2, name: 'Абибян', named: true, coins: 10, kg, home: { items: { tv: 'none', pc: 'old' } }, room: 'zal', grow: { pts: 0, stage: old, seen: old, days: 0 } }), hh = H(p);
      const r = await hh.E((id) => { const S = __game.GAME.S, D = __game.DATA; return { id: D.AGES[S.grow.stage].id, seen: S.grow.seen, stage: S.grow.stage, kg: S.kg, v: S.v, newK: (D.AGES.find((a) => a.id === id) || {}).kg, vNow: S.v }; }, id);
      const oldK = [0.32, 0.55, 0.78, 1, 1][old], newK = r.newK; // the current table's weight factor for that stage (Round 6/8 rescales chain)
      ok(`migration: old stage ${old} → «${id}», weight rescaled`, r.id === id && r.seen === r.stage && Math.abs(r.kg - kg * newK / oldK) < 0.2 && r.v >= 3, r);
      await p.close();
    }
  }

  // ---------- F. babies whine «Э-э-э» and shake the head instead of «Агу» ----------
  if (want('whine')) {
    const page = await open(12), h = H(page);
    ok('no «Агу» lines left', await h.E(() => !/Агу|Гу-гу/.test(JSON.stringify(__game.DATA.LINES))));
    ok('Кроха, Малыш and Карапуз babble, Детёныш already talks', await h.E(() => { const A = __game.DATA.AGES, g = (id) => A.find((a) => a.id === id); return !!g('newborn').babble && !!g('baby').babble && !!g('toddler').babble && !g('kid').babble; }));
    await spy(h); await h.E(() => { __game.HOME.whine(); }); await h.tick(150);
    const w = await h.E(() => ({ calls: __game.AUDIO._calls.slice(), bubble: __game.UI.bubbleText || '', act: __game.HOME.mk.act && __game.HOME.mk.act.name }));
    ok('whine: «Э-э-э» bubble + whiny sound + head-shake act', /Э-э-э/.test(w.bubble) && w.calls.includes('whine') && w.act === 'whine', w);
    const hx = []; for (let i = 0; i < 10; i++) { hx.push(await h.E(() => __game.HOME._params().hx || 0)); await h.tick(90); }
    ok('the head shakes left and right', hx.some((v) => v >= 2) && hx.some((v) => v <= -2), hx);
    await h.E(() => { __game.HOME.whine(); window.advanceTime(260); }); await h.shot('whine');
    ok('whiny face: eyes shut, mouth open', await h.E(() => { const p = __game.HOME._params(); return p.eyes.mode === 'closed' && /open|o|cry|wail/.test(p.mouth); }));
    await page.close();
    const p2 = await open(12), h2 = H(p2);
    await spy(h2); await h2.E(() => { __game.APP.greet(); window.advanceTime(100); });
    ok('greeting at the Кроха stage is the whine', (await calls(h2)).includes('whine'), await calls(h2));
    await h2.E(() => { __game.GAME.S.grow.stage = __game.DATA.AGE.kid; __game.GAME.S.grow.seen = __game.GAME.S.grow.stage; window.advanceTime(3000); });
    await spy(h2); await h2.E(() => { __game.APP.greet(); window.advanceTime(100); });
    ok('a Детёныш greets with words (no whine)', !(await calls(h2)).includes('whine') && /./.test(await h2.E(() => __game.UI.bubbleText || '')), await calls(h2));
    await p2.close();
  }

  // ---------- G. feed friends: «Угостить» in the card → pick food from the stock → the friend eats and gets chubbier ----------
  if (want('feed')) {
    const page = await open(12), h = H(page);
    const W = (id, fat) => h.E(([id, fat]) => { const e = __game.FART.sprite(id, { fat }), cv = e.cv, d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let x0 = 1e9, x1 = -1; for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; } return x1 - x0 + 1; }, [id, fat]);
    for (const id of ['pusya', 'monty', 'mosq']) { const a = await W(id, 0), b = await W(id, 1); ok(`${id}: a well-fed friend is visibly wider (≥ 5 px, or ≥ 12 % for the small ones — Round 8)`, b - a >= Math.min(5, Math.ceil(a * 0.12)), [a, b]); }
    await h.go('kitchen');
    await h.E(() => { const s = __game.GAME.S; s.inv = { burger: 3, milk: 2 }; });
    await h.E(() => { __game.FRIENDS.card('pusya'); }); await page.waitForTimeout(300);
    ok('friend card has «Угостить»', await h.E(() => { const b = document.querySelector('#fr-feed'); return !!b && /Угостить/.test(b.innerText); }));
    await h.E(() => { const b = document.querySelector('#fr-feed'); if (b) b.click(); }); await page.waitForTimeout(300);
    const items = await h.E(() => [...document.querySelectorAll('[data-feed]')].map((b) => b.dataset.feed));
    ok('food picker lists the stock', items.includes('burger') && items.includes('milk'), items);
    await h.page('feed_pick');
    await spy(h);
    await h.E(() => { const b = document.querySelector('[data-feed="burger"]'); if (b) b.click(); }); await h.tick(400);
    const r = await h.E(() => ({ inv: __game.GAME.S.inv.burger, fat: (__game.GAME.S.friends.pusya || {}).fat, modal: __game.UI.hasModal(), pose: __game.FRIENDS._F.pusya.pose }));
    ok('Пуся eats the burger: stock −1, she gets chubbier, picker closed', r.inv === 2 && r.fat > 0.08 && !r.modal, r);
    ok('…munching (chomp) and happy', (await calls(h)).includes('chomp') && r.pose === 'happy', [await calls(h), r.pose]);
    await h.tick(1200); await h.shot('feed_pusya_eats');
    await h.E(() => { for (let i = 0; i < 6; i++) { __game.GAME.S.friends.pusya.eat = []; __game.FRIENDS.feed('pusya', 'burger', true); } window.advanceTime(2500); });
    const st = await h.E(() => ({ fat: __game.GAME.S.friends.pusya.fat, inv: __game.GAME.S.inv.burger || 0 }));
    ok('no food left → nothing more to eat (stock never goes negative)', st.inv === 0, st);
    ok('fatness stays within 0..1', st.fat > 0.2 && st.fat <= 1, st);
    await h.shot('feed_pusya_chubby');
    await h.E(() => { __game.GAME.S.inv = {}; __game.FRIENDS.card('pusya'); }); await page.waitForTimeout(300);
    const ct = await h.E(() => document.querySelector('.modal') ? document.querySelector('.modal').innerText : document.body.innerText);
    ok('card shows how well-fed the friend is', /Пухлость|Сытость|Упитанн/.test(ct), ct.slice(0, 200));
    await h.E(() => { const b = document.querySelector('#fr-feed'); if (b) b.click(); }); await page.waitForTimeout(300);
    ok('empty stock → «В магазин» button instead of food', await h.E(() => !document.querySelector('[data-feed="burger"]') && !!document.querySelector('#fd-shop')));
    await h.E(() => { const b = document.querySelector('#fd-shop'); if (b) b.click(); }); await page.waitForTimeout(300);
    ok('…which opens the food shop', (await h.text()).sheet === 'shop', (await h.text()).sheet);
    await h.E(() => { __game.UI.closeSheet(); const s = __game.GAME.S; s.inv.tea = 1; s.friends.pusya.eat = []; const f0 = s.friends.pusya.fat; if (__game.FRIENDS.feed) __game.FRIENDS.feed('pusya', 'tea', true); window.__f = [f0, s.friends.pusya.fat]; });
    const tf = await h.E(() => window.__f);
    ok('diet tea slims the friend down', tf[1] < tf[0], tf);
    ok('text state: friends report fatness', await h.E(() => { const f = JSON.parse(window.render_game_to_text()).friends; return !!f && f.fat && typeof f.fat.pusya === 'number'; }));
    await page.close();
  }

  // ---------- F. walk-to trips: he walks to the fridge (rummages), the PC (sits on the office chair), the wardrobe (digs) ----------
  if (want('trips')) {
    const page = await open(12), h = H(page);
    const until = (src, max = 6000) => h.E(([src, max]) => { const f = new Function('return (' + src + ')'); for (let ms = 0; ms <= max; ms += 50) { if (f()) return ms; window.advanceTime(50); } return -1; }, [src, max]);
    const TR = "JSON.parse(render_game_to_text()).trip";
    const P = () => h.E(() => { const p = __game.HOME._params(); return { back: !!p.back, legs: p.legs, armL: p.armL, armR: p.armR }; });
    const avg = (px) => px.reduce((a, c) => a + (c[0] + c[1] + c[2]) / 3, 0) / px.length;
    const stage = (id) => h.E((id) => { const G = __game.GAME.S.grow; G.stage = G.seen = id === 'newborn' ? 0 : __game.DATA.AGE[id]; window.advanceTime(100); }, id); // seen: no grow-up modal
    await stage('young');
    // fridge
    await h.go('kitchen'); let sp = await h.spots('kitchen'); const F = sp.fridge, FR = [F[0] + 4, F[1] + 4, F[2] - 8, 40];
    const before = await h.px(FR);
    await spy(h);
    await h.tap(...center(F)); let s = await h.text();
    ok('fridge tap: no instant shop — he sets off to the fridge', s.sheet === null && !!s.trip && s.trip.kind === 'fridge' && s.trip.ph === 'go', s.trip);
    await h.tick(300); const m1 = (await h.text()).monkey;
    ok('…walking: toward the fridge and up to the wall (behind the table)', m1.x > 92 && m1.y < 268, m1);
    const legs = await h.E(() => { const o = new Set(); for (let i = 0; i < 12; i++) { window.advanceTime(50); o.add(__game.HOME._params().legs); } return [...o]; });
    ok('…stepping: the legs alternate', legs.includes('walkL') && legs.includes('walkR'), legs);
    let w = await until(TR + " && " + TR + ".ph === 'do' && JSON.parse(render_game_to_text()).things.fridge === 'open'", 4000); s = await h.text(); let p = await P();
    ok('at the fridge: rummaging with his back to us, the door is open', w >= 0 && p.back && s.things.fridge === 'open' && Math.abs(s.monkey.x - (F[0] + F[2] / 2)) < 16, { w, p, m: s.monkey, f: s.things.fridge });
    ok('…the chair by the fridge is pulled aside so he is not hidden behind it', s.things.chair === 'pulled', s.things.chair);
    await h.tick(450);
    const during = await h.px(FR), diff = during.filter((c, i) => Math.abs(c[0] - before[i][0]) + Math.abs(c[1] - before[i][1]) + Math.abs(c[2] - before[i][2]) > 40).length / during.length;
    ok('…the open fridge is drawn (light, shelves, food inside)', diff > 0.3, diff);
    await h.shot('trip_fridge');
    let cs = await calls(h); ok('…sounds: the door and rustling', cs.includes('fridge') && cs.includes('rustle'), cs);
    ok('…the chair scrapes as it moves', cs.includes('scrape'), cs);
    ok('…food pops out of the fridge as he digs', await h.E(() => __game.HOME.fx.list.some((q) => q.type === 'img')));
    const arms = await h.E(() => { const o = new Set(); for (let i = 0; i < 8; i++) { window.advanceTime(50); const p = __game.HOME._params(); o.add(JSON.stringify([p.armL, p.armR])); } return o.size; });
    ok('…his arms move (digging)', arms >= 2, arms);
    w = await until("__game.UI.sheetKind === 'shop'", 3000); s = await h.text();
    ok('then the food shop opens; he stays at the fridge while it is open', w >= 0 && s.sheet === 'shop' && !!s.trip && s.trip.ph === 'wait', { w, trip: s.trip });
    await h.page('trip_fridge_shop');
    await h.E(() => { __game.UI.closeSheet(); window.advanceTime(450); }); s = await h.text(); p = await P();
    ok('shop closed → the door shuts, he turns and walks back', !!s.trip && s.trip.ph === 'back' && s.things.fridge === 'closed' && !p.back, { trip: s.trip, f: s.things.fridge, p });
    w = await until('!' + TR, 4000); s = await h.text();
    ok('…back in the middle of the room', w >= 0 && s.monkey.x === 90 && s.monkey.y === 270, s.monkey);
    w = await until("JSON.parse(render_game_to_text()).things.chair === 'in'", 1500);
    ok('…and the chair goes back to the table', w >= 0, w);
    await h.tap(...center(F)); await h.tick(200); await h.tap(...center(F)); await h.tick(100);
    ok('second tap while he walks → the shop opens right away', (await h.text()).sheet === 'shop');
    await h.E(() => __game.UI.closeSheet()); await until('!' + TR, 6000);
    await h.tap(...center(F)); await h.tick(300); await h.go('hall'); s = await h.text();
    ok('changing the room cancels the trip (he is in the middle again)', !s.trip && s.monkey.x === 90 && s.monkey.y === 270, { trip: s.trip, m: s.monkey });
    // newborn at the fridge: tiny, but still reaching into it
    await stage('newborn'); await h.go('kitchen');
    await h.tap(...center(F)); s = await h.text();
    ok('newborn: too small for the fridge — he heads for the chair to climb on it', !!s.trip && s.trip.climb === true, s.trip);
    const chairR = sp.chair; w = await until(TR + " && " + TR + ".ph === 'do'", 4000); await h.tick(500); s = await h.text(); p = await P();
    ok('…standing on the chair seat with his back to us, reaching into the open fridge', w >= 0 && p.back && s.things.fridge === 'open' && s.things.chair === 'in' && s.monkey.y < 236 && Math.abs(s.monkey.x - (chairR[0] + chairR[2] / 2)) <= 2, { w, p, m: s.monkey, th: s.things });
    await h.shot('trip_fridge_baby');
    const vis = await h.E(() => { // share of his opaque sprite pixels that are really on screen (not covered by the table / chair)
      const m = __game.HOME._mk(), c = m.cv, w = c.width, hh = c.height, sd = c.getContext('2d').getImageData(0, 0, w, hh).data, cd = document.getElementById('cv').getContext('2d').getImageData(m.x0, m.y0, w, hh).data;
      let n = 0, v = 0; for (let i = 0; i < sd.length; i += 4) if (sd[i + 3] > 200) { n++; if (Math.abs(sd[i] - cd[i]) + Math.abs(sd[i + 1] - cd[i + 1]) + Math.abs(sd[i + 2] - cd[i + 2]) < 24) v++; }
      return { n, v, f: +(v / n).toFixed(2) }; });
    ok('the newborn at the fridge is not hidden behind the chair (≥ 75% of him visible)', vis.f >= 0.75, vis);
    w = await until("__game.UI.sheetKind === 'shop'", 3000); await h.E(() => { __game.UI.closeSheet(); window.advanceTime(250); }); s = await h.text();
    ok('…shop closed → he climbs down from the chair', w >= 0 && !!s.trip && s.trip.ph === 'back', s.trip);
    w = await until('!' + TR, 4000); s = await h.text();
    ok('…and toddles back to the middle', w >= 0 && s.monkey.x === 90 && s.monkey.y === 270, s.monkey);
    await h.go('hall'); await stage('kid');
    // wardrobe
    sp = await h.spots('hall'); const Wd = sp.wardrobe;
    await h.tap(...center(Wd)); s = await h.text();
    ok('wardrobe tap: he walks to the wardrobe first', s.sheet === null && !!s.trip && s.trip.kind === 'wardrobe', s.trip);
    w = await until(TR + " && " + TR + ".ph === 'do'", 4000); s = await h.text(); p = await P();
    ok('at the wardrobe: digging in the shelves, back to us', w >= 0 && p.back && s.monkey.x < Wd[0] + Wd[2] + 6, { w, p, m: s.monkey });
    await h.tick(500);
    ok('…clothes fly out', await h.E(() => __game.HOME.fx.list.filter((q) => q.type === 'cloth').length >= 2));
    await h.shot('trip_wardrobe');
    w = await until("__game.UI.sheetKind === 'wardrobe'", 3000); s = await h.text(); p = await P();
    ok('then the wardrobe opens and he comes back to the middle (facing us, to try things on)', w >= 0 && !!s.trip && s.trip.ph === 'back' && !p.back, { trip: s.trip, p });
    w = await until('!' + TR, 4000); s = await h.text();
    ok('…standing in the middle with the wardrobe open', w >= 0 && s.sheet === 'wardrobe' && s.monkey.x === 90, { sheet: s.sheet, m: s.monkey });
    await h.page('trip_wardrobe_sheet');
    await h.E(() => { __game.UI.closeSheet(); window.advanceTime(500); }); await h.tap(...center(sp.mirror)); // (after the camera has come back down)
    { const tt = await h.text(); ok('the mirror: he poses in front of it, no wardrobe any more (Round 6 D)', tt.sheet !== 'wardrobe', tt.sheet); }
    await h.E(() => __game.UI.closeSheet());
    // PC: sits on the office chair
    await stage('adult');
    await h.go('balcony'); sp = await h.spots('balcony'); const CH = [140, 196, 20, 26];
    const chair0 = avg(await h.px(CH));
    await spy(h);
    await h.tap(...center(sp.pc)); s = await h.text();
    ok('computer tap: he walks to the chair first', s.sheet === null && !!s.trip && s.trip.kind === 'pc', s.trip);
    w = await until(TR + " && " + TR + ".ph === 'do'", 4000); s = await h.text(); p = await P();
    ok('he sits on the office chair: back to us, legs hidden, up on the seat', w >= 0 && p.back && p.legs === 'hidden' && s.monkey.y < 262 && Math.abs(s.monkey.x - 150) < 8, { w, p, m: s.monkey });
    const chair1 = avg(await h.px(CH));
    ok('…seen through the mesh back of the chair (drawn over him, see-through)', chair1 > chair0 + 12 && chair1 < 125, { chair0, chair1 });
    cs = await calls(h); ok('…the chair creaks, keys clack', cs.includes('creak') && cs.includes('keys'), cs);
    await h.shot('trip_pc');
    w = await until("__game.UI.sheetKind === 'games'", 3000); s = await h.text();
    ok('then the mini-games list opens; he stays at the PC', w >= 0 && !!s.trip && s.trip.ph === 'wait' && (await P()).legs === 'hidden', { w, trip: s.trip });
    await h.page('trip_pc_games');
    await h.E(() => { const r = document.querySelector('.li[data-g]:not(.locked)'); if (r) r.click(); window.advanceTime(300); });
    ok('picking a game: still sitting at the PC behind the game intro', ((await h.text()).trip || {}).ph === 'wait');
    await h.E(() => { const b = document.querySelector('#g-go'); if (b) b.click(); window.advanceTime(300); });
    ok('the game runs', (await h.text()).scene === 'game');
    await h.E(() => { __game.MINI.home(); window.advanceTime(250); }); s = await h.text();
    ok('back home after the game: he gets off the chair and walks back', s.scene === 'home' && !!s.trip && s.trip.ph === 'back', s.trip);
    w = await until('!' + TR, 4000); s = await h.text();
    ok('…in the middle again', w >= 0 && s.monkey.x === 90 && s.monkey.y === 270, s.monkey);
    await h.E(() => document.getElementById('h-phone').click()); await h.tick(900); s = await h.text(); // Round 6 E: the «Игры» bar button became the phone in the HUD
    ok('the phone button still opens the list at once (no walk)', s.sheet === 'games' && !s.trip, { sheet: s.sheet, trip: s.trip });
    await h.E(() => __game.UI.closeSheet());
    await page.close();
  }

  if (errs.length) { console.log('ERRORS'); errs.slice(0, 10).forEach((e) => console.log(e)); }
  await browser.close();
  console.log(fails ? `${fails} FAIL` : 'ALL PASS'); process.exit(fails || errs.length ? 1 : 0);
})();
