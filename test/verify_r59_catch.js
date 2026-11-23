const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');

(async () => {
  console.log('=== STARTING ROUND 59 VERIFICATION: BANANA CATCH & LOUPE DEFENSE ===');
  const browser = await chromium.launch({
    executablePath: '/Users/emoorpheus/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell',
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('voice1.txt') && !txt.includes('voice2.txt') && !txt.includes('CORS') && !txt.includes('ERR_FAILED')) {
        consoleErrors.push(txt);
      }
    }
  });

  await page.goto('file://' + path.resolve('dist/site/index.html'));
  await page.waitForTimeout(500);

  // Setup game state
  await page.evaluate(() => {
    if (DASHA.giftOn()) DASHA.openGift();
    GAME.S.phone = true;
    GAME.S.tut = 99;
    GAME.S.st.energy = 100;
  });

  console.log('\n--- TEST 1: Launch Mini-Game [catch] & Edge Reach ---');
  await page.evaluate(() => {
    MINI.start('catch');
  });
  await page.waitForTimeout(300);

  // Move monkey to left edge (touch at x = 0)
  const leftX = await page.evaluate(() => {
    const G = MINI.G;
    G.down(0, 250);
    // simulate 60 frames (1 second) of moving left
    for (let i = 0; i < 60; i++) G.update(1 / 60);
    G.up();
    return G.m.x;
  });
  console.log('Left edge reach m.x:', leftX);
  assert(leftX <= 7, `Monkey must reach left edge (<= 7), got ${leftX}`);

  // Screenshot left edge
  const artifactDir = '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4';
  await page.screenshot({ path: path.join(artifactDir, 'r59_catch_left_edge.png') });
  console.log('Saved left edge screenshot -> r59_catch_left_edge.png');

  // Move monkey to right edge (touch at x = 180)
  const rightX = await page.evaluate(() => {
    const G = MINI.G;
    G.down(180, 250);
    for (let i = 0; i < 90; i++) G.update(1 / 60);
    G.up();
    return G.m.x;
  });
  console.log('Right edge reach m.x:', rightX);
  assert(rightX >= 173, `Monkey must reach right edge (>= 173), got ${rightX}`);

  // Screenshot right edge
  await page.screenshot({ path: path.join(artifactDir, 'r59_catch_right_edge.png') });
  console.log('Saved right edge screenshot -> r59_catch_right_edge.png');

  console.log('\n--- TEST 2: Catching Bananas at the Very Edges ---');
  const catchRes = await page.evaluate(() => {
    const G = MINI.G;
    const res = {};

    // 1. Banana at far left edge (x = 2) when monkey is at left edge (m.x = 6)
    G.m.x = 6;
    G.m.vx = 0;
    G.items.length = 0;
    const itLeft = { type: 'banana', x: 2, y: 245, vy: 80, ph: 0 };
    G.items.push(itLeft);
    G.update(1 / 60);
    res.caughtFarLeft = (G.items.length === 0);

    // 2. Banana at x = 8 when monkey is at m.x = 6
    G.items.length = 0;
    G.items.push({ type: 'banana', x: 8, y: 245, vy: 80, ph: 0 });
    G.update(1 / 60);
    res.caughtEdgeLeft = (G.items.length === 0);

    // 3. Banana at far right edge (x = 178) when monkey is at right edge (m.x = 174)
    G.m.x = 174;
    G.m.vx = 0;
    G.items.length = 0;
    const itRight = { type: 'banana', x: 178, y: 245, vy: 80, ph: 0 };
    G.items.push(itRight);
    G.update(1 / 60);
    res.caughtFarRight = (G.items.length === 0);

    // 4. Banana at x = 172 when monkey is at m.x = 174
    G.items.length = 0;
    G.items.push({ type: 'banana', x: 172, y: 245, vy: 80, ph: 0 });
    G.update(1 / 60);
    res.caughtEdgeRight = (G.items.length === 0);

    return res;
  });

  console.log('Edge catch test results:', catchRes);
  assert(catchRes.caughtFarLeft, 'Far left banana (x=2) must be caught when monkey is at left edge');
  assert(catchRes.caughtEdgeLeft, 'Edge banana (x=8) must be caught when monkey is at left edge');
  assert(catchRes.caughtFarRight, 'Far right banana (x=178) must be caught when monkey is at right edge');
  assert(catchRes.caughtEdgeRight, 'Edge banana (x=172) must be caught when monkey is at right edge');

  console.log('\n--- TEST 3: Loupe & Selection Defense ---');
  const loupeDef = await page.evaluate(() => {
    const ghudPill = document.querySelector('#ghud .pill');
    const ghudPause = document.querySelector('#g-pause');
    const pillPE = window.getComputedStyle(ghudPill).pointerEvents;
    const pausePE = window.getComputedStyle(ghudPause).pointerEvents;

    // Simulate selection attempt
    const range = document.createRange();
    range.selectNodeContents(ghudPill);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));

    return {
      pillPE,
      pausePE,
      selectionCleared: sel.rangeCount === 0 || sel.toString() === ''
    };
  });

  console.log('Loupe defense info:', loupeDef);
  assert.strictEqual(loupeDef.pillPE, 'none', '#ghud .pill pointer-events must be none');
  assert.strictEqual(loupeDef.pausePE, 'auto', '#g-pause pointer-events must be auto');
  assert(loupeDef.selectionCleared, 'Selection must be immediately cleared');

  console.log('\n--- TEST 4: Verifying Settings Version 59 ---');
  await page.evaluate(() => {
    MINI.home();
    UI.openSettings();
  });
  await page.waitForTimeout(300);
  const verText = await page.evaluate(() => {
    const box = document.querySelector('.mbox');
    return box ? box.innerText : '';
  });
  console.log('Settings version text includes "Версия 59":', verText.includes('Версия 59'));
  assert(verText.includes('Версия 59'), `Settings must display Version 59, got: ${verText}`);

  console.log('\n--- TEST 5: Console Error Audit ---');
  console.log('Captured console errors:', consoleErrors.length);
  assert.strictEqual(consoleErrors.length, 0, `Expected 0 console errors, got ${consoleErrors.join(', ')}`);

  console.log('\n=== ALL ROUND 59 VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  await browser.close();
})();
