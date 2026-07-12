# Ship Runbook

Load this file when creating or resuming a run, dispatching a worker, or reconciling a result. It is operational state, not a product artifact.

## Durable location and lease

Resolve the repository-wide metadata root with `git rev-parse --git-common-dir`, make it absolute, and create `<common-dir>/ship-runs/`. Keep each record at `<common-dir>/ship-runs/<feature-slug>.md`. The common directory is shared by linked worktrees and keeps state out of feature commits.

Before updating a run, atomically create `<record-name>.lock` with the exact shape below. Do not take over a live lease or create a duplicate run for the same non-terminal work. Reclaim a stale lease only after confirming its worker no longer runs. Preserve terminal records; a later run uses `<feature-slug>-<run-id>.md`. Release the lease when pausing or reaching a terminal status.

```text
Run ID: <same value as the run record>
Owner: <session or worker identity>
Acquired: <ISO-8601 timestamp>
```

The lock is the first file created for a new run. Read it back after creation and keep it present for the entire active run. The adjacent record uses the same basename, run ID, owner, and acquired timestamp.

Never store credentials, tokens, secrets, or unnecessary personal data. At every transition update `Status`, `Phase`, `Next action`, and `Updated`. Trust a completed gate only while its artifact and tree identities still exist.

## Run record template

```markdown
# Ship run: <feature>

- Run ID: <stable ID>
- Status: Active | WaitingForUser | AwaitingResume | Blocked | RoutedToWayfinder | Shipped
- Phase: Start | Preflight | Discover | Plan | Execute | Integrate | Deliver
- Lease owner / updated: <session> / <timestamp>
- Lease acquired: <owner> at <ISO-8601 timestamp>
- Lease release: <terminal or pause status> at <ISO-8601 timestamp>
- Repository: <absolute path>
- Execution root / branch / HEAD: <absolute path> / <branch> / <sha>
- Base ref / SHA: <ref> / <sha>
- Endpoint: committed | pushed | pull-request | merged | deployed | released
- Source artifacts: <paths, issue URLs, audit references>
- Spec locator / revision: <path or URL> / <revision>
- Tracker: <configured workflow or local run record>
- Adopted pre-existing paths: <captured identity and assigned work item; transfer only when that item starts>
- Protected original paths: <unrelated paths plus snapshot identity>
- Baseline evidence: <command, exit status, meaningful result>
- Verification commands: <focused, static, lint, build, full suite, end-to-end>
- Updated: <timestamp>
- Next action: <one executable action>

## Decisions and scope

| ID | Decision or deferment | Evidence / answer | Owner | Status |
| -- | --------------------- | ----------------- | ----- | ------ |

## Requirements

| ID | Requirement | Source evidence | Ticket(s) | Observable check | Final evidence | Status |
| -- | ----------- | --------------- | --------- | ---------------- | -------------- | ------ |

## Work items

| ID | Locator | Requirements | Blocked by | State | Baseline | Candidate tree | Commit / no-op | Proof | Review |
| -- | ------- | ------------ | ---------- | ----- | -------- | -------------- | -------------- | ----- | ------ |

## Item evidence

Repeat for each completed item using these exact labels:

### <work-item ID>

- Candidate tree: <tree hash>
- Proof: `<exact command>` -> exit <code>; <meaningful result>
- Review Correctness: Pass - 0 blocking findings; <dispositions>
- Review Standards: Pass - 0 blocking findings; <dispositions>
- Review Spec: Pass - 0 blocking findings; <dispositions>
- Commit: <SHA/range, or no-op baseline SHA>

## Delivery evidence

- Final HEAD: <SHA>
- Final tree: <tree hash>
- Requirement <ID>: <commit SHA or no-op baseline SHA>
- Final proof: `<exact command>` -> exit <code>; <meaningful result>
- Final review Correctness: Pass - 0 blocking findings
- Final review Standards: Pass - 0 blocking findings
- Final review Spec: Pass - 0 blocking findings
- Endpoint verified: <endpoint and evidence>

## Event log

| Time | Status / phase | Event and evidence | Next action |
| ---- | -------------- | ------------------ | ----------- |
```

## Phase transitions

Do not jump over gates.

| From phase | To phase | Required evidence |
| ---------- | -------- | ----------------- |
| Start | Preflight | Record, endpoint, and lease exist |
| Preflight | Discover | Base, isolated root, dirty-path classification, baseline, and commands recorded |
| Discover | Plan | Approved decision brief and requirement inventory exist |
| Plan | Execute | Requirement coverage is exhaustive and work graph is valid |
| Execute | Execute | Item gate passed and next frontier item selected |
| Execute | Integrate | Every item is resolved |
| Integrate | Execute | Integration failure has a fix item |
| Integrate | Deliver | Clean-tree final proof, traceability, and branch review pass |
| Deliver | Terminal | Declared endpoint is independently verified |

`Status` overlays the phase. A pause sets `WaitingForUser`, `AwaitingResume`, or `Blocked`, records the exact condition and next action, and releases the lease without changing `Phase`. Resume acquires the lease, validates recorded identities, sets `Active`, and continues that phase. `RoutedToWayfinder` and `Shipped` are terminal. A report alone never makes a run shipped.

Write `Lease acquired` immediately after atomic creation, using an ISO-8601 timestamp. Before deleting the lock, write `Lease release` with the pending terminal or pause status and an ISO-8601 timestamp no earlier than acquisition. The absent lock plus both record fields are the durable lease audit trail.

## Ticket worker contract

Provide a fresh worker:

```markdown
Execute this work item through implementation, proof, three-axis review, fixes, and commit.

Every commit made in this worker starts `<work-item ID>:`. Do not create any unassigned feature commit.

Repository / execution root: <paths>
Work item: <ID and full body/locator>
Requirements: <IDs and text>
Spec: <locator and revision>
Item baseline SHA: <sha>
Approved public test seams: <seams>
Adopted pre-existing paths: <included paths subject to every gate>
Protected paths: None in this isolated root; original snapshot: <reference>
Known baseline failures: <evidence>
Required verification commands: <commands>
Commit policy: stage only item-owned changes; review the staged candidate tree; every commit subject is `<work-item ID>: <concise delivered behavior>`; no amend; no push

Apply implement, complete-and-verify, tdd, and code-review when available.
After every review fix, rerun proof and all three review axes. Persist the candidate hash, proof, and Correctness/Standards/Spec dispositions before commit.

Return:
- Status: Complete | No-op | Blocked
- Delivered behavior by requirement ID
- Item-owned files
- Candidate tree hash
- Exact commands, exit statuses, and meaningful results
- Review findings and dispositions
- Commit SHA/range or no-op evidence
- Remaining blocker and exact next action
```

The controller validates the SHA/range, candidate identity, path scope, clean execution tree, proof freshness, and tracker state. A worker summary alone is not proof.

## Reconciliation rules

- Code changed after review makes all three review axes stale.
- Code changed after a check requires rerunning every affected check.
- A commit hook that changes the committed tree makes that commit provisional; prove and review the actual result, then use a follow-up fix commit when needed. Hook changes left only in the worktree restart the item gate.
- A closed tracker item without commit/evidence must be reopened or marked for reconciliation.
- A commit whose tracker closure failed is preserved while tracker reconciliation retries; never duplicate it.
- A final integration failure creates a diagnosed fix item; do not blame the latest commit without evidence.
- Any change to protected original work stops the run before another write or commit.
