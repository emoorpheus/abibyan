// Round 13b/13c: a fast node copy of «Банановая дуэль» for balance sweeps (designing-mini-games: balance by numbers).
// node tools/duelbal.js '{"JH":34}' [N] [stages] — prints win rate / Пуся's average / jumps for player bots.
// Bots: casual (looks every 0.5 s, runs to the lowest banana), human (every 0.28 s, best reachable, dodges), jumper (human + jumps for contested ones),
// skilled (perfect planner every frame), skilledj (skilled + jumps), mash (random taps), idle.
function mk(seed) { let s = seed % 2147483647 || 1; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const BASE = { AIS: [1.2, 1.22, 1.24, 1.26, 1.28], REP: [0.25, 0.235, 0.22, 0.205, 0.19], DIS: [0.08, 0.07, 0.06, 0.05, 0.04], NZ: [4, 3, 2, 1, 0], washT: 0.9, ZP: [216, 270], hwP: 14, SI: [0.42, 0.72], VY: 1.4, SW: 18, SWW: 2.5, coco: 0.2, JT: 0.5, JH: 0, JCD: 0, JAIR: 1 };
function run(P, policy, seed, sg, maxS = 150) {
  const rng = mk(seed * 13 + 5), Y = 292, ZM = [Y - 76, Y - 34], ZP = P.ZP, R = (a, b) => a + rng() * (b - a);
  const m = { x: 124, vx: 0, stun: 0, jt: 0, cd: 0 }, p = { x: 56, vx: 0, stun: 0, tgt: 56, rep: 0, wash: 0 };
  let items = [], spawnT = 1.1, target = null, me = 0, fr = 0, T = 0, next = 0, tx = null, nj = 0, jumps = 0, rs = seed * 7 + 1; const rnd = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };
  const dt = 1 / 60, sp = 165, JT = P.JT, JH = P.JH, jh = () => m.jt > 0 ? JH * Math.sin(Math.PI * (1 - m.jt / JT)) : 0;
  function spawn() { const r = rng(); const type = r < P.coco ? 'coconut' : r < P.coco + 0.07 ? 'gold' : 'banana'; const x0 = R(20, 160); items.push({ type, x: x0, x0, ph: rng() * 6.28, y: -14, vy: R(95, 128) * P.VY }); }
  function plan(spd) {
    let best = null, bs = -1;
    for (const it of items) { if (it.type === 'coconut') continue; const tc = (ZP[1] - 6 - it.y) / it.vy; if (tc < 0) continue; const need = Math.max(0, Math.abs(it.x - p.x) - 10) / spd; if (need > tc + 0.05) continue;
      const tm = (ZM[1] - 6 - it.y) / it.vy, nm = Math.max(0, Math.abs(it.x - m.x) - 10) / sp; if (nm < tm && (ZM[0] - it.y) / it.vy < Math.max(need, (ZP[0] - it.y) / it.vy) - 0.02 && Math.abs(it.x - m.x) < Math.abs(it.x - p.x)) continue;
      const v = it.type === 'gold' ? 3 : 1; const sc = v / (tc + 0.4 + need); if (sc > bs) { bs = sc; best = it; } }
    let t = best ? best.x + (rng() - 0.5) * P.NZ[sg] : 90 + (rng() - 0.5) * 50;
    for (const it of items) if (it.type === 'coconut') { const tc = (ZP[0] - it.y) / it.vy; if (tc > -0.3 && tc < 0.7 && Math.abs(it.x - t) < 20) t = it.x + (t >= it.x ? 24 : -24); }
    return clamp(t, 14, 166);
  }
  function ai() {
    const spd = 165 * P.AIS[sg];
    if (p.stun > 0) { p.stun -= dt; p.vx = 0; return; } if (p.wash > 0) { p.wash -= dt; p.vx = 0; return; }
    if (rng() < P.DIS[sg] * dt) { p.wash = P.washT; return; }
    p.rep -= dt; if (p.rep <= 0) { p.rep = P.REP[sg]; p.tgt = plan(spd); }
    const d = p.tgt - p.x; p.vx = Math.sign(d) * Math.min(Math.abs(d) * 10, spd); p.x = clamp(p.x + p.vx * dt, 14, 166);
  }
  const wantJump = (reach) => { let go = false; for (const it of items) { if (it.type === 'coconut') continue; if (Math.abs(it.x - m.x) < 12 && it.y > ZM[0] - JH * 0.9 && it.y < ZM[0] - 6 && Math.abs(it.x - p.x) < reach) go = true; } for (const it of items) if (it.type === 'coconut' && Math.abs(it.x - m.x) < 18 && it.y > ZM[0] - JH - 30 && it.y < ZM[0]) go = false; return go; };
  function got(who, it) { const c = who === 'me' ? m : p; if (it.type === 'coconut') { c.stun = 1.0; if (who === 'me') m.jt = 0; return; } const n = it.type === 'gold' ? 3 : 1; if (who === 'me') me += n; else fr += n; }
  while (T < maxS && me < 15 && fr < 15) {
    const hum = policy === 'human' || policy === 'jumper';
    if (m.cd > 0 && m.jt <= 0) m.cd -= dt; if (JH && m.jt <= 0 && m.cd <= 0 && m.stun <= 0) { if (policy === 'jumper' && T >= nj) { nj = T + 0.1; if (rnd() < (P.jc || 0.7) && wantJump(P.jd || 34)) { m.jt = JT; m.cd = P.JCD; jumps++; } } if (policy === 'casualj' && T >= nj) { nj = T + 0.5; if (rnd() < 0.6) { m.jt = JT; m.cd = P.JCD; jumps++; } } if (policy === 'skilledj' && wantJump(40)) { m.jt = JT; m.cd = P.JCD; jumps++; } }
    if (policy === 'skilled' || policy === 'skilledj') { let best = null, bs = -1; for (const it of items) { if (it.type === 'coconut') continue; const tc = (252 - it.y) / it.vy; if (tc < 0) continue; const need = Math.max(0, Math.abs(it.x - m.x) - 10) / sp; if (need > tc) continue; const sc = (it.type === 'gold' ? 3 : 1) / (tc + 0.4 + need); if (sc > bs) { bs = sc; best = it; } } let t = best ? best.x : m.x; for (const it of items) if (it.type === 'coconut') { const tc = (216 - it.y) / it.vy; if (tc > -0.3 && tc < 0.7 && Math.abs(it.x - t) < 26) t = it.x + (t >= it.x ? 28 : -28); } target = clamp(t, 14, 166); }
    const cas = policy === 'casual' || policy === 'casualj';
    if ((hum || cas) && T >= next) { next = T + (hum ? 0.28 : 0.5); let best = null, bs = -1;
      for (const it of items) { if (it.type === 'coconut') continue; const tc = (252 - it.y) / it.vy; if (tc < 0.15) continue; const need = Math.max(0, Math.abs(it.x - m.x) - 10) / sp; if (hum && need > tc) continue; const sc = hum ? (it.type === 'gold' ? 2 : 1) / (tc + 0.6 + need) : it.y; if (sc > bs) { bs = sc; best = it; } }
      tx = best ? best.x + (rnd() - 0.5) * 16 : tx;
      if (hum && tx !== null) for (const it of items) if (it.type === 'coconut') { const tc = (216 - it.y) / it.vy; if (tc > 0 && tc < 0.45 && Math.abs(it.x - tx) < 18) tx = it.x + (tx >= it.x ? 26 : -26); }
      if (tx !== null) target = clamp(tx, 14, 166); }
    if (policy === 'mash' && T >= next) { next = T + 0.25; target = 14 + rnd() * 152; }
    spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = R(P.SI[0], P.SI[1]); }
    if (m.stun > 0) { m.stun -= dt; m.vx = 0; } else if (target !== null) { const d = target - m.x; m.vx = Math.sign(d) * Math.min(Math.abs(d) * 12, sp * (m.jt > 0 ? P.JAIR : 1)); } else m.vx = 0;
    m.x = clamp(m.x + m.vx * dt, 14, 166); if (m.jt > 0) m.jt -= dt;
    ai();
    for (let i = items.length - 1; i >= 0; i--) { const it = items[i]; it.y += it.vy * dt; it.ph += P.SWW * dt; it.x = clamp(it.x0 + Math.sin(it.ph) * P.SW, 10, 170);
      const H = jh(), inM = m.stun <= 0 && it.y > ZM[0] - H && it.y < ZM[1] - H && Math.abs(it.x - m.x) < 14, inP = p.stun <= 0 && it.y > ZP[0] && it.y < ZP[1] && Math.abs(it.x - p.x) < P.hwP;
      if (inM || inP) { const who = inM && inP ? (Math.abs(it.x - m.x) <= Math.abs(it.x - p.x) ? 'me' : 'fr') : inM ? 'me' : 'fr'; items.splice(i, 1); got(who, it); continue; }
      if (it.y > Y + 6) items.splice(i, 1); }
    T += dt;
  }
  return { win: me >= 15 ? true : fr >= 15 ? false : null, me, fr, T: Math.round(T), jumps };
}
module.exports = { run, BASE };
if (require.main === module) {
  const P = Object.assign({}, BASE, JSON.parse(process.argv[2] || '{}')), N = +process.argv[3] || 200, sgs = (process.argv[4] || '0,4').split(',').map(Number);
  for (const sg of sgs) { const o = []; for (const pol of ['casual', 'casualj', 'human', 'jumper', 'skilled', 'skilledj', 'mash']) { let w = 0, f = 0, j = 0; for (let s = 1; s <= N; s++) { const r = run(P, pol, s * 131 + 77, sg); if (r.win) w++; f += r.fr; j += r.jumps; } o.push(pol.slice(0, 3) + (pol.endsWith('j') ? 'J' : '') + sg + ' ' + (w / N).toFixed(2) + '/' + (f / N).toFixed(1) + (j ? '/j' + (j / N).toFixed(0) : '')); } console.log(o.join('  ')); }
}
