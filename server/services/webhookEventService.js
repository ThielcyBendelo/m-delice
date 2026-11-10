import { sql, poolPromise } from '../config/dbConfig.js';

function requestFor(pool, transaction) {
  return transaction ? new sql.Request(transaction) : pool.request();
}

function toJson(value) {
  if (value == null) return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

async function updateStatus(webhookEventId, {
  status,
  lastError,
  nextRetryAt = null,
  processed = false,
  transaction = null,
}) {
  if (!webhookEventId) {
    throw new TypeError('webhookEventId is required.');
  }

  const pool = transaction ? null : await poolPromise;
  const result = await requestFor(pool, transaction)
    .input('WebhookEventID', sql.BigInt, webhookEventId)
    .input('Status', sql.NVarChar, status)
    .input('LastError', sql.NVarChar, lastError)
    .input('NextRetryAt', sql.DateTime2, nextRetryAt)
    .input('Processed', sql.Bit, processed ? 1 : 0)
    .query(`
      UPDATE WebhookEvents
      SET Status = @Status,
          LastError = @LastError,
          NextRetryAt = @NextRetryAt,
          ProcessedAt = CASE WHEN @Processed = 1 THEN SYSUTCDATETIME() ELSE ProcessedAt END,
          UpdatedAt = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE WebhookEventID = @WebhookEventID
    `);

  return result.recordset[0] || null;
}

const webhookEventService = {
  async receive({
    provider,
    providerEventId,
    eventType,
    transactionReference = null,
    signatureVerified = false,
    payload = null,
  }, { transaction = null } = {}) {
    if (!provider || !providerEventId || !eventType) {
      throw new TypeError('provider, providerEventId and eventType are required.');
    }

    const pool = transaction ? null : await poolPromise;
    const result = await requestFor(pool, transaction)
      .input('Provider', sql.NVarChar, String(provider).toLowerCase())
      .input('ProviderEventID', sql.NVarChar, providerEventId)
      .input('EventType', sql.NVarChar, eventType)
      .input('TransactionReference', sql.NVarChar, transactionReference)
      .input('SignatureVerified', sql.Bit, signatureVerified ? 1 : 0)
      .input('PayloadJson', sql.NVarChar(sql.MAX), toJson(payload))
      .query(`
        DECLARE @IsDuplicate BIT = 0;

        IF EXISTS (
          SELECT 1
          FROM WebhookEvents WITH (UPDLOCK, HOLDLOCK)
          WHERE Provider = @Provider AND ProviderEventID = @ProviderEventID
        )
        BEGIN
          SET @IsDuplicate = 1;
        END
        ELSE
        BEGIN
          INSERT INTO WebhookEvents
            (Provider, ProviderEventID, EventType, TransactionReference, SignatureVerified,
             Status, PayloadJson)
          VALUES
            (@Provider, @ProviderEventID, @EventType, @TransactionReference, @SignatureVerified,
             'received', @PayloadJson);
        END

        SELECT *, @IsDuplicate AS IsDuplicate
        FROM WebhookEvents
        WHERE Provider = @Provider AND ProviderEventID = @ProviderEventID;
      `);

    return result.recordset[0];
  },

  async claimForProcessing(webhookEventId, { transaction = null } = {}) {
    if (!webhookEventId) {
      throw new TypeError('webhookEventId is required.');
    }

    const pool = transaction ? null : await poolPromise;
    const result = await requestFor(pool, transaction)
      .input('WebhookEventID', sql.BigInt, webhookEventId)
      .query(`
        UPDATE WebhookEvents WITH (ROWLOCK)
        SET Status = 'processing',
            AttemptCount = AttemptCount + 1,
            LastError = NULL,
            NextRetryAt = NULL,
            UpdatedAt = SYSUTCDATETIME()
        OUTPUT INSERTED.*
        WHERE WebhookEventID = @WebhookEventID
          AND (
            Status IN ('received', 'failed')
            OR (Status = 'processing' AND UpdatedAt < DATEADD(minute, -5, SYSUTCDATETIME()))
          )
      `);

    return result.recordset[0] || null;
  },

  async markProcessed(webhookEventId, { transaction = null } = {}) {
    return updateStatus(webhookEventId, {
      status: 'processed',
      lastError: null,
      processed: true,
      transaction,
    });
  },

  async markFailed(webhookEventId, error, { nextRetryAt = null, transaction = null } = {}) {
    return updateStatus(webhookEventId, {
      status: 'failed',
      lastError: error instanceof Error ? error.message : String(error || 'Unknown webhook error'),
      nextRetryAt,
      transaction,
    });
  },
};

export default webhookEventService;