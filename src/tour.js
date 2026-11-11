// Round 18: the weekly tournament with the friends. Every week (Mon–Sun) one of his games is «the game of the week»; Пуся, Монти,
// Москит и Жучок «play» it all week (their scores grow day by day to a total near his record in it — one of them leads at 0.95–1.15×,
// each has a favourite game +0.15); his score is the best level he reaches in it this week. The next week, at home, the results:
// the place, a prize (100/50/30/15/10 coins), the 1st → a cup (s.tour.wins, the «Чемпион недели» achievement) and an album photo.
// s.tour = { wk ('YYYY-MM-DD' of the Monday), gid, ref (his record then), fin {fid: total}, me, wins, res (results still to show) }.
const TOUR = (() => {
  const POOL = ['catch', 'roofs', 'stack', 'bongo', 'vine', 'balloon', 'gym', 'super', 'race'];
  const PRIZE = [100, 50, 30, 15, 10], SPEC = { pusya: 'catch', monty: 'bongo', mosq: 'gym', zhuk: 'stack' };
  const ACC = { pusya: 'Пусю', monty: 'Монти', mosq: 'Москита', zhuk: 'Жучка' }, D0 = new Date(2020, 0, 6); // a Monday
  const S = () => GAME.S, pad = (n) => String(n).padStart(2, '0');
  const monday = (d) => { const m = new Date(d.getFullYear(), d.getMonth(), d.getDate()); m.setDate(m.getDate() - (m.getDay() + 6) % 7); return m; };
  const key = (m) => m.getFullYear() + '-' + pad(m.getMonth() + 1) + '-' + pad(m.getDate());
  const dayIdx = () => (new Date().getDay() + 6) % 7, weekN = (m) => Math.round((m - D0) / 6048e5);
  function rng(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => { h = (h + 0x6d2b79f5) | 0; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gname = (gid) => (DATA.GAMES.find((g) => g.id === gid) || {}).name || gid;
  const fname = (id) => DATA.FRIENDS[id].name;
  // a new week: the game (the next one of those he can play, never last week's again), the friends' totals from his record
  function make(m, prev) {
    const s = S(), list = POOL.filter((g) => GAME.canPlay(g)); if (!list.length) return null;
    let i = ((weekN(m) % list.length) + list.length) % list.length; if (list.length > 1 && list[i] === (prev && prev.gid)) i = (i + 1) % list.length;
    const gid = list[i], wk = key(m), R = rng(wk + gid), ref = Math.max(3, s.best[gid] || 0), fin = {};
    const lead = DATA.FIDS[Math.floor(R() * DATA.FIDS.length)];
    for (const id of DATA.FIDS) { const k = (id === lead ? 0.95 + R() * 0.2 : 0.5 + R() * 0.45) + (SPEC[id] === gid ? 0.15 : 0); fin[id] = Math.max(1, Math.round(ref * k)); }
    return { wk, gid, ref, fin, me: 0, wins: (prev && prev.wins) || 0, res: (prev && prev.res) || null };
  }
  // the week changed → settle the old one (only if he played it) and start the new one
  function roll() {
    const s = S(), m = monday(new Date()), wk = key(m), t = s.tour;
    if (t && t.wk === wk && t.gid) return t;
    if (t && t.wk !== wk && t.gid && t.me > 0) { const rows = rank(t, t.fin), me = rows.find((r) => r.id === 'me'); t.res = { wk: t.wk, gid: t.gid, place: me.place, prize: PRIZE[me.place - 1], score: t.me, rows }; }
    const n = make(m, t) || { wk, gid: null, ref: 0, fin: {}, me: 0, wins: (t && t.wins) || 0, res: (t && t.res) || null }; // no games yet (no phone) → an empty week
    if (!t || t.wk !== wk || n.gid) { s.tour = n; GAME.save(true); }
    return n.gid ? n : null;
  }
  function rank(t, sc) {
    const rows = [{ id: 'me', name: S().name, score: t.me }].concat(DATA.FIDS.map((id) => ({ id, name: fname(id), score: sc[id] })));
    rows.sort((a, b) => b.score - a.score || (a.id === 'me' ? -1 : b.id === 'me' ? 1 : 0)); rows.forEach((r, i) => { r.place = i + 1; }); return rows;
  }
  // the friends' scores right now: a fifth of the total each day, all of it by Friday
  const now = (t) => { const f = Math.min(1, (dayIdx() + 1) / 5), o = {}; for (const id of DATA.FIDS) o[id] = Math.max(1, Math.round(t.fin[id] * f)); return o; };
  function cur() { const t = roll(); return t && t.gid ? { wk: t.wk, gid: t.gid, ref: t.ref, fin: Object.assign({}, t.fin) } : null; }
  function table() { const t = roll(); return t && t.gid ? rank(t, now(t)) : []; }
  const placeOf = () => { const r = table().find((x) => x.id === 'me'); return r ? r.place : 0; };
  // a run of a game ended (results or «Выйти») → his score; null if it is not the tournament game
  function onResult(gid, level) {
    const t = roll(); if (!t || t.gid !== gid) return null;
    const before = table(), p0 = before.find((x) => x.id === 'me').place; if (level > t.me) { t.me = level; GAME.save(true); }
    const after = table(), p1 = after.find((x) => x.id === 'me').place;
    if (p1 < p0) { if (p1 === 1) UI.toast('Ты лидер турнира!', UI.I('trophy'), 'gold');
      else { const by = before.filter((r) => r.id !== 'me' && r.place >= p1 && r.place < p0).map((r) => ACC[r.id]); UI.toast('Ты обогнал ' + by.join(' и ') + '!', UI.I('trophy')); } }
    return { place: p1, score: t.me };
  }
  // ---- the tab in «Мини-игры» and the results window ----
  const im = (src, cls = 'px') => `<img class="${cls}" src="${src}" alt="">`;
  const pic = (id) => (id === 'me' ? HOME.portrait() : FART.portrait(id));
  const rowsHtml = (rows) => `<div class="tlist">${rows.map((r) => `<div class="trow notch${r.id === 'me' ? ' me' : ''}"><b class="pl">${r.place}</b>${im(pic(r.id), 'px pt')}<span class="nm">${UI.esc(r.name)}</span><span class="sc">ур. ${r.score}</span><span class="pz">${UI.im(UI.I('coin'))}${PRIZE[r.place - 1]}</span></div>`).join('')}</div>`;
  function html() {
    const t = roll(); if (!t || !t.gid) return `<div class="hint">Турнир недели начнётся, когда откроются мини-игры.</div>`;
    const left = 7 - dayIdx(), me = t.me;
    return `<div class="thead notch">${UI.im(UI.I('trophy'), 'px ic')}<div class="tx"><div class="t1">Турнир недели</div><div class="t2">Игра: <b>${gname(t.gid)}</b> · ${left === 1 ? 'последний день' : 'осталось ' + left + ' дн.'}</div></div><button class="btn g sm" id="t-play">Играть</button></div>
      ${rowsHtml(table())}<div class="hint">${me ? 'Твой лучший уровень на этой неделе — ' + me + '. ' : ''}Друзья играют всю неделю. Дойди до уровня повыше! В понедельник — итоги и призы.</div>`;
  }
  // ---- the results, the next week at home ----
  function check() {
    if (APP.scene !== 'home' || UI.hasModal() || UI.sheetOpen || S().sleeping || HOME.inTrans() || (typeof FRIENDS !== 'undefined' && FRIENDS.busy())) return;
    roll(); const t = S().tour, r = t && t.res; if (!r) return;
    t.res = null; if (r.place === 1) t.wins = (t.wins || 0) + 1; GAME.save(true);
    const w = UI.modal(`<h2>Итоги турнира</h2><div class="duo"><img class="px" src="${HOME.portrait()}" alt="">${r.place === 1 ? `<img class="px cup" src="${UI.I('trophy')}" alt="">` : ''}</div><p>Игра недели: <b>${gname(r.gid)}</b> · твой уровень ${r.score}</p>
      <div class="big">${r.place}-е место</div>${rowsHtml(r.rows)}<div class="big">${UI.im(UI.I('coin'))}+${r.prize}</div>
      <div class="bt"><button class="btn g" id="t-ok">${r.place === 1 ? 'Ура!' : 'Отлично'}</button></div>`);
    GAME.addCoins(r.prize, 'tour'); GAME.checkAch(); if (r.place !== 1) AUDIO.play('coin'); // the 1st: celebrate() plays the star
    if (r.place === 1) { HOME.celebrate(); HOME.say('Я чемпион недели!', 'happy'); ALBUM.moment('tour:' + r.wk, { title: 'Чемпион недели', cap: S().name + ' · ' + gname(r.gid) }); }
    else HOME.say(r.place === 2 ? 'Почти первое место!' : 'В следующий раз я выиграю!', 'happy');
    w.querySelector('#t-ok').onclick = () => { AUDIO.play('click'); UI.closeModal(w); };
  }
  return { POOL, PRIZE, cur, table, place: placeOf, onResult, html, check, rowsHtml, get wins() { return (S().tour && S().tour.wins) || 0; }, _reset() { S().tour = null; roll(); } };
})();
