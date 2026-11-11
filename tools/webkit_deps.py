#!/usr/bin/env python3
"""Round 24: the Ubuntu 20.04 libraries WebKit 18 (Playwright 1.48) needs, unpacked from focal .debs into $BASE/libs.
ldd-driven: every WebKit binary / library → the missing sonames → the package that has them (Contents-amd64) → fetch and unpack,
again until nothing is missing.  usage: python3 tools/webkit_deps.py [extra packages…]   (run by tools/webkit_setup.sh)
env: ABI_WEBKIT = the base folder (default /data/pw148); it needs $BASE/apt/Packages_*.xz, Contents-focal.gz (the setup fetches them)."""
import lzma, gzip, re, os, subprocess, sys, urllib.request, glob
BASE = os.environ.get('ABI_WEBKIT', '/data/pw148'); APT = BASE + '/apt'; ROOT = BASE + '/libs'
os.chdir(APT); os.makedirs(ROOT, exist_ok=True)
P = {}
for f in ['Packages_focal_main.xz', 'Packages_focal_universe.xz', 'Packages_focal-updates_main.xz', 'Packages_focal-updates_universe.xz']:
    for blk in lzma.open(f, 'rt', encoding='utf-8', errors='replace').read().split('\n\n'):
        m = re.search(r'^Package: (\S+)', blk, re.M); fn = re.search(r'^Filename: (\S+)', blk, re.M)
        if m and fn: P[m.group(1)] = fn.group(1)  # the updates override the base (read later)
SO = {}  # soname → package (library folders only)
for ln in gzip.open('Contents-focal.gz', 'rt', encoding='utf-8', errors='replace'):
    if not ln.startswith(('usr/lib/x86_64-linux-gnu/', 'lib/x86_64-linux-gnu/')): continue
    path, _, pk = ln.rstrip('\n').rpartition(' ')
    SO.setdefault(os.path.basename(path.strip()), pk.split(',')[0].split('/')[-1])
got = set(open('got.txt').read().split()) if os.path.exists('got.txt') else set()
SKIP = {'libc6', 'libgcc-s1', 'libstdc++6', 'libcrypt1'}  # the system's own (newer) ones must win
def fetch(pk):
    if pk in got or pk in SKIP or pk not in P: return False
    deb = f'debs/{pk}.deb'; os.makedirs('debs', exist_ok=True)
    if not os.path.exists(deb): urllib.request.urlretrieve('http://archive.ubuntu.com/ubuntu/' + P[pk], deb)
    d = f'x/{pk}'; os.makedirs(d, exist_ok=True)
    subprocess.run(f'cd {d} && ar x ../../{deb} && tar xf data.tar.* -C {ROOT}', shell=True, check=True)
    got.add(pk); open('got.txt', 'w').write('\n'.join(sorted(got))); return True
for pk in sys.argv[1:]: print('extra', pk, fetch(pk))
LP = f'{ROOT}/usr/lib/x86_64-linux-gnu:{ROOT}/lib/x86_64-linux-gnu'
WK = (glob.glob(BASE + '/browsers/webkit-*') or [BASE + '/browsers/webkit-2083'])[0]
for it in range(12):
    files = [f for f in glob.glob(WK + '/**/*', recursive=True) if os.path.isfile(f) and (re.search(r'\.so(\.|$)', f) or os.access(f, os.X_OK))]
    files += [f for f in glob.glob(ROOT + '/usr/lib/x86_64-linux-gnu/**/*.so*', recursive=True) + glob.glob(ROOT + '/lib/x86_64-linux-gnu/*.so*') if os.path.isfile(f)]
    miss = set()
    for f in files:
        r = subprocess.run(['ldd', f], capture_output=True, text=True, env=dict(os.environ, LD_LIBRARY_PATH=LP + ':' + WK + '/minibrowser-gtk/lib:' + WK + '/minibrowser-wpe/lib'))
        for m in re.finditer(r'^\s*(\S+) => not found', r.stdout, re.M): miss.add(m.group(1))
    print('iter', it, 'missing', len(miss), ' '.join(sorted(miss))[:600]); sys.stdout.flush()
    if not miss: break
    new = 0
    for so in sorted(miss):
        pk = SO.get(so)
        if not pk: print('  no package for', so); continue
        if fetch(pk): new += 1
    if not new: break
