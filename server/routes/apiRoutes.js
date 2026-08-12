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
import { requireAuth, optionalAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- AUTH ---
router.get('/auth/config', authController.publicConfig);
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/google', authController.google);
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

// --- ADMIN / ORGANISATIONS PARTENAIRES (admin uniquement) ---
router.get('/admin/organizations/types', requireAuth, requireRole('admin'), organizationController.types);
router.get('/admin/organizations', requireAuth, requireRole('admin'), organizationController.list);
router.post('/admin/organizations', requireAuth, requireRole('admin'), organizationController.create);
router.put('/admin/organizations/:id', requireAuth, requireRole('admin'), organizationController.update);
router.patch('/admin/organizations/:id/active', requireAuth, requireRole('admin'), organizationController.setActive);

// --- QUOTES ---
router.post('/quotes', optionalAuth, quoteController.create);
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
router.post('/payment/intent', requireAuth, paymentController.createIntent);
router.post('/payment/confirm', requireAuth, paymentController.confirm);
router.get('/payments', requireAuth, paymentController.list);
router.post('/payment/stripe-intent', requireAuth, paymentController.stripeIntentAlias);
router.post('/payment/checkout-success', requireAuth, paymentController.checkoutSuccessAlias);
router.post('/payment/webhook/stripe', paymentController.stripeWebhook);

// --- QUITTANCES ARCA (live Payments) ---
router.get('/invoices', requireAuth, invoiceController.list);
router.get('/invoices/:txRef/print', requireAuth, invoiceController.printHtml);
router.get('/invoices/:txRef', requireAuth, invoiceController.getOne);

// --- HÔPITAL / RÉSEAU DE SOINS (public, PIN optionnel) ---
router.get('/hospital/config', hospitalController.config);
router.get('/hospital/verify/:policyNumber', hospitalController.verify);
router.post('/hospital/verify', hospitalController.verify);

export default router;
