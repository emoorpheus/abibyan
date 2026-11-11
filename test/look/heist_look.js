const { boot, shot } = require('../lib/h.js');
(async () => {
  const { browser, page } = await boot({ hour: 14 }); const E = (f, a) => page.evaluate(f, a);
  await E(() => { const G = __game, s = G.GAME.S; __calm(); while (G.UI.hasModal()) G.UI.closeModal(); G.UI.closeSheet(); s.friends.visitAt = Date.now() + 9e8; s.friends.partyAt = Date.now(); s.grow.stage = 8; s.grow.seen = 8; s.friends.heistAt = 0; G.FRIENDS._reset(); G.HOME.goTo('hall', true); __adv(500); window.__ok = G.FRIENDS.heist('card'); }); console.log('started', await E(() => window.__ok));
  const out = []; let last = '';
  for (let i = 0; i < 140; i++) { const k = await E(() => { __adv(500); const h = __game.FRIENDS.info().heist; return (h ? h.ph : 'none') + '|' + __game.HOME.room + '|' + (__game.FRIENDS.info().bubble || __game.UI.bubbleText || ''); });
    if (k !== last && out.length < 16) { const f = `/tmp/hz_${out.length}.png`; await shot(page, f); out.push([f, k]); last = k; } if (k.startsWith('none')) break; }
  console.log(out.map((o) => o[1]).join('\n'));
  await browser.close();
})();
