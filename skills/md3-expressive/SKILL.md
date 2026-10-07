---
name: md3-expressive
description: Use when designing or building any user interface (web page, component, dialog, form, dashboard, app shell, stylesheet) so it follows Material Design 3 Expressive with accessible markup. Covers type roles, color roles, shape, motion, state layers, component specs, and an accessibility checklist, and works with the md3-expressive MCP tools when they are available.
---

# MD3 Expressive

Material Design 3 Expressive is the acceptance criterion for UI work. Apply it from the first line, not as a cleanup pass. "Valid MD3" is not enough: pick the expressive options.

## Workflow

1. **Before writing markup**, call `get_checklist` (surface: page, dialog, form, navigation or dashboard) and `list_components`. Reuse a kit component before inventing markup.
2. **Tokens once.** Call `get_tokens` (format css) or `build_stylesheet` and put the result in a stylesheet. Components read `--md-*`, `--shape-*`, `--sp-*` tokens and never hex values.
3. **Components.** Call `get_component` for the id you need and use its HTML and CSS as the base. Adapt content, not structure.
4. **Type.** For every text surface call `get_type_role` with its purpose. Do not guess sizes.
5. **Check.** Run `lint_markup` on the final markup and again on the CSS. Fix every error. Use `check_contrast` for any color pair that is not a token pair.
6. **Finish** by walking the checklist. Do not declare UI done before the lint is clean.

If the MCP tools are not available, the same rules are in `references/`. Read the file for the area you are working on.

## The rules that matter most

- **Purpose-correct type.** Communication surfaces (dialogs, banners, snackbars, onboarding, prose) use real reading sizes: Body Medium 14sp, Label Large 14sp for buttons, Title Small or Medium 14 to 16sp. A dense data scale is for ticker and price grids only. Nothing below Label Small (11sp).
- **Roles, not colors.** Theme through `--md-*` color roles so light and dark both work. No hex in component CSS.
- **Expressive, not just valid.** Filled tonal fields, tonal surfaces instead of shadows, the larger end of the shape scale, shape that morphs on press and selection, spring motion for spatial change.
- **Specs are dimensions, not suggestions.** Top app bar 64 or 112dp, navigation bar 80dp with a 64x32dp indicator, buttons 40dp, chips 32dp, FAB 56dp, icon buttons 48dp targets, dialog padding 24dp.
- **State layers by `color-mix`.** Hover 8%, focus and pressed 10%, disabled 38% content on 12% container.
- **Units.** rem, never px, except hairline borders and shadow offsets. Never override the root font size.
- **No CSS in markup.** No `<style>` blocks, no static inline `style`. A dynamic binding that sets a custom property is the only exception.
- **Accessible by default**, not as a later chore:
  - Every control has a name. An icon or emoji is not a name: `aria-label` on the control, `aria-hidden="true"` on the glyph.
  - A visual selected state has a programmatic twin: `aria-pressed` on every button of a toggle group, `aria-current` for navigation, `aria-selected` for tabs, kept in sync wherever JS toggles the class, timers included.
  - A control that opens a dialog says `aria-haspopup="dialog"`. It does not use `aria-pressed`.
  - Real heading outline: one `h1`, contiguous levels, section titles are headings (reset margin in CSS).
  - Contrast 4.5:1 for text, 3:1 for UI parts, and meaning is never color alone.
  - Visible `:focus-visible` ring, never removed without a replacement.
  - Honor `prefers-reduced-motion`.
- **Icons.** Verify an icon name exists in the font you ship. A static subset renders a missing name as literal ligature text.
- **A mockup is intent, not law.** If a design reference disagrees with MD3, MD3 wins and you say why.

## When a reference mockup or the user disagrees

Follow the user's explicit instruction, and mention the MD3 consequence in one sentence. Do not silently ship a deviation.

## References

Read only what the task needs.

- `references/tokens.md`: color roles, shape, spacing, elevation, state layers.
- `references/type.md`: the 15 type roles, which one to use for what, emphasized variants.
- `references/motion.md`: springs, durations, easing, reduced motion.
- `references/components.md`: dimensions and behavior for each kit component.
- `references/accessibility.md`: the accessibility rules with examples.
- `references/anti-patterns.md`: what drifts from Expressive and how to fix it.
