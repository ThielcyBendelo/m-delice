import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import notificationService from '../services/notificationService';
import { calculateInsuranceQuote, COVERAGE_OPTIONS } from '../utils/insurancePricing';
import { 
  FaCalculator, FaShieldAlt, FaHeartbeat, FaCar, 
  FaGraduationCap, FaUsers, FaArrowRight, FaInfoCircle, FaCheckCircle, FaPlaneDeparture
} from 'react-icons/fa';

export default function WorkPage() {
  const navigate = useNavigate();

  // États du simulateur
  const [insuranceType, setInsuranceType] = useState('health'); 
  const [beneficiariesCount, setBeneficiariesCount] = useState(1);
  const [coverageLevel, setCoverageLevel] = useState('confort'); 
  const quote = calculateInsuranceQuote({ insuranceType, beneficiariesCount, coverageLevel });

  const handleProceedToPurchase = () => {
    if (notificationService?.success) {
      notificationService.success("Simulation enregistrée !");
    }

    const simulatedPack = {
      id: insuranceType === 'health' ? 1 : insuranceType === 'auto' ? 2 : 4,
      name: `Pack ${insuranceType.charAt(0).toUpperCase() + insuranceType.slice(1)} - ${coverageLevel.toUpperCase()}`,
      price: quote.monthlyPrice,
      branch: quote.branch,
      insuranceType,
      coverageLevel,
      beneficiariesCount: quote.beneficiariesCount,
      coverageLimit: quote.coverageLimit
    };

    navigate('/inscription-beneficiaire', { state: { selectedPack: simulatedPack } });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased font-sans">
      <NavbarSecured />

     {/* ================= 1. EN-TÊTE SIMULATEUR PREMIUM (VERSION SOMBRE ONYX) ================= */}
<header className="relative flex flex-col bg-[#090d16] overflow-hidden border-b border-slate-900 rounded-none">
  <div className="relative z-20 max-w-6xl mx-auto px-4 py-28 pt-30 text-center flex flex-col items-center w-full">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full flex flex-col items-center">
      
      {/* Badge Outil - Fond de surface sombre, angles droits stricts */}
      <span className="px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#CE1126] bg-[#CE1126]/10 border border-[#CE1126]/20 border-l-2 border-l-[#CE1126] rounded-none inline-block">
        Outil d'Aide à la Décision
      </span>
      
      {/* Titre Blanc Éclatant */}
      <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-none uppercase">
        Tarificateur <span className="text-[#CE1126] italic normal-case">En Ligne</span>
      </h1>
      
      {/* Description Gris Argent Scannable */}
      <p className="max-w-3xl mx-auto text-[#94a3b8] text-base md:text-xl leading-relaxed font-semibold">
        Calculez instantanément le montant de la prime pour votre famille en RDC. Obtenez un devis transparent et traçable en quelques clics.
      </p>
    </motion.div>
  </div>
</header>

{/* ================= 2. CORE INTERFACE DE CALCUL (VERSION SOMBRE ONYX) ================= */}
<main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-16 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start bg-[#090d16]">
  
  {/* BLOC GAUCHE : PANNEAU DES PARAMÈTRES (COL 7) */}
  <div className="lg:col-span-7 space-y-10 w-full">
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#111827] p-6 md:p-10 border border-slate-800 shadow-xl space-y-10 rounded-none text-left"
      /* 🟢 'rounded-none' rend le bloc et son enveloppe strictement rectangulaires */
    >
      {/* Étape 1 : Branche d'assurance */}
      <div className="space-y-4">
        <label className="block text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">1. Choisissez la formule</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { id: 'health', label: 'Santé / Médical', icon: <FaHeartbeat /> },
            { id: 'auto', label: 'RC Automob', icon: <FaCar /> },
            { id: 'student', label: 'Scolarité', icon: <FaGraduationCap /> },
            { id: 'voyage', label: 'Voyage', icon: <FaPlaneDeparture /> }
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setInsuranceType(type.id)}
              className={`p-5 border-2 flex flex-col items-center justify-center gap-3 font-black text-[11px] uppercase tracking-wider transition-all duration-300 rounded-none focus:outline-none ${
                insuranceType === type.id 
                  ? 'border-[#CE1126] bg-[#CE1126]/10 text-white shadow-md' 
                  : 'border-slate-800 bg-[#090d16] text-slate-400 hover:border-slate-600 hover:text-white'
              }`}
            >
              <span className={`text-xl ${insuranceType === type.id ? 'text-[#CE1126]' : 'text-slate-400'}`}>{type.icon}</span>
              <span className="text-center leading-tight">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Étape 2 : Bénéficiaires */}
      <div className="space-y-4">
        <label className="block text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center justify-between">
          <span>2. Nombre de bénéficiaires en RDC</span>
          <span className="text-white font-black text-xs bg-[#CE1126]/20 border border-[#CE1126]/30 px-3 py-1 rounded-none">
            {beneficiariesCount} {beneficiariesCount > 1 ? 'Membres' : 'Membre'}
          </span>
        </label>
        <div className="flex items-center gap-4 bg-[#090d16] p-4 border border-slate-800 rounded-none shadow-inner">
          <FaUsers className="text-slate-400 text-lg flex-shrink-0" />
          <input
            type="range"
            min="1"
            max="6"
            value={beneficiariesCount}
            onChange={(e) => setBeneficiariesCount(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-none appearance-none cursor-pointer accent-[#CE1126]"
          />
        </div>
        {beneficiariesCount > 1 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            ✓ Réduction familiale de 10% incluse sur les bénéficiaires additionnels.
          </motion.p>
        )}
      </div>

      {/* Étape 3 : Niveau de couverture */}
      <div className="space-y-4">
        <label className="block text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">3. Niveau de garanties</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { id: 'essentiel', title: 'Essentiel', desc: 'Couverture basique de crise' },
            { id: 'confort', title: 'Confort', desc: 'Équilibre parfait soins / prix' },
            { id: 'premium', title: 'Premium', desc: 'Plafonds étendus ARCA' }
          ].map((lvl) => (
            <button
              key={lvl.id}
              type="button"
              onClick={() => setCoverageLevel(lvl.id)}
              className={`p-5 border-2 text-left flex flex-col gap-1 transition-all duration-300 rounded-none focus:outline-none ${
                coverageLevel === lvl.id 
                  ? 'border-[#CE1126] bg-[#CE1126]/10 shadow-md' 
                  : 'border-slate-800 bg-[#090d16] hover:border-slate-600'
              }`}
            >
              <span className={`text-xs font-black uppercase tracking-wider ${coverageLevel === lvl.id ? 'text-[#CE1126]' : 'text-white'}`}>
                {lvl.title}
              </span>
              <span className="text-[11px] text-[#94a3b8] font-semibold leading-tight mt-1">
                {lvl.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  </div>
  
{/* BLOC DROIT : PANNEAU DU RECAP & DEVIS FINTECH (COL 5 - NOIR CONCORDANCE - VERSION SOMBRE) */}
<div className="lg:col-span-5 w-full">
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-[#111827] p-8 md:p-10 text-white shadow-2xl space-y-8 relative overflow-hidden border border-slate-800 rounded-none text-left" 
    /* 🟢 'rounded-none' rend la carte strictement rectangulaire et bg-[#111827] s'aligne sur le thème core */
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-[#CE1126]/5 blur-3xl rounded-none pointer-events-none" />
    
    <div className="border-b border-slate-800 pb-6">
      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#CE1126]">Estimation Devis</span>
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic mt-2">
        Votre Cotisation
      </h2>
    </div>

    {/* AFFICHEUR DU PRIX MASSIVEMENT ACCENTUÉ */}
    <div className="py-4 flex items-baseline gap-2">
      <span className="text-6xl md:text-7xl font-black tracking-tighter text-white">
        {quote.monthlyPrice}
      </span>
      <span className="text-xl font-bold uppercase text-[#CE1126] tracking-widest">USD / Mois</span>
    </div>

    {/* Liste de réassurance - Teintes épurées et lisibles */}
    <div className="space-y-4 pt-4 border-t border-slate-800 text-xs md:text-sm font-semibold text-[#94a3b8]">
      <div className="flex items-center gap-3">
        <FaCheckCircle className="text-[#CE1126] flex-shrink-0" size={14} />
        <span>Réseau Tiers-Payant WhatsApp inclus</span>
      </div>
      <div className="flex items-center gap-3">
        <FaCheckCircle className="text-[#CE1126] flex-shrink-0" size={14} />
        <span>Plafond annuel garanti conforme ARCA</span>
      </div>
      <div className="flex items-center gap-3">
        <FaShieldAlt className="text-[#CE1126] flex-shrink-0" size={14} />
        <span>{quote.coverageLimit} · {quote.coverageLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        <FaInfoCircle className="text-[#CE1126] flex-shrink-0" size={14} />
        <span>Modification gratuite des bénéficiaires</span>
      </div>
    </div>

    {/* Action finale : Bouton rectangulaire blanc, bascule au rouge RDC au survol */}
    <div className="pt-4">
      <button
        onClick={handleProceedToPurchase}
        className="w-full py-5 bg-white text-black font-black uppercase text-[10px] md:text-[11px] tracking-[0.25em] shadow-xl hover:bg-[#CE1126] hover:text-white transition-all duration-300 rounded-none active:scale-[0.98] flex items-center justify-center gap-2 focus:outline-none"
      >
        Continuer la souscription <FaArrowRight size={12} className="text-[#CE1126] group-hover:text-white transition-colors" />
      </button>
    </div>

    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">
      Simulation instantanée anonyme sans engagement.
    </p>
  </motion.div>
</div>
</main>

<Footer />
</div>
);
}
