# Mint Kit — Verification Protocol

Independent verification of Figma state against intended state. The implementer
is an LLM — it has the same blind spots for its own work that humans do. Verification
MUST be independent: a separate agent reading Figma fresh, not the same context
that created the tokens.

## When to Verify

| Skill | Trigger | What to check |
|-------|---------|---------------|
| mint-system | After Phase 4 (all token creation), before Phase 5 | Collections, variables, modes, aliases, text styles, effect styles |
| mint-lib | After each DNA token reconciliation (Step 6) | New Brand/Alias/Role variables written back correctly |
| mint-lib | After each auto-gen tier | Components exist, token binding count, no hardcoded values |

## Primary Method: Sub-Agent Verification

Spawn an independent Agent (via the Agent tool) to verify. The sub-agent has
no context from the creation process — it reads MINT.md and Figma independently.

### Sub-Agent Prompt Template

```
You are a verification agent for Mint Kit. Your job is to compare the INTENDED
design system state (from MINT.md) against the ACTUAL Figma state.

**Step 1: Read MINT.md** at `~/mint-kit/projects/{slug}/MINT.md`
Extract: all token names, values, collection structure, text styles, effect styles.

**Step 2: Read Figma file** {fileKey} using use_figma:
```javascript
// VERIFICATION — read-only, no mutations
// TARGET: {target} file (fileKey: {fileKey})
const collections = figma.variables.getLocalVariableCollections();
const allVars = [];
for (const col of collections) {
  const vars = col.variableIds.map(id => {
    const v = figma.variables.getVariableById(id);
    return { name: v.name, type: v.resolvedType, collectionName: col.name };
  });
  allVars.push(...vars);
}
const textStyles = figma.getLocalTextStyles();
const effectStyles = figma.getLocalEffectStyles();

return {
  collections: collections.map(c => ({
    name: c.name,
    id: c.id,
    modes: c.modes.map(m => m.name),
    variableCount: c.variableIds.length
  })),
  variables: allVars,
  textStyles: textStyles.map(s => ({ name: s.name, fontName: s.fontName, fontSize: s.fontSize })),
  effectStyles: effectStyles.map(s => ({ name: s.name }))
};
```

**Step 3: Compare and report.**

Check these specific things:
{verificationChecklist}

Report format:
- **PASS**: Everything matches. List counts: N collections, N variables, N text styles, N effect styles.
- **WARN**: Minor discrepancies (naming differences, extra variables). List each.
- **FAIL**: Missing collections, missing variables, wrong mode structure, broken aliases. List each with what's expected vs actual.

Be specific. "3 variables missing" is useless. "Brand/Color/primary-700, Brand/Color/primary-800, Brand/Color/primary-900 are missing from the Brand collection" is useful.
```

### mint-system Verification Checklist

```
- 4 collections exist: Brand, Alias, Map, Responsive
- Brand has 1 mode (Default)
- Map has 2 modes: Light and Dark
- Responsive has 2 modes: Desktop and Mobile
- Brand variable count matches MINT.md token tables (typically 50-70)
- All Brand/Color/* variables from MINT.md exist with correct names
- All Brand/Space/* variables exist
- All Alias/* variables exist and reference Brand variables (not hardcoded values)
- Text Styles exist for all entries in MINT.md "Text Styles" table
- Text Style font families match MINT.md font declarations
- Effect Styles exist for all entries in MINT.md "Elevation" table
- No duplicate variable names within a collection
- No orphaned variables (in Figma but not in MINT.md)
```

### mint-lib Verification Checklist (DNA reconciliation)

```
- New Role/* variables exist in the correct collection
- New Brand/* variables (discovered during DNA) exist
- New Alias/* variables (component semantics) exist
- Variable values match what was decided during DNA exploration
- No duplicates of existing mint-system variables
```

### mint-lib Verification Checklist (tier completion)

```
- Expected component count for the tier matches actual
- Components use variant properties (not separate component sets)
- Bound variable count > 0 for each component (no fully hardcoded components)
- Hardcoded fill/stroke count = 0 (target, flag if > 0)
- Text nodes use Text Styles (not unstyled text)
```

## Fallback: Inline Verification

If the Agent tool is unavailable or the sub-agent fails to spawn, fall back to
inline verification. This is the SAME verification the skill was already doing
(mint-system lines 2192-2227), but with the structured checklist above.

**Inline verification is weaker** — the same LLM context that created the tokens
is checking its own work. But it's better than nothing.

```javascript
// INLINE VERIFICATION — read-only
// TARGET: mint-system file (fileKey: ...)
const variables = figma.variables.getLocalVariables();
const textStyles = figma.getLocalTextStyles();
const effectStyles = figma.getLocalEffectStyles();

const collections = {};
for (const v of variables) {
  const col = figma.variables.getVariableCollectionById(v.variableCollectionId);
  if (!collections[col.name]) collections[col.name] = { modes: col.modes.map(m => m.name), vars: [] };
  collections[col.name].vars.push({ name: v.name, key: v.key, type: v.resolvedType });
}

return {
  collections: Object.entries(collections).map(([name, data]) => ({
    name, modes: data.modes, variableCount: data.vars.length
  })),
  variables: Object.values(collections).flatMap(c => c.vars),
  textStyles: textStyles.map(s => ({ name: s.name, key: s.key, fontName: s.fontName, fontSize: s.fontSize })),
  effectStyles: effectStyles.map(s => ({ name: s.name, key: s.key }))
};
```

Run the checklist manually against the returned data. Report discrepancies
using the same PASS / WARN / FAIL format.

## Handling Verification Results

**PASS:** Proceed to next phase. Log verification result in checkpoint.

**WARN:** Tell the user what's different. Proceed unless the warning suggests
data loss (e.g., "12 extra variables in Figma not in MINT.md" is fine —
they might be from a previous run. "MINT.md lists 45 variables but Figma
has 33" is a FAIL, not a WARN).

**FAIL:** Do NOT proceed. Report the specific failures to the user:
```
"Verification found 3 issues:
1. Map collection missing Dark mode (only has Light)
2. Brand/Color/primary-800 and primary-900 missing
3. Text Style 'Display/Hero' has font 'Inter' but MINT.md says 'Tektur'

I'll fix these before continuing."
```

Fix the issues (create missing variables, correct values), then re-verify.
Max 2 fix-and-reverify cycles. If still failing after 2 cycles, checkpoint
and escalate to the user.

## Verification and Checkpoints

After verification passes, update the session checkpoint:
```json
{
  "verification": {
    "phase": "4",
    "result": "PASS",
    "counts": { "collections": 4, "variables": 62, "textStyles": 9, "effectStyles": 4 },
    "timestamp": "ISO"
  }
}
```

This lets a resumed session know that verification already passed for a given phase.
