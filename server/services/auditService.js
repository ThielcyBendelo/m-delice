import { sql, poolPromise } from '../config/dbConfig.js';

/**
 * Journalisation serveur des actions sensibles
 */
const auditService = {
  async log({ actorUserId = null, action, entityType = null, entityId = null, details = null, ipAddress = null }) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input('ActorUserID', sql.Int, actorUserId)
        .input('Action', sql.NVarChar, action)
        .input('EntityType', sql.NVarChar, entityType)
        .input('EntityId', sql.NVarChar, entityId != null ? String(entityId) : null)
        .input('Details', sql.NVarChar(sql.MAX), details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null)
        .input('IpAddress', sql.NVarChar, ipAddress)
        .query(`
          INSERT INTO AuditLogs (ActorUserID, Action, EntityType, EntityId, Details, IpAddress)
          VALUES (@ActorUserID, @Action, @EntityType, @EntityId, @Details, @IpAddress)
        `);
    } catch (err) {
      // Ne jamais faire échouer le flux métier pour un audit
      console.warn('Audit log failed:', err.message);
    }
  },
};

export default auditService;
