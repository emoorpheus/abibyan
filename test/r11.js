// Round 11: node test/r11.js [shadow,knobs,desk,ducks,mat,rug] → test/gallery/r11_*.png. Exit 1 on fail.
const { boot, ok, shot, done } = require('./lib/h.js');
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const G = '/data/game/test/gallery/r11_';
(async () => {
  const { browser, page, errs } = await boot({ hour: 12 }); const E = (f, a) => page.evaluate(f, a);
  const clean = () => E(() => { const G = __game; G.UI.closeSheet && G.UI.closeSheet(); while (G.UI.hasModal()) G.UI.closeModal(); document.querySelectorAll('[data-close]').forEach((b) => b.click()); document.querySelectorAll('.toast').forEach((t) => t.remove()); __calm(); G.FRIENDS._reset && G.FRIENDS._reset(); G.GAGS._reset && G.GAGS._reset(); });
  const go = (r) => E((r) => { const G = __game; G.HOME.goTo(r, true); __adv(400); G.FRIENDS._reset && G.FRIENDS._reset(); G.DUCKS._place(r === 'kitchen' ? 'bath' : 'kitchen', 60, 1); __adv(100); }, r);
  const px = (r) => E((r) => { const d = document.getElementById('cv').getContext('2d').getImageData(r[0], r[1], r[2], r[3]).data, o = []; for (let i = 0; i < d.length; i += 4) o.push([d[i], d[i + 1], d[i + 2]]); return o; }, r);
  const cnt = (q, f) => q.filter(f).length;
  const at = () => E(() => { const H = __game.HOME; return { x: Math.round(H.mk.x), y: Math.round(H.mk.y), sh: H.mk.shY === null || H.mk.shY === undefined ? H.mk.shY : Math.round(H.mk.shY), w: !!H.walking, act: H.mk.act ? H.mk.act.name : null }; });
  await E(() => { __unlock(); __calm(); });

  // ---------- #1 his shadow stays under his feet when he walks around the floor ----------
  if (want('shadow')) { try {
    await clean(); await go('zal'); const a0 = await at();
    ok('shadow: standing in the middle — the shadow is at his feet', a0.sh !== undefined && a0.sh !== null && Math.abs(a0.sh - a0.y) <= 1, a0);
    await E(() => { __game.HOME.walkTo(30, 248); __adv(300); }); const a1 = await at();
    ok('shadow: while walking it moves with him (same y as his feet)', a1.w && Math.abs(a1.sh - a1.y) <= 1, a1);
    await E(() => __adv(3000)); const a2 = await at();
    ok('shadow: he walked up to y 248 and stands there — the shadow too (not left down at the old floor line)', !a2.w && Math.abs(a2.y - 248) <= 1 && Math.abs(a2.sh - a2.y) <= 1, a2);
    await shot(page, G + 'shadow_up.png');
    // the floor right under his feet is darker than the floor at the old line (y 271) where the stray shadow used to be
    const lum = (q) => q.reduce((n, [r, g, b]) => n + r + g + b, 0) / q.length / 3;
    const feet = lum(await px([24, 248, 12, 3])), old = lum(await px([24, 270, 12, 3]));
    await E(() => { __game.HOME.walkTo(150, 248); __adv(4000); }); const feet0 = lum(await px([24, 248, 12, 3])), old0 = lum(await px([24, 270, 12, 3]));
    ok('shadow: real pixels — darker under his feet, nothing left at the old line', feet < feet0 - 4 && Math.abs(old - old0) <= 3, { feet, feet0, old, old0 });
    await E(() => { __game.HOME.walkTo(40, 272); __adv(4000); }); const a3 = await at();
    ok('shadow: down at the front edge (y 272) it follows as well', Math.abs(a3.sh - a3.y) <= 1, a3);
    await E(() => { __game.HOME.act('jig'); __adv(500); }); const a4 = await at();
    ok('shadow: hopping on the spot it stays on the floor under him', Math.abs(a4.sh - a4.y) <= 1, a4);
    await E(() => __adv(3500));
  } catch (e) { ok('shadow: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #2 the radiator knobs are brown ----------
  if (want('knobs')) { try {
    await clean(); await go('zal');
    const sp = await E(() => __game.ROOMS.spots('zal', __game.GAME.S.home.items));
    const brown = ([r, g, b]) => r >= 80 && r <= 215 && r > g + 14 && g > b + 6 && r - g < 85, red = ([r, g, b]) => r > 160 && g < 90 && b < 90 && r - g > 100, blue = ([r, g, b]) => b > 150 && r < 110;
    const kl = await px(sp.knobL), kr = await px(sp.knobR);
    ok('knobs: both radiator knobs are brown (no red / blue caps)', cnt(kl, brown) >= 4 && cnt(kr, brown) >= 4 && !cnt(kl, red) && !cnt(kr, blue), [cnt(kl, brown), cnt(kr, brown), cnt(kl, red), cnt(kr, blue)]);
    await shot(page, G + 'knobs.png');
    for (let i = 0; i < 8; i++) await E((c) => { __tap(c[0], c[1]); __adv(400); }, [sp.radiator[0] + sp.radiator[2] / 2, sp.radiator[1] + sp.radiator[3] / 2]);
    await E(() => __adv(1500)); const sp2 = await E(() => __game.ROOMS.spots('zal', __game.GAME.S.home.items));
    const kf = sp2.knobFloor ? await px(sp2.knobFloor) : [];
    ok('knobs: the fallen one on the floor is brown too', cnt(kf, brown) >= 4 && !cnt(kf, blue), [sp2.knobFloor, cnt(kf, brown), cnt(kf, blue)]);
    await E(() => { __game.GAGS._reset && __game.GAGS._reset(); __adv(100); });
  } catch (e) { ok('knobs: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #3 the computer desk without the drawer block on the right ----------
  if (want('desk')) { try {
    await clean(); await go('balcony');
    const sp = await E(() => __game.ROOMS.spots('balcony', __game.GAME.S.home.items));
    ok('desk: no drawer-block spot any more', !sp.drawer, sp.drawer);
    const q = await px([170, 182, 6, 20]) /* between the chair back (≤168) and the right leg (177) */, dark = cnt(q, ([r, g, b]) => Math.max(r, g, b) < 64);
    ok('desk: right of the chair you see the wall, not black drawers', dark <= q.length * 0.15, [dark, q.length]);
    const lg = await px([112, 200, 120 - 112, 30]);
    ok('desk: it still stands on its legs (the left leg is there)', cnt(lg, ([r, g, b]) => Math.max(r, g, b) < 70) >= 20, cnt(lg, ([r, g, b]) => Math.max(r, g, b) < 70));
    const ids = await E(() => __game.GAGS.ids());
    ok('desk: the drawer «stash» gag is gone with it (no dead tap spot)', !ids.includes('desk'), ids);
    await E(() => { __spy(); __tap(176, 190); __adv(600); }); const c = await E(() => __game.AUDIO._calls.slice());
    ok('desk: a tap where the drawers were does not rattle a drawer', !c.includes('drawer'), c);
    await E(() => { __game.HOME.mk.x = 60; __adv(100); }); await shot(page, G + 'desk.png');
  } catch (e) { ok('desk: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #4 the ducks: mama leads, papa closes the line ----------
  if (want('ducks')) { try {
    await clean(); await go('zal');
    const o = await E(() => { const D = __game.DUCKS; D._place('zal', 120, 1); __adv(50); const p = D.pos(); return { line: D.LINE.map((d) => d.id), pos: p.map((d) => [d.id, Math.round(d.x)]) }; });
    ok('ducks: mama goes first, papa last', o.line[0] === 'mama' && o.line[o.line.length - 1] === 'papa', o.line);
    ok('ducks: …and on the floor mama is in front (walking right she is the rightmost)', o.pos[0][0] === 'mama' && o.pos.every((d, i, a) => !i || d[1] < a[i - 1][1]) && o.pos[o.pos.length - 1][0] === 'papa', o.pos);
    const o2 = await E(() => { const D = __game.DUCKS; D._place('zal', 60, -1); __adv(50); return D.pos().map((d) => [d.id, Math.round(d.x)]); });
    ok('ducks: walking left mama is the leftmost', o2[0][0] === 'mama' && o2.every((d, i, a) => !i || d[1] > a[i - 1][1]), o2);
    await E(() => { __game.HOME.mk.x = 150; __game.DUCKS._place('zal', 110, 1); __adv(100); }); await shot(page, G + 'ducks.png');
    await E(() => { __game.DUCKS._place('kitchen', 60, 1); __adv(50); });
  } catch (e) { ok('ducks: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #5 the mat in front of the front door is grey ----------
  if (want('mat')) { try {
    await clean(); await go('hall'); await E(() => { __game.HOME.walkTo(155, 268); __adv(4000); });
    const F = await E(() => __game.ROOMS.FLOOR), q = await px([68, F + 3, 44, 16]);
    const avg = [0, 1, 2].map((k) => q.reduce((n, p) => n + p[k], 0) / q.length), lum = (avg[0] + avg[1] + avg[2]) / 3, chroma = Math.max(...avg) - Math.min(...avg);
    ok('mat: the entrance mat is grey (neutral, not cream)', chroma <= 7, avg.map(Math.round));
    ok('mat: …and clearly greyer / darker than the old cream (≈ 230)', lum >= 120 && lum <= 190, Math.round(lum));
    await shot(page, G + 'mat.png');
  } catch (e) { ok('mat: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #6 a tap on the rug: he walks to the middle of it and dances there ----------
  if (want('rug')) { try {
    await clean(); await go('zal');
    const R = await E(() => __game.ZAL.RUG.slice()), cx = R[0] + R[2] / 2, cy = R[1] + R[3] / 2;
    await E(() => { __game.HOME.walkTo(150, 250); __adv(4000); });
    await E(([x, y]) => { __spy(); __tap(x, y); __adv(250); }, [R[0] + 10, R[1] + R[3] - 8]); const a = await at();
    ok('rug: a tap on the rug edge → he first walks over (no dancing on the way)', a.w && a.act !== 'jig', a);
    await E(([x, y]) => { __tap(x, y); __adv(150); }, [R[0] + 10, R[1] + R[3] - 8]); const a1 = await at();
    ok('rug: a second tap on the way does not make him dance where he is', a1.w && a1.act !== 'jig', a1);
    let b = null; for (let i = 0; i < 40; i++) { b = await E(() => { __adv(100); const H = __game.HOME; return { x: Math.round(H.mk.x), y: Math.round(H.mk.y), w: !!H.walking, act: H.mk.act ? H.mk.act.name : null }; }); if (b.act === 'jig') break; }
    ok('rug: …he dances in the middle of the rug (±3 px)', b.act === 'jig' && Math.abs(b.x - cx) <= 3 && Math.abs(b.y - Math.min(272, cy)) <= 3, [b, cx, cy]);
    const c = await E(() => __game.AUDIO._calls.slice()); ok('rug: with his jig tune', c.includes('jig'), c);
    await E(() => __adv(600)); await shot(page, G + 'rug_dance.png');
    await E(() => __adv(4000)); const b2 = await at();
    ok('rug: after the dance he stays on the rug', !b2.w && Math.abs(b2.x - cx) <= 3, b2);
    await E(([x, y]) => { __spy(); __tap(x, y); __adv(200); }, [R[0] + R[2] - 12, R[1] + 6]); const b3 = await at();
    ok('rug: already in the middle — he dances right away', b3.act === 'jig' && !b3.w, b3);
    await E(() => __adv(4000));
  } catch (e) { ok('rug: crashed — ' + String(e.message).split('\n')[0], false); } }

  await done(errs, browser);
})();
