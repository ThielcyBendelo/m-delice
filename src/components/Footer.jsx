import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaLinkedin, FaEnvelope, FaInstagram, 
  FaFacebook, FaWhatsapp, FaShieldAlt, FaArrowUp 
} from 'react-icons/fa';

// Réseaux officiels de ESNAs
const contactLinks = [
  { label: 'Email', link: 'mailto:contact@esnas.drc', icon: <FaEnvelope /> },
  { label: 'WhatsApp', link: 'https://wa.me', icon: <FaWhatsapp /> },
  { label: 'LinkedIn', link: 'https://linkedin.com', icon: <FaLinkedin /> },
  { label: 'Facebook', link: 'https://facebook.com', icon: <FaFacebook /> }
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#090d16] text-white pt-20 pb-12 font-sans relative overflow-hidden border-t border-slate-900 w-full transition-all duration-500 ease-out hover:z-10 hover:border-red-950/40 hover:shadow-[0_25px_60px_-15px_rgba(206,17,38,0.25)]">
      
      {/* Signature Visuelle (Bande tricolore RDC fine en haut) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A3E0] via-[#CE1126] to-[#FDD835] opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 mb-16 md:mb-20">
          
          {/* Bloc 1 : Identité Corporate ESNAs */}
          <div className="md:col-span-4 space-y-6 md:space-y-8">
            {/* Signature Typographique ESNAs Harmonisée */}
            <div className="flex items-baseline font-black tracking-tight text-3xl text-white uppercase select-none">
              ESNA
              <span className="text-[#CE1126] lowercase font-extrabold -ml-[1px]">s</span>
            </div>
            
            <p className="text-sm md:text-base text-[#94a3b8] font-semibold leading-relaxed max-w-sm">
              L'écosystème numérique de confiance qui connecte la diaspora à la protection de leurs proches en RDC.
            </p>

            {/* Icônes de Contact / Réseaux Sociaux - Entièrement Carrées */}
            <div className="flex gap-3">
              {contactLinks.map((item) => (
                <a 
                  key={item.label} 
                  href={item.link} 
                  className="w-11 h-11 bg-[#111827] border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#CE1126] hover:border-[#CE1126] transition-all duration-300 rounded-none shadow-md"
                  title={item.label}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Bloc 2 : Navigation (Style Bento Grid épuré) */}
          <div className="md:col-span-2 space-y-4 md:space-y-6 text-left">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#CE1126]">Plateforme</h4>
            <ul className="space-y-3 text-[11px] font-bold uppercase tracking-widest text-slate-200">
              <li><Link to="/" className="hover:text-[#CE1126] transition-colors">Accueil</Link></li>
              <li><Link to="/packs-micro" className="hover:text-[#CE1126] transition-colors">Offres</Link></li>
              <li><Link to="/simulateur" className="hover:text-[#CE1126] transition-colors">Tarificateur</Link></li>
              <li><Link to="/partenaires-garanties" className="hover:text-[#CE1126] transition-colors">Garanties</Link></li>
            </ul>
          </div>

          {/* Bloc 3 : Support & Localisation */}
          <div className="md:col-span-3 space-y-4 md:space-y-6 text-left">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#CE1126]">Hub Kinshasa</h4>
            <div className="space-y-4">
              <div className="group">
                <p className="text-[9px] uppercase text-slate-500 font-black tracking-wider mb-1">Expertise Directe</p>
                <p className="text-sm font-bold text-slate-200 group-hover:text-[#CE1126] transition-colors">contact@esnas.drc</p>
              </div>
              <div className="group">
                <p className="text-[9px] uppercase text-slate-500 font-black tracking-wider mb-1">Siège Social</p>
                <p className="text-sm font-semibold text-slate-300 italic">Gombe, Kinshasa, RD Congo</p>
              </div>
            </div>
          </div>

          {/* Bloc 4 : Accréditation ARCA (Confiance) - Bento Box Sombre */}
          <div className="md:col-span-3 bg-[#111827] p-6 md:p-8 border border-slate-800 relative group overflow-hidden rounded-none shadow-xl text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#CE1126]/5 rounded-none -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700 pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-[#CE1126]">
                <FaShieldAlt size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Agrément ARCA</span>
              </div>
              <p className="text-xs text-[#94a3b8] font-semibold leading-relaxed">
                Toutes nos opérations sont certifiées conformes au Code des Assurances en vigueur en République Démocratique du Congo.
              </p>
            </div>
          </div>
        </div>

        {/* Barre de Copyright Finale (Style Minimaliste) */}
        <div className="pt-8 md:pt-12 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">
              © {currentYear} ESNAs | Fintech & Micro-Assurances
            </p>
            <p className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">
              L'inclusion financière au service du peuple congolais.
            </p>
          </div>

          {/* Liens légaux et bouton de retour haut carré */}
          <div className="flex items-center gap-6 text-[10px] uppercase tracking-wider font-black text-slate-400">
            <Link to="/services" className="hover:text-[#CE1126] transition-colors">Légal</Link>
            <Link to="/partenaires-garanties" className="hover:text-[#CE1126] transition-colors">Garanties</Link>
            <button 
              onClick={scrollToTop}
              className="w-10 h-10 bg-[#111827] border border-slate-800 text-white flex items-center justify-center hover:bg-[#CE1126] hover:border-[#CE1126] transition-all shadow-md active:scale-95 rounded-none"
              aria-label="Retour en haut"
            >
              <FaArrowUp size={12} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
