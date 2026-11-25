'use strict';
const { chromium } = require('/Users/emoorpheus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const SITE_DIR = path.join(__dirname, '..', 'dist', 'site');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
};

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const urlPath = (req.url || '/').split('?')[0];
      const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
      const fp = path.join(SITE_DIR, rel);
      if (!fp.startsWith(SITE_DIR) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
        res.writeHead(404); res.end('Not found'); return;
      }
      const ext = path.extname(fp);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      resolve({ srv, url: `http://127.0.0.1:${addr.port}/index.html` });
    });
  });
}

(async () => {
  console.log('=== STARTING ROUND 70 VERIFICATION (1.5-2x Enlarged HUD + Seamless Balcony Background) ===');
  const { srv, url: targetUrl } = await startServer();

  const browser = await chromium.launch({
    executablePath: '/Users/emoorpheus/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 402, height: 874 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    const RealDate = Date;
    const fixed = new RealDate(2026, 10, 25, 14, 0, 0).getTime();
    const t0 = RealDate.now();
    class FakeDate extends RealDate {
      constructor(...a) { if (a.length) super(...a); else super(fixed + (RealDate.now() - t0)); }
      static now() { return fixed + (RealDate.now() - t0); }
    }
    window.Date = FakeDate;
    try { Object.defineProperty(navigator, 'standalone', { get: () => true, configurable: true }); } catch (e) {}
  });

  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(e.message));

  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  let passed = 0, failed = 0;
  const check = async (name, fn) => {
    try {
      const res = await fn();
      console.log(`PASS ${name}`, res !== undefined ? JSON.stringify(res) : '');
      passed++;
    } catch (e) {
      console.error(`FAIL ${name}:`, e.message);
      failed++;
    }
  };

  await page.evaluate(() => {
    const G = window.__game;
    const s = G.GAME.S;
    s.coins = 290;
    s.phone = true;
    s.tut = G.DATA.TUT.length;
    s.grow.stage = 3;
    s.st.food = 75; s.st.fun = 86; s.st.energy = 80; s.st.clean = 90;
    s.home.items.tv = 'hiper';
    s.home.items.pc = 'tower';
    s.home.items.ps5 = 1;
    s.home.items.guitar = 1;
    if (G.DASHA.giftOn()) G.DASHA.openGift();
    G.DASHA.abort();
    window.advanceTime(4500);
    document.querySelectorAll('[data-close]').forEach((el) => el.click());
    const t = document.getElementById('toasts'); if (t) t.innerHTML = '';
    G.UI.refresh();
  });
  await page.waitForTimeout(300);

  // 1. Enlarged 1.5-2x 2-row HUD (y=64..156px) cleanly fits with zero collisions even at 100000 coins
  await check('1.1 Enlarged 2-row HUD icons (44px buttons/32px imgs, 40px stats/26px imgs, 38px lvl, 46px xp)', async () => {
    const r = await page.evaluate(() => {
      const box = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height), disp: cs.display, borderB: cs.borderBottomWidth };
      };
      return {
        ty: window.__game.HOME.topY(),
        topcap: box('#topcap'),
        hud: box('#hud'),
        di: box('#h-di'),
        lvl: box('#h-lvl'),
        xp: box('#h-xp'),
        coins: box('#h-coins'),
        wl: box('#h-wl'),
        stat: box('#s-food'),
        statImg: box('#s-food img'),
        phone: box('#h-phone'),
        phoneImg: box('#h-phone img'),
        shop: box('#h-shop'),
        wr: box('#h-wr'),
        grow: box('#h-grow'),
        ach: box('#h-ach'),
        set: box('#h-set'),
      };
    });
    assert(r.hud.t >= 62 && r.hud.t <= 68, 'HUD must sit near DI at 62..68px, got ' + r.hud.t);
    assert(r.phone.w >= 43 && r.grow.w >= 43 && r.set.w >= 43, 'Buttons must be enlarged (>=43px), got ' + r.phone.w);
    assert(r.phoneImg.w >= 30 && r.statImg.w >= 24, 'Icons inside buttons/stats must be enlarged (>=30px / >=24px)');
    assert(r.stat.w >= 38 && r.lvl.w >= 36 && r.xp.w >= 44 && r.coins.h >= 32, 'Stats/lvl/xp/coins must be enlarged');
    assert(r.di.r <= r.phone.l && r.phone.r <= r.shop.l && r.shop.r <= 398, 'Row 1 collision: ' + JSON.stringify(r));
    assert(r.wl.r <= r.wr.l && r.wr.r <= 398, 'Row 2 collision: ' + JSON.stringify(r));
    assert(r.topcap.borderB === '0px', '#topcap must NOT have harsh border-bottom');
    assert(r.topcap.h <= 74, '#topcap scrim must stay tight to top clock, NOT dim HUD: ' + r.topcap.h);
    assert(r.ty >= 68 && r.ty <= 74, 'HOME.topY() must be 68..74, got ' + r.ty);

    const wideCoins = await page.evaluate(() => {
      const sp = document.querySelector('#h-coins span');
      const orig = sp.textContent;
      sp.textContent = '100000';
      const diR = Math.round(document.getElementById('h-di').getBoundingClientRect().right);
      const phL = Math.round(document.getElementById('h-phone').getBoundingClientRect().left);
      sp.textContent = orig;
      return { diR, phL };
    });
    assert(wideCoins.diR <= wideCoins.phL, '6-digit coins overflow into Row 1 buttons: ' + JSON.stringify(wideCoins));
    return { r, wideCoins };
  });

  // 2. Balcony background matches ceiling planks 100% seamlessly (zero color difference or dark stripe at topY)
  await check('2.1 Balcony top HUD background color matches balcony cedar ceiling identically without dark seam', async () => {
    await page.evaluate(() => window.__game.HOME.goTo('balcony', true));
    await page.waitForTimeout(250);
    const bal = await page.evaluate(() => {
      const cv = document.getElementById('cv');
      const ctx = cv.getContext('2d');
      const ty = window.__game.HOME.topY();
      const rowMean = (y0, y1) => {
        const d = ctx.getImageData(0, y0, 180, y1 - y0).data;
        let r = 0, g = 0, b = 0, n = d.length / 4;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
        return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
      };
      return {
        ty,
        topBand: rowMean(10, 35),
        midBand: rowMean(40, ty),
        ceilBand: rowMean(ty + 2, ty + 16),
        ceilBg: getComputedStyle(document.documentElement).getPropertyValue('--ceil-bg').trim(),
        scrim: getComputedStyle(document.documentElement).getPropertyValue('--hud-scrim').trim(),
      };
    });
    const diff = Math.abs(bal.topBand[0] - bal.ceilBand[0]) + Math.abs(bal.topBand[1] - bal.ceilBand[1]) + Math.abs(bal.topBand[2] - bal.ceilBand[2]);
    const midDiff = Math.abs(bal.midBand[0] - bal.ceilBand[0]) + Math.abs(bal.midBand[1] - bal.ceilBand[1]) + Math.abs(bal.midBand[2] - bal.ceilBand[2]);
    assert(diff <= 8 && midDiff <= 8, 'Balcony top HUD wood must match ceiling planks identically (diff=' + diff + ', midDiff=' + midDiff + '): ' + JSON.stringify(bal));
    assert.strictEqual(bal.ceilBg, '#5a3422', '--ceil-bg must match #5a3422 cedar wood');
    return bal;
  });

  // 3. Lower floor walking still reaches bottom of floor
  await check('3.1 Tap on lower floor in zal walks monkey down past y >= 295 (bottom of screen)', async () => {
    await page.evaluate(() => window.__game.HOME.goTo('zal', true));
    await page.waitForTimeout(250);
    await page.mouse.click(200, 820);
    await page.waitForTimeout(80);
    const walking = await page.evaluate(() => window.__game.HOME.walking);
    assert.strictEqual(walking, true, 'Tapping bottom floor must trigger walking');
    await page.evaluate(() => window.advanceTime(3000));
    await page.waitForTimeout(120);
    const endY = await page.evaluate(() => Math.round(window.__game.HOME.mk.y));
    assert(endY >= 295, `Monkey must reach lower floor (y>=295), got ${endY}`);

    await page.evaluate(() => window.__game.HOME.goTo('kitchen', true));
    await page.waitForTimeout(200);
    await page.mouse.click(270, 766);
    await page.evaluate(() => window.advanceTime(2500));
    await page.waitForTimeout(100);
    const kWalk = await page.evaluate(() => ({
      mkY: Math.round(window.__game.HOME.mk.y),
      barTopCss: Math.round(document.getElementById('bar').getBoundingClientRect().top),
      feetCss: Math.round((window.__game.HOME.mk.y + window.__game.HOME.topY()) * window.__game.APP.lay.u),
    }));
    assert(kWalk.mkY >= 272 && kWalk.feetCss <= kWalk.barTopCss + 4, 'Kitchen walk must go down near #bar cleanly: ' + JSON.stringify(kWalk));
    return { endY, kWalk };
  });

  // 4. Version 70 check, sheets & mini-game HUD
  await check('4.1 Sheet hides #hud, mini-game #ghud enlarged cleanly, and Settings shows Version 70', async () => {
    await page.evaluate(() => window.__game.HOME.goTo('kitchen', true));
    await page.evaluate(() => window.__game.UI.openGrow());
    await page.waitForTimeout(350);
    const sh = await page.evaluate(() => getComputedStyle(document.getElementById('hud')).display);
    assert.strictEqual(sh, 'none');
    await page.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r70_live_sheet.png' });
    await page.evaluate(() => window.__game.UI.closeSheet());

    await page.evaluate(() => window.__game.MINI.start('catch', 1));
    await page.waitForTimeout(250);
    const gm = await page.evaluate(() => ({
      hudDisp: getComputedStyle(document.getElementById('hud')).display,
      ghTop: Math.round(document.getElementById('ghud').getBoundingClientRect().top),
      pauseW: Math.round(document.getElementById('g-pause').getBoundingClientRect().width),
    }));
    assert.strictEqual(gm.hudDisp, 'none');
    assert(gm.ghTop >= 62 && gm.ghTop <= 68 && gm.pauseW >= 38);
    await page.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r70_live_catch.png' });
    await page.evaluate(() => window.__game.MINI.home());

    await page.evaluate(() => window.__game.UI.openSettings());
    await page.waitForTimeout(200);
    const verTxt = await page.evaluate(() => document.querySelector('.mbox').textContent);
    await page.evaluate(() => window.__game.UI.closeModal());
    assert(verTxt.includes('Версия 70'), 'Settings must show Версия 70');
    return gm;
  });

  // 5. Save screenshots of all 5 rooms
  await page.evaluate(() => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; });
  for (const rm of ['balcony', 'zal', 'kitchen', 'bath', 'hall']) {
    await page.evaluate((id) => window.__game.HOME.goTo(id, true), rm);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r70_live_${rm}.png` });
  }

  await check('0.0 Zero console/page errors', async () => {
    assert.deepStrictEqual(consoleErrors, []);
    return consoleErrors;
  });

  console.log(`\nSummary: ${passed}/${passed + failed} passed, ${failed} failed`);
  await browser.close();
  srv.close();
  process.exit(failed > 0 ? 1 : 0);
})();
