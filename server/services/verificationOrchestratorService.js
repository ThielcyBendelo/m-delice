import { randomUUID } from 'crypto';
import { sql, poolPromise } from '../config/dbConfig.js';
import beneficiaryCredentialService from './beneficiaryCredentialService.js';
import verificationPermissionService from './verificationPermissionService.js';
import verificationLogService from './verificationLogService.js';
import { getBeneficiaryVerificationProofService } from './beneficiaryVerificationProofService.js';
import { getOrganizationAccessCodeService } from './organizationAccessCodeService.js';
import { getStaffReauthenticationService } from './staffReauthenticationService.js';

const CODE_PATTERN = /^\d{6}$/;
const ORGANIZATION_CODE_PATTERN = /^\d{8}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export function createVerificationOrchestratorService({
  credentialService = beneficiaryCredentialService,
  permissionService = verificationPermissionService,
  logService = verificationLogService,
  proofService = null,
  organizationCodeService = null,
  staffReauthenticationService = null,
} = {}) {
  return {
    async verifyAccess(options) {
      if (!options || typeof options !== 'object') throw new TypeError('options are required.');
      if (Object.hasOwn(options, 'assuranceMethod')) {
        throw new TypeError('assuranceMethod is derived by the orchestrator.');
      }
      const {
        token,
        organizationId,
        actorUserId = null,
        permissionCode,
        accessMethod,
        proof = null,
        ipAddress = null,
        userAgent = null,
        correlationId = randomUUID(),
        transaction = null,
      } = options;
      if (accessMethod === 'emergency_pin' && permissionCode !== 'policy.status') {
        throw new TypeError('Emergency access is restricted to policy.status.');
      }

      let attemptedAssuranceMethod = 'qr';
      let malformedProofReason = null;
      if (proof != null) {
        if (!proof || typeof proof !== 'object') throw new TypeError('proof must be an object.');
        if (proof.type === 'pin') {
          attemptedAssuranceMethod = 'qr_pin';
          if (!CODE_PATTERN.test(String(proof.code || '').trim())) malformedProofReason = 'pin_invalid';
        } else if (proof.type === 'otp') {
          attemptedAssuranceMethod = 'qr_otp';
          if (
            !CODE_PATTERN.test(String(proof.code || '').trim())
            || !UUID_PATTERN.test(String(proof.challengeId || '').trim())
          ) {
            malformedProofReason = 'otp_invalid';
          }
        } else if (proof.type === 'organization_pin') {
          attemptedAssuranceMethod = 'qr_pin';
          if (!ORGANIZATION_CODE_PATTERN.test(String(proof.code || '').trim())) {
            malformedProofReason = 'organization_pin_invalid';
          }
        } else if (proof.type === 'staff_reauth') {
          attemptedAssuranceMethod = 'staff_reauth';
          if (
            !String(proof.token || '').trim()
            || String(proof.sessionBinding || '').trim().length < 16
          ) {
            malformedProofReason = 'staff_reauth_invalid';
          }
        } else {
          throw new TypeError('Unsupported proof type.');
        }
      }

      return withTransaction(transaction, async (activeTransaction) => {
        const credential = await credentialService.verify(token, {
          transaction: activeTransaction,
        });

        if (!credential.valid) {
          const reasonCode = credential.reason === 'inactive'
            ? 'credential_inactive'
            : 'credential_invalid';
          const log = await logService.record({
            correlationId,
            actorUserId,
            organizationId,
            permissionCode,
            accessMethod,
            assuranceMethod: 'qr',
            decision: 'denied',
            reasonCode,
            ipAddress,
            userAgent,
            transaction: activeTransaction,
          });

          return {
            allowed: false,
            reasonCode,
            correlationId: log.CorrelationID,
          };
        }

        let proofResult = { valid: true, assuranceMethod: 'qr', reasonCode: 'qr_verified' };
        if (proof) {
          const organizationProof = proof.type === 'organization_pin';
          const staffProof = proof.type === 'staff_reauth';
          if (
            (organizationProof && accessMethod !== 'emergency_pin')
            || (staffProof && accessMethod !== 'esnas_staff')
            || (!organizationProof && !staffProof && accessMethod !== 'named_account')
          ) {
            proofResult = {
              valid: false,
              assuranceMethod: attemptedAssuranceMethod,
              reasonCode: organizationProof ? 'organization_pin_not_applicable'
                : staffProof ? 'staff_reauth_not_applicable'
                  : 'beneficiary_proof_not_applicable',
            };
          } else if (malformedProofReason) {
            proofResult = {
              valid: false,
              assuranceMethod: attemptedAssuranceMethod,
              reasonCode: malformedProofReason,
            };
          } else if (organizationProof) {
            const activeOrganizationCodeService = organizationCodeService
              || getOrganizationAccessCodeService();
            proofResult = await activeOrganizationCodeService.verify(
              organizationId,
              proof.code,
              { transaction: activeTransaction },
            );
          } else if (staffProof) {
            const activeStaffReauthenticationService = staffReauthenticationService
              || getStaffReauthenticationService();
            proofResult = await activeStaffReauthenticationService.consume(
              actorUserId,
              proof.token,
              proof.sessionBinding,
              { transaction: activeTransaction },
            );
          } else {
            const activeProofService = proofService || getBeneficiaryVerificationProofService();
            proofResult = proof.type === 'pin'
              ? await activeProofService.verifyPin(credential.beneficiaryId, proof.code, {
                transaction: activeTransaction,
              })
              : await activeProofService.verifyOtp(proof.challengeId, proof.code, {
                credentialId: credential.credentialId,
                beneficiaryId: credential.beneficiaryId,
                organizationId,
                actorUserId,
                transaction: activeTransaction,
              });
          }
        }

        const assuranceMethod = proofResult.assuranceMethod || attemptedAssuranceMethod;
        if (!proofResult.valid) {
          const log = await logService.record({
            correlationId,
            credentialId: credential.credentialId,
            policyId: credential.policyId,
            beneficiaryId: credential.beneficiaryId,
            actorUserId,
            organizationId,
            permissionCode,
            accessMethod,
            assuranceMethod,
            decision: 'denied',
            reasonCode: proofResult.reasonCode,
            ipAddress,
            userAgent,
            transaction: activeTransaction,
          });
          return {
            allowed: false,
            reasonCode: proofResult.reasonCode,
            correlationId: log.CorrelationID,
          };
        }

        const authorization = await permissionService.evaluate({
          organizationId,
          actorUserId,
          permissionCode,
          accessMethod,
          assuranceMethod,
          transaction: activeTransaction,
        });
        const decision = authorization.allowed ? 'allowed' : 'denied';
        const log = await logService.record({
          correlationId,
          credentialId: credential.credentialId,
          policyId: credential.policyId,
          beneficiaryId: credential.beneficiaryId,
          actorUserId,
          organizationId,
          verificationProfileId: authorization.verificationProfileId,
          permissionCode,
          accessMethod,
          assuranceMethod,
          decision,
          reasonCode: authorization.reasonCode,
          ipAddress,
          userAgent,
          transaction: activeTransaction,
        });

        if (!authorization.allowed) {
          return {
            allowed: false,
            reasonCode: authorization.reasonCode,
            correlationId: log.CorrelationID,
            requiredAssuranceLevel: authorization.requiredAssuranceLevel,
            providedAssuranceLevel: authorization.providedAssuranceLevel,
          };
        }

        return {
          allowed: true,
          reasonCode: authorization.reasonCode,
          correlationId: log.CorrelationID,
          credentialId: credential.credentialId,
          policyId: credential.policyId,
          beneficiaryId: credential.beneficiaryId,
          expiresAt: credential.expiresAt,
          verificationProfileId: authorization.verificationProfileId,
        };
      });
    },
  };
}

const verificationOrchestratorService = createVerificationOrchestratorService();

export default verificationOrchestratorService;