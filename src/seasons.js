'use strict';
// ===== Round 10 #8: seasonal events =====
// After the first week of care (7 care days) a new event comes every 7 care days, in turn and round again:
// Хэллуин → Новый год → Весна балдёжная → Лето-солнышко → День Абибяна (his birthday — our own idea) → Хэллуин …
// Each event: its weather behind the zal and the balcony windows, its thing on the zal windowsill with a trick of its own,
// a toast + a coin gift when it begins (once: S.season is saved). Preview any of them without saving: index.html#season=newyear
const SEASONS = (() => {
  const S = () => GAME.S;
  const LIST = [
    { id: 'halloween', name: 'Хэллуин', verb: 'Наступил', gift: 30, snd: 'boo', what: 'тыква-фонарик, за окном кружат рыжие листья' },
    { id: 'newyear', name: 'Новый год', verb: 'Наступил', gift: 40, snd: 'jingle', what: 'ёлочка с огоньками, за окном снег' },
    { id: 'spring', name: 'Весна балдёжная', verb: 'Наступила', gift: 30, snd: 'chirp', what: 'тюльпаны и птичка, за окном летят лепестки' },
    { id: 'summer', name: 'Лето-солнышко', verb: 'Наступило', gift: 30, snd: 'fan', what: 'вентилятор, за окном жаркое солнце' },
    { id: 'bday', name: 'День Абибяна', verb: 'Наступил', gift: 50, snd: 'pop', what: 'его день рождения: шарики и конфетти' },
  ];
  const BY = Object.fromEntries(LIST.map((e) => [e.id, e])), FIRST = 7, WEEK = 7;
  const at = (days) => (days >= FIRST ? LIST[Math.floor((days - FIRST) / WEEK) % LIST.length].id : null);
  const left = (days) => (days < FIRST ? FIRST - days : WEEK - ((days - FIRST) % WEEK)); // care days until the next event begins
  let ovr = null, t = 0, last = null; const V = { jump: 0, ghost: -1, lights: 0, bird: -1, fast: 0, popped: -1, popT: 0 };
  try { const m = /season=([a-z]+)/.exec(location.hash || ''); if (m && BY[m[1]]) ovr = m[1]; } catch (e) { }
  const cur = () => ovr || (S() && S().season && BY[S().season.id] ? S().season.id : null);
  const rnd = (a, b) => a + Math.random() * (b - a), pick = (a) => a[Math.floor(Math.random() * a.length)];
  const say = (k, mood) => { const L = DATA.LINES[k]; if (L && !S().sleeping && !GAME.ageDef().babble) HOME.say(pick(L), mood); };

  function check() { // on boot and on every new care day: the event of this week (null in the first week)
    const s = S(), id = at(s.grow.days || 0), was = s.season ? s.season.id : null;
    if (id === was) return null;
    s.season = id ? { id, day: s.grow.days } : null; ovr = null; resetV();
    if (id) begin(BY[id]); else GAME.save(true);
    return id;
  }
  function begin(e) {
    GAME.addCoins(e.gift, 'season'); AUDIO.play('season');
    UI.toast(`${e.verb} ${e.name}! Подарок: +${e.gift}`, UI.I('gift'), 'gold');
    try { HOME.fx.spawn && confetti(14); } catch (er) { }
    setTimeout(() => { try { if (APP.scene === 'home') say('s_' + e.id, 'happy'); } catch (er) { } }, 1400);
    GAME.save(true);
  }
  function set(id) { ovr = BY[id] ? id : null; resetV(); return cur(); } // preview (tests, #season=…): not saved
  function resetV() { Object.assign(V, { jump: 0, ghost: -1, lights: 0, bird: -1, fast: 0, popped: -1, popT: 0 }); }
  function update(dt) { t += dt; V.jump = Math.max(0, V.jump - dt); V.lights = Math.max(0, V.lights - dt); V.fast = Math.max(0, V.fast - dt); if (V.ghost >= 0) { V.ghost += dt; if (V.ghost > 1.8) V.ghost = -1; } if (V.bird >= 0) { V.bird += dt; if (V.bird > 3.2) V.bird = -1; } if (V.popped >= 0) { V.popT -= dt; if (V.popT <= 0) V.popped = -1; } }
  function confetti(n) { const cs = ['#ff5c6c', '#ffd23a', '#3fdc7a', '#59c1ff', '#b48cff', '#ffffff']; for (let i = 0; i < n; i++) HOME.fx.spawn('confetti', rnd(70, 130), rnd(70, 110), { c: pick(cs), vx: rnd(-40, 40), vy: rnd(-60, -10), g: 120, life: rnd(1.2, 2) }); }

  // ---------- weather behind the glass ----------
  const ZPANES = () => { const [x, y, w, h] = ROOMS.WIN.zal, m = x + w / 2 - 1; return [[x, y, m - x, 18], [m + 2, y, x + w - m - 2, 18], [x, y + 20, m - x, h - 20], [m + 2, y + 20, x + w - m - 2, h - 20]]; };
  const LEAF = ['#e8781e', '#d4561a', '#f0a030', '#c8401a', '#e89a2a'], PET = ['#ff9cc8', '#f8b4d4', '#ffa6cc', '#ffffff'], CONF = ['#ff4a5a', '#ffd23a', '#4ad06a', '#4a9aff', '#c07aff', '#ff8a3a'];
  function sky(ctx, P, room, r, tt) { // r: the glass rect; clipped to the panes in the zal
    const id = cur(); if (!id) return; tt = tt === undefined ? t : tt; const [x0, y0, w, h] = r, big = room !== 'zal';
    ctx.save(); ctx.beginPath(); if (room === 'zal') for (const q of ZPANES()) ctx.rect(q[0], q[1], q[2], q[3]); else ctx.rect(x0, y0, w, h); ctx.clip();
    const n = Math.max(14, Math.round(w * h / (big ? 150 : 62))), fx = (k, sp, ph) => x0 + (((k * 0.618034 + 0.13) % 1 * (w + 10) + ph + tt * sp) % (w + 10) + w + 10) % (w + 10) - 5, fy = (k, sp) => y0 + (((k * 0.754878 + 0.31) % 1 * (h + 10) + tt * sp) % (h + 10)) - 5; // golden-ratio scatter
    if (id === 'halloween') {
      ctx.globalAlpha = 0.28; P.r(x0, y0, w, h, '#4a2a6a'); ctx.globalAlpha = 1; // a dusky purple evening
      const mx = x0 + w * 0.72, my = y0 + (big ? 14 : 8); P.circ(mx, my, big ? 6 : 4, '#fff2c8'); P.circ(mx + (big ? 2 : 1.5), my - 1, big ? 5 : 3.4, '#8a6aa8'); // a thin moon
      const bx = x0 + ((tt * 14) % (w + 30)) - 15, by = y0 + (big ? 22 : 12) + Math.sin(tt * 3) * 3, wg = Math.floor(tt * 8) % 2; // a bat
      P.r(bx - 1, by, 3, 2, '#1a1020'); P.p(bx - 2 - wg, by - wg, '#1a1020'); P.p(bx - 3, by - 1 + wg, '#1a1020'); P.p(bx + 2 + wg, by - wg, '#1a1020'); P.p(bx + 3, by - 1 + wg, '#1a1020');
      for (let k = 0; k < n; k++) { const x = fx(k, 9 + (k % 3) * 5, Math.sin(tt * 1.7 + k) * 4), y = fy(k, 13 + (k % 4) * 4), c = LEAF[k % LEAF.length]; P.r(x, y, 2, 2, c); if (k % 2) P.p(x + 2, y + (Math.floor(tt * 3 + k) % 2), c); }
    } else if (id === 'newyear') {
      ctx.globalAlpha = 0.22; P.r(x0, y0, w, h, '#2a3a6a'); ctx.globalAlpha = 1;
      for (let k = 0; k < n * 1.3; k++) { const x = fx(k, 3 + (k % 3), Math.sin(tt * 1.3 + k * 1.7) * 3), y = fy(k, 9 + (k % 5) * 3); if (k % 4 === 0) { P.p(x, y, '#ffffff'); P.p(x - 1, y, '#ffffff'); P.p(x + 1, y, '#ffffff'); P.p(x, y - 1, '#ffffff'); P.p(x, y + 1, '#ffffff'); } else P.r(x, y, k % 3 ? 1 : 2, k % 3 ? 1 : 2, '#ffffff'); }
      if (room === 'zal') for (const q of ZPANES().slice(2)) { P.r(q[0], q[1] + q[3] - 3, q[2], 3, '#ffffff'); P.hl(q[0] + 2, q[1] + q[3] - 4, q[2] - 5, '#ffffff'); } // snow piled on the outer sill
    } else if (id === 'spring') {
      ctx.globalAlpha = 0.12; P.r(x0, y0, w, h, '#ffe0f0'); ctx.globalAlpha = 1;
      const bx = x0 + 1, by = y0 + 5; P.line(bx - 2, by + 6, bx + 11, by, '#6a4a3a'); P.line(bx + 5, by + 3, bx + 8, by + 8, '#6a4a3a'); // a blossoming branch in the corner
      for (const [dx, dy] of [[2, 4], [6, 1], [10, -1], [8, 7], [4, 6]]) { P.p(bx + dx, by + dy, '#ff9cc8'); P.p(bx + dx + 1, by + dy, '#ffd0e4'); P.p(bx + dx, by + dy + 1, '#ff9cc8'); }
      for (let k = 0; k < n * 0.8; k++) { const x = fx(k, 12 + (k % 3) * 6, Math.sin(tt * 2.2 + k) * 5), y = fy(k, 7 + (k % 4) * 3), c = PET[k % PET.length]; P.r(x, y, 2, 1, c); if (Math.floor(tt * 4 + k) % 2) P.p(x, y + 1, c); }
    } else if (id === 'summer') {
      ctx.globalAlpha = 0.16; P.r(x0, y0, w, h, '#ffe680'); ctx.globalAlpha = 1;
      const sx = x0 + w * (big ? 0.8 : 0.72), sy = y0 + (big ? 16 : 9), R = big ? 9 : 6;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 + Math.sin(tt * 3) * 0.08; P.circ(sx, sy, R + 4, '#ffd040'); ctx.restore();
      for (let k = 0; k < 10; k++) { const a = tt * 0.9 + k * Math.PI / 5, l = R + 2 + (k % 2) * 2 + Math.sin(tt * 4 + k) * 1; P.line(sx + Math.cos(a) * (R + 1), sy + Math.sin(a) * (R + 1), sx + Math.cos(a) * l, sy + Math.sin(a) * l, '#ffd23a'); }
      P.circ(sx, sy, R, '#ffc81e'); P.circ(sx - 0.5, sy - 0.5, R - 1.5, '#ffe050'); P.circ(sx - 1.5, sy - 1.5, R * 0.45, '#fff07a');
      P.p(sx - 2, sy - 1, '#3a2a10'); P.p(sx + 2, sy - 1, '#3a2a10'); P.hl(sx - 1, sy + 2, 3, '#c86a10'); // he smiles back
      ctx.globalAlpha = 0.35; for (let k = 0; k < 3; k++) { const y = y0 + h * (0.55 + k * 0.14) + Math.sin(tt * 2 + k) * 1.5; for (let x = x0; x < x0 + w; x += 2) P.p(x, y + Math.round(Math.sin(x * 0.5 + tt * 5 + k) * 1), '#fff6d0'); } ctx.globalAlpha = 1; // heat haze
    } else if (id === 'bday') {
      for (let k = 0; k < n; k++) { const x = fx(k, 4 + (k % 3) * 3, Math.sin(tt * 2 + k) * 4), y = fy(k, 16 + (k % 4) * 5), c = CONF[k % CONF.length]; if (Math.floor(tt * 6 + k) % 2) P.r(x, y, 2, 1, c); else P.r(x, y, 1, 2, c); }
    }
    ctx.restore();
  }

  // ---------- the thing on the zal windowsill (bottom centre: x 100, y 128) ----------
  const SILL = [100, 128];
  const RECT = { halloween: [89, 114, 22, 14], newyear: [90, 96, 20, 32], spring: [91, 102, 18, 26], summer: [91, 104, 18, 24], bday: [84, 76, 32, 52] };
  const PUMP = ['....gg....', '....g.....', '.ooOooOoo.', 'oOoooooOoo', 'oOyyoOyyOo', 'oOyyoOyyOo', 'oOooooooOo', 'oOyoyyoyOo', 'oOoyyyyoOo', '.ooOooOoo.', '..oooooo..'];
  function decor(ctx, P, id, x, y, tt) { // x, y: bottom centre
    tt = tt === undefined ? t : tt;
    if (id === 'halloween') {
      const j = V.jump > 0 ? Math.round(Math.sin((0.6 - V.jump) / 0.6 * Math.PI) * 4) : 0, fl = 0.75 + Math.sin(tt * 9) * 0.15 + Math.sin(tt * 23) * 0.1;
      const glow = fl > 0.8 ? '#ffe070' : '#ffc040';
      P.shadow(x, y - 1, 10, 2, 0.25);
      P.map(x - 10, y - 11 - j, PUMP.map((r) => r.replace(/./g, (c) => c + c)), { g: '#4a7a2a', o: '#e8781e', O: '#c05a14', y: glow }, 1);
      P.r(x - 7, y - 9 - j, 3, 1, '#f8a040'); P.r(x - 9, y - 7 - j, 1, 3, '#f8a040'); // shine
      if (fl > 0.8) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.1; P.circ(x, y - 6 - j, 11, '#ff9a30'); ctx.restore(); } // the candle inside
      if (V.ghost >= 0) { const k = V.ghost / 1.8, gy = y - 16 - k * 34, gx = x + Math.sin(k * 9) * 4; ctx.globalAlpha = Math.max(0, 1 - k * 0.9); P.map(Math.round(gx - 5), Math.round(gy - 10), ['..wwwwww..', '.wwwwwwww.', 'wwkwwwkwww', 'wwkwwwkwww', 'wwwwwwwwww', 'wwwwkkwwww', 'wwwwkkwwww', 'wwwwwwwwww', 'ww.ww.ww.w', 'w...w...w.'], { w: '#f4f4ff', k: '#2a2040' }, 1); ctx.globalAlpha = 1; }
    } else if (id === 'newyear') {
      P.r(x - 4, y - 6, 9, 6, '#c8343a'); P.r(x - 4, y - 6, 9, 1, '#e8545a'); P.r(x - 4, y - 1, 9, 1, '#8a1e24'); P.r(x - 1, y - 8, 3, 2, '#6a3a20'); // pot + trunk
      for (const [b, top, bot] of [[8, -16, -8], [6, -21, -14], [4, -26, -19]]) for (let yy = top; yy <= bot; yy++) { const k = (yy - top) / (bot - top), hw = Math.round(1 + (b - 1) * k); P.r(x - hw, y + yy, hw * 2 + 1, 1, yy === bot ? '#1f6a30' : '#2e8a3e'); P.p(x - hw, y + yy, '#3fa44e'); P.p(x + hw, y + yy, '#1f6a30'); }
      P.r(x - 1, y - 29, 3, 3, '#ffd23a'); P.p(x, y - 30, '#fff4a0'); P.p(x - 2, y - 28, '#ffd23a'); P.p(x + 2, y - 28, '#ffd23a'); // star
      const L = [[-5, -9], [3, -11], [-2, -13], [5, -9], [-3, -16], [2, -17], [-1, -20], [1, -23], [-6, -10], [4, -14]], C = ['#ff4a5a', '#ffd23a', '#59c1ff', '#ff8cf0'];
      L.forEach(([dx, dy], i) => { const on = V.lights > 0 ? Math.floor(tt * 14 + i) % 2 : Math.floor(tt * 2 + i * 0.7) % 3 !== 0; if (on) P.p(x + dx, y + dy, C[i % 4]); });
      if (V.lights > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18; P.circ(x, y - 14, 13, '#fff0a0'); ctx.restore(); }
    } else if (id === 'spring') {
      const sw = V.bird >= 0 ? Math.sin(tt * 10) * 1.2 : Math.sin(tt * 1.6) * 0.6;
      P.r(x - 5, y - 7, 11, 7, '#c8643a'); P.r(x - 6, y - 8, 13, 2, '#e07a4a'); P.r(x - 4, y - 1, 9, 1, '#8a3a1e');
      const F = [[-4, -20, '#e84a5a', '#ff7a8a'], [0, -24, '#ff8cc0', '#ffc0dc'], [4, -19, '#ffd23a', '#fff07a']];
      F.forEach(([dx, dy, c, hl], i) => { const fx0 = Math.round(x + dx + sw * (i - 1)); P.line(x + dx * 0.4, y - 8, fx0, y + dy + 4, '#4caf50'); P.r(fx0 - 1, y + dy, 3, 4, c); P.p(fx0 - 2, y + dy, c); P.p(fx0 + 2, y + dy, c); P.p(fx0, y + dy, hl); });
      P.line(x - 2, y - 8, x - 6, y - 13, '#3f9a45'); P.p(x - 5, y - 12, '#4caf50'); P.line(x + 2, y - 8, x + 6, y - 12, '#3f9a45'); P.p(x + 5, y - 11, '#4caf50'); P.p(x - 4, y - 11, '#5cc060'); P.p(x + 4, y - 10, '#5cc060');
      if (V.bird >= 0) { const k = V.bird, land = k > 0.7 && k < 2.6, bx = land ? x + 10 : k <= 0.7 ? x + 10 + (0.7 - k) * 60 : x + 10 - (k - 2.6) * 70, by = land ? y - 3 : y - 3 - (k <= 0.7 ? (0.7 - k) * 40 : (k - 2.6) * 50), hop = land && Math.floor(k * 6) % 3 === 0 ? 1 : 0, wg = !land && Math.floor(k * 12) % 2;
        P.ell(bx, by - hop - 2, 3, 2.2, '#5a8ad8'); P.r(bx - 1, by - hop - 1, 3, 1, '#ffd0a0'); P.p(bx - 3, by - hop - 3, '#3a6ab8'); P.p(bx - 3, by - hop - 4, '#1a1020'); P.p(bx - 4, by - hop - 3, '#f0a030'); P.p(bx + 3, by - hop - 2, '#3a6ab8'); P.p(bx + 1, by - hop - 4 - wg, '#3a6ab8'); }
    } else if (id === 'summer') {
      const sp = V.fast > 0 ? 34 : 9, a0 = tt * sp, cx = x, cy = y - 15;
      P.r(x - 5, y - 2, 11, 2, '#8a8e98'); P.r(x - 5, y - 2, 11, 1, '#b8bcc6'); P.r(x - 1, y - 8, 2, 6, '#9aa0aa'); P.p(x + 2, y - 2, V.fast > 0 ? '#ff4a5a' : '#4ad06a');
      P.circ(cx, cy, 7, '#7a808c'); P.circ(cx, cy, 6, '#dfe6f0');
      for (let k = 0; k < 3; k++) { const a = a0 + k * Math.PI * 2 / 3; for (let r = 1; r <= 5; r++) { const ww = r > 2 ? 1 : 0; P.p(cx + Math.cos(a) * r, cy + Math.sin(a) * r, '#59a8e8'); if (ww) P.p(cx + Math.cos(a + 0.35) * r, cy + Math.sin(a + 0.35) * r, '#8ac8ff'); } }
      for (let k = -6; k <= 6; k += 3) { P.p(cx + k, cy - 6 + Math.abs(k) * 0.3, '#b8bec8'); P.p(cx + k, cy + 6 - Math.abs(k) * 0.3, '#b8bec8'); }
      P.circ(cx, cy, 1.5, '#4a505c'); P.p(cx, cy, '#c8ccd6');
      if (V.fast > 0) { ctx.globalAlpha = 0.6; for (let k = 0; k < 4; k++) { const ly = cy - 5 + k * 3, lx = cx - 10 - ((tt * 50 + k * 7) % 18); P.hl(lx - 4, ly, 4, '#e8f6ff'); } ctx.globalAlpha = 1; }
    } else if (id === 'bday') {
      P.r(x + 6, y - 7, 9, 7, '#ff6ab0'); P.r(x + 6, y - 7, 9, 1, '#ff9ad0'); P.r(x + 9, y - 7, 2, 7, '#ffd23a'); P.r(x + 6, y - 4, 9, 1, '#ffd23a'); P.p(x + 8, y - 9, '#ffd23a'); P.p(x + 11, y - 9, '#ffd23a'); P.p(x + 9, y - 8, '#ffd23a'); P.p(x + 10, y - 8, '#ffd23a'); // a present
      const B = [[-8, -36, '#ff4a5a', '#ff9aa4'], [0, -44, '#ffd23a', '#fff0a0'], [7, -34, '#4a9aff', '#a8d0ff']];
      B.forEach(([dx, dy, c, hl], i) => { if (V.popped === i) return; const bx = x + dx + Math.sin(tt * 1.4 + i * 2) * 1.5, by = y + dy + Math.sin(tt * 1.9 + i) * 1.2; P.line(x - 2, y - 1, bx, by + 7, '#e8e4dc'); P.ell(bx, by, 5, 6, c); P.p(bx - 2, by - 3, hl); P.p(bx - 2, by - 2, hl); P.p(bx - 1, by - 3, hl); P.r(bx - 1, by + 6, 2, 1, c); });
      P.r(x - 4, y - 2, 4, 2, '#d8d4cc'); // the weight the strings are tied to
    }
  }
  function draw(ctx, P, room) { // zal only (from ZAL.dyn, between the window and what stands in front of it)
    const id = cur(); if (!id || room !== 'zal') return; decor(ctx, P, id, SILL[0], SILL[1]);
  }
  const curtainShut = () => { try { return (GAGS.view().curtain || 0) > 0.5; } catch (e) { return false; } };
  function spots(room) { const id = cur(); if (!id || room !== 'zal' || curtainShut()) return null; return { decor: RECT[id].slice() }; }
  function hit(room, x, y) { const sp = spots(room); if (!sp) return null; const r = sp.decor; return x >= r[0] - 2 && x < r[0] + r[2] + 2 && y >= r[1] - 2 && y < r[1] + r[3] + 2 ? () => gag(cur()) : null; }
  function gag(id) { // the event's thing does its own trick
    last = id; AUDIO.play(BY[id].snd);
    if (id === 'halloween') { V.jump = 0.6; V.ghost = 0; HOME.face('wide', 'o', 1.4); setTimeout(() => say('g_boo', 'happy'), 700); }
    else if (id === 'newyear') { V.lights = 2.4; AUDIO.play('star'); for (let i = 0; i < 8; i++) HOME.fx.spawn('spark', SILL[0] + rnd(-9, 9), SILL[1] - rnd(4, 28), { vy: rnd(-20, -6), life: 0.9 }); setTimeout(() => say('g_newyear', 'happy'), 400); }
    else if (id === 'spring') { V.bird = 0; setTimeout(() => AUDIO.play('chirp'), 1300); setTimeout(() => say('g_spring', 'happy'), 900); }
    else if (id === 'summer') { V.fast = 2.2; HOME.face('happy', 'smile', 2); setTimeout(() => say('g_summer', 'happy'), 500); }
    else if (id === 'bday') { V.popped = Math.floor(Math.random() * 3); V.popT = 4; const bx = SILL[0] + [-8, 0, 7][V.popped], by = SILL[1] + [-36, -44, -34][V.popped]; for (let i = 0; i < 16; i++) HOME.fx.spawn('confetti', bx + rnd(-3, 3), by + rnd(-3, 3), { c: pick(CONF), vx: rnd(-50, 50), vy: rnd(-60, 10), g: 140, life: rnd(1, 1.6) }); HOME.face('wide', 'laugh', 1.2); setTimeout(() => say('g_bday', 'happy'), 600); }
  }
  function thumb(id) { // for the growth sheet
    if (!thumb.c) thumb.c = {}; if (thumb.c[id]) return thumb.c[id];
    const c = PX.canvas(36, 54), P = Painter(c.getContext('2d')), v = Object.assign({}, V); resetV(); decor(c.getContext('2d'), P, id, 18, 52, 0.3); Object.assign(V, v);
    return (thumb.c[id] = c.toDataURL());
  }
  function sheet(im) { // «Сезонные события» on the growth tab
    const s = S(), d = s.grow.days || 0, now = cur(), nx = at(d < FIRST ? FIRST : d + left(d)), n = left(d), dn = (k) => `${k} ${k % 10 === 1 && k % 100 !== 11 ? 'день' : k % 10 >= 2 && k % 10 <= 4 && (k % 100 < 12 || k % 100 > 14) ? 'дня' : 'дней'}`;
    return `<div class="hint" style="text-align:left;margin-top:6px"><b>Сезонные события</b> · после первой недели заботы — новое каждые ${WEEK} дней заботы. ${now ? `Сейчас: <b>${BY[now].name}</b>. ` : ''}Следующее — ${BY[nx].name}, через ${dn(n)} заботы.</div>
      <div class="list">${LIST.map((e) => `<div class="li notch ${e.id === now ? 'cur done' : ''}"><img class="px ic" src="${thumb(e.id)}" alt=""><div class="tx"><div class="t1">${e.name}${e.id === now ? ' · сейчас' : e.id === nx ? ` · через ${dn(n)}` : ''}</div><div class="t2">${e.what}</div></div></div>`).join('')}</div>`;
  }
  return { LIST, at, left, check, set, cur, update, sky, draw, spots, hit, gag, sheet, thumb, info: () => ({ id: cur(), gag: last, saved: S().season ? S().season.id : null }), _V: V };
})();
