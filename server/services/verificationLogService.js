import { createHash, randomUUID } from 'crypto';
import { sql, poolPromise } from '../config/dbConfig.js';

const ACCESS_METHODS = new Set(['named_account', 'emergency_pin', 'esnas_staff', 'system']);
const ASSURANCE_METHODS = new Set(['qr', 'qr_pin', 'qr_otp', 'staff_reauth']);
const DECISIONS = new Set(['allowed', 'denied', 'error']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function optionalPositiveInteger(value, name) {
  if (value == null) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new TypeError(`${name} must be a positive integer.`);
  }
  return parsed;
}

function requiredCatalogValue(value, values, name) {
  const normalized = String(value || '').trim();
  if (!values.has(normalized)) throw new TypeError(`Unsupported ${name}.`);
  return normalized;
}

function optionalText(value, maximumLength, name) {
  if (value == null || value === '') return null;
  const normalized = String(value).trim();
  if (normalized.length > maximumLength) {
    throw new TypeError(`${name} exceeds ${maximumLength} characters.`);
  }
  return normalized || null;
}

function userAgentHash(userAgent) {
  const normalized = optionalText(userAgent, 2048, 'userAgent');
  return normalized ? createHash('sha256').update(normalized, 'utf8').digest() : null;
}

function optionalUuid(value, name) {
  if (value == null || value === '') return null;
  const normalized = String(value).trim();
  if (!UUID_PATTERN.test(normalized)) throw new TypeError(`${name} must be a UUID.`);
  return normalized;
}

function createRequest(transaction, pool) {
  return transaction ? new sql.Request(transaction) : pool.request();
}

export function createVerificationLogService() {
  return {
    async record({
      correlationId = randomUUID(),
      credentialId = null,
      policyId = null,
      beneficiaryId = null,
      actorUserId = null,
      organizationId = null,
      verificationProfileId = null,
      permissionCode,
      accessMethod,
      assuranceMethod,
      decision,
      reasonCode = null,
      ipAddress = null,
      userAgent = null,
      transaction = null,
    }) {
      const normalizedCorrelationId = optionalUuid(correlationId, 'correlationId');
      const normalizedCredentialId = optionalUuid(credentialId, 'credentialId');
      const normalizedPermissionCode = optionalText(permissionCode, 80, 'permissionCode');
      const normalizedAccessMethod = requiredCatalogValue(accessMethod, ACCESS_METHODS, 'accessMethod');
      const normalizedAssuranceMethod = requiredCatalogValue(
        assuranceMethod,
        ASSURANCE_METHODS,
        'assuranceMethod',
      );
      const normalizedDecision = requiredCatalogValue(decision, DECISIONS, 'decision');
      const normalizedActorUserId = optionalPositiveInteger(actorUserId, 'actorUserId');
      const normalizedOrganizationId = optionalPositiveInteger(organizationId, 'organizationId');

      if (!normalizedCorrelationId) throw new TypeError('correlationId is required.');
      if (!normalizedPermissionCode) throw new TypeError('permissionCode is required.');
      if (!normalizedActorUserId && !normalizedOrganizationId && normalizedAccessMethod !== 'system') {
        throw new TypeError('An actorUserId or organizationId is required.');
      }
      if (normalizedAccessMethod === 'emergency_pin' && normalizedPermissionCode !== 'policy.status') {
        throw new TypeError('Emergency PIN access is restricted to policy.status.');
      }

      const pool = transaction ? null : await poolPromise;
      const result = await createRequest(transaction, pool)
        .input('CorrelationID', sql.UniqueIdentifier, normalizedCorrelationId)
        .input('CredentialID', sql.UniqueIdentifier, normalizedCredentialId)
        .input('PolicyID', sql.Int, optionalPositiveInteger(policyId, 'policyId'))
        .input('BeneficiaryID', sql.Int, optionalPositiveInteger(beneficiaryId, 'beneficiaryId'))
        .input('ActorUserID', sql.Int, normalizedActorUserId)
        .input('OrganizationID', sql.Int, normalizedOrganizationId)
        .input(
          'VerificationProfileID',
          sql.Int,
          optionalPositiveInteger(verificationProfileId, 'verificationProfileId'),
        )
        .input('PermissionCode', sql.NVarChar(80), normalizedPermissionCode)
        .input('AccessMethod', sql.NVarChar(30), normalizedAccessMethod)
        .input('AssuranceMethod', sql.NVarChar(30), normalizedAssuranceMethod)
        .input('Decision', sql.NVarChar(20), normalizedDecision)
        .input('ReasonCode', sql.NVarChar(80), optionalText(reasonCode, 80, 'reasonCode'))
        .input('IpAddress', sql.NVarChar(60), optionalText(ipAddress, 60, 'ipAddress'))
        .input('UserAgentHash', sql.VarBinary(32), userAgentHash(userAgent))
        .query(`
          INSERT INTO VerificationLogs (
            CorrelationID, CredentialID, PolicyID, BeneficiaryID, ActorUserID,
            OrganizationID, VerificationProfileID, PermissionCode, AccessMethod,
            AssuranceMethod, Decision, ReasonCode, IpAddress, UserAgentHash
          )
          OUTPUT
            INSERTED.VerificationLogID, INSERTED.CorrelationID, INSERTED.PermissionCode,
            INSERTED.Decision, INSERTED.ReasonCode, INSERTED.CreatedAt
          VALUES (
            @CorrelationID, @CredentialID, @PolicyID, @BeneficiaryID, @ActorUserID,
            @OrganizationID, @VerificationProfileID, @PermissionCode, @AccessMethod,
            @AssuranceMethod, @Decision, @ReasonCode, @IpAddress, @UserAgentHash
          )
        `);

      return result.recordset[0];
    },
  };
}

const verificationLogService = createVerificationLogService();

export default verificationLogService;