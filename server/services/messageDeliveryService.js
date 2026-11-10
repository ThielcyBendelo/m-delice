import { sql, poolPromise } from '../config/dbConfig.js';

function requestFor(pool, transaction) {
  return transaction ? new sql.Request(transaction) : pool.request();
}

const messageDeliveryService = {
  async findByNotification(notificationId, channel, { transaction = null } = {}) {
    if (!notificationId || !channel) {
      throw new TypeError('notificationId and channel are required.');
    }

    const pool = transaction ? null : await poolPromise;
    const result = await requestFor(pool, transaction)
      .input('NotificationID', sql.BigInt, notificationId)
      .input('Channel', sql.NVarChar, String(channel).toLowerCase())
      .query(`
        SELECT TOP (1) * FROM MessageDeliveries
        WHERE NotificationID = @NotificationID AND Channel = @Channel
        ORDER BY CreatedAt DESC
      `);

    return result.recordset[0] || null;
  },

  async register({
    notificationId,
    provider,
    providerMessageId,
    channel,
    status = 'accepted',
  }, { transaction = null } = {}) {
    if (!notificationId || !provider || !providerMessageId || !channel) {
      throw new TypeError('notificationId, provider, providerMessageId and channel are required.');
    }

    const pool = transaction ? null : await poolPromise;
    const result = await requestFor(pool, transaction)
      .input('NotificationID', sql.BigInt, notificationId)
      .input('Provider', sql.NVarChar, String(provider).toLowerCase())
      .input('ProviderMessageID', sql.NVarChar, providerMessageId)
      .input('Channel', sql.NVarChar, String(channel).toLowerCase())
      .input('Status', sql.NVarChar, status)
      .query(`
        IF NOT EXISTS (
          SELECT 1 FROM MessageDeliveries WITH (UPDLOCK, HOLDLOCK)
          WHERE Provider = @Provider AND ProviderMessageID = @ProviderMessageID
        )
        BEGIN
          INSERT INTO MessageDeliveries
            (NotificationID, Provider, ProviderMessageID, Channel, Status)
          VALUES
            (@NotificationID, @Provider, @ProviderMessageID, @Channel, @Status);
        END

        SELECT * FROM MessageDeliveries
        WHERE Provider = @Provider AND ProviderMessageID = @ProviderMessageID;
      `);

    return result.recordset[0];
  },

  async updateProviderStatus({
    provider,
    providerMessageId,
    status,
    errorCode = null,
  }, { transaction = null } = {}) {
    if (!provider || !providerMessageId || !status) {
      throw new TypeError('provider, providerMessageId and status are required.');
    }

    const pool = transaction ? null : await poolPromise;
    const result = await requestFor(pool, transaction)
      .input('Provider', sql.NVarChar, String(provider).toLowerCase())
      .input('ProviderMessageID', sql.NVarChar, providerMessageId)
      .input('Status', sql.NVarChar, status)
      .input('ErrorCode', sql.NVarChar, errorCode)
      .query(`
        UPDATE MessageDeliveries
        SET Status = @Status,
            ErrorCode = @ErrorCode,
            UpdatedAt = SYSUTCDATETIME()
        OUTPUT INSERTED.*
        WHERE Provider = @Provider AND ProviderMessageID = @ProviderMessageID
      `);

    return result.recordset[0] || null;
  },

  async markFallbackRequested(messageDeliveryId, { transaction = null } = {}) {
    if (!messageDeliveryId) throw new TypeError('messageDeliveryId is required.');

    const pool = transaction ? null : await poolPromise;
    const result = await requestFor(pool, transaction)
      .input('MessageDeliveryID', sql.BigInt, messageDeliveryId)
      .query(`
        UPDATE MessageDeliveries
        SET FallbackRequestedAt = COALESCE(FallbackRequestedAt, SYSUTCDATETIME()),
            UpdatedAt = SYSUTCDATETIME()
        OUTPUT INSERTED.*
        WHERE MessageDeliveryID = @MessageDeliveryID
      `);

    return result.recordset[0] || null;
  },
};

export default messageDeliveryService;