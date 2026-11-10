import {
  randomBytes,
  randomInt,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';
import { sql, poolPromise } from '../config/dbConfig.js';

const scrypt = promisify(scryptCallback);
const CODE_PATTERN = /^\d{8}$/;
const MAXIMUM_ATTEMPTS = 5;

function resolveSecret(secret) {
  const value = String(secret || process.env.ORGANIZATION_ACCESS_CODE_SECRET || '');
  if (Buffer.byteLength(value, 'utf8') < 32) {
    throw new Error('ORGANIZATION_ACCESS_CODE_SECRET must contain at least 32 bytes.');
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

function validateCode(code) {
  const normalized = String(code || '').trim();
  if (!CODE_PATTERN.test(normalized)) throw new TypeError('code must contain 8 digits.');
  return normalized;
}

function generatedCode() {
  return randomInt(0, 100_000_000).toString().padStart(8, '0');
}

async function hashCode(secret, code, salt) {
  return scrypt(`1:organization_access:${code}:${secret}`, salt, 32);
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
  return {
    valid,
    reasonCode,
    assuranceMethod: valid ? 'qr_pin' : null,
  };
}

export function createOrganizationAccessCodeService({ secret = null } = {}) {
  const signingSecret = resolveSecret(secret);

  return {
    async rotate(organizationId, {
      createdByUserId,
      lifetimeDays = 30,
      transaction = null,
    }) {
      const normalizedOrganizationId = positiveInteger(organizationId, 'organizationId');
      const normalizedCreatorId = positiveInteger(createdByUserId, 'createdByUserId');
      if (!Number.isInteger(lifetimeDays) || lifetimeDays < 1 || lifetimeDays > 90) {
        throw new TypeError('lifetimeDays must be between 1 and 90.');
      }

      const code = generatedCode();
      const salt = randomBytes(16);
      const codeHash = await hashCode(signingSecret, code, salt);
      const accessCodeId = randomUUID();
      const expiresAt = new Date(Date.now() + lifetimeDays * 24 * 60 * 60 * 1000);

      const record = await withTransaction(transaction, async (activeTransaction) => {
        const authorization = await new sql.Request(activeTransaction)
          .input('OrganizationID', sql.Int, normalizedOrganizationId)
          .input('CreatedByUserID', sql.Int, normalizedCreatorId)
          .query(`
            SELECT organization.OrganizationID
            FROM PartnerOrganizations organization WITH (UPDLOCK, HOLDLOCK)
            JOIN OrganizationVerificationSettings settings
              ON settings.OrganizationID = organization.OrganizationID
             AND settings.ApprovalStatus = N'approved'
             AND settings.EmergencyPinAllowed = 1
            JOIN Users creator
              ON creator.UserID = @CreatedByUserID
             AND creator.IsActive = 1
             AND LOWER(creator.UserRole) = N'admin'
            WHERE organization.OrganizationID = @OrganizationID
              AND organization.IsActive = 1
          `);
        if (!authorization.recordset[0]) {
          throw new Error('Organization emergency access is not authorized.');
        }

        await new sql.Request(activeTransaction)
          .input('OrganizationID', sql.Int, normalizedOrganizationId)
          .query(`
            UPDATE OrganizationAccessCodes
            SET Status = N'revoked', RevokedAt = SYSUTCDATETIME(),
                UpdatedAt = SYSUTCDATETIME()
            WHERE OrganizationID = @OrganizationID AND Status = N'active'
          `);

        const result = await new sql.Request(activeTransaction)
          .input('AccessCodeID', sql.UniqueIdentifier, accessCodeId)
          .input('OrganizationID', sql.Int, normalizedOrganizationId)
          .input('CodeHash', sql.Binary(32), codeHash)
          .input('CodeSalt', sql.Binary(16), salt)
          .input('ExpiresAt', sql.DateTime2, expiresAt)
          .input('CreatedByUserID', sql.Int, normalizedCreatorId)
          .query(`
            INSERT INTO OrganizationAccessCodes (
              AccessCodeID, OrganizationID, CodeHash, CodeSalt, Purpose,
              Status, ExpiresAt, CreatedByUserID
            )
            OUTPUT INSERTED.AccessCodeID, INSERTED.OrganizationID, INSERTED.Purpose,
                   INSERTED.Status, INSERTED.ExpiresAt, INSERTED.CreatedAt
            VALUES (
              @AccessCodeID, @OrganizationID, @CodeHash, @CodeSalt, N'status_only',
              N'active', @ExpiresAt, @CreatedByUserID
            )
          `);
        return result.recordset[0];
      });

      return { code, record };
    },

    async verify(organizationId, code, { lockMinutes = 15, transaction = null } = {}) {
      const normalizedOrganizationId = positiveInteger(organizationId, 'organizationId');
      const normalizedCode = validateCode(code);
      if (!Number.isInteger(lockMinutes) || lockMinutes < 1 || lockMinutes > 1440) {
        throw new TypeError('lockMinutes must be between 1 and 1440.');
      }

      return withTransaction(transaction, async (activeTransaction) => {
        const result = await new sql.Request(activeTransaction)
          .input('OrganizationID', sql.Int, normalizedOrganizationId)
          .query(`
            SELECT accessCode.AccessCodeID, accessCode.CodeHash, accessCode.CodeSalt,
                   accessCode.FailedAttemptCount, accessCode.ExpiresAt,
                   accessCode.LockedUntil
            FROM OrganizationAccessCodes accessCode WITH (UPDLOCK, HOLDLOCK)
            JOIN PartnerOrganizations organization
              ON organization.OrganizationID = accessCode.OrganizationID
             AND organization.IsActive = 1
            JOIN OrganizationVerificationSettings settings
              ON settings.OrganizationID = organization.OrganizationID
             AND settings.ApprovalStatus = N'approved'
             AND settings.EmergencyPinAllowed = 1
            WHERE accessCode.OrganizationID = @OrganizationID
              AND accessCode.Status = N'active'
              AND accessCode.Purpose = N'status_only'
          `);
        const record = result.recordset[0];
        if (!record) return verificationResult(false, 'organization_pin_invalid');

        const now = new Date();
        if (new Date(record.ExpiresAt) <= now) {
          await new sql.Request(activeTransaction)
            .input('AccessCodeID', sql.UniqueIdentifier, record.AccessCodeID)
            .query(`
              UPDATE OrganizationAccessCodes
              SET Status = N'expired', UpdatedAt = SYSUTCDATETIME()
              WHERE AccessCodeID = @AccessCodeID AND Status = N'active'
            `);
          return verificationResult(false, 'organization_pin_expired');
        }
        if (record.LockedUntil && new Date(record.LockedUntil) > now) {
          return verificationResult(false, 'organization_pin_locked');
        }

        const expectedHash = await hashCode(signingSecret, normalizedCode, record.CodeSalt);
        const valid = timingSafeEqual(Buffer.from(record.CodeHash), expectedHash);
        if (!valid) {
          const failedAttemptCount = record.LockedUntil
            ? 1
            : Number(record.FailedAttemptCount) + 1;
          const locked = failedAttemptCount >= MAXIMUM_ATTEMPTS;
          await new sql.Request(activeTransaction)
            .input('AccessCodeID', sql.UniqueIdentifier, record.AccessCodeID)
            .input('FailedAttemptCount', sql.Int, failedAttemptCount)
            .input('LockedUntil', sql.DateTime2, locked
              ? new Date(now.getTime() + lockMinutes * 60 * 1000)
              : null)
            .query(`
              UPDATE OrganizationAccessCodes
              SET FailedAttemptCount = @FailedAttemptCount,
                  LockedUntil = @LockedUntil,
                  UpdatedAt = SYSUTCDATETIME()
              WHERE AccessCodeID = @AccessCodeID AND Status = N'active'
            `);
          return verificationResult(
            false,
            locked ? 'organization_pin_locked' : 'organization_pin_invalid',
          );
        }

        await new sql.Request(activeTransaction)
          .input('AccessCodeID', sql.UniqueIdentifier, record.AccessCodeID)
          .query(`
            UPDATE OrganizationAccessCodes
            SET FailedAttemptCount = 0, LockedUntil = NULL,
                UseCount = UseCount + 1, LastUsedAt = SYSUTCDATETIME(),
                UpdatedAt = SYSUTCDATETIME()
            WHERE AccessCodeID = @AccessCodeID AND Status = N'active'
          `);
        return verificationResult(true, 'organization_pin_verified');
      });
    },
  };
}

let organizationAccessCodeService;

export function getOrganizationAccessCodeService() {
  if (!organizationAccessCodeService) {
    organizationAccessCodeService = createOrganizationAccessCodeService();
  }
  return organizationAccessCodeService;
}