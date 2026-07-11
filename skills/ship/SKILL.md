---
name: ship
description: "Run the full development flow from idea to committed code in one invocation. Sharpens the idea (grill), plans the work (spec + tickets), implements each ticket (complete-and-verify + TDD + code-review), and commits. Use when the user says 'ship', 'build this end to end', 'do it all', or wants a feature built from scratch to done."
---

# Ship

One command from idea to committed code. This skill orchestrates the entire flow — it does not implement anything itself. It drives each phase skill in order, clearing context between implementation tickets.

## When to use

- The user says "ship this", "build this end to end", "take it from idea to done"
- The user has a feature/fix idea and wants the full pipeline, not just one phase
- The user asks "can you do everything" or "run the whole flow"

**Do not use** when the user wants only one phase (use that phase's skill directly), or when the work is a huge multi-session effort (use `/wayfinder` instead).

## Process

### Phase 1 — Sharpen the idea

Run the grilling primitive to turn the raw idea into a clear, tested concept.

- **Have a codebase?** → Run `/grill-with-docs` (stateful: saves to `CONTEXT.md` + ADRs).
- **No codebase?** → Run `/grill-me` (stateless).

**If a question needs a runnable answer** (state, logic, UI), detour through `/prototype` via `/handoff` — then bring the answer back.

**Completion criterion:** the idea is sharp enough to spec — every open question has an answer or is explicitly deferred with a reason.

### Phase 2 — Plan the work

Decide scope and split into tickets.

1. Run `/to-spec` to turn the grilled idea into a formal spec.
2. Run `/to-tickets` to split the spec into tracer-bullet tickets with blocking edges.

**For small single-session work** (one function, one fix): skip both. Go straight to Phase 3 with the grilled idea as the spec.

**Completion criterion:** every unit of work is a ticket with a clear scope, or the work is small enough to implement directly.

### Phase 3 — Implement each ticket

For each ticket (or the single spec if Phase 2 was skipped), run `/implement` in a fresh context:

1. `/implement` starts `/complete-and-verify` — defines the full behavior contract + executable test plan.
2. `/implement` drives `/tdd` — builds one complete vertical slice at a time (red → green → refactor).
3. `/implement` runs `/code-review` — reviews Correctness, Standards, and Spec.
4. `/implement` fixes review findings and re-runs the completion gate.
5. `/implement` commits only after the completion gate passes with fresh evidence.

**Clear context between tickets.** Each ticket starts fresh — the ticket is the spec; the previous session's context is not carried forward.

**Completion criterion:** every ticket is implemented, verified, reviewed, and committed. The completion gate reports `Complete` for each.

### Phase 4 — Final verification

After all tickets are committed:

1. Run the full test suite.
2. Run typecheck and lint.
3. Run any integration or end-to-end tests.
4. Confirm no debug artifacts, skipped tests, or placeholders remain.

**Completion criterion:** the full suite is green and the codebase is clean.

### Phase 5 — Report

End with:

1. **Status:** `Shipped` or `Blocked`
2. **Tickets delivered:** each ticket, what it implemented, its commit SHA
3. **Test evidence:** suite name, command, result
4. **Review findings:** what was found and fixed
5. **Remaining:** any deferred work, accepted gaps, or follow-ups

## Context management

- Phases 1–2 stay in **one unbroken context window** (grilling + spec + tickets build on the same thinking).
- Each Phase 3 ticket starts **fresh** — use `/handoff` to bridge if context is tight.
- If the smart zone (~120k tokens) is approached before Phase 2 is done, `/handoff` and continue in a new thread.

## Failure handling

- **Grilling surfaces a question that can't be answered** → ask the user. Don't guess.
- **Implementation hits a blocker** → `/implement` reports `Incomplete`. Surface the blocker to the user with the exact next action.
- **Code-review finds a Critical** → fix it before moving to the next ticket. Never ship with an open Critical.
- **Full suite fails after all tickets** → the last ticket's completion gate was incomplete. Re-run `/implement` on the failing ticket.

## Relationship to other skills

Ship is a pure orchestrator — it calls other skills and manages context between them. It does not write code, run tests, or review diffs itself.

```
ship
 ├── grill-with-docs / grill-me    (Phase 1: sharpen)
 ├── to-spec → to-tickets          (Phase 2: plan)
 ├── implement (per ticket)        (Phase 3: build)
 │    ├── complete-and-verify
 │    ├── tdd
 │    └── code-review
 └── full suite verification       (Phase 4: verify)
```
