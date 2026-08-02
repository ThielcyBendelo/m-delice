import React, { useState } from 'react';
import { motion } from 'framer-motion';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import { 
  FaHospital, FaWrench, FaMapMarkerAlt, FaPhoneAlt, 
  FaCheckCircle, FaSearch, FaBriefcaseMedical, FaStar 
} from 'react-icons/fa';

// Données du réseau de soins agréé ARCA en RDC
const partnersNetwork = [
  {
    id: 1,
    name: "Centre Médical de Kinshasa (CMK)",
    city: "Kinshasa",
    district: "Gombe",
    type: "Santé",
    specialty: "Hôpital Général & Urgences",
    phone: "+243 817 000 000",
    address: "Avenue de la Justice, Gombe",
    rating: 4.8,
    features: ["Tiers-Payant Activé", "Urgences 24h/7", "Pharmacie Agréée"]
  },
  {
    id: 2,
    name: "Cliniques Universitaires de Lubumbashi",
    city: "Lubumbashi",
    district: "Mutoshi",
    type: "Santé",
    specialty: "Spécialités Médicales & Chirurgie",
    phone: "+243 997 000 000",
    address: "Route Kasapa, Lubumbashi",
    rating: 4.5,
    features: ["Tiers-Payant Activé", "Pédiatrie", "Maternité Prise en Charge"]
  },
  {
    id: 3,
    name: "Hôpital HEAL Africa",
    city: "Goma",
    district: "Les Volcans",
    type: "Santé",
    specialty: "Urgences & Soins Intensifs",
    phone: "+243 857 000 000",
    address: "Avenue du Rond-Point, Goma",
    rating: 4.6,
    features: ["Tiers-Payant Activé", "Traumatologie", "Scanner 3D"]
  },
  {
    id: 4,
    name: "Garage CFAO Motors Kinshasa",
    city: "Kinshasa",
    district: "Limete",
    type: "Automobile",
    specialty: "Réparation & Maintenance Flotte",
    phone: "+243 815 000 000",
    address: "Boulevard Lumumba, Limete",
    rating: 4.7,
    features: ["Prise en charge Directe", "Pièces d'Origine", "Expertise Sinistre"]
  }
];

export default function ProjectsPage() {
  const [selectedCity, setSelectedCity] = useState("Tous");
  const [selectedType, setSelectedType] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");

  const cities = ["Tous", "Kinshasa", "Lubumbashi", "Goma"];
  const types = ["Tous", "Santé", "Automobile"];

  const filteredPartners = partnersNetwork.filter(partner => {
    const matchCity = selectedCity === "Tous" || partner.city === selectedCity;
    const matchType = selectedType === "Tous" || partner.type === selectedType;
    const matchSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        partner.district.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCity && matchType && matchSearch;
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased font-sans">
      <NavbarSecured />

  {/* ================= 1. EN-TÊTE ET FILTRES FINTECH (VERSION SOMBRE ONYX) ================= */}
<header className="relative flex flex-col bg-[#090d16] overflow-hidden border-b border-slate-900 rounded-none">
  <div className="relative z-20 max-w-6xl mx-auto px-6 py-20 pt-32 text-center flex flex-col items-center w-full">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full flex flex-col items-center">
      
      {/* Badge Tiers-Payant */}
      <span className="px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#CE1126] bg-[#CE1126]/10 border border-[#CE1126]/20 flex items-center gap-2 rounded-none">
        <FaBriefcaseMedical className="inline" size={11} /> Tiers-Payant National
      </span>
      
      {/* Titre Principal Blanc Éclatant */}
      <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-none uppercase">
        Réseau de Prestataires <br />
        <span className="text-[#CE1126] italic normal-case">Agréés ARCA</span>
      </h1>
      
      {/* Description Gris Argent */}
      <p className="max-w-3xl mx-auto text-[#94a3b8] text-base md:text-xl leading-relaxed font-semibold">
        Pas d'avance de frais au pays. Présentez simplement la carte virtuelle ou le code QR reçu par WhatsApp pour activer la prise en charge immédiate.
      </p>

      {/* Grille de filtrage épurée Bento Sombre (Angles droits et rectilignes) */}
      <div className="mt-8 bg-[#111827] p-4 border border-slate-800 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 rounded-none shadow-xl">
        
        {/* Recherche par mot-clé */}
        <div className="relative flex items-center border-b border-slate-800 md:border-b-0 md:border-r pr-2 rounded-none">
          <span className="absolute left-2 text-slate-500"><FaSearch size={12} /></span>
          <input
            type="text"
            placeholder="Rechercher un hôpital, quartier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2 bg-transparent text-white text-xs md:text-sm font-bold outline-none focus:placeholder-transparent placeholder-slate-600 rounded-none"
          />
        </div>

        {/* Filtrage par Ville */}
        <div className="relative border-b border-slate-800 md:border-b-0 md:border-r pr-2 rounded-none">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-3 py-2 bg-transparent text-white text-xs md:text-sm font-bold outline-none cursor-pointer rounded-none appearance-none"
          >
            {cities.map(city => (
              <option key={city} value={city} className="bg-[#111827] text-white">
                {city === "Tous" ? "Toutes les villes" : city}
              </option>
            ))}
          </select>
        </div>

        {/* Filtrage par Spécialité / Type */}
        <div className="relative rounded-none">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 bg-transparent text-white text-xs md:text-sm font-bold outline-none cursor-pointer pl-4 rounded-none appearance-none"
          >
            {types.map(t => (
              <option key={t} value={t} className="bg-[#111827] text-white">
                {t === "Tous" ? "Tous les prestataires" : t === "Santé" ? "Structures Médicales" : "Garages Agréés"}
              </option>
            ))}
          </select>
        </div>

      </div>
    </motion.div>
  </div>
</header>

{/* ================= 2. GRILLE DU RÉSEAU NATIONAL (VERSION SOMBRE ONYX) ================= */}
<main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-16 w-full bg-[#090d16]">
  {filteredPartners.length === 0 ? (
    <div className="text-center py-16 text-[#94a3b8] font-black uppercase tracking-wider text-xs md:text-sm">
      Aucun prestataire ne correspond à vos critères dans cette zone.
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
      {filteredPartners.map((partner, idx) => (
        <motion.div
          key={partner.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: idx * 0.05 }}
          className="bg-[#111827] p-6 md:p-10 shadow-xl flex flex-col justify-between hover:shadow-2xl transition-all duration-500 border border-slate-800 group rounded-none"
        >
          <div>
            {/* Badge d'icône & Évaluation */}
            <div className="flex items-center justify-between mb-6">
              {/* Conteneur d'icône 100% carré */}
              <div className={`w-14 h-14 border border-slate-800 flex items-center justify-center shadow-md rounded-none ${partner.type === 'Santé' ? 'bg-[#CE1126]/10 text-[#CE1126]' : 'bg-slate-950 text-white'}`}>
                {partner.type === 'Santé' ? <FaHospital size={22} /> : <FaWrench size={22} />}
              </div>
              {/* Badge évaluation rectangulaire */}
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 bg-amber-500/10 px-3 py-1.5 border border-amber-500/20 rounded-none">
                <FaStar /> <span>{partner.rating}</span>
              </div>
            </div>

            {/* Identification de l'établissement */}
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1 group-hover:text-[#CE1126] transition-colors duration-200">
              {partner.name}
            </h3>
            <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
              {partner.specialty}
            </p>

            {/* Coordonnées géographiques et de contact */}
            <div className="space-y-3 border-t border-slate-800 pt-6 mb-8 text-xs md:text-sm font-semibold text-[#94a3b8]">
              <p className="flex items-center gap-3">
                <FaMapMarkerAlt className="text-[#CE1126] flex-shrink-0" size={14} />
                <span>{partner.address} ({partner.city})</span>
              </p>
              <p className="flex items-center gap-3 font-mono text-xs text-slate-400">
                <FaPhoneAlt className="text-slate-500 flex-shrink-0" size={12} />
                <span>{partner.phone}</span>
              </p>
            </div>

            {/* Liste des avantages en puces tactiles rectangulaires */}
            <div className="flex flex-wrap gap-2 pt-2">
              {partner.features.map((feat, fIdx) => (
                <span 
                  key={fIdx} 
                  className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1.5 rounded-none"
                >
                  <FaCheckCircle className="text-[#CE1126]" size={10} /> {feat}
                </span>
              ))}
            </div>
          </div>

        </motion.div>
      ))}
    </div>
  )}
</main>

      {/* Pied de page */}
      <Footer />
    </div>
  );
}
