'use strict';
// Round 64 Bug Hunt: TDD reproduction & regression suite for all discovered bugs.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('/Users/emoorpheus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const ROOT = path.resolve(__dirname, '..');
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
  const { srv, url } = await startServer();
  const browser = await chromium.launch({
    executablePath: '/Users/emoorpheus/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  const results = [];
  const errs = [];
  const check = (name, cond, detail) => {
    results.push({ name, pass: !!cond, detail });
    console.log(`${cond ? 'PASS' : 'FAIL'} ${name}` + (detail !== undefined ? '  ' + JSON.stringify(detail) : ''));
  };

  async function openFresh(vw = 393, vh = 852, standalone = true, safeTop = 59, safeBot = 34) {
    const ctx = await browser.newContext({
      viewport: { width: vw, height: vh },
      hasTouch: true,
      isMobile: true,
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(`console: ${m.text()}`); });
    await page.addInitScript(({ standalone, safeTop, safeBot }) => {
      if (standalone) {
        try { Object.defineProperty(navigator, 'standalone', { get: () => true, configurable: true }); } catch (e) {}
      }
      // Inject simulated safe-area inset CSS variable helper so tests match real notched iPhones
      window.__SIM_SAFE = { top: safeTop, bot: safeBot };
    }, { standalone, safeTop, safeBot });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const s = window.__game.GAME.S;
      s.coins = 500;
      s.phone = true;
      s.tut = window.__game.DATA.TUT.length;
      s.home.items.pc = 'tower';
      s.home.items.tv = 'hiper';
      s.home.items.guitar = 1;
      s.home.items.switch2 = 1;
      s.home.items.ps5 = 1;
      s.grow.stage = window.__game.DATA.AGE.adult;
      s.st.food = 50;
      s.st.energy = 60;
      s.inv.banana = 5;
      s.inv.milk = 3;
      if (window.__game.DASHA.giftOn()) window.__game.DASHA.openGift();
      window.advanceTime(4000);
      document.querySelectorAll('[data-close]').forEach((b) => b.click());
      window.__game.GAME.save(true);
    });
    await page.waitForTimeout(300);
    return { ctx, page };
  }

  try {
    // --- 1. HOME: toggleLight while trip ('guitar' / 'console') active ---
    {
      const { ctx, page } = await openFresh(393, 852);
      const r1 = await page.evaluate(() => {
        const G = window.__game;
        G.HOME.goTo('zal', true);
        G.HOME.tripStart('guitar');
        window.advanceTime(1200); // walking/playing guitar
        const tripBefore = G.HOME.trip;
        G.HOME.toggleLight(); // turn light off -> sleep
        window.advanceTime(100);
        const s = G.GAME.S;
        const t = JSON.parse(window.render_game_to_text());
        return {
          tripBefore,
          sleeping: s.sleeping,
          tripAfter: G.HOME.trip,
          monkeyY: t.monkey.y,
          act: G.HOME.mk.act ? G.HOME.mk.act.k : null,
        };
      });
      check('1.1 toggleLight cancels active guitar trip cleanly', r1.sleeping && r1.tripAfter === null && r1.monkeyY === 236, r1);

      // --- 2. BATH: double-tap toilet during go phase + shower/mirror blocked while on toilet ---
      const r2 = await page.evaluate(() => {
        const G = window.__game;
        G.HOME.wake();
        G.HOME.goTo('bath', true);
        window.advanceTime(200);
        const sp = G.ROOMS.spots('bath', G.GAME.S.home.items);
        const cx = (r) => r[0] + r[2] / 2;
        const cy = (r) => r[1] + r[3] / 2 + G.HOME.topY();
        // Tap toilet -> ph = 'go'
        G.HOME.down(cx(sp.toilet), cy(sp.toilet));
        G.HOME.up(cx(sp.toilet), cy(sp.toilet));
        window.advanceTime(150);
        const ph1 = G.HOME.trip && G.HOME.trip.ph;
        // Double tap toilet while STILL walking ('go') -> must NOT switch to 'back'!
        G.HOME.down(cx(sp.toilet), cy(sp.toilet));
        G.HOME.up(cx(sp.toilet), cy(sp.toilet));
        const ph2 = G.HOME.trip && G.HOME.trip.ph;
        const yAfterDoubleTap = Math.round(G.HOME.mk.y);
        // Reset cleanly & actually sit on toilet ('do')
        if (G.HOME.trip) { G.HOME.goTo('hall', true); G.HOME.goTo('bath', true); window.advanceTime(200); }
        G.HOME.down(cx(sp.toilet), cy(sp.toilet));
        G.HOME.up(cx(sp.toilet), cy(sp.toilet));
        window.advanceTime(2200);
        const trDo = G.HOME.trip;
        const ph3 = trDo && trDo.ph;
        const hasD = trDo ? ('D' in trDo) : null;
        const hasPath = trDo ? ('path' in trDo) : null;
        const showerRes = G.HOME.shower();
        window.advanceTime(200);
        const showerDrops = G.HOME.fx.list.filter((f) => f.k === 'drop').length;
        G.HOME.goTo('hall', true);
        window.advanceTime(100);
        return { ph1, ph2, yAfterDoubleTap, ph3, hasD, hasPath, keys: trDo ? Object.keys(trDo) : null, showerRes: showerRes === undefined ? null : showerRes, showerDrops };
      });
      check('2.1 double-tap toilet during go does not jump/abort to back', r2.ph1 === 'go' && r2.ph2 === 'go' && r2.yAfterDoubleTap > 215, r2);
      check('2.2 shower blocked while sitting on toilet', r2.ph3 === 'do' && r2.showerRes === false && r2.showerDrops === 0, r2);

      // --- 3. HOME.trip getter must return clean snapshot (no duplicate getter leak) ---
      check('3.1 HOME.trip does not leak internal D/path object', r2.hasD === false && r2.hasPath === false, r2);

      // --- 4. INPUT: multi-touch hijack & pointercancel feeds/soaps ---
      const r4 = await page.evaluate(() => {
        const G = window.__game;
        G.HOME.goTo('kitchen', true);
        window.advanceTime(200);
        const cv = document.getElementById('cv');
        const stg = document.getElementById('stage');
        const slot = document.getElementById('c-slot');
        const rect = slot.getBoundingClientRect();
        // Start food drag from #c-slot via pointer 1
        slot.dispatchEvent(new PointerEvent('pointerdown', {
          bubbles: true, cancelable: true, pointerId: 1, pointerType: 'touch',
          clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, isPrimary: true,
        }));
        const toolStarted = !!G.HOME.tool;
        const toolId = G.HOME.tool ? G.HOME.tool.id : 'banana';
        // Move near monkey mouth (`tool.y + tool.dy === mouth.y`)
        const cvR = cv.getBoundingClientRect();
        const mouthY = G.HOME.mk.y + G.HOME.mk.jy + (G.HOME.mk.sp ? G.HOME.mk.sp.mouth.y : -67) + 1;
        const targetSceneY = mouthY - (G.HOME.tool ? G.HOME.tool.dy : -16);
        const sx = cvR.left + (G.HOME.mk.x / 180) * cvR.width;
        const sy = cvR.top + ((targetSceneY + G.HOME.topY()) / cv.height) * cvR.height;
        window.dispatchEvent(new PointerEvent('pointermove', {
          bubbles: true, cancelable: true, pointerId: 1, pointerType: 'touch', isPrimary: true,
          clientX: sx, clientY: sy,
        }));
        const invBefore = G.GAME.S.inv[toolId];
        // Fire pointercancel on pointer 1 -> must NOT feed!
        window.dispatchEvent(new PointerEvent('pointercancel', {
          bubbles: true, cancelable: true, pointerId: 1, pointerType: 'touch', isPrimary: true,
          clientX: sx, clientY: sy,
        }));
        const invAfterCancel = G.GAME.S.inv[toolId];

        // Also test multi-touch capture in MINI 'catch'
        G.MINI.start('catch', 1);
        window.advanceTime(100);
        const cvR2 = cv.getBoundingClientRect();
        stg.dispatchEvent(new PointerEvent('pointerdown', {
          bubbles: true, cancelable: true, pointerId: 10, pointerType: 'touch',
          clientX: cvR2.left + 20, clientY: cvR2.top + 200, isPrimary: true,
        }));
        window.advanceTime(50);
        // Move finger 1 to right
        stg.dispatchEvent(new PointerEvent('pointermove', {
          bubbles: true, cancelable: true, pointerId: 10, pointerType: 'touch',
          clientX: cvR2.left + cvR2.width - 20, clientY: cvR2.top + 200,
        }));
        // Second finger touches left side -> should NOT hijack capId!
        stg.dispatchEvent(new PointerEvent('pointerdown', {
          bubbles: true, cancelable: true, pointerId: 11, pointerType: 'touch',
          clientX: cvR2.left + 10, clientY: cvR2.top + 200, isPrimary: false,
        }));
        // Release second finger -> move finger 1 again to verify finger 1 still has capture!
        stg.dispatchEvent(new PointerEvent('pointerup', {
          bubbles: true, cancelable: true, pointerId: 11, pointerType: 'touch',
          clientX: cvR2.left + 10, clientY: cvR2.top + 200,
        }));
        stg.dispatchEvent(new PointerEvent('pointermove', {
          bubbles: true, cancelable: true, pointerId: 10, pointerType: 'touch',
          clientX: cvR2.left + 15, clientY: cvR2.top + 200,
        }));
        window.advanceTime(450);
        const playerX = G.MINI.G && G.MINI.G.m ? G.MINI.G.m.x : null;
        G.MINI.home();
        window.advanceTime(100);
        return { toolStarted, invBefore, invAfterCancel, playerX };
      });
      check('4.1 pointercancel on food drag does not feed banana', r4.toolStarted && r4.invAfterCancel === r4.invBefore, r4);
      check('4.2 second finger pointerdown/up does not break finger 1 drag capture in catch', typeof r4.playerX === 'number' && r4.playerX < 40, r4);

      // --- 5. UI: Settings rapid double-tap (sound + music) & .mbox short viewport fit ---
      const r5 = await page.evaluate(() => {
        const G = window.__game;
        document.getElementById('h-set').click();
        const mbox = document.querySelector('#modalw .mbox');
        const maxHStyle = mbox ? getComputedStyle(mbox).maxHeight : '';
        const before = { sfx: G.GAME.S.settings.sfx, music: G.GAME.S.settings.music };
        const sfxBtn = document.getElementById('t-sfx');
        if (sfxBtn) sfxBtn.click();
        // Rapidly click music toggle 20ms later (no wait for 350ms!)
        const musBtn = document.getElementById('t-mus');
        if (musBtn) musBtn.click();
        const after = { sfx: G.GAME.S.settings.sfx, music: G.GAME.S.settings.music };
        document.querySelectorAll('[data-close]').forEach((b) => b.click());
        return { before, after, maxHStyle };
      });
      check('5.1 Settings toggles sound & music rapidly without 350ms swallow', r5.after.sfx === !r5.before.sfx && r5.after.music === !r5.before.music, r5);
      await ctx.close();
    }

    // --- 5b. Short viewport (.mbox max-height + #tut & #blow safe-area clearance) ---
    {
      const { ctx, page } = await openFresh(430, 420, false, 0, 0);
      const rMbox = await page.evaluate(() => {
        const G = window.__game;
        // Inject a tall modal on compact height viewport (430x420: fixed 290u=693px overflows 420px!)
        const w = G.UI.modal('<h2>Tall</h2>' + Array(65).fill('<p>Line of modal text for scroll overflow check</p>').join('') + '<button class="btn g" data-close>OK</button>');
        const box = w.querySelector('.mbox').getBoundingClientRect();
        G.UI.closeModal(w);
        return { boxH: Math.round(box.height), vh: window.innerHeight, top: Math.round(box.top), bottom: Math.round(box.bottom) };
      });
      check('5.2 Tall modal .mbox fits inside 430x420 viewport without clipping', rMbox.boxH <= rMbox.vh - 10 && rMbox.top >= 0 && rMbox.bottom <= rMbox.vh, rMbox);
      await ctx.close();
    }

    // --- 5c. #tut and #blow clearance vs HUD / Dynamic Island in .mode-stretch (393x852) ---
    {
      const { ctx, page } = await openFresh(393, 852, true, 59, 34);
      const rTutBlow = await page.evaluate(() => {
        // Simulate real iPhone 17 WebClip safe-area-inset-top: 59px via stylesheet on #hud/#tut/#blow if env() is 0 in headless
        // Actually check CSS computed `top` formula AND simulated safe-area rule!
        const tutRule = [...document.styleSheets].flatMap((s) => [...s.cssRules]).find((r) => r.selectorText === '#tut');
        const blowRule = [...document.styleSheets].flatMap((s) => [...s.cssRules]).find((r) => r.selectorText === '#blow');
        const hudRule = [...document.styleSheets].flatMap((s) => [...s.cssRules]).find((r) => r.selectorText && r.selectorText.includes('.mode-stretch #hud'));
        return {
          tutCss: tutRule ? tutRule.style.top : null,
          blowCss: blowRule ? blowRule.style.top : null,
          hasSafeAreaInTut: !!(tutRule && tutRule.cssText.includes('safe-area-inset-top')),
          hasSafeAreaInBlow: !!(blowRule && blowRule.cssText.includes('safe-area-inset-top')),
          hudCss: hudRule ? hudRule.cssText : null,
        };
      });
      check('5.3 #tut and #blow account for env(safe-area-inset-top) in .mode-stretch', rTutBlow.hasSafeAreaInTut && rTutBlow.hasSafeAreaInBlow, rTutBlow);
      await ctx.close();
    }

    // --- 6. MINI-GAMES FULLSCREEN (ch=390) + PAUSE + ORPHAN TIMERS ---
    {
      const { ctx, page } = await openFresh(393, 852);
      const pxSample = (x, y) => `(() => { const d = document.getElementById('cv').getContext('2d').getImageData(${x}, ${y}, 1, 1).data; return [d[0], d[1], d[2]]; })()`;

      // 6.1 Stack: cam > 25 must not paint solid brown floor over lowered tower/sky at y=355
      const rStack = await page.evaluate(() => {
        const G = window.__game;
        G.MINI.start('stack', 1);
        window.advanceTime(80);
        if (G.MINI.G && G.MINI.G.demo) {
          G.MINI.G.demo();
          G.MINI.G.demo();
        }
        window.advanceTime(60);
        const cv = document.getElementById('cv');
        G.MINI.render(cv.getContext('2d'));
        const shotData = cv.toDataURL('image/png');
        const d = cv.getContext('2d').getImageData(90, 355, 1, 1).data;
        const dSky = cv.getContext('2d').getImageData(10, 355, 1, 1).data;
        G.MINI.home();
        return { midAt355: [d[0], d[1], d[2]], sideAt355: [dSky[0], dSky[1], dSky[2]], shotData };
      });
      fs.writeFileSync('/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r64_stack_fullscreen.png', Buffer.from(rStack.shotData.split(',')[1], 'base64'));
      const isBrownFloor = (rgb) => Math.abs(rgb[0] - 138) <= 3 && Math.abs(rgb[1] - 106) <= 3 && Math.abs(rgb[2] - 72) <= 3;
      check('6.1 Stack fullscreen (cam>0): y=355 does not overwrite lowered tower/sky with flat #8a6a48 floor', !isBrownFloor(rStack.midAt355) && !isBrownFloor(rStack.sideAt355), { midAt355: rStack.midAt355, sideAt355: rStack.sideAt355 });

      // 6.2 Super: pit at y=360 must continue sky rather than transparent/black
      const rSuper = await page.evaluate(() => {
        const G = window.__game;
        G.GAME.S.st.energy = 80;
        G.MINI.start('super', 1);
        window.advanceTime(50);
        if (G.MINI.G && G.MINI.G.place) {
          G.MINI.G.place('pit', 12, 48);
        }
        window.advanceTime(400);
        const cv = document.getElementById('cv');
        const ctx = cv.getContext('2d');
        const shotData = cv.toDataURL('image/png');
        let pitX = null;
        for (let x = 20; x < 170; x += 4) {
          const d = ctx.getImageData(x, 260, 1, 1).data;
          // At y=260 (below GY=250): bricks are orange/brown, pit sky is bright bluish (#dff2fc: b > r + 15)
          if (d[2] > d[0] + 15 && d[2] > 180) { pitX = x; break; }
        }
        const pitBot = pitX !== null ? ctx.getImageData(pitX, 360, 1, 1).data : [0, 0, 0, 0];
        const pitTop = pitX !== null ? ctx.getImageData(pitX, 260, 1, 1).data : [0, 0, 0, 0];
        G.MINI.home();
        return { pitX, pitBot: [pitBot[0], pitBot[1], pitBot[2], pitBot[3]], pitTop: [pitTop[0], pitTop[1], pitTop[2]], shotData };
      });
      fs.writeFileSync('/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r64_super_pit_fullscreen.png', Buffer.from(rSuper.shotData.split(',')[1], 'base64'));
      check('6.2 Super fullscreen over pit: y=360 continues pit sky rather than blank/black void', rSuper.pitX !== null && rSuper.pitBot[2] > 180 && rSuper.pitBot[3] > 200, { pitX: rSuper.pitX, pitBot: rSuper.pitBot, pitTop: rSuper.pitTop });

      // 6.3 Roofs: level 1 daytime below y=320 must not have flat black #141824 bar
      const rRoofs = await page.evaluate(() => {
        const G = window.__game;
        G.MINI.start('roofs', 1);
        window.advanceTime(50);
        const cv = document.getElementById('cv');
        const shotData = cv.toDataURL('image/png');
        const at280 = cv.getContext('2d').getImageData(40, 280, 1, 1).data;
        const at360 = cv.getContext('2d').getImageData(40, 360, 1, 1).data;
        const edge360 = cv.getContext('2d').getImageData(170, 360, 1, 1).data;
        G.MINI.home();
        return { at280: [at280[0], at280[1], at280[2]], at360: [at360[0], at360[1], at360[2]], edge360: [edge360[0], edge360[1], edge360[2]], shotData };
      });
      fs.writeFileSync('/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r64_roofs_fullscreen.png', Buffer.from(rRoofs.shotData.split(',')[1], 'base64'));
      const isRoofsBlack = (rgb) => rgb[0] === 20 && rgb[1] === 24 && rgb[2] === 36;
      check('6.3 Roofs daytime fullscreen: y=360 continues building/alley rather than #141824 black bar', !isRoofsBlack(rRoofs.at360) && !isRoofsBlack(rRoofs.edge360), { at280: rRoofs.at280, at360: rRoofs.at360, edge360: rRoofs.edge360 });

      // 6.4 Vine: level 1 daytime below y=320 must not have flat #241a34 dark purple band
      const rVine = await page.evaluate(() => {
        const G = window.__game;
        G.MINI.start('vine', 1);
        window.advanceTime(50);
        const cv = document.getElementById('cv');
        const shotData = cv.toDataURL('image/png');
        const at300 = cv.getContext('2d').getImageData(90, 300, 1, 1).data;
        const at360 = cv.getContext('2d').getImageData(90, 360, 1, 1).data;
        G.MINI.home();
        return { at300: [at300[0], at300[1], at300[2]], at360: [at360[0], at360[1], at360[2]], shotData };
      });
      fs.writeFileSync('/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r64_vine_fullscreen.png', Buffer.from(rVine.shotData.split(',')[1], 'base64'));
      const isVineDark = (rgb) => rgb[0] === 36 && rgb[1] === 26 && rgb[2] === 52;
      check('6.4 Vine level 1 fullscreen: y=360 matches jungle sky rather than #241a34 purple band', !isVineDark(rVine.at360), { at300: rVine.at300, at360: rVine.at360 });

      // 6.5 Super / Roofs render() while paused must NOT advance popup/hop timers
      const rPause = await page.evaluate(() => {
        const G = window.__game;
        G.MINI.start('roofs', 1);
        window.advanceTime(50);
        // Move banana right in front of monkey so it's grabbed in next frame
        const st0 = G.MINI.G.st();
        const lv = G.MINI.G.lv;
        lv.ban = [
          { x: st0.x + 1, h: st0.h + 10, gold: 0, got: 0 },
          { x: st0.x + 5, h: st0.h + 10, gold: 0, got: 0 },
          { x: st0.x + 9, h: st0.h + 10, gold: 0, got: 0 },
        ];
        window.advanceTime(60); // grabs banana -> pops has t ~ 0.02
        const cv = document.getElementById('cv');
        const ctx = cv.getContext('2d');
        G.MINI.render(ctx);
        const st1 = G.MINI.G.st();
        // Popup starts around (x - cam, BASE - h) and rises 14px over 0.35s
        const px = Math.round(st1.x - st1.cam);
        const py = Math.round(244 - st1.h - 10);
        const snapRegion = () => {
          const out = [];
          for (let y = Math.max(0, py - 24); y <= py + 6; y += 2) {
            for (let x = Math.max(0, px - 10); x <= Math.min(179, px + 10); x += 2) {
              const d = ctx.getImageData(x, y, 1, 1).data;
              out.push(d[0], d[1], d[2]);
            }
          }
          return out;
        };
        G.MINI.pause();
        const before = snapRegion();
        for (let i = 0; i < 30; i++) G.MINI.render(ctx);
        const after = snapRegion();
        let diffPixels = 0;
        for (let i = 0; i < before.length; i += 3) {
          if (Math.abs(before[i] - after[i]) + Math.abs(before[i + 1] - after[i + 1]) + Math.abs(before[i + 2] - after[i + 2]) > 8) diffPixels++;
        }
        document.querySelectorAll('[data-close]').forEach((b) => b.click());
        G.MINI.home();
        return { grabCount: st1.bananas, diffPixels };
      });
      check('6.5 Roofs render() while paused does not advance popup timers', rPause.grabCount >= 1 && rPause.diffPixels === 0, rPause);

      // 6.6 Orphaned setTimeout sounds do not play after exiting Gym to home
      const rOrphan = await page.evaluate(() => {
        const G = window.__game;
        G.AUDIO.init();
        G.MINI.start('gym', 1);
        window.advanceTime(50);
        const playedAfterExit = [];
        const origPlay = G.AUDIO.play;
        let exited = false, liftArmed = false;
        G.AUDIO.play = function (name, a) {
          if (!exited && name === 'lift') liftArmed = true;
          if (exited) playedAfterExit.push(name);
          return origPlay.call(this, name, a);
        };
        // Step through aim cycle until cursor enters green zone so 'lift' arms setTimeout(220, 'clank')
        for (let step = 0; step < 80 && !liftArmed; step++) {
          G.MINI.down(90, 200);
          G.MINI.up(90, 200);
          if (liftArmed) break;
          window.advanceTime(25);
          // Clear fail state if missed so next try is during aim
          if (G.GAME.S.st.energy < 20) G.GAME.S.st.energy = 80;
          G.MINI.start('gym', 1);
          window.advanceTime(step * 25 + 16);
        }
        exited = true;
        G.MINI.home();
        return new Promise((res) => {
          setTimeout(() => {
            G.AUDIO.play = origPlay;
            res({ liftArmed, playedAfterExit });
          }, 350);
        });
      });
      check('6.6 Gym delayed clank SFX armed cleanly and canceled upon exiting to home', rOrphan.liftArmed && !rOrphan.playedAfterExit.includes('clank'), rOrphan);

      // --- 7. DASHA cake dim & ROOMS.night fullscreen coverage + SEASONS orphan timer ---
      const rDim = await page.evaluate(() => {
        const G = window.__game;
        G.HOME.goTo('zal', true);
        G.GAME.S.st.energy = 60;
        G.GAME.S.light = true;
        G.HOME.toggleLight(); // light off in zal -> sleeping + ROOMS.night
        window.advanceTime(100);
        const cv = document.getElementById('cv');
        const ctx = cv.getContext('2d');
        const ty = G.HOME.topY();
        const lum = (y) => { const d = ctx.getImageData(170, y, 1, 1).data; return Math.round((d[0] + d[1] + d[2]) / 3); };
        const ceilLum = lum(Math.max(2, ty - 10));
        const wallLum = lum(ty + 10);
        const shotData = cv.toDataURL('image/png');
        G.HOME.wake();
        return { ty, ceilLum, wallLum, shotData };
      });
      fs.writeFileSync('/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4/r64_zal_night_fullscreen.png', Buffer.from(rDim.shotData.split(',')[1], 'base64'));
      // Notice in zal top corner (x=170), ceiling and wall meet at ty: when light off, ceiling and wall both have dark night tint
      check('7.1 ROOMS.night covers lowered ceiling in zal without uneven double-multiply band', Math.abs(rDim.ceilLum - rDim.wallLum) < 25 && rDim.ceilLum > 30 && rDim.ceilLum < 140, { ty: rDim.ty, ceilLum: rDim.ceilLum, wallLum: rDim.wallLum });

      const rSeasons = await page.evaluate(() => {
        const G = window.__game;
        G.HOME.goTo('zal', true);
        SEASONS.set('spring');
        SEASONS.gag('spring'); // schedules chirp at 1300ms & say at 900ms
        const playedOutside = [];
        const origPlay = G.AUDIO.play;
        let left = true;
        G.AUDIO.play = function (name, a) {
          if (left && name === 'chirp') playedOutside.push(name);
          return origPlay.call(this, name, a);
        };
        G.MINI.start('catch', 1); // immediately leave home into mini-game
        return new Promise((res) => {
          setTimeout(() => {
            G.AUDIO.play = origPlay;
            SEASONS.set(null);
            G.MINI.home();
            res({ playedOutside });
          }, 1450);
        });
      });
      check('7.2 SEASONS delayed chirp SFX does not fire inside mini-game', rSeasons.playedOutside.length === 0, rSeasons);

      // --- 7.3 DASHA cake dim overlay fullscreen coverage ---
      const rCakeDim = await page.evaluate(() => {
        const G = window.__game;
        G.HOME.goTo('zal', true);
        G.DASHA.cakeIn({ age: 24, y: 2026 });
        G.DASHA.blowStart();
        window.advanceTime(1200);
        const cv = document.getElementById('cv');
        const ctx = cv.getContext('2d');
        const lum = (x, y) => { const d = ctx.getImageData(x, y, 1, 1).data; return Math.round((d[0] + d[1] + d[2]) / 3); };
        const topCeilLum = lum(10, 5);
        const botFloorLum = lum(10, cv.height - 5);
        const blow = document.getElementById('blow');
        const blowCss = blow ? getComputedStyle(blow).top : null;
        G.DASHA.abort();
        return { cvH: cv.height, topCeilLum, botFloorLum, blowCss };
      });
      // Normal daytime zal bottom floor is bright (~200 lum), top ceiling ~217 lum; dimmed with #140a24 must drop strongly on BOTH!
      check('7.3 DASHA cake dim covers both lowered ceiling and extended floor', rCakeDim.topCeilLum < 145 && rCakeDim.botFloorLum < 90, rCakeDim);

      // --- 8. REAL POINTER TAPS on Pusya (kitchen), Monty (balcony) ---
      const getFriendPt = (room, id) => page.evaluate(({ room, id }) => {
        const G = window.__game;
        G.HOME.goTo(room, true);
        window.advanceTime(300);
        const cv = document.getElementById('cv');
        const d = G.FRIENDS.drawn.find((q) => q.kind === 'friend' && q.id === id);
        let tap = null;
        if (d) for (let y = 0; y < d.e.h && !tap; y++) for (let x = 0; x < d.e.w && !tap; x++) {
          if (G.FART.hit(d.e, x, y, 0)) tap = { x: d.x0 + x + 0.5, y: d.y0 + y + 0.5 };
        }
        if (!tap) return null;
        const cvR = cv.getBoundingClientRect();
        return {
          cx: cvR.left + (tap.x / 180) * cvR.width,
          cy: cvR.top + ((tap.y + G.HOME.topY()) / cv.height) * cvR.height,
        };
      }, { room, id });

      const pPt = await getFriendPt('kitchen', 'pusya');
      if (pPt) await page.mouse.click(pPt.cx, pPt.cy);
      await page.waitForTimeout(80);
      const pusyaTitle = await page.evaluate(() => {
        const t = (document.querySelector('.mbox h2') || {}).textContent || null;
        document.querySelectorAll('[data-close]').forEach((b) => b.click());
        return t;
      });

      const mPt = await getFriendPt('balcony', 'monty');
      if (mPt) await page.mouse.click(mPt.cx, mPt.cy);
      await page.waitForTimeout(80);
      const montyTitle = await page.evaluate(() => {
        const t = (document.querySelector('.mbox h2') || {}).textContent || null;
        document.querySelectorAll('[data-close]').forEach((b) => b.click());
        return t;
      });
      check('8.1 Real screen taps open Pusya and Monty friend cards', pusyaTitle === 'Пуся' && montyTitle && montyTitle.includes('Монти'), { pusyaTitle, montyTitle, pPt, mPt });

      await ctx.close();
    }

    check('0.0 Zero console/page errors', errs.length === 0, errs);
    const failed = results.filter((r) => !r.pass);
    console.log(`\nSummary: ${results.length - failed.length}/${results.length} passed, ${failed.length} failed`);
    await browser.close();
    srv.close();
    process.exit(failed.length ? 1 : 0);
  } catch (e) {
    console.error('FATAL:', e);
    await browser.close();
    srv.close();
    process.exit(1);
  }
})();
