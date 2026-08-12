/*
  Assouplir Claims.GpsLocation (legacy NOT NULL) + DocumentPath
*/
IF COL_LENGTH('dbo.Claims', 'GpsLocation') IS NOT NULL
BEGIN
  BEGIN TRY
    ALTER TABLE dbo.Claims ALTER COLUMN GpsLocation NVARCHAR(120) NULL;
  END TRY
  BEGIN CATCH
    PRINT 'GpsLocation alter skipped: ' + ERROR_MESSAGE();
  END CATCH
END
GO

IF COL_LENGTH('dbo.Claims', 'DocumentPath') IS NOT NULL
BEGIN
  BEGIN TRY
    ALTER TABLE dbo.Claims ALTER COLUMN DocumentPath NVARCHAR(500) NULL;
  END TRY
  BEGIN CATCH
    PRINT 'DocumentPath alter skipped: ' + ERROR_MESSAGE();
  END CATCH
END
GO
