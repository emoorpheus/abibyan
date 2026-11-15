const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/local/bin/chromium',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

  console.log('Navigating to http://127.0.0.1:8080/test.html...');
  await page.goto('http://127.0.0.1:8080/test.html');
  
  // Wait for speech bank to be ready
  await page.waitForFunction(() => window.__game && window.__game.AUDIO && (window.__game.AUDIO.voiceState().ready & 1), { timeout: 15000 });
  await page.waitForTimeout(500);

  // 1. Verify Audio & Voice
  const audioInfo = await page.evaluate(() => {
    const ac = __game.AUDIO;
    const vs = ac.voiceState();
    return {
      voiceReady: vs.ready,
      acRunning: ac ? true : false
    };
  });
  console.log('Audio Info:', audioInfo);

  // Play a speech line
  const voiceTest = await page.evaluate(async () => {
    const res = __game.AUDIO.say('привет я так скучал');
    return {
      ok: !!res,
      dur: res ? res.dur : 0
    };
  });
  console.log('Voice Say Test:', voiceTest);

  // 2. Test Zhuk Walking in Kitchen (Path avoiding table and chairs)
  console.log('Testing Zhuk kitchen path to Pusya...');
  await page.evaluate(() => {
    const s = __game.GAME.S;
    s.home.room = 'kitchen';
    __game.HOME.goTo('kitchen', true);
  });
  await page.waitForTimeout(500);

  // Start guest visit: Zhuk to Pusya
  const zhukPathLogs = await page.evaluate(async () => {
    const logs = [];
    __game.FRIENDS._reset();
    __game.FRIENDS._guest('zhuk', 'pusya');
    
    for (let i = 0; i < 80; i++) {
      window.advanceTime(50);
      const z = __game.FRIENDS._F.zhuk;
      if (z) {
        logs.push({ x: Math.round(z.x), y: Math.round(z.y), path: !!z.path });
      }
    }
    return logs;
  });

  let collided = false;
  for (const pt of zhukPathLogs) {
    if (pt.x >= 106 && pt.x <= 178 && pt.y >= 180 && pt.y <= 258) {
      collided = true;
      console.log('COLLISION at', pt);
    }
  }

  console.log('Total tracked points:', zhukPathLogs.length);
  for (let i = 0; i < zhukPathLogs.length; i += 10) {
    console.log(`  pt[${i}]: x=${zhukPathLogs[i].x}, y=${zhukPathLogs[i].y}, path=${zhukPathLogs[i].path}`);
  }

  if (collided) {
    console.log('FAIL: Zhuk passed through table/chair zone!');
  } else {
    console.log('PASS: Zhuk steered completely clear of table/chair zone!');
  }

  console.log('Errors:', errs);
  await browser.close();
})();
