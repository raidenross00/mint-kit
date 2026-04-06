# Mint Kit — Session Checkpointing

Persistent crash recovery for long-running Mint Kit skills. A 30-minute
mint-system run with zero crash recovery means a Phase 4 crash = total loss.
This protocol fixes that.

## Session File Location

```
~/.mint-kit/projects/{project-slug}/{skill}-session.json
```

**Project slug** = derived from the product name (from MINT.md header `# [Product Name]`
or from the user's prompt if no MINT.md yet). Sanitize: lowercase, replace spaces with
hyphens, strip non-alphanumeric except hyphens. This matches the slug used for
`~/.mint-kit/projects/{slug}/MINT.md`.

Example: if the product is "Tales from the Moss-Top Tavern", the session file is:
```
~/.mint-kit/projects/tales-from-the-moss-top-tavern/mint-system-session.json
```

## Session File Schema

```json
{
  "skill": "mint-system",
  "version": 1,
  "startedAt": "2026-04-06T10:30:00Z",
  "updatedAt": "2026-04-06T11:15:00Z",
  "figmaFileKey": "abc123def456",
  "currentPhase": "3b-ii",
  "completedPhases": ["0", "1", "2", "3a", "3b-i"],
  "decisions": {
    "product": { "type": "marketing-site", "name": "Tavern" },
    "vibeLock": { "emotion": ["bold", "warm"], "temperature": "warm", "locked": true },
    "colors": {
      "primary": { "hero": "#E85D2C", "locked": true },
      "neutral": { "hero": "#1A1A2E", "locked": true },
      "accent": null,
      "semantics": null
    },
    "fonts": {
      "display": { "family": "Tektur", "locked": true },
      "body": null,
      "data": null
    },
    "textColors": null,
    "spacing": null,
    "darkMode": null
  },
  "figmaState": {
    "collections": {
      "Brand": { "id": "VariableCollectionId:1234", "variableCount": 45 },
      "Alias": { "id": "VariableCollectionId:5678", "variableCount": 22 }
    },
    "variableKeys": {
      "primary-500": "variableKey:abc",
      "neutral-500": "variableKey:def"
    },
    "textStyleIds": {
      "Display/Hero": "S:abc123"
    },
    "effectStyleIds": {
      "Elevation/md": "S:def456"
    }
  }
}
```

**Key rules:**
- Use VariableKeys (not IDs) for all Figma variable references — keys survive across sessions
- `null` = not yet decided. Empty object = decided but no values (e.g., accent skipped)
- `locked: true` = user approved this decision, do not re-ask
- `currentPhase` = where to resume. `completedPhases` = what to skip

## Resume Router Protocol

On skill start, BEFORE permissions or context gathering:

```
1. Derive project-slug from product name (from MINT.md or user prompt)
2. Check if session file exists at ~/.mint-kit/projects/{slug}/{skill}-session.json
3. If no file → proceed fresh (no checkpoint mention to user)
4. If file exists but updatedAt > 24h ago → proceed fresh (stale session)
5. If file exists and < 24h old → read it, offer resume
```

**Resume offer (AskUserQuestion):**
```json
{
  "questions": [{
    "header": "Resume",
    "question": "Found a session from [time ago]. You were at [currentPhase description]. Locked decisions: [list locked items]. Resume from there or start fresh?",
    "multiSelect": false,
    "options": [
      { "label": "Resume (Recommended)", "description": "Pick up at [phase]. All locked decisions preserved." },
      { "label": "Start fresh", "description": "Ignore the saved session. Every decision from scratch." }
    ]
  }]
}
```

**On resume:**
1. Load all `decisions` — treat locked values as already approved
2. Load `figmaState` — use stored keys/IDs for Figma references
3. Skip all phases in `completedPhases`
4. Jump directly to `currentPhase`
5. Tell the user: "Resuming at [phase]. Your locked decisions: [summary]."

**On fresh start:**
1. Delete the session file (or overwrite on first checkpoint write)
2. Proceed normally through Phase 0

## Checkpoint Write Protocol

After every major decision or phase completion, update the session file.

**What triggers a checkpoint write:**
- Phase completion (Phase 0 done, Phase 1 done, etc.)
- Sub-phase decision lock (vibe lock approved, primary color locked, etc.)
- Figma creation step completion (collection created, variables written, etc.)
- DNA component approval (mint-lib)
- Tier completion (mint-lib)

**How to write:**
```
1. Read current session file (or create fresh if first write)
2. Update: currentPhase, completedPhases, relevant decisions/figmaState
3. Set updatedAt to current ISO timestamp
4. Write via the Write tool to the session file path
```

**NEVER announce checkpoint writes to the user.** No "Checkpoint saved!", no
"Progress saved!", no status messages. The Write tool call to the session file
is the only visible artifact — the user sees it as a normal file write in their
diff output if they're watching, but you say nothing about it. Checkpoints are
silent infrastructure, not a feature the user interacts with.

**One-liner format in skills:** Each checkpoint write in a skill file is a single
reference line, not the full protocol. Format:

```
**Checkpoint:** Update session — `decisions.colors.primary` locked, phase `3b-i` complete.
```

The skill reads this doc for the full write protocol. The one-liner says WHAT changed.

**Error handling for writes — CRITICAL:**
Session file writes can fail (disk full, permission denied). This failure would be
SILENT — no crash, but no recovery either. Every checkpoint write MUST:
1. Attempt the Write tool call
2. If the write fails, warn the user: "Checkpoint save failed — your progress
   won't survive a crash. Check disk space / permissions at ~/.mint-kit/projects/"
3. Continue the skill regardless — a failed checkpoint is NOT a blocker

Do NOT retry checkpoint writes. Warn once, move on.

## Checkpoint Read on Resume — Error Handling

The session file might be corrupted (partial write from a crash). On resume:
1. Attempt to read and parse the JSON
2. If parse fails: warn user "Session file is corrupted. Starting fresh."
3. Delete the corrupted file and proceed as fresh start
4. NEVER crash the skill because of a bad session file

## Completion Protocol

When a skill completes successfully:
1. Rename session file: `{skill}-session.json` → `{skill}-session.done`
2. The `.done` file is kept forever (no cleanup) — useful for debugging
3. A new run will not find a `.json` file, so it starts fresh automatically

## Context Hygiene (Context Budget Awareness)

Long-running skills accumulate context: old specimen HTML, Phase 1-3 conversation
history, intermediate research. By Phase 4, most of this is dead weight.

**At checkpoint boundaries, follow these rules:**

1. **All locked decisions are in the session file.** Do not re-read old specimens
   or conversation history to recover decisions. Read the session file instead.

2. **Before Phase 4 (mint-system) or before auto-generation (mint-lib):** Summarize
   all prior decisions into a compact reference block (< 300 words). This is the
   "context checkpoint" — everything the remaining phases need, nothing they don't.

3. **Never re-read specimen HTML files** after a decision is locked. The specimen
   was a tool for deciding. The decision is in the session file. The specimen is
   now dead context.

4. **Research results (competitive analysis, font lists) are spent.** They informed
   decisions that are now locked. Do not re-read FONT_KNOWLEDGE_BASE.md or web
   search results after fonts are locked.

5. **Figma IDs from the session file are authoritative.** Do not re-query Figma
   for collection IDs or variable IDs that are already in `figmaState`. Use the
   stored values directly.

**The goal:** By Phase 4, context should contain: the session file summary, the
skill instructions, and the current phase's work. Not the full history of how
decisions were made.

## mint-system Checkpoint Points

| Phase | Checkpoint trigger | Session fields updated |
|-------|-------------------|-----------------------|
| 0 | Permissions done | `completedPhases: ["0"]` |
| 1 | Context wizard done | `decisions.product`, `completedPhases: ["0","1"]` |
| 2 | Research done | `completedPhases` += `"2"` |
| 3a | Vibe locked | `decisions.vibeLock`, `completedPhases` += `"3a"` |
| 3b-i | Primary locked | `decisions.colors.primary` |
| 3b-ii | Neutral locked | `decisions.colors.neutral` |
| 3b-iii | Semantics locked | `decisions.colors.semantics` |
| 3b-iv | Accent locked/skipped | `decisions.colors.accent` (empty obj if skipped) |
| 3c-i | Display font locked | `decisions.fonts.display` |
| 3c-ii | Body font locked | `decisions.fonts.body` |
| 3c-iii | Data font locked | `decisions.fonts.data` |
| 3d | Text colors locked | `decisions.textColors` |
| 3e | Spacing locked | `decisions.spacing` |
| 4 (per step) | Each token creation step | `figmaState` updated with new IDs/keys |
| 5 | MINT.md written | Archive to `.done` |

## mint-lib Checkpoint Points

| Phase | Checkpoint trigger | Session fields updated |
|-------|-------------------|-----------------------|
| 0 | Setup complete (MINT.md found, file created, tokens imported) | `completedPhases: ["0"]` |
| 1-Button | Button DNA approved + patterns locked | `decisions.dna.button`, `figmaState` |
| 1-Input | Input DNA approved + patterns locked | `decisions.dna.input`, `figmaState` |
| 1-Card | Card DNA approved + patterns locked | `decisions.dna.card`, `figmaState` |
| 2 | Pattern lock written to MINT.md | `completedPhases` += `"2"` |
| 3 | Tier 1 atoms complete | `completedPhases` += `"3"`, `figmaState` |
| 4 | Tier 2 molecules complete | `completedPhases` += `"4"`, `figmaState` |
| 5 | Tier 3 organisms complete | `completedPhases` += `"5"`, `figmaState` |
| 6 | Tier 4 templates complete | `completedPhases` += `"6"`, `figmaState` |
| 7 | Polish + publish done | Archive to `.done` |
