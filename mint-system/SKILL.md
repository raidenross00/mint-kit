---
name: mint-system
description: Build a complete design system with live visual approval in Figma. Research, propose, build specimens with use_figma Plugin API, create 3-layer token variables (Brand/Alias/Role), lock into MINT.md. Part of the Mint Kit series.
---

# /mint-system — Design System Builder (Figma-native)

Build a complete design system through conversation. Each design decision is built
live in Figma via `use_figma` as you discuss it. The user reviews and approves
visually in Figma. At the end, MINT.md is generated from the approved Figma state.

Part of the **Mint Kit** series:
1. **`/mint-system`** — tokens, variables, MINT.md (you are here)
2. `/mint-lib` — component library (120 components)
3. `/mint-surface` — backgrounds, patterns, decorative treatments
4. `/mint-icons` — icon system
5. `/mint-screens` — full page layouts

## Voice + Posture — MANDATORY

Read and follow all rules in `~/.claude/skills/mint-kit/shared/MINT_VOICE.md`.

## Token Ownership — What mint-system Owns vs. Doesn't

**mint-system OWNS** (system-level primitives):
- Color palette + full scales (primary, neutral, accent, semantic)
- Font stacks + type scale (display, body, data families + sizes)
- Spacing units (the raw scale: 2xs through 4xl)
- Elevation / shadows (the raw effect styles)
- Opacity scale (disabled, hover, pressed, overlay, loading)
- Aesthetic direction + design rationale

**mint-system does NOT own** (component-level tokens — discovered by /mint-lib):
- Border-radius values (what "interactive radius" vs "container radius" means)
- Border-weight values (thin/medium/thick stroke choices)
- Input heights (sm/md/lg sizing)
- Icon gap (space between icon and label)
- Component-specific padding (button padding, input padding, card padding)
- All Role/* variables (these are created by mint-lib during DNA phase)

mint-system creates **Brand** (raw primitives) and **Alias** (semantic mappings).
It does NOT create Role variables. The Role layer is mint-lib's job — it discovers
what components need by building them.

MINT.md grows as each Mint Kit skill runs. mint-system writes the initial version.
mint-lib appends component patterns and new tokens it discovers.

---

## Figma Plugin API Reference

Read and follow all rules in `~/.claude/skills/mint-kit/shared/FIGMA_API.md`.

### 50K Character Limit — Partition Boundaries for mint-system

**Partition boundaries for token creation:**
- Call 1: Brand color variables (primary + neutral scales)
- Call 2: Brand color variables (accent + semantic + interactive states)
- Call 3: Brand spacing + opacity + type scale variables
- Call 4: Text Styles (all font loading + style creation)
- Call 5: Effect Styles (shadows, focus rings)
- Call 6: Alias color variables
- Call 7: Alias spacing + layout variables

**Partition boundaries for specimen pages:**
- One `use_figma` call per specimen frame (each of the 4 options)
- Never try to build all 4 in a single call
- **POSITIONING — prevent overlap:** Each frame must set explicit x/y coordinates.
  Use 400px frame width + 50px gap (x: 0, 450, 900, 1350). Subsequent rows
  offset y by previous row height + 80px gap. Set x/y AFTER configuring
  auto-layout. After building all frames in a row, call `get_screenshot` to
  verify no overlap before presenting to user.

---

## AskUserQuestion API — How To Use It

Read and follow all rules in `~/.claude/skills/mint-kit/shared/ASKUSER_API.md`.

---

## Context Window Management

This skill can be long-running. Protect the context window:

**Between phases:** After each major phase completes, write a checkpoint summary
to yourself (not to the user) noting: which phase completed, key decisions made,
all variable/frame IDs created, any issues encountered. Keep this under 200 words.

**If context is getting long:** Before Phase 4 (token creation), summarize all
Phase 1-3 decisions into a compact reference block. Drop the conversational
back-and-forth — keep only: approved fonts, approved colors, approved spacing,
approved aesthetic direction, and the Figma fileKey.

**Checkpoint/resume:** If the user says "continue" or "pick up where we left off",
check MINT.md for partial progress. If Phase 3 decisions are recorded but
tokens aren't created, resume at Phase 4.

---

## Phase 0: Permissions

This is mint-system. It makes many Figma calls during token creation and specimen building.
Read and follow `~/.claude/skills/mint-kit/shared/MINT_PERMISSIONS.md`. Use "Mint System" as the skill name.
If yes: use `update-config` skill to add both. If no: continue.

---

## Phase 1: Context Gathering (multi-step wizard)

Before building the wizard:
1. Check for MINT.md in the CURRENT working directory ONLY (NOT a recursive search).
   If `./MINT.md` exists, this is a resume/update. If not, this is a new system.
   Do NOT search other projects or parent directories. The user invoked /mint-system
   HERE — they want a design system for THIS project, not a picker of other projects.
2. Read project context from the codebase:
   - `README.md` (first 50 lines) — what the product is, who it's for
   - `package.json` (first 20 lines) — project name, description, dependencies
   - Directory listing of `src/`, `app/`, `pages/`, `components/` — what exists
   - If the codebase is empty and purpose is unclear: suggest the user describe
     the product before proceeding. Don't guess blindly.
3. Infer what you can from the user's initial prompt
4. Pre-fill everything you can — confirm, don't interrogate

Then present ONE `AskUserQuestion` call that combines everything as a multi-step
wizard. Adapt the `questions` array based on what you found.

### Building the questions array

**If MINT.md exists in cwd — ask about it BEFORE the wizard:**
Don't add a tab. Just ask in plain text: "You already have a MINT.md here. Want to
**update** it, **start fresh** (overwrites), or **cancel**?" This is a quick yes/no,
not a project picker. If they say update, read it and use the existing decisions as
starting context for Phase 3. If they say fresh, proceed normally.

Do NOT show design files from other projects. Ever. The user ran /mint-system in
this directory for this project.

**CRITICAL — Options must answer the question asked.** If your question asks "what
type of product is this?", the options must be product types ("Marketing site",
"Tool UI", "Docs site"). NOT vibes, NOT research preferences, NOT meta-actions.
Every option should be a valid direct answer to the question text. If the question
and options don't match, you've built a broken form.

**Tab 1 — header: "Product" or "Research":**

If you STILL need to know what the product is (user's prompt didn't say):
```json
{
  "header": "Product",
  "question": "What will this design system dress? The token choices change depending on the surface.",
  "multiSelect": false,
  "options": [
    { "label": "Marketing site", "description": "Landing pages, hero sections, conversion flows. Editorial feel." },
    { "label": "Tool / app UI", "description": "Dashboards, forms, data tables. Functional, dense." },
    { "label": "Docs / developer site", "description": "Documentation, code samples, guides. Readable, structured." },
    { "label": "Component library", "description": "Storybook-style showcase. The tokens ARE the product." }
  ]
}
```

If you already know the product (user told you), skip this tab and go straight
to research:
```json
{
  "header": "Research",
  "question": "Want me to study real products in your space before proposing directions? Seeing what competitors do makes proposals grounded instead of generic.",
  "multiSelect": false,
  "options": [
    { "label": "Research first (Recommended)", "description": "I'll find 5-10 real brands, study their type + color + density, then propose." },
    { "label": "Skip research", "description": "I'll propose from design knowledge. Faster but less grounded." }
  ]
}
```

If you have enough context to propose vibe directions (user gave specifics):
```json
{
  "header": "Brand vibe",
  "question": "Help me understand the brand so I can make the right design calls. What's the vibe? Is this [specific contrast A] or [specific contrast B]? [Weave in 1-2 more questions naturally]",
  "multiSelect": false,
  "options": [
    { "label": "[Direction A] (Recommended)", "description": "[One sentence — what it looks/feels like, a reference]" },
    { "label": "[Direction B]", "description": "[One sentence]" },
    { "label": "[Direction C]", "description": "[One sentence]" },
    { "label": "[Direction D]", "description": "[One sentence]" }
  ]
}
```

These vibe options are YOUR opinionated design proposals based on the user's prompt.
Not generic categories — real directions with personality. Example:
"Premium + minimal: High-end coastal. Think linen, neutral tones, gallery-clean
layouts. Amalfi, not Bondi."

**Tab 2 — header: "Figma file":**
```json
{
  "header": "Figma file",
  "question": "I need a Figma file to build your design system in. Got one already, or should I create a new file?",
  "multiSelect": false,
  "options": [
    { "label": "I have a file", "description": "I'll paste the URL after submitting" },
    { "label": "Create one for me", "description": "I'll make a new file in your Figma workspace" }
  ]
}
```

### After wizard submits

- Extract Figma fileKey (from URL or create new file via `mcp__figma__whoami` + `create_new_file`)
- Store fileKey — every `use_figma` call targets this:
  ```javascript
  // TARGET: mint-system file (fileKey: abc123)
  ```
- If user picked "Research my competitors" → run Phase 2 before proposals
- If user picked a vibe direction → use that to inform Phase 3 proposals

## Phase 2: Research (if selected — strongly recommended)

Research is what makes proposals feel grounded instead of generic. Without it,
you're guessing what "ocean boutique" looks like. With it, you know that Outerknown
uses warm sans-serifs, James Perse is clean California minimal, Tekla is Scandinavian
editorial — and you can propose something that fits OR deliberately breaks from the
category.

**Search for COMPETITORS IN THE USER'S SPACE, not design systems or SaaS tools.**

BANNED SEARCH TARGETS (never use these as research subjects):
Figma, Framer, Linear, Raycast, Vercel, Notion, Stripe, Supabase, Warp, Huly,
or any other generic SaaS/dev-tool brand. These are NOT the user's competitors
unless the user is literally building a competing product in that exact category.

Determine the user's ACTUAL industry from their product description, then search
for real brands in THAT industry.

**Step 1: Find competitors via WebSearch**

Use WebSearch to find 5-10 real products in the user's space:
1. `"[product category] website design"` — e.g., "coastal fashion brand website design"
2. `"[product category] best websites 2025"` — e.g., "luxury beach clothing best websites 2025"
3. `"best [industry] brands"` — e.g., "best ocean inspired fashion brands"
4. `"[product category] [aesthetic] design"` — e.g., "premium coastal clothing minimal design"
5. (Optional) `"[specific competitor] website"` — if the user named references

**Step 2: Visual research via headless browser (if available)**

A headless browser lets you actually SEE competitor sites — screenshots show the
feel, snapshots give you structural data (fonts, colors, layout). This is optional
but dramatically improves research quality.

```bash
_BROWSE=""
[ -x ~/.claude/skills/gstack/browse/dist/browse ] && _BROWSE=~/.claude/skills/gstack/browse/dist/browse
if [ -n "$_BROWSE" ]; then
  echo "BROWSE_READY: $_BROWSE"
else
  echo "BROWSE_NOT_AVAILABLE"
fi
```

If available, visit the top 3-5 competitor sites. The browse binary is a full
headless browser (~100ms per command). Key commands for design research:

```bash
# Navigate to a competitor site
$_BROWSE goto "https://competitor-site.com"

# Take a screenshot — see the overall visual feel
$_BROWSE screenshot "/tmp/design-research-competitor-name.png"

# Get a structural snapshot — returns element tree with ref labels
# Use this to identify fonts, colors, layout structure
$_BROWSE snapshot

# Extract specific CSS properties from elements
$_BROWSE css "h1" "font-family"
$_BROWSE css "h1" "font-size"
$_BROWSE css "h1" "color"
$_BROWSE css "body" "background-color"
$_BROWSE css "p" "font-family"
$_BROWSE css "p" "line-height"

# Get computed accessibility tree (reveals type hierarchy)
$_BROWSE accessibility

# Check responsive layout
$_BROWSE viewport 375x812
$_BROWSE screenshot "/tmp/design-research-competitor-mobile.png"
$_BROWSE viewport 1440x900
```

For each site, analyze from the screenshot + CSS extraction:
- Display font family and weight (exact values from `css` command)
- Body font and how it pairs
- Color temperature (warm/cool/neutral) — extract actual hex values
- Layout density and whitespace strategy (visible in screenshot)
- Spacing patterns (extract padding/margin from key elements)
- What makes it feel premium vs accessible vs editorial vs playful

Read the screenshots with the Read tool to actually see them visually.

If a site blocks the headless browser or requires login, skip it and note why.

**Graceful degradation:**
- Browse available → screenshots + snapshots + WebSearch (richest — you can SEE the sites)
- Browse unavailable → WebSearch only (still good)
- Neither available → built-in design knowledge (always works)

**Step 3: Synthesize using a 3-layer approach**

Three layers, each building on the last:

1. **Tried-and-true:** What design patterns does every product in this category share?
   These are table stakes — users expect them. This is the SAFE baseline.
2. **Trending:** What are the newer/standout brands doing differently? What's emerging
   in the current design discourse?
3. **First-principles:** Given what we know about THIS product's users and positioning,
   is there a reason the conventional design approach is wrong? Where should we
   deliberately break from category norms?

**Eureka check:** If Layer 3 reasoning reveals a genuine design insight — a reason
the category's visual language fails THIS product — name it to the user:
"Every [category] product does X because they assume [assumption]. But this product's
users [evidence] — so we should do Y instead." These insights are the most valuable
output of research. They're rare. When you find one, highlight it.

Present to the user as context:
> "I looked at [brands]. Here's what the [space] landscape looks like:
> most brands use [pattern]. The ones that stand out do [different thing].
> The SAFE choice for your brand is [X]. A distinctive choice would be [Y]
> because [reason]. And something nobody in this space is doing: [Z]."

This research directly informs Phase 3 — every proposal should reference real
brands in the user's space, not abstract font categories or tech design systems.

---

## Phase 2.5: Outside Voices (optional)

After research, offer the user independent design perspectives. This is optional
but valuable — it surfaces directions you might not consider.

Use AskUserQuestion:
> "Want outside design voices? I can get an independent design direction proposal
> from a separate model to challenge my assumptions."
>
> A) Yes, get outside perspectives
> B) No, proceed with your proposal

If yes, dispatch a Claude subagent (via Agent tool) with this prompt:
"Given this product context: [product description, industry, target users, aesthetic
hints from user]. Propose a design direction that would SURPRISE. What would the
cool indie studio do that the enterprise UI team wouldn't?
- Propose an aesthetic direction, typography stack (specific font names), color palette (hex values)
- 2 deliberate departures from category norms
- What emotional reaction should the user have in the first 3 seconds?
Be bold. Be specific. No hedging."

Additionally, check if Codex is available:
```bash
which codex 2>/dev/null && echo "CODEX_AVAILABLE" || echo "CODEX_NOT_AVAILABLE"
```

If Codex is available, also run (in parallel with the subagent):
```bash
codex exec "Given this product context, propose a complete design direction:
- Visual thesis: one sentence describing mood, material, and energy
- Typography: specific font names (not defaults) + hex colors
- Color system: background, surface, primary text, muted text, accent
- 2 deliberate departures from category norms
- Anti-slop: no purple gradients, no 3-column icon grids, no centered everything
Be opinionated. Be specific." -s read-only -c 'model_reasoning_effort="medium"'
```
Use a 5-minute timeout. If Codex fails (auth, timeout, empty), proceed with
subagent output only.

**Synthesis:** Reference both voices in your Phase 3 proposal. Present:
- Areas of agreement between all voices
- Genuine divergences as creative alternatives for the user
- "The outside voice suggested [X] where I'm proposing [Y] — here's why..."

If user chose B, skip entirely and proceed to Phase 3.

---

## Design Knowledge Base

Read `~/.claude/skills/mint-kit/shared/DESIGN_KNOWLEDGE.md` for aesthetic directions,
font recommendations, font blacklist, overused fonts, and AI slop anti-patterns.
Also read `~/.claude/skills/mint-kit/mint-system/FONT_KNOWLEDGE_BASE.md` for the full
categorized font reference (organized by aesthetic direction).

---

## Phase 3: Propose + Build Live

Phase 3 is a funnel: vibe lock (words) → type specimens → color specimens → spacing.
Each step narrows. The vibe lock is the acceptance criteria for everything downstream.

During exploration, specimens use **hardcoded values** — the decisions aren't made yet.
After all dimensions are approved, Phase 4 creates the token system.

### 3a: Vibe Lock (words only — the DNA of the system)

The vibe lock is to mint-system what the Button is to mint-lib. It decides everything
downstream. Spend energy here. Every word must be argued for.

**CRITICAL CONSTRAINT: The vibe lock uses ONLY feelings and analogies. NEVER mention:**
- Font names or classifications (no "geometric sans," no "serif," no "Grotesk")
- Color names or hex values (no "mint," no "teal," no "#FAFBFC," no "slate-blue")
- Specific brand references as visual targets (no "like Stripe's docs")
- Layout specifics (no "12-column grid," no "sidebar")

The user CAN mention these things — their input is unconstrained. The constraint is
on YOUR output in this step only. If the user says "I'm thinking mint green," that's
input you use later in 3c (color). Don't echo it back as part of the vibe lock.

**Propose ONE vibe lock as your recommendation.** Not 4 options. You're a designer
with an opinion. Present it, then ask SPECIFIC questions to refine — never "does
this look good?" or "react to this."

**Step 1: Present the vibe lock template.**

Fill in every field, argue for every word:

```
VIBE LOCK (Recommended):

  Emotion:     [2-3 words — how it FEELS to use this product]

    "[word 1]" not "[alternative]" — [why this word, not the obvious one.
    What does this word mean for the system? What does it exclude?]

    "[word 2]" not "[alternative]" — [same depth. Why this specific word?]

    "[word 3]" not "[alternative]" — [same depth.]

  Temperature: [warm / cool / neutral]

    [Why this temperature. What it constrains downstream without naming colors.]

  Weight:      [light / medium / heavy — visual density]

    [What this means for how content sits on the page.]

  Pace:        [calm / measured / energetic — rhythm of the interface]

    [What this means for hierarchy and spacing rhythm.]

  Analogy:     "[one sentence — 'like opening a ___' or 'the feeling of ___']"
  NOT:         [3-5 things this is definitely NOT]
```

**Step 2: Present the SAFE/RISK breakdown:**

```
SAFE CHOICES (proven, correct — these work for a reason):
  - [2-3 vibe decisions grounded in what works in this category]
  - [For each: WHY it works. Not "it's what everyone does" — what makes
    it genuinely good. Safe ≠ boring. Safe = battle-tested and effective.]
  - Safe choices should stand on their own as a strong design system.
    If the user picks all safe and no risks, they get a GOOD system.

RISKS (genuine departures — could be great, could cost you):
  - [2-3 specific departures from category norms]
  - For each risk: what it IS, what you GAIN, what it COSTS
  - Be honest about the cost. If a risk has no real downside, it's not
    a risk — move it to safe. Risks are things where reasonable designers
    would disagree on whether it's the right call.
  - Not sales pitches for "the cool version." Real tradeoffs.
```

**Step 3: Ask structured questions to lock each dimension.**

Immediately after presenting the vibe lock + SAFE/RISK, use AskUserQuestion to
narrow down the specific decisions. Do NOT say "react to this" or "how does this
feel?" — ask bounded questions with concrete options.

```json
{
  "questions": [
    {
      "header": "Emotion",
      "question": "I proposed [word 1], [word 2], [word 3] as the emotional DNA. Each word constrains what fonts and colors are even eligible. Which words land and which feel off?",
      "multiSelect": false,
      "options": [
        { "label": "Lock it (Recommended)", "description": "All three words feel right. Move on." },
        { "label": "Swap [word X]", "description": "[Alternative word] fits better because [reason] — keeps the other two." },
        { "label": "Too [direction]", "description": "The overall feel is too [cold/warm/serious/playful]. Shift toward [opposite]." },
        { "label": "Wrong axis entirely", "description": "These words describe [what they describe] but my product is more about [different thing]." }
      ]
    },
    {
      "header": "Temperature",
      "question": "I proposed [cool/warm/neutral]. This decides whether your palette leans blue-gray or cream-warm or dead-center. Right call?",
      "multiSelect": false,
      "options": [
        { "label": "[Proposed] (Recommended)", "description": "[One sentence — why this temperature matches the emotion words]" },
        { "label": "Warmer", "description": "Push toward [warmer territory]. Feels more [quality]." },
        { "label": "Cooler", "description": "Push toward [cooler territory]. Feels more [quality]." },
        { "label": "Neutral", "description": "No temperature lean. Pure gray foundation, accent color carries the personality." }
      ]
    },
    {
      "header": "Risks",
      "question": "The safe choices above already make a strong system. These risks are genuine departures — each has a real upside AND a real cost. Take any that feel right, or take none.",
      "multiSelect": true,
      "options": [
        { "label": "[Risk 1 name]", "description": "[What it is]. Gain: [gain]. Cost: [cost]." },
        { "label": "[Risk 2 name]", "description": "[What it is]. Gain: [gain]. Cost: [cost]." },
        { "label": "[Risk 3 name]", "description": "[What it is]. Gain: [gain]. Cost: [cost]." },
        { "label": "None — safe is strong", "description": "The safe choices make a solid system. No departures needed." }
      ]
    }
  ]
}
```

**Adapt the questions to what needs deciding.** The template above covers the common
case. But if the user's initial prompt already locked temperature ("I want it warm"),
don't ask about temperature — replace that tab with Weight or Pace instead. Only ask
about dimensions that are genuinely undecided.

**After the user answers:** Update the vibe lock to reflect their choices. If they
swapped a word or adjusted temperature, present the UPDATED lock in plain text
(not another AskUserQuestion) and confirm: "Vibe lock updated: [show changes].
Locking this and moving to type specimens." If they typed a custom answer that
changes multiple things, present the updated lock and ask ONE more focused question
about whatever is still ambiguous. Max 2 rounds of AskUserQuestion for vibe lock.

**If the user picks "Lock it" on all tabs:** Done. Move to 3b immediately.

**The vibe lock becomes the acceptance criteria for all downstream steps:**
- Type specimens (3b): "Does this font feel [emotion] at [weight] with [pace]?"
- Color specimens (3c): "Does this palette feel [temperature] and [emotion]?"
- Spacing (3d): "Does this density match [pace] and [weight]?"

### 3b: Type Specimens (layered funnel — display → body → data)

**Before building:** Read `~/.claude/skills/mint-kit/mint-system/FONT_KNOWLEDGE_BASE.md`.

Type is decided in 3 layers on a single Figma page ("01 — Typography"). Each layer
builds on the locked previous choice. The user never picks 3 fonts at once — they
pick one, see the next layer rendered with it, and pick again.

**Show type on NEUTRAL backgrounds (white or near-white).** Do NOT introduce color
into type specimens. Color is decided in 3c.

**Selection pattern (same for each layer):**

After building 4 options in Figma, use a 2-tab AskUserQuestion. Tab 1 picks the
direction, Tab 2 decides whether to lock or iterate in that direction.

```json
{
  "questions": [
    {
      "header": "Pick",
      "question": "[Layer-specific context]. Review the 4 options on the Typography page in Figma. Which direction feels right?",
      "multiSelect": false,
      "options": [
        { "label": "A: [Font name] (Recommended)", "description": "[Classification]. [Why it fits the vibe lock]" },
        { "label": "B: [Font name]", "description": "[Classification]. [Why it fits]" },
        { "label": "C: [Font name]", "description": "[Classification]. [Why it fits]" },
        { "label": "None of these", "description": "Wrong direction entirely. I'll explain what I'm after." }
      ]
    },
    {
      "header": "Lock",
      "question": "Happy with your pick, or want to explore more in that direction?",
      "multiSelect": false,
      "options": [
        { "label": "Lock it (Recommended)", "description": "This is the one. Move on to the next layer." },
        { "label": "More like this", "description": "Right direction, show me 4 similar alternatives." }
      ]
    }
  ]
}
```

- **"Lock it"** → lock the font, move to next layer
- **"More like this"** → fire a SECOND AskUserQuestion asking what they
  liked about it. Do NOT guess — let the user tell you. The options should
  be specific traits of the font they picked, not generic categories.

  ```json
  {
    "questions": [{
      "header": "What hit?",
      "question": "What pulled you toward [font name]? Knowing this helps me find the right alternatives instead of just more [classification]s.",
      "multiSelect": true,
      "options": [
        { "label": "[Trait A]", "description": "[What this trait looks like in the font — specific, not abstract]" },
        { "label": "[Trait B]", "description": "[Specific observation]" },
        { "label": "[Trait C]", "description": "[Specific observation]" },
        { "label": "[Trait D]", "description": "[Specific observation]" }
      ]
    }]
  }
  ```

  The traits must be SPECIFIC to the font they picked. Examples for Bricolage
  Grotesque: "Ink trap details" / "Heavy-but-not-clunky weight" / "Industrial
  not corporate" / "Looks designed, not default". NOT generic labels like
  "Personality" or "Warmth" or "Character."

  **After they answer:** use their selected traits to find 4 NEW fonts (never
  repeat the one they picked):
  - **A:** Same family or very close sibling
  - **B:** Different classification, same traits (e.g., they liked ink traps?
    Try a serif with visible construction details)
  - **C:** Different classification, another angle on the same traits
  - **D:** Same traits, genuine risk — unexpected font that captures the
    feeling through completely different means
  Build specimens, present another Pick + Lock AskUserQuestion.

**If user picks "Type something" or "Chat about this"** (auto-added options) →
drop to conversational. Diagnose what went wrong, name 2-3 real brands that
match better, propose specific pivots. Narrow, don't re-open.

**Always provide exactly 4 options on the Pick tab.** AskUserQuestion hard limit
is 4. "Type something" and "Chat about this" are auto-added as escape hatches.

#### 3b-i: Display font (the personality)

Build 4 display font options in Figma. One `use_figma` call per option.
Each option shows the font at hero (72px), H1 (48px), H2 (32px) sizes.
Use real content from the product context, not lorem ipsum.

**Research must inform font selection.** If Phase 2 research was done, your font
choices should reference what you found. If you discovered that Midori uses clean
Japanese typography, propose a font that captures that quality. If competitors all
use geometric sans-serifs, one option should deliberately break from that. If a
reference brand's type left an impression during research, name it when explaining
your pick: "This captures the editorial quality I saw in [brand]." Research that
doesn't influence the proposals was wasted time.

**CRITICAL — the 4 options must use DIFFERENT font classifications.**
- Option A: the expected category choice for the vibe
- Option B: a different classification entirely
- Option C: a contrast/tension choice (the friction IS the personality)
- Option D: a wild card from a different era or aesthetic

If all 4 use the same classification, you've failed to diverge.

```javascript
// TARGET: mint-system file (fileKey: ...)
// Create "01 — Typography" page
// One use_figma call PER display option (4 calls)
//
// Each option frame (compact auto-layout, width: 400px):
//   Font at hero (72px), H1 (48px), H2 (32px)
//   NEUTRAL BACKGROUND ONLY
//   Real product content
//   Load font via figma.loadFontAsync with try/catch (Inter fallback)
//   HARDCODED values
//
// POSITIONING — prevent overlap:
//   Frame A: x=0,    y=0
//   Frame B: x=450,  y=0
//   Frame C: x=900,  y=0
//   Frame D: x=1350, y=0
//   (400px wide + 50px gap between frames)
//   Each call must set frame.x and frame.y explicitly.
//   If the frame uses auto-layout, set x/y AFTER configuring auto-layout.
//
// Return frame node IDs
```

**After building all 4:** call `get_screenshot` on the "01 — Typography" page to
verify frames are not overlapping. If they overlap, reposition before presenting
to the user.

After building, use the **selection pattern** above (Pick + Lock AskUserQuestion).
Label options A through D. State your recommendation.

Iterate until display font is locked.

#### 3b-ii: Body font (the workhorse)

Build 4 body font options in Figma, each shown UNDERNEATH the locked display font.
The user sees the pairing live — display heading above, body text below.

```javascript
// TARGET: mint-system file (fileKey: ...)
// Same "01 — Typography" page
// One use_figma call PER body option (4 calls)
//
// Each option frame:
//   TOP: locked display font at H2 (32px) — same text across all 4
//   BELOW: body candidate at body (16px), small (14px), caption (13px)
//   Show a real paragraph of product content at body size
//   NEUTRAL BACKGROUND ONLY
//   HARDCODED values
//
// POSITIONING — below display options:
//   Frame A: x=0,    y=[display row bottom + 80px gap]
//   Frame B: x=450,  y=same
//   Frame C: x=900,  y=same
//   Frame D: x=1350, y=same
//   Use the display frame heights (from returned node IDs) to calculate y.
//
// Return frame node IDs
```

**After building all 4:** call `get_screenshot` to verify no overlap.

After building, use the **selection pattern** above (Pick + Lock AskUserQuestion).
Label options A through D. Explain pairing rationale — why each body font
complements (or deliberately contrasts with) the locked display font.

Iterate until body font is locked.

#### 3b-iii: Data font (the functional layer)

Build 4 monospace/tabular options in Figma, shown alongside the locked
display + body fonts.

```javascript
// TARGET: mint-system file (fileKey: ...)
// Same "01 — Typography" page
// One use_figma call PER data option (4 calls)
//
// Each option frame:
//   TOP: locked display at H3 (24px) + locked body at body (16px)
//   BELOW: data candidate showing:
//     - Code snippet or data sample (14px)
//     - Tabular numbers: "1,234,567.89" aligned
//     - Mixed context: body text with inline code
//   NEUTRAL BACKGROUND ONLY
//   HARDCODED values
//
// POSITIONING — below body options:
//   Frame A: x=0,    y=[body row bottom + 80px gap]
//   Frame B: x=450,  y=same
//   Frame C: x=900,  y=same
//   Frame D: x=1350, y=same
//
// Return frame node IDs
```

**After building all 4:** call `get_screenshot` to verify no overlap.

After building, use the **selection pattern** above (Pick + Lock AskUserQuestion).
Label options A through D.

#### After all 3 layers are locked

The "01 — Typography" page now shows the full journey: display options at top,
body options (with display) in the middle, data options (with both) at the bottom.
This IS the decision record — the user can scroll back and see why each choice
was made.

Confirm the full stack in plain text:
```
TYPE LOCKED:
  Display: [font] — [why]
  Body:    [font] — [why it pairs]
  Data:    [font] — [why it works]
```

Move to 3c.

### 3c: Color Specimens (4 palettes — with locked type, judged against vibe lock)

Build 4 color palettes in Figma WITH the approved type applied. The user sees
type + color together. Each palette must feel like the vibe lock's Temperature
and Emotion.

**Research must inform color selection.** Same rule as type — if Phase 2 research
was done, reference what you found. If competitors all use cool blue-gray palettes,
one option should deliberately differ. If a reference brand's warm whites or
particular accent color stood out, name it: "This captures the warmth I saw in
[brand]'s approach." Don't do research then propose generic palettes.

**Generate scales using oklch math.** Define the hero color (primary-500) as an
oklch value (L%, C, H). Generate the full 50-950 scale by stepping Lightness
evenly while keeping Chroma and Hue constant (slight chroma reduction at extremes
is fine). This produces perceptually uniform scales — every step looks like an
equal jump in brightness, unlike hex/RGB interpolation. Convert to RGBA for Figma
storage. See "oklch Scale Generation" in Phase 4 for the conversion math.

```javascript
// TARGET: mint-system file (fileKey: ...)
// Create "02 — Color Options" page
// One use_figma call PER option frame (4 calls total)
//
// Each frame shows:
//   Primary scale (50-950 swatches), Neutral scale, Accent colors
//   Semantic colors (success, warning, error, info)
//   Colors in context: text on backgrounds, buttons, cards
//   USE THE APPROVED TYPE from 3b — show type + color together
//   HARDCODED values (generated via oklch, stored as RGBA)
//
//   COMPONENT PREVIEW STRIP (at bottom of each frame):
//     A small section showing the palette on interactive surfaces:
//     - A filled rectangle with centered text (button shape)
//     - A stroked rectangle with left-aligned text (input shape)
//     - A filled card rectangle with heading + body text
//     All hardcoded. All use the palette's primary, neutral, and text colors.
//     Add a caption above the strip in 12px muted text:
//       "Preview only — not real components. Component design happens in /mint-lib."
//     This strip helps the user judge how colors feel on interactive surfaces,
//     NOT how final components will look.
//
// Return frame node IDs
```

After building, use the same **Pick + Lock** AskUserQuestion pattern as type
selection. Label palettes A through D. Explain how each matches the vibe lock's
temperature and emotion. State your recommendation.

- **"Lock it"** → lock the palette, move to spacing
- **"More like this"** → build 4 palettes in the same temperature/hue family
- **"None of these"** → drop to conversational, diagnose and narrow

Iterate until color is locked.

### Coherence Validation

After type and color are locked, check if everything still matches the vibe lock.
Read the vibe lock words back. Does the locked type + color combination feel like
[emotion] at [temperature] with [weight]? If something drifted, flag it:

"Your vibe lock says [measured pace] but the type you picked has [energetic rhythm].
That's fine if intentional. Want to adjust the vibe lock to match what you actually
chose, or try different type?"

Always accept the user's final choice. Never refuse to proceed.

### 3d: Spacing + Shape (conversational — judged against vibe lock)

Spacing and shape are conversational. The spacing scale is just numbers.
Shape philosophy ("round vs sharp") is a direction — specific radius and border values
are discovered by mint-lib during the DNA phase, not locked here.

**Do NOT build Figma specimens for spacing/shape.** Discuss in text:

- **Base unit** — propose 4px or 8px base with rationale tied to the vibe lock's
  Weight and Pace (e.g., "8px because the vibe lock says light + measured")
- **Density** — generous / default / tight. Tied to Weight.
- **Shape direction** — round / sharp / mixed / soft-square. Tied to Emotion.
  Do NOT propose specific px values — just the direction.
- **Grid** — column count, gutter approach, max-width strategy

Present with SAFE/RISK breakdown. Iterate until approved.

### 3-drill: Drill-downs (only if user requests adjustments)

When the user wants to change a specific section after approval, go deep
on that section rather than re-proposing everything:

- **Fonts:** Present 3-5 specific candidates. Build a new specimen for each.
- **Colors:** Present 2-3 palette options. Build comparison swatches.
- **Aesthetic:** Walk through which directions fit their product and why.
- **Layout/Spacing:** Present approaches with concrete tradeoffs.

Each drill-down is one focused conversation + Figma specimen. After the user decides,
re-run coherence validation.

### 3d: Motion — SKIP

Do NOT propose motion values. LLMs always default to the same generic spec
(200ms micro, 400ms reveals, ease-out entrances, subtle fade-up, slow hero zoom).
It's untestable in Figma and adds nothing. Motion gets decided during implementation
when you can actually feel it.

MINT.md gets a placeholder section:
```markdown
## Motion
_Deferred to implementation. Timing and easing decisions should be made when
they can be tested in a real browser, not speculated about in a design tool._
```

---

## Phase 4: Create Token System

After ALL dimensions are approved, create the full token system.
Split across multiple `use_figma` calls following the partition boundaries above.

**IMPORTANT — what gets created here:**
- Brand variables (color, spacing, opacity, type scale) — the raw primitives
- Alias variables (semantic mappings to Brand) — contextual meaning
- Text Styles — the ONLY way to tokenize font family
- Effect Styles — shadows, focus rings
- NO Role variables — those are mint-lib's job

### oklch Scale Generation

All color scales MUST be generated using oklch math. This produces perceptually
uniform scales — every step is an equal perceived brightness jump, unlike hex/RGB
interpolation where blue looks darker than orange at the same "lightness."

**How it works:**
1. Define the hero value (e.g., primary-500) in oklch: `oklch(L% C H)`
   - L = lightness (0-100%), C = chroma (0-0.4), H = hue (0-360)
2. Generate the scale by stepping L while holding C and H roughly constant:
   - 50:  L=97%  (near-white tint)
   - 100: L=93%
   - 200: L=85%
   - 300: L=75%
   - 400: L=63%
   - 500: L=55%  (hero — adjust to match approved color)
   - 600: L=47%
   - 700: L=39%
   - 800: L=30%
   - 900: L=22%
   - 950: L=15%  (near-black shade)
3. Reduce chroma slightly at extremes (50/100 and 900/950) — very light and very
   dark colors can't hold high chroma without clipping.
4. Convert each oklch value to sRGB for Figma storage: oklch → Lab → XYZ → sRGB.
   Figma variables use RGBA {r, g, b, a} on 0-1 scale.

**Conversion in use_figma** (inline, no external deps):
```javascript
// oklch to sRGB conversion (for use inside use_figma calls)
function oklchToRgb(L, C, H) {
  // L: 0-1, C: 0-0.4, H: degrees
  const hRad = H * Math.PI / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  // OKLab to linear sRGB via matrix
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  // Clamp to 0-1
  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  bl = Math.max(0, Math.min(1, bl));
  return { r, g, b: bl, a: 1 };
}
// Usage: variable.setValueForMode(modeId, oklchToRgb(0.55, 0.2, 250));
```

**Why this matters:**
- Cross-hue consistency: primary-500 and accent-500 have the same visual weight
- Accessibility: contrast ratios map to real perceived contrast
- Dark mode ready: flipping an oklch scale preserves contrast relationships
- Industry standard: shadcn/ui and Tailwind v4 both use oklch

### Step 1: Create Brand Variables — Colors

Split into 2 calls if needed (primary+neutral in one, accent+semantic in another).

**Color scales** — generate using oklch math (see above), store as RGBA {r, g, b, a} on 0-1 scale:
- Brand/Color/primary-50 through primary-950 (full 10-step scale)
- Brand/Color/neutral-50 through neutral-950 (full 10-step scale)
- Brand/Color/accent-* (if design has secondary/accent — full scale)
- Brand/Color/semantic-success, semantic-success-light, semantic-success-dark
- Brand/Color/semantic-error, semantic-error-light, semantic-error-dark
- Brand/Color/semantic-warning, semantic-warning-light, semantic-warning-dark
- Brand/Color/semantic-info, semantic-info-light, semantic-info-dark
- Brand/Color/white, Brand/Color/black (absolute references)

**Interactive state colors** — REQUIRED for mint-lib:
- Brand/Color/primary-active (pressed — typically primary-600 or -700)
- Brand/Color/secondary-bg, secondary-bg-hover, secondary-text, secondary-border
- Brand/Color/destructive-bg, destructive-bg-hover, destructive-text
- Brand/Color/ghost-bg-hover (subtle hover fill)
- Brand/Color/focus-ring (typically primary at 40-50% opacity, or dedicated color)
- Brand/Color/link, link-hover, link-visited

Return collection ID, mode ID, and ALL variable IDs as a map.

### Step 2: Create Brand Variables — Spacing, Opacity, Type Scale

**Spacing** — FLOAT variables:
- Brand/Space/2xs=2, xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48, 3xl=64, 4xl=96

**Opacity** — FLOAT variables:
- Brand/Opacity/disabled=0.4, hover=0.08, pressed=0.12, overlay=0.6, loading=0.6

**Type scale** — FLOAT variables (font SIZE only, not family):
- Brand/Type/size-hero=72, size-h1=48, size-h2=32, size-h3=24, size-h4=20
- Brand/Type/size-body=16, size-small=14, size-caption=13, size-overline=11

Return all variable IDs.

### Step 3: Create Text Styles

Text Styles bundle font family + weight + size + line height + letter spacing.

```javascript
// TARGET: mint-system file (fileKey: ...)
// Load all fonts first (try/catch each, fall back to Inter)
try { await figma.loadFontAsync({family: "Space Grotesk", style: "Bold"}); }
catch { await figma.loadFontAsync({family: "Inter", style: "Bold"}); }

const style = figma.createTextStyle();
style.name = "Display/Hero";
style.fontName = { family: "Space Grotesk", style: "Bold" };
style.fontSize = 72;
style.lineHeight = { value: 80, unit: "PIXELS" };
style.letterSpacing = { value: -1, unit: "PIXELS" };
```

Create styles for the full scale:
- Display/Hero, Heading/H1, H2, H3
- Body/Regular, Body/Medium, Body/Small
- Caption, Label/Default
- Data/Regular, Data/Small

Return all style IDs.

### Step 4: Create Effect Styles

```javascript
// TARGET: mint-system file (fileKey: ...)
const shadow = figma.createEffectStyle();
shadow.name = "Elevation/md";
shadow.effects = [{
  type: "DROP_SHADOW",
  color: { r: 0, g: 0, b: 0, a: 0.15 },
  offset: { x: 0, y: 4 },
  radius: 12,
  spread: 0,
  visible: true,
  blendMode: "NORMAL"
}];
```

Create ALL of these:
- Elevation/sm, Elevation/md, Elevation/lg, Elevation/xl
- Elevation/glow (if aesthetic calls for it)
- **Focus/ring** — REQUIRED for accessibility:
  `type: "DROP_SHADOW", color: primary at 40% opacity, offset: {x:0, y:0}, radius: 0, spread: 2-3`
- Focus/ring-error — focus ring for error-state inputs
- Focus/ring-destructive — focus ring for destructive buttons

Return all style IDs.

### Step 5: Create Alias Variables

Create "Alias" collection. EVERY variable uses `createVariableAlias` referencing Brand.
Must use `setValueForMode(modeId, figma.variables.createVariableAlias(brandVar))`.

Use `figma.variables.getVariableById(id)` to look up Brand variables from IDs
returned in Steps 1-2.

**Alias colors** (semantic meaning → Brand reference):
- primary, primary-hover, primary-active, primary-text (text on primary bg)
- secondary-bg, secondary-bg-hover, secondary-text, secondary-border
- destructive-bg, destructive-bg-hover, destructive-text
- ghost-bg-hover
- surface, surface-raised, surface-overlay, surface-sunken
- text-primary, text-secondary, text-muted, text-on-primary, text-on-destructive
- border-default, border-strong, border-focus
- focus-ring
- link, link-hover, link-visited
- success, success-light, warning, warning-light, error, error-light, info, info-light
- overlay-bg (for modals/drawers backdrop)
- skeleton (loading placeholder color)

**Alias spacing** (contextual spacing — NOT component-specific):
- space-xs, space-sm, space-md, space-lg, space-xl (mirror Brand scale with semantic names)
- space-section (between page sections)
- space-page (page-level margins)
- space-stack (vertical gap between stacked elements)
- space-inline (horizontal gap between inline elements)

**Alias opacity:**
- opacity-disabled, opacity-hover, opacity-pressed, opacity-loading

Return all Alias variable IDs.

### Step 6: Rebind Specimen Pages

Go back to specimen pages and rebind key elements to tokens. Don't try to match
every element — focus on:
- Color swatches → bind fills to Brand/Color/* variables
- Heading/body text → apply matching Text Style via `textStyleId`
- Spacing blocks → bind dimensions to Brand/Space/* variables

Report what was bound vs. left hardcoded. Specimens are reference pages — partial
binding is fine.

### Step 7: Build Design System Overview

**MANDATORY — do NOT skip to Phase 5 until this is complete.**

Build a "Design System Overview" page from scratch using ONLY Brand/Alias variables,
Text Styles, and Effect Styles. **EVERY fill, stroke, spacing, and text node MUST be
variable-bound or style-applied. Zero hardcoded values.**

Split across multiple `use_figma` calls (50K limit). Build sections in order.
Each call returns node IDs for reference.

**Required sections:**

1. **Color Palette** — full Brand color swatches with labels + hex values.
   Each swatch fill bound to Brand/Color/* variables.
2. **Typography Catalog** — every Text Style applied to sample text.
   Each text node has a Text Style applied via `textStyleId`.
3. **Spacing Scale** — visual blocks for each step (2xs through 4xl).
   Block width/height bound to Brand/Space/* variables.
4. **Elevation / Shadows** — rectangles showing each Effect Style.
   `effectStyleId` applied to each.
5. **Contrast Pairings** — text on background combos showing readability.
   All fills bound to Alias color variables.
6. **Opacity Scale** — rectangles showing each opacity level.
   Opacity bound to Brand/Opacity/* variables.

**Do NOT build component samples (buttons, inputs, cards).** That's mint-lib's job.
This page proves the TOKEN SYSTEM works, not the component library.

After building, run verification:
```javascript
// Walk all nodes in the Overview page
// Count: nodes with bound variables vs hardcoded fills/strokes
// Count: text nodes with Text Styles vs unstyled text
// Return: { bound: N, hardcoded: N, styled: N, unstyled: N }
```
If hardcoded > 0, fix those nodes before proceeding.

Then use `get_screenshot` to visually verify the page (after the Plugin API
verification gives REST API time to sync).

Tell the user: "Check the Design System Overview page. Select any element — you
should see variable references in the properties panel."

**Do NOT proceed to Phase 5 until the overview is built and verified.**

---

## Phase 5: Lock

### Verify by Reading Back from Figma

Before writing MINT.md, run a verification call to read back what was actually
created in Figma:
```javascript
// TARGET: mint-system file (fileKey: ...)
const variables = figma.variables.getLocalVariables();
const textStyles = figma.getLocalTextStyles();
const effectStyles = figma.getLocalEffectStyles();

const collections = {};
for (const v of variables) {
  const col = figma.variables.getVariableCollectionById(v.variableCollectionId);
  if (!collections[col.name]) collections[col.name] = [];
  collections[col.name].push({ name: v.name, key: v.key, resolvedType: v.resolvedType });
}

return {
  collections,
  textStyles: textStyles.map(s => ({ name: s.name, key: s.key, fontName: s.fontName, fontSize: s.fontSize })),
  effectStyles: effectStyles.map(s => ({ name: s.name, key: s.key }))
};
```

Cross-reference this against what you intended to create. If anything is missing,
create it before writing MINT.md.

### Write MINT.md

Use the verified Figma state + your conversation knowledge to write MINT.md:

```markdown
# Design System — [Project Name]

Figma source: [URL to Figma file]
Generated by /mint-system on [date]

## Aesthetic Direction
[Approved direction and rationale from Phase 3]

## Shape Language
[Approved shape philosophy from 3c — round vs sharp vs mixed, general direction.
Specific radius/border values are NOT locked here — mint-lib discovers those.]

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

Color scales generated using oklch for perceptual uniformity.

### Brand Tokens
| Token | oklch | Hex | Usage |
|-------|-------|-----|-------|
| Brand/Color/primary-500 | oklch(55% 0.2 250) | #XXXXXX | Primary actions |
| ... | ... | ... | ... |

### Alias Tokens (Semantic)
| Token | → Brand Reference | Usage |
|-------|-------------------|-------|
| Alias/primary | → Brand/Color/primary-500 | Primary action fill |
| ... | ... | ... |

### CSS Custom Properties
```css
/* oklch values (source of truth) */
--color-primary-500: oklch(55% 0.2 250);
/* Repeat for all Brand and Alias tokens */
```

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

## Motion
_Deferred to implementation. Decide timing and easing when you can test in a real browser._

## Decisions Log
[Key decisions made during the consultation with rationale]

## Component Tokens
_Component-level tokens (Role/*, radius, border-weight, component padding) are
created by /mint-lib during the DNA phase and appended below._
```

### Publish as Team Library

After MINT.md is written, the user MUST publish the Figma file as a team library
so /mint-lib can import the tokens.

Use `AskUserQuestion`:
> **Last step: publish your design system as a team library.**
>
> This is REQUIRED for /mint-lib to import your tokens. Without publishing,
> other files can't reference your variables.
>
> In Figma: click the Figma icon (top-left) → Libraries → Publish.
> The file must be in a team project, not in Drafts.
>
> RECOMMENDATION: Choose A when you've published.
>
> A) Done — it's published
> B) I need help

**Verified behavior (tested 2026-03-31):**
- `importVariableByKeyAsync(key)` ONLY works for published variables
- Unpublished variables return "not found"
- The working import flow for /mint-lib: read keys from source file via
  `getLocalVariables()`, import into target via `importVariableByKeyAsync(key)`
- Variables MUST be published first

### Update CLAUDE.md

Add a note to the project's CLAUDE.md:

```markdown
## Design System
Design system defined in MINT.md. Figma source of truth: [URL].
Token architecture: Brand (raw) → Alias (semantic) → Role (component).
Role tokens are created by /mint-lib. Use Role tokens in component code.
Never reference Brand tokens directly in components.
```

