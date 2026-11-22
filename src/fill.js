'use strict';
// Round 48: FILL disabled completely. The actual game canvas (#cv) stretches adaptively
// across the entire screen (100vw x 100vh) in standalone/app mode without extra surrounding drawings.
const FILL = (() => {
  function layout() {
    const ec = document.getElementById('ext');
    if (ec) { ec.style.display = 'none'; ec.width = 1; ec.height = 1; }
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.classList.remove('fill', 'mode-fill');
      document.documentElement.style.backgroundColor = '';
      if (document.body) document.body.style.backgroundColor = '';
    }
  }
  function draw() {}
  return { layout, draw, get on() { return false; }, get state() { return { on: false }; } };
})();
