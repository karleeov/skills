# Skills system — how it works (all 25)

Visual guide to the engineering skills in this collection. Commands use `/skill-name`.

**Per-skill cards (25):** see [`skill-cards/README.md`](skill-cards/README.md).

## Catalog map

Every skill sits in a group. Unsure which to use? Start with **`/ask-dev`**.

![Skills catalog map of all 25 skills](imgs/01-infographic-catalog-map.png)

## Main flow: idea → shipped code

`/grill-with-docs` → `/to-spec` → `/to-tickets` → `/implement` → verified commits.  
Or let **`/ship`** own the whole path.

![Main flow from idea to shipped code](imgs/02-flowchart-main-flow.png)

## Inside `/implement`

`/complete-and-verify` → `/tdd` → `/code-review` (loop until green), then commit.

![Implement loop with completion gate](imgs/03-flowchart-implement-loop.png)

## On-ramps

| Situation | Skill |
|-----------|--------|
| Incoming issues you didn’t create | `/triage` |
| Hard / flaky bug | `/diagnosing-bugs` |
| Ticket / error recall | `/support-case` |
| Huge foggy effort | `/wayfinder` |

![On-ramps merging onto the main flow](imgs/04-infographic-onramps.png)

## Codebase health

`/improve-codebase-architecture` finds deepening work; that becomes an idea for `/grill-with-docs`. `/codebase-design` supplies the vocabulary.

![Codebase health path](imgs/05-infographic-codebase-health.png)

## Vocabulary underneath

Usually auto-invoked: `/grilling`, `/domain-modeling`, `/codebase-design`, plus `/writing-great-skills` as reference.

![Vocabulary layer under process skills](imgs/06-infographic-vocabulary.png)

## Session · learning · setup

![Session, learning, and setup skills](imgs/07-infographic-session-learning-setup.png)

## `/ship` owns delivery

One command from idea/audit/ticket to reviewed, verified commits.

![Ship owns the end-to-end run](imgs/08-flowchart-ship-owns-run.png)

## `/ask-dev` router

![Ask-dev router from situation to skill](imgs/09-flowchart-ask-dev-router.png)
