import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
import { 
  FaEnvelope, FaLock, FaShieldAlt, FaArrowRight, FaSpinner, FaUserCheck, 
  FaGoogle, FaGithub, FaApple 
} from 'react-icons/fa';

export default function SecureLogin() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialLogin = async (provider) => {
    notificationService.info(`Connexion via ${provider} en cours...`);
    try {
      const result = await authService.loginWithProvider(provider.toLowerCase());
      if (result) {
        notificationService.success(`Bienvenue via ${provider} !`);
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error(`[Social Auth Error - ${provider}]`, error);
      notificationService.error(`Échec de l'authentification avec ${provider}.`);
    }
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
      await authService.login(credentials.email, credentials.password);
      notificationService.success("Connexion validée avec succès !");
      window.location.href = '/dashboard';
    } catch (error) {
      if (authService.isLoggedIn()) {
        notificationService.success("Session active détectée. Redirection...");
        window.location.href = '/dashboard';
      } else {
        notificationService.error("Identifiants incorrects ou serveur indisponible.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogins = [
    { id: 'google', name: 'Google', icon: <FaGoogle />, color: 'hover:bg-red-50 hover:text-red-600 hover:border-red-200' },
    { id: 'github', name: 'GitHub', icon: <FaGithub />, color: 'hover:bg-slate-900 hover:text-white hover:border-slate-900' },
    { id: 'apple', name: 'Apple', icon: <FaApple />, color: 'hover:bg-black hover:text-white hover:border-black' },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* Arrière-plan technique discret harmonisé Onyx */}
      <div className="absolute inset-0 bg-[radial-gradient(#CE1126_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.05] z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-20 w-full max-w-[440px] bg-[#111827] p-8 md:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-slate-800 flex flex-col rounded-none"
      >
        {/* En-tête ESNAs - Couleurs ajustées pour fond sombre */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-[#CE1126] text-white flex items-center justify-center mx-auto mb-6 shadow-lg rounded-none">
            <FaShieldAlt size={20} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">
            ESNAs <span className="text-[#CE1126]">DRC</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-3">
            Authentification Sécurisée ARCA
          </p>
        </div>

        {/* Authentification Sociale - Boutons assombris */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {socialLogins.map((social) => (
            <button
              key={social.id}
              type="button"
              onClick={() => handleSocialLogin(social.name)}
              className={`flex items-center justify-center py-3 border border-slate-800 text-slate-300 transition-all duration-300 rounded-none text-lg bg-[#090d16] ${social.color}`}
            >
              {social.icon}
            </button>
          ))}
        </div>

        <div className="relative flex py-2 items-center mb-8">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Ou via email</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Email</label>
            <input 
              type="email" name="email" required value={credentials.email} onChange={handleInputChange}
              placeholder="votre@email.com" 
              className="w-full border border-slate-800 bg-[#090d16] px-4 py-3 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-[#0d1421] text-white rounded-none placeholder-slate-600" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Mot de passe</label>
            <input 
              type="password" name="password" required value={credentials.password} onChange={handleInputChange}
              placeholder="••••••••" 
              className="w-full border border-slate-800 bg-[#090d16] px-4 py-3 text-sm font-bold outline-none transition focus:border-[#CE1126] focus:bg-[#0d1421] text-white rounded-none placeholder-slate-600" 
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" disabled={isLoading}
              className="w-full py-4 bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 shadow-xl rounded-none hover:bg-[#CE1126] hover:text-white"
            >
              {isLoading ? <FaSpinner className="animate-spin" size={14} /> : (
                <><span>Se connecter</span><FaArrowRight size={10} /></>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Nouveau sur la plateforme ?
            <span onClick={() => navigate('/register')} className="text-[#CE1126] cursor-pointer hover:text-red-500 pl-2 underline underline-offset-4">
              Créer un compte
            </span>
          </p>
        </div>
      </motion.div>

      {/* Signature tricolore RDC fine */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A3E0] via-[#CE1126] to-[#FDD100] opacity-30" />
    </div>
  );
}
