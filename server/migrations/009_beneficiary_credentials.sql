/* Secure, revocable beneficiary credentials used by QR codes. */
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
GO

IF OBJECT_ID(N'dbo.BeneficiaryCredentials', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BeneficiaryCredentials (
        CredentialID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        PolicyID INT NOT NULL,
        BeneficiaryID INT NOT NULL,
        TokenHash BINARY(32) NOT NULL,
        TokenVersion SMALLINT NOT NULL CONSTRAINT DF_BeneficiaryCredentials_Version DEFAULT 1,
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_BeneficiaryCredentials_Status DEFAULT N'active',
        ExpiresAt DATETIME2 NOT NULL,
        LastVerifiedAt DATETIME2 NULL,
        RevokedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_BeneficiaryCredentials_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_BeneficiaryCredentials_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_BeneficiaryCredentials_Policy
            FOREIGN KEY (PolicyID) REFERENCES dbo.InsurancePolicies(PolicyID),
        CONSTRAINT FK_BeneficiaryCredentials_Beneficiary
            FOREIGN KEY (BeneficiaryID) REFERENCES dbo.Beneficiaries(BeneficiaryID),
        CONSTRAINT CK_BeneficiaryCredentials_Status
            CHECK (Status IN (N'active', N'revoked', N'expired')),
        CONSTRAINT CK_BeneficiaryCredentials_Version CHECK (TokenVersion > 0)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_BeneficiaryCredentials_TokenHash' AND object_id = OBJECT_ID(N'dbo.BeneficiaryCredentials'))
    CREATE UNIQUE INDEX UX_BeneficiaryCredentials_TokenHash
        ON dbo.BeneficiaryCredentials(TokenHash);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_BeneficiaryCredentials_ActivePolicy' AND object_id = OBJECT_ID(N'dbo.BeneficiaryCredentials'))
    CREATE UNIQUE INDEX UX_BeneficiaryCredentials_ActivePolicy
        ON dbo.BeneficiaryCredentials(PolicyID)
        WHERE Status = N'active';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_BeneficiaryCredentials_Expiry' AND object_id = OBJECT_ID(N'dbo.BeneficiaryCredentials'))
    CREATE INDEX IX_BeneficiaryCredentials_Expiry
        ON dbo.BeneficiaryCredentials(Status, ExpiresAt);
GO