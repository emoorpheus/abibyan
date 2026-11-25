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

// Round 66 TDD verification suite (iPhone 17 402x874 standalone profile)
(async () => {
  console.log('=== STARTING ROUND 66 VERIFICATION (iPhone 17 Variant 3 + Catch Fixes + Dasha End) ===');
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

  // Fix date at 2026-11-25 14:00 (real current day — Dasha 2026 birthday event must be ended)
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

  // Setup normal state (after gift/tut)
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
    G.UI.refresh();
  });
  await page.waitForTimeout(300);

  // 1. Dasha 2026 birthday event finished on 2026-11-25
  await check('1.1 Dasha 2026 birthday event is ended on 2026-11-25', async () => {
    const r = await page.evaluate(() => {
      const D = window.__game.DASHA;
      const dday = D.bday();
      const due = D.due();
      const decor = D.decor();
      const greeting = D.isGreeting();
      return { dday, due, decor, greeting };
    });
    assert.strictEqual(r.dday, null, 'DASHA.bday() must return null on 2026-11-25, got ' + JSON.stringify(r.dday));
    assert.strictEqual(r.due, null, 'DASHA.due() must return null');
    assert.strictEqual(r.decor, false, 'DASHA.decor() must be false');
    assert.strictEqual(r.greeting, false, 'DASHA.isGreeting() must be false');
    return r;
  });

  // 2. Variant 3 HUD around Dynamic Island + #topcap anti-blur + lower phone/shop
  await check('2.1 #topcap + Variant 3 HUD wings & #h-di capsule leave center open for ceiling/chandelier', async () => {
    const r = await page.evaluate(() => {
      const box = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height), bg: cs.backgroundColor, pos: cs.position };
      };
      const cv = document.getElementById('cv');
      return {
        ty: window.__game.HOME.topY(),
        cvH: cv.height,
        topcap: box('#topcap'),
        di: box('#h-di'),
        wl: box('#h-wl'),
        wr: box('#h-wr'),
        phone: box('#h-phone'),
        shop: box('#h-shop'),
        lvl: box('#h-lvl'),
        lvlCol: getComputedStyle(document.querySelector('#h-lvl b')).color,
        xp: box('#h-xp'),
        xpOut: getComputedStyle(document.getElementById('h-xp')).outlineWidth,
        coins: box('#h-coins'),
        food: box('#s-food'),
        grow: box('#h-grow'),
        ach: box('#h-ach'),
        set: box('#h-set'),
      };
    });
    assert(r.topcap && r.topcap.h >= 54 && r.topcap.t === 0, 'Missing or short #topcap: ' + JSON.stringify(r.topcap));
    assert(r.di && r.di.w >= 110 && r.di.b <= 78, 'Bad #h-di DI capsule: ' + JSON.stringify(r.di));
    assert(Math.abs((r.di.l + r.di.r) / 2 - 201) <= 6, '#h-di must be horizontally centered');
    assert(r.wl && r.wl.r <= r.di.l + 2 && r.wl.b <= 104, 'Left wing #h-wl overlaps DI or too tall: ' + JSON.stringify(r.wl));
    assert(r.wr && r.wr.l >= r.di.r - 2 && r.wr.b <= 104, 'Right wing #h-wr overlaps DI or too tall: ' + JSON.stringify(r.wr));
    // Chandelier spans xLog 68..112 (152..250 CSS px): verify HUD wings do NOT enter 148..254!
    assert(r.wl.r < 145 && r.wr.l > 258, `Wings must clear center chandelier x=152..250 (got wl.r=${r.wl.r}, wr.l=${r.wr.l})`);
    const m = (r.lvlCol || '').match(/\d+/g);
    assert(m && Number(m[0]) > 200 && Number(m[1]) > 180, '#h-lvl number must have high-contrast bright gold text on dark #h-di bg, got ' + r.lvlCol);
    // Phone & Shop sit cleanly in bottom corners above Home Indicator (y=840)
    assert(r.phone && r.phone.t >= 760 && r.phone.b <= 842 && r.phone.r <= 64, 'Bad #h-phone pos: ' + JSON.stringify(r.phone));
    assert(r.shop && r.shop.t >= 760 && r.shop.b <= 842 && r.shop.l >= 338, 'Bad #h-shop pos: ' + JSON.stringify(r.shop));
    assert(r.lvl && r.xp && r.coins, '#h-lvl, #h-xp, #h-coins must be visible inside #h-di');
    return r;
  });

  // 3. Compact ceiling: chandelier and room ceiling start right below Dynamic Island (not giant 67px wall!)
  await check('3.1 Compact ceiling & chandelier sit directly below Dynamic Island (HOME.topY <= 36)', async () => {
    await page.evaluate(() => window.__game.HOME.goTo('zal', true));
    await page.waitForTimeout(200);
    const r = await page.evaluate(() => {
      const H = window.__game.HOME;
      const ty = H.topY();
      const cv = document.getElementById('cv');
      const ctx = cv.getContext('2d');
      const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data);
      return {
        ty,
        chandTopScreenY: ty + 25,
        hdrPx: px(90, 12),
        ceilPx: px(90, ty + 6),
        chandGoldPx: px(84, ty + 28),
        floorBotPx: px(10, 390)
      };
    });
    assert(r.ty >= 26 && r.ty <= 36, 'HOME.topY() must be compact 26..36, got ' + r.ty);
    // Chandelier top CSS = chandTopScreenY * 2.2333 (~127px), cleanly below #h-di bottom (~72px)
    assert(r.chandTopScreenY * 2.2333 >= 105 && r.chandTopScreenY * 2.2333 <= 150, 'Chandelier top CSS out of expected band: ' + (r.chandTopScreenY * 2.2333));
    assert.strictEqual(r.hdrPx[0], 29, 'Header must be #1d1622');
    assert(r.ceilPx[0] > 180, 'Ceiling plaster right below #topcap must be light room ceiling, got ' + JSON.stringify(r.ceilPx));
    assert(r.floorBotPx[3] === 255 && r.floorBotPx[0] > 100, 'Bottom floor must reach y=390');
    return r;
  });

  // 4. Kitchen bottom carousel does not collide with bottom corner #h-phone / #h-shop
  await check('4.1 Kitchen carousel clears #h-phone and #h-shop + tapping #h-di opens profile', async () => {
    await page.evaluate(() => window.__game.HOME.goTo('kitchen', true));
    await page.waitForTimeout(200);
    const r = await page.evaluate(() => {
      const p = document.getElementById('h-phone').getBoundingClientRect();
      const s = document.getElementById('h-shop').getBoundingClientRect();
      const car = document.querySelector('#bar .carousel').getBoundingClientRect();
      document.getElementById('h-di').click();
      const hasProf = window.__game.UI.hasModal();
      const profTitle = document.querySelector('#modal h2') ? document.querySelector('#modal h2').textContent : null;
      document.querySelectorAll('[data-close]').forEach((el) => el.click());
      return { phoneR: Math.round(p.right), carL: Math.round(car.left), carR: Math.round(car.right), shopL: Math.round(s.left), hasProf, profTitle };
    });
    assert(r.carL >= r.phoneR + 16, `Kitchen carousel collides with #h-phone (${r.carL} vs ${r.phoneR})`);
    assert(r.shopL >= r.carR + 16, `Kitchen carousel collides with #h-shop (${r.shopL} vs ${r.carR})`);
    assert(r.hasProf && r.profTitle, 'Clicking #h-di must open Profile modal');
    return r;
  });

  // 5. #cv image-rendering pixelated (no crisp-edges override) & anti-loupe touchstart preventDefault in Catch
  await check('5.1 Catch blocks touchstart/touchend/touchmove default (anti-loupe) & uses crisp pixelated rendering', async () => {
    await page.evaluate(() => window.__game.MINI.start('catch', 1));
    await page.waitForTimeout(250);
    const r = await page.evaluate(() => {
      const cv = document.getElementById('cv');
      const pause = document.getElementById('g-pause');
      const ts = new Event('touchstart', { bubbles: true, cancelable: true });
      const tm = new Event('touchmove', { bubbles: true, cancelable: true });
      const te = new Event('touchend', { bubbles: true, cancelable: true });
      cv.dispatchEvent(ts);
      cv.dispatchEvent(tm);
      cv.dispatchEvent(te);
      const pts = new Event('touchstart', { bubbles: true, cancelable: true });
      pause.dispatchEvent(pts);
      const imgRend = getComputedStyle(cv).imageRendering;
      return {
        touchstartPrevented: ts.defaultPrevented,
        touchmovePrevented: tm.defaultPrevented,
        touchendPrevented: te.defaultPrevented,
        pauseTouchPrevented: pts.defaultPrevented,
        imgRend,
        ghTop: Math.round(document.getElementById('ghud').getBoundingClientRect().top),
      };
    });
    assert.strictEqual(r.touchstartPrevented, true, 'touchstart on #cv in catch must call preventDefault() to block iOS long-press loupe');
    assert.strictEqual(r.touchmovePrevented, true, 'touchmove on #cv must call preventDefault()');
    assert.strictEqual(r.touchendPrevented, true, 'touchend on #cv must call preventDefault() to block iOS double-tap zoom');
    assert.strictEqual(r.pauseTouchPrevented, false, 'touchstart on #g-pause button must NOT call preventDefault()');
    assert.strictEqual(r.imgRend, 'pixelated', 'Canvas image-rendering must be pixelated (not overridden by crisp-edges), got ' + r.imgRend);
    assert(r.ghTop >= 58, '#ghud must clear #topcap (>=58px), got ' + r.ghTop);
    return r;
  });

  // 6. Catch bottom floor / edge stripes bug fix during st.shake > 0
  await check('6.1 Catch renders zero transparent seams or stripes when coconut hits head (st.shake > 0)', async () => {
    const r = await page.evaluate(() => {
      const G = window.__game;
      const cv = document.getElementById('cv');
      const ctx = cv.getContext('2d');
      G.MINI.G.items.push({ type: 'coconut', x: G.MINI.G.m.x, y: 245, vy: 100, ph: 0 });
      window.advanceTime(25);
      let badFrames = 0;
      const badSamples = [];
      for (let f = 0; f < 24; f++) {
        G.MINI.render(ctx);
        const pts = [
          ['top', 90, 0], ['top1', 90, 1],
          ['seam318', 90, 318], ['seam319', 90, 319], ['seam320', 90, 320], ['seam321', 90, 321],
          ['bot', 90, cv.height - 1], ['edgeL_mid', 0, 315], ['edgeR_mid', 179, 315],
          ['edgeL_ext', 0, 350], ['edgeR_ext', 179, 350]
        ];
        const miss = pts.filter(([n, x, y]) => ctx.getImageData(x, y, 1, 1).data[3] < 255);
        if (miss.length) {
          badFrames++;
          if (badSamples.length < 3) badSamples.push({ f, miss: miss.map(([n, x, y]) => [n, Array.from(ctx.getImageData(x, y, 1, 1).data)]) });
        }
      }
      G.MINI.home();
      return { ch: cv.height, badFrames, badSamples };
    });
    assert.strictEqual(r.badFrames, 0, 'Found transparent seam/edge pixels during catch shake: ' + JSON.stringify(r.badSamples));
    return r;
  });

  // 7. Capture clean post-toast screenshots of all 5 rooms + verify desktop 1280x800 layout
  await page.evaluate(() => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; });
  for (const rm of ['zal', 'kitchen', 'bath', 'hall', 'balcony']) {
    await page.evaluate((id) => window.__game.HOME.goTo(id, true), rm);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r66_live_${rm}.png` });
  }

  await check('7.1 Desktop 1280x800 (.is-desktop) hides #topcap and renders 2-row HUD cleanly', async () => {
    const dc = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
    const dp = await dc.newPage();
    dp.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('desktop: ' + m.text()); });
    dp.on('pageerror', (e) => consoleErrors.push('desktop: ' + e.message));
    await dp.goto(targetUrl, { waitUntil: 'networkidle' });
    await dp.waitForTimeout(450);
    await dp.evaluate(() => {
      const G = window.__game;
      G.GAME.S.tut = G.DATA.TUT.length;
      G.GAME.S.phone = true;
      G.GAME.S.coins = 290;
      if (G.DASHA.giftOn()) G.DASHA.openGift();
      G.DASHA.abort();
      window.advanceTime(4500);
      document.querySelectorAll('[data-close]').forEach((el) => el.click());
      const t = document.getElementById('toasts'); if (t) t.innerHTML = '';
      G.UI.refresh();
    });
    await dp.waitForTimeout(250);
    const dr = await dp.evaluate(() => {
      const box = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height), disp: getComputedStyle(el).display };
      };
      return {
        isDesktop: document.documentElement.classList.contains('is-desktop') || document.body.classList.contains('is-desktop'),
        topcap: box('#topcap'),
        di: box('#h-di'),
        wl: box('#h-wl'),
        wr: box('#h-wr'),
        phone: box('#h-phone'),
        shop: box('#h-shop'),
        kg: box('#h-kg'),
      };
    });
    await dp.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r66_live_desktop.png' });
    await dc.close();
    assert.strictEqual(dr.isDesktop, true, 'Expected .is-desktop');
    assert.strictEqual(dr.topcap.disp, 'none', '#topcap must be hidden on desktop');
    assert(dr.di.r <= dr.phone.l + 1 && dr.phone.r <= dr.shop.l + 1, 'Desktop Row 1 items overlap: ' + JSON.stringify(dr));
    assert(dr.wl.t >= dr.di.b && dr.wl.r <= dr.wr.l, 'Desktop Row 2 items overlap or wrap badly: ' + JSON.stringify(dr));
    assert(dr.kg.w > 0, 'Desktop #h-kg must stay visible');
    return dr;
  });

  await check('0.0 Zero console/page errors', async () => {
    assert.deepStrictEqual(consoleErrors, []);
    return consoleErrors;
  });

  console.log(`\nSummary: ${passed}/${passed + failed} passed, ${failed} failed`);
  await browser.close();
  srv.close();
  process.exit(failed > 0 ? 1 : 0);
})();
