import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, 
  FaCalculator, 
  FaExclamationTriangle, 
  FaUserShield 
} from 'react-icons/fa';
import { useNavigation } from '../contexts/NavigationContext';

const NAV_ITEMS = [
  { id: 'home', label: 'Accueil', path: '/', icon: FaHome },
  { id: 'simulateur', label: 'Devis', path: '/simulateur', icon: FaCalculator },
  { id: 'sinistre', label: 'Sinistre', path: '/declaration-sinistre', icon: FaExclamationTriangle },
  { id: 'login', label: 'Connexion', path: '/login', icon: FaUserShield },
];

const BottomLiquidNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isNavbarOpen } = useNavigation();

  // Masquer la barre sur l'espace Admin
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/regions')) {
    return null;
  }
  
    // Masquer si le menu mobile est ouvert, ou sur le dashboard / pages d'authentification
    if (
      location.pathname.startsWith('/dashboard') ||
      location.pathname === '/login' ||
      location.pathname === '/register'
    ) {
      return null;
    }

  return (
    <AnimatePresence>
      {!isNavbarOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed bottom-4 inset-x-0 z-40 px-4 flex justify-center pointer-events-none lg:hidden"
        >
          <nav
            aria-label="Navigation rapide"
            className="pointer-events-auto relative flex items-center justify-between gap-1 sm:gap-2 px-2.5 py-1 rounded-full 
                       bg-[#090d16]/70 backdrop-blur-2xl backdrop-saturate-150
                       border border-white/15 
                       shadow-[0_20px_40px_rgba(0,0,0,0.75),inset_0_1px_1px_rgba(255,255,255,0.28),inset_0_-1px_2px_rgba(0,0,0,0.5)]
                       max-w-md w-full overflow-hidden"
          >
            {/* Reflet lumineux supérieur (Effet Liquid Glass) */}
            <div 
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent"
            />

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-colors duration-200 focus:outline-none group ${
                    isActive ? 'text-white' : 'text-slate-300/80 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="liquidGlassActivePill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-gradient-to-b from-[#CE1126] to-[#990b1b] 
                                 border border-white/25
                                 shadow-[0_4px_15px_rgba(206,17,38,0.55),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                    />
                  )}

                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <Icon
                      size={15}
                      className={`transition-transform duration-200 ${
                        isActive ? 'text-white scale-110' : 'text-slate-300 group-hover:scale-105 group-hover:text-white'
                      }`}
                    />
                    <span className="text-[9.5px] font-black uppercase tracking-wider leading-none">
                      {item.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BottomLiquidNav;
