-- SiteDiary full-WF skeleton (from ND/2024/08 / J5250 SiteDiary user-roles patch).
-- Replace @ContractNo everywhere. Requires active WF_Team for SiteDiary + @ContractNo.
-- Required GroupName slots for CSV members: WS, AIOW, SIOW, Site Team, Site Agent, CRE
-- FormType for SIS_USER_ROLES: SD
-- After this block, append WF_GROUP_MEMBER + SIS_USER_ROLES from the filled SiteDiary.csv
--   using /inspecto-sql grant-sis-user-role + add-wf-group-member patterns.

-- 1. Inactive all existing records for SiteDiary
UPDATE WF_GROUP_MEMBER SET [status] = 'Inactive' WHERE [status] = 'Active' AND groupId IN (SELECT ID FROM WF_GROUP WHERE [contractNo] = '@ContractNo' AND module = 'SiteDiary' AND status = 'Active');

UPDATE WF_GROUP SET [status] = 'Inactive' WHERE [contractNo] = '@ContractNo' AND module = 'SiteDiary' AND status = 'Active';

UPDATE WF_WORKFLOW_ROLE_MAP SET [status] = 'Inactive' WHERE [contractNo] = '@ContractNo' AND module = 'SiteDiary' AND status = 'Active';

UPDATE WF_WORKFLOW SET [status] = 'Inactive' WHERE [contractNo] = '@ContractNo' AND module = 'SiteDiary' AND status = 'Active';


-- 2. Insert into WF_WORKFLOW
Declare @teamId INT = (select id from WF_Team where module = 'SiteDiary' and ContractNo = '@ContractNo' and status = 'Active');


INSERT INTO WF_WORKFLOW ([Module], [ContractNo], [Step], [StatusId], [IsTempSave], [TeamId], [Description], [RejectWorkflowId], [IsEnd], [ProcessWithAll], [CreatedDate], [CreatedUser], [LastModifiedDate], [LastModifiedUser], [Status], [GenPdf], [SignatureKey], [NextAction], [ActionLogKey], [RejectToEnd], [AssignPrevStatusId], [UnanimousAppove], [ApprovalMode]) VALUES
('SiteDiary', '@ContractNo', 0, 1, 'Y', @teamId, 'Save Draft by WS'       , NULL, 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', 'Y' , NULL               , 'Pending for WS to submit Site Diary', NULL, NULL, NULL, NULL, NULL);


Declare @step0Status1WorkflowId INT = (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 0 AND statusId = 1);

INSERT INTO WF_WORKFLOW ([Module], [ContractNo], [Step], [StatusId], [IsTempSave], [TeamId], [Description], [RejectWorkflowId], [IsEnd], [ProcessWithAll], [CreatedDate], [CreatedUser], [LastModifiedDate], [LastModifiedUser], [Status], [GenPdf], [SignatureKey], [NextAction], [ActionLogKey], [RejectToEnd], [AssignPrevStatusId], [UnanimousAppove], [ApprovalMode]) VALUES
('SiteDiary', '@ContractNo', 1, 2, 'N', @teamId, 'Submit Site Diary by WS', @step0Status1WorkflowId, 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', 'Y' , NULL               , 'Pending for AIOW to review'         , 'SubmittedBy', NULL, NULL, NULL, NULL),
('SiteDiary', '@ContractNo', 1, 3, 'Y', @teamId, 'Reviewing by AIOW'      , @step0Status1WorkflowId, 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', NULL, NULL               , 'Pending for AIOW to review'         , NULL, NULL, NULL, NULL, NULL);


Declare @step1Status2WorkflowId INT = (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 1 AND statusId = 2);

INSERT INTO WF_WORKFLOW ([Module], [ContractNo], [Step], [StatusId], [IsTempSave], [TeamId], [Description], [RejectWorkflowId], [IsEnd], [ProcessWithAll], [CreatedDate], [CreatedUser], [LastModifiedDate], [LastModifiedUser], [Status], [GenPdf], [SignatureKey], [NextAction], [ActionLogKey], [RejectToEnd], [AssignPrevStatusId], [UnanimousAppove], [ApprovalMode]) VALUES
('SiteDiary', '@ContractNo', 2, 4, 'N', @teamId, 'Reviewed by AIOW'       , @step1Status2WorkflowId, 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', 'Y' , NULL               , 'Pending for SIOW to review'         , NULL, NULL, NULL, NULL, NULL),
('SiteDiary', '@ContractNo', 2, 3, 'Y', @teamId, 'Reviewing by SIOW'      , @step1Status2WorkflowId, 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', NULL, NULL               , 'Pending for SIOW to review'         , NULL, NULL, NULL, NULL, NULL);


Declare @step2Status4WorkflowId INT = (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 2 AND statusId = 4);

INSERT INTO WF_WORKFLOW ([Module], [ContractNo], [Step], [StatusId], [IsTempSave], [TeamId], [Description], [RejectWorkflowId], [IsEnd], [ProcessWithAll], [CreatedDate], [CreatedUser], [LastModifiedDate], [LastModifiedUser], [Status], [GenPdf], [SignatureKey], [NextAction], [ActionLogKey], [RejectToEnd], [AssignPrevStatusId], [UnanimousAppove], [ApprovalMode]) VALUES
('SiteDiary', '@ContractNo', 3, 4, 'N', @teamId, 'Reviewed by SIOW'       , @step2Status4WorkflowId, 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', 'Y' , 'SD_Step2_Reviewed', 'Pending for Site Team to review'    , 'ReviewedBy_Supervisor', NULL, NULL, NULL, NULL),
('SiteDiary', '@ContractNo', 3, 3, 'Y', @teamId, 'Reviewing by Site Team' , @step2Status4WorkflowId, 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', NULL, NULL               , 'Pending for Site Team to review'    , NULL, NULL, NULL, NULL, NULL);


Declare @step3Status4WorkflowId INT = (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 3 AND statusId = 4);

INSERT INTO WF_WORKFLOW ([Module], [ContractNo], [Step], [StatusId], [IsTempSave], [TeamId], [Description], [RejectWorkflowId], [IsEnd], [ProcessWithAll], [CreatedDate], [CreatedUser], [LastModifiedDate], [LastModifiedUser], [Status], [GenPdf], [SignatureKey], [NextAction], [ActionLogKey], [RejectToEnd], [AssignPrevStatusId], [UnanimousAppove], [ApprovalMode]) VALUES
('SiteDiary', '@ContractNo', 4, 4, 'N', @teamId, 'Reviewed by Site Team'  , @step3Status4WorkflowId, 'N', 'Y', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', 'Y' , NULL               , 'Pending for Site Agent to review'   , NULL, NULL, NULL, NULL, NULL),
('SiteDiary', '@ContractNo', 4, 3, 'Y', @teamId, 'Reviewing by Site Agent', @step3Status4WorkflowId, 'N', 'Y', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', NULL, NULL               , 'Pending for Site Agent to review'   , NULL, NULL, NULL, NULL, NULL);


Declare @step4Status4WorkflowId INT = (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 4 AND statusId = 4);

INSERT INTO WF_WORKFLOW ([Module], [ContractNo], [Step], [StatusId], [IsTempSave], [TeamId], [Description], [RejectWorkflowId], [IsEnd], [ProcessWithAll], [CreatedDate], [CreatedUser], [LastModifiedDate], [LastModifiedUser], [Status], [GenPdf], [SignatureKey], [NextAction], [ActionLogKey], [RejectToEnd], [AssignPrevStatusId], [UnanimousAppove], [ApprovalMode]) VALUES
('SiteDiary', '@ContractNo', 5, 4, 'N', @teamId, 'Reviewed by Site Agent' , @step4Status4WorkflowId, 'N', 'Y', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', 'Y' , 'SD_Step3_Reviewed', 'Pending for CRE to endorse'         , 'ReviewedBy_Contractor', NULL, NULL, NULL, NULL),
('SiteDiary', '@ContractNo', 5, 5, 'Y', @teamId, 'Endorsing by CRE'       , @step4Status4WorkflowId, 'N', 'Y', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', NULL, NULL               , 'Pending for CRE to endorse'         , NULL, NULL, NULL, NULL, NULL);


INSERT INTO WF_WORKFLOW ([Module], [ContractNo], [Step], [StatusId], [IsTempSave], [TeamId], [Description], [RejectWorkflowId], [IsEnd], [ProcessWithAll], [CreatedDate], [CreatedUser], [LastModifiedDate], [LastModifiedUser], [Status], [GenPdf], [SignatureKey], [NextAction], [ActionLogKey], [RejectToEnd], [AssignPrevStatusId], [UnanimousAppove], [ApprovalMode]) VALUES
('SiteDiary', '@ContractNo', 6, 6, 'N', @teamId, 'Endorsed by CRE'        , NULL, 'Y', 'Y', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', 'Y' , NULL               , ''                                   , 'EndorsedBy', NULL, NULL, NULL, NULL);



-- 3. INSERT INTO WF_Workflow_Role_Map
INSERT INTO [dbo].[WF_Workflow_Role_Map] ([Module],[ContractNo],[WorkflowId],[Role],[AllowSave],[AllowSubmit],[AllowApprove],[AllowReject],[AllowRecall],[AllowWithdraw],[CreatedDate],[CreatedUser],[LastModifiedDate],[LastModifiedUser],[Status])
VALUES
('SiteDiary', '@ContractNo', (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 0 AND statusId = 1), 'Issuer'  , 'Y', 'Y', 'N', 'N', 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active'),
('SiteDiary', '@ContractNo', (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 1 AND statusId = 2), 'Issuer'  , 'N', 'N', 'N', 'N', 'Y', 'Y', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active'),
('SiteDiary', '@ContractNo', (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 1 AND statusId = 2), 'Reviewer', 'Y', 'N', 'Y', 'Y', 'N', 'Y', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active'),
('SiteDiary', '@ContractNo', (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 1 AND statusId = 3), 'Reviewer', 'Y', 'N', 'Y', 'Y', 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active'),
('SiteDiary', '@ContractNo', (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 2 AND statusId = 4), 'Reviewer', 'Y', 'N', 'Y', 'Y', 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active'),
('SiteDiary', '@ContractNo', (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 2 AND statusId = 3), 'Reviewer', 'Y', 'N', 'Y', 'Y', 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active'),
('SiteDiary', '@ContractNo', (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 3 AND statusId = 4), 'Reviewer', 'Y', 'N', 'Y', 'Y', 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active'),
('SiteDiary', '@ContractNo', (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 3 AND statusId = 3), 'Reviewer', 'Y', 'N', 'Y', 'Y', 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active'),
('SiteDiary', '@ContractNo', (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 4 AND statusId = 4), 'Reviewer', 'Y', 'N', 'Y', 'Y', 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active'),
('SiteDiary', '@ContractNo', (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 4 AND statusId = 3), 'Reviewer', 'Y', 'N', 'Y', 'Y', 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active'),
('SiteDiary', '@ContractNo', (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 5 AND statusId = 4), 'Reviewer', 'Y', 'N', 'Y', 'Y', 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active'),
('SiteDiary', '@ContractNo', (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 5 AND statusId = 5), 'Reviewer', 'Y', 'N', 'Y', 'Y', 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active'),
('SiteDiary', '@ContractNo', (SELECT id FROM WF_WORKFLOW WHERE status = 'active' and Module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 6 AND statusId = 6), 'Reviewer', 'N', 'N', 'N', 'N', 'N', 'N', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active');



-- 4. INSERT INTO WF_GROUP
INSERT INTO [dbo].[WF_Group] ([Module],[ContractNo],[TeamId],[Step],[Group],[CreatedDate],[CreatedUser],[LastModifiedDate],[LastModifiedUser],[Status],[AllowSave],[AllowSubmit],[AllowApprove],[AllowReject],[AllowRecall],[AllowWithdraw],[WFId]) VALUES
('SiteDiary' ,'@ContractNo', (select id from wf_team where status = 'active' and module = 'SiteDiary' and contractNo = '@ContractNo'), 0, 'WS'        , dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', 'Y', 'Y', 'N', 'N', 'N', 'N', (SELECT id FROM WF_WORKFLOW WHERE status = 'Active' and module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 0 AND statusId = 1)),
('SiteDiary' ,'@ContractNo', (select id from wf_team where status = 'active' and module = 'SiteDiary' and contractNo = '@ContractNo'), 1, 'AIOW'      , dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', 'Y', 'N', 'Y', 'Y', 'Y', 'Y', (SELECT id FROM WF_WORKFLOW WHERE status = 'Active' and module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 1 AND statusId = 2)),
('SiteDiary' ,'@ContractNo', (select id from wf_team where status = 'active' and module = 'SiteDiary' and contractNo = '@ContractNo'), 1, 'AIOW'      , dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', 'Y', 'N', 'Y', 'Y', 'Y', 'Y', (SELECT id FROM WF_WORKFLOW WHERE status = 'Active' and module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 1 AND statusId = 3)),
('SiteDiary' ,'@ContractNo', (select id from wf_team where status = 'active' and module = 'SiteDiary' and contractNo = '@ContractNo'), 2, 'SIOW'      , dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', 'Y', 'N', 'Y', 'Y', 'Y', 'Y', (SELECT id FROM WF_WORKFLOW WHERE status = 'Active' and module = 'SiteDiary' AND contractNo = '@ContractNo' AND step = 2 AND statusId = 3)),
('SiteDiary' ,'@ContractNo', (select id from wf_team where status = 'active' and module = 'SiteDiary' and contractNo = '@ContractNo'), 2, 'SIOW'      , dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('SiteDiary' ,'@ContractNo', (select id from wf_team where status = 'active' and module = 'SiteDiary' and contractNo = '@ContractNo'), 3, 'Site Team' , dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('SiteDiary' ,'@ContractNo', (select id from wf_team where status = 'active' and module = 'SiteDiary' and contractNo = '@ContractNo'), 4, 'Site Agent', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('SiteDiary' ,'@ContractNo', (select id from wf_team where status = 'active' and module = 'SiteDiary' and contractNo = '@ContractNo'), 5, 'CRE'       , dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active', NULL, NULL, NULL, NULL, NULL, NULL, NULL);


-- 5. Members + SIS_USER_ROLES: append from CSV (see GENERATE in SKILL.md)
-- Example member line:
-- SELECT id, '@Email', dateadd(hour, 8, getdate()), 'System', dateadd(hour, 8, getdate()), 'System', 'Active'
--   FROM WF_Group WHERE status = 'active' AND [group] = '@GroupName' AND contractNo = '@ContractNo' AND module = 'SiteDiary'
