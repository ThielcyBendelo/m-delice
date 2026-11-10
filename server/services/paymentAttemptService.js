import { sql, poolPromise } from '../config/dbConfig.js';

function requestFor(pool, transaction) {
  return transaction ? new sql.Request(transaction) : pool.request();
}

function toJson(value) {
  if (value == null) return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

const paymentAttemptService = {
  async record({
    transactionReference,
    provider,
    providerAttemptId = null,
    status = 'pending',
    amount = null,
    currency = null,
    failureCode = null,
    failureMessage = null,
    metadata = null,
  }, { transaction = null } = {}) {
    if (!transactionReference || !provider) {
      throw new TypeError('transactionReference and provider are required.');
    }

    const pool = transaction ? null : await poolPromise;
    const result = await requestFor(pool, transaction)
      .input('TransactionReference', sql.NVarChar, transactionReference)
      .input('Provider', sql.NVarChar, String(provider).toLowerCase())
      .input('ProviderAttemptID', sql.NVarChar, providerAttemptId)
      .input('Status', sql.NVarChar, status)
      .input('Amount', sql.Decimal(12, 2), amount)
      .input('Currency', sql.NVarChar, currency ? String(currency).toUpperCase() : null)
      .input('FailureCode', sql.NVarChar, failureCode)
      .input('FailureMessage', sql.NVarChar, failureMessage)
      .input('MetadataJson', sql.NVarChar(sql.MAX), toJson(metadata))
      .query(`
        INSERT INTO PaymentAttempts
          (TransactionReference, Provider, ProviderAttemptID, Status, Amount, Currency,
           FailureCode, FailureMessage, MetadataJson)
        OUTPUT INSERTED.*
        VALUES
          (@TransactionReference, @Provider, @ProviderAttemptID, @Status, @Amount, @Currency,
           @FailureCode, @FailureMessage, @MetadataJson)
      `);

    return result.recordset[0];
  },

  async updateStatus(paymentAttemptId, {
    status,
    providerAttemptId = null,
    failureCode = null,
    failureMessage = null,
    metadata = null,
  }, { transaction = null } = {}) {
    if (!paymentAttemptId || !status) {
      throw new TypeError('paymentAttemptId and status are required.');
    }

    const pool = transaction ? null : await poolPromise;
    const result = await requestFor(pool, transaction)
      .input('PaymentAttemptID', sql.BigInt, paymentAttemptId)
      .input('Status', sql.NVarChar, status)
      .input('ProviderAttemptID', sql.NVarChar, providerAttemptId)
      .input('FailureCode', sql.NVarChar, failureCode)
      .input('FailureMessage', sql.NVarChar, failureMessage)
      .input('MetadataJson', sql.NVarChar(sql.MAX), toJson(metadata))
      .query(`
        UPDATE PaymentAttempts
        SET Status = @Status,
          ProviderAttemptID = COALESCE(@ProviderAttemptID, ProviderAttemptID),
            FailureCode = @FailureCode,
            FailureMessage = @FailureMessage,
            MetadataJson = COALESCE(@MetadataJson, MetadataJson),
            UpdatedAt = SYSUTCDATETIME()
        OUTPUT INSERTED.*
        WHERE PaymentAttemptID = @PaymentAttemptID
      `);

    return result.recordset[0] || null;
  },
};

export default paymentAttemptService;