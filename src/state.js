'use strict';
// ===== Persistent game state & rules =====
const GAME = (() => {
  const TEST = typeof window !== 'undefined' && window.ABI_TEST ? window.ABI_TEST : null; // Round 14b: the test build (dist/abibyan-test.html)
  const KEY = TEST ? (TEST.key || 'martyn_tamagotchi_test_v1') : 'martyn_tamagotchi_v1';
  if (TEST && typeof window !== 'undefined' && window.addEventListener) window.addEventListener('hashchange', () => { if (/(^|[#&])fresh\b/.test(location.hash)) location.reload(); }); // Round 23: «#fresh» typed into an open test build
  // a friend: chats, duel wins/losses, special cooldown (ms timestamp); friendship points/level, mood (60 = calm; drifts back), discovered tastes, today's whim, chats today, treats in the last minutes
  const FDEF = () => ({ chat: 0, w: 0, l: 0, cd: 0, fp: 0, lv: 0, md: 60, mdAt: 0, known: {}, crave: null, cday: '', cn: 0, eat: [], gday: '', gn: 0 });
  const DEF = () => ({
    v: 8, name: 'Абибян', created: Date.now(), last: Date.now(), named: false, season: null /* Round 10 #8: { id, day } of the seasonal event going on */,
    coins: 60, xp: 0, lvl: 1, totalCoins: 0,
    st: { food: 70, fun: 75, energy: 85, clean: 80 }, kg: 1.28,
    inv: { milk: 3, puree: 1, banana: 2 }, tried: {},
    owned: {}, ownedC: {},
    wear: { hat: null, glasses: null, top: null, bottom: null, neck: null, feet: null },
    home: { items: { tv: 'none', pc: 'none' } }, phone: false, // Round 6 E: no computer at the start; the phone is bought in the tutorial
    room: 'zal', light: true, sleeping: false,
    best: { catch: 0, vine: 0, balloon: 0, bongo: 0, gym: 0, stack: 0 },
    stats: { fed: 0, washed: 0, slept: 0, games: 0, bananas: 0, harvested: 0, petted: 0, mic: 0, photos: 0, boughtClothes: 0, boughtDecor: 0, maxKg: 1.28, wants: 0, levels: 0, tickled: 0, gameCoins: 0, watered: 0, tasks: 0 },
    // growth: care points (pts), stage index in DATA.AGES, care today (capped), days with 30+ care
    grow: { pts: 0, stage: 0, seen: 0, day: '', today: 0, src: {}, capped: 0, days: 0, born: Date.now(), party: 0 }, // party: Round 17 — the growth party still to come (stage)
    tasks: { day: '', list: [], base: {}, bonus: 0 },
    ach: {}, daily: { last: '', streak: 0, best: 0 }, tree: { n: 2, t: Date.now(), water: 0 },
    want: null, nextWant: Date.now() + 90e3, settings: { sfx: true, music: true, screenMode: 'stretch' }, hint: { ios: 0 }, tut: 0,
    // friends: chats, duel wins/losses, special cooldown (ms timestamp); visitAt = last visit start
    friends: { pusya: FDEF(), monty: FDEF(), mosq: FDEF(), zhuk: FDEF(), visitAt: 0, partyAt: 0, partyDay: '' },
    // Round 5 D: once-a-day gags (day strings): the coin in the sofa, the parcel at the door, the first (burnt) pancake, the desk stash
    gags: { sofa: '', parcel: '', blin: '', desk: '', seen: {}, where: {} },
    // Round 16: the album moments already photographed (the photos themselves live under KEY + '_album', album.js)
    moments: {},
    tour: null, // Round 18: the weekly tournament (tour.js)
    // Round 22: the birthday present — gift: the day the box was opened, start: day 0 of «24 секрета», party/gifts: {year: day done},
    // found: {secret n: ms}, seen: the secrets hint said, more: the last day «new hearts» was told
    dasha: { gift: '', start: '', party: {}, gifts: {}, found: {}, seen: 0, more: '' },
  });
  let S = DEF(); let storageOK = true; const listeners = [];
  function deepMerge(base, o) { for (const k in o) { if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) && base[k] && typeof base[k] === 'object') deepMerge(base[k], o[k]); else base[k] = o[k]; } return base; }
  // v1 saves (adult «Мартын») start the new growth path as a baby; coins, items and achievements stay
  function migrate() {
    const v0 = S.v || 1; // the version the save came with (the steps below bump S.v)
    if ((S.v || 1) < 2) { if (S.name === 'Мартын') S.name = 'Абибян'; S.stats.maxKgA = S.stats.maxKg; S.kg = Math.max(DATA.KG0 * DATA.AGES[0].kg, S.kg * DATA.AGES[0].kg); S.inv.milk = (S.inv.milk || 0) + 3; S.grow.born = Date.now(); S.v = 3; }
    // v2 had 5 stages (baby, kid, teen, adult, legend); now 7 with a tiny newborn first: the old baby restarts as «Кроха», the others keep their stage; weight follows the new size
    const V4 = DATA.AGES_V4, v4 = (id) => V4.findIndex((a) => a.id === id);
    if (S.v === 2) { const OLD = [['newborn', 0.32], ['kid', 0.55], ['teen', 0.78], ['adult', 1], ['legend', 1]], G = S.grow, o = OLD[Math.max(0, Math.min(4, G.stage | 0))], n = v4(o[0]);
      S.kg *= V4[n].kg / o[1]; G.stage = n; G.seen = G.seen >= 0 ? v4(OLD[Math.max(0, Math.min(4, G.seen | 0))][0]) : n; if (G.seen > n) G.seen = n; S.v = 3; }
    // v3 → v4 (Round 6 E / Round 7): the computer they had stays (as the old one); the phone must be bought — the tutorial starts at that step
    if (S.v === 3) { const it = S.home.items; if (!it.pc || it.pc === 'none') it.pc = 'old'; S.phone = false; S.tut = TUT_AT('phone'); S.best.stack = S.best.stack || 0; S.v = 4; }
    // v4 → v5 (Round 8): 10 smaller stages — the stage is kept by its id, the weight follows the new size factor
    if (S.v === 4) { const G = S.grow, cl = (i) => Math.max(0, Math.min(V4.length - 1, i | 0)), o = V4[cl(G.stage)], n = DATA.AGE[o.id];
      S.kg *= DATA.AGES[n].kg / o.kg; G.stage = n; G.seen = G.seen >= 0 ? Math.min(n, DATA.AGE[V4[cl(G.seen)].id]) : n; S.v = 5; }
    if (!(S.grow.stage >= 0 && S.grow.stage < DATA.AGES.length)) S.grow.stage = 0;
    if (!(S.tut >= 0)) S.tut = 0;
    // the teddy bear left the bed (big carrot & pepper pillows live there now): refund it
    if (S.owned.teddy) { delete S.owned.teddy; S.coins += 90; refund += 90; }
    if (S.home.items.teddy) delete S.home.items.teddy;
    // the polka-dot kettle decor is gone: the kitchen has the real glass Polaris now (always there, it boils) → refund it
    // (only for saves from before v6 — since Round 9 #2 the kettle is bought again, and a bought one must survive every reload)
    if (v0 < 6) { if (S.owned.kettle) { delete S.owned.kettle; S.coins += 60; refund += 60; kettleRefund += 60; } delete S.home.items.kettle; }
    // Round 8 #2: the bought round rug is gone — the crochet mandala always lies in the zal now → refund it
    if (S.owned.rug) { delete S.owned.rug; S.coins += 80; refund += 80; rugRefund += 80; }
    delete S.home.items.rug;
    // v5 → v6 (Round 9 #2): the kettle, microwave, candles, guitar, vacuum, washer and the etagere's things are bought now — old saves keep them all
    if (S.v === 5) { ownAll(); S.v = 6; shopGift = true; }
    // v6 → v7 (Round 10 #3): the «Банан Лиза» painting, the wall carpet and the ficus left the hall and the shop → refund them
    if (v0 < 7) { for (const [id, c] of Object.entries(HALL10)) if (S.owned[id]) { delete S.owned[id]; S.coins += c; refund += c; hallRefund += c; } delete S.home.items.wallart; delete S.home.items.plant; }
    if (S.v === 6) S.v = 7;
    // v7 → v8 (Round 13): the tutorial got a tour after the phone — a save that had finished the old 4 steps is done, no tour
    if (S.v === 7) { if (S.tut >= 4) S.tut = DATA.TUT.length; S.v = 8; }
    if (!S.settings) S.settings = { sfx: true, music: true, screenMode: 'stretch' };
    if (!S.settings.screenMode) S.settings.screenMode = 'stretch';
    flat();
  }
  const HALL10 = { art_painting: 70, art_carpet: 160, plant: 60 };
  function ownAll() { const it = S.home.items; for (const id of DATA.BOUGHT9) { const D = DATA.DECOR[id]; S.owned[id] = 1; it[D.key] = D.v; } }
  // the house became the real flat: new room ids; wallpapers, floors, sofas, pool and grill are refunded; plasma owners get the TCL
  const ROOM_OF = { living: 'hall', yard: 'balcony', bed: 'zal' }, GONE = ['sofa', 'pool', 'grill'];
  const TV_OF = { plasma: 'tcl', big: 'digma', crt: 'none' }; // the 3-step TVs became 5 real models; the start has no TV at all (the old CRT is gone)
  const REFUND = { wall_banana: 90, wall_hearts: 100, wall_plaid: 110, wall_jungle: 120, wall_sovok: 150, wall_space: 180, floor_lino: 80, floor_checker: 90, floor_parquet: 100, floor_carpet: 120, sofa_leather: 220, sofa_banana: 300, pool: 220, grill: 260 };
  function flat() {
    const it = S.home.items; if (TV_OF[it.tv]) it.tv = TV_OF[it.tv]; S.room = ROOM_OF[S.room] || S.room; if (!DATA.ROOMS.some((r) => r.id === S.room)) S.room = 'zal';
    for (const id of Object.keys(S.owned)) { if (DATA.DECOR[id]) continue; if (id === 'tv_plasma' && !UP_STEP('tv', it.tv)) it.tv = 'tcl'; const c = REFUND[id] || 0; S.coins += c; refund += c; if (c) flatRefund += c; delete S.owned[id]; }
    for (const k of GONE) delete it[k]; delete S.home.wall; delete S.home.floor;
    for (const k in DATA.UPGRADES) if (UP_STEP(k, it[k]) < 0) it[k] = DATA.UPGRADES[k].steps[0].v;
  }
  // ---- Round 6 E / Round 7 #4: phone, computers, the tutorial; every game is locked until the tutorial is done AND the phone is bought ----
  const TUT_AT = (id) => Math.max(0, DATA.TUT.findIndex((q) => q.id === id));
  const hasPhone = () => !!S.phone, tutDone = () => S.tut >= DATA.TUT.length, gamesOpen = () => hasPhone() && S.tut > TUT_AT('play'); // Round 13: the games open after the phone step, the tour does not lock them
  const devLvl = () => Math.max(0, DATA.DEVS.indexOf(S.home.items.pc)); // the best computer: 0 = none (only the phone), 1 old, 2 laptop, 3 tower
  const gameDev = (gid) => { const g = DATA.GAMES.find((x) => x.id === gid); return g ? g.dev || 'phone' : 'phone'; };
  const devOK = (gid) => { const d = gameDev(gid); if (DATA.CONSOLES.includes(d)) return placed(d) && hasUp('tv'); /* Round 7 #6: a console game needs its console and the TV */ return d === 'phone' ? hasPhone() : devLvl() >= DATA.DEVS.indexOf(d); };
  const canPlay = (gid) => { const g = DATA.GAMES.find((x) => x.id === gid); return !!g && gamesOpen() && devOK(gid) && ageOK(g); };
  function buyPhone() { if (S.phone || S.coins < DATA.PHONE.price) return false; S.phone = true; spend(DATA.PHONE.price); /* phone first: spend → refresh → TUT.check must not see «no phone, short of coins» and gift */ S.stats.boughtDecor++; addXP(5); emit('home'); save(true); checkAch(); return true; }
  function tutSet(i) { S.tut = Math.max(0, Math.min(DATA.TUT.length, i)); save(true); }
  const UP_STEP = (k, v) => DATA.UPGRADES[k].steps.findIndex((s) => s.v === v);
  function upgradeInfo(k) { const U = DATA.UPGRADES[k], i = Math.max(0, UP_STEP(k, S.home.items[k])); return { U, i, n: U.steps.length, cur: U.steps[i], next: U.steps[i + 1] || null }; }
  const hasUp = (k) => !upgradeInfo(k).cur.none; // false while the upgrade is still at its «nothing yet» step (no TV)
  function upgrade(k) { const u = upgradeInfo(k), nx = u.next; if (!nx || S.lvl < nx.lvl || !spend(nx.price)) return false; S.home.items[k] = nx.v; S.stats.boughtDecor++; addXP(5); emit('home'); save(); checkAch(); return true; }
  let refund = 0, flatRefund = 0, kettleRefund = 0, rugRefund = 0, hallRefund = 0, shopGift = false; const takeRefund = () => { const r = { sum: refund, flat: flatRefund, kettle: kettleRefund, rug: rugRefund, hall: hallRefund, shop: shopGift }; refund = 0; flatRefund = 0; kettleRefund = 0; rugRefund = 0; hallRefund = 0; shopGift = false; return r; };
  // saved dictionaries replace the defaults (otherwise eaten starter food would come back on reload)
  function fromSave(o) { S = deepMerge(DEF(), o); if (o.inv) S.inv = Object.assign({}, o.inv); if (o.home && o.home.items) S.home.items = Object.assign({}, o.home.items); S.v = o.v || 1; }
  function load() {
    // Round 23: «abibyan-test.html#fresh» — the test build starts over (the gift box, her party again); the real save is never touched
    if (TEST && typeof location !== 'undefined' && /(^|[#&])fresh\b/.test(location.hash)) { try { localStorage.removeItem(KEY); localStorage.removeItem(KEY + '_album'); } catch (e) { } try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { } }
    if (TEST && TEST.resetToken) {
      try {
        const tokKey = (TEST.key && TEST.key !== 'martyn_tamagotchi_test_v1') ? ('abi_test_token_' + TEST.key) : 'abi_test_token';
        if (localStorage.getItem(tokKey) !== TEST.resetToken) {
          localStorage.removeItem(KEY); localStorage.removeItem(KEY + '_album');
          localStorage.setItem(tokKey, TEST.resetToken);
        }
      } catch (e) { }
    }
    try { const raw = localStorage.getItem(KEY); if (raw) fromSave(JSON.parse(raw)); } catch (e) { storageOK = false; }
    migrate(); tasksRoll(); if (TEST && TEST.coins && !(S.coins >= TEST.coins)) S.coins = TEST.coins; if (TEST && TEST.top) testTop(); return S;
  }
  // Round 15b #1: the test build — the top level any shop item asks for and the last growth stage («Легенда»), so everything is unlocked
  function testTop() {
    let mx = 1; const walk = (o, d) => { if (!o || typeof o !== 'object' || d > 4) return; for (const k in o) { if (k === 'lvl' && typeof o[k] === 'number') mx = Math.max(mx, o[k]); else walk(o[k], d + 1); } };
    walk([DATA.FOODS, DATA.CLOTHES, DATA.DECOR, DATA.UPGRADES, DATA.GAMES], 0); if (!(S.lvl >= mx)) { S.lvl = mx; S.xp = 0; }
    const G = S.grow, last = DATA.AGES.length - 1, A = DATA.AGES[last]; if (G.stage < last) { const k0 = (DATA.AGES[G.stage] || DATA.AGES[0]).kg; G.stage = last; G.seen = last; S.kg *= A.kg / k0; }
    G.pts = Math.max(G.pts || 0, A.pts); G.days = Math.max(G.days || 0, A.days);
  }
  let saveT = 0; function save(force) { const n = Date.now(); if (!force && n - saveT < 1500) return; saveT = n; S.last = n; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { storageOK = false; } }
  // portable save code (to move progress between devices / from the file to the website)
  const b64e = (str) => { const b = new TextEncoder().encode(str); let r = ''; for (let i = 0; i < b.length; i += 0x8000) r += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(r); };
  const b64d = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
  function exportCode() { save(true); return 'ABIBYAN1:' + b64e(JSON.stringify(S)); }
  function importCode(code) {
    const m = String(code || '').replace(/\s+/g, '').match(/^(?:ABIBYAN1|MARTYN1):([A-Za-z0-9+/=]+)$/); if (!m) return false;
    let o; try { o = JSON.parse(b64d(m[1])); } catch (e) { return false; }
    if (!o || typeof o !== 'object' || typeof o.coins !== 'number' || !o.st || typeof o.kg !== 'number') return false;
    fromSave(o); migrate(); tasksRoll(); S.last = Date.now(); saveT = 0; save(true); return storageOK;
  }
  function reset() { S = DEF(); try { localStorage.removeItem(KEY); localStorage.removeItem(KEY + '_album'); } catch (e) { } save(true); emit('reset'); }
  const on = (fn) => listeners.push(fn); function emit(ev, a) { for (const fn of listeners) try { fn(ev, a); } catch (e) { console.error(e); } }
  const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
  // decay per hour while awake (energy decay increased to 18 per hour)
  const RATE = { food: 20, fun: 16, energy: 18, clean: 11 };
  function simulate(dtSec, offline) {
    const h = dtSec / 3600;
    for (const k in RATE) {
      let r = RATE[k]; if (k === 'energy' && S.sleeping) r = offline ? -26 : 0; if (k === 'fun' && S.sleeping) r *= 0.3; if (k === 'food' && S.sleeping) r *= 0.5;
      let v = S.st[k] - r * h; if (offline) v = Math.max(Math.min(S.st[k], 12), v); S.st[k] = clamp(v);
    }
    // slow natural weight loss
    S.kg = Math.max(DATA.KG0 * kgK(), S.kg - 0.05 * kgK() * h * (S.st.food < 40 ? 2 : 1));
    // tree growth: depends on treeStage (max 1..5)
    const maxN = treeMax();
    const per = (Date.now() < S.tree.water ? 12 : 25) * 60e3; while (S.tree.n < maxN && Date.now() - S.tree.t > per) { S.tree.n++; S.tree.t += per; } if (S.tree.n >= maxN) S.tree.t = Date.now();
  }
  function catchUp() {
    const dt = Math.min(7 * 86400, Math.max(0, (Date.now() - S.last) / 1000)); if (dt > 5) simulate(dt, true);
    if (S.sleeping && dt > 30) { S.stats.slept += Math.min(dt, 12 * 3600); care(Math.min(15, dt / 60), 'sleep'); }
    return dt;
  }
  // ---- economy ----
  function addCoins(n, why) { if (n <= 0) return; S.coins += n; S.totalCoins += n; emit('coins', { n, why }); checkAch(); save(); }
  function spend(n) { if (S.coins < n) return false; S.coins -= n; emit('coins', { n: -n }); save(); return true; }
  function addXP(n) { S.xp += n; let up = false; while (S.xp >= DATA.xpNeed(S.lvl)) { S.xp -= DATA.xpNeed(S.lvl); S.lvl++; up = true; S.coins += 10; S.totalCoins += 10; } if (up) emit('levelup', S.lvl); emit('xp'); save(); }
  function stat(k, d) { S.st[k] = clamp(S.st[k] + d); emit('stat', k); }
  const ageDef = () => DATA.AGES[S.grow.stage] || DATA.AGES[0], little = () => (S.grow.stage | 0) < DATA.AGE.teen, kgK = () => ageDef().kg, adult = () => S.grow.stage >= DATA.AGE.adult;
  const form = () => DATA.stage(S.kg, kgK()), isSkuf = () => fat() >= DATA.SKUF, skufKg = () => DATA.skufKg(kgK());
  function setKg(kg) { const k = kgK(); const before = form().name; S.kg = Math.max(DATA.KG0 * k, Math.min((DATA.KG1 + 4) * k, kg)); S.stats.maxKg = Math.max(S.stats.maxKg, S.kg); if (adult()) S.stats.maxKgA = Math.max(S.stats.maxKgA || 0, S.kg); const after = form().name; if (before !== after) emit('stage', { before, after, up: fat() > 0 }); checkAch(); }
  function fat() { return DATA.fat(S.kg, kgK()); }
  // ---- growth from care (capped per day so it takes many days) ----
  const dayStr = (d) => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  function dayRoll() { const d = dayStr(new Date()), G = S.grow; if (G.day !== d) { G.day = d; G.today = 0; G.src = {}; G.capped = 0; } }
  function care(n, src) {
    if (!(n > 0)) return 0; dayRoll(); const G = S.grow, cap = DATA.GROW.caps[src];
    if (cap !== undefined) { const used = G.src[src] || 0; n = Math.min(n, cap - used); if (n <= 0) return 0; G.src[src] = used + n; }
    n = Math.min(n, DATA.GROW.cap - G.today); if (n <= 0) { if (!G.capped) { G.capped = 1; emit('careCap'); } return 0; }
    const before = G.today; G.today += n; G.pts += n;
    if (before < DATA.GROW.dayMin && G.today >= DATA.GROW.dayMin) { G.days++; emit('careDay', G.days); }
    emit('care', n); checkGrow(); return n;
  }
  function nextAge() { return DATA.AGES[S.grow.stage + 1] || null; }
  function checkGrow() {
    const G = S.grow, nx = nextAge(); if (!nx || G.pts < nx.pts || G.days < nx.days) return false;
    const k0 = kgK(); G.stage++; S.kg *= kgK() / k0; G.grownAt = Date.now(); S.coins += 25; S.totalCoins += 25; addXP(10); checkAch(); save(true); emit('grow', G.stage); return true;
  }
  // ---- daily tasks ----
  function tasksRoll() {
    const d = dayStr(new Date()), T = S.tasks; if (T.day === d && T.list.length) return T;
    T.day = d; T.bonus = 0; T.base = {}; for (const t of DATA.TASKS) T.base[t.k] = S.stats[t.k] || 0;
    let seed = 7; for (const ch of d + ':' + S.created) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0;
    const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const careT = DATA.TASKS.filter((t) => t.care), rest = DATA.TASKS.filter((t) => !t.care);
    const take = (arr) => arr.splice(Math.floor(rnd() * arr.length), 1)[0];
    T.list = [take(careT), take(rest), take(rest)].map((t) => ({ id: t.id, done: 0 }));
    return T;
  }
  function taskProg(t) { const D = DATA.TASK[t.id]; return D ? Math.min(D.n, Math.max(0, (S.stats[D.k] || 0) - (S.tasks.base[D.k] || 0))) : 0; }
  function taskReady(t) { const D = DATA.TASK[t.id]; return !!D && !t.done && taskProg(t) >= D.n; }
  function tasksReady() { const T = tasksRoll(); return T.list.filter(taskReady).length + (!T.bonus && T.list.length && T.list.every((t) => t.done) ? 1 : 0); }
  function claimTask(i) {
    const T = tasksRoll(), t = T.list[i]; if (!t || !taskReady(t)) return null; const D = DATA.TASK[t.id];
    t.done = 1; S.stats.tasks = (S.stats.tasks || 0) + 1; addCoins(D.coins, 'task'); addXP(5); care(10, 'task'); checkAch(); save(true); return D;
  }
  function claimBonus() {
    const T = tasksRoll(); if (T.bonus || !T.list.length || !T.list.every((t) => t.done)) return null; T.bonus = 1;
    const pool = DATA.FOOD_ORDER.filter((id) => { const F = DATA.FOODS[id]; return !F.nonfood && !F.special && (F.age || 0) <= S.grow.stage && F.price >= 5; });
    const food = pool[Math.floor(Math.random() * pool.length)] || 'banana'; S.inv[food] = (S.inv[food] || 0) + 1;
    addCoins(30, 'task'); care(15, 'task'); save(true); return { coins: 30, food };
  }
  function eat(id) {
    const F = DATA.FOODS[id]; if (!F || !(S.inv[id] > 0)) return null; S.inv[id]--; if (!S.inv[id]) delete S.inv[id];
    const over = S.st.food >= 92, hungry = S.st.food < 85; stat('food', F.food || 0); if (F.fun) stat('fun', F.fun); if (F.energy) stat('energy', F.energy);
    const dk = (F.kg || 0) * kgK() * (over && F.kg > 0 ? 2 : 1); setKg(S.kg + dk);
    S.stats.fed++; S.tried[id] = 1; addXP(2); if (!F.nonfood) care(hungry ? 3 : 1, 'food'); fulfill('food', id); checkAch(); save();
    return { over, dk, F };
  }
  const ageOK = (o) => !o || (o.age || 0) <= S.grow.stage;
  // treat a friend from the stock: each friend has a ★ favourite, likes and hates (DATA.FRIENDS[id].taste) and a daily whim (crave).
  // Hated food and a full tummy (3 treats in 10 min) are refused and stay in the fridge; the rest is eaten: −1 item, chubbier (kg × 0.12, diet tea slims),
  // friendship + mood by taste; what she thought of it becomes known (shown in the card and the picker).
  function taste(fid, id) { const T = DATA.FRIENDS[fid] && DATA.FRIENDS[fid].taste; if (!T) return 'meh'; return T.fav === id ? 'fav' : T.like.includes(id) ? 'like' : T.bad.includes(id) ? 'bad' : 'meh'; }
  function feedFriend(fid, id) {
    const F = DATA.FOODS[id], fr = S.friends[fid]; if (!F || F.nonfood || !fr || !(S.inv[id] > 0)) return null;
    FCD(fid); const n = Date.now(), kind = taste(fid, id); fr.eat = (fr.eat || []).filter((q) => n - q < 600e3);
    if (fr.eat.length >= 3) { moodAdd(fid, -2); save(); return { kind: 'full', food: F, fp: 0 }; }
    if (kind === 'bad') { fr.known[id] = 'bad'; moodAdd(fid, -15); fgain(fid, -1); save(); return { kind, food: F, fp: -1 }; }
    S.inv[id]--; if (!S.inv[id]) delete S.inv[id]; fr.eat.push(n);
    fr.fat = Math.max(0, Math.min(1, (fr.fat || 0) + F.kg * 0.12)); fr.fed = (fr.fed || 0) + 1; S.stats.friendFed = (S.stats.friendFed || 0) + 1;
    fr.known[id] = kind; const cr = crave(fid), wish = !cr.done && cr.id === id;
    const fp = fgain(fid, { fav: 4, like: 2, meh: 1 }[kind] + (wish ? 3 : 0)); moodAdd(fid, { fav: 25, like: 12, meh: 4 }[kind] + (wish ? 20 : 0));
    if (wish) { cr.done = 1; addCoins(5, 'crave'); }
    stat('fun', 4); care(2, 'friend'); emit('inv'); checkAch(); save(); return { kind, fat: fr.fat, food: F, crave: wish, fp };
  }
  function buyFood(id, n = 1) { const F = DATA.FOODS[id]; if (!F || F.cook || S.lvl < F.lvl || !ageOK(F)) return false; if (!spend(F.price * n)) return false; S.inv[id] = (S.inv[id] || 0) + n; save(); return true; }
  function buyCloth(id) { const C = DATA.CLOTHES[id]; if (!C || S.ownedC[id] || S.lvl < C.lvl || !ageOK(C)) return false; if (!spend(C.price)) return false; S.ownedC[id] = 1; S.stats.boughtClothes++; addXP(5); wear(id); checkAch(); return true; }
  // Round 17: the friends' gift at the growth party — his at once and worn; one he already has → 30 coins instead
  function giftCloth(id) { const C = DATA.CLOTHES[id]; if (!C) return null; if (S.ownedC[id]) { addCoins(30, 'gift'); save(); return 'coins'; } S.ownedC[id] = 1; S.wear[C.slot] = id; emit('wear'); checkAch(); save(); return 'cloth'; }
  function wear(id) { const C = DATA.CLOTHES[id]; if (!C || !S.ownedC[id]) return; S.wear[C.slot] = S.wear[C.slot] === id ? null : id; emit('wear'); save(); }
  function buyDecor(id) { const D = DATA.DECOR[id]; if (!D || S.owned[id] || S.lvl < D.lvl || (D.need && !hasUp(D.need))) return false; /* Round 7: TV gear needs a TV */ if (!spend(D.price)) return false; S.owned[id] = 1; S.stats.boughtDecor++; addXP(5); place(id, true); checkAch(); return true; }
  function place(id, force) {
    const D = DATA.DECOR[id]; if (!D || !S.owned[id]) return;
    { const cur = S.home.items[D.key]; if (cur === D.v && !force && !D.fixed) delete S.home.items[D.key]; else S.home.items[D.key] = D.v; }
    emit('home'); save();
  }
  function placed(id) { const D = DATA.DECOR[id]; if (!D) return false; return S.home.items[D.key] === D.v; }
  // ---- games ----
  function gameReward(gid, levelsDone, coins, lastLevel) {
    S.best[gid] = Math.max(S.best[gid] || 0, lastLevel); S.stats.games++; S.stats.levels += levelsDone;
    stat('fun', 4 * levelsDone + 3); stat('energy', -5 * levelsDone - 3); stat('food', -1.5 * levelsDone); stat('clean', -2 * levelsDone);
    if (gid === 'gym') setKg(S.kg - 0.15 * levelsDone);
    addXP(3 * levelsDone); if (levelsDone > 0) fulfill('play'); S.stats.gameCoins = (S.stats.gameCoins || 0) + Math.max(0, coins); care(2 * levelsDone, 'game'); addCoins(coins, 'game'); checkAch(); save(true);
  }
  // ---- friends ----
  const FCD = (id) => { const f = S.friends[id] || (S.friends[id] = FDEF()), d = FDEF(); for (const k in d) if (f[k] === undefined || (k === 'known' && !f.known)) f[k] = d[k]; return f; };
  function spLeft(id) { return Math.max(0, (FCD(id).cd || 0) - Date.now()); }
  // mood 0–100: treats/chats/games move it, it slowly drifts back to a calm 60 (6 points an hour)
  const MD0 = 60, MDH = 6;
  function fmood(id) { const f = FCD(id), n = Date.now(); if (!f.mdAt) f.mdAt = n; const d = MDH * (n - f.mdAt) / 3600e3; if (d > 0) { f.md = f.md > MD0 ? Math.max(MD0, f.md - d) : Math.min(MD0, f.md + d); f.mdAt = n; } return f.md; }
  function moodAdd(id, d) { const f = FCD(id); fmood(id); f.md = clamp(f.md + d); f.mdAt = Date.now(); return f.md; }
  const moodOf = (md) => md >= 80 ? 'happy' : md >= 50 ? 'ok' : md >= 30 ? 'meh' : 'sulky';
  // friendship points: a happy friend takes everything 1.5× to heart, a sulky one only half; levels at DATA.FSHIP.at, each pays coins
  function fgain(id, n) {
    const f = FCD(id), md = fmood(id); if (n > 0) n = Math.max(1, Math.round(n * (md >= 80 ? 1.5 : md < 30 ? 0.5 : 1)));
    f.fp = Math.max(0, (f.fp || 0) + n); const FS = DATA.FSHIP;
    while (f.lv < FS.at.length - 1 && f.fp >= FS.at[f.lv + 1]) { f.lv++; addCoins(FS.coins[f.lv], 'friend'); emit('friendLv', { id, lv: f.lv }); }
    checkAch(); save(); return n;
  }
  function friendship(id) {
    const f = FCD(id), FS = DATA.FSHIP, g = DATA.FRIENDS[id] && DATA.FRIENDS[id].she ? 'f' : 'm', md = fmood(id), lv = f.lv || 0, mood = moodOf(md), nx = FS.at[lv + 1];
    return { fp: f.fp || 0, lv, name: FS[g][lv], next: nx === undefined ? null : FS[g][lv + 1], need: nx === undefined ? 0 : nx - f.fp, prog: nx === undefined ? 1 : (f.fp - FS.at[lv]) / (nx - FS.at[lv]),
      md: Math.round(md), mood, moodName: FS.mood[mood][g === 'f' ? 1 : 0], perk: FS.perk[lv], she: g === 'f' };
  }
  // today's whim: one of her favourite/liked foods that Абибян can buy now
  const canHave = (k) => { const F = DATA.FOODS[k]; return !!F && !F.nonfood && (F.lvl || 0) <= S.lvl && ageOK(F); };
  function crave(id) {
    const f = FCD(id), d = dayStr(new Date()), T = DATA.FRIENDS[id] && DATA.FRIENDS[id].taste; if (f.crave && f.crave.day === d) return f.crave;
    const pool = T ? [T.fav, ...T.like].filter(canHave) : []; f.crave = { day: d, id: pool.length ? pool[Math.floor(Math.random() * pool.length)] : (T ? T.fav : 'banana'), done: 0 }; return f.crave;
  }
  // a treat she brings along (something she likes herself); limits per day are the caller's business
  function friendGift(fid) {
    const T = DATA.FRIENDS[fid] && DATA.FRIENDS[fid].taste; if (!T) return null; const pool = [T.fav, ...T.like].filter((k) => { const F = DATA.FOODS[k]; return !!F && !F.nonfood && ageOK(F); });
    if (!pool.length) return null; const id = pool[Math.floor(Math.random() * pool.length)]; S.inv[id] = (S.inv[id] || 0) + 1; S.stats.gifts = (S.stats.gifts || 0) + 1; emit('inv'); save(); return id;
  }
  function giftToday(fid) { const f = FCD(fid), d = dayStr(new Date()); if (f.gday !== d) { f.gday = d; f.gn = 0; } return f.gn; }
  function friendChat(id) {
    const f = FCD(id), d = dayStr(new Date()); f.chat++; if (f.cday !== d) { f.cday = d; f.cn = 0; } f.cn++; S.stats.chats = (S.stats.chats || 0) + 1; stat('fun', 4); care(1, 'friend');
    if (f.cn <= 6) { fgain(id, 1); moodAdd(id, 3); } checkAch(); save();
  }
  function friendSpecial(id) {
    const F = DATA.FRIENDS[id], f = FCD(id); if (!F || spLeft(id) > 0) return false; f.cd = Date.now() + F.sp.cd * 1000 * (f.lv >= 4 ? 0.5 : f.lv >= 2 ? 0.75 : 1); S.stats.specials = (S.stats.specials || 0) + 1;
    if (id === 'pusya') { stat('energy', 12); stat('fun', 10); } else if (id === 'monty') stat('fun', 14); else if (id === 'mosq') stat('energy', 35); else if (id === 'zhuk') stat('clean', 25);
    care(2, 'friend'); fgain(id, 2); moodAdd(id, 6); checkAch(); save(true); return true;
  }
  function duelReward(fid, win, coins) {
    const f = FCD(fid); if (win) f.w++; else f.l++; S.stats.duels = (S.stats.duels || 0) + 1; S.stats.games++;
    stat('fun', 6); stat('energy', -6); stat('food', -1.5); stat('clean', -2); addXP(win ? 4 : 2); fulfill('play'); care(3, 'game'); fgain(fid, 2); moodAdd(fid, 3); addCoins(coins, 'duel'); checkAch(); save(true);
  }
  // «Все вместе»: a party with all three friends
  function partyReward() {
    S.stats.parties = (S.stats.parties || 0) + 1; stat('fun', 20); care(5, 'friend'); addXP(5);
    for (const id of DATA.FIDS) { fgain(id, 3); moodAdd(id, 15); } addCoins(10, 'party'); checkAch(); save(true);
  }
  // ---- wants (Tamagotchi-like wishes) ----
  const WANT_TYPES = ['food', 'food', 'play', 'pet', 'wash', 'harvest', 'tickle'];
  function tickWant() {
    const n = Date.now(); if (S.want && n > S.want.until) { S.want = null; S.nextWant = n + 120e3; emit('want'); }
    if (!S.want && n > S.nextWant && !S.sleeping) {
      let type = WANT_TYPES[Math.floor(Math.random() * WANT_TYPES.length)]; let id = null;
      if (type === 'food') { const pool = DATA.FOOD_ORDER.filter((f) => !DATA.FOODS[f].special && DATA.FOODS[f].lvl <= S.lvl && ageOK(DATA.FOODS[f]) && (!ageDef().babble || DATA.FOODS[f].kg < 0.3)); id = pool[Math.floor(Math.random() * pool.length)]; }
      if (type === 'wash' && S.st.clean > 85) type = 'pet'; if (type === 'harvest' && S.tree.n === 0) type = 'tickle';
      S.want = { type, id, until: n + 10 * 60e3, prog: 0 }; emit('want'); save();
    }
  }
  // Round 14: he asks by himself (the evening bath) — the same wish bubble as a random want
  function wish(type, id) { if (S.want && S.want.type === type) return S.want; S.want = { type, id: id || null, until: Date.now() + 10 * 60e3, prog: 0 }; emit('want'); save(); return S.want; }
  function fulfill(type, id) {
    const w = S.want; if (!w || w.type !== type) return false; if (type === 'food' && w.id !== id) return false;
    if (type === 'pet' || type === 'tickle') { w.prog = (w.prog || 0) + 1; if (w.prog < (type === 'pet' ? 5 : 3)) { emit('want'); return false; } }
    S.want = null; S.nextWant = Date.now() + (3 + Math.random() * 4) * 60e3; S.stats.wants++;
    stat('fun', 10); addXP(8); addCoins(3, 'want'); care(5, 'want'); emit('wantDone', type); checkAch(); return true;
  }
  // ---- achievements ----
  function checkAch() {
    if (typeof DASHA !== 'undefined' && DASHA.busy && DASHA.busy()) return;
    for (const a of DATA.ACH) { if (S.ach[a.id]) continue; if (a.val(S) >= a.goal) { S.ach[a.id] = Date.now(); S.coins += a.coins; S.totalCoins += a.coins; emit('ach', a); } }
  }
  // ---- daily gift ----
  function dailyAvailable() { return S.daily.last !== dayStr(new Date()); }
  function claimDaily() {
    if (!dailyAvailable()) return null; const y = new Date(); y.setDate(y.getDate() - 1);
    S.daily.streak = S.daily.last === dayStr(y) ? S.daily.streak + 1 : 1; S.daily.last = dayStr(new Date()); S.daily.best = Math.max(S.daily.best || 0, S.daily.streak);
    const coins = (10 + 5 * Math.min(7, S.daily.streak)) * (ageDef().legend ? 2 : 1); let food = null; if (S.daily.streak >= 3) { const pool = ['icecream', 'pelmeni', 'watermelon', 'cake', 'burger'].filter((id) => ageOK(DATA.FOODS[id])); food = pool[Math.floor(Math.random() * pool.length)]; S.inv[food] = (S.inv[food] || 0) + 1; }
    addCoins(coins, 'daily'); care(5, 'daily'); checkAch(); save(true); return { coins, food, streak: S.daily.streak };
  }
  function treeStage() {
    if (!S || !S.tree) return 0;
    if (S.tree.stage !== undefined) return Math.min(4, Math.max(0, S.tree.stage | 0));
    const days = (S.grow && S.grow.days) || 0;
    const w = (S.stats && S.stats.watered) || 0;
    const progress = days + Math.floor(w / 3);
    if (progress >= 15) return 4;
    if (progress >= 9) return 3;
    if (progress >= 5) return 2;
    if (progress >= 2) return 1;
    return 0;
  }
  function treeMax() { return Math.min(5, Math.max(1, treeStage() + 1)); }
  function checkTreeGrow() {
    if (!S || !S.tree) return false;
    const cur = treeStage();
    if (cur >= 4) return false;
    const days = (S.grow && S.grow.days) || 0;
    const xp = (S.tree && S.tree.xp) || 0;
    const reqDays = [2, 5, 9, 15];
    const reqXp = [3, 8, 14, 22];
    if (days >= reqDays[cur] || xp >= reqXp[cur]) {
      S.tree.stage = cur + 1;
      save(true);
      emit('treeGrow', S.tree.stage);
      return true;
    }
    return false;
  }
  function harvest() {
    if (S.tree.n <= 0) return false;
    const stg = treeStage();
    const maxN = treeMax();
    S.tree.n--;
    if (S.tree.n === maxN - 1) S.tree.t = Date.now();
    let yieldBananas = 1;
    if (stg >= 3) yieldBananas = 2;
    else if (stg === 2 && Math.random() < 0.45) yieldBananas = 2;
    if (stg === 4 && Math.random() < 0.35) {
      yieldBananas = 3;
      addCoins(5, 'golden_banana');
      if (typeof UI !== 'undefined' && UI.toast) UI.toast('Золотой урожай! +3 банана и 5 монет! 🍌✨', UI.I('coin'), 'gold');
    } else if (yieldBananas > 1) {
      if (typeof UI !== 'undefined' && UI.toast) UI.toast(`Отличный урожай! +${yieldBananas} банана! 🍌`, UI.F('banana'));
    }
    S.inv.banana = (S.inv.banana || 0) + yieldBananas;
    S.stats.harvested = (S.stats.harvested || 0) + yieldBananas;
    addXP(1); care(1, 'harvest'); fulfill('harvest'); checkAch(); save(); return true;
  }
  function water() {
    if (Date.now() < S.tree.water) return false;
    S.tree.water = Date.now() + 2 * 3600e3;
    S.stats.watered = (S.stats.watered || 0) + 1;
    S.tree.xp = (S.tree.xp || 0) + 1;
    const grew = checkTreeGrow();
    addXP(1); care(2, 'water'); save();
    return grew ? 'grew' : true;
  }
  function fertilize() {
    if (!(S.inv.fertilizer > 0)) return false;
    S.inv.fertilizer--;
    if (!S.inv.fertilizer) delete S.inv.fertilizer;
    const maxN = treeMax();
    S.tree.n = Math.min(maxN, S.tree.n + 3);
    S.tree.xp = (S.tree.xp || 0) + 2;
    checkTreeGrow();
    save(); return true;
  }
  function mood() { const s = S.st; return (s.food + s.fun + s.energy + s.clean) / 4; }
  return { giftCloth, saveKey: () => KEY, albumKey: () => KEY + '_album', hasPhone, tutDone, gamesOpen, devLvl, gameDev, devOK, canPlay, buyPhone, tutSet, TUT_AT, isSkuf, skufKg, load, save, reset, exportCode, importCode, on, emit, simulate, catchUp, addCoins, spend, addXP, stat, setKg, fat, form, eat, care, dayRoll, nextAge, ageDef, little, ageOK, adult, hasUp,
    tasksRoll, taskProg, taskReady, tasksReady, claimTask, claimBonus, buyFood, feedFriend, buyCloth, wear, buyDecor, place, placed, upgrade, upgradeInfo, gameReward, tickWant, wish, fulfill, checkAch, dailyAvailable, claimDaily, harvest, water, fertilize, mood, clamp, takeRefund, spLeft, friendChat, friendSpecial, duelReward, friendship, fgain, fmood, moodAdd, partyReward, dayStr, crave, taste, friendGift, giftToday,
    treeStage, treeMax, checkTreeGrow,
    _ownAll: () => { ownAll(); emit('home'); }, // tests: every Round 9 #2 thing owned and in its place (the old tests' world)
    get S() { return S; }, get storageOK() { return storageOK; } };
})();
