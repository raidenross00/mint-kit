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

**Hard rules:**
- Max 4 options per question (2-4). "Type something" and "Chat about this" are auto-added.
- Max 4 questions per call (1-4). Each gets a tab. "Submit" tab is auto-added.
- `header` max 12 chars — short label like "Brand vibe", "Typography", "Figma file"
- `label` 1-5 words — the option title: "Premium + minimal", "Sharp + brutalist"
- `description` — one sentence explaining what you get: "Clean columns, neutral tones..."
- Put recommended option FIRST and add "(Recommended)" to its label
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
      { label: "A: [Name] (Recommended)", description: "[Why]" },
      { label: "B: [Name]", description: "[Why]" },
      { label: "C: [Name]", description: "[Why]" },
      { label: "D: [Name]", description: "[Why]" }
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
(product type, file selection, yes/no gates). Use a simple single-tab AskUserQuestion
for those.
