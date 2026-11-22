'use strict';
const { chromium } = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright');
const path = require('path');
const assert = require('assert');
const fs = require('fs');

(async () => {
  console.log('--- Starting Round 49 iPhone 17 Fullscreen Verification ---');
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  const today = new Date().toISOString().slice(0, 10);
  await page.addInitScript(({ today }) => {
    // 1. Simulate iOS Standalone WebClip (launched from Home Screen shortcut)
    Object.defineProperty(navigator, 'standalone', {
      get: () => true,
      configurable: true
    });

    // 2. Simulate pre-existing save from user device
    const s = {
      v: 9, name: 'Абибян', named: true, tut: 99,
      daily: { last: today, streak: 1 },
      coins: 286, xp: 45, lvl: 4,
      st: { food: 70, fun: 75, energy: 85, clean: 80 }, kg: 2.0,
      home: { items: { tv: 'hiper', pc: 'none', lamp: 1, duck: 1, soap: 1 } },
      room: 'zal', light: true, sleeping: false,
      settings: { sfx: true, music: true }
    };
    localStorage.setItem('martyn_tamagotchi_v1', JSON.stringify(s));
  }, { today });

  await page.goto('file://' + path.resolve(__dirname, '../dist/index.html'));
  await page.waitForTimeout(800);

  await page.evaluate(() => {
    if (window.__game && window.__game.APP && window.__game.APP.afterIntro) window.__game.APP.afterIntro();
    while (window.__game && window.__game.UI && window.__game.UI.hasModal()) window.__game.UI.closeModal();
  });
  await page.waitForTimeout(400);

  // 1. Verify Standalone Detection & Exact Fullscreen Dimensions
  const appMetrics = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const stage = document.getElementById('stage');
    const ext = document.getElementById('ext');
    const hud = document.getElementById('hud');
    const cr = cv.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const hr = hud ? hud.getBoundingClientRect() : { top: 0, bottom: 0 };
    const extStyle = ext ? window.getComputedStyle(ext) : { display: 'none' };
    const cvStyle = window.getComputedStyle(cv);
    return {
      isStandalone: navigator.standalone === true,
      cvTop: cr.top,
      cvLeft: cr.left,
      cvWidth: cr.width,
      cvHeight: cr.height,
      cvObjectFit: cvStyle.objectFit,
      stageTop: sr.top,
      stageHeight: sr.height,
      hudTop: hr.top,
      hudBottom: hr.bottom,
      extDisplay: extStyle.display,
      fillOn: typeof window.__game !== 'undefined' && window.__game.FILL ? window.__game.FILL.on : false,
      hasFillClass: document.documentElement.classList.contains('mode-fill') || document.documentElement.classList.contains('fill'),
      htmlBg: document.documentElement.style.background,
      bodyBg: document.body.style.background
    };
  });

  console.log('iPhone 17 Standalone Metrics:', appMetrics);

  assert.strictEqual(appMetrics.isStandalone, true, 'Must detect standalone mode');
  assert.strictEqual(appMetrics.cvTop, 0, `Expected cv.top == 0, got ${appMetrics.cvTop}`);
  assert.strictEqual(appMetrics.cvLeft, 0, `Expected cv.left == 0, got ${appMetrics.cvLeft}`);
  assert.strictEqual(appMetrics.cvWidth, 393, `Expected cv.width == 393, got ${appMetrics.cvWidth}`);
  assert.strictEqual(appMetrics.cvHeight, 852, `Expected cv.height == 852, got ${appMetrics.cvHeight}`);
  assert.strictEqual(appMetrics.stageTop, 0, `Expected stage.top == 0, got ${appMetrics.stageTop}`);
  assert.strictEqual(appMetrics.stageHeight, 852, `Expected stage.height == 852, got ${appMetrics.stageHeight}`);
  assert.strictEqual(appMetrics.cvObjectFit, 'fill', `Expected object-fit: fill, got ${appMetrics.cvObjectFit}`);
  assert.strictEqual(appMetrics.extDisplay, 'none', `Expected #ext display: none, got ${appMetrics.extDisplay}`);
  assert.strictEqual(appMetrics.fillOn, false, 'FILL.on must be false');
  assert.strictEqual(appMetrics.hasFillClass, false, 'document must not have fill or mode-fill class');

  // 2. Verify settings modal has version badge and Update button
  await page.evaluate(() => window.__game.UI.openSettings());
  await page.waitForTimeout(300);

  const settingsInfo = await page.evaluate(() => {
    const text = document.querySelector('.mbox') ? document.querySelector('.mbox').innerText : '';
    const btns = Array.from(document.querySelectorAll('.mbox button, .mbox .toggle span')).map(b => b.textContent.trim());
    return { text, btns };
  });
  console.log('Settings items found:', settingsInfo.btns);
  assert(settingsInfo.btns.includes('🔄 Обновить приложение'), 'Settings MUST have "🔄 Обновить приложение" button');
  assert(settingsInfo.text.includes('Версия 49') || settingsInfo.text.includes('Версия 50'), 'Settings MUST display Version');
  assert(!settingsInfo.btns.includes('Режим экрана'), 'Settings must NOT have a "Режим экрана" toggle');

  await page.evaluate(() => window.__game.UI.closeModal());
  await page.waitForTimeout(200);

  // 3. Zal: Chandelier toggle
  await page.evaluate(() => window.__game.HOME.goTo('zal', true));
  await page.waitForTimeout(300);
  const zalBefore = await page.evaluate(() => window.__game.GAME.S.light);
  console.log('Zal light before click:', zalBefore);
  // Tap chandelier below HUD (x=196, y=170)
  await page.mouse.click(196, 170);
  await page.waitForTimeout(300);
  const zalAfter = await page.evaluate(() => window.__game.GAME.S.light);
  console.log('Zal light after click:', zalAfter);
  assert.strictEqual(zalAfter, !zalBefore, 'Chandelier must toggle zal light');

  // Save screenshot of zal
  const artDir = '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4';
  const zalShotPath = path.join(artDir, 'r49_iphone17_zal.png');
  await page.screenshot({ path: zalShotPath });

  // 4. Kitchen: Ceiling light toggle
  await page.evaluate(() => window.__game.HOME.goTo('kitchen', true));
  await page.waitForTimeout(300);
  const kBefore = await page.evaluate(() => window.__game.HOME.things().floorLamp !== false);
  console.log('Kitchen light before click:', kBefore);
  await page.mouse.click(218, 145);
  await page.waitForTimeout(300);
  const kAfter = await page.evaluate(() => window.__game.HOME.things().floorLamp !== false);
  console.log('Kitchen light after click:', kAfter);
  assert.strictEqual(kAfter, !kBefore, 'Kitchen ceiling area click must toggle light');

  await page.screenshot({ path: path.join(artDir, 'r49_iphone17_kitchen.png') });

  // 5. Hall: Sconce toggle
  await page.evaluate(() => window.__game.HOME.goTo('hall', true));
  await page.waitForTimeout(300);
  const hBefore = await page.evaluate(() => window.__game.HOME.things().sconces !== false);
  console.log('Hall sconces before click:', hBefore);
  await page.mouse.click(131, 200);
  await page.waitForTimeout(300);
  const hAfter = await page.evaluate(() => window.__game.HOME.things().sconces !== false);
  console.log('Hall sconces after click:', hAfter);
  assert.strictEqual(hAfter, !hBefore, 'Hall sconce click must toggle light');

  await page.screenshot({ path: path.join(artDir, 'r49_iphone17_hall.png') });

  // 6. Bath: screenshot
  await page.evaluate(() => window.__game.HOME.goTo('bath', true));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(artDir, 'r49_iphone17_bath.png') });

  // 7. Balcony: screenshot
  await page.evaluate(() => window.__game.HOME.goTo('balcony', true));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(artDir, 'r49_iphone17_balcony.png') });

  // 8. Floor walk to bottom
  await page.evaluate(() => window.__game.HOME.goTo('zal', true));
  await page.waitForTimeout(300);
  console.log('Tapping on floor near bottom at (196, 800)...');
  await page.mouse.click(196, 800);
  await page.waitForTimeout(1000);
  const mkPos = await page.evaluate(() => ({ x: window.__game.HOME.mk.x, y: window.__game.HOME.mk.y }));
  console.log('Monkey position after tap near bottom:', mkPos);
  assert(mkPos.y >= 290, `Expected monkey y >= 290, got ${mkPos.y}`);

  console.log('--- ALL ROUND 49 IPHONE 17 FULLSCREEN TESTS PASSED! ---');
  await browser.close();
})().catch((err) => {
  console.error('FAILED Round 49 standalone verification:', err);
  process.exit(1);
});
