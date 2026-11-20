let chromium;
try {
  chromium = require('playwright').chromium;
} catch (e) {
  chromium = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright').chromium;
}
const path = require('path'), fs = require('fs');

const ROOT = path.join(__dirname, '..');
const FILE = 'file://' + path.join(ROOT, 'dist', 'abibyan-test.html');

(async () => {
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

  // 1. Check birthday date behavior in-game
  const dateChecks = await page.evaluate(() => {
    const G = window.__game;
    // Set gift opened so hearts would be active if date allows
    G.GAME.S.dasha.gift = 'opened';

    // Check on 21.11.2026 (birthday)
    const bday21 = G.DASHA.bday(new Date(2026, 10, 21));
    const bday28 = G.DASHA.bday(new Date(2026, 10, 28));
    const bday29 = G.DASHA.bday(new Date(2026, 10, 29));
    const bday20 = G.DASHA.bday(new Date(2026, 10, 20));

    return {
      bday21: !!bday21 && bday21.diff === 0,
      bday28: !!bday28 && bday28.diff === 7,
      bday29: bday29 === null,
      bday20: bday20 === null
    };
  });

  console.log('Date checks:', dateChecks);
  if (!dateChecks.bday21 || !dateChecks.bday28 || !dateChecks.bday29 || !dateChecks.bday20) {
    throw new Error('Date checks failed: ' + JSON.stringify(dateChecks));
  }

  // 2. Check duck position in kitchen when Monty is present
  const duckAvoidance = await page.evaluate(() => {
    const G = window.__game;
    G.HOME.goTo('kitchen', true);
    // Place Monty in kitchen at [146, 282]
    G.FRIENDS._F.monty.room = 'kitchen';
    G.FRIENDS._F.monty.x = 146;
    G.FRIENDS._F.monty.y = 282;

    // Place ducks right at x=146
    G.DUCKS._place('kitchen', 146, 1);
    const ducksPos = G.DUCKS.pos();
    const leadDuck = ducksPos[0];

    const montyY = 282;
    return {
      leadDuckX: leadDuck.x,
      leadDuckY: leadDuck.y,
      montyY,
      duckIsBelowMontyFeet: leadDuck.y - leadDuck.h >= montyY - 2
    };
  });

  console.log('Duck avoidance in kitchen:', duckAvoidance);
  if (duckAvoidance.leadDuckY < 288) {
    throw new Error('Duck did not detour below Monty! leadDuckY=' + duckAvoidance.leadDuckY);
  }

  // Take screenshot to visually confirm
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ROOT, 'dist', 'duck_avoidance_kitchen.png') });
  console.log('Saved screenshot dist/duck_avoidance_kitchen.png');

  await browser.close();
  console.log('ALL PLAYWRIGHT TESTS PASSED!');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
