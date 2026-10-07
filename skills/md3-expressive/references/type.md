# Type

Fixed scale in rem (1rem = 16px). Roles, size/line-height, weight:

| Role | Size / line | Weight | Use |
|---|---|---|---|
| display-large | 57 / 64 | 400 | One hero number or splash per screen. |
| display-medium | 45 / 52 | 400 | |
| display-small | 36 / 44 | 400 | |
| headline-large | 32 / 40 | 400 | Page title (h1) on wide screens. |
| headline-medium | 28 / 36 | 400 | Page title on phones. |
| headline-small | 24 / 32 | 400 | Section title (h2), dialog headline. |
| title-large | 22 / 28 | 400 | Subsection (h3), top app bar title. |
| title-medium | 16 / 24 | 500 | Card title, FAQ question. |
| title-small | 14 / 20 | 500 | Tab label, table header. |
| body-large | 16 / 24 | 400 | Prose, list headline, text field input. |
| body-medium | 14 / 20 | 400 | Dialog body, banner and snackbar text, table cell, card body. |
| body-small | 12 / 16 | 400 | Captions, helper text, source lines. |
| label-large | 14 / 20 | 500 | Button and chip labels. |
| label-medium | 12 / 16 | 500 | Navigation bar labels, dense data cells. |
| label-small | 11 / 16 | 500 | Badges, overlines. The floor. |

Use `get_type_role` with a purpose ("snackbar text") to get the role instead of guessing.

## Rules

- **Communication surfaces use reading sizes.** Dialogs, banners, snackbars, onboarding, popups and prose never take a dense data token.
- **A denser fluid scale is only for ticker or price grids.** Even there, stay at or above label-small.
- **Brand font for display, headline and title-large. Plain font for everything that is read at length.** Fonts are not shipped: set `--md-font-brand` and `--md-font-plain`.
- **Emphasized variants.** Expressive uses heavier weights where the text carries meaning. The kit convention is regular weight plus 200, capped at 700, via `.md-type-emphasized`.
- **Numbers in tables** use `font-variant-numeric: tabular-nums`.
- **Line length** 65 to 75 characters for prose.
- One `h1` per page. The visual role and the heading level are independent: pick the level for the outline, the role for the look.
