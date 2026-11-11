// Round 15b (the user's notes after R15): node test/r15b.js [testlvl,mirror,knob,zhuk,heist,offer,rheist] → test/gallery/r15b_*.png. Exit 1 on fail.
// 1 the test build also gives the top level and the last growth stage (everything unlocked); 2 the hall mirror is lower;
// 3 Жучок's character: not a thief himself, but always in on Абибян's secret adventures — they sneak Пуся's treats together
//   (card line, chats, jokes, and the heist itself: from the card, on Жучок's whispered offer, and by himself in his own day);
// 4 the radiator knob: he climbs onto the corner of the bed and reaches it from there (not from the floor).
const { boot, open, ok, shot, done } = require('./lib/h.js');
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const G = '/data/game/test/gallery/r15b_';
(async () => {
  const { browser, page, errs } = await boot({ hour: 14 }); const E = (f, a) => page.evaluate(f, a);
  const setup = (o) => E((o) => { const G = __game, s = G.GAME.S; if (G.ROUTINE) { G.ROUTINE.off = true; G.ROUTINE.poke(); G.ROUTINE._reset(); } G.HOME.stopTravel(); while (G.UI.hasModal()) G.UI.closeModal(); G.UI.closeSheet(); if (s.sleeping && G.HOME.room === 'zal') G.HOME.toggleLight();
    s.grow.stage = o.stage === undefined ? 8 : o.stage; s.grow.seen = s.grow.stage; s.sleeping = false;
    Object.assign(s.st, { food: 90, fun: 50, energy: 90, clean: 90 }); s.want = null; s.nextWant = Date.now() + 9e8; s.friends.visitAt = Date.now() + 9e8; s.friends.partyAt = Date.now(); s.friends.heistAt = 0;
    G.FRIENDS._reset(); if (G.GAGS._reset) G.GAGS._reset(); G.HOME.goTo(o.room, true); __adv(400); }, o);

  // ---------- 1 test build: top level + the last growth stage ----------
  if (want('testlvl')) { try {
    const T = await open({ file: 'abibyan-test.html' }); const P = T.page;
    const a = await P.evaluate(() => { const D = __game.DATA, S = __game.GAME.S; let mx = 0; const walk = (o, d) => { if (!o || typeof o !== 'object' || d > 4) return; for (const k in o) { if (k === 'lvl' && typeof o[k] === 'number') mx = Math.max(mx, o[k]); else walk(o[k], d + 1); } };
      walk({ F: D.FOODS, C: D.CLOTHES, De: D.DECOR, U: D.UPGRADES, Ga: D.GAMES }, 0); return { lvl: S.lvl, need: mx, stage: S.grow.stage, last: D.AGES.length - 1, coins: S.coins, age: __game.GAME.ageDef().name }; });
    ok('testlvl: the test build starts at the top level (every shop item unlocked)', a.lvl >= a.need && a.need >= 8, a);
    ok('testlvl: …and he is fully grown («Легенда», the last stage)', a.stage === a.last, a);
    ok('testlvl: …still 100 000 coins', a.coins >= 100000, a);
    const r = await open({}); const b = await r.page.evaluate(() => ({ lvl: __game.GAME.S.lvl, stage: __game.GAME.S.grow.stage }));
    ok('testlvl: the real build is untouched (level 1, a baby)', b.lvl === 1 && b.stage === 0, b);
    await T.browser.close(); await r.browser.close();
  } catch (e) { ok('testlvl: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- 2 the hall mirror is lower ----------
  if (want('mirror')) { try {
    await setup({ room: 'hall' });
    const m = await E(() => __game.ROOMS.spots('hall', __game.GAME.S.home.items).mirror);
    ok('mirror: the hall mirror is lower (≤ 112 px tall, was 140), still a floor mirror (bottom at the floor) and taller than him', m && m[3] <= 112 && m[3] >= 84 && Math.abs(m[1] + m[3] - 228) <= 1, m);
    await E(() => { __game.HOME.tripStart('mirror'); __adv(1800); }); await shot(page, G + 'mirror.png');
    const px = await E((m) => { const d = document.getElementById('cv').getContext('2d').getImageData(0, 0, 180, 320).data, L = __game.HOME.camY || 0; let blue = 0, abovePx = 0;
      for (let y = m[1] + 14; y < m[1] + m[3] - 6; y++) for (let x = m[0] + 4; x < m[0] + m[2] - 4; x++) { const i = ((y - L) * 180 + x) * 4; if (d[i + 2] > d[i] + 6 && d[i + 2] > 150) blue++; }
      return { blue }; }, m);
    ok('mirror: the glass is drawn (bluish pixels inside the frame)', px.blue > 300, px);
  } catch (e) { ok('mirror: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- 4 the radiator knob: from the corner of the bed ----------
  if (want('knob')) { for (const stage of [8, 2]) { try {
    await setup({ room: 'zal', stage });
    const r = await E(() => { const G = __game, k = G.GAGS.view().knob; Object.assign(k, { st: 'floor', x: 40, y: 236, vx: 0, vy: 0 }); __adv(100);
      const started = G.HOME.tripStart('knob') !== false; const o = { started, top: null, hand: null, minY: 999, ph: [], x: [] };
      for (let i = 0; i < 160; i++) { __adv(100); const tr = G.HOME.trip, mk = G.HOME.mk; if (!tr) break; if (!o.ph.includes(tr.ph)) o.ph.push(tr.ph);
        if (tr.ph === 'do') { const hr = mk.sp && (mk.sp.handR || mk.sp.handL); o.minY = Math.min(o.minY, mk.y); o.x.push(Math.round(mk.x)); if (hr && !o.hand) o.hand = [Math.round(mk.x + hr.x), Math.round(mk.y + (mk.jy || 0) + hr.y)]; if (!o.top) o.top = { x: Math.round(mk.x), y: Math.round(mk.y) }; } }
      o.end = { st: G.GAGS.view().knob.st, y: Math.round(G.HOME.mk.y), trip: !!G.HOME.trip }; return o; });
    if (stage === 8) { await E(() => { const G = __game, k = G.GAGS.view().knob; Object.assign(k, { st: 'floor', x: 40, y: 236 }); G.HOME.tripStart('knob'); __adv(4200); }); await shot(page, G + 'knob.png'); }
    const bed = await E(() => __game.ROOMS.spots('zal', __game.GAME.S.home.items).bed);
    ok(`knob (stage ${stage}): he climbs onto the corner of the bed to fix it (feet up at the footboard top, ≤ y 184; at the bed's right corner)`, r.started && r.top && r.top.y <= 184 && r.top.x >= bed[0] + 74 && r.top.x <= bed[0] + bed[2] + 6, { top: r.top, bed, ph: r.ph });
    ok(`knob (stage ${stage}): from up there his paw reaches the radiator knob (≤ 8 px from it)`, r.hand && Math.hypot(r.hand[0] - 112, r.hand[1] - 161) <= 8, r.hand);
    ok(`knob (stage ${stage}): the knob is back on and he is down on the floor again`, r.end.st === 'on' && r.end.y >= 236 && !r.end.trip, r.end);
  } catch (e) { ok('knob: crashed — ' + String(e.message).split('\n')[0], false); } } }

  // ---------- 3 Жучок's character: card line, chats with Абибян, gossip with Пуся, jokes ----------
  if (want('zhuk')) { try {
    await setup({ room: 'hall' });
    const c = await E(() => { const G = __game, Z = G.DATA.FRIENDS.zhuk, w = G.FRIENDS.card('zhuk'), txt = w.textContent, hb = !!w.querySelector('#fr-heist'); G.UI.closeModal(w);
      const all = JSON.stringify([Z.chat, G.DATA.FCHAT['zhuk>pusya'], G.DATA.FCHAT['pusya>zhuk'], G.DATA.FRIENDS.jokes ? G.DATA.FRIENDS.jokes.zhuk : (G.DATA.PARTY || {}).jokes]);
      const jk = JSON.stringify(G.DATA.FCHAT.jokes ? G.DATA.FCHAT.jokes.zhuk : null);
      return { trait: Z.trait || '', inCard: !!Z.trait && txt.includes(Z.trait), hb, chat: (all.match(/тайк|стащ|вылазк|шухер|секрет/gi) || []).length, jk: jk + JSON.stringify(Object.values(G.DATA).filter((v) => v && v.jokes).map((v) => v.jokes.zhuk)) }; });
    ok('zhuk: his character is written down (adventurer, sneaks treats with Абибян, not a thief himself) and shown on his card', /авантюр/i.test(c.trait) && /(вор|тайк|стащ)/i.test(c.trait) && c.inCard, c.trait);
    ok('zhuk: …and used in the talk: ≥ 4 heist lines in his chats with Абибян and with Пуся', c.chat >= 4, c.chat);
    ok('zhuk: …and in his party jokes', /(шухер|стащ|холодильник|тайк)/i.test(c.jk), c.jk.slice(0, 200));
    ok('zhuk: the card has «Вылазка» (a secret trip to Пуся\'s treats)', c.hb);
  } catch (e) { ok('zhuk: crashed — ' + String(e.message).split('\n')[0], false); } }

  // the heist recorder: rooms, who rides, Пуся napping, fridge, lines, loot; until he is back in the hall with Жучок on his hook
  const recHeist = (ms) => E((ms) => { const G = __game, F = G.FRIENDS, z = F._F.zhuk, p = F._F.pusya, s = G.GAME.S, inv0 = Object.assign({}, s.inv), fun0 = s.st.fun;
    const o = { rooms: [], rideK: false, nap: false, fridge: false, lines: [], abi: [], sneak: false, end: null };
    for (let t = 0; t < ms; t += 100) { __adv(100); const r = G.HOME.room; if (o.rooms[o.rooms.length - 1] !== r) o.rooms.push(r);
      if (r === 'kitchen' && z.onFur && z.room === 'kitchen') o.rideK = true; if (r === 'kitchen' && p.nap) o.nap = true; if (G.HOME.trip && G.HOME.trip.kind === 'fridge') o.fridge = true; if (G.HOME.sneaking) o.sneak = true;
      const b = F.info().bubble; if (b && o.lines[o.lines.length - 1] !== b) o.lines.push(b); const ab = G.UI.bubbleText; if (ab && o.abi[o.abi.length - 1] !== ab) o.abi.push(ab);
      if (t > 3000 && !F.info().heist && r === 'hall' && z.mode === 'home' && !z.onFur && !z.path && !G.HOME.trip) break; }
    const loot = Object.keys(s.inv).filter((k) => (s.inv[k] || 0) > (inv0[k] || 0));
    o.end = { heist: F.info().heist, room: G.HOME.room, zhuk: { mode: z.mode, room: z.room, fur: !!z.onFur }, nap: !!p.nap, loot, fun: Math.round(s.st.fun - fun0), n: (s.stats.heists || 0) }; return o; }, ms);

  // ---------- 3 the heist from the card ----------
  if (want('heist')) { try {
    await setup({ room: 'hall' });
    const st = await E(() => { const G = __game, w = G.FRIENDS.card('zhuk'), b = w.querySelector('#fr-heist'); if (b) b.click(); __adv(200); return { ok: !!b, h: G.FRIENDS.info().heist }; });
    ok('heist: «Вылазка» on Жучок\'s card starts it', st.ok && !!st.h, st);
    await E(() => __adv(6000)); const mid = await E(() => ({ fur: __game.FRIENDS._F.zhuk.onFur, sneak: !!__game.HOME.sneaking }));
    await shot(page, G + 'heist1.png');
    const r = await recHeist(120000);
    ok('heist: Жучок rides on his shoulder and they sneak (slow, on tiptoe) to the kitchen together', (mid.fur || r.rideK) && r.rideK && r.rooms.includes('kitchen') && (mid.sneak || r.sneak), { mid, rooms: r.rooms });
    ok('heist: in the kitchen Пуся is napping; he quietly opens the fridge', r.nap && r.fridge, { nap: r.nap, fridge: r.fridge });
    ok('heist: Пуся wakes up and asks who is there; Жучок covers for him', r.lines.some((l) => /Мур\?!/.test(l)) && r.lines.some((l) => /сквозняк/i.test(l)), r.lines);
    ok('heist: Абибян whispers his lines (voiced)', r.abi.length >= 2, r.abi);
    ok('heist: they get away with a treat (+1 in the fridge), +fun, a heist counted', r.end.loot.length === 1 && r.end.fun >= 8 && r.end.n >= 1, r.end);
    ok('heist: back in the hall, Жучок on his hook, Пуся napping no more', r.end.room === 'hall' && r.end.zhuk.mode === 'home' && r.end.zhuk.room === 'hall' && !r.end.zhuk.fur && !r.end.nap && !r.end.heist, r.end);
    const again = await E(() => { const w = __game.FRIENDS.card('zhuk'), b = w.querySelector('#fr-heist'), s = b ? b.getAttribute('style') || '' : '', tx = b ? b.textContent : ''; __game.UI.closeModal(w); return { s, tx }; });
    ok('heist: …then «Вылазка» rests for a while (greyed, «через …»)', /grayscale/.test(again.s) && /через/.test(again.tx), again);
  } catch (e) { ok('heist: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- 3 Жучок whispers an offer when Абибян comes into the hall; a tap on him = yes ----------
  if (want('offer')) { try {
    await setup({ room: 'kitchen' });
    const r = await E(() => { const G = __game, F = G.FRIENDS; window.__rnd0 = Math.random; Math.random = () => 0.01; G.HOME.goTo('hall'); let said = null;
      for (let i = 0; i < 120 && !said; i++) { __adv(100); const b = F.info(); if (b.speaker === 'zhuk' && b.offer) said = b.bubble; }
      const z = F._F.zhuk; __tap(Math.round(z.x), Math.round(z.headY + 4)); __adv(300); const res = { said, h: F.info().heist, modal: G.UI.hasModal() }; Math.random = window.__rnd0; return res; });
    await E(() => { if (window.__rnd0) Math.random = window.__rnd0; });
    ok('offer: coming into the hall, Жучок sometimes whispers «есть дело…» (an offer)', !!r.said, r);
    ok('offer: a tap on him right then starts the heist (no card)', !!r.h && !r.modal, r);
    await recHeist(120000);
  } catch (e) { ok('offer: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- 3 in his own day: the heist is one of his free activities ----------
  if (want('rheist')) { try {
    await setup({ room: 'zal' });
    const r = await E(() => { const G = __game, R = G.ROUTINE, f = R.FREE.find((q) => q.id === 'heist'); if (!f) return { has: false };
      const okNow = f.ok(); R.off = false; R._reset(); R._force('heist'); R._idle(20); let h = null; for (let i = 0; i < 300 && !h; i++) { __adv(100); h = G.FRIENDS.info().heist; } R.off = true; return { has: true, okNow, h, room: G.HOME.room }; });
    ok('rheist: the heist is one of his free activities (when Жучок and Пуся are home)', r.has && r.okNow, r);
    ok('rheist: left alone, he walks to the hall himself and starts it with Жучок', !!r.h, r);
    const z = await recHeist(140000);
    ok('rheist: …and it ends well (back in the hall, Жучок on his hook)', z.end.room === 'hall' && z.end.zhuk.mode === 'home' && !z.end.heist, z.end);
  } catch (e) { ok('rheist: crashed — ' + String(e.message).split('\n')[0], false); } }

  done(errs, browser);
})();
