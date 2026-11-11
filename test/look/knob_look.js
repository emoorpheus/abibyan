const { boot, shot } = require('../lib/h.js');
(async () => {
  const { browser, page } = await boot({ hour: 13 }); const E = (f, a) => page.evaluate(f, a);
  for (const st of [8, 2]) {
    await E((st) => { const G = __game, s = G.GAME.S; __calm(); s.grow.stage = st; s.grow.seen = st; G.FRIENDS._reset(); G.HOME.goTo('zal', true); __adv(500);
      const k = G.GAGS.view().knob; Object.assign(k, { st: 'floor', x: 40, y: 236, vx: 0, vy: 0 }); __adv(100); G.HOME.tripStart('knob'); }, st);
    const fr = []; for (let i = 0; i < 9; i++) { await E((ms) => __adv(ms), i === 0 ? 900 : 420); const f = `/tmp/kb${st}_${i}.png`; await shot(page, f); fr.push(f); }
  }
  await E(() => { const G = __game; G.HOME.goTo('hall', true); __adv(600); }); await shot(page, '/tmp/hall_new.png');
  await browser.close();
})();
