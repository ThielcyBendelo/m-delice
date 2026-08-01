import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Services
import notificationService from '../services/notificationService';
import audioService from '../services/audioService';
import authService from '../services/authService';

// Icônes épurées adaptées à la Fintech et l'Assurance
import { 
  FaBars, FaTimes, FaShieldAlt, FaFileContract, 
  FaSearch, FaUserShield, FaUserCircle,
  FaCalculator, FaBriefcaseMedical, FaBalanceScale, FaHome
} from 'react-icons/fa';

export default function NavbarSecured() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  
  // États d'affichage de l'interface au clic
  const [isOpen, setIsOpen] = useState(false); // Menu mobile open/close
  const [activeCategory, setActiveCategory] = useState(null); // Sous-menu desktop actif
  const [activeMobileCategory, setActiveMobileCategory] = useState(null); // Sous-menu mobile actif
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSticky, setIsSticky] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Fermeture automatique des menus si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveCategory(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Synchronisation de la session d'authentification
  useEffect(() => {
    authService.initialize().then(() => {
      setIsAuthenticated(authService.isLoggedIn());
      setCurrentUser(authService.getCurrentUser());
    });

    const interval = setInterval(() => {
      setIsAuthenticated(authService.isLoggedIn());
      setCurrentUser(authService.getCurrentUser());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleNavClick = (href, e) => {
    e.preventDefault();
    setIsOpen(false);
    setActiveCategory(null);
    setActiveMobileCategory(null);
    if (audioService?.playNavigate) audioService.playNavigate();
    navigate(href);
  };

  // Bascule des états au clic (Ferme l'autre si ouverte)
  const toggleCategory = (catId) => {
    setActiveCategory(activeCategory === catId ? null : catId);
  };

  const toggleCategoryMobile = (catId) => {
    setActiveMobileCategory(activeMobileCategory === catId ? null : catId);
  };

  // 🟢 CORRIGÉ : Seulement 2 catégories stratégiques à forte conversion
  const navCategories = [
    {
      id: "offres",
      label: "Assurances",
      items: [
        { href: '/', label: 'Home', icon: <FaHome /> },
        { href: '/formules', label: 'Nos Formules', icon: <FaShieldAlt /> },
        { href: '/simulateur', label: 'Simulateur Devis', icon: <FaCalculator /> }
      ]
    },
    {
      id: "services",
      label: "Services",
      items: [
        { href: '/reseau-soins', label: 'Réseau de Soins', icon: <FaBriefcaseMedical /> },
        { href: '/declaration-sinistre', label: 'Déclarer un Sinistre', icon: <FaFileContract /> },
        { href: '/conformite-arca', label: 'Régulation ARCA', icon: <FaBalanceScale /> }
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
      
     
    return (
    <>
      {/* 🟢 BARRE DE NAVIGATION : Hauteur affinée py-2.5 / Fond Blanc pur et floutage premium */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b border-slate-100 bg-white/95 backdrop-blur-md ${
        isSticky ? 'py-1.5 shadow-sm' : 'py-2.5'
      }`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between h-12 items-center">

{/* LOGO FINTECH ULTRA-COMPACT TYPOGRAPHIQUE */}
<motion.div 
  whileHover={{ scale: 1.02 }} 
  className="flex items-center gap-3 cursor-pointer shrink-0 group select-none" 
  onClick={(e) => handleNavClick('/', e)}
>
  {/* Nom de la Marque "ESNAs" : Typographie rectiligne et contrastée */}
  <div className="flex items-baseline font-black tracking-tight text-xl md:text-2xl text-slate-900 uppercase">
    ESNA
    <span className="text-[#CE1126] lowercase font-extrabold -ml-[1px]">s</span>
  </div>

  {/* Tag de Certification Technique : Carré, minimaliste et percutant */}
  <div className="flex flex-col justify-center border-l-2 border-slate-900 pl-3 py-0.5">
    <span className="text-[8px] uppercase tracking-[0.25em] text-[#CE1126] font-black leading-none mb-0.5">
      Agrément
    </span>
    <span className="text-[9px] uppercase tracking-[0.15em] text-slate-900 font-black leading-none">
      ARCA
    </span>
  </div>
</motion.div>


            {/* ================= NAVIGATION DESKTOP : ACTIONS AU CLIC ================= */}
            <div className="hidden lg:flex items-center gap-8">
              {navCategories.map((category) => (
                <div key={category.id} className="relative py-2">
                  <button 
                    onClick={() => toggleCategory(category.id)}
                    className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest transition-colors ${
                      activeCategory === category.id ? 'text-red-600' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {category.label}
                    <motion.span 
                      animate={{ rotate: activeCategory === category.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[9px] opacity-60"
                    >
                      ▼
                    </motion.span>
                  </button>

                  {/* Menu déroulant au clic : Animation cinétique amortie */}
                  <AnimatePresence>
                    {activeCategory === category.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white border border-slate-100 rounded-none shadow-2xl p-2 space-y-0.5 z-50"
                      >
                        {category.items.map((item) => (
                          <button 
                            key={item.href} 
                            onClick={(e) => handleNavClick(item.href, e)} 
                            className="w-full px-3 py-2 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-red-600 hover:bg-slate-50 transition-all text-left rounded-none"
                          >
                            <span className="text-red-600 text-xs">{item.icon}</span>
                            {item.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* ACTION TRANSACTIONNELLE : RECHERCHE FINTECH */}
              <div className="flex items-center gap-2 ml-2 border-l border-slate-200 pl-4">
                <div className="relative flex items-center">
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
                        className="bg-slate-50 text-[11px] font-bold px-3 py-1.5 border border-slate-200 focus:outline-none focus:border-red-600 text-slate-900 mr-2 rounded-none"
                      />
                    )}
                  </AnimatePresence>
                  
                  <button 
                    onClick={() => setSearchOpen(!searchOpen)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <FaSearch size={12} />
                  </button>
                </div>

                {/* BOUTON D'CONNEXION FINTECH : Angles droits, Rouge et Noir */}
                {isAuthenticated ? (
                  <button 
                    onClick={(e) => handleNavClick('/dashboard', e)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <FaUserCircle size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={(e) => handleNavClick('/login', e)}
                    className="ml-2 px-5 py-2 bg-slate-950 text-white font-black uppercase text-[9px] tracking-widest hover:bg-red-600 transition-colors rounded-none"
                  >
                    Connexion
                  </button>
                )}
              </div>
            </div>

            {/* COMMUTATEUR DU MENU MOBILE */}
            <div className="flex lg:hidden items-center">
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-2 text-slate-900 hover:text-[#CE1126] transition-colors focus:outline-none rounded-none"
                aria-label="Menu"
              >
                {isOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
              </button>
            </div>

          </div> {/* Ré-ajoute la fermeture du conteneur Flex de la Navbar */}
        </div> {/* Ré-ajoute la fermeture du conteneur de centrage (max-w-7xl...) */}

        {/* ================= INTERFACE DU MENU MOBILE PLEIN ÉCRAN ================= */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-50 lg:hidden bg-slate-950 text-white flex flex-col h-screen w-screen rounded-none overflow-y-auto"
            >
              {/* En-tête interne du menu plein écran pour la fermeture */}
              <div className="flex items-center justify-between px-6 h-20 border-b border-slate-800">
                <div className="flex items-baseline font-black tracking-tight text-xl uppercase select-none">
                  ESNA
                  <span className="text-[#CE1126] lowercase font-extrabold -ml-[1px]">s</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-2 text-white hover:text-[#CE1126] transition-colors rounded-none"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              {/* Zone des Liens de Navigation */}
              <div className="flex-grow px-6 py-8 space-y-6">
                {navCategories.map((category) => (
                  <div key={category.id} className="space-y-2 border-b border-slate-900 pb-4 last:border-none">
                    {/* Bouton de Catégorie principal */}
                    <button
                      onClick={() => toggleCategoryMobile(category.id)}
                      className="w-full py-2 flex justify-between items-center text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 text-left rounded-none hover:text-white transition-colors"
                    >
                      <span>{category.label}</span>
                      <motion.span 
                        animate={{ rotate: activeMobileCategory === category.id ? 180 : 0 }}
                        className="text-[10px] text-[#CE1126]"
                      >
                        ▼
                      </motion.span>
                    </button>

                    {/* Sous-liens de la Catégorie */}
                    <AnimatePresence initial={false}>
                      {activeMobileCategory === category.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="pl-2 space-y-1 overflow-hidden"
                        >
                          {category.items.map((item) => (
                            <button
                              key={item.href}
                              onClick={(e) => {
                                handleNavClick(item.href, e);
                                setIsOpen(false);
                              }}
                              className="w-full px-4 py-3 flex items-center gap-4 text-xs font-extrabold text-slate-200 hover:bg-[#CE1126] hover:text-white text-left uppercase tracking-widest rounded-none border-l-2 border-transparent hover:border-white transition-all duration-200"
                            >
                              <span className="text-[#CE1126] transition-colors">{item.icon}</span>
                              {item.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* Bouton de Connexion inséré au bas du défilement */}
                {!isAuthenticated && (
                  <div className="pt-4">
                    <button
                      onClick={(e) => {
                        handleNavClick('/login', e);
                        setIsOpen(false);
                      }}
                      className="w-full py-4 bg-red-600 text-white font-black uppercase text-[11px] tracking-widest text-center shadow-md rounded-none hover:bg-red-700 transition-colors"
                    >
                      Espace Connexion
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </nav>
    </>
  );
}

