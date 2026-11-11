// records a short demo of the in-game voice at each growth stage -> /data/game/test/shots/voice_demo.webm
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file:///data/game/dist/index.html'); await page.waitForTimeout(800);
  const b64 = await page.evaluate(async () => {
    const { AUDIO, GAME, HOME } = window.__game; const S = GAME.S;
    AUDIO.set('music', false); AUDIO.init(); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    await sleep(300);
    const quiet = () => { HOME.mk.nextTalk = 999; HOME.mk.nextIdle = 999; S.want = null; S.nextWant = Date.now() + 1e9; };
    quiet(); await sleep(300);
    const ac = AUDIO.ctx, dest = ac.createMediaStreamDestination(); AUDIO._out.connect(dest);
    const rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 }); const chunks = [];
    rec.ondataavailable = (e) => chunks.push(e.data); rec.start(); await sleep(300);
    const seq = [[0, 'Агу! Ты пришёл!'], [0, 'Абибя-а-ан!'], [0, 'Хочу молочка!'], [0, '#giggle'], [0, 'Почеши мне пузико!'], [0, 'Я расту?'], [1, 'Поиграем в лианы?'], [1, 'Смотри, как я умею!'], [2, 'Можно мне шаурму?'], [3, 'Привет! Я так скучал!'], [3, 'Я голодный!', 'sad'], [3, '#yawn'], [3, 'Эх, сейчас бы на диванчик...', '', 16], [0, '>Привет, Абибян! Я тебя люблю'], [0, '>Маша самая лучшая'], [0, '>Сколько тебе лет?']];
    for (const [stage, text, mood, kg] of seq) {
      S.grow.stage = stage; S.kg = kg || DATA_KG(stage); quiet(); await sleep(60);
      let d; if (text[0] === '#') { AUDIO.play(text.slice(1)); d = 1.1; } else { const r = AUDIO.say(text.replace(/^>/, ''), { mood }); d = r ? r.dur : 1; }
      await sleep(d * 1000 + 520);
    }
    function DATA_KG(st) { return 8 * window.__game.DATA.AGES[st].kg; }
    rec.stop(); await new Promise((r) => (rec.onstop = r));
    const buf = new Uint8Array(await new Blob(chunks).arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000)); return btoa(s);
  });
  fs.writeFileSync('/data/game/test/shots/voice_demo.webm', Buffer.from(b64, 'base64'));
  console.log(errs.length ? errs.join('\n') : 'no errors'); await browser.close(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
