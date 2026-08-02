import React, { useState } from 'react';
import { motion } from 'framer-motion';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import notificationService from '../services/notificationService';
// 🟢 CORRIGÉ : Ajout explicite de FaArrowRight pour valider le bouton de soumission du formulaire
import { 
  FaPhoneAlt, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, 
  FaShieldAlt, FaClock, FaPaperPlane, FaHospitalSymbol,
  FaArrowRight 
} from 'react-icons/fa';


export default function ContactPage() {
  const [emailData, setEmailData] = useState({
    name: '',
    email: '',
    subject: 'Général',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmailData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);

    try {
      if (notificationService?.info) {
        notificationService.info("Envoi de votre demande au support technique...");
      }

      // Simulation d'envoi vers l'API d'assistance
      await new Promise(resolve => setTimeout(resolve, 1500));

      notificationService.success("Votre message a été transmis. Un conseiller vous répondra sous 24h.");
      setEmailData({ name: '', email: '', subject: 'Général', message: '' });
    } catch (error) {
      notificationService.error("Échec de l'envoi. Veuillez réessayer ou utiliser WhatsApp.");
    } finally {
      setIsSending(false);
    }
  };

    return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased font-sans">
      <NavbarSecured />

     {/* ================= 1. EN-TÊTE INSTITUTIONNEL ÉPURÉ (VERSION SOMBRE) ================= */}
<header className="relative flex flex-col bg-[#090d16] overflow-hidden border-b border-slate-900 rounded-none">
  <div className="relative z-20 max-w-6xl mx-auto px-6 py-20 pt-32 text-center flex flex-col items-center w-full">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full flex flex-col items-center">
      
      {/* Badge Alerte - Fond de surface sombre, angles droits */}
      <span className="px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#CE1126] bg-[#CE1126]/10 border border-[#CE1126]/20 flex items-center gap-2 rounded-none">
        <FaClock className="animate-pulse" /> Assistance & Sinistres 24h/7
      </span>
      
      {/* Titre Blanc Éclatant */}
      <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-none uppercase">
        Centre de <span className="text-[#CE1126] italic normal-case">Relation Client</span>
      </h1> 
      {/* Description Gris Argent */}
      <p className="max-w-xl mx-auto text-[#94a3b8] text-base md:text-lg leading-relaxed font-semibold">
        Une question sur un contrat, une urgence médicale ou un besoin d'assistance immédiate à Kinshasa ? Nos équipes sont là pour vous.
      </p>
    </motion.div>
  </div>
</header>

{/* ================= 2. CORE INTERFACE D'ASSISTANCE (VERSION SOMBRE) ================= */}
<main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-16 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start bg-[#090d16]">
  
  {/* BLOC ACCÈS RAPIDES & URGENCES RDC (RECTANGLE STRICT) */}
  <div className="lg:col-span-4 space-y-6 md:space-y-8 w-full">
    
    {/* Ligne d'urgence médicale rouge - Bento Box Sombre */}
    <div className="bg-[#111827] p-6 md:p-8 border border-slate-800 border-t-4 border-t-[#CE1126] shadow-xl space-y-4 rounded-none text-left">
      <div className="flex items-center gap-3 text-[#CE1126]">
        <FaHospitalSymbol size={22} />
        <h3 className="font-black text-base uppercase tracking-tight text-white">Urgence Médicale RDC</h3>
      </div>
      <p className="text-xs md:text-sm text-[#94a3b8] font-semibold leading-relaxed">
        Pour une prise en charge immédiate dans nos cliniques partenaires au pays sans avance de fonds.
      </p>
      <a 
        href="tel:+243810000000" 
        className="w-full py-4 bg-[#CE1126] hover:bg-red-700 text-white font-extrabold uppercase text-[10px] md:text-[11px] tracking-[0.2em] text-center block transition-all shadow-md active:scale-95 rounded-none"
      >
        Appeler le +243 810 000 000
      </a>
    </div>

    {/* Ligne Canal Diaspora WhatsApp vert - Bento Box Sombre */}
    <div className="bg-[#111827] p-6 md:p-8 border border-slate-800 border-t-4 border-t-green-500 shadow-xl space-y-4 rounded-none text-left">
      <div className="flex items-center gap-3 text-green-500">
        <FaWhatsapp size={22} />
        <h3 className="font-black text-base uppercase tracking-tight text-white">Ligne Client Diaspora</h3>
      </div>
      <p className="text-xs md:text-sm text-[#94a3b8] font-semibold leading-relaxed">
        Discutez en direct avec un conseiller technique pour la gestion de vos prélèvements et activations.
      </p>
      <a 
        href="https://wa.me" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-extrabold uppercase text-[10px] md:text-[11px] tracking-[0.2em] text-center flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 rounded-none"
      >
        <FaWhatsapp size={14} /> Ouvrir WhatsApp Support
      </a>
    </div>

{/* Coordonnées Institutionnelles - Bento Box Sombre */}
<div className="bg-[#111827] p-6 md:p-8 border border-slate-800 shadow-xl space-y-6 text-sm font-semibold text-[#94a3b8] rounded-none text-left">
  
  <h4 className="font-black text-white border-b border-slate-800 pb-3 text-xs uppercase tracking-[0.2em]">
    Nos Bureaux
  </h4>
  
  {/* Ligne 1 : Siège Social */}
  <div className="flex gap-4">
    <FaMapMarkerAlt className="text-[#CE1126] flex-shrink-0 mt-0.5" size={14} />
    <div>
      <p className="font-black text-white uppercase text-xs tracking-wider mb-0.5">Siège Social Kinshasa</p>
      <p className="font-medium text-[#94a3b8]">Avenue de la Justice, Gombe, RD Congo</p>
    </div>
  </div>

  {/* Ligne 2 : Support Mail */}
  <div className="flex gap-4">
    <FaEnvelope className="text-[#CE1126] flex-shrink-0 mt-0.5" size={14} />
    <div>
      <p className="font-black text-white uppercase text-xs tracking-wider mb-0.5">Support Mail</p>
      <p className="font-medium text-[#94a3b8] break-all">assistance@esnas.drc</p>
    </div>
  </div>

  {/* Ligne 3 : Agrément ARCA */}
  <div className="flex gap-4">
    <FaShieldAlt className="text-[#CE1126] flex-shrink-0 mt-0.5" size={14} />
    <div>
      <p className="font-black text-white uppercase text-xs tracking-wider mb-0.5">Agrément Courtier ARCA</p>
      <p className="font-mono text-xs text-slate-300">N° ARCA/RDC/2026-XXXX</p>
    </div>
  </div>
</div>
</div>

{/* FORMULAIRE DE MESSAGERIE ADMINISTRATIVE (COL 8 - VERSION SOMBRE) */}
<div className="lg:col-span-8">
  <motion.div 
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-transparent p-2 md:p-4 space-y-10 text-left"
  >
    {/* En-tête du formulaire */}
    <div>
      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Envoyer une demande écrite</h2>
      <p className="text-base md:text-lg text-[#94a3b8] font-semibold mt-2">Pour toute réclamation, demande de devis sur-mesure ou envoi de documents administratifs.</p>
    </div>

    <form onSubmit={handleFormSubmit} className="space-y-8">
      
      {/* Ligne : Nom & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
        <div className="space-y-3">
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Votre Nom complet</label>
          <input
            type="text"
            name="name"
            required
            value={emailData.name}
            onChange={handleInputChange}
            placeholder="Ex: Jean Mbuyi"
            className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] focus:placeholder-transparent text-white rounded-none placeholder-slate-600"
          />
        </div>
        <div className="space-y-3">
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Adresse Email</label>
          <input
            type="email"
            name="email"
            required
            value={emailData.email}
            onChange={handleInputChange}
            placeholder="Ex: jean.mbuyi@gmail.com"
            className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] focus:placeholder-transparent text-white rounded-none placeholder-slate-600"
          />
        </div>
      </div>

      {/* Sélection de la nature de la demande */}
      <div className="space-y-3">
        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Nature de la demande</label>
        <div className="relative">
          <select
            name="subject"
            value={emailData.subject}
            onChange={handleInputChange}
            className="w-full border-b-2 border-slate-800 bg-[#090d16] py-4 text-lg font-bold outline-none transition focus:border-[#CE1126] appearance-none cursor-pointer text-white rounded-none"
          >
            <option value="Général" className="bg-[#111827] text-white">Question générale sur nos offres</option>
            <option value="Sinistre" className="bg-[#111827] text-white">Suivi de dossier de sinistre / Remboursement</option>
            <option value="Partenariat" className="bg-[#111827] text-white">Demande d'agrément (Cliniques / Garages)</option>
            <option value="Entreprise" className="bg-[#111827] text-white">Assurance Collective / Offre Flotte</option>
          </select>
        </div>
      </div>

      {/* Zone de saisie du message */}
      <div className="space-y-3">
        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Message / Détails de la demande</label>
        <textarea
          name="message"
          required
          rows="5"
          value={emailData.message || ""}
          onChange={handleInputChange}
          placeholder="Décrivez précisément votre besoin..."
          className="w-full border border-slate-800 bg-[#111827] p-5 text-base font-semibold outline-none transition focus:border-[#CE1126] text-white rounded-none placeholder-slate-600 shadow-inner"
        />
      </div>

      {/* Action finale : Rectangulaire, Blanche, Contraste maximum */}
      <div className="pt-4">
        <button 
          type="submit" 
          className="w-full sm:w-auto px-12 py-5 bg-white text-black font-black uppercase text-[11px] tracking-[0.25em] shadow-xl hover:bg-[#CE1126] hover:text-white transition-all duration-300 rounded-none active:scale-[0.98]"
        >
          Transmettre la demande <FaArrowRight size={11} className="inline ml-2" />
        </button>
      </div>

    </form>
  </motion.div>
</div>
</main>
      {/* Pied de page institutionnel */}
      <Footer />
    </div>
  );
}
