const { chromium } = require('/tmp/pw/node_modules/playwright-chromium');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/emoorpheus/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    args: ['--no-sandbox']
  });

  const ctx = await browser.newContext({
    viewport: { width: 402, height: 874 },
    screen: { width: 402, height: 874 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  });

  const page = await ctx.newPage();
  await page.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { get: () => true }); });

  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 62, bottom: 34, left: 0, right: 0 } });

  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(1000);

  // Dismiss intro
  try {
    const b = await page.$('#nm-ok'); if (b) await b.click();
    await page.waitForTimeout(400);
    await page.evaluate(() => document.querySelectorAll('[data-close]').forEach(x => x.click()));
  } catch (e) {}

  await page.waitForTimeout(500);

  const res = await page.evaluate(() => {
    return {
      classes: document.documentElement.className,
      u: getComputedStyle(document.documentElement).getPropertyValue('--u'),
      ct: getComputedStyle(document.documentElement).getPropertyValue('--ct'),
      sh: getComputedStyle(document.documentElement).getPropertyValue('--sh'),
      appPadding: getComputedStyle(document.getElementById('app')).padding,
      barRect: document.getElementById('bar').getBoundingClientRect(),
      hudRect: document.getElementById('hud').getBoundingClientRect(),
      cvRect: document.getElementById('cv').getBoundingClientRect(),
      extRect: document.getElementById('ext').getBoundingClientRect()
    };
  });

  console.log('Result:', JSON.stringify(res, null, 2));

  await browser.close();
})();
