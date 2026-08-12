import React, { useEffect, useMemo, useState } from 'react';
import {
  FaFileInvoiceDollar, FaSearch, FaDownload, FaPrint,
  FaShieldAlt, FaBarcode, FaCalendarAlt, FaCheckCircle,
  FaFilePdf, FaFilter, FaSpinner
} from 'react-icons/fa';
import dashboardService from '../services/dashboardService';
import notificationService from '../services/notificationService';

function money(n, currency = 'USD') {
  return (
    Number(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) +
    ' ' +
    currency
  );
}

function statusStyle(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'completed') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  if (s === 'pending' || s === 'processing') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
}

export default function InvoiceManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Tous');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = { q: searchQuery || undefined };
        if (filterStatus === 'completed') params.status = 'completed';
        if (filterStatus === 'pending') params.status = 'pending';
        const data = await dashboardService.getInvoices(params);
        if (!cancelled) setRows(data.invoices || []);
      } catch (e) {
        if (!cancelled) setError(e.userMessage || e.message || 'Erreur chargement quittances');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery, filterStatus]);

  const filtered = useMemo(() => rows, [rows]);

  async function openPrint(invoice) {
    const key = invoice.transactionReference || invoice.invoiceNo;
    setBusyKey(key);
    try {
      await dashboardService.openInvoicePrint(key);
      if (notificationService.success) {
        notificationService.success('Quittance ' + invoice.invoiceNo + ' ouverte.');
      }
    } catch (e) {
      notificationService.error(e.userMessage || e.message || 'Impression impossible');
    } finally {
      setBusyKey('');
    }
  }

  return (
    <div className="space-y-8 min-h-screen p-1 text-slate-100 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <FaFileInvoiceDollar className="text-[#00A3E0]" /> Quittances ARCA (live SQL)
          </h1>
          <p className="text-xs text-slate-300">
            Recus de prime depuis Payments · taxe ARCA · impression HTML/PDF navigateur.
          </p>
        </div>
      </div>

      <div className="admin-panel p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative flex items-center">
          <span className="absolute left-3.5 text-slate-400"><FaSearch size={14} /></span>
          <input
            type="text"
            placeholder="N quittance, police, email, beneficiaire, TX"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="touch-target w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-100 md:text-sm focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          />
        </div>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400"><FaFilter size={12} /></span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="touch-target w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="completed">Emises et signees (completed)</option>
            <option value="pending">En attente (pending)</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="admin-panel flex justify-center py-10 gap-2 text-slate-300 items-center">
          <FaSpinner className="animate-spin" /> Chargement...
        </div>
      )}
      {error && <div className="admin-panel p-4 text-red-300 text-sm font-bold">{error}</div>}

      {!loading && !error && (
        <>
          <div className="space-y-3 lg:hidden">
            {filtered.length === 0 && (
              <div className="admin-panel p-6 text-center text-sm text-slate-300">
                Aucune quittance. Un paiement confirme est requis.
              </div>
            )}
            {filtered.map((invoice) => {
              const key = invoice.transactionReference || invoice.invoiceNo;
              const busy = busyKey === key;
              const city = invoice.beneficiary && invoice.beneficiary.city ? ` (${invoice.beneficiary.city})` : '';
              const buyerName = (invoice.buyer && invoice.buyer.name) || '—';
              const benName = (invoice.beneficiary && invoice.beneficiary.name) || '—';
              return (
                <article key={key} className="admin-panel p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs text-slate-300">{invoice.invoiceNo}</div>
                      <div className="text-[11px] text-slate-400">{invoice.transactionReference}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle(invoice.status)}`}>
                      <FaCheckCircle size={9} />
                      {invoice.statusLabel || invoice.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-200">{buyerName} → {benName + city}</div>
                  <div className="text-sm font-black text-[#00A3E0]">{money(invoice.totalPaidUSD, invoice.currency)}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('fr-FR') : '—'}</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" disabled={busy} onClick={() => openPrint(invoice)} className="touch-target p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50" title="Telecharger">
                        {busy ? <FaSpinner className="animate-spin" size={11} /> : <FaDownload size={11} />}
                      </button>
                      <button type="button" disabled={busy} onClick={() => openPrint(invoice)} className="touch-target p-2 bg-[#00A3E0]/10 hover:bg-[#00A3E0] hover:text-white text-[#00A3E0] rounded-lg disabled:opacity-50" title="Imprimer">
                        <FaPrint size={11} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden lg:block admin-panel rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FaShieldAlt className="text-[#00A3E0]" /> Grand livre quittances
            </h3>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-md font-black flex items-center gap-1">
              <FaBarcode /> {filtered.length} document(s)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider bg-white/5">
                  <th className="p-4">N Quittance</th>
                  <th className="p-4">Police</th>
                  <th className="p-4">Acheteur</th>
                  <th className="p-4">Beneficiaire</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Taxe ARCA</th>
                  <th className="p-4 text-center">Total TTC</th>
                  <th className="p-4 text-center">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-slate-200">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-300">
                      Aucune quittance. Un paiement confirme est requis.
                    </td>
                  </tr>
                )}
                {filtered.map((invoice) => {
                  const key = invoice.transactionReference || invoice.invoiceNo;
                  const busy = busyKey === key;
                  const city = invoice.beneficiary && invoice.beneficiary.city
                    ? ` (${invoice.beneficiary.city})`
                    : '';
                  const buyerName = (invoice.buyer && invoice.buyer.name) || '—';
                  const buyerEmail = (invoice.buyer && invoice.buyer.email) || '';
                  const benName = (invoice.beneficiary && invoice.beneficiary.name) || '—';
                  return (
                    <tr key={key} className="hover:bg-white/5">
                      <td className="p-4 font-mono font-bold">
                        <span className="inline-flex items-center gap-1.5">
                          <FaFilePdf className="text-red-500" size={13} />
                          {invoice.invoiceNo}
                        </span>
                        <div className="text-[10px] text-slate-400 font-normal">{invoice.transactionReference}</div>
                      </td>
                      <td className="p-4 font-mono text-slate-300 font-bold">{invoice.policyNumber || '—'}</td>
                      <td className="p-4">
                        <div className="font-black">{buyerName}</div>
                        <div className="text-[10px] text-slate-400">{buyerEmail}</div>
                      </td>
                      <td className="p-4 italic text-xs">{benName + city}</td>
                      <td className="p-4 text-slate-300 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <FaCalendarAlt size={11} />
                          {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('fr-FR') : '—'}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-amber-500">{money(invoice.taxArcaUSD, invoice.currency)}</td>
                      <td className="p-4 text-center font-black text-[#00A3E0] font-mono text-sm">{money(invoice.totalPaidUSD, invoice.currency)}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle(invoice.status)}`}>
                          <FaCheckCircle size={9} />
                          {invoice.statusLabel || invoice.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button type="button" disabled={busy} onClick={() => openPrint(invoice)} className="touch-target p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50" title="Telecharger">
                            {busy ? <FaSpinner className="animate-spin" size={11} /> : <FaDownload size={11} />}
                          </button>
                          <button type="button" disabled={busy} onClick={() => openPrint(invoice)} className="touch-target p-2 bg-[#00A3E0]/10 hover:bg-[#00A3E0] hover:text-white text-[#00A3E0] rounded-lg disabled:opacity-50" title="Imprimer">
                            <FaPrint size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
