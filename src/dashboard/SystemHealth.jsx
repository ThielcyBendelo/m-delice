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
    <div className="space-y-8 min-h-screen p-1 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <FaHeartbeat className="text-[#CE1126]" /> Santé SQL & système
          </h1>
          <p className="text-xs text-slate-300">Diagnostic live de DrcAssurancesDB (staff uniquement).</p>
        </div>
        <button type="button" onClick={load} className="touch-target inline-flex w-full sm:w-auto justify-center items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">
          <FaSync /> Actualiser
        </button>
      </div>

      {loading && <div className="admin-panel flex justify-center py-12 gap-2 text-slate-300"><FaSpinner className="animate-spin" /> Diagnostic…</div>}
      {error && !loading && <div className="admin-panel border border-amber-500/30 text-amber-300 px-4 py-3 rounded-xl text-sm font-bold whitespace-pre-wrap">{error}</div>}

      {!loading && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="admin-panel p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-black text-slate-400 flex items-center gap-2"><FaDatabase /> Connexion</div>
              <p className="mt-2 font-mono text-sm">{data.connection?.ServerName}</p>
              <p className="text-xs text-slate-300">{data.connection?.DbName}</p>
              <p className="text-xs mt-1">UTC {data.connection?.UtcNow ? new Date(data.connection.UtcNow).toLocaleString() : '—'}</p>
            </div>
            <div className="admin-panel p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-black text-slate-400">Config app</div>
              <p className="mt-2 text-sm font-bold">{data.config?.server}{data.config?.instanceName ? '\\' + data.config.instanceName : ''}</p>
              <p className="text-xs">DB {data.config?.database} · {data.config?.trusted ? 'trusted' : 'sqlauth'}</p>
            </div>
            <div className="admin-panel p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-black text-slate-400">Tables</div>
              <p className="mt-2 text-2xl font-black">{(data.tables || []).length}</p>
              <p className="text-xs text-slate-300">objets utilisateur SQL</p>
            </div>
          </div>

          <div className="admin-panel rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Table</th>
                  <th className="p-4">Présente</th>
                  <th className="p-4">Colonnes manquantes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {Object.entries(data.schemaCheck || {}).map(([table, info]) => (
                  <tr key={table}>
                    <td className="p-4 font-bold font-mono text-white">{table}</td>
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
              <div className="admin-panel p-5 rounded-2xl">
                <h3 className="font-black text-sm mb-3">Polices par statut</h3>
                <ul className="text-xs space-y-1">
                  {(overview.policiesByStatus || []).map((r) => (
                    <li key={r.Status} className="flex justify-between border-b border-white/10 py-1">
                      <span>{r.Status}</span><b>{r.Cnt}</b>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="admin-panel p-5 rounded-2xl">
                <h3 className="font-black text-sm mb-3">Paiements en attente</h3>
                <ul className="text-xs space-y-2">
                  {(overview.pendingPayments || []).length === 0 && <li className="text-slate-300">Aucun</li>}
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
