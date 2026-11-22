'use strict';
// ===== Кухня-гостиная — drawn by hand from the user's photos (IMG_7778 / 7779) =====
// left: Venice photo-wallpaper (canal, palazzi with balconies, gondola) with the brown corner sofa in front (Пуся lives there);
// centre: dark wood kitchen (glass-door upper cabinet, white tiled backsplash, light counter); right: white fridge (= food shop);
// front: black metal table with a smoked-glass top and black chairs with beige floral cushions; floor: light tiles with an ornamental "carpet" of rosettes.
const KITCHEN = (() => {
  const SP = MONKEY.sprite, K = MONKEY.K, IT = K.IT, ITC = K.ITC, R = ROOMS, RW = R.RW, RH = R.RH, FLOOR = R.FLOOR, GROUND = R.GROUND, fur = R.fur, hash = PX.hash;
  // Round 14b #9: the unit is lower (counter top 164, was 140; the upper cabinets came down with it)
  const CEIL = 27, MURAL = 64, CAB = [68, 136], UP = [68, 106], CTR = 164, KET = [114, CTR - 26, 22, 26], MW = [68, CTR - 16, 26, 16], FRIDGE = [138, 84, 38, 142], SOFA = [-4, 176, 72, 58], TABLE = [114, 206], CHAIR = [152, 198], CHAIR2 = [126, 192];
  const STOOL = [8, 252, 20, 26]; // Round 14b #8: the wooden step stool lives on the floor by the sofa (x, feet y, w, h)
  const WD = '#4a2a19', WD_L = '#64391f', WD_D = '#2e1a0f';
  // Round 5 D: the stove sits between the microwave and the kettle (a glass-ceramic hob in the counter + a frying pan), the oven is the
  // middle lower cabinet; the cactus moved onto the microwave. Upper doors and drawers open, the candles light, the clock cuckoos…
  const PAN = [94, CTR - 12, 20, 12], OVEN = [92, CTR + 9, 20, FLOOR - 5 - (CTR + 9)], CABS = [0, 1, 2].map((i) => [70 + 22 * i, UP[0] + 2, 20, UP[1] - UP[0] - 4]), DRAWERS = [[70, CTR + 9, 20, 11], [114, CTR + 9, 20, 11]], CANDLES = [118, 199, 16, 18];
  const glassL = (y) => 5 - (y - 6) * 0.13, glassR = (y) => 16 + (y - 6) * 0.13; // the jug widens toward the base
  const S = {
    sofa: () => SP(SOFA[2], SOFA[3], (a) => { // brown corner sofa: big back cushions, seat, rounded arm, chaise toward us
      const fb = a.mat('kSofa', '#5e4030', 3), fl = a.mat('kSofaL', '#71503d', 3), fd = a.mat('kSofaD', '#46301f', 3);
      a.rbox(0, 4, 70, 40, 5, IT, fd);
      a.rbox(2, 2, 26, 30, 6, IT, fl, { bulge: 0.4 }); a.rbox(24, 2, 48, 30, 6, IT, fl, { bulge: 0.4 }); a.rbox(46, 4, 66, 30, 6, IT, fl, { bulge: 0.4 });
      a.rbox(0, 28, 72, 48, 5, IT, fb, { bulge: 0.3 });
      a.rbox(56, 18, 72, 50, 6, IT, fd, { bulge: 0.3 });
      a.box(4, 48, 10, 58, IT, a.mat('kLeg', '#2a1a10')); a.box(60, 48, 66, 58, IT, a.mat('kLeg', '#2a1a10'));
      a.rbox(6, 22, 30, 34, 3, IT, a.mat('kPlaid', '#6e4a3c', 3));
    }, (d) => { for (let x = 4; x < 56; x += 3) d.px(x, 38, '#4a3022'); for (let y = 8; y < 26; y += 4) { d.px(25, y, '#4a3022'); d.px(47, y, '#4a3022'); } }),
    upper: () => SP(CAB[1] - CAB[0], UP[1] - UP[0], (a) => { // upper cabinets: 2 wood doors + a glass door with dishes in the middle
      const w = a.mat('kWd', WD, 2), wl = a.mat('kWdL', WD_L, 2), W = CAB[1] - CAB[0], H = UP[1] - UP[0];
      a.box(0, 0, W, H, IT, w);
      for (const [x0, x1, glass] of [[2, 22, 0], [24, 44, 1], [46, 66, 0]]) {
        a.rbox(x0, 2, x1, H - 2, 1, IT, wl, { flat: 0.5, bulge: 0.2 });
        a.box(x0 + 3, 5, x1 - 3, H - 5, IT, glass ? a.mat('kGlass', '#8c7a68', 3) : w, glass ? { flat: 0.6 } : { flat: 0.45 });
      }
    }, (d) => { for (const y of [14, 26]) d.hline(28, 39, y, '#d8cfc0'); for (const x of [29, 33, 37]) { d.px(x, 12, '#f4f0e8'); d.px(x, 24, '#f4f0e8'); } d.px(20, 30, '#c8ccd4'); d.px(48, 30, '#c8ccd4'); }),
    lower: () => SP(CAB[1] - CAB[0], FLOOR - CTR + 2, (a) => { // counter + lower cabinets with drawers
      const w = a.mat('kWd', WD, 2), wl = a.mat('kWdL', WD_L, 2), W = CAB[1] - CAB[0], H = FLOOR - CTR + 2;
      a.box(-1, 0, W + 1, 6, IT, a.mat('kTop', '#d9cbb4', 3));
      a.box(0, 6, W, H - 4, IT, w); a.box(0, H - 4, W, H, IT, a.mat('kPlinth', WD_D));
      for (const [x0, x1] of [[2, 22], [24, 44], [46, 66]]) { a.rbox(x0, 9, x1, 20, 1, IT, wl, { flat: 0.5, bulge: 0.2 }); a.rbox(x0, 23, x1, H - 7, 1, IT, wl, { flat: 0.5, bulge: 0.2 }); }
    }, (d) => { const W = CAB[1] - CAB[0]; d.hline(-1, W, 1, '#efe4d0'); for (const x of [8, 30, 52]) { d.hline(x, x + 6, 14, '#c8ccd4'); d.px(x + 13, 30, '#c8ccd4'); d.px(x + 13, 31, '#c8ccd4'); } }),
    fridge: (mag) => SP(FRIDGE[2], FRIDGE[3], (a) => { // tall white fridge, freezer drawer at the bottom
      const wh = a.mat('kFr', '#f2f2ee'), ch = a.mat('chrome', '#c2c8d0');
      a.rbox(0, 0, 38, 142, 3, IT, wh, { bulge: 0.25 }); a.box(1, 92, 37, 93, IT, a.mat('kFrGap', '#c8c8c4'));
      a.rbox(31, 22, 34, 60, 1, IT, ch); a.rbox(31, 98, 34, 116, 1, IT, ch);
      if (mag) { a.ell(10, 30, 3, 3, IT, a.mat('magR', '#ef4d6a')); a.rbox(14, 38, 24, 50, 1, IT, a.mat('photo', '#ffffff')); a.ell(20, 26, 2.6, 2.6, IT, a.mat('magY', '#ffd23a')); a.ell(8, 58, 2.6, 2.6, IT, a.mat('magB', '#59a8ef')); }
    }, (d) => { if (mag) { for (let y = 40; y <= 48; y++) d.hline(16, 22, y, '#9ad0f0'); d.hline(16, 22, 46, '#5fae45'); d.hline(16, 22, 47, '#5fae45'); } d.px(4, 140, '#9a9a96'); d.px(34, 140, '#9a9a96'); }),
    // black metal table with a smoked-glass top (from the photo): thin legs, a low frame near the floor
    table: () => SP(46, 44, (a) => { a.box(0, 11, 46, 15, IT, a.mat('kGlass', '#36424e'), { flat: 0.85 }); a.box(25, 5, 33, 11, IT, a.mat('kBox', '#d8a850')); }, (d) => {
      const bk = '#141418', hi = '#3a3a44', bl = '#2a2a32', Y = 8;
      d.hline(0, 45, 3 + Y, '#8ea2b2'); for (const [x, y] of [[6, 4], [7, 4], [8, 5], [36, 4], [37, 4], [38, 5]]) d.px(x, y + Y, '#b4c6d4');
      d.hline(1, 44, 7 + Y, bk); d.hline(1, 44, 8 + Y, '#22222a');
      for (const x of [7, 38]) for (let y = 9 + Y; y <= 31 + Y; y++) d.px(x, y, bl);
      d.hline(7, 38, 27 + Y, bl);
      for (const x of [2, 42]) for (let y = 8 + Y; y <= 35 + Y; y++) { d.px(x, y, bk); d.px(x + 1, y, y % 6 ? bk : hi); }
      d.hline(2, 43, 30 + Y, bk); d.hline(4, 41, 31 + Y, '#26262e');
    }),
    // black metal chair: arched back with two slats, beige floral seat cushion (no towel on it any more)
    chair: () => SP(22, 52, (a) => { a.rbox(1, 27, 21, 34, 2, IT, a.mat('kCush', '#e8dabc', 3), { flat: 0.5 }); }, (d) => {
      const bk = '#141418', hi = '#3a3a44', bl = '#2c2c34';
      for (const x of [5, 16]) for (let y = 35; y <= 47; y++) d.px(x, y, bl);
      d.hline(5, 16, 43, bl);
      for (const x of [3, 18]) for (let y = 2; y <= 28; y++) d.px(x, y, bk);
      d.hline(4, 17, 1, bk); d.hline(3, 18, 2, bk); d.px(3, 1, hi); d.px(18, 1, hi); d.hline(5, 16, 0, bk); // arched top rail
      d.hline(3, 18, 13, bk); d.hline(3, 18, 24, bk);
      for (const x of [8, 13]) for (let y = 3; y <= 13; y++) d.px(x, y, bk);
      for (let y = 3; y <= 23; y += 5) { d.px(4, y, hi); d.px(19, y, hi); }
      for (const [x, y, c] of [[4, 29, '#b08e66'], [8, 30, '#8d9b72'], [11, 29, '#b08e66'], [15, 31, '#8d9b72'], [18, 29, '#b08e66'], [6, 32, '#b08e66'], [13, 32, '#b08e66'], [9, 28, '#c9b08a'], [16, 28, '#c9b08a']]) d.px(x, y, c);
      d.hline(1, 20, 35, bk);
      for (const x of [2, 19]) for (let y = 35; y <= 51; y++) d.px(x, y, bk);
      d.hline(2, 19, 46, bk); d.px(3, 46, hi);
    }),
    // electric kettle Polaris PWK 1725CGLD (user's): clear tapered glass jug with measurement marks, brushed-steel collar (spout on the left) + bottom band,
    // black angular handle on the right, black round power base; the blue LED lights the water while it boils (drawn live in dyn)
    kettle: () => SP(KET[2], KET[3], (a) => {
      const stl = a.mat('kSteel', '#b9bcc0'), blk = a.mat('kBlk', '#232328'), gl = a.mat('kGlass2', '#d3e3ec');
      a.rbox(2, 22.5, 20, 26, 1.3, IT, blk, { flat: 0.55 });
      a.tube([[16.5, 4.6, 1.15], [20.3, 4.6, 1.15], [20.9, 6.4, 1.15], [20.9, 15.8, 1.15], [19.9, 17.6, 1.15], [17, 17.6, 1.15]], IT, blk, { flat: 0.5 });
      a.box(3.4, 6, 17.6, 18.5, IT, gl, { clip: (x, y) => x >= glassL(y) && x < glassR(y) });
      a.box(3, 18, 18, 22.6, IT, stl);
      a.box(4.6, 3, 16.4, 6.4, IT, stl);
      a.poly([[5.2, 3.1], [0.6, 3.5], [0.6, 4.7], [5.2, 6.4]], IT, stl);
      a.rbox(6, 1, 15, 3.6, 1, IT, stl);
      a.box(9.5, 0, 12, 1.6, IT, blk, { vb: -0.2 });
    }, (d) => {
      for (const y of [9, 12, 15]) { d.px(6, y, '#93a9b6'); d.px(7, y, '#a9bcc8'); } d.px(6, 10.5 | 0, '#a9bcc8');
      for (let y = 7; y < 18; y++) d.px(14, y, y % 4 ? '#f4fbff' : '#e2eef5');
      d.hline(5, 15, 10, '#bdd5e2'); d.hline(4, 17, 19, '#e8eaec'); d.hline(5, 16, 4, '#e4e6e8'); d.px(10, 24, '#3a3a40');
    }),
    // black microwave: black glass door with a dark window, control strip on the right (green display, buttons, dial)
    micro: () => SP(MW[2], MW[3], (a) => {
      a.rbox(0, 0, MW[2], MW[3], 1, IT, a.mat('kMwB', '#1e1e24'), { flat: 0.5 });
      a.rbox(2, 2, 18, 14, 0.8, IT, a.mat('kMwW', '#141418'), { flat: 0.4, bulge: 0 });
      a.ell(22.5, 10.5, 2, 2, IT, a.mat('kMwD', '#2c2c34'), { flat: 0.55 });
    }, (d) => {
      d.hline(20, 24, 3, '#2fbf66'); d.px(21, 3, '#7dffb0'); d.px(23, 3, '#7dffb0');
      for (const x of [20, 22, 24]) d.px(x, 6, '#4a4a54');
      d.px(22, 9, '#5a5a64'); for (let k = 0; k < 4; k++) { d.px(5 + k, 9 - k, '#2c2c36'); d.px(9 + k, 11 - k, '#24242e'); } d.hline(1, 24, 15, '#2a2a32');
    }),
  };
  const spr = (k, ...a) => fur('kit_' + k + a.join('_'), () => S[k](...a));
  // ---------- painted parts ----------
  function mural(P) { // Venice photo-wallpaper in warm sepia: a canal running away between tall palazzi (arched windows, balconies), sky in the gap, a gondola
    const y0 = CEIL + 7, y1 = FLOOR - 6, W = MURAL, VX = 33, top = (x) => y0 + 8 + Math.abs(x - VX) * 0.0, L = [22, 92, 148], Rr = [44, 88, 148];
    R.vgrad(P, 0, y0, W, 120, ['#efe2c2', '#f4e8cc', '#f2dcb0', '#e8c890']);
    // far end of the canal: small facades, a bell tower, a bridge
    P.r(L[0], 86, Rr[0] - L[0], 62, '#d9b680'); P.r(29, 62, 5, 26, '#c9a06a'); P.r(28, 60, 7, 3, '#b8885a'); P.p(31, 58, '#b8885a'); P.r(30, 66, 3, 3, '#8a5a3a');
    for (let x = L[0] + 1; x < Rr[0] - 1; x += 3) for (let y = 92; y < 140; y += 6) P.r(x, y, 1, 3, '#a87a4e');
    for (let x = L[0]; x < Rr[0]; x++) { const y = 136 - Math.round(Math.sin((x - L[0]) / (Rr[0] - L[0]) * Math.PI) * 4); P.r(x, y, 1, 3, '#e8d4ac'); P.p(x, y, '#f6ead0'); }
    // facades in perspective: left one recedes from x 0 to 22, right one from x 64 to 44
    const facade = (xa, xb, ya0, ya1, yb0, yb1, c, cd, seed) => {
      const n = Math.abs(xb - xa), sg = Math.sign(xb - xa);
      for (let i = 0; i <= n; i++) { const x = xa + sg * i, k = i / n, ta = ya0 + (yb0 - ya0) * k, tb = ya1 + (yb1 - ya1) * k; P.r(x, Math.round(ta), 1, Math.round(tb - ta), PX.shade(c, 1 - k * 0.12)); }
      for (let col = 0; col < 6; col++) { const k = 1 - Math.pow(0.78, col + 1) / 0.78 * 0.78, k2 = k + Math.pow(0.78, col + 1) * 0.5; const x = Math.round(xa + sg * n * k), w = Math.max(1, Math.round(n * (k2 - k) * 0.7));
        const ta = ya0 + (yb0 - ya0) * k, tb = ya1 + (yb1 - ya1) * k, hh = tb - ta;
        for (let r = 0; r < 6; r++) { const wy = Math.round(ta + hh * (0.06 + r * 0.15)), wh = Math.max(2, Math.round(hh * 0.08)); const wx = sg > 0 ? x : x - w + 1;
          P.r(wx, wy, w, wh, cd); P.p(wx + (w >> 1), wy - 1, cd); if (w > 1) P.r(wx, wy, w, 1, PX.shade(cd, 1.5));
          if (r % 2 === 1) P.r(wx - 1, wy + wh, w + 2, 1, '#3a2414'); } }
    };
    facade(0, L[0], y0, y1 - 30, L[1] - 6, L[2], '#b88a52', '#5a3a22', 1);
    facade(W - 1, Rr[0], y0 + 4, y1 - 40, Rr[1] - 2, Rr[2] - 2, '#c9965a', '#6a4428', 2);
    // the canal: green-brown water with golden glints, widening toward us; a gondola
    for (let y = 148; y < y1; y++) { const k = (y - 148) / (y1 - 148), xl = Math.round(L[0] * (1 - k) - 2 * k), xr = Math.round(Rr[0] + (W - Rr[0]) * Math.min(1, k * 1.6)); P.r(xl, y, xr - xl, 1, k < 0.3 ? '#7a8466' : k < 0.6 ? '#66724f' : '#55603f'); }
    for (let k = 0; k < 36; k++) { const y = 150 + Math.floor(hash(k, 2, 51) * (y1 - 152)), x = 4 + Math.floor(hash(k, 1, 51) * (W - 8)); P.r(x, y, 2 + (k % 3), 1, k % 2 ? '#c9a062' : '#8f9a76'); }
    for (let x = 24; x < 40; x++) { const y = 160 + Math.round(Math.pow((x - 32) / 8, 2) * -2); P.r(x, y, 1, 2, '#1a1414'); } P.r(37, 152, 1, 8, '#1a1414'); P.r(36, 151, 3, 1, '#1a1414'); P.r(29, 158, 3, 2, '#c94f4f');
    // warm haze + the wall corner shadow
    P.ctx.globalAlpha = 0.12; P.r(0, y0, W, 50, '#fff4d8'); P.ctx.globalAlpha = 0.25; P.r(W - 3, y0, 3, y1 - y0, '#3a2030'); P.ctx.globalAlpha = 1;
  }
  function backsplash(P) { const x0 = CAB[0], w = CAB[1] - CAB[0], y0 = UP[1], h = CTR - UP[1];
    P.r(x0, y0, w, h, '#f2efe8'); for (let y = y0; y < y0 + h; y += 6) P.r(x0, y, w, 1, '#d9d3c8'); for (let y = y0; y < y0 + h; y += 6) for (let x = x0 + ((y - y0) / 6 % 2) * 4; x < x0 + w; x += 8) P.r(x, y, 1, 6, '#d9d3c8');
    P.r(x0 + 22, y0 + 12, 24, 16, '#e3d6bc'); for (let k = 0; k < 24; k += 4) { P.p(x0 + 24 + k, y0 + 16, '#b4864e'); P.p(x0 + 23 + k, y0 + 22, '#9a6a3e'); P.p(x0 + 25 + k, y0 + 19, '#c94f4f'); }
  }
  function oven(P) { // built-in oven in the middle lower cabinet: black control strip with 4 steel knobs + orange clock, black door with a dark window and a steel bar handle
    const [x, y, w, h] = OVEN; P.r(x, y, w, 10, '#1c1c22'); P.r(x, y, w, 1, '#3a3a44'); P.r(x, y + 9, w, 1, '#101014');
    for (const kx of [94, 98, 106, 110]) { P.r(kx - 1, y + 4, 3, 3, '#b9bcc0'); P.p(kx, y + 4, '#e8eaec'); P.p(kx, y + 6, '#6a6a70'); }
    P.r(101, y + 4, 4, 2, '#1a0c04'); P.p(101, y + 4, '#ffb43a'); P.p(102, y + 5, '#ffb43a'); P.p(104, y + 4, '#ffb43a'); P.p(104, y + 5, '#ffb43a');
    const dy = y + 12, dh = y + h - dy; P.r(x, dy, w, dh, '#26262c'); P.r(x, dy, w, 1, '#44444e'); P.r(x, dy + dh - 1, w, 1, '#141418');
    P.r(x + 2, dy + 2, w - 4, 2, '#c8ccd2'); P.r(x + 2, dy + 4, w - 4, 1, '#7a7e86'); P.p(x + 3, dy + 1, '#9a9ea6'); P.p(x + w - 4, dy + 1, '#9a9ea6');
    P.r(x + 3, dy + 7, w - 6, dh - 12, '#121216'); P.r(x + 3, dy + 7, w - 6, 1, '#2a2a32');
    for (const ry of [dy + 15, dy + 23]) P.r(x + 4, ry, w - 8, 1, '#30303a');
    for (let k = 0; k < 6; k++) P.p(x + 5 + k, dy + 14 - k, '#3a3a46');
  }
  function hob(P) { // glass-ceramic hob set into the counter, seen nearly edge-on (the pan stands on it; it glows red while cooking)
    P.r(PAN[0] - 1, CTR - 1, PAN[2] + 2, 2, '#1e1e24'); P.r(PAN[0] - 1, CTR - 1, PAN[2] + 2, 1, '#3c3c46'); P.p(PAN[0] + 2, CTR - 1, '#6a6a78');
  }
  function floor(ctx, P, H = RH) { // light tiles + ornamental carpet (border band, rosettes); Round 25: H — further down (FILL)
    P.r(0, FLOOR, RW, H - FLOOR, '#e8dcc4');
    for (let y = FLOOR; y < H; y += 16) P.r(0, y, RW, 1, '#d4c6ac'); for (let y = FLOOR; y < H; y += 16) for (let x = ((y - FLOOR) / 16 % 2) * 15; x < RW; x += 30) P.r(x, y, 1, 16, '#d4c6ac');
    const bx = 14, by = FLOOR + 14, bw = 152, bh = 66;
    P.r(bx, by, bw, 4, '#b98a52'); P.r(bx, by + bh - 4, bw, 4, '#b98a52'); P.r(bx, by, 4, bh, '#b98a52'); P.r(bx + bw - 4, by, 4, bh, '#b98a52');
    for (let x = bx + 2; x < bx + bw - 2; x += 4) { P.p(x, by + 1, '#e8d0a0'); P.p(x + 2, by + bh - 2, '#e8d0a0'); }
    for (const [cx, cy] of [[54, by + 33], [126, by + 33]]) { P.ell(cx, cy, 15, 9, '#d8c49c'); P.ell(cx, cy, 11, 6.5, '#efe2c8'); for (let k = 0; k < 12; k++) { const an = k / 12 * Math.PI * 2; P.p(Math.round(cx + Math.cos(an) * 9), Math.round(cy + Math.sin(an) * 5.4), '#a8784a'); } P.ell(cx, cy, 3, 2, '#b98a52'); }
    for (let j = 0; j < 14; j++) { ctx.globalAlpha = 0.18 * (1 - j / 14); P.r(0, FLOOR + j, RW, 1, '#2a1620'); } ctx.globalAlpha = 1;
    for (let j = 0; j < 30; j++) { ctx.globalAlpha = 0.12 * (j / 30); P.r(0, H - 30 + j, RW, 1, '#2a1620'); } ctx.globalAlpha = 1;
  }
  // ---------- builders ----------
  function bg(ctx, P, H, ph, curH = RH) {
    const it = H.items;
    P.r(0, 0, RW, CEIL, '#ece7e0'); R.dither(P, 0, 0, RW, 10, '#e0dad2', '#ece7e0', 0.5); for (const x of [30, 90, 150]) { P.r(x - 2, 9, 5, 2, '#f8f6f2'); P.p(x, 8, '#c8c0b4'); }
    R.cornice(P, CEIL);
    R.plaster(P, MURAL, CEIL + 7, RW - MURAL, FLOOR - CEIL - 7, '#e9d3b4', '#dfc6a4', '#f0dcc0', 61);
    mural(P);
    P.r(0, FLOOR - 6, RW, 6, '#3a2216'); P.r(0, FLOOR - 6, RW, 1, '#5a3622');
    backsplash(P);
    R.wallAt(ctx, spr('upper'), CAB[0], UP[0], 2);
    R.wallAt(ctx, spr('lower'), CAB[0], CTR, 2, FLOOR + 2);
    oven(P); hob(P);
    if (it.micro) R.sprAt(ctx, spr('micro'), MW[0], MW[1]); // Round 9 #2: the microwave and the kettle are bought
    if (it.kettle) { P.shadow(KET[0] + 11, CTR, 9, 1.5, 0.25); R.sprAt(ctx, spr('kettle'), KET[0], KET[1]); }
    if (it.cactus) R.sprAt(ctx, fur('cactus', R.FUR.cactus), MW[0] + 6, cactusY(it)); // on the microwave, or on the counter without it
    if (it.clock) R.wallAt(ctx, fur('clock', R.FUR.clock), 146, 56, 2);
    P.shadow(157, FLOOR + 2, 20, 3, 0.28); R.wallAt(ctx, spr('fridge', it.magnets ? 1 : 0), FRIDGE[0], FRIDGE[1], 3);
    floor(ctx, P, curH);
    if (it.lamp) R.wallAt(ctx, fur('lamp', R.FUR.lamp), 50, FLOOR - 92, 3);
    P.shadow(32, SOFA[1] + SOFA[3] - 1, 36, 4, 0.3); R.sprAt(ctx, spr('sofa'), SOFA[0], SOFA[1]);
    P.shadow(TABLE[0] + 23, TABLE[1] + 44, 28, 3, 0.25); // (the chairs and the table are live: the right chair slides aside for the fridge trip, the left one creaks, the candles light)
  }
  // ---------- live things: the kettle boils (blue LED lights the water, bubbles, then steam), the microwave runs (warm window, turntable) ----------
  function kettleLive(ctx, P, t, k) {
    const [x0, y0] = KET;
    if (k && k.ph === 'boil') {
      const e = Math.min(1, k.t / 0.35), hot = Math.min(1, k.t / 4.5);
      for (let y = 10; y < 18; y++) { const l = Math.ceil(glassL(y)) + 1, r = Math.floor(glassR(y)) - 1; ctx.globalAlpha = (0.62 + 0.12 * hot) * e; P.r(x0 + l, y0 + y, r - l, 1, y < 13 ? '#5ab4ff' : y < 16 ? '#3d8bff' : '#2a6cff'); }
      ctx.globalAlpha = e; P.r(x0 + 8, y0 + 18, 6, 1, '#7fd0ff'); P.r(x0 + 10, y0 + 24, 2, 1, '#8fe0ff');
      const n = 2 + Math.floor(hot * 9);
      for (let i = 0; i < n; i++) { const ph = (t * (1.3 + hot) + i * 0.37) % 1, bx = x0 + 6 + Math.floor(hash(i, 3, 7) * 10); ctx.globalAlpha = 0.9 * e; P.p(bx + (ph > 0.5 ? 1 : 0), Math.round(y0 + 17 - ph * 7), '#e6f6ff'); }
      if (hot > 0.75) { ctx.globalAlpha = 0.8; for (let i = 0; i < 4; i++) P.p(x0 + 6 + ((t * 9 + i * 3) | 0) % 10, y0 + 10, '#f4fbff'); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.09 * e; for (const r of [13, 9, 6]) P.circ(x0 + 11, y0 + 14, r, '#3a8cff'); ctx.restore();
      ctx.globalAlpha = 1;
      if (k.t > 3.2) R.steam(ctx, P, x0 + 1, y0 + 2, t * 1.4, '#ffffff');
    } else if (k && k.ph === 'steam') {
      const f = Math.max(0, 1 - k.t / 4.5); ctx.globalAlpha = 0.5 * f; P.r(x0 + 5, y0 + 7, 11, 3, '#ffffff'); ctx.globalAlpha = 1;
      for (let j = 0; j < 2; j++) { const ph = (t * 0.7 + j * 0.5) % 1; ctx.globalAlpha = 0.6 * f * (1 - ph); P.circ(x0 + 1 + Math.sin(ph * 6 + j) * 3, y0 + 2 - ph * 24, 1.6 + ph * 3, '#ffffff'); }
      ctx.globalAlpha = 1;
    }
  }
  function microLive(ctx, P, t, m) {
    const [x0, y0] = MW;
    if (m && m.ph === 'run') {
      ctx.globalAlpha = 0.88; P.r(x0 + 3, y0 + 3, 14, 10, '#ffcf6a'); ctx.globalAlpha = 1;
      P.r(x0 + 3, y0 + 3, 14, 1, '#ffe7a8'); const sw = Math.round(Math.sin(t * 2.2) * 3);
      P.ell(x0 + 10, y0 + 11, 5, 1.2, '#e8c070'); P.r(x0 + 8 + sw, y0 + 8, 5, 3, '#c8503a'); P.r(x0 + 8 + sw, y0 + 8, 5, 1, '#e07a52');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.08; for (const r of [12, 8]) P.circ(x0 + 10, y0 + 8, r, '#ffb040'); ctx.restore();
      if (Math.floor(t * 2) % 2) P.r(x0 + 20, y0 + 3, 5, 1, '#7dffb0');
    } else if (m && m.ph === 'ding') {
      const on = Math.floor(m.t * 4) % 2 === 0; if (on) { P.r(x0 + 20, y0 + 3, 5, 1, '#b6ffd4'); }
      for (let j = 0; j < 2; j++) { const ph = (t * 0.6 + j * 0.5) % 1; ctx.globalAlpha = 0.45 * (1 - ph) * Math.max(0, 1 - m.t / 1.6); P.circ(x0 + 8 + j * 5 + Math.sin(ph * 6) * 2, y0 - 1 - ph * 14, 1.4 + ph * 2, '#ffffff'); }
      ctx.globalAlpha = 1;
    }
  }
  // ---------- the fridge opens while he rummages in it (walk-to trip): cold light, glass shelves with food;
  // the door (hinge on the left, handle on the right) swings toward us and ends up as a narrow panel left of the fridge ----------
  function fridgeOpen(ctx, P, t, k) {
    const [x0, y0, W] = FRIDGE, DH = 92, e = 1 - Math.pow(1 - Math.min(1, k), 2), ix = x0 + 2, iw = W - 4, iy = y0 + 2, ih = DH - 3;
    P.r(ix, iy, iw, ih, '#bfd5e2'); P.r(ix, iy, iw, 3, '#e6f4fa'); P.r(ix, iy + 3, iw, 2, '#d2e4ee');
    P.r(ix, iy, 1, ih, '#b4cad6'); P.r(ix + iw - 1, iy, 1, ih, '#b4cad6'); P.r(ix, iy + ih - 1, iw, 1, '#a8bcc8'); P.r(ix + 13, iy + 1, 8, 2, '#ffffff');
    for (const r of [27, 51, 73]) { P.r(ix + 1, y0 + r, iw - 2, 1, '#9fbccb'); P.r(ix + 1, y0 + r - 1, iw - 2, 1, '#f4fbff'); }
    // top shelf: milk, cheese, eggs
    P.r(ix + 3, y0 + 16, 5, 11, '#ffffff'); P.r(ix + 3, y0 + 20, 5, 3, '#4f8ee8'); P.r(ix + 4, y0 + 14, 3, 2, '#dcdcdc');
    P.r(ix + 11, y0 + 22, 7, 5, '#ffd23a'); P.r(ix + 11, y0 + 22, 7, 1, '#ffe88a'); P.p(ix + 13, y0 + 24, '#e0a91a'); P.p(ix + 16, y0 + 25, '#e0a91a');
    for (const ex of [21, 25, 29]) { P.r(ix + ex, y0 + 23, 3, 4, '#fbf2e4'); P.p(ix + ex, y0 + 23, '#ffffff'); }
    // second shelf: jam, apples, bananas
    P.r(ix + 3, y0 + 42, 6, 9, '#c8304a'); P.r(ix + 3, y0 + 40, 6, 2, '#e8b830'); P.p(ix + 4, y0 + 44, '#ff7a8a');
    for (const ax of [13, 18]) { P.circ(ix + ax, y0 + 47.5, 2.5, '#e8453c'); P.p(ix + ax - 1, y0 + 46, '#ff9a8a'); P.p(ix + ax, y0 + 44, '#5a3a20'); }
    P.r(ix + 23, y0 + 47, 9, 3, '#f4d03a'); P.r(ix + 23, y0 + 47, 9, 1, '#ffe88a'); P.p(ix + 22, y0 + 48, '#6b4a1f');
    // third shelf: cake, sausage, a bottle
    P.r(ix + 3, y0 + 66, 9, 7, '#fff4e2'); P.r(ix + 3, y0 + 66, 9, 2, '#ff9ab8'); P.p(ix + 7, y0 + 65, '#e8453c');
    P.r(ix + 15, y0 + 69, 10, 4, '#b04a3a'); P.r(ix + 15, y0 + 69, 10, 1, '#d8705a'); P.p(ix + 15, y0 + 70, '#e8c0a0');
    P.r(ix + 28, y0 + 59, 4, 14, '#3f9a4a'); P.r(ix + 29, y0 + 56, 2, 3, '#3f9a4a'); P.p(ix + 29, y0 + 61, '#8fd36c');
    // crisper with greens and a carrot
    P.r(ix + 2, y0 + 76, iw - 4, 12, '#bfe0cc'); P.r(ix + 2, y0 + 76, iw - 4, 1, '#e8f8ee');
    for (let j = 0; j < 5; j++) P.circ(ix + 6 + j * 6, y0 + 80, 2.6, j % 2 ? '#6cc24a' : '#4f9a3a');
    P.r(ix + 9, y0 + 82, 6, 2, '#f08a2a');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.06 * e; for (const r of [26, 16]) P.circ(x0 + 19, y0 + 22, r, '#dff4ff'); ctx.restore();
    const xe = Math.round(x0 + W - (W + 12) * e); // the free edge of the door
    if (xe > x0 + 1) { // still turning: its white outside with the handle covers part of the inside
      P.r(x0, y0, xe - x0, DH, '#f2f2ee'); P.r(xe - 1, y0, 1, DH, '#c8c8c4'); P.r(x0, y0, xe - x0, 1, '#ffffff'); if (xe - x0 > 8) P.r(xe - 6, y0 + 22, 2, 38, '#c2c8d0');
    } else if (xe < x0 - 1) { // wide open: its inner side with door shelves (bottles); the free edge is nearer to us, so a bit taller
      const L = x0 - xe, BC = ['#e8453c', '#ffffff', '#f2a03a', '#3f9a4a'];
      for (let x = xe; x < x0; x++) { const fr = (x0 - x) / L, top = Math.round(y0 - 3 * fr), bot = Math.round(y0 + DH + 3 * fr); P.r(x, top, 1, bot - top, x === xe ? '#c8c8c4' : '#eceee8'); P.p(x, top, '#ffffff'); }
      for (const r of [20, 44, 68]) for (let x = xe + 1; x < x0; x++) { const fr = (x0 - x) / L, y = Math.round(y0 + r + (r - DH / 2) / (DH / 2) * 3 * fr); P.p(x, y, '#b4bab4'); P.p(x, y - 1, BC[(x + r) % 4]); P.p(x, y - 2, BC[(x + r) % 4]); }
    }
  }
  // ---------- Round 5 D: live gag parts ----------
  function pcol(done, burnt) { if (burnt && done > 0.6) return ['#3a2418', '#5a3a26']; if (burnt && done > 0.3) return ['#8a5a30', '#a8703a']; return done < 0.15 ? ['#f2e2a8', '#fff2c8'] : done < 0.4 ? ['#ecc878', '#f8e0a0'] : ['#d89a48', '#f0c070']; }
  function stoveLive(ctx, P, t, c) { // the hob glow, the frying pan and what is in it
    const [x0, y0, w] = PAN, cx = x0 + 10, glow = c ? c.glow : 0;
    if (glow > 0) { const col = glow > 0.6 ? '#ff4a1e' : glow > 0.3 ? '#e83a1a' : '#a8301c'; P.r(x0 + 1, CTR - 1, w - 2, 1, col); P.r(x0 + 3, CTR, w - 6, 1, PX.shade(col, 0.8)); if (glow > 0.6) { P.p(x0, CTR - 1, '#c8301a'); P.p(x0 + w - 1, CTR - 1, '#c8301a'); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.12 * glow; for (const r of [10, 6]) P.ell(cx, CTR - 1, r + 3, r * 0.5, '#ff5a2a'); ctx.restore(); }
    // the pan: dark body, a lighter rim, the handle sticking out to the left over the microwave corner
    P.r(x0 + 4, y0 + 5, 13, 5, '#2a2a30'); P.r(x0 + 5, y0 + 10, 11, 1, '#1e1e24'); P.r(x0 + 4, y0 + 5, 1, 4, '#3e3e48');
    P.ell(cx + 0.5, y0 + 4.5, 7.5, 2.2, '#4a4a56'); P.ell(cx + 0.5, y0 + 4.6, 6, 1.4, '#16161a');
    P.r(x0 - 3, y0 + 6, 7, 2, '#26262c'); P.r(x0 - 3, y0 + 6, 7, 1, '#4a4a54'); P.p(x0 - 4, y0 + 7, '#1a1a1e');
    if (!c) return;
    if (c.inPan) {
      if (c.lump) { P.ell(cx, y0 + 3, 3.5, 2.2, '#2a1a12'); P.p(cx - 2, y0 + 1, '#3a2418'); P.p(cx + 2, y0 + 2, '#4a2e1c'); P.p(cx, y0 + 1, '#1a100a'); }
      else if (c.spread > 0) { const r = 1 + 4.6 * c.spread, col = pcol(c.done, c.burnt); P.ell(cx + 0.5, y0 + 4.4, r, Math.max(0.6, r * 0.24), col[0]); if (r > 3) P.r(Math.round(cx - r * 0.5), y0 + 4, Math.round(r), 1, col[1]);
        if (c.done > 0.2 && Math.floor(t * 6) % 2) { P.p(cx - 2, y0 + 4, '#fff8d8'); P.p(cx + 3, y0 + 4, '#fff8d8'); } }
    }
    if (c.ph === 'pour' && c.k < 0.85) { const h = 9; P.r(cx + 2, y0 + 4 - h, 1, h, '#f2e2a8'); P.p(cx + 2, y0 + 4 - h, '#fff6d0'); } // batter poured from the ladle
  }
  function cabsLive(ctx, P, cab) { // an upper cabinet door swung open: dark inside with its shelf and things, the door seen at an angle by its hinge
    if (!cab || cab.k <= 0) return; const [x, y, w, h] = CABS[cab.i], k = cab.k, hingeL = cab.i !== 2;
    P.r(x, y, w, h, '#22130a'); P.r(x, y + 15, w, 2, '#5a3420'); P.r(x, y + h - 2, w, 2, '#4a2a19'); P.r(x, y, w, 1, '#120a05');
    if (cab.i === 0) { for (let j = 0; j < 3; j++) { P.ell(x + 10, y + 13 - j * 2, 7 - j, 1.3, j % 2 ? '#a8aeb6' : '#c2c8d0'); } P.r(x + 3, y + 22, 6, 9, '#8a9099'); P.r(x + 11, y + 24, 7, 7, '#6a7078'); P.r(x + 3, y + 22, 6, 1, '#c2c8d0'); } // pot lids and saucepans
    else if (cab.i === 1) { for (let j = 0; j < 4; j++) P.ell(x + 10, y + 14 - j * 1.5, 7, 1.2, j % 2 ? '#e8e2d8' : '#ffffff'); for (const cx of [x + 4, x + 10, x + 16]) { P.r(cx - 2, y + 26, 5, 5, '#ffffff'); P.p(cx - 1, y + 27, '#3a6ab8'); P.p(cx + 1, y + 28, '#3a6ab8'); P.r(cx + 3, y + 27, 1, 2, '#e8e2d8'); } } // grandma's china
    else { P.r(x + 3, y + 7, 6, 8, '#c8a060'); P.r(x + 3, y + 7, 6, 2, '#e8453c'); P.r(x + 11, y + 9, 6, 6, '#d8c8a8'); P.r(x + 11, y + 9, 6, 1, '#3a8fd8'); P.ell(x + 10, y + 27, 7, 3, '#3a6ab8'); P.ell(x + 10, y + 26, 6, 2, '#5a8ad8'); P.p(x + 7, y + 25, '#d8a860'); P.p(x + 12, y + 26, '#d8a860'); } // jars + the cookie tin
    const dw = Math.max(2, Math.round(7 * k)), ext = Math.round(3 * k); // the door leaf, nearer edge a bit taller
    if (hingeL) { for (let i = 0; i < dw; i++) { const e = Math.round(ext * (i / dw)); P.r(x - i - 1, y - e, 1, h + 2 * e, i === dw - 1 ? WD_D : i % 3 ? WD_L : WD); } }
    else { for (let i = 0; i < dw; i++) { const e = Math.round(ext * (i / dw)); P.r(x + w + i, y - e, 1, h + 2 * e, i === dw - 1 ? WD_D : i % 3 ? WD_L : WD); } }
  }
  function drawersLive(ctx, P, dr) { // a drawer slides out toward us: the dark box opens above its front
    if (!dr || dr.k <= 0) return; const [x, y, w, h] = DRAWERS[dr.i], off = Math.round(4 * dr.k);
    P.r(x - 1, y - 1, w + 2, off + 1, '#140b06');
    if (dr.i === 0) { for (let j = 0; j < 5; j++) P.r(x + 2 + j * 4, y, 2, Math.min(off, 2), j % 2 ? '#c8ccd4' : '#9aa0a8'); } else { for (let j = 0; j < 3; j++) P.r(x + 3 + j * 6, y, 4, Math.min(off, 2), '#f0f0ea'); }
    P.r(x - 1, y + off, w + 2, h + 1, WD_L); P.r(x - 1, y + off, w + 2, 1, '#8a5a34'); P.r(x - 1, y + off + h, w + 2, 1, WD_D); P.r(x + 6, y + off + 6, 7, 1, '#c8ccd4'); P.p(x + 6, y + off + 7, '#8a9099');
  }
  const cactusY = (it) => (it && it.micro ? MW[1] : CTR) - 22;
  // Round 9 #2: the bought candles — two thick white pillar candles in a brass dish on the glass table (drawn over the table)
  function candles(P) {
    P.r(121, 215, 11, 1, '#c8a050'); P.r(122, 216, 9, 1, '#8a6a2a'); P.p(122, 215, '#f0d890'); P.p(131, 215, '#a07a32');
    for (const [x, y0] of [[123, 203], [128, 206]]) { P.r(x, y0, 2, 215 - y0, '#f4f0e6'); P.r(x + 1, y0 + 1, 1, 214 - y0, '#d6cfc0'); P.p(x, y0, '#fffaf0'); P.p(x + 1, y0 - 1, '#3a2a1a'); }
    P.p(123, 206, '#fffaf0'); P.p(128, 209, '#e8e2d4'); // wax drips
  }
  function candlesLive(ctx, P, t, on) { // the two candles: lit — tall flickering flames + warm glow
    if (!on) return; const fl = (i) => (Math.sin(t * 13 + i * 2) > 0.2 ? 1 : 0);
    for (const [x, y, i] of [[124, 201, 0], [129, 204, 1]]) { const f = fl(i); P.p(x, y - 1 - f, '#ffd27a'); P.p(x, y - 2 - f, '#fff1a8'); P.p(x, y, '#ff9a2a'); P.p(x, y + 1, '#3a2a1a'); if (f) P.p(x + 1, y - 1, '#ffb43a'); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.1 + Math.sin(t * 9) * 0.02; for (const r of [9, 6, 3]) P.circ(126, 202, r, '#ffcf6a'); ctx.restore();
  }
  function clockLive(ctx, P, t, k) { // hands: real time; tapped — they whirl round and the cuckoo pops out of its little door
    const d = new Date(), cx = 146 + 11, cy = 56 + 11; let hA = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2, mA = d.getMinutes() / 60 * Math.PI * 2;
    if (k >= 0) { const e = Math.sin(Math.min(1, k * 1.4) * Math.PI / 2); hA += e * Math.PI * 2; mA += e * Math.PI * 12; }
    P.line(cx, cy, cx + Math.sin(hA) * 4, cy - Math.cos(hA) * 4, '#3b2433'); P.line(cx, cy, cx + Math.sin(mA) * 6, cy - Math.cos(mA) * 6, '#3b2433');
    if (k > 0.45 && k < 0.95) { const o = Math.min(1, (k - 0.45) * 8, (0.95 - k) * 8), by = 56 - Math.round(7 * o); P.r(cx - 3, 53, 7, 4, '#2a1a10'); P.r(cx - 2, by, 5, 4, '#c8903a'); P.p(cx - 3, by + 1, '#ffb040'); P.p(cx - 1, by, '#1a1010'); P.r(cx + 1, by + 1, 3, 2, '#a8702a'); }
  }
  function gondolaLive(ctx, P, t, k) { // tapped Venice: a gondola glides along the canal (clipped to the wallpaper)
    if (k < 0) return; const x = Math.round(-18 + 84 * k), y = 168 + Math.round(Math.sin(t * 2.4) * 0.6);
    ctx.save(); ctx.beginPath(); ctx.rect(0, CEIL + 7, MURAL - 3, FLOOR - CEIL - 13); ctx.clip();
    for (let i = 0; i < 18; i++) { const up = Math.round(Math.pow((i - 9) / 9, 2) * 3); P.r(x + i, y - up, 1, 2 + (i > 3 && i < 15 ? 1 : 0), '#141010'); } P.r(x + 16, y - 6, 1, 4, '#141010'); P.r(x + 15, y - 6, 3, 1, '#c8a050');
    P.r(x + 5, y - 8, 3, 6, '#ffffff'); P.r(x + 5, y - 7, 3, 1, '#1a1a3a'); P.r(x + 5, y - 5, 3, 1, '#1a1a3a'); P.r(x + 5, y - 10, 3, 2, '#e8c090'); P.r(x + 4, y - 11, 5, 1, '#e8d070'); P.r(x + 5, y - 12, 3, 1, '#e8d070'); P.p(x + 5, y - 12, '#c94f4f');
    P.line(x + 8, y - 7, x + 12, y + 3, '#5a3a22'); ctx.globalAlpha = 0.5; P.r(x - 2, y + 3, 22, 1, '#c9a062'); ctx.globalAlpha = 1; ctx.restore();
  }
  function dyn(ctx, P, H, t, st) {
    const it = H.items, g = st.g || {};
    if (it.kettle) kettleLive(ctx, P, t, st.th && st.th.kettle); if (it.micro) microLive(ctx, P, t, st.th && st.th.micro);
    stoveLive(ctx, P, t, g.cook); cabsLive(ctx, P, g.cab); drawersLive(ctx, P, g.drawer);
    if (st.fridge > 0) fridgeOpen(ctx, P, t, st.fridge);
    gondolaLive(ctx, P, t, g.gondola === undefined ? -1 : g.gondola);
    R.sprAt(ctx, spr('chair'), CHAIR2[0] + Math.round((g.chair || 0) * 1.6), CHAIR2[1]); R.sprAt(ctx, spr('table'), TABLE[0], TABLE[1]); if (it.candles) { candles(P); candlesLive(ctx, P, t, !!g.candles); }
    { const cx = CHAIR[0] + Math.round(st.chairDx || 0); P.shadow(cx + 11, CHAIR[1] + 52, 12, 2, 0.25); R.sprAt(ctx, spr('chair'), cx, CHAIR[1]); }
    if (it.clock) clockLive(ctx, P, t, g.clock === undefined ? -1 : g.clock);
    if (st.lamp === false) {
      for (const x of [30, 90, 150]) { P.r(x - 2, 9, 5, 2, '#7a746c'); P.p(x, 8, '#5a544c'); }
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#b8b4c8'; ctx.fillRect(0, 0, RW, RH); ctx.restore();
    } else {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.08;
      for (const x of [30, 90, 150]) for (const r of [16, 10, 6]) P.circ(x, 10, r, '#fff4cc');
      ctx.restore();
    }
    if (it.lamp && st.lamp !== false) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.07; for (const r of [26, 18, 11]) P.circ(62, FLOOR - 78, r, '#ffe9a0'); ctx.restore(); }
    if (it.disco) { P.vl(100, CEIL + 7, 10, '#6b6b78'); R.sprAt(ctx, fur('disco', R.FUR.disco), 91, CEIL + 16);
      for (let k = 0; k < 14; k++) { const ph = (t * 0.6 + k * 0.37) % 1, cyc = Math.floor(t * 0.6 + k * 0.37); const x = (hash(k, 1, cyc) * RW) | 0, y = 50 + ((hash(k, 2, cyc) * 170) | 0); ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.6; P.r(x, y, 2, 2, ['#ff5c6c', '#ffd23a', '#3fdc7a', '#59c1ff', '#b48cff'][k % 5]); } ctx.globalAlpha = 1; }
  }
  function spots(it) {
    return { fridge: FRIDGE.slice(), sofa: SOFA.slice(), table: [TABLE[0], TABLE[1], 46, 44], chair: [CHAIR[0], CHAIR[1], 22, 52], kettle: it && it.kettle ? KET.slice() : null, micro: it && it.micro ? MW.slice() : null,
      counter: [CAB[0], CTR, CAB[1] - CAB[0], FLOOR - CTR], stool: STOOL.slice(), stoolAt: [PAN[0] - 14, FLOOR + 8], // Round 14b #8: the step stool (its home on the floor; where it stands at the counter)
      stove: [PAN[0], PAN[1] - 2, PAN[2], OVEN[1] + OVEN[3] - PAN[1] + 2], pan: PAN.slice(), oven: OVEN.slice(), cactus: [MW[0] + 6, cactusY(it), 14, 22], cabs: CABS.map((r) => r.slice()), cabL: CABS[0].slice(), cabR: CABS[2].slice(),
      drawers: DRAWERS.map((r) => r.slice()), drawer: DRAWERS[1].slice(), candles: it && it.candles ? CANDLES.slice() : null, clock: [146, 56, 22, 22], mural: [0, CEIL + 7, MURAL, 140], sofaGap: [4, 198, 16, 16], chair2: [CHAIR2[0], CHAIR2[1], 22, 52], disco: [91, CEIL + 16, 18, 18], lamp: [44, FLOOR - 96, 36, 104], ceilingLight: [10, 0, 135, 65], light: [10, 0, 135, 65], pusya: [34, 207], visit: [148, 280], visitFly: [128, 276, 90], party: { monty: [146, 282], mosq: [124, 276, 96], zhuk: [30, 290] } };
  }
  // when he walks behind the table to the fridge, the table and chairs are drawn again over him
  function front(ctx, P, H, t, st) { if (st.behind) { R.sprAt(ctx, spr('chair'), CHAIR2[0], CHAIR2[1]); R.sprAt(ctx, spr('table'), TABLE[0], TABLE[1]); if (H.items.candles) { candles(P); candlesLive(ctx, P, t, !!(st.g && st.g.candles)); } R.sprAt(ctx, spr('chair'), CHAIR[0] + Math.round(st.chairDx || 0), CHAIR[1]); } }
  const thumb = (fn, w, h, x0, y0) => { const c = PX.canvas(w, h), x = c.getContext('2d'); x.translate(-x0, -y0); fn(x, Painter(x)); return c; };
  R.register('kitchen', { bg, floor, dyn, front, spots, thumbs: { kettle: () => spr('kettle'), micro: () => spr('micro'), candles: () => thumb((c, P) => candles(P), 13, 16, 120, 201) } });
  return { spots };
})();
