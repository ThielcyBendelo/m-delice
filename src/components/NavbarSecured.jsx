import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
// Services
import audioService from '../services/audioService';
import authService from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext.jsx';

// Icônes épurées adaptées à la Fintech et l'Assurance
import { 
  FaBars, FaTimes, FaShieldAlt, FaFileContract, 
  FaSearch, FaUserShield, FaUserCircle,
  FaCalculator, FaBriefcaseMedical, FaBalanceScale, FaHome, FaReceipt, FaCog
} from 'react-icons/fa';
import { FaGlobe, FaCircle, FaInstagram, FaFacebook, FaLinkedin, FaWhatsapp } from 'react-icons/fa';

export default function NavbarSecured() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);
  
  // États d'affichage de l'interface au clic
  const [isOpen, setIsOpen] = useState(false); // Menu mobile open/close
  const [activeCategory, setActiveCategory] = useState(null); // Sous-menu desktop actif
  const [activeMobileCategory, setActiveMobileCategory] = useState(null); // Sous-menu mobile actif
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Écouteur de défilement pour affiner la hauteur de la navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setActiveCategory(null);
        setActiveMobileCategory(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Fermeture automatique des menus si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveCategory(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Synchronisation de la session d'authentification
  useEffect(() => {
    authService.initialize().then(() => {
      setIsAuthenticated(authService.isLoggedIn());
    });

    const interval = setInterval(() => {
      setIsAuthenticated(authService.isLoggedIn());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleNavClick = (href, e) => {
    e.preventDefault();
    setIsOpen(false);
    setActiveCategory(null);
    setActiveMobileCategory(null);
    setUserMenuOpen(false);
    if (audioService?.playNavigate) audioService.playNavigate();
    navigate(href);
  };

  // Bascule des états au clic (Ferme l'autre si ouverte)
  const toggleCategory = (catId) => {
    setActiveCategory(activeCategory === catId ? null : catId);
  };


  const currentUser = authService.getCurrentUser() || {};
  const displayName = currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Utilisateur';
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
  const normalizedRole = String(currentUser.role || '').toLowerCase();
  const isStaff = ['admin', 'agent', 'finance', 'claims_manager'].includes(normalizedRole);
  const roleLabel = {
    admin: 'Administrateur',
    agent: 'Agent',
    finance: 'Finance',
    claims_manager: 'Gestionnaire sinistres',
    diaspora: 'Client diaspora',
    client: 'Client assuré',
  }[normalizedRole] || 'Utilisateur assuré';

  // 🟢 CORRIGÉ : Seulement 2 catégories stratégiques à forte conversion
  const navCategories = [
    {
      id: "offres",
      label: "Assurances",
      items: [
        { href: '/', label: 'Home', icon: <FaHome /> },
        // { href: '/formules', label: 'Nos Formules', icon: <FaShieldAlt /> },
        { href: '/simulateur', label: 'Simulateur Devis', icon: <FaCalculator /> }
      ]
    },
    {
      id: "services",
      label: "Services",
      items: [
        // { href: '/reseau-soins', label: 'Réseau de Soins', icon: <FaBriefcaseMedical /> },
        { href: '/verification-hopital', label: 'Vérif. Hôpital', icon: <FaShieldAlt /> },
        { href: '/declaration-sinistre', label: 'Déclarer un Sinistre', icon: <FaFileContract /> },
        // { href: '/conformite-arca', label: 'Régulation ARCA', icon: <FaBalanceScale /> }
      ]
    }
  ];

  if (isAuthenticated) {
    const servCat = navCategories.find(cat => cat.id === "services");
    if (servCat) {
      const hasDashboard = servCat.items.some(item => item.href === '/dashboard');
      if (!hasDashboard) {
        servCat.items.push({ href: '/dashboard', label: 'Mon Espace Privé', icon: <FaUserShield /> });
      }
    }
  }

  useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => {
    document.body.style.overflow = '';
  };
}, [isOpen]);

         
     return (
    <div data-language-scope="navbar">
      {/* ================= BARRE DE NAVIGATION SECURED (FIXED + BLUR PRO AU SCROLL) ================= */}
<nav
  className={`navbar-main fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ease-out ${
    isSticky
      ? 'bg-[#090d16]/75 backdrop-blur-xl backdrop-saturate-150 border-b border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.75)]'
      : 'bg-[#090d16] backdrop-blur-none border-b border-slate-900'
  }`}
>
  {/* Fine ligne lumineuse rouge ESNAs qui apparaît en haut lors du scroll */}
  <div
    className={`h-[2px] w-full bg-gradient-to-r from-transparent via-[#CE1126] to-transparent transition-opacity duration-300 ${
      isSticky ? 'opacity-100' : 'opacity-0'
    }`}
  />

  <div className="max-w-7xl mx-auto px-4 sm:px-6">
    <div
      className={`flex items-center gap-3 relative w-full transition-all duration-300 ${
        isSticky ? 'h-14 sm:h-16' : 'h-16 sm:h-20'
      }`}
    >
      {/* Bouton Menu Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="navbar-menu-toggle order-first p-2 bg-white/[0.03] border border-slate-800/80 text-white hover:border-[#CE1126] hover:text-[#CE1126] transition-all focus:outline-none rounded-none lg:hidden"
        aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        {isOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
      </button>

      {/* BLOC 1 : LOGO FINTECH ULTRA-COMPACT TYPOGRAPHIQUE SOMBRE */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 cursor-pointer shrink-0 group select-none"
        onClick={(e) => handleNavClick('/', e)}
      >
        <div className="flex items-baseline font-black tracking-tight text-lg md:text-xl text-white uppercase">
          ESNA
          <span className="text-[#CE1126] lowercase font-extrabold -ml-[1px] transition-transform duration-300 group-hover:scale-110">
            s
          </span>
        </div>

        <div className="hidden sm:flex flex-col justify-center border-l-2 border-[#CE1126] pl-2.5 py-0.5 transition-colors group-hover:border-white">
          <span className="text-[8px] uppercase tracking-[0.25em] text-[#CE1126] font-black leading-none mb-0.5">
            Agrément
          </span>
          <span className="text-[9px] uppercase tracking-[0.15em] text-white font-black leading-none">
            ARCA
          </span>
        </div>
      </motion.div>


            {/* BLOC 2 : NAVIGATION DESKTOP : ACTIONS AU CLIC (VERSION SOMBRE) */}
            <div className="navbar-desktop-links hidden lg:flex flex-1 items-center justify-center gap-8">
              {navCategories.map((category) => (
                <div key={category.id} className="relative py-2">
                  <button 
                    onClick={() => toggleCategory(category.id)}
                    className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none ${
                      activeCategory === category.id ? 'text-[#CE1126]' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {category.label}
                    <motion.span 
                      animate={{ rotate: activeCategory === category.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[9px] opacity-60 text-[#CE1126]"
                    >
                      ▼
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {activeCategory === category.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-[#111827] border border-slate-800 rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 space-y-0.5 z-50"
                      >
                        {category.items.map((item) => (
                          <button 
                            key={item.href} 
                            onClick={(e) => handleNavClick(item.href, e)} 
                            className="w-full px-3 py-2.5 flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-[#CE1126] transition-all duration-200 text-left rounded-none border-l-2 border-transparent hover:border-white"
                          >
                            <span className="text-[#CE1126] group-hover:text-white transition-colors text-xs">{item.icon}</span>
                            {item.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* 🟢 BLOC 3 DE REGROUPEMENT : ACTIONS ET COMMUTATEURS MOBILE SUR UNE MÊME LIGNE */}
            <div className="ml-auto flex items-center gap-3">             
              {/* ACTION TRANSACTIONNELLE : RECHERCHE & AUTH FINTECH (VERSION SOMBRE) */}
              <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                <div className="relative flex items-center max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2">
                  <AnimatePresence>
                    {searchOpen && (
                      <motion.input
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 140, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        type="text"
                        placeholder="N° DRC-..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#111827] text-[11px] font-bold px-3 py-1.5 border border-slate-800 focus:outline-none focus:border-[#CE1126] text-white mr-2 rounded-none placeholder-slate-500"
                      />
                    )}
                  </AnimatePresence>
                  
                  <button 
                    onClick={() => setSearchOpen(!searchOpen)}
                    className="navbar-icon-button p-1.5 text-slate-400 hover:text-[#CE1126] transition-colors focus:outline-none"
                  >
                    <FaSearch size={12} />
                  </button>
                </div>

                {/* BOUTON DE CONNEXION FINTECH */}
                {isAuthenticated ? (
                  <div ref={userMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen((open) => !open)}
                      aria-expanded={userMenuOpen}
                      aria-haspopup="menu"
                      aria-label={`Menu de ${displayName}`}
                      className="flex items-center gap-2 p-1 text-slate-300 hover:text-white transition-colors focus:outline-none"
                    >
                      {currentUser.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover border border-slate-700" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#CE1126] text-[10px] font-black text-white">{initials}</span>
                      )}
                      <span className="hidden xl:block max-w-28 truncate text-[10px] font-bold uppercase tracking-wider">{displayName}</span>
                    </button>
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          role="menu"
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          className="absolute right-0 top-full mt-3 w-64 border border-slate-800 bg-[#111827] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.55)] z-[60]"
                        >
                          <div className="border-b border-slate-800 px-3 py-3">
                            <p className="truncate text-xs font-black text-white">{displayName}</p>
                            <p className="mt-1 truncate text-[10px] text-slate-500">{currentUser.email || 'Compte ESNAS'}</p>
                            <p className="mt-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                              <FaCircle size={6} /> {roleLabel} {currentUser.phoneVerified === false ? '· Téléphone à vérifier' : '· Compte vérifié'}
                            </p>
                          </div>
                          <button type="button" role="menuitem" onClick={(e) => handleNavClick('/dashboard/profile', e)} className="flex w-full items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-300 hover:bg-[#CE1126] hover:text-white"><FaUserCircle /> Mon profil</button>
                          <button type="button" role="menuitem" onClick={(e) => handleNavClick('/dashboard/claims', e)} className="flex w-full items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-300 hover:bg-[#CE1126] hover:text-white"><FaFileContract /> Mes sinistres</button>
                          <button type="button" role="menuitem" onClick={(e) => handleNavClick('/dashboard/payments', e)} className="flex w-full items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-300 hover:bg-[#CE1126] hover:text-white"><FaReceipt /> Mes paiements</button>
                          <button type="button" role="menuitem" onClick={(e) => handleNavClick('/dashboard', e)} className="flex w-full items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-300 hover:bg-[#CE1126] hover:text-white"><FaUserShield /> Mon espace privé</button>
                          <button type="button" role="menuitem" onClick={(e) => handleNavClick('/declaration-sinistre', e)} className="flex w-full items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-300 hover:bg-[#CE1126] hover:text-white"><FaFileContract /> Déclarer un sinistre</button>
                          {isStaff && <button type="button" role="menuitem" onClick={(e) => handleNavClick('/dashboard/analytics', e)} className="flex w-full items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-300 hover:bg-[#CE1126] hover:text-white"><FaCog /> Administration</button>}
                          <button type="button" role="menuitem" onClick={() => { setUserMenuOpen(false); authService.logout(); }} className="mt-1 flex w-full items-center gap-3 border-t border-slate-800 px-3 py-3 text-left text-[10px] font-black uppercase tracking-wider text-[#CE1126] hover:bg-red-950/40">Déconnexion</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => handleNavClick('/login', e)}
                    className="ml-1 px-4 py-1.5 bg-white text-black font-black uppercase text-[9px] tracking-widest hover:bg-[#CE1126] hover:text-white transition-all duration-200 rounded-none shadow-md"
                  >
                    Connexion
                  </button>
                )}
              </div>
            </div> {/* Fin du bloc regroupement droite */}
          </div>
        </div>

        {/* ================= INTERFACE DU MENU MOBILE LATÉRAL FIXE (VERSION SOMBRE ONYX) ================= */}
        {typeof document !== 'undefined' &&
  createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 1. Fond d'atténuation (Overlay) verrouillé sur tout l'écran */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[9998] bg-black/75 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />

         {/* 2. Menu mobile latéral fixe : Fond Rouge ESNAs, Noir & Blanc sans filtre catégorie */}
<motion.aside
  initial={{ x: '100%' }}
  animate={{ x: 0 }}
  exit={{ x: '100%' }}
  transition={{ type: 'spring', damping: 28, stiffness: 240 }}
  className="navbar-mobile-menu fixed top-0 right-0 bottom-0 z-[9999] lg:hidden bg-[#CE1126] text-white flex flex-col h-[100dvh] w-[85%] max-w-[360px] rounded-none border-l-2 border-black shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden"
>
  {/* En-tête fixe Noir Profond */}
  <div className="flex items-center justify-between px-6 h-20 border-b border-black/30 bg-[#090d16] shrink-0">
    <div className="flex items-baseline font-black tracking-tight text-xl uppercase select-none text-white">
      ESNA
      <span className="text-[#CE1126] lowercase font-extrabold -ml-[1px]">s</span>
    </div>
    <button
      onClick={() => setIsOpen(false)}
      aria-label="Fermer le menu"
      className="navbar-menu-toggle w-10 h-10 flex items-center justify-center bg-white text-black hover:bg-[#CE1126] hover:text-white transition-colors rounded-none focus:outline-none"
    >
      <FaTimes size={18} />
    </button>
  </div>

  {/* Liste directe et fluide de tous les liens (sans filtre catégorie) */}
  <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 space-y-2.5 bg-[#CE1126]">
    {navCategories
      .flatMap((category) => category.items)
      .map((item) => (
        <button
          key={item.href}
          onClick={(e) => {
            handleNavClick(item.href, e);
            setIsOpen(false);
          }}
          className="group w-full px-4 py-3.5 flex items-center gap-4 bg-white text-black hover:bg-[#090d16] hover:text-white text-left text-xs font-black uppercase tracking-widest rounded-none border-l-4 border-l-[#090d16] hover:border-l-white shadow-md transition-all duration-200 active:scale-[0.98] focus:outline-none"
        >
          <span className="w-8 h-8 shrink-0 flex items-center justify-center bg-[#090d16] text-white group-hover:bg-[#CE1126] group-hover:text-white transition-colors">
            {item.icon}
          </span>
          <span className="truncate">{item.label}</span>
        </button>
      ))}

    {/* Bouton de Connexion / Diaspora en bas du défilement */}
    {!isAuthenticated && (
      <div className="pt-4">
        <button
          onClick={(e) => {
            handleNavClick('/login', e);
            setIsOpen(false);
          }}
          className="w-full py-4 bg-[#090d16] text-white border-2 border-black hover:bg-white hover:text-black font-black uppercase text-[11px] tracking-widest text-center shadow-xl rounded-none transition-colors focus:outline-none"
        >
          Créer un compte Diaspora
        </button>
      </div>
    )}
  </div>
            

            {/* Pied fixe minimaliste ESNAs */}
            <div className="px-6 py-4 border-t border-slate-900 bg-[#111827] shrink-0 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Écosystème Numérique des Assurances
              </span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  )}
        </nav>
      </div>
  
  );
}
