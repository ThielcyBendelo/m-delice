import { sql, poolPromise } from '../config/dbConfig.js';
import auditService from '../services/auditService.js';

function maskPhone(phone) {
  if (!phone) return null;
  const s = String(phone);
  if (s.length <= 6) return '***';
  return `${s.slice(0, 5)}***${s.slice(-2)}`;
}

function maskName(first, last) {
  const f = String(first || '').trim();
  const l = String(last || '').trim();
  const fMask = f ? `${f.slice(0, 1)}.` : '';
  const lMask = l ? `${l.slice(0, 2)}***` : '';
  return `${lMask} ${fMask}`.trim() || '—';
}

function checkHospitalPin(req) {
  const expected = String(process.env.HOSPITAL_VERIFY_PIN || '').trim();
  if (!expected) {
    return { ok: true, mode: 'open' };
  }
  const provided =
    req.headers['x-hospital-pin'] ||
    req.headers['x-hospital-key'] ||
    req.query?.pin ||
    req.body?.pin ||
    '';
  if (String(provided).trim() === expected) {
    return { ok: true, mode: 'pin' };
  }
  return { ok: false, mode: 'pin' };
}

const hospitalController = {
  /** GET /api/hospital/config — public */
  async config(_req, res) {
    const pinRequired = Boolean(String(process.env.HOSPITAL_VERIFY_PIN || '').trim());
    return res.status(200).json({
      success: true,
      pinRequired,
      service: 'ESNAS Hospital Policy Verify',
      message: pinRequired
        ? 'Un code établissement (PIN) est requis.'
        : 'Vérification ouverte — données bénéficiaire partiellement masquées.',
    });
  },

  /**
   * GET /api/hospital/verify/:policyNumber
   * POST /api/hospital/verify  { policyNumber, pin? }
   * Public (optionnellement protégé par HOSPITAL_VERIFY_PIN)
   */
  async verify(req, res) {
    const gate = checkHospitalPin(req);
    if (!gate.ok) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Code établissement invalide ou manquant (X-Hospital-Pin).',
      });
    }

    const policyNumber = String(
      req.params.policyNumber || req.body?.policyNumber || req.query?.policyNumber || ''
    ).trim();

    if (!policyNumber || policyNumber.length < 5) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Numéro de police requis.',
      });
    }

    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('PolicyNumber', sql.NVarChar, policyNumber)
        .query(`
          SELECT
            p.PolicyNumber, p.InsuranceBranch, p.CoverageLevel,
            p.AnnualLimitUSD, p.RemainingLimitUSD,
            p.StartDate, p.EndDate, p.IsActive, p.Status,
            b.FirstName, b.LastName, b.WhatsAppPhone, b.City, b.NationalID,
            (SELECT COUNT(*) FROM Claims c WHERE c.PolicyID = p.PolicyID AND c.ClaimStatus IN ('submitted','under_review')) AS OpenClaimCount
          FROM InsurancePolicies p
          JOIN Beneficiaries b ON b.BeneficiaryID = p.BeneficiaryID
          WHERE p.PolicyNumber = @PolicyNumber
        `);

      if (!result.recordset.length) {
        return res.status(404).json({
          success: false,
          valid: false,
          message: 'Contrat introuvable.',
          checkedAt: new Date().toISOString(),
        });
      }

      const row = result.recordset[0];
      const now = new Date();
      const endOk = new Date(row.EndDate) >= now;
      const startOk = new Date(row.StartDate) <= now;
      const statusOk = String(row.Status || '').toLowerCase() === 'active';
      const activeOk = !!row.IsActive;
      const valid = activeOk && statusOk && endOk && startOk;
      const reasons = [];
      if (!activeOk) reasons.push('contrat_inactif');
      if (!statusOk) reasons.push('statut_non_actif');
      if (!endOk) reasons.push('expire');
      if (!startOk) reasons.push('pas_encore_demarre');

      // Hôpital : PII minimale (pas d'email acheteur, pas d'adresse complète)
      const payload = {
        success: true,
        valid,
        reasons,
        checkedAt: now.toISOString(),
        accessMode: gate.mode,
        policy: {
          policyNumber: row.PolicyNumber,
          branch: row.InsuranceBranch,
          coverageLevel: row.CoverageLevel,
          status: row.Status,
          isActive: !!row.IsActive,
          startDate: row.StartDate,
          endDate: row.EndDate,
          annualLimitUSD: Number(row.AnnualLimitUSD || 0),
          remainingLimitUSD: Number(row.RemainingLimitUSD || 0),
          openClaimCount: Number(row.OpenClaimCount || 0),
          careAuthorized: valid && Number(row.RemainingLimitUSD || 0) > 0,
        },
        beneficiary: {
          displayName: maskName(row.FirstName, row.LastName),
          city: row.City || null,
          phone: maskPhone(row.WhatsAppPhone),
          nationalIdHint: row.NationalID
            ? `****${String(row.NationalID).slice(-3)}`
            : null,
        },
        guidance: valid
          ? (Number(row.RemainingLimitUSD || 0) > 0
            ? 'Prise en charge possible dans la limite du plafond restant.'
            : 'Contrat valide mais plafond épuisé — contacter ESNAS.')
          : 'Ne pas engager de prise en charge sans validation ESNAS.',
      };

      try {
        await auditService.log({
          actorUserId: null,
          action: 'hospital.verify_policy',
          entityType: 'policy',
          entityId: policyNumber,
          details: { valid, reasons, mode: gate.mode },
          ipAddress: req.ip,
        });
      } catch {
        /* optional */
      }

      return res.status(200).json(payload);
    } catch (error) {
      console.error('hospital.verify:', error);
      return res.status(500).json({
        success: false,
        valid: false,
        message: 'Erreur serveur lors de la vérification.',
      });
    }
  },
};

export default hospitalController;
