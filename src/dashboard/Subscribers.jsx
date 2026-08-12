import React, { useEffect, useMemo, useState } from 'react';
import { FaUserShield, FaSearch, FaFilter, FaSpinner, FaEnvelope } from 'react-icons/fa';
import dashboardService from '../services/dashboardService';
import authService from '../services/authService';
import notificationService from '../services/notificationService';

function isAdminRole(role) {
  return String(role || '').toLowerCase() === 'admin';
}

export default function Subscribers() {
  const me = authService.getCurrentUser();
  const amAdmin = isAdminRole(me?.role);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('Tous');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await dashboardService.getSubscribers({
          q: searchQuery || undefined,
          country: selectedCountry,
        });
        if (!cancelled) setRows(data.subscribers || []);
      } catch (e) {
        if (!cancelled) setError(e.userMessage || e.message || 'Erreur chargement souscripteurs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [searchQuery, selectedCountry]);

  const countries = useMemo(() => {
    const set = new Set(rows.map((r) => r.CountryOfResidence).filter(Boolean));
    return ['Tous', ...Array.from(set).sort()];
  }, [rows]);

  async function reload() {
    const data = await dashboardService.getSubscribers({
      q: searchQuery || undefined,
      country: selectedCountry,
    });
    setRows(data.subscribers || []);
  }

  async function changeRole(userId, role) {
    if (!amAdmin) return;
    setBusyId(userId);
    try {
      await dashboardService.updateUserRole(userId, role);
      notificationService.success('Rôle mis à jour → ' + role);
      await reload();
    } catch (e) {
      notificationService.error(e.userMessage || e.message || 'Échec maj rôle');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(user) {
    if (!amAdmin) return;
    setBusyId(user.UserID);
    try {
      // IsActive null traité comme actif
      const currentlyActive = !(user.IsActive === false || user.IsActive === 0);
      await dashboardService.setUserActive(user.UserID, !currentlyActive);
      notificationService.success(!currentlyActive ? 'Compte activé' : 'Compte désactivé');
      await reload();
    } catch (e) {
      notificationService.error(e.userMessage || e.message || 'Échec activation');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8 min-h-screen p-1 text-slate-100 animate-fadeIn">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <FaUserShield className="text-[#00A3E0]" /> Acheteurs Diaspora
        </h1>
        <p className="text-xs text-slate-300">Registre live des souscripteurs.</p>
      </div>

      <div className="admin-panel p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <span className="absolute left-3.5 top-3 text-slate-400"><FaSearch size={14} /></span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nom, email..."
            className="touch-target w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-100"
          />
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-slate-400"><FaFilter size={12} /></span>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="touch-target w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-100"
          >
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="admin-panel flex justify-center py-10 gap-2 text-slate-300"><FaSpinner className="animate-spin" /> Chargement...</div>}
      {error && <div className="admin-panel p-4 text-red-300 text-sm font-bold">{error}</div>}

      {!loading && !error && (
        <>
          <div className="space-y-3 lg:hidden">
            {rows.length === 0 && <div className="admin-panel p-6 text-center text-sm text-slate-300">Aucun souscripteur.</div>}
            {rows.map((s) => (
              <article key={s.UserID} className="admin-panel p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-white">{s.LastName} {s.FirstName}</h3>
                    <p className="text-xs text-slate-300">{s.CountryOfResidence || '—'} · {s.AuthProvider || 'local'}</p>
                  </div>
                  <span className="text-xs font-black text-[#00A3E0]">{Number(s.TotalContributedUSD || 0).toLocaleString()} USD</span>
                </div>

                <div className="text-xs text-slate-300">{s.Email}</div>
                <div className="text-xs text-slate-300">{s.PolicyCount || 0} polices ({s.ActivePolicyCount || 0} act.)</div>

                <div className="flex flex-wrap items-center gap-2">
                  {amAdmin ? (
                    <select
                      disabled={busyId === s.UserID}
                      value={s.UserRole || 'Diaspora'}
                      onChange={(e) => changeRole(s.UserID, e.target.value)}
                      className="touch-target h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-[11px] font-bold text-slate-100"
                    >
                      {['Diaspora', 'Client', 'Partner', 'Hospital', 'admin', 'agent', 'claims_manager', 'finance', 'underwriter'].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="uppercase text-[10px] font-black">{s.UserRole || '—'}</span>
                  )}

                  <button
                    type="button"
                    onClick={() => notificationService.success('Relevé demandé pour ' + s.Email)}
                    className="touch-target text-[#00A3E0] hover:underline flex items-center gap-1 text-xs font-bold"
                  >
                    <FaEnvelope size={12} /> Relevé
                  </button>

                  {amAdmin && (
                    <button
                      type="button"
                      disabled={busyId === s.UserID}
                      onClick={() => toggleActive(s)}
                      className="touch-target text-[11px] font-bold text-amber-500 hover:underline disabled:opacity-50"
                    >
                      {(s.IsActive === false || s.IsActive === 0) ? 'Activer' : 'Désactiver'}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden lg:block admin-panel rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                <th className="p-4">Souscripteur</th>
                <th className="p-4">Email</th>
                <th className="p-4">Pays</th>
                <th className="p-4">Polices</th>
                <th className="p-4">Contribué</th>
                <th className="p-4">Auth</th>
                <th className="p-4">Rôle</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {rows.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-300">Aucun souscripteur.</td></tr>}
              {rows.map((s) => (
                <tr key={s.UserID} className="hover:bg-white/5">
                  <td className="p-4 font-bold text-white">{s.LastName} {s.FirstName}</td>
                  <td className="p-4">{s.Email}</td>
                  <td className="p-4">{s.CountryOfResidence || '—'}</td>
                  <td className="p-4">{s.PolicyCount || 0} <span className="text-slate-400">({s.ActivePolicyCount || 0} act.)</span></td>
                  <td className="p-4 font-bold text-[#00A3E0]">{Number(s.TotalContributedUSD || 0).toLocaleString()} USD</td>
                  <td className="p-4 uppercase text-[10px] font-black">{s.AuthProvider || 'local'}</td>
                  <td className="p-4">
                    {amAdmin ? (
                      <select
                        disabled={busyId === s.UserID}
                        value={s.UserRole || 'Diaspora'}
                        onChange={(e) => changeRole(s.UserID, e.target.value)}
                        className="touch-target bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-100"
                      >
                        {['Diaspora', 'Client', 'Partner', 'Hospital', 'admin', 'agent', 'claims_manager', 'finance', 'underwriter'].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="uppercase text-[10px] font-black">{s.UserRole || '—'}</span>
                    )}
                  </td>
                  <td className="p-4 flex flex-col gap-1 items-start">
                    <button
                      type="button"
                      onClick={() => notificationService.success('Relevé demandé pour ' + s.Email)}
                      className="touch-target text-[#00A3E0] hover:underline flex items-center gap-1"
                    >
                      <FaEnvelope size={12} /> Relevé
                    </button>
                    {amAdmin && (
                      <button
                        type="button"
                        disabled={busyId === s.UserID}
                        onClick={() => toggleActive(s)}
                        className="touch-target text-[11px] font-bold text-amber-600 hover:underline disabled:opacity-50"
                      >
                        {(s.IsActive === false || s.IsActive === 0) ? 'Activer' : 'Désactiver'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
