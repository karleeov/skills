-- Add one user to an active WF group (resolves GroupId by contract/module/group name).
-- Placeholders: @Username, @ContractNo, @Module, @GroupName

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
