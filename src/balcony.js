'use strict';
// ===== Балкон — drawn by hand from the user's photo (IMG_7780) =====
// warm wooden lining (вагонка) on the ceiling and the parapet, a long white PVC window with the city outside (lit windows at night);
// left: the palm in a big planter box of soil — Крот Монти lives in it; right: the desk with the computer (3 upgrade steps, tap → mini-games)
// and the black office chair; tulle on the right sash. Round 7: the sill is free for bought things (lava lamp, radio).
// The room is drawn as a layer with transparent glass so clouds (and the bird at the feeder) can drift behind the window frame.
const BALCONY = (() => {
  const SP = MONKEY.sprite, K = MONKEY.K, IT = K.IT, ITC = K.ITC, R = ROOMS, RW = R.RW, RH = R.RH, FLOOR = R.FLOOR, GROUND = R.GROUND, fur = R.fur, hash = PX.hash;
  // ---- layout (canvas px): art, hotspots and tests read these ----
  const CEIL = 22, GL = [0, 32, RW, 96], SILL = 132, SASH = [[4, 58], [62, 118], [122, 176]], DESK = [114, 172], CHAIR = [128, 174], BOX = [-4, 236, 82, 38], TREE = [-14, 54];
  const SLOTS = [[14, 60], [25, 66], [36, 60], [19, 72], [31, 74]], MONTY = [48, 256], HAM = [24, 146], TEL = [104, 98], FLO = [78, 112], FEED = [82, 34], LAVA = [158, 96], RADIO = [52, 114]; // Round 7 #5: the sill basket + table lamp are gone; bought things go there
  const PCS = { old: { at: [124, 132], scr: [132, 137, 26, 19] }, laptop: { at: [128, 148], scr: [134, 150, 26, 16] }, tower: { at: [116, 130], scr: [137, 132, 38, 22] } };
  const pcLvl = (it) => (PCS[it.pc] ? it.pc : null); // Round 6 E: null = no computer yet (an empty desk)
  // ---------- sprites ----------
  const S = {
    // old beige CRT monitor + beige keyboard
    old: () => SP(46, 40, (a) => {
      const bg = a.mat('bPcB', '#d8cfb8', 2), bd = a.mat('bPcD', '#bdb39a', 2);
      a.rbox(4, 0, 42, 30, 3, IT, bg, { bulge: 0.3 }); a.rbox(10, 28, 36, 33, 1, IT, bd); a.box(14, 33, 32, 35, IT, bg);
      a.box(7, 4, 35, 25, IT, a.mat('bPcScr', '#2a3a2e'), { flat: 0.8 });
      a.rbox(0, 35, 40, 40, 1, IT, bg, { flat: 0.5 });
    }, (d) => { for (let x = 2; x < 38; x += 2) { d.px(x, 37, '#a89e86'); if (x % 4) d.px(x + 1, 38, '#a89e86'); } d.px(36, 27, '#3fdc7a'); d.hline(31, 34, 27, '#9a917a'); }),
    // silver laptop
    laptop: () => SP(40, 26, (a) => {
      const sv = a.mat('bLap', '#b8bcc4', 2);
      a.rbox(5, 0, 35, 21, 1.5, IT, sv); a.box(6, 2, 34, 19, IT, a.mat('bLapScr', '#1e2a44'), { flat: 0.8 });
      a.poly([[2, 21], [38, 21], [40, 26], [0, 26]], IT, a.mat('bLapB', '#cdd1d8', 2));
    }, (d) => { for (let x = 6; x < 34; x += 2) d.px(x, 23, '#8a8e96'); d.hline(16, 24, 25, '#a4a8b0'); }),
    // black wide monitor + black tower with a blue light + black keyboard with colour keys
    tower: () => SP(64, 44, (a) => {
      const bk = a.mat('bTw', '#1c1c22', 2), bk2 = a.mat('bTw2', '#2a2a32', 2);
      a.rbox(0, 8, 15, 44, 1.5, IT, bk2, { bulge: 0.2 });
      a.rbox(19, 0, 62, 26, 1, IT, bk); a.box(21, 2, 60, 24, IT, a.mat('bTwScr', '#12141c'), { flat: 0.8 });
      a.box(38, 26, 43, 37, IT, bk); a.rbox(30, 37, 51, 40, 1, IT, bk);
      a.rbox(20, 40, 62, 44, 1, IT, bk2, { flat: 0.5 });
    }, (d) => { for (let y = 12; y < 42; y++) d.px(13, y, y % 6 < 3 ? '#3a8cff' : '#59c1ff'); for (let x = 3; x < 11; x += 2) d.px(x, 14, '#4a4a54'); d.px(4, 38, '#3fdc7a');
      const C = ['#ff5c6c', '#ffd23a', '#3fdc7a', '#59c1ff', '#b48cff']; for (let x = 22; x < 60; x += 2) d.px(x, 42, C[(x / 2) % 5]); }),
    // black desk: top + two legs (Round 11 #3: no drawer block on the right any more — you see the wall through it)
    desk: () => SP(70, 66, (a) => {
      const bk = a.mat('bDesk', '#24222a', 2), bt = a.mat('bDeskT', '#34323c', 2);
      a.box(0, 0, 70, 5, IT, bt); a.box(2, 5, 6, 66, IT, bk); a.box(64, 5, 68, 66, IT, bk);
    }, (d) => { d.hline(0, 69, 0, '#4a4852'); }),
    // black mesh office chair seen from the back: headrest, tall back, armrests, gas lift, 5-star base on wheels
    chair: () => SP(44, 92, (a) => {
      const bk = a.mat('bCh', '#1a1a20', 2), ms = a.mat('bChMesh', '#2a2a32', 3), ch = a.mat('chrome', '#c2c8d0');
      a.rbox(12, 0, 32, 9, 3, IT, ms); a.box(20, 9, 24, 14, IT, bk);
      a.rbox(4, 13, 40, 54, 6, IT, ms, { bulge: 0.3 }); a.rbox(8, 17, 36, 50, 4, IT, a.mat('bChIn', '#22222a', 3), { flat: 0.6 });
      a.rbox(0, 48, 8, 52, 1.5, IT, bk); a.rbox(36, 48, 44, 52, 1.5, IT, bk); a.box(2, 52, 5, 58, IT, bk); a.box(39, 52, 42, 58, IT, bk);
      a.rbox(4, 54, 40, 62, 3, IT, bk); a.box(20, 62, 24, 78, IT, ch);
      a.tube([[22, 79, 1.4], [3, 84, 1.2]], IT, bk); a.tube([[22, 79, 1.4], [41, 84, 1.2]], IT, bk); a.tube([[22, 79, 1.4], [12, 87, 1.2]], IT, bk); a.tube([[22, 79, 1.4], [32, 87, 1.2]], IT, bk);
      for (const [x, y] of [[3, 87], [41, 87], [12, 90], [32, 90]]) a.ell(x, y, 2.2, 2, IT, a.mat('bChW', '#101014'));
    }, (d) => { for (let y = 19; y < 49; y += 3) for (let x = 10; x < 35; x += 3) if (d.on(x, y)) d.shade(x, y, 1); d.hline(10, 34, 15, '#3a3a44'); }),
    // Round 7 #5 (bought): a lava lamp — chrome cap and cone base, a glass capsule of violet liquid (the wax blobs are drawn live in dyn)
    lava: () => SP(14, 36, (a) => {
      const cr = a.mat('bLavaC', '#9aa2b4', 2);
      a.poly([[5, 0], [9, 0], [10, 6], [4, 6]], IT, cr);
      a.poly([[4, 6], [10, 6], [12, 24], [2, 24]], IT, a.mat('bLavaG', '#6a3a8a', 1), { flat: 0.7 });
      a.poly([[2, 24], [12, 24], [14, 36], [0, 36]], IT, cr);
    }, (d) => { for (let y = 8; y < 23; y += 3) d.px(4 + Math.floor((y - 6) / 9), y, '#c8a8e0'); d.hline(1, 12, 30, '#7a8294'); }),
    // Round 7 #5 (bought): a red retro radio — handle, speaker grille, a dial, a telescopic antenna
    radio: () => SP(26, 18, (a) => {
      const rd = a.mat('bRadio', '#c8463a', 2);
      a.tube([[6, 5, 0.8], [8, 1, 0.8], [17, 1, 0.8], [19, 5, 0.8]], IT, a.mat('bRadioH', '#3b2433'));
      a.tube([[21, 5, 0.5], [25, 0, 0.4]], IT, a.mat('chrome', '#c2c8d0'));
      a.rbox(0, 4, 26, 18, 2, IT, rd, { bulge: 0.25 });
      a.rbox(2, 7, 14, 16, 1, IT, a.mat('bRadioG', '#eadcc0', 1), { flat: 0.6 });
      a.ell(19.5, 11, 3.2, 3.2, IT, a.mat('bRadioD', '#f4e8c8', 1));
    }, (d) => { for (let y = 8; y < 16; y += 2) for (let x = 3; x < 14; x += 2) d.px(x + (y % 4 ? 1 : 0), y, '#8a7a64'); d.px(19, 9, '#3b2433'); d.px(19, 10, '#3b2433'); d.hline(16, 23, 16, '#9a2e26'); }),
    // striped hammock strung from the palm trunk to a hook in the wall (same red/yellow as the old yard one)
    hammock: () => SP(86, 36, (a) => {
      const rp = a.mat('bRope', '#d8c49c'), pts = [];
      for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([6 + t * 74, 6 + Math.sin(Math.PI * t) * 24, 1.8 + Math.sin(Math.PI * t) * 2.6]); }
      a.tube([[1, 3, 0.6], [7, 6, 0.6]], IT, rp); a.tube([[1, 9, 0.6], [7, 6, 0.6]], IT, rp); a.tube([[79, 6, 0.6], [85, 2, 0.6]], IT, rp);
      a.tube(pts, IT, a.mat('hamm', '#e8504a', 3)); a.rbox(83, 0, 86, 4, 1, IT, a.mat('chrome', '#c2c8d0'));
    }, (d) => { for (let x = 9; x < 78; x += 5) { const t = (x - 6) / 74, y = Math.round(6 + Math.sin(Math.PI * t) * 24); d.pxk(x, y, '#ffd23a', 1 << IT); d.pxk(x, y + 1, '#ffd23a', 1 << IT); }
      for (let x = 12; x < 76; x += 4) { const t = (x - 6) / 74, y = Math.round(6 + Math.sin(Math.PI * t) * 24) + 3; if (d.on(x, y)) d.px(x, y + 1, '#ffd23a'); } }),
    // tiny telescope on a tripod (stands on the sill, looks up at the sky)
    telescope: () => SP(26, 34, (a) => {
      const bk = a.mat('bTelL', '#3a3a44');
      a.tube([[13, 20, 0.6], [5, 34, 0.6]], IT, bk); a.tube([[13, 20, 0.6], [21, 34, 0.6]], IT, bk); a.tube([[13, 20, 0.6], [13, 34, 0.6]], IT, bk);
      a.tube([[2, 6, 3.4], [22, 17, 2.4]], IT, a.mat('bTel', '#2e5fae', 2)); a.tube([[1, 5.5, 3.8], [4, 7.2, 3.8]], IT, a.mat('chrome', '#c2c8d0')); a.tube([[22, 17, 1.4], [25, 19, 1.2]], IT, bk);
    }, (d) => { d.px(12, 10, '#7aa8ee'); d.px(14, 11, '#7aa8ee'); }),
    // planter on the sill with red, yellow and pink flowers
    flowers: () => SP(30, 22, (a) => {
      const st = a.mat('bStem', '#4f9e45');
      for (let k = 0; k < 7; k++) { const x = 3 + k * 4; a.tube([[x, 14, 0.5], [x + (k % 2 ? 1 : -1), 4 + (k % 3) * 2, 0.5]], IT, st); }
      const C = ['#e8403a', '#ffd23a', '#f47aa8', '#ffffff', '#e8403a', '#b48cff', '#ffd23a'];
      for (let k = 0; k < 7; k++) { const x = 3 + k * 4 + (k % 2 ? 1 : -1), y = 4 + (k % 3) * 2; a.ell(x, y, 2.2, 2, IT, a.mat('bFl' + k, C[k])); }
      a.rbox(0, 12, 30, 22, 1, IT, a.mat('bFlBox', '#c8704a', 2), { bulge: 0.2 });
    }, (d) => { for (let k = 0; k < 7; k++) { const x = 3 + k * 4 + (k % 2 ? 1 : -1), y = 4 + (k % 3) * 2; d.px(x, y, '#ffe9a0'); } d.hline(1, 28, 14, '#a85a3a'); }),
    // bird house feeder on a string (hangs outside the window)
    feeder: () => SP(18, 26, (a) => {
      const wd = a.mat('bFeed', '#b07a46', 2);
      a.tube([[9, 0, 0.4], [9, 6, 0.4]], IT, a.mat('bRope', '#d8c49c'));
      a.poly([[0, 13], [9, 5], [18, 13]], IT, a.mat('bFeedR', '#8a4a2a', 2)); a.box(2, 12, 16, 24, IT, wd); a.box(0, 23, 18, 26, IT, wd);
    }, (d) => { d.px(8, 16, '#3a2414'); d.px(9, 16, '#3a2414'); d.px(8, 17, '#3a2414'); d.px(9, 17, '#3a2414'); for (const x of [3, 6, 12, 15]) d.px(x, 23, '#e8c870'); }),
    // the planter box front (drawn over Монти and the gnome: they are IN the soil)
    boxFront: () => SP(BOX[2], RH - BOX[1] - 10, (a) => {
      const wd = a.mat('bBoxW', '#9a6a3e', 2), wd2 = a.mat('bBoxW2', '#86592f', 2);
      for (let k = 0; k < 4; k++) a.box(0, 10 + k * 7, BOX[2], 17 + k * 7, IT, k % 2 ? wd2 : wd);
      a.box(0, 8, BOX[2], 11, IT, a.mat('bBoxTop', '#b8844e', 2)); a.box(BOX[2] - 6, 8, BOX[2], 38, IT, a.mat('bBoxC', '#6e4424', 2));
    }, (d) => { for (let k = 1; k < 4; k++) d.hline(0, BOX[2] - 7, 10 + k * 7, '#5e3a1e'); for (let k = 0; k < 18; k++) { const x = Math.floor(hash(k, 1, 31) * (BOX[2] - 8)), y = 12 + Math.floor(hash(k, 2, 31) * 24); if (d.on(x, y)) d.shade(x, y, -1); } }),
  };
  const spr = (k, ...a) => fur('balc_' + k + a.join('_'), () => S[k](...a));
  // ---------- outside: sky + city ----------
  const CITY = { day: ['#a9bccd', '#8598ad', '#c8d6e2'], morning: ['#c5b3c8', '#9a8aa8', '#e6d0d8'], evening: ['#8a6a8a', '#5a4466', '#ffd27a'], night: ['#1e2850', '#121832', '#ffd27a'] };
  function city(P, ph) {
    const [far, near, win] = CITY[ph] || CITY.day, lit = ph === 'night' ? 0.45 : ph === 'evening' ? 0.25 : 0, y1 = GL[1] + GL[3];
    for (let x = 0, k = 0; x < RW; k++) { const w = 10 + Math.floor(hash(k, 1, 5) * 14), top = 82 + Math.floor(hash(k, 2, 5) * 16); P.r(x, top, w, y1 - top, far); x += w; }
    P.r(118, 56, 2, 30, far); P.r(117, 70, 4, 2, far); P.p(118, 55, ph === 'night' ? '#ff5c6c' : far); // a tall mast far away
    for (let x = -4, k = 0; x < RW; k++) {
      const w = 14 + Math.floor(hash(k, 3, 6) * 18), top = 96 + Math.floor(hash(k, 4, 6) * 18); P.r(x, top, w, y1 - top, near); P.r(x, top, w, 1, PX.shade(near, 1.12));
      for (let wy = top + 3; wy < y1 - 2; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 4) { const on = hash(wx, wy, 9) < lit; P.r(wx, wy, 2, 2, on ? win : lit ? PX.shade(near, 1.25) : win); if (!lit) P.p(wx, wy + 1, PX.shade(near, 0.92)); }
      x += w + 1;
    }
  }
  // ---------- the room (glass left transparent) ----------
  function boards(P, x, y, w, h, base, seed) { // horizontal tongue-and-groove lining
    P.r(x, y, w, h, base); const hi = PX.shade(base, 1.14), gr = PX.shade(base, 0.68), dk = PX.shade(base, 0.86);
    for (let yy = y; yy < y + h; yy += 7) { P.r(x, yy, w, 1, gr); P.r(x, yy + 1, w, 1, hi); }
    for (let k = 0; k < Math.round(w * h / 30); k++) { const gx = x + Math.floor(hash(k, 1, seed) * w), gy = y + Math.floor(hash(k, 2, seed) * h); if ((gy - y) % 7 > 1) P.r(gx, gy, 2 + (k % 4), 1, dk); }
  }
  function windowFrame(ctx, P) {
    const W = '#f4f4f0', Wd = '#d6d6d0', Wl = '#ffffff';
    P.r(0, 28, RW, 4, W); P.r(0, 31, RW, 1, Wd); P.r(0, 128, RW, 4, W); P.r(0, 128, RW, 1, Wd);
    for (const x of [0, 58, 118, 176]) { P.r(x, 28, 4, 104, W); P.r(x + 3, 32, 1, 96, Wd); P.r(x, 32, 1, 96, Wl); }
    for (const [x0, x1] of SASH) if (x0 !== SASH[1][0]) sashBar(P, x0, x1); // the middle sash opens (Round 5 D): its bar + handle are live (dyn)
    // sill
    P.r(0, SILL, RW, 5, '#f8f8f4'); P.r(0, SILL, RW, 1, '#ffffff'); P.r(0, SILL + 5, RW, 1, '#c8c6be');
    ctx.globalAlpha = 0.25; P.r(0, SILL + 6, RW, 4, '#2a1408'); ctx.globalAlpha = 1;
  }
  function sashBar(P, x0, x1) { P.r(x0, 32, x1 - x0, 3, '#eceae4'); P.r(x0, 35, x1 - x0, 1, '#c8c6be'); P.r(x1 - 4, 76, 2, 6, '#e0e0da'); P.p(x1 - 4, 76, '#ffffff'); }
  function tulle(ctx, P) { // sheer white curtain on the right sash
    const [x0, x1] = SASH[2];
    for (let x = x0 - 2; x < x1 + 2; x++) { const f = Math.sin((x - x0) / 3.2) * 0.5 + 0.5; ctx.globalAlpha = 0.28 + f * 0.22; P.r(x, 33, 1, 98, '#ffffff'); }
    ctx.globalAlpha = 0.5; for (let x = x0; x < x1; x += 4) P.p(x + 1, 129, '#ffffff'); ctx.globalAlpha = 1;
    P.r(x0 - 4, 28, x1 - x0 + 8, 2, '#c8c6be');
  }
  function floor(ctx, P, H = RH) { // big beige ceramic tiles in perspective; Round 25: H — further down (FILL)
    P.r(0, FLOOR, RW, H - FLOOR, '#d8cbb2');
    const VX = 90, VY = 110; let y = FLOOR, dy = 6;
    while (y < H) { P.r(0, y, RW, 1, '#c2b398'); P.r(0, y + 1, RW, 1, '#e2d7c2'); y += dy; dy = Math.round(dy * 1.45); }
    for (let i = -4; i <= 10; i++) { const xb = -60 + i * 34, xt = VX + (xb - VX) * (FLOOR - VY) / (RH - VY); P.line(xt, FLOOR, xb, RH, '#c2b398'); if (H > RH) P.line(xb, RH, xb + (xb - xt) * (H - RH) / (RH - FLOOR), H, '#c2b398'); }
    for (let k = 0; k < 60; k++) P.p(Math.floor(hash(k, 1, 44) * RW), FLOOR + 4 + Math.floor(hash(k, 2, 44) * (RH - FLOOR - 4)), k % 2 ? '#cfc1a6' : '#e4dac6');
    for (let j = 0; j < 12; j++) { ctx.globalAlpha = 0.2 * (1 - j / 12); P.r(0, FLOOR + j, RW, 1, '#2a1408'); } ctx.globalAlpha = 1;
  }
  function soil(P) { // top of the planter box: dark soil + Монти's burrow
    const [x, y, w] = BOX; P.r(x, y, w, 10, '#4a3020'); P.r(x, y, w, 1, '#6a4a32');
    for (let k = 0; k < 40; k++) P.p(x + Math.floor(hash(k, 1, 12) * w), y + 1 + Math.floor(hash(k, 2, 12) * 9), k % 3 ? '#5a3c28' : '#3a2416');
    P.ell(MONTY[0], y + 7, 16, 4, '#2a1a10'); P.ell(MONTY[0] - 11, y + 3, 4, 2, '#5e4030'); P.ell(MONTY[0] + 12, y + 4, 4, 2, '#5e4030');
  }
  function drawRoom(ctx, P, H, ph) {
    const it = H.items, lvl = pcLvl(it);
    boards(P, 0, 0, RW, CEIL, '#5a3422', 3); for (let j = 0; j < 8; j++) { ctx.globalAlpha = 0.3 * (1 - j / 8); P.r(0, j, RW, 1, '#1a0c06'); } ctx.globalAlpha = 1;
    P.r(0, CEIL, RW, 1, '#3a2014'); boards(P, 0, CEIL + 1, RW, 5, '#7b4a2e', 4); P.r(0, 27, RW, 1, '#4e2a18');
    windowFrame(ctx, P);
    if (it.flowers) R.sprAt(ctx, spr('flowers'), FLO[0], SILL - 20);
    if (it.radio) R.sprAt(ctx, spr('radio'), RADIO[0], RADIO[1]);
    if (it.telescope) R.sprAt(ctx, spr('telescope'), TEL[0], TEL[1]);
    tulle(ctx, P);
    if (it.lava) R.sprAt(ctx, spr('lava'), LAVA[0], LAVA[1]);
    boards(P, 0, SILL + 6, RW, FLOOR - SILL - 6, '#7b4a2e', 7);
    ctx.globalAlpha = 0.3; P.r(0, SILL + 6, RW, 4, '#2a1408'); ctx.globalAlpha = 1;
    P.r(0, FLOOR - 5, RW, 5, '#4e2a18'); P.r(0, FLOOR - 5, RW, 1, '#6e4428');
    floor(ctx, P);
    // palm in the planter box (Монти lives in the soil)
    R.sprAt(ctx, fur('tree', R.FUR.tree), TREE[0], TREE[1]);
    soil(P);
    // the gnome and the hammock are live (dyn): they bounce / swing when tapped
    // desk, computer, chair
    P.shadow(DESK[0] + 36, FLOOR + 8, 34, 3, 0.25); R.sprAt(ctx, spr('desk'), DESK[0], DESK[1]);
    if (lvl) R.sprAt(ctx, spr(lvl), PCS[lvl].at[0], PCS[lvl].at[1]);
    else { P.r(DESK[0] + 22, DESK[1] + 6, 22, 2, '#5a3a24'); ctx.globalAlpha = 0.35; P.r(DESK[0] + 14, DESK[1] + 4, 38, 1, '#f4e6c8'); ctx.globalAlpha = 1; } // a dust-free rectangle where a computer will stand
    P.shadow(150, 264, 22, 3, 0.3); R.sprAt(ctx, spr('chair'), CHAIR[0], CHAIR[1]);
    if (it.flamingo) { P.shadow(167, 300, 9, 2, 0.25); R.sprAt(ctx, fur('flamingo', R.FUR.flamingo), 156, 250); }
  }
  let layer = null, layerKey = '';
  function roomLayer(H, ph) {
    const key = JSON.stringify(H.items) + '|' + ph; if (layer && key === layerKey) return layer;
    const c = PX.canvas(RW, RH), x = c.getContext('2d'); drawRoom(x, Painter(x), H, ph); layer = c; layerKey = key; return c;
  }
  // ---------- builders ----------
  function bg(ctx, P, H, ph) { // what is behind the glass (the room itself is drawn by dyn on top of the drifting clouds)
    R.drawSky(ctx, P, GL[0], GL[1], GL[2], GL[3], ph, true); city(P, ph);
    if (H.items.feeder) R.sprAt(ctx, spr('feeder'), FEED[0], FEED[1]);
  }
  function dyn(ctx, P, H, t, st) {
    const it = H.items, ph = R.phase(), lvl = pcLvl(it);
    if (ph !== 'night') { ctx.save(); ctx.beginPath(); ctx.rect(GL[0], GL[1], GL[2], 50); ctx.clip(); ctx.globalAlpha = 0.92;
      for (let k = 0; k < 3; k++) { const x = ((t * (2 + k) + k * 70) % (RW + 60)) - 30; R.cloud(P, x, 44 + k * 10, 0.5 + k * 0.12); } ctx.restore(); }
    if (typeof SEASONS !== 'undefined') SEASONS.sky(ctx, P, 'balcony', GL); // Round 10 #8: the event's weather outside (the frames are drawn over it)
    if (it.feeder) { const hop = Math.floor(t / 1.7) % 3, bx = FEED[0] + 2 + hop * 5, by = FEED[1] + 21 - (t % 1.7 < 0.15 ? 2 : 0); // a sparrow pecking seeds
      P.ell(bx + 2, by, 2.6, 2, '#8a6a48'); P.p(bx, by - 2, '#6a4a30'); P.p(bx - 1, by - 2, '#e8a030'); P.p(bx + 1, by - 2, '#1a1010'); P.p(bx + 4, by - 1, '#5a3a24'); }
    const g = st.g || {}, wb = (g.win && g.win.balcony) || 0;
    if (wb > 0) sashOpen(ctx, P, wb);
    ctx.drawImage(roomLayer(H, ph), 0, 0);
    if (wb <= 0) sashBar(P, SASH[1][0], SASH[1][1]); else tulleStir(ctx, P, wb, g.gust || 0, t);
    if (it.gnome) R.sprAt(ctx, fur('gnome', R.FUR.gnome), -1, BOX[1] - 22 - Math.round((g.gnome || 0) * 4));
    if (it.hammock) { const k = (g.ham || 0) * 0.12; ctx.save(); ctx.imageSmoothingEnabled = false; ctx.transform(1, 0, k, 1, -k * HAM[1], 0); ctx.drawImage(spr('hammock'), HAM[0], HAM[1]); ctx.restore(); }
    // Round 11 #3: the drawer block (and its «stash» drawer) is gone
    // bananas on the palm
    const ts = st.treeSlots; for (let k = 0; k < 5; k++) { if (!ts || !ts[k]) continue; const [x, y] = SLOTS[k], sw = Math.sin(t * 2 + k) * 0.6; R.sprAt(ctx, fur('banana1', R.FUR.banana1), x - 11 + sw, y + 8); }
    if (lvl) pcScreen(ctx, P, lvl, t);
    if (it.lava) lava(ctx, P, t, !!st.balLamp, ph);
    if (it.radio && st.radio) { const [x, y] = RADIO, k = Math.floor(t * 6) % 2; P.r(x + 17, y + 6, 6, 2, '#ffd23a'); P.p(x + 19 + k, y + 10, '#ff5a3a'); if (k) { P.r(x + 1, y + 6, 14, 1, '#ffffff'); } } // dial lit, the needle wiggles, the grille thumps
  }
  // the lava lamp: three wax blobs rise and sink in the capsule (only while it is on — off they rest at the bottom, the glass is dark)
  function lava(ctx, P, t, on, ph) {
    const [x0, y0] = LAVA, half = (y) => 3 + (y - 6) * 0.17; // capsule half-width at row y (sprite coords)
    if (!on) { ctx.globalAlpha = 0.45; for (let y = 7; y < 24; y++) P.r(x0 + 7 - Math.floor(half(y)), y0 + y, Math.floor(half(y)) * 2, 1, '#2a1838'); ctx.globalAlpha = 1; P.ell(x0 + 7, y0 + 22, 3.5, 1.6, '#8a4a2a'); return; }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = ph === 'night' ? 0.12 : ph === 'evening' ? 0.09 : 0.05; for (const r of [26, 17, 10]) P.circ(x0 + 7, y0 + 16, r, '#ff7ad0'); ctx.restore();
    for (let k = 0; k < 3; k++) { const y = 15 + Math.sin(t * (0.55 + k * 0.17) + k * 2.1) * 7.5, x = 7 + Math.sin(t * 0.8 + k * 1.7) * Math.max(0, half(y) - 3), r = 1.6 + (k === 1 ? 0.8 : 0) + Math.sin(t * 1.3 + k) * 0.3;
      P.ell(x0 + x, y0 + y, r, r * 1.25, '#ff9a3a'); P.p(Math.round(x0 + x - 0.6), Math.round(y0 + y - r * 0.6), '#ffd890'); }
    P.ell(x0 + 7, y0 + 22.5, 4, 1.4, '#ff8a3a');
  }
  // ---------- Round 5 D: the middle sash opens outward (hinged on the left; ~150° → it ends up outside, behind the left sash) ----------
  function sashOpen(ctx, P, wb) {
    const [x0, x1] = SASH[1], a = wb * 2.618, xf = x0 + (x1 - x0) * Math.cos(a), sh = 0.12 * Math.sin(a) * 96, L = Math.floor(Math.min(xf, x0)), Rx = Math.ceil(Math.max(xf, x0));
    for (let x = L; x <= Rx; x++) {
      const u = Math.max(0, Math.min(1, (x - x0) / ((xf - x0) || 1))), top = Math.round(32 + sh * u / 2), bot = Math.round(128 - sh * u / 2), edge = x <= L + 1 || x >= Rx - 1;
      if (edge) { P.r(x, top, 1, bot - top, '#e4e4de'); continue; }
      ctx.globalAlpha = 0.45; P.r(x, top + 3, 1, bot - top - 6, '#dff0ff'); ctx.globalAlpha = 0.7; P.p(x, Math.round(top + 14 + (x - L) * 0.9), '#ffffff'); P.p(x, Math.round(top + 18 + (x - L) * 0.9), '#ffffff'); ctx.globalAlpha = 1;
      P.r(x, top, 1, 3, '#e4e4de'); P.r(x, bot - 3, 1, 3, '#d8d8d2');
    }
    const hx = Math.round(xf + (xf > x0 ? -3 : 2)), u = 1; if (Rx - L > 4) P.r(hx, Math.round(76 + sh * u / 4), 2, 5, '#d0d0ca');
  }
  function tulleStir(ctx, P, wb, gust, t) { // the right sash's tulle stirs in the draught
    const [x0, x1] = SASH[2], A = wb * (1.5 + 2.5 * gust); ctx.globalAlpha = 0.22;
    for (let i = 0; i < 6; i++) for (let y = 33; y < 130; y++) P.p(x0 + 2 + i * 9 + Math.round(A * Math.sin(y / 10 + t * 2.4 + i)), y, '#ffffff');
    ctx.globalAlpha = 1;
  }
  function pcScreen(ctx, P, lvl, t) { // the screen is always on: DOS text (old), a desktop (laptop), a running game (tower)
    const [x, y, w, h] = PCS[lvl].scr;
    if (lvl === 'old') { P.r(x, y, w, h, '#0e1a12'); const n = Math.floor(t * 2); for (let j = 0; j < 4; j++) { const len = 4 + Math.floor(hash(j + n, 1, 3) * (w - 8)); P.r(x + 2, y + 2 + j * 4, len, 1, '#3fdc7a'); } if (Math.floor(t * 2) % 2) P.r(x + 2, y + 18, 3, 1, '#9affb0'); }
    else if (lvl === 'laptop') { R.vgrad(P, x, y, w, h, ['#2e5fae', '#59a1e8']); for (let j = 0; j < 3; j++) P.r(x + 2, y + 2 + j * 5, 3, 3, ['#ffd23a', '#f4f4f0', '#3fdc7a'][j]); P.r(x + 9, y + 3, 14, 9, '#f4f4f0'); P.r(x + 9, y + 3, 14, 2, '#3a3a44'); P.r(x + 11, y + 7, 6 + Math.floor(t * 3) % 6, 1, '#59a1e8'); P.r(x, y + h - 2, w, 2, '#1e2a44'); }
    else { R.vgrad(P, x, y, w, h, ['#69b9ee', '#bfe6f8']); P.r(x, y + h - 5, w, 5, '#5fae45'); P.r(x, y + h - 5, w, 1, '#8fd36a');
      const sc = (t * 14) % 60; for (const px of [10, 34, 52]) { const bx = x + ((px - sc + 60) % 60) * w / 60; P.r(bx, y + h - 9, 4, 4, '#b8844e'); }
      const jy = Math.abs(Math.sin(t * 3.2)) * 7; P.ell(x + 9, y + h - 8 - jy, 2.6, 2.6, '#8a8890'); P.p(x + 10, y + h - 9 - jy, '#1a1414');
      for (let k = 0; k < 2; k++) { const cx = x + ((k * 23 - t * 4) % w + w) % w; P.r(cx, y + 3 + k * 4, 6, 2, '#ffffff'); }
      P.r(x + w - 8, y + 2, 6, 2, '#ffd23a'); }
    ctx.globalAlpha = 0.25; P.r(x + 1, y + 1, Math.floor(w * 0.4), 1, '#ffffff'); ctx.globalAlpha = 1;
  }
  // sitting at the PC (walk-to trip): the chair back is in front of him — black frame opaque, the mesh see-through
  let chairBack = null;
  function chairFront() {
    if (chairBack) return chairBack; const c = spr('chair'), o = PX.canvas(c.width, 55), x = o.getContext('2d');
    x.drawImage(c, 0, 0, c.width, 55, 0, 0, c.width, 55); x.globalCompositeOperation = 'destination-out'; x.globalAlpha = 0.5; x.fillRect(9, 18, 26, 32); x.fillRect(14, 1, 16, 7);
    return (chairBack = o);
  }
  function front(ctx, P, H, t, st) {
    R.sprAt(ctx, spr('boxFront'), BOX[0], BOX[1]);
    if (st.seat > 0) { ctx.globalAlpha = Math.min(1, st.seat); ctx.drawImage(chairFront(), CHAIR[0], CHAIR[1]); ctx.globalAlpha = 1; }
  }
  function spots(it) {
    it = it || {}; const lvl = pcLvl(it), c = lvl ? spr(lvl) : null, at = lvl ? PCS[lvl].at : null;
    return { pc: lvl ? [at[0], at[1], c.width, c.height] : null, screen: lvl ? PCS[lvl].scr.slice() : null, palm: [0, 60, 64, 140], box: [BOX[0], BOX[1], BOX[2], BOX[3]], slots: SLOTS.map((s) => s.slice()),
      gnome: [-1, BOX[1] - 22, 20, 30], flamingo: [156, 250, 22, 50], hammock: [HAM[0], HAM[1], 86, 36], telescope: [TEL[0], TEL[1], 26, 34], feeder: [FEED[0], FEED[1], 18, 26], flowers: [FLO[0], SILL - 20, 30, 22],
      desk: [DESK[0], DESK[1], 70, 66], window: [SASH[1][0], 32, SASH[1][1] - SASH[1][0], 96], lava: it.lava ? [LAVA[0], LAVA[1], 14, 36] : null, radio: it.radio ? [RADIO[0], RADIO[1], 26, 18] : null, soil: [64, BOX[1] + 2, 10, 12], chair: [CHAIR[0], CHAIR[1], 44, 92], seat: [CHAIR[0] + 22, CHAIR[1] + 57], monty: [MONTY[0], MONTY[1], MONTY[1]], visit: [134, 284], visitFly: [130, 280, 84], party: { pusya: [134, 284], mosq: [112, 282, 94], zhuk: [44, 290] } };
  }
  R.register('balcony', { bg, floor, dyn, front, spots, thumbs: { pc: (v) => spr(PCS[v] ? v : 'old'), hammock: () => spr('hammock'), feeder: () => spr('feeder'), flowers: () => spr('flowers'), telescope: () => spr('telescope'), lava: () => spr('lava'), radio: () => spr('radio') } });
  return { spots };
})();
