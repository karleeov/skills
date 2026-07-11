---
name: code-review
description: Review the changes since a fixed point (commit, branch, tag, or merge-base) or the current working tree along three axes — Correctness (security, data loss, race conditions), Standards (does the code follow this repo's documented coding standards?), and Spec (does the code match what the originating issue/PRD asked for?). Runs all reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
---

Three-axis review of the diff between `HEAD` (or the working tree) and a fixed point the user supplies:

- **Correctness** — security vulnerabilities, data-loss paths, race conditions, injection, auth bypass, broken error handling, and other risks that standards/spec checks miss.
- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue / PRD / spec?

All three axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings.

The issue tracker should have been provided to you — run `/setup-skills` if `docs/agents/issue-tracker.md` is missing.

## Process

### 1. Pin the fixed point

Whatever the user said is the fixed point — a commit SHA, branch name, tag, `main`, `HEAD~5`, etc. If they didn't specify one, ask for it.

**Determine the diff scope.** If there are uncommitted changes (staged or unstaged) and the user is reviewing work-in-progress, capture the full working-tree diff:

```
git diff <fixed-point>...HEAD    # committed changes only
git diff HEAD                     # uncommitted changes (staged + unstaged)
git diff <fixed-point>           # everything: committed + uncommitted + untracked (after git add)
```

If the user said "review my changes" or invoked from `/implement` before committing, use `git diff <fixed-point>` against the baseline so uncommitted work is included. If they said "review this branch/PR", use `git diff <fixed-point>...HEAD` for committed changes only.

Also note the list of commits via `git log <fixed-point>..HEAD --oneline`.

Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the combined diff is non-empty. A bad ref or empty diff should fail here — not inside parallel sub-agents.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.) — fetch via the workflow in `docs/agents/issue-tracker.md`.
2. A path the user passed as an argument.
3. A PRD/spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".

### 3. Identify the standards sources

Anything in the repo that documents how code should be written, such as `CODING_STANDARDS.md` or `CONTRIBUTING.md`.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below — a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation — and, like any standard here, skip anything tooling already enforces.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name** — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code** — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy** — a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps** — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession** — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches** — the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery** — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change** — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality** — abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains** — long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man** — a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest** — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

### 4. Spawn all sub-agents in parallel

Send a single message with three `Agent` tool calls. Use the `general-purpose` subagent for each.

**Correctness sub-agent prompt** — include:

- The full diff command and commit list.
- The brief: "Review the diff for correctness and risk: (a) security vulnerabilities — injection, auth bypass, secret exposure, SSRF, path traversal; (b) data-loss paths — missing transactions, broken rollback, unsafe migrations; (c) race conditions and concurrency bugs; (d) error handling gaps — unhandled rejections, swallowed exceptions, missing retries where needed; (e) resource leaks — file handles, connections, memory. Name each finding, quote the hunk, and rate severity Critical/High/Medium/Low. Distinguish confirmed bugs from concerns that need human judgment. Under 400 words."

**Standards sub-agent prompt** — include:

- The full diff command and commit list.
- The list of standards-source files you found in step 3, **plus the smell baseline from step 3** pasted in full — the sub-agent has no other access to it.
- The brief: "Report — per file/hunk where relevant — (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls — documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** — include:

- The diff command and commit list.
- The path or fetched contents of the spec.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

### 5. Aggregate

Present the three reports under `## Correctness`, `## Standards`, and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings across axes — the three axes are deliberately separate.

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes — that's the reranking the separation exists to prevent.

## Why three axes

A change can pass two axes and fail the third:

- Code that follows every standard and matches the spec but has a SQL injection → **Correctness fail.**
- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking another. The Correctness axis exists because standards and spec checks do not catch security vulnerabilities, race conditions, or data-loss paths on their own.
