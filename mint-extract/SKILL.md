---
name: mint-extract
description: Extract design tokens from any source (Figma URL, website URL, screenshot, code) into MINT.md format. Creates new or merges into existing MINT.md. Opinionated extractions — no hedging.
---

## Preamble (run first, silently)

```bash
_UPD=$(~/.claude/skills/mint-kit/bin/mint-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
```

**If output starts with `JUST_UPGRADED`:** Read `shared/MINT_UPGRADE.md` §2. Show What's New, then continue.
**If output starts with `UPGRADE_AVAILABLE`:** Read `shared/MINT_UPGRADE.md` §1. Follow inline upgrade flow.
**If no output:** Continue normally. Say nothing about updates.

# /mint-extract — Design Token Extractor

Extract a complete design system from anything — a Figma file, a live website, a
screenshot, existing CSS/code, or even a description. Outputs MINT.md format that
/mint-system and /mint-lib can consume directly.

This is the reverse path: instead of building a design system through consultation,
you pull one out of something that already exists.

## Core Rules

1. **Be opinionated.** Commit to your best extraction. Do not hedge, caveat, or
   ask "is this right?" for individual tokens. Extract the full system, present
   it, let the user correct what's wrong. Wrong extractions get fixed faster than
   15 confirmation prompts get answered.

2. **Match MINT.md format exactly.** The output must be consumable by /mint-system
   (for updates) and /mint-lib (for component building). No custom formats.

3. **Extract everything.** Colors, typography, spacing, opacity, elevation, surfaces,
   responsive breakpoints, contrast pairings. A partial extraction that skips spacing
   or elevation is not useful. If a category can't be determined from the source,
   derive sensible defaults from what IS visible (e.g., infer spacing scale from
   measured gaps, infer elevation from shadow CSS).

4. **Name tokens using the Brand/Alias/Map layer system.** Raw hex values go in
   Brand tokens. Semantic mappings go in Alias. Theme-aware mappings go in Map.

## Shared Docs

Before running, read these (they apply to all Mint Kit skills):
- `shared/MINT_VOICE.md` — tone and posture
- `shared/ASKUSER_API.md` — AskUserQuestion structure
- `shared/MINT_PERMISSIONS.md` — setup and cleanup (Phase 0)
- `shared/MINT_EXAMPLES.md` — format anchors

## Phase 0: Setup + Source Detection

### 0a. Permissions

Follow `shared/MINT_PERMISSIONS.md` for setup (accept-edits prompt, DESIGN.md search).

### 0b. Detect Source

The user provides a source. Detect its type:

| Source | Detection | How to read |
|--------|-----------|-------------|
| Figma URL | Contains `figma.com/design` or `figma.com/file` | Use `get_design_context` or `get_screenshot` MCP tools |
| Website URL | Starts with `http://` or `https://` (not Figma) | Use browse tool or fetch, inspect computed styles |
| Screenshot/Image | File path to .png/.jpg/.webp or pasted image | Read the image directly (multimodal) |
| CSS/Code | File path to .css/.scss/.ts/.json or pasted code | Read and parse token values |
| Description | Plain text describing a design | Derive a system from the description |

If the source type is ambiguous, ask once:

```json
{
  "questions": [{
    "header": "Source",
    "question": "What am I extracting from?",
    "multiSelect": false,
    "options": [
      { "label": "A: Figma file", "description": "I'll read the design via Figma API." },
      { "label": "B: Live website", "description": "I'll inspect the site's computed styles." },
      { "label": "C: Screenshot/image", "description": "I'll analyze the visual design." },
      { "label": "D: Code/CSS", "description": "I'll parse the token values from source." }
    ]
  }]
}
```

### 0c. Check for Existing MINT.md

Check for MINT.md in the current working directory ONLY (not recursive).

- **No MINT.md:** This is a new extraction. Output a complete MINT.md.
- **MINT.md exists for a DIFFERENT product:** Start fresh, warn the user.
- **MINT.md exists for THIS product:** Ask:

```json
{
  "questions": [{
    "header": "Mode",
    "question": "You already have a MINT.md for this product. I recommend merging — I'll keep your existing decisions and fill in or update tokens from the new source.",
    "multiSelect": false,
    "options": [
      { "label": "A: Merge (Recommended)", "description": "Keep existing decisions, update/add tokens from the new source." },
      { "label": "B: Replace", "description": "Overwrite the entire MINT.md with fresh extraction." },
      { "label": "C: Cancel", "description": "Stop. Keep existing MINT.md as-is." }
    ]
  }]
}
```

## Phase 1: Extract

Read the source and extract raw values. The extraction method depends on source type.

### From Figma

Use `get_design_context` with the file key and node ID from the URL. Also use
`get_variable_defs` if the file has variables defined. Extract:

- Color variables/styles → Brand color tokens
- Text styles → Typography tokens (font family, size, weight, line height, letter spacing)
- Spacing (from auto-layout) → Spacing scale
- Effects (shadows, blurs) → Elevation tokens
- Corner radius patterns → Shape language

### From Website

Use `WebFetch` to grab the page HTML. Then fetch each linked stylesheet URL
(look for `<link rel="stylesheet" href="...">` in the HTML). Extract from the
combined CSS:

- CSS custom properties (`:root` / `[data-theme]` vars) → Direct token mapping
- `font-family` declarations → Typography tokens
- Color values (hex, rgb, hsl) by frequency → Primary/neutral/accent identification
- `box-shadow` values → Elevation tokens
- Recurring padding/margin/gap values → Spacing scale
- `border-radius` values → Shape language

If the site uses CSS-in-JS or inline styles and WebFetch returns minimal CSS,
fall back to screenshot analysis of the page (take a screenshot via the URL
if possible, or ask the user to provide one).

### From Screenshot/Image

Analyze the visual design:

- Dominant colors → Primary, neutral, accent candidates
- Font rendering → Identify typefaces (state the identification, don't hedge)
- Whitespace patterns → Infer spacing scale
- Shadow depth → Infer elevation levels
- Corner shapes → Shape language

### From CSS/Code

Parse token values directly:

- CSS custom properties → Map to Brand/Alias/Map layers
- Design token JSON (Style Dictionary, Figma tokens) → Direct mapping
- Tailwind config → Extract scale values
- SCSS variables → Map to tokens

### From Description

Derive a system from the description. Use the described aesthetic to select:

- Color palette that matches the vibe
- Typography that fits the tone
- Spacing scale (default 4px base unless description implies otherwise)
- Standard elevation and opacity values

## Phase 2: Structure

Convert raw extracted values into the three-layer token system.

### Color Mapping

1. Identify the primary color (most prominent brand/action color).
2. Generate the full 50-950 scale using compounding opacity (20% per step from hero at 500).
3. Identify the neutral color (text, borders, backgrounds).
4. Generate neutral 50-950 scale.
5. If an accent color is visible, generate accent 50-950 scale.
6. Create semantic aliases: `Alias/primary`, `Alias/surface`, `Alias/text-primary`, etc.
7. Create Map tokens for light/dark: `Map/text/heading`, `Map/surface/default`, etc.
   If the source only shows one theme, derive the other from the visible one.

### Typography Mapping

1. Identify display, body, and data fonts (data may equal body if only two are visible).
2. Extract or derive the type scale: hero, h1, h2, h3, body-lg, body, body-sm, caption.
3. Map to responsive breakpoints (desktop/mobile) — if only one is visible, derive
   mobile by scaling down (roughly 0.75x for headings, 1x for body).
4. Create text styles: Display/Hero, Display/H1, Display/H2, Body/Default, Body/Small, etc.

### Spacing Mapping

1. Measure or extract the spacing values used.
2. Fit to a scale: 2xs, xs, sm, md, lg, xl, 2xl, 3xl, 4xl.
3. Identify the base unit (usually 4px or 8px).

### Other Tokens

- **Opacity:** Extract or default to: disabled=0.4, hover=0.08, pressed=0.12, overlay=0.5, loading=0.6
- **Elevation:** Extract shadow values or default to sm/md/lg levels.
- **Surfaces:** Map background colors to sunken/default/raised/overlay.
- **Contrast pairings:** Calculate WCAG ratios for all text-on-background combinations.

## Phase 3: Present + Confirm

Show the user the complete extracted system. Use a specimen HTML file for visual
presentation (same pattern as mint-system):

Write `~/Downloads/mint-kit/specimen.html` with a preview showing:
- Color scales (primary, neutral, accent)
- Typography samples at each scale level
- Spacing visualization
- Surface/elevation samples

Then ask ONE question:

```json
{
  "questions": [{
    "header": "Review",
    "question": "Here's the extracted design system. Review the specimen in your browser. Everything looks correct unless you tell me otherwise.",
    "multiSelect": false,
    "options": [
      { "label": "A: Looks good, write MINT.md (Recommended)", "description": "Write the full MINT.md with these tokens." },
      { "label": "B: Fix some things", "description": "Tell me what's wrong, I'll adjust and re-present." },
      { "label": "C: Start over with different source", "description": "This extraction missed the mark. Try a different input." }
    ]
  }]
}
```

If B: the user describes corrections. Apply them, regenerate the specimen, and
re-present. Repeat until A.

## Phase 4: Output

Write MINT.md in the current working directory.

### New MINT.md

Use the exact template from mint-system Phase 5. All sections:

```
# [Product Name] — Design System

Extracted from: [source URL/description]
Generated by /mint-extract on [date]

## Aesthetic Direction
## Shape Language
## Typography
### Type Scale
### Text Styles
## Color
### Brand Tokens
### Alias Tokens (Semantic)
### Map Tokens (Light/Dark)
### CSS Custom Properties
## Fonts
## Spacing
## Opacity
## Elevation
## Surfaces
## Accent Color (if detected)
## Contrast Pairings
### Recommended Pairings (AA at 16px body)
## Responsive Typography
## Motion
## Decisions Log
## Component Tokens
```

The "Extracted from" line replaces the "Figma source" line. The "Decisions Log"
records what was extracted vs. derived (e.g., "Dark mode derived from light — source
only showed light theme").

### Merge into Existing MINT.md

Read the existing MINT.md. For each section:

- **Existing value matches extraction:** Keep existing (it's already confirmed).
- **Existing value differs from extraction:** Keep existing (user already decided).
- **Section empty or missing in existing:** Fill from extraction.
- **New tokens not in existing:** Add them.

After merge, show a summary of what changed:
```
Merged into existing MINT.md:
- Added: 11 color tokens (accent scale)
- Added: responsive typography breakpoints
- Filled: elevation values (were empty)
- Kept: all existing typography decisions (matched extraction)
- Kept: primary/neutral colors (already set)
```

## Phase 5: Handoff

After MINT.md is written:

> "MINT.md is ready. Next step: run `/mint-system` — it will detect the existing
> MINT.md and offer to skip consultation (Phases 1-3) and jump straight to Figma
> variable creation (Phase 4). That gives you a published token library that
> `/mint-lib` can consume."

The flow is: **mint-extract → mint-system (fast path) → mint-lib**.

mint-lib requires published Figma variables. mint-extract outputs MINT.md only —
it does not create Figma variables. mint-system's fast path bridges that gap.

Done. No plan mode, no further prompts.
