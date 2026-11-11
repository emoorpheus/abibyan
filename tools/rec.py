#!/usr/bin/env python3
"""Round 8 #8: his real voice — builds src/voice_rec.js (SPEECH.rec) from the owner's recordings.

The recordings (inbox/voice/озвучка/Советский N.m4a, read in the order of the script tools/script_manifest.json, plus
the friend calls recorded at the end) were matched to the script by hand with the help of the ASR transcripts
(inbox/asr/asr*.json): REC maps a recording number to its script item (int) or to its own text (str). Unclear takes
(retakes, section titles, «бабушка / дедушка», long «у-у-у», the story) are left out.
Each clip: trimmed of silence, a soft gate on the pauses, voiced RMS → −17 dBFS, peak limit (as tools/tts.py), then
mono 22.05 kHz MP3 40k, base64; keyed by the same norm() as audio.js. audio.js prefers these over the TTS lines.

usage: python3 tools/rec.py [src_dir]
"""
import os, sys, re, json, base64, subprocess, unicodedata, io
import numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else '/data/inbox/voice/озвучка'
SR = 48000
MAN = json.load(open(os.path.join(ROOT, 'tools', 'script_manifest.json')))['items']

# recording number → script item index (MAN[i]) or its own text. File «Советский.m4a» is recording 1.
REC = {
    2: 0, 3: 2, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8, 11: 9, 12: 10, 13: 11, 14: 12, 15: 13, 16: 14, 17: 15, 18: 16, 19: 17, 20: 18,
    21: 19, 22: 20, 23: 21, 25: 23, 26: 24, 27: 25, 28: 26, 29: 27, 30: 28, 31: 29, 32: 30, 33: 31, 34: 32, 35: 33, 36: 34,
    37: 35, 38: 36, 39: 37, 40: 38, 41: 39, 42: 40, 43: 41, 44: 42, 45: 43, 46: 44, 47: 45, 49: 46, 50: 47, 51: 48, 52: 49,
    53: 50, 57: 51, 58: 52, 59: 53, 60: 54, 61: 55, 62: 56, 63: 57, 64: 58, 65: 59, 66: 60, 67: 61, 68: 62, 69: 63, 70: 64,
    71: 65, 72: 66, 73: 67, 74: 68, 75: 69, 77: 70, 78: 71, 79: 72, 80: 73, 81: 74, 82: 75, 83: 76, 84: 77, 85: 78, 86: 79,
    87: 80, 88: 81, 89: 82, 92: 85, 93: 86, 94: 87, 95: 88, 96: 89, 97: 90, 98: 91, 99: 92, 100: 93, 101: 94, 102: 95,
    103: 96, 104: 97, 105: 98, 106: 99, 107: 100, 108: 101, 109: 102, 110: 103, 111: 104, 112: 105, 113: 106, 114: 107,
    115: 108, 116: 109, 117: 110, 118: 111, 119: 112, 120: 113, 121: 114, 122: 115, 123: 116, 124: 117, 125: 118, 126: 119,
    127: 120, 128: 121, 129: 122, 130: 123, 131: 124, 132: 125, 133: 126, 134: 127, 135: 128, 136: 129, 137: 130, 138: 131,
    140: 133, 141: 134, 143: 136, 144: 137, 145: 138, 146: 139, 147: 140, 148: 141, 149: 142, 150: 143, 151: 144, 152: 145,
    153: 146, 154: 147, 155: 148, 156: 149, 157: 150, 158: 151, 159: 152, 160: 153, 161: 154, 162: 155, 163: 156, 164: 157,
    165: 158, 166: 159, 167: 160, 172: 161, 173: 162, 174: 163, 175: 164, 176: 165, 177: 166, 178: 167, 181: 168, 182: 169,
    186: 170, 188: 172, 191: 176, 194: 178,
    # the friend calls, recorded at the end
    200: 'Ура, Жучок!', 201: 'Жучок, это ты?', 202: 'Жучок!', 203: 'Круто!', 204: 'Крот Монти!', 205: 'Пуся, привет!',
    206: 'Пуся!', 207: 'Комар!', 208: 'Москит!', 210: 'Комарик!',
    # Round 9 #13: his own baby whine (ASR heard «Й-э-э-э-э…»): three pulsing «э-э-э» — HOME.whine() plays it
    185: 'Э-э-э-э-э!',
}

def norm(s):  # keep in sync with audio.js normT()
    s = str(s).lower().replace('ё', 'е'); s = re.sub(r'[^a-zа-я0-9\- ]+', ' ', s); s = re.sub(r'(^|\s)-+|-+(\s|$)', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def files():
    out = {}
    for f in os.listdir(SRC):
        if not f.endswith('.m4a'): continue
        n = unicodedata.normalize('NFC', f)[:-4].replace('Советский', '').strip(); out[int(n) if n else 1] = os.path.join(SRC, f)
    return out

# Round 9 #11 (ffmpeg-audio-processing): a little higher and squeakier — +3 semitones with the formants shifted along
# (rubberband keeps the tempo), the lows thinned, a nasal dip at 700 Hz and a +5 dB presence peak at 3.2 kHz
SQUEAK = 'rubberband=pitch=%.4f:formant=shifted:pitchq=quality,highpass=f=200,equalizer=f=700:t=o:w=1:g=-2,equalizer=f=3200:t=o:w=1.2:g=5' % 2 ** (3 / 12)

def load(f):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-af', SQUEAK, '-f', 'f32le', 'pipe:1'], capture_output=True)
    if p.returncode: raise RuntimeError(p.stderr.decode()[:300])
    return np.frombuffer(p.stdout, np.float32).astype(np.float64)

def finish(y, sr=SR):  # as tools/tts.py finish(), without the EQ
    y = y - y.mean(); win = int(0.01 * sr); n = len(y) // win
    r = np.sqrt((y[:n * win].reshape(n, win) ** 2).mean(1) + 1e-12); pk = r.max(); on = r > pk * 10 ** (-34 / 20)
    idx = np.where(on)[0]; a = max(0, idx[0] - 3) * win; b = min(len(y), (idx[-1] + 4) * win)
    g = np.clip((20 * np.log10(r / pk) + 46) / 10, 0, 1); g = np.repeat(g, win); g = np.concatenate([g, np.full(len(y) - len(g), g[-1])])
    g = np.convolve(g, np.ones(win) / win, mode='same'); y = (y * g)[a:b]
    fade = int(0.008 * sr); y[:fade] *= np.linspace(0, 1, fade); y[-fade:] *= np.linspace(1, 0, fade)
    act = r[on].mean(); y = y * (10 ** (-17 / 20) / (act + 1e-9)); pkv = np.abs(y).max()
    if pkv > 0.89: y = np.tanh(y / 0.89 * 0.95) * 0.89 / np.tanh(0.95)
    return y

def mp3(y, br='32k'):  # Round 21: voice B (was 40k)
    wav = io.BytesIO(); sf.write(wav, y.astype(np.float32), SR, format='WAV', subtype='FLOAT')
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'wav', '-i', 'pipe:0', '-af', 'aresample=22050:resampler=soxr', '-ac', '1', '-c:a', 'libmp3lame',
                        '-b:a', br, '-cutoff', '10500', '-write_xing', '0', '-id3v2_version', '0', '-f', 'mp3', 'pipe:1'], input=wav.getvalue(), capture_output=True)
    if p.returncode: raise RuntimeError(p.stderr.decode()[:300])
    return p.stdout

def main():
    fs = files(); rec = {}; skipped = []
    for n, it in sorted(REC.items()):
        text = MAN[it]['text'] if isinstance(it, int) else it; k = norm(text)
        if n not in fs: skipped.append((n, 'no file')); continue
        y = finish(load(fs[n])); d = round(len(y) / SR, 3)
        if not 0.2 <= d <= 4.5: skipped.append((n, text, d)); continue
        if k in rec: continue
        rec[k] = [base64.b64encode(mp3(y)).decode('ascii'), d]
    js = "'use strict';\n// ===== Round 8 #8: his real voice — the owner's recordings (tools/rec.py), keyed like SPEECH.lines; audio.js plays these first =====\n"
    js += 'SPEECH.rec = ' + json.dumps(rec, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(os.path.join(ROOT, 'src', 'voice_rec.js'), 'w').write(js)
    print(len(rec), 'clips,', round(len(js) / 1e6, 2), 'MB; skipped', skipped)
    json.dump({k: v[1] for k, v in rec.items()}, open('/tmp/rec_durs.json', 'w'), ensure_ascii=False)

if __name__ == '__main__': main()
