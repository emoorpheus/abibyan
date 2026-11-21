let chromium;
try {
  chromium = require('playwright').chromium;
} catch (e) {
  chromium = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright').chromium;
}
const path = require('path'), fs = require('fs');

(async () => {
  const chromePath = fs.existsSync('/usr/local/bin/chromium') ? '/usr/local/bin/chromium' : '/Users/emoorpheus/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2
  });

  const fileUrl = 'file://' + path.resolve(__dirname, '../dist/index.html');
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  // 1. Capture speech bubble with lisped text
  await page.evaluate(() => {
    DASHA.openGift();
    APP.afterIntro();
    HOME.say('Шпашибо, Дашулик! Я так шкучал!');
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r42_lisp_speech_bubble.png' });

  // 2. Capture monkey walking at bottom of room
  await page.evaluate(() => {
    UI.hideBubble();
    HOME.down(90, 315);
    HOME.up(90, 315);
    for (let f = 0; f < 40; f++) window.advanceTime(100);
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r42_bottom_walking.png' });

  console.log('Screenshots saved.');
  await browser.close();
})();
