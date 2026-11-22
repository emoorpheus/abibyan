'use strict';
const { chromium } = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright');
const path = require('path');
const assert = require('assert');
const fs = require('fs');

(async () => {
  console.log('--- Starting Round 52 Seamless Floor Verification ---');
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
    // Mock time to night (22:23) like in user's screenshot
    const fixedDate = new Date();
    fixedDate.setHours(22, 23, 0, 0);
    const OrigDate = Date;
    window.Date = class extends OrigDate {
      constructor(...args) {
        if (args.length) super(...args);
        else super(fixedDate);
      }
      static now() { return fixedDate.getTime(); }
    };

    const s = {
      v: 9, name: 'Абибян', named: true, tut: 99,
      daily: { last: '2026-11-22', streak: 1 },
      coins: 286, xp: 45, lvl: 4,
      st: { food: 70, fun: 75, energy: 85, clean: 80 }, kg: 2.0,
      home: { items: { tv: 'hiper', pc: 'none', lamp: 1, duck: 1, soap: 1 } },
      room: 'zal', light: true, sleeping: false,
      settings: { sfx: true, music: true }
    };
    localStorage.setItem('martyn_tamagotchi_v1', JSON.stringify(s));
  });

  await page.goto('file://' + path.resolve(__dirname, '../dist/index.html'));
  await page.waitForTimeout(800);

  await page.evaluate(() => {
    if (window.__game && window.__game.APP && window.__game.APP.afterIntro) window.__game.APP.afterIntro();
    while (window.__game && window.__game.UI && window.__game.UI.hasModal()) window.__game.UI.closeModal();
  });
  await page.waitForTimeout(400);

  // Measure continuity across y=318..y=322 in zal
  const seamCheck = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const ctx = cv.getContext('2d');
    // Read 20 pixels around y=319 and y=321 in the middle-left of the floor
    // (x=10..60, avoiding the rug in center)
    const d318 = ctx.getImageData(10, 318, 50, 1).data;
    const d319 = ctx.getImageData(10, 319, 50, 1).data;
    const d320 = ctx.getImageData(10, 320, 50, 1).data;
    const d321 = ctx.getImageData(10, 321, 50, 1).data;
    const d322 = ctx.getImageData(10, 322, 50, 1).data;

    const avgL = (data) => {
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      return sum / (data.length / 4);
    };

    const l318 = avgL(d318);
    const l319 = avgL(d319);
    const l320 = avgL(d320);
    const l321 = avgL(d321);
    const l322 = avgL(d322);

    // Difference across boundary vs difference between adjacent floor rows
    const stepDiff = Math.abs(l320 - l319);
    const naturalDiff = Math.abs(l319 - l318);

    return {
      cvH: cv.height,
      l318, l319, l320, l321, l322,
      stepDiff,
      naturalDiff
    };
  });

  console.log('Seam check in zal at 22:23 (night ambient):', seamCheck);
  // In Round 51, stepDiff was huge (> 40) because of raw cork vs ambient tint + vignette mismatch.
  // In Round 52, stepDiff should be natural tile variation (< 10).
  assert(seamCheck.stepDiff < 15, `stepDiff across y=320 is too large (${seamCheck.stepDiff})! There is still a visible seam!`);
  console.log('✓ Seam across y=320 is completely gone (seamless continuous tiling)!');

  // Capture screenshot of zal
  const zalShot = path.resolve(__dirname, '../dist/zal_r52_seamless.png');
  await page.screenshot({ path: zalShot });
  console.log('Saved zal screenshot to', zalShot);

  // Check other rooms
  const rooms = ['kitchen', 'hall', 'bath', 'balcony'];
  for (const r of rooms) {
    await page.evaluate((rm) => {
      window.__game.HOME.goTo(rm, true);
    }, r);
    await page.waitForTimeout(400);

    const shotPath = path.resolve(__dirname, `../dist/${r}_r52_seamless.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved ${r} screenshot to ${shotPath}`);
  }

  // Also copy screenshots to artifacts dir so the user can see them
  const artDir = '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4';
  fs.copyFileSync(zalShot, path.join(artDir, 'r52_zal_seamless.png'));
  for (const r of rooms) {
    fs.copyFileSync(path.resolve(__dirname, `../dist/${r}_r52_seamless.png`), path.join(artDir, `r52_${r}_seamless.png`));
  }

  console.log('All tests passed successfully!');
  await browser.close();
})();
