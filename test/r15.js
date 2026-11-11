// Round 15 (plan R15 «Живёт сам» ч.2): node test/r15.js [pair,pair2,away,join,side,spont,ptalk] → test/gallery/r15_*.png. Exit 1 on fail.
// The friends live their own lives too: Жучок drops in on Пуся (kitchen), Москит flies over to Монти (balcony), and back the other way;
// they talk to each other in turns, Абибян notices and can join in (a tap); a friend who is out is missed at home («…у Пуси!»);
// everybody comes in from the side of his own room and goes out that way; «Все вместе» also happens by itself in the day
// (once a day, not at night) and at a party two friends talk to each other.
const { boot, ok, shot, done } = require('./lib/h.js');
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const G = '/data/game/test/gallery/r15_';
(async () => {
  const { browser, page, errs } = await boot({ hour: 13 }); const E = (f, a) => page.evaluate(f, a);
  const at = (h) => page.clock.setFixedTime(new Date(2026, 10, 4, h, 0));
  const setup = (o) => E((o) => { const G = __game, s = G.GAME.S; if (G.ROUTINE) { G.ROUTINE.off = true; G.ROUTINE.poke(); G.ROUTINE._reset(); } G.HOME.stopTravel(); while (G.UI.hasModal()) G.UI.closeModal(); G.UI.closeSheet(); if (s.sleeping && G.HOME.room === 'zal') G.HOME.toggleLight();
    s.grow.stage = o.stage === undefined ? 8 : o.stage; s.grow.seen = s.grow.stage;
    Object.assign(s.st, { food: 90, fun: 60, energy: 90, clean: 90 }); s.want = null; s.nextWant = Date.now() + 9e8; s.friends.visitAt = Date.now() + 9e8;
    G.FRIENDS._reset(); G.HOME.goTo(o.room, true); __adv(400); window.__r = { xs: [], talk: [], lines: [], abi: [] }; }, o);
  // record: the guest's x while in the room, who says what (friends), what Абибян says
  const rec = (ms, id, stop) => E(({ ms, id, stop }) => { const G = __game, F = G.FRIENDS, o = window.__r, f = F._F[id], st = new Function('G', 'F', 'f', 'o', 'return ' + (stop || 'false'));
    for (let t = 0; t < ms; t += 100) { __adv(100); if (f.room === G.HOME.room) o.xs.push(Math.round(f.x));
      const i = F.info(), sp = i.speaker, tx = i.bubble; if (sp && tx && o.lines[o.lines.length - 1] !== tx) { o.talk.push(sp); o.lines.push(tx); }
      const ab = G.UI.bubbleText; if (ab && o.abi[o.abi.length - 1] !== ab) o.abi.push(ab);
      if (st(G, F, f, o)) break; }
    o.mode = f.mode; o.room = f.room; o.g = F.info().guest; return o; }, { ms, id, stop: stop || null });
  const turns = (a) => a.reduce((n, x, i) => n + (i && x !== a[i - 1] ? 1 : 0), 0);

  // ---------- friends visit each other ----------
  for (const [sec, room, gid, hid, side, nm] of [['pair', 'kitchen', 'zhuk', 'pusya', 'right', 'Жучок → Пуся (kitchen)'], ['pair2', 'balcony', 'mosq', 'monty', 'right', 'Москит → Монти (balcony)']]) {
    if (!want(sec)) continue;
    try {
      await setup({ room });
      const st = await E((gid) => { const F = __game.FRIENDS; return { ok: typeof F._guest === 'function' && F._guest(gid), pair: F.PAIR || null }; }, gid);
      ok(`${sec}: ${nm} — the guest sets off to his friend`, !!st.ok && !!st.pair && st.pair[gid] === hid, st);
      const a = await rec(25000, gid, "o.talk.includes('" + hid + "') && o.talk.length >= 2");
      await shot(page, G + sec + '.png');
      const b = await rec(70000, gid, "f.mode === 'home' && f.room !== G.HOME.room");
      const peek = await E(() => (__game.DATA.LINES.fc_peek || []));
      ok(`${sec}: he comes in from the side of his own room (${side} edge)`, b.xs.length > 0 && (side === 'right' ? b.xs[0] > 180 : b.xs[0] < 0), b.xs.slice(0, 3));
      ok(`${sec}: he stays next to his friend while they talk`, a.g && a.g.id === gid && a.g.host === hid && a.g.room === room, a.g);
      ok(`${sec}: they talk to each other in turns (both speak, ≥ 3 lines, ≥ 2 turns)`, b.talk.includes(gid) && b.talk.includes(hid) && b.talk.length >= 3 && turns(b.talk) >= 2, { talk: b.talk, lines: b.lines });
      ok(`${sec}: Абибян notices them (a voiced line of his)`, peek.length > 0 && b.abi.some((l) => peek.includes(l)), { abi: b.abi, peek });
      ok(`${sec}: then the guest goes home — out at the ${side} edge, back at his place`, b.mode === 'home' && b.room !== room && (side === 'right' ? b.xs[b.xs.length - 1] > 170 : b.xs[b.xs.length - 1] < 10), { mode: b.mode, room: b.room, last: b.xs.slice(-3) });
    } catch (e) { ok(sec + ': crashed — ' + String(e.message).split('\n')[0], false); }
  }

  // ---------- a friend who is out: he walks off towards his friend, Абибян says where he went; he is there, chatting ----------
  if (want('away')) { try {
    await setup({ room: 'hall' });
    await E(() => __game.FRIENDS._guest && __game.FRIENDS._guest('zhuk'));
    const a = await rec(15000, 'zhuk', "f.room !== 'hall' && o.abi.some((l) => /Пус/.test(l))");
    ok('away: Жучок leaves the hall towards the kitchen (the left edge)', a.room === 'kitchen' && a.xs.length > 0 && a.xs[a.xs.length - 1] < 10, { room: a.room, last: a.xs.slice(-3) });
    ok('away: Абибян says where he went («…к Пусе / у Пуси»)', a.abi.some((l) => /Пус/.test(l)), a.abi);
    await E(() => { __game.HOME.goTo('kitchen', true); window.__r = { xs: [], talk: [], lines: [], abi: [] }; });
    const b = await rec(12000, 'zhuk', "o.talk.length >= 2");
    ok('away: in the kitchen he is with Пуся and they are chatting', b.g && b.g.room === 'kitchen' && b.talk.length >= 2, { g: b.g, talk: b.talk });
  } catch (e) { ok('away: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- a tap on them while they chat: Абибян joins in ----------
  if (want('join')) { try {
    await setup({ room: 'kitchen' });
    await E(() => __game.FRIENDS._guest && __game.FRIENDS._guest('zhuk'));
    await rec(25000, 'zhuk', "o.talk.length >= 2");
    const j = await E(() => { const G = __game, F = G.FRIENDS, fun0 = G.GAME.S.st.fun; window.__r = { xs: [], talk: [], lines: [], abi: [] }; F.tap({ kind: 'friend', id: 'pusya' }); return { fun0, join: G.DATA.LINES.fc_join || [] }; });
    const r = await rec(12000, 'zhuk', "o.abi.length > 0 && o.talk.length >= 1");
    const fun1 = await E(() => __game.GAME.S.st.fun);
    ok('join: a tap on them — Абибян asks to join («Можно с вами?»)', j.join.length > 0 && r.abi.some((l) => j.join.includes(l)), { abi: r.abi, join: j.join });
    ok('join: …a friend answers him', r.talk.length >= 1, r.talk);
    ok('join: …and it is fun (+fun)', fun1 >= j.fun0 + 2, { fun0: j.fun0, fun1 });
    ok('join: no friend card pops up over the chat', !(await E(() => __game.UI.hasModal())));
  } catch (e) { ok('join: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- everybody comes in from the side of his own room (visits, parties) and goes out that way ----------
  if (want('side')) { try {
    const r = await E(() => { const G = __game, F = G.FRIENDS, ORD = G.DATA.ROOMS.map((q) => q.id), bad = [], n = { in: 0, out: 0 };
      for (const room of ORD) for (const id of F.IDS) { const home = F.HOMES[id].room; if (home === room) continue;
        G.HOME.goTo(room, true); __adv(300); F._reset(); __adv(100); F._visit(id); __adv(50); const f = F._F[id], left = ORD.indexOf(home) < ORD.indexOf(room);
        if (left ? !(f.x < 0) : !(f.x > 180)) bad.push(['in', id, room, Math.round(f.x)]); else n.in++;
        F._reset(); __adv(50); }
      for (const room of ['zal', 'hall']) { G.HOME.goTo(room, true); __adv(300); F._reset(); G.GAME.S.friends.partyAt = 0; F._party({ kind: 'photo' }); const first = {};
        for (let t = 0; t < 6000; t += 50) { __adv(50); for (const id of F.IDS) { const f = F._F[id]; if (f.room === room && first[id] === undefined && F.HOMES[id].room !== room) first[id] = Math.round(f.x); } }
        for (const id in first) { const left = ORD.indexOf(F.HOMES[id].room) < ORD.indexOf(room); if (left ? !(first[id] < 0) : !(first[id] > 180)) bad.push(['party', id, room, first[id]]); else n.in++; }
        F._endParty(); F._reset(); __adv(100); }
      return { bad, n }; });
    ok('side: every visitor and party guest comes in from the side of his own room', r.bad.length === 0 && r.n.in >= 12, r);
  } catch (e) { ok('side: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- «Все вместе» by itself in the day; never at night; once a day ----------
  if (want('spont')) { try {
    const run = (h, o) => E(({ h, o }) => { const G = __game, F = G.FRIENDS, s = G.GAME.S; F._reset(); s.friends.partyAt = 0; s.friends.partyDay = o.today ? G.GAME.dayStr(new Date()) : ''; s.friends.visitAt = 0; F._skip(120);
      if (G.ROUTINE) { G.ROUTINE.off = false; G.ROUTINE._reset(); }
      let st = null; for (let t = 0; t < 360000; t += 1000) { __adv(1000, 200); const p = F.info().party; if (p) { st = { t, auto: p.auto, room: G.HOME.room }; break; } }
      F._endParty(); F._reset(); if (G.ROUTINE) G.ROUTINE.off = true; s.friends.visitAt = Date.now() + 9e8; return st; }, { h, o });
    await at(13); await setup({ room: 'zal' }); const d = await run(13, {});
    ok('spont: at 13:00, left alone, the friends come over by themselves within 6 min («Все вместе», auto)', !!d && d.auto, d);
    await at(14); await setup({ room: 'kitchen' }); const twice = await run(14, { today: true });
    ok('spont: …only once a day', !twice, twice);
    await at(23); await setup({ room: 'kitchen' }); const n = await run(23, {});
    ok('spont: …never at night (23:00)', !n, n);
    await at(13);
  } catch (e) { ok('spont: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- at a party two friends talk to each other ----------
  if (want('ptalk')) { try {
    await setup({ room: 'zal' });
    const r = await E(() => { const G = __game, F = G.FRIENDS, NM = { pusya: /Пус/, zhuk: /Жуч/, mosq: /Моск|Комар/, monty: /Монт/ }, talk = [], lines = [];
      G.GAME.S.friends.partyAt = 0; F._party({ kind: 'disco' });
      for (let t = 0; t < 60000 && F.info().party; t += 100) { __adv(100); const i = F.info(); if (i.speaker && i.bubble && lines[lines.length - 1] !== i.bubble) { talk.push(i.speaker); lines.push(i.bubble); } }
      F._endParty(); F._reset();
      let pair = null; for (let k = 0; k + 1 < talk.length; k++) { const a = talk[k], b = talk[k + 1]; if (a !== b && NM[b] && NM[b].test(lines[k])) { pair = [a, b, lines[k], lines[k + 1]]; break; } }
      return { pair, talk, lines }; });
    ok('ptalk: at the party a friend speaks to another one by name, and that one answers', !!r.pair, r);
  } catch (e) { ok('ptalk: crashed — ' + String(e.message).split('\n')[0], false); } }

  await done(errs, browser);
})();
