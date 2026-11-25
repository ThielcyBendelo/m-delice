import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaWhatsapp,
  FaTimes,
  FaPaperPlane,
  FaHeadset,
  FaShieldAlt,
  FaUserCheck,
  FaHome
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
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [topic, setTopic] = useState(SUPPORT_TOPICS[0].label);
  const [message, setMessage] = useState('');

  // Référence des limites de l'écran pour le glissement (drag) mobile
  const constraintsRef = useRef(null);
  const isDraggingRef = useRef(false);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  // Masque automatiquement la barre de navigation mobile & desktop + bloque le scroll arrière-plan
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('hide-mobile-nav');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('hide-mobile-nav');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('hide-mobile-nav');
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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

  const whatsappHref = `https://wa.me{cleanPhone}?text=${encodeURIComponent(formattedText)}`;

  return (
    <>
      {/* 1. BOUTON FLOTTANT ROND & DÉPLAÇABLE SUR MOBILE (HAUT/BAS/GAUCHE/DROITE) */}
      {externalOpen === undefined && !isOpen && (
        <>
          <div
            ref={constraintsRef}
            className="fixed inset-3 sm:inset-6 pointer-events-none z-40"
          />

          <motion.button
            type="button"
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.12}
            dragMomentum={false}
            onDragStart={() => {
              isDraggingRef.current = true;
            }}
            onDragEnd={() => {
              setTimeout(() => {
                isDraggingRef.current = false;
              }, 120);
            }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              if (!isDraggingRef.current) {
                setInternalOpen(true);
              }
            }}
            aria-label="Ouvrir le support et la consultation WhatsApp"
            className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 w-14 h-14 sm:w-auto sm:h-auto sm:px-5 sm:py-3.5 rounded-full flex items-center justify-center gap-3 bg-[#CE1126] hover:bg-[#090d16] text-white border-2 border-white/25 hover:border-[#CE1126] shadow-[0_15px_35px_rgba(206,17,38,0.5)] transition-colors duration-300 group focus:outline-none touch-none cursor-grab active:cursor-grabbing"
          >
            {/* Point vert d'état en ligne */}
            <span className="absolute -top-0.5 -right-0.5 sm:static flex h-3.5 w-3.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 sm:h-3 sm:w-3 bg-emerald-400 border-2 border-[#090d16] sm:border-0" />
            </span>

            <FaWhatsapp size={24} className="text-white shrink-0" />

            <span className="hidden sm:inline text-[11px] font-black uppercase tracking-[0.18em]">
              Consultation & Support
            </span>
          </motion.button>
        </>
      )}

      {/* 2. MODALE PLEIN ÉCRAN (MASQUE TOUTES LES BARRES DE NAVIGATION) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.22 }}
                className="fixed inset-0 z-[99999] w-screen h-screen bg-[#090d16] text-white flex flex-col overflow-y-auto"
              >
                {/* En-tête Plein Écran */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-8 h-16 bg-[#111827] border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        navigate('/');
                      }}
                      title="Retour à l'accueil"
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#090d16] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <FaHome size={13} />
                      <span className="hidden sm:inline">Accueil</span>
                    </button>

                    <div className="w-10 h-10 rounded-full bg-[#CE1126] flex items-center justify-center text-white shrink-0">
                      <FaHeadset size={18} />
                    </div>

                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Conseiller en ligne 24/7
                      </span>
                      <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-white">
                        Consultation & Support Direct
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Fermer"
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#090d16] border border-slate-800 text-slate-200 hover:bg-[#CE1126] hover:text-white hover:border-[#CE1126] text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <span>Fermer</span>
                    <FaTimes size={14} />
                  </button>
                </div>

                {/* Corps Plein Écran Centré */}
                <div className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed border-l-2 border-[#CE1126] pl-3">
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
                        className="w-full bg-[#111827] border border-slate-800 focus:border-[#CE1126] text-white text-xs sm:text-sm pl-10 pr-4 py-3 rounded-none focus:outline-none placeholder:text-slate-600"
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
                      className="w-full bg-[#111827] border border-slate-800 focus:border-[#CE1126] text-white text-xs sm:text-sm px-4 py-3 rounded-none focus:outline-none"
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
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Décrivez brièvement votre besoin (ex: assurance santé pour mes parents à Kinshasa, devis auto...)"
                      className="w-full bg-[#111827] border border-slate-800 focus:border-[#CE1126] text-white text-xs sm:text-sm p-3.5 rounded-none focus:outline-none placeholder:text-slate-600 resize-none"
                    />
                  </div>

                  {/* Pied d'action WhatsApp */}
                  <div className="pt-2 space-y-3">
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleClose}
                      className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#1ebe5d] text-slate-950 font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-colors rounded-none shadow-lg"
                    >
                      <FaPaperPlane size={13} />
                      <span>Envoyer sur WhatsApp</span>
                    </a>

                    <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-widest">
                      <FaShieldAlt className="text-[#CE1126]" />
                      <span>Assistance officielle ESNAs • Kinshasa & Diaspora</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

WhatsAppSupportModal.propTypes = {
  phoneNumber: PropTypes.string,
  externalOpen: PropTypes.bool,
  onExternalClose: PropTypes.func
};
