import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaLinkedin, 
  FaEnvelope, 
  FaFacebook, 
  FaWhatsapp, 
  FaArrowUp 
} from 'react-icons/fa';
import logoM from '../assets/logoM.png'; // Ajustez le chemin selon votre dossier assets

// Réseaux officiels de ESNAs
const contactLinks = [
  { label: 'Email', link: 'mailto:contact@esnas.drc', icon: <FaEnvelope size={16} /> },
  { label: 'WhatsApp', link: 'https://wa.me', icon: <FaWhatsapp size={16} /> },
  { label: 'LinkedIn', link: 'https://linkedin.com', icon: <FaLinkedin size={16} /> },
  { label: 'Facebook', link: 'https://facebook.com', icon: <FaFacebook size={16} /> }
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#090d16] text-white pt-12 pb-10 font-sans relative overflow-hidden border-t border-slate-900 w-full">
      
      {/* Signature Visuelle (Bande tricolore RDC fine en haut) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A3E0] via-[#CE1126] to-[#FDD835] opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center space-y-8">
        
        {/* 1. ICÔNES DES RÉSEAUX SOCIAUX (CARRÉES FINTECH) */}
        <div className="flex items-center justify-center gap-3.5">
          {contactLinks.map((item) => (
            <a 
              key={item.label} 
              href={item.link} 
              target="_blank"
              rel="noreferrer"
              className="w-11 h-11 bg-[#111827] border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#CE1126] hover:border-[#CE1126] transition-all duration-300 rounded-none shadow-md"
              title={item.label}
              aria-label={item.label}
            >
              {item.icon}
            </a>
          ))}
        </div>

        {/* 2. SIGNATURE TYPOGRAPHIQUE ESNAs & COPYRIGHT */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-baseline font-black tracking-tight text-2xl sm:text-3xl text-white uppercase select-none">
            ESNA
            <span className="text-[#CE1126] lowercase font-extrabold -ml-[1px]">s</span>
          </div>
          <p className="text-[10px] text-slate-500 font-black tracking-[0.2em] uppercase">
            © {currentYear} ESNAs • Tous droits réservés
          </p>
        </div>

        {/* 3. SIGNATURE DE MARQUE (FOOTER "FROM MUAMOKEL") */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col items-center gap-2.5 relative z-10 pt-2"
        >
          {/* Mention "from" discrète et corporative */}
          <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500/80">
            from
          </span>

          {/* Bloc Logo + Nom de la société */}
          <div className="flex items-center gap-3 bg-white/[0.02] border border-slate-900 px-5 py-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] backdrop-blur-md">
            <img 
              src={logoM} 
              alt="Logo Muamokel" 
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain opacity-95"
            />
            <span className="text-white font-black tracking-wider text-base sm:text-lg uppercase">
              Muamokel
            </span>
          </div>
        </motion.div>

        {/* Bouton discret de retour en haut */}
        <button 
          onClick={scrollToTop}
          className="w-9 h-9 bg-[#111827] border border-slate-800 text-slate-400 flex items-center justify-center hover:bg-[#CE1126] hover:border-[#CE1126] hover:text-white transition-all shadow-md active:scale-95 rounded-none"
          aria-label="Retour en haut"
          title="Haut de page"
        >
          <FaArrowUp size={11} />
        </button>

      </div>
    </footer>
  );
}
