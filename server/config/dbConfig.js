import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function parseServer(server, instanceName) {
  let host = server || process.env.DB_SERVER || 'localhost';
  let instance = instanceName !== undefined
    ? instanceName
    : (process.env.DB_INSTANCE || process.env.DB_INSTANCE_NAME || '');

  if (String(host).includes('\\')) {
    const parts = String(host).split('\\');
    host = parts[0];
    if (!instance) instance = parts.slice(1).join('\\');
  }
  return { host, instance };
}

function isTrusted() {
  return String(process.env.DB_TRUSTED_CONNECTION || process.env.DB_INTEGRATED_SECURITY || 'false')
    .toLowerCase() === 'true';
}

function describeTarget({ host, instance, database, trusted, port }) {
  const inst = instance ? `\\${instance}` : '';
  const p = port ? `:${port}` : '';
  return `${host}${inst}${p}/${database} [${trusted ? 'trusted' : 'sqlauth'}]`;
}

async function connectTrusted({ host, instance, database, port }) {
  const sqlWin = (await import('mssql/msnodesqlv8.js')).default;
  const server = instance ? `${host}\\${instance}` : host;

  const config = {
    server,
    database,
    driver: 'msnodesqlv8',
    options: {
      trustedConnection: true,
      trustServerCertificate: String(process.env.DB_TRUST_CERT || 'true').toLowerCase() !== 'false',
      enableArithAbort: true,
    },
    connectionTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 30000),
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
  if (port) config.port = port;

  const pool = await new sqlWin.ConnectionPool(config).connect();
  // Expose request API compatible
  return pool;
}

async function connectSqlAuth({ host, instance, database, port }) {
  const options = {
    encrypt: String(process.env.DB_ENCRYPT || 'false').toLowerCase() === 'true',
    trustServerCertificate: String(process.env.DB_TRUST_CERT || 'true').toLowerCase() !== 'false',
    enableArithAbort: true,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 30000),
  };
  if (instance) options.instanceName = instance;

  const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    server: host,
    database,
    options,
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
  if (port) config.port = port;

  return new sql.ConnectionPool(config).connect();
}

async function connectOnce(label, serverOverride) {
  const { host, instance } = parseServer(serverOverride || process.env.DB_SERVER, process.env.DB_INSTANCE);
  const database = process.env.DB_NAME || 'DrcAssurancesDB';
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
  const trusted = isTrusted();
  const target = describeTarget({ host, instance, database, trusted, port });

  try {
    const pool = trusted
      ? await connectTrusted({ host, instance, database, port })
      : await connectSqlAuth({ host, instance, database, port });
    console.log(`SQL Server connecte (${label}) -> ${target}`);
    return pool;
  } catch (err) {
    console.error(`Echec connexion ${label} (${target}):`, err.message);
    throw err;
  }
}

const poolPromise = connectOnce('primaire')
  .catch(async (err) => {
    const fallback = process.env.DB_SERVER_FALLBACK
      || ((process.env.DB_SERVER || 'localhost') === 'localhost' ? '127.0.0.1' : null);
    if (!fallback) throw err;

    // Preserve instance for fallback
    if (!process.env.DB_INSTANCE && process.env.DB_INSTANCE_FALLBACK) {
      process.env.DB_INSTANCE = process.env.DB_INSTANCE_FALLBACK;
    } else if (!process.env.DB_INSTANCE) {
      process.env.DB_INSTANCE = 'SQLEXPRESS';
    }

    console.log(`Tentative fallback serveur -> ${fallback}`);
    return connectOnce('fallback', fallback);
  })
  .catch((finalErr) => {
    console.error('Echec critique SQL Server:', finalErr.message);
    console.error('Astuce locale: DB_TRUSTED_CONNECTION=true + msnodesqlv8');
    console.error('Astuce SQL auth: DB_TRUSTED_CONNECTION=false + DB_USER/DB_PASSWORD valides');
    console.error('Tailscale: DB_SERVER=100.x.y.z ou hostname.ts.net');
    throw finalErr;
  });

function buildDbConfig() {
  const { host, instance } = parseServer(process.env.DB_SERVER, process.env.DB_INSTANCE);
  return {
    server: host,
    instanceName: instance,
    database: process.env.DB_NAME || 'DrcAssurancesDB',
    trusted: isTrusted(),
  };
}

export { sql, poolPromise, buildDbConfig };
