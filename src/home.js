'use strict';
// ===== Shared monkey sprite cache: LRU + compose budget per frame =====
const SPR = (() => {
  const cache = new Map(), MAX = 160, lastBy = {}; let budget = 1;
  const J = (a) => (a ? a.join(',') : '');
  function key(p) {
    const e = p.eyes || {}, c = p.cloth || {};
    return `${p.s}|${p.f}|${p.bob || 0}|${p.pose || ''}|${J(p.armL)}|${J(p.armR)}|${p.legs || ''}|${p.tail || 0}|${e.mode || ''}|${J(e.look)}|${J(e.lid)}|${e.noSkuf ? 1 : 0}|${p.mouth || ''}|${p.open || 0}|${c.hat || ''}.${c.glasses || ''}.${c.top || ''}.${c.bottom || ''}.${c.neck || ''}.${c.feet || ''}|${p.dirt || 0}|${p.blush ? 1 : 0}${p.tear ? 1 : 0}${p.sweat ? 1 : 0}|${p.t || 0}|${p.noStubble ? 1 : 0}|${p.age === undefined ? 1 : p.age}|${p.hx || 0}|${p.back ? 1 : 0}`;
  }
  function get(p, ch = 'main', force) {
    const k = key(p); let e = cache.get(k);
    if (e) { cache.delete(k); cache.set(k, e); return (lastBy[ch] = e); }
    const last = lastBy[ch]; if (budget <= 0 && !force && last && last.s === p.s) return last;
    budget--; e = MONKEY.compose(p); e.key = k; cache.set(k, e); while (cache.size > MAX) cache.delete(cache.keys().next().value);
    return (lastBy[ch] = e);
  }
  function mask(e) { if (!e.mask) { const d = e.cv.getContext('2d').getImageData(0, 0, e.w, e.h).data, m = new Uint8Array(e.w * e.h); for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 0 ? 1 : 0; e.mask = m; } return e.mask; }
  function hit(e, lx, ly) { const x = Math.floor(lx), y = Math.floor(ly); if (!e || x < 0 || y < 0 || x >= e.w || y >= e.h) return false; return mask(e)[y * e.w + x] === 1; }
  return { get, mask, hit, frame() { budget = 1; }, clear() { cache.clear(); } };
})();

// ===== Particles & tiny glyphs (shared) =====
const FX = (() => {
  function glyph(rows, pal, outline = '#3b2433') {
    const h = rows.length, w = rows[0].length, c = PX.canvas(w + 2, h + 2), P = Painter(c.getContext('2d'));
    if (outline) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (rows[j][i] !== '.') for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { const ii = i + dx, jj = j + dy; if (ii < 0 || jj < 0 || ii >= w || jj >= h || rows[jj][ii] === '.') P.p(ii + 1, jj + 1, outline); }
    P.map(1, 1, rows, pal); return c;
  }
  const G = {
    heart: glyph(['.pp.pp.', 'pwppppp', 'ppppppp', '.ppppp.', '..ppp..', '...p...'], { p: '#ff5c8a', w: '#ffd0de' }),
    z: glyph(['zzzzz', '...z.', '..z..', '.z...', 'zzzzz'], { z: '#ffffff' }, '#2c3266'),
    zS: glyph(['zzz', '.z.', 'zzz'], { z: '#ffffff' }, '#2c3266'),
    note: ['#ffd23a', '#7fe0ff', '#ff8ad0'].map((c) => glyph(['..nn.', '..n.n', '..n..', '..n..', 'nnn..', 'nnn..'], { n: c })),
    spark: glyph(['..y..', '..y..', 'yywyy', '..y..', '..y..'], { y: '#ffe066', w: '#ffffff' }, null),
    star: glyph(['..y..', '.ywy.', 'yyyyy', '.yyy.', '.y.y.'], { y: '#ffd23a', w: '#fff6b8' }),
    bub: [2, 3, 4].map((r) => { const c = PX.canvas(2 * r + 3, 2 * r + 3), x = c.getContext('2d'), P = Painter(x); x.globalAlpha = 0.35; P.circ(r + 1.5, r + 1.5, r, '#e8f6ff'); x.globalAlpha = 1; for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2; P.p(r + 1.5 + Math.cos(t) * r - 0.5, r + 1.5 + Math.sin(t) * r - 0.5, '#8ccaf2'); } P.p(r, r - 1, '#ffffff'); return c; }),
  };
  function make() {
    const list = [];
    function spawn(type, x, y, o) { const p = Object.assign({ type, x, y, vx: 0, vy: 0, g: 0, life: 1, age: 0, seed: Math.random() * 10 }, o); list.push(p); if (list.length > 300) list.shift(); return p; }
    function update(dt, onFloor) {
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i]; p.age += dt; if (p.age >= p.life || p.dead) { list.splice(i, 1); continue; }
        p.vy += p.g * dt; if (p.drag) { const d = Math.max(0, 1 - p.drag * dt); p.vx *= d; p.vy *= d; }
        p.x += p.vx * dt + (p.wob ? Math.sin(p.age * p.wob + p.seed) * 0.35 : 0); p.y += p.vy * dt;
        if (p.floor !== undefined && p.y > p.floor) { p.y = p.floor; if (p.type === 'drop') { p.dead = 1; if (onFloor) onFloor(p); continue; } p.vy *= -0.35; p.vx *= 0.6; if (Math.abs(p.vy) < 14) { p.vy = 0; p.g = 0; p.vx *= 0.5; } }
        if (p.hit && p.hit(p)) { p.dead = 1; }
      }
    }
    function draw(ctx, P, layer) {
      for (const p of list) {
        if ((p.layer || 0) !== (layer || 0)) continue;
        const k = p.age / p.life; let a = k > 0.7 ? (1 - k) / 0.3 : 1; if (p.fadeIn && p.age < p.fadeIn) a *= p.age / p.fadeIn; ctx.globalAlpha = Math.max(0, Math.min(1, a * (p.alpha || 1)));
        const x = Math.round(p.x), y = Math.round(p.y);
        switch (p.type) {
          case 'heart': ctx.drawImage(G.heart, x - 4, y - 4); break;
          case 'z': ctx.drawImage(k < 0.3 ? G.zS : G.z, x - 3, y - 3); break;
          case 'note': ctx.drawImage(G.note[p.c || 0], x - 3, y - 4); break;
          case 'spark': if ((Math.floor(p.age * 14 + p.seed) % 3) !== 0) ctx.drawImage(G.spark, x - 2, y - 2); break;
          case 'star': ctx.drawImage(G.star, x - 3, y - 3); break;
          case 'crumb': P.r(x, y, p.sz || 1, p.sz || 1, p.c); break;
          case 'drop': P.p(x, y - 1, '#e8f8ff'); P.p(x, y, p.c || '#6cc0f4'); if (p.long) P.p(x, y - 2, '#bfe6ff'); break;
          case 'bubble': ctx.drawImage(G.bub[p.r || 0], x - (p.r || 0) - 2, y - (p.r || 0) - 2); break;
          case 'confetti': if ((Math.floor(p.age * 9 + p.seed) % 2) === 0) P.r(x, y, 2, 1, p.c); else P.r(x, y, 1, 2, p.c); break;
          case 'puff': P.circ(x, y, (p.r0 || 2) + k * ((p.r1 || 6) - (p.r0 || 2)), p.c || '#ffffff'); break;
          case 'ring': { const r = (p.r0 || 2) + k * ((p.r1 || 10) - (p.r0 || 2)); for (let q = 0; q < 24; q++) { const t = q / 24 * Math.PI * 2; P.p(x + Math.cos(t) * r, y + Math.sin(t) * r * (p.sy || 1), p.c || '#ffffff'); } break; }
          case 'leaf': P.r(x, y, 2, 1, p.c || '#4f9a4a'); P.p(x + 1, y + 1, '#2f6a32'); break;
          case 'img': ctx.drawImage(p.img, Math.round(x - p.img.width / 2), Math.round(y - p.img.height / 2)); break;
          case 'fn': p.fn(ctx, P, p, x, y, k); break; // a one-off drawer (gags: the falling pot lid, a paper plane…)
          case 'cloth': { const fl = p.vy !== 0 && (Math.floor(p.age * 8 + p.seed) % 2); if (fl) { P.r(x - 2, y - 3, 4, 6, p.c); P.r(x - 2, y + 2, 4, 1, p.d); P.r(x + 1, y - 3, 1, 6, p.d); } else { P.r(x - 3, y - 2, 6, 4, p.c); P.r(x - 3, y + 1, 6, 1, p.d); P.r(x - 3, y - 1, 6, 1, p.d); } break; } // a folded shirt / sock tumbling
        }
      }
      ctx.globalAlpha = 1;
    }
    return { list, spawn, update, draw, clear() { list.length = 0; } };
  }
  return { make, G, glyph };
})();

// ===== Home scene: rooms, the plush monkey and all care interactions =====
const HOME = (() => {
  const RW = ROOMS.RW, RH = ROOMS.RH, GY = ROOMS.GROUND, SC = 1.2, MX = 90;
  const rest = { x: MX, y: GY }; // Round 10 #4: where he stands — a tap on the floor sends him there; a new room puts him back in the middle
  const WALK = { x0: 12, x1: 168, y0: 236, y1: 304 };
  const S = () => GAME.S, L = DATA.LINES, IDS = DATA.ROOMS.map((r) => r.id);
  const pick = (a) => a[Math.floor(Math.random() * a.length)], rnd = (a, b) => a + Math.random() * (b - a), q3 = (v) => Math.round(Math.max(0, Math.min(1, v)) * 3) / 3;
  const off = PX.canvas(RW, RH), oc = off.getContext('2d'), P = Painter(oc);
  const snapC = PX.canvas(RW, RH), snapX = snapC.getContext('2d');
  function ensureOffH(h) {
    if (off.height !== h) {
      off.height = h;
      snapC.height = h;
      oc.imageSmoothingEnabled = false;
      snapX.imageSmoothingEnabled = false;
    }
  }
  const topY = () => {
    const curCv = typeof cv !== 'undefined' ? cv : (typeof document !== 'undefined' ? document.getElementById('cv') : null);
    const curH = (curCv && curCv.height) || RH;
    const extraH = Math.max(0, curH - RH);
    return extraH > 0 ? Math.min(42, Math.round(extraH * 0.6)) : 0;
  };
  function drawCeilExt(c, P, room, ty) {
    if (room === 'zal') {
      P.r(0, 0, RW, ty, '#ece7e0');
      ROOMS.dither(P, 0, 0, RW, Math.min(10, ty), '#e0dad2', '#ece7e0', 0.5);
      if (ty >= 14) {
        for (const x of [24, 76, 128, 168]) {
          P.r(x - 2, ty - 18, 5, 2, '#f8f6f2');
          P.p(x, ty - 19, '#c8c0b4');
        }
      }
      P.vl(78 + 22, 0, ty, '#b08c48');
      P.vl(78 + 21, 0, ty, '#8a6a30');
    } else if (room === 'kitchen') {
      P.r(0, 0, RW, ty, '#ece7e0');
      ROOMS.dither(P, 0, 0, RW, Math.min(10, ty), '#e0dad2', '#ece7e0', 0.5);
      if (ty >= 14) {
        for (const x of [30, 90, 150]) {
          P.r(x - 2, ty - 18, 5, 2, '#f8f6f2');
          P.p(x, ty - 19, '#c8c0b4');
        }
      }
    } else if (room === 'bath') {
      P.r(0, 0, RW, ty, '#efebe6');
      ROOMS.dither(P, 0, 0, RW, Math.min(10, ty), '#e0dac8', '#efebe6', 0.4);
    } else if (room === 'hall') {
      P.r(0, 0, RW, ty, '#3e2416');
      for (const [x0, x1] of [[3, 57], [63, 117], [123, 177]]) {
        P.r(x0, 0, x1 - x0, ty, '#5a3420');
        P.r(x0 + 2, 0, x1 - x0 - 4, ty, '#2e1a10');
      }
    } else if (room === 'balcony') {
      P.r(0, 0, RW, ty, '#5a3422');
      for (let x = 0; x < RW; x += 14) {
        P.r(x, 0, 1, ty, '#3e2214');
        P.r(x + 1, 0, 1, ty, '#7a462e');
      }
    }
  }
  function applyCeilAmbient(c, room, lightOn, ty) {
    if (room === 'zal' && !lightOn) {
      c.save();
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = '#3b4078';
      c.fillRect(0, 0, RW, ty);
      c.fillStyle = '#1c1e3a';
      c.fillRect(0, 0, RW, ty);
      c.restore();
      return;
    }
    const ph = ROOMS.phase();
    const amb = { evening: '#fff0dc', night: '#dcd8ee' }[ph];
    if (amb) {
      c.save();
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = amb;
      c.fillRect(0, 0, RW, ty);
      c.restore();
    }
  }
  const fx = FX.make();
  let t = 0, room = 'zal', trans = null, camY = 0, camT = 0, preview = false, tvOn = true, tryCloth = null, flash = 0, tailPh = 0;
  let tool = null, press = null, taps = [], timers = [], foam = [], falling = [], showerSt = null, watering = null, lastSay = 0, hoverPt = null, bubbleOn = false, portraitC = { k: '', url: '' };
  const mic = { on: false, rec: false, pb: null, pbT: 0, quiet: 0 };
  const tree = [false, false, false, false, false];
  const mk = { x: MX, y: GY, jy: 0, vy: 0, act: null, face: null, blinkT: 2.5, blink: 0, look: null, lookUntil: 0, glance: null, glanceT: 3, talk: null, eat: null, scrub: 0, dizzy: 0, sp: null, x0: 0, y0: 0, nextIdle: 5, nextTalk: 18, petCD: 0, tickleCD: 0, zT: 0, snoreT: 1.5, flyT: 3, sleepyCD: 0 };
  const later = (d, fn) => timers.push({ at: t + d, fn });
  const FOODC = { milk: '#ffffff', puree: '#ffb04a', banana: '#f4d03a', apple: '#e8453c', salad: '#6cc24a', porridge: '#efe0b8', watermelon: '#ef5a6a', coffee: '#8a5a32', icecream: '#fff4e2', kvass: '#c08a3a', doshirak: '#f2c14e', pelmeni: '#f4ead0', shawarma: '#d8a060', burger: '#c8803a', cake: '#ff9ab8', energy: '#59c1ff', tea: '#a8d868', potion: '#c77dff' };
  const kgStr = (v) => (Math.round(v * 100) / 100).toString().replace('.', ',');

  // ---------- actions ----------
  const ACTS = {
    wave: { dur: 1.5, pose: (k, p) => { p.pose = 'wave'; p.armR = (Math.floor(k * 8) % 2) ? [27, -80] : [22, -86]; p.eyes.mode = 'happy'; p.mouth = 'smile'; } },
    scratch: { dur: 1.6, pose: (k, p) => { p.pose = 'scratch'; p.armR = (Math.floor(k * 10) % 2) ? [9, -84, 1] : [12, -81, 1]; p.eyes.look = [-1, -1]; p.mouth = 'flat'; } },
    think: { dur: 1.9, pose: (k, p) => { p.pose = 'think'; p.eyes.look = [1, -1]; p.mouth = 'flat'; } },
    shrug: { dur: 1.1, pose: (k, p) => { p.pose = k > 0.12 && k < 0.88 ? 'shrug' : 'idle'; p.mouth = 'flat'; } },
    look: { dur: 2.4, pose: (k, p) => { p.eyes.look = k < 0.35 ? [-1, 0] : k < 0.7 ? [1, 0] : [0, 0]; } },
    yawn: { dur: 1.8, start: () => AUDIO.play('yawn'), pose: (k, p) => { p.pose = k > 0.12 && k < 0.88 ? 'up' : 'idle'; p.mouth = 'open'; p.open = q3(Math.sin(k * Math.PI) * 1.2); p.eyes.mode = 'closed'; } },
    belly: { dur: 1.7, pose: (k, p) => { p.pose = 'belly'; const b = Math.floor(k * 8) % 2; p.armL = b ? [-8, -30, 1] : [-10, -26, 1]; p.armR = b ? [10, -26, 1] : [8, -30, 1]; p.eyes.mode = 'happy'; p.mouth = 'smile'; } },
    rub: { dur: 2.4, pose: (k, p) => { p.pose = 'belly'; const b = Math.floor(k * 6) % 2; p.armL = b ? [-9, -31, 1] : [-6, -27, 1]; p.armR = b ? [6, -27, 1] : [9, -31, 1]; p.eyes.mode = 'closed'; p.mouth = 'smile'; } },
    hop: { dur: 0.9, start: () => { hop(150); if (Math.random() < 0.6) AUDIO.play('happy'); }, pose: (k, p) => { if (mk.jy < -2) { p.pose = 'up'; p.legs = 'tuck'; } p.eyes.mode = 'happy'; p.mouth = 'laugh'; } },
    // Round 9 #3: on the rug — his own jig: a giggle and a little tune, hops from foot to foot, brown fluff off the rug on every landing,
    // notes popping just over HIS head (by his height), «та-да» with both arms up at the end
    jig: { dur: 3.3, fast: 1, start: (a) => { a.beat = -1; a.air = false; AUDIO.play('giggle'); AUDIO.play('jig'); },
      tick: (a) => {
        const b = Math.floor(a.t * 3.6), R = ZAL.RUG, pal = ZAL.RUG_PAL;
        if (b !== a.beat && a.t < 2.9) { a.beat = b; if (b % 2 === 0) hop(110); fx.spawn('note', mk.x + rnd(-12, 12), headTop() - rnd(6, 18), { vy: -18, vx: rnd(-10, 10), life: 1.1, wob: 4, c: b % 3 }); }
        if (mk.jy < -1) a.air = true; else if (a.air) { a.air = false; for (let i = 0; i < 3; i++) fx.spawn('puff', Math.max(R[0] + 6, Math.min(R[0] + R[2] - 6, mk.x + rnd(-10, 10))), Math.min(R[1] + R[3] - 6, mk.y + rnd(-3, 3)), { vx: rnd(-18, 18), vy: rnd(-14, -4), life: 0.6, r0: 1, r1: 3, c: pal[4 + (i % 3)] }); }
      },
      end: () => AUDIO.play('tada'),
      pose: (k, p, a) => { if (a.t >= 2.9) { p.pose = 'up'; p.legs = 'stand'; } else { const b = Math.max(0, a.beat) % 4; p.pose = b % 2 ? 'hips' : 'shrug'; p.legs = b % 2 ? 'spread' : 'stand'; p.hx = b === 1 ? 2 : b === 3 ? -2 : 0; } p.eyes.mode = 'happy'; p.mouth = 'laugh'; } },
    dance: { dur: 3.4, fast: 1, start: (a) => { a.beat = -1; if (!a.noMoment && (!FRIENDS.partyKind || FRIENDS.partyKind() !== 'dasha')) ALBUM.moment('dance', { title: 'Первый танец', delay: 1.3, room }); }, tick: (a) => { const b = Math.floor(a.t * 3.5); if (b !== a.beat) { a.beat = b; if (b % 2 === 0) hop(95); fx.spawn('note', mk.x + rnd(-26, 26), mk.y - rnd(70, 100), { vy: -16, life: 1.3, wob: 4, c: b % 3 }); } }, pose: (k, p, a) => { const b = Math.max(0, a.beat) % 4; p.pose = ['up', 'hips', 'shrug', 'hips'][b]; p.legs = b % 2 ? 'spread' : 'stand'; p.eyes.mode = 'happy'; p.mouth = 'laugh'; } },
    stretch: { dur: 1.9, start: () => AUDIO.play('yawn'), pose: (k, p) => { p.pose = k < 0.8 ? 'up' : 'idle'; p.mouth = 'open'; p.open = q3(Math.sin(k * Math.PI) * 1.2); p.eyes.mode = 'closed'; } },
    shy: { dur: 1.2, pose: (k, p) => { p.pose = 'cover'; p.eyes.mode = 'closed'; p.mouth = 'smile'; p.blush = 1; } },
    massage: {
      dur: 4.5,
      keep: true,
      start: () => { face('happy', 'smile', 4.5, { blush: 1 }); },
      pose: (k, p) => {
        p.pose = 'belly';
        p.legs = 'tuck';
        p.eyes = { mode: 'happy' };
        p.mouth = 'smile';
        p.blush = 1;
        p.hx = Math.sin(k * Math.PI * 6) * 1.5;
      }
    },
    sad: { dur: 1.9, pose: (k, p) => { p.mouth = 'frown'; p.eyes.look = [0, 1]; p.tear = 1; } },
    shake: { dur: 0.9, wig: 2, start: () => { AUDIO.play('splash'); for (let i = 0; i < 26; i++) { const a = rnd(0, Math.PI * 2); fx.spawn('drop', mk.x + Math.cos(a) * 16, mk.y - 50 + Math.sin(a) * 26, { vx: Math.cos(a) * rnd(50, 110), vy: Math.sin(a) * 60 - 50, g: 380, life: 1, floor: GY + rnd(-6, 4) }); } }, pose: (k, p) => { p.eyes.mode = 'closed'; p.mouth = 'wavy'; p.pose = (Math.floor(k * 12) % 2) ? 'shrug' : 'idle'; } },
    tickle: { dur: 0.9, wig: 1, pose: (k, p) => { p.pose = 'belly'; p.eyes.mode = 'happy'; p.mouth = 'laugh'; p.blush = 1; } },
    pose: { dur: 1.4, start: (a) => { a.v = pick(['wave', 'hips', 'up', 'shrug', 'belly']); }, pose: (k, p, a) => { p.pose = a.v; p.eyes.mode = a.v === 'belly' ? 'happy' : 'open'; p.mouth = 'laugh'; } },
    tv: { dur: 3.2, pose: (k, p) => { p.eyes.look = [1, 0]; p.mouth = k > 0.5 && k < 0.7 ? 'laugh' : 'o'; } },
    mirror: { dur: 1.6, pose: (k, p) => { p.pose = 'hips'; p.eyes.look = [1, -1]; p.mouth = 'smile'; p.blush = 1; } },
    wow: { dur: 1.2, pose: (k, p) => { p.pose = 'up'; p.eyes.mode = 'wide'; p.mouth = 'laugh'; } },
    whine: { dur: 1.5, pose: (k, p) => { p.hx = k < 0.84 ? (Math.floor(k * 5.2) % 2 ? 3 : -3) : 0; p.eyes.mode = 'closed'; p.mouth = 'open'; p.open = 1; p.tear = 1; p.blush = 1; p.pose = k < 0.84 ? 'shrug' : 'idle'; } },
    // Round 14: morning exercise on the balcony — jumping jacks (arms up, legs apart, a little hop on every other beat), then side bends; he counts
    exercise: { dur: 6.4, fast: 1, start: (a) => { a.b = -1; if (L.rt_ex) say(pick(L.rt_ex), 'happy'); }, tick: (a) => { const b = Math.floor(a.t / 0.4); if (b !== a.b) { a.b = b; if (a.t < 3.2 && b % 2 === 0) { hop(85); AUDIO.play('step'); } } },
      pose: (k, p) => { const tt = k * 6.4, b = Math.floor(tt / 0.4) % 2; p.eyes.mode = b ? 'open' : 'happy'; if (!mk.talk) p.mouth = 'smile';
        if (tt < 3.2) { if (!b) { p.pose = 'up'; p.legs = 'spread'; } } else { p.pose = 'up'; p.armL = b ? [-15, -98] : [-27, -46]; p.armR = b ? [27, -46] : [15, -98]; p.hx = b ? -2 : 2; } } },
  };
  function act(name, o) { const def = ACTS[name]; if (!def) return; if (mk.act && mk.act.keep && !(o && o.keep)) return; mk.act = Object.assign({ name, def, t: 0, dur: def.dur }, o); if (def.start) def.start(mk.act); }
  function face(eyes, mouth, dur, o = {}) { mk.face = Object.assign({ eyes, mouth, until: t + dur }, o); }
  function hop(v) { if (mk.jy >= 0) mk.vy = -v * (1 - 0.25 * GAME.fat()); }

  // ---------- room management ----------
  const CEIL_COLS = {
    zal: '#eee6d8',
    kitchen: '#ece7e0',
    hall: '#42281a',
    bath: '#e8e4de',
    balcony: () => {
      const ph = (typeof ROOMS !== 'undefined' && ROOMS.phase) ? ROOMS.phase() : 'day';
      return ph === 'night' ? '#181828' : ph === 'evening' ? '#e89078' : '#9ed2ea';
    }
  };
  function updateCeilColor(r) {
    const c = CEIL_COLS[r || room];
    const col = typeof c === 'function' ? c() : (c || '#ece7e0');
    document.documentElement.style.setProperty('--ceil-bg', col);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', col);
  }
  function init() {
    const s = S(); room = IDS.includes(s.room) ? s.room : 'zal';
    if (s.sleeping && room !== 'zal') { s.sleeping = false; s.light = true; }
    if (room === 'zal' && !s.light) s.sleeping = true;
    syncTree(true); UI.setBar(room); updateCeilColor(room);
  }
  function setRoom(r, instant) {
    if (r === room) return; const s = S(); GAGS.leave(room); rest.x = MX; rest.y = GY; if (trip && trip.kind === 'walk') trip = null;
    if (th.radio) { th.radio = null; AUDIO.stop('radio'); } // the radio is switched off when he leaves
    if (mk.act && mk.act.name === 'jig') { mk.act = null; AUDIO.stop('jig'); for (const q of fx.list) if (q.type === 'note') q.dead = 1; fx.list.splice(0, fx.list.length, ...fx.list.filter((q) => !q.dead)); } // Round 12 #1: the dance (and its tune) stays in the zal
    if (room === 'zal' && s.sleeping) wakeUp(false, true);
    if (mic.on) micStop();
    if (showerSt) { showerSt = null; AUDIO.stop('shower'); for (const q of fx.list) if (q.type === 'drop' || q.type === 'puff') q.dead = 1; fx.list.splice(0, fx.list.length, ...fx.list.filter((q) => !q.dead)); }
    cancelTool(); trip = null; chairDx = 0; chairMv = false; room = r; s.room = r; press = null; falling = []; watering = null;
    if (r === 'zal' && !s.light) { s.light = true; }
    if (r === 'balcony') syncTree(true);
    UI.setBar(r); updateCeilColor(r); if (!instant) UI.showRoomTitle(DATA.ROOMS.find((x) => x.id === r).name); GAME.save();
    mk.nextIdle = Math.min(mk.nextIdle, rnd(1, 3));
    DUCKS.moved(); // Round 9 #12: the duck parade shuffles on while he changes rooms
  }
  function go(d) {
    if (trans || APP.scene !== 'home' || DASHA.busy()) return; const i = IDS.indexOf(room); const r = IDS[(i + d + IDS.length) % IDS.length];
    snapX.clearRect(0, 0, RW, off.height); snapX.drawImage(off, 0, 0); trans = { dir: d, t: 0, dur: 0.3 }; AUDIO.play('whoosh'); setRoom(r);
  }
  function goTo(r, instant) { if (r === room || !IDS.includes(r)) return; if (instant) setRoom(r, true); else { const d = (IDS.indexOf(r) > IDS.indexOf(room)) ? 1 : -1; snapX.clearRect(0, 0, RW, off.height); snapX.drawImage(off, 0, 0); trans = { dir: d, t: 0, dur: 0.3 }; setRoom(r); } }

  // ---------- compose params ----------
  function clothes() {
    const w = Object.assign({}, S().wear);
    if (tryCloth && DATA.CLOTHES[tryCloth]) w[DATA.CLOTHES[tryCloth].slot] = tryCloth;
    const isParty = typeof FRIENDS !== 'undefined' && FRIENDS.partyOn && FRIENDS.partyOn();
    const isBdayGreeting = typeof DASHA !== 'undefined' && DASHA.isGreeting && DASHA.isGreeting();
    if (isParty || isBdayGreeting) {
      w.hat = 'bday_hat';
    }
    if (S().sleeping) w.hat = 'nightcap';
    return w;
  }
  function params() {
    const s = S(), st = s.st; const f = Math.round(GAME.fat() * 50) / 50;
    const ag = GAME.ageDef(); const p = { s: ag.s, age: ag.age, f, cloth: clothes(), pose: 'idle', legs: 'stand', eyes: { mode: 'open' }, mouth: 'smile', open: 0 };
    p.tail = (Math.floor(tailPh / (Math.PI / 4)) % 8) * (Math.PI / 4);
    p.bob = s.sleeping ? (Math.sin(t * 1.4) > 0 ? 1 : 0) : (Math.sin(t * 2.3) > 0.45 ? 1 : 0);
    p.dirt = st.clean < 65 ? Math.min(1, Math.ceil((65 - st.clean) / 65 * 4) / 4) : 0;
    const low = Math.min(st.food, st.fun, st.energy, st.clean);
    if (low < 30) p.mouth = 'flat'; if (low < 14) { p.mouth = 'frown'; if (st.fun < 14 || st.food < 14) p.tear = 1; }
    if (st.energy < 25) p.eyes.lid = [-0.05, 0];
    if (GAME.mood() > 82 && low > 50) p.blush = 1;
    const look = (mk.look && t < mk.lookUntil) ? mk.look : mk.glance; if (look) p.eyes.look = look;
    if (mk.act && mk.act.def.pose) mk.act.def.pose(Math.min(1, mk.act.t / mk.act.dur), p, mk.act);
    if (mk.talk) { if (mk.talk.env) { const e = mk.talk.env(mk.talk.t); p.mouth = e > 0.18 ? 'talk' : 'smile'; p.open = e > 0.18 ? Math.max(1 / 3, q3(e)) : 0; } else { p.mouth = 'talk'; p.open = [0.34, 0.67, 1, 0.67, 0.34, 0][Math.floor(mk.talk.t * 13) % 6]; if (p.open === 0) p.mouth = 'smile'; } }
    if (mk.face) { if (mk.face.eyes) p.eyes.mode = mk.face.eyes; if (mk.face.mouth) { p.mouth = mk.face.mouth; p.open = mk.face.open || 0; } if (mk.face.blush) p.blush = 1; if (mk.face.pose) p.pose = mk.face.pose; if (mk.face.lid) p.eyes.lid = mk.face.lid; }
    if (tool && tool.kind === 'food' && !tool.back) { if (tool.near > 0.05) { p.mouth = 'open'; p.open = q3(tool.near * 1.15); p.eyes.mode = tool.near > 0.6 ? 'wide' : 'open'; p.eyes.lid = null; } }
    if (mk.scrub > t) { p.eyes.mode = 'happy'; p.mouth = 'laugh'; p.blush = 1; }
    if (showerSt) { p.eyes.mode = 'closed'; p.mouth = (showerSt.t % 1.4) < 0.8 ? 'smile' : 'o'; p.pose = (showerSt.t % 1.4) < 0.7 ? 'scratch' : 'idle'; }
    if (mk.eat) { const k = mk.eat.t; p.mouth = (Math.floor(k * 8) % 2) ? 'chew' : 'open'; p.open = 0.34; p.eyes.mode = mk.eat.yuck ? 'closed' : 'happy'; if (k < 0.35) p.pose = 'eat'; }
    if (mic.on) { if (mic.pb) { const e = mic.pb.env(mic.pbT); p.mouth = e > 0.12 ? 'talk' : 'smile'; p.open = q3(e); p.eyes.mode = 'open'; p.pose = 'idle'; } else if (mic.rec) { p.pose = 'ear'; p.eyes.look = [1, 0]; p.eyes.mode = 'open'; p.mouth = 'o'; } else { p.eyes.look = [0, 0]; } }
    if (mk.dizzy > 0) { p.eyes.mode = 'dizzy'; p.mouth = 'wavy'; p.pose = 'idle'; }
    if (s.sleeping) { p.eyes = { mode: 'sleep' }; p.mouth = (mk.snoreT > 2.4) ? 'o' : 'flat'; p.pose = 'idle'; p.legs = room === 'zal' ? 'hidden' : 'stand'; if (room === 'zal') p.tail = -1; p.blush = 0; p.tear = 0; if (mk.face && t < mk.face.until && mk.face.poke) { p.eyes = { mode: 'open', lid: [0.15, 0] }; p.mouth = 'wavy'; } }
    if (mk.blink > 0 && (p.eyes.mode === 'open' || p.eyes.mode === 'wide')) p.eyes.mode = 'closed';
    if (trip) tripPose(p);
    else if (phoneOn()) { p.pose = 'hold'; p.armL = null; p.armR = null; p.eyes.look = [0, 1]; if (!mk.talk) p.mouth = 'smile'; }
    return p;
  }

  // ---------- update ----------
  function busy(lax) { const s = S(); return !!(trip || (mk.act && !(lax && mk.act.filler)) || mk.talk || mk.eat || tool || showerSt || mic.on || s.sleeping || mk.dizzy > 0 || preview || trans || UI.sheetOpen || UI.hasModal() || FRIENDS.busy()); }
  let movedT = -9, lastMX = 0, lastMY = 0;
  function update(dt) {
    t += dt; const s = S(); const ag = GAME.ageDef();
    { const x = trip && trip.mx !== undefined ? trip.mx : mk.x, y = trip && trip.my !== undefined ? trip.my : mk.y; if (x !== lastMX || y !== lastMY) { movedT = t; lastMX = x; lastMY = y; } } // Round 20: he walks → lively()
    AUDIO.setRate(ag.voice * (GAME.isSkuf() ? 0.92 : 1));
    if (ag.legend && !s.sleeping && room !== 'zal' && Math.random() < dt * 0.6) fx.spawn('spark', mk.x + rnd(-26, 26), mk.y - rnd(20, 110), { life: 0.7, vy: -6 });
    for (let i = timers.length - 1; i >= 0; i--) if (t >= timers[i].at) { const f = timers[i].fn; timers.splice(i, 1); try { f(); } catch (e) { console.error(e); } }
    if (trans) { trans.t += dt; if (trans.t >= trans.dur) trans = null; }
    const target = preview ? Math.max(0, (UI.sheetKind === 'shop' && UI.sheetTab === 'home' ? 62 : 126) - APP.lay.cb) : 0; camY += (target - camY) * Math.min(1, dt * 10); if (Math.abs(target - camY) < 0.6) camY = target; camT = target;
    if (mk.jy < 0 || mk.vy !== 0) { mk.vy += 900 * dt; mk.jy += mk.vy * dt; if (mk.jy >= 0) { mk.jy = 0; mk.vy = 0; } }
    tailPh += dt * ((mk.act && mk.act.def.fast) ? 6 : s.sleeping ? 0.6 : GAME.mood() > 70 ? 2.4 : 1.4);
    mk.blinkT -= dt; if (mk.blinkT <= 0) { mk.blink = 0.13; mk.blinkT = rnd(2.2, 5.5); if (Math.random() < 0.18) later(0.28, () => { mk.blink = 0.12; }); } if (mk.blink > 0) mk.blink -= dt;
    mk.glanceT -= dt; if (mk.glanceT <= 0) { mk.glance = Math.random() < 0.5 ? null : [pick([-1, 0, 1]), pick([-1, 0, 0, 1])]; mk.glanceT = rnd(1.4, 4); }
    if (hoverPt && t - hoverPt.t < 1.2) lookAt(hoverPt.x, hoverPt.y, 0.3);
    if (mk.act) { const a = mk.act; a.t += dt; if (a.def.tick) a.def.tick(a, dt); if (a.t >= a.dur) { mk.act = null; if (a.def.end) a.def.end(a); if (a.then) a.then(); } }
    if (mk.face && t > mk.face.until) mk.face = null;
    if (mk.talk) { mk.talk.t += dt; if (mk.talk.t >= mk.talk.dur) mk.talk = null; }
    if (mk.eat) eatTick(dt);
    if (mk.dizzy > 0) mk.dizzy -= dt;
    if (s.sleeping) sleepTick(dt);
    if (trip) tripTick(dt);
    if (stool !== 'home' && !(trip && trip.stool)) stool = 'home'; // a cancelled trip: it is back by the sofa
    chairTick(dt);
    if (trip) { mk.x = trip.mx; mk.y = trip.my; }
    else { const inBed = s.sleeping && room === 'zal', sl = inBed && (ROOMS.spots('zal', s.home.items) || {}).sleep; mk.x = inBed ? (sl ? sl[0] : 40) : rest.x; mk.y = inBed ? (sl ? sl[1] : 236) : rest.y; }
    if (showerSt) showerTick(dt);
    if (mic.on) micTick(dt);
    if (tool) toolTick(dt);
    thingsTick(dt);
    if (watering) {
      watering.t += dt;
      const s = Math.min(4, Math.max(0, (watering.stg !== undefined ? watering.stg : (typeof GAME !== 'undefined' && GAME.treeStage ? GAME.treeStage() : 4)) | 0));
      const TREE_Y = [140, 118, 96, 74, 54];
      const cy = TREE_Y[s] - 10, cx = 62;
      const spoutX = cx - 14, spoutY = cy + 6;
      if (watering.t > 0.25 && watering.t < 1.85 && Math.random() < dt * 34) {
        const splashSoil = Math.random() < 0.35;
        fx.spawn('drop', spoutX + rnd(-2, 2), spoutY, {
          vx: rnd(-16, -2), vy: rnd(25, 50), g: 360, life: 1.2,
          floor: splashSoil ? 236 + rnd(-2, 4) : TREE_Y[s] + 16 + rnd(0, 30)
        });
      }
      if (watering.t > 2.3) watering = null;
    }
    for (const b of foam) if (b.k < 1) b.k = Math.min(1, b.k + dt * 7);
    if (room === 'balcony') { syncTree(); fallTick(dt); }
    if (press && press.fr && press.fr.kind === 'pillow' && !press.held && press.moved < 12 && t - press.t > 0.45) { press.held = true; FRIENDS.hold(press.fr.id); }
    FRIENDS.update(dt); GAGS.update(dt); if (typeof ALBUM !== 'undefined') ALBUM.update(dt); DUCKS.update(dt); SEASONS.update(dt); if (typeof ROUTINE !== 'undefined' && APP.scene === 'home') ROUTINE.tick(dt);
    if (trip && trip.ride) { const o = GAGS.view().vac; trip.mx = o.x; trip.my = o.y - VAC_TOP; trip.shY = null; if (o.dx) trip.dir = o.dx; mk.x = trip.mx; mk.y = trip.my; } // stays on top of the vacuum
    if (!busy() && APP.scene === 'home') {
      mk.nextIdle -= dt; if (mk.nextIdle <= 0) { idleAct(); mk.nextIdle = rnd(4.5, 9); }
      mk.nextTalk -= dt; if (mk.nextTalk <= 0) { if (!FRIENDS.busy()) idleTalk(); mk.nextTalk = rnd(22, 40); } // not over a friend's scene
    }
    if (s.st.clean < 30 && !showerSt) { mk.flyT -= dt; if (mk.flyT <= 0) { mk.flyT = rnd(4, 8); AUDIO.play('fly'); } }
    fx.update(dt, (p) => { if (p.type === 'drop' && Math.random() < 0.5) fx.spawn('crumb', p.x, p.y, { c: '#bfe6ff', vx: rnd(-20, 20), vy: rnd(-30, -10), g: 300, life: 0.25 }); });
    if (flash > 0) flash = Math.max(0, flash - dt * 3);
    positionUI();
  }
  function idleAct() {
    const s = S(), st = s.st, f = GAME.fat(); const skuf = f >= 0.72;
    const W = [['look', 3], ['wave', 1.1], ['scratch', 1.4], ['think', 0.9], ['shrug', 0.6], ['hop', st.fun > 60 ? 1.1 : 0.2], ['dance', st.fun > 70 && st.energy > 45 ? 0.8 : 0], ['belly', f > 0.3 ? 2 : 0.5], ['rub', skuf ? 2.2 : 0], ['yawn', st.energy < 40 ? 3 : 0.35], ['sad', (st.food < 20 || st.fun < 20) ? 2.5 : 0], ['tv', room === 'living' && tvOn ? 1.4 : 0]];
    let sum = 0; for (const w of W) sum += w[1]; let r = Math.random() * sum; for (const [n, w] of W) { r -= w; if (r <= 0) { act(n, { filler: 1 }); return; } } // Round 17: a fidget — «живёт сам» may drop it
  }
  function dropFiller() { if (mk.act && mk.act.filler) mk.act = null; }
  function idleTalk() {
    const s = S(), st = s.st; let pool = L.idle;
    if (s.want && Math.random() < 0.5) { say(wantLine(s.want)); return; }
    if (st.food < 25) pool = L.hungry; else if (st.energy < 20) pool = L.tired; else if (st.clean < 25) pool = L.dirty; else if (st.fun < 25) pool = L.bored;
    else if (GAME.isSkuf() && !GAME.ageDef().babble && Math.random() < 0.65) pool = L.skuf;
    else if (GAME.ageDef().babble && Math.random() < 0.55) { whine(); return; }
    else if (GAME.ageDef().lines && Math.random() < 0.6) pool = L[GAME.ageDef().lines];
    else if (Math.random() < 0.35) return;
    say(pick(pool));
  }
  function wantLine(w) { if (w.type === 'food') { const f = DATA.FOODS[w.id]; return 'Хочу ' + (f.acc || f.name.toLowerCase()) + '!'; } return { play: 'Давай поиграем в игру!', pet: 'Погладь меня по голове!', wash: 'Хочу в душ ш мыльной пеной!', harvest: 'Шорви мне банан ш дерева!', tickle: 'Пощекочи мне пузико!' }[w.type] || 'Хочу кое-что!'; }
  const lisp = (s) => String(s).replace(/с/g, 'ш').replace(/С/g, 'Ш');
  function say(text, mood) {
    if (APP.scene !== 'home' && APP.scene !== 'boot') return; lastSay = t;
    text = lisp(text);
    if (!mood && S().st.energy < 20) mood = 'tired';
    const r = AUDIO.say(text, { mood }); let dur = (r && r.dur) || 0; if (!dur) dur = Math.min(2.2, 0.35 + text.length * 0.045);
    if (!S().sleeping) mk.talk = { t: 0, dur: Math.max(0.45, dur), env: r && r.env };
    const ty = topY();
    UI.bubble(text, mk.x, headTop() + ty - 12 - camY, Math.max(2300, dur * 1000 + 1400)); bubbleOn = true;
    if (mood === 'happy') face('happy', null, Math.max(0.8, dur));
    return dur;
  }
  // Кроха and Малыш don't talk yet: a whiny «Э-э-э-э-э!» (synth cry, no voice clip) and the head shaking
  function whine(o) {
    if ((APP.scene !== 'home' && APP.scene !== 'boot') || S().sleeping) return; lastSay = t;
    if (mk.talk) { mk.talk = null; AUDIO.hush(); } mk.face = null; // a whine cuts in: he stops talking, the cry is on his face (r22: the long hello after the gift)
    const ty = topY();
    AUDIO.play('whine'); if (!o || !o.noAct) act('whine'); UI.bubble('Э-э-э-э-э!', mk.x, headTop() + ty - 12 - camY, 1900); bubbleOn = true;
  }
  function headTop() { const sp = mk.sp; let y = mk.y + mk.jy + (sp ? sp.head.y - sp.head.ry : -100); const h = clothes().hat; if (h === 'tophat') y -= 14; else if (h === 'cowboy' || h === 'crown' || h === 'propeller') y -= 8; else if (h) y -= 3; return y; }
  function mouthPos() { const sp = mk.sp; return { x: mk.x, y: mk.y + mk.jy + (sp ? sp.mouth.y : -67) + 1 }; }
  function lookAt(x, y, dur) { const sp = mk.sp; const hy = mk.y + (sp ? sp.head.y : -80); const dx = x - mk.x, dy = y - hy; mk.look = [Math.abs(dx) < 10 ? 0 : Math.sign(dx), dy > 14 ? 1 : dy < -22 ? -1 : 0]; mk.lookUntil = t + dur; }
  function positionUI() {
    const s = S(), home = APP.scene === 'home';
    const ty = topY();
    if (bubbleOn) bubbleOn = UI.bubbleTick(mk.x, headTop() + ty - 12 - camY);
    const showWant = home && s.want && !preview && !UI.sheetOpen && camY < 1 && !s.sleeping;
    if (!showWant) { UI.want(null); return; } const w = wantSpot(); UI.want(s.want, w[0], w[1] + ty, w[2]);
  }
  // Round 14b (user: «снова перекрывает потребность текстуру друга»): the want bubble (24×22 + its 5-px tail) goes beside his head —
  // right, left, or higher up on either side — wherever no friend is drawn; the side it had stays while it is still free
  let wantSide = 0;
  function wantSpot() {
    const ht = headTop(), W = 24, H = 27, C = [[mk.x + 24, ht - 8, 0], [mk.x - 48, ht - 8, 1], [mk.x + 24, ht - 36, 0], [mk.x - 48, ht - 36, 1], [mk.x - 12, ht - 40, 2], [mk.x + 40, ht - 8, 0], [mk.x - 64, ht - 8, 1]];
    const fr = FRIENDS.boxes ? FRIENDS.boxes() : [], free = (c) => c[0] >= 1 && c[0] + W <= RW - 1 && c[1] >= 34 && !fr.some((b) => Math.min(c[0] + W, b[2]) - Math.max(c[0], b[0]) > 0 && Math.min(c[1] + H, b[3]) - Math.max(c[1], b[1]) > 0);
    const keep = C[wantSide]; if (keep && free(keep)) return keep;
    const i = C.findIndex(free); wantSide = i < 0 ? 0 : i; return C[wantSide];
  }

  // ---------- render ----------
  function render(ctx) {
    renderScene();
    ctx.imageSmoothingEnabled = false;
    const curCv = typeof cv !== 'undefined' ? cv : (typeof document !== 'undefined' ? document.getElementById('cv') : null);
    const curH = (curCv && curCv.height) || RH;
    if (trans) {
      const k = trans.t / trans.dur, e = 1 - Math.pow(1 - Math.min(1, k), 3), d = trans.dir;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, RW, curH);
      ctx.drawImage(snapC, Math.round(-d * e * RW), 0);
      ctx.drawImage(off, Math.round(d * (1 - e) * RW), 0);
    } else {
      const cy = Math.round(camY);
      if (cy) {
        ctx.fillStyle = '#1d1622';
        ctx.fillRect(0, curH - cy, RW, cy);
      }
      ctx.drawImage(off, 0, -cy);
    }
    if (flash > 0) {
      ctx.globalAlpha = Math.min(1, flash);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, RW, curH);
      ctx.globalAlpha = 1;
    }
  }
  // Round 6 D: what the hall mirror catches of him — his pose composed at 0.6 size; he shows up once he is left of the middle
  function mirrorMe(pp, sp) {
    const k = trip && trip.kind === 'mirror' ? 1 : Math.max(0, Math.min(1, (MX - mk.x) / 4)); if (!k || trans) return null;
    const e = SPR.get(Object.assign({}, pp, { s: Math.round(pp.s * 0.6 * 100) / 100 }), 'mirror');
    return { e, x: mk.x, jy: mk.jy, k, shine: trip && trip.kind === 'mirror' && trip.ph === 'do' ? Math.min(1, (trip.pt || 0) / 0.8) : 0 };
  }
  function renderScene() {
    if (typeof DUCKS !== 'undefined' && DUCKS.startFrame) DUCKS.startFrame();
    const curCv = typeof cv !== 'undefined' ? cv : (typeof document !== 'undefined' ? document.getElementById('cv') : null);
    const curH = (curCv && curCv.height) || RH;
    ensureOffH(curH);
    const ty = topY();
    const s = S(), H = s.home, c = oc; const f = GAME.fat();
    if (ty > 0) {
      drawCeilExt(c, P, room, ty);
    }
    c.save();
    if (ty > 0) c.translate(0, ty);
    const roomH = curH - ty;
    c.drawImage(ROOMS.build(room, H, roomH), 0, 0);
    const pp = params(), sp = mk.sp = SPR.get(pp);
    ROOMS.dyn(c, room, H, t, { me: room === 'hall' ? mirrorMe(pp, sp) : null, tvOn, light: s.light, treeSlots: tree, front: GAGS.front(), g: GAGS.view(), lamp: kitchenLamp, sleeping: s.sleeping, th, balLamp: balLampOn(), radio: !!th.radio, guitar: guitarCase(), bagDx: bagDx(), sbOn: sbOn(), tvGame: tvGame(), con: trip && trip.con, sconces: th.sconces, fridge: trip && trip.kind === 'fridge' ? trip.door : 0, chairDx });
    if (room === 'balcony') drawYardBack(c);
    DASHA.draw(c, P, 'back'); // Round 22: her birthday decor in the zal, the hidden hearts
    FRIENDS.render(c, P, 'back');
    if (typeof DUCKS !== 'undefined' && DUCKS.render) DUCKS.render(c, P, (d) => d.y <= mk.y);
    GAGS.draw(c, P, 'mid');
    if (trip && trip.kind === 'guitar') drawGuitar(c, null, 0, 0, false);
    drawStool(c, false);
    let dx = 0; if (mk.act && mk.act.def.wig) dx = Math.round(Math.sin(t * 38) * mk.act.def.wig); if (mk.dizzy > 0) dx = Math.round(Math.sin(t * 5) * 2);
    if (trip && trip.ph === 'do' && trip.kind !== 'pc' && trip.kind !== 'stove' && trip.kind !== 'mirror' && trip.kind !== 'guitar' && trip.kind !== 'console') dx = Math.round(Math.sin(t * 22)); // rummaging
    const inBed = s.sleeping && room === 'zal'; const sk = Math.max(0.45, 1 + mk.jy / 90), shY = inBed ? null : trip ? trip.shY : mk.y; mk.shY = shY; // Round 11 #1: standing anywhere on the floor (walkTo) the shadow is under his feet, not at the middle line GY
    const hid = DASHA.hideMk(); // Round 22: still inside the gift box
    if (!inBed && shY !== null && !hid) { const ks = sp.s / 1.2; const rx = (20 + 13 * f) * sk * ks, ry = 4.2 * sk * Math.sqrt(ks); P.shadow(mk.x, shY + 1, rx, ry, 0.2); P.shadow(mk.x, shY + 1, rx * 0.66, ry * 0.7, 0.2); /* two-tone contact shadow: grounded, still soft */ }
    const x0 = Math.round(mk.x - sp.ox + dx), y0 = Math.round(mk.y + mk.jy - sp.oy); mk.x0 = x0; mk.y0 = y0;
    if (!hid) c.drawImage(sp.cv, x0, y0);
    drawStool(c, true);
    if (room === 'zal' && GAGS.view().knob && GAGS.view().knob.st === 'held') { const hr = sp.handR || sp.handL; ZAL.knobUp(P, Math.round(mk.x + dx + (hr ? hr.x : 6)) - 2, Math.round(mk.y + mk.jy + (hr ? hr.y : -30)) - 4, ZAL.KBROWN); } // Round 10 #5: the knob in his hand (Round 11 #2: brown)
    if (phoneOn()) drawPhone(c, sp);
    if (trip && trip.kind === 'console' && (trip.ph === 'do' || trip.ph === 'wait')) drawPad(c, sp);
    if (trip && trip.kind === 'guitar') drawGuitar(c, sp, x0, y0, true);
    if (foam.length) drawFoam(c, mk.x + dx, mk.y + mk.jy);
    if (showerSt) drawStream(c);
    FRIENDS.render(c, P, 'fur');
    if (inBed) { ROOMS.bedFront(c, H, mk.x); FRIENDS.render(c, P, 'hug'); }
    if (s.st.clean < 20 && !showerSt) drawStink(c);
    ROOMS.front(c, room, H, t, { behind: !!((trip && trip.kind === 'fridge' && !trip.climb && trip.my < 250) || (room === 'kitchen' && FRIENDS.behindTable && FRIENDS.behindTable())), seat: trip && trip.kind === 'pc' ? trip.seat : 0, chairDx, g: GAGS.view() });
    if (typeof DUCKS !== 'undefined' && DUCKS.render) DUCKS.render(c, P);
    ROOMS.ambient(c, room, s.light, roomH);
    if (room === 'zal' && !s.light) ROOMS.night(c, H, t, roomH);
    FRIENDS.render(c, P, 'top'); GAGS.draw(c, P, 'top');
    DASHA.draw(c, P, 'top'); // Round 22: the gift box, her cake and its candlelight
    if (s.st.clean < 30 && !showerSt) drawFlies(c);
    if (mk.dizzy > 0) { const hy = headTop() + 2; for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2.1; c.drawImage(FX.G.star, Math.round(mk.x + Math.cos(a) * 18 - 3), Math.round(hy + Math.sin(a) * 4 - 3)); } }
    fx.draw(c, P, 0);
    if (watering) drawCan(c);
    if (tool) drawTool(c);
    c.restore();
    if (ty > 0) {
      applyCeilAmbient(c, room, s.light, ty);
    }
  }
  function drawStream(c) {
    // translucent water curtain from the shower head down to the monkey + falling streaks
    const sh = showerSt, k = Math.min(1, sh.t / 0.25) * Math.min(1, (sh.dur - 0.25 - sh.t) / 0.3 + 0.0001);
    if (k <= 0) return; const top = ((ROOMS.spots('bath', S().home.items) || {}).head || [90, 122])[1], bot = Math.max(top + 10, headTop() + 6);
    c.save(); c.globalAlpha = 0.16 * k; c.fillStyle = '#bfe6ff';
    c.beginPath(); c.moveTo(80, top); c.lineTo(100, top); c.lineTo(112, bot); c.lineTo(68, bot); c.closePath(); c.fill();
    c.globalAlpha = 0.5 * k;
    for (let i = 0; i < 9; i++) {
      const u = (i + 0.5) / 9, x0 = 80 + u * 20, x1 = 68 + u * 44, len = 7 + (i * 5) % 6, sp = 150 + (i * 37) % 60;
      for (let j = 0; j < 3; j++) {
        const ph = ((t * sp / (bot - top) + i * 0.37 + j / 3) % 1), y = top + ph * (bot - top), x = Math.round(x0 + (x1 - x0) * ph);
        c.fillStyle = j % 2 ? '#e8f8ff' : '#8fd0f8'; c.fillRect(x, Math.round(y), 1, Math.min(len, bot - y));
      }
    }
    c.restore();
  }
  function drawFoam(c, ox, oy) {
    for (const b of foam) { const r = b.r * b.k, x = ox + b.x, y = oy + b.y; P.circ(x, y, r + 1, '#9cc6e4'); P.circ(x, y, r, '#eef8ff'); if (r > 2) P.circ(x - 0.6, y - 0.6, r - 1.2, '#ffffff'); }
    for (const b of foam) { if (b.r > 3 && b.k >= 1) P.p(ox + b.x - 1, oy + b.y - 2, '#ffffff'); }
  }
  function drawStink(c) { c.globalAlpha = 0.55; for (let i = 0; i < 3; i++) { const bx = mk.x - 16 + i * 16, ph = (t * 0.6 + i * 0.33) % 1; for (let j = 0; j < 10; j++) { const y = mk.y - 70 - ph * 30 - j; P.p(bx + Math.sin((y + t * 20) / 3) * 1.5, y, j < 5 ? '#9ac05a' : '#b8d878'); } } c.globalAlpha = 1; }
  function drawFlies(c) { const n = S().st.clean < 15 ? 3 : 2; for (let i = 0; i < n; i++) { const a = t * (2.2 + i * 0.4) + i * 2; const x = Math.round(mk.x + Math.cos(a * 1.3) * (26 + i * 5)), y = Math.round(mk.y - 60 + Math.sin(a * 2.1) * 22); P.r(x, y, 2, 1, '#2a2430'); P.p(x + 2, y, '#4a4450'); const w = Math.floor(t * 30 + i) % 2; c.globalAlpha = 0.7; P.p(x, y - 1 - w, '#e8f4ff'); P.p(x + 1, y - 1 - w, '#e8f4ff'); c.globalAlpha = 1; } }
  let canSpr = null;
  function drawCan(c) {
    if (!canSpr) canSpr = MONKEY.sprite(26, 18, (a) => { const m = a.mat('can', '#5fae45'); a.rbox(5, 5, 19, 16, 2, a.K.IT, m); a.tube([[6, 12, 1.5], [1, 6, 1.1]], a.K.IT, m); a.tube([[9, 5, 1.1], [14, 1, 1.1], [19, 5, 1.1]], a.K.IT, a.mat('canH', '#3d7a33')); }, (d) => { d.hline(7, 17, 9, '#8fd36c'); });
    const s = Math.min(4, Math.max(0, (watering && watering.stg !== undefined ? watering.stg : (typeof GAME !== 'undefined' && GAME.treeStage ? GAME.treeStage() : 4)) | 0));
    const TREE_Y = [140, 118, 96, 74, 54];
    const cx = 62, cy = TREE_Y[s] - 10;
    const k = watering.t, tilt = k < 0.3 ? k / 0.3 : k > 1.9 ? Math.max(0, 1 - (k - 1.9) / 0.4) : 1;
    c.save(); c.translate(cx, cy); c.rotate(-0.6 * tilt); c.drawImage(canSpr, -13, -9); c.restore();
  }
  function drawTool(c) { const im = tool.img; const x = Math.round(tool.x - im.width / 2), y = Math.round(tool.y + tool.dy - im.height / 2); if (!tool.back) P.shadow(tool.x, tool.y + tool.dy + 10, 6, 2, 0.15); c.globalAlpha = tool.back ? Math.max(0, 1 - tool.back.t) : 1; c.drawImage(im, x, y); c.globalAlpha = 1; }
  function drawYardBack(c) { for (const b of falling) { const im = ROOMS.fur('banana1', ROOMS.FUR.banana1); c.globalAlpha = b.st === 'ground' ? Math.max(0, 1 - b.t * 2) : 1; c.save(); c.translate(Math.round(b.x), Math.round(b.y)); if (b.st === 'fall') c.rotate(b.rot); c.drawImage(im, -5, -6); c.restore(); c.globalAlpha = 1; } }

  // ---------- pointer input (scene coords) ----------
  function sceneY(y) { return y - topY() + camY; }
  function monkeyPart(x, y) {
    const sp = mk.sp; if (!sp || !SPR.hit(sp, x - mk.x0, y - mk.y0)) return null;
    const lx = x - mk.x, ly = y - (mk.y + mk.jy);
    const ns = sp.nose; if (ns && Math.hypot(lx - ns.x, ly - ns.y) < Math.max(4.2, ns.r)) return 'nose';
    const hd = sp.head; if (((lx - hd.x) / (hd.rx + 5)) ** 2 + ((ly - hd.y) / (hd.ry + 4)) ** 2 < 1) return 'head';
    const bd = sp.body; if (((lx - bd.x) / (bd.rx + 2)) ** 2 + ((ly - bd.y) / (bd.ry + 2)) ** 2 < 1) return 'belly';
    return 'body';
  }
  let ignoreUntil = 0;
  function ignoreTapUntil(ts) { ignoreUntil = Math.max(ignoreUntil, ts); }
  function down(x, y, e) {
    if (performance.now() < ignoreUntil) { press = null; return; }
    if (typeof FRIENDS !== 'undefined' && FRIENDS.sceneActive && FRIENDS.sceneActive()) {
      if (FRIENDS.tapScene && FRIENDS.tapScene()) { press = null; return; }
    }
    if (typeof ROUTINE !== 'undefined') ROUTINE.poke(); // Round 14: a tap stops whatever he set off to do by himself
    if (DASHA.down(x, sceneY(y))) { press = null; AUDIO.init(); return; } // Round 22: the gift box, blowing out her candles with a finger, her party
    if (trans || tool) return; y = sceneY(y); AUDIO.init();
    const spSpots = ROOMS.spots(room, S().home.items) || {};
    if (room === 'bath' && spSpots.sponge && inR(x, y, ...spSpots.sponge) && !S().sleeping) {
      press = null;
      startTool('soap', e, 'sponge');
      return;
    }
    const ht = DASHA.hit(room, x, y); if (ht) { press = { x, y, x0: x, y0: y, ht, moved: 0, acc: 0, t }; return; } // Round 22: a hidden heart
    const dk = DUCKS.at(x, y), part = dk ? null : monkeyPart(x, y), sn = dk || part ? null : SEASONS.hit(room, x, y), fr = part || dk || sn ? null : FRIENDS.at(x, y); // Round 10 #2: the ducks walk in front of him — they win the tap; #8: the event's thing on the sill before the window
    press = { x, y, x0: x, y0: y, part, fr, dk, sn, moved: 0, acc: 0, t: t, hs: part || fr || dk || sn ? null : hotspot(x, y) };
    if (part) lookAt(x, y, 1);
  }
  function move(x, y, e) {
    y = sceneY(y); hoverPt = { x, y, t }; if (DASHA.move(x, y)) return;
    if (!press) return; const d = Math.hypot(x - press.x, y - press.y); press.moved += d; press.x = x; press.y = y;
    if (press.part === 'head' || press.part === 'nose') { press.acc += d; if (monkeyPart(x, y) === 'head' || monkeyPart(x, y) === 'nose') { while (press.acc > 22) { press.acc -= 22; pet(x, y); } } }
    if (press.part === 'belly' && press.moved > 30) { press.acc += d; while (press.acc > 34) { press.acc -= 34; tickle(x, y); } }
  }
  function up(x, y, e) {
    if (tool) { toolUp(e); return; }
    y = sceneY(y); if (DASHA.up(x, y)) { press = null; return; } const pr = press; press = null; if (!pr) return;
    if (pr.ht) { if (pr.moved < 12) pr.ht(); return; }
    const dx = x - pr.x0, dy = y - pr.y0;
    if (pr.held) { FRIENDS.release(pr.fr.id); return; }
    if (pr.fr && pr.moved < 10) { FRIENDS.tap(pr.fr); return; }
    if (pr.dk && pr.moved < 10) { DUCKS.tap(pr.dk); return; }
    if (pr.sn && pr.moved < 10) { pr.sn(); return; }
    if (pr.moved < 10) {
      if (pr.part) { tapMonkey(pr.part, x, y); return; }
      if (pr.hs) { pr.hs.fn(); return; }
      if (y >= ROOMS.FLOOR + 6 && walkTo(x, y)) { if (typeof TUT !== 'undefined') TUT.on('walk'); return; } // Round 10 #4: the bare floor (Round 13: a tour step)
    }
    if (!pr.part && Math.abs(dx) > 22 && Math.abs(dx) > Math.abs(dy) * 1.15 && camY < 1) { go(dx < 0 ? 1 : -1); return; }
    if (pr.part === 'head' && pr.moved >= 10 && pr.moved < 22) pet(x, y);
  }
  const maxWalkY = () => {
    const curCv = typeof cv !== 'undefined' ? cv : (typeof document !== 'undefined' ? document.getElementById('cv') : null);
    return curCv && curCv.height > 320 ? Math.min(curCv.height - topY() - 18, 380) : WALK.y1;
  };
  function walkTo(x, y, then) { // Round 10 #4: tap on the floor → he walks over there (in scene coords); Round 11 #6: then() when he is there
    const s = S(); if (s.sleeping || trans || tool || APP.scene !== 'home' || mk.eat) return false;
    if (trip && trip.kind !== 'walk') return false;
    x = Math.max(WALK.x0, Math.min(WALK.x1, x)); y = Math.max(WALK.y0, Math.min(maxWalkY(), y));
    if (trip) { trip.path = [[x, y]]; trip.i = 0; trip.then = then || null; }
    else {
      if (Math.hypot(x - mk.x, y - mk.y) < 3) { if (then) then(); return true; } mk.act = null;
      trip = { kind: 'walk', D: TRIPS.walk, ph: 'go', t: 0, i: 0, mx: mk.x, my: mk.y, path: [[x, y]], dir: Math.sign(x - mk.x) || 1, stepPh: 0, step: 0, door: 0, seat: 0, opened: false, shY: mk.y, fxT: 0.15, sndT: 0, left: false }; trip.then = then || null;
    }
    fx.spawn('ring', x, y + 1, { r0: 2, r1: 8, life: 0.35 }); return true;
  }
  // Round 14 («Живёт сам»): he goes to another room by himself — walks out at the side towards it, the view slides after him (like a swipe),
  // he walks in from the other edge to (x, y), then(). A tap on the way (stopTravel) keeps him in the room he is in.
  const clampW = (x, y) => [Math.max(WALK.x0, Math.min(WALK.x1, x)), Math.max(WALK.y0, Math.min(maxWalkY(), y))];
  function walkTrip(x0, y0, path, then) { trip = { kind: 'walk', D: TRIPS.walk, ph: 'go', t: 0, i: 0, mx: x0, my: y0, path, dir: Math.sign(path[0][0] - x0) || 1, stepPh: 0, step: 0, door: 0, seat: 0, opened: false, shY: y0, fxT: 0.15, sndT: 0, left: false, travel: true }; trip.then = then || null; }
  function travel(r, x, y, then) {
    const s = S(); if (s.sleeping || trans || tool || mk.eat || APP.scene !== 'home' || !IDS.includes(r)) return false;
    if (trip && trip.kind !== 'walk') return false;
    [x, y] = clampW(x, y); mk.act = null;
    if (r === room) { if (trip) { rest.x = trip.mx; rest.y = trip.my; trip = null; } walkTrip(mk.x, mk.y, [[x, y]], then); return true; }
    const d = IDS.indexOf(r) > IDS.indexOf(room) ? 1 : -1, y0 = clampW(mk.x, mk.y)[1];
    if (trip) trip = null;
    walkTrip(mk.x, mk.y, [[d > 0 ? RW + 30 : -30, y0]], () => {
      snapX.clearRect(0, 0, RW, off.height); snapX.drawImage(off, 0, 0); trans = { dir: d, t: 0, dur: 0.4 }; AUDIO.play('whoosh'); setRoom(r);
      const sx = d > 0 ? -30 : RW + 30; rest.x = sx; rest.y = y0; mk.x = sx; mk.y = y0; walkTrip(sx, y0, [[x, y]], then);
    });
    return true;
  }
  // Round 14b: his own TV time in the zal — he switches it on and watches (two rounds of the 'tv' face); stands left of the screen, looking right at it
  function watchTv() { if (room !== 'zal' || !GAME.hasUp('tv') || S().sleeping) return false; if (!tvOn) { tvOn = true; AUDIO.play('click'); } act('tv', { keep: true, then: () => act('tv', { keep: true }) }); return true; }
  function tvSpot() { const sp = ROOMS.spots('zal', S().home.items) || {}, tv = sp.tv; return tv ? clampW(Math.round(tv[0] + tv[2] / 2 - 26), 262) : [90, 262]; }
  function stopTravel() { if (mk.act && mk.act.keep) { mk.act = null; if (!trip) return true; } if (!trip || !trip.travel) return false; const [x, y] = clampW(trip.mx, trip.my); trip.path = [[x, y]]; trip.i = 0; trip.then = null; trip.travel = false; return true; }
  // Round 14: hungry, he opens the fridge himself: pick() at the open fridge says what he takes (or null — empty), after(id) once he is back
  function fridgeSnack(pick, after) { if (trip || S().sleeping || room !== 'kitchen') return false; tripStart('fridge', null, true); if (!trip || trip.kind !== 'fridge') return false; trip.auto = { pick, after }; return true; }
  function hover(x, y) { hoverPt = { x, y: sceneY(y), t }; }
  function tapMonkey(part, x, y) {
    const s = S(); if (s.sleeping) { sleepyPoke(); return; }
    taps.push(t); taps = taps.filter((q) => t - q < 2.2);
    if (taps.length >= 7) { taps = []; dizzy(); return; }
    if (part === 'nose') boop(); else if (part === 'head') pet(x, y); else if (part === 'belly') tickle(x, y); else poke(x, y);
  }
  function pet(x, y) {
    const s = S(); if (s.sleeping) return sleepyPoke(); if (t < mk.petCD) return; mk.petCD = t + 0.22;
    s.stats.petted++; GAME.stat('fun', 1.2); GAME.care(0.5, 'pet'); GAME.fulfill('pet'); GAME.checkAch();
    if (!mk.eat) face('happy', 'smile', 0.9, { blush: 1 });
    fx.spawn('heart', (x || mk.x) + rnd(-6, 6), (y || headTop() + 10) - 6, { vy: -24, vx: rnd(-8, 8), life: 1.1, wob: 5 });
    if (Math.random() < 0.3) AUDIO.play('happy'); else AUDIO.play('bubble');
    if (Math.random() < 0.1 && t - lastSay > 4) say(pick(L.pet));
  }
  function tickle(x, y) {
    const s = S(); if (s.sleeping) return sleepyPoke(); if (t < mk.tickleCD) return; mk.tickleCD = t + 0.4;
    AUDIO.play('giggle'); s.stats.tickled = (s.stats.tickled || 0) + 1; GAME.stat('fun', 2.2); GAME.care(0.5, 'pet'); GAME.fulfill('tickle'); act('tickle'); hop(70);
    for (let i = 0; i < 3; i++) fx.spawn('spark', (x || mk.x) + rnd(-12, 12), (y || mk.y - 40) + rnd(-8, 8), { vy: -10, life: 0.6 });
    if (Math.random() < 0.3 && t - lastSay > 3) say(pick(L.tickle));
  }
  function boop() {
    AUDIO.play('boop'); const m = mouthPos(); fx.spawn('ring', mk.x, m.y - 9, { r0: 2, r1: 9, life: 0.35, c: '#ffffff' });
    face('wide', 'o', 0.35); later(0.35, () => face('closed', 'laugh', 0.5)); hop(60);
    if (Math.random() < 0.3 && t - lastSay > 3) say(pick(L.boop));
  }
  function poke(x, y) { AUDIO.play('giggle'); face('closed', 'laugh', 0.6); hop(50); fx.spawn('spark', x, y, { life: 0.4 }); }
  function dizzy() { mk.dizzy = 2.6; mk.act = null; AUDIO.play('whoosh'); later(0.3, () => say(pick(L.dizzy), 'sad')); }
  function sleepyPoke() { if (t < mk.sleepyCD) return; mk.sleepyCD = t + 2.5; face(null, null, 1.2, { poke: 1 }); say(pick(L.sleepy), 'tired'); }

  let kitchenLamp = true;
  // ---------- live things: kettle, microwave, balcony table lamp, hall sconces (the kitchen floor lamp is kitchenLamp) ----------
  const th = { kettle: null, micro: null, balLamp: null, sconces: true, radio: null };
  const balLampOn = () => !S().home.items.lava ? false : th.balLamp === null ? (ROOMS.phase() === 'evening' || ROOMS.phase() === 'night') : th.balLamp; // the bought lava lamp (Round 7 #5): on by default in the evening
  const RADIO_T = 6.4;
  // Round 7 #7: the soundbar — its LED is on with the TV; a tap plays a bass test: a boom, sound rings from both ends, he bops to it
  let sbT = -9;
  const sbOn = () => !!S().home.items.soundbar && GAME.hasUp('tv') && ((tvOn && !S().sleeping) || t - sbT < 1.6);
  function sbTap(r) {
    sbT = t; AUDIO.play('bass'); for (const [x, d] of [[r[0] + 3, 0], [r[0] + r[2] - 3, 0.12]]) { later(d, () => fx.spawn('ring', x, r[1] + 3, { r0: 2, r1: 11, life: 0.45 })); later(d + 0.42, () => fx.spawn('ring', x, r[1] + 3, { r0: 2, r1: 9, life: 0.35 })); }
    if (S().sleeping || busy()) return; hop(70); later(0.42, () => hop(55)); face('wide', 'o', 0.6);
    if (!GAME.ageDef().babble && Math.random() < 0.6) later(0.7, () => { if (!mk.talk) say(pick(DATA.LINES.soundbar), 'happy'); });
  }
  function radioTap() { // Round 7 #5: the sill radio plays a short tune (notes fly out, he dances); a second tap switches it off
    if (th.radio) { th.radio = null; AUDIO.stop('radio'); AUDIO.play('switch'); return; }
    th.radio = { t: 0, n: 0 }; AUDIO.play('switch'); AUDIO.play('radio'); if (!busy()) { act('dance'); if (Math.random() < 0.6) say(pick(L.radio)); }
  }
  function thingsTick(dt) {
    const rd = th.radio; if (rd) { rd.t += dt; if (room === 'balcony' && rd.t > rd.n * 0.45) { rd.n++; const sp = ROOMS.spots('balcony', S().home.items).radio; if (sp) fx.spawn('note', sp[0] + 8 + rnd(-4, 6), sp[1] + 2, { vx: rnd(-8, 8), vy: -16, life: 1.3, c: rd.n % 3, wob: 4 }); } if (rd.t >= RADIO_T) th.radio = null; }
    const k = th.kettle; if (k) { k.t += dt; if (k.ph === 'boil' && k.t >= 5) { th.kettle = { ph: 'steam', t: 0 }; AUDIO.play('switch'); if (room === 'kitchen' && !busy()) face('happy', 'smile', 1.2); } else if (k.ph === 'steam' && k.t >= 4.5) th.kettle = null; }
    const m = th.micro; if (m) { m.t += dt; if (m.ph === 'run' && m.t >= 4) { th.micro = { ph: 'ding', t: 0 }; AUDIO.play('ding'); if (room === 'kitchen' && !busy()) { hop(40); face('happy', 'smile', 1); } } else if (m.ph === 'ding' && m.t >= 1.6) th.micro = null; }
  }
  function things() { return { kettle: th.kettle ? th.kettle.ph : 'off', micro: th.micro ? th.micro.ph : 'off', lamp: balLampOn(), radio: th.radio ? 'on' : 'off', guitar: guitarCase(), bag: bagDx() || (trip && trip.kind === 'guitar' && trip.baby && trip.shake > 0) ? 'shake' : 'still', soundbar: sbOn() ? 'on' : 'off', tvGame: tvGame(), sconces: th.sconces, floorLamp: kitchenLamp, fridge: trip && trip.kind === 'fridge' && trip.door > 0.5 ? 'open' : 'closed', chair: chairDx >= CHAIR_DX - 0.5 ? 'pulled' : chairDx <= 0.5 ? 'in' : 'moving', stool }; }
  function kettleTap(r) {
    AUDIO.play('switch'); lookAt(r[0] + r[2] / 2, r[1] + r[3] / 2, 1.6);
    if (th.kettle && th.kettle.ph === 'boil') { th.kettle = null; AUDIO.stop('boil'); return; }
    th.kettle = { ph: 'boil', t: 0 }; AUDIO.play('boil'); face('open', 'o', 0.7);
  }
  function microTap(r) {
    lookAt(r[0] + r[2] / 2, r[1] + r[3] / 2, 1.6);
    if (th.micro && th.micro.ph === 'run') { th.micro = null; AUDIO.stop('micro'); AUDIO.play('click'); return; }
    th.micro = { ph: 'run', t: 0 }; AUDIO.play('micro');
  }
  // ---------- walk-to trips: tapping the fridge / the computer (or its chair) / the wardrobe sends him there first ----------
  // he walks over (legs alternate, soft steps), turns his back to us and rummages in the fridge / hops onto the office chair and types /
  // digs in the shelves, and only then the sheet opens. At the fridge and the PC he stays while their sheet (or the game it started) is open;
  // from the wardrobe he comes back to the middle at once, so you see him try things on. Bar buttons stay instant; a second tap on the
  // thing while he is on his way opens the sheet right away; leaving the room cancels the trip.
  let trip = null;
  // Round 14b #8: the wooden step stool — 'home' (by the sofa) | 'held' (in his paws) | 'placed' (at the counter, he stands on it to cook)
  // Round 15b #4: the zal radiator knob is high up — he climbs onto the bed's corner: floor in front of the footboard → bed rail → the footboard post; knob = where his paw goes
  const HOP_T = 0.42, KNOB_BED = { foot: [86, 246], hops: [[82, 213], [93, 176]], knob: [112, 161] };
  let stool = 'home'; const STOOL_TOP = 24;
  let sneaking = false; const sneak = (on) => { sneaking = !!on; }; // Round 15b #3: the heist with Жучок — on tiptoe, paws up, looking around
  let chairDx = 0, chairMv = false; const CHAIR_DX = 9; // the kitchen chair by the fridge: pulled aside while he squeezes past the table
  const TRIPS = {
    fridge: { path: [[104, 240], [150, 236]], dur: 1.05, wait: true, lead: 0.25, open: () => UI.openShop('food') },
    pc: { path: [[150, GY]], sit: true, dur: 0.85, wait: true, lead: 0.4, open: () => UI.openGames('pc') },
    wardrobe: { path: [[44, 242], [27, 238]], dur: 1.15, wait: false, lead: 0, open: () => UI.openWardrobe() },
    // Round 5 D: the stove — he stands left of the pan (so it stays in sight) and waits there while GAGS cooks the pancakes
    stove: { path: [[78, 246]], dur: 0.25, wait: true, lead: 0.2, hold: () => GAGS.cooking(), open: () => GAGS.cookGo() },
    // Round 6 D: the hall mirror — he stands right of it, faces us and strikes a pose; his reflection repeats it (no wardrobe any more)
    mirror: { path: [[84, 246]], dur: 2.6, wait: false, lead: 0, open: () => {} },
    // Round 7 #8: the guitar — he stands left of the bag, unzips it, takes the guitar out, strums (badly), puts it back and zips it up
    guitar: { path: [[88, 250]], dur: 8.5, wait: false, lead: 0, open: () => {} },
    // Round 7 #6: a console — he sits down on the floor in front of the TV (back to us) with the controller, the TV shows the console's menu
    console: { path: [[150, 266]], sit: true, floor: true, dur: 0.7, wait: true, lead: 0.35, open: () => UI.openGames('tv') },
    // Round 8 #12: the robot vacuum — he walks over, hops on and rides it round the hall (GAGS drives it), hops off at the dock and comes back
    vac: { path: [[142, 244]], dur: 99, wait: false, lead: 0.4, open: () => {} },
    // Round 10 #5: the radiator knob on the floor — he picks it up, reaches up to the radiator and screws it back on
    knob: { path: [[88, 246]], dur: 1.5, wait: false, lead: 0, open: () => GAGS.knobFix() },
    // Round 14b #7: the fallen drying rack — he walks to its loose end, squats, grabs it and heaves it up (as high as his paws reach), a last push, «Фух!»
    rack: { path: [[96, 248]], dur: 99, wait: false, lead: 0, open: () => {} },
    // Round 10 #4: a tap on the floor — he just walks there and stays (walkTo)
    walk: { path: [[MX, GY]], dur: 0, wait: false, lead: 0, open: () => {} },
    // window closing when cold (jumps on desk->sill on balcony, on bed footboard in zal)
    winClose: { path: [[86, 248]], dur: 1.0, wait: false, lead: 0, open: () => {} },
    // toilet trip in bath
    toilet: { path: [[28, 246]], sit: true, dur: 4.2, wait: false, lead: 0.35, open: () => {} },
  };
  const VAC_TOP = 4; // his feet on the vacuum's lid
  function vacTrip(tr, dt) {
    const s = GAME.ageDef().s, o = GAGS.view().vac;
    if (tr.ph === 'go') { tr.shY = tr.my; if (walkTick(tr, dt)) { tr.ph = 'sit'; tr.t = 0; tr.x0 = tr.mx; tr.y0 = tr.my; AUDIO.play('jump'); } return; }
    if (tr.ph === 'sit') { // a hop up onto the lid
      const k = Math.min(1, tr.t / 0.42); tr.mx = tr.x0 + (o.x - tr.x0) * k; tr.my = tr.y0 + (o.y - VAC_TOP - tr.y0) * k - Math.sin(Math.PI * k) * 12 * Math.max(0.6, s); tr.shY = k < 0.5 ? tr.y0 : null;
      if (k >= 1) { tr.ph = 'do'; tr.t = 0; tr.ride = true; tr.mx = o.x; tr.my = o.y - VAC_TOP; AUDIO.play('step'); GAGS.vacGo(true); }
      return;
    }
    if (tr.ph === 'do') { if (!GAGS.vacRiding()) { tr.ph = 'back'; tr.t = 0; tr.ride = false; tr.x0 = tr.mx; tr.y0 = tr.my; tr.lx = tr.mx - 16; tr.ly = tr.my + VAC_TOP + 10; } return; }
    if (tr.t < tr.D.lead) { const k = tr.t / tr.D.lead; tr.mx = tr.x0 + (tr.lx - tr.x0) * k; tr.my = tr.y0 + (tr.ly - tr.y0) * k - Math.sin(Math.PI * k) * 10 * Math.max(0.6, s); tr.shY = k > 0.5 ? tr.ly : null; tr.dir = -1; return; } // hops off
    if (!tr.left) { tr.left = true; tr.mx = tr.lx; tr.my = tr.ly; AUDIO.play('step'); tr.path = [[rest.x, rest.y]]; tr.i = 0; }
    tr.shY = tr.my; if (walkTick(tr, dt)) trip = null;
  }
  const RACK_L = [-13, -52]; // the top end of the rack sprite, from its pivot (the right foot)
  function rackEnd(f) { const rk = (ROOMS.spots('hall', S().home.items) || {}).rack || [4, 184, 26, 52], a = f * 1.42, c = Math.cos(a), sn = Math.sin(a); return [rk[0] + rk[2] + RACK_L[0] * c - RACK_L[1] * sn, rk[1] + rk[3] + (RACK_L[0] * sn + RACK_L[1] * c) * (1 - 0.55 * f * f)]; }
  function rackLift() {
    if (trip || S().sleeping || room !== 'hall' || APP.scene !== 'home' || trans || mk.eat) return false;
    tripStart('rack'); if (!trip || trip.kind !== 'rack') return false; const e = rackEnd(1); trip.path = [[Math.round(Math.min(150, e[0] + 12 + 8 * GAME.ageDef().s)), 248]];
    const reach = 92 * GAME.ageDef().s; let fs = 1; while (fs > 0.05 && 248 - rackEnd(fs - 0.02)[1] < reach * 0.9) fs -= 0.02; trip.fs = Math.max(0.05, fs); // how far up his paws can take it
    return true;
  }
  function rackTrip(tr, dt) {
    const LIFT = 1.5, ease = (k) => k * k * (3 - 2 * k);
    if (tr.ph === 'go') { tr.shY = tr.my; if (walkTick(tr, dt)) { tr.ph = 'grab'; tr.t = 0; tr.dir = -1; tr.x0 = tr.mx; AUDIO.play('step'); } return; }
    tr.shY = tr.my;
    if (tr.ph === 'grab') { if (tr.t >= 0.45) { tr.ph = 'lift'; tr.t = 0; AUDIO.play('lift'); if (!GAME.ageDef().babble) say(pick(L.g_rackUp || ['Подниму!'])); else AUDIO.play('giggle'); } return; }
    if (tr.ph === 'lift') {
      const k = Math.min(1, tr.t / LIFT), f = 1 - (1 - tr.fs) * ease(k); GAGS.rackSet(f); const e = rackEnd(f);
      tr.mx = Math.max(24, Math.min(tr.x0, e[0] + 10 + 6 * GAME.ageDef().s)); // steps after the end as it comes up
      tr.fxT -= dt; if (tr.fxT <= 0) { tr.fxT = 0.45; AUDIO.play('creak'); fx.spawn('drop', mk.x + rnd(-6, 6), headTop() + 6, { c: '#bfe6ff', vx: rnd(-20, 20), vy: -30, g: 200, life: 0.5 }); }
      if (k >= 1) { tr.ph = 'push'; tr.t = 0; tr.f0 = f; AUDIO.play('jump'); }
      return;
    }
    if (tr.ph === 'push') { const k = Math.min(1, tr.t / 0.3); if (k < 1) GAGS.rackSet(tr.f0 * (1 - k)); else { GAGS.rackSet(0, true); tr.ph = 'phew'; tr.t = 0; } return; }
    if (tr.ph === 'phew' && tr.t >= 0.9) { rest.x = tr.mx; rest.y = tr.my; trip = null; GAME.stat('fun', 2); if (!GAME.ageDef().babble) say(pick(L.g_rackDone || ['Фух!']), 'happy'); else face('happy', 'laugh', 0.8); }
  }
  function rackPose(p, tr) { // squats and grabs the loose end, both paws on it all the way up (strained face, sweat); the push: arms up; «фух»: wipes his brow
    const ph = tr.ph, sc = p.s || 1, hand = (dx, dy) => { const e = rackEnd(GAGS.view().rack.fall); return [(e[0] + dx - mk.x) / sc, (e[1] + dy - mk.y - mk.jy) / sc]; };
    p.back = 0; p.pose = 'idle';
    if (ph === 'grab') { p.legs = 'tuck'; p.eyes = { mode: 'open', look: [-1, 1] }; p.mouth = 'o'; p.open = 0.3; p.armL = hand(-1, 0); p.armR = hand(1, 1); return; }
    if (ph === 'lift') { const b = Math.floor(tr.t * 5) % 2; p.legs = b ? 'walkL' : 'stand'; p.eyes = { mode: 'closed' }; p.mouth = 'flat'; p.sweat = 1; p.blush = 1; p.armL = hand(-1, 0); p.armR = hand(1, 1); return; }
    if (ph === 'push') { p.legs = 'stand'; p.eyes = { mode: 'wide', look: [-1, -1] }; p.mouth = 'o'; p.open = 0.5; p.armL = [-30, -96]; p.armR = [-14, -100]; return; }
    p.legs = 'stand'; p.eyes = { mode: 'happy' }; p.mouth = 'smile'; p.armL = [-17, -15]; p.armR = tr.t < 0.6 ? [8, -84, 1] : [17, -15]; // wipes the brow
  }
  function vacRide() { if (trip || S().sleeping || room !== 'hall' || APP.scene !== 'home' || trans) return false; tripStart('vac'); return !!trip; }
  const MIRROR_POSES = ['flex', 'hips', 'comb', 'kiss', 'wave'];
  function mirrorPose(tr, id) { // picks (or is told) a pose, says a line about it, a glint runs down the glass
    tr.pose = id || pick(MIRROR_POSES.filter((q) => q !== tr.pose)); tr.pt = 0; const L = DATA.LINES;
    const k = tr.pose === 'hips' && GAME.isSkuf() ? 'm_skuf' : tr.pose === 'hips' && GAME.ageDef().age < 0.4 ? 'm_cute' : 'm_' + tr.pose;
    AUDIO.play('star'); if (L[k]) say(pick(L[k]), 'happy');
    if (tr.pose === 'kiss') later(0.7, () => { if (trip === tr) fx.spawn('heart', mk.x - 16, headTop() + 14, { vx: -26, vy: -18, life: 1.1 }); });
  }
  const TRIP_FOOD = ['banana', 'apple', 'milk', 'salad', 'porridge', 'puree', 'cake', 'watermelon'];
  const CLOTH_C = [['#e9e2d6', '#c4baa8'], ['#c94f6b', '#8f2f48'], ['#8fa6c8', '#5d7090'], ['#f0d0a8', '#c8a070'], ['#5d6a80', '#3a4456'], ['#ffffff', '#c8c8d0'], ['#3fb6ff', '#1f7fc1'], ['#ffd23a', '#c89a12']];
  function tripStart(kind, con, quiet) {
    if (trip && trip.kind === 'walk') { rest.x = trip.mx; rest.y = trip.my; trip = null; } // a thing tapped on the way: he goes from where he is
    if (trip) {
      if (trip.kind === kind && !trip.opened && (trip.ph === 'go' || trip.ph === 'sit' || trip.ph === 'do') && !(trip.stool && trip.ph !== 'do')) tripOpen(); // impatient second tap (not before he is up on the stool)
      else if (trip.ph === 'back' && trip.t >= trip.D.lead && !UI.sheetOpen) { trip = null; tripStart(kind); } // changed his mind on the way back
      return;
    }
    const D = TRIPS[kind]; if (!D || S().sleeping || APP.scene !== 'home' || trans) return;
    if (kind === 'pc' && !GAME.hasUp('pc')) { noPc(); return; } // Round 6 E: the desk is empty until a computer is bought
    if (kind === 'console' && !conOf(con)) return;
    if (!quiet) AUDIO.play('click'); mk.act = null; cancelTool();
    if (kind === 'knob' && GAGS.view().knob.st !== 'floor') return false; // only a knob that really lies on the floor
    trip = { kind, D, ph: 'go', t: 0, i: 0, mx: mk.x, my: mk.y, path: D.path.map((q) => q.slice()), dir: 1, stepPh: 0, step: 0, door: 0, seat: 0, opened: false, shY: mk.y, fxT: 0.15, sndT: 0, left: false };
    if (kind === 'pc') { const sp = ROOMS.spots('balcony', S().home.items) || {}; if (sp.seat) trip.path = [[sp.seat[0], GY]]; }
    if (kind === 'console') trip.con = conOf(con);
    if (kind === 'knob') { const k = GAGS.view().knob; // Round 15b #4: picks it up, then climbs onto the corner of the bed (rail → footboard post) and reaches the radiator from there
      trip.path = [[Math.round(Math.max(20, Math.min(160, k.x + 1))), 248], [KNOB_BED.foot[0], KNOB_BED.foot[1]]]; trip.climb = true; trip.hops = KNOB_BED.hops.map((q) => q.slice()); trip.cy = KNOB_BED.hops[KNOB_BED.hops.length - 1][1];
      trip.D = Object.assign({}, D, { lead: KNOB_BED.hops.length * HOP_T }); }
    if (kind === 'guitar') trip.baby = !!GAME.ageDef().babble; // Round 9 #1: Кроха, Малыш, Карапуз can't open the bag yet
    if (kind === 'guitar') trip.path = [[Math.round(116 - (24 + 8 * GAME.fat()) * GAME.ageDef().s), 250]]; // just left of the bag, so it stays in sight
    if (kind === 'mirror') trip.path = [[Math.round(Math.max(80, 70 + GAME.ageDef().s * (17 + 13 * GAME.fat()))), 246]]; // a big one stands further off so the glass stays in sight
    if (kind === 'stove') { const sp = ROOMS.spots('kitchen', S().home.items) || {}, st = sp.stool, at = sp.stoolAt; // Round 14b #8: fetch the stool, stand on it at the counter
      if (st && at) { stool = 'home'; trip.stool = true; trip.climb = true; trip.cy = at[1] - STOOL_TOP; trip.sAt = [st[0] + st[2] / 2, st[1]]; trip.sk = 0;
        trip.D = Object.assign({}, D, { path: [[st[0] + st[2] + 8, st[1] + 2], [at[0], at[1] + 10]], lead: 0.5 }); trip.path = trip.D.path.map((q) => q.slice()); } }
    if (kind === 'fridge' && GAME.little()) { // too small for the shelves: climbs onto the chair in front of the fridge
      const ch = (ROOMS.spots('kitchen', S().home.items) || {}).chair || [152, 198, 22, 52];
      trip.climb = true; trip.cy = ch[1] + 30; trip.D = Object.assign({}, D, { path: [[ch[0] + ch[2] / 2, ch[1] + ch[3] + 6]], lead: 0.45 }); trip.path = trip.D.path.map((q) => q.slice());
    }
    if (kind === 'winClose') {
      const r = con || room;
      trip.winRoom = r;
      if (r === 'balcony') {
        trip.path = [[124, 248]];
        trip.climb = true;
        trip.hops = [[124, 172], [96, 132]];
        trip.cy = 132;
        trip.D = Object.assign({}, D, { dur: 1.0, lead: 2 * HOP_T, open: () => { if (typeof GAGS !== 'undefined' && GAGS.winClose) GAGS.winClose('balcony'); } });
      } else {
        trip.path = [[86, 248]];
        trip.climb = true;
        trip.hops = [[82, 213], [86, 178]];
        trip.cy = 178;
        trip.D = Object.assign({}, D, { dur: 1.0, lead: 2 * HOP_T, open: () => { if (typeof GAGS !== 'undefined' && GAGS.winClose) GAGS.winClose('zal'); } });
      }
    }
  }
  // ---------- Round 6 E: the phone (HUD button) and the computer ----------
  // he takes the phone out (holds it in both hands, looks down at it) and the games sheet opens on «В телефоне»; he keeps it while the sheet is open
  let phoneT = -1;
  const phoneOn = () => phoneT >= 0 && APP.scene === 'home' && !trip && (t - phoneT < 0.7 || (UI.sheetKind === 'games' && UI.gamesDev === 'phone'));
  function phone() {
    if (APP.scene !== 'home' || trans) return; const s = S();
    if (s.sleeping) { UI.toast('Тсс, ' + s.name + ' спит', UI.I('moon')); return; }
    if (!GAME.hasPhone()) { AUDIO.play('nope'); later(0.2, () => say(pick(DATA.LINES.noPhone))); UI.openShop('tech'); return; }
    if (trip) return; mk.act = null; cancelTool(); phoneT = t; AUDIO.play('phone'); if (Math.random() < 0.5) say(pick(DATA.LINES.phone));
    later(0.6, () => { if (APP.scene === 'home' && !UI.sheetOpen && !UI.hasModal()) UI.openGames('phone'); });
  }
  // Round 7 #6: the consoles — the one asked for if it is there, else whichever is (null: none, or no TV)
  const conOf = (con) => { const ok = (k) => GAME.placed(k) && GAME.hasUp('tv'); return con && ok(con) ? con : DATA.CONSOLES.find(ok) || null; };
  function conOn(tr) { tvOn = true; AUDIO.play(tr.con === 'ps5' ? 'bootPs' : 'bootSw'); if (!GAME.ageDef().babble && Math.random() < 0.5) later(0.5, () => { if (!mk.talk) say(pick(DATA.LINES.console), 'happy'); }); }
  const tvGame = () => (trip && trip.kind === 'console' && (trip.ph === 'do' || trip.ph === 'wait') ? 'menu' : null);
  function toTv(con) { // «К ТВ» in the phone's console tab: he runs to the zal and sits down at the TV
    if (!conOf(con)) return; phoneT = -1; say(pick(DATA.LINES.toTv), 'happy'); goTo('zal', true); UI.showRoomTitle(DATA.ROOMS.find((x) => x.id === 'zal').name); tripStart('console', con);
  }
  function drawPad(c, sp) { // the controller in his paws, seen from behind: a white DualSense / the red and blue Joy-Con grips peek out by his paws
    const hl = sp.handL, hr = sp.handR; if (!hl || !hr) return; const s = sp.s / 1.2, y = Math.round(mk.y + mk.jy + (hl.y + hr.y) / 2), xl = Math.round(mk.x + hl.x), xr = Math.round(mk.x + hr.x), w = Math.max(3, Math.round(4 * s));
    if (trip.con === 'ps5') { P.r(xl + 1, y - 2, w + 1, 4, '#3a3a44'); P.r(xl + 1, y - 2, w, 3, '#f4f5f8'); P.r(xr - w - 1, y - 2, w + 1, 4, '#3a3a44'); P.r(xr - w, y - 2, w, 3, '#f4f5f8'); }
    else { P.r(xl + 1, y - 3, w, 5, '#e8403a'); P.p(xl + 1, y - 3, '#ff7a6a'); P.r(xr - w, y - 3, w, 5, '#2f8ff0'); P.p(xr - 1, y - 3, '#8cc8ff'); }
  }
  function noPc() { AUDIO.play('nope'); say(pick(DATA.LINES.noPc), 'sad'); UI.openShop('tech'); }
  function toPc() { // «К ПК» in the phone's computer tab: he runs to the balcony and sits down at the computer
    if (!GAME.hasUp('pc')) { noPc(); return; }
    phoneT = -1; say(pick(DATA.LINES.toPc), 'happy'); goTo('balcony', true); UI.showRoomTitle(DATA.ROOMS.find((x) => x.id === 'balcony').name); tripStart('pc');
  }
  function drawPhone(c, sp) { // the back of a black phone in his hands, the screen glow on his face
    const hl = sp.handL, hr = sp.handR; const x = Math.round(mk.x + (hl && hr ? (hl.x + hr.x) / 2 : 0)), y = Math.round(mk.y + mk.jy + (hr ? hr.y : -40));
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16; c.fillStyle = '#7cd0ff'; c.beginPath(); c.ellipse(x, y - 9, 9, 6, 0, 0, Math.PI * 2); c.fill(); c.restore();
    P.r(x - 4, y - 8, 9, 13, '#16161c'); P.r(x - 3, y - 7, 7, 11, '#34343e'); P.r(x - 3, y - 7, 7, 1, '#4a4a56'); P.r(x - 2, y - 6, 2, 2, '#0c0c10'); P.p(x - 2, y - 6, '#5a6a8a'); P.p(x + 2, y - 2, '#4a4a56');
    c.fillStyle = '#a8e4ff'; c.globalAlpha = 0.8; c.fillRect(x - 4, y - 9, 9, 1); c.globalAlpha = 1;
  }
  // Round 35: Smooth guitar unpack & pack with bag lock animation and seamless arm layering
  const GT = { reach: 0.2, zip: 0.8, open: 1.0, take: 1.0, strum: 2.0, pack: 5.8, settle: 7.0, zip2: 7.3, shut: 8.0 };
  const gSmall = () => GAME.little();
  const gDir = (a) => { const r = a * Math.PI / 180; return { hx: Math.sin(r), hy: -Math.cos(r), ux: Math.cos(r), uy: Math.sin(r) }; }; // towards the head / across the strings
  function guitarCase() { const tr = trip; return tr && tr.kind === 'guitar' && !tr.baby && tr.ph === 'do' && tr.t >= GT.zip && tr.t < GT.shut ? 'open' : 'closed'; }
  function gHeld() { // held across him (body at his right hip, the neck up to his left) — a little one props it on the floor beside him
    const s = GAME.ageDef().s; return gSmall() ? { x: mk.x - 15 * s - 10, y: mk.y - 15, a: 10, sc: 1 } : { x: mk.x - 8 * s, y: mk.y + mk.jy - 25 * s, a: 62, sc: 1 }; // Round 8: the guitar is 1.25× (built into ZAL.guitarSpr) — a grown-up holds it almost his own height
  }
  function gPos(tr) { // where the guitar is now: { x, y (its body centre), a (degrees), inCase }
    const C = { x: ZAL.GO[0], y: ZAL.GO[1], a: 0, sc: 1, inCase: true }, t = tr.t; if (tr.ph !== 'do') return C;
    const mv = (k, from, to) => { const e = k * k * (3 - 2 * k); return { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e - Math.sin(Math.PI * k) * 8, a: from.a + (to.a - from.a) * e, sc: from.sc + (to.sc - from.sc) * e, inCase: false }; };
    if (t < GT.take || t >= GT.settle) return C;
    if (t < GT.strum) return mv((t - GT.take) / (GT.strum - GT.take), C, gHeld());
    if (t < GT.pack) return Object.assign(gHeld(), { inCase: false });
    return mv((t - GT.pack) / (GT.settle - GT.pack), gHeld(), C);
  }
  // Round 9 #1: a baby (Кроха, Малыш, Карапуз) can't unzip the bag — he slaps it three times (a dull «бздынь», the bag shakes on its stand),
  // then whines «Э-э-э-э-э!» and a hint says the guitar opens from «Детёныш»; then he toddles back
  const GB = { slaps: [0.2, 0.75, 1.3], whine: 1.8, end: 3.4 };
  function babyGuitar(tr, dt) {
    const t = tr.t; tr.shake = Math.max(0, (tr.shake || 0) - dt); tr.gp = t < GB.whine ? 'slap' : 'whine';
    tr.sl = tr.sl || 0;
    while (tr.sl < GB.slaps.length && t >= GB.slaps[tr.sl]) {
      tr.sl++; tr.slapT = t; tr.shake = 0.32; AUDIO.play('bzdyn');
      fx.spawn('puff', ZAL.GTR[0] + 4 + rnd(-2, 2), ZAL.GTR[1] + ZAL.GH - 30 + rnd(-4, 4), { life: 0.4 });
    }
    if (t >= GB.whine && !tr.wh) { tr.wh = 1; whine({ noAct: true }); UI.toast('Гитару откроет, когда подрастёт до «Детёныш»', UI.I('lock')); }
    if (t >= GB.end) tr.t = tr.D.dur; // → the generic loop sends him back
  }
  const bagDx = () => (trip && trip.kind === 'guitar' && trip.baby && trip.shake > 0 ? Math.round(Math.sin(trip.shake * 55) * 1.6 * (trip.shake / 0.32 + 0.3)) : 0);
  function guitarTick(tr, dt) {
    if (tr.baby) { babyGuitar(tr, dt); return; }
    const t = tr.t, L = DATA.LINES, ag = GAME.ageDef();
    tr.gp = t < GT.take ? 'open' : t < GT.strum ? 'take' : t < GT.pack ? 'strum' : t < GT.settle ? 'pack' : 'zip';
    if (t >= GT.reach && !tr.z1) { tr.z1 = 1; AUDIO.play('zip'); }
    if (t >= GT.zip2 && !tr.z2) { tr.z2 = 1; AUDIO.play('zip'); }
    tr.wince = Math.max(0, (tr.wince || 0) - dt);
    if (tr.gp === 'strum') {
      tr.sp = (tr.sp || 0) + dt;
      if (!tr.n || tr.sp >= tr.iv) {
        tr.n = (tr.n || 0) + 1; tr.sp = 0; tr.iv = rnd(0.36, 0.56); // never quite in time
        const bad = tr.n === 3 || (tr.n > 3 && !tr.bad && Math.random() < 0.3), g = gPos(tr), d = gDir(g.a); tr.bad = bad; AUDIO.play('strum');
        if (bad) { // a wrong string: twang, a crooked grey note, he winces
          AUDIO.play('twang'); tr.wince = 0.5; fx.spawn('spark', g.x + d.hx * 3, g.y + d.hy * 3, { life: 0.4 });
          fx.spawn('fn', g.x + rnd(-4, 4), g.y - 8, { vx: rnd(-16, 16), vy: -20, life: 1.3, fn: crookedNote });
          if (!ag.babble && !mk.talk && !tr.s2) { tr.s2 = 1; say(pick(L.gTwang), 'sad'); }
        } else fx.spawn('note', g.x + rnd(-6, 6), g.y - 6, { vx: rnd(-30, 30), vy: rnd(-28, -16), life: 1.2, c: tr.n % 3, wob: 7 });
        if (tr.n === 1) { if (ag.babble) { AUDIO.play('giggle'); face('happy', 'laugh', 0.9); } else say(pick(L.guitar), 'happy'); }
      }
    }
    if (tr.gp === 'pack' && !tr.s3) { tr.s3 = 1; GAME.stat('fun', 6); if (!ag.babble && !mk.talk && Math.random() < 0.6) say(pick(L.gEnd)); }
  }
  function crookedNote(ctx, P, p, x, y, k) { // an out-of-tune note: grey, leaning, its stem wobbling
    const G = ['...nn', '..n.n', '..n..', '.n...', 'nn...', 'nn...'], w = Math.round(Math.sin(p.age * 11)); ctx.globalAlpha = Math.max(0, 1 - k * k);
    G.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === 'n') P.p(Math.round(x) - 2 + i + (j < 3 ? w : 0), Math.round(y) - 3 + j, j > 3 ? '#6a7088' : '#9aa0b8'); }); ctx.globalAlpha = 1;
  }
  function guitarPose(p, tr) {
    p.legs = 'stand'; p.back = 0; if (tr.ph !== 'do') return;
    if (tr.baby) { // slaps: the right paw up, then flat on the bag; the whine: eyes shut, mouth open, a tear, the head shaking
      const s = GAME.ageDef().s, M = (x, y) => [Math.round((x - mk.x) / s), Math.round((y - mk.y - mk.jy) / s), 1];
      if (tr.gp === 'slap') { const d = tr.t - (tr.slapT == null ? -9 : tr.slapT), hy = ZAL.GTR[1] + ZAL.GH - 32; p.armR = d < 0.16 ? M(ZAL.GTR[0] + 5, hy) : M(ZAL.GTR[0] - 2, hy - 14); p.armL = [-17, -15]; p.eyes.look = [1, 0]; if (d < 0.16) { p.eyes.mode = 'closed'; p.mouth = 'o'; } p.bob = d < 0.1 ? 1 : 0; return; }
      const k = tr.t - GB.whine; p.hx = k < 1.3 ? (Math.floor(k * 6) % 2 ? 3 : -3) : 0; p.eyes.mode = 'closed'; p.mouth = 'open'; p.open = 1; p.tear = 1; p.blush = 1; p.pose = k < 1.3 ? 'shrug' : 'idle'; return;
    }
    const s = GAME.ageDef().s, g = gPos(tr), d = gDir(g.a), gp = tr.gp, b = Math.floor(tr.t * 3) % 2;
    const M = (x, y) => [Math.round((x - mk.x) / s), Math.round((y - mk.y - mk.jy) / s), 1]; // a screen point → an arm target (in front of him)
    if (gp === 'open') { // reaches for the lock, runs the zip down the bag's side, then looks in pleased
      if (tr.t < GT.reach) { p.armR = M(ZAL.GTR[0] + 8, ZAL.GTR[1] + 8); p.armL = [-17, -15]; p.eyes.look = [1, 0]; return; }
      const k = Math.min(1, (tr.t - GT.reach) / (GT.zip - GT.reach));
      const zy = Math.max(ZAL.GTR[1] + 7 + 43 * k, mk.y - 70 * s);
      p.armR = M(ZAL.GTR[0] + (zy - ZAL.GTR[1] < 33 ? 8 : 3), zy); p.armL = [-17, -15]; p.eyes.look = [1, zy < mk.y - 60 * s ? -1 : 0];
      if (tr.t >= GT.zip) { p.eyes.mode = 'happy'; if (!mk.talk) p.mouth = 'smile'; }
      return;
    }
    if (gp === 'zip') { // zips the case back up: hand pulls from bottom to top lock
      if (tr.t >= GT.shut) { p.armR = [19, -40]; p.armL = [-17, -15]; p.eyes.mode = 'happy'; if (!mk.talk) p.mouth = 'smile'; return; }
      const k = Math.max(0, Math.min(1, (tr.t - GT.zip2) / (GT.shut - GT.zip2)));
      const zy = Math.max(ZAL.GTR[1] + 7 + 43 * (1 - k), mk.y - 70 * s);
      p.armR = M(ZAL.GTR[0] + (zy - ZAL.GTR[1] < 33 ? 8 : 3), zy); p.armL = [-17, -15]; p.eyes.look = [1, 0];
      return;
    }
    if (gp === 'take' || gp === 'pack') { p.armR = M(g.x + d.hx * 14, g.y + d.hy * 14); p.armL = M(g.x - d.ux * 2, g.y - d.uy * 2); p.eyes.look = [g.x > mk.x + 4 ? 1 : 0, 1]; return; }
    // strum: a fast down-stroke on each strum, then the paw drifts back up
    const k = tr.sp < 0.09 ? tr.sp / 0.09 : 1 - (tr.sp - 0.09) / Math.max(0.1, (tr.iv || 0.45) - 0.09), st = -4 + 8 * Math.max(0, Math.min(1, k)), sx = g.x - d.hx * 4 * g.sc + d.ux * st, sy = g.y - d.hy * 4 * g.sc + d.uy * st; // over the lower bout, so the sound hole stays in sight
    if (gSmall()) { p.armL = M(sx, sy); p.armR = b ? [22, -58] : [19, -50]; p.eyes.look = [-1, 1]; }
    else { const kf = 25 * ZAL.GK * g.sc; p.armL = M(sx, sy); p.armR = M(g.x + d.hx * kf, g.y + d.hy * kf); p.eyes.look = [-1, 1]; }
    p.bob = tr.sp < 0.15 ? 1 : 0;
    if (tr.wince > 0) { p.eyes = { mode: 'closed' }; p.mouth = 'wavy'; p.sweat = 1; }
    else if (!mk.talk && !mk.face) p.mouth = 'smile';
  }
  function drawGuitar(c, sp, x0, y0, front) { // in the open bag: behind him; on the way and in his hands: over him, his paws over the strings
    const tr = trip; if (!tr || tr.ph !== 'do' || tr.baby) return; const g = gPos(tr);
    if (g.inCase ? front || guitarCase() !== 'open' : !front) return;
    const gc = ZAL.guitarSpr(g.a, g.sc); c.drawImage(gc, Math.round(g.x) - gc.width / 2, Math.round(g.y) - gc.height / 2);
    if (!sp) return;
    const sc = GAME.ageDef().s;
    // Round 35: Draw left strumming arm and paw smoothly OVER the guitar body so the forearm never clips/disappears behind it
    if (sp.armL) {
      const sh = [x0 + sp.ox + sp.armL.sh[0], y0 + sp.oy + sp.armL.sh[1]];
      const ctrl = [x0 + sp.ox + sp.armL.ctrl[0], y0 + sp.oy + sp.armL.ctrl[1]];
      const hand = [x0 + sp.ox + sp.armL.hand[0], y0 + sp.oy + sp.armL.hand[1]];
      const w = 7.5 * sc;
      c.save();
      c.beginPath();
      const seg = (p1, p2) => {
        const dx = p2[0] - p1[0], dy = p2[1] - p1[1], L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L * w, ny = dx / L * w;
        c.moveTo(p1[0] + nx, p1[1] + ny);
        c.lineTo(p2[0] + nx, p2[1] + ny);
        c.lineTo(p2[0] - nx, p2[1] - ny);
        c.lineTo(p1[0] - nx, p1[1] - ny);
        c.closePath();
      };
      seg(sh, ctrl);
      seg(ctrl, hand);
      c.ellipse(sh[0], sh[1], w, w, 0, 0, Math.PI * 2);
      c.ellipse(ctrl[0], ctrl[1], w, w, 0, 0, Math.PI * 2);
      c.ellipse(hand[0], hand[1], w * 1.1, w * 1.15, 0, 0, Math.PI * 2);
      c.clip();
      c.drawImage(sp.cv, x0, y0);
      c.restore();
    }
    // Also draw the fretting paw on the guitar neck
    if (sp.handR) {
      const hx = x0 + sp.ox + sp.handR.x, hy = y0 + sp.oy + sp.handR.y;
      c.save(); c.beginPath(); c.ellipse(hx, hy, 5.5 * sc + 1.8, 6.0 * sc + 2.0, 0, 0, Math.PI * 2); c.clip(); c.drawImage(sp.cv, x0, y0); c.restore();
    }
  }
  function tripOpen() { const tr = trip; if (!tr || tr.opened) return; tr.opened = true;
    if (tr.auto) { tr.food = tr.auto.pick(); if (tr.food) fx.spawn('img', mk.x, headTop() + 30, { img: ART.food(tr.food), vx: 0, vy: -40, g: 0, life: 0.6 }); else AUDIO.play('nope'); return; } // Round 14: by himself — no shop sheet
    if (!UI.sheetOpen && !UI.hasModal() && APP.scene === 'home') tr.D.open(); }
  function seatY() { const sp = ROOMS.spots('balcony', S().home.items) || {}; return (sp.seat ? sp.seat[1] : 231) + (18.5 - 5.2 * GAME.fat()) * GAME.ageDef().s; }
  function walkTick(tr, dt) { // follow the path; true once there
    const ag = GAME.ageDef(), v = (62 + 30 * ag.s) * (1 - 0.2 * GAME.fat()) * (sneaking ? 0.55 : 1); let left = v * dt; // Round 15b #3: on tiptoe — slower
    while (left > 1e-6 && tr.i < tr.path.length) {
      const q = tr.path[tr.i], dx = q[0] - tr.mx, dy = q[1] - tr.my, d = Math.hypot(dx, dy); if (Math.abs(dx) > 0.5) tr.dir = Math.sign(dx);
      if (d <= left) { tr.mx = q[0]; tr.my = q[1]; tr.i++; left -= d; } else { tr.mx += dx / d * left; tr.my += dy / d * left; left = 0; }
    }
    tr.stepPh += dt * Math.min(12, v / Math.max(5, 11 * ag.s)); const st = Math.floor(tr.stepPh);
    if (st !== tr.step) { tr.step = st; if (st % 2 === 0) AUDIO.play('step'); }
    return tr.i >= tr.path.length;
  }
  function tripTick(dt) {
    const tr = trip, D = tr.D, s = GAME.ageDef().s, held = () => UI.sheetOpen || UI.hasModal() || APP.scene !== 'home' || !!(D.hold && D.hold()); tr.t += dt;
    if (tr.kind === 'vac') { vacTrip(tr, dt); return; }
    if (tr.kind === 'rack') { rackTrip(tr, dt); return; }
    if (tr.stool && stoolTick(tr, dt)) return;
    if (tr.kind === 'walk') { tr.shY = tr.my; if (walkTick(tr, dt)) { rest.x = tr.mx; rest.y = tr.my; trip = null; if (tr.then) tr.then(); } return; }
    if (tr.kind === 'knob' && tr.ph === 'go' && !tr.got && tr.i >= 1) { tr.got = true; GAGS.knobPick(); if (!GAME.ageDef().babble) say(pick(DATA.LINES.g_knobPick || ['Ага, вот ты где!'])); }
    if (tr.ph === 'go') {
      tr.shY = tr.my;
      if (walkTick(tr, dt)) { tr.t = 0; if (D.sit || tr.climb) { tr.ph = 'sit'; tr.y0 = tr.my; tr.x0 = tr.mx; tr.seatY = tr.kind === 'toilet' ? 208 : (tr.climb ? tr.cy : D.floor ? tr.my + (18.5 - 5.2 * GAME.fat()) * s : seatY()); if (!tr.stool) AUDIO.play('jump'); } else { tr.ph = 'do'; if (tr.kind === 'fridge') AUDIO.play('fridge'); if (tr.kind === 'mirror') mirrorPose(tr); } }
    } else if (tr.ph === 'sit' && tr.hops) { // Round 15b #4: up in a few hops (onto the bed rail, then the footboard post)
      if (tr.x0h === undefined) tr.x0h = tr.mx; const H = tr.hops, i = Math.min(H.length - 1, Math.floor(tr.t / HOP_T)), k = Math.min(1, (tr.t - i * HOP_T) / HOP_T), a = i ? H[i - 1] : [tr.x0h, tr.y0], b = H[i];
      if ((tr.hopN || 0) <= i) { tr.hopN = i + 1; if (i) AUDIO.play('creak'); }
      tr.mx = a[0] + (b[0] - a[0]) * k; tr.my = a[1] + (b[1] - a[1]) * k - Math.sin(Math.PI * k) * 10 * Math.max(0.6, s); tr.shY = b[1]; tr.dir = 1;
      if (tr.t >= H.length * HOP_T) { tr.ph = 'do'; tr.t = 0; tr.mx = b[0]; tr.my = b[1]; tr.shY = b[1]; }
    } else if (tr.ph === 'sit') { // hop up onto the office chair / toilet, turning around in the air
      const k = Math.min(1, tr.t / 0.45);
      const targetX = tr.kind === 'toilet' ? 22 : tr.mx;
      tr.mx = (tr.x0 !== undefined ? tr.x0 : tr.mx) + (targetX - (tr.x0 !== undefined ? tr.x0 : tr.mx)) * k;
      tr.my = tr.y0 + (tr.seatY - tr.y0) * k - Math.sin(Math.PI * k) * (D.floor ? 6 : 14) * Math.max(0.6, s);
      tr.seat = k > 0.5 ? 1 : 0; tr.shY = tr.climb || D.floor ? tr.y0 : GY;
      if (k >= 1) { tr.ph = 'do'; tr.t = 0; tr.mx = targetX; tr.my = tr.seatY; tr.shY = tr.climb ? tr.seatY : D.floor ? tr.y0 : null; if (D.floor) conOn(tr); else AUDIO.play('creak'); if (tr.climb && tr.kind === 'fridge') AUDIO.play('fridge'); }
    } else if (tr.ph === 'do' || tr.ph === 'wait') {
      if (tr.kind === 'fridge') tr.door = Math.min(1, tr.door + dt / 0.3);
      tripBusy(tr, dt);
      if (tr.ph === 'do' && tr.t >= D.dur) { if (!tr.opened) tripOpen(); tr.t = 0; tr.ph = D.wait && held() ? 'wait' : 'back'; if (tr.ph === 'back') tripLeave(tr); }
      else if (tr.ph === 'wait' && !held()) { tr.ph = 'back'; tr.t = 0; tripLeave(tr); }
    } else if (tr.ph === 'back') {
      if (tr.t < D.lead) { // first shut the fridge / hop off the chair
        const k = tr.t / D.lead; if (tr.kind === 'fridge') tr.door = 1 - k;
        if (tr.kind === 'toilet') {
          if (!tr.flushed) {
            tr.flushed = true; AUDIO.play('splash');
            for (let i = 0; i < 7; i++) fx.spawn('drop', 18 + rnd(-6, 6), 206, { vx: rnd(-15, 15), vy: rnd(-35, -10), g: 260, life: 0.6, c: '#8fd0f8' });
          }
          const y1 = tr.y0 || GY, x1 = tr.x0 || 28;
          tr.my = tr.seatY + (y1 - tr.seatY) * k - Math.sin(Math.PI * k) * 10 * Math.max(0.6, s);
          tr.mx = 22 + (x1 - 22) * k;
          tr.shY = y1;
        } else if (tr.kind === 'pc' || D.floor) {
          const y1 = D.floor ? tr.y0 : GY; tr.my = tr.seatY + (y1 - tr.seatY) * k - Math.sin(Math.PI * k) * (D.floor ? 6 : 10) * Math.max(0.6, s); tr.seat = k < 0.5 ? 1 : 0; tr.shY = y1;
        }
        if (tr.hops) { const H = [[tr.x0h, tr.y0], ...tr.hops].reverse(), i = Math.min(H.length - 2, Math.floor(tr.t / HOP_T)), q = Math.min(1, (tr.t - i * HOP_T) / HOP_T), a = H[i], b = H[i + 1];
          tr.mx = a[0] + (b[0] - a[0]) * q; tr.my = a[1] + (b[1] - a[1]) * q - Math.sin(Math.PI * q) * 8 * Math.max(0.6, s); tr.shY = b[1]; return; } // hops back down the same way
        if (tr.climb) { const j = Math.max(0, (k - 0.4) / 0.6); tr.my = tr.seatY + (tr.y0 - tr.seatY) * j - Math.sin(Math.PI * j) * 8 * Math.max(0.6, s); tr.shY = j > 0 ? tr.y0 : tr.seatY; } // shuts the door, then hops down
        return;
      }
      if (!tr.left) { tr.left = true; tr.door = 0; tr.seat = 0; if (tr.kind === 'fridge') AUDIO.play('fridgeClose'); if (tr.kind === 'pc' || tr.kind === 'toilet' || tr.climb || D.floor) { tr.my = tr.climb || D.floor ? tr.y0 : GY; if (tr.kind === 'toilet') tr.mx = tr.x0 || 28; else if (tr.hops) tr.mx = tr.x0h; AUDIO.play('step'); } }
      tr.shY = tr.my; if (walkTick(tr, dt)) { trip = null; if (tr.auto) tr.auto.after(tr.food || null); }
    }
  }
  function chairTick(dt) { // slides out of his way once he is past the table's left edge, scrapes, and goes back after him
    const want = room === 'kitchen' && trip && trip.kind === 'fridge' && !trip.climb && trip.mx > 108 ? CHAIR_DX : 0, d = want - chairDx;
    if (Math.abs(d) < 0.01) { chairMv = false; return; }
    if (!chairMv) { chairMv = true; AUDIO.play('scrape'); }
    chairDx += Math.sign(d) * Math.min(Math.abs(d), dt * 48);
  }
  // Round 14b #8: the stool in his paws — lifted from the floor (0.4 s), carried in front of him, put down at the counter, climbed;
  // after the pancakes he hops down, picks it up again and carries it back to its place by the sofa
  function stoolTick(tr, dt) {
    const sp = ROOMS.spots('kitchen', S().home.items) || {}, st = sp.stool, at = sp.stoolAt; if (!st || !at) return false;
    const grab = (x, y) => { tr.sAt = [x, y]; tr.sk = 0; stool = 'held'; AUDIO.play('lift'); };
    if (tr.ph === 'go' && tr.i >= 1 && !tr.got) { // at the stool: bends to it and lifts it
      if (stool !== 'held') { grab(st[0] + st[2] / 2, st[1]); tr.dir = -1; }
      tr.sk = Math.min(1, tr.sk + dt / 0.4); tr.shY = tr.my; if (tr.sk < 1) return true; tr.got = true; return false;
    }
    if (tr.ph === 'sit' && !tr.placed) { // at the counter: puts it down in front of him, then climbs up
      if (!tr.lower) { tr.lower = true; tr.sAt = [at[0], at[1]]; tr.dir = 1; }
      tr.sk = Math.max(0, tr.sk - dt / 0.3); tr.t = 0; tr.shY = tr.my;
      if (tr.sk > 0) return true; tr.placed = true; stool = 'placed'; AUDIO.play('thunk'); AUDIO.play('jump'); return true;
    }
    if (tr.ph === 'back' && tr.left && !tr.got2) { // hopped down: picks it up again
      if (stool === 'placed') grab(at[0], at[1]);
      tr.sk = Math.min(1, tr.sk + dt / 0.35); tr.shY = tr.my; if (tr.sk < 1) return true; tr.got2 = true; return false;
    }
    if (tr.ph === 'back' && tr.got2 && tr.i >= 1 && stool === 'held') { // back at its place: puts it down
      if (!tr.lower2) { tr.lower2 = true; tr.sAt = [st[0] + st[2] / 2, st[1]]; tr.dir = -1; }
      tr.sk = Math.max(0, tr.sk - dt / 0.3); tr.shY = tr.my; if (tr.sk > 0) return true; stool = 'home'; AUDIO.play('thunk'); return false;
    }
    return false;
  }
  function stoolArt(P, cx, by) { // a light wooden step stool: a top with a hand hole, one step, splayed legs, a brace
    const x = Math.round(cx) - 10, y = Math.round(by) - 26, W = '#d6a466', L = '#eec68a', D = '#a8743c', DD = '#6e4624';
    for (let j = 5; j < 26; j++) { const o = j >= 16 ? 1 : 0; P.r(x + 4 + o, y + j, 2, 1, DD); P.r(x + 14 - o, y + j, 2, 1, DD); } // the back legs
    for (let j = 5; j < 26; j++) { const o = j >= 16 ? 1 : 0; P.r(x + 1 - o, y + j, 3, 1, W); P.p(x + 3 - o, y + j, D); P.r(x + 16 + o, y + j, 3, 1, W); P.p(x + 16 + o, y + j, L); }
    P.r(x + 1, y + 13, 18, 2, L); P.r(x + 1, y + 15, 18, 2, W); P.r(x + 1, y + 17, 18, 1, D); // the step
    P.r(x + 2, y + 22, 16, 1, D); // the brace
    P.r(x, y, 20, 2, L); P.r(x, y + 2, 20, 3, W); P.r(x, y + 5, 20, 1, D); P.r(x + 7, y + 3, 6, 1, DD); P.p(x, y, W); P.p(x + 19, y, W); // the top, the hand hole
  }
  function stoolPos() { // where to draw it: [centre x, feet y] (held: lerp from the floor spot into his paws)
    const sp = ROOMS.spots('kitchen', S().home.items) || {}, st = sp.stool, at = sp.stoolAt; if (!st) return null;
    if (stool === 'home') return [st[0] + st[2] / 2, st[1]];
    if (stool === 'placed') return at ? [at[0], at[1]] : null;
    const tr = trip, k = tr && tr.stool ? tr.sk : 1, from = tr && tr.sAt ? tr.sAt : [mk.x, mk.y], sp2 = mk.sp, hy = mk.y + mk.jy + (sp2 && sp2.handR ? sp2.handR.y : -20);
    const top = Math.min(hy - 5, mk.y + mk.jy - 30), e = k * k * (3 - 2 * k);
    return [from[0] + (mk.x - from[0]) * e, from[1] + (top + 26 - from[1]) * e];
  }
  function drawStool(c, front) { // front: after him (in his paws, or he stands behind it)
    if (room !== 'kitchen') return; const q = stoolPos(); if (!q) return;
    const isFront = stool === 'held' || (stool === 'home' && mk.y < q[1]); if (isFront !== front) return;
    if (stool !== 'held') P.shadow(q[0], q[1], 12, 2, 0.25); stoolArt(P, q[0], q[1]);
  }
  function tripLeave(tr) { tr.path = tr.D.path.slice(0, -1).reverse().map((q) => q.slice()).concat([[rest.x, rest.y]]); tr.i = 0; if (!tr.D.lead) tr.left = true; }
  function tripBusy(tr, dt) { // rummaging: rustle, food / clothes flying out, keys clacking
    if (tr.kind === 'toilet') {
      if (!tr.puk && tr.t > 1.2) {
        tr.puk = true;
        AUDIO.play('puk');
        fx.spawn('ring', mk.x, mk.y - 12, { r0: 2, r1: 10, life: 0.4, c: '#ffffff' });
        face('wide', 'o', 0.5);
        later(0.5, () => { if (trip === tr) face('closed', 'smile', 2.0); });
        later(0.6, () => { if (trip === tr && !mk.talk) say(pick((DATA.LINES && DATA.LINES.toilet) || ['Фу-у-х!', 'Уединение...', 'Не подглядывай!', 'Кайф!', 'Жур-жур!']), 'happy'); });
        GAME.stat('clean', 2);
      }
      return;
    }
    if (tr.kind === 'mirror') { tr.pt = (tr.pt || 0) + dt; return; }
    if (tr.kind === 'winClose') {
      if (!tr.closed && tr.t > 0.45) {
        tr.closed = true;
        tr.opened = true;
        if (tr.D.open) tr.D.open();
        if (!GAME.ageDef().babble && Math.random() < 0.6) say('Фух! Теперь тепло.');
      }
      return;
    }
    if (tr.kind === 'knob') { if (!tr.scr && tr.t > 0.45) { tr.scr = true; AUDIO.play('screw'); } return; } // Round 10 #5: screwing the knob back on
    if (tr.kind === 'guitar') { guitarTick(tr, dt); return; }
    if (tr.kind === 'stove') { tr.fxT -= dt; if (GAME.little() && !tr.stool && mk.jy >= 0 && tr.fxT <= 0 && GAGS.cooking() && GAGS.cookPose() !== 'head') { tr.fxT = rnd(0.6, 1.0); hop(60); } return; } // the little one hops to see into the pan
    const fast = tr.ph === 'do'; tr.fxT -= dt; tr.sndT -= dt; if (!fast) return;
    const sp = mk.sp, hy = mk.y + (sp ? sp.head.y : -70);
    if (tr.kind === 'pc') { if (tr.sndT <= 0) { tr.sndT = rnd(0.25, 0.4); AUDIO.play('keys'); } return; }
    if (tr.kind === 'console') { if (tr.sndT <= 0) { tr.sndT = rnd(0.3, 0.5); AUDIO.play('pad'); } return; }
    if (tr.sndT <= 0) { tr.sndT = rnd(0.15, 0.28); AUDIO.play('rustle'); }
    if (tr.fxT > 0) return;
    if (tr.kind === 'fridge' && tr.door >= 1 && GAME.little() && mk.jy >= 0 && Math.random() < 0.5) hop(75); // the little one jumps to reach the shelves
    if (tr.kind === 'fridge' && tr.door >= 1) { tr.fxT = rnd(0.28, 0.42); const ids = TRIP_FOOD.filter((id) => DATA.FOODS[id]); fx.spawn('img', mk.x + rnd(-9, 9), hy - rnd(2, 12), { img: ART.food(pick(ids)), vx: rnd(-55, 55), vy: rnd(-120, -75), g: 380, life: 0.75 }); }
    if (tr.kind === 'wardrobe') { tr.fxT = rnd(0.12, 0.2); const [c, d] = pick(CLOTH_C), s = GAME.ageDef().s; fx.spawn('cloth', mk.x - 14 * s + rnd(-5, 5), mk.y - 62 * s + rnd(-8, 8), { c, d, vx: rnd(25, 95), vy: rnd(-125, -65), g: 340, life: 1.4, floor: rnd(242, 264) }); }
  }
  function tripPose(p) {
    const tr = trip, ph = tr.ph, walking = ph === 'go' || (ph === 'back' && tr.t >= tr.D.lead);
    const back = () => { p.back = 1; p.eyes = { mode: 'open' }; p.mouth = 'smile'; p.open = 0; p.blush = 0; p.tear = 0; p.sweat = 0; p.pose = 'idle'; p.hx = 0; };
    if (walking) {
      const f = ((tr.step % 4) + 4) % 4; p.legs = f === 0 ? 'walkR' : f === 2 ? 'walkL' : 'stand'; p.bob = f % 2 === 0 ? 1 : 0; p.eyes.look = [tr.dir, 0];
      if (p.pose === 'idle') { p.armL = f === 0 ? [-18, -18] : f === 2 ? [-16, -13] : [-17, -15]; p.armR = f === 0 ? [16, -13] : f === 2 ? [18, -18] : [17, -15]; }
      if (sneaking) { p.armL = [-13, -46]; p.armR = [13, -46]; p.bob = 0; p.eyes.look = [Math.floor(t * 1.5) % 2 ? tr.dir : -tr.dir, 0]; p.mouth = 'flat'; } // tiptoeing
      if (tr.stool && stool === 'held') { const lo = tr.sk < 1; p.armL = lo ? [-15, -24] : [-15, -40]; p.armR = lo ? [15, -24] : [15, -40]; if (lo) { p.legs = 'stand'; p.bob = 0; p.eyes.look = [tr.dir, 1]; } } // Round 14b #8: the stool in his paws
      return;
    }
    if (tr.kind === 'rack') { rackPose(p, tr); return; }
    if (tr.kind === 'toilet') {
      if (ph === 'sit' || ph === 'back') { p.legs = 'tuck'; return; }
      p.legs = 'tuck';
      p.bob = 0;
      p.armL = [-12, -32];
      p.armR = [12, -32];
      p.eyes = { mode: tr.t < 1.1 ? 'open' : (tr.t < 1.6 ? 'wide' : 'closed'), look: [1, 0] };
      p.mouth = (tr.t >= 1.1 && tr.t < 1.6) ? 'o' : 'smile';
      return;
    }
    if (tr.kind === 'winClose') {
      if (ph === 'sit' || ph === 'back') { p.legs = 'tuck'; p.pose = 'catch'; p.eyes = { mode: 'open', look: [1, -1] }; p.mouth = 'o'; return; }
      const sc = GAME.ageDef().s;
      const targetWin = tr.winRoom === 'balcony' ? [92, 108] : [80, 142];
      p.legs = 'stand';
      p.armR = [Math.round((targetWin[0] - tr.mx) / sc), Math.round((targetWin[1] - tr.my) / sc)];
      p.armL = [-16, -30];
      p.eyes = { mode: 'open', look: [-1, -1] };
      p.mouth = tr.t > 0.45 ? 'smile' : 'o';
      return;
    }
    if (tr.kind === 'knob') { // Round 15b #4: scrambling up / down the bed corner; up there his paw goes out to the radiator knob
      if (ph === 'sit' || ph === 'back') { p.legs = 'tuck'; p.pose = 'catch'; p.eyes = { mode: 'open', look: [1, -1] }; p.mouth = 'o'; return; }
      const sc = GAME.ageDef().s; p.legs = 'stand'; p.armR = [Math.round((KNOB_BED.knob[0] - tr.mx) / sc), Math.round((KNOB_BED.knob[1] - tr.my) / sc)]; p.armL = [-19, -33];
      p.eyes = { mode: 'open', look: [1, 0] }; p.mouth = Math.floor(tr.t * 6) % 2 ? 'flat' : 'smile'; return; }
    if (tr.kind === 'stove') { // back to us at the stove; the arm with the spatula goes up to the pan; a pancake on the head: he turns round, eyes wide
      const cp = GAGS.cookPose();
      if (tr.stool && stool === 'held') { p.armL = [-15, -40]; p.armR = [15, -40]; p.eyes.look = [tr.dir || 0, 1]; if (tr.sk < 1) { p.legs = 'stand'; p.bob = 0; } return; } // carrying the stool / bending to it
      if (tr.stool && ph === 'sit') { p.legs = 'tuck'; if (tr.t / 0.45 > 0.5) back(); return; } // scrambling up onto the stool
      if (tr.stool && ph === 'back' && tr.t < tr.D.lead) { back(); p.legs = tr.t >= tr.D.lead * 0.4 ? 'tuck' : 'stand'; return; } // hopping down
      if (cp === 'head') { p.legs = 'stand'; p.pose = 'idle'; p.eyes = { mode: 'wide', look: [0, -1] }; p.mouth = 'o'; p.open = 0.67; p.armL = [-23, -86]; p.armR = [23, -86]; return; }
      back(); p.legs = 'stand'; if (ph === 'back') return;
      const b = Math.floor(tr.t * 4) % 2, u = GAME.little() ? 1.18 : 1; // Round 14b #8: the little one stretches higher (on the stool his paw just reaches into the pan)
      if (cp === 'flip' || cp === 'toss') { p.armL = [-12, -92 * u]; p.armR = [24, -98 * u]; }
      else if (cp === 'pour') { p.armL = [-17, -15]; p.armR = [27, -94 * u]; }
      else if (cp === 'fry' || cp === 'fry2') { p.armL = [-17, -15]; p.armR = b ? [24, -86 * u] : [27, -90 * u]; }
      else { p.armL = [-17, -15]; p.armR = [22, -82 * u]; }
      return;
    }
    if (tr.kind === 'vac') { // on the vacuum: facing us, arms out, laughing; on the hop: arms up
      const b = Math.floor(tr.t * 4) % 2; p.legs = 'stand'; p.back = 0; p.pose = 'idle'; p.eyes = { mode: 'happy', look: [tr.dir || 0, 0] }; p.blush = 1;
      if (!mk.talk) { p.mouth = 'laugh'; p.open = 0.5; }
      if (ph === 'do') { p.armL = b ? [-30, -66] : [-28, -60]; p.armR = b ? [28, -60] : [30, -66]; p.bob = b; } else { p.armL = [-24, -74]; p.armR = [24, -74]; }
      return;
    }
    if (tr.kind === 'mirror') { // facing us, eyes on the mirror (left), blushing; the arms make the pose
      p.legs = 'stand'; p.back = 0; p.eyes.look = [-1, 0]; p.blush = 1; if (!mk.talk && p.mouth !== 'laugh') p.mouth = 'smile';
      if (ph !== 'do') return; const b = Math.floor((tr.pt || 0) * 3) % 2, q = tr.pose;
      if (q === 'flex') { p.pose = 'idle'; p.armL = b ? [-28, -74] : [-26, -69]; p.armR = b ? [28, -74] : [26, -69]; p.bob = b; if (!mk.talk) p.mouth = 'laugh'; }
      else if (q === 'hips') { p.pose = 'hips'; p.armL = null; p.armR = null; p.bob = b; }
      else if (q === 'comb') { p.pose = 'idle'; p.armL = [-17, -15]; p.armR = b ? [8, -88, 1] : [13, -92, 1]; p.eyes.look = [-1, -1]; }
      else if (q === 'kiss') { const k = (tr.pt || 0) % 1.4; p.pose = 'idle'; p.armL = [-17, -15]; p.armR = k < 0.6 ? [6, -60, 1] : [27, -74]; if (!mk.talk) { p.mouth = k < 0.6 ? 'o' : 'smile'; p.open = k < 0.6 ? 0.34 : 0; } p.eyes.mode = k < 0.6 ? 'happy' : 'open'; }
      else { p.pose = 'idle'; p.armL = [-17, -15]; p.armR = b ? [25, -84] : [21, -80]; } // waves at himself
      return;
    }
    if (tr.kind === 'guitar') { guitarPose(p, tr); return; }
    if (tr.kind === 'console') { // sitting on the floor with his back to us, the controller in both paws, thumbs going
      if (ph === 'sit') { p.legs = 'tuck'; if (tr.t / 0.45 > 0.5) { back(); p.legs = 'hidden'; } return; }
      if (ph === 'back') { p.legs = 'tuck'; return; } // getting up
      back(); p.legs = 'hidden'; p.bob = 0; const b = Math.floor(tr.t * (ph === 'do' ? 6 : 2.2)) % 2; p.armL = b ? [-16, -41] : [-15, -39]; p.armR = b ? [15, -39] : [16, -41]; return;
    }
    if (tr.kind === 'pc') {
      if (ph === 'sit') { p.legs = 'tuck'; if (tr.t / 0.45 > 0.5) back(); return; }
      if (ph === 'back') { p.legs = 'tuck'; return; } // hopping off the chair
      back(); p.legs = 'hidden'; p.bob = 0; const b = Math.floor(tr.t * (ph === 'do' ? 7 : 2.5)) % 2; p.armL = b ? [-20, -43] : [-19, -39]; p.armR = b ? [19, -39] : [20, -43]; return;
    }
    if (tr.climb && ph === 'sit') { p.legs = 'tuck'; if (tr.t / 0.45 > 0.5) back(); return; } // scrambling up onto the chair, turning to the fridge
    if (tr.climb && ph === 'back' && tr.t >= tr.D.lead * 0.4) { p.legs = 'tuck'; return; } // hopping down
    back(); p.legs = 'stand';
    if (ph === 'back') { p.armL = [-22, -62]; p.armR = [17, -15]; return; } // pushes the fridge door shut
    const b = Math.floor(tr.t * (ph === 'wait' ? 2.2 : tr.kind === 'wardrobe' ? 8 : 6)) % 2; p.bob = b;
    if (tr.kind === 'fridge') { p.armL = b ? [-21, -78] : [-15, -56]; p.armR = b ? [15, -56] : [21, -78]; }
    else { p.armL = b ? [-27, -62] : [-25, -48]; p.armR = b ? [8, -58] : [20, -50]; } // digs into the shelves on his left
  }
  // ---------- room hotspots ----------
  function inR(x, y, rx, ry, w, h) { return x >= rx && y >= ry && x < rx + w && y < ry + h; }
  function furR(key, fn, x, y) { const c = ROOMS.fur(key, fn); return [x, y, c.width, c.height]; }
  // every thing in the flat: GAGS first takes a few taps before the old handlers (pigeon, bed, parcel, doorbell, stove, gnome), then the rest after them
  function hotspot(x, y) { return (room === 'zal' && GAME.placed('guitar') && ZAL.guitarHit(x, y) ? { fn: () => tripStart('guitar') } : null) || GAGS.hit(room, x, y, true) || hotspot0(x, y) || GAGS.hit(room, x, y, false); } // the guitar bag stands in front of the drape / radiator
  function soapTap() {
    if (room !== 'bath' || S().sleeping) return;
    AUDIO.play('pop');
    if (!mk.scrubSnd || t - mk.scrubSnd > 0.13) { mk.scrubSnd = t; AUDIO.play('scrub'); }
    for (let i = 0; i < 6; i++) {
      addFoam(mk.x + rnd(-14, 14), mk.y - rnd(25, 75));
    }
    if (showerSt) showerSt.soaped = true;
    GAME.stat('clean', 5);
    say(pick(['Мылимшя!', 'Школько пены!', 'Пенная вечеринка!']), 'happy');
  }
  function hotspot0(x, y) {
    const it = S().home.items, F = ROOMS.FUR, FL = ROOMS.FLOOR;
    const H = (r, fn) => (r && inR(x, y, ...r) ? { fn } : null);
    const sp = ROOMS.spots(room, it) || {}, flip = () => { AUDIO.play('click'); }, tvTap = () => { tvOn = !tvOn; AUDIO.play('click'); if (S().sleeping) return; if (tvOn) act('tv'); else face('open', 'o', 0.6); };
    if (room === 'zal') {
      return H(sp.light, () => toggleLight())
        || H(sp.bed, () => toggleLight())
        || H(sp.tv, tvTap)
        || H(sp.soundbar, () => sbTap(sp.soundbar))
        || H(sp.switch2, () => tripStart('console', 'switch2'))
        || H(sp.ps5, () => tripStart('console', 'ps5'))
        || H(sp.fire, () => fireTap(sp.fire));
    }
    if (room === 'hall') {
      const sc = (sp.sconces || []).find((r) => inR(x, y, r[0] - 2, r[1] - 2, r[2] + 4, r[3] + 4));
      if (sc) return { fn: () => { AUDIO.play('switch'); th.sconces = !th.sconces; } };
      return H(sp.plafond, () => { AUDIO.play('switch'); th.sconces = !th.sconces; })
        || H(sp.wardrobe, () => { if (trip && trip.kind === 'wardrobe') tripOpen(); else tripStart('wardrobe'); })
        || H(sp.mirror, () => tripStart('mirror'));
    }
    if (room === 'kitchen') {
      return H(sp.kettle, () => kettleTap(sp.kettle))
        || H(sp.micro, () => microTap(sp.micro))
        || H(sp.fridge, () => { if (trip && trip.kind === 'fridge') tripOpen(); else tripStart('fridge'); })
        || (it.disco ? H(sp.disco, () => { AUDIO.play('star'); act('dance'); }) : null)
        || (it.lamp ? H(sp.lamp, () => { AUDIO.play('switch'); kitchenLamp = !kitchenLamp; }) : null)
        || H(sp.ceilingLight, () => { AUDIO.play('switch'); kitchenLamp = !kitchenLamp; })
        || H(sp.light, () => { AUDIO.play('switch'); kitchenLamp = !kitchenLamp; });
    }
    if (room === 'bath') {
      return (it.duck ? H(sp.duck, () => { AUDIO.play('boop'); const [dx, dy] = sp.duck; fx.spawn('ring', dx + 9, dy + 9, { r0: 2, r1: 8, life: 0.3 }); fx.spawn('note', dx + 9, dy - 2, { vy: -14, life: 1, c: 1 }); }) : null)
        || H(sp.sponge, () => soapTap())
        || H(sp.mirror, () => { act('mirror'); say(pick(['Крашавчик!', 'Ну я и пушиштик!', GAME.isSkuf() ? 'Шолидный мужчина.' : GAME.ageDef().age < 0.4 ? 'Какой я милашка!' : 'Какой штройный!'])); })
        || H(sp.shower, () => shower())
        || H(sp.sink, () => soapTap())
        || H(sp.faucet, () => soapTap())
        || H(sp.toilet, () => { if (trip && trip.kind === 'toilet') { trip.ph = 'back'; trip.t = 0; tripLeave(trip); } else tripStart('toilet'); });
    }
    if (room === 'balcony') {
      const bi = treeAt(x, y); if (bi >= 0) return { fn: () => harvestAt(bi) };
      return H(sp.palm, () => {
        if (S().inv.fertilizer > 0 && S().tree.n < GAME.treeMax()) fertilize();
        else waterTree();
      })
      || H(sp.lava, () => { AUDIO.play('switch'); th.balLamp = !balLampOn(); }) || H(sp.radio, () => radioTap())
      || H(sp.pc, () => tripStart('pc')) || H(sp.chair, () => tripStart('pc')) || (!sp.pc ? H(sp.desk, () => noPc()) : null)
      || (it.telescope ? H(sp.telescope, () => { AUDIO.play('star'); act('wow'); say(pick(ROOMS.phase() === 'night' ? ['Звёзды!', 'Вижу Луну!'] : ['Вижу голубей!', 'Вон наш двор!'])); }) : null)
      || (it.feeder ? H(sp.feeder, () => { AUDIO.play('flap'); for (let i = 0; i < 4; i++) fx.spawn('spark', sp.feeder[0] + 8 + rnd(-6, 6), sp.feeder[1] + 12, { life: 0.6, vy: -10 }); }) : null);
    }
    return null;
  }

  // ---------- yard: banana tree ----------
  function bananaRect(k) {
    const sp = ROOMS.spots('balcony', S().home.items);
    const slots = (sp && sp.slots) || [[14, 60], [25, 66], [36, 60], [19, 72], [31, 74]];
    const [x, y] = slots[k] || [25, 66];
    return [x - 11, y + 8, 10, 12];
  }
  function treeAt(x, y) {
    const maxN = typeof GAME !== 'undefined' && GAME.treeMax ? GAME.treeMax() : 5;
    for (let k = maxN - 1; k >= 0; k--) {
      if (!tree[k]) continue;
      const [bx, by, w, h] = bananaRect(k);
      if (inR(x, y, bx - 3, by - 3, w + 6, h + 6)) return k;
    }
    return -1;
  }
  function syncTree(silent) {
    const maxN = typeof GAME !== 'undefined' && GAME.treeMax ? GAME.treeMax() : 5;
    const n = Math.max(0, Math.min(maxN, S().tree.n));
    let have = tree.filter(Boolean).length;
    while (have < n) {
      const k = tree.indexOf(false);
      if (k < 0 || k >= maxN) break;
      tree[k] = true;
      have++;
      if (!silent) {
        const [bx, by] = bananaRect(k);
        for (let i = 0; i < 4; i++) fx.spawn('spark', bx + 5 + rnd(-6, 6), by + 6 + rnd(-6, 6), { life: 0.7 });
      }
    }
    while (have > n) { const k = tree.lastIndexOf(true); tree[k] = false; have--; }
  }
  function harvestAt(k) {
    if (!tree[k]) return; tree[k] = false; if (!GAME.harvest()) { tree[k] = true; return; }
    const [bx, by] = bananaRect(k); falling.push({ x: bx + 5, y: by + 6, vx: rnd(-8, 14), vy: -30, rot: 0, vr: rnd(-6, 6), st: 'fall', t: 0, bounced: 0 });
    AUDIO.play('pop'); for (let i = 0; i < 3; i++) fx.spawn('leaf', bx + 5, by, { vx: rnd(-20, 20), vy: rnd(0, 30), g: 40, life: 1.2, wob: 6 });
    lookAt(bx, by, 1.2); face('wide', 'o', 0.6);
  }
  function fallTick(dt) {
    for (let i = falling.length - 1; i >= 0; i--) {
      const b = falling[i]; b.t += dt;
      if (b.st === 'fall') { b.vy += 520 * dt; b.y += b.vy * dt; b.x += b.vx * dt; b.rot += b.vr * dt; const gy = 258; if (b.y >= gy) { b.y = gy; if (!b.bounced && b.vy > 80) { b.vy = -b.vy * 0.35; b.bounced = 1; AUDIO.play('hit'); } else { b.st = 'ground'; b.t = 0; b.rot = 0; } } }
      else if (b.t > 0.25 && !b.got) { b.got = 1; AUDIO.play('harvest'); const ty = topY(); UI.float(b.x, b.y + ty - 14 - camY, '+1', UI.F('banana')); fx.spawn('spark', b.x, b.y - 4, { life: 0.5 }); face('happy', 'laugh', 0.9); if (Math.random() < 0.4) say(pick(['Швежий банан!', 'Прямо ш ветки!', 'Урожай!'])); }
      if (b.st === 'ground' && b.t > 0.6) falling.splice(i, 1);
    }
  }
  function waterTree() {
    if (room !== 'balcony') return; const s = S();
    const res = GAME.water();
    if (!res) { const m = Math.max(1, Math.ceil((s.tree.water - Date.now()) / 60e3)); UI.toast(`Уже полито. Ещё ${m} мин бананы растут быстрее`, UI.I('can')); AUDIO.play('nope'); return; }
    const stg = GAME.treeStage();
    watering = { t: 0, stg }; AUDIO.play('water'); later(0.5, () => AUDIO.play('water')); later(1.1, () => AUDIO.play('water'));
    const names = ['Саженец', 'Молодая пальма', 'Подросшая пальма', 'Пышная пальма', 'Взрослая пальма'];
    if (res === 'grew') {
      AUDIO.play('star');
      UI.toast(`Пальма подросла: «${names[stg]}»! (Урожай до ${GAME.treeMax()} бананов) 🌱✨`, UI.I('sprout'), 'gold', 4500);
      celebrate();
    } else {
      UI.toast(`Полито! (${names[stg]}, урожай: до ${GAME.treeMax()} бананов). Бананы растут быстрее 💧`, UI.I('can'));
      face('happy', 'smile', 1.5);
    }
    syncTree();
  }
  function fertilize() {
    if (room !== 'balcony') return; if (!GAME.fertilize()) { AUDIO.play('nope'); return; }
    AUDIO.play('star'); for (let i = 0; i < 14; i++) fx.spawn('spark', 30 + rnd(-24, 24), 70 + rnd(-16, 16), { life: rnd(0.5, 1.1), vy: -8 });
    UI.toast('Удобрено! На дереве выросли бананы', UI.F('fertilizer')); syncTree(); UI.setBar('balcony');
  }

  // ---------- tools: food & soap ----------
  function startTool(kind, e, id) {
    if (tool || trans || APP.scene !== 'home' || trip) return; AUDIO.init();
    const p = (e && e.clientX !== undefined) ? APP.toLogical(e.clientX, e.clientY) : (id && id.x ? id : { x: 90, y: 160 });
    const from = e && e.currentTarget && e.currentTarget.getBoundingClientRect ? e.currentTarget.getBoundingClientRect() : null;
    let home = from ? APP.toLogical(from.left + from.width / 2, from.top + from.height / 2) : { x: p.x, y: p.y };
    if (kind === 'soap') {
      const sp = ROOMS.spots('bath', S().home.items) || {};
      if (sp.sponge) home = { x: sp.sponge[0] + sp.sponge[2] / 2, y: sp.sponge[1] + sp.sponge[3] / 2 };
    }
    if (kind === 'food' && S().sleeping) { sleepyPoke(); return; }
    const ty = topY();
    const homeY = kind === 'soap' ? home.y : home.y - ty + camY;
    tool = { kind, id, x: p.x, y: p.y - ty + camY, dy: (e && e.pointerType === 'touch') ? -16 : -4, pid: e ? e.pointerId : undefined, img: ART.food(kind === 'soap' ? 'soap' : id), home: { x: home.x, y: homeY }, near: 0, back: null, acc: 0, lx: p.x, ly: p.y };
    AUDIO.play('pop');
    window.addEventListener('pointermove', toolMove); window.addEventListener('pointerup', toolUp); window.addEventListener('pointercancel', toolUp);
  }
  function unbind() { window.removeEventListener('pointermove', toolMove); window.removeEventListener('pointerup', toolUp); window.removeEventListener('pointercancel', toolUp); }
  function cancelTool() { if (tool) { unbind(); tool = null; } }
  function toolMove(e) {
    if (!tool || tool.back || (tool.pid !== undefined && e.pointerId !== tool.pid)) return;
    const p = APP.toLogical(e.clientX, e.clientY); const nx = p.x, ny = p.y - topY() + camY; const d = Math.hypot(nx - tool.x, ny - tool.y); tool.x = nx; tool.y = ny;
    if (tool.kind === 'soap') {
      const px = tool.x, py = tool.y + tool.dy;
      if (mk.sp && SPR.hit(mk.sp, px - mk.x0, py - mk.y0)) { mk.scrub = t + 0.35; tool.acc += d; while (tool.acc > 3.5) { tool.acc -= 3.5; addFoam(px, py); } }
    }
  }
  function toolUp(e) {
    if (!tool || tool.back || (tool.pid !== undefined && e && e.pointerId !== undefined && e.pointerId !== tool.pid)) return; unbind();
    if (tool.kind === 'food') { const m = mouthPos(); const d = Math.hypot(tool.x - m.x, tool.y + tool.dy - m.y); if (d < 24 && feed(tool.id)) { tool = null; return; } }
    if (tool.kind === 'soap') {
      if (tool.acc < 3.5) {
        soapTap();
      }
    }
    tool.back = { t: 0, x0: tool.x, y0: tool.y };
  }
  function toolTick(dt) {
    if (tool.back) { const b = tool.back; b.t += dt * 4; const k = Math.min(1, b.t); tool.x = b.x0 + (tool.home.x - b.x0) * k; tool.y = b.y0 + (tool.home.y - tool.dy - b.y0) * k; if (b.t >= 1) tool = null; return; }
    if (tool.kind === 'food') { const m = mouthPos(); const d = Math.hypot(tool.x - m.x, tool.y + tool.dy - m.y); tool.near = d < 44 ? Math.min(1, 1 - (d - 12) / 32) : 0; lookAt(tool.x, tool.y + tool.dy, 0.25); }
  }
  function addFoam(x, y) {
    if (foam.length < 90) { foam.push({ x: x - mk.x + rnd(-2.5, 2.5), y: y - (mk.y + mk.jy) + rnd(-2.5, 2.5), r: rnd(2, 4.4), k: 0 }); GAME.stat('clean', 0.8); }
    if (!mk.scrubSnd || t - mk.scrubSnd > 0.13) { mk.scrubSnd = t; AUDIO.play('scrub'); }
    if (Math.random() < 0.25) fx.spawn('bubble', x + rnd(-6, 6), y + rnd(-4, 4), { r: Math.floor(rnd(0, 3)), vy: rnd(-26, -12), vx: rnd(-8, 8), life: rnd(0.8, 1.4), wob: 4 });
    if (Math.random() < 0.035) AUDIO.play('giggle');
  }
  function feed(id) {
    const s = S(); if (s.sleeping) { sleepyPoke(); return false; }
    if (!GAME.ageOK(DATA.FOODS[id])) { AUDIO.play('nope'); say('Мне такое ещё рано!', 'sad'); UI.toast(`${DATA.FOODS[id].name} — с этапа «${DATA.AGES[DATA.FOODS[id].age].name}»`, UI.I('sprout')); return false; }
    const r = GAME.eat(id); if (!r) { AUDIO.play('nope'); return false; }
    AUDIO.play('chomp'); UI.carUpdate(); mk.act = null; mk.talk = null; UI.hideBubble(); bubbleOn = false;
    mk.eat = { t: 0, dur: 1.25, id, yuck: id === 'salad', over: r.over, dk: r.dk, cT: 0 };
    const m = mouthPos(), ty = topY(); UI.float(m.x + 16, m.y + ty - 18 - camY, '+' + Math.round(r.F.food || 0), UI.I('food'));
    if (Math.abs(r.dk) >= 0.3) later(0.55, () => UI.float(mk.x - 30, mk.y + ty - 44 - camY, (r.dk > 0 ? '+' : '−') + kgStr(Math.abs(r.dk)) + ' кг', UI.I('scale')));
    return true;
  }
  function eatTick(dt) {
    const e = mk.eat; e.t += dt; e.cT -= dt; const m = mouthPos();
    if (e.cT <= 0 && e.t < e.dur - 0.2) { e.cT = 0.11; const c = FOODC[e.id] || '#e8c070'; fx.spawn('crumb', m.x + rnd(-5, 5), m.y + 2, { c, sz: Math.random() < 0.4 ? 2 : 1, vx: rnd(-30, 30), vy: rnd(-40, -10), g: 320, life: 1, floor: GY + rnd(-3, 3) }); if (Math.random() < 0.4) AUDIO.play('chomp'); }
    if (e.t >= e.dur) {
      mk.eat = null; AUDIO.play('gulp'); const id = e.id;
      if (e.over) { later(0.3, () => { AUDIO.play('burp'); const mm = mouthPos(); for (let i = 0; i < 4; i++) fx.spawn('puff', mm.x + rnd(-4, 4), mm.y + rnd(-2, 2), { c: '#cfe8a0', r0: 1, r1: rnd(4, 7), vx: rnd(-20, 20), vy: rnd(-25, -8), life: 0.7, alpha: 0.7 }); face('closed', 'o', 0.6); later(0.6, () => say(pick(L.full))); }); return; }
      if (e.yuck) { face('closed', 'wavy', 1); later(0.3, () => say(pick(L.yuck), 'sad')); return; }
      if (id === 'coffee' || id === 'energy') { act('wow'); for (let i = 0; i < 6; i++) fx.spawn('spark', mk.x + rnd(-24, 24), mk.y - rnd(40, 100), { life: 0.6 }); if (Math.random() < 0.6) later(0.2, () => say(id === 'coffee' ? 'Бодрячком!' : 'Вжух! Я заряжен!', 'happy')); return; }
      if (id === 'potion') { for (let i = 0; i < 8; i++) fx.spawn('heart', mk.x + rnd(-26, 26), mk.y - rnd(40, 100), { vy: -20, life: 1.2, wob: 5 }); act('dance'); return; }
      if (id === 'cake') { confetti(24); }
      if (id === 'tea') { for (let i = 0; i < 6; i++) fx.spawn('spark', mk.x + rnd(-20, 20), mk.y - rnd(20, 60), { life: 0.8 }); later(0.2, () => say('Чувштвую лёгкошть!', 'happy')); return; }
      if (GAME.fat() > 0.45 && Math.random() < 0.6) act('belly'); else face('happy', 'smile', 1);
      if (Math.random() < 0.45) later(0.25, () => say(pick(L.yum), 'happy'));
    }
  }
  function confetti(n) { const cs = ['#ff5c6c', '#ffd23a', '#3fdc7a', '#59c1ff', '#b48cff', '#ffffff']; for (let i = 0; i < n; i++) fx.spawn('confetti', rnd(10, 170), rnd(30, 90), { c: pick(cs), vx: rnd(-30, 30), vy: rnd(-20, 30), g: 90, drag: 0.8, life: rnd(1.4, 2.4), wob: 5 }); }

  // ---------- bath: shower ----------
  function shower() {
    if (room !== 'bath' || showerSt || S().sleeping) return; mk.act = null;
    showerSt = { t: 0, dur: 3.4, foam0: foam.length, snd: 0 }; UI.updateBar(); later(0.4, () => { if (showerSt) say(pick(['Ля-ля-ля!', 'Тёпленькая!', 'Буль-буль!'])); });
  }
  function showerTick(dt) {
    const sh = showerSt; sh.t += dt; sh.snd -= dt; if (sh.snd <= 0 && sh.t < sh.dur - 0.3) { AUDIO.play('shower'); sh.snd = 0.22; }
    if (sh.t < sh.dur - 0.35) { if (Math.random() < dt * 3) fx.spawn('puff', mk.x + rnd(-30, 30), mk.y - rnd(60, 110), { r0: rnd(2, 4), r1: rnd(7, 11), vy: -rnd(6, 14), vx: rnd(-5, 5), life: rnd(1, 1.6), c: '#ffffff', alpha: 0.3, fadeIn: 0.3 }); const n = Math.floor(dt * 170 + Math.random()); for (let i = 0; i < n; i++) { const x = 80 + Math.random() * 20; fx.spawn('drop', x, 122, { vx: (x - 90) * rnd(1.4, 2.6), vy: rnd(110, 150), g: 260, life: 1.4, long: 1, floor: GY - rnd(0, 6), hit: dropHit }); } }
    const front = 140 + Math.min(1, sh.t / 1.7) * 140;
    for (let i = foam.length - 1; i >= 0; i--) { const b = foam[i]; if (mk.y + b.y < front && Math.random() < dt * 5) { fx.spawn('bubble', mk.x + b.x, mk.y + b.y, { r: 0, vy: rnd(10, 40), vx: rnd(-6, 6), life: 0.4 }); foam.splice(i, 1); } }
    GAME.stat('clean', dt * 4);
    if (sh.t >= sh.dur) {
      showerSt = null; const washed = sh.foam0 >= 6 || sh.soaped; foam = []; UI.updateBar(); const s = S();
      if (washed) { s.stats.washed++; GAME.stat('clean', 15); GAME.care(6, 'wash'); GAME.fulfill('wash'); GAME.checkAch(); GAME.addXP(2); for (let i = 0; i < 8; i++) fx.spawn('spark', mk.x + rnd(-24, 24), mk.y - rnd(20, 100), { life: rnd(0.5, 1) }); later(1, () => say(pick(['Чиштенький!', 'Швежешть!', 'Блештю!']), 'happy')); }
      else later(1, () => say('Шначала намыль меня!'));
      act('shake');
    }
  }
  function dropHit(p) { if (p.y < 150) return false; const sp = mk.sp; if (sp && SPR.hit(sp, p.x - mk.x0, p.y - mk.y0) && Math.random() < 0.5) { if (Math.random() < 0.45) fx.spawn('crumb', p.x, p.y, { c: Math.random() < 0.5 ? '#cfeeff' : '#ffffff', vx: rnd(-35, 35), vy: rnd(-40, -10), g: 320, life: 0.3 }); return true; } return false; }

  // ---------- зал: fireplace crackles + sparks ----------
  let fireCD = 0;
  function fireTap([x, y, w, h]) {
    AUDIO.play('sizzle'); later(0.12, () => AUDIO.play('pop'));
    for (let i = 0; i < 9; i++) fx.spawn('spark', x + w / 2 + rnd(-w / 2.5, w / 2.5), y + h - 10 - rnd(0, 10), { vx: rnd(-16, 16), vy: rnd(-55, -25), life: 0.6 + rnd(0, 0.4) });
    if (!S().sleeping && t > fireCD) { fireCD = t + 6; later(0.4, () => say(pick(['Тёпленько!', 'Трещит!', 'Люблю камин.', 'Уютно у наш.']))); }
  }
  // ---------- bedroom: sleep ----------
  function toggleLight() {
    const s = S(); if (room !== 'zal') return; AUDIO.play('click');
    if (s.light) { s.light = false; s.sleeping = true; mk.act = null; mk.talk = null; UI.hideBubble(); bubbleOn = false; mk.snoreT = 2; mk.zT = 0.6; AUDIO.play('yawn'); if (mic.on) micStop(); }
    else wakeUp(false);
    UI.updateBar(); GAME.save();
  }
  function wakeUp(auto, silent) {
    const s = S(); s.sleeping = false; s.light = true; GAME.checkAch(); UI.updateBar(); GAME.save(true);
    if (silent) return; act('stretch');
    if (auto) later(1.6, () => say(pick(['Вышпалшя!', 'Доброе утро!', 'Я полон шил!']), 'happy')); else if (s.st.energy < 60) later(1.6, () => say('Ну вот, разбудили...', 'sad'));
  }
  function sleepTick(dt) {
    const s = S(); GAME.stat('energy', dt * 0.32); s.stats.slept += dt; mk.sleepAcc = (mk.sleepAcc || 0) + dt; if (mk.sleepAcc >= 6) { GAME.care(mk.sleepAcc / 60, 'sleep'); mk.sleepAcc = 0; }
    mk.zT -= dt; if (mk.zT <= 0) { mk.zT = 1.15; fx.spawn('z', mk.x + 14, headTop() + 8, { vx: rnd(7, 12), vy: -15, life: 2.3, wob: 3, fadeIn: 0.2 }); }
    mk.snoreT -= dt; if (mk.snoreT <= 0) { mk.snoreT = 3.4; AUDIO.play('snore'); }
    if (s.st.energy >= 99.5) wakeUp(true);
  }

  // ---------- living room: mic disabled per user request ----------
  async function micToggle() {}
  function onMic() {}
  function micTick() {}
  function micStop() { mic.on = false; mic.rec = false; mic.pb = null; }
  function micFallback() {}
  function repeatText() {}
  // Round 14b (user: «в фотоальбоме текст налазит друг на друга», «кнопка Сохранить ничего не делает»): the caption and the date get a line
  // each (shrunk to fit), drawn only once the game font is loaded (no monospace fallback); «Сохранить» → the share sheet with the PNG
  // (on a phone: «Сохранить изображение»), else a download; the photo itself can be long-pressed on iOS.
  // Round 16: the polaroid, the font wait and «Сохранить» moved to ALBUM (album.js); every photo also goes into the album
  function snap(top) { // the room right now: square frame fitting floor characters and head
    const sw = 176, sh = 176, sx = 2;
    const ty = topY();
    const targetBottom = 296 + ty;
    let sy;
    if (top !== undefined) {
      sy = Math.max(0, Math.min(targetBottom - sh, Math.round(top + ty)));
    } else {
      sy = Math.max(0, Math.min(off.height - sh, Math.round(headTop() + ty - 30)));
      if (sy + sh < targetBottom) sy = Math.min(off.height - sh, targetBottom - sh);
    }
    const cw = 150, ch = 150;
    const c = PX.canvas(cw, ch); const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, sx, sy, sw, sh, 0, 0, cw, ch);
    return c;
  }
  function photo(o = {}) {
    if (trans) return; act('pose'); AUDIO.play('click');
    later(0.55, () => {
      AUDIO.play('camera'); flash = 1.2; const s = S(); s.stats.photos++; GAME.care(1, 'photo'); GAME.checkAch(); GAME.save();
      const shot = snap(o.top); // the moment of the click, before the font wait
      const e = ALBUM.add({ k: o.k || 'photo', title: o.title || 'Фото на память', cap: o.cap || s.name, src: shot.toDataURL('image/png') });
      const draw = () => {
        const p = ALBUM.polaroid(shot, e.cap, e.sub, e.d); lastPhoto = p;
        later(0.35, () => {
          const w = UI.modal(`<h2>${UI.esc(e.title)}</h2><img class="photo" src="${p.url}" alt="Фото"><div class="bt"><button class="btn g" data-save>Сохранить</button><button class="btn w" data-close>Закрыть</button></div>`, { dismiss: true });
          const b = w.querySelector('[data-save]'); if (b) b.addEventListener('click', () => ALBUM.save(p.url, p.fn, p.file));
        });
      };
      if (ALBUM.fontsOK()) draw(); else ALBUM.fontsReady().then(draw); // at once when the fonts are in (they load at the start)
    });
  }
  let lastPhoto = null;
  function portrait(stage) {
    const s = S(); const cur = stage === undefined || stage === s.grow.stage, A = DATA.AGES[cur ? s.grow.stage : stage] || DATA.AGES[0];
    const f = cur ? GAME.fat() : Math.min(0.6, GAME.fat()), k = JSON.stringify(s.wear) + f.toFixed(2) + A.id; if (cur && portraitC.k === k) return portraitC.url;
    const sp = MONKEY.compose({ s: 0.6 * (0.8 + 0.2 * A.age), age: A.age, f, cloth: s.wear, pose: 'wave', eyes: { mode: 'happy' }, mouth: 'smile', blush: 1, noStubble: A.age < 1 ? 1 : 0 });
    const c = PX.canvas(64, 64), x = c.getContext('2d'), Pp = Painter(x);
    Pp.circ(32, 32, 31, '#3b2433'); Pp.circ(32, 32, 30, '#ffd98a'); Pp.circ(32, 30, 25, '#ffe6a8'); Pp.circ(32, 28, 19, '#fff0c8');
    const m = PX.canvas(64, 64), mx = m.getContext('2d'); mx.drawImage(sp.cv, Math.round(32 - sp.ox), Math.round(61 - sp.oy)); const mk2 = PX.canvas(64, 64); Painter(mk2.getContext('2d')).circ(32, 32, 30, '#000'); mx.globalCompositeOperation = 'destination-in'; mx.drawImage(mk2, 0, 0);
    x.drawImage(m, 0, 0); const url = c.toDataURL(); if (cur) portraitC = { k, url }; return url;
  }

  // ---------- misc API ----------
  function react(type) { if (type === 'happy') { face('happy', 'laugh', 0.8); hop(110); } else if (type === 'sad') { act('sad'); } }
  function celebrate() { AUDIO.play('star'); confetti(30); face('happy', 'laugh', 1.2); hop(150); }
  function onWant(w) { if (w && APP.scene === 'home' && !S().sleeping && t - lastSay > 2) later(0.4, () => say(wantLine(w))); }
  function onWantDone() { const ht = headTop(), ty = topY(); UI.float(mk.x + 34, ht + ty + 4 - camY, '+3', UI.I('coin')); AUDIO.play('coin'); for (let i = 0; i < 5; i++) fx.spawn('heart', mk.x + rnd(-20, 20), ht + rnd(0, 30), { vy: -22, life: 1.1, wob: 5 }); later(0.2, () => say(pick(['Шпашибо!', 'Ура, ты лучший!', 'Обожаю тебя!']), 'happy')); }
  function stageFx(a) { confetti(20); for (let i = 0; i < 6; i++) fx.spawn('puff', mk.x + rnd(-30, 30), mk.y - rnd(10, 90), { c: '#ffffff', r0: 2, r1: 8, life: 0.6, alpha: 0.8 }); if (a.after === 'Скуф') ALBUM.moment('skuf', { title: 'Настоящий скуф!', delay: 1.2, room }); later(0.6, () => say(a.after === 'Скуф' ? 'Я штал наштоящим шкуфом!' : a.up ? 'Кажетшя, я поправилшя...' : 'Я похудел!', 'happy')); }
  function growFx() {
    mk.act = null; mk.eat = null; confetti(40); flash = 0.6; AUDIO.play('star');
    for (let i = 0; i < 10; i++) fx.spawn('puff', mk.x + rnd(-30, 30), mk.y - rnd(10, 100), { c: '#ffffff', r0: 2, r1: 9, life: 0.7, alpha: 0.85 });
    for (let i = 0; i < 8; i++) fx.spawn('star', mk.x + rnd(-34, 34), mk.y - rnd(30, 120), { vy: -18, life: 1.3, wob: 4 });
    later(0.35, () => { AUDIO.play('call'); act('hop'); }); later(1.9, () => say(pick(L.grew), 'happy'));
  }
  function setPreview(on) { preview = !!on; if (on) { cancelTool(); UI.hideBubble(); bubbleOn = false; } }
  function closeWindow(r) {
    if (trip || S().sleeping || trans) return false;
    r = r || room;
    if (r !== 'balcony' && r !== 'zal') return false;
    if (room !== r) {
      goTo(r);
      later(0.35, () => {
        if (room === r && !trip) tripStart('winClose', r);
      });
      return true;
    }
    tripStart('winClose', r);
    return true;
  }
  function key(k) { if (k === 'ArrowLeft') go(-1); else if (k === 'ArrowRight') go(1); }
  function pause() { cancelTool(); if (press && press.held) FRIENDS.release(press.fr.id); press = null; if (mic.on) micStop(); }
  return {
    // Round 20 (battery): something moves on its own → main.js draws at full 60 fps (a room slide, a walk, a jump, the camera, guests)
    lively: () => !!trans || t - movedT < 0.25 || mk.jy < 0 || camY !== camT || flash > 0.05 || (typeof FRIENDS !== 'undefined' && FRIENDS.busy()),
    init, update, render, down, move, up, hover, key, pause, go, goTo, slide: () => (trans ? { e: 1 - Math.pow(1 - Math.min(1, trans.t / trans.dur), 3), dir: trans.dir } : null), // Round 25: FILL slides the floor below along
    say, wake: (silent) => wakeUp(false, silent), react, celebrate, onWant, onWantDone, stageFx, growFx, portrait, photo, snap, inTrans: () => !!trans, flashOn: (v) => { flash = Math.max(flash, v); },
    micToggle, micActive: () => mic.on, toggleLight, waterTree, fertilize, shower, showerOn: () => !!showerSt, startTool, setPreview, closeWindow,
    monkeyAt: (x, y) => monkeyPart(x, y), clearTry: () => { tryCloth = null; }, dropFiller, tryOn: (id) => { tryCloth = id; }, tryId: () => tryCloth, feed, act, fx, face, lookAt, hop, headTop, busy, things, whine, tripStart, _params: () => params(), _mk: () => ({ x0: mk.x0, y0: mk.y0, cv: mk.sp && mk.sp.cv }),
    sneak, get sneaking() { return sneaking; },     get camY() { return camY; }, get tvOn() { return tvOn && GAME.hasUp('tv'); }, get trip() { return trip ? Object.assign({ kind: trip.kind, ph: trip.ph }, trip.climb ? { climb: true } : {}, trip.kind === 'mirror' ? { pose: trip.pose || null } : {}, trip.kind === 'guitar' ? { gp: trip.gp || null } : {}) : null; },
    phone, toPc, toTv, vacRide, rackLift, get phoneOn() { return phoneOn(); }, guitarHold: () => { const g = gHeld(); return { a: g.a, sc: g.sc, small: gSmall() }; }, ignoreTapUntil,
    _mirror: (id) => { if (trip && trip.kind === 'mirror' && trip.ph === 'do') { trip.t = 0; mirrorPose(trip, id); } },
    get room() { return room; }, get mk() { return mk; }, get trip() { return trip; }, get walking() { return !!(trip && trip.kind === 'walk'); }, get rest() { return { x: rest.x, y: rest.y }; }, walkTo, travel, stopTravel, fridgeSnack, watchTv, tvSpot, get lastPhoto() { return lastPhoto; }, fontsReady: () => ALBUM.fontsReady(), get trans() { return !!trans; }, get off() { return off; }, get foam() { return foam; }, clothes, soapTap, get tool() { return tool; }, topY: () => topY(),
  };
})();
