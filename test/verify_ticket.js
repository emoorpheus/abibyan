const { chromium } = require('/vercel/sandbox/node_modules/playwright');
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
    const title = m.querySelector('.t-title');
    const desc = m.querySelector('.t-desc');
    const meta = m.querySelector('.t-meta');
    const btnSlava = m.querySelector('#btn-show-slava');
    const btnPdf = m.querySelector('a[href*="pdf"]');
    return {
      title: title ? title.textContent : null,
      desc: desc ? desc.textContent : null,
      meta: meta ? meta.textContent : null,
      hasBtnSlava: !!btnSlava,
      hasBtnPdf: !!btnPdf
    };
  });

  console.log('Step 2 (Ticket modal opened):', ticketInfo);
  if (!ticketInfo || !ticketInfo.title.includes('Праздничный ужин')) {
    throw new Error('Ticket modal title mismatch');
  }
  if (!ticketInfo.meta.includes('Любой день по твоему выбору')) {
    throw new Error('Date "Любой день по твоему выбору" missing');
  }
  if (ticketInfo.desc.includes('Все заботы')) {
    throw new Error('Found forbidden phrase "Все заботы" in desc');
  }

  // Screenshot the ticket in game modal
  await page.screenshot({ path: SHOT });
  console.log('Screenshot saved to', SHOT);

  // Test click "Предъявить Славе"
  await page.click('#btn-show-slava');
  await page.waitForTimeout(300);

  const slavaState = await page.evaluate(() => {
    const b = document.querySelector('#btn-show-slava');
    return b ? b.textContent : null;
  });
  console.log('Step 3 (Presented to Slava):', slavaState);
  if (!slavaState.includes('Предъявлено')) {
    throw new Error('Button state did not change after presentation');
  }

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
