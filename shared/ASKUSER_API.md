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

The user picks from your design judgment. They can always type a custom answer.
