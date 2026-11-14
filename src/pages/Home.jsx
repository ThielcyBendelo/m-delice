import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import ProtectionsModal from '../components/ProtectionsModal';
import { 
  FaShieldAlt, FaArrowRight, FaHeartbeat, FaCar, FaGraduationCap, 
  FaPlaneDeparture, FaUsers 
} from 'react-icons/fa';

import santé from '../assets/santé.jpeg';
import auto from '../assets/auto.jpeg';
import scolarité from '../assets/scolarité.jpeg';
import voyage from '../assets/voyage.jpeg';
import accident from '../assets/accident.jpg';
import collective from '../assets/collective.jpg';

export default function Home() {
  const navigate = useNavigate();
  const [activeProduct, setActiveProduct] = useState(0);
  const [isProtectionsOpen, setIsProtectionsOpen] = useState(false);

  const products = [
    {
      id: 'sante',
      label: 'Santé médicale',
      eyebrow: 'Soins essentiels',
      title: 'La santé de vos proches, où que vous soyez.',
      description: 'Organisez une couverture fiable pour vous, votre famille ou un proche en RDC et en Afrique, avec une prise en charge claire au moment où elle compte.',
      image: santé,
      icon: FaHeartbeat,
      color: '#00A3E0',
      action: 'Voir les offres santé',
      path: '/packs-micro',
    },
    {
      id: 'auto',
      label: 'Automobile',
      eyebrow: 'Mobilité protégée',
      title: 'Roulez avec une protection pensée pour le terrain.',
      description: 'Protégez votre véhicule et simplifiez la gestion des sinistres avec une solution accessible depuis la RDC, l’Afrique ou l’étranger.',
      image: auto,
      icon: FaCar,
      color: '#FDD100',
      action: 'Découvrir automobile',
      path: '/packs-micro',
    },
    {
      id: 'scolarite',
      label: 'Scolarité',
      eyebrow: 'Avenir des enfants',
      title: 'Gardez leur parcours scolaire sur la bonne voie.',
      description: 'Anticipez les imprévus et accompagnez la scolarité de vos enfants ou proches, avec un financement simple et un suivi centralisé.',
      image: scolarité,
      icon: FaGraduationCap,
      color: '#CE1126',
      action: 'Voir les offres scolaires',
      path: '/packs-micro',
    },
    {
      id: 'voyage',
      label: 'Voyage',
      eyebrow: 'Déplacements sereins',
      title: 'Partez couvert, revenez l’esprit tranquille.',
      description: 'Une assistance adaptée à vos déplacements vers, depuis ou à l’intérieur de l’Afrique : santé, bagages et imprévus réunis.',
      image: voyage,
      icon: FaPlaneDeparture,
      color: '#7DD3FC',
      action: 'Explorer voyage',
      path: '/packs-micro',
    },
    {
      id: 'Assurance Santé Collective & Mutuelle',
      label: 'Entreprise',
      eyebrow: 'Assurance Collective',
      title: 'Protégez vos équipes, boostez votre performance.',
      description: 'Offrez une couverture médicale fiable et attractive à vos salariés et à leurs familles en RDC et en Afrique. Un levier clé de fidélisation avec une gestion simplifiée pour l\'employeur.',
      image: collective,
      icon: FaUsers,
      color: '#00A3E0',
      action: 'Découvrir les offres entreprises',
      path: '/packs-micro',
    },
    {
      id: 'accidents-prevoyance',
      label: 'Prévoyance Pro',
      eyebrow: 'Accidents du Travail & Prévoyance',
      title: 'Prémunissez votre entreprise, protégez vos équipes.',
      description: 'Une assurance privée complémentaire au régime obligatoire de la CNSS en RDC pour couvrir vos salariés face aux risques professionnels majeurs (accidents sur le lieu de travail, trajets, incapacités et secours d\'urgence).',
      image: accident,
      icon: FaShieldAlt,
      color: '#CE1126',
      action: 'Découvrir les garanties prévoyance',
      path: '/prevoyance-entreprise',
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden && !isProtectionsOpen) {
        setActiveProduct((current) => (current + 1) % products.length);
      }
    }, 7000);
    return () => clearInterval(timer);
  }, [products.length, isProtectionsOpen]);

  const product = products[activeProduct];
  const ProductIcon = product.icon;

  return (
    <div className="min-h-screen w-full bg-[#050811] flex flex-col antialiased font-sans text-slate-900 transition-colors duration-300">
      <NavbarSecured />

      {/* ================= 1. SECTION HERO ================= */}
      <section className="hero-section relative overflow-hidden border-b border-slate-800 bg-[#090d16] pt-16 text-white sm:pt-20">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Barre d'onglets avec espacement bas réduit (mb-2 au lieu de mb-5) */}
    <div className="mb-2 overflow-x-auto border-b border-slate-800 pb-1.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-2 pb-1">
        {products.map((item, index) => {
          const Icon = item.icon;
          const active = index === activeProduct;
          return (
            <button
              key={item.id}
              onClick={() => setActiveProduct(index)}
              className={`flex min-w-[200px] sm:min-w-[240px] flex-1 items-center gap-3 border-b-2 px-3 py-2.5 text-left transition ${
                active ? 'border-[#00A3E0] bg-[#111827]' : 'border-transparent hover:bg-[#111827]'
              }`}
            >
              <span
                className="grid h-8 w-8 shrink-0 place-items-center"
                style={{
                  color: active ? item.color : '#64748b',
                  backgroundColor: active ? `${item.color}18` : '#111827',
                }}
              >
                <Icon size={14} />
              </span>
              <span className="truncate">
                <strong className="block text-xs font-black text-white truncate">{item.label}</strong>
                <small className="mt-0.5 block text-[10px] text-slate-500 truncate">{item.eyebrow}</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  </div>

  {/* Grille alignée en haut sur desktop (lg:items-start, pt-2, min-h réduit) */}
  <div className="mx-auto grid max-w-7xl items-center gap-4 px-4 pb-8 pt-2 sm:px-6 lg:min-h-[440px] lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12 lg:px-8 lg:pb-8 lg:pt-3">
    {/* Colonne Gauche : Titre, Description et Boutons remontés */}
    <div className="relative z-10 py-4 lg:py-2">
      <Motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <span className="hero-kicker hidden border-l-2 border-[#00A3E0] bg-[#111827] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#CE1126] shadow-sm lg:inline-flex">
          Protection accessible en RDC, en Afrique et partout dans le monde
        </span>

        <h1 className="mt-3 hidden max-w-xl text-4xl font-black leading-[0.98] tracking-tight text-white sm:text-5xl xl:text-6xl lg:block">
          Protégez ceux qui comptent, <span className="text-[#00A3E0]">où qu’ils vivent.</span>
        </h1>

        <p className="mt-4 hidden max-w-xl text-base leading-6 text-slate-300 lg:block">
          ESNAS simplifie l’assurance pour vous et vos proches : choisissez une couverture, payez depuis votre pays et suivez chaque étape depuis un seul espace
        </p>

        {/* ================= BLOC IMAGE VERSION MOBILE UNIQUEMENT ================= */}
        <div className="relative mt-1 min-h-[300px] overflow-hidden bg-[#07111f] shadow-2xl shadow-black/30 sm:min-h-[380px] lg:hidden">
          <AnimatePresence mode="wait">
            <Motion.img
              key={product.id}
              src={product.image}
              alt={product.label}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="h-[320px] w-full object-cover sm:h-[400px]"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="inline-flex items-center gap-2 bg-black/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
              <ProductIcon style={{ color: product.color }} /> {product.eyebrow}
            </span>
            <h2 className="mt-2 text-xl font-black text-white">{product.title}</h2>
          </div>
        </div>

        {/* ================= BOUTONS D'ACTION (REMONTÉS) ================= */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsProtectionsOpen(true)}
            className="inline-flex items-center justify-center gap-3 bg-[#07111f] border border-slate-800 hover:border-[#CE1126] hover:bg-[#CE1126] px-6 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-slate-900/15 transition"
          >
            Découvrir les protections <FaArrowRight size={12} />
          </Motion.button>

          <button
            onClick={() => navigate('/simulateur')}
            className="inline-flex items-center justify-center border border-slate-700 bg-transparent px-6 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:border-[#00A3E0] hover:text-[#00A3E0]"
          >
            Simuler un tarif
          </button>
        </div>
      </Motion.div>
    </div>

    {/* ================= BLOC IMAGE VERSION DESKTOP UNIQUEMENT ================= */}
    <div className="relative hidden lg:flex lg:items-center lg:justify-center overflow-hidden bg-[#07111f] border border-slate-800/80 shadow-2xl shadow-black/50 rounded-none">
      <AnimatePresence mode="wait">
        <Motion.img
          key={product.id}
          src={product.image}
          alt={product.label}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full h-[380px] xl:h-[410px] object-contain bg-[#07111f]"
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/35 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 border border-white/10 bg-[#090d16]/90 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: product.color }}>
              {product.eyebrow}
            </span>
            <h2 className="mt-0.5 text-xl font-black text-white">{product.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-300 line-clamp-2">{product.description}</p>
          </div>
          <button
            onClick={() => setIsProtectionsOpen(true)}
            className="shrink-0 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-950 transition hover:bg-[#00A3E0]"
          >
            Détails
          </button>
        </div>
      </div>
    </div>
  </div>
</section>
      <Footer />

      {/* ================= MODALE CARROUSEL DES PROTECTIONS ================= */}
      <ProtectionsModal
        isOpen={isProtectionsOpen}
        onClose={() => setIsProtectionsOpen(false)}
      />
    </div>
  );
}
