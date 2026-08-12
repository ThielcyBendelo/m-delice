import { sql, poolPromise } from '../config/dbConfig.js';
import auditService from '../services/auditService.js';

function premiumFor(level, branch) {
  const lvl = String(level || '').toLowerCase();
  if (lvl.includes('premium') || lvl.includes('prestige')) return 450;
  if (lvl.includes('confort') || lvl.includes('standard')) return 250;
  if (lvl.includes('essentiel') || lvl.includes('basic')) return 120;
  // fallback santé
  if (String(branch || '').toLowerCase().includes('auto')) return 180;
  return 200;
}

const quoteController = {
  /** Créer un devis (public ou authentifié) */
  async create(req, res) {
    const {
      fullName,
      email,
      phone,
      branch = 'Santé',
      coverageLevel = 'Confort',
      estimatedPremiumUSD,
      notes,
      payload,
    } = req.body || {};

    if (!branch || !coverageLevel) {
      return res.status(400).json({ success: false, message: 'Branche et niveau de couverture requis.' });
    }

    try {
      const pool = await poolPromise;
      const quoteNumber = `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const premium = estimatedPremiumUSD != null
        ? parseFloat(estimatedPremiumUSD)
        : premiumFor(coverageLevel, branch);

      const userId = req.user?.id || null;

      const result = await pool.request()
        .input('QuoteNumber', sql.NVarChar, quoteNumber)
        .input('UserID', sql.Int, userId)
        .input('FullName', sql.NVarChar, fullName || null)
        .input('Email', sql.NVarChar, email || req.user?.email || null)
        .input('Phone', sql.NVarChar, phone || null)
        .input('Branch', sql.NVarChar, branch)
        .input('CoverageLevel', sql.NVarChar, coverageLevel)
        .input('Premium', sql.Decimal(12, 2), premium)
        .input('Notes', sql.NVarChar(sql.MAX), notes || null)
        .input('PayloadJson', sql.NVarChar(sql.MAX), payload ? JSON.stringify(payload) : null)
        .query(`
          INSERT INTO Quotes
            (QuoteNumber, UserID, FullName, Email, Phone, Branch, CoverageLevel, EstimatedPremiumUSD, Status, Notes, PayloadJson)
          OUTPUT INSERTED.*
          VALUES
            (@QuoteNumber, @UserID, @FullName, @Email, @Phone, @Branch, @CoverageLevel, @Premium, 'pending', @Notes, @PayloadJson)
        `);

      const quote = result.recordset[0];
      await auditService.log({
        actorUserId: userId,
        action: 'quote.create',
        entityType: 'quote',
        entityId: quoteNumber,
        ipAddress: req.ip,
      });

      return res.status(201).json({ success: true, quote });
    } catch (error) {
      console.error('quote.create:', error);
      return res.status(500).json({ success: false, message: 'Erreur lors de la création du devis.' });
    }
  },

  /** Liste devis — staff: tous ; client: les siens */
  async list(req, res) {
    try {
      const pool = await poolPromise;
      const role = String(req.user?.role || '').toLowerCase();
      const isStaff = ['admin', 'agent', 'underwriter', 'finance', 'claims_manager'].includes(role);
      const status = req.query.status || null;

      let query = 'SELECT * FROM Quotes WHERE 1=1';
      const request = pool.request();

      if (!isStaff) {
        query += ' AND UserID = @UserID';
        request.input('UserID', sql.Int, req.user.id);
      }
      if (status) {
        query += ' AND Status = @Status';
        request.input('Status', sql.NVarChar, status);
      }
      query += ' ORDER BY CreatedAt DESC';

      const result = await request.query(query);
      return res.status(200).json({ success: true, quotes: result.recordset });
    } catch (error) {
      console.error('quote.list:', error);
      return res.status(500).json({ success: false, message: 'Erreur liste devis.' });
    }
  },

  async getByNumber(req, res) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('QuoteNumber', sql.NVarChar, req.params.quoteNumber.trim())
        .query('SELECT * FROM Quotes WHERE QuoteNumber = @QuoteNumber');

      if (!result.recordset.length) {
        return res.status(404).json({ success: false, message: 'Devis introuvable.' });
      }

      const quote = result.recordset[0];
      const role = String(req.user?.role || '').toLowerCase();
      const isStaff = ['admin', 'agent', 'underwriter', 'finance', 'claims_manager'].includes(role);
      if (!isStaff && quote.UserID && quote.UserID !== req.user?.id) {
        return res.status(403).json({ success: false, message: 'Accès refusé à ce devis.' });
      }

      return res.status(200).json({ success: true, quote });
    } catch (error) {
      console.error('quote.get:', error);
      return res.status(500).json({ success: false, message: 'Erreur lecture devis.' });
    }
  },

  /** Mise à jour statut (staff) */
  async updateStatus(req, res) {
    const { status, notes } = req.body || {};
    const allowed = ['pending', 'contacted', 'accepted', 'rejected', 'converted', 'expired'];
    if (!status || !allowed.includes(String(status).toLowerCase())) {
      return res.status(400).json({ success: false, message: `Statut invalide. Autorisés: ${allowed.join(', ')}` });
    }

    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('QuoteNumber', sql.NVarChar, req.params.quoteNumber.trim())
        .input('Status', sql.NVarChar, String(status).toLowerCase())
        .input('Notes', sql.NVarChar(sql.MAX), notes || null)
        .query(`
          UPDATE Quotes
          SET Status = @Status,
              Notes = COALESCE(@Notes, Notes),
              UpdatedAt = SYSUTCDATETIME()
          OUTPUT INSERTED.*
          WHERE QuoteNumber = @QuoteNumber
        `);

      if (!result.recordset.length) {
        return res.status(404).json({ success: false, message: 'Devis introuvable.' });
      }

      await auditService.log({
        actorUserId: req.user?.id,
        action: 'quote.status',
        entityType: 'quote',
        entityId: req.params.quoteNumber,
        details: { status },
        ipAddress: req.ip,
      });

      return res.status(200).json({ success: true, quote: result.recordset[0] });
    } catch (error) {
      console.error('quote.updateStatus:', error);
      return res.status(500).json({ success: false, message: 'Erreur mise à jour devis.' });
    }
  },
};

export default quoteController;
