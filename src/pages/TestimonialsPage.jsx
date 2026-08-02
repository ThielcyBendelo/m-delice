import React from 'react';
import { motion } from 'framer-motion';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import { FaQuoteLeft, FaStar, FaUserCircle } from 'react-icons/fa';

export default function TestimonialsPage() {
  const reviews = [
    { 
      name: "Christian M.", 
      role: "Diaspora (Bruxelles)", 
      text: "Grâce au pack Santé Maman, ma maman est prise en charge à Kinshasa sans que je n'aie à envoyer d'argent en urgence par agence de transfert. Service irréprochable et instantané." 
    },
    {
      name: "Marie-Claire K.",
      role: "Assurée locale (Lubumbashi)", 
      text: "J'ai présenté mon QR code WhatsApp à la clinique après mon accident de voiture. ESNAS a validé mon dossier et pris en charge mes frais en moins de 10 minutes." 
    }
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col antialiased font-sans w-full">
      {/* Barre de navigation sécurisée au sommet */}
      <NavbarSecured />
      
      {/* ================= 1. EN-TÊTE DE LA VITRINE DES AVIS (VERSION SOMBRE ONYX) ================= */}
      <header className="relative flex flex-col bg-[#090d16] overflow-hidden border-b border-slate-900 rounded-none">
        <div className="relative z-20 max-w-6xl mx-auto px-6 py-20 pt-32 text-center flex flex-col items-center w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full flex flex-col items-center">
            
            <span className="px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#CE1126] bg-[#CE1126]/10 border border-[#CE1126]/20 border-l-2 border-l-[#CE1126] rounded-none">
              Retours d'expérience vérifiés
            </span>
            
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-none uppercase">
              Témoignages de <span className="text-[#CE1126] italic normal-case">nos Assurés</span>
            </h1>
            
            <p className="max-w-xl mx-auto text-[#94a3b8] text-base md:text-xl leading-relaxed font-semibold">
              Découvrez les retours d'expérience de la diaspora et de nos bénéficiaires locaux en République Démocratique du Congo.
            </p>

          </motion.div>
        </div>
      </header>

      {/* ================= 2. GRILLE DE CARDS BENTO INTERACTIVES (RECTANGLE STRICT) ================= */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 py-16 w-full bg-[#090d16]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full">
          {reviews.map((rev, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="bg-[#111827] p-6 md:p-10 shadow-xl border border-slate-800 text-left relative overflow-hidden flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 rounded-none group"
            >
              {/* Icône de citation géante et discrète */}
              <FaQuoteLeft className="text-[#CE1126]/10 text-5xl absolute top-6 right-6 transition-transform duration-500 group-hover:scale-110" />
              
              <div>
                {/* Score d'évaluation par étoiles Or RDC */}
                <div className="flex gap-1 text-amber-400 bg-amber-500/10 px-3 py-1.5 border border-amber-500/20 inline-flex items-center mb-6 shadow-md rounded-none">
                  {[...Array(5)].map((_, idx) => <FaStar key={idx} size={12} />)}
                </div>
                
                {/* Contenu textuel */}
                <p className="text-[#94a3b8] text-sm md:text-base leading-relaxed font-semibold mb-8">
                  "{rev.text}"
                </p>
              </div>

              {/* Bloc profil de l'assuré */}
              <div className="flex items-center gap-4 border-t border-slate-800 pt-6">
                <div className="text-slate-600 group-hover:text-[#CE1126] transition-colors duration-300">
                  <FaUserCircle size={36} />
                </div>
                <div>
                  <h4 className="font-black text-white uppercase tracking-tight text-sm">{rev.name}</h4>
                  <p className="text-xs text-slate-500 font-black uppercase tracking-wider mt-0.5">{rev.role}</p>
                </div>
              </div>

            </motion.div>
          ))}
        </div>
      </main>
      
      {/* Pied de page institutionnel */}
      <Footer />
    </div>
  );
}
