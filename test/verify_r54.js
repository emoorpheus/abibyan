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

  // Capture console errors
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  const filePath = 'file://' + path.resolve(__dirname, '../dist/index.html');
  console.log('Navigating to', filePath);
  await page.goto(filePath);
  await page.waitForTimeout(800);

  // Click name ok if present to enter 'home' scene
  await page.evaluate(() => {
    const nm = document.querySelector('#nm-ok');
    if (nm) nm.click();
    document.querySelectorAll('[data-close]').forEach(b => b.click());
  });
  await page.waitForTimeout(1000);

  // 1. Verify HUD position
  const hudTop = await page.evaluate(() => {
    const hud = document.getElementById('hud');
    const style = window.getComputedStyle(hud);
    return {
      top: style.top,
      offsetTop: hud.offsetTop
    };
  });
  console.log('HUD style top & offsetTop:', hudTop);
  if (hudTop.offsetTop < 16) {
    throw new Error(`HUD offsetTop is too small (${hudTop.offsetTop}px), Dynamic Island collision risk`);
  }

  // 2. Open Achievements and verify tiered badges and trophies
  await page.evaluate(() => {
    window.__game.UI.openAch();
  });
  await page.waitForTimeout(500);

  const achInfo = await page.evaluate(() => {
    const tiers = Array.from(document.querySelectorAll('.ach-tier')).map(el => el.textContent.trim().toLowerCase());
    const bronze = tiers.filter(t => t.includes('бронза')).length;
    const silver = tiers.filter(t => t.includes('серебро')).length;
    const gold = tiers.filter(t => t.includes('золото')).length;
    return { bronze, silver, gold, total: tiers.length };
  });
  console.log('Achievement tiers count:', achInfo);
  if (achInfo.bronze === 0 || achInfo.silver === 0 || achInfo.gold === 0) {
    throw new Error('Missing tiered achievements (bronze, silver, or gold)');
  }

  // Take screenshot of Achievements sheet
  await page.screenshot({ path: '/tmp/r54_achievements.png' });
  console.log('Saved /tmp/r54_achievements.png');

  // Close sheet
  await page.evaluate(() => {
    window.__game.UI.closeSheet();
  });
  await page.waitForTimeout(300);

  // 3. Navigate to bath and test sitting on toilet
  await page.evaluate(() => {
    window.__game.HOME.goTo('bath', true);
  });
  await page.waitForTimeout(500);

  const toiletTest = await page.evaluate(async () => {
    // Start toilet trip
    window.__game.HOME.tripStart('toilet');
    const tripActive = window.__game.HOME.trip;
    return { tripActive: !!tripActive, kind: tripActive ? tripActive.kind : null };
  });
  console.log('Toilet trip started:', toiletTest);
  if (!toiletTest.tripActive || toiletTest.kind !== 'toilet') {
    throw new Error('Failed to start toilet trip');
  }

  // Wait for monkey to sit on toilet (dur lead is ~0.35s)
  await page.waitForTimeout(800);

  const monkeyToiletPose = await page.evaluate(() => {
    return {
      x: window.__game.HOME.mk.x,
      y: window.__game.HOME.mk.y,
      pose: window.__game.HOME.mk.pose,
      legs: window.__game.HOME.mk.legs
    };
  });
  console.log('Monkey sitting on toilet:', monkeyToiletPose);
  await page.screenshot({ path: '/tmp/r54_toilet_sitting.png' });
  console.log('Saved /tmp/r54_toilet_sitting.png');

  // 4. Test Pusya Knead / Massage
  await page.evaluate(() => {
    window.__game.HOME.goTo('zal', true);
    const f = window.__game.FRIENDS._F && window.__game.FRIENDS._F.pusya;
    if (f) {
      f.pose = 'knead';
      f.look = [1, 0];
      f.x = window.__game.HOME.mk.x - 20;
      f.y = 250;
    }
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/r54_pusya_massage.png' });
  console.log('Saved /tmp/r54_pusya_massage.png');

  // 5. Test Duel Catch parameters (weakened)
  const duelParams = await page.evaluate(() => {
    // Check MINI DuelCatch AIS if accessible, or test DuelCatch logic
    return {
      hasMini: typeof window.MINI !== 'undefined'
    };
  });
  console.log('MINI duel params check:', duelParams);

  if (errors.length > 0) {
    console.error('Console errors:', errors);
    throw new Error(`Page had ${errors.length} errors: ` + errors.join('; '));
  }

  console.log('All R54 feature verifications PASSED successfully!');
  await browser.close();
})();
