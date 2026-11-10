/*
  Payment resilience foundation.
  Additive only: existing payment, policy and notification tables are unchanged.
*/
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
GO

/* ---------- PaymentAttempts ---------- */
IF OBJECT_ID(N'dbo.PaymentAttempts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PaymentAttempts (
        PaymentAttemptID BIGINT IDENTITY(1,1) PRIMARY KEY,
        TransactionReference NVARCHAR(120) NOT NULL,
        Provider NVARCHAR(40) NOT NULL,
        ProviderAttemptID NVARCHAR(200) NULL,
        Status NVARCHAR(40) NOT NULL CONSTRAINT DF_PaymentAttempts_Status DEFAULT N'pending',
        Amount DECIMAL(12,2) NULL,
        Currency NVARCHAR(10) NULL,
        FailureCode NVARCHAR(100) NULL,
        FailureMessage NVARCHAR(1000) NULL,
        MetadataJson NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_PaymentAttempts_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_PaymentAttempts_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_PaymentAttempts_Status CHECK (Status IN (
            N'pending', N'requires_action', N'processing', N'succeeded', N'failed', N'cancelled', N'refunded'
        )),
        CONSTRAINT CK_PaymentAttempts_Amount CHECK (Amount IS NULL OR Amount >= 0)
    );

END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PaymentAttempts_Transaction' AND object_id = OBJECT_ID(N'dbo.PaymentAttempts'))
    CREATE INDEX IX_PaymentAttempts_Transaction
        ON dbo.PaymentAttempts(TransactionReference, CreatedAt DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PaymentAttempts_Status' AND object_id = OBJECT_ID(N'dbo.PaymentAttempts'))
    CREATE INDEX IX_PaymentAttempts_Status
        ON dbo.PaymentAttempts(Status, UpdatedAt);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_PaymentAttempts_ProviderAttempt' AND object_id = OBJECT_ID(N'dbo.PaymentAttempts'))
    CREATE UNIQUE INDEX UX_PaymentAttempts_ProviderAttempt
        ON dbo.PaymentAttempts(Provider, ProviderAttemptID)
        WHERE ProviderAttemptID IS NOT NULL;
GO

/* ---------- WebhookEvents ---------- */
IF OBJECT_ID(N'dbo.WebhookEvents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WebhookEvents (
        WebhookEventID BIGINT IDENTITY(1,1) PRIMARY KEY,
        Provider NVARCHAR(40) NOT NULL,
        ProviderEventID NVARCHAR(200) NOT NULL,
        EventType NVARCHAR(120) NOT NULL,
        TransactionReference NVARCHAR(120) NULL,
        SignatureVerified BIT NOT NULL CONSTRAINT DF_WebhookEvents_SignatureVerified DEFAULT 0,
        Status NVARCHAR(40) NOT NULL CONSTRAINT DF_WebhookEvents_Status DEFAULT N'received',
        AttemptCount INT NOT NULL CONSTRAINT DF_WebhookEvents_AttemptCount DEFAULT 0,
        PayloadJson NVARCHAR(MAX) NULL,
        LastError NVARCHAR(2000) NULL,
        ReceivedAt DATETIME2 NOT NULL CONSTRAINT DF_WebhookEvents_ReceivedAt DEFAULT SYSUTCDATETIME(),
        NextRetryAt DATETIME2 NULL,
        ProcessedAt DATETIME2 NULL,
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_WebhookEvents_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_WebhookEvents_Status CHECK (Status IN (
            N'received', N'processing', N'processed', N'failed', N'ignored'
        )),
        CONSTRAINT CK_WebhookEvents_AttemptCount CHECK (AttemptCount >= 0)
    );

END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_WebhookEvents_ProviderEvent' AND object_id = OBJECT_ID(N'dbo.WebhookEvents'))
    CREATE UNIQUE INDEX UX_WebhookEvents_ProviderEvent
        ON dbo.WebhookEvents(Provider, ProviderEventID);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_WebhookEvents_Retry' AND object_id = OBJECT_ID(N'dbo.WebhookEvents'))
    CREATE INDEX IX_WebhookEvents_Retry
        ON dbo.WebhookEvents(Status, NextRetryAt, ReceivedAt);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_WebhookEvents_Transaction' AND object_id = OBJECT_ID(N'dbo.WebhookEvents'))
    CREATE INDEX IX_WebhookEvents_Transaction
        ON dbo.WebhookEvents(TransactionReference)
        WHERE TransactionReference IS NOT NULL;
GO

/* ---------- OutboxEvents ---------- */
IF OBJECT_ID(N'dbo.OutboxEvents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OutboxEvents (
        OutboxEventID UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_OutboxEvents_ID DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        EventType NVARCHAR(120) NOT NULL,
        AggregateType NVARCHAR(80) NOT NULL,
        AggregateID NVARCHAR(120) NOT NULL,
        DeduplicationKey NVARCHAR(240) NULL,
        PayloadJson NVARCHAR(MAX) NOT NULL,
        Status NVARCHAR(40) NOT NULL CONSTRAINT DF_OutboxEvents_Status DEFAULT N'pending',
        AttemptCount INT NOT NULL CONSTRAINT DF_OutboxEvents_AttemptCount DEFAULT 0,
        AvailableAt DATETIME2 NOT NULL CONSTRAINT DF_OutboxEvents_AvailableAt DEFAULT SYSUTCDATETIME(),
        LockedAt DATETIME2 NULL,
        LockedBy NVARCHAR(120) NULL,
        LastError NVARCHAR(2000) NULL,
        ProcessedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_OutboxEvents_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_OutboxEvents_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_OutboxEvents_Status CHECK (Status IN (
            N'pending', N'processing', N'processed', N'failed', N'dead_letter'
        )),
        CONSTRAINT CK_OutboxEvents_AttemptCount CHECK (AttemptCount >= 0)
    );

END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_OutboxEvents_Deduplication' AND object_id = OBJECT_ID(N'dbo.OutboxEvents'))
    CREATE UNIQUE INDEX UX_OutboxEvents_Deduplication
        ON dbo.OutboxEvents(DeduplicationKey)
        WHERE DeduplicationKey IS NOT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_OutboxEvents_Dispatch' AND object_id = OBJECT_ID(N'dbo.OutboxEvents'))
    CREATE INDEX IX_OutboxEvents_Dispatch
        ON dbo.OutboxEvents(Status, AvailableAt, CreatedAt);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_OutboxEvents_Aggregate' AND object_id = OBJECT_ID(N'dbo.OutboxEvents'))
    CREATE INDEX IX_OutboxEvents_Aggregate
        ON dbo.OutboxEvents(AggregateType, AggregateID, CreatedAt DESC);
GO