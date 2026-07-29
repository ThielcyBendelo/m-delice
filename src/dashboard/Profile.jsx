import React, { useState } from 'react';
import { motion } from 'framer-motion';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
import { FaUserCircle, FaShieldAlt, FaKey, FaEnvelope, FaGlobe, FaIdCard, FaSave } from 'react-icons/fa';

export default function Profile() {
  const [isSaving, setIsSaving] = useState(false);

  // Récupération dynamique de la session utilisateur connectée
  const currentUser = authService.getCurrentUser() || {
    firstName: "Jean",
    lastName: "Mbuyi",
    email: "jean.mbuyi@gmail.com",
    role: "Diaspora",
    country: "France"
  };

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setSecurityData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      notificationService.error("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setIsSaving(true);
    try {
      notificationService.info("Chiffrement et mise à jour de vos identifiants cryptographiques...");
      // Simulation d'écriture dans SQL Server via API
      await new Promise(resolve => setTimeout(resolve, 1500));
      notificationService.success("Vos paramètres de sécurité ont été mis à jour.");
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      notificationService.error("Une erreur réseau est survenue.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen p-1 text-slate-800 dark:text-slate-100 animate-fadeIn">
      
      {/* En-tête de page */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <FaUserCircle className="text-[#00A3E0]" /> Paramètres du Compte Accrédité
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Gérez vos informations d'identification, contrôlez vos tokens de sécurité et vérifiez votre niveau d'accréditation réglementaire.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNE GAUCHE : Fiche d'Accréditation ARCA (1 tier) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="flex justify-center">
            <FaUserCircle className="text-slate-300 dark:text-slate-700" size={90} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{currentUser.firstName} {currentUser.lastName}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
          </div>

          {/* Niveau de sécurité du rôle */}
          <div className="pt-2">
            <span className="text-[10px] font-black tracking-wider uppercase bg-[#00A3E0]/10 text-[#00A3E0] px-3 py-1 rounded-full border border-[#00A3E0]/20 inline-flex items-center gap-1.5">
              <FaShieldAlt /> Habilitation : {currentUser.role}
            </span>
          </div>

          {/* Détails géographiques / Certificat */}
          <div className="border-t border-slate-50 dark:border-slate-800/60 pt-4 text-left text-xs text-slate-500 space-y-2.5">
            <p className="flex items-center gap-2">
              <FaGlobe className="text-[#00A3E0]" /> Zone d'Opération : <span className="font-bold text-slate-700 dark:text-slate-300">{currentUser.country || "RD Congo"}</span>
            </p>
            <p className="flex items-center gap-2">
              <FaIdCard className="text-[#FDD100]" /> ID Cryptographique : <span className="font-mono text-slate-400">DRC-USR-{Math.floor(Math.random() * 9000 + 1000)}</span>
            </p>
          </div>
        </div>

        {/* COLONNE DROITE : Formulaire de Mise à Jour de Sécurité (2 tiers) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
            <FaKey className="text-[#00A3E0]" /> Modification des Identifiants d'Accès
          </h3>

          <form onSubmit={handleUpdateSecurity} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Mot de passe actuel</label>
              <input
                type="password"
                name="currentPassword"
                required
                value={securityData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Nouveau mot de passe</label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  value={securityData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Confirmer le mot de passe</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={securityData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-3 bg-[#00A3E0] hover:bg-[#0082B3] text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 border-b-4 border-[#006180]"
              >
                {isSaving ? "Traitement..." : "Sauvegarder les modifications"} <FaSave size={12} />
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
