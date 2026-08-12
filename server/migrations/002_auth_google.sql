/*
  Auth Google + colonnes provider
*/
IF COL_LENGTH('dbo.Users', 'AuthProvider') IS NULL
  ALTER TABLE dbo.Users ADD AuthProvider NVARCHAR(40) NOT NULL CONSTRAINT DF_Users_AuthProvider DEFAULT N'local';
IF COL_LENGTH('dbo.Users', 'GoogleSub') IS NULL
  ALTER TABLE dbo.Users ADD GoogleSub NVARCHAR(128) NULL;
IF COL_LENGTH('dbo.Users', 'AvatarUrl') IS NULL
  ALTER TABLE dbo.Users ADD AvatarUrl NVARCHAR(500) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Users_GoogleSub' AND object_id = OBJECT_ID(N'dbo.Users'))
BEGIN
  CREATE UNIQUE INDEX UX_Users_GoogleSub ON dbo.Users(GoogleSub) WHERE GoogleSub IS NOT NULL;
END
GO
