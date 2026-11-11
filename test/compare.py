# side-by-side before/after sheets from test/gallery: python3 test/compare.py base after1 rooms|games out.png [scale]
import sys
from PIL import Image, ImageDraw
a, b, kind, out = sys.argv[1:5]; sc = int(sys.argv[5]) if len(sys.argv) > 5 else 2
names = ['living', 'kitchen', 'bath', 'bed', 'yard'] if kind == 'rooms' else ['catch', 'vine', 'balloon', 'bongo', 'gym']
pre = 'room_' if kind == 'rooms' else 'game_'
ims = [[Image.open(f'/data/game/test/gallery/{t}_{pre}{n}.png').convert('RGB') for n in names] for t in (a, b)]
w, h = 180 * sc, 320 * sc; gap = 6
sheet = Image.new('RGB', (len(names) * (w + gap), 2 * (h + gap) + 14), (30, 22, 30))
d = ImageDraw.Draw(sheet)
for r, row in enumerate(ims):
    for i, im in enumerate(row):
        sheet.paste(im.resize((w, h), Image.NEAREST), (i * (w + gap), 14 + r * (h + gap)))
d.text((4, 1), f'top: {a}   bottom: {b}', fill=(255, 255, 255))
sheet.save(out); print(out, sheet.size)
