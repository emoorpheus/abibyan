// Round 13: node test/r13.js [steps,skip,flow,migrate] → test/gallery/r13_*.png. Exit 1 on fail.
// The tutorial: «Пропустить обучение» on every step (two taps), more steps (a tour of the flat) after the phone; games open right after the phone step.
const { boot, ok, done } = require('./lib/h.js');
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const G = '/data/game/test/gallery/r13_';
const SAVE = (o) => Object.assign({ v: 8, name: 'Абибян', named: true, coins: 500, kg: 2, phone: false, tut: 0, home: { items: { tv: 'none', pc: 'old' } }, room: 'zal', grow: { pts: 0, stage: 3, seen: 3, days: 0 } }, o);
const TOUR = ['rooms', 'feed', 'wash', 'sleep', 'friends', 'gags', 'walk', 'shop', 'grow', 'ach'];
(async () => {
  const errs = [], open = [];
  const fresh = async (o) => { const r = await boot({ hour: 12, locked: true, save: SAVE(o) }); r.E = (f, a) => r.page.evaluate(f, a); errs.push(...[]); open.push(r); return r; };
  const card = (r) => r.E(() => { const e = document.getElementById('tut'); return e ? { vis: !e.classList.contains('hidden'), n: (e.querySelector('.tn') || {}).textContent || '', t: (e.querySelector('.tt') || {}).textContent || '', next: !!e.querySelector('[data-next]'), skip: (e.querySelector('[data-skipall]') || {}).textContent || null, step: __game.TUT.step, hi: (document.querySelector('.tut-hi') || {}).id || null } : null; });
  const chk = (r) => r.E(() => { __game.TUT.check(); __adv(100); __game.TUT.check(); });

  // ---------- the list of steps ----------
  if (want('steps')) { const r = await fresh({}); try {
    const ids = await r.E(() => __game.DATA.TUT.map((q) => q.id));
    ok('steps: the old four stay first (pet → needs → phone → play)', ids.slice(0, 4).join() === 'pet,needs,phone,play', ids);
    ok('steps: a tour of everything else after them (rooms, food, washing, sleep, friends, gags, walking, shop + wardrobe, daily tasks + growth, achievements)', TOUR.every((id) => ids.includes(id)) && ids.length >= 14, ids);
    const tx = await r.E(() => __game.DATA.TUT.map((q) => q.t('Абибян', 'zal')));
    ok('steps: every step has a short text (≤ 140 chars)', tx.every((t) => typeof t === 'string' && t.length >= 15 && t.length <= 140), tx.map((t) => t.length));
  } catch (e) { ok('steps: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- «Пропустить обучение» on every step ----------
  if (want('skip')) { const r = await fresh({}); try {
    const N = await r.E(() => __game.DATA.TUT.length), miss = [];
    for (let i = 0; i < N; i++) { await r.E((i) => { __game.GAME.tutSet(i); }, i); await chk(r); const c = await card(r); if (!c || !c.vis || !c.skip) miss.push([i, c && c.step]); }
    ok('skip: every step has a «Пропустить обучение» button', miss.length === 0, miss);
    await r.E(() => { __game.GAME.tutSet(0); }); await chk(r);
    await r.E(() => document.querySelector('#tut [data-skipall]').click()); await chk(r); const c1 = await card(r);
    ok('skip: the first tap only asks «точно?» (no accidental skip)', c1.vis && c1.step === 'pet' && /точно/i.test(c1.skip || ''), c1);
    await r.page.screenshot({ path: G + 'skip_confirm.png' }); // the whole page: the card is DOM
    await r.E(() => { __adv(4000); __game.TUT.check(); }); const c1b = await card(r);
    ok('skip: …and the question goes back after a few seconds', c1b.vis && !/точно/i.test(c1b.skip || ''), c1b);
    await r.E(() => document.querySelector('#tut [data-skipall]').click()); await r.E(() => document.querySelector('#tut [data-skipall]').click()); await chk(r);
    const s = await r.E(() => ({ done: __game.GAME.tutDone(), games: __game.GAME.gamesOpen(), toast: [...document.querySelectorAll('.toast')].map((e) => e.textContent).join(' | ') })), c2 = await card(r);
    ok('skip: the second tap skips the whole tutorial (the card is gone)', s.done && c2 && !c2.vis, [s, c2]);
    ok('skip: without a phone the games stay locked and the toast says where the phone is', !s.games && /телефон/i.test(s.toast), s);
    await r.E(() => { __game.GAME.buyPhone(); __adv(100); }); ok('skip: once the phone is bought the games open', await r.E(() => __game.GAME.gamesOpen()));
  } catch (e) { ok('skip: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- the whole flow ----------
  if (want('flow')) { const r = await fresh({}); try {
    await chk(r); let c = await card(r); ok('flow: a new player sees step 1', c.vis && c.step === 'pet' && /1\//.test(c.n), c);
    await r.E(() => { __game.GAME.S.stats.petted++; }); await chk(r); c = await card(r); ok('flow: petting → «his needs»', c.step === 'needs', c);
    await r.E(() => document.querySelector('#tut [data-next]').click()); await chk(r); c = await card(r); ok('flow: «Понятно» → buy the phone', c.step === 'phone', c);
    await r.E(() => { __game.GAME.buyPhone(); }); await chk(r); c = await card(r); ok('flow: phone bought → open it', c.step === 'play', c);
    await r.E(() => { __game.TUT.onGames(); }); await chk(r); c = await card(r);
    const g = await r.E(() => ({ open: __game.GAME.gamesOpen(), done: __game.GAME.tutDone(), toast: [...document.querySelectorAll('.toast')].map((e) => e.textContent).join(' | ') }));
    ok('flow: the games open right after the phone step (the tour does not lock them)', g.open && !g.done && /игры/i.test(g.toast), g);
    ok('flow: …and the tour goes on: the rooms', c.vis && c.step === 'rooms' && c.next && /^(nav-L|nav-R)$/.test(c.hi || ''), c);
    await r.page.screenshot({ path: G + 'tour_rooms.png' }); // the whole page: the card is DOM
    await r.E(() => { __game.HOME.go(1); __adv(600); }); await chk(r); c = await card(r); ok('flow: changing the room → food', c.step === 'feed', c);
    const rm = await r.E(() => __game.HOME.room);
    if (rm !== 'kitchen') { ok('flow: food — away from the kitchen it says where to go and lights the arrow to it', /кухн/i.test(c.t) && /^(nav-L|nav-R)$/.test(c.hi || ''), c); }
    await r.E(() => { __game.HOME.goTo('kitchen', true); __adv(600); }); await chk(r); c = await card(r);
    ok('flow: food — in the kitchen it lights the food slot', c.step === 'feed' && c.hi === 'c-slot', c);
    await r.page.screenshot({ path: G + 'tour_feed.png' }); // the whole page: the card is DOM
    await r.E(() => { __game.GAME.S.stats.fed++; }); await chk(r); c = await card(r); ok('flow: he ate → washing', c.step === 'wash', c);
    await r.E(() => { __game.HOME.goTo('bath', true); __adv(600); }); await chk(r); c = await card(r); ok('flow: washing — in the bath the soap is lit', c.hi === 'a-soap', c);
    await r.E(() => { __game.GAME.S.stats.washed++; }); await chk(r); c = await card(r); ok('flow: washed → sleep', c.step === 'sleep', c);
    await r.E(() => { __game.HOME.goTo('zal', true); __adv(600); }); await chk(r); c = await card(r); ok('flow: sleep — in the zal the light switch is lit', c.hi === 'a-light' && /свет/i.test(c.t), c);
    await r.page.screenshot({ path: G + 'tour_sleep.png' }); // the whole page: the card is DOM
    await r.E(() => document.querySelector('#tut [data-next]').click()); await chk(r); c = await card(r); ok('flow: «Дальше» on a tour step → friends', c.step === 'friends', c);
    await r.E(() => { __game.FRIENDS.card('pusya'); __adv(300); }); await r.E(() => { const G = __game; while (G.UI.hasModal()) G.UI.closeModal(); __adv(200); }); await chk(r); c = await card(r); ok('flow: a friend card opened → gags', c.step === 'gags', c);
    await r.E(() => { const s = __game.GAME.S; if (!s.gags) s.gags = {}; if (!s.gags.seen) s.gags.seen = {}; s.gags.seen['tutTest'] = 1; }); await chk(r); c = await card(r); ok('flow: a new gag found → walking', c.step === 'walk', c);
    await r.E(() => { __game.HOME.goTo('zal', true); __adv(400); __tap(36, 262); __adv(200); }); await chk(r); c = await card(r); ok('flow: a tap on the floor (he walks) → shop and wardrobe', c.step === 'shop' && c.hi === 'h-shop', c);
    await r.E(() => document.querySelector('#tut [data-next]').click()); await chk(r); c = await card(r); ok('flow: → daily tasks and growth (the sprout)', c.step === 'grow' && c.hi === 'h-grow', c);
    await r.E(() => document.querySelector('#tut [data-next]').click()); await chk(r); c = await card(r); ok('flow: → achievements (the cup)', c.step === 'ach' && c.hi === 'h-ach', c);
    await r.page.screenshot({ path: G + 'tour_ach.png' }); // the whole page: the card is DOM
    await r.E(() => document.querySelector('#tut [data-next]').click()); await chk(r); c = await card(r);
    const t2 = await r.E(() => ({ done: __game.GAME.tutDone(), toast: [...document.querySelectorAll('.toast')].map((e) => e.textContent).join(' | ') }));
    ok('flow: the last step → the tutorial is done, the card is gone, «Обучение пройдено»', t2.done && !c.vis && /пройдено/i.test(t2.toast), [t2, c]);
  } catch (e) { ok('flow: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- old saves ----------
  if (want('migrate')) { try {
    const a = await fresh({ v: 7, tut: 4, phone: true }); await chk(a); const ca = await card(a), sa = await a.E(() => ({ v: __game.GAME.S.v, done: __game.GAME.tutDone(), games: __game.GAME.gamesOpen() }));
    ok('migrate: a v7 save that finished the old tutorial → v8, done, no tour card', sa.v === 8 && sa.done && sa.games && ca && !ca.vis, [sa, ca]);
    const b = await fresh({ v: 7, tut: 2, phone: false }); await chk(b); const cb = await card(b), sb = await b.E(() => ({ v: __game.GAME.S.v, tut: __game.GAME.S.tut }));
    ok('migrate: a v7 save in the middle of it keeps its step (buy the phone)', sb.v === 8 && sb.tut === 2 && cb.vis && cb.step === 'phone', [sb, cb]);
  } catch (e) { ok('migrate: crashed — ' + String(e.message).split('\n')[0], false); } }

  const all = []; for (const r of open) all.push(...r.errs); const last = open.pop();
  for (const r of open) await r.browser.close().catch(() => { });
  await done(all, last.browser);
})();
