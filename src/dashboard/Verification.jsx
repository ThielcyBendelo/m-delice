import React, { useState } from 'react';
import {
  FaShieldAlt, FaSearch, FaCheckCircle, FaTimesCircle, FaSpinner, FaIdCard, FaUsers
} from 'react-icons/fa';
import dashboardService from '../services/dashboardService';

function money(n) {
  return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' USD';
}

export default function Verification() {
  const [policyNumber, setPolicyNumber] = useState('');
  const [beneficiaryQ, setBeneficiaryQ] = useState('');
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [loadingBen, setLoadingBen] = useState(false);
  const [policyResult, setPolicyResult] = useState(null);
  const [benResult, setBenResult] = useState(null);
  const [error, setError] = useState('');

  async function verifyPolicy(e) {
    e.preventDefault();
    setError('');
    setPolicyResult(null);
    if (!policyNumber.trim()) return;
    setLoadingPolicy(true);
    try {
      const data = await dashboardService.verifyPolicy(policyNumber.trim());
      setPolicyResult(data);
    } catch (err) {
      setError(err.userMessage || err.message || 'Erreur vérification police');
    } finally {
      setLoadingPolicy(false);
    }
  }

  async function searchBeneficiary(e) {
    e.preventDefault();
    setError('');
    setBenResult(null);
    if (!beneficiaryQ.trim() || beneficiaryQ.trim().length < 3) {
      setError('Saisissez au moins 3 caractères (tél, nom, CNI, police).');
      return;
    }
    setLoadingBen(true);
    try {
      const data = await dashboardService.verifyBeneficiary(beneficiaryQ.trim());
      setBenResult(data);
    } catch (err) {
      setError(err.userMessage || err.message || 'Erreur recherche bénéficiaire (staff requis)');
    } finally {
      setLoadingBen(false);
    }
  }

  return (
    <div className="space-y-8 min-h-screen p-1 text-slate-100 animate-fadeIn">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <FaShieldAlt className="text-[#00A3E0]" /> Vérification administrative
        </h1>
        <p className="text-xs text-slate-300">
          Contrôle police / bénéficiaire en direct sur SQL Server (hôpital, agent, admin).
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={verifyPolicy} className="admin-panel p-5 rounded-2xl space-y-4">
          <h2 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <FaIdCard className="text-[#00A3E0]" /> Police
          </h2>
          <input
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            placeholder="Ex: DRC-2026-12345"
            className="touch-target w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          />
          <button
            type="submit"
            disabled={loadingPolicy}
            className="touch-target inline-flex w-full sm:w-auto justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A3E0] text-white text-sm font-bold disabled:opacity-60"
          >
            {loadingPolicy ? <FaSpinner className="animate-spin" /> : <FaSearch />} Vérifier la police
          </button>

          {policyResult && (
            <div className={`mt-4 p-4 rounded-xl border text-sm space-y-2 ${policyResult.valid ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
              <div className="flex items-center gap-2 font-black">
                {policyResult.valid ? <FaCheckCircle className="text-emerald-500" /> : <FaTimesCircle className="text-amber-500" />}
                {policyResult.valid ? 'CONTRAT VALIDE' : 'CONTRAT NON VALIDE'}
              </div>
              {policyResult.reasons?.length > 0 && (
                <p className="text-xs opacity-80">Raisons : {policyResult.reasons.join(', ')}</p>
              )}
              {policyResult.policy && (
                <ul className="text-xs space-y-1 pt-2 border-t border-white/10 text-slate-200">
                  <li><b>N°</b> {policyResult.policy.policyNumber}</li>
                  <li><b>Branche</b> {policyResult.policy.branch} · {policyResult.policy.coverageLevel}</li>
                  <li><b>Statut</b> {policyResult.policy.status} · actif={String(policyResult.policy.isActive)}</li>
                  <li><b>Plafond restant</b> {money(policyResult.policy.remainingLimitUSD)} / {money(policyResult.policy.annualLimitUSD)}</li>
                  <li><b>Fin</b> {policyResult.policy.endDate ? new Date(policyResult.policy.endDate).toLocaleDateString() : '—'}</li>
                  <li><b>Sinistres ouverts</b> {policyResult.policy.openClaimCount} / {policyResult.policy.claimCount}</li>
                </ul>
              )}
              {policyResult.beneficiary && (
                <p className="text-xs pt-2">
                  <b>Bénéficiaire</b> {policyResult.beneficiary.lastName} {policyResult.beneficiary.firstName}
                  {policyResult.beneficiary.city ? ` · ${policyResult.beneficiary.city}` : ''}
                  {policyResult.beneficiary.phone ? ` · ${policyResult.beneficiary.phone}` : ''}
                </p>
              )}
            </div>
          )}
        </form>

        <form onSubmit={searchBeneficiary} className="admin-panel p-5 rounded-2xl space-y-4">
          <h2 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <FaUsers className="text-[#FDD100]" /> Bénéficiaire (staff)
          </h2>
          <input
            value={beneficiaryQ}
            onChange={(e) => setBeneficiaryQ(e.target.value)}
            placeholder="Tél +243…, nom, CNI, n° police"
            className="touch-target w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          />
          <button
            type="submit"
            disabled={loadingBen}
            className="touch-target inline-flex w-full sm:w-auto justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-60"
          >
            {loadingBen ? <FaSpinner className="animate-spin" /> : <FaSearch />} Rechercher
          </button>

          {benResult && (
            <div className="mt-2">
              <p className="text-xs text-slate-300 mb-2">{benResult.count || 0} résultat(s)</p>
              <div className="space-y-2 md:hidden">
                {(benResult.matches || []).map((m, i) => (
                  <article key={`${m.BeneficiaryID}-${m.PolicyNumber || i}`} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                    <div className="font-bold text-white">{m.LastName} {m.FirstName}</div>
                    <div className="text-slate-300 mt-1">{m.City || '—'} · {m.PolicyNumber || '—'}</div>
                    <div className="text-slate-400 mt-1">{m.PolicyStatus || (m.IsActive ? 'active' : '—')}</div>
                  </article>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-white/10">
                    <th className="py-2 pr-2">Nom</th>
                    <th className="py-2 pr-2">Ville</th>
                    <th className="py-2 pr-2">Police</th>
                    <th className="py-2">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {(benResult.matches || []).map((m, i) => (
                    <tr key={`${m.BeneficiaryID}-${m.PolicyNumber || i}`}>
                      <td className="py-2 pr-2 font-bold text-white">{m.LastName} {m.FirstName}</td>
                      <td className="py-2 pr-2">{m.City || '—'}</td>
                      <td className="py-2 pr-2 font-mono">{m.PolicyNumber || '—'}</td>
                      <td className="py-2">{m.PolicyStatus || (m.IsActive ? 'active' : '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
