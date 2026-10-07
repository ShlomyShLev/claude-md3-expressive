'use strict';

// Keeps the published package honest: docs examples are true, dist/ is fresh, metadata agrees.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { callTool } = require('../mcp-server/lib/tools');
const components = require('../mcp-server/lib/components');
const { RULES } = require('../mcp-server/lib/lint');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const readJson = rel => JSON.parse(read(rel));
const out = (name, args) => callTool(name, args).content[0].text;
const EM_DASH = String.fromCharCode(0x2014);

test('dist/ matches a fresh build', () => {
  assert.strictEqual(read('dist/md3-expressive.css'), components.bundleCss([], 'both'),
    'dist/md3-expressive.css is stale: run node scripts/build-css.js');
  const js = components
    .resolve(components.all().map(c => c.id))
    .filter(c => c.sections.js)
    .map(c => `/* ${c.name} */\n${c.sections.js}`)
    .join('\n\n') + '\n';
  assert.strictEqual(read('dist/md3-expressive.js'), js,
    'dist/md3-expressive.js is stale: run node scripts/build-css.js');
});

test('versions agree across package, plugin and marketplace manifests', () => {
  const pkg = readJson('package.json');
  const plugin = readJson('.claude-plugin/plugin.json');
  const market = readJson('.claude-plugin/marketplace.json');
  assert.strictEqual(plugin.version, pkg.version);
  assert.strictEqual(market.plugins[0].version, pkg.version);
  assert.strictEqual(market.plugins[0].name, plugin.name);
  assert.match(read('CHANGELOG.md'), new RegExp(`## \\[${pkg.version.replace(/\./g, '\\.')}\\]`),
    'CHANGELOG.md has no entry for the current version');
});

test('the README install command points at the repository named in package.json', () => {
  const pkg = readJson('package.json');
  const slug = pkg.repository.url.replace(/^.*github\.com\//, '').replace(/\.git$/, '');
  assert.ok(read('README.md').includes(`/plugin marketplace add ${slug}`),
    'README install line does not match package.json repository');
  assert.ok(!read('README.md').includes('<github-owner>'), 'README still has a placeholder');
});

test('every tool the README documents exists, and every tool is documented', () => {
  const readme = read('README.md');
  const { tools } = require('../mcp-server/lib/tools');
  for (const t of tools) assert.ok(readme.includes('`' + t.name + '`'), `README does not mention ${t.name}`);
  const mentioned = [...readme.matchAll(/^\| `([a-z_]+)` \|/gm)].map(m => m[1]);
  for (const name of mentioned) {
    if (name.includes('_')) assert.ok(tools.some(t => t.name === name), `README documents unknown tool ${name}`);
  }
});

test('every component is listed in the README', () => {
  const readme = read('README.md');
  for (const c of components.all()) assert.ok(readme.includes('`' + c.id + '`'), `README does not list component ${c.id}`);
});

test('the README component count is true', () => {
  const n = components.all().length;
  assert.ok(read('README.md').includes(`${n} ready-made components`), `README should say ${n} ready-made components`);
});

test('docs example: the linter output for the sample markup is what the docs show', () => {
  const source =
    '<button class="active"><span class="material-symbols-outlined">star</span></button>\n' +
    '<h1>Title</h1>\n<h3>Skipped</h3>\n<div style="color:red">x</div>';
  const text = out('lint_markup', { source });
  assert.match(text, /^HTML: 2 error\(s\), 3 warning\(s\), 0 note\(s\)\./);
  for (const rule of ['a11y-button-name', 'a11y-selected-state', 'a11y-icon-exposed', 'a11y-heading-skip', 'css-inline-style']) {
    assert.ok(text.includes(`"rule": "${rule}"`), `expected ${rule}`);
  }
});

test('docs example: the fixed markup lints clean', () => {
  const source =
    '<button class="active" aria-pressed="true" aria-label="Favorite">' +
    '<span class="material-symbols-outlined" aria-hidden="true">star</span></button>\n' +
    '<h1>Title</h1>\n<h2 class="section-title">Section</h2>\n<div class="note">x</div>';
  assert.match(out('lint_markup', { source }), /^HTML: 0 error\(s\), 0 warning\(s\)/);
});

test('docs example: the sample stylesheet findings and the fixed stylesheet', () => {
  const bad = out('lint_markup', { source: '.card{font-size:13px;color:#333;transition:all .3s}' });
  assert.match(bad, /^CSS: 0 error\(s\), 3 warning\(s\), 1 note\(s\)\./);
  const fixed = out('lint_markup', {
    source:
      '.card {\n  font: 400 var(--md-type-body-medium-size)/var(--md-type-body-medium-line) var(--md-font-plain);\n' +
      '  color: var(--md-on-surface);\n  transition: background-color var(--md-dur-short3) var(--md-ease-standard);\n}\n' +
      '@media (prefers-reduced-motion: reduce) { .card { transition: none; } }'
  });
  assert.match(fixed, /^CSS: 0 error\(s\), 0 warning\(s\)/);
});

test('docs example: tokens used in the docs exist in the shipped stylesheet', () => {
  const css = read('dist/md3-expressive.css');
  for (const t of ['--md-on-surface', '--md-dur-short3', '--md-ease-standard', '--md-font-plain',
    '--md-type-body-medium-size', '--md-type-body-medium-line']) {
    assert.ok(css.includes(t + ':'), `${t} is used in docs but not defined`);
  }
});

test('docs example: dialog body is body-medium and #777 on white is 4.48', () => {
  const role = JSON.parse(out('get_type_role', { purpose: 'dialog body' }));
  assert.strictEqual(role[0].role, 'body-medium');
  const c = JSON.parse(out('check_contrast', { foreground: '#777777', background: '#ffffff' }));
  assert.strictEqual(c.ratio, 4.48);
  assert.strictEqual(c.aaNormalText, false);
  assert.strictEqual(c.aaLargeText, true);
});

test('docs example: the dialog component says what the docs say it says', () => {
  const text = out('get_component', { id: 'dialog', parts: ['spec', 'a11y'] });
  for (const phrase of ['showModal()', 'aria-labelledby', 'aria-haspopup="dialog"', 'Cancel']) {
    assert.ok(text.includes(phrase), `dialog component no longer mentions ${phrase}`);
  }
});

test('the changelog rule count matches the linter', () => {
  const n = Object.keys(RULES).length;
  assert.ok(read('CHANGELOG.md').includes(`Linter with ${n} rules`), `CHANGELOG should say ${n} rules`);
});

test('no em dash in any shipped text file', () => {
  const skip = new Set(['.git', 'node_modules']);
  const hits = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(md|json|js|css|html|cmp|yml|txt)$|LICENSE$/.test(e.name) && fs.readFileSync(p, 'utf8').includes(EM_DASH)) {
        hits.push(path.relative(root, p));
      }
    }
  })(root);
  assert.deepStrictEqual(hits, []);
});

test('the shipped files carry no machine-specific paths', () => {
  const needles = ['C:\\Users\\', '/Users/', '/home/'];
  const hits = [];
  for (const rel of ['README.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'docs/examples.md', 'package.json',
    '.mcp.json', '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']) {
    const text = read(rel);
    for (const n of needles) if (text.includes(n)) hits.push(`${rel}: ${n}`);
  }
  assert.deepStrictEqual(hits, []);
});

test('the demo server refuses paths outside the project', async () => {
  const http = require('node:http');
  const { spawn } = require('node:child_process');
  const child = spawn(process.execPath, [path.join(root, 'scripts', 'serve.js'), '0'], { stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    const port = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('server did not start')), 5000);
      child.stdout.on('data', d => {
        const m = String(d).match(/:(\d{2,5})/);
        if (m) { clearTimeout(timer); resolve(Number(m[1])); }
      });
      child.on('error', reject);
    });
    const status = await new Promise((resolve, reject) => {
      http.get({ host: '127.0.0.1', port, path: '/..%2Fclaude-md3-expressive-secret/x' }, res => { res.resume(); resolve(res.statusCode); }).on('error', reject);
    });
    assert.ok(status === 403 || status === 404, `expected 403 or 404, got ${status}`);
  } finally {
    child.kill();
  }
});
