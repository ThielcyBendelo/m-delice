/*
  A executer dans SSMS avec un compte administrateur.
  Activez d'abord: Requete > Mode SQLCMD.
  Remplacez la valeur ci-dessous par le mot de passe de server/.env.
*/
:setvar APP_PASSWORD "CHANGE_ME_WITH_A_STRONG_PASSWORD"

USE [master];
GO

IF DB_ID(N'DrcAssurancesDB') IS NULL
BEGIN
  CREATE DATABASE [DrcAssurancesDB];
END;
GO

IF SUSER_ID(N'esnas_app') IS NULL
BEGIN
  CREATE LOGIN [esnas_app]
    WITH PASSWORD = N'$(APP_PASSWORD)',
       CHECK_POLICY = ON,
       CHECK_EXPIRATION = OFF;
END
ELSE
BEGIN
  ALTER LOGIN [esnas_app]
    WITH PASSWORD = N'$(APP_PASSWORD)',
       CHECK_POLICY = ON,
       CHECK_EXPIRATION = OFF;
  ALTER LOGIN [esnas_app] ENABLE;
END;
GO

USE [DrcAssurancesDB];
GO

IF USER_ID(N'esnas_app') IS NULL
BEGIN
  CREATE USER [esnas_app] FOR LOGIN [esnas_app];
END
ELSE
BEGIN
  ALTER USER [esnas_app] WITH LOGIN = [esnas_app];
END;
GO

IF IS_ROLEMEMBER(N'db_datareader', N'esnas_app') <> 1
  ALTER ROLE [db_datareader] ADD MEMBER [esnas_app];
IF IS_ROLEMEMBER(N'db_datawriter', N'esnas_app') <> 1
  ALTER ROLE [db_datawriter] ADD MEMBER [esnas_app];
IF IS_ROLEMEMBER(N'db_ddladmin', N'esnas_app') <> 1
  ALTER ROLE [db_ddladmin] ADD MEMBER [esnas_app];
GO

GRANT CONNECT TO [esnas_app];
GO

SELECT
  SUSER_ID(N'esnas_app') AS LoginId,
  USER_ID(N'esnas_app') AS DatabaseUserId,
  IS_ROLEMEMBER(N'db_datareader', N'esnas_app') AS CanRead,
  IS_ROLEMEMBER(N'db_datawriter', N'esnas_app') AS CanWrite,
  IS_ROLEMEMBER(N'db_ddladmin', N'esnas_app') AS CanRunMigrations;
GO

