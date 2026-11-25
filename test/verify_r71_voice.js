'use strict';
const { chromium } = require('/Users/emoorpheus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const SITE_DIR = path.join(ROOT, 'dist', 'site');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
};

function startServer(onReq) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      if (onReq) onReq(req.url);
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
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
      resolve({ srv, url: `http://127.0.0.1:${addr.port}/` });
    });
  });
}

const CHROMIUM_BIN = '/Users/emoorpheus/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell';

// Round 71 regression verification: real browser autoplay enforcement, strict WebKit touchend/click activation,
// single voice fetch (no duplicate preload download), persistent VOICE_CACHE across UI updates, #t-update & suspend/resume
(async () => {
  console.log('=== STARTING ROUND 71 VERIFICATION (iPhone Voice & Audio Wake Fixes) ===');
  let reqLog = [];
  const { srv, url } = await startServer((u) => reqLog.push(u));
  let passed = 0, failed = 0;
  const errors = [], warnings = [];

  // Notice NO --autoplay-policy=no-user-gesture-required flag! Uses strict document-user-activation-required!
  const browser = await chromium.launch({
    executablePath: CHROMIUM_BIN,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=document-user-activation-required']
  });

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

  try {
    // 1. Fresh load with real user save: NO pre-gesture AudioContext creation, NO double download, Home preserves touchend/click
    const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
      if (m.type() === 'warning') warnings.push(m.text());
    });
    page.on('pageerror', (e) => errors.push('PAGEERR: ' + e.message));

    await page.addInitScript(() => {
      localStorage.setItem('martyn_tamagotchi_v1', JSON.stringify({
        v: 9, name: 'Абибян', named: true, coins: 174, lvl: 4, kg: 3.9,
        grow: { pts: 300, stage: 5, seen: 5, day: '2026-11-25', today: 10, src: {}, capped: 0, days: 5, born: Date.now() - 86400e3 * 5, party: 0 },
        tut: 99, phone: true, room: 'zal', settings: { sfx: true, music: true, screenMode: 'stretch' }
      }));
      window.__evTrace = [];
      for (const t of ['touchstart', 'pointerdown', 'pointerup', 'touchend', 'click']) {
        window.addEventListener(t, (e) => window.__evTrace.push(`${t}:${e.defaultPrevented}`), false);
      }
    });

    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    await check('1.1 No pre-gesture AudioContext on boot, single voice1/voice2 download & zero console autoplay warnings', async () => {
      const boot = await page.evaluate(() => ({
        hasCtx: !!__game.AUDIO.ctx,
        unlockedN: __game.AUDIO.unlockedN,
        pendWake: !!__game.AUDIO._sp.pendWake,
        vs: __game.AUDIO.voiceState(),
        nLines: Object.keys(__game.SPEECH.lines).length,
        nWords: Object.keys(__game.SPEECH.words).length,
      }));
      const v1Reqs = reqLog.filter((u) => u.includes('voice1.txt'));
      const v2Reqs = reqLog.filter((u) => u.includes('voice2.txt'));
      assert.strictEqual(boot.hasCtx, false, 'AudioContext must NOT be created before first user gesture');
      assert.strictEqual(boot.vs.ready, 3, 'All voice groups must load');
      assert(boot.nLines >= 500 && boot.nWords >= 1700, 'Full voice bank must load cleanly');
      assert.strictEqual(v1Reqs.length, 1, 'voice1.txt must be fetched ONCE (not duplicated): ' + JSON.stringify(v1Reqs));
      assert.strictEqual(v2Reqs.length, 1, 'voice2.txt must be fetched ONCE (not duplicated): ' + JSON.stringify(v2Reqs));
      assert.strictEqual(warnings.length, 0, 'Zero WebAudio autoplay console warnings expected, got: ' + JSON.stringify(warnings));
      return { boot, v1Count: v1Reqs.length, v2Count: v2Reqs.length };
    });

    // 2. First touch wakes AudioContext cleanly without preventing Home touchend/click and flushes pendWake speech
    await check('2.1 Home canvas tap does NOT prevent touchend/click, wakes AudioContext & plays queued voice', async () => {
      const mkPt = await page.evaluate(() => {
        const u = __game.APP.lay.u, ty = __game.HOME.topY();
        return { x: Math.round(__game.HOME.mk.x * u), y: Math.round((__game.HOME.mk.y + ty - 18) * u) };
      });
      await page.touchscreen.tap(mkPt.x, mkPt.y);
      await page.waitForTimeout(700);
      const r = await page.evaluate(() => ({
        ctxState: __game.AUDIO.ctx && __game.AUDIO.ctx.state,
        unlockedN: __game.AUDIO.unlockedN,
        vs: __game.AUDIO.voiceState(),
        evTrace: window.__evTrace.slice(),
      }));
      assert.strictEqual(r.ctxState, 'running', 'First tap must wake AudioContext to running');
      assert(r.unlockedN >= 1, 'Silent wake sample must play');
      assert(r.vs.played >= 1, 'Speech must play after first wake tap, got played=' + r.vs.played);
      assert(r.evTrace.includes('touchend:false'), 'Home tap must NOT preventDefault() touchend: ' + JSON.stringify(r.evTrace));
      assert(r.evTrace.includes('click:false'), 'Home tap must NOT suppress click: ' + JSON.stringify(r.evTrace));
      return r;
    });

    // 3. Strict iOS WebKit simulation: ONLY touchend/click unlock AudioContext, pointerup runs HOME.say BEFORE touchend!
    await check('3.1 Strict WebKit simulation: speech queued inside pointerup flushes immediately when touchend unlocks AudioContext', async () => {
      const ctx2 = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
      const p2 = await ctx2.newPage();
      p2.on('pageerror', (e) => errors.push('strict: ' + e.message));
      await p2.addInitScript(() => {
        localStorage.setItem('martyn_tamagotchi_v1', JSON.stringify({
          v: 9, name: 'Абибян', named: true, coins: 174, lvl: 4, kg: 3.9,
          grow: { pts: 300, stage: 5, seen: 5, day: '2026-11-25', today: 10, src: {}, capped: 0, days: 5, born: Date.now() - 86400e3 * 5, party: 0 },
          tut: 99, phone: true, room: 'zal', settings: { sfx: true, music: true, screenMode: 'stretch' }
        }));
        let wkGest = false;
        // ONLY touchend / click / keydown unlock AudioContext (pointerdown & pointerup do NOT!)
        for (const ev of ['touchend', 'click', 'keydown']) {
          window.addEventListener(ev, () => { wkGest = true; }, true);
          window.addEventListener(ev, () => { setTimeout(() => { wkGest = false; }, 0); }, false);
        }
        const RealAC = window.AudioContext;
        window.AudioContext = function (...a) {
          const c = new RealAC(...a);
          if (!wkGest) c.suspend();
          return c;
        };
        window.AudioContext.prototype = RealAC.prototype;
        const realResume = RealAC.prototype.resume;
        RealAC.prototype.resume = function () {
          if (!wkGest) return Promise.resolve();
          return realResume.call(this);
        };
      });
      await p2.goto(url, { waitUntil: 'load' });
      await p2.waitForTimeout(1000);
      // Dispatch realistic iOS sequence: pointerdown -> pointerup (calls HOME.say!) -> touchend
      const out = await p2.evaluate(async () => {
        const st = document.getElementById('stage');
        // Simulate pointerup calling HOME.say('Буп!') BEFORE touchend unlocks WebKit
        const evDown = new Event('pointerdown', { bubbles: true, cancelable: true });
        Object.defineProperties(evDown, { clientX: { value: 201 }, clientY: { value: 600 }, pointerId: { value: 1 }, pointerType: { value: 'touch' } });
        document.dispatchEvent(evDown);
        __game.HOME.say('Буп!'); // called while ac still suspended!
        const beforeEnd = {
          ctxState: __game.AUDIO.ctx && __game.AUDIO.ctx.state,
          pendWake: !!__game.AUDIO._sp.pendWake,
          played: __game.AUDIO.voiceState().played,
        };
        // Now touchend fires (real iOS activating gesture)
        const te = new Event('touchend', { bubbles: true, cancelable: true });
        st.dispatchEvent(te);
        await new Promise((r) => setTimeout(r, 450));
        const afterEnd = {
          ctxState: __game.AUDIO.ctx && __game.AUDIO.ctx.state,
          pendWake: !!__game.AUDIO._sp.pendWake,
          played: __game.AUDIO.voiceState().played,
          touchendPrevented: te.defaultPrevented,
        };
        return { beforeEnd, afterEnd };
      });
      await ctx2.close();
      assert.strictEqual(out.beforeEnd.pendWake, true, 'Speech called before WebKit touchend unlock must queue in pendWake');
      assert.strictEqual(out.afterEnd.ctxState, 'running', 'touchend must resume AudioContext to running');
      assert.strictEqual(out.afterEnd.touchendPrevented, false, 'touchend on Home must NOT be prevented');
      assert(out.afterEnd.played >= 1, 'Queued speech must flush and play right on touchend unlock: ' + JSON.stringify(out));
      return out;
    });

    // 4. Suspend/background -> return/tap recovery works seamlessly
    await check('4.1 Suspend -> wake tap cleanly restores running AudioContext and speaks lines', async () => {
      await page.evaluate(() => __game.AUDIO.suspend());
      await page.waitForTimeout(100);
      const mid = await page.evaluate(() => ({ susp: __game.AUDIO.isSuspended(), ctx: __game.AUDIO.ctx && __game.AUDIO.ctx.state, played: __game.AUDIO.voiceState().played }));
      assert.strictEqual(mid.susp, true);
      assert.strictEqual(mid.ctx, 'suspended');
      const mkPt = await page.evaluate(() => {
        const u = __game.APP.lay.u, ty = __game.HOME.topY();
        return { x: Math.round(__game.HOME.mk.x * u), y: Math.round((__game.HOME.mk.y + ty - 18) * u) };
      });
      await page.touchscreen.tap(mkPt.x, mkPt.y);
      await page.waitForTimeout(250);
      const sayDur = await page.evaluate(() => __game.HOME.say('Привет! Я так скучал!'));
      await page.waitForTimeout(400);
      const after = await page.evaluate(() => ({ susp: __game.AUDIO.isSuspended(), ctx: __game.AUDIO.ctx && __game.AUDIO.ctx.state, played: __game.AUDIO.voiceState().played }));
      assert.strictEqual(after.susp, false);
      assert.strictEqual(after.ctx, 'running');
      assert(after.played > mid.played, 'Voice must play after returning from suspend');
      return { mid, sayDur, after };
    });

    // 5. #t-update triggers single reload (not double-reloaded by controllerchange), sw.js keeps VOICE_CACHE, Version 71 shown
    await check('5.1 Settings shows Version 71, sw.js preserves persistent VOICE_CACHE, and #t-update avoids double reload', async () => {
      const swTxt = fs.readFileSync(path.join(SITE_DIR, 'sw.js'), 'utf8');
      assert(swTxt.includes('VOICE_CACHE'), 'sw.js must use dedicated VOICE_CACHE');
      assert(swTxt.includes("k !== CACHE && k !== VOICE_CACHE"), 'sw.js activate must NOT delete VOICE_CACHE on app updates');

      await page.evaluate(() => { while (__game.UI.hasModal()) __game.UI.closeModal(); __game.UI.openSettings(); });
      await page.waitForTimeout(150);
      const ver = await page.evaluate(() => ([...document.querySelectorAll('.mbox')].pop() || {}).textContent || '');
      assert(ver.includes('Версия 71'), 'Settings must show Версия 71, got ' + ver.slice(0, 120));

      reqLog = [];
      await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click('#t-update')]);
      await page.waitForTimeout(1500);
      const docReqs = reqLog.filter((u) => u.includes('?_t='));
      const v1Reqs = reqLog.filter((u) => u.includes('voice1.txt'));
      assert.strictEqual(docReqs.length, 1, '#t-update must reload document ONCE (no controllerchange double-reload): ' + JSON.stringify(docReqs));
      assert.strictEqual(v1Reqs.length, 1, 'After #t-update voice1.txt must be fetched ONCE: ' + JSON.stringify(v1Reqs));
      const ready = await page.evaluate(() => __game.AUDIO.voiceState().ready);
      assert.strictEqual(ready, 3);
      return { docReqs: docReqs.length, v1Reqs: v1Reqs.length, ready };
    });

    // 6. Slow-network fallback: delayed voice1.txt resolves SP.pend properly after wake tap
    await check('6.1 Delayed voice1.txt holds pend speech cleanly and plays once fetched after wake tap', async () => {
      const ctx3 = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
      const p3 = await ctx3.newPage();
      p3.on('pageerror', (e) => errors.push('slow: ' + e.message));
      await p3.route('**/voice1.txt*', async (rt) => {
        await new Promise((r) => setTimeout(r, 900));
        await rt.continue();
      });
      await p3.route('**/voice2.txt*', async (rt) => {
        await new Promise((r) => setTimeout(r, 1100));
        await rt.continue();
      });
      await p3.goto(url, { waitUntil: 'domcontentloaded' });
      await p3.waitForFunction(() => window.__game && __game.AUDIO, null, { timeout: 10000 });
      await p3.touchscreen.tap(200, 600);
      await p3.waitForTimeout(200);
      const mid = await p3.evaluate(() => {
        // Call a non-priority phrase while voice1.txt is still downloading
        const r = __game.AUDIO.say('Швежий банан!');
        return { r: r === null ? null : true, vs: __game.AUDIO.voiceState(), ctx: __game.AUDIO.ctx && __game.AUDIO.ctx.state };
      });
      await p3.waitForTimeout(1800);
      const end = await p3.evaluate(() => ({ vs: __game.AUDIO.voiceState(), ctx: __game.AUDIO.ctx && __game.AUDIO.ctx.state }));
      await ctx3.close();
      assert.strictEqual(mid.ctx, 'running');
      assert.strictEqual(mid.vs.pend, 1, 'Line spoken while voice1.txt still loading must set pend=1');
      assert.strictEqual(end.vs.ready, 3);
      assert.strictEqual(end.vs.pend, 0);
      assert(end.vs.played >= 1, 'Pending speech must play automatically once voice1.txt loads: ' + JSON.stringify({ mid, end }));
      return { mid, end };
    });

    await check('0.0 Zero runtime console/page errors or autoplay warnings', async () => {
      assert.deepStrictEqual(errors, []);
      assert.deepStrictEqual(warnings, []);
      return { errors: 0, warnings: 0 };
    });

    console.log(`\nSummary: ${passed}/${passed + failed} passed, ${failed} failed`);
  } finally {
    await browser.close();
    srv.close();
  }
  process.exit(failed > 0 ? 1 : 0);
})();
