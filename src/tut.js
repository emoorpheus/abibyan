'use strict';
// ===== Round 7 #4: the tutorial — a hint card (Round 23: under the HUD, never over Абибян), the button it talks about glows.
// Steps (DATA.TUT): pet him → his needs → buy the phone (the starting coins are enough; a gift tops them up if not) → open the phone.
// The games open right after that (GAME.gamesOpen). Round 13: then a tour of the flat (rooms, food, washing, sleep, friends, gags, walking,
// shop + wardrobe, tasks, achievements): «Дальше» on every tour step, and each one also passes by itself when he does the thing.
// «Пропустить обучение» on every step: the first tap asks «Точно пропустить?» (back after 3 s), the second one skips it all. =====
const TUT = (() => {
  let el = null, cur = -1, curRoom = null, base = null, hiEl = null, gifted = false, sure = 0;
  const S = () => GAME.S, esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const step = () => (GAME.tutDone() ? null : DATA.TUT[S().tut]);
  const room = () => (typeof HOME !== 'undefined' ? HOME.room : null);
  const at = (D) => (typeof D.at === 'function' ? D.at(room()) : D.at) || null;
  const gagsSeen = () => Object.keys((S().gags && S().gags.seen) || {}).length;
  function ensure() { if (!el) { const r = document.getElementById('ui'); if (!r) return null; el = document.createElement('div'); el.id = 'tut'; el.className = 'notch hidden'; r.appendChild(el); } return el; }
  function glow(sel) { const e = sel ? document.querySelector(sel) : null; if (e === hiEl) return; if (hiEl) hiEl.classList.remove('tut-hi'); hiEl = e; if (e) e.classList.add('tut-hi'); }
  function render(i) {
    const D = DATA.TUT[i], e = ensure(); if (!e) return;
    e.innerHTML = `<div class="tn">Обучение ${i + 1}/${DATA.TUT.length}</div><div class="tt">${esc(D.t(S().name, room()))}</div><div class="tb"><button class="btn w sm" data-skipall>${sure > 0 ? 'Точно пропустить?' : 'Пропустить обучение'}</button>${D.btn ? `<button class="btn g sm" data-next>${D.btn}</button>` : ''}</div>`;
    const nb = e.querySelector('[data-next]'); if (nb) nb.onclick = () => { AUDIO.play('click'); next(); };
    const sb = e.querySelector('[data-skipall]'); if (sb) sb.onclick = () => { AUDIO.play('click'); if (sure > 0) { skipAll(); return; } sure = 3; sb.textContent = 'Точно пропустить?'; sb.classList.add('sure'); };
  }
  function next() { const s = S(); if (s.tut + 1 >= DATA.TUT.length) return finish(); GAME.tutSet(s.tut + 1); check(); }
  function finish() { GAME.tutSet(DATA.TUT.length); GAME.addXP(5); AUDIO.play('star'); UI.toast('Обучение пройдено! Дальше сам — удачи!', UI.I('star'), 'gold'); check(); }
  function skipAll() {
    sure = 0; GAME.tutSet(DATA.TUT.length); check();
    UI.toast(S().phone ? 'Обучение пропущено.' : 'Обучение пропущено. Мини-игры откроются, когда купишь телефон в магазине.', UI.I(S().phone ? 'star' : 'phone'));
  }
  function check() {
    const e = ensure(); if (!e) return; const s = S(), D = step();
    if (!D) { if (cur !== -2) { cur = -2; e.classList.add('hidden'); glow(null); const ui = document.getElementById('ui'); if (ui) ui.classList.remove('tutting'); } return; }
    if (D.id === 'pet' && base && s.stats.petted > base.petted) { GAME.tutSet(s.tut + 1); return check(); }
    if (D.id === 'phone' && s.phone) { AUDIO.play('star'); GAME.tutSet(s.tut + 1); return check(); }
    if (base && cur === s.tut && D.auto) { // the tour step passes by itself once he has done it
      const did = D.auto === 'room' ? room() !== base.room : D.auto === 'fed' ? s.stats.fed > base.fed : D.auto === 'washed' ? s.stats.washed > base.washed : D.auto === 'sleep' ? !!s.sleeping && !base.sleeping : D.auto === 'gag' ? gagsSeen() > base.gags : false;
      if (did) { AUDIO.play('star'); return next(); }
    }
    if (cur !== s.tut) { cur = s.tut; sure = 0; base = { petted: s.stats.petted, fed: s.stats.fed, washed: s.stats.washed, room: room(), sleeping: !!s.sleeping, gags: gagsSeen() }; curRoom = room(); render(cur); }
    else if (curRoom !== room()) { curRoom = room(); render(cur); } // the text and the lit button depend on the room
    if (D.id === 'phone' && !s.phone && s.coins < DATA.PHONE.price && !gifted) { // spent the starting coins (or an old save): a gift up to the price
      gifted = true; const n = DATA.PHONE.price - s.coins; GAME.addCoins(n, 'gift'); UI.toast(`Подарок на телефон: +${n}`, UI.I('coin'), 'gold');
    }
    const show = (APP.scene === 'home' || APP.scene === 'boot') && !UI.hasModal() && !DASHA.busy(); // Round 22: not over her gift box / her party
    e.classList.toggle('hidden', !show); const ui = document.getElementById('ui'); ui.classList.toggle('tutting', show); if (show) ui.style.setProperty('--tuth', e.offsetHeight + 'px');
    const a = at(D), ae = a && document.querySelector(a), inHud = !!(ae && ae.closest('#hud')); // HUD buttons stay visible above a sheet
    glow(show && (!UI.sheetKind || inHud) ? a : null);
  }
  // the «Точно пропустить?» question goes back after 3 s of game time
  function tick(dt) { if (sure > 0) { sure -= dt; if (sure <= 0) { sure = 0; const b = el && el.querySelector('[data-skipall]'); if (b) { b.textContent = 'Пропустить обучение'; b.classList.remove('sure'); } } } }
  // something happened that a tour step waits for: 'friend' (a friend's card opened), 'walk' (a tap on the floor → he walks)
  function on(ev) { const D = step(); if (D && D.ev === ev) { AUDIO.play('star'); next(); } }
  // the games sheet was opened (from the phone or the computer): with the phone bought that opens the games, the tour goes on
  function onGames() {
    const s = S(), D = step(); if (!D || !s.phone || D.id !== 'play') return;
    GAME.tutSet(GAME.TUT_AT('play') + 1); GAME.addXP(5); AUDIO.play('star'); UI.toast('Мини-игры открыты! Ещё пара подсказок про квартиру.', UI.I('star'), 'gold'); check();
  }
  return { check, tick, on, onGames, get step() { const D = step(); return D ? D.id : null; } };
})();
