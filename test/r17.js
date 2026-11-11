// Round 17 (plan R17): node test/r17.js [clothes,art,wardrobe,party,pending,owned,filler,look] → test/gallery/r17_*.png. Exit 1 on fail.
// Something new to wear for every growth stage (a gift at the party, or bought later), and a celebration when he grows:
// the friends come over, a cake with a number candle, he blows it, a friend gives the stage gift (he puts it on), a group photo
// goes into the album as «Праздник: …». It waits while he sleeps; it doesn't use up the daily «Все вместе».
const { boot, ok, shot, done, fs } = require('./lib/h.js');
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const G = '/data/game/test/gallery/r17_';
const NEW = { bonnet: 1, bib: 2, panama: 3, tie: 4, headphones: 5, leather: 6, keds: 7, fedora: 8, cape: 9 };
(async () => {
  const { browser, page, errs } = await boot({ hour: 14 }); const E = (f, a) => page.evaluate(f, a);
  const setup = (o = {}) => E((o) => { const G = __game, s = G.GAME.S; if (G.ROUTINE) { G.ROUTINE.off = true; G.ROUTINE.poke(); G.ROUTINE._reset(); } G.HOME.stopTravel(); while (G.UI.hasModal()) G.UI.closeModal(); G.UI.closeSheet(); if (s.sleeping && G.HOME.wakeUp) G.HOME.wakeUp();
    s.grow.stage = o.stage === undefined ? 2 : o.stage; s.grow.seen = s.grow.stage; s.grow.party = 0; s.sleeping = false; s.light = true;
    Object.assign(s.st, { food: 90, fun: 50, energy: 90, clean: 90 }); s.want = null; s.nextWant = Date.now() + 9e8; s.friends.visitAt = Date.now() + 9e8; s.friends.partyAt = 0; s.friends.partyDay = ''; s.friends.heistAt = Date.now();
    for (const id in G.DATA.CLOTHES) delete s.ownedC[id]; s.wear = {}; G.FRIENDS._reset(); if (G.GAGS._reset) G.GAGS._reset(); if (G.ALBUM) G.ALBUM._reset(); s.moments = {}; G.HOME.goTo(o.room || 'zal', true); __adv(400); for (let i = 0; i < 20; i++) { __adv(100); while (G.UI.hasModal()) G.UI.closeModal(); } /* a queued «Дружба крепнет!» from the previous party */ }, o);

  // ---------- a new thing for every stage ----------
  if (want('clothes')) { try {
    const c = await E((NEW) => { const D = __game.DATA, out = {}; for (const id in NEW) { const C = D.CLOTHES[id]; out[id] = C ? { slot: C.slot, gift: C.gift, age: C.age, name: C.name, price: C.price } : null; } return { out, stages: D.AGES.length }; }, NEW);
    const miss = Object.keys(NEW).filter((id) => !c.out[id]);
    ok('clothes: 9 new things — Чепчик, Слюнявчик, Панамка, Галстук, Наушники, Кожанка, Кеды, Шляпа-федора, Плащ Легенды', !miss.length, miss);
    ok('clothes: each one is the gift of its stage (1 … 9) and opens with it', Object.keys(NEW).every((id) => c.out[id] && c.out[id].gift === NEW[id] && c.out[id].age === NEW[id]), c.out);
    const gifts = await E(() => { const D = __game.DATA; return D.AGES.map((a, i) => Object.keys(D.CLOTHES).filter((id) => D.CLOTHES[id].gift === i)); });
    ok('clothes: every stage after the first has exactly one gift', gifts.slice(1).every((g) => g.length === 1) && !gifts[0].length, gifts);
    ok('clothes: …and they can be bought later too (a price)', Object.keys(NEW).every((id) => c.out[id] && c.out[id].price > 0), c.out);
  } catch (e) { ok('clothes: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- each one is drawn on him (and differently from the rest of its slot) ----------
  if (want('art')) { try {
    const a = await E((NEW) => { const D = __game.DATA, sig = (cl, back) => { const sp = MONKEY.compose({ s: 1, age: 0.45, cloth: cl, eyes: { mode: 'open' }, back }); const d = sp.cv.getContext('2d').getImageData(0, 0, sp.cv.width, sp.cv.height).data; return { d, w: sp.cv.width, h: sp.cv.height }; };
      const diff = (A, B) => { if (A.w !== B.w || A.h !== B.h) return 1e9; let n = 0; for (let i = 0; i < A.d.length; i += 4) if (Math.abs(A.d[i] - B.d[i]) + Math.abs(A.d[i + 1] - B.d[i + 1]) + Math.abs(A.d[i + 2] - B.d[i + 2]) + Math.abs(A.d[i + 3] - B.d[i + 3]) > 40) n++; return n; };
      const base = sig({}), out = {};
      for (const id in NEW) { const C = D.CLOTHES[id]; if (!C) { out[id] = null; continue; } const me = sig({ [C.slot]: id }); let minO = 1e9, other = null;
        for (const o in D.CLOTHES) if (o !== id && D.CLOTHES[o].slot === C.slot) { const v = diff(me, sig({ [C.slot]: o })); if (v < minO) { minO = v; other = o; } }
        out[id] = { vsNone: diff(me, base), vsOther: minO, other }; }
      const capeBack = D.CLOTHES.cape ? diff(sig({ neck: 'cape' }, true), sig({}, true)) : 0;
      return { out, capeBack }; }, NEW);
    const bad = Object.keys(NEW).filter((id) => !a.out[id] || a.out[id].vsNone < 30 || a.out[id].vsOther < 20);
    ok('art: every new thing is visible on him (≥ 30 px changed) and looks unlike the others of its slot (≥ 20 px)', !bad.length, a.out);
    ok('art: the cape shows from behind too', a.capeBack > 120, a.capeBack);
    // a strip for the eye: each new thing on him (Школьник size, ×3)
    const b64 = await E((NEW) => { const D = __game.DATA, ids = Object.keys(NEW).filter((id) => D.CLOTHES[id]); const W = 64, Hh = 84, c = document.createElement('canvas'); c.width = W * ids.length; c.height = Hh; const x = c.getContext('2d'); x.fillStyle = '#efe6d8'; x.fillRect(0, 0, c.width, c.height);
      ids.forEach((id, i) => { const C = D.CLOTHES[id], sp = MONKEY.compose({ s: 0.514 * 1.2, age: D.AGES[4].age, cloth: { [C.slot]: id }, eyes: { mode: 'open' }, pose: 'wave' }); x.drawImage(sp.cv, Math.round(i * W + W / 2 - sp.ox), Math.round(Hh - 4 - sp.oy)); });
      const z = document.createElement('canvas'); z.width = c.width * 3; z.height = c.height * 3; const zx = z.getContext('2d'); zx.imageSmoothingEnabled = false; zx.drawImage(c, 0, 0, z.width, z.height); return z.toDataURL('image/png').split(',')[1]; }, NEW);
    fs.writeFileSync(G + 'clothes.png', Buffer.from(b64, 'base64'));
  } catch (e) { ok('art: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- the wardrobe shows them (locked by stage, tagged as a party gift) ----------
  if (want('wardrobe')) { try {
    await setup({ stage: 2 });
    const w = await E(() => { const G = __game; G.UI.openWardrobe('hat'); __adv(200); const card = (id) => document.querySelector(`#sh-body .card[data-id="${id}"]`); const p = card('panama'), b = card('bonnet');
      const r = { panama: p ? p.textContent : null, bonnet: b ? b.textContent : null, thumb: !!(p && p.querySelector('img')) }; G.UI.closeSheet(); return r; });
    ok('wardrobe: the new hats are in «Гардероб»; a later stage one is locked by the stage and tagged as a party gift', !!w.panama && /Детёныш/.test(w.panama) && /одар/i.test(w.panama) && w.thumb, w);
    ok('wardrobe: one of a passed stage can be bought (price shown, no stage lock)', !!w.bonnet && /\d/.test(w.bonnet) && !/Малыш/.test(w.bonnet.replace(/Подарок[^·]*/, '')), w);
  } catch (e) { ok('wardrobe: crashed — ' + String(e.message).split('\n')[0], false); } }

  // the party recorder: from the closed «подрос» card until everybody has gone
  const rec = (ms) => E((ms) => { const G = __game, F = G.FRIENDS, s = G.GAME.S, o = { kinds: [], acts: [], lines: [], abi: [], cakeNum: null, lit: false, blown: false, here: 0, gift: null, toasts: [], polaroid: false, end: null };
    for (let t = 0; t < ms; t += 100) { __adv(100); const p = F.info().party; if (p) { if (o.kinds[o.kinds.length - 1] !== p.kind) o.kinds.push(p.kind); if (o.acts[o.acts.length - 1] !== p.act) o.acts.push(p.act); }
      const ck = F._cake && F._cake(); if (ck) { if (ck.num !== undefined) o.cakeNum = ck.num; if (ck.lit) o.lit = true; else if (o.lit) o.blown = true; }
      o.here = Math.max(o.here, F.info().here.filter((f) => f.mode === 'party').length);
      const b = F.info().bubble; if (b && o.lines[o.lines.length - 1] !== b) o.lines.push(b); const ab = G.UI.bubbleText; if (ab && o.abi[o.abi.length - 1] !== ab) o.abi.push(ab);
      document.querySelectorAll('.toast').forEach((e) => { if (!o.toasts.includes(e.textContent)) o.toasts.push(e.textContent); });
      if (!o.gift && s.wear.hat) o.gift = s.wear.hat; if (document.querySelector('#modal img.photo')) { o.polaroid = true; G.UI.closeModal(); }
      if (t > 3000 && !p && !F.info().party && o.kinds.length) break; }
    o.end = { party: F.info().party, partyDay: s.friends.partyDay, pending: s.grow.party }; return o; }, ms);

  // ---------- the growth party ----------
  if (want('party')) { try {
    await setup({ stage: 2 });
    const c0 = await E(() => __game.GAME.S.coins);
    await E(() => { const s = __game.GAME.S; s.grow.stage = 3; s.grow.seen = 2; __adv(1200); });
    const card = await E(() => ({ modal: __game.UI.hasModal(), text: (document.querySelector('#modal .mbox') || {}).textContent || '', pending: __game.GAME.S.grow.party, party: __game.FRIENDS.info().party }));
    ok('party: the «подрос» card first (the party waits until it is closed)', card.modal && /Детёныш/.test(card.text) && card.pending === 3 && !card.party, card);
    await E(() => { const b = document.querySelector('#modal [data-close]'); if (b) b.click(); __adv(300); });
    const o = await rec(70000);
    ok('party: the card closed → the friends come over for a growth party (kind «grow»)', o.kinds[0] === 'grow' && o.here >= 3, { kinds: o.kinds, here: o.here });
    ok('party: a cake with the number candle of the stage (3), he blows it out', o.cakeNum === 3 && o.lit && o.blown, { num: o.cakeNum, lit: o.lit, blown: o.blown });
    ok('party: a friend gives the stage gift — Панамка — and he puts it on', o.gift === 'panama' && o.toasts.some((t) => /Подарок/.test(t) && /Панамка/.test(t)), { gift: o.gift, toasts: o.toasts });
    const own = await E(() => !!__game.GAME.S.ownedC.panama); ok('party: …it is his now (in the wardrobe)', own);
    ok('party: they say it is about him growing up («этап»/«вырос») and he thanks them', o.lines.some((l) => /этап|вырос|подрос/i.test(l)) && o.abi.some((l) => /размеру|Спасибо/i.test(l)), { lines: o.lines, abi: o.abi });
    const L = await E(() => __game.ALBUM.list().map((e) => e.k + ' ' + e.title));
    ok('party: a group photo «Праздник: Детёныш» goes into the album (polaroid shown)', o.polaroid && L.some((x) => /^grow:3 Праздник: Детёныш/.test(x)), { L, pol: o.polaroid });
    ok('party: then everybody goes home; the daily «Все вместе» is not used up; nothing pending', !o.end.party && o.end.partyDay === '' && !o.end.pending, o.end);
    fs.writeFileSync(G + 'party.json', JSON.stringify(o, null, 1));
  } catch (e) { ok('party: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- it waits while he sleeps (and across a reload) ----------
  if (want('pending')) { try {
    await setup({ stage: 4 });
    await E(() => { const G = __game, s = G.GAME.S; s.sleeping = true; s.light = false; s.st.energy = 20; s.grow.stage = 5; s.grow.seen = 4; __adv(1200); const b = document.querySelector('#modal [data-close]'); if (b) b.click(); __adv(8000); });
    const a = await E(() => ({ party: __game.FRIENDS.info().party, pending: __game.GAME.S.grow.party }));
    ok('pending: he is asleep → no party yet, it is remembered (stage 5)', !a.party && a.pending === 5, a);
    await E(() => { const G = __game, s = G.GAME.S; if (G.HOME.wakeUp) G.HOME.wakeUp(); s.sleeping = false; s.light = true; __adv(100); });
    const o = await rec(70000);
    ok('pending: he wakes up → the growth party happens (gift: Наушники)', o.kinds[0] === 'grow' && o.gift === 'headphones' && o.cakeNum === 5, { kinds: o.kinds, gift: o.gift, num: o.cakeNum });
  } catch (e) { ok('pending: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- the gift he already has → coins instead ----------
  if (want('owned')) { try {
    await setup({ stage: 0 });
    await E(() => { const G = __game, s = G.GAME.S; s.ownedC.bonnet = 1; s.grow.stage = 1; s.grow.seen = 0; __adv(1200); const b = document.querySelector('#modal [data-close]'); if (b) b.click(); __adv(300); });
    const c0 = await E(() => __game.GAME.S.coins);
    const o = await rec(70000); const c1 = await E(() => __game.GAME.S.coins);
    ok('owned: the gift is already his → the friends give 30 coins instead (toast)', o.kinds[0] === 'grow' && o.toasts.some((t) => /Подарок/.test(t) && /30/.test(t)) && c1 - c0 >= 30, { toasts: o.toasts, d: c1 - c0 });
  } catch (e) { ok('owned: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- «живёт сам» does not wait for an idle fidget (look / scratch / wave …) to finish ----------
  if (want('filler')) { try {
    await setup({ room: 'kitchen', stage: 4 });
    const f = await E(() => { const G = __game, H = G.HOME, R = G.ROUTINE; if (!R) return { none: 1 }; G.GAME.S.home.items.guitar = G.DATA.DECOR.guitar.v; R.off = false; R._reset(); R._force('guitar');
      for (let i = 0; i < 200; i++) { if (!H.busy()) { H.mk.nextIdle = 0; __adv(50); if (H.mk.act && H.mk.act.filler) break; } else __adv(50); } const a = H.mk.act ? H.mk.act.name : null; if (H.mk.act) H.mk.act.dur = 8; R._idle(99);
      let t = 0; for (; t < 2500 && !R.cur; t += 100) __adv(100); const o = { fidget: a, cur: R.cur, t, act: H.mk.act ? H.mk.act.name : null, why: { modal: G.UI.hasModal() && (document.querySelector('#modal .mbox') || {}).textContent, sheet: G.UI.sheetOpen, host: G.FRIENDS.hosting(), busy: H.busy(true), trans: H.trans, sleep: G.GAME.S.sleeping, tut: G.GAME.tutDone(), scene: G.APP.scene } }; R.off = true; R._reset(); H.stopTravel(); return o; });
    ok('filler: alone for long enough while he fidgets (an idle act) → he sets off right away, the fidget is dropped (≤ 1.5 s)', !!f.fidget && f.cur === 'free' && f.t <= 1500 && f.act !== f.fidget, f);
  } catch (e) { ok('filler: crashed — ' + String(e.message).split('\n')[0], false); } }

  // a look at the party moments
  if (want('party') || want('look')) { try {
    await setup({ stage: 5 });
    await E(() => { const s = __game.GAME.S; s.grow.stage = 6; s.grow.seen = 5; __adv(1200); const b = document.querySelector('#modal [data-close]'); if (b) b.click(); __adv(300); });
    const at = async (cond, ms, file) => { await E(({ cond, ms }) => { for (let t = 0; t < ms; t += 100) { __adv(100); if (__game.UI.hasModal() && !document.querySelector('#modal img.photo')) __game.UI.closeModal(); if (eval(cond)) break; } }, { cond, ms }); await shot(page, G + file); };
    await at("(__game.FRIENDS._cake && __game.FRIENDS._cake() || {}).lit", 30000, 'party.png');
    await at("__game.GAME.S.wear.top === 'leather'", 40000, 'gift.png');
    await E(() => { for (let t = 0; t < 40000; t += 100) { __adv(100); if (document.querySelector('#modal img.photo')) break; if (__game.UI.hasModal()) __game.UI.closeModal(); } });
    await page.waitForTimeout(500); await page.screenshot({ path: G + 'photo.png' });
  } catch (e) { ok('look: crashed — ' + String(e.message).split('\n')[0], false); } }

  await done(errs, browser);
})();
