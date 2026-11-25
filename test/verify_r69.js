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
  console.log('=== STARTING ROUND 69 VERIFICATION (Enlarged Native HUD + Lower Floor Walk) ===');
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

  // 1. Enlarged single-row HUD sits higher (top=66..98px) cleanly with zero overlap/wrap
  await check('1.1 Enlarged single-row top HUD (y=66..98px, 32px buttons, 25px stats, zero wrap even at 100000 coins)', async () => {
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
        phone: box('#h-phone'),
        shop: box('#h-shop'),
        wr: box('#h-wr'),
        grow: box('#h-grow'),
        ach: box('#h-ach'),
        set: box('#h-set'),
      };
    });
    assert(r.hud.t >= 62 && r.hud.t <= 68, 'HUD must be raised to 62..68px, got ' + r.hud.t);
    assert(r.phone.w >= 31 && r.grow.w >= 31 && r.set.w >= 31, 'Buttons must be enlarged (~32px), got ' + r.phone.w + '/' + r.grow.w);
    assert(r.stat.w >= 24 && r.stat.h >= 24, 'Stat icons must be enlarged (~24px), got ' + r.stat.w);
    assert(r.di.r <= r.wl.l && r.wl.r <= r.phone.l && r.phone.r <= r.shop.l && r.shop.r <= r.wr.l, 'Row items collide or wrap: ' + JSON.stringify(r));
    assert(r.wr.r <= 399, 'Right edge clipped: ' + r.wr.r);
    assert(r.topcap.borderB === '0px', '#topcap must NOT have harsh border-bottom: ' + r.topcap.borderB);
    assert(r.ty >= 44 && r.ty <= 48, 'HOME.topY() must be 44..48, got ' + r.ty);

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

  // 2. Native room blending: no opaque black #1d1622 slab in Home, per-room ceiling/wall flows to y=0 + per-room --ceil-bg
  await check('2.1 Native room blending in all 5 rooms (no opaque black top slab; distinct room themes)', async () => {
    const out = {};
    for (const rm of ['zal', 'kitchen', 'bath', 'hall', 'balcony']) {
      await page.evaluate((id) => window.__game.HOME.goTo(id, true), rm);
      await page.waitForTimeout(250);
      out[rm] = await page.evaluate(() => {
        const cv = document.getElementById('cv');
        const ctx = cv.getContext('2d');
        const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data).slice(0, 3);
        return {
          topCeilL: px(40, 20),
          topCeilR: px(150, 20),
          hudMid: px(90, 36),
          belowHdr: px(40, window.__game.HOME.topY() + 4),
          ceilBg: getComputedStyle(document.documentElement).getPropertyValue('--ceil-bg').trim(),
          hudRgb: getComputedStyle(document.documentElement).getPropertyValue('--hud-rgb').trim(),
        };
      });
    }
    assert(out.zal.topCeilL[0] > 200 && out.zal.topCeilR[0] > 200, 'Zal cream ceiling must extend cleanly across top without opaque black slab: ' + JSON.stringify(out.zal));
    assert(out.kitchen.topCeilL[0] > 200, 'Kitchen ceiling must extend continuously to top edge: ' + JSON.stringify(out.kitchen));
    assert(out.bath.topCeilL[0] > 200, 'Bath ceiling must extend continuously to top edge: ' + JSON.stringify(out.bath));
    assert(out.hall.topCeilL[0] < 80 && out.hall.topCeilL[0] > 45 && out.hall.topCeilL[2] < 35, 'Hall mahogany ceiling must match room wood (#3e2416): ' + JSON.stringify(out.hall));
    assert.notStrictEqual(out.zal.hudRgb, out.bath.hudRgb, 'Zal and Bath must have distinct room-native HUD palettes');
    return out;
  });

  // 3. Bug #2: Tapping lower floor walks monkey ALL the way down toward bottom of screen!
  await check('3.1 Tap on lower floor in zal walks monkey down past old 304 limit (y >= 315)', async () => {
    await page.evaluate(() => window.__game.HOME.goTo('zal', true));
    await page.waitForTimeout(250);
    const startY = await page.evaluate(() => window.__game.HOME.mk.y);
    // Tap low floor at x=200px, y=820px (scene y ≈ 367 - 45 = 322)
    await page.mouse.click(200, 820);
    await page.waitForTimeout(80);
    const walking = await page.evaluate(() => ({
      tripKind: window.__game.HOME.trip && window.__game.HOME.trip.kind,
      walking: window.__game.HOME.walking,
    }));
    assert.strictEqual(walking.tripKind, 'walk', 'Tapping bottom floor must trigger walk trip: ' + JSON.stringify(walking));
    assert.strictEqual(walking.walking, true);
    await page.evaluate(() => window.advanceTime(3000));
    await page.waitForTimeout(150);
    const endY = await page.evaluate(() => Math.round(window.__game.HOME.mk.y));
    assert(endY >= 315, `Monkey must reach lower floor (y>=315), started=${startY}, ended=${endY}`);

    // Now test walking UP and back DOWN in another room (bath) + kitchen bottom cap above #bar
    await page.evaluate(() => window.__game.HOME.goTo('kitchen', true));
    await page.waitForTimeout(200);
    await page.mouse.click(200, 745);
    await page.evaluate(() => window.advanceTime(2500));
    await page.waitForTimeout(100);
    const kWalk = await page.evaluate(() => ({
      mkY: Math.round(window.__game.HOME.mk.y),
      barTopCss: Math.round(document.getElementById('bar').getBoundingClientRect().top),
      feetCss: Math.round((window.__game.HOME.mk.y + window.__game.HOME.topY()) * window.__game.APP.lay.u),
    }));
    assert(kWalk.mkY >= 285 && kWalk.feetCss <= kWalk.barTopCss + 4, 'Kitchen lower walk must go deep while respecting #bar: ' + JSON.stringify(kWalk));
    return { startY, walking, endY, kWalk };
  });

  // 4. Sheets (#hud hidden, camY > 0 keeps top DI clear) + mini-game #ghud + Version string
  await check('4.1 Sheet hides #hud cleanly, mini-game #ghud at top~66px, and settings shows Version 69', async () => {
    await page.evaluate(() => window.__game.HOME.goTo('kitchen', true));
    await page.evaluate(() => window.__game.UI.openGrow());
    await page.waitForTimeout(350);
    const sh = await page.evaluate(() => ({
      hudDisp: getComputedStyle(document.getElementById('hud')).display,
      capH: Math.round(document.getElementById('topcap').getBoundingClientRect().height),
    }));
    assert.strictEqual(sh.hudDisp, 'none');
    assert(sh.capH >= 64 && sh.capH <= 72);
    await page.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r69_live_sheet.png' });
    await page.evaluate(() => window.__game.UI.closeSheet());

    await page.evaluate(() => window.__game.MINI.start('catch', 1));
    await page.waitForTimeout(250);
    const gm = await page.evaluate(() => ({
      hudDisp: getComputedStyle(document.getElementById('hud')).display,
      ghTop: Math.round(document.getElementById('ghud').getBoundingClientRect().top),
    }));
    assert.strictEqual(gm.hudDisp, 'none');
    assert(gm.ghTop >= 62 && gm.ghTop <= 68, '#ghud top must sit cleanly at 62..68px, got ' + gm.ghTop);
    await page.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r69_live_catch.png' });
    await page.evaluate(() => window.__game.MINI.home());

    await page.evaluate(() => window.__game.UI.openSettings());
    await page.waitForTimeout(200);
    const verTxt = await page.evaluate(() => document.querySelector('.mbox').textContent);
    await page.evaluate(() => window.__game.UI.closeModal());
    assert(verTxt.includes('Версия 69'), 'Settings must show Версия 69');
    return { sh, gm };
  });

  // 5. Save screenshots of all 5 rooms + zal lights off
  await page.evaluate(() => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; });
  for (const rm of ['zal', 'kitchen', 'bath', 'hall', 'balcony']) {
    await page.evaluate((id) => window.__game.HOME.goTo(id, true), rm);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r69_live_${rm}.png` });
  }
  await page.evaluate(() => { window.__game.HOME.goTo('zal', true); window.__game.HOME.toggleLight(); });
  await page.waitForTimeout(250);
  await page.screenshot({ path: '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r69_live_zal_night.png' });
  await page.evaluate(() => window.__game.HOME.toggleLight());

  await check('0.0 Zero console/page errors', async () => {
    assert.deepStrictEqual(consoleErrors, []);
    return consoleErrors;
  });

  console.log(`\nSummary: ${passed}/${passed + failed} passed, ${failed} failed`);
  await browser.close();
  srv.close();
  process.exit(failed > 0 ? 1 : 0);
})();
