import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaCoins, FaUsers, FaFileMedical, FaShieldAlt, 
  FaArrowUp, FaArrowDown, FaCalendarAlt, FaCheckCircle, 
  FaClock, FaChartLine 
} from 'react-icons/fa';

export default function AdminHome() {
  const currentYear = new Date().getFullYear();

  // Simulation de données statistiques pour la console de supervision
  const stats = [
    {
      id: 1,
      title: "Primes Diaspora Globales",
      value: "142,500 USD",
      change: "+12.4%",
      isPositive: true,
      icon: <FaCoins className="text-[#00A3E0]" />,
      bgIcon: "bg-[#00A3E0]/10",
      description: "Fonds injectés sur les 30 derniers jours"
    },
    {
      id: 2,
      title: "Bénéficiaires Actifs RDC",
      value: "3,842",
      change: "+8.2%",
      isPositive: true,
      icon: <FaUsers className="text-[#FDD100]" />,
      bgIcon: "bg-[#FDD100]/10",
      description: "Prises en charge ouvertes à Kinshasa/Goma"
    },
    {
      id: 3,
      title: "Dossiers Sinistres Télétraités",
      value: "114",
      change: "-3.1%",
      isPositive: false,
      icon: <FaFileMedical className="text-[#CE1126]" />,
      bgIcon: "bg-[#CE1126]/10",
      description: "Taux d'accidents et requêtes en baisse"
    },
    {
      id: 4,
      title: "Taux de Change Moyen",
      value: "2 850 CDF",
      change: "Stable",
      isPositive: true,
      icon: <FaChartLine className="text-emerald-500" />,
      bgIcon: "bg-emerald-500/10",
      description: "Fixation Forex interne pour 1 USD"
    }
  ];

  // Derniers mouvements de souscription enregistrés (Flux Diaspora -> RDC)
  const recentActivities = [
    { id: "POL-9821", buyer: "Jean Mbuyi (Paris)", beneficiary: "Maman Thérèse (Kinshasa)", product: "Pack Santé Maman", amount: "45 USD", status: "Actif" },
    { id: "POL-9820", buyer: "Sarah K. (Bruxelles)", beneficiary: "Arsène K. (Lubumbashi)", product: "Auto Confort Tiers-Payant", amount: "29 USD", status: "Actif" },
    { id: "POL-9819", buyer: "Marc L. (Montréal)", beneficiary: "Fiston L. (Goma)", product: "Student Protect RDC", amount: "15 USD", status: "En attente" }
  ];

  return (
    <div className="space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen p-1 text-slate-800 dark:text-slate-100 animate-fadeIn">
      
      {/* --- EN-TÊTE DU DASHBOARD --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <FaShieldAlt className="text-[#00A3E0]" /> Console Supervision Générale
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Statistiques financières et suivi de la sinistralité en République Démocratique du Congo.</p>
        </div>
        
        {/* Badge Date */}
        <div className="flex items-center gap-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl shadow-sm self-start sm:self-center">
          <FaCalendarAlt className="text-[#00A3E0]" />
          <span>Tableau de bord — {currentYear}</span>
        </div>
      </div>

      {/* --- 1. GRILLE DES KPI / STATISTIQUES AVANCÉES --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${stat.bgIcon} rounded-xl shrink-0`}>
                  {stat.icon}
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-black px-2 py-0.5 rounded-md ${
                  stat.change === "Stable" 
                    ? 'bg-slate-100 text-slate-500' 
                    : stat.isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                }`}>
                  {stat.change !== "Stable" && (stat.isPositive ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />)}
                  <span>{stat.change}</span>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {stat.value}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 border-t border-slate-50 dark:border-slate-800/60 pt-2 italic">
              {stat.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* --- 2. TRAÇABILITÉ DES FLUX ET COMPLIANCE ARCA --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tableau des dernières polices d'assurance émises (2 tiers) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 flex justify-between items-center">
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-400">Souscriptions Transfrontalières Récentes</h3>
            <span className="text-[10px] font-bold bg-[#00A3E0]/10 text-[#00A3E0] px-2.5 py-1 rounded-md">Temps réel</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Réf Police</th>
                  <th className="pb-3">Donneur d'Ordre (Diaspora)</th>
                  <th className="pb-3">Bénéficiaire (RDC)</th>
                  <th className="pb-3">Formule</th>
                  <th className="pb-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 font-medium">
                {recentActivities.map((activity) => (
                  <tr key={activity.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">{activity.id}</td>
                    <td className="py-3.5">{activity.buyer}</td>
                    <td className="py-3.5">{activity.beneficiary}</td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px]">
                        {activity.product}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-bold text-[#00A3E0]">{activity.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bloc d'audit réglementaire ARCA (1 tiers) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-400">Statut Conformité Régulateur</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Agrément ARCA Actif</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Les structures d'adossement de risques respectent les ratios de solvabilité exigés.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Quittances Numériques Prêtes</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Génération automatique des justificatifs de paiement avec horodatage blockchain sécurisé.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaClock className="text-[#00A3E0] mt-0.5 shrink-0" size={16} />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Prochain Audit Système</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Prévu de manière automatisée pour valider la transparence des comptes transfrontaliers.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-mono text-center uppercase tracking-widest font-black">
            DRC Assurances Core Tech Engine v1.0
          </div>
        </div>

      </div>

    </div>
  );
}
