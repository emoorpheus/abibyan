// Round 14 (plan R14 «Живёт сам» ч.1): node test/r14.js [morning,snack,bath,night,rules] → test/gallery/r14_*.png. Exit 1 on fail.
// His day by the clock: morning — exercise on the balcony; day — to the fridge when hungry (eats from the stock or asks to buy);
// evening — to the bathroom, asks to be washed; night — yawns, goes to the zal and asks for the light off. Only when you leave him alone
// for a while (20 s without a tap), never during the tutorial, a sheet or a game; a tap stops him. He walks out at the side, the view slides after him, he walks in.
const { boot, ok, shot, done } = require('./lib/h.js');
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const G = '/data/game/test/gallery/r14_';
(async () => {
  const { browser, page, errs } = await boot({ hour: 12 }); const E = (f, a) => page.evaluate(f, a);
  const at = (h) => page.clock.setFixedTime(new Date(2026, 10, 4, h, 0));
  const setup = (o) => E((o) => { const G = __game, s = G.GAME.S; if (G.ROUTINE) { G.ROUTINE.off = true; G.ROUTINE.poke(); G.ROUTINE._reset(); } G.HOME.stopTravel(); while (G.UI.hasModal()) G.UI.closeModal(); G.UI.closeSheet(); if (s.sleeping && G.HOME.room === 'zal') G.HOME.toggleLight(); if (G.FRIENDS) { G.FRIENDS._reset(); s.friends.heistAt = Date.now(); } /* R18: «Вылазка» (a free thing of his own since R15b) has its own test (r15b rheist) */
    Object.assign(s.st, { food: 90, fun: 60, energy: 90, clean: 90 }, o.st || {}); s.want = null; s.nextWant = Date.now() + 9e8; if (o.inv) s.inv = o.inv; s.rt = null;
    G.HOME.goTo(o.room, true); __adv(300); if (G.ROUTINE) { G.ROUTINE.off = false; G.ROUTINE._reset(); } }, o);
  // watch him for up to ms: rooms he was in, x range per room, acts, bubbles, fridge, eating
  const watch = (ms, stop) => E(({ ms, stop }) => { const G = __game, H = G.HOME, o = { rooms: [], x: {}, acts: [], says: [], fridge: false, ate: false, t: 0 };
    for (let t = 0; t < ms; t += 100) { __adv(100); o.t = t; const r = H.room; if (o.rooms[o.rooms.length - 1] !== r) o.rooms.push(r); const x = Math.round(H.mk.x); o.x[r] = o.x[r] || [x, x, x]; o.x[r][0] = Math.min(o.x[r][0], x); o.x[r][1] = Math.max(o.x[r][1], x); if (o.rooms.length > 1 && o.x[r].length === 3 && o.x[r][2] === x && t > 0) { } 
      if (!o.first || o.first.r !== r) o.first = { r, x }; if (H.mk.act && o.acts[o.acts.length - 1] !== H.mk.act.name) o.acts.push(H.mk.act.name); const b = G.UI.bubbleText; if (b && o.says[o.says.length - 1] !== b) o.says.push(b);
      const tk = H.trip ? H.trip.kind + (H.trip.travel ? '*' : '') : '-'; o.tr = o.tr || []; if (o.tr[o.tr.length - 1] !== tk) o.tr.push(tk); if (H.things().fridge === 'open') o.fridge = true; if (H.mk.eat) o.ate = true; if (stop && eval(stop)) break; }
    o.sheet = G.UI.sheetOpen; o.cur = G.ROUTINE && G.ROUTINE.cur; o.enter = o.first; o.st = Object.assign({}, G.GAME.S.st); o.rt = G.GAME.S.rt; o.want = G.GAME.S.want && G.GAME.S.want.type; o.inv = Object.assign({}, G.GAME.S.inv); return o; }, { ms, stop: stop || null });

  // ---------- morning: exercise on the balcony ----------
  if (want('morning')) { try {
    await at(8); await setup({ room: 'zal', st: { fun: 60 } });
    const busy = await watch(12000); // 12 s alone is not enough
    ok('morning: not before he has been left alone for a while (12 s → still in the zal, nothing started)', busy.rooms.join() === 'zal' && !busy.acts.includes('exercise'), busy);
    const w = await watch(25000, "H.mk.act && H.mk.act.name === 'exercise' && H.mk.act.t > 2.4");
    await shot(page, G + 'exercise.png');
    ok('morning: alone a bit longer → he says he is off to exercise', w.says.some((t) => /заряд/i.test(t)), w.says);
    ok('morning: he walks out of the zal at the left side (towards the balcony) and the view follows him to the balcony', w.rooms[0] === 'zal' && w.rooms[w.rooms.length - 1] === 'balcony' && w.x.zal[0] < 0, { rooms: w.rooms, x: w.x });
    ok('morning: on the balcony he walks in from the right edge', w.x.balcony && w.x.balcony[1] > 180, w.x);
    ok('morning: he does his exercise there', w.acts.includes('exercise'), w.acts);
    await E(() => __game.HOME.whine()); // a baby's whine (idle chatter, a greeting) in the middle must not cancel the exercise
    const w2 = await watch(9000, "!(H.mk.act && H.mk.act.name === 'exercise')");
    const fin = await watch(3000);
    ok('morning: done — fun and energy up, «сделано» for today', fin.rt && fin.rt.ex === 1 && fin.st.fun > 60, { rt: fin.rt, st: fin.st, says: w2.says.concat(fin.says) });
    const again = await watch(30000);
    ok('morning: not twice a day', !again.acts.includes('exercise'), again.acts); // Round 14b: he may go off to something else of his own
  } catch (e) { ok('morning: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- day: hungry → to the fridge ----------
  if (want('snack')) { try {
    await at(13); await setup({ room: 'balcony', st: { food: 30 }, inv: { banana: 2 } });
    const w = await watch(40000, 'o.ate && !H.mk.eat');
    ok('snack: hungry and alone → he says so and goes to the kitchen', w.says.some((t) => /проголодал|перекуш/i.test(t)) && w.rooms.join() === 'balcony,kitchen', { says: w.says, rooms: w.rooms });
    ok('snack: he opens the fridge himself and eats a banana from the stock', w.fridge && w.ate && w.inv.banana === 1 && w.st.food > 30, { fridge: w.fridge, ate: w.ate, inv: w.inv, food: w.st.food });
    await E(() => { __game.GAME.S.st.food = 30; }); const w2 = await watch(30000);
    ok('snack: not again right away (a rest between snacks)', !w2.fridge && !w2.ate, w2);
    await setup({ room: 'kitchen', st: { food: 30 }, inv: {} });
    const w3 = await watch(30000, "o.says.some((t) => /пусто/i.test(t))");
    await shot(page, G + 'fridge_empty.png');
    ok('snack: an empty fridge → «Пусто… Купи мне поесть!», nothing eaten', w3.fridge && !w3.ate && w3.says.some((t) => /пусто/i.test(t)), { says: w3.says, fridge: w3.fridge });
  } catch (e) { ok('snack: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- evening: to the bathroom ----------
  if (want('bath')) { try {
    await at(19); await setup({ room: 'kitchen', st: { clean: 50 } });
    const w = await watch(40000, "o.want === 'wash' || G.GAME.S.want && G.GAME.S.want.type === 'wash' && o.rooms.length > 1 && !H.walking");
    await shot(page, G + 'bath.png');
    ok('bath: evening, a bit dirty → he goes right, out of the kitchen, to the bathroom', w.rooms[0] === 'kitchen' && w.rooms[w.rooms.length - 1] === 'bath' && w.x.kitchen[1] > 180, { rooms: w.rooms, x: w.x });
    ok('bath: … and asks to be washed (a wash wish)', w.want === 'wash' && w.rt && w.rt.bath === 1 && w.says.some((t) => /купа|помо|душ|мыть/i.test(t)), { want: w.want, rt: w.rt, says: w.says });
    await setup({ room: 'kitchen', st: { clean: 95 } }); const c = await watch(25000);
    ok('bath: clean already → no bath, no wash wish', !c.rooms.includes('bath') && c.want !== 'wash', { rooms: c.rooms, want: c.want }); // Round 14b: free things of his own are fine
  } catch (e) { ok('bath: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- night: yawns, to the zal, asks for the light off ----------
  if (want('night')) { try {
    await at(23); await setup({ room: 'kitchen' });
    const w = await watch(40000, "o.says.some((t) => /свет|уложи/i.test(t))");
    await shot(page, G + 'night.png');
    ok('night: he yawns and goes to the zal', w.acts.includes('yawn') && w.rooms[w.rooms.length - 1] === 'zal', { acts: w.acts, rooms: w.rooms });
    ok('night: in the zal he asks to switch the light off', w.says.some((t) => /свет|уложи/i.test(t)), w.says);
    const sl = await E(() => { __game.HOME.toggleLight(); __adv(500); return __game.GAME.S.sleeping; });
    ok('night: the light off → he sleeps', sl === true, sl);
    await E(() => { __game.HOME.toggleLight(); __adv(500); });
  } catch (e) { ok('night: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- rules: not in the tutorial, not over a sheet, a tap stops him ----------
  if (want('rules')) { try {
    await at(8); await setup({ room: 'zal' }); await E(() => { __game.GAME.S.tut = 5; });
    const t1 = await watch(30000);
    ok('rules: never during the tutorial', t1.rooms.join() === 'zal' && !t1.acts.includes('exercise'), { rooms: t1.rooms, tr: t1.tr, cur: t1.cur });
    await E(() => { __unlock(); });
    await setup({ room: 'zal' }); await E(() => { __game.UI.openShop('food'); });
    const t2 = await watch(30000);
    ok("rules: not while a sheet is open", t2.rooms.join() === "zal", { rooms: t2.rooms, tr: t2.tr, cur: t2.cur, sheet: t2.sheet, acts: t2.acts, says: t2.says });
    await setup({ room: 'zal' });
    const lv = await watch(30000, 'H.mk.x < 40 && H.walking');
    const tap = await E(() => { const H = __game.HOME; H.down(152, 262); H.up(152, 262); __adv(4000); return { room: H.room, x: Math.round(H.mk.x) }; });
    ok('rules: a tap on the floor while he is leaving → he stays (walks to the tap)', lv.rooms.join() === 'zal' && tap.room === 'zal' && tap.x > 130, { lv: lv.x, tap });
    const after = await watch(9000); // Round 14b: the wait is 15 s now (4 s passed in the tap step)
    ok('rules: and he does not set off again right after the tap', after.rooms.join() === 'zal', after.rooms);
  } catch (e) { ok('rules: crashed — ' + String(e.message).split('\n')[0], false); } }

  await done(errs, browser);
})();
