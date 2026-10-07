#!/usr/bin/env node
'use strict';

// Writes dist/md3-expressive.css (tokens plus every component) and dist/md3-expressive.js
// (the small behaviors: dialog open, tabs, chips, button groups, snackbar), for use without the MCP server.
const fs = require('fs');
const path = require('path');
const components = require('../mcp-server/lib/components');

const out = path.join(__dirname, '..', 'dist');
fs.mkdirSync(out, { recursive: true });

const cssFile = path.join(out, 'md3-expressive.css');
fs.writeFileSync(cssFile, components.bundleCss([], 'both'));

const js = components
  .resolve(components.all().map(c => c.id))
  .filter(c => c.sections.js)
  .map(c => `/* ${c.name} */\n${c.sections.js}`)
  .join('\n\n');
const jsFile = path.join(out, 'md3-expressive.js');
fs.writeFileSync(jsFile, js + '\n');

console.log(`Wrote ${path.relative(process.cwd(), cssFile)} and ${path.relative(process.cwd(), jsFile)}`);
