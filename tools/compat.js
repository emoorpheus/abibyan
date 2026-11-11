// Round 20 (skill ios-safari-quirks): node tools/compat.js [--json] — finds features the oldest iPhones we target (iOS / Safari 15) lack.
// Scans src/*.js (not the voice bank — data only) and src/style.css. Exit 1 when something is found.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'src'), SKIP = new Set(['speech.js', 'voice_rec.js', 'voicebank.js']);
const AT_OK = new Set(['DUCKS', 'FRIENDS', 'D']); // our own .at() methods (DUCKS.at, FRIENDS.at, a tutorial step's at())
const JS = [
  ['regex lookbehind (?<= / (?<!', 'Safari 16.4', /\(\?<[=!]/],
  ['structuredClone()', 'Safari 15.4', /\bstructuredClone\s*\(/],
  ['Object.hasOwn()', 'Safari 15.4', /\bObject\.hasOwn\s*\(/],
  ['Array/String .at()', 'Safari 15.4', /([A-Za-z_$][\w$]*|[\])])\.at\s*\(/, (m) => !AT_OK.has(m[1])],
  ['.findLast() / .findLastIndex()', 'Safari 15.4', /\.findLast(Index)?\s*\(/],
  ['.toSorted() / .toReversed() / .toSpliced() / .with()', 'Safari 16', /\.(toSorted|toReversed|toSpliced)\s*\(/],
  ['Object.groupBy / Map.groupBy', 'Safari 17.4', /\b(Object|Map)\.groupBy\s*\(/],
  ['Promise.withResolvers', 'Safari 17.4', /\bPromise\.withResolvers\b/],
  ['Array.fromAsync', 'Safari 16.4', /\bArray\.fromAsync\b/],
  ['AbortSignal.timeout', 'Safari 16', /\bAbortSignal\.timeout\b/],
  ['crypto.randomUUID', 'Safari 15.4', /\brandomUUID\s*\(/],
  ['class static {} blocks', 'Safari 16.4', /\bstatic\s*\{/],
  ['requestIdleCallback (no Safari)', 'нет в Safari', /(?:^|[^.\w$'"])requestIdleCallback\s*\(/],
  ['OffscreenCanvas', 'Safari 16.4', /\bnew\s+OffscreenCanvas\b/],
  ['canvas ctx.filter', 'Safari 18', /(?<!style)\.filter\s*=[^=>]/],
  ['canvas roundRect()', 'Safari 16', /\.roundRect\s*\(/],
  ['canvas letterSpacing / wordSpacing', 'Safari 18', /\.(letterSpacing|wordSpacing)\s*=[^=]/],
  ['CSS dvh/svh/lvh in JS styles', 'Safari 15.4', /\d(dvh|svh|lvh|dvw|svw|lvw)\b/],
  ['CSS :has() in JS', 'Safari 15.4', /:has\(/],
];
const CSS = [
  [':has()', 'Safari 15.4', /:has\(/],
  ['dvh/svh/lvh units', 'Safari 15.4', /\d(dvh|svh|lvh|dvw|svw|lvw)\b/],
  ['@container', 'Safari 16', /@container\b/],
  ['@layer', 'Safari 15.4', /@layer\b/],
  ['color-mix()', 'Safari 16.2', /color-mix\(/],
  [':focus-visible (drops the whole rule)', 'Safari 15.4', /:focus-visible/],
  ['CSS nesting (&)', 'Safari 17.2', /\{[^{}]*&[^{}]*\{/],
  ['backdrop-filter without -webkit-', 'Safari 18', /(^|[;{\s])backdrop-filter\s*:/, (m, src, i) => !/-webkit-backdrop-filter/.test(src.slice(Math.max(0, i - 200), i + 200))],
  ['user-select without -webkit-', 'все Safari', /(^|[;{\s])user-select\s*:/, (m, src, i) => !/-webkit-user-select/.test(src.slice(src.lastIndexOf('{', i), src.indexOf('}', i)))],
];
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')); // comments only (strings can hold CSS)
const lineOf = (s, i) => s.slice(0, i).split('\n').length;
function scan(file, rules) {
  const src = strip(fs.readFileSync(file, 'utf8')), out = [];
  for (const [name, need, re, keep] of rules) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'); let m;
    while ((m = g.exec(src))) { if (keep && !keep(m, src, m.index)) continue; out.push({ file: path.relative(ROOT, file), line: lineOf(src, m.index), what: name, need, code: src.slice(Math.max(0, m.index - 20), m.index + 40).replace(/\s+/g, ' ').trim() }); }
  }
  return out;
}
const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.js') && !SKIP.has(f)).sort();
const found = [].concat(...files.map((f) => scan(path.join(SRC, f), JS)), scan(path.join(SRC, 'style.css'), CSS));
const res = { target: 'iOS / Safari 15', files: files.length + 1, found };
if (process.argv.includes('--json')) console.log(JSON.stringify(res));
else { console.log(`compat (${res.target}): ${res.files} files, ${found.length} problems`); for (const f of found) console.log(`  ${f.file}:${f.line}  ${f.what} [${f.need}]  …${f.code}…`); }
process.exit(found.length ? 1 : 0);
