import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FaCalculator, FaBriefcaseMedical, FaHome, FaReceipt, FaCog,
  FaHeartbeat, FaCar, FaGraduationCap, FaPlaneDeparture, FaBuilding, FaUsers, FaHardHat, FaArrowRight, FaFacebook,
  FaLinkedin
} from 'react-icons/fa';
import { FaWhatsapp } from 'react-icons/fa';

// Base de données de recherche instantanée (Contrats, Packs & Services ESNAS RDC)
const SEARCHABLE_CATALOG = [
  { id: 'p-1', type: 'Pack Santé', title: 'Pack Santé Maman & Famille (Tiers-Payant)', category: 'Santé', price: '45 $ / mois', path: '/packs-micro', icon: FaHeartbeat, color: 'text-[#CE1126]' },
  { id: 'p-2', type: 'Pack Santé', title: 'Consultation & Pharmacie Express Kinshasa', category: 'Santé', price: '20 $ / mois', path: '/packs-micro', icon: FaHeartbeat, color: 'text-[#CE1126]' },
  { id: 'p-3', type: 'Contrat Auto', title: 'Assurance Auto Obligatoire RC ARCA', category: 'Automobile', price: '29 $ / mois', path: '/packs-micro', icon: FaCar, color: 'text-[#FDD100]' },
  { id: 'p-4', type: 'Contrat Auto', title: 'Auto Tous Risques & Dépannage 24/7', category: 'Automobile', price: '65 $ / mois', path: '/packs-micro', icon: FaCar, color: 'text-[#FDD100]' },
  { id: 'p-5', type: 'Pack Scolaire', title: 'Student Protect RDC (Scolarité & Trajet)', category: 'Scolaire', price: '15 $ / mois', path: '/packs-micro', icon: FaGraduationCap, color: 'text-[#00A3E0]' },
  { id: 'p-6', type: 'Pack Voyage', title: 'Assistance Voyage & Diaspora Congo (30j)', category: 'Voyage', price: '55 $ / séjour', path: '/packs-micro', icon: FaPlaneDeparture, color: 'text-purple-400' },
  { id: 'p-7', type: 'Contrat Habitation', title: 'Multirisque Habitation & Incendie RDC', category: 'Habitation', price: '35 $ / mois', path: '/packs-micro', icon: FaBuilding, color: 'text-amber-400' },
  { id: 'p-8', type: 'Entreprise', title: 'Assurance Santé Collective & Mutuelle PME', category: 'Assurances Collectives', price: 'Sur devis', path: '/packs-micro', icon: FaUsers, color: 'text-cyan-400' },
  { id: 'p-9', type: 'Prévoyance Pro', title: 'Accidents du Travail & Prévoyance (Complément CNSS)', category: 'Accidents Travail & Prévoyance', price: 'Sur devis', path: '/prevoyance-entreprise', icon: FaHardHat, color: 'text-emerald-400' },
  { id: 's-1', type: 'Service Digital', title: 'Simulateur de Devis Instantané RDC', category: 'Outil', price: 'Gratuit', path: '/simulateur', icon: FaCalculator, color: 'text-[#00A3E0]' },
  { id: 's-2', type: 'Service Digital', title: 'Déclarer un Sinistre en Ligne (24h-48h)', category: 'Sinistre', price: 'Prise en charge', path: '/declaration-sinistre', icon: FaFileContract, color: 'text-[#CE1126]' },
  { id: 's-3', type: 'Espace Médical', title: 'Vérification de Police Hôpital / Tiers-Payant', category: 'Hôpital', price: 'Contrôle QR', path: '/verification-hopital', icon: FaShieldAlt, color: 'text-emerald-400' },
  { id: 's-4', type: 'Réseau National', title: 'Cliniques & Garages Agréés ARCA en RDC', category: 'Partenaires', price: 'Kinshasa / Lubumbashi / Goma', path: '/reseau-soins', icon: FaBriefcaseMedical, color: 'text-[#00A3E0]' }
];


  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchOpen(true);
      return;
    }

    const firstMatch = searchCatalogItems.find(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.cat.toLowerCase().includes(q)
    );

    // Ferme le clavier mobile proprement
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setSearchOpen(false);
    setSearchQuery("");
    navigate(firstMatch ? firstMatch.path : `/packs-micro?q=${encodeURIComponent(q)}`);
  };

export default function NavbarSecured() {
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const modalInputRef = useRef(null);
  
  // États d'affichage de l'interface
  const [isOpen, setIsOpen] = useState(false); // Menu mobile plein écran
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Le modal plein écran s'ouvre soit au clic, soit dès qu'une lettre est saisie
  const isSearchModalVisible = searchOpen || searchQuery.trim().length > 0;

  // Écouteur de défilement pour affiner la hauteur de la navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
  const isFullscreenActive = isOpen || searchOpen || searchQuery.trim().length > 0;
  document.body.classList.toggle('hide-mobile-nav', isFullscreenActive);
  return () => document.body.classList.remove('hide-mobile-nav');
}, [isOpen, searchOpen, searchQuery]);

  // Focus automatique dans l'input du modal dès son ouverture
  useEffect(() => {
    if (isSearchModalVisible && modalInputRef.current) {
      setTimeout(() => modalInputRef.current?.focus(), 60);
    }
  }, [isSearchModalVisible]);

  // Fermeture avec la touche Échap
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setIsOpen(false);
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Fermeture automatique du menu utilisateur au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
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

  // Verrouillage du scroll du body quand le menu mobile ou le modal de recherche est ouvert
  useEffect(() => {
    if (isOpen || isSearchModalVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isSearchModalVisible]);

  const handleNavClick = (href, e) => {
    if (e) e.preventDefault();
    setIsOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
    setUserMenuOpen(false);
    if (audioService?.playNavigate) audioService.playNavigate();
    navigate(href);
  };

  const handleCloseSearchModal = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  // Filtrage instantané des contrats et packs dès la première lettre
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SEARCHABLE_CATALOG;
    return SEARCHABLE_CATALOG.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
    );
  }, [searchQuery]);

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

  // Liens pour le menu mobile plein écran
  const mobileLinks = [
    { href: '/', label: 'Accueil', icon: <FaHome className="text-[#00A3E0]" /> },
    { href: '/packs-micro', label: 'Packs Micro-Assurance', icon: <FaShieldAlt className="text-[#CE1126]" /> },
    { href: '/simulateur', label: 'Simulateur Devis', icon: <FaCalculator className="text-[#FDD100]" /> },
    { href: '/reseau-soins', label: 'Réseau de Soins Agréé', icon: <FaBriefcaseMedical className="text-emerald-400" /> },
    { href: '/verification-hopital', label: 'Vérification Hôpital', icon: <FaShieldAlt className="text-cyan-400" /> },
    { href: '/declaration-sinistre', label: 'Déclarer un Sinistre', icon: <FaFileContract className="text-[#CE1126]" /> },
  ];

  if (isAuthenticated) {
    mobileLinks.push({ href: '/dashboard', label: 'Mon Espace Privé', icon: <FaUserShield className="text-emerald-400" /> });
  }

    const navCategories = [
    {
      id: "offres",
      label: "Assurances",
      items: [
        { href: '/', label: 'Accueil', icon: <FaHome /> },
        { href: '/simulateur', label: 'Simulateur Devis', icon: <FaCalculator /> },
        { href: '/packs-micro', label: 'Packs Micro-Assurance', icon: <FaShieldAlt /> }
      ]
    },
    {
      id: "services",
      label: "Services",
      items: [
        { href: '/verification-hopital', label: 'Vérif. Hôpital', icon: <FaShieldAlt /> },
        { href: '/declaration-sinistre', label: 'Déclarer un Sinistre', icon: <FaFileContract /> }
      ]
    }
  ];

  if (isAuthenticated) {
    navCategories[1].items.push({
      href: '/dashboard',
      label: 'Mon Espace Privé',
      icon: <FaUserShield />
    });
  }

  return (
    <div data-language-scope="navbar">
      {/* ================= 1. BARRE DE NAVIGATION SECURED (MASQUÉE SI RECHERCHE OU MENU MOBILE PLEIN ÉCRAN ACTIF) ================= */}
      <nav
        className={`navbar-main fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ease-out ${
          isSearchModalVisible || isOpen ? 'hidden' : 'block'
        } ${
          isSticky
            ? 'bg-[#090d16]/85 backdrop-blur-xl backdrop-saturate-150 border-b border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.75)]'
            : 'bg-[#090d16] backdrop-blur-none border-b border-slate-900'
        }`}
      >
        {/* Fine ligne lumineuse rouge ESNAs au scroll */}
        <div
          className={`h-[2px] w-full bg-gradient-to-r from-transparent via-[#CE1126] to-transparent transition-opacity duration-300 ${
            isSticky ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div
            className={`flex items-center justify-between gap-2.5 sm:gap-4 relative w-full transition-all duration-300 ${
              isSticky ? 'h-14' : 'h-15 sm:h-16'
            }`}
          >
          {/* Gauche : Bouton Menu Mobile + Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="navbar-menu-toggle p-2 bg-[#111827] border border-slate-800 text-white hover:border-[#CE1126] hover:text-[#CE1126] transition-all focus:outline-none rounded-none lg:hidden cursor-pointer"
              aria-label="Ouvrir le menu"
            >
              <FaBars size={16} />
            </button>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 cursor-pointer shrink-0 group select-none"
              onClick={(e) => handleNavClick('/', e)}
            >
              <div className="flex items-baseline font-black tracking-tight text-lg md:text-xl text-white uppercase">
                ESNA
                <span className="text-[#CE1126] lowercase font-extrabold -ml-[1px] transition-transform duration-300 group-hover:scale-110">
                  s
                </span>
              </div>
              <span className="px-1.5 py-0.5 bg-[#CE1126]/15 border border-[#CE1126]/40 text-[#CE1126] text-[9px] font-black uppercase tracking-widest">
                RDC
              </span>
            </motion.div>
          </div>

          {/* Centre : Barre de Recherche Instantanée (Sans catégories sur la navbar) */}
          <div className="flex-1 max-w-xl mx-auto px-1 sm:px-3">
            <div
              onClick={() => setSearchOpen(true)}
              className="relative flex items-center w-full bg-[#111827] border border-slate-800 hover:border-[#CE1126]/70 focus-within:border-[#CE1126] transition-colors cursor-text"
            >
              <FaSearch className="ml-3 text-slate-400 text-xs shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!searchOpen) setSearchOpen(true);
                }}
                placeholder="Rechercher un contrat, pack santé, auto, scolaire..."
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm font-semibold text-white placeholder-slate-500 outline-none"
              />
              <span className="hidden sm:inline-block mr-2 px-2 py-0.5 bg-[#090d16] border border-slate-800 text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                Rechercher
              </span>
            </div>
          </div>

          {/* Droite : Actions rapides & Profil Utilisateur */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => handleNavClick('/simulateur', e)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 bg-[#111827] hover:bg-slate-800 border border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-200 transition-colors cursor-pointer"
            >
              <FaCalculator className="text-[#00A3E0]" />
              <span>Devis</span>
            </button>

            {isAuthenticated ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-[#111827] hover:bg-slate-800 border border-slate-800 text-white transition-colors cursor-pointer"
                >
                  <span className="w-6 h-6 bg-[#CE1126] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    {initials}
                  </span>
                  <div className="hidden sm:block text-left leading-tight">
                    <span className="block text-[11px] font-black truncate max-w-[110px]">
                      {displayName}
                    </span>
                    <span className="block text-[9px] text-slate-400">
                      {roleLabel}
                    </span>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#111827] border border-slate-800 shadow-2xl z-50 py-1">
                    <div className="px-3 py-2 border-b border-slate-800 sm:hidden">
                      <p className="text-xs font-black text-white truncate">{displayName}</p>
                      <p className="text-[10px] text-slate-400">{roleLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleNavClick(isStaff ? '/admin' : '/dashboard', e)}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-200 hover:bg-[#CE1126] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FaUserShield /> Mon Espace
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleNavClick('/mes-contrats', e)}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-200 hover:bg-[#CE1126] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FaReceipt /> Mes Contrats
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleNavClick('/parametres', e)}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-200 hover:bg-[#CE1126] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FaCog /> Paramètres
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => handleNavClick('/login', e)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#CE1126] hover:bg-[#a80d1e] text-white text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                <FaUserCircle size={13} />
                <span>Connexion</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>

    {/* ================= 2. MODAL DE RECHERCHE PLEIN ÉCRAN (DESKTOP & MOBILE) ================= */}
    {typeof document !== 'undefined' &&
      createPortal(
        <AnimatePresence>
          {(searchOpen || searchQuery.trim().length > 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999] bg-[#090d16] text-white flex flex-col h-screen w-screen overflow-hidden"
            >
              {/* Barre supérieure du Modal de Recherche */}
              <div className="border-b border-slate-800 bg-[#050811] px-3 sm:px-6 py-3 shrink-0">
                <div className="max-w-5xl mx-auto flex items-center gap-2 sm:gap-3">
                  <div className="flex-1 flex items-center bg-[#111827] border border-[#CE1126] px-3">
                    <FaSearch className="text-[#CE1126] text-sm shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tapez une lettre ou un mot (ex: Santé, Auto, Maman, Scolaire, Sinistre)..."
                      className="w-full bg-transparent px-3 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white placeholder-slate-500 outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="px-2.5 text-slate-400 hover:text-white text-xs font-bold uppercase cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="px-3.5 py-2.5 sm:py-3 bg-[#111827] hover:bg-[#CE1126] border border-slate-800 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <FaTimes size={14} />
                    <span className="hidden sm:inline">Fermer</span>
                  </button>
                </div>
              </div>

              {/* Zone des résultats instantanés */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5">
                <div className="max-w-5xl mx-auto space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {searchQuery.trim()
                        ? `Résultats pour « ${searchQuery} »`
                        : "Accès rapide aux contrats & packs ESNAs"}
                    </span>
                    <span className="text-[10px] font-black uppercase text-[#00A3E0]">
                      RDC • ARCA
                    </span>
                  </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { title: "Pack Santé Maman", cat: "Santé", price: "45 $/mois", path: "/packs-micro" },
                      { title: "Auto Confort Tiers-Payant", cat: "Automobile", price: "29 $/mois", path: "/packs-micro" },
                      { title: "Student Protect RDC", cat: "Scolaire", price: "15 $/mois", path: "/packs-micro" },
                      { title: "Pack Diaspora Congo", cat: "Voyage", price: "55 $/séjour", path: "/packs-micro" },
                      { title: "Assurance Habitation & Incendie", cat: "Habitation", price: "20 $/mois", path: "/packs-micro" },
                      { title: "Assurance Santé Collective", cat: "Entreprise", price: "Sur devis", path: "/packs-micro" },
                      { title: "Accidents du Travail & Prévoyance", cat: "Prévoyance", price: "Sur devis", path: "/packs-micro" },
                      { title: "Simulateur de Devis Instantané", cat: "Outil", price: "Gratuit", path: "/simulateur" },
                      { title: "Déclarer un Sinistre 24/7", cat: "Assistance", price: "Express", path: "/declaration-sinistre" }
                    ]
                      .filter((item) => {
                        const q = searchQuery.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          item.title.toLowerCase().includes(q) ||
                          item.cat.toLowerCase().includes(q)
                        );
                      })
                      .map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            setSearchOpen(false);
                            setSearchQuery("");
                            handleNavClick(item.path, e);
                          }}
                          className="p-4 bg-[#111827] hover:bg-[#1a2234] border border-slate-800 hover:border-[#CE1126] text-left transition-all flex flex-col justify-between gap-2 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#CE1126]">
                              {item.cat}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-emerald-400">
                              {item.price}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-black text-white">
                            {item.title}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    {/* ================= 3. MENU MOBILE PLEIN ÉCRAN (MASQUE LA BARRE MOBILE) ================= */}
    {typeof document !== 'undefined' &&
      createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-0 z-[9999] bg-[#090d16] text-white flex flex-col h-screen w-screen overflow-y-auto lg:hidden"
            >
              {/* En-tête Menu Mobile */}
              <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800 shrink-0">
                <div className="flex items-baseline font-black tracking-tight text-xl text-white uppercase">
                  ESNA<span className="text-[#CE1126] lowercase font-extrabold">s</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-[#111827] border border-slate-800 text-white hover:border-[#CE1126]"
                  aria-label="Fermer le menu"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {/* Liens principaux plein écran */}
              <div className="flex-1 px-4 py-6 space-y-6">
                {navCategories.map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#CE1126]">
                      {cat.label}
                    </p>
                    <div className="space-y-1.5">
                      {cat.items.map((item) => (
                        <button
                          key={item.href}
                          type="button"
                          onClick={(e) => handleNavClick(item.href, e)}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-[#111827] border border-slate-800 text-sm font-bold text-white hover:border-[#CE1126] text-left"
                        >
                          <span className="text-[#CE1126]">{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={(e) => handleNavClick('/packs-micro', e)}
                  className="w-full py-3.5 px-4 bg-[#CE1126] text-white font-black text-xs uppercase tracking-widest text-center"
                >
                  Voir tous les Packs Micro-Assurance
                </button>
              </div>

              {/* Pied du Menu Mobile */}
              <div className="p-4 border-t border-slate-800 bg-[#050811] flex items-center justify-between text-slate-400 text-xs">
                <span>© ESNAs RDC • Agréé ARCA</span>
                <div className="flex items-center gap-3 text-base">
                  <FaWhatsapp className="text-emerald-400" />
                  <FaFacebook />
                  <FaLinkedin />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}


