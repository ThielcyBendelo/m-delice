import { sql, poolPromise } from '../config/dbConfig.js';
import messageDeliveryService from '../services/messageDeliveryService.js';
import outboxService from '../services/outboxService.js';
import webhookEventService from '../services/webhookEventService.js';

const MESSAGE_STATUSES = new Set([
  'accepted',
  'scheduled',
  'queued',
  'sending',
  'sent',
  'receiving',
  'received',
  'delivered',
  'undelivered',
  'failed',
  'read',
  'canceled',
]);
const FALLBACK_STATUSES = new Set(['failed', 'undelivered']);

function smsFallbackEnabled() {
  return String(process.env.MESSAGING_SMS_FALLBACK || 'disabled').toLowerCase() === 'on_failure';
}

export function shouldRequestSmsFallback(delivery, status) {
  return Boolean(
    delivery
    && delivery.Channel === 'whatsapp'
    && FALLBACK_STATUSES.has(status)
    && smsFallbackEnabled()
  );
}

function requiredConfiguration() {
  const authToken = String(process.env.TWILIO_AUTH_TOKEN || '').trim();
  const callbackUrl = String(process.env.TWILIO_STATUS_CALLBACK_URL || '').trim();
  if (!authToken || !callbackUrl) return null;
  try {
    const url = new URL(callbackUrl);
    if (url.protocol !== 'https:') return null;
    return { authToken, callbackUrl: url.toString() };
  } catch {
    return null;
  }
}

export async function validateTwilioStatusSignature({ authToken, signature, url, params }) {
  const { default: twilio } = await import('twilio');
  return twilio.validateRequest(authToken, signature, url, params);
}

const messagingWebhookController = {
  async twilioStatus(req, res) {
    const config = requiredConfiguration();
    if (!config) {
      return res.status(503).json({ success: false, message: 'Webhook Twilio non configuré.' });
    }

    const signature = String(req.headers['x-twilio-signature'] || '').trim();
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Signature Twilio requise.' });
    }

    const validSignature = await validateTwilioStatusSignature({
      authToken: config.authToken,
      signature,
      url: config.callbackUrl,
      params: req.body || {},
    });
    if (!validSignature) {
      return res.status(403).json({ success: false, message: 'Signature Twilio invalide.' });
    }

    const providerMessageId = String(req.body?.MessageSid || '').trim();
    const status = String(req.body?.MessageStatus || req.body?.SmsStatus || '').trim().toLowerCase();
    if (!/^SM[a-f0-9]{32}$/i.test(providerMessageId) || !MESSAGE_STATUSES.has(status)) {
      return res.status(400).json({ success: false, message: 'Statut Twilio invalide.' });
    }

    const channel = String(req.body?.ChannelPrefix || '').toLowerCase() === 'whatsapp'
      || String(req.body?.To || '').toLowerCase().startsWith('whatsapp:')
      ? 'whatsapp'
      : 'sms';
    let webhookRecord = null;

    try {
      webhookRecord = await webhookEventService.receive({
        provider: 'twilio',
        providerEventId: `${providerMessageId}:${status}`,
        eventType: `message.status.${status}`,
        signatureVerified: true,
        payload: {
          providerMessageId,
          status,
          channel,
          errorCode: req.body?.ErrorCode || null,
        },
      });

      const claimed = await webhookEventService.claimForProcessing(webhookRecord.WebhookEventID);
      if (!claimed) return res.status(204).send();

      const pool = await poolPromise;
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      try {
        const delivery = await messageDeliveryService.updateProviderStatus({
          provider: 'twilio',
          providerMessageId,
          status,
          errorCode: req.body?.ErrorCode || null,
        }, { transaction });

        if (shouldRequestSmsFallback(delivery, status)) {
          await outboxService.enqueue({
            eventType: 'message.sms_fallback.requested',
            aggregateType: 'message_delivery',
            aggregateId: delivery.MessageDeliveryID,
            deduplicationKey: `sms_fallback:${providerMessageId}`,
            payload: {
              messageDeliveryId: delivery.MessageDeliveryID,
              notificationId: delivery.NotificationID,
              reason: status,
            },
          }, { transaction });
          await messageDeliveryService.markFallbackRequested(
            delivery.MessageDeliveryID,
            { transaction }
          );
        }

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }

      await webhookEventService.markProcessed(webhookRecord.WebhookEventID);
      return res.status(204).send();
    } catch (error) {
      if (webhookRecord?.WebhookEventID) {
        try {
          await webhookEventService.markFailed(webhookRecord.WebhookEventID, error);
        } catch (trackingError) {
          console.error('Twilio webhook failure tracking:', trackingError.message);
        }
      }
      console.error('Twilio status webhook:', error.message);
      return res.status(500).json({ success: false });
    }
  },
};

export default messagingWebhookController;