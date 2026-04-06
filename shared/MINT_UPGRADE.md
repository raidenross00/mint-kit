# Mint Kit — Upgrade Protocol

How skills detect, offer, and execute upgrades. Referenced by the preamble block
in every SKILL.md file.

## §1 Inline Upgrade Flow

Triggered when `bin/mint-update-check` outputs `UPGRADE_AVAILABLE <old> <new>`.

### Step 1: Check auto_upgrade config

```bash
_AUTO=$(grep -E '^auto_upgrade:' ~/mint-kit/config.yaml 2>/dev/null | awk '{print $2}' | tr -d '[:space:]' || true)
```

If `_AUTO` is `true`, skip to Step 3 (upgrade immediately).

### Step 2: AskUserQuestion

Present the upgrade decision. Follow ASKUSER_API.md structure (re-ground, explain,
recommend, options). Recommended option MUST be position 1.

```json
{
  "questions": [{
    "header": "Update",
    "question": "Mint Kit {new} is available (you have {old}). Updates include bug fixes and new features. I recommend upgrading now — it takes ~5 seconds and won't interrupt your work.",
    "multiSelect": false,
    "options": [
      { "label": "A: Upgrade now (Recommended)", "description": "Pull latest, run migrations, continue with your skill." },
      { "label": "B: Always auto-upgrade", "description": "Upgrade now and skip this prompt in future." },
      { "label": "C: Not now", "description": "Snooze this version. I'll ask again later (24h → 48h → 7d)." },
      { "label": "D: Never ask", "description": "Disable update checks entirely. Re-enable in ~/mint-kit/config.yaml." }
    ]
  }]
}
```

**If A (Upgrade now):** Continue to Step 3.

**If B (Always auto-upgrade):**
```bash
mkdir -p ~/mint-kit
if [ -f ~/mint-kit/config.yaml ]; then
  if grep -q '^auto_upgrade:' ~/mint-kit/config.yaml; then
    sed -i 's/^auto_upgrade:.*/auto_upgrade: true/' ~/mint-kit/config.yaml
  else
    echo "auto_upgrade: true" >> ~/mint-kit/config.yaml
  fi
else
  echo "auto_upgrade: true" > ~/mint-kit/config.yaml
fi
```
Then continue to Step 3.

**If C (Not now):**
```bash
# Read current snooze level, increment (or start at 1)
_LEVEL=1
if [ -f ~/mint-kit/update-snoozed ]; then
  _OLD_VER=$(awk '{print $1}' ~/mint-kit/update-snoozed)
  _OLD_LEVEL=$(awk '{print $2}' ~/mint-kit/update-snoozed)
  if [ "$_OLD_VER" = "{new}" ]; then
    _LEVEL=$(( _OLD_LEVEL + 1 ))
  fi
fi
echo "{new} $_LEVEL $(date +%s)" > ~/mint-kit/update-snoozed
```
Then continue with the original skill. Say nothing further about updates.

**If D (Never ask):**
```bash
mkdir -p ~/mint-kit
if [ -f ~/mint-kit/config.yaml ]; then
  if grep -q '^update_check:' ~/mint-kit/config.yaml; then
    sed -i 's/^update_check:.*/update_check: false/' ~/mint-kit/config.yaml
  else
    echo "update_check: false" >> ~/mint-kit/config.yaml
  fi
else
  echo "update_check: false" > ~/mint-kit/config.yaml
fi
```
Then continue with the original skill. Say nothing further about updates.

### Step 3: Upgrade

```bash
cd ~/.claude/skills/mint-kit && git fetch origin && git reset --hard origin/main
```

### Step 4: Run migrations

```bash
_OLD_VER="{old}"
for _MIG in $(ls ~/.claude/skills/mint-kit/migrations/v*.sh 2>/dev/null | sort -V); do
  _MIG_VER=$(basename "$_MIG" | sed 's/^v//;s/\.sh$//')
  # Run migration if its version is newer than the old version
  if [ "$(printf '%s\n' "$_OLD_VER" "$_MIG_VER" | sort -V | head -1)" = "$_OLD_VER" ] && [ "$_OLD_VER" != "$_MIG_VER" ]; then
    bash "$_MIG"
  fi
done
```

Migration scripts in `migrations/` are named `v{VERSION}.sh` (e.g., `v0.2.0.sh`).
They MUST be idempotent — safe to run multiple times. Each handles one version's
state changes (config format, file renames, checkpoint schema, etc.).

### Step 5: Write marker + clear cache

```bash
echo "{old}" > ~/mint-kit/just-upgraded-from
rm -f ~/mint-kit/last-update-check
rm -f ~/mint-kit/update-snoozed
```

### Step 6: Show What's New

Read `CHANGELOG.md` from the mint-kit directory. Find the entry for the new version.
Show 3-5 key bullets in the terminal. Use MINT_VOICE.md tone — brief, direct,
no celebration.

Format:
```
Updated Mint Kit {old} → {new}.

What's new:
- [bullet 1]
- [bullet 2]
- [bullet 3]
```

### Step 7: Continue

Proceed with the original skill the user invoked. The upgrade is invisible
except for the What's New summary.

## §2 JUST_UPGRADED Handling

Triggered when `bin/mint-update-check` outputs `JUST_UPGRADED <old> <new>`.
This happens on the NEXT skill invocation after an upgrade completed in a
previous session.

1. Read `CHANGELOG.md`, find the entry for `<new>`.
2. Show What's New (same format as §1 Step 6).
3. Continue with the original skill. No prompt, no AskUserQuestion.

## §3 Config Management

Config lives at `~/mint-kit/config.yaml`. Plain YAML, no nesting.

### Supported keys

| Key | Values | Default | Purpose |
|-----|--------|---------|---------|
| `update_check` | `true` / `false` | `true` | Enable/disable version checks |
| `auto_upgrade` | `true` / `false` | `false` | Auto-upgrade without prompting |

### Reading config (from bash)

```bash
grep -E '^{key}:' ~/mint-kit/config.yaml 2>/dev/null | awk '{print $2}' | tr -d '[:space:]' || true
```

Returns empty string if file missing or key not found. Callers treat empty as
the default value.

### Writing config (from bash)

```bash
mkdir -p ~/mint-kit
if [ -f ~/mint-kit/config.yaml ]; then
  if grep -q '^{key}:' ~/mint-kit/config.yaml; then
    sed -i 's/^{key}:.*/{key}: {value}/' ~/mint-kit/config.yaml
  else
    echo "{key}: {value}" >> ~/mint-kit/config.yaml
  fi
else
  echo "{key}: {value}" > ~/mint-kit/config.yaml
fi
```

### State files

| File | Purpose | Written by |
|------|---------|-----------|
| `last-update-check` | Cache: `UP_TO_DATE <ver>` or `UPGRADE_AVAILABLE <old> <new>` | mint-update-check |
| `just-upgraded-from` | Marker: old version string | Upgrade flow (§1 Step 5) |
| `update-snoozed` | Snooze: `<version> <level> <epoch>` | "Not now" handler (§1 Step 2C) |
| `config.yaml` | User preferences | Upgrade flow options B/D |
