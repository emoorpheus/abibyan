import numpy as np, wave
def load(p):
    w = wave.open(p); n = w.getnframes(); sr = w.getframerate()
    x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
    return x, sr
def yin(fr, sr, fmin=150, fmax=1200, th=0.2):
    N = len(fr); W = N // 2
    taumin, taumax = int(sr / fmax), min(int(sr / fmin), W - 1)
    d = np.array([np.dot(fr[:W] - fr[t:t + W], fr[:W] - fr[t:t + W]) for t in range(taumax + 1)])
    cm = np.ones_like(d); cs = np.cumsum(d[1:]); cm[1:] = d[1:] * np.arange(1, taumax + 1) / np.maximum(cs, 1e-12)
    for tau in range(taumin, taumax):
        if cm[tau] < th:
            while tau + 1 < taumax and cm[tau + 1] < cm[tau]: tau += 1
            a, b, c = cm[tau - 1], cm[tau], cm[tau + 1]; den = a - 2 * b + c
            return sr / (tau + (0.5 * (a - c) / den if den else 0)), cm[tau]
    return 0.0, 1.0
def track(x, sr, hop=0.01, win=0.04):
    # x at 48k -> decimate 3 to 16k for pitch
    n = len(x) - len(x) % 3; x16 = x[:n].reshape(-1, 3).mean(1); s16 = sr // 3
    H = int(hop * s16); Wn = int(win * s16)
    rms, f0, ap = [], [], []
    for i in range(0, len(x16) - Wn, H):
        fr = x16[i:i + Wn]; r = float(np.sqrt(np.mean(fr ** 2))); rms.append(r)
        if r > 0.004: f, a = yin(fr - fr.mean(), s16)
        else: f, a = 0.0, 1.0
        f0.append(f); ap.append(a)
    return np.array(rms), np.array(f0), np.array(ap)
