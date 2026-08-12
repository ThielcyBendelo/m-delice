import { sql, poolPromise } from '../config/dbConfig.js';
import auditService from '../services/auditService.js';
import notificationService from '../services/notificationService.js';

function isStaff(user) {
  const role = String(user?.role || '').toLowerCase();
  return ['admin', 'agent', 'claims_manager', 'underwriter', 'finance'].includes(role);
}

const claimController = {
  async fileNewClaim(req, res) {
    const { policyNumber, eventDate, description, gpsLocation, estimatedCost, documentPath } = req.body || {};

    if (!policyNumber || !description || estimatedCost == null) {
      return res.status(400).json({
        success: false,
        message: 'policyNumber, description et estimatedCost sont obligatoires.',
      });
    }

    try {
      const pool = await poolPromise;

      const policyCheck = await pool.request()
        .input('PolicyNumber', sql.NVarChar, policyNumber.trim())
        .query(`
          SELECT PolicyID, BuyerID, RemainingLimitUSD, IsActive, EndDate, Status
          FROM InsurancePolicies
          WHERE PolicyNumber = @PolicyNumber
        `);

      if (!policyCheck.recordset.length) {
        return res.status(404).json({ success: false, message: 'Police introuvable.' });
      }

      const policy = policyCheck.recordset[0];
      const cost = parseFloat(estimatedCost);

      if (!policy.IsActive || String(policy.Status || '').toLowerCase() !== 'active' || new Date(policy.EndDate) < new Date()) {
        return res.status(400).json({ success: false, message: 'Ce contrat a expire ou est suspendu.' });
      }

      if (policy.RemainingLimitUSD < cost) {
        return res.status(400).json({
          success: false,
          message: `Plafond insuffisant. Solde disponible : ${policy.RemainingLimitUSD} USD.`,
        });
      }

      if (req.user && !isStaff(req.user) && Number(policy.BuyerID) !== Number(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Cette police ne vous appartient pas.' });
      }

      const claimNumber = `DRC-SIN-${Date.now().toString().slice(-6)}`;
      // GpsLocation peut être NOT NULL sur schémas legacy
      const gps = (gpsLocation && String(gpsLocation).trim()) || 'N/A';

      const result = await pool.request()
        .input('ClaimNumber', sql.NVarChar, claimNumber)
        .input('PolicyID', sql.Int, policy.PolicyID)
        .input('FiledBy', sql.Int, req.user?.id || null)
        .input('EventDate', sql.DateTime2, eventDate ? new Date(eventDate) : new Date())
        .input('Description', sql.NVarChar(sql.MAX), description.trim())
        .input('Gps', sql.NVarChar, gps)
        .input('Cost', sql.Decimal(12, 2), cost)
        .input('Doc', sql.NVarChar, documentPath || null)
        .query(`
          INSERT INTO Claims
            (ClaimNumber, PolicyID, FiledByUserID, EventDate, ClaimDescription, GpsLocation,
             EstimatedCostUSD, DocumentPath, ClaimStatus)
          OUTPUT INSERTED.*
          VALUES
            (@ClaimNumber, @PolicyID, @FiledBy, @EventDate, @Description, @Gps,
             @Cost, @Doc, 'submitted')
        `);

      await auditService.log({
        actorUserId: req.user?.id,
        action: 'claim.file',
        entityType: 'claim',
        entityId: claimNumber,
        details: { policyNumber, cost },
        ipAddress: req.ip,
      });

      return res.status(201).json({
        success: true,
        message: 'Sinistre enregistre. En attente de validation.',
        claimNumber,
        claim: result.recordset[0],
        remainingLimit: `${Number(policy.RemainingLimitUSD).toFixed(2)} USD`,
      });
    } catch (error) {
      console.error('fileNewClaim:', error);
      return res.status(500).json({ success: false, message: 'Erreur technique lors du depot du sinistre.' });
    }
  },

  async list(req, res) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      let q = `
        SELECT c.*, p.PolicyNumber, p.BuyerID,
               b.FirstName AS BeneficiaryFirstName, b.LastName AS BeneficiaryLastName
        FROM Claims c
        JOIN InsurancePolicies p ON p.PolicyID = c.PolicyID
        JOIN Beneficiaries b ON b.BeneficiaryID = p.BeneficiaryID
        WHERE 1=1
      `;

      if (!isStaff(req.user)) {
        q += ' AND p.BuyerID = @BuyerID';
        request.input('BuyerID', sql.Int, req.user.id);
      }
      if (req.query.status) {
        q += ' AND c.ClaimStatus = @Status';
        request.input('Status', sql.NVarChar, req.query.status);
      }
      if (req.query.policyNumber) {
        q += ' AND p.PolicyNumber = @PN';
        request.input('PN', sql.NVarChar, req.query.policyNumber);
      }
      q += ' ORDER BY c.CreatedAt DESC';

      const result = await request.query(q);
      return res.status(200).json({ success: true, claims: result.recordset });
    } catch (error) {
      console.error('claim.list:', error);
      return res.status(500).json({ success: false, message: 'Erreur liste sinistres.' });
    }
  },

  async getOne(req, res) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('ClaimNumber', sql.NVarChar, req.params.claimNumber.trim())
        .query(`
          SELECT c.*, p.PolicyNumber, p.BuyerID, p.RemainingLimitUSD
          FROM Claims c
          JOIN InsurancePolicies p ON p.PolicyID = c.PolicyID
          WHERE c.ClaimNumber = @ClaimNumber
        `);

      if (!result.recordset.length) {
        return res.status(404).json({ success: false, message: 'Sinistre introuvable.' });
      }

      const claim = result.recordset[0];
      if (!isStaff(req.user) && Number(claim.BuyerID) !== Number(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Acces refuse.' });
      }

      return res.status(200).json({ success: true, claim });
    } catch (error) {
      console.error('claim.getOne:', error);
      return res.status(500).json({ success: false, message: 'Erreur lecture sinistre.' });
    }
  },

  async updateStatus(req, res) {
    const { status, reviewerNotes, approvedAmount } = req.body || {};
    const allowed = ['submitted', 'under_review', 'approved', 'rejected', 'paid'];
    const newStatus = String(status || '').toLowerCase();

    if (!allowed.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Statut invalide. Autorises: ${allowed.join(', ')}`,
      });
    }

    try {
      const pool = await poolPromise;
      const existing = await pool.request()
        .input('ClaimNumber', sql.NVarChar, req.params.claimNumber.trim())
        .query(`
          SELECT c.*, p.PolicyNumber, p.RemainingLimitUSD, p.BuyerID, u.Email AS BuyerEmail
          FROM Claims c
          JOIN InsurancePolicies p ON p.PolicyID = c.PolicyID
          LEFT JOIN Users u ON u.UserID = p.BuyerID
          WHERE c.ClaimNumber = @ClaimNumber
        `);

      if (!existing.recordset.length) {
        return res.status(404).json({ success: false, message: 'Sinistre introuvable.' });
      }

      const claim = existing.recordset[0];
      const prev = String(claim.ClaimStatus || '').toLowerCase();

      if (prev === 'approved' && newStatus === 'approved') {
        return res.status(200).json({ success: true, message: 'Deja approuve.', claim });
      }

      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        let approved = approvedAmount != null ? parseFloat(approvedAmount) : parseFloat(claim.EstimatedCostUSD);

        if (newStatus === 'approved' && prev !== 'approved') {
          if (Number(claim.RemainingLimitUSD) < approved) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              message: `Plafond insuffisant (${claim.RemainingLimitUSD} USD) pour approuver ${approved} USD.`,
            });
          }

          await new sql.Request(transaction)
            .input('PolicyID', sql.Int, claim.PolicyID)
            .input('Cost', sql.Decimal(12, 2), approved)
            .query(`
              UPDATE InsurancePolicies
              SET RemainingLimitUSD = RemainingLimitUSD - @Cost,
                  UpdatedAt = SYSUTCDATETIME()
              WHERE PolicyID = @PolicyID
            `);
        }

        if (prev === 'approved' && (newStatus === 'rejected' || newStatus === 'under_review')) {
          const reverseAmt = parseFloat(claim.ApprovedAmountUSD || claim.EstimatedCostUSD || 0);
          await new sql.Request(transaction)
            .input('PolicyID', sql.Int, claim.PolicyID)
            .input('Cost', sql.Decimal(12, 2), reverseAmt)
            .query(`
              UPDATE InsurancePolicies
              SET RemainingLimitUSD = RemainingLimitUSD + @Cost,
                  UpdatedAt = SYSUTCDATETIME()
              WHERE PolicyID = @PolicyID
            `);
          approved = null;
        }

        const updated = await new sql.Request(transaction)
          .input('ClaimNumber', sql.NVarChar, claim.ClaimNumber)
          .input('Status', sql.NVarChar, newStatus)
          .input('Notes', sql.NVarChar(sql.MAX), reviewerNotes || null)
          .input('Approved', sql.Decimal(12, 2), newStatus === 'approved' ? approved : null)
          .input('Reviewer', sql.Int, req.user.id)
          .query(`
            UPDATE Claims
            SET ClaimStatus = @Status,
                ReviewerNotes = COALESCE(@Notes, ReviewerNotes),
                ApprovedAmountUSD = CASE WHEN @Status = 'approved' THEN @Approved ELSE ApprovedAmountUSD END,
                ReviewedByUserID = @Reviewer,
                ReviewedAt = SYSUTCDATETIME(),
                UpdatedAt = SYSUTCDATETIME()
            OUTPUT INSERTED.*
            WHERE ClaimNumber = @ClaimNumber
          `);

        await transaction.commit();

        await auditService.log({
          actorUserId: req.user.id,
          action: 'claim.status',
          entityType: 'claim',
          entityId: claim.ClaimNumber,
          details: { status: newStatus, approvedAmount: approved, reviewerNotes },
          ipAddress: req.ip,
        });

        try {
          await notificationService.notifyClaimStatus({
            userId: claim.BuyerID,
            email: claim.BuyerEmail,
            claimNumber: claim.ClaimNumber,
            status: newStatus,
          });
        } catch { /* ignore */ }

        return res.status(200).json({
          success: true,
          claim: updated.recordset[0],
          message: `Sinistre passe a "${newStatus}".`,
        });
      } catch (inner) {
        await transaction.rollback();
        throw inner;
      }
    } catch (error) {
      console.error('claim.updateStatus:', error);
      return res.status(500).json({ success: false, message: 'Erreur mise a jour sinistre.' });
    }
  },
};

export default claimController;
