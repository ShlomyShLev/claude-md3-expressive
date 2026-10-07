'use strict';

/** Parse #rgb, #rrggbb or #rrggbbaa into {r,g,b,a} (0 to 255, alpha 0 to 1). */
function parseHex(input) {
  if (typeof input !== 'string') throw new Error('Color must be a string like #0a1b2c');
  let h = input.trim().replace(/^#/, '');
  if (![3, 4, 6, 8].includes(h.length) || /[^0-9a-f]/i.test(h)) {
    throw new Error(`Not a hex color: "${input}". Use #rgb, #rrggbb or #rrggbbaa.`);
  }
  if (h.length <= 4) h = h.split('').map(c => c + c).join('');
  const n = i => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
}

function blend(fg, bg) {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1
  };
}

function luminance({ r, g, b }) {
  const lin = v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.x contrast ratio. A translucent foreground is composited over the background first. */
function ratio(fgHex, bgHex) {
  const bg = parseHex(bgHex);
  if (bg.a < 1) throw new Error('The background must be opaque. Composite it over the page color first.');
  const fg = blend(parseHex(fgHex), bg);
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function check(fgHex, bgHex) {
  const r = ratio(fgHex, bgHex);
  return {
    foreground: fgHex,
    background: bgHex,
    ratio: +r.toFixed(2),
    aaNormalText: r >= 4.5,
    aaLargeText: r >= 3,
    aaaNormalText: r >= 7,
    nonTextUi: r >= 3
  };
}

module.exports = { parseHex, ratio, check };
