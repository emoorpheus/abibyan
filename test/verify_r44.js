const { chromium } = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright');
const assert = require('assert');

(async () => {
  console.log('--- Test R44: Bath Loofah/Sponge & Fullscreen Game Extension on iOS ---');
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  await page.addInitScript(() => {
    localStorage.setItem('martyn_tamagotchi_v1', JSON.stringify({
      named: true, name: 'Абибян', coins: 500, lvl: 5,
      settings: { sfx: true, music: true, screenMode: 'fill' } // Test migration from 'fill' to 'stretch'!
    }));
  });

  await page.goto('file:///Users/emoorpheus/Documents/antigravity/friendly-turing/dist/index.html');
  await page.waitForTimeout(600);

  // 1. Check screenMode: migrated from 'fill' to 'stretch' and fills the entire screen
  const screenMode = await page.evaluate(() => window.__game.APP.screenMode);
  console.log('1. APP.screenMode (after migration):', screenMode);
  assert.strictEqual(screenMode, 'stretch', 'Old fill mode should be migrated to stretch on mobile/iOS');

  const layout = await page.evaluate(() => {
    const cv = document.getElementById('cv');
    const stage = document.getElementById('stage');
    const ext = document.getElementById('ext');
    return {
      cvH: cv.getBoundingClientRect().height,
      cvW: cv.getBoundingClientRect().width,
      stageH: stage.getBoundingClientRect().height,
      extDisplay: getComputedStyle(ext).display
    };
  });
  console.log('Layout in stretch mode:', layout);
  assert.strictEqual(layout.stageH, 852, 'Stage should fill full 852px viewport height');
  assert(layout.cvH >= 700, `Canvas cv height (${layout.cvH}) should cover screen below HUD`);
  assert.strictEqual(layout.extDisplay, 'none', 'Extension texture should be hidden in stretch mode');

  // 2. Travel to bath and check sponge spot
  await page.evaluate(() => {
    while (window.__game.UI.hasModal()) window.__game.UI.closeModal();
    window.__game.HOME.goTo('bath', true);
  });
  await page.waitForTimeout(400);

  const bathSpots = await page.evaluate(() => {
    return window.__game.ROOMS.spots('bath', window.__game.GAME.S.home.items);
  });
  console.log('2. Bath spots keys:', Object.keys(bathSpots));
  assert.ok(bathSpots.sponge, 'Bath spots must have sponge spot for мочалка');
  console.log('Sponge spot coordinates:', bathSpots.sponge);

  // 3. Tap on sponge should lather the monkey (add foam)
  const foamBefore = await page.evaluate(() => window.__game.HOME.foam.length);
  const [sx, sy, sw, sh] = bathSpots.sponge;
  const tapX = sx + sw / 2, tapY = sy + sh / 2;

  await page.evaluate(([x, y]) => {
    window.__game.HOME.down(x, y, { pointerId: 1, pointerType: 'touch', clientX: x * 2, clientY: y * 2 });
    window.__game.HOME.up(x, y, { pointerId: 1, pointerType: 'touch', clientX: x * 2, clientY: y * 2 });
  }, [tapX, tapY]);
  await page.waitForTimeout(300);

  const foamAfter = await page.evaluate(() => window.__game.HOME.foam.length);
  console.log(`3. Foam before tap: ${foamBefore}, after tap: ${foamAfter}`);
  assert.ok(foamAfter > foamBefore, 'Tapping sponge must add foam bubbles to monkey');

  // 4. Test dragging tool on sponge
  await page.evaluate(([x, y]) => {
    window.__game.HOME.down(x, y, { pointerId: 2, pointerType: 'touch', clientX: x * 2, clientY: y * 2 });
  }, [tapX, tapY]);
  const hasTool = await page.evaluate(() => !!window.__game.HOME.tool);
  console.log('4. Tool active while dragging:', hasTool);
  assert.ok(hasTool, 'Pointerdown on sponge must start soap tool');

  // Scrub across monkey
  await page.evaluate(() => {
    const mk = window.__game.HOME.mk;
    window.__game.HOME.down(mk.x, mk.y - 40, { pointerId: 2, pointerType: 'touch', clientX: mk.x * 2, clientY: (mk.y - 40) * 2 });
    window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 2, pointerType: 'touch', clientX: mk.x * 2 + 10, clientY: (mk.y - 40) * 2 }));
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 2, pointerType: 'touch' }));
  });
  await page.waitForTimeout(200);

  // Take screenshots of both room and settings
  await page.screenshot({ path: '/tmp/r44_bath_sponge.png' });

  // Open settings and check button text
  await page.evaluate(() => {
    window.__game.UI.openSettings();
  });
  await page.waitForTimeout(300);
  const btnText = await page.evaluate(() => {
    const btn = document.getElementById('t-screen');
    return btn ? btn.textContent : '';
  });
  console.log('5. Settings screen mode button text:', btnText);
  assert.strictEqual(btnText, '', 'Settings toggle should not exist (adaptive stretch only)');

  await page.screenshot({ path: '/tmp/r44_settings_mode.png' });

  console.log('--- ALL R44 TESTS PASSED! ---');
  await browser.close();
})().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
