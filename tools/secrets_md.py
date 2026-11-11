#!/usr/bin/env python3
"""Round 22: «24 секрета» — the texts of the notes come from docs/24-secrets.md (he fills it in, then build.py puts them into the game).

Format (see the file): a section per note «## №N …», the text goes after the line «Текст:» (any number of lines) until the next
«## », a «Картинка:» line or a «---»; <!-- comments --> are dropped. A section «## Финал» holds a last note for when all are found.
usage: python3 tools/secrets_md.py [file.md]  → prints the JSON {N: text, …, "final": text}
"""
import re, sys, json, pathlib

def parse(path):
    p = pathlib.Path(path)
    if not p.exists(): return {}
    s = re.sub(r'<!--.*?-->', '', p.read_text(encoding='utf-8'), flags=re.S)
    out = {}
    for m in re.finditer(r'^##\s+(№\s*(\d+)|Финал)[^\n]*\n(.*?)(?=^##\s|\Z)', s, flags=re.M | re.S):
        body = m.group(3); t = re.search(r'^Текст:[ \t]*(.*?)(?=^Картинка:|^---|\Z)', body, flags=re.M | re.S)
        if not t: continue
        text = '\n'.join(l.rstrip() for l in t.group(1).strip().splitlines()).strip()
        text = re.sub(r'\n{3,}', '\n\n', text)
        if text: out['final' if m.group(1) == 'Финал' else int(m.group(2))] = text
    return out

if __name__ == '__main__':
    root = pathlib.Path(__file__).resolve().parent.parent
    print(json.dumps(parse(sys.argv[1] if len(sys.argv) > 1 else root / 'docs' / '24-secrets.md'), ensure_ascii=False))
