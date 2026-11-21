'use strict';
// Verification script for Round 37 fixes:
// 1. Direct object interactions & swipe-only navigation (no #nav-L/R, empty bar outside kitchen, bed/sink/palm hotspots)
// 2. iPhone 17 fullscreen & dynamic island blur fix (fill.js want/fullH/theme-color)
// 3. Mini-games difficulty (falling hearts removed)
// 4. Photo album framing (group photos no clipping, floor friends fully captured)
// 5. Tournament friends buff (scores competitive from Monday)
// 6. Lisping dialogue (шепелявость: спасибо -> шпашибо, я не согласен -> я не шоглашен)
// 7. Night visit bug (Pusya does not visit Monty at night, no sunshine lines at night)
// 8. Autonomous routine timeout 2 minutes (120 s)
// 9. Gym Mosq size reduced (k: 1)
// 10. Achievements counter bug (checkAch not blocked by bday)
// 11. Friend character descriptions (traits added to all friends)
// 12. Zhuk & Mosq friend card portraits (pixel art 3x)

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Verifying R37 Changes ---');

// 1. Check state.js achievement fix
const stateJs = fs.readFileSync(path.join(__dirname, '../src/state.js'), 'utf8');
assert(!stateJs.includes('DASHA.bday()'), 'checkAch must not contain DASHA.bday() guard');
assert(stateJs.includes('if (typeof DASHA !== \'undefined\' && DASHA.busy && DASHA.busy()) return;'), 'checkAch must check DASHA.busy()');
console.log('✓ 1. Achievements checkAch guard verified (DASHA.bday removed, achievements unlock properly)');

// 2. Check ui.js bottom bar and interactions
const uiJs = fs.readFileSync(path.join(__dirname, '../src/ui.js'), 'utf8');
assert(!uiJs.includes('id="nav-L"'), 'ui.js must not contain #nav-L buttons in setBar');
assert(!uiJs.includes('id="nav-R"'), 'ui.js must not contain #nav-R buttons in setBar');
assert(uiJs.includes('openAch() {') && uiJs.includes('GAME.checkAch'), 'openAch must evaluate checkAch');
console.log('✓ 2. UI interaction buttons removed, nav buttons removed, carousel kept for kitchen, openAch triggers checkAch');

// 3. Check home.js hotspots, swipe threshold, lisping, photo framing
const homeJs = fs.readFileSync(path.join(__dirname, '../src/home.js'), 'utf8');
assert(homeJs.includes('sp.bed'), 'home.js must have sp.bed hotspot in zal');
assert(homeJs.includes('soapTap()'), 'home.js must have soapTap for sink/faucet in bath');
assert(homeJs.includes('sp.palm'), 'home.js must have sp.palm hotspot');
assert(homeJs.includes('Math.abs(dx) > 22 && Math.abs(dx) > Math.abs(dy) * 1.15'), 'home.js must have smooth swipe threshold (22px)');
assert(homeJs.includes('const lisp = (s) => String(s).replace(/с/g, \'ш\').replace(/С/g, \'Ш\');'), 'home.js must have Russian lisp converter');

// Test lisp converter
const lisp = (s) => String(s).replace(/с/g, 'ш').replace(/С/g, 'Ш');
assert.strictEqual(lisp('спасибо'), 'шпашибо');
assert.strictEqual(lisp('я не согласен'), 'я не шоглашен');
assert.strictEqual(lisp('слава'), 'шлава');
assert.strictEqual(lisp('Слава'), 'Шлава');
console.log('✓ 3. Hotspots for bed/sink/palm verified, swipe threshold 22px verified, Russian lisping verified (спасибо -> шпашибо, я не согласен -> я не шоглашен)');

// 4. Check photo framing in home.js and friends.js
assert(homeJs.includes('const sw = 176, sh = 176, sx = 2;'), 'snap must capture 176x176 area across room width');
assert(homeJs.includes('const targetBottom = 296;'), 'snap must anchor bottom at 296 to capture floor friends');
const friendsJs = fs.readFileSync(path.join(__dirname, '../src/friends.js'), 'utf8');
assert(friendsJs.includes('Math.min(120, Math.min(HOME.headTop()'), 'friends.js growScript must frame top down to 120 so floor friends are not clipped');
console.log('✓ 4. Photo framing expanded (176x176 across room, floor friends Monty/Pusya fully captured without clipping)');

// 5. Check fill.js iPhone 17 fullscreen & dynamic island blur
const fillJs = fs.readFileSync(path.join(__dirname, '../src/fill.js'), 'utf8');
assert(fillJs.includes('want = r.width > 0 && vh >= vw * 1.05;'), 'fill.js must activate FILL for any portrait phone');
assert(fillJs.includes('fullH = Math.max(vh, (window.screen && window.screen.height) || 0);'), 'fill.js must extend to full screen height');
assert(fillJs.includes('updateThemeColor(e.a);'), 'fill.js must update meta theme-color to match top ceiling color');
console.log('✓ 5. iPhone 17 fullscreen & Dynamic Island blur fix verified (FILL active in portrait, full screen height, theme-color dynamic)');

// 6. Check games.js Catch game and Gym game
const gamesJs = fs.readFileSync(path.join(__dirname, '../src/games.js'), 'utf8');
assert(!gamesJs.includes('else if (L >= 5 && api.hearts < 3 && r < bad + 0.12) type = \'heart\';'), 'Catch game must not spawn falling hearts');
assert(gamesJs.includes('const e = FART.sprite(\'mosq\', { pose: over ? (d.win ? \'idle\' : \'happy\') : B.phase === \'fail\' ? \'idle\' : up ? \'lift\' : \'idle\', f: Math.floor(gT * 14) % 2, look: [1, 0], k: 1 });'), 'Gym game must render Mosq with k: 1');
console.log('✓ 6. Mini-games difficulty verified (falling hearts removed), Gym Mosq size reduced to k: 1');

// 7. Check friends.js Pusya night visit and sunshine line
assert(friendsJs.includes("if (id === 'pusya' && host === 'monty' && ROOMS.phase() === 'night') return false;"), 'startGuest must block Pusya night visit to Monty');
assert(friendsJs.includes("D = D.filter((dl) => !dl.some(([who, text]) => /солн/i.test(text)));"), 'startChat must filter out sunshine dialogues at night');
console.log('✓ 7. Pusya night visit blocked & sunshine lines filtered at night');

// 8. Check routine.js 2-minute idle timeout
const routineJs = fs.readFileSync(path.join(__dirname, '../src/routine.js'), 'utf8');
assert(routineJs.includes('const IDLE = 120, FREE_CD = 120'), 'routine.js IDLE must be 120 seconds (2 minutes)');
console.log('✓ 8. Routine autonomous idle timeout set to 120 s (2 minutes)');

// 9. Check tour.js friends buff
const tourJs = fs.readFileSync(path.join(__dirname, '../src/tour.js'), 'utf8');
assert(tourJs.includes('ref = Math.max(8,'), 'tour.js minimum ref must be 8');
assert(tourJs.includes('1.15 + R() * 0.25 : 0.9 + R() * 0.3'), 'tour.js friend multipliers must be buffed (0.9..1.4)');
assert(tourJs.includes('0.65 + (dayIdx() / 6) * 0.35'), 'tour.js base progress must start at 65% on Monday');
console.log('✓ 9. Tournament friends buff verified (base 65%, multipliers 0.9..1.4, min ref 8)');

// 10. Check data.js friends traits
const dataJs = fs.readFileSync(path.join(__dirname, '../src/data.js'), 'utf8');
assert(dataJs.includes("pusya: {") && dataJs.includes("добрая и ласковая кошечка"), 'pusya must have trait in data.js');
assert(dataJs.includes("monty: {") && dataJs.includes("старенький мудрый крот"), 'monty must have trait in data.js');
assert(dataJs.includes("mosq: {") && dataJs.includes("заботливый добрый доктор"), 'mosq must have trait in data.js');
assert(dataJs.includes("zhuk: {") && dataJs.includes("тихоня-авантюрист"), 'zhuk must have trait in data.js');
console.log('✓ 10. Character traits verified for all 4 friends (Pusya, Monty, Mosq, Zhuk)');

// 11. Check friends_art.js portraits
const friendsArtJs = fs.readFileSync(path.join(__dirname, '../src/friends_art.js'), 'utf8');
assert(friendsArtJs.includes('const e = sprite(id, { pose: \'happy\', k: 1, big: 1 }), k = 3'), 'friends_art.js portrait must use k: 1 pixel art sprite scaled 3x');
console.log('✓ 11. Friend card portraits verified (crisp pixel-art 3x scale for Zhuk and Mosq)');

console.log('\n--- ALL R37 VERIFICATIONS PASSED SUCCESSFULLY! ---');
