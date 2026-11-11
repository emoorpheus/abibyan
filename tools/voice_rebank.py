#!/usr/bin/env python3
"""Round 21: the owner picked voice B (Round 20 A/B, tools/voice_ab.py) — re-encodes the shipped bank in place at tools/tts.py's
BR_LINE / BR_WORD (lines and reactions 32k, words and syllables 24k). Same keys, same durations, same syllable cuts: every clip is
encoded again from its source — the TTS cache (raw .npy → finish + EQ, exactly as tools/tts.py / tts_add.py made it); a clip whose
source text is not found any more is transcoded from its MP3 (reported). His recordings: run tools/rec.py (now 32k) after this.
usage: python3 tools/voice_rebank.py [--no-synth]   (run it on the 40k bank: git checkout the Round 20 src/speech.js first)"""
import os, sys, re, json, base64, subprocess, warnings
warnings.filterwarnings('ignore')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import tts
from tts_add import load, sents, clauses

SYNTH = '--no-synth' not in sys.argv  # a source lost from the cache (rollbacks) is spoken again by Silero (deterministic), then checked by duration
def raw(text, dur=None):
    k = tts.key_of('raw', text) if dur is None else tts.key_of('raw', text, dur); f = os.path.join(tts.CACHE, k + '.npy')
    if os.path.exists(f): return np.load(f).astype(np.float64)
    if not SYNTH: return None
    try: return tts.raw_xf(text, dur).astype(np.float64)
    except Exception as e: print('synth failed', text, e, flush=True); return None

def transcode(b64, br):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'pipe:0', '-ac', '1', '-ar', str(tts.SR), '-f', 'f32le', 'pipe:1'], input=base64.b64decode(b64), capture_output=True)
    return tts.mp3(np.frombuffer(p.stdout, np.float32).astype(np.float64), br)

def main():
    head, SP, tail = load('speech.js', 'const SPEECH'); h = np.load(os.path.join(tts.ROOT, 'tools', 'eq_fir.npy')); norm = tts.norm
    lines = tts.get_lines(); cand = {}
    def add(t):
        t = t.strip()
        if norm(t): cand.setdefault(norm(t), []).append(t)
    for l in lines + tts.PHRASES:  # what tts.py and tts_add.py spoke: whole lines, their sentences, their clauses (+ the end mark tts_add adds)
        add(l)
        for sn in sents(l):
            add(sn)
            for c in clauses(sn):
                add(c); add(c.strip() + ((re.search(r'[.!?…]+\s*$', sn) or [''])[0].strip() or '!'))
    st = {'lines': [0, 0], 'fx': [0, 0], 'words': [0, 0], 'syl': [0, 0]}; lost = []
    def redo(sec, key, old, texts, br, dur=None, cut=None):
        d0 = old[1]
        for t in texts:
            r = raw(t, dur)
            if r is None: continue
            y = tts.finish(r, h)
            if cut is not None: n = min(len(y), int((cut + 0.23) * tts.SR)); y = y[:n].copy(); fade = int(0.03 * tts.SR); y[-fade:] *= np.linspace(1, 0, fade)
            if abs(round(len(y) / tts.SR, 3) - d0) > 0.0015: continue  # not the clip we shipped
            st[sec][0] += 1; return tts.b64(tts.mp3(y, br))
        st[sec][1] += 1; lost.append(sec + ':' + key); return tts.b64(transcode(old[0], br))
    for k, v in SP['lines'].items(): v[0] = redo('lines', k, v, [tts.tts_text(t) for t in cand.get(k, [])], tts.BR_LINE)
    for k, arr in SP['fx'].items():
        for i, v in enumerate(arr): v[0] = redo('fx', k, v, [tts.FX[k][i]] if k in tts.FX and i < len(tts.FX[k]) else [], tts.BR_LINE)
    words = tts.get_words(lines)
    for k, v in SP['words'].items(): v[0] = redo('words', k, v, [tts.tts_text(words[k])] if k in words else [tts.tts_text(k)], tts.BR_WORD, tts.WDUR)
    su = tts.syl_units()
    for k, v in SP['syl'].items(): v[0] = redo('syl', k, v, [su.get(k, k)], tts.BR_WORD, tts.WDUR, v[2])
    js = head + json.dumps(SP, ensure_ascii=False, separators=(',', ':')) + tail
    open(os.path.join(tts.ROOT, 'src', 'speech.js'), 'w', encoding='utf-8').write(js)
    print('wrote speech.js', len(js) // 1024, 'KB ·', ' · '.join('%s %d from source, %d transcoded' % (s, a, b) for s, (a, b) in st.items()), '· transcoded:', lost[:12], flush=True)

if __name__ == '__main__': main()
