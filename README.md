# Claude MD3 Expressive

[![tests](https://github.com/ShlomyShLev/claude-md3-expressive/actions/workflows/test.yml/badge.svg)](https://github.com/ShlomyShLev/claude-md3-expressive/actions/workflows/test.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![node >=18](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![dependencies: 0](https://img.shields.io/badge/dependencies-0-brightgreen.svg)

**A Material Design 3 Expressive kit for [Claude Code](https://claude.com/claude-code).** Claude stops guessing font sizes, hex colors and ARIA attributes, and starts building UI from tokens, tested components and a linter that checks its own work.

It is a plugin with three parts:

| Part | What it is | Why it matters |
|---|---|---|
| **A skill** (`md3-expressive`) | The design rules, loaded automatically when you ask for UI work. | You stop re-explaining type roles, shape, motion and accessibility every session. |
| **18 ready-made components** | Copy-ready HTML, CSS and JS: app bars, buttons, dialogs, text fields, tables and more. | Claude adapts a proven, accessible component instead of inventing markup. |
| **An MCP server** (plain Node, zero dependencies) | Eight tools Claude calls while it works: tokens, type roles, components, checklist, linter, contrast checker. | The rules are enforced by code, not by hoping the model remembers them. |

Everything is checked by a test suite (48 tests, no network, no dependencies) and the kit passes its own linter.

> This is the practice distilled from building a real MD3 Expressive dashboard ([gmdmarkets.com](https://gmdmarkets.com)). It is not an official Google specification, and it checks rules, not taste: it cannot tell you a layout looks cramped.

## What you get

**Without the kit**, Claude writes valid-looking UI that drifts: 12px text in a dialog, `#333` hardcoded so dark mode breaks, an icon button with no name, a selected tab that screen readers cannot see.

**With the kit**, Claude:

- picks the type role for the **purpose** of the text ("dialog body" gives Body Medium 14sp, never a dense data size),
- themes through `--md-*` color roles so light and dark both work,
- starts from a component whose dimensions follow the spec (top app bar 64/112dp, navigation bar 80dp, buttons 40dp, chips 32dp, FAB 56dp),
- makes the **expressive** choices, not just valid ones: filled tonal fields, tonal surfaces instead of shadows, larger corner radii, shape that morphs on press and selection,
- ships accessible markup by default: named controls, `aria-pressed` twinned with an `active` class, `aria-haspopup="dialog"` on dialog openers, a real heading outline,
- runs `lint_markup` on its own output and fixes every error before it says "done".

## Install

You need Claude Code and Node 18 or newer. Nothing is installed from npm.

```text
/plugin marketplace add ShlomyShLev/claude-md3-expressive
/plugin install claude-md3-expressive@md3-expressive
```

To try it from a local clone instead:

```text
/plugin marketplace add C:\path\to\claude-md3-expressive
/plugin install claude-md3-expressive@md3-expressive
```

Restart Claude Code if the MCP tools do not appear. The skill activates by itself when you ask for UI work.

## How to use it

You do not call anything yourself. Ask for UI and Claude follows the skill's workflow.

> **You:** Add a settings dialog to this page with a notifications switch and Save / Cancel.

Claude will, in order:

1. call `get_checklist` (surface: `dialog`) and `list_components`,
2. call `get_component` for `dialog`, `switch` and `button`,
3. call `get_type_role` for "dialog headline" and "dialog body",
4. write the markup, reusing the kit's HTML and CSS,
5. call `lint_markup` on the result and fix what it reports,
6. walk the checklist before declaring it done.

More prompts that work well:

- `Review src/components/Header.tsx against MD3 Expressive and fix every lint error.`
- `Build me a stylesheet with the token sheet plus buttons, chips and a data table.`
- `Is #777 on white OK for body text?` (Claude calls `check_contrast`.)
- `What type role should a snackbar message use?`

A longer worked example, with the real tool output, is in [docs/examples.md](docs/examples.md).

## The MCP tools

| Tool | What it does |
|---|---|
| `get_checklist` | The done-checklist, optionally focused on a surface (`page`, `dialog`, `form`, `navigation`, `dashboard`). |
| `get_tokens` | Color roles (light and dark), type, shape, spacing, motion, state layers, elevation, as CSS or JSON. |
| `get_type_role` | The right type role for a purpose in plain words ("dialog body", "table cell"). |
| `list_components` | The component list with one-line summaries, filterable by category. |
| `get_component` | One component: spec, accessibility rules, HTML, CSS, JS. Ask only for the parts you need. |
| `build_stylesheet` | Tokens plus the CSS of chosen components (and what they require) in one file. |
| `lint_markup` | Checks HTML, Razor, JSX-like markup or CSS against the rules, with line numbers and fixes. |
| `check_contrast` | WCAG contrast ratio for two colors, translucent foregrounds included. |

### Example: the linter

```text
<button class="active"><span class="material-symbols-outlined">star</span></button>
<h1>Title</h1>
<h3>Skipped</h3>
<div style="color:red">x</div>
```

```text
HTML: 2 error(s), 3 warning(s), 0 note(s).
  line 1  error  a11y-button-name      Button has no accessible name (content: "star").
  line 1  error  a11y-selected-state   Button carries "active" but no aria-pressed, aria-current or aria-selected.
  line 1  warn   a11y-icon-exposed     Icon glyph is not aria-hidden, so its ligature name is read aloud.
  line 3  warn   a11y-heading-skip     h1 is followed by h3.
  line 4  warn   css-inline-style      Static inline style: color:red
```

Every finding also carries a `fix` string telling Claude (or you) what to change.

### Example: the type role

`get_type_role` with `purpose: "dialog body"` answers `body-medium`, 14px / 20px, weight 400, plain font, with the note "Communication surface: real reading size, never a dense data token."

### Example: the contrast checker

`check_contrast` with `#777777` on `#ffffff` answers a ratio of **4.48**: it fails AA for normal text (needs 4.5) but passes for large text and UI parts. The kit's own palette is tested so every text pair keeps 4.5:1 and every outline pair 3:1, in both themes.

## The components

| Category | Components |
|---|---|
| Foundation | `foundation` (page skeleton, base reset, focus ring, icon helper, skip link, theme toggle) |
| Actions | `button`, `button-group`, `icon-button`, `chip`, `fab` |
| Navigation | `top-app-bar`, `navigation-bar`, `tabs` |
| Containers | `card`, `list` |
| Inputs | `text-field`, `switch` |
| Communication | `dialog`, `snackbar`, `banner` |
| Content | `data-table`, `toc-faq` (jump-to-section box, numbered sections, visible FAQ) |

Each component is one file in `mcp-server/data/components/` with `@@spec`, `@@a11y`, `@@html`, `@@css` and `@@js` sections.

## Use it without Claude

```bash
node scripts/build-css.js      # writes dist/md3-expressive.css (tokens plus every component)
node scripts/serve.js          # serves examples/demo.html on http://localhost:4173
npm test                       # 48 tests
```

Link `dist/md3-expressive.css` and `dist/md3-expressive.js`, then copy markup from `mcp-server/data/components/*.cmp`. Open `examples/demo.html` to see everything.

The MCP server also works with any MCP client:

```json
{ "mcpServers": { "md3-expressive": { "command": "node", "args": ["/path/to/claude-md3-expressive/mcp-server/server.js"] } } }
```

## What the linter checks

Accessible names on buttons, links and inputs; `aria-pressed` (or `aria-current`, `aria-selected`) next to an `active` class; `aria-haspopup="dialog"` on dialog openers; named dialogs; contiguous headings and one `h1`; table header cells; icon glyphs hidden from screen readers; alt text; static inline styles and `<style>` blocks; px font sizes and layout; hardcoded colors; text under 11px; removed focus rings; `transition: all`; raw radii and easings; missing `prefers-reduced-motion`.

Script blocks and comments are ignored. Dynamic style bindings that set a custom property (`style="--x:{{value}}"`) are allowed. The full rule list, with severities and fixes, is the `RULES` table in `mcp-server/lib/lint.js`.

## Make it yours

- **Palette:** replace the two color blocks in `mcp-server/data/tokens.json`. The tests verify every text pair keeps 4.5:1 and every outline pair 3:1 in both themes.
- **Components:** add one file to `mcp-server/data/components/` and it appears in `list_components`. The tests check that its CSS only uses tokens that exist and passes the linter.
- **Fonts and icons:** no font files are shipped. Set `--md-font-plain` and `--md-font-brand`, and provide Material Symbols. If you ship a static icon subset, verify each icon name is in it: a missing name renders as literal text.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the rules a new component has to meet.

## Honest limits

- CSS has no true spring. The motion tokens are cubic-bezier approximations of the Expressive spring tokens. See `skills/md3-expressive/references/motion.md`.
- The default palette is a cyan seed taken from the project this came from.
- Component CSS uses `color-mix()` and `:has()`, so it needs a current browser (2023 or newer).
- The linter reads text. It does not run your page, so it cannot see computed styles or contrast against real backgrounds.
- Plugins and skills work in Claude Code. Other agents can use the MCP server on its own.

## FAQ

**What is Claude MD3 Expressive?**
A free, open-source Claude Code plugin that teaches Claude to build Material Design 3 Expressive interfaces: a design skill, 18 accessible components and an MCP server with a linter.

**Does it need npm packages or a network connection?**
No. The server is plain Node 18+ with zero dependencies and makes no network calls.

**Does it work with React, Vue, Razor or plain HTML?**
Yes. The components are plain HTML, CSS and JS, and the linter reads HTML, Razor, JSX-like markup and CSS as text.

**Is this an official Google or Material product?**
No. It is an independent kit based on the public Material Design 3 guidance.

**Where does it come from?**
From building the live [Global Markets Dashboard](https://gmdmarkets.com), an MD3 Expressive market dashboard.

## License

MIT. See [LICENSE](LICENSE). Changes are listed in [CHANGELOG.md](CHANGELOG.md).
