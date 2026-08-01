import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Importation native de votre arrière-plan professionnel
import background2 from '../assets/background_drc.jpeg';

export default function ProfessionalSplashScreen({ onComplete }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Durée d'affichage de l'image claire (3.5 secondes) avant redirection fluide
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white overflow-hidden"
        >
          {/* 🟢 CORRIGÉ : Image 100% claire, sans filtres sombres, sans dégradés et sans mode noir & blanc */}
          <motion.div 
            initial={{ scale: 1.03, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${background2})` }}
          />

          {/* 🟢 CORRIGÉ : Tous les textes, titres, descriptions et jauges ont été retirés */}
          
        </motion.div>
      )}
    </AnimatePresence>
  );
}
