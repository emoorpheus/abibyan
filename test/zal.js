// Зал (room id 'zal'): layout spots, hotspots, pillows lying on the bed, TV levels, gallery shots.
// node test/zal.js [url]  → test/gallery/zal_*.png. Exit 1 on any failed check.
const { chromium } = require('/vercel/sandbox/node_modules/playwright'); const fs = require('fs');
const URL = process.argv[2] || 'file:///data/game/dist/index.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  let fails = 0; const ok = (name, cond, info) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!cond) fails++; };
  const errs = [];
  async function open(hour) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    if (hour !== undefined) await page.clock.setFixedTime(new Date(2026, 10, 2, hour, 0));
    await page.goto(URL); await page.waitForTimeout(700);
    await page.evaluate(() => document.querySelector('#nm-ok').click()); await page.waitForTimeout(1200);
    await page.evaluate(() => document.querySelectorAll('[data-close]').forEach(b => b.click()));
    await page.evaluate(() => { const s = __game.GAME.S; Object.assign(s.st, { food: 80, fun: 80, energy: 80, clean: 80 }); s.friends.visitAt = Date.now(); __game.HOME.goTo('zal', true); window.advanceTime(500); });
    return page;
  }
  const shot = async (page, name) => { const url = await page.evaluate(() => document.getElementById('cv').toDataURL()); fs.writeFileSync('/data/game/test/gallery/zal_' + name + '.png', Buffer.from(url.split(',')[1], 'base64')); };
  const page = await open(12); const E = (fn, a) => page.evaluate(fn, a); const T = async () => JSON.parse(await E(() => window.render_game_to_text()));
  const tapC = (r) => E((r) => { const x = r[0] + r[2] / 2, y = r[1] + r[3] / 2; __game.HOME.down(x, y); __game.HOME.up(x, y); window.advanceTime(50); }, r);

  // 1. it is the Зал now
  ok('room "zal" is called «Зал»', await E(() => __game.DATA.ROOMS.find((r) => r.id === 'zal').name) === 'Зал');
  // 2. one place for the layout: named spots
  ok('a new flat has no TV in the Зал', await E(() => __game.GAME.S.home.items.tv === 'none' && !__game.ROOMS.spots('zal', __game.GAME.S.home.items).tv));
  await E(() => { __game.GAME.S.home.items.tv = 'hiper'; window.advanceTime(100); });
  const sp = await E(() => __game.ROOMS && __game.ROOMS.spots ? __game.ROOMS.spots('zal', __game.GAME.S.home.items) : null);
  ok('ROOMS.spots(bed) has light / tv / fire / bed (with a TV bought)', !!(sp && sp.light && sp.tv && sp.fire && sp.bed), sp);
  if (sp && sp.tv) {
    // the monkey stands at x 70..110 from y ~170 down: the TV must stay tappable beside him
    const tvFree = sp.tv[0] >= 106 || sp.tv[0] + sp.tv[2] <= 72 || sp.tv[1] + sp.tv[3] <= 168;
    ok('TV is not hidden behind the monkey', tvFree, sp.tv);
    const t0 = await T(); await tapC(sp.tv); const t1 = await T();
    ok('tap on the TV switches it', t0.tv !== undefined && t1.tv === !t0.tv, { before: t0.tv, after: t1.tv });
    await tapC(sp.tv);
  }
  if (sp && sp.fire) {
    const n0 = await E(() => __game.HOME.fx.list.length); await tapC(sp.fire); const n1 = await E(() => __game.HOME.fx.list.length);
    ok('tap on the fireplace makes sparks', n1 > n0, { n0, n1 });
  }
  await shot(page, 'day');
  // 3. pillows LIE on the bed (user: «положить на кровать и сделать меньше, чтобы они лежали как бы на кровати»)
  const pls = await E(() => { const G = __game, out = {}; for (const st of [0, G.DATA.AGES.length - 1]) { G.GAME.S.grow.stage = st; window.advanceTime(300);
    out[st] = { monkey: Math.round(270 - G.HOME.headTop()), pl: G.FRIENDS.drawn.filter((d) => d.kind === 'pillow').map((d) => { let tap = null; // a visible point that really hits this pillow (not the monkey, not the other pillow)
      for (let y = d.y0; y < d.y0 + d.e.h && !tap; y += 2) for (let x = d.x0; x < d.x0 + d.e.w && !tap; x += 2) { const h = G.FRIENDS.at(x + 0.5, y + 0.5); if (h && h.id === d.id && !G.HOME.monkeyAt(x + 0.5, y + 0.5)) tap = [x, y]; }
      return { id: d.id, x0: d.x0, y0: d.y0, w: d.e.w, h: d.e.h, tap }; }) }; } G.GAME.S.grow.stage = 0; window.advanceTime(300); return out; });
  const bed = sp && sp.bed, P0 = pls[0].pl, all = (f) => P0.length === 2 && P0.every(f);
  ok('carrot & pepper are on the bed', P0.length === 2, P0);
  ok('they lie (wider than tall)', all((p) => p.w > p.h), P0);
  ok('inside the bed: headboard … footboard', bed && all((p) => p.x0 >= bed[0] - 2 && p.x0 + p.w <= bed[0] + 86), { bed, P0 });
  const onBlanket = (p) => bed && p.y0 + p.h >= bed[1] + 24 && p.y0 + p.h <= bed[1] + 40, onPillow = (p) => P0.some((q) => q !== p && p.y0 + p.h > q.y0 + 4 && p.y0 + p.h < q.y0 + q.h && p.y0 < q.y0);
  ok('one rests on the blanket, the other on the blanket or on top of her', P0.some(onBlanket) && all((p) => onBlanket(p) || onPillow(p)), { bed, P0 });
  ok('smaller now: long side 55–80 px (about the baby)', all((p) => Math.max(p.w, p.h) >= 55 && Math.max(p.w, p.h) <= 80), P0);
  ok('not hidden by the monkey: each still tappable (baby and adult)', Object.keys(pls).every((st) => pls[st].pl.length === 2 && pls[st].pl.every((p) => p.tap)), pls);
  await E(() => window.advanceTime(5000));
  // 4. TV levels (upgrade steps): none → Hiper → TCL → Digma → DEXP → LG
  for (const tv of ['none', 'hiper', 'tcl', 'digma', 'dexp', 'lg']) {
    const r = await E((tv) => { const G = __game; G.GAME.S.home.items.tv = tv; window.advanceTime(100); return G.ROOMS.spots ? G.ROOMS.spots('zal', G.GAME.S.home.items).tv : null; }, tv);
    ok('TV level ' + tv + (tv === 'none' ? ' has no spot' : ' has a spot'), tv === 'none' ? !r : !!r, r); await shot(page, 'tv_' + tv);
  }
  await E(() => { __game.GAME.S.home.items.tv = 'none'; window.advanceTime(100); });
  // 5. chandelier = light switch → sleep hugging the (big) carrot
  if (sp && sp.light) {
    await tapC(sp.light); await E(() => window.advanceTime(1500)); const t = await T();
    ok('tap on the chandelier: light off → he sleeps', t.light === false && t.sleeping === true, { light: t.light, sleeping: t.sleeping });
    const hug = await E(() => { const D = __game.FRIENDS.drawn, d = D.find((q) => q.kind === 'pillow' && q.id === 'carrot'), pp = D.find((q) => q.kind === 'pillow' && q.id === 'pepper');
      return d ? { w: d.e.w, h: d.e.h, x0: d.x0, y0: d.y0, mx: __game.HOME.mk.x, pep: pp && { x0: pp.x0, y0: pp.y0, w: pp.e.w, h: pp.e.h } } : null; });
    ok('asleep: he hugs the carrot — it lies across his chest', hug && hug.w > hug.h && hug.x0 < hug.mx && hug.x0 + hug.w > hug.mx && hug.y0 >= 178 && hug.y0 <= 206, hug);
    ok('asleep: the pepper does not cover his face', hug && hug.pep && !(hug.pep.x0 < hug.mx && hug.pep.x0 + hug.pep.w > hug.mx && hug.pep.y0 < 176 && hug.pep.y0 + hug.pep.h > 176), hug);
    await shot(page, 'sleep');
    await tapC(sp.light); await E(() => window.advanceTime(500));
    ok('tap again: light on, awake', (await T()).light === true && !(await T()).sleeping);
  }
  await page.close();
  // 6. times of day
  for (const [h, n] of [[8, 'morning'], [19, 'evening'], [23, 'night']]) { const p = await open(h); await shot(p, n); await p.close(); }
  ok('no page errors', errs.length === 0, errs.slice(0, 5));
  console.log(fails ? 'PROBE FAIL ' + fails : 'ALL PASS'); await browser.close(); process.exit(fails ? 1 : 0);
})();
