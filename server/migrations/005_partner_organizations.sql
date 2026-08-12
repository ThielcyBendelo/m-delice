/* Organisations partenaires gerees depuis la console admin */
IF OBJECT_ID(N'dbo.PartnerOrganizations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PartnerOrganizations (
        OrganizationID INT IDENTITY(1,1) PRIMARY KEY,
        OrganizationName NVARCHAR(200) NOT NULL,
        OrganizationType NVARCHAR(40) NOT NULL,
        RegistrationNumber NVARCHAR(100) NULL,
        ContactName NVARCHAR(160) NULL,
        Email NVARCHAR(255) NULL,
        Phone NVARCHAR(40) NULL,
        Country NVARCHAR(100) NULL,
        City NVARCHAR(100) NULL,
        Address NVARCHAR(300) NULL,
        Notes NVARCHAR(1000) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_PartnerOrganizations_IsActive DEFAULT 1,
        CreatedByUserID INT NULL,
        UpdatedByUserID INT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_PartnerOrganizations_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_PartnerOrganizations_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_PartnerOrganizations_Type CHECK (OrganizationType IN (
            N'admin', N'diaspora', N'hospital', N'education', N'travel_airline', N'automobile'
        )),
        CONSTRAINT FK_PartnerOrganizations_CreatedBy FOREIGN KEY (CreatedByUserID) REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_PartnerOrganizations_UpdatedBy FOREIGN KEY (UpdatedByUserID) REFERENCES dbo.Users(UserID)
    );
    CREATE INDEX IX_PartnerOrganizations_TypeActive
        ON dbo.PartnerOrganizations(OrganizationType, IsActive);
    CREATE INDEX IX_PartnerOrganizations_Name
        ON dbo.PartnerOrganizations(OrganizationName);
END
GO