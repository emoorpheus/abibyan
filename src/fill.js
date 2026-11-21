'use strict';
// ===== Round 25: the whole phone screen =====
// The room is a 180×320 picture; a phone is taller (and with integer pixels a bit wider). Installed «На экран Домой» it showed dark
// bands under the status bar and below the room (the user's iPhone, 2026-11-06). FILL draws the picture's surroundings on #ext
// behind the stage: above — the ceiling's colour, a little darker toward the screen's top (the status bar stays readable); below —
// the room's own floor (ROOMS.floorExt) lit like the room (the picture's bottom rows ÷ the bare floor = the light); at the sides —
// the picture's edge columns. A modal dims the bands, the shop sheet goes on to the bottom. iOS 26 gives a home-screen app a short
// viewport (innerHeight = the screen minus the top safe area): #ext goes down to the screen's real bottom and the page background
// takes the floor's colour; the panels and buttons stay where touches surely land. A wide window (desktop, landscape): off.
const FILL = (() => {
  const RW = 180, RH = 320, SHADE = '#2a1620';
  let on = false, ec = null, ex = null, acc = 9, sAcc = 9, key = '', sig = '', prev = null, slid = false, bgCss = '';
  const g = { R0: 0, R1: 0, SX: 0, SXR: 0, u: 2, W: RW, H: RH, fullH: 0, top: 0, left: 0 };
  const smp = { top: { a: [0, 0, 0], b: null, ph: 0 }, bot: [0, 0, 0], lit: [1, 1, 1], room: null };
  const ios = () => /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = () => navigator.standalone === true || !!(window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  const rgb = (c) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
  function layout(u) {
    ec = ec || document.getElementById('ext'); if (!ec) return;
    const cv = document.getElementById('cv'), r = cv.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    let fullH = Math.max(vh, (window.screen && window.screen.height) || 0);
    const gl = Math.max(0, r.left), gr = Math.max(0, vw - r.right);
    const want = r.width > 0 && vh >= vw * 1.05;
    on = want; document.documentElement.classList.toggle('fill', on);
    if (!on) { if (bgCss) { document.documentElement.style.backgroundColor = ''; bgCss = ''; } return; }
    const c = (v) => Math.max(0, Math.ceil(v / u - 0.01));
    Object.assign(g, { u, fullH, SX: c(gl), SXR: c(gr), R0: c(r.top), R1: c(fullH - r.bottom) });
    g.W = g.SX + RW + g.SXR; g.H = g.R0 + RH + g.R1; g.left = r.left - g.SX * u; g.top = r.top - g.R0 * u;
    ec.width = g.W; ec.height = g.H; ex = ec.getContext('2d'); ex.imageSmoothingEnabled = false;
    Object.assign(ec.style, { left: g.left + 'px', top: g.top + 'px', width: g.W * u + 'px', height: g.H * u + 'px' });
    key = ''; acc = 9; // redraw everything on the next frame
  }
  // the most common colour of a strip of the picture
  function mode(d) { const h = new Map(); let best = 0, k0 = 0; for (let i = 0; i < d.length; i += 4) { const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2], n = (h.get(k) || 0) + 1; h.set(k, n); if (n > best) { best = n; k0 = k; } } return [k0 >> 16, (k0 >> 8) & 255, k0 & 255]; }
  // the picture's top edge: a plain colour (its top row's most common), or a 50/50 dither of two (the zal's ceiling) — that goes on
  function edge(d) {
    const h = new Map(); for (let i = 0; i < RW * 2 * 4; i += 4) { const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; h.set(k, (h.get(k) || 0) + 1); }
    const top = [...h.entries()].sort((x, y) => y[1] - x[1]), C = (k) => [k >> 16, (k >> 8) & 255, k & 255], at = (x, y) => { const i = (y * RW + x) * 4; return (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; };
    if (top.length > 1 && top[0][1] + top[1][1] >= RW * 2 * 0.7 && top[1][1] >= RW * 2 * 0.25) { // two colours, each ~half: a checkerboard?
      const A = top[0][0], B = top[1][0]; let same = 0, ph = 0, n = 0;
      for (let x = 0; x < RW; x++) { const p0 = at(x, 0), p1 = at(x, 1); if ((p0 === A || p0 === B) && (p1 === A || p1 === B)) { n++; if (p0 !== p1) same++; if ((x % 2 === 0) === (p0 === A)) ph++; } }
      if (n > RW * 0.6 && same > n * 0.8) return { a: C(A), b: C(B), ph: ph > n / 2 ? 0 : 1 }; // even x of row 0 is A (ph 0) or B (ph 1)
    }
    return { a: mode(d.subarray(0, RW * 4)), b: null, ph: 0 };
  }
  const HG = new Uint16Array(257 * 3); // the ratios' histograms (a sort of 1440 numbers ×3 was ~1 ms on a phone, 5 times a second)
  // the room's light: its picture's bottom rows ÷ the same rows of the bare floor (a median — the monkey or a toy there do not count)
  function light(live, room) {
    const f = ROOMS.floorExt(room, g.R1); if (!f) return null; const s = f.rows, n = [0, 0, 0]; HG.fill(0);
    for (let i = 0; i < live.length; i += 4) for (let ch = 0; ch < 3; ch++) { const b = s[i + ch]; if (b > 24) { HG[ch * 257 + Math.min(256, Math.round(live[i + ch] / b * 256))]++; n[ch]++; } }
    return n.map((m, ch) => { if (!m) return 1; let c = 0; for (let v = 0; v <= 256; v++) { c += HG[ch * 257 + v]; if (c > m >> 1) return v / 256; } return 1; });
  }
  function sample(cv, scene) {
    const home = scene !== 'game', room = home ? HOME.room : null, sl = home && HOME.slide ? HOME.slide() : null, cam = home ? HOME.camY : 0;
    const srcCv = (home && typeof HOME !== 'undefined' && HOME.off) ? HOME.off : cv; // offscreen canvas avoids GPU-to-CPU stall on Safari
    const c = srcCv.getContext('2d');
    if (cam < 1) smp.top = edge(c.getImageData(0, 0, RW, 2).data);
    if (!home) smp.bot = mode(c.getImageData(0, RH - 2, RW, 2).data);
    else if (!sl && cam < 1 && g.R1) { const L = light(c.getImageData(0, RH - 8, RW, 8).data, room); if (L) { smp.lit = L; smp.room = room; } else smp.bot = mode(c.getImageData(0, RH - 2, RW, 2).data); }
    sig = [smp.top.a, smp.top.b, smp.top.ph, smp.bot, smp.lit].join('|');
  }
  let metaTheme = null;
  function updateThemeColor(c) {
    if (!metaTheme) metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme && c) metaTheme.setAttribute('content', rgb(c));
  }
  function topBand(e, dim) { // the ceiling going on up: its natural colour (or its dither)
    if (e && e.a) updateThemeColor(e.a);
    if (!g.R0) return; const im = ex.createImageData(g.W, g.R0), d = im.data;
    for (let y = 0; y < g.R0; y++) { const dy = g.R0 - y; // dy: rows above the picture's top
      for (let x = 0; x < g.W; x++) { const i = (y * g.W + x) * 4;
        const col = e.b && ((((x - g.SX) % 2 + 2) % 2 + dy) % 2 === 0) !== (e.ph === 0) ? e.b : e.a;
        d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; } }
    ex.putImageData(im, 0, 0); if (dim) { ex.fillStyle = dim; ex.fillRect(0, 0, g.W, g.R0); }
  }
  function floorAt(room, dx) { // the room's own floor below the picture, shifted by dx (a slide)
    const f = room && ROOMS.floorExt(room, g.R1); if (!f) return false;
    ex.drawImage(f.cv, 0, RH, RW, g.R1, g.SX + dx, g.R0 + RH, RW, g.R1); return true;
  }
  function botBand(scene, o) {
    if (!g.R1) return; const y0 = g.R0 + RH, home = scene !== 'game';
    if (o.sheet) { ex.fillStyle = o.sheet; ex.fillRect(0, y0, g.W, g.R1); setBg(o.sheetC); return; }
    ex.save(); ex.beginPath(); ex.rect(g.SX, y0, RW, g.R1); ex.clip();
    let floor = false;
    if (home) { const room = HOME.room, sl = HOME.slide ? HOME.slide() : null;
      if (sl && prev && prev !== room) { const a = floorAt(prev, Math.round(-sl.dir * sl.e * RW)), b = floorAt(room, Math.round(sl.dir * (1 - sl.e) * RW)); floor = a && b; }
      else floor = floorAt(room, 0);
      if (floor) { ex.globalCompositeOperation = 'multiply'; ex.fillStyle = rgb(smp.lit.map((v) => v * 255)); ex.fillRect(g.SX, y0, RW, g.R1); ex.globalCompositeOperation = 'source-over'; } }
    if (!floor) { ex.fillStyle = rgb(smp.bot); ex.fillRect(g.SX, y0, RW, g.R1); }
    ex.restore();
    mirror(ec, g.SX, y0, g.R1, y0);
    if (o.dim) { ex.fillStyle = o.dim; ex.fillRect(0, y0, g.W, g.R1); }
    // the page behind (iOS 26: the strip under the short viewport may show it): the floor's colour at the bottom
    const f = home && floor && ROOMS.floorExt(HOME.room, g.R1), base = f ? f.mean : smp.bot, lit = f ? smp.lit : [1, 1, 1], k = 1, dm = o.dim ? 0.4 : 1;
    setBg(base.map((v, i) => v * lit[i] * k * dm));
  }
  function setBg(c) { const s = rgb(c); if (s !== bgCss) { bgCss = s; document.documentElement.style.backgroundColor = s; } }
  // the side gaps: the picture's edge columns mirrored (a bed cut by the edge goes on as itself; a stretched outline was a dark bar)
  function mirror(src, sx, sy, h, dy) {
    if (g.SX) { ex.save(); ex.translate(g.SX, 0); ex.scale(-1, 1); ex.drawImage(src, sx, sy, g.SX, h, 0, dy, g.SX, h); ex.restore(); }
    if (g.SXR) { ex.save(); ex.translate(g.SX + RW + g.SXR, 0); ex.scale(-1, 1); ex.drawImage(src, sx + RW - g.SXR, sy, g.SXR, h, 0, dy, g.SXR, h); ex.restore(); }
  }
  function sides(cv, o) { // every frame: they move with the room
    const y = g.R0;
    // under the picture's own edge: its edge rows/columns once more — the stage and #ext round to device pixels apart, a 1-px line showed
    ex.drawImage(cv, 0, 0, 1, RH, g.SX, y, 1, RH); ex.drawImage(cv, RW - 1, 0, 1, RH, g.SX + RW - 1, y, 1, RH);
    ex.drawImage(cv, 0, 0, RW, 1, g.SX, y, RW, 1); ex.drawImage(cv, 0, RH - 1, RW, 1, g.SX, y + RH - 1, RW, 1);
    if (!g.SX && !g.SXR) return;
    mirror(cv, 0, 0, RH, y);
    if (o.sheet && o.sheetY < y + RH) { const a = Math.max(y, o.sheetY); ex.fillStyle = o.sheet; ex.fillRect(0, a, g.SX, y + RH - a); ex.fillRect(g.SX + RW, a, g.SXR, y + RH - a); }
    if (o.dim) { ex.fillStyle = o.dim; ex.fillRect(0, y, g.SX, RH); ex.fillRect(g.SX + RW, y, g.SXR, RH); }
  }
  let sheetCol = null;
  function draw(dt, scene, cv) {
    if (!on || !ex || !cv) return;
    const home = scene !== 'game', room = home ? HOME.room : null, sl = home && HOME.slide ? HOME.slide() : null;
    if (!sl) prev = room;
    acc += dt; if (acc >= (dt < 0.025 ? 0.2 : 0.6)) { acc = 0; sample(cv, scene); } // a light switched on shows below within a blink
    const modal = UI.hasModal(), sh = UI.sheetOpen ? document.getElementById('sheet') : null;
    if (sh && !sheetCol) { const m = getComputedStyle(sh).backgroundColor.match(/\d+/g); sheetCol = m ? m.slice(0, 3).map(Number) : [255, 244, 226]; }
    const o = { dim: modal ? 'rgba(25,12,22,.6)' : null, sheet: sh ? rgb(sheetCol) : null, sheetC: sheetCol, sheetY: sh ? (sh.getBoundingClientRect().top - g.top) / g.u : 1e9 };
    const k = sig + '|' + scene + '|' + room + '|' + modal + '|' + (sh ? Math.round(o.sheetY) : '-'); // cheap: sig changes only when a sample does
    let all = false; if (k !== key || sl || slid) { key = k; slid = !!sl; topBand(smp.top, o.dim); botBand(scene, o); all = true; }
    // the sides follow the picture's edges: every frame when it moves (60 fps), 4 times a second when it just sits (battery: r20 perf)
    sAcc += dt; if (all || dt < 0.025 || sAcc >= 0.25) { sAcc = 0; sides(cv, o); }
  }
  return { layout, draw, get on() { return on; }, get state() { return { on, ...g }; } };
})();
