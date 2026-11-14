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
  FaTimes, FaChevronLeft, FaChevronRight 
} from 'react-icons/fa';

const formulas = [
  {
    id: 1,
    title: "Assurance Santé Famille (Tiers-Payant)",
    image: image1,
    icon: <FaHeartbeat className="text-[#CE1126] text-2xl" />,
    bgIcon: "bg-red-50",
    description: "Destinée à la diaspora pour couvrir les frais médicaux des parents et proches restés en RDC. Donne un accès direct à notre réseau de cliniques agréées.",
    guarantees: [
      "Consultations et urgences médicales 24h/7",
      "Hospitalisation et chirurgie prises en charge",
      "Pharmacie et médicaments couverts à 80%",
      "Zéro avance de fonds dans le réseau agréé"
    ],
    color: "border-t-4 border-[#CE1126]"
  },
  {
    id: 2,
    title: "Assurance Auto Obligatoire ARCA",
    image: image2,
    icon: <FaCar className="text-[#CE1126] text-2xl" />,
    bgIcon: "bg-red-50",
    description: "Garantie de Responsabilité Civile conforme au Code des Assurances de la RDC. Protégez les véhicules de votre famille contre les aléas de la route.",
    guarantees: [
      "Attestation officielle ARCA immédiate",
      "Responsabilité Civile (Dommages aux tiers)",
      "Défense et recours juridiques inclus",
      "Option bris de glace et vol disponible"
    ],
    color: "border-t-4 border-[#CE1126]"
  },
  {
    id: 3,
    title: "Protection Scolaire & Universitaire",
    image: image3,
    icon: <FaGraduationCap className="text-[#CE1126] text-2xl" />,
    bgIcon: "bg-red-50",
    description: "Sécurisez l'avenir éducatif de vos enfants, frères ou sœurs en RDC. Prise en charge des frais de scolarité en cas d'accident ou de coup dur de la vie.",
    guarantees: [
      "Garantie de paiement des frais de scolarité",
      "Couverture des accidents sur le trajet scolaire",
      "Frais de soins d'urgence en milieu scolaire",
      "Assistance administrative simplifiée"
    ],
    color: "border-t-4 border-[#CE1126]"
  },
  {
    id: 4,
    title: "Assistance Voyage & Diaspora",
    image: image4,
    icon: <FaPlane className="text-white text-2xl" />,
    bgIcon: "bg-slate-950",
    description: "Une formule sur-mesure pour les membres de la diaspora lors de leurs séjours temporaires ou d'affaires en République Démocratique du Congo.",
    guarantees: [
      "Rapatriement sanitaire vers l'étranger",
      "Frais médicaux d'urgence sur place",
      "Assurance perte de bagages et retards",
      "Assistance juridique internationale"
    ],
    color: "border-t-4 border-slate-950"
  },
  {
    id: 5,
    title: "Assurance Santé Collective & Mutuelle",
    image: image5,
    icon: <FaUsers className="text-white text-2xl" />,
    bgIcon: "bg-blue-600",
    description: "Une couverture médicale complète et attractive financée par l'employeur pour prendre en charge les consultations, les soins courants et les hospitalisations de vos salariés et de leurs familles nucléaires en RDC.",
    guarantees: [
      "Prise en charge intégrale des hospitalisations et chirurgies",
      "Consultations et soins courants pour l'employé et sa famille",
      "Accès direct au réseau de cliniques partenaires (Tiers Payant)",
      "Couverture des médicaments prescrits et examens de laboratoire"
    ],
    color: "border-t-4 border-blue-600"
  },
  {
    id: 6,
    title: "Accidents du Travail & Prévoyance",
    image: image6,
    icon: <FaShieldAlt className="text-white text-2xl" />,
    bgIcon: "bg-slate-950",
    description: "Une assurance privée complémentaire au régime obligatoire de la CNSS en RDC pour prémunir votre entreprise et protéger vos équipes face aux risques professionnels majeurs.",
    guarantees: [
      "Indemnisation en cas de décès accidentel ou invalidité",
      "Couverture des accidents survenus sur le lieu de travail ou en trajet",
      "Prise en charge des frais de secours et de transport d'urgence",
      "Rente d'incapacité temporaire ou permanente pour le salarié"
    ],
    color: "border-t-4 border-slate-950"
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
        <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          /* IMPORTANT : block + overflow-y-auto force le démarrage tout en haut sur mobile sans aucun espace vide */
          className="fixed inset-0 z-50 block bg-[#070b14]/95 backdrop-blur-xl text-white overflow-y-auto px-3 pt-3 pb-8 sm:p-6"
        >
          {/* ================= 1. EN-TÊTE TOUT EN HAUT ================= */}
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between mb-3">
            <span className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#CE1126] bg-[#CE1126]/10 border border-[#CE1126]/30">
              Catalogue Officiel
            </span>

            <button
              onClick={onClose}
              aria-label="Fermer la fenêtre"
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-[#CE1126] border border-slate-800 text-xs font-bold uppercase tracking-wider transition"
            >
              <span></span>
              <FaTimes size={14} />
            </button>
          </div>

          {/* ================= 2. CARROUSEL HORIZONTAL COLLÉ EN HAUT ================= */}
          <div className="relative max-w-7xl mx-auto w-full">
            {/* Bouton Flèche Gauche (Desktop) */}
            <button
              onClick={() => scrollToCard(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 h-12 w-12 items-center justify-center bg-[#090d16]/90 border border-slate-700 text-white hover:border-[#00A3E0] hover:text-[#00A3E0] disabled:opacity-30 transition shadow-xl"
            >
              <FaChevronLeft />
            </button>

            {/* Conteneur Défilant Horizontal */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth px-1 sm:px-16 py-1 no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {formulas.map((item, index) => {
                const isActive = index === activeIndex;

                               return (
                  <motion.div
                    key={item.id}
                    onClick={() => scrollToCard(index)}
                    animate={{
                      scale: isActive ? 1 : 0.96,
                      opacity: isActive ? 1 : 0.75
                    }}
                    transition={{ duration: 0.25 }}
                    className={`formula-card snap-center shrink-0 w-[86vw] sm:w-[400px] md:w-[430px] bg-[#0f1623] border border-slate-800 ${item.color} flex flex-col justify-between overflow-hidden shadow-2xl cursor-pointer`}
                  >
                    <div>
                      {/* Image compacte sur mobile (h-32) pour voir toute la carte dès l'ouverture */}
                      <div className="relative h-32 sm:h-48 w-full overflow-hidden bg-slate-900">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1623] via-transparent to-black/30" />

                        {/* Icône flottante */}
                        <div className={`absolute bottom-2.5 left-4 h-10 w-10 sm:bottom-3 sm:left-5 sm:h-12 sm:w-12 ${item.bgIcon} flex items-center justify-center shadow-lg border border-white/10`}>
                          {item.icon}
                        </div>

                        {/* Numéro de formule */}
                        <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 px-2.5 py-1 bg-black/70 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-slate-300 border border-white/10">
                          Formule 0{item.id}
                        </span>
                      </div>

                      {/* Contenu Textuel & Garanties */}
                      <div className="p-4 sm:p-6 space-y-2.5 sm:space-y-4">
                        <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                          {item.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Liste des garanties */}
                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5 sm:space-y-2.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                            Garanties incluses :
                          </p>
                          <ul className="space-y-1.5 sm:space-y-2">
                            {item.guarantees.map((guarantee, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                                <FaCheckCircle className="text-[#00A3E0] shrink-0 mt-0.5" size={12} />
                                <span>{guarantee}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Pied de carte avec Bouton d'Action */}
                    <div className="p-4 sm:p-6 pt-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFormula(item);
                        }}
                        className="w-full inline-flex items-center justify-center gap-3 bg-[#CE1126] hover:bg-[#a80d1e] px-5 py-3 sm:py-3.5 text-xs font-black uppercase tracking-[0.16em] text-white transition shadow-lg"
                      >
                        <span>Choisir & Simuler</span>
                        <FaArrowRight size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bouton Flèche Droite (Desktop) */}
            <button
              onClick={() => scrollToCard(Math.min(formulas.length - 1, activeIndex + 1))}
              disabled={activeIndex === formulas.length - 1}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 h-12 w-12 items-center justify-center bg-[#090d16]/90 border border-slate-700 text-white hover:border-[#00A3E0] hover:text-[#00A3E0] disabled:opacity-30 transition shadow-xl"
            >
              <FaChevronRight />
            </button>
          </div>

          {/* ================= 3. POINTS DE NAVIGATION & BOUTON CATALOGUE ================= */}
          <div className="max-w-xl mx-auto w-full flex flex-col items-center gap-2.5 mt-2">
            <div className="flex items-center gap-2">
              {formulas.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => scrollToCard(idx)}
                  aria-label={`Aller à la formule ${item.title}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeIndex === idx
                      ? 'w-7 bg-[#00A3E0]'
                      : 'w-2 bg-slate-600 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                onClose();
                navigate('/packs');
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00A3E0] hover:bg-[#008ec4] px-6 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-950 transition shadow-lg"
            >
              Voir tout le catalogue détaillé
            </button>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body

  );
}

