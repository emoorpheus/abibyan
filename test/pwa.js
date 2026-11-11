const { chromium } = require('/vercel/sandbox/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('http://localhost:8775/'); await page.waitForTimeout(2500);
  const r = await page.evaluate(async () => ({ title: document.title, sw: !!(await navigator.serviceWorker.getRegistration()), ctrl: !!navigator.serviceWorker.controller, man: document.querySelector('link[rel=manifest]') && document.querySelector('link[rel=manifest]').href }));
  await page.reload(); await page.waitForTimeout(1500);
  const r2 = await page.evaluate(() => ({ ctrl: !!navigator.serviceWorker.controller, keys: caches.keys() }));
  const keys = await page.evaluate(() => caches.keys());
  console.log(JSON.stringify(r), JSON.stringify({ ctrl: r2.ctrl, keys }), errs.length ? errs.join('\n') : 'no errors');
  await browser.close(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
