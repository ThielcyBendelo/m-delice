import { sql, poolPromise } from '../config/dbConfig.js';
import auditService from '../services/auditService.js';
import notificationService from '../services/notificationService.js';
import { annualLimit, endDatePlusOneYear, ARCA_TAX_RATE } from '../services/policyHelpers.js';

const SIMULATION = String(process.env.PAYMENT_SIMULATION || 'true').toLowerCase() !== 'false';

/**
 * Active une police après paiement confirmé (utilisé par webhook / confirm)
 */
async function activatePolicyAfterPayment({
  pool,
  transaction,
  policyId,
  transactionReference,
  gateway,
  amountUSD,
  currency = 'USD',
  userId = null,
  providerPaymentId = null,
  providerPayload = null,
}) {
  const amount = parseFloat(amountUSD);
  const tax = +(amount * ARCA_TAX_RATE).toFixed(2);
  const total = +(amount + tax).toFixed(2);
  const req = transaction ? new sql.Request(transaction) : pool.request();

  // Enregistrement paiement
  await req
    .input('Tx', sql.NVarChar, transactionReference)
    .input('PID', sql.Int, policyId)
    .input('UID', sql.Int, userId)
    .input('Gateway', sql.NVarChar, gateway)
    .input('Amt', sql.Decimal(12, 2), amount)
    .input('Tax', sql.Decimal(12, 2), tax)
    .input('Total', sql.Decimal(12, 2), total)
    .input('Cur', sql.NVarChar, String(currency).toUpperCase())
    .input('ProviderPaymentId', sql.NVarChar, providerPaymentId)
    .input('ProviderPayload', sql.NVarChar(sql.MAX), providerPayload ? JSON.stringify(providerPayload) : null)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM Payments WHERE TransactionReference = @Tx)
      BEGIN
        INSERT INTO Payments
          (TransactionReference, PolicyID, UserID, GatewayUsed, AmountUSD, TaxArcaUSD, TotalPaidUSD,
           CurrencyReceived, Status, ProviderPaymentId, ProviderPayload, PaidAt)
        VALUES
          (@Tx, @PID, @UID, @Gateway, @Amt, @Tax, @Total, @Cur, 'completed', @ProviderPaymentId, @ProviderPayload, SYSUTCDATETIME())
      END
      ELSE
      BEGIN
        UPDATE Payments
        SET Status = 'completed',
            PaidAt = SYSUTCDATETIME(),
            ProviderPaymentId = COALESCE(@ProviderPaymentId, ProviderPaymentId),
            ProviderPayload = COALESCE(@ProviderPayload, ProviderPayload),
            UpdatedAt = SYSUTCDATETIME()
        WHERE TransactionReference = @Tx
      END
    `);

  const actReq = transaction ? new sql.Request(transaction) : pool.request();
  const activated = await actReq
    .input('PID', sql.Int, policyId)
    .query(`
      UPDATE InsurancePolicies
      SET IsActive = 1,
          Status = 'active',
          UpdatedAt = SYSUTCDATETIME()
      OUTPUT INSERTED.PolicyNumber, INSERTED.PolicyID, INSERTED.BuyerID
      WHERE PolicyID = @PID
    `);

  return activated.recordset[0] || null;
}

const paymentController = {
  /**
   * Crée une intention de paiement + brouillon de police (pending_payment)
   * POST /api/payment/intent
   */
  async createIntent(req, res) {
    const { beneficiary, productDetails, gateway = 'simulation', currency = 'USD', quoteNumber } = req.body || {};

    if (!beneficiary || !productDetails) {
      return res.status(400).json({ success: false, message: 'Bénéficiaire et produit requis.' });
    }
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Authentification requise.' });
    }

    const price = parseFloat(productDetails.price);
    if (!price || price <= 0) {
      return res.status(400).json({ success: false, message: 'Montant invalide.' });
    }

    try {
      const pool = await poolPromise;
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        // Bénéficiaire
        const bResult = await new sql.Request(transaction)
          .input('LastName', sql.NVarChar, beneficiary.lastName?.trim())
          .input('FirstName', sql.NVarChar, beneficiary.firstName?.trim())
          .input('Phone', sql.NVarChar, beneficiary.phone?.trim())
          .input('City', sql.NVarChar, beneficiary.city || null)
          .input('Address', sql.NVarChar, beneficiary.address?.trim() || null)
          .input('NationalID', sql.NVarChar, beneficiary.nationalID || null)
          .query(`
            INSERT INTO Beneficiaries (LastName, FirstName, WhatsAppPhone, City, HomeAddress, NationalID)
            OUTPUT INSERTED.BeneficiaryID
            VALUES (@LastName, @FirstName, @Phone, @City, @Address, @NationalID)
          `);

        const beneficiaryID = bResult.recordset[0].BeneficiaryID;
        const policyNumber = `DRC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        const limit = annualLimit(productDetails.coverageLevel);
        const start = new Date();
        const end = endDatePlusOneYear(start);
        const txRef = `TX-${Date.now()}-${req.user.id}`;

        let quoteId = null;
        if (quoteNumber) {
          const q = await new sql.Request(transaction)
            .input('QN', sql.NVarChar, quoteNumber)
            .query('SELECT QuoteID FROM Quotes WHERE QuoteNumber = @QN');
          quoteId = q.recordset[0]?.QuoteID || null;
        }

        const pResult = await new sql.Request(transaction)
          .input('PolicyNumber', sql.NVarChar, policyNumber)
          .input('BuyerID', sql.Int, req.user.id)
          .input('BeneficiaryID', sql.Int, beneficiaryID)
          .input('Branch', sql.NVarChar, productDetails.branch || 'Santé')
          .input('Level', sql.NVarChar, productDetails.coverageLevel || 'Confort')
          .input('Limit', sql.Decimal(12, 2), limit)
          .input('Premium', sql.Decimal(12, 2), price)
          .input('Start', sql.DateTime2, start)
          .input('End', sql.DateTime2, end)
          .input('QuoteID', sql.Int, quoteId)
          .query(`
            INSERT INTO InsurancePolicies
              (PolicyNumber, BuyerID, BeneficiaryID, InsuranceBranch, CoverageLevel,
               AnnualLimitUSD, RemainingLimitUSD, PremiumUSD, StartDate, EndDate, IsActive, Status, QuoteID)
            OUTPUT INSERTED.PolicyID, INSERTED.PolicyNumber
            VALUES
              (@PolicyNumber, @BuyerID, @BeneficiaryID, @Branch, @Level,
               @Limit, @Limit, @Premium, @Start, @End, 0, 'pending_payment', @QuoteID)
          `);

        const policy = pResult.recordset[0];
        const tax = +(price * ARCA_TAX_RATE).toFixed(2);
        const total = +(price + tax).toFixed(2);

        await new sql.Request(transaction)
          .input('Tx', sql.NVarChar, txRef)
          .input('PID', sql.Int, policy.PolicyID)
          .input('UID', sql.Int, req.user.id)
          .input('Gateway', sql.NVarChar, gateway)
          .input('Amt', sql.Decimal(12, 2), price)
          .input('Tax', sql.Decimal(12, 2), tax)
          .input('Total', sql.Decimal(12, 2), total)
          .input('Cur', sql.NVarChar, String(currency).toUpperCase())
          .query(`
            INSERT INTO Payments
              (TransactionReference, PolicyID, UserID, GatewayUsed, AmountUSD, TaxArcaUSD, TotalPaidUSD, CurrencyReceived, Status)
            VALUES
              (@Tx, @PID, @UID, @Gateway, @Amt, @Tax, @Total, @Cur, 'pending')
          `);

        await transaction.commit();

        // Stripe optionnel
        let clientSecret = null;
        let stripePaymentIntentId = null;
        if (String(gateway).toLowerCase().includes('stripe') && process.env.STRIPE_SECRET_KEY) {
          try {
            const Stripe = (await import('stripe')).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            const intent = await stripe.paymentIntents.create({
              amount: Math.round(total * 100),
              currency: String(currency).toLowerCase(),
              metadata: {
                policyNumber: policy.PolicyNumber,
                transactionReference: txRef,
                userId: String(req.user.id),
              },
              automatic_payment_methods: { enabled: true },
            });
            clientSecret = intent.client_secret;
            stripePaymentIntentId = intent.id;

            await pool.request()
              .input('Tx', sql.NVarChar, txRef)
              .input('Pid', sql.NVarChar, stripePaymentIntentId)
              .query(`UPDATE Payments SET ProviderPaymentId = @Pid, UpdatedAt = SYSUTCDATETIME() WHERE TransactionReference = @Tx`);
          } catch (stripeErr) {
            console.warn('Stripe intent failed, fallback simulation:', stripeErr.message);
          }
        }

        if (!clientSecret && SIMULATION) {
          clientSecret = `sim_secret_${txRef}`;
        }

        await auditService.log({
          actorUserId: req.user.id,
          action: 'payment.intent',
          entityType: 'payment',
          entityId: txRef,
          details: { policyNumber: policy.PolicyNumber, amount: price, gateway },
          ipAddress: req.ip,
        });

        return res.status(201).json({
          success: true,
          transactionReference: txRef,
          policyNumber: policy.PolicyNumber,
          policyId: policy.PolicyID,
          amountUSD: price,
          taxArcaUSD: tax,
          totalUSD: total,
          currency: String(currency).toUpperCase(),
          clientSecret,
          simulation: SIMULATION && !stripePaymentIntentId,
          message: 'Intention de paiement créée. La police sera activée après confirmation.',
        });
      } catch (inner) {
        await transaction.rollback();
        throw inner;
      }
    } catch (error) {
      console.error('payment.createIntent:', error);
      return res.status(500).json({ success: false, message: 'Erreur création intention de paiement.' });
    }
  },

  /**
   * Confirme un paiement (simulation ou post-Stripe client)
   * POST /api/payment/confirm
   * Body: { transactionReference }
   */
  async confirm(req, res) {
    const { transactionReference, providerPayload } = req.body || {};
    if (!transactionReference) {
      return res.status(400).json({ success: false, message: 'transactionReference requis.' });
    }

    try {
      const pool = await poolPromise;
      const payRes = await pool.request()
        .input('Tx', sql.NVarChar, transactionReference)
        .query('SELECT * FROM Payments WHERE TransactionReference = @Tx');

      if (!payRes.recordset.length) {
        return res.status(404).json({ success: false, message: 'Paiement introuvable.' });
      }

      const payment = payRes.recordset[0];

      // Seul le payeur ou un staff peut confirmer
      const role = String(req.user?.role || '').toLowerCase();
      const isStaff = ['admin', 'agent', 'finance'].includes(role);
      if (payment.UserID && payment.UserID !== req.user?.id && !isStaff) {
        return res.status(403).json({ success: false, message: 'Accès refusé.' });
      }

      if (String(payment.Status).toLowerCase() === 'completed') {
        const pol = await pool.request()
          .input('PID', sql.Int, payment.PolicyID)
          .query('SELECT PolicyNumber FROM InsurancePolicies WHERE PolicyID = @PID');
        return res.status(200).json({
          success: true,
          alreadyCompleted: true,
          policyNumber: pol.recordset[0]?.PolicyNumber,
          message: 'Paiement déjà confirmé.',
        });
      }

      // En mode non-simulation sans Stripe webhook, refuser la conf auto sauf staff
      if (!SIMULATION && !isStaff && !String(payment.GatewayUsed || '').toLowerCase().includes('sim')) {
        return res.status(400).json({
          success: false,
          message: 'Confirmation manuelle désactivée. Attendez le webhook du prestataire.',
        });
      }

      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      try {
        const activated = await activatePolicyAfterPayment({
          pool,
          transaction,
          policyId: payment.PolicyID,
          transactionReference,
          gateway: payment.GatewayUsed,
          amountUSD: payment.AmountUSD,
          currency: payment.CurrencyReceived,
          userId: payment.UserID,
          providerPaymentId: payment.ProviderPaymentId,
          providerPayload: providerPayload || { source: 'confirm_endpoint', simulation: SIMULATION },
        });
        await transaction.commit();

        // Notifications
        try {
          const userRow = await pool.request()
            .input('UID', sql.Int, payment.UserID)
            .query('SELECT Email, FirstName FROM Users WHERE UserID = @UID');
          const u = userRow.recordset[0];
          if (u && activated) {
            await notificationService.notifyPolicyIssued({
              userId: payment.UserID,
              email: u.Email,
              policyNumber: activated.PolicyNumber,
            });
          }
        } catch { /* ignore */ }

        await auditService.log({
          actorUserId: req.user?.id,
          action: 'payment.confirm',
          entityType: 'payment',
          entityId: transactionReference,
          details: { policyNumber: activated?.PolicyNumber },
          ipAddress: req.ip,
        });

        return res.status(200).json({
          success: true,
          policyNumber: activated?.PolicyNumber,
          message: 'Paiement confirmé. Police activée.',
        });
      } catch (inner) {
        await transaction.rollback();
        throw inner;
      }
    } catch (error) {
      console.error('payment.confirm:', error);
      return res.status(500).json({ success: false, message: 'Erreur confirmation paiement.' });
    }
  },

  /**
   * Webhook Stripe
   * POST /api/payment/webhook/stripe
   */
  async stripeWebhook(req, res) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    let event = req.body;

    try {
      if (secret && process.env.STRIPE_SECRET_KEY && req.rawBody) {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const sig = req.headers['stripe-signature'];
        event = stripe.webhooks.constructEvent(req.rawBody, sig, secret);
      }
    } catch (err) {
      console.error('Stripe webhook signature failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === 'payment_intent.succeeded') {
        const pi = event.data.object;
        const txRef = pi.metadata?.transactionReference;
        if (txRef) {
          const pool = await poolPromise;
          const payRes = await pool.request()
            .input('Tx', sql.NVarChar, txRef)
            .query('SELECT * FROM Payments WHERE TransactionReference = @Tx');
          const payment = payRes.recordset[0];
          if (payment && String(payment.Status).toLowerCase() !== 'completed') {
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            try {
              const activated = await activatePolicyAfterPayment({
                pool,
                transaction,
                policyId: payment.PolicyID,
                transactionReference: txRef,
                gateway: 'Stripe',
                amountUSD: payment.AmountUSD,
                currency: payment.CurrencyReceived,
                userId: payment.UserID,
                providerPaymentId: pi.id,
                providerPayload: pi,
              });
              await transaction.commit();
              await auditService.log({
                action: 'payment.webhook.stripe',
                entityType: 'payment',
                entityId: txRef,
                details: { policyNumber: activated?.PolicyNumber },
              });
            } catch (e) {
              await transaction.rollback();
              throw e;
            }
          }
        }
      }
      return res.json({ received: true });
    } catch (error) {
      console.error('stripeWebhook handler:', error);
      return res.status(500).json({ success: false });
    }
  },

  /**
   * Compat: alias stripe-intent (corrige le double /api du front)
   */
  async stripeIntentAlias(req, res) {
    // Adapte l'ancien payload { amount, currency, metadata }
    const amount = req.body?.amount ?? req.body?.productDetails?.price;
    const currency = req.body?.currency || 'USD';
    const meta = req.body?.metadata || {};

    req.body = {
      gateway: 'stripe',
      currency,
      beneficiary: {
        lastName: meta.beneficiaryName?.split(' ').slice(-1).join(' ') || meta.lastName || 'N/A',
        firstName: meta.beneficiaryName?.split(' ')[0] || meta.firstName || 'N/A',
        phone: meta.beneficiaryPhone || meta.phone || '+243000000000',
        city: meta.city || 'Kinshasa',
        address: meta.address || 'N/A',
        nationalID: meta.nationalID || null,
      },
      productDetails: {
        branch: meta.branch || 'Santé',
        coverageLevel: meta.coverageLevel || meta.packName || 'Confort',
        price: amount,
      },
    };
    return paymentController.createIntent(req, res);
  },

  /**
   * Compat checkout-success → confirm + éventuellement issuance legacy
   */
  async checkoutSuccessAlias(req, res) {
    if (req.body?.transactionReference) {
      return paymentController.confirm(req, res);
    }
    // Si payload complet style policy checkout
    return res.status(400).json({
      success: false,
      message: 'Utilisez /payment/intent puis /payment/confirm avec transactionReference.',
    });
  },

  async list(req, res) {
    try {
      const pool = await poolPromise;
      const role = String(req.user?.role || '').toLowerCase();
      const isStaff = ['admin', 'agent', 'finance'].includes(role);
      const request = pool.request();
      let q = `
        SELECT pay.*, p.PolicyNumber
        FROM Payments pay
        LEFT JOIN InsurancePolicies p ON p.PolicyID = pay.PolicyID
        WHERE 1=1
      `;
      if (!isStaff) {
        q += ' AND pay.UserID = @UID';
        request.input('UID', sql.Int, req.user.id);
      }
      q += ' ORDER BY pay.CreatedAt DESC';
      const result = await request.query(q);
      return res.status(200).json({ success: true, payments: result.recordset });
    } catch (error) {
      console.error('payment.list:', error);
      return res.status(500).json({ success: false, message: 'Erreur liste paiements.' });
    }
  },
};

export default paymentController;
export { activatePolicyAfterPayment };
