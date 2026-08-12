import React, { useEffect, useMemo, useState } from 'react';
import {
  FaUsers, FaSearch, FaFilter, FaSpinner
} from 'react-icons/fa';
import dashboardService from '../services/dashboardService';

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Tous');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await dashboardService.getBeneficiaries({
          q: searchQuery || undefined,
          city: selectedCity,
        });
        if (!cancelled) setRows(data.beneficiaries || []);
      } catch (e) {
        if (!cancelled) setError(e.userMessage || e.message || 'Erreur chargement bénéficiaires');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [searchQuery, selectedCity]);

  const cities = useMemo(() => {
    const set = new Set(rows.map((r) => r.City).filter(Boolean));
    return ['Tous', ...Array.from(set).sort()];
  }, [rows]);

  return (
    <div className="space-y-8 min-h-screen p-1 text-slate-100 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <FaUsers className="text-[#00A3E0]" /> Registre National des Bénéficiaires
          </h1>
          <p className="text-xs text-slate-300">Données live depuis SQL Server.</p>
        </div>
      </div>

      <div className="admin-panel p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative flex items-center">
          <span className="absolute left-3.5 text-slate-400"><FaSearch size={14} /></span>
          <input
            type="text"
            placeholder="Rechercher par nom, police, téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-100 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          />
        </div>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400"><FaFilter size={12} /></span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-100 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          >
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div className="admin-panel flex justify-center py-10 text-slate-300 gap-2 items-center">
          <FaSpinner className="animate-spin" /> Chargement...
        </div>
      )}
      {error && <div className="admin-panel text-red-300 p-4 text-sm font-bold">{error}</div>}

      {!loading && !error && (
        <div className="admin-panel rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                <th className="p-4">Bénéficiaire</th>
                <th className="p-4">Ville</th>
                <th className="p-4">WhatsApp</th>
                <th className="p-4">Police</th>
                <th className="p-4">Plafond restant</th>
                <th className="p-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {rows.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-300">Aucun bénéficiaire.</td></tr>
              )}
              {rows.map((b) => (
                <tr key={`${b.BeneficiaryID}-${b.PolicyNumber}`} className="hover:bg-white/5">
                  <td className="p-4 font-bold text-white">{b.LastName} {b.FirstName}</td>
                  <td className="p-4">{b.City || '—'}</td>
                  <td className="p-4 font-mono">{b.WhatsAppPhone || '—'}</td>
                  <td className="p-4 font-mono">{b.PolicyNumber}</td>
                  <td className="p-4 font-bold text-[#00A3E0]">{Number(b.RemainingLimitUSD || 0).toLocaleString()} / {Number(b.AnnualLimitUSD || 0).toLocaleString()} USD</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md border text-[11px] font-bold ${b.IsActive ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20'}`}>
                      {b.PolicyStatus || (b.IsActive ? 'Actif' : 'Inactif')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
