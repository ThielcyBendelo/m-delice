import assert from 'node:assert/strict';
import { sql, poolPromise } from '../config/dbConfig.js';
import verificationPermissionService from '../services/verificationPermissionService.js';
import verificationLogService from '../services/verificationLogService.js';
import { createVerificationOrchestratorService } from '../services/verificationOrchestratorService.js';

const pool = await poolPromise;
const transaction = new sql.Transaction(pool);

try {
  await transaction.begin();

  const userResult = await new sql.Request(transaction).query(`
    INSERT INTO Users (LastName, FirstName, Email, PasswordHash, UserRole)
    OUTPUT INSERTED.UserID
    VALUES (N'Rollback', N'Verifier', CONCAT(N'smoke-3b-', NEWID(), N'@example.invalid'), N'not-a-login', N'Partner')
  `);
  const actorUserId = userResult.recordset[0].UserID;

  const organizationResult = await new sql.Request(transaction).query(`
    INSERT INTO PartnerOrganizations (OrganizationName, OrganizationType, IsActive)
    OUTPUT INSERTED.OrganizationID
    VALUES (N'SMOKE-3B-ROLLBACK', N'hospital', 1)
  `);
  const organizationId = organizationResult.recordset[0].OrganizationID;

  const settingsResult = await new sql.Request(transaction)
    .input('OrganizationID', sql.Int, organizationId)
    .input('ActorUserID', sql.Int, actorUserId)
    .query(`
      DECLARE @ProfileID INT = (
        SELECT VerificationProfileID
        FROM VerificationProfiles
        WHERE ProfileCode = N'hospital_verifier'
      );

      INSERT INTO OrganizationVerificationSettings (
        OrganizationID, VerificationProfileID, ApprovalStatus, ApprovedByUserID, ApprovedAt
      )
      VALUES (@OrganizationID, @ProfileID, N'approved', @ActorUserID, SYSUTCDATETIME());

      INSERT INTO OrganizationMemberships (
        OrganizationID, UserID, ApprovalStatus
      )
      VALUES (@OrganizationID, @ActorUserID, N'suspended');

      SELECT @ProfileID AS VerificationProfileID;
    `);
  const verificationProfileId = settingsResult.recordset[0].VerificationProfileID;

  const baseRequest = {
    organizationId,
    actorUserId,
    accessMethod: 'named_account',
    transaction,
  };

  const suspended = await verificationPermissionService.evaluate({
    ...baseRequest,
    permissionCode: 'policy.status',
    assuranceMethod: 'qr',
  });
  assert.equal(suspended.allowed, false);
  assert.equal(suspended.reasonCode, 'membership_not_approved');

  await new sql.Request(transaction)
    .input('OrganizationID', sql.Int, organizationId)
    .input('ActorUserID', sql.Int, actorUserId)
    .query(`
      UPDATE OrganizationMemberships
      SET ApprovalStatus = N'approved', ApprovedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
      WHERE OrganizationID = @OrganizationID AND UserID = @ActorUserID
    `);

  const statusDecision = await verificationPermissionService.evaluate({
    ...baseRequest,
    permissionCode: 'policy.status',
    assuranceMethod: 'qr',
  });
  assert.equal(statusDecision.allowed, true);
  assert.equal(statusDecision.requiredAssuranceLevel, 1);

  const insufficient = await verificationPermissionService.evaluate({
    ...baseRequest,
    permissionCode: 'service.authorization',
    assuranceMethod: 'qr',
  });
  assert.equal(insufficient.allowed, false);
  assert.equal(insufficient.reasonCode, 'insufficient_assurance');
  assert.equal(insufficient.requiredAssuranceLevel, 2);

  const steppedUp = await verificationPermissionService.evaluate({
    ...baseRequest,
    permissionCode: 'service.authorization',
    assuranceMethod: 'qr_otp',
  });
  assert.equal(steppedUp.allowed, true);

  const log = await verificationLogService.record({
    actorUserId,
    organizationId,
    verificationProfileId,
    permissionCode: 'service.authorization',
    accessMethod: 'named_account',
    assuranceMethod: 'qr_otp',
    decision: 'allowed',
    reasonCode: steppedUp.reasonCode,
    ipAddress: '127.0.0.1',
    userAgent: 'ESNAS verification smoke test',
    transaction,
  });
  assert.equal(log.Decision, 'allowed');

  const hashResult = await new sql.Request(transaction)
    .input('VerificationLogID', sql.UniqueIdentifier, log.VerificationLogID)
    .query(`
      SELECT DATALENGTH(UserAgentHash) AS UserAgentHashLength
      FROM VerificationLogs
      WHERE VerificationLogID = @VerificationLogID
    `);
  assert.equal(hashResult.recordset[0].UserAgentHashLength, 32);

  const orchestrator = createVerificationOrchestratorService({
    credentialService: {
      async verify(token) {
        if (token === 'invalid-smoke-token') return { valid: false, reason: 'invalid' };
        return {
          valid: true,
          credentialId: null,
          policyId: null,
          beneficiaryId: null,
          expiresAt: new Date(Date.now() + 60_000),
        };
      },
    },
    proofService: {
      async verifyPin(beneficiaryId, code, options) {
        assert.equal(beneficiaryId, null);
        assert.equal(options.transaction, transaction);
        return code === '123456'
          ? { valid: true, reasonCode: 'pin_verified', assuranceMethod: 'qr_pin' }
          : { valid: false, reasonCode: 'pin_invalid', assuranceMethod: null };
      },
      async verifyOtp(challengeId, code, options) {
        assert.equal(challengeId, 'a3f77a72-cb7d-4fd8-bf37-1579900acdf9');
        assert.equal(options.organizationId, organizationId);
        assert.equal(options.actorUserId, actorUserId);
        assert.equal(options.transaction, transaction);
        return code === '654321'
          ? { valid: true, reasonCode: 'otp_verified', assuranceMethod: 'qr_otp' }
          : { valid: false, reasonCode: 'otp_invalid', assuranceMethod: null };
      },
    },
  });

  await assert.rejects(
    orchestrator.verifyAccess({
      token: 'valid-smoke-token',
      organizationId,
      actorUserId,
      permissionCode: 'service.authorization',
      accessMethod: 'named_account',
      assuranceMethod: 'qr_otp',
      transaction,
    }),
    /assuranceMethod is derived/,
  );

  const invalidCredential = await orchestrator.verifyAccess({
    token: 'invalid-smoke-token',
    organizationId,
    actorUserId,
    permissionCode: 'policy.status',
    accessMethod: 'named_account',
    transaction,
  });
  assert.equal(invalidCredential.allowed, false);
  assert.equal(invalidCredential.reasonCode, 'credential_invalid');
  assert.equal(Object.hasOwn(invalidCredential, 'policyId'), false);

  const orchestratedDenial = await orchestrator.verifyAccess({
    token: 'valid-smoke-token',
    organizationId,
    actorUserId,
    permissionCode: 'service.authorization',
    accessMethod: 'named_account',
    transaction,
  });
  assert.equal(orchestratedDenial.allowed, false);
  assert.equal(orchestratedDenial.reasonCode, 'insufficient_assurance');
  assert.equal(Object.hasOwn(orchestratedDenial, 'beneficiaryId'), false);

  const malformedProof = await orchestrator.verifyAccess({
    token: 'valid-smoke-token',
    organizationId,
    actorUserId,
    permissionCode: 'service.authorization',
    accessMethod: 'named_account',
    proof: { type: 'otp', challengeId: 'invalid', code: '12' },
    transaction,
  });
  assert.equal(malformedProof.allowed, false);
  assert.equal(malformedProof.reasonCode, 'otp_invalid');

  const invalidPin = await orchestrator.verifyAccess({
    token: 'valid-smoke-token',
    organizationId,
    actorUserId,
    permissionCode: 'service.authorization',
    accessMethod: 'named_account',
    proof: { type: 'pin', code: '000000' },
    transaction,
  });
  assert.equal(invalidPin.allowed, false);
  assert.equal(invalidPin.reasonCode, 'pin_invalid');

  const pinApproval = await orchestrator.verifyAccess({
    token: 'valid-smoke-token',
    organizationId,
    actorUserId,
    permissionCode: 'service.authorization',
    accessMethod: 'named_account',
    proof: { type: 'pin', code: '123456' },
    transaction,
  });
  assert.equal(pinApproval.allowed, true);

  const orchestratedApproval = await orchestrator.verifyAccess({
    token: 'valid-smoke-token',
    organizationId,
    actorUserId,
    permissionCode: 'service.authorization',
    accessMethod: 'named_account',
    proof: {
      type: 'otp',
      challengeId: 'a3f77a72-cb7d-4fd8-bf37-1579900acdf9',
      code: '654321',
    },
    transaction,
  });
  assert.equal(orchestratedApproval.allowed, true);
  assert.equal(orchestratedApproval.reasonCode, 'permission_granted');

  const auditResult = await new sql.Request(transaction)
    .input('OrganizationID', sql.Int, organizationId)
    .query(`
      SELECT Decision, ReasonCode
      FROM VerificationLogs
      WHERE OrganizationID = @OrganizationID
      ORDER BY CreatedAt
    `);
  assert.deepEqual(
    auditResult.recordset.map(({ Decision, ReasonCode }) => [Decision, ReasonCode]),
    [
      ['allowed', 'permission_granted'],
      ['denied', 'credential_invalid'],
      ['denied', 'insufficient_assurance'],
      ['denied', 'otp_invalid'],
      ['denied', 'pin_invalid'],
      ['allowed', 'permission_granted'],
      ['allowed', 'permission_granted'],
    ],
  );

  await transaction.rollback();
  console.log('Verification services smoke test passed; transaction rolled back.');
} catch (error) {
  try {
    await transaction.rollback();
  } catch {}
  throw error;
} finally {
  await pool.close();
}