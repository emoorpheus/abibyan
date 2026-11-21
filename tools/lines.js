// Collects every line the monkey can say (for tools/tts.py): DATA.LINES + literals passed to say() + wantLine variants
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const ctx = {}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(SRC, 'data.js'), 'utf8') + '\nthis.DATA = DATA;', ctx);
const D = ctx.DATA, out = new Set();
const lisp = (s) => String(s).replace(/с/g, 'ш').replace(/С/g, 'Ш');
const add = (s) => { s = lisp(String(s).trim()); if (s) out.add(s); };
for (const k in D.LINES) for (const s of D.LINES[k]) add(s);
for (const id of D.FOOD_ORDER) { const f = D.FOODS[id]; if (!f.nonfood) add('Хочу ' + (f.acc || f.name.toLowerCase()) + '!'); }
['Давай поиграем в игру!', 'Погладь меня по голове!', 'Хочу в душ ш мыльной пеной!', 'Шорви мне банан ш дерева!', 'Пощекочи мне пузико!', 'Хочу кое-что!'].forEach(add);
const SKIP = new Set(['happy', 'sad', 'tired', 'Скуф']);
// friends' scenes: only Абибян's own lines ('a') are voiced — friends speak in creature sounds
for (const id in D.FRIENDS) { const F = D.FRIENDS[id]; for (const k of ['chat', 'stories']) for (const sc of F[k] || []) for (const l of sc) if (l[0] === 'a') add(l[1]); for (const k of ['spGo', 'spDone', 'visit']) for (const l of F[k] || []) if (l[0] === 'a') add(l[1]); }
// Round 17: the growth party — his lines are the plain string lists of DATA.GPARTY
for (const k in D.GPARTY) if (Array.isArray(D.GPARTY[k])) for (const l of D.GPARTY[k]) if (typeof l === 'string') add(l);
// Round 15b: «Вылазка» with Жучок — Абибян's lines
for (const k in D.HEIST) for (const l of D.HEIST[k]) if (Array.isArray(l) && l[0] === 'a') add(l[1]);
for (const f of ['home.js', 'games.js', 'main.js', 'ui.js', 'friends.js', 'gags.js', 'tour.js']) {
  const src = fs.readFileSync(path.join(SRC, f), 'utf8'); const re = /(?:\bsay|HOME\.say|\bmonkeySay)\(/g; let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length, depth = 1, j = i; while (j < src.length && depth) { const c = src[j]; if (c === '(') depth++; else if (c === ')') depth--; else if (c === "'" || c === '`') { const q = c; j++; while (j < src.length && src[j] !== q) { if (src[j] === '\\') j++; j++; } } j++; }
    const arg = src.slice(i, j - 1); const lit = arg.match(/'([^'\\]|\\.)*'|`[^`]*`/g) || [];
    for (let s of lit) { s = s.slice(1, -1); if (SKIP.has(s) || !/[А-Яа-яЁё]/.test(s)) continue; if (s.includes('${')) s = s.replace(/\$\{[^}]*\}/g, 'Абибян'); add(s); }
  }
}
const json = JSON.stringify([...out], null, 1); if (process.argv[2]) fs.writeFileSync(process.argv[2], json); else process.stdout.write(json);
