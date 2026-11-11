'use strict';
// ===== Pixel utilities =====
const PX = (() => {
  const hex = (c) => { const n = parseInt(c.slice(1), 16); return ((0xff << 24) | ((n & 0xff) << 16) | (n & 0xff00) | ((n >> 16) & 0xff)) >>> 0; };
  const hash = (x, y, s = 0) => {
    let h = Math.imul((x | 0) ^ 0x27d4eb2d, 0x165667b1) ^ Math.imul(((y | 0) + 0x3c6ef372) | 0, 0x85ebca6b) ^ Math.imul(((s | 0) + 0x632be5ab) | 0, 0xc2b2ae35);
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  };
  const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const bayer = (x, y) => B4[((y & 3) << 2) | (x & 3)] / 16 - 0.47;
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return c; }
  function hsl(hexc) {
    const n = parseInt(hexc.slice(1), 16); let r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    return [h * 360, s, l];
  }
  function fromHsl(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
    const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    let r, g, b; if (s === 0) r = g = b = l; else { const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3); }
    const t = (v) => Math.round(v * 255).toString(16).padStart(2, '0'); return '#' + t(r) + t(g) + t(b);
  }
  // 6-step ramp: [outline, dark2, dark1, base, light1, light2] with hue shifting
  function ramp(base) {
    const [h, s, l] = hsl(base);
    const coolH = h + (h > 60 && h < 240 ? 12 : -14); const warmH = h + (h > 60 && h < 240 ? -10 : 10);
    return [fromHsl(coolH + 8, Math.min(1, s * 0.9 + 0.08), l * 0.28), fromHsl(coolH, Math.min(1, s * 1.05), l * 0.62), fromHsl(coolH * 0.5 + h * 0.5, s, l * 0.81), base,
      fromHsl(warmH * 0.5 + h * 0.5, s * 0.95, Math.min(0.97, l + (1 - l) * 0.28)), fromHsl(warmH, s * 0.85, Math.min(0.985, l + (1 - l) * 0.55))];
  }
  function shade(hexc, k) { const [h, s, l] = hsl(hexc); return fromHsl(h, s, Math.max(0, Math.min(1, l * k))); }
  return { hex, hash, bayer, canvas, hsl, fromHsl, ramp, shade };
})();

// ===== Immediate-mode pixel painter for scene art (integer coordinates) =====
function Painter(ctx) {
  const P = {
    ctx,
    r(x, y, w, h, c) { if (w <= 0 || h <= 0) return; ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
    p(x, y, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); },
    hl(x, y, w, c) { P.r(x, y, w, 1, c); },
    vl(x, y, h, c) { P.r(x, y, 1, h, c); },
    ell(cx, cy, rx, ry, c) {
      ctx.fillStyle = c; const y0 = Math.round(cy - ry), y1 = Math.round(cy + ry);
      for (let y = y0; y < y1; y++) { const dy = (y + 0.5 - cy) / ry; const hw = rx * Math.sqrt(Math.max(0, 1 - dy * dy)); const xa = Math.round(cx - hw), xb = Math.round(cx + hw); if (xb > xa) ctx.fillRect(xa, y, xb - xa, 1); }
    },
    circ(cx, cy, r, c) { P.ell(cx, cy, r, r, c); },
    line(x0, y0, x1, y1, c) {
      ctx.fillStyle = c; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
      for (;;) { ctx.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
    },
    // outlined, shaded box. cols: [outline, dark, base, light]
    box(x, y, w, h, cols, o = {}) {
      const [ol, dk, bs, lt] = cols; P.r(x, y, w, h, ol); P.r(x + 1, y + 1, w - 2, h - 2, bs);
      if (lt) { P.r(x + 1, y + 1, w - 2, 1, lt); if (!o.noSideHi) P.r(x + 1, y + 1, 1, h - 2, lt); }
      if (dk) { P.r(x + 1, y + h - 2, w - 2, 1, dk); if (!o.noSideHi) P.r(x + w - 2, y + 1, 1, h - 2, dk); }
      if (o.round) { P.r(x, y, 1, 1, 'rgba(0,0,0,0)'); ctx.clearRect(x, y, 1, 1); ctx.clearRect(x + w - 1, y, 1, 1); ctx.clearRect(x, y + h - 1, 1, 1); ctx.clearRect(x + w - 1, y + h - 1, 1, 1); }
    },
    // rounded box without clearing (draws corners with given bg)
    rbox(x, y, w, h, cols) {
      const [ol, dk, bs, lt] = cols; P.r(x + 1, y, w - 2, h, ol); P.r(x, y + 1, w, h - 2, ol); P.r(x + 1, y + 1, w - 2, h - 2, bs);
      if (lt) { P.r(x + 2, y + 1, w - 4, 1, lt); P.r(x + 1, y + 2, 1, h - 4, lt); }
      if (dk) { P.r(x + 2, y + h - 2, w - 4, 1, dk); P.r(x + w - 2, y + 2, 1, h - 4, dk); }
    },
    shadow(cx, cy, rx, ry, a = 0.22) { ctx.globalAlpha = a; P.ell(cx, cy, rx, ry, '#1a1020'); ctx.globalAlpha = 1; },
    // draw a string-map sprite: rows of chars, pal maps char->color
    map(x, y, rows, pal, sc = 1) {
      for (let j = 0; j < rows.length; j++) { const row = rows[j]; for (let i = 0; i < row.length; i++) { const ch = row[i]; const c = pal[ch]; if (c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x) + i * sc, Math.round(y) + j * sc, sc, sc); } } }
    },
  };
  return P;
}
