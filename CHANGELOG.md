# Changelog

## [0.5.3.0] — 2026-04-09

### Added
- **Scale family detection** in extract-browser.js — when multiple rendered colors
  share a hue (within 15 degrees OKLCH H), they're identified as steps of the same
  scale. Hand-picked values are slotted into their nearest step positions, and only
  missing steps are generated from the formula. Preserves source site's curated
  color values instead of overwriting with formula output.

### Changed
- **Scale generation: two-path architecture** — Chromatic colors (C >= 0.03) keep
  Adaptive OKLCH with hero at step 500. Neutrals (C < 0.03) now use
  endpoint-anchored Radix-weighted distribution: hand-tuned L targets with dense
  light side (4+ card-safe steps at 50-200) and sparse dark side (text/dark mode).
  Hero hue preserved for tint consistency. Fixes the "depressing neutral" problem
  where hero-at-500 produced only 1-2 usable light steps.
- **`generateScaleOklch` renamed to `generateScaleChromatic`** in extract-browser.js
  for clarity. `generateScaleCompounding` replaced by `generateScaleNeutral`.
- **NEUTRAL_L_TARGETS constant** added to both extract-browser.js and mint-system
  SKILL.md. Hand-tuned values: 50=0.985, 100=0.970 ... 900=0.240, 950=0.180.
- **LIGHT_END knob** updated from 0.97 to 0.985 for chromatic path (lighter step 50).

### Removed
- `generateScaleCompounding()` — replaced by `generateScaleNeutral()`.
  Compounding opacity produced brownish dark ends (stripped cool/warm tint)
  and couldn't reach near-white at step 50 from mid-gray heroes.

## [0.5.2.0] — 2026-04-08

### Added
- **Browser extraction pipeline** (`extract-browser.js`) — headless Chromium/Firefox
  captures computed styles, custom properties, theme variants, and full-page
  screenshots. Pre-computes 13-step color scales for every extracted color.
- **Adaptive OKLCH scale generation** — 13-step scales (50–950 including 150/250)
  with gamut-ratio chroma, bilateral taper, and chroma-aware dark endpoints.
  Near-neutral fallback to compounding opacity.
- **Category breadth color heuristic** — primary color determined by how many
  usage categories a color spans (meta signals, surfaces, text, interactive,
  borders), not element-role weighting. Replaces the old 5x-CTA heuristic
  that picked accent colors over brand identity colors.
- **Screenshot verification** — mandatory full-page screenshot analysis after
  computed-style ranking. Measures designed-surface AREA, not contrast/pop.
  Serves as tiebreaker when category breadth ties.
- **`border-color` extraction** — added to TOKEN_PROPERTIES, cross-reference
  pipeline, and scale generation. Enables the border/accent usage category.
- **Adaptive chroma taper** — extreme-light heroes (L > 0.7) differentiate
  through chroma variation instead of lightness, preventing washed-out scales.

### Changed
- **Logo/favicon demoted** — now a supporting signal only for color identification.
  Never used as tiebreaker since nav logos are often monochrome or compressed.
- **Figma variable structure** — updated from 11 vars to 13 vars per color scale
  (includes 150/250 intermediate steps).
- **Phase 4 Step 1** — "full 10-step scale" → "full 13-step scale" with enumerated steps.
- **MINT.md template** — Brand Tokens table now shows all 13 steps explicitly.
  CSS custom properties comment updated from "compounding opacity" to "Adaptive OKLCH".

### Removed
- Element-role weighting (5x CTA, 4x nav, 2x backgrounds) — root cause of
  the CTA-over-brand-color bug.
- Forza-specific screenshot guidance (geometric shapes, pink triangle examples).

## [0.4.0] — 2026-04-07

### Added
- **Browser extraction for mint-extract** — `extract-browser.js` with Chromium/Firefox
  discovery, computed style capture, and theme detection.
- **Shared MINT.md template** — canonical template in MINT_EXAMPLES.md.

## [0.3.1] — 2026-04-06

### Fixed
- **Specimen path uses non-hidden directory** — moved from `~/.mint-kit/` to
  `~/mint-kit/`. Firefox on Linux blocks `file://` access to dotfile directories,
  so specimens were inaccessible in the browser.

## [0.3.0] — 2026-04-06

### Changed
- **Centralized project storage** — MINT.md files now live at
  `~/mint-kit/projects/{slug}/MINT.md` instead of `./MINT.md` in cwd.
  Multiple projects can coexist. Skills can run from any directory.
- **Session files co-located** — session checkpoints moved from
  `~/.cache/mint-kit/{slug}/` into `~/mint-kit/projects/{slug}/` alongside
  MINT.md. One directory per project holds everything.
- **Specimen HTML moved** — from `~/Downloads/mint-kit/specimen.html` to
  `~/mint-kit/specimen.html`. All mint-kit state under one tree.
- **Slug derived from product name** — not cwd directory name. Consistent
  across skills regardless of where you run them.
- Entry gate now lists all existing projects from `~/mint-kit/projects/`.
- mint-lib searches `~/mint-kit/projects/` instead of cwd for MINT.md files.

## [0.2.0] — 2026-04-06

### Added
- **Fast path mode** — when MINT.md has complete tokens (from /mint-extract or a
  previous run), /mint-system can skip consultation (Phases 1-3) and jump straight
  to Figma variable creation (Phase 4). Completes the extract → system → lib pipeline.
- **Entry gate** — running `/mint-system` with no prompt now shows a welcoming
  "What are we building?" question with adaptive options (new system, continue
  session, update incomplete system, or fast-path to Figma). No more silently
  defaulting to the last MINT.md.
- **Figma variable detection** — fast path checks whether the target Figma file
  already has variables from a previous run and offers to overwrite (mint-system
  collections only), skip to publish, or use a different file.

### Changed
- Phase 1 existing MINT.md detection now distinguishes complete vs incomplete
  MINT.md files and offers different options accordingly.
- Overwrite only deletes mint-system collections (Brand/Alias/Map/Responsive) and
  matching styles, not all content in the Figma file.

## [0.1.1] — 2026-04-06

### Added
- **`/mint-extract`** — extract design tokens from any source (Figma, website,
  screenshot, CSS/code, or description) into MINT.md format. One-hit extraction
  with specimen preview. Creates new or merges into existing MINT.md.

## [0.1.0] — 2026-04-06

### Added
- **Auto-update system** — skills now check for new versions on launch and offer
  inline upgrades. No manual `git pull` needed.
- `bin/mint-update-check` — version check script with caching (60min up-to-date,
  720min upgrade-available), snooze with escalating backoff (24h/48h/7d), and
  `--force` flag for manual checks.
- `shared/MINT_UPGRADE.md` — upgrade protocol covering inline upgrade flow,
  just-upgraded handling, config management, and migration runner.
- `VERSION` file for semver tracking (standard `X.Y.Z`).
- `migrations/` directory for future upgrade migration scripts.
- Preamble update-check blocks in both `/mint-system` and `/mint-lib` skills.
