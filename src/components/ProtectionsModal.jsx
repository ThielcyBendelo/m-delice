import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Importation explicite des images locales
import image1 from '../assets/pack_maman.jpeg'; 
import image2 from '../assets/pack_auto.jpeg';
import image3 from '../assets/pack_scolaire.jpeg';
import image4 from '../assets/pack_diaspo.jpeg';
import image5 from '../assets/pack-collective.jpg';
import image6 from '../assets/pack-accident.jpg';

// Icônes
import { 
  FaShieldAlt, FaHeartbeat, FaCar, FaGraduationCap, 
  FaPlane, FaCheckCircle, FaArrowRight, FaUsers, 
  FaTimes, FaChevronLeft, FaChevronRight, FaHome 
} from 'react-icons/fa';

const formulas = [
  {
    id: 1,
    shortLabel: "Santé Famille",
    title: "Assurance Santé Famille (Tiers-Payant)",
    image: image1,
    icon: <FaHeartbeat className="text-[#CE1126] text-base sm:text-lg" />,
    bgIcon: "bg-[#CE1126]/15 border-[#CE1126]/40",
    description: "Destinée à la diaspora pour couvrir les frais médicaux des parents et proches restés en RDC. Donne un accès direct à notre réseau de cliniques agréées.",
    guarantees: [
      "Consultations et urgences médicales 24h/7",
      "Hospitalisation et chirurgie prises en charge",
      "Pharmacie et médicaments couverts à 80%",
      "Zéro avance de fonds dans le réseau agréé"
    ],
    color: "border-t-2 border-[#CE1126]"
  },
  {
    id: 2,
    shortLabel: "Auto ARCA",
    title: "Assurance Auto Obligatoire ARCA",
    image: image2,
    icon: <FaCar className="text-[#CE1126] text-base sm:text-lg" />,
    bgIcon: "bg-[#CE1126]/15 border-[#CE1126]/40",
    description: "Garantie de Responsabilité Civile conforme au Code des Assurances de la RDC. Protégez les véhicules de votre famille contre les aléas de la route.",
    guarantees: [
      "Attestation officielle ARCA immédiate",
      "Responsabilité Civile (Dommages aux tiers)",
      "Défense et recours juridiques inclus",
      "Option bris de glace et vol disponible"
    ],
    color: "border-t-2 border-[#CE1126]"
  },
  {
    id: 3,
    shortLabel: "Scolarité",
    title: "Protection Scolaire & Universitaire",
    image: image3,
    icon: <FaGraduationCap className="text-[#CE1126] text-base sm:text-lg" />,
    bgIcon: "bg-[#CE1126]/15 border-[#CE1126]/40",
    description: "Sécurisez l'avenir éducatif de vos enfants, frères ou sœurs en RDC. Prise en charge des frais de scolarité en cas d'accident ou de coup dur de la vie.",
    guarantees: [
      "Garantie de paiement des frais de scolarité",
      "Couverture des accidents sur le trajet scolaire",
      "Frais de soins d'urgence en milieu scolaire",
      "Assistance administrative simplifiée"
    ],
    color: "border-t-2 border-[#CE1126]"
  },
  {
    id: 4,
    shortLabel: "Voyage",
    title: "Assistance Voyage & Diaspora",
    image: image4,
    icon: <FaPlane className="text-[#00A3E0] text-base sm:text-lg" />,
    bgIcon: "bg-[#00A3E0]/15 border-[#00A3E0]/40",
    description: "Une formule sur-mesure pour les membres de la diaspora lors de leurs séjours temporaires ou d'affaires en République Démocratique du Congo.",
    guarantees: [
      "Rapatriement sanitaire vers l'étranger",
      "Frais médicaux d'urgence sur place",
      "Assurance perte de bagages et retards",
      "Assistance juridique internationale"
    ],
    color: "border-t-2 border-[#00A3E0]"
  },
  {
    id: 5,
    shortLabel: "Entreprise",
    title: "Assurance Santé Collective & Mutuelle",
    image: image5,
    icon: <FaUsers className="text-[#00A3E0] text-base sm:text-lg" />,
    bgIcon: "bg-[#00A3E0]/15 border-[#00A3E0]/40",
    description: "Une couverture médicale complète financée par l'employeur pour prendre en charge les consultations, soins courants et hospitalisations de vos salariés et familles en RDC.",
    guarantees: [
      "Prise en charge intégrale des hospitalisations et chirurgies",
      "Consultations et soins courants pour l'employé et sa famille",
      "Accès direct au réseau de cliniques partenaires (Tiers Payant)",
      "Couverture des médicaments prescrits et examens de labo"
    ],
    color: "border-t-2 border-[#00A3E0]"
  },
  {
    id: 6,
    shortLabel: "Prévoyance Pro",
    title: "Accidents du Travail & Prévoyance",
    image: image6,
    icon: <FaShieldAlt className="text-emerald-400 text-base sm:text-lg" />,
    bgIcon: "bg-emerald-500/15 border-emerald-500/40",
    description: "Une assurance privée complémentaire au régime obligatoire de la CNSS en RDC pour prémunir votre entreprise et protéger vos équipes face aux risques professionnels.",
    guarantees: [
      "Indemnisation en cas de décès accidentel ou invalidité",
      "Couverture des accidents sur le lieu de travail ou trajet",
      "Prise en charge des frais de secours et transport d'urgence",
      "Rente d'incapacité temporaire ou permanente pour le salarié"
    ],
    color: "border-t-2 border-emerald-500"
  }
];

export default function ProtectionsModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToCard = (index) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cards = container.querySelectorAll('.formula-card');
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
      setActiveIndex(index);
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollCenter = container.scrollLeft + container.offsetWidth / 2;
    const cards = container.querySelectorAll('.formula-card');
    
    cards.forEach((card, idx) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      if (Math.abs(scrollCenter - cardCenter) < card.offsetWidth / 2) {
        setActiveIndex(idx);
      }
    });
  };

  const handleSelectFormula = (formula) => {
    onClose();
    navigate('/simulateur', { state: { selectedFormula: formula.title } });
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-[#070b14]/95 backdrop-blur-xl text-white overflow-y-auto px-3 pt-3 pb-6 sm:p-5"
        >
          {/* ================= 1. EN-TÊTE COMPACT TOUT EN HAUT ================= */}
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/90">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/');
                }}
                title="Retour à l'accueil"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111827] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
              >
                <FaHome className="text-xs text-[#00A3E0]" />
                <span className="hidden sm:inline">Accueil</span>
              </button>

              <span className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#CE1126] bg-[#CE1126]/10 border border-[#CE1126]/30">
                Catalogue Officiel • {activeIndex + 1}/{formulas.length}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la fenêtre"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#CE1126] border border-slate-800 hover:border-[#CE1126] text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
            >
              <span>Fermer</span>
              <FaTimes size={12} />
            </button>
          </div>

          {/* ================= 2. CARROUSEL HORIZONTAL COMPACT ================= */}
          <div className="relative max-w-6xl mx-auto w-full my-auto">
            {/* Bouton Flèche Gauche (Desktop) */}
            <button
              type="button"
              onClick={() => scrollToCard(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              aria-label="Formule précédente"
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 h-10 w-10 items-center justify-center bg-[#090d16]/95 border border-slate-700 text-white hover:border-[#00A3E0] hover:text-[#00A3E0] disabled:opacity-25 transition shadow-xl cursor-pointer"
            >
              <FaChevronLeft size={13} />
            </button>

            {/* Conteneur Défilant Horizontal */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex items-stretch gap-3 sm:gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth px-1 md:px-12 py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {formulas.map((item) => (
                <div
                  key={item.id}
                  className={`formula-card snap-center shrink-0 w-[88vw] sm:w-[360px] md:w-[390px] bg-[#111827] border border-slate-800 ${item.color} shadow-2xl flex flex-col justify-between overflow-hidden rounded-none`}
                >
                  <div>
                    {/* Visuel supérieur compact */}
                    <div className="relative h-36 sm:h-40 w-full bg-[#050811] overflow-hidden border-b border-slate-800">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover object-center opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/35 to-transparent" />

                      {/* Badge Icône & Tag */}
                      <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                        <div className={`w-9 h-9 border flex items-center justify-center shrink-0 ${item.bgIcon}`}>
                          {item.icon}
                        </div>
                        <span className="px-2 py-0.5 bg-[#090d16]/90 border border-slate-700 text-[9px] font-black uppercase tracking-widest text-slate-300">
                          Pack #{item.id} • ARCA
                        </span>
                      </div>
                    </div>

                    {/* Contenu de la formule */}
                    <div className="p-4 space-y-2.5 text-left">
                      <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>

                      {/* Liste compacte des 4 garanties */}
                      <ul className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        {item.guarantees.map((guarantee, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-200 font-medium leading-tight">
                            <FaCheckCircle className="text-emerald-400 text-xs shrink-0 mt-0.5" />
                            <span>{guarantee}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Bouton d'action en bas de carte */}
                  <div className="p-4 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSelectFormula(item)}
                      className="w-full py-2.5 px-4 bg-[#CE1126] hover:bg-[#a80d1e] text-white font-black text-[11px] uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-colors rounded-none cursor-pointer shadow-md"
                    >
                      <span>Simuler cette formule</span>
                      <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bouton Flèche Droite (Desktop) */}
            <button
              type="button"
              onClick={() => scrollToCard(Math.min(formulas.length - 1, activeIndex + 1))}
              disabled={activeIndex === formulas.length - 1}
              aria-label="Formule suivante"
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 h-10 w-10 items-center justify-center bg-[#090d16]/95 border border-slate-700 text-white hover:border-[#00A3E0] hover:text-[#00A3E0] disabled:opacity-25 transition shadow-xl cursor-pointer"
            >
              <FaChevronRight size={13} />
            </button>
          </div>

          {/* ================= 3. INDICATEURS DE NAVIGATION RAPIDE ================= */}
          <div className="max-w-6xl mx-auto w-full mt-3 flex flex-wrap items-center justify-center gap-1.5">
            {formulas.map((f, idx) => (
              <button
                key={f.id}
                type="button"
                onClick={() => scrollToCard(idx)}
                className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border transition-colors cursor-pointer ${
                  activeIndex === idx
                    ? 'bg-[#CE1126] border-[#CE1126] text-white'
                    : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {f.shortLabel}
              </button>
            ))}
          </div>

        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
