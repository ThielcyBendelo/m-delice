import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'crypto';
import { sql, poolPromise } from '../config/dbConfig.js';
import { createOrganizationAccessCodeService } from '../services/organizationAccessCodeService.js';
import { createVerificationOrchestratorService } from '../services/verificationOrchestratorService.js';

const service = createOrganizationAccessCodeService({
  secret: 'smoke-test-organization-code-secret-32-bytes',
});
const pool = await poolPromise;
const transaction = new sql.Transaction(pool);

try {
  await transaction.begin();

  const beneficiaryId = (await new sql.Request(transaction).query(`
    SELECT TOP (1) BeneficiaryID FROM Beneficiaries ORDER BY BeneficiaryID
  `)).recordset[0].BeneficiaryID;
  const policyId = (await new sql.Request(transaction).query(`
    SELECT TOP (1) PolicyID
    FROM InsurancePolicies
    WHERE IsActive = 1
      AND LOWER(Status) = N'active'
      AND StartDate <= SYSUTCDATETIME()
      AND EndDate > SYSUTCDATETIME()
    ORDER BY PolicyID
  `)).recordset[0].PolicyID;

  const adminUserId = (await new sql.Request(transaction).query(`
    INSERT INTO Users (LastName, FirstName, Email, PasswordHash, UserRole)
    OUTPUT INSERTED.UserID
    VALUES (N'Rollback', N'Emergency', CONCAT(N'smoke-3g-', NEWID(), N'@example.invalid'), N'not-a-login', N'Admin')
  `)).recordset[0].UserID;

  const organizationId = (await new sql.Request(transaction).query(`
    INSERT INTO PartnerOrganizations (OrganizationName, OrganizationType, IsActive)
    OUTPUT INSERTED.OrganizationID
    VALUES (N'SMOKE-3G-ROLLBACK', N'hospital', 1)
  `)).recordset[0].OrganizationID;

  await new sql.Request(transaction)
    .input('OrganizationID', sql.Int, organizationId)
    .input('AdminUserID', sql.Int, adminUserId)
    .query(`
      DECLARE @ProfileID INT = (
        SELECT VerificationProfileID FROM VerificationProfiles
        WHERE ProfileCode = N'hospital_verifier'
      );
      INSERT INTO OrganizationVerificationSettings (
        OrganizationID, VerificationProfileID, ApprovalStatus, EmergencyPinAllowed,
        ApprovedByUserID, ApprovedAt
      ) VALUES (
        @OrganizationID, @ProfileID, N'approved', 0, @AdminUserID, SYSUTCDATETIME()
      );
    `);

  await assert.rejects(
    service.rotate(organizationId, { createdByUserId: adminUserId, transaction }),
    /not authorized/,
  );

  await new sql.Request(transaction)
    .input('OrganizationID', sql.Int, organizationId)
    .query(`
      UPDATE OrganizationVerificationSettings
      SET EmergencyPinAllowed = 1, UpdatedAt = SYSUTCDATETIME()
      WHERE OrganizationID = @OrganizationID
    `);

  const firstCode = await service.rotate(organizationId, {
    createdByUserId: adminUserId,
    transaction,
  });
  assert.match(firstCode.code, /^\d{8}$/);
  const wrongCode = firstCode.code === '00000000' ? '99999999' : '00000000';
  for (let attempt = 1; attempt < 5; attempt += 1) {
    const result = await service.verify(organizationId, wrongCode, { transaction });
    assert.equal(result.reasonCode, 'organization_pin_invalid');
  }
  assert.equal(
    (await service.verify(organizationId, wrongCode, { transaction })).reasonCode,
    'organization_pin_locked',
  );
  assert.equal(
    (await service.verify(organizationId, firstCode.code, { transaction })).reasonCode,
    'organization_pin_locked',
  );

  const secondCode = await service.rotate(organizationId, {
    createdByUserId: adminUserId,
    transaction,
  });
  assert.equal((await service.verify(organizationId, secondCode.code, { transaction })).valid, true);

  const credentialId = randomUUID();
  await new sql.Request(transaction)
    .input('CredentialID', sql.UniqueIdentifier, credentialId)
    .input('PolicyID', sql.Int, policyId)
    .input('BeneficiaryID', sql.Int, beneficiaryId)
    .input('TokenHash', sql.Binary(32), randomBytes(32))
    .query(`
      INSERT INTO BeneficiaryCredentials (
        CredentialID, PolicyID, BeneficiaryID, TokenHash, Status, ExpiresAt
      ) VALUES (
        @CredentialID, @PolicyID, @BeneficiaryID, @TokenHash, N'active',
        DATEADD(DAY, 1, SYSUTCDATETIME())
      )
    `);

  const orchestrator = createVerificationOrchestratorService({
    credentialService: {
      async verify() {
        return {
          valid: true,
          credentialId,
          policyId,
          beneficiaryId,
          expiresAt: new Date(Date.now() + 60_000),
        };
      },
    },
    organizationCodeService: service,
  });

  await assert.rejects(
    orchestrator.verifyAccess({
      token: 'validated-by-smoke-adapter',
      organizationId,
      permissionCode: 'beneficiary.identity_masked',
      accessMethod: 'emergency_pin',
      proof: { type: 'organization_pin', code: secondCode.code },
      transaction,
    }),
    /restricted to policy.status/,
  );

  const emergencyAccess = await orchestrator.verifyAccess({
    token: 'validated-by-smoke-adapter',
    organizationId,
    permissionCode: 'policy.status',
    accessMethod: 'emergency_pin',
    proof: { type: 'organization_pin', code: secondCode.code },
    transaction,
  });
  assert.equal(emergencyAccess.allowed, true);

  const codeState = await new sql.Request(transaction)
    .input('AccessCodeID', sql.UniqueIdentifier, secondCode.record.AccessCodeID)
    .query(`
      SELECT UseCount, FailedAttemptCount, LockedUntil
      FROM OrganizationAccessCodes
      WHERE AccessCodeID = @AccessCodeID
    `);
  assert.equal(codeState.recordset[0].UseCount, 2);
  assert.equal(codeState.recordset[0].FailedAttemptCount, 0);
  assert.equal(codeState.recordset[0].LockedUntil, null);

  await transaction.rollback();
  console.log('Organization access code smoke test passed; transaction rolled back.');
} catch (error) {
  try {
    await transaction.rollback();
  } catch {}
  throw error;
} finally {
  await pool.close();
}