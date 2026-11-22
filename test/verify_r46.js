'use strict';
const { chromium } = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright');
const path = require('path');
const assert = require('assert');

(async () => {
  console.log('--- Starting Round 46 Audio Background Suspension Verification ---');
  const browser = await chromium.launch({
    args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream']
  });
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 }
  });

  const fileUrl = 'file://' + path.resolve(__dirname, '../fresh.html');
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Initialize / unlock audio
  await page.click('#stage');
  await page.waitForTimeout(200);

  // 1. Check audio state when active
  const activeState = await page.evaluate(() => {
    AUDIO.init();
    return {
      hasCtx: !!AUDIO.ctx,
      ctxState: AUDIO.ctx ? AUDIO.ctx.state : null,
      masterGain: AUDIO._out ? AUDIO._out.gain.value : null,
      track: AUDIO.trackId,
      isSuspended: typeof AUDIO.isSuspended === 'function' ? AUDIO.isSuspended() : false
    };
  });
  console.log('1. Active audio state:', activeState);
  assert(activeState.hasCtx, 'AudioContext should exist');
  assert.strictEqual(activeState.ctxState, 'running', 'AudioContext should be running when active');
  assert.strictEqual(activeState.isSuspended, false, 'Audio should not be suspended when active');

  // Start a live sound (e.g. kettle/microwave)
  await page.evaluate(() => {
    AUDIO.play('boop');
  });

  // 2. Simulate app going to background / phone locked
  console.log('2. Simulating background / screen lock (visibilitychange document.hidden=true)...');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(200);

  const bgState = await page.evaluate(() => {
    return {
      hidden: document.hidden,
      hasSuspendMethod: typeof AUDIO.suspend === 'function',
      isSuspended: typeof AUDIO.isSuspended === 'function' ? AUDIO.isSuspended() : false,
      ctxState: AUDIO.ctx ? AUDIO.ctx.state : null,
      masterGain: AUDIO._out ? AUDIO._out.gain.value : null,
      audioSessionType: (typeof navigator !== 'undefined' && navigator.audioSession) ? navigator.audioSession.type : 'none'
    };
  });
  console.log('Background state:', bgState);

  assert.strictEqual(bgState.hasSuspendMethod, true, 'AUDIO.suspend should exist');
  assert.strictEqual(bgState.isSuspended, true, 'AUDIO should be suspended in background');
  assert.strictEqual(bgState.masterGain, 0, 'Master gain must be 0 in background');
  assert.strictEqual(bgState.ctxState, 'suspended', 'AudioContext must be suspended in background');

  // 3. Verify sounds are dropped while backgrounded
  const soundInBg = await page.evaluate(() => {
    const actBefore = AUDIO._sp ? AUDIO._sp.active.length : 0;
    AUDIO.play('click');
    AUDIO.say('Привет!');
    const actAfter = AUDIO._sp ? AUDIO._sp.active.length : 0;
    return { actBefore, actAfter };
  });
  console.log('Sound attempt while backgrounded:', soundInBg);
  assert.strictEqual(soundInBg.actAfter, soundInBg.actBefore, 'No audio clips should start while in background');

  // 4. Simulate returning to foreground / unlocking phone
  console.log('3. Simulating foreground / screen unlock (visibilitychange document.hidden=false)...');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(200);

  const fgState = await page.evaluate(() => {
    return {
      hidden: document.hidden,
      isSuspended: typeof AUDIO.isSuspended === 'function' ? AUDIO.isSuspended() : false,
      ctxState: AUDIO.ctx ? AUDIO.ctx.state : null,
      masterGain: AUDIO._out ? AUDIO._out.gain.value : null,
      track: AUDIO.trackId
    };
  });
  console.log('Foreground state:', fgState);

  assert.strictEqual(fgState.isSuspended, false, 'AUDIO should not be suspended when back in foreground');
  assert.strictEqual(fgState.ctxState, 'running', 'AudioContext should be running after returning');
  assert(Math.abs(fgState.masterGain - 0.8) < 0.01, 'Master gain should be restored to 0.8');

  // 5. Test pagehide event
  console.log('4. Testing pagehide event...');
  await page.evaluate(() => {
    window.dispatchEvent(new Event('pagehide'));
  });
  await page.waitForTimeout(100);
  const pagehideState = await page.evaluate(() => ({
    isSuspended: AUDIO.isSuspended(),
    masterGain: AUDIO._out.gain.value,
    ctxState: AUDIO.ctx.state
  }));
  console.log('After pagehide:', pagehideState);
  assert.strictEqual(pagehideState.isSuspended, true, 'Audio must be suspended after pagehide');
  assert.strictEqual(pagehideState.masterGain, 0, 'Master gain must be 0 after pagehide');

  // 6. Test pageshow event
  console.log('5. Testing pageshow event...');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    window.dispatchEvent(new Event('pageshow'));
  });
  await page.waitForTimeout(100);
  const pageshowState = await page.evaluate(() => ({
    isSuspended: AUDIO.isSuspended(),
    masterGain: AUDIO._out.gain.value,
    ctxState: AUDIO.ctx.state
  }));
  console.log('After pageshow:', pageshowState);
  assert.strictEqual(pageshowState.isSuspended, false, 'Audio must not be suspended after pageshow');
  assert.strictEqual(pageshowState.ctxState, 'running', 'AudioContext must be running after pageshow');
  assert(Math.abs(pageshowState.masterGain - 0.8) < 0.01, 'Master gain must be 0.8 after pageshow');

  console.log('--- ALL ROUND 46 AUDIO BACKGROUND TESTS PASSED! ---');
  await browser.close();
})();
