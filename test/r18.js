// Round 18 (plan R18): node test/r18.js [roofs,gen,lab,idle,bot,mash,parts,district,look,list,tour,grow,result,tab,settle,persist] → test/gallery/r18_*.png. Exit 1 on fail.
// «Крыши» — a big one-button rooftop runner over the city seen from the balcony (districts every 3 levels), and the weekly tournament with the friends.
const { boot, ok, shot, done, fs } = require('./lib/h.js');
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const G = '/data/game/test/gallery/r18_';
const DN = ['Наш двор', 'Старый город', 'Стройка', 'Набережная', 'Центр'];
(async () => {
  const { browser, page, errs } = await boot({ hour: 14 }); const E = (f, a) => page.evaluate(f, a);
  const clean = () => E(() => { const G = __game, s = G.GAME.S; if (G.ROUTINE) { G.ROUTINE.off = true; G.ROUTINE._reset(); } if (G.MINI.active) G.MINI.home(); while (G.UI.hasModal()) G.UI.closeModal(); G.UI.closeSheet(); s.st.energy = 100; s.grow.stage = Math.max(s.grow.stage, 4); s.grow.seen = s.grow.stage; s.grow.party = 0; __adv(200); });
  // run «Крыши» from level L with a seed: mode 'auto' (the built-in skilled pilot), 'idle', 'hold', 'mash'; until the level is passed or the game is over
  const run = (o) => E((o) => { const G = __game, M = G.MINI; G.GAME.S.st.energy = 100; M.seed(o.seed || 1); M.start('roofs', o.L || 1); const g = M.G; if (!g) return { none: 1 };
    if (o.mode === 'auto') g.auto = true; if (o.mode === 'hold') M.down(90, 200); const h0 = M.st.hearts; let t = 0, lost = 0, ban = 0;
    for (; t < (o.ms || 90000); t += 1000 / 60) { if (o.mode === 'mash') { const k = Math.round(t / (1000 / 60)) % 9; if (k === 0) M.down(90, 200); if (k === 3) M.up(90, 200); }
      window.advanceTime(1000 / 60); if (!M.st || M.st.over || M.st.level > (o.L || 1)) break; }
    const r = { L: o.L || 1, passed: !!(M.st && M.st.level > (o.L || 1)), over: !!(M.st && M.st.over), lost: h0 - (M.st ? M.st.hearts : 0), t: Math.round(t), coins: M.st ? M.st.coins : 0, s: g.st() };
    M.home(); while (G.UI.hasModal()) G.UI.closeModal(); return r; }, o);

  // ---------- the game is there ----------
  if (want('roofs')) { try {
    await clean();
    const d = await E(() => { const G = __game, g = G.DATA.GAMES.find((x) => x.id === 'roofs'); return g ? { name: g.name, dev: g.dev, age: g.age, pay: g.pay, icon: !!G.ART.icon(g.icon), track: !!(G.AUDIO.TRACKS && G.AUDIO.TRACKS.roofs) } : null; });
    ok('roofs: «Крыши» is a phone game from «Детёныш», pays ×2, has its icon and its own tune', !!d && d.name === 'Крыши' && d.dev === 'phone' && d.age === 3 && d.pay === 2 && d.icon && d.track, d);
    const s = await E(() => { const G = __game, M = G.MINI; M.start('roofs', 1); __adv(300); const g = M.G, o = { hearts: M.st && M.st.hearts, st: g && g.st ? g.st() : null, scene: G.APP.scene }; M.home(); return o; });
    ok('roofs: it starts — 3 hearts, he runs by himself on the first roof of «Наш двор»', s.scene === 'game' && s.hearts === 3 && !!s.st && s.st.ground && s.st.x > 30 && s.st.district === 0 && s.st.dname === 'Наш двор', s);
  } catch (e) { ok('roofs: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- the jump: tap / hold / a flip in the air ----------
  if (want('lab')) { try {
    await clean();
    const l = await E(() => { const G = __game, M = G.MINI; M.start('roofs', 1); const g = M.G, v = g.st().v; const o = { tap: g.lab(0, false, v), hold: g.lab(9, false, v), dbl: g.lab(9, true, v), short: g.lab(0.14, false, v) }; M.home(); return o; });
    ok('lab: holding jumps higher and further than a tap; a flip in the air (second tap) goes higher and further still', l.hold.apex > l.tap.apex * 3 && l.hold.dist > l.tap.dist * 2 && l.dbl.apex > l.hold.apex * 1.4 && l.dbl.dist > l.hold.dist * 1.3, l);
    ok('lab: the full jump is about two of him high (40–70 px), a flip adds 30+ px', l.hold.apex >= 40 && l.hold.apex <= 70 && l.dbl.apex - l.hold.apex >= 30, l);
  } catch (e) { ok('lab: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- the levels are fair (seeded generator invariants) ----------
  if (want('gen')) { try {
    await clean();
    const r = await E(() => { const G = __game, M = G.MINI; M.start('roofs', 1); const g = M.G; const bad = [], feat = {}, per = [];
      for (let L = 1; L <= 15; L++) for (let seed = 1; seed <= 12; seed++) { const lv = g.gen(L, seed), v = lv.v, d = g.district(L); feat[d] = feat[d] || {};
        const single = (dh) => g.lab(9, false, v, dh).dist, dbl = (dh) => g.lab(9, true, v, dh).dist, short = (dh) => g.lab(0.14, false, v, dh), apex = g.lab(9, false, v).apex;
        for (let i = 1; i < lv.roofs.length; i++) { const a = lv.roofs[i - 1], b = lv.roofs[i], gap = b.x - (a.x + a.w), dh = b.top - a.top;
          const beam = lv.beams.find((q) => q.x > a.x + a.w - 1 && q.x + q.w < b.x + 1), line = lv.lines.find((q) => q.x0 >= a.x + a.w - 2 && q.x1 <= b.x + 2);
          if (gap < 12) bad.push({ L, seed, i, why: 'no gap', gap });
          if (beam) feat[d].beam = 1; if (line) feat[d].line = 1; if (a.awning) feat[d].awning = 1;
          if (dh > apex * 0.6 && !a.awning) bad.push({ L, seed, i, why: 'too high a step', dh });
          if (a.awning) continue; // the awning throws him high (checked by itself in «parts»)
          if (line) { const s = short(dh); if (gap > s.dist * 0.85 || line.y - a.top < s.apex + g.TUNE.MH + 3) bad.push({ L, seed, i, why: 'line gap not short-jumpable', gap, s, ly: line.y - a.top }); continue; }
          if (beam) { if (beam.w < 30) bad.push({ L, seed, i, why: 'narrow beam' }); continue; }
          if (gap > single(dh) * 0.85 && !(d >= 3 && gap <= dbl(dh) * 0.8)) bad.push({ L, seed, i, why: 'gap too wide', gap, s: single(dh), dbl: dbl(dh), d }); }
        for (const o of lv.obs) { if (o.type === 'antenna') feat[d].antenna = 1; if (o.type === 'chimney') feat[d].chimney = 1; if (o.h > apex * 0.85) bad.push({ L, seed, why: 'obstacle too tall', o }); }
        if (seed === 1) per.push({ L, d, v: Math.round(v), len: lv.len, roofs: lv.roofs.length }); }
      M.home(); return { bad: bad.slice(0, 6), nbad: bad.length, feat, per, dist: [1, 3, 4, 6, 7, 9, 10, 12, 13, 15].map((L) => g.district(L)) }; });
    ok('gen: every gap, step and obstacle of levels 1–15 (12 seeds each) can be made with the jump the level needs', r.nbad === 0, r);
    ok('gen: districts change every 3 levels — 1–3 двор, 4–6 старый город, 7–9 стройка, 10–12 набережная, 13+ центр', JSON.stringify(r.dist) === '[0,0,1,1,2,2,3,3,4,4]', r.dist);
    const f = r.feat; ok('gen: new things by district — двор: chimneys only; старый город: + awnings and laundry; стройка: + crane beams; набережная: + antennas',
      f[0].chimney && !f[0].awning && !f[0].line && !f[0].beam && !f[0].antenna && f[1].awning && f[1].line && !f[1].beam && f[2].beam && !f[2].antenna && f[3].antenna && f[4].beam && f[4].antenna, f);
    ok('gen: later levels are faster (√ growth) and longer', r.per[14].v > r.per[0].v * 1.3 && r.per[14].v < r.per[0].v * 1.6 && r.per[9].len > r.per[0].len, r.per);
  } catch (e) { ok('gen: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- monotonous play loses, skilled play wins ----------
  if (want('idle')) { try {
    await clean();
    const a = await run({ L: 1, mode: 'idle', ms: 60000 }), h = await run({ L: 1, mode: 'hold', ms: 60000 });
    ok('idle: never tapping → he falls into the gaps and the game is over on level 1', a.over && !a.passed, a);
    ok('idle: holding the button all the time → one jump only, game over on level 1', h.over && !h.passed, h);
  } catch (e) { ok('idle: crashed — ' + String(e.message).split('\n')[0], false); } }
  if (want('bot') || want('mash')) { try {
    await clean(); const B = [], Ms = [];
    for (const L of [1, 4, 7, 10, 13]) for (const seed of [1, 2, 3]) B.push(await run({ L, seed, mode: 'auto' }));
    ok('bot: a skilled pilot passes levels 1, 4, 7, 10, 13 (3 seeds each)', B.every((r) => r.passed), B.map((r) => [r.L, r.passed, r.lost, r.t, r.s.x, r.s.phase]));
    ok('bot: …losing at most one heart per level', B.every((r) => r.lost <= 1), B.map((r) => [r.L, r.lost]));
    for (const L of [4, 5, 6, 7]) for (const seed of [1, 2, 3]) Ms.push(await run({ L, seed, mode: 'mash' }));
    const bl = B.filter((r) => r.L >= 4 && r.L <= 7).reduce((a, r) => a + r.lost, 0) / 6, ml = Ms.reduce((a, r) => a + r.lost, 0) / Ms.length;
    ok('mash: tapping non-stop (jump + flip all the time) is clearly worse than skilled play from «Старый город» on (laundry, steps)', ml >= bl + 1 && Ms.filter((r) => r.passed).length <= Ms.length / 2, { ml, bl, mash: Ms.map((r) => [r.L, r.passed, r.lost]) });
  } catch (e) { ok('bot: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- the parts, one by one ----------
  if (want('parts')) { try {
    await clean();
    const p = await E(() => { const G = __game, M = G.MINI, adv = (ms) => { for (let t = 0; t < ms; t += 1000 / 60) window.advanceTime(1000 / 60); }, o = {};
      const go = (L) => { M.seed(5); M.start('roofs', L || 1); adv(200); return M.G; };
      // a gap, no tap → falls, −1 heart, a balloon lifts him onto the next roof
      let g = go(); g.place('gap', 20, 40); const h0 = M.st.hearts; let ph = []; for (let t = 0; t < 4000; t += 50) { adv(50); const q = g.st(); if (ph[ph.length - 1] !== q.phase) ph.push(q.phase); if (q.phase === 'run' && ph.includes('balloon') && q.ground) break; }
      o.fall = { lost: h0 - M.st.hearts, ph, ground: g.st().ground }; M.home();
      // a chimney, no tap → bumps into it, −1 heart, knocked back
      g = go(); g.place('chimney', 30); const c0 = M.st.hearts; let kb = false; for (let t = 0; t < 1500; t += 50) { adv(50); if (g.st().kb > 0) kb = true; } o.chim = { lost: c0 - M.st.hearts, kb }; M.home();
      // laundry over a gap: the full jump → his head catches the line → tangled → drops; a short jump passes under it
      g = go(4); g.place('laundry', 6, 26); for (let t = 0; t < 2000; t += 1000 / 60) { const q = g.st(); if (q.ground && q.ahead && q.ahead.type === 'gap' && q.ahead.dx < 3) { M.down(90, 200); break; } adv(1000 / 60); }
      let tang = false; const l0 = M.st.hearts; for (let t = 0; t < 3000; t += 1000 / 60) { adv(1000 / 60); if (g.st().tangled) tang = true; } M.up(90, 200); o.line = { tang, lost: l0 - M.st.hearts }; M.home();
      g = go(4); g.place('laundry', 6, 26); for (let t = 0; t < 2000; t += 1000 / 60) { const q = g.st(); if (q.ground && q.ahead && q.ahead.type === 'gap' && q.ahead.dx < 3) { M.down(90, 200); adv(140); M.up(90, 200); break; } adv(1000 / 60); }
      let tang2 = false; const l1 = M.st.hearts; for (let t = 0; t < 3000; t += 1000 / 60) { adv(1000 / 60); if (g.st().tangled) tang2 = true; } o.under = { tang: tang2, lost: l1 - M.st.hearts }; M.home();
      // an awning throws him up by itself; a flip only once per jump
      g = go(4); g.place('awning', 10); let vmin = 0; for (let t = 0; t < 1500; t += 1000 / 60) { adv(1000 / 60); vmin = Math.min(vmin, g.st().vy); } o.awn = { vmin }; M.home();
      g = go(); M.down(90, 200); adv(100); M.up(90, 200); adv(150); M.down(90, 200); adv(60); const d1 = g.st(); M.up(90, 200); adv(100); M.down(90, 200); adv(60); M.up(90, 200); const d2 = g.st(); o.flip = { a: d1.dbl, vyA: d1.vy, vyB: d2.vy }; M.home();
      // bananas: 10 = a coin
      g = go(); g.place('bananas', 16, 10); const k0 = M.st.coins; adv(4000); o.ban = { got: g.st().bananas, coins: M.st.coins - k0 }; M.home();
      return o; });
    ok('parts: a gap without a tap → −1 heart, a balloon lifts him onto the next roof and he runs on', p.fall.lost === 1 && p.fall.ph.includes('balloon') && p.fall.ground, p.fall);
    ok('parts: running into a chimney → −1 heart, knocked back', p.chim.lost === 1 && p.chim.kb, p.chim);
    ok('parts: laundry over a gap — a full jump catches the line (tangled, drops, −1 heart); a short jump passes under it', p.line.tang && p.line.lost === 1 && !p.under.tang && p.under.lost === 0, { line: p.line, under: p.under });
    ok('parts: an awning bounces him high by itself (no tap)', p.awn.vmin < -300, p.awn);
    ok('parts: the flip (a tap in the air) works once per jump', p.flip.a && p.flip.vyA < -100 && p.flip.vyB > p.flip.vyA, p.flip);
    ok('parts: 10 bananas on the roof → +1 coin', p.ban.got >= 10 && p.ban.coins >= 1, p.ban);
  } catch (e) { ok('parts: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- a new district: a sign on the first roof + «Новый район» ----------
  if (want('district') || want('look')) { try {
    await clean();
    const d = await E(() => { const G = __game, M = G.MINI, adv = (ms) => { for (let t = 0; t < ms; t += 50) window.advanceTime(50); }; M.seed(3); M.start('roofs', 3); const g = M.G; g.auto = true; let txt = '', sign = null;
      for (let t = 0; t < 90000 && M.st.level < 4; t += 50) adv(50); for (let t = 0; t < 2500; t += 50) { adv(50); const e = document.getElementById('gmsg'); if (e && /район/i.test(e.textContent)) { txt = e.textContent; break; } }
      const q = g.st(); sign = q.sign; M.home(); return { L: q.level, d: q.district, dname: q.dname, txt, sign }; });
    ok('district: level 3 → 4 he is in «Старый город»: «Новый район» message and a sign on the first roof', d.d === 1 && d.dname === 'Старый город' && /Старый город/.test(d.txt) && d.sign === 'Старый город', d);
    // a look at every district (auto pilot a few seconds in)
    for (let i = 0; i < 5; i++) { await E((L) => { const M = __game.MINI; M.seed(2); M.start('roofs', L); M.G.auto = true; for (let t = 0; t < 5200; t += 50) window.advanceTime(50); }, [1, 4, 7, 10, 13][i]); await shot(page, G + 'd' + i + '.png'); await E(() => __game.MINI.home()); }
    await E(() => { __game.MINI.intro('roofs'); }); await page.waitForTimeout(400); await page.screenshot({ path: G + 'intro.png' }); await E(() => { while (__game.UI.hasModal()) __game.UI.closeModal(); });
  } catch (e) { ok('district: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- in the phone's game list ----------
  if (want('list')) { try {
    await clean();
    const l = await E(() => { const G = __game; G.UI.openGames('phone'); __adv(200); const r = document.querySelector('#sh-body .li[data-g="roofs"]'); const o = r ? { t: r.textContent, play: !!r.querySelector('[data-play]') } : null; G.UI.closeSheet(); return o; });
    ok('list: «Крыши» is in the phone games with «Играть»', !!l && /Крыши/.test(l.t) && l.play, l);
  } catch (e) { ok('list: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ================= the weekly tournament =================
  const day = (d, h = 12) => page.clock.setFixedTime(new Date(2026, 10, d, h, 0)); // November 2026: Mon 2, Wed 4, Fri 6, Sun 8, Mon 9
  const tsetup = () => E(() => { const G = __game, s = G.GAME.S; s.tour = null; s.best = Object.assign({}, s.best, { catch: 8, roofs: 6, stack: 10, bongo: 7, vine: 9, balloon: 5, gym: 6, super: 4, race: 3 }); if (G.TOUR) G.TOUR._reset(); while (G.UI.hasModal()) G.UI.closeModal(); });
  if (want('tour') || want('grow') || want('result') || want('tab') || want('settle') || want('persist')) { try {
    await clean(); await day(4); await tsetup();
    const t = await E(() => { const T = __game.TOUR; if (!T) return null; const c = T.cur(), tb = T.table(); return { c, tb, playable: __game.GAME.canPlay(c.gid), name: (__game.DATA.GAMES.find((g) => g.id === c.gid) || {}).name }; });
    if (want('tour')) {
      ok('tour: this week (Mon 2 Nov) has a tournament game he can play', !!t && t.c.wk === '2026-11-02' && !!t.c.gid && t.playable, t && t.c);
      ok('tour: the table — him and the 4 friends, places 1–5, friends with scores, his 0 before he plays', !!t && t.tb.length === 5 && t.tb.filter((r) => r.id !== 'me').length === 4 && t.tb.map((r) => r.place).join() === '1,2,3,4,5' && t.tb.find((r) => r.id === 'me').score === 0 && t.tb.filter((r) => r.id !== 'me').every((r) => r.score >= 1), t && t.tb);
      const fin = await E(() => __game.TOUR.cur().fin); const ref = await E(() => __game.TOUR.cur().ref);
      ok('tour: the friends\' week totals are near his record in that game (one leader at 0.95–1.2×, nobody above 1.4×)', !!fin && Math.max(...Object.values(fin)) >= ref * 0.95 && Math.max(...Object.values(fin)) <= ref * 1.4 + 1, { fin, ref });
    }
    if (want('grow')) {
      const sc = []; for (const d of [2, 4, 6, 8]) { await day(d); sc.push(await E(() => __game.TOUR.table().filter((r) => r.id !== 'me').map((r) => r.id + ':' + r.score).sort().join(' '))); }
      const parse = (s) => Object.fromEntries(s.split(' ').map((x) => x.split(':')).map(([a, b]) => [a, +b])); const P = sc.map(parse), fin = await E(() => __game.TOUR.cur().fin);
      ok('grow: the friends play all week — their scores only go up (Mon ≤ Wed ≤ Fri) and reach their totals by Friday', Object.keys(P[0]).every((k) => P[0][k] <= P[1][k] && P[1][k] <= P[2][k] && P[2][k] === fin[k] && P[3][k] === fin[k]) && Object.keys(P[0]).some((k) => P[0][k] < P[2][k]), { sc, fin });
      await day(4);
    }
    if (want('result') || want('tab') || want('settle') || want('persist')) {
      const r = await E(() => { const G = __game, M = G.MINI, T = G.TOUR, gid = T.cur().gid, fin = T.cur().fin, top = Math.max(...Object.values(fin)); __spy(); G.GAME.S.st.energy = 100; M.start(gid, 1); const L = top + 1; M.st.level = L; M.st.done = L - 1; M.api.over(); for (let t = 0; t < 2500; t += 50) window.advanceTime(50);
        const m = (document.querySelector('#modal .mbox') || {}).textContent || ''; const toasts = [...document.querySelectorAll('.toast')].map((e) => e.textContent); const me = T.table().find((x) => x.id === 'me'); M.home(); while (G.UI.hasModal()) G.UI.closeModal(); return { m, toasts, me, L }; });
      if (want('result')) {
        ok('result: after a run of the tournament game the results window says his place («Турнир недели: 1-е место»)', /Турнир недели/.test(r.m) && /1-е место/.test(r.m), r.m);
        ok('result: …his table score is that level, he is 1st, a toast says he is the leader / overtook someone', r.me.score === r.L && r.me.place === 1 && r.toasts.some((x) => /обогнал|лидер/i.test(x)), { me: r.me, toasts: r.toasts });
        const r2 = await E(() => { const G = __game, M = G.MINI, T = G.TOUR, other = ['catch', 'stack', 'bongo', 'vine'].find((g) => g !== T.cur().gid && G.GAME.canPlay(g)); const before = T.table().find((x) => x.id === 'me').score; M.start(other, 1); M.st.level = 99; M.st.done = 98; M.api.over(); for (let t = 0; t < 2500; t += 50) window.advanceTime(50); const m = (document.querySelector('#modal .mbox') || {}).textContent || ''; M.home(); while (G.UI.hasModal()) G.UI.closeModal(); return { m, before, after: T.table().find((x) => x.id === 'me').score }; });
        ok('result: another game does not count for the tournament', r2.before === r2.after && !/Турнир недели/.test(r2.m), r2);
      }
      if (want('tab')) {
        const tb = await E(() => { const G = __game; G.UI.openGames('phone'); __adv(100); const tab = document.querySelector('.tab[data-t="tour"]'); if (tab) tab.click(); __adv(200); const b = document.getElementById('sh-body'); const o = { tab: !!tab, txt: b ? b.textContent : '', rows: b ? b.querySelectorAll('.trow').length : 0, imgs: b ? b.querySelectorAll('.trow img.pt').length : 0, play: !!(b && b.querySelector('#t-play')), mine: !!(b && b.querySelector('.trow.me')) }; return o; });
        await page.waitForTimeout(200); await page.screenshot({ path: G + 'tour.png' });
        ok('tab: «Мини-игры» has a «Турнир» tab: the game of the week, days left, 5 rows with portraits and prizes, his row marked, «Играть»', tb.tab && /Турнир недели/.test(tb.txt) && /осталось 5 дн/.test(tb.txt) && tb.rows === 5 && tb.imgs === 5 && tb.mine && tb.play && /100/.test(tb.txt), tb);
        const pl = await E(() => { const G = __game; const b = document.getElementById('t-play'); if (b) b.click(); __adv(300); const o = { modal: G.UI.hasModal(), txt: (document.querySelector('#modal .mbox') || {}).textContent || '', scene: G.APP.scene, room: G.HOME.room }; while (G.UI.hasModal()) G.UI.closeModal(); G.UI.closeSheet(); if (G.MINI.active) G.MINI.home(); return o; });
        ok('tab: «Играть» opens that game (its start window, or takes him to its device)', (pl.modal && pl.txt.length > 10) || pl.room === 'balcony' || pl.room === 'zal', pl);
      }
      if (want('settle') || want('persist')) {
        if (want('persist')) { await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(900); await E(() => { const b = document.querySelector('#nm-ok'); if (b) b.click(); document.querySelectorAll('[data-close]').forEach((x) => x.click()); });
          await page.evaluate(require('./lib/h.js').PAGE_HELPERS); await E(() => { __unlock(); __calm(); });
          const p = await E(() => { const T = __game.TOUR; return { wk: T.cur().wk, me: T.table().find((x) => x.id === 'me').score }; });
          ok('persist: the tournament survives a reload (same week, his score kept)', p.wk === '2026-11-02' && p.me === r.L, { p, L: r.L }); }
        if (want('settle')) {
          const c0 = await E(() => { const G = __game; G.GAME.S.wins = 0; while (G.UI.hasModal()) G.UI.closeModal(); return { coins: G.GAME.S.coins, gid: G.TOUR.cur().gid }; });
          await day(9, 10); await E(() => { __game.HOME.goTo('zal', true); for (let t = 0; t < 3000; t += 50) window.advanceTime(50); });
          const s = await E(() => { const G = __game, s = G.GAME.S; const m = (document.querySelector('#modal .mbox') || {}).textContent || ''; return { m, coins: s.coins, wins: s.tour && s.tour.wins, wk: G.TOUR.cur().wk, gid: G.TOUR.cur().gid, album: G.ALBUM ? G.ALBUM.list().map((e) => e.k + ' ' + e.title) : [], said: (G.AUDIO._said || []).slice() }; });
          await page.waitForTimeout(900); await page.screenshot({ path: G + 'settle.png' });
          ok('settle: next Monday at home → «Итоги турнира»: 1st place, +100 coins, a cup (wins 1)', /Итоги турнира/.test(s.m) && /1-е место/.test(s.m) && s.coins - c0.coins >= 100 && s.wins === 1, { m: s.m, d: s.coins - c0.coins, wins: s.wins });
          ok('settle: …a «Чемпион недели» photo goes into the album and he says it', s.album.some((x) => /^tour:2026-11-02 Чемпион недели/.test(x)), s.album);
          await E(() => { const G = __game; while (G.UI.hasModal()) G.UI.closeModal(); for (let t = 0; t < 3000; t += 50) window.advanceTime(50); while (G.UI.hasModal()) G.UI.closeModal(); });
          const a = await E(() => { const G = __game, A = G.DATA.ACH.find((x) => x.id === 'champ'); return { ach: !!A, val: A ? A.val(G.GAME.S) : 0 }; });
          ok('settle: the achievement «Чемпион недели» counts the cups', a.ach && a.val >= 1, a);
          ok('settle: a new week (9 Nov) with another game', s.wk === '2026-11-09' && s.gid && s.gid !== c0.gid, { wk: s.wk, gid: s.gid, was: c0.gid });
          await day(16, 10); const n = await E(() => { const G = __game, c = G.GAME.S.coins; G.HOME.goTo('kitchen', true); for (let t = 0; t < 3000; t += 50) window.advanceTime(50); return { modal: G.UI.hasModal() && /Итоги/.test((document.querySelector('#modal .mbox') || {}).textContent || ''), d: G.GAME.S.coins - c }; });
          ok('settle: a week he did not play → no prize and no results window', !n.modal && n.d < 100, n);
        }
      }
    }
  } catch (e) { ok('tour: crashed — ' + String(e.message).split('\n')[0], false); } }

  await done(errs, browser);
})();
