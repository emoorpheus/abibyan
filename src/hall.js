'use strict';
// ===== Прихожая — drawn by hand from the user's photos (IMG_7781 / 7782) =====
// coffered wooden ceiling with painted panels + round frosted plafond; left: open wardrobe & tall wrought-iron mirror (= Гардероб);
// centre: the front door (parcels come in here); two lantern sconces (warm + soft white); folded drying rack.
// Round 6 B: no doors to the Зал / Ванная any more (friends walk in from the edges); on the right the grey 4-tier etagere
// Round 8 (IMG_7819 / 7820 / 7814 / 7818 / 7813 / 7821 / 7811 / 7822–7826): no lamp, no masks — on top the GL.iNet router with two Hornet
// figures (Silksong) behind it, the figurines on the 2nd tray, the Linux TV box on the 3rd, the toys on the bottom one; a robot vacuum dock.
const HALL = (() => {
  const SP = MONKEY.sprite, K = MONKEY.K, IT = K.IT, R = ROOMS, RW = R.RW, FLOOR = R.FLOOR, GROUND = R.GROUND, fur = R.fur, hash = PX.hash;
  // ---- layout (canvas px): art, hotspots and tests read these ----
  const CEIL = 30, WARD = [0, 72, 34, 156], MIRROR = [36, 120, 30, 108] /* Round 15b #2: lower (was 88, 140 tall) */, FRONT = [70, 108, 40, 120];
  const GL1 = Math.round(MIRROR[3] * 0.28), GL2 = Math.round(MIRROR[3] * 0.58); // the two glare streaks on the glass
  // two lanterns flank the front door: warm one over the mirror, soft-white one on the other side (user); folded drying rack leans on the wardrobe
  const SCONCES = [[59, 66, 0], [111, 66, 1]], RACK = [4, 184, 26, 52];
  // Round 7 #2: a small wooden key rack between the front door and the etagere; Жучок hangs on its middle hook by his gold chain
  const KEYS = [112, 95, 19, 4], ZHOOK = [121, 101], ZHUK = [121, 128];
  const DOOR = '#6e3b1f', DOOR_D = '#4e2812', DOOR_L = '#8c5330', CAS = '#5a2f17';
  // ---- the etagere: 4 dark-grey dimpled plastic trays on round poles (Round 8: the drum lamp is gone) ----
  // LIPS = the top of each tray's front rim; things stand on the tray surface just above it (back row 3 px higher)
  const ETAG = [132, 104, 46, 124], LIPS = [130, 156, 182, 208], DOCK = [150, 219, 20, 13], ROUTER = [145, LIPS[0] - 8];
  const TIERS = LIPS.map((L, i) => { const y = i ? LIPS[i - 1] + 4 : ETAG[1]; return [134, y, 42, L + 3 - y]; });
  const TRAY = '#3e4244', TRAY_D = '#33373a', TRAY_L = '#4c5153', RIM = '#5c6163', RIM_L = '#7a7f82', POLE = '#4e5356', POLE_L = '#6e7376', CABLE = '#151618';
  // tiny figurines as pixel maps ('.' = empty), drawn from the photos; tier 1 = top (the Hornets), tier 2 = the figurines (IMG_7814 / 7818), tier 4 = bottom (IMG_7811 / 7822–7826)
  const FP = {
    orang: { o: '#8a4520', d: '#5a2a10', f: '#a07a5e', e: '#120c0a', m: '#3a2418', l: '#a85a28' },
    horse: { b: '#b0a090', d: '#7a6c60', w: '#f4f0ea', k: '#1a1414', r: '#d8302a', s: '#c8c8cc', m: '#ece4d8', p: '#e8a8b0' },
    cat: { w: '#f4f2ee', k: '#2a2a2a', n: '#c87070', b: '#c8ccd4', s: '#8a5a32', g: '#e0dcd4' },
    gnome: { r: '#d8302a', R: '#a82420', w: '#f4f2ee', W: '#d4d0c8', p: '#f0b8a0', g: '#a8a49c' },
    coins: { w: '#f2eee6', d: '#c8c2b8', y: '#e0b440', Y: '#a88420', c: '#b4b4b4', C: '#7a7a7a' },
    spike: { b: '#6a8ad8', e: '#f4f4f4', k: '#141414', y: '#e8e070', r: '#d83030', g: '#6cc070', G: '#4a9a50' }, // Спайк: green, the blue crest, a yellow beak
    shyguy: { r: '#d8302a', R: '#a82420', w: '#f4f2ee', W: '#d6d0c8', k: '#141010', b: '#3a6ad8', v: '#8a4ac8' }, // Скромник (Shy Guy): red robe, the white mask, blue + purple feet
    hornet: { w: '#f6f4f0', W: '#cfcac4', k: '#141016', r: '#d02a2a', R: '#9a1e1e', p: '#f0b8b0' }, // Хорнет (Silksong): the white horned mask, the red cloak
    alien: { g: '#aaa69c', G: '#86827a', k: '#202020' },
    hankey: { r: '#d8302a', w: '#f4f4f4', b: '#7a4a28', B: '#5a3418', k: '#141010', m: '#c83a3a' },
    bear: { b: '#7ab8d8', g: '#7ac890', G: '#5aa070', k: '#202020', p: '#e88aa0', r: '#d83030' },
    mole: { b: '#6a4630', B: '#4e3222', k: '#141010', w: '#f4f2ee' }, // Монти Мол: brown, the white face
    goomba: { b: '#7a4a2a', B: '#5a3418', w: '#f4f4f4', k: '#141010', l: '#e8c8a0' },
    towel: { b: '#4a5ab8', B: '#36428a', w: '#f4f4f4', k: '#141010', y: '#e8c060' },
    tux: { k: '#141418', w: '#f4f4f4', y: '#f0b020' },
  };
  const FM = {
    orang: ['..ooo.oo.', '.ooooo..o', '.offffo.o', '.ofefeo.o', '.offmfo.o', 'oolllloo.', 'o.llll...', 'o.llllo..', '.dd..dd..'],
    // the plush pony sits up, head turned to the tray: white mane + tail, pink ear, light muzzle, the red collar with a silver chain
    horse: ['...pp......', '..wbbb.....', '..wbkbbb...', '.wwbbbbbbm.', '.wbbbbbmmmm', '.wbbbbbmmdm', '.wbbb..mmm.', '.wbbrsrr...', '..bbbbbb...', '.bbbbbbbb..', 'wbbdbbbdbb.', 'wbbdbbbdbbb', '.ddbbbbbdd.'],
    cat: ['w...w..', 'ww.ww..', 'wwwww..', 'wkwkw..', 'wwnww..', '.bbb...', '.wsw..w', '.wwws.w', '.swww.s', '.wsww.w', '.wwwwww'],
    gnome: ['...r.', '..rr.', '.rRr.', 'rRrRr', 'rrrrr', 'wwpww', 'wwwww', 'gwwwg', 'ggWgg'],
    coins: ['.wwwwwwwwwwww.', 'wwcwyywcyywcww', 'wyYwwCyYywwyww', '.dddddddddddd.'],
    spike: ['...b...', '.kbbbk.', '.eebee.', '.yyyyy.', 'yrrrrry', '.yyyyy.', 'ggggggg', 'gGgggGg', '.ggggg.', 'gg...gg'],
    shyguy: ['..rrr..', '.rwwwr.', 'rwkwkwr', 'rwkwkwr', 'rWwkwWr', '.rWwWr.', 'RrkkkrR', '.rrrrr.', '.bb.vv.'],
    hornet: ['w....w.', 'w....w.', '.w..w..', '.wwww..', 'wwwwww.', 'wkwwkw.', 'wkwwkW.', '.wwwW..', '..pr...', '.rrrr..', 'rrrrRr.', 'rrrRRR.'],
    alien: ['.ggg.', 'ggggg', 'gkgkg', 'ggggg', '.ggg.', '..g..', '.ggg.', 'G.g.G', 'g.g.g', '..g..', '.g.g.', '.G.G.'],
    // Mr. Hankey: the Santa hat, eyes, the big smile, thin black arms with white gloves
    hankey: ['....rw.', '...rr..', '..rrr..', '.wwwww.', '.bbbbb.', '.wkbwk.', '.bbbbb.', '.kmmmk.', '.bkkkb.', 'kbbbbbk', 'wbbbbbw', '.bbbBb.', '.bbbBb.', '..bBB..'],
    bear: ['.bb.bb.', '.bbbbb.', '.bkbkb.', '..bpb..', 'bggrggb', 'bgggggb', '.grggr.', '.gg.gg.', '.GG.GG.'],
    mole: ['.bbbbb.', 'bbbbbbb', 'bkbbbkb', 'bbwwwbb', 'bwwkwwb', '.bwwwb.', 'bbwwwbb', 'bwwwwwb', 'BB...BB'],
    goomba: ['.bbbb.', 'bbbbbb', 'bwkkwb', 'bbbbbb', '.lwwl.', 'kk..kk'],
    towel: ['bbbbbbb', 'bwwbwwb', 'bwkbkwb', 'bbbbbbb', 'wwwwwww', 'bbbbbbb', 'wwwwwww', 'BbbbbbB', '.y...y.'],
    tux: ['.kkk.', 'kwkwk', 'kkykk', 'kwwwk', 'kwwwk', 'y...y'],
  };
  // [id, map, x, row (0 = back, 1 = front), line key, mirrored]; drawn back row first, then the front row (array order within a row)
  const FIGS = {
    1: [['hornetL', 'hornet', 137, 0, 'g_hornet'], ['hornetR', 'hornet', 167, 0, 'g_hornet', 1]], // the two Hornets peek out behind the router (it is drawn over them)
    2: [['orangL', 'orang', 134, 1, 'g_toyOrang'], ['horse', 'horse', 141, 0, 'g_toyHorse'], ['gnome1', 'gnome', 149, 1, 'g_toyGnome'], ['coins', 'coins', 153, 1, 'g_toyCoins'],
      ['cat', 'cat', 158, 0, 'g_toyCat'], ['gnome2', 'gnome', 163, 1, 'g_toyGnome'], ['orangR', 'orang', 167, 1, 'g_toyOrang', 1]],
    4: [['spike', 'spike', 134, 0, 'g_figSpike'], ['hankey', 'hankey', 141, 1, 'g_figHankey'], ['alien', 'alien', 147, 0, 'g_figAlien'],
      ['bear', 'bear', 150, 1, 'g_figBear'], ['mole', 'mole', 155, 0, 'g_figMole'], ['goomba', 'goomba', 157, 1, 'g_figGoomba'], ['towel', 'towel', 166, 0, 'g_figTowel'], ['shyguy', 'shyguy', 170, 1, 'g_figShy']], // Round 9 #9/#10: the pink-purple figure and the red «чирик» bird are gone
  };
  const FIG_ORDER = {}; for (const t in FIGS) FIG_ORDER[t] = FIGS[t].filter((f) => !f[3]).concat(FIGS[t].filter((f) => f[3]));
  // Round 9 #2: each shelf is bought — tier 1 the Hornets, tier 2 the toys, tier 4 the Nintendo figurines and (separately) the South Park ones
  const SP_FIGS = ['hankey', 'alien', 'towel'], figOn = (tier, f, it) => !!it && (tier === 1 ? !!it.hornets : tier === 2 ? !!it.toys : SP_FIGS.includes(f[0]) ? !!it.figsSP : !!it.figsN);
  const figList = (tier, it) => FIGS[tier].filter((f) => figOn(tier, f, it));
  const figFoot = (tier, row) => LIPS[tier - 1] - (row ? 1 : 3);
  const pmap = (key, flip) => fur('hfig_' + key + (flip ? '_f' : ''), () => { const rows = FM[key], pal = FP[key], h = rows.length, w = Math.max(...rows.map((r) => r.length)), c = PX.canvas(w, h), x = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(flip ? w - 1 - i : i, y, 1, 1); } })); return c; });
  // ---------- sprites ----------
  const S = {
    // brown panel door with casing (наличник); w,h = outer size incl. casing; glass: small frosted inset (Зал door)
    door: (w, h, kind) => SP(w, h, (a) => {
      const cs = a.mat('hCas', CAS, 2), dr = a.mat('hDoor', DOOR, 2), dl = a.mat('hDoorL', DOOR_L, 2);
      a.box(0, 0, w, h, IT, cs); a.box(0, 0, w, 3, IT, dl);
      a.box(3, 4, w - 3, h, IT, dr);
      const pw = w - 12;
      a.rbox(6, 9, 6 + pw, kind === 'front' ? 52 : 50, 2, IT, dl, { flat: 0.5, bulge: 0.25 });
      a.rbox(6, kind === 'front' ? 58 : 56, 6 + pw, h - 8, 2, IT, dl, { flat: 0.5, bulge: 0.25 });
      if (kind === 'zal') a.rbox(9, 14, w - 9, 44, 2, IT, a.mat('hFrost', '#e9d9b8', 3), { flat: 0.7 });
    }, (d) => {
      d.hline(3, w - 4, 4, '#3a1c0c'); for (let y = 4; y < h; y++) { d.px(3, y, '#3a1c0c'); d.px(w - 4, y, '#7a4527'); }
      const hx = kind === 'front' ? w - 9 : w - 8, hy = Math.round(h * 0.52); d.px(hx, hy, '#f2cf6a'); d.px(hx + 1, hy, '#d9a83a'); d.px(hx - 1, hy + 1, '#b98a2a'); d.px(hx, hy + 1, '#f2cf6a'); d.px(hx, hy - 3, '#b98a2a');
      if (kind === 'front') { d.px(Math.round(w / 2), 40, '#1a0c06'); d.px(Math.round(w / 2), 39, '#c8a050'); for (const y of [hy - 8, hy + 6]) { d.px(hx, y, '#2a1408'); d.px(hx + 1, y, '#8a6a3a'); } }
      for (let k = 0; k < 26; k++) { const x = 5 + Math.floor(hash(k, 1, w + h) * (w - 10)), y = 6 + Math.floor(hash(k, 2, w + h) * (h - 10)); if (d.on(x, y)) d.shade(x, y, k % 2 ? 1 : -1); }
    }),
    // open wardrobe with shelves: folded clothes, a bag, shoe box
    ward: () => SP(WARD[2], WARD[3], (a) => {
      const wd = a.mat('hWard', '#7a5236', 2), wi = a.mat('hWardIn', '#5e3e28', 2), wl = a.mat('hWardL', '#93663f', 2);
      a.box(0, 0, 34, 156, IT, wd); a.box(3, 4, 31, 150, IT, wi, { flat: 0.4 });
      for (const y of [30, 62, 94, 124]) a.box(3, y, 31, y + 3, IT, wl);
      a.box(0, 150, 34, 156, IT, wd);
      const cl = (x0, y0, w, cols) => cols.forEach((c, i) => a.rbox(x0, y0 - (i + 1) * 4, x0 + w, y0 - i * 4, 1.5, IT, a.mat('hCl' + c.slice(1), c)));
      cl(5, 30, 22, ['#e9e2d6', '#c94f6b', '#8fa6c8', '#f0d0a8']);
      cl(6, 62, 12, ['#5d6a80', '#2e3a4e']); a.rbox(19, 46, 29, 62, 2, IT, a.mat('hBag', '#3a3a40'));
      cl(5, 94, 20, ['#ffffff', '#f2e6cc', '#b8b0a8']);
      a.rbox(6, 106, 27, 124, 1, IT, a.mat('hBox', '#c8a06a'));
      a.ell(10, 146, 5, 3, IT, a.mat('hShoe', '#2a2a30')); a.ell(22, 146, 5, 3, IT, a.mat('hShoe2', '#8a5a3a'));
    }, (d) => { d.hline(8, 25, 115, '#a07a48'); d.px(22, 50, '#7a7a84'); d.px(23, 49, '#7a7a84'); }),
    // tall floor mirror in a black wrought-iron frame with a curly crest
    mirror: () => { const W = MIRROR[2], H = MIRROR[3], c = W / 2; return SP(W, H, (a) => {
      const ir = a.mat('hIron', '#2a2628'); a.rbox(0, 8, W, H, 3, IT, ir);
      a.rbox(2, 11, W - 2, H - 3, 2, IT, a.mat('hGlass', '#c9d6dc', 3), { flat: 0.8 });
      a.tube([[3, 10, 1], [c - 6, 4, 1], [c, 2, 1], [c + 6, 4, 1], [W - 3, 10, 1]], IT, ir); a.ell(c, 5, 2, 2, IT, ir);
    }, (d) => {
      for (let k = 0; k < 12; k++) { d.px(5 + k, GL1 + k * 2, '#eef4f6'); d.px(6 + k, GL1 + k * 2, '#eef4f6'); d.px(11 + k, GL2 + k * 2, '#e4eef2'); }
      for (let y = H - 40; y < H - 4; y++) if (d.on(14, y)) d.px(14, y, '#b0bcc4');
      d.px(c - 4, 5, '#5a5458'); d.px(c + 4, 5, '#5a5458');
    }); },
    // round frosted bowl plafond (like the photo): short bronze stem, dark rim, frosted dome with a lace pattern, a little finial
    plafond: () => SP(36, 22, (a) => {
      const br = a.mat('hBr', '#6a4a2a', 2);
      a.tube([[18, 0, 0.8], [18, 4, 0.8]], IT, br); a.ell(18, 4, 4, 1.5, IT, br);
      a.ell(18, 7, 17, 13, IT, a.mat('hPlaf', '#f4eee2', 3), { clip: (x, y) => y >= 7 }); a.box(0, 5, 36, 8, IT, br);
      a.ell(18, 20, 2, 1.5, IT, br);
    }, (d) => { for (let k = 0; k < 7; k++) { const an = Math.PI * (0.15 + k * 0.7 / 6), x = Math.round(18 - Math.cos(an) * 12), y = Math.round(8 + Math.sin(an) * 8); d.px(x, y, '#d8ccb4'); d.px(x + 1, y + 1, '#e4dac6'); }
      for (let x = 4; x < 33; x += 3) d.px(x, 9, '#e0d4bc'); d.px(10, 11, '#ffffff'); d.px(11, 11, '#ffffff'); d.px(12, 12, '#ffffff'); d.hline(1, 34, 5, '#8a6a42'); }),
    // lantern sconce: wooden frame, warm frosted glass
    sconce: (soft) => SP(10, 18, (a) => {
      const wd = a.mat('hScW', '#3a2414'); a.box(0, 2, 10, 17, IT, wd); a.box(2, 4, 8, 15, IT, soft ? a.mat('hScS', '#f3f0e8', 3) : a.mat('hScG', '#f5d690', 3));
      a.box(1, 0, 9, 2, IT, wd);
    }, (d) => { const h = soft ? '#ffffff' : '#fff4cc'; d.px(5, 6, h); d.px(4, 7, h); d.hline(2, 7, 9, '#5a3a20'); }),
    // the drying rack, folded flat and leaning on the wardrobe (chrome rails, rods of the folded wings, plastic feet)
    rack: () => SP(RACK[2], RACK[3], () => {}, (d) => {
      const W = RACK[2], H = RACK[3], lean = (y) => Math.round(3 * (1 - y / (H - 1))), ch = '#c8ced6', cd = '#8a9099', ck = '#e8eef4';
      for (let y = 0; y < H - 2; y++) { const o = lean(y); d.px(2 + o, y, cd); d.px(3 + o, y, ch); d.px(W - 5 + o, y, ch); d.px(W - 4 + o, y, cd); }
      d.hline(3 + lean(0), W - 5 + lean(0), 0, ck); d.hline(3 + lean(1), W - 5 + lean(1), 1, cd);
      for (let y = 5; y < H - 8; y += 3) { const o = lean(y); d.hline(4 + o, W - 6 + o, y, (y / 3) % 2 ? ch : '#b4bac2'); if ((y / 3) % 4 === 0) d.px(8 + o, y, ck); }
      for (const y of [24, 25]) { const o = lean(y); d.px(1 + o, y, '#5a5f68'); d.px(W - 3 + o, y, '#5a5f68'); } // hinges
      for (const x of [1, W - 6]) { d.hline(x, x + 4, H - 2, '#3a3a40'); d.hline(x, x + 4, H - 1, '#26262c'); } // feet
    }),
  };
  const spr = (k, ...a) => fur('hall_' + k + a.join('_'), () => S[k](...a));
  // ---------- painted parts ----------
  function ceiling(P) { // dark wood coffers with painted sky panels (blue + clouds, pink floral rim)
    P.r(0, 0, RW, CEIL, '#3e2416');
    for (const [x0, x1] of [[3, 57], [63, 117], [123, 177]]) {
      P.r(x0, 2, x1 - x0, 20, '#5a3420'); P.r(x0 + 2, 4, x1 - x0 - 4, 16, '#2e1a10');
      const ix = x0 + 3, iw = x1 - x0 - 6; R.vgrad(P, ix, 5, iw, 14, ['#9cc4e0', '#c6dcea', '#efe4d2']);
      for (let k = 0; k < 3; k++) { const cx = ix + 3 + Math.floor(hash(k, x0, 3) * (iw - 6)), cy = 8 + Math.floor(hash(k, x0, 4) * 8); P.r(cx, cy, 4, 1, '#ffffff'); P.r(cx + 1, cy - 1, 2, 1, '#f6f6f6'); }
      for (const sx of [ix + 2, ix + iw - 11]) { const fl = sx > ix + 5 ? -1 : 1; for (let k = 0; k < 9; k++) { const x = sx + (fl > 0 ? k : 8 - k), y = 12 + Math.round(Math.sin(k * 0.9) * 3); P.p(x, y, '#9a5a32'); if (k % 3 === 0) P.p(x, y - 2, '#b87a4a'); } }
      P.p(ix + (iw >> 1), 11, '#9a5a32'); P.p(ix + (iw >> 1) - 1, 12, '#b87a4a'); P.p(ix + (iw >> 1) + 1, 12, '#b87a4a');
      for (let x = ix; x < ix + iw; x += 3) { P.p(x, 5, '#d98aa0'); P.p(x + 1, 18, '#e8b0a0'); }
      P.r(x0 + 1, 21, x1 - x0 - 2, 1, '#7a4a2c');
    }
    P.r(0, 22, RW, 2, '#6b3f24'); P.r(0, 24, RW, 1, '#2e1a10');
    R.cornice(P, 25);
  }
  function walls(P) {
    R.plaster(P, 0, CEIL + 7, RW, FLOOR - CEIL - 7, '#e6d1b4', '#dcc5a6', '#efdcc2', 77);
    P.r(0, FLOOR - 6, RW, 6, '#5a2f17'); P.r(0, FLOOR - 6, RW, 1, '#7a4527'); P.r(0, FLOOR - 1, RW, 1, '#2e1a10');
  }
  function floor(ctx, P, H = R.RH) { // Round 25: H — further down (FILL)
    R.drawFloor(ctx, P, 'cork', FLOOR, H);
    // grey stone tiles at the entrance (in front of the front door) — Round 11 #5: greyer (was a light beige marble)
    for (let y = FLOOR; y < FLOOR + 22; y++) { const w = 26 + (y - FLOOR) * 0.9; P.r(Math.round(90 - w), y, Math.round(w * 2), 1, (y - FLOOR) % 11 === 10 ? '#8f8e8c' : '#a9a8a5'); }
    for (let k = 0; k < 30; k++) P.p(66 + Math.floor(hash(k, 1, 9) * 48), FLOOR + Math.floor(hash(k, 2, 9) * 20), '#9c9b98');
    P.r(64, FLOOR, 52, 1, '#7e7d7b');
  }
  function frontDoor(ctx, st) { // swung open when a parcel comes in: a dark gap + the door leaf seen edge-on at the hinge
    const r = FRONT;
    if (st && st.front > 0) { const P = Painter(ctx); P.r(r[0], r[1], r[2], r[3], CAS); P.r(r[0] + 3, r[1] + 4, r[2] - 6, r[3] - 4, '#3a3634'); P.r(r[0] + 3, r[1] + r[3] - 18, r[2] - 6, 18, '#5a5450'); P.r(r[0] + 3, r[1] + 4, 6, r[3] - 4, DOOR_L); P.r(r[0] + 8, r[1] + 4, 1, r[3] - 4, DOOR_D); }
    else R.wallAt(ctx, spr('door', r[2], r[3], 'front'), r[0], r[1], 2);
  }
  // ---------- the etagere ----------
  function tray(P, L) { // dimpled tray: back edge, surface, front rim with a light top edge, shadow under it
    const x0 = ETAG[0] - 1, w = ETAG[2] + 2;
    P.r(x0 + 2, L - 6, w - 4, 1, RIM); P.r(x0 + 1, L - 5, w - 2, 5, TRAY);
    for (let x = x0 + 4; x < x0 + w - 3; x += 4) for (const y of [L - 4, L - 2]) { const o = y === L - 2 ? 2 : 0; P.p(x + o, y, TRAY_D); P.p(x + o + 1, y, TRAY_L); }
    P.r(x0, L, w, 3, RIM); P.r(x0, L, w, 1, RIM_L); P.r(x0, L + 3, w, 1, '#2a2d2f');
    P.p(x0, L + 1, POLE); P.p(x0 + w - 1, L + 1, '#45494c');
  }
  function etagere(ctx, P, it) {
    const [ex, , ew] = ETAG, top = LIPS[0] - 6;
    P.shadow(ex + ew / 2, FLOOR + 2, ew / 2 + 2, 3, 0.25);
    // back poles + the router's cable running down the back to the wall socket, then the trays, then the front poles over the rims
    for (const x of [ex + 4, ex + ew - 6]) { P.r(x, top, 2, FLOOR - top, '#3e4245'); }
    if (it.router) for (let y = top; y < FLOOR; y++) P.p(ex + ew - 5 + (Math.floor(y / 9) % 2), y, CABLE);
    LIPS.forEach((L) => tray(P, L));
    for (const x of [ex, ex + ew - 2]) { P.r(x, top + 1, 2, FLOOR - top + 1, POLE); P.r(x, top + 1, 1, FLOOR - top + 1, POLE_L); P.r(x - 1, FLOOR, 4, 2, '#2e3133'); P.r(x, top, 2, 1, POLE_L); }
    // tier 3: the Linux TV box (black, the orange swirl and the triangle logo on top, HDMI + a blue LED at the front) and its cables (IMG_7813 / 7821)
    if (it.linux) linuxBox(P);
    // floor: the robot vacuum's dock under the bottom tray (IMG_7817: a black tower with a silver strip and a light)
    if (it.vacuum) dock(P);
  }
  function linuxBox(P) {
    const lx = 145, ly = LIPS[2] - 8;
    P.r(lx + 1, ly - 2, 17, 1, '#2a2a30'); P.r(lx, ly - 1, 19, 4, '#1c1c20'); P.r(lx, ly + 3, 19, 4, '#121215'); P.r(lx, ly + 7, 19, 1, '#0a0a0c');
    for (let k = 0; k < 26; k++) { const a = Math.PI * (0.55 + k * 0.062), rr = 1 - k * 0.018, x = Math.round(lx + 9.5 + Math.cos(a) * 8 * rr), y = Math.round(ly + 0.6 + Math.sin(a) * 2.2 * rr); P.p(x, y, k < 9 ? '#c85a1a' : k < 18 ? '#e8782a' : '#f4b050'); } // the orange swirl
    P.p(lx + 9, ly - 1, '#9a9aa0'); P.p(lx + 8, ly, '#9a9aa0'); P.p(lx + 10, ly, '#7a7a80'); P.p(lx + 11, ly + 1, '#7a7a80'); P.r(lx + 8, ly + 1, 3, 1, '#6a6a70'); // the triangle logo
    P.r(lx + 7, ly + 5, 3, 1, '#3a3a42');
    for (const [x, y] of [[lx + 3, ly + 7], [lx + 3, ly + 8], [lx + 2, ly + 9], [lx + 2, ly + 10], [lx + 1, ly + 11], [lx + 1, ly + 12], [lx + 1, ly + 13], [lx + 2, ly + 14], [lx + 3, ly + 15], [lx + 4, ly + 15]]) P.p(x, y, CABLE); // hangs over the rim
    for (let k = 0; k <= 10; k++) P.p(lx + 16 + k, ly + 6 + Math.round(Math.sin(k / 10 * Math.PI) * 1.5), CABLE);
    for (let k = 0; k < 9; k++) P.p(lx - 6 + k, LIPS[1] + 5 + Math.round(Math.sin(k / 8 * Math.PI) * 2), CABLE); // the power lead loops down from the tray above
  }
  function dock(P) {
    const [dx, dy, dw, dh] = DOCK; P.r(dx + 1, dy, dw - 2, 1, '#2a2b30'); P.r(dx, dy + 1, dw, dh - 3, '#1e1f23'); P.r(dx + 1, dy + 1, 2, dh - 4, '#33353a'); P.r(dx + 4, dy + 3, dw - 8, 1, '#8a8e96');
    P.r(dx - 1, dy + dh - 2, dw + 2, 2, '#26272b'); P.p(dx + dw / 2, dy + 5, '#e8f4ff');
  }
  function router(ctx, P, rk, t) { // GL.iNet (IMG_7819 / 7820): a wide black body with the vent grille, four tall antennas, the logo, a blue light
    const [rx, ry] = ROUTER;
    for (const [x, h, lean] of [[1, 13, -1], [6, 12, 0], [13, 12, 0], [18, 13, 1]]) { for (let j = 0; j < h; j++) P.p(rx + x + (lean && j > h - 4 ? lean : 0), ry - j - 1, j > h - 2 ? '#3a3c42' : '#1e1f23'); P.p(rx + x, ry - 2, '#45474e'); }
    P.r(rx + 1, ry, 18, 1, '#3c3e44'); P.r(rx, ry + 1, 20, 6, '#1c1d21'); P.r(rx, ry + 7, 20, 1, '#0e0e10'); P.r(rx + 1, ry + 1, 18, 1, '#2c2e33');
    for (let x = rx + 7; x < rx + 13; x += 2) P.r(x, ry + 2, 1, 3, '#0c0c0e'); // the vent grille
    P.r(rx + 8, ry + 5, 4, 1, '#c8c8cc'); // «GL·iNet»
    // its LEDs: a calm blink; after a tap they go dark (reboot), then flash and Wi-Fi arcs pulse over the antennas
    for (let i = 0; i < 3; i++) { const on = rk >= 0 ? (rk > 0.25 && Math.floor(t * 14 + i * 3) % 2) : i === 0 || Math.floor(t * (2 + i) + i) % 3; P.p(rx + 3 + i * 2, ry + 5, on ? (i === 0 ? '#5aa8ff' : '#5aff7a') : '#26302a'); }
    P.p(rx + 15, ry + 5, rk >= 0 && rk < 0.25 ? '#26302a' : '#3a8aff');
    if (rk > 0.25) for (let k = 0; k < 3; k++) { const ph = (t * 2 + k / 3) % 1, r = 2 + Math.round(ph * 6); ctx.globalAlpha = 1 - ph; for (let a = -3; a <= 3; a++) P.p(rx + 10 + Math.round(a / 3 * r), ry - 15 - Math.round(Math.cos(a / 3 * 1.1) * r * 0.5), '#5ac8ff'); ctx.globalAlpha = 1; }
  }
  function figs(ctx, P, g, t, it) { // the Hornets, the figurines and the toys (in dyn so the tapped one can hops), the router over the Hornets, the Linux box LED + Tux
    const sel = g.fig;
    for (const tier of [1, 2, 4]) { for (const f of FIG_ORDER[tier]) {
      const [id, map, x, row, , flip] = f; if (!figOn(tier, f, it)) continue;
      const c = pmap(map, flip), up = sel && sel.id === id ? 1 + Math.round(Math.abs(Math.sin(sel.k * Math.PI * 4)) * 4) : 0;
      if (up) P.shadow(x + c.width / 2, figFoot(tier, row) + 1, c.width / 2, 1, 0.3);
      R.sprAt(ctx, c, x, figFoot(tier, row) - c.height + 1 - up);
    } if (tier === 1 && it.router) router(ctx, P, g.router, t); }
    if (!it.linux) return;
    // Linux box: the blue LED; on a tap the swirl glows and Tux pops up from behind it
    const lx = 145, ly = LIPS[2] - 8, lk = g.linux;
    P.p(lx + 13, ly + 5, lk >= 0 ? (Math.floor(t * 10) % 2 ? '#7ad8ff' : '#2a6aff') : '#2a6aff');
    if (lk >= 0) { const up = Math.round(Math.min(1, lk * 5, (1 - lk) * 5) * 7), c = pmap('tux'); if (up > 0) { ctx.save(); ctx.beginPath(); ctx.rect(lx, ly - 12, 19, 10); ctx.clip(); R.sprAt(ctx, c, lx + 12, ly - 2 - up); ctx.restore(); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * Math.min(1, lk * 6); P.r(lx + 2, ly - 1, 15, 4, '#e8782a'); ctx.restore(); }
  }
  // ---------- builders ----------
  function bg(ctx, P, H, ph, curH = R.RH) {
    const it = H.items;
    ceiling(P); walls(P); floor(ctx, P, curH);
    for (const [x, y, soft] of SCONCES) R.wallAt(ctx, spr('sconce', soft), x, y, 2);
    P.shadow(17, FLOOR + 2, 20, 3, 0.25); R.wallAt(ctx, spr('ward'), WARD[0], WARD[1], 3);
    P.shadow(MIRROR[0] + MIRROR[2] / 2, FLOOR + 1, MIRROR[2] / 2 + 1, 2, 0.25); R.wallAt(ctx, spr('mirror'), MIRROR[0], MIRROR[1], 3);
    etagere(ctx, P, it); keyRack(P);
  }
  // light from the top-left (pixel-art-sprites: directional, not pillow shading): lit top edge, dark underside, brass hooks
  function keyRack(P) {
    const [x, y, w, h] = KEYS, hk = [x + 3, ZHOOK[0], x + 15];
    P.r(x + 1, y + h, w - 1, 1, '#c4ab8a'); // its shadow on the wall
    P.r(x, y, w, h, '#6e4224'); P.r(x, y, w, 1, '#9a6a40'); P.r(x, y + h - 1, w, 1, '#4a2a14'); P.p(x + 1, y + 1, '#3a2010'); P.p(x + w - 2, y + 1, '#3a2010');
    for (const hx of hk) { P.r(hx, y + h, 1, 2, '#a88420'); P.p(hx + 1, y + h + 1, '#e0b440'); }
    // left: a ring with a silver and a gold key
    const rx = hk[0], ry = y + h + 2; P.r(rx - 1, ry, 3, 1, '#a0a4a8'); P.p(rx - 1, ry + 1, '#a0a4a8'); P.p(rx + 1, ry + 1, '#6e7276'); P.r(rx - 1, ry + 2, 3, 1, '#6e7276');
    P.r(rx - 3, ry + 3, 2, 2, '#c8ccd0'); P.p(rx - 3, ry + 3, '#eef0f2'); P.r(rx - 3, ry + 5, 1, 4, '#a8acb0'); P.p(rx - 2, ry + 7, '#a8acb0'); P.p(rx - 2, ry + 8, '#8a8e92');
    P.r(rx + 1, ry + 3, 2, 2, '#e0b440'); P.p(rx + 1, ry + 3, '#f4d870'); P.r(rx + 2, ry + 5, 1, 5, '#c8962c'); P.p(rx + 3, ry + 8, '#c8962c'); P.p(rx + 3, ry + 9, '#a88420');
    // right: one long key with a red tag
    const qx = hk[2], qy = y + h + 2; P.r(qx - 1, qy, 3, 2, '#b4b8bc'); P.p(qx - 1, qy, '#e4e6e8'); P.r(qx, qy + 2, 1, 6, '#a0a4a8'); P.r(qx + 1, qy + 6, 1, 2, '#8a8e92');
    P.r(qx + 2, qy + 1, 3, 4, '#d8302a'); P.p(qx + 2, qy + 1, '#f06050'); P.r(qx + 2, qy + 4, 3, 1, '#a82420');
  }
  function rack(ctx, P, r) { // Round 5 D: the drying rack wobbles on a tap and falls flat on the floor (it pivots on its right foot)
    const a = (r && r.a) || 0, f = (r && r.fall) || 0;
    P.shadow(RACK[0] + RACK[2] / 2 + f * 26, RACK[1] + RACK[3], RACK[2] / 2 + f * 16, 2 + f * 2, 0.22);
    if (!a && !f) { R.sprAt(ctx, spr('rack'), RACK[0], RACK[1]); return; }
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(RACK[0] + RACK[2], RACK[1] + RACK[3]); ctx.scale(1, 1 - 0.55 * f * f); ctx.rotate(a); ctx.drawImage(spr('rack'), -RACK[2], -RACK[3]); ctx.restore();
  }

  // Round 6 D: the mirror shows him — a smaller, flipped copy behind the glass (the same pose, a little bluish), only the moving glint (me.shine) stays on top;
  // st.me = { e: his sprite composed at ~0.6 size, x, jy, k: 0..1 how much of him the mirror catches, shine: 0..1 a glint sweeping down }
  const GLASS = [MIRROR[0] + 2, MIRROR[1] + 11, MIRROR[2] - 4, MIRROR[3] - 13]; let rc = null;
  function reflect(ctx, P, me) {
    if (!me || !me.e || !(me.k > 0)) return;
    const [gx, gy, gw, gh] = GLASS, e = me.e, W = e.w, Hh = e.h;
    if (!rc) rc = document.createElement('canvas'); if (rc.width !== W || rc.height !== Hh) { rc.width = W; rc.height = Hh; }
    const r = rc.getContext('2d'); r.setTransform(1, 0, 0, 1, 0, 0); r.globalCompositeOperation = 'source-over'; r.globalAlpha = 1; r.clearRect(0, 0, W, Hh); r.imageSmoothingEnabled = false;
    r.setTransform(-1, 0, 0, 1, W, 0); r.drawImage(e.cv, 0, 0); r.setTransform(1, 0, 0, 1, 0, 0);
    // a soft glass tint (top-down gradient, fading out) instead of a flat grey wash — he stays clean, just a touch cooler
    { const gr = r.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, 'rgba(214,232,240,0.22)'); gr.addColorStop(0.55, 'rgba(214,232,240,0.08)'); gr.addColorStop(1, 'rgba(214,232,240,0)');
      r.globalCompositeOperation = 'source-atop'; r.fillStyle = gr; r.fillRect(0, 0, W, Hh); r.globalCompositeOperation = 'source-over'; }
    const cx = Math.round(gx + gw / 2 - 1 + Math.min(0, (me.x - 80) * 0.25)), fy = gy + gh - 3 + Math.round((me.jy || 0) * 0.6);
    ctx.save(); ctx.beginPath(); ctx.rect(gx, gy, gw, gh); ctx.clip(); ctx.imageSmoothingEnabled = false;
    const mx = MIRROR[0], my = MIRROR[1]; // the static glare streaks of the glass go UNDER him now, so they no longer cross his face
    ctx.globalAlpha = 0.9 * me.k;
    for (let k = 0; k < 12; k++) { P.p(mx + 5 + k, my + GL1 + k * 2, '#eef4f6'); P.p(mx + 6 + k, my + GL1 + k * 2, '#eef4f6'); P.p(mx + 11 + k, my + GL2 + k * 2, '#e4eef2'); }
    ctx.globalAlpha = 0.95 * me.k; ctx.drawImage(rc, cx - (W - e.ox), fy - e.oy);
    if (me.shine > 0 && me.shine < 1) { // a glint runs down the glass as he strikes a pose
      ctx.globalAlpha = 0.55 * Math.sin(Math.PI * me.shine); const y0 = gy + me.shine * (gh + 40) - 30;
      for (let y = 0; y < 22; y++) P.r(gx + Math.round(y * 0.9), Math.round(y0 + y), 3, 1, '#ffffff');
    }
    ctx.restore();
  }
  function dyn(ctx, P, H, t, st) {
    const g = st.g || {};
    reflect(ctx, P, st.me); frontDoor(ctx, st); rack(ctx, P, g.rack); figs(ctx, P, g, t, H.items);
    R.sprAt(ctx, spr('plafond'), 72, 25);
    const ph = R.phase(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = ph === 'night' || ph === 'evening' ? 0.08 : 0.05;
    for (const r of [16, 11, 7]) P.circ(90, 38, r, '#fff1c0'); if (st.sconces !== false) for (const [x, y, soft] of SCONCES) for (const r of [12, 8, 5]) P.circ(x + 5, y + 8, r, soft ? '#fff6ea' : '#ffcf7a'); ctx.restore();
    if (st.sconces === false) for (const [x, y, soft] of SCONCES) { ctx.globalAlpha = 0.72; P.r(x + 2, y + 4, 6, 11, soft ? '#b9b6ae' : '#b5a27a'); ctx.globalAlpha = 1; P.r(x + 2, y + 9, 6, 1, '#5a3a20'); P.p(x + 5, y + 6, soft ? '#d4d2cc' : '#cdbb90'); } // switched off: plain frosted glass
  }
  function front() { } // Round 10 #3: no ficus in the hall any more
  function spots(it) {
    const on = it || {}, wa = null; // Round 10 #3: no wall art
    return { wardrobe: WARD.slice(), mirror: MIRROR.slice(), rack: RACK.slice(), sconces: SCONCES.map(([x, y]) => [x, y, 10, 18]), plafond: [68, 20, 44, 45], wallart: wa, front: FRONT.slice(),
      etagere: ETAG.slice(), tiers: TIERS.map((r) => r.slice()), hornet: on.hornets ? [134, LIPS[0] - 15, 42, 15] : null, router: on.router ? [ROUTER[0] - 1, ROUTER[1] - 14, 22, 22] : null, toys: on.toys ? [134, TIERS[1][1], 42, LIPS[1] - TIERS[1][1]] : null,
      linux: on.linux ? [144, LIPS[2] - 11, 22, 12] : null, figs: on.figsN || on.figsSP ? [134, LIPS[3] - 15, 42, 15] : null, vacuum: on.vacuum ? [DOCK[0] - 6, DOCK[1] - 1, DOCK[2] + 12, 22] : null, keys: KEYS.slice(), zhuk: ZHUK.slice(), zhukHook: ZHOOK.slice(), visit: [146, 276], visitFly: [146, 276, 70], party: { pusya: [40, 278], zhuk: [70, 286], monty: [142, 278], mosq: [118, 276, 82] } };
  }
  // «Дом» thumbnails: the thing drawn where it stands, cut out of an empty room-sized canvas
  const cut = (r, fn) => { const c = PX.canvas(r[2], r[3]), x = c.getContext('2d'); x.translate(-r[0], -r[1]); fn(x, Painter(x)); return c; };
  const figCut = (tier, only) => { // the figures of one purchase packed side by side (two rows if they don't fit 32 px), feet on a line
    const ms = FIGS[tier].filter((f) => figOn(tier, f, only)).map((f) => pmap(f[1], f[5])), wid = (a) => a.reduce((s, m) => s + m.width + 1, -1);
    const rows = wid(ms) <= 32 ? [ms] : [ms.slice(0, Math.ceil(ms.length / 2)), ms.slice(Math.ceil(ms.length / 2))], hs = rows.map((r) => Math.max(...r.map((m) => m.height)));
    const c = PX.canvas(Math.max(...rows.map(wid)), hs[0] + (hs[1] ? hs[1] + 1 : 0)), x = c.getContext('2d');
    rows.forEach((r, j) => { let px = Math.floor((c.width - wid(r)) / 2); const by = j ? c.height : hs[0]; for (const m of r) { x.drawImage(m, px, by - m.height); px += m.width + 1; } }); return c; };
  R.register('hall', { bg, floor, dyn, front, spots, thumbs: {
    router: () => cut([ROUTER[0] - 1, ROUTER[1] - 14, 22, 23], (c, P) => router(c, P, -1, 0)), linux: () => cut([138, LIPS[2] - 11, 30, 26], (c, P) => linuxBox(P)),
    hornets: () => figCut(1, { hornets: 1 }), toys: () => figCut(2, { toys: 1 }), figsN: () => figCut(4, { figsN: 1 }), figsSP: () => figCut(4, { figsSP: 1 }),
    vacuum: () => cut([132, DOCK[1] - 1, 44, 40], (c, P) => { dock(P); GAGS.vacBody(P, 160, 232, false, 0); }) } });
  return { spots, figList, FIGS, FM, FP, figFoot, LIPS, DOCK, GLASS };
})();
