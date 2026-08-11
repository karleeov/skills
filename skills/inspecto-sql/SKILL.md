---
name: inspecto-sql
description: >-
  Inspecto SQL recipes: grant roles, add WF group members, unlock users,
  debug access, and bootstrap user/role SQL for a new contract.
  Use when the user asks for common Inspecto/SIS SQL, user roles, WF_GROUP,
  unlock/OTP, or to generate starter SQL for a new project/contract.
---

# Inspecto SQL

Parameterized **recipes** for common Inspecto / SIS ops SQL. Contract-specific one-offs stay in `inspecto-5202-sql/` (worked examples only). This skill owns the cookbook.

Recipes live beside this file: [INDEX.md](./INDEX.md), [recipes/](./recipes/).

How it works with project setup (illustrated): [illustrations/inspecto-ops-how-it-works/inspecto-ops-how-it-works.md](../../illustrations/inspecto-ops-how-it-works/inspecto-ops-how-it-works.md).

## Placeholders

Use `@Name` tokens in recipes. Fill only after the user supplies values (or confirm defaults). Never invent table/column names outside a recipe.

| Token | Meaning |
|-------|---------|
| `@Username` | Login / email |
| `@ContractNo` | Contract code (e.g. `J9190`, `ND/2024/08`) |
| `@FormType` | Form / module key in `SIS_USER_ROLES` (e.g. `SD`, `TC`, `Safety`) |
| `@Module` | WF module key (often same as form family; check existing `WF_GROUP`) |
| `@Role` | `Issuer` / `Reviewer` / … |
| `@GroupName` | `WF_GROUP.[Group]` value |

## Branches

Pick one from intent. Do not run writes against a live DB — emit SQL for the user to review and execute.

### 1. RECIPE — look up

1. Read [INDEX.md](./INDEX.md); match intent to a recipe file.
2. Open that `recipes/*.sql` and show it (with placeholder legend if helpful).

**Done when:** the matching recipe path is shown, or INDEX has no match and you say so.

### 2. FILL — ready-to-run SQL

1. Pick the recipe (RECIPE).
2. Collect every `@…` the recipe needs.
3. Emit the filled SQL only — no extra commentary inside the SQL block.
4. Flag risky recipes (`disable-otp-test-user`) as **test-only**.

**Done when:** filled SQL is in a fenced `sql` block and every placeholder is replaced or explicitly left with a note.

### 3. DEBUG — read-only first

1. Start from [recipes/debug-user-access.sql](./recipes/debug-user-access.sql); FILL with `@Username` / `@ContractNo` / `@Module` as known.
2. Interpret results with the user (missing role? missing group member? lockout? inactive status?).
3. Only then offer a write recipe (grant role, add member, unlock) — FILL after they confirm.

**Done when:** debug SELECTs were offered first, and any write SQL was gated on user confirmation.

### 4. NEW CONTRACT — bootstrap users/roles

Use when the user needs a **quick** user/role script without CSV intake.

1. If they have (or need) client fill-in sheets / full WF setup → hand off to **`/inspecto-project-setup`** (HANDOUT → VALIDATE → GENERATE one|all).
2. Otherwise collect `@ContractNo`, modules/`@FormType`s, and rows: username + role (+ group name when WF membership is needed).
3. Compose from [recipes/new-contract-users.sql](./recipes/new-contract-users.sql) plus FILL of grant-role / add-wf-group-member as needed.
4. Do **not** invent WF_WORKFLOW / role-map / full module setup here — that is `/inspecto-project-setup` + skeletons.

**Done when:** a single bootstrap SQL script is produced for the stated contract and user list, or the user was routed to project-setup.

### 5. ADD RECIPE — promote a pattern

1. Draft a parameterized `.sql` under `recipes/` + one INDEX row.
2. Ask: **add recipe?**
3. On yes only, write the files. Prefer patterns seen ≥2 times (support cases or patches).

**Done when:** recipe + INDEX exist, or the user declined.

## With other skills

- **`/inspecto-project-setup`** — CSV intake + full module setup SQL (one module or all); use this cookbook for atomic FILL inside GENERATE/TOP-UP.
- **`/support-case`** — SEARCH also greps this cookbook; after SAVE CASE, offer ADD RECIPE when the fix was repeatable SQL.
- **`/diagnosing-bugs`** — for app bugs; use DEBUG here when the question is “does this user have access in the DB?”
