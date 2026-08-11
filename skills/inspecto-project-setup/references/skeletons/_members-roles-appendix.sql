-- Appendix template: members + roles from a validated per-form CSV.
-- Placeholders filled per row: @ContractNo, @Module, @FormType, @GroupName, @Email, @RoleType

-- WF_GROUP_MEMBER (one union branch per CSV row)
INSERT INTO [dbo].[WF_Group_Member]
([GroupId],[Username],[CreatedDate],[CreatedUser],[LastModifiedDate],[LastModifiedUser],[Status])
      select id, '@Email', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active'
      from [WF_Group]
      where status = 'active' and [group] = '@GroupName' and contractNo = '@ContractNo' and module = '@Module'
-- union select id, '...', ...  -- more rows
;

-- SIS_USER_ROLES (dedupe by Email + RoleType + FormType)
INSERT INTO SIS_USER_ROLES (
  [username], [role], [contractNo], [createdDate], [createdUser],
  [lastModifiedDate], [lastModifiedUser], [status], [formType]
) VALUES
('@Email', '@RoleType', '@ContractNo', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', '@FormType');
-- , ('...', '...', ...)
;
