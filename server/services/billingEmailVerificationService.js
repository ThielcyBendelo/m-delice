import crypto from 'node:crypto';
import { sql, poolPromise } from '../config/dbConfig.js';
import notificationService from './notificationService.js';

const CODE_PATTERN = /^\d{6}$/;
const COOLDOWN_MS = 60 * 1000;

function secret() {
  const value = String(process.env.EMAIL_VERIFICATION_SECRET || process.env.PHONE_VERIFICATION_SECRET || '');
  if (Buffer.byteLength(value, 'utf8') < 32) throw new Error('Email verification secret is not configured.');
  return value;
}

function hashCode(email, code) {
  return crypto.createHmac('sha256', secret()).update(`billing:${email}:${code}`, 'utf8').digest('hex');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

const billingEmailVerificationService = {
  async request({ userId, email, fullName }) {
    const normalizedEmail = normalizeEmail(email);
    const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const challengeId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const pool = await poolPromise;
    const latest = await pool.request().input('UID', sql.Int, userId)
      .query(`SELECT TOP 1 CreatedAt FROM BillingEmailVerificationChallenges
        WHERE UserID=@UID ORDER BY CreatedAt DESC`);
    if (latest.recordset[0] && Date.now() - new Date(latest.recordset[0].CreatedAt).getTime() < COOLDOWN_MS) {
      throw new Error('Un code de vérification vient déjà d être envoyé. Attendez une minute.');
    }
    await pool.request().input('UID', sql.Int, userId).query(`UPDATE BillingEmailVerificationChallenges
      SET Status=N'cancelled' WHERE UserID=@UID AND Status=N'pending'`);
    await pool.request().input('CID', sql.UniqueIdentifier, challengeId)
      .input('UID', sql.Int, userId).input('Email', sql.NVarChar(255), normalizedEmail)
      .input('Hash', sql.Char(64), hashCode(normalizedEmail, code)).input('ExpiresAt', sql.DateTime2, expiresAt)
      .query(`INSERT INTO BillingEmailVerificationChallenges
        (ChallengeID, UserID, Email, CodeHash, ExpiresAt)
        VALUES (@CID,@UID,@Email,@Hash,@ExpiresAt)`);
    await notificationService.enqueue({
      userId, channel: 'email', templateKey: 'billing_email_verification', recipient: normalizedEmail,
      subject: 'Confirmation de vos informations de facturation ESNAS',
      body: `Bonjour ${fullName || ''},\n\nVotre code de confirmation est ${code}. Il expire dans 10 minutes.\n\nNe partagez jamais ce code.`,
      relatedEntityType: 'user', relatedEntityId: userId,
    });
    return { challengeId, expiresAt };
  },

  async verify({ userId, challengeId, email, code }) {
    if (!CODE_PATTERN.test(String(code || '').trim())) return { valid: false, message: 'Le code doit contenir 6 chiffres.' };
    const normalizedEmail = normalizeEmail(email);
    const pool = await poolPromise;
    const result = await pool.request().input('UID', sql.Int, userId).input('CID', sql.UniqueIdentifier, challengeId)
      .query(`SELECT TOP 1 * FROM BillingEmailVerificationChallenges
        WHERE UserID=@UID AND ChallengeID=@CID`);
    const challenge = result.recordset[0];
    if (!challenge || challenge.Status !== 'pending' || new Date(challenge.ExpiresAt) <= new Date()) {
      return { valid: false, message: 'Le code est invalide ou expiré.' };
    }
    if (challenge.Email !== normalizedEmail) return { valid: false, message: 'L adresse email a changé. Demandez un nouveau code.' };
    if (hashCode(normalizedEmail, code) !== challenge.CodeHash) {
      const attempts = Number(challenge.FailedAttemptCount) + 1;
      await pool.request().input('CID', sql.UniqueIdentifier, challengeId).input('Attempts', sql.TinyInt, attempts)
        .query(`UPDATE BillingEmailVerificationChallenges SET FailedAttemptCount=@Attempts,
          Status=CASE WHEN @Attempts >= MaximumAttempts THEN N'locked' ELSE Status END WHERE ChallengeID=@CID`);
      return { valid: false, message: attempts >= challenge.MaximumAttempts ? 'Trop de tentatives. Demandez un nouveau code.' : 'Code incorrect.' };
    }
    await pool.request().input('CID', sql.UniqueIdentifier, challengeId)
      .query(`UPDATE BillingEmailVerificationChallenges SET Status=N'verified', VerifiedAt=SYSUTCDATETIME() WHERE ChallengeID=@CID`);
    return { valid: true };
  },
};

export default billingEmailVerificationService;