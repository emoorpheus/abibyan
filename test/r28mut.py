#!/usr/bin/env python3
# Round 28: mutation copies of the current build for test/r28.js (run by test/r28mut.sh). Each breaks one thing FILL must do,
# in a copy of dist/index.html -> dist/index_<m>.html (dist is git-ignored; r28mut.sh deletes each copy after its run).
# A mutation whose text is not found exactly once is skipped, not guessed.
import pathlib, sys
D = pathlib.Path(__file__).resolve().parent.parent / 'dist'
src = (D / 'index.html').read_text(encoding='utf-8')
M = {
  'm1': ('want = r.width > 0', 'want = false && r.width > 0'),                          # FILL never switches on
  'm2': ('function mirror(src, sx, sy, h, dy) {', 'function mirror(src, sx, sy, h, dy) { return;'),  # the sides are not mirrored
  'm3': ("dim: modal ? 'rgba(25,12,22,.6)' : null", 'dim: null'),                        # a window does not dim the surroundings
  'm4': ('fullH = screen.height', 'fullH = vh'),                                          # iOS 26 home screen: the strip below stays bare
  'm5': ('function setBg(c) {', 'function setBg(c) { return;'),                          # the page behind keeps the default colour
  'm6': ('function topBand(e, dim) {', 'function topBand(e, dim) { return;'),            # ceiling band is not drawn
  'm7': ('function floorExt(room, n) {', 'function floorExt(room, n) { return null;'),    # no floor going on below the room
  'm8': ('try { FILL.draw(dt, scene, cv); }', 'try { 0; }'),                              # the game loop never draws the surroundings
  'm9': ('.fill #ext{display:block', '.fill #ext{display:none'),                          # the surroundings' canvas is hidden
}
for m in (sys.argv[1:] or list(M)):
    a, b = M[m]; n = src.count(a)
    if n != 1: print(f'{m}: SKIP, {n} matches for {a!r}'); continue
    (D / f'index_{m}.html').write_text(src.replace(a, b), encoding='utf-8'); print(f'{m}: ok')
