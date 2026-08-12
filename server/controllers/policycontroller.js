import { sql, poolPromise } from '../config/dbConfig.js';
import auditService from '../services/auditService.js';
import notificationService from '../services/notificationService.js';
import { annualLimit, endDatePlusOneYear, ARCA_TAX_RATE } from '../services/policyHelpers.js';

function isStaff(user) {
  const role = String(user?.role || '').toLowerCase();
  return ['admin', 'agent', 'underwriter', 'finance', 'claims_manager'].includes(role);
}

const policyController = {
  async checkoutAndIssuePolicy(req, res) {
    const { beneficiary, productDetails, payment } = req.body || {};
    const buyerID = req.user?.id || req.body?.buyerID;

    if (!buyerID || !beneficiary || !productDetails || !payment) {
      return res.status(400).json({ success: false, message: 'Donnees incompletes.' });
    }

    if (req.user?.id && Number(req.body?.buyerID) && Number(req.body.buyerID) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'buyerID ne correspond pas a la session.' });
    }

    try {
      const pool = await poolPromise;
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        const bResult = await new sql.Request(transaction)
          .input('LastName', sql.NVarChar, beneficiary.lastName.trim())
          .input('FirstName', sql.NVarChar, beneficiary.firstName.trim())
          .input('Phone', sql.NVarChar, beneficiary.phone.trim())
          .input('City', sql.NVarChar, beneficiary.city || null)
          .input('Address', sql.NVarChar, beneficiary.address?.trim() || null)
          .input('NationalID', sql.NVarChar, beneficiary.nationalID || null)
          .query(`INSERT INTO Beneficiaries (LastName, FirstName, WhatsAppPhone, City, HomeAddress, NationalID)
                  OUTPUT INSERTED.BeneficiaryID
                  VALUES (@LastName, @FirstName, @Phone, @City, @Address, @NationalID)`);

        const beneficiaryID = bResult.recordset[0].BeneficiaryID;
        const policyNumber = `DRC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        const annualLimitUSD = annualLimit(productDetails.coverageLevel);
        const start = new Date();
        const end = endDatePlusOneYear(start);
        const amountUSD = parseFloat(productDetails.price);
        const taxUSD = +(amountUSD * ARCA_TAX_RATE).toFixed(2);

        const pResult = await new sql.Request(transaction)
          .input('PolicyNumber', sql.NVarChar, policyNumber)
          .input('BuyerID', sql.Int, buyerID)
          .input('BeneficiaryID', sql.Int, beneficiaryID)
          .input('Branch', sql.NVarChar, productDetails.branch || 'Sante')
          .input('Level', sql.NVarChar, productDetails.coverageLevel)
          .input('Limit', sql.Decimal(12, 2), annualLimitUSD)
          .input('Premium', sql.Decimal(12, 2), amountUSD)
          .input('Start', sql.DateTime2, start)
          .input('End', sql.DateTime2, end)
          .query(`INSERT INTO InsurancePolicies
                    (PolicyNumber, BuyerID, BeneficiaryID, InsuranceBranch, CoverageLevel,
                     AnnualLimitUSD, RemainingLimitUSD, PremiumUSD, StartDate, EndDate, IsActive, Status)
                  OUTPUT INSERTED.PolicyID
                  VALUES
                    (@PolicyNumber, @BuyerID, @BeneficiaryID, @Branch, @Level,
                     @Limit, @Limit, @Premium, @Start, @End, 1, 'active')`);

        const policyID = pResult.recordset[0].PolicyID;

        await new sql.Request(transaction)
          .input('Tx', sql.NVarChar, payment.transactionReference)
          .input('PID', sql.Int, policyID)
          .input('UID', sql.Int, buyerID)
          .input('Gateway', sql.NVarChar, payment.gateway || 'legacy_checkout')
          .input('Amt', sql.Decimal(12, 2), amountUSD)
          .input('Tax', sql.Decimal(12, 2), taxUSD)
          .input('Total', sql.Decimal(12, 2), amountUSD + taxUSD)
          .input('Cur', sql.NVarChar, String(payment.currency || 'USD').toUpperCase())
          .query(`INSERT INTO Payments
                    (TransactionReference, PolicyID, UserID, GatewayUsed, AmountUSD, TaxArcaUSD, TotalPaidUSD, CurrencyReceived, Status, PaidAt)
                  VALUES
                    (@Tx, @PID, @UID, @Gateway, @Amt, @Tax, @Total, @Cur, 'completed', SYSUTCDATETIME())`);

        await transaction.commit();

        await auditService.log({
          actorUserId: buyerID,
          action: 'policy.checkout_legacy',
          entityType: 'policy',
          entityId: policyNumber,
          ipAddress: req.ip,
        });

        try {
          const u = await pool.request().input('UID', sql.Int, buyerID)
            .query('SELECT Email FROM Users WHERE UserID = @UID');
          await notificationService.notifyPolicyIssued({
            userId: buyerID,
            email: u.recordset[0]?.Email,
            policyNumber,
            phone: beneficiary.phone,
          });
        } catch { /* ignore */ }

        return res.status(201).json({ success: true, policyNumber });
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    } catch (error) {
      console.error('Erreur SQL Policy:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  async verifyPolicyStatus(req, res) {
    const { policyNumber } = req.params;
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('PolicyNumber', sql.NVarChar, policyNumber.trim())
        .query(`SELECT
            p.PolicyID, p.PolicyNumber, p.InsuranceBranch, p.CoverageLevel,
            p.AnnualLimitUSD, p.RemainingLimitUSD, p.StartDate, p.EndDate,
            p.IsActive, p.Status, p.PremiumUSD,
            b.FirstName, b.LastName, b.WhatsAppPhone, b.City
          FROM InsurancePolicies p
          JOIN Beneficiaries b ON p.BeneficiaryID = b.BeneficiaryID
          WHERE p.PolicyNumber = @PolicyNumber`);

      if (!result.recordset.length) {
        return res.status(404).json({ success: false, message: 'Contrat introuvable.' });
      }

      const policy = result.recordset[0];
      const valid =
        !!policy.IsActive &&
        String(policy.Status || '').toLowerCase() === 'active' &&
        new Date(policy.EndDate) >= new Date();

      return res.status(200).json({
        success: true,
        valid,
        policy: {
          ...policy,
          WhatsAppPhone: policy.WhatsAppPhone
            ? `${String(policy.WhatsAppPhone).slice(0, 5)}***`
            : null,
        },
      });
    } catch (error) {
      console.error('verifyPolicyStatus:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  async list(req, res) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      let q = `SELECT
          p.PolicyID, p.PolicyNumber, p.BuyerID, p.InsuranceBranch, p.CoverageLevel,
          p.AnnualLimitUSD, p.RemainingLimitUSD, p.PremiumUSD, p.StartDate, p.EndDate,
          p.IsActive, p.Status, p.CreatedAt,
          b.FirstName AS BeneficiaryFirstName, b.LastName AS BeneficiaryLastName,
          b.WhatsAppPhone AS BeneficiaryPhone, b.City AS BeneficiaryCity,
          u.Email AS BuyerEmail, u.FirstName AS BuyerFirstName, u.LastName AS BuyerLastName
        FROM InsurancePolicies p
        JOIN Beneficiaries b ON b.BeneficiaryID = p.BeneficiaryID
        JOIN Users u ON u.UserID = p.BuyerID
        WHERE 1=1`;

      if (!isStaff(req.user)) {
        q += ' AND p.BuyerID = @BuyerID';
        request.input('BuyerID', sql.Int, req.user.id);
      } else if (req.query.buyerId) {
        q += ' AND p.BuyerID = @BuyerID';
        request.input('BuyerID', sql.Int, Number(req.query.buyerId));
      }

      if (req.query.status) {
        q += ' AND p.Status = @Status';
        request.input('Status', sql.NVarChar, req.query.status);
      }
      if (req.query.active != null) {
        q += ' AND p.IsActive = @Active';
        request.input('Active', sql.Bit, String(req.query.active) === 'true' || req.query.active === '1');
      }

      q += ' ORDER BY p.CreatedAt DESC';
      const result = await request.query(q);
      return res.status(200).json({ success: true, policies: result.recordset });
    } catch (error) {
      console.error('policy.list:', error);
      return res.status(500).json({ success: false, message: 'Erreur liste polices.' });
    }
  },

  async getOne(req, res) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('PolicyNumber', sql.NVarChar, req.params.policyNumber.trim())
        .query(`SELECT p.*, b.FirstName AS BeneficiaryFirstName, b.LastName AS BeneficiaryLastName,
                 b.WhatsAppPhone, b.City, b.HomeAddress, b.NationalID
          FROM InsurancePolicies p
          JOIN Beneficiaries b ON b.BeneficiaryID = p.BeneficiaryID
          WHERE p.PolicyNumber = @PolicyNumber`);

      if (!result.recordset.length) {
        return res.status(404).json({ success: false, message: 'Police introuvable.' });
      }

      const policy = result.recordset[0];
      if (!isStaff(req.user) && Number(policy.BuyerID) !== Number(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Acces refuse.' });
      }

      return res.status(200).json({ success: true, policy });
    } catch (error) {
      console.error('policy.getOne:', error);
      return res.status(500).json({ success: false, message: 'Erreur lecture police.' });
    }
  },

  async updateStatus(req, res) {
    const { status, reason } = req.body || {};
    const allowed = ['active', 'suspended', 'cancelled', 'expired', 'pending_payment'];
    if (!status || !allowed.includes(String(status).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Statut invalide. Autorises: ${allowed.join(', ')}`,
      });
    }

    try {
      const pool = await poolPromise;
      const existing = await pool.request()
        .input('PolicyNumber', sql.NVarChar, req.params.policyNumber.trim())
        .query('SELECT * FROM InsurancePolicies WHERE PolicyNumber = @PolicyNumber');

      if (!existing.recordset.length) {
        return res.status(404).json({ success: false, message: 'Police introuvable.' });
      }

      const policy = existing.recordset[0];
      if (!isStaff(req.user) && Number(policy.BuyerID) !== Number(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Acces refuse.' });
      }

      const newStatus = String(status).toLowerCase();
      const isActive = newStatus === 'active' ? 1 : 0;

      const result = await pool.request()
        .input('PolicyNumber', sql.NVarChar, policy.PolicyNumber)
        .input('Status', sql.NVarChar, newStatus)
        .input('IsActive', sql.Bit, isActive)
        .query(`UPDATE InsurancePolicies
          SET Status = @Status, IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
          OUTPUT INSERTED.*
          WHERE PolicyNumber = @PolicyNumber`);

      await auditService.log({
        actorUserId: req.user.id,
        action: 'policy.status',
        entityType: 'policy',
        entityId: policy.PolicyNumber,
        details: { status: newStatus, reason },
        ipAddress: req.ip,
      });

      return res.status(200).json({ success: true, policy: result.recordset[0] });
    } catch (error) {
      console.error('policy.updateStatus:', error);
      return res.status(500).json({ success: false, message: 'Erreur mise a jour police.' });
    }
  },

  async renew(req, res) {
    try {
      const pool = await poolPromise;
      const existing = await pool.request()
        .input('PolicyNumber', sql.NVarChar, req.params.policyNumber.trim())
        .query('SELECT * FROM InsurancePolicies WHERE PolicyNumber = @PolicyNumber');

      if (!existing.recordset.length) {
        return res.status(404).json({ success: false, message: 'Police introuvable.' });
      }

      const policy = existing.recordset[0];
      if (!isStaff(req.user) && Number(policy.BuyerID) !== Number(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Acces refuse.' });
      }

      const newStart = new Date(policy.EndDate) > new Date() ? new Date(policy.EndDate) : new Date();
      const newEnd = endDatePlusOneYear(newStart);

      const result = await pool.request()
        .input('PolicyNumber', sql.NVarChar, policy.PolicyNumber)
        .input('Start', sql.DateTime2, newStart)
        .input('End', sql.DateTime2, newEnd)
        .input('Limit', sql.Decimal(12, 2), policy.AnnualLimitUSD)
        .query(`UPDATE InsurancePolicies
          SET StartDate = @Start,
              EndDate = @End,
              RemainingLimitUSD = @Limit,
              IsActive = 1,
              Status = 'active',
              UpdatedAt = SYSUTCDATETIME()
          OUTPUT INSERTED.*
          WHERE PolicyNumber = @PolicyNumber`);

      await auditService.log({
        actorUserId: req.user.id,
        action: 'policy.renew',
        entityType: 'policy',
        entityId: policy.PolicyNumber,
        ipAddress: req.ip,
      });

      return res.status(200).json({ success: true, policy: result.recordset[0], message: 'Police renouvelee.' });
    } catch (error) {
      console.error('policy.renew:', error);
      return res.status(500).json({ success: false, message: 'Erreur renouvellement.' });
    }
  },
};

export default policyController;
