'use strict';
// ===== Round 19: the voice bank comes after the first frame. src/speech.js (tools/tts.py) + src/voice_rec.js (tools/rec.py) stay the
// source; build.py turns them into plain text — '@section' lines and 'key\tbase64\tnumber…' lines — that arrives after the main script:
// inert text/plain script blocks (.vb) in the one-file build (AUDIO.voiceInline), voice1.txt / voice2.txt on the website
// (AUDIO fetches them, the service worker keeps them for offline). ready: bit 1 = lines, reactions, his recordings; bit 2 = words, syllables.
const SPEECH = { lines: {}, words: {}, syl: {}, fx: {}, rec: {}, ready: 0 };
