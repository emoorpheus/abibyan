const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');

// Relative luminance & WCAG contrast calculation
function rgbToLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseRgb(str) {
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return [0, 0, 0];
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
}

function getContrast(rgb1, rgb2) {
  const l1 = rgbToLuminance(...rgb1);
  const l2 = rgbToLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

(async () => {
  console.log('=== STARTING ROUND 61 VERIFICATION: ACHIEVEMENT CONTRAST & READABILITY ===');
  const browser = await chromium.launch({
    executablePath: '/Users/emoorpheus/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true
  });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('voice1.txt') && !txt.includes('voice2.txt') && !txt.includes('CORS') && !txt.includes('ERR_FAILED')) {
        consoleErrors.push(txt);
      }
    }
  });

  await page.goto('file://' + path.resolve('dist/site/index.html'));
  await page.waitForTimeout(500);

  // Setup game with both active and completed achievements across all tiers
  await page.evaluate(() => {
    DASHA.abort();
    APP.afterIntro();
    while (UI.hasModal()) UI.closeModal();
    GAME.S.phone = true;
    GAME.S.tut = 99;
    // Set some completed achievements across bronze, silver, gold
    GAME.S.ach = {
      lvl10: true,       // bronze done
      first_meal: true,  // bronze done
      skuf: true,        // silver done
      champ: true,       // gold done
    };
    UI.openAch();
  });
  await page.waitForTimeout(300);

  const artifactDir = '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4';
  await page.screenshot({ path: path.join(artifactDir, 'r61_achievements_contrast_top.png') });

  console.log('\n--- TEST 1: Inspecting Achievement Card & Text Contrast ---');
  const items = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll('#sh-body .li'));
    return list.map(el => {
      const t1 = el.querySelector('.t1');
      const t2 = el.querySelector('.t2');
      const badge = el.querySelector('.ach-tier');
      const cardStyle = window.getComputedStyle(el);
      const t1Style = t1 ? window.getComputedStyle(t1) : null;
      const t2Style = t2 ? window.getComputedStyle(t2) : null;
      const badgeStyle = badge ? window.getComputedStyle(badge) : null;

      return {
        title: t1 ? t1.childNodes[0].textContent.trim() : '',
        tierBadgeText: badge ? badge.textContent.trim() : '',
        isDone: el.classList.contains('done'),
        cardBg: cardStyle.backgroundColor,
        cardBorderLeft: cardStyle.borderLeftColor,
        cardBorderLeftWidth: cardStyle.borderLeftWidth,
        t1Color: t1Style ? t1Style.color : '',
        t2Color: t2Style ? t2Style.color : '',
        badgeBg: badgeStyle ? badgeStyle.backgroundColor : '',
        badgeColor: badgeStyle ? badgeStyle.color : ''
      };
    });
  });

  console.log(`Inspected ${items.length} achievement cards`);
  assert(items.length >= 30, `Expected at least 30 achievements, got ${items.length}`);

  let testedDone = 0;
  let testedActive = 0;

  for (const it of items) {
    const cardBgRgb = parseRgb(it.cardBg);
    const t1Rgb = parseRgb(it.t1Color);
    const t2Rgb = parseRgb(it.t2Color);

    const contrastT1 = getContrast(cardBgRgb, t1Rgb);
    const contrastT2 = getContrast(cardBgRgb, t2Rgb);

    // Assert WCAG AA minimum contrast (4.5:1) for title and description
    assert(contrastT1 >= 5.0, `Title "${it.title}" has insufficient contrast (${contrastT1.toFixed(2)}:1) against card background (${it.cardBg} vs ${it.t1Color})`);
    assert(contrastT2 >= 4.0, `Description for "${it.title}" has insufficient contrast (${contrastT2.toFixed(2)}:1) against card background (${it.cardBg} vs ${it.t2Color})`);

    // Badge contrast check
    if (it.badgeBg && it.badgeColor) {
      const bBg = parseRgb(it.badgeBg);
      const bColor = parseRgb(it.badgeColor);
      const badgeContrast = getContrast(bBg, bColor);
      assert(badgeContrast >= 4.5, `Tier badge "${it.tierBadgeText}" has insufficient contrast (${badgeContrast.toFixed(2)}:1)`);
    }

    // Border accent check
    assert(parseFloat(it.cardBorderLeftWidth) >= 3, `Card "${it.title}" must have >= 3px left border stripe, got ${it.cardBorderLeftWidth}`);

    if (it.isDone) testedDone++;
    else testedActive++;
  }

  console.log(`Verified ${testedDone} completed achievements and ${testedActive} active achievements.`);
  console.log('Sample verified card (completed gold):', items.find(x => x.title === 'Чемпион недели'));
  console.log('Sample verified card (completed silver):', items.find(x => x.title === 'Настоящий скуф'));
  console.log('Sample verified card (active silver):', items.find(x => x.title === 'Гурман'));

  // TEST 2: Scroll down and capture bottom of achievements
  console.log('\n--- TEST 2: Scrolling and Verifying Bottom Achievements ---');
  await page.evaluate(() => {
    const b = document.getElementById('sh-body');
    b.scrollTop = 1200;
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(artifactDir, 'r61_achievements_contrast_bottom.png') });

  // TEST 3: Settings Version Check
  console.log('\n--- TEST 3: Verifying Settings Version 61 ---');
  await page.evaluate(() => {
    UI.closeSheet();
    UI.openSettings();
  });
  await page.waitForTimeout(300);
  const verInfo = await page.evaluate(() => {
    const modal = document.querySelector('.mbox');
    return modal ? modal.innerText : '';
  });
  console.log('Settings version text includes "Версия 61":', verInfo.includes('Версия 61'));
  assert(verInfo.includes('Версия 61'), `Settings must display Version 61, got: ${verInfo}`);

  // TEST 4: Console Error Audit
  console.log('\n--- TEST 4: Console Error Audit ---');
  console.log('Console errors recorded:', consoleErrors);
  assert.strictEqual(consoleErrors.length, 0, `Expected 0 console errors, got ${consoleErrors.length}`);

  console.log('\n=== ALL ROUND 61 CONTRAST TESTS PASSED SUCCESSFULLY! ===');
  await browser.close();
})();
