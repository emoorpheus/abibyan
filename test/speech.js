// checks the SPEECH bank: every game line is pre-spoken, typed text is composed, all clips decode
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const { execSync } = require('child_process');
(async () => {
  const lines = JSON.parse(execSync('node /data/game/tools/lines.js', { cwd: '/data' }).toString());
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file:///data/game/dist/index.html'); await page.waitForTimeout(800);
  const r = await page.evaluate(async (lines) => {
    const { AUDIO } = window.__game; AUDIO.set('music', false); AUDIO.init(); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const missing = lines.filter((l) => { const p = AUDIO._plan(l).filter((s) => !s.gap); return !(p.length && p.every((s) => 'LR'.includes(s.id[0]))); }); // Round 8: a line is pre-spoken by the TTS (L) or recorded (R), whole or sentence by sentence
    const typed = ['Привет, Абибян! Я тебя люблю', 'Маша самая лучшая', 'Сегодня 25 градусов', 'крокодильчик Гена', 'ok, lol', 'Ты кто?', 'взбзднуть'];
    const plans = typed.map((t) => ({ t, segs: AUDIO._plan(t).filter((s) => !s.gap).map((s) => s.id).join(' ') }));
    // decode every line + fx + a sample of words / syllables
    const ac = AUDIO.ctx, S = window.SPEECH || null; let ok = 0, bad = [];
    const dec = async (id, b64) => { try { const u = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); const b = await ac.decodeAudioData(u.buffer); if (b.duration > 0.05) ok++; else bad.push(id); } catch (e) { bad.push(id); } };
    const SP = typeof SPEECH !== 'undefined' ? SPEECH : null;
    if (SP) {
      for (const k in SP.lines) await dec('L' + k, SP.lines[k][0]);
      for (const k in SP.rec || {}) await dec('R' + k, SP.rec[k][0]); // Round 8: his recordings
      for (const k in SP.fx) for (const e of SP.fx[k]) await dec('F' + k, e[0]);
      const wk = Object.keys(SP.words); for (let i = 0; i < wk.length; i += 7) await dec('W' + wk[i], SP.words[wk[i]][0]);
      for (const k in SP.syl) await dec('S' + k, SP.syl[k][0]);
    }
    const t0 = performance.now(); const res = AUDIO.say('Привет, Абибян! Я тебя люблю'); await sleep(200); const env = [0.2, 0.4, 0.6, 0.8].map((x) => res.env(x).toFixed(2));
    return { missing, plans, ok, bad, nLines: SP && Object.keys(SP.lines).length, nWords: SP && Object.keys(SP.words).length, nSyl: SP && Object.keys(SP.syl).length, dur: res && res.dur, env };
  }, lines);
  console.log(JSON.stringify(r, null, 1));
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
  await browser.close(); process.exit(r.missing.length || r.bad.length || errs.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
