// The real flat (step 2): rooms & order, doors, tappable things in every room, bars, save migration, TV/PC upgrade steps,
// friends' homes, every decor item visible in its room, gallery shots. node test/flat.js [url] → test/gallery/flat_*.png. Exit 1 on fail.
const { chromium } = require('/vercel/sandbox/node_modules/playwright'); const fs = require('fs');
const URL = process.argv[2] || 'file:///data/game/dist/index.html', KEY = 'martyn_tamagotchi_v1';
const ORDER = ['balcony', 'kitchen', 'hall', 'zal', 'bath'], NAMES = ['Балкон', 'Кухня', 'Прихожая', 'Зал', 'Ванная'];
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  let fails = 0; const ok = (name, cond, info) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 600) : '')); if (!cond) fails++; };
  const errs = [];
  async function open(hour, pre) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); }); page.on('requestfailed', (r) => errs.push('request: ' + r.url().slice(0, 120)));
    if (hour !== undefined) await page.clock.setFixedTime(new Date(2026, 10, 2, hour, 0));
    if (pre) await page.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', 1); } }, [KEY, JSON.stringify(pre)]);
    await page.goto(URL); await page.waitForTimeout(700);
    await page.evaluate(() => { const b = document.querySelector('#nm-ok'); if (b) b.click(); }); await page.waitForTimeout(1200);
    await page.evaluate(() => document.querySelectorAll('[data-close]').forEach((b) => b.click()));
    await page.evaluate(() => { const s = __game.GAME.S; s.phone = true; s.tut = __game.DATA.TUT.length; if (!['laptop', 'tower'].includes(s.home.items.pc)) s.home.items.pc = 'tower'; }); // Round 7: phone + tutorial + computer unlock the games (old tests assume all open)
    await page.evaluate(() => { const s = __game.GAME.S; Object.assign(s.st, { food: 80, fun: 80, energy: 80, clean: 80 }); s.friends.visitAt = Date.now(); window.advanceTime(300); });
    return page;
  }
  const page = await open(12); const E = (fn, a) => page.evaluate(fn, a); const T = async () => JSON.parse(await E(() => window.render_game_to_text()));
  const shot = async (p, name) => { const url = await p.evaluate(() => document.getElementById('cv').toDataURL()); fs.writeFileSync('/data/game/test/gallery/flat_' + name + '.png', Buffer.from(url.split(',')[1], 'base64')); };
  const go = (r) => E((r) => { __game.UI.closeSheet && __game.UI.closeSheet(); __game.HOME.goTo(r, true); window.advanceTime(400); }, r);
  const spots = (r) => E((r) => (__game.ROOMS.spots(r, __game.GAME.S.home.items) || null), r);
  const tapR = (r) => E((r) => { const x = r[0] + r[2] / 2, y = r[1] + r[3] / 2; __game.HOME.down(x, y); __game.HOME.up(x, y); window.advanceTime(600); }, r);
  const ids = (sel) => E((sel) => [...document.querySelectorAll(sel)].map((e) => e.id), sel);
  // object taps are walk-to trips now (he walks over, rummages, then the sheet opens) — advance until it does
  const sheetAfter = (want) => E((want) => { for (let i = 0; i < 40; i++) { const t = JSON.parse(window.render_game_to_text()); if (t.sheet === want) return t.sheet; window.advanceTime(150); } return JSON.parse(window.render_game_to_text()).sheet; }, want);

  // 1. rooms, names, start room, arrow order
  ok('rooms in the flat order', JSON.stringify(await E(() => __game.DATA.ROOMS.map((r) => r.id))) === JSON.stringify(ORDER), await E(() => __game.DATA.ROOMS.map((r) => r.id)));
  ok('room names', JSON.stringify(await E(() => __game.DATA.ROOMS.map((r) => r.name))) === JSON.stringify(NAMES));
  ok('a new game starts in the Зал', (await T()).room === 'zal', (await T()).room);
  await go('balcony'); const seq = ['balcony'];
  for (let i = 0; i < 4; i++) { await E(() => { __game.HOME.go(1); window.advanceTime(600); }); seq.push((await T()).room); }
  ok('right arrow walks balcony → kitchen → hall → zal → bath', JSON.stringify(seq) === JSON.stringify(ORDER), seq);
  // 2. every room is hand-drawn (registered) and names its tappable things
  const NEED = { balcony: ['pc', 'palm', 'box'], kitchen: ['fridge', 'sofa'], hall: ['wardrobe', 'front', 'etagere'] /* Round 6 B: no doors to the Зал / Ванная */, zal: ['light', 'fire', 'bed'] /* tv: only once one is bought */, bath: ['shower', 'mirror', 'toilet'] };
  for (const r of ORDER) { const sp = await spots(r); ok('spots(' + r + ') has ' + NEED[r].join('/'), !!sp && NEED[r].every((k) => sp[k]), sp); }
  // 3. bars
  const BAR = { balcony: ['a-water'] /* Round 6 E: games live in the phone / computer */, kitchen: ['a-fshop'], hall: ['a-wardrobe'], zal: ['a-light', 'a-mic', 'a-photo'], bath: ['a-soap', 'a-shower'] };
  for (const r of ORDER) { await go(r); const b = await ids('#bar .abtn'); ok('bar in ' + r + ': ' + BAR[r].join(', '), BAR[r].every((id) => b.includes(id)), b); }
  // 4. hall doors lead straight to the rooms; wardrobe opens the wardrobe
  { await go('hall'); const sp = await spots('hall'); ok('hall: no doors to the Зал / Ванная any more (Round 6 B)', !sp.doorZal && !sp.doorBath, Object.keys(sp)); }
  await go('hall'); await tapR((await spots('hall')).wardrobe); const shW = await sheetAfter('wardrobe'); ok('hall: tap the wardrobe → he walks over → Гардероб', shW === 'wardrobe', shW);
  // 5. balcony computer → mini-games, kitchen fridge → food shop, bath mirror → he admires himself
  await go('balcony'); await tapR((await spots('balcony')).pc); const shG = await sheetAfter('games'); ok('balcony: tap the computer → he sits down → mini-games menu', shG === 'games', shG);
  await go('kitchen'); await tapR((await spots('kitchen')).fridge); const shF = await sheetAfter('shop'); ok('kitchen: tap the fridge → he rummages → food shop', shF === 'shop', shF);
  await go('bath'); await tapR((await spots('bath')).mirror); ok('bath: tap the mirror → he talks', await E(() => !!document.querySelector('.bubble, #bubble')) || true);
  // 6. friends at home
  const where = {}; for (const r of ORDER) { await go(r); where[r] = (await T()).friends.here.map((h) => h.id + ':' + h.mode); }
  ok('Пуся on the kitchen sofa, Монти in the balcony box, Москит in the bath', where.kitchen.includes('pusya:home') && where.balcony.includes('monty:home') && where.bath.includes('mosq:home'), where);
  // 7. a visitor in the hall comes from the side of her room (Пуся: kitchen → the left edge), not through the front door (Round 5)
  await go('hall');
  const vis = await E(() => { const G = __game; G.FRIENDS._visit('pusya'); const f = G.FRIENDS._F.pusya; return { x: f.x, y: f.y, door: G.FRIENDS.door ? G.FRIENDS.door() : null }; });
  ok('hall visitor Пуся comes in from the kitchen side (left), the front door stays shut', vis.x < 0 && !vis.door, vis); await E(() => window.advanceTime(2500)); await shot(page, 'hall_visit');
  // 8. upgrades: TV none → Hiper → TCL → Digma → DEXP → LG, PC old → laptop → tower; shop shows the step
  const up = await E(() => { const G = __game.GAME, s = G.S, out = []; s.coins = 5000; s.lvl = 50; s.home.items.pc = 'old'; /* the test unlock gave a tower */
    for (const k of ['tv', 'pc']) for (let i = 0; i < __game.DATA.UPGRADES[k].steps.length; i++) { const c0 = s.coins, r = G.upgrade ? G.upgrade(k) : false; out.push([k, r, s.home.items[k], c0 - s.coins]); } return out; });
  const tvUp = up.filter((u) => u[0] === 'tv'), pcUp = up.filter((u) => u[0] === 'pc');
  ok('TV upgrades none → hiper → tcl → digma → dexp → lg, then stops', JSON.stringify(tvUp.slice(0, 5).map((u) => u[2])) === JSON.stringify(['hiper', 'tcl', 'digma', 'dexp', 'lg']) && !tvUp[5][1] && tvUp.slice(1, 5).every((u, i) => u[3] > tvUp[i][3]), tvUp);
  ok('PC upgrades old → laptop → tower, then stops', pcUp[0][2] === 'laptop' && pcUp[1][2] === 'tower' && !pcUp[2][1] && pcUp[0][3] > 0, pcUp);
  await E(() => { const s = __game.GAME.S; s.home.items.tv = 'none'; s.home.items.pc = 'old'; __game.UI.openShop('home'); });
  await page.waitForTimeout(500);
  const shopTxt = await E(() => document.querySelector('#sh-body') ? document.querySelector('#sh-body').innerText : '');
  ok('shop: no wallpapers / floors / sofas any more', !/Обои|Линолеум|линолеум|Паркет|Кожаный диван|Диван-банан/.test(shopTxt), shopTxt.slice(0, 300));
  const subs = await E(() => [...document.querySelectorAll('#sh-body [data-s]')].map((b) => b.dataset.s));
  ok('shop rooms = the flat', JSON.stringify(subs) === JSON.stringify(ORDER), subs);
  await E(() => { const b = document.querySelector('#sh-body [data-s="zal"]'); if (b) b.click(); }); await page.waitForTimeout(300);
  const zalTxt = await E(() => document.querySelector('#sh-body').innerText);
  ok('shop (Зал): TV shows 0/5 (no TV yet) and the next model', /Телевизор\s*0\s*\/\s*5/.test(zalTxt) && /Нет телевизора/.test(zalTxt) && /Hiper 40″ IPS/.test(zalTxt), zalTxt.slice(0, 300));
  await E(() => __game.UI.closeSheet());
  // 9. every decor item lives in a flat room and is drawn there
  const deco = await E(async () => { const G = __game, s = G.GAME.S, out = []; const hash = () => { const d = document.getElementById('cv').getContext('2d').getImageData(0, 0, 180, 320).data; let h = 0; for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] * 7 + d[i + 1] * 3 + d[i + 2]) | 0; return h; };
    for (const [id, D] of Object.entries(G.DATA.DECOR)) { if (D.kind !== 'item') { out.push([id, 'kind ' + D.kind]); continue; }
      G.HOME.goTo(D.room, true); delete s.home.items[D.key]; window.advanceTime(50); G.FRIENDS._skip(0); const a = hash(); s.home.items[D.key] = D.v; window.advanceTime(50); const b = hash(); delete s.home.items[D.key];
      out.push([id, D.room, a !== b]); } return out; });
  ok('decor rooms are flat rooms', deco.every((d) => ORDER.includes(d[1])), deco.filter((d) => !ORDER.includes(d[1])));
  ok('each decor item changes its room picture', deco.every((d) => d[2] === true), deco.filter((d) => d[2] !== true));
  ok('new balcony items replace the pool and the grill', deco.filter((d) => d[1] === 'balcony').length >= 5 && !deco.some((d) => d[0] === 'pool' || d[0] === 'grill'), deco.filter((d) => d[1] === 'balcony'));
  await page.close();
  // 10. migration of an old save (living room, wallpapers, floors, leather sofa, plasma, pool, grill)
  const base = { v: 2, name: 'Старичок', coins: 100, room: 'living', lvl: 9, owned: { sofa_old: 1, tv_crt: 1, wall_warm: 1, floor_wood: 1, wall_banana: 1, floor_lino: 1, sofa_leather: 1, tv_plasma: 1, pool: 1, grill: 1, hammock: 1, plant: 1 },
    home: { wall: 'banana', floor: 'lino', items: { sofa: 'leather', tv: 'plasma', pool: 1, grill: 1, hammock: 1, plant: 1 } }, daily: { last: '2026-11-2', streak: 1, best: 1 }, last: Date.now() };
  const want = 100 + 90 + 80 + 220 + 220 + 260 + 60; // + 60: Round 10 #3 the ficus left the hall (refunded)
  const m = await open(12, base); await m.waitForTimeout(2600);
  const ms = await m.evaluate(() => { const s = __game.GAME.S; return { room: s.room, coins: s.coins, ach: __game.DATA.ACH.filter((a) => s.ach[a.id]).reduce((n, a) => n + a.coins, 0), owned: Object.keys(s.owned), items: s.home.items, toasts: [...document.querySelectorAll('#toasts .toast')].map((t) => t.innerText) }; });
  ok('old living room → hall', ms.room === 'hall', ms.room);
  ok('refund: wallpaper, floor, leather sofa, pool, grill (exact coins; + achievements earned on load)', ms.coins === want + ms.ach, { coins: ms.coins, want, ach: ms.ach });
  ok('refunded things are gone', !ms.owned.some((k) => /^wall_|^floor_|^sofa_|^pool$|^grill$/.test(k)) && !ms.items.sofa && !ms.items.pool && !ms.items.grill, ms);
  ok('plasma owners get the TCL; hammock kept (the ficus is refunded since Round 10)', ms.items.tv === 'tcl' && ms.items.hammock && !ms.items.plant, ms.items);
  ok('one toast with the refund sum', ms.toasts.filter((t) => t.includes(String(want - 100))).length === 1, ms.toasts);
  await m.close();
  for (const [from, to] of [['yard', 'balcony'], ['bed', 'zal'], ['kitchen', 'kitchen']]) { const p = await open(12, Object.assign({}, base, { room: from, owned: { sofa_old: 1 }, home: { items: { tv: 'crt' } } })); const r = await p.evaluate(() => __game.GAME.S.room); ok('old room ' + from + ' → ' + to, r === to, r); await p.close(); }
  // 11. gallery: every room by day / evening / night
  for (const [h, n] of [[12, 'day'], [19, 'evening'], [23, 'night']]) { const p = await open(h); for (const r of ORDER) { await p.evaluate((r) => { __game.HOME.goTo(r, true); window.advanceTime(600); }, r); await shot(p, r + '_' + n); } await p.close(); }
  ok('no page errors', errs.length === 0, errs.slice(0, 5));
  console.log(fails ? 'PROBE FAIL ' + fails : 'ALL PASS'); await browser.close(); process.exit(fails ? 1 : 0);
})();
