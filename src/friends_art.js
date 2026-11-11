'use strict';
// ===== Friends & bed pillows: procedural pixel-art sprites (from the owner's photos) =====
// Same shaded rasterizer as the monkey (MONKEY.sprite): light from top-left, colour outline = darkest ramp step.
const FART = (() => {
  const K = MONKEY.K, cache = new Map();
  const MAXC = 220;
  // pad: extra columns on both sides (a well-fed friend grows wider than the base canvas); shapes shift via the sprite origin, decals via a shifted API
  // sc (Round 8): the friend's own size — shapes are re-rasterized at that scale (crisp), decal pixels are mapped: shrinking keeps every
  // stroke (one pixel each, the last one wins), growing fills each pixel's whole block (no holes)
  function get(key, w, h, ax, ay, draw, decal, meta, pad = 0, sc = 1) {
    let e = cache.get(key); if (e) { cache.delete(key); cache.set(key, e); return e; }
    let dec = decal;
    if (decal && (pad || sc !== 1)) dec = (d) => {
      const done = new Set(), F = Math.floor;
      const each = (x, y, fn) => { x += pad; if (sc === 1) return fn(F(x), F(y)); if (sc < 1) return fn(F((x + 0.5) * sc), F((y + 0.5) * sc));
        const x0 = F(F(x) * sc), x1 = Math.max(x0, Math.ceil((F(x) + 1) * sc) - 1), y0 = F(F(y) * sc), y1 = Math.max(y0, Math.ceil((F(y) + 1) * sc) - 1);
        for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) fn(xx, yy); };
      const px = (x, y, c) => each(x, y, (X, Y) => d.px(X, Y, c)), pxk = (x, y, c, m) => each(x, y, (X, Y) => d.pxk(X, Y, c, m));
      decal({ px, pxk, on: (x, y) => { let r = false; each(x, y, (X, Y) => { r = r || d.on(X, Y); }); return r; },
        shade: (x, y, k) => each(x, y, (X, Y) => { const i = Y * 4096 + X; if (done.has(i)) return; done.add(i); d.shade(X, Y, k); }), col: d.col,
        hline: (x0, x1, y, c, m) => { for (let x = x0; x <= x1; x++) each(x, y, (X, Y) => d.pxk(X, Y, c, m || 0)); } });
    };
    const W = Math.ceil((w + 2 * pad) * sc), H = Math.ceil(h * sc), R = Math.round;
    const cv = MONKEY.sprite(W, H, draw, dec, { ox: pad * sc, s: sc });
    const m = Object.assign({}, meta || {}); for (const k of ['head', 'mouth']) if (m[k]) m[k] = [R((m[k][0] + pad) * sc), R(m[k][1] * sc)];
    e = Object.assign({ cv, w: W, h: H, ox: R((ax + pad) * sc), oy: R(ay * sc), key, sc }, m); cache.set(key, e); while (cache.size > MAXC) cache.delete(cache.keys().next().value);
    return e;
  }
  const fatQ = (o) => Math.max(0, Math.min(1, Math.round((o.fat || 0) * 4) / 4)); // fed friends get chubbier in 4 steps
  // ---- decal helpers ----
  function line(d, x0, y0, x1, y1, c, mask) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); mask ? d.pxk(x, y, c, mask) : d.px(x, y, c); } }
  function arc(d, cx, cy, r, up, c, mask) { // closed-eye arc: up=1 "︶"-ish smile eyes (happy), up=-1 "⌒"
    let py = null; for (let x = Math.round(cx - r); x <= Math.round(cx + r) - 1; x++) { const dx = (x + 0.5 - cx) / r; const y = Math.round(cy - up * (1 - dx * dx) * 0.55 * r); mask ? d.pxk(x, y, c, mask) : d.px(x, y, c); if (py !== null && Math.abs(py - y) > 1) for (let yy = Math.min(py, y) + 1; yy < Math.max(py, y); yy++) mask ? d.pxk(x, yy, c, mask) : d.px(x, yy, c); py = y; }
  }
  const bit = (...ks) => ks.reduce((a, k) => a | (1 << k), 0);

  // ================= Пуся: dark fluffy cat, huge yellow sad-kind eyes, pink nose, red collar =================
  // o: {pose: idle|talk|happy|knead|wash|catch|dizzy, f: 0/1}
  const CAT = ['#0d0c11', '#1c1a21', '#28252d', '#343139', '#45414b', '#59545f'];
  function catEye(d, cx, cy, r, side, o) {
    const FM = bit(K.HEAD);
    if (o.eyes === 'happy' || o.eyes === 'closed') { arc(d, cx, cy + (o.eyes === 'happy' ? 0.5 : 0.2), r * 0.95, o.eyes === 'happy' ? 1 : -1, '#e8c440', FM); return; }
    if (o.eyes === 'dizzy') { for (let t = -2; t <= 2; t++) { d.pxk(cx + t, cy + t, '#f2c21a', FM); d.pxk(cx + t, cy - t, '#f2c21a', FM); } return; }
    const lx = (o.look ? o.look[0] : 0) * 0.9, ly = (o.look ? o.look[1] : 0) * 0.6;
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, dd = Math.hypot(dx / r, dy / (r * 1.04)); if (dd > 1) continue;
      const lid = -r * 0.16 + side * dx * 0.2 + (o.lid || 0) * r; // droopy upper lid, lower on the outer side: gentle sad-kind look
      if (dy < lid - 0.5) continue; // fur stays above the lid
      let c = dy < lid + 0.6 ? '#0a090c' : dd > 0.8 ? '#7a5a08' : dy > r * 0.3 ? '#ffe36a' : dy > -r * 0.1 ? '#f5c51e' : '#d9a412';
      if (Math.hypot(dx - lx, (dy - 0.6 - ly) * 0.9) < r * 0.5 && dy >= lid + 0.6) c = '#120d08';
      d.pxk(x, y, c, FM);
    }
    d.pxk(Math.round(cx - r * 0.35 + lx), Math.round(cy - r * 0.05 + ly), '#ffffff', FM);
    d.pxk(Math.round(cx - r * 0.35 + lx) + 1, Math.round(cy - r * 0.05 + ly), '#fff6d0', FM);
  }
  function pusya(o = {}) {
    const p = o.pose || 'idle', f = o.f ? 1 : 0, b = (p === 'idle' || p === 'talk') && f ? 0.5 : 0;
    const fz = fatQ(o), key = 'pusya|' + (o.big ? 'B|' : '') + p + '|' + f + '|' + (o.eyes || '') + '|' + (o.look ? o.look.join(',') : '') + '|' + (o.mouth || '') + '|' + (o.blush ? 1 : 0) + '|' + fz;
    const lx = 3.5 * fz, tx = 4 * fz;
    return get(key, 42, 44, 21, 43, (a) => {
      const fur = a.matR('pusyaFur', CAT, 1), red = a.mat('pusyaCollar', '#d23a2e'), tag = a.mat('pusyaTag', '#f2c64a');
      // tail curls up the right side
      a.tube([[30 + tx, 39, 2.6], [36 + tx, 35, 2.6], [38.5 + tx, 28, 2.4], [37 + tx, 21, 2.2], [34.5 + tx, 18, 2]], K.TAIL, fur);
      a.ell(12 - lx, 36, 7, 6.5, K.LEG, fur); a.ell(30 + lx, 36, 7, 6.5, K.LEG, fur);
      a.ellU([[21, 32 - 0.4 * fz, 11 + 6 * fz, 10 + 1.4 * fz], [21, 26, 8.5 + 2.8 * fz, 7 + 0.5 * fz]], K.BODY, fur, { vb: 0.05 });
      a.tube([[13.5 - 2 * fz, 24.6, 1.7], [21, 26.6, 1.8], [28.5 + 2 * fz, 24.6, 1.7]], K.ACC, red);
      a.ell(21, 28.6, 1.7, 1.7, K.ACC, tag);
      // front legs / paws by pose
      const L = [[16.5 - 1.5 * fz, 28], [16 - 1.5 * fz, 39.5]], R = [[25.5 + 1.5 * fz, 28], [26 + 1.5 * fz, 39.5]];
      if (p === 'knead') { if (f) L[1] = [16.5, 34]; else R[1] = [25.5, 34]; }
      if (p === 'wash') R[1] = [24, 22.5];
      if (p === 'catch') { L[1] = [12, 18]; R[1] = [30, 18]; }
      a.tube([[L[0][0], L[0][1], 2.7], [L[1][0], L[1][1] - 1, 2.6]], K.ARM, fur); a.ell(L[1][0], L[1][1], 3.3, 2.5, K.HAND, fur);
      a.tube([[R[0][0], R[0][1], 2.7], [R[1][0], R[1][1] - 1, 2.6]], K.ARM, fur); a.ell(R[1][0], R[1][1], 3.3, 2.5, K.HAND, fur);
      // round folded ears, fluffy head
      a.ell(10, 7.5 + b, 3.8, 3.3, K.EAR, fur); a.ell(32, 7.5 + b, 3.8, 3.3, K.EAR, fur);
      a.ell(21, 14.5 + b, 13.2 + 1.2 * fz, 10.6 + 0.3 * fz, K.HEAD, fur, { sp: { n: 24, a: 0.85, seed: 5 } });
    }, (d) => {
      const y = 14.5 + b, FM = bit(K.HEAD);
      const eyes = o.eyes || (p === 'happy' || p === 'knead' ? 'happy' : p === 'wash' ? 'closed' : p === 'dizzy' ? 'dizzy' : 'open');
      catEye(d, 14.6, y + 0.2, 4.9, -1, { eyes, look: o.look }); catEye(d, 27.4, y + 0.2, 4.9, 1, { eyes, look: o.look });
      // pink nose + tiny mouth
      const ny = Math.round(y + 4.5); d.pxk(20, ny, '#f095a8', FM); d.pxk(21, ny, '#f7b3c0', FM); d.pxk(22, ny, '#f095a8', FM); d.pxk(21, ny + 1, '#c96b80', FM);
      const m = o.mouth || (p === 'talk' && f ? 'open' : p === 'happy' || p === 'knead' ? 'smile' : '');
      if (m === 'open') { d.pxk(20, ny + 2, '#4a1a26', FM); d.pxk(21, ny + 2, '#4a1a26', FM); d.pxk(22, ny + 2, '#4a1a26', FM); d.pxk(21, ny + 3, '#c96b80', FM); }
      else if (m === 'smile') { d.pxk(19, ny + 2, '#050407', FM); d.pxk(20, ny + 3, '#050407', FM); d.pxk(22, ny + 3, '#050407', FM); d.pxk(23, ny + 2, '#050407', FM); d.pxk(21, ny + 2, '#050407', FM); }
      else { d.pxk(20, ny + 2, '#050407', FM); d.pxk(22, ny + 2, '#050407', FM); }
      if (o.blush || p === 'happy' || p === 'knead') { for (const bx of [10, 30]) { d.pxk(bx, Math.round(y + 4), '#7a3a4e', FM); d.pxk(bx + 1, Math.round(y + 4), '#8c4458', FM); } }
      if (p === 'wash') { d.pxk(22, 24, '#d0687e', 1 << K.HAND); d.pxk(23, 24, '#e07f92', 1 << K.HAND); } // tongue on the paw
    }, { head: [21, 3], mouth: [21, 20] }, fz ? 4 : 0, o.big ? 1 : 0.85); // Round 8: a bit smaller (×0.85) — the card keeps the full-size portrait
  }

  // ================= Крот Монти: round orange mole, white muzzle + belly, glossy black nose, buck teeth, whiskers =================
  function monty(o = {}) {
    const p = o.pose || 'idle', f = o.f ? 1 : 0, b = (p === 'idle' || p === 'talk') && f ? 0.6 : 0;
    const fz = fatQ(o), key = 'monty|' + p + '|' + f + '|' + (o.blush ? 1 : 0) + '|' + (o.arm || '') + '|' + fz, ax = 4 * fz, fx2 = 2 * fz;
    return get(key, 50, 40, 25, 39, (a) => {
      const or = a.mat('montyFur', '#e08d2c', 4), wh = a.mat('montyWhite', '#f6f1e6'), bk = a.mat('montyBlack', '#1d1b20'), so = a.mat('montySole', '#f4e2b0');
      a.ell(16 - fx2, 35.5, 6.8, 3.6, K.FOOT, or); a.ell(34 + fx2, 35.5, 6.8, 3.6, K.FOOT, or);
      a.ell(16 - fx2, 37.2, 5.2, 1.6, K.FOOT, so, { edge: 0 }); a.ell(34 + fx2, 37.2, 5.2, 1.6, K.FOOT, so, { edge: 0 });
      a.ell(25, 21 + b + 0.8 * fz, 16 + 6 * fz, 15.3 + 1.2 * fz, K.BODY, or);
      a.ell(25, 26.6 + b + 0.6 * fz, 13.6 + 4.5 * fz, 9.6 + 1.6 * fz, K.BELLY, wh, { flat: 0.82 }); // Round 8: a big round tummy
      // stubby arms with black claw tips; 'up' poses for the bongo duel
      const arm = o.arm || (p === 'talk' && f ? 'wave' : ''), aL = arm === 'L' || arm === 'both' ? -6 : 0, aR = arm === 'R' || arm === 'both' || arm === 'wave' ? -6 : 0;
      a.ell(8 - ax, 23 + aL + b, 4.4, 3.5, K.ARM, or); a.ell(4.4 - ax, 23.6 + aL + b, 2.1, 2, K.HAND, bk);
      a.ell(42 + ax, 23 + aR + b, 4.4, 3.5, K.ARM, or); a.ell(45.6 + ax, 23.6 + aR + b, 2.1, 2, K.HAND, bk);
      a.ellU([[18.6, 18 + b, 7.6, 4.7], [31.4, 18 + b, 7.6, 4.7]], K.FACE, wh);
      a.ell(25, 13.2 + b, 4.6, 3.8, K.NOSE, bk);
    }, (d) => {
      const y = b, FM = bit(K.FACE, K.BODY, K.NOSE, K.BELLY), LN = '#2b1608';
      // closed, kindly eyes (old-man squint)
      if (p === 'sad') { arc(d, 17.5, 10.6 + y, 2.8, -1, LN, FM); arc(d, 32.5, 10.6 + y, 2.8, -1, LN, FM); }
      else { arc(d, 17.5, 9.6 + y, 3, -1, LN, FM); arc(d, 32.5, 9.6 + y, 3, -1, LN, FM); d.pxk(14, Math.round(10 + y), LN, FM); d.pxk(35, Math.round(10 + y), LN, FM); }
      if (p === 'think') { d.pxk(16, Math.round(7 + y), LN, FM); d.pxk(17, Math.round(6.5 + y), LN, FM); d.pxk(33, Math.round(6.5 + y), LN, FM); d.pxk(34, Math.round(7 + y), LN, FM); }
      // nose shine
      d.px(23, Math.round(11 + y), '#ffffff'); d.px(24, Math.round(11 + y), '#9a98a4'); d.px(23, Math.round(12 + y), '#6a6874');
      // buck teeth: hidden mid-mumble
      const ty = Math.round(19 + y);
      if (!(p === 'talk' && f)) { for (let x = 23; x <= 26; x++) { d.px(x, ty - 1, '#7a6a5a'); d.px(x, ty + 2, '#7a6a5a'); for (let yy = ty; yy <= ty + 1; yy++) d.px(x, yy, '#ffffff'); } d.px(22, ty, '#7a6a5a'); d.px(22, ty + 1, '#7a6a5a'); d.px(27, ty, '#7a6a5a'); d.px(27, ty + 1, '#7a6a5a'); d.px(24, ty, '#cfc8bc'); d.px(25, ty + 1, '#e8e2d8'); }
      else { for (let x = 23; x <= 26; x++) d.px(x, ty, '#5a2a1a'); d.px(24, ty + 1, '#5a2a1a'); d.px(25, ty + 1, '#5a2a1a'); }
      // whiskers (long, drooping black threads); twitch when he mumbles
      const w = p === 'talk' ? (f ? 1 : -1) : 0, W = '#141216';
      line(d, 11, 17 + y, 2, 15 + y + w, W); line(d, 11, 19 + y, 1, 20 + y, W); line(d, 12, 21 + y, 3, 26 + y - w, W);
      line(d, 38, 17 + y, 47, 15 + y + w, W); line(d, 38, 19 + y, 48, 20 + y, W); line(d, 37, 21 + y, 46, 26 + y - w, W);
      if (o.blush || p === 'happy') { d.pxk(12, Math.round(15 + y), '#f0a0a0', FM); d.pxk(13, Math.round(15 + y), '#f0a0a0', FM); d.pxk(36, Math.round(15 + y), '#f0a0a0', FM); d.pxk(37, Math.round(15 + y), '#f0a0a0', FM); }
      // foot claws: three dark dots on each toe line
      const cs = Math.round(fx2), FT = bit(K.FOOT); for (const fx of [11, 14, 17]) d.pxk(fx - cs, 37, '#3a2210', FT); for (const fx of [33, 36, 39]) d.pxk(fx + cs, 37, '#3a2210', FT); // only on the toes, never on the tummy
    }, { head: [25, 5], mouth: [25, 20] }, fz ? 4 : 0, 1.2); // Round 8: Монти ×1.2
  }

  // ================= Москит: fuzzy brown mosquito, googly eyes, long proboscis, cream wings, rope legs =================
  // Round 8: in the rooms Москит became a hand-placed pixel map (googly eyes, cream wings, orange chest, striped tummy, the proboscis,
  // black rope legs); the big rasterized one (k > 1) stays for his card portrait and the gym duel.
  // Round 9 #5: ×1.5 — a new 25×24 map (was 15×16): 4×4 eyes with 2×2 pupils, longer wings and legs, a 10-row striped tummy
  // Round 9 #8: six legs (a hind pair from the tummy) and a long cream nose from his mouth down past the tip of his tummy (25×26)
  const QM = ['.....k.............k.....', '......k...........k......', '.......k.........k.......', '........ooooooooo........', 'V......owwwwowwwwo......V', 'WV.....owkkwowkkwo.....VW',
    'WWV....owkkwhwkkwo....VWW', 'WWWV...owwwwhwwwwo...VWWW', '.WWWV...oooohoooo...VWWW.', '..WWWV..ohhhnhhho..VWWW..', '...WWVV..occncco..VVWW...', '....VVV..oCCnCCo..VVV....',
    '......ll.obbnbbo.ll......', '.....l...obbnbbo...l.....', '....l...lorrrrrol...l....', '...l...l.obbbbbo.l...l...', '..l...l...obbbo...l...l..', '..l...l..lorrrol..l...l..',
    '.l...l...lobbbol...l...l.', 'kk...l...lobbbol...l...kk', '....l...l..oro..l...l....', '....l...l..ooo..l...l....', '...kk..l.........l..kk...', '......kk.........kk......', '.........................', '.........................'];
  const QC = { o: '#4a2c14', h: '#9e6a3a', w: '#f7f3ea', k: '#141016', W: '#efe2c0', V: '#a88a5a', c: '#ec7a2a', C: '#f59a4a', n: '#f2dcaa', N: '#e0c088', b: '#b48a5a', r: '#7a5030', l: '#1f1c22', M: '#5a2a1a' };
  const QBODY = { 9: 'h', 10: 'c', 11: 'C', 12: 'b', 13: 'b', 14: 'r', 15: 'b', 16: 'b', 17: 'r', 18: 'b', 19: 'b', 20: 'r', 21: 'o', 22: '.', 23: '.', 24: '.', 25: '.' }; // under the proboscis
  const QNOSE = (g) => { g[9][11] = g[9][13] = 'n'; for (let y = 9; y <= 25; y++) g[y][12] = y === 25 ? 'N' : 'n'; }; // Round 9 #8: the long nose, from his mouth down past the tip of his tummy
  function mosqPx(o, p, f, fz) {
    const key = 'mosqpx|' + p + '|' + f + '|' + (o.look ? o.look.map(Math.sign).join(',') : '') + '|' + fz;
    const hit = cache.get(key); if (hit) return hit;
    const g = QM.map((r) => [...r]); QNOSE(g); const at = (x, y, c) => { if (g[y] && x >= 0 && x < g[y].length) g[y][x] = c; }, MX = (x) => 24 - x, both = (x, y, c) => { at(x, y, c); at(MX(x), y, c); };
    // eyes: the 2×2 pupils follow the look; happy = ^ ^
    const lx = o.look ? Math.sign(o.look[0]) : 0, ly = o.look && o.look[1] < 0 ? -1 : 0;
    for (const e0 of [8, 13]) {
      for (let y = 4; y <= 7; y++) for (let x = e0; x < e0 + 4; x++) at(x, y, 'w');
      if (p === 'happy') { at(e0, 6, 'k'); at(e0 + 1, 5, 'k'); at(e0 + 2, 5, 'k'); at(e0 + 3, 6, 'k'); }
      else for (let y = 5 + ly; y <= 6 + ly; y++) for (let x = e0 + 1 + lx; x <= e0 + 2 + lx; x++) at(x, y, 'k');
    }
    if (p === 'talk' && f) { at(11, 9, 'M'); at(13, 9, 'M'); }
    // wings: flapped out level on the odd frame
    if (f && p !== 'lift') for (let y = 4; y <= 11; y++) for (let x = 0; x <= 7; x++) if (g[y][x] === 'W' || g[y][x] === 'V') both(x, y, '.');
    if (f && p !== 'lift') { for (let x = 1; x <= 6; x++) both(x, 8, x === 6 ? 'V' : 'W'); for (let x = 0; x <= 7; x++) both(x, 9, x === 0 || x >= 6 ? 'V' : 'W'); for (let x = 1; x <= 6; x++) both(x, 10, 'V'); }
    // pumping the dumbbell: the front legs go up
    if (p === 'lift') { for (const [x, y] of [[6, 12], [7, 12], [5, 13], [4, 14], [3, 15], [2, 16], [2, 17], [1, 18], [0, 19], [1, 19]]) both(x, y, '.'); for (const [x, y] of [[7, 11], [6, 10], [5, 9], [5, 8], [4, 7], [4, 6]]) both(x, y, 'l'); both(4, 5, 'k'); both(3, 5, 'k'); }
    // the bite: the proboscis swings out to the shoulder
    if (p === 'bite') { for (const y in QBODY) if (+y >= 10) at(12, +y, QBODY[y]); for (const [x, y] of [[13, 10], [14, 11], [15, 12], [16, 13], [17, 13], [18, 13]]) at(x, y, 'n'); at(19, 13, 'N'); }
    // well fed: a wider middle (Round 9: 4 centre columns at full fat — the 25 px Москит must gain ≥ 12 %; the antennae stay apart)
    if (fz) { const n = Math.round(fz * 4); g.forEach((r, y) => { const c = r[12], fill = y <= 2 ? '.' : y === 9 ? 'n' : 'nN'.includes(c) ? (QBODY[y] || 'b') : c; r.splice(13, 0, ...Array(n >> 1).fill(fill)); r.splice(12, 0, ...Array(n - (n >> 1)).fill(fill)); }); } // the nose stays in the middle
    const w = g[0].length, h = g.length, cv = PX.canvas(w, h), x = cv.getContext('2d');
    g.forEach((r, y) => r.forEach((c, i) => { if (QC[c]) { x.fillStyle = QC[c]; x.fillRect(i, y, 1, 1); } }));
    const m = Math.floor(w / 2), e = { cv, w, h, ox: m, oy: h - 1, key, head: [m, 1], mouth: [m, 9], sting: [m, 13], fly: 1, small: 1 };
    cache.set(key, e); while (cache.size > MAXC) cache.delete(cache.keys().next().value); return e;
  }
  function mosq(o = {}) {
    const p = o.pose || 'idle', f = o.f ? 1 : 0;
    if (!(o.k > 1)) return mosqPx(o, p, f, fatQ(o));
    const fz = fatQ(o), key = 'mosq|' + p + '|' + f + '|' + (o.look ? o.look.join(',') : '') + '|' + fz, wx = 3 * fz, lgx = 2 * fz, kb = 1 + 0.7 * fz;
    return get(key, 48, 50, 24, 49, (a) => {
      const br = a.mat('mosqFur', '#8f5b30', 1), hd = a.mat('mosqHead', '#9e6a3a', 1), or = a.mat('mosqChest', '#ec7a2a', 1), bk = a.mat('mosqBlack', '#1f1c22'), wg = a.mat('mosqWing', '#efe2c0'), wh = a.mat('mosqEye', '#f7f3ea'), pr = a.mat('mosqNose', '#f2dcaa');
      // wings (flap frames)
      if (!f) { a.tube([[19 - wx, 22, 1.3], [12 - wx, 14, 4.4], [6.5 - wx, 8.5, 2.2]], K.EAR, wg); a.tube([[29 + wx, 22, 1.3], [36 + wx, 14, 4.4], [41.5 + wx, 8.5, 2.2]], K.EAR, wg); }
      else { a.tube([[19 - wx, 23, 1.3], [11 - wx, 21, 4.4], [4.5 - wx, 21.5, 2.2]], K.EAR, wg); a.tube([[29 + wx, 23, 1.3], [37 + wx, 21, 4.4], [43.5 + wx, 21.5, 2.2]], K.EAR, wg); }
      // legs: black ropes with knots
      const legs = p === 'lift' ? [[[19, 25], [12, 21], [10, 16]], [[19, 27], [11, 29], [9, 35]], [[20, 29], [15, 35], [14, 41]]] : [[[19, 25], [12, 27], [9, 33]], [[19, 27], [13, 32], [12, 39]], [[20, 29], [17, 36], [17, 43]]];
      for (const L of legs) for (const sd of [1, -1]) { const P = L.map(([x, y]) => [sd > 0 ? x - lgx : 48 - x + lgx, y, 0.6]); a.tube(P, K.LEG, bk); const e = P[P.length - 1]; a.ell(e[0], e[1] + 0.5, 1.1, 1.1, K.FOOT, bk); }
      a.tube([[24, 28, 4.7 * kb], [24.4, 35, 4.3 * kb], [25, 41, 2.6 * (1 + 0.6 * fz)], [25.6, 45, 1.2 * (1 + 0.4 * fz)]], K.BODY, br);
      a.ell(24, 24, 5.8 + 2 * fz, 4.8 + 0.6 * fz, K.BELLY, or, { sp: { n: 16, a: 0.5, seed: 9 } });
      a.tube([[21, 8, 1.4], [17.5, 3.5, 1.4], [15.5, 1.6, 1.2]], K.ACC, bk); a.tube([[27, 8, 1.4], [30.5, 3.5, 1.4], [32.5, 1.6, 1.2]], K.ACC, bk);
      a.ell(24, 14, 7.6, 6.8, K.HEAD, hd);
      a.ell(20, 12.5, 3.8, 4.2, K.FACE, wh); a.ell(28.2, 12.3, 3.6, 4, K.FACE, wh);
      const tip = p === 'bite' ? [[24, 17.5, 1.9], [28, 23, 1.4], [34, 29, 0.8]] : [[24, 17.5, 2], [24, 31, 1.6], [24, 46, 1.15]]; // Round 9 #8: a long nose
      a.tube(tip, K.NOSE, pr);
    }, (d) => {
      const lx = o.look ? o.look[0] : 0, ly = o.look ? o.look[1] : 0, FM = bit(K.FACE);
      if (p === 'happy') { arc(d, 20, 13, 2.6, 1, '#1a1012', FM); arc(d, 28.2, 13, 2.5, 1, '#1a1012', FM); }
      else { for (const [x, y] of [[20 + lx, 13 + ly], [28 + lx, 13 + ly]]) { d.pxk(x - 1, y, '#141016', FM); d.pxk(x, y, '#141016', FM); d.pxk(x - 1, y + 1, '#141016', FM); d.pxk(x, y + 1, '#141016', FM); d.pxk(x - 1, y - 1, '#141016', FM); d.pxk(x, y - 1, '#2a2430', FM); } d.pxk(19 + lx, 12 + ly, '#ffffff', FM); }
      // abdomen rings
      const rw = Math.round(3 * fz), vw = Math.round(wx); for (const yy of [31, 34, 37, 40]) for (let x = 20 - rw; x <= 29 + rw; x++) d.pxk(x, yy + ((x === 20 - rw || x === 29 + rw) ? -1 : 0), '#5e3818', 1 << K.BODY);
      // wing veins
      const WG = 1 << K.EAR; if (!f) { line(d, 18 - vw, 20, 9 - vw, 11, '#cbb88e', WG); line(d, 30 + vw, 20, 39 + vw, 11, '#cbb88e', WG); } else { line(d, 18 - vw, 22, 7 - vw, 21, '#cbb88e', WG); line(d, 30 + vw, 22, 41 + vw, 21, '#cbb88e', WG); }
      // proboscis seam
      if (p !== 'bite') { for (let yy = 18; yy <= 46; yy++) d.pxk(24, yy, '#f2dcaa', 1 << K.NOSE); for (let yy = 19; yy < 39; yy += 2) d.pxk(25, yy, '#c8a474', 1 << K.NOSE); } // the lit ridge of the long nose
      if (p === 'talk' && f) { d.pxk(22, 18, '#5a2a1a', bit(K.HEAD)); d.pxk(26, 18, '#5a2a1a', bit(K.HEAD)); }
    }, { head: [24, 2], mouth: [24, 18], fly: 1 }, fz ? 4 : 0);
  }

  // ================= Жучок (IMG_7806/7807/7808): a beige fluffy keychain bug the size of Абибян's paw =================
  // big head with the two googly eyes in black rims (+ lashes) on top, an embroidered mouth, three stitched rolls getting smaller downwards,
  // two brown felt leaf wings behind, black cord arms with knots, cord legs with round black feet, the chain loop on top of the head.
  // o: {pose: idle|talk|happy|brush|walk|fly|hang, f, look, fat, k}; k = re-rasterized size (the card portrait), never canvas-scaled
  // in the room (k 1) he is a hand-placed pixel map — at ~18 px the shaded rasterizer turns him to mush; the card portrait (k 3) is rasterized
  // Round 8: two columns thinner (17 px, was 19), the same height.
  // Round 9 #4: ≈15 % smaller again — a 13×16 map (was 17×18), mostly narrower: the same googly eyes, a shorter body, small wings
  const ZM = ['..k.k.g.k.k..', '..kkkg.gkkk..', '.kwwwkGkwwwk.', '.kwkwkokwkwk.', '.kwwwkFkwwwk.', '.okkkFhFkkko.', '.oFFFFFFFFFo.', '.oFFmFmFmFFo.',
    '..offfffffo..', 'kkofffffffokk', 'kBodddddddoBk', '.BBofffffoBB.', '..BBodddoBB..', '..Bb.odo.bB..', '....k...k....', '...kkk.kkk...'];
  const ZC = { o: '#7a5430', F: '#e4be86', f: '#d8ae74', d: '#b48450', w: '#f8f6f0', k: '#18161a', g: '#d8b040', G: '#a88028', B: '#9a6430', b: '#6e4420', m: '#6a3a20', h: '#f0d4a4', M: '#3a1810' };
  function zhukPx(o, p, f, fz) {
    const key = 'zhukpx|' + p + '|' + f + '|' + (o.look ? o.look.join(',') : '') + '|' + (o.eyes || '') + '|' + fz;
    const hit = cache.get(key); if (hit) return hit;
    const g = ZM.map((r) => [...r]), at = (x, y, c) => { if (g[y] && x >= 0 && x < g[y].length) g[y][x] = c; }, MX = (x) => 12 - x;
    // eyes: the pupil follows the look; happy = ^ ^; blink = a closed line
    const lx = o.look ? Math.sign(o.look[0]) : 0, ly = o.look && o.look[1] < 0 ? -1 : 0;
    for (const e0 of [2, 8]) {
      for (let y = 2; y <= 4; y++) for (let x = e0; x < e0 + 3; x++) at(x, y, 'w');
      if (p === 'happy') { at(e0 + 1, 2, 'k'); at(e0, 3, 'k'); at(e0 + 2, 3, 'k'); }
      else if (o.eyes === 'closed') { for (let x = e0; x < e0 + 3; x++) at(x, 3, 'k'); }
      else at(e0 + 1 + lx, 3 + ly, 'k');
    }
    // mouth: stitched; open while talking; a smile when happy
    if (p === 'talk' && f) { for (let x = 5; x <= 7; x++) at(x, 7, 'M'); at(6, 8, 'M'); }
    else if (p === 'happy') { at(4, 6, 'm'); at(8, 6, 'm'); at(4, 7, 'F'); at(8, 7, 'F'); for (let x = 5; x <= 7; x++) at(x, 7, 'm'); }
    // arms: out (idle) / up (happy, brushing in turns, fluttering)
    const armUp = (sd) => p === 'happy' || (p === 'brush' && (sd < 0) === !f) || (p === 'fly' && f);
    for (const sd of [-1, 1]) if (armUp(sd)) {
      const X = (x) => (sd < 0 ? x : MX(x)); at(X(0), 9, '.'); at(X(0), 10, '.');
      for (const [x, y] of [[1, 9], [0, 8], [0, 7], [0, 6], [0, 5]]) at(X(x), y, 'k');
    }
    // wings flutter: raised a little on the odd frame
    if (p === 'fly' && f) for (const sd of [-1, 1]) { const X = (x) => (sd < 0 ? x : MX(x)); for (const [x, y] of [[1, 11], [2, 12], [3, 12], [2, 13]]) at(X(x), y, '.'); for (const [x, y] of [[0, 8], [1, 8], [0, 7]]) at(X(x), y, 'B'); }
    // walking: one foot up
    if (p === 'walk') { const sd = f ? 1 : -1, X = (x) => (sd < 0 ? x : MX(x)); for (const x of [3, 4, 5]) { at(X(x), 15, '.'); at(X(x), 14, 'k'); } }
    // well fed: more fluff in the middle (the centre column doubled; the antennae and the feet move apart)
    if (fz) { const n = Math.round(fz * 2); g.forEach((r, y) => { for (let i = 0; i < n; i++) { if (y <= 1) r.splice(i % 2 ? 6 : 7, 0, '.'); else r.splice(6, 0, y >= 14 ? '.' : r[6]); } }); }
    const w = g[0].length, h = g.length, cv = PX.canvas(w, h), x = cv.getContext('2d');
    g.forEach((r, y) => r.forEach((c, i) => { if (ZC[c]) { x.fillStyle = ZC[c]; x.fillRect(i, y, 1, 1); } }));
    const e = { cv, w, h, ox: Math.floor(w / 2), oy: h - 1, key, head: [Math.floor(w / 2), 1], mouth: [Math.floor(w / 2), 7], small: 1 };
    cache.set(key, e); while (cache.size > MAXC) cache.delete(cache.keys().next().value); return e;
  }
  function zhuk(o = {}) {
    const p = o.pose || 'idle', f = o.f ? 1 : 0, k = o.k || 1, fz = fatQ(o);
    if (k === 1) return zhukPx(o, p, f, fz);
    const key = 'zhuk|' + p + '|' + f + '|' + (o.look ? o.look.join(',') : '') + '|' + fz + '|' + k, wx = 1.6 * fz;
    const W = 24, H = 24, X = 12;
    return get(key, W * k, H * k, X * k, H * k - 1, (a) => {
      const fur = a.matR('zhukFurR', ['#5a3a1e', '#8a6238', '#b48450', '#d8ae74', '#e4be86', '#f0d4a4'], 1), fur2 = a.matR('zhukRollR', ['#5a3a1e', '#7a5430', '#a87a48', '#cca06a', '#d8ae74', '#e6c290'], 1), felt = a.matR('zhukFeltR', ['#3a2010', '#5a3418', '#6e4420', '#8a5428', '#9a6430', '#b07840'], 4), bk = a.mat('zhukCord', '#1d1b20'), wh = a.mat('zhukEye', '#f7f4ec');
      const E = (x, y, rx, ry, kind, m, op) => a.ell(x * k, y * k, rx * k, ry * k, kind, m, op), T = (pts, kind, m) => a.tube(pts.map(([x, y, r]) => [x * k, y * k, r * k]), kind, m);
      // felt wings (spread when he flutters / is happy-flapping)
      const open = p === 'fly' || (p === 'happy' && f);
      for (const sd of [-1, 1]) { const mx = (x) => X + sd * (x - X); T(open ? [[mx(10.2), 11, 0.8], [mx(6.2 - wx), 8.6, 2.2], [mx(3.2 - wx), 8.8, 0.8]] : [[mx(10), 11.4, 0.8], [mx(7.4 - wx), 14.4, 2.3], [mx(7.8 - wx), 18.4, 0.8]], K.EAR, felt); }
      // cord legs + round feet
      const lg = p === 'walk' ? (f ? [-0.8, 0] : [0, -0.8]) : [0, 0];
      for (const [sd, i] of [[-1, 0], [1, 1]]) { const x0 = X + sd * 1.5, x1 = X + sd * 1.9, y1 = 20.3 + lg[i]; T([[x0, 17.6, 0.45], [x1, y1, 0.45]], K.LEG, bk); E(x1 + sd * 0.3, y1 + 1, 1.3, 0.9, K.FOOT, bk); }
      // cord arms with knotted ends
      for (const sd of [-1, 1]) {
        const up = p === 'happy' || (p === 'brush' && (sd < 0) === !f) || (p === 'fly' && f);
        const ax = X + sd * (7.6 + wx), ay = up ? 8.6 : p === 'hang' ? 14.2 : 12.8;
        T([[X + sd * (4.2 + wx), 12.2, 0.45], [ax, ay, 0.45]], K.ARM, bk); E(ax + sd * 0.2, ay, 0.9, 0.9, K.HAND, bk);
      }
      // three stitched rolls (lowest first: each one tucks under the one above), then the big head
      E(X, 16.7, 3.1 + wx * 0.6, 1.7, K.BODY, fur2); E(X, 14.6, 4 + wx * 0.8, 2, K.BODY, fur2); E(X, 12.3, 4.6 + wx, 2.2, K.BELLY, fur2);
      E(X, 7.7, 5.4 + wx * 0.7, 4.8, K.HEAD, fur);
      // the googly eyes stick up over the head: black rims, white
      for (const sd of [-1, 1]) { E(X + sd * 2.5, 4.3, 2.4, 2.3, K.ACC, bk, { edge: 0 }); E(X + sd * 2.5, 4.3, 1.5, 1.45, K.FACE, wh, { edge: 0 }); }
    }, (d) => {
      const B = '#141216', px = (x, y, c, m) => { for (let v = 0; v < k; v++) for (let u = 0; u < k; u++) m ? d.pxk(x * k + u, y * k + v, c, m) : d.px(x * k + u, y * k + v, c); };
      const FM = bit(K.FACE), lx = o.look ? Math.max(-1, Math.min(1, o.look[0])) : 0, ly = o.look ? Math.max(-1, Math.min(0, o.look[1])) : 0;
      // pupils (or happy ^ ^ arcs); lashes on top of each rim
      for (const sd of [-1, 1]) {
        const cx = X + sd * 2.5 - 0.5;
        if (p === 'happy') { px(Math.round(cx - 1), 4, B, FM); px(Math.round(cx), 3, B, FM); px(Math.round(cx + 1), 4, B, FM); }
        else { px(Math.round(cx + lx * 0.6), Math.round(4 + ly * 0.6), B, FM); if (k > 1) d.pxk(Math.round(cx + lx * 0.6) * k, Math.round(4 + ly * 0.6) * k, '#ffffff', FM); }
        for (const q of [-1, 0, 1]) px(Math.round(cx + q * 1.2), q ? 1 : 0, B);
      }
      // the embroidered mouth (stitches), open while he talks
      const HM = bit(K.HEAD);
      if (p === 'talk' && f) { px(X - 1, 9, '#5a2a1a', HM); px(X, 9, '#5a2a1a', HM); px(X - 1, 10, '#3a1810', HM); px(X, 10, '#3a1810', HM); }
      else if (p === 'happy') { px(X - 2, 9, '#6a4024', HM); px(X - 1, 10, '#6a4024', HM); px(X, 10, '#6a4024', HM); px(X + 1, 9, '#6a4024', HM); }
      else { px(X - 2, 9, '#6a4024', HM); px(X, 9, '#6a4024', HM); px(X + 1, 9, '#7a5030', HM); }
      // stitches along the rolls
      const RM = bit(K.BODY, K.BELLY); for (const [y, w] of [[13.6, 4], [15.8, 3], [17.7, 2]]) for (let x = Math.round(X - w); x < Math.round(X + w); x += 2) px(x, Math.round(y), '#a87a48', RM);
      // the chain loop on top of the head
      if (p !== 'fly') { px(X - 1, 1, '#c8a040'); px(X, 1, '#e8c860'); px(X - 1, 2, '#a88030'); }
    }, { head: [X * k, 2 * k], mouth: [X * k, 9 * k], small: 1 }, fz ? 2 * k : 0);
  }

  // ================= bed pillows: carrot (shy) & pepper (confident) =================
  // sq: 0 rest, 1 squashed, 2 squeezed, -1 stretched; mood: idle|shy|hide|sleep|wink|proud
  function carrot(o = {}) {
    const sq = o.sq || 0, m = o.mood || 'idle', lean = o.lie ? 1 : 0, f = o.f ? 1 : 0, k = o.k || 1; // k: re-rasterized size (never canvas-scaled)
    const key = 'carrot|' + sq + '|' + m + '|' + lean + '|' + f + '|' + k;
    const H0 = 66, W = Math.ceil((lean ? 66 : 26) * k), H = Math.ceil((lean ? 30 : H0) * k);
    const ky = 1 - 0.07 * sq, kx = 1 + 0.06 * sq; // squash keeps volume-ish
    // standing: tip at the bottom; lying (hugged in bed): transposed, leaves left, tip right
    const T = lean ? (x, y) => [y - 0.5, x + 2] : (x, y) => [x, y];
    const BX = 13, BY = H0 - 1; const P = (x, y) => { const q = T(BX + (x - BX) * kx, BY - (BY - y) * ky); return [q[0] * k, q[1] * k]; };
    return get(key, W, H, Math.round((lean ? 24 : 13) * k), H - 1, (a) => {
      const og = a.mat('carrotOr', '#f08b3a'), lf = a.mat('carrotLeaf', '#62c871');
      const leafT = m === 'hide' ? [[[14, 22], [6, 26], [2, 34]], [[13, 21], [9, 28], [8, 37]], [[13, 21], [17, 28], [18, 36]], [[12, 22], [20, 26], [24, 32]]]
        : [[[11, 21], [5, 14], [1, 9]], [[12, 20], [9, 10], [8, 2]], [[14, 20], [16, 10], [18, 3]], [[15, 21], [21, 14], [25, 10]]];
      const wob = (m === 'shy' && f) ? 1 : 0;
      const leaves = () => leafT.forEach((L, i) => { const pts = L.map(([x, y], j) => { const q = P(x + (j ? wob * (i % 2 ? 1 : -1) : 0), y); return [q[0], q[1], (j === 0 ? 2.1 : j === 1 ? 1.8 : 1.4) * k]; }); a.tube(pts, K.EAR, lf); const e = pts[2], mid = pts[1]; a.ell(e[0] + (i < 2 ? -1 : 1) * k, e[1] + 1.5 * k, 1.2 * k, 1.2 * k, K.EAR, lf); a.ell(mid[0] + (i < 2 ? -1.6 : 1.6) * k, mid[1] - k, 1.1 * k, 1.1 * k, K.EAR, lf); });
      if (m !== 'hide') leaves();
      const pts = [[13, 25, 8.4], [13.2, 38, 7.6], [13.4, 50, 5.4], [13.6, 59, 2.6], [13.6, 63.5, 1]].map(([x, y, r]) => { const q = P(x, y); return [q[0], q[1], r * (lean ? 1 : kx) * k]; });
      a.tube(pts, K.BODY, og);
      if (m === 'hide') leaves();
    }, (d) => {
      const BD = 1 << K.BODY, E = '#1a0e0a', bs = Math.max(1, Math.round(k));
      const at = (x, y, c, s = bs) => { const q = P(x, y), x0 = Math.round(q[0] - (s - 1) / 2), y0 = Math.round(q[1] - (s - 1) / 2); for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) d.pxk(x0 + i, y0 + j, c, BD); };
      // soft vertical pile lines (velour): thin streaks along the body
      for (let y = 32; y < 60; y += 5) for (let u = 0; u < 2; u += 1 / k) { at(9, y + u, '#d8722a', 1); at(17, y + 2 + u, '#f6a056', 1); }
      if (m === 'hide') return;
      if (m === 'shy' || m === 'sleep') { for (const ex of [10, 16]) { at(ex - 1, 35, E); at(ex, 35.6, E); at(ex + 1, 35, E); } }
      else { for (const ex of [10, 16]) { at(ex, 34, E); at(ex, 35, E); if (k >= 1.5) at(ex - 0.2, 33.7, '#ffffff', 1); } if (k < 1.5) at(10, 33.6, '#5a3020'); }
      // smile
      if (m === 'shy') { at(12, 39.5, E); at(13, 40, E); at(14, 39.5, E); } else if (m !== 'sleep') { at(10, 38.4, E); at(11, 39.4, E); at(12, 39.8, E); at(13, 39.8, E); at(14, 39.8, E); at(15, 39.4, E); at(16, 38.4, E); }
      else { at(12, 39.2, E); at(13, 39.2, E); at(14, 39.2, E); }
      if (m === 'shy' || o.blush) { at(7.5, 37.5, '#f2687a'); at(8.5, 37.5, '#f58a96'); at(18, 37.5, '#f2687a'); at(19, 37.5, '#f58a96'); }
    }, { head: [13, 2] });
  }
  function pepper(o = {}) {
    const sq = o.sq || 0, m = o.mood || 'idle', f = o.f ? 1 : 0, k = o.k || 1, lean = o.lie ? 1 : 0;
    const key = 'pepper|' + sq + '|' + m + '|' + f + '|' + k + '|' + lean;
    const W = Math.ceil((lean ? 66 : 30) * k), H = Math.ceil((lean ? 30 : 66) * k), ky = 1 - 0.07 * sq, kx = 1 + 0.06 * sq, BX = 14, BY = 65;
    // lying on the bed (like the carrot): transposed — stem/face toward the headboard (left), tip curls down at the right
    const T = lean ? (x, y) => [y - 2, x + 1] : (x, y) => [x, y];
    const P = (x, y) => { const q = T(BX + (x - BX) * kx, BY - (BY - y) * ky); return [q[0] * k, q[1] * k]; };
    return get(key, W, H, Math.round((lean ? 24 : 14) * k), H - 1, (a) => {
      const rd = a.mat('pepperRed', '#d22a22'), gr = a.mat('pepperGreen', '#6fd08e'), st = a.mat('pepperStem', '#4fae62');
      const body = [[14, 22, 8.2], [13.6, 34, 8], [14.4, 46, 6.2], [17, 55, 3.6], [21.5, 61, 1.8], [24.5, 63, 1]].map(([x, y, r]) => { const q = P(x, y); return [q[0], q[1], r * kx * k]; });
      a.tube(body, K.BODY, rd);
      // calyx: five soft lobes + curly stem
      const c = P(14, 16.5), E2 = (dx, dy, rx, ry) => (lean ? [c[0] + dy * k, c[1] + dx * k, ry * k, rx * k] : [c[0] + dx * k, c[1] + dy * k, rx * k, ry * k]); // lobe offsets/radii follow the lying transpose
      [[-7, 1.5, 3.6, 2.6], [-3.6, -0.6, 3.4, 2.8], [0, -1.2, 3.4, 2.9], [3.6, -0.6, 3.4, 2.8], [7, 1.5, 3.6, 2.6]].forEach(([dx, dy, rx, ry]) => { const [x, y, ex, ey] = E2(dx, dy + 1.5, rx, ry); a.ell(x, y, ex, ey, K.HEAD, gr); });
      a.ellU([E2(0, 2.6, 8.4, 2.6)], K.HEAD, gr);
      a.tube([[14, 13, 1.7], [15, 8, 1.5], [18, 4.5, 1.3], [21, 5, 1.1]].map(([x, y, r]) => { const q = P(x, y); return [q[0], q[1], r * k]; }), K.ACC, st);
    }, (d) => {
      const BD = 1 << K.BODY, E = '#1a0808', bs = Math.max(1, Math.round(k));
      const at = (x, y, c, s = bs) => { const q = P(x, y), x0 = Math.round(q[0] - (s - 1) / 2), y0 = Math.round(q[1] - (s - 1) / 2); for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) d.pxk(x0 + i, y0 + j, c, BD); };
      // satin highlight streak along the body
      if (k < 1.5) for (let y = 26; y < 48; y += 3) at(9, y, '#f0645a'); else for (let y = 26; y < 48; y += 1 / k) { at(9, y, '#f0645a', 2); if (y > 29 && y < 44) at(9.8, y, '#f68a80', 1); }
      // eyes: small ovals; wink = closed right eye
      at(10, 30, E); at(10, 31, E); if (k < 1.5) at(10, 29.2, '#4a1010');
      if (m === 'wink') { at(16, 30.6, E); at(17, 30, E); at(15, 30, E); } else if (m === 'sleep') { at(9.4, 30.6, '#e04a40'); at(15, 30.6, E); at(16, 30.9, E); at(17, 30.6, E); } else { at(16, 30, E); at(16, 31, E); if (k < 1.5) at(16, 29.2, '#4a1010'); else at(15.8, 29.7, '#ffffff', 1); }
      if (k >= 1.5 && m !== 'sleep') at(9.8, 29.7, '#ffffff', 1);
      if (m === 'sleep') { at(9, 30.6, E); at(10, 30.9, E); at(11, 30.6, E); }
      // confident brows
      const by = m === 'proud' || m === 'wink' ? 26.6 : 27.4; at(9, by + 0.5, E); at(10, by, E); at(11, by, E); at(15, by, E); at(16, by, E); at(17, by - 0.6, E);
      // little "<" nose and a smirk + cheek lines (embroidered, like the real pillow)
      at(13, 32.5, E); at(12.4, 33.5, E); at(13, 34.4, E);
      if (m === 'sleep') { at(12, 37, E); at(13, 37, E); at(14, 37, E); }
      else { at(10, 36.4, E); at(11, 37.2, E); at(12, 37.6, E); at(13, 37.6, E); at(14, 37.4, E); at(15, 36.8, E); at(16, 36, E); at(17, 35.2, E); }
      at(7.6, 34.5, E); at(7.4, 35.8, E); at(19.6, 33.8, E); at(19.8, 35.2, E);
    }, { head: [14, 2] });
  }
  const BY = { pusya, monty, mosq, zhuk, carrot, pepper };
  function sprite(id, o) { return BY[id](o || {}); }
  // big portrait for cards (3x nearest-neighbour; integer scale keeps pixels crisp)
  const pcache = {};
  function portrait(id) {
    if (pcache[id]) return pcache[id];
    const big = id === 'zhuk' || id === 'mosq' ? 3 : 1, e = sprite(id, { pose: 'happy', k: big, big: 1 }), k = 3 / big, pad = 4 * big, c = PX.canvas((e.w + pad * 2) * k, (e.h + pad * 2) * k), x = c.getContext('2d');
    x.imageSmoothingEnabled = false; x.drawImage(e.cv, pad * k, pad * k, e.w * k, e.h * k); return (pcache[id] = c.toDataURL());
  }
  // alpha-mask hit test in sprite-local pixels, with a little finger padding
  function hit(e, lx, ly, pad = 0) {
    if (!e) return false; if (!e.mask) { const d = e.cv.getContext('2d').getImageData(0, 0, e.w, e.h).data, m = new Uint8Array(e.w * e.h); for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 0 ? 1 : 0; e.mask = m; }
    const x0 = Math.floor(lx), y0 = Math.floor(ly);
    for (let dy = -pad; dy <= pad; dy++) for (let dx = -pad; dx <= pad; dx++) { const x = x0 + dx, y = y0 + dy; if (x >= 0 && y >= 0 && x < e.w && y < e.h && e.mask[y * e.w + x]) return true; }
    return false;
  }
  return { sprite, portrait, hit, clear() { cache.clear(); } };
})();
