#!/usr/bin/env python3
"""Generate a high-resolution printable restaurant ticket preview for Dasha."""
import os, sys, subprocess, base64, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
os.makedirs(DIST, exist_ok=True)

CHROME = '/Users/emoorpheus/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'

def _font64(rel):
    p = os.path.join(ROOT, 'assets', rel)
    with open(p, 'rb') as f:
        return 'data:font/woff2;base64,' + base64.b64encode(f.read()).decode('ascii')

def _img64(rel):
    p = os.path.join(ROOT, 'assets', rel)
    with open(p, 'rb') as f:
        ext = 'png' if rel.endswith('.png') else 'jpeg'
        return f'data:image/{ext};base64,' + base64.b64encode(f.read()).decode('ascii')

comfortaa = _font64('fonts/comfortaa700.woff2')
caveat = _font64('fonts/caveat700.woff2')
nunito400 = _font64('fonts/nunito400.woff2')
nunito700 = _font64('fonts/nunito700.woff2')

abibyan_img = _img64('card/abibyan.png')

# Barcode SVG
def make_barcode():
    bars = [3, 1, 2, 4, 1, 3, 2, 1, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 1, 3, 2]
    rects = []
    x = 0
    for i, b in enumerate(bars):
        if i % 2 == 0:
            rects.append(f'<rect x="{x}" y="0" width="{b*1.6}" height="32" fill="#5c2438"/>')
        x += b * 1.6
    return f'<svg viewBox="0 0 {x} 32" width="130" height="28" style="display:block;margin:0 auto;">{"".join(rects)}</svg>'

html_content = f"""<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<style>
@font-face {{ font-family: 'Comfortaa'; src: url('{comfortaa}') format('woff2'); font-weight: 700; }}
@font-face {{ font-family: 'Caveat'; src: url('{caveat}') format('woff2'); font-weight: 700; }}
@font-face {{ font-family: 'Nunito'; src: url('{nunito400}') format('woff2'); font-weight: 400; }}
@font-face {{ font-family: 'Nunito'; src: url('{nunito700}') format('woff2'); font-weight: 700; }}

* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
  background: #2a1824;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: 'Nunito', sans-serif;
  padding: 40px;
}}

/* Ticket Container */
.ticket {{
  position: relative;
  width: 960px;
  height: 420px;
  background: #fffdfa;
  border-radius: 18px;
  display: flex;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.1);
  overflow: hidden;
}}

/* Main Part */
.main {{
  flex: 1;
  padding: 32px 36px 28px 38px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 2px dashed #ecc4d4;
  background: linear-gradient(135deg, #fffdfa 0%, #fff7f9 100%);
}}

/* Perforation Notches */
.notch-top, .notch-bot {{
  position: absolute;
  width: 32px;
  height: 32px;
  background: #2a1824;
  border-radius: 50%;
  right: -17px;
  z-index: 10;
}}
.notch-top {{ top: -16px; }}
.notch-bot {{ bottom: -16px; }}

/* Inner decorative frame */
.inner-frame {{
  position: absolute;
  inset: 12px 14px 12px 14px;
  border: 1px solid #f2d3e0;
  border-radius: 12px;
  pointer-events: none;
}}

/* Header Row */
.badge-row {{
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}}
.badge {{
  font-family: 'Comfortaa', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #8c264a;
  background: #fae4ee;
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}}
.ticket-num {{
  font-family: 'Comfortaa', sans-serif;
  font-size: 13px;
  color: #a86b81;
  letter-spacing: 0.5px;
}}

.title {{
  font-family: 'Comfortaa', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: #5c1833;
  margin-bottom: 2px;
}}
.subtitle {{
  font-family: 'Caveat', cursive;
  font-size: 21px;
  color: #d14975;
  margin-bottom: 16px;
}}

/* Meta Grid */
.meta-grid {{
  display: grid;
  grid-template-columns: 0.8fr 1.3fr 1.1fr 1.8fr;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #f3d7e3;
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 14px;
}}
.meta-item {{
  display: flex;
  flex-direction: column;
}}
.meta-label {{
  font-size: 10.5px;
  font-weight: 700;
  color: #a86880;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}}
.meta-val {{
  font-size: 13.5px;
  font-weight: 700;
  color: #4a1f30;
}}

/* Text Paragraph */
.desc {{
  font-size: 14px;
  line-height: 1.48;
  color: #592e40;
  margin-bottom: 12px;
}}

.footer-note {{
  font-family: 'Caveat', cursive;
  font-size: 19px;
  color: #8c264a;
  display: flex;
  align-items: center;
  gap: 8px;
}}

/* Stub / Отрывной корешок */
.stub {{
  width: 270px;
  background: linear-gradient(145deg, #fff9fc 0%, #ffedf4 100%);
  padding: 28px 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  text-align: center;
  position: relative;
}}

.stub-frame {{
  position: absolute;
  inset: 12px;
  border: 1px solid #f2d3e0;
  border-radius: 10px;
  pointer-events: none;
}}

.stub-title {{
  font-family: 'Comfortaa', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #8c264a;
  text-transform: uppercase;
  letter-spacing: 1.2px;
}}

.monkey-box {{
  width: 72px;
  height: 72px;
  background: #ffffff;
  border: 1.5px solid #f2cad9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(140, 38, 74, 0.08);
}}
.monkey-box img {{
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
}}

.stub-code {{
  font-family: 'Comfortaa', monospace;
  font-size: 11px;
  color: #8a576b;
  margin-top: 4px;
}}

.status-pill {{
  background: #8c264a;
  color: #ffffff;
  font-family: 'Comfortaa', sans-serif;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 12px;
  letter-spacing: 0.5px;
}}

.stub-sig {{
  font-family: 'Caveat', cursive;
  font-size: 18px;
  color: #5c1833;
}}
</style>
</head>
<body>

<div class="ticket">
  <!-- Main Part -->
  <div class="main">
    <div class="notch-top"></div>
    <div class="notch-bot"></div>
    <div class="inner-frame"></div>

    <div>
      <div class="badge-row">
        <span class="badge">Пригласительный билет</span>
        <span class="ticket-num">№ 24 • СЕРИЯ 21.11.2026</span>
      </div>
      <div class="title">Праздничный ужин в ресторане</div>
      <div class="subtitle">В честь 24-летия Дашули ✨</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Кому</span>
        <span class="meta-val">Даше ❤️</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">С кем</span>
        <span class="meta-val">Слава (Loveашик)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Формат</span>
        <span class="meta-val">Столик на двоих</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Дата</span>
        <span class="meta-val">Любой день по твоему выбору</span>
      </div>
    </div>

    <div class="desc">
      Все 24 секрета найдены! Этот билет даёт право на праздничный ужин в ресторане: любые блюда и десерты из меню, напитки, уютную атмосферу и вечер только для нас двоих.
    </div>

    <div class="footer-note">
      <span>Действителен при личном предъявлении любимому человеку</span>
    </div>
  </div>

  <!-- Stub (Отрывной корешок) -->
  <div class="stub">
    <div class="stub-frame"></div>
    <div class="stub-title">Контрольный талон</div>

    <div class="monkey-box">
      <img src="{abibyan_img}" alt="Абибян">
    </div>

    <div class="status-pill">ПРЕДЪЯВИТЬ СЛАВЕ</div>

    <div>
      {make_barcode()}
      <div class="stub-code">2111-2002-2026-LOVE</div>
    </div>

    <div class="stub-sig">
      С любовью, твой Loveашик ♥
    </div>
  </div>
</div>

</body>
</html>
"""

html_path = os.path.join(DIST, 'ticket_mockup.html')
png_path = os.path.join(DIST, 'ticket_preview.png')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print('Rendering ticket mockup via Chrome...')
try:
    subprocess.run([
        CHROME,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=1080,560',
        '--screenshot=' + png_path,
        html_path
    ], check=True)
except subprocess.CalledProcessError:
    if not os.path.exists(png_path) or os.path.getsize(png_path) == 0:
        raise

# Copy to brain artifact directory as well
brain_dir = '/Users/emoorpheus/.gemini/antigravity/brain/2481af4c-0ad5-450b-af55-9f2c9b6c70f4'
if os.path.exists(brain_dir):
    shutil.copyfile(png_path, os.path.join(brain_dir, 'ticket_preview.png'))
    print('Copied to brain artifact dir.')

print('Done: dist/ticket_preview.png generated successfully.')
