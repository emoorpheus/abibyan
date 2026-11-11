// Round 21: node test/r21.js [voice,size,play] → exit 1 on fail. The owner listened to the Round 20 A/B and picked B:
// lines, reactions and his recordings 32 kbit/s, typed-text words and syllables 24 kbit/s — the same clips (keys, durations), a lighter voice.
const { ok, done, want, fs, boot } = require('./lib/h.js');
const path = require('path'), vm = require('vm');
const W = want(), ROOT = path.join(__dirname, '..'), DIST = path.join(ROOT, 'dist'), errs = []; let browser = null;
const bank = () => { const c = {}; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/speech.js'), 'utf8') + '\n' + fs.readFileSync(path.join(ROOT, 'src/voice_rec.js'), 'utf8') + '\nthis.S = SPEECH;', c); return c.S; };
const BR2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160], SR2 = [22050, 24000, 16000];
function head(b64) { const b = Buffer.from(b64.slice(0, 16), 'base64'); if (b[0] !== 0xff || (b[1] & 0xe0) !== 0xe0 || ((b[1] >> 1) & 3) !== 1) return null; const v = (b[1] >> 3) & 3; if (v !== 2) return { v }; return { kbps: BR2[b[2] >> 4], sr: SR2[(b[2] >> 2) & 3] }; }
(async () => {
  try {
    if (W('voice')) {
      const S = bank(), ref = JSON.parse(fs.readFileSync(path.join(__dirname, 'r21_bank_ref.json'), 'utf8'));
      const clips = (k) => k === 'fx' ? [].concat(...Object.values(S.fx)).map((x) => x[0]) : Object.values(S[k]).map((x) => x[0]);
      const rates = {}; for (const k of ['lines', 'fx', 'rec', 'words', 'syl']) { const r = {}; for (const c of clips(k)) { const h = head(c); const key = h ? h.kbps + 'k@' + h.sr : 'bad'; r[key] = (r[key] || 0) + 1; } rates[k] = r; }
      const only = (k, want) => Object.keys(rates[k]).length === 1 && rates[k][want] > 0;
      ok(`voice: game lines, reactions and his recordings are 32 kbit/s (was 40): ${JSON.stringify([rates.lines, rates.fx, rates.rec])}`, only('lines', '32k@22050') && only('fx', '32k@22050') && only('rec', '32k@22050'), rates);
      ok(`voice: typed-text words and syllables are 24 kbit/s (was 32): ${JSON.stringify([rates.words, rates.syl])}`, only('words', '24k@22050') && only('syl', '24k@22050'), rates);
      let same = true, diff = []; for (const k of ['lines', 'words', 'syl', 'fx', 'rec']) { const a = Object.keys(ref[k]).sort().join('|'), b = Object.keys(S[k]).sort().join('|'); // r22: new game lines may be added (her birthday), the old ones stay as they were
        if (k === 'lines' ? !Object.keys(ref[k]).every((x) => x in S[k]) : a !== b) { same = false; diff.push(k + ' keys'); continue; }
        for (const key in ref[k]) { const v = S[k][key], d = k === 'fx' ? v.map((x) => x[1]) : k === 'syl' ? [v[1], v[2]] : v[1]; if (JSON.stringify(d) !== JSON.stringify(ref[k][key])) { same = false; if (diff.length < 5) diff.push(k + ':' + key); } } }
      ok('voice: the same clips as before — every key and every duration (and syllable cut) unchanged (new lines only added)', same, diff);
      const chars = ['lines', 'fx', 'rec', 'words', 'syl'].reduce((n, k) => n + clips(k).reduce((m, c) => m + c.length, 0), 0);
      ok(`voice: the whole voice weighs ${(chars / 1048576).toFixed(2)} MB of base64 (A was 10.16, the A/B page promised B ≈ 7.9)`, chars / 1048576 < 8.3 && chars / 1048576 > 7.4, chars);
    }
    if (W('size')) {
      const one = fs.statSync(path.join(DIST, 'abibyan.html')).size, v1 = fs.statSync(path.join(DIST, 'site/voice1.txt')).size, v2 = fs.statSync(path.join(DIST, 'site/voice2.txt')).size;
      ok(`size: the one-file game abibyan.html is ${(one / 1048576).toFixed(1)} MB (was 11.3)`, one < 9.6 * 1048576, one);
      ok(`size: the website's voice files are ${((v1 + v2) / 1048576).toFixed(1)} MB (was 10.2)`, v1 + v2 < 8.4 * 1048576, { v1, v2 });
    }
    if (W('play')) {
      const r = await boot(); browser = r.browser; r.page.on('pageerror', (e) => errs.push(e.message));
      const v = await r.page.evaluate(async () => { const A = __game.AUDIO; A.set('music', false); A.init(); const dec = async (b64) => { try { const u = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); return +(await A.ctx.decodeAudioData(u.buffer)).duration.toFixed(2); } catch (e) { return 0; } };
        const pick = (o, i) => o[Object.keys(o)[i]]; const d = [await dec(pick(SPEECH.lines, 7)[0]), await dec(pick(SPEECH.words, 40)[0]), await dec(pick(SPEECH.syl, 3)[0]), await dec(pick(SPEECH.rec, 5)[0]), await dec(pick(SPEECH.fx, 0)[0][0])];
        const a = A.say('Привет! Я так скучал!'), b = A.say('мама банан друг'); return { ready: SPEECH.ready, d, a: a && a.dur, b: b && b.dur }; });
      ok(`play: a line, a word, a syllable, his recording and a reaction decode in the game (${v.d.join(', ')} s), say() speaks lines and typed text`, v.ready === 3 && v.d.every((x) => x > 0.05) && v.a > 0.5 && v.b > 0.5, v);
      await browser.close(); browser = null;
    }
  } catch (e) { ok('r21: crashed — ' + String(e.message).split('\n')[0], false); }
  await done(errs, { close: async () => { if (browser) await browser.close(); } });
})();
