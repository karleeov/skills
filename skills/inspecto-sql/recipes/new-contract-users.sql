-- Bootstrap users/roles for a NEW CONTRACT (not full WF/workflow setup).
-- Replace the sample rows; keep dateadd(hour, 8, getdate()) pattern.
-- Placeholders in each row: @Username, @Role, @ContractNo, @FormType
-- Optional block: @Module, @GroupName for WF_GROUP_MEMBER

-- =============================================================================
-- 1) Form roles (SIS_USER_ROLES) — duplicate VALUES lines per user
-- =============================================================================
INSERT INTO SIS_USER_ROLES (
  [username],
  [role],
  [contractNo],
  [createdDate],
  [createdUser],
  [lastModifiedDate],
  [lastModifiedUser],
  [status],
  [formType]
) VALUES
('@Username', '@Role', '@ContractNo', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', '@FormType');
-- ('user2@example.com', 'Reviewer', '@ContractNo', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', '@FormType'),
-- ...

-- =============================================================================
-- 2) WF group membership (optional) — one INSERT…SELECT per user/group
-- Requires WF_GROUP rows already exist for @ContractNo / @Module / @GroupName
-- =============================================================================
INSERT INTO WF_GROUP_MEMBER (
  [GroupId],
  [Username],
  [CreatedDate],
  [CreatedUser],
  [LastModifiedDate],
  [LastModifiedUser],
  [Status]
)
SELECT
  id,
  '@Username',
  dateadd(hour, 8, getdate()),
  'System',
  dateadd(hour, 8, getdate()),
  'System',
  'Active'
FROM WF_GROUP
WHERE contractNo = '@ContractNo'
  AND [Module] = '@Module'
  AND [Group] = '@GroupName'
  AND status = 'Active';

-- =============================================================================
-- 3) Optional test helpers
-- =============================================================================
-- UPDATE aspnetusers SET LockoutEndDateUtc = NULL WHERE email = '@Username';
-- UPDATE SIS_USERS SET disableOTP = 'Y' WHERE username = '@Username';  -- TEST ONLY
