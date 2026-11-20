let chromium;
try {
  chromium = require('playwright').chromium;
} catch (e) {
  chromium = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright').chromium;
}
const path = require('path'), fs = require('fs'), assert = require('assert');

const ROOT = path.join(__dirname, '..');
const FILE = 'file://' + path.join(ROOT, 'dist', 'abibyan-test.html');

(async () => {
  console.log('--- Verifying Window Close Feature ---');

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
  const consoleErrors = [];
  page.on('pageerror', err => {
    console.error('Page error:', err.message);
    consoleErrors.push(err.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Console error:', msg.text());
      consoleErrors.push(msg.text());
    }
  });

  await page.goto(FILE);
  await page.waitForTimeout(600);

  // Close initial dialog if present
  await page.evaluate(() => {
    const btn = document.querySelector('#nm-ok');
    if (btn) btn.click();
    const G = window.__game;
    G.GAME.S.dasha.gift = 'opened';
    G.GAME.S.dasha.party[2026] = '2026-11-21';
    G.FRIENDS._endParty();
  });
  await page.waitForTimeout(400);

  // Test 1: Check GAGS exports
  const exportsCheck = await page.evaluate(() => {
    const G = window.__game;
    return {
      hasWinClose: typeof G.GAGS.winClose === 'function',
      hasWinTap: typeof G.GAGS.winTap === 'function',
      hasWinOpen: typeof G.GAGS.winOpen === 'function',
      hasHomeCloseWindow: typeof G.HOME.closeWindow === 'function'
    };
  });
  console.log('Exports check:', exportsCheck);
  assert.strictEqual(exportsCheck.hasWinClose, true, 'GAGS.winClose must be a function');
  assert.strictEqual(exportsCheck.hasWinTap, true, 'GAGS.winTap must be a function');
  assert.strictEqual(exportsCheck.hasHomeCloseWindow, true, 'HOME.closeWindow must be a function');

  // Test 2: Test zal window closing with monkey jump
  console.log('Testing zal window closing...');
  const zalTest = await page.evaluate(async () => {
    const G = window.__game;
    G.HOME.goTo('zal', true);
    if (window.advanceTime) window.advanceTime(200);

    // Open window in zal
    G.GAGS.winOpen('zal');
    if (window.advanceTime) window.advanceTime(600);
    const winBefore = G.GAGS.info().win.zal;

    // Trigger closeWindow
    const started = G.HOME.closeWindow('zal');
    const tripKind = G.HOME.trip ? G.HOME.trip.kind : null;

    // Advance time step-by-step: walk to bed, hop up, close, hop down
    const snapshots = [];
    for (let step = 0; step < 40; step++) {
      if (window.advanceTime) window.advanceTime(100);
      const mk = G.HOME._mk();
      snapshots.push({
        t: step * 0.1,
        trip: G.HOME.trip ? { kind: G.HOME.trip.kind, ph: G.HOME.trip.ph } : null,
        win: G.GAGS.info().win.zal
      });
    }

    const winAfter = G.GAGS.info().win.zal;
    return { winBefore, started, tripKind, winAfter, snapshots: snapshots.filter(s => s.trip) };
  });

  console.log('Zal test result:', {
    winBefore: zalTest.winBefore,
    started: zalTest.started,
    tripKind: zalTest.tripKind,
    winAfter: zalTest.winAfter,
    snapshotsCount: zalTest.snapshots.length
  });

  assert.strictEqual(zalTest.winBefore, 'open', 'Window in zal must be open before closeWindow');
  assert.strictEqual(zalTest.started, true, 'closeWindow in zal must start successfully');
  assert.strictEqual(zalTest.tripKind, 'winClose', 'Trip kind must be winClose');
  assert.strictEqual(zalTest.winAfter, 'closed', 'Window in zal must be closed after monkey closes it');

  // Test 3: Test balcony window closing with monkey jump
  console.log('Testing balcony window closing...');
  const balconyTest = await page.evaluate(async () => {
    const G = window.__game;
    G.HOME.goTo('balcony', true);
    if (window.advanceTime) window.advanceTime(200);

    // Open window on balcony
    G.GAGS.winOpen('balcony');
    if (window.advanceTime) window.advanceTime(600);
    const winBefore = G.GAGS.info().win.balcony;

    // Trigger closeWindow
    const started = G.HOME.closeWindow('balcony');
    const tripKind = G.HOME.trip ? G.HOME.trip.kind : null;

    // Advance time: walk to desk, hop to desk -> sill, close, hop down
    for (let step = 0; step < 40; step++) {
      if (window.advanceTime) window.advanceTime(100);
    }

    const winAfter = G.GAGS.info().win.balcony;
    return { winBefore, started, tripKind, winAfter };
  });

  console.log('Balcony test result:', balconyTest);
  assert.strictEqual(balconyTest.winBefore, 'open', 'Window on balcony must be open before closeWindow');
  assert.strictEqual(balconyTest.started, true, 'closeWindow on balcony must start successfully');
  assert.strictEqual(balconyTest.tripKind, 'winClose', 'Trip kind must be winClose');
  assert.strictEqual(balconyTest.winAfter, 'closed', 'Window on balcony must be closed after monkey closes it');

  // Assert no errors occurred
  assert.strictEqual(consoleErrors.length, 0, 'No errors should occur: ' + JSON.stringify(consoleErrors));

  console.log('--- ALL WINDOW CLOSE CHECKS PASSED ---');
  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
