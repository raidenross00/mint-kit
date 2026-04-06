# Changelog

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
