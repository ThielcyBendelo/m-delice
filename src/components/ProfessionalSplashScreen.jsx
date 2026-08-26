import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoM from '../assets/logoM.png'; // Ajustez le chemin relatif si nécessaire

export default function ProfessionalSplashScreen({ onComplete }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Durée d'affichage globale avant transition vers le site
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => onComplete && onComplete(), 850);
    }, 3800); // Légèrement augmenté à 3.8s pour donner le temps d'apprécier la signature en bas

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          key="splash" 
          initial={{ opacity: 1 }} 
          exit={{ opacity: 0, filter: "blur(15px)", y: -10 }} 
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
          className="fixed inset-0 z-[9999] flex flex-col justify-between items-center bg-[#090d16] p-8 overflow-hidden select-none"
        >
          {/* 1. Élément fantôme pour forcer le centrage vertical parfait du logo central grâce à flex justify-between */}
          <div className="w-full h-12 invisible" aria-hidden="true" />

          {/* 2. LOGO CENTRAL PRINCIPAL */}
          <motion.div 
            initial={{ scale: 0.92, opacity: 0, filter: "blur(4px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-baseline font-black tracking-tight text-5xl sm:text-7xl text-white uppercase relative z-10"
          >
            ESNA
            <span className="text-[#CE1126] lowercase font-extrabold -ml-[2px] inline-block transform -translate-y-[2px]">s</span>
          </motion.div>

          {/* 3. SIGNATURE DE MARQUE (FOOTER "FROM") */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }} // Apparaît en fondu décalé élégant
            className="flex flex-col items-center gap-2.5 relative z-10 mb-4"
          >
            {/* Mention "from" discrète et corporative */}
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500/80">
              from
            </span>

            {/* Bloc Logo + Nom de la société */}
            <div className="flex items-center gap-3 bg-white/[0.02] border border-slate-900 px-5 py-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] backdrop-blur-md">
              {/* Image LogoM */}
              <img 
                src={logoM} 
                alt="Logo Muamokel" 
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain opacity-95"
              />
              
              {/* Nom Muamokel */}
              <span className="text-white font-black tracking-wider text-base sm:text-lg uppercase">
                Muamokel
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
