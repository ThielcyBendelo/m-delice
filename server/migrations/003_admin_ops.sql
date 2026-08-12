/*
  Admin ops: indexes + ensure GoogleSub (not GoogleId) + verification helpers
*/
IF COL_LENGTH('dbo.Users', 'GoogleSub') IS NULL
  ALTER TABLE dbo.Users ADD GoogleSub NVARCHAR(128) NULL;
IF COL_LENGTH('dbo.Users', 'AuthProvider') IS NULL
  ALTER TABLE dbo.Users ADD AuthProvider NVARCHAR(40) NOT NULL CONSTRAINT DF_Users_AuthProvider3 DEFAULT N'local';
IF COL_LENGTH('dbo.Users', 'AvatarUrl') IS NULL
  ALTER TABLE dbo.Users ADD AvatarUrl NVARCHAR(500) NULL;
GO

/* If legacy GoogleId exists, copy into GoogleSub */
IF COL_LENGTH('dbo.Users', 'GoogleId') IS NOT NULL AND COL_LENGTH('dbo.Users', 'GoogleSub') IS NOT NULL
BEGIN
  EXEC(N'UPDATE dbo.Users SET GoogleSub = GoogleId WHERE GoogleSub IS NULL AND GoogleId IS NOT NULL');
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Users_GoogleSub' AND object_id = OBJECT_ID(N'dbo.Users'))
BEGIN
  CREATE UNIQUE INDEX UX_Users_GoogleSub ON dbo.Users(GoogleSub) WHERE GoogleSub IS NOT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Beneficiaries_Phone' AND object_id = OBJECT_ID(N'dbo.Beneficiaries'))
  CREATE INDEX IX_Beneficiaries_Phone ON dbo.Beneficiaries(WhatsAppPhone);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Beneficiaries_NationalID' AND object_id = OBJECT_ID(N'dbo.Beneficiaries'))
  CREATE INDEX IX_Beneficiaries_NationalID ON dbo.Beneficiaries(NationalID);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Beneficiaries_City' AND object_id = OBJECT_ID(N'dbo.Beneficiaries'))
  CREATE INDEX IX_Beneficiaries_City ON dbo.Beneficiaries(City);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Claims_Status' AND object_id = OBJECT_ID(N'dbo.Claims'))
  CREATE INDEX IX_Claims_Status ON dbo.Claims(ClaimStatus);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Policies_EndDate' AND object_id = OBJECT_ID(N'dbo.InsurancePolicies'))
  CREATE INDEX IX_Policies_EndDate ON dbo.InsurancePolicies(EndDate);
GO

IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.AuditLogs (
    AuditID BIGINT IDENTITY(1,1) PRIMARY KEY,
    ActorUserID INT NULL,
    Action NVARCHAR(80) NOT NULL,
    EntityType NVARCHAR(60) NULL,
    EntityId NVARCHAR(80) NULL,
    DetailsJson NVARCHAR(MAX) NULL,
    IpAddress NVARCHAR(64) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_AuditLogs_CreatedAt DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_AuditLogs_CreatedAt ON dbo.AuditLogs(CreatedAt DESC);
END
GO
