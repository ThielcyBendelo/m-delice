import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfessionalSplashScreen({ onComplete }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Durée d'affichage du logo (3.5 secondes) avant redirection fluide
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => onComplete && onComplete(), 850);
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          key="splash" 
          initial={{ opacity: 1 }} 
          exit={{ opacity: 0, filter: "blur(12px)" }} 
          transition={{ duration: 0.8, ease: "easeInOut" }} 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#090d16] overflow-hidden select-none"
          /* 🟢 Remplacement du fond blanc par le Noir Fintech Onyx */
        >
          {/* Logo signature ESNAs central épuré, moderne et professionnel en version Blanche */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex items-baseline font-black tracking-tight text-4xl sm:text-6xl text-white uppercase relative z-10"
            /* 🟢 Le texte "ESNA" passe en blanc pur pour ressortir sur le fond sombre */
          >
            ESNA
            <span className="text-[#CE1126] lowercase font-extrabold -ml-[1px]">s</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
