'use strict';
// ===== DOM UI layer =====
const UI = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  const U = (n) => `calc(var(--u)*${n})`;
  const UX = (n) => `calc(var(--ux,var(--u))*${n})`;
  const UY = (n) => `calc(var(--uy,var(--u))*${n})`;
  const I = (id) => ART.url('i', id), F = (id) => ART.url('f', id);
  const im = (src, cls = 'px') => `<img class="${cls}" src="${src}" draggable="false" alt="">`;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const S = () => GAME.S;
  let root, hud, bar, sheet, modalEl, toasts, fx, roomt, ghud, view; let sheetKind = null, sheetTab = null, sheetSub = null; let modalStack = [];
  // ---- tiny painter icons ----
  const picon = (w, h, fn) => { const c = PX.canvas(w, h); fn(Painter(c.getContext('2d'))); return c.toDataURL(); };
  const ARR = {
    L: picon(7, 11, (P) => { for (let i = 0; i < 6; i++) { P.r(5 - i, 5 - i, 1 + i * 0 + 1, 1 + i * 2, '#3b2433'); } P.r(1, 5, 6, 1, '#3b2433'); for (let i = 0; i < 6; i++) P.r(6 - i, 5 - i, 1, 1 + i * 2, '#3b2433'); }),
    R: picon(7, 11, (P) => { for (let i = 0; i < 6; i++) P.r(i, 5 - i, 1, 1 + i * 2, '#3b2433'); }),
    l: picon(5, 8, (P) => { for (let i = 0; i < 4; i++) P.r(4 - i, 4 - i, 1, i * 2 + 1 - 1 + 1, '#3b2433'); }),
    r: picon(5, 8, (P) => { for (let i = 0; i < 4; i++) P.r(i, 4 - i, 1, i * 2 + 1, '#3b2433'); }),
  };
  ARR.L = picon(7, 11, (P) => { for (let i = 0; i < 6; i++) P.r(i, 5 - i, 1, 1 + i * 2, '#3b2433'); });
  ARR.R = picon(7, 11, (P) => { for (let i = 0; i < 6; i++) P.r(6 - i, 5 - i, 1, 1 + i * 2, '#3b2433'); });
  ARR.l = picon(5, 8, (P) => { for (let i = 0; i < 4; i++) P.r(i, 3.5 - i, 1, 1 + i * 2, '#3b2433'); });
  ARR.r = picon(5, 8, (P) => { for (let i = 0; i < 4; i++) P.r(4 - i, 3.5 - i, 1, 1 + i * 2, '#3b2433'); });
  // ---- thumbnails for decor & clothes ----
  const thumbs = {};
  function fitThumb(cv, box = 32) { const c = PX.canvas(box, box), x = c.getContext('2d'); let k = Math.floor(Math.min(box / cv.width, box / cv.height)); if (k >= 1) { k = Math.min(k, 2); const w = cv.width * k, h = cv.height * k; x.drawImage(cv, Math.floor((box - w) / 2), Math.floor((box - h) / 2), w, h); } else { const d = Math.ceil(Math.max(cv.width / box, cv.height / box)); const w = Math.floor(cv.width / d), h = Math.floor(cv.height / d); const sx = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; const out = x.createImageData(w, h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const si = ((j * d + (d >> 1)) * cv.width + i * d + (d >> 1)) * 4, di = (j * w + i) * 4; for (let q = 0; q < 4; q++) out.data[di + q] = sx[si + q]; } x.putImageData(out, Math.floor((box - w) / 2), Math.floor((box - h) / 2)); } return c.toDataURL(); }
  const SPX = MONKEY.sprite, IT = MONKEY.K.IT;
  function trim(cv) { // cut a canvas down to its opaque pixels (so a thing drawn in a bigger box fills its thumbnail)
    const w = cv.width, h = cv.height, d = cv.getContext('2d').getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return cv; const c = PX.canvas(x1 - x0 + 1, y1 - y0 + 1); c.getContext('2d').drawImage(cv, -x0, -y0); return c;
  }
  const DECOR_THUMB = {
    lamp: () => ROOMS.FUR.lamp(), disco: () => ROOMS.FUR.disco(),
    garland: () => SPX(30, 14, (a) => { const cs = ['#ff5c6c', '#ffd23a', '#3fdc7a', '#59c1ff', '#b48cff']; for (let k = 0; k < 5; k++) a.ell(3 + k * 6, 7 + Math.sin(k) * 2, 2, 2.6, IT, a.mat('gl' + k, cs[k])); }),
    magnets: () => SPX(28, 20, (a) => { a.ell(7, 9, 5, 5, IT, a.mat('magR', '#ef4d6a')); a.rbox(13, 2, 26, 18, 1, IT, a.mat('photo', '#ffffff')); }, (d) => { for (let y = 4; y <= 15; y++) d.hline(15, 24, y, y < 10 ? '#8fd3ff' : '#7cc25a'); }),
    clock: () => ROOMS.FUR.clock(), cactus: () => ROOMS.FUR.cactus(),
    duck: () => SPX(18, 15, (a) => { const dk = a.mat('duck', '#ffd23a'); a.ell(10, 10, 7, 4.4, IT, dk); a.ell(6, 5, 4, 3.8, IT, dk); a.ell(1.8, 6.2, 2, 1.2, IT, a.mat('beak', '#ff8a2a')); }, (d) => { d.px(5, 4, '#2a1a10'); d.px(11, 9, '#e8b020'); d.px(12, 9, '#e8b020'); }),
    bathmat: () => ROOMS.upThumb('bathmat') || ROOMS.FUR.mat(), fern: () => ROOMS.FUR.fern(), nightlight: () => ROOMS.FUR.nightlight(), poster: () => ROOMS.FUR.poster(),
    hammock: () => ROOMS.upThumb('hammock'), gnome: () => ROOMS.FUR.gnome(), flamingo: () => ROOMS.FUR.flamingo(),
    feeder: () => ROOMS.upThumb('feeder'), flowers: () => ROOMS.upThumb('flowers'), telescope: () => ROOMS.upThumb('telescope'), lava: () => ROOMS.upThumb('lava'), radio: () => ROOMS.upThumb('radio'), soundbar: () => ROOMS.upThumb('soundbar'),
    ...Object.fromEntries(DATA.BOUGHT9.map((id) => [id, () => trim(ROOMS.upThumb(id))])), // Round 9 #2: drawn by their rooms, cut to their pixels
    switch2: () => ROOMS.upThumb('switch2'), ps5: () => ROOMS.upThumb('ps5'),
  };
  function upIcon(k, v) { const key = 'up_' + k + '_' + v; if (thumbs[key]) return thumbs[key]; const cv = ROOMS.upThumb(k, v); return (thumbs[key] = cv ? fitThumb(cv) : I('home')); }
  function decorThumb(id) {
    if (thumbs[id]) return thumbs[id]; const D = DATA.DECOR[id];
    const fn = DECOR_THUMB[id]; return (thumbs[id] = fn ? fitThumb(fn()) : I('home'));
  }
  const CROP = { hat: -74, glasses: -66, top: -36, bottom: -18, neck: -50, feet: -6 };
  function clothThumb(id) {
    if (thumbs['c_' + id]) return thumbs['c_' + id]; const C = DATA.CLOTHES[id]; const cl = { [C.slot]: id };
    const sp = MONKEY.compose({ s: 0.8, cloth: cl, eyes: { mode: 'open' }, noStubble: 1 }); const c = PX.canvas(32, 32);
    c.getContext('2d').drawImage(sp.cv, Math.round(sp.ox - 16), Math.round(sp.oy + CROP[C.slot] * 0.8 - 16), 32, 32, 0, 0, 32, 32); return (thumbs['c_' + id] = c.toDataURL());
  }
  // ---- init ----
  function init() {
    root = $('#ui');
    root.innerHTML = `
      <div id="hud">
        <div class="row"><div class="lvl" id="h-lvl">${im(I('star'))}<b>1</b></div><div class="xp notch" id="h-xp"><i></i></div><div class="name" id="h-name"></div><div class="sp"></div><button class="ibtn notch gbtn" id="h-grow" aria-label="Рост и задания">${im(I('sprout'))}<i class="gb"><b></b></i><span class="badge hidden">0</span></button>
          <div class="pill notch" id="h-coins">${im(I('coin'))}<span>0</span></div><button class="ibtn notch" id="h-phone" aria-label="Телефон">${im(I('phone'))}</button><button class="ibtn notch" id="h-shop" aria-label="Магазин">${im(I('shop'))}</button></div>
        <div class="row"><div class="stat notch" id="s-food" title="Еда"><div class="f"></div>${im(I('food'))}</div><div class="stat notch" id="s-fun" title="Веселье"><div class="f"></div>${im(I('fun'))}</div><div class="stat notch" id="s-energy" title="Энергия"><div class="f"></div>${im(I('energy'))}</div><div class="stat notch" id="s-clean" title="Чистота"><div class="f"></div>${im(I('clean'))}</div>
          <div class="sp"></div><div class="pill notch" id="h-kg" style="cursor:pointer">${im(I('scale'))}<span>6 кг</span></div><button class="ibtn notch" id="h-ach" aria-label="Достижения">${im(I('trophy'))}</button><button class="ibtn notch" id="h-set" aria-label="Настройки">${im(I('gear'))}</button></div>
      </div>
      <div id="roomt" class="notch"></div>
      <div id="view"><div id="fx" class="np"></div></div>
      <div id="bar"></div>
      <div id="ghud" class="hidden"></div>
      <div id="toasts" class="np"></div>
      <div id="sheet"></div>
      <div id="modalw"></div>`;
    hud = $('#hud'); bar = $('#bar'); view = $('#view'); sheet = $('#sheet'); toasts = $('#toasts'); fx = $('#fx'); roomt = $('#roomt'); ghud = $('#ghud'); modalEl = $('#modalw');
    $('#h-shop').onclick = () => { click(); openShop('food'); };
    $('#h-phone').onclick = () => { click(); HOME.phone(); };
    $('#h-ach').onclick = () => { click(); openAch(); };
    $('#h-grow').onclick = () => { click(); openGrow(); };
    $('#h-set').onclick = () => { click(); openSettings(); };
    $('#h-kg').onclick = () => { click(); openProfile(); };
    $('#h-name').onclick = () => { click(); openProfile(); };
    ['food', 'fun', 'energy', 'clean'].forEach((k) => { $('#s-' + k).onclick = () => { click(); const n = { food: 'Еда', fun: 'Веселье', energy: 'Энергия', clean: 'Чистота' }[k]; const how = { food: 'Корми на кухне', fun: 'Играй и щекочи', energy: 'Спи в спальне', clean: 'Мой в ванной' }[k]; toast(`${n}: ${Math.round(S().st[k])}% — ${how}`, I(k)); }; });
    refresh();
  }
  const click = () => AUDIO.play('click');
  // HUD reward feedback (skill: maximizing-game-feel — counters tick up, the pill pops; spending gives a small nudge)
  let coinShown = null, coinTw = null; const lastSt = {};
  const replay = (el, cls) => { el.classList.remove('up', 'down', 'gain'); void el.offsetWidth; el.classList.add(cls); };
  function coinsTo(v) {
    const el = $('#h-coins span'); if (coinShown === null || document.hidden) { coinShown = v; coinTw = null; el.textContent = v; return; }
    if (coinTw ? coinTw.to === v : coinShown === v) return;
    const from = coinShown, dur = Math.min(700, 260 + Math.abs(v - from) * 10), tw = coinTw = { to: v, t0: performance.now() };
    replay($('#h-coins'), v > from ? 'up' : 'down');
    const step = (now) => { if (coinTw !== tw) return; const k = Math.min(1, (now - tw.t0) / dur), e = 1 - Math.pow(1 - k, 3); coinShown = Math.round(from + (v - from) * e); el.textContent = coinShown; if (k < 1) requestAnimationFrame(step); else coinTw = null; };
    requestAnimationFrame(step); setTimeout(() => { if (coinTw === tw) { coinTw = null; coinShown = v; el.textContent = v; } }, dur + 400); // fallback if rAF is throttled
  }
  function refresh() {
    const s = S(); if (!hud) return;
    if (typeof TUT !== 'undefined') TUT.check();
    coinsTo(s.coins); $('#h-lvl b').textContent = s.lvl; $('#h-xp i').style.width = Math.min(100, s.xp / DATA.xpNeed(s.lvl) * 100) + '%';
    $('#h-name').textContent = s.name; $('#h-kg span').textContent = s.kg.toFixed(1).replace('.', ',') + ' кг';
    for (const k of ['food', 'fun', 'energy', 'clean']) { const v = s.st[k], e = $('#s-' + k); if (lastSt[k] !== undefined && v - lastSt[k] >= 2.5) replay(e, 'gain'); lastSt[k] = v; const f = e.firstChild; f.style.height = `calc((100% - var(--u)*2) * ${(Math.round(v / 100 * 17) / 17).toFixed(3)})`; f.style.background = v > 60 ? '#6cc24a' : v > 30 ? '#ffd04a' : '#ef5a5a'; e.classList.toggle('low', v < 18); }
    { const G = s.grow, A = GAME.ageDef(), nx = GAME.nextAge(), k = nx ? Math.max(0, Math.min(1, (G.pts - A.pts) / (nx.pts - A.pts))) : 1; const g = $('#h-grow');
      g.querySelector('.gb b').style.width = (k > 0 && k < 1 ? Math.max(1, Math.round(k * 12)) / 12 * 100 : k * 100).toFixed(1) + '%'; const n = GAME.tasksReady(), b = g.querySelector('.badge'); if (b._n !== n) { b._n = n; b.textContent = n; b.classList.toggle('hidden', !n); } }
    if (sheetKind) { const c = $('#sh-coins span'); if (c) c.textContent = s.coins; }
  }
  // ---- bottom bar per room ----
  let barRoom = null, carIdx = 0;
  function setBar(room) {
    barRoom = room;
    if (room === 'kitchen') {
      bar.innerHTML = `<div class="carousel"><button class="arr notch" id="c-l" aria-label="Предыдущая еда">${im(ARR.l)}</button><div class="slot notch" id="c-slot">${im(F('banana'))}</div><button class="arr notch" id="c-r" aria-label="Следующая еда">${im(ARR.r)}</button></div><div class="flabel" id="c-lab"></div>`;
      $('#c-l').onclick = () => { click(); carStep(-1); };
      $('#c-r').onclick = () => { click(); carStep(1); };
      $('#c-slot').addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const id = carItems()[carIdx];
        if (id && S().inv[id] > 0) HOME.startTool('food', e, id);
        else { AUDIO.play('nope'); toast('Нет еды — нажми на холодильник!', I('shop')); }
      });
      carUpdate();
    } else {
      bar.innerHTML = '';
    }
    updateBar();
  }
  function carItems() { const s = S(); const have = DATA.FOOD_ORDER.filter((f) => s.inv[f] > 0 && !DATA.FOODS[f].nonfood); return have.length ? have : ['banana']; }
  function carStep(d) { const it = carItems(); carIdx = (carIdx + d + it.length) % it.length; carUpdate(); }
  function carUpdate() {
    if (barRoom !== 'kitchen') return; const it = carItems(); if (carIdx >= it.length) carIdx = 0; const id = it[carIdx], n = S().inv[id] || 0;
    const slot = $('#c-slot'); if (!slot) return; slot.innerHTML = im(F(id)) + (n ? `<span class="badge">${n}</span>` : ''); slot.classList.toggle('empty', !n);
    const lab = $('#c-lab'); if (lab) lab.textContent = n ? `${DATA.FOODS[id].name} · тяни в рот` : 'Холодильник пуст';
  }
  function updateBar() {
    carUpdate();
  }
  function showRoomTitle(name) { roomt.textContent = name; roomt.classList.add('show'); clearTimeout(roomt._t); roomt._t = setTimeout(() => roomt.classList.remove('show'), 1100); }
  function homeVisible(v) { hud.classList.toggle('hidden', !v); bar.classList.toggle('hidden', !v); }
  // ---- fx ----
  function toast(text, icon, cls = '', ms = 3000) { const t = el('div', 'toast notch ' + cls, (icon ? im(icon) : '') + `<span>${esc(text)}</span>`); toasts.appendChild(t); while (toasts.children.length > 3) toasts.firstChild.remove(); setTimeout(() => t.remove(), ms); }
  function float(x, y, text, icon) { const f = el('div', 'float', (icon ? im(icon) : '') + `<span>${esc(text)}</span>`); f.style.left = UX(x); f.style.top = UY(y); fx.appendChild(f); setTimeout(() => f.remove(), 1150); }
  // speech bubbles: the monkey's (.bubble) + one for friends/pillows (.bubble.fb), each follows its speaker
  function mkBubble(cls) {
    let b = null, until = 0;
    function pos(x, y) { const u = APP.lay.ux || APP.lay.u || 2, half = (b._w || 0) / 2 / u, cx = Math.max(half + 2, Math.min(180 - half - 2, x)); b.style.left = UX(cx); b.style.top = UY(y); b.style.setProperty('--tx', UX(Math.max(-(half - 5), Math.min(half - 5, x - cx)))); }
    return {
      show(text, x, y, dur = 2600) { if (!b) { b = el('div', cls, '<div class="bi notch"></div>'); fx.appendChild(b); } b.firstChild.textContent = text; b.classList.remove('hidden'); b.style.animation = 'none'; b._w = b.offsetWidth; pos(x, y); b.style.animation = ''; until = performance.now() + dur; },
      tick(x, y) { if (!b) return false; if (performance.now() > until) { b.classList.add('hidden'); return false; } pos(x, y); return !b.classList.contains('hidden'); },
      hide() { if (b) b.classList.add('hidden'); until = 0; },
      get text() { return b && !b.classList.contains('hidden') ? b.firstChild.textContent : ''; },
    };
  }
  const MB = mkBubble('bubble'), FB = mkBubble('bubble fb');
  const bubble = (text, x, y, dur) => MB.show(text, x, y, dur), bubbleTick = (x, y) => MB.tick(x, y), hideBubble = () => MB.hide();
  const fbubble = (text, x, y, dur) => FB.show(text, x, y, dur), fbubbleTick = (x, y) => FB.tick(x, y), fhideBubble = () => FB.hide();
  let wantEl = null;
  function want(w, x, y, side) {
    if (!w) { if (wantEl) wantEl.classList.add('hidden'); return; }
    if (!wantEl) { wantEl = el('div', 'want'); view.insertBefore(wantEl, fx); /* Round 6: under #fx — speech bubbles stay on top */ wantEl.onclick = () => { click(); const w2 = S().want; if (w2) toast(wantText(w2) + ' Награда: 3 монеты', wantIcon(w2)); }; }
    const icon = wantIcon(w), key = w.type + (w.id || '') + (w.prog || 0); if (wantEl._k !== key) { wantEl._k = key; wantEl.innerHTML = '<div class="wi notch">' + im(icon) + ((w.type === 'pet' || w.type === 'tickle') ? `<span class="pr">${w.prog || 0}/${w.type === 'pet' ? 5 : 3}</span>` : '') + '</div>'; }
    wantEl.classList.remove('hidden'); wantEl.classList.toggle('l', side === 1); wantEl.classList.toggle('c', side === 2); wantEl.style.left = UX(x); wantEl.style.top = UY(y);
  }
  const wantIcon = (w) => w.type === 'food' ? F(w.id) : I({ play: 'game', pet: 'heart', wash: 'soap', harvest: 'tree', tickle: 'fun' }[w.type] || 'star');
  const wantText = (w) => w.type === 'food' ? `${S().name} хочет: ${DATA.FOODS[w.id].name.toLowerCase()}!` : { play: 'Хочет поиграть в мини-игру!', pet: 'Хочет, чтобы его погладили по голове (5 раз).', wash: 'Хочет помыться с мылом!', harvest: 'Хочет банан прямо с дерева во дворе!', tickle: 'Хочет, чтобы его пощекотали за пузико (3 раза).' }[w.type];
  // ---- sheets ----
  function openSheet(kind, title, tabs, tab, render) {
    sheetKind = kind; sheetTab = tab; HOME.setPreview(true);
    sheet.innerHTML = `<div class="sh-head"><div class="sh-title">${title}</div><div class="pill notch" id="sh-coins">${im(I('coin'))}<span>${S().coins}</span></div><button class="x notch" id="sh-x" aria-label="Закрыть">✕</button></div>
      ${tabs ? `<div class="tabs${tabs.length >= 4 ? ' many' : ''}">${tabs.map((t) => `<button class="tab notch ${t.id === tab ? 'on' : ''}" data-t="${t.id}">${t.icon ? im(t.icon) : ''}${t.name}</button>`).join('')}</div>` : ''}<div class="sh-body" id="sh-body"></div>`;
    sheet.classList.add('open'); if (!APP.lay.ct) hud.classList.add('hidden'); bar.classList.add('hidden'); if (wantEl) wantEl.style.visibility = 'hidden';
    $('#sh-x').onclick = () => { click(); closeSheet(); };
    sheet.querySelectorAll('.tab').forEach((b) => b.onclick = () => { AUDIO.play('tab'); sheetTab = b.dataset.t; sheet.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x === b)); HOME.setPreview(true); render(sheetTab); });
    sheet._render = render; render(tab);
  }
  function rerender() { if (sheetKind && sheet._render) { const b = $('#sh-body'), st = b ? b.scrollTop : 0; sheet._render(sheetTab); const b2 = $('#sh-body'); if (b2) b2.scrollTop = st; } }
  function closeSheet() { if (!sheetKind) return; sheetKind = null; sheet.classList.remove('open'); HOME.setPreview(false); HOME.clearTry(); if (APP.scene === 'home') { hud.classList.remove('hidden'); bar.classList.remove('hidden'); } if (wantEl) wantEl.style.visibility = ''; setBar(barRoom); }
  // locked by growth stage («с Детёныша») or by level
  const lockTag = (o, al) => al ? `<div class="lock age">${im(I('sprout'))}<b>${DATA.AGES[o.age].name}</b></div>` : (S().lvl < o.lvl ? `<div class="lock">${im(I('lock'))}<b>ур. ${o.lvl}</b></div>` : '');
  const ageToast = (o, name) => toast(`${name} — когда ${S().name} вырастет до этапа «${DATA.AGES[o.age].name}»`, I('sprout'));
  const priceBtn = (price, can, lbl) => `<button class="btn sm ${can ? '' : ''}" ${can ? '' : 'disabled'} data-buy="1">${lbl || im(I('coin')) + price}</button>`;
  // shop
  // step-by-step upgrade card (TV, computer): current step n/N + the next one with its price
  function upCard(k) { const s = S(), u = GAME.upgradeInfo(k), nx = u.next, lock = nx && s.lvl < nx.lvl;
    return `<div class="card notch up" data-up="${k}">${im(upIcon(k, (nx || u.cur).v), 'px ic')}<div class="nm">${u.U.name} ${u.U.steps[0].none ? u.i + '/' + (u.n - 1) : u.i + 1 + '/' + u.n}</div><div class="stp">${nx ? (u.i || u.cur.none ? u.cur.name + '<br>' : '') + '→ ' + nx.name : u.cur.name + ' — лучше нет'}</div>${nx ? priceBtn(nx.price, s.coins >= nx.price && !lock) : '<button class="btn sm w" data-buy="1">Стоит</button>'}${lock ? `<div class="lock">${im(I('lock'))}<b>ур. ${nx.lvl}</b></div>` : ''}</div>`; }
  // Round 7: TV gear in «Техника» (DATA.DECOR with tech: 1) — locked by level, or until the thing it needs (the TV) is there
  function techCard(id) { const s = S(), D = DATA.DECOR[id], own = s.owned[id], need = !!D.need && !GAME.hasUp(D.need), lock = !own && (s.lvl < D.lvl || need);
    return `<div class="card notch ${own ? 'wearing' : ''}" data-id="${id}">${im(decorThumb(id), 'px ic')}<div class="nm">${D.name}</div>${D.desc ? `<div class="stp">${D.desc}</div>` : ''}${own ? '<button class="btn sm w" data-buy="1">Есть</button>' : priceBtn(D.price, s.coins >= D.price && !lock)}${own ? '' : need ? `<div class="lock">${im(I('lock'))}<b>нужен ТВ</b></div>` : lockTag(D)}</div>`; }
  function bindTech(body) {
    body.querySelectorAll('.card[data-id]').forEach((c) => { const id = c.dataset.id, D = DATA.DECOR[id];
      c.onclick = (e) => { const s = S(); if (!e.target.closest('[data-buy]') || s.owned[id]) { click(); if (s.owned[id]) HOME.goTo(D.room, true); return; }
        if (D.need && !GAME.hasUp(D.need)) { AUDIO.play('nope'); toast('Сначала купи телевизор', I('lock')); return; }
        if (GAME.buyDecor(id)) { AUDIO.play('buy'); toast('Куплено: ' + D.name, decorThumb(id), 'gold'); HOME.goTo(D.room, true); HOME.celebrate(); rerender(); refresh(); } else AUDIO.play('nope'); }; });
  }
  function bindUps(body) {
    body.querySelectorAll('[data-up]').forEach((c) => c.onclick = (e) => { const k = c.dataset.up, U = DATA.UPGRADES[k]; HOME.goTo(U.room, true); if (!e.target.closest('[data-buy]')) { click(); return; }
      const nx = GAME.upgradeInfo(k).next; if (nx && GAME.upgrade(k)) { AUDIO.play('buy'); toast('Обновка: ' + nx.name, upIcon(k, nx.v), 'gold'); HOME.celebrate(); rerender(); refresh(); } else AUDIO.play('nope'); });
  }
  // Round 6 E: tab «Техника» — the phone (the mini-games live in it), the computer and the TV
  function openShop(tab = 'food', sub) {
    const tabs = [{ id: 'food', name: 'Еда', icon: F('burger') }, { id: 'special', name: 'Особое', icon: F('potion') }, { id: 'tech', name: 'Техника', icon: I('phone') }, { id: 'clothes', name: 'Одежда', icon: I('shirt') }, { id: 'home', name: 'Дом', icon: I('home') }];
    if (typeof TUT !== 'undefined' && TUT.step === 'phone' && !S().phone) tab = 'tech'; // the tutorial is waiting for the phone
    if (sub) sheetSub = sub;
    openSheet('shop', 'Магазин', tabs, tab, (t) => {
      const body = $('#sh-body'); const s = S();
      if (t === 'clothes') { closeSheet(); openWardrobe(); return; }
      if (t === 'tech') {
        const P = DATA.PHONE, can = s.coins >= P.price, tp = typeof TUT !== 'undefined' && TUT.step === 'phone' && !s.phone;
        const techDecor = Object.keys(DATA.DECOR).filter((id) => DATA.DECOR[id].tech && !DATA.DECOR[id].noShop).sort((a, b) => (DATA.DECOR[a].price || 0) - (DATA.DECOR[b].price || 0));
        body.innerHTML = `<div class="grid"><div class="card notch ${s.phone ? 'wearing' : ''} ${tp ? 'tut-hi' : ''}" data-phone="1">${im(I('phone'), 'px ic')}<div class="nm">${P.name}</div><div class="stp">${P.desc}</div>${s.phone ? '<button class="btn sm w" data-buy="1">Есть</button>' : priceBtn(P.price, can)}</div>${upCard('pc')}${upCard('tv')}${techDecor.map(techCard).join('')}</div>
          <div class="hint">Телефон: «Банановый ливень» и «Бонго». Компьютер на балконе: «Лианы» и «Шарик» — старый, «Качалка» — ноутбук, «Банановая башня» — мощный.</div>`;
        body.querySelector('[data-phone]').onclick = (e) => { if (!e.target.closest('[data-buy]') || s.phone) { click(); return; }
          if (GAME.buyPhone()) { AUDIO.play('buy'); toast('Куплено: ' + P.name, I('phone'), 'gold'); HOME.celebrate(); HOME.say(pick(DATA.LINES.phone), 'happy'); rerender(); refresh(); } else AUDIO.play('nope'); };
        bindUps(body); bindTech(body); return;
      }
      if (t === 'food' || t === 'special') {
        const ids = DATA.FOOD_ORDER.filter((f) => !!DATA.FOODS[f].special === (t === 'special') && !DATA.FOODS[f].cook).sort((a, b) => (DATA.FOODS[a].price || 0) - (DATA.FOODS[b].price || 0));
        body.innerHTML = `<div class="grid">${ids.map((id) => { const f = DATA.FOODS[id], al = !GAME.ageOK(f), lock = s.lvl < f.lvl || al; return `<div class="card notch" data-id="${id}">${im(F(id), 'px ic')}<div class="nm">${f.name}</div>${s.inv[id] ? `<span class="cnt">${s.inv[id]}</span>` : ''}${priceBtn(f.price, s.coins >= f.price && !lock)}${lockTag(f, al)}</div>`; }).join('')}</div><div class="hint">Нажми на карточку — узнаешь, что даёт еда</div>`;
        body.querySelectorAll('.card').forEach((c) => { const id = c.dataset.id, f = DATA.FOODS[id];
          c.onclick = (e) => { if (!GAME.ageOK(f)) { AUDIO.play('nope'); ageToast(f, f.name); return; } if (e.target.closest('[data-buy]')) { if (GAME.buyFood(id)) { AUDIO.play('buy'); float(90, 150, '+1 ' + f.name); rerender(); refresh(); } else AUDIO.play('nope'); return; }
            click(); const parts = [`+${f.food || 0} еды`]; if (f.kg) parts.push((f.kg > 0 ? '+' : '−') + Math.abs(f.kg).toString().replace('.', ',') + ' кг'); if (f.fun) parts.push((f.fun > 0 ? '+' : '') + f.fun + ' веселья'); if (f.energy) parts.push('+' + f.energy + ' энергии'); toast(`${f.name}: ${f.desc} ${f.nonfood ? '' : '(' + parts.join(', ') + ')'}`, F(id)); }; });
      } else if (t === 'home') {
        const subs = DATA.ROOMS.map((r) => [r.id, r.name]);
        if (!subs.some(([id]) => id === sheetSub)) sheetSub = HOME.room;
        const ids = Object.keys(DATA.DECOR).filter((id) => DATA.DECOR[id].room === sheetSub && !DATA.DECOR[id].tech && !DATA.DECOR[id].noShop).sort((a, b) => (DATA.DECOR[a].price || 0) - (DATA.DECOR[b].price || 0)); // TV gear lives in «Техника»
        // step-by-step upgrades of this room (TV, computer): current step n/N + the next one with its price
        const ups = Object.keys(DATA.UPGRADES).filter((k) => DATA.UPGRADES[k].room === sheetSub).map(upCard).join('');
        body.innerHTML = `<div class="tabs subs">${subs.map(([id, n]) => `<button class="tab notch ${id === sheetSub ? 'on' : ''}" data-s="${id}">${n}</button>`).join('')}</div>
          <div class="grid">${ups}${ids.map((id) => { const D = DATA.DECOR[id], own = s.owned[id], pl = own && GAME.placed(id), lock = !own && s.lvl < D.lvl; return `<div class="card notch ${pl ? 'wearing' : ''}" data-id="${id}">${im(decorThumb(id), 'px ic')}<div class="nm">${D.name}</div>${D.desc ? `<div class="stp">${D.desc}</div>` : ''}${own ? `<button class="btn sm ${pl ? 'w' : 'g'}" data-buy="1">${pl ? (D.fixed || D.kind !== 'item' ? 'Стоит' : 'Убрать') : 'Поставить'}</button>` : priceBtn(D.price, s.coins >= D.price && !lock)}${lock ? `<div class="lock">${im(I('lock'))}<b>ур. ${D.lvl}</b></div>` : ''}</div>`; }).join('')}</div>`;
                body.querySelectorAll('[data-s]').forEach((b) => b.onclick = () => { AUDIO.play('tab'); sheetSub = b.dataset.s; HOME.goTo(sheetSub, true); rerender(); });
        bindUps(body);
        body.querySelectorAll('.card[data-id]').forEach((c) => { const id = c.dataset.id, D = DATA.DECOR[id];
          c.onclick = (e) => { const b = e.target.closest('[data-buy]'); if (!b) { click(); if (D.room) HOME.goTo(D.room, true); return; }
            if (s.owned[id]) { if (GAME.placed(id) && (D.fixed || D.kind !== 'item')) return; GAME.place(id); AUDIO.play('pop'); }
            else if (GAME.buyDecor(id)) { AUDIO.play('buy'); toast('Куплено: ' + D.name, decorThumb(id), 'gold'); if (D.room) HOME.goTo(D.room, true); HOME.celebrate(); } else { AUDIO.play('nope'); return; }
            rerender(); refresh(); }; });
      }
    });
  }
  function openWardrobe(slot) {
    const tabs = Object.entries(DATA.SLOTS).map(([id, n]) => ({ id, name: n }));
    openSheet('wardrobe', 'Гардероб', tabs, slot || 'hat', (t) => {
      const body = $('#sh-body'), s = S(); const ids = Object.keys(DATA.CLOTHES).filter((id) => DATA.CLOTHES[id].slot === t).sort((a, b) => (DATA.CLOTHES[a].price || 0) - (DATA.CLOTHES[b].price || 0));
      body.innerHTML = `<div class="grid">${ids.map((id) => { const C = DATA.CLOTHES[id], own = s.ownedC[id], on = s.wear[C.slot] === id, al = !own && !GAME.ageOK(C), lock = !own && (s.lvl < C.lvl || al); return `<div class="card notch ${on ? 'wearing' : ''} ${HOME.tryId() === id ? 'sel' : ''}" data-id="${id}">${im(clothThumb(id), 'px ic')}<div class="nm">${C.name}</div>${own ? `<button class="btn sm ${on ? 'w' : 'g'}" data-buy="1">${on ? 'Снять' : 'Надеть'}</button>` : priceBtn(C.price, s.coins >= C.price && !lock)}${own ? '' : lockTag(C, al)}${!own && al && C.gift !== undefined ? '<div class="gtag">Подарок на празднике</div>' : ''}</div>`; }).join('')}</div><div class="hint">Нажми на вещь, чтобы примерить. Новые вещи друзья дарят на празднике роста.</div>`;
      body.querySelectorAll('.card').forEach((c) => { const id = c.dataset.id, C = DATA.CLOTHES[id];
        c.onclick = (e) => { const b = e.target.closest('[data-buy]');
          if (!b) { click(); HOME.tryOn(s.ownedC[id] ? null : id); if (s.ownedC[id]) { GAME.wear(id); } HOME.react('happy'); rerender(); return; }
          if (s.ownedC[id]) { GAME.wear(id); AUDIO.play('pop'); HOME.react('happy'); }
          else if (!GAME.ageOK(C)) { AUDIO.play('nope'); ageToast(C, C.name); return; }
          else if (GAME.buyCloth(id)) { AUDIO.play('buy'); toast('Обновка: ' + C.name, clothThumb(id), 'gold'); HOME.clearTry(); HOME.celebrate(); } else { AUDIO.play('nope'); return; }
          rerender(); refresh(); }; });
    });
  }
  // Round 6 E: the games sheet — tab «В телефоне» (phone games) / «На компьютере» (the balcony computer). dev = where he opened it:
  // 'phone' (the HUD phone) or 'pc' (sitting at the computer). From the phone a computer game says «К ПК» and sends him there.
  let gamesDev = 'phone';
  function openGames(dev) {
    gamesDev = dev === 'pc' || dev === 'tv' ? dev : 'phone'; if (typeof TUT !== 'undefined') TUT.onGames();
    const tabs = [{ id: 'phone', name: 'Телефон', icon: I('phone') }, { id: 'pc', name: 'ПК', icon: I('pc') }, { id: 'tv', name: 'Приставка', icon: I('game') }, { id: 'tour', name: 'Турнир', icon: I('trophy') }]; // Round 18: + the weekly tournament
    const where = (g) => (g.dev === 'phone' ? 'phone' : DATA.CONSOLES.includes(g.dev) ? 'tv' : 'pc'); // Round 7 #6: the consoles' games on their own tab
    openSheet('games', 'Мини-игры', tabs, gamesDev, (t) => {
      if (t === 'tour') { tourTab(); return; }
      const s = S(), body = $('#sh-body'), open = GAME.gamesOpen(), list = DATA.GAMES.filter((g) => where(g) === t);
      const why = !s.phone ? 'Сначала купи телефон' : 'Сначала пройди обучение';
      body.innerHTML = `<div class="list">${list.map((g) => { const al = !GAME.ageOK(g), dv = GAME.devOK(g.id), far = t !== 'phone' && gamesDev !== t;
        const t2 = !dv ? 'Нужен: ' + DATA.DEV_NAME[g.dev] : !open ? why : al ? 'Откроется на этапе «' + DATA.AGES[g.age].name + '»' : 'Рекорд: ' + (s.best[g.id] ? 'ур. ' + s.best[g.id] : '—');
        const btn = !dv || !open ? `<button class="btn sm" disabled>${im(I('lock'))}</button>` : al ? `<button class="btn sm" disabled>${im(I('sprout'))}</button>` : far ? (t === 'tv' ? '<button class="btn sm" data-totv="1">К ТВ</button>' : '<button class="btn sm" data-topc="1">К ПК</button>') : '<button class="btn g sm" data-play="1">Играть</button>';
        return `<div class="li notch ${!dv || !open || al ? 'locked' : ''}" data-g="${g.id}">${im(g.iconKind === 'f' ? F(g.icon) : I(g.icon), 'px ic')}<div class="tx"><div class="t1">${g.name}</div><div class="t2">${t2}</div></div>${btn}</div>`; }).join('')}</div>
        <div class="bt"><button class="btn sm" id="g-shop">${im(I('shop'))}Магазин техники</button></div>
        <div class="hint">${t === 'phone' ? 'Игры в телефоне — где угодно.' : t === 'tv' ? 'Эти игры — на приставках у телевизора в зале. Самые щедрые: в 3–4 раза больше монет за уровень!' : 'Эти игры — на компьютере на балконе. Чем мощнее компьютер, тем больше игр.'} ${t === 'tv' ? '' : 'Монеты: 1–2 за уровень, дальше больше. '}Игры тратят энергию и пачкают шерсть.</div>`;
      $('#g-shop').onclick = () => { click(); closeSheet(); openShop('tech'); };
      body.querySelectorAll('.li').forEach((r) => r.onclick = (e) => { const gid = r.dataset.g, g = DATA.GAMES.find((x) => x.id === gid);
        if (!GAME.devOK(gid)) { AUDIO.play('nope'); toast('Нужен: ' + DATA.DEV_NAME[g.dev], I(t === 'tv' ? 'game' : 'pc')); return; }
        if (!GAME.gamesOpen()) { AUDIO.play('nope'); toast(why, I('phone')); return; }
        if (!GAME.ageOK(g)) { AUDIO.play('nope'); ageToast(g, 'Игра «' + g.name + '»'); return; }
        click(); closeSheet(); if (t === 'pc' && gamesDev !== 'pc') { HOME.toPc(); return; } if (t === 'tv' && gamesDev !== 'tv') { HOME.toTv(g.dev); return; } MINI.intro(gid); });
    });
  }
  // Round 18: the «Турнир» tab — the game of the week, the table with the friends, «Играть» takes him to that game (or its device)
  function tourTab() {
    const body = $('#sh-body'); body.innerHTML = TOUR.html(); const b = $('#t-play'); if (!b) return;
    b.onclick = () => { const c = TOUR.cur(), g = c && DATA.GAMES.find((x) => x.id === c.gid); if (!g) return;
      if (!GAME.canPlay(g.id)) { AUDIO.play('nope'); toast(!GAME.devOK(g.id) ? 'Нужен: ' + DATA.DEV_NAME[g.dev] : 'Сначала пройди обучение', I('trophy')); return; }
      const w = g.dev === 'phone' ? 'phone' : DATA.CONSOLES.includes(g.dev) ? 'tv' : 'pc'; click(); closeSheet();
      if (w === 'pc' && gamesDev !== 'pc') { HOME.toPc(); return; } if (w === 'tv' && gamesDev !== 'tv') { HOME.toTv(g.dev); return; } MINI.intro(g.id); };
  }
  // ---- growth & daily tasks ----
  function openGrow(tab) {
    const tabs = [{ id: 'tasks', name: 'Задания дня', icon: I('tasks') }, { id: 'grow', name: 'Рост', icon: I('sprout') }];
    openSheet('grow', 'Рост', tabs, tab || 'tasks', (t) => {
      const body = $('#sh-body'), s = S(), G = s.grow; GAME.dayRoll();
      if (t === 'tasks') {
        const T = GAME.tasksRoll(), all = T.list.every((x) => x.done);
        const today = Math.floor(G.today), dm = DATA.GROW.dayMin;
        body.innerHTML = `<div class="li notch gtoday">${im(I('sprout'), 'px ic')}<div class="tx"><div class="t1">Забота сегодня: ${today}/${DATA.GROW.cap}</div><div class="t2">${today >= dm ? 'День заботы засчитан ✓' : `Ещё ${dm - today} — и день засчитается`}</div><div class="pbar"><i style="width:${Math.min(100, today / DATA.GROW.cap * 100).toFixed(0)}%"></i></div></div></div>
          <div class="list">${T.list.map((x, i) => { const D = DATA.TASK[x.id], v = GAME.taskProg(x), ok = GAME.taskReady(x); return `<div class="li notch ${x.done ? 'done' : ''}">${im(D.ic[0] === 'f' ? F(D.ic[1]) : I(D.ic[1]), 'px ic')}<div class="tx"><div class="t1">${D.t}</div><div class="t2">${D.fmt ? D.fmt(v) : v + '/' + D.n} · ${im(I('coin'))}${D.coins} · ${im(I('sprout'))}10</div><div class="pbar"><i style="width:${(v / D.n * 100).toFixed(0)}%"></i></div></div>${x.done ? '<b class="okm">✓</b>' : `<button class="btn sm ${ok ? 'g' : ''}" ${ok ? '' : 'disabled'} data-i="${i}">Забрать</button>`}</div>`; }).join('')}
          <div class="li notch ${T.bonus ? 'done' : ''}">${im(I('gift'), 'px ic')}<div class="tx"><div class="t1">Сундучок дня</div><div class="t2">За все 3 задания: ${im(I('coin'))}30 · вкусняшка · ${im(I('sprout'))}15</div></div>${T.bonus ? '<b class="okm">✓</b>' : `<button class="btn sm ${all ? 'g' : ''}" ${all ? '' : 'disabled'} data-b="1">Открыть</button>`}</div></div>
          <div class="hint">Новые задания каждый день. Забота растит ${esc(s.name)}: корми, купай, укладывай спать, играй, гладь и исполняй желания.</div>`;
        body.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { const D = GAME.claimTask(+b.dataset.i); if (!D) { AUDIO.play('nope'); return; } AUDIO.play('coin'); toast(`Задание выполнено! +${D.coins}`, I('coin'), 'gold'); rerender(); refresh(); });
        const bb = body.querySelector('[data-b]'); if (bb) bb.onclick = () => { const r = GAME.claimBonus(); if (!r) { AUDIO.play('nope'); return; } AUDIO.play('star'); HOME.celebrate(); toast(`Сундучок: +${r.coins} и ${DATA.FOODS[r.food].name.toLowerCase()}`, F(r.food), 'gold'); rerender(); refresh(); };
      } else {
        const A = GAME.ageDef(), nx = GAME.nextAge(); const pc = (a, b) => Math.max(0, Math.min(100, a / b * 100)).toFixed(0);
        body.innerHTML = `<div class="gtop">${im(HOME.portrait(), 'px gport')}<div class="tx"><div class="t1">${A.name}</div>
            ${nx ? `<div class="t2">Очки заботы: ${Math.floor(G.pts)} / ${nx.pts}</div><div class="pbar"><i style="width:${pc(G.pts, nx.pts)}%"></i></div><div class="t2">Дни заботы: ${G.days} / ${nx.days}</div><div class="pbar"><i style="width:${pc(G.days, nx.days)}%"></i></div><div class="t2">Дальше: ${nx.name}</div>` : `<div class="t2">Высший этап! Очки заботы: ${Math.floor(G.pts)} · дней заботы: ${G.days}</div>`}</div></div>
          <div class="hint" style="text-align:left">До ${DATA.GROW.cap} очков заботы в день, день засчитывается с ${DATA.GROW.dayMin}. Чтобы вырасти, нужны и очки, и дни — заходи каждый день!</div>
          <div class="list">${DATA.AGES.map((a, i) => { const u = DATA.unlocks(i); return `<div class="li notch ${i <= G.stage ? 'done' : ''} ${i === G.stage ? 'cur' : ''}">${im(HOME.portrait(i), 'px ic')}<div class="tx"><div class="t1">${a.name}${i === G.stage ? ' · сейчас' : ''}</div><div class="t2">${i ? a.pts + ' очков · ' + a.days + ' дн. заботы' : 'С рождения'}${i && u.length ? '<br>Открывает: ' + u.join(', ') : ''}</div></div></div>`; }).join('')}</div>${SEASONS.sheet(im)}`;
      }
      body.querySelectorAll('.t2 img').forEach((i) => { i.style.width = U(7); i.style.height = U(7); i.style.verticalAlign = 'middle'; });
    });
  }
  function growUp(stage) {
    const s = S(), A = DATA.AGES[stage]; if (!A) return; const u = DATA.unlocks(stage);
    modal(`<h2>${esc(s.name)} ${A.legend ? 'стал Легендой!' : 'подрос!'}</h2><img class="px hero" src="${HOME.portrait()}" alt=""><p>Теперь он — <b>${A.name}</b></p><div class="big">${im(I('coin'))}+25</div>
      ${u.length ? `<p class="unl">Открыто: ${u.join(', ')}</p>` : ''}<p class="unl">Друзья готовят сюрприз…</p><button class="btn g" data-close>Ура!</button>`);
  }
  function openAch() {
    if (typeof GAME !== 'undefined' && GAME.checkAch) GAME.checkAch();
    openSheet('ach', 'Достижения', null, null, () => {
      const s = S(); const body = $('#sh-body'); const done = DATA.ACH.filter((a) => s.ach[a.id]).length;
      body.innerHTML = `<div class="hint" style="padding:0 0 ${U(3)}">Получено ${done} из ${DATA.ACH.length}</div><div class="list">${DATA.ACH.map((a) => { const v = Math.min(a.goal, a.val(s)), d = !!s.ach[a.id]; return `<div class="li notch ${d ? 'done' : ''}">${im(d ? I('trophy') : I('lock'), 'px ic')}<div class="tx"><div class="t1">${a.name}</div><div class="t2">${a.desc} · ${im(I('coin'))}${a.coins}</div>${d ? '' : `<div class="pbar"><i style="width:${(v / a.goal * 100).toFixed(0)}%"></i></div>`}</div></div>`; }).join('')}</div>`;
      body.querySelectorAll('.t2 img').forEach((i) => { i.style.width = U(7); i.style.height = U(7); i.style.verticalAlign = 'middle'; });
    });
  }
  // Round 16: the album page — «Сделать фото», the polaroids (newest first; a tap → the big one with «Сохранить»),
  // and «Приколы»: the gag map by room (found → a colour picture + its name, a tap takes him there; not yet → a dark «?»)
  function openAlbum(tab) {
    const tabs = [{ id: 'photos', name: 'Фото', icon: I('camera') }, { id: 'gags', name: 'Приколы', icon: I('star') }];
    if (DASHA.heartsOn() || DASHA.foundN() > 0) tabs.push({ id: 'hearts', name: 'Сердечки', icon: I('heart') }); else if (tab === 'hearts') tab = 'photos'; // Round 22: «24 секрета»
    openSheet('album', 'Альбом', tabs, tab || 'photos', (t) => {
      const body = $('#sh-body'), s = S();
      if (t === 'photos') {
        const L = ALBUM.list().reverse();
        body.innerHTML = `<button class="btn g notch alb-shot" id="alb-shot">${im(I('camera'))}<span>Сделать фото</span></button>
          ${L.length ? `<div class="alb">${L.map((e) => `<div class="ph" data-id="${esc(e.id)}"><img class="px" src="${e.src}" alt=""><div class="pt">${esc(e.title)}</div><div class="pd">${esc(ALBUM.ds(e.d))}</div></div>`).join('')}</div>` : ''}
          <div class="hint">${L.length ? `Фото: ${L.length} из ${ALBUM.MAX}. ` : 'Пока пусто. '}Яркие моменты ${esc(s.name)} снимает сам: первый танец, новый этап роста, гости, «Все вместе», вылазка с Жучком.</div>`;
        $('#alb-shot').onclick = () => { click(); closeSheet(); HOME.photo(); };
        body.querySelectorAll('.ph').forEach((c) => c.onclick = () => { click(); const e = L.find((x) => x.id === c.dataset.id); if (e) bigPhoto(e); });
      } else if (t === 'hearts') { body.innerHTML = DASHA.albumHtml(); DASHA.albumBind(body);
      } else {
        const M = GAGS.map(), R = DATA.ROOMS.filter((r) => M[r.id]); let n = 0, tot = 0;
        const rows = R.map((r) => { let k = 0; const cells = M[r.id].map((g) => { const f = GAGS.found(r.id, g.id); k += f ? 1 : 0;
          return `<div class="gm notch ${f ? 'on' : ''}" data-g="${r.id}:${g.id}"><span class="gi">${g.r ? `<img class="px" src="${ALBUM.crop(r.id, g.r, f)}" alt="">` : '<i class="gq"></i>'}</span><b>${f ? esc(DATA.GAG_NAMES[g.id] || g.id) : '?'}</b></div>`; });
          n += k; tot += cells.length; return `<div class="gm-room"><div class="gm-t">${r.name} · ${k}/${cells.length}</div><div class="gm-grid">${cells.join('')}</div></div>`; });
        body.innerHTML = `<div class="hint gm-n">Найдено ${n} из ${tot}</div>${rows.join('')}<div class="hint">Трогай всё в квартире — у каждой вещи свой прикол!</div>`;
        body.querySelectorAll('.gm').forEach((c) => c.onclick = () => { const [room, id] = c.dataset.g.split(':'), rn = (DATA.ROOMS.find((r) => r.id === room) || {}).name;
          if (!c.classList.contains('on')) { AUDIO.play('nope'); toast(`Этот прикол прячется: ${rn}. Потрогай там всё!`, I('star')); return; }
          click(); closeSheet(); HOME.goTo(room); toast(`${DATA.GAG_NAMES[id] || id} — ${rn}`, I('star')); });
      }
    });
  }
  function bigPhoto(e) {
    const w = modal(`<h2>${esc(e.title)}</h2><img class="photo" src="${e.src}" alt="Фото"><div class="bt"><button class="btn g" data-save disabled>Сохранить</button><button class="btn w" data-close>Закрыть</button></div>`, { dismiss: true });
    ALBUM.view(e).then((p) => { if (!p) return; const img = w.querySelector('img.photo'); if (img) img.src = p.url; const b = w.querySelector('[data-save]'); if (b) { b.disabled = false; b.onclick = () => ALBUM.save(p.url, p.fn, p.file); } });
    return w;
  }
  // ---- modals ----
  function modal(html, opts = {}) {
    const w = el('div', '', ''); w.id = 'modal'; w.innerHTML = `<div class="mbox notch2">${html}</div>`; modalEl.appendChild(w); modalStack.push(w);
    if (opts.dismiss) w.addEventListener('pointerdown', (e) => { if (e.target === w) closeModal(w); });
    w.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { click(); closeModal(w); }));
    return w;
  }
  function closeModal(w) { w = w || modalStack[modalStack.length - 1]; if (!w) return; w.remove(); modalStack = modalStack.filter((x) => x !== w); }
  const hasModal = () => modalStack.length > 0;
  // a game / duel takes the whole screen: nothing from the house (sheets, cards, bubbles) may stay on top of it
  function reset() { closeSheet(); while (modalStack.length) closeModal(); hideBubble(); }
  // Round 20: iPhone / iPad (iPadOS says «Mac» but has touch), installed to the home screen, opened as a website (not a file)
  let platC = null;
  function plat() { if (platC) return platC; const n = navigator, ua = n.userAgent || ''; const ios = /iPad|iPhone|iPod/.test(ua) || (n.platform === 'MacIntel' && n.maxTouchPoints > 1);
    let sa = false; try { sa = n.standalone === true || (!!window.matchMedia && matchMedia('(display-mode: standalone)').matches); } catch (e) { }
    return (platC = { ios, standalone: sa, web: /^https?:$/.test(location.protocol) }); }
  function openSettings() {
    const s = S();
    const w = modal(`<h2>Настройки</h2>
      <div class="toggle"><span>Звуки</span><button class="btn sm ${s.settings.sfx ? 'g' : 'w'}" id="t-sfx">${s.settings.sfx ? 'Вкл' : 'Выкл'}</button></div>
      <div class="toggle"><span>Музыка</span><button class="btn sm ${s.settings.music ? 'g' : 'w'}" id="t-mus">${s.settings.music ? 'Вкл' : 'Выкл'}</button></div>
      <div class="bt"><button class="btn" id="t-name">Переименовать</button><button class="btn" id="t-help">Как играть</button></div>
      <div class="bt"><button class="btn g" id="t-update">🔄 Обновить приложение</button></div>
      <div class="bt"><button class="btn g" id="t-album">Альбом</button><button class="btn b" id="t-prof">Профиль</button></div>
      <p style="font-size:${U(6.5)};opacity:.75;margin-bottom:0">Перенос прогресса на другое устройство:</p><div class="bt"><button class="btn" id="t-exp">Получить код</button><button class="btn" id="t-imp">Ввести код</button></div>
      <div class="bt"><button class="btn r" id="t-reset">Сброс</button></div>
      ${window.ABI_TEST ? '<div class="bt"><button class="btn g" id="t-again">Начать репетицию заново</button></div>' : ''}
      ${GAME.storageOK ? '' : `<p style="font-size:${U(6.5)};color:#b83a3a">Сохранение недоступно в этом окне — прогресс пропадёт после закрытия.</p>`}
      ${plat().ios ? `<p style="font-size:${U(6)};opacity:.75;margin:0">${plat().web && !plat().standalone ? 'Чтобы сохранение не стёрлось: «Поделиться» → «На экран „Домой“». ' : ''}Нет звука — выключи режим «Без звука».</p>` : ''}
      <div style="text-align:center;font-size:${U(6)};opacity:.5;margin:${U(2)} 0 ${U(1)}">Версия 50 · 100% экран</div>
      <button class="btn w" data-close>Закрыть</button>`, { dismiss: true });
    const tg = (id, key) => { $('#' + id, w).onclick = () => { s.settings[key] = !s.settings[key]; AUDIO.set(key, s.settings[key]); AUDIO.play('click'); GAME.save(true); closeModal(w); openSettings(); }; };
    tg('t-sfx', 'sfx'); tg('t-mus', 'music');
    $('#t-name', w).onclick = () => { click(); closeModal(w); askName(); };
    $('#t-help', w).onclick = () => { click(); closeModal(w); help(); };
    const upBtn = $('#t-update', w);
    if (upBtn) upBtn.onclick = () => {
      click();
      toast('Обновляем...');
      try { localStorage.removeItem('abi_pwa_ver'); } catch (e) {}
      const doReload = () => { window.location.href = window.location.pathname + '?_t=' + Date.now(); };
      if ('caches' in window) {
        caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))).then(() => {
          if (navigator.serviceWorker) {
            navigator.serviceWorker.getRegistrations().then((regs) => {
              Promise.all(regs.map((r) => r.unregister())).then(doReload).catch(doReload);
            }).catch(doReload);
          } else {
            doReload();
          }
        }).catch(doReload);
      } else {
        doReload();
      }
    };
    $('#t-album', w).onclick = () => { click(); closeModal(w); openAlbum(); };
    $('#t-prof', w).onclick = () => { click(); closeModal(w); openProfile(); };
    $('#t-exp', w).onclick = () => { click(); closeModal(w); exportSave(); };
    $('#t-imp', w).onclick = () => { click(); closeModal(w); importSave(); };
    const ag = $('#t-again', w); if (ag) ag.onclick = () => { click(); GAME.reset(); location.reload(); }; // Round 23: the test build — the gift box and her party again (its own save)
    $('#t-reset', w).onclick = () => { click(); closeModal(w); const c = modal(`<h2>Начать заново?</h2><p>Весь прогресс, монеты и покупки будут удалены.</p><div class="bt"><button class="btn r" id="r-yes">Да, сбросить</button><button class="btn w" data-close>Отмена</button></div>`, { dismiss: true }); $('#r-yes', c).onclick = () => { GAME.reset(); location.reload(); }; };
  }
  function exportSave() {
    const code = GAME.exportCode();
    const w = modal(`<h2>Код сохранения</h2><p>Скопируй код и вставь его в игре на другом устройстве: Настройки → «Ввести код».</p><textarea id="ex-code" readonly spellcheck="false">${code}</textarea><div class="bt"><button class="btn g" id="ex-copy">Скопировать</button><button class="btn w" data-close>Закрыть</button></div>`, { dismiss: true });
    const ta = $('#ex-code', w);
    const fallback = () => { ta.focus(); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { } toast(ok ? 'Код скопирован!' : 'Выдели код и скопируй вручную'); };
    $('#ex-copy', w).onclick = () => { click(); if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(code).then(() => toast('Код скопирован!'), fallback); else fallback(); };
  }
  function importSave() {
    const w = modal(`<h2>Загрузить прогресс</h2><p>Вставь код сохранения. Прогресс на этом устройстве заменится.</p><textarea id="im-code" spellcheck="false" placeholder="ABIBYAN1:…"></textarea><p id="im-err" style="font-size:${U(6.5)};color:#b83a3a;display:none">Код не подошёл — проверь, что он скопирован целиком.</p><div class="bt"><button class="btn g" id="im-ok">Загрузить</button><button class="btn w" data-close>Отмена</button></div>`, { dismiss: true });
    $('#im-ok', w).onclick = () => {
      click(); const v = $('#im-code', w).value;
      if (GAME.importCode(v)) { closeModal(w); toast('Прогресс загружен!'); setTimeout(() => location.reload(), 700); }
      else $('#im-err', w).style.display = '';
    };
  }
  function openProfile() {
    const s = S(); const st = GAME.form(); const days = Math.max(1, Math.ceil((Date.now() - s.created) / 86400e3)); const done = DATA.ACH.filter((a) => s.ach[a.id]).length;
    const hero = HOME.portrait();
    const w = modal(`<h2>${esc(s.name)}</h2><img class="px hero" src="${hero}" alt=""><div class="kv">
      <span>Возраст</span><b>${GAME.ageDef().name}</b><span>Дней заботы</span><b>${s.grow.days}</b><span>Форма</span><b>${st.name}</b><span>Вес</span><b>${s.kg.toFixed(1).replace('.', ',')} кг</b><span>Уровень</span><b>${s.lvl}</b><span>Дней вместе</span><b>${days}</b>
      <span>Заработано монет</span><b>${s.totalCoins}</b><span>Покормлен раз</span><b>${s.stats.fed}</b><span>Пройдено уровней</span><b>${s.stats.levels}</b><span>Достижения</span><b>${done}/${DATA.ACH.length}</b><span>Стрик входов</span><b>${s.daily.streak} дн.</b></div>
      <p style="font-size:${U(6.5)};opacity:.75">${skufNote()}</p><div class="bt"><button class="btn g" id="p-album">Альбом</button><button class="btn" data-close>Ок</button></div>`, { dismiss: true });
    $('#p-album', w).onclick = () => { click(); closeModal(w); openAlbum(); };
  }
  // Round 6: a skuf at any age — the profile says the weight for his current size and how much is left
  function skufNote() { const s = S(), need = GAME.skufKg(), kg = (v) => v.toFixed(1).replace('.', ',') + ' кг';
    return GAME.isSkuf() ? `Настоящий скуф! (от ${kg(need)}) Салат, диет-чай и качалка — худеют.` : `Скуф — с ${kg(need)}: ещё ${kg(Math.max(0.1, need - s.kg))}. Салат, диет-чай и качалка — худеют.`; }
  function askName(first) {
    const s = S(); const w = modal(`${first ? `<img class="px hero" src="${HOME.portrait()}" alt="">` : ''}<h2>${first ? 'Привет! Это твоя обезьянка' : 'Новое имя'}</h2><p>Как его зовут?</p><input type="text" id="nm" maxlength="14" value="${esc(s.name)}" autocomplete="off"><button class="btn g" id="nm-ok">Готово</button>`);
    const inp = $('#nm', w); setTimeout(() => { try { inp.focus(); inp.select(); } catch (e) { } }, 50);
    const ok = () => { const v = inp.value.trim().slice(0, 14); s.name = v || 'Абибян'; s.named = true; GAME.save(true); closeModal(w); refresh(); AUDIO.init(); AUDIO.play('happy'); if (first) { HOME.say(`Ура! Я ${s.name}!`, 'happy'); setTimeout(() => APP.afterIntro(), 900); } };
    $('#nm-ok', w).onclick = ok; inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') ok(); });
  }
  function help() {
    modal(`<h2>Как играть</h2><div class="kv" id="help" style="grid-template-columns:auto 1fr">${DATA.HELP.map(([a, b]) => `<b style="text-align:left">${a}</b><span>${b}</span>`).join('')}</div>
      <p style="font-size:${U(7)}">Пузо растёт от еды. Откорми — и станет настоящим скуфом в любом возрасте (сколько кг нужно — в профиле). Пузырь над головой — желание, за него дают монеты.</p><button class="btn" data-close>Понятно</button>`, { dismiss: true });
  }
  function daily(r) {
    modal(`<h2>Ежедневный подарок</h2><img class="px hero" src="${I('gift')}" alt=""><p>День ${r.streak} подряд!</p><div class="big">${im(I('coin'))}+${r.coins}</div>${r.food ? `<p>И бонус: ${DATA.FOODS[r.food].name} ${im(F(r.food))}</p>` : '<p>С 3-го дня подряд — ещё и вкусняшка.</p>'}<button class="btn g" data-close>Забрать</button>`);
    modalStack[modalStack.length - 1].querySelectorAll('p img').forEach((i) => { i.style.width = U(12); i.style.height = U(12); i.style.verticalAlign = 'middle'; });
  }
  // ---- game HUD ----
  function gameHud(on, o = {}) {
    const oh = $('#ghint'); if (oh) oh.remove(); gtip(null);
    ghud.classList.toggle('hidden', !on); homeVisible(!on); if (wantEl) wantEl.style.display = on ? 'none' : '';
    if (!on) { ghud.innerHTML = ''; return; }
    ghud.innerHTML = `<button class="ibtn notch" id="g-pause" aria-label="Пауза"><span style="font-size:${U(8)}">II</span></button><div class="pill notch" id="g-lvl">Ур. 1</div><div class="prog notch"><i id="g-prog"></i></div><div class="hearts" id="g-hearts"></div><div class="pill notch" id="g-coins">${im(I('coin'))}<span>0</span></div>`;
    if (o.duel) ghud.innerHTML = `<button class="ibtn notch" id="g-pause" aria-label="Пауза"><span style="font-size:${U(8)}">II</span></button><div class="duel"><div class="pill notch me"><span class="nm">${esc(o.duel.a)}</span><b id="g-me">0</b></div><span class="vs">:</span><div class="pill notch fr"><b id="g-fr">0</b><span class="nm">${esc(o.duel.f)}</span></div></div>`;
    $('#g-pause').onclick = () => { click(); MINI.pause(); };
    if (o.hint) { const h = el('div', 'np', esc('Управление: ' + o.hint)); h.id = 'ghint'; root.appendChild(h); }
  }
  const setT = (e, t) => { if (e && e.textContent !== t) e.textContent = t; }; // Round 19: the game HUD touches the DOM only when a value changed
  function gameHudSet(o) { if (o.duel) { const a = $('#g-me'), b = $('#g-fr'); if (a && a.textContent !== String(o.duel.me)) { a.textContent = o.duel.me; bump(a); } if (b && b.textContent !== String(o.duel.fr)) { b.textContent = o.duel.fr; bump(b); } return; } if (!$('#g-lvl')) return; if (o.level !== undefined) setT($('#g-lvl'), 'Ур. ' + o.level); if (o.prog !== undefined) { const p = $('#g-prog'), w = Math.min(100, o.prog * 100).toFixed(1) + '%'; if (p && p._w !== w) { p._w = w; p.style.width = w; } } if (o.coins !== undefined) setT($('#g-coins span'), '+' + o.coins); if (o.hearts !== undefined) { const h = $('#g-hearts'); if (h._n !== o.hearts + '/' + o.maxH) { h._n = o.hearts + '/' + o.maxH; let s = ''; for (let i = 0; i < o.maxH; i++) s += `<img class="px" src="${I('heart')}" style="${i < o.hearts ? '' : 'filter:grayscale(1);opacity:.4'}">`; h.innerHTML = s; } } }
  function bump(e) { e.parentNode.classList.remove('bump'); void e.parentNode.offsetWidth; e.parentNode.classList.add('bump'); }
  function gtip(text) { let e = $('#gtip'); if (!text) { if (e) e.remove(); return; } if (!e) { e = el('div', 'np'); e.id = 'gtip'; view.appendChild(e); } e.textContent = text; }
  function gmsg(text, sub) { const old = $('#gmsg'); if (old) old.remove(); const m = el('div', '', `${esc(text)}${sub ? `<small>${sub}</small>` : ''}`); m.id = 'gmsg'; view.appendChild(m); setTimeout(() => m.remove(), 1400); }
  return { plat, get gamesDev() { return gamesDev; }, esc, reset, init, refresh, setBar, updateBar, carUpdate, showRoomTitle, homeVisible, toast, float, bubble, bubbleTick, hideBubble, fbubble, fbubbleTick, fhideBubble, get fbubbleText() { return FB.text; }, get bubbleText() { return MB.text; }, want, wantText, wantIcon, openShop, openWardrobe, openGames, openGrow, growUp, openAch, openAlbum, bigPhoto, openSettings, openProfile, closeSheet, rerender, modal, closeModal, hasModal, askName, help, daily, gameHud, gameHudSet, gmsg, gtip, im, I, F, U, esc, clothThumb, get sheetOpen() { return !!sheetKind; }, get sheetKind() { return sheetKind; }, get sheetTab() { return sheetTab; } };
})();
