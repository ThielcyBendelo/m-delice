import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { sql, poolPromise } from '../config/dbConfig.js';

const TOKEN_PREFIX = 'ESNAS-STAFF-1';
const TOKEN_PATTERN = /^ESNAS-STAFF-1\.([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.([A-Za-z0-9_-]{43})$/i;
const STAFF_ROLES = new Set(['admin', 'agent', 'underwriter', 'claims_manager', 'finance']);

function resolveSecret(secret) {
  const value = String(secret || process.env.STAFF_REAUTH_SECRET || '');
  if (Buffer.byteLength(value, 'utf8') < 32) {
    throw new Error('STAFF_REAUTH_SECRET must contain at least 32 bytes.');
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

function requireSessionBinding(value) {
  const normalized = String(value || '').trim();
  if (normalized.length < 16 || normalized.length > 512) {
    throw new TypeError('sessionBinding must contain between 16 and 512 characters.');
  }
  return normalized;
}

function tokenHash(secret, grantId, tokenSecret) {
  return createHmac('sha256', secret)
    .update(`token:${grantId}:${tokenSecret}`, 'utf8')
    .digest();
}

function sessionBindingHash(secret, userId, sessionBinding) {
  return createHmac('sha256', secret)
    .update(`session:${userId}:${sessionBinding}`, 'utf8')
    .digest();
}

function parseToken(token) {
  const match = TOKEN_PATTERN.exec(String(token || '').trim());
  return match ? { grantId: match[1], tokenSecret: match[2] } : null;
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
    assuranceMethod: valid ? 'staff_reauth' : null,
  };
}

export function createStaffReauthenticationService({ secret = null } = {}) {
  const signingSecret = resolveSecret(secret);

  return {
    async issueWithPassword(userId, password, sessionBinding, {
      lifetimeMinutes = 5,
      transaction = null,
    } = {}) {
      const normalizedUserId = positiveInteger(userId, 'userId');
      const normalizedPassword = String(password || '');
      const normalizedSessionBinding = requireSessionBinding(sessionBinding);
      if (!normalizedPassword) throw new TypeError('password is required.');
      if (!Number.isInteger(lifetimeMinutes) || lifetimeMinutes < 1 || lifetimeMinutes > 10) {
        throw new TypeError('lifetimeMinutes must be between 1 and 10.');
      }

      const grantId = randomUUID();
      const tokenSecret = randomBytes(32).toString('base64url');
      const token = `${TOKEN_PREFIX}.${grantId}.${tokenSecret}`;
      const hashedToken = tokenHash(signingSecret, grantId, tokenSecret);
      const hashedSessionBinding = sessionBindingHash(
        signingSecret,
        normalizedUserId,
        normalizedSessionBinding,
      );
      const expiresAt = new Date(Date.now() + lifetimeMinutes * 60 * 1000);

      const grant = await withTransaction(transaction, async (activeTransaction) => {
        const result = await new sql.Request(activeTransaction)
          .input('UserID', sql.Int, normalizedUserId)
          .query(`
            SELECT UserID, PasswordHash, UserRole, AuthProvider, IsActive
            FROM Users WITH (UPDLOCK, HOLDLOCK)
            WHERE UserID = @UserID
          `);
        const user = result.recordset[0];
        if (!user || !user.IsActive || !STAFF_ROLES.has(String(user.UserRole || '').toLowerCase())) {
          throw new Error('Staff reauthentication is not authorized.');
        }
        if (String(user.AuthProvider || 'local').toLowerCase() === 'google') {
          throw new Error('Google staff accounts require a fresh Google ID token.');
        }
        if (!await bcrypt.compare(normalizedPassword, user.PasswordHash || '')) {
          throw new Error('Staff reauthentication failed.');
        }

        await new sql.Request(activeTransaction)
          .input('UserID', sql.Int, normalizedUserId)
          .query(`
            UPDATE StaffReauthenticationGrants
            SET Status = N'revoked', RevokedAt = SYSUTCDATETIME(),
                UpdatedAt = SYSUTCDATETIME()
            WHERE UserID = @UserID AND Status = N'active'
          `);

        const insert = await new sql.Request(activeTransaction)
          .input('GrantID', sql.UniqueIdentifier, grantId)
          .input('UserID', sql.Int, normalizedUserId)
          .input('TokenHash', sql.Binary(32), hashedToken)
          .input('SessionBindingHash', sql.Binary(32), hashedSessionBinding)
          .input('ExpiresAt', sql.DateTime2, expiresAt)
          .query(`
            INSERT INTO StaffReauthenticationGrants (
              GrantID, UserID, TokenHash, SessionBindingHash,
              AuthenticationMethod, Status, ExpiresAt
            )
            OUTPUT INSERTED.GrantID, INSERTED.UserID, INSERTED.AuthenticationMethod,
                   INSERTED.Status, INSERTED.ExpiresAt, INSERTED.CreatedAt
            VALUES (
              @GrantID, @UserID, @TokenHash, @SessionBindingHash,
              N'local_password', N'active', @ExpiresAt
            )
          `);
        return insert.recordset[0];
      });

      return { token, grant };
    },

    async consume(userId, token, sessionBinding, { transaction = null } = {}) {
      const normalizedUserId = positiveInteger(userId, 'userId');
      const normalizedSessionBinding = requireSessionBinding(sessionBinding);
      const parsed = parseToken(token);
      if (!parsed) return verificationResult(false, 'staff_reauth_invalid');

      return withTransaction(transaction, async (activeTransaction) => {
        const result = await new sql.Request(activeTransaction)
          .input('GrantID', sql.UniqueIdentifier, parsed.grantId)
          .input('UserID', sql.Int, normalizedUserId)
          .query(`
            SELECT grantRow.GrantID, grantRow.TokenHash, grantRow.SessionBindingHash,
                   grantRow.Status, grantRow.ExpiresAt
            FROM StaffReauthenticationGrants grantRow WITH (UPDLOCK, HOLDLOCK)
            JOIN Users staff
              ON staff.UserID = grantRow.UserID
             AND staff.IsActive = 1
             AND LOWER(staff.UserRole) IN (
               N'admin', N'agent', N'underwriter', N'claims_manager', N'finance'
             )
            WHERE grantRow.GrantID = @GrantID
              AND grantRow.UserID = @UserID
          `);
        const grant = result.recordset[0];
        if (!grant || grant.Status !== 'active') {
          return verificationResult(false, 'staff_reauth_invalid');
        }

        if (new Date(grant.ExpiresAt) <= new Date()) {
          await new sql.Request(activeTransaction)
            .input('GrantID', sql.UniqueIdentifier, grant.GrantID)
            .query(`
              UPDATE StaffReauthenticationGrants
              SET Status = N'expired', UpdatedAt = SYSUTCDATETIME()
              WHERE GrantID = @GrantID AND Status = N'active'
            `);
          return verificationResult(false, 'staff_reauth_expired');
        }

        const expectedTokenHash = tokenHash(signingSecret, parsed.grantId, parsed.tokenSecret);
        const expectedSessionHash = sessionBindingHash(
          signingSecret,
          normalizedUserId,
          normalizedSessionBinding,
        );
        const tokenValid = timingSafeEqual(Buffer.from(grant.TokenHash), expectedTokenHash);
        const sessionValid = timingSafeEqual(
          Buffer.from(grant.SessionBindingHash),
          expectedSessionHash,
        );
        if (!tokenValid || !sessionValid) {
          return verificationResult(false, 'staff_reauth_invalid');
        }

        await new sql.Request(activeTransaction)
          .input('GrantID', sql.UniqueIdentifier, grant.GrantID)
          .query(`
            UPDATE StaffReauthenticationGrants
            SET Status = N'consumed', ConsumedAt = SYSUTCDATETIME(),
                UpdatedAt = SYSUTCDATETIME()
            WHERE GrantID = @GrantID AND Status = N'active'
          `);
        return verificationResult(true, 'staff_reauth_verified');
      });
    },
  };
}

let staffReauthenticationService;

export function getStaffReauthenticationService() {
  if (!staffReauthenticationService) {
    staffReauthenticationService = createStaffReauthenticationService();
  }
  return staffReauthenticationService;
}