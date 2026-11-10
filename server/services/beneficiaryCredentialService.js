import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import QRCode from 'qrcode';
import { sql, poolPromise } from '../config/dbConfig.js';

const TOKEN_VERSION = 1;
const TOKEN_PREFIX = 'ESNAS1';
const TOKEN_PATTERN = /^ESNAS1\.([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.([A-Za-z0-9_-]{43})$/i;

function resolveSecret(secret) {
  const value = String(secret || process.env.QR_TOKEN_SECRET || '');
  if (Buffer.byteLength(value, 'utf8') < 32) {
    throw new Error('QR_TOKEN_SECRET must contain at least 32 bytes.');
  }
  return value;
}

function hashToken(secret, credentialId, tokenSecret) {
  return createHmac('sha256', secret)
    .update(`${TOKEN_VERSION}:${credentialId}:${tokenSecret}`, 'utf8')
    .digest();
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

function parseToken(token) {
  const match = TOKEN_PATTERN.exec(String(token || '').trim());
  if (!match) return null;
  return { credentialId: match[1], tokenSecret: match[2] };
}

export function createBeneficiaryCredentialService({ secret = null } = {}) {
  return {
    async issue(policyId, { transaction = null } = {}) {
      if (!Number.isInteger(Number(policyId)) || Number(policyId) <= 0) {
        throw new TypeError('A valid policyId is required.');
      }

      const signingSecret = resolveSecret(secret);
      const credentialId = randomUUID();
      const tokenSecret = randomBytes(32).toString('base64url');
      const token = `${TOKEN_PREFIX}.${credentialId}.${tokenSecret}`;
      const tokenHash = hashToken(signingSecret, credentialId, tokenSecret);
      const qrDataUrl = await QRCode.toDataURL(token, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 320,
      });

      const credential = await withTransaction(transaction, async (activeTransaction) => {
        const policyResult = await new sql.Request(activeTransaction)
          .input('PolicyID', sql.Int, Number(policyId))
          .query(`
            SELECT PolicyID, BeneficiaryID, EndDate, IsActive, Status
            FROM InsurancePolicies WITH (UPDLOCK, HOLDLOCK)
            WHERE PolicyID = @PolicyID
          `);
        const policy = policyResult.recordset[0];
        if (!policy || !policy.IsActive || String(policy.Status).toLowerCase() !== 'active') {
          throw new Error('An active policy is required to issue a beneficiary credential.');
        }
        if (new Date(policy.EndDate) <= new Date()) {
          throw new Error('Cannot issue a credential for an expired policy.');
        }

        await new sql.Request(activeTransaction)
          .input('PolicyID', sql.Int, policy.PolicyID)
          .query(`
            UPDATE BeneficiaryCredentials
            SET Status = 'revoked', RevokedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
            WHERE PolicyID = @PolicyID AND Status = 'active'
          `);

        const insertResult = await new sql.Request(activeTransaction)
          .input('CredentialID', sql.UniqueIdentifier, credentialId)
          .input('PolicyID', sql.Int, policy.PolicyID)
          .input('BeneficiaryID', sql.Int, policy.BeneficiaryID)
          .input('TokenHash', sql.VarBinary(32), tokenHash)
          .input('TokenVersion', sql.SmallInt, TOKEN_VERSION)
          .input('ExpiresAt', sql.DateTime2, policy.EndDate)
          .query(`
            INSERT INTO BeneficiaryCredentials
              (CredentialID, PolicyID, BeneficiaryID, TokenHash, TokenVersion, Status, ExpiresAt)
            OUTPUT INSERTED.CredentialID, INSERTED.PolicyID, INSERTED.BeneficiaryID,
                   INSERTED.Status, INSERTED.ExpiresAt, INSERTED.CreatedAt
            VALUES
              (@CredentialID, @PolicyID, @BeneficiaryID, @TokenHash, @TokenVersion, 'active', @ExpiresAt)
          `);

        return insertResult.recordset[0];
      });

      return { credential, token, qrDataUrl };
    },

    async verify(token, { transaction = null } = {}) {
      const parsed = parseToken(token);
      if (!parsed) return { valid: false, reason: 'invalid' };

      const signingSecret = resolveSecret(secret);
      const pool = transaction ? null : await poolPromise;
      const request = transaction ? new sql.Request(transaction) : pool.request();
      const result = await request
        .input('CredentialID', sql.UniqueIdentifier, parsed.credentialId)
        .query(`
          SELECT
            c.CredentialID, c.PolicyID, c.BeneficiaryID, c.TokenHash,
            c.TokenVersion, c.Status, c.ExpiresAt,
            p.PolicyNumber, p.Status AS PolicyStatus, p.IsActive, p.StartDate, p.EndDate
          FROM BeneficiaryCredentials c
          JOIN InsurancePolicies p ON p.PolicyID = c.PolicyID
          WHERE c.CredentialID = @CredentialID
        `);
      const credential = result.recordset[0];
      if (!credential || credential.TokenVersion !== TOKEN_VERSION) {
        return { valid: false, reason: 'invalid' };
      }

      const actualHash = Buffer.from(credential.TokenHash);
      const expectedHash = hashToken(signingSecret, parsed.credentialId, parsed.tokenSecret);
      if (actualHash.length !== expectedHash.length || !timingSafeEqual(actualHash, expectedHash)) {
        return { valid: false, reason: 'invalid' };
      }

      const now = new Date();
      if (
        credential.Status !== 'active'
        || !credential.IsActive
        || String(credential.PolicyStatus).toLowerCase() !== 'active'
        || new Date(credential.ExpiresAt) <= now
        || new Date(credential.EndDate) <= now
        || new Date(credential.StartDate) > now
      ) {
        return { valid: false, reason: 'inactive' };
      }

      const updateRequest = transaction ? new sql.Request(transaction) : pool.request();
      await updateRequest
        .input('CredentialID', sql.UniqueIdentifier, parsed.credentialId)
        .query(`
          UPDATE BeneficiaryCredentials
          SET LastVerifiedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
          WHERE CredentialID = @CredentialID
        `);

      return {
        valid: true,
        credentialId: credential.CredentialID,
        policyId: credential.PolicyID,
        policyNumber: credential.PolicyNumber,
        beneficiaryId: credential.BeneficiaryID,
        expiresAt: credential.ExpiresAt,
      };
    },

    async revoke(credentialId, { transaction = null } = {}) {
      if (!credentialId) throw new TypeError('credentialId is required.');

      return withTransaction(transaction, async (activeTransaction) => {
        const result = await new sql.Request(activeTransaction)
          .input('CredentialID', sql.UniqueIdentifier, credentialId)
          .query(`
            UPDATE BeneficiaryCredentials
            SET Status = 'revoked', RevokedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
            OUTPUT INSERTED.CredentialID, INSERTED.PolicyID, INSERTED.Status, INSERTED.RevokedAt
            WHERE CredentialID = @CredentialID AND Status = 'active'
          `);
        return result.recordset[0] || null;
      });
    },
  };
}

const beneficiaryCredentialService = createBeneficiaryCredentialService();

export default beneficiaryCredentialService;