import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaWhatsapp,
  FaTimes,
  FaPaperPlane,
  FaHeadset,
  FaShieldAlt,
  FaUserCheck
} from 'react-icons/fa';

const SUPPORT_TOPICS = [
  { id: 'devis', label: 'Devis & Tarifs (Santé, Auto, Voyage...)' },
  { id: 'diaspora', label: 'Souscription Diaspora pour proches en RDC' },
  { id: 'sinistre', label: 'Urgence Médicale ou Déclaration Sinistre' },
  { id: 'entreprise', label: 'Assurance Collective, Mutuelle & PME' },
  { id: 'autre', label: 'Autre demande d’assistance' }
];

export default function WhatsAppSupportModal({
  phoneNumber = '243829054350',
  externalOpen,
  onExternalClose
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [topic, setTopic] = useState(SUPPORT_TOPICS[0].label);
  const [message, setMessage] = useState('');

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  const handleClose = () => {
    if (onExternalClose) onExternalClose();
    setInternalOpen(false);
  };

  // Construction propre et complète de l'URL officielle WhatsApp
  const cleanPhone = String(phoneNumber || '243829054350').replace(/\D/g, '');
  const formattedText = [
    `Bonjour l'équipe *ESNAs* 👋,`,
    ``,
    `*Nom / Client :* ${fullName.trim() || 'Non précisé'}`,
    `*Objet :* ${topic}`,
    `*Message :* ${message.trim() || 'Je souhaite obtenir des informations sur vos offres d’assurance.'}`
  ].join('\n');

  const whatsappHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(formattedText)}`;

  return (
    <>
      {/* 1. BOUTON FLOTTANT SUPPORT (BAS À DROITE) */}
      {externalOpen === undefined && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setInternalOpen(true)}
          aria-label="Ouvrir le support et la consultation WhatsApp"
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-3 bg-[#CE1126] hover:bg-[#090d16] text-white border-2 border-white/20 hover:border-[#CE1126] px-4 py-3.5 shadow-[0_15px_35px_rgba(206,17,38,0.45)] transition-all duration-300 rounded-none group focus:outline-none"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
          </span>
          <FaWhatsapp size={20} className="text-white" />
          <span className="hidden sm:inline text-[11px] font-black uppercase tracking-[0.18em]">
            Consultation & Support
          </span>
        </motion.button>
      )}

      {/* 2. MODALE DE CONSULTATION WHATSAPP */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 25, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 w-full max-w-lg bg-[#090d16] border-2 border-[#CE1126] text-white shadow-[0_25px_70px_rgba(0,0,0,0.9)] rounded-none overflow-hidden"
            >
              {/* En-tête */}
              <div className="flex items-center justify-between px-6 py-5 bg-[#111827] border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-[#CE1126] flex items-center justify-center text-white shrink-0">
                    <FaHeadset size={20} />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Conseiller en ligne
                    </span>
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                      Consultation & Support Direct
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Fermer"
                  className="w-9 h-9 flex items-center justify-center bg-[#090d16] border border-slate-800 text-slate-300 hover:bg-[#CE1126] hover:text-white hover:border-[#CE1126] transition-colors"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              {/* Corps de la modale (sans balise <form> qui recharge la page) */}
              <div className="p-6 space-y-5">
                <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-[#CE1126] pl-3">
                  Précisez votre besoin ci-dessous. Votre demande sera transférée instantanément à un conseiller <strong className="text-white">ESNAs</strong> sur WhatsApp.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Votre Nom & Prénom
                  </label>
                  <div className="relative">
                    <FaUserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: Jean-Marc Kabongo"
                      className="w-full bg-[#111827] border border-slate-800 focus:border-[#CE1126] text-white text-xs pl-10 pr-4 py-3 rounded-none focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Sujet de la consultation
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-[#111827] border border-slate-800 focus:border-[#CE1126] text-white text-xs px-4 py-3 rounded-none focus:outline-none"
                  >
                    {SUPPORT_TOPICS.map((item) => (
                      <option key={item.id} value={item.label} className="bg-[#090d16] text-white">
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Votre message ou question
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Décrivez brièvement votre besoin (ex: assurance santé pour mes parents à Kinshasa, devis auto...)"
                    className="w-full bg-[#111827] border border-slate-800 focus:border-[#CE1126] text-white text-xs p-3.5 rounded-none focus:outline-none placeholder:text-slate-600 resize-none"
                  />
                </div>

                           {/* Bouton d'envoi direct WhatsApp sans blocage navigateur */}
                <button
                  type="button"
                  onClick={() => {
                    window.location.assign(whatsappHref);
                  }}
                  className="group w-full py-4 bg-white hover:bg-[#CE1126] text-black hover:text-white border-2 border-white hover:border-[#CE1126] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <FaWhatsapp size={18} className="text-emerald-600 group-hover:text-white transition-colors" />
                  <span>Envoyer via WhatsApp</span>
                  <FaPaperPlane size={12} />
                </button>


                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider pt-1">
                  <FaShieldAlt className="text-[#CE1126]" />
                  <span>Assistance rapide • Réponse sous quelques minutes</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

WhatsAppSupportModal.propTypes = {
  phoneNumber: PropTypes.string,
  externalOpen: PropTypes.bool,
  onExternalClose: PropTypes.func
};
