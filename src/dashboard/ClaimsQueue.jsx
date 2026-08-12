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
    <div className="space-y-6 min-h-screen p-1 text-slate-100">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <FaFileMedical className="text-[#CE1126]" /> File sinistres
        </h1>
        <p className="text-xs text-slate-300">
          {staff ? 'Workflow staff : revue → approbation / rejet (plafond police mis à jour).' : 'Vos dossiers sinistres (lecture).'}
        </p>
      </div>

      <div className="admin-panel p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <FaSearch className="absolute left-3 top-3 text-slate-400" size={14} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="N° sinistre, police, bénéficiaire…"
            className="touch-target w-full pl-10 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-100"
          />
        </div>
        <div className="relative">
          <FaFilter className="absolute left-3 top-3 text-slate-400" size={12} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="touch-target w-full pl-10 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-100"
          >
            {STATUS_OPTS.map((o) => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="admin-panel flex justify-center py-10 gap-2 text-slate-300"><FaSpinner className="animate-spin" /> Chargement…</div>}
      {error && <div className="admin-panel p-4 text-red-300 text-sm font-bold">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3 admin-panel rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Sinistre</th>
                  <th className="p-3">Police</th>
                  <th className="p-3">Bénéficiaire</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-300">Aucun sinistre.</td></tr>
                )}
                {filtered.map((c) => (
                  <tr key={c.ClaimID || c.ClaimNumber} className="hover:bg-white/5">
                    <td className="p-3 font-mono font-bold text-white">{c.ClaimNumber}</td>
                    <td className="p-3 font-mono">{c.PolicyNumber}</td>
                    <td className="p-3">{c.BeneficiaryLastName} {c.BeneficiaryFirstName}</td>
                    <td className="p-3">{money(c.EstimatedCostUSD)}</td>
                    <td className="p-3 uppercase text-[10px] font-black">{c.ClaimStatus}</td>
                    <td className="p-3">
                      <button type="button" onClick={() => openClaim(c)} className="touch-target text-[#00A3E0] inline-flex items-center gap-1 font-bold">
                        <FaEye size={12} /> Ouvrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="xl:col-span-2 admin-panel rounded-2xl p-5 space-y-3">
            {!selected && <p className="text-sm text-slate-300">Sélectionnez un dossier pour le traiter.</p>}
            {selected && (
              <>
                <h3 className="font-black text-sm text-white">{selected.ClaimNumber}</h3>
                <p className="text-xs text-slate-300 font-mono">{selected.PolicyNumber}</p>
                <p className="text-xs leading-relaxed border-t border-white/10 pt-3 text-slate-200">
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
                      className="touch-target w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-slate-100"
                    />
                    <label className="block text-[10px] font-black uppercase text-slate-400">Notes reviewer</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="touch-target w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-slate-100"
                    />
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button type="button" disabled={busy} onClick={() => setClaimStatus('under_review')} className="touch-target px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold disabled:opacity-50">
                        En revue
                      </button>
                      <button type="button" disabled={busy} onClick={() => setClaimStatus('approved')} className="touch-target px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50">
                        <FaCheck /> Approuver
                      </button>
                      <button type="button" disabled={busy} onClick={() => setClaimStatus('rejected')} className="touch-target px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50">
                        <FaTimes /> Rejeter
                      </button>
                      <button type="button" disabled={busy} onClick={() => setClaimStatus('paid')} className="touch-target px-3 py-2 rounded-lg bg-[#00A3E0] text-white text-xs font-bold disabled:opacity-50">
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
