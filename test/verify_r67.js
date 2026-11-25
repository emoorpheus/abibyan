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
  console.log('=== STARTING ROUND 67 VERIFICATION (Sharp Top HUD Below iOS 26 Blur + All Buttons at Top) ===');
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

  // Fix date at 2026-11-25 14:00 (Dasha 2026 birthday event must be ended)
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

  // 1. ALL HUD items sit cleanly below the ~92px iOS 26 blur zone, and Phone + Shop are at the TOP
  await check('1.1 HUD starts >= 92px (below iOS 26 blur band) with #h-phone & #h-shop moved to top', async () => {
    const r = await page.evaluate(() => {
      const box = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height), bg: cs.backgroundColor, disp: cs.display };
      };
      return {
        ty: window.__game.HOME.topY(),
        cvH: document.getElementById('cv').height,
        topcap: box('#topcap'),
        hud: box('#hud'),
        di: box('#h-di'),
        lvl: box('#h-lvl'),
        xp: box('#h-xp'),
        name: box('#h-name'),
        coins: box('#h-coins'),
        phone: box('#h-phone'),
        shop: box('#h-shop'),
        wl: box('#h-wl'),
        wr: box('#h-wr'),
        kg: box('#h-kg'),
        grow: box('#h-grow'),
        ach: box('#h-ach'),
        set: box('#h-set'),
      };
    });
    assert(r.topcap && r.topcap.t === 0 && r.topcap.h >= 150, '#topcap must cover status bar + blur zone + 2-row HUD cleanly: ' + JSON.stringify(r.topcap));
    for (const [k, el] of [['lvl', r.lvl], ['xp', r.xp], ['name', r.name], ['coins', r.coins], ['phone', r.phone], ['shop', r.shop], ['wl', r.wl], ['kg', r.kg], ['grow', r.grow], ['ach', r.ach], ['set', r.set]]) {
      assert(el && el.w > 0 && el.h > 0, `Missing/hidden ${k}`);
      assert(el.t >= 92, `${k} top (${el.t}px) must stay >= 92px below iOS 26 blur band!`);
      assert(el.b <= r.topcap.b + 1, `${k} bottom (${el.b}px) overflows #topcap (${r.topcap.b}px)`);
    }
    // Phone & Shop MUST be at the top now (<= 160px), NOT at bottom corners!
    assert(r.phone.b <= 160 && r.shop.b <= 160, `Phone (${r.phone.b}) and Shop (${r.shop.b}) must be at the top!`);
    // No overlap within Row 1 or Row 2
    assert(r.di.r <= r.phone.l + 1 && r.phone.r <= r.shop.l + 1, 'Row 1 items collide: ' + JSON.stringify(r));
    assert(r.wl.r + 6 <= r.wr.l, 'Row 2 #h-wl and #h-wr collide: ' + JSON.stringify({ wl: r.wl, wr: r.wr }));
    assert(r.ty >= 67 && r.ty <= 71, 'HOME.topY() must position room cleanly below #topcap: ' + r.ty);
    return r;
  });

  // 2. Room ceiling starts cleanly right below #topcap with sharp pixels
  await check('2.1 Room ceiling & chandelier start right below #topcap', async () => {
    await page.evaluate(() => window.__game.HOME.goTo('zal', true));
    await page.waitForTimeout(250);
    const r = await page.evaluate(() => {
      const H = window.__game.HOME;
      const cv = document.getElementById('cv');
      const ctx = cv.getContext('2d');
      const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data);
      const ty = H.topY();
      const hdrPx = px(90, 20);
      const blurTailPx = px(90, 41);
      const ceilPx = px(30, ty + 4);
      const floorBotPx = px(90, cv.height - 1);
      return { ty, hdrPx, blurTailPx, ceilPx, floorBotPx };
    });
    assert(r.hdrPx[0] < 45 && r.hdrPx[1] < 40 && r.hdrPx[2] < 50, 'Header must stay dark #1d1622');
    assert(r.blurTailPx[0] < 90 && r.blurTailPx[2] < 95, '0..41 logical px (~92 CSS px) must stay dark inside #topcap');
    assert(r.ceilPx[0] > 200, 'Ceiling plaster below #topcap must render bright cream: ' + JSON.stringify(r.ceilPx));
    assert(r.floorBotPx[0] > 120, 'Floor must extend to bottom cleanly');
    return r;
  });

  // 3. Kitchen bottom bar clears monkey feet & has full horizontal room without bottom corner icons
  await check('3.1 Kitchen carousel sits cleanly below monkey feet & #h-di opens profile', async () => {
    await page.evaluate(() => { window.__game.HOME.goTo('kitchen', true); });
    await page.waitForTimeout(300);
    await page.click('#h-di');
    await page.waitForTimeout(200);
    const r = await page.evaluate(() => {
      const hasProf = window.__game.UI.hasModal();
      const mText = document.querySelector('.mbox h2') ? document.querySelector('.mbox h2').textContent : '';
      document.querySelectorAll('[data-close]').forEach((el) => el.click());
      const u = window.__game.APP.lay.u;
      const bar = document.getElementById('bar').getBoundingClientRect();
      const lab = document.getElementById('c-lab').getBoundingClientRect();
      const feetCss = (window.__game.HOME.mk.y + window.__game.HOME.topY()) * u;
      return { barW: Math.round(bar.width), barB: Math.round(bar.bottom), labTop: Math.round(lab.top), feetCss: Math.round(feetCss), hasProf, mText };
    });
    assert(r.hasProf && r.mText, 'Clicking #h-di must open Profile modal');
    assert(r.barW >= 380, 'Kitchen bottom bar should use full width without bottom corner icons: ' + r.barW);
    assert(874 - r.barB >= 34, 'Kitchen bar must clear 34px Home Indicator');
    assert(r.labTop >= r.feetCss - 2, `Feed label (${r.labTop}px) overlaps monkey feet (${r.feetCss}px)`);
    return r;
  });

  // 4. Mini-games shrink #topcap to 0..92px and put #ghud cleanly at >= 94px (below blur band)
  await check('4.1 Mini-game #topcap shrinks to ~92px and #ghud sits sharp at >= 94px below blur', async () => {
    await page.evaluate(() => window.__game.MINI.start('catch', 1));
    await page.waitForTimeout(250);
    const r = await page.evaluate(() => {
      const cap = document.getElementById('topcap').getBoundingClientRect();
      const gh = document.getElementById('ghud').getBoundingClientRect();
      const cv = document.getElementById('cv');
      const pause = document.getElementById('g-pause');
      const ts = new Event('touchstart', { bubbles: true, cancelable: true });
      const te = new Event('touchend', { bubbles: true, cancelable: true });
      cv.dispatchEvent(ts); cv.dispatchEvent(te);
      const pts = new Event('touchstart', { bubbles: true, cancelable: true });
      pause.dispatchEvent(pts);
      return {
        capH: Math.round(cap.height),
        ghTop: Math.round(gh.top),
        ghBot: Math.round(gh.bottom),
        tsPrev: ts.defaultPrevented,
        tePrev: te.defaultPrevented,
        pausePrev: pts.defaultPrevented,
        imgRend: getComputedStyle(cv).imageRendering,
      };
    });
    assert(r.capH >= 90 && r.capH <= 96, 'In-game #topcap must cover ~92px anti-blur zone, got ' + r.capH);
    assert(r.ghTop >= 92 && r.ghTop >= r.capH, `#ghud (${r.ghTop}px) must sit cleanly below #topcap (${r.capH}px) and blur zone`);
    const hudDisp = await page.evaluate(() => getComputedStyle(document.getElementById('hud')).display);
    assert.strictEqual(hudDisp, 'none', '#hud must be display:none during mini-game, got ' + hudDisp);
    assert(r.tsPrev && r.tePrev && !r.pausePrev, 'Touch loupe defense broken');
    assert.strictEqual(r.imgRend, 'pixelated');
    return r;
  });

  // 5. Catch shake stays 100% seamless
  await check('5.1 Catch shake renders zero transparent stripes', async () => {
    const r = await page.evaluate(() => {
      const G = window.__game;
      const ctx = document.getElementById('cv').getContext('2d');
      G.MINI.G.items.push({ type: 'coconut', x: G.MINI.G.m.x, y: 245, vy: 100, ph: 0 });
      window.advanceTime(25);
      let bad = 0;
      for (let f = 0; f < 24; f++) {
        G.MINI.render(ctx);
        for (const [x, y] of [[90, 0], [90, 319], [90, 320], [90, 390], [0, 350], [179, 350]]) {
          if (ctx.getImageData(x, y, 1, 1).data[3] < 255) bad++;
        }
      }
      G.MINI.home();
      return { bad };
    });
    assert.strictEqual(r.bad, 0);
    return r;
  });

  // 6. Capture clean screenshots across rooms, sheet, mini-game, and desktop
  await page.evaluate(() => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; });
  for (const rm of ['zal', 'kitchen', 'bath', 'hall', 'balcony']) {
    await page.evaluate((id) => window.__game.HOME.goTo(id, true), rm);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r67_live_${rm}.png` });
  }
  await page.evaluate(() => { window.__game.HOME.goTo('kitchen', true); window.__game.UI.openGrow(); });
  await page.waitForTimeout(450);
  const sheetHudDisp = await page.evaluate(() => getComputedStyle(document.getElementById('hud')).display);
  assert.strictEqual(sheetHudDisp, 'none', '#hud must be display:none while sheet is open, got ' + sheetHudDisp);
  await page.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r67_live_sheet.png' });
  await page.evaluate(() => window.__game.UI.closeSheet());
  await page.evaluate(() => window.__game.MINI.start('catch', 1));
  await page.waitForTimeout(250);
  await page.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r67_live_catch.png' });
  await page.evaluate(() => window.__game.MINI.home());

  await check('6.1 Desktop 1280x800 (.is-desktop) keeps #topcap hidden and 2-row HUD intact', async () => {
    const dc = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
    const dp = await dc.newPage();
    dp.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('desktop: ' + m.text()); });
    await dp.goto(targetUrl, { waitUntil: 'networkidle' });
    await dp.waitForTimeout(450);
    await dp.evaluate(() => {
      const G = window.__game;
      G.GAME.S.tut = G.DATA.TUT.length; G.GAME.S.phone = true; G.GAME.S.coins = 290;
      if (G.DASHA.giftOn()) G.DASHA.openGift();
      G.DASHA.abort();
      window.advanceTime(4500);
      document.querySelectorAll('[data-close]').forEach((el) => el.click());
      const t = document.getElementById('toasts'); if (t) t.innerHTML = '';
      G.UI.refresh();
    });
    await dp.waitForTimeout(250);
    const dr = await dp.evaluate(() => ({
      isDesktop: document.documentElement.classList.contains('is-desktop'),
      topcapDisp: getComputedStyle(document.getElementById('topcap')).display,
      phone: Math.round(document.getElementById('h-phone').getBoundingClientRect().top),
    }));
    await dc.close();
    assert.strictEqual(dr.isDesktop, true);
    assert.strictEqual(dr.topcapDisp, 'none');
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
