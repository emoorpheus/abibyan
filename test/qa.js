// usage: node qa.js <steps.json> [vw=390] [vh=844] [dsf=1]
// steps: [{eval?:string, wait?:ms, shot?:'name.png', clip?:[x,y,w,h], click?:[x,y], key?:string, drag?:[[x,y],[x,y],...], tag?:string}]
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const fs = require('fs');
(async () => {
  const [file, vw = '390', vh = '844', dsf = '1'] = process.argv.slice(2);
  const steps = JSON.parse(fs.readFileSync(file, 'utf8'));
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext({ viewport: { width: +vw, height: +vh }, deviceScaleFactor: +dsf, hasTouch: false });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.goto('file:///data/game/dist/index.html');
  await page.waitForTimeout(700);
  for (const s of steps) {
    try {
      if (s.eval) { const r = await page.evaluate(s.eval); if (r !== undefined && r !== null) console.log((s.tag || 'eval') + ':', JSON.stringify(r).slice(0, 1500)); }
      if (s.click) await page.mouse.click(s.click[0], s.click[1]);
      if (s.clickSel) await page.click(s.clickSel, { timeout: 2000 });
      if (s.clickJS) { const c = await page.evaluate(s.clickJS); await page.mouse.click(c[0], c[1]); }
      if (s.dragJS) {
        const pts = await page.evaluate(s.dragJS); await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down(); await page.waitForTimeout(60);
        for (const p of pts.slice(1)) { await page.mouse.move(p[0], p[1], { steps: s.steps || 6 }); await page.waitForTimeout(s.dt || 40); }
        if (s.holdShot) { await page.waitForTimeout(s.holdWait || 250); await page.screenshot({ path: '/data/game/test/shots/' + s.holdShot }); }
        await page.mouse.up();
      }
      if (s.drag) { await page.mouse.move(...s.drag[0]); await page.mouse.down(); for (const p of s.drag.slice(1)) { await page.mouse.move(p[0], p[1], { steps: 6 }); await page.waitForTimeout(40); } await page.mouse.up(); }
      if (s.key) await page.keyboard.press(s.key);
      if (s.wait) await page.waitForTimeout(s.wait);
      if (s.shot) await page.screenshot({ path: '/data/game/test/shots/' + s.shot, ...(s.clip ? { clip: { x: s.clip[0], y: s.clip[1], width: s.clip[2], height: s.clip[3] } } : {}) });
    } catch (e) { errs.push('step error (' + (s.tag || s.shot || s.eval || '').toString().slice(0, 60) + '): ' + e.message); }
  }
  console.log(errs.length ? errs.join('\n') : 'no console errors');
  await browser.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
