import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTimes, FaHeadset, FaWhatsapp, FaPhoneAlt, FaExclamationTriangle,
  FaPaperPlane, FaRobot, FaSearch, FaChevronDown, FaCheckCircle,
  FaShieldAlt, FaAmbulance, FaFileContract, FaMapMarkerAlt
} from 'react-icons/fa';

const FAQ_ITEMS = [
  {
    category: 'Sinistres & Urgences',
    question: 'Comment déclarer un accident ou une hospitalisation d’urgence en RDC ?',
    answer: 'Cliquez sur le bouton rouge "Urgence Sinistre 24/7" ci-dessus ou appelez notre permanence au +243 81 000 0000. Présentez simplement votre QR Code d’assuré à l’accueil de l’hôpital ou du garage partenaire.'
  },
  {
    category: 'Diaspora & Paiements',
    question: 'Puis-je payer depuis l’étranger pour un membre de ma famille à Kinshasa ou Lubumbashi ?',
    answer: 'Oui. Vous pouvez régler par carte Visa/Mastercard (Stripe) en USD ou EUR depuis n’importe quel pays, et le bénéficiaire en RDC reçoit immédiatement son attestation numérique sur WhatsApp.'
  },
  {
    category: 'Mobile Money',
    question: 'Quels opérateurs Mobile Money sont acceptés en RDC ?',
    answer: 'Nous acceptons M-Pesa (Vodacom), Airtel Money et Orange Money en USD et en CDF au taux du jour, avec activation instantanée de votre couverture.'
  },
  {
    category: 'Attestations & ARCA',
    question: 'Vos contrats sont-ils conformes à la réglementation ARCA en RDC ?',
    answer: 'Toutes nos polices d’assurance sont émises en partenariat avec des compagnies agréées par l’Autorité de Régulation et de Contrôle des Assurances (ARCA) en RDC.'
  }
];

const QUICK_PROMPTS = [
  'Déclarer un sinistre auto',
  'Trouver un hôpital partenaire à Kinshasa',
  'Souscrire pour mes parents depuis la diaspora',
  'Télécharger mon attestation QR Code'
];

export default function AssistanceModalPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('assistant'); // 'assistant' | 'faq' | 'ticket'
  const [searchFaq, setSearchFaq] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // États du chat IA d'assistance
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Mbote ! Bienvenue sur l’Assistance Numérique ESNAs 24/7. Comment pouvons-nous vous aider aujourd’hui (sinistre, hôpital partenaire, paiement Mobile Money ou souscription diaspora) ?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // États du formulaire de ticket / rappel
  const [ticketForm, setTicketForm] = useState({
    fullName: '',
    phone: '',
    topic: 'Déclaration de sinistre',
    message: ''
  });
  const [ticketSent, setTicketSent] = useState(false);

  // Bloque le scroll de la page arrière tant que la modale plein écran est ouverte
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Fermer la modale (retour à la page précédente ou accueil)
  const handleClose = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Envoi d'un message dans l'assistant rapide
  const handleSendMessage = (textToSend) => {
    const content = (textToSend || chatInput).trim();
    if (!content) return;

    const userMsg = { id: Date.now(), sender: 'user', text: content };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    setTimeout(() => {
      let reply =
        'Un conseiller ESNAs basé à Kinshasa prend en charge votre demande. Pour une urgence immédiate, utilisez le bouton WhatsApp Direct ou appelez le +243 81 000 0000.';
      const lower = content.toLowerCase();

      if (lower.includes('sinistre') || lower.includes('accident')) {
        reply =
          'Pour déclarer un sinistre : 1) Prenez des photos des dégâts ou de la facture médicale. 2) Envoyez-les via l’onglet "Ouvrir un Ticket" ou sur notre WhatsApp Urgence 24/7 avec votre numéro de police.';
      } else if (lower.includes('hôpital') || lower.includes('hopital') || lower.includes('kinshasa')) {
        reply =
          'Nos cliniques partenaires à Kinshasa (Gombe, Limete, Ngaliema, Kalamu) acceptent le tiers payant direct sur présentation de votre QR Code ESNAs.';
      } else if (lower.includes('diaspora') || lower.includes('parent')) {
        reply =
          'Depuis l’étranger, choisissez votre pack dans le Catalogue, renseignez le numéro WhatsApp RDC de votre proche comme bénéficiaire et payez par carte Visa/Mastercard.';
      }

      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: reply }]);
    }, 450);
  };

  // Soumission du ticket d'assistance
  const handleTicketSubmit = (e) => {
    e.preventDefault();
    setTicketSent(true);
  };

  const filteredFaqs = FAQ_ITEMS.filter(
    (item) =>
      item.question.toLowerCase().includes(searchFaq.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchFaq.toLowerCase()) ||
      item.category.toLowerCase().includes(searchFaq.toLowerCase())
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] bg-[#090d16] text-white flex flex-col overflow-hidden"
      >
        {/* EN-TÊTE PLEIN ÉCRAN FIXE */}
        <header className="shrink-0 bg-[#0d1322] border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#CE1126]/20 border border-[#CE1126] flex items-center justify-center text-[#CE1126]">
              <FaHeadset size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wider">
                  Centre d&apos;Assistance ESNAs
                </h1>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  En ligne 24/7
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Support Sinistres, Réseau Médical RDC &amp; Accompagnement Diaspora
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer l'assistance"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-[#CE1126] text-slate-200 hover:text-white border border-white/15 text-xs font-extrabold uppercase tracking-wider transition"
          >
            <span>Fermer</span>
            <FaTimes size={14} />
          </button>
        </header>

        {/* CORPS DÉFILANT DE LA MODALE */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
            {/* BANDEAU D'ACTIONS RAPIDES (URGENCE / WHATSAPP / APPEL) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href="tel:+243810000000"
                className="flex items-center gap-3.5 p-4 bg-[#CE1126]/15 hover:bg-[#CE1126]/25 border border-[#CE1126] transition group"
              >
                <div className="w-10 h-10 bg-[#CE1126] text-white flex items-center justify-center shrink-0">
                  <FaAmbulance size={18} />
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-[#ff6b7b]">
                    Urgence Sinistre 24/7
                  </span>
                  <strong className="text-sm font-extrabold text-white">
                    +243 81 000 0000
                  </strong>
                </div>
              </a>

              <a
                href="https://wa.me."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3.5 p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 transition"
              >
                <div className="w-10 h-10 bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <FaWhatsapp size={20} />
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    WhatsApp Direct RDC
                  </span>
                  <strong className="text-sm font-extrabold text-white">
                    Réponse en &lt; 5 min
                  </strong>
                </div>
              </a>

              <button
                type="button"
                onClick={() => setActiveTab('ticket')}
                className="flex items-center gap-3.5 p-4 bg-[#111827] hover:bg-slate-800/80 border border-slate-700 text-left transition"
              >
                <div className="w-10 h-10 bg-[#00A3E0]/20 text-[#00A3E0] border border-[#00A3E0]/40 flex items-center justify-center shrink-0">
                  <FaFileContract size={18} />
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-[#00A3E0]">
                    Dossier &amp; Remboursement
                  </span>
                  <strong className="text-sm font-extrabold text-white">
                    Déclarer un sinistre
                  </strong>
      {/* ONGLETS DE NAVIGATION INTERNE */}
      <div className="bg-[#111827] border-b border-slate-800 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'assistant', label: 'Assistant IA (FR / Lingala)', icon: FaRobot },
          { id: 'faq', label: 'Questions Fréquentes (FAQ)', icon: FaSearch },
          { id: 'ticket', label: 'Ouvrir un Ticket / Rappel', icon: FaPhoneAlt }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 whitespace-nowrap transition ${
                active
                  ? 'border-[#CE1126] text-white bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={active ? 'text-[#CE1126]' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENU PRINCIPAL SCROLLABLE */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto h-full">
          {/* ONGLET 1 : ASSISTANT IA */}
          {activeTab === 'assistant' && (
            <div className="flex flex-col h-full bg-[#111827] border border-slate-800">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-3.5 text-xs sm:text-sm leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-[#CE1126] text-white font-medium'
                          : 'bg-[#090d16] border border-slate-800 text-slate-200'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions rapides */}
              <div className="px-4 py-2.5 bg-[#090d16]/70 border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="whitespace-nowrap text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 border border-slate-700 transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Zone de saisie */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-[#0C1E36] border-t border-white/10 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Écrivez votre question en Français ou en Lingala..."
                  className="flex-1 bg-[#090d16] border border-slate-700 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#CE1126]"
                />
                <button
                  type="submit"
                  className="bg-[#CE1126] hover:bg-[#a60d1e] text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 transition"
                >
                  <span>Envoyer</span>
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          )}

          {/* ONGLET 2 : FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Rechercher dans la FAQ (M-Pesa, Diaspora, Sinistre, Hôpital...)"
                  className="w-full bg-[#111827] border border-slate-800 pl-9 pr-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#CE1126]"
                />
              </div>

              <div className="space-y-2.5">
                {filteredFaq.map((item, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div key={idx} className="bg-[#111827] border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                        className="w-full flex items-center justify-between gap-3 p-4 text-left font-bold text-xs sm:text-sm text-white hover:bg-white/5"
                      >
                        <span>{item.q}</span>
                        <FaChevronDown
                          className={`text-slate-400 shrink-0 transition-transform ${
                            isOpen ? 'rotate-180 text-[#CE1126]' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-xs sm:text-sm text-slate-300 border-t border-slate-800/80 pt-3 leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ONGLET 3 : TICKET / RAPPEL */}
          {activeTab === 'ticket' && (
            <div className="bg-[#111827] border border-slate-800 p-5 sm:p-7">
              {ticketSent ? (
                <div className="text-center py-8 space-y-3">
                  <FaCheckCircle className="text-emerald-400 text-4xl mx-auto" />
                  <h3 className="text-lg font-black uppercase">Demande enregistrée avec succès</h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                    Un gestionnaire ESNAS RDC vous recontactera sous 15 minutes au{' '}
                    <strong className="text-white">{ticketForm.phone}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setTicketSent(false);
                      setTicketForm({ fullName: '', phone: '', category: 'Sinistre / Urgence', message: '' });
                    }}
                    className="mt-4 bg-[#CE1126] text-white text-xs font-black uppercase tracking-wider px-5 py-2.5"
                  >
                    Nouvelle demande
                  </button>
                </div>
              ) : (
                <form onSubmit={handleTicketSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        required
                        value={ticketForm.fullName}
                        onChange={(e) => setTicketForm({ ...ticketForm, fullName: e.target.value })}
                        placeholder="Ex: Jean Mukendi"
                        className="w-full bg-[#090d16] border border-slate-700 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#CE1126]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Téléphone / WhatsApp (RDC ou Diaspora) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={ticketForm.phone}
                        onChange={(e) => setTicketForm({ ...ticketForm, phone: e.target.value })}
                        placeholder="Ex: +243 81 234 5678"
                        className="w-full bg-[#090d16] border border-slate-700 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#CE1126]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Objet de votre demande
                    </label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      className="w-full bg-[#090d16] border border-slate-700 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#CE1126]"
                    >
                      <option>Sinistre / Urgence médicale ou auto</option>
                      <option>Problème de paiement (M-Pesa / Airtel / Stripe)</option>
                      <option>Demande de devis entreprise / flotte</option>
                      <option>Modification de contrat ou bénéficiaire</option>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Détails complémentaires
                    </label>
                    <textarea
                      rows={4}
                      value={ticketForm.message}
                      onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                      placeholder="Décrivez brièvement votre besoin ou votre numéro de police..."
                      className="w-full bg-[#090d16] border border-slate-700 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#CE1126]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-[#CE1126] hover:bg-[#a60d1e] text-white font-black uppercase tracking-wider text-xs px-6 py-3.5 transition"
                  >
                    Demander un rappel immédiat
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BARRE D'URGENCE RAPIDE EN BAS DE LA MODALE */}
      <footer className="bg-[#0C1E36] border-t border-white/10 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 shrink-0">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold">
            <FaAmbulance /> Urgence Santé : +243 81 000 0001
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-amber-400 font-bold">
            <FaCarCrash /> Dépannage Auto : +243 81 000 0002
          </span>
        </div>
        <span className="text-slate-400">Assistance agréée ARCA • ESNAS RDC</span>
      </footer>
    </motion.div>
  );
}
