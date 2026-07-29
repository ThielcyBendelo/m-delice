import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUsers, FaSearch, FaMapMarkerAlt, FaWhatsapp, 
  FaIdCard, FaShieldAlt, FaCheckCircle, FaUserTag,
  FaFilter, FaFileMedical 
} from 'react-icons/fa';

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Tous");

  // Simulation des données du registre des bénéficiaires locaux en RDC
  const beneficiariesList = [
    {
      id: "BEN-8192",
      lastName: "Mbuyi",
      firstName: "Thérèse",
      phone: "+243810000000",
      city: "Kinshasa",
      relation: "Mère",
      policyNumber: "DRC-2026-9821",
      remainingCoverage: "2,450 USD",
      totalLimit: "3,500 USD",
      status: "Vérifié & Actif",
      statusColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      id: "BEN-8191",
      lastName: "Kanyinda",
      firstName: "Arsène",
      phone: "+243990000000",
      city: "Lubumbashi",
      relation: "Frère",
      policyNumber: "DRC-2026-9820",
      remainingCoverage: "5,000 USD",
      totalLimit: "5,000 USD",
      status: "Vérifié & Actif",
      statusColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      id: "BEN-8190",
      lastName: "Luzolo",
      firstName: "Fiston",
      phone: "+243850000000",
      city: "Goma",
      relation: "Enfant",
      policyNumber: "DRC-2026-9819",
      remainingCoverage: "1,500 USD",
      totalLimit: "1,500 USD",
      status: "En attente ARCA",
      statusColor: "text-amber-500 bg-amber-500/10 border-amber-500/20"
    }
  ];

  const cities = ["Tous", "Kinshasa", "Lubumbashi", "Goma"];

  // Filtrage combiné (Recherche textuelle + Ville)
  const filteredBeneficiaries = beneficiariesList.filter(beneficiary => {
    const matchCity = selectedCity === "Tous" || beneficiary.city === selectedCity;
    const matchSearch = beneficiary.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        beneficiary.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        beneficiary.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        beneficiary.phone.includes(searchQuery);
    return matchCity && matchSearch;
  });

  return (
    <div className="space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen p-1 text-slate-800 dark:text-slate-100 animate-fadeIn">
      
      {/* --- EN-TÊTE DU REGISTRE --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <FaUsers className="text-[#00A3E0]" /> Registre National des Bénéficiaires
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gestion des fiches d'assurés locaux, traçabilité des liens de parenté et contrôle des plafonds médicaux en RDC.</p>
        </div>
      </div>

      {/* --- INFRASTRUCTURE DE FILTRAGE & RECHERCHE EN TEMPS RÉEL --- */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Barre de recherche */}
        <div className="sm:col-span-2 relative flex items-center">
          <span className="absolute left-3.5 text-slate-400"><FaSearch size={14} /></span>
          <input
            type="text"
            placeholder="Rechercher par Nom, Prénom, N° WhatsApp ou Police d'assurance..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          />
        </div>

        {/* Filtrage par Province/Ville */}
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400"><FaFilter size={12} /></span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          >
            {cities.map(city => (
              <option key={city} value={city}>
                {city === "Tous" ? "Toutes les localités" : city}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* --- TABLEAU CENTRAL DES ASSURÉS LOCAUX --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FaShieldAlt className="text-[#00A3E0]" /> Fiches d'assurés validées en RDC
          </h3>
          <span className="text-[10px] font-mono bg-[#00A3E0]/10 text-[#00A3E0] px-2.5 py-1 rounded-md font-black">
            {filteredBeneficiaries.length} Enregistrement(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/20 dark:bg-slate-800/10">
                <th className="p-4">ID Assuré</th>
                <th className="p-4">Identité Bénéficiaire</th>
                <th className="p-4">N° de Contrat (ARCA)</th>
                <th className="p-4">Localisation & Contact</th>
                <th className="p-4">Lien de Parenté</th>
                <th className="p-4 text-center">Solde / Plafond Soins</th>
                <th className="p-4 text-right">Statut Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 font-medium">
              {filteredBeneficiaries.map((beneficiary) => (
                <tr key={beneficiary.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  
                  {/* ID */}
                  <td className="p-4 font-mono font-bold text-slate-400">{beneficiary.id}</td>
                  
                  {/* Identité */}
                  <td className="p-4">
                    <div className="font-black text-slate-900 dark:text-white text-sm">
                      {beneficiary.lastName} {beneficiary.firstName}
                    </div>
                  </td>

                  {/* N° Police */}
                  <td className="p-4">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-900 dark:text-slate-200 font-bold flex items-center gap-1.5 w-max">
                      <FaIdCard className="text-[#00A3E0]" size={12} /> {beneficiary.policyNumber}
                    </span>
                  </td>

                  {/* Contact / Ville */}
                  <td className="p-4 space-y-1">
                    <div className="flex items-center gap-1 text-slate-900 dark:text-slate-100 font-semibold">
                      <FaMapMarkerAlt className="text-slate-400" size={11} /> {beneficiary.city}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
                      <FaWhatsapp className="text-green-500" size={12} /> {beneficiary.phone}
                    </div>
                  </td>

                  {/* Lien */}
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                      <FaUserTag size={10} className="text-[#00A3E0]" /> {beneficiary.relation}
                    </span>
                  </td>

                  {/* Solde Couverture */}
                  <td className="p-4 text-center space-y-1">
                    <div className="font-black text-[#00A3E0] font-mono text-sm">{beneficiary.remainingCoverage}</div>
                    <div className="text-[10px] text-slate-400">sur {beneficiary.totalLimit}</div>
                  </td>

                  {/* Statut Validation */}
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${beneficiary.statusColor}`}>
                      <FaCheckCircle size={10} /> {beneficiary.status}
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
