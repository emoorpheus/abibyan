#!/usr/bin/env python3
"""Round 22: test signals for the candle blowing (Chromium's fake microphone plays a WAV in a loop:
--use-fake-device-for-media-stream --use-file-for-fake-audio-capture=<file>).  usage: python3 tools/blow_wavs.py <out dir>

Should blow the candles out:  blow (a strong blow close to the phone: turbulent low rumble + hiss, gusty, clipping),
soft (the same, gentle / further away), fff (a breathy «фууу»).
Should NOT:  speech (the game's own voice clips, loud, close), voice (a male voice model: 120 Hz pulses through vowel formants,
syllables), music (chiptune: square melody + triangle bass), claps (short loud claps), quiet (a quiet room)."""
import os, sys, json, base64, subprocess, tempfile
import numpy as np, soundfile as sf
from scipy.signal import butter, lfilter

SR = 24000; LEN = 4.0; N = int(SR * LEN)
rng = np.random.default_rng(22)
def rms(x): return float(np.sqrt(np.mean(x ** 2)) + 1e-12)
def norm(x, r): return x * (r / rms(x))
def bp(x, lo, hi, o=2): b, a = butter(o, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def lp(x, f, o=2): b, a = butter(o, f / (SR / 2)); return lfilter(b, a, x)
def env(n, a, d):
    e = np.ones(n); ka = int(a * SR); kd = int(d * SR); e[:ka] = np.linspace(0, 1, ka); e[n - kd:] = np.linspace(1, 0, kd); return e
def room(r=0.003): t = np.arange(N) / SR; return norm(rng.standard_normal(N), r) + r * 0.8 * np.sin(2 * np.pi * 50 * t)
def blow(level):
    x = room(); s0, s1 = int(0.5 * SR), int(3.1 * SR); n = s1 - s0
    w = rng.standard_normal(n); rumble = lp(w, 260, 1); hiss = bp(rng.standard_normal(n), 800, 7000) * 0.35
    gust = 0.65 + 0.35 * np.abs(lp(rng.standard_normal(n), 18, 1)) / 0.2; gust = np.clip(gust, 0.3, 1.6)
    b = (norm(rumble, 1) + norm(hiss, 0.45)) * gust * env(n, 0.08, 0.25); b = norm(b, level * 1.6)
    b = np.tanh(b * 2.2) / np.tanh(2.2) * (level / max(level, 0.3) if level < 0.3 else 1); b = norm(b, level)
    x[s0:s1] += b; return x
def fff():
    x = room(); s0, s1 = int(0.5 * SR), int(3.0 * SR); n = s1 - s0
    x[s0:s1] += norm(bp(rng.standard_normal(n), 900, 6000) * env(n, 0.06, 0.2), 0.09); return x
def speech(root):
    S = open(os.path.join(root, 'src', 'speech.js'), encoding='utf-8').read(); S = json.loads(S[S.index('const SPEECH = ') + 15:].strip().rstrip(';'))
    keys = [k for k in S['lines'] if len(k) > 14][:14]; out = []
    with tempfile.TemporaryDirectory() as d:
        for i, k in enumerate(keys):
            v = S['lines'][k]; b64 = v[0] if isinstance(v, list) else v
            mp3 = os.path.join(d, f'{i}.mp3'); wav = os.path.join(d, f'{i}.wav'); open(mp3, 'wb').write(base64.b64decode(b64))
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-ac', '1', '-ar', str(SR), wav], check=True)
            y, _ = sf.read(wav); out += [y, np.zeros(int(0.12 * SR))]
            if sum(len(q) for q in out) > N: break
    y = np.concatenate(out)[:N]; y = np.pad(y, (0, N - len(y)))
    act = np.abs(y) > 0.01; return room() + norm(y, 0.13) if act.any() else room()
def voice():
    t = np.arange(N) / SR; f0 = 118 + 14 * np.sin(2 * np.pi * 0.7 * t); ph = np.cumsum(f0 / SR); pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float)
    src = lfilter([1], [1, -0.97], pulses)                                    # glottal pulse train, tilted
    y = np.zeros(N); vow = [(700, 1200), (400, 2000), (300, 800), (500, 1700)]
    syl = int(0.22 * SR)
    for k in range(N // syl):
        a, b = vow[k % len(vow)]; seg = src[k * syl:(k + 1) * syl]
        v = bp(seg, a * 0.8, a * 1.25) + 0.5 * bp(seg, b * 0.85, b * 1.2); y[k * syl:(k + 1) * syl] = v * np.hanning(len(v)) ** 0.5
    return room() + norm(y, 0.14)
def music():
    t = np.arange(N) / SR; mel = [523, 659, 784, 659, 880, 784, 659, 587] * 2; bass = [131, 131, 175, 196]
    y = np.zeros(N); q = int(0.25 * SR)
    for i in range(N // q):
        f = mel[i % len(mel)]; seg = t[i * q:(i + 1) * q]; sq = np.sign(np.sin(2 * np.pi * f * seg)) * 0.5
        fb = bass[(i // 4) % len(bass)]; tri = 2 / np.pi * np.arcsin(np.sin(2 * np.pi * fb * seg))
        y[i * q:(i + 1) * q] = (sq + 0.8 * tri) * env(len(seg), 0.005, 0.03)
    return room() + norm(y, 0.15)
def claps():
    x = room(); k = int(0.015 * SR)
    for c in np.arange(0.4, LEN - 0.2, 0.5):
        i = int(c * SR); burst = bp(rng.standard_normal(int(0.12 * SR)), 600, 6000) * np.exp(-np.arange(int(0.12 * SR)) / k); x[i:i + len(burst)] += norm(burst, 0.25)
    return x
def main():
    out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/abibyan_blow'; os.makedirs(out, exist_ok=True); root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    sig = {'blow': blow(0.25), 'soft': blow(0.07), 'fff': fff(), 'speech': speech(root), 'voice': voice(), 'music': music(), 'claps': claps(), 'quiet': room()}
    info = {}
    for k, v in sig.items():
        v = np.clip(v, -0.99, 0.99); sf.write(os.path.join(out, k + '.wav'), v, SR, subtype='PCM_16'); info[k] = round(rms(v), 4)
    print(json.dumps(info))
if __name__ == '__main__': main()
