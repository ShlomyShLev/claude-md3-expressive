# Components

Call `get_component` for the HTML, CSS, JS and accessibility notes. Call `list_components` for the current list. Dimensions at a glance:

| Component | Key dimensions and behavior |
|---|---|
| Top app bar | Small 64dp, medium 112dp. Title Title Large (or Headline Small on medium). Surface at rest, surface-2 on scroll. |
| Navigation bar | 80dp min height plus safe area. 3 to 5 destinations. 64x32dp active indicator. Labels always visible. Compact widths only. |
| Buttons | 40dp (xs 32, md 56, lg 96). Pill at rest, morphs to md on press. Label Large. One filled button per screen. |
| Button group | Connected, 2dp gap, selected morphs to a full pill. 2 to 5 options. |
| Icon button | 48dp target, 40dp container, 24dp icon. Always `aria-label`. |
| FAB | 56dp, shape lg (rounded square, not a circle). Extended has a label. One per screen. |
| Chip | 32dp, shape sm. Filter chips toggle with `aria-pressed` and show a check. |
| Text field | Filled, 56dp, floating label, top corners sm, 1px to 2px active indicator. Supporting text linked by `aria-describedby`. |
| Switch | Track 52x32dp, thumb 16 / 24 / 28dp. Selected thumb shows a check. Native checkbox with `role="switch"`. |
| Card | Tonal surface-3, shape lg-inc, 16dp padding. Title is a real heading. One link per card. |
| List | 56 / 72 / 88dp rows. Body Large headline, Body Medium support. |
| Tabs | 48dp, 3dp rounded indicator, arrow-key navigation, roving tabindex. |
| Dialog | Native `<dialog>`, surface-3, shape xl, 24dp padding, 280 to 560dp wide. Headline Small, body Body Medium. |
| Snackbar | inverse-surface, 48dp min, one action, 4 to 10s, `role="status"`. |
| Banner | surface-3, shape lg, 16dp padding, Body Medium text, two actions at most. |
| Data table card | Real `<table>` with caption and `<th scope>`, scrolls inside the card, tabular numerals, unit and date note. |
| Content kit | One h1, "Jump to section" card, numbered h2 sections, visible FAQ mirrored in FAQPage JSON-LD. |

## Choosing

- A choice among few related options: button group (2 to 5), chips (filters), tabs (peer views of one thing), navigation bar (destinations).
- A confirmation needing a decision: dialog. A confirmation that needs none: snackbar. A notice that stays: banner.
- An immediate on/off: switch. A choice applied on Save: checkbox.

## Adding a component the kit lacks

1. Define the container and content roles with `--_bg` and `--_c`, then derive state layers with `color-mix`.
2. Take dimensions from the MD3 spec, in rem.
3. Choose type from `get_type_role`, shape from the scale, motion from the spring tokens.
4. Write the accessible markup first. Then run `lint_markup`.
