#!/usr/bin/env python3
"""Round 22 → Round 34: Birthday booklet card for Дашулик — dist/abibyan-card.pdf + dist/abibyan-card.png.
Variant 1 (A4 sheet folded in half into an A5 booklet):
- Sheet size: A4 landscape 297×210 mm.
- Printed double-sided (flip on short edge / переворот по короткому краю).
- Page 1 (Outer spread):
    Left (148.5×210 mm): Back cover (QR-code, instructions, mic reminder, signature «С любовью, твой Loveашик ❤️»).
    Right (148.5×210 mm): Front cover («Дашулик, с днём рождения! 24», jumping Абибян, balloons, confetti).
- Page 2 (Inner spread):
    Left (148.5×210 mm): Festive party pixel-art illustration (Абибян, Пуся, Монти, Жук, Москит and cake).
    Right (148.5×210 mm): Decorative lined panel for Vyacheslav's handwritten letter («Дорогая Дашулик! ❤️»).
- Fold guide tick marks along the center line at 148.5 mm.
All pixel art pre-scaled ×16 nearest for crisp 300+ dpi printing.
"""
import os, sys, subprocess, random, html, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = sys.argv[1] if len(sys.argv) > 1 else 'https://emoorpheus.github.io/abibyan/'
DIST = os.path.join(ROOT, 'dist'); WORK = os.path.join(DIST, 'card'); os.makedirs(WORK, exist_ok=True)
try:
    import segno
except ImportError:
    subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'segno'], check=True); import segno
CHROME = shutil.which('chromium') or '/usr/local/bin/chromium'
INK, PINK, PINK2, GOLD = '#3b2433', '#ff7aa8', '#d9558a', '#ffd04a'
ART = os.path.join(ROOT, 'assets', 'card')
if not os.path.exists(os.path.join(ART, 'pusya.png')) or not os.path.exists(os.path.join(ART, 'abibyan_up.png')):
    subprocess.run(['node', os.path.join(ROOT, 'tools', 'card_art.js')], check=True, cwd=ROOT)
furl = lambda p: 'file://' + os.path.abspath(p)
from PIL import Image
def big(name, k=16):
    o = os.path.join(WORK, name.replace('.png', f'_x{k}.png'))
    src = os.path.join(ART, name)
    if not os.path.exists(src):
        subprocess.run(['node', os.path.join(ROOT, 'tools', 'card_art.js')], check=True, cwd=ROOT)
    im = Image.open(src)
    im.resize((im.width * k, im.height * k), Image.NEAREST).save(o)
    return o

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

def confetti(seed, n, colors, xmax=100, ymax=145):
    rnd = random.Random(seed); out = []
    for _ in range(n):
        x, y, s = rnd.uniform(3, xmax), rnd.uniform(3, ymax), rnd.choice((1.2, 1.6, 2.0)); c = rnd.choice(colors)
        out.append(f'<i style="left:{x:.1f}mm;top:{y:.1f}mm;width:{s}mm;height:{s}mm;background:{c}"></i>')
    return ''.join(out)

def bunting(w=105):
    cols = [PINK, '#7ad0ff', GOLD, '#9ee07a', '#c9a0ff']; fl = []
    n = max(8, int(w / 10.5))
    step = (w - 3) / n
    for i in range(n):
        x = 2 + i * step; y = 4 + 2.2 * abs((i - (n - 1) / 2) / ((n - 1) / 2)) ** 2 * -1 + 2.2
        fl.append(f'<polygon points="{x:.1f},{y:.1f} {x + step * 0.8:.1f},{y:.1f} {x + step * 0.4:.1f},{y + 8:.1f}" fill="{cols[i % 5]}" stroke="{INK}" stroke-width=".5"/>')
    return f'<svg class="bunt" viewBox="0 0 {w} 16" width="{w}mm" height="16mm"><path d="M0 4.6 Q{w / 2} 9 {w} 4.6" fill="none" stroke="{INK}" stroke-width=".5"/>{"".join(fl)}</svg>'

# Variant 1: A4 landscape sheet (297×210 mm) folded in half to A5 (148.5×210 mm)
SHEET_W, SHEET_H = 297, 210
HALF_W = SHEET_W / 2          # 148.5 mm
M = 6.5                        # margin from edges and fold (mm)
PW = HALF_W - 2 * M            # 135.5 mm panel width
PH = SHEET_H - 2 * M           # 197.0 mm panel height
PX = 1.1                       # ink pixel notch size

Z = PW / 105                   # zoom factor from the 105x148 layout: 1.29048
OY = (PH - 148 * Z) / 2        # vertical centering offset: ~3.0 mm

def notched(x, y, w, h, n, s):
    tl = [(0, n * s)] + [p for i in range(1, n + 1) for p in ((i * s, (n - i + 1) * s), (i * s, (n - i) * s))]
    pts = tl + [(w - a, b) for a, b in reversed(tl)] + [(w - a, h - b) for a, b in tl] + [(a, h - b) for a, b in reversed(tl)]
    return [(round(x + a, 3), round(y + b, 3)) for a, b in pts]

ring = lambda pts: 'M' + ' L'.join(f'{a} {b}' for a, b in pts) + ' Z'
FRAME = (f'<svg class="fr" viewBox="0 0 {PW} {PH}" shape-rendering="crispEdges"><path fill="{INK}" fill-rule="evenodd" '
         f'd="{ring(notched(0, 0, PW, PH, 2, PX))} {ring(notched(PX, PX, PW - 2 * PX, PH - 2 * PX, 1, PX))}"/></svg>')
NOTCH_INNER = ', '.join(f'{a}mm {b}mm' for a, b in notched(0, 0, PW, PH, 2, PX))

qr = segno.make(URL, error='m')
QR = qr.svg_inline(scale=1, border=4, dark=INK, light='#ffffff', omitsize=True)
link = URL.replace('https://', '').rstrip('/')

CSS = f"""
@font-face{{font-family:Pix;src:url('{furl(os.path.join(ROOT, 'assets', 'pix400.woff2'))}') format('woff2');font-weight:400}}
@font-face{{font-family:Pix;src:url('{furl(os.path.join(ROOT, 'assets', 'pix700.woff2'))}') format('woff2');font-weight:700}}
@page{{size:297mm 210mm;margin:0}}
*{{box-sizing:border-box}} html,body{{margin:0;padding:0}} body{{font-family:Pix,'Trebuchet MS',sans-serif;color:{INK};-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.pg{{position:relative;width:297mm;height:210mm;overflow:hidden;background:#fff;page-break-after:always;break-after:page}}
.pg:last-child{{page-break-after:auto;break-after:auto}}

/* Fold tick marks */
.tick{{position:absolute;left:148.35mm;width:0.3mm;background:#caa4b4;z-index:90}}
.tick.t-top{{top:0;height:4.5mm}} .tick.t-bot{{bottom:0;height:4.5mm}}

/* The two panels per spread */
.pn{{position:absolute;top:{M}mm;width:{PW}mm;height:{PH}mm;overflow:hidden;clip-path:polygon({NOTCH_INNER})}}
.pn-left{{left:{M}mm}}
.pn-right{{left:{HALF_W + M}mm}}
.fr{{position:absolute;left:0;top:0;width:{PW}mm;height:{PH}mm;pointer-events:none}}
.inw{{position:absolute;left:0;top:{OY:.3f}mm;width:{PW}mm}}
.in{{position:relative;width:105mm;height:148mm;zoom:{Z:.5f}}}
.cf i{{position:absolute;display:block}}

/* Outer Spread: Front (Right) & Back (Left) */
.pn-front{{background:linear-gradient(#ffe3ee,#ffc2d8);box-shadow:inset 0 -2.2mm 0 #f7a8c6}}
.pn-back{{background:#fff4e2;box-shadow:inset 0 -2.2mm 0 #e8cba5}}

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

.bh{{position:absolute;left:0;right:0;top:9mm;text-align:center;font-weight:700;font-size:7mm;line-height:1.05}}
.qr{{position:absolute;left:50%;top:27mm;transform:translateX(-50%);width:47mm;height:47mm;background:#fff;border:.6mm solid {INK}}}
.qr svg{{width:100%;height:100%;display:block}}
.lk{{position:absolute;left:0;right:0;top:76.5mm;text-align:center;font-size:4mm}}
.st{{position:absolute;left:10mm;right:10mm;top:85mm;margin:0;padding:0;list-style:none;font-size:3.9mm;line-height:1.22}}
.st li{{display:flex;gap:2mm;margin-bottom:1.8mm}} .st b{{flex:none;width:5.4mm;height:5.4mm;background:{PINK};color:#fff;border:.45mm solid {INK};display:flex;align-items:center;justify-content:center;font-size:3.6mm}}
.mic{{position:absolute;left:10mm;right:10mm;top:120mm;font-size:3.2mm;line-height:1.2;opacity:.8}}
.sig{{position:absolute;left:10mm;right:10mm;bottom:9mm;font-size:4.2mm;display:flex;align-items:center;gap:2mm;white-space:nowrap}} .sig b{{font-weight:inherit}}
.mkb{{position:absolute;right:6mm;top:6mm;width:17mm;image-rendering:pixelated;transform:scaleX(-1)}}

/* Inner Spread: Left (Party illustration) & Right (Letter handwriting lines) */
.pn-party{{background:linear-gradient(#fff0f6,#ffe4ee);box-shadow:inset 0 -2.2mm 0 #f5a4be}}
.pn-letter{{background:#fffdf8;box-shadow:inset 0 -2.2mm 0 #e4cbba}}

.pt-h1{{position:absolute;left:0;right:0;top:14mm;text-align:center;font-weight:700;font-size:9.5mm;line-height:1;color:#fff;
  text-shadow:0 .5mm 0 {INK},.5mm 0 0 {INK},-.5mm 0 0 {INK},0 -.5mm 0 {INK},.5mm .5mm 0 {INK},-.5mm .5mm 0 {INK},.5mm -.5mm 0 {INK},-.5mm -.5mm 0 {INK},0 1.1mm 0 {INK}}}
.pt-h2{{position:absolute;left:0;right:0;top:28mm;text-align:center;font-size:4.8mm;color:{INK}}}

.pt-stage{{position:absolute;left:0;right:0;bottom:26mm;height:120mm;pointer-events:none}}
.pt-floor{{position:absolute;left:12mm;right:12mm;bottom:4mm;height:8mm;border-radius:50%;background:rgba(59,36,51,.12)}}
.im-cake{{position:absolute;left:50%;bottom:8mm;transform:translateX(-50%);width:46mm;image-rendering:pixelated}}
.im-abibyan{{position:absolute;left:50%;bottom:36mm;transform:translateX(-50%);width:36mm;image-rendering:pixelated}}
.im-pusya{{position:absolute;left:8mm;bottom:10mm;width:34mm;image-rendering:pixelated}}
.im-monty{{position:absolute;right:8mm;bottom:10mm;width:38mm;image-rendering:pixelated;transform:scaleX(-1)}}
.im-zhuk{{position:absolute;left:42mm;bottom:2mm;width:12mm;image-rendering:pixelated}}
.im-mosq{{position:absolute;right:22mm;bottom:64mm;width:20mm;image-rendering:pixelated}}

.pt-banner{{position:absolute;left:0;right:0;bottom:10mm;text-align:center;font-weight:700;font-size:5.4mm;color:{INK};display:flex;align-items:center;justify-content:center;gap:2mm}}

/* Letter panel (Right) */
.lt-title{{position:absolute;left:10mm;right:10mm;top:13mm;font-weight:700;font-size:7.2mm;line-height:1;color:{INK};text-align:center;letter-spacing:.2mm;white-space:nowrap}}
.lt-sub{{position:absolute;left:10mm;right:10mm;top:25mm;font-size:4.2mm;color:#855c70;text-align:center}}
.lt-lines{{position:absolute;left:12mm;right:12mm;top:34mm;bottom:24mm;display:flex;flex-direction:column;justify-content:space-between}}
.lt-row{{width:100%;height:13.5mm;border-bottom:0.38mm dashed #cca0b2}}
.lt-foot{{position:absolute;left:12mm;right:12mm;bottom:10mm;display:flex;align-items:center;justify-content:flex-end;gap:2mm;font-size:4.2mm;color:{INK}}}

/* Side-by-side / stacked preview */
.side{{display:flex;flex-direction:column;gap:10mm;padding:8mm;background:#2b1e32;width:max-content}}
.side .pg{{box-shadow:0 3mm 8mm rgba(0,0,0,.5)}}
.side-lbl{{color:#ffe3ee;font-size:5mm;font-weight:700;padding-left:2mm}}
"""

FRONT_INNER = f"""
<div class="inw"><div class="in">
<div class="cf">{confetti(24, 70, [PINK, '#7ad0ff', GOLD, '#9ee07a', '#c9a0ff', '#ffffff'])}</div>
{bunting()}
<div class="t1" data-k="t1">Дашулик,</div><div class="t2" data-k="t2">с днём рождения!</div>
<div class="hl">{heart_svg(7)}</div><div class="hl2">{heart_svg(5, '#ff5c8a')}</div>
<div class="dgs" data-k="num">{digit_svg(2, 1.5)}{digit_svg(4, 1.5)}</div>
<svg class="dl" viewBox="0 0 105 148"><path d="M66.25 72.8 Q58 84 45.8 91.2 M83.75 75.8 Q66 88 45.8 91.2" fill="none" stroke="#b89a5a" stroke-width=".45"/></svg>
<div class="rug"></div><img class="mk" data-k="hero" src="{furl(big('abibyan_up.png'))}" alt="">
<div class="sub" data-k="sub">Это Абибян. Теперь он живёт у тебя!</div>
</div></div>
"""

BACK_INNER = f"""
<div class="inw"><div class="in">
<img class="mkb" data-k="mkb" src="{furl(big('abibyan.png'))}" alt="">
<div class="bh" data-k="bh">Как забрать<br>Абибяна домой</div>
<div class="qr" data-k="qr">{QR}</div><div class="lk" data-k="lk">{html.escape(link)}</div>
<ol class="st" data-k="st"><li><b>1</b><span>Наведи камеру телефона на код и открой ссылку в Safari</span></li>
<li><b>2</b><span>Нажми „Поделиться“, потом „На экран Домой“</span></li>
<li><b>3</b><span>Открой Абибяна с иконки и постучи по коробке</span></li></ol>
<div class="mic" data-k="mic">Свечки на торте задувают по-настоящему — в микрофон. Телефон спросит разрешение — нажми „Разрешить“.</div>
<div class="sig" data-k="sig">С любовью, <b>твой Loveашик</b>{heart_svg(4.5)}</div>
</div></div>
"""

PARTY_INNER = f"""
<div class="cf">{confetti(88, 55, [PINK, '#7ad0ff', GOLD, '#9ee07a', '#c9a0ff', '#ffffff'], xmax=PW-10, ymax=PH-20)}</div>
{bunting(PW)}
<div class="pt-h1" data-k="pth1">С днём рождения!</div>
<div class="pt-h2" data-k="pth2">Праздник в кругу любимых друзей ✨</div>
<div class="pt-stage">
  <div class="pt-floor"></div>
  <img class="im-pusya" data-k="pusya" src="{furl(big('pusya.png'))}" alt="">
  <img class="im-monty" data-k="monty" src="{furl(big('monty.png'))}" alt="">
  <img class="im-zhuk" data-k="zhuk" src="{furl(big('zhuk.png'))}" alt="">
  <img class="im-mosq" data-k="mosq" src="{furl(big('mosq.png'))}" alt="">
  <img class="im-abibyan" data-k="abibyan_party" src="{furl(big('abibyan_up.png'))}" alt="">
  <img class="im-cake" data-k="cake" src="{furl(big('big_cake.png'))}" alt="">
</div>
<div class="pt-banner" data-k="ptsub">Мы все тебя очень любим! {heart_svg(5)}</div>
"""

lines_html = ''.join('<div class="lt-row"></div>' for _ in range(8))
LETTER_INNER = f"""
<div class="lt-title" data-k="lt1">Дорогая Дашулик! ❤️</div>
<div class="lt-sub" data-k="lt2">Место для тёплых слов:</div>
<div class="lt-lines" data-k="ltlines">{lines_html}</div>
<div class="lt-foot" data-k="ltfoot"><span>С любовью, <b>твой Loveашик</b></span>{heart_svg(4.5)}</div>
"""

OUTER_PAGE = f"""
<section class="pg outer">
  <div class="tick t-top"></div><div class="tick t-bot"></div>
  <div class="pn pn-left pn-back">{BACK_INNER}{FRAME}</div>
  <div class="pn pn-right pn-front">{FRONT_INNER}{FRAME}</div>
</section>
"""

INNER_PAGE = f"""
<section class="pg inner">
  <div class="tick t-top"></div><div class="tick t-bot"></div>
  <div class="pn pn-left pn-party">{PARTY_INNER}{FRAME}</div>
  <div class="pn pn-right pn-letter">{LETTER_INNER}{FRAME}</div>
</section>
"""

doc = lambda body, extra='': f'<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>{CSS}{extra}</style></head><body>{body}</body></html>'
hp = os.path.join(WORK, 'card.html')
hs = os.path.join(WORK, 'card-side.html')

open(hp, 'w', encoding='utf-8').write(doc(OUTER_PAGE + INNER_PAGE))
open(hs, 'w', encoding='utf-8').write(doc(f'<div class="side"><div class="side-lbl">1. Внешняя сторона (разворот: задник слева, обложка справа)</div>{OUTER_PAGE}<div class="side-lbl">2. Внутренняя сторона (разворот: друзья слева, письмо справа)</div>{INNER_PAGE}</div>'))

pdf, png = os.path.join(DIST, 'abibyan-card.pdf'), os.path.join(DIST, 'abibyan-card.png')
base = [CHROME, '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--virtual-time-budget=5000', '--run-all-compositor-stages-before-draw']

for f in (pdf, png):
    if os.path.exists(f): os.remove(f)

print('Rendering dist/abibyan-card.pdf via Chromium...')
subprocess.run(base + ['--no-pdf-header-footer', '--print-to-pdf=' + pdf, furl(hp)], check=True, capture_output=True)

# Window size for stacked preview: 297mm + 16mm padding, 2 * 210mm + 40mm padding
W = round((297 + 16) * 96 / 25.4)
H = round((210 * 2 + 50) * 96 / 25.4)
print('Rendering dist/abibyan-card.png via Chromium...')
subprocess.run(base + ['--force-device-scale-factor=2', f'--window-size={W},{H}', '--screenshot=' + png, furl(hs)], check=True, capture_output=True)

assert os.path.exists(pdf) and os.path.exists(png), 'chromium made no card'
print('card:', pdf, os.path.getsize(pdf) // 1024, 'KB;', png, os.path.getsize(png) // 1024, 'KB; QR →', URL)
