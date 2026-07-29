import express from 'express';
import authController from '../controllers/authController.js';
import policyController from '../controllers/policyController.js';
import claimController from '../controllers/claimController.js';

const router = express.Router();

// --- FLUX AUTHENTIFICATION ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// --- FLUX POLICES D'ASSURANCE (ARCA) ---
router.post('/policy/checkout', policyController.checkoutAndIssuePolicy);
router.get('/policy/verify/:policyNumber', policyController.verifyPolicyStatus);

// --- FLUX SINISTRES (TIERS-PAYANT) ---
router.post('/claim/file-claim', claimController.fileNewClaim);

export default router;
