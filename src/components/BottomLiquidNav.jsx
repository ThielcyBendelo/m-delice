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
      location.pathname === '/register' ||
      location.pathname === '/work'
    ) {
      return null;
    }

    return (
    <AnimatePresence>
      {!isNavbarOpen && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed bottom-0 inset-x-0 z-50 w-full lg:hidden"
        >
          <nav
            aria-label="Navigation rapide"
            className="relative flex items-stretch justify-between w-full rounded-none
                       bg-[#090d16]/90 backdrop-blur-2xl backdrop-saturate-150
                       border-t border-white/15
                       shadow-[0_-10px_30px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.18)]
                       pb-[env(safe-area-inset-bottom)]"
          >
            {/* Ligne lumineuse supérieure pleine largeur */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"
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
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`relative flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-none transition-colors duration-200 focus:outline-none group ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {/* Fond actif rectangulaire avec indicateur supérieur rouge */}
                  {isActive && (
                    <motion.div
                      layoutId="liquidGlassActiveRect"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-none bg-gradient-to-b from-[#CE1126] to-[#8f0a19]
                                 border-t-2 border-white
                                 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]"
                    />
                  )}

                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <Icon
                      size={16}
                      className={`transition-transform duration-200 ${
                        isActive
                          ? 'text-white scale-110'
                          : 'text-slate-400 group-hover:scale-105 group-hover:text-white'
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
