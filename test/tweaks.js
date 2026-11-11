// Round 3 of the flat (user review): kitchen table & chairs from the photo (no pink), hall (folded rack, wider mirror, 2nd soft sconce),
// bath (bigger cat rug by the sink), 5 real TVs with brand + size. node test/tweaks.js → test/gallery/tw_*.png. Exit 1 on fail.
const { chromium } = require('/vercel/sandbox/node_modules/playwright'); const fs = require('fs');
const URL = process.argv[2] || 'file:///data/game/dist/index.html', KEY = 'martyn_tamagotchi_v1';
const TVS = [['hiper', /Hiper 40″ IPS/], ['tcl', /TCL 43″ QLED/], ['digma', /Digma Pro 50″ VA/], ['dexp', /DEXP 55OCG 55″ OLED/], ['lg', /LG G5 65″ OLED/]];
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
  let fails = 0; const ok = (name, cond, info) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 500) : '')); if (!cond) fails++; };
  const errs = [];
  async function open(hour, pre) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.clock.setFixedTime(new Date(2026, 10, 2, hour, 0));
    if (pre) await page.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', 1); } }, [KEY, JSON.stringify(pre)]);
    await page.goto(URL); await page.waitForTimeout(700);
    await page.evaluate(() => { const b = document.querySelector('#nm-ok'); if (b) b.click(); }); await page.waitForTimeout(1200);
    await page.evaluate(() => { document.querySelectorAll('[data-close]').forEach((b) => b.click()); const s = __game.GAME.S; Object.assign(s.st, { food: 80, fun: 80, energy: 80, clean: 80 }); s.friends.visitAt = Date.now(); window.advanceTime(300); });
    return page;
  }
  const page = await open(12); const E = (fn, a) => page.evaluate(fn, a);
  const shot = async (name) => { const url = await E(() => document.getElementById('cv').toDataURL()); fs.writeFileSync('/data/game/test/gallery/tw_' + name + '.png', Buffer.from(url.split(',')[1], 'base64')); };
  const go = (r) => E((r) => { __game.HOME.goTo(r, true); __game.FRIENDS._skip(0); window.advanceTime(400); }, r);
  const spots = (r) => E((r) => __game.ROOMS.spots(r, __game.GAME.S.home.items), r);
  // pixels of a canvas rect: [[r,g,b,a]...]
  // Round 24: the furniture alone — a frame drawn without Абибян and the friends (in all.sh he once walked by the kitchen table blushing: «pink»)
  const px = (rect) => E((q) => { const G = __game, D = G.DASHA, c = document.getElementById('cv').getContext('2d'), rh = D.hideMk, rf = G.FRIENDS.render; D.hideMk = () => true; G.FRIENDS.render = function () { }; G.HOME.render(c); D.hideMk = rh; G.FRIENDS.render = rf;
    const [x, y, w, h] = q.map(Math.round), d = c.getImageData(x, y, w, h).data, out = []; for (let i = 0; i < d.length; i += 4) out.push([d[i], d[i + 1], d[i + 2]]); return out; }, rect);
  const pink = ([r, g, b]) => r > 170 && b > 100 && r - g > 45 && b - g > -5;

  // 1. kitchen: black metal table with a glass top + black chairs with light floral cushions (no pink towel)
  await go('kitchen'); let sp = await spots('kitchen');
  ok('kitchen spots: table and chair', sp && sp.table && sp.chair, sp);
  if (sp && sp.table) {
    const all = [...await px(sp.table), ...(sp.chair ? await px(sp.chair) : [])];
    ok('no pink on the table / chair', all.filter(pink).length === 0, all.filter(pink).slice(0, 5));
    const ch = sp.chair ? await px(sp.chair) : [];
    ok('chair: black metal frame (dark pixels)', ch.filter(([r, g, b]) => r < 50 && g < 50 && b < 60).length >= 20, ch.length);
    ok('chair: light beige cushion', ch.filter(([r, g, b]) => r > 200 && g > 185 && b > 150 && r - b < 70).length >= 12);
    ok('table: glass top (blue-grey glints)', (await px(sp.table)).filter(([r, g, b]) => b > r + 6 && b > 90).length >= 8);
  }
  await shot('kitchen');
  // 2. hall: the drying rack is folded (tall & narrow), wider mirror, two sconces — the new one soft white, not warm
  await go('hall'); sp = await spots('hall');
  ok('hall: folded rack (taller than wide)', sp && sp.rack && sp.rack[3] > sp.rack[2] && sp.rack[2] <= 32, sp && sp.rack);
  ok('hall: rack stands on the floor, not in his walking spot', sp && sp.rack && sp.rack[1] + sp.rack[3] >= 228 && sp.rack[1] + sp.rack[3] <= 246 && sp.rack[0] + sp.rack[2] <= 66, sp && sp.rack);
  ok('hall: mirror is wider (≥ 28 px)', sp && sp.mirror && sp.mirror[2] >= 28, sp && sp.mirror);
  ok('hall: mirror does not touch the front door', sp && sp.mirror[0] + sp.mirror[2] <= sp.front[0], sp && [sp.mirror, sp.front]);
  ok('hall: two sconces', sp && sp.sconces && sp.sconces.length === 2, sp && sp.sconces);
  if (sp && sp.sconces && sp.sconces.length === 2) {
    const g = async (s) => { const p = await px([s[0] + 3, s[1] + 5, 4, 8]); const m = p.reduce((a, q) => [a[0] + q[0], a[1] + q[1], a[2] + q[2]], [0, 0, 0]).map((v) => v / p.length); return m.map(Math.round); };
    const g1 = await g(sp.sconces[0]), g2 = await g(sp.sconces[1]);
    ok('sconce 1 (over the mirror) stays warm', g1[0] - g1[2] > 40, g1);
    ok('sconce 2: soft white (not warm, not blue)', g2[0] - g2[2] < 30 && g2[2] - g2[0] < 12 && Math.min(...g2) > 185, g2);
    ok('sconces are the same lantern (same size)', sp.sconces[0][2] === sp.sconces[1][2] && sp.sconces[0][3] === sp.sconces[1][3]);
    ok('sconces flank the front door symmetrically', Math.abs((sp.sconces[0][0] + sp.sconces[1][0] + sp.sconces[1][2]) / 2 - (sp.front[0] + sp.front[2] / 2)) <= 1, [sp.sconces, sp.front]);
  }
  for (const art of ['carpet', 'painting']) { const o = await E((a) => { const G = __game, s = G.GAME.S; s.home.items.wallart = a; window.advanceTime(100); const r = G.ROOMS.spots('hall', s.home.items); s.home.items.wallart = null; return r; }, art);
    ok('hall: the ' + art + ' is gone (Round 10 #3) — nothing hangs over the new sconce', !o.wallart && o.sconces && o.sconces[1], { a: o.wallart }); }
  await shot('hall');
  // 3. bath: the cat rug is bigger and lies right in front of the sink
  await go('bath'); sp = await spots('bath');
  ok('bath: cat rug spot', sp && sp.catrug, sp);
  if (sp && sp.catrug) {
    const r = sp.catrug, v = sp.sink, cx = r[0] + r[2] / 2;
    ok('cat rug is bigger (≥ 44 × 24)', r[2] >= 44 && r[3] >= 24, r);
    ok('cat rug lies in front of the sink (centre under the vanity, just below it)', cx >= v[0] - 6 && cx <= v[0] + v[2] && r[1] >= v[1] + v[3] && r[1] <= v[1] + v[3] + 14, { r, v });
    ok('cat rug fits on screen', r[0] >= 0 && r[0] + r[2] <= 180, r);
  }
  await shot('bath');
  // 4. TVs: no TV at the start (round 4), then 5 real models (price grows), the picture grows, brand + size written on the TV
  const U = await E(() => __game.DATA.UPGRADES.tv.steps);
  ok('TV steps: none → hiper → tcl → digma → dexp → lg', JSON.stringify(U.map((s) => s.v)) === JSON.stringify(['none', ...TVS.map((t) => t[0])]), U.map((s) => s.v));
  for (const [v, re] of TVS) { const s = U.find((q) => q.v === v); ok('TV ' + v + ' is named ' + re, !!s && re.test(s.name), s); }
  ok('each next TV costs more', U.slice(2).every((s, i) => s.price > U[i + 1].price) && U[1].price > 0, U.map((s) => s.price));
  ok('levels never go down', U.slice(2).every((s, i) => s.lvl >= U[i + 1].lvl), U.map((s) => s.lvl));
  await go('zal'); const geo = [];
  for (const [v] of TVS) {
    const g2 = await E((v) => { const G = __game, s = G.GAME.S; s.home.items.tv = v; s.st.tvOn = false; window.advanceTime(150); return G.ROOMS.spots('zal', s.home.items); }, v);
    geo.push([v, g2.tv, g2.tvLabel]); await shot('tv_' + v);
    const t = g2.tv, L = g2.tvLabel;
    ok('TV ' + v + ': right of the monkey, on screen, under the ceiling', t && t[0] >= 112 && t[0] + t[2] <= 180 && t[1] >= 30, t);
    ok('TV ' + v + ': label rect inside the TV', L && L[0] >= t[0] && L[1] >= t[1] && L[0] + L[2] <= t[0] + t[2] && L[1] + L[3] <= t[1] + t[3], { t, L });
    if (L) { const p = await px(L); ok('TV ' + v + ': the brand is written (bright letters on the bezel; no inches — user)', p.filter((q) => Math.max(...q) >= 150).length >= 14 && p.filter((q) => Math.max(...q) < 70).length >= 10, p.length); geo[geo.length - 1].push(p.map((q) => (Math.max(...q) >= 150 ? 1 : 0)).join('')); }
  }
  ok('TV gets wider with every step', geo.every((g, i) => !i || g[1][2] > geo[i - 1][1][2]), geo.map((g) => [g[0], g[1] && g[1][2]]));
  ok('every TV has its own label', new Set(geo.map((g) => g[3])).size === TVS.length);
  await E(() => { __game.GAME.S.home.items.tv = 'none'; __game.GAME.S.st.tvOn = true; window.advanceTime(100); });
  // shop card: current and next model by name
  await E(() => { const s = __game.GAME.S; s.coins = 99999; s.lvl = 50; __game.UI.openShop('home'); }); await page.waitForTimeout(400);
  await E(() => { const b = document.querySelector('#sh-body [data-s="zal"]'); if (b) b.click(); }); await page.waitForTimeout(300);
  let card = await E(() => (document.querySelector('#sh-body [data-up="tv"]') || {}).innerText || '');
  ok('shop: TV card 0/5 offers Hiper 40″ IPS', /0\s*\/\s*5/.test(card) && /Hiper 40″ IPS/.test(card), card);
  await E(() => document.querySelector('#sh-body [data-up="tv"] [data-buy]').click()); await page.waitForTimeout(400);
  card = await E(() => (document.querySelector('#sh-body [data-up="tv"]') || {}).innerText || '');
  ok('after buying: card shows the Hiper and offers the TCL', /1\s*\/\s*5/.test(card) && /Hiper 40″/.test(card) && /TCL 43″ QLED/.test(card), card);
  await E(() => __game.UI.closeSheet()); await page.close();
  // 5. migration: old plasma → TCL, old big → Digma, a bought plasma (tv_plasma) → TCL
  for (const [tv, owned, want] of [['plasma', {}, 'tcl'], ['big', {}, 'digma'], ['crt', { tv_plasma: 1 }, 'tcl'], ['crt', {}, 'none']]) {
    const p = await open(12, { v: 2, name: 'Старичок', coins: 100, room: 'zal', lvl: 9, owned, home: { items: { tv, pc: 'old' } }, daily: { last: '2026-11-2', streak: 1, best: 1 }, last: Date.now() });
    const got = await p.evaluate(() => __game.GAME.S.home.items.tv); ok('old save tv ' + tv + (owned.tv_plasma ? ' + tv_plasma' : '') + ' → ' + want, got === want, got); await p.close();
  }
  ok('no page errors', errs.length === 0, errs.slice(0, 5));
  console.log(fails ? 'PROBE FAIL ' + fails : 'ALL PASS'); await browser.close(); process.exit(fails ? 1 : 0);
})();
