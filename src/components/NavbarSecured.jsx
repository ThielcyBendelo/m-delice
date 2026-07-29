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
            
            {/* LOGO FINTECH ULTRA-COMPACT */}
            <motion.div 
              whileHover={{ scale: 1.01 }} 
              className="flex items-center gap-2 cursor-pointer shrink-0" 
              onClick={(e) => handleNavClick('/', e)}
            >
              <img 
                src="/images/logo.png" 
                alt="DRC Assurances" 
                className="h-7 w-auto object-contain"
              />
              <div className="hidden sm:flex flex-col justify-center border-l border-slate-200 pl-2">
                <span className="text-[7.5px] uppercase tracking-[2px] text-red-600 font-black">
                  Agrément ARCA
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
                className="p-1.5 text-slate-800 hover:text-red-600"
              >
                {isOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
              </button>
            </div>

          </div>
        </div>

        {/* ================= INTERFACE DU MENU MOBILE DROULANT ================= */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="lg:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-4 shadow-inner overflow-hidden"
            >
              {navCategories.map((category) => (
                <div key={category.id} className="space-y-1">
                  <button
                    onClick={() => toggleCategoryMobile(category.id)}
                    className="w-full py-2 flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-400 text-left rounded-none"
                  >
                    <span>{category.label}</span>
                    <motion.span animate={{ rotate: activeMobileCategory === category.id ? 180 : 0 }}>▼</motion.span>
                  </button>

                  <AnimatePresence>
                    {activeMobileCategory === category.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pl-2 space-y-1 overflow-hidden"
                      >
                        {category.items.map((item) => (
                          <button
                            key={item.href}
                            onClick={(e) => handleNavClick(item.href, e)}
                            className="w-full px-3 py-2.5 flex items-center gap-3 text-xs font-bold text-slate-700 hover:bg-slate-50 text-left uppercase tracking-wider rounded-none"
                          >
                            <span className="text-red-600">{item.icon}</span>
                            {item.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              
              {!isAuthenticated && (
                <button
                  onClick={(e) => handleNavClick('/login', e)}
                  className="w-full py-3 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest text-center shadow-md rounded-none"
                >
                  Espace Connexion
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
