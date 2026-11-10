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
import messagingService from './messaging/messagingService.js';
import { normalizePhoneNumber } from './messaging/phoneNumber.js';

const scrypt = promisify(scryptCallback);
const HASH_VERSION = 1;
const CODE_PATTERN = /^\d{6}$/;
const RESEND_COOLDOWN_SECONDS = 60;

function resolveSecret(secret) {
  const value = String(secret || process.env.PHONE_VERIFICATION_SECRET || '');
  if (Buffer.byteLength(value, 'utf8') < 32) {
    throw new Error('PHONE_VERIFICATION_SECRET must contain at least 32 bytes.');
  }
  return value;
}

function code() {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function phoneHash(secret, phone) {
  return createHmac('sha256', secret).update(`phone:${phone}`, 'utf8').digest();
}

async function codeHash(secret, value, salt) {
  return scrypt(`${HASH_VERSION}:phone_verification:${value}:${secret}`, salt, 64);
}

function normalizeCode(value) {
  const normalized = String(value || '').trim();
  if (!CODE_PATTERN.test(normalized)) throw new TypeError('Le code doit contenir 6 chiffres.');
  return normalized;
}

export function createPhoneVerificationService({ secret = null } = {}) {
  const signingSecret = resolveSecret(secret);

  return {
    normalizePhone(value) {
      return normalizePhoneNumber(value, process.env.MESSAGING_DEFAULT_CALLING_CODE || '243');
    },

    async createChallenge(userId, phone, { lifetimeMinutes = 10, maximumAttempts = 5, callingCode = null } = {}) {
      const normalizedPhone = normalizePhoneNumber(phone, callingCode || process.env.MESSAGING_DEFAULT_CALLING_CODE || '243');
      const challengeCode = code();
      const salt = randomBytes(16);
      const challengeId = randomUUID();
      const expiresAt = new Date(Date.now() + lifetimeMinutes * 60 * 1000);
      const pool = await poolPromise;
      const latest = await pool.request()
        .input('UserID', sql.Int, userId)
        .query('SELECT TOP (1) CreatedAt FROM PhoneVerificationChallenges WHERE UserID = @UserID ORDER BY CreatedAt DESC');
      if (latest.recordset[0] && Date.now() - new Date(latest.recordset[0].CreatedAt).getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
        throw new Error('Veuillez attendre avant de renvoyer un code SMS.');
      }

      await pool.request().input('UserID', sql.Int, userId).query(`
        UPDATE PhoneVerificationChallenges
        SET Status = N'cancelled', CancelledAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
        WHERE UserID = @UserID AND Status = N'pending'
      `);
      await pool.request()
        .input('ChallengeID', sql.UniqueIdentifier, challengeId)
        .input('UserID', sql.Int, userId)
        .input('PhoneHash', sql.Binary(32), phoneHash(signingSecret, normalizedPhone))
        .input('CodeHash', sql.VarBinary(64), await codeHash(signingSecret, challengeCode, salt))
        .input('CodeSalt', sql.Binary(16), salt)
        .input('MaximumAttempts', sql.TinyInt, maximumAttempts)
        .input('ExpiresAt', sql.DateTime2, expiresAt)
        .query(`
          INSERT INTO PhoneVerificationChallenges
            (ChallengeID, UserID, PhoneHash, CodeHash, CodeSalt, HashVersion, MaximumAttempts, ExpiresAt)
          VALUES (@ChallengeID, @UserID, @PhoneHash, @CodeHash, @CodeSalt, ${HASH_VERSION}, @MaximumAttempts, @ExpiresAt)
        `);

      const masked = `${normalizedPhone.slice(0, 4)}****${normalizedPhone.slice(-2)}`;
      const message = `ESNAS: votre code de verification est ${challengeCode}. Valable 10 minutes.`;
      const delivery = await messagingService.sendSms({ to: normalizedPhone, body: message });
      return { challengeId, expiresAt, phone: normalizedPhone, maskedPhone: masked, delivery };
    },

    async verifyChallenge(userId, challengeId, value) {
      const normalizedCode = normalizeCode(value);
      const pool = await poolPromise;
      const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .input('ChallengeID', sql.UniqueIdentifier, challengeId)
        .query(`
          SELECT c.*, u.Phone, u.PhoneVerifiedAt
          FROM PhoneVerificationChallenges c WITH (UPDLOCK, HOLDLOCK)
          JOIN Users u WITH (UPDLOCK, HOLDLOCK) ON u.UserID = c.UserID
          WHERE c.ChallengeID = @ChallengeID AND c.UserID = @UserID
        `);
      const challenge = result.recordset[0];
      if (!challenge || challenge.Status !== 'pending' || challenge.PhoneVerifiedAt) return { valid: false, reasonCode: 'phone_verification_invalid' };
      if (new Date(challenge.ExpiresAt) <= new Date()) {
        await pool.request().input('ChallengeID', sql.UniqueIdentifier, challengeId).query("UPDATE PhoneVerificationChallenges SET Status = N'expired', UpdatedAt = SYSUTCDATETIME() WHERE ChallengeID = @ChallengeID AND Status = N'pending'");
        return { valid: false, reasonCode: 'phone_verification_expired' };
      }
      const expected = await codeHash(signingSecret, normalizedCode, challenge.CodeSalt);
      if (!timingSafeEqual(Buffer.from(challenge.CodeHash), expected)) {
        const failures = Number(challenge.FailedAttemptCount) + 1;
        await pool.request().input('ChallengeID', sql.UniqueIdentifier, challengeId).input('Failures', sql.TinyInt, failures).query(`
          UPDATE PhoneVerificationChallenges SET FailedAttemptCount = @Failures,
            Status = CASE WHEN @Failures >= MaximumAttempts THEN N'locked' ELSE N'pending' END,
            UpdatedAt = SYSUTCDATETIME() WHERE ChallengeID = @ChallengeID AND Status = N'pending'
        `);
        return { valid: false, reasonCode: failures >= challenge.MaximumAttempts ? 'phone_verification_locked' : 'phone_verification_invalid' };
      }
      await pool.request().input('ChallengeID', sql.UniqueIdentifier, challengeId).input('UserID', sql.Int, userId).query(`
        UPDATE PhoneVerificationChallenges SET Status = N'consumed', ConsumedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME() WHERE ChallengeID = @ChallengeID AND Status = N'pending';
        UPDATE Users SET PhoneVerifiedAt = SYSUTCDATETIME(), PhoneVerificationSource = N'sms_otp', UpdatedAt = SYSUTCDATETIME() WHERE UserID = @UserID AND PhoneVerifiedAt IS NULL;
      `);
      return { valid: true, reasonCode: 'phone_verified' };
    },
  };
}

let phoneVerificationService;
export function getPhoneVerificationService() {
  if (!phoneVerificationService) phoneVerificationService = createPhoneVerificationService();
  return phoneVerificationService;
}
