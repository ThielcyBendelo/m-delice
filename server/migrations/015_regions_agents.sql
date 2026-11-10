/* Regional routing layer: additive and safe to rerun. */

IF OBJECT_ID(N'dbo.Regions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Regions (
        RegionID INT IDENTITY(1,1) PRIMARY KEY,
        RegionCode NVARCHAR(40) NOT NULL,
        RegionName NVARCHAR(120) NOT NULL,
        CountryCode NVARCHAR(10) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_Regions_IsActive DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Regions_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Regions_UpdatedAt DEFAULT SYSUTCDATETIME()
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Regions_Code' AND object_id = OBJECT_ID(N'dbo.Regions'))
    CREATE UNIQUE INDEX UX_Regions_Code ON dbo.Regions(RegionCode);
GO

IF COL_LENGTH('dbo.PartnerOrganizations', 'RegionID') IS NULL
    ALTER TABLE dbo.PartnerOrganizations ADD RegionID INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PartnerOrganizations_Region')
    ALTER TABLE dbo.PartnerOrganizations
      ADD CONSTRAINT FK_PartnerOrganizations_Region
      FOREIGN KEY (RegionID) REFERENCES dbo.Regions(RegionID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PartnerOrganizations_RegionActive' AND object_id = OBJECT_ID(N'dbo.PartnerOrganizations'))
    CREATE INDEX IX_PartnerOrganizations_RegionActive
      ON dbo.PartnerOrganizations(RegionID, IsActive);
GO

IF OBJECT_ID(N'dbo.UserRegionAssignments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserRegionAssignments (
        UserRegionAssignmentID BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        RegionID INT NOT NULL,
        IsPrimary BIT NOT NULL CONSTRAINT DF_UserRegionAssignments_IsPrimary DEFAULT 1,
        IsActive BIT NOT NULL CONSTRAINT DF_UserRegionAssignments_IsActive DEFAULT 1,
        AssignedByUserID INT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_UserRegionAssignments_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_UserRegionAssignments_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_UserRegionAssignments_User FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_UserRegionAssignments_Region FOREIGN KEY (RegionID) REFERENCES dbo.Regions(RegionID),
        CONSTRAINT FK_UserRegionAssignments_Assigner FOREIGN KEY (AssignedByUserID) REFERENCES dbo.Users(UserID)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_UserRegionAssignments_UserRegion' AND object_id = OBJECT_ID(N'dbo.UserRegionAssignments'))
    CREATE UNIQUE INDEX UX_UserRegionAssignments_UserRegion
      ON dbo.UserRegionAssignments(UserID, RegionID);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_UserRegionAssignments_RegionActive' AND object_id = OBJECT_ID(N'dbo.UserRegionAssignments'))
    CREATE INDEX IX_UserRegionAssignments_RegionActive
      ON dbo.UserRegionAssignments(RegionID, IsActive, UserID);
GO

/* Global admins remain unrestricted; agent routing is opt-in through assignments. */
IF OBJECT_ID(N'dbo.Regions', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.Regions WHERE RegionCode = N'CD-NATIONAL')
        INSERT INTO dbo.Regions (RegionCode, RegionName, CountryCode)
        VALUES (N'CD-NATIONAL', N'Republique democratique du Congo', N'CD');
END
GO
