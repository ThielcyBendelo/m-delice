import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { sql, poolPromise } from '../config/dbConfig.js';
import { createStaffReauthenticationService } from '../services/staffReauthenticationService.js';
import { createVerificationOrchestratorService } from '../services/verificationOrchestratorService.js';

const password = 'Smoke-3H-password';
const sessionBinding = 'smoke-3h-session-binding-value';
const service = createStaffReauthenticationService({
  secret: 'smoke-test-staff-reauth-secret-32-bytes-minimum',
});
const pool = await poolPromise;
const transaction = new sql.Transaction(pool);

try {
  await transaction.begin();

  const passwordHash = await bcrypt.hash(password, 4);
  const actorUserId = (await new sql.Request(transaction)
    .input('PasswordHash', sql.NVarChar(255), passwordHash)
    .query(`
      INSERT INTO Users (
        LastName, FirstName, Email, PasswordHash, UserRole, AuthProvider
      )
      OUTPUT INSERTED.UserID
      VALUES (
        N'Rollback', N'StaffReal', CONCAT(N'smoke-3h-real-', NEWID(), N'@example.invalid'),
        @PasswordHash, N'Agent', N'local'
      )
    `)).recordset[0].UserID;

  const organizationId = (await new sql.Request(transaction).query(`
    INSERT INTO PartnerOrganizations (OrganizationName, OrganizationType, IsActive)
    OUTPUT INSERTED.OrganizationID
    VALUES (N'SMOKE-3H-REAL-ROLLBACK', N'admin', 1)
  `)).recordset[0].OrganizationID;

  await new sql.Request(transaction)
    .input('OrganizationID', sql.Int, organizationId)
    .input('ActorUserID', sql.Int, actorUserId)
    .query(`
      DECLARE @ProfileID INT = (
        SELECT VerificationProfileID FROM VerificationProfiles
        WHERE ProfileCode = N'esnas_agent'
      );
      INSERT INTO OrganizationVerificationSettings (
        OrganizationID, VerificationProfileID, ApprovalStatus, ApprovedByUserID, ApprovedAt
      ) VALUES (
        @OrganizationID, @ProfileID, N'approved', @ActorUserID, SYSUTCDATETIME()
      );
      INSERT INTO OrganizationMemberships (
        OrganizationID, UserID, ApprovalStatus, ApprovedByUserID, ApprovedAt
      ) VALUES (
        @OrganizationID, @ActorUserID, N'approved', @ActorUserID, SYSUTCDATETIME()
      );
    `);

  await assert.rejects(
    service.issueWithPassword(actorUserId, 'wrong-password', sessionBinding, { transaction }),
    /reauthentication failed/,
  );

  const firstGrant = await service.issueWithPassword(actorUserId, password, sessionBinding, {
    transaction,
  });
  assert.match(firstGrant.token, /^ESNAS-STAFF-1\./);

  const wrongSession = await service.consume(
    actorUserId,
    firstGrant.token,
    'different-session-binding-value',
    { transaction },
  );
  assert.equal(wrongSession.valid, false);
  assert.equal(wrongSession.reasonCode, 'staff_reauth_invalid');

  const consumed = await service.consume(actorUserId, firstGrant.token, sessionBinding, {
    transaction,
  });
  assert.equal(consumed.valid, true);
  assert.equal(consumed.assuranceMethod, 'staff_reauth');

  const replay = await service.consume(actorUserId, firstGrant.token, sessionBinding, {
    transaction,
  });
  assert.equal(replay.valid, false);

  const revokedGrant = await service.issueWithPassword(actorUserId, password, sessionBinding, {
    transaction,
  });
  const activeGrant = await service.issueWithPassword(actorUserId, password, sessionBinding, {
    transaction,
  });
  assert.equal(
    (await service.consume(actorUserId, revokedGrant.token, sessionBinding, { transaction })).valid,
    false,
  );

  const orchestrator = createVerificationOrchestratorService({
    credentialService: {
      async verify() {
        return {
          valid: true,
          credentialId: null,
          policyId: null,
          beneficiaryId: null,
          expiresAt: new Date(Date.now() + 60_000),
        };
      },
    },
    staffReauthenticationService: service,
  });
  const access = await orchestrator.verifyAccess({
    token: 'validated-by-smoke-adapter',
    organizationId,
    actorUserId,
    permissionCode: 'beneficiary.identity_full',
    accessMethod: 'esnas_staff',
    proof: {
      type: 'staff_reauth',
      token: activeGrant.token,
      sessionBinding,
    },
    transaction,
  });
  assert.equal(access.allowed, true);

  const grantState = await new sql.Request(transaction)
    .input('GrantID', sql.UniqueIdentifier, activeGrant.grant.GrantID)
    .query(`
      SELECT Status, ConsumedAt
      FROM StaffReauthenticationGrants
      WHERE GrantID = @GrantID
    `);
  assert.equal(grantState.recordset[0].Status, 'consumed');
  assert.ok(grantState.recordset[0].ConsumedAt);

  await transaction.rollback();
  console.log('Staff reauthentication service smoke test passed; transaction rolled back.');
} catch (error) {
  try {
    await transaction.rollback();
  } catch {}
  throw error;
} finally {
  await pool.close();
}