// Round 12: node test/r12.js [jig,zhuk] → test/gallery/r12_*.png. Exit 1 on fail.
const { boot, ok, shot, done } = require('./lib/h.js');
const want = ((a) => (n) => !a || a.split(',').includes(n))(process.argv[2]);
const G = '/data/game/test/gallery/r12_';
(async () => {
  const { browser, page, errs } = await boot({ hour: 12 }); const E = (f, a) => page.evaluate(f, a);
  const clean = () => E(() => { const G = __game; G.UI.closeSheet && G.UI.closeSheet(); while (G.UI.hasModal()) G.UI.closeModal(); document.querySelectorAll('[data-close]').forEach((b) => b.click()); document.querySelectorAll('.toast').forEach((t) => t.remove()); __adv(200); });
  const go = (r) => E((r) => { const G = __game; G.HOME.goTo(r, true); __adv(400); G.FRIENDS._reset && G.FRIENDS._reset(); G.DUCKS._place(r === 'kitchen' ? 'bath' : 'kitchen', 60, 1); __adv(100); }, r);
  const at = () => E(() => { const H = __game.HOME; return { room: H.room, x: Math.round(H.mk.x), y: Math.round(H.mk.y), w: !!H.walking, act: H.mk.act ? H.mk.act.name : null }; });
  await E(() => { __unlock(); __calm(); const A = __game.AUDIO; A._stops = []; const o = A.stop; A.stop = function (n, ...r) { A._stops.push(n); return o.call(this, n, ...r); }; });

  // ---------- #1 he stops dancing when he leaves the zal ----------
  if (want('jig')) { try {
    await clean(); await go('zal');
    const R = await E(() => __game.ZAL.RUG.slice()), cx = R[0] + R[2] / 2, cy = Math.min(272, R[1] + R[3] / 2);
    await E(([x, y]) => { __game.HOME.walkTo(x, y); __adv(4000); }, [cx, cy]);
    await E(([x, y]) => { __spy(); __tap(x, y); __adv(700); }, [R[0] + R[2] - 12, R[1] + 6]); const a0 = await at(); // the rug corner (the middle is under him)
    const live0 = await E(() => (__game.AUDIO.liveOn ? __game.AUDIO.liveOn('jig') : null));
    ok('jig: setup — he dances on the rug, the tune is a stoppable live sound', a0.act === 'jig' && live0 === true, [a0, live0]);
    await E(() => { __game.AUDIO._stops.length = 0; __game.GAME.S.st.fun = 60; __spy(); __game.HOME.go(1); __adv(120); }); const a1 = await at(); // fun ≤ 70: no idle dance of his own in the other room (it made notes + the «Первый танец» photo under load)
    ok('jig: he went to the next room …', a1.room !== 'zal', a1);
    ok('jig: … and stopped dancing right away', a1.act !== 'jig', a1);
    const st = await E(() => ({ stops: __game.AUDIO._stops.slice(), live: __game.AUDIO.liveOn ? __game.AUDIO.liveOn('jig') : null }));
    ok('jig: the jig tune is cut off too (no music from the zal)', st.stops.includes('jig') && st.live === false, st);
    await E(() => __adv(3600)); const c1 = await E(() => __game.AUDIO._calls.slice()), nts = await E(() => __game.HOME.fx.list.filter((q) => q.type === 'note').length);
    ok('jig: no «та-да» and no notes over his head in the other room', !c1.includes('tada') && nts === 0, [c1, nts]);
    const a2 = await at(); ok('jig: he is not hopping there (stands on the floor)', a2.act !== 'jig' && Math.abs(await E(() => __game.HOME.mk.jy)) < 0.5, a2);
    await shot(page, G + 'jig_left.png');
    await E(() => { __game.HOME.go(-1); __adv(800); }); const a3 = await at();
    ok('jig: back in the zal he does not pick the dance up again', a3.room === 'zal' && a3.act !== 'jig', a3);
    // on the way to the rug: leaving the room cancels the pending dance
    await E(() => { __game.HOME.walkTo(150, 250); __adv(4000); });
    await E(([x, y]) => { __tap(x, y); __adv(200); }, [R[0] + 10, R[1] + R[3] - 8]); const a4 = await at();
    await E(() => { __spy(); __game.HOME.go(1); __adv(4000); }); const a5 = await at(), c5 = await E(() => __game.AUDIO._calls.slice());
    ok('jig: walking to the rug and leaving the room — no dance in the other room', a4.w && a5.room !== 'zal' && a5.act !== 'jig' && !c5.includes('jig'), [a4, a5, c5]);
  } catch (e) { ok('jig: crashed — ' + String(e.message).split('\n')[0], false); } }

  // ---------- #2 Жучок unhooks from the key rack before he brushes Абибян (no stretched chain) ----------
  if (want('zhuk')) { try {
    await clean(); await go('hall');
    const hk = await E(() => __game.ROOMS.spots('hall', {}).zhukHook.slice()), hm = await E(() => [__game.FRIENDS.HOMES.zhuk.x, __game.FRIENDS.HOMES.zhuk.y]);
    await E(() => { __game.HOME.walkTo(50, 262); __adv(3500); });
    const gold = () => E(([hk, hm]) => { const d = document.getElementById('cv').getContext('2d').getImageData(0, 0, 180, 320).data, near = (i, c) => Math.abs(d[i] - c[0]) <= 12 && Math.abs(d[i + 1] - c[1]) <= 12 && Math.abs(d[i + 2] - c[2]) <= 12;
      const z = __game.FRIENDS.drawn.find((q) => q.kind === 'friend' && q.id === 'zhuk'), zb = z ? [z.x0 - 2, z.y0 - 2, z.x0 + z.e.w + 2, z.y0 + z.e.h + 2] : [0, 0, -1, -1]; // his own brown-gold fluff does not count
      const sp = __game.HOME.fx.list.filter((q) => q.type === 'spark').map((q) => [Math.round(q.x), Math.round(q.y)]); // nor the gold sparkles of the brushing
      let out = 0, hook = 0; for (let y = 0; y < 320; y++) for (let x = 0; x < 180; x++) { const i = (y * 180 + x) * 4; if (!near(i, [240, 204, 88]) && !near(i, [168, 132, 32])) continue; if (x >= zb[0] && x <= zb[2] && y >= zb[1] && y <= zb[3]) continue; if (sp.some(([sx, sy]) => Math.abs(x - sx) <= 4 && Math.abs(y - sy) <= 4)) continue; if (x >= hk[0] - 6 && x <= hk[0] + 6 && y >= hk[1] && y <= hm[1] - 8) hook++; else if (!(x >= hk[0] - 12 && x <= hk[0] + 12 && y >= hk[1] - 8 && y <= hm[1] + 4)) out++; }
      return { out, hook }; }, [hk, hm]);
    const g0 = await gold();
    ok('zhuk: setup — on the rack he hangs on his chain (chain from the hook to his head)', g0.hook >= 6 && g0.out <= 6, g0); // a few gold-ish specks elsewhere in the hall
    const r = await E(() => { const s = __game.GAME.S; s.st.clean = 20; s.friends.zhuk.cd = 0; __spy(); return __game.FRIENDS.special('zhuk'); });
    let fur = 0, maxOut = 0, minHook = 99, shotDone = false, far = 0;
    for (let i = 0; i < 160; i++) {
      const f = await E(() => { __adv(100); const f = __game.FRIENDS._F.zhuk; return { x: f.x, y: f.y, onFur: !!f.onFur, path: !!f.path }; });
      const away = Math.hypot(f.x - hm[0], f.y - hm[1]) > 6; if (!away && !f.onFur) { if (fur && !f.path) break; continue; }
      far++; if (f.onFur) fur++; const g = await gold(); maxOut = Math.max(maxOut, g.out); minHook = Math.min(minHook, g.hook);
      if (f.onFur && fur > 12 && !shotDone) { shotDone = true; await shot(page, G + 'zhuk_brush.png'); }
    }
    ok('zhuk: the special ran (he scurried over Абибян\'s fur)', r !== 'cd' && r !== 'full' && r !== 'sulk' && fur >= 10, [r, fur]);
    ok('zhuk: off the rack the chain is never stretched across the room (no chain away from the rack)', far > 0 && maxOut <= g0.out + 2, [maxOut, g0.out, far]);
    ok('zhuk: he unhooked — a short loose piece of chain dangles from the hook while he is away', minHook >= 4 && minHook < 99, minHook);
    await E(() => __adv(1500)); const fb = await E(() => { const f = __game.FRIENDS._F.zhuk; return { x: f.x, y: f.y, path: !!f.path, onFur: !!f.onFur, calls: __game.AUDIO._calls.slice() }; });
    const g1 = await gold();
    ok('zhuk: back on the rack he is hooked on again (chain hook → head)', Math.hypot(fb.x - hm[0], fb.y - hm[1]) <= 1 && !fb.path && !fb.onFur && g1.hook >= 6 && g1.out <= g0.out + 2, [fb.x, fb.y, g1]);
    ok('zhuk: unhook / hook-on jingles (keys sound when he clips back on)', fb.calls.includes('jingle') && fb.calls.includes('keys'), fb.calls);
    await shot(page, G + 'zhuk_back.png');
  } catch (e) { ok('zhuk: crashed — ' + String(e.message).split('\n')[0], false); } }

  await done(errs, browser);
})();
