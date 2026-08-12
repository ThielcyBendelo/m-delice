import { sql, poolPromise } from '../config/dbConfig.js';

function isStaff(user) {
  const role = String(user?.role || '').toLowerCase();
  return ['admin', 'agent', 'underwriter', 'finance', 'claims_manager'].includes(role);
}

const adminController = {
  /** KPIs dashboard */
  async stats(req, res) {
    try {
      const pool = await poolPromise;
      const staff = isStaff(req.user);
      const uid = req.user.id;

      const reqPay = pool.request();
      const reqPol = pool.request();
      const reqClaim = pool.request();
      const reqUser = pool.request();

      let payWhere = "WHERE Status = 'completed'";
      let polWhere = 'WHERE 1=1';
      let claimWhere = 'WHERE 1=1';

      if (!staff) {
        payWhere += ' AND UserID = @UID';
        polWhere += ' AND BuyerID = @UID';
        claimWhere += ` AND PolicyID IN (SELECT PolicyID FROM InsurancePolicies WHERE BuyerID = @UID)`;
        reqPay.input('UID', sql.Int, uid);
        reqPol.input('UID', sql.Int, uid);
        reqClaim.input('UID', sql.Int, uid);
      }

      const [payments, policies, claims, users] = await Promise.all([
        reqPay.query(`
          SELECT
            COUNT(*) AS TxCount,
            ISNULL(SUM(TotalPaidUSD), 0) AS TotalPremiumsUSD,
            ISNULL(SUM(CASE WHEN CreatedAt >= DATEADD(day, -30, SYSUTCDATETIME()) THEN TotalPaidUSD ELSE 0 END), 0) AS Premiums30dUSD
          FROM Payments ${payWhere}
        `),
        reqPol.query(`
          SELECT
            COUNT(*) AS PolicyCount,
            SUM(CASE WHEN IsActive = 1 AND Status = 'active' THEN 1 ELSE 0 END) AS ActivePolicies,
            SUM(CASE WHEN Status = 'pending_payment' THEN 1 ELSE 0 END) AS PendingPolicies
          FROM InsurancePolicies ${polWhere}
        `),
        reqClaim.query(`
          SELECT
            COUNT(*) AS ClaimCount,
            SUM(CASE WHEN ClaimStatus IN ('submitted', 'under_review') THEN 1 ELSE 0 END) AS OpenClaims,
            SUM(CASE WHEN ClaimStatus = 'approved' THEN 1 ELSE 0 END) AS ApprovedClaims
          FROM Claims ${claimWhere}
        `),
        staff
          ? reqUser.query(`SELECT COUNT(*) AS UserCount FROM Users WHERE IsActive = 1 OR IsActive IS NULL`)
          : Promise.resolve({ recordset: [{ UserCount: 1 }] }),
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          totalPremiumsUSD: Number(payments.recordset[0].TotalPremiumsUSD || 0),
          premiums30dUSD: Number(payments.recordset[0].Premiums30dUSD || 0),
          transactionCount: Number(payments.recordset[0].TxCount || 0),
          policyCount: Number(policies.recordset[0].PolicyCount || 0),
          activePolicies: Number(policies.recordset[0].ActivePolicies || 0),
          pendingPolicies: Number(policies.recordset[0].PendingPolicies || 0),
          claimCount: Number(claims.recordset[0].ClaimCount || 0),
          openClaims: Number(claims.recordset[0].OpenClaims || 0),
          approvedClaims: Number(claims.recordset[0].ApprovedClaims || 0),
          userCount: Number(users.recordset[0].UserCount || 0),
          scope: staff ? 'all' : 'mine',
        },
      });
    } catch (error) {
      console.error('admin.stats:', error);
      return res.status(500).json({ success: false, message: 'Erreur statistiques.' });
    }
  },

  /** Polices récentes pour la home dashboard */
  async recentPolicies(req, res) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      let q = `
        SELECT TOP 20
          p.PolicyNumber, p.InsuranceBranch, p.CoverageLevel, p.PremiumUSD, p.Status, p.IsActive,
          p.StartDate, p.CreatedAt,
          b.FirstName AS BeneficiaryFirstName, b.LastName AS BeneficiaryLastName, b.City AS BeneficiaryCity,
          u.FirstName AS BuyerFirstName, u.LastName AS BuyerLastName, u.Email AS BuyerEmail, u.CountryOfResidence
        FROM InsurancePolicies p
        JOIN Beneficiaries b ON b.BeneficiaryID = p.BeneficiaryID
        JOIN Users u ON u.UserID = p.BuyerID
        WHERE 1=1
      `;
      if (!isStaff(req.user)) {
        q += ' AND p.BuyerID = @UID';
        request.input('UID', sql.Int, req.user.id);
      }
      q += ' ORDER BY p.CreatedAt DESC';
      const result = await request.query(q);
      return res.status(200).json({ success: true, policies: result.recordset });
    } catch (error) {
      console.error('admin.recentPolicies:', error);
      return res.status(500).json({ success: false, message: 'Erreur polices récentes.' });
    }
  },

  /** Bénéficiaires (via polices) */
  async beneficiaries(req, res) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      let q = `
        SELECT
          b.BeneficiaryID, b.LastName, b.FirstName, b.WhatsAppPhone, b.City, b.HomeAddress, b.NationalID,
          p.PolicyNumber, p.RemainingLimitUSD, p.AnnualLimitUSD, p.Status AS PolicyStatus, p.IsActive,
          p.InsuranceBranch, p.CoverageLevel, p.EndDate,
          u.UserID AS BuyerID, u.FirstName AS BuyerFirstName, u.LastName AS BuyerLastName, u.Email AS BuyerEmail
        FROM Beneficiaries b
        JOIN InsurancePolicies p ON p.BeneficiaryID = b.BeneficiaryID
        JOIN Users u ON u.UserID = p.BuyerID
        WHERE 1=1
      `;
      if (!isStaff(req.user)) {
        q += ' AND p.BuyerID = @UID';
        request.input('UID', sql.Int, req.user.id);
      }
      if (req.query.city) {
        q += ' AND b.City = @City';
        request.input('City', sql.NVarChar, req.query.city);
      }
      if (req.query.q) {
        q += ` AND (
          b.LastName LIKE @Q OR b.FirstName LIKE @Q OR p.PolicyNumber LIKE @Q OR b.WhatsAppPhone LIKE @Q
        )`;
        request.input('Q', sql.NVarChar, `%${req.query.q}%`);
      }
      q += ' ORDER BY p.CreatedAt DESC';
      const result = await request.query(q);
      return res.status(200).json({ success: true, beneficiaries: result.recordset });
    } catch (error) {
      console.error('admin.beneficiaries:', error);
      return res.status(500).json({ success: false, message: 'Erreur liste bénéficiaires.' });
    }
  },

  /** Acheteurs diaspora / users */
  async subscribers(req, res) {
    try {
      if (!isStaff(req.user)) {
        // Client : uniquement son profil enrichi
        const pool = await poolPromise;
        const result = await pool.request()
          .input('UID', sql.Int, req.user.id)
          .query(`
            SELECT u.UserID, u.LastName, u.FirstName, u.Email, u.Phone, u.CountryOfResidence, u.UserRole, u.AuthProvider, u.CreatedAt,
              (SELECT COUNT(*) FROM InsurancePolicies p WHERE p.BuyerID = u.UserID) AS PolicyCount,
              (SELECT ISNULL(SUM(pay.TotalPaidUSD),0) FROM Payments pay WHERE pay.UserID = u.UserID AND pay.Status = 'completed') AS TotalContributedUSD
            FROM Users u
            WHERE u.UserID = @UID
          `);
        return res.status(200).json({ success: true, subscribers: result.recordset });
      }

      const pool = await poolPromise;
      const request = pool.request();
      let q = `
        SELECT
          u.UserID, u.LastName, u.FirstName, u.Email, u.Phone, u.CountryOfResidence, u.UserRole,
          u.AuthProvider, u.IsActive, u.CreatedAt,
          (SELECT COUNT(*) FROM InsurancePolicies p WHERE p.BuyerID = u.UserID) AS PolicyCount,
          (SELECT COUNT(*) FROM InsurancePolicies p WHERE p.BuyerID = u.UserID AND p.IsActive = 1) AS ActivePolicyCount,
          (SELECT ISNULL(SUM(pay.TotalPaidUSD),0) FROM Payments pay WHERE pay.UserID = u.UserID AND pay.Status = 'completed') AS TotalContributedUSD
        FROM Users u
        WHERE 1=1
      `;
      if (req.query.country) {
        q += ' AND u.CountryOfResidence = @Country';
        request.input('Country', sql.NVarChar, req.query.country);
      }
      if (req.query.q) {
        q += ` AND (u.LastName LIKE @Q OR u.FirstName LIKE @Q OR u.Email LIKE @Q)`;
        request.input('Q', sql.NVarChar, `%${req.query.q}%`);
      }
      q += ' ORDER BY u.CreatedAt DESC';
      const result = await request.query(q);
      return res.status(200).json({ success: true, subscribers: result.recordset });
    } catch (error) {
      console.error('admin.subscribers:', error);
      return res.status(500).json({ success: false, message: 'Erreur liste souscripteurs.' });
    }
  },
};

export default adminController;
