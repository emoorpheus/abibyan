#!/bin/bash
# Round 28: bash test/r28mut.sh [m1 ... m9] - each mutation of FILL (test/r28mut.py) must fail its own checks in test/r28.js
# (the real build passes them all). Sequential; logs and screenshots -> /tmp/r28mut; each copy is deleted after its run.
set -u
cd "$(dirname "$0")/.."; mkdir -p /tmp/r28mut
python3 test/r28mut.py "$@" || exit 1
declare -A SEC=([m1]=fill,off [m2]=fill,sides [m3]=modal [m4]=home26 [m5]=bands,modal,sheet [m6]=bands [m7]=bands,rooms [m8]=fill [m9]=fill)
for m in ${@:-m1 m2 m3 m4 m5 m6 m7 m8 m9}; do
  f=$PWD/dist/index_$m.html; [ -f "$f" ] || { echo "== $m: no file"; continue; }
  R28_FILE=$f R28_LOOK=/tmp/r28mut/look_$m NODE_PATH=/vercel/sandbox/node_modules timeout 900 node test/r28.js ${SEC[$m]} > /tmp/r28mut/$m.log 2>&1
  echo "== $m (${SEC[$m]}): exit $?, $(grep -c '^PASS' /tmp/r28mut/$m.log) passed, $(grep -c '^FAIL' /tmp/r28mut/$m.log) failed"
  grep '^FAIL' /tmp/r28mut/$m.log | cut -c1-170 | head -n 8
  rm -f "$f"
done
echo "DONE $(date +%T)"
