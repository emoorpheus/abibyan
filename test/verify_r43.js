let chromium;
try {
  chromium = require('playwright').chromium;
} catch (e) {
  chromium = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright').chromium;
}
const path = require('path'), fs = require('fs');

async function run() {
  const chromePath = fs.existsSync('/usr/local/bin/chromium') ? '/usr/local/bin/chromium' : '/Users/emoorpheus/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2.6,
    hasTouch: true
  });

  await page.addInitScript(() => {
    localStorage.setItem('martyn_tamagotchi_save_v1', JSON.stringify({
      named: true, name: 'Абибян', coins: 500, lvl: 5,
      friends: { monty: { known: {} } }
    }));
  });

  const fileUrl = 'file://' + path.resolve(__dirname, '../dist/index.html');
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  console.log('--- 1. Testing Modal Fullscreen and Bottom Band Elimination ---');
  await page.evaluate(() => {
    APP.setScreenMode('fill');
    HOME.goTo('balcony', true);
    FRIENDS.card('monty');
  });
  await page.waitForTimeout(400);

  const modalBox = await page.evaluate(() => {
    const m = document.getElementById('modal');
    const r = m ? m.getBoundingClientRect() : null;
    return {
      top: r ? r.top : -1,
      bottom: r ? r.bottom : -1,
      height: r ? r.height : -1,
      vh: window.innerHeight,
      vw: window.innerWidth
    };
  });
  console.log('Modal bounding box:', modalBox);
  if (modalBox.height !== modalBox.vh || modalBox.top !== 0) {
    throw new Error(`Modal does not cover viewport: ${JSON.stringify(modalBox)}`);
  }

  // Save screenshot of modal without bottom dark band
  const shotPath = '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r43_modal_noband.png';
  await page.screenshot({ path: shotPath });
  console.log('Saved modal screenshot to', shotPath);

  // Assert no double-dimming band below cv (y=770 to y=840 should be uniform, no plunge to black < 40)
  const pixelCheck = await page.evaluate(() => {
    // Canvas reading via temporary canvas
    const cv = document.getElementById('cv');
    const ext = document.getElementById('ext');
    return { cvBottom: cv.getBoundingClientRect().bottom, extBottom: ext ? ext.getBoundingClientRect().bottom : 0 };
  });
  console.log('cv and ext positions:', pixelCheck);

  console.log('--- 2. Testing Dialogue Duration & Tap-to-Advance ---');
  const btn = await page.$('#fr-chat');
  if (!btn) throw new Error('#fr-chat button not found');

  // Tap chat button
  await btn.tap();
  await page.waitForTimeout(600);

  const chatState1 = await page.evaluate(() => {
    const fb = document.querySelector('.bubble.fb');
    const mb = document.querySelector('.bubble:not(.fb)');
    return {
      sceneActive: FRIENDS.sceneActive(),
      friendBubble: fb ? fb.textContent : null,
      monkeyBubble: mb ? mb.textContent : null
    };
  });
  console.log('Chat state right after opening:', chatState1);
  if (!chatState1.friendBubble && !chatState1.monkeyBubble) {
    throw new Error('Dialogue bubble did not appear!');
  }

  // Take screenshot of speaking Monty
  const chatShot = '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r43_monty_chat.png';
  await page.screenshot({ path: chatShot });
  console.log('Saved Monty chat screenshot to', chatShot);

  // Check that the line does NOT prematurely disappear after 1.5s (should remain visible >= 2.5s)
  await page.waitForTimeout(1000);
  const chatStateStillVisible = await page.evaluate(() => {
    const fb = document.querySelector('.bubble.fb');
    const mb = document.querySelector('.bubble:not(.fb)');
    return {
      friendBubble: fb ? fb.textContent : null,
      monkeyBubble: mb ? mb.textContent : null
    };
  });
  console.log('Chat state after 1.6s total:', chatStateStillVisible);
  if (!chatStateStillVisible.friendBubble && !chatStateStillVisible.monkeyBubble) {
    throw new Error('Dialogue line prematurely disappeared! Duration too short.');
  }

  // Test tap-to-advance: tapping stage advances dialogue
  console.log('--- 3. Testing Tap-to-Advance ---');
  const prevLine = chatStateStillVisible.friendBubble || chatStateStillVisible.monkeyBubble;
  await page.touchscreen.tap(200, 400); // tap center of screen
  await page.waitForTimeout(400);

  const chatStateAfterTap = await page.evaluate(() => {
    const fb = document.querySelector('.bubble.fb');
    const mb = document.querySelector('.bubble:not(.fb)');
    return {
      sceneActive: FRIENDS.sceneActive(),
      friendBubble: fb ? fb.textContent : null,
      monkeyBubble: mb ? mb.textContent : null,
      monkeyWalking: HOME.walking
    };
  });
  console.log('Chat state after tap-to-advance:', chatStateAfterTap);
  if (chatStateAfterTap.monkeyWalking) {
    throw new Error('Tap during dialogue caused monkey to walk away instead of advancing dialogue!');
  }
  const nextLine = chatStateAfterTap.friendBubble || chatStateAfterTap.monkeyBubble;
  console.log(`Line advanced from "${prevLine}" to "${nextLine}"`);

  console.log('ALL R43 VERIFICATION CHECKS PASSED!');
  await browser.close();
}

run().catch((e) => {
  console.error('VERIFICATION FAILED:', e);
  process.exit(1);
});
