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
      name: "Sarah K.", 
      role: "Assurée locale (Lubumbashi)", 
      text: "J'ai présenté mon QR code WhatsApp à la clinique après mon accident de voiture. DRC Assurances a validé mon dossier et pris en charge mes frais en moins de 10 minutes." 
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased font-sans">
      {/* Barre de navigation sécurisée au sommet */}
      <NavbarSecured />
      
      {/* ================= 1. EN-TÊTE DE LA VITRINE DES AVIS (Style Épuré) ================= */}
      <header className="relative flex flex-col bg-white overflow-hidden border-b border-slate-100">
        <div className="relative z-20 max-w-6xl mx-auto px-6 py-20 pt-32 text-center flex flex-col items-center w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full flex flex-col items-center">
            
            <span className="px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 border-l-2 border-[#CE1126]">
              Retours d'expérience vérifiés
            </span>
            
            <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tight leading-none uppercase">
              Témoignages de <span className="text-[#CE1126] italic">nos Assurés</span>
            </h1>
            
            <p className="max-w-xl mx-auto text-slate-500 text-lg md:text-xl leading-relaxed font-light">
              Découvrez les retours d'expérience de la diaspora et de nos bénéficiaires locaux en République Démocratique du Congo.
            </p>

          </motion.div>
        </div>
      </header>

      {/* ================= 2. GRILLE DE CARDS BENTO INTERACTIVES ================= */}
      <main className="flex-grow max-w-5xl mx-auto px-6 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {reviews.map((rev, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="bg-white p-8 md:p-10 rounded-[2rem] shadow-md border border-slate-100 text-left relative overflow-hidden flex flex-col justify-between hover:shadow-2xl transition-all duration-500 group"
            >
              {/* Icône de citation géante et discrète */}
              <FaQuoteLeft className="text-red-600/5 text-5xl absolute top-6 right-6 transition-transform duration-500 group-hover:scale-110" />
              
              <div>
                {/* Score d'évaluation par étoiles Or RDC */}
                <div className="flex gap-1 text-amber-500 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 inline-flex items-center mb-6 shadow-sm">
                  {[...Array(5)].map((_, idx) => <FaStar key={idx} size={12} />)}
                </div>
                
                {/* Contenu textuel */}
                <p className="text-slate-600 text-base md:text-lg leading-relaxed font-medium italic mb-8">
                  "{rev.text}"
                </p>
              </div>

              {/* Bloc profil de l'assuré */}
              <div className="flex items-center gap-4 border-t border-slate-50 pt-6">
                <div className="text-red-600/20 group-hover:text-red-600 transition-colors duration-300">
                  <FaUserCircle size={36} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">{rev.name}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{rev.role}</p>
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
