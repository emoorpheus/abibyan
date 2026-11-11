// Round 16 (plan R16): node test/r16.js [album,persist,moments,button,map,cap] → test/gallery/r16_*.png. Exit 1 on fail.
// The album: every photo goes into it, bright moments are photographed by themselves (first dance, a new growth stage, the first visit of
// each friend, the first «Все вместе», the first «Вылазка»); the zal «Фото» button opens the album page (take a photo / the grid / a big
// polaroid with «Сохранить»), and its tab «Приколы» is the map of the gags by room — found ones in colour with a name, the rest a dark «?».
const { boot, ok, done, PAGE_HELPERS } = require('./lib/h.js');
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const G = '/data/game/test/gallery/r16_';
(async () => {
  const { browser, page, errs } = await boot({ hour: 14 }); const E = (f, a) => page.evaluate(f, a);
  const setup = (o = {}) => E((o) => { const G = __game, s = G.GAME.S; if (G.ROUTINE) { G.ROUTINE.off = true; G.ROUTINE.poke(); G.ROUTINE._reset(); } G.HOME.stopTravel(); while (G.UI.hasModal()) G.UI.closeModal(); G.UI.closeSheet();
    s.grow.stage = o.stage === undefined ? 4 : o.stage; s.grow.seen = s.grow.stage; s.sleeping = false; s.light = true;
    Object.assign(s.st, { food: 90, fun: 50, energy: 90, clean: 90 }); s.want = null; s.nextWant = Date.now() + 9e8; s.friends.visitAt = Date.now() + 9e8; s.friends.partyAt = Date.now(); s.friends.heistAt = 0;
    G.FRIENDS._reset(); if (G.GAGS._reset) G.GAGS._reset(); if (G.ALBUM) G.ALBUM._reset(); s.moments = {}; G.HOME.goTo(o.room || 'zal', true); __adv(400); }, o);
  const A = () => E(() => (__game.ALBUM ? __game.ALBUM.list() : []).map((e) => ({ k: e.k, title: e.title, cap: e.cap, sub: e.sub, d: e.d, n: (e.src || '').length, png: /^data:image\/png/.test(e.src || '') })));
  const imgSize = (src) => E((src) => new Promise((r) => { const i = new Image(); i.onload = () => r([i.naturalWidth, i.naturalHeight]); i.onerror = () => r(null); i.src = src; }), src);

  // ---------- every photo goes into the album ----------
  if (want('album') || want('persist')) { try {
    await setup();
    const ph0 = await E(() => __game.GAME.S.stats.photos);
    await E(() => { __game.HOME.photo(); __adv(1200); }); await page.waitForFunction(() => document.querySelector('#modal img.photo'), null, { timeout: 5000 }).catch(() => { });
    const L = await A();
    ok('album: a photo lands in the album (k «photo», title, caption, date)', L.length === 1 && L[0].k === 'photo' && !!L[0].title && !!L[0].cap && L[0].d > 0 && /\d\d\.\d\d\.\d{4}/.test(L[0].sub || ''), L);
    const src = await E(() => __game.ALBUM.list()[0].src), sz = src ? await imgSize(src) : null;
    ok('album: it keeps the 150×150 snapshot of the room (PNG), small enough (< 60 KB)', !!sz && sz[0] === 150 && sz[1] === 150 && src.length < 60000, { sz, n: src && src.length });
    ok('album: «Фотограф» still counts the photo', (await E(() => __game.GAME.S.stats.photos)) === ph0 + 1);
    await E(() => { __game.GAME.save(true); });
    const st = await E(() => { const k = Object.keys(localStorage), main = localStorage.getItem('martyn_tamagotchi_v1') || '', alb = k.find((x) => /album/.test(x)); return { keys: k, mainImg: /data:image/.test(main), alb, albImg: !!alb && /data:image/.test(localStorage.getItem(alb)) }; });
    ok('album: the photos are stored under their own key — the main save stays small (no images in it)', !st.mainImg && st.albImg && st.alb === 'martyn_tamagotchi_v1_album', st);
    if (want('persist')) {
      await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(900); await E(() => document.querySelectorAll('[data-close]').forEach((b) => b.click())); await E(PAGE_HELPERS); await E(() => { window.__unlock(); window.__calm(); });
      const L2 = await A();
      ok('persist: the album survives a reload', L2.length === 1 && L2[0].k === 'photo' && L2[0].png, L2);
      await E(() => { __game.GAME.reset(); }); await page.waitForTimeout(200);
      const L3 = await A(), k3 = await E(() => localStorage.getItem('martyn_tamagotchi_v1_album'));
      ok('persist: «Начать заново» clears the album too', L3.length === 0 && (!k3 || k3 === '[]'), { n: L3.length, k3: k3 && k3.slice(0, 40) });
      await E(() => { window.__unlock(); window.__calm(); });
    }
  } catch (e) { ok('album: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- bright moments are photographed by themselves ----------
  if (want('moments')) { try {
    await setup();
    const ph0 = await E(() => __game.GAME.S.stats.photos);
    const d1 = await E(() => { const G = __game; window.__spy(); G.HOME.act('dance'); const toasts = []; for (let i = 0; i < 40; i++) { __adv(100); document.querySelectorAll('.toast').forEach((t) => { if (!toasts.includes(t.textContent)) toasts.push(t.textContent); }); }
      return { modal: G.UI.hasModal(), cam: G.AUDIO._calls.includes('camera'), toasts }; });
    let L = await A();
    ok('moments: the first dance → a photo «Первый танец» in the album by itself', L.some((e) => e.k === 'dance' && /Первый танец/.test(e.title)), L);
    ok('moments: …quietly: a shutter sound and a toast about the album, no window pops up', d1.cam && !d1.modal && d1.toasts.some((t) => /альбом/i.test(t)), d1);
    ok('moments: …and it does not count as «Фотограф» (only his own photos do)', (await E(() => __game.GAME.S.stats.photos)) === ph0);
    await E(() => { __game.HOME.act('dance'); __adv(4000); });
    L = await A(); ok('moments: a second dance — no second photo (once per moment)', L.filter((e) => e.k === 'dance').length === 1, L.map((e) => e.k));
    // a new growth stage (after the «подрос» card) — since Round 17 the group photo of the growth party («Праздник: …»)
    await E(() => { const G = __game, s = G.GAME.S; while (G.UI.hasModal()) G.UI.closeModal(); s.grow.stage = 5; s.grow.seen = 4; __adv(1200); const b = document.querySelector('#modal [data-close]'); if (b) b.click();
      for (let t = 0; t < 80000 && !G.ALBUM.list().some((e) => e.k === 'grow:5'); t += 100) { __adv(100); if (G.UI.hasModal()) G.UI.closeModal(); } for (let t = 0; t < 30000 && G.FRIENDS.info().party; t += 100) { __adv(100); if (G.UI.hasModal()) G.UI.closeModal(); } });
    L = await A(); const age5 = await E(() => __game.DATA.AGES[5].name);
    ok('moments: a new growth stage → the growth party photo «Праздник: …»', L.some((e) => e.k === 'grow:5' && e.title.includes(age5)), { L: L.map((e) => e.k + ' ' + e.title), age5 });
    // the first visit of a friend
    await E(() => { const G = __game; while (G.UI.hasModal()) G.UI.closeModal(); G.FRIENDS._reset(); G.HOME.goTo('zal', true); __adv(300); G.FRIENDS._visit('pusya'); __adv(9000); });
    L = await A(); ok('moments: the first visit of Пуся → «Пуся в гостях» photo', L.some((e) => e.k === 'friend:pusya' && /Пуся/.test(e.title)), L.map((e) => e.k + ' ' + e.title));
    // the first «Вылазка»
    await setup({ room: 'hall' }); await E(() => { const G = __game; G.FRIENDS.heist('card'); for (let i = 0; i < 900 && G.FRIENDS.info().heist; i++) __adv(100); __adv(1500); });
    L = await A(); ok('moments: the first successful «Вылазка» with Жучок → a photo', L.some((e) => e.k === 'heist' && /вылазк/i.test(e.title)), L.map((e) => e.k + ' ' + e.title));
    // «Все вместе» photo
    await setup(); await E(() => { const G = __game; G.FRIENDS._party({ kind: 'photo' }); for (let i = 0; i < 600 && !G.UI.hasModal(); i++) __adv(100); __adv(600); });
    L = await A(); ok('moments: the «Все вместе» group photo is in the album too', L.some((e) => e.k === 'party' && /Все вместе/.test(e.title)), L.map((e) => e.k + ' ' + e.title));
  } catch (e) { ok('moments: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- the «Фото» button → the album page ----------
  if (want('button')) { try {
    await setup();
    await E(() => { const AL = __game.ALBUM, s = __game.GAME.S; for (const [k, t] of [['dance', 'Первый танец'], ['grow:3', 'Новый этап: Малыш'], ['friend:zhuk', 'Жучок в гостях']]) { AL.snap(k, { title: t }); __adv(300); } __adv(300); while (__game.UI.hasModal()) __game.UI.closeModal(); });
    const n0 = (await A()).length;
    await E(() => { document.getElementById('a-photo').click(); __adv(200); });
    const b = await E(() => { const U = __game.UI, sh = document.getElementById('sheet') || document.querySelector('.sheet.open'); return { kind: U.sheetKind, tabs: [...document.querySelectorAll('.tabs .tab')].map((t) => t.textContent.trim()), shot: !!document.getElementById('alb-shot'), ph: document.querySelectorAll('#sh-body .alb .ph').length, cap: [...document.querySelectorAll('#sh-body .alb .ph .pt')].map((x) => x.textContent) }; });
    ok('button: the zal «Фото» opens the album page (tabs «Фото» and «Приколы»)', b.kind === 'album' && b.tabs.join('|') === 'Фото|Приколы', b);
    ok('button: …with «Сделать фото» and a polaroid per photo (newest first)', b.shot && b.ph === n0 && n0 >= 3 && b.cap[0] === 'Жучок в гостях', b);
    await page.waitForTimeout(300); await page.screenshot({ path: G + 'album.png' });
    await E(() => { document.querySelector('#sh-body .alb .ph').click(); }); await page.waitForTimeout(600);
    const big = await E(() => { const im = document.querySelector('#modal img.photo'); return { img: !!im, w: im ? im.naturalWidth : 0, save: !!document.querySelector('#modal [data-save]'), h: (document.querySelector('#modal h2') || {}).textContent }; });
    ok('button: a tap on a polaroid → the big photo (framed, with the caption) and «Сохранить»', big.img && big.w > 400 && big.save && big.h === 'Жучок в гостях', big);
    await page.screenshot({ path: G + 'big.png' });
    await E(() => { while (__game.UI.hasModal()) __game.UI.closeModal(); document.getElementById('alb-shot').click(); __adv(1500); }); await page.waitForFunction(() => document.querySelector('#modal img.photo'), null, { timeout: 5000 }).catch(() => { });
    const c = await E(() => ({ sheet: __game.UI.sheetOpen, modal: !!document.querySelector('#modal img.photo'), n: __game.ALBUM.list().length }));
    ok('button: «Сделать фото» closes the page and takes a photo (the polaroid shows, the album grows)', !c.sheet && c.modal && c.n === n0 + 1, c);
  } catch (e) { ok('button: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- «Приколы»: the map of the gags by room ----------
  if (want('map')) { try {
    await setup({ room: 'hall' });
    await E(() => { const G = __game, g = G.GAME.S.gags; g.seen = {}; g.where = {}; const sp = G.ROOMS.spots('hall', G.GAME.S.home.items), r = sp.front; const h = G.GAGS.hit('hall', r[0] + r[2] / 2, r[1] + r[3] / 2, true); if (h) h.fn(); __adv(2500);
      G.HOME.goTo('zal', true); __adv(300); const w = G.ROOMS.spots('zal', G.GAME.S.home.items).window; const h2 = w && G.GAGS.hit('zal', w[0] + w[2] / 2, w[1] + w[3] / 2); if (h2) h2.fn(); __adv(3000); });
    await E(() => { __game.UI.openAlbum('gags'); __adv(200); }); await page.waitForTimeout(400);
    const m = await E(() => { const M = __game.GAGS.map(); let tot = 0; for (const r in M) tot += M[r].length; const cells = [...document.querySelectorAll('#sh-body .gm')];
      return { tot, rooms: document.querySelectorAll('#sh-body .gm-room').length, cells: cells.length, on: cells.filter((c) => c.classList.contains('on')).map((c) => c.dataset.g + '=' + c.textContent.trim()), q: cells.filter((c) => !c.classList.contains('on') && c.textContent.trim() === '?').length,
        hint: (document.querySelector('#sh-body .hint') || {}).textContent, tab: __game.UI.sheetTab }; });
    ok('map: «Приколы» lists every gag of the flat by room (5 rooms, ≥ 40 places)', m.tab === 'gags' && m.rooms === 5 && m.cells === m.tot && m.tot >= 40, m);
    ok('map: found ones show their name (the bell in the hall, the zal window)', m.on.some((x) => /^hall:bell=.*Звон/.test(x)) && m.on.some((x) => /^zal:window=/.test(x)), m.on);
    ok('map: …the window is counted per room (the balcony one is still «?»), the rest are «?»', !m.on.some((x) => /^balcony:window/.test(x)) && m.q === m.cells - m.on.length, m);
    ok('map: «Найдено N из M»', new RegExp('Найдено ' + m.on.length + ' из ' + m.tot).test(m.hint || ''), m.hint);
    const px = await E(() => Promise.all(['hall:bell', 'hall:rack'].map((k) => new Promise((r) => { const im = document.querySelector(`#sh-body .gm[data-g="${k}"] img`); if (!im) return r(-1); const go = () => { const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += (d[i] + d[i + 1] + d[i + 2]) / 3; r(Math.round(s / (d.length / 4))); }; if (im.complete) go(); else im.onload = go; }))));
    ok('map: a found place is a colour picture of the spot, an unknown one a dark silhouette', px[0] > 60 && px[1] >= 0 && px[1] < px[0] * 0.6, px);
    await page.screenshot({ path: G + 'map.png' });
    const go = await E(() => { const c = document.querySelector('#sh-body .gm[data-g="hall:bell"]'); c.click(); __adv(800); return { sheet: __game.UI.sheetOpen, room: __game.HOME.room }; });
    ok('map: a tap on a found one takes him to that room', !go.sheet && go.room === 'hall', go);
  } catch (e) { ok('map: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- the album keeps the moments when it is full ----------
  if (want('cap')) { try {
    await setup();
    const r = await E(() => { const AL = __game.ALBUM, px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      AL.add({ k: 'dance', title: 'Первый танец', cap: 'x', sub: 'y', d: 1, src: px }); for (let i = 0; i < 45; i++) AL.add({ k: 'photo', title: 'Фото ' + i, cap: 'x', sub: 'y', d: 2 + i, src: px });
      const L = AL.list(); return { n: L.length, max: AL.MAX, dance: L.some((e) => e.k === 'dance'), last: L[L.length - 1].title }; });
    ok('cap: the album holds at most ' + 36 + ' photos, dropping the oldest plain ones first — the moments stay', r.n === r.max && r.max === 36 && r.dance && r.last === 'Фото 44', r);
  } catch (e) { ok('cap: crashed — ' + String(e.message).split('\n')[0], false); } }

  await done(errs, browser);
})();
