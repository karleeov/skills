---
name: support-case
description: >-
  Search and save support-case memory as versioned Markdown in the repo.
  Use when the user wants to recall a past ticket, save a resolved case,
  update support knowledge, run a case review, or asks "have we seen this
  error / ticket / root cause before?"
---

# Support Case

Durable **recall** for helpdesk and support work: past cases, recurring lessons, and stable ops facts — all plain Markdown in git. No database. Search = grep/read.

This is **not** domain glossary work (`CONTEXT.md` / `/domain-modeling`) and **not** session handoff (`/handoff`). Cases are incident stories; knowledge is stable facts only.

## Store root

Resolve the store once per run:

1. If `docs/agents/support-case.md` exists, use the path it names.
2. Else if `docs/agents/support-case/` (or `support-case/`) already exists in the repo, use that.
3. Else propose creating `docs/agents/support-case/` and wait for confirmation before writing.

Layout, file roles, and templates: [LAYOUT.md](./LAYOUT.md), [CASE-TEMPLATE.md](./CASE-TEMPLATE.md).

## Branches

Pick one branch from the user's intent. Do not mix a save into a search without asking.

### 1. SEARCH — recall before investigating

Use when the user names a ticket id, error text, module, or asks if this has happened before.

1. Grep `cases/` for the ticket id, error substring, module, or symptom keywords (case-insensitive).
2. Read `memory/lessons.md` if present — match recurring root causes / anti-patterns.
3. Read `knowledge.md` if present — only for stable limits, status rules, paths.
4. If the ask touches users, roles, WF groups, unlock, OTP, or common Inspecto SQL: also grep the `/inspecto-sql` cookbook — resolve its folder next to this skill (`../inspecto-sql/`), read `INDEX.md`, and grep `recipes/` for matching intent. Report recipe paths; do not dump full SQL into knowledge.
5. Report hits with file paths and a one-line why each matched. Quote the root cause / answer briefly.
6. If nothing matches, say so explicitly and continue the investigation (logs / code / DB) — do not invent a past case.

**Done when:** every search surface was checked (including inspecto-sql when SQL/access-related) and the user has either matching refs or a clear "no past case."

### 2. SAVE CASE — archive a resolved incident

Use after a case is answered or a bug root cause is known. **Never write without explicit yes.**

1. Summarise what you will save (title, ref id, root cause in one line). Ask: **save case?**
2. On yes only:
   - Choose `cases/YYYY-MM/ref-<slug>.md` — prefer ticket/ref number; else a short kebab slug from the symptom.
   - Copy structure from [CASE-TEMPLATE.md](./CASE-TEMPLATE.md); fill every section you have evidence for; leave unknown sections as `TBD` rather than guessing.
   - Redact secrets, tokens, passwords, and unnecessary PII.
3. Count case files under `cases/` (all months). If the new total is a multiple of **10**, run branch 4 (review) in the same turn unless the user declines.
4. Optionally ask: any stable fact worth promoting to `knowledge.md`? (branch 3) — only if something is clearly not a one-off story.
5. If the fix was repeatable ops SQL (grant role, group member, unlock, …), optionally ask whether to promote it via **`/inspecto-sql` ADD RECIPE** — do not paste one-off SQL into `knowledge.md`.

**Done when:** the case file exists on disk at the stated path, or the user declined.

### 3. SAVE KNOWLEDGE — stable facts only

Use when the user confirms a durable ops fact (limit, status rule, path, config key).

1. State the exact edit. Ask: **update knowledge?**
2. On yes only, edit `knowledge.md` — facts, not ticket narratives. Create the file from the stub in [LAYOUT.md](./LAYOUT.md) if missing.
3. Do not dump case stories into knowledge; link to a `cases/...` ref instead.

**Done when:** `knowledge.md` reflects the approved fact, or the user declined.

### 4. REVIEW — every 10 cases

Use when case count hits a multiple of 10, or the user asks for a case review.

1. Skim the newest batch of ~10 cases.
2. Write `reviews/review-NN.md` (next zero-padded number) with: themes, false leads, gaps in the template.
3. Promote recurring root causes / anti-patterns into short rows in `memory/lessons.md` (create from [LAYOUT.md](./LAYOUT.md) stub if needed). Link each lesson to example `ref-*` paths.
4. Append one line to the review log table in `lessons.md`.

**Done when:** review file exists and `lessons.md` includes any promoted patterns (or an explicit "no new patterns" note in the review).

## With other skills

- **`/inspecto-sql`** — parameterized Inspecto SQL recipes (roles, groups, unlock, debug, new-contract bootstrap). SEARCH greps its cookbook; promote repeatable SQL via ADD RECIPE, not `knowledge.md`.
- **`/diagnosing-bugs`** / **`/triage`** — run SEARCH first when an error or ticket id is present; offer SAVE CASE when root cause is settled.
- **`/research`** — external sources; support-case is **internal** incident memory.
- **`/grill-with-docs`** — product/domain decisions → `CONTEXT.md` / ADRs, not cases.
