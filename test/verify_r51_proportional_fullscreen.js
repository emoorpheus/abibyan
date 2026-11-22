'use strict';
const { chromium } = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright');
const path = require('path');
const assert = require('assert');
const fs = require('fs');

(async () => {
  console.log('--- Starting Round 51 Proportional Fullscreen Verification ---');
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

  const metrics = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const stage = document.getElementById('stage');
    const app = document.getElementById('app');
    const cr = cv.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const scaleX = cr.width / cv.width;
    const scaleY = cr.height / cv.height;
    const distortion = Math.abs(scaleX - scaleY) / scaleX;
    return {
      cvWidth: cv.width,
      cvHeight: cv.height,
      renderedWidth: cr.width,
      renderedHeight: cr.height,
      stageHeight: sr.height,
      scaleX,
      scaleY,
      distortionPercent: (distortion * 100).toFixed(3) + '%'
    };
  });

  console.log('Metrics in Round 51:', metrics);

  assert.strictEqual(metrics.cvWidth, 180, 'Canvas width must be 180');
  assert.strictEqual(metrics.cvHeight, 390, 'Canvas height must be 390 (adapted to 393x852 aspect ratio)');
  assert.strictEqual(metrics.renderedWidth, 393, 'Rendered width must be 393');
  assert.strictEqual(metrics.renderedHeight, 852, 'Rendered height must be 852');
  assert.strictEqual(metrics.stageHeight, 852, 'Stage height must be 852');

  const distortionNum = parseFloat(metrics.distortionPercent);
  assert(distortionNum < 0.2, `Pixel aspect ratio must be proportional (< 0.2% distortion), got ${distortionNum}%`);

  // Take screenshot to inspect pixels at the bottom
  const shotPath = '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r51_zal_proportional.png';
  await page.screenshot({ path: shotPath });

  // Test tap near bottom
  console.log('Testing tap near bottom (196, 750)...');
  await page.mouse.click(196, 750);
  await page.waitForTimeout(1000);
  const mkPos = await page.evaluate(() => ({ x: window.__game.HOME.mk.x, y: window.__game.HOME.mk.y }));
  console.log('Monkey pos after walk to floor:', mkPos);
  assert(mkPos.y > 290, `Monkey must walk onto lower floor area, got y=${mkPos.y}`);

  console.log('--- ALL ROUND 51 PROPORTIONAL FULLSCREEN TESTS PASSED! ---');
  await browser.close();
})().catch((err) => {
  console.error('FAILED Round 51 test:', err);
  process.exit(1);
});
