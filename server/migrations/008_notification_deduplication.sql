/* Additive idempotency support for worker-created notifications. */
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
GO

IF COL_LENGTH('dbo.Notifications', 'DeduplicationKey') IS NULL
    ALTER TABLE dbo.Notifications ADD DeduplicationKey NVARCHAR(240) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Notifications_Deduplication' AND object_id = OBJECT_ID(N'dbo.Notifications'))
    CREATE UNIQUE INDEX UX_Notifications_Deduplication
        ON dbo.Notifications(DeduplicationKey)
        WHERE DeduplicationKey IS NOT NULL;
GO