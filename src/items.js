'use strict';
// ===== Item / food / icon sprites built with the shaded sprite engine =====
const ART = (() => {
  const SP = MONKEY.sprite; const K = MONKEY.K; const IT = K.IT;
  const cache = {};
  function get(key, fn) { return cache[key] || (cache[key] = fn()); }
  const curve = (pts, n, rf) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n; const u = 1 - t; let x, y; if (pts.length === 3) { x = u * u * pts[0][0] + 2 * u * t * pts[1][0] + t * t * pts[2][0]; y = u * u * pts[0][1] + 2 * u * t * pts[1][1] + t * t * pts[2][1]; } else { x = u * u * u * pts[0][0] + 3 * u * u * t * pts[1][0] + 3 * u * t * t * pts[2][0] + t * t * t * pts[3][0]; y = u * u * u * pts[0][1] + 3 * u * u * t * pts[1][1] + 3 * u * t * t * pts[2][1] + t * t * t * pts[3][1]; } out.push([x, y, rf(t)]); } return out; };
  const steam = (d, x, y, n = 2) => { for (let k = 0; k < n; k++) { const xx = x + k * 3; [[0, 0], [1, -1], [1, -2], [0, -3]].forEach(([a, b]) => d.px(xx + a, y + b, '#ffffff')); } };

  // ---- foods (16x16) ----
  const FOOD_ART = {
    milk: () => SP(16, 16, (a) => {
      a.ellU([[8, 2.4, 1.5, 1.9], [8, 4.6, 2.5, 1.1]], IT, a.mat('teat', '#f2b277'));
      a.box(4.4, 4.8, 11.6, 6.8, IT, a.mat('ringB', '#6cb6f0'));
      a.rbox(4.4, 6.4, 11.6, 15.4, 1.8, IT, a.mat('bottle', '#f2f6fa'));
    }, (d) => { for (let y = 9; y <= 13; y += 2) { d.px(10, y, '#8fb4d2'); d.px(9, y, '#b8d2e6'); } d.px(5, 8, '#ffffff'); d.px(5, 9, '#ffffff'); d.px(5, 10, '#ffffff'); d.px(6, 5, '#bfe2ff'); d.px(7, 1, '#ffe0c0'); }),
    puree: () => SP(16, 16, (a) => {
      a.rbox(3.6, 1.4, 12.4, 4.6, 1, IT, a.mat('lidP', '#e8504a'));
      a.rbox(3.2, 4.2, 12.8, 15.2, 2, IT, a.mat('pureeJ', '#ffb04a'));
      a.box(4.2, 7.6, 11.8, 12, IT, a.mat('labelP', '#fff4dc'));
    }, (d) => { [[6, 9], [7, 9], [6, 10], [7, 10]].forEach(([x, y]) => d.px(x, y, '#df3a40')); d.px(7, 8, '#5fb043'); d.px(9, 11, '#f4cc3a'); d.px(10, 10, '#f4cc3a'); d.px(11, 9, '#e8b020'); d.px(4, 5, '#ffe6b8'); d.px(4, 6, '#ffe6b8'); [[5, 2], [8, 3], [11, 2]].forEach(([x, y]) => d.px(x, y, '#ffffff')); }),
    banana: () => SP(16, 16, (a) => {
      const m = a.mat('banana', '#f4cc3a');
      a.tube(curve([[2.6, 5.2], [4.5, 14.2], [11.5, 12.5], [13.4, 4.6]], 14, (t) => 1.05 + 1.75 * Math.sin(Math.PI * Math.min(1, t * 1.08))), IT, m);
      a.tube([[13.2, 5.2, 1.05], [13.9, 2.4, 0.85]], IT, a.mat('bstem', '#86622e'));
    }, (d) => { d.px(2, 4, '#5a3a1c'); d.px(2, 5, '#5a3a1c'); d.px(6, 10, '#fff1a6'); d.px(7, 11, '#fff1a6'); d.px(5, 9, '#fff1a6'); }),
    apple: () => SP(16, 16, (a) => {
      a.ell(8, 9.6, 5.9, 5.4, IT, a.mat('apple', '#df3a40'));
      a.tube([[8.2, 5, 0.7], [8.9, 2.1, 0.6]], IT, a.mat('stem', '#6d4526'));
      a.tube([[9.6, 4.4, 0.5], [11.2, 2.9, 1.25], [13.1, 2.2, 0.45]], IT, a.mat('leaf', '#5fb043'));
    }, (d) => { d.px(5, 7, '#ffd0c8'); d.px(5, 8, '#ffb0a6'); d.px(6, 6, '#ffd0c8'); d.px(7, 5, '#8a1c24'); d.px(9, 5, '#8a1c24'); }),
    watermelon: () => SP(16, 16, (a) => {
      a.ell(8, 5.5, 7.4, 8.6, IT, a.mat('rind', '#3f9a3f'), { clip: (x, y) => y >= 5.5, flat: 0.62 });
      a.ell(8, 5.5, 6.5, 7.6, IT, a.mat('rindw', '#dcecb4'), { clip: (x, y) => y >= 5.5, flat: 0.75, edge: 0 });
      a.ell(8, 5.5, 5.8, 6.8, IT, a.mat('flesh', '#ef4a52'), { clip: (x, y) => y >= 5.5, flat: 0.7, edge: 0 });
    }, (d) => { [[5, 8], [8, 9], [11, 8], [6.5, 11], [9.5, 11.5], [8, 7]].forEach(([x, y]) => { d.px(Math.round(x), Math.round(y), '#2a1416'); d.px(Math.round(x), Math.round(y) - 1, '#5e2a2e'); }); for (let x = 3; x <= 12; x++) d.pxk(x, 6, '#ff8a8e', 1 << 20); }),
    salad: () => SP(16, 16, (a) => {
      const lf = a.mat('lettuce', '#6cc24a');
      a.ell(4.6, 8, 3.3, 3, IT, lf); a.ell(11.4, 8, 3.3, 3, IT, lf); a.ell(8, 6.6, 3.6, 3.4, IT, a.mat('lettuce2', '#88d45a'));
      a.ell(10.6, 7.4, 1.9, 1.8, IT, a.mat('tomato', '#e5463d')); a.ell(5.4, 7, 1.6, 1.4, IT, a.mat('cucum', '#b9e07a'));
      a.ell(8, 9.2, 7.3, 5.4, IT, a.mat('bowlB', '#4f8fd8'), { clip: (x, y) => y >= 9.2 });
      a.box(1, 8.6, 15, 10, IT, a.mat('bowlW', '#f2f4f6'));
    }, (d) => { d.px(10, 6, '#ffb3a6'); d.px(5, 6, '#e8ffc0'); for (let x = 4; x <= 11; x += 2) d.pxk(x, 12, '#8fc1ff', 1 << 20); }),
    // Round 5 D: a stack of three golden pancakes on a plate with a pat of butter and a honey drip (cooked on the stove from milk)
    pancake: () => SP(16, 16, (a) => {
      a.ell(8, 12.8, 7.6, 2.3, IT, a.mat('plateW', '#f4f4f0'), { flat: 0.8 });
      a.rbox(1.8, 9.4, 14.2, 12, 1.3, IT, a.mat('pcake1', '#e4a246'));
      a.rbox(2.4, 7.3, 13.6, 9.9, 1.3, IT, a.mat('pcake2', '#ecb04e'));
      a.rbox(2.9, 5.2, 13.1, 7.8, 1.3, IT, a.mat('pcake3', '#f0b854'));
      a.box(6.3, 3.8, 9.5, 5.4, IT, a.mat('butter', '#ffe07a'));
    }, (d) => { for (const [x, y] of [[11, 7], [11, 8], [12, 9], [12, 10], [3, 9]]) d.px(x, y, '#c8781c'); d.px(12, 11, '#b8680e'); d.hline(4, 11, 7, '#c88a3a'); d.hline(3, 12, 9, '#c88a3a'); d.px(7, 4, '#fff4b8'); }),
    porridge: () => SP(16, 16, (a) => {
      a.tube([[10.5, 7.4, 0.7], [14.2, 2.4, 0.9]], IT, a.mat('spoon', '#b9c2cc'));
      a.ell(8, 8.8, 6.8, 2.6, IT, a.mat('porr', '#ecd29b'), { flat: 0.8 });
      a.box(6.5, 6.6, 9.6, 8.6, IT, a.mat('butter', '#ffe07a'));
      a.ell(8, 9.4, 7.3, 5.6, IT, a.mat('bowlWood', '#b06a3a', 2), { clip: (x, y) => y >= 9.4 });
      a.box(0.8, 8.9, 15.2, 10.2, IT, a.mat('bowlRim', '#c9844a'));
    }, (d) => { steam(d, 4, 4, 1); d.px(3, 8, '#fff1cf'); d.px(4, 8, '#fff1cf'); d.px(7, 7, '#fff6c8'); }),
    coffee: () => SP(16, 16, (a) => {
      a.tube([[11.4, 7.6, 1.1], [14.1, 8.4, 1.1], [14.2, 11.2, 1.1], [11.6, 12.4, 1.1]], IT, a.mat('mug', '#f0eeea'));
      a.box(3, 6.4, 12.2, 15, IT, a.mat('mug', '#f0eeea'));
      a.ell(7.6, 6.8, 4.4, 1.3, IT, a.mat('coffee', '#6d4024'), { flat: 0.6 });
    }, (d) => { steam(d, 5, 4, 2); for (let x = 4; x <= 11; x++) { d.pxk(x, 10, '#e8504a', 1 << 20); d.pxk(x, 11, '#c23b38', 1 << 20); } d.px(4, 8, '#ffffff'); d.px(4, 9, '#ffffff'); }),
    icecream: () => SP(16, 16, (a) => {
      a.poly([[3.2, 8.4], [12.8, 8.4], [8.4, 15.6], [7.6, 15.6]], IT, a.mat('cone', '#d99a50'));
      a.ell(8, 7.4, 5, 3.6, IT, a.mat('scoopW', '#fff2dc'));
      a.ell(8, 4.4, 4, 3.4, IT, a.mat('scoopP', '#f59ac2'));
      a.ell(9.2, 1.8, 1.5, 1.5, IT, a.mat('cherry', '#d8283a'));
    }, (d) => { for (let y = 10; y <= 14; y++) for (let x = 4; x <= 12; x++) if ((x + y) % 3 === 0) d.pxk(x, y, '#a86a2e', 1 << 20); d.px(6, 3, '#ffd3e6'); d.px(5, 4, '#ffd3e6'); d.px(8, 1, '#ff9aa6'); [[5, 6], [10, 5], [7, 6]].forEach(([x, y]) => d.px(x, y, ['#59c1ff', '#ffe14d', '#7be36b'][x % 3])); }),
    kvass: () => SP(16, 16, (a) => {
      a.tube([[11.6, 7, 1.15], [14.4, 8, 1.15], [14.4, 11.6, 1.15], [11.6, 12.6, 1.15]], IT, a.mat('glassH', '#c9d6dc'));
      a.box(3.2, 5.6, 12.2, 15.2, IT, a.mat('kvass', '#b8661c'), { vgrad: 0.15 });
      a.ellU([[4.8, 5, 2.4, 2], [7.8, 4.2, 2.8, 2.4], [10.6, 5, 2.3, 2]], IT, a.mat('foam', '#fff5e0'));
    }, (d) => { for (let y = 7; y <= 14; y++) { d.pxk(4, y, '#e9a24f', 1 << 20); d.pxk(5, y, '#d88a38', 1 << 20); } [[8, 12], [9, 9], [10, 13], [7, 10]].forEach(([x, y]) => d.px(x, y, '#f4c27a')); }),
    doshirak: () => SP(16, 16, (a) => {
      a.tube(curve([[3, 6], [6, 1], [9, 8], [12.5, 3]], 10, () => 0.75), IT, a.mat('noodle', '#f2cf6b'));
      a.tube([[11.8, 6.5, 0.6], [14.4, 0.8, 0.6]], IT, a.mat('fork', '#e8e0c8')); a.tube([[12.8, 6.6, 0.6], [15.2, 1.4, 0.6]], IT, a.mat('fork', '#e8e0c8'));
      a.poly([[1.6, 6.4], [14.4, 6.4], [13.2, 15.2], [2.8, 15.2]], IT, a.mat('dosh', '#d8342c'));
    }, (d) => { for (let x = 3; x <= 12; x++) { d.pxk(x, 9, '#fff1d6', 1 << 20); d.pxk(x, 10, '#fff1d6', 1 << 20); d.pxk(x, 11, '#ffd23a', 1 << 20); } d.px(6, 10, '#d8342c'); d.px(7, 10, '#d8342c'); d.px(9, 10, '#d8342c'); }),
    pelmeni: () => SP(16, 16, (a) => {
      a.ell(8, 10.4, 7.6, 4.2, IT, a.mat('plate', '#e2ebf2'), { flat: 0.78 });
      const dm = a.mat('dump', '#f4e8d2');
      a.ell(4.8, 8.6, 3, 2.3, IT, dm, { clip: (x, y) => y <= 9.6 }); a.ell(11.2, 8.6, 3, 2.3, IT, dm, { clip: (x, y) => y <= 9.6 });
      a.ell(8, 6.6, 3, 2.3, IT, dm, { clip: (x, y) => y <= 7.6 }); a.ell(8, 10.2, 3, 2.2, IT, dm, { clip: (x, y) => y <= 11.4 });
      a.ell(10.8, 5.4, 1.7, 1.3, IT, a.mat('smetana', '#ffffff'));
    }, (d) => { [[12, 4], [13, 5], [3, 7], [9, 12], [6, 9]].forEach(([x, y]) => d.px(x, y, '#3f9a3f')); }),
    shawarma: () => SP(16, 16, (a) => {
      a.tube([[4.4, 12.4, 3.4], [11.2, 4.6, 3.2]], IT, a.mat('lavash', '#ecd5a4'));
      a.ell(11.8, 4, 2.9, 2.8, IT, a.mat('meat', '#a2622e'));
      a.tube([[3.2, 14, 3.6], [7.4, 9.1, 3.6]], IT, a.mat('paper', '#f6f2ea'));
    }, (d) => { [[10, 2], [13, 3], [12, 5]].forEach(([x, y]) => d.px(x, y, '#6cc24a')); [[11, 4], [13, 5]].forEach(([x, y]) => d.px(x, y, '#e5463d')); d.px(10, 3, '#ffffff'); for (let k = 0; k < 4; k++) d.pxk(3 + k, 11 - k + 3, '#d8342c', 1 << 20); }),
    burger: () => SP(16, 16, (a) => {
      a.ell(8, 7, 6.9, 4.6, IT, a.mat('bun', '#e2a14a'), { clip: (x, y) => y <= 7.4 });
      a.tube([[1.4, 8.6, 1.05], [4, 9.2, 1.05], [6.6, 8.4, 1.05], [9.4, 9.2, 1.05], [12, 8.4, 1.05], [14.6, 9, 1.05]], IT, a.mat('lettuce', '#6cc24a'));
      a.poly([[2, 9.2], [14, 9.2], [12.4, 11.6], [10.6, 10.4], [8.4, 12], [6, 10.4], [3.6, 11.6]], IT, a.mat('cheese', '#ffc93c'));
      a.box(1.6, 10, 14.4, 12.6, IT, a.mat('patty', '#7c4426', 4));
      a.ell(8, 12.8, 6.4, 2.2, IT, a.mat('bun', '#e2a14a'), { flat: 0.7 });
    }, (d) => { [[5, 4], [8, 3], [10, 5], [6, 6], [11, 3]].forEach(([x, y]) => d.px(x, y, '#fff3d0')); d.px(4, 5, '#ffd08a'); d.px(5, 5, '#ffd08a'); }),
    cake: () => SP(16, 16, (a) => {
      a.box(7.4, 1.2, 8.8, 5.6, IT, a.mat('candle', '#6fb7ff'));
      a.box(1.6, 6, 14.4, 15, IT, a.mat('cakeP', '#f5a3c0'));
      a.ellU([[3, 6.6, 1.6, 1.7], [5.6, 6.8, 1.5, 2.1], [8, 6.6, 1.6, 1.7], [10.4, 6.9, 1.5, 2.3], [13, 6.6, 1.6, 1.8], [8, 6, 6.6, 1.2]], IT, a.mat('creamW', '#fff6ea'));
      a.ell(4.4, 5.2, 1.4, 1.3, IT, a.mat('straw', '#e83a4a')); a.ell(11.6, 5.2, 1.4, 1.3, IT, a.mat('straw', '#e83a4a'));
    }, (d) => { d.px(8, 0, '#ffe14d'); d.px(7, 0, '#ff9a3a'); d.px(8, -1, '#ffe14d'); for (let x = 2; x <= 13; x++) { d.pxk(x, 11, '#fff6ea', 1 << 20); d.pxk(x, 12, '#c8507a', 1 << 20); } }),
    energy: () => SP(16, 16, (a) => {
      a.box(4.2, 2.4, 11.8, 15, IT, a.mat('can', '#2f7fd8'));
      a.box(4.6, 1.2, 11.4, 2.6, IT, a.mat('canTop', '#c2cad4'));
    }, (d) => { [[8, 5], [7, 6], [7, 7], [6, 8], [7, 8], [8, 8], [9, 8], [8, 9], [8, 10], [7, 11]].forEach(([x, y]) => d.px(x, y, '#ffe14d')); for (let y = 3; y <= 14; y++) d.pxk(5, y, '#7fb8ff', 1 << 20); }),
    tea: () => SP(16, 16, (a) => {
      a.tube([[11.4, 8.6, 1], [14, 9.4, 1], [14, 12, 1], [11.6, 12.8, 1]], IT, a.mat('cup2', '#e9f4e6'));
      a.ell(8, 9.4, 5.2, 5.6, IT, a.mat('cup2', '#e9f4e6'), { clip: (x, y) => y >= 8 });
      a.ell(8, 8.4, 4.6, 1.2, IT, a.mat('teaL', '#9bbf4a'), { flat: 0.6 });
    }, (d) => { steam(d, 6, 5, 2); for (let y = 2; y <= 8; y++) d.px(11, y, '#d9d2c4'); d.px(11, 1, '#ffffff'); d.px(12, 1, '#7fb04a'); d.px(12, 2, '#7fb04a'); d.px(11, 2, '#7fb04a'); }),
    fertilizer: () => SP(16, 16, (a) => {
      a.ellU([[8, 10, 5.6, 5.2], [8, 4.5, 3.6, 2.4]], IT, a.mat('sack', '#c08f55', 4));
      a.box(4.6, 5.4, 11.4, 6.6, IT, a.mat('rope', '#7a5230'));
    }, (d) => { [[7, 9], [8, 8], [9, 9], [8, 10], [8, 11], [7, 12], [9, 12], [6, 10], [10, 10]].forEach(([x, y], i) => d.px(x, y, i < 4 ? '#5fb043' : '#3f8a2c')); }),
    soap: () => SP(16, 16, (a) => {
      a.ellU([[8, 10, 6.4, 3.8], [8, 9, 5.8, 3.6]], IT, a.mat('soap', '#f59ac0'));
      a.ell(4.6, 4.4, 2.2, 2.2, IT, a.mat('bub', '#d8f2ff')); a.ell(10.8, 3.2, 1.6, 1.6, IT, a.mat('bub', '#d8f2ff'));
    }, (d) => { d.px(4, 3, '#ffffff'); d.px(10, 2, '#ffffff'); for (let x = 5; x <= 10; x++) d.pxk(x, 8, '#ffd3e6', 1 << 20); }),
    potion: () => SP(16, 16, (a) => {
      a.box(6.4, 1.2, 9.6, 3.6, IT, a.mat('cork', '#b0773c'));
      a.ellU([[8, 10.4, 5.2, 5], [8, 4.6, 1.9, 2.2]], IT, a.mat('glassG', '#bfe6ff'));
      a.ell(8, 11.2, 4.2, 3.8, IT, a.mat('liquid', '#ff5c8a'), { clip: (x, y) => y >= 8.6 });
    }, (d) => { d.px(5, 8, '#ffffff'); d.px(5, 9, '#ffffff'); d.px(9, 11, '#ffc2d4'); d.px(7, 12, '#ffc2d4'); }),
  };
  function food(id) { return get('f_' + id, FOOD_ART[id] || FOOD_ART.banana); }

  // ---- UI icons (12x12) ----
  const ICON_ART = {
    chat: () => SP(12, 12, (a) => { const w = a.mat('chatB', '#ffffff'); a.rbox(0.6, 1, 11.4, 8.6, 2.4, IT, w); a.poly([[2.4, 7.4], [5.8, 7.4], [2, 11.2]], IT, w); }, (d) => { d.px(3, 5, '#5d6470'); d.px(6, 5, '#5d6470'); d.px(9, 5, '#5d6470'); }),
    sprout: () => SP(12, 12, (a) => {
      a.ell(6, 10.6, 4.8, 1.6, IT, a.mat('soil', '#8a5a2a'), { flat: 0.8 });
      a.tube([[6, 10.2, 0.75], [6, 5.4, 0.7]], IT, a.mat('stemG', '#4f9a3a'));
      a.ell(3.5, 4.8, 2.9, 1.8, IT, a.mat('leafS', '#6cc24a'));
      a.ell(8.6, 3.6, 3.1, 2, IT, a.mat('leafS', '#6cc24a'));
    }, (d) => { d.px(3, 4, '#c4f29a'); d.px(8, 3, '#c4f29a'); d.px(9, 3, '#c4f29a'); }),
    tasks: () => SP(12, 12, (a) => {
      a.rbox(1.4, 1.6, 10.6, 11.8, 1, IT, a.mat('board', '#c8884a'));
      a.box(2.6, 2.8, 9.4, 10.8, IT, a.mat('paper', '#fffaf0'));
      a.rbox(4, 0.4, 8, 2.8, 0.6, IT, a.mat('clipM', '#a7adb8'));
    }, (d) => { for (const y of [4, 6, 8]) { d.px(3, y + 1, '#3fbf5a'); d.px(4, y + 2 - 1, '#3fbf5a'); d.hline(6, 8, y + 1, '#9a8a7a'); } d.px(3, 10, '#3fbf5a'); }),
    coin: () => SP(12, 12, (a) => { a.ell(6, 6, 5.5, 5.5, IT, a.mat('gold', '#f2bf33'), { flat: 0.74 }); a.ell(6, 6, 3.7, 3.7, IT, a.mat('gold', '#f2bf33'), { edge: 1, flat: 0.62 }); }, (d) => { [[5, 4], [6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8], [5, 8], [7, 8]].forEach(([x, y]) => d.px(x, y, '#fff2a8')); d.px(2, 4, '#fff6c0'); d.px(3, 3, '#fff6c0'); d.px(2, 5, '#fff6c0'); }),
    food: () => food('banana'),
    fun: () => SP(12, 12, (a) => { a.ell(6, 6, 5.2, 5.2, IT, a.mat('ballR', '#ef5a5a')); }, (d) => { for (let y = 1; y <= 11; y++) { d.pxk(5, y, '#ffffff', 1 << 20); d.pxk(6, y, '#ffffff', 1 << 20); } for (let x = 1; x <= 11; x++) d.pxk(x, 6, '#ffe14d', 1 << 20); d.px(3, 3, '#ffd0d0'); }),
    energy: () => SP(12, 12, (a) => { a.poly([[7.8, 0.2], [1.4, 7], [5.4, 7], [3.4, 11.8], [10.8, 4.4], [6.6, 4.4], [9.6, 0.2]], IT, a.mat('bolt', '#ffd23a')); }),
    clean: () => SP(12, 12, (a) => { a.ell(4.6, 7, 3.6, 3.6, IT, a.mat('bub', '#bfe9ff')); a.ell(8.6, 4.4, 2.8, 2.8, IT, a.mat('bub', '#bfe9ff')); a.ell(9, 9.2, 1.8, 1.8, IT, a.mat('bub', '#bfe9ff')); }, (d) => { d.px(3, 5, '#ffffff'); d.px(4, 5, '#ffffff'); d.px(8, 3, '#ffffff'); d.px(8, 8, '#ffffff'); }),
    // Round 6 E: the phone, the computer, «Банановая башня»
    phone: () => SP(12, 12, (a) => { a.rbox(3, 0.6, 9, 11.4, 1.2, IT, a.mat('phB', '#2e2e38')); }, (d) => { for (let y = 2; y <= 8; y++) for (let x = 4; x <= 7; x++) d.px(x, y, y < 4 ? '#8cd8ff' : '#59c1ff'); d.px(5, 5, '#ffd23a'); d.px(6, 6, '#ffd23a'); d.px(5, 10, '#8a8a98'); d.px(6, 10, '#8a8a98'); }),
    pc: () => SP(12, 12, (a) => { a.box(0.6, 1, 11.4, 8.4, IT, a.mat('pcB', '#3a3f4a')); a.box(5, 8.2, 7, 10.6, IT, a.mat('pcS', '#5a606c')); a.box(2.6, 10.2, 9.4, 11.6, IT, a.mat('pcS', '#5a606c')); }, (d) => { for (let y = 2; y <= 7; y++) for (let x = 2; x <= 9; x++) d.px(x, y, y < 4 ? '#7fd0ff' : '#3f86d8'); d.px(3, 5, '#3fdc7a'); d.px(4, 5, '#3fdc7a'); d.px(6, 4, '#ffd23a'); }),
    stack: () => SP(12, 12, (a) => { const w = a.mat('crt', '#c8893a'); a.box(1.4, 8, 10.6, 11.6, IT, w); a.box(2.6, 4.4, 10, 8, IT, w); a.box(3.4, 0.8, 8.6, 4.4, IT, w); }, (d) => { for (const [x, y] of [[3, 9], [7, 9], [4, 5], [8, 5], [5, 1], [6, 1]]) { d.px(x, y, '#ffd23a'); } d.px(2, 10, '#a86a28'); d.px(9, 6, '#a86a28'); }),
    // Round 7 #6: the console games — «Супер Абибян» (a red spotted mushroom) and «Банановые гонки» (a yellow race car)
    roofs: () => SP(12, 12, (a) => { a.box(0.4, 6, 5.8, 11.8, IT, a.mat('rfA', '#c4603c')); a.box(6.8, 3.6, 11.6, 11.8, IT, a.mat('rfB', '#8a9cb4')); a.box(0, 5.2, 6.2, 6.4, IT, a.mat('rfT', '#4a3e4c')); a.box(6.4, 2.8, 12, 4, IT, a.mat('rfT', '#4a3e4c')); }, (d) => { for (const [x, y] of [[2, 8], [4, 8], [2, 10], [4, 10], [8, 6], [10, 6], [8, 8], [10, 8], [8, 10], [10, 10]]) d.px(x, y, '#e8f0f8'); for (const [x, y] of [[2, 3], [3, 2], [4, 1], [5, 1], [6, 1]]) d.px(x, y, '#ffd23a'); }),
    shroom: () => SP(12, 12, (a) => { a.ell(6, 5.2, 5.6, 4.6, IT, a.mat('shrC', '#e8403a'), { clip: (x, y) => y <= 6.6 }); a.rbox(3.6, 6, 8.4, 11.6, 1.4, IT, a.mat('shrS', '#f4e6c8')); }, (d) => { for (const [x, y] of [[3, 3], [4, 3], [8, 2], [9, 3], [6, 5], [2, 5]]) d.px(x, y, '#ffffff'); d.px(5, 8, '#2a1a10'); d.px(7, 8, '#2a1a10'); }),
    car: () => SP(12, 12, (a) => { const b = a.mat('carY', '#ffd23a'); a.rbox(0.4, 5, 11.6, 9.4, 1.4, IT, b); a.rbox(3, 2.2, 9, 5.6, 1.2, IT, b); a.ell(3.2, 9.4, 1.9, 1.9, IT, a.mat('tyre', '#2e2e38')); a.ell(8.8, 9.4, 1.9, 1.9, IT, a.mat('tyre', '#2e2e38')); }, (d) => { d.hline(4, 5, 3, '#8cd8ff'); d.hline(7, 8, 3, '#8cd8ff'); d.px(11, 6, '#ff5c6c'); d.px(1, 6, '#fff6c0'); d.hline(3, 9, 7, '#e8403a'); }),
    shop: () => SP(12, 12, (a) => { a.tube([[3.6, 4.6, 0.7], [4, 1.6, 0.7], [8, 1.6, 0.7], [8.4, 4.6, 0.7]], IT, a.mat('handle', '#8a5a2a')); a.box(1.4, 4, 10.6, 11.4, IT, a.mat('bag', '#ff8a3a')); }, (d) => { d.px(5, 7, '#ffe6c8'); d.px(6, 7, '#ffe6c8'); d.px(6, 8, '#ffe6c8'); d.px(5, 9, '#ffe6c8'); d.px(6, 9, '#ffe6c8'); }),
    shirt: () => SP(12, 12, (a) => { a.poly([[3.6, 1], [8.4, 1], [11.6, 3.6], [10.2, 6], [9, 5.4], [9, 11.4], [3, 11.4], [3, 5.4], [1.8, 6], [0.4, 3.6]], IT, a.mat('shirtB', '#4f8fe8')); }, (d) => { d.px(5, 2, '#2d5fb0'); d.px(6, 3, '#2d5fb0'); d.px(7, 2, '#2d5fb0'); d.px(5, 6, '#ffe14d'); d.px(6, 6, '#ffe14d'); d.px(7, 7, '#ffe14d'); }),
    game: () => SP(12, 12, (a) => { a.ellU([[3.4, 6.8, 3, 3.4], [8.6, 6.8, 3, 3.4], [6, 6, 4, 2.4]], IT, a.mat('pad', '#7c5ab8')); }, (d) => { d.px(2, 6, '#ffffff'); d.px(3, 5, '#ffffff'); d.px(3, 6, '#ffffff'); d.px(4, 6, '#ffffff'); d.px(3, 7, '#ffffff'); d.px(9, 5, '#ff5c6c'); d.px(8, 7, '#ffe14d'); }),
    mic: () => SP(12, 12, (a) => { a.tube([[2.6, 5.4, 0.7], [3.2, 8.2, 0.7], [6, 9.2, 0.7], [8.8, 8.2, 0.7], [9.4, 5.4, 0.7]], IT, a.mat('micS', '#8a8f98')); a.tube([[6, 9.4, 0.7], [6, 11.6, 0.7]], IT, a.mat('micS', '#8a8f98')); a.rbox(3.8, 0.4, 8.2, 8, 2.2, IT, a.mat('micH', '#e8504a')); }, (d) => { for (let y = 2; y <= 4; y++) { d.pxk(5, y, '#ffb0a6', 1 << 20); } d.hline(4, 7, 5, '#a8302c', 1 << 20); }),
    camera: () => SP(12, 12, (a) => { a.box(3.6, 1.8, 7.6, 3.6, IT, a.mat('camB', '#4a4f5a')); a.box(0.6, 3, 11.4, 10.6, IT, a.mat('camB', '#4a4f5a')); a.ell(6, 6.8, 2.8, 2.8, IT, a.mat('lens', '#7fb8ff')); }, (d) => { d.px(5, 6, '#ffffff'); d.px(9, 4, '#ff5c6c'); }),
    gear: () => SP(12, 12, (a) => { const g = a.mat('gear', '#a7adb8'); a.ell(6, 6, 4.4, 4.4, IT, g, { sp: { n: 8, a: 1.5, seed: 0 } }); }, (d) => { for (let y = 5; y <= 6; y++) for (let x = 5; x <= 6; x++) d.px(x, y, '#3b3540'); }),
    trophy: () => SP(12, 12, (a) => { const g = a.mat('gold', '#f2bf33'); a.tube([[2.6, 2.4, 0.8], [1, 3.8, 0.8], [2.8, 6.2, 0.8]], IT, g); a.tube([[9.4, 2.4, 0.8], [11, 3.8, 0.8], [9.2, 6.2, 0.8]], IT, g); a.ell(6, 3.4, 3.8, 4.4, IT, g, { clip: (x, y) => y >= 1.2 }); a.box(5.2, 6.8, 6.8, 9.4, IT, g); a.box(3, 9.4, 9, 11.6, IT, a.mat('wood', '#8a5a2a')); }, (d) => { d.px(4, 2, '#fff6c0'); d.px(4, 3, '#fff6c0'); }),
    gift: () => SP(12, 12, (a) => { a.box(2, 6, 10, 10.9, IT, a.mat('giftR', '#e8504a')); a.box(1, 3.6, 11, 6, IT, a.mat('giftR2', '#f26a5c')); a.ell(4.1, 2.3, 1.9, 1.3, IT, a.mat('ribbon', '#ffd23a')); a.ell(7.9, 2.3, 1.9, 1.3, IT, a.mat('ribbon', '#ffd23a')); }, (d) => { for (let y = 4; y <= 10; y++) { d.px(5, y, '#ffd23a'); d.px(6, y, '#f2b92a'); } d.px(5, 3, '#e0a41c'); d.px(6, 3, '#c98a14'); d.px(3, 2, '#fff2a8'); d.px(7, 2, '#fff2a8'); }),
    bulb: () => SP(12, 12, (a) => { a.box(4.2, 8.2, 7.8, 11.4, IT, a.mat('base', '#9aa3b0')); a.ell(6, 5, 4.2, 4.4, IT, a.mat('glassY', '#ffe680')); }, (d) => { d.px(4, 3, '#ffffff'); d.px(4, 4, '#ffffff'); d.px(5, 9, '#5d6470'); d.px(6, 10, '#5d6470'); }),
    moon: () => SP(12, 12, (a) => { a.ell(6, 6, 5, 5, IT, a.mat('moon', '#ffe58a'), { clip: (x, y) => Math.hypot(x - 8.6, y - 4.2) > 4.2 }); }),
    shower: () => SP(12, 12, (a) => { a.tube([[1.6, 11, 0.9], [1.6, 3, 0.9], [4.4, 1.4, 0.9], [7.4, 2.6, 0.9]], IT, a.mat('pipe', '#b9c2cc')); a.ell(8, 4.6, 3.6, 2.2, IT, a.mat('pipe', '#b9c2cc'), { clip: (x, y) => y >= 3.6 }); }, (d) => { [[6, 8], [8, 9], [10, 8], [7, 11], [9, 11]].forEach(([x, y]) => d.px(x, y, '#59c1ff')); }),
    soap: () => SP(12, 12, (a) => { a.ellU([[6, 7.6, 5, 3.2], [6, 6.8, 4.4, 3]], IT, a.mat('soap', '#f59ac0')); a.ell(3, 2.6, 1.6, 1.6, IT, a.mat('bub', '#d8f2ff')); a.ell(8.6, 1.8, 1.2, 1.2, IT, a.mat('bub', '#d8f2ff')); }),
    can: () => SP(12, 12, (a) => { a.ell(5, 7.4, 4.2, 3.6, IT, a.mat('canG', '#5fb0e8')); a.tube([[8.4, 6.4, 0.9], [11.2, 3.6, 0.8]], IT, a.mat('canG', '#5fb0e8')); a.tube([[2.4, 4.6, 0.8], [4.6, 1.8, 0.8], [7, 4, 0.8]], IT, a.mat('canG', '#5fb0e8')); }, (d) => { d.px(11, 5, '#59c1ff'); d.px(11, 7, '#59c1ff'); d.px(10, 8, '#59c1ff'); }),
    heart: () => SP(12, 12, (a) => { a.ellU([[3.8, 4.6, 3, 3.1], [8.2, 4.6, 3, 3.1]], IT, a.mat('heart', '#ef4d6a')); a.poly([[1, 5.6], [11, 5.6], [6, 11.4]], IT, a.mat('heart', '#ef4d6a')); }, (d) => { d.px(3, 3, '#ffd0da'); d.px(3, 4, '#ffb0c0'); }),
    star: () => SP(12, 12, (a) => { const pts = []; for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.4 : 5.6; pts.push([6 + Math.cos(an) * r, 6.4 + Math.sin(an) * r]); } a.poly(pts, IT, a.mat('starY', '#ffd23a')); }),
    lock: () => SP(12, 12, (a) => { a.tube([[3.6, 6, 0.9], [3.6, 3, 0.9], [6, 1.2, 0.9], [8.4, 3, 0.9], [8.4, 6, 0.9]], IT, a.mat('lockS', '#a7adb8')); a.box(2, 5.4, 10, 11.6, IT, a.mat('lockG', '#f2bf33')); }, (d) => { d.px(6, 8, '#6b4a12'); d.px(6, 9, '#6b4a12'); }),
    scale: () => SP(12, 12, (a) => { a.box(0.8, 3, 11.2, 11.4, IT, a.mat('scaleW', '#e8eef4')); a.ell(6, 6.4, 3, 2.2, IT, a.mat('dial', '#ffffff'), { clip: (x, y) => y <= 6.8 }); }, (d) => { d.px(6, 5, '#e8504a'); d.px(7, 4, '#e8504a'); }),
    home: () => SP(12, 12, (a) => { a.poly([[6, 0.6], [11.6, 6], [0.4, 6]], IT, a.mat('roof', '#e8504a')); a.box(2, 5.6, 10, 11.6, IT, a.mat('wall', '#f4e3c8')); a.box(5, 7.6, 7.6, 11.6, IT, a.mat('door', '#8a5a2a')); }),
    tree: () => SP(12, 12, (a) => { a.box(5, 6, 7, 11.6, IT, a.mat('trunk', '#8a5a2a', 2)); a.ellU([[6, 3.8, 5.4, 3], [3, 5.6, 2.6, 2], [9, 5.6, 2.6, 2]], IT, a.mat('leaf', '#5fb043')); }, (d) => { d.px(4, 6, '#ffe14d'); d.px(5, 7, '#ffe14d'); }),
    balloon: () => SP(12, 12, (a) => { a.ell(6, 4.8, 4.6, 4.6, IT, a.mat('balR', '#ef4d4d')); a.poly([[5, 9], [7, 9], [6, 10.4]], IT, a.mat('balR', '#ef4d4d')); }, (d) => { d.px(6, 11, '#5d6470'); d.px(5, 11, '#5d6470'); d.px(3, 3, '#ffd0d0'); d.px(4, 2, '#ffd0d0'); }),
    drum: () => SP(12, 12, (a) => { a.box(1.4, 4.6, 10.6, 11, IT, a.mat('drumB', '#d8553a')); a.ell(6, 4.6, 4.6, 2.2, IT, a.mat('skinDr', '#f4e6c8'), { flat: 0.8 }); }, (d) => { for (let x = 2; x <= 10; x += 2) { d.px(x, 7, '#f2c94c'); d.px(x + 1, 8, '#f2c94c'); } }),
    barbell: () => SP(12, 12, (a) => { a.tube([[0.5, 6, 0.6], [11.5, 6, 0.6]], IT, a.mat('bar', '#c2c8d0')); a.rbox(1.2, 2, 3.6, 10, 1, IT, a.mat('plate', '#3b3742')); a.rbox(8.4, 2, 10.8, 10, 1, IT, a.mat('plate', '#3b3742')); }, null),
    note: () => SP(12, 12, (a) => { a.ell(3.6, 9.4, 2.6, 2, IT, a.mat('noteC', '#5d6470')); a.box(5.2, 1, 6.6, 9.4, IT, a.mat('noteC', '#5d6470')); a.tube([[6, 1.4, 0.8], [9.6, 3.4, 0.8], [9.8, 5.4, 0.7]], IT, a.mat('noteC', '#5d6470')); }),
  };
  function icon(id) { return get('i_' + id, ICON_ART[id] || ICON_ART.star); }
  const urlCache = {};
  function url(kind, id) { const k = kind + id; if (urlCache[k]) return urlCache[k]; const cv = kind === 'f' ? food(id) : icon(id); return (urlCache[k] = cv.toDataURL()); }
  return { food, icon, url, FOOD_ART, ICON_ART, curve, get };
})();
