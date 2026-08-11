-- Grant a form role for one user on one contract.
-- Placeholders: @Username, @Role, @ContractNo, @FormType
-- Roles typically: Issuer | Reviewer

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
) VALUES (
  '@Username',
  '@Role',
  '@ContractNo',
  dateadd(hour, 8, getdate()),
  'System',
  dateadd(hour, 8, getdate()),
  'System',
  'Active',
  '@FormType'
);
