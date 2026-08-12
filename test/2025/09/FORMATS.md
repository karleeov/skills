# Form-role CSV format

Clients fill **one CSV per form/module**. Each data row is one person on one flow step/group.

## Files

| File | Purpose |
|------|---------|
| `contract.csv` | Contract metadata + module list |
| `<Module>.csv` | Flow + people for that form (see blank templates) |

Lines starting with `#` are comments — ignore on VALIDATE/GENERATE.

## `contract.csv` columns

| Column | Required | Example |
|--------|----------|---------|
| `ContractNo` | yes | `ND/2024/08` |
| `ProjectName` | no | `DWSS ND202408` |
| `Modules` | yes | `Safety,Cleansing,SiteDiary,LabourReturn,RISC` |

`Modules` is a comma-separated list of CSV basenames (must match [module-map.md](./references/module-map.md)).

## Per-form CSV columns

| Column | Required | Purpose |
|--------|----------|---------|
| `Step` | yes | Workflow step label (`0`, `1`, `2`, `6.1`, …) |
| `By` | no | Org (`GSJV` / `RSS`) |
| `ResponsiblePeople` | no | Job title on the flow sheet |
| `GroupName` | yes | Exact `WF_GROUP.[Group]` value |
| `Name` | no | Display name |
| `Email` | yes | Login / username (no trailing spaces) |
| `RoleType` | yes | Maps to `SIS_USER_ROLES.[role]` — see allowed list below |
| `Notes` | no | Free text |

## Validation rules

1. Header row must match the blank template (order may vary; names must match).
2. Trim `Email`; **fail** if original had leading/trailing spaces (common bug).
3. `RoleType` must be one of: `Issuer`, `Reviewer`, `CLO`, `Engineer`, `Supervisor`, `Enquiry`, `AsstEngineer`.
4. `GroupName` and `Email` required on every data row.
5. Fail duplicate `(Email, GroupName, Step)` within a file.
6. Module filename (without `.csv`) must appear in module-map.
7. Warn if `Email` lacks `@`.
8. Warn if `Step` is blank after trim.

## GENERATE mapping

- Distinct `(Step, GroupName)` rows drive which groups get members (and must align with skeleton group slots when doing full WF).
- Distinct `(Email, RoleType)` → `SIS_USER_ROLES` with `FormType` from module-map.
- Same email in multiple groups → multiple `WF_GROUP_MEMBER` inserts; one `SIS_USER_ROLES` row per `(Email, RoleType, FormType)` unless RoleType differs.

## RISC / inspection-form approval flow

When the client supplies an approval sheet like ND/2024/08 inspection form, map rows into `RISC.csv` using this step order:

1. GSJV — Engineer of GSJV — `GroupName=Engineer`
2. RSS — SIOW — `SIOW`
3. RSS — IOW/AIOW — `IOW`
4. RSS — WS1/WS2 — `WS/AIOW`
5. RSS — IOW/AIOW/ARE — `RE_IOW` (these users choose branch 6.1 or 6.2)
6.1. RSS — SIOW — `SIOW`
6.2. RSS — RE/SRE — `SRE/RE`
7. GSJV — Engineer of GSJV — `Engineer`

One CSV row per person per step. Same email may appear on multiple steps. Blank template: `templates/blank/RISC.csv`. Worked shape: `templates/risc-approval-flow.example.csv`.

## Handout tip

Send `templates/blank/*.csv` + `contract.csv` + this file. Keep worked examples (`form-roles.example.csv`, `risc-approval-flow.example.csv`) internal unless the client needs a filled sample.
