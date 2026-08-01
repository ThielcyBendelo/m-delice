import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaLinkedin, FaEnvelope, FaInstagram, 
  FaFacebook, FaWhatsapp, FaShieldAlt, FaArrowUp 
} from 'react-icons/fa';

// Réseaux officiels de ESNAS

const contactLinks = [
  { label: 'Email', link: 'mailto:contact@drcassurancescom', icon: <FaEnvelope /> },
  { label: 'WhatsApp', link: 'https://wame/votre_numero', icon: <FaWhatsapp /> },
  { label: 'LinkedIn', link: 'https://linkedincom/company/drc-assurances', icon: <FaLinkedin /> },
  { label: 'Facebook', link: 'https://facebookcom/drcassurances', icon: <FaFacebook /> }
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white text-slate-900 pt-24 pb-12 font-sans relative overflow-hidden border-t border-slate-100 w-full relative overflow-hidden transition-all duration-500 ease-out hover:z-10 hover:border-red-100 hover:shadow-[0_25px_60px_-15px_rgba(206,17,38,0.12)]">
      
     {/* Signature Visuelle (Bande tricolore RDC très fine en haut) */}
<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A3E0] via-[#CE1126] to-[#FDD835] opacity-50" />

<div className="max-w-7xl mx-auto px-4 sm:px-6">
  <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 mb-20">
    
    {/* Bloc 1 : Identité Corporate ESNAs */}
    <div className="md:col-span-4 space-y-8">
      {/* Signature Typographique ESNAs Harmonisée */}
      <div className="flex items-baseline font-black tracking-tight text-3xl text-slate-900 uppercase select-none">
        ESNA
        <span className="text-[#CE1126] lowercase font-extrabold -ml-[1px]">s</span>
      </div>
      
      <p className="text-base md:text-lg text-slate-600 font-semibold leading-relaxed max-w-sm">
        L'écosystème numérique de confiance qui connecte la diaspora à la protection de leurs proches en RDC.
      </p>

      {/* Icônes de Contact / Réseaux Sociaux - Entièrement Carrées */}
      <div className="flex gap-4">
        {contactLinks.map((item) => (
          <a 
            key={item.label} 
            href={item.link} 
            className="w-12 h-12 bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all duration-300 rounded-none shadow-sm"
            title={item.label}
          >
            {item.icon}
          </a>
        ))}
      </div>
    </div>


          {/* Bloc 2 : Navigation (Style Bento Grid épuré) */}
          <div className="md:col-span-2 space-y-6">
            <h4 className="text-[px] font-black uppercase tracking-[em] text-red-600">Plateforme</h4>
            <ul className="space-y-4 text-[px] font-bold uppercase tracking-widest text-slate-400">
              <li><Link to="/" className="hover:text-slate-900 transition-colors">Accueil</Link></li>
              <li><Link to="/formules" className="hover:text-slate-900 transition-colors">Offres</Link></li>
              <li><Link to="/simulateur" className="hover:text-slate-900 transition-colors">Tarificateur</Link></li>
              <li><Link to="/reseau-soins" className="hover:text-slate-900 transition-colors">Réseau Soins</Link></li>
            </ul>
          </div>

          {/* Bloc 3 : Support & Localisation */}
          <div className="md:col-span-3 space-y-6 text-left">
            <h4 className="text-[px] font-black uppercase tracking-[em] text-red-600">Hub Kinshasa</h4>
            <div className="space-y-4">
              <div className="group">
                <p className="text-[px] uppercase text-slate-400 font-bold mb-1">Expertise Directe</p>
                <p className="text-sm font-bold text-slate-800">contact@drcassurances.com</p>
              </div>
              <div className="group">
                <p className="text-[px] uppercase text-slate-400 font-bold mb-1">Siège Social</p>
                <p className="text-sm font-bold text-slate-800 italic">Gombe, Kinshasa, RD Congo</p>
              </div>
            </div>
          </div>

          {/* Bloc 4 : Accréditation ARCA (Confiance) */}
          <div className="md:col-span-3 bg-slate-50 p-8 rounded-3xl border border-slate-100 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-red-600">
                <FaShieldAlt size={20} />
                <span className="text-[px] font-black uppercase tracking-widest">Agrément ARCA</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Toutes nos opérations sont certifiées conformes au Code des Assurances en vigueur en République Démocratique du Congo.
              </p>
            </div>
          </div>
        </div>

        {/* Barre de Copyright Finale (Style Minimaliste) */}
        <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-1">
            <p className="text-[px] text-slate-400 font-bold tracking-[em] uppercase">
              © {currentYear} ESNAS
 | Fintech & Micro-Assurances
            </p>
            <p className="text-[px] text-slate-300 uppercase tracking-widest">
              L'inclusion financière au service du peuple congolais.
            </p>
          </div>

          <div className="flex items-center gap-8 text-[px] uppercase tracking-[em] font-black text-slate-400">
            <Link to="/mentions" className="hover:text-red-600 transition-colors">Légal</Link>
            <Link to="/confidentialite" className="hover:text-red-600 transition-colors">Privacy</Link>
            <button 
              onClick={scrollToTop}
              className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-xl active:scale-95"
            >
              <FaArrowUp size={12} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
