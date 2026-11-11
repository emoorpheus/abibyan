// shared Playwright helpers for the round tests (rebuilt in Round 8 after the R6/R7 tests were lost)
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const fs = require('fs');
const DIST = require('path').join(__dirname, '..', '..', 'dist'); // Round 28: the build next to this checkout (it was /data/game/dist, master's, from any worktree)
let fails = 0, passes = 0;
function ok(a, b, info) { let cond = a, msg = b; if (typeof a === 'string' && typeof b !== 'string') { msg = a; cond = b; } if (cond) { passes++; console.log('PASS ' + msg); } else { fails++; console.log('FAIL ' + msg + (info !== undefined ? '  ← ' + JSON.stringify(info).slice(0, 400) : '')); } }
async function open(opts = {}) {
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', ...(opts.args || [])] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  if (opts.hour !== undefined) await page.clock.setFixedTime(new Date(2026, 10, 4, opts.hour, 0));
  if (opts.date) await page.clock.setFixedTime(opts.date); // Round 22: a given day (her birthday is date-driven)
  if (/abibyan-test/.test(opts.file || '') && !opts.realDate) await page.addInitScript(() => { window.ABI_NODATE = 1; }); // Round 23: the test build lives on 21.11 — not here (test/r23.js test21)
  if (opts.save) await page.addInitScript((s) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('martyn_tamagotchi_v1', s); sessionStorage.setItem('seeded', 1); } }, typeof opts.save === 'string' ? opts.save : JSON.stringify(opts.save));
  await page.goto('file://' + DIST + '/' + (opts.file || 'index.html'), { waitUntil: 'load' }); await page.waitForTimeout(700);
  if (!opts.keepModals) { await page.evaluate(() => { const b = document.querySelector('#nm-ok'); if (b) b.click(); }); await page.waitForTimeout(300); await page.evaluate(() => document.querySelectorAll('[data-close]').forEach(b => b.click())); }
  return { browser, page, errs };
}
// opaque bbox of a canvas-like sprite entry {cv} in page context
const BBOX = `window.__bb = (cv) => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? { w: 0, h: 0 } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; };`;
async function shot(page, file) { const b64 = await page.evaluate(() => document.getElementById('cv').toDataURL('image/png').split(',')[1]); fs.writeFileSync(file, Buffer.from(b64, 'base64')); }
function done(errs, browser) { ok(!errs.length, 'no page errors ' + (errs.length ? JSON.stringify(errs.slice(0, 3)) : '')); console.log(`${passes} passed, ${fails} failed`); if (fails) console.log('ERRORS'); return browser.close().then(() => process.exit(fails ? 1 : 0)); }
const want = (secs) => { const a = process.argv[2]; return (n) => !a || a.split(',').includes(n); };
// Round 24: the site address (the GitHub repo is «abibyan»): docs, the card's QR, the tests
const SITE_URL = 'https://emoorpheus.github.io/abibyan/', OLD_NAMES = ['monkey2d'];
module.exports = { open, ok, BBOX, shot, done, want, fs, SITE_URL, OLD_NAMES };
// page-side helpers shared by the round tests
const PAGE_HELPERS = `
window.__unlock = () => { const s = __game.GAME.S; s.phone = true; s.tut = __game.DATA.TUT.length; if (!['laptop', 'tower'].includes(s.home.items.pc)) s.home.items.pc = 'tower'; if (__game.GAME._ownAll) __game.GAME._ownAll(); };
window.__spy = () => { const A = __game.AUDIO; if (!A._calls) { A._calls = []; const o = A.play; A.play = function (n, ...r) { A._calls.push(n); return o.call(this, n, ...r); }; const os = A.say; A._said = []; A.say = function (t, ...r) { A._said.push(t); return os.call(this, t, ...r); }; } A._calls.length = 0; A._said.length = 0; };
window.__tap = (x, y) => { __game.HOME.down(x, y); __game.HOME.up(x, y); };
window.__T = () => JSON.parse(window.render_game_to_text());
window.__adv = (ms, step = 50) => { for (let t = 0; t < ms; t += step) window.advanceTime(Math.min(step, ms - t)); };
window.__calm = () => { const s = __game.GAME.S; Object.assign(s.st, { food: 90, fun: 90, energy: 90, clean: 90 }); s.want = null; s.friends.visitAt = Date.now() + 9e8; if (__game.ROUTINE) __game.ROUTINE.off = true; }; // Round 14: the old tests don't expect him to wander off by himself (test/r14.js switches it on)
${BBOX}`;
async function boot(opts = {}) { const r = await open(opts); if (!opts.keepModals) await r.page.waitForFunction(() => window.__game && __game.APP.scene === 'home', null, { timeout: 6000 }).catch(() => { }); await r.page.evaluate(PAGE_HELPERS); if (!opts.locked) await r.page.evaluate(() => { window.__unlock(); window.__calm(); }); return r; }
module.exports.boot = boot; module.exports.PAGE_HELPERS = PAGE_HELPERS;
