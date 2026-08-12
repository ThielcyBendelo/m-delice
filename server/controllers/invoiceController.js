import { sql, poolPromise } from '../config/dbConfig.js';
import auditService from '../services/auditService.js';

function isStaff(user) {
  const role = String(user?.role || '').toLowerCase();
  return ['admin', 'agent', 'finance', 'underwriter', 'claims_manager'].includes(role);
}

function money(n) {
  return Number(n || 0).toFixed(2);
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return String(d);
  }
}

function mapReceipt(row) {
  const status = String(row.Status || '').toLowerCase();
  const issued = status === 'completed';
  return {
    paymentId: row.PaymentID,
    invoiceNo: row.InvoiceNo || `QTC-${row.PaymentID || '0'}`,
    transactionReference: row.TransactionReference,
    policyNumber: row.PolicyNumber,
    policyStatus: row.PolicyStatus,
    buyer: {
      id: row.BuyerID,
      name: [row.BuyerLastName, row.BuyerFirstName].filter(Boolean).join(' '),
      email: row.BuyerEmail,
      country: row.BuyerCountry,
    },
    beneficiary: {
      name: [row.BeneficiaryLastName, row.BeneficiaryFirstName].filter(Boolean).join(' '),
      city: row.BeneficiaryCity,
      phoneMasked: row.WhatsAppPhone
        ? `${String(row.WhatsAppPhone).slice(0, 5)}***`
        : null,
    },
    branch: row.InsuranceBranch,
    coverageLevel: row.CoverageLevel,
    gateway: row.GatewayUsed,
    currency: row.CurrencyReceived || 'USD',
    amountUSD: Number(row.AmountUSD || 0),
    taxArcaUSD: Number(row.TaxArcaUSD || 0),
    totalPaidUSD: Number(row.TotalPaidUSD || 0),
    status: row.Status,
    statusLabel: issued ? 'Émise & Signée' : status === 'pending' ? 'En attente Visa' : row.Status,
    paidAt: row.PaidAt || row.PaymentDate || row.CreatedAt,
    createdAt: row.CreatedAt,
    providerPaymentId: row.ProviderPaymentId || null,
  };
}

function buildReceiptHtml(receipt) {
  const issued = String(receipt.status || '').toLowerCase() === 'completed';
  const stamp = issued ? 'VALIDÉE ARCA / ESNAS' : 'BROUILLON / NON PAYÉE';
  const stampColor = issued ? '#059669' : '#d97706';
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Quittance ${receipt.invoiceNo}</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #f8fafc; }
    .sheet { max-width: 800px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; padding: 28px 32px; position: relative; }
    .head { display: flex; justify-content: space-between; gap: 16px; border-bottom: 3px solid #00A3E0; padding-bottom: 16px; }
    .brand { font-size: 22px; font-weight: 900; letter-spacing: .04em; }
    .brand span { color: #00A3E0; }
    .meta { text-align: right; font-size: 12px; color: #475569; }
    h1 { font-size: 18px; margin: 22px 0 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 16px; }
    .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; background: #f8fafc; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; font-weight: 700; margin-bottom: 6px; }
    .val { font-size: 13px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { font-size: 10px; text-transform: uppercase; color: #64748b; }
    .tot { font-size: 16px; font-weight: 900; color: #00A3E0; }
    .stamp { position: absolute; top: 90px; right: 40px; border: 3px solid ${stampColor}; color: ${stampColor};
      padding: 8px 14px; font-weight: 900; font-size: 12px; transform: rotate(-8deg); opacity: .85; border-radius: 6px; }
    .foot { margin-top: 28px; font-size: 11px; color: #64748b; line-height: 1.5; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
    @media print { body { background: #fff; padding: 0; } .sheet { border: none; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="stamp">${stamp}</div>
    <div class="head">
      <div>
        <div class="brand">ESNAS <span>DRC</span></div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">Quittance de prime · Conformité ARCA</div>
      </div>
      <div class="meta">
        <div><b>N° quittance</b> ${receipt.invoiceNo}</div>
        <div><b>Réf. paiement</b> ${receipt.transactionReference || '—'}</div>
        <div><b>Émise le</b> ${formatDate(receipt.paidAt)}</div>
        <div><b>Police</b> ${receipt.policyNumber || '—'}</div>
      </div>
    </div>
    <h1>Attestation de paiement de prime</h1>
    <div class="grid">
      <div class="box">
        <div class="label">Souscripteur (Diaspora)</div>
        <div class="val">${receipt.buyer?.name || '—'}</div>
        <div class="val" style="font-weight:500;color:#475569">${receipt.buyer?.email || ''}</div>
        <div class="val" style="font-weight:500;color:#475569">${receipt.buyer?.country || ''}</div>
      </div>
      <div class="box">
        <div class="label">Bénéficiaire (RDC)</div>
        <div class="val">${receipt.beneficiary?.name || '—'}</div>
        <div class="val" style="font-weight:500;color:#475569">${receipt.beneficiary?.city || '—'}</div>
        <div class="val" style="font-weight:500;color:#475569">${receipt.beneficiary?.phoneMasked || ''}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Désignation</th>
          <th>Branche</th>
          <th>Niveau</th>
          <th>Montant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Prime d'assurance — police ${receipt.policyNumber || '—'}</td>
          <td>${receipt.branch || '—'}</td>
          <td>${receipt.coverageLevel || '—'}</td>
          <td>${money(receipt.amountUSD)} ${receipt.currency}</td>
        </tr>
        <tr>
          <td colspan="3">Taxe réglementaire ARCA (10%)</td>
          <td>${money(receipt.taxArcaUSD)} ${receipt.currency}</td>
        </tr>
        <tr>
          <td colspan="3" class="tot">Total encaissé</td>
          <td class="tot">${money(receipt.totalPaidUSD)} ${receipt.currency}</td>
        </tr>
      </tbody>
    </table>
    <div class="foot">
      Passerelle : ${receipt.gateway || '—'} · Statut paiement : ${receipt.statusLabel || receipt.status}<br/>
      Document généré électroniquement par la plateforme ESNAS DRC. Conservez cette quittance comme preuve de paiement.
      Vérification police hôpital : chemin public /verification-hopital
    </div>
  </div>
</body>
</html>`;
}

const SELECT_BASE = `
  SELECT
    pay.PaymentID, pay.TransactionReference, pay.GatewayUsed, pay.AmountUSD, pay.TaxArcaUSD,
    pay.TotalPaidUSD, pay.CurrencyReceived, pay.Status, pay.PaidAt, pay.CreatedAt, pay.ProviderPaymentId,
    pay.UserID AS BuyerID,
    CONCAT('QTC-', YEAR(COALESCE(pay.PaidAt, pay.CreatedAt)), '-', RIGHT('000000' + CAST(pay.PaymentID AS VARCHAR(12)), 6)) AS InvoiceNo,
    p.PolicyNumber, p.Status AS PolicyStatus, p.InsuranceBranch, p.CoverageLevel,
    u.FirstName AS BuyerFirstName, u.LastName AS BuyerLastName, u.Email AS BuyerEmail, u.CountryOfResidence AS BuyerCountry,
    b.FirstName AS BeneficiaryFirstName, b.LastName AS BeneficiaryLastName, b.City AS BeneficiaryCity, b.WhatsAppPhone
  FROM Payments pay
  LEFT JOIN InsurancePolicies p ON p.PolicyID = pay.PolicyID
  LEFT JOIN Users u ON u.UserID = pay.UserID
  LEFT JOIN Beneficiaries b ON b.BeneficiaryID = p.BeneficiaryID
`;

const invoiceController = {
  /** GET /api/invoices */
  async list(req, res) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      let q = `${SELECT_BASE} WHERE 1=1`;

      if (!isStaff(req.user)) {
        q += ' AND pay.UserID = @UID';
        request.input('UID', sql.Int, req.user.id);
      }
      if (req.query.status) {
        q += ' AND pay.Status = @Status';
        request.input('Status', sql.NVarChar, req.query.status);
      } else if (req.query.onlyCompleted !== 'false') {
        // par défaut: completed + pending utiles pour le registre
      }
      if (req.query.q) {
        q += ` AND (
          pay.TransactionReference LIKE @Q OR p.PolicyNumber LIKE @Q
          OR u.Email LIKE @Q OR u.LastName LIKE @Q OR u.FirstName LIKE @Q
          OR b.LastName LIKE @Q OR b.FirstName LIKE @Q
          OR CAST(pay.PaymentID AS NVARCHAR(20)) LIKE @Q
        )`;
        request.input('Q', sql.NVarChar, `%${req.query.q}%`);
      }
      q += ' ORDER BY COALESCE(pay.PaidAt, pay.CreatedAt) DESC';

      const result = await request.query(q);
      const invoices = result.recordset.map(mapReceipt);
      return res.status(200).json({ success: true, invoices, count: invoices.length });
    } catch (error) {
      console.error('invoice.list:', error);
      return res.status(500).json({ success: false, message: 'Erreur liste quittances.' });
    }
  },

  /** GET /api/invoices/:txRef */
  async getOne(req, res) {
    try {
      const key = String(req.params.txRef || '').trim();
      if (!key) return res.status(400).json({ success: false, message: 'Référence requise.' });

      const pool = await poolPromise;
      const result = await pool.request()
        .input('Key', sql.NVarChar, key)
        .query(`
          ${SELECT_BASE}
          WHERE pay.TransactionReference = @Key
             OR p.PolicyNumber = @Key
             OR CONCAT('QTC-', YEAR(COALESCE(pay.PaidAt, pay.CreatedAt)), '-', RIGHT('000000' + CAST(pay.PaymentID AS VARCHAR(12)), 6)) = @Key
        `);

      if (!result.recordset.length) {
        return res.status(404).json({ success: false, message: 'Quittance introuvable.' });
      }

      const row = result.recordset[0];
      if (!isStaff(req.user) && Number(row.BuyerID) !== Number(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Accès refusé.' });
      }

      return res.status(200).json({ success: true, invoice: mapReceipt(row) });
    } catch (error) {
      console.error('invoice.getOne:', error);
      return res.status(500).json({ success: false, message: 'Erreur lecture quittance.' });
    }
  },

  /** GET /api/invoices/:txRef/print — HTML imprimable */
  async printHtml(req, res) {
    try {
      const key = String(req.params.txRef || '').trim();
      const pool = await poolPromise;
      const result = await pool.request()
        .input('Key', sql.NVarChar, key)
        .query(`
          ${SELECT_BASE}
          WHERE pay.TransactionReference = @Key
             OR p.PolicyNumber = @Key
             OR CONCAT('QTC-', YEAR(COALESCE(pay.PaidAt, pay.CreatedAt)), '-', RIGHT('000000' + CAST(pay.PaymentID AS VARCHAR(12)), 6)) = @Key
        `);

      if (!result.recordset.length) {
        return res.status(404).send('Quittance introuvable');
      }
      const row = result.recordset[0];
      if (!isStaff(req.user) && Number(row.BuyerID) !== Number(req.user.id)) {
        return res.status(403).send('Accès refusé');
      }

      const receipt = mapReceipt(row);
      try {
        await auditService.log({
          actorUserId: req.user?.id,
          action: 'invoice.print',
          entityType: 'payment',
          entityId: receipt.transactionReference,
          ipAddress: req.ip,
        });
      } catch {
        /* optional */
      }

      const html = buildReceiptHtml(receipt);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch (error) {
      console.error('invoice.printHtml:', error);
      return res.status(500).send('Erreur génération quittance');
    }
  },
};

export default invoiceController;
export { buildReceiptHtml, mapReceipt };
