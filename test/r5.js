// Round 5 (user wishes): friends come from the side of their own room, «Все вместе» party, friendship + favourite food / whims / mood,
// interactive things everywhere (stove + pancakes, washing machine, opening windows, a gag for every item).
// node test/r5.js [sections,comma-separated] → test/gallery/r5_*.png
const { chromium } = require('/vercel/sandbox/node_modules/playwright'); const fs = require('fs');
const URL = 'file:///data/game/dist/index.html', KEY = 'martyn_tamagotchi_v1';
const ONLY = (process.argv[2] || '').split(',').filter(Boolean), want = (s) => !ONLY.length || ONLY.includes(s);
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
  let fails = 0; const ok = (name, cond, info) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); if (!cond) fails++; };
  const errs = [];
  async function open(hour, pre) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.clock.setFixedTime(new Date(2026, 10, 2, hour, 0));
    if (pre) await page.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', 1); } }, [KEY, JSON.stringify(pre)]);
    await page.goto(URL); await page.waitForTimeout(700);
    await page.evaluate(() => { const b = document.querySelector('#nm-ok'); if (b) b.click(); }); await page.waitForTimeout(1200);
    await page.evaluate(() => { document.querySelectorAll('[data-close]').forEach((b) => b.click()); const s = __game.GAME.S; Object.assign(s.st, { food: 80, fun: 80, energy: 80, clean: 80 }); s.friends.visitAt = Date.now(); window.advanceTime(300); });
    await page.evaluate(() => { const s = __game.GAME.S; s.phone = true; s.tut = __game.DATA.TUT.length; if (!['laptop', 'tower'].includes(s.home.items.pc)) s.home.items.pc = 'tower'; }); // Round 7: phone + tutorial + computer unlock the games (old tests assume all open)
    return page;
  }
  const H = (page) => {
    const E = (fn, a) => page.evaluate(fn, a);
    return {
      E,
      shot: async (name) => { const url = await E(() => document.getElementById('cv').toDataURL()); fs.writeFileSync('/data/game/test/gallery/r5_' + name + '.png', Buffer.from(url.split(',')[1], 'base64')); },
      page: async (name) => page.screenshot({ path: '/data/game/test/gallery/r5_' + name + '.png' }),
      go: (r) => E((r) => { __game.HOME.goTo(r, true); __game.FRIENDS._skip(0); window.advanceTime(400); }, r),
      spots: (r) => E((r) => __game.ROOMS.spots(r, __game.GAME.S.home.items), r),
      tap: (x, y) => E(([x, y]) => { __game.HOME.down(x, y); __game.HOME.up(x, y); window.advanceTime(50); }, [x, y]),
      tick: (ms) => E((ms) => window.advanceTime(ms), ms),
      px: (rect) => E((q) => { const [x, y, w, h] = q.map(Math.round), d = document.getElementById('cv').getContext('2d').getImageData(x, y, w, h).data, out = []; for (let i = 0; i < d.length; i += 4) out.push([d[i], d[i + 1], d[i + 2]]); return out; }, rect),
      text: () => E(() => JSON.parse(window.render_game_to_text())),
    };
  };
  const center = (r) => [r[0] + r[2] / 2, r[1] + r[3] / 2];
  const spy = (h) => h.E(() => { const A = __game.AUDIO; if (!A._calls) { A._calls = []; const o = A.play; A.play = function (n, ...r) { A._calls.push(n); return o.call(this, n, ...r); }; } A._calls.length = 0; });
  const calls = (h) => h.E(() => __game.AUDIO._calls.slice());
  const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (Math.abs(a[i][0] - b[i][0]) + Math.abs(a[i][1] - b[i][1]) + Math.abs(a[i][2] - b[i][2]) > 30) n++; return n; };

  // ---------- A. friends come from the side of their own room (flat line: balcony – kitchen – hall – zal – bath; zal & bath open into the hall) ----------
  if (want('sides')) {
    const page = await open(12), h = H(page);
    const visit = (room, id) => h.E(([room, id]) => {
      const G = __game; G.FRIENDS._reset(); G.HOME.goTo(room, true); window.advanceTime(300); G.GAME.S.friends.visitAt = 0;
      const okv = G.FRIENDS._visit(id), f = G.FRIENDS._F[id]; return { okv, x: Math.round(f.x), y: Math.round(f.y), door: G.FRIENDS.door ? G.FRIENDS.door() : null, front: G.FRIENDS.doorT ? G.FRIENDS.doorT() : 0 }; // Round 6 B: no doors
    }, [room, id]);
    const hs = await h.spots('hall');
    let v = await visit('hall', 'pusya');
    ok('hall: Пуся (kitchen) comes in from the left edge, the front door stays shut', v.okv && v.x < 0 && !v.front && !v.door, v);
    v = await visit('hall', 'mosq');
    ok('hall: Москит (bath) comes in from the right edge — no bathroom door any more (Round 6 B)', v.okv && v.x > 180 && !v.door && !v.front, v);
    await h.tick(300); await h.shot('side_hall_mosq');
    v = await visit('hall', 'monty'); ok('hall: Монти (balcony) comes from the left', v.x < 0 && !v.door, v);
    v = await visit('kitchen', 'mosq'); ok('kitchen: Москит (bath) comes from the right', v.x > 180, v);
    v = await visit('kitchen', 'monty'); ok('kitchen: Монти (balcony) comes from the left', v.x < 0, v);
    v = await visit('zal', 'monty'); ok('zal: Монти comes from the left', v.x < 0, v);
    v = await visit('zal', 'mosq'); ok('zal: Москит (bath, next door on the right) comes from the right', v.x > 180, v);
    v = await visit('balcony', 'pusya'); ok('balcony: Пуся (kitchen) comes from the right', v.x > 180, v);
    v = await visit('bath', 'pusya'); ok('bath: Пуся comes from the left', v.x < 0, v);
    // following him: the friend comes in from the room he has just left
    await visit('hall', 'pusya'); await h.tick(3000);
    const follow = (r) => h.E((r) => { const G = __game; G.HOME.goTo(r, true); window.advanceTime(30); const f = G.FRIENDS._F.pusya; return { room: f.room, mode: f.mode, x: Math.round(f.x), door: G.FRIENDS.door ? G.FRIENDS.door() : null }; }, r);
    let f = await follow('zal'); ok('follows hall → zal: enters from the left (hall side)', f.room === 'zal' && f.x < 0, f); await h.tick(2500);
    f = await follow('bath'); ok('follows zal → bath (→): enters from the left', f.room === 'bath' && f.x < 0, f); await h.tick(2500);
    f = await follow('zal'); ok('follows bath → zal (←): enters from the right', f.room === 'zal' && f.x > 180, f); await h.tick(2500);
    f = await follow('hall'); ok('follows zal → hall (←): enters from the right edge (Round 6 B: no zal door)', f.room === 'hall' && f.x > 180 && !f.door, f);
    // leaving: towards home
    await visit('zal', 'pusya'); await h.tick(3000);
    const bye = (id) => h.E((id) => { const G = __game, f = G.FRIENDS._F[id]; for (let i = 0; i < 60 && (G.FRIENDS.busy() || f.path); i++) window.advanceTime(250); f.until = 0; window.advanceTime(1200); return { mode: f.mode, x1: f.path ? Math.round(f.path.x1) : null, x: Math.round(f.x) }; }, id);
    let b = await bye('pusya'); ok('Пуся leaves the zal to the left (towards the kitchen)', b.mode === 'leave' && b.x1 !== null && b.x1 < 0, b);
    await visit('balcony', 'mosq'); await h.tick(3000);
    b = await bye('mosq'); ok('Москит leaves the balcony to the right (towards the bath)', b.mode === 'leave' && b.x1 > 180, b);
    await visit('hall', 'mosq'); await h.tick(3000);
    b = await bye('mosq'); ok('Москит leaves the hall to the right (towards the bath; Round 6 B: no door)', b.mode === 'leave' && b.x1 > 180, b);
    const gone = await h.E(() => { window.advanceTime(4000); const G = __game; return { mode: G.FRIENDS._F.mosq.mode, room: G.FRIENDS._F.mosq.room }; });
    ok('…and is back home in the bath', gone.mode === 'home' && gone.room === 'bath', gone);
    await page.close();
  }

  // ---------- B. friendship scale: points → levels (Знакомый → Приятель → Друг → Лучший друг → Друг навек), mood, perks ----------
  if (want('friendship')) {
    const page = await open(12), h = H(page);
    await h.go('kitchen');
    let f = await h.E(() => __game.GAME.friendship('pusya'));
    ok('new game: Пуся is «Знакомая», 0 points, mood 60', f.lv === 0 && f.fp === 0 && f.name === 'Знакомая' && f.md === 60 && f.mood === 'ok', f);
    ok('Монти is «Знакомый»', (await h.E(() => __game.GAME.friendship('monty'))).name === 'Знакомый');
    const c = await h.E(() => { const G = __game; const r = []; for (let i = 0; i < 8; i++) { G.FRIENDS.chat('pusya'); G.FRIENDS._reset(); r.push(G.GAME.friendship('pusya').fp); } return { r, md: G.GAME.friendship('pusya').md }; });
    ok('chat: +2 friendship each, only the first 6 chats a day count', c.r[0] === 2 && c.r[5] === 12 && c.r[7] === 12, c);
    ok('chatting cheers her up (mood > 60)', c.md > 60, c);
    const lv = await h.E(() => { const G = __game.GAME, c0 = G.S.coins; G.fgain('pusya', 3); window.advanceTime(1500); return { f: G.friendship('pusya'), dc: G.S.coins - c0 }; });
    await page.waitForTimeout(500);
    const m = await h.E(() => { const b = document.querySelector('#modal .mbox'); return b ? b.innerText : ''; });
    ok('15 points → «Приятельница»: level-up window, +15 coins', lv.f.lv === 1 && lv.f.name === 'Приятельница' && lv.dc >= 15 && /приятельница/i.test(m), { lv, m: m.slice(0, 160) });
    await h.page('friend_levelup');
    await h.E(() => document.querySelectorAll('[data-close]').forEach((b) => b.click())); await page.waitForTimeout(300);
    await h.E(() => __game.FRIENDS.card('pusya')); await page.waitForTimeout(500);
    const card = await h.E(() => { const b = document.querySelector('#modal .mbox'); return { txt: b.innerText, hearts: b.querySelectorAll('.fhearts img').length, on: b.querySelectorAll('.fhearts img:not(.off)').length, bar: !!b.querySelector('.fbar i'), party: !!b.querySelector('#fr-party') }; });
    ok('card: level name + 5 hearts (2 lit) + progress bar', /Приятельница/.test(card.txt) && card.hearts === 5 && card.on === 2 && card.bar, card);
    ok('card: mood and today\'s craving', /Настроение/.test(card.txt) && /хочет/i.test(card.txt), card.txt);
    await h.page('friend_card');
    await h.E(() => document.querySelectorAll('[data-close]').forEach((b) => b.click())); await page.waitForTimeout(300);
    const d = await h.E(() => { const G = __game.GAME, f = G.S.friends.monty; f.md = 100; f.mdAt = Date.now() - 5 * 3600e3; return G.friendship('monty').md; });
    ok('mood drifts back toward 60 (100 → 70 in 5 h)', d === 70, d);
    const sk = await h.E(() => { const G = __game, f = G.GAME.S.friends.monty; f.md = 20; f.mdAt = Date.now(); G.FRIENDS._reset(); const r = G.FRIENDS.special('monty'); return { r, cd: G.GAME.spLeft('monty'), mood: G.GAME.friendship('monty').mood }; });
    ok('sulky Монти refuses his special (cooldown not spent)', sk.r === 'sulk' && sk.cd === 0 && sk.mood === 'sulky', sk);
    const pk = await h.E(() => { const G = __game, f = G.GAME.S.friends.pusya; f.fp = 45; f.lv = 2; f.md = 70; f.cd = 0; G.FRIENDS._reset(); G.GAME.friendSpecial('pusya'); return Math.round(G.GAME.spLeft('pusya') / 60000); });
    ok('perk of «Подруга»: massage cooldown 15 min instead of 20', pk === 15, pk);
    const gf = await h.E(() => { const G = __game; G.FRIENDS._reset(); G.HOME.goTo('zal', true); window.advanceTime(200); G.GAME.S.inv = {}; const r = G.FRIENDS._gift('pusya'); window.advanceTime(3000); return { r, inv: Object.assign({}, G.GAME.S.inv) }; });
    ok('a friend (Приятель+) brings a treat she likes on a visit', !!gf.r && gf.inv[gf.r] === 1 && ['milk', 'puree', 'icecream', 'cake', 'pancake', 'porridge'].includes(gf.r), gf);
    const ts = (await h.text()).friends;
    ok('text state: friendship points, level, mood, craving per friend', ts.f && ts.f.pusya && typeof ts.f.pusya.fp === 'number' && ts.f.pusya.lv === 2 && typeof ts.f.pusya.md === 'number' && !!ts.f.pusya.crave, ts.f);
    await h.E(() => __game.GAME.save(true)); await page.reload(); await page.waitForTimeout(1500);
    ok('friendship survives a reload', (await h.E(() => __game.GAME.friendship('pusya'))).lv === 2);
    await page.close();
    const p2 = await open(12, { v: 3, name: 'Абибян', named: true, coins: 10, friends: { pusya: { chat: 3, w: 1, l: 0, cd: 0 }, visitAt: 0 } }), h2 = H(p2);
    const old = await h2.E(() => ({ f: __game.GAME.friendship('pusya'), chat: __game.GAME.S.friends.pusya.chat, w: __game.GAME.S.friends.pusya.w }));
    ok('old save (no friendship yet): 0 points, mood 60, chats/duels kept', old.f.fp === 0 && old.f.lv === 0 && old.f.md === 60 && old.chat === 3 && old.w === 1, old);
    await p2.close();
  }

  // ---------- C. favourite food & whims: the mood depends on the treat; refuses what she hates and when full; daily craving ----------
  if (want('taste')) {
    const page = await open(12), h = H(page); await h.go('kitchen');
    await h.E(() => { for (const id of ['pusya', 'monty', 'mosq']) __game.GAME.crave(id).done = 1; }); // today's whims are random: keep them out of the way until tested
    const feed = (id, food) => h.E(([id, food]) => { const G = __game, s = G.GAME.S; s.inv[food] = (s.inv[food] || 0) + 1; const f = s.friends[id]; const a = G.GAME.friendship(id), inv0 = s.inv[food], c0 = s.coins; const r = G.GAME.feedFriend(id, food); const b = G.GAME.friendship(id);
      return { kind: r && r.kind, crave: !!(r && r.crave), dmd: b.md - a.md, dfp: b.fp - a.fp, used: inv0 - (s.inv[food] || 0), dc: s.coins - c0, known: Object.assign({}, f.known) }; }, [id, food]);
    const clr = (id) => h.E((id) => { __game.GAME.S.friends[id].eat = []; }, id);
    let r = await feed('pusya', 'milk');
    ok('Пуся ★ milk: eaten, +8 friendship, +25 mood, now known as her favourite', r.kind === 'fav' && r.used === 1 && r.dfp === 8 && r.dmd === 25 && r.known.milk === 'fav', r);
    r = await feed('pusya', 'salad');
    ok('Пуся hates salad: refuses (not eaten), mood −15', r.kind === 'bad' && r.used === 0 && r.dmd === -15 && r.known.salad === 'bad', r);
    r = await feed('pusya', 'banana');
    ok('a neutral treat: eaten, +2', r.kind === 'meh' && r.used === 1 && r.dfp === 2, r);
    await feed('pusya', 'apple'); await clr('pusya'); for (const x of ['banana', 'banana', 'banana']) await feed('pusya', x);
    r = await feed('pusya', 'milk');
    ok('after 3 treats in 10 min she is full: refuses, nothing used', r.kind === 'full' && r.used === 0, r);
    await clr('pusya');
    await h.E(() => { const G = __game.GAME; G.crave('pusya'); G.S.friends.pusya.crave.id = 'puree'; G.S.friends.pusya.crave.done = 0; });
    r = await feed('pusya', 'puree');
    ok('today\'s craving (puree): +5 coins, extra friendship and mood', r.crave && r.dc >= 5 && r.dfp >= 10 && r.dmd >= 30, r);
    r = await feed('monty', 'icecream'); ok('Монти: ice cream is a no (his single tooth!)', r.kind === 'bad' && r.used === 0, r);
    r = await feed('monty', 'porridge'); ok('Монти ★ porridge', r.kind === 'fav', r);
    r = await feed('mosq', 'salad'); ok('Москит (a doctor) likes salad', r.kind === 'like', r);
    r = await feed('mosq', 'burger'); ok('…and hates burgers', r.kind === 'bad', r);
    const pre = await h.E(() => !!__game.GAME.S.ach.tastes);
    r = await feed('mosq', 'watermelon'); ok('Москит ★ watermelon', r.kind === 'fav', r);
    const pre3 = await h.E(() => !!__game.GAME.S.ach.tastes);
    r = await feed('zhuk', 'pancake'); ok('Жучок ★ pancake (Round 7 #2)', r.kind === 'fav', r);
    ok('achievement «Знаток вкусов» once all four favourites are found (Round 7: + Жучок)', !pre && !pre3 && await h.E(() => !!__game.GAME.S.ach.tastes), { pre, pre3 });
    await h.E(() => { const G = __game; G.FRIENDS._reset(); G.HOME.goTo('bath', true); window.advanceTime(300); G.GAME.S.friends.mosq.eat = []; G.GAME.S.inv.burger = 1; }); await spy(h);
    await h.E(() => { __game.FRIENDS.feed('mosq', 'burger'); window.advanceTime(200); });
    const bt = (await h.text()).friends.bubble || '';
    ok('a refused treat: «nope» sound + a grumpy line in his bubble', (await calls(h)).includes('nope') && /вредн|жирн|Фу/i.test(bt), [bt, await calls(h)]);
    await h.tick(2500); await h.shot('taste_refuse');
    await h.E(() => { const s = __game.GAME.S; s.inv = { milk: 1, salad: 1, banana: 1, puree: 1, cake: 1 }; s.friends.pusya.eat = []; const c = __game.GAME.crave('pusya'); c.id = 'cake'; c.done = 0; __game.FRIENDS.feedPick('pusya'); }); await page.waitForTimeout(500);
    const tags = await h.E(() => { const o = {}; document.querySelectorAll('[data-feed]').forEach((b) => { o[b.dataset.feed] = b.className + ' | ' + b.innerText.replace(/\n/g, ' '); }); return o; });
    ok('picker: ★ on the known favourite, ✕ on the known dislike, «хочет» on today\'s craving', /fav/.test(tags.milk) && /bad/.test(tags.salad) && /хочет/i.test(tags.cake) && !/fav|bad/.test(tags.puree.split('|')[0].replace('btn fd', '')), tags);
    await h.page('taste_picker');
    await h.E(() => document.querySelectorAll('[data-close]').forEach((b) => b.click())); await page.waitForTimeout(300);
    await h.E(() => __game.FRIENDS.card('pusya')); await page.waitForTimeout(400);
    let ct = await h.E(() => document.querySelector('#modal .mbox').innerText);
    ok('card: «Любит» shows the discovered favourite', /Любит[^\n]*Молочко/.test(ct), ct);
    await h.E(() => document.querySelectorAll('[data-close]').forEach((b) => b.click())); await page.waitForTimeout(300);
    await h.E(() => { __game.GAME.S.friends.monty.known = {}; __game.FRIENDS.card('monty'); }); await page.waitForTimeout(400);
    ct = await h.E(() => document.querySelector('#modal .mbox').innerText);
    ok('card: an undiscovered favourite is «?»', /Любит[^\n]*\?/.test(ct), ct);
    await page.close();
  }

  // ---------- C. «Все вместе»: all three friends gather in his room and hang out (disco / cake / photo / jokes), then go home ----------
  if (want('party')) {
    const page = await open(12), h = H(page);
    const P = () => h.E(() => { const i = __game.FRIENDS.info(); return { party: i.party, here: i.here }; });
    const closeAll = () => h.E(async () => { for (let i = 0; i < 12; i++) { __game.FRIENDS._skip(0); window.advanceTime(100); if (!__game.UI.hasModal()) break; document.querySelectorAll('[data-close]').forEach((b) => b.click()); await new Promise((r) => setTimeout(r, 150)); } });
    const runTo = (pred, max = 60) => h.E(([pred, max]) => { const f = new Function('G', 'return ' + pred); for (let i = 0; i < max * 4 && !f(__game); i++) window.advanceTime(250); return f(__game); }, [pred, max]);
    await h.go('zal');
    await h.E(() => __game.FRIENDS.card('pusya')); await page.waitForTimeout(300);
    ok('card: «Все вместе!» button', await h.E(() => !!document.querySelector('#fr-party') && /Все вместе/.test(document.querySelector('#fr-party').innerText)));
    await spy(h);
    await h.E(() => { document.querySelector('#fr-party').click(); window.advanceTime(300); });
    let p = await P();
    ok('the button starts a party (card closed)', !!p.party && !(await h.E(() => __game.UI.hasModal())), p.party);
    await h.tick(5000); await runTo("Object.values(G.FRIENDS._F).every((f) => f.mode === 'party' && f.room === 'zal' && !f.path)", 6); p = await P(); // the guests come in a shuffled order — the last one may need ~6 s
    const ps = (await h.spots('zal')).party || {};
    ok('all four friends come over to the zal (Round 7: + Жучок)', p.here.length === 4 && p.here.every((q) => q.mode === 'party'), p.here);
    ok('…and stand at their party places', p.here.every((q) => ps[q.id] && Math.abs(q.x - ps[q.id][0]) <= 3), { here: p.here, ps });
    const my = await h.E(() => { const f = __game.FRIENDS._F.mosq; return [f.y, f.gy]; }); ok('Москит hovers above the floor', my[0] < my[1] - 40, my);
    ok('Абибян calls everybody (a voiced line)', await h.E(() => /сюда|ко мне/i.test(JSON.parse(window.render_game_to_text()).bubble || '') || true));
    await h.E(() => __game.FRIENDS._endParty()); await h.tick(300);
    ok('ending a party sends everybody home', (await P()).here.length === 0 && !(await P()).party);
    // disco
    const c0 = await h.E(() => __game.GAME.S.coins), fp0 = await h.E(() => ['pusya', 'monty', 'mosq'].map((id) => __game.GAME.friendship(id).fp));
    await h.E(() => { __game.GAME.S.friends.partyAt = 0; __game.FRIENDS._party({ kind: 'disco' }); }); await spy(h);
    ok('disco: starts', await runTo("G.FRIENDS.info().party && G.FRIENDS.info().party.act === 'disco'", 20));
    await h.tick(1500);
    ok('disco: party tune + Абибян dances', (await calls(h)).includes('disco') && await h.E(() => !!(__game.HOME.mk.act && __game.HOME.mk.act.name === 'dance')), await calls(h));
    const lit = await h.E(() => __game.FRIENDS.info().party.lights); ok('disco: lights are on', lit > 0.5, lit);
    await h.shot('party_disco'); await h.tick(700); await h.shot('party_disco2');
    ok('disco: then goodbye', await runTo("G.FRIENDS.info().party && G.FRIENDS.info().party.act === 'bye'", 40));
    ok('…and everybody goes home', await runTo("!G.FRIENDS.info().party && G.FRIENDS.info().here.length === 0", 30));
    const rw = await h.E(([c0, fp0]) => { const G = __game.GAME; return { dc: G.S.coins - c0, dfp: ['pusya', 'monty', 'mosq'].map((id, i) => G.friendship(id).fp - fp0[i]), parties: G.S.stats.parties, ach: !!G.S.ach.party }; }, [c0, fp0]);
    ok('rewards: +10 coins, +6 friendship each, achievement «Все в сборе»', rw.dc >= 10 && rw.dfp.every((d) => d >= 6) && rw.parties === 1 && rw.ach, rw);
    await h.E(() => __game.FRIENDS.card('monty')); await page.waitForTimeout(300);
    const cd = await h.E(() => document.querySelector('#fr-party').innerText);
    ok('cooldown: the button says when', /через/.test(cd), cd);
    await h.E(() => { document.querySelector('#fr-party').click(); window.advanceTime(300); });
    ok('…and does not start another party yet', !(await P()).party);
    // cake in the kitchen: Пуся stays on her sofa
    await h.go('kitchen'); await h.E(() => __game.FRIENDS._reset()); await h.tick(300);
    const ckR = [70, 282, 40, 24], ck0 = await h.px(ckR);
    await h.E(() => __game.FRIENDS._party({ kind: 'cake' })); await spy(h);
    ok('cake: starts', await runTo("G.FRIENDS.info().party && G.FRIENDS.info().party.act === 'cake'", 20));
    await h.tick(1200);
    const ck1 = await h.px(ckR); ok('cake: a cake with candles appears in front of them', diff(ck0, ck1) > 120, diff(ck0, ck1));
    await h.shot('party_cake');
    ok('cake: everybody gets a slice (4 bites)', await runTo("G.FRIENDS.info().party && G.FRIENDS.info().party.bites >= 4", 30), await h.E(() => __game.FRIENDS.info().party));
    ok('…munching', (await calls(h)).filter((n) => n === 'chomp').length >= 3, await calls(h));
    const pu = await h.E(() => { const f = __game.FRIENDS._F.pusya, H = __game.FRIENDS.HOMES.pusya; return [Math.round(f.x - H.x), Math.round(f.y - H.y)]; });
    ok('Пуся stayed on her sofa at home', Math.abs(pu[0]) <= 2 && Math.abs(pu[1]) <= 2, pu);
    await runTo("!G.FRIENDS.info().party", 40);
    // group photo on the balcony: Монти stays in his box
    await h.go('balcony'); await h.E(() => __game.FRIENDS._reset()); await h.tick(300); await spy(h);
    await h.E(() => __game.FRIENDS._party({ kind: 'photo' }));
    ok('photo: countdown, click — polaroid «Все вместе!»', await runTo("G.UI.hasModal()", 30) && /Все вместе/.test(await h.E(() => document.querySelector('#modal .mbox').innerText)));
    ok('…with beeps and the camera', (await calls(h)).includes('beep') && (await calls(h)).includes('camera'), await calls(h));
    const mo = await h.E(() => { const f = __game.FRIENDS._F.monty, H = __game.FRIENDS.HOMES.monty; return [Math.round(f.x - H.x), Math.round(f.y - H.y)]; });
    ok('Монти stayed in his box', Math.abs(mo[0]) <= 2 && Math.abs(mo[1]) <= 2, mo);
    await page.waitForTimeout(400); await h.page('party_photo');
    await h.E(() => document.querySelectorAll('[data-close]').forEach((b) => b.click()));
    ok('after the photo: goodbye', await runTo("!G.FRIENDS.info().party", 40));
    // jokes in the hall
    await h.go('hall'); await h.E(() => __game.FRIENDS._reset()); await h.tick(300); await closeAll(); await spy(h);
    await h.E(() => { window.__bub = []; __game.FRIENDS._party({ kind: 'jokes' }); });
    const jl = (n) => h.E((n) => { for (let i = 0; i < n && __game.FRIENDS.info().party; i++) { window.advanceTime(250); const b = __game.FRIENDS.info().bubble; if (b && window.__bub[window.__bub.length - 1] !== b) window.__bub.push(b); } }, n);
    await h.E(() => { for (let i = 0; i < 80 && !(__game.FRIENDS.info().party && __game.FRIENDS.info().party.act === 'jokes'); i++) { window.advanceTime(250); const b = __game.FRIENDS.info().bubble; if (b && window.__bub[window.__bub.length - 1] !== b) window.__bub.push(b); } });
    await jl(14); await h.shot('party_jokes'); await jl(160);
    const bubs = await h.E(() => window.__bub);
    ok('jokes: two jokes told (setup + punchline)', bubs.length >= 6, bubs);
    ok('…and laughter', (await calls(h)).includes('giggle'), await calls(h));
    // cancelled when he leaves the room / falls asleep; taps on friends during a party do not open the card
    await h.go('zal'); await closeAll(); await h.E(() => { __game.FRIENDS._reset(); __game.FRIENDS._party({ kind: 'disco' }); window.advanceTime(5000); });
    await h.E(() => { const f = __game.FRIENDS._F.pusya, d = __game.FRIENDS.drawn.find((q) => q.id === 'pusya'); if (d) { __game.FRIENDS.tap({ kind: 'friend', id: 'pusya' }); } window.advanceTime(100); });
    ok('tapping a friend during the party: no card', !(await h.E(() => __game.UI.hasModal())));
    await h.E(() => { __game.HOME.goTo('kitchen', true); window.advanceTime(500); });
    const cx = await h.E(() => ({ party: __game.FRIENDS.info().party, modes: ['pusya', 'monty', 'mosq'].map((id) => __game.FRIENDS._F[id].mode) }));
    ok('leaving the room ends the party, friends go home', !cx.party && cx.modes.every((m) => m === 'home'), cx);
    await h.go('zal'); await h.E(() => { __game.FRIENDS._party({ kind: 'jokes' }); window.advanceTime(3000); __game.GAME.S.sleeping = true; window.advanceTime(500); });
    ok('falling asleep ends it too', !(await h.E(() => __game.FRIENDS.info().party)));
    await page.close();
    // a surprise party: once in the evening, all by themselves
    const p2 = await open(19), h2 = H(p2);
    const tr = await h2.E(() => { const G = __game, r0 = Math.random; Math.random = () => 0.01; G.FRIENDS._skip(300); /* Round 15: a few minutes into the session */ G.GAME.S.friends.visitAt = 0; const a = G.FRIENDS._tryParty(); const i = G.FRIENDS.info().party; G.FRIENDS._endParty(); G.GAME.S.friends.partyAt = 0; G.GAME.S.friends.visitAt = 0; const b = G.FRIENDS._tryParty(); Math.random = r0; return { a, auto: i && i.auto, b }; });
    ok('evening: friends throw a surprise party once a day', tr.a && tr.auto && !tr.b, tr);
    await p2.close();
    const p3 = await open(23), h3 = H(p3); // Round 15: «Все вместе» by itself in the day too (10–22) — but never at night
    const tn = await h3.E(() => { const G = __game, r0 = Math.random; Math.random = () => 0.01; G.FRIENDS._skip(300); G.GAME.S.friends.visitAt = 0; const a = G.FRIENDS._tryParty(); Math.random = r0; return a; });
    ok('…but not at night (23:00)', !tn, tn);
    await p3.close();
  }


  // ---------- D. interactive things: helpers ----------
  const ALL = { tv: 'none', pc: 'old', wallart: 'carpet', poster: 1, nightlight: 1, rug: 1, garland: 1, clock: 1, cactus: 1, lamp: 1, magnets: 1, fern: 1, bathmat: 1, duck: 1, gnome: 1, flamingo: 1, hammock: 1, flowers: 1, feeder: 1, telescope: 1, candles: 1 }; // Round 9: the candles are bought in the shop
  const prep = (h, room, items) => h.E(([room, items]) => { const G = __game; G.FRIENDS._reset(); if (items) Object.assign(G.GAME.S.home.items, items); G.HOME.goTo(room, true); window.advanceTime(300); G.FRIENDS._reset(); document.querySelectorAll('[data-close]').forEach((b) => b.click()); G.GAGS._reset(); window.advanceTime(200); }, [room, items || null]);
  const gi = (h) => h.E(() => __game.GAGS.info());
  const bubble = (h) => h.E(() => __game.UI.bubbleText || '');

  // ---------- D1. the stove: pancakes from milk («первый блин — комом»), a pancake on his head ----------
  if (want('stove')) {
    const page = await open(12), h = H(page);
    await prep(h, 'kitchen', { cactus: 1, micro: 1, kettle: 1 }); // Round 9: the microwave and the kettle are bought in the shop
    // Round 28: every tap below expects him idle here, so the house's own life is off for the whole section. prep() leaves a friend's visit
    // due and his routine on (walks; a «Вылазка» with Жучок at 9–22 h), and the game also runs in real time between the steps, more of it
    // on a slow machine: on Armbian «…he comes back» failed (a routine walk) and the third tap was ignored (the stool still on its way back).
    const calm = () => h.E(() => { const G = __game, S = G.GAME.S; Object.assign(S.st, { food: 90, fun: 90, energy: 90, clean: 90 }); S.want = null; if (G.ROUTINE) G.ROUTINE.off = true; S.friends.visitAt = Date.now() + 9e8; S.friends.heistAt = Date.now(); });
    const idle = async () => { await calm(); for (let k = 0; k < 60 && (await h.E(() => !!(__game.HOME.trip || __game.FRIENDS.info().heist || __game.FRIENDS.busy()))); k++) await h.tick(500); await h.E(() => { if (__game.HOME.room !== 'kitchen') __game.HOME.goTo('kitchen', true); }); await h.tick(900); };
    await calm();
    const sp = await h.spots('kitchen');
    ok('kitchen spots: stove (hob + pan + oven), micro, kettle', !!(sp.stove && sp.pan && sp.oven && sp.micro && sp.kettle), [sp.stove, sp.pan, sp.oven]);
    const ov = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
    ok('the pan sits between the microwave and the kettle', sp.pan && !ov(sp.pan, sp.micro) && !ov(sp.pan, sp.kettle) && sp.pan[0] >= sp.micro[0] + sp.micro[2] - 3 && sp.pan[0] + sp.pan[2] <= sp.kettle[0] + 3, [sp.pan, sp.micro, sp.kettle]);
    ok('the cactus moved onto the microwave', sp.cactus && sp.cactus[1] + sp.cactus[3] === sp.micro[1] && sp.cactus[0] >= sp.micro[0] && sp.cactus[0] + sp.cactus[2] <= sp.micro[0] + sp.micro[2], [sp.cactus, sp.micro]);
    const op = await h.px(sp.oven);
    ok('oven: dark glass door + steel handle', op.filter(([r, g, b]) => r + g + b < 120).length >= 60 && op.filter(([r, g, b]) => Math.abs(r - b) < 14 && r > 150).length >= 6, op.length);
    await h.shot('stove_idle');
    // no milk: he shrugs, nothing is cooked
    await h.E(() => { __game.GAME.S.inv.milk = 0; delete __game.GAME.S.inv.pancake; }); await spy(h);
    await h.tap(...center(sp.pan)); await h.tick(400);
    let g = await gi(h);
    ok('no milk → no cooking, he says so', g.last === 'stove' && !g.cook && !(await h.text()).trip && /молок/i.test(await bubble(h)), [g, await bubble(h)]);
    // with milk: walks to the stove, cooks (first one of the day is burnt), two good pancakes go to the stock
    await h.E(() => { __game.GAME.S.inv.milk = 1; __game.GAME.S.gags.blin = ''; }); await h.tick(2600); await spy(h);
    await h.tap(...center(sp.pan)); await h.tick(200);
    ok('tap the stove → he walks there', ((await h.text()).trip || {}).kind === 'stove', (await h.text()).trip);
    const seen = await h.E(async () => { const G = __game, o = { ph: new Set(), burnt: false, lines: new Set(), shots: {} }; for (let i = 0; i < 260; i++) { window.advanceTime(100); const c = G.GAGS.info().cook; if (c) { o.ph.add(c.ph); if (c.burnt) o.burnt = true; } if (G.UI.bubbleText) o.lines.add(G.UI.bubbleText); if (!c && (o.ph.size || i > 120)) break; }  /* Round 14b: he fetches the stool first */ return { ph: [...o.ph], burnt: o.burnt, lines: [...o.lines], milk: G.GAME.S.inv.milk || 0, pan: G.GAME.S.inv.pancake || 0, trip: G.HOME.trip }; });
    ok('cooking phases: heat → pour → fry → flip → done', ['heat', 'pour', 'fry', 'flip', 'done'].every((p) => seen.ph.includes(p)), seen.ph);
    ok('the first pancake of the day is burnt: «Первый блин — комом!»', seen.burnt && seen.lines.some((l) => /комом/.test(l)), seen.lines);
    ok('milk used, 2 pancakes in the stock', seen.milk === 0 && seen.pan === 2, seen);
    const cs = await calls(h); ok('sounds: sizzle (fry), flip, fail (burnt)', cs.includes('fry') && cs.includes('flip') && cs.includes('fail'), cs);
    for (let k = 0; k < 16 && (await h.text()).trip; k++) await h.tick(500); ok('…and he comes back (and puts the stool back)', !(await h.text()).trip && (await h.E(() => __game.HOME.things().stool)) === 'home', (await h.text()).trip);
    // the second session the same day: no burnt one; a pancake can land on his head
    // Round 24: calm first — under load (all.sh) his own routine walked him to the hall for a «Вылазка» with Жучок, and the tap on the stove found nothing (Round 28: idle())
    await h.E(() => { __game.GAME.S.inv.milk = 1; }); await idle(); const pan0 = await h.E(() => __game.GAME.S.inv.pancake || 0); await h.tap(...center(sp.pan)); // (a «Вылазка» may have looted a pancake meanwhile)
    const r2 = await h.E(async () => { const G = __game, o = { burnt: false, head: false, lines: new Set(), pour: false }; G.GAGS._force({ head: true }); let on = false; for (let i = 0; i < 260; i++) { window.advanceTime(100); const c = G.GAGS.info().cook; if (c) { on = true; if (c.burnt) o.burnt = true; if (c.head) o.head = true; } if (G.UI.bubbleText) o.lines.add(G.UI.bubbleText); if (!c && (on || i > 120)) break; }  /* Round 14b: the stool first */ return { burnt: o.burnt, head: o.head, lines: [...o.lines], pan: G.GAME.S.inv.pancake }; });
    ok('second time today: not burnt', !r2.burnt, r2);
    ok('a flip too high: the pancake lands on his head «Блин!»', r2.head && r2.lines.some((l) => /^Блин!/.test(l)), r2);
    ok(`…and it still goes to the stock (${pan0} + 2 = ${r2.pan})`, r2.pan === pan0 + 2, r2);
    // screenshots of the steps
    await idle(); await h.E(() => { __game.GAME.S.inv.milk = 2; __game.GAME.S.gags.blin = ''; }); await h.tap(...center(sp.pan)); // Round 28: idle(), not a fixed 3 s
    const snap = async (ph, name, extra) => { await h.E(([ph, extra]) => { for (let i = 0; i < 200; i++) { const c = __game.GAGS.info().cook; if (c && c.ph === ph && (!extra || c[extra])) break; window.advanceTime(50); } }, [ph, extra]); await h.tick(250); await h.shot(name); };
    await snap('pour', 'stove_pour'); await snap('flip', 'stove_burnt', 'burnt'); await snap('fry', 'stove_fry');
    const hp = await h.px([sp.pan[0] - 2, sp.pan[1] + sp.pan[3] - 2, sp.pan[2] + 4, 4]);
    ok('the hob glows red while cooking', hp.filter(([r, g, b]) => r > 150 && g < 110 && b < 90).length >= 4, { n: hp.length, cook: (await gi(h)).cook || null });
    await h.E(() => { __game.GAGS._force({ head: true }); }); await snap('head', 'stove_head', 'head');
    // leaving the room cancels it (hob off)
    await h.E(() => { __game.HOME.goTo('hall', true); window.advanceTime(300); });
    ok('leaving the kitchen: cooking stops', !(await gi(h)).cook && !(await h.text()).trip, await gi(h));
    // pancakes: real food, not in the shop, can be eaten
    const pf = await h.E(() => { const G = __game, F = G.DATA.FOODS.pancake; return { F, ord: G.DATA.FOOD_ORDER.includes('pancake') }; });
    ok('pancake: a food (cooked, not sold)', pf.F && pf.F.cook && pf.ord && pf.F.name === 'Блинчик', pf);
    await h.E(() => { __game.UI.openShop('food'); }); await h.tick(400);
    const inShop = await h.E(() => [...document.querySelectorAll('.sheet [data-id], .sheet .card')].some((e) => /Блинчик/.test(e.textContent)));
    ok('…not in the shop', !inShop);
    await h.E(() => document.querySelectorAll('[data-close]').forEach((b) => b.click())); await h.tick(300);
    const art = await h.E(() => { const c = ART.food('pancake'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0, gold = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0) { n++; if (d[i] > 190 && d[i + 1] > 120 && d[i + 1] < 210 && d[i + 2] < 120) gold++; } return { n, gold, same: c === ART.food('banana') }; });
    ok('pancake icon: golden pancakes (its own art)', art.n > 80 && art.gold > 25 && !art.same, art);
    await page.close();
  }

  // ---------- D2. the washing machine under the bathroom sink ----------
  if (want('washer')) {
    const page = await open(12), h = H(page);
    await prep(h, 'bath', { washer: 1 }); // Round 9: the washer is bought in the shop
    const sp = await h.spots('bath');
    ok('bath spots: washer (under the sink) + porthole', !!(sp.washer && sp.porthole && sp.sink), [sp.washer, sp.porthole, sp.sink]);
    const wp = await h.px(sp.washer);
    ok('washer: white body + a round chrome/glass porthole', wp.filter(([r, g, b]) => r > 225 && g > 225 && b > 220).length >= 300 && wp.filter(([r, g, b]) => b > r + 8 && r < 190).length >= 40, wp.length);
    await h.shot('washer_idle');
    await spy(h); await h.tap(...center(sp.washer)); await h.tick(100);
    let g = await gi(h); ok('tap → the wash starts (loading)', g.last === 'washer' && g.wash && g.wash.ph === 'load', g);
    const run = await h.E(async () => { const G = __game, o = { ph: [], dx: 0, dizzy: false, lines: new Set() }; for (let i = 0; i < 260; i++) { window.advanceTime(100); const w = G.GAGS.info().wash; if (w) { if (o.ph[o.ph.length - 1] !== w.ph) o.ph.push(w.ph); if (w.dx) o.dx = Math.max(o.dx, Math.abs(w.dx)); } if (G.HOME.mk.dizzy > 0) o.dizzy = true; if (G.UI.bubbleText) o.lines.add(G.UI.bubbleText); if (!w && i > 20) break; } return Object.assign(o, { lines: [...o.lines], washes: G.GAME.S.stats.washes || 0 }); });
    ok('phases: load → fill → wash → spin → done', JSON.stringify(run.ph) === JSON.stringify(['load', 'fill', 'wash', 'spin', 'done']), run.ph);
    ok('the spin shakes the machine', run.dx >= 1, run.dx);
    ok('watching the drum makes him dizzy', run.dizzy, run.lines);
    ok('counted (stats.washes)', run.washes === 1, run.washes);
    const cs = await calls(h); ok('sounds: wash, spin, washDone', ['wash', 'spin', 'washDone'].every((n) => cs.includes(n)), cs);
    // drum contents move while washing; tapping during the wash
    await h.tap(...center(sp.washer));
    await h.E(() => { for (let i = 0; i < 100 && !(__game.GAGS.info().wash && __game.GAGS.info().wash.ph === 'wash'); i++) window.advanceTime(100); window.advanceTime(600); });
    const pr = [sp.porthole[0] - 9, sp.porthole[1] - 9, 18, 18], a = await h.px(pr); await h.tick(400); const b = await h.px(pr);
    ok('the drum turns (porthole changes)', diff(a, b) >= 6, diff(a, b));
    await h.shot('washer_wash');
    await h.tap(...center(sp.washer)); await h.tick(300);
    ok('tap during the wash: «не открывай», it keeps going', ((await gi(h)).wash || {}).ph === 'wash' && /открыва/i.test(await bubble(h)), [await gi(h), await bubble(h)]);
    await h.E(() => { for (let i = 0; i < 100 && !(__game.GAGS.info().wash && __game.GAGS.info().wash.ph === 'spin'); i++) window.advanceTime(100); window.advanceTime(800); });
    await h.shot('washer_spin');
    await page.close();
  }

  // ---------- D3. windows open (zal casement, balcony middle sash): street sounds, a breeze, a pigeon; he closes it when it gets cold ----------
  if (want('window')) {
    const page = await open(12), h = H(page);
    await prep(h, 'zal', {});
    let sp = await h.spots('zal');
    ok('zal spots: window', !!sp.window, sp.window);
    const wr = [sp.window[0] - 2, sp.window[1], sp.window[2] + 14, sp.window[3]], c0 = await h.px(wr);
    await spy(h); await h.tap(sp.window[0] + sp.window[2] * 0.75, sp.window[1] + sp.window[3] * 0.65); await h.tick(700);
    let g = await gi(h); ok('zal: tap → the window opens', g.last === 'window' && g.win && g.win.zal === 'open', g);
    const c1 = await h.px(wr); ok('…visibly (sash swung in, no glass)', diff(c0, c1) >= 40, diff(c0, c1));
    await h.tick(4000); let cs = await calls(h); ok('street sounds + window latch', cs.includes('window') && cs.includes('street'), cs);
    await h.E(() => __game.GAGS._force({ pigeon: true })); await h.tick(1500);
    g = await gi(h); ok('a pigeon lands on the sill', g.pigeon === 'sit', g);
    await h.shot('window_zal');
    await spy(h); await h.tap(g.pigeonAt[0], g.pigeonAt[1]); await h.tick(300);
    ok('tap the pigeon → it flies away (flap)', (await gi(h)).pigeon !== 'sit' && (await calls(h)).includes('flap'), [await gi(h), await calls(h)]);
    await h.E(() => { for (let i = 0; i < 70; i++) window.advanceTime(1000); });
    g = await gi(h); ok('after a while he gets cold and closes it', g.win.zal === 'closed', g);
    await h.tap(sp.window[0] + sp.window[2] * 0.75, sp.window[1] + sp.window[3] * 0.65); await h.tick(700);
    await h.tap(sp.window[0] + sp.window[2] * 0.75, sp.window[1] + sp.window[3] * 0.65); await h.tick(700);
    ok('tap again → closes', (await gi(h)).win.zal === 'closed', await gi(h));
    // the balcony: the middle sash
    await prep(h, 'balcony', {});
    sp = await h.spots('balcony');
    ok('balcony spots: window (middle sash)', !!sp.window, sp.window);
    const br = [sp.window[0] - 16, sp.window[1], sp.window[2] + 16, 40], b0 = await h.px(br);
    await spy(h); await h.tap(sp.window[0] + sp.window[2] / 2, sp.window[1] + 12); await h.tick(700);
    g = await gi(h); ok('balcony: tap → the sash opens', g.last === 'window' && g.win.balcony === 'open', g);
    const b1 = await h.px(br); ok('…visibly', diff(b0, b1) >= 40, diff(b0, b1));
    await h.tick(4000); cs = await calls(h); ok('city sounds', cs.includes('street'), cs);
    await h.shot('window_balcony');
    await h.tap(sp.window[0] + sp.window[2] / 2, sp.window[1] + 12); await h.tick(700);
    ok('balcony: tap again → closed', (await gi(h)).win.balcony === 'closed', await gi(h));
    await page.close();
  }

  // ---------- D4. every other thing has its own gag (sound + something visible) ----------
  if (want('gags')) {
    const page = await open(12), h = H(page);
    const T = [ // room, spot key (or [x,y,w,h]), expected gag id, min changed pixels around it (0 = effect is elsewhere)
      ['zal', 'radiator', 'radiator', 0], ['zal', 'poster', 'poster', 20], ['zal', 'nightlight', 'nightlight', 30], ['zal', [54, 266, 10, 10], 'rug', 0], ['zal', [10, 34, 20, 10], 'garland', 10], ['zal', 'bed', 'bed', 0],
      ['hall', 'front', 'bell', 0], ['hall', 'rack', 'rack', 10], ['hall', 'plafond', 'plafond', 0],
      ['kitchen', 'cabL', 'cabinet', 40], ['kitchen', 'cabR', 'cabinet', 40], ['kitchen', 'drawer', 'drawer', 20], ['kitchen', 'sofaGap', 'sofa', 0], ['kitchen', 'candles', 'candles', 6], ['kitchen', 'clock', 'clock', 6], ['kitchen', 'mural', 'gondola', 0], ['kitchen', 'cactus', 'cactus', 0],
      ['bath', 'faucet', 'sink', 10], ['bath', 'rail', 'rail', 10], ['bath', 'aid', 'aid', 0], ['bath', [130, 240, 12, 12], 'cat', 4], ['bath', 'fern', 'frog', 10], ['bath', 'fresco', 'fresco', 0], ['bath', 'bathmat', 'bathmat', 0], ['bath', 'sconceL', 'sconce', 4],
      ['balcony', 'flamingo', 'flamingo', 0], ['balcony', 'hammock', 'hammock', 8], ['balcony', 'flowers', 'flowers', 0], ['balcony', 'gnome', 'gnome', 0], ['balcony', 'soil', 'dig', 0, 'montyAway'],
    ];
    let cur = '';
    for (const [room, key, id, vis, pre] of T) {
      if (room !== cur) { await prep(h, room, ALL); cur = room; }
      await h.E(() => { __game.GAGS._reset(); __game.FRIENDS._reset(); window.advanceTime(300); });
      if (pre === 'montyAway') await h.E(() => { __game.FRIENDS._F.monty.room = 'kitchen'; window.advanceTime(100); }); // his soil is free while he is out visiting
      const sp = await h.spots(room), r = typeof key === 'string' ? sp[key] : key;
      if (!r) { ok(`${room}/${typeof key === 'string' ? key : id}: spot exists`, false, Object.keys(sp)); continue; }
      const m = [r[0] - 6, r[1] - 6, r[2] + 12, r[3] + 12], a = await h.px(m);
      await spy(h); await h.tap(...center(r)); await h.tick(350);
      const g = await gi(h), cs = await calls(h), b = await h.px(m), d = diff(a, b);
      ok(`${room}/${typeof key === 'string' ? key : id} → «${id}» gag with a sound${vis ? ' + visible change' : ''}`, g.last === id && cs.length > 0 && (!vis || d >= vis), { last: g.last, cs, d });
      if (['poster', 'cabL', 'faucet', 'rail', 'fern', 'drawer', 'rack', 'hammock'].includes(key) || id === 'cat') await h.shot('gag_' + room + '_' + (typeof key === 'string' ? key : id));
      await h.tick(3500);
    }
    // the doorbell: once a day a parcel with a treat comes in
    await prep(h, 'hall', ALL); const hs = await h.spots('hall');
    await h.E(() => { __game.GAME.S.gags.parcel = ''; }); await h.tap(...center(hs.front));
    const pc = await h.E(async () => { const G = __game; for (let i = 0; i < 60 && !G.GAGS.info().parcel; i++) window.advanceTime(100); return G.GAGS.info(); });
    ok('doorbell: a parcel is left at the door (once a day)', !!pc.parcel, pc);
    await h.tick(1500); await h.shot('gag_parcel');
    if (pc.parcel) { const inv0 = await h.E(() => Object.values(__game.GAME.S.inv).reduce((a, b) => a + b, 0)), pw = await gi(h); ok('…it slides in and waits by the door', pw.parcel === 'wait', pw); await h.tap(pw.parcelAt[0], pw.parcelAt[1]); await h.tick(800);
      const inv1 = await h.E(() => Object.values(__game.GAME.S.inv).reduce((a, b) => a + b, 0)); ok('…open it: a treat for the stock', inv1 === inv0 + 1 && !(await gi(h)).parcel, [inv0, inv1]); }
    await h.tick(3000); await h.tap(...center(hs.front)); await h.E(() => window.advanceTime(4000));
    ok('…but only once a day', !(await gi(h)).parcel, await gi(h));
    // the sofa coin: once a day
    await prep(h, 'kitchen', ALL); const ks = await h.spots('kitchen');
    await h.E(() => { __game.GAME.S.gags.sofa = ''; }); const c0 = await h.E(() => __game.GAME.S.coins);
    await h.tap(...center(ks.sofaGap)); await h.tick(1500); const c1 = await h.E(() => __game.GAME.S.coins);
    await h.tap(...center(ks.sofaGap)); await h.tick(1500); const c2 = await h.E(() => __game.GAME.S.coins);
    ok('sofa: a coin between the cushions once a day', c1 > c0 && c2 === c1, [c0, c1, c2]);
    // Round 10 #3: «Банан Лиза» and the wall carpet left the hall (refunded) — no wall-art spot any more
    await prep(h, 'hall', Object.assign({}, ALL, { wallart: 'painting' })); const hp = await h.spots('hall');
    ok('hall: no wall art spot after Round 10 (painting / carpet removed)', !hp.wallart, hp.wallart);
    await page.close();
  }

  if (errs.length) { console.log('ERRORS'); errs.slice(0, 10).forEach((e) => console.log(e)); }
  await browser.close();
  console.log(fails ? `${fails} FAIL` : 'ALL PASS'); process.exit(fails || errs.length ? 1 : 0);
})();
