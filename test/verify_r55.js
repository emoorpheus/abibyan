const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const execPath = '/Users/emoorpheus/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell';
  const browser = await chromium.launch({
    headless: true,
    executablePath: execPath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  const filePath = 'file://' + path.resolve(__dirname, '../dist/index.html');
  console.log('Navigating to', filePath);
  await page.goto(filePath);
  await page.waitForTimeout(800);

  // Close modals if any and setup state for testing mini-games
  await page.evaluate(() => {
    const nm = document.querySelector('#nm-ok');
    if (nm) nm.click();
    document.querySelectorAll('[data-close]').forEach(b => b.click());
    const S = window.__game.GAME.S;
    S.tut = 99;
    S.phone = 1;
    S.home.items.pc = 'tower';
    S.grow.stage = 6;
    S.st.energy = 100;
  });
  await page.waitForTimeout(600);

  // 1. Verify CSS rules for disabling iOS callout / text loupe
  const cssChecks = await page.evaluate(() => {
    const stage = document.getElementById('stage');
    const cv = document.getElementById('cv');
    const body = document.body;
    const stageStyle = window.getComputedStyle(stage);
    const cvStyle = window.getComputedStyle(cv);
    const bodyStyle = window.getComputedStyle(body);
    const hasCalloutRule = Array.from(document.querySelectorAll('style')).some(s => s.textContent.includes('-webkit-touch-callout:none'));
    return {
      hasCalloutRule,
      stageUserSelect: stageStyle.webkitUserSelect || stageStyle.userSelect,
      bodyUserSelect: bodyStyle.webkitUserSelect || bodyStyle.userSelect,
      cvTouchAction: cvStyle.touchAction,
    };
  });
  console.log('CSS Callout/UserSelect checks:', cssChecks);
  if (!cssChecks.hasCalloutRule) {
    throw new Error('WebKit touch callout rule is missing from stylesheet');
  }
  if (cssChecks.stageUserSelect !== 'none' || cssChecks.bodyUserSelect !== 'none') {
    throw new Error('user-select is not disabled');
  }

  // 2. Test Catch mini-game fullscreen floor & jumping
  console.log('Testing Catch mini-game...');
  await page.evaluate(() => {
    window.__game.MINI.start('catch', 1);
  });
  await page.waitForTimeout(500);

  const catchStatus = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const ctx = cv.getContext('2d');
    const st = window.__game.MINI.st;
    const G = window.__game.MINI.G;
    // Sample pixels at bottom y = 340, 360, 380
    const p340 = Array.from(ctx.getImageData(90, 340, 1, 1).data);
    const p360 = Array.from(ctx.getImageData(90, 360, 1, 1).data);
    const p380 = Array.from(ctx.getImageData(90, 380, 1, 1).data);
    return {
      cvWidth: cv.width,
      cvHeight: cv.height,
      active: window.__game.MINI.active,
      gid: st ? st.gid : null,
      monkeyX: G ? G.m.x : null,
      jumpT: G ? G.m.jt : null,
      p340,
      p360,
      p380
    };
  });
  console.log('Catch status:', catchStatus);

  if (catchStatus.cvHeight !== 390) {
    throw new Error(`Expected canvas height 390 on iPhone 17, got ${catchStatus.cvHeight}`);
  }

  // Verify pixel colors below y = 320:
  // Native soil #8a5a3a is roughly R=138, G=90, B=58. Parquet floor is R=185, G=149, B=108.
  console.log('Pixel at y=360:', catchStatus.p360);
  const [r, g, b] = catchStatus.p360;
  if (r < 100 || r > 175 || g < 70 || g > 130 || b < 40 || b > 90) {
    throw new Error(`Pixel at y=360 (${r},${g},${b}) does not match soil texture!`);
  }

  // Capture screenshot of Catch
  await page.screenshot({ path: '/tmp/r55_catch_fullscreen.png' });
  console.log('Saved /tmp/r55_catch_fullscreen.png');

  // Test horizontal movement without jumping
  await page.evaluate(() => {
    const G = window.__game.MINI.G;
    // Simulate horizontal drag
    window.__game.MINI.down(90, 300);
    window.__game.MINI.move(60, 304);
    window.__game.MINI.move(40, 296);
    // Advance time slightly
    window.advanceTime(100);
    const afterDrag = {
      monkeyX: G.m.x,
      jumpT: G.m.jt
    };
    window.__game.MINI.up(40, 296);
    return afterDrag;
  });

  const dragResult = await page.evaluate(() => {
    const G = window.__game.MINI.G;
    return {
      monkeyX: G.m.x,
      jumpT: G.m.jt
    };
  });
  console.log('After horizontal drag:', dragResult);
  if (dragResult.jumpT !== 0) {
    throw new Error(`Accidental jump triggered during horizontal drag! jumpT=${dragResult.jumpT}`);
  }

  // Test intentional upward swipe for jump
  await page.evaluate(() => {
    const G = window.__game.MINI.G;
    // Touch down at y = 320, swipe up to y = 260 without horizontal movement
    window.__game.MINI.down(90, 320);
    window.__game.MINI.move(90, 260);
    window.__game.MINI.up(90, 260);
    window.advanceTime(50);
  });
  const swipeJumpResult = await page.evaluate(() => {
    const G = window.__game.MINI.G;
    return {
      monkeyX: G.m.x,
      jumpT: G.m.jt
    };
  });
  console.log('After upward swipe:', swipeJumpResult);
  if (swipeJumpResult.jumpT <= 0) {
    throw new Error('Intentional upward swipe failed to trigger jump!');
  }

  // 3. Test Bongo mini-game fullscreen stage
  console.log('Testing Bongo mini-game...');
  await page.evaluate(() => {
    window.__game.MINI.start('bongo', 1);
  });
  await page.waitForTimeout(500);

  const bongoStatus = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const ctx = cv.getContext('2d');
    const p340 = Array.from(ctx.getImageData(90, 340, 1, 1).data);
    const p360 = Array.from(ctx.getImageData(90, 360, 1, 1).data);
    const p380 = Array.from(ctx.getImageData(90, 380, 1, 1).data);
    return { p340, p360, p380 };
  });
  console.log('Bongo pixels below 320:', bongoStatus);
  const [br, bg, bb] = bongoStatus.p360;
  if (br < 80 || br > 140 || bg < 45 || bg > 85 || bb < 20 || bb > 50) {
    throw new Error(`Bongo pixel at y=360 (${br},${bg},${bb}) does not match stage wood!`);
  }

  await page.screenshot({ path: '/tmp/r55_bongo_fullscreen.png' });
  console.log('Saved /tmp/r55_bongo_fullscreen.png');

  // 4. Test Gym mini-game fullscreen mat
  console.log('Testing Gym mini-game...');
  await page.evaluate(() => {
    window.__game.MINI.start('gym', 1);
  });
  await page.waitForTimeout(500);

  const gymStatus = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const ctx = cv.getContext('2d');
    const p360 = Array.from(ctx.getImageData(90, 360, 1, 1).data);
    return { p360 };
  });
  console.log('Gym pixel at y=360:', gymStatus.p360);
  const [gr, gg, gb] = gymStatus.p360;
  if (gr < 40 || gr > 80 || gg < 40 || gg > 80 || gb < 45 || gb > 90) {
    throw new Error(`Gym pixel at y=360 (${gr},${gg},${gb}) does not match gym rubber mat!`);
  }

  await page.screenshot({ path: '/tmp/r55_gym_fullscreen.png' });
  console.log('Saved /tmp/r55_gym_fullscreen.png');

  // 5. Exit back to home scene
  await page.evaluate(() => {
    window.__game.MINI.home();
  });
  await page.waitForTimeout(500);

  const homeScene = await page.evaluate(() => {
    return window.__game.APP ? window.__game.APP.scene : 'unknown';
  });
  console.log('Returned to scene:', homeScene);

  console.log('Total console/page errors:', errors.length);
  if (errors.length > 0) {
    console.error('Errors encountered:', errors);
    throw new Error('Test failed with console errors');
  }

  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  await browser.close();
})();
