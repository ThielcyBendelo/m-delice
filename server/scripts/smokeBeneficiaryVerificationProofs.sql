SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;

SET NOCOUNT ON;
BEGIN TRANSACTION;

DECLARE @BeneficiaryID INT = (SELECT TOP (1) BeneficiaryID FROM Beneficiaries ORDER BY BeneficiaryID);
DECLARE @PolicyID INT = (SELECT TOP (1) PolicyID FROM InsurancePolicies ORDER BY PolicyID);

DECLARE @OrganizationID INT = (SELECT TOP (1) OrganizationID FROM PartnerOrganizations ORDER BY OrganizationID);
DECLARE @ActorUserID INT = (SELECT TOP (1) UserID FROM Users WHERE IsActive = 1 ORDER BY UserID);
DECLARE @CredentialID UNIQUEIDENTIFIER = NEWID();
DECLARE @DuplicatePinBlocked BIT = 0;
DECLARE @PinAttemptsBlocked BIT = 0;
DECLARE @DuplicateOtpBlocked BIT = 0;
DECLARE @IncompleteConsumptionBlocked BIT = 0;
DECLARE @InvalidExpiryBlocked BIT = 0;
DECLARE @OtpAfterConsumptionAllowed BIT = 0;

INSERT INTO BeneficiaryCredentials
    (CredentialID, PolicyID, BeneficiaryID, TokenHash, TokenVersion, Status, ExpiresAt)
VALUES
    (@CredentialID, @PolicyID, @BeneficiaryID,
     HASHBYTES('SHA2_256', CONVERT(NVARCHAR(36), NEWID())), 1, N'active',
     DATEADD(DAY, 1, SYSUTCDATETIME()));

INSERT INTO BeneficiaryVerificationPins
    (PinID, BeneficiaryID, PinHash, PinSalt, Status, IsCurrent, ExpiresAt)
VALUES
    (NEWID(), @BeneficiaryID, HASHBYTES('SHA2_512', N'pin-one'), CRYPT_GEN_RANDOM(16),
     N'active', 1, DATEADD(DAY, 30, SYSUTCDATETIME()));

BEGIN TRY
    INSERT INTO BeneficiaryVerificationPins
        (PinID, BeneficiaryID, PinHash, PinSalt, Status, IsCurrent, ExpiresAt)
    VALUES
        (NEWID(), @BeneficiaryID, HASHBYTES('SHA2_512', N'pin-two'), CRYPT_GEN_RANDOM(16),
         N'active', 1, DATEADD(DAY, 30, SYSUTCDATETIME()));
END TRY
BEGIN CATCH
    SET @DuplicatePinBlocked = 1;
END CATCH;

BEGIN TRY
    INSERT INTO BeneficiaryVerificationPins
        (PinID, BeneficiaryID, PinHash, PinSalt, Status, IsCurrent,
         FailedAttemptCount, MaximumAttempts, ExpiresAt)
    VALUES
        (NEWID(), @BeneficiaryID, HASHBYTES('SHA2_512', N'pin-three'), CRYPT_GEN_RANDOM(16),
         N'expired', 0, 6, 5, DATEADD(DAY, 30, SYSUTCDATETIME()));
END TRY
BEGIN CATCH
    SET @PinAttemptsBlocked = 1;
END CATCH;

DECLARE @ChallengeID UNIQUEIDENTIFIER = NEWID();
INSERT INTO BeneficiaryOtpChallenges
    (ChallengeID, CredentialID, BeneficiaryID, OrganizationID, ActorUserID,
     DeliveryChannel, DestinationHash, CodeHash, CodeSalt, Status, ExpiresAt)
VALUES
    (@ChallengeID, @CredentialID, @BeneficiaryID, @OrganizationID, @ActorUserID,
     N'sms', HASHBYTES('SHA2_256', N'destination'), HASHBYTES('SHA2_512', N'otp-one'),
     CRYPT_GEN_RANDOM(16), N'pending', DATEADD(MINUTE, 5, SYSUTCDATETIME()));

BEGIN TRY
    INSERT INTO BeneficiaryOtpChallenges
        (ChallengeID, CredentialID, BeneficiaryID, OrganizationID, ActorUserID,
         DeliveryChannel, DestinationHash, CodeHash, CodeSalt, Status, ExpiresAt)
    VALUES
        (NEWID(), @CredentialID, @BeneficiaryID, @OrganizationID, @ActorUserID,
         N'sms', HASHBYTES('SHA2_256', N'destination'), HASHBYTES('SHA2_512', N'otp-two'),
         CRYPT_GEN_RANDOM(16), N'pending', DATEADD(MINUTE, 5, SYSUTCDATETIME()));
END TRY
BEGIN CATCH
    SET @DuplicateOtpBlocked = 1;
END CATCH;

BEGIN TRY
    INSERT INTO BeneficiaryOtpChallenges
        (ChallengeID, CredentialID, BeneficiaryID, OrganizationID, ActorUserID,
         DeliveryChannel, DestinationHash, CodeHash, CodeSalt, Status, ExpiresAt)
    VALUES
        (NEWID(), @CredentialID, @BeneficiaryID, @OrganizationID, @ActorUserID,
         N'email', HASHBYTES('SHA2_256', N'destination-2'), HASHBYTES('SHA2_512', N'otp-three'),
         CRYPT_GEN_RANDOM(16), N'consumed', DATEADD(MINUTE, 5, SYSUTCDATETIME()));
END TRY
BEGIN CATCH
    SET @IncompleteConsumptionBlocked = 1;
END CATCH;

BEGIN TRY
    INSERT INTO BeneficiaryOtpChallenges
        (ChallengeID, CredentialID, BeneficiaryID, OrganizationID, ActorUserID,
         DeliveryChannel, DestinationHash, CodeHash, CodeSalt, Status, ExpiresAt)
    VALUES
        (NEWID(), @CredentialID, @BeneficiaryID, @OrganizationID, @ActorUserID,
         N'whatsapp', HASHBYTES('SHA2_256', N'destination-3'), HASHBYTES('SHA2_512', N'otp-four'),
         CRYPT_GEN_RANDOM(16), N'expired', DATEADD(MINUTE, -1, SYSUTCDATETIME()));
END TRY
BEGIN CATCH
    SET @InvalidExpiryBlocked = 1;
END CATCH;

UPDATE BeneficiaryOtpChallenges
SET Status = N'consumed', VerifiedAt = SYSUTCDATETIME(),
    ConsumedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
WHERE ChallengeID = @ChallengeID AND Status = N'pending';

BEGIN TRY
    INSERT INTO BeneficiaryOtpChallenges
        (ChallengeID, CredentialID, BeneficiaryID, OrganizationID, ActorUserID,
         DeliveryChannel, DestinationHash, CodeHash, CodeSalt, Status, ExpiresAt)
    VALUES
        (NEWID(), @CredentialID, @BeneficiaryID, @OrganizationID, @ActorUserID,
         N'sms', HASHBYTES('SHA2_256', N'destination'), HASHBYTES('SHA2_512', N'otp-five'),
         CRYPT_GEN_RANDOM(16), N'pending', DATEADD(MINUTE, 5, SYSUTCDATETIME()));
    SET @OtpAfterConsumptionAllowed = 1;
END TRY
BEGIN CATCH
    SET @OtpAfterConsumptionAllowed = 0;
END CATCH;

SELECT @DuplicatePinBlocked AS DuplicatePinBlocked,
       @PinAttemptsBlocked AS PinAttemptsBlocked,
       @DuplicateOtpBlocked AS DuplicateOtpBlocked,
       @IncompleteConsumptionBlocked AS IncompleteConsumptionBlocked,
       @InvalidExpiryBlocked AS InvalidExpiryBlocked,
       @OtpAfterConsumptionAllowed AS OtpAfterConsumptionAllowed;

ROLLBACK TRANSACTION;