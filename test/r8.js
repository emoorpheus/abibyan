// Round 8: node test/r8.js [shower,etag,vacuum,growth,voice,guitar,rug,friends,chatter] → test/gallery/r8_*.png. Exit 1 on fail.
const { boot, ok, shot, done, fs } = require('./lib/h.js');
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const G = '/data/game/test/gallery/r8_';
(async () => {
  const { browser, page, errs } = await boot({ hour: 12 }); const E = (f, a) => page.evaluate(f, a);
  await E(() => { window.__FM = () => (__game.HALL.FM || {}); window.__hello = (t) => (__game.DATA.LINES.hello || []).includes(t); });
  const fresh = async (opts = {}) => { const r = await boot(Object.assign({ hour: 12 }, opts)); r.E = (f, a) => r.page.evaluate(f, a); return r; };
  const go = (r) => E((r) => { __game.UI.closeSheet && __game.UI.closeSheet(); __game.HOME.goTo(r, true); __adv(400); }, r);
  const setStage = (id) => E((id) => { const G = __game, s = G.GAME.S; s.grow.stage = G.DATA.AGE[id]; s.grow.seen = s.grow.stage; s.kg = G.DATA.KG0 * G.DATA.AGES[s.grow.stage].kg * 1.05; __adv(100); }, id);

  // ---------- #10 the shower stops when he leaves the bathroom ----------
  if (want('shower')) { try {
    await go('bath'); await E(() => { __spy(); __game.HOME.shower(); __adv(900); });
    const a = await E(() => ({ on: __game.HOME.showerOn(), n: __game.AUDIO._calls.filter((n) => n === 'shower').length }));
    ok('shower: runs in the bathroom (sound)', a.on && a.n > 0, a);
    for (const [how, to] of [['instant', 'zal'], ['arrow', 'hall']]) {
      await go('bath'); await E(() => { __game.HOME.shower(); __adv(600); });
      const b = await E(([how, to]) => { const H = __game.HOME; if (how === 'instant') H.goTo(to, true); else H.goTo(to); __spy(); __adv(2500);
        return { room: H.room, on: H.showerOn(), snd: __game.AUDIO._calls.filter((n) => n === 'shower').length, drops: H.fx.list.filter((q) => q.type === 'drop').length, btn: !!document.querySelector('#a-shower.on') }; }, [how, to]);
      ok(`shower: leaving the bath (${how} → ${to}) turns the water off — no sound, no drops`, b.room === to && !b.on && !b.snd && !b.drops, b);
    }
    await go('bath'); const c = await E(() => ({ on: __game.HOME.showerOn(), btn: !!document.querySelector('#a-shower.on') }));
    ok('shower: back in the bath it is off, the button is not lit', !c.on && !c.btn, c);
  } catch (e) { ok('shower: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #4 #6 #9 the etagere: no lamp, router + Hornet on top, no masks, the toys from the photos ----------
  if (want('etag')) { try {
    await go('hall'); await E(() => __adv(800));
    const sp = await E(() => __game.ROOMS.spots('hall', __game.GAME.S.home.items));
    ok('etagere: the drum lamp is gone', !sp.torsher, sp.torsher);
    const fmk = await E(() => Object.keys(__FM()));
    ok('etagere: the comedy / tragedy masks are gone', !sp.masks && !fmk.includes('comedy') && !fmk.includes('tragedy'), sp.masks);
    ok('etagere: 4 trays', sp.tiers && sp.tiers.length === 4, sp.tiers);
    ok('etagere: the router stands on the TOP tray', sp.router && sp.router[1] + sp.router[3] <= sp.tiers[0][1] + sp.tiers[0][3] + 1 && sp.router[1] + sp.router[3] > sp.tiers[0][1], { router: sp.router, top: sp.tiers[0] });
    const F = await E(() => { const o = {}; for (const t in __game.HALL.FIGS) o[t] = __game.HALL.FIGS[t].map((f) => f[0]); return o; });
    ok('etagere: two Hornets (Silksong) by the router on top', F[1] && F[1].filter((n) => /^hornet/.test(n)).length === 2, F[1]);
    const low = F[4] || [];
    ok('etagere: bottom tray — Скромник, Спайк, Монти, Хауди-хо, пришелец, Полотенчик', ['shyguy', 'spike', 'mole', 'hankey', 'alien', 'towel'].every((n) => low.includes(n)), low);
    ok('etagere: figurines (orangutans, pony, cat, gnomes, coins) on the 2nd tray, the Linux box on the 3rd', (F[2] || []).includes('horse') && (F[2] || []).includes('coins') && sp.linux && sp.linux[1] > sp.tiers[2][1] - 2 && sp.linux[1] < sp.tiers[2][1] + sp.tiers[2][3], { t2: F[2], linux: sp.linux, t3: sp.tiers[2] });
    const L = await E(() => { const L = __game.DATA.LINES; return ['g_figShy', 'g_figSpike', 'g_figMole', 'g_hornet'].map((k) => [k, (L[k] || []).length]); });
    ok('etagere: every new toy has its own lines', L.every((x) => x[1] >= 2), L);
    // taps: Hornet «Шоу!», the bottom toys hop
    await E(() => __spy());
    const hs = await E(() => { const sp = __game.ROOMS.spots('hall', __game.GAME.S.home.items); const r = sp.hornet; __tap(r[0] + 2, r[1] + r[3] / 2); __adv(900); return { r, fig: __game.GAGS.info().fig, said: __game.AUDIO._said.slice() }; });
    ok('etagere: tap a Hornet → she hops and he says her line', /^hornet/.test(hs.fig || '') , hs);
    await shot(page, G + 'hall.png');
  } catch (e) { ok('etag: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #5 #12 the robot vacuum: bigger, and he rides it ----------
  if (want('vacuum')) { try {
    await go('hall'); await setStage('adult');
    const sp = await E(() => __game.ROOMS.spots('hall', __game.GAME.S.home.items).vacuum);
    ok('vacuum: bigger (≥ 26 px wide, was 18)', sp && sp[2] >= 26, sp);
    await E(() => { __spy(); const r = __game.ROOMS.spots('hall', __game.GAME.S.home.items).vacuum; __tap(r[0] + r[2] / 2, r[1] + r[3] / 2); });
    let rode = null, maxOff = 0, lift = 0, frames = 0;
    for (let i = 0; i < 160; i++) {
      const s = await E(() => { __adv(100); const t = __T(), H = __game.HOME; return { g: t.gags, m: t.monkey, jy: H.mk.jy, ride: t.gags.vacRide, trip: t.trip ? t.trip.kind : null, at: t.gags.vacAt }; });
      if (s.ride) { frames++; rode = rode || s; maxOff = Math.max(maxOff, Math.abs(s.m.x - s.at[0])); lift = Math.max(lift, s.at[1] - s.m.y); if (frames === 12 || frames === 40) await shot(page, G + 'vacuum_ride' + frames + '.png'); }
      if (rode && !s.ride && s.g.vacuum === 'dock') break;
    }
    ok('vacuum: he walks over and climbs on — rides it round the hall', !!rode && frames >= 20, { frames, rode });
    ok('vacuum: he stays on top while it drives (x follows the vacuum)', rode && maxOff <= 3, { maxOff });
    const end = await E(() => { __adv(3000); const t = __T(); return { g: t.gags.vacuum, ride: t.gags.vacRide, m: t.monkey, trip: t.trip ? t.trip.kind : null }; });
    ok('vacuum: it docks again, he hops off and is back on the floor', end.g === 'dock' && !end.ride && !end.trip, end);
    const snd = await E(() => __game.AUDIO._calls.slice()); ok('vacuum: the motor hums', snd.includes('vacuum'), snd.slice(0, 12));
    await E(() => { __game.GAGS.vacTap && __game.GAGS.vacTap(); }); // a solo drive for the shot
  } catch (e) { ok('vacuum: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #3 growth: 10 smaller stages, each a little step ----------
  if (want('growth')) { try {
    const g = await E(() => { const D = __game.DATA; return { names: D.AGES.map((a) => a.name), ids: D.AGES.map((a) => a.id), old: (D.AGES_V4 || []).length,
      h: D.AGES.map((A) => __bb(MONKEY.compose({ s: A.s, age: A.age, f: 0.12, cloth: {}, pose: 'idle', eyes: { mode: 'open' }, mouth: 'smile' }).cv).h), babble: D.AGES.map((a) => !!a.babble) }; });
    ok('growth: 10 stages, with Карапуз', g.names.length === 10 && g.names.includes('Карапуз'), g.names);
    const steps = g.h.slice(1).map((v, i) => v - g.h[i]);
    ok('growth: the newborn keeps its size (44 px)', Math.abs(g.h[0] - 44) <= 1, g.h);
    ok('growth: every stage a little taller (1–5 px steps, legend ≥ adult)', steps.slice(0, -1).every((d) => d >= 1 && d <= 5) && steps[steps.length - 1] >= 0, { h: g.h, steps });
    ok('growth: the adult is much smaller than before (≤ 72 px, was 108)', g.h[g.ids.indexOf('adult')] <= 72, g.h);
    ok('growth: Кроха, Малыш, Карапуз babble; from Детёныш he talks', JSON.stringify(g.babble.slice(0, 4)) === '[true,true,true,false]' && !g.babble.slice(3).some(Boolean), g.babble);
    ok('growth: the old 7-stage table is kept for the save migration', g.old === 7, g.old);
    const lit = await E(() => { const G = __game, s = G.GAME.S, o = {}; for (const id of ['toddler', 'kid', 'teen', 'adult']) { s.grow.stage = G.DATA.AGE[id]; o[id] = G.GAME.little(); } return o; });
    ok('growth: little() is by stage (smaller than a Подросток)', lit.toddler && lit.kid && !lit.teen && !lit.adult, lit);
    // migration v4 → v5: by stage id, the weight rescaled to the new factor
    for (const [old, id] of [[0, 'newborn'], [2, 'kid'], [3, 'teen'], [5, 'adult'], [6, 'legend']]) {
      const r = await fresh({ save: { v: 4, name: 'Абибян', named: true, coins: 10, kg: 9, phone: true, tut: 99, home: { items: { tv: 'none', pc: 'old' } }, room: 'zal', grow: { pts: 0, stage: old, seen: old, days: 0 } } });
      const m = await r.E((id) => { const G = __game, S = G.GAME.S, D = G.DATA; return { id: D.AGES[S.grow.stage].id, seen: S.grow.seen, kg: S.kg, v: S.v, nk: D.AGES[S.grow.stage].kg, ok: (D.AGES_V4.find((a) => a.id === id) || {}).kg }; }, id);
      ok(`growth: v4 save at old stage ${old} → «${id}», weight × new/old factor, v5`, m.id === id && m.v >= 5 && Math.abs(m.kg - 9 * m.nk / m.ok) < 0.05, m);
      await r.browser.close();
    }
    await E(() => { const D = __game.DATA; const c = document.createElement('canvas'); c.width = 600; c.height = 110; const x = c.getContext('2d'); x.fillStyle = '#f3ead8'; x.fillRect(0, 0, 600, 110);
      D.AGES.forEach((A, i) => { const sp = MONKEY.compose({ s: A.s, age: A.age, f: 0.12, cloth: {}, pose: 'idle', eyes: { mode: 'open' }, mouth: 'smile' }); x.drawImage(sp.cv, Math.round(30 + i * 58 - sp.ox), Math.round(100 - sp.oy)); });
      window.__stagesURL = c.toDataURL(); });
    fs.writeFileSync(G + 'stages.png', Buffer.from((await E(() => window.__stagesURL)).split(',')[1], 'base64'));
    await setStage('adult'); await go('zal'); await shot(page, G + 'adult_zal.png');
  } catch (e) { ok('growth: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #8 his real voice: recorded phrases, friend calls whole ----------
  if (want('voice')) { try {
    const v = await E(() => { const R = SPEECH.rec || {}, k = Object.keys(R); return { n: k.length, durs: k.map((x) => R[x][1]), keys: k }; });
    ok('voice: ≥ 120 recorded phrases in SPEECH.rec', v.n >= 120, v.n);
    ok('voice: every clip 0.2–4.5 s', v.durs.every((d) => d >= 0.2 && d <= 4.5), v.durs.filter((d) => d < 0.2 || d > 4.5));
    const p = await E(() => { const A = __game.AUDIO, f = (t) => (A._plan(t)[0] || {}).id || ''; return { banana: f('Хочу банан!'), hello: f('Привет! Я так скучал!'), mixed: A._plan('Пуся! Как я рад!').map((s) => s.id || 'gap') }; });
    ok('voice: a recorded line plays the recording (not the TTS)', p.banana[0] === 'R' && p.hello[0] === 'R', p);
    ok('voice: a friend call inside a longer line is the whole recording («Пуся!»)', p.mixed[0] === 'Rпуся', p.mixed);
    const calls = await E(() => ['пуся привет', 'жучок', 'москит', 'крот монти'].map((k) => [k, !!(SPEECH.rec || {})[k]]));
    ok('voice: friend calls recorded («Пуся, привет!», «Жучок!», «Москит!», «Крот Монти!»)', calls.every((c) => c[1]), calls);
  } catch (e) { ok('voice: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #1 the guitar ×1.25 ----------
  if (want('guitar')) { try {
    const z = await E(() => { const Z = __game.ZAL; return { GTR: Z.GTR, GW: Z.GW, GH: Z.GH, g: __bb(Z.guitarSpr(0, 1)) }; });
    ok('guitar: the gig bag ×1.25 (25×70, was 20×56), feet on the floor', z.GW >= 25 && z.GH >= 70 && z.GTR[1] + z.GH === 236, z);
    ok('guitar: the guitar itself ×1.25 (≥ 62 px, was 50)', z.g.h >= 62, z.g);
    await setStage('adult'); await go('zal');
    const hold = await E(() => { const H = __game.HOME, s = H.guitarHold ? H.guitarHold() : null; const A = __game.GAME.ageDef(); const mh = __bb(MONKEY.compose({ s: A.s, age: A.age, f: 0.12, cloth: {}, pose: 'idle', eyes: { mode: 'open' }, mouth: 'smile' }).cv).h; return { s, mh, gh: s ? __bb(__game.ZAL.guitarSpr(s.a, s.sc)).h : 0, gh0: s ? __bb(__game.ZAL.guitarSpr(0, s.sc)).h : 0 }; });
    ok('guitar: the adult holds it almost his own height', hold.s && hold.gh0 >= hold.mh * 0.8, hold);
    await E(() => { __spy(); __game.HOME.goTo('zal', true); const Z = __game.ZAL; __tap(Z.GTR[0] + Z.GW / 2, Z.GTR[1] + Z.GH - 20); __adv(4500); });
    const t = await E(() => ({ g: __T().things.guitar, trip: (__T().trip || {}).kind }));
    ok('guitar: tap → he takes it out and plays', t.trip === 'guitar' || t.g !== 'closed', t);
    await shot(page, G + 'guitar_adult.png'); await E(() => __adv(9000));
  } catch (e) { ok('guitar: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #2 the crochet mandala rug (IMG_7815 / 7816): always there; the old bought rug refunded ----------
  if (want('rug')) { try {
    const r = await fresh(); const sp = await r.E(() => __game.ROOMS.spots('zal', __game.GAME.S.home.items).rug);
    ok('rug: lies in the zal in a new game (not bought)', !!sp && sp[2] >= 90, sp);
    ok('rug: the old round rug is no longer sold', !(await r.E(() => !!__game.DATA.DECOR.rug)));
    const col = await r.E(() => { __game.HOME.goTo('zal', true); __adv(500); const sp = __game.ROOMS.spots('zal', __game.GAME.S.home.items).rug, d = document.getElementById('cv').getContext('2d').getImageData(sp[0], sp[1], sp[2], sp[3]).data, s = new Set(); for (let i = 0; i < d.length; i += 4) s.add(d[i] << 16 | d[i + 1] << 8 | d[i + 2]); return s.size; });
    ok('rug: a detailed mandala (many tones)', col >= 8, col);
    await shot(r.page, G + 'rug.png'); await r.browser.close();
    const o = await fresh({ save: { v: 4, name: 'Абибян', named: true, coins: 10, kg: 2, phone: true, tut: 99, owned: { rug: 1 }, home: { items: { tv: 'none', pc: 'old', rug: 1 } }, room: 'zal', grow: { pts: 0, stage: 0, seen: 0, days: 0 } } });
    await o.page.waitForFunction(() => [...document.querySelectorAll('.toast')].some((e) => /80/.test(e.textContent)), null, { timeout: 5000 }).catch(() => { });
    const m = await o.E(() => { const S = __game.GAME.S; return { coins: S.coins, owned: !!S.owned.rug, item: !!S.home.items.rug, toast: [...document.querySelectorAll('.toast')].map((e) => e.textContent).join('|') }; });
    ok('rug: owners of the old rug get 80 coins back, with a toast', m.coins >= 90 && !m.owned && !m.item && /80/.test(m.toast), m);
    await o.browser.close();
  } catch (e) { ok('rug: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #7 #11 #13 #14 #15 friend sizes ----------
  if (want('friends')) { try {
    const f = await E(() => { const o = {}; for (const id of ['pusya', 'monty', 'mosq', 'zhuk']) { const e = FART.sprite(id, {}); o[id] = __bb(e.cv); }
      const m = FART.sprite('monty', {}), d = m.cv.getContext('2d').getImageData(0, 0, m.cv.width, m.cv.height).data; let wh = 0, all = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { all++; if (d[i] > 225 && d[i + 1] > 215 && d[i + 2] > 195) wh++; } o.belly = wh / all; return o; });
    ok('friends: Жучок thinner (≤ 17 px wide; Round 9: 13×16)', f.zhuk.w <= 17 && f.zhuk.h >= 13, f.zhuk);
    ok('friends: Монти ×1.2 (≈ 58×42)', Math.abs(f.monty.w - 58) <= 3 && Math.abs(f.monty.h - 42) <= 3, f.monty);
    ok('friends: Монти has a bigger tummy (white belly ≥ 30 % of him)', f.belly >= 0.3, f.belly);
    ok('friends: Москит much smaller than the old 42×47 (Round 9: ×1.5 → 25×24)', f.mosq.w <= 26 && f.mosq.h <= 26 && f.mosq.w >= 10, f.mosq);
    ok('friends: Пуся a bit smaller (×0.85 ≈ 32×35)', Math.abs(f.pusya.w - 32) <= 2 && Math.abs(f.pusya.h - 35) <= 2, f.pusya);
    const pt = await E(() => { const u = FART.portrait('mosq'), i = new Image(); i.src = u; return new Promise((res) => { i.onload = () => res([i.width, i.height]); }); });
    ok('friends: Москит still gets a big portrait on his card', pt[0] >= 60 && pt[1] >= 60, pt);
    const homes = await E(() => { const o = {}; for (const r of ['kitchen', 'balcony', 'bath', 'hall']) { __game.HOME.goTo(r, true); __adv(300); o[r] = __T().friends.here.map((h) => [h.id, h.x, h.y]); } return o; });
    ok('friends: everyone still at home (sofa, box, bath, key rack)', homes.kitchen.some((h) => h[0] === 'pusya') && homes.balcony.some((h) => h[0] === 'monty') && homes.bath.some((h) => h[0] === 'mosq') && homes.hall.some((h) => h[0] === 'zhuk'), homes);
    for (const r of ['kitchen', 'balcony', 'bath', 'hall']) { await go(r); await shot(page, G + 'friend_' + r + '.png'); }
    const bx = await E(() => { const sp = __game.ROOMS.spots('balcony', __game.GAME.S.home.items); return { box: sp.box, monty: sp.monty, gnome: sp.gnome }; });
    ok('friends: the balcony box fits the bigger Монти, the gnome stays free', bx.box[2] >= 74 && bx.gnome && (bx.monty[0] + 29 <= bx.gnome[0] + 2 || bx.gnome[0] + bx.gnome[2] <= bx.monty[0] - 29), bx);
  } catch (e) { ok('friends: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- chatter: his greetings never cut a friend's line or scene; he calls a friend by name ----------
  if (want('chatter')) { try {
    const r = await fresh(); await r.E(() => { window.__hello = (t) => (__game.DATA.LINES.hello || []).includes(t); }); const c = await r.E(() => { const G = __game; G.HOME.goTo('kitchen', true); __adv(300); __spy(); G.FRIENDS.chat('pusya'); __adv(400); const busy = G.FRIENDS.busy(); G.APP.greet(); __adv(200);
      const said = G.AUDIO._said.slice(); return { busy, said, hello: said.filter((t) => __hello(t)), scene: !!G.FRIENDS.info().scene }; }); // r22: __hello lives in the page (in node it crashed whenever the scene had a line of his)
    ok('chatter: APP.greet() during a friend scene says nothing over it', c.busy && c.scene && !c.hello.length, c);
    const call = await r.E(() => { const G = __game; for (let i = 0; i < 80 && G.FRIENDS.busy(); i++) __adv(250); while (G.UI.hasModal()) G.UI.closeModal(); /* the daily gift pops up meanwhile */ G.HOME.goTo('hall', true); __adv(300); __spy(); G.FRIENDS._greetNow && G.FRIENDS._greetNow(); G.HOME.goTo('kitchen', true); for (let i = 0; i < 30; i++) __adv(100); return G.AUDIO._said.slice(); });
    ok('chatter: entering the kitchen he calls Пуся by name (recorded «Пуся, привет!» / «Пуся!»)', call.some((t) => /Пуся/.test(t)), call);
    await r.browser.close();
  } catch (e) { ok('chatter: crashed — ' + String(e.message).split('\n')[0], false); } }
  await done(errs, browser);
})().catch((e) => { console.error(e); console.log('ERRORS'); process.exit(1); });
