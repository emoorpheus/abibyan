// Round 13b: a seeded simulation of «Банановая дуэль» with player bots of different skill (designing-mini-games: balance by numbers)
// policies: 'skilled' — perfect planner (instant reaction); 'human' — a good player: looks every 0.28 s, ±8 px aim, dodges coconuts late;
// 'casual' — looks every 0.5 s, runs to the lowest banana, no dodging; 'idle' — stands.
// Round 13c: 'jumper' — the human who also jumps (checks 10×/s, 70 %) when a banana is right above him and Пуся is near it; 'casualj' — casual + random jumps.
module.exports.simCatch = (E) => (policy, seed, stage, maxS = 150) => E(({ policy, seed, stage, maxS }) => {
  const { MINI, GAME } = __game; GAME.S.st.energy = 90; const st0 = GAME.S.grow.stage;
  GAME.S.grow.stage = Math.round(stage * (__game.DATA.AGES.length - 1) / 4); MINI.seed(seed); MINI.start('d_catch', 1); GAME.S.grow.stage = st0;
  const G = MINI.G; let T = 0, next = 0, nj = 0, jumps = 0, rs = seed * 7 + 1, tx = null; const hum = policy === 'human' || policy === 'jumper', cas = policy === 'casual' || policy === 'casualj';
  const jump = () => { MINI.key('ArrowUp', true); MINI.key('ArrowUp', false); jumps++; }; const rnd = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };
  while (T < maxS && !MINI.st.over) {
    const m = G.m, sp = 165 * (1 - 0.3 * GAME.fat());
    if (policy === 'skilled') { let best = null, bs = -1; for (const it of G.items) { if (it.type === 'coconut') continue; const tc = (252 - it.y) / it.vy; if (tc < 0) continue; const need = Math.max(0, Math.abs(it.x - m.x) - 10) / sp; if (need > tc) continue; const sc = (it.type === 'gold' ? 3 : 1) / (tc + 0.4 + need); if (sc > bs) { bs = sc; best = it; } } let t = best ? best.x : m.x; for (const it of G.items) if (it.type === 'coconut') { const tc = (216 - it.y) / it.vy; if (tc > -0.3 && tc < 0.7 && Math.abs(it.x - t) < 26) t = it.x + (t >= it.x ? 28 : -28); } MINI.down(Math.max(14, Math.min(166, t)), 280); }
    if (T >= nj && (policy === 'jumper' || policy === 'casualj') && G.m.stun <= 0 && !(G.m.jt > 0) && !(G.m.cd > 0)) {
      nj = T + (policy === 'jumper' ? 0.1 : 0.5);
      if (policy === 'casualj') { if (rnd() < 0.6) jump(); }
      else if (rnd() < 0.7) { let go = false; for (const it of G.items) if (it.type !== 'coconut' && Math.abs(it.x - m.x) < 12 && it.y > 196 && it.y < 210 && Math.abs(it.x - G.p.x) < 34) go = true; for (const it of G.items) if (it.type === 'coconut' && Math.abs(it.x - m.x) < 18 && it.y > 164 && it.y < 216) go = false; if (go) jump(); }
    }
    if ((hum || cas) && T >= next) {
      next = T + (hum ? 0.28 : 0.5); let best = null, bs = -1;
      for (const it of G.items) { if (it.type === 'coconut') continue; const tc = (252 - it.y) / it.vy; if (tc < 0.15) continue; const need = Math.max(0, Math.abs(it.x - m.x) - 10) / sp; if (hum && need > tc) continue; const sc = hum ? (it.type === 'gold' ? 2 : 1) / (tc + 0.6 + need) : it.y; if (sc > bs) { bs = sc; best = it; } }
      tx = best ? best.x + (rnd() - 0.5) * 16 : tx;
      if (hum && tx !== null) for (const it of G.items) if (it.type === 'coconut') { const tc = (216 - it.y) / it.vy; if (tc > 0 && tc < 0.45 && Math.abs(it.x - tx) < 18) tx = it.x + (tx >= it.x ? 26 : -26); }
      if (tx !== null) MINI.down(Math.max(14, Math.min(166, tx)), 280);
    }
    window.advanceTime(1000 / 60); T += 1 / 60;
  }
  const d = Object.assign({}, MINI.st.duel); const r = { win: d.win, me: d.me, fr: d.fr, T: Math.round(T), jumps };
  if (document.querySelector('#r-home')) document.querySelector('#r-home').click(); else MINI.home();
  return r;
}, { policy, seed, stage, maxS });
