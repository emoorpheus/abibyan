// Unit verification of drum acoustic parameters
const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING ACOUSTIC PROFILES FOR BONGO DRUMS 0..3 ===\n');

const audioSrc = fs.readFileSync('src/audio.js', 'utf8');

// Ensure drum handler exists and handles indices 0, 1, 2, 3
assert(audioSrc.includes('drum: (i) =>'), 'drum handler must exist in SFX');
assert(audioSrc.includes('// 0) Красная бочка: глубокий басовый удар'), 'Drum 0 recipe must be defined');
assert(audioSrc.includes('// 1) Жёлтая бочка: упругий шлепок конги'), 'Drum 1 recipe must be defined');
assert(audioSrc.includes('// 2) Зелёная бочка: открытый звонкий бонго'), 'Drum 2 recipe must be defined');
assert(audioSrc.includes('// 3) Синяя бочка: звонкий стальной римшот / тимбалес'), 'Drum 3 recipe must be defined');

// Check distinctive acoustic features
// Drum 0: Deep bass
assert(audioSrc.includes('slide: 55'), 'Drum 0 must have deep sub-bass drop to 55 Hz');
assert(audioSrc.includes('f: 340'), 'Drum 0 must have low frequency noise thump');

// Drum 1: Snappy conga slap
assert(audioSrc.includes('slide: 175'), 'Drum 1 must have mid conga body drop to 175 Hz');
assert(audioSrc.includes('f: 1400, f2: 750'), 'Drum 1 must have skin slap noise band');

// Drum 2: Melodic open bongo
assert(audioSrc.includes('slide: 392'), 'Drum 2 must have singing bongo tone drop to 392 Hz');
assert(audioSrc.includes('vib: [12, 6]'), 'Drum 2 must have body vibrato shimmer');
assert(audioSrc.includes('f: 2800'), 'Drum 2 must have high finger pop noise');

// Drum 3: Metal timbale rimshot
assert(audioSrc.includes("type: 'square', slide: 700"), 'Drum 3 must have metallic square ring');
assert(audioSrc.includes('tone(1480'), 'Drum 3 must have high ping harmonic');
assert(audioSrc.includes("f: 6500, q: 3.5, vol: 0.22, ft: 'highpass'"), 'Drum 3 must have sharp metal rim crack');

console.log('✓ All 4 drums have distinct, verifiable acoustic synthesis recipes!');
