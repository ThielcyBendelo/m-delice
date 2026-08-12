# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROJ = ROOT.parent


def write(rel: str, text: str) -> None:
    path = PROJ / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.lstrip("\n"), encoding="utf-8", newline="\n")
    print("wrote", path.relative_to(PROJ), path.stat().st_size)


write(
    "server/index.js",
    r"""
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
  });
});

app.listen(PORT, HOST, () => {
  console.log('ESNAS API listening on http://' + HOST + ':' + PORT + '/api/health');
  if (process.env.AUTOMATION_ENABLED !== 'false') {
    startAutomationJobs();
  }
});
""",
)

write(
    "server/scripts/promoteAdmin.js",
    r"""
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
""",
)

write(
    "src/dashboard/SystemHealth.jsx",
    r"""
import React, { useEffect, useState } from 'react';
import { FaHeartbeat, FaSpinner, FaDatabase, FaCheck, FaTimes, FaSync } from 'react-icons/fa';
import dashboardService from '../services/dashboardService';
import authService from '../services/authService';

function isStaffRole(role) {
  return ['admin', 'agent', 'underwriter', 'finance', 'claims_manager'].includes(String(role || '').toLowerCase());
}

export default function SystemHealth() {
  const user = authService.getCurrentUser();
  const staff = isStaffRole(user?.role);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [overview, setOverview] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      if (!staff) {
        setError('Accès réservé au staff (admin, agent, finance…). Promotez un compte via: npm run db:promote-admin -- vous@email.com');
        setData(null);
        return;
      }
      const [health, ov] = await Promise.all([
        dashboardService.getHealthDb(),
        dashboardService.getAdminOverview().catch(() => null),
      ]);
      setData(health);
      setOverview(ov);
    } catch (e) {
      setError(e.userMessage || e.message || 'Impossible de charger le diagnostic SQL.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen p-1 text-slate-800 dark:text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <FaHeartbeat className="text-[#CE1126]" /> Santé SQL & système
          </h1>
          <p className="text-xs text-slate-500">Diagnostic live de DrcAssurancesDB (staff uniquement).</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">
          <FaSync /> Actualiser
        </button>
      </div>

      {loading && <div className="flex justify-center py-12 gap-2 text-slate-500"><FaSpinner className="animate-spin" /> Diagnostic…</div>}
      {error && !loading && <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 px-4 py-3 rounded-xl text-sm font-bold whitespace-pre-wrap">{error}</div>}

      {!loading && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] uppercase font-black text-slate-400 flex items-center gap-2"><FaDatabase /> Connexion</div>
              <p className="mt-2 font-mono text-sm">{data.connection?.ServerName}</p>
              <p className="text-xs text-slate-500">{data.connection?.DbName}</p>
              <p className="text-xs mt-1">UTC {data.connection?.UtcNow ? new Date(data.connection.UtcNow).toLocaleString() : '—'}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] uppercase font-black text-slate-400">Config app</div>
              <p className="mt-2 text-sm font-bold">{data.config?.server}{data.config?.instanceName ? '\\' + data.config.instanceName : ''}</p>
              <p className="text-xs">DB {data.config?.database} · {data.config?.trusted ? 'trusted' : 'sqlauth'}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] uppercase font-black text-slate-400">Tables</div>
              <p className="mt-2 text-2xl font-black">{(data.tables || []).length}</p>
              <p className="text-xs text-slate-500">objets utilisateur SQL</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase">
                  <th className="p-4">Table</th>
                  <th className="p-4">Présente</th>
                  <th className="p-4">Colonnes manquantes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {Object.entries(data.schemaCheck || {}).map(([table, info]) => (
                  <tr key={table}>
                    <td className="p-4 font-bold font-mono">{table}</td>
                    <td className="p-4">
                      {info.exists ? <span className="text-emerald-500 inline-flex items-center gap-1"><FaCheck /> OK</span> : <span className="text-red-500 inline-flex items-center gap-1"><FaTimes /> Absente</span>}
                    </td>
                    <td className="p-4 font-mono text-amber-600">{(info.missing || []).join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {overview && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-sm mb-3">Polices par statut</h3>
                <ul className="text-xs space-y-1">
                  {(overview.policiesByStatus || []).map((r) => (
                    <li key={r.Status} className="flex justify-between border-b border-slate-50 dark:border-slate-800 py-1">
                      <span>{r.Status}</span><b>{r.Cnt}</b>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-sm mb-3">Paiements en attente</h3>
                <ul className="text-xs space-y-2">
                  {(overview.pendingPayments || []).length === 0 && <li className="text-slate-400">Aucun</li>}
                  {(overview.pendingPayments || []).map((p) => (
                    <li key={p.TransactionReference} className="font-mono">
                      {p.TransactionReference} · {p.TotalPaidUSD} USD · {p.PolicyNumber || '—'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
""",
)

write(
    "src/dashboard/ClaimsQueue.jsx",
    r"""
import React, { useEffect, useMemo, useState } from 'react';
import {
  FaFileMedical, FaSpinner, FaFilter, FaCheck, FaTimes, FaSearch, FaEye
} from 'react-icons/fa';
import dashboardService from '../services/dashboardService';
import authService from '../services/authService';
import notificationService from '../services/notificationService';

function isStaffRole(role) {
  return ['admin', 'agent', 'claims_manager', 'underwriter', 'finance'].includes(String(role || '').toLowerCase());
}

function money(n) {
  return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' USD';
}

const STATUS_OPTS = [
  { value: '', label: 'Tous' },
  { value: 'submitted', label: 'Soumis' },
  { value: 'under_review', label: 'En revue' },
  { value: 'approved', label: 'Approuvés' },
  { value: 'rejected', label: 'Rejetés' },
  { value: 'paid', label: 'Payés' },
];

export default function ClaimsQueue() {
  const user = authService.getCurrentUser();
  const staff = isStaffRole(user?.role);
  const [status, setStatus] = useState(staff ? 'submitted' : '');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await dashboardService.getClaims({ status: status || undefined });
      setRows(data.claims || []);
    } catch (e) {
      setError(e.userMessage || e.message || 'Erreur chargement sinistres');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((c) => {
      const blob = [
        c.ClaimNumber, c.PolicyNumber, c.ClaimStatus,
        c.BeneficiaryFirstName, c.BeneficiaryLastName, c.ClaimDescription,
      ].join(' ').toLowerCase();
      return blob.includes(needle);
    });
  }, [rows, q]);

  function openClaim(c) {
    setSelected(c);
    setNotes(c.ReviewerNotes || '');
    setApprovedAmount(String(c.ApprovedAmountUSD || c.EstimatedCostUSD || ''));
  }

  async function setClaimStatus(nextStatus) {
    if (!selected) return;
    if (!staff) {
      notificationService.error('Action réservée au staff claims/admin.');
      return;
    }
    setBusy(true);
    try {
      const res = await dashboardService.updateClaimStatus(selected.ClaimNumber, {
        status: nextStatus,
        reviewerNotes: notes || undefined,
        approvedAmount: approvedAmount !== '' ? Number(approvedAmount) : undefined,
      });
      notificationService.success(res.message || ('Statut → ' + nextStatus));
      setSelected(res.claim || null);
      await load();
    } catch (e) {
      notificationService.error(e.userMessage || e.message || 'Échec mise à jour sinistre');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen p-1 text-slate-800 dark:text-slate-100">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <FaFileMedical className="text-[#CE1126]" /> File sinistres
        </h1>
        <p className="text-xs text-slate-500">
          {staff ? 'Workflow staff : revue → approbation / rejet (plafond police mis à jour).' : 'Vos dossiers sinistres (lecture).'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <FaSearch className="absolute left-3 top-3 text-slate-400" size={14} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="N° sinistre, police, bénéficiaire…"
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
          />
        </div>
        <div className="relative">
          <FaFilter className="absolute left-3 top-3 text-slate-400" size={12} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
          >
            {STATUS_OPTS.map((o) => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="flex justify-center py-10 gap-2 text-slate-500"><FaSpinner className="animate-spin" /> Chargement…</div>}
      {error && <div className="text-red-500 text-sm font-bold">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase">
                  <th className="p-3">Sinistre</th>
                  <th className="p-3">Police</th>
                  <th className="p-3">Bénéficiaire</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">Aucun sinistre.</td></tr>
                )}
                {filtered.map((c) => (
                  <tr key={c.ClaimID || c.ClaimNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold">{c.ClaimNumber}</td>
                    <td className="p-3 font-mono">{c.PolicyNumber}</td>
                    <td className="p-3">{c.BeneficiaryLastName} {c.BeneficiaryFirstName}</td>
                    <td className="p-3">{money(c.EstimatedCostUSD)}</td>
                    <td className="p-3 uppercase text-[10px] font-black">{c.ClaimStatus}</td>
                    <td className="p-3">
                      <button type="button" onClick={() => openClaim(c)} className="text-[#00A3E0] inline-flex items-center gap-1 font-bold">
                        <FaEye size={12} /> Ouvrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-3">
            {!selected && <p className="text-sm text-slate-400">Sélectionnez un dossier pour le traiter.</p>}
            {selected && (
              <>
                <h3 className="font-black text-sm">{selected.ClaimNumber}</h3>
                <p className="text-xs text-slate-500 font-mono">{selected.PolicyNumber}</p>
                <p className="text-xs leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                  {selected.ClaimDescription}
                </p>
                <p className="text-xs"><b>Estimé</b> {money(selected.EstimatedCostUSD)}</p>
                <p className="text-xs"><b>Événement</b> {selected.EventDate ? new Date(selected.EventDate).toLocaleString() : '—'}</p>

                {staff && (
                  <>
                    <label className="block text-[10px] font-black uppercase text-slate-400">Montant approuvé (USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    />
                    <label className="block text-[10px] font-black uppercase text-slate-400">Notes reviewer</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    />
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button type="button" disabled={busy} onClick={() => setClaimStatus('under_review')} className="px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold disabled:opacity-50">
                        En revue
                      </button>
                      <button type="button" disabled={busy} onClick={() => setClaimStatus('approved')} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50">
                        <FaCheck /> Approuver
                      </button>
                      <button type="button" disabled={busy} onClick={() => setClaimStatus('rejected')} className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50">
                        <FaTimes /> Rejeter
                      </button>
                      <button type="button" disabled={busy} onClick={() => setClaimStatus('paid')} className="px-3 py-2 rounded-lg bg-[#00A3E0] text-white text-xs font-bold disabled:opacity-50">
                        Marquer payé
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
""",
)

print("core files ok")
