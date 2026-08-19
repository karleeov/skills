# Inspecto SQL recipes

| Intent | File | Notes |
|--------|------|-------|
| Grant SIS form role | [recipes/grant-sis-user-role.sql](./recipes/grant-sis-user-role.sql) | `SIS_USER_ROLES` |
| Add WF group member | [recipes/add-wf-group-member.sql](./recipes/add-wf-group-member.sql) | Resolves `GroupId` from `WF_GROUP` |
| Unlock locked login | [recipes/unlock-aspnet-user.sql](./recipes/unlock-aspnet-user.sql) | Clears `LockoutEndDateUtc` |
| Disable OTP (test) | [recipes/disable-otp-test-user.sql](./recipes/disable-otp-test-user.sql) | **Test accounts only** |
| Debug user access | [recipes/debug-user-access.sql](./recipes/debug-user-access.sql) | Read-only SELECT pack |
| New contract user bootstrap | [recipes/new-contract-users.sql](./recipes/new-contract-users.sql) | Compose roles + optional group members |
| RISC full-setup gotchas | [references/risc-setup-gotchas.md](./references/risc-setup-gotchas.md) | SQLCMD `&`, action-view copy source, package shape (J9222) |

Worked contract examples (not recipes):

- User/role patches: `inspecto-5202-sql/contract-*/patch/*user-roles*`
- Full RISC package: `inspecto-5202-sql/contract-J9222/` (also `contract-19209/`)
