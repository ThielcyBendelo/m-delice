import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaHospital, FaShieldAlt, FaSearch, FaCheckCircle, FaTimesCircle,
  FaSpinner, FaLock, FaHome, FaUserShield, FaExclamationTriangle, FaIdCard
} from 'react-icons/fa';
// import NavbarSecured from '../components/NavbarSecured';
// import Footer from '../components/Footer';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

function money(n) {
  return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' USD';
}

export default function HospitalVerifyPage() {
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col antialiased font-sans">
      
      {/* ================= 1. MINI NAVBAR CONTEXTUELLE (MOBILE & DESKTOP) ================= */}
      <header className="sticky top-0 z-50 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/90">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-2">
          
          {/* Gauche : Retour Home + Titre */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              title="Retour à l'accueil"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111827] hover:bg-[#CE1126] border border-slate-800 hover:border-[#CE1126] text-slate-300 hover:text-white transition-colors duration-200 rounded-none shrink-0 cursor-pointer"
            >
              <FaHome className="text-xs sm:text-sm" />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">
                Accueil
              </span>
            </button>

            <div className="h-4 w-[1px] bg-slate-800 shrink-0" />

            <div className="flex items-center gap-2 truncate">
              <FaHospital className="text-[#CE1126] text-xs sm:text-sm shrink-0" />
              <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white truncate">
                Portail Hôpital <span className="text-slate-400 font-bold hidden md:inline">| Contrôle Tiers-Payant</span>
              </h1>
            </div>
          </div>

          {/* Droite : Liens rapides établissement */}
          <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              to="/reseau-soins"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-[#111827] hover:bg-slate-800 border border-slate-800 transition-colors rounded-none"
            >
              <FaShieldAlt className="text-[#00A3E0] text-xs" />
              <span className="hidden xs:inline">Réseau Soins</span>
            </Link>

            <Link
              to="/login"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-[#111827] hover:bg-slate-800 border border-slate-800 transition-colors rounded-none"
            >
              <FaUserShield className="text-emerald-400 text-xs" />
              <span className="hidden md:inline">Connexion Staff</span>
            </Link>
          </nav>

        </div>
      </header>

      {/* ================= 2. CONTENU PRINCIPAL COMPACT ================= */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        
        {/* En-tête compact */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.18em] text-[#00A3E0] mb-1">
              Espace Hôpital & Clinique Partenaire RDC
            </p>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white uppercase leading-none flex items-center gap-2">
              <FaHospital className="text-[#CE1126] text-base sm:text-xl" /> Vérification de Police
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 max-w-md sm:text-right leading-snug">
            Contrôle instantané sans compte staff. Données personnelles partiellement anonymisées.
          </p>
        </div>

        {/* Grille 2 colonnes : Recherche (Col 5) + Résultat / Verdict (Col 7) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          
          {/* COLONNE GAUCHE : FORMULAIRE DE VÉRIFICATION */}
          <div className="lg:col-span-5 w-full space-y-3">
            {boot ? (
              <div className="bg-[#111827] border border-slate-800 p-4 flex items-center gap-2 text-slate-400 text-xs">
                <FaSpinner className="animate-spin text-[#00A3E0]" /> Chargement de la configuration…
              </div>
            ) : (
              <form onSubmit={onSubmit} className="bg-[#111827] border border-slate-800 p-4 sm:p-5 space-y-3.5 shadow-xl rounded-none">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    N° de police assuré *
                  </label>
                  <input
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value.toUpperCase())}
                    placeholder="DRC-2026-XXXXX"
                    className="w-full px-3 py-2 bg-[#090d16] border border-slate-800 text-xs sm:text-sm font-mono font-bold text-white focus:outline-none focus:border-[#00A3E0] rounded-none placeholder-slate-600"
                    autoComplete="off"
                  />
                </div>

                {pinRequired && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1.5">
                      <FaLock className="text-[#CE1126]" /> Code établissement (PIN) *
                    </label>
                    <input
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="PIN fourni par ESNAS"
                      className="w-full px-3 py-2 bg-[#090d16] border border-slate-800 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-[#00A3E0] rounded-none placeholder-slate-600"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00A3E0] hover:bg-[#008ec4] text-white text-[11px] font-black uppercase tracking-[0.14em] transition-colors disabled:opacity-60 rounded-none cursor-pointer"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaSearch className="text-xs" />}
                  <span>Vérifier le contrat</span>
                </button>
              </form>
            )}

            {error && (
              <div className="bg-red-950/40 border border-red-500/40 text-red-300 px-3.5 py-2.5 text-xs font-bold flex items-start gap-2 rounded-none">
                <FaExclamationTriangle className="text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

                   {/* COLONNE DROITE : RÉSULTAT & FICHE DE PRISE EN CHARGE */}
          <div className="lg:col-span-7 w-full">
            {!result ? (
              <div className="bg-[#111827]/60 border border-dashed border-slate-800 p-5 sm:p-6 text-left space-y-2.5 rounded-none">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  En attente de contrôle
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Saisissez le numéro figurant sur la carte numérique ou l&apos;attestation QR Code du patient pour vérifier immédiatement :
                </p>
                <ul className="text-[11px] text-slate-400 space-y-1 pt-1">
                  <li>• La validité temporelle du contrat et le statut actif</li>
                  <li>• Le plafond annuel restant disponible en USD</li>
                  <li>• L&apos;autorisation directe de prise en charge (Tiers-Payant)</li>
                </ul>
              </div>
            ) : (
              <div className={`border p-4 sm:p-5 space-y-4 rounded-none shadow-xl ${result.valid ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-amber-500/50 bg-amber-950/20'}`}>
                
                {/* Bandeau statut principal */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 text-sm sm:text-base font-black uppercase tracking-wider">
                    {result.valid ? (
                      <><FaCheckCircle className="text-emerald-400 text-lg" /> <span className="text-emerald-300">Contrat Valide</span></>
                    ) : (
                      <><FaTimesCircle className="text-amber-400 text-lg" /> <span className="text-amber-300">Contrat Non Valide</span></>
                    )}
                  </div>
                  {result.policy && (
                    <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                      result.policy.careAuthorized 
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                        : 'bg-red-500/20 border-red-500/40 text-red-300'
                    }`}>
                      Tiers-Payant : {result.policy.careAuthorized ? 'AUTORISÉ' : 'REFUSÉ'}
                    </span>
                  )}
                </div>

                {result.guidance && <p className="text-xs text-slate-200 leading-relaxed">{result.guidance}</p>}
                {result.reasons?.length > 0 && (
                  <p className="text-[11px] text-amber-300 font-semibold">Motifs : {result.reasons.join(', ')}</p>
                )}

                {/* Grille des données du contrat */}
                {result.policy && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
                    <div className="bg-[#090d16] p-2.5 border border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">N° Police</span>
                      <span className="text-xs font-mono font-black text-white block mt-0.5">{result.policy.policyNumber}</span>
                    </div>
                    <div className="bg-[#090d16] p-2.5 border border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Branche & Niveau</span>
                      <span className="text-xs font-bold text-white capitalize block mt-0.5">{result.policy.branch} · {result.policy.coverageLevel}</span>
                    </div>
                    <div className="bg-[#090d16] p-2.5 border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Plafond Restant</span>
                      <span className="text-xs font-black text-emerald-400 block mt-0.5">
                        {money(result.policy.remainingLimitUSD)} <span className="text-[10px] text-slate-400 font-normal">/ {money(result.policy.annualLimitUSD)}</span>
                      </span>
                    </div>
                    <div className="bg-[#090d16] p-2.5 border border-slate-800 col-span-2">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Période de validité</span>
                      <span className="text-xs font-bold text-slate-200 block mt-0.5">
                        {result.policy.startDate ? new Date(result.policy.startDate).toLocaleDateString() : '—'} → {result.policy.endDate ? new Date(result.policy.endDate).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <div className="bg-[#090d16] p-2.5 border border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Sinistres ouverts</span>
                      <span className="text-xs font-bold text-white block mt-0.5">{result.policy.openClaimCount}</span>
                    </div>
                  </div>
                )}

                {/* Identité bénéficiaire */}
                {result.beneficiary && (
                  <div className="bg-[#090d16] p-3 border border-slate-800 flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FaIdCard className="text-[#00A3E0]" /> Bénéficiaire (Identité partielle)
                      </span>
                      <p className="text-xs sm:text-sm font-black text-white mt-0.5">{result.beneficiary.displayName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {result.beneficiary.city || '—'} · {result.beneficiary.phone || 'tél. masqué'} · {result.beneficiary.nationalIdHint || 'CNI n/a'}
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-slate-500 pt-1">
                  Horodatage contrôle : {result.checkedAt ? new Date(result.checkedAt).toLocaleString() : '—'} · Mode : {result.accessMode || 'open'}
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
