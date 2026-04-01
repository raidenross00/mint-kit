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
- One `use_figma` call per specimen frame (each of the 5 options)
- Never try to build all 5 in a single call

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

**Tab 1 — header: "Product" or "Brand vibe":**

Use "Product" if you need basic info. Use "Brand vibe" if the user's prompt
already told you what it is and you can propose opinionated directions.

If you need basic info (user prompt was vague):
```json
{
  "header": "Product",
  "question": "Tell me about this brand. [Echo their words back]... who's the customer? What's the price point? Is this a Shopify store, a marketing site, a lookbook?",
  "multiSelect": false,
  "options": [
    { "label": "Research my competitors (Recommended)", "description": "Search for real brands in MY industry, study their sites, then propose something grounded" },
    { "label": "Skip research", "description": "Faster — you'll propose from general design knowledge instead" }
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

Two types of design dimensions:

- **Conversational** (aesthetic, decoration, layout, motion) — propose in text with
  SAFE/RISK breakdown. No Figma specimens.
- **Visual** (typography, color, spacing+shape) — build specimens in Figma so the user
  compares visually.

During exploration, specimens use **hardcoded values** — the decisions aren't made yet.
After all dimensions are approved, Phase 4 creates the token system.

**IMPORTANT — Direction Divergence:** During exploration (3a-3c), each direction must
be a genuinely different PHILOSOPHY, not a variation within one category.

**Self-check before presenting directions:** Look at all 4 side by side. If a non-designer
would say "these all look kinda similar," you failed. The 4 directions should be
obviously different at a glance — different visual weight, different structural logic,
different personality. One should feel expected, one should feel surprising, one should
feel risky, and one should make the user think "I never would have considered that."

Break from the token system during exploration — these are creative explorations,
not token applications.

### 3-pre: Conversational Dimensions

Before building visual specimens, propose conversational dimensions as one coherent
text block. Present as a COMPLETE proposal, not a menu of options:

```
Based on [product context] and [research findings / design knowledge]:

AESTHETIC: [direction] — [one-line rationale]
DECORATION: [level] — [why this pairs with the aesthetic]
LAYOUT: [approach] — [why this fits the product type]

This system is coherent because [explain how choices reinforce each other].

SAFE CHOICES (category baseline — your users expect these):
  - [2-3 decisions that match category conventions, with rationale]

RISKS (where your product gets its own face):
  - [2-3 deliberate departures from convention]
  - For each risk: what it is, why it works, what you gain, what it costs

The safe choices keep you literate in your category. The risks are where
your product becomes memorable. Which risks appeal to you?
```

The SAFE/RISK breakdown is critical. Design coherence is table stakes — every
product in a category can be coherent and still look identical. The real question
is: where do you take creative risks? Always propose at least 2 risks, each with
a clear rationale for why the risk is worth taking and what the user gives up.

Iterate until the user is happy. The risk appetite here informs which font, color,
and spacing options you propose next.

### Coherence Validation

After 3-pre is approved, and again after each subsequent dimension (3a, 3b, 3c),
check if the user's choices still cohere. Flag mismatches with a gentle nudge,
never block:

- Brutalist/Minimal aesthetic + expressive motion → "Heads up: brutalist aesthetics
  usually pair with minimal motion. Your combo is unusual, which is fine if
  intentional. Want me to suggest motion that fits, or keep it?"
- Expressive color + restrained decoration → "Bold palette with minimal decoration
  can work, but the colors will carry a lot of weight. Want me to suggest
  decoration that supports the palette?"
- Creative-editorial layout + data-heavy product → "Editorial layouts are gorgeous
  but can fight data density. Want me to show how a hybrid approach keeps both?"
- Always accept the user's final choice. Never refuse to proceed.

### 3a: Typography (visual — build 4 options in Figma)

**Before proposing:** Read `~/.claude/skills/mint-system/FONT_KNOWLEDGE_BASE.md`.

**CRITICAL — the 4 directions must use DIFFERENT font classifications.**
If the aesthetic is "luxury editorial", do NOT propose 4 serif options. Instead:
- Direction A: the expected category choice (e.g., classic serif for luxury)
- Direction B: a different classification entirely (e.g., geometric sans — clean,
  modern, unexpected for the category but could work)
- Direction C: a contrast/tension pairing (e.g., heavy grotesque display + refined
  serif body — the friction IS the personality)
- Direction D: a wild card from a different era or aesthetic (e.g., art deco display,
  slab serif, humanist, or something that breaks the mold entirely)

If all 4 directions use the same font classification (all serifs, all sans, all
geometric), you've failed to diverge. The user picked an aesthetic direction —
they don't need 4 versions of the obvious choice. They need to see what
UNEXPECTED typography could look like in their space.

Draw from the knowledge base — not from your defaults.

**First:** Build all 4 typography directions as Figma specimens (one `use_figma`
call per direction frame). Then present the AskUserQuestion.

```javascript
// TARGET: mint-system file (fileKey: ...)
// Create "01 — Typography Options" page
// One use_figma call PER option frame (4 calls total)
//
// Each frame (compact auto-layout, NOT fixed 1400px):
//   Display font: hero (72px), H1 (48px), H2 (32px)
//   Body font: body (16px), small (14px), caption (13px)
//   Data font: monospace samples, tabular numbers
//   Use real content from the product context (not lorem ipsum)
//   Load each font via figma.loadFontAsync with try/catch (Inter fallback)
//   Values are HARDCODED — tokenization happens in Phase 4
//
// Return frame node IDs
```

After building, present AskUserQuestion with the directions AS the options:
```json
{
  "questions": [{
    "header": "Typography",
    "question": "All 4 typography directions are in Figma on the '01 — Typography Options' page. Compare them side-by-side — which direction feels right, or mix and match elements from different ones?",
    "multiSelect": false,
    "options": [
      { "label": "[Direction A name] (Recommended)", "description": "[Display font] + [Body font] + [Data font]. [One sentence: what it feels like]" },
      { "label": "[Direction B name]", "description": "[Fonts]. [One sentence]" },
      { "label": "[Direction C name]", "description": "[Fonts]. [One sentence]" },
      { "label": "[Direction D name]", "description": "[Fonts]. [One sentence]" }
    ]
  }]
}
```

User can pick one, type "mix A's display with C's body", or ask for more options.

**If user rejects all directions — DO NOT use AskUserQuestion.** This is a
conversation moment, not a structured decision. Respond in plain text with:

1. **Your diagnosis** — be opinionated about what went wrong. Don't ask "too heavy
   or too light?" Say something specific: "I think the problem is none of these feel
   like [their brand] — the serifs are too traditional/editorial and the sans is too
   corporate. Your brand lives closer to [specific reference] than to [other reference]."

2. **Name 2-3 real brands** whose typography feels closer to what they might want.
   If you did research in Phase 2, reference it. If you didn't, offer to do research
   now: "Want me to look at what [their space] brands actually use? That'll give us
   real reference points instead of me guessing."

3. **Propose a specific pivot** — not "what direction do you want?" but "I think we
   should try [specific font] paired with [specific font] — it has [quality] which
   matches [their brand]. Want me to build that?"

The goal is to narrow, not re-open. Generic follow-ups ("too heavy? too light?")
waste the user's time. Be wrong and specific over vague and safe.

Iterate until approved.

### 3b: Color (visual — build 4 options in Figma)

Same pattern. Build 4 palettes in Figma (one call per frame), then present:

```javascript
// TARGET: mint-system file (fileKey: ...)
// Create "02 — Color Options" page
// One use_figma call PER option frame (4 calls total)
//
// Each frame shows:
//   Primary scale (50-950 swatches), Neutral scale, Accent colors
//   Semantic colors (success, warning, error, info)
//   Colors in context: text on backgrounds, buttons, cards
//   Contrast pairings (text color on each background)
//   Use approved typography from 3a
//   HARDCODED values
//
// Return frame node IDs
```

```json
{
  "questions": [{
    "header": "Color",
    "question": "All 4 color palettes are in Figma on '02 — Color Options'. Which palette feels right? You can also cherry-pick — e.g., 'B's primaries with D's neutrals'.",
    "multiSelect": false,
    "options": [
      { "label": "[Palette A name] (Recommended)", "description": "[Primary color] + [neutral tone]. [One sentence]" },
      { "label": "[Palette B name]", "description": "[Colors]. [One sentence]" },
      { "label": "[Palette C name]", "description": "[Colors]. [One sentence]" },
      { "label": "[Palette D name]", "description": "[Colors]. [One sentence]" }
    ]
  }]
}
```

### 3c: Spacing + Shape (conversational — no Figma specimens)

Spacing and shape are conversational, like motion. The spacing scale is just numbers.
Shape philosophy ("round vs sharp") is a direction — specific radius and border values
are discovered by mint-lib during the DNA phase, not locked here.

**Do NOT build Figma specimens for spacing/shape.** Discuss in text:

- **Base unit** — propose 4px or 8px base with rationale tied to the product
  (e.g., "8px for spacious luxury, 4px if density matters")
- **Density** — generous / default / tight. Luxury brands breathe. Dashboards pack.
- **Shape direction** — round / sharp / mixed / soft-square. This is the philosophy
  mint-lib will explore when discovering actual radius values during DNA.
  Do NOT propose specific px values — just the direction.
- **Grid** — column count, gutter approach, max-width strategy

Present as text with SAFE/RISK format. Iterate until approved.

### 3-drill: Drill-downs (only if user requests adjustments)

When the user wants to change a specific section after initial approval, go deep
on that section rather than re-proposing everything:

- **Fonts:** Present 3-5 specific candidates with rationale from the knowledge base.
  Explain what each evokes. Build a new specimen in Figma for each candidate.
- **Colors:** Present 2-3 palette options with hex values. Explain the color theory
  reasoning. Build comparison swatches in Figma.
- **Aesthetic:** Walk through which directions fit their product and why. Reference
  research findings if available.
- **Layout/Spacing:** Present approaches with concrete tradeoffs for their product type.

Each drill-down is one focused conversation + Figma specimen. After the user decides,
re-run coherence validation against the rest of the system.

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

### Step 1: Create Brand Variables — Colors

Split into 2 calls if needed (primary+neutral in one, accent+semantic in another).

**Color scales** — convert all approved hex values to RGBA {r, g, b, a} on 0-1 scale:
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

### Brand Tokens
| Token | Hex | Usage |
|-------|-----|-------|
| Brand/Color/primary-500 | #XXXXXX | Primary actions |
| ... | ... | ... |

### Alias Tokens (Semantic)
| Token | → Brand Reference | Usage |
|-------|-------------------|-------|
| Alias/primary | → Brand/Color/primary-500 | Primary action fill |
| ... | ... | ... |

### CSS Custom Properties
[Full set of CSS variables mirroring Brand and Alias layers]

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

