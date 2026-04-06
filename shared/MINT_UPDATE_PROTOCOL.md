# Mint Kit — Update Protocol

When you change ANY Mint Kit file, follow this protocol to prevent drift between
docs. Every shared doc and skill file has dependencies — changing one without
updating the others creates silent inconsistencies that surface as bugs during
skill runs.

## File Dependency Map

```
MINT_EXAMPLES.md (mirrors formats from all protocol docs)
  ← ASKUSER_API.md (AskUserQuestion structure, Pick+Lock pattern)
  ← CONSULTATION_FLOW.md (progressive grid widths, terminal voice)
  ← FIGMA_API.md (recovery one-liner format, Figma code comments)
  ← MINT_CHECKPOINT.md (checkpoint one-liner format, archive format)
  ← MINT_VERIFICATION.md (verification dispatch format)
  ← mint-system SKILL.md Phase 4 (Figma variable structure)
  ← mint-system SKILL.md § Entry Gate (no-prompt welcome format)
  ← mint-system SKILL.md § Fast Path (MINT.md → Phase 4 format)

MINT_CHECKPOINT.md (session schema + resume protocol)
  → mint-system SKILL.md (resume router, checkpoint one-liners)
  → mint-lib SKILL.md (resume router, checkpoint one-liners)
  → MINT_EXAMPLES.md § checkpoint format

FIGMA_API.md (error recovery + API rules)
  → mint-system SKILL.md (recovery refs, partition boundaries)
  → mint-lib SKILL.md (recovery refs, partition boundaries)
  → MINT_EXAMPLES.md § recovery format

MINT_VERIFICATION.md (verification protocol + checklists)
  → mint-system SKILL.md (verification dispatch point)
  → mint-lib SKILL.md (verification dispatch points)
  → MINT_EXAMPLES.md § verification dispatch format

ASKUSER_API.md (question structure + conviction gates)
  → mint-system SKILL.md (every AskUserQuestion call)
  → mint-lib SKILL.md (every AskUserQuestion call)
  → MINT_EXAMPLES.md § AskUserQuestion structure, Pick+Lock

CONSULTATION_FLOW.md (progressive build pattern)
  → mint-system SKILL.md (Phase 3 specimen builds)
  → MINT_EXAMPLES.md § progressive grid, terminal voice, specimen naming

MINT_UPGRADE.md (upgrade protocol + config management)
  → mint-system SKILL.md (preamble update-check block)
  → mint-lib SKILL.md (preamble update-check block)
  ← VERSION (version source for bin/mint-update-check)
  ← CHANGELOG.md (What's New content for §1 Step 6, §2)
  → MINT_EXAMPLES.md § Update Check Preamble Format

VERSION (semver source of truth)
  → bin/mint-update-check (local version read)
  → CHANGELOG.md (version entries must match)

bin/mint-update-check (version check script)
  ← VERSION (local version)
  → ~/.mint-kit/ state files (cache, snooze, marker)

migrations/ (upgrade migration scripts)
  ← MINT_UPGRADE.md §1 Step 4 (migration runner)

MINT_VOICE.md (tone + posture)
  → mint-system SKILL.md (all user-facing output)
  → mint-lib SKILL.md (all user-facing output)
  → mint-extract SKILL.md (all user-facing output)

MINT_PERMISSIONS.md (setup + cleanup)
  → mint-system SKILL.md (Phase 0)
  → mint-lib SKILL.md (Phase 0a)
  → mint-extract SKILL.md (Phase 0a)

mint-extract SKILL.md (token extraction from any source)
  ← MINT_VOICE.md (tone)
  ← MINT_PERMISSIONS.md (Phase 0 setup)
  ← ASKUSER_API.md (AskUserQuestion calls)
  ← MINT_EXAMPLES.md (format anchors)
  → MINT.md (writes/merges output)
  ← mint-system SKILL.md Phase 5 (MINT.md template format)
```

## Update Checklist — By File

When you modify a file, check every downstream dependency listed below.

### If you change `ASKUSER_API.md`:
- [ ] Update MINT_EXAMPLES.md § AskUserQuestion Structure
- [ ] Update MINT_EXAMPLES.md § Pick + Lock Two-Tab Pattern
- [ ] Grep both skills for `AskUserQuestion` — confirm existing calls still match

### If you change `CONSULTATION_FLOW.md`:
- [ ] Update MINT_EXAMPLES.md § Consultation Flow Progressive Grid Widths
- [ ] Update MINT_EXAMPLES.md § Terminal Voice During Silent Builds
- [ ] Check mint-system Phase 3 specimen sections still align

### If you change `FIGMA_API.md` § Error Handling:
- [ ] Update MINT_EXAMPLES.md § Recovery One-Liner Format
- [ ] Confirm "exact words" examples in FIGMA_API.md are still the authority
- [ ] Grep both skills for "recovery chain" refs — confirm they still make sense

### If you change `FIGMA_API.md` § any other section:
- [ ] Check mint-system partition boundaries still reference correct rules
- [ ] Check mint-lib partition boundaries still reference correct rules
- [ ] If new silent failure patterns: add to § CRITICAL — Things That WILL Fail Silently

### If you change `MINT_CHECKPOINT.md`:
- [ ] Update MINT_EXAMPLES.md § Checkpoint One-Liner Format
- [ ] If session schema changed: update the schema example in MINT_CHECKPOINT.md itself
- [ ] If resume router changed: update resume router sections in BOTH skills
- [ ] If checkpoint points table changed: confirm one-liners in skills match

### If you change `MINT_VERIFICATION.md`:
- [ ] Update MINT_EXAMPLES.md § Verification Dispatch Format
- [ ] If checklist changed: confirm dispatch points in skills reference correct checklist
- [ ] If sub-agent prompt changed: no downstream — it's self-contained

### If you change `mint-system/SKILL.md` Phase 4 (token creation):
- [ ] Update MINT_EXAMPLES.md § Figma Variable Structure
- [ ] Update MINT_VERIFICATION.md § mint-system Verification Checklist
- [ ] If collection structure changed: update MINT_CHECKPOINT.md session schema

### If you change `mint-system/SKILL.md` or `mint-lib/SKILL.md` phases:
- [ ] If phases added/removed/renumbered: update MINT_CHECKPOINT.md checkpoint points tables
- [ ] If new AskUserQuestion calls: confirm they follow ASKUSER_API.md + MINT_EXAMPLES.md format
- [ ] If new use_figma calls: confirm they follow FIGMA_API.md rules + have TARGET comment

### If you change `MINT_EXAMPLES.md`:
- [ ] Confirm the change matches the owning protocol doc (ownership table at top)
- [ ] If it doesn't match: you're updating the WRONG file — update the protocol doc first

### If you change `MINT_UPGRADE.md`:
- [ ] Update MINT_EXAMPLES.md § Update Check Preamble Format
- [ ] If upgrade flow changed: confirm preamble blocks in both SKILL.md files still align
- [ ] If config keys changed: update config table in MINT_UPGRADE.md §3
- [ ] If migration runner changed: confirm migrations/ scripts are compatible

### If you change `VERSION`:
- [ ] Update CHANGELOG.md with entry for the new version
- [ ] Confirm bin/mint-update-check regex still matches the version format

### If you change `bin/mint-update-check`:
- [ ] Confirm output contract matches what SKILL.md preambles expect
- [ ] Confirm state file paths match MINT_UPGRADE.md §3 state files table
- [ ] Run shellcheck on the script

### If you add a file to `migrations/`:
- [ ] Confirm the script is idempotent (safe to run multiple times)
- [ ] Confirm the filename matches `v{VERSION}.sh` format
- [ ] Confirm MINT_UPGRADE.md §1 Step 4 migration runner would pick it up correctly

### If you change `mint-extract/SKILL.md`:
- [ ] If MINT.md output format changed: confirm it still matches mint-system Phase 5 template
- [ ] If new AskUserQuestion calls: confirm they follow ASKUSER_API.md + MINT_EXAMPLES.md format
- [ ] If merge logic changed: confirm it handles all section presence/absence combinations

### If you change `MINT_VOICE.md`:
- [ ] No downstream file updates needed — skills reference it directly
- [ ] But grep both skills for hardcoded tone/voice that should follow the new rules

### If you change `MINT_PERMISSIONS.md`:
- [ ] Check Phase 0 in both skills still aligns
- [ ] If cleanup patterns changed: confirm session file cleanup in MINT_CHECKPOINT.md is compatible

## The Golden Rule

**Protocol docs own the logic. Skills own the workflow. MINT_EXAMPLES.md mirrors
the format. If you're not sure which file to change, change the protocol doc first,
then propagate.**

Never change MINT_EXAMPLES.md alone — it's a mirror. If the mirror is wrong, the
source is wrong. Fix the source, then fix the mirror.

## How To Use This File

1. Before editing any Mint Kit file: read this file's checklist for that file
2. Make your change to the primary file
3. Walk the checklist — open each downstream file and confirm alignment
4. If a downstream file needs updating: update it in the same commit
5. If you're unsure whether something drifted: grep for the specific pattern
   across all files in `~/.claude/skills/mint-kit/`

This protocol is manual. It works because Mint Kit has ~15 files, not 100. If the
file count grows past 20, consider a lint script that checks cross-references.
