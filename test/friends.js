// Friends & pillows probe (skills: probing-web-game-mechanics + designing-mini-games invariants). Exit 1 on any failed check.
// node test/friends.js [url]  → also writes gallery shots to test/gallery/fr_*.png
const { chromium } = require('/vercel/sandbox/node_modules/playwright'); const fs = require('fs');
const URL = process.argv[2] || 'file:///data/game/dist/index.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  let fails = 0; const ok = (name, cond, info) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!cond) fails++; };
  await page.goto(URL); await page.waitForTimeout(700);
  await page.evaluate(() => document.querySelector('#nm-ok').click()); await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelectorAll('[data-close]').forEach(b => b.click()));
  await page.evaluate(() => { const s = __game.GAME.S; s.phone = true; s.tut = __game.DATA.TUT.length; if (!['laptop', 'tower'].includes(s.home.items.pc)) s.home.items.pc = 'tower'; if (__game.ROUTINE) __game.ROUTINE.off = true; }); // Round 7: phone + tutorial + computer unlock the games (old tests assume all open). Round 21: his own day (R14, by the clock) off — in the morning he went off to play and the Монти / Москит checks failed
  const T = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
  const E = (fn, a) => page.evaluate(fn, a);
  const adv = (ms) => E((ms) => window.advanceTime(ms), ms);
  const shot = async (name) => { const url = await E(() => document.getElementById('cv').toDataURL()); fs.writeFileSync('/data/game/test/gallery/fr_' + name + '.png', Buffer.from(url.split(',')[1], 'base64')); };
  await E(() => { const s = __game.GAME.S; s.coins = 500; Object.assign(s.st, { food: 80, fun: 80, energy: 80, clean: 80 }); s.friends.visitAt = Date.now(); });
  // helper in page: centre of a drawn friend/pillow in scene coords + tap via HOME.down/up
  await E(() => {
    window.__fc = (kind, id) => { const d = __game.FRIENDS.drawn.find((q) => q.kind === kind && q.id === id); if (!d) return null; for (let r = 0; r < 30; r++) for (let a = 0; a < 12; a++) { const x = Math.round(d.e.w / 2 + Math.cos(a / 12 * 6.28) * r * 0.4), y = Math.round(d.e.h * 0.55 + Math.sin(a / 12 * 6.28) * r * 0.4); if (__game.FART.hit(d.e, x, y, 0)) return { x: d.x0 + x + 0.5, y: d.y0 + y + 0.5 }; } return null; };
    window.__tap = (kind, id) => { const p = __fc(kind, id); if (!p) return false; __game.HOME.down(p.x, p.y); __game.HOME.up(p.x, p.y); return true; };
  });

  // 1. presence: each friend at home in their room
  const where = {};
  for (const r of ['balcony', 'kitchen', 'hall', 'zal', 'bath']) { await E((r) => __game.HOME.goTo(r, true), r); await adv(400); const t = await T(); where[r] = t.friends.here.map((h) => h.id + ':' + h.mode); await shot('room_' + r); }
  ok('Пуся lives in the kitchen, Монти on the balcony, Москит in the bath', where.kitchen.includes('pusya:home') && where.balcony.includes('monty:home') && where.bath.includes('mosq:home') && where.hall.join() === 'zhuk:home' && !where.zal.length, where); // Round 7 #2: Жучок on the hall key rack
  ok('textState has friends info', (await T()).friends !== undefined);

  // 2. tap friend -> card
  await E(() => __game.HOME.goTo('kitchen', true)); await adv(300);
  const tapped = await E(() => __tap('friend', 'pusya')); await adv(100);
  const card = await E(() => ({ modal: __game.UI.hasModal(), chat: !!document.querySelector('#fr-chat'), sp: !!document.querySelector('#fr-sp'), duel: !!document.querySelector('#fr-duel'), title: (document.querySelector('.mbox h2') || {}).textContent }));
  ok('tap on Пуся opens her card (Болтать / Массаж / Дуэль)', tapped && card.modal && card.chat && card.sp && card.duel && card.title === 'Пуся', card);
  await page.waitForTimeout(500); await page.screenshot({ path: '/data/game/test/gallery/fr_card.png' });

  // 3. chat: fun +4, counter, scene runs with a friend bubble, then ends
  const c0 = await E(() => { const s = __game.GAME.S; s.st.fun = 50; return { fun: s.st.fun, chat: s.friends.pusya.chat }; });
  await E(() => document.querySelector('#fr-chat').click()); await adv(1500);
  const c1 = await E(() => { const s = __game.GAME.S; return { fun: s.st.fun, chat: s.friends.pusya.chat, scene: __game.FRIENDS.info().scene, busy: __game.HOME.busy() }; });
  ok('chat → fun +4, chats +1, scene running, monkey busy (no idle chatter on top)', Math.abs(c1.fun - c0.fun - 4) < 0.6 && c1.chat === c0.chat + 1 && c1.scene === 'pusya' && c1.busy, { c0, c1 });
  let sawBubble = false; for (let i = 0; i < 24; i++) { await adv(500); const t = await T(); if (t.friends.bubble) sawBubble = true; if (!t.friends.scene) break; }
  ok('friend speaks in her own bubble; scene ends', sawBubble && !(await T()).friends.scene);
  await shot('chat');

  // 4. specials + cooldowns
  const m0 = await E(() => { const s = __game.GAME.S; s.st.energy = 50; s.st.fun = 50; s.friends.pusya.cd = 0; return __game.FRIENDS.special('pusya'); });
  for (let i = 0; i < 30 && (await T()).friends.scene; i++) await adv(500);
  const m1 = await E(() => { const s = __game.GAME.S; return { e: s.st.energy, f: s.st.fun, cd: Math.round((s.friends.pusya.cd - Date.now()) / 60000) }; });
  ok('Пуся massage: energy ≈ +12, fun ≈ +10, cooldown 20 min', m0 === 'ok' && m1.e > 60 && m1.e < 63 && m1.f > 58 && m1.f < 61 && m1.cd >= 19 && m1.cd <= 20, m1);
  const pos = await E(() => { const f = __game.FRIENDS._F.pusya; return { x: Math.round(f.x), y: Math.round(f.y), path: !!f.path }; });
  await adv(1500); const pos2 = await E(() => { const f = __game.FRIENDS._F.pusya, h = __game.FRIENDS.HOMES.pusya; return { back: Math.abs(f.x - h.x) < 1 && Math.abs(f.y - h.y) < 1 }; });
  ok('Пуся walks back to her sofa after the massage', pos2.back, { pos, pos2 });
  const m2 = await E(() => { const s = __game.GAME.S, e = s.st.energy; const r = __game.FRIENDS.special('pusya'); return { r, same: s.st.energy === e }; });
  for (let i = 0; i < 12 && (await T()).friends.scene; i++) await adv(500);
  ok('massage on cooldown is refused (she explains), no stats', m2.r === 'cd' && m2.same, m2);
  await E(() => __game.HOME.goTo('balcony', true)); await adv(300);
  const s0 = await E(() => { const s = __game.GAME.S; s.st.fun = 40; s.friends.monty.cd = 0; return __game.FRIENDS.special('monty'); });
  for (let i = 0; i < 30 && (await T()).friends.scene; i++) await adv(500);
  const s1 = await E(() => { const s = __game.GAME.S; return { f: s.st.fun, cd: Math.round((s.friends.monty.cd - Date.now()) / 60000) }; });
  ok('Монти story: fun ≈ +14, cooldown 10 min', s0 === 'ok' && s1.f > 53 && s1.f < 55 && s1.cd >= 9 && s1.cd <= 10, s1);
  await E(() => __game.HOME.goTo('bath', true)); await adv(300);
  const b0 = await E(() => { const s = __game.GAME.S; s.st.energy = 90; s.friends.mosq.cd = 0; const r = __game.FRIENDS.special('mosq'); return { r, cd: s.friends.mosq.cd }; });
  for (let i = 0; i < 12 && (await T()).friends.scene; i++) await adv(500);
  ok('Москит refuses the bite when energy > 85 (cooldown not spent)', b0.r === 'full' && b0.cd === 0, b0);
  const b1 = await E(() => { const s = __game.GAME.S; s.st.energy = 20; return __game.FRIENDS.special('mosq'); });
  let bitShot = false; for (let i = 0; i < 40 && (await T()).friends.scene; i++) { await adv(250); if (!bitShot && await E(() => __game.FRIENDS._F.mosq.pose === 'bite' && __game.FRIENDS.t < __game.FRIENDS._F.mosq.poseUntil)) { await shot('bite'); bitShot = true; } }
  const b2 = await E(() => { const s = __game.GAME.S; return { e: s.st.energy, cd: Math.round((s.friends.mosq.cd - Date.now()) / 3600000) }; });
  ok('Москит bite: energy +35, cooldown 3 h', b1 === 'ok' && b2.e > 54 && b2.e < 56 && b2.cd === 3, b2);

  // 5. visits: Москит comes when energy < 30 and bite ready; follows; goes home when we enter his room
  await E(() => { __game.HOME.goTo('hall', true); const s = __game.GAME.S; s.st.energy = 20; s.st.fun = 80; s.friends.mosq.cd = 0; s.friends.visitAt = 0; __game.FRIENDS._skip(61); });
  await adv(6000);
  let v = (await T()).friends; ok('tired → Москит visits the hall', v.visitor === 'mosq' && v.here.some((h) => h.id === 'mosq' && h.mode === 'visit'), v);
  await adv(5000); await shot('visit_hall');
  await E(() => __game.HOME.goTo('kitchen', true)); await adv(2500);
  v = (await T()).friends; ok('visitor follows to the kitchen', v.visitor === 'mosq' && v.here.some((h) => h.id === 'mosq'), v); await shot('visit_kitchen');
  await E(() => __game.HOME.goTo('bath', true)); await adv(600);
  v = (await T()).friends; ok('entering his own room → Москит is home, visit over', !v.visitor && v.here.some((h) => h.id === 'mosq' && h.mode === 'home'), v);
  await E(() => { __game.HOME.goTo('hall', true); const s = __game.GAME.S; s.st.energy = 20; s.friends.mosq.cd = 0; });
  await adv(11000); ok('no new visit within 4 min of the last one', !(await T()).friends.visitor);
  await E(() => { __game.HOME.goTo('zal', true); const s = __game.GAME.S; s.st.energy = 80; s.st.fun = 20; s.friends.visitAt = 0; });
  await adv(6000); v = (await T()).friends; ok('bored → Пуся visits', v.visitor === 'pusya', v);
  // the visit scene (walk in + lines) may still be playing — leave waits for it; poll instead of one fixed 6 s wait (was flaky)
  await E(() => __game.FRIENDS._skip(200)); for (let i = 0; i < 20; i++) { await adv(1000); v = (await T()).friends; if (!v.visitor) break; }
  v = (await T()).friends; ok('visit times out → she says bye and walks home', !v.visitor && !v.here.some((h) => h.id === 'pusya'), v);
  await E(() => { __game.HOME.goTo('kitchen', true); }); await adv(400);
  ok('…and is back on her sofa', (await T()).friends.here.some((h) => h.id === 'pusya' && h.mode === 'home'));

  // 6. pillows
  await E(() => { const s = __game.GAME.S; s.st.fun = 50; s.st.energy = 80; __game.HOME.goTo('zal', true); }); await adv(400);
  let p = (await T()).friends.pillows; ok('bed has carrot & pepper pillows (teddy gone)', p && p.carrot === 'idle' && p.pepper === 'idle', p);
  await shot('pillows_day');
  await E(() => __tap('pillow', 'carrot')); await adv(100); p = (await T()).friends.pillows;
  ok('tap carrot → shy', p.carrot === 'shy', p);
  await adv(2000); await E(() => { __tap('pillow', 'carrot'); window.advanceTime(150); __tap('pillow', 'carrot'); window.advanceTime(150); __tap('pillow', 'carrot'); }); await adv(100);
  p = (await T()).friends.pillows; ok('3 quick taps → carrot hides behind her leaves', p.carrot === 'hide', p); await shot('carrot_hide');
  await E(() => __tap('pillow', 'pepper')); await adv(120); p = (await T()).friends.pillows;
  ok('tap pepper → wink/proud', p.pepper === 'wink' || p.pepper === 'proud', p); await shot('pepper_proud');
  await adv(3000);
  const h0 = await E(() => { const s = __game.GAME.S, q = __fc('pillow', 'carrot'); __game.HOME.down(q.x, q.y); window.advanceTime(700); const r = { fun0: 50, fun: s.st.fun, held: __game.FRIENDS._PIL.carrot.held }; __game.HOME.up(q.x, q.y); r.after = __game.FRIENDS._PIL.carrot.held; return r; });
  ok('hold carrot ≥0.45 s → hug (fun +1.5), release → back', h0.held && h0.fun > 51.3 && h0.fun < 51.7 && !h0.after, h0);
  await E(() => __game.HOME.toggleLight()); await adv(1500);
  p = (await T()).friends.pillows; ok('lights off → he sleeps hugging the carrot', (await T()).sleeping && p.carrot === 'hug' && p.pepper === 'sleep', p);
  await shot('pillows_night');
  await E(() => __tap('pillow', 'carrot')); await E(() => __tap('pillow', 'pepper')); await adv(300);
  ok('tapping pillows does not wake him', (await T()).sleeping);
  await E(() => __game.HOME.toggleLight()); await adv(500);

  // 7. duels — invariants with a seeded AI (designing-mini-games: idle/mashing lose, skilled wins)
  const sim = (gid, policy, seed, maxS) => E(({ gid, policy, seed, maxS }) => {
    const { MINI, GAME } = __game; GAME.S.st.energy = 90; MINI.seed(seed); MINI.start(gid, 1); const G = MINI.G; let T = 0, nextTap = 0, rs = seed * 7 + 1; const rnd = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };
    const DX = [27, 69, 111, 153];
    while (T < maxS && !MINI.st.over) {
      if (policy === 'skilled' && gid === 'd_catch') { const m = G.m, sp = 165 * (1 - 0.3 * GAME.fat()); let best = null, bs = -1; for (const it of G.items) { if (it.type === 'coconut') continue; const tc = (252 - it.y) / it.vy; if (tc < 0) continue; const need = Math.max(0, Math.abs(it.x - m.x) - 10) / sp; if (need > tc) continue; const sc = (it.type === 'gold' ? 3 : 1) / (tc + 0.4 + need); if (sc > bs) { bs = sc; best = it; } } let tx = best ? best.x : m.x; for (const it of G.items) if (it.type === 'coconut') { const tc = (216 - it.y) / it.vy; if (tc > -0.3 && tc < 0.7 && Math.abs(it.x - tx) < 26) tx = it.x + (tx >= it.x ? 28 : -28); } MINI.down(Math.max(14, Math.min(166, tx)), 280); }
      if (policy === 'mash' && T >= nextTap) { nextTap = T + 0.25; if (gid === 'd_catch') MINI.down(14 + rnd() * 152, 280); else if (gid === 'd_bongo') MINI.down(DX[Math.floor(rnd() * 4)], 268); else MINI.down(90, 200); }
      if (policy === 'skilled' && gid === 'd_bongo' && T >= nextTap) { if (G.phase === 'pin') { MINI.down(DX[G.seq[G.idx]], 268); nextTap = T + 0.22; } else if (G.phase === 'padd') { MINI.down(DX[(G.seq[G.seq.length - 1] + 2) % 4], 268); nextTap = T + 0.22; } }
      if (policy === 'wrong' && gid === 'd_bongo' && G.phase === 'pin') MINI.down(DX[(G.seq[G.idx] + 1) % 4], 268);
      if (policy === 'skilled' && gid === 'd_gym') { const A = G.A; if (A.phase === 'aim' && Math.abs(A.cur - (A.zone + 13)) <= 2.6) MINI.down(90, 200); }
      window.advanceTime(1000 / 60); T += 1 / 60;
    }
    const st = MINI.st, d = Object.assign({}, st.duel); const r = { over: !!st.over, win: d.win, me: d.me, fr: d.fr, T: Math.round(T), phase: G.phase, errs: G.errs };
    return r;
  }, { gid, policy, seed, maxS });
  const finish = async () => { await adv(2200); return E(() => { const has = !!document.querySelector('#r-home'); if (has) document.querySelector('#r-home').click(); else __game.MINI.home(); return has; }); };
  const res = {};
  for (const gid of ['d_catch', 'd_gym']) {
    res[gid] = { idle: [], mash: [], skilled: [] };
    for (const pol of ['idle', 'mash', 'skilled']) for (let sd = 1; sd <= (pol === 'skilled' ? 5 : 3); sd++) { const r = await sim(gid, pol, sd * 101, 150); res[gid][pol].push(r.win === true ? 'W' : r.win === false ? 'L' : '?'); await finish(); }
  }
  ok('Банановая дуэль: idle always loses', res.d_catch.idle.every((x) => x === 'L'), res.d_catch);
  ok('Банановая дуэль: mashing loses', res.d_catch.mash.filter((x) => x === 'L').length >= 2, res.d_catch.mash);
  ok('Банановая дуэль: skilled play beats Пуся (≥4/5)', res.d_catch.skilled.filter((x) => x === 'W').length >= 4, res.d_catch.skilled);
  ok('Силач-дуэль: idle always loses', res.d_gym.idle.every((x) => x === 'L'), res.d_gym);
  ok('Силач-дуэль: mashing loses', res.d_gym.mash.every((x) => x === 'L'), res.d_gym.mash);
  ok('Силач-дуэль: skilled (centre taps) beats Москит (≥4/5)', res.d_gym.skilled.filter((x) => x === 'W').length >= 4, res.d_gym.skilled);
  const bi = await sim('d_bongo', 'idle', 5, 30); await finish();
  ok('Бонго-дуэль: idle → game waits, no score, not over', !bi.over && bi.me === 0 && bi.phase === 'pin', bi);
  const bw = await sim('d_bongo', 'wrong', 5, 30); await finish();
  ok('Бонго-дуэль: a wrong drum loses at once', bw.win === false && bw.me === 0, bw);
  const bm = []; for (let sd = 1; sd <= 3; sd++) { bm.push((await sim('d_bongo', 'mash', sd, 60)).win); await finish(); }
  ok('Бонго-дуэль: mashing loses', bm.every((x) => x === false), bm);
  const bs = []; for (let sd = 1; sd <= 3; sd++) { bs.push(await sim('d_bongo', 'skilled', sd * 13, 400)); await finish(); }
  ok('Бонго-дуэль: perfect repeats → Монти eventually slips (player wins)', bs.every((r) => r.win === true && r.errs === 1), bs);
  const ep = await E(() => { const { MINI } = __game; MINI.seed(3); MINI.start('d_bongo', 1); const G = MINI.G; G.seq.length = 0; G.seq.push(0, 1, 3); const r = { near: G.errP(1), jump: G.errP(2) }; MINI.home(); return r; });
  ok('Монти errs more on jumps between far drums', ep.jump > ep.near + 0.04, ep);
  // rewards & records
  const w0 = await E(() => { const s = __game.GAME.S; return { c: s.coins, w: s.friends.mosq.w, l: s.friends.mosq.l }; });
  await sim('d_gym', 'skilled', 999, 150); await adv(2200);
  const w1 = await E(() => { const s = __game.GAME.S; return { c: s.coins, w: s.friends.mosq.w, l: s.friends.mosq.l, modal: !!document.querySelector('#r-again'), title: document.querySelector('.mbox h2').textContent }; });
  await page.waitForTimeout(500); await page.screenshot({ path: '/data/game/test/gallery/fr_duel_result.png' }); await finish();
  ok('duel win → +8 coins (baby), win recorded, «Реванш» offered', w1.w === w0.w + 1 && w1.l === w0.l && w1.c - w0.c >= 8 && w1.modal && w1.title === 'Победа!', { w0, w1 });
  const pz = await E(() => { const { MINI, GAME } = __game, s = GAME.S; const before = JSON.stringify(s.friends.pusya); MINI.start('d_catch', 1); window.advanceTime(2000); MINI.pause(); document.querySelector('#p-exit').click(); return { same: JSON.stringify(s.friends.pusya) === before, scene: window.APP ? APP.scene : null }; });
  ok('pause → exit a duel: not counted', pz.same, pz);
  ok('achievements: Лучшие друзья after chatting with all four', await E(() => { const { FRIENDS, GAME } = __game; FRIENDS.chat('monty'); FRIENDS.chat('mosq'); const b3 = !!GAME.S.ach.bff; FRIENDS.chat('zhuk'); return !b3 && !!GAME.S.ach.bff; })); // Round 7 #2: + Жучок
  // duel screenshots for the gallery
  for (const gid of ['d_catch', 'd_bongo', 'd_gym']) { await E((gid) => { __game.MINI.seed(42); __game.MINI.start(gid, 1); window.advanceTime(gid === 'd_bongo' ? 2600 : 4500); }, gid); await shot('duel_' + gid); await page.waitForTimeout(700); await page.screenshot({ path: '/data/game/test/gallery/fr_hud_' + gid + '.png' }); await E(() => __game.MINI.home()); }
  // duel intro modal
  await E(() => __game.MINI.duelIntro('monty')); await adv(100); await page.waitForTimeout(500); await page.screenshot({ path: '/data/game/test/gallery/fr_duel_intro.png' }); await E(() => __game.UI.closeModal());

  // 8. teddy migration: old save with the bear → refund 90 coins, bear gone
  const save = await E(() => { const s = JSON.parse(JSON.stringify(__game.GAME.S)); s.owned.teddy = 1; s.home.items.teddy = 1; s.coins = 100; return JSON.stringify(s); });
  await page.addInitScript((sv) => { if (!sessionStorage.getItem('mig')) { sessionStorage.setItem('mig', '1'); localStorage.setItem('martyn_tamagotchi_v1', sv); } }, save);
  await page.reload(); let m = null;
  for (let i = 0; i < 20; i++) { await page.waitForTimeout(300); m = await E(() => { const s = __game.GAME.S; return { coins: s.coins, owned: !!s.owned.teddy, item: !!s.home.items.teddy, toast: [...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' | ') }; }); if (/подушки/.test(m.toast)) break; }
  ok('old save with the teddy: +90 coins, bear removed, toast explains', m.coins >= 190 && m.coins < 260 && !m.owned && !m.item && /подушки/.test(m.toast), m);

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
  console.log(fails ? 'PROBE FAIL ' + fails : 'ALL PASS');
  await browser.close(); process.exit(fails || errs.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
