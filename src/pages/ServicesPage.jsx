import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Composants de structure
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';

// Importation explicite des images locales pour le build Vite
import image1 from '../assets/image1.png'; 
import image2 from '../assets/image2.png';
import image3 from '../assets/image3.png';
import image4 from '../assets/image4.png';

// Icônes épurées
import { 
  FaShieldAlt, FaHeartbeat, FaCar, FaGraduationCap, 
  FaPlane, FaCheckCircle, FaArrowRight, FaHospitalSymbol 
} from 'react-icons/fa';

export default function ServicesPage() {
  const navigate = useNavigate();

  // Tableau de données harmonisé (Rouge unique et Noir profond pour l'Assistance)
  const formulas = [
    {
      id: 1,
      title: "Assurance Santé Famille (Tiers-Payant)",
      image: image1,
      icon: <FaHeartbeat className="text-[#CE1126] text-3xl" />,
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
      icon: <FaCar className="text-[#CE1126] text-3xl" />,
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
      icon: <FaGraduationCap className="text-[#CE1126] text-3xl" />,
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
      icon: <FaPlane className="text-white text-3xl" />,
      bgIcon: "bg-slate-950",
      description: "Une formule sur-mesure pour les membres de la diaspora lors de leurs séjours temporaires ou d'affaires en République Démocratique du Congo.",
      guarantees: [
        "Rapatriement sanitaire vers l'étranger",
        "Frais médicaux d'urgence sur place",
        "Assurance perte de bagages et retards",
        "Assistance juridique internationale"
      ],
      color: "border-t-4 border-slate-950"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased font-sans">
      <NavbarSecured />

      {/* ================= 1. EN-TÊTE CATALOGUE (Style Épuré International) ================= */}
      <header className="relative flex flex-col bg-white overflow-hidden border-b border-slate-100">
        <div className="relative z-20 max-w-6xl mx-auto px-6 py-20 pt-32 text-center flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <span className="px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 border-l-2 border-[#CE1126]">
              Catalogue Officiel des Garanties
            </span>
            <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tight leading-none">
              Nos Solutions de <span className="text-[#CE1126] italic">Protection</span>
            </h1>
            <p className="max-w-2xl mx-auto text-slate-500 text-lg md:text-xl leading-relaxed font-light">
              Découvrez le détail technique de nos formules agréées. Des contrats transparents conçus pour apporter une sérénité totale à la diaspora et à leurs bénéficiaires locaux en RDC.
            </p>
          </motion.div>
        </div>
      </header>

      {/* ================= 2. GRILLE DES FORMULES D'ASSURANCE ================= */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {formulas.map((formula, idx) => (
            <motion.div
              key={formula.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              className={`bg-white rounded-[2rem] overflow-hidden shadow-md flex flex-col justify-between hover:shadow-2xl transition-all duration-500 border border-slate-100 group ${formula.color}`}
            >
              <div>
                {/* Zone Image locale (Assets) */}
                {formula.image && (
                  <div className="relative w-full h-56 md:h-64 overflow-hidden bg-slate-950">
                    <img 
                      src={formula.image} 
                      alt={formula.title} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-40 z-10" />
                  </div>
                )}

                {/* Contenu textuel interne */}
                <div className="p-8 md:p-10 pb-0">
                  <div className={`w-14 h-14 ${formula.bgIcon} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                    {formula.icon}
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4 leading-tight">
                    {formula.title}
                  </h3>
                  <p className="text-base text-slate-500 leading-relaxed font-medium mb-8">
                    {formula.description}
                  </p>

                  {/* Garanties incluses */}
                  <div className="space-y-4 mb-8">
                    <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2 mb-4">
                      <FaHospitalSymbol className="text-[#CE1126]" /> Garanties Clés Incluses :
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {formula.guarantees.map((guarantee, gIdx) => (
                        <div key={gIdx} className="flex items-start gap-3 text-sm text-slate-700 font-semibold leading-tight">
                          <FaCheckCircle className="text-red-600 mt-0.5 flex-shrink-0" size={14} />
                          <span>{guarantee}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 🟢 CORRIGÉ & SÉCURISÉ : Zone d'action finale complétée avec boutons rectangulaires haute visibilité */}
              <div className="p-8 md:p-10 pt-6 border-t border-slate-50 bg-slate-50/50">
                <button
                  onClick={() => navigate('/simulateur')}
                  className="w-full py-4 border-2 border-[#CE1126] bg-white text-black font-extrabold uppercase text-[11px] tracking-[0.25em] shadow-sm transition-all hover:bg-[#CE1126] hover:text-white flex items-center justify-center gap-2"
                >
                  Souscrire cette formule <FaArrowRight size={11} />
                </button>
              </div>

            </motion.div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}