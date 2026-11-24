const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');

(async () => {
  console.log('=== STARTING ROUND 60 VERIFICATION: MENU & MODAL SCROLLING & MINI-GAME LOUPE DEFENSE ===');
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
  await page.waitForTimeout(600);

  // Setup game state: abort intro, clear gifts, unlock features
  await page.evaluate(() => {
    DASHA.abort();
    APP.afterIntro();
    if (DASHA.giftOn()) DASHA.openGift();
    GAME.S.phone = true;
    GAME.S.tut = 99;
    GAME.S.st.energy = 100;
  });
  await page.waitForTimeout(300);

  const artifactDir = '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4';

  // Helper function to test touchmove defaultPrevented and element scrolling
  async function testSheetScroll(sheetName, openFn) {
    console.log(`\n--- Testing Sheet: ${sheetName} ---`);
    await page.evaluate(openFn);
    await page.waitForTimeout(300);

    const info = await page.evaluate(() => {
      const sh = document.getElementById('sheet');
      const b = document.getElementById('sh-body');
      if (!sh || !b) return null;

      // Dispatch a touchmove inside #sh-body to verify default is NOT prevented
      const target = b.firstElementChild || b;
      const touch = new Touch({
        identifier: 1,
        target: target,
        clientX: 150,
        clientY: 500,
        pageX: 150,
        pageY: 500
      });
      const touchMoveEv = new TouchEvent('touchmove', {
        cancelable: true,
        bubbles: true,
        touches: [touch],
        targetTouches: [touch],
        changedTouches: [touch]
      });
      target.dispatchEvent(touchMoveEv);

      const beforeScrollTop = b.scrollTop;
      // Scroll down
      b.scrollTop = 120;
      const afterScrollTop = b.scrollTop;

      return {
        isOpen: sh.classList.contains('open'),
        scrollHeight: b.scrollHeight,
        clientHeight: b.clientHeight,
        canScroll: b.scrollHeight > b.clientHeight,
        defaultPrevented: touchMoveEv.defaultPrevented,
        beforeScrollTop,
        afterScrollTop,
        touchAction: window.getComputedStyle(b).touchAction
      };
    });

    console.log(`Result for ${sheetName}:`, info);
    assert(info, `Sheet ${sheetName} elements not found`);
    assert(info.isOpen, `Sheet ${sheetName} is not open`);
    assert(info.canScroll, `Sheet ${sheetName} body should have scrollHeight > clientHeight (scrollHeight=${info.scrollHeight}, clientHeight=${info.clientHeight})`);
    assert(!info.defaultPrevented, `Touchmove inside sheet ${sheetName} MUST NOT be default-prevented!`);
    assert(info.afterScrollTop > 0, `Sheet ${sheetName} must be able to scroll down (scrollTop=${info.afterScrollTop})`);
    assert(info.touchAction.includes('pan-y'), `Sheet ${sheetName} body must have touch-action: pan-y (got ${info.touchAction})`);
  }

  // TEST 1: Growth Sheet - Daily Tasks tab
  await testSheetScroll('Growth / Daily Tasks', () => UI.openGrow('daily'));
  await page.screenshot({ path: path.join(artifactDir, 'r60_test_growth_daily_scrolled.png') });

  // TEST 2: Growth Sheet - Stages tab
  await testSheetScroll('Growth / Stages', () => UI.openGrow('stages'));
  await page.screenshot({ path: path.join(artifactDir, 'r60_test_growth_stages_scrolled.png') });

  // TEST 3: Achievements Sheet
  await testSheetScroll('Achievements', () => UI.openAch());
  await page.screenshot({ path: path.join(artifactDir, 'r60_test_achievements_scrolled.png') });

  // TEST 4: Shop Sheet (food tab)
  await testSheetScroll('Shop / Food', () => UI.openShop('food'));
  await page.screenshot({ path: path.join(artifactDir, 'r60_test_shop_scrolled.png') });

  // TEST 5: Wardrobe Sheet (clothes)
  await testSheetScroll('Wardrobe / Clothes', () => UI.openWardrobe('top'));
  await page.screenshot({ path: path.join(artifactDir, 'r60_test_wardrobe_scrolled.png') });

  // Close sheet
  await page.evaluate(() => UI.closeSheet());
  await page.waitForTimeout(200);

  // TEST 6: Modals (Settings & Profile)
  console.log('\n--- Testing Modals: Settings & Profile ---');
  await page.evaluate(() => UI.openSettings());
  await page.waitForTimeout(300);

  const modalInfo = await page.evaluate(() => {
    const mbox = document.querySelector('.mbox');
    if (!mbox) return null;

    const target = mbox.firstElementChild || mbox;
    const touch = new Touch({ identifier: 2, target, clientX: 150, clientY: 400 });
    const ev = new TouchEvent('touchmove', { cancelable: true, bubbles: true, touches: [touch] });
    target.dispatchEvent(ev);

    return {
      hasModal: UI.hasModal(),
      defaultPrevented: ev.defaultPrevented,
      touchAction: window.getComputedStyle(mbox).touchAction
    };
  });
  console.log('Settings Modal Result:', modalInfo);
  assert(modalInfo.hasModal, 'Modal should be registered in UI.hasModal()');
  assert(!modalInfo.defaultPrevented, 'Touchmove in Settings modal MUST NOT be default-prevented');
  assert(modalInfo.touchAction.includes('pan-y'), 'Modal must have touch-action: pan-y');

  await page.screenshot({ path: path.join(artifactDir, 'r60_test_settings_modal.png') });
  await page.evaluate(() => UI.closeModal());
  await page.waitForTimeout(200);

  // TEST 7: Mini-Game Banana Shower loupe defense & controls
  console.log('\n--- Testing Mini-Game Loupe Defense & Edge Controls ---');
  await page.evaluate(() => MINI.start('catch'));
  await page.waitForTimeout(300);

  const gameTouchInfo = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const pauseBtn = document.getElementById('g-pause');

    // 1. Touchmove on canvas in game: MUST be defaultPrevented
    const touchCv = new Touch({ identifier: 3, target: cv, clientX: 100, clientY: 200 });
    const evCv = new TouchEvent('touchmove', { cancelable: true, bubbles: true, touches: [touchCv] });
    cv.dispatchEvent(evCv);

    // 2. Touchmove on pause button in game: MUST NOT be defaultPrevented
    const touchPause = new Touch({ identifier: 4, target: pauseBtn, clientX: 20, clientY: 20 });
    const evPause = new TouchEvent('touchmove', { cancelable: true, bubbles: true, touches: [touchPause] });
    pauseBtn.dispatchEvent(evPause);

    // 3. Check monkey edge movement
    const G = MINI.G;
    G.down(0, 250);
    for (let i = 0; i < 60; i++) G.update(1 / 60);
    const leftX = G.m.x;

    G.down(180, 250);
    for (let i = 0; i < 90; i++) G.update(1 / 60);
    const rightX = G.m.x;
    G.up();

    return {
      cvDefaultPrevented: evCv.defaultPrevented,
      pauseDefaultPrevented: evPause.defaultPrevented,
      leftX,
      rightX
    };
  });

  console.log('Game Touch & Edge Result:', gameTouchInfo);
  assert(gameTouchInfo.cvDefaultPrevented, 'Touchmove on canvas during game MUST be default-prevented (prevents loupe & gestures)');
  assert(!gameTouchInfo.pauseDefaultPrevented, 'Touchmove on pause button MUST NOT be default-prevented');
  assert(gameTouchInfo.leftX <= 7, `Monkey left edge <= 7 (got ${gameTouchInfo.leftX})`);
  assert(gameTouchInfo.rightX >= 173, `Monkey right edge >= 173 (got ${gameTouchInfo.rightX})`);

  // Close game
  await page.evaluate(() => MINI.home());
  await page.waitForTimeout(200);

  // TEST 8: Console errors audit
  console.log('\n--- Console Errors Audit ---');
  console.log('Console errors recorded:', consoleErrors);
  assert.strictEqual(consoleErrors.length, 0, `Expected 0 console errors, got ${consoleErrors.length}: ${JSON.stringify(consoleErrors)}`);

  console.log('\n=== ALL ROUND 60 VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  await browser.close();
})();
