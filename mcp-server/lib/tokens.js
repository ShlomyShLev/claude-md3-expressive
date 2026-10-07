'use strict';

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');
const tokens = JSON.parse(fs.readFileSync(path.join(DATA, 'tokens.json'), 'utf8'));

const SECTIONS = ['color', 'type', 'shape', 'space', 'motion', 'state', 'elevation'];

const rem = n => (n === 0 ? '0' : `${+n.toFixed(4)}rem`);

function colorBlock(theme, indent) {
  return Object.entries(tokens.color[theme])
    .map(([role, hex]) => `${indent}--md-${role}: ${hex};`)
    .join('\n');
}

function colorCss(theme) {
  const out = [];
  if (theme === 'light') {
    out.push(':root {\n  color-scheme: light;\n' + colorBlock('light', '  ') + '\n}');
  } else if (theme === 'dark') {
    out.push(':root {\n  color-scheme: dark;\n' + colorBlock('dark', '  ') + '\n}');
  } else {
    out.push(':root {\n  color-scheme: light dark;\n' + colorBlock('light', '  ') + '\n}');
    out.push(
      '@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n' +
      colorBlock('dark', '    ') + '\n  }\n}'
    );
    out.push(':root[data-theme="light"] { color-scheme: light; }');
    out.push(':root[data-theme="dark"] {\n  color-scheme: dark;\n' + colorBlock('dark', '  ') + '\n}');
  }
  return out.join('\n');
}

function typeCss() {
  const lines = [
    `  --md-font-plain: ${tokens.font.plain};`,
    `  --md-font-brand: ${tokens.font.brand};`
  ];
  const classes = [];
  for (const [role, r] of Object.entries(tokens.type.roles)) {
    lines.push(`  --md-type-${role}-size: ${rem(r.size)};`);
    lines.push(`  --md-type-${role}-line: ${rem(r.line)};`);
    lines.push(`  --md-type-${role}-weight: ${r.weight};`);
    lines.push(`  --md-type-${role}-tracking: ${rem(r.tracking / 16)};`);
    const emph = Math.min(700, r.weight + tokens.type.emphasizedBoost);
    classes.push(
      `.md-type-${role} {\n` +
      `  font-family: var(--md-font-${r.family});\n` +
      `  font-size: var(--md-type-${role}-size);\n` +
      `  line-height: var(--md-type-${role}-line);\n` +
      `  font-weight: var(--md-type-${role}-weight);\n` +
      `  letter-spacing: var(--md-type-${role}-tracking);\n` +
      `}\n` +
      `.md-type-${role}.md-type-emphasized { font-weight: ${emph}; }`
    );
  }
  return { vars: lines.join('\n'), classes: classes.join('\n') };
}

function shapeVars() {
  const lines = Object.entries(tokens.shape.scale).map(([k, v]) => `  --shape-${k}: ${rem(v)};`);
  lines.push(`  --shape-full: ${tokens.shape.full};`);
  return lines.join('\n');
}

function spaceVars() {
  return Object.entries(tokens.space.scale).map(([k, v]) => `  --sp-${k}: ${rem(v)};`).join('\n');
}

function motionVars() {
  const m = tokens.motion;
  const lines = [];
  for (const [k, ms] of Object.entries(m.duration)) lines.push(`  --md-dur-${k}: ${ms}ms;`);
  for (const [k, v] of Object.entries(m.easing)) lines.push(`  --md-ease-${k}: ${v};`);
  for (const [k, v] of Object.entries(m.spring)) {
    lines.push(`  --md-spring-${k}: ${v.curve};`);
    lines.push(`  --md-spring-${k}-dur: ${v.ms}ms;`);
  }
  return lines.join('\n');
}

function reducedMotion() {
  const m = tokens.motion;
  const lines = [];
  for (const k of Object.keys(m.duration)) lines.push(`    --md-dur-${k}: 0.01ms;`);
  for (const k of Object.keys(m.spring)) lines.push(`    --md-spring-${k}-dur: 0.01ms;`);
  return '@media (prefers-reduced-motion: reduce) {\n  :root {\n' + lines.join('\n') + '\n  }\n}';
}

function stateVars() {
  const s = tokens.state;
  return [
    `  --md-state-hover: ${s.hover};`,
    `  --md-state-focus: ${s.focus};`,
    `  --md-state-pressed: ${s.pressed};`,
    `  --md-state-dragged: ${s.dragged};`,
    `  --md-opacity-disabled-content: ${s.disabledContent};`,
    `  --md-opacity-disabled-container: ${s.disabledContainer};`
  ].join('\n');
}

function elevationVars() {
  return Object.entries(tokens.elevation.levels)
    .map(([lvl, e]) => `  --md-elev-${lvl}: ${e.shadow};`)
    .join('\n');
}

/**
 * Build the token stylesheet.
 * @param {{theme?: 'light'|'dark'|'both', sections?: string[]}} opts
 */
function generateCss(opts = {}) {
  const theme = opts.theme || 'both';
  const want = new Set((opts.sections && opts.sections.length ? opts.sections : SECTIONS));
  const parts = ['/* Claude MD3 Expressive: design tokens. Generated, do not hand-edit. */'];
  const root = [];
  let classes = '';

  if (want.has('color')) parts.push(colorCss(theme));
  if (want.has('type')) {
    const t = typeCss();
    root.push(t.vars);
    classes = t.classes;
  }
  if (want.has('shape')) root.push(shapeVars());
  if (want.has('space')) root.push(spaceVars());
  if (want.has('motion')) root.push(motionVars());
  if (want.has('state')) root.push(stateVars());
  if (want.has('elevation')) root.push(elevationVars());

  if (root.length) parts.push(':root {\n' + root.join('\n') + '\n}');
  if (want.has('motion')) parts.push(reducedMotion());
  if (classes) parts.push(classes);
  return parts.join('\n\n') + '\n';
}

function getSection(name) {
  switch (name) {
    case 'color': return { light: tokens.color.light, dark: tokens.color.dark };
    case 'type': return { font: tokens.font, roles: tokens.type.roles, emphasizedNote: tokens.type.emphasizedNote };
    case 'shape': return tokens.shape;
    case 'space': return tokens.space;
    case 'motion': return tokens.motion;
    case 'state': return tokens.state;
    case 'elevation': return tokens.elevation;
    case 'breakpoints': return tokens.breakpoints;
    default: return null;
  }
}

module.exports = { tokens, SECTIONS, generateCss, getSection };
