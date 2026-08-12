import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaCoins, FaUsers, FaFileMedical, FaShieldAlt,
  FaCalendarAlt, FaCheckCircle, FaClock, FaChartLine, FaSpinner,
  FaArrowRight, FaCreditCard, FaFileInvoiceDollar, FaUserCircle
} from 'react-icons/fa';
import dashboardService from '../services/dashboardService';
import authService from '../services/authService';

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' USD';
}

export default function AdminHome() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser() || {};
  const role = String(currentUser.role || 'client').toLowerCase();
  const isStaff = ['admin', 'agent', 'underwriter', 'finance', 'claims_manager'].includes(role);
  const firstName = currentUser.firstName || currentUser.FirstName || currentUser.name || 'Utilisateur';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [s, r] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentPolicies(),
        ]);
        if (cancelled) return;
        setStats(s.stats || s);
        setRecent(r.policies || []);
      } catch (e) {
        if (!cancelled) {
          setError(e.userMessage || e.message || 'Impossible de charger le tableau de bord.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const cards = [
    {
      id: 1,
      title: 'Primes encaissées (30j)',
      value: money(stats?.premiums30dUSD),
      icon: <FaCoins className="text-[#00A3E0]" />,
      bgIcon: 'bg-[#00A3E0]/10',
      description: `Total historique : ${money(stats?.totalPremiumsUSD)} · ${stats?.transactionCount || 0} tx`,
    },
    {
      id: 2,
      title: stats?.scope === 'all' ? 'Utilisateurs actifs' : 'Mes polices',
      value: String(stats?.scope === 'all' ? (stats?.userCount || 0) : (stats?.policyCount || 0)),
      icon: <FaUsers className="text-[#FDD100]" />,
      bgIcon: 'bg-[#FDD100]/10',
      description: `${stats?.activePolicies || 0} polices actives · ${stats?.pendingPolicies || 0} en attente`,
    },
    {
      id: 3,
      title: 'Sinistres ouverts',
      value: String(stats?.openClaims || 0),
      icon: <FaFileMedical className="text-[#CE1126]" />,
      bgIcon: 'bg-[#CE1126]/10',
      description: `${stats?.claimCount || 0} dossiers · ${stats?.approvedClaims || 0} approuvés`,
    },
    {
      id: 4,
      title: 'Périmètre données',
      value: stats?.scope === 'all' ? 'GLOBAL' : 'MON COMPTE',
      icon: <FaChartLine className="text-emerald-500" />,
      bgIcon: 'bg-emerald-500/10',
      description: 'Données live SQL Server via API sécurisée JWT',
    },
  ];

  const quickActions = isStaff
    ? [
        { label: 'Vérifier une police', detail: 'Contrôle instantané', path: '/dashboard/verification', icon: FaShieldAlt },
        { label: 'Traiter les sinistres', detail: `${stats?.openClaims || 0} dossier(s) ouvert(s)`, path: '/dashboard/claims', icon: FaFileMedical },
        { label: 'Voir les analyses', detail: 'Pilotage des risques', path: '/dashboard/analytics', icon: FaChartLine },
      ]
    : [
        { label: 'Mes paiements', detail: `${stats?.transactionCount || 0} transaction(s)`, path: '/dashboard/payments', icon: FaCreditCard },
        { label: 'Mes factures', detail: 'Consulter et imprimer', path: '/dashboard/invoices', icon: FaFileInvoiceDollar },
        { label: 'Mon profil', detail: 'Compte et sécurité', path: '/dashboard/profile', icon: FaUserCircle },
      ];

  const activityBars = [
    { label: 'Actives', value: stats?.activePolicies || 0, color: 'bg-emerald-500' },
    { label: 'En attente', value: stats?.pendingPolicies || 0, color: 'bg-amber-400' },
    { label: 'Sinistres', value: stats?.openClaims || 0, color: 'bg-[#CE1126]' },
    { label: 'Approuvés', value: stats?.approvedClaims || 0, color: 'bg-[#00A3E0]' },
  ];
  const activityMax = Math.max(1, ...activityBars.map((item) => item.value));

  return (
    <div className="space-y-6 text-slate-100 animate-fadeIn">
      <div className="admin-panel relative overflow-hidden px-5 py-6 sm:px-7">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-t" />
        <div className="absolute -right-20 top-0 h-48 w-48 rounded-full bg-[#00A3E0]/10 blur-3xl" />
        <div className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-[#FDD100]/10 blur-3xl" />
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-[10px] font-black uppercase text-[#00A3E0]">
            {isStaff ? 'Pilotage opérationnel' : 'Espace personnel sécurisé'}
          </p>
          <h1 className="text-2xl font-black tracking-normal md:text-3xl">
            Bonjour, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            {isStaff
              ? 'Suivez les opérations, les risques et les encaissements en temps réel.'
              : 'Retrouvez vos contrats, paiements et documents dans un seul espace.'}
          </p>
        </div>
        <div className="admin-chip flex items-center gap-2 self-start px-4 py-2.5 text-xs font-bold sm:self-center">
          <FaCalendarAlt className="text-[#00A3E0]" />
          <span>{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-slate-500 py-10 justify-center">
          <FaSpinner className="animate-spin text-[#00A3E0]" /> Chargement des indicateurs...
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((stat, idx) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="admin-panel flex min-h-44 flex-col justify-between p-5 transition-transform hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`grid h-10 w-10 place-items-center ${stat.bgIcon} shrink-0`}>{stat.icon}</div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{stat.title}</p>
                  <h3 className="mt-2 text-2xl font-black text-white md:text-3xl">
                    {stat.value}
                  </h3>
                </div>
                <p className="mt-4 border-t border-white/10 pt-3 text-[11px] text-slate-300">
                  {stat.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <section className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div><h2 className="font-black">Vue opérationnelle</h2><p className="text-xs text-slate-500">Répartition actuelle de votre activité</p></div>
                <FaChartLine className="text-[#00A3E0]" />
              </div>
              <div className="grid h-48 grid-cols-4 items-end gap-3 border-b border-slate-200 px-2 dark:border-slate-700 sm:gap-6">
                {activityBars.map((item) => (
                  <div key={item.label} className="flex h-full flex-col justify-end text-center">
                    <span className="mb-2 text-sm font-black">{item.value}</span>
                    <div className={`${item.color} mx-auto w-full max-w-16 transition-[height] duration-500`} style={{ height: `${Math.max(8, (item.value / activityMax) * 120)}px` }} />
                    <span className="mt-2 truncate text-[9px] font-bold uppercase text-slate-500 sm:text-[10px]">{item.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="border border-slate-200 bg-slate-900 p-5 text-white dark:border-slate-800">
              <div className="mb-5"><h2 className="font-black">Actions rapides</h2><p className="text-xs text-slate-400">Accès direct aux tâches fréquentes</p></div>
              <div className="space-y-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button key={action.path} type="button" onClick={() => navigate(action.path)} className="flex w-full items-center gap-3 border border-slate-700 p-3 text-left transition hover:border-[#00A3E0] hover:bg-slate-800">
                      <span className="grid h-9 w-9 shrink-0 place-items-center bg-slate-800 text-[#00A3E0]"><Icon /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black">{action.label}</span><span className="block truncate text-[11px] text-slate-400">{action.detail}</span></span>
                      <FaArrowRight className="text-xs text-slate-500" />
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 flex justify-between items-center">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-400">Souscriptions récentes</h3>
                <span className="text-[10px] font-bold bg-[#00A3E0]/10 text-[#00A3E0] px-2.5 py-1 rounded-md">API live</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3">Réf Police</th>
                      <th className="pb-3">Donneur d&apos;ordre</th>
                      <th className="pb-3">Bénéficiaire (RDC)</th>
                      <th className="pb-3">Formule</th>
                      <th className="pb-3 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 font-medium">
                    {recent.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">Aucune police pour le moment.</td>
                      </tr>
                    )}
                    {recent.map((p) => (
                      <tr key={p.PolicyNumber} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">{p.PolicyNumber}</td>
                        <td className="py-3.5">{p.BuyerFirstName} {p.BuyerLastName}{p.CountryOfResidence ? ` (${p.CountryOfResidence})` : ''}</td>
                        <td className="py-3.5">{p.BeneficiaryFirstName} {p.BeneficiaryLastName}{p.BeneficiaryCity ? ` (${p.BeneficiaryCity})` : ''}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px]">
                            {p.InsuranceBranch || p.CoverageLevel || '—'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-bold text-[#00A3E0]">{money(p.PremiumUSD)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4 border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-4">
                Santé opérationnelle
              </h3>
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Polices actives</p>
                  <p className="text-xs text-slate-500">{stats?.activePolicies || 0} contrats en vigueur</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaClock className="text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">En attente paiement</p>
                  <p className="text-xs text-slate-500">{stats?.pendingPolicies || 0} dossiers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaFileMedical className="text-[#CE1126] mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Sinistres à traiter</p>
                  <p className="text-xs text-slate-500">{stats?.openClaims || 0} ouverts</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
