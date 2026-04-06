#!/usr/bin/env bash
# v0.3.0 migration — centralize state under ~/.mint-kit/projects/
#
# Moves:
#   ~/.cache/mint-kit/{slug}/*  →  ~/.mint-kit/projects/{slug}/
#   ~/Downloads/mint-kit/specimen.html  →  ~/.mint-kit/specimen.html
#   ./MINT.md (cwd)  →  ~/.mint-kit/projects/{slug}/MINT.md (best-effort)
#
# Idempotent — safe to run multiple times.
set -euo pipefail

PROJECTS_DIR="$HOME/.mint-kit/projects"
mkdir -p "$PROJECTS_DIR"

# ─── Move session files from ~/.cache/mint-kit/ ─────────────────
CACHE_DIR="$HOME/.cache/mint-kit"
if [ -d "$CACHE_DIR" ]; then
  for slug_dir in "$CACHE_DIR"/*/; do
    [ -d "$slug_dir" ] || continue
    slug="$(basename "$slug_dir")"
    target="$PROJECTS_DIR/$slug"
    mkdir -p "$target"
    for f in "$slug_dir"*-session.json "$slug_dir"*-session.done; do
      [ -f "$f" ] || continue
      fname="$(basename "$f")"
      if [ ! -f "$target/$fname" ]; then
        mv "$f" "$target/$fname"
      fi
    done
    # Clean up empty cache dirs
    rmdir "$slug_dir" 2>/dev/null || true
  done
  rmdir "$CACHE_DIR" 2>/dev/null || true
fi

# ─── Move specimen from ~/Downloads/mint-kit/ ───────────────────
OLD_SPECIMEN="$HOME/Downloads/mint-kit/specimen.html"
NEW_SPECIMEN="$HOME/.mint-kit/specimen.html"
if [ -f "$OLD_SPECIMEN" ] && [ ! -f "$NEW_SPECIMEN" ]; then
  mv "$OLD_SPECIMEN" "$NEW_SPECIMEN"
  rmdir "$HOME/Downloads/mint-kit" 2>/dev/null || true
fi

# ─── Move cwd MINT.md if it exists ──────────────────────────────
# Best-effort: read product name from first line, derive slug
if [ -f "./MINT.md" ]; then
  # Extract product name from "# Product Name — Design System" header
  product="$(head -1 ./MINT.md | sed 's/^# *//;s/ *—.*//;s/ *--.*//')"
  if [ -n "$product" ]; then
    slug="$(echo "$product" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')"
    if [ -n "$slug" ]; then
      target="$PROJECTS_DIR/$slug"
      mkdir -p "$target"
      if [ ! -f "$target/MINT.md" ]; then
        cp "./MINT.md" "$target/MINT.md"
        echo "Migrated ./MINT.md → $target/MINT.md"
      fi
    fi
  fi
fi
