#!/usr/bin/env python3
"""Round 9 #11 (ffmpeg-audio-processing + systematic-debugging, measure first): median F0 of his recordings (SPEECH.rec)
vs the TTS lines (SPEECH.lines). usage: python3 tools/f0_banks.py"""
import json, base64, subprocess, numpy as np, parselmouth, random, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def f0of(b64):
    open('/tmp/_c.mp3', 'wb').write(base64.b64decode(b64)); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', '/tmp/_c.mp3', '-ac', '1', '-ar', '44100', '/tmp/_c.wav'], check=True)
    p = parselmouth.Sound('/tmp/_c.wav').to_pitch_ac(time_step=0.01, pitch_floor=75, pitch_ceiling=1100); return [x for x in p.selected_array['frequency'] if x > 0]
def bank(path, key):
    s = open(os.path.join(ROOT, path), encoding='utf-8').read(); j = s.index('{', s.index(key)); return json.loads(s[j:s.rindex('}') + 1])
random.seed(1); R = bank('src/voice_rec.js', 'SPEECH.rec'); L = bank('src/speech.js', 'SPEECH')['lines']
q = lambda a: [round(float(np.percentile(a, p))) for p in (10, 50, 90)]
rv, lv = [], []
for k in random.sample(sorted(R), 20): rv += f0of(R[k][0])
for k in random.sample(sorted(L), 20): lv += f0of(L[k][0])
print('rec F0 p10/50/90', q(rv), '| tts', q(lv))
