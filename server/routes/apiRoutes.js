import express from 'express';
import authController from '../controllers/authController.js';
import policyController from '../controllers/policycontroller.js';
import claimController from '../controllers/claimController.js';
import quoteController from '../controllers/quoteController.js';
import paymentController from '../controllers/paymentController.js';
import adminController from '../controllers/adminController.js';
import adminOpsController from '../controllers/adminOpsController.js';
import invoiceController from '../controllers/invoiceController.js';
import hospitalController from '../controllers/hospitalController.js';
import organizationController from '../controllers/organizationController.js';
import messagingWebhookController from '../controllers/messagingWebhookController.js';
import { requireAuth, optionalAuth, requireRole } from '../middleware/authMiddleware.js';
import { rateLimit, verifyTurnstile } from '../middleware/securityMiddleware.js';

const router = express.Router();

// --- AUTH ---
router.get('/auth/config', authController.publicConfig);
router.post('/auth/register', rateLimit({ scope: 'auth-register', max: 8 }), verifyTurnstile, authController.register);
router.post('/auth/phone/verify', rateLimit({ scope: 'phone-verify', max: 12 }), authController.verifyPhone);
router.post('/auth/phone/resend', rateLimit({ scope: 'phone-resend', windowMs: 60 * 1000, max: 3 }), authController.resendPhoneVerification);
router.post('/auth/login', rateLimit({ scope: 'auth-login', max: 10 }), verifyTurnstile, authController.login);
router.post('/auth/google', rateLimit({ scope: 'auth-google', max: 10 }), verifyTurnstile, authController.google);
router.post('/auth/password/forgot', rateLimit({ scope: 'password-forgot', max: 5 }), verifyTurnstile, authController.requestPasswordReset);
router.post('/auth/password/reset', rateLimit({ scope: 'password-reset', max: 10 }), verifyTurnstile, authController.resetPassword);
router.get('/auth/me', requireAuth, authController.me);
router.patch('/auth/profile', requireAuth, authController.updateProfile);
router.patch('/auth/password', requireAuth, authController.changePassword);
router.patch('/auth/avatar', requireAuth, authController.updateAvatar);

// --- ADMIN / DASHBOARD DATA ---
router.get('/admin/stats', requireAuth, adminController.stats);
router.get('/admin/recent-policies', requireAuth, adminController.recentPolicies);
router.get('/admin/beneficiaries', requireAuth, adminController.beneficiaries);
router.get('/admin/subscribers', requireAuth, adminController.subscribers);

// --- ADMIN OPS / VERIFICATION ---
router.get('/admin/health-db', requireAuth, adminOpsController.healthDb);
router.get('/admin/overview', requireAuth, adminOpsController.overview);
router.get('/admin/verify/policy/:policyNumber', requireAuth, adminOpsController.verifyPolicy);
router.get('/admin/verify/beneficiary', requireAuth, adminOpsController.verifyBeneficiary);
router.get('/admin/audit', requireAuth, adminOpsController.auditTrail);
router.patch('/admin/users/:id/role', requireAuth, adminOpsController.updateUserRole);
router.patch('/admin/users/:id/active', requireAuth, adminOpsController.setUserActive);
router.get('/admin/agents', requireAuth, requireRole('admin'), adminOpsController.listAgents);
router.get('/admin/regions', requireAuth, requireRole('admin'), adminOpsController.listRegions);
router.post('/admin/regions', requireAuth, requireRole('admin'), adminOpsController.createRegion);
router.patch('/admin/regions/:id/active', requireAuth, requireRole('admin'), adminOpsController.setRegionActive);
router.get('/admin/regions/:id/agents', requireAuth, requireRole('admin'), adminOpsController.listRegionAgents);
router.put('/admin/users/:id/region', requireAuth, requireRole('admin'), adminOpsController.assignUserRegion);

// --- ADMIN / ORGANISATIONS PARTENAIRES (admin uniquement) ---
router.get('/admin/organizations/types', requireAuth, requireRole('admin'), organizationController.types);
router.get('/admin/organizations', requireAuth, requireRole('admin'), organizationController.list);
router.post('/admin/organizations', requireAuth, requireRole('admin'), organizationController.create);
router.put('/admin/organizations/:id', requireAuth, requireRole('admin'), organizationController.update);
router.patch('/admin/organizations/:id/active', requireAuth, requireRole('admin'), organizationController.setActive);

// --- QUOTES ---
router.post('/quotes', rateLimit({ scope: 'quotes', max: 20 }), verifyTurnstile, optionalAuth, quoteController.create);
router.get('/quotes', requireAuth, quoteController.list);
router.get('/quotes/:quoteNumber', requireAuth, quoteController.getByNumber);
router.patch('/quotes/:quoteNumber/status', requireAuth, requireRole('admin', 'Admin', 'agent', 'Agent', 'underwriter'), quoteController.updateStatus);

// --- POLICIES ---
router.post('/policy/checkout', requireAuth, policyController.checkoutAndIssuePolicy);
router.get('/policy/verify/:policyNumber', policyController.verifyPolicyStatus);
router.get('/policies', requireAuth, policyController.list);
router.get('/policies/:policyNumber', requireAuth, policyController.getOne);
router.patch('/policies/:policyNumber/status', requireAuth, policyController.updateStatus);
router.post('/policies/:policyNumber/renew', requireAuth, policyController.renew);

// --- CLAIMS ---
router.post('/claim/file-claim', requireAuth, claimController.fileNewClaim);
router.get('/claims', requireAuth, claimController.list);
router.get('/claims/:claimNumber', requireAuth, claimController.getOne);
router.patch('/claims/:claimNumber/status', requireAuth, requireRole('admin', 'Admin', 'agent', 'Agent', 'claims_manager'), claimController.updateStatus);

// --- PAYMENTS ---
router.post('/payment/intent', rateLimit({ scope: 'payment-intent', max: 20 }), verifyTurnstile, requireAuth, paymentController.createIntent);
router.get('/payment/billing-profile', requireAuth, paymentController.getBillingProfile);
router.post('/payment/billing-profile/email-verification', requireAuth, paymentController.requestBillingEmailVerification);
router.post('/payment/billing-profile/email-verification/confirm', requireAuth, paymentController.verifyBillingEmail);
router.put('/payment/billing-profile', requireAuth, paymentController.saveBillingProfile);
router.delete('/payment/billing-profile', requireAuth, paymentController.deleteBillingProfile);
router.post('/payment/confirm', requireAuth, paymentController.confirm);
router.get('/payments', requireAuth, paymentController.list);
router.post('/payment/stripe-intent', requireAuth, paymentController.stripeIntentAlias);
router.post('/payment/checkout-success', requireAuth, paymentController.checkoutSuccessAlias);
router.post('/payment/webhook/stripe', paymentController.stripeWebhook);
router.post('/payment/paypal/capture', requireAuth, paymentController.paypalCapture);
router.post('/payment/webhook/paypal', paymentController.paypalWebhook);
router.post('/payment/webhook/pawapay', paymentController.pawapayWebhook);
router.get('/payment/mobile-money/:transactionReference/status', requireAuth, paymentController.mobileMoneyStatus);

// --- MESSAGING WEBHOOKS ---
router.post(
	'/notification/webhook/twilio/status',
	express.urlencoded({ extended: false, limit: '32kb', parameterLimit: 50 }),
	messagingWebhookController.twilioStatus
);

// --- QUITTANCES ARCA (live Payments) ---
router.get('/invoices', requireAuth, invoiceController.list);
router.get('/invoices/:txRef/print', requireAuth, invoiceController.printHtml);
router.get('/invoices/:txRef', requireAuth, invoiceController.getOne);

// --- HÔPITAL / RÉSEAU DE SOINS (public, PIN optionnel) ---
router.get('/hospital/config', hospitalController.config);
router.get('/hospital/verify/:policyNumber', hospitalController.verify);
router.post('/hospital/verify', hospitalController.verify);

export default router;
