import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCreditCard, FaMobileAlt, FaSearch, FaFilter, 
  FaShieldAlt, FaCoins, FaCheckCircle, FaTimesCircle, 
  FaSync, FaExchangeAlt 
} from 'react-icons/fa';
import notificationService from '../services/notificationService';

export default function PaymentManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [gatewayFilter, setGatewayFilter] = useState("Tous");
  const [isRefreshing, setIsProcessing] = useState(false);

  // Simulation du journal des transactions Fintech de l'écosystème
  const transactionsHistory = [
    {
      txRef: "STR-ch_3MtgXTLkCw",
      policyNumber: "DRC-2026-9821",
      buyer: "Jean Mbuyi (Paris)",
      gateway: "Stripe",
      amountPaid: "45.00 USD",
      currencyPaid: "EUR", // Payé en Europe
      exchangeRate: "1.09", // Taux appliqué EUR/USD
      status: "Completed",
      colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      date: "Aujourd'hui, 14:22"
    },
    {
      txRef: "CIN-MM-17195421",
      policyNumber: "DRC-2026-9820",
      buyer: "Sarah K. (Bruxelles)",
      gateway: "CinetPay (M-Pesa)",
      amountPaid: "29.00 USD",
      currencyPaid: "USD", // Payé localement / indexé USD
      exchangeRate: "1.00",
      status: "Completed",
      colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      date: "Hier, 18:05"
    },
    {
      txRef: "CIN-MM-17195410",
      policyNumber: "DRC-2026-9819",
      buyer: "Marc L. (Montréal)",
      gateway: "CinetPay (Orange Money)",
      amountPaid: "15.00 USD",
      currencyPaid: "CDF", // Initié en Francs Congolais
      exchangeRate: "2850.00", // Taux appliqué USD/CDF
      status: "Pending",
      colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      date: "02 Juillet, 10:11"
    }
  ];

  const handleRefreshGateways = async () => {
    setIsProcessing(true);
    try {
      if (notificationService?.info) {
        notificationService.info("Interrogation des serveurs de compensation Stripe et CinetPay...");
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (notificationService?.success) {
        notificationService.success("Journal des flux financiers synchronisé.");
      }
    } catch {
      notificationService.error("Échec de synchronisation des passerelles Fintech.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtrage combiné (Recherche textuelle + Type de passerelle)
  const filteredTransactions = transactionsHistory.filter(tx => {
    const matchGateway = gatewayFilter === "Tous" || 
                         (gatewayFilter === "Stripe" && tx.gateway === "Stripe") ||
                         (gatewayFilter === "Mobile Money" && tx.gateway.includes("CinetPay"));
    
    const matchSearch = tx.txRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        tx.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        tx.buyer.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchGateway && matchSearch;
  });

  return (
    <div className="space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen p-1 text-slate-800 dark:text-slate-100 animate-fadeIn">
      
      {/* --- EN-TÊTE DU JOURNAL TRANSACTIONNEL --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <FaCoins className="text-[#00A3E0]" /> Journal Central des Transactions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Suivi comptable des flux transfrontaliers, conciliation des devises et audit de sécurité des passerelles de paiement.</p>
        </div>
        
        {/* Bouton de rafraîchissement des passerelles */}
        <button 
          onClick={handleRefreshGateways}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00A3E0] hover:bg-[#0082B3] text-white rounded-xl text-xs font-bold shadow-md transition-all transform active:scale-95 disabled:opacity-50 self-start sm:self-center"
        >
          <FaSync className={isRefreshing ? "animate-spin" : ""} /> 
          {isRefreshing ? "Synchronisation..." : "Forcer la Conciliation"}
        </button>
      </div>

      {/* --- INFRASTRUCTURE DE RECHERCHE & FILTRAGE COMPTABLE --- */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Recherche textuelle */}
        <div className="sm:col-span-2 relative flex items-center">
          <span className="absolute left-3.5 text-slate-400"><FaSearch size={14} /></span>
          <input
            type="text"
            placeholder="Rechercher par Réf Transaction, N° Police ou Nom de l'acheteur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          />
        </div>

        {/* Filtrage par type de guichet */}
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400"><FaFilter size={12} /></span>
          <select
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          >
            <option value="Tous">Toutes les méthodes</option>
            <option value="Stripe">Stripe (Cartes Diaspora)</option>
            <option value="Mobile Money">Mobile Money (CinetPay Local)</option>
          </select>
        </div>

      </div>

      {/* --- JOURNAL DES ENCAISSEMENTS FINTECH --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FaShieldAlt className="text-[#00A3E0]" /> Flux monétaires audités
          </h3>
          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-md font-black">
            {filteredTransactions.length} Transaction(s) filtrée(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/20 dark:bg-slate-800/10">
                <th className="p-4">Réf Réseau</th>
                <th className="p-4">N° Contrat Lié</th>
                <th className="p-4">Donneur d'Ordre</th>
                <th className="p-4 text-center">Passerelle Fintech</th>
                <th className="p-4 text-center">Taux / Conversion</th>
                <th className="p-4 text-center">Monnaie Perçue</th>
                <th className="p-4 text-center">Valeur USD (ARCA)</th>
                <th className="p-4 text-right">Statut Réseau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 font-medium">
              {filteredTransactions.map((tx, idx) => (
                <tr key={idx} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  
                  {/* Référence de Transaction */}
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-white space-y-0.5">
                    <div className="truncate max-w-[150px]">{tx.txRef}</div>
                    <div className="text-[10px] text-slate-400 font-sans font-normal">{tx.date}</div>
                  </td>
                  
                  {/* N° Police */}
                  <td className="p-4 font-mono text-slate-400 font-bold">{tx.policyNumber}</td>

                  {/* Donneur d'Ordre */}
                  <td className="p-4 font-black">{tx.buyer}</td>

                  {/* Passerelle / Type */}
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      {tx.gateway === "Stripe" ? <FaCreditCard className="text-[#00A3E0]" /> : <FaMobileAlt className="text-[#FDD100]" />}
                      {tx.gateway}
                    </span>
                  </td>

                  {/* Taux Appliqué */}
                  <td className="p-4 text-center">
                    <span className="text-slate-400 font-mono flex items-center justify-center gap-1">
                      <FaExchangeAlt size={10} /> 1 = {tx.exchangeRate}
                    </span>
                  </td>

                  {/* Devis Brut Reçue */}
                  <td className="p-4 text-center font-mono font-bold text-slate-500">{tx.currencyPaid}</td>

                  {/* Équivalent USD réglementaire */}
                  <td className="p-4 text-center font-black text-[#00A3E0] font-mono text-sm">{tx.amountPaid}</td>

                  {/* Statut Transaction */}
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${tx.colorClass}`}>   
                        {tx.status === "Completed" ? <FaCheckCircle /> : <FaTimesCircle />} 
                        {tx.status}
                    </span>
                    </td>
                </tr>
              ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}