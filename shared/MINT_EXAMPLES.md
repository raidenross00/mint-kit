# Mint Kit — Consistency Anchors

Every pattern below MUST be identical across all Mint Kit skills. These are not
guidelines — they are exact formats. If a skill deviates, it's a bug.

## Ownership Rule — Preventing Drift

This file defines FORMATS (how things look). The protocol docs own the LOGIC
(when and why). If a format here conflicts with the protocol doc that owns it:

| Format | Owned by | If conflict, update... |
|--------|----------|----------------------|
| AskUserQuestion structure | ASKUSER_API.md | this file |
| Progressive grid widths | CONSULTATION_FLOW.md | this file |
| Recovery one-liner | FIGMA_API.md | this file |
| Checkpoint one-liner | MINT_CHECKPOINT.md | this file |
| Verification dispatch | MINT_VERIFICATION.md | this file |
| Figma variable structure | mint-system SKILL.md Phase 4 | this file |
| Entry gate (no-prompt) | mint-system SKILL.md § Entry Gate | this file |
| Fast path (MINT.md → Phase 4) | mint-system SKILL.md § Fast Path | this file |
| Update check preamble | MINT_UPGRADE.md | this file |

Protocol docs are authoritative. This file mirrors them for quick reference.

**Before editing ANY Mint Kit file:** Read `MINT_UPDATE_PROTOCOL.md` for the full
dependency map and per-file checklist. Every change must propagate to downstream files.

## AskUserQuestion Structure

Every AskUserQuestion call follows this 4-part structure:

1. **Re-ground** — remind the user where they are and what's locked
2. **Explain** — what this decision is and why it matters (1-2 sentences)
3. **Recommend** — which option and WHY (connected to vibe lock or prior decisions)
4. **Options** — 2-4 opinionated options, recommended option FIRST (position 1)

```json
{
  "questions": [{
    "header": "Color",
    "question": "Your vibe lock says [warm, bold]. This is the primary color — it defines CTAs, links, and brand recognition. I recommend A because [reason tied to vibe lock and research].",
    "multiSelect": false,
    "options": [
      { "label": "A: Warm Coral (Recommended)", "description": "[WHY — tied to vibe lock, research, or prior decisions]" },
      { "label": "B: Deep Teal", "description": "[tradeoff vs A]" },
      { "label": "C: Electric Violet", "description": "[tradeoff vs A]" },
      { "label": "D: Olive Gold", "description": "[tradeoff vs A]" }
    ]
  }]
}
```

**The recommended option MUST be position 1.** The UI auto-selects position 1.
If the recommendation is buried at position 3, the user has to actively hunt for it.

## Pick + Lock Two-Tab Pattern

For visual decisions with specimens, use TWO tabs:

**Tab 1 — "Pick":** the 4 options (A/B/C/D) with recommendations
**Tab 2 — "Lock":** appears after pick, offers Lock / More like this / Chat

```json
{
  "questions": [
    {
      "header": "Pick",
      "question": "[grounding + recommendation]. Which direction?",
      "options": [
        { "label": "A: [Name] (Recommended)", "description": "[why]" },
        { "label": "B: [Name]", "description": "[tradeoff]" },
        { "label": "C: [Name]", "description": "[tradeoff]" },
        { "label": "D: [Name]", "description": "[tradeoff]" }
      ]
    },
    {
      "header": "Lock",
      "question": "Happy with your pick, or want to explore more?",
      "options": [
        { "label": "Lock it (Recommended)", "description": "Approve this choice. Move to the next decision." },
        { "label": "More like this", "description": "Keep the direction, show me 4 more variations." },
        { "label": "Chat about this", "description": "I want to discuss before deciding." }
      ]
    }
  ]
}
```

## Checkpoint One-Liner Format

In skill files, every checkpoint is a single bold line:

```
**Checkpoint:** Update session — `decisions.{category}.{key}` locked, phase `{id}` complete.
```

Or for Figma state:
```
**Checkpoint:** Update session — `figmaState` updated with new collection/variable IDs.
```

Or for archive:
```
**Checkpoint:** Archive session — rename `{skill}-session.json` → `{skill}-session.done`.
```

Never expand these into multi-line blocks. The full protocol is in MINT_CHECKPOINT.md.

## Specimen File Naming

```
~/mint-kit/specimen.html
```

ONE file. Overwritten on each write. Auto-refreshes via the polling script.
Never create multiple specimen files (specimen-color.html, specimen-type.html).
The single file IS the consultation — each write is a state change.

## Figma Code Comment Format

Every `use_figma` call starts with a comment identifying the target:

```javascript
// TARGET: mint-system file (fileKey: abc123)
```
or
```javascript
// TARGET: component library file (fileKey: xyz789)
```

Never omit this. When debugging failed calls, the comment is how you know which
file was targeted.

## Terminal Voice During Silent Builds

**During consultation flow (progressive specimen build):** Say NOTHING in the
terminal between the browser handoff AskUserQuestion and the final Pick+Lock
AskUserQuestion. All narration lives in the HTML. Zero terminal output.

**During standard flow:** Brief status is fine ("Building type specimen...") but
never narrate what you're creating. The user doesn't need "I'm now adding the
fourth column with a geometric sans-serif option."

**During token creation (Phase 4) and auto-generation (Tiers 1-4):** Brief
status per batch ("Creating Brand color variables..." / "Building Tier 2 molecules,
batch 1 of 2..."). Never describe individual variables or components.

## Recovery One-Liner Format

In skill files, every recovery reference is a single bold line:

```
**On failure:** Follow recovery chain in FIGMA_API.md § Error Handling.
```

Never inline the recovery steps. The full protocol is in FIGMA_API.md.

## Consultation Flow Progressive Grid Widths

```
Write 1: grid-template-columns: 1fr         (max-width: 480px, centered)
Write 2: grid-template-columns: 1fr 1fr     (max-width: 960px)
Write 3: grid-template-columns: 1fr 1fr 1fr (max-width: 1200px)
Write 4: grid-template-columns: repeat(4, 1fr) (full width)
```

Each write adds a column. The grid expands. Never start at 4 columns.

## Figma Variable Structure (What Phase 4 Creates)

```
Collections:
├── Brand (1 mode: Default)
│   ├── Color/primary-50 through primary-950 (11 vars)
│   ├── Color/neutral-50 through neutral-950 (11 vars)
│   ├── Color/semantic-success, warning, error, info (4 vars)
│   ├── Color/accent-50 through accent-950 (11 vars, if locked)
│   ├── Space/2xs through 4xl (9 vars)
│   ├── Opacity/disabled, hover, pressed, overlay, loading (5 vars)
│   ├── Type/size-hero through size-xs (8 vars)
│   ├── font-family/display, body, data (3 STRING vars)
│   └── font-weight/regular, medium, semibold, bold (4 FLOAT vars)
├── Alias (1 mode: Default)
│   ├── primary → Brand/Color/primary-500
│   ├── surface → Brand/Color/neutral-50
│   ├── text-primary → Brand/Color/neutral-900
│   └── ... (semantic mappings)
├── Map (2 modes: Light, Dark)
│   ├── text/heading → Alias/text-primary (Light) / neutral-100 (Dark)
│   ├── surface/default → white (Light) / neutral-900 (Dark)
│   └── ... (theme-aware mappings)
└── Responsive (2 modes: Desktop, Mobile)
    ├── h1/font-size → 48 (Desktop) / 32 (Mobile)
    ├── h1/line-height → 56 (Desktop) / 40 (Mobile)
    └── ... (breakpoint-aware typography)

Text Styles:
├── Display/Hero, Display/H1, Display/H2
├── Body/Default, Body/Small, Body/Large
└── Data/Default, Data/Small, Data/Tabular

Effect Styles:
├── Elevation/sm, Elevation/md, Elevation/lg
└── Focus/ring
```

This is the EXPECTED output of mint-system Phase 4. If verification finds
something missing from this structure, it's a bug.

## Verification Dispatch Format

In skill files, verification is dispatched with:

```
**Verify:** Dispatch verification agent per MINT_VERIFICATION.md. Compare MINT.md
intent vs Figma actual state. Gate on PASS before proceeding.
```

Never inline the verification protocol. The full process is in MINT_VERIFICATION.md.

## Entry Gate Format (No-Prompt Invocation)

When a user invokes `/mint-system` with no prompt text, the Entry Gate presents
an adaptive welcome. Only relevant options are shown:

```json
{
  "questions": [
    {
      "header": "Mint System",
      "question": "What are we building?",
      "multiSelect": false,
      "options": [
        { "label": "Build [product] tokens in Figma (Recommended)", "description": "MINT.md has all the decisions. Skip to Figma variable creation." },
        { "label": "Continue [product name]", "description": "Resume from [phase]. Locked: [summary of decisions]." },
        { "label": "New design system", "description": "Start fresh. I'll walk you through color, type, and spacing decisions." }
      ]
    },
    {
      "header": "Figma file",
      "question": "I need a Figma file to build your design system in. Got one already, or should I create a new file?",
      "multiSelect": false,
      "options": [
        { "label": "I have a file", "description": "I'll paste the URL after submitting" },
        { "label": "Create one for me", "description": "I'll make a new file in your Figma workspace" }
      ]
    }
  ]
}
```

Rules:
- Recommended option is always position 1
- "New design system" — always shown, never recommended when others exist
- "Continue [product]" — only if session file exists and < 24h old
- "Update [product]" — only if MINT.md exists in `~/mint-kit/projects/{slug}/` but incomplete
- "Build tokens in Figma" — only if MINT.md is complete in `~/mint-kit/projects/{slug}/` (primary+neutral scales + typography + spacing)
- Multiple projects listed as separate options if they exist
- Figma file tab is always included
- If only "New design system" applies (no session, no projects in `~/mint-kit/projects/`) — skip the question, go straight to Phase 1
- If user provided a prompt — skip Entry Gate entirely

Owned by: mint-system SKILL.md § Entry Gate

## Fast Path Format (MINT.md → Phase 4)

When the user selects "Build in Figma" from Entry Gate or Phase 1, the complete
MINT.md (at `~/mint-kit/projects/{slug}/MINT.md`) question adds a Figma file tab:

```json
{
  "questions": [
    {
      "header": "Existing",
      "question": "You have a complete MINT.md for [product] with [N color scales, font names, spacing]. Want to go straight to Figma, or revisit decisions first?",
      "multiSelect": false,
      "options": [
        { "label": "Build in Figma (Recommended)", "description": "Skip consultation. Load all tokens from MINT.md and create Figma variables directly." },
        { "label": "Review + update first", "description": "Walk through the system. Keep existing decisions, fill gaps, change what's wrong." },
        { "label": "Start fresh", "description": "Ignore this MINT.md. Every decision from scratch." },
        { "label": "Cancel", "description": "Stop. Keep existing MINT.md as-is." }
      ]
    },
    {
      "header": "Figma file",
      "question": "I need a Figma file to build your design system in. Got one already, or should I create a new file?",
      "multiSelect": false,
      "options": [
        { "label": "I have a file", "description": "I'll paste the URL after submitting" },
        { "label": "Create one for me", "description": "I'll make a new file in your Figma workspace" }
      ]
    }
  ]
}
```

After "Build in Figma" selection, the fast path hydrates session decisions from
`~/mint-kit/projects/{slug}/MINT.md` and jumps to Phase 4. No color scales are
re-generated — the exact hex values from MINT.md are used.

Owned by: mint-system SKILL.md § Fast Path

## Update Check Preamble Format

In skill files, the update check preamble is a fixed block after the frontmatter:

```markdown
## Preamble (run first, silently)

\`\`\`bash
_UPD=$(~/.claude/skills/mint-kit/bin/mint-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
\`\`\`

**If output starts with `JUST_UPGRADED`:** Read `shared/MINT_UPGRADE.md` §2. Show What's New, then continue.
**If output starts with `UPGRADE_AVAILABLE`:** Read `shared/MINT_UPGRADE.md` §1. Follow inline upgrade flow.
**If no output:** Continue normally. Say nothing about updates.
```

This block MUST be identical in every SKILL.md. The full upgrade protocol is in
MINT_UPGRADE.md. Never inline upgrade logic into skill files.

## MINT.md Template

This is the canonical MINT.md format. Every skill that writes a MINT.md MUST use
these exact section headings, table column headers, and ordering. The content
differs per skill (mint-system fills from consultation, mint-extract fills from
extraction), but the container is identical.

Owned by: mint-system SKILL.md Phase 5

```markdown
# Design System — [Project Name]

[Source line — skill-specific, e.g. "Figma source: [URL]" or "Extracted from: [URL]"]
Generated by /[skill-name] on [date]

## Aesthetic Direction
[Approved direction and rationale]

## Shape Language
[Shape philosophy — round vs sharp vs mixed. Specific radius/border values
are NOT locked here — mint-lib discovers those.]

## Typography
- Display: [font] — [rationale]
- Body: [font] — [rationale]
- Data: [font] — [rationale]

### Type Scale
| Token | Size |
|-------|------|
| Brand/Type/size-hero | 72px |
| ... | ... |

### Text Styles
| Style | Font | Size | Line Height | Letter Spacing |
|-------|------|------|-------------|----------------|
| Display/Hero | [font] Bold | 72px | 80px | -1px |
| ... | ... | ... | ... | ... |

## Color

Color scales generated using Adaptive OKLCH (13-step: 50-950, chroma-aware endpoints).

### Brand Tokens
| Token | Hex | RGB (0-1) | Usage |
|-------|-----|-----------|-------|
| Brand/Color/primary-500 | #XXXXXX | r,g,b | Primary actions (hero) |
| ... | ... | ... | ... |

### Alias Tokens (Semantic)
| Token | → Brand Reference | Usage |
|-------|-------------------|-------|
| Alias/primary | → Brand/Color/primary-500 | Primary action fill |
| ... | ... | ... |

### Map Tokens (Light/Dark)
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| Map/text/heading | Alias/text-primary | neutral-100 | Heading text |
| Map/surface/default | white | neutral-900 | Page background |
| Map/border/default | neutral-200 | neutral-700 | Default borders |
| ... | ... | ... | ... |

### CSS Custom Properties
` ` `css
/* Hex values (generated via compounding opacity from hero) */
--color-primary-500: #XXXXXX;
/* Repeat for all Brand and Alias tokens */
` ` `

## Fonts
| Token | Type | Value |
|-------|------|-------|
| Brand/font-family/display | STRING | [display font name] |
| Brand/font-family/body | STRING | [body font name] |
| Brand/font-family/data | STRING | [data font name] |
| Brand/font-weight/regular | FLOAT | 400 |
| Brand/font-weight/medium | FLOAT | 500 |
| Brand/font-weight/semibold | FLOAT | 600 |
| Brand/font-weight/bold | FLOAT | 700 |

## Spacing
| Token | Value |
|-------|-------|
| Brand/Space/2xs | 2px |
| ... | ... |

## Opacity
| Token | Value | Usage |
|-------|-------|-------|
| Brand/Opacity/disabled | 0.4 | Disabled elements |
| ... | ... | ... |

## Elevation
| Style | Spec |
|-------|------|
| Elevation/sm | 0 1px 3px rgba(0,0,0,0.1) |
| ... | ... |

## Surfaces
| Token | Usage | Light Value | Dark Value |
|-------|-------|-------------|------------|
| Alias/surface-sunken | Recessed areas, input backgrounds | neutral-100 | neutral-950 |
| Alias/surface | Default page background | neutral-50/white | neutral-900 |
| Alias/surface-raised | Cards, elevated content | white + Elevation/sm | neutral-800 |
| Alias/surface-overlay | Modals, drawers | white + Elevation/lg | neutral-800 + Elevation/lg |

## Accent Color
_Include only if accent was identified. Omit this section if none._

| Token | Hex | Usage |
|-------|-----|-------|
| Brand/Color/accent-500 | #XXXXXX | Secondary actions, links, highlights |
| ... (full 50-950 scale) | ... | ... |

Relationship to primary: [analogous/complementary/split-comp/triadic]
Text-safe steps: [list steps that pass AA on white, e.g., 600+]

## Contrast Pairings
| Background | Heading | Body | Muted | On-Primary | On-Dark |
|------------|---------|------|-------|------------|---------|
| primary-500 | [ratio] [level] | [ratio] [level] | ... | ... | ... |
| neutral-50 | [ratio] [level] | ... | ... | ... | ... |
| ... | ... | ... | ... | ... | ... |

### Recommended Pairings (AA at 16px body)
| Background | Text Color | Ratio | Level |
|------------|-----------|-------|-------|
| [Only combinations with ratio >= 4.5] | ... | ... | AA/AAA |

## Responsive Typography
| Level | Desktop Size | Desktop Line Height | Mobile Size | Mobile Line Height |
|-------|-------------|--------------------|-----------|--------------------|
| h1 | 48px | 56px | 32px | 40px |
| h2 | 32px | 40px | 28px | 36px |
| ... | ... | ... | ... | ... |

## Motion
_Deferred to implementation. Decide timing and easing when you can test in a real browser._

## Decisions Log
[Key decisions made during the process with rationale]

## Component Tokens
_Component-level tokens (Role/*, radius, border-weight, component padding) are
created by /mint-lib during the DNA phase and appended below._
```

## Color Scale Generation

**13-step scale:** 50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 950.
7 light steps + hero + 5 dark steps. Asymmetric: more background/border steps
(light side), fewer text/dark-surface steps (dark side). Matches how designers
actually use scales in light and dark mode.

**Method: Adaptive OKLCH** for chromatic heroes (OKLCH C ≥ 0.03):

1. **L distribution**: Even-spread in OKLCH L space. Light end fixed at L=0.97.
   Dark end is chroma-aware: `min(0.30, base + heroC × 0.8)`. Chromatic colors
   stop before near-black (where color is lost). Near-neutrals go darker.

2. **Chroma**: Gamut-ratio (maintain hero's percentage of available gamut at each
   lightness) × bilateral taper. Hero is the chroma peak. Light side: quadratic
   falloff with 20% floor (backgrounds are tinted, not gray). Dark side: taper
   scales with heroC (high chroma heroes get more taper, low chroma heroes
   preserve what little color they have).

3. **Neutral fallback** (OKLCH C < 0.03): Compounding opacity. Light side at 80%
   alpha, dark side at 70% alpha (more aggressive to reach near-black in 5 steps).
   Intermediate steps 150/250 interpolated from neighbors.

**For mint-extract (browser path):** The `extract-browser.js` script pre-computes
13-step scales in the `colorScales` output field via `generateScale()`. Use those
hex values directly — do NOT re-generate scales manually.

**For mint-system:** The full Adaptive OKLCH code is in mint-system SKILL.md
§ Scale Generation — Adaptive OKLCH.

**Tunable knobs** (in `SCALE_KNOBS` at top of extract-browser.js):
```
LIGHT_END: 0.97          // L for step 50
DARK_BASE: 0.13          // darkest endpoint for neutrals
DARK_CHROMA_SCALE: 0.8   // how much heroC lifts the dark endpoint
DARK_CAP: 0.30           // max dark endpoint for saturated heroes
LIGHT_CHROMA_POWER: 2    // light-side falloff exponent
LIGHT_CHROMA_FLOOR: 0.20 // minimum tint at step 50
DARK_CHROMA_COEFF: 0.45  // max dark desaturation
NEUTRAL_THRESHOLD: 0.03  // below this → compounding opacity
```

Owned by: mint-system SKILL.md § Scale Generation
