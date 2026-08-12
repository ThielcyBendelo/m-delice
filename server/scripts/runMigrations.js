/**
 * Applique les migrations SQL idempotentes du dossier server/migrations
 * Usage: node server/scripts/runMigrations.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sql, poolPromise } from '../config/dbConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../migrations');

function splitBatches(sqlText) {
  // Découpe sur GO en début de ligne (T-SQL batch separator)
  return sqlText
    .split(/^\s*GO\s*$/gim)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);
}

async function ensureMigrationsTable(pool) {
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.SchemaMigrations (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        MigrationName NVARCHAR(200) NOT NULL UNIQUE,
        AppliedAt DATETIME2 NOT NULL CONSTRAINT DF_SchemaMigrations_AppliedAt_Runtime DEFAULT SYSUTCDATETIME()
      );
    END
  `);
}

async function isApplied(pool, name) {
  const result = await pool.request()
    .input('name', sql.NVarChar, name)
    .query('SELECT 1 AS ok FROM dbo.SchemaMigrations WHERE MigrationName = @name');
  return result.recordset.length > 0;
}

async function markApplied(pool, name) {
  await pool.request()
    .input('name', sql.NVarChar, name)
    .query('INSERT INTO dbo.SchemaMigrations (MigrationName) VALUES (@name)');
}

export async function runMigrations() {
  console.log('🚀 Démarrage des migrations ESNAS…');
  const pool = await poolPromise;
  await ensureMigrationsTable(pool);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('Aucune migration trouvée.');
    return;
  }

  for (const file of files) {
    if (await isApplied(pool, file)) {
      console.log(`⏭  Déjà appliquée : ${file}`);
      continue;
    }

    const fullPath = path.join(migrationsDir, file);
    const sqlText = fs.readFileSync(fullPath, 'utf8');
    const batches = splitBatches(sqlText);

    console.log(`▶  Application de ${file} (${batches.length} batch(es))…`);

    try {
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        try {
          await pool.request().query(batch);
        } catch (batchErr) {
          // Ignore "already exists" style races on re-run partials
          const msg = String(batchErr.message || '');
          if (/already an object named|already exists|There is already/i.test(msg)) {
            console.warn(`   ⚠ batch ${i + 1}: ignoré (${msg.split('\n')[0]})`);
            continue;
          }
          throw batchErr;
        }
      }
      await markApplied(pool, file);
      console.log(`✅ ${file} appliquée`);
    } catch (err) {
      console.error(`❌ Échec migration ${file}:`, err.message);
      throw err;
    }
  }

  console.log('✅ Migrations terminées.');
}

const isDirectScriptExecution = process.argv[1] && process.argv[1].endsWith('runMigrations.js');
if (isDirectScriptExecution) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Erreur fatale migrations:', err);
      process.exit(1);
    });
}
