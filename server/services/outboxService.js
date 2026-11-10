import { sql, poolPromise } from '../config/dbConfig.js';

function requestFor(pool, transaction) {
  return transaction ? new sql.Request(transaction) : pool.request();
}

function toJson(value) {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

async function finish(outboxEventId, {
  status,
  lastError,
  availableAt,
  processed,
  transaction,
}) {
  if (!outboxEventId) {
    throw new TypeError('outboxEventId is required.');
  }

  const pool = transaction ? null : await poolPromise;
  const result = await requestFor(pool, transaction)
    .input('OutboxEventID', sql.UniqueIdentifier, outboxEventId)
    .input('Status', sql.NVarChar, status)
    .input('LastError', sql.NVarChar, lastError)
    .input('AvailableAt', sql.DateTime2, availableAt)
    .input('Processed', sql.Bit, processed ? 1 : 0)
    .query(`
      UPDATE OutboxEvents
      SET Status = @Status,
          LastError = @LastError,
          AvailableAt = COALESCE(@AvailableAt, AvailableAt),
          LockedAt = NULL,
          LockedBy = NULL,
          ProcessedAt = CASE WHEN @Processed = 1 THEN SYSUTCDATETIME() ELSE ProcessedAt END,
          UpdatedAt = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE OutboxEventID = @OutboxEventID
    `);

  return result.recordset[0] || null;
}

const outboxService = {
  async enqueue({
    eventType,
    aggregateType,
    aggregateId,
    payload,
    deduplicationKey = null,
    availableAt = null,
  }, { transaction = null } = {}) {
    if (!eventType || !aggregateType || aggregateId == null || payload == null) {
      throw new TypeError('eventType, aggregateType, aggregateId and payload are required.');
    }

    const pool = transaction ? null : await poolPromise;
    const result = await requestFor(pool, transaction)
      .input('EventType', sql.NVarChar, eventType)
      .input('AggregateType', sql.NVarChar, aggregateType)
      .input('AggregateID', sql.NVarChar, String(aggregateId))
      .input('DeduplicationKey', sql.NVarChar, deduplicationKey)
      .input('PayloadJson', sql.NVarChar(sql.MAX), toJson(payload))
      .input('AvailableAt', sql.DateTime2, availableAt)
      .query(`
        DECLARE @IsDuplicate BIT = 0;
        DECLARE @EventID UNIQUEIDENTIFIER;
        DECLARE @InsertedEvents TABLE (OutboxEventID UNIQUEIDENTIFIER);

        IF @DeduplicationKey IS NOT NULL
           AND EXISTS (
             SELECT 1
             FROM OutboxEvents WITH (UPDLOCK, HOLDLOCK)
             WHERE DeduplicationKey = @DeduplicationKey
           )
        BEGIN
          SET @IsDuplicate = 1;
          SELECT @EventID = OutboxEventID
          FROM OutboxEvents
          WHERE DeduplicationKey = @DeduplicationKey;
        END
        ELSE
        BEGIN
          INSERT INTO OutboxEvents
            (EventType, AggregateType, AggregateID, DeduplicationKey, PayloadJson, Status, AvailableAt)
          OUTPUT INSERTED.OutboxEventID INTO @InsertedEvents
          VALUES
            (@EventType, @AggregateType, @AggregateID, @DeduplicationKey,
             @PayloadJson, 'pending', COALESCE(@AvailableAt, SYSUTCDATETIME()));

          SELECT @EventID = OutboxEventID FROM @InsertedEvents;
        END

        SELECT *, @IsDuplicate AS IsDuplicate
        FROM OutboxEvents
        WHERE OutboxEventID = @EventID;
      `);

    return result.recordset[0];
  },

  async claimNext(workerId, { transaction = null } = {}) {
    if (!workerId) {
      throw new TypeError('workerId is required.');
    }

    const pool = transaction ? null : await poolPromise;
    const result = await requestFor(pool, transaction)
      .input('WorkerID', sql.NVarChar, workerId)
      .query(`
        ;WITH NextEvent AS (
          SELECT TOP (1) *
          FROM OutboxEvents WITH (UPDLOCK, READPAST, ROWLOCK)
          WHERE Status IN ('pending', 'failed')
            AND AvailableAt <= SYSUTCDATETIME()
          ORDER BY AvailableAt, CreatedAt
        )
        UPDATE NextEvent
        SET Status = 'processing',
            AttemptCount = AttemptCount + 1,
            LockedAt = SYSUTCDATETIME(),
            LockedBy = @WorkerID,
            UpdatedAt = SYSUTCDATETIME()
        OUTPUT INSERTED.*;
      `);

    return result.recordset[0] || null;
  },

  async markProcessed(outboxEventId, { transaction = null } = {}) {
    return finish(outboxEventId, {
      status: 'processed',
      lastError: null,
      availableAt: null,
      processed: true,
      transaction,
    });
  },

  async markFailed(outboxEventId, error, {
    availableAt,
    deadLetter = false,
    transaction = null,
  } = {}) {
    if (!deadLetter && !availableAt) {
      throw new TypeError('availableAt is required when retrying an Outbox event.');
    }

    return finish(outboxEventId, {
      status: deadLetter ? 'dead_letter' : 'failed',
      lastError: error instanceof Error ? error.message : String(error || 'Unknown Outbox error'),
      availableAt,
      processed: false,
      transaction,
    });
  },
};

export default outboxService;