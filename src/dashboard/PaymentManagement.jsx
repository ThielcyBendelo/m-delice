import React, { useEffect, useMemo, useState } from 'react';
import {
  FaCoins, FaSearch, FaFilter, FaSync, FaSpinner
} from 'react-icons/fa';
import dashboardService from '../services/dashboardService';
import notificationService from '../services/notificationService';

export default function PaymentManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('Tous');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await dashboardService.getPayments();
      setRows(data.payments || data.items || data || []);
      if (!Array.isArray(data.payments || data.items || data)) {
        setRows([]);
      }
    } catch (e) {
      setError(e.userMessage || e.message || 'Erreur chargement paiements');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      notificationService.info('Synchronisation du journal des paiements...');
      await load();
      notificationService.success('Journal synchronisé.');
    } finally {
      setRefreshing(false);
    }
  };

  const list = Array.isArray(rows) ? rows : [];

  const filtered = useMemo(() => {
    return list.filter((tx) => {
      const gateway = String(tx.GatewayUsed || tx.Gateway || tx.PaymentMethod || tx.Provider || '').toLowerCase();
      const matchGateway =
        gatewayFilter === 'Tous' ||
        (gatewayFilter === 'Stripe' && gateway.includes('stripe')) ||
        (gatewayFilter === 'Mobile Money' && (gateway.includes('cinet') || gateway.includes('m-pesa') || gateway.includes('mobile') || gateway.includes('orange')));
      const hay = [
        tx.TransactionReference, tx.TransactionRef, tx.PaymentRef, tx.txRef, tx.PolicyNumber,
        tx.BuyerEmail, tx.BuyerName, tx.UserEmail
      ].filter(Boolean).join(' ').toLowerCase();
      const matchSearch = !searchQuery || hay.includes(searchQuery.toLowerCase());
      return matchGateway && matchSearch;
    });
  }, [list, searchQuery, gatewayFilter]);

  return (
    <div className="space-y-8 min-h-screen p-1 text-slate-100 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <FaCoins className="text-[#00A3E0]" /> Journal Central des Transactions
          </h1>
          <p className="text-xs text-slate-300">Flux paiements live (API /payments).</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="touch-target inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00A3E0] text-white text-xs font-bold disabled:opacity-50"
        >
          {refreshing ? <FaSpinner className="animate-spin" /> : <FaSync />} Rafraîchir
        </button>
      </div>

      <div className="admin-panel p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <span className="absolute left-3.5 top-3 text-slate-400"><FaSearch size={14} /></span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Réf transaction, police, email..."
            className="touch-target w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-100"
          />
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-slate-400"><FaFilter size={12} /></span>
          <select
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            className="touch-target w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-100"
          >
            <option>Tous</option>
            <option>Stripe</option>
            <option>Mobile Money</option>
          </select>
        </div>
      </div>

      {loading && <div className="admin-panel flex justify-center py-10 gap-2 text-slate-300"><FaSpinner className="animate-spin" /> Chargement...</div>}
      {error && <div className="admin-panel text-red-300 p-4 text-sm font-bold">{error}</div>}

      {!loading && !error && (
        <>
          <div className="space-y-3 lg:hidden">
            {filtered.length === 0 && <div className="admin-panel p-6 text-center text-sm text-slate-300">Aucune transaction.</div>}
            {filtered.map((tx, i) => {
              const ref = tx.TransactionReference || tx.TransactionRef || tx.PaymentRef || tx.txRef || tx.PaymentID || ('TX-' + i);
              const status = String(tx.Status || tx.PaymentStatus || '').toLowerCase();
              const ok = status === 'completed' || status === 'succeeded' || status === 'paid';
              return (
                <article key={ref} className="admin-panel p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs text-slate-300">{ref}</div>
                      <div className="font-black text-white">{tx.PolicyNumber || '—'}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-md border text-[11px] font-bold ${ok ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20'}`}>
                      {tx.Status || tx.PaymentStatus || '—'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">{tx.GatewayUsed || tx.Gateway || tx.PaymentMethod || tx.Provider || '—'}</div>
                  <div className="text-sm font-black text-[#00A3E0]">{Number(tx.TotalPaidUSD || tx.AmountUSD || tx.Amount || 0).toLocaleString()} USD</div>
                  <div className="text-[11px] text-slate-400">{tx.CreatedAt ? new Date(tx.CreatedAt).toLocaleString() : '—'}</div>
                </article>
              );
            })}
          </div>

          <div className="hidden lg:block admin-panel rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                <th className="p-4">Réf</th>
                <th className="p-4">Police</th>
                <th className="p-4">Passerelle</th>
                <th className="p-4">Montant</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-300">Aucune transaction.</td></tr>
              )}
              {filtered.map((tx, i) => {
                const ref = tx.TransactionReference || tx.TransactionRef || tx.PaymentRef || tx.txRef || tx.PaymentID || ('TX-' + i);
                const status = String(tx.Status || tx.PaymentStatus || '').toLowerCase();
                const ok = status === 'completed' || status === 'succeeded' || status === 'paid';
                return (
                  <tr key={ref} className="hover:bg-white/5">
                    <td className="p-4 font-mono font-bold text-white">{ref}</td>
                    <td className="p-4 font-mono">{tx.PolicyNumber || '—'}</td>
                    <td className="p-4">{tx.GatewayUsed || tx.Gateway || tx.PaymentMethod || tx.Provider || '—'}</td>
                    <td className="p-4 font-bold text-[#00A3E0]">{Number(tx.TotalPaidUSD || tx.AmountUSD || tx.Amount || 0).toLocaleString()} USD</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md border text-[11px] font-bold ${ok ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20'}`}>
                        {tx.Status || tx.PaymentStatus || '—'}
                      </span>
                    </td>
                    <td className="p-4">{tx.CreatedAt ? new Date(tx.CreatedAt).toLocaleString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
