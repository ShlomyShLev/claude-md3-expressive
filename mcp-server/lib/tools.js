'use strict';

const { tokens, SECTIONS, generateCss, getSection } = require('./tokens');
const components = require('./components');
const contrast = require('./contrast');
const { lint, RULES } = require('./lint');
const checklist = require('../data/checklist.json');

const text = (s, isError) => ({ content: [{ type: 'text', text: s }], ...(isError ? { isError: true } : {}) });
const json = o => text(JSON.stringify(o, null, 2));

const tools = [
  {
    name: 'get_tokens',
    description:
      'Design tokens for MD3 Expressive: color roles (light and dark), type roles, shape scale, spacing, motion ' +
      '(including spring approximations), state layers, elevation. Use format "css" for a ready stylesheet to paste, ' +
      'or "json" to read the values.',
    inputSchema: {
      type: 'object',
      properties: {
        section: { type: 'string', enum: [...SECTIONS, 'breakpoints', 'all'], description: 'Which group of tokens. Default all.' },
        format: { type: 'string', enum: ['css', 'json'], description: 'Default css.' },
        theme: { type: 'string', enum: ['light', 'dark', 'both'], description: 'Color theme for css output. Default both.' }
      },
      additionalProperties: false
    },
    run({ section = 'all', format = 'css', theme = 'both' }) {
      if (format === 'json') {
        if (section === 'all') return json(tokens);
        const s = getSection(section);
        if (!s) throw new Error(`Unknown section "${section}".`);
        return json(s);
      }
      const sections = section === 'all' || section === 'breakpoints' ? [] : [section];
      return text(generateCss({ theme, sections }));
    }
  },
  {
    name: 'get_type_role',
    description:
      'Pick the right MD3 type role. Pass "purpose" in plain words ("dialog body", "button label", "table cell") ' +
      'to get the role and its CSS, or pass "role" to look one up. Communication surfaces use real reading sizes.',
    inputSchema: {
      type: 'object',
      properties: {
        purpose: { type: 'string', description: 'What the text is for, e.g. "snackbar text".' },
        role: { type: 'string', description: 'A role name, e.g. "body-medium".' }
      },
      additionalProperties: false
    },
    run({ purpose, role }) {
      const roles = tokens.type.roles;
      let matches = [];
      if (role) {
        if (!roles[role]) throw new Error(`Unknown role "${role}". Roles: ${Object.keys(roles).join(', ')}.`);
        matches = [{ purpose: '(direct lookup)', role }];
      } else if (purpose) {
        const words = purpose.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1);
        matches = tokens.type.purposes
          .map(p => ({ p, score: words.filter(w => p.purpose.toLowerCase().includes(w)).length }))
          .filter(x => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(x => x.p);
        if (!matches.length) {
          return text(
            `No purpose matched "${purpose}". Known purposes:\n` +
            tokens.type.purposes.map(p => `- ${p.purpose}: ${p.role}`).join('\n')
          );
        }
      } else {
        return json(tokens.type.purposes);
      }
      const out = matches.map(m => {
        const r = roles[m.role];
        return {
          purpose: m.purpose,
          role: m.role,
          note: m.note || undefined,
          spec: `${r.size * 16}px / ${r.line * 16}px, weight ${r.weight}, tracking ${r.tracking}px, ${r.family} font`,
          css: `.md-type-${m.role}  /* or: font: ${r.weight} var(--md-type-${m.role}-size)/var(--md-type-${m.role}-line) var(--md-font-${r.family}); */`
        };
      });
      return json(out);
    }
  },
  {
    name: 'list_components',
    description: 'List the ready-made MD3 Expressive components (id, name, category, one-line summary).',
    inputSchema: {
      type: 'object',
      properties: { category: { type: 'string', description: 'Optional filter: actions, navigation, containers, inputs, communication, content, foundation.' } },
      additionalProperties: false
    },
    run({ category }) {
      return json(components.list(category));
    }
  },
  {
    name: 'get_component',
    description:
      'A component as copy-ready HTML, CSS and JS plus its spec and accessibility rules. The CSS reads --md-* tokens, ' +
      'so include the token sheet (get_tokens) once. Request only the parts you need.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Component id from list_components, e.g. "dialog".' },
        parts: {
          type: 'array',
          items: { type: 'string', enum: ['spec', 'a11y', 'html', 'css', 'js', 'notes'] },
          description: 'Default: all parts.'
        }
      },
      required: ['id'],
      additionalProperties: false
    },
    run({ id, parts }) {
      const c = components.get(id);
      if (!c) throw new Error(`Unknown component "${id}". Call list_components. Ids: ${components.all().map(x => x.id).join(', ')}.`);
      const want = parts && parts.length ? parts : ['spec', 'a11y', 'html', 'css', 'js', 'notes'];
      const out = [`# ${c.name}`, c.summary, c.requires.length ? `Requires: ${c.requires.join(', ')}` : ''];
      for (const p of want) {
        const body = c.sections[p];
        if (!body) continue;
        const lang = { html: 'html', css: 'css', js: 'js' }[p];
        out.push(lang ? `## ${p.toUpperCase()}\n\`\`\`${lang}\n${body}\n\`\`\`` : `## ${p.toUpperCase()}\n${body}`);
      }
      return text(out.filter(Boolean).join('\n\n'));
    }
  },
  {
    name: 'build_stylesheet',
    description:
      'One stylesheet: the token sheet plus the CSS of the components you choose (and everything they require). ' +
      'Leave "components" empty for the full kit. Save the result as md3-expressive.css.',
    inputSchema: {
      type: 'object',
      properties: {
        components: { type: 'array', items: { type: 'string' }, description: 'Component ids. Empty means all.' },
        theme: { type: 'string', enum: ['light', 'dark', 'both'], description: 'Default both.' }
      },
      additionalProperties: false
    },
    run({ components: ids = [], theme = 'both' }) {
      return text(components.bundleCss(ids, theme));
    }
  },
  {
    name: 'lint_markup',
    description:
      'Check HTML, Razor, JSX-like markup or CSS against the MD3 Expressive rules: accessible names, aria-pressed with ' +
      'active, dialog openers, heading outline, static inline styles, px font sizes, hardcoded colors, text below the ' +
      'scale floor, removed focus rings, "transition: all". Returns findings with line numbers and fixes. ' +
      'Pass the source text, not a path.',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'The markup or CSS text to check.' },
        kind: { type: 'string', enum: ['auto', 'html', 'css'], description: 'Default auto-detect.' },
        allow_inline_css: { type: 'boolean', description: 'Skip the no-CSS-in-markup rules. Default false.' }
      },
      required: ['source'],
      additionalProperties: false
    },
    run({ source, kind = 'auto', allow_inline_css = false }) {
      if (typeof source !== 'string' || !source.trim()) throw new Error('"source" must be non-empty text.');
      const result = lint(source, { kind, noInlineCss: !allow_inline_css });
      const summary =
        `${result.kind.toUpperCase()}: ${result.counts.error} error(s), ${result.counts.warn} warning(s), ${result.counts.info} note(s).`;
      return text(summary + '\n' + JSON.stringify(result.findings, null, 2));
    }
  },
  {
    name: 'check_contrast',
    description:
      'WCAG contrast between a foreground and background hex color. A translucent foreground (#rrggbbaa) is composited ' +
      'over the background. Text needs 4.5:1 (3:1 for 18sp+ or 14sp bold), UI parts and icons 3:1.',
    inputSchema: {
      type: 'object',
      properties: {
        foreground: { type: 'string', description: 'e.g. #006780 or #006780cc' },
        background: { type: 'string', description: 'e.g. #f8fafd (opaque)' }
      },
      required: ['foreground', 'background'],
      additionalProperties: false
    },
    run({ foreground, background }) {
      return json(contrast.check(foreground, background));
    }
  },
  {
    name: 'get_checklist',
    description:
      'The done-checklist for MD3 Expressive UI work. Run through it before calling UI done. ' +
      'Optionally pick a surface to see the items that matter most for it.',
    inputSchema: {
      type: 'object',
      properties: {
        surface: { type: 'string', enum: Object.keys(checklist.surfaces), description: 'Optional: ' + Object.keys(checklist.surfaces).join(', ') }
      },
      additionalProperties: false
    },
    run({ surface }) {
      const out = { checklist: checklist.items };
      if (surface) {
        if (!checklist.surfaces[surface]) throw new Error(`Unknown surface "${surface}".`);
        out.focus = checklist.surfaces[surface];
      }
      out.rules = Object.entries(RULES).map(([id, r]) => ({ id, severity: r.severity }));
      return json(out);
    }
  }
];

function callTool(name, args) {
  const tool = tools.find(t => t.name === name);
  if (!tool) throw new Error(`Unknown tool "${name}".`);
  return tool.run(args || {});
}

module.exports = { tools, callTool };
