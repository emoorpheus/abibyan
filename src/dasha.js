'use strict';
// ===== Round 22 «Подарок для Дашулика» (skills: designing-mini-games, maximizing-game-feel, animation-for-game-feel, game-audio,
// ui-sound-design, ios-safari-quirks, pixel-art-sprites) =====
// The game is a birthday present for Даша. (1) The first start is a wrapped box «Дашулик, это тебе!» — three knocks (or «Открыть»)
// and Абибян jumps out. (2) Her birthday (DATA.DASHA m/d, or her first visit within «grace» days after it, every year): the zal is
// decorated (bunting, a «ДАШУЛИК» banner, gold number balloons), the friends come, a cake with her age in candles — she blows them out
// INTO THE MICROPHONE (loud + turbulent: speech, singing, music and claps are periodic or short, they don't count) or with a finger;
// presents, a photo for the album that is never pushed out. (3) «24 секрета»: hearts with his notes hidden around the flat — Round 23:
// ONE at a time (№1, №2, …; empty slots are skipped): found → the card → «Я спрятал следующее сердечко!» and the next one is in
// another room. A small 7×6 heart that keeps still, partly behind things / in shadow / behind glass (DATA.DASHA.spots), a rare
// glint; after a minute of looking he helps: «Тепло-тепло!» / «Холодно!» / «Загляни на кухню!» (his texts: docs/24-secrets.md).
const DASHA = (() => {
  const C = () => DATA.DASHA, LN = () => DATA.LINES, S = () => GAME.S;
  const pick = (a) => a[Math.floor(Math.random() * a.length)], rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // Round 26 «записки под замком»: his notes are in the page only as a cipher (build.py + tools/secret_box.py):
  // SEAL = {v, it, salt, iv, ct, q, hint, n: [the numbers with a note], fin} or null while there are no notes. Her answer (case, ё/е,
  // spaces and punctuation don't matter) → PBKDF2-SHA256 → the AES-GCM key opens it right in the phone (no server, no internet);
  // the key stays in her save (D.key): she answers once, at the first heart. Public: only the question, the hint and which numbers.
  const SEAL = /*DASHA_SEAL*/null;
  let TXT = {}, IMG = {}; // the opened seal: texts {n: text, final: text} (docs/24-secrets.md) and pictures {n: data URL} (assets/secrets)
  let opened = !SEAL, auto = null; // auto: her saved key being tried (started in boot)
  const b64 = (s) => Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0));
  const norm = (s) => String(s || '').normalize('NFC').toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]/gu, ''); // = norm() in tools/secret_box.py
  async function keyOf(answer) { // her answer → the raw AES key (base64)
    const cs = crypto.subtle, base = await cs.importKey('raw', new TextEncoder().encode(norm(answer)), 'PBKDF2', false, ['deriveBits']);
    const bits = await cs.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(SEAL.salt), iterations: SEAL.it }, base, 256);
    return btoa(String.fromCharCode(...new Uint8Array(bits)));
  }
  async function openWith(k) { // true when this key opens the seal: TXT and IMG are filled
    try {
      const cs = crypto.subtle, key = await cs.importKey('raw', b64(k), 'AES-GCM', false, ['decrypt']);
      const o = JSON.parse(new TextDecoder().decode(await cs.decrypt({ name: 'AES-GCM', iv: b64(SEAL.iv) }, key, b64(SEAL.ct))));
      TXT = o.t || {}; IMG = o.i || {}; opened = true; return true;
    } catch (e) { return false; }
  }
  function withNotes(then) { // the seal is open → then(); her saved key (tried since boot) opens it → then(); else her question at once,
    if (opened) { then(); return; } // in the same tap (no await): the question shows together with the found heart
    if (!auto && st().key && window.crypto && crypto.subtle) auto = openWith(st().key);
    if (!auto) { ask(then); return; }
    auto.then((good) => { if (good) { then(); return; } auto = null; if (st().key) { delete st().key; GAME.save(true); } ask(then); });
  }
  function ask(then) { // her question; «Потом» closes it (the heart stays found, the album asks again); 3 wrong answers → the hint
    if (document.getElementById('dp')) return;
    const w = UI.modal(`<div class="hlock"><img class="px hero" src="${art().heart.toDataURL()}" alt=""><h2>Записка под замком</h2><p>Абибян закрыл записки на замок. Ответь на вопрос — и они откроются:</p><p class="hq2">${UI.esc(SEAL.q)}</p><input type="text" id="dp" maxlength="80" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="done"><p class="herr"></p><div class="bt"><button class="btn g" id="dp-ok">Открыть</button><button class="btn w" data-close>Потом</button></div></div>`);
    const inp = w.querySelector('#dp'), err = w.querySelector('.herr'), btn = w.querySelector('#dp-ok'), box = w.querySelector('.mbox'); let tries = 0;
    const go = async () => {
      if (btn.disabled || !norm(inp.value)) return;
      if (!(window.crypto && crypto.subtle)) { err.textContent = 'Тут записки не открыть: нужна ссылка https://'; return; }
      btn.disabled = true; err.textContent = 'Открываю…';
      const k = await keyOf(inp.value).catch(() => null), good = !!k && await openWith(k); btn.disabled = false;
      if (good) { st().key = k; GAME.save(true); UI.closeModal(w); AUDIO.play('star'); then(); return; }
      tries++; AUDIO.play('nope'); err.textContent = tries >= 3 && SEAL.hint ? 'Не то… Подсказка: ' + SEAL.hint : 'Не то… Попробуй ещё';
      if (box) { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); }
    };
    btn.onclick = go; inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  }
  const INK = '#3b2433';
  let t = 0, introUntil = 2.5, force = null, goingZal = false, partyWas = false, decorK = { at: -9, v: false };
  const timers = []; const later = (s, fn) => timers.push({ at: t + s, fn });
  const dbg = { glint: true, plain: false, off: false }; // the tests: no glint / a plain heart on the spot / no heart (to measure how hidden it is)
  let pend = false, lastAct = 0, lastHint = 0, glintAt = -9, hot = 0, cold = 0; const HINT_S = 90; // Round 24: he helps later (was 60 s)
  const TEST = () => !!window.ABI_TEST;
  const rn = (id) => (DATA.ROOMS.find((r) => r.id === id) || {}).name || ''; // a room's name
  function st() { const s = S(); if (!s.dasha) s.dasha = { gift: '', start: '', party: {}, gifts: {}, found: {}, seen: 0, more: '' }; const D = s.dasha; for (const k of ['party', 'gifts', 'found']) if (!D[k] || typeof D[k] !== 'object') D[k] = {}; return D; }
  const $ui = () => document.getElementById('ui');

  // ---------- the dates ----------
  const day0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  function bday(now) { // this year's birthday window: { y, age, diff (days after it) } or null
    now = now || new Date(); const c = C(), y = now.getFullYear(); if (y < c.year0) return null;
    const diff = Math.round((day0(now) - new Date(y, c.m - 1, c.d)) / 864e5);
    return diff >= 0 && diff < c.grace ? { y, age: c.age0 + (y - c.year0), diff } : null;
  }
  function due() { const D = st(); if (!D.gift) return null; if (force) return force.done ? null : force; const b = bday(); return b && !D.party[b.y] ? b : null; }
  const partyOn = () => FRIENDS.partyKind() === 'dasha';
  function decor() { // the zal is decorated: on her birthday itself, during her party, and the rest of the day the party was on
    if (partyOn() || (force && !force.off)) return true; if (t - decorK.at < 1) return decorK.v;
    const b = bday(), D = st(); decorK = { at: t, v: !!b && (b.diff === 0 || D.party[b.y] === GAME.dayStr(new Date())) }; return decorK.v;
  }
  function busy() { return giftOn() || (!!st().gift && !!due()) || partyOn() || !!blow; }

  // ---------- (1) the gift box ----------
  let gift = null;
  const BOX = { x: 64, y: 216, w: 52, h: 58 }; // the box with its lid and bow, scene coords (the tap area)
  const giftOn = () => !!gift && !gift.open;
  function giftStart() {
    gift = { taps: 0, t: 0, jy: 0, vy: 0, sq: 0, wob: 0, lid: 0, idle: 2.2, open: 0 };
    const u = $ui(); u.classList.add('gifting'); const old = document.getElementById('gift'); if (old) old.remove();
    const w = document.createElement('div'); w.id = 'gift';
    w.innerHTML = `<div class="g-t">${UI.esc(C().name)},<br>это тебе!</div><div class="g-s">Постучи по коробке</div><button class="btn g notch" id="nm-ok">${UI.im(UI.I('gift'))}<span>Открыть</span></button>`;
    u.appendChild(w); w.querySelector('#nm-ok').onclick = () => { AUDIO.init(); openGift(); };
    if (typeof TUT !== 'undefined') TUT.check();
  }
  function giftTap(x, y) {
    const g = gift; if (!g || g.open) return; const b = BOX; if (x < b.x - 10 || x > b.x + b.w + 10 || y < b.y - 14 + g.jy || y > b.y + b.h + 8) return;
    AUDIO.init(); g.taps++; if (g.taps >= 3) { openGift(); return; }
    AUDIO.play('knock'); g.vy = -130 - 50 * g.taps; g.sq = 1; g.wob = 1; g.lid = 2 + 3 * g.taps; g.idle = 2.6;
    for (let k = 0; k < 5 + g.taps * 3; k++) HOME.fx.spawn('spark', b.x + rnd(0, b.w), b.y + rnd(0, 30), { vy: -rnd(10, 30), life: 0.7 });
    const l = LN().dKnock; later(0.45, () => { if (gift && !gift.open) { AUDIO.play('giggle'); HOME.say(l[Math.min(l.length - 1, g.taps - 1)], 'happy'); } });
  }
  function openGift() {
    const g = gift; if (!g || g.open) return; g.open = t || 0.001;
    const s = S(), D = st(), today = GAME.dayStr(new Date());
    s.name = 'Абибян'; s.named = true; if (!D.gift) D.gift = today; if (!D.start) D.start = today;
    if (GAME.dailyAvailable()) GAME.claimDaily(); // the box is the present of the day: its coins, without the card over him
    GAME.save(true);
    $ui().classList.remove('gifting'); const w = document.getElementById('gift'); if (w) w.remove();
    AUDIO.init(); AUDIO.play('tada'); later(0.08, () => AUDIO.play('pop'));
    const lid = art().lid; HOME.fx.spawn('img', 90, BOX.y + 8, { img: lid, vx: pick([-1, 1]) * rnd(40, 70), vy: -260, g: 620, life: 1.1 });
    for (let k = 0; k < 14; k++) HOME.fx.spawn('puff', 90 + rnd(-26, 26), 250 + rnd(-14, 20), { c: '#ffffff', r0: 2, r1: 8, life: 0.55, alpha: 0.85 });
    for (let k = 0; k < 10; k++) HOME.fx.spawn('heart', 90 + rnd(-30, 30), 236 + rnd(-10, 20), { vy: -rnd(20, 40), vx: rnd(-20, 20), life: 1.3, wob: 4, fadeIn: k * 0.03 });
    HOME.celebrate(); HOME.hop(280); HOME.flashOn(0.35);
    UI.refresh(); APP.afterIntro({ gift: true });
    const b = force || bday(); introUntil = t + (b ? 5 : 3);
    HOME.say(pick(b ? LN().dBday : LN().dHello), 'happy');
    if (b) later(2.8, () => { if (!partyOn()) HOME.say(pick(LN().dBday2), 'happy'); });
    later(0.6, () => { gift = null; });
  }
  // the box (pre-drawn once): pink paper with white dots, a gold ribbon and bow, a cream tag with a heart
  let ART_ = null;
  function art() {
    if (ART_) return ART_;
    const mk = (w, h, fn) => { const c = PX.canvas(w, h); fn(Painter(c.getContext('2d'))); return c; };
    const PINK = '#ff7aa8', PD = '#d9558a', PL = '#ffb0cb', GOLD = '#ffd04a', GD = '#d99a1e', GL = '#fff2b0';
    const body = mk(46, 34, (P) => {
      P.r(0, 0, 46, 34, INK); P.r(1, 1, 44, 32, PINK); P.r(1, 1, 44, 2, PL); P.r(37, 1, 8, 32, PD); P.r(1, 30, 44, 3, PD);
      for (let y = 6; y < 30; y += 7) for (let x = 4 + (y % 14 ? 0 : 3); x < 36; x += 7) { P.r(x, y, 2, 2, '#ffe6f0'); }
      P.r(19, 1, 8, 32, GOLD); P.r(19, 1, 2, 32, GL); P.r(25, 1, 2, 32, GD); P.r(18, 0, 1, 34, INK); P.r(27, 0, 1, 34, INK);
    });
    const lid = mk(52, 12, (P) => {
      P.r(0, 0, 52, 12, INK); P.r(1, 1, 50, 10, '#ff8fb6'); P.r(1, 1, 50, 2, '#ffc4d8'); P.r(42, 1, 9, 10, PD); P.r(1, 9, 50, 2, PD);
      P.r(22, 1, 8, 10, GOLD); P.r(22, 1, 2, 10, GL); P.r(28, 1, 2, 10, GD); P.r(21, 0, 1, 12, INK); P.r(30, 0, 1, 12, INK);
    });
    const bow = mk(30, 14, (P) => {
      const L = ['..oooo........oooo..', '.oggggo......oggggo.', 'oggllggo....oggllggo', 'oglo.oggoooogg.olgo.', 'ogo...oggggggo...ogo', 'oggo.oggddggggo.oggo', '.oggggoddddddoggggo.', '..oooodddooodddoooo.', '......oddo..oddo....', '.....oddo....oddo...', '.....ooo......ooo...'];
      P.map(5, 2, L, { o: INK, g: GOLD, l: GL, d: GD });
    });
    const tag = mk(14, 9, (P) => { P.r(0, 0, 14, 9, INK); P.r(1, 1, 12, 7, '#fff4e2'); P.r(1, 7, 12, 1, '#e8cba5'); P.map(4, 2, ['.p.p.', 'ppppp', '.ppp.', '..p..'], { p: '#ef3a6a' }); });
    ART_ = { body, lid, bow, tag, heart: heartArt(), mini: miniArt() }; return ART_;
  }
  function heartArt() { // 11×10: an outlined heart with a shine
    const c = PX.canvas(11, 10), P = Painter(c.getContext('2d'));
    P.map(0, 0, ['.ooo...ooo.', 'opppo.opppo', 'oppppoppppo', 'opppppppppo', 'opppppppppo', '.opppppppo.', '..opppppo..', '...opppo...', '....opo....', '.....o.....'], { o: INK, p: '#ff4f86' });
    P.p(2, 2, '#ffd0de'); P.p(3, 2, '#ffd0de'); P.p(2, 3, '#ffd0de'); P.p(8, 5, '#d9306a'); P.p(7, 6, '#d9306a'); P.p(8, 4, '#d9306a');
    return c;
  }
  function miniArt() { // Round 23: the one hidden in the room — 7×6, a soft rose outline (less of a sticker), a shine pixel
    const c = PX.canvas(7, 6), P = Painter(c.getContext('2d'));
    P.map(0, 0, ['.oo.oo.', 'oppoppo', 'opppppo', '.opppo.', '..opo..', '...o...'], { o: '#7a2448', p: '#ff5c8f' });
    P.p(1, 1, '#ffc6d8'); P.p(4, 2, '#e23f76'); P.p(3, 3, '#e23f76');
    return c;
  }
  function drawGift(c, P) {
    const g = gift; if (!g) return; const A = art(), k = g.open ? Math.min(1, (t - g.open) / 0.35) : 0; if (k >= 1) return;
    const cx = 90, by = 272 + Math.round(g.jy), shear = Math.sin(g.t * 26) * 2.4 * g.wob, sq = g.sq;
    c.save(); c.globalAlpha = 1 - k; P.ell(cx, 273, 27 - k * 10, 4, 'rgba(30,14,30,0.35)');
    const B = A.body, H = Math.max(2, Math.round(B.height * (1 - 0.14 * sq) * (1 - k))), W = B.width, x0 = cx - (W >> 1), y0 = by - H;
    for (let r = 0; r < H; r++) { const sr = Math.min(B.height - 1, Math.floor(r * B.height / H)), off = Math.round(shear * (1 - r / H)); c.drawImage(B, 0, sr, W, 1, x0 + off, y0 + r, W, 1); }
    if (!g.open) { const lx = cx - 26 + Math.round(shear), ly = y0 - 11 - Math.round(g.lid); c.drawImage(A.lid, lx, ly); c.drawImage(A.bow, lx + 11, ly - 13);
      c.drawImage(A.tag, cx + 14 + Math.round(shear * 0.6), y0 + 6); P.vl(cx + 14 + Math.round(shear * 0.6), ly + 10, Math.max(0, y0 + 7 - ly - 10), '#fff2b0');
      if (g.lid > 3) { P.r(cx - 22, ly + 11, 44, 2, '#2a1424'); const ey = ly + 9; P.r(cx - 7, ey, 3, 2, '#fff'); P.r(cx + 4, ey, 3, 2, '#fff'); P.p(cx - 6, ey + 1, INK); P.p(cx + 5, ey + 1, INK); } // eyes peek out under the lifted lid
    }
    c.restore();
  }
  function giftTick(dt) {
    const g = gift; if (!g) return; g.t += dt;
    if (g.jy < 0 || g.vy) { g.vy += 900 * dt; g.jy += g.vy * dt; if (g.jy >= 0) { g.jy = 0; g.vy = 0; g.sq = 0.8; } }
    g.sq = Math.max(0, g.sq - dt * 4); g.wob = Math.max(0, g.wob - dt * 1.6); g.lid = Math.max(0, g.lid - dt * 3);
    if (!g.open && (g.idle -= dt) <= 0) { g.idle = rnd(2.4, 3.6); g.wob = 0.7; g.vy = -70; AUDIO.play('giggle'); for (let k = 0; k < 3; k++) HOME.fx.spawn('spark', 70 + rnd(0, 40), 230 + rnd(0, 20), { vy: -16, life: 0.6 }); }
  }

  // ---------- (2) her party: the decor, the cake, the candles ----------
  const FONT = { // 5×7 letters for the banner
    'Д': ['.###.', '.#.#.', '.#.#.', '.#.#.', '.#.#.', '#####', '#...#'], 'А': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'Ш': ['#.#.#', '#.#.#', '#.#.#', '#.#.#', '#.#.#', '#.#.#', '#####'], 'У': ['#...#', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
    'Л': ['..###', '.#..#', '.#..#', '.#..#', '.#..#', '.#..#', '#...#'], 'И': ['#...#', '#...#', '#..##', '#.#.#', '##..#', '#...#', '#...#'],
    'К': ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  };
  const DIG3 = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111'];
  let deco = null;
  function decoArt(age) {
    if (deco && deco.age === age) return deco;
    const mk = (w, h, fn) => { const c = PX.canvas(w, h); fn(Painter(c.getContext('2d')), c.getContext('2d')); return c; };
    const word = C().name.toUpperCase(), lw = word.length * 6 - 1, bw = lw + 12;
    const banner = mk(bw + 8, 15, (P, x) => { // a pink ribbon with notched ends and white letters
      P.r(0, 2, bw + 8, 11, INK); P.r(1, 3, bw + 6, 9, '#d9558a'); x.clearRect(0, 6, 2, 3); x.clearRect(bw + 6, 6, 2, 3); P.p(2, 6, INK); P.p(2, 8, INK); P.p(bw + 5, 6, INK); P.p(bw + 5, 8, INK); P.r(2, 7, 1, 1, INK); P.r(bw + 5, 7, 1, 1, INK);
      P.r(4, 0, bw, 15, INK); P.r(5, 1, bw - 2, 13, '#ff7aa8'); P.r(5, 1, bw - 2, 2, '#ffb0cb'); P.r(5, 12, bw - 2, 2, '#d9558a');
      let cx = 10; for (const ch of word) { const g = FONT[ch]; if (g) { for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) if (g[r][q] === '#') P.p(cx + q + 1, 4 + r + 1, '#a8306a'); for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) if (g[r][q] === '#') P.p(cx + q, 4 + r, '#ffffff'); } cx += 6; }
    });
    const num = (d) => mk(13, 20, (P) => { // a gold foil number: each font pixel = a 3×3 block, one outline round the whole figure
      const g = DIG3[d], M = (x, y) => x >= 0 && y >= 0 && x < 9 && y < 15 && g[Math.floor(y / 3) * 3 + Math.floor(x / 3)] === '1';
      for (let y = -1; y < 16; y++) for (let x = -1; x < 10; x++) if (!M(x, y) && (M(x - 1, y) || M(x + 1, y) || M(x, y - 1) || M(x, y + 1) || M(x - 1, y - 1) || M(x + 1, y + 1) || M(x - 1, y + 1) || M(x + 1, y - 1))) P.p(x + 2, y + 2, INK);
      let gl = 0; for (let y = 0; y < 15; y++) for (let x = 0; x < 9; x++) if (M(x, y)) { const top = !M(x, y - 1), bot = !M(x, y + 1), lf = !M(x - 1, y);
        P.p(x + 2, y + 2, bot ? '#c98a16' : top ? '#ffe68a' : lf ? '#ffdf6a' : '#f5c23a'); if (!gl && top && lf) { P.p(x + 2, y + 2, '#ffffff'); gl = 1; } }
      P.r(5, 17, 3, 2, '#c98a16'); P.p(6, 19, '#c98a16'); });
    const digits = String(age).split('').map((d) => num(+d));
    const ball = (c1, c2, c3) => mk(9, 12, (P) => { P.ell(4.5, 4.5, 4.5, 5, INK); P.ell(4.5, 4.5, 3.5, 4, c1); P.ell(5.2, 5.4, 2.6, 3, c2); P.r(2, 2, 2, 2, c3); P.r(3, 9, 3, 2, INK); P.p(4, 9, c2); });
    const balls = [ball('#ff7aa8', '#e0558a', '#ffd6e4'), ball('#7ad0ff', '#4aa0e0', '#e0f6ff'), ball('#ffd04a', '#e0a020', '#fff6c8'), ball('#9ee07a', '#5ab04a', '#e6ffd8'), ball('#c9a0ff', '#9a6ae0', '#f0e6ff')];
    deco = { age, banner, digits, balls }; return deco;
  }
  const FLAGS = ['#ff7aa8', '#ffd04a', '#7ad0ff', '#9ee07a', '#ffffff', '#c9a0ff'];
  function bunting(P, x0, y0, x1, y1, sag, ph) {
    const n = Math.max(2, Math.round((x1 - x0) / 7)), Y = (u) => y0 + (y1 - y0) * u + sag * Math.sin(Math.PI * u);
    for (let x = x0; x <= x1; x++) P.p(x, Math.round(Y((x - x0) / (x1 - x0))), '#6b4a3a');
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, fx = Math.round(x0 + (x1 - x0) * u), fy = Math.round(Y(u)) + 1, sw = Math.round(Math.sin(t * 2 + i + ph) * 0.6), col = FLAGS[(i + (ph | 0)) % FLAGS.length];
      for (let r = 0; r < 6; r++) { const hw = Math.max(0, 3 - Math.floor(r / 2)); P.r(fx - hw - 1 + (r > 2 ? sw : 0), fy + r, hw * 2 + 3, 1, INK); }
      for (let r = 0; r < 5; r++) { const hw = Math.max(0, 3 - Math.floor((r + 1) / 2)); P.r(fx - hw + (r > 2 ? sw : 0), fy + r, hw * 2 + 1, 1, col); } }
  }
  function drawDecor(c, P) {
    const b = force || bday() || { age: C().age0 }, A = decoArt(b.age);
    bunting(P, 1, 37, 67, 41, 7, 0); bunting(P, 127, 40, 179, 37, 6, 3);
    const bob = Math.round(Math.sin(t * 1.3) * 1);
    c.drawImage(A.banner, 4 - 2, 68 + bob); // «ДАШУЛИК» above the bed
    // a balloon bunch tied to the headboard
    const BB = [[12, 92, 0], [22, 86, 1], [32, 94, 2], [44, 88, 3], [54, 96, 4]];
    for (const [x, y, k] of BB) { const dy = Math.round(Math.sin(t * 1.6 + k) * 1.2), dx = Math.round(Math.sin(t * 1.1 + k * 2) * 0.8); P.line(x + 4 + dx, y + 11 + dy, 33, 124, '#8a7a7a'); c.drawImage(A.balls[k], x + dx, y + dy); }
    // the gold number balloons over the fireplace
    A.digits.forEach((d, i) => { const x = 138 + i * 16 - (A.digits.length - 2) * 8, y = 104 + (i % 2) * 4 + Math.round(Math.sin(t * 1.4 + i * 1.7) * 1.5); P.line(x + 6, y + 20, 151 + i * 2, 163, '#c9b27a'); c.drawImage(d, x, y); });
    // confetti on the floor (fixed)
    for (let i = 0; i < 26; i++) { const x = (i * 53 + 17) % 172 + 4, y = 236 + ((i * 37) % 64); if (y > 300) continue; P.r(x, y, i % 3 ? 2 : 1, i % 3 ? 1 : 2, FLAGS[i % FLAGS.length]); }
  }

  // the cake: two tiers (pink and cream), «24» in icing, the candles in two rows on top
  const CK = { x: 90, base: 309 };
  let cake = null; // { n, age, C: [{x, y, lit, ph, lean, col}], k (slide-in), dim, glow }
  const CANDLE = ['#ff7aa8', '#7ad0ff', '#ffd04a', '#9ee07a', '#c9a0ff', '#ffffff'];
  function cakeIn(b) {
    b = b || force || bday() || { age: C().age0, y: new Date().getFullYear() }; const n = b.age, Cs = [], front = Math.ceil(n / 2), back = n - front;
    const row = (k, y, off) => { const w = Math.min(42, (k - 1) * 3.6); for (let i = 0; i < k; i++) Cs.push({ x: Math.round(CK.x - w / 2 + (k > 1 ? i * w / (k - 1) : 0) + off), y, lit: 1, ph: Math.random() * 6, lean: 0, col: CANDLE[Cs.length % CANDLE.length] }); };
    row(front, 275, 0); row(back, 271, 1.8);
    cake = { n, age: b.age, y: b.y, C: Cs, k: 0, dim: 0 }; AUDIO.play('pop'); later(0.25, () => AUDIO.play('twinkle'));
    for (let k = 0; k < 16; k++) HOME.fx.spawn('spark', CK.x + rnd(-30, 30), 284 + rnd(-14, 16), { vy: -22, life: 0.9 });
    AUDIO.duck(true);
    later(0.5, () => AUDIO.play('hbd')); return 1.3;
  }
  const lit = () => (cake ? cake.C.filter((q) => q.lit).length : 0);
  function cakeOut() { if (!cake) return; AUDIO.stop('hbd'); AUDIO.duck(false); for (let k = 0; k < 8; k++) HOME.fx.spawn('puff', CK.x + rnd(-26, 26), 292 + rnd(-10, 10), { c: '#ffffff', r0: 2, r1: 7, life: 0.5, alpha: 0.8 }); cake = null; }
  function drawCake(c, P) {
    const k = cake, e = 1 - Math.pow(1 - Math.min(1, k.k), 3), oy = Math.round((1 - e) * 46), x = CK.x, y = CK.base + oy;
    P.ell(x, y + 1, 33, 4, 'rgba(30,14,30,0.35)'); P.ell(x, y, 32, 4, INK); P.ell(x, y - 0.5, 31, 3.2, '#f4f4f0'); P.ell(x, y - 1, 26, 2, '#ffffff');
    // the bottom tier (pink)
    const b0 = x - 30, bw = 60, bh = 16, bt = y - bh - 1; P.r(b0 - 1, bt - 1, bw + 2, bh + 2, INK); P.r(b0, bt, bw, bh, '#ff8fb6'); P.r(b0, bt + bh - 3, bw, 3, '#e0558a'); P.r(b0, bt, bw, 3, '#ffd6e4');
    for (let i = 0; i < bw; i += 5) { const d = 2 + ((i * 7) % 4); P.r(b0 + i, bt + 3, 3, d, '#ffd6e4'); P.p(b0 + i + 1, bt + 3 + d, '#ffd6e4'); }
    for (let i = 0; i < 7; i++) P.p(b0 + 4 + i * 8, bt + 11, i % 2 ? '#ffffff' : '#ffd04a');
    const ds = String(k.age).split(''); ds.forEach((d, i) => { const g = DIG3[+d], dx = x - ds.length * 4 + 1 + i * 8; for (let r = 0; r < 5; r++) for (let q = 0; q < 3; q++) if (g[r * 3 + q] === '1') P.r(dx + q * 2, bt + 4 + r * 2, 2, 2, '#8a2a4a'); }); // «24» in chocolate icing
    // the top tier (cream)
    const t0 = x - 23, tw = 46, th = 12, tt = bt - th; P.r(t0 - 1, tt - 1, tw + 2, th + 1, INK); P.r(t0, tt, tw, th, '#fff4e2'); P.r(t0, tt + th - 3, tw, 2, '#e8cba5'); P.r(t0, tt, tw, 3, '#ffffff');
    for (let i = 1; i < tw - 1; i += 4) { const d = 1 + ((i * 5) % 3); P.r(t0 + i, tt + 3, 2, d, '#ff8fb6'); }
    for (let i = 0; i < 9; i++) P.p(t0 + 3 + ((i * 11) % (tw - 5)), tt + 7 + (i % 3), ['#ff4f86', '#7ad0ff', '#ffd04a', '#9ee07a'][i % 4]);
    // the candles: back row first; a lit one has a flickering flame that leans away from a finger / a blow
    const L = k.C.slice().sort((a, b2) => a.y - b2.y);
    for (const q of L) { const cx = q.x, cy = q.y + oy; P.r(cx - 1, cy + 2, 2, 6, q.col); P.p(cx - 1, cy + 4, '#ffffff'); P.p(cx, cy + 6, 'rgba(0,0,0,0.25)'); P.p(cx - 1 + (cx & 1), cy + 1, '#3b2433');
      if (q.lit) { const f = Math.floor(t * 12 + q.ph) % 3, ln = Math.round(clamp(q.lean, -2, 2)), hgt = 3 + (f === 1 ? 1 : 0) - (Math.abs(q.lean) > 1.4 ? 1 : 0);
        P.r(cx - 1 + ln, cy + 1 - hgt, 2, hgt, '#ffb02a'); P.p(cx - 1 + ln + (f === 2 ? 1 : 0), cy - hgt, '#ff7a1a'); P.p(cx - 1 + ln, cy, '#fff6c8'); } }
  }
  function drawLight(c, P) { // the room dims while the candles burn; a warm glow around them
    const k = cake; if (!k || k.dim < 0.01) return;
    c.save(); c.globalAlpha = k.dim; c.fillStyle = '#140a24'; c.fillRect(0, 0, 180, 320); c.restore();
    const n = lit(); if (!n) return; const a = (0.16 + 0.34 * n / k.n) * Math.min(1, k.dim / 0.5);
    c.save(); c.globalCompositeOperation = 'lighter'; const gx = CK.x, gy = 268, R = 46 + 10 * n / k.n + Math.sin(t * 9) * 1.5;
    const g = c.createRadialGradient(gx, gy, 2, gx, gy, R); g.addColorStop(0, `rgba(255,190,90,${a})`); g.addColorStop(0.5, `rgba(255,140,60,${a * 0.45})`); g.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = g; c.fillRect(gx - R, gy - R, R * 2, R * 2); c.restore();
  }

  // ---------- blowing them out: the microphone or a finger ----------
  let blow = null, mic = null, finger = null, micErr = '';
  const panel = () => document.getElementById('blow');
  function blowStart() {
    if (!cake) return; blow = { mode: 'ask', lvl: 0, acc: 0, run: 0, floor: 0.005, heard: 0, quietT: 0, hint: '', weakT: 0, saidH: 0, saidA: 0, lastOut: t, done: 0 }; micErr = '';
    let w = panel(); if (w) w.remove(); w = document.createElement('div'); w.id = 'blow'; w.className = 'notch2'; $ui().appendChild(w); render();
  }
  function setMode(m, why) { if (!blow) return; blow.mode = m; if (why !== undefined) micErr = why; render(); }
  function render() {
    const w = panel(); if (!w || !blow) return; const m = blow.mode, n = lit(), N = cake ? cake.n : 0;
    const T = { ask: ['Загадай желание и задуй свечки!', 'Подуй на телефон — как на настоящий торт'], wait: ['Разреши микрофон', 'Телефон спросит — нажми «Разрешить»'],
      mic: ['Дуй на свечки!', 'Сильно и долго: «фу-у-у» прямо в микрофон'], finger: ['Потуши свечки пальцем', 'Проведи пальцем по огонькам'], done: ['Ура-а-а!', 'Все свечки задуты!'] }[m];
    let sub = T[1]; if (m === 'finger' && micErr) sub = (micErr === 'denied' ? 'Микрофон не разрешён' : 'Микрофон недоступен') + ' — ничего страшного! Потуши свечки пальцем: проведи по огонькам';
    if (m === 'mic' && blow.hint) sub = blow.hint;
    const showMic = m === 'ask' || (m === 'finger' && !micErr), showFin = m === 'ask' || m === 'mic' || m === 'wait';
    w.innerHTML = `<div class="b-t">${T[0]}</div><div class="b-s">${UI.esc(sub)}</div>${m === 'mic' ? '<div class="lv"><i></i></div>' : ''}<div class="bt">${showMic ? `<button class="btn g notch" id="blow-mic">${UI.im(UI.I('mic'))}<span>Подуть</span></button>` : ''}${showFin ? `<button class="btn w notch" id="blow-finger"><span>Пальцем</span></button>` : ''}</div><div class="b-n">${m === 'done' ? '' : `Горит ${n} из ${N}`}</div>`;
    const bm = w.querySelector('#blow-mic'), bf = w.querySelector('#blow-finger');
    if (bm) bm.onclick = () => { AUDIO.init(); AUDIO.play('click'); micStart(); };
    if (bf) bf.onclick = () => { AUDIO.init(); AUDIO.play('click'); micRelease(); AUDIO.quiet(false); setMode('finger', ''); };
  }
  function count() { const e = panel() && panel().querySelector('.b-n'); if (e && cake && blow && blow.mode !== 'done') e.textContent = `Горит ${lit()} из ${cake.n}`; }
  function micStart() {
    if (!blow || blow.mode === 'mic' || blow.mode === 'wait') return;
    const md = navigator.mediaDevices; AUDIO.init(); const ac = AUDIO.ctx;
    if (!ac || !md || !md.getUserMedia) { setMode('finger', 'none'); return; }
    setMode('wait'); AUDIO.quiet(true); // the music and the song stop: our own sound must not blow into the mic
    try { if (navigator.audioSession) navigator.audioSession.type = 'play-and-record'; } catch (e) { }
    let p; try { p = md.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); } catch (e) { p = Promise.reject(e); }
    p.then((stream) => {
      if (!blow || blow.mode !== 'wait') { stream.getTracks().forEach((q) => q.stop()); audioSessionBack(); return; }
      const src = ac.createMediaStreamSource(stream), an = ac.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = 0; const g = ac.createGain(); g.gain.value = 0;
      src.connect(an); an.connect(g); g.connect(ac.destination); if (ac.state !== 'running') ac.resume().catch(() => { });
      mic = { stream, src, an, g, buf: new Float32Array(an.fftSize), sr: ac.sampleRate, t0: t };
      blow.floor = 0.005; blow.run = 0; blow.heard = 0; blow.quietT = 0; setMode('mic');
    }).catch((e) => { micRelease(); AUDIO.quiet(false); if (blow && blow.mode !== 'done') setMode('finger', e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'denied' : 'none'); });
  }
  function audioSessionBack() { try { if (navigator.audioSession) navigator.audioSession.type = 'auto'; } catch (e) { } }
  function micRelease() {
    if (mic) { try { mic.src.disconnect(); mic.an.disconnect(); mic.g.disconnect(); } catch (e) { } try { mic.stream.getTracks().forEach((q) => q.stop()); } catch (e) { } mic = null; audioSessionBack(); }
  }
  // periodicity of a frame: the best normalized autocorrelation of the first difference (decimated to ~12 kHz) over pitch lags
  // 60–500 Hz. A voice / a hum / music / a whistle is high (> 0.5), a blow (turbulence) is low (validated in Python: tools/blow_wavs.py)
  let DY = null;
  function period(x, sr) {
    const dec = Math.max(1, Math.round(sr / 12000)), n = Math.floor(x.length / dec); if (!DY || DY.length < n) DY = new Float32Array(n);
    let prev = 0; for (let i = 0; i < n; i++) { let s = 0; for (let q = 0; q < dec; q++) s += x[i * dec + q]; s /= dec; DY[i] = s - prev; prev = s; }
    const fs = sr / dec, l0 = Math.floor(fs / 500), l1 = Math.min(n >> 1, Math.ceil(fs / 60)); let best = 0;
    for (let L = l0; L <= l1; L++) { let ab = 0, aa = 0, bb = 0; for (let i = 0; i + L < n; i++) { const a = DY[i], b = DY[i + L]; ab += a * b; aa += a * a; bb += b * b; } const r = ab / Math.sqrt(aa * bb + 1e-12); if (r > best) best = r; }
    return best;
  }
  function micTick(dt) {
    const B = blow, m = mic; if (!B || B.mode !== 'mic' || !m) return;
    const x = m.buf; if (m.an.getFloatTimeDomainData) m.an.getFloatTimeDomainData(x); else { const u = new Uint8Array(x.length); m.an.getByteTimeDomainData(u); for (let i = 0; i < x.length; i++) x[i] = (u[i] - 128) / 128; }
    let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; const rms = Math.sqrt(s / x.length);
    B.floor += (rms - B.floor) * Math.min(1, dt * (rms < B.floor ? 4 : 0.05));
    const thr = Math.max(0.03, Math.min(0.12, B.floor * 4)), loud = rms > thr, per = loud ? period(x, m.sr) : 0, on = loud && per < 0.45;
    B.run = on ? B.run + dt : 0; B.lvl = Math.max(Math.min(1, rms * 5), B.lvl - dt * 1.5);
    if (rms > 0.012) B.heard = t;
    const k = on ? Math.min(1, (rms - thr) / 0.2) : 0;
    for (const q of cake.C) if (q.lit) q.lean += ((on ? 1.2 + 1.4 * k : B.lvl * 1.2) * Math.sin(q.ph + t * 3) * 0.3 + (on ? 1.6 + k : 0) - q.lean) * Math.min(1, dt * 10);
    if (on && B.run >= 0.12) { B.acc += dt * (5 + 25 * k); if (k < 0.12) B.weakT += dt; while (B.acc >= 1 && lit()) { B.acc -= 1; outOne(); } }
    const lv = panel() && panel().querySelector('.lv i'); if (lv) lv.style.width = Math.round(B.lvl * 100) + '%';
    if (t - m.t0 > 8 && t - B.heard > 8 && B.hint !== 'deaf') { B.hint = 'deaf'; blow.hint = 'Не слышу… Подуй прямо в микрофон (он внизу телефона) — или потуши пальцем'; render(); }
    if (!B.saidH && B.weakT > 1.2 && lit() > 4) { B.saidH = 1; HOME.say(pick(LN().dHarder), 'happy'); }
  }
  function outOne() { const L = cake.C.filter((q) => q.lit); if (L.length) out(L[Math.floor(Math.random() * L.length)]); }
  function out(q) {
    if (!q.lit || !blow) return; q.lit = 0; blow.lastOut = t;
    HOME.fx.spawn('puff', q.x + rnd(-1, 1), q.y - 3, { c: '#d8d8e4', r0: 1, r1: 3, life: 0.9, alpha: 0.75, vy: -18, vx: rnd(-5, 5) + (blow.mode === 'mic' ? 6 : 0), wob: 3 });
    AUDIO.play('pff'); count();
    const n = lit(); if (!n) allOut(); else if (n <= 3 && !blow.saidA && cake.n > 6) { blow.saidA = 1; later(0.3, () => { if (blow && lit()) HOME.say(pick(LN().dAlmost), 'happy'); }); }
  }
  function allOut() {
    micRelease(); AUDIO.quiet(false); AUDIO.stop('hbd'); AUDIO.duck(false); setMode('done'); AUDIO.play('tada'); later(0.25, () => AUDIO.play('cheer'));
    HOME.fx.spawn('ring', CK.x, 272, { r0: 4, r1: 34, life: 0.5, c: '#ffd04a', sy: 0.5 });
    for (let k = 0; k < 40; k++) HOME.fx.spawn('confetti', rnd(10, 170), rnd(20, 80), { c: pick(FLAGS), vx: rnd(-30, 30), vy: rnd(-10, 40), g: 90, drag: 0.8, life: rnd(1.6, 2.6), wob: 5 });
    HOME.face('happy', 'laugh', 1.6); HOME.hop(170);
    later(1.1, () => { const w = panel(); if (w) w.remove(); blow = null; finger = null; });
  }
  function fingerAt(x, y) { if (!cake || !blow || blow.mode === 'done') return; for (const q of cake.C) { const dx = q.x - x, dy = q.y - y; if (q.lit && Math.abs(dx) <= 5 && Math.abs(dy) <= 6) out(q); else if (q.lit && Math.abs(dx) < 16 && Math.abs(dy) < 14) q.lean = clamp(q.lean + Math.sign(dx || 1) * 0.8, -2, 2); } }

  // ---------- input (HOME.down / move / up ask here first) ----------
  function down(x, y) {
    lastAct = t; // any touch at home: she is looking (the hot / cold hint waits)
    if (giftOn()) { giftTap(x, y); return true; }
    if (blow && blow.mode !== 'done') { if (blow.mode === 'ask' && cake && cake.C.some((q) => q.lit && Math.abs(q.x - x) <= 6 && Math.abs(q.y - y) <= 8)) setMode('finger', ''); finger = { x, y }; fingerAt(x, y); return true; }
    return busy() && (partyOn() || !!gift); // nothing else to tap during her party
  }
  function move(x, y) {
    if (!finger) return !!blow || giftOn(); const d = Math.hypot(x - finger.x, y - finger.y), n = Math.max(1, Math.ceil(d / 2));
    for (let i = 1; i <= n; i++) fingerAt(finger.x + (x - finger.x) * i / n, finger.y + (y - finger.y) * i / n); finger = { x, y }; return true;
  }
  function up() { if (finger) { finger = null; return true; } return giftOn() || (!!blow) || partyOn(); }

  // ---------- presents and the photo (the party script in friends.js calls these) ----------
  function gifts(f) {
    const s = S(), D = st(), b = force || due() || bday() || { y: new Date().getFullYear() }, c = C();
    const tx = HOME.mk.x, ty = HOME.headTop() + 20, T = 0.7, gr = 260, fx0 = f ? f.x : 40, fy0 = f ? f.headY + 8 : 250; AUDIO.play('whoosh');
    HOME.fx.spawn('img', fx0, fy0, { img: ART.icon('gift'), vx: (tx - fx0) / T, vy: (ty - fy0 - 0.5 * gr * T * T) / T, g: gr, life: T });
    later(T, () => {
      AUDIO.play('star'); for (let k = 0; k < 8; k++) HOME.fx.spawn('puff', tx + rnd(-16, 16), ty + rnd(-14, 18), { c: '#ffffff', r0: 2, r1: 7, life: 0.6, alpha: 0.85 });
      for (let k = 0; k < 6; k++) HOME.fx.spawn('heart', tx + rnd(-20, 20), ty - rnd(0, 16), { vy: -22, life: 1.1, wob: 4 });
      if (!D.gifts[b.y] || force) { if (!force) D.gifts[b.y] = GAME.dayStr(new Date()); GAME.addCoins(c.coins, 'gift'); s.inv.cake = (s.inv.cake || 0) + c.cakes; GAME.save(true); later(0.2, () => AUDIO.play('coin')); }
      UI.toast(`Подарки от друзей: ${c.coins} монет и ${c.cakes} торта в холодильнике!`, UI.I('gift'), 'gold', 4200); UI.refresh();
    });
    return T + 0.9;
  }
  function photo(top) {
    const b = force || due() || bday() || { y: new Date().getFullYear(), age: C().age0 }, D = st();
    HOME.photo({ title: 'День рождения Дашулика', cap: `${C().name}у ${b.age}! С днём рождения!`, top, k: 'dasha:' + b.y });
    if (force) force.done = true; else D.party[b.y] = GAME.dayStr(new Date());
    const ms = S().moments || (S().moments = {}); ms['dasha:' + b.y] = 1; GAME.save(true);
  }
  function secretsHint() { const D = st(); D.seen = 1; GAME.save(true); lastHint = t; const d = HOME.say(pick(LN().dSecrets), 'happy') || 3; return d + 0.6; }
  function abort() { micRelease(); AUDIO.quiet(false); AUDIO.stop('hbd'); AUDIO.duck(false); const w = panel(); if (w) w.remove(); blow = null; finger = null; cake = null; introUntil = t + 3; }

  // ---------- (3) «24 секрета» (Round 23: one at a time) ----------
  function slots() { // the secrets with a text, in order (the test build: samples in all 24 while his texts are not in yet)
    const c = C(), demo = TEST() && !SEAL && !c.secrets.some((x) => x.text); // Round 26: with real notes the test build is the real hunt
    return c.secrets.map((x) => ({ n: x.n, spot: x.spot, text: x.text || TXT[x.n] || (demo ? `Здесь будет записка для ${c.name}а №${x.n} (${rn((c.spots[x.spot] || {}).room)}: ${(c.spots[x.spot] || {}).w || x.spot}). Текст — в docs/24-secrets.md` : ''), img: x.img || IMG[x.n] || '', locked: !dbg.unseal && !x.text && !TXT[x.n] && !opened && !!SEAL && SEAL.n.includes(x.n) })).filter((x) => x.text || x.locked);
  }
  function place(x) { const p = C().spots[x.spot] || { room: 'zal', x: 90, y: 150 }; return Object.assign({}, p, { n: x.n, spot: x.spot, text: x.text, img: x.img, found: !!st().found[x.n] }); }
  const nextSlot = () => { const D = st(); return D.gift ? slots().find((x) => !D.found[x.n]) || null : null; };
  function current() { if (pend) return null; const x = nextSlot(); return x ? place(x) : null; } // the one hidden now (none while its card is open)
  function secrets() { const D = st(), c = current(); if (!D.gift) return []; return slots().filter((x) => D.found[x.n] || (c && c.n === x.n)).map(place); } // found + the hidden one
  const heartsOn = () => slots().length > 0 && !!st().gift;
  const foundN = () => { const D = st(); return slots().filter((x) => D.found[x.n]).length; };
  // how a spot hides it: clip = only that part shows; behind = the room's own pixels of that kind cover it (bt = the brightness line for
  // 'light' / 'dark', r+g+b); dark = blends into the shadow around it; a = behind glass. Cut once per room visit from the picture under it.
  const COVER = { leaf: (r, g, b) => g > r + 8 && g >= b, dark: (r, g, b, bt) => r + g + b < (bt || 270), light: (r, g, b, bt) => r + g + b > (bt || 600), grey: (r, g, b) => Math.abs(r - g) < 16 && Math.abs(g - b) < 16 && r + g + b > 200 && r + g + b < 640 };
  const spotC = {}; let cutRoom = null;
  function spotArt(h, cx0) { // the heart as it shows on its spot: the room under it (picture + its moving things so far) decides
    const bg = ROOMS.build(h.room, S().home), e0 = spotC[h.spot]; if (e0 && e0.bg === bg && cutRoom === h.room) return e0; cutRoom = h.room;
    const A = art().mini, w = A.width, hh = A.height, x0 = h.x - (w >> 1), y0 = h.y - (hh >> 1), src = A.getContext('2d').getImageData(0, 0, w, hh).data;
    const B = cx0.getImageData(x0, y0, w, hh).data, cov = COVER[h.behind];
    const c = PX.canvas(w, hh), cx = c.getContext('2d'), im = cx.createImageData(w, hh), d = im.data, vis = [], k = h.dark || 0, al = h.a || 1;
    for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) { const q = (j * w + i) * 4, X = x0 + i, Y = y0 + j; if (!src[q + 3]) continue;
      if (h.clip && (X < h.clip[0] || Y < h.clip[1] || X >= h.clip[2] || Y >= h.clip[3])) continue;
      if (cov && cov(B[q], B[q + 1], B[q + 2], h.bt)) continue;
      for (let ch = 0; ch < 3; ch++) d[q + ch] = Math.round(src[q + ch] * (1 - k) + B[q + ch] * 0.85 * k); // in shadow: mostly the room's own (a bit darker) colour
      d[q + 3] = Math.round(255 * al); vis.push([X, Y]); }
    cx.putImageData(im, 0, 0); vis.sort((p, q) => p[1] - q[1] || q[0] - p[0]);
    return (spotC[h.spot] = { bg, c, x0, y0, g: vis[0] || [h.x, h.y - 2], n: vis.length });
  }
  function drawHearts(c, P, room) {
    if (busy() || dbg.off) return; const h = current(); if (!h || h.room !== room) { cutRoom = null; return; } const A = art().mini; // (re-cut on the next visit)
    if (dbg.plain) return; // (the tests: a plain heart over everything, see draw 'top')
    const e = spotArt(h, c); c.drawImage(e.c, e.x0, e.y0);
    // a rare glint (every ~13 s — Round 24, was 7 — and when a tap lands close or he says «Тепло!») — the only thing that ever moves
    const g = dbg.glint && (((t + h.n * 1.37) % 13) < 0.2 || (t >= glintAt && t - glintAt < 0.5)); if (!g) return;
    const [gx, gy] = e.g; c.save(); c.globalAlpha = 0.9; P.p(gx, gy - 1, '#ffffff'); c.globalAlpha = 0.55; P.p(gx - 1, gy - 1, '#ffffff'); P.p(gx + 1, gy - 1, '#ffffff'); P.p(gx, gy - 2, '#ffffff'); P.p(gx, gy, '#ffffff'); c.restore();
  }
  function hit(room, x, y) {
    if (busy()) return null; const h = current(); if (!h || h.room !== room) return null; const d = Math.hypot(h.x - x, h.y - y);
    if (d < 9) return () => findHeart(h);
    if (d < 45) {
      if (d < 18) { glintAt = t; AUDIO.play('chime', 1.6); }
      else if (d < 30) AUDIO.play('chime', 1.25);
      else AUDIO.play('chime', 1.0);
    }
    return null;
  }
  function findHeart(h) {
    const D = st(); if (D.found[h.n]) return; D.found[h.n] = Date.now(); GAME.save(true); pend = true; hot = 0; cold = 0;
    AUDIO.play('twinkle'); later(0.1, () => AUDIO.play('star'));
    HOME.fx.spawn('ring', h.x, h.y, { r0: 3, r1: 16, life: 0.45, c: '#ff8ab0' });
    for (let k = 0; k < 10; k++) HOME.fx.spawn('heart', h.x + rnd(-6, 6), h.y + rnd(-4, 4), { vy: -rnd(18, 36), vx: rnd(-22, 22), life: 1.1, wob: 4, fadeIn: k * 0.03 });
    for (let k = 0; k < 6; k++) HOME.fx.spawn('spark', h.x + rnd(-10, 10), h.y + rnd(-8, 8), { vy: -14, life: 0.7 });
    HOME.lookAt(h.x, h.y, 2); HOME.face('happy', 'laugh', 1.2);
    later(0.45, () => { card(h.n); const all = foundN() >= slots().length; HOME.say(pick(all ? LN().dAllHearts : LN().dHeart), 'happy'); });
  }
  function ticketModal() {
    AUDIO.play('star');
    const w = UI.modal(`<div class="hcard ticket-modal"><div class="t-badge">Пригласительный билет № 24 • Серия 21.11.2026</div><h2 class="t-title">Праздничный ужин в ресторане</h2><div class="t-sub">В честь 24-летия Дашули ✨</div><div class="t-meta"><div><span>Кому:</span> <b>Даше ❤️</b></div><div><span>С кем:</span> <b>Слава (Loveашик)</b></div><div><span>Формат:</span> <b>Столик на двоих</b></div><div><span>Дата:</span> <b>Любой день по твоему выбору</b></div></div><p class="t-desc">Все 24 секрета найдены! Этот билет даёт право на праздничный ужин в ресторане: любые блюда и десерты из меню, напитки, уютную атмосферу и вечер только для нас двоих.</p><div class="t-foot">Действителен при личном предъявлении любимому человеку</div><div class="t-stub"><div class="t-stub-code">2111-2002-2026-LOVE</div><div class="t-stub-sig">С любовью, твой Loveашик ♥</div></div><div class="t-actions"><a class="btn g" href="dist/abibyan-ticket.pdf" target="_blank" download="abibyan-ticket.pdf">🖨️ Скачать PDF для печати</a><a class="btn" href="dist/ticket_preview.png" target="_blank" download="ticket_preview.png">🖼️ Открыть картинку билета</a><button class="btn" id="btn-show-slava">💖 Предъявить Славе</button></div><button class="btn" data-close style="margin-top:2u;">Закрыть</button></div>`, { dismiss: true });
    const btnSlava = w.querySelector('#btn-show-slava');
    if (btnSlava) {
      btnSlava.onclick = () => {
        AUDIO.play('fanfare');
        btnSlava.textContent = '✅ Предъявлено! Ждём вечера ♥';
        btnSlava.disabled = true;
        btnSlava.classList.add('g');
        HOME.face('happy', 'laugh', 2.5);
        HOME.say('Ура! Билет активирован! Славе всё передано ♥', 'happy');
        UI.toast('Билет активирован! Сохрани его на память или распечатай', UI.I('heart'), 'gold');
      };
    }
    return w;
  }
  function card(n) {
    const x = slots().find((q) => q.n === n); if (!x) return; if (x.locked) { withNotes(() => card(n)); return; } /* Round 26: her question first */ const k = foundN(), N = slots().length, all = k >= N, fin = all && (C().final || TXT.final || '');
    const w = UI.modal(`<div class="hcard"><img class="px hero" src="${art().heart.toDataURL()}" alt=""><h2>Секрет №${n}</h2>${x.img ? `<img class="hpic" src="${x.img}" alt="">` : ''}<p class="htxt">${UI.esc(x.text)}</p>${fin ? `<p class="htxt fin">${UI.esc(fin)}</p>` : ''}<div class="hint">Найдено ${k} из ${N}${all ? ' — все 24 секрета раскрыты!' : ''}</div>${all ? '<button class="btn g pulse" id="btn-ticket">🎫 Получить билет в ресторан!</button>' : '<button class="btn g" data-close>Искать следующее</button>'}</div>`, { dismiss: true });
    if (all) {
      const bt = w.querySelector('#btn-ticket');
      if (bt) bt.onclick = () => { UI.closeModal(); ticketModal(); };
    }
    return w;
  }
  function albumHtml() {
    const D = st(), all = slots(), k = foundN(), nx = nextSlot(), RN = {}; for (const r of DATA.ROOMS) RN[r.id] = r.name;
    const hi = art().heart.toDataURL();
    const cells = all.map((x) => { const f = !!D.found[x.n], o = !f && nx && nx.n === x.n, p = C().spots[x.spot] || {};
      return `<div class="hs notch ${f ? 'on' : o ? 'cur' : 'lock'}" data-n="${x.n}"><span class="hn">№${x.n}</span>${f ? `<img class="px" src="${hi}" alt=""><b>${x.locked ? 'Под замком' : UI.esc(x.text.slice(0, 22)) + (x.text.length > 22 ? '…' : '')}</b>` : o ? `<i class="hq">?</i><b>${RN[p.room] || ''}</b>` : `<i class="hq">${UI.im(UI.I('lock'))}</i><b>Потом</b>`}</div>`; });
    const isAll = k >= all.length;
    const banner = isAll ? `<div class="hs-ticket-banner notch" id="album-ticket-btn" style="background:linear-gradient(135deg,#fff0f5,#ffe4ee);border:1u solid #e8a8c0;padding:3u;margin-bottom:3u;border-radius:3u;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:2u;font-weight:700;color:#8c264a;">🎫 <span>Все 24 секрета открыты! Нажми, чтобы открыть билет в ресторан</span></div>` : '';
    return `${banner}<div class="hint gm-n">Найдено ${k} из ${all.length}</div><div class="hs-grid">${cells.join('')}</div><div class="hint">Абибян прячет сердечки по одному: найдёшь одно — он спрячет следующее, в другой комнате. Ищи и трогай!</div>`;
  }
  function albumBind(body) {
    const tb = body.querySelector('#album-ticket-btn');
    if (tb) tb.onclick = () => { AUDIO.play('click'); ticketModal(); };
    body.querySelectorAll('.hs').forEach((c) => c.onclick = () => { const n = +c.dataset.n; if (c.classList.contains('on')) { AUDIO.play('click'); card(n); return; }
      AUDIO.play('nope'); const x = slots().find((q) => q.n === n), p = x && C().spots[x.spot], nx = nextSlot();
      UI.toast(c.classList.contains('lock') ? (nx ? `Сначала найди сердечко №${nx.n}` : 'Это сердечко Абибян спрячет позже') : `Это сердечко где-то тут: ${rn(p && p.room)}`, UI.I('heart')); });
  }

  // ---------- per frame / every 0.3 s ----------
  function update(dt) {
    t += dt; for (let i = timers.length - 1; i >= 0; i--) if (t >= timers[i].at) { const f = timers[i].fn; timers.splice(i, 1); try { f(); } catch (e) { console.error(e); } }
    giftTick(dt);
    if (cake) { cake.k = Math.min(1, cake.k + dt * 1.8); const want = lit() && blow ? 0.5 : lit() && cake.k < 1 ? 0.5 * cake.k : 0; cake.dim += (want - cake.dim) * Math.min(1, dt * (want ? 2 : 1.2));
      for (const q of cake.C) if (q.lit && (!blow || blow.mode !== 'mic')) q.lean *= Math.max(0, 1 - dt * 3); }
    micTick(dt);
    const on = partyOn(); if (on !== partyWas) { partyWas = on; $ui().classList.toggle('bday', on); if (!on && cake) cakeOut(); if (!on && blow) abort(); }
  }
  function check() { // main.js, every 0.3 s at home: her party when it is due; the secrets hint; new hearts
    if (APP.scene !== 'home' || giftOn()) return;
    const s = S(), D = st(), b = due();
    if (b) {
      if (t < introUntil || FRIENDS.partyOn() || UI.hasModal() || UI.sheetOpen || HOME.inTrans() || goingZal) return;
      if (HOME.room !== 'zal') { goingZal = true; HOME.say(pick(LN().dGoZal), 'happy'); later(1.6, () => { goingZal = false; HOME.goTo('zal'); }); return; }
      if (s.sleeping) { HOME.wake(); HOME.say(pick(LN().dWake), 'happy'); introUntil = t + 2.4; return; }
      if (FRIENDS.dashaParty(b)) $ui().classList.add('bday');
      return;
    }
    if (!heartsOn() || FRIENDS.partyOn() || UI.hasModal() || UI.sheetOpen || s.sleeping || FRIENDS.busy() || t < introUntil + 2 || !GAME.tutDone()) return;
    if (pend) { pend = false; lastHint = t; if (current()) { HOME.say(pick(LN().dNext), 'happy'); UI.toast('Новое сердечко спрятано! Ищи', UI.I('heart'), 'gold'); } return; } // its card closed → the next one
    const h = current(); if (!h) return;
    if (!D.seen) { secretsHint(); return; }
    if (HOME.inTrans() || t - Math.max(lastAct, lastHint) < HINT_S) return; // 1.5 minutes of looking without luck → he helps
    lastHint = t;
    if (h.room === HOME.room) { hot++; cold = 0; HOME.say(pick(LN().dHot), 'happy'); glintAt = t + 0.8; }
    else { cold++; hot = 0; HOME.say(cold >= 2 ? (LN().dRoom[['zal', 'kitchen', 'bath', 'hall', 'balcony'].indexOf(h.room)] || pick(LN().dCold)) : pick(LN().dCold)); }
  }
  function draw(c, P, layer) {
    const room = HOME.room;
    if (layer === 'back') { if (room === 'zal' && decor()) drawDecor(c, P); drawHearts(c, P, room); return; }
    if (layer === 'top') {
      if (dbg.plain && !busy()) { const h = current(), A = art().mini; if (h && h.room === room) c.drawImage(A, h.x - (A.width >> 1), h.y - (A.height >> 1)); }
      if (gift) { const k = gift.open ? Math.max(0, 1 - (t - gift.open) / 0.5) : 1; c.save(); c.globalAlpha = 0.5 * k; c.fillStyle = '#140a24'; c.fillRect(0, 0, 180, 320); c.restore();
        if (k > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(90, 248, 4, 90, 248, 70); g.addColorStop(0, `rgba(255,210,150,${0.42 * k})`); g.addColorStop(1, 'rgba(255,180,120,0)'); c.fillStyle = g; c.fillRect(0, 160, 180, 160); c.restore(); }
        drawGift(c, P); }
      if (cake && room === 'zal') { drawLight(c, P); drawCake(c, P); }
    }
  }
  function pause() { if (blow && (blow.mode === 'mic' || blow.mode === 'wait')) { micRelease(); AUDIO.quiet(false); setMode('ask'); } } // the app went to the background: let the microphone go
  // test build: abibyan-test.html#bday (or #bday=2027) — her party right now; #gift — the gift box again
  function boot() {
    if (SEAL && st().key && window.crypto && crypto.subtle) auto = openWith(st().key); // Round 26: her saved key opens the notes at the start
    // «…/abibyan/#bday» (also in the real game): a rehearsal of her party on any day — on HIS phone, to try the microphone before
    // the day; nothing is marked done, so the real party on 21.11 still comes (#bday=2027: a later year's cake)
    const h = location.hash || '', m = h.match(/bday(?:=(\d{4}))?/);
    if (m) { const y = m[1] ? +m[1] : Math.max(C().year0, new Date().getFullYear()); force = { y, age: C().age0 + (y - C().year0), diff: 0 }; introUntil = 2; }
  }
  return {
    sealed: () => !opened, // Round 26: the notes are still under the lock (test/r26.js)
    boot, update, check, draw, down, move, up, pause, giftStart, giftOn, hideMk: () => giftOn(), giftBox: () => Object.assign({}, BOX), giftTaps: () => (gift ? gift.taps : 0),
    busy, due, decor, bday, cakeIn, cakeOut, cakeLit: lit, blowStart, gifts, photo, secretsHint, abort, heartsOn, secrets, current, hit, foundN, card, albumHtml, albumBind,
    dbg, heartSize: () => { const A = art().mini; return { w: A.width, h: A.height }; },
    blowInfo: () => blow && cake ? { mode: blow.mode, n: cake.n, lit: lit(), lvl: Math.round(blow.lvl * 100) / 100, err: micErr || null } : null,
    candles: () => (cake ? cake.C.map((q) => ({ x: q.x, y: q.y, lit: !!q.lit })) : []), micOn: () => !!mic, _period: period,
    get force() { return force; },
  };
})();
