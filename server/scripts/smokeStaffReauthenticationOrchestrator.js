import assert from 'node:assert/strict';
import { sql, poolPromise } from '../config/dbConfig.js';
import { createVerificationOrchestratorService } from '../services/verificationOrchestratorService.js';

const pool = await poolPromise;
const transaction = new sql.Transaction(pool);

try {
  await transaction.begin();

  const actorUserId = (await new sql.Request(transaction).query(`
    INSERT INTO Users (LastName, FirstName, Email, PasswordHash, UserRole)
    OUTPUT INSERTED.UserID
    VALUES (N'Rollback', N'Staff', CONCAT(N'smoke-3h-', NEWID(), N'@example.invalid'), N'not-a-login', N'Agent')
  `)).recordset[0].UserID;

  const organizationId = (await new sql.Request(transaction).query(`
    INSERT INTO PartnerOrganizations (OrganizationName, OrganizationType, IsActive)
    OUTPUT INSERTED.OrganizationID
    VALUES (N'SMOKE-3H-ROLLBACK', N'admin', 1)
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

  let grantConsumed = false;
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
    staffReauthenticationService: {
      async consume(userId, token, sessionBinding, options) {
        assert.equal(userId, actorUserId);
        assert.equal(token, 'smoke-grant-token');
        assert.equal(sessionBinding, 'smoke-session-binding-value');
        assert.equal(options.transaction, transaction);
        if (grantConsumed) {
          return { valid: false, reasonCode: 'staff_reauth_invalid', assuranceMethod: null };
        }
        grantConsumed = true;
        return {
          valid: true,
          reasonCode: 'staff_reauth_verified',
          assuranceMethod: 'staff_reauth',
        };
      },
    },
  });

  const request = {
    token: 'validated-by-smoke-adapter',
    organizationId,
    actorUserId,
    permissionCode: 'beneficiary.identity_full',
    accessMethod: 'esnas_staff',
    transaction,
  };

  const withoutGrant = await orchestrator.verifyAccess(request);
  assert.equal(withoutGrant.allowed, false);
  assert.equal(withoutGrant.reasonCode, 'staff_reauthentication_required');

  const proof = {
    type: 'staff_reauth',
    token: 'smoke-grant-token',
    sessionBinding: 'smoke-session-binding-value',
  };
  const allowed = await orchestrator.verifyAccess({ ...request, proof });
  assert.equal(allowed.allowed, true);

  const replay = await orchestrator.verifyAccess({ ...request, proof });
  assert.equal(replay.allowed, false);
  assert.equal(replay.reasonCode, 'staff_reauth_invalid');

  const audit = await new sql.Request(transaction)
    .input('OrganizationID', sql.Int, organizationId)
    .query(`
      SELECT Decision, ReasonCode, AssuranceMethod
      FROM VerificationLogs
      WHERE OrganizationID = @OrganizationID
      ORDER BY CreatedAt
    `);
  assert.deepEqual(
    audit.recordset.map(({ Decision, ReasonCode, AssuranceMethod }) => [
      Decision,
      ReasonCode,
      AssuranceMethod,
    ]),
    [
      ['denied', 'staff_reauthentication_required', 'qr'],
      ['allowed', 'permission_granted', 'staff_reauth'],
      ['denied', 'staff_reauth_invalid', 'staff_reauth'],
    ],
  );

  await transaction.rollback();
  console.log('Staff reauthentication orchestrator smoke test passed; transaction rolled back.');
} catch (error) {
  try {
    await transaction.rollback();
  } catch {}
  throw error;
} finally {
  await pool.close();
}