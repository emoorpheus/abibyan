const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');

(async () => {
  console.log('--- Starting verification of Round 57 fixes ---');
  const browser = await chromium.launch({
    executablePath: '/Users/emoorpheus/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });

  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true
  });

  const page = await context.newPage();
  const filePath = 'file://' + path.resolve(__dirname, '../dist/site/index.html');
  console.log('Loading page:', filePath);
  await page.goto(filePath, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // 1. Verify Audio engine configuration
  console.log('1. Checking Audio engine settings...');
  const audioInfo = await page.evaluate(() => {
    const A = typeof AUDIO !== 'undefined' ? AUDIO : window.AUDIO;
    const S = typeof SPEECH !== 'undefined' ? SPEECH : window.SPEECH;
    const planSample = A._plan ? A._plan('Вот это машшаж!') : [];
    const planToilet = A._plan ? A._plan('Фу-у-х!') : [];
    const planTap = A._plan ? A._plan('Тут занято!') : [];
    return {
      hasSpeech: !!S,
      prioCount: S && S.lines ? Object.keys(S.lines).length : 0,
      wordsCount: S && S.words ? Object.keys(S.words).length : 0,
      planSample: planSample.map(x => x.id || ('gap ' + x.gap)),
      planToilet: planToilet.map(x => x.id || ('gap ' + x.gap)),
      planTap: planTap.map(x => x.id || ('gap ' + x.gap))
    };
  });
  console.log('Audio engine info:', audioInfo);
  assert(audioInfo.prioCount >= 50, 'Priority lines must be present in bundle');
  assert(audioInfo.planSample.some(x => x && x.startsWith('L')), 'Вот это машшаж! must play as a whole line');
  assert(audioInfo.planToilet.some(x => x && x.startsWith('L')), 'Фу-у-х! must play as a whole line');
  assert(audioInfo.planTap.some(x => x && x.startsWith('L')), 'Тут занято! must play as a whole line');

  // 2. Verify Version in settings
  console.log('2. Checking Version in Settings...');
  const versionText = await page.evaluate(() => {
    const U = typeof UI !== 'undefined' ? UI : window.UI;
    U.openSettings();
    const modal = document.querySelector('#modal');
    const text = modal ? modal.textContent : '';
    U.closeModal();
    return text;
  });
  console.log('Version in settings contains "Версия 57":', versionText.includes('Версия 57'));
  assert(versionText.includes('Версия 57'), 'Settings must display Version 57');

  // 3. Verify Ghost Click Protection on Friends
  console.log('3. Testing ghost click protection on friends...');
  // Navigate to kitchen where Pusya sits
  await page.evaluate(() => {
    const H = typeof HOME !== 'undefined' ? HOME : window.HOME;
    H.goTo('kitchen');
  });
  await page.waitForTimeout(600);

  // Get Pusya's position and tap via touch pointerup
  const pusyaTapResult = await page.evaluate(async () => {
    const F = typeof FRIENDS !== 'undefined' ? FRIENDS : window.FRIENDS;
    const drawn = F.drawn.find(d => d.id === 'pusya');
    if (!drawn) return { error: 'Pusya not found on screen' };
    const cx = drawn.x0 + drawn.e.w / 2;
    const cy = drawn.y0 + drawn.e.h / 2;
    
    // Tap Pusya
    F.tap({ kind: 'friend', id: 'pusya' });
    
    // Wait 50ms for card to open
    await new Promise(r => setTimeout(r, 60));
    
    const modalBefore = document.querySelector('#modal');
    if (!modalBefore) return { error: 'Modal did not open' };
    
    // Simulate a synthetic click arriving 40ms later at the exact position of duel button
    const duelBtn = modalBefore.querySelector('#fr-duel') || modalBefore.querySelector('#fr-feed');
    let clickedThrough = false;
    if (duelBtn) {
      // Dispatch click event directly
      const clickEv = new MouseEvent('click', { bubbles: true, cancelable: true });
      duelBtn.dispatchEvent(clickEv);
    }
    
    // Check if modal was closed or mini-game / feed started
    await new Promise(r => setTimeout(r, 100));
    const modalAfter = document.querySelector('#modal');
    const curScene = (typeof APP !== 'undefined' && APP.scene) || (window.APP && window.APP.scene) || 'home';
    
    return {
      modalStillOpen: !!modalAfter,
      scene: curScene,
      isMiniGameActive: curScene === 'game'
    };
  });
  console.log('Pusya tap ghost click test result:', pusyaTapResult);
  assert(pusyaTapResult.modalStillOpen, 'Friend card MUST remain open and NOT click through to duel or game');
  assert(!pusyaTapResult.isMiniGameActive, 'Mini-game must NOT have started automatically');

  // Take screenshot of Pusya card opened cleanly
  const shotPath = '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r57_pusya_card_clean.png';
  await page.screenshot({ path: shotPath });
  console.log('Screenshot saved to:', shotPath);

  // Close card
  await page.evaluate(() => {
    const U = typeof UI !== 'undefined' ? UI : window.UI;
    U.closeModal();
  });
  await page.waitForTimeout(300);

  // 4. Test Monty on balcony
  await page.evaluate(() => {
    const H = typeof HOME !== 'undefined' ? HOME : window.HOME;
    H.goTo('balcony');
  });
  await page.waitForTimeout(600);

  const montyTapResult = await page.evaluate(async () => {
    const F = typeof FRIENDS !== 'undefined' ? FRIENDS : window.FRIENDS;
    F.tap({ kind: 'friend', id: 'monty' });
    await new Promise(r => setTimeout(r, 60));
    const modalBefore = document.querySelector('#modal');
    if (!modalBefore) return { error: 'Monty modal did not open' };
    
    const duelBtn = modalBefore.querySelector('#fr-duel');
    if (duelBtn) {
      const clickEv = new MouseEvent('click', { bubbles: true, cancelable: true });
      duelBtn.dispatchEvent(clickEv);
    }
    await new Promise(r => setTimeout(r, 100));
    const modalAfter = document.querySelector('#modal');
    const curScene = (typeof APP !== 'undefined' && APP.scene) || (window.APP && window.APP.scene) || 'home';
    return {
      modalStillOpen: !!modalAfter,
      scene: curScene
    };
  });
  console.log('Monty tap ghost click test result:', montyTapResult);
  assert(montyTapResult.modalStillOpen, 'Monty card MUST remain open and NOT click through to duel');

  const montyShotPath = '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r57_monty_card_clean.png';
  await page.screenshot({ path: montyShotPath });
  console.log('Monty screenshot saved to:', montyShotPath);

  await browser.close();
  console.log('--- ALL VERIFICATIONS PASSED SUCCESSFULLY! ---');
})();
