/* Short-lived, single-use grants for ESNAS staff step-up authentication. */
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
GO

IF OBJECT_ID(N'dbo.StaffReauthenticationGrants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.StaffReauthenticationGrants (
        GrantID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        UserID INT NOT NULL,
        TokenHash BINARY(32) NOT NULL,
        SessionBindingHash BINARY(32) NOT NULL,
        AuthenticationMethod NVARCHAR(30) NOT NULL,
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_StaffReauthenticationGrants_Status DEFAULT N'active',
        ExpiresAt DATETIME2 NOT NULL,
        ConsumedAt DATETIME2 NULL,
        RevokedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_StaffReauthenticationGrants_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_StaffReauthenticationGrants_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_StaffReauthenticationGrants_User FOREIGN KEY (UserID)
            REFERENCES dbo.Users(UserID),
        CONSTRAINT CK_StaffReauthenticationGrants_Method CHECK (AuthenticationMethod IN (
            N'local_password', N'google_id_token'
        )),
        CONSTRAINT CK_StaffReauthenticationGrants_Status CHECK (Status IN (
            N'active', N'consumed', N'revoked', N'expired'
        )),
        CONSTRAINT CK_StaffReauthenticationGrants_Expiry CHECK (ExpiresAt > CreatedAt),
        CONSTRAINT CK_StaffReauthenticationGrants_Consumed CHECK (
            (Status = N'consumed' AND ConsumedAt IS NOT NULL)
            OR (Status <> N'consumed' AND ConsumedAt IS NULL)
        ),
        CONSTRAINT CK_StaffReauthenticationGrants_Revoked CHECK (
            (Status = N'revoked' AND RevokedAt IS NOT NULL)
            OR (Status <> N'revoked' AND RevokedAt IS NULL)
        )
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_StaffReauthenticationGrants_Token' AND object_id = OBJECT_ID(N'dbo.StaffReauthenticationGrants'))
    CREATE UNIQUE INDEX UX_StaffReauthenticationGrants_Token
        ON dbo.StaffReauthenticationGrants(TokenHash);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_StaffReauthenticationGrants_ActiveUser' AND object_id = OBJECT_ID(N'dbo.StaffReauthenticationGrants'))
    CREATE UNIQUE INDEX UX_StaffReauthenticationGrants_ActiveUser
        ON dbo.StaffReauthenticationGrants(UserID)
        WHERE Status = N'active';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_StaffReauthenticationGrants_Expiry' AND object_id = OBJECT_ID(N'dbo.StaffReauthenticationGrants'))
    CREATE INDEX IX_StaffReauthenticationGrants_Expiry
        ON dbo.StaffReauthenticationGrants(Status, ExpiresAt);
GO