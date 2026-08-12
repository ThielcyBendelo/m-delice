/*
  ESNAS DRC — Schema canonique SQL Server
  Idempotent : safe a rejouer (IF NOT EXISTS)
*/

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SchemaMigrations (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        MigrationName NVARCHAR(200) NOT NULL UNIQUE,
        AppliedAt DATETIME2 NOT NULL CONSTRAINT DF_SchemaMigrations_AppliedAt DEFAULT SYSUTCDATETIME()
    );
END
GO

/* ---------- Users ---------- */
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        UserID INT IDENTITY(1,1) PRIMARY KEY,
        LastName NVARCHAR(100) NOT NULL,
        FirstName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(255) NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        UserRole NVARCHAR(50) NOT NULL CONSTRAINT DF_Users_Role DEFAULT N'Diaspora',
        CountryOfResidence NVARCHAR(100) NULL,
        Phone NVARCHAR(40) NULL,
        AuthProvider NVARCHAR(30) NOT NULL CONSTRAINT DF_Users_AuthProvider DEFAULT N'local',
        GoogleSub NVARCHAR(100) NULL,
        AvatarUrl NVARCHAR(500) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT SYSUTCDATETIME()
    );
    CREATE UNIQUE INDEX UX_Users_Email ON dbo.Users(Email);
END
ELSE
BEGIN
    IF COL_LENGTH('dbo.Users', 'Phone') IS NULL
        ALTER TABLE dbo.Users ADD Phone NVARCHAR(40) NULL;
    IF COL_LENGTH('dbo.Users', 'AuthProvider') IS NULL
        ALTER TABLE dbo.Users ADD AuthProvider NVARCHAR(30) NOT NULL CONSTRAINT DF_Users_AuthProvider2 DEFAULT N'local';
    IF COL_LENGTH('dbo.Users', 'GoogleSub') IS NULL
        ALTER TABLE dbo.Users ADD GoogleSub NVARCHAR(100) NULL;
    IF COL_LENGTH('dbo.Users', 'AvatarUrl') IS NULL
        ALTER TABLE dbo.Users ADD AvatarUrl NVARCHAR(500) NULL;
    IF COL_LENGTH('dbo.Users', 'IsActive') IS NULL
        ALTER TABLE dbo.Users ADD IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive2 DEFAULT 1;
    IF COL_LENGTH('dbo.Users', 'CreatedAt') IS NULL
        ALTER TABLE dbo.Users ADD CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt2 DEFAULT SYSUTCDATETIME();
    IF COL_LENGTH('dbo.Users', 'UpdatedAt') IS NULL
        ALTER TABLE dbo.Users ADD UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_UpdatedAt2 DEFAULT SYSUTCDATETIME();
END
GO

/* ---------- Beneficiaries ---------- */
IF OBJECT_ID(N'dbo.Beneficiaries', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Beneficiaries (
        BeneficiaryID INT IDENTITY(1,1) PRIMARY KEY,
        LastName NVARCHAR(100) NOT NULL,
        FirstName NVARCHAR(100) NOT NULL,
        WhatsAppPhone NVARCHAR(40) NOT NULL,
        City NVARCHAR(100) NULL,
        HomeAddress NVARCHAR(300) NULL,
        NationalID NVARCHAR(80) NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Beneficiaries_CreatedAt DEFAULT SYSUTCDATETIME()
    );
END
ELSE
BEGIN
    IF COL_LENGTH('dbo.Beneficiaries', 'CreatedAt') IS NULL
        ALTER TABLE dbo.Beneficiaries ADD CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Beneficiaries_CreatedAt2 DEFAULT SYSUTCDATETIME();
END
GO

/* ---------- Quotes ---------- */
IF OBJECT_ID(N'dbo.Quotes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Quotes (
        QuoteID INT IDENTITY(1,1) PRIMARY KEY,
        QuoteNumber NVARCHAR(40) NOT NULL,
        UserID INT NULL,
        FullName NVARCHAR(200) NULL,
        Email NVARCHAR(255) NULL,
        Phone NVARCHAR(40) NULL,
        Branch NVARCHAR(80) NOT NULL,
        CoverageLevel NVARCHAR(80) NOT NULL,
        EstimatedPremiumUSD DECIMAL(12,2) NOT NULL CONSTRAINT DF_Quotes_Premium DEFAULT 0,
        Status NVARCHAR(40) NOT NULL CONSTRAINT DF_Quotes_Status DEFAULT N'pending',
        Notes NVARCHAR(MAX) NULL,
        PayloadJson NVARCHAR(MAX) NULL,
        ConvertedPolicyID INT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Quotes_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Quotes_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Quotes_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID)
    );
    CREATE UNIQUE INDEX UX_Quotes_QuoteNumber ON dbo.Quotes(QuoteNumber);
    CREATE INDEX IX_Quotes_Status ON dbo.Quotes(Status);
END
GO

/* ---------- InsurancePolicies ---------- */
IF OBJECT_ID(N'dbo.InsurancePolicies', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.InsurancePolicies (
        PolicyID INT IDENTITY(1,1) PRIMARY KEY,
        PolicyNumber NVARCHAR(40) NOT NULL,
        BuyerID INT NOT NULL,
        BeneficiaryID INT NOT NULL,
        InsuranceBranch NVARCHAR(80) NOT NULL,
        CoverageLevel NVARCHAR(80) NOT NULL,
        AnnualLimitUSD DECIMAL(12,2) NOT NULL,
        RemainingLimitUSD DECIMAL(12,2) NOT NULL,
        PremiumUSD DECIMAL(12,2) NULL,
        StartDate DATETIME2 NOT NULL,
        EndDate DATETIME2 NOT NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_Policies_IsActive DEFAULT 0,
        Status NVARCHAR(40) NOT NULL CONSTRAINT DF_Policies_Status DEFAULT N'pending_payment',
        QuoteID INT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Policies_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Policies_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Policies_Buyer FOREIGN KEY (BuyerID) REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_Policies_Beneficiary FOREIGN KEY (BeneficiaryID) REFERENCES dbo.Beneficiaries(BeneficiaryID)
    );
    CREATE UNIQUE INDEX UX_Policies_PolicyNumber ON dbo.InsurancePolicies(PolicyNumber);
    CREATE INDEX IX_Policies_Buyer ON dbo.InsurancePolicies(BuyerID);
    CREATE INDEX IX_Policies_Status ON dbo.InsurancePolicies(Status);
END
ELSE
BEGIN
    IF COL_LENGTH('dbo.InsurancePolicies', 'PremiumUSD') IS NULL
        ALTER TABLE dbo.InsurancePolicies ADD PremiumUSD DECIMAL(12,2) NULL;
    IF COL_LENGTH('dbo.InsurancePolicies', 'Status') IS NULL
        ALTER TABLE dbo.InsurancePolicies ADD Status NVARCHAR(40) NOT NULL CONSTRAINT DF_Policies_Status2 DEFAULT N'active';
    IF COL_LENGTH('dbo.InsurancePolicies', 'QuoteID') IS NULL
        ALTER TABLE dbo.InsurancePolicies ADD QuoteID INT NULL;
    IF COL_LENGTH('dbo.InsurancePolicies', 'CreatedAt') IS NULL
        ALTER TABLE dbo.InsurancePolicies ADD CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Policies_CreatedAt2 DEFAULT SYSUTCDATETIME();
    IF COL_LENGTH('dbo.InsurancePolicies', 'UpdatedAt') IS NULL
        ALTER TABLE dbo.InsurancePolicies ADD UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Policies_UpdatedAt2 DEFAULT SYSUTCDATETIME();
    IF COL_LENGTH('dbo.InsurancePolicies', 'IsActive') IS NULL
        ALTER TABLE dbo.InsurancePolicies ADD IsActive BIT NOT NULL CONSTRAINT DF_Policies_IsActive2 DEFAULT 1;
END
GO

/* ---------- Payments ---------- */
IF OBJECT_ID(N'dbo.Payments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Payments (
        PaymentID INT IDENTITY(1,1) PRIMARY KEY,
        TransactionReference NVARCHAR(120) NOT NULL,
        PolicyID INT NULL,
        UserID INT NULL,
        GatewayUsed NVARCHAR(80) NOT NULL,
        AmountUSD DECIMAL(12,2) NOT NULL,
        TaxArcaUSD DECIMAL(12,2) NOT NULL CONSTRAINT DF_Payments_Tax DEFAULT 0,
        TotalPaidUSD DECIMAL(12,2) NOT NULL,
        CurrencyReceived NVARCHAR(10) NOT NULL CONSTRAINT DF_Payments_Cur DEFAULT N'USD',
        Status NVARCHAR(40) NOT NULL CONSTRAINT DF_Payments_Status DEFAULT N'pending',
        ProviderPaymentId NVARCHAR(200) NULL,
        ProviderPayload NVARCHAR(MAX) NULL,
        PaidAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Payments_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Payments_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Payments_Policy FOREIGN KEY (PolicyID) REFERENCES dbo.InsurancePolicies(PolicyID),
        CONSTRAINT FK_Payments_User FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID)
    );
    CREATE UNIQUE INDEX UX_Payments_TxRef ON dbo.Payments(TransactionReference);
    CREATE INDEX IX_Payments_Status ON dbo.Payments(Status);
END
ELSE
BEGIN
    IF COL_LENGTH('dbo.Payments', 'PaymentID') IS NULL
    BEGIN
        -- legacy table without PaymentID: add tracking columns only
        PRINT 'Payments table exists (legacy). Adding optional columns if missing...';
    END
    IF COL_LENGTH('dbo.Payments', 'UserID') IS NULL
        ALTER TABLE dbo.Payments ADD UserID INT NULL;
    IF COL_LENGTH('dbo.Payments', 'Status') IS NULL
        ALTER TABLE dbo.Payments ADD Status NVARCHAR(40) NOT NULL CONSTRAINT DF_Payments_Status2 DEFAULT N'completed';
    IF COL_LENGTH('dbo.Payments', 'ProviderPaymentId') IS NULL
        ALTER TABLE dbo.Payments ADD ProviderPaymentId NVARCHAR(200) NULL;
    IF COL_LENGTH('dbo.Payments', 'ProviderPayload') IS NULL
        ALTER TABLE dbo.Payments ADD ProviderPayload NVARCHAR(MAX) NULL;
    IF COL_LENGTH('dbo.Payments', 'PaidAt') IS NULL
        ALTER TABLE dbo.Payments ADD PaidAt DATETIME2 NULL;
    IF COL_LENGTH('dbo.Payments', 'CreatedAt') IS NULL
        ALTER TABLE dbo.Payments ADD CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Payments_CreatedAt2 DEFAULT SYSUTCDATETIME();
    IF COL_LENGTH('dbo.Payments', 'UpdatedAt') IS NULL
        ALTER TABLE dbo.Payments ADD UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Payments_UpdatedAt2 DEFAULT SYSUTCDATETIME();
END
GO

/* ---------- Claims ---------- */
IF OBJECT_ID(N'dbo.Claims', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Claims (
        ClaimID INT IDENTITY(1,1) PRIMARY KEY,
        ClaimNumber NVARCHAR(40) NOT NULL,
        PolicyID INT NOT NULL,
        FiledByUserID INT NULL,
        EventDate DATETIME2 NOT NULL,
        ClaimDescription NVARCHAR(MAX) NOT NULL,
        GpsLocation NVARCHAR(120) NULL,
        EstimatedCostUSD DECIMAL(12,2) NOT NULL,
        ApprovedAmountUSD DECIMAL(12,2) NULL,
        DocumentPath NVARCHAR(500) NULL,
        ClaimStatus NVARCHAR(40) NOT NULL CONSTRAINT DF_Claims_Status DEFAULT N'submitted',
        ReviewerNotes NVARCHAR(MAX) NULL,
        ReviewedByUserID INT NULL,
        ReviewedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Claims_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Claims_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Claims_Policy FOREIGN KEY (PolicyID) REFERENCES dbo.InsurancePolicies(PolicyID)
    );
    CREATE UNIQUE INDEX UX_Claims_ClaimNumber ON dbo.Claims(ClaimNumber);
    CREATE INDEX IX_Claims_Status ON dbo.Claims(ClaimStatus);
    CREATE INDEX IX_Claims_Policy ON dbo.Claims(PolicyID);
END
ELSE
BEGIN
    IF COL_LENGTH('dbo.Claims', 'ClaimID') IS NULL
        PRINT 'Claims legacy table detected';
    IF COL_LENGTH('dbo.Claims', 'FiledByUserID') IS NULL
        ALTER TABLE dbo.Claims ADD FiledByUserID INT NULL;
    IF COL_LENGTH('dbo.Claims', 'ApprovedAmountUSD') IS NULL
        ALTER TABLE dbo.Claims ADD ApprovedAmountUSD DECIMAL(12,2) NULL;
    IF COL_LENGTH('dbo.Claims', 'ReviewerNotes') IS NULL
        ALTER TABLE dbo.Claims ADD ReviewerNotes NVARCHAR(MAX) NULL;
    IF COL_LENGTH('dbo.Claims', 'ReviewedByUserID') IS NULL
        ALTER TABLE dbo.Claims ADD ReviewedByUserID INT NULL;
    IF COL_LENGTH('dbo.Claims', 'ReviewedAt') IS NULL
        ALTER TABLE dbo.Claims ADD ReviewedAt DATETIME2 NULL;
    IF COL_LENGTH('dbo.Claims', 'CreatedAt') IS NULL
        ALTER TABLE dbo.Claims ADD CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Claims_CreatedAt2 DEFAULT SYSUTCDATETIME();
    IF COL_LENGTH('dbo.Claims', 'UpdatedAt') IS NULL
        ALTER TABLE dbo.Claims ADD UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Claims_UpdatedAt2 DEFAULT SYSUTCDATETIME();
END
GO

/* ---------- AuditLogs ---------- */
IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLogs (
        AuditID BIGINT IDENTITY(1,1) PRIMARY KEY,
        ActorUserID INT NULL,
        Action NVARCHAR(120) NOT NULL,
        EntityType NVARCHAR(80) NULL,
        EntityId NVARCHAR(80) NULL,
        Details NVARCHAR(MAX) NULL,
        IpAddress NVARCHAR(60) NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_AuditLogs_CreatedAt DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_AuditLogs_CreatedAt ON dbo.AuditLogs(CreatedAt DESC);
    CREATE INDEX IX_AuditLogs_Entity ON dbo.AuditLogs(EntityType, EntityId);
END
GO

/* ---------- Notifications ---------- */
IF OBJECT_ID(N'dbo.Notifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        NotificationID BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NULL,
        Channel NVARCHAR(40) NOT NULL CONSTRAINT DF_Notifications_Channel DEFAULT N'email',
        TemplateKey NVARCHAR(80) NULL,
        Recipient NVARCHAR(255) NULL,
        Subject NVARCHAR(255) NULL,
        Body NVARCHAR(MAX) NULL,
        Status NVARCHAR(40) NOT NULL CONSTRAINT DF_Notifications_Status DEFAULT N'queued',
        RelatedEntityType NVARCHAR(80) NULL,
        RelatedEntityId NVARCHAR(80) NULL,
        SentAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_Notifications_Status ON dbo.Notifications(Status);
END
GO
