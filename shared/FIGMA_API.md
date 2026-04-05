# Mint Kit — Figma Plugin API Reference

### Font Loading
Before using any font, call `figma.loadFontAsync({family, style})`.
This WILL FAIL if the font is not installed on the machine or available in Figma.
Always wrap in try/catch. If a font fails:
1. Fall back to "Inter" with the matching style
2. Tell the user: "Font [X] failed to load — using Inter as fallback. You can
   install [X] and I'll retry, or we can pick a different font."
3. Offer alternatives from the same aesthetic category

### Error Handling — Structured Recovery Chain

Every `use_figma` call can fail. Follow this chain IN ORDER — do not skip steps.

#### Step 1: Attempt the call
Run the `use_figma` call. If it succeeds, continue. If it fails, read the error
message and classify it:

#### Step 2: Classify and recover

**Size error** (50K character limit exceeded):
1. Split into two logical halves (see "50K Character Limit" section below)
2. Retry each half independently
3. If a half still fails, split further (max 3 levels deep)
4. If 3 levels deep and still failing: checkpoint to disk, tell user

**Font error** (font not available):
1. Fall back to Inter for that specific font
2. Record the fallback in the session checkpoint: `decisions.fonts.{role}.fallback = "Inter"`
3. Tell the user: "Font [X] failed to load — using Inter as fallback. You can
   install [X] and I'll retry, or we can pick a different font."
4. Continue — do NOT block on a font failure

**Auth / permission error** (team project access):
1. Check: is the file in a team project? (Files in Drafts can't publish variables)
2. Check: does the user have Editor access? (Viewer can't create variables)
3. Guide: "This file needs to be in a team project with Editor access. Move it
   from Drafts to a team project, or ask the file owner for Editor access."
4. Use `AskUserQuestion` to gate: "Let me know when access is fixed."

**Code error** (JS syntax, wrong API, type mismatch):
1. Read the error message — it usually says exactly what's wrong
2. Fix the JS and retry once
3. If it fails again with a DIFFERENT error: fix and retry once more
4. If it fails again with the SAME error: checkpoint, escalate (see Step 4)

**Partial success** (some elements created, others failed):
1. Run inventory call (see below)
2. Diff against intent — identify what's missing
3. Retry ONLY the missing elements
4. If the retry fails: checkpoint, escalate

#### Step 3: Inventory after failure

After ANY failed `use_figma` call that might have partially succeeded, run a
read-only inventory call to see what actually got created:

```javascript
// INVENTORY — read-only, no mutations
const collections = figma.variables.getLocalVariableCollections();
const variables = figma.variables.getLocalVariables();
const textStyles = figma.getLocalTextStyles();
const effectStyles = figma.getLocalEffectStyles();

return {
  collections: collections.map(c => ({ name: c.name, id: c.id, count: c.variableIds.length })),
  variableNames: variables.map(v => v.name),
  textStyleNames: textStyles.map(s => s.name),
  effectStyleNames: effectStyles.map(s => s.name)
};
```

Compare the inventory against what you intended to create. The delta is your
retry list. Do NOT recreate things that already exist.

#### Step 4: Escalation (3 consecutive failures)

If the same logical operation fails 3 times:
1. **Checkpoint immediately** — write current state to the session file (see MINT_CHECKPOINT.md)
2. **Report structured failure to user:**
   ```
   "3 of 11 primary scale variables were created before the error.
   I've checkpointed progress. The error: [exact message].
   Options: A) I'll retry the remaining 8. B) Check Figma and tell me what you see.
   C) Skip this step and continue."
   ```
3. **Wait for user direction** — do NOT silently retry in a loop
4. Use `AskUserQuestion` with those 3 options so the user can respond cleanly

**What the skill says on failure (exact words):**
- NOT: "Something went wrong. Let me try again."
- YES: "3 of 11 primary scale variables were created before the error. I'll
  inventory what exists and retry only the missing 8."

#### Recovery references in skills

Skills reference this section with a one-liner:
```
**On failure:** Follow recovery chain in FIGMA_API.md § Error Handling.
```
The one-liner replaces inline error handling. The full protocol lives here.

### 50K Character Limit — Try First, Split on Failure

`use_figma` has a 50,000 character limit per call.

**Default: try to fit everything into ONE call.** Do NOT pre-split into multiple
calls "just in case." Most operations are nowhere near 50K. Splitting wastes API
calls and slows the skill down.

**Split strategy:**
1. Write the code for everything you need in one call
2. If the call fails with a size error, split into two logical halves and retry
3. If a half still fails, split further
4. If you can clearly see the code will exceed 50K (e.g., 200+ variable
   definitions with verbose setup), split proactively into logical groups

**Never announce splitting.** Don't say "I'll split this across multiple calls."
Just do it if needed. The user doesn't care about your API call strategy.

### Collections with Multiple Modes

To create a collection with modes (e.g., Light/Dark or Desktop/Mobile):

```javascript
// The default mode is created automatically — rename it, then add the second
const collection = figma.variables.createVariableCollection("Map");
collection.modes[0].name = "Light";
const darkModeId = collection.addMode("Dark");
const lightModeId = collection.modes[0].modeId;

// Set values for BOTH modes on each variable
const textHeading = figma.variables.createVariable("text/heading", collection.id, "COLOR");
textHeading.setValueForMode(lightModeId, figma.variables.createVariableAlias(aliasTextPrimary));
textHeading.setValueForMode(darkModeId, { r: 0.95, g: 0.95, b: 0.95, a: 1 });
```

To apply a mode to a frame (e.g., for the Design System Overview dark preview):
```javascript
frame.setExplicitVariableModeForCollection(collection.id, darkModeId);
```

### Node IDs and Cross-Call References
When creating variables or frames, ALWAYS return IDs at the end of the `use_figma` code:
```javascript
return {
  collectionId: collection.id,
  modeId: modeId,
  variableIds: { "primary-500": primary500.id, "neutral-100": neutral100.id },
  frameIds: { "optionA": frameA.id }
};
```
In subsequent calls, use `figma.variables.getVariableById(id)` to reference
variables created in prior calls. NEVER recreate a variable — always look it up by ID.

### Frame Sizing — Compact Auto-Layout + Page Positioning
Build specimens as compact auto-layout grids, NOT 1400px page layouts.

**Every frame MUST have explicit x/y coordinates.** Without this, all frames pile
up at origin and overlap. Set x/y AFTER configuring auto-layout (auto-layout
resets position).

```javascript
const frame = figma.createFrame();
frame.name = "A: Direction Name";
frame.layoutMode = "VERTICAL";
frame.primaryAxisSizingMode = "AUTO";
frame.counterAxisSizingMode = "AUTO";
frame.paddingTop = frame.paddingBottom = frame.paddingLeft = frame.paddingRight = 48;
frame.itemSpacing = 32;
// SET POSITION AFTER AUTO-LAYOUT CONFIG
frame.x = directionIndex * (frameWidth + gap);
frame.y = rowY;
```

**Positioning rules:**
- Pick a consistent frame width for the skill (e.g., 400px). Add a gap (e.g., 50px).
- Row of 4 frames: x = 0, 450, 900, 1350 (if 400px + 50px gap)
- Multiple rows: calculate y from previous row's bottom + 80px gap
- Each skill defines its own widths in its SKILL.md — the principle is: explicit
  coordinates, consistent spacing, predictable grid.

**After building each row of frames:** call `get_screenshot` on the page to verify
no overlap BEFORE presenting options to the user. If frames overlap, reposition
them before continuing.

### Frame Verification — TRUST THE CREATION CALL

**Do NOT run a separate verification call after creating frames.** If `use_figma`
returned successfully with frame IDs, the frames exist. Running a follow-up
verification call often returns stale/empty results (MCP state lag between calls),
which causes the model to panic, rebuild everything, create duplicates, then find
and clean up its own mess. The user sees perfectly fine frames while the model
spirals.

**After creating frames:**
1. The creation call returned IDs → frames exist. Trust it.
2. Go straight to `get_screenshot` using the page node ID.
3. Use the screenshot to verify LAYOUT (no overlap, correct positioning) — not
   existence. If layout is wrong, fix positions. If screenshot fails, tell the
   user to check Figma directly.
4. **NEVER rebuild frames because a verification or screenshot call returned
   empty/error.** The frames exist. The API is lagging.

### Cross-Skill Placeholder Convention

When a skill creates placeholder sections for another skill to fill later, use
this naming convention so the consuming skill can reliably find and replace them:

**Frame name format:** `[PLACEHOLDER] {Section Name}`

Examples:
- `[PLACEHOLDER] Interactive States` — created by mint-system, filled by mint-lib
- `[PLACEHOLDER] Component Patterns` — created by mint-system, filled by mint-lib
- `[PLACEHOLDER] Borders + Dividers` — created by mint-system, filled by mint-lib

**Visual style:** dashed border (strokeDashes: [8, 4]), neutral-300 stroke color,
gray text label: "Run /{skill-name} to fill this section."

**Discovery:** the consuming skill searches for frames with `[PLACEHOLDER]` prefix
using `figma.currentPage.findAll(n => n.name.startsWith("[PLACEHOLDER]"))`.
When filling, rename the frame to remove the prefix (e.g., "Interactive States").

### Token Strategy — What Goes Where

**Variables** (bindable via `setBoundVariable`):
- Fill/stroke colors (COLOR), font size (FLOAT), corner radius (FLOAT)
- Padding, gap, item spacing (FLOAT), width/height (FLOAT)
- Stroke weight (FLOAT), opacity (FLOAT)

**Text Styles** (`figma.createTextStyle()`):
- Font family + weight + size + line height + letter spacing as one reusable style
- This is the ONLY way to tokenize font family in Figma

**Effect Styles** (`figma.createEffectStyle()`):
- Shadows, blurs, elevation scale

**MINT.md only:**
- Breakpoints, z-index (motion deferred to implementation)

### CRITICAL — Things That WILL Fail Silently

- STRING variables for font family — NOT bindable. Use Text Styles.
- `fontSize` on TextStyle objects — set directly, NOT via variable binding.
- Line height — use `{value: 56, unit: "PIXELS"}` NOT a raw float like 1.5.
- Letter spacing — use `{value: -1, unit: "PIXELS"}` NOT a raw float.
- `createImageAsync` / `fetch` — NOT available in the Plugin API sandbox.
- `setBoundVariable("fills", 0, variable)` — DOES NOT WORK. Fails silently.
  Use `figma.variables.setBoundVariableForPaint()` instead:
  ```javascript
  // WRONG — fails silently
  rect.fills = [figma.util.solidPaint("#08080A")];
  rect.setBoundVariable("fills", 0, colorVar);

  // RIGHT
  const paint = figma.util.solidPaint("#08080A");
  const boundPaint = figma.variables.setBoundVariableForPaint(paint, "color", colorVar);
  rect.fills = [boundPaint];
  ```
  Same pattern for strokes:
  ```javascript
  const strokePaint = figma.util.solidPaint("#333");
  const boundStroke = figma.variables.setBoundVariableForPaint(strokePaint, "color", strokeVar);
  rect.strokes = [boundStroke];
  ```
- `getAvailableLibraryVariableCollectionsAsync()` — does NOT work in MCP sandbox.
  Always returns empty or errors. DO NOT USE.

### Correct Figma Variable API Usage

Creating a variable collection and variables:
```javascript
const collection = figma.variables.createVariableCollection("Brand");
const modeId = collection.modes[0].modeId;

// COLOR variable
const primary = figma.variables.createVariable("Brand/Color/primary-500", collection, "COLOR");
primary.setValueForMode(modeId, { r: 0, g: 1, b: 0.82, a: 1 }); // RGBA 0-1 scale

// FLOAT variable
const spaceMd = figma.variables.createVariable("Brand/Space/md", collection, "FLOAT");
spaceMd.setValueForMode(modeId, 16);
```

Creating an alias (cross-collection reference):
```javascript
const aliasCollection = figma.variables.createVariableCollection("Alias");
const aliasModeId = aliasCollection.modes[0].modeId;

const aliasPrimary = figma.variables.createVariable("Alias/primary", aliasCollection, "COLOR");
aliasPrimary.setValueForMode(aliasModeId, figma.variables.createVariableAlias(primary));
```

Binding a variable to a node:
```javascript
// Fill color — use setBoundVariableForPaint (NOT setBoundVariable)
const rect = figma.createRectangle();
const paint = figma.util.solidPaint("#000000");
const boundPaint = figma.variables.setBoundVariableForPaint(paint, "color", aliasPrimary);
rect.fills = [boundPaint];

// Corner radius
rect.setBoundVariable("topLeftRadius", radiusVar);
rect.setBoundVariable("topRightRadius", radiusVar);
rect.setBoundVariable("bottomLeftRadius", radiusVar);
rect.setBoundVariable("bottomRightRadius", radiusVar);

// Auto-layout spacing (on frames with auto-layout)
frame.setBoundVariable("paddingTop", spacingVar);
frame.setBoundVariable("paddingBottom", spacingVar);
frame.setBoundVariable("paddingLeft", spacingVar);
frame.setBoundVariable("paddingRight", spacingVar);
frame.setBoundVariable("itemSpacing", gapVar);

// Stroke color — same as fills
const strokePaint = figma.util.solidPaint("#000000");
const boundStroke = figma.variables.setBoundVariableForPaint(strokePaint, "color", strokeColorVar);
rect.strokes = [boundStroke];
rect.setBoundVariable("strokeWeight", strokeWidthVar);

// Opacity
rect.setBoundVariable("opacity", opacityVar);
```

**What CANNOT be bound to variables:**
- Font family (use Text Styles instead)
- Font weight/style (use Text Styles)
- Line height (set directly: `{value: 56, unit: "PIXELS"}` or `{value: 140, unit: "PERCENT"}`)
- Letter spacing (set directly: `{value: -1, unit: "PIXELS"}`)
- Effect/shadow properties (use Effect Styles)
