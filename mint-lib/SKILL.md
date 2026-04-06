---
name: mint-lib
description: Build a complete component library from a /mint-system design system. Conversational DNA phase (Button, Input, Card) explored via HTML specimens with real hover/focus states. Final components are built in Figma with full variant systems and token binding. ~117 components across 4 tiers.
---

## Preamble (run first, silently)

```bash
_UPD=$(~/.claude/skills/mint-kit/bin/mint-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
```

**If output starts with `JUST_UPGRADED`:** Read `shared/MINT_UPGRADE.md` §2. Show What's New, then continue.
**If output starts with `UPGRADE_AVAILABLE`:** Read `shared/MINT_UPGRADE.md` §1. Follow inline upgrade flow.
**If no output:** Continue normally. Say nothing about updates.

# /mint-lib — Component Library Builder

Build a complete, production-quality component library through conversation. The 3 DNA
components (Button, Input, Card) are explored via HTML specimens with real hover/focus
states. You pick, refine, and approve each direction. Final components are built in
Figma with full variant systems and token binding. Patterns are extracted and confirmed.
Then ~117 remaining components are auto-generated from those patterns — all token-bound
to your /mint-system design system.

Part of the **Mint Kit** series:
1. `/mint-system` — tokens, variables, MINT.md
2. **`/mint-lib`** — component library (you are here)
3. `/mint-surface` — backgrounds, patterns, decorative treatments
4. `/mint-icons` — icon system
5. `/mint-screens` — full page layouts

## Voice + Posture — MANDATORY

Read and follow all rules in `~/.claude/skills/mint-kit/shared/MINT_VOICE.md`.

## Token Ownership — What mint-lib Discovers

mint-system creates Brand (raw primitives) and Alias (semantic mappings).
mint-lib creates the **Role** layer and discovers **component-level tokens** during
the DNA phase:

**mint-lib discovers and creates:**
- Border-radius values (what "interactive radius" vs "container radius" means)
- Border-weight values (thin/medium/thick stroke choices for components)
- Input heights (sm/md/lg sizing)
- Icon gap (space between icon and label)
- Component-specific padding (button padding, input padding, card padding)
- ALL Role/* variables (Role/button/*, Role/input/*, Role/card/*, etc.)

**After the DNA phase, mint-lib writes these back to:**
1. The mint-system Figma file (new Brand + Alias + Role variables)
2. MINT.md (new token tables appended to the Component Tokens section)

MINT.md is a living document. mint-system writes the initial version.
mint-lib appends component patterns and tokens it discovers.

---

## AskUserQuestion API — How To Use It

Read and follow all rules in `~/.claude/skills/mint-kit/shared/ASKUSER_API.md`.

---

## Consistency Anchors

Read `~/.claude/skills/mint-kit/shared/MINT_EXAMPLES.md` for exact formats that
MUST be identical across all Mint Kit skills (AskUserQuestion structure, checkpoint
format, specimen naming, terminal voice, Pick+Lock pattern, verification dispatch).

## Figma Plugin API Reference

Read and follow all rules in `~/.claude/skills/mint-kit/shared/FIGMA_API.md`.

### Partition Boundaries for mint-lib

See FIGMA_API.md for the global "try first, split on failure" rule.

Exploration specimens (DNA Phase Step 2) use HTML preview pages — no Figma calls.

If you DO need to split auto-generation tiers:
- Batch by component complexity: simple atoms together, complex organisms individually
- Token binding calls separate from frame creation calls

---

## Session Checkpointing + Crash Recovery

Read and follow `~/.claude/skills/mint-kit/shared/MINT_CHECKPOINT.md`.

This skill persists state to `~/mint-kit/projects/{project-slug}/mint-lib-session.json`
after every DNA component approval, pattern lock, and tier completion. If the skill
crashes, the user can resume without re-making decisions.

**Context hygiene:** Before auto-generation (Phase 3+), all DNA decisions are in the
session file. Summarize DNA into a compact reference block (< 300 words) and stop
re-reading old specimen HTML or exploration history. See MINT_CHECKPOINT.md § Context Hygiene.

---

## Resume Router

**This runs BEFORE Phase 0.** On skill start:

1. Check for session files at `~/mint-kit/projects/*/mint-lib-session.json`
2. If a session matches context from the user's prompt, use that slug
3. If no file, or file is > 24h old → skip to Phase 0 (fresh start)
4. If file exists and < 24h old → read it, parse JSON
5. If JSON parse fails → warn "Session file corrupted, starting fresh", delete file, skip to Phase 0
6. Offer resume via `AskUserQuestion`:
   ```json
   {
     "questions": [{
       "header": "Resume",
       "question": "Found a session from [time ago]. You were at [currentPhase description]. DNA status: [Button: done/pending, Input: done/pending, Card: done/pending]. Resume or start fresh?",
       "multiSelect": false,
       "options": [
         { "label": "Resume (Recommended)", "description": "Pick up at [phase]. All completed DNA and tiers preserved." },
         { "label": "Start fresh", "description": "Ignore the saved session. Start from setup." }
       ]
     }]
   }
   ```
7. **On resume:** Load decisions + figmaState from session. Skip all `completedPhases`. Jump to `currentPhase`. Tell user: "Resuming at [phase]. Completed: [summary]."
8. **On fresh:** Delete session file, proceed to Phase 0.

---

## Phase 0: Setup

### 0a: Permissions

This is mint-lib. It makes Figma calls to build components across 4 tiers.
The 50K character limit per `use_figma` call fits ~30 components per call.
Do NOT batch conservatively (2-3 per call). Pack as many as will fit. A full
tier of 27 atoms should be 1-2 calls, not 14. DNA exploration uses HTML
specimens, not Figma. Figma calls are only for final component creation.
Read and follow `~/.claude/skills/mint-kit/shared/MINT_PERMISSIONS.md`. Use "Mint Lib" as the skill name.
If yes: use `update-config` skill to add both. If no: continue.

### 0b: Find and Select MINT.md

Search for MINT.md files in `~/mint-kit/projects/`. List all subdirectories — each
one contains a MINT.md. Read the first line of each to get the product name.

**If 0 found:** "No MINT.md found. Run /mint-system or /mint-extract first to create your design system."

**If 1 found:** Use automatically. "Found MINT.md for [product] at ~/mint-kit/projects/{slug}/MINT.md. Using this."

**If 2+ found:** Read first ~20 lines of each for project name + aesthetic. Use
`AskUserQuestion` to let user pick (options in question text, action-based selectable).

**After selection, extract and hold:**
- All Brand token names and values
- All Alias token mappings
- All Text Style definitions
- All Effect Style definitions
- Aesthetic direction and shape language
- Figma source file URL (extract fileKey — this is the **source fileKey**)

### 0c: Get Component Library File

**Cross-file fileKey protocol:** This skill works with TWO Figma files:
- **Source file** = mint-system file (where tokens live) — source fileKey from MINT.md
- **Target file** = component library file (where components go) — target fileKey

Every `use_figma` call MUST have a comment at the top stating which file:
```javascript
// TARGET: component library file (fileKey: xyz789)
```
or
```javascript
// TARGET: mint-system file (fileKey: abc123)
```

The component library MUST be in the same Figma team project as the mint-system file.

**IMPORTANT: This is a SEPARATE file from your mint-system foundations file.**
Your tokens live in the foundations file. Your components will live in the library
file. They're separate so teams can publish them independently. Do NOT reuse the
same Figma file URL from mint-system.

Use AskUserQuestion:
```json
{
  "questions": [{
    "header": "Library file",
    "question": "Components go in a SEPARATE Figma file from your token foundations. This keeps tokens and components independently publishable. The library file must be in the same team project as your foundations file so it can import your tokens. Got a file ready, or should I create one?",
    "multiSelect": false,
    "options": [
      { "label": "Create one for me (Recommended)", "description": "I'll make a new file called '[System Name] Components' in your workspace." },
      { "label": "I have a file", "description": "I'll paste the URL. Must be in the same team project as your foundations file." }
    ]
  }]
}
```

- If "I have a file": wait for URL, extract target fileKey
- If "Create in my Drafts": call `mcp__figma__whoami` for planKeys, then `create_new_file`.
  Then require user to move it with another AskUserQuestion:
  ```json
  {
    "questions": [{
      "header": "Move file",
      "question": "Created! Now move it to the same team project as your mint-system file. Right-click the file in Figma → 'Move to project' → select the right project. Let me know when it's done.",
      "multiSelect": false,
      "options": [
        { "label": "Done, it's moved", "description": "File is in the right team project now" },
        { "label": "I need help", "description": "Walk me through moving the file" }
      ]
    }]
  }
  ```
  Do NOT proceed until confirmed.

### 0d: Import Tokens from mint-system

**Step 1: Read keys from the mint-system file BY COLLECTION (source fileKey).**

A mint-system file has 100+ variables across Brand, Alias, and Map collections.
`getLocalVariables()` dumps everything and gets TRUNCATED in the MCP response.
Instead: read collections first (tiny response), then read variables per collection.

**Call 1 — Get collections + styles (small response):**
```javascript
// TARGET: mint-system file (fileKey: abc123)
const collections = figma.variables.getLocalVariableCollections();
const textStyles = figma.getLocalTextStyles();
const effectStyles = figma.getLocalEffectStyles();

return {
  collections: collections.map(c => ({
    name: c.name, id: c.id, variableCount: c.variableIds.length
  })),
  textStyles: textStyles.map(s => ({ name: s.name, key: s.key, id: s.id })),
  effectStyles: effectStyles.map(s => ({ name: s.name, key: s.key, id: s.id }))
};
```

**Call 2+ — Get variables per collection (one call per collection):**
```javascript
// TARGET: mint-system file (fileKey: abc123)
// Repeat this call for EACH collection ID from Call 1
const collection = figma.variables.getVariableCollectionById("COLLECTION_ID_HERE");
const vars = collection.variableIds.map(id => {
  const v = figma.variables.getVariableById(id);
  return { name: v.name, key: v.key, id: v.id, type: v.resolvedType };
});
return { collection: collection.name, variables: vars };
```

This splits a 100+ variable dump into 2-3 focused reads (~30-50 variables each).
If a collection is still too large, the response includes enough data to retry
with a subset of variableIds.

**Step 2: Import into the component library file (target fileKey):**
```javascript
// TARGET: component library file (fileKey: xyz789)
const imported = {};
const failed = [];

for (const { name, key } of allVariableKeys) {
  try {
    const v = await figma.variables.importVariableByKeyAsync(key);
    imported[name] = v.id;
  } catch (e) {
    failed.push({ name, key, error: e.message });
  }
}

for (const { name, key } of allTextStyleKeys) {
  try {
    const s = await figma.importStyleByKeyAsync(key);
    imported[`style:${name}`] = s.id;
  } catch (e) {
    failed.push({ name, key, error: e.message });
  }
}

for (const { name, key } of allEffectStyleKeys) {
  try {
    const s = await figma.importStyleByKeyAsync(key);
    imported[`effect:${name}`] = s.id;
  } catch (e) {
    failed.push({ name, key, error: e.message });
  }
}

return { importedCount: Object.keys(imported).length, failedCount: failed.length, failed, imported };
```

**If ANY imports fail:** The library likely isn't published or the files aren't
in the same team project. Use `AskUserQuestion`:
> **[N] tokens failed to import.** This means either:
> 1. Your mint-system file isn't published as a team library
> 2. This file isn't in the same team project
>
> **To publish:** Open mint-system → Figma icon → Libraries → Publish
> **To check project:** Both files must be in the same team project (not Drafts)
>
> A) Fixed — try import again
> B) I need help troubleshooting

**If all imports succeed:** Store all imported variable IDs, Text Style IDs,
and Effect Style IDs. Components reference these — never create local color/spacing
variables for things that exist in mint-system.

**Note expected gaps:** mint-system does NOT have Role variables or component-level
tokens. That's normal — mint-lib creates those during the DNA phase.

Use `AskUserQuestion` to confirm setup:
> **Setup complete.** Imported [N] Brand variables, [N] Alias variables,
> [N] Text Styles, [N] Effect Styles from your mint-system library.
>
> **Expected gaps:** No Role tokens exist yet — that's by design. The DNA phase
> builds 3 foundation components (Button → Input → Card) and discovers what
> component-level tokens are needed. Those get written back to your design system.
>
> RECOMMENDATION: Choose A — Button forces every interactive pattern to be solved first.
>
> A) Start with Button (recommended — solves interactive patterns first)
> B) Start with Input (if forms are the core of your product)
> C) Start with Card (if content display is the core)

---

## Phase 1: The DNA (Button → Input → Card)

The most important phase. The 3 DNA components establish every pattern that 117
components inherit. Rushing this ruins everything downstream.

**Process each DNA component sequentially.** Complete Button fully before starting
Input. Complete Input fully before starting Card. Each component follows ALL 9 steps.

### Step 1: MINT.md Audit

Before proposing visual options, map out how MINT.md applies to this component:

**For Button:**
- Which Alias tokens map to button fills, text, hover states?
- What does the spacing scale imply for button padding? (Don't assume — explore)
- What does the shape language say about interactive element geometry?
- What Text Styles map to button labels at each size?
- What Effect Styles apply (focus ring exists? elevation on hover?)
- What's MISSING that we'll need to discover?

**For Input:**
- What Alias tokens map to input fills, strokes, text, states?
- What does the color system provide for error/success/warning?
- What Text Styles map to labels, placeholder, helper text, error text?
- Focus ring treatment — does an Effect Style exist?

**For Card:**
- What Alias tokens map to card fills, strokes, surface layering?
- What does the elevation system provide? Which Effect Styles?
- How does spacing handle internal card padding, header/body/footer?
- Surface layering: surface → surface-raised → surface-overlay

Present the audit via `AskUserQuestion`:
> **[Component] — Token Audit**
>
> Before I build options, here's how your design system maps to [Component]:
>
> **Tokens that exist:** [list with values]
> **Tokens we'll need to discover:** [list — these get created after you approve a direction]
> **My interpretation:** [how the spacing/color/shape systems apply — plain language]
>
> RECOMMENDATION: Choose A if my reading is correct.
>
> A) That's right — show me the 5 directions
> B) Almost — let me correct something
> C) I want to see the full token mapping first

### Step 2: Build 4 Directions

**CRITICAL — Direction Divergence:** Each direction must be a genuinely different
PHILOSOPHY about how this component should look and feel. NOT a minor variation in
padding or color.

**The 4 directions must use DIFFERENT structural approaches.**
If the aesthetic is "premium minimal", do NOT propose 4 rounded buttons with slightly
different padding. Instead:
- Direction A: the expected category choice (e.g., subtle radius, solid fill, clean)
- Direction B: a different structural approach entirely (e.g., sharp rectangles,
  thick borders, no fill on secondary — brutalist contrast)
- Direction C: a surprising treatment (e.g., left-accent-bar for active state,
  asymmetric padding, editorial feel)
- Direction D: a wild card that breaks convention (e.g., underline-only for ghost,
  outline with fill on hover inversion, oversized padding)

**Self-check before presenting:** Look at all 4 side by side. If a non-designer
would say "these all look kinda similar," you failed. The directions should be
obviously different at a glance — different visual weight, different structural
logic, different personality.

**BREAK from mint-system's tokens during exploration.** The shape language in MINT.md
is a starting point, not a constraint. If MINT.md says "rounded", one direction should
explore what sharp or mixed-radius looks like. If the spacing scale suggests 8px padding,
one direction should try 16px or 4px. The whole point of DNA exploration is to discover
what works — not to apply predetermined values.

**Per-component divergence axes:**

For Button — vary these across directions:
- Shape: pill vs. sharp vs. subtle radius vs. squircle
- Border: no border vs. thick stroke vs. thin stroke vs. accent bar
- Fill strategy: solid vs. outline vs. ghost vs. gradient
- Hover: darken vs. elevate vs. invert vs. underline
- Secondary: outline variant vs. tinted bg vs. text-only vs. border-left accent

For Input — vary these:
- Border: full border vs. bottom-only vs. thick left accent vs. subtle shadow
- Focus: ring vs. border color change vs. label animation vs. fill change
- Label: above vs. floating vs. inline-left vs. placeholder-only
- Shape: rounded vs. sharp vs. pill vs. underline-only (no box)

For Card — vary these:
- Surface: elevated (shadow) vs. outlined vs. filled vs. flush (no visible boundary)
- Radius: none vs. subtle vs. large vs. mixed (large top, sharp bottom)
- Header: same surface vs. distinct bg vs. accent bar vs. oversized type
- Hover: lift vs. border change vs. fill shift vs. scale

**First:** Build all 4 as an HTML preview (see HTML Specimen Generation below).
**Then:** Present AskUserQuestion with the directions AS the options:

```json
{
  "questions": [{
    "header": "Direction",
    "question": "All 4 [Component] directions are in the HTML preview in your browser. Compare them side-by-side — which direction feels right, or mix and match elements from different ones?",
    "multiSelect": false,
    "options": [
      { "label": "[Dir A name] (Recommended)", "description": "[Philosophy in one sentence]. Best matches your [aesthetic] direction." },
      { "label": "[Dir B name]", "description": "[Philosophy in one sentence]." },
      { "label": "[Dir C name]", "description": "[Philosophy in one sentence]." },
      { "label": "[Dir D name]", "description": "[Philosophy in one sentence]." }
    ]
  }]
}
```

User can pick one, type "mix A's radius with C's border treatment", or ask for more.

**For Button — each direction shows a REPRESENTATIVE set (~40-50 instances):**
- Types: Primary, Secondary, Ghost, Destructive, Link
- States: Default, Hover, Active, Focus, Disabled, Loading
- Sizes: SM, MD, LG
- With icon / without icon (MD size only — don't multiply everything)
- Icon-only (MD size only)

Do NOT try to show every permutation (that's 300+ instances). Show enough to
evaluate the philosophy: all types in default state at all sizes, then all states
for Primary MD, then icon variants for Primary MD.

#### HTML Specimen Generation — Component Directions

Write to `~/mint-kit/mint-specimen-{component}-directions.html`.
Open in browser: `xdg-open` (Linux) or `open` (macOS).
On iteration: overwrite, re-open.

HTML structure:
- Google Fonts loaded via `<link>` (locked display + body fonts from MINT.md)
- 4-column CSS grid, one column per direction
- Each column labeled A/B/C/D with direction name
- REAL INTERACTIVE STATES via CSS:
  - :hover, :active, :focus-visible, :disabled pseudo-classes
  - CSS transitions for hover effects
  - tabindex="0" on interactive elements for keyboard focus testing
  - cursor: pointer on buttons, not-allowed on disabled
- Use MINT.md token VALUES as starting point but DIVERGE for each direction's
  philosophy — different radius, padding, border treatment, shadow behavior

**Button grid layout per direction column:**
- Section 1: All types x Default state x All sizes (15 buttons)
- Section 2: Primary x All states x MD only (6 buttons — CSS handles hover/active/focus)
- Section 3: All types x Hover state x MD only (5 buttons)
- Section 4: Icon variants x Primary x MD (with-icon, icon-only)

**For Input — each direction shows (~40-50 instances):**
- Types: Text, Search (with icon), Select trigger
- States: Empty, Placeholder, Filled, Focus, Error, Success, Disabled
- Decorations: Prefix icon, Suffix icon, Prefix text ("https://")
- Label positions: Above (standard), Floating (if direction uses it)
- Helper text and error text samples

**For Card — each direction shows:**
- Variants: Elevated (shadow), Outlined (border), Filled (surface color)
- Slots: Header+Body, Header+Body+Footer, With media placeholder
- One interactive card (hover state)
- Compact vs. default density

### Step 3: User Picks Direction

They might:
- Pick one → proceed to Step 4
- Combine → build hybrid as new frame, ask again:
  > **[Component] — Hybrid**
  >
  > Built the hybrid combining [X] with [Y]. Frame "F: Hybrid" on the same page.
  >
  > A) That's the one — refine it
  > B) Close but needs tweaks (tell me what)
  > C) Go back to the originals
- Ask for more → build more, ask again
- Hate everything → dig into what's wrong:
  > **[Component] — Let's reset.** Which is closest to what you're imagining?
  >
  > A) None — I have a reference (share URL or description)
  > B) [Closest] was close but [specific thing] is wrong
  > C) All 5 share this issue: [describe]
  > D) I want something completely different

**Never assume approval.** Wait for explicit confirmation.

### Step 4: Build Refined Version

Take the approved direction and build the complete Figma component set with native
variants.

**BEFORE building: Variant Deduplication Check.**
For each planned variant, ask: "Is this visually distinguishable from another variant
at a glance?" If two variants would look identical or nearly identical, collapse them.

Common traps:
- **Link type doesn't need SM/MD/LG** — links are text, not sized containers. One size.
- **Ghost and Link may be redundant** — if both are text-only with no fill, merge them
  or make the distinction clear (e.g., ghost has hover fill, link has underline).
- **Disabled + Loading may look the same** — if both just reduce opacity, drop one.
- **States that only differ in color** (Active vs Hover) still count as distinct —
  but states that are literally pixel-identical at any size should be collapsed.

Present your variant plan before building:
> "I'm planning [N] variants: [types] × [states] × [sizes]. I collapsed [X] because
> [reason — e.g., Link doesn't need sizes, Ghost and Link are visually identical]."

If a type doesn't meaningfully scale (Link, Divider, etc.), give it one size.
If two types are visually identical, merge them or differentiate them further.
The goal is zero wasted variants — every variant in the component set should look
different from every other variant.

**Try all types in ONE `use_figma` call.** Split by type only if it fails:

```javascript
// TARGET: component library file (fileKey: xyz789)
// All button types: Primary, Secondary, Ghost, Link, Destructive
// All states × all sizes for each type
// combineAsVariants into component set + add component properties
// If this exceeds 50K, split: types in separate calls, combine in final call
```

After building, use `AskUserQuestion`:
> **[Component] — Refined version built**
>
> Full component set on "[DNA — Component]" page.
> [N] variants: [types] x [states] x [sizes].
> Toggle through variant properties in the design panel.
>
> RECOMMENDATION: Choose A if it matches what you approved.
>
> A) Looks good — proceed to token audit
> B) Visual tweaks needed (tell me what)
> C) Doesn't match — go back to the direction

### Step 5: Token Audit

Do a full audit of every token this component needs. Present via `AskUserQuestion`:

> **[Component] — Token Audit**
>
> Every token this component uses and where it comes from:
>
> ```
> Property          Token Needed                  Status
> ──────────────────────────────────────────────────────
> Fill (Primary)    Role/button/primary-bg         ⚠️ NEW — needs full chain
> Fill (Hover)      Role/button/primary-bg-hover   ⚠️ NEW
> Fill (Active)     Role/button/primary-bg-active  ⚠️ NEW
> Text              Role/button/primary-text       ⚠️ NEW
> Border Radius     Role/button/radius             ⚠️ NEW — discovered: [value]px
> Padding H (MD)    Role/button/padding-h-md       ⚠️ NEW — discovered: [value]px
> Padding V (MD)    Role/button/padding-v-md       ⚠️ NEW — discovered: [value]px
> Icon Gap          Role/button/icon-gap           ⚠️ NEW — discovered: [value]px
> Focus Ring        Effect/focus-ring              ✅ EXISTS
> Loading Opacity   Alias/opacity-loading          ✅ EXISTS
> Label Style       Text Style: Label/Default      ✅ EXISTS
> ```
>
> **[N] tokens exist, [N] are NEW (discovered by this component).**
>
> RECOMMENDATION: Choose A to review my proposals for the new tokens.
>
> A) Show me proposals for the new tokens
> B) The existing mappings look wrong — let me correct
> C) I want to rethink the token structure

### Step 6: Token Reconciliation — Write Back to mint-system

This is where mint-lib creates the component-level tokens that mint-system
intentionally left out.

Present proposals via `AskUserQuestion`:
> **[Component] — New Token Proposals**
>
> These tokens were DISCOVERED by building [Component]. They'll be added to your
> design system so every future component can reference them.
>
> | New Token | Value | Chain | Rationale |
> |-----------|-------|-------|-----------|
> | Brand/Radius/interactive | [X]px | — | Discovered: buttons use [X]px radius |
> | Alias/radius-interactive | → Brand/Radius/interactive | alias | Semantic name |
> | Role/button/radius | → Alias/radius-interactive | role | Button-specific |
> | Brand/Space/component-h-md | [X]px | — | Discovered: MD button horizontal padding |
> | ... | ... | ... | ... |
>
> The 3-layer chain: Role → Alias → Brand. No shortcuts.
>
> RECOMMENDATION: Choose A — these follow the patterns your approved direction established.
>
> A) Add all of these (recommended)
> B) Add but change some values (tell me which)
> C) Don't modify the design system — work with what exists
> D) Let me think — I'll come back

**If approved, write tokens back in this order:**

**Step 6a: Create tokens in the mint-system Figma file (source fileKey):**
```javascript
// TARGET: mint-system file (fileKey: abc123)
// Look up existing collections
const collections = figma.variables.getLocalVariableCollections();
const brandCol = collections.find(c => c.name === "Brand");
const aliasCol = collections.find(c => c.name === "Alias");

// Create NEW Brand variables in the existing Brand collection
const radiusInteractive = figma.variables.createVariable(
  "Brand/Radius/interactive", brandCol, "FLOAT"
);
radiusInteractive.setValueForMode(brandCol.modes[0].modeId, 8);

// Create NEW Alias variable aliasing to Brand
const aliasRadius = figma.variables.createVariable(
  "Alias/radius-interactive", aliasCol, "FLOAT"
);
aliasRadius.setValueForMode(aliasCol.modes[0].modeId,
  figma.variables.createVariableAlias(radiusInteractive)
);

// Create Role collection (first time) or find existing
let roleCol = collections.find(c => c.name === "Role");
if (!roleCol) {
  roleCol = figma.variables.createVariableCollection("Role");
}

// Create Role variables aliasing to Alias
const roleButtonRadius = figma.variables.createVariable(
  "Role/button/radius", roleCol, "FLOAT"
);
roleButtonRadius.setValueForMode(roleCol.modes[0].modeId,
  figma.variables.createVariableAlias(aliasRadius)
);

// Return ALL new variable IDs and keys
return { newVariables: [...] };
```

**Step 6b: STOP — Require user to republish mint-system:**

Use `AskUserQuestion`:
> **Republish required.** I just added [N] new tokens to your mint-system file.
> These must be published before I can import them into the component library.
>
> In Figma: open your mint-system file → Figma icon → Libraries → Publish.
> You should see [N] new changes to publish.
>
> RECOMMENDATION: Choose A when done.
>
> A) Done — republished
> B) I need help

**Do NOT proceed until user confirms.** Attempting to import before publishing
WILL fail — verified 2026-03-31.

**Step 6c: Re-import the new tokens into the component library file:**
```javascript
// TARGET: component library file (fileKey: xyz789)
// Import ONLY the new variables by key (we already have the old ones)
for (const { name, key } of newVariableKeys) {
  try {
    const v = await figma.variables.importVariableByKeyAsync(key);
    imported[name] = v.id;
  } catch (e) {
    failed.push({ name, key, error: e.message });
  }
}
return { imported, failed };
```

**If import fails:** The user likely didn't republish. Ask again.

**Step 6d: Update MINT.md** at `~/mint-kit/projects/{slug}/MINT.md` with the new tokens. Append to the Component Tokens section.

### Step 7: Full Token Binding

Rebind every property in the refined component to imported library tokens:

```javascript
// TARGET: component library file (fileKey: xyz789)
// For each variant in the component set:
// 1. Bind fills → setBoundVariableForPaint with Role variables
// 2. Bind strokes → setBoundVariableForPaint
// 3. Bind cornerRadius → setBoundVariable (all 4 corners)
// 4. Bind padding (paddingTop, paddingBottom, paddingLeft, paddingRight)
// 5. Bind itemSpacing (icon-text gap)
// 6. Apply Text Styles → textStyleId
// 7. Apply Effect Styles → effectStyleId
// 8. Bind opacity for disabled/loading
// 9. Bind strokeWeight for bordered variants
```

Run verification:
```javascript
// Walk all nodes in the component set
// Count: bound variables vs hardcoded fills/strokes/spacing
// Count: text nodes with Text Styles vs unstyled
// Return: { bound: N, hardcoded: N, styled: N, unstyled: N }
```

**If hardcoded > 0:** Fix before proceeding. Every fill, stroke, spacing, radius,
and text style MUST be token-bound.

Report: "Token binding complete. [N] bound, [N] styled. Zero hardcoded."

**Verify:** After token binding, dispatch verification agent per
`~/.claude/skills/mint-kit/shared/MINT_VERIFICATION.md` using the mint-lib DNA
reconciliation checklist. Confirm new Role/Brand/Alias variables exist and values
match DNA exploration decisions. Gate on PASS before user approval.

### Step 8: User Final Approval

Use `AskUserQuestion`:
> **[Component] — Final Approval**
>
> Complete [Component] ready in Figma:
> - [N] variants ([types] x [states] x [sizes])
> - [N] component properties (label text, icon toggle, etc.)
> - [N] tokens bound — zero hardcoded values
> - [N] new tokens created and written back to your design system
>
> **Check in Figma:**
> 1. Toggle variant properties (Type, State, Size)
> 2. Select any element — should show variable references
> 3. Every text node should show a Text Style name
>
> RECOMMENDATION: Choose A if everything looks correct.
>
> A) Approved — extract patterns and move on
> B) Visual tweaks needed (tell me what)
> C) Token bindings look wrong (which ones?)
> D) Start over with different directions

**Do not proceed until explicit approval.**

### Step 9: Pattern Extraction

Extract the implicit patterns this component established. Use `AskUserQuestion`:

> **[Component] — Pattern Extraction**
>
> Rules this component established. These propagate to every component that
> shares these patterns.
>
> ```
> PATTERNS — [Component]
> ═══════════════════════
> [For Button:]
> Interactive Padding:
>   SM: h=space-xs, v=space-2xs → ratio 2:1
>   MD: h=space-sm, v=space-xs
>   LG: h=space-md, v=space-sm
>
> State Color Shifts:
>   Default → Hover: one step darker (+100 in scale)
>   Default → Active: two steps darker (+200)
>   Disabled: base at opacity-disabled
>   Focus: focus-ring effect style
>
> Radius: radius-interactive ([X]px) for all interactive elements
> Icon Gap: [X]px between icon and label
> Border Treatment:
>   Primary: no border
>   Secondary: 1px stroke, border-default
>   Ghost: no border, no fill
>   Destructive: same as Primary but error scale
>   Link: no border, no fill, underline on hover
>
> Text Style Mapping:
>   SM: Label/Small
>   MD: Label/Default
>   LG: Body/Medium
> ```
>
> These drive the next [N] components. Wrong here = wrong 117 times.
>
> RECOMMENDATION: Choose A if patterns accurately reflect what you approved.
>
> A) Patterns confirmed — lock them
> B) Mostly right but [X] should be different
> C) Revisit the component before locking

**Wait for explicit confirmation.**

**Checkpoint:** Update session — `decisions.dna.{component}` locked with direction, patterns, IDs. Update `figmaState` with new variable keys and component IDs.

### Between DNA Components

After locking patterns, transition:
> **[Previous] complete.** Patterns locked.
>
> Next: **[Next Component]**. Builds on [Previous]'s patterns but adds [what's new].
>
> RECOMMENDATION: Choose A — keep momentum.
>
> A) Let's go — start [next]
> B) Revisit [previous] first
> C) Take a break — I'll save progress

---

**Checkpoint:** Update session — all 3 DNA components complete, phase `1` done.

## Phase 2: Pattern Lock

After all 3 DNA components are approved, write patterns to `~/mint-kit/projects/{slug}/MINT.md`
(append to the Component Tokens section):

```markdown
## Component Patterns (extracted from DNA)

### Interactive Elements (from Button)
- Padding ratio: horizontal = 2x vertical
- Size scale: SM/MD/LG with [token mappings]
- State shifts: hover +100, active +200, disabled opacity
- Focus ring: [spec]
- Radius: [token] = [value]
- Text styles: [mappings per size]
- Icon gap: [token] = [value]

### Form Elements (from Input)
- Stroke treatment: [spec]
- Focus behavior: [spec]
- Label positioning: [spec]
- Helper/error text: [style + spacing]
- State colors: [mappings]

### Container Elements (from Card)
- Surface layering: [spec]
- Elevation mapping: [spec]
- Content spacing: [spec]
- Divider treatment: [spec]
- Radius: [token] = [value]
```

Use `AskUserQuestion`:
> **All 3 DNA components complete. Patterns locked.**
>
> What happens next:
> - **Tier 1 (Atoms):** 27 simple components
> - **Tier 2 (Molecules):** 37 composed components
> - **Tier 3 (Organisms):** 33 assembled patterns
> - **Tier 4 (Templates):** 20 page layouts
>
> Total: ~117 components following the patterns you approved.
> I'll build each tier and pause for review.
>
> RECOMMENDATION: Choose A — patterns are proven, let it run.
>
> A) Start auto-generation (recommended)
> B) Review the pattern document first
> C) Modify patterns before starting

---

**Checkpoint:** Update session — phase `2` complete, patterns written to MINT.md.

## Phase 3: Auto-Generate Tier 1 — Atoms

Create a "Tier 1 — Atoms" page. Pack as many components as will fit per
`use_figma` call (aim for the full tier in 1-2 calls, not 2-3 components each).
Apply DNA patterns — do NOT invent new patterns. If a component needs something
patterns don't cover, flag it via `AskUserQuestion`.

**On failure:** Follow recovery chain in FIGMA_API.md § Error Handling. Checkpoint
`figmaState` after each successful `use_figma` call so a crash doesn't lose
partial tier progress.

**Error recovery:** If a `use_figma` call fails mid-tier:
1. Verify what was created (follow-up verification call)
2. Note which components succeeded
3. Retry only the failed components
4. Do NOT rebuild what already exists

### Tier 1 Component List (27 components)

**Interactive Atoms (from Button patterns):**
1. **Icon Button** — square aspect, icon-only. Sizes: SM/MD/LG
2. **Link** — inline, standalone, with-icon. States: default/hover/active/visited/disabled
3. **Close Button** — icon button variant, ghost style
4. **Copy Button** — icon button with "copied" check state
5. **Scroll to Top** — floating icon button
6. **FAB** — elevated icon button, primary fill, larger size

**Form Atoms (from Input patterns):**
7. **Textarea** — multi-line input. Character count, resize handle
8. **Checkbox** — unchecked, checked, indeterminate, disabled
9. **Radio** — same states, circular. Group layout variant
10. **Toggle / Switch** — on/off/disabled. Label left or right
11. **Slider** — single, range. Value tooltip
12. **Pin Input / OTP** — array of single-char inputs
13. **Rating** — stars (1-5), thumbs (up/down)

**Display Atoms (from Card patterns):**
14. **Badge / Tag / Chip** — with close, icon, dot. Pill radius
15. **Avatar** — XS/SM/MD/LG/XL. Image placeholder, initials, icon fallback. Status dot
16. **Status Dot** — online, offline, busy, away
17. **Count Badge** — notification count bubble
18. **Divider / Separator** — horizontal, vertical, with label
19. **Spacer** — fixed sizes from spacing scale
20. **Spinner / Loading** — sizes matching component sizes
21. **Progress Bar** — determinate, indeterminate, with label
22. **Skeleton Loader** — text lines, card, avatar, table row shapes
23. **KBD** — keyboard shortcut key cap
24. **Dot Separator** — breadcrumb dot
25. **Resize Handle** — drag indicator

**Typography Atoms:**
26. **Heading** — H1-H6 wrapping Text Styles
27. **Label / Caption / Code** — form labels, captions, monospace

After building, use `AskUserQuestion`:
> **Tier 1 complete — 27 atoms.**
>
> On "Tier 1 — Atoms" page. All follow DNA patterns, fully token-bound.
>
> - Interactive (6): Icon Button, Link, Close, Copy, Scroll to Top, FAB
> - Form (7): Textarea, Checkbox, Radio, Toggle, Slider, Pin Input, Rating
> - Display (12): Badge, Avatar, Status Dot, Count Badge, Divider, Spacer,
>   Spinner, Progress, Skeleton, KBD, Dot Separator, Resize Handle
> - Typography (2): Heading, Label/Caption/Code
>
> RECOMMENDATION: Choose A — skim in Figma, flag anything off.
>
> A) Looks good — proceed to Tier 2
> B) Issues found (which components?)
> C) Need more time to inspect
> D) Add components to this tier

---

**Checkpoint:** Update session — phase `3` complete (Tier 1 atoms), `figmaState` updated.

## Phase 4: Auto-Generate Tier 2 — Molecules

Composed from DNA + Tier 1. Create "Tier 2 — Molecules" page.

**On failure:** Follow recovery chain in FIGMA_API.md § Error Handling.

### Tier 2 Component List (37 components)

**Form Molecules:**
1. **Select / Dropdown** — single, multi, searchable, grouped
2. **Combobox / Autocomplete** — input with filtered dropdown
3. **Date Picker** — single, range, with time
4. **Time Picker** — input + time slot dropdown
5. **Color Picker** — input + swatch grid + slider
6. **File Upload** — drag zone, file list, progress
7. **Form Field Wrapper** — label + input + helper/error text
8. **Form Section** — title + description + field group
9. **Form Actions** — submit + cancel + loading
10. **Inline Edit** — click-to-edit text
11. **Transfer List** — dual pane with move buttons

**Navigation Molecules:**
12. **Breadcrumbs** — with separator variants
13. **Tabs** — horizontal, vertical, pill, underline
14. **Pagination** — numbered, prev/next, load more
15. **Menu / Context Menu** — icons, shortcuts, nested, dividers
16. **Nav Item** — icon + label + badge
17. **Speed Dial** — FAB + expandable actions

**Feedback Molecules:**
18. **Tooltip** — top/bottom/left/right, rich content
19. **Popover** — with/without arrow, content slot
20. **Alert / Banner** — info/success/warning/error, dismissible
21. **Snackbar** — bottom toast variant
22. **Overlay / Backdrop** — semi-transparent

**Data Display Molecules:**
23. **Avatar Group** — stacked with overflow count
24. **List Item** — simple, icon, avatar, action, draggable
25. **Description List** — label + value pairs
26. **Stat / Metric Card** — value + label + trend
27. **Accordion** — single/multiple open
28. **Callout / Blockquote** — left border accent
29. **Code Block** — copy button, line numbers
30. **Image / Media** — caption, lightbox indicator
31. **Carousel Item** — media + dots + arrows
32. **Truncated Text** — ellipsis + tooltip
33. **Aspect Ratio Box** — maintains ratio

**Surface Molecules:**
34. **Container / Section Wrapper** — max-width + responsive padding
35. **Stack** — horizontal/vertical auto-layout presets
36. **Grid** — 2/3/4 column
37. **Scroll Area** — scroll indicators

After building, use `AskUserQuestion`:
> **Tier 2 complete — 37 molecules.**
>
> On "Tier 2 — Molecules" page.
> Categories: Form (11), Navigation (6), Feedback (5), Data Display (11), Surface (4)
>
> **Judgment calls** (patterns didn't fully dictate):
> - [List components where decisions went beyond DNA patterns]
>
> RECOMMENDATION: Choose A — focus review on the judgment calls above.
>
> A) Looks good — proceed to Tier 3
> B) Issues found (which?)
> C) Need more time
> D) Judgment calls need changing

---

**Checkpoint:** Update session — phase `4` complete (Tier 2 molecules), `figmaState` updated.

## Phase 5: Auto-Generate Tier 3 — Organisms

Assembled from everything. Create "Tier 3 — Organisms" page.
Build ONE PAGE AT A TIME — verify each page of components before continuing.

**On failure:** Follow recovery chain in FIGMA_API.md § Error Handling.

### Tier 3 Component List (33 components)

**Navigation Organisms:**
1. **Top Nav / App Bar** — logo + nav + search + actions + avatar
2. **Sidebar** — collapsible, sections, badges, scrollable
3. **Bottom Nav** — mobile, 3-5 items
4. **Stepper / Wizard** — horizontal/vertical, step indicators
5. **Command Palette** — modal + search + filtered results
6. **Toolbar** — icon buttons + dividers + overflow

**Overlay Organisms:**
7. **Toast / Notification** — info/success/warning/error, stacked
8. **Modal / Dialog** — SM/MD/LG/fullscreen, header + body + footer
9. **Drawer / Sheet** — left/right/bottom
10. **Bottom Sheet** — mobile, drag handle
11. **Dialog with Form** — modal + form fields + actions

**Data Organisms:**
12. **Table** — sortable, selectable, expandable, pinned columns, row actions
13. **Data Grid** — editable cells, virtual scroll indicator
14. **Tree View** — expandable, checkboxes, drag handles
15. **Timeline / Activity Feed** — events + connectors
16. **Carousel** — items + dots + arrows + swipe area

**Layout Organisms:**
17. **Card Grid / Gallery** — responsive 2/3/4 columns
18. **Data List** — key-value with sections
19. **Settings Panel** — form sections + toggles

**State Organisms:**
20. **Empty State** — illustration slot + heading + action
21. **Error State** — 404, 500, offline, permission denied

**Full Form Organisms:**
22. **Form (full)** — sections + fields + actions + validation
23. **Auth Form** — login/signup + social + links
24. **Search Bar** — input + results dropdown, expandable
25. **Filter Bar** — selects + buttons + active chips

**Page Section Organisms:**
26. **Hero Section** — heading + subtext + CTA + media
27. **Feature Grid** — icon + heading + description cards
28. **Pricing Table** — card columns + feature rows
29. **Testimonial Card** — avatar + quote + attribution
30. **CTA Section** — heading + description + buttons
31. **Footer** — logo + nav columns + social + legal
32. **Stat Row** — row of metric cards
33. **FAQ / Accordion Group** — series of accordions

After building, use `AskUserQuestion`:
> **Tier 3 complete — 33 organisms.**
>
> On "Tier 3 — Organisms" page.
> Categories: Navigation (6), Overlay (5), Data (5), Layout (3), State (2),
> Forms (4), Page Sections (8)
>
> **Most complex** (worth inspecting):
> - Table — [N] variants
> - Modal — [N] sizes with form composition
>
> RECOMMENDATION: Choose A — focus on the complex components listed above.
>
> A) Looks good — proceed to Tier 4
> B) Issues found (which?)
> C) Need more time
> D) Skip Tier 4 — go to polish

---

**Checkpoint:** Update session — phase `5` complete (Tier 3 organisms), `figmaState` updated.

## Phase 6: Auto-Generate Tier 4 — Templates

Full page compositions. Create "Tier 4 — Templates" page.

**Templates are FRAMES, not components.** They show structural layouts using
components from Tiers 0-3. They are NOT component sets with variants — just
reference frames showing where components go.

### Tier 4 Template List (20 templates)

1. **Dashboard Layout** — top nav + sidebar + card grid
2. **Settings Page** — top nav + sidebar + settings panel
3. **Data Table Page** — top nav + filter bar + table + pagination
4. **Detail Page** — top nav + breadcrumbs + content + sidebar
5. **Form Page** — top nav + centered form
6. **Auth Page** — centered auth form on branded bg
7. **Landing Page** — hero + features + testimonials + pricing + CTA + footer
8. **Search Results** — top nav + search + filter sidebar + results
9. **Profile Page** — top nav + avatar header + tabs
10. **Error Page** — centered error state (404/500)
11. **Empty Dashboard** — dashboard + empty state
12. **Wizard / Onboarding** — stepper + form sections
13. **Chat / Messaging** — sidebar + message timeline + input
14. **Calendar View** — top nav + calendar grid + events
15. **Kanban Board** — column layout + draggable cards
16. **File Manager** — top nav + breadcrumbs + grid/list toggle
17. **Notification Center** — drawer + notification list + tabs
18. **Changelog / Timeline** — timeline + version cards
19. **Comparison Page** — side-by-side cards/pricing
20. **Mobile App Shell** — bottom nav + content + FAB

Before building, use `AskUserQuestion`:
> **Ready to build Tier 4 — 20 page templates.**
>
> These are structural references (frames, not components) showing how your
> library composes at page scale.
>
> RECOMMENDATION: Choose A — marginal cost is low, they serve as reference.
>
> A) Build all 20 (recommended)
> B) Only build these: [let user pick]
> C) Skip templates — library is enough

After building:
> **Tier 4 complete — [N] templates.**
>
> On "Tier 4 — Templates" page. Each uses ONLY components from Tiers 0-3.
>
> A) Looks good — polish and publish
> B) Issues found (which templates?)
> C) Add templates

---

**Checkpoint:** Update session — phase `6` complete (Tier 4 templates), `figmaState` updated.

## Phase 7: Polish + Publish

### 7a: Naming Cleanup
Ensure consistent naming across all component sets:
```
"Button" → "Type=Primary, State=Default, Size=MD"
"Input"  → "Type=Text, State=Default, Size=MD, Label=Above"
"Card"   → "Variant=Elevated, Slots=Header+Body+Footer"
```

### 7b: Page Organization
```
Cover (name, version, date)
DNA — Button Options (exploration history)
DNA — Input Options
DNA — Card Options
Tier 1 — Atoms (27)
Tier 2 — Molecules (37)
Tier 3 — Organisms (33)
Tier 4 — Templates (20)
```

### 7c: Token Binding Verification — ONE PAGE AT A TIME
```javascript
// For EACH page separately:
// Walk all nodes, count bound vs hardcoded
// Return per-page counts
// Fix any page with hardcoded > 0 before moving to next
```
**Target: 0 hardcoded values across the entire library.**

### 7d: Component Descriptions
```javascript
componentSet.description = "Primary action button. 5 types, 6 states, 3 sizes. Icon left/right/only.";
```

### 7e: Publish

Use `AskUserQuestion`:
> **Component library complete and verified.**
>
> - **120 components** across 4 tiers + 3 DNA
> - **[N] total variants**
> - **[N] tokens bound** — zero hardcoded
> - **[N] new tokens** added to your design system during DNA
>
> Publish as team library: Assets panel → book icon → Publish.
>
> RECOMMENDATION: Choose A.
>
> A) I'll publish now — update MINT.md when done
> B) Review more first
> C) I'll publish later

**Checkpoint:** Archive session — rename `mint-lib-session.json` → `mint-lib-session.done`. Skill complete.

### 7f: Update MINT.md

Append component library reference to `~/mint-kit/projects/{slug}/MINT.md`:

```markdown
## Component Library

Figma source: [URL]
Generated by /mint-lib on [date]

### Component Count
- Tier 0 (DNA): 3 (Button, Input, Card)
- Tier 1 (Atoms): 27
- Tier 2 (Molecules): 37
- Tier 3 (Organisms): 33
- Tier 4 (Templates): 20
- Total: 120

### New Tokens Created
[List all Brand, Alias, and Role tokens created during DNA phase]
```

Final sign-off:
> **Mint Lib complete.**
>
> Library built, token-bound, documented. MINT.md updated.
>
> **Next in Mint Kit:**
> - `/mint-surface` — backgrounds, patterns, decorative treatments
> - `/mint-icons` — icon system
> - `/mint-screens` — full page layouts
>
> RECOMMENDATION: Choose A — surfaces give components visual context.
>
> A) Run /mint-surface next
> B) Run /mint-icons next
> C) Done for now
> D) Revise something in the library

---

## Component Count Summary

| Tier | Category | Count |
|------|----------|-------|
| 0 | DNA (Button, Input, Card) | 3 |
| 1 | Atoms | 27 |
| 2 | Molecules | 37 |
| 3 | Organisms | 33 |
| 4 | Templates | 20 |
| **Total** | | **120** |

## Estimated `use_figma` Calls

| Phase | Calls |
|-------|-------|
| Phase 0 (setup + import) | 3-5 |
| Phase 1 (DNA — 5 options x 3 + refine + bind) | 25-40 |
| Phase 1 (token write-back — 3 reconciliation rounds) | 6-9 |
| Phase 3 (Tier 1 — 27 components) | 15-20 |
| Phase 4 (Tier 2 — 37 components) | 20-25 |
| Phase 5 (Tier 3 — 33 components) | 20-25 |
| Phase 6 (Tier 4 — 20 templates) | 15-20 |
| Phase 7 (polish + verify) | 5-10 |
| **Total** | **~110-155** |
