// Verification for Round 38 fixes
const assert = require('assert');
const fs = require('fs');

console.log('Testing Round 38 fixes...');

// 1. DATA check
const dataCode = fs.readFileSync('src/data.js', 'utf8');
const vm = require('vm');

// Mock browser/DOM environment for DATA
const sandbox = {
  console,
  Math,
  Date,
  Object,
  Array,
  String,
  Number,
  RegExp,
  Set,
  Map
};
vm.createContext(sandbox);

// Extract DATA
vm.runInContext(dataCode + '\nthis.DATA = DATA;', sandbox);
const DATA = sandbox.DATA;

// Item 1: Shop exclusion
const removedIds = ['poster', 'nightlight', 'garland', 'cactus', 'clock', 'disco', 'fern'];
for (const id of removedIds) {
  assert(DATA.DECOR[id], `DATA.DECOR[${id}] must exist`);
  assert.strictEqual(DATA.DECOR[id].noShop, 1, `DATA.DECOR[${id}].noShop must be 1`);
}
console.log('✔ Item 1: 7 decor items properly marked noShop: 1');

// Item 2: Bath mat
assert(DATA.DECOR.bathmat, 'DATA.DECOR.bathmat must exist');
assert(!DATA.DECOR.bathmat.noShop, 'DATA.DECOR.bathmat must NOT have noShop');
assert.strictEqual(DATA.DECOR.bathmat.room, 'bath');
assert.strictEqual(DATA.DECOR.bathmat.name, 'Коврик для ванны');
assert.strictEqual(DATA.DECOR.bathmat.price, 45);

const bathCode = fs.readFileSync('src/bath.js', 'utf8');
assert(bathCode.includes("spr('bathmat'), 64, 236"), 'bathmat must be rendered at [64, 236] in front of cabin');
assert(bathCode.includes("bathmat: it.bathmat ? [64, 236, 52, 18] : null"), 'bathmat spot must be [64, 236, 52, 18]');
console.log('✔ Item 2: Bath mat configured in shop and positioned at [64, 236]');

// Item 3: Soundbar branding
assert.strictEqual(DATA.DECOR.soundbar.name, 'Sony BRAVIA Theater Bar 8');
const zalCode = fs.readFileSync('src/zal.js', 'utf8');
assert(zalCode.includes('Sony BRAVIA Theater Bar 8'), 'zal.js must refer to Sony BRAVIA Theater Bar 8');
assert(zalCode.includes('#e0e0e8'), 'zal.js must use silver tones for Sony logo');
assert(!zalCode.includes('#ff7a1a'), 'zal.js must not contain orange JBL logo color');
console.log('✔ Item 3: Soundbar rebranded to Sony BRAVIA Theater Bar 8 with silver logo');

// Item 4: Ducks in balcony
const ducksCode = fs.readFileSync('src/ducks.js', 'utf8');
assert(ducksCode.includes("room === 'balcony' && x < 98"), 'ducks.js must have obstacle avoidance for balcony planter box');
assert(ducksCode.includes('const by = 293'), 'ducks.js by must be 293 in front of planter box');

const friendsCode = fs.readFileSync('src/friends.js', 'utf8');
// Premature DUCKS.render should be removed from fur layer before ROOMS.front
const furDuckCount = (friendsCode.match(/if \(typeof DUCKS !== 'undefined' && DUCKS\.render\) DUCKS\.render\(c, P\);/g) || []).length;
assert.strictEqual(furDuckCount, 0, 'Premature DUCKS.render in fur layer must be removed');
console.log('✔ Item 4: Ducks balcony lane and layering verified');

// Item 5: Window closing in winter only, monkey closes
const gagsCode = fs.readFileSync('src/gags.js', 'utf8');
assert(gagsCode.includes("if (ssn !== 'winter') continue;"), 'gags.js must only auto-close windows in winter');
assert(!gagsCode.includes('friendCloses'), 'friendCloses should not exist - friends only complain');
assert(gagsCode.includes('Бу-бу… зябко! Закрыть бы окошко…') || gagsCode.includes('Бу-бу… прохладно'), 'Monty complains about cold');
assert(gagsCode.includes('HOME.closeWindow(r)'), 'Monkey closes window');
console.log('✔ Item 5: Window auto-closing restricted to winter; friends complain, monkey closes');

// Item 6: Mosquito return logic
assert(friendsCode.includes('(f.path ? f.path.dur : 1.2) + 0.15'), 'Mosquito back must return full path duration');
assert(friendsCode.includes('ensureBack'), 'ensureBack callback must be passed to run() in special()');
assert(friendsCode.includes("Math.hypot(F[sid].x - a[0], F[sid].y - a[1]) > 6"), 'cancelScene must restore friend to anchor if displaced');
assert(friendsCode.includes("Math.hypot(f.x - hx, f.y - hy) > 8"), 'tickFriend must have safety recovery to anchor');
console.log('✔ Item 6: Mosquito return path, cancelScene and tick recovery verified');

console.log('All Round 38 verification checks passed!');
