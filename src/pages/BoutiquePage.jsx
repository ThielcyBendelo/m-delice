// AJOUT EXPLICITE DE useEffect DANS LES IMPORTS DE BASE
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import { 
  FaShieldAlt, FaHeartbeat, FaCar, FaGraduationCap, 
  FaPlane, FaCheckCircle, FaShoppingCart, FaInfoCircle,
  FaTimes, FaLock, FaWhatsapp, FaDownload, FaFilter 
} from 'react-icons/fa';
import { quoteFromPack } from '../utils/insurancePricing';

// Simulation de données des packs d'assurance disponibles
const insurancePacks = [
  {
    id: 1,
    category: "Santé",
    icon: <FaHeartbeat className="text-[#CE1126] text-2xl" />,
    name: "Pack Santé Maman",
    tagline: "Protégez votre mère restée à Kinshasa",
    price: 45,
    period: "par mois",
    coverageLimit: "Plafond annuel : 3 500 USD",
    features: [
      "Consultations gratuites (Hôpitaux agréés)",
      "Prise en charge des médicaments à 80%",
      "Urgences et hospitalisations incluses",
      "Notification WhatsApp instantanée"
    ],
    isPopular: true
  },
  {
    id: 2,
    category: "Automobile",
    icon: <FaCar className="text-[#FDD100] text-2xl" />,
    name: "Auto Confort Tiers-Payant",
    tagline: "Assurance obligatoire ARCA + Réparations",
    price: 29,
    period: "par mois",
    coverageLimit: "Responsabilité Civile illimitée",
    features: [
      "Attestation officielle ARCA en 5 minutes",
      "Zéro avance de frais chez nos garages partenaires",
      "Assistance dépannage 24h/7 à Kinshasa",
      "Protection du conducteur incluse"
    ],
    isPopular: false
  },
  {
    id: 3,
    category: "Scolaire",
    icon: <FaGraduationCap className="text-[#00A3E0] text-2xl" />,
    name: "Student Protect RDC",
    tagline: "Garantissez la scolarité de vos frères et enfants",
    price: 15,
    period: "par mois",
    coverageLimit: "Frais scolaires couverts en cas d'aléa",
    features: [
      "Prise en charge des accidents scolaires",
      "Remboursement des frais de scolarité bloqués",
      "Frais médicaux d'urgence couverts",
      "Valable pour écoles et universités"
    ],
    isPopular: false
  },
  {
    id: 4,
    category: "Voyage",
    icon: <FaPlane className="text-purple-500 text-2xl" />,
    name: "Pack Diaspora Congo",
    tagline: "Pour vos séjours temporaires au pays",
    price: 55,
    period: "par séjour (30j)",
    coverageLimit: "Assistance internationale complète",
    features: [
      "Rapatriement sanitaire vers l'Europe/Canada",
      "Frais hospitaliers sur place pris en charge",
      "Assurance bagages et retards de vol",
      "Assistance juridique incluse"
    ],
    isPopular: false
  }
];

export default function BoutiquePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);

    // À mettre juste après la déclaration de vos states dans BoutiquePage()
useEffect(() => {
  const state = location.state;
  if (state?.triggerPayment && state?.pack) {
    setSelectedPack(state.pack);
    setIsPayModalOpen(true);
    // Nettoyer l'état de l'historique de navigation pour éviter les réouvertures en boucle
    window.history.replaceState({}, document.title);
  }
}, [location]);

  const categories = ["Tous", "Santé", "Automobile", "Scolaire", "Voyage"];

  // Filtrer les produits
  const filteredPacks = activeFilter === "Tous" 
    ? insurancePacks 
    : insurancePacks.filter(pack => pack.category === activeFilter);

  // GESTION DU CLIC SOURIS LIÉ À LA MODALE DE SÉCURISATION FINANCIAL RDC
  const handleSubscription = (pack) => {
    setSelectedPack(pack);
    setIsPayModalOpen(true);
  };

    return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased font-sans">
      <NavbarSecured />

                {/* ================= 1. EN-TÊTE DU CATALOGUE ET FILTRES ÉPURÉS (VERSION SOMBRE ONYX) ================= */}
      <header className="relative flex flex-col bg-[#090d16] overflow-hidden border-b border-slate-900 rounded-none">
        <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 py-20 pt-32 text-center flex flex-col items-center w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full flex flex-col items-center">
            
            {/* Badge de souscription */}
            <span className="px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#CE1126] bg-[#CE1126]/10 border border-[#CE1126]/20 flex items-center gap-2 rounded-none shadow-sm">
              <FaShoppingCart size={11} /> Souscription Immédiate
            </span>
            
            {/* Titre Principal Blanc Éclatant */}
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-none uppercase">
              Packs <span className="text-[#CE1126] italic normal-case">Micro-Assurance</span>
            </h1>
            
            {/* Description Gris Argent Scannable */}
            <p className="max-w-2xl mx-auto text-[#94a3b8] text-base md:text-xl leading-relaxed font-semibold">
              Sélectionnez une formule claire, ajustée aux réalités locales de la RD Congo. Pas de frais cachés, résiliation libre à tout moment.
            </p>

            {/* ================= DESKTOP & TABLET : Barre sur une seule ligne défilante FinTech Sombre ================= */}
            <div className="hidden sm:flex mt-8 w-full overflow-x-auto no-scrollbar justify-center pb-2">
              <div className="flex gap-4 whitespace-nowrap px-4">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`px-6 py-3 text-[11px] font-black uppercase tracking-[0.15em] transition-all border-2 rounded-none focus:outline-none ${
                      activeFilter === cat
                        ? "border-[#CE1126] bg-[#CE1126]/10 text-white shadow-md"
                        : "border-slate-800 bg-[#111827] text-slate-400 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* ================= MOBILE : Bouton intégré SOUS le texte (Non fixe, non flottant) Inversé Blanc ================= */}
            <div className="sm:hidden mt-6 w-full px-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black font-black uppercase text-[11px] tracking-widest rounded-none active:scale-95 border border-white shadow-xl focus:outline-none"
              >
                <FaFilter size={12} className="text-[#CE1126]" />
                <span>Filtrer ({activeFilter}) ↑</span>
              </button>
            </div>

          </motion.div>
        </div>
      </header>


      {/* ================= MOBILE : Menu DÉROULANT Plein Écran (Bento Fullscreen Drawer - VERSION SOMBRE ONYX) ================= */}
<AnimatePresence>
  {isMobileMenuOpen && (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="sm:hidden fixed inset-0 z-[9999] bg-[#090d16] text-white flex flex-col h-screen w-screen rounded-none overflow-y-auto"
    >
      {/* Barre d'en-tête interne du menu */}
      <div className="flex items-center justify-between px-6 h-20 border-b border-slate-900 bg-[#111827] shrink-0">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
          Sélectionner une catégorie
        </span>
        <button 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="p-3 text-white hover:text-[#CE1126] transition-colors rounded-none focus:outline-none"
        >
          <FaTimes size={20} />
        </button>
      </div>

      {/* Liste verticale aérée des catégories */}
      <div className="flex-grow px-6 py-8 space-y-4 bg-[#090d16]">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveFilter(cat);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full py-5 px-6 text-[12px] font-black uppercase tracking-[0.15em] text-left border transition-all duration-200 rounded-none shadow-sm focus:outline-none ${
              activeFilter === cat
                ? "border-[#CE1126] bg-[#CE1126]/10 text-white border-l-4"
                : "border-slate-800 bg-[#111827] text-slate-400 hover:border-slate-600 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Pied décoratif minimaliste ESNAs */}
      <div className="p-6 border-t border-slate-900 bg-[#111827] text-center shrink-0">
        <div className="flex items-baseline justify-center font-black tracking-tight text-sm text-slate-500 uppercase select-none">
          ESNA<span className="text-[#CE1126] lowercase font-extrabold -ml-[1px]">s</span>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

{/* ================= 2. GRILLE DES OFFRES DE MICRO-ASSURANCE (VERSION SOMBRE ONYX) ================= */}
<main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-16 w-full bg-[#090d16]">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
    {filteredPacks.map((pack, idx) => (
      <motion.div
        key={pack.id}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: idx * 0.05 }}
        className={`bg-[#111827] border flex flex-col justify-between relative transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-none ${
          pack.isPopular 
            ? "border-2 border-[#CE1126]" 
            : "border-slate-800 shadow-xl"
        }`}
      >
        {/* Badge "Plus Populaire" rectangulaire strict */}
        {pack.isPopular && (
          <span className="absolute -top-3 right-6 bg-[#CE1126] text-white text-[9px] uppercase font-black tracking-widest px-4 py-1.5 shadow-lg rounded-none z-10">
            Le plus choisi
          </span>
        )}

        {/* En-tête de la carte - S'accorde au thème sombre */}
        <div className="p-6 md:p-8 border-b border-slate-800">
          <div className="flex items-center justify-between mb-6">
            {/* Conteneur d'icône Bento Sombre */}
            <div className="w-12 h-12 bg-slate-950 border border-slate-800 flex items-center justify-center text-[#CE1126] rounded-none shadow-md">
              {pack.icon}
            </div>
            {/* Badge de catégorie rectangulaire FinTech */}
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-800/50 px-3 py-1.5 border border-slate-700/60 rounded-none">
              {pack.category}
            </span>
          </div>
          
          <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-1">
            {pack.name}
          </h3>
          <p className="text-[11px] text-[#CE1126] font-bold uppercase tracking-widest mb-6">
            {pack.tagline}
          </p>
          
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">{pack.price} USD</span>
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">/ {pack.period}</span>
          </div>
        </div>

        {/* Détails de couverture et garanties */}
        <div className="p-6 md:p-8 flex-grow space-y-6">
          {/* Alerte de limite de couverture - Style Sombre & Rouge */}
          <div className="flex items-center gap-2.5 text-[10px] md:text-[11px] font-black uppercase tracking-wider text-[#CE1126] bg-[#CE1126]/5 px-4 py-3 border border-[#CE1126]/20 rounded-none">
            <FaInfoCircle className="flex-shrink-0" />
            <span>{pack.coverageLimit}</span>
          </div>
          
          <ul className="space-y-4">
            {pack.features.map((feat, index) => (
              <li key={index} className="flex items-start gap-3 text-sm font-semibold text-[#94a3b8] leading-snug">
                <FaCheckCircle className="text-[#CE1126] mt-0.5 flex-shrink-0" size={14} />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bouton d'action final : Rectangulaire haute visibilité Inversé */}
        <div className="p-6 md:p-8 pt-0">
          <button
            onClick={() => handleSubscription(pack)}
            className={`w-full py-4 md:py-5 font-black uppercase text-[10px] md:text-[11px] tracking-[0.25em] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 rounded-none border-2 focus:outline-none ${
              pack.isPopular
                ? "bg-[#CE1126] border-[#CE1126] text-white hover:bg-transparent hover:text-white"
                : "bg-white border-white text-black hover:bg-transparent hover:text-white"
            }`}
          >
            <FaShieldAlt size={11} /> Souscrire pour ma famille
          </button>
        </div>

      </motion.div>
    ))}
  </div>
</main>

      {/* Pied de page */}
      <Footer />

      {/* COMPOSANT FLOTTANT DE LA PASSERELLE MOBILE MONEY */}
      <MobileMoneyModal 
        isOpen={isPayModalOpen} 
        onClose={() => setIsPayModalOpen(false)} 
        pack={selectedPack}
        navigate={navigate}
      />
    </div>
  );
}


// ================= PASSERELLE LOGIQUE MULTI-OPÉRATEURS DE LA RDC =================
function MobileMoneyModal({ isOpen, onClose, pack, navigate }) {
  const [operateur, setOperateur] = useState(null);
  const [telephone, setTelephone] = useState('');
  const [beneficiariesCount, setBeneficiariesCount] = useState(1);
  const [coverageLevel, setCoverageLevel] = useState('confort');
  const [validationError, setValidationError] = useState('');
  const quote = quoteFromPack(pack, beneficiariesCount, coverageLevel);

   useEffect(() => {
    if (isOpen) {
      setOperateur(null);
      setTelephone('');
      setBeneficiariesCount(1);
      setCoverageLevel('confort');
      setValidationError('');
    }
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!pack) return null;

  const ExecuterPaiement = (e) => {
    e?.preventDefault();
    if (!operateur) {
      setValidationError('Sélectionnez un opérateur Mobile Money.');
      return;
    }
    if (telephone.length !== 9) {
      setValidationError('Saisissez exactement 9 chiffres après +243.');
      return;
    }
    setValidationError('');
    navigate('/inscription-beneficiaire', {
      state: {
        selectedPack: {
          ...pack,
          price: quote.monthlyPrice,
          branch: quote.branch,
          insuranceType: quote.insuranceType,
          coverageLevel,
          beneficiariesCount: quote.beneficiariesCount,
          coverageLimit: quote.coverageLimit,
        },
      },
    });
    onClose();
  };

    return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-4 bg-[#090d16]/80 backdrop-blur-xl overscroll-contain">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-money-modal-title"
            className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain bg-[#111827] border border-slate-800 rounded-none shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative"
          >
            {/* BOUTON FERMER : Angles droits style Luxe Sombre */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-[#CE1126] rounded-none transition-colors z-30 focus:outline-none"
            >
              <FaTimes size={18} />
            </button>

            {/* ================= ÉTAPE 1 : SELECTION ET FORMULAIRE (VERSION ONYX) ================= */}
                          <div className="p-8 space-y-8">
                <div className="text-center space-y-2 pr-6">
                  <h3 id="mobile-money-modal-title" className="text-2xl font-black text-white uppercase tracking-tighter">{pack.name}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{pack.tagline}</p>
                </div>

                {/* Récapitulatif Devis Bento Sombre */}
                <div className="bg-[#090d16] p-6 border border-slate-800 rounded-none flex justify-between items-center shadow-inner">
                  <div className="text-left">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.15em]">Total de la prime</span>
                    <p className="text-2xl font-black text-white tracking-tighter mt-1">
                      {quote.monthlyPrice} USD <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">/ mois</span>
                    </p>
                  </div>
                  {/* Badge Certification ARCA */}
                  <span className="text-[9px] bg-[#CE1126]/10 text-[#CE1126] font-black px-3 py-1.5 rounded-none border border-[#CE1126]/20 uppercase tracking-widest shadow-sm">
                    Taxes ARCA Incluses
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="space-y-2 text-left">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Membres</span>
                    <select value={beneficiariesCount} onChange={(e) => setBeneficiariesCount(Number(e.target.value))} className="w-full border border-slate-800 bg-[#090d16] p-3 text-sm font-bold text-white rounded-none">
                      {[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} {count > 1 ? 'membres' : 'membre'}</option>)}
                    </select>
                  </label>
                  <label className="space-y-2 text-left">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Garantie</span>
                    <select value={coverageLevel} onChange={(e) => setCoverageLevel(e.target.value)} className="w-full border border-slate-800 bg-[#090d16] p-3 text-sm font-bold text-white rounded-none">
                      <option value="essentiel">Essentiel</option>
                      <option value="confort">Confort</option>
                      <option value="premium">Premium</option>
                    </select>
                  </label>
                </div>
                <p className="text-left text-xs font-bold text-[#CE1126]">{quote.coverageLimit} · réduction famille {quote.familyDiscount}%</p>


                <form onSubmit={ExecuterPaiement} className="space-y-6">
  {/* Choix de l'opérateur Mobile Money - Styles Rectilignes */}
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 block">1. Réseau Mobile Money RDC</label>
    <div className="grid grid-cols-3 gap-3">
      {[
        { id: 'mpesa', nom: 'M-Pesa', activeClass: 'border-[#CE1126] bg-[#CE1126]/10 text-white' },
        { id: 'orange', nom: 'Orange', activeClass: 'border-orange-500 bg-orange-500/10 text-white' },
        { id: 'airtel', nom: 'Airtel', activeClass: 'border-rose-600 bg-rose-600/10 text-white' }
      ].map((op) => (
        <button
          key={op.id} 
          type="button" 
          onClick={() => setOperateur(op.id)}
          className={`py-3.5 text-[10px] font-black uppercase tracking-wider border-2 text-center transition-all rounded-none focus:outline-none ${
            operateur === op.id 
              ? op.activeClass 
              : 'border-slate-800 bg-[#090d16] text-slate-500 hover:border-slate-600 hover:text-white'
          }`}
        >
          {op.nom}
        </button>
      ))}
    </div>
  </div>

  {/* Numéro de téléphone - Saisie sur fond sombre */}
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 block">2. Numéro de téléphone (9 chiffres)</label>
    <div className="relative flex items-center">
      <span className="absolute left-0 bottom-3 text-lg font-bold text-slate-500 pointer-events-none">+243</span>
      <input 
        type="tel" 
        placeholder="812345678" 
        maxLength={9}
        value={telephone} 
        onChange={(e) => setTelephone(e.target.value.replace(/\D/g, ''))}
        className="w-full pl-14 border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] focus:placeholder-transparent text-white font-mono rounded-none placeholder-slate-600"
      />
    </div>
  </div>

  {/* Action finale : Rectangulaire, Blanche vers Rouge */}
  {validationError && (
    <p className="text-center text-xs font-bold text-red-300" role="alert">{validationError}</p>
  )}
  <button
    type="submit"
    className="w-full py-5 bg-white text-black font-black uppercase text-[11px] tracking-[0.25em] shadow-xl hover:bg-[#CE1126] hover:text-white transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 rounded-none focus:outline-none"
  >
    <FaLock size={10} className="text-[#CE1126] group-hover:text-white" /> Confirmer et Payer la prime
  </button>
</form>
</div>

{/* Signature Visuelle Tricolore RDC fine */}
<div className="w-full h-1 bg-gradient-to-r from-[#00A3E0] via-[#CE1126] to-[#FDD100] opacity-30" />

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
