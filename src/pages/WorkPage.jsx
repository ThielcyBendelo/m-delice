import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
// import NavbarSecured from '../components/NavbarSecured';
// import Footer from '../components/Footer';
import notificationService from '../services/notificationService';
import { calculateInsuranceQuote, COVERAGE_OPTIONS } from '../utils/insurancePricing';
import { 
  FaCalculator, FaShieldAlt, FaHeartbeat, FaCar, 
  FaGraduationCap, FaUsers, FaArrowRight, FaInfoCircle, FaCheckCircle, FaPlaneDeparture, 
  FaHardHat, FaHome, FaThList, FaHeadset, FaLock
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
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col antialiased font-sans">
      
      {/* ================= 1. MINI NAVBAR CONTEXTUELLE (MOBILE & DESKTOP) ================= */}
      <header className="sticky top-0 z-50 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/90">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-2">
          
          {/* Gauche : Retour Home + Titre */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              title="Retour à l'accueil"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111827] hover:bg-[#CE1126] border border-slate-800 hover:border-[#CE1126] text-slate-300 hover:text-white transition-colors duration-200 rounded-none shrink-0"
            >
              <FaHome className="text-xs sm:text-sm" />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">
                Accueil
              </span>
            </button>

            <div className="h-4 w-[1px] bg-slate-800 shrink-0" />

            <div className="flex items-center gap-2 truncate">
              <FaCalculator className="text-[#CE1126] text-xs sm:text-sm shrink-0" />
              <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white truncate">
                Simulateur <span className="text-slate-400 font-bold hidden md:inline">| Devis Instantané RDC</span>
              </h1>
            </div>
          </div>

          {/* Droite : Navigation rapide contextuelle */}
          <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              to="/catalogue"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-[#111827] hover:bg-slate-800 border border-slate-800 transition-colors rounded-none"
            >
              <FaThList className="text-[#CE1126] text-xs" />
              <span className="hidden xs:inline">Nos Offres</span>
            </Link>

            <Link
              to="/assistance"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-[#111827] hover:bg-slate-800 border border-slate-800 transition-colors rounded-none"
            >
              <FaHeadset className="text-emerald-400 text-xs" />
              <span className="hidden md:inline">Conseiller</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1.5 pl-2 ml-1 border-l border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <FaShieldAlt className="text-[#CE1126]" />
              <span>Norme ARCA</span>
            </div>
          </nav>

        </div>
      </header>

      {/* ================= 2. CORE INTERFACE DE CALCUL (COMPACTE & RESPONSIVE) ================= */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        
        {/* BLOC GAUCHE : PANNEAU DES PARAMÈTRES (COL 7) */}
        <div className="lg:col-span-7 w-full">
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#111827] p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4 sm:space-y-5 rounded-none text-left"
          >
            {/* Étape 1 : Branche d'assurance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.18em]">
                  1. Choisissez la formule
                </label>
                <span className="sm:hidden text-[9px] font-bold uppercase tracking-widest text-[#CE1126]">
                  Glisser →
                </span>
              </div>
              
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 pb-1 sm:grid sm:grid-cols-3 sm:gap-2 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {[
                  { id: 'health', label: 'Santé / Médical', icon: <FaHeartbeat /> },
                  { id: 'auto', label: 'RC Automob', icon: <FaCar /> },
                  { id: 'student', label: 'Scolarité', icon: <FaGraduationCap /> },
                  { id: 'voyage', label: 'Voyage', icon: <FaPlaneDeparture /> },
                  { id: 'collective', label: 'Collective & Mutuelle', icon: <FaUsers /> },
                  { id: 'work_accident', label: 'Accidents Travail', icon: <FaHardHat /> },
                  { id: 'habitation', label: 'Habitation Pro', icon: <FaHardHat /> }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setInsuranceType(type.id)}
                    className={`snap-start shrink-0 min-w-[108px] sm:min-w-0 p-2.5 sm:p-3 border flex flex-col items-center justify-center gap-1.5 font-black text-[9px] sm:text-[10px] uppercase tracking-wider transition-all duration-200 rounded-none focus:outline-none ${
                      insuranceType === type.id 
                        ? 'border-[#CE1126] bg-[#CE1126]/15 text-white shadow-sm' 
                        : 'border-slate-800 bg-[#090d16] text-slate-400 hover:border-slate-600 hover:text-white'
                    }`}
                  >
                    <span className={`text-base sm:text-lg ${insuranceType === type.id ? 'text-[#CE1126]' : 'text-slate-400'}`}>
                      {type.icon}
                    </span>
                    <span className="text-center leading-tight line-clamp-2">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Étape 2 : Bénéficiaires */}
            <div className="space-y-2 pt-1 border-t border-slate-800/70">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.18em] flex items-center justify-between">
                <span>2. Bénéficiaires en RDC</span>
                <span className="text-white font-black text-[11px] bg-[#CE1126]/20 border border-[#CE1126]/40 px-2.5 py-0.5 rounded-none">
                  {beneficiariesCount} {beneficiariesCount > 1 ? 'Membres' : 'Membre'}
                </span>
              </label>
              
              <div className="flex items-center gap-3 bg-[#090d16] px-3 py-2.5 border border-slate-800 rounded-none shadow-inner">
                <FaUsers className="text-slate-400 text-sm flex-shrink-0" />
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={beneficiariesCount}
                  onChange={(e) => setBeneficiariesCount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-none appearance-none cursor-pointer accent-[#CE1126]"
                />
                <span className="text-[10px] font-bold text-slate-500 w-6 text-right">
                  {beneficiariesCount}/6
                </span>
              </div>

              {beneficiariesCount > 1 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  ✓ Réduction familiale de 10% incluse sur les membres additionnels.
                </motion.p>
              )}
            </div>

            {/* Étape 3 : Niveau de couverture */}
            <div className="space-y-2 pt-1 border-t border-slate-800/70">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.18em]">
                3. Niveau de garanties
              </label>
              <div className="grid grid-cols-3 gap-2">
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
                      className={`p-2 sm:p-2.5 border text-center sm:text-left flex flex-col justify-center gap-0.5 transition-all duration-200 rounded-none focus:outline-none ${
                        isSelected
                          ? 'border-[#CE1126] bg-[#CE1126]/15 shadow-sm'
                          : 'border-slate-800 bg-[#090d16] hover:border-slate-600'
                      }`}
                    >
                      <span
                        className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider truncate ${
                          isSelected ? 'text-[#CE1126]' : 'text-white'
                        }`}
                      >
                        {lvl.title}
                      </span>
                      <span className="text-[8px] sm:text-[10px] text-[#94a3b8] font-medium leading-tight line-clamp-2">
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
        <div className="lg:col-span-5 w-full lg:sticky lg:top-18">
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#111827] border border-slate-800 shadow-2xl rounded-none overflow-hidden"
          >
            {/* En-tête du devis */}
            <div className="bg-[#090d16] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#CE1126] inline-block" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                  Estimation de Cotisation
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-800 text-slate-300">
                {coverageLevel}
              </span>
            </div>

            {/* Corps du devis */}
            <div className="p-4 sm:p-5 space-y-4">
              {/* Prix principal */}
              <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Prime Mensuelle Estimée
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {quote?.monthlyPrice ?? '0'} $
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      / mois (USD)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase text-emerald-400 block">
                    Paiement Flexible
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Mobile Money / Carte
                  </span>
                </div>
              </div>

              {/* Détails clés compacts */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="bg-[#090d16] p-2.5 border border-slate-800/80">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-bold">
                    Branche
                  </span>
                  <span className="text-[11px] font-black text-white uppercase truncate block mt-0.5">
                    {quote?.branch || insuranceType}
                  </span>
                </div>
                <div className="bg-[#090d16] p-2.5 border border-slate-800/80">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-bold">
                    Plafond Annuel
                  </span>
                  <span className="text-[11px] font-black text-emerald-400 truncate block mt-0.5">
                    {quote?.coverageLimit || 'Selon contrat'}
                  </span>
                </div>
              </div>

              {/* Points de réassurance */}
              <ul className="space-y-1.5 text-[10px] sm:text-[11px] text-slate-300">
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-[#CE1126] text-xs shrink-0" />
                  <span>Attestation numérique QR Code immédiate</span>
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-[#CE1126] text-xs shrink-0" />
                  <span>Réseau de soins et partenaires agréés en RDC</span>
                </li>
                <li className="flex items-center gap-2">
                  <FaInfoCircle className="text-slate-400 text-xs shrink-0" />
                  <span>Couverture pour {beneficiariesCount} bénéficiaire{beneficiariesCount > 1 ? 's' : ''}</span>
                </li>
              </ul>

              {/* Bouton d'action principal */}
              <button
                type="button"
                onClick={handleProceedToPurchase}
                className="w-full py-3 px-4 bg-[#CE1126] hover:bg-[#a80d1e] text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all duration-200 shadow-lg rounded-none cursor-pointer"
              >
                <span>Souscrire ce pack</span>
                <FaArrowRight className="text-xs" />
              </button>

              {/* Mention sécurité */}
              <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-wider pt-1">
                <FaLock className="text-[10px]" />
                <span>Transaction sécurisée • M-Pesa, Airtel, Orange, Visa</span>
              </div>
            </div>
          </motion.div>
        </div>

      </main>
    </div>
  );
}
