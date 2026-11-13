// Round 27 → Round 34 «Открытка на A4 книжкой»: node test/r27.js [build,qr,text,layout,docs,look] → exit 1 on fail.
// Birthday booklet card (tools/card.py): an A4 landscape sheet (297×210 mm) printed on both sides (flip on short edge)
// folded in half into an A5 booklet (148.5×210 mm).
// Page 1 (outer): Back cover on left (QR, instructions, microphone, signature), Front cover on right («Дашулик, с днём рождения!», «24», Абибян).
// Page 2 (inner): Party illustration on left (Абибян, Пуся, Монти, Жук, Москит and cake), Handwritten letter area on right («Дорогая Дашулик! ❤️»).
// Home printer margin ≥ 6 mm safe inside; pixel art pre-scaled ×16 (≥ 300 dpi, pixelated); QR opens game from print (pdftoppm, 150 dpi).
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const { ok, done, want, fs, SITE_URL } = require('./lib/h.js');
const path = require('path'), { spawnSync } = require('child_process');
const W = want(), ROOT = path.join(__dirname, '..'), DIST = path.join(ROOT, 'dist'), CARD = path.join(DIST, 'card'), LOOK = path.join(ROOT, 'test', 'look');
const PDF = path.join(DIST, 'abibyan-card.pdf'), PNG = path.join(DIST, 'abibyan-card.png');
const SAFE = 6, MM = 96 / 25.4;
const TEXT_K = ['t1', 't2', 'sub', 'bh', 'lk', 'st', 'mic', 'sig', 'pth1', 'pth2', 'ptsub', 'lt1', 'lt2', 'ltfoot'];
const KEYS = [
  ['t1', 't2', 'num', 'hero', 'sub', 'bh', 'mkb', 'qr', 'lk', 'st', 'mic', 'sig'],
  ['pth1', 'pth2', 'abibyan_party', 'cake', 'ptsub', 'lt1', 'lt2', 'ltlines', 'ltfoot']
];
const LINK = SITE_URL.replace('https://', '').replace(/\/$/, '');
const errs = []; let browser = null;
const launch = () => chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const qr = (png) => spawnSync('python3', ['-c', `import cv2; im = cv2.imread('${png}'); print(cv2.QRCodeDetector().detectAndDecode(im)[0])`], { encoding: 'utf8' });
const pdftext = (n) => spawnSync('pdftotext', ['-layout', '-f', String(n), '-l', String(n), PDF, '-'], { encoding: 'utf8' }).stdout || '';
const flat = (t) => t.replace(/\s+/g, ' '), r1 = (v) => Math.round(v * 10) / 10;

(async () => {
  try {
    const r = spawnSync('python3', [path.join(ROOT, 'tools', 'card.py')], { encoding: 'utf8' });
    ok('build: tools/card.py makes dist/abibyan-card.pdf + .png', r.status === 0 && fs.existsSync(PDF) && fs.existsSync(PNG), (r.stderr || '').slice(-400));
    // ================= 1. the paper =================
    if (W('build')) {
      const info = spawnSync('pdfinfo', ['-f', '1', '-l', '9', PDF], { encoding: 'utf8' }).stdout || '';
      const pages = +((info.match(/Pages:\s+(\d+)/) || [])[1] || 0);
      const sz = [...info.matchAll(/Page\s+\d+ size:\s+([\d.]+) x ([\d.]+) pts/g)].map((m) => [+m[1], +m[2]]);
      ok(`build: 2 pages, both A4 landscape (${sz.map((s) => s.join(' × ')).join('; ')} pt; A4 = 841.9 × 595.3)`, pages === 2 && sz.length === 2 && sz.every(([w, h]) => Math.abs(w - 841.89) < 1.5 && Math.abs(h - 595.28) < 1.5), info.slice(0, 400));
    }
    // ================= 2. the QR code opens the game — on the screen and «on paper» =================
    if (W('qr')) {
      const q1 = qr(PNG);
      ok(`qr: the preview picture (both sides) opens ${q1.stdout.trim()}`, q1.stdout.trim() === SITE_URL, q1.stderr.slice(-200));
      const base = '/tmp/r27_outer'; try { fs.unlinkSync(base + '.png'); } catch (e) { }
      const p = spawnSync('pdftoppm', ['-f', '1', '-l', '1', '-r', '150', '-png', '-singlefile', PDF, base], { encoding: 'utf8' });
      const q2 = qr(base + '.png');
      ok(`qr: the back «printed» at 150 dpi (pdftoppm) opens ${q2.stdout.trim()}`, p.status === 0 && q2.stdout.trim() === SITE_URL, (p.stderr || '') + q2.stderr.slice(-200));
    }
    // ================= 3. the words (the PDF's own text) =================
    if (W('text')) {
      const outer = pdftext(1), inner = pdftext(2);
      ok('text: front cover — «С днём рождения!», «Дашуля», «Абибян»', ['днём', 'рождения!'].every((w) => outer.includes(w)) && outer.includes('Дашуля') && flat(outer).includes('твой личный плюшевый Абибян'), outer.slice(0, 300));
      const steps = ['Наведи камеру', 'На экран Домой', 'постучи по коробке', 'Разрешить'];
      ok(`text: back cover — «Как оживить Абибяна», ${LINK}, the 3 steps, the microphone`, flat(outer).includes('Как оживить') && flat(outer).includes('Абибяна') && outer.includes(LINK) && steps.every((s) => flat(outer).includes(s)), outer.slice(0, 400));
      const line = (outer.split('\n').find((l) => /С любовью/.test(l)) || '').trim();
      ok(`text: signed on one line — «${line}»`, /С любовью,\s+твой Loveашик/.test(line), outer.slice(-200));
      ok('text: inner spread — «Самый тёплый день», letter «Дорогая Дашуля!», no friend spoilers', flat(inner).includes('Самый тёплый день') && flat(inner).includes('Дорогая Дашуля!') && !flat(inner).includes('Пуся') && !flat(inner).includes('Монти') && !flat(inner).includes('Москит'), inner.slice(0, 400));
    }
    // ================= 4. the layout: the paper's edge, overlaps, the font, the pixels =================
    browser = await launch();
    if (W('layout') || W('look')) {
      const page = await browser.newPage({ viewport: { width: 1160, height: 820 } });
      page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('requestfailed', (q) => errs.push('requestfailed: ' + q.url().slice(-90)));
      await page.emulateMedia({ media: 'print' });
      await page.goto('file://' + path.join(CARD, 'card.html'), { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready);
      const L = await page.evaluate((MM) => {
        const rel = (b, P) => ({ l: (b.left - P.left) / MM, t: (b.top - P.top) / MM, r: (b.right - P.left) / MM, b: (b.bottom - P.top) / MM });
        const ink = (e) => {
          const b = e.getBoundingClientRect(); if (e.tagName === 'IMG' || !e.innerText.trim()) return [b];
          const rg = document.createRange(); rg.selectNodeContents(e);
          return [...rg.getClientRects()].filter((q) => q.width > 0.5 && q.height > 0.5).map((q) => ({ left: q.left, right: q.right, top: Math.max(q.top, b.top), bottom: Math.min(q.bottom, b.bottom) }));
        };
        const lines = (rs) => { const out = []; for (const q of rs.slice().sort((a, b) => a.top - b.top)) { const o = out.find((g) => Math.min(g.bottom, q.bottom) - Math.max(g.top, q.top) > 0.5 * Math.min(g.bottom - g.top, q.bottom - q.top)); if (o) { o.top = Math.min(o.top, q.top); o.bottom = Math.max(o.bottom, q.bottom); } else out.push({ top: q.top, bottom: q.bottom }); } return out.length; };
        return [...document.querySelectorAll('.pg')].map((pg) => {
          const P = pg.getBoundingClientRect(), pns = [...pg.querySelectorAll('.pn')], K = {};
          for (const e of pg.querySelectorAll('[data-k]')) {
            const rs = ink(e); if (!rs.length) continue;
            const u = rs.reduce((a, q) => ({ left: Math.min(a.left, q.left), top: Math.min(a.top, q.top), right: Math.max(a.right, q.right), bottom: Math.max(a.bottom, q.bottom) }), { left: 1e9, top: 1e9, right: -1e9, bottom: -1e9 });
            K[e.dataset.k] = Object.assign(rel(u, P), { lines: e.tagName === 'IMG' ? 0 : lines(rs), font: getComputedStyle(e).fontFamily });
          }
          const imgs = [...pg.querySelectorAll('img')].map((i) => { const b = i.getBoundingClientRect(); return { src: decodeURIComponent(i.src.split('/').pop()), dpi: Math.round(i.naturalWidth / (b.width / 96)), px: getComputedStyle(i).imageRendering, ok: i.complete && i.naturalWidth > 0 }; });
          return { cls: pg.className, w: P.width / MM, h: P.height / MM, pns: pns.map((p) => rel(p.getBoundingClientRect(), P)), K, imgs };
        });
      }, MM);
      const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.family.replace(/["']/g, '') === 'Pix').map((f) => f.weight + ':' + f.status));
      if (W('layout')) {
        ok(`layout: 2 spreads of 297 × 210 mm — outer, then inner (${L.map((p) => `${p.cls}: ${r1(p.w)} × ${r1(p.h)}`).join('; ')})`, L.length === 2 && L.every((p) => Math.abs(p.w - 297) < 0.6 && Math.abs(p.h - 210) < 0.6) && /outer/.test(L[0].cls) && /inner/.test(L[1].cls), L.map((p) => p.cls));
        const okPns = L.every((p) => p.pns.length === 2 && p.pns.every((pn) => pn.t >= 5 && pn.b <= 205 && (pn.l >= 5 || pn.l >= 148)));
        ok('layout: each spread has two framed panels with safe margins (left and right)', okPns, L.map((p) => p.pns));
        const miss = L.map((p, i) => (KEYS[i] || []).filter((k) => !p.K[k]));
        ok(`layout: outer has cover + back elements; inner has party + letter elements (missing: ${JSON.stringify(miss)})`, L.length === 2 && miss.every((m) => !m.length), miss);
        const edge = []; L.forEach((p, i) => { for (const [k, b] of Object.entries(p.K)) if (b.l < SAFE || b.t < SAFE || b.r > p.w - SAFE || b.b > p.h - SAFE) edge.push(`${i ? 'inner' : 'outer'}.${k} ${[b.l, b.t, p.w - b.r, p.h - b.b].map(r1).join('/')}`); });
        ok(`layout: nothing that matters is closer than ${SAFE} mm to the paper's edge (${edge.join('; ') || 'all inside'})`, !edge.length, edge);
        const over = []; L.forEach((p, i) => { const ks = Object.keys(p.K); for (let a = 0; a < ks.length; a++) for (let c = a + 1; c < ks.length; c++) { if (!TEXT_K.includes(ks[a]) && !TEXT_K.includes(ks[c])) continue; const A = p.K[ks[a]], B = p.K[ks[c]], w = Math.min(A.r, B.r) - Math.max(A.l, B.l), h = Math.min(A.b, B.b) - Math.max(A.t, B.t); if (w > 0.5 && h > 0.5) over.push(`${i ? 'inner' : 'outer'}: ${ks[a]} × ${ks[c]} ${r1(w)}×${r1(h)} mm`); } });
        ok(`layout: no words overlap anything (${over.join('; ') || 'clean'})`, !over.length, over);
        const one = ['t1', 't2', 'lk', 'pth1', 'lt1'].map((k) => { const p = L.find((q) => q.K[k]); return [k, p ? p.K[k].lines : -1]; });
        ok(`layout: single line titles (${one.map((x) => x.join(': ')).join(', ')})`, one.every(([, n]) => n === 1), one);
        const allowedFonts = /Pix|Comfortaa|Caveat|Nunito|sans-serif|cursive/;
        const nf = []; L.forEach((p) => { for (const k of TEXT_K) if (p.K[k] && !allowedFonts.test(p.K[k].font)) nf.push(k + ': ' + p.K[k].font); });
        ok('layout: typography uses elegant card fonts (Comfortaa, Caveat, Nunito, Pix)', !nf.length, nf);
        const im = L.flatMap((p) => p.imgs), bad = im.filter((i) => !i.ok || i.dpi < 300 || i.px !== 'pixelated');
        ok(`layout: all pictures print at ≥ 300 dpi with square pixels (${im.length} images: ${im.map((i) => `${i.src} ${i.dpi} dpi`).join('; ')})`, im.length >= 3 && !bad.length, bad);
        const q = L[0] && L[0].K.qr, qw = q ? r1(q.r - q.l) : 0;
        ok(`layout: the QR code is ≥ 48 mm on paper (${qw} mm)`, qw >= 48, q);
      }
      if (W('look')) {
        const pgs = await page.$$('.pg');
        if (pgs[0]) await pgs[0].screenshot({ path: path.join(LOOK, 'r27_outer.png') });
        if (pgs[1]) await pgs[1].screenshot({ path: path.join(LOOK, 'r27_inner.png') });
        ok('look: test/look/r27_outer.png, r27_inner.png', fs.existsSync(path.join(LOOK, 'r27_outer.png')) && fs.existsSync(path.join(LOOK, 'r27_inner.png')));
      }
      await page.close();
    }
    // ================= 5. how to print it =================
    if (W('docs')) {
      const rm = fs.readFileSync(path.join(ROOT, 'docs', 'ROADMAP.md'), 'utf8'), m = rm.match(/\n5\. \*\*Открытка[\s\S]*?(?=\n\d\. )/), item = m ? flat(m[0]) : '';
      const cp = fs.readFileSync(path.join(ROOT, 'tools', 'card.py'), 'utf8').slice(0, 1400);
      ok(`docs: ROADMAP and tools/card.py — A4, 100 %, both sides, flip on short edge («${item.slice(0, 160)}»)`, /A4/.test(item) && /100\s?%/.test(item) && /двусторон/.test(item) && /коротк/.test(item) && /A4/.test(cp) && /short edge/.test(cp), item);
    }
  } catch (e) { ok('crashed: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | '), false); }
  if (!browser) browser = await launch();
  await done(errs, browser);
})();
