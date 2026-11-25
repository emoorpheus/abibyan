'use strict';
const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');
const fs = require('fs');

(async () => {
  console.log('--- Starting Round 53 Dropped Ceiling & Hearts Verification ---');
  const ep = '/Users/emoorpheus/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell';
  const browser = await chromium.launch(fs.existsSync(ep) ? { executablePath: ep, headless: true, args: ['--no-sandbox'] } : {});
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

    const d = new Date();
    const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const s = {
      v: 9, name: 'Абибян', named: true, tut: 99,
      daily: { last: today, streak: 1 },
      dasha: { gift: '2026-11-21', gifts: { 2026: '2026-11-21' }, party: { 2026: '2026-11-21' } },
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
  assert(geom.topY >= 26 && geom.topY <= 36, 'HOME.topY() must be compact 26..36 on iPhone (Variant 3), got ' + geom.topY);

  // 3. Verify ceiling extension pixels with light ON (16 rows from geom.topY should be light ceiling plaster)
  const topPixelsLightOn = await page.evaluate((ty) => {
    const cv = document.getElementById('cv');
    const ctx = cv.getContext('2d');
    const d = ctx.getImageData(0, ty, cv.width, 16).data;
    let rSum = 0, gSum = 0, bSum = 0;
    const count = cv.width * 16;
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
  }, geom.topY);
  console.log('Top ceiling average color (light on):', topPixelsLightOn);
  assert(topPixelsLightOn.r > 150 && topPixelsLightOn.g > 150 && topPixelsLightOn.b > 150, 'Top ceiling pixels must be light ceiling plaster when light is on');

  // 4. Verify chandelier position and interactivity (toggling light)
  const lightBefore = await page.evaluate(() => window.__game.GAME.S.light);
  // Tap chandelier in zal right below topY
  await page.mouse.click(393 / 2, (geom.topY + 42) * (393 / 180));
  await page.waitForTimeout(300);
  const lightAfter = await page.evaluate(() => window.__game.GAME.S.light);
  console.log('Zal light toggle tap test:', { before: lightBefore, after: lightAfter });
  assert.strictEqual(lightAfter, !lightBefore, 'Tapping chandelier must toggle zal light');

  // 5. Verify ceiling darkened when light turned off
  const topPixelsLightOff = await page.evaluate((ty) => {
    const cv = document.getElementById('cv');
    const ctx = cv.getContext('2d');
    const d = ctx.getImageData(0, ty, cv.width, 16).data;
    let rSum = 0, gSum = 0, bSum = 0;
    const count = cv.width * 16;
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
  }, geom.topY);
  console.log('Top ceiling average color (light off):', topPixelsLightOff);
  assert(topPixelsLightOff.r < 110 && topPixelsLightOff.g < 110 && topPixelsLightOff.b < 140 && topPixelsLightOff.r < topPixelsLightOn.r - 120, 'Top pixels must be darkened by night tint when light is off');

  console.log('--- ALL VERIFICATIONS PASSED ---');
  await browser.close();
})().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
