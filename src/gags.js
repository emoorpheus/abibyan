'use strict';
// ===== Round 5 D: every thing in the flat does something when tapped — each in its own way, with a joke =====
// Big ones: the stove (pancakes from milk; «первый блин — комом»; one may land on his head), the washing machine under the bathroom
// sink (load → fill → wash → spin → ding; watching the drum makes him dizzy; the lost sock), windows that open (street sounds, a breeze
// with leaves, a pigeon on the zal sill, a paper plane on the balcony; he closes it when he gets cold).
// Round 6 C: the zal curtains close on a tap (an open window is shut first and the pigeon flies off) and open again.
// Small ones: zal radiator (the neighbours knock back), poster corner, star night-light, garland modes, the bed (feathers);
// hall doorbell (a parcel once a day), the drying rack (wobbles, falls), a moth at the plafond;
// Round 6 B / Round 8, the hall etagere: the Hornets, toys / figurines that hop and get a line each, the router reboots (Wi-Fi arcs), the Linux
// box shows Tux, and the robot vacuum drives a loop round the hall (he hops over it) and docks again;
// kitchen cabinet doors and drawers, a coin in the sofa, table candles, the clock (cuckoo), a gondola on the Venice mural, the cactus,
// the chair; bath faucet, heated towel rail, first-aid kit (a plaster), cat rug, a frog in the fern, angels on the ceiling, bath mat,
// sconces; balcony flamingo, hammock, flowers (sneeze), a butterfly in the flower box, the gnome, digging in Монти's soil.
// Room files draw their own live parts from GAGS.view(); GAGS draws the free-flying things (pigeon, moth, parcel, plaster, pancakes…).
const GAGS = (() => {
  const S = () => GAME.S, L = DATA.LINES;
  const pick = (a) => a[Math.floor(Math.random() * a.length)], rnd = (a, b) => a + Math.random() * (b - a);
  const inR = (x, y, r) => !!r && x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3];
  const today = () => GAME.dayStr(new Date());
  const G = () => { const s = S(); if (!s.gags) s.gags = {}; return s.gags; };
  const sfx = (n, a) => AUDIO.play(n, a);
  const here = (r) => HOME.room === r && APP.scene === 'home';
  const spots = (r) => ROOMS.spots(r, S().home.items) || {};
  const zzz = () => S().sleeping;
  const line = (k, mood) => { const l = L[k]; if (l && !zzz()) HOME.say(pick(l), mood); }; // all his gag lines live in DATA.LINES (voiced by tools/tts.py)
  const fxs = (...a) => HOME.fx.spawn(...a);
  const ag = () => GAME.ageDef().s;
  let t = 0, last = null, nHit = 0, timers = [], force = {};
  const later = (d, fn) => timers.push({ at: t + d, fn });

  // ---------- what the rooms draw ----------
  const V = { win: { zal: 0, balcony: 0 }, gust: 0, cook: null, cab: null, drawer: null, candles: false, clock: -1, gondola: -1, chair: 0,
    wash: null, tap: 0, rail: 0, aid: 0, cat: 0, bsc: true, poster: 0, stars: 0, garland: 0, front: 0, rack: { a: 0, fall: 0 }, wink: 0, ham: 0, desk: 0,
    curtain: 0, torsher: false, fig: null, router: -1, linux: -1, mask: -1, vac: { x: 160, y: 234, on: false, t: 0 },
    knob: { st: 'on', x: 0, y: 0, vx: 0, vy: 0, w: 0, n: 0, nT: 0, puff: 0 } }; // Round 10 #5: the radiator's right valve knob
  const anim = {}; // id → { t, dur } one-shot timelines (k = t / dur)
  const play = (id, dur) => { anim[id] = { t: 0, dur }; };
  const ak = (id) => (anim[id] ? Math.min(1, anim[id].t / anim[id].dur) : -1);

  // ================= Round 10 #5: the radiator's right knob — tapped a lot, it falls off; he puts it back (HOME trip 'knob') =================
  function knobTap() {
    const k = V.knob; if (k.st !== 'on' && k.st !== 'wobble') return;
    k.n++; k.nT = 4; k.w = 0.45; k.st = 'wobble';
    if (k.n >= 7) { Object.assign(k, { st: 'fall', x: 112, y: 163, vx: 24, vy: -70, n: 0, w: 0, puff: 0.6 }); sfx('clatter'); later(0.55, () => { if (!zzz()) { HOME.face('wide', 'o', 1.3); line('g_knob'); } }); }
  }
  function knobTick(dt) {
    const k = V.knob;
    if (k.st === 'wobble') { k.w -= dt; if (k.w <= 0) k.st = 'on'; }
    if (k.nT > 0) { k.nT -= dt; if (k.nT <= 0) k.n = 0; }
    if (k.st === 'fall') { k.vy += 460 * dt; k.x += k.vx * dt; k.y += k.vy * dt; if (k.y >= 236) { k.y = 236; if (k.vy > 70) { k.vy = -k.vy * 0.38; k.vx *= 0.55; sfx('tink'); } else { k.st = 'floor'; k.vx = 0; k.vy = 0; } } }
    if (k.st !== 'on' && k.st !== 'wobble' && k.st !== 'fix' && here('zal') && V.curtain < 0.5) { k.puff -= dt; if (k.puff <= 0) { k.puff = 1.3; fxs('puff', 114, 161, { vx: 5, vy: -16, r0: 1, r1: 4, c: '#f4f2ee', life: 0.9 }); } } // the open spindle hisses a little
  }
  const knobPick = () => { V.knob.st = 'held'; sfx('pop'); };
  const knobFix = () => { V.knob.st = 'on'; V.knob.n = 0; sfx('screw'); later(0.35, () => line('g_knobFix', 'happy')); };

  // ================= windows =================
  const WIN = { zal: { want: 0, cold: 0, gustT: 0, sndT: 0, pigT: 0, plane: false, said: false }, balcony: { want: 0, cold: 0, gustT: 0, sndT: 0, pigT: 0, plane: false, said: false } };
  let pig = null; // the pigeon on the zal sill: { st: 'in' | 'sit' | 'off', t, x, y, cooT }
  function winSeason() {
    const sc = typeof SEASONS !== 'undefined' ? SEASONS.cur() : null;
    if (sc === 'newyear') return 'winter';
    if (sc === 'spring') return 'spring';
    if (sc === 'summer') return 'summer';
    if (sc === 'halloween') return 'autumn';
    const m = new Date().getMonth();
    if (m === 11 || m === 0 || m === 1 || m === 10) return 'winter';
    if (m >= 2 && m <= 4) return 'spring';
    if (m >= 5 && m <= 7) return 'summer';
    return 'autumn';
  }
  function winTap(r) {
    const w = WIN[r]; w.want = w.want ? 0 : 1; sfx('window');
    if (w.want) { Object.assign(w, { cold: 0, gustT: 1.4, sndT: 0.5, pigT: rnd(6, 12), plane: false, said: false }); later(0.55, () => { if (here(r) && !HOME.busy()) line('g_air', 'happy'); }); }
    else if (r === 'zal' && pig && pig.st !== 'off') pigeonOff();
  }
  function gust(r) {
    V.gust = 1; sfx('wind'); const ph = ROOMS.phase(); if (ph === 'night') return;
    const box = r === 'zal' ? [102, 84, 12, 36] : [66, 40, 50, 80];
    const ssn = winSeason();
    if (ssn === 'winter') {
      for (let i = 0; i < 6; i++) fxs('leaf', box[0] + rnd(0, box[2]), box[1] + rnd(0, box[3]), { vx: rnd(-36, 12), vy: rnd(4, 18), g: 24, wob: 4, life: rnd(2.5, 4), c: i % 2 ? '#ffffff' : '#e8f4fc', floor: rnd(238, 292) });
    } else if (ssn === 'spring') {
      const C = ['#ffb0c8', '#ffa2c0', '#ffffff', '#ffd0e0'];
      for (let i = 0; i < 4; i++) fxs('leaf', box[0] + rnd(0, box[2]), box[1] + rnd(0, box[3]), { vx: rnd(-30, 16), vy: rnd(-4, 14), g: 14, wob: 6, life: rnd(3, 4.5), c: pick(C), floor: rnd(238, 292) });
    } else {
      const C = ssn === 'autumn' ? ['#e8702a', '#e8b030', '#c8401a', '#9ad06a'] : ['#6cbf4a', '#8ad05a', '#a0df70'];
      for (let i = 0; i < 3; i++) fxs('leaf', box[0] + rnd(0, box[2]), box[1] + rnd(0, box[3]), { vx: rnd(-34, 16), vy: rnd(-6, 12), g: 16, wob: 5, life: rnd(3, 4.2), c: pick(C), floor: rnd(238, 292) });
    }
  }
  function pigeonIn() { pig = { st: 'in', t: 0, x: 112, y: 96, cooT: 1.2 }; sfx('flap'); later(0.8, () => { if (here('zal')) line('g_pigeon'); }); }
  function pigeonOff() { if (!pig) return; pig.st = 'off'; pig.t = 0; sfx('flap'); for (let i = 0; i < 3; i++) fxs('crumb', pig.x + rnd(-3, 3), pig.y - 4, { c: '#c8ccd4', vx: rnd(-20, 20), vy: rnd(-30, -5), g: 60, life: 1.1, wob: 6 }); }
  function winTick(dt) {
    for (const r of ['zal', 'balcony']) {
      const w = WIN[r]; V.win[r] = w.want ? Math.min(1, V.win[r] + dt / 0.45) : Math.max(0, V.win[r] - dt / 0.35);
      if (!w.want) continue; w.cold += dt;
      if (here(r) && V.win[r] >= 1) {
        w.sndT -= dt; if (w.sndT <= 0) { w.sndT = 3.1; sfx('street', r); }
        w.gustT -= dt; if (w.gustT <= 0) { w.gustT = rnd(4.5, 8); gust(r); }
        if (r === 'zal' && !pig) { w.pigT -= dt; if (w.pigT <= 0 || force.pigeon) { force.pigeon = false; pigeonIn(); } }
        if (r === 'balcony' && !w.plane && w.cold > 6) { w.plane = true; planeIn(); }
      }
      const ssn = winSeason();
      const coldMax = ssn === 'winter' ? 2.5 : ssn === 'autumn' ? 14 : 40;
      if (w.cold >= coldMax && !w.said) {
        w.said = true;
        if (here(r) && !zzz()) {
          HOME.face('closed', 'wavy', 2.0);
          HOME.act('shrug');
          try {
            const ht = HOME.headTop ? HOME.headTop() : 200;
            fxs('puff', HOME.mk.x, ht + 22, { vx: rnd(-4, 4), vy: -12, r0: 1.5, r1: 6, c: '#e8f4fc', life: 1.0 });
          } catch (e) {}

          let friendInRoom = null;
          try {
            if (typeof FRIENDS !== 'undefined' && FRIENDS._F) {
              const friends = FRIENDS._F;
              for (const fid in friends) {
                if (friends[fid].room === r && friends[fid].mode !== 'leave') {
                  friendInRoom = friends[fid];
                  break;
                }
              }
            }
          } catch (e) {}

          const friendCloses = friendInRoom && Math.random() < 0.65;
          if (friendCloses) {
            friendInRoom.pose = 'talk';
            friendInRoom.poseUntil = t + 2.0;
            const frLines = {
              monty: ['Брр! Холодно, закрою!', 'Ой, сквозняк! Закрываю.'],
              pusya: ['Мяу, дует же! Закрою.', 'Брр! Холодно, лапки мёрзнут!'],
              zhuk: ['Ж-ж-холодно! Закрою окно!', 'Брр! Мороз! Закрываю.'],
              mosq: ['З-з-закрою окно! Холодно!', 'Брр, крылышки мерзнут!']
            };
            const fLine = pick(frLines[friendInRoom.id] || ['Брр! Закрою окно!']);
            UI.fbubble(fLine, friendInRoom.x, friendInRoom.headY || (friendInRoom.y - 30), 2.2);
            sfx(friendInRoom.id === 'monty' ? 'monty' : friendInRoom.id === 'pusya' ? 'cat' : 'pop');
            later(1.8, () => {
              if (w.want) winTap(r);
              UI.fhideBubble();
            });
          } else {
            line('g_cold');
            later(1.6, () => { if (w.want) winTap(r); });
          }
        } else {
          w.want = 0;
          if (r === 'zal' && pig) pig = null;
        }
      }
    }
    V.gust = Math.max(0, V.gust - dt * 0.6);
    if (pig) {
      pig.t += dt;
      if (pig.st === 'in') { const k = Math.min(1, pig.t / 0.7); pig.x = 112 - 6 * k; pig.y = 96 + 31 * k - Math.sin(k * Math.PI) * 6; if (k >= 1) { pig.st = 'sit'; pig.t = 0; } }
      else if (pig.st === 'sit') { pig.cooT -= dt; if (pig.cooT <= 0) { pig.cooT = rnd(2.2, 4); if (here('zal')) sfx('coo'); } }
      else { const k = pig.t / 0.8; pig.x += dt * 30; pig.y -= dt * 60; if (k >= 1) pig = null; }
    }
  }
  function drawPigeon(c, P) {
    const p = pig; if (!p) return; const x = Math.round(p.x), y = Math.round(p.y), fly = p.st !== 'sit', bob = p.st === 'sit' && pig.cooT < 0.5 ? 1 : 0;
    if (p.st === 'off') c.globalAlpha = Math.max(0, 1 - p.t / 0.8);
    P.r(x - 4, y - 5, 8, 4, '#9aa0aa'); P.r(x - 3, y - 6, 6, 1, '#aab0ba'); P.r(x + 3, y - 5, 2, 2, '#7a808a'); // body + tail
    P.r(x - 5, y - 8 + bob, 3, 3, '#8a909a'); P.p(x - 6, y - 7 + bob, '#e0a060'); P.p(x - 5, y - 8 + bob, '#ffb040'); // head, beak, eye
    P.p(x - 3, y - 6, '#5aa088'); P.p(x - 2, y - 5, '#8a5aa0'); // the shiny neck
    if (fly) { const w = Math.floor(t * 16) % 2; P.r(x - 2, y - 8 - w * 2, 5, 2, '#b8bec8'); } else { P.r(x - 2, y - 5, 4, 2, '#b0b6c0'); P.p(x - 1, y - 4, '#5a606a'); P.p(x + 1, y - 4, '#5a606a'); }
    if (!fly) { P.p(x - 2, y - 1, '#e07a7a'); P.p(x + 1, y - 1, '#e07a7a'); }
    c.globalAlpha = 1;
  }
  function planeIn() { // a paper plane glides in through the open balcony sash and lands on the floor
    sfx('whoosh'); later(0.4, () => { if (here('balcony')) line('g_plane', 'happy'); });
    fxs('fn', 96, 58, { life: 5.5, vx: -24, vy: 26, drag: 0.15, floor: 288, fn: (c, P, p, x, y) => { const on = p.y >= 287; P.r(x - 4, y, 9, 1, '#ffffff'); P.r(x - 3, y - 1, 6, 1, '#e8eef4'); P.p(x + 5, y, '#d8dee6'); P.p(x - 2, y + 1, '#c8ced6'); if (!on) { P.p(x + 1, y - 2, '#f4f8fc'); } } });
  }

  // ================= the stove: pancakes =================
  let cook = null;
  const CP = { heat: 0.9, pour: 0.6, fry: 1.3, flip: 0.75, head: 2.4, fry2: 0.9, toss: 0.7, done: 1.1 };
  function stoveTap() {
    if (cook) { line('g_busyCook'); return; }
    if (HOME.trip && HOME.trip.kind === 'stove') return;
    if (zzz()) return;
    if (!(S().inv.milk > 0)) { sfx('nope'); HOME.act('shrug'); line('g_noMilk'); UI.toast('Для блинчиков нужно молочко — купи его в холодильнике', UI.F('milk')); return; }
    HOME.tripStart('stove');
  }
  function cookGo() { // he is at the stove (the walk-to trip waits while we cook)
    const s = S(); if (!(s.inv.milk > 0) || cook) return; s.inv.milk--; if (!s.inv.milk) delete s.inv.milk; GAME.emit('inv');
    const g = G(), d = today(), burnt = g.blin !== d; g.blin = d; GAME.save();
    cook = { ph: 'heat', t: 0, n: 0, burnt, head: false, spread: 0, done: 0, glow: 0, lump: false, smokeT: 0, first: true };
    sfx('hob'); line('g_cook', 'happy');
  }
  function cookPh(c, ph) { c.ph = ph; c.t = 0; }
  function pancakeDone(c) {
    const s = S(); c.n++; s.inv.pancake = (s.inv.pancake || 0) + 1; s.stats.pancakes = (s.stats.pancakes || 0) + 1; GAME.emit('inv');
    const pn = panXY(); fxs('img', pn[0], pn[1] - 5, { img: ART.food('pancake'), vx: rnd(10, 30), vy: -90, g: 120, life: 0.9 }); UI.float(pn[0] + 8, pn[1] - 21 - HOME.camY, '+1', UI.F('pancake')); sfx('pop');
    if (c.n >= 2) cookPh(c, 'done'); else { cookPh(c, 'pour'); c.spread = 0; c.done = 0; c.head = false; sfx('fry'); }
  }
  const panXY = () => { const p = (spots('kitchen') || {}).pan || [94, 152, 20, 12]; return [p[0] + 10, p[1] + 3]; }; // Round 14b #9: from the kitchen's spots (the unit is lower now)
  function cookTick(dt) {
    const c = cook; if (!c) return; c.t += dt; const k = Math.min(1, c.t / CP[c.ph]);
    c.glow = c.ph === 'done' ? Math.max(0, 1 - k * 1.4) : Math.min(1, c.glow + dt / 0.7);
    if (c.burnt && (c.ph === 'fry' || c.ph === 'flip' || c.ph === 'toss') && c.done > 0.35) { c.smokeT -= dt; if (c.smokeT <= 0) { c.smokeT = 0.16; fxs('puff', panXY()[0] + rnd(-4, 4), panXY()[1] - 3, { c: '#6a6468', r0: 1.5, r1: 6, vy: -16, vx: rnd(-4, 4), life: 1.3, alpha: 0.55 }); } }
    else if ((c.ph === 'fry' || c.ph === 'fry2') && Math.random() < dt * 3) fxs('puff', panXY()[0] + rnd(-4, 4), panXY()[1] - 3, { c: '#ffffff', r0: 1, r1: 4, vy: -14, life: 0.9, alpha: 0.35 });
    if (c.ph === 'heat' && k >= 1) { cookPh(c, 'pour'); sfx('fry'); }
    else if (c.ph === 'pour') { c.spread = k; if (k >= 1) cookPh(c, 'fry'); }
    else if (c.ph === 'fry') { c.done = (c.burnt ? 1 : 0.5) * k; if (k >= 1) { cookPh(c, 'flip'); sfx('flip'); c.head = !c.burnt && (force.head || (!c.first && Math.random() < 0.18)); force.head = false; c.first = false; } }
    else if (c.ph === 'flip') { if (k >= 1) {
      if (c.burnt) { c.lump = true; sfx('fail'); line('g_burnt'); HOME.face('closed', 'wavy', 1.2); cookPh(c, 'toss'); }
      else if (c.head) { sfx('splat'); line('g_head'); cookPh(c, 'head'); }
      else { sfx('pop'); cookPh(c, 'fry2'); sfx('fry'); }
    } }
    else if (c.ph === 'head') { if (k >= 1) pancakeDone(c); }
    else if (c.ph === 'fry2') { c.done = 0.5 + 0.5 * k; if (k >= 1) pancakeDone(c); }
    else if (c.ph === 'toss') { if (k >= 1) { c.burnt = false; c.lump = false; c.spread = 0; c.done = 0; cookPh(c, 'pour'); sfx('fry'); } }
    else if (c.ph === 'done') { if (k >= 1) cookEnd(true); }
  }
  function cookEnd(ok) {
    if (!cook) return; const c = cook; cook = null; AUDIO.stop('fry');
    if (ok) { sfx('switch'); line('g_pancakes', 'happy'); GAME.stat('fun', 4); GAME.care(2, 'cook'); GAME.addXP(2); GAME.checkAch(); GAME.save(); }
  }
  function cookView() {
    const c = cook; if (!c) return null; const k = Math.min(1, c.t / CP[c.ph]);
    return { ph: c.ph, k, glow: c.glow, spread: c.ph === 'heat' ? 0 : c.spread, done: c.done, burnt: c.burnt, lump: c.lump, inPan: c.ph !== 'heat' && c.ph !== 'flip' && c.ph !== 'head' && c.ph !== 'done' && !(c.ph === 'toss' && k > 0.15) };
  }
  function pcol(done, burnt) { // batter → golden → (burnt) dark
    if (burnt && done > 0.6) return ['#3a2418', '#5a3a26']; if (burnt && done > 0.3) return ['#8a5a30', '#a8703a'];
    return done < 0.15 ? ['#f2e2a8', '#fff2c8'] : done < 0.4 ? ['#ecc878', '#f8e0a0'] : ['#d89a48', '#f0c070'];
  }
  function drawPancakeFly(c, P) { // the flip (over the pan, or onto his head) and the burnt lump being tossed
    const cv = cookView(); if (!cv) return; const mk = HOME.mk, s = ag();
    const pan = panXY(), hx = mk.x, hy = HOME.headTop() + 3;
    if (cv.ph === 'flip') {
      const k = cv.k, head = cook.head, x = head ? pan[0] + (hx - pan[0]) * k : pan[0], top = head ? Math.min(pan[1], hy) - 30 : pan[1] - 26;
      const y = head ? (1 - k) * (1 - k) * pan[1] + 2 * (1 - k) * k * top + k * k * hy : pan[1] - Math.sin(k * Math.PI) * 26, ry = Math.max(0.5, Math.abs(Math.cos(k * Math.PI * 2)) * 2.4);
      const col = cv.burnt ? pcol(1, true) : pcol(0.5, false); P.ell(Math.round(x), Math.round(y), 5.5, ry, col[0]); if (ry > 1.2) P.r(Math.round(x) - 3, Math.round(y - ry * 0.4), 6, 1, col[1]);
    } else if (cv.ph === 'head') {
      const w = Math.round(9 * Math.max(0.7, s)), x = Math.round(hx), y = Math.round(hy), col = pcol(0.5, false);
      P.ell(x, y, w, 2.2, col[0]); P.r(x - w + 2, y - 1, w * 2 - 4, 1, col[1]); P.r(x - w, y + 1, 1, 3, col[0]); P.r(x + w - 1, y + 1, 1, 4, col[0]); P.p(x - 3, y, '#c88838'); P.p(x + 4, y - 1, '#c88838');
    } else if (cv.ph === 'toss' && cv.k > 0.15) { const k = (cv.k - 0.15) / 0.85, x = pan[0] - k * 60, y = pan[1] - Math.sin(k * Math.PI) * 20 + k * 40; P.ell(Math.round(x), Math.round(y), 3, 2, '#2a1a12'); P.p(Math.round(x) - 1, Math.round(y) - 1, '#5a3a26'); }
  }

  // ================= the washing machine =================
  let wash = null;
  const WP = { load: 1.0, fill: 1.4, wash: 5.0, spin: 3.2, done: 1.6 };
  function washTap() {
    if (wash) { if (wash.ph === 'done') return; sfx('boop'); HOME.face('wide', 'o', 0.8); line('g_washOpen'); return; }
    wash = { ph: 'load', t: 0, a: 0, dir: 1, dx: 0, walk: 0, dizzy: false };
    sfx('whoosh'); line('g_wash', 'happy');
    const mk = HOME.mk, s = ag(), C = [['#c94f6b', '#8f2f48'], ['#3fb6ff', '#1f7fc1'], ['#ffd23a', '#c89a12'], ['#e9e2d6', '#c4baa8']];
    for (let i = 0; i < 4; i++) later(0.12 + i * 0.16, () => { const [c, d] = C[i], x0 = mk.x + 8 * s, y0 = mk.y - 60 * s, T = 0.5, tx = 158, ty = 204; fxs('cloth', x0, y0, { c, d, vx: (tx - x0) / T, vy: (ty - y0 - 0.5 * 300 * T * T) / T, g: 300, life: T }); sfx('whoosh'); });
  }
  function washTick(dt) {
    const w = wash; if (!w) return; w.t += dt; const k = Math.min(1, w.t / WP[w.ph]), inB = here('bath'), next = (ph) => { w.ph = ph; w.t = 0; return ph; };
    if (w.ph === 'load') { if (k >= 1) { next('fill'); if (inB) { sfx('thunk'); sfx('fill'); } } }
    else if (w.ph === 'fill') { if (k >= 1) { next('wash'); if (inB) sfx('wash'); } }
    else if (w.ph === 'wash') {
      w.a += dt * 2.4 * w.dir; if (Math.floor(w.t / 1.25) % 2 !== (w.dir > 0 ? 0 : 1)) w.dir = -w.dir;
      if (inB) HOME.lookAt(158, 204, 0.3);
      if (!w.dizzy && w.t > 2 && inB && !zzz() && !HOME.trip) { w.dizzy = true; HOME.mk.dizzy = 2.4; sfx('whoosh'); later(0.25, () => line('g_dizzyWash')); }
      if (k >= 1) { next('spin'); if (inB) sfx('spin'); }
    } else if (w.ph === 'spin') {
      w.a += dt * (6 + 34 * k); w.dx = Math.round(Math.sin(t * 46) * (k < 0.85 ? 1 : 0.4)); w.walk = -Math.min(2, Math.floor(k * 3));
      if (inB && Math.random() < dt * 5) fxs('bubble', 158 + rnd(-10, 10), 190, { r: Math.floor(rnd(0, 3)), vy: rnd(-26, -12), vx: rnd(-8, 8), wob: 4, life: 1.4 });
      if (k >= 1) { next('done'); w.dx = 0; washDone(inB); }
    } else if (w.ph === 'done') { w.walk = Math.round(w.walk * (1 - k)); if (k >= 1) { wash = null; if (inB) sfx('thunk'); } }
  }
  function washDone(inB) {
    const s = S(); s.stats.washes = (s.stats.washes || 0) + 1; GAME.stat('fun', 3); GAME.care(1, 'wash'); GAME.checkAch(); GAME.save();
    if (!inB) return; sfx('washDone');
    later(0.5, () => { const lost = Math.random() < 0.35 || force.sock; force.sock = false; fxs('cloth', 150, 206, { c: '#ffffff', d: '#c8c8d0', vx: -50, vy: -70, g: 300, life: 3.2, floor: 262 }); later(0.5, () => { if (lost) { line('g_sock'); HOME.act('look'); } else line('g_clean', 'happy'); }); });
  }
  function washView() { const w = wash; if (!w) return null; const k = Math.min(1, w.t / WP[w.ph]); return { ph: w.ph, k, a: w.a, dx: w.dx + w.walk, water: w.ph === 'fill' ? 0.55 * k : w.ph === 'wash' ? 0.55 : w.ph === 'spin' ? 0.55 * (1 - Math.min(1, k * 2)) : 0, door: w.ph === 'load' ? (k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25) : w.ph === 'done' ? Math.min(1, k * 3) : 0 }; }

  // ================= the doorbell & the parcel =================
  let parcel = null, frontWant = 0;
  const FOODS = ['banana', 'apple', 'icecream', 'watermelon', 'cake', 'pelmeni', 'puree', 'porridge'];
  function bell() {
    sfx('dingdong'); HOME.lookAt(90, 150, 1.6); const g = G();
    if (g.parcel !== today() && !parcel) {
      g.parcel = today(); GAME.save();
      later(1.1, () => { if (!here('hall')) { g.parcel = ''; return; } frontWant = 1; sfx('creak');
        later(0.35, () => { parcel = { st: 'in', t: 0, x: 90, y: 244 }; sfx('scrape'); });
        later(1.5, () => { frontWant = 0; sfx('thunk'); line('g_parcel', 'happy'); }); });
      return;
    }
    later(0.9, () => { if (!here('hall')) return; if (Math.random() < 0.25) { sfx('mew'); line('g_catDoor'); } else line('g_nobody'); });
  }
  function parcelOpen() {
    const p = parcel; if (!p || p.st !== 'wait') return; p.st = 'open'; p.t = 0; sfx('rustle');
    const pool = FOODS.filter((id) => DATA.FOODS[id] && GAME.ageOK(DATA.FOODS[id])), id = pick(pool.length ? pool : ['banana']), s = S();
    s.inv[id] = (s.inv[id] || 0) + 1; GAME.emit('inv'); GAME.save();
    fxs('img', p.x, p.y - 8, { img: ART.food(id), vy: -60, g: 60, life: 1.1 }); sfx('coin'); UI.toast('В посылке: ' + DATA.FOODS[id].name, UI.F(id), 'gold'); line('g_parcelOpen', 'happy');
  }
  function parcelTick(dt) {
    V.front = frontWant ? Math.min(1, V.front + dt / 0.3) : Math.max(0, V.front - dt / 0.3);
    const p = parcel; if (!p) return; p.t += dt;
    if (p.st === 'in') { const k = Math.min(1, p.t / 0.7); p.x = 90 - 42 * k; p.y = 244 + 10 * k; if (k >= 1) { p.st = 'wait'; p.t = 0; } }
    else if (p.st === 'open' && p.t > 1.3) parcel = null;
  }
  function drawParcel(c, P) {
    const p = parcel; if (!p) return; const x = Math.round(p.x), y = Math.round(p.y);
    if (p.st === 'open') c.globalAlpha = Math.max(0, 1 - p.t / 1.3);
    P.shadow(x, y + 1, 10, 2, 0.25); P.r(x - 9, y - 10, 18, 11, '#c8955a'); P.r(x - 9, y - 10, 18, 1, '#e0b47a'); P.r(x - 1, y - 10, 2, 11, '#e8d8b0'); P.r(x - 9, y - 5, 18, 1, '#a87a48');
    if (p.st === 'open') { P.r(x - 12, y - 14, 10, 3, '#d8a46a'); P.r(x + 2, y - 14, 10, 3, '#d8a46a'); } else { P.r(x + 3, y - 8, 4, 2, '#ffffff'); P.p(x + 4, y - 7, '#e8453c'); }
    c.globalAlpha = 1;
  }

  // ================= little flyers: the moth, the butterfly, the frog, the plaster, projected stars =================
  let moth = null, fly = null, plaster = 0;
  function drawMoth(c, P) { if (!moth) return; const k = moth.t / 6, a = moth.t * 3.1, out = Math.max(0, moth.t - 5) * 60, x = Math.round(90 + Math.cos(a) * 15 + out), y = Math.round(40 + Math.sin(a * 1.7) * 6 - out * 0.6), w = Math.floor(moth.t * 18) % 2; P.r(x, y, 2, 1, '#8a7a68'); P.r(x - 1 - w, y - 1 + w, 2, 1, '#c8b89c'); P.r(x + 1 + w, y - 1 + w, 2, 1, '#c8b89c'); }
  function drawFly(c, P) { if (!fly) return; const a = fly.t * 2.3, x = Math.round(93 + Math.sin(a) * 20 + fly.t * 6), y = Math.round(110 - fly.t * 9 + Math.sin(a * 2.2) * 6), w = Math.floor(fly.t * 14) % 2; c.globalAlpha = Math.min(1, (5 - fly.t) / 0.6); P.r(x, y, 1, 3, '#3a2433'); P.r(x - 2, y + w, 2, 2, '#ff8ad0'); P.r(x + 1, y + w, 2, 2, '#ffd23a'); c.globalAlpha = 1; }
  function drawFrog(c, P) { const k = ak('frog'); if (k < 0) return; const up = Math.min(1, Math.min(k, 1 - k) * 6), x = 161, y = Math.round(268 - up * 6); if (up <= 0) return; P.r(x - 4, y, 9, 5, '#5aae46'); P.r(x - 4, y - 2, 3, 3, '#6cc24a'); P.r(x + 2, y - 2, 3, 3, '#6cc24a'); P.p(x - 3, y - 1, '#1a1a1a'); P.p(x + 3, y - 1, '#1a1a1a'); P.r(x - 2, y + 2, 5, 1, '#2e6a2a'); if (k > 0.3 && k < 0.6 && Math.floor(k * 20) % 2) P.ell(x, y + 4, 2, 1.5, '#f4f0a0'); }
  function drawAid(c, P) { const k = V.aid; if (k <= 0) return; const kp = spots('bath').kit; if (!kp) return; const [x, y] = kp, up = Math.round(5 * k); P.r(x + 2, y + 1, 16, 4, '#6a2a2a'); P.r(x + 3, y + 2, 4, 2, '#f0c8a0'); P.r(x + 8, y + 2, 4, 2, '#f4d8b8'); P.r(x + 13, y + 2, 4, 2, '#f0c8a0'); P.r(x + 1, y + 1 - up, 18, 3, '#e8453c'); P.r(x + 1, y + 1 - up, 18, 1, '#ff7a6a'); P.r(x + 9, y + 1 - up, 2, 3, '#ffffff'); }
  function drawPlaster(c, P) { if (plaster <= 0 || HOME.room === undefined) return; const mk = HOME.mk, sp = mk.sp; if (!sp || S().sleeping) return; const s = ag(), x = Math.round(mk.x - 10 * s), y = Math.round(mk.y + mk.jy + sp.head.y - 2 * s); c.globalAlpha = Math.min(1, plaster / 0.5); for (let i = -3; i <= 3; i++) { P.p(x + i, y + i, '#f0c8a0'); P.p(x + i + 1, y + i, '#e8b890'); P.p(x + i, y - i, '#f0c8a0'); P.p(x + i + 1, y - i, '#e8b890'); } P.p(x, y, '#d8a07a'); c.globalAlpha = 1; }
  function drawStars(c, P) { // the star night-light projects slowly turning stars on the walls and ceiling
    const a = anim.stars; if (!a) return; const e = Math.max(0, Math.min(1, a.t / 0.25, (a.dur - a.t) / 0.8)), cx = 96, cy = 120, ph = ROOMS.phase(), dark = !S().light || ph === 'night';
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (dark ? 0.24 : 0.14) * e; for (const r of [24, 16, 10]) P.circ(cx, cy, r, '#ffd27a'); c.restore();
    c.globalAlpha = (dark ? 0.95 : 0.6) * e;
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + t * 0.35, rr = 34 + (i % 3) * 22, x = Math.round(cx + Math.cos(a) * rr * 1.3), y = Math.round(cy - 10 + Math.sin(a) * rr * 0.75); if (y < 4 || y > 226) continue; const tw = (Math.floor(t * 3) + i) % 4 ? 1 : 0; P.p(x, y, '#fff2b0'); if (tw) { P.p(x - 1, y, '#ffd27a'); P.p(x + 1, y, '#ffd27a'); P.p(x, y - 1, '#ffd27a'); P.p(x, y + 1, '#ffd27a'); } }
    c.globalAlpha = 1;
  }

  // ================= zal curtains (Round 6 C): V.curtain 0 = tied back … 1 = drawn shut =================
  const curt = { want: 0, said: true };
  function curtainTap() {
    const close = !curt.want;
    if (close && (WIN.zal.want || V.win.zal > 0)) { if (WIN.zal.want) winTap('zal'); if (pig && pig.st !== 'off') pigeonOff(); later(0.45, () => curtainGo(1)); } // shut the window first
    else curtainGo(close ? 1 : 0);
  }
  function curtainGo(w) { curt.want = w; curt.said = false; sfx('curtain'); if (!zzz()) HOME.lookAt(100, 110, 1.6); }
  function curtainTick(dt) {
    V.curtain = curt.want ? Math.min(1, V.curtain + dt / 1.0) : Math.max(0, V.curtain - dt / 0.9);
    if (!curt.said && (V.curtain >= 1 || V.curtain <= 0)) { curt.said = true; if (here('zal')) { const ph = ROOMS.phase(); line(curt.want ? (ph === 'evening' || ph === 'night' ? 'g_curtainNight' : 'g_curtainDay') : 'g_curtainOpen', 'happy'); } }
  }
  function drawDim(c) { // shut curtains in daylight make the zal a bit dimmer
    const k = V.curtain, ph = ROOMS.phase(); if (k <= 0 || HOME.room !== 'zal' || (ph !== 'day' && ph !== 'morning') || !S().light) return;
    c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.3 * k; c.fillStyle = '#a89cc0'; c.fillRect(0, 0, ROOMS.RW, ROOMS.RH); c.restore();
  }

  // ================= the hall etagere-torsher + the robot vacuum (Round 6 B) =================
  const VAC_PATH = [[160, 234], [148, 248], [26, 250], [22, 284], [118, 287], [146, 258], [160, 234]], VAC_V = 52;
  let vac = null, figSel = null; // vac: { i, x, y, t, hop } while it drives its loop; figSel: { tier, id }
  function vacTap() { // Round 8 #12: a tap sends him over — he climbs on and rides it round the hall (asleep / busy elsewhere: it drives alone)
    if (vac) { sfx('boop'); return; }
    if (here('hall') && !zzz() && HOME.vacRide && HOME.vacRide()) return;
    vacGo(false);
  }
  function vacGo(ride) { // the drive itself; ride: he is standing on top
    vac = { i: 0, x: VAC_PATH[0][0], y: VAC_PATH[0][1], t: 0, hop: !!ride, ride: !!ride, dx: 0 }; sfx('vacuum'); later(0.3, () => line(ride ? 'g_vacRide' : 'g_vacuum', 'happy'));
  }
  function vacTick(dt) {
    const v = vac, o = V.vac; if (!v) { o.x = VAC_PATH[0][0]; o.y = VAC_PATH[0][1]; o.on = false; return; }
    v.t += dt; let step = VAC_V * dt; const x0 = v.x;
    while (step > 0 && v.i < VAC_PATH.length - 1) { const [tx, ty] = VAC_PATH[v.i + 1], dx = tx - v.x, dy = ty - v.y, d = Math.hypot(dx, dy); if (d <= step) { v.x = tx; v.y = ty; v.i++; step -= d; } else { v.x += dx / d * step; v.y += dy / d * step; step = 0; } }
    if (Math.abs(v.x - x0) > 1e-3) v.dx = Math.sign(v.x - x0);
    const mk = HOME.mk; // it drives right under his feet: he hops over it
    if (!v.hop && here('hall') && Math.abs(v.x - mk.x) < 18 && v.y > mk.y - 6 && !zzz()) { v.hop = true; HOME.hop(115); later(0.2, () => line('g_vacuumHop')); }
    if (v.ride && Math.random() < dt * 5) fxs('puff', v.x + rnd(-12, 12), v.y + 4, { c: '#d8d2c4', r0: 1, r1: 3, vy: rnd(-6, -2), vx: -v.dx * rnd(4, 10), life: 0.6, alpha: 0.45 }); // a little dust trail
    Object.assign(o, { x: v.x, y: v.y, on: true, t: v.t, dx: v.dx });
    if (v.i >= VAC_PATH.length - 1) { vac = null; AUDIO.stop('vacuum'); sfx('beep'); }
  }
  function drawVac(c, P, layer) { // the round robot vacuum (28 px): behind him while it is further back or he rides it, in front of him when it is nearer
    if (HOME.room !== 'hall' || !S().home.items.vacuum) return; const o = V.vac, tr = HOME.trip, on = !!(tr && tr.kind === 'vac' && tr.ph !== 'go'), front = !on && o.y > HOME.mk.y; if ((layer === 'top') !== front) return; // Round 9 #2: bought
    vacBody(P, Math.round(o.x), Math.round(o.y), o.on, Math.floor(o.t * 16) % 2);
  }
  function vacBody(P, x, y, on, f) {
    P.shadow(x, y + 3, 16, 3, 0.32); P.ell(x, y, 14, 5, '#141518'); P.ell(x, y - 2, 14, 4.6, '#2a2c31'); P.ell(x, y - 3, 13, 4.2, '#383b42');
    P.ell(x - 3, y - 4, 7, 1.8, '#4a4e57'); P.r(x - 13, y - 1, 26, 1, '#55585f'); P.r(x - 11, y + 1, 22, 1, '#202125');
    P.r(x - 3, y - 8, 7, 3, '#1f2025'); P.r(x - 2, y - 8, 5, 1, '#5d6068'); P.p(x + 3, y - 7, '#2c2e33'); // the lidar turret
    P.p(x + 8, y - 4, on ? (f ? '#5ad8ff' : '#2a7aa8') : '#5aff7a'); P.p(x + 9, y - 4, on ? '#1f5a7a' : '#2fa84a');
    if (on) { // the side brushes spin, crumbs fly
      for (const sx of [-12, 12]) { P.p(x + sx + (f ? 1 : -1), y + 3, '#c8c8c8'); P.p(x + sx, y + 4 - f, '#a8a8a8'); }
      if (f) for (let i = 0; i < 2; i++) P.p(x + Math.round(rnd(-15, 15)), y + 4, '#c8bca8');
    }
  }
  function figTap(tier, x) { // the nearest toy hops and gets its own line
    const list = HALL.figList(tier, S().home.items); let best = null, bd = 1e9;
    for (const f of list) { const c = ROOMS.fur('hfig_' + f[1] + (f[5] ? '_f' : ''), () => null), w = c ? c.width : 6, d = Math.abs(f[2] + w / 2 - x); if (d < bd) { bd = d; best = f; } }
    if (!best) return; figSel = { tier, id: best[0] }; play('fig', 1.8);
    sfx(best[0] === 'coins' ? 'clink' : 'squeak'); later(0.3, () => line(best[4], 'happy'));
  }

  // ================= the hit table: room → [id, rect(sp, it), fn, pre?] =================
  const C = (r) => [r[0] + r[2] / 2, r[1] + r[3] / 2];
  const T = {
    zal: [
      ['pigeon', () => (pig && pig.st === 'sit' ? [pig.x - 7, pig.y - 10, 14, 11] : null), () => { pigeonOff(); line('g_shoo'); }, 1],
      ['bed', (sp) => sp.bed, (sp) => { sfx('pop'); for (let i = 0; i < 7; i++) fxs('crumb', sp.bed[0] + 30 + rnd(-14, 14), sp.bed[1] + 40, { c: '#ffffff', sz: 2, vx: rnd(-25, 25), vy: rnd(-50, -20), g: 30, wob: 6, life: 2 }); if (!zzz()) UI.toast('Выключи свет — и ' + S().name + ' уснёт', UI.I('moon')); }, 1],
      ['curtains', (sp) => sp.curtainL, () => curtainTap()], ['curtains', (sp) => sp.curtainR, () => curtainTap()],
      ['nightlight', (sp, it) => (it.nightlight && V.curtain <= 0 ? sp.nightlight : null), () => { play('stars', 7); sfx('twinkle'); if (!zzz()) HOME.act('wow'); }],
      ['window', (sp) => (V.curtain > 0 ? null : sp.window), () => winTap('zal')],
      ['knob', (sp) => (V.knob.st === 'floor' ? sp.knobFloor : null), () => { HOME.tripStart('knob'); }],
      ['valveR', (sp) => (V.curtain > 0.5 ? null : sp.knobR), () => { knobTap(); if (V.knob.st !== 'fall') { sfx('valve'); HOME.face('open', 'o', 0.6); } }],
      ['valve', (sp) => (V.curtain > 0.5 ? null : sp.knobL), () => { sfx('valve'); play('valveL', 0.5); later(0.3, () => line('g_valve')); }],
      ['radiator', (sp) => (V.curtain > 0.5 ? null : sp.radiator), (sp) => { knobTap(); const a = anim.knock && anim.knock.t < 6; sfx('knock'); HOME.face('open', 'o', 1.2, { pose: 'ear' }); fxs('ring', C(sp.radiator)[0], C(sp.radiator)[1], { r0: 2, r1: 10, life: 0.35 });
        if (a) later(0.5, () => { sfx('knockAngry'); line('g_angry'); }); else later(0.9, () => { sfx('knockBack'); line('g_neigh'); }); play('knock', 6); }],
      ['poster', (sp, it) => (it.poster ? sp.poster : null), () => { const on = V.poster > 0.5 || (anim.poster && anim.poster.want); anim.poster = { t: 0, dur: 0.4, want: !on }; sfx(on ? 'pop' : 'peel'); line(on ? 'g_posterFix' : 'g_poster'); }],
      ['rug', (sp) => sp.rug, () => { if (zzz() || (HOME.mk.act && HOME.mk.act.name === 'jig') ) return; const R = ZAL.RUG, cx = R[0] + R[2] / 2, cy = Math.min(272, R[1] + R[3] / 2); HOME.walkTo(cx, cy, () => { if (zzz() || HOME.room !== 'zal') return; sfx('spring'); HOME.act('jig'); }); }], // Round 11 #6: he walks to the middle of the rug first, then dances there // Round 8 #2: the mandala is always there; Round 9 #3: his own jig on it (a second tap doesn't restart it)
      ['garland', (sp, it) => (it.garland ? sp.garland : null), () => { V.garland = (V.garland + 1) % 4; sfx(V.garland === 3 ? 'click' : 'twinkle'); if (V.garland === 1) line('g_garland', 'happy'); }],
    ],
    hall: [
      ['parcel', () => (parcel && parcel.st === 'wait' ? [parcel.x - 11, parcel.y - 13, 22, 16] : null), () => parcelOpen(), 1],
      ['bell', (sp) => sp.front, () => bell(), 1],
      ['rack', (sp) => (V.rack.fall > 0.5 ? [24, 214, 62, 26] : sp.rack), () => rackTap(), 1], // before the wardrobe (it leans on it)
      ['plafond', (sp) => sp.plafond, () => { if (!moth) { moth = { t: 0 }; sfx('buzz'); later(0.5, () => line('g_moth')); } HOME.lookAt(90, 40, 3); }],
      ['router', (sp) => sp.router, (sp) => { if (ak('router') >= 0) return; play('router', 2.8); sfx('beep'); later(0.5, () => sfx('modem')); later(0.6, () => line('g_router', 'happy')); HOME.lookAt(C(sp.router)[0], C(sp.router)[1], 2.5); }],
      ['linux', (sp) => sp.linux, (sp) => { if (ak('linux') >= 0) return; play('linux', 3); sfx('boot'); later(0.6, () => line('g_linux', 'happy')); HOME.lookAt(C(sp.linux)[0], C(sp.linux)[1], 2.5); }],
      ['hornet', (sp) => sp.hornet, (sp, it, x) => figTap(1, x)], // Round 8: the two Hornets by the router («Шоу!»)
      ['toys', (sp) => sp.toys, (sp, it, x) => figTap(2, x)],
      ['figs', (sp) => sp.figs, (sp, it, x) => figTap(4, x)],
      ['vacuum', (sp) => (vac ? [V.vac.x - 15, V.vac.y - 9, 30, 14] : sp.vacuum), () => vacTap()],
    ],
    kitchen: [
      ['stove', (sp) => sp.stove, () => stoveTap(), 1],
      ['cactus', (sp, it) => (it.cactus ? sp.cactus : null), (sp) => { sfx('ouch'); const [x, y] = C(sp.cactus); fxs('spark', x, y, { life: 0.4 }); if (!zzz()) { HOME.hop(80); HOME.face('closed', 'frown', 0.9); } line('g_cactus'); }],
      ['clock', (sp, it) => (it.clock ? sp.clock : null), () => { play('clock', 2.6); sfx('ticks'); later(1.3, () => { sfx('cuckoo'); line('g_cuckoo', 'happy'); }); }],
      ['cabinet', (sp) => sp.cabs && sp.cabs.find((r) => r), (sp, it, x, y) => cabTap(sp.cabs.findIndex((r) => inR(x, y, r)))],
      ['drawer', (sp) => sp.drawers && sp.drawers[0], (sp, it, x, y) => drawerTap(sp.drawers.findIndex((r) => inR(x, y, r)))],
      ['candles', (sp) => sp.candles, () => { V.candles = !V.candles; if (V.candles) { sfx('match'); } else { sfx('blow'); for (let i = 0; i < 2; i++) fxs('puff', 124 + i * 5, 199 + i * 3, { c: '#c8c4cc', r0: 1, r1: 4, vy: -12, life: 1.2, alpha: 0.6 }); line('g_wish', 'happy'); } }],
      ['chair', (sp) => sp.chair2, () => { play('chair', 0.7); sfx('creak'); }],
      ['sofa', (sp) => sp.sofa, () => sofaTap()],
      ['gondola', (sp) => sp.mural, () => { if (V.gondola < 0) { play('gondola', 7); sfx('gondola'); later(0.8, () => line('g_venice', 'happy')); } }],
    ],
    bath: [
      ['washer', (sp) => sp.washer, () => washTap()],
      ['sconce', (sp) => sp.sconceL, () => bscTap()], ['sconce', (sp) => sp.sconceR, () => bscTap()],
      ['sink', (sp) => sp.faucet, () => { play('tap', 2.6); sfx('faucet'); if (!zzz()) { HOME.act('rub'); GAME.stat('clean', 1); } later(0.3, () => line('g_paws', 'happy')); }],
      ['rail', (sp) => sp.rail, () => { play('rail', 5); sfx('switch'); sfx('hum'); later(1.2, () => line('g_warm', 'happy')); }],
      ['aid', (sp) => sp.aid, () => { play('aid', 1.4); sfx('rustle'); later(0.5, () => { plaster = 9; sfx('pop'); line('g_aid'); }); }],
      ['frog', (sp, it) => (it.fern ? sp.fern : null), () => { play('frog', 2.2); sfx('rustle'); later(0.45, () => sfx('ribbit')); later(1.1, () => line('g_frog')); }],
      ['cat', (sp) => sp.catrug, () => { play('cat', 1.6); sfx('mew'); later(0.5, () => line('g_cat')); }],
      ['bathmat', (sp, it) => (it.bathmat ? sp.bathmat : null), () => { sfx('rustle'); if (!zzz()) { HOME.hop(60); later(0.35, () => HOME.hop(60)); } line('g_feet', 'happy'); }],
      ['fresco', (sp) => sp.fresco, (sp) => { sfx('choir'); HOME.lookAt(90, 10, 2.5); for (let i = 0; i < 8; i++) fxs('spark', rnd(20, 160), rnd(4, 24), { life: rnd(0.6, 1.2), vy: rnd(4, 10) }); later(0.6, () => line('g_angels', 'happy')); }],
    ],
    balcony: [
      ['gnome', (sp, it) => (it.gnome ? sp.gnome : null), (sp) => { sfx('spring'); fxs('note', sp.gnome[0] + 9, sp.gnome[1] - 4, { vy: -14, life: 1, c: 2 }); play('gnome', 0.6); line('g_gnome', 'happy'); }, 1],
      ['flowers', (sp, it) => (it.flowers ? sp.flowers : null), (sp) => { sfx('rustle'); const [x, y] = C(sp.flowers); for (let i = 0; i < 8; i++) fxs('crumb', x + rnd(-12, 12), y - 6, { c: '#ffe066', vx: rnd(-20, 20), vy: rnd(-20, 0), g: 10, wob: 4, life: 1.6 }); later(0.7, () => { sfx('sneeze'); line('g_sneeze'); }); if (!fly && Math.random() < 0.5) { fly = { t: 0 }; later(0.3, () => sfx('flap')); } }], // Round 7: the butterfly lives in the flower box now (the basket is gone)
      ['window', (sp) => sp.window, () => winTap('balcony')],
      ['flamingo', (sp, it) => (it.flamingo ? sp.flamingo : null), (sp) => { sfx('honk'); for (let i = 0; i < 4; i++) fxs('crumb', sp.flamingo[0] + 11 + rnd(-6, 6), sp.flamingo[1] + 18, { c: '#f47aa8', sz: 2, vx: rnd(-20, 20), vy: rnd(-30, -10), g: 40, wob: 5, life: 1.6 }); later(0.6, () => line('g_flamingo')); }],
      ['hammock', (sp, it) => (it.hammock ? sp.hammock : null), () => { play('ham', 4); sfx('creak'); }],
      // Round 11 #3: ['desk'] (the drawer «stash») went away with the drawer block
      ['dig', (sp) => sp.soil, (sp) => { sfx('dig'); const [x, y] = C(sp.soil); for (let i = 0; i < 6; i++) fxs('crumb', x + rnd(-4, 4), y, { c: i % 2 ? '#5a3c28' : '#3a2416', sz: 2, vx: rnd(-30, 30), vy: rnd(-70, -30), g: 260, life: 0.9, floor: y + 4 }); later(0.6, () => line('g_dig')); }],
    ],
  };
  function bscTap() { V.bsc = !V.bsc; sfx('switch'); if (!V.bsc && !zzz()) HOME.face('open', 'o', 0.6); }
  function rackTap() {
    const r = V.rack;
    if (r.fall > 0.5) { if (!r.held && HOME.rackLift && HOME.rackLift()) return; if (r.held) return; anim.rack = { t: 0, dur: 0.5, up: true }; sfx('lift'); line('g_rackUp'); return; } // Round 14b: he walks over and lifts it himself
    if (anim.rack && anim.rack.wob && anim.rack.t < 4) { anim.rack = { t: 0, dur: 0.45, down: true }; later(0.4, () => { sfx('clank'); sfx('crack'); line('g_rack'); }); return; }
    anim.rack = { t: 0, dur: 1.6, wob: true }; sfx('clank'); line('g_wobble');
  }
  function cabTap(i) {
    if (i < 0) return; anim.cab = { t: 0, dur: 2.4, i }; sfx('creak');
    if (i === 0) later(0.35, () => { const sp = spots('kitchen') || {}, cb = (sp.cabs || [[70, 70]])[0], ct = sp.counter ? sp.counter[1] : 164; sfx('clank'); fxs('fn', cb[0] + 10, cb[1] + 14, { vx: 10, vy: 10, g: 340, life: 1.6, floor: ct - 2, fn: (c, P, p, x, y) => { const s = p.vy !== 0 ? Math.floor(p.age * 10) % 2 : 0; P.r(x - 3, y - (s ? 2 : 0), 7, s ? 4 : 1, '#c2c8d0'); P.p(x, y - 1 - (s ? 2 : 0), '#8a9099'); } }); later(0.4, () => sfx('clank')); line('g_lid'); });
    else if (i === 1) { sfx('clink'); later(0.4, () => line('g_china', 'happy')); }
    else later(0.4, () => { sfx('chomp'); GAME.stat('food', 2); fxs('crumb', HOME.mk.x, HOME.headTop() + 30, { c: '#d8a860', vx: 10, vy: -20, g: 200, life: 0.6 }); line('g_cookie', 'happy'); });
  }
  function drawerTap(i) {
    if (i < 0) return; anim.drawer = { t: 0, dur: 1.8, i }; sfx('drawer');
    if (i === 0) { later(0.2, () => sfx('clatter')); later(0.4, () => line('g_spoons')); }
    else later(0.3, () => { sfx('rustle'); const dr = ((spots('kitchen') || {}).drawers || [0, [114, 173]])[1]; for (let j = 0; j < 3; j++) fxs('cloth', dr[0] + 10, dr[1] + 7, { c: '#f4f4f0', d: '#d0d0c8', vx: rnd(-30, 30), vy: rnd(-90, -60), g: 300, life: 1.2, floor: 228 }); line('g_bags', 'happy'); });
  }
  function sofaTap() {
    sfx('rustle'); const g = G(), sp = spots('kitchen');
    if (g.sofa !== today()) { g.sofa = today(); later(0.4, () => { GAME.addCoins(3, 'sofa'); sfx('coin'); UI.float(12, 192 - HOME.camY, '+3', UI.I('coin')); line('g_sofaCoin', 'happy'); }); return; }
    for (let i = 0; i < 4; i++) fxs('crumb', 12 + rnd(-6, 6), 202, { c: '#d8a860', vx: rnd(-20, 20), vy: rnd(-50, -20), g: 200, life: 0.8, floor: 232 });
    later(0.3, () => line('g_sofa'));
  }
  function mark(id, room) { last = id; nHit++; const g = G(); if (!g.seen) g.seen = {}; if (!g.where) g.where = {}; if (room) g.where[room + ':' + id] = 1; if (!g.seen[id]) { g.seen[id] = 1; GAME.checkAch(); } } // «Всё потрогал»: 25 different gags
  // Round 16: the gag map (the album page «Приколы»): every gag place by room — found per room (the zal and the balcony window are two)
  const FALL = { pigeon: 'window', parcel: 'front', window: 'window', valve: 'knobL', curtains: 'curtainL', sconce: 'sconceL' };
  function map() {
    const it = S().home.items, out = {};
    for (const room in T) { const sp = spots(room), have = new Set(); out[room] = [];
      for (const [id, rect] of T[room]) { if (have.has(id)) continue; have.add(id); let r = null; try { r = rect(sp, it); } catch (e) { r = null; }
        if (!r && FALL[id]) r = sp[FALL[id]] || null; out[room].push({ id, r: r ? r.slice(0, 4) : null }); } }
    return out;
  }
  function found(room, id) { const g = G(), w = g.where || {}; if (w[room + ':' + id]) return true; if (!(g.seen || {})[id]) return false; return !Object.keys(w).some((k) => k.endsWith(':' + id)); } // an old save: seen without a room
  function hit(room, x, y, pre) {
    const list = T[room]; if (!list) return null; const s = S(), it = s.home.items, sp = spots(room);
    for (const [id, rect, fn, isPre] of list) {
      if (!!isPre !== !!pre) continue; const r = rect(sp, it); if (!r || !inR(x, y, r)) continue;
      if (id === 'cabinet' && !sp.cabs.some((q) => inR(x, y, q))) continue;
      if (id === 'drawer' && !sp.drawers.some((q) => inR(x, y, q))) continue;
      if (s.sleeping && !['nightlight', 'bed', 'window', 'garland', 'pigeon', 'curtains'].includes(id)) return null;
      return { fn: () => { mark(id, room); fn(sp, it, x, y); } };
    }
    if (room === 'kitchen' && !pre) { for (const [id, key] of [['cabinet', 'cabs'], ['drawer', 'drawers']]) { const i = (sp[key] || []).findIndex((q) => inR(x, y, q)); if (i >= 0) return { fn: () => { mark(id, room); (id === 'cabinet' ? cabTap : drawerTap)(i); } }; } }
    return null;
  }

  // ---------- tick ----------
  function update(dt) {
    t += dt;
    for (let i = timers.length - 1; i >= 0; i--) if (t >= timers[i].at) { const f = timers[i].fn; timers.splice(i, 1); try { f(); } catch (e) { console.error(e); } }
    for (const id in anim) { const a = anim[id]; a.t += dt; if (a.t >= a.dur && !a.hold) delete anim[id]; }
    knobTick(dt);
    winTick(dt); cookTick(dt); washTick(dt); parcelTick(dt); vacTick(dt); curtainTick(dt);
    V.fig = anim.fig && figSel ? { id: figSel.id, k: ak('fig') } : null; V.router = ak('router'); V.linux = ak('linux'); V.mask = ak('mask');
    if (moth) { moth.t += dt; if (moth.t > 6) moth = null; }
    if (fly) { fly.t += dt; if (fly.t > 5) fly = null; }
    if (plaster > 0) plaster -= dt;
    // poster corner: animate toward the wanted state
    { const a = anim.poster; if (a) V.poster = a.want ? Math.min(1, a.t / a.dur) : Math.max(0, 1 - a.t / a.dur); if (a && a.t >= a.dur) { V.poster = a.want ? 1 : 0; } }
    { const a = anim.rack, r = V.rack; if (r.held) { } /* Round 14b: Абибян is lifting it (HOME.rackTrip sets fall / a) */ else if (a && a.wob) r.a = Math.sin(a.t * 11) * 0.12 * (1 - a.t / a.dur); else if (a && a.down) { r.fall = Math.min(1, a.t / a.dur); r.a = r.fall * r.fall * 1.42; } else if (a && a.up) { r.fall = Math.max(0, 1 - a.t / a.dur); r.a = r.fall * 1.42; if (a.t >= a.dur) { r.fall = 0; r.a = 0; } } else if (r.fall < 0.5) r.a = 0; }
    V.cab = anim.cab ? { i: anim.cab.i, k: Math.min(1, anim.cab.t / 0.25, (anim.cab.dur - anim.cab.t) / 0.25) } : null;
    V.drawer = anim.drawer ? { i: anim.drawer.i, k: Math.min(1, anim.drawer.t / 0.2, (anim.drawer.dur - anim.drawer.t) / 0.2) } : null;
    V.clock = ak('clock'); V.gondola = ak('gondola'); V.chair = anim.chair ? Math.sin(anim.chair.t * 30) * (1 - anim.chair.t / anim.chair.dur) : 0;
    V.tap = anim.tap ? Math.min(1, anim.tap.t / 0.15, (anim.tap.dur - anim.tap.t) / 0.3) : 0;
    V.rail = anim.rail ? Math.min(1, anim.rail.t / 0.6, (anim.rail.dur - anim.rail.t) / 1) : 0;
    V.aid = anim.aid ? Math.min(1, anim.aid.t / 0.2, (anim.aid.dur - anim.aid.t) / 0.2) : 0;
    V.cat = anim.cat ? 1 : 0; V.wink = anim.wink ? 1 : 0;
    V.ham = anim.ham ? Math.sin(anim.ham.t * 3.4) * (1 - anim.ham.t / anim.ham.dur) : 0;
    V.gnome = anim.gnome ? Math.abs(Math.sin(anim.gnome.t * 14)) * (1 - anim.gnome.t / anim.gnome.dur) : 0;
    V.cook = cookView(); V.wash = washView();
  }
  function leave(from) { // he left the room: the pancakes stop (hob off), little flyers go
    if (from === 'kitchen' && cook) cookEnd(false);
    if (from === 'zal' && pig) pig = null; if (from === 'hall') { moth = null; if (parcel && parcel.st !== 'wait') parcel = null; frontWant = 0; if (vac) { vac = null; AUDIO.stop('vacuum'); } } if (from === 'balcony') fly = null;
    AUDIO.stop('fry'); AUDIO.stop('gondola'); if (from === 'bath') { AUDIO.stop('wash'); AUDIO.stop('spin'); } // the machine keeps going, quietly
    for (const id of ['stars', 'cab', 'drawer', 'tap', 'aid', 'frog', 'cat', 'chair', 'ham', 'desk', 'clock', 'gondola', 'wink', 'fig', 'router', 'linux', 'mask']) delete anim[id];
  }
  function draw(c, P, layer) {
    const r = HOME.room;
    if (layer === 'mid') { if (r === 'zal') { drawStars(c, P); drawPigeon(c, P); } if (r === 'hall') { drawParcel(c, P); drawMoth(c, P); drawVac(c, P, 'mid'); } if (r === 'bath') drawAid(c, P); }
    else { if (r === 'kitchen') drawPancakeFly(c, P); if (r === 'hall') drawVac(c, P, 'top'); if (r === 'zal') drawDim(c); if (r === 'bath') drawFrog(c, P); if (r === 'balcony') drawFly(c, P); drawPlaster(c, P); }
  }
  function info() {
    const c = cook, w = wash;
    return { last, n: nHit, win: { zal: V.win.zal >= 1 ? 'open' : V.win.zal <= 0 ? 'closed' : 'moving', balcony: V.win.balcony >= 1 ? 'open' : V.win.balcony <= 0 ? 'closed' : 'moving' },
      cook: c ? { ph: c.ph, n: c.n, burnt: c.burnt, head: c.head } : null, wash: w ? { ph: w.ph, dx: w.dx + w.walk } : null,
      pigeon: pig ? pig.st : null, pigeonAt: pig ? [Math.round(pig.x), Math.round(pig.y - 5)] : null, parcel: parcel && parcel.st !== 'open' ? parcel.st : null, parcelAt: parcel ? [Math.round(parcel.x), Math.round(parcel.y - 5)] : null,
      candles: V.candles, garland: V.garland, poster: V.poster, rack: V.rack.fall > 0.5 ? 'down' : 'up', sconces: V.bsc, plaster: plaster > 0,
      curtain: V.curtain >= 1 ? 'closed' : V.curtain <= 0 ? 'open' : 'moving', torsher: V.torsher, vacuum: vac ? 'go' : 'dock', vacRide: !!(vac && vac.ride), vacAt: [Math.round(V.vac.x), Math.round(V.vac.y)], fig: V.fig ? V.fig.id : null, knob: V.knob.st };
  }
  // Round 14b: the rack in Абибян's paws — fall 1 (flat) … 0 (upright), its angle follows; settle: the last push, a clank and a small wobble
  function rackSet(f, settle) { const r = V.rack; delete anim.rack; r.held = !settle; r.fall = Math.max(0, Math.min(1, f)); r.a = r.fall * 1.42; if (settle) { r.fall = 0; r.a = 0; anim.rack = { t: 0, dur: 0.7, wob: true }; sfx('clank'); } }
  function cookPose() { return cook ? cook.ph : null; }
  const ids = () => [...new Set(Object.values(T).flat().map((e) => e[0]))]; // every gag there is (with everything bought)
  return { hit, update, draw, leave, info, ids, map, found, vacBody, knobPick, knobFix, view: () => V, cooking: () => !!cook, cookGo, rackSet, cookPose, front: () => V.front, vacGo, vacTap, vacRiding: () => !!(vac && vac.ride),
    _reset: () => { Object.assign(V.knob, { st: 'on', n: 0, nT: 0, w: 0 }); for (const id in anim) delete anim[id]; V.rack.held = false; timers = []; pig = null; moth = null; fly = null; plaster = 0; parcel = null; frontWant = 0; if (cook) cookEnd(false); wash = null; for (const r in WIN) WIN[r].want = 0; V.win.zal = V.win.balcony = 0; V.candles = false; V.garland = 0; V.poster = 0; V.rack = { a: 0, fall: 0 }; V.bsc = true; last = null;
      curt.want = 0; curt.said = true; V.curtain = 0; if (vac) AUDIO.stop('vacuum'); vac = null; figSel = null; V.torsher = false; V.fig = null; V.router = V.linux = V.mask = -1; V.vac = { x: VAC_PATH[0][0], y: VAC_PATH[0][1], on: false, t: 0 }; },
    _force: (o) => Object.assign(force, o), get t() { return t; } };
})();
