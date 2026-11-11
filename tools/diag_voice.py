# Voice diagnostics (systematic-debugging, phase 1): F0 + formants + spectral centroid of the reference clips vs the game output
import json, base64, subprocess, sys, os, numpy as np, parselmouth
from parselmouth.praat import call
W = '/tmp/diag'
def wav(src, dst):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', '44100', dst], check=True); return dst
def stats(paths):
    f0s, F = [], [[], [], []]; cents = []
    for p in paths:
        s = parselmouth.Sound(p)
        pi = s.to_pitch_ac(time_step=0.01, pitch_floor=150, pitch_ceiling=1100)
        fo = s.to_formant_burg(time_step=0.01, max_number_of_formants=5, maximum_formant=8000)
        sp = s.to_spectrogram(window_length=0.025, maximum_frequency=11000, time_step=0.01)
        for t in pi.ts():
            f0 = pi.get_value_at_time(t)
            if not f0 or np.isnan(f0): continue
            f0s.append(f0)
            for k in range(3):
                v = fo.get_value_at_time(k + 1, t)
                if v and not np.isnan(v): F[k].append(v)
        # spectral centroid 300 Hz–10 kHz over voiced-ish frames (energy within 30 dB of max)
        P = sp.values; fr = np.linspace(sp.ymin, sp.ymax, P.shape[0]); band = (fr > 300) & (fr < 10000)
        e = P[band].sum(0); keep = e > e.max() * 1e-3
        cents += list((fr[band, None] * P[band][:, keep]).sum(0) / P[band][:, keep].sum(0))
    q = lambda a, p: float(np.percentile(a, p)) if len(a) else float('nan')
    return dict(n=len(f0s), f0=q(f0s, 50), f0_10=q(f0s, 10), f0_90=q(f0s, 90), F1=q(F[0], 50), F2=q(F[1], 50), F3=q(F[2], 50), cent=q(cents, 50))
refs = [wav('/data/game/assets/voice_src/v%d.ogg' % i, f'{W}/ref{i}.wav') for i in (1, 2, 3, 4)]
demo = [wav('/data/game/dist/abibyan-voice-demo.mp3', f'{W}/demo.wav')]
src = open('/data/game/src/speech.js', encoding='utf-8').read(); S = json.loads(src[src.index('{'):src.rindex('}') + 1])
keys = sorted(S['lines'])[::4][:40]; lines = []
for i, k in enumerate(keys):
    m = f'{W}/l{i}.mp3'; open(m, 'wb').write(base64.b64decode(S['lines'][k][0])); lines.append(wav(m, f'{W}/l{i}.wav'))
rows = [('refs v1-v4 (присланные)', stats(refs)), ('demo mp3 (запись из игры)', stats(demo)), ('40 фраз из speech.js', stats(lines))]
print('%-28s %6s %6s %6s %6s %6s %6s %6s %6s' % ('', 'frames', 'F0med', 'F0p10', 'F0p90', 'F1', 'F2', 'F3', 'centr'))
for name, r in rows: print('%-28s %6d %6.0f %6.0f %6.0f %6.0f %6.0f %6.0f %6.0f' % (name, r['n'], r['f0'], r['f0_10'], r['f0_90'], r['F1'], r['F2'], r['F3'], r['cent']))
json.dump({n: r for n, r in rows}, open(f'{W}/diag.json', 'w'), ensure_ascii=False)
