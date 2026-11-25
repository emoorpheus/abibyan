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
  console.log('=== STARTING ROUND 68 VERIFICATION (Compact Single-Row Sharp HUD at y=82..110px) ===');
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

  // 1. Compact single-row HUD sits >= 80px (below DI edge blur), total #topcap <= 116px
  await check('1.1 Compact single-row top HUD (y=82..110px) with all 5 buttons & 4 stats in 1 clean bar', async () => {
    const r = await page.evaluate(() => {
      const box = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height), disp: cs.display };
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
        phone: box('#h-phone'),
        shop: box('#h-shop'),
        wr: box('#h-wr'),
        grow: box('#h-grow'),
        ach: box('#h-ach'),
        set: box('#h-set'),
      };
    });
    assert(r.topcap && r.topcap.t === 0 && r.topcap.h >= 108 && r.topcap.h <= 116, '#topcap must be compact 108..116px: ' + JSON.stringify(r.topcap));
    assert(r.hud && r.hud.t >= 80 && r.hud.b <= r.topcap.b + 1, 'HUD out of band: ' + JSON.stringify(r.hud));
    assert(r.di.r <= r.wl.l && r.wl.r <= r.phone.l && r.phone.r <= r.shop.l && r.shop.r <= r.wr.l, 'Row items collide or wrap: ' + JSON.stringify(r));
    assert(r.wr.r <= 398, 'Right edge clipped: ' + r.wr.r);
    assert(r.ty >= 48 && r.ty <= 52, 'HOME.topY() must be compact 48..52: ' + r.ty);
    // Also check overflow resilience with 6-digit coins (100000)
    const wideCoins = await page.evaluate(() => {
      const sp = document.querySelector('#h-coins span');
      const orig = sp.textContent;
      sp.textContent = '100000';
      const diR = Math.round(document.getElementById('h-di').getBoundingClientRect().right);
      const wlL = Math.round(document.getElementById('h-wl').getBoundingClientRect().left);
      const wlR = Math.round(document.getElementById('h-wl').getBoundingClientRect().right);
      const phL = Math.round(document.getElementById('h-phone').getBoundingClientRect().left);
      sp.textContent = orig;
      return { diR, wlL, wlR, phL };
    });
    assert(wideCoins.diR <= wideCoins.wlL && wideCoins.wlR <= wideCoins.phL, '6-digit coins overflow into stats: ' + JSON.stringify(wideCoins));
    return { r, wideCoins };
  });

  // 2. Room ceiling starts cleanly right below #topcap
  await check('2.1 Room ceiling & chandelier start cleanly below compact #topcap', async () => {
    await page.evaluate(() => window.__game.HOME.goTo('zal', true));
    await page.waitForTimeout(250);
    const r = await page.evaluate(() => {
      const H = window.__game.HOME;
      const cv = document.getElementById('cv');
      const ctx = cv.getContext('2d');
      const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data);
      const ty = H.topY();
      return { ty, hdrPx: px(90, 20), ceilPx: px(30, ty + 4), floorBotPx: px(90, cv.height - 1) };
    });
    assert(r.hdrPx[0] < 45 && r.hdrPx[1] < 40, 'Header must be #1d1622');
    assert(r.ceilPx[0] > 200, 'Ceiling plaster below #topcap must be light');
    assert(r.floorBotPx[0] > 120, 'Floor must extend to bottom');
    return r;
  });

  // 3. Kitchen bottom bar + sheet + mini-game #hud.hidden check
  await check('3.1 Kitchen bar clears feet & #hud hides properly during sheets & mini-games', async () => {
    await page.evaluate(() => window.__game.HOME.goTo('kitchen', true));
    await page.waitForTimeout(250);
    const k = await page.evaluate(() => {
      const u = window.__game.APP.lay.u;
      const bar = document.getElementById('bar').getBoundingClientRect();
      const lab = document.getElementById('c-lab').getBoundingClientRect();
      const feetCss = (window.__game.HOME.mk.y + window.__game.HOME.topY()) * u;
      return { barB: Math.round(bar.bottom), labTop: Math.round(lab.top), feetCss: Math.round(feetCss) };
    });
    assert(874 - k.barB >= 34 && k.labTop >= k.feetCss, JSON.stringify(k));

    await page.evaluate(() => window.__game.UI.openGrow());
    await page.waitForTimeout(350);
    const sh = await page.evaluate(() => ({
      hudDisp: getComputedStyle(document.getElementById('hud')).display,
      capH: Math.round(document.getElementById('topcap').getBoundingClientRect().height),
    }));
    await page.evaluate(() => window.__game.UI.closeSheet());
    assert.strictEqual(sh.hudDisp, 'none');
    assert(sh.capH >= 78 && sh.capH <= 84);

    await page.evaluate(() => window.__game.MINI.start('catch', 1));
    await page.waitForTimeout(250);
    const gm = await page.evaluate(() => ({
      hudDisp: getComputedStyle(document.getElementById('hud')).display,
      capH: Math.round(document.getElementById('topcap').getBoundingClientRect().height),
      ghTop: Math.round(document.getElementById('ghud').getBoundingClientRect().top),
    }));
    assert.strictEqual(gm.hudDisp, 'none');
    assert(gm.capH >= 78 && gm.capH <= 84 && gm.ghTop >= 80);
    await page.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r68_live_catch.png' });
    await page.evaluate(() => window.__game.MINI.home());
    return { k, sh, gm };
  });

  // 4. Screenshots of all 5 rooms + sheet + desktop
  await page.evaluate(() => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; });
  for (const rm of ['zal', 'kitchen', 'bath', 'hall', 'balcony']) {
    await page.evaluate((id) => window.__game.HOME.goTo(id, true), rm);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r68_live_${rm}.png` });
  }
  await page.evaluate(() => { window.__game.HOME.goTo('kitchen', true); window.__game.UI.openGrow(); });
  await page.waitForTimeout(350);
  await page.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r68_live_sheet.png' });
  await page.evaluate(() => window.__game.UI.closeSheet());

  await check('0.0 Zero console/page errors', async () => {
    assert.deepStrictEqual(consoleErrors, []);
    return consoleErrors;
  });

  console.log(`\nSummary: ${passed}/${passed + failed} passed, ${failed} failed`);
  await browser.close();
  srv.close();
  process.exit(failed > 0 ? 1 : 0);
})();
