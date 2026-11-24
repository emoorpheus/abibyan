const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');

(async () => {
  console.log('=== STARTING ROUND 62 VERIFICATION: SINGLE-STAGE ACHIEVEMENTS SET TO GOLD ===');
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

  // Setup game state
  await page.evaluate(() => {
    DASHA.abort();
    APP.afterIntro();
    while (UI.hasModal()) UI.closeModal();
    GAME.S.phone = true;
    GAME.S.tut = 99;
  });

  console.log('\n--- TEST 1: Verify DATA.ACH Tiers Definition ---');
  const achDefs = await page.evaluate(() => {
    const achs = DATA.ACH;
    const chained = [];
    const singleStage = [];

    achs.forEach(a => {
      if (a.chain) {
        chained.push({ id: a.id, name: a.name, chain: a.chain, tier: a.tier });
      } else {
        singleStage.push({ id: a.id, name: a.name, tier: a.tier });
      }
    });

    return { chained, singleStage };
  });

  console.log(`Chained achievements count: ${achDefs.chained.length}`);
  console.log(`Single-stage achievements count: ${achDefs.singleStage.length}`);

  // Assert EVERY single-stage achievement is GOLD
  for (const a of achDefs.singleStage) {
    assert.strictEqual(
      a.tier,
      'gold',
      `Single-stage achievement "${a.name}" (${a.id}) must have tier 'gold', but has '${a.tier}'`
    );
  }
  console.log('✓ All single-stage achievements have tier === "gold"!');

  // Assert chained achievements have bronze, silver, or gold
  for (const a of achDefs.chained) {
    assert(
      ['bronze', 'silver', 'gold'].includes(a.tier),
      `Chained achievement "${a.name}" has invalid tier '${a.tier}'`
    );
  }
  console.log('✓ All chained achievements have valid progression tiers!');

  console.log('\n--- TEST 2: Verify UI Rendering of Achievements ---');
  await page.evaluate(() => {
    UI.openAch();
  });
  await page.waitForTimeout(400);

  const uiItems = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#sh-body .li'));
    return cards.map(c => {
      const t1 = c.querySelector('.t1');
      const badge = c.querySelector('.ach-tier');
      const name = t1 ? t1.childNodes[0].textContent.trim() : '';
      const badgeText = badge ? badge.textContent.trim() : '';
      const isGold = c.classList.contains('tier-gold');
      const isSilver = c.classList.contains('tier-silver');
      const isBronze = c.classList.contains('tier-bronze');
      return { name, badgeText, isGold, isSilver, isBronze };
    });
  });

  const gourmetCard = uiItems.find(x => x.name === 'Гурман');
  const skufCard = uiItems.find(x => x.name === 'Настоящий скуф');
  const sleepyCard = uiItems.find(x => x.name === 'Соня');
  const explorerCard = uiItems.find(x => x.name === 'Всё потрогал');
  const lvlCard = uiItems.find(x => x.name === 'Бронзовый примат');

  console.log('Sample UI cards:');
  console.log('  Гурман:', gourmetCard);
  console.log('  Настоящий скуф:', skufCard);
  console.log('  Соня:', sleepyCard);
  console.log('  Всё потрогал:', explorerCard);
  console.log('  Бронзовый примат:', lvlCard);

  assert(gourmetCard && gourmetCard.badgeText === 'Золото' && gourmetCard.isGold, 'Гурман must be Золото');
  assert(skufCard && skufCard.badgeText === 'Золото' && skufCard.isGold, 'Настоящий скуф must be Золото');
  assert(sleepyCard && sleepyCard.badgeText === 'Золото' && sleepyCard.isGold, 'Соня must be Золото');
  assert(explorerCard && explorerCard.badgeText === 'Золото' && explorerCard.isGold, 'Всё потрогал must be Золото');
  assert(lvlCard && lvlCard.badgeText === 'Бронза' && lvlCard.isBronze, 'Бронзовый примат must be Бронза');

  const artifactDir = '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4';
  await page.screenshot({ path: path.join(artifactDir, 'r62_single_stage_gold_achievements.png') });

  console.log('\n--- TEST 3: Settings Version Check ---');
  await page.evaluate(() => {
    UI.closeSheet();
    UI.openSettings();
  });
  await page.waitForTimeout(300);

  const verText = await page.evaluate(() => {
    const modal = document.querySelector('.mbox');
    return modal ? modal.innerText : '';
  });
  console.log('Settings version text includes "Версия 62":', verText.includes('Версия 62'));
  assert(verText.includes('Версия 62'), `Settings must display Version 62, got: ${verText}`);

  console.log('\n--- TEST 4: Console Error Audit ---');
  console.log('Captured console errors:', consoleErrors.length);
  assert.strictEqual(consoleErrors.length, 0, `Expected 0 console errors, got ${consoleErrors.join(', ')}`);

  console.log('\n=== ALL ROUND 62 VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  await browser.close();
})();
