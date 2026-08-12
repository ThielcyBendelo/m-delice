import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/apiRoutes.js';
import { startAutomationJobs } from './jobs/automationJobs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../src/.env') });

const app = express();
const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || '0.0.0.0';

const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const corsOrigins = (process.env.CORS_ORIGINS || defaultOrigins.join(','))
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin) || corsOrigins.includes('*')) return callback(null, true);
    if (origin.includes('.ts.net')) return callback(null, true);
    if (/^https?:\/\/100\.\d+\.\d+\.\d+/.test(origin)) return callback(null, true);
    return callback(new Error('CORS bloque: ' + origin));
  },
  credentials: true,
}));

app.use(express.json({
  verify: (req, _res, buf) => {
    if (req.originalUrl && req.originalUrl.includes('/payment/webhook/stripe')) {
      req.rawBody = buf;
    }
  },
}));

app.use('/api', apiRoutes);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'ESNAS Gateway Core Engine',
    time: new Date().toISOString(),
    tailscaleReady: true,
    googleAuth: Boolean(process.env.GOOGLE_CLIENT_ID),
    automation: process.env.AUTOMATION_ENABLED !== 'false',
    dbMode: process.env.DB_TRUSTED_CONNECTION === 'true' ? 'trusted' : 'sqlauth',
    hospitalPin: Boolean(String(process.env.HOSPITAL_VERIFY_PIN || '').trim()),
  });
});

app.listen(PORT, HOST, () => {
  console.log('ESNAS API listening on http://' + HOST + ':' + PORT + '/api/health');
  if (process.env.AUTOMATION_ENABLED !== 'false') {
    startAutomationJobs();
  }
});
