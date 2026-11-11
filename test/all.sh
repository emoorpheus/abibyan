#!/usr/bin/env bash
# One command for the whole check: build + smoke + project tests. Fails loudly.
set -uo pipefail
cd "$(dirname "$0")/.."
LOG=/tmp/abibyan_tests; mkdir -p "$LOG" test/gallery; bad=0 # test/gallery: gitignored screenshots, absent in a fresh clone
step() { # name, command...
  local n=$1; shift; local t0=$SECONDS
  if "$@" >"$LOG/$n.log" 2>&1 && ! grep -qE 'pageerror|^console:|ERRORS|^FAIL|PROBE FAIL|Error:' "$LOG/$n.log"; then echo "ok   $n ($((SECONDS-t0)) s)"; else echo "FAIL $n — see $LOG/$n.log"; tail -15 "$LOG/$n.log"; bad=1; fi
}
step build python3 build.py
step smoke env CHROMIUM_PATH=/usr/local/bin/chromium node /data/skills/smoke-testing-web-games/scripts/smoke-test.mjs /data/game/dist/index.html
step probe node test/probe.js
step play node test/play.js
step persist node test/persist.js
step speech node test/speech.js
step friends node test/friends.js
step zal node test/zal.js
step flat node test/flat.js
step tweaks node test/tweaks.js
step r4 node test/r4.js
step r5 node test/r5.js
step r8 node test/r8.js
step r9 node test/r9.js
step r10 node test/r10.js
step r11 node test/r11.js
step r12 node test/r12.js
step r13 node test/r13.js
step r13b node test/r13b.js
step r13c node test/r13c.js
step r14 node test/r14.js
step r14b node test/r14b.js
step r15 node test/r15.js
step r15b node test/r15b.js
step r16 node test/r16.js
step r17 node test/r17.js
step r18 node test/r18.js
step r19 node test/r19.js
step r20 node test/r20.js
step r21 node test/r21.js
step r22 node test/r22.js
step r23 node test/r23.js
step r24 node test/r24.js
step r26 node test/r26.js
step r27 node test/r27.js
step r28 node test/r28.js
step inv node test/inv.js
step qa node test/qa.js test/s1.json
python3 -m http.server 8775 -d dist/site >/dev/null 2>&1 & srv=$!; sleep 1
step pwa node test/pwa.js
kill $srv 2>/dev/null
[ $bad = 0 ] && echo "ALL GREEN" || { echo "SOME FAILED"; exit 1; }
