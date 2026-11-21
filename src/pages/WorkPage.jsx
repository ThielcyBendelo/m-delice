import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
// import NavbarSecured from '../components/NavbarSecured';
// import Footer from '../components/Footer';
import notificationService from '../services/notificationService';
import { calculateInsuranceQuote, COVERAGE_OPTIONS } from '../utils/insurancePricing';
import { 
  FaCalculator, FaShieldAlt, FaHeartbeat, FaCar, 
  FaGraduationCap, FaUsers, FaArrowRight, FaInfoCircle, FaCheckCircle, FaPlaneDeparture, 
  FaHardHat 
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
    <div className="min-h-screen bg-white text-slate-900 flex pt-19 flex-col antialiased font-sans">
      {/* <NavbarSecured /> */}

{/* ================= 2. CORE INTERFACE DE CALCUL (VERSION SOMBRE ONYX) ================= */}
<main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start bg-[#090d16]">
  {/* BLOC GAUCHE : PANNEAU DES PARAMÈTRES (COL 7) */}
  <div className="lg:col-span-7 space-y-6 w-full">
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#111827] p-5 md:p-7 border border-slate-800 shadow-xl space-y-6 rounded-none text-left"
    >
      {/* Étape 1 : Branche d'assurance (1 ligne défilante sur mobile, grille 3x2 sur desktop) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">
            1. Choisissez la formule
          </label>
          <span className="sm:hidden text-[9px] font-bold uppercase tracking-widest text-[#CE1126]">
            Glisser →
          </span>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-2.5 pb-1 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[
            { id: 'health', label: 'Santé / Médical', icon: <FaHeartbeat /> },
            { id: 'auto', label: 'RC Automob', icon: <FaCar /> },
            { id: 'student', label: 'Scolarité', icon: <FaGraduationCap /> },
            { id: 'voyage', label: 'Voyage', icon: <FaPlaneDeparture /> },
            { id: 'collective', label: 'Collective & Mutuelle', icon: <FaUsers /> },
            { id: 'work_accident', label: 'Accidents Travail', icon: <FaHardHat /> }
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setInsuranceType(type.id)}
              className={`snap-start shrink-0 min-w-[125px] sm:min-w-0 p-3.5 sm:p-4 border-2 flex flex-col items-center justify-center gap-2 font-black text-[10px] sm:text-[11px] uppercase tracking-wider transition-all duration-300 rounded-none focus:outline-none ${
                insuranceType === type.id 
                  ? 'border-[#CE1126] bg-[#CE1126]/10 text-white shadow-md' 
                  : 'border-slate-800 bg-[#090d16] text-slate-400 hover:border-slate-600 hover:text-white'
              }`}
            >
              <span className={`text-lg sm:text-xl ${insuranceType === type.id ? 'text-[#CE1126]' : 'text-slate-400'}`}>
                {type.icon}
              </span>
              <span className="text-center leading-tight line-clamp-2">{type.label}</span>
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

            {/* Étape 3 : Niveau de couverture (1 seule ligne compacte sur mobile et desktop) */}
      <div className="space-y-3">
        <label className="block text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">
          3. Niveau de garanties
        </label>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { id: 'essentiel', title: 'Essentiel', desc: 'Couverture basique' },
            { id: 'confort', title: 'Confort', desc: 'Équilibre soins / prix' },
            { id: 'premium', title: 'Premium', desc: 'Plafonds étendus ARCA' }
          ].map((lvl) => {
            const isSelected = coverageLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setCoverageLevel(lvl.id)}
                className={`p-2.5 sm:p-3.5 border-2 text-center sm:text-left flex flex-col justify-center gap-0.5 transition-all duration-200 rounded-none focus:outline-none ${
                  isSelected
                    ? 'border-[#CE1126] bg-[#CE1126]/15 shadow-md'
                    : 'border-slate-800 bg-[#090d16] hover:border-slate-600'
                }`}
              >
                <span
                  className={`text-[10px] sm:text-xs font-black uppercase tracking-wider truncate ${
                    isSelected ? 'text-[#CE1126]' : 'text-white'
                  }`}
                >
                  {lvl.title}
                </span>
                <span className="text-[9px] sm:text-[11px] text-[#94a3b8] font-semibold leading-tight line-clamp-2">
                  {lvl.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  </div>
  
{/* BLOC DROIT : PANNEAU DU RECAP & DEVIS FINTECH (COL 5 - COMPACT & STICKY) */}
<div className="lg:col-span-5 w-full lg:sticky lg:top-24">
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className="bg-[#111827] p-5 sm:p-7 text-white shadow-2xl space-y-5 relative overflow-hidden border-2 border-slate-800 hover:border-slate-700 transition-colors rounded-none text-left"
  >
    {/* Accent lumineux subtil en coin */}
    <div className="absolute top-0 right-0 w-24 h-24 bg-[#CE1126]/10 blur-2xl rounded-none pointer-events-none" />
    
    {/* En-tête compact */}
    <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
      <div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#CE1126] block">
          Estimation Devis
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight italic mt-0.5">
          Votre Cotisation
        </h2>
      </div>
      <span className="px-2.5 py-1 bg-[#090d16] border border-slate-800 text-[9px] font-black uppercase tracking-widest text-emerald-400">
        Instantané
      </span>
    </div>

    {/* AFFICHEUR DU PRIX PRO & BIEN PROPORTIONNÉ */}
    <div className="bg-[#090d16] border border-slate-800/90 border-l-4 border-l-[#CE1126] px-5 py-4 flex items-baseline justify-between">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl sm:text-5xl font-black tracking-tighter text-white">
          {quote.monthlyPrice}
        </span>
        <span className="text-sm sm:text-base font-black uppercase text-[#CE1126] tracking-widest">
          USD / Mois
        </span>
      </div>
    </div>

    {/* Liste de réassurance resserrée */}
    <div className="space-y-2.5 pt-1 text-xs font-semibold text-[#94a3b8]">
      <div className="flex items-center gap-2.5">
        <FaCheckCircle className="text-[#CE1126] shrink-0" size={13} />
        <span>Réseau Tiers-Payant WhatsApp inclus</span>
      </div>
      <div className="flex items-center gap-2.5">
        <FaCheckCircle className="text-[#CE1126] shrink-0" size={13} />
        <span>Plafond annuel garanti conforme ARCA</span>
      </div>
      <div className="flex items-center gap-2.5">
        <FaShieldAlt className="text-[#CE1126] shrink-0" size={13} />
        <span className="text-slate-200">{quote.coverageLimit} · {quote.coverageLabel}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <FaInfoCircle className="text-[#CE1126] shrink-0" size={13} />
        <span>Modification gratuite des bénéficiaires</span>
      </div>
    </div>

    {/* Action finale */}
    <div className="pt-2">
      <button
        onClick={handleProceedToPurchase}
        className="group w-full py-4 bg-white text-black font-black uppercase text-[10px] sm:text-[11px] tracking-[0.22em] shadow-xl hover:bg-[#CE1126] hover:text-white transition-all duration-300 rounded-none active:scale-[0.98] flex items-center justify-center gap-2 focus:outline-none"
      >
        <span>Continuer la souscription</span>
        <FaArrowRight size={12} className="text-[#CE1126] group-hover:text-white group-hover:translate-x-1 transition-all" />
      </button>
    </div>

    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center">
      Simulation instantanée anonyme sans engagement.
    </p>
  </motion.div>
</div>

</main>

{/* ================= PIED DE PAGE ÉPURÉ ESNAs ================= */}
{/* <Footer /> */}

</div>
  );
}
