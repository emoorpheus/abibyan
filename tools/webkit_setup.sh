#!/bin/bash
# Round 24: WebKit (Safari's engine) for test/r24.js «webkit» on this Amazon Linux sandbox (glibc 2.34, no apt).
# Playwright 1.48.2 + its WebKit 18.0 build for Ubuntu 20.04, the Ubuntu focal libraries unpacked next to it (tools/webkit_deps.py).
# usage: bash tools/webkit_setup.sh   (≈ 10 min, ≈ 1 GB; needs the internet)  → test/lib/webkit.js finds it in $ABI_WEBKIT (/data/pw148)
set -e
BASE="${ABI_WEBKIT:-/data/pw148}"; HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$BASE/apt" && cd "$BASE"
[ -f package.json ] || npm init -y > /dev/null
[ -d node_modules/playwright-core ] || npm i playwright-core@1.48.2 > /dev/null
PLAYWRIGHT_BROWSERS_PATH="$BASE/browsers" PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu20.04-x64 node node_modules/playwright-core/cli.js install webkit
cd "$BASE/apt"; U=http://archive.ubuntu.com/ubuntu/dists
for d in focal focal-updates; do for c in main universe; do [ -f "Packages_${d}_${c}.xz" ] || curl -sSfo "Packages_${d}_${c}.xz" "$U/$d/$c/binary-amd64/Packages.xz"; done; done
[ -f Contents-focal.gz ] || curl -sSfo Contents-focal.gz "$U/focal/Contents-amd64.gz"
# the libraries ldd finds missing + what WebKit loads at run time (software GL / EGL, LLVM for the swrast driver, gsettings, sound)
ABI_WEBKIT="$BASE" python3 "$HERE/webkit_deps.py" libegl-mesa0 libgbm1 libglapi-mesa libgl1-mesa-dri gsettings-desktop-schemas libwayland-server0 \
  libpulse0 libglib2.0-0 libllvm12 libsensors5 libelf1 libz3-4 libgles2 libglx-mesa0 libopengl0
glib-compile-schemas "$BASE/libs/usr/share/glib-2.0/schemas" 2>/dev/null || "$BASE/libs/usr/lib/x86_64-linux-gnu/glib-2.0/glib-compile-schemas" "$BASE/libs/usr/share/glib-2.0/schemas"
# the MiniBrowser wrappers reset LD_LIBRARY_PATH — keep the unpacked libraries in it (test/lib/webkit.js passes PW_EXTRA_LD)
for w in "$BASE"/browsers/webkit-*/minibrowser-*/MiniBrowser; do
  grep -q PW_EXTRA_LD "$w" || sed -i -E '/^export LD_LIBRARY_PATH=/s#"$#:${PW_EXTRA_LD}"#' "$w"
done
echo "WebKit ready in $BASE — node test/r24.js webkit"
