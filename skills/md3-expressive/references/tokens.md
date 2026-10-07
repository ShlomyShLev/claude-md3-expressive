# Tokens

The authoritative values are in `mcp-server/data/tokens.json`. `get_tokens` returns them as CSS. This page explains how to use them.

## Color roles

Pair every container with its `on-` role. Never pick a hex.

| Role | Use |
|---|---|
| `primary` / `on-primary` | The single most important action (filled button, active switch). |
| `primary-container` / `on-primary-container` | Prominent but not dominant (FAB, section number badge). |
| `secondary-container` / `on-secondary-container` | Tonal controls: tonal buttons, selected chips, the nav indicator. |
| `tertiary*` | A contrasting accent. Use sparingly. |
| `error*` | Errors only. Pair with an icon and text. |
| `surface`, `surface-1` to `surface-5` | Tonal elevation. Higher number is more prominent. Cards use 3, dialogs 3, fields 4, the app bar rests on `surface` and goes to 2 on scroll. |
| `on-surface`, `on-surface-variant` | Primary text, secondary text and icons. |
| `outline`, `outline-variant` | Borders that must be seen (outline), dividers (outline-variant). |
| `inverse-surface` and friends | Snackbars. |
| `scrim` | Behind modals, at 32%. |

Light and dark use the same role names. The token sheet re-points them under `prefers-color-scheme` and `[data-theme="light|dark"]`, so components never branch.

To re-seed the palette, replace the two color blocks in `tokens.json` and run the tests: they check that every text pair meets 4.5:1 and every outline pair 3:1 in both themes.

## Shape

`--shape-xs` 4, `sm` 8, `md` 12, `lg` 16, `lg-inc` 20, `xl` 28, `xl-inc` 32, `2xl` 48, `full` pill. Expressive leans large: cards `lg-inc`, dialogs `xl`, buttons `full`. Shape morphs: a pressed button goes `full` to `md`, a selected toggle holds `md`. At most three radii on a screen.

## Spacing

`--sp-xs` 4, `sm` 8, `md` 12, `lg` 16, `xl` 24, `2xl` 32, `3xl` 48 (px values, written as rem). Component padding comes from the component spec.

## Elevation

Prefer tonal surfaces. A shadow (`--md-elev-1` to `5`) only where something floats: FAB, menu, snackbar, dialog.

## State layers

Hover 8%, focus 10%, pressed 10%, dragged 16%. Disabled: content 38%, container 12%. Implement with `color-mix`:

```css
.thing { --_bg: var(--md-secondary-container); --_c: var(--md-on-secondary-container); background-color: var(--_bg); color: var(--_c); }
.thing:hover { background-color: color-mix(in srgb, var(--_c) 8%, var(--_bg)); }
```

## Breakpoints

Compact under 40rem (navigation bar), medium 40 to 52.5rem (rail), expanded from 52.5rem (drawer). Reading column about 62rem.
