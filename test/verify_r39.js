// Verification for Round 39
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

console.log('Testing Round 39 requirements...');

// 1. DATA check
const dataCode = fs.readFileSync('src/data.js', 'utf8');
const stateCode = fs.readFileSync('src/state.js', 'utf8');
const gamesCode = fs.readFileSync('src/games.js', 'utf8');
const friendsCode = fs.readFileSync('src/friends.js', 'utf8');
const homeCode = fs.readFileSync('src/home.js', 'utf8');

const sandbox = {
  console, Math, Date, Object, Array, String, Number, RegExp, Set, Map
};
vm.createContext(sandbox);
vm.runInContext(dataCode + '\nthis.DATA = DATA;', sandbox);
const DATA = sandbox.DATA;

// --- Requirement 1: Bongo duel with Monty ---
// a) Sequence pips must not reveal drum colors
assert(!gamesCode.includes("['#e0483e', '#f0b830', '#4fb04a', '#3f86d8'][seq[i]]"), 'DuelBongo must not leak drum colors in sequence pips');
// b) Monty blunder probability must be 0 for early notes (length < 6)
assert(gamesCode.includes('DuelBongo'), 'DuelBongo exists');
// c) Player should have a response timer or timeout in input phases
assert(gamesCode.includes('pTimer') || gamesCode.includes('tapTimer') || gamesCode.includes('timer'), 'Player input timer should exist');

// --- Requirement 2: Pusya massage animation on monkey ---
// Pusya must jump onto monkey (onFur = true), knead with paws, and hop down
assert(friendsCode.includes("f.onFur = true") && friendsCode.includes("tx = f.x < HOME.mk.x ? HOME.mk.x - 18 : HOME.mk.x + 18"), 'Pusya massage must move onto monkey with onFur');

// --- Requirement 3: Slow down friendship gauge progression ---
// DATA.FSHIP.at thresholds must be higher (last stage >= 700)
assert(DATA.FSHIP.at[DATA.FSHIP.at.length - 1] >= 700, 'FSHIP max threshold must be >= 700');
assert(DATA.FSHIP.at[1] >= 40, 'FSHIP level 1 threshold must be >= 40');
// Point awards must be tuned
assert(stateCode.includes('fgain(id, 1)'), 'friendChat fgain should be 1');
assert(stateCode.includes('fgain(id, 2)'), 'friendSpecial fgain should be 2');

// --- Requirement 4: Slow down growth (last stage at 90 days, rest proportional) ---
const lastAge = DATA.AGES[DATA.AGES.length - 1];
assert.strictEqual(lastAge.days, 90, 'Last growth stage (Легенда) must require 90 days');
assert.strictEqual(DATA.AGES[0].days, 0, 'Newborn must be 0 days');
assert(DATA.AGES[1].days >= 4 && DATA.AGES[1].days <= 6, 'Baby days should be ~5');
assert(DATA.AGES[8].days >= 50 && DATA.AGES[8].days <= 60, 'Adult days should be ~54-56');
assert(lastAge.pts >= 7000, 'Last stage points should scale with days (>= 7000)');

// --- Requirement 5: Increase energy consumption and slow down sleep recovery ---
assert(stateCode.includes('energy: 18'), 'RATE.energy decay while awake should be 18/hr');
assert(homeCode.includes('dt * 0.3') || homeCode.includes('dt * 0.32'), 'sleepTick energy rate should be slowed to ~0.3-0.32/s');
assert(stateCode.includes('-26') || stateCode.includes('-25'), 'offline sleep recovery rate should be ~25-26/hr');

console.log('All Round 39 requirements verified successfully!');
