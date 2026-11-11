// usage: node shot.js <url> <out.png> [w] [h] [evalJS] [waitMs]
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
(async () => {
  const [url, out, w = '900', h = '900', ev = '', wait = '300'] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await page.goto(url);
  await page.waitForTimeout(+wait);
  if (ev) { try { const r = await page.evaluate(ev); if (r !== undefined) console.log('eval:', JSON.stringify(r).slice(0, 2000)); } catch (e) { errs.push('eval error: ' + e.message); } await page.waitForTimeout(200); }
  await page.screenshot({ path: out, fullPage: true });
  console.log(errs.length ? errs.join('\n') : 'no console errors');
  await browser.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
