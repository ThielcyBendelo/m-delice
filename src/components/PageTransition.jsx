import { motion } from 'framer-motion';

export default function PageTransition({ children }) {
  return (
    <motion.div
      // On commence avec un léger décalage, un flou et une taille réduite (98%)
      initial={{ 
        opacity: 0, 
        y: 10, 
        scale: 0.99,
        filter: "blur(8px)" 
      }}
      // On arrive à l'état final : net, à taille réelle et bien placé
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        filter: "blur(0px)" 
      }}
      // Sortie élégante vers le haut avec disparition progressive
      exit={{ 
        opacity: 0, 
        y: -10, 
        scale: 1.01, // Légère expansion à la sortie pour un effet de profondeur
        filter: "blur(8px)" 
      }}
      // Utilisation d'une transition "Onyx" : rapide mais très fluide
      transition={{ 
        duration: 0.45, 
        ease: [0.23, 1, 0.32, 1] // Courbe ultra-smooth (Quart Ease Out)
      }}
      className="w-full min-h-screen flex flex-col rounded-none bg-transparent"
    >
      {children}
    </motion.div>
  );
}
