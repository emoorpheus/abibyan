'use strict';
// ===== Mini-games: framework + 5 games starring the monkey =====
const MINI = (() => {
  const RW = 180, RH = 320; const S = () => GAME.S;
  const pick = (a) => a[Math.floor(Math.random() * a.length)], rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fx = FX.make(); const cache = {}; const once = (k, fn) => cache[k] || (cache[k] = fn());
  const SPX = (w, h, d, dc) => MONKEY.sprite(w, h, d, dc); const IT = MONKEY.K.IT;
  let G = null, st = null, gT = 0, quiet = false;
  const snd = (n, a) => { if (!quiet) AUDIO.play(n, a); }, laterSfx = (ms, n, okFn) => { const cur = G; setTimeout(() => { if (G && G === cur && st && !st.paused && !UI.hasModal() && (!okFn || okFn())) snd(n); }, ms); }, msg = (a, b) => { if (!quiet) UI.gmsg(a, b); }, tip = (t) => { if (!quiet) UI.gtip(t); }, flt = (x, y, t, i) => { if (!quiet) UI.float(x, y, t, i); };
  const coinsFor = (L) => 1 + Math.floor((L - 1) / 4);
  const pay = (gid) => (DATA.GAMES.find((g) => g.id === gid) || {}).pay || 1;
  const coinWord = (n) => { const a = n % 10, b = n % 100; return (a === 1 && b !== 11) ? 'монета' : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? 'монеты' : 'монет'; };
  const fat = () => Math.round(GAME.fat() * 50) / 50;
  // Round 10 #7: he is his age's size in the games too. A game was drawn for the grown-up (home s 0.621) at its own s0;
  // now s0 follows his age and never gets bigger than he is at home (+10 %). Super / race keep their hitbox-sized hero (fixed).
  const AGE_REF = 0.621;
  function GS(s0) { const h = GAME.ageDef().s; return Math.min(s0 * h / AGE_REF, h * 1.1); }
  const GK = (s0) => GS(s0) / s0; // how much smaller than designed (1 = the grown-up's size)
  function mp(s, o, fixed) { if (!fixed) s = GS(s); return Object.assign({ s, age: GAME.ageDef().age, f: fat(), cloth: Object.assign({}, S().wear), pose: 'idle', legs: 'stand', eyes: { mode: 'open' }, mouth: 'smile', tail: (Math.floor(gT * 2.6) % 8) * (Math.PI / 4) }, o); }
  function drawM(ctx, p, x, y) { const sp = SPR.get(p, 'game'); ctx.drawImage(sp.cv, Math.round(x - sp.ox), Math.round(y - sp.oy)); return sp; }
  const tile = (w, h, fn) => { const c = PX.canvas(w, h); fn(Painter(c.getContext('2d')), c.getContext('2d')); return c; };

  // ---------- shared art ----------
  const ARTG = {
    gold: () => once('gold', () => { const src = ART.food('banana'), c = PX.canvas(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); const id = x.getImageData(0, 0, c.width, c.height), d = id.data; const ramp = [[168, 98, 18], [222, 156, 32], [252, 204, 62], [255, 236, 140], [255, 252, 222]]; for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const l = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255; if (l < 0.25) continue; const k = Math.min(4, Math.floor((l - 0.25) / 0.75 * 5)); d[i] = ramp[k][0]; d[i + 1] = ramp[k][1]; d[i + 2] = ramp[k][2]; } x.putImageData(id, 0, 0); return c; }),
    coconut: () => once('coco', () => SPX(15, 15, (a) => { a.ell(7.5, 7.5, 6.6, 6.4, IT, a.mat('coco', '#7a5236', 1)); }, (d) => { d.px(5, 5, '#2a1a10'); d.px(9, 5, '#2a1a10'); d.px(7, 8, '#2a1a10'); d.px(5, 4, '#b08a5a'); })),
    bee: () => once('bee', () => SPX(16, 13, (a) => { a.ell(8.5, 7.5, 6.4, 4.6, IT, a.mat('bee', '#ffd23a')); }, (d) => { for (let y = 3; y < 12; y++) { d.pxk(7, y, '#2a1a10', 1 << 20); d.pxk(10, y, '#2a1a10', 1 << 20); } d.px(3, 6, '#2a1a10'); d.px(15, 8, '#2a1a10'); d.px(4, 6, '#ffffff'); })),
    bunch: () => once('bunch', () => { const b = ART.food('banana'), c = PX.canvas(24, 22), x = c.getContext('2d'); x.drawImage(b, 0, 4); x.drawImage(b, 8, 6); x.drawImage(b, 4, 0); return c; }),
    balloon: () => once('balloon', () => SPX(24, 29, (a) => { const m = a.mat('balloon', '#ef4d6a'); a.ell(12, 11.5, 10, 11, IT, m); a.poly([[10, 22], [14, 22], [12, 25.5]], IT, m); }, (d) => { d.px(7, 6, '#ffffff'); d.px(8, 5, '#ffffff'); d.px(7, 7, '#ffd0da'); d.px(9, 5, '#ffd0da'); })),
    drum: (i, lit) => once('drum' + i + (lit ? 'L' : ''), () => { const cols = ['#e0483e', '#f0b830', '#4fb04a', '#3f86d8']; const c = lit ? PX.shade(cols[i], 1.25) : cols[i];
      return SPX(38, 42, (a) => { const wood = a.mat('drumB' + i + (lit ? 'L' : ''), c, 2); a.rbox(5, 10, 33, 40, 4, IT, wood); a.ell(19, 10.5, 14.5, 5, IT, a.mat('drumT' + (lit ? 'L' : ''), lit ? '#fff6d8' : '#f0dcb0')); }, (d) => { for (let x = 6; x <= 32; x++) { d.pxk(x, 21, '#3b2433', 1 << 20); d.pxk(x, 31, '#3b2433', 1 << 20); } for (let k = 0; k < 4; k++) { const x = 9 + k * 7; d.pxk(x, 20, '#e8e0c8', 1 << 20); d.pxk(x, 30, '#e8e0c8', 1 << 20); } }); }),
  };

  // ---------- framework ----------
  function intro(gid) {
    const g = DATA.GAMES.find((x) => x.id === gid); if (!g) return; const s = S(); const best = s.best[gid] || 0;
    if (!canGo(gid)) return;
    if (!GAME.ageOK(g)) { UI.toast(`Игра откроется на этапе «${DATA.AGES[g.age].name}»`, UI.I('sprout')); return; }
    if (s.st.energy < 10) { const l = pick(DATA.LINES.tooTired); UI.toast(l + ' Сначала поспи.', UI.I('energy')); HOME.say(l, 'sad'); return; }
    const cps = [1]; for (let L = 6; L <= best; L += 5) cps.push(L); let chosen = cps[cps.length - 1];
    const shot = snapshot(gid);
    const w = UI.modal(`<h2>${g.name}</h2><img class="photo" src="${shot}" alt=""><p>${g.desc}</p><p style="opacity:.75">Рекорд: ${best ? 'ур. ' + best : '—'} · ${HINT[gid]}</p>
      ${cps.length > 1 ? `<p>Начать с уровня:</p><div class="bt" id="cps">${cps.map((L) => `<button class="btn sm ${L === chosen ? 'g' : 'w'}" data-l="${L}">${L}</button>`).join('')}</div>` : ''}
      <div class="bt"><button class="btn g" id="g-go">Играть</button><button class="btn w" data-close>Назад</button></div>`, { dismiss: true });
    w.querySelectorAll('[data-l]').forEach((b) => b.onclick = () => { snd('tab'); chosen = +b.dataset.l; w.querySelectorAll('[data-l]').forEach((x) => { x.classList.toggle('g', x === b); x.classList.toggle('w', x !== b); }); });
    w.querySelector('#g-go').onclick = () => { snd('click'); UI.closeModal(w); start(gid, chosen); };
  }
  const HINT = { catch: 'веди пальцем или ← →; прыжок — смахни вверх, тапни по Абибяну или ↑', vine: 'держи палец слева/справа или ← →', balloon: 'тапай или пробел', bongo: 'тапай барабаны или 1–4', gym: 'тапай или пробел', stack: 'тапай или пробел — ящик падает', super: 'тапай — прыжок, держи — выше', race: 'веди пальцем или ← →', roofs: 'тапай — прыжок, держи — выше, тап в воздухе — кувырок' };
  const MAXH = { catch: 3, vine: 3, balloon: 1, bongo: 3, gym: 3, stack: 3, super: 3, race: 3, roofs: 3 };
  // Round 6 E / Round 7 #4: no game (or duel) before the tutorial is done and the phone is bought; a computer game needs its computer.
  // Checked at every way in (the sheets, the intro, a friend's duel button, «Ещё раз», MINI.start) — true = may play
  function canGo(gid) { // false (with a toast) while the games are locked or this one needs a better device
    if (!GAME.gamesOpen()) { UI.toast(GAME.hasPhone() ? 'Сначала пройди обучение!' : 'Сначала купи телефон — игры в нём!', UI.I('phone')); return false; }
    if (!DUEL(gid) && !GAME.devOK(gid)) { const d = GAME.gameDev(gid); UI.toast('Нужен: ' + DATA.DEV_NAME[d], UI.I('pc')); return false; }
    return true;
  }
  // ---------- friend duels (seeded rng so AI behaviour is testable) ----------
  let seed = 0, rng = Math.random;
  const mul = (a) => () => { a = (a + 0x6D2B79F5) | 0; let q = Math.imul(a ^ (a >>> 15), 1 | a); q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q; return ((q ^ (q >>> 14)) >>> 0) / 4294967296; };
  const mix = (x) => { x = Math.imul(x ^ (x >>> 16), 0x45d9f3b); x = Math.imul(x ^ (x >>> 16), 0x45d9f3b); return (x ^ (x >>> 16)) >>> 0; }; // scramble small seeds (mulberry32 correlates them)
  const DUEL = (gid) => DATA.DUELS.find((d) => d.id === gid), stg = () => Math.round((S().grow.stage || 0) * 4 / (DATA.AGES.length - 1)); // 7 growth stages → duel difficulty 0..4
  const fname = (fid) => DATA.FRIENDS[fid].short || DATA.FRIENDS[fid].name;
  function duelIntro(fid) {
    const D = DATA.DUELS.find((d) => d.fid === fid), s = S(), rec = s.friends[fid] || {}; if (!D) return;
    if (!canGo(D.id)) return;
    if (s.st.energy < 10) { const l = pick(DATA.LINES.tooTired); UI.toast(l + ' Сначала поспи.', UI.I('energy')); HOME.say(l, 'sad'); return; }
    const shot = snapshot(D.id);
    const w = UI.modal(`<h2>${D.name}</h2><div class="duo"><img class="px" src="${HOME.portrait()}" alt=""><b>VS</b><img src="${FART.portrait(fid)}" alt=""></div><img class="photo" src="${shot}" alt=""><p>${D.desc}</p>
      <p style="opacity:.75">Побед ${rec.w || 0} · поражений ${rec.l || 0} · ${D.hint}</p><div class="bt"><button class="btn g" id="d-go">Дуэль!</button><button class="btn w" data-close>Назад</button></div>`, { dismiss: true });
    w.querySelector('#d-go').onclick = () => { snd('click'); UI.closeModal(w); start(D.id, 1); };
    return w;
  }
  function start(gid, L0) {
    const s = S(); if (!canGo(gid)) { if (G) home(); return; }
    if (s.st.energy < 10) { home(); UI.toast(pick(DATA.LINES.tooTired), UI.I('energy')); return; }
    HOME.pause(); UI.reset(); APP.setScene('game'); fx.clear(); gT = 0;
    const D = DUEL(gid);
    AUDIO.track(AUDIO.TRACKS[gid] ? gid : D && AUDIO.TRACKS[D.base] ? D.base : D ? 'stack' : 'home'); // Round 10 #6: every game has its own tune (Ключики — the swing one)
    st = { gid, level: L0, start: L0, coins: 0, done: 0, hearts: MAXH[gid] || 0, maxH: MAXH[gid] || 0, prog: 0, over: false, overT: 0, paused: false, shake: 0, kg0: s.kg };
    st.seed = seed || ((Date.now() ^ (Math.random() * 1e9)) >>> 0); seed = 0; // Round 7 #6: every run has a seed (duels: the AI, «Супер Абибян»: the levels)
    if (D) { st.duel = { fid: D.fid, me: 0, fr: 0, first: D.first || 0, win: null, stage: stg() }; rng = mul(mix(st.seed)); }
    UI.gameHud(true, { hint: HINT[gid] || (D && D.hint), duel: D ? { a: s.name, f: fname(D.fid) } : null }); G = GAMES[gid](); G.init(L0); sync();
    if (D) msg(D.name, (DATA.FRIENDS[D.fid].she ? 'соперница: ' : 'соперник: ') + fname(D.fid)); else { const g = DATA.GAMES.find((x) => x.id === gid); msg(g.name, 'Уровень ' + L0); } snd('whoosh');
  }
  function sync() { if (st && !quiet && st.duel) { UI.gameHudSet({ duel: st.duel }); return; } if (st && !quiet) UI.gameHudSet({ level: st.level, prog: st.prog, coins: st.coins, hearts: st.hearts, maxH: st.maxH }); }
  const api = {
    levelUp() { if (!st || st.over) return; const c = coinsFor(st.level) * pay(st.gid); /* Round 7 #6: console games pay more */ st.coins += c; st.done++; st.level++; st.prog = 0; snd('level'); msg('Уровень ' + st.level + '!', `+${c} ${coinWord(c)}`);
      for (let i = 0; i < 18; i++) fx.spawn('confetti', rnd(10, 170), rnd(40, 90), { c: pick(['#ff5c6c', '#ffd23a', '#3fdc7a', '#59c1ff', '#b48cff']), vx: rnd(-30, 30), vy: rnd(-10, 40), g: 80, drag: 0.8, life: rnd(1.2, 2), wob: 5 });
      if (G.onLevel) G.onLevel(st.level); sync(); },
    hurt() { if (!st || st.over) return true; st.hearts--; st.shake = 0.25; snd('hit'); sync(); if (st.hearts <= 0) { api.over(); return true; } return false; },
    heal() { if (!st) return; if (st.hearts < st.maxH) { st.hearts++; snd('happy'); sync(); } },
    bonus(n, x, y) { if (!st) return; st.coins += n; snd('coin'); if (x !== undefined) flt(x, y, '+' + n, UI.I('coin')); sync(); },
    prog(v) { if (!st) return; st.prog = clamp(v, 0, 1); sync(); },
    over() { if (!st || st.over) return; st.over = true; st.overT = 1.3; snd('fail'); if (G.onOver) G.onOver(); },
    get level() { return st ? st.level : 1; }, get hearts() { return st ? st.hearts : 0; }, get over_() { return st && st.over; },
    // duels: points for 'me' | 'fr'; first to d.first wins
    duelPts(who, n) { if (!st || st.over || !st.duel) return; st.duel[who] += n; sync(); if (st.duel.first && st.duel[who] >= st.duel.first) api.duelEnd(who === 'me'); },
    duelEnd(win) { if (!st || st.over || !st.duel) return; st.over = true; st.overT = 1.7; st.duel.win = !!win; snd(win ? 'level' : 'fail'); const F = DATA.FRIENDS[st.duel.fid]; msg(win ? 'Победа!' : fname(st.duel.fid) + (F.she ? ' победила!' : ' победил!')); if (G.onOver) G.onOver(); },
    get duel() { return st && st.duel; }, rng: () => rng(), seed: () => (st && st.seed) || 1, get st0() { return st ? st.start : 1; },
  };
  function update(dt) {
    if (!G || !st) return; if (st.paused || UI.hasModal()) return; gT += dt;
    if (st.shake > 0) st.shake -= dt; G.update(dt); fx.update(dt);
    if (st.over && st.overT > 0) { st.overT -= dt; if (st.overT <= 0) results(); }
  }
  function drawFloorExt(ctx, P, gid, ch) {
    if (ch <= RH) return;
    const eh = ch - RH;
    if (gid === 'catch' || gid === 'd_catch') {
      P.r(0, RH, RW, eh, '#8a5a3a');
      for (let k = 0; k < Math.round(eh * 1.5); k++) {
        P.p(Math.floor(PX.hash(k, 5, 4) * RW), RH + Math.floor(PX.hash(k, 6, 4) * eh), k % 3 ? '#a87a52' : '#6b4423');
      }
    } else if (gid === 'bongo' || gid === 'd_bongo') {
      P.r(0, RH, RW, eh, '#7a4a26');
      for (let y = RH; y < ch; y += 8) P.hl(0, y, RW, '#5a361a');
      for (let k = 0; k < 14; k++) {
        const yOff = RH + (k % Math.max(1, Math.floor(eh / 8))) * 8;
        P.vl((k * 29 + 17) % RW, yOff, 8, '#5a361a');
      }
    } else if (gid === 'gym' || gid === 'd_gym') {
      P.r(0, RH, RW, eh, '#3a3a44');
      for (let y = RH; y < ch; y += 21) P.hl(0, y, RW, '#2a2a32');
      for (let i = 0; i < RW; i += 30) P.vl(i, RH, eh, '#2a2a32');
      for (let k = 0; k < Math.round(eh * 0.8); k++) {
        P.p(Math.floor(PX.hash(k, 5, 3) * RW), RH + Math.floor(PX.hash(k, 6, 3) * eh), '#4c4c58');
      }
    } else if (gid === 'd_keys') {
      P.r(0, RH, RW, eh, '#b88a58');
      for (let y = RH + 6; y < ch; y += 9) P.hl(0, y, RW, '#a07444');
      for (let k = 0; k < 16; k++) P.vl((k * 37 + (k % 3) * 11) % RW, RH + (k % 6) * 9 + 1, 8, '#a07444');
    } else if (gid === 'balloon') {
      P.r(0, RH, RW, eh, '#6b4423');
      for (let k = 0; k < Math.round(eh * 0.8); k++) {
        P.p(Math.floor(PX.hash(k, 1, 4) * RW), RH + Math.floor(PX.hash(k, 2, 4) * eh), '#8a5a3a');
      }
    }
  }
  function render(ctx) {
    if (!G) return;
    const cvEl = ctx.canvas;
    const ch = (cvEl && cvEl.height) || RH;
    ctx.clearRect(0, 0, RW, ch);
    const P = Painter(ctx);
    ctx.save();
    if (st && st.shake > 0) ctx.translate(Math.round(rnd(-2, 2)), Math.round(rnd(-2, 2)));
    G.render(ctx, P);
    fx.draw(ctx, P, 0);
    ctx.restore();
    if (ch > RH) drawFloorExt(ctx, P, st ? st.gid : '', ch);
  }
  function results() {
    if (st.duel) return duelResults();
    const s = S(), g = DATA.GAMES.find((x) => x.id === st.gid); const prev = s.best[st.gid] || 0; const kg0 = s.kg;
    GAME.gameReward(st.gid, st.done, st.coins, st.level); const rec = st.level > prev && st.done > 0; const lost = kg0 - s.kg;
    const tr = typeof TOUR !== 'undefined' ? TOUR.onResult(st.gid, st.level) : null; // Round 18: the game of the week → his place in the tournament
    const w = UI.modal(`<h2>${rec ? 'Новый рекорд!' : 'Игра окончена'}</h2><img class="px hero" src="${HOME.portrait()}" alt="">
      <div class="kv"><span>Игра</span><b>${g.name}</b><span>Уровень</span><b>${st.level}</b><span>Пройдено уровней</span><b>${st.done}</b><span>Рекорд</span><b>ур. ${Math.max(prev, st.level)}</b></div>
      <div class="big">${UI.im(UI.I('coin'))}+${st.coins}</div>${lost > 0.01 ? `<p>Сброшено ${(Math.round(lost * 100) / 100).toString().replace('.', ',')} кг</p>` : ''}${tr ? `<p class="tour">${UI.im(UI.I('trophy'))}Турнир недели: ${tr.place}-е место</p>` : ''}
      <div class="bt"><button class="btn g" id="r-again">Ещё раз</button><button class="btn w" id="r-home">Домой</button></div>`);
    if (rec) snd('star');
    const gid = st.gid, L0 = st.start; G.done = true;
    w.querySelector('#r-again').onclick = () => { snd('click'); UI.closeModal(w); start(gid, L0); };
    w.querySelector('#r-home').onclick = () => { snd('click'); UI.closeModal(w); home(); };
  }
  function duelResults() {
    const d = st.duel, Fd = DATA.FRIENDS[d.fid], coins = d.win ? 8 + 2 * d.stage : 2; GAME.duelReward(d.fid, d.win, coins);
    const w = UI.modal(`<h2>${d.win ? 'Победа!' : fname(d.fid) + (Fd.she ? ' победила!' : ' победил!')}</h2><div class="duo"><img class="px" src="${HOME.portrait()}" alt=""><b>${d.me} : ${d.fr}</b><img src="${FART.portrait(d.fid)}" alt=""></div>
      <p>${fname(d.fid)}: «${d.win ? Fd.lose : Fd.win}»</p><div class="big">${UI.im(UI.I('coin'))}+${coins}</div>
      <div class="bt"><button class="btn g" id="r-again">Реванш</button><button class="btn w" id="r-home">Домой</button></div>`);
    if (d.win) { snd('star'); for (let i = 0; i < 24; i++) fx.spawn('confetti', rnd(10, 170), rnd(30, 80), { c: pick(['#ff5c6c', '#ffd23a', '#3fdc7a', '#59c1ff', '#b48cff']), vx: rnd(-30, 30), vy: rnd(-10, 40), g: 80, drag: 0.8, life: rnd(1.2, 2), wob: 5 }); }
    const gid = st.gid; G.done = true;
    w.querySelector('#r-again').onclick = () => { snd('click'); UI.closeModal(w); start(gid, 1); };
    w.querySelector('#r-home').onclick = () => { snd('click'); UI.closeModal(w); home(); };
  }
  function home() { AUDIO.track('home'); G = null; st = null; fx.clear(); const gm = document.getElementById('gmsg'); if (gm) gm.remove(); UI.gameHud(false); APP.setScene('home'); UI.setBar(HOME.room); UI.refresh(); }
  function pause() {
    if (!st || st.over || st.paused) return; st.paused = true; const g = DATA.GAMES.find((x) => x.id === st.gid) || DUEL(st.gid);
    const w = UI.modal(`<h2>Пауза</h2>${st.duel ? `<p>${g.name} · счёт ${st.duel.me} : ${st.duel.fr}</p><p style="opacity:.75">Если выйти — дуэль не засчитается.</p>` : `<p>${g.name} · уровень ${st.level}</p><p>Заработано: ${st.coins} ${coinWord(st.coins)}</p>`}<div class="bt"><button class="btn g" id="p-go">Продолжить</button><button class="btn r" id="p-exit">Выйти</button></div>`);
    w.querySelector('#p-go').onclick = () => { snd('click'); UI.closeModal(w); if (st) st.paused = false; };
    w.querySelector('#p-exit').onclick = () => { snd('click'); UI.closeModal(w); if (st.duel) { home(); return; } const c = st.coins; GAME.gameReward(st.gid, st.done, st.coins, st.level); if (typeof TOUR !== 'undefined') TOUR.onResult(st.gid, st.level); home(); if (c) UI.toast(`+${c} ${coinWord(c)} за игру`, UI.I('coin')); };
  }
  function snapshot(gid) {
    try {
      const keepG = G, keepSt = st, keepR = rng; quiet = true; st = { gid, level: 1, start: 1, coins: 0, done: 0, hearts: 3, maxH: 3, prog: 0, over: false, overT: 0, paused: false, shake: 0 };
      const D = DUEL(gid); if (D) { st.duel = { fid: D.fid, me: 0, fr: 0, first: D.first || 0, win: null, stage: stg() }; rng = mul(mix(7)); }
      const g = GAMES[gid](); g.init(1); if (g.demo) g.demo(); for (let i = 0; i < 40; i++) g.update(1 / 60);
      const c = PX.canvas(RW, RH), x = c.getContext('2d'); g.render(x, Painter(x)); G = keepG; st = keepSt; rng = keepR; quiet = false;
      const o = PX.canvas(RW, 120), ox = o.getContext('2d'); ox.drawImage(c, 0, g.snapY || 170, RW, 120, 0, 0, RW, 120); fx.clear(); return o.toDataURL();
    } catch (e) { quiet = false; console.error(e); return UI.I('game'); }
  }
  // input routing
  const down = (x, y) => { if (G && st && !st.over && !st.paused && G.down) G.down(x, y); };
  const move = (x, y) => { if (G && st && !st.over && !st.paused && G.move) G.move(x, y); };
  const up = (x, y) => { if (G && st && G.up) G.up(x, y); };
  const key = (k, d) => { if (k === 'Escape' && d) { pause(); return; } if (G && st && !st.over && !st.paused && G.key) G.key(k, d); };

  // =====================================================================
  // 1) Банановый ливень — catch falling bananas
  // =====================================================================
  function bgCatch() { return once('bgCatch', () => tile(RW, RH, (P, x) => {
    ROOMS.vgrad(P, 0, 0, RW, 250, ['#64b8ec', '#86ccf0', '#acdef6', '#d2effa']);
    x.globalAlpha = 0.5; P.circ(142, 56, 20, '#fff6c8'); x.globalAlpha = 1; P.circ(142, 56, 13, '#ffe066'); P.circ(139, 53, 6, '#fff3a8');
    ROOMS.cloud(P, 36, 60, 0.9); ROOMS.cloud(P, 100, 96, 0.7); ROOMS.cloud(P, 160, 128, 0.6);
    for (let i = 0; i < RW; i++) { const h = Math.round(196 + Math.sin(i / 21) * 9 + Math.sin(i / 7.3) * 3); P.vl(i, h, 60, '#9bd38a'); P.p(i, h, '#b8e4a4'); }
    for (let i = 0; i < RW; i++) { const h = Math.round(226 + Math.sin(i / 29 + 2) * 7 + Math.sin(i / 11) * 2); P.vl(i, h, 70, '#6fbd5c'); P.p(i, h, '#8fd078'); }
    const tr = ROOMS.fur('tree', ROOMS.FUR.tree); x.drawImage(tr, -38, 104); x.save(); x.translate(RW, 0); x.scale(-1, 1); x.drawImage(tr, -40, 118); x.restore();
    P.r(0, 288, RW, 32, '#5fae45'); for (let i = 0; i < RW; i += 3) P.vl(i, 285 + (i * 7 % 3), 3, '#7cc85a'); P.r(0, 298, RW, 22, '#8a5a3a'); P.hl(0, 298, RW, '#6b4423');
    for (let k = 0; k < 24; k++) P.p(Math.floor(PX.hash(k, 1, 4) * RW), 302 + Math.floor(PX.hash(k, 2, 4) * 16), k % 3 ? '#a87a52' : '#6b4423');
  })); }
  // Round 13c: a jump for the banana games (solo and the duel): ↑ / W / пробел, a swipe up, or a quick tap on Абибян.
  // In the air his hands reach higher (the catch zone rises with him) — his answer to quick Пуся. After landing a short rest
  // (a press in its last 0.25 s waits and fires — not lost); in the air he steers slower. Balanced in tools/duelbal.js.
  const JMP = { T: 0.5, H: 20, CD: 0.6, AIR: 0.4 };
  function jumper(m, canJump, Y) {
    m.jt = 0; m.cd = 0; m.jq = 0; let sx = null, sy = null, movedX = false;
    const dust = () => { for (let k = 0; k < 4; k++) fx.spawn('crumb', m.x + rnd(-9, 9), Y + 1, { c: '#b9a37a', vx: rnd(-34, 34), vy: rnd(-34, -10), g: 220, life: 0.35, floor: Y + 3 }); };
    const J = {
      h: () => (m.jt > 0 ? JMP.H * Math.sin(Math.PI * (1 - m.jt / JMP.T)) : 0),
      press() { if (!canJump() || m.jt > 0) return; if (m.cd > 0) { m.jq = 0.25; return; } m.jt = JMP.T; m.jq = 0; snd('jump'); dust(); },
      tick(dt) { if (m.jt > 0) { m.jt -= dt; if (m.jt <= 0) { m.jt = 0; m.cd = JMP.CD; dust(); } } else if (m.cd > 0) m.cd -= dt; if (m.jq > 0) { m.jq -= dt; if (m.cd <= 0) J.press(); } },
      stop() { if (m.jt > 0) { m.jt = 0; m.cd = JMP.CD; } m.jq = 0; },
      down(x, y) { sx = x === undefined ? null : x; sy = y === undefined ? null : y; movedX = false; },
      move(x, y) {
        if (y === undefined || sy === null) return;
        if (sx !== null && Math.abs(x - sx) > 12) movedX = true;
        if (!movedX && (sy - y) > 36 && Math.abs(x - (sx !== null ? sx : x)) < 16) {
          J.press();
          sy = y;
          movedX = true;
        }
      },
      up() { sx = null; sy = null; movedX = false; },
      key(k, d) { if (d && (k === 'ArrowUp' || k === 'KeyW' || k === 'Space')) J.press(); },
    };
    return J;
  }
  function Catch() {
    let m, items, spawnT, caught, need, stun, keys = {}, target = null, faceT = 0, faceE = null, K = 1, J = null;
    const Y = 292;
    const g = {
      snapY: 180,
      init(L) { m = { x: 90, vx: 0, step: 0 }; items = []; spawnT = 0.8; stun = 0; K = GK(0.7); J = jumper(m, () => !api.over_ && stun <= 0, Y); setup(L); },
      zone: () => [Y - 76 * K, Y - 34 * K, (18 + 10 * GAME.fat()) * (0.5 + 0.5 * K)], // Round 10 #7 & Round 59: generous reach for edge-to-edge catching
      get jy() { return J ? J.h() : 0; }, get m() { return m; }, get items() { return items; },
      onLevel(L) { setup(L); api.heal(); },
      demo() { items.push({ type: 'banana', x: 70, y: 210, vy: 0, ph: 0 }, { type: 'coconut', x: 130, y: 190, vy: 0, ph: 0 }, { type: 'gold', x: 40, y: 230, vy: 0, ph: 0 }); },
      update(dt) {
        const L = api.level, f = GAME.fat();
        spawnT -= dt; if (spawnT <= 0 && !api.over_) { spawn(L); spawnT = Math.max(0.32, 0.95 - L * 0.045) * rnd(0.7, 1.3); }
        const sp = 165 * (1 - 0.3 * f); let dir = (keys.R ? 1 : 0) - (keys.L ? 1 : 0); if (dir) target = null;
        const spA = sp * (m.jt > 0 ? JMP.AIR : 1);
        if (stun > 0) { stun -= dt; m.vx = 0; } else if (target !== null) { const d = target - m.x; m.vx = Math.sign(d) * Math.min(Math.abs(d) * 12, spA); } else m.vx = dir * spA;
        if (api.over_) m.vx = 0; m.x = clamp(m.x + m.vx * dt, 6, 174); if (Math.abs(m.vx) > 25) m.step += dt; if (faceT > 0) faceT -= dt; J.tick(dt);
        const hw = (18 + 10 * f) * (0.5 + 0.5 * K), jy = J.h();
        const atLeft = m.x <= 16, atRight = m.x >= 164;
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i]; it.y += it.vy * dt; if (it.type === 'bee') it.x = clamp(it.x0 + Math.sin(gT * 3 + it.ph) * 26, 8, 172);
          const caught = (Math.abs(it.x - m.x) < hw) || (atLeft && it.x <= m.x + hw) || (atRight && it.x >= m.x - hw);
          if (!api.over_ && it.y > Y - 76 * K - jy && it.y < Y - 34 * K - jy && caught) { items.splice(i, 1); got(it); continue; }
          if (it.y > Y + 6) { items.splice(i, 1); if (it.type === 'banana' || it.type === 'bunch') for (let k = 0; k < 4; k++) fx.spawn('crumb', it.x, Y + 2, { c: '#f4d03a', vx: rnd(-30, 30), vy: rnd(-50, -20), g: 300, life: 0.5, floor: Y + 4 }); if (it.type === 'coconut') { snd('hit'); fx.spawn('crumb', it.x, Y, { c: '#7a5236', sz: 2, vx: rnd(-20, 20), vy: -40, g: 300, life: 0.6, floor: Y + 4 }); } }
        }
      },
      render(ctx, P) {
        ctx.drawImage(bgCatch(), 0, 0);
        for (const it of items) drawItem(ctx, P, it);
        const f = GAME.fat(), jy = J.h(); P.shadow(m.x, Y + 1, (14 + 8 * f) * K * (1 - jy / 60), 3, 0.25 - jy / 200);
        let near = null; for (let i = 0; i < items.length; i++) { const it = items[i]; if (it.type !== 'coconut' && it.type !== 'bee') { if (!near || it.y > near.y) near = it; } }
        const p = mp(0.7, { pose: 'catch' }); if (near) p.eyes.look = [Math.abs(near.x - m.x) < 8 ? 0 : Math.sign(near.x - m.x), -1];
        if (Math.abs(m.vx) > 25) p.legs = (Math.floor(m.step * 9) % 2) ? 'spread' : 'kick';
        if (stun > 0) { p.eyes = { mode: 'dizzy' }; p.mouth = 'wavy'; p.pose = 'fall'; } else if (faceT > 0) { p.eyes = faceE === 'happy' ? { mode: 'happy' } : { mode: 'wide' }; p.mouth = 'laugh'; }
        if (jy > 0 && stun <= 0) { p.pose = 'up'; p.legs = 'tuck'; }
        if (api.over_) { p.eyes = { mode: 'closed' }; p.mouth = 'frown'; p.pose = 'idle'; p.tear = 1; }
        drawM(ctx, p, m.x, Y - Math.round(jy));
        if (stun > 0) for (let i = 0; i < 3; i++) { const a = gT * 5 + i * 2.1; ctx.drawImage(FX.G.star, Math.round(m.x + Math.cos(a) * 12 - 3), Math.round(Y - 70 * K + Math.sin(a) * 3 - 3)); }
      },
      down(x, y) { target = x; J.down(x, y); }, move(x, y) { if (target !== null) target = x; J.move(x, y); }, up() { target = null; J.up(); },
      key(k, d) { if (k === 'ArrowLeft' || k === 'KeyA') keys.L = d; if (k === 'ArrowRight' || k === 'KeyD') keys.R = d; J.key(k, d); },
    };
    function setup(L) { caught = 0; need = 8 + 2 * L; api.prog(0); }
    function spawn(L) {
      const r = Math.random(), bad = Math.min(0.42, 0.1 + L * 0.03); let type = 'banana';
      if (r < bad) type = (L >= 4 && Math.random() < 0.4) ? 'bee' : 'coconut';
      else if (r < bad + 0.04) type = 'gold'; else if (L >= 3 && r < bad + 0.1) type = 'bunch';
      const v = Math.min(235, (68 + L * 8) * rnd(0.85, 1.15)) * (type === 'bee' ? 0.7 : 1); const x = rnd(8, 172);
      items.push({ type, x, x0: x, y: -14, vy: v, ph: rnd(0, 6) });
    }
    function got(it) {
      if (it.type === 'coconut' || it.type === 'bee') { stun = 0.75; J.stop(); for (let k = 0; k < 5; k++) fx.spawn('star', m.x + rnd(-10, 10), Y - 66, { vx: rnd(-40, 40), vy: rnd(-60, -20), g: 200, life: 0.6 }); api.hurt(); return; }
      faceT = 0.35; faceE = 'happy';
      if (it.type === 'heart') { api.heal(); fx.spawn('heart', it.x, it.y, { vy: -30, life: 0.8 }); return; }
      caught += it.type === 'bunch' ? 3 : 1; snd('chomp');
      for (let k = 0; k < 3; k++) fx.spawn('spark', it.x + rnd(-6, 6), it.y + rnd(-6, 6), { life: 0.4 });
      if (it.type === 'gold') { api.bonus(1, it.x, it.y - 10); faceE = 'wide'; }
      api.prog(caught / need); if (caught >= need) api.levelUp();
    }
    function drawItem(ctx, P, it) {
      const x = Math.round(it.x), y = Math.round(it.y);
      if (it.type === 'banana') ctx.drawImage(ART.food('banana'), x - 8, y - 8);
      else if (it.type === 'gold') { ctx.drawImage(ARTG.gold(), x - 8, y - 8); if (Math.floor(gT * 8 + it.ph) % 4 === 0) ctx.drawImage(FX.G.spark, x + 3, y - 9); }
      else if (it.type === 'bunch') ctx.drawImage(ARTG.bunch(), x - 12, y - 11);
      else if (it.type === 'coconut') { ctx.drawImage(ARTG.coconut(), x - 7, y - 7); }
      else if (it.type === 'heart') ctx.drawImage(ART.icon('heart'), x - 6, y - 6);
      else if (it.type === 'bee') { ctx.drawImage(ARTG.bee(), x - 8, y - 6); const w = Math.floor(gT * 24) % 2; ctx.globalAlpha = 0.8; P.r(x - 2, y - 8 - w, 3, 2, '#e8f6ff'); P.r(x + 1, y - 8 - w, 3, 2, '#ffffff'); ctx.globalAlpha = 1; }
    }
    return g;
  }

  // =====================================================================
  // 2) Лианы — Doodle-Jump-style climbing
  // =====================================================================
  const VZ = [['#1f5a3a', '#2f7a46', '#4a9a52'], ['#3f8f5a', '#6fbf7a', '#a8dca0'], ['#5ab0ec', '#8fd0f4', '#c8ecfa'], ['#f08a6a', '#f8b880', '#ffe0a0'], ['#1c2250', '#2c3470', '#4a4a90'], ['#0c0818', '#181030', '#2a1a48']];
  // far jungle (trunks + canopy clumps) for depth; tiles vertically, drawn with slow parallax
  const JH = 360;
  function jungle() { return once('vjungle', () => tile(RW, JH, (P, x) => {
    const h = PX.hash, sh = '#0c3320', rim = '#3f8a55';
    for (let k = 0; k < 6; k++) { const tx = Math.floor(8 + h(k, 1, 31) * (RW - 16)), w = 5 + Math.floor(h(k, 2, 31) * 7);
      for (let y = 0; y < JH; y++) { const wob = Math.round(Math.sin((y + k * 47) / 29 * Math.PI * 2 / 2) * 1.5); P.r(tx + wob, y, w, 1, sh); P.p(tx + wob, y, rim); } }
    for (let k = 0; k < 30; k++) { const cx = h(k, 3, 41) * RW, cy = h(k, 4, 41) * JH, r = 7 + h(k, 5, 41) * 11;
      const parts = [[-0.7, 0.15, 0.75], [0, -0.3, 0.85], [0.75, 0.1, 0.7], [0.1, 0.25, 0.9]];
      for (const oy of [-JH, 0, JH]) { if (cy + oy < -r * 2 || cy + oy > JH + r * 2) continue; for (const [a, b, q] of parts) P.ell(cx + a * r - 1, cy + oy + b * r - 1, r * q, r * q * 0.62, rim); for (const [a, b, q] of parts) P.ell(cx + a * r, cy + oy + b * r, r * q, r * q * 0.62, sh); } }
  })); }
  function vineSky(i) { return once('vsky' + i, () => tile(RW, RH, (P) => ROOMS.vgrad(P, 0, 0, RW, RH, VZ[Math.min(VZ.length - 1, i)]))); }
  function Vine() {
    let m, plats, camTop, maxH, nextY, birds, golds, keys = {}, ptr = null, base, lastBird, lastGold, dead, curH = RH;
    const LH = 900, GR = 1000;
    const v0 = () => 520 * (1 - 0.12 * GAME.fat()), jumpH = () => v0() * v0() / (2 * GR);
    const g = {
      snapY: 150,
      init(L) {
        m = { x: 90, y: 290, vx: 0, vy: -v0(), sq: 0, happy: 0 }; camTop = 0; maxH = 0; base = 0; plats = []; birds = []; golds = []; dead = false; lastBird = 0; lastGold = 300;
        plats.push({ x: 90, y: 292, w: 64, type: 'n' }); nextY = 292; fill(); api.prog(0);
      },
      update(dt) {
        const L = api.level, f = GAME.fat(); const sp = 175;
        let dir = (keys.R ? 1 : 0) - (keys.L ? 1 : 0);
        if (ptr) dir = ptr.x < 90 ? -1 : 1;
        const tv = dir * sp; m.vx += (tv - m.vx) * Math.min(1, dt * 10);
        const py = m.y; m.vy = Math.min(600, m.vy + GR * dt); m.y += m.vy * dt; m.x += m.vx * dt;
        if (m.x < -10) m.x += 200; if (m.x > 190) m.x -= 200; if (m.sq > 0) m.sq -= dt; if (m.happy > 0) m.happy -= dt;
        if (!dead && m.vy > 0) for (const p of plats) {
          if (p.broken) continue; if (py <= p.y + 1 && m.y >= p.y && Math.abs(m.x - p.x) < p.w / 2 + 7) {
            if (p.type === 'b') { p.broken = 1; p.vy = 0; snd('crack'); for (let k = 0; k < 4; k++) fx.spawn('crumb', p.x + rnd(-10, 10), p.y, { c: '#8a7a66', sz: 2, vx: rnd(-30, 30), vy: rnd(-20, 20), g: 400, life: 0.8 }); continue; }
            m.y = p.y; m.vy = -v0(); m.sq = 0.12;
            if (p.spring) { m.vy = -v0() * 1.6; snd('spring'); m.happy = 0.9; p.sprT = 0.3; } else snd('jump');
            break;
          }
        }
        for (const p of plats) { if (p.type === 'm') { p.x += p.vx * dt; if (p.x < p.w / 2 + 2 || p.x > RW - p.w / 2 - 2) p.vx *= -1; } if (p.broken) { p.vy += GR * dt; p.y += p.vy * dt; } if (p.sprT > 0) p.sprT -= dt; }
        const sy = m.y - camTop; if (sy < 140) camTop = m.y - 140;
        const h = 292 - m.y; if (h > maxH) maxH = h;
        if (!api.over_) { const pr = (maxH - base) / LH; if (pr >= 1) { base += LH; api.levelUp(); } api.prog((maxH - base) / LH); }
        fill(); plats = plats.filter((p) => p.y < camTop + RH + 60);
        // birds
        if (L >= 3 && maxH - lastBird > Math.max(260, 620 - L * 30)) { lastBird = maxH; const d = Math.random() < 0.5 ? 1 : -1; birds.push({ x: d > 0 ? -16 : RW + 16, y: camTop - rnd(10, 80), vx: d * (45 + L * 5), c: pick(['#3a7ad8', '#e8453c', '#7a4ad8']) }); }
        for (let i = birds.length - 1; i >= 0; i--) { const b = birds[i]; b.x += b.vx * dt; if (b.x < -30 || b.x > RW + 30 || b.y > camTop + RH + 40) { birds.splice(i, 1); continue; }
          if (!dead && Math.abs(b.x - m.x) < 12 && Math.abs(b.y - (m.y - 28 * GK(0.6))) < 16 * (0.5 + 0.5 * GK(0.6))) { birds.splice(i, 1); snd('flap'); for (let k = 0; k < 6; k++) fx.spawn('crumb', b.x, b.y, { c: b.c, sz: 2, vx: rnd(-40, 40), vy: rnd(-40, 20), g: 200, life: 0.8 }); m.vy = Math.max(m.vy, 160); api.hurt(); } }
        // golden bananas
        for (let i = golds.length - 1; i >= 0; i--) { const gd = golds[i]; if (Math.abs(gd.x - m.x) < 12 && Math.abs(gd.y - (m.y - 26 * GK(0.6))) < 20) { golds.splice(i, 1); api.bonus(1, gd.x, gd.y - camTop - 10); for (let k = 0; k < 5; k++) fx.spawn('spark', gd.x + rnd(-8, 8), gd.y - camTop + rnd(-8, 8), { life: 0.5 }); } else if (gd.y > camTop + 440) golds.splice(i, 1); }
        if (!dead && m.y - camTop > Math.max(RH, curH) + 20) { dead = true; api.over(); }
      },
      render(ctx, P) {
        const cvEl = ctx.canvas, ch = (cvEl && cvEl.height) || RH; curH = ch;
        const zone = maxH / (LH * 2), zi = Math.floor(zone), zf = zone - zi;
        ctx.drawImage(vineSky(zi), 0, 0); if (zf > 0.7 && zi + 1 < VZ.length) { ctx.globalAlpha = (zf - 0.7) / 0.3; ctx.drawImage(vineSky(zi + 1), 0, 0); ctx.globalAlpha = 1; }
        if (ch > RH) {
          P.r(0, RH, RW, ch - RH, VZ[Math.min(VZ.length - 1, zi)][2]);
          if (zf > 0.7 && zi + 1 < VZ.length) { ctx.globalAlpha = (zf - 0.7) / 0.3; P.r(0, RH, RW, ch - RH, VZ[Math.min(VZ.length - 1, zi + 1)][2]); ctx.globalAlpha = 1; }
        }
        decor(ctx, P, zi);
        for (const p of plats) drawPlat(ctx, P, p);
        for (const gd of golds) { ctx.drawImage(ARTG.gold(), Math.round(gd.x - 8), Math.round(gd.y - camTop - 8 + Math.sin(gT * 4 + gd.x) * 2)); }
        for (const b of birds) drawBird(P, b);
        const rising = m.vy < 0; const p = mp(0.6, { pose: rising ? 'up' : 'fall', legs: rising ? 'tuck' : 'spread' });
        p.eyes.look = [Math.abs(m.vx) > 40 ? Math.sign(m.vx) : 0, rising ? -1 : 1]; if (m.vy > 380) { p.eyes = { mode: 'wide' }; p.mouth = 'o'; } if (m.happy > 0) { p.eyes = { mode: 'happy' }; p.mouth = 'laugh'; }
        if (dead) { p.eyes = { mode: 'wide' }; p.mouth = 'open'; p.open = 1; }
        const y = m.y - camTop; drawM(ctx, p, m.x, y); if (m.x < 20) drawM(ctx, p, m.x + 200, y); if (m.x > 160) drawM(ctx, p, m.x - 200, y);
      },
      down(x, y) { ptr = { x, y }; }, move(x, y) { if (ptr) ptr = { x, y }; }, up() { ptr = null; },
      key(k, d) { if (k === 'ArrowLeft' || k === 'KeyA') keys.L = d; if (k === 'ArrowRight' || k === 'KeyD') keys.R = d; },
    };
    function fill() {
      const L = api.level; const maxGap = jumpH() * 0.8;
      while (nextY > camTop - 60) {
        const gap = Math.min(maxGap, (30 + L * 3.2) * rnd(0.8, 1.2)); nextY -= gap;
        const w = Math.max(24, 40 - L * 1.2) * rnd(0.9, 1.1); let type = 'n'; const r = Math.random();
        if (r < Math.min(0.4, 0.06 * (L - 1))) type = 'm';
        const p = { x: rnd(w / 2 + 4, RW - w / 2 - 4), y: nextY, w, type, vx: (Math.random() < 0.5 ? -1 : 1) * Math.min(80, 25 + L * 5) };
        if (type === 'n' && Math.random() < 0.07) p.spring = 1; plats.push(p);
        if (L >= 2 && Math.random() < Math.min(0.35, 0.08 * (L - 1))) plats.push({ x: rnd(20, 160), y: nextY - gap * 0.5, w: 30, type: 'b' });
        if (292 - nextY - lastGold > 700) { lastGold = 292 - nextY; golds.push({ x: p.x, y: nextY - 26 }); }
      }
    }
    function drawPlat(ctx, P, p) {
      const cvEl = ctx.canvas, ch = (cvEl && cvEl.height) || RH;
      const x = Math.round(p.x - p.w / 2), y = Math.round(p.y - camTop), w = Math.round(p.w);
      if (y < -20 || y > ch + 20) return;
      if (p.type === 'm') { P.rbox(x, y, w, 7, ['#2a3a1a', '#6a8a22', '#9cc23a', '#d0ec78']); for (let k = 6; k < w - 3; k += 8) P.vl(x + k, y + 1, 5, '#5a7a1a'); return; }
      if (p.type === 'b') { if (p.broken) { ctx.save(); ctx.globalAlpha = 0.9; P.rbox(x, y, Math.floor(w / 2) - 1, 6, ['#3b2433', '#5a4a3a', '#8a7a66', '#a89880']); P.rbox(x + Math.ceil(w / 2) + 1, y + 2, Math.floor(w / 2) - 1, 6, ['#3b2433', '#5a4a3a', '#8a7a66', '#a89880']); ctx.restore(); return; }
        P.rbox(x, y, w, 6, ['#3b2433', '#5a4a3a', '#8a7a66', '#a89880']); P.p(x + w / 2, y + 1, '#3b2433'); P.p(x + w / 2 + 1, y + 2, '#3b2433'); P.p(x + w / 2, y + 3, '#3b2433'); P.p(x + 6, y + 2, '#5a4a3a'); return; }
      P.rbox(x, y, w, 7, ['#3b2433', '#6b4423', '#8a5a2e', '#b07a46']); P.hl(x + 3, y + 3, w - 8, '#7a4c26');
      P.ell(x + 2, y + 1, 5, 3, '#2f7a32'); P.ell(x + 1, y, 3, 2, '#4f9a4a'); P.ell(x + w - 2, y + 2, 5, 3, '#2f7a32'); P.ell(x + w - 1, y + 1, 3, 2, '#58ad4a');
      if (p.spring) { const c = p.sprT > 0 ? 3 : 0; P.r(x + w / 2 - 2, y - 4 + c, 4, 4 - c, '#f0e6d0'); P.ell(x + w / 2, y - 5 + c, 7, 4, '#3b2433'); P.ell(x + w / 2, y - 5 + c, 6, 3.4, '#e8453c'); P.p(x + w / 2 - 3, y - 7 + c, '#ffffff'); P.p(x + w / 2 + 2, y - 6 + c, '#ffffff'); P.p(x + w / 2, y - 8 + c, '#ffffff'); }
    }
    function drawBird(P, b) { const x = Math.round(b.x), y = Math.round(b.y - camTop), d = Math.sign(b.vx), wing = Math.floor(gT * 10) % 2; P.ell(x, y, 6, 4, '#3b2433'); P.ell(x, y, 5, 3, b.c); P.circ(x + d * 5, y - 2, 3, b.c); P.p(x + d * 6, y - 3, '#ffffff'); P.r(x + d * 8 - (d < 0 ? 2 : 0), y - 2, 3, 2, '#ffb02a'); P.r(x - d * 2 - 1, y - (wing ? 6 : -1), 4, 3, PX.shade(b.c, 0.75)); P.r(x - d * 7 - 1, y - 1, 3, 2, PX.shade(b.c, 0.7)); }
    function decor(ctx, P, zi) {
      const par = camTop * 0.35;
      if (zi <= 1) { const zone = maxH / (LH * 2), fade = zi === 0 ? 0.36 : 0.24 * (1 - Math.max(0, (zone - 1 - 0.6) / 0.4)); if (fade > 0.01) { const oy = ((-camTop * 0.12) % JH + JH) % JH; ctx.globalAlpha = fade; ctx.drawImage(jungle(), 0, Math.round(oy) - JH); ctx.drawImage(jungle(), 0, Math.round(oy)); ctx.globalAlpha = 1; } }
      if (zi <= 1) { for (let k = 0; k < 7; k++) { const x = (k * 37 + 11) % RW, ph = ((k * 97 - par) % 400 + 400) % 400 - 60; const len = 50 + (k * 13) % 50; ctx.globalAlpha = zi === 0 ? 0.55 : 0.35; for (let j = 0; j < len; j++) P.p(x + Math.sin((j + k * 9) / 9) * 2, ph + j, '#1e4a2a'); for (let j = 8; j < len; j += 12) P.ell(x + 2, ph + j, 3, 1.5, '#2f6a3a'); ctx.globalAlpha = 1; } }
      if (zi >= 1 && zi <= 3) { ctx.globalAlpha = 0.85; for (let k = 0; k < 4; k++) { const y = ((k * 131 - camTop * 0.25) % 420 + 420) % 420 - 50; ROOMS.cloud(P, (k * 61 + 20) % 200 - 10, y, 0.6 + (k % 2) * 0.3); } ctx.globalAlpha = 1; }
      if (zi >= 4) { for (let k = 0; k < 40; k++) { const y = ((PX.hash(k, 2, 7) * 500 - camTop * 0.1) % 500 + 500) % 500 - 90; P.p(Math.floor(PX.hash(k, 1, 7) * RW), y, (k + Math.floor(gT * 2)) % 7 ? '#c8d2ff' : '#ffffff'); } if (zi >= 5) { const y = ((200 - camTop * 0.05) % 600 + 600) % 600 - 100; P.circ(140, y, 14, '#c86ad8'); P.circ(136, y - 3, 6, '#e898f0'); P.hl(118, y + 1, 44, '#f0c8ff'); } }
    }
    return g;
  }

  // =====================================================================
  // 3) Воздушный шарик — flappy balloon through thorny vines
  // =====================================================================
  function bgBalloon() { return once('bgBal', () => tile(RW, RH, (P) => { ROOMS.vgrad(P, 0, 0, RW, RH, ['#7cc4f0', '#a6dcf6', '#d6f0fa', '#f4e8c8']); })); }
  function hillsBal() { return once('hillsBal', () => tile(RW, 90, (P) => { for (let i = 0; i < RW; i++) { const h = Math.round(30 + Math.sin(i / 30 * Math.PI) * 10 + Math.sin(i / 9) * 3); P.vl(i, h, 90 - h, '#94c8a8'); P.p(i, h, '#b0dcbc'); } })); }
  function jungleBal() { return once('jungleBal', () => tile(RW, 60, (P) => { for (let i = 0; i < RW; i++) { const h = Math.round(16 + Math.sin(i / 15 * Math.PI) * 6 + Math.sin(i / 5) * 2); P.vl(i, h, 60 - h, '#3f8f3a'); P.p(i, h, '#5fae45'); P.p(i, h + 1, '#4f9a40'); } for (let k = 0; k < 10; k++) { const x = k * 18 + 6; P.ell(x, 22, 9, 6, '#2f7a32'); P.ell(x - 2, 19, 5, 3, '#4f9a4a'); } P.r(0, 50, RW, 10, '#6b4423'); })); }
  function thornTile() { return once('thorn', () => tile(26, 24, (P) => { P.r(4, 0, 18, 24, '#1e3a1e'); P.r(5, 0, 16, 24, '#2f7a32'); P.r(8, 0, 6, 24, '#3f8f3a'); P.vl(9, 0, 24, '#58ad4a'); for (let y = 0; y < 24; y += 6) P.line(5, y, 20, y + 4, '#26602a'); P.r(0, 5, 4, 2, '#1e3a1e'); P.p(0, 5, '#f0e0c0'); P.p(1, 6, '#f0e0c0'); P.r(22, 16, 4, 2, '#1e3a1e'); P.p(25, 16, '#f0e0c0'); P.p(24, 17, '#f0e0c0'); P.ell(3, 13, 3, 2, '#4f9a4a'); })); }
  function thornCap() { return once('thornCap', () => tile(32, 12, (P) => { P.ell(16, 6, 15, 5.5, '#1e3a1e'); P.ell(16, 6, 14, 4.6, '#2f7a32'); P.ell(14, 5, 9, 2.4, '#4f9a4a'); for (let k = 0; k < 6; k++) { const x = 3 + k * 5; P.p(x, 1, '#e8453c'); P.p(x, 10, '#e8453c'); } })); }
  function Balloon() {
    let m, cols, passed, started, dead, scroll, nextGold, keys = {};
    const BX = 56;
    const g = {
      snapY: 120,
      init(L) { m = { y: 150, vy: 0, flap: 0, x: BX }; cols = []; passed = 0; started = false; dead = false; scroll = 0; nextGold = 4; api.prog(0); tip('Тапни, чтобы взлететь!'); },
      demo() { started = true; cols.push(mkCol(130, 160)); },
      update(dt) {
        const L = api.level, f = GAME.fat();
        if (!started) { m.y = 150 + Math.sin(gT * 3) * 4; return; }
        const gr = 540 * (1 + 0.25 * f); m.vy = Math.min(300, m.vy + gr * dt); m.y += m.vy * dt; if (m.flap > 0) m.flap -= dt;
        if (dead) { m.x -= 10 * dt; return; }
        const speed = Math.min(140, 62 + L * 4.5); scroll += speed * dt;
        for (const c of cols) c.x -= speed * dt; cols = cols.filter((c) => c.x > -30);
        const spacing = Math.max(98, 132 - L * 2.5); const last = cols[cols.length - 1];
        if (!last || last.x < RW + 20 - spacing) { const gap = Math.max(80, 122 - L * 3) + 8 * f; const prev = last ? last.cy : 165; const cy = clamp(prev + rnd(-1, 1) * (60 + L * 4), 62 + gap / 2, 270 - gap / 2); const c = mkCol(RW + 24, cy, gap); if (--nextGold <= 0) { c.gold = 1; nextGold = Math.round(rnd(7, 11)); } cols.push(c); }
        const BK = GK(0.56), bal = { x: m.x + 6 * BK, y: m.y - 53 * BK - 17, r: 9.5 }; // the balloon hangs 18 px over his hand (hand: 53 px up on a grown-up)
        for (const c of cols) {
          if (!c.passed && c.x + 12 < m.x) { c.passed = true; passed++; snd('pop'); api.prog((passed % 8) / 8); if (passed % 8 === 0) api.levelUp(); }
          if (c.gold && Math.abs(c.x - m.x) < 12 && Math.abs(c.cy - (m.y - 30 * BK)) < 24) { c.gold = 0; api.bonus(1, c.x, c.cy - 10); }
          const x0 = c.x - 10, x1 = c.x + 10, top = c.cy - c.gap / 2, bot = c.cy + c.gap / 2;
          const hitR = (rx0, ry0, rx1, ry1) => { const cx = clamp(bal.x, rx0, rx1), cy = clamp(bal.y, ry0, ry1); return Math.hypot(bal.x - cx, bal.y - cy) < bal.r; };
          const bodyHit = (ry0, ry1) => m.x + 9 * BK > x0 + 2 && m.x - 9 * BK < x1 - 2 && m.y - 4 > ry0 && m.y - 46 * BK < ry1;
          if (hitR(x0, -50, x1, top) || hitR(x0, bot, x1, RH) || bodyHit(-50, top - 2) || bodyHit(bot + 3, RH)) { crash(); break; }
        }
        if (m.y > 300) crash();
        const topCap = (typeof cv !== 'undefined' && cv && cv.height > RH) ? 48 : 34;
        if (m.y - 53 * BK - 29 < topCap) { m.y = topCap + 29 + 53 * BK; m.vy = Math.max(0, m.vy); }
      },
      render(ctx, P) {
        ctx.drawImage(bgBalloon(), 0, 0);
        ctx.globalAlpha = 0.9; for (let k = 0; k < 4; k++) { const x = ((k * 70 - scroll * 0.15) % 260 + 260) % 260 - 40; ROOMS.cloud(P, x, 50 + k * 30, 0.6 + (k % 2) * 0.3); } ctx.globalAlpha = 1;
        const hx = -((scroll * 0.3) % RW); ctx.drawImage(hillsBal(), Math.round(hx), 210); ctx.drawImage(hillsBal(), Math.round(hx + RW), 210);
        for (const c of cols) drawCol(ctx, P, c);
        const jx = -((scroll) % RW); ctx.drawImage(jungleBal(), Math.round(jx), 262); ctx.drawImage(jungleBal(), Math.round(jx + RW), 262);
        // monkey + balloon
        const p = mp(0.56, { pose: dead ? 'fall' : 'balloon', legs: m.flap > 0 ? 'kick' : 'stand' }); p.eyes.look = [1, m.vy > 150 ? 1 : 0]; if (m.flap > 0) p.mouth = 'o'; if (dead) { p.eyes = { mode: 'wide' }; p.mouth = 'open'; p.open = 1; }
        const sp = drawM(ctx, p, m.x, m.y);
        if (!dead) { const hxp = Math.round(m.x + (sp.handR ? sp.handR.x : 6)), hyp = Math.round(m.y + (sp.handR ? sp.handR.y : -53)); const bx = hxp + 1, by = hyp - 18; P.line(hxp, hyp, bx + Math.round(Math.sin(gT * 3)), by + 4, '#f4efe8'); ctx.drawImage(ARTG.balloon(), bx - 12, by - 23); }
      },
      down() { if (dead) return; if (!started) tip(null); started = true; m.vy = -190 * (1 + 0.08 * GAME.fat()); m.flap = 0.2; snd('flap'); },
      key(k, d) { if (d && (k === 'Space' || k === 'ArrowUp' || k === 'KeyW' || k === 'Enter')) g.down(); },
    };
    function mkCol(x, cy, gap = 112) { return { x, cy, gap, passed: false }; }
    function crash() {
      if (dead) return; dead = true; snd('pop'); const bx = m.x + 6 * GK(0.56), by = m.y - 53 * GK(0.56) - 17;
      for (let k = 0; k < 10; k++) { const a = rnd(0, Math.PI * 2); fx.spawn('crumb', bx, by, { c: '#ef4d6a', sz: 2, vx: Math.cos(a) * rnd(40, 90), vy: Math.sin(a) * rnd(40, 90), g: 200, life: 0.8 }); }
      fx.spawn('ring', bx, by, { r0: 4, r1: 16, life: 0.3 }); m.vy = -60; api.over();
    }
    function drawCol(ctx, P, c) {
      const cvEl = ctx.canvas, ch = (cvEl && cvEl.height) || RH;
      const x = Math.round(c.x - 13), top = Math.round(c.cy - c.gap / 2), bot = Math.round(c.cy + c.gap / 2); const tl = thornTile(), cap = thornCap();
      for (let y = top - 24; y > -24; y -= 24) ctx.drawImage(tl, x, y); for (let y = bot; y < ch; y += 24) ctx.drawImage(tl, x, y);
      ctx.drawImage(cap, x - 3, top - 8); ctx.drawImage(cap, x - 3, bot - 4);
      if (c.gold) { ctx.drawImage(ARTG.gold(), Math.round(c.x - 8), Math.round(c.cy - 8 + Math.sin(gT * 4) * 2)); if (Math.floor(gT * 8) % 4 === 0) ctx.drawImage(FX.G.spark, Math.round(c.x + 3), Math.round(c.cy - 10)); }
    }
    return g;
  }

  // =====================================================================
  // 4) Бонго-память — Simon-says on four bongos
  // =====================================================================
  function bgBongo() { return once('bgBongo', () => tile(RW, RH, (P, x) => {
    ROOMS.vgrad(P, 0, 0, RW, 240, ['#2a1838', '#3a2050', '#4a2a5a']);
    for (let k = 0; k < 9; k++) { const bx = 14 + k * 19; P.circ(bx, 30, 3, '#3b2433'); P.circ(bx, 30, 2, k % 2 ? '#ffd23a' : '#ff8ad0'); x.globalAlpha = 0.2; P.circ(bx, 30, 6, '#fff0b0'); x.globalAlpha = 1; } P.hl(0, 26, RW, '#1a1020');
    for (const sd of [0, 1]) { for (let i = 0; i < 34; i++) { const xx = sd ? RW - 1 - i : i; const fold = Math.sin(i / 4) * 0.5 + 0.5; const col = fold > 0.7 ? '#c8384a' : fold > 0.35 ? '#a82a3c' : '#86202f'; P.vl(xx, 0, 236 - Math.max(0, (34 - i) * 0.6) * (sd ? 1 : 1), col); } }
    P.r(0, 0, RW, 14, '#86202f'); for (let i = 0; i < RW; i += 12) P.ell(i + 6, 14, 6, 4, '#a82a3c'); P.hl(0, 10, RW, '#e8b830');
    P.r(0, 236, RW, 84, '#7a4a26'); for (let y = 240; y < RH; y += 8) P.hl(0, y, RW, '#5a361a'); for (let k = 0; k < 14; k++) P.vl((k * 29) % RW, 236 + (k % 4) * 8, 8, '#5a361a'); P.hl(0, 236, RW, '#a87040');
  })); }
  function Bongo() {
    let seq, phase, idx, timer, lit, hitT, hitI, faceT, faceM, keys;
    const DX = [27, 69, 111, 153], DY = 268;
    const g = {
      snapY: 160,
      init(L) { seq = []; for (let i = 0; i < L + 2; i++) seq.push(Math.floor(Math.random() * 4)); lit = [0, 0, 0, 0]; phase = 'pre'; timer = 1.2; idx = 0; hitT = 0; faceT = 0; api.prog(0); },
      onLevel(L) { while (seq.length < L + 2) seq.push(Math.floor(Math.random() * 4)); phase = 'pre'; timer = 0.9; idx = 0; api.prog(0); },
      update(dt) {
        const L = api.level, iv = Math.max(0.27, 0.62 - L * 0.022);
        for (let i = 0; i < 4; i++) lit[i] = Math.max(0, lit[i] - dt); if (hitT > 0) hitT -= dt; if (faceT > 0) faceT -= dt;
        if (phase === 'pre') { timer -= dt; if (timer <= 0) { phase = 'show'; idx = 0; timer = 0.2; msg('Слушай!'); } }
        else if (phase === 'show') { timer -= dt; if (timer <= 0) { if (idx < seq.length) { hit(seq[idx]); idx++; timer = iv; } else { phase = 'input'; idx = 0; msg('Повтори!'); } } }
        else if (phase === 'ok') { timer -= dt; if (timer <= 0) api.levelUp(); }
        else if (phase === 'bad') { timer -= dt; if (timer <= 0 && !api.over_) { phase = 'show'; idx = 0; timer = 0.3; msg('Ещё раз!'); } }
      },
      render(ctx, P) {
        ctx.drawImage(bgBongo(), 0, 0);
        ctx.globalAlpha = 0.13; ctx.fillStyle = '#fff2c0'; ctx.beginPath(); ctx.moveTo(74, 0); ctx.lineTo(106, 0); ctx.lineTo(150, 250); ctx.lineTo(30, 250); ctx.fill(); ctx.globalAlpha = 1;
        P.shadow(90, 250, 34 * GK(1), 6, 0.3);
        const p = mp(1.0, { pose: 'idle' }); p.eyes.look = [0, 1];
        if (hitT > 0) { p.pose = hitI < 2 ? 'drumL' : 'drumR'; p.mouth = 'o'; p.eyes.look = [hitI < 2 ? -1 : 1, 1]; }
        if (phase === 'input') { p.eyes.look = [0, 0]; p.mouth = 'smile'; }
        if (faceT > 0) { if (faceM === 'ok') { p.eyes = { mode: 'happy' }; p.mouth = 'laugh'; p.pose = 'up'; } else { p.eyes = { mode: 'closed' }; p.mouth = 'frown'; p.pose = 'shrug'; } }
        if (api.over_) { p.eyes = { mode: 'closed' }; p.mouth = 'frown'; p.tear = 1; }
        drawM(ctx, p, 90, 250);
        for (let i = 0; i < 4; i++) { const on = lit[i] > 0; if (on) { ctx.globalAlpha = 0.35; P.circ(DX[i], DY - 18, 22, ['#ff8a80', '#ffe080', '#90f080', '#80c0ff'][i]); ctx.globalAlpha = 1; } ctx.drawImage(ARTG.drum(i, on), DX[i] - 19, DY - 30 + (on ? 1 : 0)); }
        if (phase === 'input') for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.5 + Math.sin(gT * 4 + i) * 0.2; P.r(DX[i] - 1, DY + 16, 3, 3, '#fff6d8'); ctx.globalAlpha = 1; }
      },
      down(x, y) { if (phase !== 'input' || y < 190) return; let best = -1, bd = 99; for (let i = 0; i < 4; i++) { const d = Math.abs(x - DX[i]); if (d < bd) { bd = d; best = i; } } if (bd < 22) tap(best); },
      key(k, d) { if (!d || phase !== 'input') return; const map = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, KeyA: 0, KeyS: 1, KeyD: 2, KeyF: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3 }; if (k in map) tap(map[k]); },
    };
    function hit(i) { lit[i] = 0.26; hitT = 0.18; hitI = i; snd('drum', i); fx.spawn('note', DX[i] + rnd(-6, 6), DY - 40, { vy: -24, vx: rnd(-8, 8), life: 0.9, wob: 4, c: i % 3 }); }
    function tap(i) {
      hit(i);
      if (seq[idx] === i) { idx++; api.prog(idx / seq.length); if (idx >= seq.length) { phase = 'ok'; timer = 0.8; faceT = 0.8; faceM = 'ok'; snd('happy'); } }
      else { phase = 'bad'; timer = 1.2; faceT = 1; faceM = 'bad'; snd('nope'); api.hurt(); }
    }
    return g;
  }

  // =====================================================================
  // 5) Качалка — timing meter weightlifting (burns kilos)
  // =====================================================================
  function bgGym() { return once('bgGym', () => tile(RW, RH, (P, x) => {
    P.r(0, 0, RW, 236, '#6a7a96'); for (let y = 0; y < 236; y += 12) { P.hl(0, y, RW, '#5e6c88'); for (let i = (y / 12) % 2 ? 0 : 12; i < RW; i += 24) P.vl(i, y, 12, '#5e6c88'); }
    P.r(0, 168, RW, 68, '#4a5670'); P.hl(0, 168, RW, '#8a98b4'); P.hl(0, 169, RW, '#3a4458');
    P.rbox(40, 50, 100, 92, ['#3b2433', '#8aa8c8', '#bfe0f4', '#e8f6ff']); for (let k = 0; k < 3; k++) P.line(54 + k * 22, 136, 84 + k * 22, 56, '#e8f8ff');
    P.rbox(8, 44, 26, 34, ['#3b2433', '#c8384a', '#e8504a', '#ff8a7a']); x.drawImage(ART.icon('barbell'), 15, 52); P.hl(12, 70, 18, '#ffd0c0'); P.hl(12, 73, 12, '#ffd0c0');
    P.rbox(146, 40, 26, 34, ['#3b2433', '#2f6fbf', '#59a8ef', '#9cd0ff']); x.drawImage(ART.icon('star'), 153, 48); P.hl(150, 66, 18, '#d8ecff');
    P.r(6, 196, 30, 4, '#3b3742'); P.r(6, 214, 30, 4, '#3b3742'); P.vl(8, 190, 46, '#2a2630'); P.vl(33, 190, 46, '#2a2630'); for (const [yy, c] of [[192, '#e8453c'], [210, '#3f86d8']]) for (let k = 0; k < 3; k++) { P.r(10 + k * 8, yy, 6, 4, '#3b2433'); P.r(11 + k * 8, yy + 1, 4, 2, c); }
    P.ell(160, 228, 8, 7, '#3b2433'); P.ell(160, 228, 7, 6, '#4a4a56'); P.r(156, 218, 8, 4, '#3b2433'); P.p(157, 225, '#8a8a98');
    P.r(0, 236, RW, 84, '#3a3a44'); for (let y = 236; y < RH; y += 21) P.hl(0, y, RW, '#2a2a32'); for (let i = 0; i < RW; i += 30) P.vl(i, 236, 84, '#2a2a32'); for (let k = 0; k < 60; k++) P.p(Math.floor(PX.hash(k, 1, 3) * RW), 237 + Math.floor(PX.hash(k, 2, 3) * 82), '#4c4c58');
  })); }
  function Gym() {
    let reps, need, cur, dir, zoneY, zoneH, speed, phase, pt, faceT, perfect;
    const MX0 = 158, MY0 = 64, MY1 = 236;
    const g = {
      snapY: 140,
      init(L) { setup(L); }, onLevel(L) { setup(L); flt(90, 120, '−0,15 кг', UI.I('scale')); },
      update(dt) {
        if (phase === 'aim') { cur += dir * speed * dt; if (cur < MY0) { cur = MY0; dir = 1; } if (cur > MY1) { cur = MY1; dir = -1; } }
        else { pt += dt; if (phase === 'lift' && pt > 0.85) { phase = 'aim'; if (reps >= need) api.levelUp(); } if (phase === 'fail' && pt > 0.9) phase = 'aim'; }
        if (faceT > 0) faceT -= dt;
      },
      render(ctx, P) {
        const cvEl = ctx.canvas, ch = (cvEl && cvEl.height) || RH, py0 = ch > RH ? 52 : 44;
        ctx.drawImage(bgGym(), 0, 0); P.shadow(84, 268, 34 * GK(1), 6, 0.32);
        let pose = 'liftLow', shake = 0; const p = mp(1.0, { pose }); p.eyes = { mode: 'open', look: [1, 0] }; p.mouth = 'flat';
        if (phase === 'lift') { const k = pt; p.pose = k < 0.12 ? 'liftLow' : k < 0.6 ? 'liftHigh' : 'liftLow'; p.eyes = { mode: 'closed' }; p.mouth = k < 0.6 ? 'flat' : 'laugh'; if (k > 0.6) p.eyes = { mode: 'happy' }; p.sweat = GAME.fat() > 0.3 ? 1 : 0; }
        if (phase === 'fail') { p.eyes = { mode: 'closed' }; p.mouth = 'wavy'; p.sweat = 1; shake = Math.round(Math.sin(gT * 50) * 1.5); }
        if (api.over_) { p.pose = 'idle'; p.eyes = { mode: 'dizzy' }; p.mouth = 'wavy'; }
        const sp = drawM(ctx, p, 84 + shake, 268);
        if (!api.over_ && sp.handL && sp.handR) drawBar(ctx, P, 84 + shake + (sp.handL.x + sp.handR.x) / 2, 268 + sp.handR.y + 1, Math.abs(sp.handR.x - sp.handL.x));
        else drawBar(ctx, P, 84, 270, 30);
        // meter
        P.rbox(MX0 - 2, MY0 - 6, 18, MY1 - MY0 + 12, ['#3b2433', '#2a2430', '#4a4252', '#5a5262']);
        ROOMS.vgrad(P, MX0 + 1, MY0 - 3, 12, MY1 - MY0 + 6, ['#ef5a5a', '#ffd04a', '#ef5a5a']);
        P.r(MX0 + 1, Math.round(zoneY), 12, Math.round(zoneH), '#3b2433'); P.r(MX0 + 2, Math.round(zoneY) + 1, 10, Math.round(zoneH) - 2, '#6cc24a'); P.hl(MX0 + 2, Math.round(zoneY) + 1, 10, '#a8e888'); P.hl(MX0 + 2, Math.round(zoneY + zoneH / 2), 10, '#3f8f3a');
        const cy = Math.round(cur); P.r(MX0 - 6, cy - 2, 6, 5, '#3b2433'); P.r(MX0 - 5, cy - 1, 5, 3, '#ffffff'); P.p(MX0 - 7, cy, '#3b2433'); P.r(MX0 + 15, cy - 1, 2, 3, '#3b2433');
        // reps pips
        for (let i = 0; i < need; i++) { const x = 10 + (i % 10) * 8, y = py0 + Math.floor(i / 10) * 8; P.r(x, y, 6, 6, '#3b2433'); P.r(x + 1, y + 1, 4, 4, i < reps ? '#ffd04a' : '#5a5262'); }
      },
      down() { if (phase !== 'aim') return; if (cur >= zoneY - 1 && cur <= zoneY + zoneH + 1) { reps++; perfect = Math.abs(cur - (zoneY + zoneH / 2)) < 3; phase = 'lift'; pt = 0; snd('lift'); laterSfx(220, 'clank'); flt(60, 150, perfect ? 'Идеально!' : '+1'); for (let k = 0; k < 4; k++) fx.spawn('drop', 84 + rnd(-14, 14), 190, { c: '#bfe6ff', vx: rnd(-30, 30), vy: rnd(-60, -20), g: 300, life: 0.6 }); api.prog(reps / need); newZone(); }
        else { phase = 'fail'; pt = 0; snd('nope'); api.hurt(); } },
      key(k, d) { if (d && (k === 'Space' || k === 'Enter' || k === 'ArrowUp')) g.down(); },
    };
    function setup(L) { reps = 0; need = 5 + Math.floor(L / 2); speed = Math.min(380, 120 + L * 15); zoneH = Math.max(13, 48 - L * 2.4); cur = MY1; dir = -1; phase = 'aim'; pt = 0; faceT = 0; newZone(); api.prog(0); }
    function newZone() { zoneY = rnd(MY0 + 4, MY1 - zoneH - 4); }
    function drawBar(ctx, P, cx, y, span) {
      const L = api.level, plates = Math.min(4, 1 + Math.floor((L - 1) / 3)), half = Math.max(30, span / 2 + 16);
      P.r(Math.round(cx - half), Math.round(y) - 1, Math.round(half * 2), 3, '#3b2433'); P.hl(Math.round(cx - half) + 1, Math.round(y), Math.round(half * 2) - 2, '#c8ccd8');
      const cols = ['#e8453c', '#3f86d8', '#f0b830', '#4fb04a'];
      for (const sd of [-1, 1]) for (let k = 0; k < plates; k++) { const px = Math.round(cx + sd * (half - 4 - k * 5)) - 2, h = 18 - k * 2; P.r(px, Math.round(y - h / 2), 5, h, '#3b2433'); P.r(px + 1, Math.round(y - h / 2) + 1, 3, h - 2, cols[k]); P.vl(px + 1, Math.round(y - h / 2) + 1, h - 2, PX.shade(cols[k], 1.3)); }
    }
    return g;
  }

  // =====================================================================
  // Duels with friends (same scenery as the solo games, a rival on screen)
  // =====================================================================
  const gauss = () => { let u = 0, v = 0; while (!u) u = rng(); while (!v) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  // ---- 1) Банановая дуэль vs Пуся: shared banana rain, first to 15 points ----
  function DuelCatch() {
    // Round 13b & Round 54: balanced vs Pusya — slightly weakened to be fun and beatable, without being impossible or sluggish
    const Y = 292, AIS = [0.95, 0.98, 1.02, 1.06, 1.10], REP = [0.34, 0.31, 0.28, 0.25, 0.22], DIS = [0.15, 0.13, 0.11, 0.09, 0.07], NZ = [10, 8, 6, 4, 2];
    const VY = 1.4, SW = 18, SWW = 2.5; // fall speed ×, sway amplitude px, sway rad/s
    const ZM = [Y - 76, Y - 34], ZP = [Y - 76, Y - 22]; let MK = 1; // catch heights: monkey (arms up) / Пуся (paws up + a hop). Round 10 #7: a small one keeps the grown-up's reach (fair vs Пуся) — he jumps for it
    let m, p, items, spawnT, keys = {}, target = null, sg, J = null;
    const R = (a, b) => a + rng() * (b - a);
    const g = {
      snapY: 180,
      init() { sg = api.duel ? api.duel.stage : 0; MK = GK(0.7); m = { x: 124, vx: 0, step: 0, stun: 0, face: 0 }; J = jumper(m, () => !api.over_ && m.stun <= 0, Y); p = { x: 56, vx: 0, step: 0, stun: 0, tgt: 56, rep: 0, wash: 0, face: 0, hop: 0, hopH: 0 }; items = []; spawnT = 1.1; target = null; keys = {}; },
      demo() { items.push({ type: 'banana', x: 70, y: 210, vy: 0 }, { type: 'coconut', x: 130, y: 190, vy: 0 }, { type: 'gold', x: 40, y: 230, vy: 0 }); },
      update(dt) {
        const over = api.over_, f = GAME.fat();
        if (!over) { spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = R(0.42, 0.72); } }
        const sp = 165 * (1 - 0.3 * f); const dir = (keys.R ? 1 : 0) - (keys.L ? 1 : 0); if (dir) target = null;
        const spA = sp * (m.jt > 0 ? JMP.AIR : 1);
        if (m.stun > 0) { m.stun -= dt; m.vx = 0; } else if (target !== null) { const d = target - m.x; m.vx = Math.sign(d) * Math.min(Math.abs(d) * 12, spA); } else m.vx = dir * spA;
        if (over) m.vx = 0; m.x = clamp(m.x + m.vx * dt, 6, 174); if (Math.abs(m.vx) > 25) m.step += dt; if (m.face > 0) m.face -= dt; J.tick(dt); const jy = J.h();
        if (!over) ai(dt); else p.vx = 0; if (p.face > 0) p.face -= dt;
        const hwM = (18 + 10 * f) * (0.5 + 0.5 * MK), hwP = 14; if (m.hop > 0) m.hop -= dt; if (p.hop > 0) p.hop -= dt;
        const atLeftM = m.x <= 16, atRightM = m.x >= 164;
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i]; it.y += it.vy * dt; if (it.x0 === undefined) { it.x0 = it.x; it.ph = 0; } if (it.vy) { it.ph += SWW * dt; it.x = clamp(it.x0 + Math.sin(it.ph) * SW, 10, 170); }
          if (!over) {
            const caughtM = Math.abs(it.x - m.x) < hwM || (atLeftM && it.x <= m.x + hwM) || (atRightM && it.x >= m.x - hwM);
            const inM = m.stun <= 0 && it.y > ZM[0] - jy && it.y < ZM[1] - jy && caughtM, inP = p.stun <= 0 && it.y > ZP[0] && it.y < ZP[1] && Math.abs(it.x - p.x) < hwP;
            if (inM || inP) { const who = inM && inP ? (Math.abs(it.x - m.x) <= Math.abs(it.x - p.x) ? 'me' : 'fr') : inM ? 'me' : 'fr'; items.splice(i, 1); got(who, it); if (who === 'me' && MK < 0.95 && !(m.jt > 0)) m.hop = 0.34; continue; }
          }
          if (it.y > Y + 6) { items.splice(i, 1); if (it.type !== 'coconut') for (let k = 0; k < 4; k++) fx.spawn('crumb', it.x, Y + 2, { c: '#f4d03a', vx: rnd(-30, 30), vy: rnd(-50, -20), g: 300, life: 0.5, floor: Y + 4 }); else fx.spawn('crumb', it.x, Y, { c: '#7a5236', sz: 2, vx: rnd(-20, 20), vy: -40, g: 300, life: 0.6, floor: Y + 4 }); }
        }
      },
      render(ctx, P) {
        ctx.drawImage(bgCatch(), 0, 0);
        for (const it of items) { const x = Math.round(it.x), y = Math.round(it.y); if (it.type === 'banana') ctx.drawImage(ART.food('banana'), x - 8, y - 8); else if (it.type === 'gold') { ctx.drawImage(ARTG.gold(), x - 8, y - 8); if (Math.floor(gT * 8) % 4 === 0) ctx.drawImage(FX.G.spark, x + 3, y - 9); } else ctx.drawImage(ARTG.coconut(), x - 7, y - 7); }
        const over = api.over_, d = api.duel || {};
        // Пуся
        P.shadow(p.x, Y + 1, 13, 3, 0.25);
        const pn = nearest(p.x); let pose = 'idle'; const o = {};
        if (p.stun > 0) pose = 'dizzy'; else if (p.wash > 0) pose = 'wash'; else if (p.face > 0) pose = 'happy'; else if (Math.abs(p.vx) > 25 || (pn && pn.y > 150)) pose = 'catch';
        if (over) { pose = d.win ? 'idle' : 'happy'; if (d.win) o.eyes = 'closed'; }
        if (p.hop > 0 && pose !== 'dizzy') pose = 'catch';
        if (pn && pose !== 'dizzy') o.look = [Math.abs(pn.x - p.x) < 8 ? 0 : Math.sign(pn.x - p.x), -1];
        const e = FART.sprite('pusya', Object.assign({ pose, f: Math.floor(gT * 2) % 2 }, o)), bob = Math.abs(p.vx) > 25 && Math.floor(p.step * 9) % 2 ? -1 : 0;
        const hopP = p.hop > 0 ? Math.round(Math.sin(p.hop / 0.3 * Math.PI) * p.hopH) : 0; // Round 13b: she hops for the high ones
        ctx.drawImage(e.cv, Math.round(p.x - e.ox), Math.round(Y - e.oy + (hopP ? -hopP : bob)));
        if (p.stun > 0) for (let i = 0; i < 3; i++) { const a = gT * 5 + i * 2.1; ctx.drawImage(FX.G.star, Math.round(p.x + Math.cos(a) * 11 - 3), Math.round(Y - 46 + Math.sin(a) * 3 - 3)); }
        // Абибян
        const f = GAME.fat(), jy = J.h(); P.shadow(m.x, Y + 1, (14 + 8 * f) * (1 - jy / 60), 3, 0.25 - jy / 200);
        const near = nearest(m.x); const q = mp(0.7, { pose: 'catch' }); if (near) q.eyes.look = [Math.abs(near.x - m.x) < 8 ? 0 : Math.sign(near.x - m.x), -1];
        if (Math.abs(m.vx) > 25) q.legs = (Math.floor(m.step * 9) % 2) ? 'spread' : 'kick';
        if (m.stun > 0) { q.eyes = { mode: 'dizzy' }; q.mouth = 'wavy'; q.pose = 'fall'; } else if (m.face > 0) { q.eyes = { mode: 'happy' }; q.mouth = 'laugh'; }
        if (over) { if (d.win) { q.eyes = { mode: 'happy' }; q.mouth = 'laugh'; q.pose = 'up'; } else { q.eyes = { mode: 'closed' }; q.mouth = 'frown'; q.pose = 'idle'; q.tear = 1; } }
        const hopY = Math.max(m.hop > 0 ? Math.round(Math.sin(m.hop / 0.34 * Math.PI) * 76 * (1 - MK)) : 0, Math.round(jy)); if (hopY && m.stun <= 0 && !over) { q.pose = 'up'; q.legs = 'tuck'; }
        drawM(ctx, q, m.x, Y - hopY);
        if (m.stun > 0) for (let i = 0; i < 3; i++) { const a = gT * 5 + i * 2.1; ctx.drawImage(FX.G.star, Math.round(m.x + Math.cos(a) * 12 - 3), Math.round(Y - 70 * MK + Math.sin(a) * 3 - 3)); }
      },
      down(x, y) { target = x; J.down(x, y); }, move(x, y) { if (target !== null) target = x; J.move(x, y); }, up(x) { target = null; J.up(); },
      key(k, dn) { if (k === 'ArrowLeft' || k === 'KeyA') keys.L = dn; if (k === 'ArrowRight' || k === 'KeyD') keys.R = dn; J.key(k, dn); },
      get m() { return m; }, get p() { return p; }, get items() { return items; }, get jy() { return J ? J.h() : 0; },
    };
    function nearest(x) { let b = null; for (const it of items) if (it.type !== 'coconut' && (!b || it.y > b.y)) b = it; return b; }
    function spawn() { const r = rng(); const type = r < 0.2 ? 'coconut' : r < 0.27 ? 'gold' : 'banana'; const x0 = R(10, 170); items.push({ type, x: x0, x0, ph: rng() * 6.28, y: -14, vy: R(95, 128) * VY }); }
    function ai(dt) {
      const spd = 165 * AIS[sg];
      if (p.stun > 0) { p.stun -= dt; p.vx = 0; return; }
      if (p.wash > 0) { p.wash -= dt; p.vx = 0; return; }
      if (rng() < DIS[sg] * dt) { p.wash = 0.9; return; }
      p.rep -= dt; if (p.rep <= 0) { p.rep = REP[sg]; p.tgt = plan(spd); }
      const d = p.tgt - p.x; p.vx = Math.sign(d) * Math.min(Math.abs(d) * 10, spd); p.x = clamp(p.x + p.vx * dt, 10, 170); if (Math.abs(p.vx) > 25) p.step += dt;
      if (p.hop <= 0) for (const it of items) if (it.type !== 'coconut' && it.y > Y - 104 && it.y < Y - 72 && Math.abs(it.x - p.x) < 16) { p.hop = 0.3; p.hopH = 22; break; }
    }
    function plan(spd) {
      let best = null, bs = -1;
      const sm = 165 * (1 - 0.3 * GAME.fat());
      for (const it of items) {
        if (it.type === 'coconut') continue; const tc = (ZP[1] - 6 - it.y) / it.vy; if (tc < 0) continue; const need = Math.max(0, Math.abs(it.x - p.x) - 10) / spd; if (need > tc + 0.05) continue;
        const tm = (ZM[1] - 6 - it.y) / it.vy, nm = Math.max(0, Math.abs(it.x - m.x) - 10) / sm; // he is closer and gets there first → leave it to him
        if (nm < tm && (ZM[0] - it.y) / it.vy < Math.max(need, (ZP[0] - it.y) / it.vy) - 0.02 && Math.abs(it.x - m.x) < Math.abs(it.x - p.x)) continue;
        const v = it.type === 'gold' ? 3 : 1; const sc = v / (tc + 0.4 + need); if (sc > bs) { bs = sc; best = it; }
      }
      let tx = best ? best.x + (rng() - 0.5) * NZ[sg] : 90 + (rng() - 0.5) * 50;
      for (const it of items) if (it.type === 'coconut') { const tc = (ZP[0] - it.y) / it.vy; if (tc > -0.3 && tc < 0.7 && Math.abs(it.x - tx) < 20 && rng() > 0.15) tx = it.x + (tx >= it.x ? 22 : -22); }
      return clamp(tx, 10, 170);
    }
    function got(who, it) {
      const c = who === 'me' ? m : p;
      if (it.type === 'coconut') { c.stun = 1.0; if (who === 'me') J.stop(); snd('hit'); for (let k = 0; k < 5; k++) fx.spawn('star', c.x + rnd(-10, 10), Y - (who === 'me' ? 66 : 44), { vx: rnd(-40, 40), vy: rnd(-60, -20), g: 200, life: 0.6 }); return; }
      const n = it.type === 'gold' ? 3 : 1; c.face = 0.35; snd(who === 'me' ? 'chomp' : 'pop'); if (who === 'fr' && p.hop <= 0) { p.hop = 0.3; p.hopH = 12; }
      for (let k = 0; k < 3; k++) fx.spawn('spark', it.x + rnd(-6, 6), it.y + rnd(-6, 6), { life: 0.4 });
      flt(c.x, Y - (who === 'me' ? 84 : 58), '+' + n); api.duelPts(who, n);
    }
    return g;
  }

  // ---- 2) Бонго-дуэль vs Монти: he plays, you repeat + add a beat, he repeats + adds… first mistake loses ----
  function DuelBongo() {
    const DX = [27, 69, 111, 153], DY = 268, MXA = 58, MXF = 128;
    let seq, phase, idx, timer, pTimer, lit, hitT, hitI, faceT, faceM, mT, mArm, mPose, mPoseT, mumbleT, sg, errs;
    const g = {
      snapY: 160,
      init() { sg = api.duel ? api.duel.stage : 0; seq = [Math.floor(rng() * 4), Math.floor(rng() * 4)]; lit = [0, 0, 0, 0]; phase = 'pre'; timer = 1.2; pTimer = 3.8; idx = 0; hitT = 0; faceT = 0; mT = 0; mArm = ''; mPose = 'idle'; mPoseT = 0; mumbleT = 7; errs = 0; },
      update(dt) {
        for (let i = 0; i < 4; i++) lit[i] = Math.max(0, lit[i] - dt); if (hitT > 0) hitT -= dt; if (faceT > 0) faceT -= dt; if (mT > 0) mT -= dt; if (mPoseT > 0) mPoseT -= dt;
        const iv = Math.max(0.32, 0.54 - sg * 0.025 - Math.max(0, seq.length - 3) * 0.016);
        if (phase === 'pre') { timer -= dt; if (timer <= 0) { phase = 'fshow'; idx = 0; timer = 0.2; msg('Монти играет…'); } }
        else if (phase === 'fshow') { timer -= dt; if (timer <= 0) { if (idx < seq.length) { fhit(seq[idx]); idx++; timer = iv; } else toInput(); } }
        else if (phase === 'pin' || phase === 'padd') {
          pTimer -= dt;
          if (pTimer <= 0) {
            phase = 'pbad'; timer = 1.3; faceT = 1.3; faceM = 'bad'; mPose = 'happy'; mPoseT = 9; snd('nope'); msg('Не успел!');
          }
          mumbleT -= dt; if (mumbleT <= 0) { mumbleT = 7; mPose = 'talk'; mPoseT = 1; snd('mumble'); tip(phase === 'pin' ? 'Повтори ритм Монти' : 'Добавь свой удар — любой барабан'); }
        }
        else if (phase === 'fwait') { timer -= dt; if (timer <= 0) { phase = 'fturn'; idx = 0; timer = 0.3; msg('Ход Монти…'); } }
        else if (phase === 'fturn') { timer -= dt; if (timer <= 0) {
          if (idx < seq.length) { const n = seq[idx]; if (rng() < errP(idx)) { errs++; fhit((n + 1 + Math.floor(rng() * 3)) % 4); phase = 'ferr'; timer = 1.3; mPose = 'sad'; mPoseT = 9; snd('nope'); laterSfx(350, 'mumble'); } else { fhit(n); idx++; timer = iv; } }
          else { phase = 'fadd'; timer = 0.45; } } }
        else if (phase === 'fadd') { timer -= dt; if (timer <= 0) { const n = Math.floor(rng() * 4); seq.push(n); fhit(n); api.duelPts('fr', 1); mPose = 'happy'; mPoseT = 0.6; phase = 'fdone'; timer = 0.7; } }
        else if (phase === 'fdone') { timer -= dt; if (timer <= 0) toInput(); }
        else if (phase === 'ferr') { timer -= dt; if (timer <= 0) api.duelEnd(true); }
        else if (phase === 'pbad') { timer -= dt; if (timer <= 0) api.duelEnd(false); }
      },
      render(ctx, P) {
        ctx.drawImage(bgBongo(), 0, 0);
        ctx.globalAlpha = 0.13; ctx.fillStyle = '#fff2c0'; for (const cx of [MXA, MXF]) { ctx.beginPath(); ctx.moveTo(cx - 14, 0); ctx.lineTo(cx + 14, 0); ctx.lineTo(cx + 44, 250); ctx.lineTo(cx - 44, 250); ctx.fill(); } ctx.globalAlpha = 1;
        const myTurn = phase === 'pin' || phase === 'padd', over = api.over_, d = api.duel || {};
        // turn marker: a bouncing arrow over whoever plays now
        if (!over && phase !== 'pre') { const ax = myTurn ? MXA : MXF, ay = (myTurn ? 156 : 186) + (Math.floor(gT * 4) % 2); P.r(ax - 3, ay, 7, 2, '#3b2433'); P.r(ax - 2, ay + 2, 5, 2, '#3b2433'); P.r(ax - 1, ay + 4, 3, 2, '#3b2433'); P.r(ax - 2, ay, 5, 1, '#ffd23a'); P.r(ax - 1, ay + 2, 3, 1, '#ffd23a'); P.p(ax, ay + 4, '#ffd23a'); }
        P.shadow(MXA, 250, 26 * GK(0.85), 5, 0.3); P.shadow(MXF, 244, 22, 4, 0.3);
        const q = mp(0.85, { pose: 'idle' }); q.eyes.look = [1, 1];
        if (hitT > 0 && hitI.who === 'me') { q.pose = hitI.i < 2 ? 'drumL' : 'drumR'; q.mouth = 'o'; q.eyes.look = [hitI.i < 2 ? -1 : 1, 1]; }
        else if (!myTurn) { q.eyes.look = [1, 0]; }
        if (faceT > 0) { if (faceM === 'ok') { q.eyes = { mode: 'happy' }; q.mouth = 'laugh'; } else { q.eyes = { mode: 'closed' }; q.mouth = 'frown'; q.pose = 'shrug'; } }
        if (over) { if (d.win) { q.eyes = { mode: 'happy' }; q.mouth = 'laugh'; q.pose = 'up'; } else { q.eyes = { mode: 'closed' }; q.mouth = 'frown'; q.tear = 1; } }
        drawM(ctx, q, MXA, 250);
        // Монти on a crate behind the drums
        P.r(MXF - 16, 238, 32, 12, '#3b2433'); P.r(MXF - 15, 239, 30, 10, '#8a5a32'); P.hl(MXF - 15, 239, 30, '#b07a46');
        let pose = mPoseT > 0 ? mPose : myTurn ? 'think' : 'idle'; if (over) pose = d.win ? 'sad' : 'happy';
        const e = FART.sprite('monty', { pose, f: pose === 'talk' ? Math.floor(gT * 8) % 2 : Math.floor(gT * 2) % 2, arm: mT > 0 ? mArm : '' });
        ctx.drawImage(e.cv, Math.round(MXF - e.ox), Math.round(239 - e.oy));
        for (let i = 0; i < 4; i++) { const on = lit[i] > 0; if (on) { ctx.globalAlpha = 0.35; P.circ(DX[i], DY - 18, 22, ['#ff8a80', '#ffe080', '#90f080', '#80c0ff'][i]); ctx.globalAlpha = 1; } ctx.drawImage(ARTG.drum(i, on), DX[i] - 19, DY - 30 + (on ? 1 : 0)); }
        if (myTurn) for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.5 + Math.sin(gT * 4 + i) * 0.2; P.r(DX[i] - 1, DY + 16, 3, 3, '#fff6d8'); ctx.globalAlpha = 1; }
        // sequence pips: neutral dots indicating rhythm length and player's progress (does not cheat-leak colors)
        for (let i = 0; i < seq.length; i++) {
          const x = 90 - seq.length * 3.5 + i * 7, y = 300;
          const hit = (phase === 'pin' && i < idx) || phase === 'padd' || phase === 'fwait' || phase === 'fturn';
          P.r(Math.round(x), y, 5, 5, '#3b2433');
          P.r(Math.round(x) + 1, y + 1, 3, 3, hit ? '#ffd23a' : '#605868');
        }
      },
      down(x, y) { if ((phase !== 'pin' && phase !== 'padd') || y < 190) return; let best = -1, bd = 99; for (let i = 0; i < 4; i++) { const dd = Math.abs(x - DX[i]); if (dd < bd) { bd = dd; best = i; } } if (bd < 22) tap(best); },
      key(k, dn) { if (!dn || (phase !== 'pin' && phase !== 'padd')) return; const map = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, KeyA: 0, KeyS: 1, KeyD: 2, KeyF: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3 }; if (k in map) tap(map[k]); },
      get phase() { return phase; }, get seq() { return seq; }, get idx() { return idx; }, errP: (i) => errP(i), get errs() { return errs; },
    };
    function errP(i) {
      if (seq.length < 6) return 0; // Monty plays reliably up to 5 beats without early blunders
      const lenFactor = (seq.length - 5) * 0.012;
      return Math.min(0.18, lenFactor + (i === seq.length - 1 ? 0.035 : 0.005));
    }
    function toInput() { phase = 'pin'; idx = 0; pTimer = 3.8; mumbleT = 7; msg('Повтори!'); }
    function lightUp(i, who) { lit[i] = 0.26; hitT = 0.18; hitI = { i, who }; snd('drum', i); fx.spawn('note', DX[i] + rnd(-6, 6), DY - 40, { vy: -24, vx: rnd(-8, 8), life: 0.9, wob: 4, c: i % 3 }); }
    function fhit(i) { lightUp(i, 'fr'); mT = 0.2; mArm = i < 2 ? 'L' : 'R'; }
    function tap(i) {
      lightUp(i, 'me'); tip(null); mumbleT = 7; pTimer = 3.5;
      if (phase === 'padd') { seq.push(i); api.duelPts('me', 1); faceT = 0.6; faceM = 'ok'; phase = 'fwait'; timer = 0.8; return; }
      if (seq[idx] === i) { idx++; if (idx >= seq.length) { phase = 'padd'; msg('Добавь свой удар!'); snd('happy'); } }
      else { phase = 'pbad'; timer = 1.3; faceT = 1.3; faceM = 'bad'; mPose = 'happy'; mPoseT = 9; snd('nope'); }
    }
    return g;
  }

  // ---- 3) Силач-дуэль vs Москит: two meters, first to 10 reps; centre of the zone = +2 ----
  function DuelGym() {
    const MY0 = 64, MY1 = 236, ZH = 26, SIG = [6, 5, 4.2, 3.5, 3], SPD = [150, 156, 162, 168, 174];
    let A, B, sg, spd;
    const R = (a, b) => a + rng() * (b - a);
    const mkL = (x0, ai) => ({ x0, ai, cur: MY1, dir: -1, zone: 0, phase: 'aim', pt: 0, aim: 0, hes: false, perfect: false });
    const g = {
      snapY: 140,
      init() { sg = api.duel ? api.duel.stage : 0; spd = SPD[sg]; A = mkL(158, false); B = mkL(8, true); B.cur = MY0 + 40; B.dir = 1; newZone(A); newZone(B); },
      update(dt) {
        for (const L of [A, B]) {
          // the cursor keeps sliding during a miss lock — otherwise mashing becomes a systematic scan
          const prev = L.cur; if (L.phase !== 'lift') { L.cur += L.dir * spd * dt; if (L.cur < MY0) { L.cur = MY0; L.dir = 1; } if (L.cur > MY1) { L.cur = MY1; L.dir = -1; } }
          if (L.phase === 'aim') {
            if (L.ai && !api.over_ && (prev - L.aim) * (L.cur - L.aim) <= 0 && prev !== L.cur) { if (L.hes) L.hes = false; else lift(L, 'fr'); }
          } else { L.pt += dt; if ((L.phase === 'lift' && L.pt > 0.6) || (L.phase === 'fail' && L.pt > 1.0)) L.phase = 'aim'; }
        }
      },
      render(ctx, P) {
        ctx.drawImage(bgGym(), 0, 0); const over = api.over_, d = api.duel || {};
        meter(P, A); meter(P, B);
        // Москит pumps a tiny dumbbell
        const up = B.phase === 'lift' && B.pt < 0.45, by = 250 + Math.round(Math.sin(gT * 3) * 2);
        P.shadow(64, 268, 7, 2, 0.2);
        const e = FART.sprite('mosq', { pose: over ? (d.win ? 'idle' : 'happy') : B.phase === 'fail' ? 'idle' : up ? 'lift' : 'idle', f: Math.floor(gT * 14) % 2, look: [1, 0], k: 1 });
        ctx.drawImage(e.cv, Math.round(64 - e.ox), Math.round(by - e.oy));
        const dy = up ? by - 25 : by - 12; P.r(56, dy, 16, 2, '#3b2433'); P.hl(57, dy, 14, '#c8ccd8'); for (const sx of [54, 70]) { P.r(sx, dy - 3, 3, 7, '#3b2433'); P.r(sx + 1, dy - 2, 1, 5, '#e8453c'); }
        if (B.phase === 'fail') for (let k = 0; k < 2; k++) P.p(60 + k * 8, by - 22 - (Math.floor(gT * 8 + k) % 3), '#bfe6ff');
        // Абибян
        P.shadow(110, 268, 30 * GK(0.95), 6, 0.32);
        const q = mp(0.95, { pose: 'liftLow' }); q.eyes = { mode: 'open', look: [1, 0] }; q.mouth = 'flat'; let shake = 0;
        if (A.phase === 'lift') { const k = A.pt / 0.6; q.pose = k < 0.15 ? 'liftLow' : k < 0.7 ? 'liftHigh' : 'liftLow'; q.eyes = { mode: k < 0.7 ? 'closed' : 'happy' }; q.mouth = k < 0.7 ? 'flat' : 'laugh'; }
        if (A.phase === 'fail') { q.eyes = { mode: 'closed' }; q.mouth = 'wavy'; q.sweat = 1; shake = Math.round(Math.sin(gT * 50) * 1.5); }
        if (over) { if (d.win) { q.pose = 'up'; q.eyes = { mode: 'happy' }; q.mouth = 'laugh'; } else { q.pose = 'idle'; q.eyes = { mode: 'dizzy' }; q.mouth = 'wavy'; } }
        const sp = drawM(ctx, q, 110 + shake, 268);
        if (!over && sp.handL && sp.handR) bar(P, 110 + shake + (sp.handL.x + sp.handR.x) / 2, 268 + sp.handR.y + 1, Math.abs(sp.handR.x - sp.handL.x));
      },
      down() { if (A.phase === 'aim' && !api.over_) lift(A, 'me'); },
      key(k, dn) { if (dn && (k === 'Space' || k === 'Enter' || k === 'ArrowUp')) g.down(); },
      get A() { return A; }, get B() { return B; },
    };
    function newAim(L) { L.aim = L.zone + ZH / 2 + gauss() * SIG[sg]; L.hes = rng() < 0.15; }
    function newZone(L) { L.zone = R(MY0 + 4, MY1 - ZH - 4); if (L.ai) newAim(L); }
    function lift(L, who) {
      if (L.cur >= L.zone - 1 && L.cur <= L.zone + ZH + 1) {
        L.perfect = Math.abs(L.cur - (L.zone + ZH / 2)) <= 3; L.phase = 'lift'; L.pt = 0; const n = L.perfect ? 2 : 1;
        if (who === 'me') { snd('lift'); laterSfx(200, 'clank'); flt(116, 150, L.perfect ? 'Идеально! +2' : '+1'); for (let k = 0; k < 4; k++) fx.spawn('drop', 110 + rnd(-14, 14), 190, { c: '#bfe6ff', vx: rnd(-30, 30), vy: rnd(-60, -20), g: 300, life: 0.6 }); }
        else { snd('buzz'); flt(52, 170, L.perfect ? '+2' : '+1'); }
        newZone(L); api.duelPts(who, n);
      } else { L.phase = 'fail'; L.pt = 0; if (who === 'me') snd('nope'); else newAim(L); }
    }
    function meter(P, L) {
      const x0 = L.x0; P.rbox(x0 - 2, MY0 - 6, 18, MY1 - MY0 + 12, ['#3b2433', '#2a2430', '#4a4252', '#5a5262']);
      ROOMS.vgrad(P, x0 + 1, MY0 - 3, 12, MY1 - MY0 + 6, ['#ef5a5a', '#ffd04a', '#ef5a5a']);
      const zy = Math.round(L.zone); P.r(x0 + 1, zy, 12, ZH, '#3b2433'); P.r(x0 + 2, zy + 1, 10, ZH - 2, L.phase === 'fail' ? '#8a8a8a' : '#6cc24a'); P.hl(x0 + 2, zy + 1, 10, '#a8e888'); P.r(x0 + 2, Math.round(L.zone + ZH / 2) - 3, 10, 7, L.phase === 'fail' ? '#9a9a9a' : '#4fae3a'); P.hl(x0 + 2, Math.round(L.zone + ZH / 2), 10, '#ffe066');
      const cy = Math.round(L.cur); if (L.ai) { P.r(x0 + 15, cy - 2, 6, 5, '#3b2433'); P.r(x0 + 15, cy - 1, 5, 3, '#ffffff'); P.p(x0 + 21, cy, '#3b2433'); } else { P.r(x0 - 6, cy - 2, 6, 5, '#3b2433'); P.r(x0 - 5, cy - 1, 5, 3, '#ffffff'); P.p(x0 - 7, cy, '#3b2433'); }
    }
    function bar(P, cx, y, span) {
      const half = Math.max(30, span / 2 + 16); P.r(Math.round(cx - half), Math.round(y) - 1, Math.round(half * 2), 3, '#3b2433'); P.hl(Math.round(cx - half) + 1, Math.round(y), Math.round(half * 2) - 2, '#c8ccd8');
      for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) { const px = Math.round(cx + sd * (half - 4 - k * 5)) - 2, h = 18 - k * 2; P.r(px, Math.round(y - h / 2), 5, h, '#3b2433'); P.r(px + 1, Math.round(y - h / 2) + 1, 3, h - 2, ['#e8453c', '#3f86d8'][k]); }
    }
    return g;
  }

  // ---- 4) «Ключики» vs Жучок (Round 7 #2b): memory pairs. 18 keyring tags lie face down (9 pairs). Open two: a pair is yours and you go
  // again; no pair → both flip back and it is the other one's turn. First to 5 pairs wins (9 pairs → never a draw).
  // puzzle: the board model B is the single source of truth, the view only reads it; input is locked while two tags are open.
  // game-ai: Жучок is a small FSM (think → go → flip → think2 → go → flip → wait) — the decision layer picks a tag, the motion layer
  // flies him to the board and walks him from tag to tag; he remembers a tag he has seen with a probability that grows with the stage.
  const KCOL = 6, KTW = 24, KTH = 32, KGX = 4, KGY = 6, KX0 = 8, KY0 = 74, KREST = [146, 250];
  const KICONS = ['keyG', 'keyS', 'banana', 'coin', 'home', 'heart', 'star', 'sprout', 'lock'], KMEM = [0.35, 0.48, 0.6, 0.7, 0.8];
  function keyIcon(gold) { return once(gold ? 'keyG' : 'keyS', () => MONKEY.sprite(12, 12, (a) => { const m = gold ? a.mat('gold', '#f2bf33') : a.mat('lockS', '#a7adb8'); a.ell(3.4, 5.6, 3.1, 3.1, MONKEY.K.IT, m); a.box(5.8, 4.8, 11.6, 6.6, MONKEY.K.IT, m); a.box(8.2, 6.2, 9.6, 9.2, MONKEY.K.IT, m); a.box(10.3, 6.2, 11.6, 8.4, MONKEY.K.IT, m); },
    (d) => { d.px(3, 5, '#3b2433'); d.px(3, 6, '#3b2433'); d.px(4, 5, '#3b2433'); d.px(4, 6, '#3b2433'); d.px(2, 3, gold ? '#fff6c0' : '#ffffff'); d.px(7, 5, gold ? '#fff6c0' : '#ffffff'); })); }
  function keyArt(ic) { return ic === 'keyG' ? keyIcon(true) : ic === 'keyS' ? keyIcon(false) : ic === 'banana' ? ART.food('banana') : ART.icon(ic); }
  function bgKeys() { return once('bgKeys', () => tile(RW, RH, (P, x) => {
    ROOMS.vgrad(P, 0, 0, RW, 210, ['#d8bf9c', '#e6d1b4', '#ecdcc2']); for (let k = 0; k < 40; k++) P.p(Math.floor(PX.hash(k, 3, 7) * RW), 50 + Math.floor(PX.hash(k, 4, 7) * 150), '#d4bc98');
    P.r(0, 206, RW, 4, '#8a5a32'); P.hl(0, 206, RW, '#b07a46'); P.r(0, 210, RW, 110, '#b88a58'); for (let y = 218; y < RH; y += 9) P.hl(0, y, RW, '#a07444'); for (let k = 0; k < 16; k++) P.vl((k * 37 + (k % 3) * 11) % RW, 210 + (k % 6) * 9 + 1, 8, '#a07444');
    // the felt mat under the tags (the hall key-rack wood frames it)
    P.rbox(3, 66, RW - 6, 128, ['#3b2433', '#5a3418', '#7a4a26', '#a06a3c']); P.rbox(6, 69, RW - 12, 122, ['#2a3a2a', '#2e5a3a', '#3a7048', '#4a8458']);
    for (let k = 0; k < 60; k++) P.p(8 + Math.floor(PX.hash(k, 5, 9) * (RW - 16)), 71 + Math.floor(PX.hash(k, 6, 9) * 118), '#35663f');
    // the hall key rack above the mat: a plank, three brass hooks; the middle one — Жучок's, with his gold chain hanging empty
    P.shadow(90, 46, 36, 2, 0.16); P.rbox(56, 36, 68, 8, ['#3b2433', '#5a3418', '#8a5a32', '#b07a46']); for (const hx of [70, 90, 110]) { P.r(hx - 1, 44, 3, 6, '#3b2433'); P.r(hx, 44, 1, 5, '#e8c860'); P.p(hx + 1, 49, '#3b2433'); P.p(hx + 1, 48, '#e8c860'); }
    for (let k = 0; k < 4; k++) P.p(90 + (k % 2), 50 + k * 2, k % 2 ? '#c8962a' : '#ffd23a');
  })); }
  function DuelKeys() {
    let B, turn, phase, open, resT, sg, memP, mem, ai, pop, cur, curOn, idleT, lastWho;
    const cell = (i) => [KX0 + (i % KCOL) * (KTW + KGX), KY0 + Math.floor(i / KCOL) * (KTH + KGY), KTW, KTH];
    const ctr = (i) => { const c = cell(i); return [c[0] + c[2] / 2, c[1] + c[3] / 2]; };
    const free = (i) => !B[i].owner && !B[i].up;
    const g = {
      snapY: 70,
      init() {
        sg = api.duel ? api.duel.stage : 0; memP = KMEM[sg];
        const ic = []; for (const k of KICONS) ic.push(k, k); for (let i = ic.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [ic[i], ic[j]] = [ic[j], ic[i]]; }
        B = ic.map((icon) => ({ icon, up: false, owner: null, flip: 0, pop: 0 })); turn = 'me'; phase = 'pick'; open = []; resT = 0; mem = {}; pop = 0; cur = 0; curOn = false; idleT = 0; lastWho = null;
        ai = { st: 'rest', x: KREST[0], y: KREST[1], tx: KREST[0], ty: KREST[1], t: 0, pick: -1, face: 0, fly: false, hop: 0 };
      },
      demo() { const j = B.findIndex((b, k) => k > 0 && b.icon === B[0].icon); for (const i of [0, j]) { B[i].up = true; B[i].owner = 'me'; B[i].flip = 1; } const m = B.findIndex((b, k) => free(k)); B[m].up = true; B[m].flip = 1; const c = cell(m); ai.x = c[0] + c[2] / 2 + 3; ai.y = c[1] + c[3] + 2; ai.st = 'look'; },
      update(dt) {
        for (const b of B) { const to = b.up ? 1 : 0; b.flip += (to - b.flip) * Math.min(1, dt * 14); if (Math.abs(to - b.flip) < 0.01) b.flip = to; if (b.pop > 0) b.pop -= dt; }
        if (pop > 0) pop -= dt; if (ai.face > 0) ai.face -= dt;
        if (phase === 'res') { resT -= dt; if (resT <= 0) resolve(); }
        else if (turn === 'me' && !api.over_) { idleT += dt; if (idleT > 7) { idleT = 0; tip('Открой две карточки — найди одинаковые!'); } }
        stepAI(dt);
      },
      render(ctx, P) {
        ctx.drawImage(bgKeys(), 0, 0); const over = api.over_, d = api.duel || {};
        for (let i = 0; i < B.length; i++) drawTag(ctx, P, i);
        if (curOn && turn === 'me' && phase === 'pick' && !over) { const c = cell(cur), bl = Math.floor(gT * 4) % 2; ctx.globalAlpha = bl ? 1 : 0.6; P.r(c[0] - 2, c[1] - 2, c[2] + 4, 1, '#ffe066'); P.r(c[0] - 2, c[1] + c[3] + 1, c[2] + 4, 1, '#ffe066'); P.r(c[0] - 2, c[1] - 2, 1, c[3] + 4, '#ffe066'); P.r(c[0] + c[2] + 1, c[1] - 2, 1, c[3] + 4, '#ffe066'); ctx.globalAlpha = 1; }
        // turn marker: a bouncing arrow over whoever plays now
        if (!over && (turn === 'me' || ai.y > 200)) { const me = turn === 'me', ax = me ? 46 : Math.round(ai.x), ay = me ? 214 : Math.round(ai.y) - 30; /* on the board his walk shows the turn — no arrow over the tags */ const by = ay + (Math.floor(gT * 4) % 2); P.r(ax - 3, by, 7, 2, '#3b2433'); P.r(ax - 2, by + 2, 5, 2, '#3b2433'); P.r(ax - 1, by + 4, 3, 2, '#3b2433'); P.r(ax - 2, by, 5, 1, '#ffd23a'); P.r(ax - 1, by + 2, 3, 1, '#ffd23a'); P.p(ax, by + 4, '#ffd23a'); }
        // Абибян at the table, watching the tags
        P.shadow(46, 304, 26 * GK(0.78), 5, 0.3);
        const q = mp(0.78, { pose: 'idle' }); q.eyes = { mode: 'open', look: turn === 'me' ? [0, -1] : [1, -1] };
        if (pop > 0 && lastWho === 'me') { q.eyes = { mode: 'happy' }; q.mouth = 'laugh'; q.pose = 'up'; }
        else if (pop > 0 && lastWho === 'meMiss') { q.eyes = { mode: 'closed' }; q.mouth = 'frown'; q.pose = 'shrug'; }
        if (over) { if (d.win) { q.pose = 'up'; q.eyes = { mode: 'happy' }; q.mouth = 'laugh'; } else { q.pose = 'idle'; q.eyes = { mode: 'closed' }; q.mouth = 'frown'; q.tear = 1; } }
        drawM(ctx, q, 46, 304);
        // Жучок: a shadow on the mat / floor, flaps over long hops, walks on the tags
        const onMat = ai.y < 200, sy = onMat ? ai.y + 1 : KREST[1] + 1; P.shadow(Math.round(ai.x), Math.round(sy), 6, 1.5, ai.fly ? 0.12 : 0.24);
        let pose = ai.fly ? 'fly' : ai.st === 'go' ? 'walk' : ai.face > 0 ? (lastWho === 'fr' ? 'happy' : 'look') : ai.st === 'think' || ai.st === 'think2' ? 'look' : 'idle';
        if (over) pose = d.win ? 'look' : 'happy';
        const e = FART.sprite('zhuk', { pose, f: Math.floor(gT * (ai.fly ? 14 : 6)) % 2, look: ai.st === 'think' || ai.st === 'think2' ? [Math.sin(gT * 3) > 0 ? 1 : -1, 0] : null });
        const hy = ai.fly ? -6 - Math.round(Math.sin(gT * 9) * 1.5) : -Math.round(ai.hop);
        ctx.drawImage(e.cv, Math.round(ai.x - e.ox), Math.round(ai.y - e.oy + hy));
      },
      down(x, y) {
        if (turn !== 'me' || phase !== 'pick' || api.over_) return;
        for (let i = 0; i < B.length; i++) { const c = cell(i); if (x >= c[0] - 1 && x < c[0] + c[2] + 1 && y >= c[1] - 2 && y < c[1] + c[3] + 2) { flipI(i, 'me'); return; } }
      },
      key(k, dn) {
        if (!dn || turn !== 'me' || phase !== 'pick') return;
        const mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -KCOL, ArrowDown: KCOL }[k];
        if (mv) { if (curOn) cur = (cur + mv + B.length) % B.length; curOn = true; snd('tab'); return; }
        if (k === 'Space' || k === 'Enter') { if (!curOn) { curOn = true; return; } flipI(cur, 'me'); }
      },
      cell, get board() { return B; }, get turn() { return turn; }, get phase() { return phase; }, get ai() { return ai; }, get memP() { return memP; },
    };
    function flipI(i, who) {
      if (!B[i] || !free(i) || open.length >= 2) return false;
      B[i].up = true; open.push(i); idleT = 0; tip(null); snd('flip');
      if (rng() < memP) mem[i] = B[i].icon; // whoever opened it, Жучок may remember what he saw
      if (open.length === 2) { phase = 'res'; resT = B[open[0]].icon === B[open[1]].icon ? 0.55 : 0.95; }
      return true;
    }
    function resolve() {
      const [a, b] = open; open = []; phase = 'pick';
      if (B[a].icon === B[b].icon) {
        B[a].owner = B[b].owner = turn; B[a].pop = B[b].pop = 0.5; delete mem[a]; delete mem[b]; lastWho = turn; pop = 0.8;
        const [x, y] = ctr(a), [x2, y2] = ctr(b); for (const [px, py] of [[x, y], [x2, y2]]) for (let k = 0; k < 6; k++) fx.spawn('spark', px + rnd(-8, 8), py + rnd(-10, 10), { vy: -30, life: 0.6 });
        if (turn === 'me') { snd('keys'); snd('coin'); flt(x2, y2 - 20, 'Пара! +1'); } else { snd('keys'); snd('chirr'); ai.face = 0.8; }
        api.duelPts(turn, 1); if (turn === 'fr' && !api.over_) { ai.st = 'think'; ai.t = 0.5 + rng() * 0.3; }
      } else {
        B[a].up = B[b].up = false; snd('nope'); lastWho = turn === 'me' ? 'meMiss' : 'frMiss'; pop = 0.6; if (turn === 'fr') ai.face = 0.6;
        turn = turn === 'me' ? 'fr' : 'me';
        if (turn === 'fr') { ai.st = 'think'; ai.t = 0.6 + rng() * 0.4; msg('Ход Жучка…'); } else { ai.st = 'home'; setT(KREST[0], KREST[1]); msg('Твой ход!'); }
      }
    }
    // decision layer: a remembered pair first, else an unseen tag; for the 2nd tag — the twin he remembers, else another unseen one
    function choose(first) {
      const o = B.map((b, i) => i).filter((i) => free(i) && i !== first);
      if (first < 0) { const by = {}; for (const i of o) if (mem[i] !== undefined) (by[mem[i]] = by[mem[i]] || []).push(i); const pr = Object.values(by).find((q) => q.length >= 2); if (pr) return pr[0]; }
      else { const j = o.find((i) => mem[i] === B[first].icon); if (j !== undefined) return j; }
      const u = o.filter((i) => mem[i] === undefined), L = u.length ? u : o; return L[Math.floor(rng() * L.length)];
    }
    function setT(x, y) { ai.tx = x; ai.ty = y; ai.fly = Math.hypot(x - ai.x, y - ai.y) > 46 || ai.y > 200 || y > 200; }
    // motion layer + FSM (one state at a time, transitions inside the states)
    function stepAI(dt) {
      if (ai.hop > 0) ai.hop = Math.max(0, ai.hop - dt * 20);
      const moving = ai.st === 'go' || ai.st === 'home';
      if (moving) { const dx = ai.tx - ai.x, dy = ai.ty - ai.y, dd = Math.hypot(dx, dy), sp = ai.fly ? 150 : 80, stp = Math.min(dd, sp * dt * Math.min(1, 0.35 + dd / 24));
        if (dd > 0.5) { ai.x += dx / dd * stp; ai.y += dy / dd * stp; if (!ai.fly) ai.hop = Math.abs(Math.sin(gT * 18)) * 2; } else { ai.x = ai.tx; ai.y = ai.ty; ai.fly = false; ai.st = ai.st === 'go' ? 'flip' : 'rest'; ai.t = 0.18; } }
      if (api.over_ || turn !== 'fr') return;
      if (ai.st === 'think' || ai.st === 'think2') { ai.t -= dt; if (ai.t <= 0) { ai.pick = choose(ai.st === 'think2' ? open[0] : -1); const c = cell(ai.pick); setT(c[0] + c[2] / 2 + 3, c[1] + c[3] + 2); ai.st = 'go'; /* he stands at the tag's lower edge and reaches up: its picture stays visible */ } }
      else if (ai.st === 'flip') { ai.t -= dt; if (ai.t <= 0) { flipI(ai.pick, 'fr'); ai.hop = 3; if (open.length === 1) { ai.st = 'think2'; ai.t = 0.35 + rng() * 0.35; } else ai.st = 'wait'; } }
    }
    function drawTag(ctx, P, i) {
      const b = B[i], [x, y, w, h] = cell(i), f = b.flip, sx = Math.abs(f * 2 - 1), face = f > 0.5, cx = x + w / 2;
      const ww = Math.max(2, Math.round(w * sx)), xx = Math.round(cx - ww / 2), lift = b.pop > 0 ? -Math.round(Math.sin((0.5 - b.pop) / 0.5 * Math.PI) * 3) : 0, yy = y + lift;
      P.r(xx + 1, y + h, ww - 1, 1, 'rgba(20,10,20,0.35)');
      if (!face) { // the back: a brass-rimmed leather tag with a little key hole
        P.rbox(xx, yy, ww, h, ['#3b2433', '#6e3a1c', '#9a5428', '#c07a40']);
        if (ww > 10) { P.r(cx - 3, yy + 3, 6, 3, '#3b2433'); P.r(cx - 2, yy + 4, 4, 1, '#e8c860'); P.circ(cx, yy + h / 2, 3.5, '#5a2e14'); P.circ(cx, yy + h / 2, 2.2, '#3b2433'); P.r(cx - 1, yy + h / 2, 2, 5, '#3b2433'); P.p(cx - 2, yy + h / 2 - 2, '#c07a40'); for (const [px, py] of [[4, 10], [w - 5, 10], [4, h - 5], [w - 5, h - 5]]) P.p(xx + px * sx, yy + py, '#e8c860'); }
      } else {
        const own = b.owner, rim = own === 'me' ? ['#3b2433', '#c8962a', '#ffd23a', '#fff0a0'] : own === 'fr' ? ['#3b2433', '#7a5430', '#cca06a', '#f0d4a4'] : ['#3b2433', '#c8b89a', '#f4ead8', '#ffffff'];
        P.rbox(xx, yy, ww, h, rim); P.r(xx + 2, yy + 2, ww - 4, h - 4, '#fbf6ea'); if (ww > 4) P.hl(xx + 3, yy + 2, ww - 6, '#ffffff');
        if (ww > 12) { const im = keyArt(b.icon); ctx.drawImage(im, Math.round(cx - im.width / 2), Math.round(yy + 11 - im.height / 2)); }
        if (own && ww > 12) { const c = own === 'me' ? '#e8a020' : '#8a6238'; P.r(cx - 3, yy + h - 7, 6, 3, c); P.hl(cx - 2, yy + h - 7, 4, own === 'me' ? '#ffe066' : '#d8ae74'); } // a little ribbon: whose pair it is
      }
    }
    return g;
  }

  // =====================================================================
  // 6) Банановая башня (Round 6 E, the powerful computer) — a tower crane carries banana crates; tap → the crate drops onto the tower,
  // whatever hangs over the edge is sawn off (the next crate is that narrow); a perfect drop keeps the width (+2 back) and every 3rd in a
  // row gives a coin; a full miss costs a heart. Each level = a storey: a concrete slab goes on top and the width is full again.
  // He rides the crane trolley on top of the jib and pulls the lever.
  // =====================================================================
  const SCH = 13, SBW = 60, SGND = 300, STOP = 236, SBEAM = 80, SHANG = 106;
  function bgStack() { return once('bgStack', () => tile(RW, RH, (P) => {
    ROOMS.vgrad(P, 0, 0, RW, RH, ['#5aa8e8', '#8cc8f0', '#c4e4f8', '#f4ead0']);
    for (let k = 0; k < 4; k++) ROOMS.cloud(P, 14 + k * 46, 30 + (k % 2) * 26 + k * 8, 0.6 + (k % 3) * 0.15);
  })); }
  function cityStack() { return once('cityStack', () => tile(RW, 70, (P) => {
    for (let k = 0; k < 9; k++) { const w = 14 + Math.floor(PX.hash(k, 1, 9) * 12), h = 22 + Math.floor(PX.hash(k, 2, 9) * 40), x = k * 21 - 4; P.r(x, 70 - h, w, h, '#9ab0c8'); P.r(x, 70 - h, w, 1, '#b4c8dc');
      for (let yy = 70 - h + 4; yy < 66; yy += 6) for (let xx = x + 3; xx < x + w - 2; xx += 5) P.r(xx, yy, 2, 3, PX.hash(xx, yy, 4) > 0.6 ? '#f4e8a8' : '#7a90a8'); }
  })); }
  function crate(ctx, P, x, y, w, rot) { // a wooden banana crate, w × SCH; rot: drawn turned around its centre (a sawn-off piece)
    if (w < 1) return; x = Math.round(x); y = Math.round(y); w = Math.round(w);
    if (rot) { ctx.save(); ctx.translate(x + w / 2, y + SCH / 2); ctx.rotate(rot); ctx.translate(-x - w / 2, -y - SCH / 2); }
    P.r(x, y, w, SCH, '#3b2433'); if (w > 2) { P.r(x + 1, y + 1, w - 2, SCH - 2, '#c8893a'); P.r(x + 1, y + 6, w - 2, 1, '#a86a28'); P.r(x + 1, y + 1, w - 2, 1, '#e0a858'); }
    for (let k = x + 3; k < x + w - 3; k += 7) { P.p(k, y + 2, '#ffd23a'); P.p(k + 1, y + 2, '#ffd23a'); P.p(k + 2, y + 3, '#e8b820'); } // bananas peeking over the top board
    for (let k = x + 9; k < x + w - 4; k += 14) P.r(k, y + 2, 1, SCH - 4, '#a86a28'); // planks
    if (w > 22) { const c = Math.round(x + w / 2); P.r(c - 3, y + 8, 6, 3, '#f4e6c8'); P.p(c - 1, y + 9, '#ffd23a'); P.p(c, y + 9, '#ffd23a'); } // a little banana sticker
    if (rot) ctx.restore();
  }
  function Stack() {
    let tower, top, w, hx, dir, v, phase, pt, fall, chips, cam, placed, need, perf, streak, mood, moodT;
    const tall = typeof cv !== 'undefined' && cv && cv.height > RH;
    const bY = tall ? 92 : SBEAM, hY = bY + 26, stopY = tall ? 248 : STOP;
    const g = {
      snapY: 150,
      init(L) { tower = []; top = { x: 90 - SBW / 2, w: SBW, y: SGND }; chips = []; cam = 0; streak = 0; setup(L); },
      onLevel(L) { // the storey is done: a concrete slab on top, full width again
        const sx = 90 - SBW / 2 - 2; tower.push({ x: sx, w: SBW + 4, y: top.y - 4, slab: 1 }); top = { x: 90 - SBW / 2, w: SBW, y: top.y - 4 }; setup(L); flt(90, 150, 'Этаж готов!'); snd('clank');
      },
      demo() { for (let i = 0; i < 6; i++) { const x = top.x + (i % 3 - 1) * 3, ov = top.w - 3 * (i % 2); tower.push({ x, w: ov, y: top.y - SCH }); top = { x, w: ov, y: top.y - SCH }; } w = top.w; cam = Math.max(0, stopY - top.y); },
      update(dt) {
        cam += (Math.max(0, stopY - top.y) - cam) * Math.min(1, dt * 5);
        if (moodT > 0) moodT -= dt;
        for (const c of chips) { c.vy += 520 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt; } chips = chips.filter((c) => c.y + cam < 460);
        if (phase === 'aim') { hx += dir * v * dt; const lo = Math.max(18, w / 2 + 4), hi = Math.min(RW - 18, RW - w / 2 - 4); /* he rides the trolley: never off the screen */ if (hx < lo) { hx = lo; dir = 1; } if (hx > hi) { hx = hi; dir = -1; } }
        else if (phase === 'drop') {
          fall.vy += 900 * dt; fall.y += fall.vy * dt;
          if (!fall.miss && fall.y + SCH >= top.y) land();
          else if (fall.miss && fall.y + cam > RH + 30) { phase = 'wait'; pt = 0; }
        } else if (phase === 'wait') { pt += dt; if (pt > 0.35 && !api.over_) { phase = 'aim'; hx = dir > 0 ? Math.max(18, w / 2 + 4) : Math.min(RW - 18, RW - w / 2 - 4); } }
      },
      render(ctx, P) {
        const cvEl = ctx.canvas, ch = (cvEl && cvEl.height) || RH;
        ctx.drawImage(bgStack(), 0, 0);
        if (ch > RH) P.r(0, RH, RW, ch - RH, '#f4ead0');
        const cy = Math.round(SGND - 64 + cam * 0.35);
        ctx.drawImage(cityStack(), 0, cy);
        const gy = Math.round(SGND + cam);
        if (gy > cy + 70) P.r(0, cy + 70, RW, Math.min(ch, gy) - (cy + 70), '#9ab0c8');
        if (gy < ch) { P.r(0, gy, RW, ch - gy, '#8a6a48'); P.r(0, gy, RW, 2, '#6a4a30'); for (let k = 0; k < 30; k++) P.p(Math.floor(PX.hash(k, 3, 5) * RW), gy + 3 + Math.floor(PX.hash(k, 4, 5) * Math.max(16, ch - gy)), '#a88a64');
          P.r(90 - SBW / 2 - 6, gy - 3, SBW + 12, 4, '#3b2433'); P.r(90 - SBW / 2 - 5, gy - 2, SBW + 10, 2, '#a8aeb8'); } // the foundation
        for (const b of tower) { const y = b.y + cam; if (y > ch || y < -SCH) continue; if (b.slab) { P.r(Math.round(b.x), Math.round(y), b.w, 4, '#3b2433'); P.r(Math.round(b.x) + 1, Math.round(y) + 1, b.w - 2, 2, '#b4bac4'); } else crate(ctx, P, b.x, y, b.w); }
        for (const c of chips) crate(ctx, P, c.x, c.y + cam, c.w, c.rot);
        // the crane: a lattice jib at bY across the screen, the trolley at hx, the rope and the hook
        P.r(0, bY - 4, RW, 9, '#3b2433'); P.r(0, bY - 3, RW, 2, '#ffc22a'); P.r(0, bY + 2, RW, 2, '#ffc22a');
        for (let x = 0; x < RW; x += 8) { P.line(x, bY - 1, x + 4, bY + 1, '#e8a810'); P.line(x + 4, bY + 1, x + 8, bY - 1, '#e8a810'); }
        const tx = Math.round(hx); P.r(tx - 7, bY + 4, 14, 4, '#3b2433'); P.r(tx - 6, bY + 5, 12, 2, '#5a6270');
        if (phase === 'aim') { P.vl(tx, bY + 8, hY - bY - 10, '#3b3742'); P.r(tx - 2, hY - 3, 5, 3, '#3b2433'); crate(ctx, P, hx - w / 2, hY, w); }
        else { P.vl(tx, bY + 8, hY - bY - 14, '#3b3742'); P.r(tx - 2, hY - 7, 5, 3, '#3b2433'); }
        if (phase === 'drop' && fall) crate(ctx, P, fall.x, fall.y + cam, fall.w);
        // Абибян on the trolley, legs tucked, one hand on the lever
        const p = mp(0.5, { legs: 'tuck', pose: 'idle' }); p.eyes = { mode: 'open', look: [0, 1] };
        if (moodT > 0 && mood === 'perfect') { p.pose = 'up'; p.eyes = { mode: 'happy' }; p.mouth = 'laugh'; }
        else if (moodT > 0 && mood === 'cut') { p.eyes = { mode: 'wide', look: [0, 1] }; p.mouth = 'o'; p.open = 0.67; }
        else if (moodT > 0 && mood === 'miss') { p.pose = 'cover'; p.mouth = 'wavy'; }
        else if (phase === 'aim') { p.armR = [14, -34]; }
        if (api.over_) { p.pose = 'idle'; p.eyes = { mode: 'dizzy' }; p.mouth = 'wavy'; }
        drawM(ctx, p, tx, bY - 3);
        // storey counter on the left (kept cleanly below #ghud on iPhone 17)
        const pipY = ch > RH ? 50 : 22;
        for (let i = 0; i < need; i++) { const x = 6 + (i % 12) * 7, y = pipY + Math.floor(i / 12) * 7; P.r(x, y, 5, 5, '#3b2433'); P.r(x + 1, y + 1, 3, 3, i < placed ? '#ffd23a' : '#6a7484'); }
      },
      down() { if (phase !== 'aim') return; phase = 'drop'; fall = { x: hx - w / 2, y: hY - cam, w, vy: 0, miss: false };
        const ov = Math.min(fall.x + w, top.x + top.w) - Math.max(fall.x, top.x); if (ov <= 0) fall.miss = true; snd('whoosh'); },
      key(k, d) { if (d && (k === 'Space' || k === 'Enter' || k === 'ArrowDown')) g.down(); },
      // test hooks
      st: () => ({ phase, hx, w, top: Object.assign({}, top), placed, need, cam, chips: chips.length, streak, n: tower.length, v, perf }),
      dropAt(x) { if (phase !== 'aim') return false; hx = clamp(x, Math.max(18, w / 2 + 4), Math.min(RW - 18, RW - w / 2 - 4)); g.down(); return true; },
    };
    function setup(L) { w = SBW; placed = 0; need = Math.min(12, 6 + Math.floor(L / 2)); v = Math.min(150, 45 + 8 * L); perf = Math.max(1, 3 - Math.floor(L / 4)); phase = 'aim'; dir = 1; hx = w / 2 + 4; pt = 0; fall = null; mood = null; moodT = 0; api.prog(0); }
    function land() {
      const x = fall.x, l = Math.max(x, top.x), r = Math.min(x + w, top.x + top.w), y = top.y - SCH;
      if (Math.abs(x - top.x) <= perf) { // perfect: snapped, nothing to saw, a bit of width back
        const nw = Math.min(SBW, top.w + 2), nx = Math.min(top.x, RW - 4 - nw); tower.push({ x: nx, w: nw, y }); top = { x: nx, w: nw, y }; streak++; mood = 'perfect'; moodT = 0.7;
        snd('crate'); flt(hx, 150, 'Идеально!'); if (streak % 3 === 0) api.bonus(1, hx, 140);
        for (let k = 0; k < 6; k++) fx.spawn('spark', top.x + rnd(0, top.w), y + cam, { life: 0.5, vy: -20 });
      } else {
        const nw = r - l; tower.push({ x: l, w: nw, y }); const cx = x < top.x ? x : r, cw = w - nw; // the overhang goes off with the saw
        chips.push({ x: cx, y, w: cw, vx: x < top.x ? -40 : 40, vy: -60, rot: 0, vr: x < top.x ? -3 : 3 }); top = { x: l, w: nw, y }; streak = 0; mood = 'cut'; moodT = 0.6;
        snd('crate'); laterSfx(60, 'saw');
      }
      w = top.w; placed++; api.prog(placed / need); phase = 'wait'; pt = 0; fall = null;
      if (placed >= need) api.levelUp();
    }
    // a full miss: the crate falls past the tower (hurt), the next one keeps the width
    const _down = g.down; g.down = () => { const was = phase; _down(); if (was === 'aim' && fall && fall.miss) { mood = 'miss'; moodT = 0.9; streak = 0; laterSfx(450, 'crate', () => !api.over_); api.hurt(); } };
    return g;
  }

  // =====================================================================
  // 7) Супер Абибян (Round 7 #6, Nintendo Switch 2) — a one-button auto-runner. He runs right by himself; press = jump, hold = higher
  // (gravity is lighter while held and rising, a release cuts the rise), a press just before landing is buffered. Pipes: the short one
  // needs a medium hold, the tall one a long hold (a tap clears neither); pits up to a full jump wide; angry mushrooms walk at him — land
  // on one to squash it (bounce; a 2nd in the same air = +1); bees fly just over his head (any jump into one hurts); «?» blocks: bonk one
  // from below = +1. The flag at the end: the higher he grabs it, the more (+2 / +1); then «Уровень N». 3 hearts: pipe sides, mushrooms,
  // bees and pits take one (a pit drops him back in after it). Pays ×3 per level (DATA.GAMES.pay).
  // =====================================================================
  const SU = { GY: 250, MS: 0.34, MW: 12, MH: 26, JV: 250, GH: 500, G: 1100, CUT: 90, VMAX: 420, PW: 18, SHORT: 14, TALL: 30, PIT_MAX: 48, BEE_Y: 42, BEE_LOW: 37, BLOCK: 44, EW: 12, EH: 11 };
  const suV = (L) => 66 + 14 * Math.sqrt(Math.max(0, L - 1));
  function suGen(L, seed) { // the level: obstacles left → right with room to land after each, forced tall pipe + wide pit, blocks, the flag
    const r = mul(mix(seed * 7919 + L * 104729)), v = suV(L), len = 1300 + 120 * Math.min(L, 10), obs = [], blocks = [];
    const pickW = (a) => { let s = 0; for (const q of a) s += q[1]; let k = r() * s; for (const q of a) { k -= q[1]; if (k <= 0) return q[0]; } return a[0][0]; };
    const kinds = [['pipeS', 2], ['pipeT', 2], ['pit', 3], ['enemy', 3]].concat(L >= 3 ? [['pair', 1.4]] : [], L >= 2 ? [['bee', 1.6 + Math.min(1.5, L * 0.15)]] : []);
    let x = 150, prev = null;
    while (true) {
      const k = pickW(kinds), base = Math.max(48, v * 0.7) + 8, extra = (k === 'enemy' || k === 'pair' ? 40 : k === 'bee' ? 56 : 0) + (prev === 'bee' ? 30 : 0);
      if (obs.length) x += base + extra + r() * Math.max(24, 120 - 9 * Math.min(L, 10));
      if (x > len - 160) break;
      if (k === 'pipeS' || k === 'pipeT') obs.push({ type: 'pipe', x, w: SU.PW, h: k === 'pipeT' ? SU.TALL + (L >= 4 && r() < 0.4 ? 4 : 0) : SU.SHORT });
      else if (k === 'pit') obs.push({ type: 'pit', x: Math.ceil(x / 12) * 12, w: [24, 36, 48][Math.min(2, Math.floor(r() * (L >= 2 ? 3 : 2.6)))] });
      else if (k === 'enemy') obs.push({ type: 'enemy', x, w: SU.EW });
      else if (k === 'pair') { obs.push({ type: 'enemy', x, w: SU.EW, pairA: 1 }); x += 18; obs.push({ type: 'enemy', x, w: SU.EW, pair: 1 }); }
      else obs.push({ type: 'bee', x, w: 10 });
      x = obs[obs.length - 1].x + obs[obs.length - 1].w; prev = k === 'pair' ? 'enemy' : k;
    }
    const force = (test, make) => { if (obs.some(test)) return; const c = obs.filter((o) => !o.pair && !o.pairA && !(o.type === 'pipe' && o.h >= SU.TALL) && !(o.type === 'pit' && o.w >= 36)); const o = c.length ? c[Math.floor(r() * c.length)] : null; if (!o) return; const w0 = o.w; Object.assign(o, make()); const d = o.w - w0; for (const q of obs) if (q.x > o.x) q.x += d; };
    force((o) => o.type === 'pipe' && o.h >= SU.TALL, () => ({ type: 'pipe', w: SU.PW, h: SU.TALL }));
    force((o) => o.type === 'pit' && o.w >= 36, () => ({ type: 'pit', w: 36 + (r() < 0.5 ? 12 : 0) }));
    for (const o of obs) if (o.type === 'pit') o.x = Math.ceil(o.x / 12) * 12; // pits on the 12-px tile grid (the bricks are cut cleanly)
    // «?» blocks over long flat stretches (not over a pit / pipe), at least one
    const flatAt = (x0) => !obs.some((o) => x0 > o.x - 30 && x0 < o.x + o.w + 30);
    for (let i = 0; i <= obs.length; i++) { const a = i ? obs[i - 1].x + obs[i - 1].w : 60, b = i < obs.length ? obs[i].x : len - 120; if (b - a > 92 && r() < 0.55) { const bx = Math.round((a + b) / 2 - 6); if (flatAt(bx)) blocks.push({ x: bx, y: SU.BLOCK }); } }
    if (!blocks.length) blocks.push({ x: obs.length ? Math.min(100, obs[0].x - 40) : 100, y: SU.BLOCK });
    return { obs, blocks, flag: len - 40, len, v };
  }
  function bgSuper() { return once('bgSuper', () => tile(RW, RH, (P) => { ROOMS.vgrad(P, 0, 0, RW, RH, ['#4aa8f0', '#7cc4f4', '#b8e2fa', '#dff2fc']); })); }
  function hillsSuper() { return once('hillsSuper', () => tile(240, 60, (P) => { // far hills (parallax), a repeating 240-px strip
    for (const [cx, w, h, c] of [[40, 70, 44, '#7cc85a'], [150, 90, 56, '#6ab84a'], [215, 60, 34, '#7cc85a']]) for (let x = -w; x <= w; x++) { const y = Math.round(h * Math.sqrt(Math.max(0, 1 - (x / w) ** 2))); for (const dx of [0, 240, -240]) P.r(cx + x + dx, 60 - y, 1, y, c); }
    for (let k = 0; k < 22; k++) P.p(Math.floor(PX.hash(k, 1, 7) * 240), 40 + Math.floor(PX.hash(k, 2, 7) * 18), '#5aa83a');
  })); }
  function suBrick(P, x, y) { P.r(x, y, 12, 12, '#c8743a'); P.r(x, y, 12, 1, '#e0945a'); P.r(x, y + 5, 12, 1, '#8a4a22'); P.r(x, y + 11, 12, 1, '#8a4a22'); P.r(x + 5, y, 1, 5, '#8a4a22'); P.r(x + 2, y + 6, 1, 5, '#8a4a22'); P.r(x + 9, y + 6, 1, 5, '#8a4a22'); P.p(x + 1, y + 1, '#f0b07a'); }
  function suPipe(P, x, top, h) { const w = SU.PW; x = Math.round(x); const y = Math.round(top);
    P.r(x + 1, y + 6, w - 2, h - 6, '#123a12'); P.r(x + 2, y + 6, w - 4, h - 6, '#3fae3a'); P.r(x + 4, y + 6, 3, h - 6, '#7fe06a'); P.r(x + w - 5, y + 6, 2, h - 6, '#1f7a1f');
    P.r(x - 1, y, w + 2, 7, '#123a12'); P.r(x, y + 1, w, 5, '#3fae3a'); P.r(x + 2, y + 1, 3, 5, '#8af07a'); P.r(x + w - 4, y + 1, 3, 5, '#1f7a1f'); }
  function suBlock(P, x, y, used, bump) { x = Math.round(x); y = Math.round(y - bump);
    P.r(x, y, 12, 12, '#5a2a0a'); P.r(x + 1, y + 1, 10, 10, used ? '#a8743a' : '#f4b82a'); if (used) { P.r(x + 1, y + 1, 10, 1, '#c8945a'); return; }
    P.r(x + 1, y + 1, 10, 1, '#ffe08a'); P.r(x + 1, y + 10, 10, 1, '#c8841a'); for (const [a, b] of [[2, 2], [9, 2], [2, 9], [9, 9]]) P.p(x + a, y + b, '#8a4a12');
    for (const [a, b] of [[5, 3], [6, 3], [7, 4], [6, 5], [5, 6], [5, 8]]) P.p(x + a, y + b, '#ffffff'); P.p(x + 8, y + 4, '#8a4a12'); P.p(x + 6, y + 9, '#8a4a12'); }
  function suShroom(P, x, gy, step, flat) { x = Math.round(x); // an angry walking mushroom (flat = squashed)
    if (flat) { P.r(x - 6, gy - 4, 12, 4, '#3b1a0a'); P.r(x - 5, gy - 3, 10, 2, '#a8542a'); P.r(x - 3, gy - 2, 6, 1, '#f4d8a8'); return; }
    const f = Math.floor(step * 8) % 2, y = gy - 11;
    P.r(x - 6, y + 1, 12, 5, '#3b1a0a'); P.r(x - 5, y, 10, 1, '#3b1a0a'); P.r(x - 5, y + 1, 10, 5, '#a8542a'); P.r(x - 4, y + 1, 5, 1, '#d07a4a'); P.p(x - 3, y + 2, '#f4c8a0');
    P.r(x - 4, y + 6, 8, 3, '#f4d8a8'); P.p(x - 2, y + 6, '#ffffff'); P.p(x + 1, y + 6, '#ffffff'); P.p(x - 2, y + 7, '#1a0a04'); P.p(x + 1, y + 7, '#1a0a04'); P.p(x - 3, y + 5, '#1a0a04'); P.p(x + 2, y + 5, '#1a0a04');
    P.r(x - 5 + f, y + 9, 4, 2, '#1a0a04'); P.r(x + 1 - f, y + 9, 4, 2, '#1a0a04'); }
  function Super() {
    let lv, m, en, bees, used, cam, v, phase, pt, flagH, stomps, chain, heldBtn, buf, coy, step, mood, moodT, hop;
    const GY = SU.GY;
    const groundAt = (x) => !lv.obs.some((o) => o.type === 'pit' && x - SU.MW / 2 + 1 > o.x && x + SU.MW / 2 - 1 < o.x + o.w); // he stands while any part of him is over ground
    const pipeAt = (x) => lv.obs.find((o) => o.type === 'pipe' && x + SU.MW / 2 > o.x && x - SU.MW / 2 < o.x + o.w);
    const blockAt = (x) => lv.blocks.find((b) => x + SU.MW / 2 > b.x && x - SU.MW / 2 < b.x + 12);
    function jump() { m.vy = -SU.JV; m.ground = false; coy = 0; buf = 0; snd('jump'); }
    function phys(q, dt, hold) { const gr = hold && q.vy < 0 ? SU.GH : SU.G; q.vy = Math.min(SU.VMAX, q.vy + gr * dt); q.h -= q.vy * dt; } // q.h = feet height above the ground (up = +)
    const g = {
      snapY: SU.GY - 110, TUNE: SU,
      init(L) { stomps = 0; setup(L); },
      onLevel(L) { setup(L); },
      demo() { m.h = 26; m.vy = -40; m.ground = false; m.x = 120; cam = m.x - 52; const p0 = lv.obs.find((o) => o.type === 'pipe'); if (p0) { p0.x = 150; p0.h = SU.TALL; } en.push({ x: 196, vx: -18, alive: 1, flat: 0, step: 0 }); lv.blocks.push({ x: 104, y: SU.BLOCK }); },
      update(dt) {
        const L = api.level; step += dt; if (moodT > 0) moodT -= dt; if (m.inv > 0) m.inv -= dt;
        for (const b of lv.blocks) if (b.bump > 0) b.bump = Math.max(0, b.bump - dt);
        for (const c of hop) c.t += dt; hop = hop.filter((c) => c.t < 0.5);
        if (phase === 'dead') { m.vy += SU.G * dt; m.h -= m.vy * dt; return; }
        if (phase === 'flag') { pt += dt; if (m.h > 0) m.h = Math.max(0, m.h - 70 * dt); else { m.x += 40 * dt; m.step += dt; } cam += (m.x - 52 - cam) * Math.min(1, dt * 3);
          if (pt > 1.5 && !api.over_) { phase = 'next'; api.levelUp(); } return; }
        if (phase !== 'run') return;
        // horizontal: auto-run (a knock-back pushes him back for a moment)
        const x0 = m.x; if (m.kb > 0) { m.kb -= dt; m.x -= 34 * dt; } else { m.x += v * dt; m.step += dt; }
        const pp = pipeAt(m.x); if (pp && m.h < pp.h - 0.5) { // ran into a pipe's side
          m.x = Math.min(x0, pp.x - SU.MW / 2 - 0.5); if (m.kb <= 0) { m.kb = 0.3; m.vy = -110; m.ground = false; if (m.inv <= 0) hurt('pipe'); else snd('thunk'); } }
        // vertical
        const hold = heldBtn, ph0 = m.h; phys(m, dt, hold);
        if (m.vy < 0) { const b = blockAt(m.x); if (b && m.h + SU.MH > b.y && m.h < b.y + 10) { m.h = Math.min(m.h, b.y - SU.MH); m.vy = 40; if (b.used) snd('thunk'); else bonk(b); } } // the head bonks a block (from below, or rising into its side)
        let floor = groundAt(m.x) ? 0 : -999; const pq = pipeAt(m.x); if (pq) floor = Math.max(floor, pq.h); const bq = blockAt(m.x); if (bq && ph0 >= bq.y + 12 - 1) floor = Math.max(floor, bq.y + 12);
        if (m.vy >= 0 && m.h <= floor && ph0 >= floor - 0.01) { const air = !m.ground; m.h = floor; m.vy = 0; m.ground = true; coy = 0.08; chain = 0; if (air) { landFx(); if (buf > 0) jump(); } }
        else if (m.h > floor + 0.01 || floor < -900) { if (m.ground) { m.ground = false; } }
        if (!m.ground && coy > 0) coy -= dt; if (buf > 0) buf -= dt;
        if (m.h < -34) { pitFall(); return; }
        // mushrooms walk at him once on screen; they turn round at pits and pipes
        for (const e of en) { if (!e.alive) { e.flat -= dt; continue; } if (e.x - cam > RW + 12) continue; e.step += dt; const nx = e.x + e.vx * dt;
          const blocked = lv.obs.some((o) => (o.type === 'pit' && nx > o.x - 4 && nx < o.x + o.w + 4) || (o.type === 'pipe' && nx + 6 > o.x && nx - 6 < o.x + o.w)); if (blocked) e.vx = -e.vx; else e.x = nx;
          if (Math.abs(e.x - m.x) < (SU.MW + SU.EW) / 2 - 1 && m.h < SU.EH && m.h + SU.MH > 0) {
            if (m.vy > 0 && ph0 >= SU.EH - 7) stomp(e); else if (m.inv <= 0) { hurt('shroom'); m.kb = 0.3; m.vy = -140; m.ground = false; } } }
        for (const b of bees) { if (b.x - cam > RW + 12) continue; b.x -= 24 * dt; b.ph += dt; b.y = SU.BEE_Y + Math.sin(b.ph * 4) * 2;
          if (b.alive && Math.abs(b.x - m.x) < (SU.MW + 9) / 2 && m.h + SU.MH > b.y - 4 && m.h < b.y + 4) { if (m.vy > 0 && ph0 >= b.y + 1) { b.alive = 0; stomp(b); } else if (m.inv <= 0) { hurt('bee'); b.alive = 0; for (let k = 0; k < 5; k++) fx.spawn('crumb', b.x - cam, GY - b.y, { c: '#ffd23a', sz: 2, vx: rnd(-40, 40) - v, vy: rnd(-40, 20), g: 200, life: 0.6 }); } } }
        bees = bees.filter((b) => b.alive && b.x > cam - 20);
        cam = Math.max(cam, m.x - 52); api.prog(Math.min(1, m.x / lv.flag));
        if (m.x >= lv.flag - 4) { phase = 'flag'; pt = 0; flagH = m.h; const n = m.h >= 40 ? 2 : m.h >= 16 ? 1 : 0; snd('star'); if (n) api.bonus(n, lv.flag - cam, GY - m.h - 30); flt(lv.flag - cam, GY - 70, n === 2 ? 'Высоко!' : 'Флаг!'); m.x = lv.flag - 3; m.vy = 0; }
      },
      render(ctx, P) {
        const cvEl = ctx.canvas, ch = (cvEl && cvEl.height) || RH;
        ctx.drawImage(bgSuper(), 0, 0);
        if (ch > RH) P.r(0, RH, RW, ch - RH, '#dff2fc');
        for (let k = 0; k < 4; k++) { const cx = ((k * 70 + 30 - cam * 0.12) % 280 + 280) % 280 - 50; ROOMS.cloud(P, cx, 40 + (k % 2) * 22 + k * 6, 0.55 + (k % 3) * 0.12); }
        const hx = Math.round(-((cam * 0.3) % 240)); ctx.drawImage(hillsSuper(), hx, GY - 60); ctx.drawImage(hillsSuper(), hx + 240, GY - 60);
        // ground (bricks with a grass lip), with the pits cut out
        const x0 = Math.floor(cam / 12) * 12;
        for (let x = x0; x < cam + RW + 12; x += 12) { if (!groundTile(x)) continue; const sx = Math.round(x - cam); for (let y = GY; y < ch; y += 12) suBrick(P, sx, y); P.r(sx, GY - 1, 12, 3, '#3f9f2a'); P.r(sx, GY - 1, 12, 1, '#7fdf5a'); for (let k = 0; k < 3; k++) P.p(sx + 2 + k * 4, GY - 2, '#5fbf3a'); if (!groundTile(x - 12)) P.r(sx, GY - 1, 1, ch - GY + 1, '#5a2a0a'); if (!groundTile(x + 12)) P.r(sx + 11, GY - 1, 1, ch - GY + 1, '#5a2a0a'); }
        // the flag and the little castle
        const fx0 = Math.round(lv.flag - cam); if (fx0 > -40 && fx0 < RW + 40) {
          P.r(fx0, GY - 92, 1, 92, '#e8e8ec'); P.r(fx0 + 1, GY - 92, 1, 92, '#a8a8b4'); P.ell(fx0 + 0.5, GY - 94, 2.2, 2.2, '#3fdc7a'); P.r(fx0 - 4, GY - 3, 10, 3, '#5a5a66');
          const fy = Math.round(GY - 88 + (phase === 'flag' || phase === 'next' ? Math.min(70, pt * 70) : 0)); P.r(fx0 - 15, fy, 15, 10, '#ffd23a'); P.r(fx0 - 15, fy, 15, 1, '#fff08a'); P.r(fx0 - 15, fy + 9, 15, 1, '#c89a12'); P.ell(fx0 - 8, fy + 5, 3.5, 2, '#a86a28'); P.p(fx0 - 9, fy + 4, '#f4d8a8');
          const cx = fx0 + 36; for (let y = GY - 36; y < GY; y += 12) for (let x = cx; x < cx + 36; x += 12) suBrick(P, x, y); for (let k = 0; k < 3; k++) suBrick(P, cx + k * 12 + 2, GY - 44); P.r(cx + 14, GY - 18, 8, 18, '#1a0a04'); P.r(cx + 15, GY - 20, 6, 2, '#1a0a04'); }
        for (const o of lv.obs) if (o.type === 'pipe') { const sx = o.x - cam; if (sx > -24 && sx < RW + 4) suPipe(P, sx, GY - o.h, o.h + 2); }
        for (const b of lv.blocks) { const sx = b.x - cam; if (sx > -14 && sx < RW + 2) suBlock(P, sx, GY - b.y - 12, b.used, b.bump > 0 ? Math.sin(Math.PI * (1 - b.bump / 0.15)) * 3 : 0); }
        for (const e of en) { const sx = e.x - cam; if (sx < -14 || sx > RW + 14) continue; if (e.alive) suShroom(P, sx, GY, e.step, false); else if (e.flat > 0) suShroom(P, sx, GY, 0, true); }
        const bee = ARTG.bee(); for (const b of bees) { const sx = b.x - cam; if (sx > -14 && sx < RW + 14) { ctx.save(); ctx.translate(Math.round(sx) + 8, 0); ctx.scale(-1, 1); ctx.drawImage(bee, 0, Math.round(GY - b.y - 7)); ctx.restore(); if (Math.floor(step * 20) % 2) P.r(Math.round(sx) - 2, Math.round(GY - b.y - 8), 4, 1, '#ffffff'); } }
        // Абибян: run cycle / jump / fall; blinks while hurt; looks ahead
        if (!(m.inv > 0 && phase === 'run' && Math.floor(step * 14) % 2)) {
          const air = !m.ground && phase !== 'next', p = mp(SU.MS, { pose: phase === 'dead' ? 'idle' : air ? (m.vy < 0 ? 'up' : 'fall') : 'idle', legs: air ? (m.vy < 0 ? 'tuck' : 'spread') : (Math.floor(m.step * 10) % 2 ? 'walkL' : 'walkR') }, 1); p.eyes = { mode: 'open', look: [1, 0] };
          if (!air && phase === 'run') p.bob = Math.floor(m.step * 10) % 2;
          if (phase === 'dead') { p.eyes = { mode: 'dizzy' }; p.mouth = 'wavy'; }
          else if (moodT > 0 && mood === 'hurt') { p.eyes = { mode: 'wide', look: [1, 0] }; p.mouth = 'o'; p.open = 0.67; }
          else if ((moodT > 0 && mood === 'yay') || phase === 'flag' || phase === 'next') { p.eyes = { mode: 'happy' }; p.mouth = 'laugh'; }
          else if (air) { p.mouth = 'o'; p.open = 0.34; }
          if (phase === 'flag' && m.h > 0) { p.pose = 'up'; p.armL = [-6, -60]; p.armR = [6, -64]; }
          drawM(ctx, p, m.x - cam, GY - m.h);
        }
        // the coins popping out of the blocks
        for (const c of hop) { const k = c.t / 0.5; if (k > 1) continue; const img = ARTG.gold(); ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; ctx.drawImage(img, Math.round(c.x - cam + 6 - img.width / 4), Math.round(GY - c.y - 14 - Math.sin(Math.PI * k) * 22), img.width / 2, img.height / 2); ctx.globalAlpha = 1; }
      },
      down() { if (phase !== 'run') return; tip(null); heldBtn = true; if (m.ground || coy > 0) jump(); else buf = 0.12; },
      up() { heldBtn = false; if (m.vy < -SU.CUT) m.vy = -SU.CUT; },
      key(k, d) { if (k === 'Space' || k === 'ArrowUp' || k === 'Enter' || k === 'KeyW') { if (d) g.down(); else g.up(); } },
      // test hooks
      st: () => { const ah = ahead(); return { x: m.x, y: m.h, gy: GY, vy: m.vy, ground: m.ground, phase, v, len: lv.flag, cam, inv: m.inv, stomps, used: lv.blocks.filter((b) => b.used).length, ahead: ah, hearts: api.hearts }; },
      lab(tau) { const q = { h: 0, vy: -SU.JV }, dt = 1 / 240; let t = 0, apex = 0, above = { short: 0, tall: 0 };
        while (t < 3) { const hold = t < tau; phys(q, dt, hold); if (!hold && q.vy < -SU.CUT && t - dt < tau) q.vy = -SU.CUT; t += dt; apex = Math.max(apex, q.h); if (q.h >= SU.SHORT) above.short += dt; if (q.h >= SU.TALL) above.tall += dt; if (q.h <= 0 && q.vy > 0) break; }
        const need = (SU.PW + SU.MW) / suV(1); return { apex, air: t, dist: t * suV(1), clear: { short: above.short >= need, tall: above.tall >= need } }; },
      gen: (L, seed) => suGen(L, seed),
      place(kind, dx, w) { const x = m.x + SU.MW / 2 + dx; lv.obs = lv.obs.filter((o) => o.x > x + 160 || o.x + o.w < m.x - 40); en = en.filter((e) => e.x > x + 160 || e.x < m.x - 40); bees = [];
        if (kind === 'enemy') en.push({ x: x + SU.EW / 2, vx: -18, alive: 1, flat: 0, step: 0 }); else if (kind === 'block') lv.blocks.push({ x: x - 6, y: SU.BLOCK }); else if (kind === 'pit') lv.obs.push({ type: 'pit', x, w: w || 36 }); else if (kind === 'pipe') lv.obs.push({ type: 'pipe', x, w: SU.PW, h: w || SU.TALL }); },
    };
    function groundTile(x) { return !lv.obs.some((o) => o.type === 'pit' && x >= o.x - 0.5 && x + 12 <= o.x + o.w + 0.5); }
    function ahead() { // the next thing in his way (for the bots / tests): pipe / pit / live mushroom / bee, dx = from his front edge to its left edge
      const front = m.x + SU.MW / 2, back = m.x - SU.MW / 2, c = [];
      for (const o of lv.obs) if (o.type === 'pipe' || o.type === 'pit') if (o.x + o.w > back) c.push({ type: o.type, dx: o.x - front, w: o.w, h: o.h || 0 });
      for (const e of en) if (e.alive && e.x + SU.EW / 2 > back) c.push({ type: 'enemy', dx: e.x - SU.EW / 2 - front, w: SU.EW, h: SU.EH });
      for (const b of bees) if (b.x + 5 > back) c.push({ type: 'bee', dx: b.x - 5 - front, w: 10, h: b.y });
      c.sort((a, b) => a.dx - b.dx); return c[0] || null; }
    function setup(L) {
      lv = suGen(L, (api.seed() + L * 31) >>> 0); v = lv.v; en = []; bees = []; hop = []; used = 0; chain = 0; heldBtn = false; buf = 0; coy = 0; step = 0; mood = null; moodT = 0;
      for (const o of lv.obs) { if (o.type === 'enemy') en.push({ x: o.x + SU.EW / 2, vx: -18, alive: 1, flat: 0, step: 0 }); if (o.type === 'bee') bees.push({ x: o.x + 5, y: SU.BEE_Y, ph: o.x, alive: 1 }); }
      lv.obs = lv.obs.filter((o) => o.type === 'pipe' || o.type === 'pit'); for (const b of lv.blocks) { b.used = false; b.bump = 0; }
      m = { x: 30, h: 0, vy: 0, ground: true, kb: 0, inv: 0, step: 0 }; cam = 0; phase = 'run'; pt = 0; api.prog(0);
      if (L === api.st0) tip('Тапай — прыжок, держи — выше!');
    }
    function landFx() { for (let k = 0; k < 3; k++) fx.spawn('crumb', m.x - cam + rnd(-5, 5), GY - m.h, { c: '#e8e0c8', sz: 2, vx: rnd(-20, 20) - v * 0.5, vy: rnd(-30, -10), g: 200, life: 0.35 }); }
    function bonk(b) { b.used = true; b.bump = 0.15; used++; snd('pop'); hop.push({ x: b.x, y: b.y + 12, t: 0 }); api.bonus(1, b.x - cam + 6, GY - b.y - 34); }
    function stomp(e) { e.alive = 0; e.flat = 0.45; stomps++; chain++; mood = 'yay'; moodT = 0.5; snd('squeak'); m.vy = -(heldBtn ? 230 : 190); m.ground = false;
      for (let k = 0; k < 5; k++) fx.spawn('spark', e.x - cam + rnd(-6, 6), GY - rnd(2, 10), { life: 0.35, vx: -v }); if (chain >= 2) api.bonus(1, e.x - cam, GY - 30); else flt(e.x - cam, GY - 26, 'Бум!'); }
    function hurt(why) { mood = 'hurt'; moodT = 0.6; m.inv = 1.2; if (api.hurt()) die(); }
    function pitFall() { const o = lv.obs.find((q) => q.type === 'pit' && m.x > q.x - SU.MW && m.x < q.x + q.w + SU.MW); mood = 'hurt'; moodT = 0.6;
      if (api.hurt()) { die(); return; } m.inv = 1.5; m.x = o ? o.x + o.w + SU.MW : m.x + 30; m.h = 64; m.vy = 0; m.ground = false; m.kb = 0; snd('whoosh'); }
    function die() { phase = 'dead'; m.vy = -260; snd('fail'); }
    return g;
  }

  // =====================================================================
  // Round 7 #6b: «Банановые гонки» (PS5 Pro) — a pseudo-3D racer (a road of projected segments drawn front to back row by row, sprites back to front):
  // the car speeds up by itself; steer by dragging (the car goes under the finger; let go and it keeps to the nearest lane, but a sharp curve still
  // pushes it out) or by holding ← →. Traffic at one speed (never all three lanes at once), bananas (+1 s), golden bananas (+1 coin), peels (a skid)
  // from level 3; off the road is slow, a crash costs a heart and most of the speed; reach the finish before the clock runs out (time left → coins)
  const RA = { SEG: 200, RWID: 1000, CAMH: 2200, PZ: 1500, D: 112.5, HZ: 128, DRAW: 110, RUMB: 3, LANES: [-0.66, 0, 0.66], PX: 45, CAMF: 0.4, STEER: 2.4, HOLD: 0.8, DRIFT: 0.3, CK: 1.2,
    OFF: 1.05, XMAX: 1.75, CW: 0.5, ZA: -200, ZB: 300, REL: 3300, OFFV: 0.45, ACC: 1 / 3, BRAKE: 0.7, INV: 1.4, PEEL: 0.3, GRAB: 0.36 };
  const raV = (L) => 6000 + 900 * Math.sqrt(Math.max(0, L - 1)), raT = (v) => Math.max(0.45 * v, v - RA.REL); // top speed; the traffic's speed (he closes in on it at about the same rate on every level)
  const RSP = RA.D / RA.PZ, RY0 = RA.HZ + RSP * RA.CAMH; // the scale (px per world unit) and the screen y of the road at the car
  const ZSEG = { curve: 0, y: 0 };
  function raGen(L, seed) { // the track: eased curves, gentle hills, traffic groups (1–2 cars, never all 3 lanes), bananas, peels, the clock
    const r = mul(mix(seed * 7919 + L * 104729 + 13)), vmax = raV(L), Lc = Math.min(L, 10), n = 560 + 50 * Lc, len = n * RA.SEG, segs = [];
    const curve = new Array(n + 120).fill(0), ease = (t) => t * t * (3 - 2 * t);
    let i = 14, first = true;
    while (i < n - 30) {
      if (!first && r() < 0.35) { i += 12 + Math.floor(r() * 30); continue; }
      const c = (r() < 0.5 ? -1 : 1) * (2 + r() * (1 + 0.2 * Lc)), a = 8 + Math.floor(r() * 10), h = 14 + Math.floor(r() * (26 + 2 * Lc)), b = 8 + Math.floor(r() * 10);
      for (let k = 0; k < a + h + b && i < n - 10; k++, i++) curve[i] = c * (k < a ? ease((k + 0.5) / a) : k < a + h ? 1 : ease(1 - (k - a - h + 0.5) / b));
      first = false; i += 4 + Math.floor(r() * 16);
    }
    const A = 250 + 40 * Lc, l1 = 110 + r() * 60, l2 = 45 + r() * 25, f1 = r() * 6.28, f2 = r() * 6.28;
    for (let k = 0; k < n + 120; k++) { const env = Math.min(1, k / 30, Math.max(0, (n - 10 - k) / 30)); segs.push({ curve: curve[k], y: env > 0 ? A * env * (Math.sin(k / l1 * 6.283 + f1) + 0.3 * Math.sin(k / l2 * 6.283 + f2)) : 0 }); }
    // traffic: groups of 1–2 cars (2 = side by side, the third lane free), groups ≥ 1800 apart; all drive at one speed vt, placed so he catches them all along the track
    const vt = raT(vmax), cars = [], tEnc = 1.7 / (1 + 0.12 * (Lc - 1)), base = (vmax - vt) * tEnc, zEnd = 0.93 * len * (1 - vt / vmax) - 1.5 * vt;
    for (let zz = 3600; zz < zEnd;) {
      const l1c = cars.length ? Math.floor(r() * 3) : 1; cars.push({ z: zz, lane: l1c }); let w = 0;
      if (L >= 2 && r() < 0.16 + 0.03 * Lc) { let l2c = Math.floor(r() * 2); if (l2c >= l1c) l2c++; w = Math.floor(r() * 250); cars.push({ z: zz + w, lane: l2c }); }
      zz += w + Math.max(1800, base * (0.6 + 0.6 * r()));
    }
    for (const c of cars) c.x = RA.LANES[c.lane];
    // bananas (+1 s each, one or two golden = a coin), from level 3 banana peels (never just by a banana in the same lane)
    const bananas = [], nb = 7 + Math.min(6, L);
    for (let k = 0; k < nb; k++) bananas.push({ z: Math.round((0.06 + 0.9 * (k + 0.2 + 0.6 * r()) / nb) * len), x: RA.LANES[Math.floor(r() * 3)], gold: false });
    for (let k = 0; k < (L >= 4 ? 2 : 1); k++) bananas[Math.floor(r() * nb)].gold = true;
    if (!bananas.some((b) => b.gold)) bananas[0].gold = true;
    const peels = [];
    for (let k = 0, tries = 0; L >= 3 && k < Math.min(6, L - 2) && tries < 60; tries++) { const pz = Math.round((0.15 + 0.75 * r()) * len), px = RA.LANES[Math.floor(r() * 3)];
      const tp = pz / vmax + 1.5; /* where the cars will be when he gets there at full speed: no peel right by a car */
      if (bananas.some((b) => b.x === px && Math.abs(b.z - pz) < 2500) || peels.some((p) => Math.abs(p.z - pz) < 3000) || cars.some((c) => Math.abs(c.z + vt * tp - pz) < 3500)) continue; peels.push({ z: pz, x: px }); k++; }
    return { segs, cars, bananas, peels, len, n, vmax, vt, time: Math.round((len / (0.87 * vmax) + 3) * 10) / 10 };
  }
  function raDeco(tr) { // roadside things per segment: palms, bushes, banana billboards, chevrons on the outside of the curves
    const out = []; for (let i = -12; i < tr.segs.length; i++) { const q = [], h = (k) => PX.hash(i, k, 91), c = i >= 0 ? tr.segs[i].curve : 0;
      if (h(1) < 0.2) q.push({ k: 'palm', x: -(1.5 + h(2) * 1.3), f: h(9) < 0.5 }); if (h(3) < 0.2) q.push({ k: 'palm', x: 1.5 + h(4) * 1.3, f: h(8) < 0.5 });
      if (h(5) < 0.12) q.push({ k: 'bush', x: (h(6) < 0.5 ? -1 : 1) * (1.3 + h(7) * 0.5) });
      if (Math.abs(c) >= 1.5 && i % 4 === 0) q.push({ k: c > 0 ? 'chevR' : 'chevL', x: c > 0 ? -1.3 : 1.3 });
      else if (h(10) < 0.018) q.push({ k: 'board', x: (h(11) < 0.5 ? -1 : 1) * 2.1 });
      out[i + 12] = q; }
    return (i) => out[i + 12] || [];
  }
  // art (all drawn at the scale of the car's depth; further away they are scaled down)
  const RCOL = ['#e0483e', '#3f7fd8', '#3fae5a', '#e8e8f0', '#9a62d8', '#f08a3a'];
  function raCars() { return once('raCars', () => RCOL.map((c, k) => { const lt = PX.shade(c, 1.18), dk = PX.shade(c, 0.72), ol = '#2a1a28', van = k % 3 === 2;
    return van ? tile(38, 34, (P) => { P.r(3, 27, 7, 7, '#1a1a22'); P.r(28, 27, 7, 7, '#1a1a22'); P.r(1, 1, 36, 29, ol); P.r(2, 2, 34, 27, c); P.r(2, 2, 34, 1, lt); P.r(2, 24, 34, 4, dk);
      P.r(5, 4, 28, 9, '#2a3a5a'); P.r(6, 5, 7, 1, '#8ab0d8'); P.r(18, 4, 2, 9, c); P.r(3, 17, 5, 4, '#e8283a'); P.r(30, 17, 5, 4, '#e8283a'); P.p(4, 17, '#ff9aa0'); P.p(31, 17, '#ff9aa0'); P.r(14, 19, 10, 4, '#f4f4f4'); P.r(15, 20, 8, 1, '#8a8a96'); P.r(2, 27, 34, 3, '#4a4a56'); P.r(2, 27, 34, 1, '#7a7a86'); })
      : tile(40, 28, (P) => { P.r(3, 21, 7, 7, '#1a1a22'); P.r(30, 21, 7, 7, '#1a1a22'); P.r(6, 1, 28, 2, ol); P.r(4, 3, 32, 10, ol); P.r(6, 2, 28, 11, c); P.r(5, 4, 30, 9, c); P.r(6, 2, 28, 1, lt);
      P.r(8, 4, 24, 7, '#2a3a5a'); P.r(9, 5, 6, 1, '#8ab0d8'); P.r(1, 12, 38, 12, ol); P.r(2, 12, 36, 11, c); P.r(2, 12, 36, 1, lt); P.r(2, 19, 36, 4, dk); P.r(3, 14, 7, 3, '#e8283a'); P.r(30, 14, 7, 3, '#e8283a'); P.p(4, 14, '#ff9aa0'); P.p(31, 14, '#ff9aa0');
      P.r(15, 16, 10, 4, '#f4f4f4'); P.r(16, 17, 8, 1, '#8a8a96'); P.r(2, 21, 36, 2, '#4a4a56'); P.r(2, 21, 36, 1, '#7a7a86'); }); })); }
  function raMyCar() { return once('raMy', () => tile(46, 26, (P) => { // the yellow convertible from behind: the seat back hides his body, only his head shows (he is drawn first)
    P.r(2, 16, 8, 10, '#1a1a22'); P.r(36, 16, 8, 10, '#1a1a22'); P.r(3, 17, 2, 8, '#3a3a44'); P.r(37, 17, 2, 8, '#3a3a44');
    P.r(15, 1, 16, 8, '#2a1a28'); P.r(14, 2, 18, 7, '#2a1a28'); P.r(16, 2, 14, 7, '#5a2a3a'); P.r(15, 3, 16, 6, '#5a2a3a'); P.r(16, 2, 14, 1, '#8a4a5e'); P.r(17, 4, 3, 3, '#7a3a4e');
    P.r(2, 7, 42, 15, '#3b2433'); P.r(0, 10, 46, 11, '#3b2433'); P.r(1, 6, 10, 2, '#3b2433'); P.r(35, 6, 10, 2, '#3b2433');
    P.r(3, 8, 40, 13, '#f4b82a'); P.r(1, 11, 44, 9, '#f4b82a'); P.r(2, 7, 8, 2, '#f4b82a'); P.r(36, 7, 8, 2, '#f4b82a');
    P.r(3, 8, 40, 2, '#ffe07a'); P.r(2, 7, 8, 1, '#fff0b0'); P.r(36, 7, 8, 1, '#fff0b0'); P.r(12, 10, 22, 1, '#e8a422'); P.r(1, 17, 44, 3, '#d8901a');
    P.r(3, 12, 7, 3, '#c8283a'); P.r(4, 12, 3, 1, '#ff8a8a'); P.r(36, 12, 7, 3, '#c8283a'); P.r(37, 12, 3, 1, '#ff8a8a'); P.r(3, 14, 7, 1, '#8a1a2a'); P.r(36, 14, 7, 1, '#8a1a2a');
    P.r(18, 13, 10, 5, '#3b2433'); P.r(19, 14, 8, 3, '#f4f4f4'); P.r(21, 15, 4, 1, '#f4b82a'); P.p(20, 14, '#f4b82a'); P.p(25, 16, '#8a5a1a');
    P.r(2, 20, 42, 2, '#5a5a66'); P.r(2, 20, 42, 1, '#8a8a96'); P.r(30, 22, 3, 2, '#2a2a30'); P.r(13, 22, 3, 2, '#2a2a30'); P.p(31, 22, '#8a8a96'); P.p(14, 22, '#8a8a96'); })); }
  function raPalm(f) { return once('raPalm' + (f ? 'f' : ''), () => tile(40, 72, (P, x) => {
    for (let y = 16; y < 72; y++) { const t = (72 - y) / 56, cx = Math.round(15 + Math.sin(t * 1.5) * 6); P.r(cx, y, 4, 1, (y % 5 < 2) ? '#7a4a22' : '#a8743a'); P.p(cx, y, '#5a3a1a'); P.p(cx + 3, y, '#c8945a'); }
    const tx = 21, ty = 16; for (const [a, l] of [[-2.9, 17], [-2.3, 18], [-1.75, 13], [-1.05, 13], [-0.5, 18], [0.1, 16], [-1.4, 9]]) for (let k = 0; k <= l; k++) { const u = k / l, px = tx + Math.cos(a) * k, py = ty + Math.sin(a) * k + u * u * 9; P.r(px, py, 2, 2 + (u < 0.7 ? 1 : 0), u < 0.5 ? '#2f8a32' : '#4fae3a'); if (k % 3 === 1) P.p(px, py + 3, '#1f6a2a'); }
    P.ell(tx - 1, ty + 3, 2.4, 2.4, '#6a4a2a'); P.ell(tx + 2, ty + 4, 2.4, 2.4, '#5a3a1a'); P.p(tx - 2, ty + 2, '#9a7a4a');
    if (f) { const id = x.getImageData(0, 0, 40, 72), o = x.createImageData(40, 72); for (let yy = 0; yy < 72; yy++) for (let xx = 0; xx < 40; xx++) for (let c = 0; c < 4; c++) o.data[(yy * 40 + xx) * 4 + c] = id.data[(yy * 40 + 39 - xx) * 4 + c]; x.putImageData(o, 0, 0); } })); }
  function raBush() { return once('raBush', () => tile(28, 14, (P) => { P.ell(8, 9, 8, 5, '#2f7a32'); P.ell(18, 8, 9, 6, '#3f8f3a'); P.ell(14, 6, 6, 4, '#4fae3a'); P.p(12, 4, '#7fd06a'); P.p(20, 5, '#7fd06a'); P.p(7, 9, '#e8453c'); P.p(22, 10, '#ffd23a'); })); }
  function raChev(right) { return once('raChev' + right, () => tile(16, 24, (P) => { P.r(7, 10, 2, 14, '#8a8a96'); P.r(0, 0, 16, 12, '#2a1a28'); P.r(1, 1, 14, 10, '#ffd23a');
    for (let k = 0; k < 2; k++) for (let j = 0; j < 4; j++) { const xx = 3 + k * 5 + (right ? j : 3 - j); P.r(xx, 2 + j, 2, 1, '#2a1a28'); P.r(xx, 9 - j, 2, 1, '#2a1a28'); } })); }
  function raBoard() { return once('raBoard', () => tile(56, 44, (P, x) => { P.r(10, 26, 3, 18, '#6a6a76'); P.r(43, 26, 3, 18, '#6a6a76'); P.r(0, 0, 56, 28, '#2a1a28'); P.r(1, 1, 54, 26, '#3fa8e8'); P.r(1, 1, 54, 3, '#7fd0f8'); P.r(1, 20, 54, 7, '#2a7ac8');
    const b = ART.food('banana'); x.drawImage(b, 0, 0, b.width, b.height, 18, 3, 22, 22); P.r(4, 22, 48, 3, '#ffd23a'); for (let k = 0; k < 6; k++) P.r(6 + k * 8, 23, 4, 1, '#c89a12'); })); }
  function raPeel() { return once('raPeel', () => tile(20, 10, (P) => { P.ell(4, 7, 4.4, 2, '#c89a12'); P.ell(16, 7, 4.4, 2, '#c89a12'); P.ell(10, 4, 2.2, 3.4, '#c89a12'); P.ell(4.5, 6.6, 3.6, 1.4, '#ffd23a'); P.ell(15.5, 6.6, 3.6, 1.4, '#ffd23a'); P.ell(10, 4, 1.4, 2.6, '#ffe07a'); P.ell(10, 7, 3, 2.2, '#f4d890'); P.ell(10, 7.2, 1.6, 1.2, '#8a5a1a'); })); }
  function raSky() { return once('raSky', () => tile(RW, RA.HZ + 2, (P) => { ROOMS.vgrad(P, 0, 0, RW, RA.HZ + 2, ['#2f7fd8', '#4f9ae4', '#7cbcf0', '#b4dcf6', '#e4f2f8']); })); }
  function raMtn() { return once('raMtn', () => tile(360, 46, (P) => { for (let xx = 0; xx < 360; xx++) { const a = xx / 360 * 6.2832;
      const h1 = Math.round(26 + Math.sin(a * 2 + 1) * 9 + Math.sin(a * 5 + 2) * 6 + Math.sin(a * 11) * 2), h2 = Math.round(14 + Math.sin(a * 3 + 4) * 6 + Math.sin(a * 7 + 1) * 3);
      P.r(xx, 46 - h1, 1, h1, '#9ab0d8'); P.p(xx, 46 - h1, '#c8d8f0'); P.r(xx, 46 - h2, 1, h2, '#7a92c4'); } })); }
  function raTrees() { return once('raTrees', () => tile(360, 22, (P) => { for (let xx = 0; xx < 360; xx++) { const a = xx / 360 * 6.2832, h = Math.round(7 + Math.sin(a * 9) * 2 + Math.sin(a * 23 + 1) * 1.5); P.r(xx, 22 - h, 1, h, '#2f7a3a'); }
    for (let k = 0; k < 14; k++) { const px = Math.floor(PX.hash(k, 3, 5) * 352) + 4, ph = 12 + Math.floor(PX.hash(k, 4, 5) * 7); P.r(px, 22 - ph, 1, ph, '#3a5a2a'); for (const d of [-3, -2, 2, 3]) P.p(px + d, 22 - ph + Math.abs(d) - 1, '#2a6a32'); P.r(px - 2, 22 - ph - 1, 5, 1, '#2a6a32'); } })); }
  const RDG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001010010', '111101111101111', '111101111001111'];
  function raNum(P, x, y, s, k, c, sh) { for (let j = 0; j < s.length; j++) { const g = RDG[+s[j]]; if (!g) continue; for (let q = 0; q < 15; q++) if (g[q] === '1') { const px = x + j * 4 * k + (q % 3) * k, py = y + Math.floor(q / 3) * k; if (sh) P.r(px, py + k, k, k, sh); P.r(px, py, k, k, c); } } }
  function Race() {
    let tr, deco, z, x, vx, speed, vmax, time, phase, pt, why, crashes, inv, spin, off, tx, finger, kl, kr, cars, peels, bananas, skyOff, step, engT, lastSec, flash, mood, moodT, pal;
    const SEG = RA.SEG, segAt = (i) => (i >= 0 && i < tr.segs.length ? tr.segs[i] : ZSEG);
    const roadY = (zz) => { const i = Math.floor(zz / SEG), u = zz / SEG - i; return segAt(i).y + (segAt(i + 1).y - segAt(i).y) * u; };
    const nearLane = (v) => RA.LANES.reduce((b, l) => (Math.abs(l - v) < Math.abs(b - v) ? l : b), RA.LANES[0]);
    const carSX = () => 90 + x * RA.PX;
    const N = RA.DRAW + 2, EZ = new Float64Array(N), EX = new Float64Array(N), ED = new Float64Array(N), EY = new Float64Array(N), SX = new Float64Array(N), SY = new Float64Array(N), SW = new Float64Array(N), CLIP = new Float64Array(N);
    const g = {
      snapY: 178, TUNE: RA,
      init(L) { crashes = 0; setup(L); },
      onLevel(L) { setup(L); },
      demo() { let i = tr.segs.findIndex((q) => Math.abs(q.curve) >= 2); if (i < 0) i = 40; z = Math.max(4000, i * SEG - 2600); speed = vmax; x = -0.66; tx = -0.66; finger = true;
        cars = [{ z: z + 3800, x: 0, v: tr.vt, type: 1, bump: 0 }, { z: z + 7600, x: 0.66, v: tr.vt, type: 0, bump: 0 }, { z: z + 11000, x: -0.66, v: tr.vt, type: 2, bump: 0 }];
        bananas = [{ z: z + 5600, x: -0.66, gold: false, taken: 0 }, { z: z + 6300, x: -0.66, gold: true, taken: 0 }]; peels = []; },
      update(dt) {
        step += dt; if (inv > 0) inv -= dt; if (spin > 0) spin -= dt; if (moodT > 0) moodT -= dt; if (flash > 0) flash -= dt;
        const x0 = x;
        if (phase === 'wreck' || phase === 'out') { speed = Math.max(0, speed - vmax * 0.8 * dt); z += speed * dt; moveCars(dt); vx = 0; return; }
        if (phase === 'fin' || phase === 'next') { pt += dt; speed += (vmax * 0.55 - speed) * Math.min(1, dt * 1.5); z += speed * dt; x += (nearLane(x) - x) * Math.min(1, dt * 2); moveCars(dt); vx = (x - x0) / dt;
          if (phase === 'fin' && pt > 1.2 && !api.over_) { phase = 'next'; api.levelUp(); } return; }
        if (phase !== 'race') return;
        // the clock (the last five seconds tick)
        time -= dt; const sec = Math.ceil(time); if (sec !== lastSec) { lastSec = sec; if (sec <= 5 && sec > 0) snd('tick5'); }
        if (time <= 0) { time = 0; why = 'time'; phase = 'out'; mood = 'sad'; moodT = 9; msg('Время вышло!'); api.over(); return; }
        // steering: held keys move the car; a finger pulls it under the finger; else it keeps to its lane, weakly (a sharp curve still pushes it out)
        const sp = speed / vmax, str = RA.STEER * Math.min(1, 0.3 + sp), dir = (kr ? 1 : 0) - (kl ? 1 : 0);
        if (dir) x += dir * str * dt; else if (tx !== null) { const d = tx - x, m = (finger ? str : RA.HOLD) * dt; x += clamp(d, -m, m); }
        const cv = segAt(Math.floor(z / SEG)).curve; x -= cv * sp * RA.DRIFT * dt; skyOff += cv * sp * dt * 16;
        x = clamp(x, -RA.XMAX, RA.XMAX); off = Math.abs(x) > RA.OFF; vx = (x - x0) / dt;
        // speed: up by itself; off the road it slows right down; a skid brakes
        const top = (off ? RA.OFFV : 1) * vmax;
        if (spin > 0) speed = Math.max(0, speed - vmax * 0.3 * dt); else if (speed < top) speed = Math.min(top, speed + RA.ACC * vmax * dt); else speed = Math.max(top, speed - RA.BRAKE * vmax * dt);
        z += speed * dt; moveCars(dt);
        if (off && speed > vmax * 0.2 && Math.floor(step * 30) % 2) fx.spawn('puff', carSX() + rnd(-16, 16), RY0 - 2, { c: '#d8c088', r0: 1.5, r1: 5, vx: rnd(-20, 20), vy: rnd(-30, -10), life: 0.45 });
        if (inv <= 0) for (const c of cars) { const d = c.z - z; if (d > RA.ZA && d < RA.ZB && Math.abs(c.x - x) < RA.CW) { crash(c); if (phase !== 'race') return; break; } }
        for (const b of bananas) if (!b.taken && b.z - z < 200 && b.z - z > -60 && Math.abs(b.x - x) < RA.GRAB) grab(b);
        for (const p of peels) if (!p.hit && p.z - z < 200 && p.z - z > -60 && Math.abs(p.x - x) < RA.PEEL) slip(p);
        engT -= dt; if (engT <= 0) { engT = 0.11; snd('engine', sp); }
        api.prog(Math.min(1, z / tr.len)); if (z >= tr.len) finish();
      },
      render(ctx, P) {
        const zc = z - RA.PZ, base = Math.floor(zc / SEG), f = zc / SEG - base, camY = roadY(z) + RA.CAMH, cK = (i) => segAt(i).curve * RA.CK;
        // the edges of the segments ahead: the road centre bends with the curves (X), rises and falls with the hills (Y)
        let X = 0.5 * cK(base) * (1 - f) * (1 - f), dX = cK(base) * (1 - f); EZ[0] = base * SEG; EX[0] = 0.5 * cK(base) * f * f; EY[0] = segAt(base).y;
        for (let n = 1; n <= RA.DRAW; n++) { EZ[n] = (base + n) * SEG; EX[n] = X; EY[n] = segAt(base + n).y; X += dX + 0.5 * cK(base + n); dX += cK(base + n); }
        const m0 = Math.floor(z / SEG) - base, u0 = z / SEG - (base + m0); const xoP = m0 >= 1 ? EX[m0] + (EX[m0 + 1] - EX[m0]) * u0 : EX[1] * u0;
        const camX = x * RA.RWID * RA.CAMF + xoP;
        for (let n = 0; n <= RA.DRAW; n++) { const d = Math.max(10, EZ[n] - zc), s = RA.D / d; ED[n] = d; SX[n] = 90 + s * (EX[n] - camX); SY[n] = RA.HZ + s * (camY - EY[n]); SW[n] = s * RA.RWID; }
        // the sky, the sun, clouds, far hills and the palm line (they slide with the curves)
        ctx.drawImage(raSky(), 0, 0); P.circ(142, 56, 13, '#fff8d8'); P.circ(142, 56, 10, '#fff2a8'); P.circ(142, 56, 8, '#ffffff');
        for (let k = 0; k < 4; k++) { const cx = ((k * 64 + 20 - skyOff * 0.25 - step * 2) % 256 + 256) % 256 - 38; ROOMS.cloud(P, cx, 44 + (k % 2) * 20 + k * 5, 0.5 + (k % 3) * 0.12); }
        const mo = ((skyOff * 0.5) % 360 + 360) % 360, to = (skyOff % 360 + 360) % 360;
        ctx.drawImage(raMtn(), -mo, RA.HZ - 46); ctx.drawImage(raMtn(), 360 - mo, RA.HZ - 46); ctx.drawImage(raTrees(), -to, RA.HZ - 22); ctx.drawImage(raTrees(), 360 - to, RA.HZ - 22);
        const cvEl = ctx.canvas, ch = (cvEl && cvEl.height) || RH;
        P.r(0, RA.HZ, RW, ch - RA.HZ, pal[5][0].g);
        // the road, front to back, row by row; rows already covered by a nearer stretch (a hill crest) are skipped
        let maxy = ch;
        for (let n = 0; n < RA.DRAW; n++) {
          CLIP[n] = maxy; const i = base + n; if (ED[n + 1] <= 12) continue;
          const ya = SY[n + 1], yb = SY[n]; if (ya >= maxy || ya >= yb) continue;
          const y0 = Math.max(0, Math.ceil(ya - 0.5)), y1 = Math.min(maxy, Math.ceil(yb - 0.5)), band = Math.min(5, Math.floor(n / RA.DRAW * 7)), c = pal[band][(((Math.floor(i / RA.RUMB)) % 2) + 2) % 2], lanes = (((Math.floor(i / RA.RUMB)) % 2) + 2) % 2 === 1;
          const fin = i === tr.n, st0 = i === 0;
          for (let y = y0; y < y1; y++) { const t = (yb - y - 0.5) / (yb - ya), cx = SX[n] + (SX[n + 1] - SX[n]) * t, w = SW[n] + (SW[n + 1] - SW[n]) * t, rw = w / 7;
            P.r(0, y, RW, 1, c.g); P.r(cx - w - rw, y, 2 * (w + rw), 1, c.r); P.r(cx - w, y, 2 * w, 1, c.a);
            if (fin) { const q = Math.max(1, (2 * w) / 10), row = (y - y0) < (y1 - y0) / 2 ? 0 : 1; for (let k = 0; k < 10; k++) if ((k + row) % 2) P.r(cx - w + k * q, y, q + 0.5, 1, '#1a1a22'); else P.r(cx - w + k * q, y, q + 0.5, 1, '#f4f4f4'); }
            else if (st0) { if (t > 0.35 && t < 0.65) P.r(cx - w, y, 2 * w, 1, '#f4f4f4'); }
            else if (lanes && w > 10) { const lw = Math.max(1, w / 28); P.r(cx - w / 3 - lw / 2, y, lw, 1, c.l); P.r(cx + w / 3 - lw / 2, y, lw, 1, c.l); } }
          maxy = Math.min(maxy, y0);
        }
        // sprites, back to front (and the car among them)
        const L = [];
        const at = (zw, xu, lift) => { const d = zw - zc; if (d < 120 || d > RA.DRAW * SEG - SEG) return null; const n = Math.floor(zw / SEG) - base; if (n < 0 || n >= RA.DRAW) return null; const u = zw / SEG - (base + n);
          const Xc = EX[n] + (EX[n + 1] - EX[n]) * u, Yc = EY[n] + (EY[n + 1] - EY[n]) * u, s = RA.D / d; return { d, s, k: s / RSP, sx: 90 + s * (Xc + xu * RA.RWID - camX), sy: RA.HZ + s * (camY - Yc - (lift || 0)), clip: CLIP[n] }; };
        const put = (img, zw, xu, o) => { const q = at(zw, xu, o && o.lift); if (!q) return; L.push({ d: q.d, img, q, o: o || {} }); };
        for (let n = RA.DRAW - 1; n >= 1; n--) { const i = base + n; if (CLIP[n] <= RA.HZ - 40) continue; for (const it of deco(i)) { const zw = i * SEG + SEG / 2;
          if (it.k === 'palm') put(raPalm(it.f), zw, it.x, { sc: 1.6 }); else if (it.k === 'bush') put(raBush(), zw, it.x); else if (it.k === 'board') put(raBoard(), zw, it.x, { sc: 1.4 }); else put(raChev(it.k === 'chevR'), zw, it.x); } }
        for (const gz of [300, tr.len]) { const q = at(gz, 0); if (q) L.push({ d: q.d, q, gate: gz === 300 ? 'start' : 'fin' }); }
        const ban = ART.food('banana'), gold = ARTG.gold(), carsI = raCars();
        for (const b of bananas) if (!b.taken) put(b.gold ? gold : ban, b.z, b.x, { lift: 260 + Math.sin(step * 5 + b.z) * 50, sc: 1.6, shadow: 1 });
        for (const p of peels) put(raPeel(), p.z, p.x, { sc: 1.5 });
        for (const c of cars) put(carsI[c.type % carsI.length], c.z, c.x, { bump: c.bump });
        L.push({ d: RA.PZ, me: 1 });
        L.sort((a, b) => b.d - a.d);
        for (const e of L) { if (e.me) { drawMe(ctx, P); continue; } if (e.gate) { gate(P, e.q, e.gate); continue; } spr(ctx, P, e); }
        // the clock (red and pulsing for the last five seconds, green for a moment after a banana)
        const clockY = ch > RH ? 51 : 17;
        const tS = String(Math.max(0, Math.ceil(time - 1e-6))), low = time <= 5 && phase === 'race', k = 2, w = tS.length * 4 * k - k + 12;
        ctx.globalAlpha = 0.82; P.r(90 - w / 2 - 4, clockY, w + 8, 16, '#2a1a28'); P.r(90 - w / 2 - 3, clockY - 1, w + 6, 18, '#2a1a28'); ctx.globalAlpha = 1;
        const cx0 = Math.round(90 - w / 2); P.circ(cx0 + 4, clockY + 8, 4, '#f4f4f4'); P.circ(cx0 + 4, clockY + 8, 3, low ? '#ff8a96' : '#59c1ff'); P.r(cx0 + 4, clockY + 5, 1, 3, '#2a1a28'); P.r(cx0 + 4, clockY + 8, 2, 1, '#2a1a28');
        const col = flash > 0 ? '#7fff9a' : low ? (Math.floor(step * 4) % 2 ? '#ff5c6c' : '#ffffff') : '#ffffff'; raNum(P, cx0 + 12, clockY + 3, tS, k, col, '#000000');
      },
      down(sx) { finger = true; tx = (sx - 90) / RA.PX; tip(null); },
      move(sx) { if (finger) tx = (sx - 90) / RA.PX; },
      up() { finger = false; tx = nearLane(x); },
      key(k, d) { if (k === 'ArrowLeft' || k === 'KeyA') kl = d; else if (k === 'ArrowRight' || k === 'KeyD') kr = d; else return; if (kl || kr) { tx = null; tip(null); } else tx = nearLane(x); },
      // test hooks
      st: () => ({ phase: phase === 'next' ? 'fin' : phase, z, x, speed, vmax, time, off, crashes, why, len: tr.len, cars: cars.filter((c) => c.z - z > -2500 && c.z - z < 20000).map((c) => ({ dz: c.z - z, x: c.x })), peels: peels.filter((p) => !p.hit && p.z - z > -500).map((p) => ({ dz: p.z - z, x: p.x })) }),
      gen: (L, seed) => raGen(L, seed),
      place(kind, a) {
        if (kind === 'clear') { cars = []; peels = []; return; }
        if (kind === 'car') cars.push({ z: z + a, x, v: Math.min(tr.vt, speed * 0.5), type: 0, bump: 0 });
        else if (kind === 'banana' || kind === 'gold') bananas.push({ z: z + a, x, gold: kind === 'gold', taken: 0 });
        else if (kind === 'peel') peels.push({ z: z + a, x, hit: 0 });
        else if (kind === 'time') time = a;
      },
    };
    function setup(L) {
      tr = raGen(L, (api.seed() + L * 31) >>> 0); deco = raDeco(tr); vmax = tr.vmax; time = tr.time;
      cars = tr.cars.map((c, k) => ({ z: c.z, x: c.x, v: tr.vt, type: (k * 5 + L) % RCOL.length, bump: 0 }));
      bananas = tr.bananas.map((b) => Object.assign({ taken: 0 }, b)); peels = tr.peels.map((p) => Object.assign({ hit: 0 }, p));
      z = 0; x = 0; vx = 0; speed = 0; phase = 'race'; pt = 0; why = null; inv = 0; spin = 0; off = false; tx = null; finger = false; kl = kr = false; skyOff = 0; step = 0; engT = 0; lastSec = Math.ceil(time); flash = 0; mood = null; moodT = 0;
      pal = raPal(); api.prog(0); snd('beepGo');
      if (L === api.st0) tip('Веди пальцем — машина поедет за ним!');
    }
    function moveCars(dt) { // traffic keeps its lane at one speed; a car that catches up with him from behind brakes; a bumped one rolls off onto the shoulder
      for (const c of cars) { if (c.bump > 0) c.bump -= dt;
        if (c.side) { c.x += clamp(c.side * 1.45 - c.x, -2.2 * dt, 2.2 * dt); c.v = Math.max(0, c.v - vmax * 0.5 * dt); }
        let nz = c.z + c.v * dt; if (c.z - z <= RA.ZA && nz - z > RA.ZA && Math.abs(c.x - x) < RA.CW + 0.08) nz = z + RA.ZA - 0.5; c.z = nz; }
    }
    function crash(c) {
      crashes++; inv = RA.INV; spin = 0.5; speed *= 0.25; c.z = Math.max(c.z, z + RA.ZB + 30); c.bump = 0.5; c.side = c.x > 0.01 ? 1 : c.x < -0.01 ? -1 : (x <= 0 ? 1 : -1); mood = 'hurt'; moodT = 0.9; snd('crash');
      for (let k = 0; k < 10; k++) fx.spawn('crumb', carSX() + rnd(-10, 10), RY0 - 18 + rnd(-4, 4), { c: pick(['#cfcfd8', '#8a8a96', '#ffd23a', '#ffffff']), sz: 2, vx: rnd(-70, 70), vy: rnd(-90, -20), g: 240, life: 0.7 });
      for (let k = 0; k < 5; k++) fx.spawn('puff', carSX() + rnd(-12, 12), RY0 - 10, { c: '#b8b8c4', r0: 2, r1: 7, vx: rnd(-25, 25), vy: rnd(-40, -15), life: 0.7 });
      if (api.hurt()) { why = 'crash'; phase = 'wreck'; mood = 'sad'; moodT = 9; msg('Авария!'); } else flt(carSX(), RY0 - 40, 'Бам!');
    }
    function grab(b) { b.taken = 1; time += 1; flash = 0.35; const sx = carSX(), sy = RY0 - 44; for (let k = 0; k < 6; k++) fx.spawn('spark', sx + rnd(-10, 10), RY0 - 30 + rnd(-6, 6), { life: 0.4 });
      if (b.gold) { api.bonus(1, sx, sy); mood = 'yay'; moodT = 0.6; } else { snd('pop'); flt(sx, sy, '+1 с'); } }
    function slip(p) { p.hit = 1; spin = 0.7; speed *= 0.6; mood = 'hurt'; moodT = 0.7; snd('skid'); flt(carSX(), RY0 - 40, 'Скользко!'); }
    function finish() { phase = 'fin'; pt = 0; const left = time, n = left >= 8 ? 2 : left >= 4 ? 1 : 0; snd('star'); mood = 'yay'; moodT = 3;
      msg('Финиш!', 'осталось ' + Math.floor(left) + ' с' + (n ? ' · +' + n : '')); if (n) api.bonus(n, 90, 220);
      for (let k = 0; k < 16; k++) fx.spawn('confetti', rnd(20, 160), rnd(60, 120), { c: pick(['#ff5c6c', '#ffd23a', '#3fdc7a', '#59c1ff', '#ffffff']), vx: rnd(-30, 30), vy: rnd(-20, 30), g: 70, drag: 0.8, life: rnd(1, 1.8), wob: 5 }); }
    function spr(ctx, P, e) { const { img, q, o } = e; const k = q.k * (o.sc || 1), w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
      if (w < 2 && h < 2) return; let sx = Math.round(q.sx - w / 2); const sy = Math.round(q.sy - h); if (sx > RW || sx + w < 0 || sy > q.clip) return; if (o.bump > 0) sx += Math.round(Math.sin(o.bump * 40) * 2 * q.k);
      const clip = sy + h > q.clip; if (clip) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, RW, q.clip); ctx.clip(); }
      if (o.shadow) P.shadow(q.sx, q.sy + q.s * (o.lift || 0), Math.max(1, w * 0.4), Math.max(1, w * 0.14), 0.25);
      ctx.drawImage(img, sx, sy, w, h); if (clip) ctx.restore(); }
    function gate(P, q, kind) { const s = q.s, w = s * RA.RWID * 1.22, top = q.sy - s * 2100, bh = Math.max(2, s * 380), pw = Math.max(1, s * 70); if (q.sy - s * 2100 > q.clip) return;
      const cx = q.sx - (s * (x * RA.RWID * RA.CAMF)) * 0, L0 = cx - w, R0 = cx + w; P.r(L0 - pw / 2, top, pw, q.sy - top, '#8a8a96'); P.r(R0 - pw / 2, top, pw, q.sy - top, '#8a8a96');
      const n = 14, cw = (R0 - L0) / n; for (let k = 0; k < n; k++) for (let j = 0; j < 2; j++) P.r(L0 + k * cw, top + j * bh / 2, cw + 0.5, bh / 2 + 0.5, kind === 'fin' ? ((k + j) % 2 ? '#1a1a22' : '#f4f4f4') : ((k + j) % 2 ? '#e8453c' : '#f4f4f4'));
      if (kind === 'start' && s > 0.02) { const r = Math.max(1, s * 55), gap = s * 150, ly = top + bh + s * 90; P.r(cx - gap - r * 2, ly - r * 1.8, gap * 2 + r * 4, r * 3.6, '#1a1a22'); for (let k = 0; k < 3; k++) P.circ(cx + (k - 1) * gap, ly, r, k === 2 ? '#3fdc7a' : '#4a2a2a'); } }
    function drawMe(ctx, P) { // Абибян in the yellow convertible, from behind: leans into the turns, shakes after a bump, blinks while he can't be hurt
      if (inv > 0 && phase === 'race' && Math.floor(step * 14) % 2) return;
      const lean = vx > 0.4 ? 1 : vx < -0.4 ? -1 : 0, wob = spin > 0 ? Math.round(Math.sin(step * 50) * 2.5) : 0, bob = off ? (Math.floor(step * 24) % 2) : (speed > vmax * 0.6 && Math.floor(step * 8) % 5 === 0 ? 1 : 0);
      const sx = Math.round(carSX()) + wob, sy = Math.round(RY0) + bob;
      const p = mp(0.3, { back: 1, tail: -1, pose: 'idle', legs: 'stand' }, 1); p.hx = lean;
      if ((mood === 'yay' && moodT > 0) || phase === 'fin' || phase === 'next') { p.pose = 'up'; const w = Math.floor(step * 6) % 2; p.armL = [-23, -90 + w * 4]; p.armR = [23, -86 - w * 4]; } /* waving both arms over his head */
      drawM(ctx, p, sx + lean, sy - 10);
      const car = raMyCar(); ctx.drawImage(car, sx - 23, sy - 26);
      if (spin > 0 || off || phase !== 'race') { P.r(sx - 20, sy - 14, 7, 2, '#ff4a5a'); P.r(sx + 13, sy - 14, 7, 2, '#ff4a5a'); P.r(sx - 19, sy - 14, 3, 1, '#ffd0d4'); P.r(sx + 14, sy - 14, 3, 1, '#ffd0d4'); }
      if (spin > 0 && Math.floor(step * 30) % 2) fx.spawn('puff', sx + pick([-17, 17]), sy - 2, { c: '#e8e8f0', r0: 2, r1: 6, vx: rnd(-20, 20), vy: rnd(-25, -5), life: 0.5 });
    }
    function raPal() { return once('raPal', () => { const hz = '#cfe4ee', mixc = (a, b, t) => { const rgb = (c) => [1, 3, 5].map((o) => parseInt(c.slice(o, o + 2), 16)), A = rgb(a), B = rgb(b); const h2 = (v) => Math.round(v).toString(16).padStart(2, '0'); return '#' + h2(A[0] + (B[0] - A[0]) * t) + h2(A[1] + (B[1] - A[1]) * t) + h2(A[2] + (B[2] - A[2]) * t); };
      const P0 = [{ g: '#5fb83e', r: '#e8453c', a: '#6c6c76', l: '#f4f4f4' }, { g: '#56ab36', r: '#f4f4f4', a: '#666670', l: '#f4f4f4' }];
      const out = []; for (let b = 0; b < 6; b++) out.push(P0.map((c) => ({ g: mixc(c.g, hz, b * 0.1), r: mixc(c.r, hz, b * 0.1), a: mixc(c.a, hz, b * 0.1), l: mixc(c.l, hz, b * 0.1) }))); return out; }); }
    return g;
  }
  // =====================================================================
  // Round 18: «Крыши» (phone, from «Детёныш», pays ×2) — a one-button runner over the roofs of the city he sees from the balcony. He runs by
  // himself; tap = a jump, hold = higher (lighter gravity while held and rising; a release cuts the rise), a tap in the air = a flip (once per
  // jump). Gaps between the houses, steps up and down, chimneys to jump over; from «Старый город» laundry lines over a gap (a full jump catches
  // the line and he drops — a short hop passes under it) and striped awnings that throw him up onto a higher roof by themselves (no tap!);
  // from «Стройка» crane girders hanging over wide gaps; from «Набережная» TV antennas and gaps only a flip clears. A fall costs a heart and a
  // balloon lifts him onto the next roof. Bananas: every 10 = a coin, the golden one up high (a flip) = a coin, a landing on the very edge =
  // «Впритык!» +2 bananas. A new district every 3 levels (5 of them: day → golden afternoon → dusty haze → sunset → night), the TV tower in the
  // distance grows as he gets closer to the centre; the flag on the last roof. 3 hearts. MINI.G.auto = the built-in pilot (tests, demo):
  // it simulates the very same physics (stepQ) for a set of hold times / flips and jumps at the last frame a safe landing is still possible.
  // =====================================================================
  const RF = { BASE: 300, MS: 0.34, MW: 12, MH: 24, JV: 240, JV2: 215, GH: 520, G: 1150, CUT: 100, VMAX: 430, BOUNCE: 400, FALL: 46, AWN: 26, LINE: 62, SAG: 4, TOL: 5 };
  const rfV = (L) => 82 + 10 * Math.sqrt(Math.max(0, L - 1)), rfD = (L) => Math.min(4, Math.floor((Math.max(1, L) - 1) / 3));
  const RD = ['Наш двор', 'Старый город', 'Стройка', 'Набережная', 'Центр'];
  function rfPhys(q, dt, hold) { const gr = hold && q.vy < 0 && !q.nb ? RF.GH : RF.G; q.vy = Math.min(RF.VMAX, q.vy + gr * dt); q.h -= q.vy * dt; }
  function rfLab(tau, dbl, v, dh) { // a jump off flat ground held for tau s (dbl: a flip at the top, held as long) → apex, air time, the run while coming down through dh (0: never that high)
    dh = dh || 0; const q = { h: 0, vy: -RF.JV }, dt = 1 / 240; let t = 0, t0 = 0, apex = 0, rel = false, fl = !dbl;
    while (t < 4) { if (t - t0 >= tau && !rel) { rel = true; if (q.vy < -RF.CUT) q.vy = -RF.CUT; }
      if (!fl && q.vy >= 0) { fl = true; t0 = t; rel = false; q.vy = -RF.JV2; }
      rfPhys(q, dt, t - t0 < tau); t += dt; apex = Math.max(apex, q.h); if (q.vy > 0 && q.h <= dh) break; }
    return { apex, air: t, dist: apex >= dh ? t * v : 0 };
  }
  function rfGen(L, seed) { // the level: roofs left → right (every gap / step made with the jump it needs), laundry, awnings, girders, chimneys, antennas, bananas, pigeons, the flag
    const r = mul(mix(seed * 7919 + L * 104729 + 71)), v = rfV(L), d = rfD(L), Lc = Math.min(L, 15), memo = {};
    const LB = (tau, dbl, dh) => { const k = tau + (dbl ? 'd' : 's') + dh; return memo[k] || (memo[k] = rfLab(tau, dbl, v, dh)); };
    const single = (dh) => LB(9, 0, dh).dist, dblD = (dh) => LB(9, 1, dh).dist, short = (dh) => LB(0.14, 0, dh), apex = LB(9, 0, 0).apex;
    const ri = (a, b) => a + Math.floor(r() * (b - a + 1)), pickW = (a) => { let s = 0; for (const q of a) s += q[1]; let k = r() * s; for (const q of a) { k -= q[1]; if (k <= 0) return q[0]; } return a[0][0]; };
    const W = [['gap', 5]]; if (d >= 1) W.push(['line', 1.3], ['awning', 1.1]); if (d >= 2) W.push(['beam', 1.2]); if (d >= 3) W.push(['wide', 1.1]);
    const n = 9 + Math.round(Lc * 0.8), kinds = []; for (let i = 0; i < n; i++) kinds.push(i === 0 ? 'gap' : pickW(W));
    for (let i = 1; i < n; i++) if (kinds[i] !== 'gap' && kinds[i] === kinds[i - 1]) kinds[i] = 'gap';
    for (const k of [[], ['awning', 'line'], ['beam'], ['wide'], ['beam', 'wide']][d]) if (!kinds.includes(k)) { // every district shows its new things on every level
      const c = []; for (let i = 1; i < n; i++) if (kinds[i] === 'gap' && kinds[i - 1] !== k && kinds[i + 1] !== k) c.push(i); kinds[c.length ? c[Math.floor(r() * c.length)] : n - 1] = k; }
    const roofs = [{ x: 0, w: 150, top: 60, kind: 'start', k: ri(0, 99) }], lines = [], beams = [], obs = [], ban = [], birds = [];
    const arc = (x0, x1, y0, y1, peak, k) => { for (let j = 1; j <= k; j++) { const u = j / (k + 1); ban.push({ x: Math.round(x0 + (x1 - x0) * u), h: Math.round(y0 + (y1 - y0) * u + peak * 4 * u * (1 - u) + 10) }); } };
    let gold = false;
    for (let i = 0; i <= n; i++) {
      const a = roofs[roofs.length - 1]; let k = i < n ? kinds[i] : 'fin', gap, nt, w = ri(64, 150 - 2 * Lc);
      if (k === 'awning' && a.top + 36 > 130) k = 'gap';
      if (k === 'awning' && a.w < 76) a.w = 76;
      const e = a.x + a.w;
      if (k === 'gap' || k === 'fin') { let dh = k === 'fin' ? ri(-12, 12) : r() < 0.45 ? ri(4, Math.floor(apex * 0.55)) : -ri(0, 18 + 2 * Lc); nt = clamp(a.top + dh, 24, 130); dh = nt - a.top;
        const top = Math.floor(single(dh) * 0.8), hi = Math.min(top, k === 'fin' ? 24 : 26 + 3 * Lc + 6 * d), lo = Math.min(hi, 12 + Math.min(12, L)); gap = Math.max(12, Math.min(top, Math.round(lo + r() * (hi - lo))));
        arc(e, e + gap, a.top, nt, Math.min(apex, Math.max(18, dh + 16)) * 0.8, gap > 34 ? 3 : 2);
        if (!gold && k === 'gap' && i >= n / 2 && gap >= 24) { gold = true; ban.push({ x: e + Math.round(gap / 2), h: Math.max(a.top, nt) + 84, gold: 1 }); } }
      else if (k === 'line') { nt = clamp(a.top - ri(0, 10), 24, 130); const s = short(nt - a.top); gap = Math.min(ri(18, 30), Math.floor(s.dist * 0.8)); lines.push({ x0: e, x1: e + gap, y: a.top + RF.LINE, sag: RF.SAG, k: ri(0, 99) }); arc(e - 6, e + gap + 6, a.top, nt, 16, 3); }
      else if (k === 'awning') { a.awning = 1; nt = Math.min(130, a.top + ri(36, 54)); gap = ri(14, 22); arc(e - 4, e + gap + 14, a.top + 20, nt, 34, 3); }
      else if (k === 'beam') { gap = ri(64, 84); nt = clamp(a.top + ri(-10, 10), 24, 130); const bx = e + Math.round((gap - 34) / 2), by = a.top + ri(-6, 10); beams.push({ x: bx, w: 34, y: by, ph: r() * 6.28, amp: 5 }); ban.push({ x: bx + 9, h: by + 10 }, { x: bx + 25, h: by + 10 }); }
      else { nt = clamp(a.top - ri(0, 16), 24, 130); const dh = nt - a.top, lo = single(dh) * 0.88, hi = Math.min(dblD(dh) * 0.75, 92); gap = Math.round(lo + r() * Math.max(0, hi - lo)); arc(e, e + gap, a.top, nt, 66, 4);
        if (!gold) { gold = true; ban.push({ x: e + Math.round(gap / 2), h: a.top + 96, gold: 1 }); } }
      roofs.push({ x: e + gap, w: k === 'fin' ? 170 : w, top: nt, kind: k, k: ri(0, 99) });
    }
    for (let i = 1; i < roofs.length - 1; i++) { const q = roofs[i], u = q.w - (q.awning ? RF.AWN + 8 : 0); if (q.kind === 'wide' || q.kind === 'awning' || q.kind === 'beam') continue;
      if (d >= 3 && u >= 84 && r() < 0.42) obs.push({ type: 'antenna', x: q.x + Math.round(u * (0.42 + 0.16 * r())), w: 4, h: 40, base: q.top });
      else if (u >= 110 && r() < (d ? 0.55 : 0.75)) obs.push({ type: 'chimney', x: q.x + Math.round(u / 3 + r() * (u / 3 - 10)), w: 10, h: ri(14, 18), base: q.top, k: ri(0, 99) });
      const o = obs.length && obs[obs.length - 1].base === q.top && obs[obs.length - 1].x > q.x && obs[obs.length - 1].x < q.x + q.w ? obs[obs.length - 1] : null;
      if (o) arc(o.x - 22, o.x + o.w + 22, q.top, q.top, o.type === 'antenna' ? 44 : 24, 3);
      else if (q.w >= 90 && r() < 0.6) { const c = ri(3, 5), x0 = q.x + ri(20, Math.max(20, q.w - 20 - c * 10)); for (let j = 0; j < c; j++) ban.push({ x: x0 + j * 10, h: q.top + 10 }); }
      if (r() < 0.3 && !o && q.w >= 70) { const c = ri(2, 3), bx = q.x + ri(14, q.w - 24); for (let j = 0; j < c; j++) birds.push({ x: bx + j * 6 + ri(0, 2), h: q.top, st: 0, f: ri(0, 9) }); }
    }
    const fin = roofs[roofs.length - 1];
    return { roofs, obs, lines, beams, ban, birds, fin, flag: fin.x + fin.w - 40, len: fin.x + fin.w, v, d, sign: L === 1 + 3 * d ? RD[d] : null };
  }
  // ---------- the art: per district sky, a far skyline, a nearer one, the houses (cached per roof) ----------
  const RFP = [
    { sky: ['#5fb4ee', '#8fd0f6', '#c4e8fa', '#eaf6fc'], far: '#b4cce0', mid: '#8eaac4', midW: '#b8cee2', fac: [['#b4573c', '#8a3f2c', '#cd7352'], ['#aaa49a', '#86807a', '#c6c0b6'], ['#c46a48', '#97503a', '#dc8a64']], cap: '#4a4250', capL: '#857a8c', win: '#5a86b0', winL: '#a8d0ec', frame: '#f0ece4', tower: '#9fb0c4' },
    { sky: ['#68a8dc', '#a2c6e2', '#f0d8a8', '#f8e6c4'], far: '#d2bea2', mid: '#b09a82', midW: '#d4c0a6', fac: [['#ead6a2', '#c8ac7c', '#f6e6bc'], ['#dcb072', '#b88e54', '#ecc890'], ['#e8c0a8', '#c49c86', '#f4d6c4']], cap: '#c85a34', capL: '#ee9468', win: '#4a6a8a', winL: '#8aaccc', frame: '#fbf2dc', shut: '#3f7a5a', tower: '#a8a0a0' },
    { sky: ['#8eb2c8', '#b8c8cc', '#dcd0b4', '#eadcc0'], far: '#d4ccbc', mid: '#bcb4a6', midW: '#ccc4b6', fac: [['#8e8e94', '#66666e', '#a8a8ae'], ['#9c9282', '#746a5c', '#b4aa98'], ['#868a94', '#60646e', '#a0a4ae']], cap: '#5a5a60', capL: '#9a9aa2', win: '#3a4048', winL: '#5e6874', frame: '#c8c8c8', tower: '#8a8a92' },
    { sky: ['#4e4e96', '#b46a96', '#f0926a', '#fbcc86'], far: '#c88ca4', mid: '#a46c8e', midW: '#d8a0b2', fac: [['#f2b6c0', '#cc8a96', '#fad0d6'], ['#acdcc4', '#86b8a0', '#c8ecd8'], ['#acc8ec', '#86a4cc', '#c8dcf6'], ['#f2e09c', '#ccb874', '#faecbc']], cap: '#3a6474', capL: '#6a9aaa', win: '#4a5a8a', winL: '#f8d08a', frame: '#fffaf0', tower: '#6a3a62' },
    { sky: ['#0c1230', '#162050', '#28306c', '#3a3a7a'], far: '#262c52', mid: '#1a2040', midW: '#a8925a', fac: [['#3a5c8c', '#24406a', '#5a80b4'], ['#40588a', '#283c66', '#6280b0'], ['#346a8a', '#204a66', '#5a90b0']], cap: '#18223a', capL: '#9ab4dc', win: '#4a70a4', winL: '#ffe08a', frame: '#4a5a7a', tower: '#3a4270' },
  ];
  function rfSky(d) { return once('rfSky' + d, () => tile(RW, RH, (P) => { ROOMS.vgrad(P, 0, 0, RW, 220, RFP[d].sky); P.r(0, 220, RW, 100, RFP[d].sky[3]);
    if (d === 0) { P.circ(146, 46, 9, '#fff3b0'); P.circ(146, 46, 7, '#ffe066'); }
    else if (d === 1) { P.circ(38, 74, 11, '#fff0c0'); P.circ(38, 74, 9, '#ffd070'); }
    else if (d === 2) { P.circ(124, 64, 10, '#f4ecd4'); P.circ(124, 64, 8, '#fbf6e6'); }
    else if (d === 3) { P.circ(126, 168, 20, '#ffd890'); P.circ(126, 168, 17, '#ffb060'); for (let k = 0; k < 4; k++) P.r(96, 150 + k * 7, 60, 1, '#f8a070'); }
    else { P.circ(38, 52, 8, '#f4f0d8'); P.circ(41, 50, 7, RFP[4].sky[0]); for (let k = 0; k < 40; k++) P.p(Math.floor(PX.hash(k, 1, 77) * RW), Math.floor(PX.hash(k, 2, 77) * 150), PX.hash(k, 3, 77) < 0.3 ? '#ffffff' : '#9aa4d0'); }
  })); }
  function rfFar(d) { return once('rfFar' + d, () => tile(240, 150, (P) => { const C = RFP[d], c = C.far, lt = PX.shade(c, 1.08);
    for (let x = 0, k = 0; x < 240; k++) { const w = 12 + Math.floor(PX.hash(k, 1, 31 + d) * 20), top = (d === 4 ? 2 : 10) + Math.floor(PX.hash(k, 2, 31 + d) * (d === 4 ? 44 : 30)); P.r(x, top, w, 150 - top, c);
      for (let y = top + 4; y < 150; y += 5) for (let xx = x + 2; xx < x + w - 2; xx += 4) if (PX.hash(xx, y, 5 + d) < (d === 4 ? 0.18 : 0.5)) P.p(xx, y, d === 4 ? '#9a8656' : lt);
      if (d === 0 && k % 5 === 2) { P.r(x + 3, top - 22, 3, 22, '#c8a8a0'); for (let y = top - 22; y < top; y += 6) P.r(x + 3, y, 3, 2, '#e8e0dc'); } // a factory chimney
      if (d === 1 && k % 6 === 3) { P.r(x + w / 2 - 3, top - 12, 6, 12, c); P.ell(x + w / 2, top - 14, 4, 4, '#e8b840'); P.r(x + w / 2, top - 22, 1, 5, '#e8b840'); P.r(x + w / 2 - 1, top - 20, 3, 1, '#e8b840'); } // a church dome
      if (d === 2 && k % 5 === 1) { const cx = x + 6, ct = top - 58, cy = '#d6b452', cd = '#b89a44'; for (let y = ct; y < top; y++) { P.p(cx, y, cy); P.p(cx + 3, y, cy); if ((y - ct) % 4 < 2) P.p(cx + 1 + ((y - ct) % 4), y, cd); } // a tower crane: lattice mast, jib, counterweight, cab, hook
        P.r(cx - 18, ct, 62, 2, cy); for (let xx = cx - 18; xx < cx + 44; xx += 3) P.p(xx, ct + 2, cd); P.r(cx - 18, ct + 1, 7, 5, '#8a8a8a'); P.r(cx - 1, ct + 2, 6, 5, '#e8c860'); P.p(cx + 1, ct + 3, '#6a8aa8'); P.r(cx + 1, ct - 6, 1, 6, cy); P.line(cx + 1, ct - 6, cx + 40, ct, cd); P.line(cx + 1, ct - 6, cx - 16, ct, cd); P.r(cx + 30, ct + 2, 1, 20, '#7a7a7a'); P.r(cx + 29, ct + 22, 3, 2, '#7a7a7a'); }
      x += w; } })); }
  function rfMid(d) { return once('rfMid' + d, () => tile(200, 120, (P) => { const C = RFP[d], c = C.mid;
    for (let x = 0, k = 0; x < 200; k++) { const w = 18 + Math.floor(PX.hash(k, 3, 41 + d) * 22), top = 4 + Math.floor(PX.hash(k, 4, 41 + d) * 30); P.r(x, top, w, 120 - top, c); P.r(x, top, w, 1, PX.shade(c, 1.1));
      for (let y = top + 5; y < 120; y += 7) for (let xx = x + 3; xx < x + w - 3; xx += 5) if (d !== 4 || PX.hash(xx, y, 9) < 0.22) P.r(xx, y, 2, 3, d === 4 ? C.midW : PX.shade(c, 1.12));
      x += w + 2; }
    if (d === 3) { P.r(0, 100, 200, 20, '#4a5a96'); for (let k = 0; k < 30; k++) P.r(Math.floor(PX.hash(k, 5, 3) * 200), 102 + Math.floor(PX.hash(k, 6, 3) * 16), 3, 1, '#f8c08a'); for (let x = 4; x < 200; x += 16) { P.ell(x, 96, 6, 5, '#3a5a4a'); P.r(x, 98, 1, 3, '#3a2a2a'); } }
  })); }
  function rfTower(P, d, x, y0) { const c = RFP[d].tower, H = 40 + 26 * d, top = y0 - H; // the TV tower in the middle of the city: the closer the district, the bigger
    for (let y = top + 10; y < y0; y++) { const k = (y - top) / H, w = Math.max(1, Math.round(1 + k * k * 8)); P.r(x - w, y, w * 2 + 1, 1, c); }
    const py = top + Math.round(H * 0.3); P.ell(x + 0.5, py, 4 + d * 0.6, 2 + d * 0.3, c); P.r(x, top, 1, 12, c); P.r(x - 1, top + 4, 3, 1, c);
    if (d >= 3) { P.p(x, top - 1, '#ff4a4a'); P.p(x, py - 3, '#ff4a4a'); } }
  function rfText(t, col, px) { const k = 'rfT' + t + col + px, ok = !document.fonts || document.fonts.check(px + 'px "Pixelify Sans"'); const mk = () => { const c = PX.canvas(8 + t.length * px, px + 6), x = c.getContext('2d'); x.font = px + 'px "Pixelify Sans"'; x.textBaseline = 'top'; x.fillStyle = col; x.fillText(t, 1, 1);
      c.tw = Math.ceil(x.measureText(t).width) + 2; const id = x.getImageData(0, 0, c.width, c.height), dd = id.data; for (let i = 3; i < dd.length; i += 4) dd[i] = dd[i] >= 110 ? 255 : 0; x.putImageData(id, 0, 0); return c; }; return ok ? once(k, mk) : mk(); }
  const rfBan = () => once('rfBan', () => { const s = ART.food('banana'), c = PX.canvas(8, 8), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(s, 0, 0, 8, 8); return c; });
  const rfGold = () => once('rfGold', () => { const s = ARTG.gold(), c = PX.canvas(12, 12), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(s, 0, 0, 12, 12); return c; });
  function rfFacade(q, d, ch = RH) { if (q.cv && q.cvH === ch) return q.cv; q.cvH = ch; const C = RFP[d], [b, dk, lt] = C.fac[q.k % C.fac.length], w = Math.max(2, Math.round(q.w)), H = q.top + (ch - RF.BASE) + 2, kk = q.k;
    q.cv = tile(w, H, (P) => { P.r(0, 0, w, H, b);
      if (d === 0) { if (kk % 3 !== 1) { const mo = PX.shade(b, 0.9); for (let y = 6, j = 0; y < H; y += 4, j++) { P.r(0, y, w, 1, mo); for (let x = (j % 2) * 4 + 2; x < w; x += 8) P.r(x, y + 1, 1, 3, mo); } }
        else { for (let y = 18; y < H; y += 14) P.r(0, y, w, 1, lt); for (let x = 15; x < w - 2; x += 16) P.r(x, 5, 1, H, lt); }
        for (let y = 10; y < H - 4; y += 14) for (let x = 5; x + 6 <= w - 3; x += 11) { P.r(x, y, 6, 7, C.frame); P.r(x + 1, y + 1, 4, 5, C.win); P.p(x + 1, y + 1, C.winL); P.r(x + 1, y + 3, 4, 1, C.frame); }
        P.r(0, 0, w, 4, C.cap); P.r(0, 0, w, 1, C.capL); P.r(0, 4, w, 1, dk); }
      else if (d === 1) { for (let y = 26; y < H; y += 16) P.r(0, y, w, 1, lt);
        for (let y = 13; y < H - 6; y += 16) for (let x = 5; x + 6 <= w - 3; x += 12) { P.r(x, y, 6, 9, C.frame); P.r(x + 1, y + 1, 4, 7, C.win); P.p(x + 1, y + 1, C.frame); P.p(x + 4, y + 1, C.frame); P.p(x + 2, y + 2, C.winL); if ((x + y + kk) % 3 === 0) { P.r(x - 2, y + 1, 1, 7, C.shut); P.r(x + 7, y + 1, 1, 7, C.shut); } }
        P.r(0, 0, w, 6, C.cap); for (let x = 1; x < w; x += 3) { P.r(x, 1, 1, 5, PX.shade(C.cap, 0.8)); P.p(x + 1, 6, C.cap); } P.r(0, 0, w, 1, C.capL); P.r(0, 7, w, 1, C.frame); P.r(0, 8, w, 1, dk); }
      else if (d === 2) { for (let y = 12; y < H; y += 12) { P.r(0, y, w, 2, dk); P.r(0, y + 2, w, 1, lt); }
        for (let y = 4; y < H - 4; y += 12) for (let x = 4; x + 7 <= w - 3; x += 12) if (PX.hash(x, y, kk) < 0.75) { P.r(x, y + 1, 7, 6, C.win); P.r(x, y + 1, 7, 1, C.winL); }
        if (kk % 3) { for (let x = 2; x < w; x += 18) P.r(x, 3, 1, H, '#d8a040'); for (let y = 11; y < H; y += 12) P.r(0, y, w, 1, '#b87a2a'); if (kk % 3 === 2) for (let y = 24; y < Math.min(H, 60); y++) for (let x = (y % 2); x < Math.min(w, 40); x += 2) P.p(x, y, '#e8783a'); }
        P.r(0, 0, w, 3, C.cap); P.r(0, 0, w, 1, C.capL); for (let x = 0; x < w; x += 6) if (x < 12 || x > w - 14) P.r(x, 0, 3, 3, '#f2c21a'); }
      else if (d === 3) { for (let y = 11; y < H - 5; y += 14) for (let x = 4; x + 6 <= w - 3; x += 11) { P.r(x, y, 6, 8, C.frame); P.r(x + 1, y + 1, 4, 6, C.win); P.r(x + 1, y + 1, 4, 1, C.winL); P.p(x + 1, y + 2, C.winL);
          if (PX.hash(x, y, kk + 3) < 0.4) { P.r(x, y + 8, 6, 2, '#7a4a3a'); P.p(x + 1, y + 7, '#e8483c'); P.p(x + 3, y + 7, '#f8d23a'); P.p(x + 4, y + 7, '#e8483c'); } }
        P.r(0, 0, w, 5, C.cap); for (let x = 2; x < w; x += 4) P.r(x, 1, 1, 4, C.capL); P.r(0, 0, w, 1, C.capL); P.r(0, 5, w, 1, C.frame); }
      else { for (let y = 6; y < H; y += 5) for (let x = 2; x < w - 2; x += 4) P.r(x, y, 3, 4, PX.hash(x, y, kk + 7) < 0.3 ? C.winL : C.win);
        for (let x = (kk % 5) * 4 + 4; x < w; x += 23) for (let y = 6; y < H; y++) if ((x + y) % 9 < 2) P.p(x + (y % 4), y, '#8ab4e0');
        P.r(0, 0, w, 3, C.cap); P.r(0, 0, w, 1, C.capL); }
      P.r(0, 0, 1, H, dk); P.r(w - 1, 0, 1, H, dk); });
    return q.cv; }
  function Roofs() {
    let lv, m, cam, v, phase, pt, step, T, mood, moodT, nban, bl, dmsg, bp, lastD, flapT, cooT, pops, awnT;
    const BASE = RF.BASE, HW = RF.MW / 2, F = 1 / 60;
    const beamY = (b, t) => b.y + Math.sin(t * 2.2 + b.ph) * b.amp;
    const lineH = (l, x) => { const u = clamp((x - l.x0) / Math.max(1, l.x1 - l.x0), 0, 1); return l.y + l.sag * (2 * u - 1) * (2 * u - 1); };
    function ri0(x) { const R = lv.roofs; let lo = 0, hi = R.length; while (lo < hi) { const md = (lo + hi) >> 1; if (R[md].x + R[md].w < x) lo = md + 1; else hi = md; } return lo; } // the first roof ending at / after x
    function floorAt(x, t, hmax) { let y = -1e9, p = null; const R = lv.roofs; // the highest surface under his feet that is no higher than hmax: a roof, a girder (at time t), a chimney top
      for (let i = ri0(x - HW); i < R.length && R[i].x < x + HW; i++) { const q = R[i]; if (x + HW - 2 > q.x && x - HW + 2 < q.x + q.w && q.top <= hmax && q.top > y) { y = q.top; p = q; } }
      for (const b of lv.beams) if (x + HW - 2 > b.x && x - HW + 2 < b.x + b.w) { const by = beamY(b, t); if (by <= hmax && by > y) { y = by; p = b; } }
      for (const o of lv.obs) if (o.type === 'chimney' && x + HW - 1 > o.x && x - HW + 1 < o.x + o.w) { const oy = o.base + o.h; if (oy <= hmax && oy > y) { y = oy; p = o; } }
      return p ? { y, p } : null; }
    function wallAt(q, x0) { const f0 = x0 + HW, f1 = q.x + HW, R = lv.roofs; // his front edge crossed the side of a higher roof (or of an obstacle) below its top
      for (let i = ri0(x0 - HW); i < R.length && R[i].x < f1 + 1; i++) { const o = R[i]; if (o.x >= f0 - 0.01 && o.x < f1 && q.h < o.top - RF.TOL) return { x: o.x }; }
      for (const o of lv.obs) if (o.x >= f0 - 0.01 && o.x < f1 && q.h < o.base + o.h - 2) return { x: o.x, hit: 1 };
      return null; }
    function lowTop(x) { const R = lv.roofs, i = Math.min(R.length - 1, ri0(x)); return Math.min(R[i].top, R[Math.max(0, i - 1)].top); }
    function jumpQ(q) { q.vy = -RF.JV; q.ground = false; q.coy = 0; q.buf = 0; q.nb = false; q.dbl = false; q.from = q.on; }
    function pressQ(q) { q.held = true; if (q.tg > 0) return null; if (q.ground || q.coy > 0) { jumpQ(q); return 'jump'; } if (!q.dbl) { q.vy = Math.min(q.vy, -RF.JV2); q.dbl = true; q.nb = false; q.spin = 0; return 'flip'; } q.buf = 0.12; return 'buf'; }
    function releaseQ(q) { q.held = false; if (q.vy < -RF.CUT && !q.nb) q.vy = -RF.CUT; }
    function stepQ(q, dt, t) { // one physics step (his, or a copy the pilot tries out) → null | 'land' | 'jump' (a buffered one) | 'bounce' | 'wall' | 'hit' | 'line' | 'fall'
      if (q.tg > 0) { q.tg -= dt; if (q.tg <= 0) q.vy = 30; return null; } // caught on a laundry line: hangs there for a moment
      if (q.buf > 0) q.buf -= dt; if (!q.ground && q.coy > 0) q.coy -= dt;
      const x0 = q.x; let ev = null;
      if (q.kb > 0) { q.kb -= dt; q.x -= 34 * dt; } else q.x += v * dt;
      const wl = wallAt(q, x0); if (wl) { q.x = wl.x - HW - 0.01; if (wl.hit) return 'hit'; ev = 'wall'; }
      const ph0 = q.h; rfPhys(q, dt, q.held);
      if (q.vy < 0) for (const l of lv.lines) if (q.x > l.x0 - 2 && q.x < l.x1 + 2) { const y = lineH(l, q.x); if (ph0 + RF.MH < y + 0.01 && q.h + RF.MH >= y) { q.h = y - RF.MH; q.vy = 0; q.tg = 0.35; q.ground = false; return 'line'; } }
      for (const o of lv.obs) if (o.type === 'antenna' && q.x + HW > o.x && q.x - HW < o.x + o.w && q.h < o.base + o.h && ph0 >= o.base + o.h - 0.01) return 'hit';
      const fl = q.vy >= 0 ? floorAt(q.x, t, ph0 + RF.TOL) : null;
      if (fl && q.h <= fl.y) { const air = !q.ground; q.h = fl.y; q.vy = 0; q.ground = true; q.dbl = false; q.nb = false; q.coy = 0.08; q.on = fl.p;
        if (fl.p.awning && q.x >= fl.p.x + fl.p.w - RF.AWN + 2) { q.vy = -RF.BOUNCE; q.ground = false; q.nb = true; q.coy = 0; q.from = fl.p; return 'bounce'; }
        if (air) { if (q.buf > 0) { jumpQ(q); return 'jump'; } return 'land'; } }
      else if (q.ground) q.ground = false;
      if (!q.ground && q.h < lowTop(q.x) - RF.FALL) return 'fall';
      return ev;
    }
    // ---------- the pilot (g.auto): tries the same physics on a copy ----------
    const BAD = { hit: 1, line: 1, fall: 1, wall: 1 };
    const cloneQ = (q) => ({ x: q.x, h: q.h, vy: q.vy, ground: q.ground, dbl: q.dbl, nb: q.nb, coy: q.coy, buf: q.buf, kb: q.kb, tg: q.tg, held: q.held, on: q.on, from: q.from });
    const PLANS = (() => { const a = []; for (const rel of [30, 20, 14, 9, 6, 3, 25, 11]) a.push({ rel, fd: -1 }); for (const rel of [30, 20, 14]) for (const fd of [0, 8, 16]) for (const h2 of [30, 8]) a.push({ rel, fd, h2 }); return a; })();
    function sim(q0, t0, pl, maxF, deep) { // → null (something bad happens) | { x, p, pl } where he first lands (no plan: still running fine after maxF frames); deep: …and can go on from there
      const q = cloneQ(q0); let t = t0, flip = -1, rel2 = -1, apexF = -1; if (pl) pressQ(q);
      for (let f = 0; f < maxF + 100; f++) {
        if (pl && f) { if (f === pl.rel) releaseQ(q); if (pl.fd >= 0 && apexF < 0 && q.vy >= 0) { apexF = f; flip = f + pl.fd; rel2 = flip + pl.h2; } if (f === flip) pressQ(q); if (f === rel2) releaseQ(q); }
        const ev = stepQ(q, F, t); t += F; if (ev && BAD[ev]) return null;
        if (q.x >= lv.flag - 4) return { x: q.x, p: lv.fin, pl: pl ? { rel: pl.rel, flip: flip >= 0 && flip <= f ? flip : -1, rel2: flip >= 0 && flip <= f ? rel2 : -1 } : null }; // the flag: done
        if (ev === 'land' && (!pl || f >= 1)) { if (deep && !recover(q, t)) return null; const fl = flip >= 0 && flip <= f; return { x: q.x, p: q.on, pl: pl ? { rel: pl.rel, flip: fl ? flip : -1, rel2: fl ? rel2 : -1 } : null }; }
        if (!pl && f >= maxF && q.ground) return { x: q.x, p: q.on, pl: null };
      }
      return null; }
    const recover = (q, t) => !!sim(q, t, null, 20) || PLANS.some((pl) => sim(q, t, pl, 0)); // after a landing: running on is fine, or some jump from there works
    function best(q, t, any) { let bb = null, bs = -1e9;
      for (const pl of PLANS) { const r = sim(q, t, pl, 0, true); if (!r) continue; if (any) return r;
        const p = r.p, w = p.w || 10, sc = Math.min(16, r.x - p.x, p.x + w - r.x) - (r.pl.flip >= 0 ? 6 : 0) + (p !== q.on ? 3 : 0); if (sc > bs) { bs = sc; bb = r; } }
      return bb; }
    function bot() {
      if (bp) { bp.f++; if (bp.f === bp.rel || bp.f === bp.rel2) releaseQ(m); if (bp.f === bp.flip) press(); if (m.ground && bp.f > 1) bp = null; else return; }
      if (!(m.ground || m.coy > 0) || m.kb > 0) return;
      if (sim(m, T, null, 24, true)) return; // running on is safe for now
      const q1 = cloneQ(m), e1 = stepQ(q1, F, T); if (!(e1 && BAD[e1]) && (q1.ground || q1.coy > 0) && best(q1, T + F, true)) return; // a jump next frame still works → wait
      const b = best(m, T, false); bp = Object.assign({ f: 0 }, b ? b.pl : { rel: 30, flip: 26, rel2: 60 }); press(); }
    function press() { const r = pressQ(m); if (r === 'jump') jumpFx(); else if (r === 'flip') { snd('whoosh'); for (let k = 0; k < 6; k++) fx.spawn('spark', m.x - cam + rnd(-8, 8), BASE - m.h - rnd(0, 20), { life: 0.3, vx: -v * 0.5 }); } }
    function ahead() { const f = m.x + HW, R = lv.roofs, c = [], i = R.findIndex((q) => q.x + q.w > m.x - HW);
      if (i >= 0) { const q = R[i], nx = R[i + 1]; c.push({ type: 'gap', dx: q.x + q.w - f, w: nx ? nx.x - q.x - q.w : 0, dh: nx ? nx.top - q.top : 0, line: lv.lines.some((l) => Math.abs(l.x0 - q.x - q.w) < 3), awning: !!q.awning }); }
      for (const o of lv.obs) if (o.x + o.w > m.x - HW) c.push({ type: o.type, dx: o.x - f, w: o.w, h: o.h });
      c.sort((a, b) => a.dx - b.dx); return c[0] || null; }
    const g = {
      snapY: 146, TUNE: RF, auto: false,
      init(L) { nban = 0; lastD = -1; flapT = 0; cooT = 2; setup(L); },
      onLevel(L) { setup(L); },
      demo() { const a = lv.roofs[0], b = lv.roofs[1]; phase = 'demo'; m.x = a.x + a.w + 4; m.h = Math.max(a.top, b.top) + 28; m.vy = -30; m.ground = false; cam = Math.max(0, m.x - 70); },
      update(dt) {
        step += dt; T += dt; if (moodT > 0) moodT -= dt; if (m.inv > 0) m.inv -= dt; if (flapT > 0) flapT -= dt; if (cooT > 0) cooT -= dt; if (awnT > 0) awnT -= dt;
        for (const p of pops) p.t += dt; pops = pops.filter((p) => p.t < 0.35);
        if (dmsg && (dmsg.t -= dt) <= 0) { msg(dmsg.a, dmsg.b); dmsg = null; }
        birdsUpdate(dt);
        if (phase === 'demo') return;
        if (phase === 'dead') { m.vy += RF.G * dt; m.h -= m.vy * dt; return; }
        if (phase === 'balloon') { balloon(dt); cam = Math.max(cam, m.x - 52); return; }
        if (phase === 'flag') { pt += dt; m.step += dt * 0.6; if (!m.ground) { m.vy = Math.min(RF.VMAX, m.vy + RF.G * dt); m.h -= m.vy * dt; if (m.h <= lv.fin.top) { m.h = lv.fin.top; m.vy = 0; m.ground = true; landFx(); } } if (pt > 1.4 && !api.over_) { phase = 'next'; api.levelUp(); } return; }
        if (phase !== 'run') return;
        if (g.auto) bot();
        const ev = stepQ(m, dt, T); if (m.ground && m.kb <= 0) m.step += dt; if (m.dbl) m.spin += dt;
        if (ev === 'jump') jumpFx(); else if (ev === 'land') landFx(); else if (ev === 'bounce') { snd('spring'); awnT = 0.3; awnX = m.x; flt(m.x - cam, BASE - m.h - 30, 'Пружинка!'); }
        else if (ev === 'wall') snd('thunk'); else if (ev === 'hit') hitObs(); else if (ev === 'line') tangle(); else if (ev === 'fall') { fall(); return; }
        grab();
        cam = Math.max(cam, m.x - 52); api.prog(Math.min(1, m.x / lv.flag));
        if (m.x >= lv.flag - 4) finish();
      },
      render(ctx, P) { draw(ctx, P); },
      down() { if (phase !== 'run') return; tip(null); press(); },
      up() { if (m) releaseQ(m); },
      key(k, d) { if (k === 'Space' || k === 'ArrowUp' || k === 'Enter' || k === 'KeyW') { if (d) g.down(); else g.up(); } },
      // test hooks
      st: () => ({ x: m.x, h: m.h, vy: m.vy, ground: m.ground, phase, v, len: lv.flag, cam, inv: m.inv, kb: m.kb, hearts: api.hearts, district: lv.d, dname: RD[lv.d], sign: lv.sign, bananas: nban, dbl: m.dbl, tangled: m.tg > 0, level: api.level, ahead: ahead() }),
      lab: (tau, dbl, vv, dh) => rfLab(tau, dbl, vv || v, dh),
      gen: (L, seed) => rfGen(L, seed), district: rfD, get lv() { return lv; },
      place(kind, dx, w) { const f = m.x + HW, X = Math.round(f + dx), R = lv.roofs, a = R.find((q) => m.x >= q.x - HW && m.x <= q.x + q.w + HW) || R[0];
        lv.roofs = R.slice(0, R.indexOf(a) + 1); a.awning = 0; a.cv = null; lv.obs = lv.obs.filter((o) => o.x + o.w < m.x - 12); lv.lines = []; lv.beams = lv.beams.filter((b) => b.x + b.w < m.x - 20); lv.ban = lv.ban.filter((b) => b.x < m.x - 10); lv.birds = []; bp = null;
        const tail = (x, top) => { lv.roofs.push({ x, w: 900, top, kind: 'fin', k: 3 }); lv.fin = lv.roofs[lv.roofs.length - 1]; lv.flag = x + 860; };
        if (kind === 'gap' || kind === 'laundry') { const g0 = w || 36; a.w = X - a.x; tail(X + g0, a.top); if (kind === 'laundry') lv.lines.push({ x0: X, x1: X + g0, y: a.top + RF.LINE, sag: RF.SAG, k: 1 }); }
        else if (kind === 'awning') { a.w = X + RF.AWN - a.x; a.awning = 1; tail(X + RF.AWN + 18, a.top + 44); }
        else { a.w = Math.max(X - a.x + 400, a.w); lv.fin = a; lv.flag = a.x + a.w - 40;
          if (kind === 'chimney') lv.obs.push({ type: 'chimney', x: X, w: 10, h: w || 16, base: a.top, k: 1 });
          else if (kind === 'antenna') lv.obs.push({ type: 'antenna', x: X, w: 4, h: 40, base: a.top });
          else if (kind === 'bananas') for (let k = 0; k < (w || 10); k++) lv.ban.push({ x: X + 4 + k * 9, h: a.top + 10 }); } },
    };
    let awnX = 0;
    function setup(L) {
      lv = rfGen(L, (api.seed() + L * 31) >>> 0); v = lv.v; T = 0; step = 0; mood = null; moodT = 0; bp = null; pt = 0; phase = 'run'; bl = null; pops = []; awnT = 0;
      const a = lv.roofs[0]; m = { x: 30, h: a.top, vy: 0, ground: true, dbl: false, nb: false, coy: 0, buf: 0, kb: 0, tg: 0, held: false, on: a, from: null, inv: 0, step: 0, spin: 9, free: 0, sheet: null };
      cam = 0; api.prog(0);
      if (L === api.st0) { tip('Тапай — прыжок, держи — выше, тап в воздухе — кувырок!'); dmsg = { t: 1.6, a: RD[lv.d], b: 'район ' + (lv.d + 1) + ' из 5' }; }
      else if (lv.d !== lastD) { dmsg = { t: 1.5, a: 'Новый район!', b: RD[lv.d] }; }
      lastD = lv.d;
    }
    function jumpFx() { snd('jump'); for (let k = 0; k < 3; k++) fx.spawn('crumb', m.x - cam + rnd(-4, 4), BASE - m.h, { c: '#e8e0d0', sz: 1, vx: rnd(-30, 0) - v * 0.3, vy: rnd(-20, -5), g: 150, life: 0.3 }); }
    function landFx() { const p = m.on; for (let k = 0; k < 4; k++) fx.spawn('crumb', m.x - cam + rnd(-5, 5), BASE - m.h, { c: '#e8e0c8', sz: 2, vx: rnd(-20, 20) - v * 0.4, vy: rnd(-30, -10), g: 200, life: 0.35 });
      if (p && p !== m.from && p.top !== undefined && p.kind && m.x - p.x < 7) { nban += 2; snd('squeak'); flt(m.x - cam, BASE - m.h - 34, 'Впритык! +2'); mood = 'yay'; moodT = 0.6; if (nban % 10 < 2) api.bonus(1, m.x - cam, BASE - m.h - 44); } }
    function hitObs() { m.kb = 0.3; m.vy = -110; m.ground = false; bp = null; mood = 'hurt'; moodT = 0.6; snd('thunk');
      if (m.inv <= 0) { m.inv = 1.5; flt(m.x - cam, BASE - m.h - 30, 'Бум!'); if (api.hurt()) die(); } }
    function tangle() { bp = null; mood = 'hurt'; moodT = 1; m.free = 1; m.sheet = ['#f4f4f4', '#ff8aa0', '#8ac8ff', '#ffe080'][Math.floor(rnd(0, 4))]; snd('squeak'); flt(m.x - cam, BASE - m.h - 34, 'Запутался!');
      if (m.inv <= 0) { m.inv = 1.4; if (api.hurt()) die(); } }
    function fall() { const free = m.free; m.free = 0; bp = null; mood = 'hurt'; moodT = 0.9;
      if (!free && api.hurt()) { die(); return; }
      const nx = lv.roofs.find((q) => q.x > m.x - HW) || lv.fin; phase = 'balloon'; pt = 0; bl = { x0: m.x, h0: m.h, x1: Math.min(nx.x + 14, nx.x + nx.w / 2), h1: nx.top, p: nx }; snd('whoosh'); if (!free) flt(m.x - cam, BASE - lowTop(m.x) - 10, 'Ой!'); }
    function balloon(dt) { pt += dt; const D = 1.3, k = Math.min(1, pt / D), e = (u) => u * u * (3 - 2 * u), hy = bl.h1 + 26;
      m.x = bl.x0 + (bl.x1 - bl.x0) * e(clamp((k - 0.3) / 0.6, 0, 1)); m.h = k < 0.6 ? bl.h0 + (hy - bl.h0) * e(k / 0.6) : hy - 26 * e((k - 0.6) / 0.4); m.step += dt * 0.3;
      if (k >= 1) { m.x = bl.x1; m.h = bl.h1; m.vy = 0; m.ground = true; m.kb = 0; m.tg = 0; m.dbl = false; m.nb = false; m.coy = 0.08; m.on = bl.p; m.from = bl.p; m.sheet = null; m.inv = Math.max(m.inv, 1); phase = 'run'; snd('pop');
        fx.spawn('puff', m.x - cam, BASE - m.h - 50, { c: '#ef4d6a', r0: 2, r1: 7, vx: 0, vy: -30, life: 0.4 }); } }
    function die() { phase = 'dead'; m.vy = -200; m.tg = 0; }
    function finish() { phase = 'flag'; pt = 0; mood = 'yay'; moodT = 3; bp = null; m.x = lv.flag - 3; m.tg = 0; m.kb = 0; if (m.vy < 0) m.vy = 0; snd('star'); const hi = m.h - lv.fin.top >= 40; flt(lv.flag - cam, BASE - lv.fin.top - 62, hi ? 'Высоко!' : 'Финиш!'); if (hi) api.bonus(1, lv.flag - cam, BASE - lv.fin.top - 50);
      for (let k = 0; k < 10; k++) fx.spawn('confetti', lv.flag - cam + rnd(-20, 20), BASE - lv.fin.top - rnd(30, 60), { c: pick(['#ff5c6c', '#ffd23a', '#3fdc7a', '#59c1ff']), vx: rnd(-30, 30), vy: rnd(-40, 0), g: 80, drag: 0.8, life: rnd(0.8, 1.4), wob: 5 }); }
    function grab() { for (const b of lv.ban) { if (b.got) continue; if (Math.abs(b.x - m.x) < HW + 3 && b.h > m.h - 3 && b.h < m.h + RF.MH + 3) { b.got = 1; pops.push({ x: b.x, h: b.h, t: 0, gold: b.gold });
          if (b.gold) { api.bonus(1, b.x - cam, BASE - b.h - 12); flt(b.x - cam, BASE - b.h - 26, 'Золотой!'); mood = 'yay'; moodT = 0.6; }
          else { nban++; snd('pop'); if (nban % 10 === 0) api.bonus(1, b.x - cam, BASE - b.h - 12); } } } }
    function birdsUpdate(dt) { for (const b of lv.birds) { if (!b.st) { if (m && m.x > b.x - 48 && m.x < b.x + 30) { b.st = 1; b.vx = (PX.hash(Math.round(b.x), 1, 3) < 0.5 ? -1 : 1) * rnd(25, 50); b.up = rnd(40, 70); if (flapT <= 0 && !quiet) { snd('flap'); flapT = 0.5; } }
        else if (cooT <= 0 && b.x - cam > 20 && b.x - cam < RW - 20 && !quiet) { snd('coo'); cooT = 7; } }
      else { b.x += b.vx * dt; b.h += b.up * dt; b.up += 30 * dt; b.f += dt * 12; } } }
    // ---------- drawing ----------
    function draw(ctx, P) {
      const d = lv.d, C = RFP[d], cvEl = ctx.canvas, ch = (cvEl && cvEl.height) || RH;
      ctx.drawImage(rfSky(d), 0, 0); if (ch > RH) P.r(0, RH, RW, ch - RH, C.sky[3]);
      if (d <= 3) for (let k = 0; k < 3; k++) { const cx = ((k * 90 + 40 - cam * 0.05) % 270 + 270) % 270 - 45; ctx.globalAlpha = d === 3 ? 0.45 : d === 2 ? 0.7 : 0.95; ROOMS.cloud(P, cx, 30 + k * 18 + (k % 2) * 8, 0.5 + (k % 2) * 0.15); ctx.globalAlpha = 1; }
      rfTower(P, d, Math.round(150 - cam * 0.02), 196);
      const far = rfFar(d), fx0 = Math.round(-((cam * 0.08) % 240)); ctx.drawImage(far, fx0, RH - far.height); ctx.drawImage(far, fx0 + 240, RH - far.height);
      if (ch > RH) P.r(0, RH, RW, ch - RH, C.far);
      const mid = rfMid(d), mx0 = Math.round(-((cam * 0.3) % 200)); ctx.drawImage(mid, mx0, RH - mid.height); ctx.drawImage(mid, mx0 + 200, RH - mid.height);
      if (ch > RH) P.r(0, RH, RW, ch - RH, C.mid);
      // girders on crane cables (behind the houses' fronts)
      for (const b of lv.beams) { const sx = Math.round(b.x - cam); if (sx < -40 || sx > RW + 4) continue; const sy = Math.round(BASE - beamY(b, T));
        P.r(sx + 6, 0, 1, sy - 12, '#3a3a40'); P.line(sx + 7, sy - 12, sx + 2, sy - 1, '#3a3a40'); P.line(sx + 7, sy - 12, sx + 31, sy - 1, '#3a3a40'); P.r(sx + 5, sy - 14, 3, 3, '#5a5a62');
        P.r(sx, sy, 34, 5, '#8a6a10'); P.r(sx, sy, 34, 1, '#ffe060'); P.r(sx + 1, sy + 1, 32, 3, '#f2c21a'); for (let x = 2; x < 32; x += 6) { P.line(sx + x, sy + 1, sx + x + 3, sy + 3, '#a07a10'); P.line(sx + x + 3, sy + 1, sx + x + 6, sy + 3, '#a07a10'); } }
      // the houses
      for (const q of lv.roofs) { const sx = Math.round(q.x - cam); if (sx > RW || sx + q.w < 0) continue; const sy = BASE - q.top; ctx.drawImage(rfFacade(q, d, ch), sx, sy);
        if (q.awning) { const ax = sx + q.w - RF.AWN, dip = awnT > 0 && Math.abs(awnX - (q.x + q.w - RF.AWN / 2)) < 30 ? Math.round(Math.sin(awnT / 0.3 * Math.PI) * 2) : 0;
          for (let x = 0; x < RF.AWN + 3; x++) { const c = Math.floor(x / 3) % 2 ? '#f4f4ec' : '#e8453c', y = sy + dip + Math.floor(x / 10); P.r(ax + x, y, 1, 4, c); if (x % 3 === 1) P.p(ax + x, y + 4, c); }
          P.r(ax, sy + dip, RF.AWN + 3, 1, '#ffd0c8'); P.r(ax + 2, sy + 5, 1, 8, '#6a6a72'); P.r(ax + RF.AWN - 1, sy + 7, 1, 7, '#6a6a72'); } }
      // the district sign on the first roof, the flag + the stairwell hut on the last
      if (lv.sign) { const t = rfText(lv.sign, '#ffffff', 8), a = lv.roofs[0], bw = t.tw + 6, sx = Math.round(84 - cam), sy = BASE - a.top - 46;
        if (sx > -bw && sx < RW) { P.r(sx + 4, sy + 14, 2, 32, '#5a5a62'); P.r(sx + bw - 6, sy + 14, 2, 32, '#5a5a62'); P.r(sx, sy, bw, 15, '#f4f4f4'); P.r(sx + 1, sy + 1, bw - 2, 13, '#2a5aa0'); ctx.drawImage(t, sx + 3, sy + 2); } }
      { const f = lv.fin, fxs = Math.round(lv.flag - cam), fy = BASE - f.top; if (fxs > -60 && fxs < RW + 40) { const hx = fxs + 10;
        P.r(hx, fy - 20, 22, 20, C.fac[0][1]); P.r(hx + 1, fy - 19, 20, 19, C.fac[0][2]); P.r(hx - 1, fy - 22, 24, 3, C.cap); P.r(hx + 8, fy - 14, 7, 14, '#6a4428'); P.p(hx + 13, fy - 7, '#f2c21a');
        P.r(fxs, fy - 46, 1, 46, '#e8e8ec'); P.r(fxs + 1, fy - 46, 1, 46, '#a8a8b4'); P.circ(fxs + 1, fy - 47, 2, '#3fdc7a');
        const wv = phase === 'flag' || phase === 'next' ? Math.floor(step * 8) % 2 : 0; P.r(fxs - 14, fy - 44 + wv, 14, 9, '#ffd23a'); P.r(fxs - 14, fy - 44 + wv, 14, 1, '#fff08a'); P.ell(fxs - 7, fy - 40 + wv, 3, 1.6, '#a86a28'); } }
      // chimneys (smoking) and TV antennas
      for (const o of lv.obs) { const sx = Math.round(o.x - cam); if (sx < -16 || sx > RW + 8) continue; const sy = BASE - o.base - o.h;
        if (o.type === 'chimney') { const br = d === 4 ? '#5a6478' : d === 2 ? '#8a8a8e' : d === 3 ? '#c07a6a' : '#a84a32', dk = PX.shade(br, 0.75);
          P.r(sx, sy + 2, 10, o.h - 2, br); for (let y = sy + 4; y < sy + o.h; y += 3) P.r(sx, y, 10, 1, dk); P.r(sx - 1, sy, 12, 3, '#3a3438'); P.r(sx - 1, sy, 12, 1, '#6a6068'); P.r(sx, sy + 2, 1, o.h - 2, dk);
          if (d !== 4 && Math.floor(step * 3 + o.x) % 5 === 0 && Math.random() < 0.15) fx.spawn('puff', sx + 5, sy - 2, { c: '#e8e8f0', r0: 1.5, r1: 5, vx: -10, vy: -16, life: 0.9 }); }
        else { P.r(sx + 1, sy, 2, o.h, '#7a7a86'); P.r(sx + 1, sy, 1, o.h, '#b8b8c4'); for (const [yy, ww] of [[2, 12], [8, 10], [14, 8]]) P.r(sx + 2 - ww / 2, sy + yy, ww, 1, '#8a8a96'); P.r(sx - 1, sy + o.h - 2, 6, 2, '#5a5a66');
          if (Math.floor(step * 2) % 2) P.r(sx + 1, sy - 2, 2, 2, '#ff4a4a'); } }
      // laundry lines with clothes
      for (const l of lv.lines) { const sx0 = Math.round(l.x0 - cam), sx1 = Math.round(l.x1 - cam); if (sx1 < -4 || sx0 > RW + 4) continue; const ra = lv.roofs.find((q) => Math.abs(q.x + q.w - l.x0) < 1), rb = lv.roofs.find((q) => Math.abs(q.x - l.x1) < 1);
        const pt0 = BASE - l.y - l.sag, tg = m.tg > 0 && m.x > l.x0 - 4 && m.x < l.x1 + 4;
        if (ra) P.r(sx0 - 2, pt0 - 1, 2, BASE - ra.top - pt0 + 1, '#6a5040'); if (rb) P.r(sx1, pt0 - 1, 2, BASE - rb.top - pt0 + 1, '#6a5040');
        let px = sx0, py = pt0; for (let x = l.x0; x <= l.x1 + 1; x += 2) { const xx = Math.min(x, l.x1), yy = Math.round(BASE - lineH(l, xx) + (tg ? Math.max(0, 6 - Math.abs(xx - m.x) / 3) : 0)); P.line(px, py, Math.round(xx - cam), yy, d === 4 ? '#c8c8d8' : '#5a4a4c'); px = Math.round(xx - cam); py = yy; }
        for (const [u, kind] of [[0.14, 0], [0.26, 1], [0.78, 2], [0.88, 0]]) { const x = l.x0 + (l.x1 - l.x0) * u, y = Math.round(BASE - lineH(l, x)), cx = Math.round(x - cam), c = ['#ff8aa0', '#8ac8ff', '#ffe080', '#a8e8a0'][(l.k + kind) % 4];
          if (kind === 0) { P.r(cx - 1, y + 1, 3, 4, c); P.r(cx, y + 5, 2, 1, c); } else if (kind === 1) { P.r(cx - 3, y + 1, 6, 2, c); P.r(cx - 2, y + 3, 4, 3, c); } else { P.r(cx - 2, y + 1, 4, 5, c); P.r(cx - 2, y + 1, 4, 1, PX.shade(c, 0.8)); } } }
      // bananas
      const bb = rfBan(), gg = rfGold();
      for (const b of lv.ban) { if (b.got) continue; const sx = Math.round(b.x - cam); if (sx < -12 || sx > RW + 12) continue; const bob = Math.round(Math.sin(step * 4 + b.x * 0.1)); if (b.gold) { ctx.drawImage(gg, sx - 6, BASE - b.h - 6 + bob); if (Math.floor(step * 6) % 3 === 0) P.p(sx + 4, BASE - b.h - 6 + bob, '#ffffff'); } else ctx.drawImage(bb, sx - 4, BASE - b.h - 4 + bob); }
      for (const p of pops) { const k = p.t / 0.35; if (k > 1) continue; ctx.globalAlpha = 1 - k; ctx.drawImage(p.gold ? gg : bb, Math.round(p.x - cam - (p.gold ? 6 : 4)), Math.round(BASE - p.h - (p.gold ? 6 : 4) - k * 14)); ctx.globalAlpha = 1; }
      // pigeons (gulls by the river)
      for (const b of lv.birds) { const sx = Math.round(b.x - cam), sy = Math.round(BASE - b.h); if (sx < -8 || sx > RW + 8 || sy < -8) continue; const gull = d === 3, body = gull ? '#f4f4f4' : '#8a8a9a', wing = gull ? '#b8bcc8' : '#6a6a7a', head = gull ? '#f4f4f4' : '#5a5a6a';
        if (!b.st) { const pk = Math.floor(step * 2 + b.f) % 7 === 0; P.r(sx - 2, sy - 3, 5, 3, body); P.r(sx - 1, sy - 3, 3, 1, wing); P.r(sx + 2, sy - (pk ? 3 : 5), 2, 2, head); P.p(sx + 4, sy - (pk ? 2 : 4), gull ? '#f2a020' : '#d8b070'); if (!gull) P.p(sx + 2, sy - 3, '#5a9a7a'); P.p(sx - 1, sy, '#d07a6a'); P.p(sx + 1, sy, '#d07a6a'); }
        else { const up = Math.floor(b.f) % 2; P.r(sx - 2, sy - 2, 5, 2, body); P.r(sx + 2, sy - 3, 2, 2, head); if (up) { P.r(sx - 3, sy - 5, 3, 1, wing); P.r(sx - 1, sy - 4, 2, 1, wing); } else { P.r(sx - 3, sy, 3, 1, wing); P.r(sx - 1, sy - 1, 2, 1, wing); } } }
      // his shadow on whatever is under him
      if (phase === 'run' && !m.ground) { const fl = floorAt(m.x, T, m.h + 0.5); if (fl && m.h - fl.y < 80) { const k = (m.h - fl.y) / 80; P.shadow(Math.round(m.x - cam), BASE - fl.y, Math.max(2, 6 - k * 4), 1.5, 0.28 * (1 - k)); } }
      drawMe(ctx, P);
      // the banana counter (every 10 = a coin), safely below #g-pause on iPhone 17
      const banY = ch > RH ? 52 : 38;
      ctx.drawImage(bb, 4, banY); for (let k = 0; k < 10; k++) P.r(14 + k * 4, banY + 3, 3, 3, k < nban % 10 ? '#ffd23a' : 'rgba(20,16,40,0.35)');
    }
    function drawMe(ctx, P) {
      if (m.inv > 0 && phase === 'run' && Math.floor(step * 14) % 2) return;
      const sx = Math.round(m.x - cam), sy = Math.round(BASE - m.h), air = !m.ground && phase !== 'next' && phase !== 'flag';
      const p = mp(RF.MS, { pose: air ? (m.vy < 0 ? 'up' : 'fall') : 'idle', legs: air ? (m.vy < 0 || m.dbl ? 'tuck' : 'spread') : (Math.floor(m.step * 11) % 2 ? 'walkL' : 'walkR') }, 1); p.eyes = { mode: 'open', look: [1, 0] };
      if (!air && phase === 'run') p.bob = Math.floor(m.step * 11) % 2;
      if (phase === 'dead') { p.eyes = { mode: 'dizzy' }; p.mouth = 'wavy'; }
      else if (phase === 'balloon') { p.pose = 'up'; p.armL = [-4, -62]; p.armR = [5, -64]; p.legs = 'spread'; p.eyes = { mode: 'wide', look: [1, -1] }; p.mouth = 'o'; p.open = 0.4; }
      else if (m.tg > 0) { p.pose = 'up'; p.armL = [-7, -60]; p.armR = [7, -60]; p.eyes = { mode: 'wide', look: [0, -1] }; p.mouth = 'o'; p.open = 0.7; }
      else if (moodT > 0 && mood === 'hurt') { p.eyes = { mode: 'wide', look: [1, 0] }; p.mouth = 'o'; p.open = 0.67; }
      else if ((moodT > 0 && mood === 'yay') || phase === 'flag' || phase === 'next') { p.eyes = { mode: 'happy' }; p.mouth = 'laugh'; }
      else if (air) { p.mouth = 'o'; p.open = 0.34; }
      if (phase === 'flag' || phase === 'next') { p.pose = 'up'; const w = Math.floor(step * 6) % 2; p.armL = [-6, -60 + w * 4]; p.armR = [6, -64 - w * 4]; p.legs = 'stand'; }
      if (phase === 'balloon') { const bal = ARTG.balloon(), bx = sx + 4, by = sy - 30 - 27 + Math.round(Math.sin(step * 3) * 1.5); P.line(sx + 4, sy - 22, bx, by + 27, '#f4f4f4'); ctx.drawImage(bal, bx - 12, by); }
      const rot = m.dbl && air && phase === 'run' && m.spin < 0.36 ? Math.floor(m.spin / 0.09) % 4 : 0;
      if (rot) { const sp = SPR.get(p, 'game'); ctx.save(); ctx.translate(sx, sy - 12); ctx.rotate(rot * Math.PI / 2); ctx.drawImage(sp.cv, -Math.round(sp.ox), -Math.round(sp.oy) + 12); ctx.restore(); }
      else drawM(ctx, p, sx, sy);
      if (m.sheet && (m.tg > 0 || phase === 'balloon' || !m.ground)) { P.r(sx - 5, sy - 26, 11, 6, m.sheet); P.r(sx - 6, sy - 21, 3, 4, m.sheet); P.r(sx + 4, sy - 21, 3, 3, m.sheet); P.r(sx - 5, sy - 26, 11, 1, PX.shade(m.sheet, 1.1)); }
    }
    return g;
  }
  const GAMES = { catch: Catch, vine: Vine, balloon: Balloon, bongo: Bongo, gym: Gym, stack: Stack, super: Super, race: Race, roofs: Roofs, d_catch: DuelCatch, d_bongo: DuelBongo, d_gym: DuelGym, d_keys: DuelKeys };
  return { intro, duelIntro, seed: (n) => { seed = n >>> 0; }, start, update, render, down, move, up, key, pause, home, api, get active() { return !!G; }, get st() { return st; }, get G() { return G; }, fx };
})();
