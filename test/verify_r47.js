'use strict';
const { chromium } = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright');
const path = require('path');
const assert = require('assert');

(async () => {
  console.log('--- Starting Round 47 Fullscreen Verification ---');
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  const today = new Date().toISOString().slice(0, 10);
  await page.addInitScript(({ today }) => {
    const s = {
      v: 9, name: 'Абибян', named: true, tut: 99,
      daily: { last: today, streak: 1 },
      coins: 286, xp: 45, lvl: 4,
      st: { food: 70, fun: 75, energy: 85, clean: 80 }, kg: 2.0,
      home: { items: { tv: 'hiper', pc: 'none', lamp: 1, duck: 1, soap: 1 } },
      room: 'zal', light: true, sleeping: false,
      settings: { sfx: true, music: true, screenMode: 'stretch' }
    };
    localStorage.setItem('martyn_tamagotchi_v1', JSON.stringify(s));
  }, { today });

  await page.goto('file://' + path.resolve(__dirname, '../dist/index.html'));
  await page.waitForTimeout(800);

  // Close daily modal if any
  await page.evaluate(() => {
    while (window.__game && window.__game.UI && window.__game.UI.hasModal()) window.__game.UI.closeModal();
  });

  // 1. Verify true fullscreen stretch layout
  const lay = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const stage = document.getElementById('stage');
    const ext = document.getElementById('ext');
    const hud = document.getElementById('hud');
    const cr = cv.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const hr = hud.getBoundingClientRect();
    const extStyle = window.getComputedStyle(ext);
    return {
      cvTop: cr.top,
      cvLeft: cr.left,
      cvWidth: cr.width,
      cvHeight: cr.height,
      stageTop: sr.top,
      stageHeight: sr.height,
      hudTop: hr.top,
      hudBottom: hr.bottom,
      extDisplay: extStyle.display,
      htmlBg: document.documentElement.style.backgroundColor,
      bodyBg: document.body.style.backgroundColor
    };
  });

  console.log('Layout measurements (Round 47 true stretch):', lay);
  assert.strictEqual(lay.cvTop, 0, `Expected cv.top == 0, got ${lay.cvTop}`);
  assert.strictEqual(lay.cvLeft, 0, `Expected cv.left == 0, got ${lay.cvLeft}`);
  assert.strictEqual(lay.cvWidth, 393, `Expected cv.width == 393, got ${lay.cvWidth}`);
  assert.strictEqual(lay.cvHeight, 852, `Expected cv.height == 852, got ${lay.cvHeight}`);
  assert.strictEqual(lay.extDisplay, 'none', `Expected #ext display == 'none', got ${lay.extDisplay}`);
  assert(!lay.htmlBg || lay.htmlBg === '', `Expected empty html bg, got ${lay.htmlBg}`);

  // 2. Zal room: Chandelier visibility and interaction
  await page.evaluate(() => window.__game.HOME.goTo('zal', true));
  await page.waitForTimeout(300);

  const zalStateBefore = await page.evaluate(() => window.__game.GAME.S.light);
  console.log('Zal light before click:', zalStateBefore);

  // Calculate coordinates of chandelier click below HUD
  // Canvas is 180x320 mapped to 393x852. Chandelier center is at x=78+23=101, y=28+28=56
  // In screen pixels: x = 101/180 * 393 = 220px, y = 56/320 * 852 = 149px
  // HUD bottom is ~137px, so y=155px is safely below HUD and inside chandelier spot (y in [74, 234]px)
  console.log('Clicking Zal chandelier at (220, 155)...');
  await page.mouse.click(220, 155);
  await page.waitForTimeout(300);

  const zalStateAfter = await page.evaluate(() => window.__game.GAME.S.light);
  console.log('Zal light after click:', zalStateAfter);
  assert.strictEqual(zalStateAfter, !zalStateBefore, 'Clicking chandelier should toggle zal light');

  // Click again to restore light
  await page.mouse.click(220, 155);
  await page.waitForTimeout(300);

  // Save screenshot of Zal
  const artDir = '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4';
  await page.screenshot({ path: path.join(artDir, 'r47_fullscreen_zal.png') });

  // 3. Kitchen room: Ceiling light and Floor lamp interaction
  await page.evaluate(() => window.__game.HOME.goTo('kitchen', true));
  await page.waitForTimeout(300);

  const kLightBefore = await page.evaluate(() => window.__game.HOME.things().floorLamp !== false);
  console.log('Kitchen light before click:', kLightBefore);

  // Click ceiling light below HUD: x=100/180*393 = 218px, y=50/320*852 = 133px (or y=145px)
  console.log('Clicking Kitchen ceiling light at (218, 145)...');
  await page.mouse.click(218, 145);
  await page.waitForTimeout(300);

  const kLightAfter = await page.evaluate(() => window.__game.HOME.things().floorLamp !== false);
  console.log('Kitchen light after click:', kLightAfter);
  assert.strictEqual(kLightAfter, !kLightBefore, 'Clicking kitchen ceiling area should toggle kitchen light');

  await page.screenshot({ path: path.join(artDir, 'r47_fullscreen_kitchen.png') });

  // 4. Hall room: Plafond & sconces interaction
  await page.evaluate(() => window.__game.HOME.goTo('hall', true));
  await page.waitForTimeout(300);

  const hallLightBefore = await page.evaluate(() => window.__game.HOME.things().sconces !== false);
  console.log('Hall sconces before click:', hallLightBefore);

  // Plafond center x=90 -> 196px, y=45 -> 120px; sconce at x=60 -> 131px, y=75 -> 200px
  console.log('Clicking Hall sconce at (131, 200)...');
  await page.mouse.click(131, 200);
  await page.waitForTimeout(300);

  const hallLightAfter = await page.evaluate(() => window.__game.HOME.things().sconces !== false);
  console.log('Hall sconces after click:', hallLightAfter);
  assert.strictEqual(hallLightAfter, !hallLightBefore, 'Clicking sconce in hall should toggle sconces');

  await page.screenshot({ path: path.join(artDir, 'r47_fullscreen_hall.png') });

  // 5. Bath room: loofah soap interaction & ducks
  await page.evaluate(() => window.__game.HOME.goTo('bath', true));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(artDir, 'r47_fullscreen_bath.png') });

  // 6. Balcony room: Krot and plant
  await page.evaluate(() => window.__game.HOME.goTo('balcony', true));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(artDir, 'r47_fullscreen_balcony.png') });

  // 7. Verify floor walk on tap at bottom of screen
  await page.evaluate(() => window.__game.HOME.goTo('zal', true));
  await page.waitForTimeout(300);

  console.log('Tapping on floor near bottom at (196, 780)...');
  await page.mouse.click(196, 780);
  await page.waitForTimeout(1000);

  const mkPos = await page.evaluate(() => {
    const mk = window.__game.HOME.mk;
    return { x: mk.x, y: mk.y };
  });
  console.log('Monkey position after tap near bottom:', mkPos);
  assert(mkPos.y >= 290, `Expected monkey y >= 290, got ${mkPos.y}`);

  console.log('--- All Round 47 Fullscreen Verification checks PASSED! ---');
  await browser.close();
})().catch((err) => {
  console.error('FAILED Round 47 verification:', err);
  process.exit(1);
});
