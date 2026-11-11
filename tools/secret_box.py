#!/usr/bin/env python3
"""Round 26 «записки под замком»: his notes for Даша (texts + pictures) go into the game only as a cipher.

AES-GCM-256 with the key PBKDF2-HMAC-SHA256(her answer, SALT, IT). The game (src/dasha.js) asks her question at the first
heart she finds and opens the notes right in the phone: no server, no internet, nothing of his has to be on. The answer lives
OUTSIDE the repo, in ~/.config/abibyan/phrase.txt (or the file named in $ABIBYAN_PHRASE_FILE), chmod 600:

    вопрос: <what the game asks her — public, it is in the page>
    ответ: <the phrase — case, ё/е, spaces and punctuation don't matter>
    подсказка: <optional, shown after 3 wrong answers — public too>

usage: python3 tools/secret_box.py check   → is the file there, its question and hint (never the answer)
"""
import base64, hashlib, json, os, pathlib, sys, unicodedata

SALT = bytes.fromhex('912209058f462b0e22f2e30ec10c37cb')  # fixed: the key is the same from build to build, so a phone that knows it opens new builds too
IT = 600_000  # PBKDF2 rounds (OWASP 2023, SHA-256): a fraction of a second on an iPhone, slow for guessing


def norm(s):
    """the answer as the game compares it (= norm() in src/dasha.js): NFC, lower case, ё → е, only letters and digits"""
    return ''.join(c for c in unicodedata.normalize('NFC', s).lower().replace('ё', 'е') if c.isalnum())


def phrase_path():
    return pathlib.Path(os.environ.get('ABIBYAN_PHRASE_FILE') or pathlib.Path.home() / '.config' / 'abibyan' / 'phrase.txt')


def read_phrase():
    """{'q': question, 'a': the normalized answer, 'hint': hint or ''}; None when there is no file"""
    p = phrase_path()
    if not p.is_file(): return None
    kv = {}
    for ln in p.read_text(encoding='utf-8').splitlines():
        k, sep, v = ln.partition(':')
        if sep and k.strip().lower() in ('вопрос', 'ответ', 'подсказка'): kv[k.strip().lower()] = v.strip()
    ph = {'q': kv.get('вопрос', ''), 'a': norm(kv.get('ответ', '')), 'hint': kv.get('подсказка', '')}
    if not ph['q'] or not ph['a']: sys.exit('%s: фраза неполная — нужны строки «вопрос: …» и «ответ: …»' % p)
    return ph


def seal(payload, ph):
    """payload (JSON-able) → {v, it, salt, iv, ct, q, hint}: ct = AES-GCM(the JSON) + its tag, base64; a fresh iv every build"""
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    key, iv = hashlib.pbkdf2_hmac('sha256', ph['a'].encode('utf-8'), SALT, IT, 32), os.urandom(12)
    ct = AESGCM(key).encrypt(iv, json.dumps(payload, ensure_ascii=False).encode('utf-8'), None)
    b = lambda x: base64.b64encode(x).decode()
    return {'v': 1, 'it': IT, 'salt': b(SALT), 'iv': b(iv), 'ct': b(ct), 'q': ph['q'], 'hint': ph['hint']}


if __name__ == '__main__':
    if sys.argv[1:] != ['check']: sys.exit(__doc__)
    ph = read_phrase()
    print('нет файла с фразой: %s' % phrase_path() if not ph else 'фраза есть (%s): вопрос «%s», подсказка «%s», в ответе %d букв/цифр' % (phrase_path(), ph['q'], ph['hint'] or '—', len(ph['a'])))
