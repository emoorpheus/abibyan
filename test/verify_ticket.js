let chromium;
try {
  chromium = require('playwright').chromium;
} catch (e) {
  try {
    chromium = require('/vercel/sandbox/node_modules/playwright').chromium;
  } catch (e2) {
    chromium = require('/Users/emoorpheus/Library/Caches/pnpm/dlx/a22d3c450bc2b9b728685c96a1951453/mw4wy74h-3mp/node_modules/playwright').chromium;
  }
}
const path = require('path'), fs = require('fs');

const ROOT = path.join(__dirname, '..');
const FILE = 'file://' + path.join(ROOT, 'dist', 'abibyan-test.html');
const SHOT = path.join(ROOT, 'dist', 'game_ticket_modal.png');

(async () => {
  const chromePath = fs.existsSync('/usr/local/bin/chromium') ? '/usr/local/bin/chromium' : '/Users/emoorpheus/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
  const browser = await chromium.launch({
    executablePath: chromePath,
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });

  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') console.error('CONSOLE ERROR:', m.text());
  });

  await page.goto(FILE, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game && __game.APP);
  await page.waitForTimeout(600);

  // Close intro / gift if open
  await page.evaluate(() => {
    const b = document.querySelector('#nm-ok');
    if (b) b.click();
    while (__game.UI.hasModal()) __game.UI.closeModal();
  });
  await page.waitForTimeout(500);

  // Set all 24 hearts as found
  const res = await page.evaluate(() => {
    const G = __game;
    const D = G.DASHA;
    const st = G.GAME.S.dasha;
    st.gift = '1';
    G.DATA.DASHA.secrets.forEach((s) => { s.text = 'Секрет ' + s.n; });
    for (let i = 1; i <= 24; i++) { st.found[i] = Date.now(); }
    G.GAME.save(true);

    // Open card 24
    D.card(24);
    const m = document.querySelector('#modal');
    const btnTicket = m ? m.querySelector('#btn-ticket') : null;
    return {
      hasModal: !!m,
      foundN: D.foundN(),
      btnTicketText: btnTicket ? btnTicket.textContent : null
    };
  });

  console.log('Step 1 (Card 24 opened):', res);
  if (!res.btnTicketText || !res.btnTicketText.includes('билет в ресторан')) {
    throw new Error('Button to get ticket not found on card 24!');
  }

  // Click "Получить билет в ресторан"
  await page.click('#btn-ticket');
  await page.waitForTimeout(400);

  // Check ticket modal content
  const ticketInfo = await page.evaluate(() => {
    const m = document.querySelector('#modal');
    if (!m) return null;
    const img = m.querySelector('.ticket-card-img');
    const btnPdf = m.querySelector('a[href*="pdf"]');
    const btnImg = m.querySelector('a[href*="png"]');
    const btnSlava = m.querySelector('#btn-show-slava');
    return {
      hasImg: !!img,
      imgSrc: img ? img.src.slice(0, 40) : null,
      hasBtnPdf: !!btnPdf,
      hasBtnImg: !!btnImg,
      hasBtnSlava: !!btnSlava
    };
  });

  console.log('Step 2 (Ticket modal opened):', ticketInfo);
  if (!ticketInfo || !ticketInfo.hasImg) {
    throw new Error('Ticket card image missing in modal');
  }
  if (!ticketInfo.hasBtnPdf) {
    throw new Error('Print PDF button missing');
  }
  if (ticketInfo.hasBtnSlava) {
    throw new Error('Button "Предъявить Славе" must be removed per user instruction');
  }

  // Screenshot the ticket in game modal
  await page.screenshot({ path: SHOT });
  console.log('Screenshot saved to', SHOT);

  // Test Album banner
  await page.evaluate(() => {
    while (__game.UI.hasModal()) __game.UI.closeModal();
    __game.UI.openAlbum('hearts');
  });
  await page.waitForTimeout(400);

  const albumState = await page.evaluate(() => {
    const banner = document.querySelector('#album-ticket-btn');
    return { hasBanner: !!banner, bannerText: banner ? banner.textContent : null };
  });
  console.log('Step 4 (Album ticket banner):', albumState);
  if (!albumState.hasBanner) {
    throw new Error('Album banner missing for 24/24 found hearts');
  }

  await browser.close();
  console.log('ALL TICKET VERIFICATION CHECKS PASSED SUCCESSFULLY!');
})();
