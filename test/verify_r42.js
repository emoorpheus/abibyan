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
    deviceScaleFactor: 2
  });

  const fileUrl = 'file://' + path.resolve(__dirname, '../dist/index.html');
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  // 1. Check DATA.LINES for monkey lisping (no 'с' or 'С')
  const lispCheck = await page.evaluate(() => {
    const lines = DATA.LINES;
    const failures = [];
    for (const k in lines) {
      for (const s of lines[k]) {
        if (/[сС]/.test(s)) {
          failures.push({ key: k, line: s });
        }
      }
    }
    return { count: Object.keys(lines).length, failures };
  });

  console.log(`DATA.LINES sections checked: ${lispCheck.count}, failures with 'с'/'С': ${lispCheck.failures.length}`);
  if (lispCheck.failures.length > 0) {
    console.log('Sample unlisped lines in DATA.LINES:', lispCheck.failures.slice(0, 5));
  }

  // 2. Check SPEECH.lines keys (should have lisped keys)
  const speechCheck = await page.evaluate(() => {
    if (typeof SPEECH === 'undefined' || !SPEECH.lines) return { ok: false, err: 'no SPEECH.lines' };
    const keys = Object.keys(SPEECH.lines);
    const hasSpashibo = !!SPEECH.lines['шпашибо'];
    const hasBday = !!SPEECH.lines['ш днем рождения дашулик'];
    const hasUnlispedSpasibo = !!SPEECH.lines['спасибо'];
    return { ok: true, totalKeys: keys.length, hasSpashibo, hasBday, hasUnlispedSpasibo };
  });
  console.log('Speech bank check:', speechCheck);

  // 3. Check AUDIO.say and HOME.say lisping
  const sayCheck = await page.evaluate(() => {
    DASHA.openGift();
    APP.afterIntro();
    HOME.say('Спасибо, Дашулик!');
    const bubEl = document.querySelector('.bubble');
    const bubText = UI.bubbleText || (bubEl ? bubEl.textContent : '');
    return { bubText };
  });
  console.log('Spoken bubble check:', sayCheck);

  // 4. Check Walkable bottom area
  const walkCheck = await page.evaluate(async () => {
    DASHA.openGift();
    APP.afterIntro();
    for (let i = 0; i < 20; i++) window.advanceTime(100);
    const mk = HOME.mk;
    const yInitial = mk.y;
    // Tap near bottom floor at (110, 312) via HOME.down/HOME.up
    HOME.down(110, 312);
    HOME.up(110, 312);
    for (let f = 0; f < 40; f++) {
      window.advanceTime(100);
      if (Math.abs(mk.y - 304) <= 3) break;
    }
    const yBottom = mk.y;

    // Now walk to left corner at bottom (40, 312)
    HOME.down(40, 312);
    HOME.up(40, 312);
    for (let f = 0; f < 40; f++) {
      window.advanceTime(100);
      if (Math.abs(mk.x - 40) <= 3 && Math.abs(mk.y - 304) <= 3) break;
    }
    const xLeft = mk.x;
    const yLeft = mk.y;

    return { yInitial, yBottom, xLeft, yLeft };
  });
  console.log('Walk bottom check:', walkCheck);

  // Take screenshot of monkey at bottom
  await page.screenshot({ path: '/tmp/verify_r42.png' });

  await browser.close();

  const passed = lispCheck.failures.length === 0 &&
                 speechCheck.hasSpashibo &&
                 speechCheck.hasBday &&
                 sayCheck.bubText.includes('Шпашибо') &&
                 walkCheck.yBottom >= 295;

  if (passed) {
    console.log('ALL R42 CHECKS PASSED!');
    process.exit(0);
  } else {
    console.log('R42 CHECKS FAILED (as expected before implementation)!');
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
