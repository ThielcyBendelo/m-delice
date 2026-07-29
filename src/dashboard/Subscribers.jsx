import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUserShield, FaSearch, FaGlobe, FaEnvelope, 
  FaPhone, FaHeart, FaCoins, FaCheckCircle, 
  FaFilter, FaFileInvoiceDollar 
} from 'react-icons/fa';
import notificationService from '../services/notificationService';

export default function Subscribers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("Tous");

  // Simulation des données du registre des souscripteurs de la Diaspora
  const subscribersList = [
    {
      id: "SUB-4012",
      lastName: "Mbuyi",
      firstName: "Jean",
      email: "jean.mbuyi@gmail.com",
      phone: "+33612345678",
      country: "France",
      city: "Paris",
      protectedBeneficiaries: 2, // Nombre de proches assurés en RDC
      totalContributed: "1,240 USD", // Volume financier total injecté
      status: "Compte Vérifié",
      colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      id: "SUB-4011",
      lastName: "Kanyinda",
      firstName: "Sarah",
      email: "s.kanyinda@yahoo.be",
      phone: "+32470000000",
      country: "Belgique",
      city: "Bruxelles",
      protectedBeneficiaries: 1,
      totalContributed: "348 USD",
      status: "Compte Vérifié",
      colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      id: "SUB-4010",
      lastName: "Luzolo",
      firstName: "Marc",
      email: "m.luzolo@outlook.ca",
      phone: "+15140000000",
      country: "Canada",
      city: "Montréal",
      protectedBeneficiaries: 3,
      totalContributed: "2,150 USD",
      status: "Contrôle KYC", // Know Your Customer obligatoire
      colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20"
    }
  ];

  const countries = ["Tous", "France", "Belgique", "Canada", "USA"];

  const handleSendStatement = (buyerEmail) => {
    if (notificationService?.success) {
      notificationService.success(`Relevé consolidé des garanties et quittances envoyé à : ${buyerEmail}`);
    }
  };

  // Filtrage combiné (Recherche textuelle + Pays d'origine)
  const filteredSubscribers = subscribersList.filter(sub => {
    const matchCountry = selectedCountry === "Tous" || sub.country === selectedCountry;
    const matchSearch = sub.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        sub.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        sub.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCountry && matchSearch;
  });

  return (
    <div className="space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen p-1 text-slate-800 dark:text-slate-100 animate-fadeIn">
      
      {/* --- EN-TÊTE DU REGISTRE --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <FaUserShield className="text-[#00A3E0]" /> Registre des Souscripteurs (Diaspora)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gestion des donneurs d'ordre internationaux, suivi de l'effort financier global et conformité réglementaire anti-blanchiment (KYC).</p>
        </div>
      </div>

      {/* --- INFRASTRUCTURE DE FILTRAGE & RECHERCHE --- */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Recherche textuelle */}
        <div className="sm:col-span-2 relative flex items-center">
          <span className="absolute left-3.5 text-slate-400"><FaSearch size={14} /></span>
          <input
            type="text"
            placeholder="Rechercher par Nom, Prénom, Email ou Ville de résidence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          />
        </div>

        {/* Filtrage par Pays */}
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400"><FaFilter size={12} /></span>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          >
            {countries.map(country => (
              <option key={country} value={country}>
                {country === "Tous" ? "Tous les pays d'origine" : country}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* --- TABLEAU CENTRAL DES COMPTES DIASPORA --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FaGlobe className="text-[#00A3E0]" /> Portefeuille de clients internationaux
          </h3>
          <span className="text-[10px] font-mono bg-[#00A3E0]/10 text-[#00A3E0] px-2.5 py-1 rounded-md font-black">
            {filteredSubscribers.length} Acheteur(s) Actif(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/20 dark:bg-slate-800/10">
                <th className="p-4">ID Client</th>
                <th className="p-4">Identité Donneur d'Ordre</th>
                <th className="p-4">Coordonnées de Contact</th>
                <th className="p-4">Zone Géographique</th>
                <th className="p-4 text-center">Proches Protégés RDC</th>
                <th className="p-4 text-center">Volume Total Primes</th>
                <th className="p-4 text-center">Conformité KYC</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 font-medium">
              {filteredSubscribers.map((subscriber) => (
                <tr key={subscriber.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  
                  {/* ID Client */}
                  <td className="p-4 font-mono font-bold text-slate-400">{subscriber.id}</td>
                  
                  {/* Nom Prénom */}
                  <td className="p-4">
                    <div className="font-black text-slate-900 dark:text-white text-sm">
                      {subscriber.lastName} {subscriber.firstName}
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="p-4 space-y-0.5">
                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                      <FaEnvelope className="text-slate-400" size={11} /> {subscriber.email}
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                      <FaPhone className="text-slate-400" size={11} /> {subscriber.phone}
                    </div>
                  </td>

                  {/* Résidence */}
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <FaGlobe className="text-[#00A3E0]" size={12} /> {subscriber.country} <span className="text-xs text-slate-400 font-normal">({subscriber.city})</span>
                    </div>
                  </td>

                  {/* Proches assurés en RDC */}
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-[#CE1126] font-black text-[11px]">
                      <FaHeart size={10} /> {subscriber.protectedBeneficiaries} active fiches
                    </span>
                  </td>

                  {/* Volume primes versées */}
                  <td className="p-4 text-center font-black text-[#00A3E0] font-mono text-sm">
                    <div className="flex items-center justify-center gap-1">
                      <FaCoins size={12} className="text-[#FDD100]" /> {subscriber.totalContributed}
                    </div>
                  </td>

                  {/* Statut KYC réglementaire */}
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${subscriber.colorClass}`}>
                      <FaCheckCircle size={10} /> {subscriber.status}
                    </span>
                  </td>
                    {/* Actions */}
                    <td className="p-4 text-right">
                        <button
                            onClick={() => handleSendStatement(subscriber.email)}   
                            className="px-3 py-2 bg-[#00A3E0] hover:bg-[#0082B3] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1 border-b-2 border-[#006180]"
                        >
                            <FaFileInvoiceDollar size={12} /> Relevé Consolidé      
                    </button>
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