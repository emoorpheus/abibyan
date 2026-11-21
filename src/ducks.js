'use strict';
// ===== Round 9 #12: the rubber-duck travellers (photos IMG_7836–7842): papa (big, orange beak), three ducklings (one tiny with
// eyelashes), mama last (big, red beak, arched brows, red cheeks). One slow line all over the flat: every time Абибян changes
// rooms they shuffle on a little (STEP px), room by room along ROUTE; in his room they waddle very slowly (SPEED px/s).
const DUCKS = (() => {
  const RW = ROOMS.RW, LANE = 276, STEP = 30, SPEED = 2.4, GAP = 3; // Round 10 #2: LANE 303 → 276 — on a short phone the room buttons cover y ≥ 277 and ate the taps
  const LINE = [{ id: 'mama', kind: 'mama' }, { id: 'lash', kind: 'lash' }, { id: 'kid1', kind: 'kid' }, { id: 'kid2', kind: 'kid' }, { id: 'papa', kind: 'papa' }]; // Round 11 #4: mama leads, papa closes
  const ROUTE = ['hall', 'kitchen', 'balcony', 'zal', 'bath']; // a loop through the whole flat, «то там, то сям»
  const PAL = { o: '#8a5410', y: '#ffd42a', h: '#fff1a0', s: '#f2aa1c', b: '#ff7a1c', B: '#e8661a', r: '#e8303a', R: '#b8222e', p: '#f25560', k: '#1a1010', w: '#ffffff' };
  // shapes facing right, in pixels: body / tail / head ellipses, the beak, the eye; extras per kind
  const KIND = { // Round 10 #1: ~22 % smaller than Round 9 (papa 19×16 → 15×12, the ducklings 13×10 → 10×8)
    papa: { body: [6.3, 7.4, 5.9, 3.3], tail: [1.5, 5.0, 1.4, 1.8], head: [8.4, 3.3, 3.0, 3.0], beak: [[11, 3, 'bb'], [11, 4, 'B']], eye: [9, 2], wing: [[3, 7], [4, 8], [5, 8], [6, 7]] },
    mama: { body: [6.5, 7.0, 6.1, 2.95], tail: [1.5, 4.8, 1.4, 1.6], head: [8.6, 3.3, 3.0, 2.8], beak: [[11, 3, 'rr'], [11, 4, 'RR'], [11, 5, 'R']], eye: [9, 2], brow: [[8, 0], [9, 0], [10, 1]], blush: [[3, 6], [4, 6], [3, 7], [4, 7]], wing: [[3, 8], [4, 8], [5, 8], [6, 7]] },
    kid: { body: [3.9, 4.4, 3.7, 1.9], tail: [1.0, 2.8, 0.95, 1.2], head: [5.3, 2.0, 2.0, 1.9], beak: [[7, 2, 'b'], [7, 3, 'B']], eye: [5, 1], wing: [[2, 4], [3, 5], [4, 4]] },
    lash: { body: [3.6, 4.3, 3.4, 1.8], tail: [0.9, 2.8, 0.9, 1.1], head: [4.9, 2.0, 1.9, 1.85], beak: [[6, 2, 'b'], [6, 3, 'B']], eye: [5, 1], lash: [[4, 0], [6, 0]], wing: [[2, 4], [3, 4]] },
  };
  const cache = new Map();
  function grid(kind) {
    const K = KIND[kind], M = 1, shapes = [K.body, K.tail, [K.head[0], K.head[1], K.head[2], K.head[3]]];
    const W = Math.ceil(Math.max(...shapes.map((e) => e[0] + e[2]), ...K.beak.map(([x, , s]) => x + s.length))) + M * 2, H = Math.ceil(Math.max(...shapes.map((e) => e[1] + e[3]))) + M * 2;
    const g = Array.from({ length: H }, () => Array(W).fill('.')), put = (x, y, c) => { x += M; y += M; if (g[y] && x >= 0 && x < W) g[y][x] = c; };
    const ell = ([cx, cy, rx, ry], f) => { for (let y = 0; y < H - M; y++) for (let x = 0; x < W - M; x++) { const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry; if (u * u + v * v <= 1) put(x, y, f(u, v)); } };
    ell(K.tail, (u, v) => v > 0.35 ? 's' : 'y');
    ell(K.body, (u, v) => v > 0.5 || (v > 0.15 && u > 0.7) ? 's' : (v < -0.55 && u < 0.1) ? 'h' : 'y');
    ell(K.head, (u, v) => (u < -0.15 && v < -0.3 && u * u + v * v > 0.25) ? 'h' : (v > 0.55 && u > -0.2) ? 's' : 'y');
    for (const [x, y] of K.wing || []) put(x, y, 's');
    for (const [x, y] of K.blush || []) put(x, y, 'p');
    for (const [x, y, s] of K.beak) [...s].forEach((c, i) => put(x + i, y, c));
    put(K.eye[0], K.eye[1], 'k'); if (kind === 'papa' || kind === 'mama') put(K.eye[0], K.eye[1] + 1, 'k');
    for (const [x, y] of (K.brow || []).concat(K.lash || [])) put(x, y, 'k');
    // the outline: every empty pixel touching the duck (4-neighbours)
    const o = g.map((r) => r.slice()); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (g[y + dy] || [])[x + dx] && g[y + dy][x + dx] !== '.')) o[y][x] = 'o';
    return o;
  }
  // frame 1 = the waddle: the top half leans forward a pixel
  function sprite(kind, f, dir) {
    const key = kind + f + dir; let c = cache.get(key); if (c) return c;
    const g = grid(kind), H = g.length, W = g[0].length; c = PX.canvas(W + 1, H); const x = c.getContext('2d');
    g.forEach((r, y) => r.forEach((ch, i) => { if (!PAL[ch]) return; const sx = i + (f && y < H * 0.45 ? 1 : 0); x.fillStyle = PAL[ch]; x.fillRect(dir < 0 ? W - sx : sx, y, 1, 1); }));
    cache.set(key, c); return c;
  }
  const S = () => GAME.S;
  const drawnDucks = new Set();
  function startFrame() { drawnDucks.clear(); }
  function laneY(x, room) {
    let dy = 0;
    if (typeof HOME !== 'undefined' && HOME.room === room && HOME.mk && typeof GAME !== 'undefined' && GAME.S && !GAME.S.sleeping) {
      const mx = HOME.mk.x, my = HOME.mk.y;
      const dx = Math.abs(x - mx);
      if (dx < 32 && my > 220 && my < 290) {
        const targetY = my < 282 ? Math.min(293, my + 14) : Math.max(250, my - 34);
        const w = Math.cos((dx / 32) * (Math.PI / 2));
        const cdy = (targetY - LANE) * w;
        if (Math.abs(cdy) > Math.abs(dy)) dy = cdy;
      }
    }
    if (typeof FRIENDS !== 'undefined' && FRIENDS.info) {
      const here = (FRIENDS.info().here || []).filter((f) => f.id !== 'mosq');
      for (const f of here) {
        const fx = f.x, fy = f.y;
        const dx = Math.abs(x - fx);
        if (dx < 34 && fy > 220 && fy <= 292) {
          const targetY = fy < 284 ? Math.min(294, Math.max(288, fy + 12)) : Math.max(250, fy - 34);
          const w = Math.cos((dx / 34) * (Math.PI / 2));
          const cdy = (targetY - LANE) * w;
          if (Math.abs(cdy) > Math.abs(dy)) dy = cdy;
        }
      }
    }
    if (room === 'balcony' && x < 98) {
      const by = 293;
      const w = x <= 80 ? 1 : Math.cos(((x - 80) / 18) * (Math.PI / 2));
      const bdy = (by - LANE) * w;
      if (bdy > dy) dy = bdy;
    }
    if (room === 'zal' && x < 92) {
      const by = 290;
      const w = x <= 74 ? 1 : Math.cos(((x - 74) / 18) * (Math.PI / 2));
      const bdy = (by - LANE) * w;
      if (bdy > dy) dy = bdy;
    }
    return Math.round(LANE + dy);
  }
  function st() { const s = S(); if (!s.ducks || !ROUTE.includes(s.ducks.room)) s.ducks = { room: 'hall', x: 30, dir: 1 }; return s.ducks; }
  const width = (k) => sprite(k, 0, 1).width - 1, LEN = LINE.reduce((a, d) => a + width(d.kind) + GAP, 0);
  function pos() {
    const p = st(), out = []; let x = p.x, prevW = 0;
    for (const d of LINE) {
      const w = width(d.kind);
      if (out.length) x -= p.dir * (prevW / 2 + GAP + w / 2);
      const y = laneY(x, p.room);
      out.push({ id: d.id, kind: d.kind, x, y, w, h: sprite(d.kind, 0, 1).height });
      prevW = w;
    }
    return out;
  }
  // past the far edge with the whole line → the next room on the route; they come in at its edge, the other way round
  function walk(dx) {
    const p = st(); p.x += p.dir * dx;
    if (p.dir > 0 ? p.x > RW + LEN : p.x < -LEN) { const i = (ROUTE.indexOf(p.room) + 1) % ROUTE.length; p.room = ROUTE[i]; p.dir = i % 2 ? -1 : 1; p.x = p.dir > 0 ? -4 : RW + 4; }
  }
  let t = 0, hop = null;
  function update(dt) { t += dt; if (hop) { hop.k += dt / 0.45; if (hop.k >= 1) hop = null; } if (APP.scene === 'home' && HOME.room === st().room && !S().sleeping) walk(SPEED * dt); }
  function moved() { walk(STEP); } // HOME: he went to another room
  function render(c, P, filterFn) {
    const p = st(); if (HOME.room !== p.room) return;
    pos().forEach((d, i) => {
      if (filterFn && !filterFn(d)) return;
      if (drawnDucks.has(d.id)) return;
      drawnDucks.add(d.id);
      const step = Math.floor(t * 2.6 + i * 0.5) % 2, up = hop && hop.id === d.id ? Math.round(Math.sin(hop.k * Math.PI) * 6) : step, cv = sprite(d.kind, step, p.dir);
      if (d.x < -d.w || d.x > RW + d.w) return;
      P.shadow(d.x, d.y + 1, d.w / 2, 1.5, 0.22); c.drawImage(cv, Math.round(d.x - cv.width / 2), d.y - cv.height + 1 - up);
    });
  }
  // a finger is fat: a few pixels round each duck count, the nearest one wins
  function at(x, y) { if (HOME.room !== st().room) return null; const c = pos().filter((q) => Math.abs(x - q.x) <= q.w / 2 + 3 && y <= q.y + 5 && y >= q.y - q.h - 4).sort((a, b) => Math.abs(x - a.x) - Math.abs(x - b.x)); return c.length ? c[0].id : null; }
  function tap(id) {
    const d = pos().find((q) => q.id === id); if (!d) return; hop = { id, k: 0 }; AUDIO.play('squeak'); HOME.lookAt(d.x, d.y - 8, 1.6);
    HOME.fx.spawn('note', d.x + 2, d.y - d.h - 4, { vy: -22, vx: (Math.random() - 0.5) * 16, life: 0.9 }); // Round 10 #2: a little «кря» note pops up
    if (!GAME.ageDef().babble && Math.random() < 0.7) HOME.say(DATA.LINES.ducks[Math.floor(Math.random() * DATA.LINES.ducks.length)], 'happy');
  }
  return { LINE, ROUTE, KIND, sprite, st, pos, update, moved, render, startFrame, at, tap, info: () => ({ room: st().room, x: st().x, dir: st().dir, hop: hop ? hop.id : null }), _place: (room, x, dir) => { Object.assign(st(), { room, x, dir }); }, _hop: (h) => { hop = h; } };
})();
