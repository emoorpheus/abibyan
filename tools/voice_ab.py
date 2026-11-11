#!/usr/bin/env python3
"""Round 20: a lighter voice? — builds dist/abibyan-voice-ab.html to listen to and pick a variant.
The game keeps its current voice (src/speech.js, src/voice_rec.js) until the owner picks.

Every clip is re-encoded from the source, not from the shipped MP3: TTS lines / words from the TTS cache (/data/voice/cache raw .npy →
the same finish() + EQ as tools/tts.py), his recordings from the originals (tools/rec.py: load() + finish()).
  A — as now: lines, reactions, his recordings 40 kbit/s; words / syllables 32 kbit/s (22.05 kHz, cut-off 10.5 kHz)
  B — lighter: 32 / 24 kbit/s (22.05 kHz)
  C — lightest: 24 / 20 kbit/s (16 kHz, cut-off 7.6 / 7 kHz)
A uses the very clips the game plays where it has them (lines, his recordings); typed text is glued from words encoded the same way.
The page shows what the whole voice would weigh with each variant (the shipped bank × the size ratio measured on these clips).
Round 21: the owner picked B — the game ships it (tools/voice_rebank.py, tools/rec.py); this page stays as the record of the choice.
usage: python3 tools/voice_ab.py   (needs numpy, soundfile, scipy, pyworld; ffmpeg with rubberband)"""
import os, sys, io, json, base64, subprocess, warnings, html
warnings.filterwarnings('ignore')
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); sys.path.insert(0, HERE)
import numpy as np, soundfile as sf
import tts
_argv = sys.argv; sys.argv = [_argv[0]]; import rec; sys.argv = _argv  # rec.py reads its source folder from argv[1]

V = {  # kind -> (bitrate, sample rate, cut-off Hz)
    'A': {'name': 'Как сейчас', 'line': ('40k', 22050, 10500), 'word': ('32k', 22050, 10500)},
    'B': {'name': 'Легче', 'line': ('32k', 22050, 10500), 'word': ('24k', 22050, 9500)},
    'C': {'name': 'Ещё легче', 'line': ('24k', 16000, 7600), 'word': ('20k', 16000, 7000)},
}
LINES = ['Привет, Абибян!', 'Ням?', 'Печенька!', 'Трещит!', 'Шаурмы бы...', 'Я полон сил!', 'Пахнет свежестью!', 'Ага, вот ты где!',
         'Фу, я весь грязный!', 'А у меня нос чует бананы!', 'Скромник! Не прячься под маской!']
PHRASES = ['привет как дела', 'я люблю тебя мама', 'ты мой лучший друг', 'большой банан']  # typed «Повторюшка» text, glued from words
N_REC = 3

def enc(y, sr_in, br, sr, cut):
    wav = io.BytesIO(); sf.write(wav, y.astype(np.float32), sr_in, format='WAV', subtype='FLOAT')
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'wav', '-i', 'pipe:0', '-af', 'aresample=%d:resampler=soxr' % sr, '-ac', '1', '-c:a', 'libmp3lame',
                        '-b:a', br, '-cutoff', str(cut), '-write_xing', '0', '-id3v2_version', '0', '-f', 'mp3', 'pipe:1'], input=wav.getvalue(), capture_output=True)
    if p.returncode: raise RuntimeError(p.stderr.decode()[:300])
    return p.stdout

def raw(text, dur=None):
    k = tts.key_of('raw', text) if dur is None else tts.key_of('raw', text, dur); f = os.path.join(tts.CACHE, k + '.npy')
    return np.load(f) if os.path.exists(f) else None

def b64(b): return base64.b64encode(b).decode('ascii')
def is40(s):  # Round 21: the game ships B now — A falls back to encoding from the source
    h = base64.b64decode(s[:8]); return len(h) > 2 and h[0] == 0xff and (h[2] >> 4) == 5

def bank_sizes():
    """b64 characters per section of the shipped bank (what the site's voice1/voice2.txt carry)"""
    out = {}
    for f in ('speech.js', 'voice_rec.js'):
        s = open(os.path.join(ROOT, 'src', f), encoding='utf-8').read(); s = s[s.index('{', s.index('=')):s.rindex('}') + 1]; o = json.loads(s)
        if f == 'voice_rec.js': o = {'rec': o}
        for sec, d in o.items():
            n = 0
            def walk(x):
                nonlocal n
                if isinstance(x, str) and len(x) > 200: n += len(x)
                elif isinstance(x, list): [walk(i) for i in x]
                elif isinstance(x, dict): [walk(i) for i in x.values()]
            walk(d); out[sec] = n
    return out

def main():
    h = np.load(os.path.join(HERE, 'eq_fir.npy')); clips = []; same = 0
    shipped = json.loads((lambda s: s[s.index('{', s.index('=')):s.rindex('}') + 1])(open(os.path.join(ROOT, 'src', 'speech.js'), encoding='utf-8').read()))
    for l in LINES:
        r = raw(tts.tts_text(l))
        if r is None: print('skip (not in the TTS cache):', l); continue
        y = tts.finish(r.astype(np.float64), h); c = {'kind': 'line', 'text': l, 'd': round(len(y) / tts.SR, 2)}
        for v, o in V.items(): c[v] = b64(enc(y, tts.SR, *o['line']))
        k = tts.norm(l)
        if k in shipped['lines'] and is40(shipped['lines'][k][0]): c['A'] = shipped['lines'][k][0]; same += 1  # A is exactly the clip the game played
        clips.append(c)
    words = tts.get_words(tts.get_lines()); gap = np.zeros(int(0.05 * tts.SR))
    for p in PHRASES:
        parts = []
        for w in p.split():
            r = raw(tts.tts_text(words.get(w, w)), tts.WDUR)
            if r is None: parts = None; break
            parts += [tts.finish(r.astype(np.float64), h), gap]
        if not parts: print('skip (a word not in the cache):', p); continue
        y = np.concatenate(parts[:-1]); c = {'kind': 'word', 'text': p.capitalize(), 'd': round(len(y) / tts.SR, 2)}
        for v, o in V.items(): c[v] = b64(enc(y, tts.SR, *o['word']))
        clips.append(c)
    fs = rec.files(); n = 0; s_ = open(os.path.join(ROOT, 'src', 'voice_rec.js'), encoding='utf-8').read(); shipped_rec = json.loads(s_[s_.index('{', s_.index('=')):s_.rindex('}') + 1])
    for num, it in sorted(rec.REC.items()):
        if n >= N_REC or num not in fs: continue
        text = rec.MAN[it]['text'] if isinstance(it, int) else it
        y = rec.finish(rec.load(fs[num])); d = len(y) / rec.SR
        if not 0.8 <= d <= 3.5: continue
        c = {'kind': 'rec', 'text': text, 'd': round(d, 2)}
        for v, o in V.items(): c[v] = b64(enc(y, rec.SR, *o['line']))
        k = rec.norm(text)
        if k in shipped_rec and is40(shipped_rec[k][0]): c['A'] = shipped_rec[k][0]; same += 1
        clips.append(c); n += 1
    # the whole voice with each variant: the shipped bank × the size ratio measured on these clips (per kind)
    bank = bank_sizes(); now = sum(bank.values()); kind_of = {'lines': 'line', 'fx': 'line', 'rec': 'rec', 'words': 'word', 'syl': 'word'}
    tot = {v: {k: sum(len(c[v]) for c in clips if c['kind'] == k) for k in ('line', 'word', 'rec')} for v in V}
    variants = {}
    for v, o in V.items():
        site = sum(n * tot[v][kind_of[s]] / max(1, tot['A'][kind_of[s]]) for s, n in bank.items())
        variants[v] = {'name': o['name'], 'line': o['line'][0], 'word': o['word'][0], 'sr': o['line'][1], 'bank': {'now': now, 'site': round(site)}}
    data = {'variants': variants, 'clips': clips, 'same_as_game': same}
    html_out = PAGE.replace('__DATA__', json.dumps(data, ensure_ascii=False).replace('</', '<\\/'))
    dst = os.path.join(ROOT, 'dist', 'abibyan-voice-ab.html'); open(dst, 'w', encoding='utf-8').write(html_out)
    print('wrote', dst, round(len(html_out) / 1024), 'KB;', len(clips), "clips; A is the game's own clip for", same, 'of them;',
          ' · '.join('%s %.1f MB' % (v, variants[v]['bank']['site'] / 1048576) for v in V))

PAGE = r'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Голос Абибяна — A / B / C</title><style>
body{margin:0;font:16px/1.4 -apple-system,'Trebuchet MS',sans-serif;background:#1d1622;color:#fff4e2}
main{max-width:640px;margin:0 auto;padding:16px}h1{font-size:22px;margin:4px 0 8px}p{margin:6px 0;opacity:.9}
.vs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.v{background:#3a2c44;border-radius:10px;padding:8px;text-align:center}
.v b{display:block;font-size:22px;color:#ffd04a}.v small{display:block;opacity:.8}
.row{display:flex;align-items:center;gap:8px;background:#2a1a27;border-radius:10px;padding:8px;margin:6px 0}.row .t{flex:1}.row .k{font-size:12px;opacity:.6;display:block}
button{font:inherit;font-weight:700;border:0;border-radius:8px;padding:10px 14px;background:#59a8ef;color:#fff;cursor:pointer;min-width:48px}
button.on{background:#ffd04a;color:#3b2433}.bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0}
.bar button{background:#6cc24a}.res{font-size:13px;opacity:.85}label{user-select:none}</style></head><body><main>
<h1>Голос Абибяна: A / B / C</h1>
<p>Послушай одни и те же фразы в трёх вариантах — лучше на телефоне, на обычной громкости. <b>A</b> — как сейчас в игре.
<b>B</b> и <b>C</b> — легче: игра будет быстрее скачиваться и открываться, но голос может стать глуше или «шершавее» (слушай шипящие: ш, щ, с, ч).</p>
<p>Напиши мне одну букву: какой самый лёгкий вариант ещё звучит так же хорошо, как A. Пока не выберешь — в игре остаётся A.</p>
<div class="vs" id="vs"></div>
<div class="bar"><label><input type="checkbox" id="blind"> Вслепую (кнопки 1-2-3 перемешаны)</label><button id="show" hidden>Показать буквы</button></div>
<div id="rows"></div><p class="res" id="res"></p></main>
<script id="ab" type="application/json">__DATA__</script>
<script>
const J = JSON.parse(document.getElementById('ab').textContent), VS = Object.keys(J.variants); let ac = null, cur = null; const cache = {};
const mb = (n) => (n / 1048576).toFixed(1).replace('.', ',') + ' МБ';
document.getElementById('vs').innerHTML = VS.map((v) => { const o = J.variants[v], d = Math.round((1 - o.bank.site / o.bank.now) * 100);
  return `<div class="v"><b>${v}</b>${o.name}<small>фразы ${o.line} · слова ${o.word} · ${o.sr / 1000} кГц</small><small>весь голос ≈ ${mb(o.bank.site)}${d > 0 ? ' (−' + d + '%)' : ''}</small></div>`; }).join('');
const KIND = { line: 'фраза из игры', word: 'набранный текст — слова подряд, как в «Повторюшке»', rec: 'твоя настоящая запись' };
function rows(blind) { const R = document.getElementById('rows'); R.innerHTML = '';
  J.clips.forEach((c, i) => { const order = blind ? VS.slice().sort(() => Math.random() - 0.5) : VS; const d = document.createElement('div'); d.className = 'row';
    d.innerHTML = `<div class="t">${c.text}<span class="k">${KIND[c.kind]} · ${c.d} с</span></div>` + order.map((v, j) => `<button data-i="${i}" data-v="${v}">${blind ? j + 1 : v}</button>`).join(''); R.appendChild(d); });
  R.querySelectorAll('button').forEach((b) => b.onclick = () => play(b)); document.getElementById('show').hidden = !blind; }
async function play(b) { // WebAudio, like the game (the context is made inside the tap — iPhone)
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state !== 'running') ac.resume();
  const c = J.clips[b.dataset.i], v = b.dataset.v, k = b.dataset.i + v;
  if (!cache[k]) { const u = Uint8Array.from(atob(c[v]), (x) => x.charCodeAt(0)); cache[k] = await new Promise((res, rej) => ac.decodeAudioData(u.buffer, res, rej)); }
  if (cur) try { cur.stop(); } catch (e) { } const s = ac.createBufferSource(); s.buffer = cache[k]; s.connect(ac.destination); s.start(); cur = s;
  document.querySelectorAll('button.on').forEach((x) => x.classList.remove('on')); b.classList.add('on');
  document.getElementById('res').textContent = 'Играет: ' + (document.getElementById('blind').checked ? 'вариант ' + b.textContent : v) + ' · ' + (c[v].length * 0.75 / 1024).toFixed(1) + ' КБ'; }
document.getElementById('blind').onchange = (e) => rows(e.target.checked);
document.getElementById('show').onclick = () => document.querySelectorAll('#rows button').forEach((b) => { b.textContent = b.dataset.v; });
rows(false);
</script></body></html>'''

if __name__ == '__main__': main()
