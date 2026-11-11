// usage: node zoom.js <url> <out.png> <x> <y> <w> <h> [evalJS] [waitMs] [vw] [vh] [dsf]
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
(async () => {
  const [url, out, x, y, w, h, ev = '', wait = '800', vw = '390', vh = '844', dsf = '3'] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: +vw, height: +vh }, deviceScaleFactor: +dsf });
  const errs = []; page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto(url); await page.waitForTimeout(+wait);
  if (ev) { try { const r = await page.evaluate(ev); if (r !== undefined) console.log('eval:', JSON.stringify(r).slice(0, 1500)); } catch (e) { errs.push('eval: ' + e.message); } await page.waitForTimeout(400); }
  await page.screenshot({ path: out, clip: { x: +x, y: +y, width: +w, height: +h } });
  console.log(errs.length ? errs.join('\n') : 'no console errors'); await browser.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
