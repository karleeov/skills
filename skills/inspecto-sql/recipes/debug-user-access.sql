-- Read-only access diagnostics for one user.
-- Placeholders: @Username, @ContractNo, @Module
-- If contract/module unknown, drop the AND lines that filter them.

-- Identity / lockout
SELECT Id, Email, UserName, LockoutEndDateUtc, LockoutEnabled, AccessFailedCount
FROM aspnetusers
WHERE Email = '@Username' OR UserName = '@Username';

-- SIS user flags
SELECT username, disableOTP, status
FROM SIS_USERS
WHERE username = '@Username';

-- Form roles
SELECT username, [role], contractNo, formType, status, createdDate, lastModifiedDate
FROM SIS_USER_ROLES
WHERE username = '@Username'
  AND contractNo = '@ContractNo'  -- remove this line to see all contracts
ORDER BY contractNo, formType, [role];

-- WF groups this user is in
SELECT
  g.contractNo,
  g.[Module],
  g.[Group],
  g.status AS groupStatus,
  m.Username,
  m.status AS memberStatus,
  m.CreatedDate
FROM WF_GROUP_MEMBER m
INNER JOIN WF_GROUP g ON g.id = m.GroupId
WHERE m.Username = '@Username'
  AND g.contractNo = '@ContractNo'  -- remove to see all contracts
  AND g.[Module] = '@Module'        -- remove to see all modules
ORDER BY g.contractNo, g.[Module], g.[Group];

-- Active groups on contract/module (names for ADD MEMBER)
SELECT id, contractNo, [Module], [Group], status, TeamId, Step
FROM WF_GROUP
WHERE contractNo = '@ContractNo'
  AND [Module] = '@Module'          -- remove to list all modules on contract
  AND status = 'Active'
ORDER BY [Module], [Group];
