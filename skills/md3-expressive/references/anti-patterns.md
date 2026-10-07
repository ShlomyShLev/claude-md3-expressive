# Anti-patterns

What drifts from MD3 Expressive, and the fix. `lint_markup` catches the ones marked (lint).

| Smell | Fix |
|---|---|
| Dense data font sizes (10 to 12px) on a dialog, banner or popup | Use Body Medium 14sp for the message, Label Large 14sp for buttons, Title Small or Medium for headings. |
| Text below 11px (lint) | Raise to label-small (0.6875rem) or higher. |
| `font-size: 14px`, `padding: 16px` (lint) | rem or tokens. Only hairline borders and shadow offsets stay px. |
| Hex or rgb colors in component CSS (lint) | An `--md-*` role. Both themes then work for free. |
| `<style>` or `style="..."` in markup (lint) | A class in a stylesheet. Dynamic custom-property bindings only. |
| Icon button with no label (lint) | `aria-label` on the button, `aria-hidden` on the glyph. |
| `active` class with no `aria-pressed` (lint) | Add the twin attribute everywhere the class is toggled. |
| `aria-pressed` on a dialog opener | `aria-haspopup="dialog"`. |
| `transition: all` (lint) | List the properties. |
| `outline: none` with no replacement (lint) | `:focus-visible` ring. |
| Heading level skipped, section titles as spans (lint) | Real contiguous headings, margin reset in CSS. |
| Circular FAB, pill chips, 4dp cards | The Expressive shapes: FAB rounded square (lg), chips sm, cards lg-inc. |
| Shadows to show hierarchy | Tonal surfaces (surface-1 to surface-5). Shadow only for floating things. |
| Outlined fields everywhere | Filled tonal fields by default. |
| Hover = opacity change on the whole control | A state layer: `color-mix` of the content color over the container. |
| Instant state changes | Spring on spatial change, effects spring on color and opacity. |
| More than three radii on a screen | Pick from the scale and stay on it. |
| Two filled primary buttons side by side | One filled, the rest tonal, outlined or text. |
| Icon-only navigation | Labels always visible. |
| Fake tables made of divs | A real `<table>`. |
| Copying a reference mockup literally when it breaks MD3 | MD3 is the law. A mockup is intent. Say so. |
| An icon name that is not in the shipped font | Verify it. A static subset renders a missing name as literal text. |
| Overriding the root font size | Never. rem math depends on 1rem = 16px. |
