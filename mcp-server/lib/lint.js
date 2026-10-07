'use strict';

/**
 * Markup and CSS linter for MD3 Expressive work.
 *
 * Deterministic and file-local, so every finding is actionable. It reads HTML, Razor, JSX-ish
 * markup and plain CSS as text: it never executes anything. It cannot judge taste, only rules.
 *
 * Severity: error = breaks accessibility or the token system, warn = drifts from the kit,
 * info = worth a look.
 */

const RULES = {
  'a11y-button-name':     { severity: 'error', fix: 'Add aria-label to the button and mark the glyph aria-hidden="true". An icon or emoji is not a name.' },
  'a11y-link-name':       { severity: 'error', fix: 'Give the link visible text or an aria-label.' },
  'a11y-input-label':     { severity: 'error', fix: 'Associate a <label for>, wrap the control in a <label>, or add aria-label / aria-labelledby.' },
  'a11y-img-alt':         { severity: 'error', fix: 'Add alt text, or alt="" if the image is purely decorative.' },
  'a11y-selected-state':  { severity: 'error', fix: 'A button with the "active" class needs aria-pressed (toggle), aria-current (navigation) or aria-selected (tab), set wherever JS toggles the class.' },
  'a11y-dialog-opener':   { severity: 'error', fix: 'A control that opens a dialog gets aria-haspopup="dialog". Do not use aria-pressed for it.' },
  'a11y-dialog-name':     { severity: 'error', fix: 'Give the dialog aria-labelledby pointing at its headline (or an aria-label).' },
  'a11y-heading-skip':    { severity: 'warn',  fix: 'Keep heading levels contiguous. Section titles styled as spans should be real h2/h3.' },
  'a11y-h1-count':        { severity: 'warn',  fix: 'A page has exactly one h1.' },
  'a11y-table-header':    { severity: 'warn',  fix: 'Use <th scope="col"> for header cells so the table is extractable by readers and AI agents.' },
  'a11y-icon-exposed':    { severity: 'warn',  fix: 'Add aria-hidden="true" to the icon glyph so its ligature text is not read aloud.' },
  'a11y-focus-removed':   { severity: 'error', fix: 'Do not remove the outline without a visible :focus-visible replacement (3dp ring, 2dp offset).' },
  'a11y-motion':          { severity: 'info',  fix: 'Add a prefers-reduced-motion rule (the token sheet already collapses durations).' },
  'css-inline-style':     { severity: 'warn',  fix: 'Move the style into a class. Only a dynamic binding that sets a custom property (style="--x:{{value}}") is acceptable.' },
  'css-style-block':      { severity: 'warn',  fix: 'Keep CSS out of markup. Put it in a stylesheet.' },
  'css-px-font':          { severity: 'warn',  fix: 'Use rem, or an --md-type-* token, for font sizes.' },
  'css-px-layout':        { severity: 'warn',  fix: 'Use rem or a --sp-* token. Only hairline borders and shadow offsets stay in px.' },
  'css-hardcoded-color':  { severity: 'warn',  fix: 'Use an --md-* color role so light and dark both work.' },
  'css-small-text':       { severity: 'warn',  fix: 'Text under 0.6875rem (11px) is below the MD3 floor (Label Small). Dense data cells use label-medium.' },
  'css-transition-all':   { severity: 'warn',  fix: 'List the properties you animate. "transition: all" animates layout and burns frames.' },
  'css-raw-radius':       { severity: 'info',  fix: 'Use a --shape-* token so shape stays on the scale and can morph consistently.' },
  'css-raw-easing':       { severity: 'info',  fix: 'Use an --md-ease-* or --md-spring-* token.' },
  'css-important':        { severity: 'info',  fix: 'Avoid !important. Raise specificity with a scoped class instead.' }
};

function lineOf(text, index) {
  let n = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

function add(findings, rule, text, index, detail, line) {
  const meta = RULES[rule];
  findings.push({
    rule,
    severity: meta.severity,
    line: line || lineOf(text, index),
    message: detail,
    fix: meta.fix
  });
}

const strip = (s, re) => s.replace(re, m => m.replace(/[^\n]/g, ' '));

/** Blank out script blocks and comments but keep offsets and newlines so line numbers hold. */
function maskForMarkup(src) {
  let t = strip(src, /<script[\s\S]*?<\/script>/gi);
  t = strip(t, /<!--[\s\S]*?-->/g);
  t = strip(t, /@\*[\s\S]*?\*@/g);
  return t;
}

const isDynamic = v => /[@{$<]/.test(v);

// ---------------------------------------------------------------- markup

function lintMarkup(src, findings, opts) {
  const markup = maskForMarkup(src);

  // buttons without a name
  for (const m of markup.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const attrs = m[1];
    if (/aria-label(ledby)?\s*=|title\s*=/i.test(attrs)) continue;
    const inner = m[2];
    const text = inner.replace(/<span[^>]*(?:material-symbols|material-icons|md-icon)[^>]*>[\s\S]*?<\/span>/gi, '').replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, '');
    if (/[a-zA-Z0-9]/.test(text)) continue;
    const shown = inner.replace(/<[^>]*>/g, '').trim().slice(0, 14) || '(empty)';
    add(findings, 'a11y-button-name', markup, m.index, `Button has no accessible name (content: "${shown}").`);
  }

  // links without a name
  for (const m of markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    if (/aria-label(ledby)?\s*=|title\s*=/i.test(m[1])) continue;
    if (/<img\b[^>]*\balt\s*=\s*"[^"]+"/i.test(m[2])) continue;
    const text = m[2].replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, '');
    if (/[a-zA-Z0-9]/.test(text)) continue;
    add(findings, 'a11y-link-name', markup, m.index, 'Link has no accessible name.');
  }

  // images
  for (const m of markup.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt\s*=/i.test(m[0])) add(findings, 'a11y-img-alt', markup, m.index, 'Image has no alt attribute.');
  }

  // form controls
  const labelFors = new Set([...markup.matchAll(/<label\b[^>]*\bfor\s*=\s*"([^"]+)"/gi)].map(m => m[1]));
  const labelBlocks = [...markup.matchAll(/<label\b[^>]*>[\s\S]*?<\/label>/gi)].map(m => [m.index, m.index + m[0].length]);
  for (const m of markup.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
    const attrs = m[2];
    if (/type\s*=\s*"(hidden|submit|button|reset|image)"/i.test(attrs)) continue;
    if (/aria-label(ledby)?\s*=|title\s*=/i.test(attrs)) continue;
    const id = (attrs.match(/\bid\s*=\s*"([^"]+)"/i) || [])[1];
    if (id && labelFors.has(id)) continue;
    if (labelBlocks.some(([a, b]) => m.index > a && m.index < b)) continue;
    add(findings, 'a11y-input-label', markup, m.index, `<${m[1].toLowerCase()}> has no label.`);
  }

  // selected state with no programmatic twin
  for (const m of markup.matchAll(/<button\b[^>]*class\s*=\s*"[^"]*\bactive\b[^"]*"[^>]*>/gi)) {
    if (!/aria-(pressed|current|selected)/i.test(m[0])) {
      add(findings, 'a11y-selected-state', markup, m.index, 'Button carries "active" but no aria-pressed, aria-current or aria-selected.');
    }
  }

  // dialog openers and dialog names
  const dialogIds = new Set();
  for (const m of markup.matchAll(/<dialog\b([^>]*)>/gi)) {
    const id = (m[1].match(/\bid\s*=\s*"([^"]+)"/i) || [])[1];
    if (id) dialogIds.add(id);
    if (!/aria-label(ledby)?\s*=/i.test(m[1])) add(findings, 'a11y-dialog-name', markup, m.index, '<dialog> has no accessible name.');
  }
  for (const m of markup.matchAll(/<div\b([^>]*role\s*=\s*"(?:alert)?dialog"[^>]*)>/gi)) {
    const id = (m[1].match(/\bid\s*=\s*"([^"]+)"/i) || [])[1];
    if (id) dialogIds.add(id);
    if (!/aria-label(ledby)?\s*=/i.test(m[1])) add(findings, 'a11y-dialog-name', markup, m.index, 'role="dialog" has no accessible name.');
  }
  if (dialogIds.size) {
    for (const m of markup.matchAll(/<button\b([^>]*)>/gi)) {
      const attrs = m[1];
      const target = (attrs.match(/(?:aria-controls|data-[a-z-]*(?:open|target)[a-z-]*)\s*=\s*"([^"]+)"/i) || [])[1];
      if (target && dialogIds.has(target) && !/aria-haspopup\s*=\s*"(dialog|true)"/i.test(attrs)) {
        add(findings, 'a11y-dialog-opener', markup, m.index, `Button opens dialog #${target} without aria-haspopup="dialog".`);
      }
    }
  }

  // headings
  const heads = [...markup.matchAll(/<h([1-6])\b/gi)].map(m => ({ level: Number(m[1]), index: m.index }));
  for (let i = 1; i < heads.length; i++) {
    if (heads[i].level > heads[i - 1].level + 1) {
      add(findings, 'a11y-heading-skip', markup, heads[i].index, `h${heads[i - 1].level} is followed by h${heads[i].level}.`);
    }
  }
  const fullPage = /<html\b|<body\b|<main\b/i.test(markup);
  const h1s = heads.filter(h => h.level === 1);
  if (h1s.length > 1) add(findings, 'a11y-h1-count', markup, h1s[1].index, `${h1s.length} h1 elements. A page has one.`);
  if (fullPage && h1s.length === 0) add(findings, 'a11y-h1-count', markup, 0, 'Page has no h1.', 1);

  // tables
  for (const m of markup.matchAll(/<table\b[\s\S]*?<\/table>/gi)) {
    if (!/<th\b/i.test(m[0])) add(findings, 'a11y-table-header', markup, m.index, 'Table has no <th> header cells.');
  }

  // icon glyphs read aloud
  for (const m of markup.matchAll(/<span\b([^>]*class\s*=\s*"[^"]*(?:material-symbols|md-icon)[^"]*"[^>]*)>/gi)) {
    if (!/aria-hidden\s*=\s*"true"/i.test(m[1])) {
      add(findings, 'a11y-icon-exposed', markup, m.index, 'Icon glyph is not aria-hidden, so its ligature name is read aloud.');
    }
  }

  // css in markup
  if (opts.noInlineCss) {
    for (const m of markup.matchAll(/<style[\s>]/gi)) add(findings, 'css-style-block', markup, m.index, '<style> block in markup.');
    for (const m of markup.matchAll(/\sstyle\s*=\s*"([^"]*)"/gi)) {
      const v = m[1].trim();
      if (!v) continue;
      if (isDynamic(v) && /^\s*(--[\w-]+\s*:|[^:]+:\s*[^;]*[@{$])/i.test(v)) continue;
      add(findings, 'css-inline-style', markup, m.index, `Static inline style: ${v.slice(0, 50)}`);
    }
  }

  // embedded <style> blocks are CSS too
  for (const m of src.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    const startLine = lineOf(src, m.index + m[0].indexOf('>') + 1);
    lintCss(m[1], findings, startLine - 1);
  }
}

// ---------------------------------------------------------------- css

const stripCssComments = css => css.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));

function lintCss(css, findings, lineOffset = 0) {
  const text = stripCssComments(css);
  const hasFocusVisible = /:focus-visible/.test(text);
  let animates = false;
  const reduced = /prefers-reduced-motion/.test(text);

  // Walk declarations by position, not by line, so minified or multi-line CSS is read the same way.
  const decls = [...text.matchAll(/(?:^|[;{}\s])((?:--[\w-]+|[a-z-]+))\s*:\s*([^;{}]+)(?=[;}])/gi)];
  decls.forEach(d => {
    const ln = lineOf(text, d.index + d[0].indexOf(d[1])) + lineOffset;
    const prop = d[1].toLowerCase();
    const val = d[2].trim();
    const isTokenDeclaration = prop.startsWith('--');

    if (/!important/.test(val)) add(findings, 'css-important', text, 0, `${prop} uses !important.`, ln);

    if (isTokenDeclaration) return;

    // colors
    if (/^(color|background|background-color|border(-[a-z]+)?(-color)?|outline(-color)?|fill|stroke|box-shadow|text-shadow|caret-color|accent-color)$/.test(prop)) {
      const noVars = val.replace(/var\([^)]*\)/g, '').replace(/color-mix\([^;]*/g, '');
      if (prop !== 'box-shadow' && prop !== 'text-shadow' && (/#[0-9a-f]{3,8}\b/i.test(noVars) || /\brgba?\(|\bhsla?\(/i.test(noVars))) {
        add(findings, 'css-hardcoded-color', text, 0, `${prop}: ${val.slice(0, 50)}`, ln);
      }
    }

    // font size
    if (prop === 'font-size' || prop === 'font') {
      const fs = (prop === 'font' ? val.match(/(?:^|\s)(\d*\.?\d+)(px|rem|em)\b/) : val.match(/^(\d*\.?\d+)(px|rem|em)\b/));
      if (fs) {
        const n = parseFloat(fs[1]);
        const px = fs[2] === 'px' ? n : n * 16;
        if (fs[2] === 'px') add(findings, 'css-px-font', text, 0, `${prop}: ${val.slice(0, 40)}`, ln);
        if (px < 11) add(findings, 'css-small-text', text, 0, `${prop}: ${val.slice(0, 40)} is about ${+px.toFixed(1)}px.`, ln);
      }
    }

    // px in layout
    if (/^(width|height|min-width|min-height|max-width|max-height|padding(-[a-z]+)?|margin(-[a-z]+)?|gap|row-gap|column-gap|top|right|bottom|left|inset)$/.test(prop)) {
      const noVars = val.replace(/var\([^)]*\)/g, '');
      for (const m of noVars.matchAll(/(-?\d*\.?\d+)px\b/g)) {
        if (Math.abs(parseFloat(m[1])) > 2) {
          add(findings, 'css-px-layout', text, 0, `${prop}: ${val.slice(0, 40)}`, ln);
          break;
        }
      }
    }

    // radius
    if (/^border(-[a-z]+)*-radius$/.test(prop) && !/var\(/.test(val)) {
      if (!/^(0|0px|50%|inherit|unset|initial|100vmax|9999px|999px)$/.test(val.trim())) {
        add(findings, 'css-raw-radius', text, 0, `${prop}: ${val.slice(0, 40)}`, ln);
      }
    }

    // focus ring
    if (prop === 'outline' && /^(none|0)\b/.test(val) && !hasFocusVisible) {
      add(findings, 'a11y-focus-removed', text, 0, `outline removed and no :focus-visible rule exists.`, ln);
    }

    // transitions
    if (prop === 'transition' || prop === 'animation' || prop === 'transition-duration' || prop === 'animation-duration') {
      if (!/^none\b/.test(val)) animates = true;
      if (/(^|[\s,])all\b/.test(val) && prop === 'transition') add(findings, 'css-transition-all', text, 0, `transition: ${val.slice(0, 40)}`, ln);
      if (/cubic-bezier\(/.test(val.replace(/var\([^)]*\)/g, ''))) add(findings, 'css-raw-easing', text, 0, `${prop}: ${val.slice(0, 50)}`, ln);
    }
    if (prop === 'transition-timing-function' || prop === 'animation-timing-function') {
      if (/cubic-bezier\(/.test(val)) add(findings, 'css-raw-easing', text, 0, `${prop}: ${val.slice(0, 50)}`, ln);
    }
  });

  if (animates && !reduced) {
    findings.push({
      rule: 'a11y-motion',
      severity: RULES['a11y-motion'].severity,
      line: 1 + lineOffset,
      message: 'Stylesheet animates but has no prefers-reduced-motion rule.',
      fix: RULES['a11y-motion'].fix
    });
  }
}

// ---------------------------------------------------------------- entry

function detectKind(src) {
  return /<\/?[a-z][a-z0-9-]*[\s>/]/i.test(src) ? 'html' : 'css';
}

/**
 * @param {string} source
 * @param {{kind?: 'auto'|'html'|'css', noInlineCss?: boolean}} opts
 */
function lint(source, opts = {}) {
  const kind = opts.kind && opts.kind !== 'auto' ? opts.kind : detectKind(source);
  const options = { noInlineCss: opts.noInlineCss !== false };
  const findings = [];
  if (kind === 'html') lintMarkup(source, findings, options);
  else lintCss(source, findings, 0);

  findings.sort((a, b) => a.line - b.line);
  const counts = { error: 0, warn: 0, info: 0 };
  findings.forEach(f => { counts[f.severity]++; });
  return { kind, counts, findings };
}

module.exports = { lint, RULES };
