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
import background1 from '../assets/background_drc.jpeg';
import background2 from '../assets/logo_drc.jpeg';
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
  const backgrounds = [background1, background2];
  const [bgIndex, setBgIndex] = useState(0);
  const heroDescriptions = [
    'Plus besoin d’envoyer des fonds en urgence. Souscrivez une micro-assurance avec prise en charge directe pour vos proches restés au pays.',
    'Choisissez une formule claire, suivez vos garanties et donnez à votre famille un accès rapide aux soins agréés en RDC.',
    'Une protection traçable, pensée pour la diaspora, avec des démarches simples et une assistance disponible au bon moment.',
  ];
  const [descriptionIndex, setDescriptionIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [backgrounds.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDescriptionIndex((previous) => (previous + 1) % heroDescriptions.length);
    }, 5200);
    return () => clearInterval(timer);
  }, [heroDescriptions.length]);

  return (
    <div className="min-h-screen w-full bg-[#CE1126] flex flex-col antialiased font-sans text-slate-900 transition-colors duration-300 py-21">
      <NavbarSecured />

{/* ================= 1. SECTION HERO ================= */}
<section className="hero-section relative flex flex-col bg-[#090d16] overflow-hidden border-t border-slate-900 w-full transition-all duration-500 ease-out hover:z-10 hover:border-red-950/40 hover:shadow-[0_25px_60px_-15px_rgba(206,17,38,0.25)]">
  
  {/* Visuels d'arrière-plan - Rendu clair et net */}
  <div className="w-full h-[30vh] sm:h-[38vh] md:h-[48vh] relative overflow-hidden bg-slate-950">
    <AnimatePresence mode="wait">
      <motion.div 
        key={bgIndex}
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.0 }}
        className="absolute inset-0 bg-cover bg-center brightness-110 contrast-105"
        style={{ backgroundImage: `url(${backgrounds[bgIndex]})` }}
      />
    </AnimatePresence>
    {/* Dégradé fluide vers le fond sombre global pour un fondu haut de gamme */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#090d16] z-10" />
  </div>

  {/* Conteneur de contenu principal */}
  <div className="relative z-20 -mt-12 sm:-mt-16 md:-mt-24 max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 flex flex-col items-center w-full">
    
    {/* Carte principale Bento - Fond Surface Sombre, Angles droits sans courbes */}
    <motion.div 
      variants={staggerContainer} 
      initial="hidden" 
      animate="visible" 
      className="hero-card bg-[#111827]/90 backdrop-blur-xl p-6 sm:p-8 md:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.6)] border border-slate-800 flex flex-col items-center w-full max-w-4xl text-center rounded-none"
    >
      
      {/* Label ARCA */}
      <motion.span 
        variants={fadeInUp} 
        className="hero-kicker px-3 py-1 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-slate-200 border-l-2 border-[#00A3E0] mb-4 md:mb-6"
      >
        Écosystème Numérique Agréé ARCA
      </motion.span>

      {/* Titre ultra-responsive Blanc Pur */}
      <motion.h1 
        variants={fadeInUp} 
        className="hero-title text-2xl sm:text-4xl md:text-6xl font-black text-white tracking-tight leading-tight md:leading-none mb-4 md:mb-5 uppercase"
      >
        Protégez votre famille en RDC <br className="hidden sm:inline" />
        <span className="text-[#CE1126] italic normal-case">depuis l'Étranger</span>
      </motion.h1>

      {/* Descriptions rotatives : hauteur stable pour éviter les sauts de mise en page */}
      <div className="hero-description mb-5 flex min-h-[8.5rem] w-full max-w-3xl flex-col items-center justify-center gap-4 px-3 sm:mb-6 sm:min-h-[7rem] sm:gap-5 md:mb-7 md:min-h-[6rem] md:gap-4">
        <span className="hero-description-rule w-16 sm:w-24" aria-hidden="true" />
        <div className="relative flex min-h-[4.5rem] w-full items-center justify-center overflow-hidden sm:min-h-[4rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={descriptionIndex}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="hero-description-text absolute inset-x-0 top-1/2 mx-auto w-full max-w-2xl -translate-y-1/2 text-center text-sm leading-relaxed font-semibold sm:text-base md:text-lg"
            >
              {heroDescriptions[descriptionIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        <span className="hero-description-rule w-16 sm:w-24" aria-hidden="true" />
      </div>

      {/* Zone des Boutons d'Action - Rectangulaires FinTech */}
      <motion.div 
        variants={staggerContainer} 
        initial="hidden" 
        animate="visible" 
        className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full sm:w-auto px-4 sm:px-0"
      >
        
        {/* Bouton Principal : Fond blanc, texte noir, lueur turquoise au survol */}
        <motion.button
          variants={fadeInUp}
          whileHover={{ scale: 1.02, backgroundColor: "#15cfe7", color: "#000000", borderColor: "#15cfe7" }} 
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/packs-micro')}
          className="hero-primary-button w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 border-2 border-white bg-white text-black font-extrabold uppercase text-[10px] md:text-[11px] tracking-[0.25em] shadow-md transition-all duration-300 rounded-none"
        >
          Découvrir les Packs
        </motion.button>
        
        {/* Bouton Secondaire : Bordure rouge, texte blanc, fond rouge complet au survol */}
        <motion.button
          variants={fadeInUp}
          whileHover={{ scale: 1.02, backgroundColor: "#CE1126", color: "#FFFFFF" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/simulateur')}
          className="hero-secondary-button w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 border-2 border-[#CE1126] bg-transparent text-white font-extrabold uppercase text-[10px] md:text-[11px] tracking-[0.25em] shadow-md transition-all duration-300 rounded-none"
        >
          Simuler un Tarif
        </motion.button>

      </motion.div>
    </motion.div>
  </div>
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
      <p className="text-lg md:text-xl text-[#94a3b8] leading-relaxed font-bold max-w-2xl">
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
    <p className="text-base md:text-lg text-[#94a3b8] font-semibold leading-relaxed max-w-3xl mx-auto">
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
