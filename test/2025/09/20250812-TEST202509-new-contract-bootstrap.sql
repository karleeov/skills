-- NEW CONTRACT bootstrap for TEST/2025/09
-- Review before running. Do not auto-execute on production.
-- A) Contract header (from worked examples — not an inspecto-sql recipe; confirm column layout on your DB)
-- B) User/role bootstrap (inspecto-sql new-contract-users pattern) — replace example emails

BEGIN TRAN;

-- =============================================================================
-- A) SIS_CONTRACT (draft — align columns with your environment before commit)
-- =============================================================================
/*
INSERT INTO SIS_CONTRACT VALUES
('TEST/2025/09'
,'Test Project 2025-09'
,'GAMMON'
,''
,''
,dateadd(hour, 8, getdate()),'System',dateadd(hour, 8, getdate()),'System','Active'
,'TEST202509'
,'FDN'
,'Y'
,NULL,NULL,NULL,NULL
,'test202509'
,NULL,NULL,NULL,NULL,NULL
,'Y'
,NULL
,'Endorsed'
,NULL,NULL
,'Test Project 2025-09'
,NULL,'N',NULL,NULL,NULL,NULL,'Y',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
*/

-- Prefer: copy an existing contract row in SSMS and edit ContractNo / names, or run project-specific RISC/SD setup from inspecto-5202-sql.

-- =============================================================================
-- B) SIS_USER_ROLES — replace @Username / @Role / @FormType rows
-- =============================================================================
INSERT INTO SIS_USER_ROLES (
  [username], [role], [contractNo], [createdDate], [createdUser],
  [lastModifiedDate], [lastModifiedUser], [status], [formType]
) VALUES
('issuer@example.com',  'Issuer',   'TEST/2025/09', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', 'SD'),
('reviewer@example.com','Reviewer', 'TEST/2025/09', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', 'SD');
-- Add more formTypes: Safety, Cleansing, RISC, LR, …

-- =============================================================================
-- C) WF_GROUP_MEMBER — only after WF_GROUP exists for this contract+module
-- =============================================================================
-- INSERT INTO WF_GROUP_MEMBER (...)
-- SELECT id, 'reviewer@example.com', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active'
-- FROM WF_GROUP
-- WHERE contractNo = 'TEST/2025/09' AND [Module] = 'SiteDiary' AND [Group] = 'CRE' AND status = 'Active';

-- ROLLBACK TRAN;  -- use until reviewed
-- COMMIT TRAN;

