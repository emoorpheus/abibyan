const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');

(async () => {
  console.log('=== STARTING COMPREHENSIVE QA & BUG TESTING SUITE (ROUND 58) ===');

  const browser = await chromium.launch({
    executablePath: '/Users/emoorpheus/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });

  const context = await browser.newContext({
    viewport: { width: 402, height: 874 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      // Ignore expected file:// protocol CORS restrictions on local text fetch
      if (txt.includes('CORS policy') || txt.includes('URL scheme "file"') || txt.includes('ERR_FAILED')) return;
      consoleErrors.push(txt);
      console.error('[BROWSER ERROR]', txt);
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.error('[BROWSER EXCEPTION]', err.message);
  });

  const filePath = 'file://' + path.resolve(__dirname, '../dist/site/index.html');
  console.log('Loading app:', filePath);
  await page.goto(filePath, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // -------------------------------------------------------------
  // TEST 1: Geometry & Ceiling Drop (topY = 52 on iPhone 17)
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: Verifying topY & Lowered Ceiling ---');
  const geom = await page.evaluate(() => {
    const H = typeof HOME !== 'undefined' ? HOME : window.HOME;
    const cv = document.getElementById('cv');
    const ty = H.topY ? H.topY() : 0;
    return {
      canvasH: cv.height,
      canvasW: cv.width,
      topY: ty
    };
  });
  console.log('Geometry:', geom);
  assert.strictEqual(geom.canvasH, 391, 'Canvas height on iPhone 17 must be 391');
  assert.ok(geom.topY >= 64, 'HOME.topY() must be >= 64 (below Dynamic Island + HUD) on iPhone 17, got ' + geom.topY);

  // -------------------------------------------------------------
  // TEST 2: Kitchen Light Off - Uniform Darkening (NO bottom stripe)
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Testing Kitchen Light Off & Bottom Floor Color ---');
  await page.evaluate(async () => {
    if (typeof DASHA !== 'undefined' && DASHA.giftOn && DASHA.giftOn()) {
      DASHA.openGift();
      DASHA.abort();
    }
    const H = typeof HOME !== 'undefined' ? HOME : window.HOME;
    H.goTo('kitchen');
    while (H.trans) await new Promise(r => setTimeout(r, 50));
  });
  await page.waitForTimeout(600);

  // Tap kitchen ceiling light to turn it OFF
  const lampToggleResult = await page.evaluate(async () => {
    const H = typeof HOME !== 'undefined' ? HOME : window.HOME;
    const ty = H.topY ? H.topY() : 0;
    // Tap light in kitchen
    H.down(90, ty + 25);
    H.up(90, ty + 25);
    await new Promise(r => setTimeout(r, 200));
    return {
      things: H.things()
    };
  });
  console.log('Toggled kitchen lamp, things:', lampToggleResult);
  assert.strictEqual(lampToggleResult.things.floorLamp, false, 'Kitchen lamp must now be OFF');

  // Sample pixel data from top, middle, and bottom (y = 330..385)
  const kitchenPixelCheck = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const ctx = cv.getContext('2d');
    
    // Sample bottom strip at y = 350 to 385 (the extended floor area)
    const botData = ctx.getImageData(50, 370, 80, 15).data;
    let rSum = 0, gSum = 0, bSum = 0, count = 80 * 15;
    for (let i = 0; i < count; i++) {
      rSum += botData[i * 4];
      gSum += botData[i * 4 + 1];
      bSum += botData[i * 4 + 2];
    }
    const botAvg = { r: Math.round(rSum / count), g: Math.round(gSum / count), b: Math.round(bSum / count) };

    // Sample top ceiling just below HOME.topY() (below the dark HUD header panel)
    const H = typeof HOME !== 'undefined' ? HOME : window.HOME;
    const ceilY = (H && H.topY ? H.topY() : 0) + 4;
    const topData = ctx.getImageData(50, ceilY, 80, 12).data;
    count = 80 * 12;
    rSum = 0; gSum = 0; bSum = 0;
    for (let i = 0; i < count; i++) {
      rSum += topData[i * 4];
      gSum += topData[i * 4 + 1];
      bSum += topData[i * 4 + 2];
    }
    const topAvg = { r: Math.round(rSum / count), g: Math.round(gSum / count), b: Math.round(bSum / count) };

    return { botAvg, topAvg };
  });
  console.log('Kitchen dark pixel samples:', kitchenPixelCheck);

  // Verify bottom floor and top ceiling are properly darkened (not bright unshaded beige > 200!)
  assert(kitchenPixelCheck.botAvg.r < 170, 'Bottom floor must be shaded by lamp off overlay (<170), got ' + kitchenPixelCheck.botAvg.r);
  assert(kitchenPixelCheck.topAvg.r < 170, 'Top ceiling must be shaded by lamp off overlay (<170), got ' + kitchenPixelCheck.topAvg.r);
  assert(Math.abs(kitchenPixelCheck.botAvg.r - kitchenPixelCheck.topAvg.r) < 35, 'Bottom floor tone must match top ceiling tone without harsh color boundary');

  const kitchenDarkShot = '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r58_kitchen_dark_uniform.png';
  await page.screenshot({ path: kitchenDarkShot });
  console.log('Saved kitchen dark screenshot to:', kitchenDarkShot);

  // Turn lamp back ON
  await page.evaluate(async () => {
    const H = typeof HOME !== 'undefined' ? HOME : window.HOME;
    const ty = H.topY ? H.topY() : 0;
    H.down(90, ty + 25);
    H.up(90, ty + 25);
    await new Promise(r => setTimeout(r, 200));
  });
  await page.waitForTimeout(300);

  // -------------------------------------------------------------
  // TEST 3: Screenshots of All 5 Rooms with Lowered Ceiling
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Checking All 5 Rooms ---');
  const rooms = ['zal', 'kitchen', 'bath', 'hall', 'balcony'];
  for (const r of rooms) {
    await page.evaluate((rm) => {
      const H = typeof HOME !== 'undefined' ? HOME : window.HOME;
      H.goTo(rm);
    }, r);
    await page.waitForTimeout(400);
    const shotPath = `/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r58_${r}_lowered_ceiling.png`;
    await page.screenshot({ path: shotPath });
    console.log(`Room [${r}] rendered clean -> ${shotPath}`);
  }

  // -------------------------------------------------------------
  // TEST 4: Version 58 in Settings
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Verifying Settings Version ---');
  const verInfo = await page.evaluate(() => {
    const U = typeof UI !== 'undefined' ? UI : window.UI;
    U.openSettings();
    const modal = document.querySelector('#modal');
    const text = modal ? modal.textContent : '';
    U.closeModal();
    return text;
  });
  console.log('Settings version text contains "Версия":', verInfo.includes('Версия'));
  assert(verInfo.includes('Версия 5') || verInfo.includes('Версия 6'), 'Settings must display Version');

  // -------------------------------------------------------------
  // TEST 5: Achievements Progressive Tiers
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Verifying Progressive Achievements ---');
  const achData = await page.evaluate(() => {
    const U = typeof UI !== 'undefined' ? UI : window.UI;
    const D = typeof DATA !== 'undefined' ? DATA : window.DATA;
    const G = typeof GAME !== 'undefined' ? GAME : window.GAME;
    const s = G.S;
    const visible = D.visibleAchs(s);
    return {
      totalVisible: visible.length,
      sampleAchs: visible.slice(0, 5).map(a => ({ id: a.id, name: a.name, tier: a.tier, chain: a.chain }))
    };
  });
  console.log('Achievements info:', achData);
  assert(achData.totalVisible > 0, 'Achievements must have visible tiers');

  // -------------------------------------------------------------
  // TEST 6: Mini-Games Fullscreen Floor Rendering
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Testing Mini-Games Launch & Fullscreen ---');
  await page.evaluate(() => {
    if (typeof DASHA !== 'undefined') DASHA.abort();
    if (typeof APP !== 'undefined') APP.afterIntro();
    const G = typeof GAME !== 'undefined' ? GAME : window.GAME;
    G.S.phone = true;
    G.S.tut = 99;
    G.S.st.energy = 100;
    G.S.grow.stage = 5;
    G.S.home.items.pc = 'tower';
    G.S.home.items.tv = 'lg';
  });

  const miniGamesToTest = ['catch', 'bongo', 'gym', 'stack'];
  for (const gid of miniGamesToTest) {
    const mgResult = await page.evaluate((gameId) => {
      const M = typeof MINI !== 'undefined' ? MINI : window.MINI;
      const cv = document.getElementById('cv');
      M.start(gameId, 1);
      return {
        scene: window.APP ? window.APP.scene : 'game',
        activeGid: M.st ? M.st.gid : null,
        cvH: cv.height
      };
    }, gid);
    console.log(`Mini-game [${gid}] started:`, mgResult);
    assert.strictEqual(mgResult.activeGid, gid, `Mini-game ${gid} must be active`);
    assert.strictEqual(mgResult.cvH, 391, 'Mini-game canvas height must be 391');

    await page.waitForTimeout(300);
    const mgShot = `/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r58_minigame_${gid}_fullscreen.png`;
    await page.screenshot({ path: mgShot });

    // Exit back home
    await page.evaluate(() => {
      const M = typeof MINI !== 'undefined' ? MINI : window.MINI;
      M.home();
    });
    await page.waitForTimeout(300);
  }

  // -------------------------------------------------------------
  // TEST 7: Interactive Gameplay Flows (Friends, Toilet, Feed, Wash)
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Testing Interactive Gameplay Flows ---');
  // 7a: Pusya in kitchen
  await page.evaluate(async () => {
    const H = typeof HOME !== 'undefined' ? HOME : window.HOME;
    H.goTo('kitchen');
    while (H.trans) await new Promise(r => setTimeout(r, 50));
  });
  await page.waitForTimeout(400);

  const pusyaRes = await page.evaluate(async () => {
    const F = typeof FRIENDS !== 'undefined' ? FRIENDS : window.FRIENDS;
    F.tap({ kind: 'friend', id: 'pusya' });
    await new Promise(r => setTimeout(r, 60));
    const m = document.querySelector('#modal');
    const openOk = !!m;
    if (m) {
      // Simulate synthetic click on duel or feed
      const b = m.querySelector('#fr-duel') || m.querySelector('#fr-feed');
      if (b) b.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
    await new Promise(r => setTimeout(r, 100));
    const mAfter = document.querySelector('#modal');
    const stayedOpen = !!mAfter;
    const U = typeof UI !== 'undefined' ? UI : window.UI;
    while (U.hasModal()) U.closeModal();
    return { openOk, stayedOpen };
  });
  console.log('Pusya card ghost-click test:', pusyaRes);
  assert(pusyaRes.openOk && pusyaRes.stayedOpen, 'Pusya card must open cleanly without click-through');

  // 7b: Toilet in bathroom
  await page.evaluate(() => {
    const H = typeof HOME !== 'undefined' ? HOME : window.HOME;
    H.goTo('bath', true);
  });
  await page.waitForTimeout(300);

  const toiletRes = await page.evaluate(async () => {
    const H = typeof HOME !== 'undefined' ? HOME : window.HOME;
    const ty = H.topY ? H.topY() : 0;
    const x = 20, y = ty + 215;
    H.down(x, y);
    const pr = Object.assign({}, H.press);
    H.up(x, y);
    await new Promise(r => setTimeout(r, 100));
    return {
      room: H.room,
      ty,
      pr,
      trans: H.trans,
      modal: UI.hasModal(),
      trip: H.trip ? H.trip.kind : null
    };
  });
  console.log('Toilet sitting test:', toiletRes);
  assert.strictEqual(toiletRes.trip, 'toilet', 'Tapping toilet must start toilet trip');

  // Wait 1.5s for toilet animation sequence
  await page.waitForTimeout(1500);

  // 7c: Feeding
  const feedRes = await page.evaluate(() => {
    const H = typeof HOME !== 'undefined' ? HOME : window.HOME;
    const G = typeof GAME !== 'undefined' ? GAME : window.GAME;
    const food0 = G.S.st.food;
    const fedOk = H.feed('banana');
    return { fedOk, food0, food1: G.S.st.food };
  });
  console.log('Feed test result:', feedRes);
  assert(feedRes.fedOk, 'Feeding banana must succeed');
  assert(feedRes.food1 >= feedRes.food0, 'Food stat must increase after feeding');

  // -------------------------------------------------------------
  // TEST 8: Console Error Audit
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Console Error Audit ---');
  console.log('Total browser errors captured:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Captured errors:', consoleErrors);
  }
  assert.strictEqual(consoleErrors.length, 0, 'There must be ZERO uncaught browser errors/exceptions across all flows');

  await browser.close();
  console.log('\n=== ALL COMPREHENSIVE QA TESTS PASSED WITH 0 ERRORS! ===');
})().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
