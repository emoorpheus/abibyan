// Round 14 (plan R14 «Живёт сам» ч.1): his day by the clock, when you leave him alone for a while.
// morning (6–11) — exercise on the balcony, once a day; day — hungry (food < 40) → to the fridge, eats the most filling thing in stock
// or asks you to buy food (a rest of 4 min between snacks); evening (18–22) — a bit dirty → to the bathroom, asks to be washed (a wash wish);
// night (22–6) — yawns, goes to the zal, asks for the light off (again every ~75 s while awake). Never during the tutorial, a sheet,
// a modal, a game, a friend's scene or while he is busy; 20 s without a tap first; any tap stops him (HOME.stopTravel) and restarts the wait.
const ROUTINE = (() => {
  const IDLE = 120, FREE_CD = 120, S = () => GAME.S; // 2 min idle before playing on his own
  let idle = 0, cur = null, chk = 0, snackCD = 0, nightCD = 0, freeCD = 0, lastFree = null, force = null, off = false;
  // Round 14b (user: «не трогал экран больше минуты — никуда не ходил»): with every need fine he still has things of his own to do —
  // poses at the hall mirror, rides the robot vacuum, strums the guitar, watches TV, waves out of the balcony window, dances
  const FREE = [
    { id: 'mirror', room: 'hall', x: 96, y: 250, ok: () => true, go: () => { HOME.tripStart('mirror'); return !!HOME.trip; } },
    { id: 'vac', room: 'hall', x: 120, y: 250, ok: () => GAME.placed('vacuum'), go: () => HOME.vacRide() },
    { id: 'guitar', room: 'zal', x: 70, y: 252, ok: () => GAME.placed('guitar'), go: () => { HOME.tripStart('guitar'); return !!HOME.trip; } },
    { id: 'tv', room: 'zal', x: 0, y: 262, ok: () => GAME.hasUp('tv'), go: () => HOME.watchTv() },
    { id: 'window', room: 'balcony', x: 100, y: 250, ok: () => true, go: () => { HOME.act('look', { keep: true, then: () => HOME.act('wave', { keep: true }) }); return true; } },
    // Round 15b #3: an adventure with Жучок — sneaking Пуся's treats (in the day / evening, Жучок and Пуся at home, once in 40 min)
    { id: 'heist', room: 'hall', x: 112, y: 256, ok: () => { const h = new Date().getHours(); return h >= 9 && h < 22 && !!FRIENDS.heistOK && FRIENDS.heistOK(); }, go: () => FRIENDS.heist('routine') },
    { id: 'dance', room: null, ok: () => S().st.fun > 45 && S().st.energy > 35, go: () => { HOME.act('dance', { keep: true }); return true; } },
  ];
  const period = (h) => (h >= 6 && h < 11 ? 'morning' : h >= 11 && h < 18 ? 'day' : h >= 18 && h < 22 ? 'evening' : 'night');
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  function today() { const s = S(), d = GAME.dayStr(new Date(Date.now() - 4 * 3600e3)); if (!s.rt || s.rt.day !== d) s.rt = { day: d, ex: 0, bath: 0, snacks: 0 }; return s.rt; } // a day runs 4:00 → 4:00
  function ready() { const s = S(); return !off && !DASHA.busy() && APP.scene === 'home' && GAME.tutDone() && !s.sleeping && !HOME.busy(true) && !HOME.trans && !UI.sheetOpen && !UI.hasModal(); }
  function tick(dt) {
    idle += dt; if (FRIENDS.hosting && FRIENDS.hosting()) { idle = 0; return; } // Round 14b: friends over (a party, a visitor, seeing them out): he stays with them
    if (snackCD > 0) snackCD -= dt; if (nightCD > 0) nightCD -= dt; if (freeCD > 0 && !cur) freeCD -= dt;
    if (cur) { cur.t += dt; if (cur.until && cur.t > 0.4 && cur.until()) { cur = null; return; } if (cur.t > 45) cur = null; return; } // a step that never called back (cancelled on the way) — give up
    if ((chk -= dt) > 0) return; chk = 1;
    if (idle < IDLE || !ready()) return;
    const p = period(new Date().getHours()), r = today(), st = S().st;
    if (p === 'night') { if (nightCD <= 0) run('night'); return; }
    if (p === 'morning' && !r.ex) return run('exercise');
    if (st.food < 40 && snackCD <= 0 && r.snacks < 5) return run('snack');
    if (p === 'evening' && !r.bath && st.clean < 80) return run('bath');
    if (freeCD <= 0) run('free');
  }
  function run(id) {
    if (HOME.dropFiller) HOME.dropFiller(); // Round 17: he stops fidgeting and goes
    const tok = cur = { id, t: 0 }, live = () => cur === tok, end = () => { if (live()) cur = null; };
    const say = (k, mood) => { const a = DATA.LINES[k]; if (a) HOME.say(pick(a), mood); };
    const s = S(); if (!s.rtHint) { s.rtHint = 1; GAME.save(); UI.toast(s.name + ' живёт сам: пока ты не трогаешь экран, он занят своими делами', UI.I('star')); }
    if (id === 'exercise') {
      say('rt_exGo', 'happy');
      if (!HOME.travel('balcony', 92, 258, () => { if (!live()) return;
        HOME.act('exercise', { keep: true, then: () => { if (!live()) return; today().ex = 1; GAME.stat('fun', 8); GAME.stat('energy', 5); GAME.stat('clean', -3); GAME.care(2, 'routine'); GAME.save(); say('rt_exDone', 'happy'); end(); } });
      })) cur = null;
    } else if (id === 'snack') {
      snackCD = 240; today().snacks++; say('rt_snackGo');
      if (!HOME.travel('kitchen', 104, 250, () => { if (!live()) return;
        const ok = HOME.fridgeSnack(() => { // at the open fridge: the most filling thing he may eat
          const s = S(), ids = Object.keys(s.inv).filter((f) => s.inv[f] > 0 && DATA.FOODS[f] && !DATA.FOODS[f].nonfood && !DATA.FOODS[f].special && GAME.ageOK(DATA.FOODS[f]));
          ids.sort((a, b) => (DATA.FOODS[b].food || 0) - (DATA.FOODS[a].food || 0)); return ids[0] || null;
        }, (f) => { if (live()) { if (f) HOME.feed(f); else { say('rt_empty', 'sad'); UI.toast('Холодильник пуст — загляни в магазин', UI.I('food')); } } end(); });
        if (!ok) end();
      })) cur = null;
    } else if (id === 'bath') {
      today().bath = 1; say('rt_bathGo');
      if (!HOME.travel('bath', 90, 258, () => { if (!live()) return; GAME.wish('wash'); end(); })) cur = null; // the wish bubble + «Хочу в душ…» (HOME.onWant)
    } else if (id === 'free') { // something of his own: not the same thing twice in a row, rather in another room (so you see him walk over)
      const all = FREE.filter((f) => f.ok() && f.id !== lastFree), away = all.filter((f) => f.room && f.room !== HOME.room), pool = away.length && Math.random() < 0.8 ? away : all;
      const f = (force && FREE.find((q) => q.id === force)) || pick(pool.length ? pool : FREE.filter((q) => q.id === 'dance')); force = null; lastFree = f.id; freeCD = FREE_CD;
      const start = () => { if (!live()) return; if (!f.go()) { end(); return; } tok.until = () => !HOME.trip && !(HOME.mk.act && HOME.mk.act.keep); };
      if (!f.room) start();
      else { const x = f.id === 'tv' ? HOME.tvSpot()[0] : f.x, y = f.id === 'tv' ? HOME.tvSpot()[1] : f.y; if (!HOME.travel(f.room, x, y, start)) cur = null; }
    } else if (id === 'night') {
      nightCD = 75;
      HOME.act('yawn', { keep: true, then: () => { if (!live()) return; const ask = () => { say('rt_night', 'tired'); end(); };
        if (HOME.room === 'zal') return ask();
        say('rt_nightGo', 'tired'); if (!HOME.travel('zal', 66, 252, () => { if (live()) ask(); })) end();
      } });
    }
  }
  function poke() { idle = 0; if (cur) { cur = null; HOME.stopTravel(); } }
  if (typeof window !== 'undefined') { window.addEventListener('pointerdown', poke, true); window.addEventListener('keydown', poke, true); }
  return { tick, poke, period, get cur() { return cur ? cur.id : null; }, get off() { return off; }, set off(v) { off = !!v; },
    _reset: () => { idle = 0; cur = null; chk = 0; snackCD = 0; nightCD = 0; freeCD = 0; lastFree = null; }, FREE, _force: (id) => { force = id; }, _idle: (v) => { idle = v; } };
})();
