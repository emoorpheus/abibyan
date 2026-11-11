// Mechanics probe (skill: probing-web-game-mechanics): cause -> state -> outcome chains via the test hooks.
// Exit code 1 on any failed check.
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const URL = process.argv[2] || 'file:///data/game/dist/index.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  let fails = 0; const ok = (name, cond, info) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!cond) fails++; };
  await page.goto(URL); await page.waitForTimeout(700);
  await page.evaluate(() => document.querySelector('#nm-ok').click()); await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelectorAll('[data-close]').forEach(b => b.click()));
  const T = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
  const E = (fn, a) => page.evaluate(fn, a);

  // 0. hooks
  const t0 = await T();
  ok('hooks: render_game_to_text + advanceTime', typeof t0 === 'object' && await E(() => typeof window.advanceTime === 'function'), { scene: t0.scene, room: t0.room });
  ok('starts at home, in the Зал', t0.scene === 'home' && t0.room === 'zal', t0.room);

  // 1. needs decay: 1 h awake = RATE per hour
  const d = await E(() => { const s = __game.GAME.S; s.sleeping = false; Object.assign(s.st, { food: 80, fun: 80, energy: 80, clean: 80 }); __game.GAME.simulate(3600); return Object.assign({}, s.st); });
  ok('1 h decay food -20 fun -16 energy -9 clean -11', Math.abs(d.food - 60) < 0.01 && Math.abs(d.fun - 64) < 0.01 && Math.abs(d.energy - 71) < 0.01 && Math.abs(d.clean - 69) < 0.01, d);
  const off = await E(() => { const s = __game.GAME.S; Object.assign(s.st, { food: 30, fun: 30, energy: 30, clean: 30 }); __game.GAME.simulate(86400, true); return Object.assign({}, s.st); });
  ok('offline decay never drops below 12 (no death spiral)', off.food >= 12 && off.fun >= 12 && off.clean >= 12, off);

  // 2. feeding: kitchen, milk raises food, uses inventory, animation completes
  await E(() => { __game.HOME.goTo('kitchen', true); const s = __game.GAME.S; s.st.food = 30; s.inv.milk = 2; });
  await E(() => window.advanceTime(500));
  const f = await E(() => { const s = __game.GAME.S, a = s.st.food, r = __game.HOME.feed('milk'); return { r, a, b: s.st.food, inv: s.inv.milk, add: __game.DATA.FOODS.milk.food, eating: !!__game.HOME.mk.eat }; });
  ok('feed milk -> food +' + f.add + ', inventory -1, eat animation', f.r === true && Math.abs(f.b - Math.min(100, f.a + f.add)) < 0.01 && f.inv === 1 && f.eating, f);
  await E(() => window.advanceTime(2000));
  ok('eat animation finishes', await E(() => !__game.HOME.mk.eat));
  const f2 = await E(() => { const s = __game.GAME.S; delete s.inv.milk; return __game.HOME.feed('milk'); });
  ok('feeding with empty inventory is refused', f2 === false);

  // 3. sleep: lights off -> sleeping, energy rises ~1.3/s, room change wakes up
  await E(() => { __game.HOME.goTo('zal', true); __game.GAME.S.st.energy = 40; }); await E(() => window.advanceTime(300));
  await E(() => __game.HOME.toggleLight());
  const s1 = await T(); await E(() => window.advanceTime(5000)); const s2 = await T();
  ok('lights off -> sleeping', s1.sleeping && !s1.light, s1);
  ok('sleep restores energy (~+6.5 in 5 s)', s2.needs.energy - s1.needs.energy > 5 && s2.needs.energy - s1.needs.energy < 8, [s1.needs.energy, s2.needs.energy]);
  const fz = await E(() => __game.HOME.feed('banana'));
  ok('cannot feed a sleeping pet', fz === false);
  await E(() => __game.HOME.goTo('hall', true)); await E(() => window.advanceTime(300));
  const s3 = await T();
  ok('leaving the bedroom wakes him up, light back on', !s3.sleeping && s3.light, s3);

  // 4. economy
  const c = await E(() => { const a = __game.GAME.S.coins; __game.GAME.addCoins(7); return [a, __game.GAME.S.coins]; });
  ok('addCoins +7', c[1] - c[0] === 7, c);
  const sp = await E(() => { const s = __game.GAME.S; s.coins = 3; return [__game.GAME.spend(5), s.coins]; });
  ok('cannot spend more than you have', sp[0] === false && sp[1] === 3, sp);

  // 5. every mini-game runs on the deterministic clock and reports state
  for (const g of ['catch', 'vine', 'balloon', 'bongo', 'gym']) {
    await E((g) => { const S0 = __game.GAME.S; S0.phone = true; S0.tut = __game.DATA.TUT.length; S0.home.items.pc = 'tower'; /* Round 7: games need the phone + the tutorial + a computer */ __game.GAME.S.st.energy = 100; __game.GAME.S.lvl = 20; __game.GAME.S.grow.stage = __game.DATA.AGE.adult; __game.MINI.start(g, 1); }, g);
    await E(() => window.advanceTime(4000));
    const t = await T();
    ok('mini-game ' + g + ' runs, text state has game', t.scene === 'game' && t.game && t.game.id === g && t.game.hearts >= 0, t.game);
    await E(() => { const b = document.querySelector('#r-home'); if (b) b.click(); else __game.MINI.home(); }); await E(() => window.advanceTime(200));
  }
  const tb = await T(); ok('back home after games', tb.scene === 'home', tb.scene);
  ok('no console/page errors', errs.length === 0, errs.slice(0, 5));
  console.log(fails ? `PROBE FAIL (${fails})` : 'PROBE PASS');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
