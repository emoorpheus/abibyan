'use strict';
// ===== Round 16: the album — every photo is kept, and the bright moments are photographed by themselves =====
// An entry: { id, k (moment id or 'photo'), title, cap, sub (date · stage), d (ms), src (the 150×150 PNG of the room at that moment) }.
// The photos live under their own localStorage key (<save key>_album) so the main save stays small; the «moment taken» flags are
// S.moments in the save. Moments (once each): the first dance, a new growth stage, «Скуф», the first visit of each friend, the first
// «Все вместе» group photo, the first «Вылазка» with Жучок. A moment shot is quiet: a shutter, a soft flash, a toast — no window.
// The polaroid (big frame + caption + date) is composed from the snapshot when it is shown (HOME.photo / the album page).
const ALBUM = (() => {
  const S = () => GAME.S, MAX = 36;
  let list = null, t = 0, timers = [];
  const key = () => GAME.albumKey();
  const later = (d, fn) => timers.push({ at: t + d, fn });
  function load() {
    if (list) return list; let a = null; try { a = JSON.parse(localStorage.getItem(key()) || '[]'); } catch (e) { a = null; }
    list = Array.isArray(a) ? a.filter((e) => e && typeof e.src === 'string') : []; return list;
  }
  // the oldest plain photo first, then the oldest moment; Round 22: her birthday photos ('dasha:<year>') are never dropped
  function drop() { let i = list.findIndex((e) => e.k === 'photo'); if (i < 0) i = list.findIndex((e) => !/^dasha/.test(e.k || '')); list.splice(i >= 0 ? i : 0, 1); }
  function store() { for (let i = 0; i < 40; i++) { try { localStorage.setItem(key(), JSON.stringify(list)); return true; } catch (e) { if (list.length <= 1) return false; drop(); } } return false; }
  const ds = (d) => { d = new Date(d); return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear(); };
  const sub = (d) => ds(d) + ' · ' + GAME.ageDef().name;
  function add(e) {
    load(); const d = Date.now();
    const o = Object.assign({ id: d.toString(36) + Math.random().toString(36).slice(2, 6), k: 'photo', title: 'Фото на память', cap: S().name, sub: sub(d), d }, e);
    list.push(o); while (list.length > MAX) drop(); store(); return o;
  }
  // the room right now → a new album entry
  function snap(k, o = {}) { const c = HOME.snap(o.top); return add({ k, title: o.title || 'Фото на память', cap: o.cap || S().name, src: c.toDataURL('image/png') }); }
  const got = (k) => !!(S().moments && S().moments[k]);
  function moment(k, o = {}) {
    const s = S(); if (!s.moments) s.moments = {}; if (s.moments[k]) return false; s.moments[k] = 1; GAME.save();
    later(o.delay === undefined ? 0.8 : o.delay, () => shoot(k, o, 0)); return true;
  }
  function shoot(k, o, n) {
    if (APP.scene !== 'home' || HOME.inTrans() || (o.room && HOME.room !== o.room)) { if (n < 40) later(1, () => shoot(k, o, n + 1)); return; }
    snap(k, o); AUDIO.play('camera'); HOME.flashOn(0.45); UI.toast('Фото в альбом: ' + o.title, UI.I('camera'));
  }
  // ---- the polaroid (Round 14b: caption and date on a line each, shrunk to fit, in the game font) ----
  const PH_F = ['700 40px "Pixelify Sans"', '400 26px "Pixelify Sans"'];
  const fontsOK = () => { const D = document.fonts; return !D || !D.check || PH_F.every((f) => D.check(f)); };
  function fontsReady() { const D = document.fonts; if (!D || !D.load) return Promise.resolve(); if (D.check && PH_F.every((f) => D.check(f))) return Promise.resolve(); return Promise.race([Promise.all(PH_F.map((f) => D.load(f))).catch(() => { }), new Promise((r) => setTimeout(r, 1500))]); }
  function fitText(x, text, w, size, min, weight) { let z = size; for (; z > min; z -= 2) { x.font = `${weight} ${z}px "Pixelify Sans", monospace`; if (x.measureText(text).width <= w) return text; }
    x.font = `${weight} ${min}px "Pixelify Sans", monospace`; let tx = text; while (tx.length > 1 && x.measureText(tx + '…').width > w) tx = tx.slice(0, -1); return tx === text ? tx : tx + '…'; }
  function file(url, fn) { try { const b = atob(url.split(',')[1]), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new File([u], fn, { type: 'image/png' }); } catch (e) { return null; } }
  function polaroid(img, cap, subT, d) {
    const cw = 150, ch = 150, K = 4, B = 22, CAP = 112;
    const c = PX.canvas(cw * K + B * 2, ch * K + B + CAP), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.fillStyle = '#fffaf0'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, cw, ch, B, B, cw * K, ch * K);
    x.fillStyle = 'rgba(59,36,51,.25)'; x.fillRect(B, B + ch * K, cw * K, 2);
    const L = B + 4, maxW = c.width - B * 2 - 8, y1 = B + ch * K + 38, y2 = B + ch * K + 84; x.textBaseline = 'middle'; x.textAlign = 'left';
    const t1 = fitText(x, cap, maxW, 40, 24, 700), w1 = x.measureText(t1).width, z1 = parseInt(x.font.match(/(\d+)px/)[1], 10); x.fillStyle = '#3b2433'; x.fillText(t1, L, y1);
    const t2 = fitText(x, subT, maxW, 26, 18, 400), w2 = x.measureText(t2).width, z2 = parseInt(x.font.match(/(\d+)px/)[1], 10); x.fillStyle = '#7a5a6a'; x.fillText(t2, L, y2);
    const fok = !document.fonts || !document.fonts.check || document.fonts.check(PH_F[0]);
    const url = c.toDataURL('image/png'), fn = 'abibyan-' + ds(d || Date.now()).replace(/\./g, '-') + '.png';
    return { url, fn, file: file(url, fn), lay: { W: c.width, cap: { x0: L, x1: L + w1, y0: y1 - z1 / 2, y1: y1 + z1 / 2 }, date: { x0: L, x1: L + w2, y0: y2 - z2 / 2, y1: y2 + z2 / 2 }, font: fok ? 'Pixelify Sans' : 'fallback' } };
  }
  // an album entry → its polaroid (the snapshot is a dataURL: load it first)
  function view(e) { return new Promise((res) => { const im = new Image(); im.onload = () => fontsReady().then(() => res(polaroid(im, e.cap, e.sub, e.d))); im.onerror = () => res(null); im.src = e.src; }); }
  // Round 14b: «Сохранить» → the share sheet with the PNG (on a phone: «Сохранить изображение»), else a download
  const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function save(url, fn, f) {
    AUDIO.play('click');
    if (f && navigator.share && navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: 'Абибян' }).catch(() => { }); return 'share'; }
    const a = document.createElement('a'); a.href = url; a.download = fn; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
    if (isIOS()) UI.toast('Если фото не сохранилось — зажми его пальцем и выбери «Сохранить»', UI.I('star'));
    return 'download';
  }
  // the gag map: a 48×48 picture of the place in the room (found → in colour, not yet → a dark silhouette)
  const cropC = {};
  function crop(room, r, on) {
    const H = S().home, bg = ROOMS.build(room, H), k = room + '|' + r.join(',') + '|' + (on ? 1 : 0) + '|' + JSON.stringify(H.items).length + ROOMS.phase();
    if (cropC[k]) return cropC[k];
    const side = Math.min(120, Math.max(24, r[2] + 8, r[3] + 8)), cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2;
    const sx = Math.max(0, Math.min(bg.width - side, Math.round(cx - side / 2))), sy = Math.max(0, Math.min(bg.height - side, Math.round(cy - side / 2)));
    const c = PX.canvas(48, 48), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(bg, sx, sy, side, side, 0, 0, 48, 48);
    if (!on) { x.globalCompositeOperation = 'saturation'; x.fillStyle = '#808080'; x.fillRect(0, 0, 48, 48); x.globalCompositeOperation = 'source-over'; x.fillStyle = 'rgba(43,29,51,.7)'; x.fillRect(0, 0, 48, 48); }
    return (cropC[k] = c.toDataURL('image/png'));
  }
  function clear() { list = []; timers = []; try { localStorage.removeItem(key()); } catch (e) { } }
  GAME.on((ev) => { if (ev === 'reset') clear(); });
  function update(dt) { t += dt; for (let i = timers.length - 1; i >= 0; i--) if (t >= timers[i].at) { const f = timers[i].fn; timers.splice(i, 1); try { f(); } catch (e) { console.error(e); } } }
  return { MAX, list: () => load().slice(), add, snap, moment, got, polaroid, view, save, fontsReady, fontsOK, crop, sub, ds, update, _reset: () => { clear(); } };
})();
