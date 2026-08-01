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

      {/* ================= 1. EN-TÊTE INSTITUTIONNEL ÉPURÉ ================= */}
      <header className="relative flex flex-col bg-white overflow-hidden border-b border-slate-100">
        <div className="relative z-20 max-w-6xl mx-auto px-6 py-20 pt-32 text-center flex flex-col items-center w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full flex flex-col items-center">
            
            <span className="px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-red-600 bg-red-50 border border-red-100 flex items-center gap-2">
              <FaClock className="animate-pulse" /> Assistance & Sinistres 24h/7
            </span>
            
            <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tight leading-none uppercase">
              Centre de <span className="text-[#CE1126] italic">Relation Client</span>
            </h1>
            
            <p className="max-w-xl mx-auto text-slate-950 text-lg md:text-2xl leading-relaxed font-bold">
              Une question sur un contrat, une urgence médicale ou un besoin d'assistance immédiate à Kinshasa ? Nos équipes sont là pour vous.
            </p>

          </motion.div>
        </div>
      </header>

{/* ================= 2. CORE INTERFACE D'ASSISTANCE ================= */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-16 w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

{/* ================= BLOC ACCÈS RAPIDES & URGENCES RDC (RECTANGLE STRICT) ================= */}
<div className="lg:col-span-4 space-y-8 w-full">
  
  {/* Ligne d'urgence médicale rouge - Angles 100% droits */}
  <div className="bg-white p-6 md:p-8 border border-slate-100 border-t-4 border-t-[#CE1126] shadow-md space-y-4 rounded-none">
    <div className="flex items-center gap-3 text-[#CE1126]">
      <FaHospitalSymbol size={22} />
      <h3 className="font-black text-base uppercase tracking-tight">Urgence Médicale RDC</h3>
    </div>
    <p className="text-xs md:text-sm text-slate-600 font-semibold leading-relaxed">
      Pour une prise en charge immédiate dans nos cliniques partenaires au pays sans avance de fonds.
    </p>
    <a 
      href="tel:+243810000000" 
      className="w-full py-4 bg-[#CE1126] hover:bg-red-700 text-white font-extrabold uppercase text-[10px] md:text-[11px] tracking-[0.2em] text-center block transition-all shadow-md active:scale-95 rounded-none"
    >
      Appeler le +243 810 000 000
    </a>
  </div>

  {/* Ligne Canal Diaspora WhatsApp vert - Angles 100% droits */}
  <div className="bg-white p-6 md:p-8 border border-slate-100 border-t-4 border-t-green-500 shadow-md space-y-4 rounded-none">
    <div className="flex items-center gap-3 text-green-600">
      <FaWhatsapp size={22} />
      <h3 className="font-black text-base uppercase tracking-tight">Ligne Client Diaspora</h3>
    </div>
    <p className="text-xs md:text-sm text-slate-600 font-semibold leading-relaxed">
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



          {/* Coordonnées Institutionnelles */}
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6 text-sm font-semibold text-slate-600">
            <h4 className="font-black text-slate-900 border-b border-slate-200 pb-3 text-xs uppercase tracking-[0.2em]">Nos Bureaux</h4>
            
            <div className="flex gap-4">
              <FaMapMarkerAlt className="text-red-600 flex-shrink-0 mt-0.5" size={14} />
              <div>
                <p className="font-black text-slate-900 uppercase text-xs tracking-wider mb-0.5">Siège Social Kinshasa</p>
                <p className="font-medium text-slate-950">Avenue de la Justice, Gombe, RD Congo</p>
              </div>
            </div>

            <div className="flex gap-4">
              <FaEnvelope className="text-red-600 flex-shrink-0 mt-0.5" size={14} />
              <div>
                <p className="font-black text-slate-900 uppercase text-xs tracking-wider mb-0.5">Support Mail</p>
                <p className="font-medium text-slate-950 break-all">assistance@drcassurances.com</p>
              </div>
            </div>

            <div className="flex gap-4">
              <FaShieldAlt className="text-red-600 flex-shrink-0 mt-0.5" size={14} />
              <div>
                <p className="font-black text-slate-900 uppercase text-xs tracking-wider mb-0.5">Agrément Courtier ARCA</p>
                <p className="font-mono text-xs text-slate-950">N° ARCA/RDC/2026-XXXX</p>
              </div>
            </div>
          </div>

        </div>

        {/* FORMULAIRE DE MESSAGERIE ADMINISTRATIVE (COL 8) */}
        <div className="lg:col-span-8">
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-2 md:p-4 space-y-10"
          >
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Envoyer une demande écrite</h2>
              <p className="text-2xl text-slate-950 font-medium mt-1">Pour toute réclamation, demande de devis sur-mesure ou envoi de documents administratifs.</p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-8">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-950">Votre Nom complet</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={emailData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: Jean Mbuyi"
                    className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 focus:placeholder-transparent"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-950">Adresse Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={emailData.email}
                    onChange={handleInputChange}
                    placeholder="Ex: jean.mbuyi@gmail.com"
                    className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 focus:placeholder-transparent"
                  />
                </div>
              </div>

              {/* ─── 🟢 CORRIGÉ : Liste déroulante des sujets complétée et refermée proprement */}
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-950">Nature de la demande</label>
                <select
                  name="subject"
                  value={emailData.subject}
                  onChange={handleInputChange}
                  className="w-full border-b-2 border-slate-100 bg-transparent py-4 text-lg font-bold outline-none transition focus:border-red-600 appearance-none cursor-pointer"
                >
                  <option value="Général">Question générale sur nos offres</option>
                  <option value="Sinistre">Suivi de dossier de sinistre / Remboursement</option>
                  <option value="Partenariat">Demande d'agrément (Cliniques / Garages)</option>
                  <option value="Entreprise">Assurance Collective / Offre Flotte</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-950">Message / Détails de la demande</label>
                <textarea
                  name="message"
                  required
                  rows="5"
                  value={emailData.message || ""}
                  onChange={handleInputChange}
                  placeholder="Décrivez précisément votre besoin..."
                  className="w-full border-2 border-slate-100 bg-slate-50 p-6 text-base font-medium outline-none transition focus:border-red-600 rounded-3xl"
                />
              </div>

              {/* Action finale : Rectangulaire, Rouge, Contraste maximum */}
              <div className="pt-4">
                <button 
                  type="submit" 
                  className="w-full sm:w-auto px-12 py-5 bg-red-600 text-white font-black uppercase text-[11px] tracking-[0.25em] shadow-2xl hover:bg-red-700 transition-all active:scale-95"
                >
                  Transmettre la demande <FaArrowRight size={10} className="inline ml-1" />
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
