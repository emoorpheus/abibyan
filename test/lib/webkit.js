// Round 24: WebKit (Safari's engine) for the iPhone tests. This sandbox is Amazon Linux (glibc 2.34): the Playwright 1.48 WebKit 18
// build for Ubuntu 20.04 runs here with the Ubuntu libraries unpacked into /data/pw148/libs (set up by tools/webkit_setup.sh).
// webkit() → the launcher, or null when that runtime is not here (then the WebKit checks are skipped and say so).
const fs = require('fs');
const BASE = process.env.ABI_WEBKIT || '/data/pw148', R = BASE + '/libs';
// Round 25 (Armbian: aarch64, Debian 12): no x86 runtime in BASE → Playwright's own WebKit for this machine, if installed
// (cd /vercel/sandbox && npx playwright install --with-deps webkit); found through node_modules like the main Playwright.
function native() {
  let pw, exe; try { pw = require('playwright-core'); exe = pw.webkit.executablePath(); } catch { return null; }
  if (!exe || !fs.existsSync(exe)) return null;
  return { launch: (o = {}) => pw.webkit.launch({ timeout: 60000, ...o }), devices: pw.devices, version: () => pw.webkit.name() };
}
function webkit() {
  if (!fs.existsSync(BASE + '/node_modules/playwright-core') || !fs.existsSync(BASE + '/browsers') || !fs.existsSync(R)) return native();
  process.env.PLAYWRIGHT_BROWSERS_PATH = BASE + '/browsers'; process.env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = '1';
  const { webkit: wk, devices } = require(BASE + '/node_modules/playwright-core');
  const env = { ...process.env, PW_EXTRA_LD: `${R}/usr/lib/x86_64-linux-gnu:${R}/lib/x86_64-linux-gnu`, GSETTINGS_SCHEMA_DIR: `${R}/usr/share/glib-2.0/schemas`,
    __EGL_VENDOR_LIBRARY_DIRS: `${R}/usr/share/glvnd/egl_vendor.d`, LIBGL_DRIVERS_PATH: `${R}/usr/lib/x86_64-linux-gnu/dri`, LIBGL_ALWAYS_SOFTWARE: '1' };
  return { launch: (o = {}) => wk.launch({ timeout: 60000, ...o, env }), devices, version: () => wk.name() };
}
module.exports = { webkit };
