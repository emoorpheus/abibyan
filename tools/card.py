#!/usr/bin/env python3
"""Round 22 → Round 34: Birthday booklet card for Дашуля.
Generates two PDF deliverables:
1. dist/abibyan-card.pdf (+ dist/abibyan-card.png) — Standard with 6.5 mm margins (passe-partout, safe for all printers without clipping).
2. dist/abibyan-card-bleed.pdf (+ dist/abibyan-card-bleed.png) — Full-Bleed (100% background to the paper edge 297×210 mm, no white borders).

Format: A4 landscape (297×210 mm), printed double-sided (flip on short edge / переворот по короткому краю), folded in half into A5 (148.5×210 mm).
Page 1 (Outer spread): Back cover on left, Front cover on right.
Page 2 (Inner spread): Cozy scene with Абибян & cake on left (NO SPOILERS), Lined letter for Дашуля on right.
"""
import os, sys, subprocess, random, html, shutil, glob
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else 'https://emoorpheus.github.io/abibyan/'
DIST = os.path.join(ROOT, 'dist'); WORK = os.path.join(DIST, 'card'); os.makedirs(WORK, exist_ok=True)

try:
    import segno
except ImportError:
    subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'segno'], check=True); import segno

# Auto-detect Chrome/Chromium
CHROME_CANDS = [
    shutil.which('chromium'),
    shutil.which('google-chrome'),
    '/usr/local/bin/chromium',
    '/usr/bin/chromium'
] + glob.glob(os.path.expanduser('~/.cache/ms-playwright/chromium-*/chrome-linux*/chrome')) + glob.glob(os.path.expanduser('~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'))
CHROME = next((c for c in CHROME_CANDS if c and os.path.exists(c)), None)
assert CHROME, 'Chromium / Chrome binary not found'

INK, BERRY, ROSE, GOLD = '#4a2034', '#84183d', '#d94d75', '#d99b26'
ART = os.path.join(ROOT, 'assets', 'card')
if not os.path.exists(os.path.join(ART, 'abibyan.png')) or not os.path.exists(os.path.join(ART, 'abibyan_up.png')):
    subprocess.run(['node', os.path.join(ROOT, 'tools', 'card_art.js')], check=True, cwd=ROOT)

furl = lambda p: 'file://' + os.path.abspath(p)

def big(name, k=16):
    o = os.path.join(WORK, name.replace('.png', f'_x{k}.png'))
    src = os.path.join(ART, name)
    if not os.path.exists(src):
        subprocess.run(['node', os.path.join(ROOT, 'tools', 'card_art.js')], check=True, cwd=ROOT)
    im = Image.open(src)
    im.resize((im.width * k, im.height * k), Image.NEAREST).save(o)
    return o

DIG3 = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111']
def digit_svg(d, px=1.5):
    g = DIG3[d]; M = lambda x, y: 0 <= x < 9 and 0 <= y < 15 and g[(y // 3) * 3 + x // 3] == '1'; r = []
    for y in range(-1, 16):
        for x in range(-1, 10):
            if not M(x, y) and any(M(x + a, y + b) for a in (-1, 0, 1) for b in (-1, 0, 1)): r.append((x, y, '#6b361a'))
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
def heart_svg(mm=6, fill=ROSE, hi='#ffd6e4'):
    w, h = len(HEART[0]) + 2, len(HEART) + 2; r = []
    for y in range(-1, h - 1):
        for x in range(-1, w - 1):
            on = lambda a, b: 0 <= b < len(HEART) and 0 <= a < len(HEART[0]) and HEART[b][a] == '#'
            if on(x, y): r.append((x, y, hi if (x, y) in ((1, 1), (2, 1)) else fill))
            elif any(on(x + a, y + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))): r.append((x, y, '#701e38'))
    rects = ''.join(f'<rect x="{x + 1}" y="{y + 1}" width="1.02" height="1.02" fill="{c}"/>' for x, y, c in r)
    return f'<svg viewBox="0 0 {w} {h}" width="{mm * w / h}mm" height="{mm}mm" shape-rendering="crispEdges">{rects}</svg>'

def confetti(seed, n, colors, xmax=100, ymax=145):
    rnd = random.Random(seed); out = []
    for _ in range(n):
        x, y, s = rnd.uniform(4, xmax), rnd.uniform(4, ymax), rnd.choice((1.2, 1.5, 1.8, 2.2)); c = rnd.choice(colors)
        shape = rnd.choice(('circle', 'rect', 'star'))
        if shape == 'star':
            out.append(f'<span class="cf-star" style="left:{x:.1f}mm;top:{y:.1f}mm;color:{c};font-size:{s*1.2:.1f}mm">✦</span>')
        elif shape == 'circle':
            out.append(f'<i style="left:{x:.1f}mm;top:{y:.1f}mm;width:{s}mm;height:{s}mm;background:{c};border-radius:50%"></i>')
        else:
            out.append(f'<i style="left:{x:.1f}mm;top:{y:.1f}mm;width:{s}mm;height:{s*0.8}mm;background:{c};border-radius:0.3mm"></i>')
    return ''.join(out)

def bunting(w=105):
    cols = ['#ff7aa8', '#7ad0ff', '#ffd04a', '#a6e587', '#d0aaff']; fl = []
    n = max(8, int(w / 11.5))
    step = (w - 4) / n
    for i in range(n):
        x = 2 + i * step; y = 4 + 2.0 * abs((i - (n - 1) / 2) / ((n - 1) / 2)) ** 2 * -1 + 2.0
        fl.append(f'<polygon points="{x:.1f},{y:.1f} {x + step * 0.8:.1f},{y:.1f} {x + step * 0.4:.1f},{y + 7.5:.1f}" fill="{cols[i % 5]}" stroke="{BERRY}" stroke-width=".35"/>')
    return f'<svg class="bunt" viewBox="0 0 {w} 15" width="{w}mm" height="15mm"><path d="M0 4.2 Q{w / 2} 8.2 {w} 4.2" fill="none" stroke="{BERRY}" stroke-width=".4"/>{"".join(fl)}</svg>'

SHEET_W, SHEET_H = 297, 210
HALF_W = SHEET_W / 2          # 148.5 mm

# Hardware-safe centering for Canon PIXMA TS3300 (which requires >=16.7mm bottom margin on plain paper)
# and universal consumer printers:
# Top margin = 18.0 mm, Bottom margin = 18.0 mm (100% symmetric vertical centering)
# Panel height: PH = 210 - 2 * 18.0 = 174.0 mm
# Exact proportional zoom from standard 105×148 mm: Z = PH / 148 = 1.175676
# Panel width: PW = 105 * Z = 123.446 mm
# Symmetrical horizontal margin: MX = (HALF_W - PW) / 2 = 12.527 mm
MY = 18.0                      # top and bottom margins (mm)
PH = SHEET_H - 2 * MY          # 174.0 mm
Z = PH / 148                   # 1.17568 (exact aspect ratio)
PW = 105 * Z                   # 123.446 mm
MX = (HALF_W - PW) / 2         # 12.527 mm
OY = 0                         # exact proportional fit!

def elegant_frame():
    return f'''<div class="card-border">
      <div class="cb-inner"></div>
      <span class="cb-c c-tl">♥</span><span class="cb-c c-tr">♥</span>
      <span class="cb-c c-bl">♥</span><span class="cb-c c-br">♥</span>
    </div>'''

def crop_marks():
    c_len = 4.0
    lx0, lx1 = MX, MX + PW
    rx0, rx1 = HALF_W + MX, HALF_W + MX + PW
    y0, y1 = MY, MY + PH
    marks = [
        f'<line x1="{HALF_W:.2f}" y1="0" x2="{HALF_W:.2f}" y2="5" stroke="#caa2b4" stroke-width="0.3"/>',
        f'<line x1="{HALF_W:.2f}" y1="{SHEET_H-5:.2f}" x2="{HALF_W:.2f}" y2="{SHEET_H:.2f}" stroke="#caa2b4" stroke-width="0.3"/>'
    ]
    for x0, x1 in ((lx0, lx1), (rx0, rx1)):
        marks.append(f'<line x1="{x0:.2f}" y1="{y0-c_len:.2f}" x2="{x0:.2f}" y2="{y0:.2f}" stroke="#caa2b4" stroke-width="0.3"/>')
        marks.append(f'<line x1="{x0-c_len:.2f}" y1="{y0:.2f}" x2="{x0:.2f}" y2="{y0:.2f}" stroke="#caa2b4" stroke-width="0.3"/>')
        marks.append(f'<line x1="{x1:.2f}" y1="{y0-c_len:.2f}" x2="{x1:.2f}" y2="{y0:.2f}" stroke="#caa2b4" stroke-width="0.3"/>')
        marks.append(f'<line x1="{x1:.2f}" y1="{y0:.2f}" x2="{x1+c_len:.2f}" y2="{y0:.2f}" stroke="#caa2b4" stroke-width="0.3"/>')
        marks.append(f'<line x1="{x0:.2f}" y1="{y1:.2f}" x2="{x0:.2f}" y2="{y1+c_len:.2f}" stroke="#caa2b4" stroke-width="0.3"/>')
        marks.append(f'<line x1="{x0-c_len:.2f}" y1="{y1:.2f}" x2="{x0:.2f}" y2="{y1:.2f}" stroke="#caa2b4" stroke-width="0.3"/>')
        marks.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x1:.2f}" y2="{y1+c_len:.2f}" stroke="#caa2b4" stroke-width="0.3"/>')
        marks.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x1+c_len:.2f}" y2="{y1:.2f}" stroke="#caa2b4" stroke-width="0.3"/>')
    return f'<svg class="crop-marks" style="position:absolute;inset:0;width:297mm;height:210mm;pointer-events:none;z-index:95;">{"".join(marks)}</svg>'

qr = segno.make(URL, error='m')
QR = qr.svg_inline(scale=1, border=2, dark=INK, light='#ffffff', omitsize=True)
link = URL.replace('https://', '').rstrip('/')

FONTS_DIR = os.path.join(ROOT, 'assets', 'fonts')
import base64
def _font64(rel):
    # embed the font bytes: Chromium on file:// may block relative font URLs and fall back to Times New Roman
    with open(os.path.join(ROOT, 'assets', rel), 'rb') as fh: return 'data:font/woff2;base64,' + base64.b64encode(fh.read()).decode('ascii')
_FF = [('Pix', 'pix400.woff2', 400), ('Pix', 'pix700.woff2', 700), ('Comfortaa', 'fonts/comfortaa700.woff2', 700),
       ('Caveat', 'fonts/caveat700.woff2', 700), ('Nunito', 'fonts/nunito400.woff2', 400), ('Nunito', 'fonts/nunito700.woff2', 700)]
LOCAL_FONTS = ''.join(f"@font-face {{ font-family: '{n}'; src: url('{_font64(f)}') format('woff2'); font-weight: {w}; }}\n" for n, f, w in _FF)


def make_css(bleed=False):
    if not bleed:
        pn_layout = f"""
        .pn {{ position: absolute; top: {MY:.2f}mm; width: {PW:.2f}mm; height: {PH:.2f}mm; overflow: hidden; border-radius: 4.5mm; }}
        .pn-left {{ left: {MX:.2f}mm; }}
        .pn-right {{ left: {HALF_W + MX:.2f}mm; }}
        .card-border {{ position: absolute; inset: 0; border: 1.6pt solid #f0bed2; border-radius: 4.5mm; pointer-events: none; z-index: 80; }}
        .inw {{ position: absolute; left: 0; top: 0; width: {PW:.2f}mm; }}
        """
    else:
        pn_layout = f"""
        .pn {{ position: absolute; top: 0; width: {HALF_W}mm; height: {SHEET_H}mm; overflow: hidden; }}
        .pn-left {{ left: 0; }}
        .pn-right {{ left: {HALF_W}mm; }}
        .card-border {{ position: absolute; inset: {MY:.2f}mm {MX:.2f}mm; border: 1.6pt solid #f0bed2; border-radius: 4.5mm; pointer-events: none; z-index: 80; }}
        .inw {{ position: absolute; left: {MX:.2f}mm; top: {MY:.2f}mm; width: {PW:.2f}mm; }}
        """

    return f"""
    {LOCAL_FONTS}
    @page {{ size: 297mm 210mm; margin: 0; }}
    * {{ box-sizing: border-box; }}
    html, body {{ margin: 0; padding: 0; }}
    body {{ font-family: 'Nunito', 'Trebuchet MS', -apple-system, sans-serif; color: {INK}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
    .pg {{ position: relative; width: 297mm; height: 210mm; overflow: hidden; background: #fff; page-break-after: always; break-after: page; }}
    .pg:last-child {{ page-break-after: auto; break-after: auto; }}

    /* Fold tick marks */
    .tick {{ position: absolute; left: 148.35mm; width: 0.3mm; background: #dfb2c4; z-index: 90; }}
    .tick.t-top {{ top: 0; height: 4.5mm; }}
    .tick.t-bot {{ bottom: 0; height: 4.5mm; }}

    {pn_layout}

    /* Decorative Elegant Frame */
    .cb-inner {{ position: absolute; inset: 1.4mm; border: 0.8pt dashed #f5d1df; border-radius: 3.8mm; }}
    .cb-c {{ position: absolute; font-size: 3.2mm; color: #e68cae; line-height: 1; user-select: none; }}
    .c-tl {{ top: 1.2mm; left: 1.8mm; }} .c-tr {{ top: 1.2mm; right: 1.8mm; }}
    .c-bl {{ bottom: 1.2mm; left: 1.8mm; }} .c-br {{ bottom: 1.2mm; right: 1.8mm; }}

    .in {{ position: relative; width: 105mm; height: 148mm; zoom: {Z:.5f}; }}
    .cf i, .cf span {{ position: absolute; display: block; }}
    .cf-star {{ line-height: 1; pointer-events: none; }}

    /* Outer Spread: 100% Pink (Party Cake on Left, Front Cover on Right) */
    .pg.outer {{ background: linear-gradient(175deg, #fff7fa 0%, #ffedf3 50%, #ffe0ec 100%); }}
    .pn-party {{ background: linear-gradient(175deg, #fff7fa 0%, #ffedf3 50%, #ffe0ec 100%); }}
    .pn-front {{ background: linear-gradient(175deg, #fff7fa 0%, #ffedf3 50%, #ffe0ec 100%); }}

    /* Inner Spread: 100% Warm Yellow/Cream (QR Code on Left, Letter on Right) */
    .pg.inner {{ background: linear-gradient(175deg, #fffdf8 0%, #fff8ee 50%, #fff0e2 100%); }}
    .pn-back {{ background: linear-gradient(175deg, #fffdf8 0%, #fff8ee 50%, #fff0e2 100%); }}
    .pn-letter {{ background: linear-gradient(175deg, #fffdf8 0%, #fff8ee 50%, #fff0e2 100%); }}

    .bunt {{ position: absolute; left: 0; top: 0; z-index: 10; }}

    /* Front Cover */
    .fc-head {{ position: absolute; left: 0; right: 0; top: 14mm; text-align: center; }}
    .fc-h1 {{ font-family: 'Comfortaa', cursive, sans-serif; font-size: 8.5mm; font-weight: 700; color: {BERRY}; line-height: 1.15; letter-spacing: -0.1mm; margin: 0; text-shadow: 0 0.4mm 1mm rgba(220,100,140,0.18); }}
    .fc-h2 {{ font-family: 'Caveat', cursive; font-size: 8.0mm; font-weight: 700; color: {ROSE}; line-height: 1; margin-top: 1mm; }}
    .fc-dgs {{ position: absolute; left: 58mm; top: 48mm; display: flex; gap: 1.2mm; }}
    .fc-dgs svg:nth-child(2) {{ margin-top: 3.5mm; }}
    .fc-strings {{ position: absolute; left: 0; top: 0; width: 105mm; height: 148mm; pointer-events: none; }}
    .fc-rug {{ position: absolute; left: 10mm; top: 121mm; width: 54mm; height: 7.5mm; border-radius: 50%; background: radial-gradient(ellipse at center, rgba(132,24,61,0.18) 0%, rgba(132,24,61,0) 70%); }}
    .fc-hero {{ position: absolute; left: 14mm; top: 74mm; width: 46mm; image-rendering: pixelated; filter: drop-shadow(0 2mm 3mm rgba(120,40,70,0.15)); }}
    .fc-sub {{ position: absolute; left: 8mm; right: 8mm; bottom: 8.5mm; text-align: center; font-size: 4.1mm; font-weight: 600; line-height: 1.25; color: #6b334a; }}

    /* Back Cover (Passport & Onboarding) */
    .bc-head {{ position: absolute; left: 6mm; right: 20mm; top: 8.5mm; text-align: left; }}
    .bc-title {{ font-family: 'Comfortaa', cursive, sans-serif; font-size: 5.6mm; font-weight: 700; color: {BERRY}; margin: 0; line-height: 1.15; white-space: nowrap; }}
    .bc-sub {{ font-size: 3.3mm; color: #8e586c; margin-top: 0.8mm; }}
    .bc-qrcard {{ position: absolute; left: 50%; top: 25mm; transform: translateX(-50%); width: 49mm; height: 49mm; background: #fff; border: 1.2pt solid #f0c8d7; border-radius: 4.5mm; box-shadow: 0 2mm 6mm rgba(120,40,70,0.08); display: flex; align-items: center; justify-content: center; padding: 2.5mm; }}
    .bc-qrcard svg {{ width: 100%; height: 100%; display: block; }}
    .bc-link {{ position: absolute; left: 0; right: 0; top: 75.5mm; text-align: center; font-size: 3.8mm; font-weight: 600; color: {ROSE}; font-family: 'Comfortaa', monospace; letter-spacing: -0.1mm; }}
    .bc-steps {{ position: absolute; left: 8mm; right: 8mm; top: 82.5mm; margin: 0; padding: 0; list-style: none; font-size: 3.55mm; line-height: 1.25; color: {INK}; }}
    .bc-steps li {{ display: flex; gap: 2.2mm; align-items: flex-start; margin-bottom: 1.8mm; }}
    .bc-badge {{ flex: none; width: 5.2mm; height: 5.2mm; border-radius: 50%; background: linear-gradient(135deg, #ff7ba8, #d9456e); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 3.2mm; font-weight: 700; font-family: 'Comfortaa', sans-serif; box-shadow: 0 1mm 2mm rgba(217,69,110,0.25); }}
    .bc-steps span {{ padding-top: 0.3mm; }}
    .bc-micbox {{ position: absolute; left: 8mm; right: 8mm; top: 116mm; background: rgba(255,255,255,0.7); border: 0.8pt solid #f2cad9; border-radius: 3mm; padding: 1.8mm 2.5mm; font-size: 3.05mm; line-height: 1.22; color: #733c51; }}
    .bc-sig {{ position: absolute; left: 8mm; right: 8mm; bottom: 8.5mm; font-family: 'Caveat', cursive; font-size: 5.5mm; font-weight: 700; color: {BERRY}; display: flex; align-items: center; justify-content: center; gap: 1.5mm; }}
    .bc-mkb {{ position: absolute; right: 4mm; top: 5.5mm; width: 15mm; image-rendering: pixelated; transform: scaleX(-1); opacity: 0.95; }}

    /* Inner Left: Cozy Party & Meeting Abibyan (NO SPOILERS) */
    .in-party-head {{ position: absolute; left: 0; right: 0; top: 12mm; text-align: center; }}
    .in-party-title {{ font-family: 'Comfortaa', cursive, sans-serif; font-size: 7.2mm; font-weight: 700; color: {BERRY}; margin: 0; }}
    .in-party-sub {{ font-family: 'Caveat', cursive; font-size: 5.6mm; color: {ROSE}; margin-top: 1mm; }}
    .in-stage {{ position: absolute; left: 0; right: 0; top: 24mm; height: 58mm; display: flex; align-items: flex-end; justify-content: center; }}
    .in-cake {{ width: 44mm; image-rendering: pixelated; margin-right: -6mm; z-index: 10; filter: drop-shadow(0 2mm 3mm rgba(120,40,70,0.18)); }}
    .in-abibyan {{ width: 34mm; image-rendering: pixelated; z-index: 20; margin-left: -4mm; filter: drop-shadow(0 2mm 3mm rgba(120,40,70,0.18)); }}
    .in-card-note {{ position: absolute; left: 8mm; right: 8mm; top: 85mm; background: #fff; border: 1pt solid #f3cbdb; border-radius: 4mm; padding: 3.5mm 4mm; box-shadow: 0 2mm 5mm rgba(120,40,70,0.06); text-align: center; }}
    .in-note-greet {{ font-family: 'Comfortaa', sans-serif; font-size: 3.8mm; font-weight: 700; color: {BERRY}; margin: 0 0 1.2mm 0; }}
    .in-note-body {{ font-size: 3.25mm; line-height: 1.35; color: #5a2e41; margin: 0 0 1.8mm 0; }}
    .in-note-call {{ font-size: 3.4mm; font-weight: 700; color: {ROSE}; margin: 0; }}
    .in-party-foot {{ position: absolute; left: 0; right: 0; bottom: 6mm; text-align: center; font-family: 'Caveat', cursive; font-size: 5.6mm; color: {BERRY}; }}

    /* Inner Right: Love Letter for Dasha */
    .lt-title {{ position: absolute; left: 8mm; right: 8mm; top: 12mm; font-family: 'Caveat', cursive; font-size: 6.8mm; font-weight: 700; color: {BERRY}; text-align: center; line-height: 1.1; letter-spacing: 0.1mm; white-space: nowrap; }}
    .lt-sub {{ position: absolute; left: 8mm; right: 8mm; top: 24mm; font-size: 3.8mm; color: #8e586c; text-align: center; }}
    .lt-lines {{ position: absolute; left: 10mm; right: 10mm; top: 33mm; bottom: 22mm; display: flex; flex-direction: column; justify-content: space-between; }}
    .lt-row {{ width: 100%; height: 13.5mm; border-bottom: 0.9pt solid #ecc2d4; }}
    .lt-foot {{ position: absolute; left: 10mm; right: 10mm; bottom: 8.5mm; display: flex; align-items: center; justify-content: flex-end; gap: 2mm; font-family: 'Caveat', cursive; font-size: 6.0mm; color: {BERRY}; font-weight: 700; }}

    /* Preview page wrapper */
    .side {{ display: flex; flex-direction: column; gap: 10mm; padding: 8mm; background: #261928; width: max-content; }}
    .side .pg {{ box-shadow: 0 3mm 10mm rgba(0,0,0,0.5); }}
    .side-lbl {{ color: #ffe4ee; font-size: 5mm; font-weight: 700; font-family: 'Comfortaa', sans-serif; padding-left: 2mm; }}
    """

FRONT_INNER = f"""
<div class="inw"><div class="in">
<div class="cf">{confetti(24, 75, ['#ff7aa8', '#7ad0ff', GOLD, '#a6e587', '#d0aaff', '#ffffff'])}</div>
{bunting()}
<div class="fc-head">
  <div class="fc-h1" data-k="t1">С днём рождения!</div>
  <div class="fc-h2" data-k="t2">Дашуля, с твоим днём! ✨</div>
</div>
<div class="fc-dgs" data-k="num">{digit_svg(2, 1.5)}{digit_svg(4, 1.5)}</div>
<svg class="fc-strings" viewBox="0 0 105 148"><path d="M66.25 73 Q58 84 45.8 91.2 M83.75 76 Q66 88 45.8 91.2" fill="none" stroke="#caa260" stroke-width=".45"/></svg>
<div class="fc-rug"></div>
<img class="fc-hero" data-k="hero" src="{os.path.basename(big('abibyan_up.png'))}" alt="">
<div class="fc-sub" data-k="sub">Это твой личный плюшевый Абибян.<br>Теперь он живёт у тебя!</div>
</div></div>
"""

BACK_INNER = f"""
<div class="inw"><div class="in">
<img class="bc-mkb" data-k="mkb" src="{os.path.basename(big('abibyan.png'))}" alt="">
<div class="bc-head">
  <div class="bc-title" data-k="bh">Как оживить Абибяна</div>
  <div class="bc-sub">Твой маленький друг ждёт тебя ✨</div>
</div>
<div class="bc-qrcard" data-k="qr">{QR}</div>
<div class="bc-link" data-k="lk">{html.escape(link)}</div>
<ol class="bc-steps" data-k="st">
  <li><b class="bc-badge">1</b><span>Наведи камеру телефона на QR-код и открой ссылку в Safari</span></li>
  <li><b class="bc-badge">2</b><span>Нажми кнопку „Поделиться“, затем „На экран Домой“</span></li>
  <li><b class="bc-badge">3</b><span>Открой Абибяна с иконки и постучи по коробке!</span></li>
</ol>
<div class="bc-micbox" data-k="mic">💡 <b>Загадай желание и задуй свечки:</b> проведи пальчиком по огонькам на праздничном торте!</div>
<div class="bc-sig" data-k="sig">С любовью, твой Слава {heart_svg(4.5)}</div>
</div></div>
"""

PARTY_INNER = f"""
<div class="inw"><div class="in">
<div class="cf">{confetti(88, 65, ['#ff7aa8', '#7ad0ff', GOLD, '#a6e587', '#d0aaff', '#ffffff'])}</div>
{bunting(105)}
<div class="in-party-head">
  <div class="in-party-title" data-k="pth1">Самый тёплый день! ✨</div>
  <div class="in-party-sub" data-k="pth2">Твой личный плюшевый тамагочи 🎂</div>
</div>
<div class="in-stage">
  <img class="in-cake" data-k="cake" src="{os.path.basename(big('big_cake.png'))}" alt="">
  <img class="in-abibyan" data-k="abibyan_party" src="{os.path.basename(big('abibyan_up.png'))}" alt="">
</div>
<div class="in-card-note">
  <div class="in-note-greet">Привет, Дашуля! ❤️</div>
  <div class="in-note-body">
    Теперь я всегда буду жить в твоём телефоне —<br>
    чтобы радовать тебя, греть сердечко и дарить улыбки.<br>
    Мы с тобой обязательно станем самыми лучшими друзьями!
  </div>
  <div class="in-note-call">Постучи по коробочке на экране, я уже жду тебя! ✨</div>
</div>
<div class="in-party-foot" data-k="ptsub">Мы все тебя очень любим! {heart_svg(5)}</div>
</div></div>
"""

lines_html = ''.join('<div class="lt-row"></div>' for _ in range(8))
LETTER_INNER = f"""
<div class="inw"><div class="in">
<div class="lt-title" data-k="lt1">Дорогая Дашуля! {heart_svg(5.2)}</div>
<div class="lt-sub" data-k="lt2">Самые тёплые слова от всего сердца:</div>
<div class="lt-lines" data-k="ltlines">{lines_html}</div>
<div class="lt-foot" data-k="ltfoot"><span>С любовью, твой Слава</span> {heart_svg(4.5)}</div>
</div></div>
"""

def make_outer(bleed=False):
    cm = '' if bleed else crop_marks()
    return f"""
<section class="pg outer">
  <div class="tick t-top"></div><div class="tick t-bot"></div>
  {cm}
  <div class="pn pn-left pn-party">{PARTY_INNER}{elegant_frame()}</div>
  <div class="pn pn-right pn-front">{FRONT_INNER}{elegant_frame()}</div>
</section>
"""

def make_inner(bleed=False):
    cm = '' if bleed else crop_marks()
    return f"""
<section class="pg inner">
  <div class="tick t-top"></div><div class="tick t-bot"></div>
  {cm}
  <div class="pn pn-left pn-back">{BACK_INNER}{elegant_frame()}</div>
  <div class="pn pn-right pn-letter">{LETTER_INNER}{elegant_frame()}</div>
</section>
"""

doc = lambda body, css, extra='': f'<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>{css}{extra}</style></head><body>{body}</body></html>'

def build_variant(bleed=False):
    prefix = 'abibyan-card-bleed' if bleed else 'abibyan-card'
    css = make_css(bleed=bleed)
    hp = os.path.join(WORK, f'{prefix}.html')
    hs = os.path.join(WORK, f'{prefix}-side.html')

    outer_p = make_outer(bleed=bleed)
    inner_p = make_inner(bleed=bleed)

    hp_outer = os.path.join(WORK, f'{prefix}-outer.html')
    hp_inner = os.path.join(WORK, f'{prefix}-inner.html')
    open(hp, 'w', encoding='utf-8').write(doc(outer_p + inner_p, css))
    open(hp_outer, 'w', encoding='utf-8').write(doc(outer_p, css))
    open(hp_inner, 'w', encoding='utf-8').write(doc(inner_p, css))
    if not bleed:
        open(os.path.join(WORK, 'card.html'), 'w', encoding='utf-8').write(doc(outer_p + inner_p, css))
    desc = 'без белых полей (Full-Bleed)' if bleed else f'центрированная с полями {MY:.0f}×{MX:.0f} мм (для любых принтеров)'
    open(hs, 'w', encoding='utf-8').write(doc(f'<div class="side"><div class="side-lbl">1. Внешняя сторона ({desc})</div>{outer_p}<div class="side-lbl">2. Внутренняя сторона ({desc})</div>{inner_p}</div>', css))

    pdf = os.path.join(DIST, f'{prefix}.pdf')
    png = os.path.join(DIST, f'{prefix}.png')
    pdf_outer = os.path.join(DIST, f'{prefix}-outer.pdf')
    pdf_inner = os.path.join(DIST, f'{prefix}-inner.pdf')
    png_outer = os.path.join(DIST, f'{prefix}-outer.png')
    png_inner = os.path.join(DIST, f'{prefix}-inner.png')
    base = [CHROME, '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--virtual-time-budget=5000', '--run-all-compositor-stages-before-draw']

    for f in (pdf, png, pdf_outer, pdf_inner, png_outer, png_inner):
        if os.path.exists(f): os.remove(f)

    print(f'Rendering {pdf} via Chromium...')
    subprocess.run(base + ['--no-pdf-header-footer', '--print-to-pdf=' + pdf, furl(hp)], check=True, capture_output=True)
    print(f'Rendering {pdf_outer} and {pdf_inner}...')
    subprocess.run(base + ['--no-pdf-header-footer', '--print-to-pdf=' + pdf_outer, furl(hp_outer)], check=True, capture_output=True)
    subprocess.run(base + ['--no-pdf-header-footer', '--print-to-pdf=' + pdf_inner, furl(hp_inner)], check=True, capture_output=True)

    W = round((297 + 16) * 96 / 25.4)
    H = round((210 * 2 + 50) * 96 / 25.4)
    W_page = round(297 * 96 / 25.4)
    H_page = round(210 * 96 / 25.4)
    print(f'Rendering {png}, {png_outer}, {png_inner} via Chromium...')
    subprocess.run(base + ['--force-device-scale-factor=2', f'--window-size={W},{H}', '--screenshot=' + png, furl(hs)], check=True, capture_output=True)
    subprocess.run(base + ['--force-device-scale-factor=2', f'--window-size={W_page},{H_page}', '--screenshot=' + png_outer, furl(hp_outer)], check=True, capture_output=True)
    subprocess.run(base + ['--force-device-scale-factor=2', f'--window-size={W_page},{H_page}', '--screenshot=' + png_inner, furl(hp_inner)], check=True, capture_output=True)

    assert os.path.exists(pdf) and os.path.exists(pdf_outer) and os.path.exists(pdf_inner), f'chromium made no {prefix}'
    print(f'{prefix}: outer={pdf_outer}, inner={pdf_inner}')

# Build standard version
build_variant(bleed=False)
# Also build full-bleed version
build_variant(bleed=True)

print('Card generation completed! QR →', URL)
