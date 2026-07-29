import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaChartBar, FaShieldAlt, FaHeartbeat, FaCar, 
  FaGraduationCap, FaMapMarkerAlt, FaChartLine, FaDownload, 
  FaFilter, FaCalendarAlt 
} from 'react-icons/fa';

export default function Analytics() {
  const currentYear = new Date().getFullYear();
  const [selectedBranch, setSelectedBranch] = useState('Toutes');
  const [selectedProvince, setSelectedProvince] = useState('Toutes');

  // Données de simulation pour la répartition des branches (Données Actuarielles)
  const branchDistribution = [
    { name: "Santé / Médical", percentage: 55, count: "2 113 polices", color: "bg-[#CE1126]", icon: <FaHeartbeat /> },
    { name: "Automobile ARCA", percentage: 30, count: "1 152 polices", color: "bg-[#FDD100]", icon: <FaCar className="text-slate-900" /> },
    { name: "Protection Scolaire", percentage: 15, count: "577 polices", color: "bg-[#00A3E0]", icon: <FaGraduationCap /> }
  ];

  // Données de sinistralité par Province de la RDC
  const provinceStats = [
    { province: "Kinshasa", claims: 45, ratio: "12%", cost: "14,200 USD", status: "Risque Modéré" },
    { province: "Haut-Katanga (Lubumbashi)", claims: 28, ratio: "9%", cost: "8,900 USD", status: "Risque Faible" },
    { province: "Nord-Kivu (Goma)", claims: 18, ratio: "15%", cost: "7,500 USD", status: "Surveillance Active" },
    { province: "Kongo-Central (Matadi)", claims: 12, ratio: "7%", cost: "3,100 USD", status: "Risque Faible" }
  ];

  // Métriques globales de performance de risques
  const financialKPIs = [
    { title: "Ratio S/P (Sinistres à Primes)", value: "24.5%", target: "Objectif ARCA < 60%", isOptimal: true },
    { title: "Coût Moyen d'un Sinistre", value: "315 USD", target: "Réseau Tiers-Payant", isOptimal: true },
    { title: "Délai de Règlement Moyen", value: "4.2 jours", target: "Objectif Interne < 7j", isOptimal: true }
  ];

  const handleExportData = () => {
    alert("Génération et chiffrement du rapport d'analyse de risques au format PDF/Excel pour l'ARCA...");
  };

  return (
    <div className="space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen p-1 text-slate-800 dark:text-slate-100 animate-fadeIn">
      
      {/* --- EN-TÊTE ANALYTIQUE & ACTIONS --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <FaChartBar className="text-[#00A3E0]" /> Analyse Statistique & Actuariat
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Suivi des indicateurs de sinistralité, répartition des risques et performance financière en RDC.</p>
        </div>
        
        {/* Bouton Export ARCA */}
        <button 
          onClick={handleExportData}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all transform active:scale-95 border-b-2 border-slate-950 self-start sm:self-center"
        >
          <FaDownload /> Exporter Rapport Trimestriel
        </button>
      </div>

      {/* --- INFRASTRUCTURE DE FILTRAGE DES DONNÉES --- */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <FaFilter className="text-[#00A3E0]" /> Segmenter l'analyse :
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedBranch} 
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          >
            <option value="Toutes">Toutes les branches</option>
            <option value="Santé">Santé uniquement</option>
            <option value="Auto">Automobile uniquement</option>
          </select>
          <select 
            value={selectedProvince} 
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          >
            <option value="Toutes">Toutes les provinces</option>
            <option value="Kinshasa">Kinshasa</option>
            <option value="Katanga">Haut-Katanga</option>
            <option value="Kivu">Kivu</option>
          </select>
        </div>
      </div>

      {/* --- 1. GRILLE SUPÉRIEURE : INDICATEURS DE CONTRÔLE DES RISQUES --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {financialKPIs.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#00A3E0]/5 rounded-bl-full pointer-events-none" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
              {kpi.value}
            </h3>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-500">
              <FaChartLine /> <span>{kpi.target}</span>
            </div>
          </div>
        ))}
      </div>

      {/* --- 2. DOUBLE MODULE SÉGMENTATION ET GEOLOCALISATION DES SINISTRES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Graphique de Répartition des Branches */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-5 flex justify-between items-center">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-400">Répartition par Branche</h3>
              <FaShieldAlt className="text-[#00A3E0] opacity-30" />
            </div>

            <div className="space-y-5">
              {branchDistribution.map((branch, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span className={`p-1.5 ${branch.color} text-white rounded-md text-[10px]`}>{branch.icon}</span>
                      {branch.name}
                    </span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">{branch.percentage}%</span>
                  </div>
                  {/* Jauge visuelle */}
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${branch.color}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${branch.percentage}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  
                  {/* ─── ✅ FIX DE LA LIGNE 100 : Utilisation de FaChartLine valide à la place de FaTrendingUp ─── */}
                  <div className="text-[10px] text-slate-400 pl-7 flex items-center gap-1">
                    <FaChartLine size={10} className="text-emerald-500" />
                    <span>{branch.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-semibold pt-4 mt-6 border-t border-slate-50 dark:border-slate-800/60 flex items-center justify-center gap-1.5">
            <FaCalendarAlt /> Exercice fiscal en cours : {currentYear}
          </div>
        </div>

        {/* Tableau de Sinistralité Régionale */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 flex justify-between items-center">
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-400">Cartographie Générale de la Sinistralité</h3>
            <span className="text-[10px] font-bold bg-red-500/10 text-[#CE1126] px-2.5 py-1 rounded-md flex items-center gap-1">
              <FaMapMarkerAlt /> Audit Géolocalisé
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/20 dark:bg-slate-800/10">
                  <th className="pb-3">Province / Ville</th>
                  <th className="pb-3 text-center">Déclarations</th>
                  <th className="pb-3 text-center">Fréquence</th>
                  <th className="pb-3 text-right">Coût Total Déclaré</th>
                  <th className="pb-3 text-right">Alerte Seuil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 font-medium">
                {provinceStats.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-4 font-bold text-slate-900 dark:text-white">{item.province}</td>
                    <td className="py-4 text-center font-mono">{item.claims}</td>
                    <td className="py-4 text-center font-mono">{item.ratio}</td>
                    <td className="py-4 text-right font-black text-[#00A3E0] font-mono">{item.cost}</td>
                    <td className="py-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === "Surveillance Active" 
                          ? 'bg-[#CE1126]/10 text-[#CE1126] border border-[#CE1126]/20' 
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
