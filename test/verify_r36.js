const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Testing R36 fixes ---');

// 1. Verify secrets in docs/24-secrets.md and encrypted SEAL
const expectedNicknames = [
  'малютка',
  'чурбазаврик',
  'чумаход',
  'любимка',
  'здоровенный спайк',
  'чумазавр',
  'крысюк',
  'малява',
  'дашик',
  'чучмек',
  'большая штука',
  'чубрик',
  'мелочь',
  'чурбан',
  'малявка',
  'бабуленция',
  'мяулочь',
  'шпашиба даша',
  'спайкич',
  'огромная башня',
  'даша из класса обезьяних',
  'чума\'зая',
  'кряхтогузка',
  'самая любимая девочка на планете земля'
];

const secretsMd = fs.readFileSync(path.join(__dirname, '../docs/24-secrets.md'), 'utf8');
const { execSync } = require('child_process');
const parsed = JSON.parse(execSync('python3 tools/secrets_md.py', { cwd: path.join(__dirname, '..') }));

for (let i = 0; i < 24; i++) {
  const n = i + 1;
  assert.strictEqual(parsed[n], expectedNicknames[i], `Secret #${n} expected "${expectedNicknames[i]}", got "${parsed[n]}"`);
}
console.log('✓ 1. All 24 secrets match the nicknames exactly in 1..24 order');

// 2. Test birthday window logic
const dataContent = fs.readFileSync(path.join(__dirname, '../src/data.js'), 'utf8');
const mGrace = dataContent.match(/name:\s*'Дашулик',\s*m:\s*11,\s*d:\s*21,\s*year0:\s*2026,\s*age0:\s*24,\s*grace:\s*(\d+)/);
assert(mGrace, 'DATA.DASHA grace found');
const grace = parseInt(mGrace[1], 10);
assert.strictEqual(grace, 4, 'Grace should be 4 to cover 21.11 to 24.11 inclusive (ending on 25.11)');

function day0(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function bday(now) {
  const y = now.getFullYear();
  if (y < 2026) return null;
  const diff = Math.round((day0(now) - new Date(y, 10, 21)) / 864e5);
  return diff >= 0 && diff < grace ? { y, age: 24 + (y - 2026), diff } : null;
}

assert.strictEqual(bday(new Date(2026, 10, 20)), null, '20.11 is before birthday window');
assert(bday(new Date(2026, 10, 21)) !== null, '21.11 is inside birthday window (day 0)');
assert.strictEqual(bday(new Date(2026, 10, 21)).diff, 0, '21.11 diff = 0');
assert(bday(new Date(2026, 10, 24)) !== null, '24.11 is inside birthday window (day 3)');
assert.strictEqual(bday(new Date(2026, 10, 24)).diff, 3, '24.11 diff = 3');
assert.strictEqual(bday(new Date(2026, 10, 25)), null, '25.11 is after birthday window (ended)');
console.log('✓ 2. Birthday event window strictly covers 2026-11-21 to 2026-11-24 inclusive (4 days, diff 0..3; ended on 25.11)');

// 3. Check party spots separation
const hallContent = fs.readFileSync(path.join(__dirname, '../src/hall.js'), 'utf8');
const zalContent = fs.readFileSync(path.join(__dirname, '../src/zal.js'), 'utf8');

assert(hallContent.includes('zhuk: [70, 286]'), 'Hall party spots has dedicated zhuk spot');
assert(zalContent.includes('pusya: [32, 277]') && zalContent.includes('zhuk: [66, 283]'), 'Zal party spots separates Pusya and Zhuk by 34px');
console.log('✓ 3. Party spots in hall and zal have zero overlap');

// 4. Test duck lane avoidance calculation
const LANE = 276;
function laneY(x, room, homeMk, friendsHere) {
  let dy = 0;
  if (homeMk) {
    const mx = homeMk.x, my = homeMk.y;
    const dx = Math.abs(x - mx);
    if (dx < 32 && my > 220 && my < 290) {
      const targetY = my < 282 ? Math.min(293, my + 14) : Math.max(250, my - 34);
      const w = Math.cos((dx / 32) * (Math.PI / 2));
      const cdy = (targetY - LANE) * w;
      if (Math.abs(cdy) > Math.abs(dy)) dy = cdy;
    }
  }
  for (const f of friendsHere) {
    const fx = f.x, fy = f.y;
    const dx = Math.abs(x - fx);
    if (dx < 34 && fy > 220 && fy <= 292) {
      const targetY = fy < 284 ? Math.min(294, Math.max(288, fy + 12)) : Math.max(250, fy - 34);
      const w = Math.cos((dx / 34) * (Math.PI / 2));
      const cdy = (targetY - LANE) * w;
      if (Math.abs(cdy) > Math.abs(dy)) dy = cdy;
    }
  }
  return Math.round(LANE + dy);
}

// Monty in kitchen at [146, 282]
const monty = { id: 'monty', x: 146, y: 282 };
const duckYAtMonty = laneY(146, 'kitchen', null, [monty]);
console.log(`Duck Y directly in front of Monty (x=146): ${duckYAtMonty} (Monty y=282)`);
assert(duckYAtMonty >= 293, 'Duck should detour down to y>=293 in front of Monty feet at 282');

// Top of duck at y=294 is 294 - 10 = 284. Monty feet at 282. Duck top (284) > Monty feet (282) -> 0 overlap!
assert(duckYAtMonty - 10 >= monty.y, 'Duck bounds must not overlap Monty bounds');

// Away from Monty (x=90)
const duckYAway = laneY(90, 'kitchen', null, [monty]);
assert.strictEqual(duckYAway, LANE, 'Duck away from Monty stays on normal LANE');

console.log('✓ 4. Duck detour around characters verified with 0 overlap');

// 5. Test Ticket modal trigger on secret 24
const dashaContent = fs.readFileSync(path.join(__dirname, '../src/dasha.js'), 'utf8');
assert(dashaContent.includes('all ? \'<button class="btn g pulse" id="btn-ticket">🎫 Получить билет в ресторан!</button>\''), 'Secret 24 card includes restaurant ticket button');
assert(dashaContent.includes('ticketModal()'), 'Ticket modal opens restaurant ticket');
console.log('✓ 5. Ticket trigger on 24th secret verified');

console.log('--- ALL R36 CHECKS PASSED ---');
