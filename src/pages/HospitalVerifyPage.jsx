import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaHospital, FaShieldAlt, FaSearch, FaCheckCircle, FaTimesCircle,
  FaSpinner, FaLock, FaHome
} from 'react-icons/fa';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

function money(n) {
  return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' USD';
}

export default function HospitalVerifyPage() {
  const [policyNumber, setPolicyNumber] = useState('');
  const [pin, setPin] = useState('');
  const [pinRequired, setPinRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boot, setBoot] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/hospital/config`);
        const data = await res.json();
        if (!cancelled) setPinRequired(!!data.pinRequired);
      } catch {
        if (!cancelled) setError('API indisponible. Vérifiez que le serveur tourne.');
      } finally {
        if (!cancelled) setBoot(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    const pn = policyNumber.trim();
    if (pn.length < 5) {
      setError('Saisissez un numéro de police valide (ex: DRC-2026-12345).');
      return;
    }
    if (pinRequired && !pin.trim()) {
      setError('Code établissement requis.');
      return;
    }

    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (pin.trim()) headers['X-Hospital-Pin'] = pin.trim();
      const res = await fetch(`${API}/hospital/verify/${encodeURIComponent(pn)}`, { headers });
      const data = await res.json();
      if (!res.ok && res.status !== 404) {
        throw new Error(data.message || `Erreur ${res.status}`);
      }
      setResult(data);
      if (data.message && !data.success && res.status === 404) {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message || 'Échec de la vérification');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <NavbarSecured />
      <main className="flex-grow max-w-3xl w-full mx-auto px-6 pt-28 pb-16">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00A3E0] mb-2">Espace hôpital / réseau de soins</p>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <FaHospital className="text-[#CE1126]" /> Vérification de police
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Contrôle instantané de la validité d&apos;un contrat ESNAS — sans compte staff.
            Les données personnelles sont partiellement masquées.
          </p>
        </div>

        {boot && (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
            <FaSpinner className="animate-spin" /> Chargement configuration…
          </div>
        )}

        {!boot && (
          <form onSubmit={onSubmit} className="bg-[#111827] border border-slate-800 p-6 space-y-4 shadow-xl">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              N° de police
            </label>
            <input
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value.toUpperCase())}
              placeholder="DRC-2026-XXXXX"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
              autoComplete="off"
            />

            {pinRequired && (
              <>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FaLock /> Code établissement
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN fourni par ESNAS"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
                />
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#00A3E0] hover:bg-[#0090c5] text-white text-sm font-black disabled:opacity-60"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
              Vérifier le contrat
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm font-bold">
            {error}
          </div>
        )}

        {result && (
          <div className={`mt-6 border p-6 space-y-4 ${result.valid ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-amber-500/40 bg-amber-500/10'}`}>
            <div className="flex items-center gap-2 text-lg font-black">
              {result.valid ? (
                <><FaCheckCircle className="text-emerald-400" /> CONTRAT VALIDE</>
              ) : (
                <><FaTimesCircle className="text-amber-400" /> CONTRAT NON VALIDE</>
              )}
            </div>
            {result.guidance && <p className="text-sm text-slate-200">{result.guidance}</p>}
            {result.reasons?.length > 0 && (
              <p className="text-xs text-slate-400">Motifs : {result.reasons.join(', ')}</p>
            )}
            {result.policy && (
              <ul className="text-sm space-y-1.5 border-t border-white/10 pt-4">
                <li><b>Police</b> <span className="font-mono">{result.policy.policyNumber}</span></li>
                <li><b>Branche</b> {result.policy.branch} · {result.policy.coverageLevel}</li>
                <li><b>Statut</b> {result.policy.status}</li>
                <li><b>Validité</b> {result.policy.startDate ? new Date(result.policy.startDate).toLocaleDateString() : '—'} → {result.policy.endDate ? new Date(result.policy.endDate).toLocaleDateString() : '—'}</li>
                <li><b>Plafond restant</b> {money(result.policy.remainingLimitUSD)} / {money(result.policy.annualLimitUSD)}</li>
                <li><b>Prise en charge autorisée</b> {result.policy.careAuthorized ? 'OUI' : 'NON'}</li>
                <li><b>Sinistres ouverts</b> {result.policy.openClaimCount}</li>
              </ul>
            )}
            {result.beneficiary && (
              <div className="text-sm border-t border-white/10 pt-4">
                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Bénéficiaire (masqué)</p>
                <p className="font-bold">{result.beneficiary.displayName}</p>
                <p className="text-slate-400 text-xs">{result.beneficiary.city || '—'} · {result.beneficiary.phone || 'tél. masqué'} · {result.beneficiary.nationalIdHint || 'CNI n/a'}</p>
              </div>
            )}
            <p className="text-[10px] text-slate-500">Contrôle {result.checkedAt ? new Date(result.checkedAt).toLocaleString() : ''} · mode {result.accessMode || 'open'}</p>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4 text-xs">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white">
            <FaHome /> Accueil
          </Link>
          <Link to="/reseau-soins" className="inline-flex items-center gap-2 text-slate-400 hover:text-white">
            <FaShieldAlt /> Réseau de soins
          </Link>
          <Link to="/login" className="inline-flex items-center gap-2 text-[#00A3E0] hover:underline">
            Espace ESNAS (staff)
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
