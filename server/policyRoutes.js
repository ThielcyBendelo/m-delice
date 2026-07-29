import express from 'express';
import claimController from '../controllers/claimController.js';

const router = express.Router();

// Point d'accès pour télé-déclarer un sinistre médical ou auto
router.post('/file-claim', claimController.fileNewClaim);

export default router;
