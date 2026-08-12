import { sql, poolPromise } from '../config/dbConfig.js';
import auditService from '../services/auditService.js';

/**
 * Jobs legers d'automatisation (in-process).
 * - Reminders renouvellement polices (J-30 / J-7 / J-1)
 * - Expiration automatique des polices depassees
 *
 * Desactiver: AUTOMATION_ENABLED=false
 * Intervalle minutes: AUTOMATION_INTERVAL_MINUTES=60
 */

let timer = null;
let running = false;

async function ensureNotificationTable(pool) {
  try {
    await pool.request().query('SELECT TOP 1 NotificationID FROM Notifications');
    return true;
  } catch {
    return false;
  }
}

async function queueRenewalReminders(pool) {
  const result = await pool.request().query(`
    SELECT p.PolicyID, p.PolicyNumber, p.EndDate, p.BuyerID, u.Email, u.FirstName,
      DATEDIFF(day, CAST(SYSUTCDATETIME() AS date), CAST(p.EndDate AS date)) AS DaysLeft
    FROM InsurancePolicies p
    JOIN Users u ON u.UserID = p.BuyerID
    WHERE p.IsActive = 1
      AND p.Status = 'active'
      AND DATEDIFF(day, CAST(SYSUTCDATETIME() AS date), CAST(p.EndDate AS date)) IN (30, 7, 1)
  `);

  let created = 0;
  for (const row of result.recordset) {
    const subject = 'Rappel renouvellement police ' + row.PolicyNumber;
    const endIso = new Date(row.EndDate).toISOString().slice(0, 10);
    const body =
      'Bonjour ' +
      (row.FirstName || '') +
      ', votre police ' +
      row.PolicyNumber +
      ' expire dans ' +
      row.DaysLeft +
      ' jour(s) (' +
      endIso +
      ').';

    const exists = await pool
      .request()
      .input('UID', sql.Int, row.BuyerID)
      .input('Subject', sql.NVarChar, subject)
      .query(`
        SELECT TOP 1 NotificationID FROM Notifications
        WHERE UserID = @UID AND Subject = @Subject
          AND CAST(CreatedAt AS date) = CAST(SYSUTCDATETIME() AS date)
      `);
    if (exists.recordset.length) continue;

    try {
      await pool
        .request()
        .input('UID', sql.Int, row.BuyerID)
        .input('Subject', sql.NVarChar, subject)
        .input('Body', sql.NVarChar, body)
        .input('Channel', sql.NVarChar, 'in_app')
        .input('Status', sql.NVarChar, 'queued')
        .input('Recipient', sql.NVarChar, row.Email || null)
        .input('TemplateKey', sql.NVarChar, 'policy_renewal_reminder')
        .input('RelatedEntityType', sql.NVarChar, 'policy')
        .input('RelatedEntityId', sql.NVarChar, row.PolicyNumber)
        .query(`
          INSERT INTO Notifications
            (UserID, Channel, TemplateKey, Recipient, Subject, Body, Status, RelatedEntityType, RelatedEntityId)
          VALUES
            (@UID, @Channel, @TemplateKey, @Recipient, @Subject, @Body, @Status, @RelatedEntityType, @RelatedEntityId)
        `);
      created += 1;
    } catch (e) {
      console.warn('[automation] notification insert:', e.message);
    }
  }
  return created;
}

async function markExpiredPolicies(pool) {
  const result = await pool.request().query(`
    UPDATE InsurancePolicies
    SET Status = 'expired', IsActive = 0, UpdatedAt = SYSUTCDATETIME()
    WHERE IsActive = 1
      AND Status = 'active'
      AND EndDate < SYSUTCDATETIME()
  `);
  return result.rowsAffected?.[0] || 0;
}

export async function runAutomationOnce() {
  if (running) return { skipped: true };
  running = true;
  const started = Date.now();
  try {
    const pool = await poolPromise;
    const hasNotif = await ensureNotificationTable(pool);
    const expired = await markExpiredPolicies(pool);
    const reminders = hasNotif ? await queueRenewalReminders(pool) : 0;

    try {
      await auditService.log({
        actorUserId: null,
        action: 'automation.tick',
        entityType: 'system',
        entityId: null,
        details: { expired, reminders, ms: Date.now() - started },
      });
    } catch {
      // audit optionnel
    }

    if (expired || reminders) {
      console.log('[automation] expired=' + expired + ' reminders=' + reminders);
    }
    return { expired, reminders };
  } catch (error) {
    console.error('[automation] error:', error.message);
    return { error: error.message };
  } finally {
    running = false;
  }
}

export function startAutomationJobs() {
  const minutes = Math.max(5, Number(process.env.AUTOMATION_INTERVAL_MINUTES || 60));
  const ms = minutes * 60 * 1000;
  console.log('[automation] enabled, interval ' + minutes + ' min');
  setTimeout(() => {
    runAutomationOnce();
  }, 15000);
  timer = setInterval(() => {
    runAutomationOnce();
  }, ms);
  if (timer.unref) timer.unref();
  return timer;
}

export function stopAutomationJobs() {
  if (timer) clearInterval(timer);
  timer = null;
}
