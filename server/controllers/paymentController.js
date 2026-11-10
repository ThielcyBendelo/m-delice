import crypto from 'node:crypto';
import { sql, poolPromise } from '../config/dbConfig.js';
import auditService from '../services/auditService.js';
import notificationService from '../services/notificationService.js';
import outboxService from '../services/outboxService.js';
import paymentAttemptService from '../services/paymentAttemptService.js';
import webhookEventService from '../services/webhookEventService.js';
import paypalService from '../services/paypalService.js';
import pawapayService from '../services/pawapayService.js';
import billingEmailVerificationService from '../services/billingEmailVerificationService.js';
import { annualLimit, endDatePlusOneYear, ARCA_TAX_RATE } from '../services/policyHelpers.js';

const SIMULATION = String(process.env.PAYMENT_SIMULATION || 'true').toLowerCase() !== 'false';
const IS_PRODUCTION = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

function billingInput(body) {
  const value = body || {};
  return {
    email: String(value.email || '').trim().toLowerCase().slice(0, 255),
    phone: String(value.phone || '').trim().slice(0, 40),
    fullName: String(value.fullName || '').trim().replace(/\s+/g, ' ').slice(0, 160),
    address: String(value.address || '').trim().slice(0, 300),
    region: String(value.region || '').trim().slice(0, 120),
    city: String(value.city || '').trim().slice(0, 120),
    postalCode: String(value.postalCode || '').trim().slice(0, 24),
    country: String(value.country || 'RDC').trim().slice(0, 80),
  };
}

function validBilling(value) {
  return value.fullName.length >= 3 && value.address.length >= 4 && value.city.length >= 2
    && value.country.length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.email)
    && value.phone.length >= 8;
}

function paymentAttemptStatusFromStripe(status) {
  if (status === 'requires_action') return 'requires_action';
  if (status === 'processing') return 'processing';
  if (status === 'succeeded') return 'succeeded';
  if (status === 'canceled') return 'cancelled';
  return 'pending';
}

function mobileMoneyStatus(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'COMPLETED') return 'completed';
  if (['FAILED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(normalized)) return 'failed';
  return 'pending';
}

function mobileMoneyFailureMessage(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'REJECTED') return 'Le paiement Mobile Money a été refusé par l opérateur.';
  if (normalized === 'EXPIRED') return 'La demande Mobile Money a expiré. Relancez un nouveau paiement.';
  if (normalized === 'CANCELLED') return 'Le paiement Mobile Money a été annulé.';
  return 'Le paiement Mobile Money n’a pas pu être confirmé.';
}

async function notifyMobileMoneyResult(payment, message, success) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('UID', sql.Int, payment.UserID)
      .query('SELECT Email, FirstName FROM Users WHERE UserID=@UID');
    const user = result.recordset[0];
    if (!user?.Email) return;
    await notificationService.enqueue({
      userId: payment.UserID,
      channel: 'email',
      templateKey: success ? 'payment_mobile_money_confirmed' : 'payment_mobile_money_failed',
      recipient: user.Email,
      subject: success ? 'Paiement Mobile Money confirmé' : 'Paiement Mobile Money non confirmé',
      body: `Bonjour ${user.FirstName || ''},\n\n${message}\n\nRéférence : ${payment.TransactionReference}.`,
      relatedEntityType: 'payment',
      relatedEntityId: payment.TransactionReference,
    });
  } catch (error) {
    console.warn('Mobile Money notification:', error.message);
  }
}

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

  const policy = activated.recordset[0] || null;
  if (policy) {
    await outboxService.enqueue({
      eventType: 'policy.activated',
      aggregateType: 'policy',
      aggregateId: policy.PolicyID,
      deduplicationKey: `policy.activated:${transactionReference}`,
      payload: {
        policyId: policy.PolicyID,
        policyNumber: policy.PolicyNumber,
        buyerId: policy.BuyerID,
        transactionReference,
        gateway,
      },
    }, { transaction });
  }

  return policy;
}

const paymentController = {
  /**
   * Crée une intention de paiement + brouillon de police (pending_payment)
   * POST /api/payment/intent
   */
  async createIntent(req, res) {
    const { beneficiary, productDetails, gateway = 'simulation', currency = 'USD', quoteNumber, billingDetails } = req.body || {};
    const normalizedGateway = String(gateway).trim().toLowerCase();

    if (IS_PRODUCTION && (SIMULATION || normalizedGateway === 'simulation')) {
      return res.status(503).json({ success: false, message: 'Les paiements simulés sont désactivés en production.' });
    }
    if (IS_PRODUCTION && normalizedGateway.includes('paypal') && !process.env.PAYPAL_WEBHOOK_ID) {
      return res.status(503).json({ success: false, message: 'La signature PayPal doit être configurée avant la mise en production.' });
    }

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
      if (String(gateway).toLowerCase().includes('mobilemoney')) {
        const existing = await pool.request().input('UID', sql.Int, req.user.id).query(`
          SELECT TOP 1 TransactionReference FROM Payments
          WHERE UserID=@UID AND LOWER(GatewayUsed) LIKE '%mobilemoney%'
            AND Status IN ('pending', 'processing')
            AND CreatedAt >= DATEADD(minute, -20, SYSUTCDATETIME())
          ORDER BY CreatedAt DESC
        `);
        if (existing.recordset[0]) {
          return res.status(409).json({
            success: false,
            message: 'Un paiement Mobile Money est déjà en cours. Attendez sa confirmation ou son expiration avant de recommencer.',
            transactionReference: existing.recordset[0].TransactionReference,
          });
        }
      }
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        const billing = billingInput(billingDetails);
        if (!validBilling(billing)) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'Les informations de facturation sont incomplètes. Renseignez le nom, l adresse et la ville.' });
        }
        const billingVerified = await new sql.Request(transaction)
          .input('UID', sql.Int, req.user.id)
          .input('Email', sql.NVarChar(255), billing.email)
          .query(`SELECT TOP 1 ChallengeID FROM BillingEmailVerificationChallenges
            WHERE UserID=@UID AND Email=@Email AND Status=N'verified'
              AND VerifiedAt >= DATEADD(minute, -30, SYSUTCDATETIME())
            ORDER BY VerifiedAt DESC`);
        if (!billingVerified.recordset.length) {
          await transaction.rollback();
          return res.status(403).json({ success: false, message: 'Confirmez votre adresse email avant de poursuivre le paiement.' });
        }

        const billingResult = await new sql.Request(transaction)
          .input('UserID', sql.Int, req.user.id)
          .input('FullName', sql.NVarChar(160), billing.fullName)
          .input('Email', sql.NVarChar(255), billing.email)
          .input('Phone', sql.NVarChar(40), billing.phone)
          .input('AddressLine', sql.NVarChar(300), billing.address)
          .input('Region', sql.NVarChar(120), billing.region || null)
          .input('City', sql.NVarChar(120), billing.city)
          .input('PostalCode', sql.NVarChar(24), billing.postalCode || null)
          .input('Country', sql.NVarChar(80), billing.country)
          .query(`
            MERGE dbo.BillingProfiles AS target
            USING (SELECT @UserID AS UserID) AS source ON target.UserID = source.UserID
            WHEN MATCHED THEN UPDATE SET FullName=@FullName, Email=@Email, Phone=@Phone, AddressLine=@AddressLine, Region=@Region,
              City=@City, PostalCode=@PostalCode, Country=@Country, UpdatedAt=SYSUTCDATETIME()
            WHEN NOT MATCHED THEN INSERT (UserID, FullName, Email, Phone, AddressLine, Region, City, PostalCode, Country)
              VALUES (@UserID, @FullName, @Email, @Phone, @AddressLine, @Region, @City, @PostalCode, @Country)
            OUTPUT INSERTED.BillingProfileID;
          `);
        const billingProfileId = billingResult.recordset[0]?.BillingProfileID;

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
          .input('BillingProfileID', sql.Int, billingProfileId)
          .input('Cur', sql.NVarChar, String(currency).toUpperCase())
          .query(`
            INSERT INTO Payments
              (TransactionReference, PolicyID, UserID, GatewayUsed, AmountUSD, TaxArcaUSD, TotalPaidUSD, CurrencyReceived, Status, BillingProfileID)
            VALUES
              (@Tx, @PID, @UID, @Gateway, @Amt, @Tax, @Total, @Cur, 'pending', @BillingProfileID)
          `);

        const paymentAttempt = await paymentAttemptService.record({
          transactionReference: txRef,
          provider: gateway,
          status: 'pending',
          amount: total,
          currency,
          metadata: { policyNumber: policy.PolicyNumber },
        }, { transaction });

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
              description: `ESNAS - ${policy.PolicyNumber}`,
              capture_method: 'manual',
              automatic_payment_methods: { enabled: true },
            });
            clientSecret = intent.client_secret;
            stripePaymentIntentId = intent.id;

            await pool.request()
              .input('Tx', sql.NVarChar, txRef)
              .input('Pid', sql.NVarChar, stripePaymentIntentId)
              .query(`UPDATE Payments SET ProviderPaymentId = @Pid, UpdatedAt = SYSUTCDATETIME() WHERE TransactionReference = @Tx`);

            try {
              await paymentAttemptService.updateStatus(paymentAttempt.PaymentAttemptID, {
                status: paymentAttemptStatusFromStripe(intent.status),
                providerAttemptId: stripePaymentIntentId,
                metadata: {
                  policyNumber: policy.PolicyNumber,
                  providerStatus: intent.status,
                  livemode: intent.livemode,
                },
              });
            } catch (trackingErr) {
              console.warn('Payment attempt tracking failed:', trackingErr.message);
            }
          } catch (stripeErr) {
            console.warn('Stripe intent failed, fallback simulation:', stripeErr.message);
            try {
              await paymentAttemptService.updateStatus(paymentAttempt.PaymentAttemptID, {
                status: 'failed',
                failureCode: stripeErr.code || null,
                failureMessage: stripeErr.message,
              });
            } catch (trackingErr) {
              console.warn('Payment attempt failure tracking failed:', trackingErr.message);
            }
          }
        }

        // PayPal optionnel (Orders API v2)
        let paypalApproveUrl = null;
        if (String(gateway).toLowerCase().includes('paypal') && process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
          try {
            const appUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
            const order = await paypalService.createOrder({
              amount: total,
              currency,
              txRef,
              returnUrl: `${appUrl}/paiement/paypal/retour?tx=${txRef}`,
              cancelUrl: `${appUrl}/paiement/paypal/annule?tx=${txRef}`,
            });
            paypalApproveUrl = order.links?.find((l) => l.rel === 'approve')?.href || null;

            await pool.request()
              .input('Tx', sql.NVarChar, txRef)
              .input('Pid', sql.NVarChar, order.id)
              .query(`UPDATE Payments SET ProviderPaymentId = @Pid, UpdatedAt = SYSUTCDATETIME() WHERE TransactionReference = @Tx`);

            await paymentAttemptService.updateStatus(paymentAttempt.PaymentAttemptID, {
              status: 'pending',
              providerAttemptId: order.id,
              metadata: { policyNumber: policy.PolicyNumber, providerStatus: order.status },
            }).catch((e) => console.warn('Payment attempt tracking failed:', e.message));
          } catch (paypalErr) {
            console.warn('PayPal order failed, fallback simulation:', paypalErr.message);
            await paymentAttemptService.updateStatus(paymentAttempt.PaymentAttemptID, {
              status: 'failed',
              failureMessage: paypalErr.message,
            }).catch((e) => console.warn('Payment attempt failure tracking failed:', e.message));
          }
        }

        // Mobile Money optionnel (agrégateur PawaPay: Orange/Airtel/Vodacom M-Pesa)
        let mobileMoneyDepositId = null;
        if (String(gateway).toLowerCase().includes('mobilemoney') && process.env.PAWAPAY_API_TOKEN) {
          const { phoneNumber, provider } = req.body?.mobileMoney || {};
          if (!phoneNumber || !provider) {
            console.warn('Mobile Money intent: phoneNumber/provider manquants, fallback simulation.');
          } else {
            try {
              mobileMoneyDepositId = crypto.randomUUID();
              const deposit = await pawapayService.initiateDeposit({
                depositId: mobileMoneyDepositId,
                amount: total,
                currency,
                phoneNumber,
                provider,
                clientReferenceId: txRef,
                customerMessage: `ESNAS ${policy.PolicyNumber}`.slice(0, 22),
              });

              await pool.request()
                .input('Tx', sql.NVarChar, txRef)
                .input('Pid', sql.NVarChar, mobileMoneyDepositId)
                .query(`UPDATE Payments SET ProviderPaymentId = @Pid, UpdatedAt = SYSUTCDATETIME() WHERE TransactionReference = @Tx`);

              await paymentAttemptService.updateStatus(paymentAttempt.PaymentAttemptID, {
                status: deposit.status === 'REJECTED' ? 'failed' : 'pending',
                providerAttemptId: mobileMoneyDepositId,
                failureMessage: deposit.failureReason?.failureMessage || null,
                metadata: { policyNumber: policy.PolicyNumber, providerStatus: deposit.status },
              }).catch((e) => console.warn('Payment attempt tracking failed:', e.message));
            } catch (mmErr) {
              console.warn('PawaPay deposit failed, fallback simulation:', mmErr.message);
              await paymentAttemptService.updateStatus(paymentAttempt.PaymentAttemptID, {
                status: 'failed',
                failureMessage: mmErr.message,
              }).catch((e) => console.warn('Payment attempt failure tracking failed:', e.message));
              mobileMoneyDepositId = null;
            }
          }
        }

        if (!clientSecret && !paypalApproveUrl && !mobileMoneyDepositId && SIMULATION) {
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
          paypalApproveUrl,
          mobileMoneyDepositId,
          simulation: SIMULATION && !stripePaymentIntentId && !paypalApproveUrl && !mobileMoneyDepositId,
          message: paypalApproveUrl || mobileMoneyDepositId
            ? 'Paiement préparé. Suivez les instructions du prestataire pour confirmer la transaction.'
            : 'Autorisation de paiement préparée. Le prestataire vérifie votre moyen de paiement; aucun débit ne sera effectué avant confirmation.',
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
    let signatureVerified = false;

    try {
      if (secret) {
        if (!process.env.STRIPE_SECRET_KEY) {
          return res.status(503).json({ success: false, message: 'Webhook Stripe non configuré.' });
        }
        if (!req.rawBody || !req.headers['stripe-signature']) {
          return res.status(400).json({ success: false, message: 'Signature Stripe requise.' });
        }
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const sig = req.headers['stripe-signature'];
        event = stripe.webhooks.constructEvent(req.rawBody, sig, secret);
        signatureVerified = true;
      }
    } catch (err) {
      console.error('Stripe webhook signature failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (!event?.id || !event?.type) {
      return res.status(400).json({ success: false, message: 'Événement Stripe invalide.' });
    }

    const txRef = event.data?.object?.metadata?.transactionReference || null;
    let webhookRecord = null;

    try {
      webhookRecord = await webhookEventService.receive({
        provider: 'stripe',
        providerEventId: event.id,
        eventType: event.type,
        transactionReference: txRef,
        signatureVerified,
        payload: event,
      });

      const claimed = await webhookEventService.claimForProcessing(webhookRecord.WebhookEventID);
      if (!claimed) {
        return res.json({ received: true, duplicate: true });
      }

      if (event.type === 'payment_intent.succeeded') {
        const pi = event.data.object;
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

      await webhookEventService.markProcessed(webhookRecord.WebhookEventID);
      return res.json({ received: true });
    } catch (error) {
      if (webhookRecord?.WebhookEventID) {
        try {
          await webhookEventService.markFailed(webhookRecord.WebhookEventID, error);
        } catch (trackingErr) {
          console.error('Stripe webhook failure tracking:', trackingErr.message);
        }
      }
      console.error('stripeWebhook handler:', error);
      return res.status(500).json({ success: false });
    }
  },

  /**
   * Capture une commande PayPal après retour d'approbation du client.
   * POST /api/payment/paypal/capture
   * Body: { transactionReference }
   */
  async paypalCapture(req, res) {
    const { transactionReference } = req.body || {};
    if (!transactionReference) {
      return res.status(400).json({ success: false, message: 'transactionReference requis.' });
    }
    try {
      const pool = await poolPromise;
      const payRes = await pool.request()
        .input('Tx', sql.NVarChar, transactionReference)
        .query('SELECT * FROM Payments WHERE TransactionReference = @Tx');
      const payment = payRes.recordset[0];
      if (!payment || !payment.ProviderPaymentId) {
        return res.status(404).json({ success: false, message: 'Commande PayPal introuvable.' });
      }
      if (String(payment.Status).toLowerCase() === 'completed') {
        return res.status(200).json({ success: true, alreadyCompleted: true });
      }

      const capture = await paypalService.captureOrder(payment.ProviderPaymentId);
      if (capture.status !== 'COMPLETED') {
        return res.status(409).json({ success: false, message: `Statut PayPal: ${capture.status}` });
      }

      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      try {
        const activated = await activatePolicyAfterPayment({
          pool,
          transaction,
          policyId: payment.PolicyID,
          transactionReference,
          gateway: 'PayPal',
          amountUSD: payment.AmountUSD,
          currency: payment.CurrencyReceived,
          userId: payment.UserID,
          providerPaymentId: payment.ProviderPaymentId,
          providerPayload: capture,
        });
        await transaction.commit();
        await auditService.log({
          actorUserId: req.user?.id,
          action: 'payment.paypal.capture',
          entityType: 'payment',
          entityId: transactionReference,
          details: { policyNumber: activated?.PolicyNumber },
          ipAddress: req.ip,
        });
        return res.status(200).json({ success: true, policyNumber: activated?.PolicyNumber });
      } catch (e) {
        await transaction.rollback();
        throw e;
      }
    } catch (error) {
      console.error('payment.paypalCapture:', error);
      return res.status(500).json({ success: false, message: 'Erreur capture PayPal.' });
    }
  },

  /**
   * Webhook PayPal
   * POST /api/payment/webhook/paypal
   */
  async paypalWebhook(req, res) {
    const event = req.body;
    let signatureVerified = false;
    let webhookRecord = null;

    try {
      if (IS_PRODUCTION && !process.env.PAYPAL_WEBHOOK_ID) {
        return res.status(503).json({ success: false, message: 'Webhook PayPal non configuré.' });
      }
      if (process.env.PAYPAL_WEBHOOK_ID) {
        signatureVerified = await paypalService.verifyWebhookSignature(req.headers, event);
        if (!signatureVerified) {
          return res.status(400).json({ success: false, message: 'Signature PayPal invalide.' });
        }
      }

      if (!event?.id || !event?.event_type) {
        return res.status(400).json({ success: false, message: 'Événement PayPal invalide.' });
      }

      const resource = event.resource || {};
      const txRef = resource.custom_id || resource.purchase_units?.[0]?.custom_id || null;

      webhookRecord = await webhookEventService.receive({
        provider: 'paypal',
        providerEventId: event.id,
        eventType: event.event_type,
        transactionReference: txRef,
        signatureVerified,
        payload: event,
      });

      const claimed = await webhookEventService.claimForProcessing(webhookRecord.WebhookEventID);
      if (!claimed) return res.json({ received: true, duplicate: true });

      if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED' && txRef) {
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
              gateway: 'PayPal',
              amountUSD: payment.AmountUSD,
              currency: payment.CurrencyReceived,
              userId: payment.UserID,
              providerPaymentId: resource.id,
              providerPayload: resource,
            });
            await transaction.commit();
            await auditService.log({
              action: 'payment.webhook.paypal',
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

      await webhookEventService.markProcessed(webhookRecord.WebhookEventID);
      return res.json({ received: true });
    } catch (error) {
      if (webhookRecord?.WebhookEventID) {
        await webhookEventService.markFailed(webhookRecord.WebhookEventID, error).catch(() => {});
      }
      console.error('paypalWebhook handler:', error);
      return res.status(500).json({ success: false });
    }
  },

  /**
   * Callback PawaPay (agrégateur Mobile Money)
   * POST /api/payment/webhook/pawapay
   */
  async pawapayWebhook(req, res) {
    const event = req.body;
    let webhookRecord = null;

    try {
      const depositId = event?.depositId;
      const status = event?.status;
      const webhookSecret = String(process.env.PAWAPAY_WEBHOOK_SECRET || '');
      if (webhookSecret && req.headers['x-esnas-webhook-secret'] !== webhookSecret) {
        return res.status(401).json({ success: false, message: 'Signature du webhook Mobile Money invalide.' });
      }
      if (!depositId || !status) {
        return res.status(400).json({ success: false, message: 'Callback PawaPay invalide.' });
      }

      webhookRecord = await webhookEventService.receive({
        provider: 'pawapay',
        providerEventId: depositId,
        eventType: `deposit.${status}`,
        transactionReference: event.clientReferenceId || null,
        signatureVerified: false,
        payload: event,
      });

      const claimed = await webhookEventService.claimForProcessing(webhookRecord.WebhookEventID);
      if (!claimed) return res.json({ received: true, duplicate: true });

      const paymentStatus = mobileMoneyStatus(status);
      const failureMessage = mobileMoneyFailureMessage(status);
      if (paymentStatus === 'completed' || paymentStatus === 'failed') {
        const pool = await poolPromise;
        const payRes = await pool.request()
          .input('Pid', sql.NVarChar, depositId)
          .query('SELECT * FROM Payments WHERE ProviderPaymentId = @Pid');
        const payment = payRes.recordset[0];
        if (payment && String(payment.Status).toLowerCase() !== 'completed') {
          if (paymentStatus === 'failed') {
            await pool.request()
              .input('PID', sql.Int, payment.PaymentID)
              .input('Message', sql.NVarChar(1000), failureMessage)
              .query(`UPDATE Payments SET Status=N'failed', ProviderPayload=@Message, UpdatedAt=SYSUTCDATETIME()
                WHERE PaymentID=@PID AND Status NOT IN ('completed', 'failed')`);
            const attempt = await pool.request().input('Tx', sql.NVarChar, payment.TransactionReference)
              .query('SELECT TOP 1 PaymentAttemptID FROM PaymentAttempts WHERE TransactionReference=@Tx ORDER BY CreatedAt DESC');
            if (attempt.recordset[0]) {
              await paymentAttemptService.updateStatus(attempt.recordset[0].PaymentAttemptID, {
                status: 'failed', failureMessage,
                metadata: { providerStatus: status, depositId },
              });
            }
            await notifyMobileMoneyResult(payment, failureMessage, false);
          } else {
          const transaction = new sql.Transaction(pool);
          await transaction.begin();
          try {
            const activated = await activatePolicyAfterPayment({
              pool,
              transaction,
              policyId: payment.PolicyID,
              transactionReference: payment.TransactionReference,
              gateway: 'MobileMoney',
              amountUSD: payment.AmountUSD,
              currency: payment.CurrencyReceived,
              userId: payment.UserID,
              providerPaymentId: depositId,
              providerPayload: event,
            });
            await transaction.commit();
            await auditService.log({
              action: 'payment.webhook.pawapay',
              entityType: 'payment',
              entityId: payment.TransactionReference,
              details: { policyNumber: activated?.PolicyNumber },
            });
            await notifyMobileMoneyResult(payment, `Paiement Mobile Money confirmé. Police ${activated?.PolicyNumber || ''}`.trim(), true);
          } catch (e) {
            await transaction.rollback();
            throw e;
          }
          }
        }
      }

      await webhookEventService.markProcessed(webhookRecord.WebhookEventID);
      return res.json({ received: true });
    } catch (error) {
      if (webhookRecord?.WebhookEventID) {
        await webhookEventService.markFailed(webhookRecord.WebhookEventID, error).catch(() => {});
      }
      console.error('pawapayWebhook handler:', error);
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

  async mobileMoneyStatus(req, res) {
    const transactionReference = String(req.params.transactionReference || '').trim();
    if (!transactionReference) return res.status(400).json({ success: false, message: 'Référence de paiement requise.' });
    try {
      const pool = await poolPromise;
      const result = await pool.request().input('Tx', sql.NVarChar, transactionReference)
        .query(`SELECT TOP 1 TransactionReference, Status, GatewayUsed, ProviderPaymentId,
          TotalPaidUSD, CurrencyReceived, CreatedAt, UpdatedAt
          FROM Payments WHERE TransactionReference=@Tx AND UserID=${Number(req.user.id)}`);
      const payment = result.recordset[0];
      if (!payment) return res.status(404).json({ success: false, message: 'Paiement introuvable.' });
      const status = String(payment.Status || '').toLowerCase();
      return res.status(200).json({
        success: true,
        status,
        label: status === 'completed' ? 'Paiement confirmé' : status === 'failed' ? 'Paiement refusé ou expiré' : 'Paiement en attente de confirmation opérateur',
        payment: { transactionReference: payment.TransactionReference, total: payment.TotalPaidUSD, currency: payment.CurrencyReceived, createdAt: payment.CreatedAt, updatedAt: payment.UpdatedAt },
      });
    } catch (error) {
      console.error('payment.mobileMoneyStatus:', error);
      return res.status(503).json({ success: false, message: 'Le statut Mobile Money est temporairement indisponible.' });
    }
  },

  async getBillingProfile(req, res) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('UID', sql.Int, req.user.id)
        .query(`SELECT BillingProfileID, FullName, Email AS email, Phone AS phone, AddressLine AS address, Region AS region,
          City AS city, PostalCode AS postalCode, Country AS country, UpdatedAt
          FROM BillingProfiles WHERE UserID = @UID`);
      return res.status(200).json({ success: true, billingProfile: result.recordset[0] || null });
    } catch (error) {
      console.error('payment.billing.get:', error);
      return res.status(503).json({ success: false, message: 'Les informations de facturation sont temporairement indisponibles.' });
    }
  },

  async requestBillingEmailVerification(req, res) {
    const billing = billingInput(req.body);
    if (!validBilling(billing)) return res.status(400).json({ success: false, message: 'Renseignez un email, un téléphone et les informations de facturation valides.' });
    try {
      const result = await billingEmailVerificationService.request({ userId: req.user.id, email: billing.email, fullName: billing.fullName });
      return res.status(202).json({ success: true, challengeId: result.challengeId, expiresAt: result.expiresAt, message: 'Un code de confirmation a été envoyé à votre adresse email.' });
    } catch (error) {
      console.error('payment.billing.verify.request:', error);
      return res.status(429).json({ success: false, message: error.message || 'Impossible d envoyer le code de confirmation.' });
    }
  },

  async verifyBillingEmail(req, res) {
    const billing = billingInput(req.body);
    const result = await billingEmailVerificationService.verify({ userId: req.user.id, challengeId: req.body?.challengeId, email: billing.email, code: req.body?.code });
    return res.status(result.valid ? 200 : 400).json({ success: result.valid, message: result.valid ? 'Adresse email confirmée.' : result.message });
  },

  async saveBillingProfile(req, res) {
    const billing = billingInput(req.body);
    if (!validBilling(billing)) {
      return res.status(400).json({ success: false, message: 'Renseignez un nom complet, une adresse et une ville valides.' });
    }
    try {
      const pool = await poolPromise;
      const verified = await pool.request().input('UID', sql.Int, req.user.id)
        .input('Email', sql.NVarChar(255), billing.email)
        .query(`SELECT TOP 1 ChallengeID FROM BillingEmailVerificationChallenges
          WHERE UserID=@UID AND Email=@Email AND Status=N'verified'
            AND VerifiedAt >= DATEADD(minute, -30, SYSUTCDATETIME())
          ORDER BY VerifiedAt DESC`);
      if (!verified.recordset.length) {
        return res.status(403).json({ success: false, message: 'Confirmez votre adresse email avec le code reçu avant d enregistrer ces informations.' });
      }
      const result = await pool.request()
        .input('UserID', sql.Int, req.user.id)
        .input('FullName', sql.NVarChar(160), billing.fullName)
        .input('Email', sql.NVarChar(255), billing.email)
        .input('Phone', sql.NVarChar(40), billing.phone)
        .input('AddressLine', sql.NVarChar(300), billing.address)
        .input('Region', sql.NVarChar(120), billing.region || null)
        .input('City', sql.NVarChar(120), billing.city)
        .input('PostalCode', sql.NVarChar(24), billing.postalCode || null)
        .input('Country', sql.NVarChar(80), billing.country)
        .query(`
          MERGE dbo.BillingProfiles AS target
          USING (SELECT @UserID AS UserID) AS source ON target.UserID = source.UserID
          WHEN MATCHED THEN UPDATE SET FullName=@FullName, Email=@Email, Phone=@Phone, AddressLine=@AddressLine, Region=@Region,
            City=@City, PostalCode=@PostalCode, Country=@Country, UpdatedAt=SYSUTCDATETIME()
          WHEN NOT MATCHED THEN INSERT (UserID, FullName, Email, Phone, AddressLine, Region, City, PostalCode, Country)
            VALUES (@UserID, @FullName, @Email, @Phone, @AddressLine, @Region, @City, @PostalCode, @Country)
          OUTPUT INSERTED.BillingProfileID, INSERTED.FullName, INSERTED.Email AS email, INSERTED.Phone AS phone, INSERTED.AddressLine AS address,
            INSERTED.Region AS region, INSERTED.City AS city, INSERTED.PostalCode AS postalCode,
            INSERTED.Country AS country, INSERTED.UpdatedAt;
        `);
      return res.status(200).json({ success: true, billingProfile: result.recordset[0], message: 'Informations de facturation enregistrées.' });
    } catch (error) {
      console.error('payment.billing.save:', error);
      return res.status(503).json({ success: false, message: 'Impossible d enregistrer les informations de facturation pour le moment.' });
    }
  },

  async deleteBillingProfile(req, res) {
    try {
      const pool = await poolPromise;
      await pool.request().input('UID', sql.Int, req.user.id)
        .query('DELETE FROM BillingProfiles WHERE UserID = @UID');
      return res.status(200).json({ success: true, message: 'Informations de facturation supprimées.' });
    } catch (error) {
      console.error('payment.billing.delete:', error);
      return res.status(503).json({ success: false, message: 'Impossible de supprimer les informations de facturation pour le moment.' });
    }
  },
};

export default paymentController;
export { activatePolicyAfterPayment };
