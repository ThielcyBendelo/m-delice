import { sql, poolPromise } from '../config/dbConfig.js';
import fs from 'fs';
import path from 'path';

/**
 * File d'attente notifications (email/WhatsApp/SMS) — persistance SQL
 * L'envoi réel peut être branché plus tard (EmailJS, Twilio, etc.)
 */
const notificationService = {
  async enqueue({
    userId = null,
    channel = 'email',
    templateKey = null,
    recipient = null,
    subject = null,
    body = null,
    relatedEntityType = null,
    relatedEntityId = null,
  }) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input('UserID', sql.Int, userId)
        .input('Channel', sql.NVarChar, channel)
        .input('TemplateKey', sql.NVarChar, templateKey)
        .input('Recipient', sql.NVarChar, recipient)
        .input('Subject', sql.NVarChar, subject)
        .input('Body', sql.NVarChar(sql.MAX), body)
        .input('RelatedEntityType', sql.NVarChar, relatedEntityType)
        .input('RelatedEntityId', sql.NVarChar, relatedEntityId != null ? String(relatedEntityId) : null)
        .query(`
          INSERT INTO Notifications
            (UserID, Channel, TemplateKey, Recipient, Subject, Body, Status, RelatedEntityType, RelatedEntityId)
          VALUES
            (@UserID, @Channel, @TemplateKey, @Recipient, @Subject, @Body, 'queued', @RelatedEntityType, @RelatedEntityId)
        `);
      console.log(`📬 Notification queued [${channel}] ${subject || templateKey || ''}`);
    } catch (err) {
      try {
        const fallbackDir = path.join(process.cwd(), 'server', 'data');
        const fallbackFile = path.join(fallbackDir, 'offline-notifications.jsonl');
        fs.mkdirSync(fallbackDir, { recursive: true });
        fs.appendFileSync(
          fallbackFile,
          `${JSON.stringify({
            queuedAt: new Date().toISOString(),
            userId,
            channel,
            templateKey,
            recipient,
            subject,
            body,
            relatedEntityType,
            relatedEntityId,
            reason: err.message || 'sql-unavailable',
          })}\n`,
          'utf8'
        );
        console.warn(`Notification fallback queued locally [${channel}] ${subject || templateKey || ''}`);
      } catch (fallbackErr) {
        console.warn('Notification enqueue failed:', err.message, 'fallback failed:', fallbackErr.message);
      }
    }
  },

  async notifyPolicyIssued({ userId, email, policyNumber, phone }) {
    await this.enqueue({
      userId,
      channel: 'email',
      templateKey: 'policy_issued',
      recipient: email,
      subject: `Police émise ${policyNumber}`,
      body: `Votre police ${policyNumber} est active.`,
      relatedEntityType: 'policy',
      relatedEntityId: policyNumber,
    });
    if (phone) {
      await this.enqueue({
        userId,
        channel: 'whatsapp',
        templateKey: 'policy_issued_wa',
        recipient: phone,
        subject: null,
        body: `ESNAS: Police ${policyNumber} active. Conservez ce numéro pour le tiers-payant.`,
        relatedEntityType: 'policy',
        relatedEntityId: policyNumber,
      });
    }
  },

  async notifyClaimStatus({ userId, email, claimNumber, status }) {
    await this.enqueue({
      userId,
      channel: 'email',
      templateKey: 'claim_status',
      recipient: email,
      subject: `Sinistre ${claimNumber} — ${status}`,
      body: `Le statut de votre sinistre ${claimNumber} est passé à : ${status}.`,
      relatedEntityType: 'claim',
      relatedEntityId: claimNumber,
    });
  },
};

export default notificationService;
