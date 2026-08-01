// AJOUT EXPLICITE DE useEffect DANS LES IMPORTS DE BASE
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import { 
  FaShieldAlt, FaHeartbeat, FaCar, FaGraduationCap, 
  FaPlane, FaCheckCircle, FaShoppingCart, FaInfoCircle,
  FaTimes, FaLock, FaWhatsapp, FaDownload 
} from 'react-icons/fa';

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

  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Tous");

  // CONFIGURATION DES ÉTATS DE PILOTAGE POUR LA MODALE
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);

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

      {/* ================= 1. EN-TÊTE DU CATALOGUE ET FILTRES ÉPURÉS ================= */}
      <header className="relative flex flex-col bg-white overflow-hidden border-b border-slate-100">
        <div className="relative z-20 max-w-6xl mx-auto px-6 py-20 pt-32 text-center flex flex-col items-center w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full flex flex-col items-center">
            
            <span className="px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-red-600 bg-red-50 border border-red-100 flex items-center gap-2">
              <FaShoppingCart size={11} /> Souscription Immédiate
            </span>
            
            <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tight leading-none uppercase">
              Packs <span className="text-[#CE1126] italic">Micro-Assurance</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-slate-500 text-lg md:text-xl leading-relaxed font-light">
              Sélectionnez une formule claire, ajustée aux réalités locales de la RD Congo. Pas de frais cachés, résiliation libre à tout moment.
            </p>

            {/* Boutons de filtrage dynamiques style FinTech épuré */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-6 py-3 text-[11px] font-extrabold uppercase tracking-wider transition-all border-2 ${
                    activeFilter === cat
                      ? "border-[#CE1126] bg-red-50/50 text-[#CE1126]"
                      : "border-slate-100 bg-slate-50/40 text-slate-400 hover:border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </motion.div>
        </div>
      </header>

{/* ================= 2. GRILLE DES OFFRES DE MICRO-ASSURANCE ================= */}
<main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-16 w-full">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
    {filteredPacks.map((pack, idx) => (
      <motion.div
        key={pack.id}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: idx * 0.05 }}
        className={`bg-white border flex flex-col justify-between relative transition-all duration-500 hover:shadow-2xl rounded-none ${
          pack.isPopular 
            ? "border-2 border-[#CE1126] shadow-lg" 
            : "border-slate-100 shadow-md"
        }`}
      >
        {/* Badge "Plus Populaire" rectangulaire strict */}
        {pack.isPopular && (
          <span className="absolute -top-3 right-6 bg-[#CE1126] text-white text-[9px] uppercase font-black tracking-widest px-4 py-1.5 shadow-sm rounded-none">
            Le plus choisi
          </span>
        )}

        {/* En-tête de la carte */}
        <div className="p-6 md:p-8 border-b border-slate-50">
          <div className="flex items-center justify-between mb-6">
            {/* Conteneur d'icône 100% carré */}
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 flex items-center justify-center text-[#CE1126] rounded-none">
              {pack.icon}
            </div>
            {/* Badge de catégorie rectangulaire */}
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 border border-slate-100/60 rounded-none">
              {pack.category}
            </span>
          </div>
          
          <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mb-1">
            {pack.name}
          </h3>
          <p className="text-xs text-slate-400 font-medium italic mb-6">
            {pack.tagline}
          </p>
          
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{pack.price} USD</span>
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">/ {pack.period}</span>
          </div>
        </div>

        {/* Détails de couverture et garanties */}
        <div className="p-6 md:p-8 flex-grow space-y-6">
          {/* Alerte de limite de couverture rectangulaire */}
          <div className="flex items-center gap-2.5 text-[10px] md:text-[11px] font-black uppercase tracking-wider text-red-600 bg-red-50/50 px-4 py-3 border border-red-100/40 rounded-none">
            <FaInfoCircle className="flex-shrink-0" />
            <span>{pack.coverageLimit}</span>
          </div>
          
          <ul className="space-y-4">
            {pack.features.map((feat, index) => (
              <li key={index} className="flex items-start gap-3 text-sm font-semibold text-slate-600 leading-snug">
                <FaCheckCircle className="text-red-600 mt-0.5 flex-shrink-0" size={14} />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bouton d'action final : Rectangulaire strict */}
        <div className="p-6 md:p-8 pt-0">
          <button
            onClick={() => handleSubscription(pack)}
            className={`w-full py-4 md:py-5 font-black uppercase text-[10px] md:text-[11px] tracking-[0.25em] shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 rounded-none ${
              pack.isPopular
                ? "bg-red-600 hover:bg-red-700 text-white shadow-2xl"
                : "bg-slate-950 hover:bg-slate-800 text-white"
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
      />
    </div>
  );
}


// ================= PASSERELLE LOGIQUE MULTI-OPÉRATEURS DE LA RDC =================
function MobileMoneyModal({ isOpen, onClose, pack }) {
  const [etape, setEtape] = useState('selection'); 
  const [operateur, setOperateur] = useState(null);
  const [telephone, setTelephone] = useState('');
  const [numeroAttestation, setNumeroAttestation] = useState('');

   useEffect(() => {
    if (isOpen) {
      setEtape('selection');
      setOperateur(null);
      setTelephone('');
    }
  }, [isOpen]);

  if (!pack) return null;

  const ExecuterPaiement = (e) => {
    e.preventDefault();
    if (!operateur || telephone.length < 9) return;
    setEtape('attente');
    setTimeout(() => {
      const randNum = Math.floor(100000 + Math.random() * 900000);
      setNumeroAttestation(`DRC-ARCA-${randNum}`);
      setEtape('succes');
    }, 4000);
  };

    return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="w-full max-w-md bg-white border border-slate-100 rounded-none shadow-2xl overflow-hidden relative"
          >
            {/* BOUTON FERMER : Angles droits style Luxe */}
            {etape !== 'attente' && (
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-600 rounded-none transition-colors z-30"
              >
                <FaTimes size={16} />
              </button>
            )}

            {/* ================= ÉTAPE 1 : SELECTION ET FORMULAIRE ================= */}
            {etape === 'selection' && (
              <div className="p-8 space-y-8">
                <div className="text-center space-y-2 pr-6">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{pack.name}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{pack.tagline}</p>
                </div>

                {/* Récapitulatif Devis */}
                <div className="bg-slate-50 p-5 rounded-2xl text-center border border-slate-100 flex justify-between items-center">
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total de la prime</span>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">
                      {pack.price} USD <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">/ {pack.period}</span>
                    </p>
                  </div>
                  <span className="text-[10px] bg-red-50 text-red-600 font-black px-3 py-1.5 rounded-lg border border-red-100 uppercase tracking-widest">
                    Taxes ARCA Incluses
                  </span>
                </div>

                <form onSubmit={ExecuterPaiement} className="space-y-6">
                  {/* Choix de l'opérateur Mobile Money */}
                  <div className="space-y-3">
                    <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 block">1. Réseau Mobile Money RDC</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'mpesa', nom: 'M-Pesa', selectClass: 'border-[#CE1126] bg-red-50/50 text-[#CE1126]' },
                        { id: 'orange', nom: 'Orange', selectClass: 'border-orange-500 bg-orange-50/50 text-orange-600' },
                        { id: 'airtel', nom: 'Airtel', selectClass: 'border-rose-600 bg-rose-50/50 text-rose-600' }
                      ].map((op) => (
                        <button
                          key={op.id} 
                          type="button" 
                          onClick={() => setOperateur(op.id)}
                          className={`py-3.5 text-[11px] font-black uppercase tracking-wider border-2 text-center transition-all ${
                            operateur === op.id 
                              ? op.selectClass 
                              : 'border-slate-100 bg-slate-50/40 text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          {op.nom}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Numéro de téléphone */}
                  <div className="space-y-3">
                    <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 block">2. Numéro de téléphone (9 chiffres)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-0 bottom-3 text-lg font-bold text-slate-400 pointer-events-none">+243</span>
                      <input 
                        type="tel" 
                        required 
                        placeholder="812345678" 
                        minLength={9} 
                        maxLength={9}
                        value={telephone} 
                        onChange={(e) => setTelephone(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-14 border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 focus:placeholder-transparent font-mono"
                      />
                    </div>
                  </div>

                  {/* Action finale : Rectangulaire, Rouge, Contraste maximum */}
                  <button 
                    type="submit" 
                    disabled={!operateur || telephone.length !== 9} 
                    className="w-full py-5 bg-red-600 text-white font-black uppercase text-[11px] tracking-[0.25em] shadow-2xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    <FaLock size={10} /> Confirmer et Payer la prime
                  </button>
                </form>
              </div>
            )}

            {/* ================= ÉTAPE 2 : ATTENTE APPROBATION ================= */}
            {etape === 'attente' && (
              <div className="p-10 text-center space-y-6 flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                <div className="space-y-3">
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Approbation requise</h3>
                  <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto leading-relaxed italic">
                    Saisissez votre <span className="font-extrabold text-slate-900">code PIN secret</span> directement sur l'écran de votre téléphone pour valider le débit de la transaction.
                  </p>
                </div>
              </div>
            )}

            {/* ================= ÉTAPE 3 : RÉSULTAT SUCCÈS ================= */}
            {etape === 'succes' && (
              <div className="p-8 text-center space-y-8">
                <div className="w-16 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-red-100 shadow-sm">
                  ✓
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Souscription Réussie !</h3>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Votre attestation a été validée et enregistrée par l'ARCA.</p>
                </div>

                {/* Fiche récapitulative de contrat style Bento */}
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl text-left font-mono space-y-3 text-xs text-slate-600 font-semibold">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                    <span className="text-slate-400 uppercase text-[10px]">Contrat ARCA :</span> 
                    <span className="font-bold text-red-600">{numeroAttestation}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                    <span className="text-slate-400 uppercase text-[10px]">Garantie :</span> 
                    <span className="text-slate-900 font-bold">{pack.coverageLimit}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400 uppercase text-[10px]">Canal :</span> 
                    <span className="text-[#25D366] font-bold flex items-center gap-1.5"><FaWhatsapp size={14} /> WhatsApp Actif</span>
                  </div>
                </div>

                {/* Bouton de téléchargement rectangulaire noir */}
                <div className="pt-2">
                  <button 
                    onClick={onClose} 
                    className="w-full py-5 bg-slate-950 text-white font-extrabold uppercase text-[11px] tracking-[0.25em] hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Terminer et retourner au tableau de bord
                  </button>
                </div>
              </div>
            )}

            {/* Signature Visuelle Tricolore Panafricaine (RDC) très subtile en bas */}
            <div className="w-full h-1 bg-gradient-to-r from-red-600 via-blue-500 to-yellow-400 opacity-20" />

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
