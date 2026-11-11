'use strict';
// ===== Procedural pixel-art monkey (based on the grey shaggy plush) =====
const MONKEY = (() => {
  const K = { TAIL: 1, LEG: 2, FOOT: 3, BODY: 4, BELLY: 5, ARM: 6, HAND: 7, EAR: 8, HEAD: 9, FACE: 10, NOSE: 11, HOOD: 12, HAT: 13, ACC: 14, TUFT: 15, IT: 20, ITC: 21, ITR: 22 };
  const bit = (...ks) => ks.reduce((a, k) => a | (1 << k), 0);
  const mats = []; const M = {};
  function defMat(name, cols, fur = 0) { if (M[name] !== undefined) return M[name]; M[name] = mats.length; mats.push({ ramp: cols.map(PX.hex), hx: cols, fur, tex: fur }); return M[name]; }
  const cmat = (name, base, fur = 0) => defMat(name, PX.ramp(base), fur);
  defMat('none', Array(6).fill('#ff00ff'));
  defMat('fur', ['#2a2228', '#4f464c', '#6a6166', '#867d80', '#a49a9b', '#c2b8b6'], 1);
  defMat('furL', ['#2a2228', '#5a5157', '#756c70', '#91888a', '#aea4a4', '#cbc1be'], 1);
  defMat('skin', ['#4a362f', '#8a7163', '#a68b7b', '#c1a794', '#d8c1ad', '#ecdccb']);
  defMat('skinD', ['#45332d', '#7b6458', '#957e6e', '#ae9683', '#c6ae9a', '#dac7b5']);
  // cloth
  cmat('red', '#d8453f'); cmat('white', '#e9e6e0'); cmat('green', '#4f9a4a'); cmat('navy', '#2f4a8a'); cmat('teal', '#2aa5a0');
  cmat('black', '#3a3540'); cmat('navy2', '#2d3550'); cmat('denim', '#4d78b5'); cmat('maroon', '#8f3446'); cmat('yellow', '#f0c43a');
  cmat('gold', '#e8b830'); cmat('brownfur', '#7a5236', 1); cmat('sheep', '#d9c7a8', 1); cmat('tan', '#a86f3c'); cmat('pink', '#e98aa8');
  cmat('purple', '#7c5ab8'); cmat('orange', '#ee8a2e'); cmat('grey', '#8a8f98'); cmat('sky', '#5cb6e8');
  // Round 17: the stage gifts
  cmat('babyblue', '#a6cdf2'); cmat('khaki', '#d9c78e'); cmat('leather', '#4b3129'); cmat('blue', '#3e6fd2'); cmat('felt', '#6b5847'); cmat('cape', '#c8283a'); cmat('capeIn', '#7e1a2c'); cmat('silver', '#c8ccd4');

  const LX = -0.446, LY = -0.595, LZ = 0.669, AMB = 0.1, DIF = 0.92;
  let W = 0, H = 0, S = 1, OX = 0, OY = 0, zc = 0, AGEH = 1;
  let gk, gm, gv, gt, gu, gz, gcol, gside, gla, glb, gq, mark;
  const zKind = new Uint8Array(256), zEdge = new Uint8Array(256), zEM = new Uint32Array(256);
  function alloc(w, h) {
    if (w !== W || h !== H) {
      W = w; H = h; const n = w * h;
      gk = new Uint8Array(n); gm = new Uint16Array(n); /* Round 13b: material ids go past 255 in a long session (shop, wardrobe, games) — a Uint8 wrapped them into other colours (the bongo drums) */ gv = new Float32Array(n); gt = new Float32Array(n); gu = new Float32Array(n);
      gz = new Uint8Array(n); gcol = new Uint32Array(n); gside = new Int8Array(n); gla = new Float32Array(n); glb = new Float32Array(n); gq = new Uint8Array(n); mark = new Uint8Array(n);
    } else { gk.fill(0); gz.fill(0); gcol.fill(0); }
  }
  const SHADOW_RECV = new Uint8Array(32), SHADOW_CAST = new Uint8Array(32);
  [K.BODY, K.BELLY, K.FACE, K.LEG, K.HEAD, K.FOOT, K.HOOD, K.ITR].forEach(k => SHADOW_RECV[k] = 1);
  [K.HEAD, K.FACE, K.ARM, K.HAND, K.HAT, K.NOSE, K.ACC, K.TUFT, K.ITC].forEach(k => SHADOW_CAST[k] = 1);

  function spike(th, sp) {
    const n = sp.n; const a = (th + Math.PI) / (2 * Math.PI) * n + (sp.rot || 0);
    const k = Math.floor(a), fr = a - k, kk = ((k % n) + n) % n;
    const amp = sp.a * (0.3 + 0.7 * PX.hash(kk, 7, sp.seed || 1));
    const tri = 1 - Math.abs(fr - 0.5) * 2; let v = amp * tri * tri;
    if (sp.mask) v *= sp.mask(th);
    return v;
  }
  function jitf(along, side, seed) { const a = along / 2.3, k = Math.floor(a), fr = a - k; const tri = 1 - Math.abs(fr - 0.5) * 2; return PX.hash(k, side * 31 + 5, seed) * tri * tri; }
  function newZ(kind, edge, em) { const z = ++zc; zKind[z] = kind; zEdge[z] = edge === undefined ? 1 : edge; zEM[z] = em || 0; return z; }
  function put(i, z, kind, mat, v, t, u, side, la, lb) { gk[i] = kind; gm[i] = mat; gv[i] = v; gz[i] = z; gt[i] = t; gu[i] = u; gside[i] = side; gla[i] = la; glb[i] = lb; }
  const lit = (nx, ny) => { const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)); return AMB + DIF * Math.max(0, nx * LX + ny * LY + nz * LZ); };

  // ellipse part (model coords)
  function ell(mx, my, rx, ry, kind, mat, o = {}) {
    const z = newZ(kind, o.edge, o.em);
    const cx = OX + mx * S, cy = OY + my * S, Rx = Math.max(0.6, rx * S), Ry = Math.max(0.6, ry * S);
    const sp = o.sp, A = sp ? sp.a * S : 0;
    const x0 = Math.max(0, Math.floor(cx - Rx - A - 1)), x1 = Math.min(W - 1, Math.ceil(cx + Rx + A + 1));
    const y0 = Math.max(0, Math.floor(cy - Ry - A - 1)), y1 = Math.min(H - 1, Math.ceil(cy + Ry + A + 1));
    const mn = Math.min(Rx, Ry);
    for (let y = y0; y <= y1; y++) {
      const py = y + 0.5 - cy;
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5 - cx; let nx = px / Rx, ny = py / Ry; const d2 = nx * nx + ny * ny;
        let lim = 1; if (sp) lim = 1 + spike(Math.atan2(ny, nx), sp) * S / mn;
        if (d2 > lim * lim) continue;
        if (o.clip && !o.clip((x + 0.5 - OX) / S, (y + 0.5 - OY) / S)) continue;
        nx /= lim; ny /= lim;
        let v = o.flat !== undefined ? o.flat + ny * -0.12 : lit(nx, ny); if (o.vb) v += o.vb;
        put(y * W + x, z, kind, mat, v, ny * 0.5 + 0.5, nx, o.side || 0, px / S, py / S);
      }
    }
    return z;
  }
  // union of ellipses as one part
  function ellU(list, kind, mat, o = {}) {
    const z = newZ(kind, o.edge, o.em);
    const E = list.map(e => [OX + e[0] * S, OY + e[1] * S, Math.max(0.6, e[2] * S), Math.max(0.6, e[3] * S), e[4] || 0]);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const e of E) { x0 = Math.min(x0, e[0] - e[2]); x1 = Math.max(x1, e[0] + e[2]); y0 = Math.min(y0, e[1] - e[3]); y1 = Math.max(y1, e[1] + e[3]); }
    x0 = Math.max(0, Math.floor(x0) - 1); y0 = Math.max(0, Math.floor(y0) - 1); x1 = Math.min(W - 1, Math.ceil(x1) + 1); y1 = Math.min(H - 1, Math.ceil(y1) + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      let best = 9, bnx = 0, bny = 0, bvb = 0;
      for (const e of E) { const nx = (x + 0.5 - e[0]) / e[2], ny = (y + 0.5 - e[1]) / e[3]; const d = nx * nx + ny * ny; if (d <= 1 && d - e[4] < best) { best = d - e[4]; bnx = nx; bny = ny; bvb = e[4]; } }
      if (best === 9) continue;
      let v = lit(bnx, bny) + (o.vb || 0);
      put(y * W + x, z, kind, mat, v, bny * 0.5 + 0.5, bnx, o.side || 0, (x + 0.5 - OX) / S, (y + 0.5 - OY) / S);
    }
    return z;
  }
  // tube along polyline [[mx,my,r],...]
  function tube(pts, kind, mat, o = {}) {
    const z = newZ(kind, o.edge);
    const P = pts.map(p => [OX + p[0] * S, OY + p[1] * S, Math.max(0.55, p[2] * S)]);
    const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const tot = L[L.length - 1] || 1, J = (o.jit || 0) * S;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of P) { x0 = Math.min(x0, p[0] - p[2] - J); x1 = Math.max(x1, p[0] + p[2] + J); y0 = Math.min(y0, p[1] - p[2] - J); y1 = Math.max(y1, p[1] + p[2] + J); }
    x0 = Math.max(0, Math.floor(x0) - 1); y0 = Math.max(0, Math.floor(y0) - 1); x1 = Math.min(W - 1, Math.ceil(x1) + 1); y1 = Math.min(H - 1, Math.ceil(y1) + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const qx = x + 0.5, qy = y + 0.5; let best = 1e9, bs = 0, bi = 0, bdx = 0, bdy = 0;
      for (let i = 0; i < P.length - 1; i++) {
        const ax = P[i][0], ay = P[i][1], ex = P[i + 1][0] - ax, ey = P[i + 1][1] - ay; const ll = ex * ex + ey * ey || 1e-6;
        let tt = ((qx - ax) * ex + (qy - ay) * ey) / ll; tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
        const dx = qx - (ax + ex * tt), dy = qy - (ay + ey * tt), d = dx * dx + dy * dy;
        if (d < best) { best = d; bs = tt; bi = i; bdx = dx; bdy = dy; }
      }
      const r = P[bi][2] + (P[bi + 1][2] - P[bi][2]) * bs, tpos = (L[bi] + (L[bi + 1] - L[bi]) * bs) / tot;
      const ex = P[bi + 1][0] - P[bi][0], ey = P[bi + 1][1] - P[bi][1], el = Math.hypot(ex, ey) || 1;
      const cross = (ex * bdy - ey * bdx) / el; let rr = r;
      if (J) rr += J * jitf(tpos * tot / S, cross >= 0 ? 1 : 0, o.seed || 3);
      const d = Math.sqrt(best); if (d > rr) continue;
      if (o.clip && !o.clip((qx - OX) / S, (qy - OY) / S)) continue;
      const v = (o.flat !== undefined ? o.flat - cross / rr * 0.1 : lit(bdx / rr, bdy / rr)) + (o.vb || 0);
      put(y * W + x, z, kind, mat, v, tpos, cross / rr, o.side || 0, tpos * tot / S, cross / S);
    }
    return z;
  }
  // axis-aligned box with cylindrical (horizontal) shading
  function box(mx0, my0, mx1, my1, kind, mat, o = {}) {
    const z = newZ(kind, o.edge);
    const x0 = Math.max(0, Math.round(OX + mx0 * S)), x1 = Math.min(W - 1, Math.round(OX + mx1 * S) - 1);
    const y0 = Math.max(0, Math.round(OY + my0 * S)), y1 = Math.min(H - 1, Math.round(OY + my1 * S) - 1);
    const cx = (x0 + x1 + 1) / 2, hw = Math.max(1, (x1 - x0 + 1) / 2);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (o.clip && !o.clip((x + 0.5 - OX) / S, (y + 0.5 - OY) / S)) continue;
      const nx = (x + 0.5 - cx) / hw * 0.85; const v = lit(nx, -0.15) + (o.vb || 0) - ((y - y0) / Math.max(1, y1 - y0)) * (o.vgrad || 0);
      put(y * W + x, z, kind, mat, v, (y - y0) / Math.max(1, y1 - y0), nx, 0, (x - cx) / S, (y - y0) / S);
    }
    return z;
  }
  // rounded "cushion" box: soft normals near edges
  function rbox(x0, y0, x1, y1, r, kind, mat, o = {}) {
    const z = newZ(kind, o.edge, o.em);
    const X0 = OX + x0 * S, X1 = OX + x1 * S, Y0 = OY + y0 * S, Y1 = OY + y1 * S, R = Math.max(0.8, r * S);
    const cx = (X0 + X1) / 2, cy = (Y0 + Y1) / 2, hw = (X1 - X0) / 2, hh = (Y1 - Y0) / 2, bl = o.bulge === undefined ? 0.25 : o.bulge;
    for (let y = Math.max(0, Math.floor(Y0)); y < Math.min(H, Math.ceil(Y1)); y++) for (let x = Math.max(0, Math.floor(X0)); x < Math.min(W, Math.ceil(X1)); x++) {
      const qx = x + 0.5, qy = y + 0.5; const ix = Math.max(X0 + R, Math.min(X1 - R, qx)), iy = Math.max(Y0 + R, Math.min(Y1 - R, qy));
      let dx = (qx - ix) / R, dy = (qy - iy) / R; if (dx * dx + dy * dy > 1) continue;
      if (o.clip && !o.clip((qx - OX) / S, (qy - OY) / S)) continue;
      let nx = dx * 0.9 + (qx - cx) / hw * bl, ny = dy * 0.9 + (qy - cy) / hh * bl; const nn = Math.hypot(nx, ny); if (nn > 0.98) { nx *= 0.98 / nn; ny *= 0.98 / nn; }
      const v = (o.flat !== undefined ? o.flat + ny * -0.15 : lit(nx, ny)) + (o.vb || 0);
      put(y * W + x, z, kind, mat, v, (qy - Y0) / (Y1 - Y0), (qx - cx) / hw, 0, (qx - OX) / S, (qy - OY) / S);
    }
    return z;
  }
  const bez = (a, c, b, n, r0, r1) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1], r0 + (r1 - r0) * t]); } return out; };

  // ---------- passes ----------
  const quant = (v) => v < 0.3 ? 1 : v < 0.5 ? 2 : v < 0.69 ? 3 : v < 0.86 ? 4 : 5;
  let NS = 1, NA = 1;
  function shadePass() {
    NS = S < 0.8 ? Math.min(1, S * 1.3) : 1; NA = S < 0.8 ? 0.75 : 1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, k = gk[i]; if (!k) continue;
      const m = mats[gm[i]]; let v = gv[i];
      if (m.tex === 2) { const n = PX.hash(Math.floor(gla[i] / 7 + PX.hash(0, Math.floor(glb[i] / 1.6), gz[i]) * 5), Math.floor(glb[i] / 1.6), gz[i] + 3); if (n < 0.22) v -= 0.11; else if (n > 0.9) v += 0.07; }
      else if (m.tex === 3) v += PX.bayer(x, y) * 0.13;
      else if (m.tex === 4) { const n = PX.hash(x >> 1, y >> 1, gz[i]); if (n < 0.2) v -= 0.08; else if (n > 0.85) v += 0.06; }
      if (m.tex === 1) {
        const la = gla[i] * NS, lb = glb[i] * NS; let n;
        if (k === K.ARM || k === K.LEG || k === K.TAIL) n = PX.hash(Math.round(lb * 1.25), Math.floor(la / 2.4), gz[i]);
        else n = PX.hash(Math.floor(la + lb * 0.45), Math.floor(lb / 2.3), gz[i] * 7 + 1);
        if (n < 0.17) v -= 0.18 * NA; else if (n > 0.83) v += 0.16 * NA;
      }
      let q = quant(v);
      if (SHADOW_RECV[k]) {
        const z = gz[i];
        if ((x > 0 && y > 0 && gz[i - W - 1] > z && SHADOW_CAST[gk[i - W - 1]] && gk[i - W - 1] !== k) || (x > 0 && y > 1 && gz[i - 2 * W - 1] > z && SHADOW_CAST[gk[i - 2 * W - 1]] && gk[i - 2 * W - 1] !== k)) q = Math.max(1, q - 1);
      }
      gq[i] = q; gcol[i] = m.ramp[q];
    }
  }
  function edgePass() {
    mark.fill(0);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (!gk[i]) continue; const z = gz[i], e = zEdge[z]; if (!e) continue; const em = zEM[z];
      const tst = (j) => gk[j] && gz[j] < z && zKind[gz[j]] !== 0 && (!em || (em & (1 << gk[j])));
      if ((x > 0 && tst(i - 1)) || (x < W - 1 && tst(i + 1)) || (y > 0 && tst(i - W)) || (y < H - 1 && tst(i + W))) mark[i] = e;
    }
    for (let i = 0; i < W * H; i++) if (mark[i]) gcol[i] = mats[gm[i]].ramp[mark[i] === 2 ? 0 : Math.min(gq[i], 1)];
  }
  function outlinePass() {
    mark.fill(0); const oc = new Uint32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (gk[i]) continue; let bz = 0, bm = 0;
      const chk = (j) => { if (gk[j] && gz[j] > bz) { bz = gz[j]; bm = gm[j]; } };
      if (x > 0) chk(i - 1); if (x < W - 1) chk(i + 1); if (y > 0) chk(i - W); if (y < H - 1) chk(i + W);
      if (bz) { mark[i] = 1; oc[i] = mats[bm].ramp[0]; }
    }
    for (let i = 0; i < W * H; i++) if (mark[i]) { gcol[i] = oc[i]; gk[i] = 31; gz[i] = 0; }
  }
  // decal helpers (pixel coords)
  const toPX = (mx) => Math.floor(OX + mx * S), toPY = (my) => Math.floor(OY + my * S);
  function dpx(x, y, col, allow) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; if (allow && !(allow & (1 << gk[i]))) return; gcol[i] = col; }
  const hx = PX.hex;
  const C = { eyeP: hx('#140b0a'), eyeI: hx('#3a2318'), eyeL: hx('#6e4630'), eyeH: hx('#ffffff'), eyeH2: hx('#d6c1b3'), line: hx('#2a1d20'), mouthIn: hx('#3d1a20'), tongue: hx('#c65a6b'), tongueL: hx('#e07f8c'), blush: hx('#e39a96'), blushL: hx('#f0b7ae'), dirt: hx('#5d4838'), dirtD: hx('#47362a'), white: hx('#ffffff'), sweat: hx('#8fd3ff'), sweatD: hx('#4a9fd8'), tear: hx('#7cc6ff') };
  const FACE_OK = bit(K.FACE, K.HEAD, K.NOSE, K.TUFT, 31), FACE_ONLY = bit(K.FACE);

  function drawEye(cx, cy, r, side, e) {
    // cx,cy pixel center (float); e: {mode, look:[lx,ly], lid: [a,b] }
    const mode = e.mode || 'open';
    if (r < 2.3 && (mode === 'open' || mode === 'wide')) {
      const lx = e.look ? Math.round(e.look[0] * 0.7) : 0, ly = e.look ? Math.round(e.look[1] * 0.5) : 0;
      const x0 = Math.round(cx - 1) + lx, y0 = Math.round(cy - 1.5) + ly; const lidOn = e.lid && e.lid[0] > -0.55;
      for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 2; xx++) dpx(x0 + xx, y0 + yy, (yy === 0 && lidOn) ? C.line : (yy === 2 && xx === 1 ? C.eyeI : C.eyeP), FACE_OK);
      if (!lidOn) dpx(x0, y0, C.eyeH, FACE_OK); else dpx(x0, y0 + 1, C.eyeI, FACE_OK);
      return;
    }
    if (mode === 'closed' || mode === 'happy' || mode === 'sleep') {
      const sgn = mode === 'happy' ? -1 : 1; let py = null;
      for (let x = Math.round(cx - r); x <= Math.round(cx + r) - 1; x++) {
        const dx = (x + 0.5 - cx) / r; const y = Math.round(cy + (mode === 'happy' ? 0.5 * r : 0.15 * r) + sgn * (1 - dx * dx) * 0.55 * r - (mode === 'happy' ? 0.5 * r : 0));
        dpx(x, y, C.line, FACE_OK); if (py !== null && Math.abs(py - y) > 1) for (let yy = Math.min(py, y) + 1; yy < Math.max(py, y); yy++) dpx(x, yy, C.line, FACE_OK); py = y;
      }
      return;
    }
    if (mode === 'dizzy') { const R = Math.max(1.5, r * 0.85); for (let t = -R; t <= R; t += 0.5) { dpx(cx + t, cy + t, C.line, FACE_OK); dpx(cx + t, cy - t, C.line, FACE_OK); } return; }
    const rr = mode === 'wide' ? r * 1.12 : r; const lx = (e.look ? e.look[0] : 0) * Math.max(0.6, r * 0.28), ly = (e.look ? e.look[1] : 0) * Math.max(0.5, r * 0.22);
    const pr = rr * (mode === 'wide' ? 0.42 : 0.7);
    for (let y = Math.floor(cy - rr - 1); y <= Math.ceil(cy + rr); y++) for (let x = Math.floor(cx - rr - 1); x <= Math.ceil(cx + rr); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy; const d = Math.hypot(dx, dy); if (d > rr) continue;
      let col = C.eyeI;
      if (Math.hypot(dx - lx * 0.8, dy - ly * 0.8) <= pr) col = C.eyeP;
      else if (d > rr * 0.55 && (dx * 0.6 + dy * 0.8) / d > 0.5) col = C.eyeL;
      if (e.lid) { const sx = dx * side; const lidY = e.lid[0] * rr + e.lid[1] * sx; if (dy < lidY - 1) col = mats[M.skin].ramp[3]; else if (dy < lidY) col = C.line; }
      dpx(x, y, col, FACE_OK);
    }
    // highlights
    const hl = !e.lid || e.lid[0] < -0.55;
    if (hl) {
      const hx0 = Math.round(cx - rr * 0.42 + lx * 0.5 - 0.5), hy0 = Math.round(cy - rr * 0.45 + ly * 0.5 - 0.5);
      dpx(hx0, hy0, C.eyeH, FACE_OK); if (r >= 2.6) { dpx(hx0 + 1, hy0, C.eyeH, FACE_OK); dpx(hx0, hy0 + 1, C.eyeH, FACE_OK); }
      if (r >= 2.6) dpx(Math.round(cx + rr * 0.35), Math.round(cy + rr * 0.3), C.eyeH2, FACE_OK);
    }
  }
  function lineCurve(xa, xb, fy, col, allow) { // pixel x range, fy(x)->y
    let py = null;
    for (let x = Math.round(xa); x <= Math.round(xb); x++) { const y = Math.round(fy(x + 0.5)); dpx(x, y, col, allow); if (py !== null && Math.abs(py - y) > 1) { const st = py < y ? 1 : -1; for (let yy = py + st; yy !== y; yy += st) dpx(x - (st > 0 ? 0 : 0), yy, col, allow); } py = y; }
  }

  // ---------- poses ----------
  const POSES = {
    idle: { l: [-17, -15], r: [17, -15] }, wave: { l: [-17, -15], r: [25, -84] }, up: { l: [-23, -90], r: [23, -90] },
    eat: { l: [-17, -15], r: [6, -57, 1] }, ear: { l: [-17, -15], r: [19, -66, 1] }, scratch: { l: [-17, -15], r: [9, -84, 1] },
    hips: { l: [-19, -33], r: [19, -33] }, belly: { l: [-8, -30, 1], r: [8, -30, 1] }, cover: { l: [-6, -68, 1], r: [6, -68, 1] },
    liftLow: { l: [-18, -42], r: [18, -42] }, liftHigh: { l: [-21, -92], r: [21, -92] },
    drumL: { l: [-13, -27], r: [19, -40] }, drumR: { l: [-19, -40], r: [13, -27] }, drumBoth: { l: [-13, -27], r: [13, -27] },
    balloon: { l: [-17, -15], r: [11, -95] }, catch: { l: [-23, -78], r: [23, -78] }, fall: { l: [-27, -66], r: [27, -66] },
    hold: { l: [-7, -40, 1], r: [7, -40, 1] }, think: { l: [-17, -15], r: [5, -54, 1] }, shrug: { l: [-24, -46], r: [24, -46] },
  };
  const CLOTHES = {
    // slot, material, extras
    tshirt: { slot: 'top', mat: 'red', sl: 0.4, print: 'banana' }, tank: { slot: 'top', mat: 'white', sl: 0, tank: 1 },
    hoodie: { slot: 'top', mat: 'green', sl: 0.86, hood: 1, pocket: 1 }, sailor: { slot: 'top', mat: 'white', sl: 0.62, stripes: 'navy' },
    hawaii: { slot: 'top', mat: 'teal', sl: 0.36, flowers: 1 }, tux: { slot: 'top', mat: 'black', sl: 0.88, tux: 1 },
    sweats: { slot: 'bottom', mat: 'navy2', full: 1, lampas: 1 }, shorts: { slot: 'bottom', mat: 'denim', full: 0 },
    slippers: { slot: 'feet', mat: 'maroon' }, sneakers: { slot: 'feet', mat: 'white', sole: 'red' },
    leather: { slot: 'top', mat: 'leather', sl: 0.88, open: 1 }, keds: { slot: 'feet', mat: 'blue', sole: 'white', toe: 1 }, // Round 17
  };

  // ---------- hair (plush yarn fur) ----------
  // puffy mop of curls (lumps) + a few loose yarn wisps at the silhouette, like the shaggy plush
  const MOPL = [[-112, 0.86, 3.3], [-95, 0.9, 3.8], [-78, 0.9, 4.2], [-61, 0.9, 4.5], [-44, 0.88, 4.7], [-27, 0.86, 4.6], [-10, 0.87, 4.9],
    [7, 0.86, 4.7], [24, 0.88, 4.8], [41, 0.87, 4.5], [58, 0.9, 4.6], [75, 0.9, 4.2], [92, 0.9, 3.8], [109, 0.86, 3.3]];
  const WISP = [[-100, 3.0, 0.9], [-70, 3.8, -1.1], [-48, 3.2, 1.2], [-20, 4.2, -1.0], [-2, 3.4, 1.3], [16, 4.4, -1.2], [33, 3.0, 1.0], [52, 3.9, -1.3], [80, 3.4, 1.1], [104, 2.8, -0.9]];
  function hairMop(hc, hr, hat) {
    const pt = (ad, fr) => { const a = ad * Math.PI / 180; return [hc[0] + Math.sin(a) * hr[0] * fr, hc[1] - Math.cos(a) * hr[1] * fr]; };
    // back row first (crown), then sides
    const order = MOPL.map((m, i) => i).sort((a, b) => Math.abs(MOPL[a][0]) - Math.abs(MOPL[b][0]));
    for (const i of order) {
      const [ad, fr, r0] = MOPL[i]; if (hat && Math.abs(ad) < 72) continue;
      if (AGEH < 1 && Math.abs(ad) > 20 && PX.hash(i, 6, 91) > 0.22 + 0.78 * AGEH) continue; // babies: thin hair, grows into a mop
      const r = r0 * (0.74 + 0.26 * AGEH);
      const jx = (PX.hash(i, 1, 91) - 0.5) * 1.2, jy = (PX.hash(i, 2, 91) - 0.5) * 1.0;
      const [x, y] = pt(ad, fr); ell(x + jx, y + jy, r * (1.04 + 0.1 * PX.hash(i, 3, 91)), r * (0.92 + 0.1 * PX.hash(i, 4, 91)), K.TUFT, M.fur, { edge: 0, sp: { n: 7, a: 0.7, seed: 50 + i } });
    }
    if (S < 0.62 || AGEH < 0.45) return;
    for (let i = 0; i < WISP.length; i++) {
      const [ad, len, bend] = WISP[i]; if (hat && Math.abs(ad) < 72) continue; if (AGEH < 0.9 && i % 3 === 0) continue;
      if (S < 0.8 && (i & 1)) continue;
      const a = ad * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), px = -dy, py = dx;
      const [x0, y0] = pt(ad, 1.12); const r0 = S < 0.8 ? 1.25 : 1.05;
      tube([[x0 - dx * 1.5, y0 - dy * 1.5, r0], [x0 + dx * len * 0.5 + px * bend, y0 + dy * len * 0.5 + py * bend, r0 * 0.8], [x0 + dx * len + px * bend * 0.3, y0 + dy * len + py * bend * 0.3 + 0.6, 0.55]], K.TUFT, M.fur, { edge: 0, seed: 71 + i });
    }
  }
  // fringe: small curls along the hairline over the forehead + two loose strands (kept above the eyes)
  const FRL = [[-9.2, 2.2], [-6.6, 2.6], [-3.8, 2.4], [-1.1, 2.7], [1.6, 2.5], [4.3, 2.6], [7.0, 2.4], [9.4, 2.1]];
  function fringe(bob, f) {
    const top = (x) => -68.3 + bob - 6.6 * Math.sqrt(Math.max(0, 1 - (x / (10.2 + 0.6 * f)) ** 2));
    for (let i = 0; i < FRL.length; i++) {
      const [x, r] = FRL[i]; if (AGEH < 0.3 ? Math.abs(x) > 4.5 : AGEH < 0.6 && (i & 1)) continue; const y = top(x) - 1.4 + (PX.hash(i, 5, 93) - 0.5) * 0.8;
      ell(x, y, r * 1.08, r * 0.92, K.TUFT, M.fur, { edge: 0, vb: -0.04 });
    }
    if (S < 0.8 || AGEH < 0.6) return;
    tube([[-2.2, top(-2.2) - 1.2, 1.05], [-1.2, top(-1.2) + 1.6, 0.8], [-1.9, top(-1.9) + 3.1, 0.5]], K.TUFT, M.fur, { edge: 0, seed: 81 });
    tube([[6.6, top(6.6) - 1.0, 1.0], [7.6, top(7.6) + 1.2, 0.75], [8.6, top(8.6) + 2.2, 0.5]], K.TUFT, M.fur, { edge: 0, seed: 82 });
  }

  // the plush's stitched mouth: two long stitches meeting just right of centre with a small step down,
  // left one dips gently, right one starts lower and rises to the corner (wonky, uneven smile)
  function stitchSmile(mw, ym, f) {
    const L = OX - mw * S, Rr = OX + mw * S, xc = OX + 0.6 * S, step = Math.max(1, Math.round(0.75 * S));
    const yL = (x) => OY + (ym + 0.75 - 2.2 * Math.pow(Math.min(1, (xc - x) / (xc - L)), 1.7)) * S;
    const yR = (x) => OY + (ym + 0.75 - 2.75 * Math.pow(Math.min(1, (x - xc) / (Rr - xc)), 1.45)) * S + step;
    let py = null;
    const put1 = (x, y) => { dpx(x, y, C.line, FACE_ONLY); if (py !== null && Math.abs(py - y) > 1) { const st = py < y ? 1 : -1; for (let yy = py + st; yy !== y; yy += st) dpx(x, yy, C.line, FACE_ONLY); } py = y; };
    const xa = Math.round(L), xb = Math.round(Rr) - 1, xk = Math.floor(xc);
    for (let x = xa; x <= xk; x++) put1(x, Math.round(yL(x + 0.5)));
    py = null; // the right stitch starts a pixel lower and overlaps the left one by a pixel
    for (let x = xk; x <= xb; x++) put1(x, Math.round(yR(x + 0.5)));
    if (S >= 1.6) { py = null; for (let x = xa + 1; x <= xb - 1; x++) dpx(x, Math.round((x <= xk ? yL(x + 0.5) : yR(x + 0.5))) + 1, C.line, FACE_ONLY); }
  }

  // ---------- main compose ----------
  function compose(p) {
    const s = p.s || 1, f = Math.max(0, Math.min(1, p.f || 0));
    // age 0 = newborn baby ... 1 = adult: bigger head & eyes, thinner hair; the head is scaled around the neck
    const age = p.age === undefined ? 1 : Math.max(0, Math.min(1, p.age)), kh = 1 + 0.32 * (1 - age); AGEH = age;
    const w = Math.ceil(124 * s) + 8, h = Math.ceil(140 * s) + 8;
    alloc(w, h); zc = 0; S = s; OX = Math.floor(w / 2); OY = h - Math.ceil(5 * s) - 2;
    const bob = (p.bob || 0) / s;   // pixel bob -> model
    // p.hx: the head shifts sideways (head shake) — in screen pixels, scaled a little with the size so even a tiny baby shows it
    const OY0 = OY, OX0 = OX, HX = Math.round((p.hx || 0) * Math.max(0.6, s)), PIV = -49 + bob; const hOn = () => { S = s * kh; OY = OY0 + PIV * s * (1 - kh); OX = OX0 + HX; }, hOff = () => { S = s; OY = OY0; OX = OX0; };
    const hmy = (my) => PIV + (my - PIV) * kh; // head model y -> body model y
    const cl = p.cloth || {}; const top = CLOTHES[cl.top], bot = CLOTHES[cl.bottom], feet = CLOTHES[cl.feet];
    const pose = POSES[p.pose || 'idle'] || POSES.idle; const armL = p.armL || pose.l, armR = p.armR || pose.r;
    const legs = p.legs || 'stand';
    // geometry
    const hc = [0, -67 + bob], hr = [17 + 2.2 * f, 15 + 0.8 * f];
    const bc = [0, -35 + 2 * f + bob * 0.5], br = [12 + 12.5 * f, 16.5 + 3.2 * f];
    const ec = [0, -28.5 + 3.2 * f + bob * 0.4], er = [5 + 16.5 * f, 6 + 12 * f];
    const shY = -47 + bob, shX = 9.5 + 8 * f;
    const hipX = 5 + 5 * f, ankX = 8 + 6 * f;
    const SM = s * kh < 0.8; const ym = -55.6 + bob - (SM ? 1.3 : 0); // mouth line
    const fatX = 11 * f;
    // p.back: seen from behind (walking off to the fridge / the PC chair / the wardrobe): no face or belly, the arms go behind the body, the tail over it
    const back = !!p.back;
    // tail
    const tp = p.tail || 0; const sw = Math.sin(tp) * 3, sw2 = Math.sin(tp - 0.9) * 4;
    const tail = () => {
      if (p.tail === -1) return; const m = back ? -1 : 1;
      // short shaggy tail with a little hook (the plush's tail is short and thin)
      const pts = [[4, -22, 2.2], [14, -17, 2.1], [22 + fatX, -16.5 + sw * 0.2, 1.9], [26.5 + fatX + sw2 * 0.3, -20 + sw * 0.5, 1.7], [27.5 + fatX + sw2 * 0.6, -25 + sw * 0.7, 1.5], [25.5 + fatX + sw2 * 0.8, -28.5 + sw * 0.8, 1.3]];
      tube(pts.map(([x, y, r]) => [x * m, y, r]), K.TAIL, M.fur, { jit: 1.0, seed: 11 });
    };
    if (!back) tail();
    // legs
    let lankY = -6, lhip = -24, rankY = -6;
    let lAnk = [-ankX, -6], rAnk = [ankX, -6];
    if (legs === 'tuck') { lAnk = [-ankX - 2, -13]; rAnk = [ankX + 2, -13]; }
    else if (legs === 'spread') { lAnk = [-ankX - 5, -7]; rAnk = [ankX + 5, -7]; }
    else if (legs === 'kick') { lAnk = [-ankX - 1, -6]; rAnk = [ankX + 3, -12]; }
    else if (legs === 'walkL') { lAnk = [-ankX + 1, -10]; } // walking: one foot lifted a little under the body
    else if (legs === 'walkR') { rAnk = [ankX - 1, -10]; }
    else if (legs === 'hidden') { lAnk = null; }
    if (lAnk) {
      tube([[-hipX, -24, 5 + 1.3 * f], [lAnk[0], lAnk[1], 4.6 + f]], K.LEG, M.fur, { jit: 1.0, seed: 21, side: -1 });
      tube([[hipX, -24, 5 + 1.3 * f], [rAnk[0], rAnk[1], 4.6 + f]], K.LEG, M.fur, { jit: 1.0, seed: 22, side: 1 });
      ell(lAnk[0] - 1, lAnk[1] + 2.6, 7 + 0.8 * f, 4.3, K.FOOT, M.skinD, { side: -1 });
      ell(rAnk[0] + 1, rAnk[1] + 2.6, 7 + 0.8 * f, 4.3, K.FOOT, M.skinD, { side: 1 });
    }
    const hood = () => { if (top && top.hood) tube([[-13 - 4 * f, -52 + bob, 4.6], [0, -48 + bob, 5], [13 + 4 * f, -52 + bob, 4.6]], K.HOOD, M[top.mat], { edge: 1 }); };
    // arms
    const arm = (hand, side, front) => {
      const sh = [side * shX, shY];
      const mid = [(sh[0] + hand[0]) / 2, (sh[1] + hand[1]) / 2]; const dx = hand[0] - sh[0], dy = hand[1] - sh[1]; const len = Math.hypot(dx, dy) || 1;
      let nx = -dy / len, ny = dx / len; if (nx * side < 0) { nx = -nx; ny = -ny; }
      const bend = Math.min(6, len * 0.16);
      const ctrl = [mid[0] + nx * bend, mid[1] + ny * bend];
      const pts = bez(sh, ctrl, hand, 8, 4.4 + 0.6 * f, 3.7);
      tube(pts, K.ARM, M.fur, { jit: 1.15, seed: 31 + side, side });
      ell(hand[0], hand[1] + (hand[1] > shY ? 1.2 : -1.0), 4.4, 4.9, K.HAND, M.skinD, { side });
      return { sh, ctrl, hand };
    };
    const aL = [armL[0] - (armL[1] > -45 ? fatX : 0), armL[1] + bob], aR = [armR[0] + (armR[1] > -45 ? fatX : 0), armR[1] + bob];
    const armsInfo = {};
    if (back) { armsInfo.l = arm(aL, -1); armsInfo.r = arm(aR, 1); } // from behind both arms are behind the body: only what sticks out shows
    else hood(); // hood (behind head)
    // Round 17: the cape hangs behind him (from the front only its sides show past the body); from behind it covers his back
    const capeCloth = () => { if (cl.neck !== 'cape') return; const w0 = shX + 1.5, w1 = br[0] + 5.5; polyPart([[-w0, -50 + bob], [w0, -50 + bob], [w1, -11], [w1 * 0.5, -9.5], [0, -10.6], [-w1 * 0.5, -9.5], [-w1, -11]], K.ACC, back ? M.cape : M.capeIn); }; // its dark lining shows from the front
    if (!back) capeCloth();
    // body + belly
    ell(bc[0], bc[1], br[0], br[1], K.BODY, M.fur, { sp: { n: 18, a: 1.6, seed: 5, mask: (t) => (t < -2.2 || t > -0.9) ? 1 : 0.15 } });
    if (f > 0.12 && !back) ell(ec[0], ec[1], er[0], er[1], K.BELLY, M.furL, { edge: 1, em: bit(K.LEG, K.FOOT, K.TAIL), vb: 0.05 });
    if (back) { hood(); tail(); capeCloth(); }
    else { if (!armL[2]) armsInfo.l = arm(aL, -1); if (!armR[2]) armsInfo.r = arm(aR, 1); }
    // ears + head (head space)
    hOn();
    ell(-hr[0] - 0.5, hc[1] + 1.5, 5.4, 5.6, K.EAR, M.skin, { side: -1 }); ell(hr[0] + 0.5, hc[1] + 1.5, 5.4, 5.6, K.EAR, M.skin, { side: 1 });
    ell(hc[0], hc[1], hr[0], hr[1], K.HEAD, M.fur, { sp: { n: 24, a: 2.1, seed: 9, rot: 0.5, mask: (t) => (t > 0.5 && t < 2.6) ? 0.25 : 1 } });
    const hatOn = !!(cl.hat && cl.hat !== 'headband' && cl.hat !== 'headphones'); // Round 17: headphones keep his hair
    // shaggy yarn mop like the plush: many loopy strands around the crown + wisps over the ears
    if (!hatOn) hairMop(hc, hr, false); else hairMop(hc, hr, true);
    if (back) { // the back of the head: the yarn mop goes all the way down (thinner on babies)
      const n = AGEH < 0.45 ? 4 : 10;
      for (let i = 0; i < n; i++) { const a = PX.hash(i, 1, 33) * Math.PI * 2, r = Math.sqrt(PX.hash(i, 2, 33)) * 0.66, rr = (3.4 + PX.hash(i, 3, 33)) * (0.74 + 0.26 * AGEH);
        if (hatOn && Math.sin(a) < -0.2) continue; ell(hc[0] + Math.cos(a) * hr[0] * r, hc[1] - 1 + Math.sin(a) * hr[1] * r * 0.9, rr, rr * 0.9, K.TUFT, M.fur, { edge: 0, sp: { n: 7, a: 0.7, seed: 60 + i } }); }
    } else {
      const faceL = [[0, -68.3 + bob, 10.2 + 0.6 * f, 6.6], [0, -59.3 + bob, 14.4 + 2.4 * f, 9.3 + 1.1 * f, 0.15]];
      if (f > 0.45) faceL.push([0, -52.6 + bob + 1.2 * f, 6 + 8 * f, 1.5 + 2.6 * (f - 0.45) / 0.55, 0.05]);
      ellU(faceL, K.FACE, M.skin, { edge: 1 });
      ellU([[0, -65.5 + bob, 1.75, 2.3], [0, -63.3 + bob, 2.65, 2.1]], K.NOSE, M.skin, { edge: 0, vb: 0.12 });
      if (!hatOn) fringe(bob, f);
    }
    if (!hatOn && age < 0.5) { const tt = hc[1] - hr[1]; tube([[0.4, tt + 1.2, 1.5], [1.2, tt - 2.6, 1.2], [3.2, tt - 4.4, 0.95], [4.9, tt - 3.4, 0.7]], K.TUFT, M.fur, { edge: 0, seed: 79 }); } // baby curl
    // hats & neck accessories (parts)
    drawHatParts(cl.hat, hc, hr, p.t || 0);
    hOff();
    if (cl.neck === 'bib' && !back) { // Round 17: a baby bib on the chest (a blue rim, white cloth)
      ell(0, -43.2 + bob, 10.4 + 3 * f, 8.8, K.ACC, M.babyblue, { edge: 1, clip: (mx, my) => my >= -50.5 + bob }); ell(0, -43.6 + bob, 9 + 2.8 * f, 7.4, K.ACC, M.white, { edge: 0, clip: (mx, my) => my >= -49.6 + bob });
    }
    if (cl.neck === 'bib' && back) tube([[-7, -50 + bob, 1.2], [7, -50 + bob, 1.2]], K.ACC, M.babyblue);
    if (cl.neck === 'cape') { // Round 17: the legend's cape — a red collar over the shoulders with a gold clasp (the cloth itself is behind him)
      tube([[-shX - 1.5, -49.5 + bob, 2.4], [0, -50.5 + bob, 2.2], [shX + 1.5, -49.5 + bob, 2.4]], K.ACC, M.cape, { edge: 1 });
      if (!back) ell(0, -49.6 + bob, 2.3, 2.3, K.ACC, M.gold);
    }
    if (cl.neck === 'scarf') {
      const sm = M.red; tube([[-11 - 3.5 * f, -51.5 + bob, 2.9], [0, -49.2 + bob, 3.1], [11 + 3.5 * f, -51.5 + bob, 2.9]], K.ACC, sm, { edge: 1 });
      if (!back) tube([[6, -50 + bob, 2.6], [8, -40 + bob, 2.5]], K.ACC, sm, { edge: 1 });
    }
    if (!back) { if (armL[2]) armsInfo.l = arm(aL, -1); if (armR[2]) armsInfo.r = arm(aR, 1); }

    // ----- clothing recolor (before shading) -----
    const hem = -19.5 - 13.5 * smooth(0.3, 1.0, f), waist = -23 + 1.5 * f;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, k = gk[i]; if (!k) continue; const mx = (x + 0.5 - OX) / S, my = (y + 0.5 - OY) / S;
      if (top && (k === K.BODY || k === K.BELLY || (k === K.ARM && gt[i] < top.sl))) {
        let ok = k === K.ARM || my <= (k === K.BELLY ? hem : hem + 1.5);
        if (top.tank && (k === K.BODY || k === K.BELLY)) { const yy = my - bob, ax = Math.abs(mx), inner = shX - 6.4;
          if (yy < -38) { const t = (yy + 47) / 9; if (ax < inner * Math.sqrt(Math.max(0, 1 - t * t))) ok = false; }
          if (yy < -40 && ax > shX - 2.4 + (yy + 47) * 1.1) ok = false; }
        if (ok) { let mm = M[top.mat]; if (top.stripes && (Math.floor((my - bob) / 2.2) & 1)) mm = M[top.stripes]; if (top.tux && !back && k !== K.ARM && Math.abs(mx) < 1.2 + Math.max(0, (my - (-50 + bob))) * 0.32 && my < -30 + bob) mm = M.white; if (top.open && !back && k !== K.ARM && Math.abs(mx) < 1.8 + Math.max(0, (my - (-50 + bob))) * 0.09) mm = M.white; gm[i] = mm; if (mats[mm].fur === 0) gv[i] = gv[i] * 0.9 + 0.08; }
      }
      if (bot && (k === K.LEG || (k === K.BODY && my >= waist))) {
        const legOk = k === K.LEG ? (bot.full || gt[i] < 0.6) : true;
        if (legOk) { gm[i] = M[bot.mat]; if (bot.lampas && k === K.LEG && gu[i] * gside[i] < -0.45 && gu[i] * gside[i] > -0.85) gm[i] = M.white; }
      }
      if (feet && k === K.FOOT) { gm[i] = (feet.sole && my > -2.2) ? M[feet.sole] : M[feet.mat]; }
    }
    shadePass(); edgePass(); outlinePass();

    // ----- decals -----
    const R = mats[M.skin].ramp, RD = mats[M.skinD].ramp;
    // ear inner
    if (!back) { hOn(); for (const sd of [-1, 1]) { const ex = toPX(sd * (hr[0] + 0.9)) + 0.5, ey = OY + (hc[1] + 1.8) * S; const rr = 3.1 * S; for (let y = Math.floor(ey - rr); y <= Math.ceil(ey + rr); y++) for (let x = Math.floor(ex - rr); x <= Math.ceil(ex + rr); x++) { const d = Math.hypot((x + 0.5 - ex) / rr, (y + 0.5 - ey) / (rr * 1.1)); if (d <= 1) dpx(x, y, d > 0.55 || (x + 0.5 - ex) * sd < 0 ? R[2] : R[1], bit(K.EAR)); } } hOff(); }
    // toe & thumb seams (front only)
    if (!back) {
    if (lAnk && !feet) for (const [a, sd] of [[lAnk, -1], [rAnk, 1]]) { const fx = toPX(a[0] + sd * 1 - sd * 1.4), fy = toPY(a[1] + 2.6); for (let yy = 0; yy < Math.max(2, Math.round(3.4 * S)); yy++) dpx(fx, fy + yy, RD[1], bit(K.FOOT)); }
    if (feet && feet.sole && lAnk) for (const [a] of [[lAnk], [rAnk]]) { const fx = toPX(a[0]), fy = toPY(a[1] + 0.8); dpx(fx - 1, fy, hx('#9aa0aa'), bit(K.FOOT)); dpx(fx + 1, fy, hx('#9aa0aa'), bit(K.FOOT)); dpx(fx, fy + 1, hx('#9aa0aa'), bit(K.FOOT)); }
    for (const sd of [-1, 1]) { const ai = sd < 0 ? armsInfo.l : armsInfo.r; if (!ai) continue; const hh = ai.hand; if (hh[1] > -45) { const x = toPX(hh[0] - sd * 1.2), y = toPY(hh[1] + 1.8); dpx(x, y, RD[1], bit(K.HAND)); dpx(x, y + 1, RD[1], bit(K.HAND)); if (S > 0.8) dpx(x, y + 2, RD[1], bit(K.HAND)); } }
    // nose detail
    hOn(); { const nx = toPX(0), ny = toPY(-63.4 + bob); const nr = Math.max(1, Math.round(2.8 * S)); for (let x = nx - nr + 1; x <= nx + nr - 2; x++) dpx(x, ny + Math.max(1, Math.round(2.2 * S)) + 0, R[2], FACE_ONLY); dpx(nx - Math.max(1, Math.round(1.2 * S)), ny - Math.round(1 * S), R[5], bit(K.NOSE)); } hOff();
    // belly button
    const showBB = f > 0.33 && (!top || ec[1] + er[1] * 0.35 > hem);
    if (showBB) { const bx = toPX(0), by = toPY(ec[1] + er[1] * 0.38); dpx(bx, by, mats[M.furL].ramp[1], bit(K.BELLY)); dpx(bx - 1, by, mats[M.furL].ramp[2], bit(K.BELLY)); dpx(bx, by - 1, mats[M.furL].ramp[2], bit(K.BELLY)); }
    } // front only
    // dirt
    if (p.dirt > 0.05) { const n = Math.ceil(p.dirt * 9); for (let k2 = 0; k2 < n; k2++) { if (k2 % 3 === 0) hOn(); else hOff(); const a = PX.hash(k2, 3, 77), b = PX.hash(k2, 9, 77); let mx, my; if (k2 % 3 === 0) { mx = (a - 0.5) * 26; my = -76 + b * 8; } else { mx = (a - 0.5) * (br[0] * 1.6); my = bc[1] - br[1] * 0.6 + b * br[1] * 1.4; } const cx = OX + mx * S, cy = OY + (my + bob) * S, rr = (1.3 + PX.hash(k2, 5, 7) * 1.4) * S; for (let y = Math.floor(cy - rr); y <= cy + rr; y++) for (let x = Math.floor(cx - rr - 1); x <= cx + rr + 1; x++) { const d = Math.hypot((x + 0.5 - cx) / (rr * 1.3), (y + 0.5 - cy) / rr); if (d <= 1 && PX.hash(x, y, 5) > 0.15) dpx(x, y, d > 0.6 ? C.dirt : C.dirtD, bit(K.BODY, K.BELLY, K.HEAD, K.ARM, K.LEG)); } } }
    hOff();
    // cloth decals (prints, pocket, chain, bow tie are on the front)
    if (!back) {
    if (top) clothDecals(top, bc, br, ec, er, hem, bob, f);
    if (cl.neck === 'chain') { const cy0 = -49.2 + bob; for (let x = Math.round(-8.5 - 2.5 * f); x <= Math.round(8.5 + 2.5 * f); x++) { const yy = cy0 + 0.045 * x * x * (1 - f * 0.3); const px = toPX(x), py = toPY(yy); dpx(px, py, (x & 1) ? hx('#ffe27a') : hx('#c98f12'), 0); if (S > 0.8) dpx(px, py + 1, hx('#8a5c08'), 0); } const pxc = toPX(0), pyc = toPY(cy0 + 3); [[0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, 2], [1, 2], [-1, 2]].forEach(([a, b]) => dpx(pxc + a, pyc + b, (a + b) & 1 ? hx('#ffe27a') : hx('#e8b830'), 0)); }
    if (cl.neck === 'tie') { // Round 17: a school tie — a knot under the chin, a long striped blade down the chest
      const CB = bit(K.BODY, K.BELLY, K.ACC), tx = toPX(0), y0 = toPY(-49 + bob), y1 = toPY(-34.5 + bob + 2 * f), kn = Math.max(2, Math.round(1.8 * S)), red = hx('#d8453f'), rd = hx('#8f2422'), nv = hx('#2f4a8a');
      for (let y = y0; y < y0 + kn + 1; y++) for (let x = tx - kn; x <= tx + kn - 1; x++) dpx(x, y, y === y0 ? red : rd, CB);
      for (let y = y0 + kn + 1; y <= y1; y++) { const k2 = (y - y0) / Math.max(1, y1 - y0), hw2 = Math.max(1, Math.round((1.4 + 1.9 * Math.min(1, k2 * 1.3)) * S * (y > y1 - 2 ? 0.5 : 1)));
        for (let x = tx - hw2; x <= tx + hw2 - 1; x++) dpx(x, y, ((x + y) % 4 === 0) ? nv : (x === tx - hw2 ? rd : red), CB); }
    }
    if (top && top.open) { // Round 17: the jacket's zip edges and the collar
      const CB = bit(K.BODY, K.BELLY), y0 = toPY(-49 + bob), y1 = toPY(hem - 0.5), sv = hx('#c8ccd4'), dk = mats[M.leather].ramp[0];
      for (let y = y0 + 1; y <= y1; y++) { const my2 = (y + 0.5 - OY) / S, hw2 = (1.8 + Math.max(0, my2 - (-50 + bob)) * 0.09) * S; dpx(Math.floor(OX - hw2) - 1, y, (y & 1) ? sv : dk, CB); dpx(Math.ceil(OX + hw2), y, (y & 1) ? sv : dk, CB); }
      for (const sd of [-1, 1]) for (let a = 0; a < Math.round(3 * S); a++) dpx(OX + sd * (Math.round(3.4 * S) + a) - (sd > 0 ? 1 : 0), y0 + a, dk, CB);
    }
    if (feet && feet.toe && lAnk) for (const a of [lAnk, rAnk]) { const fx = toPX(a[0]), fy = toPY(a[1] + 1.6), r2 = Math.max(1, Math.round(1.6 * S)); for (let x = fx - r2; x <= fx + r2; x++) dpx(x, fy, hx('#f4f2ee'), bit(K.FOOT)); dpx(fx, fy - 1, hx('#f4f2ee'), bit(K.FOOT)); } // Round 17: keds' white toe caps
    if (cl.neck === 'bowtie' || (top && top.tux)) { const bx = toPX(0), by = toPY(-48.6 + bob); const col = cl.neck === 'bowtie' ? hx('#d8453f') : hx('#1e1a22'), cd = cl.neck === 'bowtie' ? hx('#8f2422') : hx('#000000'); const sc = Math.max(1, Math.round(S * 1.2)); for (let a = -3 * sc; a <= 3 * sc; a++) { const hh = Math.round(Math.abs(a) * 0.55) + (Math.abs(a) < sc ? 0 : 0); for (let b = -hh; b <= hh; b++) dpx(bx + a, by + b, Math.abs(a) < sc ? cd : (b === -hh || b === hh ? cd : col), 0); } }
    }
    // face: eyes, mouth, blush, stubble (head space)
    hOn();
    if (!back) {
    const ex = 5, eyY = -68.4 + bob, eR = Math.max(1.6, 3.35 * S) * (1 + 0.12 * (1 - age));
    const ee = p.eyes || {}; const mode = ee.mode || 'open';
    let lid = ee.lid || null;
    if (!lid && mode === 'open' && f >= 0.72 && age >= 1 && !ee.noSkuf) lid = [-0.25, 0];
    for (const sd of [-1, 1]) drawEye(OX + sd * ex * S + (sd > 0 ? 0 : 0), OY + eyY * S, eR, sd, { mode, look: ee.look, lid });
    const mw = (11.6 + 1.6 * f) * (SM ? 0.84 : 1), mouth = p.mouth || 'smile', open = p.open || 0;
    const MY = (mx) => OY + (ym + (mouth === 'frown' ? 1.6 - 2.6 * (1 - (mx / mw) ** 2) : -1.3 + 2.5 * (1 - (mx / (mw)) ** 2))) * S;
    if (f >= 0.72 && age >= 1 && !p.noStubble) { for (let y = toPY(ym - 2.5); y <= toPY(ym + 5); y++) for (let x = toPX(-mw - 1); x <= toPX(mw + 1); x++) if (PX.hash(x - OX, y - OY, 3) < 0.2) dpx(x, y, R[2], FACE_ONLY); }
    if (mouth === 'open' || mouth === 'talk' || mouth === 'laugh') {
      const a = mouth === 'laugh' ? 1 : open; const cx = OX, cy = OY + (ym + 1.4 + 1.8 * a) * S, rx = (3.2 + 2.6 * a) * S, ry = (0.9 + 2.9 * a) * S;
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx); x++) { const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry); if (d > 1) continue; let col = C.mouthIn; if ((y + 0.5 - cy) / ry > 0.25) col = (y + 0.5 - cy) / ry > 0.62 || Math.abs(x + 0.5 - cx) > rx * 0.55 ? C.tongue : C.tongueL; dpx(x, y, col, FACE_ONLY); }
    }
    if (mouth === 'o') { const cx = OX, cy = OY + (ym + 1.2) * S, r1 = Math.max(1.2, 2.1 * S); for (let y = Math.floor(cy - r1 - 1); y <= cy + r1; y++) for (let x = Math.floor(cx - r1 - 1); x <= cx + r1; x++) { const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) * 0.9); if (d <= r1) dpx(x, y, d > r1 - 1 ? C.line : C.mouthIn, FACE_ONLY); } }
    else if (mouth === 'flat') lineCurve(OX - 5 * S, OX + 5 * S - 1, () => OY + (ym + 0.6) * S, C.line, FACE_ONLY);
    else if (mouth === 'wavy') lineCurve(OX - 6 * S, OX + 6 * S - 1, (x) => OY + (ym + 0.6 + Math.sin((x - OX) / S * 1.1) * 0.9) * S, C.line, FACE_ONLY);
    else if (mouth === 'chew') lineCurve(OX - 6.5 * S, OX + 6.5 * S - 1, (x) => OY + (ym + 0.4 + 1.2 * (1 - ((x - OX) / S / 6.5) ** 2)) * S, C.line, FACE_ONLY);
    if (mouth === 'smile') stitchSmile(mw, ym, f);
    else if (mouth !== 'o' && mouth !== 'flat' && mouth !== 'wavy' && mouth !== 'chew') {
      const xa = OX - mw * S, xb = OX + mw * S - 1;
      lineCurve(xa, xb, (x) => { const mx = (x - OX) / S; let yy = MY(mx); if (Math.abs(mx) < 0.8 / S && mouth === 'smile') yy -= 1; return yy; }, C.line, FACE_ONLY);
    }
    if (f > 0.5) { const cw = 3.5 + 6 * f; lineCurve(OX - cw * S, OX + cw * S - 1, (x) => OY + (ym + 4.4 + 0.8 * f + 1.3 * (1 - (((x - OX) / S) / cw) ** 2)) * S, R[2], FACE_ONLY); }
    if (p.blush) for (const sd of [-1, 1]) { const bx = toPX(sd * (8.7 + 0.9 * f)), by = toPY(ym - 3.6); for (let a = -1; a <= 1; a++) dpx(bx + a, by, a === 0 ? C.blushL : C.blush, FACE_ONLY); if (S > 0.8) { dpx(bx - 1, by + 1, C.blush, FACE_ONLY); dpx(bx + 1, by + 1, C.blush, FACE_ONLY); dpx(bx, by + 1, C.blush, FACE_ONLY); } }
    if (p.tear) { const tx = toPX(-6.5), ty = toPY(eyY + 3); dpx(tx, ty, C.tear, 0); dpx(tx, ty + 1, C.tear, 0); dpx(tx - 1, ty + 1, C.sweat, 0); }
    if (p.sweat) { const tx = toPX(hr[0] - 2), ty = toPY(hc[1] - 6); dpx(tx, ty, C.white, 0); dpx(tx, ty + 1, C.sweat, 0); dpx(tx - 1, ty + 2, C.sweat, 0); dpx(tx, ty + 2, C.sweat, 0); dpx(tx, ty + 3, C.sweatD, 0); }
    drawGlasses(cl.glasses, eyY, hr, bob);
    }
    drawHatDecals(cl.hat, hc, hr, p.t || 0, back);
    hOff();

    // output
    const cv = PX.canvas(W, H); const id = new ImageData(new Uint8ClampedArray(gcol.buffer.slice(0)), W, H); cv.getContext('2d').putImageData(id, 0, 0);
    return { cv, w: W, h: H, ox: OX, oy: OY, s,
      mouth: { x: 0, y: hmy(ym) * s }, head: { x: 0, y: hmy(hc[1]) * s, rx: hr[0] * kh * s, ry: hr[1] * kh * s }, nose: { x: 0, y: hmy(-63.4 + bob) * s, r: 4.6 * kh * s }, age, body: { x: 0, y: bc[1] * s, rx: br[0] * s, ry: br[1] * s },
      belly: { x: 0, y: ec[1] * s, rx: er[0] * s, ry: er[1] * s }, handR: armsInfo.r ? { x: armsInfo.r.hand[0] * s, y: armsInfo.r.hand[1] * s } : null, handL: armsInfo.l ? { x: armsInfo.l.hand[0] * s, y: armsInfo.l.hand[1] * s } : null };
  }
  function smooth(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  function drawHatParts(hat, hc, hr, t) {
    if (!hat) return; const top = hc[1] - hr[1]; const hw = hr[0];
    if (hat === 'cap') { ell(0, top + 5.5, hw * 0.84, 8.2, K.HAT, M.red, { clip: (mx, my) => my <= top + 6.5 }); ell(-1, top + 6.8, hw * 0.92, 2.6, K.HAT, M.red, { vb: -0.06, clip: (mx, my) => my >= top + 5.2 }); }
    else if (hat === 'ushanka') {
      ell(0, top + 5, hw * 0.98, 9, K.HAT, M.brownfur, { clip: (mx, my) => my <= top + 7, sp: { n: 14, a: 1.0, seed: 3 } });
      tube([[-hw * 0.95, top + 11, 3.4], [hw * 0.95, top + 11, 3.4]], K.HAT, M.sheep, { edge: 1, jit: 0.8 });
      tube([[-hw - 0.5, top + 11, 4.2], [-hw - 1.5, top + 22, 3.8]], K.HAT, M.sheep, { edge: 1, jit: 0.8, seed: 5 });
      tube([[hw + 0.5, top + 11, 4.2], [hw + 1.5, top + 22, 3.8]], K.HAT, M.sheep, { edge: 1, jit: 0.8, seed: 6 });
    }
    else if (hat === 'crown') {
      const z0 = top + 7; const pts = [[-0.62, 0], [-0.62, -10], [-0.4, -4.5], [-0.2, -12], [0, -5.5], [0.2, -12], [0.4, -4.5], [0.62, -10], [0.62, 0]];
      polyPart(pts.map(([a, b]) => [a * hw * 1.05, z0 + b]), K.HAT, M.gold);
    }
    else if (hat === 'cowboy') { box(-hw * 0.62, top - 7, hw * 0.62, top + 4, K.HAT, M.tan, { clip: (mx, my) => !(my < top - 5 && Math.abs(mx) < 2.5) && !(my < top - 6 && Math.abs(mx) > hw * 0.5) }); ell(0, top + 4.6, hw * 1.5, 3.4, K.HAT, M.tan, { vb: 0.05 }); }
    else if (hat === 'propeller') { ell(0, top + 5.5, hw * 0.86, 8.4, K.HAT, M.yellow, { clip: (mx, my) => my <= top + 8 }); }
    else if (hat === 'tophat') { box(-hw * 0.56, top - 13, hw * 0.56, top + 4, K.HAT, M.black); ell(0, top + 4.3, hw * 1.08, 2.7, K.HAT, M.black, { vb: 0.05 }); }
    else if (hat === 'nightcap') {
      ell(0, top + 5.8, hw * 0.9, 8.6, K.HAT, M.navy, { clip: (mx, my) => my <= top + 8 });
      tube([[-3, top - 0.5, 6.2], [6, top - 6.5, 4.6], [14, top - 7.5, 3.4], [20, top - 3, 2.4], [22, top + 2, 1.8]], K.HAT, M.navy);
      tube([[-hw * 0.94, top + 8.2, 2.6], [0, top + 7.2, 2.8], [hw * 0.94, top + 8.2, 2.6]], K.HAT, M.sheep, { edge: 1, jit: 0.7 });
      ell(22.5, top + 4.6, 3.6, 3.6, K.HAT, M.sheep, { sp: { n: 10, a: 0.8, seed: 9 } });
    }
    // Round 17: the stage gifts — a baby bonnet with a frill and ties, a soft panama, headphones, a felt fedora
    else if (hat === 'bonnet') {
      const fl = (mx) => top + 8.6 + Math.pow(Math.min(1, Math.abs(mx) / hw), 2) * 12; // the lower edge: over the forehead, down over the ears at the sides
      ell(0, top + 9, hw * 1.08, 13, K.HAT, M.babyblue, { clip: (mx, my) => my <= fl(mx) });
      tube([-1, -0.7, -0.35, 0, 0.35, 0.7, 1].map((k) => [k * hw * 0.98, fl(k * hw * 0.98) - 0.6, 1.9]), K.HAT, M.white, { edge: 1, jit: 0.6 });
      for (const sd of [-1, 1]) tube([[sd * hw * 0.84, fl(hw * 0.84) + 1, 1], [sd * 2.6, hc[1] + hr[1] + 1.6, 0.9]], K.HAT, M.babyblue);
      ell(-2.2, hc[1] + hr[1] + 2, 2.2, 1.5, K.HAT, M.babyblue); ell(2.2, hc[1] + hr[1] + 2, 2.2, 1.5, K.HAT, M.babyblue);
    }
    else if (hat === 'panama') {
      ell(0, top + 5.5, hw * 0.86, 8.4, K.HAT, M.khaki, { clip: (mx, my) => my <= top + 8 });
      tube([[-hw * 0.86, top + 7.4, 1.4], [0, top + 6.4, 1.5], [hw * 0.86, top + 7.4, 1.4]], K.HAT, M.navy);
      ell(0, top + 9, hw * 1.34, 3, K.HAT, M.khaki, { vb: 0.06, clip: (mx, my) => my >= top + 7.4 });
    }
    else if (hat === 'headphones') {
      tube([[-hw - 1.2, top + 13, 1.5], [-hw * 0.72, top + 2.4, 1.7], [0, top - 1.4, 1.9], [hw * 0.72, top + 2.4, 1.7], [hw + 1.2, top + 13, 1.5]], K.HAT, M.black);
      for (const sd of [-1, 1]) { ell(sd * (hw + 0.8), hc[1] + 1.2, 4.4, 5.6, K.HAT, M.red, { side: sd }); ell(sd * (hw + 2.6), hc[1] + 1.2, 1.6, 3.4, K.HAT, M.black, { side: sd }); }
    }
    else if (hat === 'fedora') {
      box(-hw * 0.64, top - 6, hw * 0.64, top + 4, K.HAT, M.felt, { clip: (mx, my) => !(my < top - 4 && Math.abs(mx) < 2.2) && !(my < top - 5 && Math.abs(mx) > hw * 0.52) });
      box(-hw * 0.64, top + 0.6, hw * 0.64, top + 3.4, K.HAT, M.black);
      ell(0, top + 4.6, hw * 1.32, 2.8, K.HAT, M.felt, { vb: 0.05 });
    }
    else if (hat === 'headband') { tube([[-hw * 0.98, top + 10.5, 2.3], [0, top + 8.6, 2.4], [hw * 0.98, top + 10.5, 2.3]], K.HAT, M.red); tube([[hw * 0.9, top + 10.5, 1.6], [hw + 5, top + 15, 1.4]], K.HAT, M.red); tube([[hw * 0.9, top + 10.8, 1.5], [hw + 3, top + 17, 1.3]], K.HAT, M.red); }
  }
  function polyPart(pts, kind, mat) {
    const z = newZ(kind, 1); const P = pts.map(([a, b]) => [OX + a * S, OY + b * S]);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(H - 1, Math.ceil(y1)); y++) for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(W - 1, Math.ceil(x1)); x++) {
      const qx = x + 0.5, qy = y + 0.5; let inside = false;
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if (((yi > qy) !== (yj > qy)) && qx < (xj - xi) * (qy - yi) / (yj - yi) + xi) inside = !inside; }
      if (!inside) continue; const nx = (qx - (x0 + x1) / 2) / ((x1 - x0) / 2 + 0.01) * 0.8;
      put(y * W + x, z, kind, mat, lit(nx, -0.2) + 0.05, (qy - y0) / (y1 - y0 + 0.01), nx, 0, (qx - OX) / S, (qy - OY) / S);
    }
  }
  function drawHatDecals(hat, hc, hr, t, back) {
    if (!hat) return; const top = hc[1] - hr[1], hw = hr[0]; const HB = bit(K.HAT);
    if (hat === 'cap' && !back) { const bx = toPX(0), by = toPY(top - 2.4); dpx(bx, by, hx('#ffffff'), HB); dpx(bx - 1, by, hx('#ffffff'), HB); 
      // banana logo
      const lx = toPX(-2), ly = toPY(top + 2); [[0, 1], [1, 2], [2, 2], [3, 2], [4, 1], [3, 1]].forEach(([a, b]) => dpx(lx + a, ly + b, hx('#ffe14d'), HB)); }
    if (hat === 'crown') { const y = toPY(top + 4.5); [[-0.4, '#3fb6ff'], [0, '#ff4d6d'], [0.4, '#3fdc7a']].forEach(([a, c]) => { const x = toPX(a * hw); dpx(x, y, hx(c), HB); dpx(x - 1, y, hx(c), HB); dpx(x, y - 1, hx('#ffffff'), HB); }); for (let x = toPX(-0.6 * hw); x <= toPX(0.6 * hw); x++) dpx(x, toPY(top + 6.4), hx('#9c6a0c'), HB); }
    if (hat === 'nightcap') { [[-6, 2], [3, -2], [9, -5], [-1, 5]].forEach(([a, b]) => { const x = toPX(a), y = toPY(top + b); dpx(x, y, hx('#ffe14d'), HB); }); }
    if (hat === 'cowboy') { for (let x = toPX(-hw * 0.6); x <= toPX(hw * 0.6) - 1; x++) { dpx(x, toPY(top + 1.6), hx('#4a2a14'), HB); dpx(x, toPY(top + 2.6), hx('#5c3418'), HB); } }
    if (hat === 'tophat') { for (let x = toPX(-hw * 0.55); x <= toPX(hw * 0.55) - 1; x++) { dpx(x, toPY(top + 0.5), hx('#c23a3a'), HB); dpx(x, toPY(top + 1.6), hx('#8f2424'), HB); } }
    if (hat === 'propeller') {
      // segments
      for (let y = toPY(top - 3); y <= toPY(top + 8); y++) for (let x = toPX(-hw); x <= toPX(hw); x++) { const i = y * W + x; if (x < 0 || y < 0 || x >= W || y >= H || gk[i] !== K.HAT) continue; const mx = (x + 0.5 - OX) / S; const seg = Math.floor((mx + hw) / (hw * 0.5)); const cols = [M.red, M.sky, M.green, M.red]; if (seg & 1) gcol[i] = mats[cols[seg]].ramp[gq[i] || 3]; }
      const sx = toPX(0), sy = toPY(top - 3.2); dpx(sx, sy, hx('#3a3540'), 0); dpx(sx, sy - 1, hx('#3a3540'), 0); dpx(sx - 1, sy - 1, hx('#3a3540'), 0);
      const ph = Math.floor(t * 12) % 4; const span = [6, 3, 1, 3][ph] * Math.max(1, S * 1.1); const by = sy - 2;
      for (let a = -Math.round(span); a <= Math.round(span); a++) { dpx(sx + a, by, a < 0 ? hx('#ff4d6d') : hx('#3fb6ff'), 0); if (S > 0.8 && Math.abs(a) > 1) dpx(sx + a, by - 1, a < 0 ? hx('#b52a45') : hx('#1f7fc1'), 0); }
      dpx(sx, by, hx('#ffe14d'), 0);
    }
  }
  function drawGlasses(g, eyY, hr, bob) {
    if (!g) return; const ok = bit(K.FACE, K.HEAD, K.NOSE, K.TUFT, K.EAR, 31);
    const cy = OY + eyY * S; const ex = 5;
    if (g === 'sun' || g === 'pixel') {
      const lw = (g === 'pixel' ? 4.4 : 4.6) * S, lh = (g === 'pixel' ? 2.4 : 2.8) * S;
      for (const sd of [-1, 1]) { const cx = OX + sd * ex * S; for (let y = Math.floor(cy - lh); y < Math.ceil(cy + lh); y++) for (let x = Math.floor(cx - lw); x < Math.ceil(cx + lw); x++) { const ry = (y + 0.5 - cy) / lh, rx = (x + 0.5 - cx) / lw; if (g === 'sun' && rx * rx * 0.4 + ry * ry > 1.05) continue; let col = hx('#16121a'); if (g === 'sun' && ry < -0.45) col = hx('#3b3446'); if (g === 'pixel' && ((Math.floor(x - cx + 50) + Math.floor(y - cy + 50)) % 2 === 0) && rx < -0.2 && ry < 0.1 && rx > -0.75) col = hx('#ffffff'); dpx(x, y, col, ok); }
        if (g === 'sun') { dpx(Math.round(cx - lw * 0.4), Math.round(cy - lh * 0.15), hx('#ffffff'), ok); dpx(Math.round(cx - lw * 0.4) + 1, Math.round(cy - lh * 0.15) - 1, hx('#ffffff'), ok); } }
      const by = Math.round(cy - lh * (g === 'pixel' ? 1 : 0.5)); for (let x = Math.round(OX - ex * S + lw - 1); x <= Math.round(OX + ex * S - lw); x++) dpx(x, by, hx('#16121a'), ok);
      for (const sd of [-1, 1]) for (let a = 0; a < Math.round(3.5 * S); a++) dpx(Math.round(OX + sd * (ex * S + lw) + sd * a - (sd > 0 ? 1 : 0)), by, hx('#16121a'), ok);
      if (g === 'pixel') for (let x = Math.round(OX - ex * S - lw); x < Math.round(OX + ex * S + lw); x++) dpx(x, Math.round(cy - lh) - 1, hx('#16121a'), ok);
    }
    if (g === 'round') {
      const r = 4.3 * S; for (const sd of [-1, 1]) { const cx = OX + sd * ex * S; for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r); x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d <= r && d > r - 1) dpx(x, y, hx('#b8862a'), ok); } dpx(Math.round(cx - r * 0.5), Math.round(cy - r * 0.55), hx('#ffffff'), ok); }
      const by = Math.round(cy - 1); dpx(OX - 1, by, hx('#b8862a'), ok); dpx(OX, by, hx('#b8862a'), ok);
    }
  }
  function clothDecals(top, bc, br, ec, er, hem, bob, f) {
    const CB = bit(K.BODY, K.BELLY);
    if (top.print === 'banana') { const bx = toPX(-3), by = toPY(-41 + bob); const sc = Math.max(1, Math.round(S)); const pix = [[0, 0], [1, 1], [2, 1], [3, 1], [4, 1], [5, 0], [1, 0], [4, 0], [6, -1]]; pix.forEach(([a, b]) => { for (let u = 0; u < sc; u++) for (let v = 0; v < sc; v++) dpx(bx + a * sc + u, by + b * sc + v, a === 6 ? hx('#6b4a1f') : b === 1 ? hx('#e0a91a') : hx('#ffe14d'), CB); }); }
    if (top.flowers) { for (let k = 0; k < 14; k++) { const mx = (PX.hash(k, 1, 9) - 0.5) * br[0] * 1.8, my = -48 + bob + PX.hash(k, 2, 9) * 28; const x = toPX(mx), y = toPY(my); const c = k & 1 ? hx('#ff8fb1') : hx('#ffe14d'); [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const i = (y + b) * W + x + a; if (x + a >= 0 && x + a < W && y + b >= 0 && y + b < H && gm[i] === M.teal) dpx(x + a, y + b, a === 0 && b === 0 ? hx('#ffffff') : c, CB | bit(K.ARM)); }); } }
    if (top.pocket) { const y0 = toPY(Math.max(hem - 7, -33 + bob)), y1 = toPY(Math.max(hem - 2, -27 + bob)), hw2 = Math.round((5.5 + 4 * f) * S); for (let x = OX - hw2; x <= OX + hw2; x++) { dpx(x, y0, mats[M.green].ramp[1], CB); } for (let y = y0; y <= y1; y++) { dpx(OX - hw2, y, mats[M.green].ramp[1], CB); dpx(OX + hw2, y, mats[M.green].ramp[1], CB); }
      for (const sd of [-1, 1]) for (let a = 0; a < Math.round(5 * S); a++) dpx(OX + sd * Math.round(2.5 * S) - (sd > 0 ? 1 : 0), toPY(-49 + bob) + a, hx('#f2efe6'), CB); }
    if (top.tux) { for (let k = 0; k < 2; k++) dpx(OX, toPY(-42 + bob + k * 4), hx('#1e1a22'), CB); }
    if (top.tank) { /* armholes rim */ }
  }
  // ---------- generic shaded sprite builder (items, icons, furniture) ----------
  const hcache = {}; const hc = (c) => hcache[c] || (hcache[c] = PX.hex(c));
  const API = { ell, ellU, tube, box, rbox, poly: (pts, kind, mat) => polyPart(pts, kind, mat), bez, M, K,
    mat: (name, base, tex = 0) => cmat(name, base, tex), matR: (name, cols, tex = 0) => defMat(name, cols, tex) };
  const DAPI = { px: (x, y, c) => dpx(x, y, hc(c), 0), pxk: (x, y, c, mask) => dpx(x, y, hc(c), mask), on: (x, y) => x >= 0 && y >= 0 && x < W && y < H && gk[(y | 0) * W + (x | 0)] !== 0,
    shade: (x, y, k) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; if (!gk[i] || gk[i] === 31) return; const q = Math.max(0, Math.min(5, gq[i] + k)); gcol[i] = mats[gm[i]].ramp[q]; },
    col: (name, q) => mats[M[name]].hx[q], hline: (x0, x1, y, c, mask) => { for (let x = x0; x <= x1; x++) dpx(x, y, hc(c), mask || 0); } };
  function sprite(w, h, draw, decal, o = {}) {
    alloc(w, h); zc = 0; S = o.s || 1; OX = o.ox || 0; OY = o.oy || 0;
    draw(API); shadePass(); edgePass(); if (!o.noOutline) outlinePass();
    if (decal) decal(DAPI);
    const cv = PX.canvas(W, H); cv.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(gcol.buffer.slice(0)), W, H), 0, 0);
    return cv;
  }
  return { compose, sprite, POSES, CLOTHES, K, M };
})();
