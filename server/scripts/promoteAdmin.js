/**
 * Promote un utilisateur en admin (SQL).
 * Usage:
 *   node server/scripts/promoteAdmin.js email@example.com
 *   node server/scripts/promoteAdmin.js email@example.com agent
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sql, poolPromise } from '../config/dbConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const email = String(process.argv[2] || '').trim().toLowerCase();
const role = String(process.argv[3] || 'admin').trim();
const allowed = ['admin', 'agent', 'underwriter', 'finance', 'claims_manager', 'Diaspora', 'Client', 'Partner', 'Hospital'];

if (!email) {
  console.error('Usage: node server/scripts/promoteAdmin.js <email> [role=admin]');
  process.exit(1);
}
if (!allowed.includes(role)) {
  console.error('Role invalide. Autorises:', allowed.join(', '));
  process.exit(1);
}

try {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Email', sql.NVarChar, email)
    .input('Role', sql.NVarChar, role)
    .query(`
      UPDATE Users
      SET UserRole = @Role, IsActive = 1, UpdatedAt = SYSUTCDATETIME()
      OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.UserRole, INSERTED.IsActive
      WHERE Email = @Email
    `);
  if (!result.recordset.length) {
    console.error('Utilisateur introuvable:', email);
    process.exit(2);
  }
  console.log('OK:', result.recordset[0]);
  process.exit(0);
} catch (e) {
  console.error('FAIL:', e.message);
  process.exit(1);
}
