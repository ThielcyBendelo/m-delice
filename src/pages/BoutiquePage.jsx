import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { insurancePacks, CATEGORIES_DATA } from '../data/insurancePacks';
import { 
  FaShieldAlt, FaHeartbeat, FaCar, FaGraduationCap, 
  FaPlane, FaCheckCircle, FaShoppingCart, FaHome,
  FaTimes, FaLock, FaWhatsapp, FaFilter, FaSearch,
  FaBuilding, FaUsers, FaHardHat, FaBars, FaCalculator,
  FaExclamationTriangle, FaArrowRight, FaCreditCard, FaStar, FaHandsHelping, FaStore,
  FaTruck, FaSeedling, FaBriefcase, FaMobileAlt
} from 'react-icons/fa';


export default function BoutiquePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");

  useEffect(() => {
    const state = location.state;
    if (state?.triggerPayment && state?.pack) {
      setSelectedPack(state.pack);
      setIsPayModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

// 2. Tableau complet des 15 catégories + "Tous" (exactement aligné avec insurancePacks.js) :
const categories = [
  { name: "Tous", icon: FaShieldAlt, color: "text-white" },
  { name: "Santé", icon: FaHeartbeat, color: "text-[#CE1126]" },
  { name: "Automobile", icon: FaCar, color: "text-[#FDD100]" },
  { name: "Scolaire", icon: FaGraduationCap, color: "text-[#00A3E0]" },
  { name: "Voyage", icon: FaPlane, color: "text-purple-400" },
  { name: "Habitation", icon: FaBuilding, color: "text-amber-400" },
  { name: "Assurances Collectives", icon: FaUsers, color: "text-cyan-400" },
  { name: "Accidents Travail & Prévoyance", icon: FaHardHat, color: "text-emerald-400" },
  { name: "Obsèques & Rapatriement", icon: FaHandsHelping, color: "text-rose-400" },
  { name: "Multirisque PME", icon: FaStore, color: "text-orange-400" },
  { name: "Transport & Fret", icon: FaTruck, color: "text-indigo-400" },
  { name: "Agricole & Élevage", icon: FaSeedling, color: "text-lime-400" },
  { name: "RC Professionnelle", icon: FaBriefcase, color: "text-sky-400" },
  { name: "Chantier & BTP", icon: FaHardHat, color: "text-yellow-500" },
  { name: "Micro-Assurance", icon: FaMobileAlt, color: "text-teal-400" },
  { name: "Cyber-Risques", icon: FaLock, color: "text-violet-400" }
];

// 3. Fonction getCategoryIcon mise à jour pour afficher la bonne icône sur chaque carte :
const getCategoryIcon = (category) => {
  switch (category) {
    case "Santé": return <FaHeartbeat className="text-[#CE1126] text-base" />;
    case "Automobile": return <FaCar className="text-[#FDD100] text-base" />;
    case "Scolaire": return <FaGraduationCap className="text-[#00A3E0] text-base" />;
    case "Voyage": return <FaPlane className="text-purple-400 text-base" />;
    case "Habitation": return <FaBuilding className="text-amber-400 text-base" />;
    case "Assurances Collectives": return <FaUsers className="text-cyan-400 text-base" />;
    case "Accidents Travail & Prévoyance": return <FaHardHat className="text-emerald-400 text-base" />;
    case "Obsèques & Rapatriement": return <FaHandsHelping className="text-rose-400 text-base" />;
    case "Multirisque PME": return <FaStore className="text-orange-400 text-base" />;
    case "Transport & Fret": return <FaTruck className="text-indigo-400 text-base" />;
    case "Agricole & Élevage": return <FaSeedling className="text-lime-400 text-base" />;
    case "RC Professionnelle": return <FaBriefcase className="text-sky-400 text-base" />;
    case "Chantier & BTP": return <FaHardHat className="text-yellow-500 text-base" />;
    case "Micro-Assurance": return <FaMobileAlt className="text-teal-400 text-base" />;
    case "Cyber-Risques": return <FaLock className="text-violet-400 text-base" />;
    default: return <FaShieldAlt className="text-white text-base" />;
  }
};

  // Filtrage combiné (Catégorie + Recherche)
  const filteredPacks = useMemo(() => {
    return insurancePacks.filter((pack) => {
      const matchCat = activeFilter === "Tous" || pack.category === activeFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        pack.name.toLowerCase().includes(q) ||
        pack.tagline.toLowerCase().includes(q) ||
        pack.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeFilter, searchQuery]);

  const handleSubscription = (pack) => {
    setSelectedPack(pack);
    setIsPayModalOpen(true);
  };

  const handleConfirmCheckout = () => {
    setIsPayModalOpen(false);
    navigate('/inscription-beneficiaire', {
      state: { selectedPack, paymentMethod }
    });
  };

  // Sidebar réutilisable (Desktop fixe + Mobile drawer)
  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between bg-[#090d16] text-white select-none">
      <div className="p-3.5 space-y-4 overflow-y-auto">
        
        {/* Logo / Titre Sidebar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#CE1126] inline-block" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
              ESNAS <span className="text-[#CE1126]">PACKS</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white bg-[#111827] border border-slate-800"
          >
            <FaTimes size={12} />
          </button>
        </div>

        {/* Bouton Retour Accueil */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-2 px-3 py-2 bg-[#111827] hover:bg-[#CE1126] border border-slate-800 hover:border-[#CE1126] text-[11px] font-black uppercase tracking-wider text-slate-200 hover:text-white transition-colors cursor-pointer"
        >
          <FaHome className="text-xs" />
          <span>Accueil Plateforme</span>
        </button>

        {/* Liste des 7 Catégories + Tous */}
        <div className="space-y-1.5">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 px-1">
            Branches d&apos;Assurance ({insurancePacks.length})
          </p>
          <div className="space-y-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeFilter === cat.name;
              const count =
                cat.name === "Tous"
                  ? insurancePacks.length
                  : insurancePacks.filter((p) => p.category === cat.name).length;

              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setActiveFilter(cat.name);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 text-left text-[11px] font-bold border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#CE1126]/15 border-[#CE1126] text-white shadow-sm'
                      : 'bg-[#111827]/50 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Icon className={`${cat.color} shrink-0 text-xs`} />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#090d16] text-slate-300 shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pied du Sidebar */}
      <div className="p-3.5 border-t border-slate-800 bg-[#050811] space-y-2">
        <button
          type="button"
          onClick={() => navigate('/work')}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#111827] hover:bg-slate-800 border border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-200 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <FaCalculator className="text-[#00A3E0]" /> Devis Sur-Mesure
          </span>
          <FaArrowRight size={9} className="text-slate-500" />
        </button>

        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 pt-1">
          <FaLock className="text-emerald-400" />
          <span>Agrément ARCA • RDC</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex antialiased font-sans">
      
      {/* ================= 1. SIDEBAR FIXE DE HAUT EN BAS (DESKTOP) ================= */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 border-r border-slate-800 z-40">
        <SidebarContent />
      </aside>

      {/* SIDEBAR COULISSANT (MOBILE) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/75 z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] border-r border-slate-800 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ================= 2. CONTENU PRINCIPAL (DÉCALÉ DE w-64 SUR DESKTOP) ================= */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        
        {/* MINI NAVBAR STICKY MODERNE */}
        <header className="sticky top-0 z-30 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800">
          <div className="px-3 sm:px-6 h-13 sm:h-14 flex items-center justify-between gap-2.5">
            
            {/* Gauche : Menu mobile + Accueil + Titre */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111827] border border-slate-800 hover:border-[#CE1126] text-white text-[10px] font-black uppercase tracking-wider"
              >
                <FaBars size={12} className="text-[#CE1126]" />
                <span>Catégories</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="lg:hidden p-2 bg-[#111827] border border-slate-800 text-slate-300 hover:text-white"
                title="Retour à l'accueil"
              >
                <FaHome size={12} />
              </button>

              <div className="truncate">
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#CE1126] block leading-none">
                  Catalogue Micro-Assurance RDC
                </span>
                <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white truncate mt-0.5">
                  {activeFilter === "Tous" ? "Toutes les Formules" : activeFilter}
                </h1>
              </div>
            </div>

            {/* Droite : Barre de recherche rapide */}
            <div className="flex items-center gap-2 flex-1 max-w-xs justify-end">
              <div className="relative w-full">
                <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[11px]" />
                <input
                  type="text"
                  placeholder="Rechercher un pack..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 bg-[#111827] border border-slate-800 focus:border-[#00A3E0] text-xs font-bold text-white outline-none placeholder-slate-500 rounded-none"
                />
              </div>
            </div>
          </div>

          {/* Barre horizontale rapide des catégories sur Mobile/Tablet */}
          <div className="lg:hidden flex overflow-x-auto gap-1.5 px-3 py-2 border-t border-slate-800/80 bg-[#050811] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveFilter(cat.name)}
                className={`shrink-0 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border transition-colors ${
                  activeFilter === cat.name
                    ? 'bg-[#CE1126] border-[#CE1126] text-white'
                    : 'bg-[#111827] border-slate-800 text-slate-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </header>

        {/* GRILLE COMPACTE DES PACKS */}
        <main className="flex-grow px-3 sm:px-6 py-4 sm:py-6">
          
          {/* Bandeau d'état */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 bg-[#111827] border border-slate-800 px-3.5 py-2.5">
            <p className="text-[11px] sm:text-xs text-slate-300 font-medium">
              Souscription immédiate en <span className="text-white font-bold">USD</span> via Mobile Money ou Carte Diaspora. Attestation QR Code instantanée.
            </p>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#090d16] border border-slate-800 text-[#00A3E0]">
              {filteredPacks.length} pack{filteredPacks.length > 1 ? 's' : ''} affiché{filteredPacks.length > 1 ? 's' : ''}
            </span>
          </div>

          {filteredPacks.length === 0 ? (
            <div className="bg-[#111827] border border-slate-800 p-10 text-center space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Aucun pack ne correspond à votre recherche.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("Tous");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-[#CE1126] text-white text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                Afficher tous les packs
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredPacks.map((pack) => (
                <div
                  key={pack.id}
                  className={`bg-[#111827] border ${
                    pack.isPopular ? 'border-[#CE1126]' : 'border-slate-800 hover:border-slate-600'
                  } p-4 flex flex-col justify-between transition-all duration-200 rounded-none shadow-lg relative`}
                >
                  <div>
                    {/* En-tête de la carte */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-[#090d16] border border-slate-800 flex items-center justify-center shrink-0">
                          {getCategoryIcon(pack.category)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block truncate">
                            {pack.category}
                          </span>
                          <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight truncate">
                            {pack.name}
                          </h2>
                        </div>
                      </div>

                      {pack.isPopular && (
                        <span className="shrink-0 px-2 py-0.5 bg-[#CE1126] text-white text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                          <FaStar size={8} /> Populaire
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug mb-3 line-clamp-2">
                      {pack.tagline}
                    </p>

                    {/* Bloc Prix & Plafond */}
                    <div className="bg-[#090d16] border border-slate-800/90 px-3 py-2 mb-3 flex items-baseline justify-between gap-2">
                      <div>
                        <span className="text-lg sm:text-xl font-black text-white">
                          {pack.price} $
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold ml-1">
                          {pack.period}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-400 text-right">
                        {pack.coverageLimit}
                      </span>
                    </div>

                    {/* Liste compacte des garanties */}
                    <ul className="space-y-1.5 mb-4">
                      {pack.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-slate-300 leading-tight">
                          <FaCheckCircle className="text-emerald-400 text-[10px] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bouton Souscrire */}
                  <button
                    type="button"
                    onClick={() => handleSubscription(pack)}
                    className="w-full py-2.5 px-3 bg-[#CE1126] hover:bg-[#a80d1e] text-white font-black text-[10px] uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-colors rounded-none cursor-pointer"
                  >
                    <FaShoppingCart size={11} />
                    <span>Souscrire ce pack</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ================= 3. MODALE DE SOUSCRIPTION & PAIEMENT RDC ================= */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isPayModalOpen && selectedPack && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
              >
                <motion.div
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  className="bg-[#111827] border border-slate-700 w-full max-w-md text-white shadow-2xl rounded-none overflow-hidden"
                >
                  {/* Header Modale */}
                  <div className="bg-[#090d16] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaLock className="text-emerald-400 text-xs" />
                      <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                        Activation Rapide du Contrat
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPayModalOpen(false)}
                      className="text-slate-400 hover:text-white p-1 cursor-pointer"
                    >
                      <FaTimes size={13} />
                    </button>
                  </div>

                  {/* Contenu Modale */}
                  <div className="p-4 sm:p-5 space-y-4">
                    <div className="bg-[#090d16] p-3 border border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#CE1126] block">
                          {selectedPack.category}
                        </span>
                        <h3 className="text-sm font-black text-white">
                          {selectedPack.name}
                        </h3>
                        <span className="text-[10px] text-slate-400">
                          {selectedPack.coverageLimit}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xl font-black text-white block">
                          {selectedPack.price} $
                        </span>
                        <span className="text-[9px] text-slate-400 uppercase">
                          {selectedPack.period}
                        </span>
                      </div>
                    </div>

                    {/* Choix du canal de paiement */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Mode de règlement prévu
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'mpesa', label: 'M-Pesa / Airtel / Orange' },
                          { id: 'card', label: 'Carte Visa / Diaspora' }
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPaymentMethod(m.id)}
                            className={`p-2.5 border text-[10px] font-black uppercase tracking-wider text-center transition-colors cursor-pointer ${
                              paymentMethod === m.id
                                ? 'border-[#00A3E0] bg-[#00A3E0]/15 text-white'
                                : 'border-slate-800 bg-[#090d16] text-slate-400'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                      <FaWhatsapp className="text-emerald-400 text-sm shrink-0 mt-0.5" />
                      <span>
                        À l&apos;étape suivante, renseignez l&apos;identité du bénéficiaire en RDC pour générer immédiatement son attestation QR Code.
                      </span>
                    </p>

                    <button
                      type="button"
                      onClick={handleConfirmCheckout}
                      className="w-full py-3 px-4 bg-[#CE1126] hover:bg-[#a80d1e] text-white font-black text-xs uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Continuer vers l&apos;inscription</span>
                      <FaArrowRight size={11} />
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
