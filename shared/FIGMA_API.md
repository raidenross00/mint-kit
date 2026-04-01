# Mint Kit — Figma Plugin API Reference

### Font Loading
Before using any font, call `figma.loadFontAsync({family, style})`.
This WILL FAIL if the font is not installed on the machine or available in Figma.
Always wrap in try/catch. If a font fails:
1. Fall back to "Inter" with the matching style
2. Tell the user: "Font [X] failed to load — using Inter as fallback. You can
   install [X] and I'll retry, or we can pick a different font."
3. Offer alternatives from the same aesthetic category

### Error Handling
Every `use_figma` call can fail. If it fails:
1. Read the error message carefully
2. If font error: retry with Inter as fallback
3. If code error: fix the JS and retry once
4. If it fails twice: tell the user what went wrong and ask how to proceed
5. If partial success (some elements created, others failed): keep what worked,
   fix and retry only the failed parts

### 50K Character Limit
`use_figma` has a 50,000 character limit per call. Plan splits BEFORE writing code.
Each skill defines its own partition boundaries (see skill-specific sections below).
General rule: one logical unit per call. Never try to build everything in a single call.

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
**Place each frame side-by-side with x-offset so they don't overlap:**
```javascript
const frame = figma.createFrame();
frame.name = "A: Direction Name";
frame.layoutMode = "VERTICAL";
frame.primaryAxisSizingMode = "AUTO";
frame.counterAxisSizingMode = "AUTO";
frame.paddingTop = frame.paddingBottom = frame.paddingLeft = frame.paddingRight = 48;
frame.itemSpacing = 32;
// CRITICAL: offset each frame so they don't stack at 0,0
// Use index * 800 for x position (frames auto-size, 800 gives breathing room)
frame.x = directionIndex * 800;
frame.y = 0;
```
Each direction frame gets its own x position. Without this, all frames pile up at origin.

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
3. If `get_screenshot` fails, tell the user to check Figma directly. Do NOT
   rebuild the frames. They are there.
4. **NEVER rebuild frames because a verification or screenshot call returned
   empty/error.** The frames exist. The API is lagging.

**If frames overlap at 0,0** (visible in screenshot or user reports it):
THEN run a fix-up call to reposition:
```javascript
const page = figma.root.children.find(p => p.name.includes("Direction"));
const frames = page.children.filter(c => c.type === "FRAME");
frames.forEach((f, i) => { f.x = i * 800; f.y = 0; });
```
Only do this reactively (user reports overlap or screenshot shows it), not preemptively.

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
