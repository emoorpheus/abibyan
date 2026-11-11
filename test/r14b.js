// Round 14b (the user's notes after R14): node test/r14b.js [routine,want,photo,save,testbuild,rack,kitchen,stool] → test/gallery/r14b_*.png. Exit 1 on fail.
// 1 his own day must be seen: in the day / evening with full needs he still goes off to do something (mirror, vacuum, guitar, TV, window…),
//   after ≤ 15 s alone (a phone locks its screen after ~30 s); 3 the want bubble never covers a friend; 4 the photo caption and the date
//   don't overlap (a line each, shrunk to fit); 5 «Сохранить» saves (share sheet with the file, else a download); 6 a test build with
//   100 000 coins and its own save; 7 he lifts the fallen drying rack himself; 8 pancakes: he brings the stool, stands on it, cooks;
//   9 the kitchen unit is lower.
const { boot, open, ok, shot, done } = require('./lib/h.js');
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const G = '/data/game/test/gallery/r14b_';
(async () => {
  const { browser, page, errs } = await boot({ hour: 12 }); const E = (f, a) => page.evaluate(f, a);
  const at = (h) => page.clock.setFixedTime(new Date(2026, 10, 4, h, 0));
  const setup = (o) => E((o) => { const G = __game, s = G.GAME.S; if (G.ROUTINE) { G.ROUTINE.off = true; G.ROUTINE.poke(); G.ROUTINE._reset(); } G.HOME.stopTravel(); if (G.HOME.trip) G.HOME.goTo(o.room === 'hall' ? 'zal' : 'hall', true); /* R15b: a guitar trip left from the previous try */ if (G.FRIENDS) { G.FRIENDS._reset(); s.friends.heistAt = Date.now(); } /* «Вылазка» has its own test (r15b rheist) */ while (G.UI.hasModal()) G.UI.closeModal(); G.UI.closeSheet(); if (s.sleeping && G.HOME.room === 'zal') G.HOME.toggleLight();
    if (o.stage !== undefined) { s.grow.stage = o.stage; s.grow.seen = o.stage; }
    Object.assign(s.st, { food: 90, fun: 60, energy: 90, clean: 90 }, o.st || {}); s.want = null; s.nextWant = Date.now() + 9e8; if (o.inv) s.inv = o.inv; s.rt = null;
    G.HOME.goTo(o.room, true); __adv(300); if (o.routine && G.ROUTINE) { G.ROUTINE.off = false; G.ROUTINE._reset(); } }, o);
  const watch = (ms, stop) => E(({ ms, stop }) => { const G = __game, H = G.HOME, o = { rooms: [], tr: [], t: 0 };
    for (let t = 0; t < ms; t += 100) { __adv(100); o.t = t; const r = H.room; if (o.rooms[o.rooms.length - 1] !== r) o.rooms.push(r);
      const tk = H.trip ? H.trip.kind : '-'; if (o.tr[o.tr.length - 1] !== tk) o.tr.push(tk); const c = G.ROUTINE && G.ROUTINE.cur; if (c && (o.cs = o.cs || [])[o.cs.length - 1] !== c) o.cs.push(c); if (stop && eval(stop)) break; }
    o.cur = G.ROUTINE && G.ROUTINE.cur; return o; }, { ms, stop: stop || null });

  // ---------- 1: his own day in the day and the evening too ----------
  if (want('routine')) { try {
    for (const [h, nm] of [[14, 'day'], [15, 'day (another try)'], [19, 'evening']]) {
      await at(h); await setup({ room: 'zal', st: { food: 75, fun: 65, energy: 80, clean: 92 }, routine: true });
      const w = await watch(40000, "o.rooms.length > 1 || (H.trip && H.trip.kind !== 'walk') || (H.mk.act && H.mk.act.keep)");
      ok(`routine: ${nm} ${h}:00, all needs fine, left alone → he still sets off to do something himself (≤ 40 s)`, !!(w.cs && w.cs.length) && (w.rooms.length > 1 || w.tr.some((k) => k !== '-')|| w.cs.includes('free')), w);
    }
    await at(14); await setup({ room: 'zal', st: { food: 75, fun: 65, energy: 80, clean: 92 }, routine: true });
    const q = await watch(16500, 'G.ROUTINE.cur');
    ok('routine: the wait is short — he is off after ≤ 16 s alone (a phone locks the screen after ~30 s)', !!q.cur, q);
    const hint = await E(() => [...document.querySelectorAll('.toast')].map((e) => e.textContent).join(' | '));
    ok('routine: the first time a toast tells that he lives on his own while you don\'t touch the screen', /сам/i.test(hint), hint);
    const w2 = await watch(60000, '!G.ROUTINE.cur && !H.trip && o.t > 500');
    const rest = await watch(12000, 'G.ROUTINE.cur');
    ok('routine: after one thing he rests a bit before the next one (nothing new within 12 s)', !rest.cur, { w2, rest });
    await shot(page, G + 'routine.png');
    for (const id of ['mirror', 'vac', 'guitar', 'tv', 'window', 'dance']) { // every thing of his own works on its own
      await at(14); await setup({ room: id === 'window' ? 'zal' : 'kitchen', st: { food: 75, fun: 65, energy: 80, clean: 92 }, routine: true });
      const r = await E((id) => { const G = __game, H = G.HOME, R = G.ROUTINE, s = G.GAME.S; s.home.items.vacuum = G.DATA.DECOR.vacuum.v; s.home.items.guitar = G.DATA.DECOR.guitar.v; if (id === 'tv' && !G.GAME.hasUp('tv')) s.home.items.tv = 'tcl'; R._force(id); R._idle(99); const o = { rooms: [], acts: [], tr: [] };
        for (let t = 0; t < 40000; t += 100) { __adv(100); if (o.rooms[o.rooms.length - 1] !== H.room) o.rooms.push(H.room); const a = H.mk.act && H.mk.act.name; if (a && o.acts[o.acts.length - 1] !== a) o.acts.push(a); const k = H.trip ? H.trip.kind : '-'; if (o.tr[o.tr.length - 1] !== k) o.tr.push(k); if (t > 3000 && !R.cur) break; }
        o.cur = R.cur; o.tvOn = H.tvOn; return o; }, id);
      const did = { mirror: r.tr.includes('mirror'), vac: r.tr.includes('vac'), guitar: r.tr.includes('guitar'), tv: r.acts.includes('tv') && r.tvOn, window: r.acts.includes('look') && r.acts.includes('wave'), dance: r.acts.includes('dance') }[id];
      const room = { mirror: 'hall', vac: 'hall', guitar: 'zal', tv: 'zal', window: 'balcony' }[id];
      ok(`routine: his own «${id}» — he goes there and does it, then is free again`, did && (!room || r.rooms[r.rooms.length - 1] === room) && !r.cur, r);
      if (id === 'tv') await shot(page, G + 'tv.png');
    }
  } catch (e) { ok('routine: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- 3: the want bubble never covers a friend ----------
  if (want('want')) { try {
    const cases = [['balcony', null], ['kitchen', null], ['bath', null], ['hall', null], ['zal', 'pusya'], ['zal', 'monty']];
    const bad = [];
    for (const [room, vis] of cases) {
      await setup({ room });
      const r = await E(({ room, vis }) => { const G = __game, H = G.HOME, F = G.FRIENDS; F._reset(); if (vis) { F._visit(vis); __adv(9000); }
        G.GAME.wish('tickle'); __adv(200); const out = [];
        for (let x = 24; x <= 156; x += 12) { H.walkTo(x, 262); __adv(2600); __adv(300);
          const el = document.querySelector('.want'); if (!el || el.classList.contains('hidden')) { out.push({ x, none: 1 }); continue; }
          const cv = document.getElementById('cv').getBoundingClientRect(), k = cv.width / 180, b = el.getBoundingClientRect();
          const w = { x0: (b.left - cv.left) / k, y0: (b.top - cv.top) / k, x1: (b.right - cv.left) / k, y1: (b.bottom - cv.top) / k + 5 }; // + the tail
          for (const d of F.drawn) { const bb = __bb(d.e.cv); if (!bb.w) continue; const f = { x0: d.x0 + bb.x, y0: d.y0 + bb.y, x1: d.x0 + bb.x + bb.w, y1: d.y0 + bb.y + bb.h };
            const ix = Math.min(w.x1, f.x1) - Math.max(w.x0, f.x0), iy = Math.min(w.y1, f.y1) - Math.max(w.y0, f.y0);
            if (ix > 1.5 && iy > 1.5) out.push({ x, id: d.id, ix: Math.round(ix), iy: Math.round(iy), w: [Math.round(w.x0), Math.round(w.y0)] }); } }
        G.GAME.S.want = null; return out.filter((q) => q.id); }, { room, vis });
      for (const q of r) bad.push(Object.assign({ room }, q));
    }
    ok('want: the want bubble covers no friend anywhere he stands (5 rooms, visitors too)', bad.length === 0, bad.slice(0, 6));
    await setup({ room: 'balcony' }); await E(() => { const G = __game; G.FRIENDS._reset(); G.GAME.wish('tickle'); G.HOME.walkTo(60, 262); __adv(3000); });
    await page.screenshot({ path: G + 'want.png' });
    await E(() => { __game.GAME.S.want = null; });
  } catch (e) { ok('want: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- 4, 5: the album photo ----------
  if (want('photo') || want('save')) { try {
    await setup({ room: 'zal' });
    await E(() => { const s = __game.GAME.S; s._name0 = s.name; s.name = 'Абибянчик Пушистый'; __game.HOME.photo({ title: 'Все вместе!', cap: s.name + ' и друзья' }); __adv(1200); });
    await page.waitForFunction(() => document.querySelector('#modal img.photo'), null, { timeout: 5000 }).catch(() => { });
    await page.waitForTimeout(300);
    if (want('photo')) {
      const L = await E(async () => { const H = __game.HOME; if (H.lastPhoto && H.lastPhoto.lay) return H.lastPhoto.lay;
        const c = document.createElement('canvas').getContext('2d'), s = __game.GAME.S, W = 150 * 4 + 44; // the old one-line layout
        c.font = '700 40px "Pixelify Sans", monospace'; const a = c.measureText(s.name + ' и друзья').width; c.font = '400 26px "Pixelify Sans", monospace'; const b = c.measureText('04.11.2026 · ' + __game.GAME.ageDef().name).width;
        return { W, cap: { x0: 26, x1: 26 + a, y0: 0, y1: 40 }, date: { x0: W - 26 - b, x1: W - 26, y0: 0, y1: 40 }, old: 1 }; });
      const ov = Math.min(L.cap.x1, L.date.x1) - Math.max(L.cap.x0, L.date.x0) > 0 && Math.min(L.cap.y1, L.date.y1) - Math.max(L.cap.y0, L.date.y0) > 0;
      ok('photo: a long caption and the date don\'t overlap', !ov, L);
      ok('photo: both lines fit inside the frame', L.cap.x0 >= 20 && L.cap.x1 <= L.W - 20 && L.date.x0 >= 20 && L.date.x1 <= L.W - 20, L);
      ok('photo: drawn with the game font (Pixelify Sans loaded, not a monospace fallback)', !!L.font && /Pixelify/.test(L.font), L.font);
      await E(() => { const im = document.querySelector('#modal img.photo'); window.__ph = im && im.src; });
      const b64 = await E(() => (window.__ph || '').split(',')[1] || ''); if (b64) require('fs').writeFileSync(G + 'photo.png', Buffer.from(b64, 'base64'));
    }
    if (want('save')) {
      await E(() => { window.__shared = null; navigator.canShare = (d) => !!(d && d.files && d.files.length); navigator.share = (d) => { window.__shared = { n: d.files && d.files.length, type: d.files && d.files[0] && d.files[0].type, name: d.files && d.files[0] && d.files[0].name, size: d.files && d.files[0] && d.files[0].size }; return Promise.resolve(); }; });
      const btn = page.locator('#modal').getByText('Сохранить', { exact: true });
      const dl1 = page.waitForEvent('download', { timeout: 1500 }).catch(() => null); await btn.click({ timeout: 2000 }).catch(() => { }); await dl1; await page.waitForTimeout(300);
      const sh = await E(() => window.__shared);
      ok('save: on a phone «Сохранить» opens the share sheet with the photo as a PNG file (→ «Сохранить изображение»)', !!sh && sh.n === 1 && sh.type === 'image/png' && /\.png$/.test(sh.name) && sh.size > 5000, sh);
      await E(() => { navigator.canShare = undefined; navigator.share = undefined; });
      const dl2 = page.waitForEvent('download', { timeout: 3000 }).catch(() => null); await btn.click({ timeout: 2000 }).catch(() => { }); const d = await dl2;
      ok('save: without a share sheet it downloads abibyan-ДД-ММ-ГГГГ.png', !!d && /^abibyan-\d\d-\d\d-\d{4}\.png$/.test(d.suggestedFilename()), d && d.suggestedFilename());
      const css = await E(() => [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n')); // raw text: Chromium drops the iOS-only property from cssRules
      ok('save: the photo can be long-pressed on iOS (touch-callout on for .photo)', /\.photo[^{]*\{[^}]*touch-callout:\s*default/.test(css), css.match(/[^}]*\.photo[^}]*\}/g));
    }
    await E(() => { const s = __game.GAME.S; s.name = s._name0; delete s._name0; while (__game.UI.hasModal()) __game.UI.closeModal(); });
  } catch (e) { ok('photo/save: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- 6: a test build with 100 000 coins ----------
  if (want('testbuild')) { try {
    const exists = require('fs').existsSync('/data/game/dist/abibyan-test.html');
    ok('testbuild: dist/abibyan-test.html is built', exists);
    if (exists) {
      const T = await open({ file: 'abibyan-test.html' }); const P = T.page;
      const a = await P.evaluate(() => ({ coins: __game.GAME.S.coins, keys: Object.keys(localStorage), title: document.title }));
      ok('testbuild: starts with 100 000 coins', a.coins >= 100000, a);
      ok('testbuild: keeps its own save (the real one is not touched) and says it is a test', a.keys.length > 0 && !a.keys.includes('martyn_tamagotchi_v1') && /тест/i.test(a.title), a);
      await P.evaluate(() => { __game.GAME.S.coins -= 5000; __game.GAME.save(true); }); await P.reload({ waitUntil: 'load' }); await P.waitForTimeout(800);
      const b = await P.evaluate(() => __game.GAME.S.coins);
      ok('testbuild: the coins are topped up to 100 000 on every start', b >= 100000, b);
      await T.browser.close();
    }
  } catch (e) { ok('testbuild: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- 7: he lifts the fallen drying rack ----------
  if (want('rack')) { try {
    await setup({ room: 'hall' });
    const r = await E(() => { const G = __game, H = G.HOME, V = () => G.GAGS.view().rack; G.GAGS._reset(); H.walkTo(130, 260); __adv(3000);
      const sp = G.ROOMS.spots('hall', G.GAME.S.home.items), rk = sp.rack, hit = (x, y) => { const h = G.GAGS.hit('hall', x, y, true) || G.GAGS.hit('hall', x, y, false); if (h) h.fn(); return !!h; };
      hit(rk[0] + 12, rk[1] + 20); __adv(500); hit(rk[0] + 12, rk[1] + 20); __adv(2000); const fell = V().fall;
      const end = () => { const r = V(), a = r.a, f = r.fall, c = Math.cos(a), s = Math.sin(a), lx = -13, ly = -52; return [rk[0] + rk[2] + lx * c - ly * s, rk[1] + rk[3] + (lx * s + ly * c) * (1 - 0.55 * f * f)]; };
      const x0 = H.mk.x; hit(50, 226); const log = [];
      for (let t = 0; t < 9000; t += 50) { __adv(50); const sp2 = H.mk.sp, hs = [sp2 && sp2.handL, sp2 && sp2.handR].filter(Boolean).map((h) => [H.mk.x + h.x, H.mk.y + H.mk.jy + h.y]);
        const e = end(), dh = hs.length ? Math.min(...hs.map((h) => Math.hypot(h[0] - e[0], h[1] - e[1]))) : 99;
        log.push({ t, f: Math.round(V().fall * 100) / 100, tr: H.trip ? H.trip.kind + ':' + H.trip.ph : '-', x: Math.round(H.mk.x), dh: Math.round(dh) }); }
      return { fell, x0: Math.round(x0), log }; });
    const L = r.log, lift = L.filter((q) => q.f > 0.05 && q.f < 0.95), t0 = (L.find((q) => q.f < 0.97) || {}).t, t1 = (L.find((q) => q.f === 0) || {}).t;
    ok('rack: the setup — the rack fell down', r.fell > 0.9, r.fell);
    ok('rack: a tap on the fallen rack → he walks over to it himself', L.some((q) => /^rack/.test(q.tr)) && Math.min(...L.map((q) => q.x)) < 100, { x0: r.x0, xs: L.filter((q, i) => i % 10 === 0).map((q) => q.x + q.tr) });
    ok('rack: he lifts it slowly with effort (≥ 1 s from the floor to upright)', t0 !== undefined && t1 !== undefined && t1 - t0 >= 1000, { t0, t1 });
    const onIt = lift.filter((q) => q.dh <= 9).length;
    ok('rack: his paws hold the rack\'s end while it goes up', lift.length >= 8 && onIt >= lift.length * 0.7, { n: lift.length, onIt, d: lift.map((q) => q.dh) });
    ok('rack: it stands again and he is free afterwards', L[L.length - 1].f === 0 && L[L.length - 1].tr === '-', L[L.length - 1]);
    await E(() => { __game.GAGS._reset(); });
  } catch (e) { ok('rack: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- 9: the kitchen unit is lower ----------
  if (want('kitchen')) { try {
    await setup({ room: 'kitchen' });
    const k = await E(() => { const sp = __game.ROOMS.spots('kitchen', __game.GAME.S.home.items); const ctr = sp.counter ? sp.counter[1] : sp.pan[1] + sp.pan[3];
      return { ctr, h: 228 - ctr, pan: sp.pan, kettle: sp.kettle, micro: sp.micro, oven: sp.oven, drawers: sp.drawers }; });
    ok('kitchen: the counter is lower (top at y ≥ 160, the unit ≤ 68 px tall; was 140 / 88)', k.ctr >= 160 && k.h <= 68, k);
    ok('kitchen: the pan, the kettle and the microwave stand on the new counter', k.pan[1] + k.pan[3] === k.ctr && (!k.kettle || k.kettle[1] + k.kettle[3] === k.ctr) && (!k.micro || k.micro[1] + k.micro[3] === k.ctr), k);
    ok('kitchen: the oven and the drawers are inside the lower unit', k.oven[1] > k.ctr && k.oven[1] + k.oven[3] <= 228 && k.drawers.every((d) => d[1] > k.ctr && d[1] + d[3] < 228), k);
    await shot(page, G + 'kitchen.png');
  } catch (e) { ok('kitchen: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- 8: pancakes standing on the stool ----------
  if (want('stool')) { try {
    for (const [stage, nm] of [[0, 'Кроха'], [8, 'Взрослый']]) {
      await setup({ room: 'kitchen', stage, inv: { milk: 2 } });
      const r = await E(() => { const G = __game, H = G.HOME, sp = G.ROOMS.spots('kitchen', G.GAME.S.home.items), pan = sp.pan; G.GAGS._reset(); H.walkTo(150, 270); __adv(3000);
        const y0 = H.mk.y, st0 = H.things().stool; const h = G.GAGS.hit('kitchen', pan[0] + 10, pan[1] + 6, true) || G.GAGS.hit('kitchen', pan[0] + 10, pan[1] + 6, false); if (h) h.fn();
        const log = []; let firstCook = null, hands = [];
        for (let t = 0; t < 30000; t += 50) { __adv(50); const st = H.things().stool, ck = G.GAGS.cooking();
          if (!log.length || log[log.length - 1].st !== st) log.push({ t, st, x: Math.round(H.mk.x), y: Math.round(H.mk.y) });
          if (ck && !firstCook) firstCook = { y: Math.round(H.mk.y), st, t };
          if (ck && ['fry', 'flip', 'pour', 'fry2'].includes(G.GAGS.cookPose())) { const s2 = H.mk.sp; for (const q of [s2.handL, s2.handR]) if (q) hands.push(Math.round(H.mk.y + H.mk.jy + q.y)); }
          if (firstCook && !ck && !H.trip) { __adv(500); break; } }
        return { st0, y0: Math.round(y0), log, firstCook, minHand: hands.length ? Math.min(...hands) : null, pan, end: H.things().stool, trip: H.trip }; });
      const seq = r.log.map((q) => q.st);
      ok(`stool (${nm}): there is a stool standing in its place in the kitchen`, r.st0 === 'home', r.st0);
      ok(`stool (${nm}): he fetches it and carries it to the counter before cooking`, seq.indexOf('held') >= 0 && seq.indexOf('placed') > seq.indexOf('held') && r.firstCook && r.firstCook.st === 'placed', { seq, firstCook: r.firstCook });
      ok(`stool (${nm}): he cooks standing on it (feet ≥ 18 px above the floor spot)`, r.firstCook && r.firstCook.y <= 246 - 18, r.firstCook);
      ok(`stool (${nm}): his paw reaches up to the pan (≤ 6 px under the counter top)`, r.minHand !== null && r.minHand <= r.pan[1] + r.pan[3] + 6, { minHand: r.minHand, pan: r.pan });
      ok(`stool (${nm}): afterwards he carries it back to its place`, r.end === 'home' && seq.lastIndexOf('held') > seq.indexOf('placed') && !r.trip, { seq, end: r.end });
      if (stage === 0) { await E(() => { const G = __game, H = G.HOME, sp = G.ROOMS.spots('kitchen', G.GAME.S.home.items), pan = sp.pan; G.GAME.S.inv.milk = 2; const h = G.GAGS.hit('kitchen', pan[0] + 10, pan[1] + 6, true) || G.GAGS.hit('kitchen', pan[0] + 10, pan[1] + 6, false); if (h) h.fn(); for (let t = 0; t < 12000 && !(G.GAGS.cooking() && G.GAGS.cookPose() === 'fry'); t += 50) __adv(50); });
        await shot(page, G + 'stool.png'); await E(() => { __adv(20000); }); }
    }
  } catch (e) { ok('stool: crashed — ' + String(e.message).split('\n')[0], false); } }

  await done(errs, browser);
})();
