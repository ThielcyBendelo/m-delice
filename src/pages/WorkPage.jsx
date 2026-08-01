import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import notificationService from '../services/notificationService';
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
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  // Logique métier FinTech préservée à 100%
  useEffect(() => {
    let basePrice = 0;
    let multiplier = 1;

    if (insuranceType === 'health') basePrice = 30;
    if (insuranceType === 'auto') basePrice = 20;
    if (insuranceType === 'student') basePrice = 12;
    if (insuranceType === 'voyage') basePrice = 50;

    if (coverageLevel === 'essentiel') multiplier = 0.8;
    if (coverageLevel === 'confort') multiplier = 1.0;
    if (coverageLevel === 'premium') multiplier = 1.4;

    let total = 0;
    for (let i = 1; i <= beneficiariesCount; i++) {
      if (i === 1) {
        total += basePrice * multiplier;
      } else {
        total += (basePrice * multiplier) * 0.9; 
      }
    }

    setEstimatedPrice(Math.round(total));
  }, [insuranceType, beneficiariesCount, coverageLevel]);

  const handleProceedToPurchase = () => {
    if (notificationService?.success) {
      notificationService.success("Simulation enregistrée !");
    }

    const simulatedPack = {
      id: insuranceType === 'health' ? 1 : insuranceType === 'auto' ? 2 : 4,
      name: `Pack ${insuranceType.charAt(0).toUpperCase() + insuranceType.slice(1)} - ${coverageLevel.toUpperCase()}`,
      price: estimatedPrice,
      coverageLimit: coverageLevel === 'premium' ? "Plafond annuel : 7 500 USD" : "Plafond annuel : 3 500 USD"
    };

    navigate('/inscription-beneficiaire', { state: { selectedPack: simulatedPack } });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased font-sans">
      <NavbarSecured />

      {/* ================= 1. EN-TÊTE SIMULATEUR PREMIUM ================= */}
      <header className="relative flex flex-col bg-white overflow-hidden border-b border-slate-100">
        <div className="relative z-20 max-w-6xl mx-auto px-6 py-20 pt-32 text-center flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <span className="px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-950 border-l-2 border-[#CE1126]">
              Outil d'Aide à la Décision
            </span>
            <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tight leading-none">
              Tarificateur <span className="text-[#CE1126] italic">En Ligne</span>
            </h1>
            <p className="max-w-3xl mx-auto text-slate-950 text-lg md:text-xl leading-relaxed font-bold">
              Calculez instantanément le montant de la prime pour votre famille en RDC. Obtenez un devis transparent et traçable en quelques clics.
            </p>
          </motion.div>
        </div>
      </header>

      {/* ================= 2. CORE INTERFACE DE CALCUL ================= */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        
        {/* BLOC GAUCHE : PANNEAU DES PARAMÈTRES (COL 7) */}
        <div className="lg:col-span-7 space-y-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-2 md:p-4 space-y-10"
          >
            {/* Étape 1 : Branche d'assurance */}
            <div className="space-y-4">
              <label className="block text-[11px] font-black uppercase text-slate-950 tracking-[0.2em]">1. Choisissez la formule</label>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { id: 'health', label: 'Santé / Médical', icon: <FaHeartbeat /> },
                  { id: 'auto', label: 'RC Automobile', icon: <FaCar /> },
                  { id: 'student', label: 'Scolarité', icon: <FaGraduationCap /> },
                  { id: 'voyage', label: 'Voyage', icon: <FaPlaneDeparture /> }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setInsuranceType(type.id)}
                    className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 font-extrabold text-[11px] uppercase tracking-wider transition-all ${
                      insuranceType === type.id 
                        ? 'border-[#CE1126] bg-red-50/50 text-[#CE1126]' 
                        : 'border-slate-100 bg-slate-50/40 text-slate-950 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-xl">{type.icon}</span>
                    <span className="text-center">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Étape 2 : Bénéficiaires */}
            <div className="space-y-4">
              <label className="block text-[11px] font-black uppercase text-slate-950 tracking-[0.2em] flex items-center justify-between">
                <span>2. Nombre de bénéficiaires en RDC</span>
                <span className="text-slate-950 font-bold text-xs font-black bg-red-50 px-3 py-1 rounded-md">
                  {beneficiariesCount} {beneficiariesCount > 1 ? 'Membres' : 'Membre'}
                </span>
              </label>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-850">
                <FaUsers className="text-slate-950 text-lg" />
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={beneficiariesCount}
                  onChange={(e) => setBeneficiariesCount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#CE1126]"
                />
              </div>
              {beneficiariesCount > 1 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  ✓ Réduction familiale de 10% incluse sur les bénéficiaires additionnels.
                </motion.p>
              )}
            </div>

            {/* Étape 3 : Niveau de couverture (Sécurisé et refermé) */}
            <div className="space-y-4">
              <label className="block text-[11px] font-black uppercase text-slate-950 tracking-[0.2em]">3. Niveau de garanties</label>
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
                    className={`p-5 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all ${
                      coverageLevel === lvl.id 
                        ? 'border-[#CE1126] bg-red-50/50' 
                        : 'border-slate-100 bg-slate-50/40 hover:border-slate-200'
                    }`}
                  >
                    <span className={`text-xs font-white uppercase tracking-wider ${coverageLevel === lvl.id ? 'text-[#CE1126]' : 'text-slate-900'}`}>
                      {lvl.title}
                    </span>
                    <span className="text-[11px] text-slate-950 font-medium leading-tight">
                      {lvl.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        </div>

{/* BLOC DROIT : PANNEAU DU RECAP & DEVIS FINTECH (COL 5 - NOIR CONCORDANCE) */}
<div className="lg:col-span-5">
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-slate-950 p-10 rounded-none text-white shadow-2xl space-y-8 relative overflow-hidden" 
    /* 🟢 'rounded-none' rend la carte strictement rectangulaire */
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full" />
    
    <div className="border-b border-white/10 pb-6">
      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-red-600">Estimation Devis</span>
      {/* 🟢 Ajout de 'text-white' pour la description */}
      <h2 className="text-3xl font-bold text-white uppercase tracking-tighter italic mt-2">
        Votre Cotisation
      </h2>
    </div>

    {/* AFFICHEUR DU PRIX MASSIVEMENT ACCENTUÉ */}
    <div className="py-4 flex items-baseline gap-2">
      <span className="text-6xl md:text-7xl font-black tracking-tighter text-white">
        {estimatedPrice}
      </span>
      <span className="text-xl font-bold uppercase text-red-600 tracking-widest">USD / Mois</span>
</div>


                        {/* Liste de réassurance */}
            <div className="space-y-4 pt-4 border-t border-white/10 text-sm font-medium text-slate-400">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="text-red-600 flex-shrink-0" />
                <span>Réseau Tiers-Payant WhatsApp inclus</span>
              </div>
              <div className="flex items-center gap-3">
                <FaCheckCircle className="text-red-600 flex-shrink-0" />
                <span>Plafond annuel garanti conforme ARCA</span>
              </div>
              <div className="flex items-center gap-3">
                <FaInfoCircle className="text-red-600 flex-shrink-0" />
                <span>Modification gratuite des bénéficiaires</span>
              </div>
            </div>

            {/* Action finale : Bouton rectangulaire à fort contraste */}
            <div className="pt-6">
              <button
                onClick={handleProceedToPurchase}
                className="w-full py-5 bg-white text-black font-extrabold uppercase text-[11px] tracking-[0.25em] shadow-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                Continuer la souscription <FaArrowRight size={10} />
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
