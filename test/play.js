// random-input soak test for each mini-game
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on('pageerror', e => errs.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto('file:///data/game/dist/index.html'); await page.waitForTimeout(700);
  await page.evaluate(() => { document.querySelector('#nm-ok').click(); }); await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelectorAll('[data-close]').forEach(b => b.click()));
  const games = ['catch', 'vine', 'balloon', 'bongo', 'gym'];
  for (const g of games) {
    await page.evaluate((g) => { __game.GAME.S.st.energy = 100; __game.MINI.start(g, 1); }, g);
    await page.waitForTimeout(600);
    const t0 = Date.now(); let over = false;
    while (Date.now() - t0 < 14000) {
      const r = Math.random();
      if (g === 'catch' || g === 'vine') { const k = r < 0.5 ? 'ArrowLeft' : 'ArrowRight'; await page.keyboard.down(k); await page.waitForTimeout(150 + Math.random() * 300); await page.keyboard.up(k); }
      else if (g === 'balloon') { await page.mouse.click(195, 400); await page.waitForTimeout(260 + Math.random() * 120); }
      else if (g === 'bongo') { await page.keyboard.press(['Digit1', 'Digit2', 'Digit3', 'Digit4'][Math.floor(r * 4)]); await page.waitForTimeout(300); }
      else if (g === 'gym') { await page.keyboard.press('Space'); await page.waitForTimeout(400 + Math.random() * 400); }
      over = await page.evaluate(() => !!document.querySelector('#r-home'));
      if (over) break;
    }
    const st = await page.evaluate(() => __game.MINI.st && { level: __game.MINI.st.level, coins: __game.MINI.st.coins, hearts: __game.MINI.st.hearts, over: __game.MINI.st.over });
    console.log(g, 'over:', over, JSON.stringify(st));
    await page.screenshot({ path: '/data/game/test/shots/play_' + g + '.png' });
    await page.evaluate(() => { const b = document.querySelector('#r-home'); if (b) b.click(); else __game.MINI.home(); });
    await page.waitForTimeout(500);
  }
  const s = await page.evaluate(() => ({ coins: __game.GAME.S.coins, best: __game.GAME.S.best, energy: __game.GAME.S.st.energy, clean: __game.GAME.S.st.clean, scene: __game.APP.scene }));
  console.log(JSON.stringify(s)); console.log(errs.length ? errs.join('\n') : 'no errors');
  await browser.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
