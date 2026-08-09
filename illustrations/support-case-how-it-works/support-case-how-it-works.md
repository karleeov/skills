# /support-case — how it works & the flow

Durable helpdesk **recall** as versioned Markdown in git. No database. Search = grep/read.

![/support-case — how it works (hero overview)](imgs/00-support-case-hero-overview.png)

## How memory is stored

Three stores, different jobs:

| Store | Content |
|-------|---------|
| `cases/YYYY-MM/ref-*.md` | One incident = one file |
| `memory/lessons.md` | Recurring patterns |
| `knowledge.md` | Stable facts only (not ticket stories) |

![How /support-case memory is stored as Markdown](imgs/01-infographic-markdown-stores.png)

## Start here: store, then one branch

1. Resolve the store root (pointer → folder → propose create).
2. If missing, ask before scaffolding `docs/agents/support-case/`.
3. Pick **ONE** branch from intent — do not mix search into a save without asking.

![Resolve store then pick one branch](imgs/02-flowchart-store-and-branch.png)

## The four branches

![Four branches: SEARCH, SAVE CASE, SAVE KNOWLEDGE, REVIEW](imgs/03-flowchart-four-branches.png)

- **SEARCH** — grep `cases/`, read lessons + knowledge; report hits or “no past case”
- **SAVE CASE** — ask **save case?** → write `ref-*.md`; every 10 cases → REVIEW
- **SAVE KNOWLEDGE** — ask **update knowledge?** → edit facts only
- **REVIEW** — skim ~10 cases → `review-NN.md` → promote into `lessons.md`

## SAVE CASE deep dive

![SAVE CASE approval loop and every-10 review trigger](imgs/04-flowchart-save-case-loop.png)

Never write the case file until the user says **yes**.
