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

  // 1. Setup save state
  await page.evaluate(() => {
    const G = window.__game;
    if (G.DASHA) {
      if (G.DASHA.openGift) G.DASHA.openGift();
      G.DASHA.abort();
    }
    G.GAME.S.tut = 99;
    G.GAME.S.phone = true;
    G.GAME.S.st.energy = 50;
    G.GAME.S.friends.pusya.cd = 0;
    G.HOME.goTo('kitchen', true);
    G.UI.hideBubble();
  });
  await page.waitForTimeout(300);

  // 2. Pusya massage on monkey animation
  await page.evaluate(() => {
    const G = window.__game;
    G.FRIENDS.special('pusya');
  });
  // Wait for speech (~2.5s) + walkTo (~0.6s) + hop onto monkey (~0.4s) -> at 4.2s she is kneading on monkey!
  await page.waitForTimeout(4200);
  await page.screenshot({ path: path.join(ROOT, 'dist', 'r39_pusya_massage.png') });
  console.log('Saved r39_pusya_massage.png');

  // 3. Bongo duel with Monty (neutral pips, no cheating)
  await page.evaluate(() => {
    const G = window.__game;
    G.MINI.start('d_bongo');
  });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(ROOT, 'dist', 'r39_bongo_duel.png') });
  console.log('Saved r39_bongo_duel.png');

  // 4. Friend card showing friendship bar
  await page.evaluate(() => {
    const G = window.__game;
    G.MINI.home();
    G.HOME.goTo('kitchen', true);
    G.FRIENDS.card('pusya');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ROOT, 'dist', 'r39_friend_card.png') });
  console.log('Saved r39_friend_card.png');

  await browser.close();
  console.log('All Round 39 screenshots captured successfully!');
})();
