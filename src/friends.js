'use strict';
// ===== Friends: Пуся (kitchen sofa), Крот Монти (soil box on the balcony), Москит (bathroom) + bed pillows (Морковка, Перец) =====
// They live at home spots, sometimes visit Абибян (one at a time) and follow him between rooms. Tap → card: chat / special / duel.
const FRIENDS = (() => {
  const S = () => GAME.S, FD = DATA.FRIENDS, PL = DATA.PILLOW_LINES, IDS = DATA.FIDS.slice();
  const pick = (a) => a[Math.floor(Math.random() * a.length)], rnd = (a, b) => a + Math.random() * (b - a);
  const GY = ROOMS.GROUND;
  // where each friend lives and where visitors stand come from the rooms' own layout (ROOMS.spots: pusya/monty/mosq, visit, visitFly)
  const HOMES = {}, VSPOT = {}, VFLY = {};
  for (const r of DATA.ROOMS) { const sp = ROOMS.spots(r.id, {}) || {}; VSPOT[r.id] = sp.visit || [140, 274]; if (sp.visitFly) VFLY[r.id] = sp.visitFly; for (const id of IDS) if (sp[id]) HOMES[id] = { room: r.id, x: sp[id][0], y: sp[id][1], gy: sp[id][2] }; }
  const vspot = (f, r) => { const v = FLY[f.id] && VFLY[r] || VSPOT[r]; return [v[0], FLY[f.id] ? v[1] - (v[2] || FLYUP) : v[1], v[1]]; };
  const FLY = { mosq: 1 }, FLYUP = 62, SND = { pusya: 'mew', monty: 'mumble', mosq: 'buzz', zhuk: 'chirr' };
  // Round 7 #2: Жучок hangs on the key rack by his chain (no floor shadow, a gentle sway); the hook comes from the hall's layout
  const HOOK = {}; for (const r of DATA.ROOMS) { const sp = ROOMS.spots(r.id, {}) || {}; if (sp.zhukHook) HOOK.zhuk = { room: r.id, x: sp.zhukHook[0], y: sp.zhukHook[1] }; }
  // Round 12 #2: only while he is really at his place under the hook — on Абибян's fur (or anywhere else) he is unhooked, no chain stretched across the hall
  const hanging = (f) => !!HOOK[f.id] && f.mode === 'home' && f.room === HOOK[f.id].room && !f.path && !f.onFur && Math.hypot(f.x - HOMES[f.id].x, f.y - HOMES[f.id].y) < 2;
  const VISIT_GAP = 240e3, VISIT_LEN = 60, VISIT_EXT = 30, VISIT_MAX = 150, FIRST_VISIT = 60;
  let timers = []; const later = (d, fn) => timers.push({ at: t + d, fn });
  let t = 0, scene = null, checkT = 5, lastRoom = null, greetT = 15, drawn = [], bub = null, kitC = null;
  const F = {};
  for (const id of IDS) { const h = HOMES[id]; F[id] = { id, mode: 'home', room: h.room, x: h.x, y: h.y, gy: h.gy || h.y, path: null, pose: null, poseUntil: 0, talkUntil: 0, blinkT: rnd(2, 5), idleT: rnd(5, 10), until: 0, lastChat: -1, jy: 0, vy: 0, bob: 0, look: null, lookUntil: 0, headY: h.y - 40, since: 0 }; }
  // pillows LIE on the bed (user: «положить на кровать и сделать меньше»): carrot on the blanket, pepper on top of her,
  // both with their heads toward the headboard; native art size (k 1 ≈ the baby's height). x/y = sprite anchor (bottom).
  const PK = 1, PIL = {
    carrot: { id: 'carrot', x: 26, y: 203, sh: 6, anim: null, mood: 'idle', moodUntil: 0, taps: [], held: false, holdT: 0, heartT: 0, funCD: 0, jig: 0, top: 174 },
    pepper: { id: 'pepper', x: 31, y: 188, anim: null, mood: 'idle', moodUntil: 0, taps: [], held: false, holdT: 0, heartT: 0, funCD: 0, jig: 0, top: 160 },
  };
  // asleep: he hugs the carrot across his chest (on top of the blanket, paws over her); the pepper sits up against the headboard by his head
  const NIGHT = { carrot: [28, 217], pepper: [10, 200] };

  // ---------- movement ----------
  function moveTo(f, x, y, sp, arc, then) { const d = Math.hypot(x - f.x, y - f.y); f.path = { x0: f.x, y0: f.y, x1: x, y1: y, t: 0, dur: Math.max(0.15, d / sp), arc: arc || 0, then }; }
  const crossKitchen = (x0, y0, x1, y1) => Math.min(x0, x1) < 178 && Math.max(x0, x1) > 106 && (y0 < 266 || y1 < 266);
  const crossMonkey = (x0, y0, x1, y1) => {
    if (typeof HOME === 'undefined' || !HOME.mk) return false;
    const mx = HOME.mk.x, my = HOME.mk.y;
    if ((x0 - mx) * (x1 - mx) < 0 && Math.abs(x1 - x0) > 20) {
      const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
      return minY < my + 38 && maxY > my - 45;
    }
    return false;
  };
  function walkTo(f, x, y, sp, arc, then) {
    if (f.room === 'kitchen' && !FLY[f.id] && crossKitchen(f.x, f.y, x, y)) {
      const sp_ = sp || 55;
      if (f.y < 272) {
        moveTo(f, f.x, 272, sp_, 0, () => moveTo(f, x, 272, sp_, 0, () => moveTo(f, x, y, sp_, arc || 0, then)));
      } else {
        moveTo(f, x, 272, sp_, 0, () => moveTo(f, x, y, sp_, arc || 0, then));
      }
      return;
    }
    if (!FLY[f.id] && f.room === HOME.room && crossMonkey(f.x, f.y, x, y)) {
      const sp_ = sp || 55;
      const mx = HOME.mk.x, my = HOME.mk.y;
      const detY = Math.min(296, Math.max(290, my + 38));
      const dir = Math.sign(x - f.x) || 1;
      const x1A = dir > 0 ? mx - 36 : mx + 36;
      const x1B = dir > 0 ? mx + 36 : mx - 36;
      if ((dir > 0 && f.x < x1A) || (dir < 0 && f.x > x1A)) {
        moveTo(f, x1A, detY, sp_, 0, () =>
          moveTo(f, x1B, detY, sp_, 0, () =>
            moveTo(f, x, y, sp_, arc || 0, then)
          )
        );
      } else {
        moveTo(f, x1B, detY, sp_, 0, () =>
          moveTo(f, x, y, sp_, arc || 0, then)
        );
      }
      return;
    }
    moveTo(f, x, y, sp, arc, then);
  }
  const behindTable = () => IDS.some((id) => { const f = F[id]; return f.room === 'kitchen' && !f.onFur && f.y < 252 && f.x >= 106 && f.x <= 178; });
  function anchor(f) { if (f.mode === 'party') { const v = pslot(f, f.room); return [v[0], v[1]]; } if (f.mode === 'visit' || f.mode === 'leave') { const v = vspot(f, f.room); return [v[0], v[1]]; } const h = HOMES[f.id]; return [h.x, h.y]; }
  function goHome(f) { const h = HOMES[f.id]; Object.assign(f, { onFur: false, mode: 'home', room: h.room, x: h.x, y: h.y, gy: h.gy || h.y, path: null, jy: 0, vy: 0 }); }
  function hop(f, v) { if (f.jy >= 0 && !FLY[f.id]) f.vy = -v; }
  const visitorId = () => IDS.find((id) => F[id].mode === 'visit' || F[id].mode === 'leave') || null;

  // ---------- speech ----------
  function speakerPos(who) {
    const camY = HOME.camY || 0;
    const ty = (typeof HOME !== 'undefined' && HOME.topY) ? HOME.topY() : 0;
    if (F[who]) { const f = F[who]; if (f.room !== HOME.room) return null; return { x: f.x, y: f.headY + ty - 3 - camY }; }
    const p = PIL[who]; if (!p || HOME.room !== 'zal') return null; return { x: p.x, y: p.top + ty - 3 - camY };
  }
  function fsay(who, text, kind) {
    const cd = AUDIO.chat(kind || (F[who] ? FD[who].voice : who), text) || 0, dur = Math.max(cd, Math.max(2.4, 0.9 + text.length * 0.05));
    if (F[who]) F[who].talkUntil = t + Math.max(0.35, cd);
    UI.hideBubble(); const p = speakerPos(who); if (p) { bub = { who }; UI.fbubble(text, p.x, p.y, (dur + 1.2) * 1000); }
    return dur;
  }
  function monkeySay(text, mood) { if (S().sleeping || (APP.scene !== 'home' && APP.scene !== 'boot')) return 0; UI.fhideBubble(); bub = null; const d = HOME.say(text, mood) || 1.8; return Math.max(2.2, d); }

  // ---------- scenes: queue of ['f'|'a', text, mood] lines, ['w', sec] waits and step functions (return seconds to wait) ----------
  function run(id, lines, onEnd) { scene = { id, q: lines.slice(), wait: 0.45, onEnd, lineT: t }; }
  function cancelScene() {
    if (!scene) return;
    const sid = scene.id;
    if (F[sid]) {
      F[sid].onFur = false;
      if (F[sid].mode === 'home' && F[sid].room === HOMES[sid].room) {
        const a = anchor(F[sid]);
        if (Math.hypot(F[sid].x - a[0], F[sid].y - a[1]) > 6) {
          walkTo(F[sid], a[0], a[1], FLY[sid] ? 70 : 60, 0);
        }
      }
    }
    scene = null; UI.fhideBubble(); bub = null; if (heist) endHeist();
  }
  function sceneActive() { return !!scene && !UI.hasModal(); }
  function tapScene() {
    if (!scene || UI.hasModal()) return false;
    if (scene.lineT && (t - scene.lineT < 0.35)) return true;
    scene.wait = 0;
    sceneTick(0);
    return true;
  }
  function sceneTick(dt) {
    if (!scene || UI.hasModal()) return; scene.wait -= dt; if (scene.wait > 0) return;
    const l = scene.q.shift();
    if (!l) { const s = scene; scene = null; if (s.onEnd) s.onEnd(); return; }
    scene.lineT = t;
    if (typeof l === 'function') { const w = l(); scene.wait = typeof w === 'number' ? w : 0.35; return; }
    if (l[0] === 'w') { scene.wait = l[1]; return; }
    const f = F[(l[0] === 'f' && l[3]) || scene.id]; // party scenes: ['f', text, pose, who]
    if (l[0] === 'f') { if (!f || f.room !== HOME.room) { scene.wait = 0.1; return; } const d = fsay(f.id, l[1]); if (l[2]) { f.pose = l[2]; f.poseUntil = t + d + 1.2; } HOME.lookAt(f.x, f.headY, d + 0.5); scene.wait = Math.max(2.6, d + 0.5); return; }
    if (f) HOME.lookAt(f.x, f.headY, 3); const d = monkeySay(l[1], l[2]);
    for (const q of f ? [f] : IDS.map((k) => F[k]).filter((q) => q.room === HOME.room)) { q.look = [Math.sign(HOME.mk.x - q.x), 0]; q.lookUntil = t + 3; }
    scene.wait = Math.max(2.6, Math.max(d, 0.7 + l[1].length * 0.045) + 0.5);
  }

  // ---------- chat / specials ----------
  function extend(f) { if (f.mode === 'visit') f.until = Math.min(f.since + VISIT_MAX, Math.max(f.until, t + VISIT_EXT)); }
  function chat(id) {
    const f = F[id], L = FD[id].chat; let i; do { i = Math.floor(Math.random() * L.length); } while (L.length > 1 && i === f.lastChat); f.lastChat = i;
    extend(f); GAME.friendChat(id); for (let k = 0; k < 3; k++) HOME.fx.spawn('heart', (f.x + HOME.mk.x) / 2 + rnd(-10, 10), f.headY + rnd(0, 12), { vy: -20, life: 1.1, wob: 5 });
    run(id, L[i]);
  }
  function spLeftTxt(ms) { const m = Math.ceil(ms / 60000); return m >= 60 ? Math.floor(m / 60) + ' ч ' + (m % 60) + ' мин' : m + ' мин'; }
  function shoulder() { const mk = HOME.mk, sp = mk.sp; if (!sp) return [mk.x - 16, mk.y - 44]; const b = sp.body; return [mk.x + b.x - b.rx * 0.75, mk.y + b.y - b.ry * 0.55]; }
  function special(id) {
    const s = S(), Fd = FD[id], f = F[id];
    if (GAME.friendship(id).mood === 'sulky') { f.look = [-Math.sign(HOME.mk.x - f.x) || 1, 0]; f.lookUntil = t + 2.5; AUDIO.play('nope'); run(id, [['f', Fd.eat.sulk], ['a', pick(DATA.LINES.fSulk), 'sad']]); return 'sulk'; }
    if (GAME.spLeft(id) > 0) { run(id, [['f', Fd.spCd]]); return 'cd'; }
    if (id === 'mosq' && s.st.energy > 85) { run(id, [['f', Fd.spFull]]); return 'full'; }
    if (id === 'zhuk' && s.st.clean > 85) { run(id, [['f', Fd.spFull]]); return 'full'; }
    extend(f);
    const back = () => {
      const a = anchor(f);
      walkTo(f, a[0], a[1], FLY[id] ? 70 : 60, FLY[id] ? 0 : (Math.abs(a[1] - f.y) > 20 ? 18 : 0));
      return (f.path ? f.path.dur : 1.2) + 0.15;
    };
    const ensureBack = () => {
      const a = anchor(f);
      if (Math.hypot(f.x - a[0], f.y - a[1]) > 5) walkTo(f, a[0], a[1], FLY[id] ? 70 : 60, 0);
    };
    if (id === 'pusya') {
      run(id, [
        ...Fd.spGo,
        () => {
          AUDIO.play('purr');
          const side = f.x <= HOME.mk.x ? -1 : 1;
          const tx = HOME.mk.x + side * 12;
          moveTo(f, tx, GY + 2, 75, 0);
          f.look = [side < 0 ? 1 : -1, 0];
          f.lookUntil = t + 5.0;
          return (f.path ? f.path.dur : 0.4) + 0.15;
        },
        () => {
          const side = f.x <= HOME.mk.x ? -1 : 1;
          f.look = [side < 0 ? 1 : -1, 0];
          f.lookUntil = t + 5.0;
          f.pose = 'knead';
          f.poseUntil = t + 4.2;
          f.onFur = true;
          AUDIO.play('purr');
          HOME.act('massage', { keep: true, dur: 4.5 });
          const contactX = HOME.mk.x + (side < 0 ? -4 : 4);
          const contactY = HOME.mk.y - 14;
          for (let k = 0; k < 11; k++) {
            later(k * 0.35, () => {
              if (f.pose !== 'knead') return;
              HOME.fx.spawn('heart', contactX + rnd(-5, 5), contactY + rnd(-8, 8), { vy: -20, life: 1.1, wob: 4 });
              HOME.fx.spawn('spark', contactX + rnd(-4, 4), contactY + rnd(-5, 5), { vy: -14, life: 0.5 });
              if (k === 3 || k === 7) AUDIO.play('purr');
              if (k % 2 === 0) AUDIO.play('pop');
            });
          }
          return 4.2;
        },
        () => {
          f.onFur = false;
          GAME.friendSpecial(id);
          gain('+14', 'energy');
          gain('+10', 'fun');
          AUDIO.play('happy');
          f.pose = 'happy';
          f.poseUntil = t + 1.2;
          HOME.act('hop');
          later(0.3, () => {
            HOME.say(pick((DATA.LINES && DATA.LINES.massage) || ['М-м-м, кайф!', 'Как приятно!', 'Шпашибо, Пушя!', 'Вот это машшаж!']), 'happy');
          });
          const backX = HOME.mk.x + (f.x <= HOME.mk.x ? -26 : 26);
          walkTo(f, backX, GY + 2, 75, 0);
          return 1.2;
        },
        ...Fd.spDone,
        back
      ], () => { f.onFur = false; ensureBack(); });
    } else if (id === 'zhuk') {
      // «Щёточка»: hops off the hook onto his shoulder, scurries over the fur (shoulder → tummy → other side → head), sparkles; he laughs (ticklish)
      const fur = () => { const mk = HOME.mk, ht = HOME.headTop(), h = mk.y - ht; return [[-0.3, 0.42], [-0.12, 0.7], [0.2, 0.62], [0.3, 0.4], [0.05, 0.12]].map(([dx, dy]) => [mk.x + dx * h * 0.62, ht + dy * h + 9]); };
      const step = (i) => () => { const q = fur()[i]; f.onFur = true; f.pose = 'brush'; f.poseUntil = t + 9; moveTo(f, q[0], q[1], 70, i ? 4 : 26); AUDIO.play('brush'); for (let k = 0; k < 4; k++) HOME.fx.spawn('spark', q[0] + rnd(-8, 8), q[1] - rnd(0, 10), { vy: -18, life: 0.6 }); if (i === 1) HOME.face('happy', 'smile', 3, { blush: 1 }); return f.path.dur + 0.12; };
      run(id, [...Fd.spGo, () => { AUDIO.play('jingle'); hop(f, 80); return 0.2; }, step(0), step(1), step(2), step(3), step(4),
        () => { GAME.friendSpecial(id); gain('+25', 'clean'); HOME.act('hop'); AUDIO.play('chirr'); for (let k = 0; k < 10; k++) HOME.fx.spawn('spark', HOME.mk.x + rnd(-24, 24), HOME.mk.y - rnd(10, 80), { vy: -26, life: 0.8 }); return 0.4; },
        ...Fd.spDone, () => { f.poseUntil = 0; f.onFur = false; return back(); }], ensureBack);
    } else if (id === 'monty') {
      run(id, [...pick(Fd.stories), () => { GAME.friendSpecial(id); gain('+14', 'fun'); HOME.act('hop'); return 0.2; }, ...Fd.spDone], ensureBack);
    } else {
      run(id, [...Fd.spGo, () => { const [sx, sy] = shoulder(); moveTo(f, sx - 7, sy + 23, 80, 0); return f.path.dur + 0.1; },
        () => { f.pose = 'bite'; f.poseUntil = t + 0.9; AUDIO.play('bite'); HOME.face('wide', 'o', 0.6); const [sx, sy] = shoulder(); HOME.fx.spawn('ring', sx, sy, { r0: 2, r1: 10, life: 0.35, c: '#ffffff' });
          later(0.18, () => { if (f.room !== HOME.room) return; AUDIO.play('puk'); UI.hideBubble(); const q = speakerPos(id); if (q) { bub = { who: id }; UI.fbubble(Fd.spPuk, q.x, q.y, 1500); } }); return 0.9; }, // Round 7 #1: «Пук!» in a text bubble, not only the sound
        () => { GAME.friendSpecial(id); gain('+35', 'energy'); HOME.hop(130); for (let k = 0; k < 10; k++) HOME.fx.spawn('spark', HOME.mk.x + rnd(-24, 24), HOME.mk.y - rnd(10, 80), { vy: -30, life: 0.8 }); return 0.5; },
        ...Fd.spDone, back], ensureBack);
    }
    return 'ok';
  }
  function gain(txt, icon) { const ht = HOME.headTop(), ty = (typeof HOME !== 'undefined' && HOME.topY) ? HOME.topY() : 0; UI.float(HOME.mk.x + 30, ht + ty - (HOME.camY || 0), txt, UI.I(icon)); AUDIO.play('happy'); }

  // ---------- visits ----------
  function canVisit() { const s = S(); return !visitorId() && !scene && !party && !guest && !heist && !s.sleeping && APP.scene === 'home' && !DASHA.busy() && !UI.hasModal() && !UI.sheetOpen && t >= FIRST_VISIT && Date.now() - (s.friends.visitAt || 0) >= VISIT_GAP; }
  function tryVisit(needed) { // needed: only a friend he needs right now (tired / bored / dirty); else also the random drop-ins
    if (!canVisit()) return false; const s = S(), r = HOME.room, c = [];
    if (s.st.energy < 30 && GAME.spLeft('mosq') <= 0) c.push('mosq');
    if (s.st.fun < 35) c.push('pusya');
    if (s.st.clean < 30 && GAME.spLeft('zhuk') <= 0) c.push('zhuk');
    if (!needed && Math.random() < 0.05) c.push('monty');
    if (!needed) for (const id of IDS) if ((s.friends[id] || {}).lv >= 3 && Math.random() < 0.04) c.push(id);
    const ok = c.filter((id) => HOMES[id].room !== r); return ok.length ? startVisit(ok[0]) : false;
  }
  // the flat is a line (balcony – kitchen – hall – zal – bath, as the arrows go): a friend walks in from the side of the room he comes from
  // (his own room when he visits, the room Абибян has just left when he follows). Round 6 B: the hall has no doors to the zal / bath any
  // more, so there too they simply come in from the edge (zal & bath → right, kitchen & balcony → left). The front door is not for friends.
  const ORDER = DATA.ROOMS.map((q) => q.id), idx = (q) => ORDER.indexOf(q);
  function enterRoom(f, r, fast, from, to) {
    from = from || HOMES[f.id].room; const v = to || vspot(f, r), sp = fast ? 95 : 55;
    f.room = r; f.gy = v[2]; f.jy = 0; f.vy = 0;
    const fromR = idx(from) > idx(r);
    f.x = fromR ? 206 : -26;
    if (r === 'kitchen' && !FLY[f.id] && fromR && v[0] < 178) {
      f.y = 272;
      walkTo(f, v[0], v[1], sp, 0, null);
      return Math.abs(f.x - v[0]) / sp + Math.abs(272 - v[1]) / sp;
    }
    f.y = v[1];
    walkTo(f, v[0], v[1], sp, 0, null); return f.path ? f.path.dur : 0.5;
  }
  function startVisit(id) {
    const f = F[id], r = HOME.room; if (HOMES[id].room === r || visitorId()) return false;
    f.mode = 'visit'; f.since = t; f.until = t + VISIT_LEN; S().friends.visitAt = Date.now(); GAME.save();
    const d = enterRoom(f, r), lv = GAME.friendship(id).lv, g = lv >= 1 && GAME.giftToday(id) < (lv >= 3 ? 2 : 1) && Math.random() < 0.5; if (g) S().friends[id].gn++;
    ALBUM.moment('friend:' + id, { title: FD[id].name + ' в гостях', delay: d + 1.6, room: r }); AUDIO.play(SND[id]); run(id, [['w', d + 0.2], ...FD[id].visit, ...(g ? [() => { gift(id); return 2.4; }] : [])]); return true;
  }
  function goAway(f) {
    if (f.mode !== 'leave') return; const home = HOMES[f.id].room, out = idx(home) < idx(f.room) ? -30 : 210, sp = 60;
    walkTo(f, out, FLY[f.id] ? f.y : (f.room === 'kitchen' && out > 180 ? 272 : f.y), sp, 0, () => goHome(f));
  }
  function leave(f, quiet) {
    if (f.mode !== 'visit') return; f.mode = 'leave'; if (scene && scene.id === f.id) cancelScene();
    const go = () => goAway(f);
    if (quiet || f.room !== HOME.room) go(); else { fsay(f.id, FD[f.id].bye); f.pose = 'happy'; f.poseUntil = t + 1; later(0.9, go); }
  }
  // ---------- Round 15: the friends visit each other (Жучок ↔ Пуся, Москит ↔ Монти) and talk among themselves ----------
  // the guest leaves his room at the side of his friend's room (off the hook / the sofa / out of the box first), sits next to the friend,
  // they talk in turns (Абибян looks at whoever speaks and says something; a tap on them — he joins in), then the guest says bye and goes
  // back the same way. Unseen it just takes a while; at the guest's home Абибян misses him («А где Жучок? Наверное, у Пуси!»).
  const PAIR = { zhuk: 'pusya', pusya: 'zhuk', mosq: 'monty', monty: 'mosq' }, PAIRS = { zhuk: ['pusya', 'monty', 'mosq'], pusya: ['zhuk', 'monty', 'mosq'], mosq: ['monty', 'pusya', 'zhuk'], monty: ['mosq', 'pusya', 'zhuk'] }, FC = DATA.FCHAT, GUEST_LEN = 45, GUEST_GAP = 150;
  const GSPOT = { zhuk: [60, 244], pusya: [130, 262], mosq: [74, 222, 256], monty: [36, 286] }, WALKY = { zhuk: 250, pusya: 246, monty: 270 };
  let guest = null, guestT = 90;
  const gspot = (id) => { const v = GSPOT[id]; return [v[0], v[1], v[2] || v[1]]; };
  const babble = () => !!GAME.ageDef().babble;
  function startGuest(id, targetHost) {
    const host = targetHost || PAIR[id];
    if (id === 'pusya' && host === 'monty' && ROOMS.phase() === 'night') return false;
    const f = F[id], h = host && F[host]; if (!h || guest || party || heist || visitorId() || f.mode !== 'home' || h.mode !== 'home' || f.onFur || f.path || S().sleeping) return false;
    const room = HOMES[host].room, from = HOMES[id].room; if (scene && (scene.id === id || scene.id === host)) cancelScene();
    guest = { id, host, room, from, ph: 'go', until: t + GUEST_LEN, n: 0 }; guestT = t + GUEST_LEN + GUEST_GAP; f.mode = 'guest';
    if (HOME.room === from) { // seen leaving
      const out = idx(room) < idx(from) ? -30 : 210, sp = FLY[id] ? 70 : 60;
      let gy = FLY[id] ? f.y : WALKY[id] || 250;
      if (from === 'kitchen' && !FLY[id] && out > 180) gy = 272;
      const go = () => walkTo(f, out, gy, sp, 0, arrive);
      if (!FLY[id] && Math.abs(f.y - gy) > 3) walkTo(f, f.x + (out < 0 ? -6 : 6), gy, 110, 9, go); else go();
      AUDIO.play(SND[id]); f.pose = 'happy'; f.poseUntil = t + 1;
    } else arrive();
    return true;
  }
  function arrive() {
    const g = guest; if (!g) return; const f = F[g.id], v = gspot(g.id); g.ph = 'there';
    if (HOME.room === g.room) { const d = enterRoom(f, g.room, false, g.from, v); AUDIO.play(SND[g.id]); later(d + 0.3, startChat); return; }
    Object.assign(f, { room: g.room, x: v[0], y: v[1], gy: v[2], path: null, jy: 0, vy: 0 });
    if (HOME.room === g.from) later(0.4, () => { if (guest === g && HOME.room === g.from && !scene) { if (babble()) AUDIO.play('giggle'); else monkeySay(pick(DATA.LINES['fc_away_' + g.id] || ['Ушёл в гошти!'])); } });
  }
  function lookEach(g) { const a = F[g.id], b = F[g.host]; if (a.room !== b.room) return 0.05; a.look = [Math.sign(b.x - a.x) || 1, 0]; b.look = [Math.sign(a.x - b.x) || 1, 0]; a.lookUntil = b.lookUntil = t + 4; return 0.05; }
  function startChat() {
    const g = guest; if (!g || g.ph !== 'there' || HOME.room !== g.room || scene || party || S().sleeping || UI.hasModal() || g.n >= 2) return;
    const fs = S().friends[g.id] || (S().friends[g.id] = {});
    let D = FC[g.id + '>' + g.host] || [];
    if (ROOMS.phase() === 'night') {
      D = D.filter((dl) => !dl.some(([who, text]) => /солн/i.test(text)));
    }
    const i = ((fs.fci || 0) + 0) % Math.max(1, D.length), dl = D[i] || []; fs.fci = i + 1;
    const L = [];
    dl.forEach(([who, text, pose], k) => { L.push(() => lookEach(g), fl(who, text, pose || 'idle')); if (k === 1) L.push(babble() ? () => { AUDIO.play('giggle'); HOME.face('happy', 'smile', 1); return 0.7; } : ['a', pick(DATA.LINES.fc_peek), 'happy']); });
    g.until = Math.max(g.until, t + 25);
    run('fchat', L, () => { if (guest !== g) return; g.n++; if (HOME.room === g.room) g.until = Math.min(g.until, t + 1.6); });
  }
  function joinChat(id) { // a tap on one of them while they talk: Абибян asks to join, the friend answers, everybody's happy
    const g = guest; if (!g || g.joined) return false; g.joined = true;
    const lines = [babble() ? () => { AUDIO.play('giggle'); HOME.hop(60); return 0.8; } : ['a', pick(DATA.LINES.fc_join), 'happy'], () => lookEach(g), fl(id, FC.join[id] || 'Ура!', 'happy'),
      () => { for (const q of [F[g.id], F[g.host]]) { hop(q, 80); HOME.fx.spawn('heart', q.x, q.headY - 2, { vy: -18, life: 1.1, wob: 4 }); } HOME.face('happy', 'smile', 1.4); return 0.8; }];
    GAME.stat('fun', 4); AUDIO.play('happy');
    if (scene && scene.id === 'fchat') scene.q.unshift(...lines); else run('fchat', lines, () => { if (guest === g && HOME.room === g.room) g.until = Math.min(g.until, t + 1.6); });
    g.until = Math.max(g.until, t + 12); return true;
  }
  function guestLeave() {
    const g = guest; if (!g || g.ph !== 'there') return; const f = F[g.id]; g.ph = 'back'; if (scene && scene.id === 'fchat') cancelScene();
    if (HOME.room !== g.room) { comeHome(); return; }
    const d = fsay(g.id, FC.bye[g.id] || 'Пока!'); f.pose = 'happy'; f.poseUntil = t + 1; lookEach(g);
    later(Math.min(1.4, d + 0.2), () => {
      if (guest !== g || f.room !== g.room) return;
      const out = idx(g.from) < idx(g.room) ? -30 : 210, sp = FLY[g.id] ? 70 : 60;
      walkTo(f, out, FLY[g.id] ? f.y : (g.room === 'kitchen' && out > 180 ? 272 : f.y), sp, 0, comeHome);
    });
  }
  function comeHome() {
    const g = guest; if (!g) return; const f = F[g.id], hm = HOMES[g.id];
    if (HOME.room !== g.from) { goHome(f); guest = null; return; }
    const sp = FLY[g.id] ? 70 : 55, fromR = idx(g.room) > idx(g.from);
    let gy = FLY[g.id] ? hm.y : WALKY[g.id] || 250;
    if (g.from === 'kitchen' && !FLY[g.id] && fromR && hm.x < 178) gy = 272;
    f.room = g.from; f.x = fromR ? 206 : -26; f.y = gy; f.gy = hm.gy || hm.y; f.jy = 0; f.vy = 0; g.ph = 'home';
    const done = () => { goHome(f); if (guest === g) guest = null; };
    walkTo(f, hm.x, gy, sp, 0, () => { if (Math.abs(gy - hm.y) > 3) moveTo(f, hm.x, hm.y, 130, 10, done); else done(); });
  }
  function guestTick() {
    const g = guest; if (!g) return; const f = F[g.id];
    if (S().sleeping) { goHome(f); guest = null; return; }
    if (g.ph === 'there' && t > g.until && !(scene && scene.id === 'fchat') && !f.path && !UI.hasModal()) guestLeave();
  }
  function tryGuest() {
    if (guest || !canVisit() || t < guestT || Math.random() > 0.3) return false;
    const r = HOME.room;
    if (Math.random() < 0.7) {
      const ids = IDS.filter((id) => PAIR[id] && F[id].mode === 'home' && F[PAIR[id]].mode === 'home'), seen = ids.filter((id) => HOMES[PAIR[id]].room === r || HOMES[id].room === r);
      const id = (seen.length && Math.random() < 0.85) ? pick(seen) : ids.length ? pick(ids) : null; return id ? startGuest(id, PAIR[id]) : false;
    }
    const ids = IDS.filter((id) => F[id].mode === 'home'); const id = ids.length ? pick(ids) : null; if (!id) return false;
    const hosts = (PAIRS[id] || []).filter((h) => F[h].mode === 'home'); if (!hosts.length) return false;
    return startGuest(id, pick(hosts));
  }
  function onGuestRoom(r, prev) { // returns true when the guest takes over this room (no greeting then)
    const g = guest; if (!g) return false; const f = F[g.id];
    if (f.room === prev && f.path && g.ph === 'go') { f.path = null; arrive(); } // he was walking out in front of us
    else if (f.room === prev && g.ph === 'back') { f.path = null; comeHome(); }
    else if (g.ph === 'home' && f.room === prev) { goHome(f); guest = null; return false; }
    if (!guest) return false;
    if (g.ph === 'there' && r === g.room) { g.until = Math.max(g.until, t + 20); later(0.8, startChat); return true; }
    if (g.ph === 'there' && r === g.from && !g.missed) { g.missed = true; later(0.9, () => { if (guest === g && HOME.room === r && !scene && !S().sleeping) { if (babble()) HOME.face('sad', null, 1); else monkeySay(pick(DATA.LINES['fc_miss_' + g.id] || ['А где он?'])); } }); return true; }
    return g.ph === 'home' && r === g.from;
  }
  function pairTalk() { // a party line pair: one friend speaks to another by name, that one answers
    const D = (FC.party || []).filter((d) => d.every(([who]) => F[who] && F[who].mode === 'party')); if (!D.length) return [];
    const dl = pick(D), [a, b] = [dl[0][0], dl[1][0]], look = () => { const A = F[a], B = F[b]; A.look = [Math.sign(B.x - A.x) || 1, 0]; B.look = [Math.sign(A.x - B.x) || 1, 0]; A.lookUntil = B.lookUntil = t + 4; return 0.05; };
    return [look, ...dl.map(([who, text, pose]) => fl(who, text, pose || 'happy'))];
  }
  function onRoom(r, prev) {
    if (heist) { if (F.zhuk.ride) F.zhuk.room = r; return; } // Round 15b #3: on a heist nobody greets (Жучок rides along)
    if (party) { endParty(); UI.toast('Вечеринка закончилась — друзья разошлись по домам', UI.I('balloon')); }
    for (const id of IDS) if (F[id].mode === 'leave') goHome(F[id]);
    const v = visitorId();
    if (scene && scene.id !== v) cancelScene();
    if (v) {
      const f = F[v]; if (f.mode === 'leave') { goHome(f); }
      else if (r === HOMES[v].room) { goHome(f); if (scene) cancelScene(); later(0.7, () => { if (HOME.room === r && APP.scene === 'home') { fsay(v, pick(FD[v].hi)); F[v].pose = 'happy'; F[v].poseUntil = t + 1; } }); }
      else enterRoom(f, r, true, prev);
      return;
    }
    if (onGuestRoom(r, prev)) return;
    const id = IDS.find((k) => HOMES[k].room === r && F[k].mode === 'home');
    if (id && t > greetT && !S().sleeping && (greetNow || Math.random() < 0.5)) { // Round 8: he calls the friend by name (his own recording), the friend answers
      greetNow = false; greetT = t + 60; const ok = () => HOME.room === r && !scene && APP.scene === 'home' && !UI.hasModal();
      later(0.6, () => { if (!ok() || HOME.trip || F[id].mode !== 'home') return; const f = F[id]; f.look = [Math.sign(HOME.mk.x - f.x) || 1, 0]; f.lookUntil = t + 1.5; monkeySay(pick(CALL[id][GAME.ageDef().babble ? 0 : 1]), 'happy'); });
      later(2.1, () => { if (ok() && F[id].mode === 'home') { fsay(id, pick(FD[id].hi)); F[id].pose = 'happy'; F[id].poseUntil = t + 1.2; } });
    }
    if (r === HOMES.zhuk.room && t >= offerT && heistOK() && Math.random() < 0.3) { offerT = t + 600; later(3.9, offer); } // Round 15b #3: sometimes Жучок whispers «есть дело…»
  }
  // the lines he calls them by (neural TTS: SPEECH.lines); [little ones, the rest]
  const CALL = { pusya: [['Пуся, как я рад!'], ['Привет, Пуся, как дела?']], monty: [['Монти!'], ['Привет, Монти!']], mosq: [['Доктор Москит!'], ['Доктор Москит, а вы болеете?']], zhuk: [['Жучок, привет, малыш!'], ['Ты красавчик, Жучок!']] };
  let greetNow = false;

  // ================= Round 15b #3: «Вылазка» — Жучок is no thief, but always in on Абибян's adventures: they sneak Пуся's treats while she naps =================
  // from Жучок's card, on his whispered offer (a tap = yes) or by Абибян himself (ROUTINE free activity). Жучок rides on his shoulder, they tiptoe to
  // the kitchen, Пуся naps (zzz), he quietly opens the fridge and takes a treat (+1 in stock), Пуся wakes («Мур?! Кто тут шуршит?»), Жучок covers
  // («Это сквозняк!»), they tiptoe back, Жучок hops onto his hook: «Удачная вылазка!». +fun, +friendship. Once in 40 min.
  const HEIST_CD = 40 * 60e3, LOOT = ['icecream', 'cake', 'pancake', 'watermelon', 'apple', 'banana'], HL = DATA.HEIST;
  let heist = null, offerUntil = 0, offerT = 0;
  const heistLeft = () => Math.max(0, (S().friends.heistAt || 0) + HEIST_CD - Date.now());
  function heistOK() { const z = F.zhuk, p = F.pusya, s = S(); return !heist && !scene && !party && !guest && !visitorId() && !s.sleeping && APP.scene === 'home' && z.mode === 'home' && z.room === HOMES.zhuk.room && !z.onFur && !z.path && p.mode === 'home' && p.room === HOMES.pusya.room && !p.path && heistLeft() <= 0; }
  function ridePos() { const mk = HOME.mk, ht = HOME.headTop(); return [mk.x + 2, ht + 6 + (mk.jy || 0)]; } // on top of his head, in the fur
  const hline = (l) => l[0] === 'p' ? ['f', l[1], l[2] || null, 'pusya'] : l[0] === 'f' ? ['f', l[1], l[2] || null, 'zhuk'] : l;
  function offer() { if (HOME.room !== HOMES.zhuk.room || !heistOK() || UI.hasModal() || HOME.trip) return; const z = F.zhuk; z.pose = 'happy'; z.poseUntil = t + 1.5; hop(z, 60); fsay('zhuk', pick(HL.offer)); offerUntil = t + 10; UI.toast('Жучок зовёт на вылазку — нажми на него!', UI.F('icecream')); }
  function startHeist(src) {
    if (!heistOK() || HOME.room !== HOMES.zhuk.room || HOME.trip || UI.hasModal()) return false;
    const z = F.zhuk, p = F.pusya, s = S(); offerUntil = 0; heist = { ph: 'plan', src }; s.friends.heistAt = Date.now(); GAME.save(true);
    const stop = () => { if (scene) scene.q.length = 0; return 0.1; }; // something went wrong (a tap stopped him…): wrap up, no loot
    const go = (r, x, y, flag) => () => { HOME.sneak(true); if (!HOME.travel(r, x, y, () => { if (heist) heist[flag] = true; })) return stop(); return 0.3; };
    const loot = () => { const ok = LOOT.filter((k) => { const Fo = DATA.FOODS[k]; return Fo && (Fo.lvl || 0) <= s.lvl && (Fo.age || 0) <= s.grow.stage && (!GAME.ageDef().babble || Fo.kg < 0.3); }); return heist.got = ok.length ? pick(ok) : null; };
    run('zhuk', [...(src === 'offer' ? HL.yes : HL.plan).map(hline),
      () => { AUDIO.play('jingle'); hop(z, 80); return 0.25; },
      () => { const q = ridePos(); z.onFur = true; z.pose = 'walk'; z.poseUntil = t + 1; moveTo(z, q[0], q[1], 70, 22, () => { z.ride = true; }); return z.path.dur + 0.15; },
      () => { heist.ph = 'sneak'; p.nap = true; return go('kitchen', 118, 252, 'at')(); }, waitFor(() => heist && heist.at, 45),
      () => HOME.room === 'kitchen' && heist.at ? 0.1 : stop(), ...HL.tiptoe.map(hline),
      () => { heist.ph = 'fridge'; if (!HOME.fridgeSnack(loot, () => { if (heist) heist.back = true; })) return stop(); return 0.3; }, waitFor(() => heist && heist.back, 30),
      () => { heist.ph = 'caught'; HOME.sneak(false); if (!heist.got) { scene.q.unshift(...HL.empty.map(hline)); return 0.2; } const n = s.inv[heist.got] = (s.inv[heist.got] || 0) + 1; UI.toast(`Добыча: ${DATA.FOODS[heist.got].name} (теперь ×${n})`, UI.F(heist.got), 'gold'); GAME.save(); ALBUM.moment('heist', { title: 'Удачная вылазка', cap: S().name + ' и Жучок', delay: 0.3, room: 'kitchen' }); return 0.4; },
      () => { if (!heist.got) return 0.1; p.nap = false; p.look = [Math.sign(HOME.mk.x - p.x) || 1, 0]; p.lookUntil = t + 4; hop(p, 70); AUDIO.play(SND.pusya); return 0.3; },
      () => { if (!heist.got) return 0.1; scene.q.unshift(hline(HL.caught[0]), () => { HOME.face('wide', 'o', 2.4, { pose: 'cover' }); return 0.5; }, ...HL.caught.slice(1).map(hline), () => { p.nap = true; return 0.6; }); return 0.1; },
      () => { heist.ph = 'run'; return go('hall', 90, 262, 'home')(); }, waitFor(() => heist && heist.home, 45),
      () => { HOME.sneak(false); p.nap = false; z.ride = false; const h = HOMES.zhuk; AUDIO.play('jingle'); moveTo(z, h.x, h.y, 70, 24, () => goHome(z)); return z.path.dur + 0.2; },
      ...HL.home.map(hline),
      () => { if (heist && heist.got && HOME.room === 'hall') { heist.ph = 'done'; GAME.stat('fun', 15); GAME.friendChat('zhuk'); s.stats.heists = (s.stats.heists || 0) + 1; gain('+15', 'fun'); GAME.save(true); } return 0.1; },
    ], endHeist);
    return true;
  }
  function endHeist() { // always: Жучок back on his hook, Пуся awake, normal walking
    const z = F.zhuk; heist = null; HOME.sneak(false); F.pusya.nap = false; if (z.ride || z.onFur) { z.ride = false; goHome(z); }
  }

  // ---------- «Все вместе»: all three come over to his room and hang out (disco / cake / group photo / jokes), then go home ----------
  const PT = DATA.PARTY, PARTY_CD = 2 * 3600e3, PKINDS = ['disco', 'cake', 'photo', 'jokes'], PSPOT = {};
  for (const r of DATA.ROOMS) PSPOT[r.id] = (ROOMS.spots(r.id, {}) || {}).party || {};
  let party = null;
  const partyLeft = () => Math.max(0, (S().friends.partyAt || 0) + PARTY_CD - Date.now());
  // a friend who lives in this room stays at home (Пуся on her sofa, Монти in his box, Москит by the bath); the others get party places
  function pslot(f, r) { const h = HOMES[f.id]; if (h.room === r) return [h.x, h.y, h.gy || h.y]; const v = PSPOT[r][f.id] || VSPOT[r]; return FLY[f.id] ? [v[0], v[1] - (v[2] || FLYUP), v[1]] : [v[0], v[1], v[1]]; }
  const fl = (id, text, pose) => ['f', text, pose || 'happy', id];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const phase = (name) => () => { if (party) party.act = name; return 0.05; };
  const here = () => IDS.map((id) => F[id]).filter((f) => f.mode === 'party' && f.room === HOME.room);
  const arrived = () => IDS.every((id) => F[id].mode === 'party' && F[id].room === (party && party.room) && !F[id].path);
  function waitFor(cond, max) { let t0 = null; const fn = () => { if (t0 === null) t0 = t; if (!cond() && t - t0 < max && scene) { scene.q.unshift(fn); return 0.25; } return 0.1; }; return fn; }
  function startParty(o = {}) {
    const s = S(), r = HOME.room;
    if (party || s.sleeping || APP.scene !== 'home' || (!o.force && partyLeft() > 0)) return false;
    cancelScene(); guest = null; const kind = o.kind || pick(PKINDS.filter((k) => k !== s.friends.partyLast));
    party = { kind, room: r, auto: !!o.auto, act: 'gather', lights: 0, lt: 0, ball: 0, beat: -1, t0: 0, cake: null, bites: 0, stage: o.stage };
    s.friends.partyAt = Date.now(); if (kind !== 'grow') { s.friends.partyDay = GAME.dayStr(new Date()); s.friends.partyLast = kind; } /* Round 17: a growth party doesn't use up the daily one */ s.friends.visitAt = Date.now(); GAME.save(true);
    let k = 0;
    for (const id of shuffle(IDS)) {
      const f = F[id]; f.until = 0;
      if (f.room === r) { f.mode = 'party'; const v = pslot(f, r); f.gy = v[2]; if (Math.hypot(v[0] - f.x, v[1] - f.y) > 2) walkTo(f, v[0], v[1], FLY[id] ? 70 : 55, 0); continue; }
      goHome(f); f.mode = 'party';
      later(0.4 + 0.9 * k++, () => { if (!party || f.mode !== 'party' || HOME.room !== party.room) return; const d = enterRoom(f, r, false, null, pslot(f, r)); AUDIO.play(SND[id]); f.pose = 'happy'; f.poseUntil = t + d + 0.6; });
    }
    const L = [], two = shuffle(IDS).slice(0, 2), by = pick(IDS);
    if (kind === 'dasha') { run('party', dashaScript(o.bday), finishParty); return true; } // Round 22: her birthday
    if (kind === 'grow') { run('party', [...growScript(o.stage | 0), phase('bye'), ['a', pick(DATA.GPARTY.bye), 'happy'], () => { partyReward(); return 0.6; }, fl(by, PT.bye[by]),
      () => { HOME.act('wave'); for (const f of here()) { f.pose = 'happy'; f.poseUntil = t + 1.2; } return 0.6; }], finishParty); return true; }
    if (o.auto) L.push(waitFor(arrived, 10), fl('pusya', PT.surprise), ['a', pick(DATA.LINES.pWow), 'happy']);
    else L.push(['a', pick(DATA.LINES.pCall), 'happy'], waitFor(arrived, 10));
    L.push(fl(two[0], PT.hi[two[0]]), fl(two[1], PT.hi[two[1]]), ...pairTalk(), ['a', pick(DATA.LINES['p_' + kind]), 'happy'], phase(kind), ...PACT[kind](), phase('bye'),
      ['a', pick(DATA.LINES.pBye), 'happy'], () => { partyReward(); return 0.6; }, fl(by, PT.bye[by]), () => { HOME.act('wave'); for (const f of here()) { f.pose = 'happy'; f.poseUntil = t + 1.2; } return 0.6; });
    run('party', L, finishParty);
    return true;
  }
  // Round 17: the growth party — «Сюрприз!», a cake with the number candle of the stage, he blows it, the friends cheer, one gives the
  // stage gift (it flies to him in a box → puff → he wears it; one he has → 30 coins), cake for all, a countdown photo for the album
  function growScript(st) {
    const GP = DATA.GPARTY, A = DATA.AGES[st] || DATA.AGES[0], ord = shuffle(IDS), giver = IDS[st % IDS.length], gid = DATA.GIFT(st);
    return [waitFor(arrived, 10), fl(ord[0], GP.surprise[ord[0]]), ['a', pick(GP.wow), 'happy'], phase('cake'),
      () => { party.cake = { x: 90, y: 306, lit: 1, num: st, grow: 1 }; AUDIO.play('pop'); for (let k = 0; k < 12; k++) HOME.fx.spawn('spark', 90 + rnd(-20, 20), 292 + rnd(-16, 6), { vy: -20, life: 0.8 }); return 1; },
      fl(ord[1], GP.blow[ord[1]]), ['a', pick(DATA.LINES.pWish), 'happy'],
      () => { party.cake.lit = 0; AUDIO.play('blow'); for (let k = 0; k < 6; k++) HOME.fx.spawn('cloth', 86 + (k % 3) * 4, 276, { c: '#d8d8e0', vy: -14, vx: rnd(-4, 4), life: 1, sz: 2 }); later(0.5, () => AUDIO.play('cheer'));
        for (const f of here()) { f.pose = 'happy'; f.poseUntil = t + 1.6; hop(f, 90); } HOME.face('happy', 'laugh', 1.4); HOME.hop(90); return 1.2; },
      fl(ord[2], GP.cheer[ord[2]]), phase('gift'), fl(giver, GP.gift[giver]),
      () => { const f = F[giver], tx = HOME.mk.x, ty = HOME.headTop() + 20, T = 0.7, g = 260, fx0 = f ? f.x : 40, fy0 = f ? f.headY + 8 : 250; AUDIO.play('whoosh');
        HOME.fx.spawn('img', fx0, fy0, { img: ART.icon('gift'), vx: (tx - fx0) / T, vy: (ty - fy0 - 0.5 * g * T * T) / T, g, life: T });
        later(T, () => { const r = gid ? GAME.giftCloth(gid) : (GAME.addCoins(30, 'gift'), 'coins'), C = gid && DATA.CLOTHES[gid]; AUDIO.play('star');
          for (let k = 0; k < 8; k++) HOME.fx.spawn('puff', tx + rnd(-16, 16), ty + rnd(-14, 18), { c: '#ffffff', r0: 2, r1: 7, life: 0.6, alpha: 0.85 });
          for (let k = 0; k < 6; k++) HOME.fx.spawn('heart', tx + rnd(-20, 20), ty - rnd(0, 16), { vy: -22, life: 1.1, wob: 4 });
          if (r === 'cloth') UI.toast('Подарок от друзей: ' + C.name + '!', UI.clothThumb(gid), 'gold'); else UI.toast('Подарок от друзей: 30 монет!', UI.I('coin'), 'gold');
          HOME.face('happy', 'laugh', 1.6); scene && scene.q.unshift(['a', pick(r === 'cloth' ? GP.thanks : GP.coins), 'happy']); });
        return T + 0.5; },
      () => bite(ord[0]), () => bite(ord[1]), () => bite(ord[2]), () => bite(ord[3]), () => bite(null), ['a', pick(DATA.LINES.pYum), 'happy'], () => { party.cake = null; return 0.3; },
      phase('photo'), ['a', pick(GP.photo), 'happy'], () => { for (const f of here()) { f.pose = 'happy'; f.poseUntil = t + 4.5; } return 0.2; }, () => count(3), () => count(2), () => count(1),
      () => { count(0); const top = Math.min(120, Math.min(HOME.headTop(), ...here().map((f) => f.headY)) - 14); HOME.photo({ title: 'Праздник: ' + A.name, cap: S().name + ' и друзья', top, k: 'grow:' + st });
        const ms = S().moments || (S().moments = {}); ms['grow:' + st] = 1; return 1.3; }, ['w', 0.3]];
  }
  // Round 22: Дашулик's birthday (DATA.DASHA, dasha.js) — «Сюрприз!», the cake with her candles: she blows them out (the microphone or a
  // finger; the scene waits as long as it takes), cheers, the presents (coins + cakes in the fridge), cake for all, the photo, the hint
  function dashaScript(b) {
    const DP = DATA.DASHA.party, LN = DATA.LINES, ord = shuffle(IDS), giver = pick(IDS);
    const L = [waitFor(arrived, 10), fl(ord[0], DP.surprise[ord[0]]), fl(ord[1], DP.surprise[ord[1]]), ['a', pick(LN.dWow), 'happy'], phase('cake'),
      () => { party.cake = { x: 90, y: 306, dasha: 1 }; for (const f of here()) { f.look = [Math.sign(90 - f.x) || 1, 1]; f.lookUntil = t + 6; } return DASHA.cakeIn(b); },
      ['a', pick(LN.dWish), 'happy'], () => { DASHA.blowStart(); return 0.3; }, waitFor(() => !DASHA.cakeLit(), 1e7),
      () => { for (const f of here()) { f.pose = 'happy'; f.poseUntil = t + 1.8; hop(f, 95); } return 1.3; },
      fl(ord[2], DP.cheer[ord[2]]), ['a', pick(LN.dYay), 'happy'],
      phase('dance'),
      () => {
        party.lt = 1; party.danceEnd = t + 3.8; party.beat = -1; party.t0 = t;
        AUDIO.play('disco'); AUDIO.duck(true); HOME.act('dance', { noMoment: true });
        for (let k = 0; k < 10; k++) {
          HOME.fx.spawn('spark', rnd(20, 160), rnd(160, 260), { vy: -rnd(20, 45), life: 1.2 });
          HOME.fx.spawn('star', rnd(25, 155), rnd(170, 240), { vy: -rnd(15, 30), life: 1.5 });
        }
        return 0.3;
      },
      fl(ord[0], 'Праздничный танец!', 'happy'),
      () => Math.max(0.1, (party ? party.danceEnd : 0) - t),
      () => {
        if (party) party.lt = 0; AUDIO.stop('disco'); AUDIO.duck(false); AUDIO.play('cheer');
        for (const f of here()) { f.pose = 'happy'; f.poseUntil = t + 1.5; hop(f, 90); }
        HOME.face('happy', 'laugh', 1.5); HOME.hop(90);
        return 1.0;
      },
      phase('gift'), fl(giver, DP.gift[giver]),
      () => bite(ord[0]), () => bite(ord[1]), () => bite(ord[2]), () => bite(ord[3]), () => bite(null),
      () => DASHA.gifts(F[giver]), ['a', pick(LN.dGifts), 'happy'], ['a', pick(LN.pYum), 'happy'],
      phase('photo'), ['a', pick(LN.dPhoto), 'happy'], () => { for (const f of here()) { f.pose = 'happy'; f.poseUntil = t + 4.5; } return 0.2; }, () => count(3), () => count(2), () => count(1),
      () => { count(0); const top = Math.min(120, Math.min(HOME.headTop(), ...here().map((f) => f.headY)) - 14); DASHA.photo(top); return 1.3; }, ['w', 0.3]];
    if (DASHA.heartsOn()) L.push(() => DASHA.secretsHint());
    L.push(() => { party.cake = null; DASHA.cakeOut(); return 0.4; }, phase('bye'), ['a', pick(LN.dBye), 'happy'], fl(ord[3], DP.bye[ord[3]]),
      () => { HOME.act('wave'); for (const f of here()) { f.pose = 'happy'; f.poseUntil = t + 1.2; } return 0.6; });
    return L;
  }
  function partyReward() {
    GAME.partyReward(); const ht = HOME.headTop() - (HOME.camY || 0); UI.float(HOME.mk.x + 30, ht, '+20', UI.I('fun')); later(0.35, () => { UI.float(HOME.mk.x - 30, ht, '+10', UI.I('coin')); AUDIO.play('coin'); });
    for (const f of here()) for (let k = 0; k < 4; k++) HOME.fx.spawn('heart', f.x + rnd(-8, 8), f.headY + rnd(0, 10), { vy: -rnd(16, 28), life: 1.2, wob: 5, fadeIn: k * 0.12 });
  }
  // everybody goes home their own way (through the hall doors / towards the side of their room); a friend who lives here just stays
  function finishParty() {
    if (!party) return; const r = party.room; party = null; AUDIO.stop('disco'); AUDIO.duck(false); let k = 0;
    for (const id of IDS) {
      const f = F[id]; if (f.mode !== 'party') continue;
      if (HOMES[id].room === r) { const h = HOMES[id]; f.mode = 'home'; if (Math.hypot(h.x - f.x, h.y - f.y) > 2) walkTo(f, h.x, h.y, 55, 0, () => goHome(f)); continue; }
      f.mode = 'leave'; later(0.15 + 0.55 * k++, () => goAway(f));
    }
    S().friends.visitAt = Date.now();
  }
  function endParty() { if (!party) return; const was = party.kind; party = null; if (was === 'dasha') DASHA.abort(); if (scene && scene.id === 'party') cancelScene(); AUDIO.stop('disco'); AUDIO.duck(false); for (const id of IDS) if (F[id].mode === 'party' || F[id].mode === 'leave') goHome(F[id]); }
  // once a day they come over by themselves. Round 15: any time from 10:00 to 21:59 (was only 17–22, so many never saw it), a few
  // minutes into the visit home (partyAfter: 1.5–4 min of this session), never at night, never twice a day
  let partyAfter = rnd(90, 240);
  function tryParty() {
    const s = S(), hr = new Date().getHours();
    if (hr < 10 || hr >= 22 || t < partyAfter || s.friends.partyDay === GAME.dayStr(new Date()) || partyLeft() > 0 || !canVisit()) return false;
    return startParty({ auto: true });
  }
  // ---- the activities ----
  function count(n) { const ht = HOME.headTop() - (HOME.camY || 0); UI.float(HOME.mk.x, ht - 26, n ? String(n) : 'Банан!', n ? null : UI.I('camera')); AUDIO.play(n ? 'beep' : 'beepGo'); return 0.8; }
  function bite(id) {
    const ck = party && party.cake; if (!ck) return 0.1;
    const f = id && F[id];
    if (f) {
      const orig = anchor(f), origX = orig[0], origY = orig[1], dir = Math.sign(ck.x - f.x) || 1;
      const stepX = origX + dir * Math.min(24, Math.abs(ck.x - origX) - 10);
      const stepY = FLY[f.id] ? Math.min(origY + 14, 236) : origY;
      f.look = [dir, 0]; f.lookUntil = t + 2.5;
      moveTo(f, stepX, stepY, FLY[f.id] ? 58 : 46, 0, () => {
        party.bites++; AUDIO.play('pop'); f.plate = true;
        f.pose = 'eat'; f.poseUntil = t + 0.9;
        moveTo(f, origX, origY, FLY[f.id] ? 50 : 38, 0, () => {
          AUDIO.play('chomp'); later(0.25, () => AUDIO.play('chomp'));
          HOME.fx.spawn('heart', f.x, f.headY - 8, { vy: -16, life: 1 });
          for (let i = 0; i < 6; i++) HOME.fx.spawn('crumb', f.x + rnd(-4, 4), f.headY + 12, { c: i % 2 ? '#fff0f4' : '#f2c27a', vx: rnd(-25, 25), vy: rnd(-35, -15), g: 260, life: 0.6 });
          f.pose = 'happy'; f.poseUntil = t + 1.4; hop(f, 75);
          later(0.7, () => { f.plate = false; });
        });
      });
      return 1.4;
    }
    party.bites++; AUDIO.play('pop');
    HOME.face('happy', 'smile', 1.4);
    later(0.15, () => {
      AUDIO.play('chomp'); later(0.25, () => AUDIO.play('chomp'));
      HOME.fx.spawn('heart', HOME.mk.x, HOME.headTop() + 12, { vy: -18, life: 1 });
      for (let i = 0; i < 6; i++) HOME.fx.spawn('crumb', HOME.mk.x + rnd(-4, 4), HOME.headTop() + 30, { c: i % 2 ? '#fff0f4' : '#f2c27a', vx: rnd(-25, 25), vy: rnd(-35, -15), g: 260, life: 0.6 });
      HOME.hop(65); GAME.stat('food', 6);
    });
    return 1.2;
  }
  function laugh(teller) {
    AUDIO.play('giggle'); HOME.face('happy', 'laugh', 1.8); HOME.hop(70); let k = 0;
    for (const f of here()) { if (f.id === teller) continue; f.pose = 'happy'; f.poseUntil = t + 1.6; later(0.15 * k++, () => { hop(f, 100); AUDIO.play(SND[f.id]); }); }
    for (let i = 0; i < 5; i++) HOME.fx.spawn('note', HOME.mk.x + rnd(-30, 30), HOME.headTop() + rnd(-6, 20), { vy: -18, life: 1.1, wob: 4, c: i % 3 });
    return 0.9;
  }
  const PACT = {
    disco: () => { const [a, b] = shuffle(IDS); return [() => { party.lt = 1; party.discoEnd = t + 8.2; party.beat = -1; party.t0 = t; AUDIO.play('disco'); AUDIO.duck(true); HOME.act('dance', { noMoment: true }); return 0.3; },
      ['w', 2], fl(a, PT.disco[a]), ['w', 0.5], fl(b, PT.disco[b]), () => Math.max(0.1, party.discoEnd - t), () => { party.lt = 0; AUDIO.duck(false); AUDIO.play('cheer'); return 0.9; }]; },
    cake: () => { const order = shuffle(IDS); return [() => { party.cake = { x: 90, y: 306, lit: 1 }; AUDIO.play('pop'); for (let k = 0; k < 10; k++) HOME.fx.spawn('spark', 90 + rnd(-18, 18), 296 + rnd(-14, 6), { vy: -20, life: 0.7 }); return 0.9; },
      ['a', pick(DATA.LINES.pWish), 'happy'], () => { party.cake.lit = 0; AUDIO.play('blow'); for (let k = 0; k < 6; k++) HOME.fx.spawn('cloth', 82 + (k % 3) * 8, 280, { c: '#d8d8e0', vy: -14, vx: rnd(-4, 4), life: 1, sz: 2 }); later(0.5, () => AUDIO.play('cheer')); return 1.2; },
      ...order.flatMap((id) => [() => bite(id), fl(id, PT.cake[id])]), () => bite(null), ['a', pick(DATA.LINES.pYum), 'happy'], () => { party.cake = null; return 0.3; }]; },
    photo: () => { const a = pick(IDS); return [fl(a, PT.photo[a]), () => { for (const f of here()) { f.pose = 'happy'; f.poseUntil = t + 4.5; } return 0.2; }, () => count(3), () => count(2), () => count(1),
      () => { count(0); const top = Math.min(HOME.headTop(), ...here().map((f) => f.headY)) - 14; HOME.photo({ title: 'Все вместе!', cap: S().name + ' и друзья', top, k: 'party' }); const ms = S().moments || (S().moments = {}); ms.party = 1; return 1.3; }, ['w', 0.3]]; },
    jokes: () => { const [a, b] = shuffle(IDS.filter((id) => PT.jokes[id])), ja = joke(a), jb = joke(b), [l1, l2] = shuffle(DATA.LINES.pLaugh);
      return [fl(a, ja[0], 'idle'), fl(a, ja[1], 'happy'), () => laugh(a), ['a', l1, 'happy'], fl(b, jb[0], 'idle'), fl(b, jb[1], 'happy'), () => laugh(b), ['a', l2, 'happy']]; },
  };
  // a bag per friend (S.friends[id].jk = told this round): no joke twice until all are told, never the same one twice in a row
  function joke(id) {
    const L = PT.jokes[id] || [], fs = S().friends[id]; if (!fs || L.length < 2) return L[0] || ['', ''];
    let told = Array.isArray(fs.jk) ? fs.jk.filter((i) => i < L.length) : []; const last = told[told.length - 1]; if (told.length >= L.length) told = [];
    const left = L.map((_, i) => i).filter((i) => !told.includes(i) && i !== last), i = left.length ? pick(left) : 0; told.push(i); fs.jk = told; return L[i];
  }
  function partyTick(dt) {
    const p = party; p.lights += (p.lt - p.lights) * Math.min(1, dt * 4); if (!p.lt && p.lights < 0.01) p.lights = 0; p.ball += ((p.lt ? 1 : 0) - p.ball) * Math.min(1, dt * 3);
    if (!p.lt) return;
    const b = Math.floor((t - p.t0) / 0.5);
    if (b !== p.beat) { p.beat = b; let k = 0; for (const f of here()) { if (!FLY[f.id] && (b + k++) % 2 === 0) hop(f, 75); f.look = [b % 2 ? 1 : -1, 0]; f.lookUntil = t + 0.5; f.pose = 'happy'; f.poseUntil = t + 0.45; }
      HOME.fx.spawn('note', rnd(20, 160), rnd(150, 230), { vy: -16, life: 1.2, wob: 4, c: b % 3 }); }
    if (!HOME.mk.act && !S().sleeping) HOME.act('dance', { noMoment: true });
  }
  // disco: the room dims, a mirror ball comes down, colour spots sweep the walls; the party cake (with candles until blown out)
  const SPOTC = ['#ff4fa0', '#4fd0ff', '#ffe04f', '#8aff6a'];
  function drawParty(c, P) {
    const p = party; if (!p) return;
    if (p.cake && !p.cake.dasha) drawCake(P, p.cake); // Round 22: her cake is drawn by dasha.js
    if (p.lights > 0.01) {
      const L = p.lights; c.save(); c.globalAlpha = 0.36 * L; c.fillStyle = '#1a0a30'; c.fillRect(0, 0, 180, 320); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) { c.globalAlpha = 0.26 * L; P.ell(90 + Math.sin(t * 1.3 + i * 1.7) * 72, 170 + Math.cos(t * 0.9 + i * 2.3) * 80, 24, 16, SPOTC[i]); }
      c.restore();
    }
    if (p.ball > 0.02) {
      // the mirror ball hangs left of the middle (the zal chandelier and the kitchen's own disco ball are in the middle)
      const bx = 58, by = Math.round(-12 + 56 * p.ball); P.vl(bx, 0, Math.max(0, by - 6), '#6b6b78'); P.circ(bx, by, 7, '#3b2433'); P.circ(bx, by, 6, '#b8c4d4');
      const ph = Math.floor(t * 6); for (let y = -5; y <= 5; y += 3) for (let x = -5; x <= 5; x += 3) if (x * x + y * y < 30) P.p(bx + x + (ph % 3) - 1, by + y, (x + y + ph) % 2 ? '#ffffff' : '#7a8698');
      for (let i = 0; i < 16; i++) { const a = t * 1.1 + i * 0.393, r = 26 + (i % 4) * 26; if (Math.sin(t * 7 + i * 2.3) > 0) P.r(bx + 32 + Math.cos(a) * r * 1.5, by + 70 + Math.sin(a) * r * 1.2, 2, 2, SPOTC[i % 4]); }
    }
  }
  // Round 17: the growth cake — two tiers, sprinkles and a big number candle (the stage); after the first bite it is the usual cake
  const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111'];
  function drawGrowCake(P, k) {
    const x = Math.round(k.x), y = Math.round(k.y), INK = '#3b2433';
    P.shadow(x, y + 1, 22, 3, 0.22); P.ell(x, y, 21, 4, INK); P.ell(x, y - 0.5, 20, 3.2, '#f4f4f0');
    const b0 = x - 18, bw = 36, bh = 11, bt = y - bh - 1; P.r(b0 - 1, bt - 1, bw + 2, bh + 2, INK); P.r(b0, bt, bw, bh, '#f7d7e4'); P.r(b0, bt + bh - 3, bw, 2, '#e8a8c0'); P.r(b0, bt, bw, 3, '#ffffff');
    for (let i = 1; i < bw - 1; i += 3) P.r(b0 + i, bt + 3, 2, 1 + (i % 2), '#ffffff');
    const t0 = x - 11, tw = 22, th = 8, tt = bt - th; P.r(t0 - 1, tt - 1, tw + 2, th + 1, INK); P.r(t0, tt, tw, th, '#a6cdf2'); P.r(t0, tt, tw, 2, '#ffffff'); P.r(t0, tt + th - 2, tw, 1, '#7aa8d8');
    for (let i = 0; i < 9; i++) P.p(b0 + 3 + ((i * 7) % (bw - 5)), bt + 5 + ((i * 3) % 4), ['#ffd23a', '#7ad0ff', '#ff6a8a', '#7ae07a'][i % 4]);
    for (let i = 0; i < 5; i++) P.p(t0 + 2 + i * 4, tt + 4 + (i % 2), ['#ff6a8a', '#ffd23a', '#7ae07a'][i % 3]);
    const g = DIG[Math.max(0, Math.min(9, k.num | 0))], cx = x - 3, cy = tt - 11; // the number candle, 2× pixels
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r * 3 + c] === '1') { P.r(cx + c * 2 - 1, cy + r * 2 - 1, 4, 4, INK); }
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r * 3 + c] === '1') { P.r(cx + c * 2, cy + r * 2, 2, 2, (r + c) % 2 ? '#ffd23a' : '#ffe98a'); }
    P.vl(x, cy - 3, 2, '#3b2433');
    if (k.lit) { const q = Math.floor(t * 10) % 2; P.r(x - 1, cy - 7 - q, 3, 4 + q, '#ffd23a'); P.p(x + q - 1, cy - 8 - q, '#ff8a2a'); P.p(x, cy - 5, '#ffffff'); }
  }
  function drawCake(P, k) {
    if (k.grow && !(party.bites || 0)) { drawGrowCake(P, k); return; }
    const x = Math.round(k.x), y = Math.round(k.y), n = Math.max(0, 4 - (party.bites || 0)), INK = '#3b2433';
    P.shadow(x, y + 1, 20, 3, 0.2); P.ell(x, y, 19, 4, INK); P.ell(x, y - 0.5, 18, 3.2, '#f4f4f0');
    if (!n) { for (let i = 0; i < 5; i++) P.p(x - 8 + i * 4, y - 1, i % 2 ? '#f2c27a' : '#ff8ab4'); return; }
    const w = [0, 9, 17, 25, 32][n], x0 = x - 16, h = 14, top = y - h - 1;
    P.r(x0 - 1, top - 1, w + 2, h + 2, INK); P.r(x0, top, w, h, '#f2c27a'); P.r(x0, y - 4, w, 2, '#d89a50');
    P.r(x0, top + 6, w, 2, '#ff8ab4'); P.r(x0, top + 10, w, 1, '#d0305a'); P.r(x0, top, w, 4, '#fff4f8');
    for (let i = 1; i < w - 1; i += 4) P.r(x0 + i, top + 4, 2, 1 + (i % 3), '#fff4f8');
    if (n < 4) P.vl(x0 + w - 1, top + 4, h - 5, '#e0a860');
    for (let i = 0; i < n; i++) { const cx = x0 + 3 + i * 8; if (cx + 3 > x0 + w) break; P.r(cx, top - 3, 3, 3, '#d81e3a'); P.p(cx, top - 3, '#ff8a9a'); }
    for (let i = 0; i < 3; i++) { const cx = x0 + 7 + i * 9; if (cx + 2 > x0 + w) break; P.r(cx, top - 9, 2, 7, '#7ad0ff'); P.p(cx, top - 7, '#ffffff'); P.p(cx + 1, top - 4, '#ffffff');
      if (k.lit) { const q = Math.floor(t * 10 + i) % 2; P.r(cx, top - 12 - q, 2, 3 + q, '#ffd23a'); P.p(cx + q, top - 13 - q, '#ff8a2a'); } }
  }

  // ---------- per-frame ----------
  function tickFriend(f, dt) {
    if (f.ride) { const q = ridePos(); f.x = q[0]; f.y = q[1]; f.room = HOME.room; f.jy = 0; f.vy = 0; } // Round 15b #3: Жучок on Абибян's shoulder
    if (f.nap && f.room === HOME.room && (f.zT = (f.zT || 0) - dt) <= 0) { f.zT = 1.1; HOME.fx.spawn('z', f.x + 8, f.headY - 2, { vy: -12, vx: 6, life: 1.3 }); }
    if (HOOK[f.id]) { const h = hanging(f); if (h && f.hung === false && HOME.room === f.room) AUDIO.play('keys'); f.hung = h; } // Round 12 #2: a little clink when he clips back on
    if (f.path) { const p = f.path; p.t += dt; const k = Math.min(1, p.t / p.dur); f.x = p.x0 + (p.x1 - p.x0) * k; f.y = p.y0 + (p.y1 - p.y0) * k - p.arc * 4 * k * (1 - k); f.bob = (!FLY[f.id] && !p.arc && Math.floor(p.t * 8) % 2) ? -1 : 0; if (k >= 1) { f.path = null; f.bob = 0; if (p.then) p.then(); } }
    if (f.jy < 0 || f.vy) { f.vy += 700 * dt; f.jy += f.vy * dt; if (f.jy >= 0) { f.jy = 0; f.vy = 0; } }
    f.blinkT -= dt; if (f.blinkT < -0.13) f.blinkT = rnd(2.5, 5.5);
    if (!scene || scene.id !== f.id) { f.idleT -= dt; if (f.idleT <= 0 && !f.path && t > f.poseUntil) { f.idleT = rnd(6, 12); const P = { pusya: ['wash', 'happy', 'idle'], monty: ['think', 'happy', 'idle'], mosq: ['happy', 'idle'], zhuk: ['happy', 'idle', 'idle'] }[f.id] || ['idle']; f.pose = pick(P); f.poseUntil = t + rnd(1.4, 2.4); if (f.id !== 'monty' && Math.random() < 0.5) { f.look = [pick([-1, 0, 1]), pick([-1, 0, 0])]; f.lookUntil = t + 2; } } }
    if (f.mode === 'home' && !f.path && (!scene || scene.id !== f.id) && !party && !f.onFur && !f.ride && f.room === HOMES[f.id].room) {
      const hx = HOMES[f.id].x, hy = HOMES[f.id].y;
      if (Math.hypot(f.x - hx, f.y - hy) > 8) {
        walkTo(f, hx, hy, FLY[f.id] ? 70 : 60, FLY[f.id] ? 0 : (Math.abs(hy - f.y) > 20 ? 18 : 0));
      }
    }
  }
  function tickPillow(p, dt) {
    if (p.anim) { p.anim.t += dt; if (p.anim.t >= p.anim.seq.length * 0.06) p.anim = null; }
    if (p.jig > 0) p.jig -= dt;
    if (p.held) { p.holdT += dt; p.heartT -= dt; if (p.heartT <= 0) { p.heartT = 0.3; HOME.fx.spawn('heart', p.x + rnd(-8, 8), p.top + rnd(4, 16), { vy: -22, vx: rnd(-6, 6), life: 1, wob: 5 }); } }
  }
  // ---------- friendship: level-up window, gifts, moods ----------
  let lvQ = [], lvAt = 0, moodT = 0, heartT = 0; const MOOD = {};
  function hearts(lv) { return `<div class="fhearts">${[0, 1, 2, 3, 4].map((i) => `<img class="${i <= lv ? 'on' : 'off'}" src="${UI.I('heart')}" alt="">`).join('')}</div>`; }
  function levelUp(a) { if (!a || !FD[a.id]) return; lvQ.push(a); lvAt = t + 1.2; }
  function showLv() {
    const a = lvQ.shift(), Fd = FD[a.id], FS = DATA.FSHIP, she = !!Fd.she, name = FS[she ? 'f' : 'm'][a.lv], f = F[a.id];
    AUDIO.play('level'); HOME.face('happy', 'smile', 2.5, { blush: 1 });
    if (f && f.room === HOME.room) { f.pose = 'happy'; f.poseUntil = t + 2; hop(f, 110); for (let k = 0; k < 10; k++) HOME.fx.spawn('heart', f.x + rnd(-16, 16), f.headY + rnd(-4, 20), { vy: -rnd(18, 34), vx: rnd(-10, 10), life: 1.4, wob: 6, fadeIn: k * 0.08 }); }
    const w = UI.modal(`<h2>Дружба крепнет!</h2><img class="fport" src="${FART.portrait(a.id)}" alt="">${hearts(a.lv)}<p>Теперь ${Fd.short || Fd.name} — ${she ? 'твоя' : 'твой'} <b>${name.toLowerCase()}</b>!</p>
      <p class="big">${UI.im(UI.I('coin'))}+${FS.coins[a.lv]}</p><p class="fsc">Бонус: ${FS.perk[a.lv]}</p><button class="btn g" data-close>Ура!</button>`, { dismiss: true });
    w.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) later(0.3, () => monkeySay(pick(DATA.LINES.fLv), 'happy')); });
    return w;
  }
  function gift(id) {
    const g = GAME.friendGift(id); if (!g) return null; const f = F[id], Fd = FD[id], here = f && f.room === HOME.room;
    if (here) { fsay(id, Fd.eat.gift); f.pose = 'happy'; f.poseUntil = t + 1.6; hop(f, 80); HOME.fx.spawn('img', f.x, f.headY - 8, { img: ART.food(g), vy: -14, life: 1.4 }); later(1.8, () => monkeySay(pick(DATA.LINES.fGift), 'happy')); }
    AUDIO.play('coin'); UI.toast(`${Fd.short || Fd.name} ${Fd.she ? 'принесла' : 'принёс'} гостинец: ${DATA.FOODS[g].name}`, UI.F(g), 'gold'); return g;
  }
  // a sulky friend has a little rain cloud over the head
  const CLOUD = ['...oooo.....', '..ommmmo.oo.', '.omllllmommo', 'omllllllmmmo', 'ommmmmmmmmmo', '.oooooooooo.'], CLC = { o: '#3a3440', m: '#8d8798', l: '#b3adbd' };
  function drawMood(P, f) {
    if (MOOD[f.id] !== 'sulky' || t < f.talkUntil) return; const x = Math.round(f.x - 6), y = Math.round(f.headY - 14 + Math.sin(t * 2) * 1);
    P.map(x, y, CLOUD, CLC); for (let k = 0; k < 3; k++) { const ph = (t * 1.6 + k * 0.37) % 1; P.r(x + 3 + k * 3, y + 6 + Math.floor(ph * 7), 1, 2, '#6ab0ff'); }
  }
  function update(dt) {
    t += dt; const s = S(), room = HOME.room;
    if ((moodT -= dt) <= 0) { moodT = 1; for (const id of IDS) MOOD[id] = GAME.friendship(id).mood; }
    if ((heartT -= dt) <= 0) { heartT = rnd(3, 5); for (const id of IDS) { const f = F[id]; if (MOOD[id] === 'happy' && f.room === room && !s.sleeping) HOME.fx.spawn('heart', f.x + rnd(-6, 6), f.headY - 2, { vy: -16, life: 1.1, wob: 4 }); } }
    if (lvQ.length && t >= lvAt && !scene && !UI.hasModal() && !UI.sheetOpen && APP.scene === 'home') showLv();
    for (let i = timers.length - 1; i >= 0; i--) if (t >= timers[i].at) { const fn = timers[i].fn; timers.splice(i, 1); try { fn(); } catch (e) { console.error(e); } }
    if (lastRoom !== room) { if (lastRoom !== null) onRoom(room, lastRoom); lastRoom = room; }
    for (const id of IDS) tickFriend(F[id], dt);
    for (const k in PIL) tickPillow(PIL[k], dt);
    sceneTick(dt);
    if (party) { if (s.sleeping || APP.scene !== 'home') endParty(); else partyTick(dt); }
    if (scene && F[scene.id] && F[scene.id].room !== room) cancelScene();
    const v = visitorId();
    if (v) { const f = F[v]; if (f.mode === 'visit' && (s.sleeping || (t > f.until && !scene && !UI.hasModal() && !f.path))) leave(f, s.sleeping); }
    guestTick();
    checkT -= dt; if (checkT <= 0) { checkT = 5; if (!tryVisit(true) && !tryParty() && !tryVisit(false)) tryGuest(); } // Round 15: a friend he needs first, then «Все вместе», then drop-ins, then the friends among themselves
    if (bub) { const p = speakerPos(bub.who); if (!p) { UI.fhideBubble(); bub = null; } else if (!UI.fbubbleTick(p.x, p.y)) bub = null; }
  }

  // ---------- render ----------
  function opts(f) {
    const talking = t < f.talkUntil, posed = f.pose && t < f.poseUntil;
    let pose = posed ? f.pose : 'idle', fr = Math.floor(t * 2) % 2;
    if (talking && pose !== 'knead' && pose !== 'bite') { pose = 'talk'; fr = Math.floor(t * 8) % 2; }
    if (pose === 'knead') fr = Math.floor(t * 5) % 2;
    if (f.path && !FLY[f.id]) fr = Math.floor(f.path.t * 8) % 2;
    if (FLY[f.id]) fr = Math.floor(t * 14) % 2;
    if (f.id === 'zhuk' && f.path && pose === 'idle') pose = 'walk';
    const o = { pose, f: fr, fat: (S().friends[f.id] || {}).fat || 0 };
    if (pose === 'knead') { o.look = [Math.sign(HOME.mk.x - f.x) || (f.x <= HOME.mk.x ? 1 : -1), 0]; }
    else if (f.id !== 'monty') { o.look = (f.look && t < f.lookUntil) ? f.look : (Math.abs(HOME.mk.x - f.x) > 24 ? [Math.sign(HOME.mk.x - f.x), 0] : null); }
    if (f.id === 'pusya' && (pose === 'idle' || pose === 'talk') && f.blinkT < 0) o.eyes = 'closed';
    if (f.nap && !talking) { o.pose = 'idle'; o.eyes = 'closed'; o.look = null; } // Round 15b #3: Пуся napping on her sofa
    if (f.id === 'monty' && pose === 'talk' && fr) o.arm = 'wave';
    return o;
  }
  function drawFriend(c, P, f) {
    const e = FART.sprite(f.id, opts(f)); let y = f.y + f.jy + f.bob;
    if (hanging(f)) { const hk = HOOK[f.id], sw = Math.round(Math.sin(t * 1.3 + 0.6) * 0.9), x0 = Math.round(f.x - e.ox + sw), y0 = Math.round(y - e.oy); chainTo(P, hk.x, hk.y, x0 + e.head[0], y0 + e.head[1]); c.drawImage(e.cv, x0, y0); drawn.push({ kind: 'friend', id: f.id, e, x0, y0 }); f.headY = y0 + e.head[1]; return; }
    if (FLY[f.id]) { y += Math.round(Math.sin(t * 3 + 1) * 2 + (party && party.lights > 0.3 ? Math.sin(t * 12.6) * 3 : 0)); P.shadow(f.x, f.gy + 1, 7, 2, 0.12); }
    else { const ks = Math.max(0.5, 1 + f.jy / 60); P.shadow(f.x, f.y + 1, e.w * 0.36 * ks, 3 * ks, 0.2); }
    const x0 = Math.round(f.x - e.ox), y0 = Math.round(y - e.oy); c.drawImage(e.cv, x0, y0); drawn.push({ kind: 'friend', id: f.id, e, x0, y0 }); f.headY = y0 + e.head[1];
    if (f.plate) {
      const plOff = { monty: 20, pusya: 16, zhuk: 10, mosq: 14 };
      const dy = plOff[f.id] || 16;
      const px = Math.round(f.x), py = Math.round(y - dy);
      P.ell(px, py + 1, 7, 2.5, '#3b2433'); P.ell(px, py, 6, 2, '#ffffff');
      const ckImg = ART.food('cake'); if (ckImg) c.drawImage(ckImg, px - 6, py - 10, 12, 10);
    }
  }
  // a little gold ball chain: bright and dark links in turn from the hook down to his head loop
  function chainTo(P, x0, y0, x1, y1) { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0))); for (let i = 0; i <= n; i++) { const k = i / n; P.p(Math.round(x0 + (x1 - x0) * k), Math.round(y0 + (y1 - y0) * k), i % 2 ? '#a88420' : '#f0cc58'); } }
  function pillowOpts(p, asleep) {
    if (asleep) return p.id === 'carrot' ? { lie: 1, mood: 'sleep', k: PK } : { mood: 'sleep', k: PK };
    const lie = 1;
    let sq = p.held ? 2 : 0; if (p.anim) sq = p.anim.seq[Math.min(p.anim.seq.length - 1, Math.floor(p.anim.t / 0.06))];
    const mood = t < p.moodUntil ? p.mood : 'idle'; return { sq, mood, f: mood === 'shy' ? Math.floor(t * 6) % 2 : 0, k: PK, lie };
  }
  function drawPillow(c, P, p, asleep) {
    const e = FART.sprite(p.id, pillowOpts(p, asleep)), [x, y] = asleep ? NIGHT[p.id] : [p.x, p.y]; const jx = p.jig > 0 ? (Math.floor(p.jig * 30) % 2 ? 1 : -1) : 0;
    if (!asleep && p.sh) P.shadow(x + 10, y - p.sh, e.w * 0.36, 2, 0.14); // contact shadow on the blanket under the bottom pillow
    const x0 = Math.round(x - e.ox + jx), y0 = Math.round(y - e.oy); c.drawImage(e.cv, x0, y0); drawn.push({ kind: 'pillow', id: p.id, e, x0, y0 }); p.top = y0; p.dx = x;
  }
  function kit() { return kitC || (kitC = MONKEY.sprite(20, 18, (a) => { a.rbox(1, 1, 19, 17, 2, MONKEY.K.IT, a.mat('kitW', '#f4f4f0')); a.box(1, 1, 19, 4, MONKEY.K.IT, a.mat('kitT', '#e8453c')); }, (d) => { for (let y = 7; y <= 14; y++) { d.px(9, y, '#e8453c'); d.px(10, y, '#e8453c'); } for (let x = 6; x <= 13; x++) { d.px(x, 10, '#e8453c'); d.px(x, 11, '#e8453c'); } d.px(16, 10, '#b8b8b0'); d.px(16, 11, '#b8b8b0'); })); }
  function render(c, P, layer) {
    const room = HOME.room, asleep = S().sleeping && room === 'zal';
    const mky = (typeof HOME !== 'undefined' && HOME.mk) ? HOME.mk.y : 252;
    if (layer === 'back') {
      drawn = [];
      const kp = room === 'bath' && (ROOMS.spots('bath') || {}).kit; if (kp) ROOMS.wallAt(c, kit(), kp[0], kp[1], 2);
      if (room === 'zal') { if (asleep) drawPillow(c, P, PIL.pepper, true); else { drawPillow(c, P, PIL.carrot, false); drawPillow(c, P, PIL.pepper, false); } }
      const list = IDS.map((id) => F[id]).filter((f) => f.room === room && !f.onFur && f.y <= mky).sort((a, b) => a.y - b.y);
      const zk = F.zhuk, hk = HOOK.zhuk; if (zk && hk && room === hk.room && !hanging(zk)) { const sw = Math.round(Math.sin(t * 2.2) * 1.2); chainTo(P, hk.x, hk.y, hk.x + sw, hk.y + 7); } // Round 12 #2: unhooked — a short loose bit of chain swings on the hook
      for (const f of list) { drawFriend(c, P, f); drawMood(P, f); }
    } else if (layer === 'fur') {
      const front = IDS.map((id) => F[id]).filter((f) => f.room === room && (f.onFur || f.y > mky)).sort((a, b) => a.y - b.y);
      for (const f of front) {
        if (typeof DUCKS !== 'undefined' && DUCKS.render) DUCKS.render(c, P, (d) => d.y <= f.y);
        drawFriend(c, P, f); drawMood(P, f);
      }
    } else if (layer === 'hug' && asleep) { drawPillow(c, P, PIL.carrot, true); hugPaws(P); }
    else if (layer === 'top') drawParty(c, P);
  }
  // two sleepy paws wrapped over the carrot, so the hug reads at a glance
  function hugPaws(P) {
    const cx = HOME.mk.x, br = Math.sin(t * 1.6) > 0.6 ? 1 : 0;
    // rounded fluffy paw (10×7) with toe creases, curled over the top of the carrot
    const PAW = ['..oooooo..', '.ollhhllo.', 'olhhllllmo', 'ollllllmmo', 'olmllmllmo', '.ommdmmdo.', '..oooooo..'], PC = { o: '#2a2228', l: '#a49a9b', h: '#c2b8b6', m: '#867d80', d: '#5e5559' };
    for (const [px, py] of [[cx - 16, 191 + br], [cx + 3, 193 + br]]) P.map(px, py, PAW, PC);
  }

  // ---------- input ----------
  // Round 14b: the opaque boxes of the friends drawn this frame (scene coords) — the want bubble keeps clear of them
  const bbC = new WeakMap();
  function obb(cv) { let b = bbC.get(cv); if (b) return b; const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    b = x1 < 0 ? null : [x0, y0, x1 + 1, y1 + 1]; bbC.set(cv, b); return b; }
  function boxes() { const out = []; for (const d of drawn) { const b = d.e && d.e.cv && obb(d.e.cv); if (b) out.push([d.x0 + b[0], d.y0 + b[1], d.x0 + b[2], d.y0 + b[3], d.id]); } return out; }
  function at(x, y) { for (let i = drawn.length - 1; i >= 0; i--) { const d = drawn[i]; if (FART.hit(d.e, x - d.x0, y - d.y0, d.kind === 'friend' ? 3 : 1)) return { kind: d.kind, id: d.id }; } return null; }
  function tap(h) {
    if (!h) return; if (h.kind === 'pillow') return tapPillow(h.id);
    const f = F[h.id]; if (!f || f.mode === 'leave') return;
    AUDIO.play(SND[h.id]); f.pose = 'happy'; f.poseUntil = t + 0.9; hop(f, 90); HOME.lookAt(f.x, f.headY, 2);
    if (guest && !party && !S().sleeping && guest.ph === 'there' && guest.room === HOME.room && (h.id === guest.id || h.id === guest.host) && joinChat(h.id)) return; // Round 15
    if (h.id === 'zhuk' && t < offerUntil && !scene && startHeist('offer')) return; // Round 15b #3: a tap on his whispered offer = «yes»
    if (scene || party || S().sleeping) return; extend(f); card(h.id);
  }
  function tapPillow(id) {
    const p = PIL[id], s = S(); s.stats.pillows = (s.stats.pillows || 0) + 1;
    if (s.sleeping) { p.jig = 0.3; AUDIO.play(id === 'carrot' ? 'squeak' : 'bubble'); const [x] = NIGHT[id]; HOME.fx.spawn('z', x + 4, p.top - 2, { vy: -12, vx: 6, life: 1.2 }); return; }
    if (id === 'carrot') {
      p.taps.push(t); p.taps = p.taps.filter((q) => t - q < 1.6); p.anim = { t: 0, seq: [1, 2, 2, 1, 0, -1, 0] }; AUDIO.play('squeak');
      if (p.taps.length >= 3) { p.taps = []; p.mood = 'hide'; p.moodUntil = t + 2.6; if (Math.random() < 0.3) later(0.5, () => monkeySay('Морковка штешняетшя!', 'happy')); }
      else { p.mood = 'shy'; p.moodUntil = t + 1.6; HOME.fx.spawn('heart', p.x + rnd(-5, 5), p.top + 6, { vy: -16, life: 0.9, wob: 4 }); if (Math.random() < 0.25) fsay('carrot', pick(PL.carrot), 'carrot'); }
    } else {
      p.anim = { t: 0, seq: [-1, -1, -1, 0, 1, 0] }; AUDIO.play('sizzle'); p.mood = Math.random() < 0.5 ? 'wink' : 'proud'; p.moodUntil = t + 1.6;
      for (let k = 0; k < 7; k++) HOME.fx.spawn('crumb', p.x + rnd(-7, 7), p.top + rnd(10, 26), { c: pick(['#ff8a2a', '#ffd23a', '#ff5c3c']), sz: Math.random() < 0.5 ? 2 : 1, vx: rnd(-10, 10), vy: rnd(-45, -20), g: -15, life: rnd(0.4, 0.7) });
      if (Math.random() < 0.7) { const d = fsay('pepper', pick(PL.pepper), 'pepper'); if (Math.random() < 0.25) later(d + 0.4, () => monkeySay('Ну ты и хваштун, Перчик!', 'happy')); }
    }
  }
  function hold(id) {
    const p = PIL[id]; if (!p || S().sleeping) return; p.held = true; p.holdT = 0; p.heartT = 0; p.mood = id === 'carrot' ? 'shy' : 'proud'; p.moodUntil = t + 99; AUDIO.play('squeeze');
    if (t > p.funCD) { p.funCD = t + 3; GAME.stat('fun', 1.5); S().stats.hugs = (S().stats.hugs || 0) + 1; }
    if (Math.random() < 0.5) fsay(id, id === 'carrot' ? PL.carrotHug : PL.pepperHug, id);
  }
  function release(id) { const p = PIL[id]; if (!p || !p.held) return; p.held = false; p.anim = { t: 0, seq: [1, 0, -1, -1, 0] }; p.moodUntil = t + 0.8; AUDIO.play('boop'); }

  // ---------- friend card: friendship level (hearts + bar), mood, discovered favourite, today's whim; chat / special / treat / duel ----------
  const foodTxt = (k) => `${UI.im(UI.F(k))}${DATA.FOODS[k] ? DATA.FOODS[k].name : k}`;
  function card(id) {
    if (typeof TUT !== 'undefined') TUT.on('friend'); // Round 13: the tour waits for a friend's card
    UI.closeSheet(); // the card replaces any open sheet (the friend can be tapped above it)
    const Fd = FD[id], st = S().friends[id] || {}, left = GAME.spLeft(id), D = DATA.DUELS.find((d) => d.fid === id), fs = GAME.friendship(id), cr = GAME.crave(id), kn = st.known || {}, pl = partyLeft(), hl = heistLeft();
    const w = UI.modal(`<h2>${Fd.name}</h2>
      <div class="fhead"><img class="fport" src="${FART.portrait(id)}" alt=""><div class="fst"><b>${fs.name}</b>${hearts(fs.lv)}<div class="fbar"><i style="width:${Math.round(fs.prog * 100)}%"></i></div><small>${fs.next ? `ещё ${fs.need} до «${fs.next}»` : 'дружба навсегда!'}</small></div></div>
      <p>${Fd.tag}</p>${Fd.trait ? `<p class="fsc">Характер: ${Fd.trait}</p>` : ''}
      <div class="finfo"><div>Настроение: <b class="md-${fs.mood}">${fs.moodName}</b></div><div>Любит: ${kn[Fd.taste.fav] === 'fav' ? foodTxt(Fd.taste.fav) : '<b>?</b>'}</div><div>Сегодня хочет: ${foodTxt(cr.id)}${cr.done ? ' ✓' : ''}</div></div>
      <div class="fbt"><button class="btn g" id="fr-chat">${UI.im(UI.I('chat'))}Болтать</button>
      <button class="btn b" id="fr-sp" style="${left > 0 || fs.mood === 'sulky' ? 'filter:grayscale(.6)' : ''}">${UI.im(UI.I(Fd.sp.icon))}${Fd.sp.name}<small>· ${fs.mood === 'sulky' ? (Fd.she ? 'обиделась' : 'обиделся') : left > 0 ? 'через ' + spLeftTxt(left) : Fd.sp.desc}</small></button>
      <button class="btn" id="fr-feed">${UI.im(UI.F('banana'))}Угостить<small>· из холодильника</small></button>
      ${D ? `<button class="btn" id="fr-duel">${UI.im(UI.I('game'))}${D.name}</button>` : ''}
      ${id === 'zhuk' ? `<button class="btn" id="fr-heist" style="${hl > 0 ? 'filter:grayscale(.6)' : ''}">${UI.im(UI.F('icecream'))}Вылазка<small>· ${hl > 0 ? 'через ' + spLeftTxt(hl) : 'тайком к Пусе'}</small></button>` : ''}
      <button class="btn g" id="fr-party" style="${pl > 0 ? 'filter:grayscale(.6)' : ''}">${UI.im(UI.I('balloon'))}Все вместе!<small>· ${pl > 0 ? 'через ' + spLeftTxt(pl) : 'позвать всех друзей'}</small></button></div>
      <p class="fsc">Дуэли: побед ${st.w || 0} · поражений ${st.l || 0} · Пухлость: ${Math.round((st.fat || 0) * 100)}%</p>${fs.lv ? `<p class="fsc">Бонус: ${fs.perk}</p>` : ''}<button class="btn w sm" data-close>Пока!</button>`, { dismiss: true });
    const b = (sel, fn) => { const el = w.querySelector(sel); if (el) el.onclick = (e) => { if (e) { e.preventDefault(); e.stopPropagation(); } AUDIO.play('click'); UI.closeModal(w); if (typeof HOME !== 'undefined' && HOME.ignoreTapUntil) HOME.ignoreTapUntil(performance.now() + 350); fn(); }; };
    b('#fr-chat', () => chat(id)); b('#fr-sp', () => special(id)); b('#fr-duel', () => MINI.duelIntro(id)); b('#fr-feed', () => feedPick(id));
    b('#fr-heist', () => { if (!startHeist('card')) { AUDIO.play('nope'); const q = heistLeft(); UI.toast(q > 0 ? 'Вылазка — через ' + spLeftTxt(q) : F.pusya.mode !== 'home' ? 'Пуси нет дома — вылазка отменяется' : 'Сейчас не получится', UI.F('icecream')); } });
    b('#fr-party', () => { if (!startParty()) { AUDIO.play('nope'); const q = partyLeft(); UI.toast(q > 0 ? 'Все вместе — через ' + spLeftTxt(q) : 'Сейчас не получится', UI.I('balloon')); } });
    return w;
  }
  // ---------- treat a friend: pick something from the stock (the fridge); what she thinks of it is marked once found out ----------
  const MARK = { fav: '★', like: '♥', bad: '✕' };
  function feedPick(id) {
    const s = S(), Fd = FD[id], st = s.friends[id] || {}, kn = st.known || {}, cr = GAME.crave(id), list = DATA.FOOD_ORDER.filter((f) => s.inv[f] > 0 && !DATA.FOODS[f].nonfood);
    const full = (st.eat || []).filter((q) => Date.now() - q < 600e3).length >= 3, wish = (f) => !cr.done && cr.id === f;
    const btn = (f) => `<button class="btn fd ${MARK[kn[f]] ? kn[f] : ''}${wish(f) ? ' wish' : ''}" data-feed="${f}">${MARK[kn[f]] ? `<i class="tg">${MARK[kn[f]]}</i>` : ''}${wish(f) ? '<i class="wt">хочет!</i>' : ''}${UI.im(UI.F(f), 'px')}<span>${DATA.FOODS[f].name}</span><small>×${s.inv[f]}</small></button>`;
    const w = UI.modal(`<h2>Угостить: ${Fd.name}</h2>${full ? `<p class="fsc">${Fd.short || Fd.name} ${Fd.she ? 'наелась' : 'наелся'} — угости чуть позже</p>` : ''}${list.length ? `<div class="fgrid">${list.map(btn).join('')}</div>`
      : `<p>Холодильник пуст — нечем угостить.</p><button class="btn g" id="fd-shop">${UI.im(UI.I('shop'))}В магазин</button>`}<p class="fsc">Сегодня хочет: ${foodTxt(cr.id)}${cr.done ? ' ✓' : ''}${Object.keys(kn).length ? '<br>★ любит · ♥ нравится · ✕ не ест' : ''}</p><button class="btn w sm" data-close>Отмена</button>`, { dismiss: true });
    w.querySelectorAll('[data-feed]').forEach((b) => { b.onclick = () => { UI.closeModal(w); feed(id, b.dataset.feed); }; });
    const sh = w.querySelector('#fd-shop'); if (sh) sh.onclick = () => { AUDIO.play('click'); UI.closeModal(w); UI.openShop('food'); };
    return w;
  }
  function feed(id, food, quiet) {
    const r = GAME.feedFriend(id, food); if (!r) { AUDIO.play('nope'); return false; }
    const f = F[id], d = drawn.find((q) => q.kind === 'friend' && q.id === id), E = FD[id].eat;
    const mx = d ? d.x0 + (d.e.mouth ? d.e.mouth[0] : d.e.w / 2) : f.x, my = d ? d.y0 + (d.e.mouth ? d.e.mouth[1] : d.e.h / 3) : f.headY + 10;
    if (r.kind === 'full' || r.kind === 'bad') {
      // refused: turns the head away, pushes the treat back (it stays in the fridge)
      AUDIO.play('nope'); f.look = [-Math.sign(HOME.mk.x - f.x) || 1, 0]; f.lookUntil = t + 1.8; f.pose = 'idle'; f.poseUntil = t + 1.8;
      if (d) HOME.fx.spawn('img', mx, my - 6, { img: ART.food(food), vx: Math.sign(HOME.mk.x - f.x) * 40, vy: -60, g: 260, life: 0.6 });
      if (!quiet) { const l = r.kind === 'full' ? E.full : (E.badOf && E.badOf[food]) || pick(E.bad), dd = fsay(id, l, id); if (r.kind === 'bad' && Math.random() < 0.6) later(dd + 0.3, () => monkeySay(pick(DATA.LINES.fNope), 'sad')); }
      HOME.face('sad', 'o', 1); return r.kind;
    }
    f.pose = 'happy'; f.poseUntil = t + 1.6; hop(f, r.kind === 'fav' ? 120 : 70);
    AUDIO.play('chomp'); later(0.26, () => AUDIO.play('chomp'));
    if (d) {
      HOME.fx.spawn('img', mx, my - 8, { img: ART.food(food), vy: -6, life: 0.6 });
      for (let i = 0; i < 6; i++) HOME.fx.spawn('crumb', mx + (Math.random() - 0.5) * 8, my, { c: i % 2 ? '#e8c070' : '#c8843a', vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 30, g: 260, life: 0.6 });
      const nh = r.kind === 'fav' ? 9 : r.kind === 'like' ? 3 : 1;
      for (let k = 0; k < nh; k++) HOME.fx.spawn('heart', mx + (nh > 1 ? rnd(-14, 14) : 0), my - 14 + rnd(-4, 4), { vy: -rnd(14, 30), vx: nh > 1 ? rnd(-8, 8) : 0, life: 1.2, wob: 5, fadeIn: k * 0.07 });
      if (r.kind === 'fav') HOME.fx.spawn('ring', mx, my - 10, { r0: 4, r1: 22, life: 0.45, c: '#ff8ab0' });
    }
    if (r.kind === 'fav') later(0.5, () => AUDIO.play('happy'));
    if (r.crave) { later(0.7, () => { AUDIO.play('coin'); UI.float(mx, my - 24 - (HOME.camY || 0), '+5', UI.I('coin')); }); }
    HOME.face('happy', 'smile', 1.2);
    if (!quiet) fsay(id, r.food.kg < 0 ? 'Ой, я похудел' + (FD[id].she ? 'а' : '') + '!' : r.crave ? E.crave : r.kind === 'fav' ? E.fav : pick(E[r.kind]), id);
    return r.kind;
  }

  function info() {
    const room = HOME.room, asleep = S().sleeping && room === 'zal';
    const fat = {}, fr = {}; for (const id of IDS) { const st = S().friends[id] || {}, fs = GAME.friendship(id), cr = GAME.crave(id); fat[id] = Math.round((st.fat || 0) * 100) / 100; fr[id] = { fp: fs.fp, lv: fs.lv, md: fs.md, mood: fs.mood, crave: cr.id + (cr.done ? '✓' : ''), known: Object.assign({}, st.known) }; }
    return { fat, f: fr, party: party ? { kind: party.kind, act: party.act, auto: party.auto, lights: Math.round(party.lights * 100) / 100, bites: party.bites } : null, here: IDS.filter((id) => F[id].room === room).map((id) => ({ id, x: Math.round(F[id].x), y: Math.round(F[id].y), mode: F[id].mode })), visitor: visitorId(), scene: scene ? scene.id : null, bubble: UI.fbubbleText || null, speaker: bub ? bub.who : null, guest: guest ? { id: guest.id, host: guest.host, room: F[guest.id].room, ph: guest.ph, mode: F[guest.id].mode } : null, heist: heist ? { ph: heist.ph, src: heist.src } : null, offer: t < offerUntil, nap: !!F.pusya.nap,
      pillows: room === 'zal' ? { carrot: asleep ? 'hug' : pillowOpts(PIL.carrot).mood, pepper: asleep ? 'sleep' : pillowOpts(PIL.pepper).mood } : null };
  }
  return { behindTable, levelUp, boxes, _gift: gift, party: (o) => startParty(o), _party: (o) => startParty(Object.assign({ force: true }, o)), _endParty: endParty, _tryParty: tryParty, partyOn: () => !!party, partyKind: () => (party ? party.kind : null), dashaParty: (b) => startParty({ kind: 'dasha', force: true, bday: b }), doorT: () => 0, update, render, at, tap, hold, release, card, chat, special, info, feed, feedPick, busy: () => !!scene, sceneActive, tapScene, hosting: () => !!(party || visitorId() || heist), growParty: (st) => startParty({ kind: 'grow', stage: st, force: true }), _cake: () => (party && party.cake) || null, heist: (src) => startHeist(src || 'api'), heistOK, heistLeft, PAIR, _guest: startGuest, HOMES, VSPOT, IDS,
    _joke: joke, _visit: startVisit, _greetNow: () => { greetNow = true; greetT = -1; }, CALL, _reset: () => { party = null; guest = null; heist = null; offerUntil = 0; offerT = 0; HOME.sneak(false); F.pusya.nap = false; F.zhuk.ride = false; AUDIO.stop('disco'); cancelScene(); timers = []; for (const id of IDS) goHome(F[id]); }, _skip: (s) => { t += s; }, _F: F, _PIL: PIL, get t() { return t; }, get drawn() { return drawn; } };
})();
