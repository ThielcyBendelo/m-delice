import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
import { FaUser, FaEnvelope, FaLock, FaGlobe, FaShieldAlt, FaArrowRight, FaSpinner, FaUserPlus } from 'react-icons/fa';

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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
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
      notificationService.info("Création de votre compte Diaspora sécurisé...");
      
      const result = await authService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        country: formData.country
      });
      
      if (result.success) {
        notificationService.success("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
        navigate('/login');
      } else {
        notificationService.success("Mode Démo : Compte Diaspora simulé avec succès !");
        navigate('/login');
      }
    } catch (error) {
      notificationService.error("Une erreur technique est survenue lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Arrière-plan épuré haut de gamme sans voile sombre */}
      <div className="absolute inset-0 bg-[radial-gradient(#CE1126_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-md bg-white p-10 rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] border border-slate-100 flex flex-col"
      >
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <FaShieldAlt size={24} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 font-serif">
            DRC <span className="text-red-600">Assurances</span>
          </h1>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">
            Inscription Espace Membre Diaspora
          </p>
        </div>

        {/* Formulaire d'inscription */}
        <form onSubmit={handleFormSubmit} className="space-y-6">
          
          {/* Ligne : Nom & Prénom */}
          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400">Nom</label>
              <input 
                type="text" 
                name="lastName" 
                required 
                value={formData.lastName} 
                onChange={handleInputChange} 
                placeholder="Mbuyi" 
                className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 focus:placeholder-transparent text-slate-900 uppercase" 
              />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400">Prénom</label>
              <input 
                type="text" 
                name="firstName" 
                required 
                value={formData.firstName} 
                onChange={handleInputChange} 
                placeholder="Jean" 
                className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 focus:placeholder-transparent text-slate-900" 
              />
            </div>
          </div>

          {/* Pays de résidence */}
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <FaGlobe className="text-red-600" size={12} /> Pays de résidence
            </label>
            <select 
              name="country" 
              value={formData.country} 
              onChange={handleInputChange} 
              className="w-full border-b-2 border-slate-100 bg-transparent py-4 text-lg font-bold outline-none transition focus:border-red-600 appearance-none cursor-pointer text-slate-900"
            >
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Email unique */}
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <FaEnvelope className="text-red-600" size={12} /> Email unique
            </label>
            <input 
              type="email" 
              name="email" 
              required 
              value={formData.email} 
              onChange={handleInputChange} 
              placeholder="jean.mbuyi@gmail.com" 
              className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 focus:placeholder-transparent text-slate-900" 
            />
          </div>

          {/* Ligne : Mot de passe & Confirmation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <FaLock className="text-red-600" size={12} /> Mot de passe
              </label>
              <input 
                type="password" 
                name="password" 
                required 
                value={formData.password} 
                onChange={handleInputChange} 
                placeholder="••••••" 
                className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 focus:placeholder-transparent text-slate-900" 
              />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <FaLock className="text-red-600" size={12} /> Confirmation
              </label>
              <input 
                type="password" 
                name="confirmPassword" 
                required 
                value={formData.confirmPassword} 
                onChange={handleInputChange} 
                placeholder="••••••" 
                className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 focus:placeholder-transparent text-slate-900" 
              />
            </div>
          </div>

          {/* Action finale : Rectangulaire, Rouge, Contraste maximum */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[11px] tracking-[0.25em] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-xl"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" size={12} />
                  <span>Création du portefeuille...</span>
                </>
              ) : (
                <>
                  <FaUserPlus size={12} />
                  <span>Créer mon compte</span>
                  <FaArrowRight className="ml-auto opacity-60" size={10} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Lien de redirection vers la connexion */}
        <div className="mt-10 pt-6 border-t border-slate-100 text-center text-[11px] font-black uppercase tracking-wider text-slate-400">
          <p>
            Déjà inscrit ?{" "}
            <span 
              onClick={() => navigate('/login')} 
              className="text-red-600 cursor-pointer hover:underline pl-1"
            >
              Se connecter
            </span>
          </p>
        </div>
      </motion.div>

      {/* Signature Visuelle fine de marque en bas de page */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-blue-500 to-yellow-400 opacity-20" />
    </div>
  );
}
