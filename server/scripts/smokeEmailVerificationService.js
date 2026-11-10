import assert from 'node:assert/strict';
import { sql, poolPromise } from '../config/dbConfig.js';
import { createEmailVerificationService } from '../services/emailVerificationService.js';

const service = createEmailVerificationService({
  secret: 'smoke-test-email-verification-secret-32-bytes',
});
const pool = await poolPromise;
const transaction = new sql.Transaction(pool);

try {
  await transaction.begin();

  const userId = (await new sql.Request(transaction).query(`
    INSERT INTO Users (
      LastName, FirstName, Email, PasswordHash, UserRole, AuthProvider
    )
    OUTPUT INSERTED.UserID
    VALUES (
      N'Rollback', N'EmailService', CONCAT(N'smoke-4b-', NEWID(), N'@example.invalid'),
      N'not-a-login', N'Diaspora', N'local'
    )
  `)).recordset[0].UserID;

  const googleUserId = (await new sql.Request(transaction).query(`
    INSERT INTO Users (
      LastName, FirstName, Email, PasswordHash, UserRole, AuthProvider, GoogleSub
    )
    OUTPUT INSERTED.UserID
    VALUES (
      N'Rollback', N'GoogleService', CONCAT(N'smoke-4b-google-', NEWID(), N'@example.invalid'),
      N'not-a-login', N'Diaspora', N'google', CONVERT(NVARCHAR(100), NEWID())
    )
  `)).recordset[0].UserID;

  await assert.rejects(
    service.createChallenge(googleUserId, { transaction }),
    /verified by Google ID token/,
  );

  const first = await service.createChallenge(userId, { transaction });
  assert.match(first.code, /^\d{6}$/);
  assert.match(first.challenge.email, /@example\.invalid$/);
  await assert.rejects(
    service.createChallenge(userId, { transaction }),
    /resend cooldown/,
  );

  await new sql.Request(transaction)
    .input('UserID', sql.Int, userId)
    .query(`
      UPDATE EmailVerificationChallenges
      SET CreatedAt = DATEADD(SECOND, -61, SYSUTCDATETIME())
      WHERE UserID = @UserID
    `);
  const second = await service.createChallenge(userId, { transaction });

  const firstState = await new sql.Request(transaction)
    .input('ChallengeID', sql.UniqueIdentifier, first.challenge.ChallengeID)
    .query(`
      SELECT Status, CancelledAt
      FROM EmailVerificationChallenges
      WHERE ChallengeID = @ChallengeID
    `);
  assert.equal(firstState.recordset[0].Status, 'cancelled');
  assert.ok(firstState.recordset[0].CancelledAt);

  await new sql.Request(transaction)
    .input('UserID', sql.Int, userId)
    .query(`
      UPDATE Users
      SET Email = CONCAT(N'changed-', NEWID(), N'@example.invalid'),
          UpdatedAt = SYSUTCDATETIME()
      WHERE UserID = @UserID
    `);
  const changedAddress = await service.verifyChallenge(
    userId,
    second.challenge.ChallengeID,
    second.code,
    { transaction },
  );
  assert.equal(changedAddress.valid, false);
  assert.equal(changedAddress.reasonCode, 'email_address_changed');

  await new sql.Request(transaction)
    .input('UserID', sql.Int, userId)
    .query(`
      UPDATE EmailVerificationChallenges
      SET CreatedAt = DATEADD(SECOND, -61, SYSUTCDATETIME())
      WHERE UserID = @UserID
    `);
  const locked = await service.createChallenge(userId, {
    maximumAttempts: 3,
    transaction,
  });
  const wrongCode = locked.code === '000000' ? '999999' : '000000';
  assert.equal((await service.verifyChallenge(
    userId,
    locked.challenge.ChallengeID,
    wrongCode,
    { transaction },
  )).reasonCode, 'email_verification_invalid');
  assert.equal((await service.verifyChallenge(
    userId,
    locked.challenge.ChallengeID,
    wrongCode,
    { transaction },
  )).reasonCode, 'email_verification_invalid');
  assert.equal((await service.verifyChallenge(
    userId,
    locked.challenge.ChallengeID,
    wrongCode,
    { transaction },
  )).reasonCode, 'email_verification_locked');
  assert.equal((await service.verifyChallenge(
    userId,
    locked.challenge.ChallengeID,
    locked.code,
    { transaction },
  )).valid, false);

  await new sql.Request(transaction)
    .input('UserID', sql.Int, userId)
    .query(`
      UPDATE EmailVerificationChallenges
      SET CreatedAt = DATEADD(SECOND, -61, SYSUTCDATETIME())
      WHERE UserID = @UserID
    `);
  const valid = await service.createChallenge(userId, { transaction });
  const verified = await service.verifyChallenge(
    userId,
    valid.challenge.ChallengeID,
    valid.code,
    { transaction },
  );
  assert.equal(verified.valid, true);
  assert.equal(verified.reasonCode, 'email_verified');

  const replay = await service.verifyChallenge(
    userId,
    valid.challenge.ChallengeID,
    valid.code,
    { transaction },
  );
  assert.equal(replay.valid, false);

  const userState = await new sql.Request(transaction)
    .input('UserID', sql.Int, userId)
    .query(`
      SELECT EmailVerifiedAt, EmailVerificationSource
      FROM Users
      WHERE UserID = @UserID
    `);
  assert.ok(userState.recordset[0].EmailVerifiedAt);
  assert.equal(userState.recordset[0].EmailVerificationSource, 'local_otp');

  await assert.rejects(
    service.createChallenge(userId, { transaction }),
    /already verified/,
  );

  await transaction.rollback();
  console.log('Email verification service smoke test passed; transaction rolled back.');
} catch (error) {
  try {
    await transaction.rollback();
  } catch {}
  throw error;
} finally {
  await pool.close();
}