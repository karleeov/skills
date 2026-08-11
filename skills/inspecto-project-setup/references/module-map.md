# Module map

CSV basename → Inspecto module / form-type keys and notes.

| CSV file | WF `Module` | `SIS_USER_ROLES.formType` | Full-WF skeleton | Typical GroupName examples |
|----------|-------------|---------------------------|------------------|----------------------------|
| `Safety.csv` | `Safety` | `Safety` | none (v1) | `Contractor-Safety Officer`, `RSS-RE`, `RE` |
| `Cleansing.csv` | `Cleansing` | `Cleansing` | none (v1) | `Engineer`, `IOW`, `WS/AIOW` |
| `SiteDiary.csv` | `SiteDiary` | `SD` | [skeletons/SiteDiary.sql](./skeletons/SiteDiary.sql) | `WS`, `AIOW`, `SIOW`, `Site Team`, `Site Agent`, `CRE` |
| `LabourReturn.csv` | `LabourReturn` | `LR` | none (v1) | `CLO`, `Site Agent`, `LRO`, `SIOW` |
| `RISC.csv` | `RISC` | `RISC` | none (v1) | `Engineer`, `SIOW`, `IOW`, `WS/AIOW`, `RE_IOW`, `SRE/RE` |
| `CM_CE.csv` | `CM_CE` | `CM_CE` | none | `IssuerGroup` |
| `CM_PROG.csv` | `CM_PROG` | `CM_PROG` | none | `IssuerGroup` |
| `CM_EW.csv` | `CM_EW` | `CM_EW` | none | `IssuerGroup` |
| `CM_PMI.csv` | `CM_PMI` | `CM_PMI` | none | `IssuerGroup` |
| `CM_IP.csv` | `CM_IP` | `CM_IP` | none | `IssuerGroup` |

## Skeleton rule

Full `WF_WORKFLOW` / role-map / group **create** SQL is only emitted when a file exists under `references/skeletons/<Module>.sql`. Otherwise GENERATE emits members + roles only and states the gap.

To add a skeleton: copy a proven patch from `inspecto-5202-sql`, replace the contract literal with `@ContractNo`, document required `GroupName` slots in a short comment at the top.
