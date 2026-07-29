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
import background1 from '../assets/background1.png';
import background2 from '../assets/background2.png';

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
      <section className="relative flex flex-col bg-white overflow-hidden border-t border-slate-100 w-full relative overflow-hidden transition-all duration-500 ease-out hover:z-10 hover:border-red-100 hover:shadow-[0_25px_60px_-15px_rgba(206,17,38,0.12)]">
        <div className="w-full h-[45vh] md:h-[50vh] relative overflow-hidden bg-slate-900">
          <AnimatePresence mode="wait">
            <motion.div 
              key={bgIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${backgrounds[bgIndex]})` }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent z-10" />
        </div>

        <div className="relative z-20 -mt-20 md:-mt-32 max-w-7xl mx-auto px-6 pb-24 py-24 text-center flex flex-col items-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="bg-white/80 backdrop-blur-2xl p-10 md:p-16 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col items-center">
            
            <motion.span variants={fadeInUp} className="px-4 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 border-l-2 border-[#00A3E0] mb-6">
              Écosystème Numérique Agréé ARCA
            </motion.span>

            <motion.h1 variants={fadeInUp} className="text-4xl md:text-7xl font-black text-slate-900 tracking-tight leading-none mb-8">
              Protégez votre famille en RDC <br />
              <span className="text-[#CE1126] italic">depuis l'Étranger</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-2xl mx-auto text-slate-950 text-lg md:text-xl leading-relaxed font-bold mb-10">
              Plus besoin d'envoyer des fonds en urgence. Souscrivez une micro-assurance avec prise en charge directe pour vos proches restés au pays.
            </motion.p>

            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-6 justify-center pt-8 w-full sm:w-auto">
  
  {/* Bouton Principal : Rectangulaire, Fond Rouge, Texte Blanc Extra-Gras */}
 <motion.div 
  variants={staggerContainer} 
  initial="hidden" 
  animate="visible" 
  className="flex flex-col sm:flex-row gap-6 justify-center pt-8 w-full sm:w-auto"
>
  
  {/* Bouton Principal : Bordure Rouge, Fond Blanc, Texte Noir */}
  <motion.button
    variants={fadeInUp}
    whileHover={{ scale: 1.02, backgroundColor: "#15cfe7", color: "#FFFFFF" }} 
    whileTap={{ scale: 0.98 }}
    onClick={() => navigate('/packs-micro')}
    className="px-12 py-5 border-2 border-[#CE1126] bg-white text-black font-extrabold uppercase text-[11px] tracking-[0.25em] shadow-lg transition-all"
  >
    Découvrir les Packs
  </motion.button>
  
  {/* Bouton Secondaire : Identique pour la cohérence visuelle ou avec variante */}
  <motion.button
    variants={fadeInUp}
    whileHover={{ scale: 1.02, backgroundColor: "#CE1126", color: "#FFFFFF" }}
    whileTap={{ scale: 0.98 }}
    onClick={() => navigate('/simulateur')}
    className="px-12 py-5 border-2 border-[#CE1126] bg-white text-black font-extrabold uppercase text-[11px] tracking-[0.25em] shadow-lg transition-all"
  >
    Simuler un Tarif
  </motion.button>

</motion.div>
</motion.div>
          </motion.div>
        </div>
      </section>

     {/* ================= 2. SECTION COMMERCIALE AMÉLIORÉE ================= */}
<section className="py-24 bg-white overflow-hidden font-sans border-t border-slate-100 w-full relative overflow-hidden transition-all duration-500 ease-out hover:z-10 hover:border-red-100 hover:shadow-[0_25px_60px_-15px_rgba(206,17,38,0.12)]">
  <div className="max-w-7xl mx-auto px-6">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
      
      {/* BLOC GAUCHE : IMAGE PRINCIPALE (Inclusion) */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }} 
        whileInView={{ opacity: 1, x: 0 }} 
        viewport={{ once: true }} 
        className="lg:col-span-5 relative"
      >
        <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-slate-50 group">
          <img 
            src={background1} 
            alt="Inclusion" 
            className="w-full h-[600px] object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#CE1126]/90 via-transparent to-transparent flex flex-col justify-end p-10 text-white">
            <h3 className="text-3xl font-black uppercase italic leading-tight tracking-tighter">
              Bâtir un pont <br /> de confiance.
            </h3>
          </div>
        </div>
      </motion.div>

      {/* BLOC DROIT : TEXTE & GRILLE DE CARTES AVEC IMAGES */}
      <div className="lg:col-span-7 space-y-12 text-left">
        <div className="space-y-6">
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Un écosystème <span className="text-[#CE1126]">traçable.</span>
          </h2>
          <p className="text-xl text-slate-950 leading-relaxed font-medium max-w-2xl">
            Garantissez que chaque dollar versé est converti en soins réels pour vos bénéficiaires en RDC.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* CARTE 1 : TIERS-PAYANT */}
          <motion.div 
            whileHover={{ y: -10 }}
            className="group flex flex-col"
          >
            <div className="relative h-48 w-full rounded-3xl overflow-hidden shadow-lg mb-6 border border-slate-100">
              <img src={background1} alt="Tiers-Payant" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              {/* Icône flottante sur l'image */}
              <div className="absolute top-4 left-4 w-10 h-10 bg-[#CE1126] text-white rounded-xl flex items-center justify-center shadow-lg">
                <FaUserCheck size={18} />
              </div>
            </div>
            <div className="px-2">
              <h4 className="text-xl font-black uppercase mb-2 text-slate-900 tracking-tight">Tiers-Payant</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Prise en charge directe en clinique via QR Code. Vos proches ne déboursent rien.
              </p>
            </div>
          </motion.div>

          {/* CARTE 2 : ALERTE INSTANTANÉE */}
          <motion.div 
            whileHover={{ y: -10 }}
            className="group flex flex-col"
          >
            <div className="relative h-48 w-full rounded-3xl overflow-hidden shadow-lg mb-6 border border-slate-100">
              <img src={background2} alt="Alerte WhatsApp" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              {/* Icône flottante sur l'image */}
              <div className="absolute top-4 left-4 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                <FaHandHoldingHeart size={18} />
              </div>
            </div>
            <div className="px-2">
              <h4 className="text-xl font-black uppercase mb-2 text-slate-900 tracking-tight">Alerte Instantanée</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
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
    <section className="py-32 bg-white text-white text-center border-t border-slate-100 w-full relative overflow-hidden transition-all duration-500 ease-out hover:z-10 hover:border-red-100 hover:shadow-[0_25px_60px_-15px_rgba(206,17,38,0.12)]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="max-w-4xl mx-auto px-6 space-y-10">
          <div className="inline-flex p-5 rounded-full bg-white/5 border border-white/10 text-[#CE1126] mb-4">
            <FaShieldAlt size={40} />
          </div>
          <h3 className="text-4xl md:text-6xl font-black uppercase italic leading-none tracking-tighter">
            Une couverture adossée à des <br /><span className="text-[#CE1126]">Leaders Internationaux</span>
          </h3>
          <p className="text-xl text-slate-950 font-light leading-relaxed">
            Nos polices sont co-assurées par des partenaires agréés ARCA et réassurées mondialement.
          </p>
        </motion.div>
      </section>

      <FAQSection />
      <Footer />
    </div>
  );
}
