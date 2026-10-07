# Contributing

Thanks for helping. The kit is small on purpose: no dependencies, no build step beyond one script.

## Setup

You need Node 18 or newer. There is nothing to install.

```bash
npm test                    # run the whole suite
node scripts/build-css.js   # rebuild dist/ after changing tokens or components
node scripts/serve.js       # view examples/demo.html on http://localhost:4173
```

Commit the rebuilt `dist/` files together with the change that caused them. A test fails if `dist/` is stale.

## Adding a component

1. Create `mcp-server/data/components/<id>.cmp` with the sections `@@spec`, `@@a11y`, `@@html`, `@@css` and `@@js` (copy a small one such as `switch.cmp`).
2. Use `--md-*`, `--shape-*` and `--sp-*` tokens only. No hex colors, no px font sizes.
3. Name every control and give selected states a programmatic twin (`aria-pressed`, `aria-current` or `aria-selected`).
4. Run `npm test`. The suite checks that your CSS only references tokens that exist and that your markup and CSS pass the linter with no errors.
5. Add the component to `examples/demo.html` and rebuild `dist/`.

## Changing the palette or tokens

Edit `mcp-server/data/tokens.json`. The tests verify every text pair keeps 4.5:1 contrast and every outline pair 3:1 in both light and dark. If a pair fails, adjust the color, not the test.

## Adding a lint rule

Add the rule to `RULES` in `mcp-server/lib/lint.js` with a severity and a fix sentence, implement it, and add a test in `tests/lint.test.js` that shows one case it flags and one it must not flag. A rule that cannot say how to fix the problem does not belong in the linter.

## House rules

- No em dashes anywhere (code, docs, tests). Use a comma, colon, period, parentheses or a middot. A test enforces it.
- Keep documentation examples true: `tests/docs.test.js` re-runs them against the real tools.
- Dates in docs are ISO (`YYYY-MM-DD`).
- Keep the zero-dependency promise. If a change needs an npm package, open an issue first.

## Reporting a bug

Open an issue with the markup or CSS that was linted, the output you got, and the output you expected.
