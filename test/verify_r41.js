let chromium;
try {
  chromium = require('playwright').chromium;
} catch (e) {
  chromium = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright').chromium;
}
const path = require('path'), fs = require('fs');
const assert = require('assert');

(async () => {
  const chromePath = fs.existsSync('/usr/local/bin/chromium') ? '/usr/local/bin/chromium' : '/Users/emoorpheus/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
    headless: true
  });

  console.log('Testing Round 41: Fullscreen Stretch & Proportional Fill on iPhone 17...');

  // Context simulating iPhone 17 (393 x 852, DPR 3, mobile touch)
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('Browser error:', msg.text());
  });

  // Inject standalone mode and simulated safe area insets
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { value: true });
  });

  const url = 'file://' + path.resolve(__dirname, '../dist/index.html');
  await page.goto(url);
  await page.waitForTimeout(600);

  // 1. Verify Mode 1 (Stretch) defaults on mobile standalone
  const m1 = await page.evaluate(() => {
    const s = document.getElementById('stage').getBoundingClientRect();
    const c = document.getElementById('cv').getBoundingClientRect();
    const h = document.getElementById('hud').getBoundingClientRect();
    const b = document.getElementById('bar').getBoundingClientRect();
    return {
      mode: window.__game.APP.screenMode,
      classes: document.documentElement.className,
      stage: { w: Math.round(s.width), h: Math.round(s.height), top: Math.round(s.top) },
      cv: { w: Math.round(c.width), h: Math.round(c.height), top: Math.round(c.top) },
      hud: { top: Math.round(h.top), height: Math.round(h.height) },
      bar: { bottom: Math.round(b.bottom) }
    };
  });
  console.log('Mode 1 (Stretch):', m1);
  assert.strictEqual(m1.mode, 'stretch', 'Default screen mode must be stretch');
  assert.ok(m1.classes.includes('mode-stretch'), 'HTML must have mode-stretch class');
  assert.strictEqual(m1.stage.w, 393, 'Stage width must fill 393px');
  assert.strictEqual(m1.stage.h, 852, 'Stage height must fill 852px');
  assert.strictEqual(m1.cv.w, 393, 'Canvas width must fill 393px');
  assert(m1.cv.h >= 700, 'Canvas height must cover screen below HUD');
  assert(m1.cv.top >= 80, 'Canvas top must start below HUD');

  // Verify toLogical mapping in stretch mode
  const logicalCoord = await page.evaluate(({ topY, hY }) => {
    return window.__game.APP.toLogical(196.5, topY + hY / 2);
  }, { topY: m1.cv.top, hY: m1.cv.h });
  assert.strictEqual(Math.round(logicalCoord.x), 90, 'Center touch X must map to 90 logical px');
  assert.strictEqual(Math.round(logicalCoord.y), 160, 'Center touch Y must map to 160 logical px');

  await page.screenshot({ path: path.resolve(__dirname, '../dist/r41_iphone17_mode_stretch.png') });

  // 2. Open Settings and test toggle
  await page.evaluate(() => {
    window.__game.UI.openSettings();
  });
  await page.waitForTimeout(400);

  const btnTextStretch = await page.evaluate(() => {
    const b = document.getElementById('t-screen');
    return b ? b.textContent.trim() : null;
  });
  console.log('Settings button in stretch mode:', btnTextStretch);
  assert.strictEqual(btnTextStretch, 'Во весь экран', 'Button text must say Во весь экран');

  await page.screenshot({ path: path.resolve(__dirname, '../dist/r41_settings_toggle.png') });

  // 3. Click toggle to switch to Fill mode
  await page.evaluate(() => {
    document.getElementById('t-screen').click();
  });
  await page.waitForTimeout(400);

  const btnTextFill = await page.evaluate(() => {
    const b = document.getElementById('t-screen');
    return b ? b.textContent.trim() : null;
  });
  console.log('Settings button in fill mode:', btnTextFill);
  assert.strictEqual(btnTextFill, 'С полями', 'Button text must say С полями');

  // Close Settings modal
  await page.evaluate(() => {
    window.__game.UI.closeModal();
  });
  await page.waitForTimeout(400);

  // 4. Verify Mode 2 (Fill)
  const m2 = await page.evaluate(() => {
    const s = document.getElementById('stage').getBoundingClientRect();
    const c = document.getElementById('cv').getBoundingClientRect();
    const ext = document.getElementById('ext').getBoundingClientRect();
    return {
      mode: window.__game.APP.screenMode,
      classes: document.documentElement.className,
      stage: { w: Math.round(s.width), h: Math.round(s.height) },
      cv: { w: Math.round(c.width), h: Math.round(c.height) },
      ext: { w: Math.round(ext.width), h: Math.round(ext.height), top: Math.round(ext.top) }
    };
  });
  console.log('Mode 2 (Fill):', m2);
  assert.strictEqual(m2.mode, 'fill', 'Screen mode must be fill');
  assert.ok(m2.classes.includes('mode-fill'), 'HTML must have mode-fill class');
  assert.ok(m2.classes.includes('fill'), 'HTML must have fill class');
  assert.strictEqual(m2.stage.w, 393, 'Stage width must fill 393px');
  assert.strictEqual(m2.stage.h, 852, 'Stage height must fill 852px');
  assert.ok(m2.ext.h >= 852, 'Extended canvas must cover full 852px height');

  await page.screenshot({ path: path.resolve(__dirname, '../dist/r41_iphone17_mode_fill.png') });

  // 5. Test persistence on reload
  await page.reload();
  await page.waitForTimeout(500);

  const persistedMode = await page.evaluate(() => {
    return {
      mode: window.__game.APP.screenMode,
      saved: window.__game.GAME.S.settings.screenMode
    };
  });
  console.log('Persisted screenMode after reload:', persistedMode);
  assert.strictEqual(persistedMode.saved, 'fill', 'Saved setting must persist fill mode');
  assert.strictEqual(persistedMode.mode, 'fill', 'Active mode must remain fill after reload');

  // Switch back to stretch and verify
  await page.evaluate(() => {
    window.__game.APP.setScreenMode('stretch');
    window.__game.GAME.save(true);
  });
  await page.waitForTimeout(300);

  const backStretch = await page.evaluate(() => window.__game.APP.screenMode);
  assert.strictEqual(backStretch, 'stretch', 'Switched back to stretch successfully');

  // 6. Test desktop layout (1280x800)
  const deskContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const deskPage = await deskContext.newPage();
  await deskPage.goto(url);
  await deskPage.waitForTimeout(400);

  const desk = await deskPage.evaluate(() => {
    const s = document.getElementById('stage').getBoundingClientRect();
    const c = document.getElementById('cv').getBoundingClientRect();
    return {
      classes: document.documentElement.className,
      stage: { w: Math.round(s.width), h: Math.round(s.height), x: Math.round(s.x) },
      cv: { w: Math.round(c.width), h: Math.round(c.height) }
    };
  });
  console.log('Desktop layout:', desk);
  assert.ok(!desk.classes.includes('mode-stretch'), 'Desktop must not have mode-stretch');
  assert.strictEqual(desk.stage.w, 360, 'Desktop stage width must be 360px (proportional frame)');
  assert.strictEqual(desk.stage.x, 460, 'Desktop stage must be horizontally centered');

  await browser.close();
  console.log('ALL ROUND 41 VERIFICATIONS PASSED SUCCESSFULLY!');
})();
