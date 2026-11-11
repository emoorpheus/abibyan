// Round 13b: node test/r13b.js [duel,drums,ducks] → test/gallery/r13b_*.png. Exit 1 on fail.
// #1 «Банановая дуэль» with Пуся is harder (balanced with seeded player bots), #2 the Бонго-дуэль drums keep their colours, #3 ducks walk in front of the balcony planter.
const { boot, ok, shot, done } = require('./lib/h.js'); const { simCatch } = require('./lib/duelsim.js');
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const G = '/data/game/test/gallery/r13b_';
(async () => {
  const { browser, page, errs } = await boot({ hour: 12 }); const E = (f, a) => page.evaluate(f, a);
  await E(() => { __unlock(); __calm(); });

  // ---------- #1 the banana duel is a real fight now ----------
  if (want('duel')) { try {
    const sim = simCatch(E), R = {};
    for (const stage of [0, 4]) for (const pol of ['casual', 'human', 'skilled']) { const k = pol + stage; R[k] = []; for (let s = 1; s <= 6; s++) { R[k].push(await sim(pol, s * 101, stage)); await E(() => window.advanceTime(2500)); } }
    const W = (k) => R[k].filter((r) => r.win === true).length, F = (k) => Math.round(R[k].reduce((a, r) => a + r.fr, 0) / R[k].length * 10) / 10, sh = (k) => R[k].map((r) => (r.win ? 'W' : 'L') + r.me + ':' + r.fr).join(' ');
    console.log('  duel sims:', Object.keys(R).map((k) => k + ' ' + sh(k)).join(' | '));
    ok('duel: a casual player (looks every 0.5 s, no dodging) loses to Пуся (≤ 1 of 6)', W('casual0') <= 1, sh('casual0'));
    ok('duel: a good player wins only some of the games (2–4 of 6) — a real fight', W('human0') >= 2 && W('human0') <= 4, sh('human0'));
    ok('duel: Пуся scores a lot — close games (her average ≥ 9 of 15 against a good player)', F('human0') >= 9, F('human0'));
    ok('duel: still fair — perfect play beats her (≥ 4 of 6 at the first stage, ≥ 3 of 6 at the last)', W('skilled0') >= 4 && W('skilled4') >= 3, [sh('skilled0'), sh('skilled4')]);
    ok('duel: she gets stronger as he grows (a good player wins less at the last stage)', W('human4') <= W('human0') && F('human4') >= F('human0') - 0.5, [sh('human0'), sh('human4')]);
    await E(() => { __game.MINI.seed(5); __game.MINI.start('d_catch', 1); window.advanceTime(5200); }); await shot(page, G + 'duel.png');
    await E(() => { if (document.querySelector('#p-exit')) { __game.MINI.pause(); document.querySelector('#p-exit').click(); } else __game.MINI.home(); window.advanceTime(500); });
  } catch (e) { ok('duel: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #2 the drums keep their own colours (red, yellow, green, blue) even late in a long session ----------
  if (want('drums')) { try {
    await E(() => { const U = __game.UI; for (const r of ['balcony', 'kitchen', 'hall', 'zal', 'bath']) { __game.HOME.goTo(r, true); __adv(300); } for (const t of ['food', 'special', 'tech', 'clothes', 'home']) { U.openShop(t); __adv(200); } U.closeSheet(); U.openWardrobe(); __adv(200); U.closeSheet(); });
    const n0 = await E(() => Object.keys(MONKEY.M).length);
    await E(() => MONKEY.sprite(2, 2, (a) => { for (let k = 0; k < 300; k++) a.mat('__r13b_pad' + k, '#123456'); })); // a long session: many more things drawn (> 256 materials)
    const n1 = await E(() => Object.keys(MONKEY.M).length);
    await E(() => { __game.MINI.seed(3); __game.MINI.start('d_bongo', 1); window.advanceTime(200); });
    const col = await E(() => { const c = document.getElementById('cv').getContext('2d'), o = []; for (const x of [27, 69, 111, 153]) { const d = c.getImageData(x - 8, 254, 16, 14).data; let r = 0, g = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } o.push([Math.round(r / n), Math.round(g / n), Math.round(b / n)]); } return o; });
    await shot(page, G + 'drums.png');
    const isR = ([r, g, b]) => r > g + 50 && r > b + 50, isY = ([r, g, b]) => r > 150 && g > 110 && b < r - 70, isG = ([r, g, b]) => g > r + 15 && g > b + 15, isB = ([r, g, b]) => b > r + 40 && b > g + 5;
    ok('drums: red, yellow, green, blue — after > 256 materials in the session', n1 > 256 && isR(col[0]) && isY(col[1]) && isG(col[2]) && isB(col[3]), { n0, n1, col });
    await E(() => { if (document.querySelector('#p-exit')) { __game.MINI.pause(); document.querySelector('#p-exit').click(); } else __game.MINI.home(); window.advanceTime(500); });
  } catch (e) { ok('drums: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #3 on the balcony the ducks waddle in front of the planter box, not under it ----------
  if (want('ducks')) { try {
    await E(() => { const G = __game; G.UI.closeSheet && G.UI.closeSheet(); while (G.UI.hasModal()) G.UI.closeModal(); G.HOME.goTo('balcony', true); __adv(400); G.FRIENDS._reset && G.FRIENDS._reset(); G.HOME.walkTo(130, 262); __adv(3000); G.DUCKS._place('balcony', 52, 1); __adv(120); });
    const dk = await E(() => { const d = document.getElementById('cv').getContext('2d').getImageData(4, 256, 70, 22).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 215 && d[i + 1] > 165 && d[i + 2] < 90) n++; return { n, pos: __game.DUCKS.pos ? __game.DUCKS.pos().map((p) => [p.id, Math.round(p.x)]) : null }; });
    ok('ducks: on the balcony the ducks in front of the planter are visible (yellow bodies, not just feet under the box)', dk.n >= 40, dk);
    await shot(page, G + 'ducks_balcony.png');
    await E(() => { __game.HOME.goTo('bath', true); __adv(400); __game.DUCKS._place('bath', 150, 1); __adv(120); }); await shot(page, G + 'ducks_bath.png');
  } catch (e) { ok('ducks: crashed — ' + String(e.message).split('\n')[0], false); } }

  await done(errs, browser);
})();
