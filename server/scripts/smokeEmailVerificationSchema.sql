SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;

SET NOCOUNT ON;
BEGIN TRANSACTION;

DECLARE @UserID INT;
DECLARE @DuplicatePendingBlocked BIT = 0;
DECLARE @AttemptsBlocked BIT = 0;
DECLARE @InvalidExpiryBlocked BIT = 0;
DECLARE @IncompleteConsumptionBlocked BIT = 0;
DECLARE @IncompleteCancellationBlocked BIT = 0;
DECLARE @VerificationPairBlocked BIT = 0;

INSERT INTO Users (LastName, FirstName, Email, PasswordHash, UserRole, AuthProvider)
VALUES (
    N'Rollback', N'EmailVerification', CONCAT(N'smoke-4a-', NEWID(), N'@example.invalid'),
    N'not-a-login', N'Diaspora', N'local'
);
SET @UserID = SCOPE_IDENTITY();

DECLARE @ChallengeID UNIQUEIDENTIFIER = NEWID();
INSERT INTO EmailVerificationChallenges (
    ChallengeID, UserID, EmailHash, CodeHash, CodeSalt, Status, ExpiresAt
)
VALUES (
    @ChallengeID, @UserID,
    HASHBYTES('SHA2_256', N'email'), HASHBYTES('SHA2_512', N'code'),
    CRYPT_GEN_RANDOM(16), N'pending', DATEADD(MINUTE, 10, SYSUTCDATETIME())
);

BEGIN TRY
    INSERT INTO EmailVerificationChallenges (
        ChallengeID, UserID, EmailHash, CodeHash, CodeSalt, Status, ExpiresAt
    )
    VALUES (
        NEWID(), @UserID,
        HASHBYTES('SHA2_256', N'email'), HASHBYTES('SHA2_512', N'code-two'),
        CRYPT_GEN_RANDOM(16), N'pending', DATEADD(MINUTE, 10, SYSUTCDATETIME())
    );
END TRY
BEGIN CATCH
    SET @DuplicatePendingBlocked = 1;
END CATCH;

BEGIN TRY
    INSERT INTO EmailVerificationChallenges (
        ChallengeID, UserID, EmailHash, CodeHash, CodeSalt, Status,
        FailedAttemptCount, MaximumAttempts, ExpiresAt
    )
    VALUES (
        NEWID(), @UserID,
        HASHBYTES('SHA2_256', N'email'), HASHBYTES('SHA2_512', N'code-three'),
        CRYPT_GEN_RANDOM(16), N'locked', 6, 5, DATEADD(MINUTE, 10, SYSUTCDATETIME())
    );
END TRY
BEGIN CATCH
    SET @AttemptsBlocked = 1;
END CATCH;

BEGIN TRY
    INSERT INTO EmailVerificationChallenges (
        ChallengeID, UserID, EmailHash, CodeHash, CodeSalt, Status, ExpiresAt
    )
    VALUES (
        NEWID(), @UserID,
        HASHBYTES('SHA2_256', N'email'), HASHBYTES('SHA2_512', N'code-four'),
        CRYPT_GEN_RANDOM(16), N'expired', DATEADD(MINUTE, -1, SYSUTCDATETIME())
    );
END TRY
BEGIN CATCH
    SET @InvalidExpiryBlocked = 1;
END CATCH;

BEGIN TRY
    UPDATE EmailVerificationChallenges
    SET Status = N'consumed', UpdatedAt = SYSUTCDATETIME()
    WHERE ChallengeID = @ChallengeID;
END TRY
BEGIN CATCH
    SET @IncompleteConsumptionBlocked = 1;
END CATCH;

BEGIN TRY
    UPDATE EmailVerificationChallenges
    SET Status = N'cancelled', UpdatedAt = SYSUTCDATETIME()
    WHERE ChallengeID = @ChallengeID;
END TRY
BEGIN CATCH
    SET @IncompleteCancellationBlocked = 1;
END CATCH;

BEGIN TRY
    UPDATE Users
    SET EmailVerificationSource = N'local_otp', UpdatedAt = SYSUTCDATETIME()
    WHERE UserID = @UserID;
END TRY
BEGIN CATCH
    SET @VerificationPairBlocked = 1;
END CATCH;

UPDATE EmailVerificationChallenges
SET Status = N'consumed', ConsumedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
WHERE ChallengeID = @ChallengeID;

UPDATE Users
SET EmailVerifiedAt = SYSUTCDATETIME(), EmailVerificationSource = N'local_otp',
    UpdatedAt = SYSUTCDATETIME()
WHERE UserID = @UserID;

SELECT @DuplicatePendingBlocked AS DuplicatePendingBlocked,
       @AttemptsBlocked AS AttemptsBlocked,
       @InvalidExpiryBlocked AS InvalidExpiryBlocked,
       @IncompleteConsumptionBlocked AS IncompleteConsumptionBlocked,
       @IncompleteCancellationBlocked AS IncompleteCancellationBlocked,
       @VerificationPairBlocked AS VerificationPairBlocked,
       CASE WHEN EXISTS (
           SELECT 1 FROM Users
           WHERE UserID = @UserID
             AND EmailVerifiedAt IS NOT NULL
             AND EmailVerificationSource = N'local_otp'
       ) THEN 1 ELSE 0 END AS ValidVerificationAllowed;

ROLLBACK TRANSACTION;