'use strict';
const { chromium } = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright');
const path = require('path');
const assert = require('assert');

(async () => {
  console.log('--- Starting Round 45 Verification ---');
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
      home: { items: { tv: 'hiper', pc: 'none', lamp: 1, duck: 1 } },
      room: 'zal', light: true, sleeping: false,
      settings: { sfx: true, music: true, screenMode: 'stretch' }
    };
    localStorage.setItem('martyn_tamagotchi_v1', JSON.stringify(s));
  }, { today });

  await page.goto('file://' + path.resolve(__dirname, '../dist/index.html'));
  await page.waitForTimeout(600);

  // Close daily modal if any
  await page.evaluate(() => {
    while (window.__game.UI.hasModal()) window.__game.UI.closeModal();
  });

  // 1. Verify standard layout in mode-stretch
  const lay = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const hud = document.getElementById('hud');
    const cr = cv.getBoundingClientRect();
    const hr = hud.getBoundingClientRect();
    return {
      cvTop: cr.top,
      cvHeight: cr.height,
      hudTop: hr.top,
      hudBottom: hr.bottom
    };
  });
  console.log('Layout measurements (standard):', lay);
  assert(lay.cvTop >= 80, `Expected cv.top >= 80px, got ${lay.cvTop}`);

  // Test 1: Zal chandelier interaction
  await page.evaluate(() => window.__game.HOME.goTo('zal', true));
  await page.waitForTimeout(200);

  const zalChCenter = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const cr = cv.getBoundingClientRect();
    return {
      x: cr.left + (90 / 180) * cr.width,
      y: cr.top + (21 / 320) * cr.height,
      cvTop: cr.top
    };
  });
  console.log('Zal chandelier screen pos:', zalChCenter);
  assert(zalChCenter.y > lay.hudBottom, `Chandelier y (${zalChCenter.y}) must be below HUD bottom (${lay.hudBottom})`);

  const zalLight0 = await page.evaluate(() => window.__game.GAME.S.light);
  assert.strictEqual(zalLight0, true, 'Zal light should be on initially');

  await page.touchscreen.tap(zalChCenter.x, zalChCenter.y);
  await page.waitForTimeout(300);

  const zalLight1 = await page.evaluate(() => window.__game.GAME.S.light);
  assert.strictEqual(zalLight1, false, 'Tapping chandelier should toggle zal light off');

  await page.touchscreen.tap(zalChCenter.x, zalChCenter.y);
  await page.waitForTimeout(300);

  const zalLight2 = await page.evaluate(() => window.__game.GAME.S.light);
  assert.strictEqual(zalLight2, true, 'Tapping chandelier again should toggle zal light on');

  // Test 2: Kitchen lamp interaction (both floor lamp and ceiling spots)
  await page.evaluate(() => window.__game.HOME.goTo('kitchen', true));
  await page.waitForTimeout(200);

  const kCr = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const cr = cv.getBoundingClientRect();
    return {
      left: cr.left, top: cr.top, width: cr.width, height: cr.height
    };
  });

  // Tap floor lamp shade (x=62, y=154)
  const lampX = kCr.left + (62 / 180) * kCr.width;
  const lampY = kCr.top + (154 / 320) * kCr.height;

  const kLamp0 = await page.evaluate(() => window.__game.HOME.things().floorLamp);
  assert.strictEqual(kLamp0, true, 'Kitchen floor lamp should be on initially');

  await page.touchscreen.tap(lampX, lampY);
  await page.waitForTimeout(300);

  const kLamp1 = await page.evaluate(() => window.__game.HOME.things().floorLamp);
  assert.strictEqual(kLamp1, false, 'Tapping kitchen lamp should turn it off');

  // Tap ceiling light in kitchen (x=90, y=9)
  const ceilX = kCr.left + (90 / 180) * kCr.width;
  const ceilY = kCr.top + (9 / 320) * kCr.height;
  await page.touchscreen.tap(ceilX, ceilY);
  await page.waitForTimeout(300);

  const kLamp2 = await page.evaluate(() => window.__game.HOME.things().floorLamp);
  assert.strictEqual(kLamp2, true, 'Tapping kitchen ceiling light should turn it back on');

  // Test 3: Hall plafond interaction
  await page.evaluate(() => window.__game.HOME.goTo('hall', true));
  await page.waitForTimeout(200);

  const hCr = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const cr = cv.getBoundingClientRect();
    return {
      left: cr.left, top: cr.top, width: cr.width, height: cr.height
    };
  });

  const sc0 = await page.evaluate(() => window.__game.HOME.things().sconces);
  // Tap plafond (x=90, y=36)
  const plafX = hCr.left + (90 / 180) * hCr.width;
  const plafY = hCr.top + (36 / 320) * hCr.height;
  await page.touchscreen.tap(plafX, plafY);
  await page.waitForTimeout(300);

  const sc1 = await page.evaluate(() => window.__game.HOME.things().sconces);
  assert.strictEqual(sc1, !sc0, 'Tapping hall plafond should toggle hall sconces/lighting');

  // -------------------------------------------------------------
  // Test 4: iPhone 17 hardware notch simulation (sat = 59px)
  // -------------------------------------------------------------
  console.log('Testing iPhone 17 simulation (safe-area-inset-top = 59px)...');
  const sat = 59;
  const ctPx = sat + 88; // 147px

  await page.addStyleTag({
    content: `
      :root {
        --sat: ${sat}px;
        --ct: ${ctPx}px !important;
      }
      .mode-stretch #hud {
        top: calc(var(--sat) + 6px) !important;
      }
      .mode-stretch #stage {
        background: var(--ceil-bg, #eee6d8) !important;
      }
      .mode-stretch #cv {
        top: var(--ct) !important;
        height: calc(100% - var(--ct)) !important;
      }
      .mode-stretch #view {
        top: var(--ct) !important;
        height: calc(100% - var(--ct)) !important;
      }
    `
  });

  const brainDir = '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4';

  // Zal with iPhone 17 notch
  await page.evaluate(() => window.__game.HOME.goTo('zal', true));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(brainDir, 'r45_iphone17_zal.png') });

  // Kitchen with iPhone 17 notch
  await page.evaluate(() => window.__game.HOME.goTo('kitchen', true));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(brainDir, 'r45_iphone17_kitchen.png') });

  // Hall with iPhone 17 notch
  await page.evaluate(() => window.__game.HOME.goTo('hall', true));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(brainDir, 'r45_iphone17_hall.png') });

  // Bath with iPhone 17 notch
  await page.evaluate(() => window.__game.HOME.goTo('bath', true));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(brainDir, 'r45_iphone17_bath.png') });

  // Balcony with iPhone 17 notch
  await page.evaluate(() => window.__game.HOME.goTo('balcony', true));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(brainDir, 'r45_iphone17_balcony.png') });

  // Test chandelier tap with iPhone 17 layout
  await page.evaluate(() => window.__game.HOME.goTo('zal', true));
  await page.waitForTimeout(200);

  const zalIphoneCr = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const r = cv.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  });

  const zalIphoneTapX = zalIphoneCr.left + (90 / 180) * zalIphoneCr.width;
  const zalIphoneTapY = zalIphoneCr.top + (21 / 320) * zalIphoneCr.height;
  assert(zalIphoneTapY > sat + 84, `Zal chandelier tap y (${zalIphoneTapY}) must be below iPhone HUD bottom (${sat + 84})`);

  await page.touchscreen.tap(zalIphoneTapX, zalIphoneTapY);
  await page.waitForTimeout(300);
  const zalIphoneLight = await page.evaluate(() => window.__game.GAME.S.light);
  assert.strictEqual(zalIphoneLight, false, 'Tapping chandelier on iPhone 17 layout should toggle light off');

  console.log('--- ALL R45 VERIFICATIONS AND SCREENSHOTS COMPLETED SUCCESSFULLY ---');
  await browser.close();
})();
