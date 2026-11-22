'use strict';
const { chromium } = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright');
const path = require('path');
const assert = require('assert');

(async () => {
  console.log('--- Starting Round 50 iOS WebClip Chin Gap Verification ---');
  const browser = await chromium.launch();
  // We simulate iPhone 17 viewport where WebKit shortened the innerHeight to 791 due to status bar bug,
  // but screen.height remains 852.
  const page = await browser.newPage({
    viewport: { width: 393, height: 791 },
    screen: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  await page.addInitScript(() => {
    // 1. Simulate iOS Standalone WebClip (launched from Home Screen shortcut)
    Object.defineProperty(navigator, 'standalone', {
      get: () => true,
      configurable: true
    });
    // 2. Hardware screen
    Object.defineProperty(window, 'screen', {
      value: { width: 393, height: 852, availWidth: 393, availHeight: 852 },
      configurable: true
    });
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
    const ar = app.getBoundingClientRect();
    const st = document.documentElement.style;
    return {
      vhProp: st.getPropertyValue('--vh'),
      cvHeight: cr.height,
      cvBottom: cr.bottom,
      cvTop: cr.top,
      stageHeight: sr.height,
      appHeight: ar.height,
      windowInnerHeight: window.innerHeight,
      screenHeight: window.screen.height
    };
  });

  console.log('iOS Standalone with 791 viewport metrics:', metrics);

  assert.strictEqual(metrics.screenHeight, 852, 'Screen height must be 852');
  assert.strictEqual(metrics.windowInnerHeight, 791, 'Window innerHeight was shortened to 791 by iOS status bar bug');
  assert.strictEqual(metrics.vhProp, '852px', 'fit() MUST expand --vh to 852px');
  assert.strictEqual(metrics.cvHeight, 852, `cv.height MUST be expanded to 852px, got ${metrics.cvHeight}`);
  assert.strictEqual(metrics.cvBottom, 852, `cv.bottom MUST reach 852px, got ${metrics.cvBottom}`);
  assert.strictEqual(metrics.stageHeight, 852, `stage.height MUST be expanded to 852px, got ${metrics.stageHeight}`);
  assert.strictEqual(metrics.appHeight, 852, `app.height MUST be expanded to 852px, got ${metrics.appHeight}`);

  // Test Settings Modal
  await page.evaluate(() => window.__game.UI.openSettings());
  await page.waitForTimeout(300);

  const modalMetrics = await page.evaluate(() => {
    const m = document.getElementById('modal');
    const mr = m.getBoundingClientRect();
    const text = document.querySelector('.mbox') ? document.querySelector('.mbox').innerText : '';
    return {
      modalHeight: mr.height,
      modalBottom: mr.bottom,
      hasV50: text.includes('Версия 50')
    };
  });

  console.log('Modal metrics in standalone:', modalMetrics);
  assert.strictEqual(modalMetrics.modalHeight, 852, 'Modal MUST cover full 852px screen');
  assert.strictEqual(modalMetrics.hasV50, true, 'Settings modal must display Version 50');

  console.log('--- ALL ROUND 50 CHIN GAP TESTS PASSED! ---');
  await browser.close();
})().catch((err) => {
  console.error('FAILED Round 50 chin gap test:', err);
  process.exit(1);
});
