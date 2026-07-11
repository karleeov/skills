---
name: skill-check
description: Self-diagnostic for this skills repo. Runs the structural validator, reports which skills are valid vs broken, and offers to fix problems. Use when the user asks to "check skills", "validate skills", "are my skills working", or before/after editing skills.
---

# Skill Check

Run this repo's structural validator against `skills/*/SKILL.md` and report the health of every skill. This is the agent-invokable twin of `npm run lint` — use it from inside a session when you want to verify the skills are loadable by opencode.

## Process

### 1. Run the validator

Run from the repo root (this skills repo):

```bash
npm run lint
```

Capture the full output. It checks, per skill:
- Valid YAML frontmatter with `name` and `description`
- `name` matches the folder name and the regex `^[a-z0-9]+(-[a-z0-9]+)*$`
- `description` is 1–1024 chars
- Relative markdown links resolve
- No duplicate skill names
- Warns on opencode-ignored frontmatter fields (e.g. `disable-model-invocation`)

### 2. Report

Present the result as a table: one row per skill, columns `skill | status (ok/warn/fail) | issue`. Summarize totals at the bottom (X/Y passed, N warnings, M errors). Do not paraphrase the validator's verdicts — relay them.

### 3. Offer to fix

For each failing skill, name the concrete fix (e.g. "frontmatter name `Wayfinder` doesn't match folder `wayfinder` — rename to lowercase"). Ask the user which to fix, then apply the fix and re-run `npm run lint` to confirm it now passes.

Common fixes:
- **Name/folder mismatch** — make the `name` field lowercase and equal to the folder name.
- **Broken link** — fix the path or wrap the example in a fenced code block (links inside code blocks are intentionally skipped).
- **Unknown frontmatter field** — this is only a warning. `disable-model-invocation` and `argument-hint` are Claude-Code-only and ignored by opencode; to make a skill user-only in opencode, use `permission.skill` rules in `opencode.json` instead. Leave the field or remove it — the user's call.

### 4. (Optional) Behavioral check

If the user wants a deeper check, mention `npm run smoke` exists but requires model calls (costs tokens). Don't run it unprompted.

## Completion criterion

Done when `npm run lint` exits 0 (warnings acceptable) and every previously-failing skill is accounted for — either fixed or explicitly declined by the user.
