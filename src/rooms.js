'use strict';
// ===== Rooms: backgrounds, furniture sprites, animated overlays =====
const ROOMS = (() => {
  const SP = MONKEY.sprite, K = MONKEY.K, IT = K.IT, ITC = K.ITC;
  const RW = 180, RH = 320, FLOOR = 228, GROUND = 270;
  const cache = {}; const get = (k, fn) => cache[k] || (cache[k] = fn());
  const EXT = {}; // hand-drawn rooms from the real flat register here: { bg, dyn, front, bedFront, night, spots }
  const bay = PX.bayer, hash = PX.hash;
  // ---------- painter helpers ----------
  function dither(P, x, y, w, h, c1, c2, t) { P.r(x, y, w, h, c1); P.ctx.fillStyle = c2; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (bay(x + i, y + j) < t - 0.5) P.ctx.fillRect(x + i, y + j, 1, 1); }
  function vgrad(P, x, y, w, h, cols) {
    const n = cols.length - 1; for (let j = 0; j < h; j++) { const tt = j / Math.max(1, h - 1) * n; const k = Math.min(n - 1, Math.floor(tt)), fr = tt - k;
      for (let i = 0; i < w; i++) { P.ctx.fillStyle = (fr > bay(x + i, y + j) + 0.5) ? cols[k + 1] : cols[k]; P.ctx.fillRect(x + i, y + j, 1, 1); } }
  }
  function tile(w, h, fn) { const c = PX.canvas(w, h); fn(Painter(c.getContext('2d')), w, h); return c; }
  function fillPattern(ctx, tl, x, y, w, h, ox = 0, oy = 0) { ctx.save(); ctx.translate(ox, oy); const p = ctx.createPattern(tl, 'repeat'); ctx.fillStyle = p; ctx.fillRect(x - ox, y - oy, w, h); ctx.restore(); }
  const sprAt = (ctx, cv, x, y) => ctx.drawImage(cv, Math.round(x), Math.round(y));
  // furniture against the wall casts a crisp silhouette shadow on it (light from the top-left, like the sprite shading)
  const silh = new WeakMap();
  function silhouette(cv) { let s = silh.get(cv); if (!s) { s = PX.canvas(cv.width, cv.height); const x = s.getContext('2d'); x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#3a2030'; x.fillRect(0, 0, cv.width, cv.height); silh.set(cv, s); } return s; }
  function wallAt(ctx, cv, x, y, d = 3, wallY = FLOOR) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, RW, wallY); ctx.clip(); ctx.globalAlpha = 0.16; ctx.drawImage(silhouette(cv), Math.round(x) + d, Math.round(y) + Math.ceil(d * 0.67)); ctx.restore();
    sprAt(ctx, cv, x, y);
  }

  // ---------- floors (the flat's own; shop wallpapers/floors are gone) ----------
  const FLOORS = {
    cork: () => tile(96, 30, (P) => { // big cork tiles (48×15), staggered rows, mottled, soft seams
      const base = ['#c9a271', '#c39b69', '#cda676', '#c69f6d'], TW = 48, TH = 15;
      for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) { const x0 = k * TW + r * 24 - 24, c = base[(r * 2 + k) % 4];
        for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) { const x = x0 + i; if (x < 0 || x >= 96) continue; const y = r * TH + j, n = hash(x >> 1, y >> (j % 2), 21 + r * 3 + k);
          P.p(x, y, n < 0.09 ? '#b98f5e' : n > 0.93 ? '#d7b385' : n > 0.9 && hash(x, y, 5) > 0.5 ? '#ad8455' : c); }
        if (x0 >= 0) P.r(x0, r * TH, 1, TH, '#b5905f'); }
      P.r(0, 0, 96, 1, '#b8935f'); P.r(0, TH, 96, 1, '#b8935f'); P.r(0, 1, 96, 1, 'rgba(255,240,210,0.2)'); P.r(0, TH + 1, 96, 1, 'rgba(255,240,210,0.2)'); }),
  };
  const floorTile = (id) => get('fl_' + id, FLOORS[id] || FLOORS.cork);
  function drawFloor(ctx, P, floor, y0, H = RH) { // Round 25: H > RH — the floor goes on below the picture (FILL)
    fillPattern(ctx, floorTile(floor), 0, y0, RW, H - y0, 0, y0);
    // depth shading toward the wall + vignette at the front
    for (let j = 0; j < 14; j++) { ctx.globalAlpha = 0.22 * (1 - j / 14); P.r(0, y0 + j, RW, 1, '#2a1620'); } ctx.globalAlpha = 1;
    for (let j = 0; j < 30; j++) { ctx.globalAlpha = 0.12 * (j / 30); P.r(0, H - 30 + j, RW, 1, '#2a1620'); } ctx.globalAlpha = 1;
  }
  // ---------- sky ----------
  const SKY = { day: ['#69b9ee', '#8fcdf3', '#bfe6f8', '#e6f6fb'], morning: ['#7d9fdc', '#c3b6dc', '#f4c4c0', '#ffe0b4'], evening: ['#3e4a8f', '#8a6aa8', '#e8848a', '#ffbe7a'], night: ['#0e1430', '#172250', '#223066', '#33437c'] };
  function phase(d = new Date()) { const h = d.getHours() + d.getMinutes() / 60; return h >= 5.5 && h < 8 ? 'morning' : h >= 8 && h < 17.5 ? 'day' : h >= 17.5 && h < 20.5 ? 'evening' : 'night'; }
  function drawSky(ctx, P, x, y, w, h, ph, big) {
    vgrad(P, x, y, w, h, SKY[ph]);
    if (ph === 'night') { for (let k = 0; k < (big ? 60 : 14); k++) { const sx = x + Math.floor(hash(k, 3, 1) * w), sy = y + Math.floor(hash(k, 4, 1) * h * 0.8); P.p(sx, sy, k % 5 ? '#c8d2ff' : '#ffffff'); } }
    if (big) {
      if (ph === 'night') { P.circ(x + w * 0.78, y + 26, 9, '#fff2b0'); P.circ(x + w * 0.78 + 4, y + 23, 8, SKY.night[0]); }
      else { const sx = x + w * (ph === 'morning' ? 0.2 : ph === 'evening' ? 0.82 : 0.75), sy = y + (ph === 'day' ? 22 : 64); ctx.globalAlpha = 0.25; P.circ(sx, sy, 16, '#fff6c8'); ctx.globalAlpha = 1; P.circ(sx, sy, 10, ph === 'evening' ? '#ffd27a' : '#fff1a0'); P.circ(sx - 2, sy - 2, 6, '#fffbe0'); }
    } else if (ph !== 'night') { ctx.globalAlpha = 0.9; cloud(P, x + w * 0.25, y + h * 0.35, 0.6); cloud(P, x + w * 0.8, y + h * 0.6, 0.45); ctx.globalAlpha = 1; }
    else { P.circ(x + w * 0.72, y + h * 0.3, 4, '#fff2b0'); P.circ(x + w * 0.72 + 2, y + h * 0.3 - 1, 3.5, SKY.night[1]); }
  }
  function cloud(P, x, y, s = 1) { const c = '#ffffff', sh = '#dbeaf4'; P.ell(x, y + 2 * s, 14 * s, 5 * s, sh); P.ell(x - 6 * s, y, 7 * s, 6 * s, c); P.ell(x + 3 * s, y - 3 * s, 8 * s, 7 * s, c); P.ell(x + 10 * s, y + 1 * s, 6 * s, 5 * s, c); P.r(x - 13 * s, y + 2 * s, 28 * s, 4 * s, c); }

  // ---------- furniture sprites ----------
  const FUR = {
    painting: () => SP(40, 34, (a) => { a.rbox(0, 0, 40, 34, 2, IT, a.mat('gold', '#f2bf33')); a.box(4, 4, 36, 30, IT, a.mat('canvasG', '#4e6a3a'), { flat: 0.6 }); }, (d) => {
      for (let y = 5; y < 30; y++) for (let x = 5; x < 36; x++) if (bay(x, y) < (y - 5) / 25 - 0.5) d.px(x, y, '#3d5530');
      const B = ['.......bb.', '......yYb.', '.....yYY..', '....yYYY..', '...yYYYw..', '..yYYYYw..', '.yYYYYw...', 'yYYYYw....', 'yYYw......', '.yy.......'];
      const pal = { b: '#6b4a1f', y: '#d9a020', Y: '#f4cc3a', w: '#fff1a6' }; B.forEach((r, j) => [...r].forEach((ch, i) => { if (pal[ch]) d.px(14 + i, 9 + j, pal[ch]); }));
      d.px(18, 13, '#2a1810'); d.px(20, 12, '#2a1810'); d.px(17, 16, '#7a3a2a'); d.px(18, 16, '#7a3a2a'); d.px(19, 15, '#7a3a2a');
      d.hline(8, 32, 27, '#6a4a2a'); }),
    carpet: (W = 76, H = 62) => SP(W, H, (a) => { a.rbox(0, 0, W, H - 4, 1, IT, a.mat('carpetR', '#a8323a'), { flat: 0.68, bulge: 0.05 }); }, (d) => {
      const pal = ['#7a1f2a', '#e0b050', '#2c3a6a', '#f2e2c0', '#a8323a', '#c8504a'];
      for (let y = 1; y < H - 5; y++) for (let x = 1; x < W - 1; x++) {
        let c; const u = Math.abs(x - (W - 1) / 2), v = Math.abs(y - (H - 5) / 2);
        if (x < 5 || x > W - 6 || y < 5 || y > H - 10) { c = ((x + y) >> 1) % 3 === 0 ? pal[1] : (x < 3 || x > W - 4 || y < 3 || y > H - 8) ? pal[2] : pal[0]; }
        else if (x < 7 || x > W - 8 || y < 7 || y > H - 12) c = pal[3];
        else { const dd = u / ((W - 20) / 2) + v / ((H - 22) / 2); const band = Math.floor(dd * 7); c = [pal[1], pal[2], pal[4], pal[0], pal[4], pal[5], pal[4], pal[2]][Math.min(7, band)]; if (band >= 5 && ((Math.floor(u / 3) + Math.floor(v / 3)) % 2 === 0) && hash(Math.floor(u / 3), Math.floor(v / 3), 2) > 0.5) c = pal[1]; }
        d.px(x, y, c);
      }
      for (let x = 2; x < W - 2; x += 2) { d.px(x, H - 4, '#f2e2c0'); d.px(x, H - 3, '#f2e2c0'); d.px(x, H - 2, '#e0d0a8'); } }),
    lamp: () => SP(24, 98, (a) => { a.ell(12, 95, 8, 2.6, IT, a.mat('lampB', '#5a4a3a')); a.tube([[12, 94, 1.1], [12, 22, 1.1]], IT, a.mat('brass', '#d0a040')); a.poly([[2, 26], [22, 26], [17, 4], [7, 4]], ITC, a.mat('shade', '#f3dfb0', 3)); },
      (d) => { for (let x = 3; x <= 21; x += 2) d.px(x, 26, '#c8a060'); }),
    plant: () => SP(32, 58, (a) => {
      const lf = a.mat('leafD', '#3f8f3a'), lf2 = a.mat('leafL', '#5fae45');
      a.tube([[16, 44, 1], [14, 26, 0.8], [10, 14, 0.6]], IT, a.mat('stemG', '#4a7a2a')); a.tube([[16, 44, 1], [19, 24, 0.8], [23, 12, 0.6]], IT, a.mat('stemG', '#4a7a2a'));
      [[7, 14, 5, 3.2, lf], [24, 11, 5, 3, lf], [12, 6, 4, 3.5, lf2], [20, 20, 5, 3, lf2], [9, 25, 5, 3, lf2], [25, 29, 4.5, 2.8, lf], [6, 34, 4.4, 2.6, lf], [17, 2.8, 3.2, 2.6, lf2], [16, 14, 4, 3, lf]].forEach(([x, y, rx, ry, m]) => a.ell(x, y, rx, ry, ITC, m));
      a.poly([[6, 42], [26, 42], [23, 57], [9, 57]], IT, a.mat('pot', '#c8643a')); a.box(5, 40, 27, 44, IT, a.mat('pot2', '#d8744a'));
    }),
    disco: () => SP(18, 18, (a) => { a.ell(9, 9, 8, 8, IT, a.mat('mirror', '#b8c4d4')); }, (d) => { for (let y = 1; y < 17; y++) for (let x = 1; x < 17; x++) if (d.on(x, y)) { if (x % 3 === 0 || y % 3 === 0) d.shade(x, y, -1); else if (hash(x, y, 5) > 0.8) d.px(x, y, '#ffffff'); } }),
    clock: () => SP(22, 22, (a) => { a.ell(11, 11, 10, 10, IT, a.mat('clockR', '#e8504a')); a.ell(11, 11, 7.6, 7.6, IT, a.mat('clockF', '#fff8ec'), { flat: 0.8 }); }, (d) => { [[11, 4], [18, 11], [11, 18], [4, 11]].forEach(([x, y]) => d.px(x, y, '#3b3742')); }),
    cactus: () => SP(14, 22, (a) => { const cm = a.mat('cact', '#5fae45'); a.ell(7, 8, 3.6, 7, IT, cm); a.tube([[4, 10, 1.4], [1.4, 9, 1.2], [1.4, 5, 1.1]], IT, cm); a.tube([[10, 8, 1.3], [12.4, 7, 1.1], [12.4, 3.6, 1]], IT, cm); a.poly([[2, 14], [12, 14], [11, 21], [3, 21]], IT, a.mat('pot', '#c8643a')); }, (d) => { d.px(7, 0, '#ff8fb1'); d.px(6, 1, '#ff8fb1'); d.px(8, 1, '#ff8fb1'); [[5, 5], [9, 9], [6, 11], [8, 4]].forEach(([x, y]) => d.px(x, y, '#e8f8d0')); }),
    mat: () => SP(84, 18, (a) => { a.rbox(0, 0, 84, 18, 6, IT, a.mat('matB', '#6aa0d8', 3), { flat: 0.66, bulge: 0.15 }); }, (d) => { for (let x = 4; x < 80; x++) { if (Math.floor(x / 6) % 2) { d.pxk(x, 5, '#ffffff', 1 << IT); d.pxk(x, 12, '#ffffff', 1 << IT); } } }),
    fern: () => SP(34, 50, (a) => { const lf = a.mat('fern', '#4f9e45'); [[[17, 36], [5, 22], [0, 30]], [[17, 36], [10, 10], [4, 8]], [[17, 36], [17, 6], [16, 0]], [[17, 36], [25, 10], [31, 9]], [[17, 36], [30, 22], [34, 31]]].forEach((c) => a.tube(ART.curve(c, 10, (t) => 0.6 + 2.2 * Math.sin(Math.PI * t)), ITC, lf)); a.poly([[7, 34], [27, 34], [24, 50], [10, 50]], IT, a.mat('potW', '#e8e0d4')); }),
    poster: () => SP(26, 36, (a) => { a.box(0, 0, 26, 36, IT, a.mat('paper', '#2f3a6a'), { flat: 0.66 }); }, (d) => {
      for (let y = 1; y < 35; y++) for (let x = 1; x < 25; x++) if (bay(x, y) < (y / 35) - 0.6) d.px(x, y, '#4a3a7a');
      [[13, 9, 5]].forEach(([cx, cy, r]) => { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (Math.hypot(x - cx, y - cy) <= r) d.px(x, y, (x + y) % 3 ? '#ffd23a' : '#ffbf2a'); });
      for (let k = 0; k < 12; k++) { d.px(7 + k, 26 - Math.round(Math.sin(k / 11 * Math.PI) * 5), '#f4cc3a'); d.px(7 + k, 27 - Math.round(Math.sin(k / 11 * Math.PI) * 5), '#d9a020'); }
      d.hline(4, 21, 31, '#ff5c8a'); d.hline(7, 18, 33, '#59c1ff'); }),
    nightlight: () => SP(16, 16, (a) => { const pts = []; for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3.2 : 7.4; pts.push([8 + Math.cos(an) * r, 8.6 + Math.sin(an) * r]); } a.poly(pts, IT, a.mat('starY', '#ffd23a')); }, (d) => { d.px(7, 8, '#7a5a12'); d.px(9, 8, '#7a5a12'); d.px(8, 10, '#a8781a'); }),
    // yard / balcony palm tree with growth stages (0..4)
    tree: (stg = 4) => SP(100, 186, (a) => {
      const bark = a.mat('bark', '#8f6c44', 2), lf = a.mat('palm', '#4fa043'), lf2 = a.mat('palm2', '#69bb4d');
      const heights = [148, 126, 104, 82, 62];
      const s = Math.min(4, Math.max(0, stg | 0));
      const topY = heights[s];
      const midY1 = 186 - (186 - topY) * 0.35, midY2 = 186 - (186 - topY) * 0.7;
      a.tube([[40, 186, 7.4], [37, midY1, 6.6], [33, midY2, 5.6], [33, topY, 5]], IT, bark);
      const leaf = (pts, m) => a.tube(ART.curve(pts, 18, (t) => 0.9 + 7.4 * Math.sin(Math.PI * Math.pow(t, 0.8))), ITC, m);
      const cy = topY - 4;
      if (s === 0) {
        leaf([[33, cy], [14, cy - 16], [-2, cy + 2]], lf);
        leaf([[33, cy], [52, cy - 16], [68, cy + 2]], lf);
        leaf([[33, cy], [33, cy - 24], [35, cy - 32]], lf2);
      } else if (s === 1) {
        leaf([[33, cy], [10, cy - 16], [-6, cy + 4]], lf);
        leaf([[33, cy], [56, cy - 16], [74, cy + 4]], lf);
        leaf([[33, cy], [20, cy - 26], [10, cy - 34]], lf2);
        leaf([[33, cy], [48, cy - 26], [58, cy - 34]], lf2);
      } else if (s === 2) {
        leaf([[33, cy], [6, cy - 18], [-8, cy + 4]], lf);
        leaf([[33, cy], [60, cy - 18], [80, cy + 4]], lf);
        leaf([[33, cy], [16, cy - 32], [4, cy - 36]], lf2);
        leaf([[33, cy], [52, cy - 32], [68, cy - 36]], lf2);
        leaf([[33, cy], [30, cy - 30], [36, cy - 48]], lf);
      } else if (s === 3) {
        leaf([[33, cy], [6, cy - 18], [-8, cy + 4]], lf);
        leaf([[33, cy], [60, cy - 18], [80, cy + 4]], lf);
        leaf([[33, cy], [16, cy - 36], [2, cy - 38]], lf2);
        leaf([[33, cy], [54, cy - 36], [72, cy - 36]], lf2);
        leaf([[33, cy], [30, cy - 30], [36, cy - 52]], lf);
        leaf([[33, cy], [12, cy + 10], [4, cy + 30]], lf2);
      } else {
        leaf([[33, cy], [6, cy - 18], [-8, cy + 4]], lf);
        leaf([[33, cy], [60, cy - 18], [80, cy + 4]], lf);
        leaf([[33, cy], [16, cy - 38], [2, cy - 40]], lf2);
        leaf([[33, cy], [54, cy - 38], [72, cy - 36]], lf2);
        leaf([[33, cy], [30, cy - 32], [36, cy - 54]], lf);
        leaf([[33, cy], [10, cy + 8], [2, cy + 34]], lf2);
        leaf([[33, cy], [58, cy + 10], [66, cy + 36]], lf2);
      }
    }, (d) => { for (let y = 70; y < 186; y += 7) for (let x = 26; x < 48; x++) if (d.on(x, y)) d.shade(x, y, -1); }),
    hammock: () => SP(130, 60, (a) => { const wd = a.mat('woodD', '#6b4426', 2); a.box(120, 0, 126, 60, IT, wd); const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([4 + t * 118, 10 + Math.sin(Math.PI * t) * 26, 2.6 + Math.sin(Math.PI * t) * 1.6]); } a.tube(pts, IT, a.mat('hamm', '#e8504a', 3)); }, (d) => { for (let x = 8; x < 120; x += 5) { const t = (x - 4) / 118; const y = Math.round(10 + Math.sin(Math.PI * t) * 26); d.pxk(x, y, '#ffd23a', 1 << IT); d.pxk(x, y + 1, '#ffd23a', 1 << IT); } }),
    gnome: () => SP(20, 30, (a) => { a.ellU([[10, 22, 7, 7], [10, 28, 8, 2]], IT, a.mat('gnB', '#4f78c8')); a.ell(10, 16, 6.6, 5, ITC, a.mat('beard', '#f4f4f0')); a.ell(10, 11, 4.4, 3.6, IT, a.mat('skin', '#f0c0a0')); a.poly([[4, 10], [16, 10], [12, 0], [9, 1]], ITC, a.mat('gnH', '#e8403a')); }, (d) => { d.px(8, 11, '#2a1a10'); d.px(12, 11, '#2a1a10'); d.px(10, 13, '#e88a80'); }),
    flamingo: () => SP(22, 50, (a) => { const pk = a.mat('flam', '#f47aa8'); a.tube([[11, 34, 0.5], [11, 50, 0.5]], IT, a.mat('leg', '#e85a8a')); a.tube([[13, 34, 0.5], [14, 50, 0.5]], IT, a.mat('leg', '#e85a8a')); a.ell(12, 30, 8, 5.4, IT, pk); a.tube(ART.curve([[6, 28], [2, 14], [10, 8], [7, 2]], 12, () => 1.4), IT, pk); a.ell(7, 3, 2.6, 2.4, IT, pk); a.tube([[5, 3, 1], [2, 6, 0.6]], IT, a.mat('beakF', '#2a2228')); }, (d) => { d.px(8, 2, '#2a1a10'); }),
    banana1: () => SP(10, 12, (a) => { a.tube(ART.curve([[2, 1], [0.5, 8], [8, 10.5]], 8, (t) => 0.8 + 1.2 * Math.sin(Math.PI * t)), IT, a.mat('banana', '#f4cc3a')); a.tube([[2, 1.4, 0.7], [2.6, -0.5, 0.6]], IT, a.mat('bstem', '#86622e')); }, null),
  };
  const fur = (key, fn) => get('F_' + key, fn);

  // ---------- window light: soft shaft + floor patch with the window cross (daytime only) ----------
  // convex polygon as integer scanline spans: no anti-aliased halo pixels (skill pixel-art: AA halos)
  function glassShine(P, x, y, w, h) { P.ctx.globalAlpha = 0.22; for (let k = 0; k < Math.min(w, h) * 0.5; k++) { P.p(x + 6 + k, y + h * 0.55 - k, '#ffffff'); P.p(x + 7 + k, y + h * 0.55 - k, '#ffffff'); P.p(x + 16 + k, y + h * 0.75 - k, '#ffffff'); } P.ctx.globalAlpha = 1; }
  function polyFill(P, pts, c) {
    let y0 = Infinity, y1 = -Infinity; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.ceil(y0); y < y1; y++) { const yc = y + 0.5; let xa = Infinity, xb = -Infinity;
      for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) { const x = ax + (yc - ay) / (by - ay) * (bx - ax); xa = Math.min(xa, x); xb = Math.max(xb, x); } }
      if (xb > xa) P.r(Math.round(xa), y, Math.round(xb) - Math.round(xa), 1, c); }
  }
  const WIN = {}; // window glass x, y, w, h per room (rooms register their own)
  const BEAM = { morning: ['#ffd8b8', 0.3], day: ['#fff4d2', 0.12], evening: ['#ffb46e', -0.36] };   // colour, slant (sun moves east -> west)
  function beamGeo(room, ph) {
    const w = WIN[room], b = BEAM[ph]; if (!w || !b) return null; const [x, y, ww, wh] = w, dir = Math.sign(b[1]);
    const fy = FLOOR + 24, fh = 13, dx = (fy - y - wh) * b[1];
    return { x, y, ww, wh, dir, fy, fh, dx, col: b[0] };
  }
  function sunbeam(ctx, P, room, ph) {
    const g = beamGeo(room, ph); if (!g) return; const { x, y, ww, wh, dir, fy, fh, dx, col } = g;
    const A = [[x, y], [x + ww, y], [x + ww, y + wh], [x, y + wh]], B = [[x + dx, fy], [x + ww + dx, fy], [x + ww + dx + dir * 4, fy + fh], [x + dx + dir * 4, fy + fh]];
    const hull = dir < 0 ? [A[0], A[1], A[2], B[2], B[3], B[0]] : [A[0], A[1], B[1], B[2], B[3], A[3]];
    ctx.globalAlpha = 0.07; polyFill(P, hull, col);
    // floor patch: the four panes, sheared like the beam
    const pw = (ww - 11) / 2, ph2 = (fh - 3) / 2;
    ctx.globalAlpha = 0.2;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const y0 = fy + 1 + j * (ph2 + 1), y1 = y0 + ph2, sh = (yy) => dx + dir * 4 * (yy - fy) / fh, x0 = x + 4 + i * (pw + 3);
      polyFill(P, [[x0 + sh(y0), y0], [x0 + pw + sh(y0), y0], [x0 + pw + sh(y1), y1], [x0 + sh(y1), y1]], col);
    }
    ctx.globalAlpha = 1;
  }
  // dust motes drifting in the beam (animated, cheap: 8 pixels)
  function motes(ctx, P, room, t, ph) {
    const g = beamGeo(room, ph); if (!g) return; const { x, y, ww, wh, fy, dx, col } = g;
    for (let k = 0; k < 8; k++) {
      const u = (hash(k, 1, 77) + t * (0.012 + hash(k, 2, 77) * 0.01)) % 1, v = hash(k, 3, 77) + Math.sin(t * 0.7 + k * 2.1) * 0.06;
      const py = y + wh * 0.5 + (fy - y - wh * 0.5) * u, px = x + ww * Math.max(0.05, Math.min(0.95, v)) + dx * u;
      ctx.globalAlpha = (0.35 + 0.35 * Math.sin(t * 1.7 + k * 1.3)) * Math.sin(u * Math.PI); P.p(px, py, k % 3 ? '#fffaf0' : col);
    }
    ctx.globalAlpha = 1;
  }

  function build(room, H, curH) {
    const H_total = curH || (typeof cv !== 'undefined' && cv && cv.height) || RH;
    const ph = phase();
    const key = room + '|' + JSON.stringify(H.items) + '|' + ph + (EXT[room].key ? '|' + EXT[room].key(H) : '') + '|' + H_total;
    if (cache.bgKey && cache.bgKey[room] === key) return cache.bg[room];
    cache.bgKey = cache.bgKey || {}; cache.bg = cache.bg || {};
    const c = PX.canvas(RW, H_total), ctx = c.getContext('2d'), P = Painter(ctx);
    EXT[room].bg(ctx, P, H, ph, H_total);
    cache.bgKey[room] = key; cache.bg[room] = c; return c;
  }

  // ---------- animated overlays (behind the monkey) ----------
  const TV_COLS = ['#ff5c6c', '#ffd23a', '#3fdc7a', '#59c1ff', '#b48cff'];
  function dyn(ctx, room, H, t, S) {
    const P = Painter(ctx), it = H.items;
    if (room !== 'zal' || S.light !== false) motes(ctx, P, room, t, phase());
    if (EXT[room] && EXT[room].dyn) EXT[room].dyn(ctx, P, H, t, S);
  }
  // blanket pulled up to the chest when the monkey sleeps in bed (drawn over the monkey)
  function bedFront(ctx, H, cx) { if (EXT.zal && EXT.zal.bedFront) EXT.zal.bedFront(ctx, H, cx); }
  function front(ctx, room, H, t, st) {
    const it = H.items, P = Painter(ctx); if (EXT[room] && EXT[room].front) EXT[room].front(ctx, P, H, t, st || {});
  }
  function tvScreen(ctx, P, [x, y, w, h], t, on) {
    if (!on) { P.r(x, y, w, h, '#2a2e36'); P.r(x + 2, y + 2, 4, 1, '#4a5060'); return; }
    const ch = Math.floor(t / 6) % 3;
    if (ch === 0) { vgradCached(ctx, x, y, w, h); const bx = x + w / 2 + Math.sin(t * 3) * (w * 0.25), by = y + h * 0.62 + Math.abs(Math.sin(t * 6)) * -5; P.ell(bx, by, 4, 2.5, '#f4cc3a'); P.p(bx - 3, by - 1, '#86622e'); P.r(x, y + h - 5, w, 5, '#5fae45'); }
    else if (ch === 1) { for (let i = 0; i < 5; i++) P.r(x + Math.floor(i * w / 5), y, Math.ceil(w / 5), h - 6, TV_COLS[i]); P.r(x, y + h - 6, w, 6, '#2a2e36'); P.r(x + 4, y + h - 4, w - 8, 2, '#ffffff'); }
    else { for (let j = 0; j < h; j += 2) for (let i = 0; i < w; i += 2) { const v = hash(i, j, Math.floor(t * 20)); P.r(x + i, y + j, 2, 2, v > 0.5 ? '#c8d0dc' : '#5a606c'); } }
    ctx.globalAlpha = 0.18; for (let j = 0; j < h; j += 2) P.r(x, y + j, w, 1, '#000000'); ctx.globalAlpha = 0.25; P.r(x + 1, y + 1, Math.floor(w * 0.4), 1, '#ffffff'); P.r(x + 1, y + 1, 1, Math.floor(h * 0.4), '#ffffff'); ctx.globalAlpha = 1;
  }
  function vgradCached(ctx, x, y, w, h) { const g = get('tvsky' + w + 'x' + h, () => { const c = PX.canvas(w, h); vgrad(Painter(c.getContext('2d')), 0, 0, w, h, ['#69b9ee', '#bfe6f8']); return c; }); ctx.drawImage(g, x, y); }
  // the garland; Round 5 D: tap → modes 0 twinkle · 1 chase (a bright group runs along) · 2 all flash together · 3 off
  function garland(ctx, P, t, y0, mode = 0) {
    for (let x = 0; x < RW; x++) { const y = y0 + 4 + Math.abs(Math.sin(x / 30 * Math.PI)) * 6; P.p(x, Math.round(y), '#3a5a3a'); }
    const head = Math.floor(t * 10) % 18, all = Math.floor(t * 2.5) % 2 === 0;
    for (let k = 0; k < 18; k++) { const x = 5 + k * 10, y = y0 + 6 + Math.abs(Math.sin(x / 30 * Math.PI)) * 6, c = TV_COLS[k % 5];
      const on = mode === 0 ? (Math.floor(t * 3) + k) % 3 !== 0 : mode === 1 ? (k - head + 18) % 18 < 5 : mode === 2 ? all : false, big = on && mode !== 0;
      if (on) { ctx.globalAlpha = big ? 0.4 : 0.3; P.circ(x, y + 1, big ? 5 : 3.5, c); ctx.globalAlpha = 1; }
      P.r(x - 1, y, 3, 3, on ? c : PX.shade(c, mode === 3 ? 0.4 : 0.55)); if (on) P.p(x - 1, y, '#ffffff'); }
  }
  function steam(ctx, P, x, y, t, col = '#ffffff') { for (let k = 0; k < 3; k++) { const ph = (t * 0.5 + k / 3) % 1; ctx.globalAlpha = 0.55 * (1 - ph); P.circ(x + Math.sin(ph * 6 + k) * 3, y - ph * 22, 1.5 + ph * 2.5, col); } ctx.globalAlpha = 1; }
  // time-of-day ambience over the whole scene (room + monkey): warm evening, dimmer lamp-lit night
  const AMB = { evening: '#fff0dc', night: '#dcd8ee' };
  function ambient(ctx, room, lightOn, H = RH, y0 = 0) {
    if (room === 'zal' && !lightOn) return; const c = AMB[phase()]; if (!c) return;
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = c; ctx.fillRect(0, y0, RW, H - y0); ctx.restore();
  }
  function night(ctx, H_state, t, H = RH, y0 = 0) { // bedroom light off
    const P = Painter(ctx); ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#3b4078'; ctx.fillRect(0, y0, RW, H - y0); ctx.restore();
    if (EXT.zal && EXT.zal.night) EXT.zal.night(ctx, P, H_state, t, H);
  }
  // named hotspot rects of a hand-drawn room (one place for the layout: art, taps and tests read the same numbers)
  const spots = (room, items) => (EXT[room] && EXT[room].spots ? EXT[room].spots(items || {}) : null);
  // shared bits of the flat: white ceiling cornice, speckled plaster, shop thumbnails of room things (upgrades, new items)
  function cornice(P, y) { const M = [['#f2ede6', 1], ['#ffffff', 2], ['#ddd4c8', 1], ['#f8f4ee', 2], ['#cfc4b6', 1], ['#efe8de', 2], ['#c5b29a', 1]]; for (const [c, h] of M) { P.r(0, y, RW, h, c); y += h; } P.ctx.globalAlpha = 0.12; P.r(0, y, RW, 6, '#3a2030'); P.ctx.globalAlpha = 1; return y; }
  function plaster(P, x, y, w, h, base, cA, cB, seed) { P.r(x, y, w, h, base); const n = Math.round(w * h / 45); for (let k = 0; k < n; k++) P.p(x + Math.floor(hash(k, 1, seed) * w), y + Math.floor(hash(k, 2, seed) * h), k % 3 ? cA : cB); }
  const upThumb = (k, v) => { for (const r in EXT) { const th = EXT[r].thumbs; if (th && th[k]) return th[k](v); } return null; };
  // Round 25: the floor below the picture (FILL — the home-screen app fills the whole phone): the room's own floor drawn n rows
  // further; rows = the picture's last 8 rows of the bare floor (FILL measures the room's light by them), mean = the colour below
  function floorExt(room, n) {
    const e = EXT[room]; if (!e || !e.floor) return null;
    const k = room + '|' + n; cache.fx = cache.fx || {}; if (cache.fx[k]) return cache.fx[k];
    const cv = PX.canvas(RW, RH + n), ctx = cv.getContext('2d'), P = Painter(ctx); e.floor(ctx, P, RH + n);
    const rows = ctx.getImageData(0, RH - 8, RW, 8).data; let mean = [0, 0, 0];
    if (n > 0) { const d = ctx.getImageData(0, RH, RW, n).data; for (let i = 0; i < d.length; i += 4) { mean[0] += d[i]; mean[1] += d[i + 1]; mean[2] += d[i + 2]; } mean = mean.map((v) => v / (d.length / 4)); }
    return (cache.fx[k] = { cv, rows, mean });
  }
  const register = (room, m) => { EXT[room] = m; for (const k in cache) if (k === 'bgKey') delete cache[k]; };
  return { cornice, plaster, upThumb, register, floorExt, spots, glassShine, sunbeam, tvScreen, drawFloor, polyFill, WIN, build, dyn, front, bedFront, night, ambient, phase, RW, RH, FLOOR, GROUND, FUR, fur, wallAt, drawSky, cloud, vgrad, dither, tile, fillPattern, floorTile, sprAt, steam, garland };
})();
