// Round 27 «Открытка на A4»: node test/r27.js [build,qr,text,layout,docs,look] → exit 1 on fail.
// The birthday card (tools/card.py) becomes an A4 sheet printed on both sides (portrait, flip on the long edge) instead of the A6
// postcard: the front — «Дашулик, с днём рождения!», Абибян with the gold «24» balloons; the back — how to take him home: the QR code,
// 3 steps, the microphone, «С любовью, твой Loveашик». A home printer leaves 3–5 mm at the paper's edge unprinted, so each side is a
// framed panel on white paper and everything that matters stays ≥ 8 mm inside; the game's pixel art prints at ≥ 300 dpi with square
// pixels (pre-scaled ×k nearest + image-rendering: pixelated); the QR still opens the game from a «printed» page (pdftoppm, 150 dpi).
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
const { ok, done, want, fs, SITE_URL } = require('./lib/h.js');
const path = require('path'), { spawnSync } = require('child_process');
const W = want(), ROOT = path.join(__dirname, '..'), DIST = path.join(ROOT, 'dist'), CARD = path.join(DIST, 'card'), LOOK = path.join(ROOT, 'test', 'look');
const PDF = path.join(DIST, 'abibyan-card.pdf'), PNG = path.join(DIST, 'abibyan-card.png');
const SAFE = 8, MM = 96 / 25.4; // mm from the paper's edge a home printer may leave blank (+ a bit); CSS px per mm
const TEXT_K = ['t1', 't2', 'sub', 'bh', 'lk', 'st', 'mic', 'sig'], KEYS = [['t1', 't2', 'num', 'hero', 'sub'], ['bh', 'mkb', 'qr', 'lk', 'st', 'mic', 'sig']];
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
      ok(`build: 2 pages, both A4 portrait (${sz.map((s) => s.join(' × ')).join('; ')} pt; A4 = 595.3 × 841.9)`, pages === 2 && sz.length === 2 && sz.every(([w, h]) => Math.abs(w - 595.28) < 1.5 && Math.abs(h - 841.89) < 1.5), info.slice(0, 400));
    }
    // ================= 2. the QR code opens the game — on the screen and «on paper» =================
    if (W('qr')) {
      const q1 = qr(PNG);
      ok(`qr: the preview picture (both sides) opens ${q1.stdout.trim()}`, q1.stdout.trim() === SITE_URL, q1.stderr.slice(-200));
      const base = '/tmp/r27_back'; try { fs.unlinkSync(base + '.png'); } catch (e) { }
      const p = spawnSync('pdftoppm', ['-f', '2', '-l', '2', '-r', '150', '-png', '-singlefile', PDF, base], { encoding: 'utf8' });
      const q2 = qr(base + '.png');
      ok(`qr: the back «printed» at 150 dpi (pdftoppm) opens ${q2.stdout.trim()}`, p.status === 0 && q2.stdout.trim() === SITE_URL, (p.stderr || '') + q2.stderr.slice(-200));
    }
    // ================= 3. the words (the PDF's own text) =================
    if (W('text')) {
      const f = pdftext(1), b = pdftext(2);
      // the white words have an ink outline + a drop shadow (text-shadow): Chrome puts those copies into the PDF's text layer too, so pdftotext may print a word twice
      ok('text: the front — «Дашулик, с днём рождения!» and «Это Абибян. Теперь он живёт у тебя!»', ['Дашулик,', 'днём', 'рождения!'].every((w) => f.includes(w)) && flat(f).includes('Это Абибян. Теперь он живёт у тебя!'), f.slice(0, 300));
      const steps = ['Наведи камеру', 'На экран Домой', 'постучи по коробке', 'Разрешить'];
      ok(`text: the back — «Как забрать Абибяна домой», ${LINK}, the 3 steps, the microphone`, flat(b).includes('Как забрать') && flat(b).includes('Абибяна домой') && b.includes(LINK) && steps.every((s) => flat(b).includes(s)), b.slice(0, 400));
      const line = (b.split('\n').find((l) => /С любовью/.test(l)) || '').trim();
      ok(`text: signed on one line — «${line}»`, /С любовью,\s+твой Loveашик/.test(line), b.slice(-200));
    }
    // ================= 4. the layout: the paper's edge, overlaps, the font, the pixels =================
    browser = await launch();
    if (W('layout') || W('look')) {
      const page = await browser.newPage({ viewport: { width: 820, height: 1160 } });
      page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('requestfailed', (q) => errs.push('requestfailed: ' + q.url().slice(-90)));
      await page.emulateMedia({ media: 'print' });
      await page.goto('file://' + path.join(CARD, 'card.html'), { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready);
      const L = await page.evaluate((MM) => {
        const rel = (b, P) => ({ l: (b.left - P.left) / MM, t: (b.top - P.top) / MM, r: (b.right - P.left) / MM, b: (b.bottom - P.top) / MM });
        const ink = (e) => { // where the words are: across — the words themselves (a full-width block is wider than its words), down — the
          // block's own lines (a font's box is taller than line-height: 1); a picture — its whole box
          const b = e.getBoundingClientRect(); if (e.tagName === 'IMG' || !e.innerText.trim()) return [b];
          const rg = document.createRange(); rg.selectNodeContents(e);
          return [...rg.getClientRects()].filter((q) => q.width > 0.5 && q.height > 0.5).map((q) => ({ left: q.left, right: q.right, top: Math.max(q.top, b.top), bottom: Math.min(q.bottom, b.bottom) }));
        };
        const lines = (rs) => { const out = []; for (const q of rs.slice().sort((a, b) => a.top - b.top)) { const o = out.find((g) => Math.min(g.bottom, q.bottom) - Math.max(g.top, q.top) > 0.5 * Math.min(g.bottom - g.top, q.bottom - q.top)); if (o) { o.top = Math.min(o.top, q.top); o.bottom = Math.max(o.bottom, q.bottom); } else out.push({ top: q.top, bottom: q.bottom }); } return out.length; };
        return [...document.querySelectorAll('.pg')].map((pg) => {
          const P = pg.getBoundingClientRect(), pn = pg.querySelector('.pn'), K = {};
          for (const e of pg.querySelectorAll('[data-k]')) {
            const rs = ink(e); if (!rs.length) continue;
            const u = rs.reduce((a, q) => ({ left: Math.min(a.left, q.left), top: Math.min(a.top, q.top), right: Math.max(a.right, q.right), bottom: Math.max(a.bottom, q.bottom) }), { left: 1e9, top: 1e9, right: -1e9, bottom: -1e9 });
            K[e.dataset.k] = Object.assign(rel(u, P), { lines: e.tagName === 'IMG' ? 0 : lines(rs), font: getComputedStyle(e).fontFamily });
          }
          const imgs = [...pg.querySelectorAll('img')].map((i) => { const b = i.getBoundingClientRect(); return { src: decodeURIComponent(i.src.split('/').pop()), dpi: Math.round(i.naturalWidth / (b.width / 96)), px: getComputedStyle(i).imageRendering, ok: i.complete && i.naturalWidth > 0 }; });
          return { cls: pg.className, w: P.width / MM, h: P.height / MM, pn: pn ? rel(pn.getBoundingClientRect(), P) : null, K, imgs };
        });
      }, MM);
      const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.family.replace(/["']/g, '') === 'Pix').map((f) => f.weight + ':' + f.status));
      if (W('layout')) {
        ok(`layout: 2 sides of 210 × 297 mm — the front, then the back (${L.map((p) => `${p.cls}: ${r1(p.w)} × ${r1(p.h)}`).join('; ')})`, L.length === 2 && L.every((p) => Math.abs(p.w - 210) < 0.6 && Math.abs(p.h - 297) < 0.6) && /front/.test(L[0].cls) && /back/.test(L[1].cls), L.map((p) => p.cls));
        const ins = L.map((p) => (p.pn ? [p.pn.l, p.pn.t, p.w - p.pn.r, p.h - p.pn.b].map(r1) : null));
        ok(`layout: each side is a framed panel on white paper, 5–10 mm from the edge (insets ${JSON.stringify(ins)})`, ins.length === 2 && ins.every((a) => a && a.every((v) => v >= 5 && v <= 10)), ins);
        const miss = L.map((p, i) => (KEYS[i] || []).filter((k) => !p.K[k]));
        ok(`layout: the front has the title, «24», Абибян, the line under him; the back — the heading, Абибян, the QR, the link, the steps, the microphone, the signature (missing: ${JSON.stringify(miss)})`, L.length === 2 && miss.every((m) => !m.length), miss);
        const edge = []; L.forEach((p, i) => { for (const [k, b] of Object.entries(p.K)) if (b.l < SAFE || b.t < SAFE || b.r > p.w - SAFE || b.b > p.h - SAFE) edge.push(`${i ? 'back' : 'front'}.${k} ${[b.l, b.t, p.w - b.r, p.h - b.b].map(r1).join('/')}`); });
        ok(`layout: nothing that matters is closer than ${SAFE} mm to the paper's edge (${edge.join('; ') || 'all inside'})`, !edge.length, edge);
        const over = []; L.forEach((p, i) => { const ks = Object.keys(p.K); for (let a = 0; a < ks.length; a++) for (let c = a + 1; c < ks.length; c++) { if (!TEXT_K.includes(ks[a]) && !TEXT_K.includes(ks[c])) continue; const A = p.K[ks[a]], B = p.K[ks[c]], w = Math.min(A.r, B.r) - Math.max(A.l, B.l), h = Math.min(A.b, B.b) - Math.max(A.t, B.t); if (w > 0.5 && h > 0.5) over.push(`${i ? 'back' : 'front'}: ${ks[a]} × ${ks[c]} ${r1(w)}×${r1(h)} mm`); } });
        ok(`layout: no words overlap anything (${over.join('; ') || 'clean'})`, !over.length, over);
        const one = ['t1', 't2', 'lk'].map((k) => { const p = L.find((q) => q.K[k]); return [k, p ? p.K[k].lines : -1]; });
        ok(`layout: one line each — «Дашулик,», «с днём рождения!», the link (${one.map((x) => x.join(': ')).join(', ')})`, one.every(([, n]) => n === 1), one);
        const nf = []; L.forEach((p) => { for (const k of TEXT_K) if (p.K[k] && !/^"?Pix/.test(p.K[k].font)) nf.push(k + ': ' + p.K[k].font); });
        ok(`layout: every word in the game's pixel font (Pix ${fonts.join(', ')})`, fonts.includes('400:loaded') && fonts.includes('700:loaded') && !nf.length, nf);
        const im = L.flatMap((p) => p.imgs), bad = im.filter((i) => !i.ok || i.dpi < 300 || i.px !== 'pixelated');
        ok(`layout: the game's pictures print at ≥ 300 dpi with square pixels (${im.map((i) => `${i.src} ${i.dpi} dpi ${i.px}`).join('; ')})`, im.length >= 2 && !bad.length, bad);
        const q = L[1] && L[1].K.qr, qw = q ? r1(q.r - q.l) : 0;
        ok(`layout: the QR code is ≥ 60 mm on paper (${qw} mm)`, qw >= 60, q);
      }
      if (W('look')) {
        const pgs = await page.$$('.pg'); for (const [i, n] of [[0, 'front'], [1, 'back']]) if (pgs[i]) await pgs[i].screenshot({ path: path.join(LOOK, `r27_${n}.png`) });
        ok('look: test/look/r27_front.png, r27_back.png', fs.existsSync(path.join(LOOK, 'r27_front.png')) && fs.existsSync(path.join(LOOK, 'r27_back.png')));
      }
      await page.close();
    }
    // ================= 5. how to print it =================
    if (W('docs')) {
      const rm = fs.readFileSync(path.join(ROOT, 'docs', 'ROADMAP.md'), 'utf8'), m = rm.match(/\n5\. \*\*Открытка[\s\S]*?(?=\n\d\. )/), item = m ? flat(m[0]) : '';
      const cp = fs.readFileSync(path.join(ROOT, 'tools', 'card.py'), 'utf8').slice(0, 1400);
      ok(`docs: ROADMAP and tools/card.py — A4, 100 %, both sides, flip on the long edge («${item.slice(0, 160)}»)`, /A4/.test(item) && /100\s?%/.test(item) && /двусторон/.test(item) && /длинн/.test(item) && /A4/.test(cp) && /long edge/.test(cp) && !/A6/.test(cp), item);
    }
  } catch (e) { ok('crashed: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | '), false); }
  if (!browser) browser = await launch();
  await done(errs, browser);
})();
