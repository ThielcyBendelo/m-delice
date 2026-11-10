/*
  Verification authorization model for partners and ESNAS staff.
  No QR token, PIN, OTP or personal-data response is stored in the audit log.
*/
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
GO

/* ---------- Assurance levels ---------- */
IF OBJECT_ID(N'dbo.VerificationAssuranceLevels', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.VerificationAssuranceLevels (
        AssuranceLevel TINYINT NOT NULL PRIMARY KEY,
        AssuranceCode NVARCHAR(40) NOT NULL,
        Description NVARCHAR(300) NOT NULL,
        CONSTRAINT CK_VerificationAssuranceLevels_Level CHECK (AssuranceLevel BETWEEN 1 AND 3)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.VerificationAssuranceLevels WHERE AssuranceLevel = 1)
    INSERT INTO dbo.VerificationAssuranceLevels (AssuranceLevel, AssuranceCode, Description)
    VALUES (1, N'qr', N'Compte approuve et QR valide.');
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationAssuranceLevels WHERE AssuranceLevel = 2)
    INSERT INTO dbo.VerificationAssuranceLevels (AssuranceLevel, AssuranceCode, Description)
    VALUES (2, N'qr_pin_or_otp', N'Compte approuve, QR valide et PIN ou OTP beneficiaire.');
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationAssuranceLevels WHERE AssuranceLevel = 3)
    INSERT INTO dbo.VerificationAssuranceLevels (AssuranceLevel, AssuranceCode, Description)
    VALUES (3, N'staff_reauth', N'Reauthentification forte reservee au personnel ESNAS autorise.');
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_VerificationAssuranceLevels_Code' AND object_id = OBJECT_ID(N'dbo.VerificationAssuranceLevels'))
    CREATE UNIQUE INDEX UX_VerificationAssuranceLevels_Code
        ON dbo.VerificationAssuranceLevels(AssuranceCode);
GO

/* ---------- Permission catalog ---------- */
IF OBJECT_ID(N'dbo.VerificationPermissions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.VerificationPermissions (
        PermissionCode NVARCHAR(80) NOT NULL PRIMARY KEY,
        DisplayName NVARCHAR(160) NOT NULL,
        DataSensitivity NVARCHAR(20) NOT NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_VerificationPermissions_IsActive DEFAULT 1,
        CONSTRAINT CK_VerificationPermissions_Sensitivity
            CHECK (DataSensitivity IN (N'low', N'medium', N'high'))
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.VerificationPermissions WHERE PermissionCode = N'policy.status')
    INSERT INTO dbo.VerificationPermissions VALUES (N'policy.status', N'Statut et validite de la police', N'low', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationPermissions WHERE PermissionCode = N'beneficiary.identity_masked')
    INSERT INTO dbo.VerificationPermissions VALUES (N'beneficiary.identity_masked', N'Identite beneficiaire masquee', N'low', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationPermissions WHERE PermissionCode = N'beneficiary.identity_full')
    INSERT INTO dbo.VerificationPermissions VALUES (N'beneficiary.identity_full', N'Identite beneficiaire complete', N'high', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationPermissions WHERE PermissionCode = N'policy.contract_details')
    INSERT INTO dbo.VerificationPermissions VALUES (N'policy.contract_details', N'Details du contrat', N'medium', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationPermissions WHERE PermissionCode = N'coverage.summary')
    INSERT INTO dbo.VerificationPermissions VALUES (N'coverage.summary', N'Resume des garanties', N'low', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationPermissions WHERE PermissionCode = N'coverage.balance')
    INSERT INTO dbo.VerificationPermissions VALUES (N'coverage.balance', N'Plafond et solde disponibles', N'medium', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationPermissions WHERE PermissionCode = N'service.authorization')
    INSERT INTO dbo.VerificationPermissions VALUES (N'service.authorization', N'Autorisation de prestation', N'high', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationPermissions WHERE PermissionCode = N'vehicle.summary')
    INSERT INTO dbo.VerificationPermissions VALUES (N'vehicle.summary', N'Vehicule et garanties automobiles', N'medium', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationPermissions WHERE PermissionCode = N'education.coverage')
    INSERT INTO dbo.VerificationPermissions VALUES (N'education.coverage', N'Couverture scolaire', N'medium', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationPermissions WHERE PermissionCode = N'travel.coverage')
    INSERT INTO dbo.VerificationPermissions VALUES (N'travel.coverage', N'Couverture et periode de voyage', N'medium', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationPermissions WHERE PermissionCode = N'verification.history')
    INSERT INTO dbo.VerificationPermissions VALUES (N'verification.history', N'Historique des verifications', N'high', 1);
GO

/* ---------- Verification profiles ---------- */
IF OBJECT_ID(N'dbo.VerificationProfiles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.VerificationProfiles (
        VerificationProfileID INT IDENTITY(1,1) PRIMARY KEY,
        ProfileCode NVARCHAR(50) NOT NULL,
        DisplayName NVARCHAR(120) NOT NULL,
        PartnerCategory NVARCHAR(40) NOT NULL,
        IsStaffProfile BIT NOT NULL CONSTRAINT DF_VerificationProfiles_IsStaff DEFAULT 0,
        IsActive BIT NOT NULL CONSTRAINT DF_VerificationProfiles_IsActive DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_VerificationProfiles_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_VerificationProfiles_Category CHECK (PartnerCategory IN (
            N'hospital', N'pharmacy', N'garage', N'school', N'airline', N'esnas_agent'
        ))
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_VerificationProfiles_Code' AND object_id = OBJECT_ID(N'dbo.VerificationProfiles'))
    CREATE UNIQUE INDEX UX_VerificationProfiles_Code ON dbo.VerificationProfiles(ProfileCode);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_VerificationProfiles_Category' AND object_id = OBJECT_ID(N'dbo.VerificationProfiles'))
    CREATE INDEX IX_VerificationProfiles_Category ON dbo.VerificationProfiles(PartnerCategory, IsActive);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.VerificationProfiles WHERE ProfileCode = N'hospital_verifier')
    INSERT INTO dbo.VerificationProfiles (ProfileCode, DisplayName, PartnerCategory) VALUES (N'hospital_verifier', N'Hopital', N'hospital');
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationProfiles WHERE ProfileCode = N'pharmacy_verifier')
    INSERT INTO dbo.VerificationProfiles (ProfileCode, DisplayName, PartnerCategory) VALUES (N'pharmacy_verifier', N'Pharmacie', N'pharmacy');
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationProfiles WHERE ProfileCode = N'garage_verifier')
    INSERT INTO dbo.VerificationProfiles (ProfileCode, DisplayName, PartnerCategory) VALUES (N'garage_verifier', N'Garage', N'garage');
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationProfiles WHERE ProfileCode = N'school_verifier')
    INSERT INTO dbo.VerificationProfiles (ProfileCode, DisplayName, PartnerCategory) VALUES (N'school_verifier', N'Ecole', N'school');
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationProfiles WHERE ProfileCode = N'airline_verifier')
    INSERT INTO dbo.VerificationProfiles (ProfileCode, DisplayName, PartnerCategory) VALUES (N'airline_verifier', N'Compagnie aerienne', N'airline');
IF NOT EXISTS (SELECT 1 FROM dbo.VerificationProfiles WHERE ProfileCode = N'esnas_agent')
    INSERT INTO dbo.VerificationProfiles (ProfileCode, DisplayName, PartnerCategory, IsStaffProfile) VALUES (N'esnas_agent', N'Agent ESNAS', N'esnas_agent', 1);
GO

/* ---------- Permissions assigned to profiles ---------- */
IF OBJECT_ID(N'dbo.VerificationProfilePermissions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.VerificationProfilePermissions (
        VerificationProfileID INT NOT NULL,
        PermissionCode NVARCHAR(80) NOT NULL,
        RequiredAssuranceLevel TINYINT NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_VerificationProfilePermissions_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_VerificationProfilePermissions PRIMARY KEY (VerificationProfileID, PermissionCode),
        CONSTRAINT FK_VerificationProfilePermissions_Profile FOREIGN KEY (VerificationProfileID)
            REFERENCES dbo.VerificationProfiles(VerificationProfileID),
        CONSTRAINT FK_VerificationProfilePermissions_Permission FOREIGN KEY (PermissionCode)
            REFERENCES dbo.VerificationPermissions(PermissionCode),
        CONSTRAINT FK_VerificationProfilePermissions_Assurance FOREIGN KEY (RequiredAssuranceLevel)
            REFERENCES dbo.VerificationAssuranceLevels(AssuranceLevel)
    );
END
GO

/* Baseline: every approved profile may check status and masked identity with QR. */
INSERT INTO dbo.VerificationProfilePermissions (VerificationProfileID, PermissionCode, RequiredAssuranceLevel)
SELECT p.VerificationProfileID, permission.PermissionCode, 1
FROM dbo.VerificationProfiles p
CROSS JOIN (VALUES (N'policy.status'), (N'beneficiary.identity_masked'), (N'coverage.summary')) permission(PermissionCode)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.VerificationProfilePermissions existing
    WHERE existing.VerificationProfileID = p.VerificationProfileID
      AND existing.PermissionCode = permission.PermissionCode
);
GO

/* Sector-specific and sensitive permissions require adaptive step-up. */
INSERT INTO dbo.VerificationProfilePermissions (VerificationProfileID, PermissionCode, RequiredAssuranceLevel)
SELECT p.VerificationProfileID, mapping.PermissionCode, mapping.AssuranceLevel
FROM dbo.VerificationProfiles p
JOIN (VALUES
    (N'hospital_verifier', N'coverage.balance', 2),
    (N'hospital_verifier', N'policy.contract_details', 2),
    (N'hospital_verifier', N'service.authorization', 2),
    (N'pharmacy_verifier', N'coverage.balance', 2),
    (N'pharmacy_verifier', N'service.authorization', 2),
    (N'garage_verifier', N'vehicle.summary', 1),
    (N'garage_verifier', N'policy.contract_details', 2),
    (N'garage_verifier', N'service.authorization', 2),
    (N'school_verifier', N'education.coverage', 1),
    (N'school_verifier', N'policy.contract_details', 2),
    (N'airline_verifier', N'travel.coverage', 1),
    (N'airline_verifier', N'policy.contract_details', 2),
    (N'esnas_agent', N'coverage.balance', 1),
    (N'esnas_agent', N'policy.contract_details', 1),
    (N'esnas_agent', N'service.authorization', 2),
    (N'esnas_agent', N'vehicle.summary', 1),
    (N'esnas_agent', N'education.coverage', 1),
    (N'esnas_agent', N'travel.coverage', 1),
    (N'esnas_agent', N'beneficiary.identity_full', 3),
    (N'esnas_agent', N'verification.history', 3)
) mapping(ProfileCode, PermissionCode, AssuranceLevel)
    ON p.ProfileCode = mapping.ProfileCode
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.VerificationProfilePermissions existing
    WHERE existing.VerificationProfileID = p.VerificationProfileID
      AND existing.PermissionCode = mapping.PermissionCode
);
GO

/* ---------- Organization approval and profile ---------- */
IF OBJECT_ID(N'dbo.OrganizationVerificationSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrganizationVerificationSettings (
        OrganizationID INT NOT NULL PRIMARY KEY,
        VerificationProfileID INT NOT NULL,
        ApprovalStatus NVARCHAR(20) NOT NULL CONSTRAINT DF_OrganizationVerificationSettings_Status DEFAULT N'pending',
        RequireNamedAccount BIT NOT NULL CONSTRAINT DF_OrganizationVerificationSettings_Named DEFAULT 1,
        EmergencyPinAllowed BIT NOT NULL CONSTRAINT DF_OrganizationVerificationSettings_Pin DEFAULT 0,
        ApprovedByUserID INT NULL,
        ApprovedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_OrganizationVerificationSettings_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_OrganizationVerificationSettings_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_OrganizationVerificationSettings_Organization FOREIGN KEY (OrganizationID)
            REFERENCES dbo.PartnerOrganizations(OrganizationID),
        CONSTRAINT FK_OrganizationVerificationSettings_Profile FOREIGN KEY (VerificationProfileID)
            REFERENCES dbo.VerificationProfiles(VerificationProfileID),
        CONSTRAINT FK_OrganizationVerificationSettings_Approver FOREIGN KEY (ApprovedByUserID)
            REFERENCES dbo.Users(UserID),
        CONSTRAINT CK_OrganizationVerificationSettings_Status CHECK (ApprovalStatus IN (
            N'pending', N'approved', N'suspended', N'revoked'
        )),
        CONSTRAINT CK_OrganizationVerificationSettings_AccountRequired CHECK (RequireNamedAccount = 1)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_OrganizationVerificationSettings_Status' AND object_id = OBJECT_ID(N'dbo.OrganizationVerificationSettings'))
    CREATE INDEX IX_OrganizationVerificationSettings_Status
        ON dbo.OrganizationVerificationSettings(ApprovalStatus, VerificationProfileID);
GO

/* ---------- Named partner accounts ---------- */
IF OBJECT_ID(N'dbo.OrganizationMemberships', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrganizationMemberships (
        OrganizationMembershipID BIGINT IDENTITY(1,1) PRIMARY KEY,
        OrganizationID INT NOT NULL,
        UserID INT NOT NULL,
        MembershipRole NVARCHAR(30) NOT NULL CONSTRAINT DF_OrganizationMemberships_Role DEFAULT N'verifier',
        ApprovalStatus NVARCHAR(20) NOT NULL CONSTRAINT DF_OrganizationMemberships_Status DEFAULT N'pending',
        ApprovedByUserID INT NULL,
        ApprovedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_OrganizationMemberships_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_OrganizationMemberships_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_OrganizationMemberships_Organization FOREIGN KEY (OrganizationID)
            REFERENCES dbo.PartnerOrganizations(OrganizationID),
        CONSTRAINT FK_OrganizationMemberships_User FOREIGN KEY (UserID)
            REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_OrganizationMemberships_Approver FOREIGN KEY (ApprovedByUserID)
            REFERENCES dbo.Users(UserID),
        CONSTRAINT CK_OrganizationMemberships_Role CHECK (MembershipRole IN (
            N'verifier', N'supervisor', N'organization_admin'
        )),
        CONSTRAINT CK_OrganizationMemberships_Status CHECK (ApprovalStatus IN (
            N'pending', N'approved', N'suspended', N'revoked'
        ))
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_OrganizationMemberships_User' AND object_id = OBJECT_ID(N'dbo.OrganizationMemberships'))
    CREATE UNIQUE INDEX UX_OrganizationMemberships_User
        ON dbo.OrganizationMemberships(OrganizationID, UserID);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_OrganizationMemberships_UserStatus' AND object_id = OBJECT_ID(N'dbo.OrganizationMemberships'))
    CREATE INDEX IX_OrganizationMemberships_UserStatus
        ON dbo.OrganizationMemberships(UserID, ApprovalStatus);
GO

/* ---------- Emergency organization PIN (status-only fallback) ---------- */
IF OBJECT_ID(N'dbo.OrganizationAccessCodes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrganizationAccessCodes (
        AccessCodeID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        OrganizationID INT NOT NULL,
        CodeHash BINARY(32) NOT NULL,
        CodeSalt BINARY(16) NOT NULL,
        Purpose NVARCHAR(30) NOT NULL CONSTRAINT DF_OrganizationAccessCodes_Purpose DEFAULT N'status_only',
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_OrganizationAccessCodes_Status DEFAULT N'active',
        FailedAttemptCount INT NOT NULL CONSTRAINT DF_OrganizationAccessCodes_Failures DEFAULT 0,
        UseCount INT NOT NULL CONSTRAINT DF_OrganizationAccessCodes_Uses DEFAULT 0,
        ExpiresAt DATETIME2 NOT NULL,
        LockedUntil DATETIME2 NULL,
        LastUsedAt DATETIME2 NULL,
        RevokedAt DATETIME2 NULL,
        CreatedByUserID INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_OrganizationAccessCodes_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_OrganizationAccessCodes_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_OrganizationAccessCodes_Organization FOREIGN KEY (OrganizationID)
            REFERENCES dbo.PartnerOrganizations(OrganizationID),
        CONSTRAINT FK_OrganizationAccessCodes_Creator FOREIGN KEY (CreatedByUserID)
            REFERENCES dbo.Users(UserID),
        CONSTRAINT CK_OrganizationAccessCodes_Purpose CHECK (Purpose = N'status_only'),
        CONSTRAINT CK_OrganizationAccessCodes_Status CHECK (Status IN (N'active', N'revoked', N'expired')),
        CONSTRAINT CK_OrganizationAccessCodes_Counters CHECK (FailedAttemptCount >= 0 AND UseCount >= 0)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_OrganizationAccessCodes_Active' AND object_id = OBJECT_ID(N'dbo.OrganizationAccessCodes'))
    CREATE UNIQUE INDEX UX_OrganizationAccessCodes_Active
        ON dbo.OrganizationAccessCodes(OrganizationID)
        WHERE Status = N'active';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_OrganizationAccessCodes_Expiry' AND object_id = OBJECT_ID(N'dbo.OrganizationAccessCodes'))
    CREATE INDEX IX_OrganizationAccessCodes_Expiry
        ON dbo.OrganizationAccessCodes(Status, ExpiresAt);
GO

/* ---------- Immutable verification journal ---------- */
IF OBJECT_ID(N'dbo.VerificationLogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.VerificationLogs (
        VerificationLogID UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_VerificationLogs_ID DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        CorrelationID UNIQUEIDENTIFIER NOT NULL,
        CredentialID UNIQUEIDENTIFIER NULL,
        PolicyID INT NULL,
        BeneficiaryID INT NULL,
        ActorUserID INT NULL,
        OrganizationID INT NULL,
        VerificationProfileID INT NULL,
        PermissionCode NVARCHAR(80) NOT NULL,
        AccessMethod NVARCHAR(30) NOT NULL,
        AssuranceMethod NVARCHAR(30) NOT NULL,
        Decision NVARCHAR(20) NOT NULL,
        ReasonCode NVARCHAR(80) NULL,
        IpAddress NVARCHAR(60) NULL,
        UserAgentHash BINARY(32) NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_VerificationLogs_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_VerificationLogs_Credential FOREIGN KEY (CredentialID)
            REFERENCES dbo.BeneficiaryCredentials(CredentialID),
        CONSTRAINT FK_VerificationLogs_Policy FOREIGN KEY (PolicyID)
            REFERENCES dbo.InsurancePolicies(PolicyID),
        CONSTRAINT FK_VerificationLogs_Beneficiary FOREIGN KEY (BeneficiaryID)
            REFERENCES dbo.Beneficiaries(BeneficiaryID),
        CONSTRAINT FK_VerificationLogs_Actor FOREIGN KEY (ActorUserID)
            REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_VerificationLogs_Organization FOREIGN KEY (OrganizationID)
            REFERENCES dbo.PartnerOrganizations(OrganizationID),
        CONSTRAINT FK_VerificationLogs_Profile FOREIGN KEY (VerificationProfileID)
            REFERENCES dbo.VerificationProfiles(VerificationProfileID),
        CONSTRAINT FK_VerificationLogs_Permission FOREIGN KEY (PermissionCode)
            REFERENCES dbo.VerificationPermissions(PermissionCode),
        CONSTRAINT CK_VerificationLogs_AccessMethod CHECK (AccessMethod IN (
            N'named_account', N'emergency_pin', N'esnas_staff', N'system'
        )),
        CONSTRAINT CK_VerificationLogs_AssuranceMethod CHECK (AssuranceMethod IN (
            N'qr', N'qr_pin', N'qr_otp', N'staff_reauth'
        )),
        CONSTRAINT CK_VerificationLogs_Decision CHECK (Decision IN (
            N'allowed', N'denied', N'error'
        )),
        CONSTRAINT CK_VerificationLogs_Principal CHECK (
            ActorUserID IS NOT NULL OR OrganizationID IS NOT NULL OR AccessMethod = N'system'
        ),
        CONSTRAINT CK_VerificationLogs_EmergencyScope CHECK (
            AccessMethod <> N'emergency_pin' OR PermissionCode = N'policy.status'
        )
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_VerificationLogs_Correlation' AND object_id = OBJECT_ID(N'dbo.VerificationLogs'))
    CREATE UNIQUE INDEX UX_VerificationLogs_Correlation
        ON dbo.VerificationLogs(CorrelationID);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_VerificationLogs_OrganizationDate' AND object_id = OBJECT_ID(N'dbo.VerificationLogs'))
    CREATE INDEX IX_VerificationLogs_OrganizationDate
        ON dbo.VerificationLogs(OrganizationID, CreatedAt DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_VerificationLogs_PolicyDate' AND object_id = OBJECT_ID(N'dbo.VerificationLogs'))
    CREATE INDEX IX_VerificationLogs_PolicyDate
        ON dbo.VerificationLogs(PolicyID, CreatedAt DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_VerificationLogs_ActorDate' AND object_id = OBJECT_ID(N'dbo.VerificationLogs'))
    CREATE INDEX IX_VerificationLogs_ActorDate
        ON dbo.VerificationLogs(ActorUserID, CreatedAt DESC);
GO