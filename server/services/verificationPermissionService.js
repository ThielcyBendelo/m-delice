import { sql, poolPromise } from '../config/dbConfig.js';

const ASSURANCE_LEVELS = Object.freeze({
  qr: 1,
  qr_pin: 2,
  qr_otp: 2,
  staff_reauth: 3,
});

const ACCESS_METHODS = new Set(['named_account', 'emergency_pin', 'esnas_staff']);

function positiveInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new TypeError(`${name} must be a positive integer.`);
  }
  return parsed;
}

function createRequest(transaction, pool) {
  return transaction ? new sql.Request(transaction) : pool.request();
}

function deny(reasonCode, context = {}) {
  return {
    allowed: false,
    reasonCode,
    requiredAssuranceLevel: context.requiredAssuranceLevel ?? null,
    providedAssuranceLevel: context.providedAssuranceLevel ?? null,
    verificationProfileId: context.verificationProfileId ?? null,
  };
}

export function createVerificationPermissionService() {
  return {
    async evaluate({
      organizationId,
      actorUserId = null,
      permissionCode,
      accessMethod,
      assuranceMethod,
      transaction = null,
    }) {
      const normalizedOrganizationId = positiveInteger(organizationId, 'organizationId');
      const normalizedActorUserId = actorUserId == null
        ? null
        : positiveInteger(actorUserId, 'actorUserId');
      const normalizedPermissionCode = String(permissionCode || '').trim();
      const normalizedAccessMethod = String(accessMethod || '').trim();
      const normalizedAssuranceMethod = String(assuranceMethod || '').trim();

      if (!normalizedPermissionCode) throw new TypeError('permissionCode is required.');
      if (!ACCESS_METHODS.has(normalizedAccessMethod)) {
        throw new TypeError('Unsupported accessMethod.');
      }

      const providedAssuranceLevel = ASSURANCE_LEVELS[normalizedAssuranceMethod];
      if (!providedAssuranceLevel) throw new TypeError('Unsupported assuranceMethod.');
      if (normalizedAccessMethod !== 'emergency_pin' && !normalizedActorUserId) {
        return deny('named_actor_required', { providedAssuranceLevel });
      }
      if (normalizedAccessMethod === 'emergency_pin') {
        if (normalizedPermissionCode !== 'policy.status') {
          return deny('emergency_scope_restricted', { providedAssuranceLevel });
        }
        if (normalizedAssuranceMethod !== 'qr_pin') {
          return deny('emergency_pin_not_verified', { providedAssuranceLevel });
        }
      }
      if (normalizedAccessMethod === 'esnas_staff' && normalizedAssuranceMethod !== 'staff_reauth') {
        return deny('staff_reauthentication_required', { providedAssuranceLevel });
      }

      const pool = transaction ? null : await poolPromise;
      const result = await createRequest(transaction, pool)
        .input('OrganizationID', sql.Int, normalizedOrganizationId)
        .input('ActorUserID', sql.Int, normalizedActorUserId)
        .input('PermissionCode', sql.NVarChar(80), normalizedPermissionCode)
        .query(`
          SELECT
            organization.IsActive AS OrganizationIsActive,
            settings.ApprovalStatus AS OrganizationApprovalStatus,
            settings.EmergencyPinAllowed,
            profile.VerificationProfileID,
            profile.IsStaffProfile,
            profile.IsActive AS ProfileIsActive,
            permission.IsActive AS PermissionIsActive,
            grantRow.RequiredAssuranceLevel,
            membership.ApprovalStatus AS MembershipApprovalStatus,
            actor.IsActive AS ActorIsActive
          FROM PartnerOrganizations organization
          LEFT JOIN OrganizationVerificationSettings settings
            ON settings.OrganizationID = organization.OrganizationID
          LEFT JOIN VerificationProfiles profile
            ON profile.VerificationProfileID = settings.VerificationProfileID
          LEFT JOIN VerificationProfilePermissions grantRow
            ON grantRow.VerificationProfileID = profile.VerificationProfileID
           AND grantRow.PermissionCode = @PermissionCode
          LEFT JOIN VerificationPermissions permission
            ON permission.PermissionCode = grantRow.PermissionCode
          LEFT JOIN OrganizationMemberships membership
            ON membership.OrganizationID = organization.OrganizationID
           AND membership.UserID = @ActorUserID
          LEFT JOIN Users actor
            ON actor.UserID = membership.UserID
          WHERE organization.OrganizationID = @OrganizationID
        `);

      const authorization = result.recordset[0];
      const context = {
        providedAssuranceLevel,
        requiredAssuranceLevel: authorization?.RequiredAssuranceLevel ?? null,
        verificationProfileId: authorization?.VerificationProfileID ?? null,
      };

      if (!authorization || !authorization.OrganizationIsActive) {
        return deny('organization_inactive_or_unknown', context);
      }
      if (authorization.OrganizationApprovalStatus !== 'approved') {
        return deny('organization_not_approved', context);
      }
      if (!authorization.ProfileIsActive) return deny('profile_inactive', context);
      if (!authorization.RequiredAssuranceLevel || !authorization.PermissionIsActive) {
        return deny('permission_not_granted', context);
      }

      if (normalizedAccessMethod === 'emergency_pin') {
        if (!authorization.EmergencyPinAllowed) return deny('emergency_pin_disabled', context);
      } else if (!authorization.ActorIsActive) {
        return deny('actor_inactive_or_unknown', context);
      } else if (authorization.MembershipApprovalStatus !== 'approved') {
        return deny('membership_not_approved', context);
      }

      if (normalizedAccessMethod === 'esnas_staff' && !authorization.IsStaffProfile) {
        return deny('staff_profile_required', context);
      }
      if (normalizedAccessMethod !== 'esnas_staff' && authorization.IsStaffProfile) {
        return deny('staff_access_method_required', context);
      }
      if (providedAssuranceLevel < authorization.RequiredAssuranceLevel) {
        return deny('insufficient_assurance', context);
      }

      return {
        allowed: true,
        reasonCode: 'permission_granted',
        ...context,
      };
    },
  };
}

const verificationPermissionService = createVerificationPermissionService();

export default verificationPermissionService;