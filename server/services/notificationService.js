import { sql, poolPromise } from '../config/dbConfig.js';
import fs from 'fs';
import path from 'path';
import { sendEmail } from './emailService.js';

function requestFor(pool, transaction) {
  return transaction ? new sql.Request(transaction) : pool.request();
}

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
      const inserted = await pool.request()
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
          OUTPUT INSERTED.NotificationID
          VALUES
            (@UserID, @Channel, @TemplateKey, @Recipient, @Subject, @Body, 'queued', @RelatedEntityType, @RelatedEntityId)
        `);
      const notificationId = inserted.recordset[0]?.NotificationID;
      if (channel === 'email' && recipient && notificationId) {
        try {
          const delivery = await sendEmail({ to: recipient, subject: subject || templateKey || 'ESNAS DRC', text: body || '' });
          await notificationService.updateStatus(notificationId, delivery.sent ? 'sent' : 'queued');
        } catch (emailError) {
          await notificationService.updateStatus(notificationId, 'failed').catch(() => {});
          console.error('[email] delivery failed:', emailError.message);
        }
      }
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

  async enqueueTracked({
    userId = null,
    channel,
    templateKey = null,
    recipient,
    subject = null,
    body = null,
    relatedEntityType = null,
    relatedEntityId = null,
    deduplicationKey,
  }, { transaction = null } = {}) {
    if (!channel || !recipient || !deduplicationKey) {
      throw new TypeError('channel, recipient and deduplicationKey are required.');
    }

    const pool = transaction ? null : await poolPromise;
    const result = await requestFor(pool, transaction)
      .input('UserID', sql.Int, userId)
      .input('Channel', sql.NVarChar, channel)
      .input('TemplateKey', sql.NVarChar, templateKey)
      .input('Recipient', sql.NVarChar, recipient)
      .input('Subject', sql.NVarChar, subject)
      .input('Body', sql.NVarChar(sql.MAX), body)
      .input('RelatedEntityType', sql.NVarChar, relatedEntityType)
      .input('RelatedEntityId', sql.NVarChar, relatedEntityId != null ? String(relatedEntityId) : null)
      .input('DeduplicationKey', sql.NVarChar, deduplicationKey)
      .query(`
        IF NOT EXISTS (
          SELECT 1 FROM Notifications WITH (UPDLOCK, HOLDLOCK)
          WHERE DeduplicationKey = @DeduplicationKey
        )
        BEGIN
          INSERT INTO Notifications
            (UserID, Channel, TemplateKey, Recipient, Subject, Body, Status,
             RelatedEntityType, RelatedEntityId, DeduplicationKey)
          VALUES
            (@UserID, @Channel, @TemplateKey, @Recipient, @Subject, @Body, 'queued',
             @RelatedEntityType, @RelatedEntityId, @DeduplicationKey);
        END

        SELECT * FROM Notifications WHERE DeduplicationKey = @DeduplicationKey;
      `);

    return result.recordset[0];
  },

  async updateStatus(notificationId, status, { transaction = null } = {}) {
    if (!notificationId || !status) {
      throw new TypeError('notificationId and status are required.');
    }

    const pool = transaction ? null : await poolPromise;
    const result = await requestFor(pool, transaction)
      .input('NotificationID', sql.BigInt, notificationId)
      .input('Status', sql.NVarChar, status)
      .query(`
        UPDATE Notifications
        SET Status = @Status,
            SentAt = CASE WHEN @Status IN ('sent', 'delivered') THEN COALESCE(SentAt, SYSUTCDATETIME()) ELSE SentAt END
        OUTPUT INSERTED.*
        WHERE NotificationID = @NotificationID
      `);

    return result.recordset[0] || null;
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

  async notifyAuthRegistered({ userId, email, firstName }) {
    await this.enqueue({
      userId,
      channel: 'email',
      templateKey: 'auth_registered',
      recipient: email,
      subject: 'Bienvenue sur ESNAS DRC',
      body: `Bonjour ${firstName || ''},\n\nVotre compte ESNAS DRC a été créé avec succès. Votre adresse email est maintenant associée à votre compte.\n\nPour votre sécurité, ne partagez jamais votre mot de passe.`,
      relatedEntityType: 'user',
      relatedEntityId: userId,
    });
  },

  async notifyAuthLogin({ userId, email, firstName, provider = 'email' }) {
    await this.enqueue({
      userId,
      channel: 'email',
      templateKey: 'auth_login',
      recipient: email,
      subject: 'Nouvelle connexion à votre compte ESNAS DRC',
      body: `Bonjour ${firstName || ''},\n\nUne connexion à votre compte ESNAS DRC vient d'être effectuée avec ${provider}.\n\nSi ce n'était pas vous, réinitialisez immédiatement votre mot de passe et contactez notre support.`,
      relatedEntityType: 'user',
      relatedEntityId: userId,
    });
  },
};

export default notificationService;
