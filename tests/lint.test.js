'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { lint } = require('../mcp-server/lib/lint');

const rules = (src, opts) => lint(src, opts).findings.map(f => f.rule);

test('icon-only button without a name is an error', () => {
  assert.ok(rules('<button><span class="md-icon">menu</span></button>').includes('a11y-button-name'));
  assert.ok(rules('<button>⚙</button>').includes('a11y-button-name'));
});

test('named buttons pass', () => {
  assert.ok(!rules('<button aria-label="Menu"><span class="md-icon" aria-hidden="true">menu</span></button>').includes('a11y-button-name'));
  assert.ok(!rules('<button>Save</button>').includes('a11y-button-name'));
});

test('a button with an icon plus text is named by its text', () => {
  assert.ok(!rules('<button><span class="md-icon" aria-hidden="true">add</span> New</button>').includes('a11y-button-name'));
});

test('active class without aria-pressed is flagged, with it is not', () => {
  assert.ok(rules('<button class="chip active">1D</button>').includes('a11y-selected-state'));
  assert.ok(!rules('<button class="chip active" aria-pressed="true">1D</button>').includes('a11y-selected-state'));
});

test('a dialog opener must say aria-haspopup', () => {
  const bad = '<button data-md-dialog-open="d1">Open</button><dialog id="d1" aria-labelledby="t"><h2 id="t">x</h2></dialog>';
  const good = '<button aria-haspopup="dialog" data-md-dialog-open="d1">Open</button><dialog id="d1" aria-labelledby="t"><h2 id="t">x</h2></dialog>';
  assert.ok(rules(bad).includes('a11y-dialog-opener'));
  assert.ok(!rules(good).includes('a11y-dialog-opener'));
});

test('an unnamed dialog is flagged', () => {
  assert.ok(rules('<dialog id="d"><p>hi</p></dialog>').includes('a11y-dialog-name'));
});

test('heading skips and extra h1 are flagged', () => {
  assert.ok(rules('<h1>a</h1><h3>b</h3>').includes('a11y-heading-skip'));
  assert.ok(!rules('<h1>a</h1><h2>b</h2><h3>c</h3><h2>d</h2>').includes('a11y-heading-skip'));
  assert.ok(rules('<h1>a</h1><h1>b</h1>').includes('a11y-h1-count'));
});

test('unlabeled inputs are flagged, labeled ones are not', () => {
  assert.ok(rules('<input type="text">').includes('a11y-input-label'));
  assert.ok(!rules('<label for="a">A</label><input id="a">').includes('a11y-input-label'));
  assert.ok(!rules('<label>A <input></label>').includes('a11y-input-label'));
  assert.ok(!rules('<input aria-label="Search">').includes('a11y-input-label'));
});

test('images need alt, tables need header cells, icons need aria-hidden', () => {
  assert.ok(rules('<img src="a.png">').includes('a11y-img-alt'));
  assert.ok(!rules('<img src="a.png" alt="">').includes('a11y-img-alt'));
  assert.ok(rules('<table><tr><td>1</td></tr></table>').includes('a11y-table-header'));
  assert.ok(rules('<span class="material-symbols-rounded">home</span>').includes('a11y-icon-exposed'));
});

test('static inline style and style blocks are flagged, dynamic bindings are not', () => {
  assert.ok(rules('<div style="color:red">x</div>').includes('css-inline-style'));
  assert.ok(!rules('<div style="--accent:@brand">x</div>').includes('css-inline-style'));
  assert.ok(!rules('<div style="--accent:{{brand}}">x</div>').includes('css-inline-style'));
  assert.ok(rules('<style>a{color:red}</style>').includes('css-style-block'));
  assert.deepStrictEqual(rules('<div style="color:red">x</div>', { noInlineCss: false }).filter(r => r.startsWith('css-')), []);
});

test('script blocks are ignored by markup rules', () => {
  const src = '<script>el.innerHTML = `<button style="color:red"></button>`;</script><p>ok</p>';
  assert.deepStrictEqual(rules(src), []);
});

test('css: px fonts, hardcoded colors, tiny text, transition all, focus removal', () => {
  const r = rules('.a{font-size:14px;color:#fff;transition:all .2s}.b{font-size:0.5rem}.c{outline:none}');
  for (const id of ['css-px-font', 'css-hardcoded-color', 'css-transition-all', 'css-small-text', 'a11y-focus-removed']) {
    assert.ok(r.includes(id), `expected ${id}, got ${r.join(',')}`);
  }
});

test('css: token declarations and var() usage are clean', () => {
  const css = ':root{--md-primary:#006780}.a{color:var(--md-primary);padding:var(--sp-lg);border:1px solid var(--md-outline);border-radius:var(--shape-lg)}';
  assert.deepStrictEqual(rules(css, { kind: 'css' }), []);
});

test('css: outline none is fine when a focus-visible rule exists', () => {
  assert.ok(!rules('.a{outline:none}.a:focus-visible{box-shadow:0 0 0 2px var(--md-primary)}').includes('a11y-focus-removed'));
});

test('css: px layout above hairline size is flagged, hairlines are not', () => {
  assert.ok(rules('.a{padding:16px}', { kind: 'css' }).includes('css-px-layout'));
  assert.ok(!rules('.a{border:1px solid var(--md-outline)}', { kind: 'css' }).includes('css-px-layout'));
});

test('css: animation without a reduced-motion rule gets a note', () => {
  assert.ok(rules('.a{transition:opacity 200ms}', { kind: 'css' }).includes('a11y-motion'));
  assert.ok(!rules('.a{transition:opacity 200ms}@media (prefers-reduced-motion: reduce){.a{transition:none}}', { kind: 'css' }).includes('a11y-motion'));
});

test('findings carry line numbers', () => {
  const r = lint('<p>ok</p>\n<p>ok</p>\n<button><span class="md-icon">x</span></button>');
  const f = r.findings.find(x => x.rule === 'a11y-button-name');
  assert.strictEqual(f.line, 3);
});

test('auto-detect tells css from html', () => {
  assert.strictEqual(lint('.a{color:red}').kind, 'css');
  assert.strictEqual(lint('<p>x</p>').kind, 'html');
});
