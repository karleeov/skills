---
name: inspecto-project-setup
description: >-
  Inspecto project setup from CSV intake: hand out blank form-role CSVs,
  validate filled flow+people sheets, generate full module setup SQL for one
  module or all. Use when starting a new contract, collecting form roles from
  clients, or generating WF_WORKFLOW / groups / members / SIS_USER_ROLES SQL.
---

# Inspecto Project Setup

CSV-first **project setup** for Inspecto / DWSS contracts: clients fill one CSV per form (approval flow + usernames), then this skill validates and generates reviewable setup SQL.

Atomic ops (unlock, one-off grant) stay in [`/inspecto-sql`](../inspecto-sql/SKILL.md). This skill orchestrates **intake → validate → generate (one|all)**.

How it works with inspecto-sql & support-case (illustrated): [illustrations/inspecto-ops-how-it-works/inspecto-ops-how-it-works.md](../../illustrations/inspecto-ops-how-it-works/inspecto-ops-how-it-works.md).

Reference: [FORMATS.md](./FORMATS.md), [references/module-map.md](./references/module-map.md), [templates/](./templates/).

## Branches

Pick one from intent. Never execute SQL against a live DB.

### 1. HANDOUT — blank CSVs for the client

1. Collect `@ContractNo` and which modules (or default to all blanks under `templates/blank/`).
2. Copy `templates/contract.csv` + selected `templates/blank/<Module>.csv` into a folder the user names (e.g. `intake/<ContractNo>/`). Fill `contract.csv` with ContractNo / modules list.
3. Point the client at [FORMATS.md](./FORMATS.md) (columns + rules).

**Done when:** blank CSVs exist on disk at the stated path and the user has the column guide.

### 2. VALIDATE — check filled CSVs

1. Read `contract.csv` + each filled `<Module>.csv`. Skip lines starting with `#`.
2. Apply rules in [FORMATS.md](./FORMATS.md): required columns, trim emails (flag trailing spaces), RoleType in `Issuer|Reviewer|CLO`, GroupName present, no duplicate `(Email, GroupName, Step)`, module filename known in [module-map.md](./references/module-map.md).
3. Report a short checklist: OK rows, errors, warnings.

**Done when:** every selected CSV was checked and the user has a pass/fail list (no silent skips).

### 3. GENERATE — SQL for one module or all

1. Run VALIDATE first (or reuse a fresh pass).
2. Ask explicitly: **one module** or **all** modules with filled CSVs?
3. For each selected module:
   - If `references/skeletons/<Module>.sql` exists → full setup: inactivate → workflow/role-map/groups from skeleton (replace `@ContractNo`) → members + `SIS_USER_ROLES` from CSV people rows (same patterns as `/inspecto-sql` FILL).
   - If **no skeleton** → do **not** invent StatusId/SignatureKey chains. Emit members + roles only via `/inspecto-sql` patterns, and say: full WF needs a skeleton from a prior contract patch.
4. State scope (module list), source CSV paths, and write SQL to a user-confirmed path (prefer `inspecto-5202-sql/contract-*/patch/YYYYMMDD-…-user-roles.sql`) **or** show fenced `sql` blocks if they decline a file write.

**Done when:** SQL for every requested module was emitted (full or members-only with an explicit skeleton gap), and scope was stated.

### 4. DIFF / TOP-UP — groups already exist

Use when the contract/module already has active `WF_GROUP` rows and the client only added people.

1. VALIDATE the CSV.
2. Emit only `WF_GROUP_MEMBER` + `SIS_USER_ROLES` inserts (delegate FILL patterns to `/inspecto-sql`). Skip inactivate / workflow / group creates.

**Done when:** top-up SQL is emitted and labeled as members/roles-only.

## Scope choice (always ask on GENERATE)

| Choice | Behaviour |
|--------|-----------|
| **One module** | Single CSV → one `.sql` (or one fenced block) |
| **All modules** | Every filled module CSV → one file per module, or one combined script if the user asks for combined |

## With other skills

- **`/inspecto-sql`** — recipes for grant-role, add-member, unlock, debug; use TOP-UP or skeleton-gap paths. For **full RISC** (locations, inspect types, teams/workflow, action-view copy), follow `inspecto-sql` [risc-setup-gotchas](../inspecto-sql/references/risc-setup-gotchas.md) and mirror `inspecto-5202-sql/contract-J9222/` — CSV form-role intake alone is not enough.
- **`/support-case`** — SEARCH past tickets before inventing a new setup pattern.
- **`/ask-dev`** — routes “new contract / form roles CSV / setup SQL” here.
