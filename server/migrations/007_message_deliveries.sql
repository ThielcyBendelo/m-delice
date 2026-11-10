/*
  Provider delivery tracking for WhatsApp and SMS.
  Additive only: existing notification rows and columns are unchanged.
*/

IF OBJECT_ID(N'dbo.MessageDeliveries', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.MessageDeliveries (
        MessageDeliveryID BIGINT IDENTITY(1,1) PRIMARY KEY,
        NotificationID BIGINT NOT NULL,
        Provider NVARCHAR(40) NOT NULL,
        ProviderMessageID NVARCHAR(200) NOT NULL,
        Channel NVARCHAR(20) NOT NULL,
        Status NVARCHAR(40) NOT NULL CONSTRAINT DF_MessageDeliveries_Status DEFAULT N'accepted',
        ErrorCode NVARCHAR(100) NULL,
        FallbackRequestedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_MessageDeliveries_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_MessageDeliveries_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_MessageDeliveries_Notification
            FOREIGN KEY (NotificationID) REFERENCES dbo.Notifications(NotificationID),
        CONSTRAINT CK_MessageDeliveries_Channel CHECK (Channel IN (N'whatsapp', N'sms')),
        CONSTRAINT CK_MessageDeliveries_Status CHECK (Status IN (
            N'accepted', N'scheduled', N'queued', N'sending', N'sent', N'receiving',
            N'received', N'delivered', N'undelivered', N'failed', N'read', N'canceled'
        ))
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_MessageDeliveries_ProviderMessage' AND object_id = OBJECT_ID(N'dbo.MessageDeliveries'))
    CREATE UNIQUE INDEX UX_MessageDeliveries_ProviderMessage
        ON dbo.MessageDeliveries(Provider, ProviderMessageID);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MessageDeliveries_Notification' AND object_id = OBJECT_ID(N'dbo.MessageDeliveries'))
    CREATE INDEX IX_MessageDeliveries_Notification
        ON dbo.MessageDeliveries(NotificationID, CreatedAt DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MessageDeliveries_Status' AND object_id = OBJECT_ID(N'dbo.MessageDeliveries'))
    CREATE INDEX IX_MessageDeliveries_Status
        ON dbo.MessageDeliveries(Channel, Status, UpdatedAt);
GO