# Mint Kit — Permissions Check

Read `~/.claude/settings.json` and `~/.claude/settings.local.json`.

**Specimen directory:** `~/Downloads/mint-kit/` (NOT `/tmp/`). Firefox snap on Ubuntu
cannot read `/tmp/` due to sandbox restrictions. `~/Downloads/mint-kit/` is always
readable by the browser. Cleaned up at skill end (see Cleanup section below).

Before writing any specimens, ensure the directory exists:
```bash
mkdir -p ~/.cache/mint-kit
```

**Required permissions:**
- `mcp__figma__use_figma` — Figma Plugin API calls (Phase 4+ token creation)
- `mcp__figma__get_screenshot` — Figma screenshot verification
- `WebFetch` — fetching Google Fonts CSS for specimen generation
- `WebSearch` — Phase 2 competitive research
- `Write(~/Downloads/mint-kit/*)` — HTML specimen files for exploration phases
- `Bash(xdg-open ~/Downloads/mint-kit/*)` — opening specimens in browser
- `Bash(open ~/Downloads/mint-kit/*)` — opening specimens in browser (macOS)

**Step 1: Silent check.** Read the settings. Check two things:
(a) Is the tool permission mode already `acceptEdits` or higher (auto/bypassPermissions)?
(b) Are Figma permissions (`mcp__figma__use_figma`, `mcp__figma__get_screenshot`)
    already in the allow list?

Do not mention checking permissions.

**Step 2: If acceptEdits is already on AND Figma permissions exist — say nothing,
proceed immediately.**

**Step 3: If acceptEdits is NOT on**, explain why and ask. The preface matters
because you're asking someone to change a global setting:

Output this text before the AskUserQuestion:

> "Quick setup note. Mint Kit builds HTML previews in your browser as we work
> through color, type, and spacing decisions. That means a lot of file writes,
> and by default Claude Code asks permission for each one. With 'accept edits'
> on, those writes happen silently and your browser just refreshes. Without it,
> you'll get an approval prompt every time the specimen updates, which breaks
> the flow. This is a Claude Code setting, not a Mint Kit thing. You can turn
> it off anytime with /permissions."

Then ask:

```json
{
  "questions": [{
    "header": "Permissions",
    "question": "Turn on accept edits for a smoother experience? You can always change this later.",
    "multiSelect": false,
    "options": [
      { "label": "Yes, turn it on (Recommended)", "description": "Specimen writes happen silently. Browser just refreshes." },
      { "label": "No, I'll approve each", "description": "You'll get a prompt on every specimen write." }
    ]
  }]
}
```

If yes: use `update-config` skill to set the permission mode to `acceptEdits`.
If no: continue (the user will be prompted on each write).

**Step 4: If Figma permissions are missing**, ask about those separately:

```json
{
  "questions": [{
    "header": "Figma",
    "question": "This skill makes Figma API calls for token creation in Phase 4. Allow Figma tools so you don't get prompted on each call?",
    "multiSelect": false,
    "options": [
      { "label": "Yes, allow Figma (Recommended)", "description": "No Figma prompts. These permissions persist after the skill." },
      { "label": "No, I'll approve each", "description": "You'll get prompted on every Figma call." }
    ]
  }]
}
```

If yes: use `update-config` skill to add Figma permissions. If no: continue.

---

### Cleanup on Skill Completion

When the skill finishes (Phase 5 complete, or user exits early), do TWO things:

**1. Do NOT change the permission mode back.** If you turned on `acceptEdits`,
leave it on. The user chose it and may want it for other work. Figma permissions
also persist. Do not touch any permissions at cleanup.

**2. Track and clean up THIS SESSION'S specimen files only.**

During the skill run, maintain a list of every specimen file you write. After each
`Write` to `~/Downloads/mint-kit/`, append the filename to an internal list. Example:
```
SESSION_SPECIMENS:
  ~/Downloads/mint-kit/mint-specimen-color-primary.html
  ~/Downloads/mint-kit/mint-specimen-color-neutral.html
  ~/Downloads/mint-kit/mint-specimen-type-display.html
  ...
```

At skill completion, offer cleanup via AskUserQuestion. List the EXACT files:

```json
{
  "questions": [{
    "header": "Cleanup",
    "question": "Your design system is complete. This session created [N] specimen files in ~/Downloads/mint-kit/. These were the color/type/dark-mode previews you saw in your browser. Want to delete them? Only the files from THIS session are removed. [List the filenames.]",
    "multiSelect": false,
    "options": [
      { "label": "Yes, clean up (Recommended)", "description": "Deletes only the [N] files listed above. Nothing else in ~/Downloads/mint-kit/ is touched." },
      { "label": "No, keep them", "description": "The files stay if you want to reference them later." }
    ]
  }]
}
```

If yes: delete ONLY the tracked files, one by one. Do NOT `rm -rf` the directory.
```bash
rm ~/Downloads/mint-kit/mint-specimen-color-primary.html
rm ~/Downloads/mint-kit/mint-specimen-color-neutral.html
# ... each file explicitly
```
If the directory is empty after deletion, remove it: `rmdir ~/Downloads/mint-kit/ 2>/dev/null`

If no: do nothing.
