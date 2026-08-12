import { sql, poolPromise } from '../config/dbConfig.js';

try {
  const pool = await poolPromise;
  const result = await pool.request().query('SELECT @@SERVERNAME AS ServerName, DB_NAME() AS DbName, SYSUTCDATETIME() AS UtcNow');
  console.log('✅ DB OK:', result.recordset[0]);

  const tables = await pool.request().query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
  `);
  console.log('📦 Tables:', tables.recordset.map((r) => r.TABLE_NAME).join(', '));
  process.exit(0);
} catch (err) {
  console.error('❌ DB ping failed:', err.message);
  process.exit(1);
}
