# Worked examples

Real prompts and what the kit does with them. Tool output below is copied from the running server, trimmed for length.

## 1. Build a dialog

**Prompt**

> Add a "Delete project?" confirmation dialog with Cancel and Delete buttons.

**What Claude does**

1. `get_checklist` with `surface: "dialog"` returns the items that matter for a dialog: type, accessibility, components, expressive choices.
2. `get_component` with `id: "dialog"` returns the spec, the accessibility rules, and the HTML, CSS and JS. The spec says:
   - container surface-3, shape extra-large (28dp), padding 24dp, width 280dp min to 560dp max,
   - headline in Headline Small, body in Body Medium,
   - actions are text or tonal buttons, right aligned, 8dp gap,
   - a communication surface, so the dense data type tokens are never used here.
3. The accessibility rules it must follow:
   - native `<dialog>` opened with `showModal()` traps focus and closes on Escape,
   - `aria-labelledby` points at the headline,
   - the opener has `aria-haspopup="dialog"` (not `aria-pressed`),
   - a visible Cancel button, not only the scrim.
4. `get_type_role` with `purpose: "dialog body"` returns `body-medium` (14px / 20px).
5. Claude writes the markup from the component, then runs `lint_markup`. If the dialog had no name, the linter answers `a11y-dialog-name` with the fix, and Claude corrects it before finishing.

## 2. Review existing markup

**Prompt**

> Lint `Header.cshtml` against MD3 Expressive and fix what it finds.

**Input**

```html
<button class="active"><span class="material-symbols-outlined">star</span></button>
<h1>Title</h1>
<h3>Skipped</h3>
<div style="color:red">x</div>
```

**`lint_markup` output**

```text
HTML: 2 error(s), 3 warning(s), 0 note(s).
line 1  error  a11y-button-name     Button has no accessible name (content: "star").
line 1  error  a11y-selected-state  Button carries "active" but no aria-pressed, aria-current or aria-selected.
line 1  warn   a11y-icon-exposed    Icon glyph is not aria-hidden, so its ligature name is read aloud.
line 3  warn   a11y-heading-skip    h1 is followed by h3.
line 4  warn   css-inline-style     Static inline style: color:red
```

**After the fix**

```html
<button class="active" aria-pressed="true" aria-label="Favorite">
  <span class="material-symbols-outlined" aria-hidden="true">star</span>
</button>
<h1>Title</h1>
<h2 class="section-title">Section</h2>
<div class="note">x</div>
```

The `active` class and `aria-pressed` must change together wherever your JavaScript toggles the class, timers included.

## 3. Lint a stylesheet

**Input**

```css
.card{font-size:13px;color:#333;transition:all .3s}
```

**Output**

```text
CSS: 0 error(s), 3 warning(s), 1 note(s).
line 1  warn  css-px-font          font-size: 13px
line 1  warn  css-hardcoded-color  color: #333
line 1  warn  css-transition-all   transition: all .3s
line 1  info  a11y-motion          Stylesheet animates but has no prefers-reduced-motion rule.
```

**After the fix**

```css
.card {
  font: 400 var(--md-type-body-medium-size)/var(--md-type-body-medium-line) var(--md-font-plain);
  color: var(--md-on-surface);
  transition: background-color var(--md-dur-short3) var(--md-ease-standard);
}
```

## 4. Check a color pair

**Prompt**

> Is #777 on white fine for body text?

`check_contrast` with `#777777` on `#ffffff`:

```json
{
  "ratio": 4.48,
  "aaNormalText": false,
  "aaLargeText": true,
  "aaaNormalText": false,
  "nonTextUi": true
}
```

4.48 is just under the 4.5:1 AA threshold for normal text. It is fine for large text and icons, not for body copy. A translucent foreground (`#rrggbbaa`) is composited over the background first.

## 5. Ship a stylesheet without Claude

```bash
node scripts/build-css.js
```

writes `dist/md3-expressive.css` (tokens plus every component). Link it, then copy markup from `mcp-server/data/components/*.cmp`. `examples/demo.html` shows every component in light and dark.

To get a smaller file, ask Claude: `Build a stylesheet with tokens plus button, chip and data-table.` It calls `build_stylesheet` with those ids and includes what they require (`foundation`).
