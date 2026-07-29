import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCoins, FaExchangeAlt, FaShieldAlt, FaChartLine, 
  FaUniversity, FaArrowUp, FaCheckCircle, FaCalendarAlt 
} from 'react-icons/fa';
import notificationService from '../services/notificationService';

export default function FinanceDashboard() {
  const currentYear = new Date().getFullYear();
  const [fixedRate, setFixedRate] = useState(2850); // Taux indicatif moyen en RDC

  const handleUpdateRate = () => {
    if (notificationService?.success) {
      notificationService.success(`Le taux de change interne de DRC Assurances a été fixé à ${fixedRate} CDF pour 1 USD.`);
    }
  };

  // Simulation des volumes financiers par devise perçue
  const forexVolumes = [
    { currency: "USD (Dollars Américains)", amount: "94,200 USD", share: "66%", color: "text-[#00A3E0]" },
    { currency: "EUR (Euros - Diaspora)", amount: "38,500 EUR", share: "27%", color: "text-purple-500" },
    { currency: "CDF (Francs Congolais - Local)", amount: "27,930,000 CDF", share: "7%", color: "text-[#FDD100]" }
  ];

  return (
    <div className="space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen p-1 text-slate-800 dark:text-slate-100 animate-fadeIn">
      
      {/* --- EN-TÊTE FINANCIER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <FaCoins className="text-[#00A3E0]" /> Contrôle Financier & Trésorerie Multi-Devises
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gestion de la compensation des devises transfrontalières, fixation du taux Forex interne et conciliation bancaire.</p>
        </div>
      </div>

      {/* --- INFRASTRUCTURE DE FIXATION DU TAUX DE CHANGE (FOREX) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module Fixation Taux (1/3) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FaExchangeAlt className="text-[#00A3E0]" /> Taux de Change Commercial Interne
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Fixez le taux de référence pour la conversion automatique des paiements reçus en EUR/USD vers les prestations payées aux cliniques locales en CDF.
          </p>
          <div className="flex gap-2">
            <div className="relative flex items-center flex-grow">
              <input 
                type="number" 
                value={fixedRate} 
                onChange={(e) => setFixedRate(parseInt(e.target.value) || 0)}
                className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-black text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
              />
              <span className="absolute right-4 text-xs font-bold text-slate-400 font-mono">CDF</span>
            </div>
            <button 
              onClick={handleUpdateRate}
              className="px-4 bg-[#00A3E0] hover:bg-[#0082B3] text-white rounded-xl text-xs font-bold transition-all border-b-2 border-[#006180] shrink-0"
            >
              Mettre à jour
            </button>
          </div>
        </div>

        {/* Module Répartition des Encaissements (2/3) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex justify-between items-center">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-400">Volume de Trésorerie par Monnaie</h3>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full flex items-center gap-1"><FaUniversity /> Comptes de Dépôt Sécurisés</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {forexVolumes.map((vol, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wide">{vol.currency}</span>
                <span className={`text-lg font-black block font-mono ${vol.color}`}>{vol.amount}</span>
                <span className="text-[10px] text-slate-400 font-semibold block pt-1 border-t border-slate-100 dark:border-slate-800/50">Quote-part : {vol.share}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* --- COMPENSATION ET PROTECTION DU RÉSULTAT FINANCIER --- */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <span className="text-xs font-black uppercase text-[#00A3E0] tracking-wider bg-[#00A3E0]/10 px-3 py-1 rounded-md mb-3 inline-block">
            Garantie Actuarielle
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-3">
            Couverture du Risque de Change Transfrontalier
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Le modèle Fintech de DRC Assurances intègre un mécanisme de couverture automatique. Toutes les polices émises auprès de la diaspora en devises étrangères font l'objet d'un provisionnement réglementé indexé sur le dollar américain (USD) pour contrer l'inflation du marché congolais local.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-4">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/60 pb-2">
            <FaShieldAlt className="text-[#00A3E0]" /> Normes Prudentielles ARCA
          </h4>
          <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2"><FaCheckCircle className="text-emerald-500" /> Taux de couverture des engagements : <span className="text-emerald-500 ml-auto font-bold font-mono">145% (Conforme)</span></div>
            <div className="flex items-center gap-2"><FaCheckCircle className="text-emerald-500" /> Dépôts de cautionnement à la Banque Centrale : <span className="text-emerald-500 ml-auto font-bold font-mono">Validés ✅</span></div>
            <div className="flex items-center gap-2"><FaCalendarAlt className="text-slate-400" /> Prochaine déclaration fiscale trimestrielle : <span className="text-slate-500 ml-auto font-bold">30 Septembre</span></div>
          </div>
        </div>
      </div>

    </div>
  );
}
