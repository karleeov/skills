# RISC / full-contract setup gotchas (from J9222)

Learned while shipping `inspecto-5202-sql/contract-J9222/`. Apply on every **new RISC contract** SQL package (and any generated script with trade codes).

## 1. SQLCMD mode breaks on `&` in string literals

**Symptom:** `Msg 105 Unclosed quotation mark after the character string 'Syste'` near a line that looks fine (often a `sis_group` / `sis_team` insert with `T&C`).

**Cause:** SSMS **Query → SQLCMD Mode** (or `sqlcmd`) treats `&C` inside `'BS-PD-T&C'` as a variable/command and corrupts the string.

**Fix when generating SQL:** never emit a bare `&` inside `'…'` / `N'…'`. Split and rejoin:

```sql
-- bad
Team = 'BS-PD-T&C'
LocCode = 'T6&8'

-- good
Team = 'BS-PD-T' + CHAR(38) + 'C'
LocCode = 'T6' + CHAR(38) + '8'
N'Building Service - PD - T' + NCHAR(38) + N'C'
```

Also applies to work-type / description text containing `&` (e.g. `Falsework & Formwork`).

**Operator tip:** turn off SQLCMD Mode for plain T-SQL setup scripts if possible; still generate safe SQL so either mode works.

## 2. Action-view copy source must be verified, not assumed

RISC setup copies `SIS_INSPECT_RISC_ACTION_VIEW` from a peer contract (`@copyContractNo`).

**Symptom:** `Msg 50000 Setup stopped: copy source contract J9090 has no active SIS_INSPECT_RISC_ACTION_VIEW rows.`

**Lesson (J9222):** Wheelock peer **J9090** existed but had **0** active action-view rows; **J3836** had **13**. “Peer by email thread” ≠ ready copy source.

**Always:**

```sql
SELECT ContractNo, [Status], COUNT(*) AS n
FROM SIS_INSPECT_RISC_ACTION_VIEW
WHERE ContractNo IN ('J9090', 'J3836' /* candidates */)
GROUP BY ContractNo, [Status];
```

Set `@copyContractNo` to a contract with **active** rows > 0. Bake the check into **precheck** and **setup** (`RAISERROR` + `ROLLBACK` if empty). Prefer auto-fallback in precheck messaging; setup must use the verified source.

## 3. Package shape (worked example)

Mirror `inspecto-5202-sql/contract-J9222/` (and `contract-19209`):

| File | Role |
|------|------|
| `*-RISC-precheck.sql` | Read-only: source exists, action-view active count, target clean → READY / NOT READY |
| `*-RISC-setup.sql` | `BEGIN TRAN` → inserts → verification `SELECT` counts → user `COMMIT` / `ROLLBACK` |
| `*-RISC-rollback.sql` | Pre-go-live delete only (no transactional RISC data yet) |

Do **not** auto-COMMIT. Expected counts go in the setup footer and contract `readme.md`.

## 4. Locations (Location Adder style)

From `Location_Level_adder.xlsx`, use **Lv1 + Lv2** when the client sheet only has two levels:

| Level | LocCode | LocDescr |
|-------|---------|----------|
| Lv1 | `T1` | `T1` |
| Lv2 | `T1-21st Floor` | `21st Floor` |

- Bracket text `21st Floor (T1)` → parent `T1` + child floor
- Unbracketed rows → Lv1 roots
- Every node `Type = 'LocLv4'`; `SIS_LOCATION_LEVEL` with `ParentLevel = 1` only for Lv2→Lv1
- Fresh setup: bulk insert, no `IF NOT EXISTS` (precheck requires empty target)

## 5. Users / groups

- Roles from Excel → `sis_user_roles` only (no `aspnetusers` invent)
- Supervisors: **trade-scoped** `sis_group_member` (e.g. BS Supervisor → `BS` + `BS-*` only; STR → `STR` only)
- Missing Inspector / ARC Supervisor → document gap; Supervisors on INSPECTOR L2 as fallback if that matches peer pattern
- Fix obvious email typos in intake before insert

## 6. Out of scope for SQL (say so in readme)

- `template_risc_<Contract>.docx` deploy to app `Template\Pdf`
- PDF / Word form markup changes (consultant comments on sample forms)
- Login creation / ASP.NET membership

## Pointers

- Worked package: `inspecto-5202-sql/contract-J9222/`
- Generator pattern: `_generate.py` with `sql_a` / `sql_n` that split on `&`
- Peer pattern: `inspecto-5202-sql/contract-19209/` (J5205)
