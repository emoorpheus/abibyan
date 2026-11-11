# Build two static, Cyrillic-fixed subsets of Pixelify Sans (Regular 400 + Bold 700).
# Google Fonts build: К/Ќ swapped, О/П/І missing, Э looks like З, в looks like е, ь/ъ/ы have ascenders.
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools import subset
import os
GLYPHS = {
  0x0423: ['#...#', '#...#', '#...#', '.#.#.', '..#..', '.#...', '#....'],     # У (was Y-like)
  0x0035: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],     # 5 (was S-like)
  0x0414: ['.####.', '.#..#.', '.#..#.', '.#..#.', '.#..#.', '.#..#.', '######', '#....#'],   # Д (was A-like)
  0x0434: ['.####.', '.#..#.', '.#..#.', '.#..#.', '######', '#....#'],                       # д
  0x0426: ['#...#.', '#...#.', '#...#.', '#...#.', '#...#.', '#...#.', '######', '.....#'],   # Ц
  0x0446: ['#...#.', '#...#.', '#...#.', '#...#.', '######', '.....#'],                       # ц
  0x0428: ['#..#..#', '#..#..#', '#..#..#', '#..#..#', '#..#..#', '#..#..#', '#######'],      # Ш (was W-like)
  0x0448: ['#..#..#', '#..#..#', '#..#..#', '#..#..#', '#######'],                            # ш
  0x0429: ['#..#..#.', '#..#..#.', '#..#..#.', '#..#..#.', '#..#..#.', '#..#..#.', '########', '.......#'],  # Щ
  0x0449: ['#..#..#.', '#..#..#.', '#..#..#.', '#..#..#.', '########', '.......#'],                          # щ
  0x0432: ['####.', '#...#', '####.', '#...#', '####.'],                       # в
  0x044C: ['#....', '#....', '####.', '#...#', '####.'],                       # ь
  0x044A: ['##....', '.#....', '.####.', '.#...#', '.####.'],                  # ъ
  0x044B: ['#....#', '#....#', '###..#', '#..#.#', '###..#'],                  # ы
  0x042D: ['.###.', '#...#', '....#', '..###', '....#', '#...#', '.###.'],     # Э
  0x0437: ['.###.', '#...#', '..##.', '#...#', '.###.'],                       # з (notched, unlike э)
  0x044D: ['.###.', '#...#', '..###', '#...#', '.###.'],                       # э
  0x2190: ['..#....', '.#.....', '#######', '.#.....', '..#....'],             # ←
  0x2192: ['....#..', '.....#.', '#######', '.....#.', '....#..'],             # →
  0x2715: ['#...#', '##.##', '.###.', '##.##', '#...#'],                       # ✕
}
TOP = {0x2190: 6, 0x2192: 6, 0x2715: 6, 0x0414: 7, 0x0434: 5, 0x0426: 7, 0x0446: 5, 0x0429: 7, 0x0449: 5}  # rows above baseline for symbols (others: their own height)
W = {400: dict(x0=60, px=93.0, py=91.9, dx=4, dy=4, y0=-12, rsb=61), 700: dict(x0=61, px=96.2, py=92.7, dx=15.5, dy=21, y0=-11, rsb=61)}
def build(wght, out):
    f = instancer.instantiateVariableFont(TTFont('/tmp/pix.ttf'), {'wght': wght})
    for t in list(f.keys()): f[t]
    glyf, hmtx, m = f['glyf'], f['hmtx'], W[wght]
    seen = set()
    for t in f['cmap'].tables:
        if not t.isUnicode() or id(t.cmap) in seen: continue
        seen.add(id(t.cmap))
        a, b = t.cmap.get(0x041A), t.cmap.get(0x040C)
        t.cmap[0x041A], t.cmap[0x040C] = b, a          # К <-> Ќ
        t.cmap[0x041E] = 'O'; t.cmap[0x041F] = 'Pi'; t.cmap[0x0406] = 'I'
    for cp, rows in GLYPHS.items():
        h, w = len(rows), max(len(r) for r in rows)
        top = TOP.get(cp, h)                              # top row index measured in pixels from baseline
        x0, px, py, dx, dy, y0 = m['x0'], m['px'], m['py'], m['dx'], m['dy'], m['y0']
        L, R = x0, x0 + w * px; B, T = y0 + (top - h) * py, y0 + top * py
        pen = TTGlyphPen(None)
        for j, r in enumerate(rows):
            for i, c in enumerate(r):
                if c != '#': continue
                a1 = max(L, x0 + i * px - dx); a2 = min(R, x0 + (i + 1) * px + dx)
                yt = y0 + (top - j) * py; yb = yt - py
                b1 = max(B, yb - dy); b2 = min(T, yt + dy)
                a1, a2, b1, b2 = round(a1), round(a2), round(b1), round(b2)
                pen.moveTo((a1, b1)); pen.lineTo((a1, b2)); pen.lineTo((a2, b2)); pen.lineTo((a2, b1)); pen.closePath()
        g = pen.glyph()
        name = None
        for t in f['cmap'].tables:
            if t.isUnicode() and cp in t.cmap: name = t.cmap[cp]
        if name is None:
            name = 'px%04X' % cp; order = f.getGlyphOrder(); order.append(name); f.setGlyphOrder(order)
            for t in f['cmap'].tables:
                if t.isUnicode(): t.cmap[cp] = name
        g.flags[0] |= 0x40                                # OVERLAP_SIMPLE
        glyf.glyphs[name] = g; g.recalcBounds(glyf)
        hmtx.metrics[name] = (round(x0 + w * px + m['rsb']), x0)
    uni = list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + list(range(0x400, 0x460)) + [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x201E, 0x2026, 0x2116, 0x2190, 0x2192, 0x2212, 0x2715]
    tmp = '/tmp/pix_%d.ttf' % wght; f.save(tmp)
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']; opts.notdef_outline = True
    ff = subset.load_font(tmp, opts); s = subset.Subsetter(opts); s.populate(unicodes=uni); s.subset(ff)
    subset.save_font(ff, out, opts); print(out, os.path.getsize(out))
build(400, '/data/game/assets/pix400.woff2')
build(700, '/data/game/assets/pix700.woff2')
