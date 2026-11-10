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
const DELIVERY_CHANNELS = new Set(['sms', 'whatsapp', 'email']);

function resolveSecret(secret) {
  const value = String(secret || process.env.VERIFICATION_PROOF_SECRET || '');
  if (Buffer.byteLength(value, 'utf8') < 32) {
    throw new Error('VERIFICATION_PROOF_SECRET must contain at least 32 bytes.');
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

function validateCode(code, name) {
  const normalized = String(code || '').trim();
  if (!CODE_PATTERN.test(normalized)) throw new TypeError(`${name} must contain 6 digits.`);
  return normalized;
}

function generatedCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

async function hashCode(secret, kind, code, salt) {
  return scrypt(`${HASH_VERSION}:${kind}:${code}:${secret}`, salt, 64);
}

function hashDestination(secret, destination) {
  const normalized = String(destination || '').trim().toLowerCase();
  if (!normalized) throw new TypeError('destination is required.');
  return createHmac('sha256', secret).update(normalized, 'utf8').digest();
}

function createRequest(transaction, pool) {
  return transaction ? new sql.Request(transaction) : pool.request();
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

function proofResult(valid, reasonCode, assuranceMethod = null) {
  return { valid, reasonCode, assuranceMethod };
}

export function createBeneficiaryVerificationProofService({ secret = null } = {}) {
  const signingSecret = resolveSecret(secret);

  return {
    async rotatePin(beneficiaryId, {
      createdByUserId = null,
      lifetimeDays = 365,
      maximumAttempts = 5,
      transaction = null,
    } = {}) {
      const normalizedBeneficiaryId = positiveInteger(beneficiaryId, 'beneficiaryId');
      const normalizedCreatorId = createdByUserId == null
        ? null
        : positiveInteger(createdByUserId, 'createdByUserId');
      if (!Number.isInteger(lifetimeDays) || lifetimeDays < 1 || lifetimeDays > 730) {
        throw new TypeError('lifetimeDays must be between 1 and 730.');
      }
      if (!Number.isInteger(maximumAttempts) || maximumAttempts < 3 || maximumAttempts > 10) {
        throw new TypeError('maximumAttempts must be between 3 and 10.');
      }

      const pin = generatedCode();
      const salt = randomBytes(16);
      const pinHash = await hashCode(signingSecret, 'pin', pin, salt);
      const pinId = randomUUID();
      const expiresAt = new Date(Date.now() + lifetimeDays * 24 * 60 * 60 * 1000);

      const record = await withTransaction(transaction, async (activeTransaction) => {
        const beneficiary = await new sql.Request(activeTransaction)
          .input('BeneficiaryID', sql.Int, normalizedBeneficiaryId)
          .query(`
            SELECT BeneficiaryID
            FROM Beneficiaries WITH (UPDLOCK, HOLDLOCK)
            WHERE BeneficiaryID = @BeneficiaryID
          `);
        if (!beneficiary.recordset[0]) throw new Error('Beneficiary not found.');

        await new sql.Request(activeTransaction)
          .input('BeneficiaryID', sql.Int, normalizedBeneficiaryId)
          .query(`
            UPDATE BeneficiaryVerificationPins
            SET Status = N'revoked', IsCurrent = 0, RevokedAt = SYSUTCDATETIME(),
                UpdatedAt = SYSUTCDATETIME()
            WHERE BeneficiaryID = @BeneficiaryID AND IsCurrent = 1
          `);

        const result = await new sql.Request(activeTransaction)
          .input('PinID', sql.UniqueIdentifier, pinId)
          .input('BeneficiaryID', sql.Int, normalizedBeneficiaryId)
          .input('PinHash', sql.VarBinary(64), pinHash)
          .input('PinSalt', sql.Binary(16), salt)
          .input('MaximumAttempts', sql.TinyInt, maximumAttempts)
          .input('ExpiresAt', sql.DateTime2, expiresAt)
          .input('CreatedByUserID', sql.Int, normalizedCreatorId)
          .query(`
            INSERT INTO BeneficiaryVerificationPins (
              PinID, BeneficiaryID, PinHash, PinSalt, HashVersion, Status, IsCurrent,
              MaximumAttempts, ExpiresAt, CreatedByUserID
            )
            OUTPUT INSERTED.PinID, INSERTED.BeneficiaryID, INSERTED.Status,
                   INSERTED.ExpiresAt, INSERTED.CreatedAt
            VALUES (
              @PinID, @BeneficiaryID, @PinHash, @PinSalt, ${HASH_VERSION}, N'active', 1,
              @MaximumAttempts, @ExpiresAt, @CreatedByUserID
            )
          `);
        return result.recordset[0];
      });

      return { pin, record };
    },

    async verifyPin(beneficiaryId, pin, { lockMinutes = 15, transaction = null } = {}) {
      const normalizedBeneficiaryId = positiveInteger(beneficiaryId, 'beneficiaryId');
      const normalizedPin = validateCode(pin, 'pin');
      if (!Number.isInteger(lockMinutes) || lockMinutes < 1 || lockMinutes > 1440) {
        throw new TypeError('lockMinutes must be between 1 and 1440.');
      }

      return withTransaction(transaction, async (activeTransaction) => {
        const result = await new sql.Request(activeTransaction)
          .input('BeneficiaryID', sql.Int, normalizedBeneficiaryId)
          .query(`
            SELECT PinID, PinHash, PinSalt, HashVersion, Status, FailedAttemptCount,
                   MaximumAttempts, ExpiresAt, LockedUntil
            FROM BeneficiaryVerificationPins WITH (UPDLOCK, HOLDLOCK)
            WHERE BeneficiaryID = @BeneficiaryID AND IsCurrent = 1
          `);
        const record = result.recordset[0];
        if (!record || record.HashVersion !== HASH_VERSION) {
          return proofResult(false, 'pin_invalid');
        }

        const now = new Date();
        if (new Date(record.ExpiresAt) <= now) {
          await new sql.Request(activeTransaction)
            .input('PinID', sql.UniqueIdentifier, record.PinID)
            .query(`
              UPDATE BeneficiaryVerificationPins
              SET Status = N'expired', IsCurrent = 0, UpdatedAt = SYSUTCDATETIME()
              WHERE PinID = @PinID
            `);
          return proofResult(false, 'pin_expired');
        }
        if (record.Status === 'locked' && new Date(record.LockedUntil) > now) {
          return proofResult(false, 'pin_locked');
        }
        if (!['active', 'locked'].includes(record.Status)) {
          return proofResult(false, 'pin_invalid');
        }

        const expectedHash = await hashCode(signingSecret, 'pin', normalizedPin, record.PinSalt);
        const valid = timingSafeEqual(Buffer.from(record.PinHash), expectedHash);
        if (!valid) {
          const failedAttemptCount = record.Status === 'locked'
            ? 1
            : Number(record.FailedAttemptCount) + 1;
          const locked = failedAttemptCount >= Number(record.MaximumAttempts);
          await new sql.Request(activeTransaction)
            .input('PinID', sql.UniqueIdentifier, record.PinID)
            .input('FailedAttemptCount', sql.TinyInt, failedAttemptCount)
            .input('LockedUntil', sql.DateTime2, locked
              ? new Date(now.getTime() + lockMinutes * 60 * 1000)
              : null)
            .query(`
              UPDATE BeneficiaryVerificationPins
              SET FailedAttemptCount = @FailedAttemptCount,
                  Status = CASE WHEN @LockedUntil IS NULL THEN N'active' ELSE N'locked' END,
                  LockedUntil = @LockedUntil,
                  UpdatedAt = SYSUTCDATETIME()
              WHERE PinID = @PinID
            `);
          return proofResult(false, locked ? 'pin_locked' : 'pin_invalid');
        }

        await new sql.Request(activeTransaction)
          .input('PinID', sql.UniqueIdentifier, record.PinID)
          .query(`
            UPDATE BeneficiaryVerificationPins
            SET Status = N'active', FailedAttemptCount = 0, LockedUntil = NULL,
                LastUsedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
            WHERE PinID = @PinID
          `);
        return proofResult(true, 'pin_verified', 'qr_pin');
      });
    },

    async createOtp({
      credentialId,
      beneficiaryId,
      organizationId,
      actorUserId,
      deliveryChannel,
      destination,
      lifetimeMinutes = 5,
      maximumAttempts = 5,
      transaction = null,
    }) {
      const normalizedBeneficiaryId = positiveInteger(beneficiaryId, 'beneficiaryId');
      const normalizedOrganizationId = positiveInteger(organizationId, 'organizationId');
      const normalizedActorUserId = positiveInteger(actorUserId, 'actorUserId');
      const normalizedChannel = String(deliveryChannel || '').trim();
      if (!DELIVERY_CHANNELS.has(normalizedChannel)) {
        throw new TypeError('Unsupported deliveryChannel.');
      }
      if (!Number.isInteger(lifetimeMinutes) || lifetimeMinutes < 1 || lifetimeMinutes > 10) {
        throw new TypeError('lifetimeMinutes must be between 1 and 10.');
      }
      if (!Number.isInteger(maximumAttempts) || maximumAttempts < 3 || maximumAttempts > 10) {
        throw new TypeError('maximumAttempts must be between 3 and 10.');
      }

      const code = generatedCode();
      const salt = randomBytes(16);
      const codeHash = await hashCode(signingSecret, 'otp', code, salt);
      const destinationHash = hashDestination(signingSecret, destination);
      const challengeId = randomUUID();
      const expiresAt = new Date(Date.now() + lifetimeMinutes * 60 * 1000);

      const challenge = await withTransaction(transaction, async (activeTransaction) => {
        const context = await new sql.Request(activeTransaction)
          .input('CredentialID', sql.UniqueIdentifier, credentialId)
          .input('BeneficiaryID', sql.Int, normalizedBeneficiaryId)
          .input('OrganizationID', sql.Int, normalizedOrganizationId)
          .input('ActorUserID', sql.Int, normalizedActorUserId)
          .query(`
            SELECT credential.CredentialID
            FROM BeneficiaryCredentials credential WITH (UPDLOCK, HOLDLOCK)
            JOIN InsurancePolicies policy
              ON policy.PolicyID = credential.PolicyID
             AND policy.IsActive = 1
             AND LOWER(policy.Status) = N'active'
             AND policy.StartDate <= SYSUTCDATETIME()
             AND policy.EndDate > SYSUTCDATETIME()
            JOIN PartnerOrganizations organization
              ON organization.OrganizationID = @OrganizationID AND organization.IsActive = 1
            JOIN OrganizationVerificationSettings settings
              ON settings.OrganizationID = organization.OrganizationID
             AND settings.ApprovalStatus = N'approved'
            JOIN OrganizationMemberships membership
              ON membership.OrganizationID = organization.OrganizationID
             AND membership.UserID = @ActorUserID
             AND membership.ApprovalStatus = N'approved'
            JOIN Users actor ON actor.UserID = membership.UserID AND actor.IsActive = 1
            WHERE credential.CredentialID = @CredentialID
              AND credential.BeneficiaryID = @BeneficiaryID
              AND credential.Status = N'active'
              AND credential.ExpiresAt > SYSUTCDATETIME()
          `);
        if (!context.recordset[0]) throw new Error('OTP context is not authorized.');

        await new sql.Request(activeTransaction)
          .input('CredentialID', sql.UniqueIdentifier, credentialId)
          .input('OrganizationID', sql.Int, normalizedOrganizationId)
          .query(`
            UPDATE BeneficiaryOtpChallenges
            SET Status = N'cancelled', UpdatedAt = SYSUTCDATETIME()
            WHERE CredentialID = @CredentialID
              AND OrganizationID = @OrganizationID
              AND Purpose = N'verification_step_up'
              AND Status = N'pending'
          `);

        const result = await new sql.Request(activeTransaction)
          .input('ChallengeID', sql.UniqueIdentifier, challengeId)
          .input('CredentialID', sql.UniqueIdentifier, credentialId)
          .input('BeneficiaryID', sql.Int, normalizedBeneficiaryId)
          .input('OrganizationID', sql.Int, normalizedOrganizationId)
          .input('ActorUserID', sql.Int, normalizedActorUserId)
          .input('DeliveryChannel', sql.NVarChar(20), normalizedChannel)
          .input('DestinationHash', sql.Binary(32), destinationHash)
          .input('CodeHash', sql.VarBinary(64), codeHash)
          .input('CodeSalt', sql.Binary(16), salt)
          .input('MaximumAttempts', sql.TinyInt, maximumAttempts)
          .input('ExpiresAt', sql.DateTime2, expiresAt)
          .query(`
            INSERT INTO BeneficiaryOtpChallenges (
              ChallengeID, CredentialID, BeneficiaryID, OrganizationID, ActorUserID,
              DeliveryChannel, DestinationHash, CodeHash, CodeSalt, HashVersion,
              MaximumAttempts, ExpiresAt
            )
            OUTPUT INSERTED.ChallengeID, INSERTED.CredentialID, INSERTED.BeneficiaryID,
                   INSERTED.OrganizationID, INSERTED.ActorUserID, INSERTED.DeliveryChannel,
                   INSERTED.Status, INSERTED.ExpiresAt, INSERTED.CreatedAt
            VALUES (
              @ChallengeID, @CredentialID, @BeneficiaryID, @OrganizationID, @ActorUserID,
              @DeliveryChannel, @DestinationHash, @CodeHash, @CodeSalt, ${HASH_VERSION},
              @MaximumAttempts, @ExpiresAt
            )
          `);
        return result.recordset[0];
      });

      return { code, challenge };
    },

    async verifyOtp(challengeId, code, {
      credentialId,
      beneficiaryId,
      organizationId,
      actorUserId,
      transaction = null,
    }) {
      const normalizedCode = validateCode(code, 'code');
      const normalizedBeneficiaryId = positiveInteger(beneficiaryId, 'beneficiaryId');
      const normalizedOrganizationId = positiveInteger(organizationId, 'organizationId');
      const normalizedActorUserId = positiveInteger(actorUserId, 'actorUserId');

      return withTransaction(transaction, async (activeTransaction) => {
        const result = await new sql.Request(activeTransaction)
          .input('ChallengeID', sql.UniqueIdentifier, challengeId)
          .input('CredentialID', sql.UniqueIdentifier, credentialId)
          .input('BeneficiaryID', sql.Int, normalizedBeneficiaryId)
          .input('OrganizationID', sql.Int, normalizedOrganizationId)
          .input('ActorUserID', sql.Int, normalizedActorUserId)
          .query(`
            SELECT ChallengeID, CodeHash, CodeSalt, HashVersion, Status,
                   FailedAttemptCount, MaximumAttempts, ExpiresAt
            FROM BeneficiaryOtpChallenges WITH (UPDLOCK, HOLDLOCK)
            WHERE ChallengeID = @ChallengeID
              AND CredentialID = @CredentialID
              AND BeneficiaryID = @BeneficiaryID
              AND OrganizationID = @OrganizationID
              AND ActorUserID = @ActorUserID
          `);
        const challenge = result.recordset[0];
        if (!challenge || challenge.HashVersion !== HASH_VERSION || challenge.Status !== 'pending') {
          return proofResult(false, 'otp_invalid');
        }

        if (new Date(challenge.ExpiresAt) <= new Date()) {
          await new sql.Request(activeTransaction)
            .input('ChallengeID', sql.UniqueIdentifier, challenge.ChallengeID)
            .query(`
              UPDATE BeneficiaryOtpChallenges
              SET Status = N'expired', UpdatedAt = SYSUTCDATETIME()
              WHERE ChallengeID = @ChallengeID AND Status = N'pending'
            `);
          return proofResult(false, 'otp_expired');
        }

        const expectedHash = await hashCode(signingSecret, 'otp', normalizedCode, challenge.CodeSalt);
        const valid = timingSafeEqual(Buffer.from(challenge.CodeHash), expectedHash);
        if (!valid) {
          const failedAttemptCount = Number(challenge.FailedAttemptCount) + 1;
          const locked = failedAttemptCount >= Number(challenge.MaximumAttempts);
          await new sql.Request(activeTransaction)
            .input('ChallengeID', sql.UniqueIdentifier, challenge.ChallengeID)
            .input('FailedAttemptCount', sql.TinyInt, failedAttemptCount)
            .query(`
              UPDATE BeneficiaryOtpChallenges
              SET FailedAttemptCount = @FailedAttemptCount,
                  Status = CASE WHEN @FailedAttemptCount >= MaximumAttempts
                                THEN N'locked' ELSE N'pending' END,
                  UpdatedAt = SYSUTCDATETIME()
              WHERE ChallengeID = @ChallengeID AND Status = N'pending'
            `);
          return proofResult(false, locked ? 'otp_locked' : 'otp_invalid');
        }

        await new sql.Request(activeTransaction)
          .input('ChallengeID', sql.UniqueIdentifier, challenge.ChallengeID)
          .query(`
            UPDATE BeneficiaryOtpChallenges
            SET Status = N'consumed', VerifiedAt = SYSUTCDATETIME(),
                ConsumedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
            WHERE ChallengeID = @ChallengeID AND Status = N'pending'
          `);
        return proofResult(true, 'otp_verified', 'qr_otp');
      });
    },
  };
}

let beneficiaryVerificationProofService;

export function getBeneficiaryVerificationProofService() {
  if (!beneficiaryVerificationProofService) {
    beneficiaryVerificationProofService = createBeneficiaryVerificationProofService();
  }
  return beneficiaryVerificationProofService;
}