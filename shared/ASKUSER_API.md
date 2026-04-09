# Mint Kit — AskUserQuestion API

AskUserQuestion takes a `questions` array (1-4 questions). Each question becomes a
**tab** in a wizard. The user navigates tabs, answers each, then submits all at once.

```
questions: [
  {
    header: "Brand vibe",          // tab label, max 12 chars
    question: "Conversational...",  // one paragraph, no bold/bullets
    multiSelect: false,
    options: [                      // 2-4 options, opinionated content
      { label: "Premium + minimal", description: "High-end coastal. Think linen..." },
      { label: "Surf + tropical",   description: "Bright, energetic, youthful..." }
    ]
  }
]
```

**Before every AskUserQuestion, re-ground the user:**
The `question` text must open with what's already locked and where you are in the
funnel. The user may have stepped away. One sentence. Examples:
- "Primary is locked at #0891b2 (deep teal). Now picking the neutral that sits alongside it."
- "Display font locked (Bricolage Grotesque). Picking a body font to pair with it."
- "Vibe lock says 'measured + precise.' Picking the primary color that carries that feeling."

**Explain the tradeoff in plain terms.** After the re-ground, the `question` field
should explain what the user is actually deciding and why it matters for their
product's users. Not "which font?" but "Your data-heavy users will read this body
font for hours. The choice here is comfort vs personality."

**Hard rules:**
- Max 4 options per question (2-4). "Type something" and "Chat about this" are auto-added.
- Max 4 questions per call (1-4). Each gets a tab. "Submit" tab is auto-added.
- `header` max 12 chars — short label like "Brand vibe", "Typography", "Figma file"
- `label` 1-5 words — the option title: "Premium + minimal", "Sharp + brutalist"
- `description` — one sentence explaining what you get: "Clean columns, neutral tones..."
- Put recommended option FIRST and add "(Recommended)" to its label
- The recommended option's `description` MUST include WHY, not just WHAT.
  WRONG: "Clean columns, neutral tones, generous whitespace"
  RIGHT: "Clean columns, neutral tones. This fits because your vibe lock says 'measured pace' and your product is data-heavy, so breathing room prevents cognitive overload."
  The WHAT is the label. The description is the reasoning.
- `question` text is conversational — one paragraph, no bold, no bullets, no numbered lists

**Options are OPINIONATED CONTENT, not meta-actions.**
- WRONG: "I'll answer in chat", "Pick one — I'll type the letter"
- RIGHT: "Premium + minimal", "Deep ocean + editorial", "Surf + tropical"

**Every option slot must be a real design choice.** Do NOT waste slots on "None of
these" or "Skip" — the auto-added "Type something" and "Chat about this" already
serve as escape hatches. If you have 4 slots, use all 4 for genuine options.

The user picks from your design judgment. They can always type a custom answer.

---

### Pick + Lock Pattern (iterative selection)

When presenting visual options that the user may want to iterate on (e.g., font
specimens, color palettes, component variants), use a 2-tab AskUserQuestion:

```
questions: [
  {
    header: "Pick",
    question: "[Context]. Which direction feels right?",
    multiSelect: false,
    options: [
      { label: "A: [Name] (Recommended)", description: "[Classification]. [WHY it fits — connect to vibe lock, research, or locked decisions. Not generic praise.]" },
      { label: "B: [Name]", description: "[Classification]. [What makes this different from A]" },
      { label: "C: [Name]", description: "[Classification]. [What makes this different]" },
      { label: "D: [Name]", description: "[Classification]. [What makes this different]" }
    ]
  },
  {
    header: "Lock",
    question: "Happy with your pick, or want to explore more in that direction?",
    multiSelect: false,
    options: [
      { label: "Lock it (Recommended)", description: "This is the one. Move on." },
      { label: "More like this", description: "Right direction, show me 4 alternatives." }
    ]
  }
]
```

- **Lock it** → decision made, proceed to next step
- **More like this** → fire a SECOND AskUserQuestion asking what specific traits
  they liked (multiSelect). Traits must be specific to the thing picked, not
  generic categories. Then build 4 NEW options (never repeat their pick) informed
  by the selected traits.
- **Custom text on the Pick tab** → do NOT assume a selection. If the user's
  response is free text (not one of the 4 options), ask which option they prefer
  before proceeding. Never infer a lock from ambiguous input.

**Trait extraction example (second call, only if "More like this"):**
```
questions: [{
  header: "What hit?",
  question: "What pulled you toward [name]? This helps me find the right alternatives.",
  multiSelect: true,
  options: [
    { label: "[Specific trait A]", description: "[What it looks like — concrete, not abstract]" },
    { label: "[Specific trait B]", description: "[Concrete observation]" },
    { label: "[Specific trait C]", description: "[Concrete observation]" },
    { label: "[Specific trait D]", description: "[Concrete observation]" }
  ]
}]
```

**When NOT to use Pick + Lock:** For bounded decisions where iteration isn't expected
(product type, file selection, yes/no gates). Use a Conviction Gate instead.

---

### Conviction Gates (yes/no and bounded decisions)

For decisions that aren't iterative (dark mode yes/no, accent color yes/no, research
opt-in, product type), the agent should ALWAYS have an opinion. Never present a
neutral yes/no. Frame the question as a recommendation with confirmation.

**The pattern:** State your recommendation and reasoning IN the question text.
Put the recommended option first with "(Recommended)" in the label. The other
option explains what you'd lose or gain by going the other way.

**WRONG (neutral wizard):**
```
"Does this product need a dark mode?"
- Yes
- No
```

**RIGHT (conviction gate):**
```
"Your users read bedtime stories on tablets. Dark mode isn't optional, it's
probably the primary mode. And the teal should feel warmer at night."
- Yes, add dark mode (Recommended) — "Your users will use this more than light."
- No, light only — "Skip for v1. Can add later."
```

**The reasoning must be product-specific.** Not "dark mode is nice to have" but
"your users stare at dashboards for 8 hours." If you can't ground the recommendation
in who uses the product, you don't have enough context to recommend. Ask for context
instead of guessing.

**This applies to ALL bounded decisions in the skill:**
- Dark mode (Step 6a)
- Accent color (3b-iv)
- Research opt-in (Phase 1)
- Product type (when you can infer it)
- Any yes/no gate where the product context gives you a clear answer

---

### Conviction Mode (signal-gated single recommendation)

Sometimes there's an obvious answer and forcing 4 options wastes the user's time
with throwaways. Conviction mode lets you lead with ONE recommendation — but ONLY
when specific signals justify it.

**Conviction mode is NOT "I feel confident."** LLMs have false confidence about
random things. The trigger must be a checkable signal, not a vibe.

**Qualifying signals (at least one MUST be true):**
- Brand/product name contains a color word ("Mint" Kit → mint green)
- User explicitly stated a preference in their input ("I want a monospace feel")
- Research found the user's existing brand already uses a specific color/font
- User's reference brands all converge on the same approach (3+ references point
  the same direction)
- A previous locked decision narrows the space to one obvious choice (e.g., locked
  a warm primary → warm-tinted neutral is the obvious call)

**If NO signal fires → default to the standard Pick + Lock with 4 options.**
The `(Recommended)` label on the first option already provides soft guidance for
users who want direction without skipping exploration.

**Conviction mode AskUserQuestion:**

Build the HTML specimen with your ONE recommendation, then:

```
questions: [{
  header: "Pick",
  question: "[WHY this is the right call — specific reasoning tied to the signal. Name the signal: 'Your brand is literally called Mint Kit' or 'You said you want monospace' or 'Your 3 reference brands all use warm neutrals.' Not generic praise.]",
  multiSelect: false,
  options: [
    { "label": "Lock it", "description": "This is the one. Move on." },
    { "label": "Right direction, refine it", "description": "The [hue/classification/approach] is right but adjust [specific axis]." },
    { "label": "Show me 4 alternatives", "description": "I want to compare before deciding." }
  ]
}]
```

- **"Lock it"** → locked, proceed
- **"Right direction, refine it"** → ask WHAT to adjust, rebuild with variations
  along the specific axis they name
- **"Show me 4 alternatives"** → build the standard 4-option divergent specimen
  and switch to Pick + Lock pattern

**Conviction mode works for any iterative decision:** primary color, neutral,
semantics, display font, body font, data font, component direction. The signal
conditions are universal — they apply wherever Pick + Lock applies.
