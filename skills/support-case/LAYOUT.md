# Support-case store layout

Default root (create on first save after user confirms):

```text
docs/agents/support-case/
  cases/
    YYYY-MM/
      ref-<slug>.md           ← one ticket / incident = one file
    _template.md              ← optional local copy of CASE-TEMPLATE.md
  memory/
    lessons.md                ← recurring patterns (short tables)
  knowledge.md                ← stable facts only
  reviews/
    review-01.md
```

Optional pointer file at `docs/agents/support-case.md`:

```markdown
# Support-case store

Root: `docs/agents/support-case/`
```

Use that when the store lives elsewhere (e.g. `skill/my-product-helpdesk/`).

## What’s inside each type

| Store | Format | Content |
|-------|--------|---------|
| `cases/YYYY-MM/ref-*.md` | Full report from case template | Question, answer, log quotes, code, SQL, root cause |
| `memory/lessons.md` | Short tables | Recurring root causes, anti-patterns, review log |
| `knowledge.md` | Stable facts only | Limits, status rules, paths — **not** ticket stories |
| `reviews/review-NN.md` | Batch notes | Themes from ~10 cases; what to promote |

## How it gets there

1. User says **yes** to “save case?” → new `cases/.../ref-*.md`
2. Every **10** cases → `reviews/` + promote patterns into `lessons.md`
3. User says **yes** to knowledge → edit `knowledge.md`
4. Files stay in git → next chat / next person can grep them

## How SEARCH works

Not an index service:

```text
grep cases/ for "503054795" or "UAA" or "unknown error"
read memory/lessons.md
read knowledge.md
```

No match → no past case; investigation continues with logs/code/DB.

## Stub: `memory/lessons.md`

```markdown
# Lessons

## Recurring root causes

| Pattern | Symptom cues | What to check first | Example cases |
|---------|--------------|---------------------|---------------|
| | | | |

## Anti-patterns

| Don't | Why | Do instead |
|-------|-----|------------|
| | | |

## Review log

| Review | Date | Cases covered | Notes |
|--------|------|---------------|-------|
| | | | |
```

## Stub: `knowledge.md`

```markdown
# Support knowledge

Stable facts only. Link to `cases/` for incident stories.

## Limits and quotas

|

## Status and error rules

|

## Important paths and configs

|
```
