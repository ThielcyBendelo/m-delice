/* Auth security: password reset tokens and phone normalization metadata. */
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.Users', 'PhoneCountryCode') IS NULL
    ALTER TABLE dbo.Users ADD PhoneCountryCode NVARCHAR(8) NULL;
GO

IF OBJECT_ID(N'dbo.PasswordResetTokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PasswordResetTokens (
        PasswordResetTokenID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        UserID INT NOT NULL,
        TokenHash CHAR(64) NOT NULL,
        ExpiresAt DATETIME2 NOT NULL,
        UsedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_PasswordResetTokens_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_PasswordResetTokens_User FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID),
        CONSTRAINT CK_PasswordResetTokens_Expiry CHECK (ExpiresAt > CreatedAt)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_PasswordResetTokens_TokenHash' AND object_id = OBJECT_ID(N'dbo.PasswordResetTokens'))
    CREATE UNIQUE INDEX UX_PasswordResetTokens_TokenHash ON dbo.PasswordResetTokens(TokenHash);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PasswordResetTokens_UserExpiry' AND object_id = OBJECT_ID(N'dbo.PasswordResetTokens'))
    CREATE INDEX IX_PasswordResetTokens_UserExpiry ON dbo.PasswordResetTokens(UserID, ExpiresAt DESC);
GO
