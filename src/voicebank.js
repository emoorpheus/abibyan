'use strict';
// ===== Round 19 & 36: Priority zero-delay voice bank embedded directly in JS bundle =====
// Dasha & Birthday lines, greetings, and reactions are available synchronously on frame 0 (SPEECH.ready = 1)
// Full voice banks (voice1.txt, voice2.txt) continue downloading in the background.
const SPEECH = {
  lines: /*PRIO_LINES*/{},
  words: {},
  syl: {},
  fx: /*PRIO_FX*/{},
  rec: {},
  ready: 1
};
