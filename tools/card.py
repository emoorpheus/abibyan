#!/usr/bin/env python3
"""Round 22 → Round 34: Birthday booklet card for Дашуля — dist/abibyan-card.pdf + dist/abibyan-card.png.
Variant 1 (A4 sheet folded in half into an A5 booklet):
- Sheet size: A4 landscape 297×210 mm.
- Printed double-sided (flip on short edge / переворот по короткому краю).
- Page 1 (Outer spread):
    Left (148.5×210 mm): Back cover (QR-code, instructions, mic reminder, signature «С любовью, твой Loveашик ❤️»).
    Right (148.5×210 mm): Front cover («С днём рождения, Дашуля! ✨ 24», jumping Абибян, balloons, confetti).
- Page 2 (Inner spread):
    Left (148.5×210 mm): Cozy birthday scene with Абибян and festive cake (NO SPOILERS OF FRIENDS!).
    Right (148.5×210 mm): Decorative lined panel for Vyacheslav's handwritten letter («Дорогая Дашуля! ❤️»).
- Fold guide tick marks along the center line at 148.5 mm.
All pixel art pre-scaled ×16 nearest for crisp 300+ dpi printing.
"""
import os, sys, subprocess, random, html, shutil, glob
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = sys.argv[1] if len(sys.argv) > 1 else 'https://emoorpheus.github.io/abibyan/'
DIST = os.path.join(ROOT, 'dist'); WORK = os.path.join(DIST, 'card'); os.makedirs(WORK, exist_ok=True)

try:
    import segno
except ImportError:
    subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'segno'], check=True); import segno

# Auto-detect Chrome/Chromium (Linux, macOS, Playwright cache)
CHROME_CANDS = [
    shutil.which('chromium'),
    shutil.which('google-chrome'),
    '/usr/local/bin/chromium',
    '/usr/bin/chromium'
] + glob.glob(os.path.expanduser('~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'))
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

# Layout geometry: A4 landscape sheet (297×210 mm) folded in half to A5 (148.5×210 mm)
SHEET_W, SHEET_H = 297, 210
HALF_W = SHEET_W / 2          # 148.5 mm
M = 6.5                        # safe margin from edges and fold (mm)
PW = HALF_W - 2 * M            # 135.5 mm panel width
PH = SHEET_H - 2 * M           # 197.0 mm panel height

Z = PW / 105                   # zoom factor from standard 105x148 layout: 1.29048
OY = (PH - 148 * Z) / 2        # vertical centering offset: ~3.0 mm

# Elegant card border: soft rounded rectangle with delicate corner heart flourishes
def elegant_frame(w=PW, h=PH):
    return f'''<div class="card-border">
      <div class="cb-inner"></div>
      <span class="cb-c c-tl">♥</span><span class="cb-c c-tr">♥</span>
      <span class="cb-c c-bl">♥</span><span class="cb-c c-br">♥</span>
    </div>'''

qr = segno.make(URL, error='m')
QR = qr.svg_inline(scale=1, border=2, dark=INK, light='#ffffff', omitsize=True)
link = URL.replace('https://', '').rstrip('/')

FONTS_DIR = os.path.join(ROOT, 'assets', 'fonts')
LOCAL_FONTS = f"""
@font-face {{ font-family: 'Pix'; src: url('{furl(os.path.join(ROOT, 'assets', 'pix400.woff2'))}') format('woff2'); font-weight: 400; }}
@font-face {{ font-family: 'Pix'; src: url('{furl(os.path.join(ROOT, 'assets', 'pix700.woff2'))}') format('woff2'); font-weight: 700; }}
@font-face {{ font-family: 'Comfortaa'; src: url('{furl(os.path.join(FONTS_DIR, 'comfortaa700.woff2'))}') format('woff2'); font-weight: 700; }}
@font-face {{ font-family: 'Caveat'; src: url('{furl(os.path.join(FONTS_DIR, 'caveat700.woff2'))}') format('woff2'); font-weight: 700; }}
@font-face {{ font-family: 'Nunito'; src: url('{furl(os.path.join(FONTS_DIR, 'nunito400.woff2'))}') format('woff2'); font-weight: 400; }}
@font-face {{ font-family: 'Nunito'; src: url('{furl(os.path.join(FONTS_DIR, 'nunito700.woff2'))}') format('woff2'); font-weight: 700; }}
"""

CSS = f"""
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

/* Panels */
.pn {{ position: absolute; top: {M}mm; width: {PW}mm; height: {PH}mm; overflow: hidden; border-radius: 5mm; }}
.pn-left {{ left: {M}mm; }}
.pn-right {{ left: {HALF_W + M}mm; }}

/* Decorative Elegant Frame */
.card-border {{ position: absolute; inset: 0; border: 1.6pt solid #f0bed2; border-radius: 5mm; pointer-events: none; z-index: 80; }}
.cb-inner {{ position: absolute; inset: 1.4mm; border: 0.8pt dashed #f5d1df; border-radius: 3.8mm; }}
.cb-c {{ position: absolute; font-size: 3.2mm; color: #e68cae; line-height: 1; user-select: none; }}
.c-tl {{ top: 1.2mm; left: 1.8mm; }} .c-tr {{ top: 1.2mm; right: 1.8mm; }}
.c-bl {{ bottom: 1.2mm; left: 1.8mm; }} .c-br {{ bottom: 1.2mm; right: 1.8mm; }}

.inw {{ position: absolute; left: 0; top: {OY:.3f}mm; width: {PW}mm; }}
.in {{ position: relative; width: 105mm; height: 148mm; zoom: {Z:.5f}; }}
.cf i, .cf span {{ position: absolute; display: block; }}
.cf-star {{ line-height: 1; pointer-events: none; }}

/* Background Themes */
.pn-front {{ background: linear-gradient(175deg, #fff7fa 0%, #ffedf3 50%, #ffe0ec 100%); }}
.pn-back {{ background: linear-gradient(175deg, #fffdf8 0%, #fff8ee 60%, #fff0e2 100%); }}
.pn-party {{ background: linear-gradient(175deg, #fff8fb 0%, #ffedf5 50%, #ffe3ef 100%); }}
.pn-letter {{ background: linear-gradient(175deg, #fffdf9 0%, #fff9f6 60%, #fff2ee 100%); }}

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
.in-stage {{ position: absolute; left: 0; right: 0; top: 32mm; height: 60mm; display: flex; align-items: flex-end; justify-content: center; }}
.in-cake {{ width: 44mm; image-rendering: pixelated; margin-right: -6mm; z-index: 10; filter: drop-shadow(0 2mm 3mm rgba(120,40,70,0.18)); }}
.in-abibyan {{ width: 34mm; image-rendering: pixelated; z-index: 20; margin-left: -4mm; filter: drop-shadow(0 2mm 3mm rgba(120,40,70,0.18)); }}
.in-card-note {{ position: absolute; left: 8mm; right: 8mm; top: 96mm; background: #fff; border: 1pt solid #f3cbdb; border-radius: 4mm; padding: 3.5mm 4mm; box-shadow: 0 2mm 5mm rgba(120,40,70,0.06); text-align: center; }}
.in-note-greet {{ font-family: 'Comfortaa', sans-serif; font-size: 3.8mm; font-weight: 700; color: {BERRY}; margin: 0 0 1.2mm 0; }}
.in-note-body {{ font-size: 3.25mm; line-height: 1.35; color: #5a2e41; margin: 0 0 1.8mm 0; }}
.in-note-call {{ font-size: 3.4mm; font-weight: 700; color: {ROSE}; margin: 0; }}
.in-party-foot {{ position: absolute; left: 0; right: 0; bottom: 8.5mm; text-align: center; font-family: 'Caveat', cursive; font-size: 5.6mm; color: {BERRY}; }}

/* Inner Right: Love Letter for Dasha */
.lt-title {{ position: absolute; left: 10mm; right: 10mm; top: 12mm; font-family: 'Caveat', cursive; font-size: 7.5mm; font-weight: 700; color: {BERRY}; text-align: center; line-height: 1; letter-spacing: 0.1mm; white-space: nowrap; }}
.lt-sub {{ position: absolute; left: 10mm; right: 10mm; top: 25mm; font-size: 3.8mm; color: #8e586c; text-align: center; }}
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
<img class="fc-hero" data-k="hero" src="{furl(big('abibyan_up.png'))}" alt="">
<div class="fc-sub" data-k="sub">Это твой личный плюшевый Абибян.<br>Теперь он живёт у тебя!</div>
</div></div>
"""

BACK_INNER = f"""
<div class="inw"><div class="in">
<img class="bc-mkb" data-k="mkb" src="{furl(big('abibyan.png'))}" alt="">
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
<div class="bc-micbox" data-k="mic">💡 <b>Свечки задувают по-настоящему:</b> телефон спросит разрешение на микрофон — нажми „Разрешить“, чтобы дуть своим дыханием!</div>
<div class="bc-sig" data-k="sig">С любовью, твой Loveашик {heart_svg(4.5)}</div>
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
  <img class="in-cake" data-k="cake" src="{furl(big('big_cake.png'))}" alt="">
  <img class="in-abibyan" data-k="abibyan_party" src="{furl(big('abibyan_up.png'))}" alt="">
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
<div class="lt-title" data-k="lt1">Дорогая Дашуля! ❤️</div>
<div class="lt-sub" data-k="lt2">Самые тёплые слова от всего сердца:</div>
<div class="lt-lines" data-k="ltlines">{lines_html}</div>
<div class="lt-foot" data-k="ltfoot"><span>С любовью, твой Loveашик</span> {heart_svg(4.5)}</div>
</div></div>
"""

OUTER_PAGE = f"""
<section class="pg outer">
  <div class="tick t-top"></div><div class="tick t-bot"></div>
  <div class="pn pn-left pn-back">{BACK_INNER}{elegant_frame()}</div>
  <div class="pn pn-right pn-front">{FRONT_INNER}{elegant_frame()}</div>
</section>
"""

INNER_PAGE = f"""
<section class="pg inner">
  <div class="tick t-top"></div><div class="tick t-bot"></div>
  <div class="pn pn-left pn-party">{PARTY_INNER}{elegant_frame()}</div>
  <div class="pn pn-right pn-letter">{LETTER_INNER}{elegant_frame()}</div>
</section>
"""

doc = lambda body, extra='': f'<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>{CSS}{extra}</style></head><body>{body}</body></html>'
hp = os.path.join(WORK, 'card.html')
hs = os.path.join(WORK, 'card-side.html')

open(hp, 'w', encoding='utf-8').write(doc(OUTER_PAGE + INNER_PAGE))
open(hs, 'w', encoding='utf-8').write(doc(f'<div class="side"><div class="side-lbl">1. Внешняя сторона (разворот: задник слева, обложка справа)</div>{OUTER_PAGE}<div class="side-lbl">2. Внутренняя сторона (разворот: Абибян слева, письмо справа)</div>{INNER_PAGE}</div>'))

pdf, png = os.path.join(DIST, 'abibyan-card.pdf'), os.path.join(DIST, 'abibyan-card.png')
base = [CHROME, '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--virtual-time-budget=5000', '--run-all-compositor-stages-before-draw']

for f in (pdf, png):
    if os.path.exists(f): os.remove(f)

print('Rendering dist/abibyan-card.pdf via Chromium...')
subprocess.run(base + ['--no-pdf-header-footer', '--print-to-pdf=' + pdf, furl(hp)], check=True, capture_output=True)

W = round((297 + 16) * 96 / 25.4)
H = round((210 * 2 + 50) * 96 / 25.4)
print('Rendering dist/abibyan-card.png via Chromium...')
subprocess.run(base + ['--force-device-scale-factor=2', f'--window-size={W},{H}', '--screenshot=' + png, furl(hs)], check=True, capture_output=True)

assert os.path.exists(pdf) and os.path.exists(png), 'chromium made no card'
print('card:', pdf, os.path.getsize(pdf) // 1024, 'KB;', png, os.path.getsize(png) // 1024, 'KB; QR →', URL)
