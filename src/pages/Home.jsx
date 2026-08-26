import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Composants de structure
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';


// Icônes
import { FaShieldAlt, FaArrowRight, FaCheckCircle, FaHeartbeat, FaCar, FaGraduationCap, FaPlaneDeparture } from 'react-icons/fa';

// Assets (Vérifiez bien que ces fichiers existent dans src/assets/)
import santé from '../assets/santé.jpeg';
import auto from '../assets/auto.jpeg';
import scolarité from '../assets/scolarité.jpeg';
import voyage from '../assets/voyage.jpeg';

// Variantes d'animations
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};


export default function Home() {
  const navigate = useNavigate();
  
   // 1. Vos images de fond (4 éléments)
  const backgrounds = [santé, auto, scolarité, voyage];
  
  // 2. Vos descriptions rééquilibrées et spécifiques (4 éléments)
  const heroDescriptions = [
    'Prise en charge directe en clinique via QR Code. Vos proches ne déboursent rien sur place.',
    'Garanties complètes pour vos véhicules au pays. Gestion et constatation rapides des sinistres.',
    'Financement et sécurité du parcours scolaire de vos enfants restés au pays en cas de coup dur.',
    'Couverture médicale internationale et assistance bagages pour vos déplacements vers ou depuis la RDC.',
  ];

  // 3. Vos couleurs du drapeau de la RDC associées à chaque thématique (4 éléments)
// Remplacer l'ancien tableau par celui-ci (uniquement les codes HEX)
const descriptionColors = [
  "#00A3E0", // Index 0 (Santé) : Bleu ciel
  "#FDD100", // Index 1 (Auto)  : Jaune or
  "#CE1126", // Index 2 (École) : Rouge national
  "#FFFFFF"  // Index 3 (Voyage) : Blanc pur
];


  const [bgIndex, setBgIndex] = useState(0);

  // 3. Unification de l'effet de défilement pour garantir la synchronisation absolue
  useEffect(() => {
    const timer = setInterval(() => {
      // Sécurité UX : évite de tourner si l'utilisateur change d'onglet
      if (document.hidden) return;
      
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 6000); // Transition globale et synchrone toutes les 6 secondes
    
    return () => clearInterval(timer);
  }, [backgrounds.length]);

  return (
    <div className="min-h-screen w-full bg-[#050811] flex flex-col antialiased font-sans text-slate-900 transition-colors duration-300">
      <NavbarSecured />

     {/* ================= 1. SECTION HERO ================= */}
{/* ================= 1. SECTION HERO ================= */}
<section className="hero-section relative w-full min-h-[90vh] sm:min-h-[95vh] flex flex-col justify-between bg-[#050811] overflow-hidden border-b border-slate-900/50 py-21 pt-5">
  
  {/* Carrousel Immersif Plein Écran (Synchronisé Fond + Description) */}
  <div className="absolute inset-0 w-full h-full z-0">
    <AnimatePresence mode="wait">
      <motion.div 
        key={bgIndex}
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.99 }}
        transition={{ duration: 2.0, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 bg-cover bg-center brightness-[0.32] contrast-[1.05] saturate-[0.9]"
        style={{ backgroundImage: `url(${backgrounds[bgIndex]})` }}
      />
    </AnimatePresence>
    
    {/* Grilles de dégradés FinTech : Assurent la lisibilité parfaite du texte blanc */}
    <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-transparent to-[#050811]/80 z-10" />
    <div className="absolute inset-0 bg-gradient-to-r from-[#050811]/60 via-transparent to-[#050811]/60 z-10" />
  </div>

  {/* Contenu Principal de la section Hero */}
  <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-center items-center text-center mt-16 sm:mt-20">
    
    {/* Label ARCA Épuré */}
    <motion.span 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="hero-kicker px-4 py-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] text-[#FDD100] border-l-2 border-[#00A3E0] mb-6 backdrop-blur-md bg-white/[0.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
    >
      Écosystème Numérique Agréé ARCA
    </motion.span>

    {/* Titre Fixe Ultra-Responsive */}
    <motion.h1 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1 }}
      className="hero-title text-3xl sm:text-6xl md:text-5xl font-black text-white tracking-tight leading-[1.05] md:leading-none mb-8 uppercase max-w-5xl drop-shadow-2xl"
    >
      Protégez votre famille en RDC <br className="hidden sm:inline" />
      <span className="text-[#CE1126] italic normal-case font-serif tracking-normal block sm:inline sm:ml-4">depuis l'Étranger</span>
    </motion.h1>

    {/* Zone Description Agrandie & Dynamique aux couleurs de la RDC */}
    {/* 🌟 Zone Description avec changement de couleur forcé par Style Inline */}
<div className="hero-description relative w-full max-w-4xl min-h-[7.5rem] sm:min-h-[6rem] md:min-h-[5.5rem] flex items-center justify-center my-6 overflow-hidden">
  <AnimatePresence mode="wait">
    <motion.p
      key={bgIndex}
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      style={{ color: descriptionColors[bgIndex] }} // 💡 Forçage de la couleur en CSS pur (Garantit le changement à 100%)
      className="hero-description-text font-black text-lg sm:text-2xl md:text-3xl leading-relaxed sm:leading-relaxed md:leading-relaxed tracking-wide max-w-3xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] text-balance"
    >
      {heroDescriptions[bgIndex]}
    </motion.p>
  </AnimatePresence>
</div>


    {/* Zone Boutons d'Action Premium (Finition Angles Droits FinTech) */}
    <motion.div 
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="flex flex-col sm:flex-row gap-5 sm:gap-6 justify-center w-full sm:w-auto px-4 sm:px-0 mt-10 md:mt-12"
    >
      <motion.button
        whileHover={{ scale: 1.02, backgroundColor: "#15cfe7", color: "#000000", borderColor: "#15cfe7", boxShadow: "0 0 35px rgba(21, 207, 231, 0.45)" }} 
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/packs-micro')}
        className="hero-primary-button w-full sm:w-auto px-12 md:px-16 py-5 md:py-6 border-2 border-white bg-white text-black font-black uppercase text-[11px] tracking-[0.25em] transition-all duration-300 rounded-none cursor-pointer"
      >
        Découvrir les Packs
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.02, backgroundColor: "#CE1126", borderColor: "#CE1126", boxShadow: "0 0 35px rgba(206, 17, 38, 0.45)" }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/simulateur')}
        className="hero-secondary-button w-full sm:w-auto px-12 md:px-16 py-5 md:py-6 border-2 border-[#CE1126] bg-transparent text-white font-black uppercase text-[11px] tracking-[0.25em] transition-all duration-300 rounded-none cursor-pointer"
      >
        Simuler un Tarif
      </motion.button>
    </motion.div>

    {/* Indicateurs Visuels Avancés avec barre de progression de 40 secondes */}
    <div className="flex gap-4 mt-16 z-30">
      {backgrounds.map((_, idx) => (
        <button
          key={idx}
          onClick={() => setBgIndex(idx)}
          className="group relative h-[3px] focus:outline-none cursor-pointer transition-all duration-500"
          style={{ width: idx === bgIndex ? '60px' : '16px' }}
        >
          <div className={`absolute inset-0 transition-all duration-500 ${idx === bgIndex ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/30'}`} />
          {idx === bgIndex && (
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 40, ease: "linear" }}
              className="absolute inset-y-0 left-0 bg-[#15cfe7]"
            />
          )}
        </button>
      ))}
    </div>

  </div>

  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent z-20" />
</section>



{/* ================= 2. SECTION COMMERCIALE AMÉLIORÉE ================= */}
<section className="commercial-section py-16 md:py-24 bg-[#090d16] overflow-hidden font-sans border-t border-slate-900 w-full transition-all duration-500 ease-out hover:z-10 hover:border-red-950/40 hover:shadow-[0_25px_60px_-15px_rgba(206,17,38,0.25)]">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 md:space-y-16">
    
    {/* ZONE DE TEXTE UNIQUE CENTRÉE */}
    <div className="space-y-4 md:space-y-6 flex flex-col items-center text-center">
      <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-[#CE1126]">
        Bâtir un pont de confiance.
      </h3>
      <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">
        Un écosystème <span className="text-[#CE1126]">traçable.</span>
      </h2>
      <p className="text-lg md:text-xl text-[#FDD100] leading-relaxed font-bold max-w-2xl">
        Garantissez que chaque dollar versé est converti en protection réelle, transparente et instantanée pour vos bénéficiaires en RDC.
      </p>
    </div>

    {/* GRILLE DES 4 PRODUITS COMMERCIAUX (Angles droits et rectilignes) */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 w-full">
      
      {/* PRODUIT 1 : SANTE MÉDICALE */}
      <motion.div whileHover={{ y: -6 }} className="product-card group flex flex-col w-full text-left bg-[#111827] border border-slate-800 rounded-none shadow-xl">
        <div className="relative h-44 md:h-48 w-full overflow-hidden bg-slate-950 rounded-none">
          <img src={santé} alt="Santé Médicale" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent opacity-60" />
          <div className="absolute top-4 left-4 w-10 h-10 bg-[#CE1126] text-white flex items-center justify-center shadow-lg rounded-none">
            <FaHeartbeat size={18} />
          </div>
        </div>
        <div className="p-5 flex-grow flex flex-col justify-between gap-5">
          <span className="product-tag text-[9px] font-black uppercase tracking-[0.18em] text-[#00A3E0]">Soins directs</span>
          <h4 className="text-lg md:text-xl font-black uppercase mb-2 text-white tracking-tight">Santé Médicale</h4>
          <p className="text-xs md:text-sm text-[#94a3b8] leading-relaxed font-semibold">
            Prise en charge directe en clinique via QR Code. Vos proches ne déboursent rien sur place.
          </p>
          <div className="product-proof space-y-2 border-t border-slate-800 pt-4 text-[10px] font-bold uppercase tracking-wider text-slate-300">
            <p className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400" /> Tiers-payant agréé</p>
            <p className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400" /> Assistance 24/7</p>
          </div>
          <button onClick={() => navigate('/simulateur', { state: { insuranceType: 'health' } })} className="product-action flex items-center justify-between border-t border-slate-700 pt-4 text-[10px] font-black uppercase tracking-[0.18em] text-white">Configurer <FaArrowRight /></button>
        </div>
      </motion.div>

      {/* PRODUIT 2 : AUTOMOBILE */}
      <motion.div whileHover={{ y: -6 }} className="product-card group flex flex-col w-full text-left bg-[#111827] border border-slate-800 rounded-none shadow-xl">
        <div className="relative h-44 md:h-48 w-full overflow-hidden bg-slate-950 rounded-none">
          <img src={auto} alt="Assurance Automobile" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent opacity-60" />
          <div className="absolute top-4 left-4 w-10 h-10 bg-slate-950 text-white border border-slate-800 flex items-center justify-center shadow-lg rounded-none">
            <FaCar size={18} />
          </div>
        </div>
        <div className="p-5 flex-grow flex flex-col justify-between gap-5">
          <span className="product-tag text-[9px] font-black uppercase tracking-[0.18em] text-[#FDD100]">Protection mobilité</span>
          <h4 className="text-lg md:text-xl font-black uppercase mb-2 text-white tracking-tight">Automobile</h4>
          <p className="text-xs md:text-sm text-[#94a3b8] leading-relaxed font-semibold">
            Garanties complètes pour vos véhicules au pays. Gestion et constatation rapides des sinistres.
          </p>
          <div className="product-proof space-y-2 border-t border-slate-800 pt-4 text-[10px] font-bold uppercase tracking-wider text-slate-300">
            <p className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400" /> Conforme ARCA</p>
            <p className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400" /> Réseau garages</p>
          </div>
          <button onClick={() => navigate('/simulateur', { state: { insuranceType: 'auto' } })} className="product-action flex items-center justify-between border-t border-slate-700 pt-4 text-[10px] font-black uppercase tracking-[0.18em] text-white">Configurer <FaArrowRight /></button>
        </div>
      </motion.div>

      {/* PRODUIT 3 : SCOLARITÉ */}
      <motion.div whileHover={{ y: -6 }} className="product-card group flex flex-col w-full text-left bg-[#111827] border border-slate-800 rounded-none shadow-xl">
        <div className="relative h-44 md:h-48 w-full overflow-hidden bg-slate-950 rounded-none">
          <img src={scolarité} alt="Assurance Scolarité" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent opacity-60" />
          <div className="absolute top-4 left-4 w-10 h-10 bg-[#CE1126] text-white flex items-center justify-center shadow-lg rounded-none">
            <FaGraduationCap size={18} />
          </div>
        </div>
        <div className="p-5 flex-grow flex flex-col justify-between gap-5">
          <span className="product-tag text-[9px] font-black uppercase tracking-[0.18em] text-[#00A3E0]">Continuité scolaire</span>
          <h4 className="text-lg md:text-xl font-black uppercase mb-2 text-white tracking-tight">Scolarité</h4>
          <p className="text-xs md:text-sm text-[#94a3b8] leading-relaxed font-semibold">
            Financement et sécurité du parcours scolaire de vos enfants restés au pays en cas de coup dur.
          </p>
          <div className="product-proof space-y-2 border-t border-slate-800 pt-4 text-[10px] font-bold uppercase tracking-wider text-slate-300">
            <p className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400" /> Écoles partenaires</p>
            <p className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400" /> Capital protégé</p>
          </div>
          <button onClick={() => navigate('/simulateur', { state: { insuranceType: 'student' } })} className="product-action flex items-center justify-between border-t border-slate-700 pt-4 text-[10px] font-black uppercase tracking-[0.18em] text-white">Configurer <FaArrowRight /></button>
        </div>
      </motion.div>

      {/* PRODUIT 4 : VOYAGE */}
      <motion.div whileHover={{ y: -6 }} className="product-card group flex flex-col w-full text-left bg-[#111827] border border-slate-800 rounded-none shadow-xl">
        <div className="relative h-44 md:h-48 w-full overflow-hidden bg-slate-950 rounded-none">
          <img src={voyage} alt="Assurance Voyage" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent opacity-60" />
          <div className="absolute top-4 left-4 w-10 h-10 bg-slate-950 text-white border border-slate-800 flex items-center justify-center shadow-lg rounded-none">
            <FaPlaneDeparture size={18} />
          </div>
        </div>
        <div className="p-5 flex-grow flex flex-col justify-between gap-5">
          <span className="product-tag text-[9px] font-black uppercase tracking-[0.18em] text-[#FDD100]">Mobilité internationale</span>
          <h4 className="text-lg md:text-xl font-black uppercase mb-2 text-white tracking-tight">Voyage</h4>
          <p className="text-xs md:text-sm text-[#94a3b8] leading-relaxed font-semibold">
            Couverture médicale internationale et assistance bagages pour vos déplacements vers ou depuis la RDC.
          </p>
          <div className="product-proof space-y-2 border-t border-slate-800 pt-4 text-[10px] font-bold uppercase tracking-wider text-slate-300">
            <p className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400" /> Assistance monde</p>
            <p className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400" /> Rapatriement inclus</p>
          </div>
          <button onClick={() => navigate('/simulateur', { state: { insuranceType: 'voyage' } })} className="product-action flex items-center justify-between border-t border-slate-700 pt-4 text-[10px] font-black uppercase tracking-[0.18em] text-white">Configurer <FaArrowRight /></button>
        </div>
      </motion.div>
    </div>
  </div>
</section>

{/* ================= 3. SECTION RÉASSURANCE ================= */}
<section className="py-20 md:py-28 bg-[#090d16] border-t border-slate-900 w-full transition-all duration-500 ease-out hover:z-10 hover:border-red-950/40 hover:shadow-[0_25px_60px_-15px_rgba(206,17,38,0.25)]">
  <motion.div 
    initial={{ opacity: 0, y: 30 }} 
    whileInView={{ opacity: 1, y: 0 }} 
    viewport={{ once: true }} 
    transition={{ duration: 0.8 }}
    className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8"
  >
    {/* Conteneur d'icône - Parfaitement carré, style Bento Sombre */}
    <div className="inline-flex p-5 bg-[#111827] border border-slate-800 text-[#CE1126] shadow-md rounded-none">
      <FaShieldAlt size={40} />
    </div>

    {/* Titre percutant Blanc Pur */}
    <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
      Une couverture adossée à des <br />
      <span className="text-[#CE1126]">Leaders Internationaux</span>
    </h3>

    {/* Description Gris Argent Scannable */}
    <p className="text-base md:text-lg text-[#FDD100] font-semibold leading-relaxed max-w-3xl mx-auto">
      Nos polices sont co-assurées par des partenaires agréés ARCA et réassurées mondialement pour une sécurité financière absolue.
    </p>

    {/* BOUTON HAUTE VISIBILITÉ : Rectangulaire strict, contraste inversé premium */}
    <div className="pt-4">
      <button
        onClick={() => navigate('/partenaires-garanties')}
        className="inline-flex items-center gap-3 px-8 py-4 border-2 border-white bg-white text-black font-extrabold uppercase text-[11px] tracking-[0.25em] shadow-lg hover:bg-transparent hover:text-white transition-all duration-300 rounded-none group"
      >
        Découvrir nos partenaires 
        <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>

  </motion.div>
</section>

      <FAQSection />
      <Footer />
    </div>
  );
}
