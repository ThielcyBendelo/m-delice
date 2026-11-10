/* Billing profiles: additive, user-owned billing data only. Never store card numbers or CVC. */
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.BillingProfiles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BillingProfiles (
        BillingProfileID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        Email NVARCHAR(255) NOT NULL,
        Phone NVARCHAR(40) NOT NULL,
        FullName NVARCHAR(160) NOT NULL,
        AddressLine NVARCHAR(300) NOT NULL,
        Region NVARCHAR(120) NULL,
        City NVARCHAR(120) NOT NULL,
        PostalCode NVARCHAR(24) NULL,
        Country NVARCHAR(80) NOT NULL CONSTRAINT DF_BillingProfiles_Country DEFAULT N'RDC',
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_BillingProfiles_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_BillingProfiles_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_BillingProfiles_User FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID),
        CONSTRAINT CK_BillingProfiles_FullName CHECK (LEN(LTRIM(RTRIM(FullName))) >= 3),
        CONSTRAINT CK_BillingProfiles_Address CHECK (LEN(LTRIM(RTRIM(AddressLine))) >= 4),
        CONSTRAINT CK_BillingProfiles_City CHECK (LEN(LTRIM(RTRIM(City))) >= 2)
    );
END
GO

IF OBJECT_ID(N'dbo.BillingEmailVerificationChallenges', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BillingEmailVerificationChallenges (
        ChallengeID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        UserID INT NOT NULL,
        Email NVARCHAR(255) NOT NULL,
        CodeHash CHAR(64) NOT NULL,
        ExpiresAt DATETIME2 NOT NULL,
        FailedAttemptCount TINYINT NOT NULL CONSTRAINT DF_BillingEmailVerification_Failures DEFAULT 0,
        MaximumAttempts TINYINT NOT NULL CONSTRAINT DF_BillingEmailVerification_MaxAttempts DEFAULT 5,
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_BillingEmailVerification_Status DEFAULT N'pending',
        VerifiedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_BillingEmailVerification_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_BillingEmailVerification_User FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID)
    );
    CREATE INDEX IX_BillingEmailVerification_User ON dbo.BillingEmailVerificationChallenges(UserID, CreatedAt DESC);
END
GO

IF COL_LENGTH('dbo.BillingProfiles', 'Email') IS NULL ALTER TABLE dbo.BillingProfiles ADD Email NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.BillingProfiles', 'Phone') IS NULL ALTER TABLE dbo.BillingProfiles ADD Phone NVARCHAR(40) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_BillingProfiles_User' AND object_id = OBJECT_ID(N'dbo.BillingProfiles'))
    CREATE UNIQUE INDEX UX_BillingProfiles_User ON dbo.BillingProfiles(UserID);
GO

IF COL_LENGTH('dbo.Payments', 'BillingProfileID') IS NULL
    ALTER TABLE dbo.Payments ADD BillingProfileID INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Payments_BillingProfile')
    ALTER TABLE dbo.Payments ADD CONSTRAINT FK_Payments_BillingProfile
      FOREIGN KEY (BillingProfileID) REFERENCES dbo.BillingProfiles(BillingProfileID);
GO