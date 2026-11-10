/* Secure email verification state and local-account OTP challenges. */
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
GO

IF COL_LENGTH('dbo.Users', 'EmailVerifiedAt') IS NULL
    ALTER TABLE dbo.Users ADD EmailVerifiedAt DATETIME2 NULL;
IF COL_LENGTH('dbo.Users', 'EmailVerificationSource') IS NULL
    ALTER TABLE dbo.Users ADD EmailVerificationSource NVARCHAR(30) NULL;
GO

IF OBJECT_ID(N'dbo.CK_Users_EmailVerification', N'C') IS NULL
    ALTER TABLE dbo.Users ADD CONSTRAINT CK_Users_EmailVerification CHECK (
        (EmailVerifiedAt IS NULL AND EmailVerificationSource IS NULL)
        OR (
            EmailVerifiedAt IS NOT NULL
            AND EmailVerificationSource IN (N'local_otp', N'google_id_token')
        )
    );
GO

IF OBJECT_ID(N'dbo.EmailVerificationChallenges', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EmailVerificationChallenges (
        ChallengeID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        UserID INT NOT NULL,
        EmailHash BINARY(32) NOT NULL,
        CodeHash BINARY(64) NOT NULL,
        CodeSalt BINARY(16) NOT NULL,
        HashVersion SMALLINT NOT NULL CONSTRAINT DF_EmailVerificationChallenges_HashVersion DEFAULT 1,
        Purpose NVARCHAR(30) NOT NULL CONSTRAINT DF_EmailVerificationChallenges_Purpose DEFAULT N'email_verification',
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_EmailVerificationChallenges_Status DEFAULT N'pending',
        FailedAttemptCount TINYINT NOT NULL CONSTRAINT DF_EmailVerificationChallenges_Failures DEFAULT 0,
        MaximumAttempts TINYINT NOT NULL CONSTRAINT DF_EmailVerificationChallenges_MaxAttempts DEFAULT 5,
        ExpiresAt DATETIME2 NOT NULL,
        ConsumedAt DATETIME2 NULL,
        CancelledAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_EmailVerificationChallenges_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_EmailVerificationChallenges_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_EmailVerificationChallenges_User FOREIGN KEY (UserID)
            REFERENCES dbo.Users(UserID),
        CONSTRAINT CK_EmailVerificationChallenges_HashVersion CHECK (HashVersion > 0),
        CONSTRAINT CK_EmailVerificationChallenges_Purpose CHECK (Purpose = N'email_verification'),
        CONSTRAINT CK_EmailVerificationChallenges_Status CHECK (Status IN (
            N'pending', N'consumed', N'expired', N'locked', N'cancelled'
        )),
        CONSTRAINT CK_EmailVerificationChallenges_Attempts CHECK (
            MaximumAttempts BETWEEN 3 AND 10
            AND FailedAttemptCount BETWEEN 0 AND MaximumAttempts
        ),
        CONSTRAINT CK_EmailVerificationChallenges_Expiry CHECK (ExpiresAt > CreatedAt),
        CONSTRAINT CK_EmailVerificationChallenges_Consumed CHECK (
            (Status = N'consumed' AND ConsumedAt IS NOT NULL)
            OR (Status <> N'consumed' AND ConsumedAt IS NULL)
        ),
        CONSTRAINT CK_EmailVerificationChallenges_Cancelled CHECK (
            (Status = N'cancelled' AND CancelledAt IS NOT NULL)
            OR (Status <> N'cancelled' AND CancelledAt IS NULL)
        )
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_EmailVerificationChallenges_PendingUser' AND object_id = OBJECT_ID(N'dbo.EmailVerificationChallenges'))
    CREATE UNIQUE INDEX UX_EmailVerificationChallenges_PendingUser
        ON dbo.EmailVerificationChallenges(UserID)
        WHERE Status = N'pending';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_EmailVerificationChallenges_Expiry' AND object_id = OBJECT_ID(N'dbo.EmailVerificationChallenges'))
    CREATE INDEX IX_EmailVerificationChallenges_Expiry
        ON dbo.EmailVerificationChallenges(Status, ExpiresAt);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_EmailVerificationChallenges_EmailHash' AND object_id = OBJECT_ID(N'dbo.EmailVerificationChallenges'))
    CREATE INDEX IX_EmailVerificationChallenges_EmailHash
        ON dbo.EmailVerificationChallenges(EmailHash, CreatedAt DESC);
GO