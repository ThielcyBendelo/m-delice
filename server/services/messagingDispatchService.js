import { sql, poolPromise } from '../config/dbConfig.js';
import messageDeliveryService from './messageDeliveryService.js';
import { createMessagingService } from './messaging/messagingService.js';
import notificationService from './notificationService.js';

const messaging = createMessagingService({ providerName: 'simulation' });

async function requestFor(transaction) {
  if (transaction) return new sql.Request(transaction);
  const pool = await poolPromise;
  return pool.request();
}

async function sendTracked({ notification, channel, send }, { transaction = null } = {}) {
  const existing = await messageDeliveryService.findByNotification(
    notification.NotificationID,
    channel,
    { transaction }
  );
  if (existing) return { delivery: existing, duplicate: true };

  try {
    const result = await send();
    const delivery = await messageDeliveryService.register({
      notificationId: notification.NotificationID,
      provider: result.provider,
      providerMessageId: result.providerMessageId,
      channel,
      status: result.status,
    }, { transaction });
    await notificationService.updateStatus(notification.NotificationID, result.status, { transaction });
    return { delivery, duplicate: false, simulated: result.simulated };
  } catch (error) {
    await notificationService.updateStatus(notification.NotificationID, 'failed', { transaction });
    throw error;
  }
}

const messagingDispatchService = {
  async dispatchPolicyActivated(payload, { transaction = null } = {}) {
    if (!payload?.policyId || !payload?.policyNumber || !payload?.transactionReference) {
      throw new Error('Invalid policy.activated payload.');
    }

    const request = await requestFor(transaction);
    const result = await request
      .input('PolicyID', sql.Int, payload.policyId)
      .input('PolicyNumber', sql.NVarChar, payload.policyNumber)
      .query(`
        SELECT TOP (1)
          p.PolicyID, p.PolicyNumber, p.BuyerID,
          b.WhatsAppPhone, b.FirstName AS BeneficiaryFirstName, b.LastName AS BeneficiaryLastName,
          u.FirstName AS BuyerFirstName, u.LastName AS BuyerLastName
        FROM InsurancePolicies p
        JOIN Beneficiaries b ON b.BeneficiaryID = p.BeneficiaryID
        JOIN Users u ON u.UserID = p.BuyerID
        WHERE p.PolicyID = @PolicyID AND p.PolicyNumber = @PolicyNumber
      `);
    const policy = result.recordset[0];
    if (!policy?.WhatsAppPhone) throw new Error('Policy beneficiary phone is unavailable.');

    const notification = await notificationService.enqueueTracked({
      userId: policy.BuyerID,
      channel: 'whatsapp',
      templateKey: 'policy.issued_v1',
      recipient: policy.WhatsAppPhone,
      body: `ESNAS: la police ${policy.PolicyNumber} est active.`,
      relatedEntityType: 'policy',
      relatedEntityId: policy.PolicyNumber,
      deduplicationKey: `policy.activated:${policy.PolicyID}:whatsapp`,
    }, { transaction });

    return sendTracked({
      notification,
      channel: 'whatsapp',
      send: () => messaging.sendWhatsApp({
        to: policy.WhatsAppPhone,
        templateKey: 'policy.issued_v1',
        templateData: {
          1: `${policy.BeneficiaryFirstName || ''} ${policy.BeneficiaryLastName || ''}`.trim(),
          2: policy.PolicyNumber,
          3: `${policy.BuyerFirstName || ''} ${policy.BuyerLastName || ''}`.trim(),
        },
      }),
    }, { transaction });
  },

  async dispatchSmsFallback(payload, { transaction = null } = {}) {
    if (!payload?.messageDeliveryId || !payload?.notificationId) {
      throw new Error('Invalid message.sms_fallback.requested payload.');
    }

    const request = await requestFor(transaction);
    const result = await request
      .input('MessageDeliveryID', sql.BigInt, payload.messageDeliveryId)
      .input('NotificationID', sql.BigInt, payload.notificationId)
      .query(`
        SELECT TOP (1)
          n.NotificationID, n.UserID, n.Recipient, n.Body,
          n.RelatedEntityType, n.RelatedEntityId
        FROM MessageDeliveries d
        JOIN Notifications n ON n.NotificationID = d.NotificationID
        WHERE d.MessageDeliveryID = @MessageDeliveryID
          AND d.NotificationID = @NotificationID
          AND d.Channel = 'whatsapp'
      `);
    const original = result.recordset[0];
    if (!original?.Recipient) throw new Error('Original WhatsApp delivery is unavailable.');

    const notification = await notificationService.enqueueTracked({
      userId: original.UserID,
      channel: 'sms',
      templateKey: 'policy.issued.sms_fallback_v1',
      recipient: original.Recipient,
      body: original.Body || 'ESNAS: votre police est active.',
      relatedEntityType: original.RelatedEntityType,
      relatedEntityId: original.RelatedEntityId,
      deduplicationKey: `sms_fallback:${payload.messageDeliveryId}`,
    }, { transaction });

    return sendTracked({
      notification,
      channel: 'sms',
      send: () => messaging.sendSms({ to: original.Recipient, body: notification.Body }),
    }, { transaction });
  },
};

export default messagingDispatchService;