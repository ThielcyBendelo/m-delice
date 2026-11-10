/* Secure SMS phone verification challenges for local and international numbers. */
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
GO

IF COL_LENGTH('dbo.Users', 'PhoneVerifiedAt') IS NULL
    ALTER TABLE dbo.Users ADD PhoneVerifiedAt DATETIME2 NULL;
IF COL_LENGTH('dbo.Users', 'PhoneVerificationSource') IS NULL
    ALTER TABLE dbo.Users ADD PhoneVerificationSource NVARCHAR(30) NULL;
IF COL_LENGTH('dbo.Users', 'PhoneVerificationRequired') IS NULL
    ALTER TABLE dbo.Users ADD PhoneVerificationRequired BIT NOT NULL CONSTRAINT DF_Users_PhoneVerificationRequired DEFAULT 0;
GO

IF OBJECT_ID(N'dbo.PhoneVerificationChallenges', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PhoneVerificationChallenges (
        ChallengeID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        UserID INT NOT NULL,
        PhoneHash BINARY(32) NOT NULL,
        CodeHash BINARY(64) NOT NULL,
        CodeSalt BINARY(16) NOT NULL,
        HashVersion SMALLINT NOT NULL CONSTRAINT DF_PhoneVerificationChallenges_HashVersion DEFAULT 1,
        Purpose NVARCHAR(30) NOT NULL CONSTRAINT DF_PhoneVerificationChallenges_Purpose DEFAULT N'phone_verification',
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_PhoneVerificationChallenges_Status DEFAULT N'pending',
        FailedAttemptCount TINYINT NOT NULL CONSTRAINT DF_PhoneVerificationChallenges_Failures DEFAULT 0,
        MaximumAttempts TINYINT NOT NULL CONSTRAINT DF_PhoneVerificationChallenges_MaxAttempts DEFAULT 5,
        ExpiresAt DATETIME2 NOT NULL,
        ConsumedAt DATETIME2 NULL,
        CancelledAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_PhoneVerificationChallenges_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_PhoneVerificationChallenges_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_PhoneVerificationChallenges_User FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID),
        CONSTRAINT CK_PhoneVerificationChallenges_Status CHECK (Status IN (N'pending', N'consumed', N'expired', N'locked', N'cancelled')),
        CONSTRAINT CK_PhoneVerificationChallenges_Attempts CHECK (MaximumAttempts BETWEEN 3 AND 10 AND FailedAttemptCount BETWEEN 0 AND MaximumAttempts),
        CONSTRAINT CK_PhoneVerificationChallenges_Consumed CHECK ((Status = N'consumed' AND ConsumedAt IS NOT NULL) OR (Status <> N'consumed' AND ConsumedAt IS NULL)),
        CONSTRAINT CK_PhoneVerificationChallenges_Cancelled CHECK ((Status = N'cancelled' AND CancelledAt IS NOT NULL) OR (Status <> N'cancelled' AND CancelledAt IS NULL))
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_PhoneVerificationChallenges_PendingUser' AND object_id = OBJECT_ID(N'dbo.PhoneVerificationChallenges'))
    CREATE UNIQUE INDEX UX_PhoneVerificationChallenges_PendingUser ON dbo.PhoneVerificationChallenges(UserID) WHERE Status = N'pending';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PhoneVerificationChallenges_Expiry' AND object_id = OBJECT_ID(N'dbo.PhoneVerificationChallenges'))
    CREATE INDEX IX_PhoneVerificationChallenges_Expiry ON dbo.PhoneVerificationChallenges(Status, ExpiresAt);
GO
