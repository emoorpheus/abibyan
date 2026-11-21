let chromium;
try {
  chromium = require('playwright').chromium;
} catch (e) {
  chromium = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright').chromium;
}
const path = require('path'), fs = require('fs');
const assert = require('assert');

(async () => {
  const chromePath = fs.existsSync('/usr/local/bin/chromium') ? '/usr/local/bin/chromium' : '/Users/emoorpheus/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.error('Browser error:', msg.text());
  });

  const url = 'file://' + path.resolve(__dirname, '../dist/abibyan-test.html');
  await page.goto(url);
  await page.waitForTimeout(1000);

  console.log('Testing watering can at different tree stages...');
  const stagesResult = await page.evaluate(async () => {
    const G = window.__game;
    const HOME = G.HOME;
    const GAME = G.GAME;
    const S = GAME.S;

    if (G.DASHA && G.DASHA.abort) G.DASHA.abort();
    S.tut = 99;

    HOME.goTo('balcony', true);
    await new Promise(r => setTimeout(r, 200));

    const TREE_Y = [140, 118, 96, 74, 54];
    const results = [];

    for (let stg = 0; stg <= 4; stg++) {
      S.grow.days = 0;
      S.tree.xp = 0;
      S.tree.stage = stg;
      S.tree.water = 0; // allow water
      HOME.waterTree();

      const curStg = GAME.treeStage();
      const expectedCy = TREE_Y[curStg] - 10;
      const expectedCx = 62;
      const expectedSpout = [expectedCx - 14, expectedCy + 6];

      results.push({
        stg,
        curStg,
        expectedCy,
        spoutY: expectedSpout[1],
        expectedFloorMin: expectedCy + 16,
        soilFloor: 236
      });
      await new Promise(r => setTimeout(r, 100));
    }
    return results;
  });

  console.log('Stages check results:', stagesResult);
  for (const r of stagesResult) {
    assert.strictEqual(r.curStg, r.stg);
  }

  console.log('Testing Album buttons in Profile and Settings...');
  const albumTest = await page.evaluate(async () => {
    const UI = window.__game.UI;
    const GAME = window.__game.GAME;
    const ALBUM = window.__game.ALBUM;

    // 1. Open Profile
    UI.openProfile();
    const modalProfile = document.querySelector('#modal');
    if (!modalProfile) return { err: 'No profile modal' };
    const btnAlbumProfile = modalProfile.querySelector('#p-album');
    if (!btnAlbumProfile) return { err: 'No #p-album in profile' };

    btnAlbumProfile.click();
    await new Promise(r => setTimeout(r, 200));

    const sheetAlbum = document.querySelector('#sheet.open');
    if (!sheetAlbum) return { err: 'Album sheet did not open from Profile' };
    const albumTitle = sheetAlbum.querySelector('.sh-title')?.textContent;

    // Close sheet
    UI.closeSheet();
    await new Promise(r => setTimeout(r, 200));

    // 2. Open Settings
    UI.openSettings();
    const modalSettings = document.querySelector('#modal');
    if (!modalSettings) return { err: 'No settings modal' };
    const btnAlbumSettings = modalSettings.querySelector('#t-album');
    if (!btnAlbumSettings) return { err: 'No #t-album in settings' };

    btnAlbumSettings.click();
    await new Promise(r => setTimeout(r, 200));

    const sheetAlbum2 = document.querySelector('#sheet.open');
    if (!sheetAlbum2) return { err: 'Album sheet did not open from Settings' };

    // 3. Check storage key and data
    const key = GAME.albumKey();
    const rawData = localStorage.getItem(key);
    const photosCount = ALBUM.list().length;

    return {
      success: true,
      albumTitle,
      storageKey: key,
      photosCount,
      hasRawData: rawData !== null
    };
  });

  console.log('Album test result:', albumTest);
  assert.strictEqual(albumTest.success, true);
  assert.strictEqual(albumTest.albumTitle, 'Альбом');

  console.log('Capturing screenshot of album and watering can...');
  await page.evaluate(() => {
    const HOME = window.__game.HOME;
    const S = window.__game.GAME.S;
    S.tree.stage = 0; // stage 0 (sapling)
    S.tree.water = 0;
    HOME.goTo('balcony', true);
    HOME.waterTree();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r40_watering_stage0.png' });

  await page.evaluate(() => {
    const HOME = window.__game.HOME;
    const S = window.__game.GAME.S;
    S.tree.stage = 4; // stage 4 (adult tree)
    S.tree.water = 0;
    HOME.waterTree();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r40_watering_stage4.png' });

  await page.evaluate(() => {
    window.__game.UI.openAlbum('photos');
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r40_album_view.png' });

  await browser.close();
  console.log('All tests completed successfully!');
})();
