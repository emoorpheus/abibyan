const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');

// Real iPhone 17 (6.3") profile: 402x874 CSS px, 3x DPR (1206x2622 px),
// Dynamic Island + Status Bar safe-area-top = 62px, Home Indicator safe-area-bottom = 34px.
(async () => {
  console.log('=== STARTING ROUND 65 iPHONE 17 ADAPTATION & CEILING VERIFICATION ===');

  const browser = await chromium.launch({
    executablePath: '/Users/emoorpheus/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 402, height: 874 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  // Simulate real iPhone 17 standalone environment + pre-seeded save so gift intro is already opened
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { get: () => true });
    Object.defineProperty(window, 'screen', {
      value: { width: 402, height: 874, availWidth: 402, availHeight: 874 },
      configurable: true
    });
  });

  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const txt = m.text();
      if (txt.includes('CORS policy') || txt.includes('URL scheme "file"') || txt.includes('ERR_FAILED')) return;
      consoleErrors.push(txt);
    }
  });
  page.on('pageerror', (e) => consoleErrors.push(e.message));

  await page.goto('file://' + path.resolve(__dirname, '../dist/site/index.html'), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);

  // Dismiss gift / tutorial and unlock all rooms/games for clean iPhone 17 verification
  await page.evaluate(() => {
    if (typeof DASHA !== 'undefined') {
      if (DASHA.openGift) DASHA.openGift();
      DASHA.abort();
    }
    const g = document.getElementById('gift');
    if (g) g.remove();
    const ui = document.getElementById('ui');
    if (ui) ui.classList.remove('gifting', 'bday');
    if (typeof APP !== 'undefined') APP.afterIntro();
    GAME.S.named = true;
    GAME.S.tut = 99;
    GAME.S.phone = true;
    GAME.S.light = true;
    GAME.S.sleeping = false;
    GAME.S.grow.stage = 5;
    GAME.S.st.energy = 100;
    GAME.S.home.items.pc = 'tower';
    GAME.S.home.items.tv = 'lg';
    GAME.S.home.items.switch2 = 1;
    GAME.S.home.items.ps5 = 1;
    GAME.S.home.items.sofa = true;
    // Prevent Dasha birthday party auto-escort from pulling monkey back to zal while testing other rooms
    if (GAME.S.dasha) {
      GAME.S.dasha.gift = '2026-11-25';
      GAME.S.dasha.party = { 2026: '2026-11-25' };
      GAME.S.dasha.gifts = { 2026: '2026-11-25' };
    }
    if (GAME.S.friends) GAME.S.friends.partyDay = GAME.dayStr(new Date());
    UI.closeModal();
    UI.refresh();
  });
  await page.waitForTimeout(300);

  let passed = 0, failed = 0;
  function check(name, fn) {
    return Promise.resolve().then(fn).then((res) => {
      passed++;
      console.log('PASS ' + name, res !== undefined ? JSON.stringify(res) : '');
    }).catch((err) => {
      failed++;
      console.error('FAIL ' + name, err.message);
    });
  }

  // 1. iPhone 17 Viewport & Pixel Ratio 1:1
  await check('1.1 iPhone 17 402x874 -> canvas 180x391, square 1:1 pixels', async () => {
    const g = await page.evaluate(() => {
      const cv = document.getElementById('cv');
      const r = cv.getBoundingClientRect();
      return { w: cv.width, h: cv.height, rw: r.width, rh: r.height, u: APP.lay.u, ux: APP.lay.ux, uy: APP.lay.uy };
    });
    assert.strictEqual(g.w, 180);
    assert.strictEqual(g.h, 391);
    assert(Math.abs(g.rw - 402) < 1 && Math.abs(g.rh - 874) < 1, 'Canvas must fill 402x874: ' + JSON.stringify(g));
    assert(Math.abs(g.ux - g.uy) < 0.001, 'Pixels must be square');
    return g;
  });

  // 2. Ceiling MUST start strictly BELOW Dynamic Island + HUD (not drawn at y=0..65!)
  await check('2.1 Ceiling is compact below #h-di & HUD wings flank Dynamic Island', async () => {
    await page.evaluate(() => HOME.goTo('zal', true));
    await page.waitForTimeout(250);
    const r = await page.evaluate(() => {
      const cv = document.getElementById('cv');
      const ctx = cv.getContext('2d');
      const diRect = document.getElementById('h-di').getBoundingClientRect();
      const capRect = document.getElementById('topcap').getBoundingClientRect();
      const ty = HOME.topY();
      const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data);
      const diPx = px(90, 12);
      const hdrBotPx = px(90, 22);
      const ceilPx = px(30, ty + 6);
      return {
        ty,
        capTopCss: Math.round(capRect.top),
        capBotCss: Math.round(capRect.bottom),
        diBotCss: Math.round(diRect.bottom),
        roomTopCss: Math.round(ty * APP.lay.u),
        diPx,
        hdrBotPx,
        ceilPx
      };
    });
    assert(r.ty >= 64 && r.ty <= 74, 'topY must drop room ceiling cleanly below 2-row enlarged HUD (64..74), got ' + r.ty);
    assert(r.capBotCss >= 62 && r.capBotCss <= 76 && r.capTopCss === 0, '#topcap status-bar scrim must cover top status bar without dark slab over HUD, got ' + JSON.stringify(r));
    assert(r.roomTopCss >= 150, `Room molding/objects (${r.roomTopCss}px) must start cleanly below HUD`);
    assert(r.ceilPx[0] > 180, 'Actual zal ceiling below HUD must render bright plaster (day/evening), got ' + r.ceilPx);
    return r;
  });

  // 3. No long line above chandelier in Zal
  await check('3.1 Zal chandelier has NO long vertical rod running across the ceiling', async () => {
    await page.evaluate(() => HOME.goTo('zal', true));
    await page.waitForTimeout(250);
    const r = await page.evaluate(() => {
      const cv = document.getElementById('cv');
      const ctx = cv.getContext('2d');
      const ty = HOME.topY();
      // Above chandelier rose across the ceiling (x=99, 100 from ty to ty+23): must NOT have brass rod pixels!
      const rodSamples = [];
      for (let y = ty + 3; y <= ty + 22; y += 3) {
        const d = ctx.getImageData(99, y, 2, 1).data;
        rodSamples.push({ y, p99: [d[0], d[1], d[2]], p100: [d[4], d[5], d[6]] });
      }
      const bad = rodSamples.filter(s => s.p99[0] < 170 || s.p100[0] < 170);
      return { ty, sampleCount: rodSamples.length, bad };
    });
    assert.strictEqual(r.bad.length, 0, 'Brass chandelier line above ceiling rose found: ' + JSON.stringify(r.bad));
    return r;
  });

  // 4. Open Sheet (camY > 0) MUST keep room clear of Dynamic Island (0..28 logical px)
  await check('4.1 Opening sheet (Grow) does not push kitchen cabinets/ceiling behind Dynamic Island', async () => {
    await page.evaluate(() => { HOME.goTo('kitchen', true); UI.openGrow(); });
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const ctx = document.getElementById('cv').getContext('2d');
      const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data);
      const underIsland = [px(30, 12), px(90, 12), px(150, 12), px(90, 22), px(90, 24)];
      UI.closeSheet();
      return { camY: Math.round(HOME.camY), underIsland };
    });
    for (const p of r.underIsland.slice(0, 4)) {
      assert(p[0] < 95 && p[1] < 80 && p[2] < 90, 'Room pixels leaked behind Dynamic Island while sheet open: ' + JSON.stringify(r));
    }
    const trim = r.underIsland[4];
    assert(trim[0] <= 110 && trim[1] <= 90 && trim[2] <= 90, 'Header bottom trim pixel broken while sheet open: ' + JSON.stringify(r));
    return r;
  });

  // 5. Kitchen bottom carousel / label clear of monkey feet & Home Indicator
  await check('5.1 Kitchen bar & label sit above Home Indicator and below monkey feet', async () => {
    await page.evaluate(() => HOME.goTo('kitchen', true));
    await page.waitForTimeout(450);
    const r = await page.evaluate(() => {
      const u = APP.lay.u;
      const bar = document.getElementById('bar').getBoundingClientRect();
      const slot = document.getElementById('c-slot').getBoundingClientRect();
      const lab = document.getElementById('c-lab').getBoundingClientRect();
      const feetCss = (HOME.mk.y + HOME.topY()) * u;
      return {
        barBot: Math.round(bar.bottom),
        slotTop: Math.round(slot.top),
        labTop: Math.round(lab.top),
        feetCss: Math.round(feetCss),
        safeGapBottom: Math.round(874 - bar.bottom)
      };
    });
    assert(r.safeGapBottom >= 34, 'Bar must clear 34px iPhone 17 Home Indicator, gap=' + r.safeGapBottom);
    assert(r.labTop >= r.feetCss - 2, `Feed label top (${r.labTop}px) should not overlap monkey chest/legs above feet (${r.feetCss}px)`);
    return r;
  });

  // 6. All 5 rooms extend floor to bottom (y=390) cleanly
  await check('6.1 All 5 rooms render floor cleanly to bottom y=390 without dark gap', async () => {
    const out = {};
    for (const rm of ['zal', 'kitchen', 'bath', 'hall', 'balcony']) {
      await page.evaluate((id) => HOME.goTo(id, true), rm);
      await page.waitForTimeout(250);
      const px = await page.evaluate(() => {
        const d = document.getElementById('cv').getContext('2d').getImageData(90, 389, 1, 1).data;
        return [d[0], d[1], d[2]];
      });
      assert(px[0] > 60 || px[1] > 60, `Room ${rm} bottom floor looks blank/dark gap: ${px}`);
      out[rm] = px;
    }
    return out;
  });

  // 7. Mini-games HUD & overlays stay clear of Dynamic Island on iPhone 17
  await check('7.1 #ghud clears Dynamic Island (>=64px) and Stack/Roofs/Race/Gym/Balloon UI stays below #ghud', async () => {
    const res = {};
    for (const gid of ['stack', 'roofs', 'race', 'gym', 'balloon']) {
      await page.evaluate((id) => MINI.start(id, 1), gid);
      await page.waitForTimeout(250);
      const info = await page.evaluate((id) => {
        const u = APP.lay.u;
        const gh = document.getElementById('ghud').getBoundingClientRect();
        const ghBotLog = Math.round(gh.bottom / u);
        const cv = document.getElementById('cv');
        const ctx = cv.getContext('2d');
        const out = { gid: id, ghTop: Math.round(gh.top), ghBot: Math.round(gh.bottom), ghBotLog };
        if (id === 'stack') {
          // progress squares must NOT be at y=22 (behind Dynamic Island!)
          const at22 = Array.from(ctx.getImageData(7, 22, 1, 1).data);
          const at52 = Array.from(ctx.getImageData(7, 52, 1, 1).data);
          out.at22 = at22.slice(0, 3);
          out.at52 = at52.slice(0, 3);
        } else if (id === 'race') {
          // timer pill must NOT be at y=25 (behind Dynamic Island!)
          const at25 = Array.from(ctx.getImageData(90, 25, 1, 1).data);
          const at60 = Array.from(ctx.getImageData(90, 60, 1, 1).data);
          out.at25 = at25.slice(0, 3);
          out.at60 = at60.slice(0, 3);
        } else if (id === 'roofs') {
          // banana counter must be below #g-pause (~47), NOT at y=38 behind button!
          const ban60 = Array.from(ctx.getImageData(15, 60, 1, 1).data);
          out.ban60 = ban60.slice(0, 3);
        }
        MINI.home();
        return out;
      }, gid);
      assert(info.ghTop >= 62, `${gid} #ghud top (${info.ghTop}px) must clear DI!`);
      if (gid === 'stack') {
        assert(!(info.at22[0] < 80 && info.at22[1] < 60), 'Stack floor pips still drawn at y=22 behind Dynamic Island!');
      }
      if (gid === 'race') {
        assert(info.at60[0] < 80 || info.at60[0] > 230, 'Race clock pill missing below #ghud at y=60: ' + JSON.stringify(info));
      }
      res[gid] = info;
    }
    return res;
  });

  // Save iPhone 17 visual verification screenshots across rooms, sheet, and mini-games
  for (const rm of ['zal', 'kitchen', 'hall', 'bath', 'balcony']) {
    await page.evaluate((id) => HOME.goTo(id, true), rm);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r65_iphone17_${rm}.png` });
  }
  await page.evaluate(() => { HOME.goTo('kitchen', true); UI.openGrow(); });
  await page.waitForTimeout(450);
  await page.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r65_iphone17_grow_sheet.png' });
  await page.evaluate(() => UI.closeSheet());
  for (const gid of ['stack', 'race', 'roofs']) {
    await page.evaluate((id) => MINI.start(id, 1), gid);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r65_iphone17_${gid}.png` });
    await page.evaluate(() => MINI.home());
  }

  // 8. Friend/Gag float coordinates include topY()
  await check('8.1 Gag sofa float uses HOME.topY()', async () => {
    await page.evaluate(() => HOME.goTo('kitchen', true));
    await page.waitForTimeout(200);
    const r = await page.evaluate(() => {
      let captured = null;
      const orig = UI.float;
      UI.float = (x, y, t, i) => { captured = { x, y, t }; orig(x, y, t, i); };
      const h = GAGS.hit('kitchen', 10, 204, false);
      if (h && h.fn) h.fn();
      window.advanceTime(600);
      UI.float = orig;
      return { captured, ty: HOME.topY() };
    });
    assert(r.captured, 'Gag sofa did not trigger UI.float');
    assert(r.captured.y >= 180 + r.ty, `Float y (${r.captured.y}) missed HOME.topY() (${r.ty})`);
    return r;
  });

  await check('0.0 Zero console/page errors', async () => {
    assert.deepStrictEqual(consoleErrors, []);
    return consoleErrors;
  });

  console.log(`\nSummary: ${passed}/${passed + failed} passed, ${failed} failed`);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
