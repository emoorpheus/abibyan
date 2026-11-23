'use strict';
// ===== App bootstrap: scaling, main loop, input routing, game events =====
const APP = (() => {
  let scene = 'boot', cv = null, ctx = null, last = 0, simAcc = 0, hudAcc = 0, saveAcc = 0, lastWantK = '', away = 0;
  let lastIn = -1e9, downAt = 0, renders = 0, fpsT = 60, sess = 0; // Round 20: battery — the last touch / key, frames drawn, the target fps, seconds played
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  // Layout: the room view is 180x320 logical px. On tall screens the HUD (top) and the action bar (bottom)
  // move out of the room into their own panels, like Pou/Talking Tom.
  const HUD_H = 42, BAR_H = 44; let lay = { ct: 0, cb: 0, u: 2 };
  let saProbe = null;
  function safeArea() { // iPhone notch / home bar when installed to the home screen
    if (!saProbe) { saProbe = document.createElement('div'); saProbe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)'; document.body.appendChild(saProbe); }
    const c = getComputedStyle(saProbe); return { t: parseFloat(c.paddingTop) || 0, r: parseFloat(c.paddingRight) || 0, b: parseFloat(c.paddingBottom) || 0, l: parseFloat(c.paddingLeft) || 0 };
  }
  function isIOS() {
    const n = navigator, ua = n.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) || (n.platform === 'MacIntel' && n.maxTouchPoints > 1);
  }
  function isStandalone() {
    try { return navigator.standalone === true || (!!window.matchMedia && matchMedia('(display-mode: standalone)').matches); } catch (e) { return false; }
  }
  function isMobileView() {
    return isStandalone() || window.innerHeight >= window.innerWidth * 1.05 || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
  }
  function fit() {
    const sa = safeArea();
    let vw = window.innerWidth;
    let vh = Math.max(window.innerHeight, (window.visualViewport && window.visualViewport.height) || 0, document.documentElement.clientHeight || 0);
    if ((isStandalone() || isIOS()) && window.screen && window.screen.height) {
      const isPortrait = vh >= vw || (window.matchMedia && matchMedia('(orientation: portrait)').matches);
      const sh = isPortrait ? Math.max(window.screen.width, window.screen.height) : Math.min(window.screen.width, window.screen.height);
      const sw = isPortrait ? Math.min(window.screen.width, window.screen.height) : Math.max(window.screen.width, window.screen.height);
      vh = Math.max(vh, sh);
      vw = Math.max(vw, sw);
    }
    const dpr = window.devicePixelRatio || 1;
    const snap = (u) => { const k = u * dpr, f = Math.floor(k); if (f >= 1 && f / k >= (k < 4 ? 0.8 : 0.94)) return f / dpr; return u; };
    const st = document.documentElement.style; const cl = document.documentElement.classList;

    if (!isMobileView()) {
      cl.add('is-desktop'); cl.remove('mode-stretch'); cl.remove('mode-fill'); cl.remove('fill');
      let u = snap(Math.min(vw / 180, vh / 320));
      const uX = snap(Math.min(vw / 180, vh / (320 + HUD_H + BAR_H)));
      if (vh / u - 320 < HUD_H * 0.7 && uX >= u * 0.88) u = uX;
      u = Math.max(0.5, u);
      const extra = Math.max(0, Math.min(vh / u - 320, HUD_H + BAR_H));
      const ct = extra >= HUD_H * 0.7 ? Math.min(HUD_H, extra) : 0;
      const cb = Math.max(0, Math.min(BAR_H, extra - ct));
      if (cv) { if (cv.width !== 180) cv.width = 180; if (cv.height !== 320) cv.height = 320; }
      st.setProperty('--u', u + 'px'); st.setProperty('--ux', u + 'px'); st.setProperty('--uy', u + 'px');
      st.setProperty('--ct', (ct * u) + 'px'); st.setProperty('--sh', ((320 + ct + cb) * u) + 'px');
      st.setProperty('--vh', vh + 'px'); st.setProperty('--vw', vw + 'px');
      lay = { ct, cb, u, ux: u, uy: u, mode: 'desk' };
      cl.toggle('tall', ct > 0);
      if (typeof FILL !== 'undefined') FILL.layout(u);
      return;
    }

    // Phone / Standalone App (iPhone 17 WebClip): 100% adaptive fullscreen with 1:1 PROPORTIONAL pixels.
    // Characters are NOT stretched: scale on X and Y is strictly identical.
    cl.remove('is-desktop'); cl.add('mode-stretch'); cl.remove('mode-fill'); cl.remove('fill'); cl.remove('tall');
    let u = snap(vw / 180); u = Math.max(0.5, u);
    const canvasH = Math.max(320, Math.round(vh / u));
    if (cv) {
      if (cv.width !== 180) cv.width = 180;
      if (cv.height !== canvasH) cv.height = canvasH;
    }
    st.setProperty('--u', u + 'px'); st.setProperty('--ux', u + 'px'); st.setProperty('--uy', u + 'px');
    st.setProperty('--ct', '0px'); st.setProperty('--sh', '100%');
    st.setProperty('--vh', vh + 'px'); st.setProperty('--vw', vw + 'px');
    lay = { ct: 0, cb: 0, u, ux: u, uy: u, ctPx: 0, h: canvasH, mode: 'stretch' };
    cvRect = null;
    if (typeof FILL !== 'undefined') FILL.layout(u);
  }
  let cvRect = null;
  function getCvRect() {
    if (!cvRect && cv) cvRect = cv.getBoundingClientRect();
    return cvRect || { left: 0, top: 0, width: 180, height: 320 };
  }
  function toLogical(cx, cy) {
    const r = getCvRect();
    const ch = (cv && cv.height) || 320;
    return { x: (cx - r.left) / (r.width || 1) * 180, y: (cy - r.top) / (r.height || 1) * ch };
  }
  function setScene(s) { scene = s; }
  function bindInput() {
    const stage = document.getElementById('stage'); let capId = null;
    // the stage never scrolls (overflow:hidden still scrolls on focus / scrollIntoView, which shifted the whole picture up by the HUD strip)
    stage.addEventListener('scroll', () => { if (stage.scrollTop || stage.scrollLeft) { stage.scrollTop = 0; stage.scrollLeft = 0; } });
    const ok = (e) => e.target === cv || e.target === stage;
    const inside = (p) => p.x >= 0 && p.x <= 180 && p.y >= 0 && p.y <= ((cv && cv.height) || 320);
    const homeIn = () => scene === 'home' || (scene === 'boot' && DASHA.giftOn()); // Round 22: the gift box is tapped before the game starts
    const clampP = (p) => ({ x: Math.max(0, Math.min(180, p.x)), y: Math.max(0, Math.min((cv && cv.height) || 320, p.y)) });
    stage.addEventListener('pointerdown', (e) => {
      if (!ok(e)) return; e.preventDefault(); AUDIO.init();
      if (cv) cvRect = cv.getBoundingClientRect();
      const p = toLogical(e.clientX, e.clientY);
      if (homeIn()) { if (!inside(p)) return; HOME.down(p.x, p.y, e); } else if (scene === 'game') MINI.down(clampP(p).x, clampP(p).y); else return;
      capId = e.pointerId; try { stage.setPointerCapture(e.pointerId); } catch (er) { }
    });
    stage.addEventListener('pointermove', (e) => {
      const p = toLogical(e.clientX, e.clientY);
      if (homeIn()) { if (capId === e.pointerId || e.pointerType !== 'mouse') HOME.move(p.x, p.y, e); else if (ok(e) && inside(p)) HOME.hover(p.x, p.y); else HOME.hover(-99, -99); }
      else if (scene === 'game') { const q = clampP(p); MINI.move(q.x, q.y); }
    });
    const end = (e) => { AUDIO.init(); if (capId !== e.pointerId) return; capId = null; if (e.cancelable) e.preventDefault(); const p = toLogical(e.clientX, e.clientY); if (homeIn()) HOME.up(p.x, p.y, e); else if (scene === 'game') { const q = clampP(p); MINI.up(q.x, q.y); } };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return; AUDIO.init();
      if (scene === 'game') { if (e.repeat && e.code !== 'ArrowLeft' && e.code !== 'ArrowRight') return; MINI.key(e.code, true); if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); }
      else if (scene === 'home') { if (e.code === 'Escape') { if (UI.hasModal()) UI.closeModal(); else if (UI.sheetOpen) UI.closeSheet(); return; } if (!UI.hasModal() && !UI.sheetOpen) HOME.key(e.code); }
    });
    window.addEventListener('keyup', (e) => { if (scene === 'game') MINI.key(e.code, false); });
    // Round 20 (ios-safari-quirks): unlock AudioContext and AudioSession on every user gesture
    const unlockGest = () => AUDIO.init();
    for (const ev of ['touchstart', 'touchend', 'pointerdown', 'pointerup', 'click']) {
      document.addEventListener(ev, unlockGest, { capture: true, passive: true });
      window.addEventListener(ev, unlockGest, { capture: true, passive: true });
    }
    const poke = () => { lastIn = performance.now(); };
    for (const ev of ['pointermove', 'wheel', 'touchstart', 'keydown']) document.addEventListener(ev, poke, { capture: true, passive: true });
    document.addEventListener('pointerdown', () => { poke(); downAt = lastIn; }, { capture: true, passive: true });
    for (const ev of ['pointerup', 'pointercancel']) document.addEventListener(ev, () => { poke(); downAt = 0; }, { capture: true, passive: true });
    window.addEventListener('resize', () => { cvRect = null; }, { passive: true });
    window.addEventListener('orientationchange', () => { cvRect = null; }, { passive: true });
    const noContext = (e) => { if (!(e.target && e.target.closest && e.target.closest('input,textarea'))) e.preventDefault(); };
    document.addEventListener('contextmenu', noContext, { passive: false });
    window.addEventListener('contextmenu', noContext, { passive: false });
    stage.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        GAME.save(true);
        if (scene === 'game') MINI.pause();
        HOME.pause();
        DASHA.pause();
        AUDIO.suspend();
      } else {
        const dt = GAME.catchUp();
        AUDIO.resume();
        if (dt > 600 && scene === 'home') setTimeout(() => greet(), 400);
        UI.refresh();
      }
    });
    window.addEventListener('focus', () => { if (!document.hidden) AUDIO.resume(); }, { passive: true });
    window.addEventListener('pagehide', () => { GAME.save(true); AUDIO.suspend(); });
    window.addEventListener('pageshow', () => { if (!document.hidden) AUDIO.resume(); }, { passive: true });
  }
  function unlockedAt(L) {
    const n = []; for (const id in DATA.FOODS) if (DATA.FOODS[id].lvl === L && GAME.ageOK(DATA.FOODS[id])) n.push(DATA.FOODS[id].name);
    for (const id in DATA.CLOTHES) if (DATA.CLOTHES[id].lvl === L && GAME.ageOK(DATA.CLOTHES[id])) n.push(DATA.CLOTHES[id].name);
    for (const id in DATA.DECOR) if (DATA.DECOR[id].lvl === L && DATA.DECOR[id].price) n.push(DATA.DECOR[id].name);
    return n;
  }
  // growth celebration waits until the player is back home with no dialog open
  // Round 17: the growth party (friends, cake, the stage gift, a photo) once he is home, awake, with nothing open; remembered until then
  function growParty() {
    const s = GAME.S, G = s.grow; if (!G.party || scene !== 'home' || UI.hasModal() || UI.sheetOpen || s.sleeping || HOME.inTrans() || DASHA.busy()) return;
    if (FRIENDS.growParty(G.party)) { G.party = 0; GAME.save(true); }
  }
  function growCheck() {
    const G = GAME.S.grow; if (scene !== 'home' || UI.hasModal() || !(G.seen < G.stage)) return;
    G.seen = G.stage; GAME.save(true); if (UI.sheetOpen) UI.closeSheet(); G.party = G.stage; GAME.save(true); UI.growUp(G.stage); HOME.growFx(); UI.refresh(); // Round 17: the growth party comes once the card is closed
  }
  // babies (babble stages) greet with a whiny «Э-э-э», the older ones with a line
  const greet = () => FRIENDS.busy() || DASHA.busy() ? 0 : GAME.ageDef().babble ? HOME.whine() : HOME.say(pick(DATA.LINES.hello), 'happy'); // never over a friend's scene
  function onGame(ev, a) {
    const s = GAME.S;
    if (ev === 'levelup') { AUDIO.play('level'); UI.toast(`Уровень ${a}! Бонус +10 монет`, UI.I('star'), 'gold'); const n = unlockedAt(a); if (n.length) setTimeout(() => UI.toast('В магазине открыто: ' + n.slice(0, 4).join(', ') + (n.length > 4 ? '…' : ''), UI.I('shop')), 900); if (scene === 'home') HOME.celebrate(); }
    else if (ev === 'ach') {
      if (typeof DASHA !== 'undefined' && (DASHA.busy() || DASHA.bday() || DASHA.force)) return;
      setTimeout(() => {
        AUDIO.play('star');
        const tier = a.tier || 'bronze';
        const ic = tier === 'silver' ? UI.I('trophy_silver') : tier === 'bronze' ? UI.I('trophy_bronze') : UI.I('trophy');
        const tName = tier === 'silver' ? ' (серебро)' : tier === 'gold' ? ' (золото)' : ' (бронза)';
        UI.toast(`Достижение «${a.name}»${tName} · +${a.coins}`, ic, 'gold');
      }, 300);
    }
    else if (ev === 'stage') { UI.toast(`${s.name} теперь: ${a.after}!`, UI.I('scale'), 'gold'); if (scene === 'home') HOME.stageFx(a); }
    else if (ev === 'want') { const w = s.want; const k = w ? w.type + (w.id || '') + w.until : ''; if (w && k !== lastWantK) HOME.onWant(w); lastWantK = k; }
    else if (ev === 'wantDone') { lastWantK = ''; HOME.onWantDone(a); }
    else if (ev === 'grow') { setTimeout(growCheck, 400); }
    else if (ev === 'friendLv') FRIENDS.levelUp(a);
    else if (ev === 'careDay') { setTimeout(() => { AUDIO.play('star'); UI.toast(`День заботы засчитан! Всего: ${a}`, UI.I('sprout'), 'gold'); }, 600); setTimeout(() => SEASONS.check(), 2600); } // Round 10 #8: a new week of care → maybe a new event
    else if (ev === 'careCap') { UI.toast(`${s.name} получил всю заботу на сегодня — расти дальше завтра!`, UI.I('sprout')); }
    if (ev === 'coins' || ev === 'xp' || ev === 'levelup' || ev === 'wear' || ev === 'home' || ev === 'ach') UI.refresh();
  }
  // Round 20 (battery): full 60 fps in games, for 2.5 s after a touch / key, while a finger is down and while something moves by itself
  // (HOME.lively: a room slide, a walk, a jump, guests); otherwise 30 at home and 15 asleep. Never over 60 (120 Hz screens).
  // Round 32: desktop (window > 600 or landscape) keeps full 60 fps; 8ms vsync tolerance prevents timer jitter drops on 120 Hz ProMotion
  const isDesk = () => typeof window !== 'undefined' && (window.innerWidth > 600 || window.innerWidth > window.innerHeight);
  function wantFps() {
    if (scene !== 'home' || isDesk()) return 60; const n = performance.now();
    if (n - lastIn < 2500 || (downAt && n - downAt < 20000) || HOME.lively()) return 60;
    return GAME.S.sleeping ? 15 : 30;
  }
  function frame(ts) {
    requestAnimationFrame(frame);
    const now = ts / 1000; fpsT = wantFps(); if (last && now - last < 1 / fpsT - 0.008) return; // skip this vsync (8ms tolerance prevents jitter drops)
    let dt = last ? now - last : 1 / 60; last = now; const cap = fpsT < 60 ? 0.1 : 0.05; if (dt > cap) dt = cap; if (dt <= 0) return;
    step(dt);
  }
  // Round 20 (ios-safari-quirks §5.1): iPhone Safari wipes a site's save after 7 days unused (ITP) — unless it is on the home screen
  function iosTip() {
    const s = GAME.S, p = UI.plat(); if (DASHA.busy() || !s.hint || s.hint.ios || !p.ios || p.standalone || !p.web || sess < 8 || UI.hasModal() || UI.sheetOpen || s.tut < DATA.TUT.length || FRIENDS.busy()) return;
    s.hint.ios = 1; GAME.save(true); UI.toast('Совет: «Поделиться» → «На экран „Домой“» — Абибян станет приложением, и сохранение не сотрётся', UI.I('home'), '', 7000);
  }
  function step(dt) {
    renders++; sess += dt; SPR.frame();
    simAcc += dt; if (simAcc >= 1) { GAME.simulate(simAcc); simAcc = 0; if (scene === 'home') GAME.tickWant(); }
    try {
      if (scene === 'game') { MINI.update(dt); MINI.render(ctx); } else { HOME.update(dt); DASHA.update(dt); HOME.render(ctx); }
    } catch (e) { console.error(e); }
    try { FILL.draw(dt, scene, cv); } catch (e) { console.error(e); } // Round 25
    if (typeof TUT !== 'undefined') TUT.tick(dt); // Round 13: «Точно пропустить?» times out
    hudAcc += dt; if (hudAcc > 0.3) { hudAcc = 0; UI.refresh(); if (scene === 'home') { growCheck(); growParty(); TOUR.check(); iosTip(); DASHA.check(); } }
    saveAcc += dt; if (saveAcc > 8) { saveAcc = 0; GAME.save(); }
  }
  function afterIntro(o = {}) { // Round 22: o.gift — straight after the gift box (its own hello; the day's coins came with the box)
    scene = 'home'; UI.refresh();
    if (!o.gift && GAME.dailyAvailable()) { const r = GAME.claimDaily(); if (r) { AUDIO.play('coin'); UI.daily(r); } }
    if (!o.gift) setTimeout(() => greet(), 700);
    const rf = GAME.takeRefund(); if (rf.shop) setTimeout(() => UI.toast('Чайник, гитара, пылесос и вещи на этажерке теперь продаются в магазине — твои остались на месте!', UI.I('home')), rf.sum ? 5400 : 2200); // Round 9 #2
    if (rf.sum) setTimeout(() => UI.toast(rf.flat ? `Абибян переехал в настоящую квартиру! Обои, полы и лишнюю мебель вернули монетами: +${rf.sum}` : rf.kettle ? `Чайник в горошек сдали — на кухне теперь стеклянный Polaris, он кипит! +${rf.sum} монет` : rf.hall ? `Картину, ковёр на стену и фикус убрали из прихожей — вернули монетами: +${rf.sum}` : rf.rug ? `Круглый ковёр сдали — в зале теперь вязаный ковёр-мандала, он есть всегда. +${rf.sum} монет` : `Мишку убрали — на кровати теперь подушки-друзья. +${rf.sum} монет`, UI.I('coin')), 2200);
  }
  function boot() {
    fit(); window.addEventListener('resize', fit); if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
    cv = document.getElementById('cv'); cv.width = 180; cv.height = 320; ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
    GAME.load(); away = GAME.catchUp(); const s = GAME.S; fit();
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then((p) => p || navigator.storage.persist()).catch(() => { }); } catch (e) { }
    AUDIO.set('sfx', s.settings.sfx); AUDIO.set('music', s.settings.music);
    UI.init(); HOME.init(); HOME.fontsReady(); bindInput(); if (window.ABI_TEST) setTimeout(() => { const T = window.ABI_TEST, rich = !!(T.coins || T.top); const msg = T.shifted ? (rich ? 'Тестовая версия: сегодня 21.11, 100 000 монет, своё сохранение. Заново — в настройках' : 'Репетиция 21.11: чистый запуск без бонусов. Заново — в настройках') : (rich ? 'Тестовая версия: 100 000 монет, макс. уровень, своё сохранение' : 'Тестовая версия: своё сохранение'); UI.toast(msg, UI.I(rich ? 'coin' : 'star'), 'gold', 4200); }, 1200); GAME.on(onGame); SEASONS.check(); lastWantK = s.want ? s.want.type + (s.want.id || '') + s.want.until : '';
    requestAnimationFrame(frame);
    DASHA.boot();
    const go = () => { if (!s.named || (window.ABI_TEST && /gift/.test(location.hash))) DASHA.giftStart(); else afterIntro(); }; // Round 22: the first start is her gift box (was: «Как его зовут?»)
    let done = false; const once = () => { if (!done) { done = true; go(); } };
    if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('700 10px "Pixelify Sans"'), document.fonts.load('400 10px "Pixelify Sans"', 'Привет')]).then(once, once); else once();
    setTimeout(once, 1200);
  }
  // ----- hooks for automated playtests (skill: develop-web-game); harmless in normal play -----
  function advance(ms) { const n = Math.max(1, Math.round(ms / (1000 / 60))); for (let i = 0; i < n; i++) step(1 / 60); }
  function textState() {
    const s = GAME.S, r = (v) => Math.round(v * 10) / 10;
    const o = { note: 'canvas 180x320, origin top-left, y down', scene, room: HOME.room, name: s.name, coins: s.coins, lvl: s.lvl, xp: s.xp,
      needs: { food: r(s.st.food), fun: r(s.st.fun), energy: r(s.st.energy), clean: r(s.st.clean) }, kg: r(s.kg), age: (DATA.AGES[s.grow.stage] || {}).id,
      sleeping: !!s.sleeping, light: !!s.light, tv: HOME.tvOn, want: s.want ? { type: s.want.type, id: s.want.id || null } : null, modal: UI.hasModal(), sheet: UI.sheetKind || null, things: HOME.things(), season: SEASONS.cur() };
    if (scene === 'home' && HOME.mk) o.monkey = { x: Math.round(HOME.mk.x), y: Math.round(HOME.mk.y) };
    if (scene === 'home' && HOME.trip) o.trip = HOME.trip;
    const st = MINI.st; if (scene === 'game' && st) { o.game = { id: st.gid, level: st.level, coins: st.coins, done: st.done, hearts: st.hearts, over: !!st.over, paused: !!st.paused }; if (st.duel) o.game.duel = Object.assign({}, st.duel); }
    if (scene === 'home' && typeof FRIENDS !== 'undefined') o.friends = FRIENDS.info();
    if (scene === 'home' && typeof GAGS !== 'undefined') o.gags = GAGS.info();
    return JSON.stringify(o);
  }
  return { fps: () => ({ target: fpsT, renders }), boot, fit, setScreenMode: () => {}, get screenMode() { return 'stretch'; }, setScene, afterIntro, toLogical, advance, textState, greet, get lay() { return lay; }, get scene() { return scene; }, get away() { return away; } };
})();
window.__game = { GAME, HOME, MINI, UI, AUDIO, APP, SPR, DATA, ROOMS, FILL, SPEECH: typeof SPEECH !== 'undefined' ? SPEECH : null, FART: typeof FART !== 'undefined' ? FART : null, FRIENDS: typeof FRIENDS !== 'undefined' ? FRIENDS : null, GAGS: typeof GAGS !== 'undefined' ? GAGS : null, ALBUM: typeof ALBUM !== 'undefined' ? ALBUM : null, TUT: typeof TUT !== 'undefined' ? TUT : null, ZAL: typeof ZAL !== 'undefined' ? ZAL : null, HALL: typeof HALL !== 'undefined' ? HALL : null, DUCKS: typeof DUCKS !== 'undefined' ? DUCKS : null, ROUTINE: typeof ROUTINE !== 'undefined' ? ROUTINE : null, ART, TOUR: typeof TOUR !== 'undefined' ? TOUR : null, DASHA };
window.advanceTime = (ms) => APP.advance(ms); window.render_game_to_text = () => APP.textState();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', APP.boot); else APP.boot();
