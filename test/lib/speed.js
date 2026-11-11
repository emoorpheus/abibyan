// Round 28: the speed checks (r19's first frame, r20's idle home, inv's fps) got their limits on the x86 sandbox, where CPU ×1
// stood for a fast phone and ×4 for a mid one. On a slower machine they measure the machine, not the game: on the Armbian box
// (S905X3, 4× Cortex-A55) the very R21 code that kept every limit there misses all of them (NOTES «Скорость на Armbian»).
// So a profile scales a limit by how much slower the machine ran that same code (tools/perf.js, the best of the rounds), and where
// even unthrottled the machine is slower than «a mid phone» (the sandbox at ×4), the steady checks run at CPU ×1 with limits × k.
// ABI_SPEED=ref keeps the sandbox's limits on any machine (the raw numbers), ABI_SPEED=a55 forces the box's.
// Recalibrate: a worktree at R21 (67a47a4), python3 build.py, node tools/perf.js <tag> there twice, the best numbers here
// (r28's speed section checks them against test/look/r19_perf_*.json).
const os = require('os');
const measured = { // ms to the first frame at CPU ×1 / ×4 (ready1, ready4); % of the main thread busy, idle at home, at ×1 / ×4 (home1, home4)
  ref: { name: 'the x86 sandbox, where the limits were set', ready1: 211, ready4: 501, home1: 7.4, home4: 25.8 }, // test/look/r19_perf_r21.json, 05.11.2026
  a55: { name: 'Armbian S905X3, 4× Cortex-A55', ready1: 949, ready4: 3380, home1: 48.2, home4: 96.7 }, // test/look/r19_perf_armbian_r21_{1,2}.json, 09.11.2026
};
function pick({ env = process.env.ABI_SPEED, arch = os.arch(), cpus = os.cpus() } = {}) {
  if (env) { if (!measured[env]) throw new Error(`ABI_SPEED=${env}: no such speed profile (${Object.keys(measured).join(', ')})`); return env; }
  return arch === 'arm64' && cpus.length === 4 && cpus.every((c) => /Cortex-A55/.test((c && c.model) || '')) ? 'a55' : 'ref';
}
function make(id) {
  const p = measured[id], r = measured.ref; if (!p) throw new Error(`no such speed profile: ${id}`);
  const slow = p.home1 >= r.home4; // even unthrottled it is slower than a mid phone
  const mid = slow ? { rate: 1, k: p.home1 / r.home4 } : { rate: 4, k: p.home4 / r.home4 };
  const start = (cpu) => (cpu === 1 ? p.ready1 / r.ready1 : cpu === 4 ? p.ready4 / r.ready4 : NaN);
  const line = () => `speed profile «${id}» (${p.name}): the first frame's limits ×${start(1).toFixed(2)} at CPU ×1, ×${start(4).toFixed(2)} at ×4; a mid phone = CPU ×${mid.rate}, its busy/fps limits ×${mid.k.toFixed(2)}`;
  return { id, name: p.name, start, mid, line };
}
module.exports = { measured, pick, make, ...make(pick()) };
