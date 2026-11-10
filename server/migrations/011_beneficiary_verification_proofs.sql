/* Hashed beneficiary PINs and short-lived, single-use OTP challenges. */
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
GO

IF OBJECT_ID(N'dbo.BeneficiaryVerificationPins', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BeneficiaryVerificationPins (
        PinID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        BeneficiaryID INT NOT NULL,
        PinHash BINARY(64) NOT NULL,
        PinSalt BINARY(16) NOT NULL,
        HashVersion SMALLINT NOT NULL CONSTRAINT DF_BeneficiaryVerificationPins_HashVersion DEFAULT 1,
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_BeneficiaryVerificationPins_Status DEFAULT N'active',
        IsCurrent BIT NOT NULL CONSTRAINT DF_BeneficiaryVerificationPins_IsCurrent DEFAULT 1,
        FailedAttemptCount TINYINT NOT NULL CONSTRAINT DF_BeneficiaryVerificationPins_Failures DEFAULT 0,
        MaximumAttempts TINYINT NOT NULL CONSTRAINT DF_BeneficiaryVerificationPins_MaxAttempts DEFAULT 5,
        ExpiresAt DATETIME2 NOT NULL,
        LockedUntil DATETIME2 NULL,
        LastUsedAt DATETIME2 NULL,
        RevokedAt DATETIME2 NULL,
        CreatedByUserID INT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_BeneficiaryVerificationPins_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_BeneficiaryVerificationPins_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_BeneficiaryVerificationPins_Beneficiary FOREIGN KEY (BeneficiaryID)
            REFERENCES dbo.Beneficiaries(BeneficiaryID),
        CONSTRAINT FK_BeneficiaryVerificationPins_Creator FOREIGN KEY (CreatedByUserID)
            REFERENCES dbo.Users(UserID),
        CONSTRAINT CK_BeneficiaryVerificationPins_HashVersion CHECK (HashVersion > 0),
        CONSTRAINT CK_BeneficiaryVerificationPins_Status CHECK (Status IN (
            N'active', N'locked', N'revoked', N'expired'
        )),
        CONSTRAINT CK_BeneficiaryVerificationPins_Current CHECK (
            (IsCurrent = 1 AND Status IN (N'active', N'locked'))
            OR (IsCurrent = 0 AND Status IN (N'revoked', N'expired'))
        ),
        CONSTRAINT CK_BeneficiaryVerificationPins_Attempts CHECK (
            MaximumAttempts BETWEEN 3 AND 10
            AND FailedAttemptCount BETWEEN 0 AND MaximumAttempts
        ),
        CONSTRAINT CK_BeneficiaryVerificationPins_Expiry CHECK (ExpiresAt > CreatedAt),
        CONSTRAINT CK_BeneficiaryVerificationPins_Revocation CHECK (
            (Status = N'revoked' AND RevokedAt IS NOT NULL)
            OR (Status <> N'revoked' AND RevokedAt IS NULL)
        )
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_BeneficiaryVerificationPins_Active' AND object_id = OBJECT_ID(N'dbo.BeneficiaryVerificationPins'))
    CREATE UNIQUE INDEX UX_BeneficiaryVerificationPins_Active
        ON dbo.BeneficiaryVerificationPins(BeneficiaryID)
        WHERE IsCurrent = 1;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_BeneficiaryVerificationPins_Expiry' AND object_id = OBJECT_ID(N'dbo.BeneficiaryVerificationPins'))
    CREATE INDEX IX_BeneficiaryVerificationPins_Expiry
        ON dbo.BeneficiaryVerificationPins(Status, ExpiresAt);
GO

IF OBJECT_ID(N'dbo.BeneficiaryOtpChallenges', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BeneficiaryOtpChallenges (
        ChallengeID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        CredentialID UNIQUEIDENTIFIER NOT NULL,
        BeneficiaryID INT NOT NULL,
        OrganizationID INT NOT NULL,
        ActorUserID INT NOT NULL,
        Purpose NVARCHAR(30) NOT NULL CONSTRAINT DF_BeneficiaryOtpChallenges_Purpose DEFAULT N'verification_step_up',
        DeliveryChannel NVARCHAR(20) NOT NULL,
        DestinationHash BINARY(32) NOT NULL,
        CodeHash BINARY(64) NOT NULL,
        CodeSalt BINARY(16) NOT NULL,
        HashVersion SMALLINT NOT NULL CONSTRAINT DF_BeneficiaryOtpChallenges_HashVersion DEFAULT 1,
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_BeneficiaryOtpChallenges_Status DEFAULT N'pending',
        FailedAttemptCount TINYINT NOT NULL CONSTRAINT DF_BeneficiaryOtpChallenges_Failures DEFAULT 0,
        MaximumAttempts TINYINT NOT NULL CONSTRAINT DF_BeneficiaryOtpChallenges_MaxAttempts DEFAULT 5,
        ExpiresAt DATETIME2 NOT NULL,
        VerifiedAt DATETIME2 NULL,
        ConsumedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_BeneficiaryOtpChallenges_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_BeneficiaryOtpChallenges_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_BeneficiaryOtpChallenges_Credential FOREIGN KEY (CredentialID)
            REFERENCES dbo.BeneficiaryCredentials(CredentialID),
        CONSTRAINT FK_BeneficiaryOtpChallenges_Beneficiary FOREIGN KEY (BeneficiaryID)
            REFERENCES dbo.Beneficiaries(BeneficiaryID),
        CONSTRAINT FK_BeneficiaryOtpChallenges_Organization FOREIGN KEY (OrganizationID)
            REFERENCES dbo.PartnerOrganizations(OrganizationID),
        CONSTRAINT FK_BeneficiaryOtpChallenges_Actor FOREIGN KEY (ActorUserID)
            REFERENCES dbo.Users(UserID),
        CONSTRAINT CK_BeneficiaryOtpChallenges_Purpose CHECK (Purpose = N'verification_step_up'),
        CONSTRAINT CK_BeneficiaryOtpChallenges_Channel CHECK (DeliveryChannel IN (
            N'sms', N'whatsapp', N'email'
        )),
        CONSTRAINT CK_BeneficiaryOtpChallenges_HashVersion CHECK (HashVersion > 0),
        CONSTRAINT CK_BeneficiaryOtpChallenges_Status CHECK (Status IN (
            N'pending', N'verified', N'consumed', N'expired', N'locked', N'cancelled'
        )),
        CONSTRAINT CK_BeneficiaryOtpChallenges_Attempts CHECK (
            MaximumAttempts BETWEEN 3 AND 10
            AND FailedAttemptCount BETWEEN 0 AND MaximumAttempts
        ),
        CONSTRAINT CK_BeneficiaryOtpChallenges_Expiry CHECK (ExpiresAt > CreatedAt),
        CONSTRAINT CK_BeneficiaryOtpChallenges_Verified CHECK (
            (Status IN (N'verified', N'consumed') AND VerifiedAt IS NOT NULL)
            OR (Status NOT IN (N'verified', N'consumed') AND VerifiedAt IS NULL)
        ),
        CONSTRAINT CK_BeneficiaryOtpChallenges_Consumed CHECK (
            (Status = N'consumed' AND ConsumedAt IS NOT NULL)
            OR (Status <> N'consumed' AND ConsumedAt IS NULL)
        )
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_BeneficiaryOtpChallenges_Pending' AND object_id = OBJECT_ID(N'dbo.BeneficiaryOtpChallenges'))
    CREATE UNIQUE INDEX UX_BeneficiaryOtpChallenges_Pending
        ON dbo.BeneficiaryOtpChallenges(CredentialID, OrganizationID, Purpose)
        WHERE Status = N'pending';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_BeneficiaryOtpChallenges_Expiry' AND object_id = OBJECT_ID(N'dbo.BeneficiaryOtpChallenges'))
    CREATE INDEX IX_BeneficiaryOtpChallenges_Expiry
        ON dbo.BeneficiaryOtpChallenges(Status, ExpiresAt);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_BeneficiaryOtpChallenges_ActorDate' AND object_id = OBJECT_ID(N'dbo.BeneficiaryOtpChallenges'))
    CREATE INDEX IX_BeneficiaryOtpChallenges_ActorDate
        ON dbo.BeneficiaryOtpChallenges(ActorUserID, CreatedAt DESC);
GO