'use strict';
const { chromium } = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright');
const path = require('path');
const assert = require('assert');
const fs = require('fs');

(async () => {
  console.log('--- Starting Round 53 Dropped Ceiling & Hearts Verification ---');
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 393, height: 791 },
    screen: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', {
      get: () => true,
      configurable: true
    });
    Object.defineProperty(window, 'screen', {
      value: { width: 393, height: 852, availWidth: 393, availHeight: 852 },
      configurable: true
    });

    const s = {
      v: 9, name: 'Абибян', named: true, tut: 99,
      daily: { last: '2026-11-23', streak: 1 },
      coins: 286, xp: 45, lvl: 4,
      st: { food: 70, fun: 75, energy: 85, clean: 80 }, kg: 2.0,
      home: { items: { tv: 'hiper', pc: 'none', lamp: 1, duck: 1, soap: 1 } },
      room: 'zal', light: true, sleeping: false,
      ach: {},
      settings: { sfx: true, music: true }
    };
    localStorage.setItem('martyn_tamagotchi_v1', JSON.stringify(s));
  });

  await page.goto('file://' + path.resolve(__dirname, '../dist/index.html'));
  await page.waitForTimeout(800);

  // 1. Verify hearts search removal and achievement conditional logic
  const heartsRes = await page.evaluate(() => {
    const g = window.__game;
    const dasha = g.DASHA;
    const data = g.DATA;
    const state = g.GAME.S;

    const heartsOn = dasha.heartsOn();
    const cur = dasha.current();
    const hitRes = dasha.hit('zal', 90, 150);

    // Initial state (no hearts found)
    const achsNoHearts = data.achList ? data.achList(state) : data.ACH;
    const hasDasha24NoHearts = achsNoHearts.some(a => a.id === 'dasha24');

    // Simulate found hearts
    const stateWithHearts = Object.assign({}, state, {
      dasha: { found: { 1: Date.now() } }
    });
    const achsWithHearts = data.achList ? data.achList(stateWithHearts) : data.ACH;
    const hasDasha24WithHearts = achsWithHearts.some(a => a.id === 'dasha24');

    return {
      heartsOn,
      cur,
      hitRes,
      hasDasha24NoHearts,
      hasDasha24WithHearts,
      totalNoHearts: achsNoHearts.length,
      totalWithHearts: achsWithHearts.length
    };
  });

  console.log('Hearts & Achievement checks:', heartsRes);
  assert.strictEqual(heartsRes.heartsOn, false, 'DASHA.heartsOn() must return false');
  assert.strictEqual(heartsRes.cur, null, 'DASHA.current() must return null');
  assert.strictEqual(heartsRes.hitRes, null, 'DASHA.hit() must return null');
  assert.strictEqual(heartsRes.hasDasha24NoHearts, false, 'dasha24 achievement must be hidden when 0 hearts found');
  assert.strictEqual(heartsRes.hasDasha24WithHearts, true, 'dasha24 achievement must be preserved when hearts were found');

  // 2. Verify topY and dropped ceiling
  const geom = await page.evaluate(() => {
    const g = window.__game;
    const home = g.HOME;
    const cv = document.getElementById('cv');
    const ty = home.topY ? home.topY() : 0;
    return {
      canvasH: cv.height,
      topY: ty
    };
  });

  console.log('Geometry:', geom);
  assert.strictEqual(geom.topY, 42, 'HOME.topY() must be 42 on iPhone 17 (canvas height 390)');

  // 3. Verify ceiling extension pixels with light ON (top 20 pixels should be light ceiling plaster)
  const topPixelsLightOn = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const ctx = cv.getContext('2d');
    const d = ctx.getImageData(0, 0, cv.width, 20).data;
    let rSum = 0, gSum = 0, bSum = 0;
    const count = cv.width * 20;
    for (let i = 0; i < count; i++) {
      rSum += d[i * 4];
      gSum += d[i * 4 + 1];
      bSum += d[i * 4 + 2];
    }
    return {
      r: Math.round(rSum / count),
      g: Math.round(gSum / count),
      b: Math.round(bSum / count)
    };
  });
  console.log('Top ceiling average color (light on):', topPixelsLightOn);
  assert(topPixelsLightOn.r > 150 && topPixelsLightOn.g > 150 && topPixelsLightOn.b > 150, 'Top pixels must be light ceiling plaster when light is on');

  // 4. Verify chandelier position and interactivity (toggling light)
  const lightBefore = await page.evaluate(() => window.__game.GAME.S.light);
  // Tap chandelier in zal: screen coordinate x=90, y=85 (in CSS points, with u=2.1833, 85 * 2.1833 = 185px)
  await page.mouse.click(393 / 2, 85 * (393 / 180));
  await page.waitForTimeout(300);
  const lightAfter = await page.evaluate(() => window.__game.GAME.S.light);
  console.log('Zal light toggle tap test:', { before: lightBefore, after: lightAfter });
  assert.strictEqual(lightAfter, !lightBefore, 'Tapping chandelier must toggle zal light');

  // 5. Verify ceiling darkened when light turned off
  const topPixelsLightOff = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const ctx = cv.getContext('2d');
    const d = ctx.getImageData(0, 0, cv.width, 20).data;
    let rSum = 0, gSum = 0, bSum = 0;
    const count = cv.width * 20;
    for (let i = 0; i < count; i++) {
      rSum += d[i * 4];
      gSum += d[i * 4 + 1];
      bSum += d[i * 4 + 2];
    }
    return {
      r: Math.round(rSum / count),
      g: Math.round(gSum / count),
      b: Math.round(bSum / count)
    };
  });
  console.log('Top ceiling average color (light off):', topPixelsLightOff);
  assert(topPixelsLightOff.r < 50 && topPixelsLightOff.g < 50 && topPixelsLightOff.b < 50, 'Top pixels must be darkened by night tint when light is off');

  console.log('--- ALL VERIFICATIONS PASSED ---');
  await browser.close();
})().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
