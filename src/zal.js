'use strict';
// ===== Зал — drawn by hand from the user's photos (IMG_7776 / 7777 / 7783). Room id 'zal'. =====
// left: carved walnut bed, cream quilted headboard (+ giant pillows from FRIENDS); centre: crystal chandelier (= light switch),
// white window with tulle, dark-purple drapes, radiator; right: dark vertical wood panelling, carved fireplace, TV (old CRT → 5 real models).
// Round 6 C: a tap on a drape draws both curtains to the middle, down to the floor (GAGS shuts an open window first); the bed and a wall TV
// stay in front. Fully shut they are part of the cached background (no radiator, night-light or sunbeam behind them); moving, dyn draws them.
const ZAL = (() => {
  const SP = MONKEY.sprite, K = MONKEY.K, IT = K.IT, ITC = K.ITC, R = ROOMS;
  const FLOOR = R.FLOOR, GROUND = R.GROUND, RW = R.RW, hash = PX.hash, bay = PX.bayer, fur = R.fur, curve = (p, n, rf) => ART.curve(p, n, rf);
  // ---- layout (canvas px) — art, hotspots and tests all read these ----
  const CEIL = 27, PANEL = 126, GLASS = [86, 62, 28, 62], FIRE = [128, 176], FBOX = [141, 197, 26, 25], CH = [78, 28];
  const HEAD = [-6, 120], BED = [-6, 168], SLEEP = [44, 236];
  const TV = {
    // the 5 real models (user's list, cheap → expensive): width grows with the diagonal; brand name on the bottom bezel (user: no inches on the TVs, names only)
    hiper: { at: [136, 147], w: 36, sh: 19, foot: 'feet', label: [['HIPER', '#eceef2']] },
    tcl: { at: [135, 146], w: 38, sh: 20, foot: 'feet', label: [['TCL', '#ec3c46']] },
    digma: { at: [132, 141], w: 44, sh: 23, foot: 'stand', label: [['DIGMA', '#eceef2']] },
    dexp: { at: [129, 112], w: 48, sh: 26, wall: 1, label: [['DEXP', '#eceef2']] },
    lg: { at: [126, 104], w: 54, sh: 29, wall: 1, label: [['LG', '#e0283c']] },
  };
  const CHIN = 7; // bottom bezel height (5-px letters + 1 px above/below)
  for (const k in TV) { const v = TV[k]; if (!v.label) continue; v.scr = [v.at[0] + 1, v.at[1] + 1, v.w - 2, v.sh]; v.lab = [v.at[0] + 1, v.at[1] + 1 + v.sh, v.w - 2, CHIN]; }
  // tiny 5-px pixel font for the TV labels
  const GL = { H: ['x.x', 'x.x', 'xxx', 'x.x', 'x.x'], I: ['x', 'x', 'x', 'x', 'x'], P: ['xx.', 'x.x', 'xx.', 'x..', 'x..'], E: ['xxx', 'x..', 'xx.', 'x..', 'xxx'], R: ['xx.', 'x.x', 'xx.', 'x.x', 'x.x'],
    T: ['xxx', '.x.', '.x.', '.x.', '.x.'], C: ['.xx', 'x..', 'x..', 'x..', '.xx'], L: ['x..', 'x..', 'x..', 'x..', 'xxx'], D: ['xx.', 'x.x', 'x.x', 'x.x', 'xx.'], G: ['.xx', 'x..', 'x.x', 'x.x', '.xx'],
    M: ['x...x', 'xx.xx', 'x.x.x', 'x...x', 'x...x'], A: ['.x.', 'x.x', 'xxx', 'x.x', 'x.x'], X: ['x.x', 'x.x', '.x.', 'x.x', 'x.x'],
    0: ['xxx', 'x.x', 'x.x', 'x.x', 'xxx'], 3: ['xxx', '..x', '.xx', '..x', 'xxx'], 4: ['x.x', 'x.x', 'xxx', '..x', '..x'], 5: ['xxx', 'x..', 'xxx', '..x', 'xxx'], 6: ['xxx', 'x..', 'xxx', 'x.x', 'xxx'],
    '"': ['x.x', 'x.x', '...', '...', '...'], ' ': ['.'] };
  const textW = (parts) => { const ch = parts.map((p) => p[0]).join(''); return [...ch].reduce((n, c) => n + GL[c][0].length, 0) + ch.length - 1; };
  function label(d, parts, cx, y) { let x = Math.round(cx - textW(parts) / 2); for (const [str, col] of parts) for (const c of str) { const g = GL[c]; g.forEach((row, j) => [...row].forEach((q, i) => { if (q === 'x') d.px(x + i, y + j, col); })); x += g[0].length + 1; } }
  const tvLvl = (it) => (TV[it.tv] ? it.tv : null); // null = no TV yet (the start)
  const isWall = (lvl) => !lvl || !!TV[lvl].wall; // no TV or a wall TV: the mantel is free for the figurines
  R.WIN.zal = GLASS;
  const WAL = '#5a321d', WAL_L = '#764628';

  // ---------- sprites ----------
  const S = {
    head: () => SP(70, 88, (a) => { // headboard seen from the front: carved walnut frame + cream quilted insert
      const wd = a.mat('zWal', WAL, 2), wl = a.mat('zWalL', WAL_L, 2), cr = a.mat('zCream', '#ede1c6', 3);
      a.box(0, 10, 7, 88, IT, wd); a.box(63, 10, 70, 88, IT, wd);
      a.ell(3.5, 9, 4.4, 3.8, IT, wl); a.ell(66.5, 9, 4.4, 3.8, IT, wl);
      a.box(5, 9, 65, 20, IT, wd); a.ell(35, 10, 21, 6.5, IT, wd, { clip: (x, y) => y <= 10 });
      a.box(7, 18, 63, 22, IT, wl);
      a.rbox(8, 22, 62, 86, 3, IT, cr, { flat: 0.74, bulge: 0.2 });
    }, (d) => {
      for (let x = 9; x < 62; x += 3) { d.px(x, 20, '#3a2013'); d.px(x + 1, 19, '#93603a'); }          // carved dentil band
      for (const s of [-1, 1]) for (let k = 0; k < 9; k++) d.px(35 + s * (3 + k * 1.6), 9 - Math.round(Math.sin(k / 8 * Math.PI) * 2.4), '#93603a'); // crest scrolls
      d.px(35, 6, '#93603a'); d.px(34, 7, '#3a2013'); d.px(36, 7, '#3a2013');
      // diamond tufting: seams from button to button + light puffs in between
      const B = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 6; c++) { const x = 12 + c * 10 + (r % 2) * 5, y = 26 + r * 8; if (x < 60) B.push([x, y]); }
      for (const [x, y] of B) for (const [dx, dy] of [[5, 8], [-5, 8]]) for (let i = 1; i < 8; i++) { const px = Math.round(x + dx * i / 8), py = Math.round(y + dy * i / 8); if (px > 8 && px < 61 && py < 85) d.px(px, py, '#d6c4a0'); }
      for (const [x, y] of B) { if (y < 84) { d.px(x, y, '#a68e68'); d.px(x, y - 1, '#c9b38c'); d.px(x + 2, y + 3, '#f8efdc'); d.px(x + 3, y + 3, '#f8efdc'); } }
    }),
    bed: () => SP(104, 70, (a) => { // side view: dark sheet, beige knit blanket, carved rail, sleigh footboard
      const wd = a.mat('zWal', WAL, 2), wl = a.mat('zWalL', WAL_L, 2), sl = a.mat('zSheet', '#464d5c'), bl = a.mat('zKnit', '#c7b293', 3);
      a.box(6, 56, 12, 70, IT, wd); a.box(80, 56, 86, 70, IT, wd);
      a.rbox(2, 32, 90, 48, 3, IT, sl);
      a.rbox(5, 28, 86, 46, 6, IT, bl);
      a.rbox(0, 44, 90, 58, 2, IT, wd);
      a.poly([[24, 44], [72, 44], [69, 53], [60, 50], [50, 55], [40, 51], [29, 54]], IT, bl);
      a.rbox(84, 12, 100, 66, 4, IT, wd); a.tube([[82, 15, 2.8], [91, 10, 3.2], [101, 13, 2.8]], IT, wl);
      a.box(86, 60, 92, 70, IT, wd); a.box(94, 60, 100, 70, IT, wd);
    }, (d) => {
      d.hline(2, 88, 48, '#8a5634'); d.hline(2, 88, 54, '#3a2013');
      for (let y = 31; y < 54; y += 3) for (let x = 8 + ((y / 3) % 2) * 2; x < 82; x += 4) if (d.on(x, y) && (y < 45 || (x > 25 && x < 71))) { d.pxk(x, y, '#b09a7a', 1 << IT); d.pxk(x + 1, y - 1, '#d6c4a6', 1 << IT); }
      for (let y = 22; y < 58; y += 7) { d.px(88, y, '#3a2013'); d.px(89, y + 1, '#8a5634'); }
    }),
    fire: () => SP(52, 54, (a) => { // carved fireplace (wider than tall, as in the photo): mantel, frieze + rosette, fluted pilasters, black firebox
      const D = { vb: -0.22 }, wd = a.mat('zFp', '#55301b', 2), wl = a.mat('zFpL', '#6b3d22', 2), mt = a.mat('zFpM', '#3c3434'), bk = a.mat('zFpBox', '#161011');
      a.box(1, 47, 51, 54, IT, wd, D);
      a.box(3, 7, 12, 48, IT, wd, D); a.box(40, 7, 49, 48, IT, wd, D);
      a.box(10, 7, 42, 19, IT, wd, D);
      a.box(11, 18, 41, 48, IT, mt); a.rbox(13, 21, 39, 46, 1, IT, bk, { flat: 0.22, bulge: 0 }); // rbox: box() ignores flat → half-lit firebox
      a.ell(26, 12.5, 6, 3.6, IT, wl, D); a.ell(7.5, 11, 4.4, 3.4, IT, wl, D); a.ell(44.5, 11, 4.4, 3.4, IT, wl, D);
      a.box(-1, 2, 53, 8, IT, wl, D); a.box(0, 0, 52, 3, IT, wl, D);
    }, (d) => {
      for (const x of [6, 9, 42, 45]) for (let y = 17; y < 45; y++) if (y % 9) d.px(x, y, '#3e2112');                  // fluting
      for (let k = 0; k < 10; k++) { const u = k / 9, y = 16 - Math.round(Math.sin(u * Math.PI) * 2.5); d.px(14 + k, y, '#8a5634'); d.px(38 - k, y, '#8a5634'); } // frieze scrolls
      for (const [x, y] of [[26, 10], [23, 13], [29, 13], [26, 15]]) d.px(x, y, '#3e2112'); d.px(26, 12, '#a06a40');      // rosette petals
      d.hline(0, 52, 3, '#8a5634'); d.hline(2, 50, 48, '#6b3d22');
      for (let x = 14; x < 39; x += 2) d.px(x, 20, '#5a5050');                                                             // grate edge
    }),
    // flat TVs: black body, dark screen, a 7-px bottom bezel with the model; feet / pedestal / wall bracket
    flat: (k) => { const v = TV[k], W = v.w, B = 1 + v.sh + CHIN, H = B + (v.foot === 'stand' ? 4 : v.foot ? 2 : 0);
      return SP(W, H, (a) => {
        const bd = a.mat('zTvB', '#1b1b21'), ft = a.mat('zTvF', '#2a2a32');
        if (v.foot === 'feet') { a.box(4, B - 1, 9, H, IT, ft); a.box(W - 9, B - 1, W - 4, H, IT, ft); }
        if (v.foot === 'stand') { a.box(W / 2 - 3, B - 1, W / 2 + 3, H - 1, IT, ft); a.rbox(W / 2 - 11, H - 2, W / 2 + 11, H, 1, IT, ft); }
        a.rbox(0, 0, W, B, 1, IT, bd); a.box(1, 1, W - 1, 1 + v.sh, IT, a.mat('zScr', '#2a2e36'), { flat: 0.3 });
      }, (d) => { d.hline(1, W - 2, B - 1, '#2c2c34'); label(d, v.label, W / 2, 1 + v.sh + 1); if (v.wall) d.hline(2, W - 3, 0, '#3a3a44'); });
    },
    chand: (on) => SP(44, 50, (a) => { // crystal chandelier, five white shades
      const br = a.mat('zBrass', '#b08c48'), cr = a.mat('zCrys', '#cfe2ec'), sh = a.mat(on ? 'zShadeOn' : 'zShadeOff', on ? '#fbf6ea' : '#d6cfc4', 3), rose = a.mat('zRose', '#f1ece4');
      a.ell(22, 2.5, 8, 2.6, IT, rose);
      a.tube([[22, 4, 0.8], [22, 25, 0.8]], IT, br); a.ell(22, 12, 1.6, 2, IT, cr); a.ell(22, 18, 1.6, 2, IT, cr);
      const SH = [[14, 14], [30, 14], [5, 19], [39, 19], [22, 21]];
      const shade = ([cx, y]) => { a.ell(cx, y + 9, 2.2, 1.3, IT, br); a.poly([[cx - 3, y], [cx + 3, y], [cx + 4.6, y + 8.5], [cx - 4.6, y + 8.5]], ITC, sh); };
      for (const [cx, y] of SH.slice(0, 2)) { a.tube(curve([[22, 28], [(22 + cx) / 2, y + 17], [cx, y + 10]], 8, () => 0.6), IT, br); shade([cx, y]); a.ell((22 + cx) / 2, y + 19, 0.9, 1.6, IT, cr); }
      a.ell(22, 28, 5.2, 3.4, IT, br);
      for (const [cx, y] of SH.slice(2, 4)) { a.tube(curve([[22, 28], [(22 + cx) / 2, y + 16], [cx, y + 10]], 8, () => 0.65), IT, br); shade([cx, y]); a.ell((22 + cx) / 2 + (cx < 22 ? -1 : 1), y + 17, 0.9, 1.7, IT, cr); }
      a.ell(22, 33, 3.6, 3, IT, cr); a.ell(22, 38.5, 2.6, 2.8, IT, cr); a.ell(22, 43.5, 1.7, 2.3, IT, cr); a.ell(22, 47.4, 1, 1.4, IT, cr);
      shade(SH[4]);
    }, (d) => {
      for (const [x, y] of [[21, 31], [23, 37], [21, 42], [22, 47], [21, 11], [21, 17], [10, 35], [34, 35], [17, 32], [27, 32]]) if (d.on(x, y)) d.px(x, y, '#ffffff');
      for (const [cx, y] of [[14, 14], [30, 14], [5, 19], [39, 19], [22, 21]]) { d.pxk(cx - 1, y + 3, on ? '#efe6d2' : '#c4bcae', 1 << ITC); d.pxk(cx + 2, y + 5, on ? '#efe6d2' : '#c4bcae', 1 << ITC); if (on) d.pxk(cx - 2, y + 1, '#ffffff', 1 << ITC); }
    }),
    // Round 7 #7: Sony BRAVIA Theater Bar 8 — a sleek charcoal bar with a fabric grille, subtle silver logo and an LED at the right end (dyn)
    bar: () => SP(SB_W, SB_H, (a) => { const bd = a.mat('zSbB', '#222228'); a.rbox(0, 0, SB_W, SB_H, 2, IT, bd, { flat: 0.55 }); }, (d) => {
      const W = SB_W, c = Math.floor(W / 2); d.hline(2, W - 3, 0, '#4e4e58'); d.hline(2, W - 3, 6, '#101014');
      for (let y = 2; y <= 4; y++) for (let x = 3 + (y % 2); x < W - 3; x += 2) if (x < c - 4 || x > c + 3) d.px(x, y, '#34343c');
      d.px(c - 2, 3, '#9a9aa4'); d.px(c - 1, 3, '#e0e0e8'); d.px(c, 3, '#ffffff'); d.px(c + 1, 3, '#e0e0e8'); d.px(c + 2, 3, '#9a9aa4');
    }),
    // Round 7 #6: Nintendo Switch 2 in its black dock (the red / blue Joy-Con stick out on both sides) and an upright PS5 Pro (white side panel,
    // the black core edge-on at the front, three black stripes across the middle, a round stand)
    sw2: () => SP(28, 14, (a) => {
      a.rbox(0, 0, 5, 10, 1.8, IT, a.mat('zJcR', '#e8403a'), { flat: 0.7 }); a.rbox(23, 0, 28, 10, 1.8, IT, a.mat('zJcB', '#2f8ff0'), { flat: 0.7 });
      a.box(4, 0, 24, 8, IT, a.mat('zSwC', '#2e2e36')); a.rbox(5, 2.6, 23, 14, 1.6, IT, a.mat('zSwD', '#1e1e24'), { flat: 0.6 });
    }, (d) => {
      d.hline(5, 22, 0, '#4a4a56'); d.hline(6, 21, 1, '#101014'); d.hline(6, 21, 13, '#0e0e12'); d.hline(7, 20, 3, '#34343e');
      d.px(2, 3, '#3a1210'); d.px(2, 2, '#ff7a6a'); d.px(3, 6, '#8a2420'); d.px(1, 7, '#8a2420'); // the left stick, buttons
      d.px(25, 6, '#0c2a50'); d.px(25, 5, '#8cc8ff'); d.px(25, 2, '#0c2a50'); d.px(26, 3, '#0c2a50'); d.px(24, 3, '#0c2a50'); // the right stick, ABXY
      for (const x of [12, 15]) for (let y = 7; y <= 9; y++) d.px(x, y, '#4e4e5a'); d.px(13, 7, '#4e4e5a'); d.px(14, 9, '#4e4e5a'); // the logo on the dock
    }),
    ps5: () => SP(12, 24, (a) => {
      a.box(0, 2, 4, 21, IT, a.mat('zPsK', '#22222a')); a.poly([[3, 1.4], [10.4, 0], [12, 1], [12, 21.6], [3, 20.6]], IT, a.mat('zPsW', '#f4f5f8'), { flat: 0.8 });
      a.ell(6, 22.4, 4.6, 1.6, IT, a.mat('zPsS', '#2a2a32'));
    }, (d) => {
      for (const y of [10, 12, 14]) d.hline(4, 11, y, '#26262e'); d.px(1, 4, '#7a7a88'); d.px(1, 6, '#4a4a56'); d.px(2, 18, '#4a4a56'); // stripes, power / eject, USB
      for (let y = 2; y <= 20; y += 6) d.px(3, y, '#c8ccd8');
    }),
    radiator: () => SP(30, 30, (a) => { const w = a.mat('zRad', '#eeeeea'); for (let k = 0; k < 7; k++) a.rbox(1 + k * 4, 1, 4.6 + k * 4, 27, 1.6, IT, w); a.box(0, 3, 30, 6, IT, w); a.box(0, 22, 30, 25, IT, w); a.box(2, 27, 4, 30, IT, w); a.box(26, 27, 28, 30, IT, w); }, null),
  };
  const sprTV = (k) => (TV[k] && TV[k].label ? fur('zal_tv_' + k, () => S.flat(k)) : spr(k));
  const spr = (k, ...a) => fur('zal_' + k + a.join('_'), () => S[k](...a));
  S.bag = (open) => bagSpr(open);

  // Round 7 #7: the soundbar hangs on the panel wall centred on the TV — above a TV standing on the mantel, under a wall TV (above the figurines)
  const SB_W = 36, SB_H = 7;
  function sbAt(lvl) { const tv = TV[lvl]; if (!tv) return null; const h = sprTV(lvl).height, x = Math.round(tv.at[0] + tv.w / 2 - SB_W / 2); return tv.wall ? [x, tv.at[1] + h + 3] : [x, tv.at[1] - 3 - SB_H]; }
  function soundbar(ctx, it, lvl) { const q = it.soundbar && sbAt(lvl); if (q) R.wallAt(ctx, spr('bar'), q[0], q[1], 1); }
  // Round 7 #6: the consoles on the floor by the fireplace, right of the guitar; a black cable from behind the TV down the pilaster to them
  const SW2 = [139, 221], PS5 = [167, 211], CAB_X = 177, CAB_Y1 = 232;
  const hasCon = (it, k) => it[k] === 1 && !!tvLvl(it);
  function tvBottom(lvl) { const tv = TV[lvl]; return tv.at[1] + sprTV(lvl).height; }
  function consoles(ctx, P, it, lvl) {
    if (!lvl || (!hasCon(it, 'switch2') && !hasCon(it, 'ps5'))) return;
    const tv = TV[lvl], y0 = tvBottom(lvl), x0 = Math.min(CAB_X, tv.at[0] + sprTV(lvl).width - 4);
    for (let i = 0; i <= CAB_X - x0; i++) P.p(x0 + i, y0 + Math.min(i, 3), '#141418'); // out from behind the TV, then down
    for (let y = y0 + Math.min(CAB_X - x0, 3); y < CAB_Y1; y++) { P.p(CAB_X, y, '#141418'); if (y % 7 === 3) P.p(CAB_X - 1, y, '#3a3a44'); }
    if (hasCon(it, 'switch2')) { P.shadow(SW2[0] + 14, SW2[1] + 14, 15, 2.2, 0.3); R.wallAt(ctx, spr('sw2'), SW2[0], SW2[1], 1); }
    if (hasCon(it, 'ps5')) { P.shadow(PS5[0] + 6, PS5[1] + 24, 8, 2, 0.3); R.wallAt(ctx, spr('ps5'), PS5[0], PS5[1], 1); }
  }
  function conLights(ctx, P, it, st) { // the dock's green LED and the PS5's blue light strip while a console is on
    const on = st.tvGame && st.tvOn !== false;
    if (hasCon(it, 'switch2')) P.p(SW2[0] + 21, SW2[1] + 11, on && st.con === 'switch2' ? '#5aff7a' : '#2a3a2e');
    if (hasCon(it, 'ps5') && on && st.con === 'ps5') { ctx.globalAlpha = 0.85; P.r(PS5[0] + 3, PS5[1] + 2, 1, 18, '#7cc8ff'); ctx.globalAlpha = 0.25; P.r(PS5[0] + 2, PS5[1] + 1, 3, 20, '#4fa8ff'); ctx.globalAlpha = 1; }
  }
  function conMenu(P, [x, y, w, h], con, t) { // the console's home screen on the TV: a row of game tiles, the selection hops along
    const sel = Math.floor(t * 1.2) % 3;
    if (con === 'ps5') { P.r(x, y, w, h, '#0c1c44'); P.r(x, y + h - 4, w, 4, '#081230'); for (let i = 0; i < 3; i++) { const tx = x + 3 + i * 9, ty = y + 5, on = i === sel; P.r(tx - (on ? 1 : 0), ty - (on ? 1 : 0), 7 + (on ? 2 : 0), 7 + (on ? 2 : 0), on ? '#ffffff' : '#3a5a9a'); P.r(tx, ty, 7, 7, ['#ffd23a', '#e8403a', '#3fdc7a'][i]); } P.r(x + 3, y + h - 7, 12, 1, '#c8d8ff'); }
    else { P.r(x, y, w, h, '#ececf0'); P.r(x, y, w, 3, '#d4d4dc'); for (let i = 0; i < 3; i++) { const tx = x + 3 + i * 9, ty = y + 5, on = i === sel; if (on) P.r(tx - 1, ty - 1, 9, 9, '#2fc8e8'); P.r(tx, ty, 7, 7, ['#e8403a', '#ffd23a', '#7c5ab8'][i]); } for (let i = 0; i < 4; i++) P.r(x + 4 + i * 6, y + h - 5, 3, 3, '#a8a8b4'); }
  }
  // ---------- Round 7 #8: the guitar in a black gig bag on an A-frame stand (IMG_7810), on the floor in front of the drape, by the fireplace ----------
  // grey piping round the edge, a big front pocket with a curved piped top, a zip up the neck, a logo patch on the head. Open: the front
  // panel swings off to the right, the plush lining with the guitar-shaped hollow shows. The guitar is rasterised from its shape at any angle.
  // Round 8 #1: the bag, the stand and the guitar are 1.25× bigger (the shapes are re-rasterised at that size, not stretched)
  const GK = 1.25, GW = 25, GH = 70, GTR = [114, 236 - GH], GO = [GTR[0] + 10 * GK, GTR[1] + Math.round(39 * GK)], GS = (v) => Math.round(v * GK); // bag top-left (the stand's feet on the floor at y 236); the guitar's body centre in it
  const bagIn = (x, y) => { const u = (x + 0.5) / GK - 10, v = (y + 0.5) / GK; if (v < 0.3 || v > 51.6) return false; // bag space (model units of the 20×56 bag), pixel centres
    return (v < 8.6 && Math.abs(u) < (v < 1.6 ? 3 : 4.2)) || (v < 27 && Math.abs(u) < 3.3) || (u / 6.8) ** 2 + ((v - 30) / 7.5) ** 2 < 1 || (u / 9.4) ** 2 + ((v - 42.5) / 9) ** 2 < 1; };
  const gIn = (u, v) => v >= 0 && v <= 50 && ((v < 7.4 && Math.abs(u) < (v < 1 ? 2 : 2.6)) || (v < 26 && Math.abs(u) < 1.6) || (u / 6) ** 2 + ((v - 29.5) / 6.3) ** 2 < 1 || (u / 8) ** 2 + ((v - 41) / 8.3) ** 2 < 1);
  const gPeg = (u, v) => v > 1 && v < 7 && Math.abs(u) >= 2.6 && Math.abs(u) < 3.9 && Math.floor(v) % 2 === 1;
  const pocketY = (x) => Math.round(GK * (37 + 1.6 * Math.sin(Math.PI * (x / GK - 1) / 18))); // the pocket's piped top: a shallow smile across the lower body
  function bagSpr(open) {
    const W = open ? GS(30) : GW, cv = PX.canvas(W, GH), P = Painter(cv.getContext('2d')), rows = [];
    for (let y = 0; y < GH; y++) { let l = -1, r = -1; for (let x = 0; x < GW; x++) if (bagIn(x, y)) { if (l < 0) l = x; r = x; } rows.push([l, r]); }
    const inB = (x, y) => y >= 0 && y < GH && x >= 0 && x < GW && bagIn(x, y);
    const flap = (x, y) => { const q = rows[y]; return !!open && !!q && q[1] >= 0 && x > q[1] && x <= q[1] + Math.max(1, Math.round((q[1] - q[0] + 1) * 0.4)); };
    const isOut = (f, x, y) => f(x, y) && (!f(x - 1, y) || !f(x + 1, y) || !f(x, y - 1) || !f(x, y + 1));
    const isPipe = (f, x, y) => f(x, y) && !isOut(f, x, y) && (isOut(f, x - 1, y) || isOut(f, x + 1, y) || isOut(f, x, y - 1) || isOut(f, x, y + 1));
    for (let y = 0; y < GH; y++) for (let x = 0; x < W; x++) {
      if (inB(x, y)) {
        const [l, r] = rows[y], u = (x - (l + r) / 2) / ((r - l) / 2 + 0.5), lit = isOut(inB, x - 1, y) || isOut(inB, x, y - 1);
        if (isOut(inB, x, y)) { P.p(x, y, '#0b0c0f'); continue; }
        if (isPipe(inB, x, y)) { P.p(x, y, open ? ((x + y) % 2 ? '#9a9ea6' : '#5c6068') : lit ? '#c9ccd2' : u > 0.3 || isOut(inB, x, y + 1) ? '#80848c' : '#a3a7af'); continue; } // open: the zip teeth show
        if (open) { const gu = (x + 0.5) / GK - 10, gv = y / GK, e = 1 / GK; const hol = gIn(gu, gv), rim = hol && !(gIn(gu - e, gv) && gIn(gu + e, gv) && gIn(gu, gv - e) && gIn(gu, gv + e)); P.p(x, y, rim ? '#3a3e4a' : hash(x, y, 3) < 0.3 ? (hol ? '#5e6576' : '#6c7384') : hol ? '#4e5463' : '#5c6272'); continue; } // the plush lining, the guitar's hollow in it
        const pk = y >= GS(33) && Math.abs(u) < 0.97 ? pocketY(x) : 99;
        P.p(x, y, y === pk ? (u < -0.2 ? '#c9ccd2' : '#a3a7af') : y === pk + 1 ? '#2b2e35' : u < -0.45 ? '#2b2e36' : u > 0.55 ? '#1a1b20' : '#22242b');
      } else if (flap(x, y)) { // the front panel, lining out, squeezed into perspective
        P.p(x, y, isOut(flap, x, y) || (x === rows[y][1] + 1) ? '#0b0c0f' : isPipe(flap, x, y) ? '#a3a7af' : hash(x, y, 5) < 0.3 ? '#626979' : '#545a69');
      }
    }
    if (!open) { // the zip up the neck side, the pocket's zip pull, the logo patch on the head
      for (let y = GS(3); y < GS(30); y++) { const r = rows[y][1]; if (r > 0) P.p(r - 2, y, '#111216'); }
      P.p(rows[GS(4)][1] - 2, GS(4), '#c9ccd2'); P.p(rows[GS(4) + 1][1] - 2, GS(4) + 1, '#7a7e86');
      P.p(GS(15), pocketY(GS(15)) + 1, '#c9ccd2'); P.p(GS(15), pocketY(GS(15)) + 2, '#6a6e76');
      P.r(10, 4, 5, 2, '#3e414a'); P.p(11, 4, '#d8dade'); P.p(12, 5, '#8e929a'); P.p(13, 4, '#8e929a');
    }
    // the A-frame stand: rubber-coated cradle arms in front of the bag's bottom, two legs, rubber feet on the floor
    for (const [x, d] of [[6, -1], [18, 1]]) { P.r(x, 59, 1, 5, '#121215'); P.p(x, 59, '#3c3d44'); P.r(x + (d > 0 ? 0 : 1), 64, 1, 3, '#121215'); P.r(x + d, 66, 1, 3, '#121215'); P.r(x + (d > 0 ? 0 : -3), GH - 1, 4, 1, '#26272c'); }
    P.r(7, 63, 11, 1, '#1c1d21'); P.p(8, 63, '#3c3d44');
    return cv;
  }
  const gtrC = {};
  function guitarSpr(deg, sc = 1) { // the wooden acoustic guitar (128×128, its body centre at 64,64), turned deg clockwise from upright (head up at 0), sc× its size in the bag (×1.25 built in)
    const k = Math.round(deg / 5) * 5, q = Math.round(sc * 20) / 20 * GK, key = k + '_' + q; if (gtrC[key]) return gtrC[key];
    const N = 128, O = 64, a = k * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), cv = PX.canvas(N, N), P = Painter(cv.getContext('2d'));
    const loc = (x, y) => { const dx = x + 0.5 - O, dy = y + 0.5 - O; return [(dx * ca + dy * sa) / q, 38 + (-dx * sa + dy * ca) / q]; };
    const m = new Uint8Array(N * N); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const [u, v] = loc(x, y); m[y * N + x] = gIn(u, v) ? 1 : gPeg(u, v) ? 2 : 0; }
    const M = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? 0 : m[y * N + x]), out = (x, y) => M(x, y) && (!M(x - 1, y) || !M(x + 1, y) || !M(x, y - 1) || !M(x, y + 1));
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const q = M(x, y); if (!q) continue; const [u, v] = loc(x, y), au = Math.abs(u);
      if (q === 2) { P.p(x, y, out(x, y) ? '#55555e' : '#dcdce2'); continue; } // tuning pegs
      let c;
      if (out(x, y)) c = v > 23 ? '#5a3014' : '#24140a';
      else if (v > 24.5 && (out(x - 1, y) || out(x + 1, y) || out(x, y - 1) || out(x, y + 1))) c = '#f2dcae'; // cream binding round the top
      else if (v < 7.4) c = '#5a3418';                                   // headstock
      else if (v < 8.3) c = '#efe4cc';                                   // nut
      else if (v < 24.5) c = au < 0.55 ? '#e6dcc6' : Math.floor(v) % 3 === 0 ? '#b8aa90' : '#3a2414'; // fretboard: frets, the strings down the middle
      else { const d = Math.hypot(u, v - 30.5);
        c = d < 2.4 ? '#1c0f08' : d < 3.3 ? '#8a5428' : Math.hypot(u - 3.2, v - 34.4) < 1.7 ? '#4a2a14' : v > 41.4 && v < 43.3 && au < 3.4 ? (v < 42.1 && au < 2.4 ? '#efe4cc' : '#3c2210')
          : au < 0.5 && v < 41.4 ? '#efe3c8' : u < -3.6 ? '#e8a858' : u > 4.4 ? '#c07a34' : '#dc9c4c'; }
      P.p(x, y, c);
    }
    return (gtrC[key] = cv);
  }
  const guitarHit = (x, y) => { const lx = Math.floor(x) - GTR[0], ly = Math.floor(y) - GTR[1]; if (ly < 0 || ly >= GH) return false; if (ly >= GS(47)) return lx >= 3 && lx < 22; for (let d = -2; d <= 2; d++) if (bagIn(lx + d, ly)) return true; return false; };
  // ---------- Round 8 #2: the round crochet mandala rug (IMG_7815 / 7816), seen from above and squashed by the view ----------
  // from the middle: a 16-ray star in a corded ring, a lace band of spokes and eyelets, a ring, 12 raised teardrop leaves with veins
  // (eyelets between them), a ring, the outer lace with holes and 16 points round the edge. Generated per pixel in the circle's own polar
  // coordinates; 7 yarn tones + a fuzz dither so it reads as thick cord.
  const RUG = [42, 250, 96, 37], RUG_PAL = ['#3b2418', '#4e3020', '#623e29', '#774e35', '#8c6043', '#a37656', '#bb8e6b']; // Round 9 #3: cocoa-brown yarn (was lavender)
  let rugC = null;
  function rugSpr(pal = RUG_PAL) {
    if (rugC && rugC.pal === pal) return rugC.cv;
    const W = RUG[2], H = RUG[3] - 1, cv = PX.canvas(W, H + 1), x2 = cv.getContext('2d'), TAU = Math.PI * 2;
    const fr = (a) => a - Math.floor(a), tri = (a) => 1 - Math.abs(2 * fr(a) - 1); // 1 in the middle of a period, 0 at its ends
    const polar = (x, y) => { const u = (x + 0.5 - W / 2) / (W / 2 - 0.5), v = (y + 0.5 - H / 2) / (H / 2 - 0.5), th = Math.atan2(v, u) + TAU; return { u, v, r: Math.hypot(u, v), th, edge: 0.9 + 0.1 * Math.pow(tri(th / TAU * 16), 2.2) }; };
    for (let y = 0; y <= H; y++) for (let x = 0; x < W; x++) {
      const { u, v, r, th, edge } = polar(x, y);
      if (r > edge) { const q = polar(x, y - 1); if (q.v > 0 && q.r <= q.edge) { x2.fillStyle = pal[0]; x2.globalAlpha = 0.85; x2.fillRect(x, y, 1, 1); x2.globalAlpha = 1; } continue; } // the cord's thickness on the near side
      let t, zone;
      if (r > edge - 0.05) { t = 0; zone = 0; } // the cord round the edge
      else if (r > 0.8) { zone = 1; const hole = Math.abs(fr(th / TAU * 32) - 0.5) < 0.13 && Math.abs(r - 0.86) < 0.035; t = hole ? 0 : tri(th / TAU * 16) > 0.75 && r > 0.85 ? 4 : 3; }
      else if (r > 0.75) { zone = 2; t = 5; } // a raised ring
      else if (r > 0.47) { zone = 3; // 12 teardrop leaves pointing outwards
        const sec = TAU / 12, ph = th - Math.round(th / sec) * sec, sN = (r - 0.47) / 0.28, wv = 0.21 * Math.pow(Math.sin(Math.PI * Math.min(1, sN * 1.12)), 0.7) * (1 - 0.3 * sN), d = Math.abs(ph) * r;
        if (d < wv) t = d > wv - 0.05 ? 1 : d < 0.014 && sN > 0.12 && sN < 0.8 ? 3 : 5 + (sN < 0.45 ? 1 : 0); // outline, vein, the lit cord
        else { const ph2 = th + sec / 2 - Math.round((th + sec / 2) / sec) * sec; t = Math.abs(ph2) * r < 0.03 && Math.abs(sN - 0.5) < 0.16 ? 0 : 2; } } // eyelets between the leaves
      else if (r > 0.42) { zone = 4; t = 5; }
      else if (r > 0.24) { zone = 5; const sp = tri(th / TAU * 24); t = Math.abs(r - 0.33) < 0.035 && sp > 0.7 ? 0 : sp < 0.35 ? 2 : 3; } // spokes and a ring of eyelets
      else if (r > 0.2) { zone = 6; t = 5; } // the cord round the star
      else { zone = 7; const ray = tri(th / TAU * 16), rr = 0.2 * (0.3 + 0.7 * ray); t = r < 0.05 ? 6 : r < rr ? (ray > 0.7 ? 6 : 5) : 1; } // the 16-ray star
      // the yarn: a little fuzz between neighbouring tones (never across the pattern), a touch lighter on the far side
      const h = hash(x, y, 77); if (t > 0 && t < 6 && zone !== 0 && h < 0.07) t += (h < 0.035 ? -1 : 1); if (v < -0.5 && t > 0 && t < 6 && h > 0.9) t++;
      x2.fillStyle = pal[Math.max(0, Math.min(6, t))]; x2.fillRect(x, y, 1, 1);
    }
    rugC = { pal, cv }; return cv;
  }
  // ---------- painted (flat) parts ----------
  function ceiling(P) {
    P.r(0, 0, RW, CEIL, '#e9e3dc'); R.dither(P, 0, 0, RW, 10, '#ddd6cf', '#e9e3dc', 0.5);
    const M = [['#f2ede6', 1], ['#ffffff', 2], ['#ddd4c8', 1], ['#f8f4ee', 2], ['#cfc4b6', 1], ['#efe8de', 2], ['#c5b29a', 1]];
    let y = CEIL; for (const [c, h] of M) { P.r(0, y, RW, h, c); y += h; }
    P.ctx.globalAlpha = 0.12; P.r(0, y, RW, 6, '#3a2030'); P.ctx.globalAlpha = 1;
  }
  function wall(P) {
    const y0 = CEIL + 10; P.r(0, y0, PANEL, FLOOR - y0, '#ecd5b6');
    for (let k = 0; k < 220; k++) { const x = Math.floor(hash(k, 1, 31) * PANEL), y = y0 + Math.floor(hash(k, 2, 31) * (FLOOR - y0)); P.p(x, y, k % 3 ? '#e5cba9' : '#f2dec2'); }
    P.r(0, FLOOR - 7, PANEL, 7, WAL); P.r(0, FLOOR - 7, PANEL, 1, WAL_L); P.r(0, FLOOR - 2, PANEL, 2, '#3a2013');
  }
  function panels(P) {
    const y0 = CEIL + 10;
    for (let x = PANEL; x < RW; x++) { const b = (x - PANEL) % 9; P.r(x, y0, 1, FLOOR - y0, b === 0 ? '#2a170e' : b === 1 ? '#5f3b25' : '#4f301e'); }
    for (let k = 0; k < 70; k++) { const x = PANEL + 2 + Math.floor(hash(k, 3, 41) * (RW - PANEL - 2)), y = y0 + Math.floor(hash(k, 4, 41) * (FLOOR - y0)), l = 6 + Math.floor(hash(k, 5, 41) * 26); if ((x - PANEL) % 9 < 2) continue; P.r(x, y, 1, Math.min(l, FLOOR - y), k % 3 ? '#462a1a' : '#5a3823'); }
    P.r(PANEL - 1, y0, 1, FLOOR - y0, '#3a2216'); P.ctx.globalAlpha = 0.18; P.r(PANEL - 4, y0, 3, FLOOR - y0, '#3a2030'); P.ctx.globalAlpha = 1;
    P.r(PANEL, FLOOR - 3, RW - PANEL, 3, '#2e1a10');
    P.r(129, 158, 7, 4, '#f4f2ee'); P.p(131, 159, '#8a8a8a'); P.p(134, 159, '#8a8a8a'); P.r(129, 162, 7, 1, '#9a9690'); // white socket (as in the photo)
  }
  function windowArt(ctx, P, ph) {
    const [gx, gy, gw, gh] = GLASS;
    R.drawSky(ctx, P, gx, gy, gw, gh, ph, false); R.glassShine(P, gx, gy, gw, gh);
    const F = '#f6f4f0', FD = '#d6d2ca';
    P.ctx.globalAlpha = 0.16; P.r(gx - 1, gy + gh + 4, gw + 8, 3, '#3a2030'); P.ctx.globalAlpha = 1;
    P.r(gx - 4, gy - 4, gw + 8, 4, F); P.r(gx - 4, gy + gh, gw + 8, 4, F); P.r(gx - 4, gy, 4, gh, F); P.r(gx + gw, gy, 4, gh, F);
    P.r(gx + gw / 2 - 1, gy, 2, gh, F); P.r(gx, gy + 18, gw, 2, F);
    P.r(gx - 4, gy + gh + 3, gw + 8, 1, FD); P.r(gx + gw + 3, gy - 4, 1, gh + 8, FD); P.r(gx + gw / 2, gy, 1, gh, FD); P.r(gx, gy + 19, gw, 1, FD);
    P.r(gx + gw / 2 - 3, gy + 34, 1, 5, '#c8c4bc'); P.r(gx + gw / 2 + 2, gy + 34, 1, 5, '#c8c4bc');                                  // handles
    P.r(gx - 6, gy + gh + 4, gw + 12, 3, '#f2efe9'); P.r(gx - 6, gy + gh + 4, gw + 12, 1, '#ffffff'); P.r(gx - 6, gy + gh + 6, gw + 12, 1, '#cfc8bc'); // sill
    // white tulle with a little embroidered pattern, gathered to the sides
    ctx.globalAlpha = 0.5;
    for (const [x0, w] of [[gx - 4, 9], [gx + gw - 5, 9]]) for (let y = gy - 6; y < gy + gh + 4; y++) for (let i = 0; i < w; i++) { const fold = (i + (y >> 3)) % 3 === 0; P.p(x0 + i, y, fold ? '#e8e6f0' : '#ffffff'); }
    ctx.globalAlpha = 0.8; for (let y = gy; y < gy + gh; y += 7) for (const x of [gx - 1, gx + 2, gx + gw - 2, gx + gw + 1]) P.p(x, y + (x & 1) * 3, '#c9c4d6'); ctx.globalAlpha = 1;
    drapes(P, closedK());
  }
  // floor-length dark purple drapes on a rod: c = 0 tied back (the photo), 1 = drawn shut — both halves meet in the middle and hang
  // straight down to the floor. Every row's edges move only outwards / to the middle, so a closing drape always covers the tied one.
  function drapes(P, c) {
    const [gx, gy, gw] = GLASS, top = gy - 10, bot = FLOOR - 2, tie = gy + 52, mid = gx + gw / 2, OUT = 18;
    const drape = (side, xo, xi, tieO, tieI, botO, botI) => {
      const outC = side < 0 ? gx - OUT : gx + gw + OUT, inC = mid;
      for (let y = top; y < bot; y++) { const u = y < tie ? (y - top) / (tie - top) : (y - tie) / (bot - tie), a = y < tie ? [xo, xi] : [tieO, tieI], b = y < tie ? [tieO, tieI] : [botO, botI];
        const e = y < tie ? u * u : Math.sqrt(u), o0 = a[0] + (b[0] - a[0]) * e, i0 = a[1] + (b[1] - a[1]) * e;
        const x0 = Math.round(o0 + (outC - o0) * c), x1 = Math.round(i0 + (inC - i0) * c), L = Math.min(x0, x1), W = Math.abs(x1 - x0);
        const sway = Math.round(Math.sin(y / 11) * 1.2 * (1 - c)) + Math.round(c * Math.sin(y / 23));
        for (let i = 0; i <= W; i++) { const f = (i + sway + (c > 0 ? Math.round(c * 9 * ((i / Math.max(1, W)) - 0.5)) : 0) + 100) % 5; P.p(L + i, y, f === 0 ? '#24152b' : f === 2 ? '#4a2e55' : '#3a2342'); }
        P.p(L, y, '#1a0f20'); P.p(L + W, y, '#1a0f20'); }
      if (c < 0.12) { P.r(Math.min(tieO, tieI) - 1, tie - 1, Math.abs(tieI - tieO) + 3, 3, '#c9a24a'); P.r(Math.min(tieO, tieI) - 1, tie - 1, Math.abs(tieI - tieO) + 3, 1, '#e8c870'); }
      else if (c >= 1) { const x = side < 0 ? gx - OUT + 1 : gx + gw + OUT - 4; P.r(x, tie + 2, 4, 2, '#c9a24a'); P.p(x + 1, tie + 4, '#e8c870'); } // the loose tie-back hangs at the side
    };
    drape(-1, gx - 16, gx + 3, gx - 12, gx - 2, gx - 18, gx + 1);
    drape(1, gx + gw + 16, gx + gw - 3, gx + gw + 12, gx + gw + 2, gx + gw + 18, gx + gw - 1);
    if (c >= 1) P.r(mid, top, 1, bot - top, '#1a0f20'); // where the two halves meet
    P.r(gx - 18, top - 2, gw + 36, 2, '#2a2228'); P.r(gx - 18, top - 2, gw + 36, 1, '#5a5258'); P.r(gx - 20, top - 3, 3, 4, '#c9a24a'); P.r(gx + gw + 17, top - 3, 3, 4, '#c9a24a');
    for (let k = 0; k < 6; k++) { const x = Math.round((k < 3 ? gx - 16 + k * 3 : gx + gw + 10 + (k - 3) * 3) + (k < 3 ? 1 : -1) * c * (k < 3 ? 26 + k * 4 : 26 + (5 - k) * 4)); P.p(x, top - 1, '#8a8088'); } // curtain rings slide along the rod
  }
  const curtainK = () => { try { return GAGS.view().curtain || 0; } catch (e) { return 0; } }; // GAGS loads after the rooms (and may still be in its TDZ at boot)
  const closedK = () => (curtainK() >= 1 ? 1 : 0); // the cached background: either tied back or fully shut
  function figurines(P, lvl) { // the mantel shelf has little dark statuettes, candles and a digital clock
    const y = FIRE[1];
    const candles = (x) => { P.r(x, y - 2, 7, 2, '#2a2228'); P.r(x + 3, y - 6, 1, 4, '#2a2228'); P.r(x + 1, y - 3, 5, 1, '#2a2228'); for (const cx of [x, x + 3, x + 6]) { P.r(cx, y - (cx === x + 3 ? 12 : 10), 1, cx === x + 3 ? 6 : 7, '#1c181e'); P.p(cx, y - (cx === x + 3 ? 13 : 11), '#8a8090'); } };
    const owl = (x) => { P.r(x, y - 7, 5, 7, '#3a3236'); P.r(x + 1, y - 8, 3, 1, '#3a3236'); P.p(x + 1, y - 6, '#c8b070'); P.p(x + 3, y - 6, '#c8b070'); P.p(x, y - 8, '#3a3236'); P.p(x + 4, y - 8, '#3a3236'); P.r(x + 1, y - 3, 3, 1, '#4e4448'); };
    const frame = (x, w, h) => { P.r(x, y - h, w, h, '#1e1a20'); P.r(x + 1, y - h + 1, w - 2, h - 2, '#4a4a5a'); P.p(x + 2, y - h + 2, '#8a8aa0'); };
    const rose = (x) => { P.r(x + 1, y - 3, 2, 3, '#3a3236'); P.p(x + 1, y - 6, '#c0202a'); P.p(x + 2, y - 6, '#e0303a'); P.p(x, y - 5, '#a01822'); P.p(x + 3, y - 5, '#c0202a'); P.r(x + 1, y - 5, 2, 1, '#e0303a'); P.p(x + 2, y - 4, '#4a8a3a'); };
    if (isWall(lvl)) { candles(130); frame(139, 8, 9); owl(150); rose(157); frame(170, 9, 7); }
    else { candles(128); owl(176); }
  }
  // ---------- builders ----------
  function bg(ctx, P, H, ph, curH = R.RH) {
    const it = H.items, lvl = tvLvl(it);
    ceiling(P); wall(P); panels(P);
    R.drawFloor(ctx, P, 'cork', FLOOR, curH);
    const shut = closedK() >= 1;
    windowArt(ctx, P, ph);
    if (!shut) R.wallAt(ctx, spr('radiator'), GLASS[0] - 1, 158, 2);
    if (it.poster) R.wallAt(ctx, fur('poster', R.FUR.poster), 141, 48, 1);
    // fireplace + TV on the panel wall
    P.shadow(154, FLOOR + 3, 30, 3.5, 0.3);
    R.wallAt(ctx, spr('fire'), FIRE[0], FIRE[1], 2);
    figurines(P, lvl);
    const tv = TV[lvl]; if (tv) R.wallAt(ctx, sprTV(lvl), tv.at[0], tv.at[1], isWall(lvl) ? 2 : 1);
    soundbar(ctx, it, lvl); consoles(ctx, P, it, lvl);
    if (it.nightlight && !shut) R.sprAt(ctx, fur('nightlight', R.FUR.nightlight), GLASS[0] + 2, GLASS[1] + GLASS[3] - 12);
    // bed: headboard on the wall, then the bed itself
    R.wallAt(ctx, spr('head'), HEAD[0], HEAD[1], 2);
    P.shadow(44, FLOOR + 8, 50, 4, 0.28);
    R.wallAt(ctx, spr('bed'), BED[0], BED[1], 3);
    P.shadow(RUG[0] + RUG[2] / 2, RUG[1] + RUG[3] - 3, RUG[2] / 2 - 2, 4, 0.14); ctx.drawImage(rugSpr(), RUG[0], RUG[1]); // Round 8 #2: the crochet mandala, always there
    if (!shut) R.sunbeam(ctx, P, 'zal', ph);
  }
  function curtainsMoving(ctx, P, H, c) { // halfway: the drapes over the (open) background, then what stands in front of them again
    const it = H.items, lvl = tvLvl(it), tv = TV[lvl];
    drapes(P, c);
    ctx.save(); ctx.beginPath(); ctx.rect(GLASS[0] - 22, GLASS[1] - 16, GLASS[2] + 44, FLOOR - GLASS[1] + 16); ctx.clip();
    R.wallAt(ctx, spr('fire'), FIRE[0], FIRE[1], 2); figurines(P, lvl);
    if (tv) R.wallAt(ctx, sprTV(lvl), tv.at[0], tv.at[1], isWall(lvl) ? 2 : 1);
    soundbar(ctx, it, lvl);
    R.wallAt(ctx, spr('head'), HEAD[0], HEAD[1], 2); R.wallAt(ctx, spr('bed'), BED[0], BED[1], 3);
    ctx.restore();
  }
  // electric "fire": flame columns over two logs, embers; bright=true when the room is dark (drawn over the night tint)
  function fire(ctx, P, t, bright) {
    const [x, y, w, h] = FBOX, base = y + h - 7;
    ctx.globalAlpha = bright ? 0.5 : 0.35; P.r(x, y + 4, w, h - 8, '#5a1e0c'); ctx.globalAlpha = 1;
    for (let i = 0; i < w; i++) {
      const env = Math.max(0, 1 - Math.abs(i - w / 2 + 0.5) / (w / 2 + 1)), fl = 0.65 + 0.35 * Math.sin(t * 6.1 + i * 0.73) * Math.sin(t * 3.7 + i * 1.9 + 1) + 0.15 * Math.sin(t * 13 + i * 2.3);
      const hh = Math.round(env * (h - 12) * fl);
      for (let j = 0; j < hh; j++) { const u = j / Math.max(1, hh); P.p(x + i, base - j, u < 0.3 && env > 0.45 ? '#fff1a8' : u < 0.6 ? '#ffc23a' : u < 0.86 ? '#ff8a2a' : '#d8481e'); }
    }
    P.r(x + 3, base + 1, w - 6, 3, '#5a3a22'); P.r(x + 3, base + 1, w - 6, 1, '#8a6040'); P.r(x + 5, base + 3, w - 10, 2, '#4a2e1a');
    for (let k = 0; k < 6; k++) { const on = Math.sin(t * (3 + k) + k * 2) > -0.2; if (on) P.p(x + 4 + k * 4, base + 4 + (k % 2), k % 2 ? '#ff6a2a' : '#ffb43a'); }
  }
  function glow(ctx, P, t, a) { // three hard-edged bands (no smooth gradient) + a warm patch on the floor
    const cx = FBOX[0] + FBOX[2] / 2, cy = FBOX[1] + FBOX[3] - 8; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * (0.9 + Math.sin(t * 7.3) * 0.06 + Math.sin(t * 3.1) * 0.05);
    for (const r of [32, 24, 17]) P.circ(cx, cy, r, '#ff8a3a'); P.ell(cx, FLOOR + 10, 30, 6, '#ff8a3a'); ctx.restore(); }
  // ---------- Round 5 D: the right casement opens inward; the poster corner peels ----------
  const drapeIn = (y) => { const top = GLASS[1] - 10, tie = GLASS[1] + 52, u = Math.max(0, Math.min(1, (y - top) / (tie - top))); return Math.round(GLASS[0] + GLASS[2] - 3 + 5 * u * u); }; // the right drape's inner edge (rows above the tie)
  function casement(ctx, P, wz, gust, t) {
    const [gx, gy, gw, gh] = GLASS, x0 = gx + gw / 2 + 1, y0 = gy + 20, y1 = gy + gh, hx = gx + gw;
    ctx.save(); ctx.beginPath(); for (let y = y0; y < y1; y++) { const xe = Math.min(hx, drapeIn(y)); if (xe > x0) ctx.rect(x0, y, xe - x0, 1); } ctx.clip();
    R.drawSky(ctx, P, gx, gy, gw, gh, R.phase(), false); // no glass: just the sky (no shine, no handle)
    const A = wz * (1 + 2.6 * gust); ctx.globalAlpha = 0.5; // the tulle stirs in the draught
    for (let y = y0; y < y1; y++) { const sw = Math.round(A * Math.sin(y / 9 + t * 2.6) - A); for (let i = 0; i < 9; i++) { const fold = (i + (y >> 3)) % 3 === 0; P.p(gx + gw - 5 + i + sw, y, fold ? '#e8e6f0' : '#ffffff'); } }
    ctx.restore(); ctx.globalAlpha = 1;
    const a = wz * 2.1, xf = hx - 13 * Math.cos(a), grow = 0.1 * Math.sin(a) * (y1 - y0), L = Math.floor(Math.min(xf, hx)), Rx = Math.ceil(Math.max(xf, hx)), F = '#f6f4f0', FD = '#d6d2ca';
    for (let x = L; x <= Rx; x++) {
      const u = Math.max(0, Math.min(1, (x - hx) / ((xf - hx) || 1))), top = Math.round(y0 - grow * u / 2), bot = Math.round(y1 + grow * u / 2), edge = x === L || x === Rx;
      P.r(x, top, 1, bot - top, edge ? FD : F);
      if (!edge && Rx - L > 3) { ctx.globalAlpha = 0.6; P.r(x, top + 3, 1, bot - top - 6, '#cfe6f6'); ctx.globalAlpha = 1; P.p(x, top + 8 + (x - L) * 2, '#ffffff'); P.p(x, top + 22 + (x - L) * 2, '#ffffff'); }
    }
    const fx = Math.round(xf + (xf < hx ? 1 : -1)), mid = Math.round((y0 + y1) / 2); P.r(fx, mid - 7, 1, 5, '#c8c4bc');
  }
  function posterPeel(P, k) { // the top-right corner comes unstuck and folds down
    const n = Math.round(9 * k), X = 141 + 26 - 1, Y = 48; if (n < 1) return;
    for (let v = 0; v < n; v++) for (let u = 0; u < n - v; u++) { const x = X - u, b = (x - PANEL) % 9; P.p(x, Y + v, b === 0 ? '#2a170e' : b === 1 ? '#5f3b25' : '#4f301e'); }
    for (let v = 0; v <= n; v++) for (let u = n - v; u <= n; u++) { if (u > n || v > n) continue; P.p(X - u, Y + v, u + v === n ? '#cfc4ae' : '#efe6d2'); }
    P.ctx.globalAlpha = 0.35; for (let i = 0; i <= n + 1; i++) { P.p(X - n - 1, Y + i, '#1a0c06'); P.p(X - i, Y + n + 1, '#1a0c06'); } P.ctx.globalAlpha = 1; // its shadow on the poster
  }
  // Round 10 #5: two small valve knobs on the radiator's top corners (red = hot, blue = cold); tapped a lot, the right one falls off (GAGS knob)
  const KNOB = { L: [86, 159], R: [110, 159] }, KBRL = ['#8a5a34', '#b07a4a', '#5a3418'], KBROWN = ['#94603a', '#ba8452', '#5e381c']; // Round 11 #2: both knobs are brown now (were red / blue)
  function knobUp(P, x, y, c) {
    P.r(x + 1, y + 4, 3, 3, '#b9bec6'); P.p(x + 1, y + 4, '#e4e7ec'); P.p(x + 1, y + 6, '#7e848e'); P.p(x + 3, y + 6, '#7e848e');
    P.r(x, y, 5, 4, c[0]); P.r(x, y, 5, 1, c[1]); P.r(x, y + 3, 5, 1, c[2]); P.p(x + 1, y + 1, '#ffffff'); P.p(x + 1, y + 2, c[2]); P.p(x + 3, y + 2, c[2]);
  }
  function knobSide(P, x, y, c) { // lying on the floor: the cap on the left, the stem to the right
    P.shadow(x + 3, y + 3, 5, 1.3, 0.25); P.r(x, y - 2, 4, 5, c[0]); P.r(x, y - 2, 1, 5, c[1]); P.r(x + 3, y - 2, 1, 5, c[2]); P.p(x + 1, y - 1, '#ffffff');
    P.r(x + 4, y - 1, 3, 3, '#b9bec6'); P.p(x + 4, y - 1, '#e4e7ec'); P.p(x + 6, y + 1, '#7e848e');
  }
  function knobs(P, kn, t) {
    knobUp(P, KNOB.L[0], KNOB.L[1], KBRL);
    if (kn.st === 'on' || kn.st === 'wobble') knobUp(P, KNOB.R[0] + (kn.st === 'wobble' ? (Math.floor(t * 28) % 2 ? 1 : -1) : 0), KNOB.R[1] - (kn.st === 'wobble' && Math.floor(t * 28) % 3 === 0 ? 1 : 0), KBROWN);
    else { P.r(KNOB.R[0] + 1, KNOB.R[1] + 4, 3, 3, '#7e848e'); P.r(KNOB.R[0] + 2, KNOB.R[1] + 4, 1, 2, '#33363d'); } // the bare spindle
  }
  function dyn(ctx, P, H, t, st) {
    const it = H.items, on = st.light !== false, lvl = tvLvl(it), tv = TV[lvl];
    P.vl(CH[0] + 22, 0, CH[1] + 2, '#b08c48');
    P.vl(CH[0] + 21, 0, CH[1] + 2, '#8a6a30');
    R.sprAt(ctx, spr('chand', on ? 1 : 0), CH[0], CH[1]);
    if (on) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.07;
      for (const [cx, y] of [[14, 14], [30, 14], [5, 19], [39, 19], [22, 21]]) for (let r = 10; r > 3; r -= 3) P.circ(CH[0] + cx, CH[1] + y + 5, r, '#fff1c0');
      ctx.restore();
      ctx.globalAlpha = 0.08; ctx.fillStyle = '#fff1b0'; ctx.beginPath(); ctx.moveTo(CH[0] + 6, CH[1] + 30); ctx.lineTo(CH[0] + 38, CH[1] + 30); ctx.lineTo(132, GROUND); ctx.lineTo(48, GROUND); ctx.fill(); ctx.globalAlpha = 1;
    }
    const g = st.g || {}, ssn = typeof SEASONS !== 'undefined' && !(g.curtain >= 1);
    if (ssn) SEASONS.sky(ctx, P, 'zal', GLASS); // Round 10 #8: the event's weather behind the glass
    const kn = g.knob || { st: 'on' }; if (!(g.curtain >= 0.5)) knobs(P, kn, t);
    if (g.win && g.win.zal > 0) casement(ctx, P, g.win.zal, g.gust || 0, t);
    if (ssn) SEASONS.draw(ctx, P, 'zal'); // … and its thing on the windowsill
    if (g.curtain > 0 && g.curtain < 1) curtainsMoving(ctx, P, H, g.curtain);
    if (it.guitar) { P.shadow(GTR[0] + GW / 2, GTR[1] + GH, 14, 2.8, 0.3); ctx.drawImage(spr('bag', st.guitar === 'open' ? 1 : 0), GTR[0] + (st.bagDx || 0), GTR[1]); } // Round 7 #8; Round 9 #1: shakes when a baby slaps it; Round 9 #2: bought
    if (kn.st === 'fall' || kn.st === 'floor') knobSide(P, Math.round(kn.x), Math.round(kn.y), KBROWN);
    if (tv) { R.tvScreen(ctx, P, tv.scr, t, st.tvOn !== false); if (st.tvGame && st.tvOn !== false) conMenu(P, tv.scr, st.con, t); }
    conLights(ctx, P, it, st);
    { const q = it.soundbar && sbAt(lvl); if (q) { const on = !!st.sbOn; P.p(q[0] + SB_W - 4, q[1] + 3, on ? '#ffffff' : '#4a4a52'); if (on) { ctx.globalAlpha = 0.35; P.p(q[0] + SB_W - 5, q[1] + 3, '#bfe8ff'); P.p(q[0] + SB_W - 3, q[1] + 3, '#bfe8ff'); ctx.globalAlpha = 1; } } }
    if (it.poster && g.poster > 0) posterPeel(P, g.poster);
    if (it.garland) R.garland(ctx, P, t, 30, g.garland || 0);
    fire(ctx, P, t, false); const ph = R.phase(); if (ph === 'evening' || ph === 'night') glow(ctx, P, t, 0.03);
    { const d = new Date(), x = isWall(lvl) ? 171 : 0; if (x) { P.r(x + 1, FIRE[1] - 6, 7, 4, '#0a0c10'); const c = '#4fd8ff'; for (let k = 0; k < 3; k++) if (k !== 1 || d.getSeconds() % 2) P.p(x + 2 + k * 2, FIRE[1] - 4 - (k === 1 ? 1 : 0), c); P.p(x + 2, FIRE[1] - 5, c); P.p(x + 6, FIRE[1] - 5, c); } }
  }
  function night(ctx, P, H, t) { // light off: the fire keeps burning and glows warm; the star night-light glows on the sill
    fire(ctx, P, t, true); glow(ctx, P, t, 0.07);
    if (H.items.nightlight && curtainK() < 0.5) { const x = GLASS[0] + 2, y = GLASS[1] + GLASS[3] - 12; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.07 + Math.sin(t * 2) * 0.015; for (const r of [22, 15, 9]) P.circ(x + 8, y + 8, r, '#ffd27a'); ctx.restore(); ctx.drawImage(fur('nightlight', R.FUR.nightlight), x, y); }
  }
  // blanket pulled up to the chest when he sleeps (drawn over the monkey), then the footboard / rail stay in front
  function bedFront(ctx, H, cx) {
    const P = Painter(ctx), bed = spr('bed'), x0 = 2, x1 = 82, y0 = 199, y1 = 214, bump = (x) => Math.max(0, 3 - Math.abs(x - cx) / 9);
    for (let x = x0; x < x1; x++) { const top = Math.round(y0 - bump(x)) + (x === x0 || x === x1 - 1 ? 1 : 0); P.r(x, top, 1, y1 - top, '#c7b293'); P.p(x, top, '#e8dcc4'); P.p(x, top + 1, '#d9cab0'); P.p(x, top + 2, '#a8957a'); }
    for (let y = y0 + 5; y < y1; y += 3) for (let x = x0 + 3 + ((y / 3) % 2) * 2; x < x1 - 2; x += 4) { P.p(x, y, '#b09a7a'); P.p(x + 1, y - 1, '#d6c4a6'); }
    ctx.drawImage(bed, 0, 44, 104, 26, BED[0], BED[1] + 44, 104, 26);   // rail + legs
    ctx.drawImage(bed, 80, 0, 24, 70, BED[0] + 80, BED[1], 24, 70);     // footboard
  }
  function spots(it) {
    const kn = (() => { try { return GAGS.view().knob || { st: 'on' }; } catch (e) { return { st: 'on' }; } })(), open = curtainK() < 0.5; // (GAGS may still be in its TDZ at boot)
    const lvl = tvLvl(it), tv = TV[lvl], c = tv && sprTV(lvl), ch = spr('chand', 1), b = spr('bed');
    return { light: [CH[0] - 8, CH[1], ch.width + 16, ch.height + 14], tv: tv ? [tv.at[0], tv.at[1], c.width, c.height] : null, tvLabel: tv && tv.lab ? tv.lab.slice() : null, fire: FBOX.slice(), window: [GLASS[0] - 4, GLASS[1] - 4, GLASS[2] + 8, GLASS[3] + 8], radiator: [GLASS[0] - 1, 158, 30, 30], knobL: open ? [KNOB.L[0] - 1, KNOB.L[1] - 1, 7, 9] : null, knobR: open && (kn.st === 'on' || kn.st === 'wobble') ? [KNOB.R[0] - 1, KNOB.R[1] - 1, 7, 9] : null, knobFloor: kn.st === 'floor' ? [Math.round(kn.x) - 3, Math.round(kn.y) - 5, 13, 10] : null, poster: it.poster ? [141, 48, 26, 36] : null, nightlight: it.nightlight ? [GLASS[0] + 2, GLASS[1] + GLASS[3] - 12, 16, 16] : null, rug: RUG.slice(), garland: it.garland ? [0, 32, RW, 16] : null, bed: [BED[0], BED[1], b.width, b.height], guitar: it.guitar ? [GTR[0], GTR[1], GW, GH] : null, switch2: hasCon(it, 'switch2') ? [SW2[0], SW2[1], 28, 14] : null, ps5: hasCon(it, 'ps5') ? [PS5[0], PS5[1], 12, 24] : null, cable: lvl && (hasCon(it, 'switch2') || hasCon(it, 'ps5')) ? [CAB_X, tvBottom(lvl), 1, CAB_Y1] /* x, top y, w, bottom y */ : null, soundbar: it.soundbar && sbAt(lvl) ? [...sbAt(lvl), SB_W, SB_H] : null,
      curtainL: curtainK() > 0.5 ? [GLASS[0] - 20, GLASS[1] - 14, 34, FLOOR - GLASS[1] + 14] : [GLASS[0] - 20, GLASS[1] - 14, 22, FLOOR - GLASS[1] + 14],
      curtainR: curtainK() > 0.5 ? [GLASS[0] + 14, GLASS[1] - 14, 34, FLOOR - GLASS[1] + 14] : [GLASS[0] + GLASS[2] - 2, GLASS[1] - 14, 22, FLOOR - GLASS[1] + 14], sleep: SLEEP.slice(), visit: [146, 273], party: { pusya: [32, 277], monty: [144, 275], mosq: [120, 274, 84], zhuk: [66, 283] } };
  }
  R.register('zal', { bg, floor: (ctx, P, H) => R.drawFloor(ctx, P, 'cork', FLOOR, H), dyn, night, bedFront, spots, key: () => (closedK() ? 'shut' : ''), thumbs: { guitar: () => guitarSpr(38, 0.62), tv: (v) => (TV[v] ? sprTV(v) : null), soundbar: () => spr('bar'), switch2: () => spr('sw2'), ps5: () => spr('ps5') } });
  return { KNOB, KBROWN, knobUp, TV, FBOX, GLASS, SLEEP, spots, GTR, GO, GW, GH, GK, guitarSpr, guitarHit, RUG, RUG_PAL, rugSpr };
})();
