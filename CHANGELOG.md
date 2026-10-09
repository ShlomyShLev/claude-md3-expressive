# Changelog

All notable changes to this project are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-10-09

First public release.

### Added
- `md3-expressive` skill with six reference files: accessibility, anti-patterns, components, motion, tokens, type.
- MCP server (Node 18+, zero dependencies) with eight tools: `get_checklist`, `get_tokens`, `get_type_role`, `list_components`, `get_component`, `build_stylesheet`, `lint_markup`, `check_contrast`.
- 18 components: foundation, button, button group, icon button, chip, FAB, top app bar, navigation bar, tabs, card, list, text field, switch, dialog, snackbar, banner, data table, content page kit.
- Linter with 23 rules for accessibility and token discipline, reporting line numbers and fixes.
- `dist/md3-expressive.css` and `dist/md3-expressive.js`, built by `scripts/build-css.js`.
- `examples/demo.html` showing every component in light and dark.
- Test suite: 49 tests for contrast, tokens, components, linter, the MCP protocol, documentation examples, dist freshness and packaging.
