# Changelog

## [0.3.0] — 2026-04-06

### Changed
- **Centralized project storage** — MINT.md files now live at
  `~/.mint-kit/projects/{slug}/MINT.md` instead of `./MINT.md` in cwd.
  Multiple projects can coexist. Skills can run from any directory.
- **Session files co-located** — session checkpoints moved from
  `~/.cache/mint-kit/{slug}/` into `~/.mint-kit/projects/{slug}/` alongside
  MINT.md. One directory per project holds everything.
- **Specimen HTML moved** — from `~/Downloads/mint-kit/specimen.html` to
  `~/.mint-kit/specimen.html`. All mint-kit state under one tree.
- **Slug derived from product name** — not cwd directory name. Consistent
  across skills regardless of where you run them.
- Entry gate now lists all existing projects from `~/.mint-kit/projects/`.
- mint-lib searches `~/.mint-kit/projects/` instead of cwd for MINT.md files.

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
