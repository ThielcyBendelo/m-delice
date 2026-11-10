import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'crypto';
import { sql, poolPromise } from '../config/dbConfig.js';
import { createBeneficiaryVerificationProofService } from '../services/beneficiaryVerificationProofService.js';
import { createVerificationOrchestratorService } from '../services/verificationOrchestratorService.js';

const service = createBeneficiaryVerificationProofService({
  secret: 'smoke-test-verification-secret-32-bytes-minimum',
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

  const actorUserId = (await new sql.Request(transaction).query(`
    INSERT INTO Users (LastName, FirstName, Email, PasswordHash, UserRole)
    OUTPUT INSERTED.UserID
    VALUES (N'Rollback', N'Proof', CONCAT(N'smoke-3e-', NEWID(), N'@example.invalid'), N'not-a-login', N'Partner')
  `)).recordset[0].UserID;

  const organizationId = (await new sql.Request(transaction).query(`
    INSERT INTO PartnerOrganizations (OrganizationName, OrganizationType, IsActive)
    OUTPUT INSERTED.OrganizationID
    VALUES (N'SMOKE-3E-ROLLBACK', N'hospital', 1)
  `)).recordset[0].OrganizationID;

  await new sql.Request(transaction)
    .input('OrganizationID', sql.Int, organizationId)
    .input('ActorUserID', sql.Int, actorUserId)
    .query(`
      DECLARE @ProfileID INT = (
        SELECT VerificationProfileID FROM VerificationProfiles
        WHERE ProfileCode = N'hospital_verifier'
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

  const firstPin = await service.rotatePin(beneficiaryId, {
    createdByUserId: actorUserId,
    maximumAttempts: 3,
    transaction,
  });
  assert.match(firstPin.pin, /^\d{6}$/);
  const wrongPin = firstPin.pin === '000000' ? '999999' : '000000';
  assert.equal((await service.verifyPin(beneficiaryId, wrongPin, { transaction })).reasonCode, 'pin_invalid');
  assert.equal((await service.verifyPin(beneficiaryId, wrongPin, { transaction })).reasonCode, 'pin_invalid');
  assert.equal((await service.verifyPin(beneficiaryId, wrongPin, { transaction })).reasonCode, 'pin_locked');
  assert.equal((await service.verifyPin(beneficiaryId, firstPin.pin, { transaction })).reasonCode, 'pin_locked');

  const secondPin = await service.rotatePin(beneficiaryId, {
    createdByUserId: actorUserId,
    transaction,
  });
  assert.equal((await service.verifyPin(beneficiaryId, secondPin.pin, { transaction })).valid, true);

  const otpContext = {
    credentialId,
    beneficiaryId,
    organizationId,
    actorUserId,
    deliveryChannel: 'sms',
    destination: '+243000000000',
    transaction,
  };
  const firstOtp = await service.createOtp(otpContext);
  const secondOtp = await service.createOtp(otpContext);
  const firstOtpStatus = await new sql.Request(transaction)
    .input('ChallengeID', sql.UniqueIdentifier, firstOtp.challenge.ChallengeID)
    .query(`SELECT Status FROM BeneficiaryOtpChallenges WHERE ChallengeID = @ChallengeID`);
  assert.equal(firstOtpStatus.recordset[0].Status, 'cancelled');

  const wrongOtp = secondOtp.code === '000000' ? '999999' : '000000';
  assert.equal((await service.verifyOtp(secondOtp.challenge.ChallengeID, wrongOtp, {
    credentialId,
    beneficiaryId,
    organizationId,
    actorUserId,
    transaction,
  })).reasonCode, 'otp_invalid');
  assert.equal((await service.verifyOtp(secondOtp.challenge.ChallengeID, secondOtp.code, {
    credentialId,
    beneficiaryId,
    organizationId,
    actorUserId,
    transaction,
  })).assuranceMethod, 'qr_otp');
  assert.equal((await service.verifyOtp(secondOtp.challenge.ChallengeID, secondOtp.code, {
    credentialId,
    beneficiaryId,
    organizationId,
    actorUserId,
    transaction,
  })).reasonCode, 'otp_invalid');

  const lockedOtp = await service.createOtp({ ...otpContext, maximumAttempts: 3 });
  const lockedWrongOtp = lockedOtp.code === '111111' ? '999999' : '111111';
  await service.verifyOtp(lockedOtp.challenge.ChallengeID, lockedWrongOtp, {
    credentialId,
    beneficiaryId,
    organizationId,
    actorUserId,
    transaction,
  });
  await service.verifyOtp(lockedOtp.challenge.ChallengeID, lockedWrongOtp, {
    credentialId,
    beneficiaryId,
    organizationId,
    actorUserId,
    transaction,
  });
  assert.equal((await service.verifyOtp(lockedOtp.challenge.ChallengeID, lockedWrongOtp, {
    credentialId,
    beneficiaryId,
    organizationId,
    actorUserId,
    transaction,
  })).reasonCode, 'otp_locked');
  assert.equal((await service.verifyOtp(lockedOtp.challenge.ChallengeID, lockedOtp.code, {
    credentialId,
    beneficiaryId,
    organizationId,
    actorUserId,
    transaction,
  })).valid, false);

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
    proofService: service,
  });
  const orchestratorRequest = {
    token: 'validated-by-smoke-adapter',
    organizationId,
    actorUserId,
    permissionCode: 'service.authorization',
    accessMethod: 'named_account',
    transaction,
  };

  const pinAccess = await orchestrator.verifyAccess({
    ...orchestratorRequest,
    proof: { type: 'pin', code: secondPin.pin },
  });
  assert.equal(pinAccess.allowed, true);

  const orchestratedOtp = await service.createOtp(otpContext);
  const otpAccess = await orchestrator.verifyAccess({
    ...orchestratorRequest,
    proof: {
      type: 'otp',
      challengeId: orchestratedOtp.challenge.ChallengeID,
      code: orchestratedOtp.code,
    },
  });
  assert.equal(otpAccess.allowed, true);

  const reusedOtp = await orchestrator.verifyAccess({
    ...orchestratorRequest,
    proof: {
      type: 'otp',
      challengeId: orchestratedOtp.challenge.ChallengeID,
      code: orchestratedOtp.code,
    },
  });
  assert.equal(reusedOtp.allowed, false);
  assert.equal(reusedOtp.reasonCode, 'otp_invalid');

  await transaction.rollback();
  console.log('Beneficiary verification proof service smoke test passed; transaction rolled back.');
} catch (error) {
  try {
    await transaction.rollback();
  } catch {}
  throw error;
} finally {
  await pool.close();
}