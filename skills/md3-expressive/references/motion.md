# Motion

Expressive motion is spring based. Two families:

- **Spatial** (position, size, shape): overshoots slightly. `--md-spring-fast-spatial`, `default-spatial`, `slow-spatial`.
- **Effects** (color, opacity): no overshoot. `--md-spring-fast-effects`, `default-effects`, `slow-effects`.

Each has a matching `-dur` variable. Use it as the duration: `transition: border-radius var(--md-spring-fast-spatial-dur) var(--md-spring-fast-spatial);`.

| Token | Duration | Use |
|---|---|---|
| fast spatial | 350ms | Small components: buttons, switches, chips, nav indicator. |
| default spatial | 500ms | Dialogs, snackbars, cards. |
| slow spatial | 650ms | Full-screen or large container moves. |
| fast / default / slow effects | 150 / 200 / 300ms | Color and opacity changes. |

## Caveat

CSS has no true spring. The kit's curves are cubic-bezier approximations that overshoot in the same shape. For an exact spring, drive the animation with the Web Animations API and a `linear()` easing sampled from a spring function, or use a motion library.

## Rules

- Animate `transform` and `opacity`. Do not animate layout properties on long lists.
- Never `transition: all`. List the properties.
- Pair a spatial change with an effects change (a dialog scales on the spatial spring and fades on the effects spring).
- `prefers-reduced-motion: reduce` collapses every `--md-dur-*` and `--md-spring-*-dur` token to 0.01ms in the token sheet. Components that use the tokens need nothing more. Custom animation needs its own reduced-motion rule.
- Enter slower than exit. A snackbar slides in on the spatial spring and leaves on a fast effects fade.
