---
name: mint-system
description: Build a complete design system. HTML specimens for exploration, Figma for token system and team library publishing. Research, propose, explore via HTML previews, create 3-layer token variables (Brand/Alias/Role), lock into MINT.md. Part of the Mint Kit series.
---

# /mint-system — Design System Builder

Build a complete design system through conversation. Exploration specimens (type,
color) are HTML preview pages — zero Figma calls, real Google Fonts at screen
resolution, resizable viewport. The token system (Phase 4+)
is created in Figma. At the end, MINT.md is generated from the approved state.

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

### Partition Boundaries for mint-system

See FIGMA_API.md for the global "try first, split on failure" rule. If you DO
need to split, group logically:
- Brand color variables (all scales together if they fit)
- Brand spacing + opacity + type scale variables
- Text Styles + Effect Styles
- Alias variables

Exploration specimens (Phase 3b color, 3c type) use HTML preview pages — no Figma calls needed. See each phase for HTML generation details.

---

## AskUserQuestion API — How To Use It

Read and follow all rules in `~/.claude/skills/mint-kit/shared/ASKUSER_API.md`.

## Consultation Flow — When To Use It

Read `~/.claude/skills/mint-kit/shared/CONSULTATION_FLOW.md` for the full pattern.

**Consultation flow (progressive build, narration in browser):**
- Primary color (3b-i) — the personality
- Display font (3c-i) — the first impression
- Neutral color (3b-ii) — the workhorse

**Standard flow (AskUserQuestion + single specimen write):**
- Semantic colors (3b-iii), accent color (3b-iv)
- Body font (3c-ii), data font (3c-iii)
- Text colors (3d), spacing (3e)
- Everything in Phase 4+

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
If yes: use `update-config` skill to add the missing permissions. If no: continue.

**After permissions are handled (whether added or skipped), proceed IMMEDIATELY to
Phase 1.** Permissions are a gate, not a task. Do NOT stop here.

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

**If MINT.md exists in cwd — check if it's for THIS product:**
Read the first 10 lines of the existing MINT.md. Compare the product name/description
in it against the current project context (README, package.json, user's prompt).

**If the MINT.md is for a DIFFERENT product** (different name, different purpose, or
the user's prompt describes something unrelated): skip the update option entirely.
Tell the user: "There's a MINT.md here from [product name], but that's a different
product. I'll start fresh for [current product]." Then proceed as if no MINT.md exists.
Do NOT offer to update or carry over tokens from an unrelated system.

**If the MINT.md is for THIS product** (same name, same purpose): use AskUserQuestion:
```json
{
  "questions": [{
    "header": "Existing",
    "question": "You already have a MINT.md for this product. Want to update it (keep existing decisions, fill gaps) or start fresh (overwrite everything)?",
    "multiSelect": false,
    "options": [
      { "label": "Update (Recommended)", "description": "Keep locked decisions from the existing system. Only re-decide what's changed." },
      { "label": "Start fresh", "description": "Ignore the existing MINT.md completely. Every decision from scratch." },
      { "label": "Cancel", "description": "Stop. Keep the existing MINT.md as-is." }
    ]
  }]
}
```
- **Update:** Read the existing MINT.md. Use its decisions (fonts, colors, spacing)
  as starting context for Phase 3. Skip decisions that are already locked.
- **Fresh:** Ignore the existing MINT.md completely. Do NOT read it, do NOT reference
  its decisions. Proceed as if no MINT.md exists. It will be overwritten in Phase 5.
- **Cancel:** Stop the skill.

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
Not generic categories — real directions with personality.

**NO COLOR OR FONT LANGUAGE in vibe options.** These are decided later in dedicated
phases — mentioning them here anchors the user prematurely.
- No color names or palette words ("warm tones", "soft greens", "cream", "mint",
  "cool blues") — color is Phase 3b
- No font names or classifications ("geometric sans", "serif", "monospaced",
  "Grotesk") — type is Phase 3c
Describe the FEELING and SPACE, not the palette or typography. Example:
"Premium + minimal: High-end coastal. Think linen textures, gallery-clean layouts,
deliberate whitespace. Amalfi, not Bondi."

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
# Check Chromium is actually installed (binary exists but fails without it)
if [ -n "$_BROWSE" ]; then
  _HAS_CHROME=$(which chromium chromium-browser google-chrome google-chrome-stable 2>/dev/null | head -1)
  if [ -n "$_HAS_CHROME" ]; then
    echo "BROWSE_READY: $_BROWSE"
  else
    echo "BROWSE_NOT_AVAILABLE (no Chromium — browse binary exists but needs a browser)"
    _BROWSE=""
  fi
else
  echo "BROWSE_NOT_AVAILABLE"
fi
```

If `BROWSE_NOT_AVAILABLE`: skip visual research, use WebSearch only. Do NOT retry.
This is fine — WebSearch-only research still produces good results.

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

Phase 3 is a funnel: vibe lock (words) → color (primary → neutral → semantics) → type (display → body → data) → text colors → spacing.
Each step narrows. The vibe lock is the acceptance criteria for everything downstream.

During exploration, specimens use **hardcoded values** — the decisions aren't made yet.
After all dimensions are approved, Phase 4 creates the token system.

### Specimen Browser Tab — Single Tab, Auto-Refresh

**ALL specimens write to ONE file:** `~/Downloads/mint-kit/specimen.html`.
Do NOT use separate files per specimen type (no `-color-primary.html`,
`-type-display.html`, etc.). One file, overwritten each time.

**ALWAYS use the Write tool for specimen.html. NEVER Edit. NEVER Bash heredocs.**
- Edit shows line-by-line diffs in the terminal. Breaks the flow.
- Bash heredocs trigger "expansion obfuscation" security warnings on HTML with
  JavaScript (braces + quotes). These warnings prompt EVEN WITH accept edits on.
- The Write tool with accept edits on goes through silently. No diffs, no prompts.
- For the logo: reference it as a local `file://` path in the HTML `<img>` tag.
  No base64, no Bash encoding. See "Mint Kit logo" section above.

**Mint Kit logo on every specimen.** Every specimen HTML must include the Mint Kit
logo at the top of the page. The logo file is at:
`~/.claude/skills/mint-kit/shared/assets/mint-kit-logo.webp`

Reference it as a local file path. The specimen opens as `file://` in the browser,
so a local path works. No base64, no Bash commands, no prompts.
```html
<div style="text-align: center; padding: 20px 0 12px;">
  <img src="file:///home/USER/.claude/skills/mint-kit/shared/assets/mint-kit-logo.webp"
       alt="Mint Kit" style="height: 80px; opacity: 0.85;">
</div>
```
Replace `USER` with the actual username (get from the home directory path).
Place it top-center of the page, before the specimen content. Thumb-sized (80px
height), centered, with slight padding above and below.

**Open the browser ONCE.** Run `xdg-open ~/Downloads/mint-kit/specimen.html`
(or `open` on macOS) for the FIRST specimen only. All subsequent specimens
overwrite the same file. The auto-refresh script (below) handles the update.
Do NOT call `xdg-open` again — it opens a new tab every time.

**Every specimen HTML MUST include this auto-refresh script** in the `<head>`:
```html
<script>
// Auto-refresh when file changes (hash-based, no reload while reading)
(function() {
  let lastHash = null;
  async function checkForChanges() {
    try {
      const resp = await fetch(location.href + '?t=' + Date.now());
      const text = await resp.text();
      const hash = text.length + '-' + text.slice(0, 200);
      if (lastHash && hash !== lastHash) {
        location.reload();
      }
      lastHash = hash;
    } catch(e) {}
  }
  setInterval(checkForChanges, 1500);
})();
</script>
```

This checks every 1.5 seconds if the file changed. If it did, it reloads.
If the user is reading, no reload happens (content hasn't changed).
The `?t=` cache-buster prevents stale reads on `file://` protocol.

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
input you use later in 3b (color). Don't echo it back as part of the vibe lock.

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

  Saturation:  [contained / ambient / immersive — how much brand bleeds into surfaces]

    "contained" = brand color lives on buttons and accents only. Surfaces are
    neutral. Corporate, clean, the brand whispers.
    "ambient" = surfaces carry a subtle tint of the brand. Borders hint at the
    primary. The brand is in the air, not shouting. Most products live here.
    "immersive" = the brand IS the environment. Surfaces are tinted. Shadows
    are tinted. The whole page breathes the primary color. Bold, distinctive,
    impossible to mistake for another product.

    [Why this level. What kind of product needs this. How it affects the user's
    experience of the brand.]

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
- Color specimens (3b): "Does this palette feel [temperature] and [emotion]?"
- Neutral specimens (3b-ii): "Does the [saturation] level match? If 'immersive,' the
  primary-tinted neutral should be the recommended option, not the safe gray."
- Type specimens (3c): "Does this font feel [emotion] at [weight] with [pace]?"
- Dark mode (Step 6): "Does this dark mode match [saturation]? If 'ambient' or
  'immersive,' the brand-infused interpretation should be recommended over clean inversion."
- Spacing (3e): "Does this density match [pace] and [weight]?"
- Surfaces (Step 8): "Do the Map variables reflect [saturation]? If 'immersive,'
  surfaces/borders/shadows should carry the primary hue, not pure neutral."

### 3b: Color Specimens (layered funnel — primary → neutral → semantics)

Color follows the same layered funnel as type. Each layer builds on the locked
previous choice. The user never picks an entire palette at once — they pick the
primary, see the neutral rendered with it, and pick again.

**Research must inform color selection.** Same two-bucket rule as type:
- **Aspirational references** → lean into their palette qualities
- **Competitive references** → note their patterns, propose differentiation
Don't do research then propose generic palettes.

**Generate scales using compounding opacity.** Define the hero color (e.g.,
primary-500). Generate the full 50-950 scale by compounding 20% opacity reduction
per step — lighter steps compound toward white, darker toward black. Each step
composites FROM THE PREVIOUS STEP's result, not from the hero. See "Scale
Generation" in Phase 4 for the formula and code. For HTML specimens, use the
composited solid colors directly in CSS.

**Selection pattern (same for each layer):**

After generating the HTML preview, use the same 2-tab Pick + Lock AskUserQuestion
pattern as type selection. Label options A through D.

**Your recommendation MUST include WHY.** Option A gets "(Recommended)" in the label.
Its `description` explains WHY this is the right call, connected to the vibe lock,
research, or locked decisions. Not "A nice warm teal." Instead: "Warm teal. This fits
because your vibe lock says 'approachable + grounded' and the research showed your
competitors all use cold blues, so warm differentiates." The WHAT is the label. The
description is the reasoning.

- **"Lock it"** → lock the choice, move to next layer
- **"More like this"** → ask what they liked (specific traits: "the warmth",
  "the saturation level", "the hue family"), find 4 new options in that direction
- **"Type something" / "Chat about this"** → drop to conversational, diagnose

**CRITICAL — the 4 options must differ in HUE FAMILY, not just saturation/lightness.**
If all 4 are blue-greens at different saturations, you've failed to diverge.

#### 3b-i: Primary color (the personality) — 4-Act Consultation

Primary color uses a PROGRESSIVE SPECIMEN BUILD. Instead of generating a 4-column
grid all at once, you build the argument incrementally: narrate → write → narrate →
write → narrate → write → narrate → write → AskUserQuestion. The browser tab
auto-refreshes between writes. The user watches the argument build.

**BEFORE building options, check for conviction mode signals:**
1. Does the product/brand name contain a color word? ("Mint" Kit → mint green,
   "Blue" Ocean → blue, "Coral" → coral. This is the strongest signal. If the
   brand is NAMED after a color, that color MUST be Option A. Ignoring it makes
   you look stupid.)
2. Did the user explicitly state a color preference? ("I want teal", "we're a
   green brand")
3. Did research find the user's existing brand already uses a specific color?
4. Do 3+ reference brands converge on the same hue family?

Conviction signals affect TONE, not STRUCTURE. Even with maximum conviction, all
4 acts still run. The difference: Act 1 narration is more direct ("Your brand is
called Mint. The primary is mint green. This isn't a creative choice, it's a brand
decision."), and Acts 2-4 are framed as "here's why you might deviate from the
obvious" rather than "here are equal alternatives."

**Build 4 options with mandatory divergence (always, regardless of conviction):**
- Option A: your recommendation (informed by conviction signals or vibe lock)
- Option B: a different hue family entirely (the safe/expected category choice)
- Option C: a contrast/tension choice (unexpected hue that still fits the emotion)
- Option D: a wild card (different hue angle, different saturation level)

**Self-check:** if all 4 are within 30° of each other on the hue wheel, you've
failed. Cast wide — the iterate step narrows.

**Quality check:** each option must satisfy ALL THREE:
(a) Different hue family from the other 3 (30-degree enforcement)
(b) Unique rationale referencing a different user priority (e.g., differentiation,
    safety, warmth, boldness)
(c) References a specific research finding or vibe lock dimension
If an option can't satisfy all three, replace it before starting Act 1.

#### The 4-Act Sequence — Primary Color

**THE CONSULTATION LIVES IN THE BROWSER, NOT THE TERMINAL.**

All narration text (the reasoning, tradeoffs, recommendations) is embedded IN the
HTML specimen. The terminal goes silent during the build. The user watches the
browser as reasoning paragraphs and color specimens appear together, page by page.

**Before Act 1, use AskUserQuestion to hand off to the browser:**

```json
{
  "questions": [{
    "header": "Browser",
    "question": "Four directions for your primary, one at a time, with my reasoning for each. The page will update a few times over the next minute. Switch to your browser now. I'll ping you here when it's time to choose.",
    "multiSelect": false,
    "options": [
      { "label": "I'm watching the browser", "description": "Start building." }
    ]
  }]
}
```

After the user confirms, say NOTHING in the terminal until AskUserQuestion fires
after Act 4. No narration text, no commentary, no status updates. Just 4 silent
Write calls.

**Voice rules for ALL narration blocks (embedded in HTML):**
- Every narration must state a TRADEOFF, not just a description. "This teal is
  saturated" is a description. "This teal is saturated enough to have personality
  but not so saturated it screams at your data-heavy users for 8 hours" is a
  tradeoff. If you can't name the cost, the option doesn't belong.
- Connect every recommendation to the vibe lock. If you can't explain why Option A
  fits the vibe lock better than B, C, D, the recommendation is arbitrary.
- Never badmouth alternatives. "B is safe but boring" is badmouthing. "B is the
  expected choice for your category, which means zero differentiation risk but also
  zero personality" is tradeoff analysis.
- Research must appear in the narration. If Phase 2 found that 4 of 5 competitors
  use blue, that fact belongs in Act 2. Research that doesn't influence narration
  was wasted.
- Each narration block: 2-4 sentences, under 60 words. Exception: Act 4 summary.

**HTML layout: narration lives INSIDE each specimen column, not above the grid.**
Each column is a self-contained card: narration paragraph on top, then hero swatch,
scale, and legibility samples below. The reasoning travels with its color. You read
"warm herb green, basil in direct sunlight..." and the green is right there.

**Column card structure (each option):**
```
┌─────────────────────────┐
│ ACT 1 — THE RECOMMENDATION │  ← small label, muted, uppercase, 10px
│                         │
│ [Narration paragraph]   │  ← 13px, line-height 1.5, color #374151
│                         │
│ A: #4a7c59 [Recommended]│  ← option label + badge
│ ┌─────────────────────┐ │
│ │   Hero swatch 500   │ │  ← 140px height
│ └─────────────────────┘ │
│ [50..100..200.....950]  │  ← scale strip, compact
│                         │
│ Light surface legibility│
│ Dark surface legibility │
└─────────────────────────┘
```

**Narration styling (inside each column):**
- Font: system sans-serif, 13px, line-height 1.5, color #374151
- Act label above narration: uppercase, 10px, letter-spacing 0.05em, color #9ca3af
  (e.g., "ACT 1 — THE RECOMMENDATION", "ACT 2 — THE CHALLENGER")
- Padding: 12px, with a subtle bottom border separating narration from the specimen
- Keep narration SHORT. Under 60 words. The column is narrow in 4-up.

**Summary bar:** After the grid, a full-width summary paragraph compares all 4.
This is the only text that sits outside the columns:
- Font: 14px, semi-bold, color #1f2937
- Max-width: 100% of grid, padding 16px 0, top border separator
- "My pick: A (herb green) threads the needle... B is the safe fallback... C is
  real if... D is a bet on..."
- Final line in italic, muted: "Head back to terminal to make your pick."

##### Act 1: The Recommendation (full-width hero)

**Write specimen.html (Write 1):**

Overwrite `~/Downloads/mint-kit/specimen.html` (single-tab pattern).
If this is the FIRST specimen in the session, run `xdg-open` (Linux) or `open`
(macOS). Otherwise the existing tab auto-refreshes. Do NOT open a new tab.

HTML structure for Write 1:
- CSS grid: `grid-template-columns: 1fr`, `max-width: 480px; margin: 0 auto`
- Single column card containing (top to bottom):
  - Act label: "ACT 1 — THE RECOMMENDATION"
  - Narration: 2-4 sentences, under 60 words. Connect to vibe lock, research,
    conviction signals.
  - Option label: "A: [hex]" + "(Recommended)" badge
  - Hero swatch: 140px height, filled with 500-step color
  - Scale strip: 50-950 as horizontal row of 32px squares
  - Legibility (light): heading + body on primary-50 background
  - Legibility (dark): heading + body on primary-500 background, white text
  - Fonts: locked display/body fonts, or system sans-serif if not yet locked
  - NO neutral, NO semantics — just the primary in isolation
- Include the auto-refresh script in `<head>` (see "Specimen Browser Tab" above)

**NO other options visible yet.** Just one card: reasoning + color together.

##### Act 2: The Challenger (2-up split)

**Write specimen.html (Write 2):**

Overwrite with 2-up layout:
- CSS grid: `grid-template-columns: 1fr 1fr`, `max-width: 960px; margin: 0 auto; gap: 20px`
- Left column card: Option A (recommendation) — same card structure as Write 1
  (act label + narration + option label + badge + swatch + scale + legibility)
- Right column card: Option B (challenger) — same card structure, own act label
  ("ACT 2 — THE CHALLENGER"), own narration paragraph, no recommended badge

##### Act 3: The Tension (3-up)

**Write specimen.html (Write 3):**

Overwrite with 3-up layout:
- CSS grid: `grid-template-columns: 1fr 1fr 1fr`, `max-width: 1200px; margin: 0 auto; gap: 20px`
- Three column cards, each with its own act label + narration + specimen
- Column C has act label "ACT 3 — THE TENSION" and its own narration paragraph

##### Act 4: The Risk + Summary (full 4-up grid)

**Write specimen.html (Write 4):**

Overwrite with full 4-up grid:
- CSS grid: `grid-template-columns: repeat(4, 1fr)`, `max-width: 100%; gap: 20px; padding: 20px`
- Four column cards, each with its own act label + narration + specimen
- Column D has act label "ACT 4 — THE RISK" and its own narration paragraph
- **Summary bar below the grid** (full-width, spans all columns):
  Semi-bold, 14px, top border separator. Compares all 4: "My pick: A (teal)
  threads the needle... B is the safe fallback... C is real if... D is a bet on..."
  Final line in italic, muted: "Head back to terminal to make your pick."

**Then fire AskUserQuestion** in the terminal with the standard Pick + Lock 2-tab
pattern. Option A gets "(Recommended)" in the label. Each option's `description`
references the tradeoff stated in the narration — not generic praise. The WHAT
is the label. The description is the reasoning.

#### Recovery and Iteration — Primary

**Recovery:** If the sequence is interrupted (agent crashes, context limit, user
interrupts), check the current specimen.html column count and resume from the next
act. Do NOT restart from Act 1.

**"More like this" iteration:** When the user picks an option and selects "More like
this," the iteration round uses a STANDARD 4-up grid (single write), not the
progressive build. The progressive build serves first-impression pacing. On iteration,
the user already understands the pattern and wants to compare quickly.

Before the iteration grid, narrate a short summary (1-2 sentences): "You liked the
warmth of C. Here are 4 alternatives that keep that warmth but vary saturation and
hue angle." Then write the full 4-up grid in a single write.

Use the standard "What hit?" trait extraction AskUserQuestion (see ASKUSER_API.md
Pick + Lock Pattern) if the user selects "More like this" again.

Iterate until primary is locked.

#### 3b-ii: Neutral color (the workhorse)

Build 4 neutral options, each shown WITH the locked primary. The user sees how
the neutral sits alongside their primary — warm gray, cool gray, true gray, or
tinted neutral each feel completely different.

**MANDATORY DIVERGENCE — the 4 neutrals must use different temperature/tint strategies.**
- Option A: true neutral (pure gray, no tint)
- Option B: warm neutral (slight warm tint — sand, stone)
- Option C: cool neutral (slight cool tint — slate, steel)
- Option D: primary-tinted neutral (subtle tint pulled from the locked primary hue)

#### HTML Specimen Generation — Neutral

Overwrite `~/Downloads/mint-kit/specimen.html` (single-tab pattern).
Open in browser: `xdg-open` (Linux) or `open` (macOS).
On "More like this" iteration: overwrite, re-open.

HTML structure:
- 4-column CSS grid, one column per neutral option
- Each column shows a REALISTIC PAGE LAYOUT (not just swatches). The user must
  FEEL what living inside this neutral is like, not just see a scale strip:
  - **Page surface** (neutral-50 background, full-width) containing:
    - Heading in locked display font + body paragraph in locked body font
    - A card (neutral-50/white fill, neutral-200 border, subtle shadow) with
      heading, body text, and a metadata line in muted color
    - A primary button ("Get Started") + a secondary outline button ("Learn More")
    - An input field with neutral-300 border and placeholder text
  - **Dark surface preview** (neutral-900 background) with the same card layout
    using inverted text colors, showing how this neutral feels at night
  - **Border + shadow tinting** — for Option D (primary-tinted), the borders
    and shadows should visibly carry the primary hue. This is the thing that
    makes the user go "oh, THAT'S what brand-infused surfaces feel like."
  - Scale strip (50-950) below each layout for reference, NOT as the main content
  - Locked primary scale alongside for comparison

The layout IS the argument. If Option D (primary-tinted neutral) looks better
than Option A (pure gray) when shown as a real page, the user picks it without
needing to be told "brand infusion is good." Show, don't explain.

Iterate until neutral is locked.

#### 3b-iii: Semantic colors (the functional layer)

Build 4 semantic palette options, each shown WITH the locked primary + neutral.
Semantic colors are: success, warning, error, info.

Semantic colors have LESS creative latitude than primary/neutral. They must be
instantly recognizable (green=success, red=error, etc). The decision is about
tone and saturation — how do they sit within your locked primary + neutral?

**The 4 options should vary:**
- Option A: vivid/saturated semantics (high contrast, high energy)
- Option B: muted/desaturated semantics (quiet, sophisticated)
- Option C: warm-shifted semantics (amber warning instead of yellow, warm red error)
- Option D: primary-harmonized semantics (hues shifted to be more analogous with
  the locked primary)

#### HTML Specimen Generation — Semantics

Overwrite `~/Downloads/mint-kit/specimen.html` (single-tab pattern).
Open in browser: `xdg-open` (Linux) or `open` (macOS).
On "More like this" iteration: overwrite, re-open.

HTML structure:
- 4-column CSS grid, one column per semantic option
- Each column shows:
  - Success, Warning, Error, Info — each as a swatch + label
  - Each semantic color shown as: text on neutral-50, badge on neutral-100,
    filled alert bar with white text
  - All on locked neutral backgrounds with locked primary accents
  - Locked primary + neutral scales at top for reference

Iterate until semantics are locked.

#### 3b-iv: Accent color (OPTIONAL — gated)

After semantics are locked, ask whether the system needs a secondary/accent color:

```json
{
  "questions": [{
    "header": "Accent",
    "question": "Does this product need a secondary/accent color? Most products use one for secondary actions, links, or highlights alongside the primary.",
    "multiSelect": false,
    "options": [
      { "label": "No — primary only (Recommended)", "description": "Single-accent system. Primary handles all color emphasis." },
      { "label": "Yes — add an accent color", "description": "Opens a Pick+Lock exploration for a secondary color." }
    ]
  }]
}
```

**If No:** Write to checkpoint: `ACCENT: skipped`. Move to "After all layers are locked."

**If Yes:** Write to checkpoint: `ACCENT: exploring`. Open accent exploration using
the same Pick+Lock AskUserQuestion pattern as primary, but with **constrained
divergence** — options are derived from the locked primary hue, not random:

- Option A: **Analogous** (+30° from primary hue) — harmonious, safe pairing
- Option B: **Complementary** (180° from primary hue) — maximum contrast, bold
- Option C: **Split-complementary** (150° or 210° from primary) — contrast with less tension
- Option D: **Triadic** (120° from primary) — vibrant, high energy

**Self-check:** all 4 options should produce visually distinct accents that
complement (not clash with) the locked primary.

#### HTML Specimen Generation — Accent

Overwrite `~/Downloads/mint-kit/specimen.html` (single-tab pattern).
Open in browser: `xdg-open` (Linux) or `open` (macOS).
On "More like this" iteration: overwrite, re-open.

HTML structure:
- 4-column CSS grid, one column per accent option
- Each column shows:
  - Full accent scale (50-950) generated via compounding opacity
  - Locked primary scale alongside for comparison
  - Heading + body text on accent-500 background (legibility check)
  - Button pair: primary CTA + accent secondary action side by side
  - All on locked neutral backgrounds

Use the standard Pick + Lock AskUserQuestion. Option A's description explains WHY
this harmonic relationship works with the locked primary (e.g., "Analogous +30deg.
Sits next to your primary on the color wheel, so they feel like the same family.
Good for secondary actions that shouldn't compete with primary CTAs."). Iterate
until locked.

After locking, write to checkpoint: `ACCENT: locked [hero hex]`.
Note which accent steps are usable for text (typically 600+ on white). If the
accent fails AA across most backgrounds, flag: "This accent works for fills
and borders but not for text. Use primary for text-on-accent surfaces."

#### After all layers are locked

Confirm the full palette in plain text:
```
COLOR LOCKED:
  Primary: [hero hex] — [why, how it fits the vibe lock]
  Neutral: [temperature] — [why this neutral complements the primary]
  Semantics: [style] — [why this tone works with the system]
  Accent: [hero hex] — [relationship to primary] (or "skipped")
```

Move to 3c.

### 3c: Type Specimens (layered funnel — display → body → data)

**Before building:** Read `~/.claude/skills/mint-kit/mint-system/FONT_KNOWLEDGE_BASE.md`.

Type is decided in 3 layers. Each layer builds on the locked previous choice.
The user never picks 3 fonts at once — they pick one, see the next layer rendered
with it, and pick again.

**FIRST ROUND = MAXIMUM DIVERGENCE.** The first 4 options in every layer should be
as different from each other as possible while still being relevant to the vibe lock
and research. This is critical because the "More like this" iteration narrows toward
what the user liked. If the first round is already narrow (4 sans-serifs), there's
nowhere useful to iterate FROM. Cast the widest net first — serif, sans, slab, display,
monospace — then the iterate step focuses on the direction they chose.

**Show type ON the locked color system.** Colors are already locked at this point.
Type specimens use the locked primary and neutral palette as backgrounds and text
colors. The user evaluates how the font FEELS in their actual system, not on white.
- Page background: locked neutral-50 (or neutral-100 for sunken feel)
- Heading text color: locked text color for headings (neutral-900 or similar)
- Size labels: locked muted text color (neutral-400/500)
- Do NOT show body text, data font, buttons, or other UI elements that aren't
  locked yet. ONLY the font being evaluated at the sizes being evaluated.
  When selecting display font: display font only at hero/H1/H2/H3 sizes.
  When selecting body font: body font at body/small sizes, WITH the locked
  display font above it so the user sees the pairing. No fake buttons or cards.
  When selecting data font: data font in a table/number context.

**Selection pattern (same for each layer):**

After generating the HTML preview, use a 2-tab AskUserQuestion. Tab 1 picks the
direction, Tab 2 decides whether to lock or iterate in that direction.

```json
{
  "questions": [
    {
      "header": "Pick",
      "question": "[Layer-specific context]. Review the 4 options in the HTML preview in your browser. Which direction feels right?",
      "multiSelect": false,
      "options": [
        { "label": "A: [Font name] (Recommended)", "description": "[Classification]. [Why it fits the vibe lock]" },
        { "label": "B: [Font name]", "description": "[Classification]. [Why it fits]" },
        { "label": "C: [Font name]", "description": "[Classification]. [Why it fits]" },
        { "label": "D: [Font name]", "description": "[Classification]. [Why it fits]" }
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

**If user picks "Type something" or "Chat about this"** (auto-added by the UI) →
drop to conversational. Diagnose what went wrong, name 2-3 real brands that
match better, propose specific pivots. Narrow, don't re-open.

**All 4 Pick options must be REAL font/palette choices.** Do NOT waste a slot on
"None of these" — the auto-added "Type something" and "Chat about this" already
serve as escape hatches. 4 slots = 4 genuine design options.

#### 3c-i: Display font (the personality)

Build 4 display font options as an HTML preview. Each option shows the font at
hero (72px), H1 (48px), H2 (32px) sizes. Use real content from the product
context, not lorem ipsum.

**Research must inform font selection.** If Phase 2 research was done, your font
choices should reference what you found. Research references fall into two buckets
— know which you're using:

- **Aspirational references** (brands the user WANTS to feel like) → draw from
  them directly. If the user referenced Japanese stationery and you found Midori
  uses clean, quiet typography, propose fonts that capture that same quality.
  "This is in the spirit of what Midori does" is the right move.
- **Competitive references** (brands in the user's space they want to stand apart
  from) → note what they do, then propose options that differ. If every competitor
  uses geometric sans-serifs, one option should deliberately break from that.

Don't treat all research as "things to avoid." The user's own references and
inspirations are things to LEAN INTO. The competitor landscape is where you look
for differentiation. Name which bucket each reference falls into when explaining
your picks: "This captures the quality I saw in [aspirational brand]" or "This
breaks from the [competitor pattern] every product in your space uses."

Research that doesn't influence the proposals was wasted time.

**CRITICAL — the 4 options must use DIFFERENT font classifications.**
- Option A: the expected category choice for the vibe
- Option B: a DIFFERENT classification entirely (if A is sans, B must be serif/slab/display)
- Option C: a contrast/tension choice (the friction IS the personality)
- Option D: a RISK from a different era or aesthetic. If you're not uncomfortable
  proposing it, it's not wild enough.

**SELF-CHECK:** geometric, grotesque, neo-grotesque, humanist sans ALL count as
"sans-serif." They are ONE classification. If 3+ options are sans (under any
sub-label), you've failed. Replace before generating.

#### HTML Specimen Generation — Display

Overwrite `~/Downloads/mint-kit/specimen.html` (single-tab pattern).
Overwrite `~/Downloads/mint-kit/specimen.html` (single-tab pattern — see above).
If this is the FIRST specimen in the session, run `xdg-open` (Linux) or `open` (macOS).
Otherwise the existing tab auto-refreshes. Do NOT open a new tab.

HTML structure:
- Google Fonts loaded via `<link href="https://fonts.googleapis.com/css2?family=...">` in `<head>`
- Page background: locked neutral-50. Text color: locked heading color (neutral-900).
  Size labels: locked muted color (neutral-400). The type sits ON the locked palette.
- 4-column CSS grid (`display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding: 24px;`)
- Each column labeled A/B/C/D with font name as heading
- Real product content from user's context, not lorem ipsum
- Each column: ONLY the display font at hero (72px), H1 (48px), H2 (32px), H3 (24px)
- Do NOT show body text, buttons, cards, or any other UI. Just the display font
  at the sizes it will be used. The user evaluates the font itself, not a fake layout.

After generating, use the **selection pattern** above (Pick + Lock AskUserQuestion).
Label options A through D. Option A's description MUST explain WHY it fits (connect
to vibe lock, research, or locked decisions), not just name the classification.

Iterate until display font is locked.

#### 3c-ii: Body font (the workhorse)

Build 4 body font options as an HTML preview, each shown UNDERNEATH the locked
display font. The user sees the pairing live — display heading above, body text below.

**MANDATORY DIVERGENCE — the 4 body options must use different classifications.**
Before building, name the classification of each option. If you catch yourself
writing 4 sans-serifs, STOP and replace at least 2. The whole point is to show
the user what a serif body, a slab body, or a humanist body feels like under
their locked display — not 4 flavors of the same thing.

- Option A: same classification as display (the natural, cohesive pairing)
- Option B: **SERIF** (e.g., serif body under sans display, or vice versa)
- Option C: **DIFFERENT CATEGORY** (slab, humanist, monospace, old-style — NOT
  another flavor of the same classification as A)
- Option D: **RISK — a pairing that SHOULD NOT work.** This is the one that makes
  you uncomfortable. A monospaced body font. A display font at body weight. An
  old-style serif under a tech grotesque. If you're not nervous about Option D,
  it's not risky enough. "Another grotesque with ink traps" is NOT a risk.

**SELF-CHECK (mandatory, do this BEFORE generating the HTML):** Write out the 4
classifications in a list. Apply this rule: geometric, grotesque, neo-grotesque,
humanist sans, and ANY other sans-serif sub-family ALL count as "sans-serif."
They are the SAME classification for divergence purposes. If 3+ of your 4 options
are sans-serif (under any sub-label), you have FAILED. Go back and replace before
generating. You MUST have at least 2 non-sans options (serif, slab, mono, display,
old-style, etc.).

#### HTML Specimen Generation — Body

Overwrite `~/Downloads/mint-kit/specimen.html` (single-tab pattern).
Overwrite `~/Downloads/mint-kit/specimen.html` (single-tab pattern — see above).
If this is the FIRST specimen in the session, run `xdg-open` (Linux) or `open` (macOS).
Otherwise the existing tab auto-refreshes. Do NOT open a new tab.

HTML structure:
- Google Fonts loaded via `<link>` for BOTH the locked display font AND 4 body candidates
- 4-column CSS grid (`display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; padding: 40px;`)
- Each column labeled A/B/C/D with font name as heading
- TOP: locked display font at H2 (32px) — same text across all 4
- BELOW: body candidate at body (16px), small (14px), caption (13px)
- Show a real paragraph of product content at body size
- White/near-white background, no color

After generating, use the **selection pattern** above (Pick + Lock AskUserQuestion).
Label options A through D. Explain pairing rationale — why each body font
complements (or deliberately contrasts with) the locked display font.

Iterate until body font is locked.

#### 3c-iii: Data font (the functional layer)

Build 4 data font options as an HTML preview, shown alongside the locked display
+ body fonts. Data fonts handle numbers, tables, metadata, and inline data.

**NOT all data fonts are monospace.** Monospace is the default assumption, but many
products don't need it. A children's book doesn't need Courier Prime for page numbers.
A farm shop doesn't need IBM Plex Mono for prices. Match the data font to the product.

**MANDATORY DIVERGENCE — the 4 options must include different approaches:**
- Option A: the natural choice for THIS product (might be mono, might not)
- Option B: a proportional font with tabular-nums (e.g., DM Sans, Outfit, Inter
  with `font-variant-numeric: tabular-nums`). Numbers align without the mono look.
- Option C: the locked body font itself with tabular-nums enabled. Sometimes the
  answer is "you don't need a separate data font." Show what it looks like.
- Option D: a genuine contrast (mono if you haven't used one, a slab, a display
  font at small weight, something unexpected for this product)

**Self-check:** if all 4 are monospace, you've failed to diverge. The divergence
rule from display and body applies here too.

#### HTML Specimen Generation — Data

Overwrite `~/Downloads/mint-kit/specimen.html` (single-tab pattern).
Overwrite `~/Downloads/mint-kit/specimen.html` (single-tab pattern — see above).
If this is the FIRST specimen in the session, run `xdg-open` (Linux) or `open` (macOS).
Otherwise the existing tab auto-refreshes. Do NOT open a new tab.

HTML structure:
- Google Fonts loaded via `<link>` for locked display, locked body, AND 4 data candidates
- 4-column CSS grid (`display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; padding: 40px;`)
- Each column labeled A/B/C/D with font name as heading
- TOP: locked display at H3 (24px) + locked body at body (16px)
- BELOW: data candidate showing:
  - Code snippet or data sample (14px)
  - Tabular numbers: "1,234,567.89" aligned
  - Mixed context: body text with inline code
- White/near-white background, no color

After generating, use the **selection pattern** above (Pick + Lock AskUserQuestion).
Label options A through D. Option A's description explains WHY it pairs well with
the locked display + body stack (technical reasoning, not generic praise).

#### After all 3 layers are locked

The HTML previews showed the full journey: display options first, body options
(with display) next, data options (with both) last. All used the single
`~/Downloads/mint-kit/specimen.html` file (auto-refreshing in one tab).

Confirm the full stack in plain text:
```
TYPE LOCKED:
  Display: [font] — [why]
  Body:    [font] — [why it pairs]
  Data:    [font] — [why it works]
```

Move to 3d.

### 3d: Text Colors (the readability layer — needs locked type + color)

Build 4 text color approaches. This is a real design decision — not just "dark
text on light background." Depending on the locked primary and neutral, the right
answer could be near-black, soft gray, cream on dark surfaces, or tinted text
that pulls from the primary hue.

**Each option is a COMPLETE text color set:**
- Heading text color (on neutral surface)
- Body text color (on neutral surface)
- Muted/secondary text color
- Text on primary surface (what color is text on a primary-500 button?)
- Text on dark surface (if dark mode, what color is body text?)

**MANDATORY DIVERGENCE:**
- Option A: high contrast (near-black headings, dark gray body)
- Option B: softer contrast (medium gray, gentler on the eyes)
- Option C: tinted text (text color pulled from primary or neutral hue)
- Option D: inverted context (light text on colored/dark surfaces as the default)

**Check for conviction mode** (see ASKUSER_API.md). If the vibe lock strongly
implies one approach (e.g., "light and airy" = softer contrast), lead with one.

#### HTML Specimen Generation — Text Colors

Overwrite `~/Downloads/mint-kit/specimen.html` (single-tab pattern).
Open in browser: `xdg-open` (Linux) or `open` (macOS).
On iteration: overwrite, re-open.

HTML structure:
- Locked display + body fonts loaded via Google Fonts `<link>`
- 4-column CSS grid, one column per text color option
- Each column shows:
  - Heading + body paragraph on neutral-50 surface
  - Heading + body paragraph on neutral-100 surface
  - Heading + body paragraph on primary-500 surface
  - Heading + body paragraph on neutral-900 surface (dark preview)
  - Muted text sample (metadata, captions, timestamps)
  - All using locked fonts, locked color scales

Iterate until text colors are locked.

#### After text colors are locked

Confirm the text color choice in plain text:
```
TEXT COLORS LOCKED:
  Approach: [style] — [why this contrast/tint works with the locked type + color]
```

Move to Coherence Validation.

### Coherence Validation

After color, type, and text colors are locked, check if everything still matches the vibe lock.
Read the vibe lock words back. Does the locked type + color combination feel like
[emotion] at [temperature] with [weight]? If something drifted, flag it:

"Your vibe lock says [measured pace] but the type you picked has [energetic rhythm].
That's fine if intentional. Want to adjust the vibe lock to match what you actually
chose, or try different type?"

Always accept the user's final choice. Never refuse to proceed.

### 3e: Spacing + Shape (visual specimen — judged against vibe lock)

Spacing is decided visually, not conversationally. Numbers mean nothing without
context. The user needs to SEE what "tight" vs "generous" looks like with their
locked fonts and colors.

Shape philosophy ("round vs sharp") is a direction — specific radius and border
values are discovered by mint-lib during the DNA phase, not locked here.

**Build 4 density options as an HTML specimen** using the locked fonts, colors,
and text colors. Each option shows the SAME content at different spacings:

- Option A: **Tight** (4px base, minimal padding, compact gaps)
- Option B: **Default** (8px base, standard padding, comfortable gaps)
- Option C: **Generous** (8px base, extra padding, breathing room)
- Option D: **Airy** (12px base, large padding, editorial whitespace)

#### HTML Specimen Generation — Spacing

Overwrite `~/Downloads/mint-kit/specimen.html` (single-tab pattern).
If this is the FIRST specimen in the session, run `xdg-open` (Linux) or `open` (macOS).
Otherwise the existing tab auto-refreshes. Do NOT open a new tab.

HTML structure:
- 4-column CSS grid, one column per density option
- Each column uses locked fonts, colors, and text colors
- Each column shows a realistic card layout:
  - Heading (display font) + body paragraph (body font)
  - A small metadata line (caption size, muted text color)
  - A simulated button (primary-500 background, on-primary text)
  - A list of 3-4 items with vertical gaps
- The ONLY difference between columns is spacing values (padding, gap, margin)
- Label each column with the base unit and density name
- Show the actual px values for padding/gap so the difference is measurable

Use the standard Pick + Lock AskUserQuestion. Option A's description explains
WHY that density fits (connect to vibe lock's Weight and Pace).

**After density is locked, discuss shape direction in text:**
- **Shape direction** — round / sharp / mixed / soft-square. Tied to Emotion.
  Do NOT propose specific px values — just the direction. mint-lib discovers
  the actual radius during the DNA phase.
- **Grid** — column count, gutter approach, max-width strategy.

Present shape and grid with SAFE/RISK breakdown. Iterate until approved.

### 3-drill: Drill-downs (only if user requests adjustments)

When the user wants to change a specific section after approval, go deep
on that section rather than re-proposing everything:

- **Fonts:** Present 3-5 specific candidates. Build a new specimen for each.
- **Colors:** Present 2-3 palette options. Build comparison swatches.
- **Aesthetic:** Walk through which directions fit their product and why.
- **Layout/Spacing:** Present approaches with concrete tradeoffs.

Each drill-down is one focused conversation + Figma specimen. After the user decides,
re-run coherence validation.

### 3e: Motion — SKIP

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
Try to fit into as few `use_figma` calls as possible. Split only if a call fails.

**IMPORTANT — what gets created here (4 collections + styles):**
- **Brand** variables (color, spacing, opacity, type scale, font family, font weight) — raw primitives
- **Alias** variables (semantic mappings to Brand) — contextual meaning
- **Map** variables (Light/Dark modes) — usage-specific theme layer (text, icon, surface, border)
- **Responsive** variables (Desktop/Mobile modes) — breakpoint-aware typography
- Text Styles — the ONLY way to bind font family to text nodes
- Effect Styles — shadows, focus rings
- NO Role variables, NO border-width, NO border-radius — those are mint-lib's job

### Scale Generation — Compounding Opacity

All color scales MUST be generated using compounding opacity, NOT linear lightness
stepping. Linear lightness (stepping L in oklch or HSL) causes dark steps to
converge to the same near-black — 800/900/950 become visually indistinguishable.

**How it works — compounding opacity, NOT linear lightness stepping:**

The hero color (primary-500) is the anchor. Lighter steps compound toward white,
darker steps compound toward black. Each step reduces opacity by 20% FROM THE
PREVIOUS STEP, then the composited result is color-matched to a solid value.

This is NOT `500 × 0.6` for 300. It's `500 × 0.8 = 400`, then `400 × 0.8 = 300`.
The compounding creates a natural perceptual curve.

**Lighter steps (toward white):**
1. Start with primary-500 at 100% opacity on pure white (#FFFFFF)
2. 400 = composite primary-500 at 80% opacity on white → color-match to solid
3. 300 = composite the 400 result at 80% opacity on white → color-match to solid
4. 200 = composite the 300 result at 80% opacity on white → color-match to solid
5. 100 = composite the 200 result at 80% opacity on white → color-match to solid
6. 50  = composite the 100 result at 80% opacity on white → color-match to solid

**Darker steps (toward black):**
1. Start with primary-500 at 100% opacity on pure black (#000000)
2. 600 = composite primary-500 at 80% opacity on black → color-match to solid
3. 700 = composite the 600 result at 80% opacity on black → color-match to solid
4. 800 = composite the 700 result at 80% opacity on black → color-match to solid
5. 900 = composite the 800 result at 80% opacity on black → color-match to solid
6. 950 = composite the 900 result at 80% opacity on black → color-match to solid

**"Color-match to solid"** means: compute the actual RGB/oklch value that the
composited semi-transparent color produces, and store THAT as the variable value.
Every variable must be a solid color (opacity 1.0) — the opacity compositing is
a generation method, not a storage format.

**Compositing formula:** `result = fg × alpha + bg × (1 - alpha)`
Apply per-channel (R, G, B). For lighter: bg = white (1,1,1). For darker: bg = black (0,0,0).

4. Convert each solid result to sRGB for Figma storage.
   Figma variables use RGBA {r, g, b, a} on 0-1 scale (a is always 1.0).

**Scale generation in use_figma** (inline, no external deps):
```javascript
// Composite a foreground color at given opacity onto a background
// All values 0-1. Returns solid RGB (a=1).
function composite(fg, bg, alpha) {
  return {
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.g * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha),
    a: 1
  };
}

// Generate full scale from hero color (primary-500)
// hero = { r, g, b, a: 1 } in 0-1 range
function generateScale(hero) {
  const white = { r: 1, g: 1, b: 1 };
  const black = { r: 0, g: 0, b: 0 };
  const alpha = 0.8; // 20% reduction per step

  // Lighter steps: compound toward white
  const s400 = composite(hero, white, alpha);
  const s300 = composite(s400, white, alpha);
  const s200 = composite(s300, white, alpha);
  const s100 = composite(s200, white, alpha);
  const s50  = composite(s100, white, alpha);

  // Darker steps: compound toward black
  const s600 = composite(hero, black, alpha);
  const s700 = composite(s600, black, alpha);
  const s800 = composite(s700, black, alpha);
  const s900 = composite(s800, black, alpha);
  const s950 = composite(s900, black, alpha);

  return { 50: s50, 100: s100, 200: s200, 300: s300, 400: s400,
           500: hero, 600: s600, 700: s700, 800: s800, 900: s900, 950: s950 };
}

// Usage:
// const hero = { r: 0.08, g: 0.65, b: 0.42, a: 1 }; // your approved primary
// const scale = generateScale(hero);
// variable.setValueForMode(modeId, scale[500]);
```

**Why compounding opacity, not linear lightness:**
- Each step is visually distinct — linear lightness causes dark steps to converge
  to the same near-black (which is what you see when 800/900/950 look identical)
- Compounding preserves hue character at extremes — the 900 still reads as "that
  color, dark" instead of generic near-black
- Dark mode ready: the scale has usable differentiation across the full range
- The 20% step size produces 11 distinct, usable stops

### WCAG Contrast Ratio — Computation Helper

After generating scales, pre-compute WCAG contrast ratios for the Design System
Overview contrast matrix. This function lives alongside `composite()` and
`generateScale()` in the same `use_figma` call.

```javascript
// Convert sRGB channel (0-1) to linear RGB
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// Relative luminance (WCAG 2.1 definition)
function luminance(color) {
  const r = srgbToLinear(color.r);
  const g = srgbToLinear(color.g);
  const b = srgbToLinear(color.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// WCAG contrast ratio between two colors
// Returns a number >= 1. Higher = more contrast.
function contrastRatio(fg, bg) {
  const l1 = Math.max(luminance(fg), luminance(bg));
  const l2 = Math.min(luminance(fg), luminance(bg));
  return (l1 + 0.05) / (l2 + 0.05);
}

// WCAG pass/fail thresholds:
// AA normal text (16px+): ratio >= 4.5
// AA large text (24px+ or 18.66px+ bold): ratio >= 3.0
// AAA normal text: ratio >= 7.0
function wcagLevel(ratio) {
  if (ratio >= 7.0) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3.0) return "AA-large";
  return "FAIL";
}
```

**Worked example** (so the LLM follows this exactly):
- Primary-500 = `{r: 0.08, g: 0.65, b: 0.42}` (a teal-green)
- White = `{r: 1, g: 1, b: 1}`
- `luminance(primary-500)` = 0.2126×0.00577 + 0.7152×0.38905 + 0.0722×0.14996 = 0.290
- `luminance(white)` = 1.0
- `contrastRatio` = (1.0 + 0.05) / (0.290 + 0.05) = 3.09
- `wcagLevel(3.09)` = "AA-large" (passes for large text, fails for body text)

**Pre-compute lookup table after scale generation.** After `generateScale()` runs
for primary, neutral, and accent (if locked), compute ratios for every scale step
against white (`{r:1,g:1,b:1}`) and against neutral-900. Store as a map:

```javascript
// Build lookup table from generated scales
function buildContrastTable(scales, textColors) {
  const table = {};
  for (const [scaleName, scale] of Object.entries(scales)) {
    table[scaleName] = {};
    for (const [step, color] of Object.entries(scale)) {
      table[scaleName][step] = {};
      for (const [textName, textColor] of Object.entries(textColors)) {
        const ratio = contrastRatio(textColor, color);
        table[scaleName][step][textName] = {
          ratio: Math.round(ratio * 100) / 100,
          level: wcagLevel(ratio)
        };
      }
    }
  }
  return table;
}

// Usage (in the same use_figma call as scale generation):
// const textColors = {
//   heading: {r: 0.10, g: 0.10, b: 0.12},  // locked in 3d
//   body: {r: 0.22, g: 0.25, b: 0.31},
//   muted: {r: 0.42, g: 0.44, b: 0.50},
//   onPrimary: {r: 1, g: 1, b: 1},
//   onDark: {r: 0.98, g: 0.98, b: 0.98}
// };
// const contrastTable = buildContrastTable(
//   { primary: primaryScale, neutral: neutralScale },
//   textColors
// );
```

Write the lookup table to the checkpoint summary so Step 8 can read it without
recomputing. Format: `CONTRAST_TABLE: {json}`. Step 8 reads this table to
populate the contrast matrix cells.

### Step 1: Create Brand Variables — Colors

Try all color variables in ONE call. Split only if it fails due to size.

**Color scales** — generate using compounding opacity (see Scale Generation above), store as RGBA {r, g, b, a} on 0-1 scale:
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

### Step 2: Create Brand Variables — Spacing, Opacity, Type Scale, Fonts

**Spacing** — FLOAT variables:
- Brand/Space/2xs=2, xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48, 3xl=64, 4xl=96

**Opacity** — FLOAT variables:
- Brand/Opacity/disabled=0.4, hover=0.08, pressed=0.12, overlay=0.6, loading=0.6

**Type scale** — FLOAT variables (font SIZE only):
- Brand/Type/size-hero=72, size-h1=48, size-h2=32, size-h3=24, size-h4=20
- Brand/Type/size-body=16, size-small=14, size-caption=13, size-overline=11

**Font family** — STRING variables (source-of-truth reference, NOT bindable to
text nodes — Text Styles handle actual font binding):
- Brand/font-family/display=[locked display font name]
- Brand/font-family/body=[locked body font name]
- Brand/font-family/data=[locked data font name]

**Font weight** — FLOAT variables:
- Brand/font-weight/regular=400, medium=500, semibold=600, bold=700

**Scale** — FLOAT variables (raw type scale numbers):
- Brand/scale/h1=48, h2=32, h3=24, h4=20, h5=18, h6=16
- Brand/scale/p-large=18, p-medium=16, p-small=14, p-xsmall=12
- Brand/scale/line-height-tight=1.2, line-height-normal=1.5, line-height-relaxed=1.75

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

### Step 6: Create Map Variables

**Step 6a: Form an opinion about dark mode, THEN ask.**

Before asking, decide whether this product needs dark mode and WHY, based on
the product context and vibe lock. State your recommendation in the question text.

Examples of real reasoning:
- "Your users read bedtime stories on tablets. Dark mode isn't optional, it's
  probably the primary mode. And the teal should feel warmer at night."
- "This is a farm shop website. People browse on their phones in sunlight.
  Dark mode is nice-to-have, not essential. I'd skip it for v1."
- "Dashboards get stared at for hours. Dark mode reduces eye strain. Your
  users will switch to it within a week and never go back."

```json
{
  "questions": [{
    "header": "Dark mode",
    "question": "[Your opinion about whether this product needs dark mode and why, grounded in who uses it, when, and how. 2-3 sentences. End with the recommendation.]",
    "multiSelect": false,
    "options": [
      { "label": "[Yes/No] (Recommended)", "description": "[Why, connected to the product]" },
      { "label": "[The other option]", "description": "[What you'd lose or gain]" }
    ]
  }]
}
```

The recommended option goes first. The description explains why, not just what.

**If No:** Create the Map collection with a single mode (Light only). All Map
variables reference Alias with one set of values. Skip Step 6b. Proceed to Step 7.

**If Yes:** Proceed directly to Step 6b. No need to ask "auto or explore" — always
show multiple visual interpretations. The specimen IS the exploration.

**Step 6b: Dark mode exploration (ALWAYS visual, never auto-only).**

**Before building specimens, form an OPINION about which dark mode interpretation
fits THIS product.** You have the vibe lock, the locked colors, the product context.
Use them. Examples of real reasoning:

- Bioluminescent ocean product with teal primary → dark mode is where the brand
  comes alive. The accent should glow. Lead with brand-infused, not clean inversion.
- Corporate analytics dashboard → users stare at it for 8 hours. Clean inversion
  reduces fatigue. Brand-infused would be exhausting. Lead with clean.
- Children's storybook app → warm dark. Kids read at bedtime. The dark mode should
  feel like a nightlight, not a void.
- Luxury editorial → high contrast. Dark surfaces, bright type, dramatic. The brand
  whispers in light mode and commands in dark.

Your recommendation in the AskUserQuestion must explain WHY this interpretation
fits the product and its users. Not "brand-infused looks nice" but "your users
are divers who already associate teal with deep water. In dark mode, the teal
surface tint feels like descending. That's your brand, not decoration."

Do NOT default to brand-infused for every product. Do NOT default to clean
inversion for every product. Think about who uses this, when, and how dark
mode changes their relationship to the brand.

Whether the user chose "auto-generate" or "explore together," ALWAYS show
multiple interpretations. The difference is how many: auto shows 2 (safe +
brand-infused), explore shows 3-4. Never show just one generic inversion.

Generate an HTML specimen with side-by-side dark mode interpretations. Each
interpretation shows a REALISTIC PAGE LAYOUT (same as neutral specimens):
heading, body text, card with border and shadow, button pair, input field,
metadata line. NOT just swatches. The user must FEEL the difference.

**Interpretations to always include:**

- **A: Clean inversion** — neutral scale flipped, primary on actions only.
  Surfaces are pure dark neutral. Safe, professional, generic.
- **B: Brand-infused** — surfaces carry a subtle tint of the locked primary.
  Dark backgrounds shift toward the primary hue (e.g., mint-tinted dark
  instead of pure slate). Borders use primary-800/900 instead of neutral-700.
  Shadows tinted toward primary. The brand is AMBIENT, not just on buttons.
  This is the one most products should pick but most LLMs are afraid to propose.

**Additional interpretations for "explore together" mode:**

- **C: High contrast** — near-black backgrounds, bright primary accents,
  maximum separation between content and surface. Editorial, dramatic.
- **D: Warm dark** — dark surfaces tinted warm regardless of primary hue.
  Creates a cozy, approachable feel. Good for consumer products.

**CRITICAL — the brand-infused option (B) must be visually distinct from the
clean inversion (A).** If B looks like A with slightly different hex values, you
haven't gone far enough. The user should see B and think "oh, THAT'S what my
brand looks like as an environment." Tint the surfaces. Tint the borders.
Tint the shadows. Use primary-50 at 5-8% opacity as a surface wash. Use
primary-800 for borders instead of neutral-700. Make the brand breathe.

Overwrite `~/Downloads/mint-kit/specimen.html` (single-tab pattern).

HTML structure per interpretation:
- Full-width column with the realistic page layout
- Heading in locked display font, body in locked body font
- Card with heading, body, metadata, border, shadow
- Button pair (primary CTA + secondary outline)
- Input field with border and placeholder
- Semantic badges (success, warning, error, info)
- Label at top: interpretation name + one-line description

Use the Pick + Lock AskUserQuestion. Option B's description explains WHY
brand infusion works: "Your primary is [color]. Letting it tint the dark
surfaces means users feel the brand even in dark mode. Clean inversion
(Option A) makes dark mode feel like a different product."

Iterate until locked, then create Figma variables.

**Step 6c: Create Map variables in Figma.**

```javascript
// Create collection — 1 or 2 modes depending on dark mode choice
const collection = figma.variables.createVariableCollection("Map");
collection.modes[0].name = "Light";
// If dark mode: const darkModeId = collection.addMode("Dark");
const lightModeId = collection.modes[0].modeId;
```

Map variables reference Alias variables (which reference Brand). The Map layer
answers "what color is heading text?" with a different answer per mode. This is
what makes theme-switching a mode swap instead of manual rebinding.

Use `figma.variables.getVariableById(id)` to look up Alias variables from IDs
returned in Step 5.

**Map/text/** group:
- `heading` — Light: Alias/text-primary, Dark: Brand/Color/neutral-100
- `body` — Light: Alias/text-secondary, Dark: Brand/Color/neutral-200
- `action` — Light: Alias/primary, Dark: Alias/primary
- `action-hover` — Light: Alias/primary-hover, Dark: Alias/primary-hover
- `disabled` — Light: Alias/text-muted, Dark: Brand/Color/neutral-500
- `info` — Light: Alias/info, Dark: Alias/info-light
- `warning` — Light: Alias/warning, Dark: Alias/warning-light
- `success` — Light: Alias/success, Dark: Alias/success-light
- `error` — Light: Alias/error, Dark: Alias/error-light
- `on-action` — Light: Brand/Color/white, Dark: Brand/Color/white

**Map/icon/** group (mirrors text structure — icons typically match text colors):
- `default` — Light: Alias/text-secondary, Dark: Brand/Color/neutral-300
- `action`, `action-hover`, `disabled`, `info`, `warning`, `success`, `error`,
  `on-action` — same pattern as Map/text equivalents

**Map/surface/** group:
- `default` — Light: Brand/Color/white, Dark: Brand/Color/neutral-900
- `raised` — Light: Brand/Color/white, Dark: Brand/Color/neutral-800
- `sunken` — Light: Brand/Color/neutral-50, Dark: Brand/Color/neutral-950
- `overlay` — Light: Alias/overlay-bg, Dark: Alias/overlay-bg
- `action` — Light: Alias/primary, Dark: Alias/primary
- `action-hover` — Light: Alias/primary-hover, Dark: Alias/primary-hover
- `disabled` — Light: Brand/Color/neutral-100, Dark: Brand/Color/neutral-800
- `info`, `warning`, `success`, `error` — Light: semantic-light variants, Dark: semantic-dark variants

**Map/border/** group:
- `default` — Light: Brand/Color/neutral-200, Dark: Brand/Color/neutral-700
- `strong` — Light: Brand/Color/neutral-300, Dark: Brand/Color/neutral-600
- `focus` — Light: Alias/focus-ring, Dark: Alias/focus-ring
- `action` — Light: Alias/primary, Dark: Alias/primary
- `disabled` — Light: Brand/Color/neutral-200, Dark: Brand/Color/neutral-800
- `error` — Light: Alias/error, Dark: Alias/error
- `success` — Light: Alias/success, Dark: Alias/success

Return collection ID, mode ID(s), and all Map variable IDs.

### Step 7: Create Responsive Variables (Desktop/Mobile modes)

Always create the Responsive collection. Desktop values come directly from the
locked type scale (Phase 3c). Mobile values are auto-derived: headings reduce
(~0.75-0.85x depending on size — larger headings reduce more), body text stays
the same or reduces by 1-2px.

**Preview before committing.** Generate an HTML preview showing desktop and mobile
side by side BEFORE creating Figma variables:

Overwrite `~/Downloads/mint-kit/specimen.html` (single-tab pattern):
- Left column (max-width: 1440px): desktop type scale, all headings + body levels
- Right column (max-width: 440px): mobile type scale at derived sizes
- Real product content, locked fonts
- Show the actual px values next to each level so differences are obvious

Present for approval:
```json
{
  "questions": [{
    "header": "Responsive",
    "question": "Check the responsive preview. Desktop left, mobile right. The mobile sizes are derived from your locked scale.",
    "multiSelect": false,
    "options": [
      { "label": "Looks good, create it", "description": "Commit these values to Figma." },
      { "label": "Adjust", "description": "Tell me what needs to change." }
    ]
  }]
}
```

If "Adjust" — iterate on the HTML until approved, then create variables.

**Create Responsive variables in Figma:**

```javascript
const collection = figma.variables.createVariableCollection("Responsive");
collection.modes[0].name = "Desktop";
const mobileModeId = collection.addMode("Mobile");
const desktopModeId = collection.modes[0].modeId;
```

FLOAT variables only. Desktop values match the locked type scale from Phase 3c.

**Responsive/device-size** — Desktop: 1440, Mobile: 440

**Responsive/h1/** group:
- `font-size` — Desktop: [locked h1 size], Mobile: [approved reduced size]
- `line-height` — Desktop: [locked h1 line-height], Mobile: [proportional]
- `paragraph-spacing` — Desktop: [value], Mobile: [proportional]

**Responsive/h2/** through **h6/** — same structure

**Responsive/p-large/**, **p-medium/**, **p-small/**, **p-xsmall/** — same structure

Return collection ID, both mode IDs, and all Responsive variable IDs.

### Step 8: Build Design System Overview

**MANDATORY — do NOT skip to Phase 5 until this is complete.**

Build a "Design System Overview" page from scratch using Brand/Alias/Map variables,
Text Styles, and Effect Styles. **EVERY fill, stroke, spacing, and text node MUST be
variable-bound or style-applied. Zero hardcoded values.**

**Do NOT build component samples (buttons, inputs, cards).** That's mint-lib's job.
This page proves the TOKEN SYSTEM works, not the component library.

#### Split Strategy — 5 Planned Calls

The enriched overview is too large for one `use_figma` call. Split into 5 calls
by section group. Each call returns frame IDs that subsequent calls reference.

**Error recovery:** If any call fails, use `get_screenshot` to see what was built.
Build only the missing sections in a retry call. Do NOT rebuild what already exists.

**Call 1: Color System + Contrast Matrix**

Create a "Design System Overview" page. Build these sections:

- **Color Palette** — full Brand color swatches with labels + hex values.
  Each swatch fill bound to Brand/Color/* variables. On the primary and neutral
  scales, add a small WCAG ratio label to the 500 swatch showing contrast against
  white and against neutral-900. Note which steps are usable for text (typically
  600+ on white). On semantic colors, note minimum safe usage.
- **Accent Color** (only if checkpoint says `ACCENT: locked`) — full accent scale
  (50-950) alongside primary for comparison. Add WCAG annotations. If accent fails
  AA across most backgrounds: "This accent works for fills and borders but not for
  text." Usage annotation: "Use for secondary actions, links, highlights."
- **Contrast Pairing Matrix** — Read `CONTRAST_TABLE` from checkpoint. Build as a
  nested auto-layout grid:
  - Parent frame with VERTICAL layout
  - One child row frame per background color (primary-50 through 950, neutral-50
    through 950). Each row has HORIZONTAL layout.
  - Each cell in a row: small rectangle (40×40) with bg fill + sample text "Aa" in
    the text color + contrast ratio label below + pass/fail badge.
  - **Badge component:** Create once at the start of this call with two variants:
    pass (8px green circle, "AA" or "AAA" label) and fail (8px red circle, "FAIL").
    Place badge top-right of each cell.
  - Columns = resolved text color values from locked 3d decisions (heading, body,
    muted, on-primary, on-dark). Use actual hex values, not role names.
- **Recommended Pairings** — below the matrix, a condensed section showing ONLY
  combinations passing AA at 16px body (ratio >= 4.5:1). This is the cheat sheet
  designers actually use.

Return: page ID, all section frame IDs.

**Call 2: Typography Specimens**

Capped at ~24 text nodes total (8 per font). For each locked font (display, body, data):
- Hero size (bold weight) — one line of real product content
- Body size (regular weight) — one paragraph of real product content
- Body size (bold weight) — same paragraph
- Caption size (regular weight) — one line
- Character set: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
- Font name, classification, Google Fonts URL as annotation text
- Available weights listed (e.g., "Regular, Medium, Bold" or "2 weights available")
- **Fallback:** if font has only Regular + Bold, show both at all sizes. Label the
  limitation visibly so it's not hidden.

Each text node has a Text Style applied via `textStyleId`. Use real product content.

Return: section frame IDs.

**Call 3: Surfaces + Spacing + Elevation**

- **Surface Hierarchy** — four stacked rectangles showing depth:
  - Sunken (fill bound to Alias/surface-sunken, or neutral-100)
  - Default (fill bound to Alias/surface, or neutral-50/white)
  - Raised (fill bound to Alias/surface-raised, Elevation/sm effect style applied)
  - Overlay (fill bound to Alias/surface-overlay, Elevation/lg effect style applied)
  - Each labeled with semantic token name. Annotation: "Depth increases upward."
- **Spacing Scale** — visual blocks for each step (2xs through 4xl).
  Block width/height bound to Brand/Space/* variables.
- **Elevation / Shadows** — rectangles showing each Effect Style.
  `effectStyleId` applied to each.
- **Opacity Scale** — rectangles showing each opacity level.
  Opacity bound to Brand/Opacity/* variables.

Return: section frame IDs.

**Call 4: Theme + Responsive Previews**

- **Theme Preview** — duplicate the contrast pairings section (or a representative
  subset). Set one copy to Light mode, one to Dark mode via Map collection. Shows
  light and dark side by side. Use `frame.setExplicitVariableModeForCollection()`.
- **Responsive Preview** — show the type scale at Desktop and Mobile sizes.
  Two columns, each frame set to its respective Responsive mode.

Return: section frame IDs.

**Call 5: Usage Guide + Placeholders**

- **Usage Notes** — do/don't examples per section:
  - Color: "Do: use primary-500 for CTAs. Don't: use primary-300 for text (fails WCAG)."
  - Type: "Do: use display font for hero headlines only. Don't: use it for body text."
  - Spacing: "Do: use the scale values. Don't: use arbitrary pixel values."
  - Surfaces: "Do: use surface tokens. Don't: stack more than 2 elevation levels."
  - Quick reference: "Which token for which job" — a compact table.
- **Placeholder sections for /mint-lib** — three frames with dashed border, gray
  text, and clear labels. Use the naming convention from shared/FIGMA_API.md:
  - `[PLACEHOLDER] Interactive States` — "Run /mint-lib to fill this section."
  - `[PLACEHOLDER] Component Patterns` — "Run /mint-lib to fill this section."
  - `[PLACEHOLDER] Borders + Dividers` — "Run /mint-lib to fill this section."

Return: section frame IDs.

#### Verification

After all 5 calls complete, run verification:
```javascript
// Walk all nodes in the Overview page
// Count: nodes with bound variables vs hardcoded fills/strokes
// Count: text nodes with Text Styles vs unstyled text
// Return: { bound: N, hardcoded: N, styled: N, unstyled: N }
```
If hardcoded > 0, fix those nodes before proceeding.

Then use `get_screenshot` to visually verify the page.

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

Cross-reference this against what you intended to create. Verify:
- **4 collections exist**: Brand, Alias, Map, Responsive
- **Map has 2 modes**: Light and Dark
- **Responsive has 2 modes**: Desktop and Mobile
- **Map variables reference Alias** (not Brand directly)
- **Brand includes**: font-family (STRING), font-weight (FLOAT), scale (FLOAT)

If anything is missing, create it before writing MINT.md.

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

Color scales generated using compounding opacity (20% per step from hero).

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
```css
/* Hex values (generated via compounding opacity from hero) */
--color-primary-500: #XXXXXX;
/* Repeat for all Brand and Alias tokens */
```

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
_Include only if accent was locked during Phase 3b-iv. Omit this section if skipped._

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

### Handoff to /mint-lib

After CLAUDE.md is updated, hand off to /mint-lib using plan mode. This gives
the user the native Claude Code "clear context + auto approve edits" prompt,
which is the cleanest way to start a fresh session for the component library.

**Step 1:** Tell the user the design system is complete:

> "Your design system is ready. Tokens are in Figma, MINT.md is written.
> The next step is /mint-lib to build the component library. I'm going to
> hand off now so you can start fresh with a clean context."

**Step 2:** Enter plan mode with `EnterPlanMode`.

**Step 3:** Write the plan file with this content:

```markdown
# Handoff: mint-system complete → mint-lib

Design system is done. MINT.md is written. Figma tokens are published.

## Next step

Run `/mint-lib` to build the component library from your locked design system.
MINT.md has everything mint-lib needs — fonts, colors, spacing, vibe lock.
```

**Step 4:** Exit plan mode with `ExitPlanMode`.

The user sees Claude Code's native prompt: approve + clear context + auto approve
edits. They clear context, type `/mint-lib`, and start building components with
a fresh context window.

