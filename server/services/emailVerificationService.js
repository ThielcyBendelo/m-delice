import {
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';
import { sql, poolPromise } from '../config/dbConfig.js';

const scrypt = promisify(scryptCallback);
const HASH_VERSION = 1;
const CODE_PATTERN = /^\d{6}$/;
const RESEND_COOLDOWN_SECONDS = 60;

function resolveSecret(secret) {
  const value = String(secret || process.env.EMAIL_VERIFICATION_SECRET || '');
  if (Buffer.byteLength(value, 'utf8') < 32) {
    throw new Error('EMAIL_VERIFICATION_SECRET must contain at least 32 bytes.');
  }
  return value;
}

function positiveInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new TypeError(`${name} must be a positive integer.`);
  }
  return parsed;
}

function generatedCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function validateCode(code) {
  const normalized = String(code || '').trim();
  if (!CODE_PATTERN.test(normalized)) throw new TypeError('code must contain 6 digits.');
  return normalized;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashEmail(secret, email) {
  return createHmac('sha256', secret)
    .update(`email:${normalizeEmail(email)}`, 'utf8')
    .digest();
}

async function hashCode(secret, code, salt) {
  return scrypt(`${HASH_VERSION}:email_verification:${code}:${secret}`, salt, 64);
}

async function withTransaction(existingTransaction, action) {
  if (existingTransaction) return action(existingTransaction);

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const result = await action(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

function verificationResult(valid, reasonCode) {
  return { valid, reasonCode };
}

export function createEmailVerificationService({ secret = null } = {}) {
  const signingSecret = resolveSecret(secret);

  return {
    async createChallenge(userId, {
      lifetimeMinutes = 10,
      maximumAttempts = 5,
      transaction = null,
    } = {}) {
      const normalizedUserId = positiveInteger(userId, 'userId');
      if (!Number.isInteger(lifetimeMinutes) || lifetimeMinutes < 5 || lifetimeMinutes > 30) {
        throw new TypeError('lifetimeMinutes must be between 5 and 30.');
      }
      if (!Number.isInteger(maximumAttempts) || maximumAttempts < 3 || maximumAttempts > 10) {
        throw new TypeError('maximumAttempts must be between 3 and 10.');
      }

      const code = generatedCode();
      const salt = randomBytes(16);
      const codeHash = await hashCode(signingSecret, code, salt);
      const challengeId = randomUUID();
      const expiresAt = new Date(Date.now() + lifetimeMinutes * 60 * 1000);

      const challenge = await withTransaction(transaction, async (activeTransaction) => {
        const userResult = await new sql.Request(activeTransaction)
          .input('UserID', sql.Int, normalizedUserId)
          .query(`
            SELECT UserID, Email, AuthProvider, IsActive, EmailVerifiedAt,
                   EmailVerificationSource
            FROM Users WITH (UPDLOCK, HOLDLOCK)
            WHERE UserID = @UserID
          `);
        const user = userResult.recordset[0];
        if (!user || !user.IsActive) throw new Error('Email verification is not authorized.');
        if (String(user.AuthProvider || 'local').toLowerCase() !== 'local') {
          throw new Error('Google accounts are verified by Google ID token.');
        }
        if (user.EmailVerifiedAt) throw new Error('Email is already verified.');

        const latestResult = await new sql.Request(activeTransaction)
          .input('UserID', sql.Int, normalizedUserId)
          .query(`
            SELECT TOP (1) CreatedAt
            FROM EmailVerificationChallenges WITH (UPDLOCK, HOLDLOCK)
            WHERE UserID = @UserID
            ORDER BY CreatedAt DESC
          `);
        const latest = latestResult.recordset[0];
        if (
          latest
          && Date.now() - new Date(latest.CreatedAt).getTime() < RESEND_COOLDOWN_SECONDS * 1000
        ) {
          throw new Error('Email verification resend cooldown is active.');
        }

        await new sql.Request(activeTransaction)
          .input('UserID', sql.Int, normalizedUserId)
          .query(`
            UPDATE EmailVerificationChallenges
            SET Status = N'cancelled', CancelledAt = SYSUTCDATETIME(),
                UpdatedAt = SYSUTCDATETIME()
            WHERE UserID = @UserID AND Status = N'pending'
          `);

        const result = await new sql.Request(activeTransaction)
          .input('ChallengeID', sql.UniqueIdentifier, challengeId)
          .input('UserID', sql.Int, normalizedUserId)
          .input('EmailHash', sql.Binary(32), hashEmail(signingSecret, user.Email))
          .input('CodeHash', sql.VarBinary(64), codeHash)
          .input('CodeSalt', sql.Binary(16), salt)
          .input('MaximumAttempts', sql.TinyInt, maximumAttempts)
          .input('ExpiresAt', sql.DateTime2, expiresAt)
          .query(`
            INSERT INTO EmailVerificationChallenges (
              ChallengeID, UserID, EmailHash, CodeHash, CodeSalt, HashVersion,
              Purpose, Status, MaximumAttempts, ExpiresAt
            )
            OUTPUT INSERTED.ChallengeID, INSERTED.UserID, INSERTED.Status,
                   INSERTED.ExpiresAt, INSERTED.CreatedAt
            VALUES (
              @ChallengeID, @UserID, @EmailHash, @CodeHash, @CodeSalt, ${HASH_VERSION},
              N'email_verification', N'pending', @MaximumAttempts, @ExpiresAt
            )
          `);
        return { ...result.recordset[0], email: normalizeEmail(user.Email) };
      });

      return { code, challenge };
    },

    async verifyChallenge(userId, challengeId, code, { transaction = null } = {}) {
      const normalizedUserId = positiveInteger(userId, 'userId');
      const normalizedCode = validateCode(code);

      return withTransaction(transaction, async (activeTransaction) => {
        const result = await new sql.Request(activeTransaction)
          .input('UserID', sql.Int, normalizedUserId)
          .input('ChallengeID', sql.UniqueIdentifier, challengeId)
          .query(`
            SELECT challenge.ChallengeID, challenge.EmailHash, challenge.CodeHash,
                   challenge.CodeSalt, challenge.HashVersion, challenge.Status,
                   challenge.FailedAttemptCount, challenge.MaximumAttempts,
                   challenge.ExpiresAt, userRow.Email, userRow.AuthProvider,
                   userRow.IsActive, userRow.EmailVerifiedAt
            FROM EmailVerificationChallenges challenge WITH (UPDLOCK, HOLDLOCK)
            JOIN Users userRow WITH (UPDLOCK, HOLDLOCK)
              ON userRow.UserID = challenge.UserID
            WHERE challenge.ChallengeID = @ChallengeID
              AND challenge.UserID = @UserID
          `);
        const challenge = result.recordset[0];
        if (
          !challenge
          || challenge.HashVersion !== HASH_VERSION
          || challenge.Status !== 'pending'
          || !challenge.IsActive
          || String(challenge.AuthProvider || 'local').toLowerCase() !== 'local'
        ) {
          return verificationResult(false, 'email_verification_invalid');
        }
        if (challenge.EmailVerifiedAt) {
          return verificationResult(false, 'email_already_verified');
        }

        if (new Date(challenge.ExpiresAt) <= new Date()) {
          await new sql.Request(activeTransaction)
            .input('ChallengeID', sql.UniqueIdentifier, challenge.ChallengeID)
            .query(`
              UPDATE EmailVerificationChallenges
              SET Status = N'expired', UpdatedAt = SYSUTCDATETIME()
              WHERE ChallengeID = @ChallengeID AND Status = N'pending'
            `);
          return verificationResult(false, 'email_verification_expired');
        }

        const expectedEmailHash = hashEmail(signingSecret, challenge.Email);
        if (!timingSafeEqual(Buffer.from(challenge.EmailHash), expectedEmailHash)) {
          await new sql.Request(activeTransaction)
            .input('ChallengeID', sql.UniqueIdentifier, challenge.ChallengeID)
            .query(`
              UPDATE EmailVerificationChallenges
              SET Status = N'cancelled', CancelledAt = SYSUTCDATETIME(),
                  UpdatedAt = SYSUTCDATETIME()
              WHERE ChallengeID = @ChallengeID AND Status = N'pending'
            `);
          return verificationResult(false, 'email_address_changed');
        }

        const expectedCodeHash = await hashCode(
          signingSecret,
          normalizedCode,
          challenge.CodeSalt,
        );
        const valid = timingSafeEqual(Buffer.from(challenge.CodeHash), expectedCodeHash);
        if (!valid) {
          const failedAttemptCount = Number(challenge.FailedAttemptCount) + 1;
          const locked = failedAttemptCount >= Number(challenge.MaximumAttempts);
          await new sql.Request(activeTransaction)
            .input('ChallengeID', sql.UniqueIdentifier, challenge.ChallengeID)
            .input('FailedAttemptCount', sql.TinyInt, failedAttemptCount)
            .query(`
              UPDATE EmailVerificationChallenges
              SET FailedAttemptCount = @FailedAttemptCount,
                  Status = CASE WHEN @FailedAttemptCount >= MaximumAttempts
                                THEN N'locked' ELSE N'pending' END,
                  UpdatedAt = SYSUTCDATETIME()
              WHERE ChallengeID = @ChallengeID AND Status = N'pending'
            `);
          return verificationResult(
            false,
            locked ? 'email_verification_locked' : 'email_verification_invalid',
          );
        }

        await new sql.Request(activeTransaction)
          .input('ChallengeID', sql.UniqueIdentifier, challenge.ChallengeID)
          .input('UserID', sql.Int, normalizedUserId)
          .query(`
            UPDATE EmailVerificationChallenges
            SET Status = N'consumed', ConsumedAt = SYSUTCDATETIME(),
                UpdatedAt = SYSUTCDATETIME()
            WHERE ChallengeID = @ChallengeID AND Status = N'pending';

            UPDATE Users
            SET EmailVerifiedAt = SYSUTCDATETIME(),
                EmailVerificationSource = N'local_otp',
                UpdatedAt = SYSUTCDATETIME()
            WHERE UserID = @UserID
              AND EmailVerifiedAt IS NULL
              AND LOWER(COALESCE(AuthProvider, N'local')) = N'local';
          `);
        return verificationResult(true, 'email_verified');
      });
    },
  };
}

let emailVerificationService;

export function getEmailVerificationService() {
  if (!emailVerificationService) {
    emailVerificationService = createEmailVerificationService();
  }
  return emailVerificationService;
}