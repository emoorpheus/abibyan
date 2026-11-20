#!/usr/bin/env python3
"""Builds src/speech.js — the monkey's voice.

Every line the monkey says (tools/lines.js) plus a word / syllable bank (for typed «Повторюшка» text and custom
names) is spoken by Silero TTS (v4_ru, speaker xenia) and then transformed toward the owner's reference recordings
(assets/voice_src/v*.ogg): WORLD vocoder re-synthesis with the pitch moved to ~570 Hz (range compressed), formants
scaled x1.6, tempo x0.92, then an EQ matched to the long-term spectrum of the references.
Clips are mono 22.05 kHz MP3, base64, keyed by normalized text (same norm() as audio.js).

usage: python3 tools/tts.py [--lines-only]
"""
import os, sys, re, json, hashlib, subprocess, base64, io, time, warnings
warnings.filterwarnings('ignore')
import numpy as np, soundfile as sf, pyworld as pw
from scipy.signal import firwin2, fftconvolve

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = '/data/voice' if os.path.exists('/data/voice') else os.path.expanduser('~/.cache/abibyan_voice')
CACHE = os.path.join(WORK, 'cache')
MODEL_CANDIDATES = [
    os.path.join('/data/voice', 'v4_ru.pt'),
    os.path.expanduser('~/.cache/torch/hub/snakers4_silero-models_master/src/silero/model/v4_ru.pt'),
    os.path.join(WORK, 'v4_ru.pt')
]
MODEL = next((p for p in MODEL_CANDIDATES if os.path.exists(p)), MODEL_CANDIDATES[0])
REFS = [os.path.join(ROOT, 'assets', 'voice_src', 'v%d.ogg' % i) for i in (2, 3, 4)]
SR = 48000
WDUR = 0.8   # words / syllables for typed text are spoken a bit faster (they get glued together)
N_WORDS = 1700
P = dict(f0t=570.0, rng=0.5, fs=1.6, dur=0.92, spk='xenia', v=3)
# Round 21: the owner picked voice B in the Round 20 A/B (tools/voice_ab.py): lines / reactions 32k (was 40k), words / syllables 24k (was 32k)
BR_LINE, BR_WORD = '32k', '24k'
CUT = {'40k': 10500, '32k': 10500, '24k': 9500}  # LAME cut-off per bitrate (24k gets a little less top, as heard in the A/B)
os.makedirs(CACHE, exist_ok=True)

# ---------------------------------------------------------------- text helpers (keep in sync with audio.js norm())
def norm(s):
    s = s.lower().replace('ё', 'е')
    s = re.sub(r'[^a-zа-я0-9\- ]+', ' ', s)
    s = re.sub(r'(^|\s)-+|-+(\s|$)', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

# stress / spelling hints for the TTS (display text -> what Silero reads)
STRESS = {
    'тепло-тепло': 'тепл+о-тепл+о', 'тепло': 'тепл+о', 'абибян': 'абибя+н', 'абибя': 'абиб+я', 'агу': 'аг+у', 'гу-гу': 'гу-г+у', 'скууучно': 'ску+-у-учно', 'хррр': 'хр-р-р',
    'блестю': 'блест+ю', 'сфоткай': 'сф+откай', 'спатеньки': 'сп+атеньки', 'бодрячком': 'бодрячк+ом', 'скуфом': 'ск+уфом',
    'шаурмы': 'шаурм+ы', 'шаурму': 'шаурм+у', 'шаурма': 'шаурм+а', 'доширак': 'дошир+ак', 'пюрешку': 'пюр+ешку', 'лианы': 'ли+аны',
    'диванчик': 'див+анчик', 'пузо': 'п+узо', 'пузико': 'п+узико', 'мозоль': 'моз+оль', 'зарядки': 'зар+ядки', 'объедение': 'объед+ение',
    'вкуснятина': 'вкусн+ятина', 'пушистик': 'пуш+истик', 'шашлычок': 'шашлыч+ок', 'чистенький': 'ч+истенький', 'энергетик': 'энерг+етик',
    'диет-чай': 'ди+ет-ч+ай', 'тёпленькая': 'тёпленькая', 'вжух': 'вж+ух', 'буэ': 'бу+э', 'скуф': 'ск+уф', 'пельмени': 'пельм+ени',
    'урчит': 'урч+ит', 'милашка': 'мил+ашка', 'обнимашки': 'обним+ашки', 'бананчик': 'бан+анчик', 'малыш': 'мал+ыш',
    'дашулик': 'даш+улик', 'дашулика': 'даш+улика', 'дашулику': 'даш+улику', 'дашуликом': 'даш+уликом',
    'оставшиеся': 'ост+авшиеся', 'кусочки': 'кус+очки', 'положил': 'полож+ил', 'холодильник': 'холод+ильник',
    'сбудется': 'сб+удется', 'хэллуин': 'хэллоу+ин', 'отвалилась': 'отвал+илась', 'спрятал': 'спр+ятал',
    'сердечки': 'серд+ечки', 'сердечко': 'серд+ечко', 'секретами': 'секр+етами',
}
LINE_TTS = {  # whole-line overrides
    'Абибя-а-ан!': 'Абибя+-а-а+ан!',
}
def tts_text(line):
    if line in LINE_TTS: return LINE_TTS[line]
    def rep(m):
        w = m.group(0); k = w.lower()
        if k in STRESS:
            r = STRESS[k]; return r[0].upper() + r[1:] if w[0].isupper() else r
        return w
    return re.sub(r'[А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)*', rep, line)

# ---------------------------------------------------------------- audio pipeline
_model = None
def model():
    global _model
    if _model is None:
        import torch
        torch.set_num_threads(2)
        _model = torch.package.PackageImporter(MODEL).load_pickle('tts_models', 'model'); _model.to('cpu')
    return _model

def synth(text):
    a = model().apply_tts(text=text, speaker=P['spk'], sample_rate=SR, put_accent=True, put_yo=True)
    return a.numpy().astype(np.float64)

def world_xf(x, sr=SR, f0t=None, rng=None, fs=None, dur=None, fp=5.0):
    f0t = f0t or P['f0t']; rng = P['rng'] if rng is None else rng; fs = fs or P['fs']; dur = dur or P['dur']
    x = np.concatenate([np.zeros(int(0.03 * sr)), x, np.zeros(int(0.03 * sr))])
    f0, t = pw.dio(x, sr, f0_floor=70, f0_ceil=700, frame_period=fp); f0 = pw.stonemask(x, f0, t, sr)
    sp = pw.cheaptrick(x, f0, t, sr); ap = pw.d4c(x, f0, t, sr)
    v = f0 > 0
    med = 245.0  # fixed source median (xenia) so short clips are not re-centred individually
    f0n = np.where(v, f0t * (f0 / med) ** rng, 0.0)
    nb = sp.shape[1]; k = np.arange(nb); src = k / fs
    lsp = np.log(sp + 1e-16)
    spn = np.exp(np.array([np.interp(src, k, row) for row in lsp]))
    apn = np.array([np.interp(src, k, row) for row in ap])
    if dur != 1.0:
        n = sp.shape[0]; m = max(2, int(round(n * dur))); pos = np.linspace(0, n - 1, m)
        i0 = np.floor(pos).astype(int); i1 = np.minimum(i0 + 1, n - 1); w = (pos - i0)[:, None]
        spn = np.exp(np.log(spn[i0]) * (1 - w) + np.log(spn[i1]) * w)
        apn = apn[i0] * (1 - w) + apn[i1] * w
        vv = (f0n[i0] > 0) & (f0n[i1] > 0)
        f0n = np.where(vv, f0n[i0] * (1 - w[:, 0]) + f0n[i1] * w[:, 0], np.where(w[:, 0] < 0.5, f0n[i0], f0n[i1]))
    return pw.synthesize(np.ascontiguousarray(f0n), np.ascontiguousarray(spn), np.ascontiguousarray(apn), sr, frame_period=fp)

def ltas(x, sr, n=2048, hop=512):
    w = np.hanning(n); fr = []; pk = np.abs(x).max() + 1e-9
    for i in range(0, len(x) - n, hop):
        seg = x[i:i + n]
        if np.sqrt((seg ** 2).mean()) < pk * 10 ** (-35 / 20): continue
        fr.append(np.abs(np.fft.rfft(seg * w)) ** 2)
    return np.fft.rfftfreq(n, 1 / sr), np.mean(fr, 0)

def smooth_oct(f, Pw, frac=1 / 3):
    out = np.empty_like(Pw)
    for i, fc in enumerate(f):
        if fc <= 0: out[i] = Pw[i]; continue
        m = (f >= fc * 2 ** (-frac / 2)) & (f <= fc * 2 ** (frac / 2)); out[i] = Pw[m].mean()
    return out

def load_refs():
    xs = []
    for p in REFS:
        y, sr = sf.read(p)
        if y.ndim > 1: y = y.mean(1)
        if sr != SR:
            import scipy.signal as ss; y = ss.resample_poly(y, SR, sr)
        xs.append(y / (np.abs(y).max() + 1e-9))
    return np.concatenate(xs)

def design_eq(tts_corpus, ntaps=1023, clamp=18):
    ref = load_refs()
    fr, Pr = ltas(ref, SR); ft, Pt = ltas(tts_corpus, SR)
    d = 10 * np.log10(smooth_oct(fr, Pr) + 1e-20) - 10 * np.log10(smooth_oct(ft, Pt) + 1e-20)
    band = (ft > 500) & (ft < 6000); d -= d[band].mean()
    d = np.clip(d, -clamp, clamp); d[ft < 250] = np.minimum(d[ft < 250], -24)
    g = 10 ** (d / 20); g[0] = 0
    return firwin2(ntaps, ft / (SR / 2), g)

def finish(y, h, sr=SR):
    y = fftconvolve(y, h, mode='same')
    win = int(0.01 * sr); n = len(y) // win
    if n < 3: return y
    r = np.sqrt((y[:n * win].reshape(n, win) ** 2).mean(1) + 1e-12); pk = r.max()
    on = r > pk * 10 ** (-38 / 20)
    idx = np.where(on)[0]; a = max(0, idx[0] - 2) * win; b = min(len(y), (idx[-1] + 3) * win)
    # soft gate for near-silent frames (pauses inside the line)
    g = np.clip((20 * np.log10(r / pk) + 50) / 10, 0, 1); g = np.repeat(g, win); g = np.concatenate([g, np.full(len(y) - len(g), g[-1])])
    g = np.convolve(g, np.ones(win) / win, mode='same'); y = y * g
    y = y[a:b]
    fade = int(0.006 * sr); y[:fade] *= np.linspace(0, 1, fade); y[-fade:] *= np.linspace(1, 0, fade)
    # loudness: voiced RMS to -17 dBFS, peak limit
    rr = np.sqrt((y ** 2).mean()); act = r[on].mean() if on.any() else rr
    y = y * (10 ** (-17 / 20) / (act + 1e-9))
    pkv = np.abs(y).max()
    if pkv > 0.80: y = np.tanh(y / 0.80 * 0.95) * 0.80 / np.tanh(0.95)
    return y

def mp3(y, br=BR_LINE):
    # the formants sit ~1.6x higher than in normal speech, so keep LAME from low-passing them away at low bitrates
    wav = io.BytesIO(); sf.write(wav, y.astype(np.float32), SR, format='WAV', subtype='FLOAT')
    try:
        p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'wav', '-i', 'pipe:0', '-af', 'aresample=22050:resampler=soxr', '-ac', '1', '-c:a', 'libmp3lame',
                            '-b:a', br, '-cutoff', str(CUT.get(br, 10500)), '-write_xing', '0', '-id3v2_version', '0', '-f', 'mp3', 'pipe:1'], input=wav.getvalue(), capture_output=True)
        if p.returncode == 0 and len(p.stdout) > 0:
            return p.stdout
    except Exception:
        pass
    import av
    out = io.BytesIO()
    container = av.open(out, mode='w', format='mp3')
    stream = container.add_stream('libmp3lame', rate=22050)
    stream.bit_rate = int(br.rstrip('k')) * 1000
    stream.layout = 'mono'
    resampler = av.AudioResampler(format='fltp', layout='mono', rate=22050)
    frame = av.AudioFrame.from_ndarray(y.astype(np.float32).reshape(1, -1), format='flt', layout='mono')
    frame.sample_rate = SR
    for r_frame in resampler.resample(frame):
        for packet in stream.encode(r_frame):
            container.mux(packet)
    for packet in stream.encode(None):
        container.mux(packet)
    container.close()
    return out.getvalue()

def key_of(*a): return hashlib.sha1(json.dumps([P, a], ensure_ascii=False).encode()).hexdigest()[:16]

def raw_xf(text, dur=None):
    """TTS + WORLD transform (before EQ), cached as .npy"""
    k = key_of('raw', text) if dur is None else key_of('raw', text, dur); f = os.path.join(CACHE, k + '.npy')
    if os.path.exists(f): return np.load(f)
    y = world_xf(synth(text), dur=dur); np.save(f, y.astype(np.float32)); return y

def clip(text, h, br, dur=None):
    k = key_of('mp3c', text, br, dur, hashlib.sha1(h.tobytes()).hexdigest()[:8]); f = os.path.join(CACHE, k + '.mp3'); fj = f + '.json'
    if os.path.exists(f) and os.path.exists(fj): return open(f, 'rb').read(), json.load(open(fj))
    y = finish(raw_xf(text, dur).astype(np.float64), h)
    meta = {'d': round(len(y) / SR, 3)}
    b = mp3(y, br); open(f, 'wb').write(b); json.dump(meta, open(fj, 'w')); return b, meta

def syl_clip(text, h):
    """CV syllable unit for spelling unknown words: [mp3, dur, consonant length]; only the consonant + ~0.2 s of the vowel is ever used"""
    k = key_of('syl', text, WDUR, hashlib.sha1(h.tobytes()).hexdigest()[:8], *([BR_WORD] if BR_WORD != '32k' else [])); f = os.path.join(CACHE, k + '.mp3'); fj = f + '.json'
    if os.path.exists(f) and os.path.exists(fj): m = json.load(open(fj)); return open(f, 'rb').read(), m['d'], m['c']
    y = finish(raw_xf(text, WDUR).astype(np.float64), h); c = cons_len(text, h, WDUR) if len(text) == 2 else 0.0
    n = min(len(y), int((c + 0.23) * SR)); y = y[:n].copy(); fade = int(0.03 * SR); y[-fade:] *= np.linspace(1, 0, fade)
    b = mp3(y, BR_WORD); m = {'d': round(n / SR, 3), 'c': c}; open(f, 'wb').write(b); json.dump(m, open(fj, 'w')); return b, m['d'], c

def cons_len(text, h, dur=None):
    """for CV syllable units: time (s) where the vowel reaches full strength (consonant part = [0, t])"""
    y = finish(raw_xf(text, dur).astype(np.float64), h); win = int(0.005 * SR); n = len(y) // win
    r = 20 * np.log10(np.sqrt((y[:n * win].reshape(n, win) ** 2).mean(1)) + 1e-9); mx = r.max()
    i = int(np.argmax(r >= mx - 7)); return round(max(0.02, i * 0.005 - 0.012), 3)

# ---------------------------------------------------------------- what to generate
EXTRA = '''абибян абибяша абибянчик обезьянка обезьяна обезьянки обезьянку мартышка мартышку макака банан банана бананы бананов бананчик бананчики
привет приветик пока покеда здравствуй здравствуйте салют хай ку люблю любишь любит любимый любимая обожаю нравишься нравится
хороший хорошая хорошо плохой плохо милый милая милаха милашка красивый красавчик умный умница умничка молодец глупый глупыш дурак дурачок
балбес вредина вредный смешной смешно весёлый грустный грустно злой добрый пушистый пушистик мягкий тёплый лапочка солнышко зайка зайчик котик
киса малыш малышка мама папа мамочка папочка бабушка дедушка брат братик сестра сестрёнка друг дружок подруга кушать покушать кушай ешь пей
спать спи поспи играть поиграй гулять погуляем танцуй танцевать пой петь прыгай беги стой сиди иди сюда туда домой дома школа садик
кот кошка котёнок собака собачка щенок мышка мышь хомяк попугай рыбка игрушка мишка мячик конфета конфетка печенька печенье шоколад торт
мороженое яблоко молоко молочко каша суп вода сок чай кофе пицца шаурма бургер пельмени арбуз пузико пузо животик нос носик ухо ушки уши
хвост хвостик лапа лапка лапки шерсть обнимашки обними обнимаю поцелуй целую чмок спокойной ночи доброе утро добрый день вечер как дела
отлично нормально круто класс классно супер ура ого вау ой ай ох эх ах ха хи ням скажи повтори слово ещё давай нельзя можно спасибо
пожалуйста извини прости да нет конечно ладно окей ок понятно что кто где когда почему зачем сколько какой какая это тут там здесь
лол кек капец блин фу фуу ура хаха хахаха хихи ахах ахаха ммм угу неа ага хм бе бэ мяу гав кря му хрю пук пукнул какашка
скучно скучаешь соскучился голодный голоден устал спатки баиньки сладких снов смотри посмотри слушай послушай знаешь умеешь можешь хочешь
расти вырос большой маленький толстый худой сильный быстрый медленно громко тихо высоко низко вверх вниз прыгать бегать летать
сегодня завтра вчера сейчас потом утром вечером ночью днём неделя год лет день рождения праздник подарок
'''
NAMES = '''маша саша даша аня катя настя миша дима ваня лиза соня полина артём максим егор никита илья алиса вика оля таня лена женя паша
серёжа андрей алексей наташа юля света ксюша кирилл матвей тимофей варя ева мила вера надя люба коля петя вова лёша костя рома денис
влад марк лев тимур арина злата ульяна милана диана кира эля валя гоша гриша федя стёпа ярик ника алина ангелина вероника кристина
'''
NUMS = '''ноль один одна два две три четыре пять шесть семь восемь девять десять одиннадцать двенадцать тринадцать четырнадцать пятнадцать
шестнадцать семнадцать восемнадцать девятнадцать двадцать тридцать сорок пятьдесят шестьдесят семьдесят восемьдесят девяносто сто двести
триста четыреста пятьсот шестьсот семьсот восемьсот девятьсот тысяча тысячи тысяч миллион миллиона миллионов
'''
BAD = re.compile(r'(бля|хуй|хуе|хуё|пизд|ебa|еба|ёба|ебу|ебл|ёб|сука|суки|мудак|пидор|пидар|залуп|гандон|шлюх|дерьм|говн|жоп|сран|срат|трах)')
CONS = 'бвгджзйклмнпрстфхцчшщ'; VOW = 'аоуыэяёюие'
# common things people type into «Повторюшка» — whole phrases sound more natural than glued words
PHRASES = ['Привет!', 'Привет, Абибян!', 'Абибян!', 'Как дела?', 'Привет, как дела?', 'Я тебя люблю!', 'Абибян, я тебя люблю!', 'Ты хороший!', 'Ты милый!',
           'Ты лучший!', 'Ты смешной!', 'Абибян хороший!', 'Спокойной ночи!', 'Доброе утро!', 'Пока!', 'Пока-пока!', 'Как тебя зовут?', 'Меня зовут Абибян!',
           'Ты кто?', 'Что делаешь?', 'Ты голодный?', 'Хочешь банан?', 'Давай играть!', 'Молодец!', 'Умница!', 'Я дома!', 'Я пришёл!', 'Я пришла!',
           'Ты дурак!', 'Сам дурак!', 'Скажи мама!', 'Мама!', 'Папа!', 'Я тоже тебя люблю!', 'Ты мой друг!', 'Обезьянка!', 'Банан!', 'Ура!', 'Да!', 'Нет!']
FX = {'giggle': ['Хи-хи-хи!', 'Хи-хи!'], 'happy': ['Уии!', 'Ммм!'], 'sad': ['Ох...', 'Эх...'], 'yawn': ['А-а-ах...'], 'boop': ['Ой!']}

def get_lines():
    out = subprocess.run(['node', os.path.join(ROOT, 'tools', 'lines.js')], capture_output=True, text=True, cwd=ROOT).stdout
    return json.loads(out)

def get_words(lines, total=None):
    """word bank: words of the game lines, pet/kid words, numerals, names, then the most frequent words (OpenSubtitles) up to N_WORDS"""
    total = total or N_WORDS; words = {}  # norm key -> tts text
    def add(w):
        w = w.strip().lower()
        if not w or not re.fullmatch(r'[а-яё]+(-[а-яё]+)*', w) or BAD.search(w): return
        k = norm(w)
        if k not in words: words[k] = w
    for l in lines:
        for w in re.findall(r'[А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)*', l): add(w)
    for w in (EXTRA + NUMS + NAMES).split(): add(w)
    for row in open(os.path.join(WORK, 'ru_50k.txt'), encoding='utf-8'):
        if len(words) >= total: break
        w = row.split()[0]
        if not re.fullmatch(r'[а-яё]+(-[а-яё]+)?', w) or BAD.search(w): continue
        if len(w) == 1 and w not in 'яиаоувксж': continue
        add(w)
    return words

def syl_units():
    u = {}
    for v in VOW: u[v] = v
    for c in CONS:
        if c == 'й': continue
        for v in VOW: u[c + v] = c + v
    return u

def b64(b): return base64.b64encode(b).decode('ascii')

def main():
    lines = get_lines(); t0 = time.time()
    print('lines', len(lines), flush=True)
    eqf = os.path.join(ROOT, 'tools', 'eq_fir.npy')
    if os.path.exists(eqf) and '--re-eq' not in sys.argv: h = np.load(eqf)
    else:
        corpus = np.concatenate([raw_xf(tts_text(l)) for l in lines]); h = design_eq(corpus.astype(np.float64)); np.save(eqf, h)
        print('eq designed', round(time.time() - t0, 1), flush=True)
    out = {'lines': {}, 'words': {}, 'syl': {}, 'fx': {}}
    for i, l in enumerate(lines + [p for p in PHRASES if norm(p) not in {norm(x) for x in lines}]):
        b, m = clip(tts_text(l), h, BR_LINE); out['lines'][norm(l)] = [b64(b), m['d']]
    print('lines done', round(time.time() - t0, 1), flush=True)
    for k, arr in FX.items():
        out['fx'][k] = []
        for l in arr:
            b, m = clip(l, h, BR_LINE); out['fx'][k].append([b64(b), m['d']])
    if '--lines-only' not in sys.argv:
        su = syl_units()
        for i, (k, t) in enumerate(su.items()):
            b, d, c = syl_clip(t, h); out['syl'][k] = [b64(b), d, c]
        print('syl done', len(su), round(time.time() - t0, 1), flush=True)
        words = get_words(lines)
        for i, (k, w) in enumerate(words.items()):
            try:
                b, m = clip(tts_text(w), h, BR_WORD, WDUR); out['words'][k] = [b64(b), m['d']]
            except Exception as e: print('skip', w, e, flush=True)
            if i % 200 == 0: print('words', i, len(words), round(time.time() - t0, 1), flush=True)
    js = "'use strict';\n// ===== Monkey voice: every line + word/syllable bank, built by tools/tts.py (Silero TTS -> WORLD -> EQ matched to assets/voice_src) =====\nconst SPEECH = " + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
    dst = os.path.join(ROOT, 'src', 'speech.js'); open(dst, 'w', encoding='utf-8').write(js)
    print('wrote', dst, len(js) // 1024, 'KB', 'lines', len(out['lines']), 'words', len(out['words']), 'syl', len(out['syl']), round(time.time() - t0, 1), 's', flush=True)

if __name__ == '__main__':
    main()
