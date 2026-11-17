'use strict';
// ===== WebAudio: SFX, monkey voice (SPEECH, tools/tts.py) + synth fallback, chiptune music, mic repeat =====
const AUDIO = (() => {
  let ac = null, master, sfxG, musG, voxG, noiseBuf; const st = { sfx: true, music: true };
  // Round 20 (ios-safari-quirks): main.js calls init() on pointerdown AND on pointerup / touchend / click / keys — on a phone only the
  // latter count as a gesture, and iOS wants resume() plus a sound started right inside it (one silent sample; older iPhones need it)
  let unlockedN = 0;
  function silent() { try { const b = ac.createBuffer(1, 1, 22050), src = ac.createBufferSource(); src.buffer = b; src.connect(ac.destination); src.start(0); unlockedN++; } catch (e) { } }
  function init() {
    if (ac) { if (ac.state !== 'running' && ac.state !== 'closed') { try { const p = ac.resume(); if (p && p.catch) p.catch(() => { }); } catch (e) { } silent(); } return true; } // iOS: 'interrupted' after calls/background
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
    try { const p = ac.resume(); if (p && p.catch) p.catch(() => { }); } catch (e) { } // iOS: a fresh context starts 'suspended' — resume inside the first gesture, not only at the mic scene
    silent();
    master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(master);
    sfxG = ac.createGain(); sfxG.gain.value = st.sfx ? 0.55 : 0; sfxG.connect(comp);
    voxG = ac.createGain(); voxG.gain.value = st.sfx ? 0.65 : 0; voxG.connect(comp);
    musG = ac.createGain(); musG.gain.value = st.music ? 0.16 : 0; musG.connect(comp);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (st.music) music.start();
    if (SP.ok) setTimeout(warm, 50); // warm up the decoder (again when the voice arrives — Round 19)
    return true;
  }
  const now = () => ac.currentTime;
  function tone(f, dur, o = {}) {
    if (!ac || !st.sfx) return; const t = now() + (o.delay || 0);
    const osc = ac.createOscillator(), g = ac.createGain(); osc.type = o.type || 'square'; osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
    if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.05); }
    const v = o.vol === undefined ? 0.3 : o.vol, a = o.a || 0.005; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); if (o.hold) g.gain.setValueAtTime(v, t + Math.max(a, dur - o.hold)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc; if (o.lp) { const f2 = ac.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = o.lp; osc.connect(f2); node = f2; }
    node.connect(g); g.connect(o.bus || sfxG); osc.start(t); osc.stop(t + dur + 0.02);
  }
  function noise(dur, o = {}) {
    if (!ac || !st.sfx) return; const t = now() + (o.delay || 0);
    const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true; const f = ac.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.frequency.setValueAtTime(o.f || 1200, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + dur); f.Q.value = o.q || 0.8;
    const g = ac.createGain(); const v = o.vol === undefined ? 0.3 : o.vol, a = o.a || 0.005; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); if (o.hold) g.gain.setValueAtTime(v, t + Math.max(a, dur - o.hold)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || sfxG); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }
  const R = (a, b) => a + Math.random() * (b - a);
  // long appliance sounds (kettle, microwave) go through their own gain so a tap can stop them early
  const live = {};
  function liveBus(name, dur) { stop(name); const t = now(), g = ac.createGain(); g.gain.setValueAtTime(1, t); g.connect(sfxG); live[name] = g; setTimeout(() => { if (live[name] === g) delete live[name]; }, dur * 1000 + 200); return g; }
  function stop(name) { const g = live[name]; if (!g || !ac) return; delete live[name]; try { const t = now(); g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08); } catch (e) { } }
  const SFX = {
    click: () => tone(1046, 0.05, { vol: 0.12 }),
    tab: () => { tone(784, 0.04, { vol: 0.1 }); tone(1046, 0.05, { vol: 0.1, delay: 0.03 }); },
    coin: () => { tone(988, 0.07, { vol: 0.18 }); tone(1319, 0.16, { vol: 0.18, delay: 0.06 }); },
    buy: () => { tone(1319, 0.06, { vol: 0.15 }); tone(1568, 0.06, { vol: 0.15, delay: 0.06 }); tone(2093, 0.22, { vol: 0.15, delay: 0.12, type: 'triangle' }); noise(0.12, { f: 6000, vol: 0.08, delay: 0.02 }); },
    nope: () => { tone(220, 0.12, { vol: 0.16 }); tone(185, 0.18, { vol: 0.16, delay: 0.1 }); },
    chomp: () => { noise(0.07, { f: 900, q: 1.2, vol: 0.35 }); noise(0.06, { f: 700, q: 1.2, vol: 0.3, delay: 0.13 }); },
    gulp: () => tone(420, 0.14, { type: 'sine', slide: 160, vol: 0.3 }),
    burp: () => { tone(95, 0.45, { type: 'sawtooth', vib: [24, 18], lp: 600, vol: 0.32, slide: 70 }); noise(0.35, { f: 300, q: 2, vol: 0.12 }); },
    giggle: () => { for (let i = 0; i < 6; i++) tone(R(700, 1050), 0.07, { type: 'triangle', vol: 0.16, delay: i * 0.085, slide: R(900, 1300) }); },
    boop: () => tone(520, 0.12, { type: 'sine', slide: 1240, vol: 0.28 }),
    happy: () => { [659, 784, 988].forEach((f, i) => tone(f, 0.1, { type: 'triangle', vol: 0.14, delay: i * 0.07 })); },
    sad: () => { tone(392, 0.2, { type: 'triangle', vol: 0.14, slide: 330 }); tone(311, 0.3, { type: 'triangle', vol: 0.14, delay: 0.18, slide: 262 }); },
    pop: () => { noise(0.05, { f: 2400, q: 1, vol: 0.22 }); tone(880, 0.05, { type: 'sine', slide: 1500, vol: 0.12 }); },
    bubble: () => tone(R(500, 900), 0.06, { type: 'sine', slide: R(1100, 1700), vol: 0.1 }),
    scrub: () => noise(0.06, { f: R(2500, 3800), q: 1.5, vol: 0.07 }),
    splash: () => noise(0.5, { f: 1800, f2: 500, q: 0.6, vol: 0.2 }),
    shower: () => noise(0.25, { f: 4200, q: 0.4, vol: 0.06, a: 0.05 }),
    jump: () => tone(330, 0.12, { slide: 760, vol: 0.12 }),
    spring: () => tone(260, 0.25, { type: 'triangle', slide: 1200, vib: [30, 60], vol: 0.18 }),
    hit: () => { noise(0.18, { f: 400, q: 0.7, vol: 0.35 }); tone(140, 0.2, { slide: 60, vol: 0.22 }); },
    crack: () => { noise(0.1, { f: 3000, q: 2, vol: 0.2 }); noise(0.08, { f: 1500, q: 2, vol: 0.18, delay: 0.07 }); },
    whoosh: () => noise(0.25, { f: 600, f2: 2400, q: 0.8, vol: 0.12 }),
    flap: () => { tone(300, 0.08, { type: 'triangle', slide: 520, vol: 0.12 }); noise(0.08, { f: 1500, vol: 0.05 }); },
    level: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, { vol: 0.14, delay: i * 0.08 })); tone(1318, 0.3, { type: 'triangle', vol: 0.14, delay: 0.32 }); },
    fail: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.18, { vol: 0.14, delay: i * 0.13, type: 'triangle' })); },
    star: () => { for (let i = 0; i < 5; i++) tone(1568 + i * 220, 0.08, { type: 'triangle', vol: 0.08, delay: i * 0.05 }); },
    snore: () => { noise(1.1, { f: 380, q: 3, vol: 0.12, a: 0.5 }); tone(85, 1.0, { type: 'sawtooth', lp: 260, vol: 0.08, a: 0.4 }); },
    yawn: () => tone(520, 0.7, { type: 'sine', slide: 220, vib: [6, 20], vol: 0.18, a: 0.1 }),
    lift: () => { tone(160, 0.25, { type: 'sawtooth', lp: 700, slide: 110, vol: 0.2 }); },
    clank: () => { tone(1800, 0.2, { type: 'square', vol: 0.06 }); tone(2400, 0.15, { type: 'square', vol: 0.05 }); noise(0.1, { f: 5000, vol: 0.08 }); },
    drum: (i) => { const f = [196, 262, 330, 440][i] || 262; tone(f * 1.6, 0.25, { type: 'sine', slide: f, vol: 0.4 }); noise(0.06, { f: f * 5, q: 1, vol: 0.15 }); },
    fly: () => tone(R(180, 220), 0.12, { type: 'sawtooth', lp: 900, vib: [60, 30], vol: 0.03 }),
    harvest: () => { tone(660, 0.06, { type: 'triangle', vol: 0.15 }); tone(990, 0.12, { type: 'triangle', vol: 0.15, delay: 0.05 }); noise(0.08, { f: 1200, vol: 0.08 }); },
    water: () => { for (let i = 0; i < 4; i++) tone(R(600, 1200), 0.05, { type: 'sine', slide: R(300, 500), vol: 0.08, delay: i * 0.06 }); },
    // friends & pillows (no voices: soft creature sounds)
    purr: () => { for (let i = 0; i < 16; i++) noise(0.045, { f: R(150, 210), q: 1.4, vol: 0.16, delay: i * 0.042, ft: 'lowpass' }); tone(52, 0.7, { type: 'sawtooth', lp: 200, vol: 0.06, a: 0.08 }); },
    mew: () => { tone(620, 0.16, { type: 'triangle', slide: 900, vib: [8, 25], vol: 0.12 }); tone(880, 0.22, { type: 'triangle', slide: 560, vol: 0.1, delay: 0.14 }); },
    mumble: () => { for (let i = 0; i < 3; i++) tone(R(140, 185), 0.12, { type: 'triangle', lp: 650, slide: R(110, 140), vol: 0.22, delay: i * 0.15 }); },
    // Round 7 #2 Жучок (ui-sound-design: «playful» = high + bouncy, short; game-audio mixing: a friend's call sits under the UI, ~0.05): a tiny trill + the keys jingling on his ring
    chirr: () => { for (let i = 0; i < 4; i++) tone(R(2050, 2200) + (i % 2) * 420, 0.04, { type: 'triangle', vol: 0.055, delay: i * 0.05, slide: 2500 + (i % 2) * 320 }); SFX.jingle(0.22); },
    jingle: (d) => { const t0 = typeof d === 'number' ? d : 0; for (let k = 0; k < 3; k++) { tone(R(3700, 4700), 0.12, { type: 'sine', vol: 0.03, delay: t0 + k * 0.065 }); noise(0.035, { f: 7000, q: 4, vol: 0.025, delay: t0 + k * 0.065 }); } },
    // his «Щёточка»: soft scrub strokes over the fur (band-passed noise sweeping up and back)
    brush: () => { for (let k = 0; k < 4; k++) noise(0.16, { f: k % 2 ? 2600 : 1600, f2: k % 2 ? 1600 : 2600, q: 1.2, vol: 0.06, a: 0.03, delay: k * 0.19 }); },
    buzz: () => tone(R(230, 260), 0.5, { type: 'sawtooth', lp: 1500, vib: [26, 28], vol: 0.07, a: 0.06 }),
    squeak: () => { tone(R(1350, 1600), 0.08, { type: 'sine', slide: R(1900, 2300), vol: 0.13 }); tone(R(1100, 1300), 0.07, { type: 'sine', slide: R(1600, 1900), vol: 0.1, delay: 0.09 }); },
    squeeze: () => { tone(900, 0.28, { type: 'sine', slide: 1500, vib: [14, 40], vol: 0.12 }); },
    sizzle: () => { noise(0.4, { f: 5200, ft: 'highpass', q: 0.4, vol: 0.09, a: 0.02 }); for (let i = 0; i < 5; i++) noise(0.02, { f: R(2500, 4200), q: 2, vol: 0.14, delay: R(0, 0.35) }); },
    puk: () => { tone(R(95, 110), 0.22, { type: 'sawtooth', lp: 420, slide: R(70, 80), vib: [32, 18], vol: 0.24, a: 0.01 }); noise(0.18, { f: 260, q: 1.4, vol: 0.12, delay: 0.02 }); }, // Москит's comic «пук» at the bite (a low blat)
    bite: () => { tone(1500, 0.05, { type: 'square', slide: 700, vol: 0.12 }); noise(0.06, { f: 2500, q: 1.5, vol: 0.15, delay: 0.03 }); [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.1, { type: 'triangle', vol: 0.13, delay: 0.16 + i * 0.06 })); },
    // «Все вместе»: 8 s disco loop (four-on-the-floor kick, off-beat hats, octave bass, bouncy square hook), countdown beeps, candles blown out, a little crowd «yay»
    disco: () => { const bus = liveBus('disco', 8.4), B = 0.5, N = (n) => 440 * Math.pow(2, (n - 69) / 12), bass = [45, 45, 48, 50], mel = [76, 79, 81, 79, 76, -1, 74, 76, 72, -1, 74, 76, 79, -1, 76, -1];
      for (let i = 0; i < 16; i++) { const d = i * B, r = bass[Math.floor(i / 4) % 4], m = mel[i];
        tone(150, 0.16, { type: 'sine', slide: 45, vol: 0.34, delay: d, bus }); noise(0.04, { f: 8000, ft: 'highpass', vol: 0.06, delay: d + B / 2, bus });
        tone(N(r), B * 0.45, { type: 'triangle', vol: 0.16, delay: d, bus }); tone(N(r + 12), B * 0.4, { type: 'triangle', vol: 0.12, delay: d + B / 2, bus });
        if (m > 0) tone(N(m), B * 0.42, { type: 'square', lp: 2600, vol: 0.055, delay: d, bus }); } },
    // Round 7 #5: the sill radio — 6.4 s of a cheerful AM-radio tune (a narrow band-passed square melody + a plucky bass, a little hiss)
    radio: () => { const bus = liveBus('radio', 6.6), B = 0.4, N = (n) => 440 * Math.pow(2, (n - 69) / 12), mel = [72, 76, 79, 76, 77, 74, 71, 74, 72, 76, 79, 84, 81, 77, 74, 72], bass = [48, 43, 45, 41];
      noise(6.3, { f: 3200, q: 0.6, vol: 0.018, a: 0.1, bus });
      for (let i = 0; i < 16; i++) { const d = 0.1 + i * B; tone(N(mel[i]), B * 0.7, { type: 'square', lp: 1800, vol: 0.05, delay: d, bus }); if (i % 2 === 0) tone(N(bass[Math.floor(i / 4) % 4]), B * 0.6, { type: 'triangle', vol: 0.14, delay: d, bus }); } },
    // Round 7 #8: the guitar — the bag's zip; a sloppy strum (a few plucked, detuned strings, not quite together); a wrong string: a buzzing twang
    zip: () => { for (let i = 0; i < 16; i++) noise(0.014, { f: 2600 + i * 90 + R(-200, 200), q: 2.4, vol: 0.06, delay: i * 0.024 }); noise(0.42, { f: 1800, f2: 3400, q: 1.1, vol: 0.025 }); },
    strum: () => { const C = [[196, 247, 294, 392, 494], [131, 165, 196, 262, 330], [147, 220, 294, 370, 440], [165, 247, 330, 392, 494]][Math.floor(Math.random() * 4)], seq = Math.random() < 0.4 ? C.slice().reverse().slice(0, 3) : C;
      seq.forEach((f, i) => { const d = f * Math.pow(2, R(-35, 35) / 1200), w = i * R(0.012, 0.032); tone(d, 0.9, { type: 'sawtooth', lp: 1700, vol: 0.045, delay: w }); tone(d * 2.003, 0.35, { type: 'triangle', vol: 0.02, delay: w }); });
      noise(0.025, { f: 3200, q: 0.9, vol: 0.06 }); },
    // Round 9 #1: a baby slaps the closed bag — a soft cloth slap, a hollow body thump and the strings ringing muffled inside
    bzdyn: () => { noise(0.07, { f: 500, q: 0.8, vol: 0.2 }); tone(120, 0.22, { type: 'sine', slide: 55, vol: 0.32 }); [98, 147, 196, 247].forEach((f, i) => tone(f * Math.pow(2, R(-25, 25) / 1200), 0.55, { type: 'triangle', lp: 650, vol: 0.05, delay: 0.012 + i * 0.008 })); },
    twang: () => { const f = R(82, 98); tone(f, 0.75, { type: 'sawtooth', lp: 1100, slide: f * 0.86, vib: [9, 7], vol: 0.13 }); tone(f * 2.04, 0.5, { type: 'square', lp: 900, slide: f * 1.6, vol: 0.04 }); noise(0.16, { f: 240, q: 2.6, vol: 0.1 }); },
    // Round 7 #7: the soundbar's bass test — a deep boom, a sub thump and a wide whoosh
    bass: () => { tone(58, 0.7, { type: 'sine', slide: 38, vol: 0.5 }); tone(116, 0.32, { type: 'triangle', slide: 70, vol: 0.16 }); noise(0.08, { f: 180, q: 1, vol: 0.22 }); noise(0.9, { f: 300, f2: 2600, q: 0.6, vol: 0.05, a: 0.2 }); tone(58, 0.5, { type: 'sine', slide: 40, vol: 0.35, delay: 0.42 }); },
    beep: () => tone(880, 0.12, { type: 'square', lp: 3000, vol: 0.12 }),
    beepGo: () => tone(1320, 0.22, { type: 'square', lp: 3200, vol: 0.13 }),
    blow: () => { noise(0.55, { f: 900, f2: 300, q: 0.5, vol: 0.16, a: 0.05 }); },
    // Round 9 #3: his jig on the rug — a bouncy 6/8 tune on a square «fiddle» over a plucked bass; «та-да» when he finishes
    jig: () => { const N = (n) => 440 * Math.pow(2, (n - 69) / 12), B = 0.19, mel = [74, 78, 81, 78, 74, 78, 81, 83, 81, 78, 76, 74, 76, 78, 74], bus = liveBus('jig', B * mel.length + 0.4); // Round 12 #1: a live sound — cut off when he leaves the zal
      mel.forEach((n, i) => tone(N(n), B * (i === mel.length - 1 ? 1.6 : 0.8), { type: 'square', lp: 2400, vol: 0.055, delay: i * B, bus }));
      for (let i = 0; i < mel.length; i += 3) tone(N(i % 6 ? 45 : 50), B * 1.2, { type: 'triangle', vol: 0.15, delay: i * B, bus }); },
    tada: () => { [[67, 71, 74], [72, 76, 79, 84]].forEach((ch, j) => ch.forEach((n) => { const f = 440 * Math.pow(2, (n - 69) / 12); tone(f, j ? 0.6 : 0.11, { type: 'triangle', vol: 0.09, delay: j * 0.14 }); tone(f, j ? 0.45 : 0.09, { type: 'square', lp: 2600, vol: 0.03, delay: j * 0.14 }); })); },
    cheer: () => { noise(0.7, { f: 1400, f2: 2200, q: 0.4, vol: 0.07, a: 0.06 }); [523, 659, 784].forEach((f, i) => tone(f, 0.16, { type: 'triangle', vol: 0.1, delay: 0.05 + i * 0.06 })); },
    camera: () => { noise(0.04, { f: 4000, vol: 0.25 }); noise(0.1, { f: 2000, vol: 0.15, delay: 0.06 }); },
    // kitchen & lamps: plastic rocker switch, the kettle swelling to a boil, microwave hum + fan, its three beeps
    switch: () => { noise(0.025, { f: 2600, q: 1.4, vol: 0.16 }); tone(2200, 0.012, { type: 'square', vol: 0.04 }); tone(160, 0.045, { type: 'sine', slide: 90, vol: 0.12 }); },
    boil: () => { const bus = liveBus('boil', 5); noise(5, { f: 260, f2: 950, q: 0.7, vol: 0.06, a: 2.6, hold: 0.35, bus }); noise(5, { f: 3200, ft: 'highpass', q: 0.3, vol: 0.012, a: 3.5, hold: 0.3, bus });
      for (let i = 0; i < 24; i++) { const k = i / 23; tone(R(340, 820), 0.045, { type: 'sine', slide: R(700, 1300), vol: 0.025 + 0.035 * k, delay: 1.1 + 3.7 * Math.sqrt(k) + R(-0.08, 0.08), bus }); } },
    micro: () => { const bus = liveBus('micro', 4); tone(2093, 0.07, { type: 'square', lp: 2800, vol: 0.05 }); tone(100, 4, { type: 'sawtooth', lp: 320, vol: 0.05, a: 0.12, hold: 0.15, delay: 0.1, bus }); tone(200, 4, { type: 'sine', vol: 0.018, a: 0.15, hold: 0.15, delay: 0.1, bus }); noise(4, { f: 900, q: 0.5, vol: 0.022, a: 0.2, hold: 0.15, delay: 0.1, bus }); },
    // a baby's whiny «Э-э-э-э-э!»: sawtooth voice (rising, wobbling, falling) through 'э' formants + a nasal band, pulsing like crying
    // (the fallback — Round 9 #13: VOX.whine plays his own recording)
    whine: () => {
      if (!ac || !st.sfx) return; const t = now() + 0.02, dur = 1.3, k = (SP.rate || 1) * R(0.97, 1.04);
      const o = ac.createOscillator(); o.type = 'sawtooth'; const fq = o.frequency;
      fq.setValueAtTime(520 * k, t); fq.linearRampToValueAtTime(640 * k, t + 0.24); fq.linearRampToValueAtTime(585 * k, t + 0.52); fq.linearRampToValueAtTime(655 * k, t + 0.8); fq.exponentialRampToValueAtTime(450 * k, t + dur);
      const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 7.5; vg.gain.value = 16 * k; vib.connect(vg); vg.connect(fq);
      const out = ac.createGain(); out.gain.setValueAtTime(0.0001, t);
      const P = [0, 0.27, 0.53, 0.8]; P.forEach((p0, i) => { const top = i === P.length - 1 ? 0.62 : 0.55; out.gain.exponentialRampToValueAtTime(top, t + p0 + 0.05); out.gain.exponentialRampToValueAtTime(i === P.length - 1 ? top * 0.8 : 0.2, t + p0 + 0.24); });
      out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      for (const [f, q, g] of [[280, 4, 0.5], [750, 6, 1.1], [2400, 10, 0.55], [3400, 12, 0.3]]) { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; const gg = ac.createGain(); gg.gain.value = g; o.connect(bp); bp.connect(gg); gg.connect(out); }
      out.connect(sfxG); o.start(t); vib.start(t); o.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
    },
    // walk-to trips: soft plush footsteps, the fridge seal + compressor hum, rummaging, the office chair, keyboard clacks (short, quiet, randomised)
    step: () => { noise(0.035, { f: R(380, 560), q: 0.9, vol: 0.045 }); tone(R(95, 120), 0.04, { type: 'sine', slide: 70, vol: 0.045 }); },
    fridge: () => { noise(0.09, { f: 900, f2: 300, q: 0.7, vol: 0.12 }); tone(118, 0.55, { type: 'sine', vol: 0.022, a: 0.08, hold: 0.3, delay: 0.05 }); },
    fridgeClose: () => { tone(85, 0.09, { type: 'sine', slide: 55, vol: 0.2 }); noise(0.05, { f: 420, q: 0.8, vol: 0.1 }); },
    rustle: () => noise(R(0.06, 0.11), { f: R(1800, 3400), q: 0.9, vol: 0.055 }),
    scrape: () => { noise(R(0.14, 0.19), { f: R(380, 520), q: 1.3, vol: 0.05 }); tone(R(150, 175), 0.12, { type: 'sawtooth', slide: R(115, 135), lp: 520, vol: 0.016 }); }, // chair legs on the tiles
    creak: () => { tone(R(240, 280), 0.14, { type: 'sawtooth', slide: R(170, 200), lp: 900, vol: 0.04 }); noise(0.05, { f: 700, q: 2, vol: 0.035, delay: 0.05 }); },
    keys: () => { for (let i = 0; i < 3; i++) noise(0.018, { f: R(3000, 4200), q: 2.2, vol: 0.045, delay: i * R(0.07, 0.11) }); },
    // Round 7 #6: the consoles — controller clicks; boot sounds: a soft synth swell (PS5) / a crisp snap and a little chime (Switch 2)
    pad: () => { for (let i = 0; i < 2; i++) { noise(0.012, { f: R(1800, 2600), q: 3, vol: 0.04, delay: i * R(0.08, 0.13) }); tone(R(520, 640), 0.015, { type: 'square', lp: 1400, vol: 0.012, delay: i * R(0.08, 0.13) }); } },
    bootPs: () => { tone(110, 1.1, { type: 'sine', vol: 0.12, a: 0.35, hold: 0.3 }); tone(220, 1.0, { type: 'triangle', lp: 900, vol: 0.05, a: 0.4, hold: 0.25 }); for (const [f, d] of [[659, 0.45], [988, 0.55], [1319, 0.65]]) tone(f, 0.6, { type: 'sine', vol: 0.03, a: 0.08, delay: d }); },
    bootSw: () => { noise(0.02, { f: 3200, q: 2.5, vol: 0.14 }); tone(1600, 0.02, { type: 'square', lp: 3000, vol: 0.05 }); noise(0.018, { f: 2600, q: 2.5, vol: 0.1, delay: 0.09 }); for (const [f, d] of [[1047, 0.22], [1568, 0.32]]) tone(f, 0.16, { type: 'square', lp: 2400, vol: 0.035, delay: d, hold: 0.04 }); },
    // Round 7 #6b: «Банановые гонки» — the engine (a short buzz every 0.11 s, its pitch follows the speed), a crash, a tyre squeal, the last seconds' tick
    engine: (k) => { k = Math.max(0, Math.min(1, k || 0)); tone(52 + 92 * k, 0.15, { type: 'sawtooth', lp: 340 + 760 * k, vol: 0.03, a: 0.02 }); tone(104 + 184 * k, 0.12, { type: 'square', lp: 520 + 700 * k, vol: 0.009, a: 0.02 }); },
    crash: () => { noise(0.4, { f: 900, f2: 180, q: 0.6, vol: 0.36 }); tone(96, 0.32, { slide: 42, vol: 0.24 }); for (let i = 0; i < 4; i++) tone(R(2300, 3400), 0.05, { type: 'triangle', vol: 0.06, delay: 0.1 + i * R(0.04, 0.08) }); },
    skid: () => { noise(0.5, { f: 2800, f2: 1700, q: 5, vol: 0.12 }); tone(1250, 0.45, { type: 'sawtooth', vib: [17, 40], lp: 2200, vol: 0.025, slide: 980 }); },
    tick5: () => tone(880, 0.08, { type: 'square', lp: 2400, vol: 0.1 }),
    ding: () => { for (const d of [0, 0.32, 0.64]) tone(1975, 0.16, { type: 'square', lp: 2600, vol: 0.06, delay: d, hold: 0.05 }); },
    // ---- Round 5 D: the things in the flat ----
    window: () => { tone(1400, 0.03, { type: 'square', vol: 0.05 }); noise(0.04, { f: 2200, q: 1.5, vol: 0.1 }); tone(R(230, 260), 0.22, { type: 'sawtooth', slide: R(170, 190), lp: 800, vol: 0.035, delay: 0.05 }); },
    street: (r) => { const k = r === 'balcony' ? 1.6 : 1; noise(2.9, { f: 380, f2: 300, ft: 'lowpass', q: 0.4, vol: 0.02 * k, a: 0.6, hold: 0.8 }); noise(2.4, { f: 1100, q: 0.5, vol: 0.008 * k, a: 0.8, delay: 0.3 });
      for (let i = 0; i < 3; i++) { const d = R(0.2, 2.4), f = R(2600, 3600); tone(f, 0.06, { type: 'sine', slide: f * 1.25, vol: 0.03, delay: d }); tone(f * 1.1, 0.05, { type: 'sine', slide: f * 0.9, vol: 0.025, delay: d + 0.08 }); }
      if (r === 'balcony' && Math.random() < 0.3) { const d = R(0.5, 2); tone(392, 0.22, { type: 'square', lp: 1400, vol: 0.025, delay: d }); tone(494, 0.22, { type: 'square', lp: 1400, vol: 0.02, delay: d }); } },
    wind: () => noise(1.4, { f: 400, f2: 1300, q: 0.9, vol: 0.06, a: 0.5 }),
    coo: () => { for (let i = 0; i < 3; i++) tone(R(300, 340), 0.16, { type: 'sine', slide: R(230, 260), vib: [18, 20], vol: 0.09, delay: i * 0.2 }); },
    knock: () => { for (let i = 0; i < 3; i++) { tone(R(1150, 1250), 0.12, { type: 'triangle', vol: 0.12, delay: i * 0.16 }); tone(R(2350, 2500), 0.08, { type: 'sine', vol: 0.05, delay: i * 0.16 }); noise(0.02, { f: 3000, q: 2, vol: 0.08, delay: i * 0.16 }); } },
    knockBack: () => { for (const d of [0, 0.22, 0.6]) { tone(R(950, 1050), 0.1, { type: 'triangle', vol: 0.07, lp: 1800, delay: d }); noise(0.02, { f: 2200, q: 2, vol: 0.05, delay: d }); } },
    knockAngry: () => { for (let i = 0; i < 7; i++) { tone(R(900, 1100), 0.08, { type: 'triangle', vol: 0.11, lp: 2000, delay: i * 0.09 }); noise(0.02, { f: 2400, q: 2, vol: 0.08, delay: i * 0.09 }); } },
    dingdong: () => { tone(659, 0.5, { type: 'sine', vol: 0.18, hold: 0.1 }); tone(1318, 0.3, { type: 'sine', vol: 0.03 }); tone(523, 0.8, { type: 'sine', vol: 0.18, delay: 0.42, hold: 0.1 }); tone(1046, 0.4, { type: 'sine', vol: 0.03, delay: 0.42 }); },
    thump: () => { noise(0.12, { f: 220, q: 0.8, vol: 0.3 }); tone(90, 0.12, { type: 'sine', slide: 60, vol: 0.2 }); },
    sneeze: () => { tone(420, 0.35, { type: 'triangle', slide: 620, vol: 0.06, a: 0.2 }); noise(0.25, { f: 3200, f2: 1400, q: 0.7, vol: 0.25, delay: 0.38 }); tone(700, 0.12, { type: 'sawtooth', lp: 1800, slide: 300, vol: 0.06, delay: 0.38 }); },
    wink: () => { tone(2093, 0.08, { type: 'triangle', vol: 0.1 }); tone(3136, 0.14, { type: 'sine', vol: 0.06, delay: 0.06 }); },
    ouch: () => { tone(1200, 0.06, { type: 'square', lp: 2600, slide: 1800, vol: 0.06 }); tone(700, 0.2, { type: 'triangle', slide: 1100, vol: 0.1, delay: 0.03 }); },
    ticks: () => { for (let i = 0; i < 10; i++) tone(i % 2 ? 1800 : 1500, 0.02, { type: 'square', lp: 3000, vol: 0.05, delay: i * 0.12 }); },
    cuckoo: () => { for (const d of [0, 0.55]) { tone(784, 0.18, { type: 'sine', vol: 0.18, delay: d, hold: 0.06 }); tone(622, 0.26, { type: 'sine', vol: 0.18, delay: d + 0.2, hold: 0.08 }); } },
    match: () => { noise(0.12, { f: 3500, f2: 1800, q: 0.8, vol: 0.18 }); noise(0.4, { f: 900, q: 0.6, vol: 0.06, delay: 0.1, a: 0.05 }); },
    clink: () => { for (let i = 0; i < 3; i++) { const f = R(2600, 3400); tone(f, 0.18, { type: 'sine', vol: 0.06, delay: i * 0.09 }); tone(f * 1.5, 0.1, { type: 'sine', vol: 0.03, delay: i * 0.09 }); } },
    chirp: () => { for (let i = 0; i < 4; i++) { const d = i * 0.13 + (i > 1 ? 0.12 : 0); tone(R(2600, 3000), 0.07, { type: 'sine', slide: R(3900, 4600), vol: 0.07, delay: d }); tone(R(3800, 4200), 0.05, { type: 'sine', slide: 2900, vol: 0.04, delay: d + 0.06 }); } }, // Round 10 #8: spring birds
    fan: () => { const bus = liveBus('fan', 2.2); noise(2, { ft: 'lowpass', f: 900, vol: 0.09, a: 0.25, hold: 1.4, bus }); for (let i = 0; i < 22; i++) noise(0.05, { f: 1500, q: 1.2, vol: 0.035, delay: 0.1 + i * 0.085, bus }); tone(96, 2, { type: 'triangle', vol: 0.05, a: 0.3, hold: 1.4, bus }); }, // a desk fan whirring
    season: () => { const N = [72, 76, 79, 84, 79, 84]; N.forEach((n, i) => tone(440 * Math.pow(2, (n - 69) / 12), i === N.length - 1 ? 0.5 : 0.12, { type: 'square', lp: 3500, vol: 0.08, delay: i * 0.1, hold: 0.05 })); noise(0.5, { f: 7000, q: 0.7, vol: 0.04, delay: 0.5, a: 0.02 }); }, // an event begins
    valve: () => { tone(620, 0.16, { type: 'square', lp: 2600, slide: 900, vol: 0.04 }); tone(1240, 0.12, { type: 'sine', slide: 1500, vol: 0.05, delay: 0.05 }); noise(0.1, { f: 1800, q: 3, vol: 0.04, delay: 0.02 }); }, // Round 10 #5: a squeaky radiator valve
    tink: () => { tone(R(2900, 3500), 0.12, { type: 'sine', vol: 0.07 }); tone(R(4600, 5200), 0.06, { type: 'sine', vol: 0.025 }); },
    screw: () => { for (let i = 0; i < 6; i++) { noise(0.018, { f: 3800, q: 4, vol: 0.07, delay: i * 0.07 }); tone(1500 + i * 60, 0.02, { type: 'square', lp: 3000, vol: 0.02, delay: i * 0.07 }); } tone(2600, 0.14, { type: 'sine', vol: 0.05, delay: 0.46 }); },
    clatter: () => { for (let i = 0; i < 8; i++) { tone(R(2200, 4200), 0.05, { type: 'square', lp: 5000, vol: 0.03, delay: i * R(0.03, 0.06) }); noise(0.02, { f: 5000, q: 2, vol: 0.04, delay: i * 0.05 }); } },
    drawer: () => { noise(0.22, { f: 500, f2: 800, q: 1.4, vol: 0.06 }); tone(120, 0.06, { type: 'sine', vol: 0.06, delay: 0.2 }); },
    gondola: () => { const bus = liveBus('gondola', 7.4), N = (n) => 440 * Math.pow(2, (n - 69) / 12), b = 0.36; let tt = 0.1; // a little barcarolle on an accordion-ish voice + lapping water
      for (const [n, d] of [[67, 1], [72, 1], [72, 1], [71, 2], [69, 1], [71, 1], [74, 1], [74, 2], [72, 1], [71, 1], [69, 1], [67, 1], [69, 1], [71, 2], [67, 3]]) { tone(N(n), b * d * 0.95, { type: 'triangle', vol: 0.07, vib: [5, 4], delay: tt, hold: 0.1, bus }); tone(N(n - 12), b * d * 0.9, { type: 'sawtooth', lp: 700, vol: 0.015, delay: tt, hold: 0.1, bus }); tt += b * d; }
      for (let i = 0; i < 6; i++) noise(0.9, { f: 500, q: 0.6, vol: 0.02, a: 0.4, delay: i * 1.1, bus }); },
    hob: () => { tone(2200, 0.012, { type: 'square', vol: 0.04 }); tone(140, 0.6, { type: 'sine', vol: 0.03, a: 0.3 }); },
    fry: () => { const bus = liveBus('fry', 1.7); noise(1.6, { f: 5200, ft: 'highpass', q: 0.4, vol: 0.06, a: 0.08, hold: 0.3, bus }); for (let i = 0; i < 14; i++) noise(0.02, { f: R(2500, 4500), q: 2, vol: 0.05, delay: R(0, 1.5), bus }); },
    flip: () => { noise(0.08, { f: 900, f2: 2400, q: 0.8, vol: 0.12 }); tone(500, 0.12, { type: 'sine', slide: 900, vol: 0.06 }); },
    splat: () => { noise(0.14, { f: 600, f2: 200, q: 0.8, vol: 0.3 }); tone(180, 0.12, { type: 'sine', slide: 80, vol: 0.18 }); },
    thunk: () => { tone(110, 0.1, { type: 'sine', slide: 70, vol: 0.25 }); noise(0.05, { f: 700, q: 1, vol: 0.12 }); },
    fill: () => { noise(1.4, { f: 1200, f2: 700, q: 0.7, vol: 0.07, a: 0.2, hold: 0.3 }); for (let i = 0; i < 8; i++) tone(R(500, 900), 0.05, { type: 'sine', slide: R(900, 1300), vol: 0.03, delay: R(0.2, 1.3) }); },
    wash: () => { const bus = liveBus('wash', 5.2); tone(90, 5, { type: 'sawtooth', lp: 260, vol: 0.03, a: 0.3, hold: 0.3, bus }); for (let i = 0; i < 4; i++) noise(1.1, { f: 500, f2: 900, q: 0.7, vol: 0.06, a: 0.4, delay: i * 1.25, bus });
      for (let i = 0; i < 10; i++) tone(R(300, 600), 0.06, { type: 'sine', slide: R(600, 900), vol: 0.025, delay: R(0.2, 4.8), bus }); },
    spin: () => { const bus = liveBus('spin', 3.4); tone(120, 3.2, { type: 'sawtooth', slide: 520, lp: 1200, vol: 0.04, a: 0.3, hold: 0.4, bus }); tone(240, 3.2, { type: 'sine', slide: 1040, vol: 0.02, a: 0.3, hold: 0.4, bus });
      noise(3.2, { f: 400, f2: 2200, q: 0.6, vol: 0.04, a: 0.5, hold: 0.4, bus }); for (let i = 0; i < 16; i++) noise(0.03, { f: 300, q: 1.5, vol: 0.06, delay: 0.8 + i * 0.14, bus }); },
    washDone: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.16, { type: 'triangle', vol: 0.1, delay: i * 0.12 })); },
    faucet: () => { noise(2.4, { f: 2600, q: 0.5, vol: 0.06, a: 0.1, hold: 0.4 }); noise(2.4, { f: 700, q: 0.8, vol: 0.03, a: 0.1, hold: 0.4 }); },
    hum: () => tone(100, 1.2, { type: 'sawtooth', lp: 300, vol: 0.03, a: 0.2 }),
    ribbit: () => { for (const d of [0, 0.26]) tone(220, 0.12, { type: 'square', lp: 900, slide: 150, vib: [45, 30], vol: 0.1, delay: d }); },
    choir: () => { for (const f of [523, 659, 784, 1046]) tone(f, 1.6, { type: 'triangle', vib: [5, 6], lp: 2200, vol: 0.04, a: 0.4, hold: 0.5 }); },
    honk: () => { tone(560, 0.16, { type: 'square', lp: 1500, slide: 480, vol: 0.08 }); tone(600, 0.2, { type: 'square', lp: 1500, slide: 430, vol: 0.08, delay: 0.2 }); },
    dig: () => { for (let i = 0; i < 3; i++) noise(0.08, { f: R(500, 800), q: 0.9, vol: 0.12, delay: i * 0.14 }); },
    // Round 6 B, the hall: the robot vacuum (two start chirps, a motor whirr + brush hiss, ~7 s), a dial-up modem chirp (router), a boot chime (Linux box), a spooky «бу» (masks)
    vacuum: () => { const bus = liveBus('vacuum', 7.6); [988, 1319].forEach((f, i) => tone(f, 0.09, { type: 'sine', vol: 0.08, delay: i * 0.1 })); tone(170, 7.2, { type: 'sawtooth', lp: 420, vol: 0.035, a: 0.4, hold: 0.5, delay: 0.2, vib: [7, 6], bus }); noise(7.2, { f: 2400, q: 0.6, vol: 0.02, a: 0.5, hold: 0.5, delay: 0.2, bus }); },
    // Round 6 E: the phone comes out (two soft blips), a crate lands (a wooden thud), the overhang is sawn off (a rasp)
    phone: () => { tone(1320, 0.07, { type: 'sine', vol: 0.08 }); tone(1760, 0.09, { type: 'sine', vol: 0.08, delay: 0.09 }); },
    crate: () => { tone(150, 0.12, { type: 'triangle', slide: 70, vol: 0.2 }); noise(0.1, { f: 700, q: 0.8, vol: 0.12 }); },
    saw: () => { for (let i = 0; i < 4; i++) noise(0.07, { f: 2400 + i * 300, q: 2.5, vol: 0.06, delay: i * 0.08 }); },
    modem: () => { [1200, 2100, 1800, 2400, 1300].forEach((f, i) => tone(f, 0.11, { type: 'square', lp: 2600, vol: 0.04, delay: i * 0.12 })); noise(0.5, { f: 1800, q: 1.2, vol: 0.03, delay: 0.6 }); },
    boot: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, { type: 'triangle', vol: 0.09, delay: i * 0.11 })); },
    // Round 6 C: curtain rings sliding along the rod + the swish of heavy fabric
    curtain: () => { noise(0.8, { f: 2600, f2: 1300, q: 0.9, vol: 0.05, a: 0.08 }); noise(0.9, { f: 500, q: 0.5, vol: 0.035, a: 0.2 }); for (let i = 0; i < 6; i++) tone(R(3200, 4200), 0.025, { type: 'square', lp: 5000, vol: 0.025, delay: 0.05 + i * 0.11 + R(0, 0.04) }); },
    boo: () => { tone(320, 0.5, { type: 'sine', slide: 140, vol: 0.12, vib: [9, 14] }); noise(0.4, { f: 600, q: 0.6, vol: 0.05 }); },
    twinkle: () => { [1568, 2093, 2637, 2093, 3136].forEach((f, i) => tone(f, 0.12, { type: 'sine', vol: 0.05, delay: i * 0.09 })); },
    // Round 22: «Happy Birthday» on a music box when her cake comes in (a live bus: blowing / the mic stops it) and a candle going out —
    // a short pure sine blip (no noise: with the mic open our own sound must never look like a blow)
    hbd: () => { const B = 0.34, M = [[67, .75], [67, .25], [69, 1], [67, 1], [72, 1], [71, 2], [67, .75], [67, .25], [69, 1], [67, 1], [74, 1], [72, 2], [67, .75], [67, .25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 2], [77, .75], [77, .25], [76, 1], [72, 1], [74, 1], [72, 2.5]];
      const tot = M.reduce((a, m) => a + m[1], 0) * B, g = liveBus('hbd', tot + 1); let d = 0.05;
      duck(true);
      setTimeout(() => {
        if (typeof DASHA !== 'undefined' && DASHA.cakeLit && DASHA.cakeLit() > 0 && !quietF) {
          play('hbd');
        }
      }, (tot + 1.2) * 1000);
      for (const [n, b] of M) { const f = 440 * Math.pow(2, (n + 12 - 69) / 12); tone(f, Math.max(0.3, b * B * 1.3), { type: 'triangle', vol: 0.09, delay: d, bus: g }); tone(f * 2, 0.18, { type: 'sine', vol: 0.03, delay: d, bus: g }); d += b * B; }
      [48, 43, 43, 48, 48, 41, 43, 48].forEach((n, i) => tone(440 * Math.pow(2, (n - 69) / 12), B * 2.6, { type: 'triangle', vol: 0.06, delay: 0.05 + (1 + 3 * i) * B, bus: g })); }, // the bass on each bar (3/4 after the pickup): C G G C C F G C
    pff: () => { tone(R(1250, 1450), 0.07, { type: 'sine', slide: 640, vol: 0.05 }); },
    peel: () => noise(0.3, { f: 1800, f2: 4200, q: 1.2, vol: 0.08 }),
    chime: (p) => { const pitch = typeof p === 'number' ? p : 1, f = Math.round(1100 * pitch); tone(f, 0.16, { type: 'sine', vol: 0.14 }); tone(f * 1.5, 0.12, { type: 'triangle', vol: 0.06, delay: 0.02 }); tone(f * 2.01, 0.18, { type: 'sine', vol: 0.04, delay: 0.03 }); },
  };
  function play(name, a) { if (!ac) return; try { if (SP.ok && st.sfx && VOX[name]) { if (VOX[name](a)) return; } SFX[name] && SFX[name](a); } catch (e) { } }

  // ---------- voice: SPEECH (built by tools/tts.py) — every line pre-spoken in the monkey's voice + word/syllable bank for typed text ----------
  const SP = { ok: typeof SPEECH !== 'undefined', cache: new Map(), rate: 1, active: [], busy: 0, tok: 0, pend: null, played: 0, warm: 0 };
  // Round 19: the bank arrives after the first frame (src/voicebank.js, build.py) — parse its text into SPEECH (substrings, no copies)
  function voiceText(txt) {
    let sec = null, fx = false;
    for (const ln of txt.split('\n')) { if (!ln) continue;
      if (ln.charCodeAt(0) === 64) { const n = ln.slice(1); sec = SPEECH[n] || (SPEECH[n] = {}); fx = n === 'fx'; continue; }
      const f = ln.split('\t'), e = [f[1]]; for (let i = 2; i < f.length; i++) e.push(+f[i]); if (fx) (sec[f[0]] || (sec[f[0]] = [])).push(e); else sec[f[0]] = e; }
  }
  // a line said before the voice came is spoken when group 1 arrives (if it waited ≤ 1.5 s; its bubble is shown already)
  function voiceDone(g) { SPEECH.ready |= g; if (!(g & 1)) return; warm(); const p = SP.pend; SP.pend = null; if (p && performance.now() - p.t <= 1500) say(p.text, p.o); }
  function voiceInline(g) { for (const b of document.querySelectorAll('script.vb[data-g="' + g + '"]')) { voiceText(b.textContent); b.remove(); } voiceDone(g); }
  function voiceFetch(n = 0) { // the website: voice1.txt (lines, reactions), then voice2.txt (words, syllables)
    const rev = (typeof window !== 'undefined' && window.ABI_REV) || ('v35_' + Date.now());
    const get = (f) => fetch(f + '?v=' + rev, { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(f + ' ' + r.status); return r.text(); });
    const step = (SPEECH.ready & 1) ? Promise.resolve() : get('voice1.txt').then((t) => { voiceText(t); voiceDone(1); });
    step.then(() => get('voice2.txt')).then((t) => { voiceText(t); voiceDone(2); }).catch(() => { if (n < 4) setTimeout(() => voiceFetch(n + 1), 3000 * (n + 1)); else SP.failed = 1; }); // no voice files at all → the synth babble
  }
  if (typeof window !== 'undefined' && window.ABI_VOICE === 'files' && SP.ok) voiceFetch();
  function warm() { if (!ac || SP.warm) return; const k = Object.keys(SPEECH.lines)[0]; if (!k) return; SP.warm = 1; clip('L' + k, SPEECH.lines[k][0]).catch(() => { }); }
  // Pure neural monkey voice (Silero TTS -> WORLD -> EQ matched to assets/voice_src)
  const TTS_UP = 1.0, WHINE = 'э-э-э-э-э';
  const normT = (s) => String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9\- ]+/g, ' ').replace(/(^|\s)-+|-+(\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
  function b2u(b) { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  // decoded clip (LRU cache): {buf, off = first audible sample (skips the mp3 decoder delay), env = 25 ms loudness 0..1}
  function clip(id, b64) {
    let p = SP.cache.get(id);
    if (p) { SP.cache.delete(id); SP.cache.set(id, p); return p; }
    p = new Promise((res, rej) => {
      let done = false; const ok = (buf) => { if (done) return; done = true; try { res(prep(buf)); } catch (e) { rej(e); } };
      const bad = (e) => { if (done) return; done = true; SP.cache.delete(id); rej(e); };
      try { const pr = ac.decodeAudioData(b2u(b64).buffer, ok, bad); if (pr && pr.then) pr.then(ok, bad); } catch (e) { bad(e); }
    });
    SP.cache.set(id, p); if (SP.cache.size > 70) SP.cache.delete(SP.cache.keys().next().value);
    return p;
  }
  function prep(buf) {
    const d = buf.getChannelData(0), sr = buf.sampleRate; let mx = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > mx) mx = a; }
    let i0 = 0; const th = Math.max(0.003, mx * 0.02); while (i0 < d.length && Math.abs(d[i0]) < th) i0++;
    const W = Math.round(sr * 0.025), n = Math.max(1, Math.ceil((d.length - i0) / W)), env = new Float32Array(n); let em = 1e-4;
    for (let j = 0; j < n; j++) { let q = 0; const a = i0 + j * W, b = Math.min(d.length, a + W); for (let x = a; x < b; x++) q += d[x] * d[x]; env[j] = Math.sqrt(q / Math.max(1, b - a)); if (env[j] > em) em = env[j]; }
    for (let j = 0; j < n; j++) env[j] = Math.min(1, env[j] / em * 1.3);
    return { buf, off: Math.max(0, i0 / sr - 0.003), env };
  }
  // play a decoded clip at a pitch/speed rate (optional glide to rate*glide); returns wall-clock seconds
  function vsrc(c, when, rate, o = {}) {
    const len = Math.max(0.02, Math.min(c.buf.duration - c.off, o.len || 99)), gl = o.glide || 1, wall = len / (rate * (1 + gl) / 2);
    const src = ac.createBufferSource(); src.buffer = c.buf; src.playbackRate.setValueAtTime(rate, when); if (gl !== 1) src.playbackRate.linearRampToValueAtTime(rate * gl, when + wall);
    const g = ac.createGain(), v = 0.82 * (o.vol || 1), fa = Math.min(o.cut ? 0.02 : 0.008, wall / 3);
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(v, when + 0.008); g.gain.setValueAtTime(v, when + wall - fa); g.gain.linearRampToValueAtTime(0, when + wall);
    let node = src; const via = (type, f, q, gain) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q; if (gain) b.gain.value = gain; node.connect(b); node = b; };
    via('highpass', 180, 0.7);
    via('peaking', 5200, 1.8, -7.5);
    via('peaking', 3300, 1.2, -4.0);
    via('lowpass', o.lp || 6400, 0.7);
    node.connect(g); g.connect(voxG || sfxG); src.start(when, c.off); src.stop(when + wall + 0.03);
    SP.active.push(src); src.onended = () => { const k = SP.active.indexOf(src); if (k >= 0) SP.active.splice(k, 1); };
    return wall;
  }
  function hush() { SP.tok++; for (const x of SP.active.splice(0)) { try { x.stop(); } catch (e) { } } SP.busy = 0; }
  // ----- text -> clips: a whole pre-spoken line if we have it, otherwise word by word (unknown words by syllables) -----
  const VOW = 'аоуыэяёюие', CON = 'бвгджзйклмнпрстфхцчшщ', IOT = { а: 'я', о: 'ё', у: 'ю', э: 'е', ы: 'и' };
  const U = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const T = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'], H = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
  function num(n) {
    if (!n) return 'ноль'; const tri = (x, fem) => { const r = [], h = Math.floor(x / 100), t = x % 100, u = t < 20 ? t : t % 10; if (h) r.push(H[h]); if (t >= 20) r.push(T[Math.floor(t / 10)]); if (u) r.push(fem && u <= 2 ? ['', 'одна', 'две'][u] : U[u]); return r; };
    const th = Math.floor(n / 1000), o = []; if (th) { const a = th % 100, b = th % 10; o.push(...tri(th, true), a >= 11 && a <= 14 ? 'тысяч' : b === 1 ? 'тысяча' : b >= 2 && b <= 4 ? 'тысячи' : 'тысяч'); }
    o.push(...tri(n % 1000, false)); return o.join(' ');
  }
  const LAT = { ok: 'окей', okay: 'окей', hi: 'хай', hello: 'хеллоу', lol: 'лол', wow: 'вау', yes: 'ес', no: 'ноу', bye: 'бай', love: 'лав', omg: 'омайгад', cool: 'кул', you: 'ю', i: 'ай', me: 'ми', the: 'зе' };
  const LATC = { a: 'а', b: 'б', c: 'к', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'дж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'кс', y: 'й', z: 'з' };
  const translit = (w) => LAT[w] || w.replace(/sh/g, 'ш').replace(/ch/g, 'ч').replace(/zh/g, 'ж').replace(/th/g, 'т').replace(/ph/g, 'ф').replace(/kh/g, 'х').replace(/oo/g, 'у').replace(/ee/g, 'и').replace(/ya/g, 'я').replace(/yu/g, 'ю').replace(/yo/g, 'ё').replace(/[a-z]/g, (c) => LATC[c]);
  function spell(w, segs) { // unknown word -> syllables (consonant clusters/codas are cut from the start of a CV unit)
    const S = SPEECH.syl, ch = [...w].filter((c) => VOW.includes(c) || CON.includes(c) || c === 'ь' || c === 'ъ'); let cl = [], sep = false;
    const cons = (c, soft) => {
      if (c === 'й') { if (S['и']) segs.push({ id: 'Sи', e: S['и'], len: 0.07, r: 1.15 }); return; }
      const k = c + (soft || 'чщ'.includes(c) ? 'и' : 'ы'), u = S[k]; if (u) segs.push({ id: 'S' + k, e: u, len: Math.min(0.13, Math.max(0.04, u[2] || 0.06)), r: 1.1, cut: 1 });
    };
    for (let i = 0; i < ch.length; i++) {
      const c = ch[i];
      if (CON.includes(c)) { cl.push([c, ch[i + 1] === 'ь']); continue; }
      if (c === 'ь' || c === 'ъ') { if (VOW.includes(ch[i + 1] || '')) sep = true; continue; }
      let last = (!sep && cl.length) ? cl.pop() : null; for (const x of cl) cons(x[0], x[1]); cl = [];
      let v = c; if (sep || (last && last[0] === 'й')) { v = IOT[v] || v; if (last && last[0] === 'й') last = null; } sep = false;
      const k = last ? last[0] + v : v, u = S[k]; if (u) segs.push({ id: 'S' + k, e: u, len: Math.min(u[1], (last ? u[2] || 0.06 : 0) + 0.17), r: 1.12, cut: 1 });
    }
    for (const x of cl) cons(x[0], x[1]);
  }
  function words(k, segs) {
    const L = SPEECH.lines, Wd = SPEECH.words;
    k.replace(/\d+/g, (m) => ' ' + (m.length > 6 ? m.split('').map((c) => num(+c)).join(' ') : num(+m)) + ' ').split(' ').filter(Boolean).map((w) => /[a-z]/.test(w) ? translit(w) : w).forEach((w, wi) => {
      if (wi) segs.push({ gap: 0.045 });
      if (Wd[w]) { segs.push({ id: 'W' + w, e: Wd[w] }); return; }
      if (L[w]) { segs.push({ id: 'L' + w, e: L[w] }); return; }
      w.split('-').filter(Boolean).forEach((p, i) => { if (i) segs.push({ gap: 0.03 }); if (Wd[p]) segs.push({ id: 'W' + p, e: Wd[p] }); else spell(p, segs); });
    });
  }
  // whole line if known; otherwise sentence by sentence / clause by clause, the rest word by word. Pure neural TTS (SPEECH.lines).
  function plan(text) {
    const L = SPEECH.lines, k = normT(text); if (L[k]) return [{ id: 'L' + k, e: L[k] }];
    const sents = String(text).match(/[^.!?…]+[.!?…]*/g) || [], cls = (sn) => sn.split(/[,;:—–]+/);
    const segs = [];
    sents.forEach((sn, si) => {
      const ks = normT(sn); if (!ks) return; if (segs.length) segs.push({ gap: 0.2 });
      const n0 = segs.length;
      if (L[ks]) segs.push({ id: 'L' + ks, e: L[ks] });
      else cls(sn).forEach((cl) => { const kc = normT(cl); if (!kc) return; if (segs.length > n0) segs.push({ gap: 0.12 }); if (L[kc]) segs.push({ id: 'L' + kc, e: L[kc] }); else words(kc, segs); });
      const last = segs[segs.length - 1], end = (sn.match(/[.!?…]+\s*$/) || [''])[0].trim(); if (last && !last.gap && !last.id.startsWith('L')) last.end = end.includes('?') ? '?' : end.includes('!') ? '!' : '.';
    });
    return segs;
  }
  // speak a bubble line / typed text; returns {dur, env(t)} for lip sync (t = seconds since the call)
  function say(text, o = {}) {
    if (!ac || !st.sfx) return null;
    if (!SP.ok) { const d = voice(text, SP.rate * (o.rate || 1)); return d ? { dur: d } : null; }
    if (!(SPEECH.ready & 1)) { if (SP.failed) { const d = voice(text, SP.rate * (o.rate || 1)); return d ? { dur: d } : null; } SP.pend = { text, o, t: performance.now() }; return null; } // Round 19: the voice is still on its way
    hush();
    const mood = o.mood || '';
    const base = SP.rate * (o.rate || 1) * (mood === 'sad' ? 0.95 : mood === 'happy' ? 1.03 : mood === 'tired' ? 0.91 : 1), lp = mood === 'tired' ? 3200 : mood === 'sad' ? 5500 : 0;
    const segs = plan(text), items = []; let t = 0;
    segs.forEach((s, i) => {
      if (s.gap) { t += s.gap / base; return; }
      const len = Math.max(0.02, Math.min(s.e[1], s.len || s.e[1])), r = base * (s.r || 1) * TTS_UP, glide = s.end === '?' ? 1.12 : s.end === '!' ? 1.03 : s.end === '.' ? 0.95 : 1;
      const wall = len / (r * (1 + glide) / 2); items.push({ s, t0: t, wall, len, r, glide }); t += wall - (s.cut ? 0.006 : 0);
    });
    if (!items.length) return null;
    const tok = ++SP.tok, t0 = now(), res = { dur: t + 0.08, lag: 0.06, env: null };
    res.env = (x) => { x -= res.lag; for (const it of items) if (x >= it.t0 && x < it.t0 + it.wall) { if (!it.c) return 0.3; const k = Math.floor((x - it.t0) / it.wall * it.len / 0.025); return it.c.env[Math.min(it.c.env.length - 1, k)] || 0; } return 0; };
    Promise.all(items.map((it) => clip(it.s.id, it.s.e[0]).then((c) => { it.c = c; }, () => { }))).then(() => {
      if (tok !== SP.tok) return; const s0 = Math.max(t0 + 0.06, now() + 0.015); res.lag = s0 - t0;
      for (const it of items) if (it.c) { vsrc(it.c, s0 + it.t0, it.r, { len: it.len, glide: it.glide, lp, cut: it.s.cut }); SP.played++; }
      SP.busy = s0 + t;
    });
    SP.busy = t0 + t + 0.1; return res;
  }
  // short non-verbal reactions (giggle, squeal, sigh, yawn, "ой"); return true when handled (otherwise the synth SFX plays)
  const free = () => now() > SP.busy;
  function fx(kind, rate, o = {}) {
    const L = SPEECH.fx[kind]; if (!L || !L.length) return false; const i = Math.floor(Math.random() * L.length), e = L[i], t0 = now(), r = rate * SP.rate * TTS_UP, tok = SP.tok;
    clip('F' + kind + i, e[0]).then((c) => { if (tok === SP.tok && now() - t0 < 0.5) SP.busy = now() + vsrc(c, Math.max(now() + 0.01, t0 + 0.02), r, o); }, () => { });
    SP.busy = t0 + e[1] / r + 0.05; return true;
  }
  const VOX = {
    call: () => free() ? fx('happy', R(1.02, 1.08)) : true,
    happy: () => free() ? fx('happy', R(0.98, 1.06)) : true,
    giggle: () => free() ? fx('giggle', R(1.0, 1.08)) : true,
    sad: () => free() ? fx('sad', 0.95, { lp: 4500 }) : true,
    yawn: () => { hush(); return fx('yawn', 0.9, { glide: 0.9, lp: 3200 }); },
    boop: () => free() ? fx('boop', R(1.05, 1.15)) : true,
    whine: () => false,
  };
  function setRate(r) { SP.rate = r > 0 ? r : 1; }
  // animalese-like chatter
  function voice(text, pitch = 1) {
    if (!ac || !st.sfx) return 0; const syl = Math.min(18, Math.max(2, Math.ceil(text.replace(/[^а-яёa-z]/gi, '').length / 2.2))); let t = 0;
    for (let i = 0; i < syl; i++) { const c = text.charCodeAt((i * 2) % text.length) || 60; const f = (430 + (c * 37 % 9) * 38) * pitch; const d = 0.055 + (c % 3) * 0.012; tone(f, d, { type: 'triangle', vol: 0.11, delay: t, slide: f * (0.86 + (c % 5) * 0.06), lp: 2600 }); t += d + 0.022; }
    if (/[?]$/.test(text)) tone(700 * pitch, 0.1, { type: 'triangle', vol: 0.1, delay: t, slide: 1000 * pitch });
    return t;
  }
  // friends' «speech»: creature chatter paced by the text (Пуся мурчит/мяукает, Монти бубнит «бу-бу», Москит жужжит, Морковка пищит, Перец шкворчит); returns seconds
  function chat(kind, text) {
    const n = Math.max(1, Math.min(9, Math.round(String(text).replace(/[^а-яёa-z]/gi, '').length / 3.2))); let t = 0;
    if (!ac || !st.sfx) return 0.25 + n * 0.14;
    for (let i = 0; i < n; i++) {
      const c = (String(text).charCodeAt(i * 3 % text.length) || 60) % 7;
      if (kind === 'purr') { if (i === 0 || i === n - 1) tone(640 + c * 30, 0.15, { type: 'triangle', slide: 860 + c * 20, vib: [8, 25], vol: 0.11, delay: t }); else noise(0.1, { f: 190 + c * 6, q: 1.6, vol: 0.13, ft: 'lowpass', delay: t }); t += 0.15; }
      else if (kind === 'mumble') { tone(135 + c * 9, 0.12, { type: 'triangle', lp: 600, slide: 110 + c * 6, vol: 0.22, delay: t }); t += 0.15 + (c % 3) * 0.02; }
      else if (kind === 'buzz') { tone(300 + c * 40, 0.1, { type: 'sawtooth', lp: 1700, vib: [30, 30], vol: 0.06, slide: 360 + c * 30, delay: t }); t += 0.12; }
      else if (kind === 'chirr') { tone(1900 + c * 70, 0.05, { type: 'triangle', vol: 0.06, slide: 2300 + c * 60, delay: t }); if (i % 3 === 2) tone(2400 + c * 50, 0.04, { type: 'triangle', vol: 0.05, slide: 2100, delay: t + 0.055 }); t += 0.12; }
      else if (kind === 'carrot') { tone(1500 + c * 60, 0.06, { type: 'sine', slide: 1900, vol: 0.07, delay: t }); t += 0.12; if (i > 1) break; }
      else if (kind === 'pepper') { tone(440 + c * 45, 0.08, { type: 'square', lp: 2000, slide: 520 + c * 40, vol: 0.06, delay: t }); if (i % 2 === 0) noise(0.05, { f: 4200, q: 1, vol: 0.06, delay: t }); t += 0.11; }
      else { tone(500 + c * 40, 0.08, { type: 'triangle', vol: 0.1, delay: t }); t += 0.11; }
    }
    if (kind === 'buzz') tone(250, Math.max(0.2, t), { type: 'sawtooth', lp: 1200, vib: [26, 24], vol: 0.035, a: 0.05 });
    return t + 0.1;
  }
  // ---------- chiptune music (lookahead scheduler) · Round 10 #6: a track of its own for home and every mini-game ----------
  // mel: eighth-note steps, 'C5'… a note, '_' holds the previous one, '.' a rest. prog: a chord per bar (midi). bar: eighths per bar (6 = waltz).
  // bass / comp / drum: the groove of the track (see sched). lead: the oscillator of the tune; lv its volume; dur: fixed note length in steps (home).
  const MID = (tok) => { if (tok === '.') return -1; if (tok === '_') return 0; const m = /^([A-G])(#|b)?(\d)$/.exec(tok); return 12 * (+m[3] + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
  const M = (str) => str.trim().split(/\s+/).map(MID), CH = { C: [60, 64, 67], Dm: [62, 65, 69], Em: [64, 67, 71], F: [65, 69, 72], G: [67, 71, 74], Am: [57, 60, 64], Bb: [70, 74, 77], Gm: [67, 70, 74], Cm: [60, 63, 67], D: [62, 66, 69], E: [64, 68, 71], F7: [65, 69, 75] };
  const P = (str) => str.trim().split(/\s+/).map((c) => CH[c]);
  const TRACKS = {
    home: { name: 'Домашняя укулеле', bpm: 104, key: 'C', lead: 'square', lv: 0.11, dur: 1.6, bass: 'bounce', comp: 'off', drum: { H: 'x...x...', h: '..x...x.' }, prog: P('C Am F G'),
      mel: [76, -1, 79, 76, 74, -1, 72, -1, 72, 74, 76, -1, 74, -1, -1, -1, 77, -1, 76, 74, 72, -1, 69, -1, 71, 72, 74, -1, 79, -1, -1, -1,
        76, -1, 79, 81, 79, -1, 76, -1, 72, 74, 76, 74, 72, -1, 69, -1, 77, 76, 74, 72, 74, -1, 71, -1, 72, -1, -1, -1, -1, -1, -1, -1] },
    catch: { name: 'Калипсо с бананами', bpm: 116, key: 'F', lead: 'triangle', lv: 0.2, leg: 0.55, bass: 'calypso', comp: 'marimba', drum: { s: 'xxxxxxxx', c: 'x..x..x.' }, prog: P('F Bb C F F Bb C F'),
      mel: M('C6 . A5 C6 _ A5 F5 .  D6 . Bb5 D6 _ Bb5 F5 .  E5 G5 C6 E6 _ D6 C6 Bb5  A5 _ F5 _ C5 . . .  C6 . A5 C6 . F6 E6 D6  D6 . Bb5 D6 _ F6 D6 Bb5  C6 _ G5 A5 Bb5 A5 G5 E5  F5 _ _ . F6 . . .') },
    vine: { name: 'Джунгли на лианах', bpm: 128, key: 'D dorian', lead: 'square', lv: 0.09, leg: 0.8, bass: 'drive', comp: 'stab', drum: { k: 'x.....x.', t: '..x..x.x', h: 'x.x.x.x.' }, prog: P('Dm C Dm G'),
      mel: M('D5 . F5 G5 A5 . G5 F5  E5 . G5 . C5 . E5 .  D5 . F5 G5 A5 C6 A5 G5  B5 _ A5 G5 B4 . D5 .  A5 . A5 C6 D6 . C6 A5  G5 . E5 G5 C5 _ E5 .  F5 G5 A5 . D6 . A5 F5  G5 _ B4 . D5 _ . .') },
    balloon: { name: 'Вальс воздушного шарика', bpm: 96, key: 'G', lead: 'triangle', lv: 0.2, leg: 0.95, vib: 1, bar: 6, bass: 'waltz', comp: 'waltz', drum: { h: '..x.x.' }, prog: P('G C D G G Em C D'),
      mel: M('D5 _ G5 _ B5 _  C6 _ _ _ B5 A5  A5 _ F#5 _ D5 _  G5 _ _ _ . .  D5 _ G5 _ B5 _  E6 _ D6 _ B5 _  C6 _ A5 _ E5 G5  F#5 _ _ _ A5 _') },
    bongo: { name: 'Тёплый вечер у бонго', bpm: 90, key: 'A minor', lead: 'sine', lv: 0.2, leg: 1, vib: 1, bass: 'pad', comp: 'pad', drum: {}, prog: P('Am F C G'),
      mel: M('E5 _ _ _ A5 _ _ _  C6 _ _ _ A5 _ _ .  G5 _ _ _ E5 _ C5 _  D5 _ _ _ _ _ . .  A5 _ _ _ C6 _ B5 _  A5 _ _ _ F5 _ _ _  E5 _ G5 _ C6 _ _ _  B5 _ _ _ _ _ . .') },
    gym: { name: 'Зарядка-качалка', bpm: 140, key: 'E minor', lead: 'sawtooth', lv: 0.06, leg: 0.7, lp: 2600, bass: 'drive', comp: 'power', drum: { k: 'x.x.x.x.', S: '..x...x.', h: '.x.x.x.x' }, prog: P('Em C D Em'),
      mel: M('E5 E5 G5 E5 B5 . A5 G5  E5 E5 G5 E5 C6 . B5 G5  D5 D5 F#5 D5 A5 . G5 F#5  E5 _ G5 _ B5 _ . .  E6 . D6 B5 . G5 A5 B5  C6 . B5 G5 . E5 G5 A5  D6 . C6 A5 . F#5 G5 A5  B5 _ G5 . E5 _ . .') },
    stack: { name: 'Свинг высокой башни', bpm: 108, key: 'Bb', lead: 'triangle', lv: 0.19, leg: 0.8, vib: 1, swing: 0.34, bass: 'walk', comp: 'swing', drum: { k: 'x...x...', b: '..x...x.', r: 'x.xxx.xx' }, prog: P('Bb Gm Cm F7'),
      mel: M('D6 . Bb5 C6 D6 . F6 .  D6 _ Bb5 . G5 . . .  Eb6 . C6 D6 Eb6 . G6 .  F6 _ Eb6 . C6 . A5 .  Bb5 . D6 F6 _ D6 Bb5 .  G5 . Bb5 D6 _ . Bb5 .  C6 Eb6 G6 Eb6 C6 . A5 .  Bb5 _ _ . . . . .') },
    super: { name: 'Супер-Абибян 8-бит', bpm: 150, key: 'C', lead: 'pulse', lv: 0.09, leg: 0.7, bass: 'octave', comp: 'arp', drum: { k: 'x...x...', n: '..x...x.', h: 'x.x.x.x.' }, prog: P('C F G C Am F G G'),
      mel: M('E5 G5 C6 . G5 E5 C6 .  F5 A5 C6 . A5 F5 C6 .  G5 B5 D6 . B5 G5 D6 E6  C6 . G5 . C6 _ . .  A5 C6 E6 . C6 A5 E6 .  F5 A5 C6 F6 . C6 A5 .  G5 . A5 B5 D6 . B5 D6  G5 _ . . G4 . . .') },
    roofs: { name: 'Прыжки по крышам', bpm: 138, key: 'G', lead: 'square', lv: 0.075, leg: 0.6, bass: 'octave', comp: 'stab', drum: { k: 'x...x...', S: '..x...x.', h: 'x.xxx.xx' }, prog: P('G Em C D G Em C D'),
      mel: M('D5 G5 B5 . D6 . B5 G5  E5 G5 B5 . E6 . B5 G5  C6 . E6 C6 G5 . E5 G5  A5 _ F#5 A5 D6 _ . .  B5 . D6 B5 G5 . B5 D6  E6 . D6 B5 G5 . E5 G5  C6 E6 G6 E6 C6 . A5 C6  D6 _ C6 A5 F#5 . D5 .') },
    race: { name: 'Гонка на полной скорости', bpm: 160, key: 'A minor', lead: 'sawtooth', lv: 0.06, leg: 0.6, lp: 3200, bass: 'drive', comp: 'power', drum: { k: 'x.x.x.x.', S: '..x...x.', h: 'xxxxxxxx' }, prog: P('Am F G E'),
      mel: M('A5 . C6 . E6 . C6 A5  F5 . A5 . C6 . A5 F5  G5 . B5 . D6 . B5 G5  G#5 _ B5 _ E6 _ . .  E6 D6 C6 B5 A5 . E5 .  F5 G5 A5 C6 F6 . C6 .  D6 C6 B5 A5 G5 . B5 D6  E6 _ _ . B5 . G#5 .') },
  };
  const music = (() => {
    let timer = null, next = 0, step = 0, cur = 'home', pulse = null; const log = [];
    const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
    function note(f, t, d, type, vol, o = {}) {
      const osc = ac.createOscillator(), g = ac.createGain();
      if (type === 'pulse') { if (!pulse) { const re = new Float32Array(32), im = new Float32Array(32); for (let k = 1; k < 32; k++) im[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * 0.25); pulse = ac.createPeriodicWave(re, im); } osc.setPeriodicWave(pulse); } // 25 % NES pulse
      else osc.type = type;
      osc.frequency.value = f; if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5; lg.gain.value = f * 0.006; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + d + 0.03); }
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (o.a || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      let out = osc; if (o.lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; osc.connect(fl); out = fl; }
      out.connect(g); g.connect(musG); osc.start(t); osc.stop(t + d + 0.02);
    }
    function nz(t, d, vol, type, f, q) { const src = ac.createBufferSource(); src.buffer = noiseBuf; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; if (q) fl.Q.value = q; const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); src.connect(fl); fl.connect(g); g.connect(musG); src.start(t, Math.random() * 0.5); src.stop(t + d + 0.01); }
    function boom(t, f0, f1, d, vol) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(musG); o.start(t); o.stop(t + d + 0.02); }
    const DRUM = { H: (t) => nz(t, 0.04, 0.12, 'highpass', 7000), h: (t) => nz(t, 0.04, 0.05, 'highpass', 7000), s: (t, i) => nz(t, 0.03, i % 2 ? 0.035 : 0.06, 'highpass', 5200), c: (t) => note(2500, t, 0.05, 'sine', 0.12),
      k: (t) => boom(t, 150, 45, 0.16, 0.7), t: (t, i) => boom(t, i % 4 < 2 ? 220 : 165, i % 4 < 2 ? 120 : 90, 0.14, 0.4), S: (t) => { nz(t, 0.12, 0.14, 'bandpass', 1800, 0.8); boom(t, 240, 160, 0.06, 0.25); },
      b: (t) => nz(t, 0.16, 0.06, 'bandpass', 3000, 0.7), r: (t, i) => { note(i % 2 ? 4200 : 3900, t, 0.12, 'sine', 0.025); nz(t, 0.08, 0.025, 'highpass', 9000); }, n: (t) => nz(t, 0.07, 0.13, 'bandpass', 2400, 0.5) };
    function sched() {
      while (next < ac.currentTime + 0.25) {
        const T = TRACKS[cur], SP = 60 / T.bpm / 2, B = T.bar || 8, s8 = step % B, bi = Math.floor(step / B), ch = T.prog[bi % T.prog.length], nx = T.prog[(bi + 1) % T.prog.length], r = ch[0];
        const tt = next + (T.swing && step % 2 ? SP * T.swing : 0);
        // bass
        if (T.bass === 'bounce') { if (s8 % 4 === 0) note(N(r - 24), tt, SP * 1.8, 'triangle', 0.5); if (s8 % 4 === 2) note(N(r - 12), tt, SP * 0.9, 'triangle', 0.32); }
        else if (T.bass === 'calypso') { const pat = { 0: r - 24, 3: r - 17, 4: r - 12, 6: r - 17 }; if (pat[s8]) note(N(pat[s8]), tt, SP * 1.2, 'triangle', 0.45); }
        else if (T.bass === 'drive') note(N(r - (s8 % 2 ? 12 : 24)), tt, SP * 0.8, 'triangle', s8 % 2 ? 0.3 : 0.48);
        else if (T.bass === 'octave') note(N(r - (s8 % 2 ? 12 : 24)), tt, SP * 0.7, 'triangle', 0.42);
        else if (T.bass === 'waltz') { if (s8 === 0) note(N(r - 24), tt, SP * 1.9, 'triangle', 0.48); }
        else if (T.bass === 'pad') { if (s8 === 0) note(N(r - 24), tt, SP * B * 0.95, 'sine', 0.42, { a: 0.12 }); }
        else if (T.bass === 'walk') { if (s8 % 2 === 0) { const w = [r, ch[1], ch[2], nx[0] + (nx[0] > ch[2] ? -1 : 1)][s8 / 2]; note(N(w - 24 - (w - 24 > 50 ? 12 : 0)), tt, SP * 1.7, 'triangle', 0.48); } }
        // comp
        if (T.comp === 'off') { if (s8 % 2 === 1) ch.forEach((n) => note(N(n), tt, SP * 0.5, 'square', 0.05)); }
        else if (T.comp === 'marimba') { if (s8 % 2 === 1 || s8 === 2) note(N(ch[(s8 >> 1) % 3]), tt, SP * 0.6, 'sine', 0.13); }
        else if (T.comp === 'stab') { if (s8 === 2 || s8 === 5) ch.forEach((n) => note(N(n), tt, SP * 0.4, 'square', 0.04)); }
        else if (T.comp === 'waltz') { if (s8 === 2 || s8 === 4) ch.forEach((n) => note(N(n), tt, SP * 0.8, 'triangle', 0.09)); }
        else if (T.comp === 'pad') { if (s8 === 0) ch.forEach((n) => note(N(n - 12), tt, SP * B * 0.95, 'sine', 0.06, { a: 0.4 })); }
        else if (T.comp === 'power') { if (s8 === 0 || s8 === 3 || s8 === 6) [r - 12, r - 5].forEach((n) => note(N(n), tt, SP * 0.7, 'sawtooth', 0.035, { lp: 1600 })); }
        else if (T.comp === 'swing') { if (s8 === 3 || s8 === 6) ch.forEach((n) => note(N(n - 12), tt, SP * 0.7, 'triangle', 0.08)); }
        else if (T.comp === 'arp') note(N(ch[step % 3] + 12), tt, SP * 0.5, 'square', 0.025);
        // tune
        const m = T.mel[step % T.mel.length];
        if (m > 0) { let d = T.dur || 1; if (!T.dur) for (let k = 1; k < 8 && T.mel[(step + k) % T.mel.length] === 0; k++) d++; note(N(m), tt, SP * d * (T.leg || 1), T.lead, T.lv, { vib: T.vib && d > 1, lp: T.lp }); }
        // drums
        for (const k in T.drum) if (T.drum[k][s8] === 'x') DRUM[k](tt, s8);
        log.push({ tr: cur, s: step, n: m }); if (log.length > 64) log.shift();
        next += SP; step++;
      }
    }
    function track(id) { if (!TRACKS[id]) id = 'home'; if (id === cur) return; cur = id; step = 0; if (ac && timer) { next = Math.max(next, ac.currentTime + 0.06); musG.gain.cancelScheduledValues(ac.currentTime); musG.gain.setValueAtTime(0.0001, ac.currentTime); musG.gain.setTargetAtTime(st.music && !quietF && !duckF ? 0.16 : 0, ac.currentTime + 0.05, 0.08); } }
    return { start() { if (!ac || timer) return; next = ac.currentTime + 0.1; timer = setInterval(sched, 60); }, stop() { clearInterval(timer); timer = null; }, track, get id() { return cur; }, log };
  })();
  function track(id) { if (!ac && st.music) init(); music.track(id); } // a mini-game starts from a tap, so it's fine to wake the audio up here
  function set(k, v) { st[k] = v; if (!ac) return; if (k === 'sfx') { sfxG.gain.value = v ? 0.55 : 0; if (voxG) voxG.gain.value = v ? 0.65 : 0; } if (k === 'music') { musG.gain.value = (v && !quietF && !duckF) ? 0.16 : 0; v ? music.start() : music.stop(); } }
  let duckF = false, quietF = false;
  function duck(on) { duckF = !!on; if (ac && musG) musG.gain.setTargetAtTime(quietF || duckF ? 0 : (st.music ? 0.16 : 0), ac.currentTime, 0.05); }
  // Round 22: silence the music (and her birthday song) while the microphone listens for a blow — it must not hear the game
  function quiet(on) { quietF = !!on; if (on) stop('hbd'); if (ac && musG) musG.gain.setTargetAtTime(quietF || duckF ? 0 : (st.music ? 0.16 : 0), ac.currentTime, 0.05); }

  // ---------- microphone repeat (Talking-Tom style) ----------
  const mic = (() => {
    let stream = null, src = null, proc = null, listening = false, rec = false, chunks = [], silence = 0, voiced = 0, cb = null, lvl = 0;
    async function start(onEvent) {
      if (!init()) throw new Error('noaudio');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('nomic');
      if (!stream) stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      cb = onEvent; src = ac.createMediaStreamSource(stream); proc = ac.createScriptProcessor(2048, 1, 1);
      const mute = ac.createGain(); mute.gain.value = 0; src.connect(proc); proc.connect(mute); mute.connect(ac.destination);
      listening = true; rec = false; chunks = []; silence = 0; voiced = 0;
      proc.onaudioprocess = (e) => {
        if (!listening) return; const d = e.inputBuffer.getChannelData(0); let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i]; const rms = Math.sqrt(s / d.length); lvl = rms;
        const dt = d.length / ac.sampleRate;
        if (!rec) { if (rms > 0.025) { voiced += dt; if (voiced > 0.06) { rec = true; chunks = [new Float32Array(d)]; silence = 0; cb && cb('rec'); } } else voiced = 0; }
        else { chunks.push(new Float32Array(d)); if (rms < 0.015) silence += dt; else silence = 0; const len = chunks.length * d.length / ac.sampleRate; if (silence > 0.7 || len > 6) { rec = false; voiced = 0; const buf = join(chunks); chunks = []; cb && cb('done', buf); } }
      };
    }
    function join(ch) { const n = ch.reduce((a, c) => a + c.length, 0); const b = ac.createBuffer(1, n, ac.sampleRate); const d = b.getChannelData(0); let o = 0; for (const c of ch) { d.set(c, o); o += c.length; } return b; }
    function pause(p) { listening = !p; }
    function stop() { listening = false; rec = false; try { proc && proc.disconnect(); src && src.disconnect(); } catch (e) { } proc = null; src = null; }
    function release() { stop(); if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } }
    // play buffer pitched up, returns {dur, env(t)->0..1}
    function playback(buf, rate = 1.6) {
      const s = ac.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate; const g = ac.createGain(); g.gain.value = 1.4; s.connect(g); g.connect(sfxG); s.start();
      const d = buf.getChannelData(0), win = Math.floor(ac.sampleRate * 0.04), env = []; let mx = 0.0001;
      for (let i = 0; i < d.length; i += win) { let q = 0; for (let j = i; j < Math.min(d.length, i + win); j++) q += d[j] * d[j]; const v = Math.sqrt(q / win); env.push(v); mx = Math.max(mx, v); }
      const dur = buf.duration / rate; return { dur, env: (t) => { const k = Math.floor(t * rate / 0.04); return k >= 0 && k < env.length ? Math.min(1, env[k] / mx * 1.3) : 0; } };
    }
    return { start, stop, pause, release, playback, level: () => lvl, get active() { return !!proc; } };
  })();
  return { get unlockedN() { return unlockedN; }, voiceInline, voiceState: () => ({ ready: SPEECH.ready, pend: SP.pend ? 1 : 0, played: SP.played }), TRACKS, track, get trackId() { return music.id; }, _musLog: music.log, init, play, has: (n) => !!SFX[n], stop, liveOn: (n) => !!live[n], voice, chat, say, setRate, hush, set, duck, quiet, quietOn: () => quietF, mic, st, get ctx() { return ac; }, get voiceReady() { return SP.ok; }, get _out() { return master; }, _sp: SP, _plan: (t) => SP.ok ? plan(t) : [], _norm: normT };
})();
