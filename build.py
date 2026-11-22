import re, base64, pathlib, json, hashlib
root = pathlib.Path(__file__).resolve().parent; src = root / 'src'; dist = root / 'dist'  # Round 26: the folder build.py is in (a copy of the repo builds into its own dist/)
def voice_bank():
    sp = (src / 'speech.js').read_text(); rec = (src / 'voice_rec.js').read_text()
    S = json.loads(sp[sp.index('const SPEECH = ') + 15:].strip().rstrip(';')); S['rec'] = json.loads(rec[rec.index('SPEECH.rec = ') + 13:].strip().rstrip(';'))
    return S

BANK = voice_bank()
PRIORITY_KEYS = [
    'с днем рождения дашулик', 'сегодня твой праздник я позвал друзей',
    'кто там', 'открой меня', 'сегодня же праздник', 'ой сегодня же праздник',
    'пойдем в зал там сюрприз', 'все пришли поздравить дашулика', 'ура все пришли поздравить дашулика',
    'загадай желание и задуй свечки', 'подуй сильнее', 'еще чуть-чуть',
    'желание обязательно сбудется', 'ура желание обязательно сбудется',
    'оставшиеся кусочки я положил в холодильник', 'тортики я положил в холодильник',
    'праздничное фото все в кадр', 'праздничное фото', 'все в кадр',
    'а еще я спрятал сердечки с секретами найдешь', 'а еще я спрятал сердечки с секретами', 'найдешь',
    'а еще я спрятал сердечко с секретом найдешь',
    'сердечко', 'ой сердечко', 'нашла', 'ты нашла все сердечки', 'ура ты нашла все сердечки',
    'я спрятал следующее сердечко ищи', 'я спрятал следующее сердечко', 'ищи',
    'а следующее сердечко я спрятал в другом месте ищи',
    'горячо сердечко в этой комнате', 'холодно-холодно сердечко не здесь',
    'вот это праздник', 'это лучший праздник', 'дашулик это лучший праздник', 'дашулик',
    'привет', 'я абибян', 'теперь я живу у тебя', 'меня зовут абибян',
    'привет дашулик я абибян теперь я живу у тебя', 'привет дашулик с днем рождения',
    'ура я абибян', 'фух теперь тепло',
    'привет я так скучал', 'о ты вернулся', 'ура гости',
    'привет абибян', 'привет как дела',
    'буп', 'мой нос', 'пип', 'голова кружится', 'не мешай я сплю', 'хррр что',
    'шпашибо', 'шпашибо друзья мне так нравитшя', 'ш днем рождения дашулик'
]
def _lisp_key(s): return s.replace('с', 'ш').replace('С', 'Ш')
PRIORITY_KEYS = list(dict.fromkeys(PRIORITY_KEYS + [_lisp_key(k) for k in PRIORITY_KEYS]))
prio_lines = {k: BANK['lines'][k] for k in PRIORITY_KEYS if k in BANK['lines']}
prio_fx = BANK.get('fx', {})

order = ['pixel', 'monkey', 'items', 'rooms', 'zal', 'hall', 'kitchen', 'bath', 'balcony', 'data', 'voicebank', 'audio', 'state', 'ui', 'friends_art', 'friends', 'gags', 'album', 'tour', 'ducks', 'seasons', 'dasha', 'home', 'games', 'tut', 'routine', 'fill', 'main']
# Round 25 (restored 2026-11-08 from the live build 43ac3ef): fill.js + <canvas id="ext"> — FILL, the room's surroundings over the rest of the phone's screen
js = '\n'.join((src / f'{n}.js').read_text() for n in order)
assert '/*PRIO_LINES*/{}' in js
assert '/*PRIO_FX*/{}' in js
js = js.replace('/*PRIO_LINES*/{}', json.dumps(prio_lines, ensure_ascii=False), 1)
js = js.replace('/*PRIO_FX*/{}', json.dumps(prio_fx, ensure_ascii=False), 1)
print('priority voice: %d lines, %d fx embedded (zero-latency)' % (len(prio_lines), len(prio_fx)))
# Round 22: pictures for «24 секрета» — assets/secrets/<n>.jpg|png|webp go into the game as data: URLs (keep each under ~200 KB)
_sec = root / 'assets' / 'secrets'; _img = {}
if _sec.is_dir():
    for f in sorted(_sec.iterdir()):
        m = re.match(r'^(\d+)\.(jpe?g|png|webp)$', f.name, re.I)
        if m: _img[int(m.group(1))] = 'data:image/%s;base64,' % ('jpeg' if m.group(2).lower() in ('jpg', 'jpeg') else m.group(2).lower()) + base64.b64encode(f.read_bytes()).decode()
# ... and their texts from docs/24-secrets.md (tools/secrets_md.py)
import sys; sys.path.insert(0, str(root / 'tools')); import secrets_md, secret_box
_txt = secrets_md.parse(root / 'docs' / '24-secrets.md')
# Round 26: texts + pictures go in only as a cipher that her phrase opens (tools/secret_box.py; the phrase file is outside the repo).
# No notes → null (no question in the game); notes but no phrase → stop here, before anything is written.
_seal = None
if _txt or _img:
    _ph = secret_box.read_phrase()
    if not _ph: sys.exit('build.py: есть записки, но нет фразы — впиши «вопрос: …» и «ответ: …» в %s (файл вне репозитория, chmod 600)' % secret_box.phrase_path())
    _seal = dict(secret_box.seal({'t': _txt, 'i': _img}, _ph), n=sorted(k for k in _txt if k != 'final'), fin='final' in _txt)
assert js.count('/*DASHA_SEAL*/null') == 1; js = js.replace('/*DASHA_SEAL*/null', json.dumps(_seal, ensure_ascii=False).replace('</', '<\\/'), 1)
_ticket_file = dist / 'ticket_clean.png'
if not _ticket_file.exists():
    _ticket_file = dist / 'ticket_preview.png'
if _ticket_file.exists() and '/*TICKET_IMG*/null' in js:
    _t_b64 = 'data:image/png;base64,' + base64.b64encode(_ticket_file.read_bytes()).decode('ascii')
    js = js.replace('/*TICKET_IMG*/null', json.dumps(_t_b64), 1)
print('secrets: %d texts%s, %d pictures%s' % (len([k for k in _txt if k != 'final']), ' + the final note' if 'final' in _txt else '', len(_img), ' — locked with her phrase (question: «%s»)' % _seal['q'] if _seal else ''))
# Round 19: the voice bank (src/speech.js + src/voice_rec.js) as plain text after the first frame — group 1: lines, reactions, his
# recordings; group 2: words, syllables. '@section' then 'key\tbase64\tnumber…' (a reaction: one line per variant). Blocks ≤ 256 KB.
def voice_chunks(S, secs, cap=262144):
    out = []; cur = []; n = 0
    for sec in secs:
        hdr = '@' + sec; cur.append(hdr); n += len(hdr) + 1
        for k, v in S[sec].items():
            assert '\t' not in k and '\n' not in k
            for e in (v if sec == 'fx' else [v]):
                ln = '\t'.join([k, e[0]] + [json.dumps(x) for x in e[1:]])
                if n + len(ln) > cap and len(cur) > 1: out.append('\n'.join(cur)); cur = [hdr]; n = len(hdr) + 1
                cur.append(ln); n += len(ln) + 1
    if len(cur) > 1: out.append('\n'.join(cur))
    return out
V1 = voice_chunks(BANK, ['lines', 'fx', 'rec']); V2 = voice_chunks(BANK, ['words', 'syl'])
vblocks = ''.join('<script type="text/plain" class="vb" data-g="1">%s</script>' % c for c in V1) + '<script>AUDIO.voiceInline(1)</script>\n' + \
          ''.join('<script type="text/plain" class="vb" data-g="2">%s</script>' % c for c in V2) + '<script>AUDIO.voiceInline(2)</script>\n'
assert '</script' not in ''.join(V1 + V2)
css = (src / 'style.css').read_text()
css = re.sub(r'(?<![\w.#-])(-?\d+(?:\.\d+)?)u(?![a-zA-Z])', lambda m: f'calc(var(--u)*{m.group(1)})', css)
css += '\na.btn{text-decoration:none}\n'
def ff(file, w):
    b = base64.b64encode((root / 'assets' / file).read_bytes()).decode()
    return f"@font-face{{font-family:'Pixelify Sans';font-style:normal;font-weight:{w};font-display:block;src:url(data:font/woff2;base64,{b}) format('woff2')}}"
# fixed static subsets built by tools/fixfont.py (Cyrillic glyph fixes)
fonts = ff('pix400.woff2', 400) + ff('pix700.woff2', 700)
html = f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#1d1622"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Абибян">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<title>Мой Абибян — плюшевый тамагочи</title>
<style>{fonts}
{css}</style></head>
<body><div id="app"><canvas id="ext" width="1" height="1"></canvas><div id="stage"><canvas id="cv" width="180" height="320"></canvas><div id="ui"></div></div></div>
<script>
{js}
</script>
<script>
// when hosted on a website: installable app (manifest + offline cache); skipped for a local file
function pwa() {{
  var l = document.createElement('link'); l.rel = 'manifest'; l.href = 'manifest.webmanifest'; document.head.appendChild(l);
  var i = document.createElement('link'); i.rel = 'icon'; i.href = 'icon-192.png'; document.head.appendChild(i);
  if ('serviceWorker' in navigator) {{
    var refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {{
      if (!refreshing) {{ refreshing = true; window.location.reload(); }}
    }});
    navigator.serviceWorker.register('sw.js?v=51').then(function (reg) {{
      try {{ reg.update(); }} catch (e) {{}}
    }}).catch(function () {{}});
  }}
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {{}});
}}
if (/^https?:$/.test(location.protocol)) {{
  pwa();
}}
</script></body></html>'''
ver = hashlib.sha1((html + vblocks).encode()).hexdigest()[:10]
preloads = f'<link rel="preload" href="voice1.txt?v=v36_{ver}" as="fetch" crossorigin>\n<link rel="preload" href="voice2.txt?v=v36_{ver}" as="fetch" crossorigin>\n'
html_site = html.replace('</head>', preloads + '</head>', 1)
html_site = html_site.replace('<script>\n', f"<script>window.ABI_VOICE = 'files'; window.ABI_REV = 'v36_{ver}';</script>\n<script>\n", 1) # the website: voice1/voice2.txt
assert "ABI_VOICE = 'files'" in html_site
html = html.replace('</script></body></html>', '</script>\n' + vblocks + '</body></html>', 1); assert 'class="vb"' in html
(root / 'dist').mkdir(exist_ok=True)  # Round 26: a fresh clone (or a copy of the repo) has no dist/ yet
out = root / 'dist' / 'index.html'; out.write_text(html); (root / 'dist' / 'abibyan.html').write_text(html)  # the one-file game to send (r22: never a stale copy)
print('built', out, len(html) // 1024, 'KB')
# Round 14b: a test build for trying the shop — 100 000 coins on every start, its own save (the real one is not touched); not on the website
# Round 15b #1: …and the top level + the last growth stage («Легенда»): everything in the shop is unlocked
# Round 23: …and it lives on 21.11.2026 (the real time of day): a rehearsal of her birthday with the money, again and again
# («Начать репетицию заново» in the settings, or «abibyan-test.html#fresh»); on the website it is test.html
# Round 33: a clean test build without cheats/bonuses (0 extra coins, level 1, newborn stage) for previewing vanilla first start on 21.11
SHIFT = '''(function () { var T = window.ABI_TEST; if (!T || !T.date || window.ABI_NODATE || /nodate/.test(location.hash)) return;
  var R = Date, now = R.now(), d = new R(now), off = new R(T.date[0], T.date[1] - 1, T.date[2], d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()).getTime() - now;
  class D extends R { constructor(...a) { if (a.length) super(...a); else super(R.now() + off); } static now() { return R.now() + off; } }
  window.Date = D; T.shifted = true; })();'''
def testify(h, coins=100000, top=True, key='martyn_tamagotchi_test_v1', reset_token='20261111_fresh1', title='Абибян — ТЕСТ (21.11, 100 000 монет)'):
    cfg = {'date': [2026, 11, 21], 'resetToken': reset_token}
    if coins: cfg['coins'] = coins
    if top: cfg['top'] = True
    if key and key != 'martyn_tamagotchi_test_v1': cfg['key'] = key
    cfg_json = json.dumps(cfg)
    h = h.replace('<title>Мой Абибян — плюшевый тамагочи</title>', f'<title>{title}</title>', 1)
    test_btn = (
        '<button id="btn-test-voice" '
        'onclick="(function(){var A=window.AUDIO||(window.__game&&window.__game.AUDIO);if(A){A.init();var r=A.say(\'С днём рождения, Дашулик!\');if(!r)r=A.say(\'Привет! Я так скучал!\');if(!r)alert(\'Голос ещё загружается или ошибка\');}})()" '
        'style="position:fixed;top:8px;right:8px;z-index:999999;background:#ffd04a;color:#1a1016;border:2px solid #1a1016;border-radius:6px;padding:6px 12px;font-size:12px;font-family:sans-serif;font-weight:bold;cursor:pointer;box-shadow:0 2px 0 #1a1016;">'
        '🔊 Тест голоса'
        '</button>'
    )
    h = h.replace('<div id="ui"></div>', '<div id="ui"></div>' + test_btn, 1)
    kill_cache = """(function() {
      window.ABI_REV = 'v36_' + Date.now();
      if (location.protocol.indexOf('http') === 0 && 'serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
        navigator.serviceWorker.getRegistrations().then(function(regs) {
          for (var i = 0; i < regs.length; i++) regs[i].unregister();
        }).catch(function() {});
      }
      if (location.protocol.indexOf('http') === 0 && 'caches' in window) {
        caches.keys().then(function(ks) {
          for (var i = 0; i < ks.length; i++) caches.delete(ks[i]);
        }).catch(function() {});
      }
    })();"""
    h = h.replace('<script>\n', f'<script>window.ABI_TEST = {cfg_json};\n' + SHIFT + '\n' + kill_cache + '</script>\n<script>\n', 1)
    h = h.replace("navigator.serviceWorker.register('sw.js')", "// test build: no sw")
    assert 'window.ABI_TEST = ' in h and title in h and 'T.shifted = true' in h
    return h
test_html = testify(html)
(root / 'dist' / 'abibyan-test.html').write_text(test_html); print('built test', root / 'dist' / 'abibyan-test.html')
fresh_html = testify(html, coins=0, top=False, key='martyn_tamagotchi_fresh_v1', reset_token='20261112_clean1', title='Абибян — 21.11 (чистый запуск)')
(root / 'dist' / 'abibyan-fresh.html').write_text(fresh_html); print('built fresh', root / 'dist' / 'abibyan-fresh.html')

# ---- website / phone-app package (GitHub Pages, Netlify, any static hosting) ----
import json, hashlib, shutil, zipfile
site = root / 'dist' / 'site'; shutil.rmtree(site, ignore_errors=True); site.mkdir(parents=True)
(site / 'index.html').write_text(html_site)
(site / 'test.html').write_text(testify(html_site)) # Round 23: …/abibyan/test.html — the rehearsal on the phone (https → the microphone works)
(site / 'fresh.html').write_text(testify(html_site, coins=0, top=False, key='martyn_tamagotchi_fresh_v1', reset_token='20261112_clean1', title='Абибян — 21.11 (чистый запуск)'))
(site / 'voice1.txt').write_text('\n'.join(V1)); (site / 'voice2.txt').write_text('\n'.join(V2))
icons = ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']
for n in icons: shutil.copy(root / 'assets' / 'icons' / n, site / n)
for tf in ['abibyan-ticket.pdf', 'ticket_preview.png', 'ticket_clean.png']:
    if (root / tf).exists(): shutil.copy(root / tf, site / tf)
for cf in dist.glob('abibyan-card*'):
    if not cf.is_dir(): shutil.copy(cf, site / cf.name)
manifest = {
  'name': 'Мой Абибян', 'short_name': 'Абибян', 'description': 'Плюшевый тамагочи: корми, мой, играй и наряжай обезьянку.',
  'lang': 'ru', 'start_url': './', 'scope': './', 'display': 'standalone', 'orientation': 'portrait',
  'background_color': '#1d1622', 'theme_color': '#1d1622',
  'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
            {'src': 'icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]}
(site / 'manifest.webmanifest').write_text(json.dumps(manifest, ensure_ascii=False, indent=1))
ver = hashlib.sha1(html.encode()).hexdigest()[:10] # the one-file html holds the voice too → a new voice is a new version
sw = '''const CACHE = 'abibyan-v52-fullscreen-%s';
const CORE = ['./', './index.html', './manifest.webmanifest', %s];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.url.includes('voice1.txt') || r.url.includes('voice2.txt')) {
    e.respondWith(
      caches.match(r, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return fetch(r.url).then((res) => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); }
          return res;
        });
      }).catch(() => fetch(r.url))
    );
    return;
  }
  const isHtml = r.mode === 'navigate' || r.url.endsWith('index.html') || r.url.endsWith('/') || (r.headers.get('accept') && r.headers.get('accept').includes('text/html'));
  const req = isHtml ? new Request(r.url, { cache: 'no-cache' }) : r;
  e.respondWith(fetch(req).then((res) => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true })));
});
''' % (ver, ', '.join("'./%s'" % n for n in icons))
(site / 'sw.js').write_text(sw)
(site / '.nojekyll').write_text('')
zp = root / 'dist' / 'moy-abibyan-site.zip'
with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in sorted(site.iterdir()): z.write(f, f.name)
print('site', site, '->', zp, zp.stat().st_size // 1024, 'KB')
for f in site.iterdir():
    if not f.name.endswith('.zip'):
        (root / f.name).write_bytes(f.read_bytes())
print('copied site assets to repo root')
