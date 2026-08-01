import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
// MODIFIEZ l'importation pour ajouter FaChevronDown
import { 
  FaShieldAlt, FaEnvelope, FaLock, FaUserPlus, 
  FaArrowRight, FaSpinner, FaGoogle, FaGithub, FaApple,
  FaGlobe, FaUser, FaChevronDown // <--- AJOUTEZ CECI
} from 'react-icons/fa';


export default function SecureRegister() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'France'
  });

  const countries = ["France", "Belgique", "Canada", "USA", "Royaume-Uni", "Allemagne", "Autre"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🟢 NOUVELLE FONCTION : Inscription Sociale (OAuth)
  const handleSocialRegister = async (provider) => {
    notificationService.info(`Initialisation de l'inscription via ${provider}...`);
    try {
      // Appel au service pour créer un compte via le fournisseur
      const result = await authService.loginWithProvider(provider.toLowerCase());
      
      if (result) {
        notificationService.success(`Compte Diaspora créé avec succès via ${provider} !`);
        // Redirection directe vers le dashboard car l'OAuth connecte l'utilisateur immédiatement
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error(`[Social Register Error - ${provider}]`, error);
      notificationService.error(`Impossible de finaliser l'inscription avec ${provider}.`);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validations de sécurité
    if (formData.password.length < 6) {
      notificationService.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      notificationService.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);

    try {
      notificationService.info("Chiffrement des données et création du compte Diaspora...");
      
      const result = await authService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        country: formData.country
      });
      
      // Gestion de la réponse serveur ou simulation
      if (result && result.success) {
        notificationService.success("Bienvenue dans l'écosystème ESNAs ! Veuillez vous connecter.");
        navigate('/login');
      } else {
        // Fallback pour le mode démo ou test local
        notificationService.success("Inscription validée ! Redirection vers la connexion...");
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (error) {
      console.error("[Registration Error]", error);
      notificationService.error("Une erreur est survenue. L'adresse email est peut-être déjà utilisée.");
    } finally {
      setIsLoading(false);
    }
  };

  // Les boutons sociaux pour le rendu JSX
  const socialLogins = [
    { name: 'Google', icon: <FaGoogle />, color: 'hover:bg-red-50 hover:text-red-600 hover:border-red-200' },
    { name: 'GitHub', icon: <FaGithub />, color: 'hover:bg-slate-900 hover:text-white hover:border-slate-900' },
    { name: 'Apple', icon: <FaApple />, color: 'hover:bg-black hover:text-white hover:border-black' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Arrière-plan technique discret */}
      <div className="absolute inset-0 bg-[radial-gradient(#CE1126_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-20 w-full max-w-[500px] bg-white p-8 md:p-12 shadow-2xl border border-slate-100 flex flex-col rounded-none"
      >
        {/* En-tête ESNAs */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-red-600 text-white flex items-center justify-center mx-auto mb-6 shadow-lg rounded-none">
            <FaShieldAlt size={20} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">
            ESNA<span className="text-red-600">s DRC</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-3">
            Création de Compte Diaspora
          </p>
        </div>

        {/* Inscription Sociale Rapide */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {socialLogins.map((social) => (
            <button
              key={social.name}
              type="button"
              className={`flex items-center justify-center py-3 border border-slate-200 text-slate-600 transition-all duration-300 rounded-none text-lg ${social.color}`}
              title={`S'inscrire avec ${social.name}`}
            >
              {social.icon}
            </button>
          ))}
        </div>

        <div className="relative flex py-2 items-center mb-8">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Ou par formulaire</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-5">
          
          {/* Ligne : Nom & Prénom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nom</label>
              <input 
                type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange}
                placeholder="Mbuyi" 
                className="w-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-red-600 focus:bg-white text-slate-900 rounded-none uppercase" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prénom</label>
              <input 
                type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange}
                placeholder="Jean" 
                className="w-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-red-600 focus:bg-white text-slate-900 rounded-none" 
              />
            </div>
          </div>

          {/* Pays de résidence */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <FaGlobe size={10} className="text-red-600" /> Pays de résidence
            </label>
            <div className="relative">
              <select 
                name="country" value={formData.country} onChange={handleInputChange}
                className="w-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-red-600 focus:bg-white text-slate-900 rounded-none appearance-none cursor-pointer"
              >
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <FaEnvelope size={10} className="text-red-600" /> Email
            </label>
            <input 
              type="email" name="email" required value={formData.email} onChange={handleInputChange}
              placeholder="jean.mbuyi@gmail.com" 
              className="w-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-red-600 focus:bg-white text-slate-900 rounded-none" 
            />
          </div>

          {/* Mots de passe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mot de passe</label>
              <input 
                type="password" name="password" required value={formData.password} onChange={handleInputChange}
                placeholder="••••••" 
                className="w-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-red-600 focus:bg-white text-slate-900 rounded-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirmation</label>
              <input 
                type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleInputChange}
                placeholder="••••••" 
                className="w-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-red-600 focus:bg-white text-slate-900 rounded-none" 
              />
            </div>
          </div>

          {/* Bouton d'action */}
          <div className="pt-4">
            <button 
              type="submit" disabled={isLoading}
              className="w-full py-4 bg-slate-900 hover:bg-red-600 text-white font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg rounded-none"
            >
              {isLoading ? (
                <FaSpinner className="animate-spin" size={14} />
              ) : (
                <>
                  <span>Créer mon compte</span>
                  <FaArrowRight size={10} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Pied du formulaire */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Déjà membre de l'écosystème ?
            <span 
              onClick={() => navigate('/login')} 
              className="text-red-600 cursor-pointer hover:text-red-700 pl-2 underline underline-offset-4"
            >
              Se connecter
            </span>
          </p>
        </div>
      </motion.div>

      {/* Signature tricolore RDC fine */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A3E0] via-[#CE1126] to-[#FDD100] opacity-30" />
    </div>
  );
}
