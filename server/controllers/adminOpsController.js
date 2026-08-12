import { sql, poolPromise, buildDbConfig } from '../config/dbConfig.js';
import auditService from '../services/auditService.js';

function isStaff(user) {
  const role = String(user?.role || '').toLowerCase();
  return ['admin', 'agent', 'underwriter', 'finance', 'claims_manager'].includes(role);
}

function maskPhone(phone) {
  if (!phone) return null;
  const s = String(phone);
  if (s.length <= 6) return '***';
  return `${s.slice(0, 5)}***${s.slice(-2)}`;
}

function maskNationalId(nid) {
  if (!nid) return null;
  const s = String(nid);
  if (s.length <= 4) return '****';
  return `${'*'.repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
}

const adminOpsController = {
  /** GET /admin/health-db — diagnostic SQL + schéma attendu */
  async healthDb(req, res) {
    try {
      if (!isStaff(req.user)) {
        return res.status(403).json({ success: false, message: 'Acces staff requis.' });
      }
      const pool = await poolPromise;
      const meta = await pool.request().query(`
        SELECT @@SERVERNAME AS ServerName, DB_NAME() AS DbName, SYSUTCDATETIME() AS UtcNow,
               CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(64)) AS ClientNet
      `);
      const tables = await pool.request().query(`
        SELECT t.name AS TableName, SUM(p.rows) AS ApproxRows
        FROM sys.tables t
        JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0,1)
        WHERE t.is_ms_shipped = 0
        GROUP BY t.name
        ORDER BY t.name
      `);
      const cols = await pool.request().query(`
        SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME IN ('Users','Beneficiaries','InsurancePolicies','Payments','Claims','Quotes','Notifications','AuditLogs')
        ORDER BY TABLE_NAME, ORDINAL_POSITION
      `);
      const expected = {
        Users: ['UserID', 'Email', 'PasswordHash', 'UserRole', 'AuthProvider', 'GoogleSub', 'AvatarUrl', 'IsActive'],
        Beneficiaries: ['BeneficiaryID', 'LastName', 'FirstName', 'WhatsAppPhone', 'City', 'NationalID'],
        InsurancePolicies: ['PolicyID', 'PolicyNumber', 'BuyerID', 'BeneficiaryID', 'Status', 'IsActive', 'RemainingLimitUSD'],
        Payments: ['PaymentID', 'TransactionReference', 'PolicyID', 'Status', 'TotalPaidUSD'],
        Claims: ['ClaimID', 'ClaimNumber', 'PolicyID', 'ClaimStatus', 'EstimatedCostUSD'],
      };
      const present = {};
      for (const row of cols.recordset) {
        present[row.TABLE_NAME] = present[row.TABLE_NAME] || new Set();
        present[row.TABLE_NAME].add(row.COLUMN_NAME);
      }
      const schemaCheck = {};
      for (const [table, need] of Object.entries(expected)) {
        const have = present[table] || new Set();
        schemaCheck[table] = {
          exists: have.size > 0,
          missing: need.filter((c) => !have.has(c)),
        };
      }
      const cfg = buildDbConfig();
      return res.status(200).json({
        success: true,
        connection: meta.recordset[0],
        config: { server: cfg.server, instanceName: cfg.instanceName || null, database: cfg.database, trusted: cfg.trusted },
        tables: tables.recordset,
        schemaCheck,
      });
    } catch (error) {
      console.error('admin.healthDb:', error);
      return res.status(500).json({ success: false, message: error.message || 'Erreur health DB.' });
    }
  },

  /** GET /admin/overview — agrégats opérationnels staff */
  async overview(req, res) {
    try {
      if (!isStaff(req.user)) {
        return res.status(403).json({ success: false, message: 'Acces staff requis.' });
      }
      const pool = await poolPromise;
      const [byStatus, byCity, recentClaims, pendingPay] = await Promise.all([
        pool.request().query(`
          SELECT Status, COUNT(*) AS Cnt
          FROM InsurancePolicies GROUP BY Status ORDER BY Cnt DESC
        `),
        pool.request().query(`
          SELECT TOP 10 ISNULL(b.City, N'Sans ville') AS City, COUNT(*) AS Cnt
          FROM Beneficiaries b
          JOIN InsurancePolicies p ON p.BeneficiaryID = b.BeneficiaryID
          WHERE p.IsActive = 1
          GROUP BY b.City ORDER BY Cnt DESC
        `),
        pool.request().query(`
          SELECT TOP 10 c.ClaimNumber, c.ClaimStatus, c.EstimatedCostUSD, c.CreatedAt,
                 p.PolicyNumber, b.FirstName, b.LastName, b.City
          FROM Claims c
          JOIN InsurancePolicies p ON p.PolicyID = c.PolicyID
          JOIN Beneficiaries b ON b.BeneficiaryID = p.BeneficiaryID
          ORDER BY c.CreatedAt DESC
        `),
        pool.request().query(`
          SELECT TOP 10 pay.TransactionReference, pay.TotalPaidUSD, pay.Status, pay.CreatedAt,
                 p.PolicyNumber, u.Email
          FROM Payments pay
          LEFT JOIN InsurancePolicies p ON p.PolicyID = pay.PolicyID
          LEFT JOIN Users u ON u.UserID = pay.UserID
          WHERE pay.Status IN ('pending','processing')
          ORDER BY pay.CreatedAt DESC
        `),
      ]);
      return res.status(200).json({
        success: true,
        policiesByStatus: byStatus.recordset,
        beneficiariesByCity: byCity.recordset,
        recentClaims: recentClaims.recordset,
        pendingPayments: pendingPay.recordset,
      });
    } catch (error) {
      console.error('admin.overview:', error);
      return res.status(500).json({ success: false, message: 'Erreur overview admin.' });
    }
  },

  /** GET /admin/verify/policy/:policyNumber — vérification hôpital/admin enrichie */
  async verifyPolicy(req, res) {
    try {
      const policyNumber = String(req.params.policyNumber || '').trim();
      if (!policyNumber) {
        return res.status(400).json({ success: false, message: 'Numero de police requis.' });
      }
      const pool = await poolPromise;
      const result = await pool.request()
        .input('PolicyNumber', sql.NVarChar, policyNumber)
        .query(`
          SELECT
            p.PolicyID, p.PolicyNumber, p.InsuranceBranch, p.CoverageLevel,
            p.AnnualLimitUSD, p.RemainingLimitUSD, p.PremiumUSD,
            p.StartDate, p.EndDate, p.IsActive, p.Status, p.CreatedAt,
            b.BeneficiaryID, b.FirstName AS BeneficiaryFirstName, b.LastName AS BeneficiaryLastName,
            b.WhatsAppPhone, b.City, b.HomeAddress, b.NationalID,
            u.UserID AS BuyerID, u.FirstName AS BuyerFirstName, u.LastName AS BuyerLastName,
            u.Email AS BuyerEmail, u.CountryOfResidence AS BuyerCountry,
            (SELECT COUNT(*) FROM Claims c WHERE c.PolicyID = p.PolicyID) AS ClaimCount,
            (SELECT COUNT(*) FROM Claims c WHERE c.PolicyID = p.PolicyID AND c.ClaimStatus IN ('submitted','under_review')) AS OpenClaimCount,
            (SELECT ISNULL(SUM(pay.TotalPaidUSD),0) FROM Payments pay WHERE pay.PolicyID = p.PolicyID AND pay.Status = 'completed') AS PaidTotalUSD
          FROM InsurancePolicies p
          JOIN Beneficiaries b ON b.BeneficiaryID = p.BeneficiaryID
          JOIN Users u ON u.UserID = p.BuyerID
          WHERE p.PolicyNumber = @PolicyNumber
        `);

      if (!result.recordset.length) {
        return res.status(404).json({ success: false, valid: false, message: 'Contrat introuvable.' });
      }

      const row = result.recordset[0];
      const now = new Date();
      const endOk = new Date(row.EndDate) >= now;
      const startOk = new Date(row.StartDate) <= now;
      const statusOk = String(row.Status || '').toLowerCase() === 'active';
      const activeOk = !!row.IsActive;
      const valid = activeOk && statusOk && endOk && startOk;
      const reasons = [];
      if (!activeOk) reasons.push('is_active_false');
      if (!statusOk) reasons.push('status_not_active');
      if (!endOk) reasons.push('expired');
      if (!startOk) reasons.push('not_started');

      const staff = isStaff(req.user);
      const payload = {
        success: true,
        valid,
        reasons,
        checkedAt: now.toISOString(),
        policy: {
          policyNumber: row.PolicyNumber,
          branch: row.InsuranceBranch,
          coverageLevel: row.CoverageLevel,
          status: row.Status,
          isActive: !!row.IsActive,
          annualLimitUSD: Number(row.AnnualLimitUSD || 0),
          remainingLimitUSD: Number(row.RemainingLimitUSD || 0),
          premiumUSD: Number(row.PremiumUSD || 0),
          startDate: row.StartDate,
          endDate: row.EndDate,
          claimCount: Number(row.ClaimCount || 0),
          openClaimCount: Number(row.OpenClaimCount || 0),
          paidTotalUSD: Number(row.PaidTotalUSD || 0),
        },
        beneficiary: {
          firstName: row.BeneficiaryFirstName,
          lastName: row.BeneficiaryLastName,
          city: row.City,
          phone: staff ? row.WhatsAppPhone : maskPhone(row.WhatsAppPhone),
          nationalId: staff ? row.NationalID : maskNationalId(row.NationalID),
          address: staff ? row.HomeAddress : null,
        },
        buyer: staff
          ? {
              id: row.BuyerID,
              firstName: row.BuyerFirstName,
              lastName: row.BuyerLastName,
              email: row.BuyerEmail,
              country: row.BuyerCountry,
            }
          : {
              country: row.BuyerCountry,
            },
      };

      try {
        await auditService.log({
          actorUserId: req.user?.id || null,
          action: 'admin.verify_policy',
          entityType: 'policy',
          entityId: policyNumber,
          details: { valid, reasons },
          ipAddress: req.ip,
        });
      } catch {
        /* optional */
      }

      return res.status(200).json(payload);
    } catch (error) {
      console.error('admin.verifyPolicy:', error);
      return res.status(500).json({ success: false, message: 'Erreur verification police.' });
    }
  },

  /** GET /admin/verify/beneficiary?q= — recherche bénéficiaire / national ID / phone */
  async verifyBeneficiary(req, res) {
    try {
      if (!isStaff(req.user)) {
        return res.status(403).json({ success: false, message: 'Acces staff requis.' });
      }
      const q = String(req.query.q || req.query.phone || req.query.nationalId || '').trim();
      if (!q || q.length < 3) {
        return res.status(400).json({ success: false, message: 'Critere q trop court (min 3).' });
      }
      const pool = await poolPromise;
      const result = await pool.request()
        .input('Q', sql.NVarChar, `%${q}%`)
        .input('Exact', sql.NVarChar, q)
        .query(`
          SELECT TOP 25
            b.BeneficiaryID, b.LastName, b.FirstName, b.WhatsAppPhone, b.City, b.NationalID, b.HomeAddress,
            p.PolicyNumber, p.Status AS PolicyStatus, p.IsActive, p.RemainingLimitUSD, p.EndDate,
            p.InsuranceBranch, p.CoverageLevel
          FROM Beneficiaries b
          LEFT JOIN InsurancePolicies p ON p.BeneficiaryID = b.BeneficiaryID
          WHERE b.WhatsAppPhone LIKE @Q
             OR b.NationalID LIKE @Q
             OR b.LastName LIKE @Q
             OR b.FirstName LIKE @Q
             OR p.PolicyNumber = @Exact
          ORDER BY p.IsActive DESC, p.EndDate DESC
        `);
      return res.status(200).json({ success: true, matches: result.recordset, count: result.recordset.length });
    } catch (error) {
      console.error('admin.verifyBeneficiary:', error);
      return res.status(500).json({ success: false, message: 'Erreur recherche beneficiaire.' });
    }
  },

  /** PATCH /admin/users/:id/role — promotion rôle (admin only) */
  async updateUserRole(req, res) {
    try {
      const role = String(req.user?.role || '').toLowerCase();
      if (role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin uniquement.' });
      }
      const userId = Number(req.params.id);
      const newRole = String(req.body?.role || '').trim();
      const allowed = ['Diaspora', 'Client', 'Partner', 'Hospital', 'admin', 'agent', 'underwriter', 'finance', 'claims_manager'];
      if (!userId || !allowed.includes(newRole)) {
        return res.status(400).json({ success: false, message: 'role invalide.', allowed });
      }
      const pool = await poolPromise;
      const result = await pool.request()
        .input('UID', sql.Int, userId)
        .input('Role', sql.NVarChar, newRole)
        .query(`
          UPDATE Users SET UserRole = @Role, UpdatedAt = SYSUTCDATETIME()
          OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.UserRole, INSERTED.IsActive
          WHERE UserID = @UID
        `);
      if (!result.recordset.length) {
        return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
      }
      await auditService.log({
        actorUserId: req.user.id,
        action: 'admin.user_role',
        entityType: 'user',
        entityId: userId,
        details: { role: newRole },
        ipAddress: req.ip,
      });
      return res.status(200).json({ success: true, user: result.recordset[0] });
    } catch (error) {
      console.error('admin.updateUserRole:', error);
      return res.status(500).json({ success: false, message: 'Erreur maj role.' });
    }
  },

  /** PATCH /admin/users/:id/active */
  async setUserActive(req, res) {
    try {
      const role = String(req.user?.role || '').toLowerCase();
      if (role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin uniquement.' });
      }
      const userId = Number(req.params.id);
      const active = req.body?.active === true || req.body?.active === 1 || req.body?.active === '1';
      if (!userId) return res.status(400).json({ success: false, message: 'id requis.' });
      if (userId === Number(req.user.id) && !active) {
        return res.status(400).json({ success: false, message: 'Vous ne pouvez pas vous desactiver.' });
      }
      const pool = await poolPromise;
      const result = await pool.request()
        .input('UID', sql.Int, userId)
        .input('Active', sql.Bit, active ? 1 : 0)
        .query(`
          UPDATE Users SET IsActive = @Active, UpdatedAt = SYSUTCDATETIME()
          OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.IsActive, INSERTED.UserRole
          WHERE UserID = @UID
        `);
      if (!result.recordset.length) {
        return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
      }
      await auditService.log({
        actorUserId: req.user.id,
        action: 'admin.user_active',
        entityType: 'user',
        entityId: userId,
        details: { active },
        ipAddress: req.ip,
      });
      return res.status(200).json({ success: true, user: result.recordset[0] });
    } catch (error) {
      console.error('admin.setUserActive:', error);
      return res.status(500).json({ success: false, message: 'Erreur activation user.' });
    }
  },

  /** GET /admin/audit — derniers événements */
  async auditTrail(req, res) {
    try {
      if (!isStaff(req.user)) {
        return res.status(403).json({ success: false, message: 'Acces staff requis.' });
      }
      const pool = await poolPromise;
      const limit = Math.min(200, Math.max(10, Number(req.query.limit || 50)));
      try {
        const result = await pool.request()
          .input('Lim', sql.Int, limit)
          .query(`
            SELECT TOP (@Lim) *
            FROM AuditLogs
            ORDER BY CreatedAt DESC
          `);
        return res.status(200).json({ success: true, logs: result.recordset });
      } catch {
        return res.status(200).json({ success: true, logs: [], message: 'Table AuditLogs absente.' });
      }
    } catch (error) {
      console.error('admin.auditTrail:', error);
      return res.status(500).json({ success: false, message: 'Erreur audit.' });
    }
  },
};

export default adminOpsController;
