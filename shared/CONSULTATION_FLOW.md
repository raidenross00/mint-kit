# Mint Kit — Consultation Flow (Progressive Specimen Build)

For HIGH-STAKES visual decisions, use this pattern instead of the standard
AskUserQuestion-with-specimen flow. The entire consultation happens in the
browser. The terminal goes silent during the build.

## When to use this

Only for decisions where the visual argument matters and the user needs to
see reasoning alongside the artifact. These are identity-level choices that
define the system's personality.

**Use consultation flow:**
- Primary color (mint-system 3b-i) — the personality
- Display font (mint-system 3c-i) — the first impression
- Neutral color (mint-system 3b-ii) — the workhorse that defines the feel
- Button DNA (mint-lib) — the component that sets the tone for everything
- Hero background direction (mint-surface) — the signature visual

**Use standard AskUserQuestion + single specimen write:**
- Semantic colors — functional, low creative latitude
- Accent color — constrained by the locked primary
- Body font — constrained by the locked display font
- Data font — functional choice
- Spacing scale — systematic, not emotional
- Text colors — derived, minimal creative decision
- Input/Card DNA (mint-lib) — constrained by Button DNA
- Everything in mint-icons, mint-screens

The rule: if the decision defines the system's identity, use consultation flow.
If the decision is constrained by prior identity decisions, use standard flow.

## The Pattern

### 1. Browser handoff (AskUserQuestion gate)

Before the first write, use AskUserQuestion with a single option to force a pause.
The user must acknowledge they're watching the browser before the silent build starts.
This is impossible to miss (unlike a text message that scrolls past).

```json
{
  "questions": [{
    "header": "Browser",
    "question": "[Describe what's about to appear]. Switch to your browser now. I'll ping you here when it's time to choose.",
    "multiSelect": false,
    "options": [
      { "label": "I'm watching the browser", "description": "Start building." }
    ]
  }]
}
```

After the user confirms, say NOTHING in the terminal until the final
AskUserQuestion fires. No narration, no commentary, no status updates.
Just silent Write calls.

### 2. Progressive specimen build (browser)

Write specimen.html multiple times. Each write adds a column to the grid.
Narration lives INSIDE each column card, not in the terminal. The page
accumulates reasoning as it builds.

**Column card structure:**
```
┌─────────────────────────┐
│ ACT N — [ROLE LABEL]    │  ← muted, uppercase, 10px
│                         │
│ [Narration paragraph]   │  ← 13px, #374151, under 60 words
│                         │
│ [Option label + badge]  │
│ ┌─────────────────────┐ │
│ │   Visual specimen    │ │  ← swatch, font sample, etc.
│ └─────────────────────┘ │
│ [Supporting details]    │  ← scale, legibility, weights
└─────────────────────────┘
```

**Progressive grid:**
- Write 1: `grid-template-columns: 1fr` (max-width: 480px, centered)
- Write 2: `1fr 1fr` (max-width: 960px)
- Write 3: `1fr 1fr 1fr` (max-width: 1200px)
- Write 4: `repeat(4, 1fr)` (full width)

**Specimens are served over HTTP** (not file://). A Python HTTP server starts
at the beginning of Phase 3 and serves from `~/mint-kit/`. This
ensures auto-refresh works on both Linux and macOS (macOS browsers block
`fetch()` on file:// URLs). See mint-system SKILL.md "Specimen server" for
the setup. The server is killed during cleanup.

**Summary bar** after the grid (full-width): compares all options, states
the recommendation, ends with "Head back to terminal to make your pick."

### 3. AskUserQuestion (terminal)

Standard Pick + Lock pattern. The user alt-tabs back once to make their pick.

### 4. Iteration

"More like this" uses a STANDARD single-write grid (not progressive build).
The progressive build serves first-impression pacing. On iteration, the user
already understands the pattern and wants to compare quickly.

## Voice rules for narration (in HTML)

- Every narration must state a TRADEOFF, not a description
- Connect recommendations to the vibe lock / prior locked decisions
- Never badmouth alternatives — state what each gains and costs
- Research must appear in narration — unused research was wasted
- Under 60 words per column. Columns are narrow in 4-up.
- All specimens use locked decisions as the visual foundation. If colors are
  locked, specimen backgrounds and text use the locked palette, not defaults.
  If fonts are locked, specimens render in the locked typefaces. The consultation
  flow inherits every prior lock — it never falls back to generic styling.

## Consistency Anchors

The exact formats for progressive grid widths, terminal voice during silent
builds, and specimen file naming are defined in `MINT_EXAMPLES.md`. This file
describes WHEN and WHY to use consultation flow. MINT_EXAMPLES.md defines the
exact HOW (grid CSS values, file paths, voice rules). If they conflict, update
MINT_EXAMPLES.md to match this file — this file owns the consultation flow spec.

## Why this exists

Claude Code shows diffs/content for every Write and Edit tool call. During
a progressive specimen build, this means the user sees walls of HTML code
scrolling through the terminal between each visual update. Moving narration
into the HTML means the terminal can go silent. The browser becomes the
entire consultation experience. On a demo call, the presenter never shows
the terminal.

This is NOT the default for all decisions. Most decisions are fast, low-stakes,
and well-served by the standard AskUserQuestion flow. The consultation flow
adds ~30-60 seconds per decision point. Use it only where the visual argument
earns that time.
