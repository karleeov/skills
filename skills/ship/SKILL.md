---
name: ship
description: "Ship a code change end to end from an idea, audit, spec, or ticket to reviewed commits with integration evidence. Use when the user explicitly asks to ship through commits, close every parity gap, or resume a ship run. Starts or resumes a durable full-scale workflow."
---

# Ship

Own delivery. Execute with tools; do not answer with a workflow summary, stop after discovery, or tell the user to invoke phase skills. An evidence-backed audit is input to implementation, not the deliverable.

One command starts and owns the run. It may continue across turns or fresh ticket workers. Continue until the declared endpoint is reached or a real decision, permission, or external blocker prevents progress.

The default endpoint is reviewed, verified local commits. Push, open a pull request, merge, deploy, or release only when the user explicitly requested it.

## Operating rules

- **Execute, do not recite.** Explore, edit, test, review, and commit.
- **Resume before restarting.** Continue a matching non-terminal run at its first incomplete gate. Reuse supplied audits, specs, tickets, test plans, and partial implementations after checking freshness.
- **The lease is physical.** The first run-state write atomically creates the RUNBOOK-shaped `.lock`; keep that file present for the entire active run. Recording lease text without the lock is not acquisition. Remove it only after persisting a pause or terminal release event.
- **Facts come from evidence.** Derive facts from code, tests, history, and docs. Ask only for product decisions, risky trade-offs, credentials, or required permission.
- **Protect existing work.** Classify pre-existing changes as adopted input or protected unrelated work. Never reset, stash, overwrite, stage, or commit protected work. Ask when provenance is ambiguous.
- **Every claim is traceable.** Give requirements stable IDs and map each to source evidence, a work item, an observable check, review evidence and a commit, or verified no-op evidence and the baseline SHA that already satisfies it.
- **Every feature commit is assigned.** Its subject starts `<work-item ID>:`. Use the same prefix for implementation, review-fix, hook-fix, and integration-fix commits; never create an unassigned feature commit.
- **Fresh evidence wins.** Record exact commands, exit statuses, and meaningful results against the current tree.
- **This workflow is authoritative.** Apply the methods from `grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `complete-and-verify`, `tdd`, and `code-review` when available. They are references, not commands the user must invoke. This skill's gates and pause policy control the run; if nested skill loading is unavailable, execute the same behavior directly.

Use the durable record and worker contract in [RUNBOOK.md](./RUNBOOK.md). Update it after every gate, commit, blocker, and decision. Keep it under the repository's common Git directory, outside the feature diff.

## 1. Start or resume

1. Resolve the repository and inspect `<git-common-dir>/ship-runs`.
2. If a matching non-terminal run exists, resume it when no active lease owns it; when a live lease exists, report `Blocked` with its owner rather than starting duplicate work. If only terminal records exist, preserve them and choose a uniquely suffixed record from the feature slug plus run ID.
3. Before any other run-state write or repository action, atomically create the matching `<record-name>.lock` with RUNBOOK's exact three-line content. Read it back, then create/update the record's `Lease acquired` field with the same owner and timestamp. Keep the lock present through every phase.
4. Capture supplied artifacts: audit, checklist, legacy map, spec, issue, reproduction, prototype result, or partial implementation.
5. Declare the endpoint. Use `committed` unless the user explicitly requested a later action.

**Gate:** the record names the repository, source artifacts, endpoint, current phase, and exact next action; this session owns the lease.

## 2. Preflight

1. Read repository instructions, domain docs, ADRs, contribution rules, and configured tracker workflow.
2. Inspect Git status, branch, `HEAD`, base branch or merge-base, remotes, and recent history. Record the base SHA and every pre-existing staged, unstaged, and untracked path. Classify user-supplied or explicitly included changes as adopted input; classify the rest as protected. Ask when unclear.
3. Identify real verification commands from CI, manifests, scripts, and nearby tests.
4. Check required tools, credentials, services, and tracker access. Use the configured tracker when available; otherwise keep planning state in the run record rather than pretending it was published.
5. Choose the execution root. Any source tree with pre-existing changes is evidence-contaminated: capture the adopted diff/content identity, create an isolated worktree and branch from recorded `HEAD`, and leave the original tree and index untouched. Assign each adopted path or hunk to one work item; transfer it only when that item starts. Follow an existing worktree/branch policy; if safe isolation or a proven transfer is unavailable, report `WaitingForUser`. A clean source tree may be used directly.
6. Use a dedicated, non-detached feature branch. Resolve the base/default/protected branch from repository policy, the remote default, or the recorded base ref. If the clean source tree is on that branch, create and switch to a feature branch before any ship commit; never commit directly to the base/default/protected branch or detached `HEAD`.
7. In the clean execution root, run a relevant baseline before editing, including the full test suite when practical. Record pre-existing failures. If adopted input itself must be characterized, run and record the focused checks again immediately after transferring it into its assigned item.

If there is no Git repository or project to change, the committed endpoint is impossible. Route a large greenfield or still-foggy effort through `wayfinder` and report `RoutedToWayfinder`; report `WaitingForUser` for a simple bootstrap decision.

**Gate:** base SHA, isolated execution root and dedicated feature branch, adopted/protected paths and snapshots, baseline evidence, verification commands, integrations, and endpoint are recorded. The execution root is clean, non-detached, off the base/default/protected branch, and contains no protected work.

## 3. Discover and sharpen

Explore current behavior before designing changes: public entry points, callers, persistence, side effects, tests, schemas, configuration, and failures. For a raw idea, apply `grill-with-docs`: resolve facts from the repo, ask one decision at a time, and record the approved decision brief.

If the user supplied an audit or checklist, validate its provenance and freshness, then continue from it. Re-open only contradictory, unsupported, stale, or high-risk findings. Do not repeat a sound audit to produce another report.

### Feature-parity branch

For a rewrite, migration, replacement, or legacy parity request, build or ingest:

| ID | Legacy behavior and trigger | Source evidence | Target evidence | Status | Risk | Observable check |
| -- | --------------------------- | --------------- | --------------- | ------ | ---- | ---------------- |

Cover user-visible behavior, authorization, validation, defaults, aggregation, ordering, rounding and currency, empty states, errors, persistence, external calls, exports, and compatibility contracts. Independent agents may map legacy and target behavior in parallel; the controller directly reads conflicting and highest-risk paths. Every `Gap` or `Uncertain` row becomes a requirement. Every required `Match` row gets a regression or compatibility check.

Use `prototype` only when a runnable experiment is the cheapest way to settle a decision. Keep prototype code outside production and record the accepted result. Route work whose destination still cannot be specified to `wayfinder`.

**Gate:** every in-scope behavior has a requirement ID and source evidence; material decisions are approved; unknowns are resolved or deferred with owner and reason. Audit findings have become implementation requirements, not the final answer.

## 4. Specify and schedule

1. Apply `to-spec`, or normalize an adequate supplied spec. Give every requirement and out-of-scope item a stable ID. Record acceptance behavior, invariants, failures, compatibility constraints, and approved public test seams. Save the locator and revision.
2. Apply `to-tickets` for full-scale work. Create tracer-bullet vertical slices that fit fresh worker contexts and verify independently. A genuinely single-context change may use one durable work item in the run record without publishing separate planning artifacts.
3. Each work item names requirement IDs, acceptance checks, seams, blockers, spec revision, and expected verification commands. Map every requirement to work and every item back to requirements.
4. Validate that the dependency graph is acyclic and has a frontier. Use expand-migrate-contract so each completed ticket stays green. When migration batches cannot stay green independently, keep them as checkpoints inside one unresolved integration ticket and commit only when its full gate passes; never call red batches complete.
5. Publish through the configured tracker when available. Schedule generated children and follow tracker rules for the parent rather than contradicting them. If local planning artifacts are tracked, put them in a dedicated reviewed planning commit; otherwise follow the existing ignore policy. Never add an ignore rule merely to hide artifacts.

The explicit ship request authorizes recommended routine test seams and decomposition, superseding phase-level confirmation prompts for those choices. Record the recommendation and continue. Pause only for a product decision, destructive migration, compatibility break, or materially different delivery strategy.

**Gate:** every requirement has an acceptance check and work item; the graph is valid; at least one unfinished item is on the frontier; each item is sufficient input for a fresh worker.

## 5. Execute the frontier

Work one frontier item at a time in deterministic dependency order. Use a fresh subagent when isolated workers are available; otherwise execute here. The controller owns repository safety and the final claim.

For each item:

1. Refresh the graph, atomically claim the item when supported, record `HEAD` as its baseline, and reserve its `<work-item ID>:` commit prefix. Confirm the execution root is clean and has no protected paths.
2. Transfer only the adopted paths or hunks assigned to this item and verify them against their captured identity. Give the executor the RUNBOOK worker contract: item/spec, requirement IDs, baseline SHA, seams, adopted input, required commands, and commit policy.
3. Apply `implement` with `complete-and-verify` as completion authority. Before further editing, write the completion matrix and executable test plan. Cover applicable happy, invalid, boundary, state, I/O, failure, compatibility, and unchanged behavior.
4. Apply `tdd` one vertical slice at a time at approved seams: red-capable check, minimal green implementation, refactor while green. If TDD is genuinely inapplicable, record why and use the strongest executable before/after proof; never fabricate red.
5. Add an automated regression check at the highest stable public seam for every changed behavior unless automation is genuinely unavailable. For the item's core behavior, name the smallest implementation mutation that removes it, apply that mutation temporarily, and observe the new check fail for the intended reason before restoring green. Then run focused tests, static analysis, lint/format, build, relevant full test suite, and reproduction or end-to-end checks. Record exact command, exit status, and result.
6. If fresh checks prove the item was already satisfied and there is no item diff, record no-op evidence and resolve it without reviewing an empty diff or creating an empty commit.
7. Otherwise identify the complete item-owned path set and stage it so new files are visible. Require no unstaged item change and no staged non-item path. Capture the candidate tree hash and apply `code-review` to `git diff --cached <item-baseline>` against the spec revision on Correctness, Standards, and Spec. Every confirmed correctness defect, spec deviation, and documented-standards violation blocks; disposition every heuristic concern.
8. Fix findings, restage the owned set, then rerun the completion gate and all three review axes. Any code change makes the prior review stale. Repeat until proof is green and all axes cover the exact staged candidate tree with zero blocking findings. Persist the candidate tree hash, proof commands/results, and Correctness, Standards, and Spec review dispositions in the run record before committing.
9. Commit the reviewed candidate with subject `<work-item ID>: <concise delivered behavior>`. Every follow-up or review-fix commit in the item's range uses the same ID prefix; no feature commit may be unassigned. Compare the commit tree to the candidate tree. If a hook changed the committed tree or left ship-owned changes, mark the commit provisional: prove and rerun all three review axes against the actual baseline-to-`HEAD` result, persist the replacement evidence, and make an ID-prefixed follow-up fix commit when needed. Never amend merely to hide the transition.
10. Verify final `HEAD` descends from the baseline, the execution tree is clean, and the reviewed result is committed. Record the SHA or commit range and evidence, then resolve the item.

If a worker blocks, preserve changes and evidence. Release its claim and work another independent item only from a clean safe tree. If implementation discovers scope, update the spec, requirements, and graph before coding it.

**Item gate:** every acceptance row is proven; each changed behavior has a sensitive automated regression check or a recorded accepted reason automation is unavailable; blocking findings are zero; all new files were reviewed; the final reviewed result is committed; the execution tree is clean; the item has a commit SHA/range or explicit no-op evidence; tracker and record agree.

**Phase gate:** every item is resolved. Open items with no frontier mean an invalid graph or blocker, not completion.

## 6. Integrate and deliver

1. Build aggregate traceability from every requirement to final code, test evidence, and commit. Missing rows create integration-fix items and return to the frontier.
2. Run fresh repository-wide proof against final `HEAD`: focused compatibility checks, static analysis, lint/format, build/package validation, the full test suite, and required integration/end-to-end workflows. Prefer a clean detached worktree or CI-equivalent checkout. Otherwise require tracked state to equal `HEAD` exactly and account for untracked or ignored runtime inputs.
3. Inspect for debug artifacts, skipped/focused tests, placeholders, accidental generated files, and scope creep. Confirm protected original paths remain untouched and adopted input is covered by proof and review.
4. Apply branch-wide `code-review` from the run base SHA to final `HEAD` on Correctness, Standards, and Spec. A failure or finding creates an integration-fix item; diagnose ownership from evidence rather than assuming the last ticket caused it.
5. Fulfil the declared endpoint. `committed` needs no network action. Push, PR, merge, deployment, or release requires explicit prior instruction and endpoint verification.

**Gate:** traceability is complete; clean-tree final proof is green or an accepted pre-existing gap is recorded; branch review has zero blocking findings; the execution tree is clean; the declared endpoint is reached and verified.

## 7. Report

Use the precise status:

- `WaitingForUser`: a named decision, permission, credential, or manual observation is required.
- `AwaitingResume`: the durable record is current but a fresh session is required; include its path and exact resume instruction.
- `Blocked`: evidence shows no safe executable frontier remains; include the next action.
- `RoutedToWayfinder`: discovery proved implementation cannot yet be specified.
- `Shipped`: the delivery gate passed.

End with status, endpoint, requirement coverage, work items and commit SHAs, exact final commands/results, findings fixed, protected existing changes, and deferred or accepted gaps. Never describe partial or merely audited work as shipped.

Before returning, write the terminal or pause status and lease-release event to the run record, then remove the lease. A terminal report with a live lease is incomplete.
