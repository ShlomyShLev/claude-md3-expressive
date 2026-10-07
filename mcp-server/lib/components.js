'use strict';

const fs = require('fs');
const path = require('path');
const { generateCss } = require('./tokens');

const DIR = path.join(__dirname, '..', 'data', 'components');

/**
 * A component file is a few header lines (id, name, category, summary, requires) followed by
 * sections that start with a line "@@name": spec, a11y, html, css, js, notes.
 */
function parse(file) {
  const raw = fs.readFileSync(path.join(DIR, file), 'utf8').replace(/\r\n/g, '\n');
  const lines = raw.split('\n');
  const meta = {};
  const sections = {};
  let current = null;
  for (const line of lines) {
    const sec = line.match(/^@@([a-z0-9-]+)\s*$/);
    if (sec) { current = sec[1]; sections[current] = []; continue; }
    if (current) { sections[current].push(line); continue; }
    const kv = line.match(/^([a-z]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  for (const k of Object.keys(sections)) sections[k] = sections[k].join('\n').trim();
  return {
    id: meta.id || file.replace(/\.cmp$/, ''),
    name: meta.name || meta.id,
    category: meta.category || 'misc',
    summary: meta.summary || '',
    requires: meta.requires ? meta.requires.split(',').map(s => s.trim()).filter(Boolean) : [],
    sections
  };
}

let cache = null;
function all() {
  if (!cache) {
    cache = fs.readdirSync(DIR).filter(f => f.endsWith('.cmp')).sort().map(parse);
  }
  return cache;
}

function list(category) {
  return all()
    .filter(c => !category || c.category === category)
    .map(c => ({ id: c.id, name: c.name, category: c.category, summary: c.summary }));
}

function get(id) {
  return all().find(c => c.id === id) || null;
}

/** Collect the requested components plus everything they require, foundation first. */
function resolve(ids) {
  const order = [];
  const seen = new Set();
  const visit = id => {
    if (seen.has(id)) return;
    const c = get(id);
    if (!c) throw new Error(`Unknown component "${id}". Call list_components for the ids.`);
    seen.add(id);
    c.requires.forEach(visit);
    order.push(c);
  };
  visit('foundation');
  ids.forEach(visit);
  return order;
}

/** Tokens plus the CSS of the chosen components (all of them when ids is empty). */
function bundleCss(ids, theme) {
  const chosen = ids && ids.length ? resolve(ids) : resolve(all().map(c => c.id));
  const css = chosen.map(c => `/* ${c.name} */\n${c.sections.css || ''}`).join('\n\n');
  return generateCss({ theme }) + '\n' + css + '\n';
}

module.exports = { all, list, get, resolve, bundleCss };
