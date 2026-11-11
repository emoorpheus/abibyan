'use strict';
// ===== Ванная — drawn by hand from the user's photos (IMG_7789–7792) =====
// ceiling: the lower arc of the oval angel fresco; walls: beige "marble" tiles with a floral border; centre: shower cabin with dark
// tinted glass, chrome frame and a white tray (= Душ); left: heated towel rail, toilet with a wooden lid; right: the basin with a washing
// machine under it (Round 5), mirror between two sconces (= зеркало); floor: big beige tiles, the cat rug.
const BATH = (() => {
  const SP = MONKEY.sprite, K = MONKEY.K, IT = K.IT, ITC = K.ITC, R = ROOMS, RW = R.RW, RH = R.RH, FLOOR = R.FLOOR, GROUND = R.GROUND, fur = R.fur, hash = PX.hash;
  const CEIL = 27, CAB = [48, 34, 84, 200], HEAD = [90, 58], VAN = [136, 168, 44, 60], WASH = [136, 176, 44, 52], PORT = [158, 204], SINK = [135, 158], SCX = [133, 175], CATRUG = [127, 232, 50, 28], MIR = [140, 82, 36, 54], WC = [0, 192, 42, 50], RAIL = [6, 76, 22, 62], BORDER = 122;
  const S = {
    cabin: () => SP(CAB[2], CAB[3], (a) => { // shower cabin: chrome frame, dark smoky glass, inner panel with jets, white tray with a rounded apron
      const ch = a.mat('chrome', '#c2c8d0'), gl = a.mat('bGlass', '#2f3742', 3), gi = a.mat('bGlassIn', '#3c4654', 3), wh = a.mat('bTray', '#f4f4f2');
      a.box(0, 0, 84, 168, IT, gl, { flat: 0.55 });
      a.box(26, 8, 58, 166, IT, gi, { flat: 0.4 });                 // inner back panel
      a.rbox(37, 18, 47, 120, 2, IT, ch);                           // shower column with jets + controls
      a.box(0, 0, 84, 4, IT, ch); a.box(0, 0, 3, 170, IT, ch); a.box(81, 0, 84, 170, IT, ch); a.box(24, 0, 27, 168, IT, ch); a.box(57, 0, 60, 168, IT, ch);
      a.ell(42, 14, 9, 2.4, IT, ch);                                // rain head
      a.rbox(-2, 162, 86, 200, 7, IT, wh, { bulge: 0.35 });         // tray / apron
    }, (d) => {
      for (let k = 0; k < 6; k++) { d.px(42, 26 + k * 12, '#5a6472'); d.px(41, 26 + k * 12, '#eef2f6'); }
      d.px(40, 70, '#e8453c'); d.px(44, 70, '#3a8fd8'); d.hline(39, 45, 74, '#8a929c');
      for (const x0 of [6, 64]) for (let k = 0; k < 40; k++) { const y = 20 + k * 3; if (d.on(x0 + (k >> 2), y)) d.px(x0 + (k >> 2), y, '#4a5868'); }
      for (let x = 8; x < 18; x++) d.px(x, 30 + (x - 8), '#56657a');
      d.hline(4, 80, 166, '#ffffff'); d.hline(34, 50, 184, '#9aa6b4'); d.px(36, 183, '#9aa6b4'); d.px(48, 183, '#9aa6b4');   // "tino" logo line
    }),
    // Round 5 D: the vanity became a basin slab with a washing machine under it (user: «стиралка»)
    sink: () => SP(46, 18, (a) => { // the white basin slab + a tall chrome goose-neck faucet with a lever
      const ch = a.mat('chrome', '#c2c8d0');
      a.rbox(0, 11, 46, 18, 2, IT, a.mat('bBasin', '#ffffff'), { bulge: 0.3 });
      a.tube([[23, 13, 1.1], [23, 3, 1], [18, 3, 0.9], [18, 4.5, 0.8]], IT, ch); a.box(24, 5, 28, 7, IT, ch);
    }, (d) => { d.hline(8, 38, 12, '#e8eaee'); d.px(17, 5, '#6a7480'); }),
    washer: () => SP(WASH[2], WASH[3], (a) => { // white body, a control strip with a dial and a display, the chrome porthole, a grey plinth
      const wh = a.mat('bWash', '#f4f4f2'), ch = a.mat('chrome', '#c2c8d0');
      a.rbox(0, 0, 44, 48, 2, IT, wh, { flat: 0.7, bulge: 0.15 }); a.box(1, 46, 43, 52, IT, a.mat('bWashP', '#d4d4d0'));
      a.ell(22, 28, 13, 13, IT, ch, { flat: 0.4 }); a.ell(22, 28, 10, 10, IT, a.mat('bWGlass', '#6f9cc4', 3), { flat: 0.75 });
      a.ell(7, 5, 3, 3, IT, ch);
    }, (d) => {
      d.hline(1, 42, 10, '#d6d6d2'); d.px(7, 3, '#5a606a'); d.px(7, 4, '#5a606a');
      for (let y = 3; y <= 6; y++) d.hline(26, 37, y, '#24302c'); d.hline(27, 29, 4, '#3a6a4a'); d.hline(31, 32, 4, '#3a6a4a'); d.hline(34, 36, 5, '#3a6a4a');
      d.px(15, 5, '#3fb6ff'); d.px(18, 5, '#e8453c'); d.px(21, 5, '#7ac86a');
      for (const [x, y] of [[16, 21], [15, 22], [15, 23]]) d.px(x, y, '#dceaf6');
      d.hline(4, 9, 50, '#b0b0ac'); d.hline(34, 39, 50, '#b0b0ac');
    }),
    mirror: () => SP(MIR[2], MIR[3], (a) => { a.rbox(0, 0, 36, 54, 2, IT, a.mat('bMirF', '#d8d2c6')); a.box(2, 2, 34, 52, IT, a.mat('bMirG', '#bccad2', 3), { flat: 0.8 }); },
      (d) => { for (let k = 0; k < 12; k++) { d.px(6 + k, 30 - k, '#eef4f6'); d.px(10 + k, 40 - k, '#e2ecf0'); } for (let y = 14; y < 50; y++) { d.px(13, y, '#46505c'); d.px(23, y, '#46505c'); } d.hline(13, 23, 14, '#46505c'); }),
    sconce: () => SP(8, 16, (a) => { a.box(3, 0, 5, 16, IT, a.mat('chrome', '#c2c8d0')); a.rbox(0, 2, 8, 14, 2, IT, a.mat('bSc', '#f6ead0', 3)); }, (d) => { for (let y = 4; y < 13; y += 2) d.hline(1, 6, y, '#e0cfaa'); }),
    wc: () => SP(WC[2], WC[3], (a) => { // wall-hung toilet seen from the side: white bowl, dark wooden lid
      const wh = a.mat('bWc', '#f6f6f4'), wd = a.mat('bLid', '#6a3c1e', 2), wl = a.mat('bLidL', '#8a5430', 2);
      a.box(0, 8, 8, 40, IT, wh);
      a.ellU([[18, 18, 18, 9], [16, 26, 13, 12]], IT, wh);
      a.ell(20, 9, 20, 5.5, IT, wd); a.ell(20, 7.6, 18, 3.6, IT, wl);
    }, (d) => { d.hline(6, 34, 13, '#3a1c0c'); for (let x = 8; x < 32; x += 5) d.px(x, 7, '#a06a40'); }),
    rail: () => SP(RAIL[2], RAIL[3], (a) => { const ch = a.mat('chrome', '#c2c8d0'); a.box(0, 0, 3, 62, IT, ch); a.box(19, 0, 22, 62, IT, ch); for (let y = 6; y < 60; y += 9) a.box(2, y, 20, y + 2, IT, ch);
      a.rbox(4, 20, 16, 50, 2, IT, a.mat('bTowel', '#eadac4', 3), { bulge: 0.3 }); }, (d) => { for (let y = 24; y < 48; y += 3) d.hline(5, 14, y, '#d6c4aa'); }),
    // the cat-face bath rug (photo): bigger now and right in front of the sink (user)
    catrug: () => SP(CATRUG[2], CATRUG[3], (a) => { const g = a.mat('bCat', '#e8e6e2', 3); a.ell(25, 17, 24, 10.5, IT, g, { flat: 0.8 }); a.poly([[5, 12], [10, 0], [17, 8]], IT, g); a.poly([[33, 8], [40, 0], [45, 12]], IT, g); },
      (d) => { const E = '#3a3a40', W = '#b8b4ae', PK = '#f2b8c0';
        for (const x of [14, 31]) { d.px(x, 16, E); d.px(x + 1, 15, E); d.px(x + 2, 15, E); d.px(x + 3, 16, E); } // happy closed eyes
        d.px(24, 18, '#e8909a'); d.px(25, 18, '#e8909a'); d.px(22, 19, E); d.px(23, 20, E); d.px(24, 19, E); d.px(25, 19, E); d.px(26, 20, E); d.px(27, 19, E);
        for (const s of [-1, 1]) for (const [dx, dy] of [[13, 17], [14, 17], [15, 17], [13, 20], [14, 20], [15, 19]]) d.px(25 + s * dx - (s > 0 ? 1 : 0), dy, W);
        for (const [x, y] of [[10, 4], [10, 5], [11, 5], [39, 4], [39, 5], [38, 5]]) d.px(x, y, PK); for (const x of [12, 13, 36, 37]) d.px(x, 19, '#f4ccd0'); }),
    wcrug: () => SP(44, 16, (a) => { a.rbox(0, 0, 44, 16, 6, IT, a.mat('bRug', '#8f97a3', 3), { flat: 0.75 }); a.ell(22, 0, 9, 6, IT, a.mat('bRugCut', '#e9dfcc'), { flat: 1 }); }, null),
  };
  const spr = (k, ...a) => fur('bath_' + k + a.join('_'), () => S[k](...a));
  // ---------- painted parts ----------
  function ceiling(P) { // white ceiling with the whole oval angel fresco (golden sky, blue gaps, clouds, cherubs, red & blue robes) in a recessed white rim
    P.r(0, 0, RW, CEIL, '#efebe6');
    const cx = 90, cy = 13, rx = 78, ry = 11.5;
    for (let y = 0; y < CEIL; y++) for (let x = 0; x < RW; x++) { const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (q < 1) { const v = (y - cy + ry) / (2 * ry), n = hash(x >> 1, y >> 1, 5), blue = hash(x >> 3, y >> 2, 8) > 0.8;
        P.p(x, y, n > 0.86 ? '#f8ecd0' : blue ? (n > 0.5 ? '#8fa6c8' : '#7890b8') : v < 0.45 ? (n > 0.5 ? '#e9cc90' : '#dcb478') : (n > 0.5 ? '#d2a878' : '#c49870')); }
      else if (q < 1.14) P.p(x, y, '#ffffff'); else if (q < 1.26) P.p(x, y, '#d8d0c4'); }
    for (const [x, y, w] of [[34, 14, 9], [142, 11, 8], [88, 19, 12], [108, 6, 7]]) { P.ell(x, y, w, 2.6, '#f6eedc'); P.ell(x - w * 0.4, y - 1, w * 0.45, 2, '#fbf6ea'); }   // clouds
    P.ell(100, 15, 9, 3.2, '#b8342c'); P.ell(97, 14, 4, 2, '#d8584a'); P.ell(62, 16, 7, 2.6, '#3e5a9a'); P.ell(60, 15, 3, 1.5, '#5a78b8');          // robes
    P.ell(117, 10, 6, 2, '#eef0f2'); P.ell(121, 8, 3, 1.5, '#ffffff');                                                                             // a big wing
    for (const [x, y] of [[50, 10], [76, 8], [132, 15], [92, 11]]) { P.ell(x, y + 1, 3.4, 2.2, '#efbe9c'); P.circ(x - 2, y - 1, 1.8, '#f6d2b4'); P.p(x - 3, y - 2, '#c89a3a'); P.ell(x + 2, y - 2, 2, 1.2, '#ffffff'); }  // cherubs
    for (const x of [12, 168]) { P.r(x - 2, 21, 5, 2, '#fbfaf8'); P.p(x, 20, '#c8c0b4'); }
    R.cornice(P, CEIL);
  }
  function tiles(P) { // big beige "marble" tiles with soft veins + the floral border
    const y0 = CEIL + 7; P.r(0, y0, RW, FLOOR - y0, '#dccdb2');
    for (let y = y0; y < FLOOR; y++) for (let x = 0; x < RW; x++) { const n = hash(x >> 2, y >> 2, 21), v = Math.abs(Math.sin((x + y * 0.6) / 9 + hash(x >> 4, y >> 4, 22) * 6)); if (v < 0.05) P.p(x, y, '#c9b896'); else if (n > 0.9) P.p(x, y, '#e6d9c2'); }
    for (let y = y0 + 22; y < FLOOR; y += 30) P.r(0, y, RW, 1, '#c4b294'); for (let x = 0; x < RW; x += 30) P.r(x, y0, 1, FLOOR - y0, '#c4b294');
    P.r(0, BORDER, RW, 7, '#6a4632'); P.r(0, BORDER, RW, 1, '#8a6448'); P.r(0, BORDER + 6, RW, 1, '#4a2e20');
    for (let x = 2; x < RW; x += 6) { P.p(x, BORDER + 3, '#e8a0a8'); P.p(x + 1, BORDER + 2, '#f2c6b0'); P.p(x + 1, BORDER + 4, '#c97a7a'); P.p(x + 3, BORDER + 3, '#9ab07a'); }
  }
  function floor(ctx, P, H = RH) { // Round 25: H — further down (FILL)
    P.r(0, FLOOR, RW, H - FLOOR, '#d9c6a4');
    for (let y = FLOOR; y < H; y++) for (let x = 0; x < RW; x++) { const n = hash(x >> 1, y >> 1, 33); if (n > 0.93) P.p(x, y, '#e8d8bc'); else if (n < 0.04) P.p(x, y, '#c8b28c'); }
    for (let y = FLOOR + 22; y < H; y += 30) P.r(0, y, RW, 1, '#bba684'); for (let x = 10; x < RW; x += 40) P.r(x, FLOOR, 1, H - FLOOR, '#bba684');
    for (let j = 0; j < 14; j++) { ctx.globalAlpha = 0.2 * (1 - j / 14); P.r(0, FLOOR + j, RW, 1, '#2a1620'); } ctx.globalAlpha = 1;
  }
  // ---------- builders ----------
  function bg(ctx, P, H) {
    const it = H.items;
    ceiling(P); tiles(P); floor(ctx, P);
    R.wallAt(ctx, spr('rail'), RAIL[0], RAIL[1], 2);
    R.wallAt(ctx, spr('mirror'), MIR[0], MIR[1], 2); R.wallAt(ctx, spr('sconce'), MIR[0] - 7, MIR[1] + 8, 1); R.wallAt(ctx, spr('sconce'), MIR[0] + MIR[2] - 1, MIR[1] + 8, 1);
    P.shadow(CAB[0] + CAB[2] / 2, FLOOR + 6, 44, 4, 0.28); R.wallAt(ctx, spr('cabin'), CAB[0], CAB[1], 2, FLOOR + 6);
    if (it.duck) R.sprAt(ctx, fur('duck', () => UI_DUCK()), CAB[0] + 8, CAB[1] + 150);
    if (it.washer) P.shadow(158, FLOOR + 2, 22, 3, 0.28); else siphon(P); // Round 9 #2: the washer is bought — till then the sink's chrome trap shows under the counter
    R.wallAt(ctx, spr('sink'), SINK[0], SINK[1], 3);   // the washer itself is live (it shakes): dyn
    for (const [x, c] of [[140, '#f29ab0'], [145, '#7cc87a'], [171, '#59a8ef']]) { P.r(x, 163, 3, 6, c); P.p(x + 1, 162, '#ffffff'); }
    P.shadow(20, WC[1] + 46, 18, 3, 0.25); R.wallAt(ctx, spr('wc'), WC[0], WC[1], 2);
    R.sprAt(ctx, spr('catrug'), CATRUG[0], CATRUG[1]);
    if (it.bathmat) R.sprAt(ctx, spr('wcrug'), 0, GROUND - 22);
  }
  function siphon(P) {
    const C = '#b8bec6', D = '#8a929c', L = '#e6eaf0';
    P.r(152, 174, 2, 13, C); P.p(152, 175, L); P.r(152, 186, 7, 2, C); P.r(152, 187, 7, 1, D); P.r(157, 180, 2, 7, C); P.r(157, 180, 8, 2, C); P.r(158, 181, 7, 1, D);
    P.r(165, 178, 2, 6, '#d0d4da'); P.p(165, 178, L); P.r(167, 179, 1, 4, '#9aa2ac'); // the flange on the wall
  }
  // the duck shop thumbnail lives in ui.js; draw our own little one here (same look)
  function UI_DUCK() { return SP(18, 15, (a) => { const dk = a.mat('duck', '#ffd23a'); a.ell(10, 10, 7, 4.4, IT, dk); a.ell(6, 5, 4, 3.8, IT, dk); a.ell(1.8, 6.2, 2, 1.2, IT, a.mat('beak', '#ff8a2a')); }, (d) => { d.px(5, 4, '#1a1a1a'); }); }
  function front(ctx, P, H) { if (H.items.fern) R.sprAt(ctx, fur('fern', R.FUR.fern), 146, FLOOR + 12); }
  // ---------- live parts (Round 5 D: GAGS.view() → st.g) ----------
  const WCOL = [['#c94f6b', '#8f2f48'], ['#3fb6ff', '#1f7fc1'], ['#ffd23a', '#c89a12'], ['#e9e2d6', '#c4baa8']];
  function washer(ctx, P, w, t) { // the drum through the porthole: water level, tumbling clothes, suds; a blur on the spin; the door swings open to load/unload
    const dx = w ? w.dx : 0, cx = PORT[0] + dx, cy = PORT[1], run = w && w.ph !== 'done';
    R.sprAt(ctx, spr('washer'), WASH[0] + dx, WASH[1]);
    if (run) { const n = w.ph === 'load' ? 1 : w.ph === 'fill' ? 2 : w.ph === 'wash' ? 3 : 4; for (let i = 0; i < n; i++) P.r(cx + 4 + i * 3, 179, 2, 2, '#7af09a'); if (Math.floor(t * 2) % 2) P.p(cx - 8, 181, '#ffb040'); }
    if (!w) return;
    const door = w.door || 0;
    if (door > 0.05) { // open: the dark drum + gasket, the door seen edge-on to the left
      P.circ(cx, cy, 11, '#9aa0a8'); P.circ(cx, cy, 10, '#343a44'); P.circ(cx, cy, 8, '#3e4652');
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; P.p(Math.round(cx + Math.cos(a) * 6), Math.round(cy + Math.sin(a) * 6), '#59616e'); }
      const lie = w.ph === 'load' ? Math.min(4, Math.floor(w.k * 6)) : 4; for (let i = 0; i < lie; i++) { const c = WCOL[i]; P.ell(cx - 5 + i * 3, cy + 6 - (i % 2), 2.4, 1.6, c[0]); P.p(cx - 5 + i * 3, cy + 5 - (i % 2), c[1]); }
      const rx = Math.max(2, 13 * (1 - 0.8 * door)), ox = Math.round(cx - 13 - door * 4 + (13 - rx));
      P.ell(ox, cy, rx, 13, '#c2c8d0'); P.ell(ox, cy, Math.max(1, rx - 2.5), 10, '#8fb4d8'); P.r(Math.round(ox - rx), cy - 1, 1, 3, '#8a929c');
      return;
    }
    const wl = cy + 9 - Math.round(18 * (w.water || 0)), spin = w.ph === 'spin' && w.k > 0.25;
    for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) { if (x * x + y * y > 92) continue; const Y = cy + y; P.p(cx + x, Y, Y === wl ? '#a8d4f4' : Y > wl ? ((x + y + Math.floor(t * 8)) % 7 ? '#3f78b0' : '#4f88c0') : '#56769c'); }
    if (spin) { // a colourful blur ring
      for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2 + w.a, r = 4 + (i % 3) * 1.5; P.p(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), WCOL[i % 4][i % 2]); }
      ctx.globalAlpha = 0.35; P.circ(cx, cy, 3, '#e8eef6'); ctx.globalAlpha = 1;
    } else if (w.ph !== 'load') {
      for (let i = 0; i < 4; i++) { const a = w.a + i * Math.PI / 2, r = 4.5 + (i % 2) * 1.5, c = WCOL[i], x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r * 0.9 + (w.ph === 'fill' ? 3 : 0)); P.ell(x, y, 2.4, 1.7, c[0]); P.p(x - 1, y - 1, c[1]); }
      if (w.ph === 'wash') for (let i = 0; i < 6; i++) { const x = cx - 7 + i * 3 + Math.round(Math.sin(t * 5 + i) * 1), y = wl - 1 - (i % 2); if ((x - cx) ** 2 + (y - cy) ** 2 < 80) { P.p(x, y, '#ffffff'); P.p(x + 1, y, '#e8f4ff'); } }
    }
    P.p(cx - 6, cy - 5, '#e6f2ff'); P.p(cx - 5, cy - 6, '#e6f2ff'); P.p(cx - 4, cy - 7, '#ffffff'); // glass shine
  }
  function railHeat(ctx, P, k, t) { // the heated towel rail warms up: a copper glow on the chrome + a shimmer above
    const [x0, y0] = RAIL; ctx.globalAlpha = 0.5 * k; const c = '#ff6a2a';
    P.r(x0, y0, 3, 62, c); P.r(x0 + 19, y0, 3, 62, c);
    for (let y = 6; y < 60; y += 9) { if (y > 16 && y < 50) P.r(x0 + 16, y0 + y, 4, 2, c); else P.r(x0 + 2, y0 + y, 18, 2, c); }
    ctx.globalAlpha = 0.3 * k; for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) { const y = y0 - 2 - j * 2 - ((t * 10) % 2), x = x0 + 3 + i * 5 + Math.round(Math.sin(t * 4 + j * 0.9 + i) * 1.2); P.p(x, Math.round(y), '#fff4e8'); }
    ctx.globalAlpha = 1;
  }
  function dyn(ctx, P, H, t, st) {
    const g = (st && st.g) || {};
    if (g.bsc !== false) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.06; for (const x of [MIR[0] - 3, MIR[0] + MIR[2] + 3]) for (const r of [10, 6]) P.circ(x, MIR[1] + 16, r, '#fff1c0'); ctx.restore(); }
    else for (const x of SCX) { P.r(x + 1, MIR[1] + 11, 6, 11, '#cfc4ae'); for (let y = MIR[1] + 12; y < MIR[1] + 21; y += 2) P.r(x + 1, y, 6, 1, '#beb29a'); } // the shades go dull when off
    if (H.items.washer) washer(ctx, P, g.wash, t);
    if (g.tap > 0) { // the faucet runs
      ctx.globalAlpha = Math.min(1, g.tap * 1.5); for (let y = 164; y < 170; y++) { P.p(152, y, (y + Math.floor(t * 20)) % 3 ? '#9fd8ff' : '#e6f6ff'); P.p(153, y, '#c8ecff'); }
      const sp = Math.floor(t * 12) % 2; P.p(150 - sp, 168, '#bfe6ff'); P.p(155 + sp, 168, '#bfe6ff'); P.r(148, 169, 10, 1, '#d8f0ff'); ctx.globalAlpha = 1;
    }
    if (g.rail > 0) railHeat(ctx, P, g.rail, t);
    if (g.cat) for (const x of [141, 158]) { P.r(x, 246, 4, 3, '#8ac85a'); P.r(x + 1, 246, 2, 3, '#1e1e22'); P.p(x, 246, '#d8f4b8'); } // the cat rug opens its eyes
  }
  function spots(it) {
    return { catrug: CATRUG.slice(), shower: [CAB[0], CAB[1], CAB[2], 150], head: HEAD.slice(), mirror: MIR.slice(), sink: VAN.slice(), toilet: WC.slice(), duck: [CAB[0] + 8, CAB[1] + 150, 18, 15],
      washer: it.washer ? WASH.slice() : null, porthole: it.washer ? PORT.slice() : null, faucet: [148, 158, 16, 16], rail: RAIL.slice(), aid: [8, 44, 20, 18], fern: it.fern ? [146, 240, 34, 50] : null, fresco: [0, 0, 180, 27], bathmat: it.bathmat ? [0, 248, 44, 16] : null,
      sconceL: [SCX[0], MIR[1] + 8, 8, 16], sconceR: [SCX[1], MIR[1] + 8, 8, 16],
      kit: [8, 44], mosq: [30, 168, 254], visit: [150, 278], visitFly: [146, 276, 70], party: { pusya: [150, 252], monty: [52, 282], zhuk: [130, 290] } };
  }
  R.register('bath', { bg, floor, dyn, front, spots, thumbs: { washer: () => spr('washer') } });
  return { spots };
})();
