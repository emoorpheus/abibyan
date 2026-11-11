// Round 9: node test/r9.js [friends,growth,mosq,etagere,voice,ducks,guitar,rug,shop] → test/gallery/r9_*.png. Exit 1 on fail.
const { boot, ok, shot, done, fs } = require('./lib/h.js');
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const G = '/data/game/test/gallery/r9_';
const VOICE_F00 = 538, VOICE_RF0 = 792; // Round 8 bank, this test's in-page estimate of the same 14 recordings: median F0, rms frequency (LOG.md)
// Round 9 #2: the things that are bought now (id → [price, level])
const BUY = { kettle: [40, 1], micro: [90, 2], candles: [35, 1], guitar: [150, 2], vacuum: [200, 3], router: [60, 1], hornets: [80, 2], toys: [70, 2], linux: [60, 2], figsN: [70, 2], figsSP: [90, 3], washer: [180, 3] };
(async () => {
  const { browser, page, errs } = await boot({ hour: 12 }); const E = (f, a) => page.evaluate(f, a);
  const fresh = async (opts = {}) => { const r = await boot(Object.assign({ hour: 12 }, opts)); r.E = (f, a) => r.page.evaluate(f, a); extra.push(r.errs); return r; }, extra = [];
  const own = (E) => E(() => { if (__game.GAME._ownAll) __game.GAME._ownAll(); __adv(100); }); // every bought thing in the flat (the old tests' world)
  const go = (E, r) => E((r) => { __game.UI.closeSheet && __game.UI.closeSheet(); while (__game.UI.hasModal()) __game.UI.closeModal(); __game.HOME.goTo(r, true); __adv(400); }, r);
  const setStage = (E, id) => E((id) => { const G = __game, s = G.GAME.S; s.grow.stage = G.DATA.AGE[id]; s.grow.seen = s.grow.stage; s.kg = G.DATA.KG0 * G.DATA.AGES[s.grow.stage].kg * 1.05; __adv(100); }, id);
  const save = (fs, sp) => fs.writeFileSync(G + sp[0], Buffer.from(sp[1].split(',')[1], 'base64'));

  // ---------- #4 Жучок −15 % · #5 Москит ×1.5 · #7 no dots on Монти's tummy ----------
  if (want('friends')) { try {
    const f = await E(() => { const o = {}; for (const [n, id, op] of [['zhuk', 'zhuk', {}], ['zhukFat', 'zhuk', { fat: 1 }], ['mosq', 'mosq', {}], ['mosqFat', 'mosq', { fat: 1 }]]) o[n] = __bb(FART.sprite(id, op).cv);
      const poses = {}; for (const id of ['zhuk', 'mosq']) poses[id] = ['idle', 'happy', 'talk', 'fly', 'walk', 'brush', 'lift', 'bite'].flatMap((p) => [0, 1].map((fr) => { const e = FART.sprite(id, { pose: p, f: fr }); return [p + fr, __bb(e.cv).w, __bb(e.cv).h]; }));
      return Object.assign(o, { poses }); });
    ok('friends: Жучок ≈15 % smaller (≤ 14×16, was 17×18)', f.zhuk.w <= 14 && f.zhuk.w >= 11 && f.zhuk.h <= 16 && f.zhuk.h >= 13, f.zhuk);
    ok('friends: a well-fed Жучок is still a bit wider', f.zhukFat.w > f.zhuk.w && f.zhukFat.w <= f.zhuk.w + 3, [f.zhuk, f.zhukFat]);
    ok('friends: every Жучок pose stays in his new size', f.poses.zhuk.every(([, w, h]) => w <= 14 && h <= 16), f.poses.zhuk);
    ok('friends: Москит ×1.5 (≈ 22–26 × 22–26, was 15×16)', f.mosq.w >= 21 && f.mosq.w <= 26 && f.mosq.h >= 22 && f.mosq.h <= 26, f.mosq);
    ok('friends: every Москит pose stays ×1.5 (no pose falls back to the tiny map)', f.poses.mosq.every(([, w, h]) => w >= 20 && w <= 27 && h >= 21 && h <= 26), f.poses.mosq);
    ok('friends: a well-fed Москит is wider', f.mosqFat.w > f.mosq.w, [f.mosq, f.mosqFat]);
    const sym = await E(() => { const o = {}; for (const id of ['zhuk', 'mosq']) { const e = FART.sprite(id, {}), d = e.cv.getContext('2d').getImageData(0, 0, e.cv.width, e.cv.height).data, W = e.cv.width; let bad = 0, all = 0;
      for (let y = 0; y < e.cv.height; y++) for (let x = 0; x < W; x++) { const a = d[(y * W + x) * 4 + 3] > 0, b = d[(y * W + W - 1 - x) * 4 + 3] > 0; all++; if (a !== b) bad++; } o[id] = bad; } return o; });
    ok('friends: Жучок and Москит are drawn symmetric', sym.zhuk === 0 && sym.mosq === 0, sym);
    const eyes = await E(() => { const e = FART.sprite('mosq', {}), d = e.cv.getContext('2d').getImageData(0, 0, e.cv.width, e.cv.height).data; let w = 0, k = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { if (d[i] > 230 && d[i + 1] > 230 && d[i + 2] > 220) w++; if (d[i] < 40 && d[i + 1] < 40 && d[i + 2] < 40) k++; } return { w, k, sting: e.sting, mouth: e.mouth, head: e.head }; });
    ok('friends: Москит keeps his big googly eyes (white ≥ 20 px) and the sting in his meta', eyes.w >= 20 && eyes.sting && eyes.mouth && eyes.head, eyes);
    // Монти: no dark dots inside his white tummy (normal and well fed)
    const belly = await E(() => { const o = {}; for (const fat of [0, 0.5, 1]) { const e = FART.sprite('monty', { fat }), W = e.cv.width, H = e.cv.height, d = e.cv.getContext('2d').getImageData(0, 0, W, H).data;
      const wh = (x, y) => { const i = (y * W + x) * 4; return d[i + 3] && d[i] > 225 && d[i + 1] > 215 && d[i + 2] > 195; }, dark = (x, y) => { const i = (y * W + x) * 4; return d[i + 3] && d[i] + d[i + 1] + d[i + 2] < 330; };
      let n = 0; const at = []; for (let y = Math.round(H * 0.55); y < H; y++) for (let x = 1; x < W - 1; x++) { if (!dark(x, y)) continue; let l = 0, r = 0, u = 0, b = 0; for (let k = 1; k <= 4; k++) { if (x - k >= 0 && wh(x - k, y)) l = 1; if (x + k < W && wh(x + k, y)) r = 1; if (y - k >= 0 && wh(x, y - k)) u = 1; if (y + k < H && wh(x, y + k)) b = 1; } if (l && r && u && b) { n++; if (at.length < 6) at.push([x, y]); } }
      o['fat' + fat] = { n, at }; } return o; });
    ok('friends: Монти has no dark dots on his tummy (normal + well fed)', Object.values(belly).every((v) => v.n === 0), belly);
    // the tap still finds the new Москит, the friends at home
    await own(E); await go(E, 'bath'); await E(() => __adv(600));
    const tp = await E(() => { const h = __T().friends.here.find((q) => q.id === 'mosq'); if (!h) return { h }; const e = FART.sprite('mosq', {}); let hit = null;
      for (let dy = -e.h - 4; dy <= 4 && !hit; dy++) for (let dx = -6; dx <= 6 && !hit; dx++) { const r = __game.FRIENDS.at(h.x + dx, h.y + dy); if (r && r.id === 'mosq') hit = [dx, dy]; } return { h, hit }; });
    ok('friends: a tap on the bigger Москит finds him', !!tp.hit, tp);
    await shot(page, G + 'friend_bath.png'); await go(E, 'hall'); await E(() => __adv(600)); await shot(page, G + 'friend_hall.png');
    const sheet = await E(() => { const c = document.createElement('canvas'); c.width = 360; c.height = 70; const x = c.getContext('2d'); x.fillStyle = '#f3ead8'; x.fillRect(0, 0, 360, 70); let px = 6;
      for (const [id, o] of [['zhuk', {}], ['zhuk', { pose: 'happy' }], ['zhuk', { pose: 'fly', f: 1 }], ['zhuk', { fat: 1 }], ['mosq', {}], ['mosq', { pose: 'happy' }], ['mosq', { f: 1 }], ['mosq', { pose: 'bite' }], ['mosq', { fat: 1 }], ['monty', { fat: 1 }]]) { const e = FART.sprite(id, o); x.drawImage(e.cv, px, 66 - e.cv.height); px += e.cv.width + 6; }
      return ['friends_sheet.png', c.toDataURL()]; });
    save(fs, sheet);
  } catch (e) { ok('friends: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #6 he grows less: a small step at every stage, the adult ≈ 57 px ----------
  if (want('growth')) { try {
    const h = await E(() => __game.DATA.AGES.map((A) => __bb(MONKEY.compose({ s: A.s, age: A.age, f: 0.12, cloth: {}, pose: 'idle', eyes: { mode: 'open' }, mouth: 'smile' }).cv).h));
    const st = h.slice(1).map((v, i) => v - h[i]);
    ok('growth: Кроха stays as he is (44 px)', Math.abs(h[0] - 44) <= 1, h);
    ok('growth: every stage only a little taller (+1…3 px)', st.slice(0, -1).every((d) => d >= 1 && d <= 3) && st[st.length - 1] >= 0 && st[st.length - 1] <= 3, { h, st });
    ok('growth: the adult is small now (≈ 57 px, was 70)', h[8] >= 54 && h[8] <= 59, h);
    ok('growth: the legend (stage 10) is no taller than the old 5th stage (58 px)', h[9] <= 58 && h[9] >= h[8], h);
    await E(() => { const D = __game.DATA; const c = document.createElement('canvas'); c.width = 600; c.height = 80; const x = c.getContext('2d'); x.fillStyle = '#f3ead8'; x.fillRect(0, 0, 600, 80);
      D.AGES.forEach((A, i) => { const sp = MONKEY.compose({ s: A.s, age: A.age, f: 0.12, cloth: {}, pose: 'idle', eyes: { mode: 'open' }, mouth: 'smile' }); x.drawImage(sp.cv, Math.round(30 + i * 58 - sp.ox), Math.round(74 - sp.oy)); }); window.__st = c.toDataURL(); });
    save(fs, ['stages.png', await E(() => window.__st)]);
    await own(E); await setStage(E, 'adult'); await go(E, 'zal'); await shot(page, G + 'adult_zal.png');
    await go(E, 'kitchen'); await shot(page, G + 'adult_kitchen.png');
  } catch (e) { ok('growth: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #8 Москит: six legs (3 a side) and a long nose that sticks out below his tummy ----------
  if (want('mosq')) { try {
    const m = await E(() => { const out = {}; for (const [n, o] of [['idle', {}], ['fly', { f: 1 }], ['fat', { fat: 1 }], ['big', { k: 2 }]]) { const e = FART.sprite('mosq', o), W = e.cv.width, H = e.cv.height, d = e.cv.getContext('2d').getImageData(0, 0, W, H).data, m = Math.floor(W / 2);
        const px = (x, y) => { const i = (y * W + x) * 4; return d[i + 3] ? [d[i], d[i + 1], d[i + 2]] : null; }, dark = (x, y) => { const c = px(x, y); return c && c[0] + c[1] + c[2] < 120; };
        // leg chains: dark 8-connected blobs on the left half below the eyes
        const seen = new Set(); let legs = 0; const y0 = Math.round(H * 0.42);
        for (let y = y0; y < H; y++) for (let x = 0; x < m - 1; x++) { if (!dark(x, y) || seen.has(x + ',' + y)) continue; let n = 0; const st = [[x, y]]; seen.add(x + ',' + y);
          while (st.length) { const [a, b] = st.pop(); n++; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const u = a + dx, v = b + dy; if (u < 0 || u >= m - 1 || v < y0 || v >= H || seen.has(u + ',' + v) || !dark(u, v)) continue; seen.add(u + ',' + v); st.push([u, v]); } } if (n >= 3) legs++; }
        // the nose: light cream pixels in the centre column under the mouth; it reaches the very bottom of the sprite
        const cream = (c) => c && c[0] > 215 && c[1] > 185 && c[2] > 130 && c[2] < 215; let nose = 0, low = -1, bodyLow = -1;
        for (let y = e.mouth[1]; y < H; y++) { const c = px(m, y); if (cream(c)) { nose++; low = y; } for (let x = m - 3; x <= m + 3; x++) if (x !== m && px(x, y)) bodyLow = Math.max(bodyLow, y); }
        out[n] = { W, H, legs, nose, low, bodyLow }; } return out; });
    for (const n of ['idle', 'fly', 'fat']) ok(`mosq (${n}): six legs — three on each side`, m[n].legs === 3, m[n]);
    ok('mosq: a long nose (≥ 12 px) from his mouth down…', m.idle.nose >= 12 && m.fat.nose >= 12, m);
    ok('mosq: …sticking out below his tummy (≥ 2 px)', m.idle.low >= m.idle.bodyLow + 2, m.idle);
    ok('mosq: the big portrait (card, duel) has the long nose too (≥ 18 px)', m.big.nose >= 18, m.big);
    await E(() => { const c = document.createElement('canvas'); c.width = 200; c.height = 60; const x = c.getContext('2d'); x.fillStyle = '#f3ead8'; x.fillRect(0, 0, 200, 60); let px = 4;
      for (const o of [{}, { f: 1 }, { pose: 'happy' }, { pose: 'bite' }, { pose: 'lift' }, { fat: 1 }]) { const e = FART.sprite('mosq', o); x.drawImage(e.cv, px, 56 - e.cv.height); px += e.cv.width + 6; } window.__ms = c.toDataURL(); });
    save(fs, ['mosq_sheet.png', await E(() => window.__ms)]);
  } catch (e) { ok('mosq: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #9 / #10 the etagere: no pink-purple figure, no red «чирик-чирик» bird ----------
  if (want('etagere')) { try {
    const F = await E(() => ({ t4: __game.HALL.FIGS[4].map((f) => f[0]), fm: Object.keys(__game.HALL.FM), lines: Object.keys(__game.DATA.LINES).filter((k) => (__game.DATA.LINES[k] || []).some((l) => /чирик/i.test(l))) }));
    ok('etagere: the pink-purple figure is gone', !F.t4.includes('pink') && !F.fm.includes('pink'), F);
    ok('etagere: the red bird («Чирик-чирик!») is gone', !F.t4.includes('bird') && !F.fm.includes('bird') && !F.lines.includes('g_figBird'), F);
    ok('etagere: the rest of the bottom tray stays (Спайк, Скромник, Монти, Хауди-хо, пришелец, Полотенчик, мишка, Гумба)', ['spike', 'shyguy', 'mole', 'hankey', 'alien', 'towel', 'bear', 'goomba'].every((n) => F.t4.includes(n)), F.t4);
    await own(E); await go(E, 'hall'); await E(() => { __game.HOME.mk.x = 40; __adv(300); });
    const px = await E(() => { const sp = __game.ROOMS.spots('hall', __game.GAME.S.home.items).figs, d = document.getElementById('cv').getContext('2d').getImageData(sp[0] - 2, sp[1] - 4, sp[2] + 4, sp[3] + 6).data, bad = ['e878c0', '9a4ac8', '6a3aa8', 'a82424']; let n = 0;
      for (let i = 0; i < d.length; i += 4) { const h = ((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]).toString(16).padStart(6, '0'); if (bad.includes(h)) n++; } return n; });
    ok('etagere: no pink-purple or bird-red pixels on the bottom tray', px === 0, px);
    const said = await E(() => { __spy(); const sp = __game.ROOMS.spots('hall', __game.GAME.S.home.items).figs, out = []; for (let x = sp[0]; x < sp[0] + sp[2]; x += 3) { __game.AUDIO._said.length = 0; __tap(x, sp[1] + sp[3] - 3); __adv(400); out.push(...__game.AUDIO._said); __adv(2600); } return out; });
    ok('etagere: no figure says «Чирик-чирик» any more', !said.some((l) => /чирик/i.test(l)), said);
    await shot(page, G + 'etagere.png');
  } catch (e) { ok('etagere: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #11 his voice a little higher and squeakier · #13 the whine «Э-э-э-э-э!» is his own recording ----------
  if (want('voice')) { try {
    // R8 (tools/f0_banks.py): his recordings median F0 ≈ 496 Hz, TTS ≈ 554 Hz; the in-page estimate of the same 14 clips is the baseline below
    const v = await E(async () => {
      const R = SPEECH.rec, keys = Object.keys(R).sort(), step = Math.max(1, Math.floor(keys.length / 14)), pick = keys.filter((k, i) => i % step === 0).slice(0, 14), f0s = [], rf = [];
      for (const k of pick) { const b = atob(R[k][0]), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
        const buf = await new OfflineAudioContext(1, 22050, 22050).decodeAudioData(u.buffer), d = buf.getChannelData(0), sr = buf.sampleRate, N = Math.round(sr * 0.04); let mx = 0; for (let i = 0; i < d.length; i++) mx = Math.max(mx, Math.abs(d[i]));
        for (let s = 0; s + N * 2 < d.length; s += N) { let e = 0, df = 0; for (let i = 0; i < N; i++) { e += d[s + i] * d[s + i]; const q = d[s + i + 1] - d[s + i]; df += q * q; } if (Math.sqrt(e / N) < mx * 0.12) continue;
          rf.push(Math.sqrt(df / e) * sr / (2 * Math.PI)); const r = []; for (let L = Math.floor(sr / 1100); L <= Math.ceil(sr / 150); L++) { let c = 0, a = 0, b2 = 0; for (let i = 0; i < N; i++) { c += d[s + i] * d[s + i + L]; a += d[s + i] * d[s + i]; b2 += d[s + i + L] * d[s + i + L]; } r.push([L, c / Math.sqrt(a * b2 + 1e-12)]); }
          const best = Math.max(...r.map((q) => q[1])); if (best < 0.75) continue; const L = r.find((q) => q[1] >= best * 0.92)[0]; f0s.push(sr / L); } }
      const med = (a) => { a = a.slice().sort((x, y) => x - y); return Math.round(a[a.length >> 1]); }; return { n: f0s.length, f0: med(f0s), rf: med(rf) }; });
    console.log('voice: recordings F0 / rms-frequency', JSON.stringify(v));
    ok('voice: his recordings are higher — median F0 ≥ +2 semitones over Round 8', v.f0 >= VOICE_F00 * 1.12, { v, base: VOICE_F00 });
    ok('voice: …and squeakier — brighter (rms frequency ≥ 1.15 × Round 8)', v.rf >= VOICE_RF0 * 1.15, { v, base: VOICE_RF0 });
    // the TTS lines (what he has no recording for) play a little higher too, through the same squeaky EQ
    const t = await E(async () => { const A = __game.AUDIO, ac = A.ctx; if (!ac) return { noCtx: 1 }; const L = SPEECH.lines, R = SPEECH.rec || {}, k = Object.keys(L).find((q) => !R[q] && q.length > 6);
      const rates = [], bq = []; const oS = ac.createBufferSource.bind(ac), oB = ac.createBiquadFilter.bind(ac);
      ac.createBufferSource = () => { const s = oS(); const f = s.playbackRate.setValueAtTime.bind(s.playbackRate); s.playbackRate.setValueAtTime = (val, w) => { if (s.buffer && Math.abs(s.buffer.duration - L[k][1]) < 0.2) rates.push(val); return f(val, w); }; return s; };
      ac.createBiquadFilter = () => { const b = oB(); bq.push(b); return b; };
      A.setRate(1); A.say(k); await new Promise((r) => setTimeout(r, 700)); ac.createBufferSource = oS; ac.createBiquadFilter = oB;
      return { k, rates, eq: bq.map((b) => [b.type, Math.round(b.frequency.value), Math.round(b.gain.value)]) }; });
    ok('voice: TTS lines play ≥ 5 % higher (rate ≥ 1.05 at the base voice)', t.rates && t.rates.length && Math.min(...t.rates) >= 1.05, t);
    ok('voice: …through a squeaky EQ (a presence peak ≥ +3 dB at 2.5–4 kHz, the lows cut)', t.eq && t.eq.some((q) => q[0] === 'peaking' && q[1] >= 2500 && q[1] <= 4000 && q[2] >= 3) && t.eq.some((q) => q[0] === 'highpass' && q[1] >= 150), t);
    // #13 the whine
    const W = await E(() => { const R = SPEECH.rec || {}, k = __game.AUDIO._norm('Э-э-э-э-э!'); return { has: !!R[k], dur: R[k] ? R[k][1] : 0 }; });
    ok('whine: his own «Э-э-э-э-э!» recording is in the bank (≥ 1 s)', W.has && W.dur >= 1, W);
    await setStage(E, 'newborn'); await go(E, 'zal');
    const w = await E(async () => { const G = __game, A = G.AUDIO, ac = A.ctx, sp = A._sp; if (!ac) return { noCtx: 1 }; const k = 'R' + A._norm('Э-э-э-э-э!'); sp.cache.delete(k); __spy(); const osc = []; const oO = ac.createOscillator.bind(ac); ac.createOscillator = () => { const o = oO(); osc.push(o); return o; };
      G.GAME.S.sleeping = false; G.HOME.whine(); await new Promise((r) => setTimeout(r, 400)); ac.createOscillator = oO; return { calls: A._calls.slice(), clip: sp.cache.has(k), saw: osc.filter((o) => o.type === 'sawtooth').length, bubble: (document.querySelector('.bubble') || {}).textContent || '' }; });
    ok('whine: a baby whine plays HIS recording (not the synth sawtooth)', w.calls && w.calls.includes('whine') && w.clip && !w.saw, w);
  } catch (e) { ok('voice: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #12 the rubber-duck travellers: papa, three ducklings, mama — slowly all over the flat ----------
  if (want('ducks')) { try {
    const D0 = await E(() => { const D = __game.DUCKS; if (!D) return null; const col = (cv) => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let red = 0, org = 0, yel = 0; for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const r = d[i], g = d[i + 1], b = d[i + 2]; if (r > 190 && g < 90 && b < 100) red++; if (r > 220 && g >= 90 && g < 170 && b < 70) org++; if (r > 220 && g > 180 && b < 120) yel++; } return { red, org, yel }; };
      return { line: D.LINE.map((d) => d.id + ':' + d.kind), route: D.ROUTE.slice(), sz: D.LINE.map((d) => { const cv = D.sprite(d.kind, 0, 1), b = __bb(cv); return Object.assign({ kind: d.kind, w: b.w, h: b.h }, col(cv)); }), rooms: __game.DATA.ROOMS.map((r) => r.id) }; });
    ok('ducks: there is a DUCKS module', !!D0, D0);
    ok('ducks: five travellers in a line — mama first, three ducklings, papa last (Round 11 #4 swapped them)', D0.line.length === 5 && /^mama:/.test(D0.line[0]) && /^papa:/.test(D0.line[4]) && D0.line.slice(1, 4).every((s) => /:(kid|lash)$/.test(s)) && D0.line.filter((s) => /:lash$/.test(s)).length === 1, D0.line);
    const sz = (k) => D0.sz.find((q) => q.kind === k);
    ok('ducks: papa and mama are big (≥ 12 px tall), the ducklings small (≤ 10 px), the eyelash one the smallest', sz('papa').h >= 12 && sz('mama').h >= 12 && sz('kid').h <= 10 && sz('lash').h <= sz('kid').h && sz('lash').w <= sz('kid').w, D0.sz);
    ok('ducks: yellow rubber; papa has an orange beak, mama a red beak + red cheeks', D0.sz.every((q) => q.yel >= 14) /* Round 10: 20–25 % smaller ducks */ && sz('papa').org >= 2 && sz('papa').red === 0 && sz('mama').red >= 6, D0.sz);
    ok('ducks: their route goes through every room', D0.rooms.every((r) => D0.route.includes(r)), D0.route);
    // they move when he changes rooms
    const mv = await E(() => { const G = __game, H = G.HOME, D = G.DUCKS, out = { seen: [], steps: [], jumps: 0 }; H.goTo('kitchen', true); __adv(200); D._place('zal', 20, 1); let prev = JSON.parse(JSON.stringify(D.st())); const rs = ['hall', 'kitchen'];
      for (let i = 0; i < 60; i++) { H.goTo(rs[i % 2], true); __adv(100); const s = D.st(); if (!out.seen.includes(s.room)) out.seen.push(s.room); if (s.room === prev.room) out.steps.push(Math.round((s.x - prev.x) * prev.dir)); else { const a = D.ROUTE.indexOf(prev.room), b = D.ROUTE.indexOf(s.room); if ((a + 1) % D.ROUTE.length !== b) out.jumps++; } prev = JSON.parse(JSON.stringify(s)); } return out; });
    ok('ducks: every room change of his moves the parade on a little (8–40 px)', mv.steps.length >= 5 && mv.steps.filter((d) => d !== 0).every((d) => d >= 8 && d <= 40), mv.steps.slice(0, 12));
    ok('ducks: …and room by room along the route they visit the whole flat', mv.seen.length === D0.rooms.length && mv.jumps === 0, mv);
    // in his room they waddle very slowly, in order: papa ahead, mama at the back
    const slow = await E(() => { const G = __game, D = G.DUCKS; G.HOME.goTo('zal', true); __adv(200); D._place('zal', 60, 1); const a = D.pos().map((p) => p.x); __adv(5000); const b = D.pos(); return { a, b: b.map((p) => [p.id, Math.round(p.x), p.y]), dx: b[0].x - a[0] }; });
    ok('ducks: in his room they waddle slowly (≤ 3 px/s)', slow.dx > 0 && slow.dx <= 15, slow);
    ok('ducks: mama leads, the ducklings follow, papa closes the line (Round 11 #4)', slow.b.every((p, i, a) => !i || p[1] < a[i - 1][1]) && slow.b[0][0] === 'mama' && slow.b[4][0] === 'papa', slow.b);
    await own(E); await E(() => { __game.HOME.mk.x = 140; __game.DUCKS._place('zal', 80, 1); __adv(300); });
    const px = await E(() => { const P = __game.DUCKS.pos(), x0 = Math.min(...P.map((p) => p.x - p.w)), x1 = Math.max(...P.map((p) => p.x + p.w)), y1 = Math.max(...P.map((p) => p.y)), y0 = y1 - 16, d = document.getElementById('cv').getContext('2d').getImageData(x0, y0, x1 - x0, 17).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 220 && d[i + 1] > 170 && d[i + 2] < 110) n++; return { n, P: P.map((p) => [p.id, Math.round(p.x), p.y]) }; });
    ok('ducks: they are drawn on the floor of the room (yellow pixels there)', px.n >= 80, px);
    await shot(page, G + 'ducks_zal.png');
    const tp = await E(() => { __spy(); const D = __game.DUCKS, p = D.pos()[2]; __tap(p.x, p.y - 3); __adv(200); return { calls: __game.AUDIO._calls.slice(), info: D.info(), id: p.id }; });
    ok('ducks: a tap on a duckling — a squeak and a hop', tp.calls.includes('squeak') && tp.info.hop === tp.id, tp);
    for (const r of ['kitchen', 'bath', 'hall', 'balcony']) { await E((r) => { __game.HOME.goTo(r, true); __game.HOME.mk.x = 150; __game.DUCKS._place(r, 70, -1); __adv(400); }, r); await shot(page, G + 'ducks_' + r + '.png'); }
    // they are remembered
    const keep = await E(() => { const G = __game; G.DUCKS._place('bath', 55, -1); G.GAME.save(true); return JSON.parse(localStorage.getItem('martyn_tamagotchi_v1')).ducks; });
    ok('ducks: where they are is saved', keep && keep.room === 'bath' && Math.round(keep.x) === 55 && keep.dir === -1, keep);
  } catch (e) { ok('ducks: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #1 the little ones cannot play the guitar: they slap the closed bag ----------
  if (want('guitar')) { try {
    await own(E);
    for (const id of ['newborn', 'baby', 'toddler']) {
      await setStage(E, id); await go(E, 'zal');
      await E(() => { __spy(); __game.AUDIO._calls.length = 0; const U = __game.UI; if (!U._tw) { const o = U.toast; U._tw = []; U.toast = function (m, ...r) { U._tw.push(m); return o.call(this, m, ...r); }; } U._tw.length = 0; const Z = __game.ZAL; __tap(Z.GTR[0] + Z.GW / 2, Z.GTR[1] + Z.GH - 20); });
      let open = false, shake = false, trip = false, shotDone = false;
      for (let i = 0; i < 70; i++) { const s = await E(() => { __adv(100); const t = __T(); return { g: t.things.guitar, bag: t.things.bag, trip: t.trip ? t.trip.kind : null, act: (__game.HOME.mk.act || {}).name }; });
        if (s.g === 'open') open = true; if (s.bag === 'shake') { shake = true; if (!shotDone && id === 'toddler') { shotDone = true; await shot(page, G + 'guitar_baby.png'); } } if (s.trip === 'guitar') trip = true; }
      const r = await E(() => ({ calls: __game.AUDIO._calls.slice(), toast: __game.UI._tw.join('|'), trip: (__T().trip || {}).kind || null })); // toasts fade after 3 real seconds, so they are spied on
      ok(`guitar: «${id}» walks to the bag and slaps it — a dull «бздынь», the bag shakes`, trip && r.calls.includes('bzdyn') && shake, { trip, shake, calls: r.calls.slice(0, 14) });
      ok(`guitar: «${id}» cannot open it — no strumming, the bag stays closed`, !open && !r.calls.includes('strum') && !r.calls.includes('zip'), { open, calls: r.calls.slice(0, 14) });
      ok(`guitar: «${id}» whines, and a hint says it opens from «Детёныш»`, r.calls.includes('whine') && /Детёныш/.test(r.toast) && !r.trip, r);
    }
    await setStage(E, 'kid'); await go(E, 'zal');
    await E(() => { __game.AUDIO._calls.length = 0; const Z = __game.ZAL; __tap(Z.GTR[0] + Z.GW / 2, Z.GTR[1] + Z.GH - 20); });
    let open = false; for (let i = 0; i < 60; i++) { const g = await E(() => { __adv(100); return __T().things.guitar; }); if (g === 'open') open = true; if (i === 30) await shot(page, G + 'guitar_kid.png'); }
    const c = await E(() => __game.AUDIO._calls.slice());
    ok('guitar: from «Детёныш» he takes it out and plays, as before', open && c.includes('strum') && !c.includes('bzdyn'), c.slice(0, 12));
    await E(() => __adv(4000));
  } catch (e) { ok('guitar: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #3 the rug is cocoa brown; a tap → his own jig: hops, fluff, notes over his head, a giggle, a tune, «та-да» ----------
  if (want('rug')) { try {
    const pal = await E(() => (__game.ZAL.RUG_PAL || []).map((c) => { const n = parseInt(c.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      let h = 0; if (mx !== mn) { if (mx === r) h = 60 * (((g - b) / (mx - mn)) % 6); else if (mx === g) h = 60 * ((b - r) / (mx - mn) + 2); else h = 60 * ((r - g) / (mx - mn) + 4); } return { c, h: Math.round((h + 360) % 360), s: mx ? (mx - mn) / mx : 0, r, b }; }));
    ok('rug: the yarn is cocoa brown — 7 warm brown tones (no lavender)', pal.length === 7 && pal.every((p) => p.h >= 12 && p.h <= 45 && p.s >= 0.2 && p.r > p.b), pal);
    await own(E); await setStage(E, 'kid'); await go(E, 'zal');
    const px = await E(() => { const sp = __game.ROOMS.spots('zal', __game.GAME.S.home.items).rug, d = document.getElementById('cv').getContext('2d').getImageData(sp[0] + 8, sp[1] + 6, sp[2] - 16, sp[3] - 12).data; let br = 0, all = 0;
      for (let i = 0; i < d.length; i += 4) { all++; if (d[i] > d[i + 2] + 12 && d[i] >= d[i + 1]) br++; } return br / all; });
    ok('rug: in the zal it looks brown (≥ 70 % warm pixels)', px >= 0.7, px);
    await shot(page, G + 'rug.png');
    for (const id of ['newborn', 'kid', 'adult']) {
      await setStage(E, id); await go(E, 'zal'); await E(() => { __game.HOME.mk.x = 60; __game.HOME.mk.act = null; __spy(); __game.AUDIO._calls.length = 0; __game.AUDIO._said.length = 0; const sp = __game.ROOMS.spots('zal', __game.GAME.S.home.items).rug; __tap(sp[0] + sp[2] / 2, sp[1] + sp[3] / 2 + 4); });
      let maxT = 0, restarted = false, hops = 0, puffs = 0, notes = [], over = 0, prevJy = 0, sh = false;
      for (let i = 0; i < 60; i++) { const s = await E(() => { __adv(80); const H = __game.HOME, a = H.mk.act, ht = H.headTop(), sp = __game.ROOMS.spots('zal', __game.GAME.S.home.items).rug;
          return { act: a ? a.name : null, t: a ? a.t : 0, jy: H.mk.jy, ht, puffs: H.fx.list.filter((q) => q.type === 'puff' && q.y >= sp[1] - 6 && q.y <= sp[1] + sp[3] + 4).length, notes: H.fx.list.filter((q) => q.type === 'note' && (q.age || 0) < 0.09).map((q) => q.y) }; });
        if (s.act === 'jig') { if (s.t + 0.01 < maxT) restarted = true; maxT = Math.max(maxT, s.t); if (s.jy < -3 && prevJy >= -3) hops++; prevJy = s.jy; puffs = Math.max(puffs, s.puffs); for (const y of s.notes) { notes.push(y - s.ht); } if (!sh && id === 'kid' && s.jy < -4) { sh = true; await shot(page, G + 'rug_jig.png'); } }
        if (i === 12) await E(() => { const sp = __game.ROOMS.spots('zal', __game.GAME.S.home.items).rug; __tap(sp[0] + sp[2] / 2, sp[1] + sp[3] / 2 + 4); }); // a second tap mid-dance
      }
      await E(() => __adv(1500));
      const c = await E(() => __game.AUDIO._calls.slice());
      ok(`rug (${id}): a tap starts his own jig — he hops (≥ 3 hops), fluff flies off the rug`, maxT > 1 && hops >= 3 && puffs >= 1, { maxT, hops, puffs });
      ok(`rug (${id}): notes appear just over HIS head (by his height)`, notes.length >= 2 && notes.every((d) => d <= 4 && d >= -30), notes.map(Math.round));
      ok(`rug (${id}): he giggles, a little tune plays, «та-да» at the end`, c.includes('giggle') && c.includes('jig') && c.includes('tada') && c.indexOf('tada') > c.indexOf('jig'), c.slice(0, 16));
      ok(`rug (${id}): a second tap during the jig does not restart it`, !restarted && c.filter((n) => n === 'jig').length === 1, { restarted, n: c.filter((n) => n === 'jig').length });
    }
  } catch (e) { ok('rug: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #2 the shop: the guitar, the kettle, the microwave, the etagere's things… are bought ----------
  if (want('shop')) { try {
    const D = await E(() => { const o = {}; for (const id in __game.DATA.DECOR) { const d = __game.DATA.DECOR[id]; o[id] = [d.price, d.lvl, d.room, !!d.desc, d.tech ? 1 : 0]; } return o; });
    const miss = Object.keys(BUY).filter((id) => !D[id] || D[id][0] !== BUY[id][0] || D[id][1] !== BUY[id][1]);
    ok('shop: guitar, kettle, microwave, candles, vacuum, router, Hornets, toys, Linux, figurines, washer are for sale at their prices / levels', !miss.length, miss.map((id) => [id, D[id], BUY[id]]));
    ok('shop: every thing in «Дом» has a description', Object.keys(D).every((id) => D[id][3]), Object.keys(D).filter((id) => !D[id][3]));
    // a new game: none of them, the flat's own things still there
    const n = await fresh({ locked: true }); const nE = n.E;
    await nE(() => { const s = __game.GAME.S; s.phone = true; s.tut = __game.DATA.TUT.length; __calm(); __adv(100); });
    const st = await nE((ids) => { const G = __game, S = G.GAME.S, sp = (r) => G.ROOMS.spots(r, S.home.items) || {}; const k = sp('kitchen'), z = sp('zal'), h = sp('hall'), b = sp('bath');
      return { owned: ids.filter((id) => S.owned[id] || G.GAME.placed(id)), spots: { kettle: k.kettle, micro: k.micro, candles: k.candles, router: h.router, hornet: h.hornet, toys: h.toys, linux: h.linux, figs: h.figs, vacuum: h.vacuum, washer: b.washer },
        free: { fridge: !!k.fridge, stove: !!k.stove, fire: !!z.fire, rug: !!z.rug, mirror: !!h.mirror, shower: !!b.shower, toilet: !!b.toilet, aid: !!b.aid, cat: !!b.catrug, sconce: !!b.sconceL } }; }, Object.keys(BUY));
    ok('shop: a new game has none of them', !st.owned.length, st.owned);
    ok('shop: nothing unbought is in the rooms (no spots)', Object.values(st.spots).every((v) => !v), st.spots);
    ok('shop: the furniture and the basics stay free (fridge, stove, fireplace, rug, mirror, shower, toilet, aid kit, cat rug, sconces)', Object.values(st.free).every(Boolean), st.free);
    // unbought: taps do nothing
    const KET = [114, 138, 22, 26], MW = [68, 148, 26, 16]; // Round 14b #9: the counter is lower (top 164)
    const pre = await nE(([KET, MW]) => { const G = __game, H = G.HOME, out = {}; __spy();
      H.goTo('kitchen', true); __adv(300); __tap(KET[0] + 11, KET[1] + 14); __tap(MW[0] + 13, MW[1] + 8); __adv(200); out.kettle = H.things().kettle; out.micro = H.things().micro;
      H.goTo('zal', true); __adv(300); G.GAME.S.grow.stage = G.DATA.AGE.kid; __tap(G.ZAL.GTR[0] + G.ZAL.GW / 2, G.ZAL.GTR[1] + G.ZAL.GH - 20); __adv(300); out.guitarTrip = (__T().trip || {}).kind || null;
      H.goTo('hall', true); __adv(300); __tap(160, 228); __adv(300); out.vac = G.GAGS.info().vacuum; out.vacTrip = (__T().trip || {}).kind || null; out.calls = G.AUDIO._calls.slice(); return out; }, [KET, MW]);
    ok('shop: before buying — the kettle / microwave do not run, no guitar trip, no vacuum ride', pre.kettle === 'off' && pre.micro === 'off' && !pre.guitarTrip && pre.vac === 'dock' && !pre.vacTrip, pre);
    // the rooms without them (screens) and the same spots after buying: the pixels change
    const R = { kettle: ['kitchen', KET], micro: ['kitchen', MW], candles: ['kitchen', [120, 198, 14, 14]], guitar: ['zal', [114, 166, 25, 70]], vacuum: ['hall', [144, 212, 32, 26]], router: ['hall', [144, 112, 22, 22]],
      hornets: ['hall', [134, 115, 42, 15]], toys: ['hall', [134, 140, 42, 16]], linux: ['hall', [144, 171, 22, 12]], figsN: ['hall', [134, 193, 42, 15]], figsSP: ['hall', [134, 193, 42, 15]], washer: ['bath', [136, 176, 44, 52]] };
    const grab = (r) => nE(([room, rc]) => { __game.UI.closeSheet(); while (__game.UI.hasModal()) __game.UI.closeModal(); __game.HOME.goTo(room, true); __game.HOME.mk.x = room === 'hall' ? 40 : 30; __adv(300); return Array.from(document.getElementById('cv').getContext('2d').getImageData(rc[0], rc[1], rc[2], rc[3]).data); }, r);
    for (const room of ['kitchen', 'zal', 'hall', 'bath']) { await nE((r) => { __game.HOME.goTo(r, true); __game.HOME.mk.x = r === 'hall' ? 40 : 30; __adv(400); }, room); await shot(n.page, G + 'shop_empty_' + room + '.png'); }
    await nE(() => { const s = __game.GAME.S; s.coins = 5000; s.lvl = 10; });
    for (const id of Object.keys(BUY)) {
      const a = await grab(R[id]); const b = await nE((id) => ({ ok: __game.GAME.buyDecor(id), placed: __game.GAME.placed(id) }), id); const c = await grab(R[id]);
      let diff = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - c[i]) + Math.abs(a[i + 1] - c[i + 1]) + Math.abs(a[i + 2] - c[i + 2]) > 24) diff++;
      ok(`shop: «${id}» bought → it appears in the ${R[id][0]}`, b.ok && b.placed && diff / (a.length / 4) >= 0.08, { b, diff: Math.round(diff / (a.length / 4) * 100) + '%' });
    }
    for (const room of ['kitchen', 'zal', 'hall', 'bath']) { await nE((r) => { __game.UI.closeSheet(); while (__game.UI.hasModal()) __game.UI.closeModal(); __game.HOME.goTo(r, true); __game.HOME.mk.x = r === 'hall' ? 40 : 30; __adv(400); }, room); await shot(n.page, G + 'shop_bought_' + room + '.png'); }
    const work = await nE(([KET, MW]) => { const G = __game, H = G.HOME, I = () => G.GAGS.info(), out = {}; __spy(); const sp = (r) => G.ROOMS.spots(r, G.GAME.S.home.items);
      H.goTo('kitchen', true); __adv(300); __tap(KET[0] + 11, KET[1] + 14); __adv(100); out.kettle = H.things().kettle; __tap(MW[0] + 13, MW[1] + 8); __adv(100); out.micro = H.things().micro;
      const c = sp('kitchen').candles; __tap(c[0] + c[2] / 2, c[1] + c[3] / 2); __adv(200); out.candles = I().candles;
      H.goTo('hall', true); __adv(300); const h = sp('hall');
      for (const [k, r] of [['router', h.router], ['linux', h.linux]]) { __tap(r[0] + r[2] / 2, r[1] + r[3] - 3); __adv(300); out[k] = I().last; }
      __tap(h.hornet[0] + 4, h.hornet[1] + h.hornet[3] / 2); __adv(300); out.hornet = I().fig; __adv(2500);
      __tap(h.toys[0] + 20, h.toys[1] + h.toys[3] - 3); __adv(300); out.toy = I().fig; __adv(2500);
      __tap(h.figs[0] + 20, h.figs[1] + h.figs[3] - 3); __adv(300); out.fig = I().fig; __adv(2500);
      H.goTo('bath', true); __adv(300); const w = sp('bath').washer; __tap(w[0] + w[2] / 2, w[1] + w[3] / 2); __adv(300); out.wash = !!I().wash;
      H.goTo('zal', true); __adv(300); __tap(G.ZAL.GTR[0] + G.ZAL.GW / 2, G.ZAL.GTR[1] + G.ZAL.GH - 20); __adv(300); out.guitar = (__T().trip || {}).kind || null; __adv(9000);
      H.goTo('hall', true); __adv(300); const v = sp('hall').vacuum; __tap(v[0] + v[2] / 2, v[1] + v[3] / 2); __adv(300); out.vac = ((__T().trip || {}).kind || '') + '/' + I().vacuum; return out; }, [KET, MW]);
    ok('shop: bought things work — kettle boils, microwave runs, candles light', work.kettle === 'boil' && work.micro === 'run' && work.candles === true, work);
    ok('shop: bought things work — router, Linux box, Hornets, toys, figurines hop', work.router === 'router' && work.linux === 'linux' && /^hornet/.test(work.hornet || '') && !!work.toy && !!work.fig, work);
    ok('shop: bought things work — the washer, the guitar (Детёныш), the vacuum ride', work.wash && work.guitar === 'guitar' && /vac|go/.test(work.vac), work);
    // the «Дом» cards: a description and a real picture for each new thing
    const cards = await nE((ids) => { const G = __game, out = {}; for (const r of ['kitchen', 'zal', 'hall', 'bath']) { G.UI.openShop('home', r); for (const id of ids) { const c = document.querySelector(`.card[data-id="${id}"]`); if (c) out[id] = { desc: (c.querySelector('.stp') || {}).textContent || '', img: (c.querySelector('img') || {}).src || '' }; } G.UI.closeSheet(); } return out; }, Object.keys(BUY));
    const imgs = Object.values(cards).map((c) => c.img);
    ok('shop: every new thing has its «Дом» card with a description', Object.keys(BUY).every((id) => cards[id] && cards[id].desc.length >= 8), cards);
    ok('shop: …and its own thumbnail (no two the same)', new Set(imgs).size === imgs.length && imgs.length === Object.keys(BUY).length, imgs.length);
    await nE(() => { __game.UI.openShop('home', 'hall'); __adv(200); }); await n.page.waitForTimeout(700); await n.page.screenshot({ path: G + 'shop_cards.png' }); // (the sheet slides up in real time) await nE(() => __game.UI.closeSheet());
    const gg = await nE(() => (__game.GAGS.ids ? __game.GAGS.ids().length : 0));
    ok('shop: «Всё потрогал» (25 gags) stays reachable with the things bought', gg >= 30, gg);
    await n.browser.close();
    // migration: an old save gets every new thing (owned + placed), one toast; a bought kettle survives a reload
    const old = await fresh({ save: { v: 5, name: 'Абибян', named: true, coins: 10, kg: 2, phone: true, tut: 99, home: { items: { tv: 'none', pc: 'old' } }, room: 'kitchen', grow: { pts: 0, stage: 3, seen: 3, days: 0 } } });
    await old.page.waitForFunction(() => [...document.querySelectorAll('.toast')].some((e) => /магазин/i.test(e.textContent)), null, { timeout: 5000 }).catch(() => { });
    const m = await old.E((ids) => { const S = __game.GAME.S; return { v: S.v, miss: ids.filter((id) => !S.owned[id] || !__game.GAME.placed(id)), toast: [...document.querySelectorAll('.toast')].map((e) => e.textContent).join('|') }; }, Object.keys(BUY));
    ok('shop: a v5 save → v6, keeps every thing it had (owned + placed), with a toast', m.v >= 6 && !m.miss.length && /магазин/i.test(m.toast), m);
    await old.E(() => { __game.GAME.save(true); }); await old.page.reload(); await old.page.waitForTimeout(1200);
    const m2 = await old.E((ids) => { const S = __game.GAME.S; return { miss: ids.filter((id) => !S.owned[id] || !__game.GAME.placed(id)), toast: [...document.querySelectorAll('.toast')].map((e) => e.textContent).join('|') }; }, Object.keys(BUY));
    ok('shop: after a reload — the things stay, the toast does not come back', !m2.miss.length && !/магазин/i.test(m2.toast), m2);
    await old.browser.close();
    const k6 = await fresh({ save: { v: 6, name: 'Абибян', named: true, coins: 10, kg: 2, phone: true, tut: 99, owned: { kettle: 1 }, home: { items: { tv: 'none', pc: 'old', kettle: 1 } }, room: 'kitchen', grow: { pts: 0, stage: 3, seen: 3, days: 0 } } });
    await k6.page.waitForTimeout(2600); // the refund toast would be up by now
    const k = await k6.E(() => { const S = __game.GAME.S; return { coins: S.coins, owned: !!S.owned.kettle, placed: __game.GAME.placed('kettle'), toast: [...document.querySelectorAll('.toast')].map((e) => e.textContent).join('|') }; });
    ok('shop: a kettle bought in v6 is not taken away (the old polka-dot refund is only for old saves)', k.owned && k.placed && k.coins < 10 + 60 && !/горошек/.test(k.toast), k); // (the daily gift / achievements may add a few coins)
    await k6.browser.close();
    const k4 = await fresh({ save: { v: 4, name: 'Абибян', named: true, coins: 10, kg: 2, phone: true, tut: 99, owned: { kettle: 1 }, home: { items: { tv: 'none', pc: 'old', kettle: 'dots' } }, room: 'kitchen', grow: { pts: 0, stage: 0, seen: 0, days: 0 } } });
    const k2 = await k4.E(() => { const S = __game.GAME.S; return { coins: S.coins, owned: !!S.owned.kettle, placed: __game.GAME.placed('kettle') }; });
    ok('shop: an old polka-dot kettle is still refunded (60), and the new glass one is given', k2.coins >= 70 && k2.owned && k2.placed, k2);
    await k4.browser.close();
  } catch (e) { ok('shop: crashed — ' + String(e.message).split('\n')[0], false); } }
  for (const a of extra) errs.push(...a);
  await done(errs, browser);
})().catch((e) => { console.error(e); console.log('ERRORS'); process.exit(1); });
