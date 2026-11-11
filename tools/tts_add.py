#!/usr/bin/env python3
"""Round 8: tops up src/speech.js without rebuilding the word / syllable bank (tools/tts.py --lines-only would drop it).

1. every game line (tools/lines.js) that has neither a TTS clip nor a recording (SPEECH.rec, tools/rec.py) gets a TTS clip;
2. a line that contains a recorded sentence / clause («Пуся! Как я рад!», «Ой, голубь!») is played as recording + the rest,
   so every other sentence / clause of it gets its own TTS clip (the same split as audio.js plan()).
The TTS pipeline (Silero → WORLD → EQ, cached in /data/voice/cache) is tools/tts.py's.  usage: python3 tools/tts_add.py
"""
import os, sys, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import tts

ROOT = tts.ROOT
def load(name, var):
    s = open(os.path.join(ROOT, 'src', name), encoding='utf-8').read(); i = s.index(var + ' = ') + len(var) + 3; j = s.rindex(';')
    return s[:i], json.loads(s[i:j]), s[j:]

def sents(t): return re.findall(r'[^.!?…]+[.!?…]*', t)
def clauses(sn): return re.split(r'[,;:—–]+', sn)

def main():
    head, SP, tail = load('speech.js', 'const SPEECH')
    _, REC, _ = load('voice_rec.js', 'SPEECH.rec')
    L = SP['lines']; norm = tts.norm; need = {}
    for line in tts.get_lines():
        k = norm(line)
        if not k or k in REC: continue
        S = [s for s in sents(line) if norm(s)]
        rec_in = lambda sn: norm(sn) in REC or any(norm(c) in REC for c in clauses(sn) if norm(c))
        if not any(rec_in(s) for s in S):
            if k not in L: need[k] = line.strip()
            continue
        for sn in S:
            ks = norm(sn)
            if ks in REC or (ks in L and not rec_in(sn)): continue
            for c in clauses(sn):
                kc = norm(c)
                if kc and kc not in REC and kc not in L: need[kc] = c.strip() + ('' if re.search(r'[.!?…]$', c.strip()) else (re.search(r'[.!?…]+\s*$', sn) or [''])[0].strip() or '!')
    print('to synth', len(need), list(need.values())[:80], flush=True)
    h = np.load(os.path.join(ROOT, 'tools', 'eq_fir.npy'))
    for k, t in need.items():
        b, m = tts.clip(tts.tts_text(t), h, tts.BR_LINE); L[k] = [tts.b64(b), m['d']]
    js = head + json.dumps(SP, ensure_ascii=False, separators=(',', ':')) + tail
    open(os.path.join(ROOT, 'src', 'speech.js'), 'w', encoding='utf-8').write(js)
    print('wrote speech.js', len(js) // 1024, 'KB, lines', len(L), flush=True)

if __name__ == '__main__': main()
