// Round 13c: node test/r13c.js [duel,balance,catch] → test/gallery/r13c_*.png. Exit 1 on fail.
// A jump in the banana games: ↑ / W / пробел, swipe up, or a quick tap on Абибян. In the air his hands reach higher — he can snatch a banana before Пуся.
const { boot, ok, shot, done } = require('./lib/h.js'); const { simCatch } = require('./lib/duelsim.js');
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const G = '/data/game/test/gallery/r13c_';
(async () => {
  const { browser, page, errs } = await boot({ hour: 12 }); const E = (f, a) => page.evaluate(f, a);
  await E(() => { __unlock(); __calm(); });
  const home = () => E(() => { if (document.querySelector('#p-exit')) { __game.MINI.pause(); document.querySelector('#p-exit').click(); } else __game.MINI.home(); window.advanceTime(500); });

  // ---------- duel: the three ways to jump, higher reach in the air, a short rest after landing ----------
  if (want('duel')) { try {
    const st = (gid) => E((gid) => { const { MINI } = __game; MINI.seed(11); MINI.start(gid, 1); window.advanceTime(300); MINI.G.items.length = 0; }, gid);
    await st('d_catch');
    const k = await E(() => { const { MINI } = __game; MINI.key('ArrowUp', true); MINI.key('ArrowUp', false); let top = 0; for (let i = 0; i < 30; i++) { window.advanceTime(1000 / 60); MINI.G.items.length = 0; top = Math.max(top, MINI.G.jy || 0); } return { top }; });
    ok('duel jump: ↑ makes him jump (≥ 18 px up)', k.top >= 18, k);
    const cd = await E(() => { const { MINI } = __game; for (let i = 0; i < 27; i++) { window.advanceTime(1000 / 60); MINI.G.items.length = 0; } const m = MINI.G.m; const a = { jt: m.jt, cd: m.cd }; MINI.key('Space', true); MINI.key('Space', false); window.advanceTime(1000 / 60); const b = MINI.G.jy || 0; window.advanceTime(300); MINI.G.items.length = 0; return { a, b, after: m.jt > 0 }; });
    ok('duel jump: a short rest after landing (no jump spam); a press near its end is not lost', cd.a.jt === 0 && cd.a.cd > 0 && cd.a.cd < 0.25 && cd.b === 0 && cd.after, cd);
    await home(); await st('d_catch');
    const sw = await E(() => { const { MINI } = __game; window.advanceTime(1500); MINI.G.items.length = 0; MINI.down(90, 290); window.advanceTime(50); MINI.move(92, 284); window.advanceTime(30); MINI.move(93, 270); let top = 0; for (let i = 0; i < 20; i++) { window.advanceTime(1000 / 60); MINI.G.items.length = 0; top = Math.max(top, MINI.G.jy || 0); } MINI.up(93, 270); return { top }; });
    ok('duel jump: a swipe up jumps', sw.top >= 18, sw);
    const drag = await E(() => { const { MINI } = __game; window.advanceTime(1600); MINI.G.items.length = 0; MINI.down(40, 280); let top = 0; for (let i = 0; i < 30; i++) { MINI.move(40 + i * 3, 280 + (i % 2)); window.advanceTime(1000 / 60); MINI.G.items.length = 0; top = Math.max(top, MINI.G.jy || 0); } MINI.up(130, 280); return { top }; });
    ok('duel jump: a sideways drag never jumps', drag.top === 0, drag);
    const tap = await E(() => { const { MINI } = __game; window.advanceTime(1600); MINI.G.items.length = 0; const x = MINI.G.m.x; MINI.down(x + 3, 262); window.advanceTime(100); MINI.up(x + 3, 262); let top = 0; for (let i = 0; i < 20; i++) { window.advanceTime(1000 / 60); MINI.G.items.length = 0; top = Math.max(top, MINI.G.jy || 0); } window.advanceTime(1600); const far = x > 90 ? 20 : 160; MINI.down(far, 280); window.advanceTime(100); MINI.up(far, 280); let top2 = 0; for (let i = 0; i < 20; i++) { window.advanceTime(1000 / 60); MINI.G.items.length = 0; top2 = Math.max(top2, MINI.G.jy || 0); } return { top, top2 }; });
    ok('duel jump: a quick tap on Абибян jumps, a tap elsewhere only walks', tap.top >= 18 && tap.top2 === 0, tap);
    await home(); await st('d_catch');
    const reach = await E(() => { const { MINI } = __game, G = MINI.G; window.advanceTime(1500); G.items.length = 0; const x = G.m.x, p = G.p; p.x = x > 90 ? 20 : 160; p.stun = 5; const me0 = MINI.st.duel.me;
      const b = { type: 'banana', x, x0: x, y: 200, vy: 0 }, only = () => { for (let i = G.items.length - 1; i >= 0; i--) if (G.items[i] !== b) G.items.splice(i, 1); };
      G.items.push(b); for (let i = 0; i < 20; i++) { window.advanceTime(1000 / 60); only(); } const ground = MINI.st.duel.me - me0, left = G.items.includes(b) ? 1 : 0;
      MINI.key('ArrowUp', true); MINI.key('ArrowUp', false); for (let i = 0; i < 30; i++) { window.advanceTime(1000 / 60); only(); } return { ground, left, air: MINI.st.duel.me - me0 - ground }; });
    ok('duel jump: a banana above his reach stays there on the ground, in a jump he gets it', reach.ground === 0 && reach.left === 1 && reach.air === 1, reach);
    await home(); await st('d_catch');
    // a real mouse swipe on the page (pointer events → logical coords → MINI) and a real quick click on him
    const R = await E(() => { window.advanceTime(1500); __game.MINI.G.items.length = 0; const r = document.getElementById('cv').getBoundingClientRect(); return { l: r.left, t: r.top, k: r.width / 180, mx: __game.MINI.G.m.x }; });
    const px = (x, y) => [R.l + x * R.k, R.t + y * R.k];
    await page.mouse.move(...px(R.mx, 300)); await page.mouse.down(); await page.mouse.move(...px(R.mx + 2, 292), { steps: 2 }); await page.mouse.move(...px(R.mx + 3, 270), { steps: 3 });
    const rs = await E(() => __game.MINI.G.m.jt > 0); await page.mouse.up();
    await E(() => { window.advanceTime(1400); __game.MINI.G.items.length = 0; }); const mx2 = await E(() => __game.MINI.G.m.x);
    await page.mouse.click(...px(mx2, 262)); const rc = await E(() => __game.MINI.G.m.jt > 0);
    ok('duel jump: works with a real swipe and a real click on him', rs && rc, { rs, rc });
    await home(); await st('d_catch');
    await E(() => { const { MINI } = __game, G = MINI.G; window.advanceTime(1500); G.items.length = 0; G.p.x = 40; G.items.push({ type: 'banana', x: G.m.x, x0: G.m.x, y: 196, vy: 0 }); MINI.key('ArrowUp', true); MINI.key('ArrowUp', false); for (let i = 0; i < 8; i++) window.advanceTime(1000 / 60); });
    await shot(page, G + 'duel_jump.png');
    const hint = await E(() => { const h = document.querySelector('#ghint'); return h ? h.textContent : ''; });
    ok('duel jump: the controls hint tells about the jump', /прыж/i.test(hint), hint);
    await home();
  } catch (e) { ok('duel: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- balance: the jump is the player's answer to Пуся (seeded bots) ----------
  if (want('balance')) { try {
    const sim = simCatch(E), R = {};
    for (const stage of [0, 4]) for (const pol of ['jumper', 'casualj']) { const k = pol + stage; R[k] = []; for (let s = 1; s <= 6; s++) { R[k].push(await sim(pol, s * 101, stage)); await E(() => window.advanceTime(2500)); } }
    const W = (k) => R[k].filter((r) => r.win === true).length, sh = (k) => R[k].map((r) => (r.win ? 'W' : 'L') + r.me + ':' + r.fr + '/j' + r.jumps).join(' ');
    console.log('  jump sims:', Object.keys(R).map((k) => k + ' ' + sh(k)).join(' | '));
    ok('balance: a good player who jumps for the contested bananas wins most games at the start (≥ 4 of 6)', W('jumper0') >= 4, sh('jumper0'));
    ok('balance: … and still about half at the last stage (≥ 2 of 6)', W('jumper4') >= 2, sh('jumper4'));
    ok('balance: jumping at random does not win (≤ 2 of 6 at the start, ≤ 1 at the last)', W('casualj0') <= 2 && W('casualj4') <= 1, [sh('casualj0'), sh('casualj4')]);
    ok('balance: the bots really jumped', R.jumper0.every((r) => r.jumps > 0) && R.casualj0.every((r) => r.jumps > 0), sh('jumper0'));
  } catch (e) { ok('balance: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- solo «Банановый ливень»: the same jump ----------
  if (want('catch')) { try {
    await E(() => { const { MINI } = __game; MINI.seed(4); MINI.start('catch', 1); window.advanceTime(300); MINI.G.items.length = 0; });
    const c = await E(() => { const { MINI } = __game, G = MINI.G; MINI.key('KeyW', true); MINI.key('KeyW', false); let top = 0; for (let i = 0; i < 30; i++) { window.advanceTime(1000 / 60); G.items.length = 0; top = Math.max(top, G.jy || 0); } return { top }; });
    ok('catch jump: W makes him jump', c.top >= 18, c);
    const r = await E(() => { const { MINI } = __game, G = MINI.G; window.advanceTime(1500); G.items.length = 0; const z = G.zone(), x = 90; MINI.down(x, 290); window.advanceTime(600); MINI.up(x, 290); G.items.length = 0; const p0 = MINI.st.prog;
      const b = { type: 'banana', x: G.m.x, x0: G.m.x, y: z[0] - 12, vy: 0, ph: 0 }, only = () => { for (let i = G.items.length - 1; i >= 0; i--) if (G.items[i] !== b) G.items.splice(i, 1); };
      G.items.push(b); for (let i = 0; i < 20; i++) { window.advanceTime(1000 / 60); only(); } const ground = G.items.includes(b) ? 1 : 0;
      MINI.key('ArrowUp', true); MINI.key('ArrowUp', false); for (let i = 0; i < 30; i++) { window.advanceTime(1000 / 60); only(); } return { ground, left: G.items.includes(b) ? 1 : 0, prog: MINI.st.prog > p0 }; });
    ok('catch jump: a banana just above his reach — caught only in a jump', r.ground === 1 && r.left === 0 && r.prog, r);
    await E(() => { const { MINI } = __game, G = MINI.G; window.advanceTime(1500); G.items.length = 0; MINI.key('ArrowUp', true); MINI.key('ArrowUp', false); for (let i = 0; i < 9; i++) window.advanceTime(1000 / 60); });
    await shot(page, G + 'catch_jump.png');
    const hint = await E(() => { const h = document.querySelector('#ghint'); return h ? h.textContent : ''; });
    ok('catch jump: the controls hint tells about the jump', /прыж/i.test(hint), hint);
    await home();
  } catch (e) { ok('catch: crashed — ' + String(e.message).split('\n')[0], false); } }

  await done(errs, browser);
})();
