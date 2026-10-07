# Accessibility

Interactive markup has to be readable without eyes. Screen readers and AI agents navigate by names, states and headings, so this is part of the product, not a separate chore. `lint_markup` checks the rules below.

## Names

Every control needs one. An emoji or icon is not a name.

```html
<!-- wrong: reads as "red circle button" or the ligature text -->
<button class="live"><span class="md-icon">fiber_manual_record</span></button>

<!-- right -->
<button class="live" aria-label="Live updates"><span class="md-icon" aria-hidden="true">fiber_manual_record</span></button>
```

## State needs a programmatic twin

A button that has an `active` class needs an attribute that says the same thing. Set it wherever JS toggles the class, including timers and auto-resets.

| Control | Attribute |
|---|---|
| Toggle button, filter chip | `aria-pressed="true|false"` on every button in the group |
| Navigation link for the current page | `aria-current="page"` |
| Tab | `aria-selected="true|false"` plus `aria-controls` |
| Expandable | `aria-expanded` |
| Switch | native checkbox with `role="switch"` |

A control that opens a dialog says `aria-haspopup="dialog"`. It is not "pressed".

## Dialogs

Native `<dialog>` with `showModal()` gives focus trapping and Escape. Name it with `aria-labelledby`. Provide a visible Cancel. Focus returns to the opener.

## Headings

One `h1`. Levels contiguous (no h1 to h3). A section title styled as a `span` becomes a real `h2`/`h3`, with the margin reset in CSS so it renders exactly as the span did.

## Forms

Every input has a label (wrapping `<label>`, `for`, or `aria-label`). Errors are linked with `aria-describedby` and `aria-invalid="true"`, and carry an icon and text, not only red.

## Tables

Real `<table>` with `<caption>`, `<th scope="col">` and `<th scope="row">`. A horizontally scrolling table sits in a focusable region with an `aria-label`.

## Color and contrast

Text 4.5:1 (3:1 for 18sp and up, or 14sp bold). UI parts, icons and focus rings 3:1. Use `check_contrast` for anything off the token pairs. Meaning is never carried by color alone: pair gain/loss with a sign or arrow.

## Focus and touch

Visible `:focus-visible` ring (3dp, 2dp offset). Never `outline: none` without a replacement. Touch targets at least 48dp.

## Motion

Honor `prefers-reduced-motion`. No auto-playing motion longer than 5 seconds without a way to pause.

## Live regions

Status text that changes after load (a snackbar, a saved confirmation) lives in a region that already exists in the DOM: `role="status"` with `aria-live="polite"`. Use `role="alert"` for errors only.
