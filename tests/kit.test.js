'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { tokens, generateCss } = require('../mcp-server/lib/tokens');
const components = require('../mcp-server/lib/components');
const contrast = require('../mcp-server/lib/contrast');
const { lint } = require('../mcp-server/lib/lint');

// Built from a code point so this file itself stays free of the character it forbids.
const EM_DASH = String.fromCharCode(0x2014);

test('every color role pair in the kit meets its contrast target in light and dark', () => {
  const failures = [];
  for (const theme of ['light', 'dark']) {
    for (const [fg, bg, min] of tokens.color.pairs) {
      const r = contrast.ratio(tokens.color[theme][fg], tokens.color[theme][bg]);
      if (r < min) failures.push(`${theme}: ${fg} on ${bg} = ${r.toFixed(2)} (needs ${min})`);
    }
  }
  assert.deepStrictEqual(failures, []);
});

test('light and dark define the same color roles', () => {
  assert.deepStrictEqual(Object.keys(tokens.color.light).sort(), Object.keys(tokens.color.dark).sort());
});

test('contrast math matches known values', () => {
  assert.strictEqual(contrast.check('#000000', '#ffffff').ratio, 21);
  assert.strictEqual(contrast.check('#ffffff', '#ffffff').ratio, 1);
  const grey = contrast.check('#777777', '#ffffff');
  assert.ok(grey.ratio > 4.4 && grey.ratio < 4.6, `got ${grey.ratio}`);
  assert.throws(() => contrast.check('red', '#fff'));
});

test('a translucent foreground is composited over the background', () => {
  const solid = contrast.ratio('#000000', '#ffffff');
  const half = contrast.ratio('#00000080', '#ffffff');
  assert.ok(half < solid);
});

test('generated token css has the expected variables and no em dashes', () => {
  const css = generateCss();
  for (const v of ['--md-primary:', '--md-surface-3:', '--shape-lg-inc:', '--md-spring-fast-spatial:', '--md-type-body-medium-size:', '--sp-lg:', '--md-elev-3:']) {
    assert.ok(css.includes(v), `missing ${v}`);
  }
  assert.ok(css.includes('prefers-color-scheme: dark'));
  assert.ok(css.includes('prefers-reduced-motion'));
  assert.ok(!css.includes(EM_DASH), 'em dash in generated css');
});

test('type roles never fall below the Label Small floor', () => {
  for (const [name, r] of Object.entries(tokens.type.roles)) {
    assert.ok(r.size >= 0.6875, `${name} is ${r.size}rem`);
  }
});

test('all components parse, have the required sections and resolve their requirements', () => {
  const all = components.all();
  assert.ok(all.length >= 15, `only ${all.length} components`);
  const ids = new Set(all.map(c => c.id));
  for (const c of all) {
    for (const s of ['spec', 'a11y', 'html', 'css']) assert.ok(c.sections[s], `${c.id} lacks ${s}`);
    for (const r of c.requires) assert.ok(ids.has(r), `${c.id} requires unknown ${r}`);
  }
  assert.doesNotThrow(() => components.resolve(all.map(c => c.id)));
});

test('component css only references tokens that exist', () => {
  const defined = new Set([...generateCss().matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
  const missing = [];
  for (const c of components.all()) {
    const privateProps = new Set([...(c.sections.css || '').matchAll(/(--_[\w-]+)\s*:/g)].map(m => m[1]));
    for (const m of (c.sections.css || '').matchAll(/var\((--[\w-]+)/g)) {
      if (!defined.has(m[1]) && !privateProps.has(m[1])) missing.push(`${c.id}: ${m[1]}`);
    }
  }
  assert.deepStrictEqual([...new Set(missing)], []);
});

test('the kit passes its own linter: component css has no errors or warnings', () => {
  const problems = [];
  for (const c of components.all()) {
    const r = lint(c.sections.css, { kind: 'css' });
    r.findings.filter(f => f.severity !== 'info').forEach(f => problems.push(`${c.id}: ${f.rule} line ${f.line} ${f.message}`));
  }
  assert.deepStrictEqual(problems, []);
});

test('the kit passes its own linter: component markup has no errors', () => {
  const problems = [];
  for (const c of components.all()) {
    if (c.id === 'foundation') continue;       // full-page skeleton, checked separately
    const r = lint(c.sections.html, { kind: 'html' });
    r.findings.filter(f => f.severity === 'error').forEach(f => problems.push(`${c.id}: ${f.rule} line ${f.line} ${f.message}`));
  }
  assert.deepStrictEqual(problems, []);
});

test('no em dash anywhere in the shipped data', () => {
  const fs = require('fs');
  const path = require('path');
  const bad = [];
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '.git') walk(p); }
    else if (/\.(js|json|md|cmp|css)$/.test(e.name) && fs.readFileSync(p, 'utf8').includes(EM_DASH)) bad.push(p);
  });
  walk(path.join(__dirname, '..'));
  assert.deepStrictEqual(bad, []);
});
