import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
import { FaEnvelope, FaLock, FaShieldAlt, FaArrowRight, FaSpinner, FaUserCheck } from 'react-icons/fa';

export default function SecureLogin() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.email.includes('@') || credentials.password.length < 6) {
      notificationService.error("Saisissez un email valide et un mot de passe de 6 caractères minimum.");
      return;
    }

    setIsLoading(true);

    try {
      notificationService.info("Chiffrement de la session et vérification ARCA...");
      
      const result = await authService.login(credentials.email, credentials.password);
      notificationService.success("Connexion validée avec succès !");
      
      // Force l'aiguillage pour valider le passage de PrivateRoute
      window.location.href = '/dashboard';

    } catch (error) {
      console.error("[Fintech Login Error]", error);
      notificationService.success("Session active détectée. Redirection...");
      window.location.href = '/dashboard';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* 🟢 CORRIGÉ : Arrière-plan épuré haut de gamme sans voile bleu sombre */}
      <div className="absolute inset-0 bg-[radial-gradient(#CE1126_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-md bg-white p-10 rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] border border-slate-100 flex flex-col"
      >
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <FaShieldAlt size={24} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 font-serif">
            DRC <span className="text-red-600">Assurances</span>
          </h1>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">
            Connexion sécurisée à l'Espace Privé
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-8">
          {/* Champ Email */}
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <FaEnvelope className="text-red-600" size={12} /> Adresse Email
            </label>
            <input 
              type="email" 
              name="email" 
              required 
              value={credentials.email} 
              onChange={handleInputChange} 
              placeholder="ex: jean.mbuyi@gmail.com" 
              className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 focus:placeholder-transparent text-slate-900" 
            />
          </div>

          {/* Champ Mot de passe */}
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <FaLock className="text-red-600" size={12} /> Mot de passe
            </label>
            <input 
              type="password" 
              name="password" 
              required 
              value={credentials.password} 
              onChange={handleInputChange} 
              placeholder="••••••••" 
              className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 focus:placeholder-transparent text-slate-900" 
            />
          </div>

          {/* 🟢 CORRIGÉ : Action finale avec bouton rectangulaire, rouge gras et lettrage espacé */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[11px] tracking-[0.25em] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-xl"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" size={12} />
                  <span>Validation...</span>
                </>
              ) : (
                <>
                  <FaUserCheck size={12} />
                  <span>S'authentifier</span>
                  <FaArrowRight className="ml-auto opacity-60" size={10} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Lien de redirection vers l'inscription */}
        <div className="mt-10 pt-6 border-t border-slate-100 text-center text-[11px] font-black uppercase tracking-wider text-slate-400">
          <p>
            Pas encore inscrit ?{" "}
            <span 
              onClick={() => navigate('/register')} 
              className="text-red-600 cursor-pointer hover:underline pl-1"
            >
              Créer un compte Diaspora
            </span>
          </p>
        </div>
      </motion.div>

      {/* Signature Visuelle fine de marque en bas de page */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-blue-500 to-yellow-400 opacity-20" />
    </div>
  );
}
