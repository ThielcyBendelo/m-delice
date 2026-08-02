import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Composants de structure
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';

// Importation explicite des images locales pour le build Vite
import image1 from '../assets/pack_maman.jpeg'; 
import image2 from '../assets/pack_auto.jpeg';
import image3 from '../assets/pack_scolaire.jpeg';
import image4 from '../assets/pack_diaspo.jpeg';

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
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col antialiased font-sans w-full">
      <NavbarSecured />

      {/* ================= 1. EN-TÊTE CATALOGUE (VERSION SOMBRE ONYX) ================= */}
      <header className="relative flex flex-col bg-[#090d16] overflow-hidden border-b border-slate-900 rounded-none">
        <div className="relative z-20 max-w-6xl mx-auto px-6 py-20 pt-32 text-center flex flex-col items-center w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full flex flex-col items-center">
            
            {/* Badge de certification */}
            <span className="inline-block px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#CE1126] bg-[#CE1126]/10 border border-[#CE1126]/20 border-l-2 border-l-[#CE1126] rounded-none">
              Catalogue Officiel des Garanties
            </span>
            
            {/* Titre Blanc Éclatant */}
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-none uppercase">
              Nos Solutions de <span className="text-[#CE1126] italic normal-case">Protection</span>
            </h1>
            
            {/* Description Gris Argent */}
            <p className="max-w-3xl mx-auto text-[#94a3b8] text-base md:text-xl leading-relaxed font-semibold">
              Découvrez le détail technique de nos formules agréées. Des contrats transparents conçus pour apporter une sérénité totale à la diaspora et à leurs bénéficiaires locaux en RDC.
            </p>

          </motion.div>
        </div>
      </header>

      {/* ================= 2. GRILLE DES FORMULES D'ASSURANCE (BENTO SOMBRES / RECTANGLE STRICT) ================= */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-16 w-full bg-[#090d16]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 w-full">
          {formulas.map((formula, idx) => (
            <motion.div
              key={formula.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              className="bg-[#111827] overflow-hidden shadow-2xl flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 border border-slate-800 group rounded-none text-left"
            >
              <div>
                {/* Zone Image : 100% nette, fusion vers le fond sombre du bento */}
                {formula.image && (
                  <div className="relative w-full h-60 md:h-72 overflow-hidden bg-slate-950 rounded-none">
                    <img 
                      src={formula.image} 
                      alt={formula.title} 
                      className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 opacity-90"
                      loading="lazy"
                    />
                    {/* Overlay de contraste Fintech */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent z-10 opacity-70" />
                  </div>
                )}

                {/* Contenu textuel interne */}
                <div className="p-6 md:p-10 pb-4">
                  {/* Icône carrée Bento */}
                  <div className={`w-14 h-14 ${formula.bgIcon} rounded-none border border-slate-800 flex items-center justify-center mb-6 shadow-md`}>
                    {formula.icon}
                  </div>

                  {/* Titre Formule Blanc Pur */}
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-4 leading-tight group-hover:text-[#CE1126] transition-colors duration-200">
                    {formula.title}
                  </h3>
                  
                  {/* Description secondaire Gris Argent */}
                  <p className="text-[#94a3b8] text-sm md:text-base leading-relaxed font-semibold mb-8">
                    {formula.description}
                  </p>

                  {/* Liste des Garanties */}
                  <div className="space-y-4 mb-6">
                    <h4 className="text-[10px] md:text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                      <FaHospitalSymbol className="text-[#CE1126]" /> Garanties Clés Incluses :
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      {formula.guarantees.map((guarantee, gIdx) => (
                        <div key={gIdx} className="flex items-start gap-3 text-xs md:text-sm text-slate-300 font-semibold leading-tight">
                          <FaCheckCircle className="text-[#CE1126] mt-0.5 flex-shrink-0" size={14} />
                          <span>{guarantee}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone d'action : Bouton rectangulaire haute visibilité blanc vers rouge */}
              <div className="p-6 md:p-10 pt-6 border-t border-slate-800 bg-slate-950/40">
                <button
                  onClick={() => navigate('/simulateur')}
                  className="w-full py-5 border-2 border-white bg-white text-black font-extrabold uppercase text-[10px] md:text-[11px] tracking-[0.25em] shadow-md transition-all duration-300 hover:bg-[#CE1126] hover:text-white hover:border-[#CE1126] flex items-center justify-center gap-3 rounded-none active:scale-[0.98] focus:outline-none"
                >
                  Souscrire cette formule <FaArrowRight size={12} className="text-[#CE1126] group-hover:text-white transition-colors" />
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
