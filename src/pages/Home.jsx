import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Composants de structure
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';

// Icônes
import { FaShieldAlt, FaArrowRight, FaUserCheck, FaHandHoldingHeart } from 'react-icons/fa';

// Assets (Vérifiez bien que ces fichiers existent dans src/assets/)
import background1 from '../assets/background_drc.jpeg';
import background2 from '../assets/logo_drc.jpeg';
import tiers from '../assets/tiers_payant.jpeg';
import notif from '../assets/not_what.jpeg';

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

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [backgrounds.length]);

  return (
    <div className="min-h-screen w-full bg-[#CE1126] flex flex-col antialiased font-sans text-slate-900 transition-colors duration-300 py-20">
      <NavbarSecured />

{/* ================= 1. SECTION HERO ================= */}
<section className="relative flex flex-col bg-slate-50 overflow-hidden border-t border-slate-100 w-full transition-all duration-500 ease-out hover:z-10 hover:border-red-100 hover:shadow-[0_25px_60px_-15px_rgba(206,17,38,0.12)]">
  
  {/* Visuels d'arrière-plan - Rendu clair et sans opacité */}
  <div className="w-full h-[35vh] sm:h-[45vh] md:h-[60vh] relative overflow-hidden bg-slate-900">
    <AnimatePresence mode="wait">
      <motion.div 
        key={bgIndex}
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.0 }}
        className="absolute inset-0 bg-cover bg-center brightness-105"
        style={{ backgroundImage: `url(${backgrounds[bgIndex]})` }}
      />
    </AnimatePresence>
    {/* Léger voile sombre uniquement en haut pour garantir la visibilité du header si nécessaire, bas totalement transparent */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent z-10" />
  </div>

  {/* Conteneur de contenu principal */}
  <div className="relative z-20 -mt-16 sm:-mt-24 md:-mt-44 max-w-7xl mx-auto px-4 sm:px-6 pb-16 md:pb-24 flex flex-col items-center w-full">
    
    {/* Carte principale - Strictement rectangulaire, bords droits sans courbe */}
    <motion.div 
      variants={staggerContainer} 
      initial="hidden" 
      animate="visible" 
      className="bg-white/95 backdrop-blur-md p-6 sm:p-10 md:p-16 shadow-2xl border border-slate-100 flex flex-col items-center w-full max-w-5xl text-center rounded-none"
    >
      
      {/* Label ARCA */}
      <motion.span 
        variants={fadeInUp} 
        className="px-3 py-1 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 border-l-2 border-[#00A3E0] mb-4 md:mb-6"
      >
        Écosystème Numérique Agréé ARCA
      </motion.span>

      {/* Titre ultra-responsive */}
      <motion.h1 
        variants={fadeInUp} 
        className="text-2xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight md:leading-none mb-4 md:mb-6"
      >
        Protégez votre famille en RDC <br className="hidden sm:inline" />
        <span className="text-[#CE1126] italic">depuis l'Étranger</span>
      </motion.h1>

      {/* Description équilibrée mobile / desktop */}
      <motion.p 
        variants={fadeInUp} 
        className="max-w-2xl mx-auto text-slate-800 text-sm sm:text-base md:text-lg leading-relaxed font-semibold mb-6 md:mb-8 px-2"
      >
        Plus besoin d'envoyer des fonds en urgence. Souscrivez une micro-assurance avec prise en charge directe pour vos proches restés au pays.
      </motion.p>

      {/* Zone des Boutons d'Action - Également rectangulaires */}
      <motion.div 
        variants={staggerContainer} 
        initial="hidden" 
        animate="visible" 
        className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full sm:w-auto px-4 sm:px-0"
      >
        
        {/* Bouton Principal */}
        <motion.button
          variants={fadeInUp}
          whileHover={{ scale: 1.02, backgroundColor: "#15cfe7", color: "#FFFFFF", borderColor: "#15cfe7" }} 
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/packs-micro')}
          className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 border-2 border-[#CE1126] bg-white text-black font-extrabold uppercase text-[10px] md:text-[11px] tracking-[0.25em] shadow-md hover:shadow-xl transition-all duration-300 rounded-none"
        >
          Découvrir les Packs
        </motion.button>
        
        {/* Bouton Secondaire */}
        <motion.button
          variants={fadeInUp}
          whileHover={{ scale: 1.02, backgroundColor: "#CE1126", color: "#FFFFFF" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/simulateur')}
          className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 border-2 border-[#CE1126] bg-white text-black font-extrabold uppercase text-[10px] md:text-[11px] tracking-[0.25em] shadow-md hover:shadow-xl transition-all duration-300 rounded-none"
        >
          Simuler un Tarif
        </motion.button>

      </motion.div>
    </motion.div>
  </div>
</section>

{/* ================= 2. SECTION COMMERCIALE AMÉLIORÉE ================= */}
<section className="py-16 md:py-24 bg-white overflow-hidden font-sans border-t border-slate-100 w-full transition-all duration-500 ease-out hover:z-10 hover:border-red-100 hover:shadow-[0_25px_60px_-15px_rgba(206,17,38,0.12)]">
  <div className="max-w-7xl mx-auto px-4 sm:px-6">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
      
      {/* BLOC GAUCHE : IMAGE PRINCIPALE (Rectangle strict) */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }} 
        whileInView={{ opacity: 1, x: 0 }} 
        viewport={{ once: true }} 
        transition={{ duration: 0.8 }}
        className="lg:col-span-5 w-full"
      >
        <div className="relative z-10 overflow-hidden shadow-2xl border-8 border-slate-50 group bg-slate-100 rounded-none">
          <img 
            src={background1} 
            alt="Inclusion" 
            className="w-full h-[400px] md:h-[600px] object-cover transition-transform duration-1000 group-hover:scale-105" 
          />
          {/* Dégradé léger uniquement pour le contraste du texte blanc */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 md:p-10 text-white">
            <h3 className="text-2xl md:text-3xl font-black uppercase italic leading-tight tracking-tighter">
              Bâtir un pont <br /> de confiance.
            </h3>
          </div>
        </div>
      </motion.div>

      {/* BLOC DROIT : TEXTE & GRILLE DE CARTES DROITES */}
      <div className="lg:col-span-7 space-y-10 md:space-y-12 text-left w-full">
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-3xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Un écosystème <span className="text-[#CE1126]">traçable.</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-800 leading-relaxed font-bold max-w-2xl">
            Garantissez que chaque dollar versé est converti en soins réels pour vos bénéficiaires en RDC.
          </p>
        </div>

        {/* Grille des fonctionnalités */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
          
          {/* CARTE 1 : TIERS-PAYANT (Carré/Rectangle droit) */}
          <motion.div 
            whileHover={{ y: -6 }}
            className="group flex flex-col w-full"
          >
            <div className="relative h-44 md:h-48 w-full overflow-hidden shadow-lg mb-4 md:mb-6 border border-slate-100 rounded-none">
              <img src={tiers} alt="Tiers-Payant" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-transparent" />
              
              {/* Icône flottante carrée */}
              <div className="absolute top-4 left-4 w-10 h-10 bg-[#CE1126] text-white flex items-center justify-center shadow-lg rounded-none">
                <FaUserCheck size={18} />
              </div>
            </div>
            <div className="px-1">
              <h4 className="text-lg md:text-xl font-black uppercase mb-2 text-slate-900 tracking-tight">Tiers-Payant</h4>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-semibold">
                Prise en charge directe en clinique via QR Code. Vos proches ne déboursent rien.
              </p>
            </div>
          </motion.div>

          {/* CARTE 2 : ALERTE INSTANTANÉE (Carré/Rectangle droit) */}
          <motion.div 
            whileHover={{ y: -6 }}
            className="group flex flex-col w-full"
          >
            <div className="relative h-44 md:h-48 w-full overflow-hidden shadow-lg mb-4 md:mb-6 border border-slate-100 rounded-none">
              <img src={notif} alt="Alerte WhatsApp" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-transparent" />
              
              {/* Icône flottante carrée */}
              <div className="absolute top-4 left-4 w-10 h-10 bg-slate-900 text-white flex items-center justify-center shadow-lg rounded-none">
                <FaHandHoldingHeart size={18} />
              </div>
            </div>
            <div className="px-1">
              <h4 className="text-lg md:text-xl font-black uppercase mb-2 text-slate-900 tracking-tight">Alerte Instantanée</h4>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-semibold">
                Notification WhatsApp automatique au pays dès validation du paiement.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  </div>
</section>

{/* ================= 3. SECTION RÉASSURANCE ================= */}
<section className="py-20 md:py-28 bg-slate-50 border-t border-slate-100 w-full transition-all duration-500 ease-out hover:z-10 hover:border-red-100 hover:shadow-[0_25px_60px_-15px_rgba(206,17,38,0.12)]">
  <motion.div 
    initial={{ opacity: 0, y: 30 }} 
    whileInView={{ opacity: 1, y: 0 }} 
    viewport={{ once: true }} 
    transition={{ duration: 0.8 }}
    className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8"
  >
    {/* Conteneur d'icône - Parfaitement carré, sans aucune courbe */}
    <div className="inline-flex p-5 bg-white border border-slate-200 text-[#CE1126] shadow-sm rounded-none">
      <FaShieldAlt size={40} />
    </div>

    {/* Titre percutant avec typographie rectiligne */}
    <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-slate-900 leading-tight">
      Une couverture adossée à des <br />
      <span className="text-[#CE1126]">Leaders Internationaux</span>
    </h3>

    {/* Description ajustée pour un contraste et une lisibilité maximale */}
    <p className="text-base md:text-lg text-slate-700 font-semibold leading-relaxed max-w-2xl mx-auto">
      Nos polices sont co-assurées par des partenaires agréés ARCA et réassurées mondialement pour une sécurité financière absolue.
    </p>

  </motion.div>
</section>      
      <FAQSection />
      <Footer />
    </div>
  );
}
