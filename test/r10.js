// Round 10: node test/r10.js [ducks,hall,walk,radiator,music,gsize,seasons] → test/gallery/r10_*.png. Exit 1 on fail.
const { boot, ok, shot, done, fs } = require('./lib/h.js');
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const G = '/data/game/test/gallery/r10_';
const R9DUCK = { papa: [19, 16], mama: [19, 15], kid: [13, 10], lash: [12, 10] }; // Round 9 sizes (bbox w × h)
(async () => {
  const { browser, page, errs } = await boot({ hour: 12 }); const E = (f, a) => page.evaluate(f, a);
  const extra = [];
  const fresh = async (opts = {}) => { const r = await boot(Object.assign({ hour: 12 }, opts)); r.E = (f, a) => r.page.evaluate(f, a); extra.push(r.errs); return r; };
  const clean = (E) => E(() => { const G = __game; G.UI.closeSheet && G.UI.closeSheet(); while (G.UI.hasModal()) G.UI.closeModal(); document.querySelectorAll('[data-close]').forEach((b) => b.click()); __calm(); G.FRIENDS._reset && G.FRIENDS._reset(); G.GAGS._reset && G.GAGS._reset(); });
  const go = (E, r) => E((r) => { const G = __game; G.UI.closeSheet && G.UI.closeSheet(); while (G.UI.hasModal()) G.UI.closeModal(); G.HOME.goTo(r, true); __adv(400); G.FRIENDS._reset && G.FRIENDS._reset(); __adv(100); }, r);
  const setStage = (E, id) => E((id) => { const G = __game, s = G.GAME.S; s.grow.stage = G.DATA.AGE[id]; s.grow.seen = s.grow.stage; s.kg = G.DATA.KG0 * G.DATA.AGES[s.grow.stage].kg * 1.05; __adv(100); }, id);
  const px = (E, r) => E((r) => { const d = document.getElementById('cv').getContext('2d').getImageData(r[0], r[1], r[2], r[3]).data, o = []; for (let i = 0; i < d.length; i += 4) o.push([d[i], d[i + 1], d[i + 2]]); return o; }, r);
  const cnt = (q, f) => q.filter(f).length;
  await E(() => { __unlock(); __calm(); });

  // ---------- #1 ducks 20–25 % smaller · #2 a tap on a duck works on a phone ----------
  if (want('ducks')) { try {
    const sz = await E(() => Object.fromEntries(['papa', 'mama', 'kid', 'lash'].map((k) => { const b = __bb(DUCKS.sprite(k, 0, 1)); return [k, [b.w, b.h]]; })));
    ok('ducks: every duck is 20–25 % smaller than in Round 9 (w and h × 0.72–0.84)', Object.entries(R9DUCK).every(([k, [w, h]]) => sz[k][0] / w >= 0.72 && sz[k][0] / w <= 0.84 && sz[k][1] / h >= 0.7 && sz[k][1] / h <= 0.84), sz);
    ok('ducks: papa and mama still bigger than the ducklings, the eyelash one the smallest', sz.papa[1] > sz.kid[1] && sz.mama[1] > sz.kid[1] && sz.lash[0] <= sz.kid[0], sz);
    const lane = await E(() => Math.max(...DUCKS.pos().map((d) => d.y)));
    ok('ducks: they waddle above the room buttons (feet ≤ y 276 — the bar covers y ≥ 277 on a short phone)', lane <= 276, lane);
    for (const vh of [664, 844]) {
      const { page: p2, browser: b2, errs: e2 } = await boot({ hour: 12 }); extra.push(e2); await p2.setViewportSize({ width: 390, height: vh }); await p2.waitForTimeout(400);
      const E2 = (f, a) => p2.evaluate(f, a); await E2(() => { __unlock(); __calm(); }); const res = [];
      for (const room of ['hall', 'kitchen', 'balcony', 'zal', 'bath']) {
        await clean(E2); await go(E2, room); await p2.waitForTimeout(150);
        for (const [i, dx] of [[0, 0], [2, 0], [4, 1]]) {
          const q = await E2(([room, i, dx]) => { DUCKS._place(room, 100, 1); __adv(30); const d = DUCKS.pos()[i], b = document.getElementById('cv').getBoundingClientRect();
            return { id: d.id, cx: b.left + (d.x + dx) / 180 * b.width, cy: b.top + (d.y - d.h / 2) / 320 * b.height }; }, [room, i, dx]);
          await E2(() => { __spy(); DUCKS._hop && DUCKS._hop(null); }); await p2.mouse.click(q.cx, q.cy); await p2.waitForTimeout(120);
          const r = await E2(() => ({ hop: DUCKS.info().hop, sq: __game.AUDIO._calls.includes('squeak') }));
          res.push([room, q.id, r.hop, r.sq]);
        }
      }
      ok(`ducks: a real finger tap on papa, a duckling and mama hops + squeaks in every room (390×${vh})`, res.every(([, id, hop, sq]) => hop === id && sq), res.filter(([, id, hop, sq]) => hop !== id || !sq));
      if (vh === 664) { await E2(() => { DUCKS._place('zal', 110, 1); __adv(50); }); await go(E2, 'zal'); await E2(() => { DUCKS._place('zal', 110, 1); __adv(50); }); await p2.screenshot({ path: G + 'ducks_phone.png' }); }
      await b2.close();
    }
  } catch (e) { ok('ducks: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #3 the «Банан Лиза» painting, the wall carpet and the ficus leave the shop and the hall ----------
  if (want('hall')) { try {
    const d = await E(() => { const D = __game.DATA.DECOR; return { painting: !!D.art_painting, carpet: !!D.art_carpet, plant: !!D.plant, hall: Object.values(D).filter((x) => x.room === 'hall').map((x) => x.name) }; });
    ok('hall: «Картина «Банан Лиза»», «Ковёр на стену» and «Фикус» are not sold any more', !d.painting && !d.carpet && !d.plant && !d.hall.some((n) => /Банан Лиза|Ковёр на стену|Фикус/.test(n)), d);
    await E(() => { __game.UI.openShop('home', 'hall'); __adv(200); }); await page.waitForTimeout(700);
    const txt = await E(() => (document.querySelector('#sh-body') || document.body).innerText);
    ok('hall: the «Дом → Прихожая» shop tab has none of them', !/Банан Лиза|Ковёр на стену|Фикус/.test(txt), txt.slice(0, 160));
    await page.screenshot({ path: G + 'shop_hall.png' }); await clean(E);
    const gi = await E(() => __game.GAGS.ids());
    ok('hall: their gags are gone (no «carpet», no «painting» wink)', !gi.includes('carpet') && !gi.includes('painting'), gi);
    ok('hall: «Всё потрогал» (25) still reachable', gi.length >= 25, gi.length);
    const sv = await E(() => { const s = JSON.parse(JSON.stringify(__game.GAME.S)); s.v = 6; s.coins = 10; s.owned = Object.assign({}, s.owned, { art_painting: 1, plant: 1 }); s.home.items.wallart = 'painting'; s.home.items.plant = 1; delete s.shopGift; return JSON.stringify(s); });
    const n = await fresh({ save: sv }); await n.page.waitForTimeout(2700); // the refund toast comes 2.2 s after the intro
    const g = await n.E(() => { const s = __game.GAME.S; return { v: s.v, coins: s.coins, wa: s.home.items.wallart || null, pl: s.home.items.plant || null, own: !!(s.owned.art_painting || s.owned.plant), toast: [...document.querySelectorAll('.toast')].map((t) => t.innerText).join(' | '), sp: __game.ROOMS.spots('hall', s.home.items).wallart || null }; });
    ok('hall: a v6 save with the painting and the ficus → v7, refunded (70 + 60), removed from the hall, with a toast', g.v >= 7 /* v8 since Round 13 */ && g.coins >= 140 && !g.wa && !g.pl && !g.own && !g.sp && /верну|вернул/i.test(g.toast), g);
    await n.E(() => { __game.HOME.goTo('hall', true); __adv(400); }); await shot(n.page, G + 'hall_clean.png'); await n.browser.close();
  } catch (e) { ok('hall: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #4 a tap on the floor: he walks there (and stays) ----------
  if (want('walk')) { try {
    await clean(E); await setStage(E, 'kid'); await go(E, 'zal');
    const at = () => E(() => ({ x: Math.round(__game.HOME.mk.x), y: Math.round(__game.HOME.mk.y), legs: __game.HOME._params().legs, w: !!__game.HOME.walking }));
    const free = await E(() => { const sp = __game.ROOMS.spots('zal', __game.GAME.S.home.items), inR = (x, y, r) => r && x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3];
      const ok = (x, y) => !Object.values(sp).some((r) => Array.isArray(r) && r.length === 4 && typeof r[0] === 'number' && inR(x, y, r)) && !__game.HOME.monkeyAt(x, y) && !DUCKS.at(x, y);
      const fl = []; for (const [x, y] of [[36, 262], [40, 258], [30, 266], [150, 254], [146, 262], [156, 258]]) if (ok(x, y)) fl.push([x, y]);
      let wall = null; for (let y = 140; y < 220 && !wall; y += 4) for (let x = 20; x < 170 && !wall; x += 6) if (ok(x, y) && Math.abs(x - 90) > 30) wall = [x, y]; return { fl, wall }; });
    ok('walk: free floor spots to tap on (left and right of him)', free.fl.length >= 2, free);
    const L = free.fl.find((p) => p[0] < 60), Rr = free.fl.find((p) => p[0] > 120);
    await E(([x, y]) => { __tap(x, y); __adv(150); }, L); const a0 = await at();
    // Round 12: the walk cycle is walkR · stand · walkL · stand, so one frame can show 'stand' — look at a few frames (was flaky)
    const lg = [a0.legs]; for (let i = 0; i < 6; i++) lg.push((await E(() => { __adv(50); return __game.HOME._params().legs; })));
    ok('walk: a tap on the floor → he starts walking (legs step)', a0.w && lg.some((q) => /walk/.test(q || '')), [a0, lg]);
    await E(() => __adv(2500)); const a1 = await at();
    ok('walk: …and gets there (±2 px)', Math.abs(a1.x - L[0]) <= 2 && Math.abs(a1.y - L[1]) <= 2 && !a1.w, [a1, L]);
    await E(() => __adv(4000)); const a2 = await at();
    ok('walk: he stays where he was sent', Math.abs(a2.x - L[0]) <= 2 && Math.abs(a2.y - L[1]) <= 2, [a2, L]);
    await shot(page, G + 'walk_left.png');
    await E(([x, y]) => { __tap(x, y); __adv(200); }, Rr); const d1 = await E(() => __game.HOME._params().dir || (__game.HOME.mk.dir || 0));
    await E(() => __adv(3500)); const a3 = await at();
    ok('walk: tap to the right → he walks over there too', Math.abs(a3.x - Rr[0]) <= 2, [a3, Rr, d1]);
    if (free.wall) { await E(([x, y]) => { __tap(x, y); __adv(200); }, free.wall); const a4 = await at(); ok('walk: a tap on the wall (not the floor) does not move him', !a4.w && Math.abs(a4.x - Rr[0]) <= 2, [a4, free.wall]); }
    await E(() => { __tap(1, 316); __adv(4000); }); const a5 = await at();
    ok('walk: the target is kept inside the room (x 14…166, y 246…272)', a5.x >= 14 && a5.x <= 166 && a5.y >= 246 && a5.y <= 272, a5);
    await go(E, 'kitchen'); const a6 = await at();
    ok('walk: in another room he starts in the middle again', Math.abs(a6.x - 90) <= 1 && Math.abs(a6.y - 270) <= 1, a6);
    await go(E, 'hall'); const fh = await E(() => { const sp = __game.ROOMS.spots('hall', __game.GAME.S.home.items); return { m: sp.mirror }; });
    await E(() => { __tap(150, 262); __adv(3500); }); const b0 = await at();
    await E((m) => { __tap(m[0] + m[2] / 2, m[1] + m[3] / 2); __adv(200); }, fh.m); const tk = await E(() => __game.HOME.trip ? __game.HOME.trip.kind : (__game.HOME._trip ? __game.HOME._trip() : null));
    await E(() => __adv(9000)); const b1 = await at();
    ok('walk: after a trip (the mirror) he comes back to his own spot', Math.abs(b1.x - b0.x) <= 2 && Math.abs(b1.y - b0.y) <= 2, [b0, b1, tk]);
    await E(() => { __game.GAME.S.sleeping = true; __adv(100); }); await E(() => { __tap(40, 262); __adv(1500); }); const b2 = await E(() => ({ x: Math.round(__game.HOME.mk.x), w: !!__game.HOME.walking }));
    ok('walk: asleep he does not get up and walk', !b2.w, b2); await E(() => { __game.GAME.S.sleeping = false; __adv(100); });
  } catch (e) { ok('walk: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #5 the radiator: two small valve knobs; tapped a lot, the right one falls off; tap it — he puts it back ----------
  if (want('radiator')) { try {
    await clean(E); await setStage(E, 'kid'); await go(E, 'zal'); await E(() => { __game.HOME.goTo('zal', true); __adv(300); });
    const sp = await E(() => __game.ROOMS.spots('zal', __game.GAME.S.home.items));
    ok('radiator: two knob spots, left and right of the radiator', !!(sp.knobL && sp.knobR && sp.radiator) && sp.knobL[0] < sp.radiator[0] + 4 && sp.knobR[0] + sp.knobR[2] > sp.radiator[0] + sp.radiator[2] - 4 && sp.knobL[2] <= 8 && sp.knobR[2] <= 8, [sp.knobL, sp.knobR, sp.radiator]);
    if (sp.knobL && sp.knobR) {
      const kl = await px(E, sp.knobL), kr = await px(E, sp.knobR);
      ok('radiator: the knobs are drawn (brown caps since Round 11 #2, chrome stems)', cnt(kl, ([r, g, b]) => r > 70 && r > g + 14 && g > b + 6) >= 2 && cnt(kr, ([r, g, b]) => r > 70 && r > g + 14 && g > b + 6) >= 2, [kl.length, kr.length]);
      await shot(page, G + 'radiator.png');
      const info = () => E(() => __game.GAGS.info().knob);
      const center = (r) => [r[0] + r[2] / 2, r[1] + r[3] / 2];
      await E(() => __spy());
      for (let i = 0; i < 4; i++) await E((c) => { __tap(c[0], c[1]); __adv(400); }, center(sp.radiator));
      ok('radiator: a few taps — the knob only wobbles, stays on', ['on', 'wobble'].includes(await info()), await info());
      for (let i = 0; i < 4; i++) await E((c) => { __tap(c[0], c[1]); __adv(400); }, center(sp.radiator));
      const s1 = await info(), c1 = await E(() => __game.AUDIO._calls.slice());
      ok('radiator: tapped a lot → the right knob falls off (clatter)', ['fall', 'floor'].includes(s1) && c1.includes('clatter'), [s1, c1]);
      await E(() => __adv(1500)); const sp2 = await E(() => __game.ROOMS.spots('zal', __game.GAME.S.home.items));
      ok('radiator: it lies on the floor (its own tap spot there)', (await info()) === 'floor' && !!sp2.knobFloor && sp2.knobFloor[1] >= 222, [await info(), sp2.knobFloor]);
      await shot(page, G + 'radiator_fallen.png');
      if (sp2.knobFloor) {
        const mx0 = await E(() => Math.round(__game.HOME.mk.x));
        await E(() => __spy()); await E((c) => { __tap(c[0], c[1]); __adv(300); }, center(sp2.knobFloor));
        const tr = await E(() => ({ trip: __game.HOME.trip ? __game.HOME.trip.kind : null, w: true }));
        let held = false, seenX = []; for (let i = 0; i < 40; i++) { await E(() => __adv(200)); const k = await info(); if (k === 'held') held = true; seenX.push(await E(() => Math.round(__game.HOME.mk.x))); if (k === 'on' && i > 3) break; }
        const c2 = await E(() => __game.AUDIO._calls.slice()), s2 = await info();
        ok('radiator: tap the fallen knob → he goes, picks it up, screws it back on', tr.trip === 'knob' && held && s2 === 'on' && c2.includes('screw'), [tr, held, s2, c2.slice(0, 12)]);
        ok('radiator: he walked over to it', Math.min(...seenX) < mx0 - 4 || Math.max(...seenX) > mx0 + 4, seenX.slice(0, 12));
        await E(() => __adv(3000));
      }
      const ids = await E(() => __game.GAGS.ids()); ok('radiator: the knob is a gag of its own (counts for «Всё потрогал»)', ids.includes('knob'), ids.length);
    }
  } catch (e) { ok('radiator: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #6 every mini-game has its own music ----------
  if (want('music')) { try {
    const T = await E(() => { const A = __game.AUDIO; return A.TRACKS ? Object.fromEntries(Object.entries(A.TRACKS).map(([k, v]) => [k, { bpm: v.bpm, lead: v.lead, mel: JSON.stringify(v.mel), key: v.key }])) : null; });
    const games = ['catch', 'vine', 'balloon', 'bongo', 'gym', 'stack', 'super', 'race'];
    ok('music: a track for home and for each of the 8 mini-games', !!T && ['home', ...games].every((g) => T[g]), T && Object.keys(T));
    if (T) {
      const ids = ['home', ...games];
      ok('music: all different tunes (no two melodies the same)', new Set(ids.map((g) => T[g].mel)).size === ids.length, ids.map((g) => T[g].mel.slice(0, 20)));
      ok('music: different feels — ≥ 6 different tempos, ≥ 3 lead sounds, ≥ 4 keys', new Set(ids.map((g) => T[g].bpm)).size >= 6 && new Set(ids.map((g) => T[g].lead)).size >= 3 && new Set(ids.map((g) => T[g].key)).size >= 4, ids.map((g) => [g, T[g].bpm, T[g].lead, T[g].key]));
      const seen = {};
      for (const gid of ['gym', 'balloon', 'd_bongo']) {
        await clean(E); await E((g) => { __game.GAME.S.st.energy = 90; __game.MINI.start(g, 1); }, gid); await page.waitForTimeout(1400);
        seen[gid] = await E(() => { const A = __game.AUDIO; return { id: A.trackId, log: (A._musLog || []).slice(-30).map((n) => n.tr) }; });
        await E(() => __game.MINI.home()); await page.waitForTimeout(900);
        seen[gid].back = await E(() => ({ id: __game.AUDIO.trackId, log: (__game.AUDIO._musLog || []).slice(-6).map((n) => n.tr) }));
      }
      ok('music: a game switches to its own track (and it really plays)', seen.gym.id === 'gym' && seen.gym.log.includes('gym') && seen.balloon.id === 'balloon' && seen.balloon.log.includes('balloon'), seen);
      ok('music: a duel plays its game\'s track (d_bongo → bongo)', seen.d_bongo.id === 'bongo', seen.d_bongo);
      ok('music: back home → the home tune again', seen.gym.back.id === 'home' && seen.gym.back.log.includes('home'), seen.gym.back);
    }
  } catch (e) { ok('music: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #7 in the mini-games he is his age's size (no bigger than at home) ----------
  if (want('gsize')) { try {
    const games = ['catch', 'vine', 'balloon', 'bongo', 'gym', 'stack', 'd_catch', 'd_bongo', 'd_gym', 'd_keys'];
    const m = {};
    for (const st of ['newborn', 'kid', 'adult']) {
      await clean(E); await setStage(E, st); await go(E, 'zal');
      const hs = await E(() => __game.GAME.ageDef().s); m[st] = { home: hs };
      for (const gid of games.concat(['super', 'race'])) {
        await E((g) => { const G = __game; G.GAME.S.st.energy = 90; if (!window.__sg) { window.__sg = []; const o = G.SPR.get; G.SPR.get = function (p, tag) { if (tag === 'game') window.__sg.push(p.s); return o.apply(this, arguments); }; } window.__sg.length = 0; G.MINI.start(g, 1); __adv(600); }, gid);
        m[st][gid] = await E(() => { const a = window.__sg.slice(); __game.MINI.home(); __adv(100); return a.length ? Math.max(...a) : null; });
      }
    }
    const bad = []; for (const st of ['newborn', 'kid', 'adult']) for (const gid of games) if (!(m[st][gid] <= m[st].home * 1.1 + 0.005)) bad.push([st, gid, m[st][gid], m[st].home]);
    ok('gsize: in every mini-game he is no bigger than at home (≤ 1.1 ×), at every age', !bad.length && games.every((g) => m.adult[g] !== null), bad.length ? bad : m.adult);
    const grow = games.filter((g) => !(m.newborn[g] <= m.adult[g] * 0.8 && m.kid[g] < m.adult[g]));
    ok('gsize: a Кроха is clearly smaller than an adult in the games too (≤ 0.8 ×)', !grow.length, grow.map((g) => [g, m.newborn[g], m.kid[g], m.adult[g]]));
    ok('gsize: «Супер Абибян» / the race keep their small hitbox-sized hero (≤ home size)', ['super', 'race'].every((g) => m.newborn[g] <= m.newborn.home + 0.005 && m.adult[g] <= m.adult.home), [m.newborn.super, m.newborn.race]);
    await setStage(E, 'newborn'); await E(() => { __game.GAME.S.st.energy = 90; __game.MINI.start('catch', 1); __adv(800); }); await shot(page, G + 'game_catch_newborn.png');
    await E(() => { __game.MINI.home(); __adv(100); }); await E(() => { __game.MINI.start('bongo', 1); __adv(800); }); await shot(page, G + 'game_bongo_newborn.png'); await E(() => { __game.MINI.home(); __adv(100); });
    // the catch zone follows his size: a banana at an adult's hand height flies over a Кроха's head
    const z = await E(() => { const G = __game; G.MINI.start('catch', 1); __adv(100); const a = G.MINI.G && G.MINI.G.zone ? G.MINI.G.zone() : null; G.MINI.home(); __adv(100); return a; });
    await setStage(E, 'adult'); const za = await E(() => { const G = __game; G.MINI.start('catch', 1); __adv(100); const a = G.MINI.G && G.MINI.G.zone ? G.MINI.G.zone() : null; G.MINI.home(); __adv(100); return a; });
    ok('gsize: the catch zone (hands) is lower for the small one', !!z && !!za && z[0] > za[0] + 8, [z, za]);
    await setStage(E, 'kid');
  } catch (e) { ok('gsize: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #8 seasonal events after a week of care: Хэллуин, Новый год, Весна, Лето, День Абибяна ----------
  if (want('seasons')) { try {
    const L = await E(() => (typeof SEASONS !== 'undefined' ? SEASONS.LIST.map((s) => [s.id, s.name]) : null));
    ok('seasons: 5 events — Хэллуин, Новый год, Весна балдёжная, Лето-солнышко, День Абибяна', !!L && L.length === 5 && /Хэллуин/.test(L[0][1]) && /Новый год/.test(L[1][1]) && /Весна/.test(L[2][1]) && /Лето/.test(L[3][1]) && /Абибян/.test(L[4][1]), L);
    if (L) {
      const by = await E(() => [0, 6, 7, 13, 14, 21, 28, 35, 41, 42].map((d) => [d, SEASONS.at(d)]));
      const exp = { 0: null, 6: null, 7: 'halloween', 13: 'halloween', 14: 'newyear', 21: 'spring', 28: 'summer', 35: 'bday', 41: 'bday', 42: 'halloween' };
      ok('seasons: none in the first week of care; then one a week, in turn (and round again)', by.every(([d, id]) => id === exp[d]), by);
      await clean(E); await go(E, 'zal'); await E(() => { __game.GAME.S.grow.days = 6; SEASONS.check(); __adv(100); });
      ok('seasons: text state reports no event before day 7', (await E(() => __T().season)) === null, await E(() => __T().season));
      const c0 = await E(() => __game.GAME.S.coins);
      await E(() => { __spy(); __game.GAME.S.grow.days = 7; SEASONS.check(); __adv(300); });
      const st0 = await E(() => ({ s: __T().season, toast: [...document.querySelectorAll('.toast')].map((t) => t.innerText).join(' | '), coins: __game.GAME.S.coins }));
      ok('seasons: day 7 → «Хэллуин» starts: a toast with its name + a seasonal gift', st0.s === 'halloween' && /Хэллуин/.test(st0.toast) && st0.coins > c0, [st0, c0]);
      const W = await E(() => __game.ROOMS.WIN.zal);
      const look = {};
      for (const id of ['halloween', 'newyear', 'spring', 'summer', 'bday']) {
        await E((id) => { SEASONS.set(id); __game.HOME.goTo('zal', true); __adv(1200); }, id);
        const g0 = await px(E, W); await E(() => __adv(500)); const g1 = await px(E, W);
        const sp = await E(() => SEASONS.spots('zal'));
        const dec = sp && sp.decor ? await px(E, sp.decor) : [];
        look[id] = { moving: g0.reduce((n, q, i) => n + (Math.abs(q[0] - g1[i][0]) + Math.abs(q[1] - g1[i][1]) + Math.abs(q[2] - g1[i][2]) > 40 ? 1 : 0), 0), g1, dec, decor: sp && sp.decor };
        await shot(page, G + 'season_' + id + '_zal.png');
        await E(() => { __game.HOME.goTo('balcony', true); __adv(1200); }); await shot(page, G + 'season_' + id + '_balcony.png');
      }
      const isOr = ([r, g, b]) => r > 190 && g > 70 && g < 170 && b < 80, isW = ([r, g, b]) => r > 232 && g > 232 && b > 232, isPk = ([r, g, b]) => r > 215 && g > 110 && g < 200 && b > 140 && b < 225, isY = ([r, g, b]) => r > 235 && g > 205 && b < 150, isGr = ([r, g, b]) => g > r + 25 && g > b + 10 && g > 80;
      ok('seasons: weather moves in the zal window in every event', Object.values(look).every((q) => q.moving >= 3), Object.fromEntries(Object.entries(look).map(([k, q]) => [k, q.moving])));
      ok('seasons: Хэллуин — orange leaves outside + a glowing pumpkin', cnt(look.halloween.g1, isOr) >= 2 && cnt(look.halloween.dec, isOr) >= 20, [cnt(look.halloween.g1, isOr), cnt(look.halloween.dec, isOr)]);
      ok('seasons: Новый год — snow outside + a little fir tree', cnt(look.newyear.g1, isW) >= 8 && cnt(look.newyear.dec, isGr) >= 25, [cnt(look.newyear.g1, isW), cnt(look.newyear.dec, isGr)]);
      ok('seasons: Весна — pink petals outside + tulips', cnt(look.spring.g1, isPk) >= 3 && cnt(look.spring.dec, isGr) >= 6, [cnt(look.spring.g1, isPk), cnt(look.spring.dec, isGr)]);
      ok('seasons: Лето — a hot sun in the window', cnt(look.summer.g1, isY) >= 12, cnt(look.summer.g1, isY));
      ok('seasons: День Абибяна — balloons', look.bday.dec.length > 0 && cnt(look.bday.dec, ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b) > 110) >= 40, look.bday.dec.length);
      const snd = {};
      for (const id of ['halloween', 'newyear', 'spring', 'summer', 'bday']) {
        await clean(E); await E((id) => { SEASONS.set(id); __game.HOME.goTo('zal', true); __adv(400); __spy(); }, id);
        const sp = await E(() => SEASONS.spots('zal'));
        if (sp && sp.decor) { await E((r) => { __tap(r[0] + r[2] / 2, r[1] + r[3] / 2); __adv(600); }, sp.decor); }
        snd[id] = await E(() => ({ calls: __game.AUDIO._calls.slice(), g: SEASONS.info().gag }));
      }
      ok('seasons: tapping the event decor does its own trick (sound)', Object.values(snd).every((q) => q.calls.some((c) => ['boo', 'jingle', 'chirp', 'fan', 'pop'].includes(c))), snd);
      await E(() => { __game.GAME.S.grow.days = 14; SEASONS.check(); __game.GAME.save(true); }); const sv = await E(() => localStorage.getItem('martyn_tamagotchi_v1'));
      const n = await fresh({ save: sv }); await n.page.waitForTimeout(900);
      const r = await n.E(() => ({ s: __T().season, toast: [...document.querySelectorAll('.toast')].map((t) => t.innerText).join(' | ') }));
      ok('seasons: saved — after a reload it is still Новый год, no second «it started» toast', r.s === 'newyear' && !/начал|наступ|пришёл|пришел/i.test(r.toast), r);
      await n.E(() => { __game.UI.openGrow('grow'); }); await n.page.waitForTimeout(500);
      const gt = await n.E(() => (document.querySelector('#sh-body') || document.body).innerText);
      ok('seasons: the growth sheet lists the events and when the next one comes', /Сезонные события/.test(gt) && /Весна/.test(gt) && /через \d+/.test(gt), gt.slice(-300));
      await n.page.screenshot({ path: G + 'seasons_sheet.png' }); await n.browser.close();
    }
  } catch (e) { ok('seasons: crashed — ' + String(e.message).split('\n')[0], false); } }

  for (const e of extra) errs.push(...e);
  await done(errs, browser);
})();
