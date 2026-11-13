// Fast deterministic capture of Festive Dance and Cake Sharing animations
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const path = require('path'), fs = require('fs');
const { PAGE_HELPERS } = require('./lib/h.js');
const TFILE = 'file://' + path.join(__dirname, '..', 'dist', 'abibyan-test.html');
const LOOK = path.join(__dirname, '..', 'test', 'look');

const toClient = (p, x, y) => p.evaluate(([x, y]) => {
  const r = document.getElementById('cv').getBoundingClientRect(), k = r.width / 180;
  return [r.left + x * k, r.top + y * k];
}, [x, y]);

const fingerTap = async (p, xy) => {
  if (!xy) return false;
  await p.touchscreen.tap(xy[0], xy[1]);
  return true;
};

(async () => {
  const b = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(TFILE);
  await p.waitForFunction(() => window.__game && __game.DASHA);
  await p.evaluate(PAGE_HELPERS);

  // 1. Open gift box
  await p.evaluate(() => {
    document.querySelector('#nm-ok').click();
  });
  await p.waitForTimeout(400);

  // 2. Advance time until candles are lit and blow-finger button is visible
  await p.evaluate(() => {
    for (let t = 0; t < 30000; t += 50) {
      __adv(50);
      if (__game.DASHA.blowInfo() && document.querySelector('#blow-finger')) break;
    }
  });

  const litCount = await p.evaluate(() => __game.DASHA.cakeLit());
  console.log('Lit candles at start:', litCount);

  // Switch to finger mode
  await p.evaluate(() => {
    const btn = document.querySelector('#blow-finger');
    if (btn) btn.click();
  });
  await p.waitForTimeout(100);

  // 3. Extinguish all candles by tapping on each
  for (let k = 0; k < 6; k++) {
    const L = await p.evaluate(() => __game.DASHA.candles().filter((c) => c.lit));
    if (!L.length) break;
    for (const c of L) {
      const pt = await toClient(p, c.x, c.y);
      await fingerTap(p, pt);
    }
    await p.evaluate(() => __adv(150));
  }

  const left = await p.evaluate(() => __game.DASHA.cakeLit());
  console.log('Lit candles left after tapping:', left);

  // 4. Advance through cheers into the Festive Dance!
  await p.evaluate(() => {
    for (let t = 0; t < 10000; t += 50) {
      __adv(50);
      const pt = __game.FRIENDS.info().party;
      if (pt && (pt.act === 'dance' || pt.lights > 0.2)) break;
    }
  });

  // Advance 1.5 seconds into the dance so party lights and happy hops are active
  await p.evaluate(() => __adv(1500));
  await p.screenshot({ path: path.join(LOOK, 'party_01_dance.png') });
  console.log('Saved party_01_dance.png');

  // 5. Advance through gifts to cake eating phase
  await p.evaluate(() => {
    for (let t = 0; t < 40000; t += 50) {
      __adv(50);
      const pt = __game.FRIENDS.info().party;
      if (pt && pt.bites > 0) break;
    }
  });

  // Advance 500ms into cake eating so friends hold their plates
  await p.evaluate(() => __adv(500));
  await p.screenshot({ path: path.join(LOOK, 'party_02_cake.png') });
  console.log('Saved party_02_cake.png');

  // 6. Test acoustic compass on heart hunt: tap near heart
  await p.evaluate(() => {
    const G = __game;
    const h = G.DASHA.current();
    if (h) {
      G.HOME.goTo(h.room, true);
      __adv(600);
      // Tap close to heart (d = 12 px) to trigger chime & glint
      G.HOME.down(h.x + 10, h.y + 6);
      G.HOME.up(h.x + 10, h.y + 6);
      __adv(150);
    }
  });
  await p.screenshot({ path: path.join(LOOK, 'party_03_heart_hunt.png') });
  console.log('Saved party_03_heart_hunt.png');

  await b.close();
  console.log('All captures done successfully!');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
