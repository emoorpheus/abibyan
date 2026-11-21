let chromium;
try {
  chromium = require('playwright').chromium;
} catch (e) {
  chromium = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright').chromium;
}
const path = require('path'), fs = require('fs'), assert = require('assert');

const ROOT = path.join(__dirname, '..');
const FILE = 'file://' + path.join(ROOT, 'dist', 'abibyan-test.html') + '#gift';

(async () => {
  console.log('--- Verifying Gift Box Tap-Only Feature ---');

  const chromePath = fs.existsSync('/usr/local/bin/chromium') ? '/usr/local/bin/chromium' : '/Users/emoorpheus/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
  const browser = await chromium.launch({
    executablePath: chromePath,
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });

  const page = await ctx.newPage();
  await page.goto(FILE);
  await page.waitForTimeout(600);

  // 1. Verify gift box is displayed and button is hidden
  const info = await page.evaluate(() => {
    const G = window.__game;
    const D = G.DASHA;
    const btn = document.querySelector('#gift #nm-ok');
    const isBtnVisible = btn ? (btn.offsetWidth > 0 && btn.offsetHeight > 0 && window.getComputedStyle(btn).display !== 'none') : false;
    const giftText = (document.querySelector('#gift') || {}).textContent || '';
    const box = D.giftBox();

    return {
      giftOn: D.giftOn(),
      hasBtn: !!btn,
      isBtnVisible,
      giftText,
      box
    };
  });

  console.log('Initial gift box info:', info);

  assert.strictEqual(info.giftOn, true, 'Gift box must be active on start');
  assert.strictEqual(info.isBtnVisible, false, 'The "Открыть" button must NOT be visible');
  assert.ok(info.giftText.includes('Постучи по коробке'), 'Text must prompt to tap on the box');

  // Screenshot before taps
  await page.screenshot({ path: path.join(ROOT, 'dist', 'gift_box_no_button.png') });
  console.log('Saved screenshot dist/gift_box_no_button.png');

  // 2. Perform 3 taps on the box itself
  const bx = info.box.x + info.box.w / 2;
  const by = info.box.y + info.box.h / 2;

  // Tap 1
  const tap1 = await page.evaluate(([x, y]) => {
    const G = window.__game;
    G.HOME.down(x, y);
    G.HOME.up(x, y);
    if (window.advanceTime) window.advanceTime(300);
    return { taps: G.DASHA.giftTaps(), on: G.DASHA.giftOn() };
  }, [bx, by]);
  console.log('Tap 1 result:', tap1);
  assert.strictEqual(tap1.taps, 1, 'Taps count must be 1');
  assert.strictEqual(tap1.on, true, 'Gift box must still be closed after tap 1');

  // Tap 2
  const tap2 = await page.evaluate(([x, y]) => {
    const G = window.__game;
    G.HOME.down(x, y);
    G.HOME.up(x, y);
    if (window.advanceTime) window.advanceTime(300);
    return { taps: G.DASHA.giftTaps(), on: G.DASHA.giftOn() };
  }, [bx, by]);
  console.log('Tap 2 result:', tap2);
  assert.strictEqual(tap2.taps, 2, 'Taps count must be 2');
  assert.strictEqual(tap2.on, true, 'Gift box must still be closed after tap 2');

  // Tap 3 -> should open the box
  const tap3 = await page.evaluate(([x, y]) => {
    const G = window.__game;
    G.HOME.down(x, y);
    G.HOME.up(x, y);
    if (window.advanceTime) window.advanceTime(1000);
    return { on: G.DASHA.giftOn(), named: G.GAME.S.named, name: G.GAME.S.name };
  }, [bx, by]);
  console.log('Tap 3 result:', tap3);
  assert.strictEqual(tap3.on, false, 'Gift box must be opened after tap 3');
  assert.strictEqual(tap3.named, true, 'Monkey must be named after opening gift box');
  assert.strictEqual(tap3.name, 'Абибян', 'Monkey name must be Абибян');

  // Screenshot after opening
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ROOT, 'dist', 'gift_box_opened_by_tap.png') });
  console.log('Saved screenshot dist/gift_box_opened_by_tap.png');

  console.log('--- ALL GIFT TAP-ONLY CHECKS PASSED ---');
  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
