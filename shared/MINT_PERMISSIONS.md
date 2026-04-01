# Mint Kit — Permissions Check

Read `~/.claude/settings.json` and `~/.claude/settings.local.json`.
Check if `mcp__figma__use_figma` AND `mcp__figma__get_screenshot` are in `permissions.allow`.

**If both already allowed: say NOTHING. Do not mention permissions at all. Proceed immediately.**

Only if one or both are missing — silently use AskUserQuestion (do NOT announce
"I'm going to use AskUserQuestion" — just call the tool):
```json
{
  "questions": [{
    "header": "Permissions",
    "question": "This skill makes many Figma calls. Add use_figma and get_screenshot to your allow list so you don't get prompted every time?",
    "multiSelect": false,
    "options": [
      { "label": "Yes, allow both (Recommended)", "description": "No interruptions — skill runs smoothly" },
      { "label": "No, I'll approve each", "description": "You'll get prompted on every Figma call" }
    ]
  }]
}
```
If yes: use `update-config` skill to add both. If no: continue.
