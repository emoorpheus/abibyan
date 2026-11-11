#!/usr/bin/env python3
"""Round 22 → Round 27: the birthday card for Дашулик — dist/abibyan-card.pdf (2 pages: an A4 sheet 210×297 mm printed on both
sides, the front and the back with the QR code to the game) + dist/abibyan-card.png (both sides side by side, to look at / send in a chat).
Each side is a framed pixel panel 7 mm inside the white paper (a home printer can't print to the edge) holding the Round 22 postcard
layout (105×148 mm) zoomed ×1.87: the words stay vector, the game's pictures are pre-scaled ×16 (≥ 300 dpi, square pixels).

Drawn as HTML in the game's own pixel font (assets/pix*.woff2) with the game's own Абибян (assets/card/*.png ← tools/card_art.js)
and printed by headless Chromium.  usage: python3 tools/card.py [URL]   (default https://emoorpheus.github.io/abibyan/ — Round 24: the repo is «abibyan»)
Print: A4, 100 % scale (no «fit to page»), double-sided, flip on the long edge (portrait) — or print the two pages and glue them back to back.
"""
import os, sys, subprocess, random, html, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = sys.argv[1] if len(sys.argv) > 1 else 'https://emoorpheus.github.io/abibyan/'
DIST = os.path.join(ROOT, 'dist'); WORK = os.path.join(DIST, 'card'); os.makedirs(WORK, exist_ok=True)
try:
    import segno
except ImportError:  # one small pure-python package
    subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'segno'], check=True); import segno
CHROME = shutil.which('chromium') or '/usr/local/bin/chromium'
INK, PINK, PINK2, GOLD = '#3b2433', '#ff7aa8', '#d9558a', '#ffd04a'
ART = os.path.join(ROOT, 'assets', 'card')
if not os.path.exists(os.path.join(ART, 'abibyan_up.png')):
    subprocess.run(['node', os.path.join(ROOT, 'tools', 'card_art.js')], check=True, cwd=ROOT)
furl = lambda p: 'file://' + os.path.abspath(p)
from PIL import Image
def big(name, k=16):  # pre-scaled ×k with hard edges: PDF viewers and printers smooth small images, the pixels must stay square
    o = os.path.join(WORK, name.replace('.png', f'_x{k}.png')); im = Image.open(os.path.join(ART, name)); im.resize((im.width * k, im.height * k), Image.NEAREST).save(o); return o

# the gold number balloons, the same 3×5 digits as in the game (src/dasha.js DIG3), each font pixel = a 3×3 block
DIG3 = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111']
def digit_svg(d, px=1.6):
    g = DIG3[d]; M = lambda x, y: 0 <= x < 9 and 0 <= y < 15 and g[(y // 3) * 3 + x // 3] == '1'; r = []
    for y in range(-1, 16):
        for x in range(-1, 10):
            if not M(x, y) and any(M(x + a, y + b) for a in (-1, 0, 1) for b in (-1, 0, 1)): r.append((x, y, INK))
    gl = False
    for y in range(15):
        for x in range(9):
            if M(x, y):
                top, bot, lf = not M(x, y - 1), not M(x, y + 1), not M(x - 1, y)
                c = '#c98a16' if bot else '#ffe68a' if top else '#ffdf6a' if lf else '#f5c23a'
                if not gl and top and lf: c, gl = '#ffffff', True
                r.append((x, y, c))
    r += [(4, 16, '#c98a16'), (5, 16, '#c98a16'), (4, 17, '#c98a16'), (5, 17, '#c98a16')]
    rects = ''.join(f'<rect x="{x + 1}" y="{y + 1}" width="1.02" height="1.02" fill="{c}"/>' for x, y, c in r)
    return f'<svg class="dg" viewBox="0 0 11 19" width="{11 * px}mm" height="{19 * px}mm" shape-rendering="crispEdges">{rects}</svg>'

HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...']
def heart_svg(mm=6, fill=PINK, hi='#ffd6e4'):
    w, h = len(HEART[0]) + 2, len(HEART) + 2; r = []
    for y in range(-1, h - 1):
        for x in range(-1, w - 1):
            on = lambda a, b: 0 <= b < len(HEART) and 0 <= a < len(HEART[0]) and HEART[b][a] == '#'
            if on(x, y): r.append((x, y, hi if (x, y) in ((1, 1), (2, 1)) else fill))
            elif any(on(x + a, y + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))): r.append((x, y, INK))
    rects = ''.join(f'<rect x="{x + 1}" y="{y + 1}" width="1.02" height="1.02" fill="{c}"/>' for x, y, c in r)
    return f'<svg viewBox="0 0 {w} {h}" width="{mm * w / h}mm" height="{mm}mm" shape-rendering="crispEdges">{rects}</svg>'

def confetti(seed, n, colors):
    rnd = random.Random(seed); out = []
    for _ in range(n):
        x, y, s = rnd.uniform(3, 99), rnd.uniform(3, 143), rnd.choice((1.2, 1.6, 2.0)); c = rnd.choice(colors)
        out.append(f'<i style="left:{x:.1f}mm;top:{y:.1f}mm;width:{s}mm;height:{s}mm;background:{c}"></i>')
    return ''.join(out)

def bunting():
    cols = [PINK, '#7ad0ff', GOLD, '#9ee07a', '#c9a0ff']; fl = []
    for i in range(10):
        x = 2 + i * 10.2; y = 4 + 2.2 * abs((i - 4.5) / 4.5) ** 2 * -1 + 2.2
        fl.append(f'<polygon points="{x},{y} {x + 8},{y} {x + 4},{y + 8}" fill="{cols[i % 5]}" stroke="{INK}" stroke-width=".5"/>')
    return f'<svg class="bunt" viewBox="0 0 105 16" width="105mm" height="16mm"><path d="M0 4.6 Q52.5 9 105 4.6" fill="none" stroke="{INK}" stroke-width=".5"/>{"".join(fl)}</svg>'

# Round 27: the A4 sheet — a panel with pixel-stepped corners on white paper, the postcard layout zoomed into it
M, PW, PH, PX = 7, 210 - 2 * 7, 297 - 2 * 7, 1.2      # the paper margin, the panel, one «pixel» of its ink frame (mm)
Z = PW / 105; OY = (PH - 148 * Z) / 2                 # the 105×148 layout zoomed to the panel's width, centred in its height
def notched(x, y, w, h, n, s):  # the outline of a rectangle with pixel-stepped corners (n steps of s mm), clockwise
    tl = [(0, n * s)] + [p for i in range(1, n + 1) for p in ((i * s, (n - i + 1) * s), (i * s, (n - i) * s))]
    pts = tl + [(w - a, b) for a, b in reversed(tl)] + [(w - a, h - b) for a, b in tl] + [(a, h - b) for a, b in reversed(tl)]
    return [(round(x + a, 3), round(y + b, 3)) for a, b in pts]
NOTCH = ', '.join(f'{a}mm {b}mm' for a, b in notched(0, 0, PW, PH, 2, PX))
ring = lambda pts: 'M' + ' L'.join(f'{a} {b}' for a, b in pts) + ' Z'
FRAME = (f'<svg class="fr" viewBox="0 0 {PW} {PH}" shape-rendering="crispEdges"><path fill="{INK}" fill-rule="evenodd" '
         f'd="{ring(notched(0, 0, PW, PH, 2, PX))} {ring(notched(PX, PX, PW - 2 * PX, PH - 2 * PX, 1, PX))}"/></svg>')

qr = segno.make(URL, error='m')
QR = qr.svg_inline(scale=1, border=4, dark=INK, light='#ffffff', omitsize=True)
link = URL.replace('https://', '').rstrip('/')
CSS = f"""
@font-face{{font-family:Pix;src:url('{furl(os.path.join(ROOT, 'assets', 'pix400.woff2'))}') format('woff2');font-weight:400}}
@font-face{{font-family:Pix;src:url('{furl(os.path.join(ROOT, 'assets', 'pix700.woff2'))}') format('woff2');font-weight:700}}
@page{{size:210mm 297mm;margin:0}}
*{{box-sizing:border-box}} html,body{{margin:0;padding:0}} body{{font-family:Pix,'Trebuchet MS',sans-serif;color:{INK};-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.pg{{position:relative;width:210mm;height:297mm;overflow:hidden;background:#fff;page-break-after:always;break-after:page}}
.pn{{position:absolute;left:{M}mm;top:{M}mm;width:{PW}mm;height:{PH}mm;overflow:hidden;clip-path:polygon({NOTCH})}}
.inw{{position:absolute;left:0;top:{OY:.3f}mm;width:{PW}mm}} .in{{position:relative;width:105mm;height:148mm;zoom:{Z:.5f}}}
.fr{{position:absolute;left:0;top:0;width:{PW}mm;height:{PH}mm}}
.pg:last-child{{page-break-after:auto;break-after:auto}}
.cf i{{position:absolute;display:block}}
.front .pn{{background:linear-gradient(#ffe3ee,#ffc2d8);box-shadow:inset 0 -2.2mm 0 #f7a8c6}}
.bunt{{position:absolute;left:0;top:0}}
.t1,.t2{{position:absolute;left:0;right:0;text-align:center;font-weight:700;color:#fff;
  text-shadow:0 .5mm 0 {INK},.5mm 0 0 {INK},-.5mm 0 0 {INK},0 -.5mm 0 {INK},.5mm .5mm 0 {INK},-.5mm .5mm 0 {INK},.5mm -.5mm 0 {INK},-.5mm -.5mm 0 {INK},0 1.1mm 0 {INK}}}
.t1{{top:17mm;font-size:15mm;line-height:1}} .t2{{top:33mm;font-size:8.6mm;line-height:1}}
.mk{{position:absolute;left:14mm;top:75mm;width:46mm;image-rendering:pixelated}}
.dgs{{position:absolute;left:58mm;top:46mm;display:flex;gap:1mm}} .dgs svg:nth-child(2){{margin-top:3mm}}
.dl{{position:absolute;left:0;top:0;width:105mm;height:148mm}}
.hl{{position:absolute;left:9mm;top:50mm}} .hl2{{position:absolute;left:84mm;top:104mm}}
.rug{{position:absolute;left:11mm;top:121mm;width:52mm;height:7mm;border-radius:50%;background:rgba(59,36,51,.16)}}
.sub{{position:absolute;left:0;right:0;bottom:9mm;text-align:center;font-size:4.6mm;line-height:1.2}}
.back .pn{{background:#fff4e2;box-shadow:inset 0 -2.2mm 0 #e8cba5}}
.bh{{position:absolute;left:0;right:0;top:9mm;text-align:center;font-weight:700;font-size:7mm;line-height:1.05}}
.qr{{position:absolute;left:50%;top:27mm;transform:translateX(-50%);width:47mm;height:47mm;background:#fff;border:.6mm solid {INK}}}
.qr svg{{width:100%;height:100%;display:block}}
.lk{{position:absolute;left:0;right:0;top:76.5mm;text-align:center;font-size:4mm}}
.st{{position:absolute;left:10mm;right:10mm;top:85mm;margin:0;padding:0;list-style:none;font-size:3.9mm;line-height:1.22}}
.st li{{display:flex;gap:2mm;margin-bottom:1.8mm}} .st b{{flex:none;width:5.4mm;height:5.4mm;background:{PINK};color:#fff;border:.45mm solid {INK};display:flex;align-items:center;justify-content:center;font-size:3.6mm}}
.mic{{position:absolute;left:10mm;right:10mm;top:120mm;font-size:3.2mm;line-height:1.2;opacity:.8}}
.sig{{position:absolute;left:10mm;right:10mm;bottom:9mm;font-size:4.2mm;display:flex;align-items:center;gap:2mm;white-space:nowrap}} .sig b{{font-weight:inherit}}
.mkb{{position:absolute;right:6mm;top:6mm;width:17mm;image-rendering:pixelated;transform:scaleX(-1)}}
.side{{display:flex;gap:6mm;padding:6mm;background:#3a2c44;width:max-content}} .side .pg{{box-shadow:0 1.5mm 4mm rgba(0,0,0,.45)}}
"""
FRONT = f"""<section class="pg front"><div class="pn"><div class="inw"><div class="in"><div class="cf">{confetti(24, 70, [PINK, '#7ad0ff', GOLD, '#9ee07a', '#c9a0ff', '#ffffff'])}</div>{bunting()}
<div class="t1" data-k="t1">Дашулик,</div><div class="t2" data-k="t2">с днём рождения!</div>
<div class="hl">{heart_svg(7)}</div><div class="hl2">{heart_svg(5, '#ff5c8a')}</div>
<div class="dgs" data-k="num">{digit_svg(2, 1.5)}{digit_svg(4, 1.5)}</div>
<svg class="dl" viewBox="0 0 105 148"><path d="M66.25 72.8 Q58 84 45.8 91.2 M83.75 75.8 Q66 88 45.8 91.2" fill="none" stroke="#b89a5a" stroke-width=".45"/></svg>
<div class="rug"></div><img class="mk" data-k="hero" src="{furl(big('abibyan_up.png'))}" alt="">
<div class="sub" data-k="sub">Это Абибян. Теперь он живёт у тебя!</div></div></div>{FRAME}</div></section>"""
BACK = f"""<section class="pg back"><div class="pn"><div class="inw"><div class="in"><img class="mkb" data-k="mkb" src="{furl(big('abibyan.png'))}" alt="">
<div class="bh" data-k="bh">Как забрать<br>Абибяна домой</div>
<div class="qr" data-k="qr">{QR}</div><div class="lk" data-k="lk">{html.escape(link)}</div>
<ol class="st" data-k="st"><li><b>1</b><span>Наведи камеру телефона на код и открой ссылку в Safari</span></li>
<li><b>2</b><span>Нажми „Поделиться“, потом „На экран Домой“</span></li>
<li><b>3</b><span>Открой Абибяна с иконки и постучи по коробке</span></li></ol>
<div class="mic" data-k="mic">Свечки на торте задувают по-настоящему — в микрофон. Телефон спросит разрешение — нажми „Разрешить“.</div>
<div class="sig" data-k="sig">С любовью, <b>твой Loveашик</b>{heart_svg(4.5)}</div></div></div>{FRAME}</div></section>"""
doc = lambda body, extra='': f'<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>{CSS}{extra}</style></head><body>{body}</body></html>'
hp, hs = os.path.join(WORK, 'card.html'), os.path.join(WORK, 'card-side.html')
open(hp, 'w', encoding='utf-8').write(doc(FRONT + BACK)); open(hs, 'w', encoding='utf-8').write(doc(f'<div class="side">{FRONT}{BACK}</div>'))
pdf, png = os.path.join(DIST, 'abibyan-card.pdf'), os.path.join(DIST, 'abibyan-card.png')
base = [CHROME, '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--virtual-time-budget=4000', '--run-all-compositor-stages-before-draw']
for f in (pdf, png):
    if os.path.exists(f): os.remove(f)
subprocess.run(base + ['--no-pdf-header-footer', '--print-to-pdf=' + pdf, furl(hp)], check=True, capture_output=True)
W, H = round((210 * 2 + 18) * 96 / 25.4) + 1, round((297 + 12) * 96 / 25.4) + 1
subprocess.run(base + ['--force-device-scale-factor=2', f'--window-size={W},{H}', '--screenshot=' + png, furl(hs)], check=True, capture_output=True)
assert os.path.exists(pdf) and os.path.exists(png), 'chromium made no card'
print('card:', pdf, os.path.getsize(pdf) // 1024, 'KB;', png, os.path.getsize(png) // 1024, 'KB; QR →', URL)
