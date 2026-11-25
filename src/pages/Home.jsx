import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import NavbarSecured from '../components/NavbarSecured';
// import Footer from '../components/Footer';
// import ProtectionsModal from '../components/ProtectionsModal';
import {
  FaShieldAlt,
  FaArrowRight,
  FaHeartbeat,
  FaCar,
  FaGraduationCap,
  FaPlaneDeparture,
  FaUsers,
  FaCalculator,
  FaBuilding,
  FaHandsHelping,
  FaStore,
  FaTruck,
  FaSeedling,
  FaBriefcase,
  FaHardHat,
  FaMobileAlt,
  FaLock
} from 'react-icons/fa';

import santé from '../assets/pack_maman.jpeg';
import auto from '../assets/pack_auto.jpeg';
import scolarité from '../assets/pack_scolaire.jpeg';
import voyage from '../assets/pack_diaspo.jpeg';
import accident from '../assets/pack-accident.jpg';
import collective from '../assets/pack-collective.jpg';
import habitation from '../assets/pack-collective.jpg';
import obseques from '../assets/pack-collective.jpg';
import pme from '../assets/pack-collective.jpg';
import transport from '../assets/pack-collective.jpg';
import agricole from '../assets/pack-collective.jpg';
import rc_pro from '../assets/pack-collective.jpg';
import chantier from '../assets/pack-collective.jpg';
import micro from '../assets/pack-collective.jpg';
import cyber from '../assets/pack-collective.jpg';

export default function Home() {
  const navigate = useNavigate();
  const [activeProduct, setActiveProduct] = useState(0);
  const [isProtectionsOpen, setIsProtectionsOpen] = useState(false);

// 2. Tableau complet des 15 produits / branches :
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
  },
  {
    id: 'habitation',
    label: 'Habitation',
    eyebrow: 'Multirisque Habitation',
    title: 'Sécurisez votre foyer et vos biens au quotidien.',
    description: 'Protégez votre maison, votre appartement et vos équipements contre l’incendie, les dégâts des eaux, le vol et les imprévus domestiques en RDC.',
    image: collective, // Remplacez par votre import image habitation si disponible
    icon: FaBuilding,
    color: '#F59E0B',
    action: 'Voir les offres habitation',
    path: '/packs-micro',
  },
  {
    id: 'obseques',
    label: 'Obsèques & Rapatriement',
    eyebrow: 'Sérénité familiale',
    title: 'Anticipez l’essentiel et soutenez votre famille sans délai.',
    description: 'Financement immédiat des funérailles en RDC et organisation complète du rapatriement de corps depuis la diaspora avec assistance 24h/24.',
    image: santé, // Remplacez par votre import image obsèques si disponible
    icon: FaHandsHelping,
    color: '#F43F5E',
    action: 'Découvrir obsèques',
    path: '/packs-micro',
  },
  {
    id: 'pme',
    label: 'Multirisque PME',
    eyebrow: 'Commerces & Activités',
    title: 'Protégez votre local commercial, vos stocks et votre activité.',
    description: 'Une couverture complète pour boutiques, pharmacies, restaurants et bureaux congolais contre le vol, l’incendie et les pertes d’exploitation.',
    image: collective,
    icon: FaStore,
    color: '#FB923C',
    action: 'Voir les packs PME',
    path: '/packs-micro',
  },
  {
    id: 'transport',
    label: 'Transport & Fret',
    eyebrow: 'Logistique & Marchandises',
    title: 'Sécurisez vos cargaisons de Matadi jusqu’à l’intérieur du pays.',
    description: 'Couverture Tous Risques pour vos marchandises transportées par route, fleuve Congo, voie maritime ou aérienne.',
    image: auto,
    icon: FaTruck,
    color: '#818CF8',
    action: 'Explorer transport & fret',
    path: '/packs-micro',
  },
  {
    id: 'agricole',
    label: 'Agricole & Élevage',
    eyebrow: 'Agro-industrie RDC',
    title: 'Protégez vos récoltes, plantations et cheptels.',
    description: 'Indemnisation face aux aléas climatiques (sécheresse, inondations), incendies agricoles et pertes sanitaires pour exploitants et coopératives.',
    image: collective,
    icon: FaSeedling,
    color: '#A3E635',
    action: 'Découvrir agricole',
    path: '/packs-micro',
  },
  {
    id: 'rc_pro',
    label: 'RC Professionnelle',
    eyebrow: 'Protection Métiers',
    title: 'Exercez votre métier en toute sérénité face aux litiges.',
    description: 'Couverture des erreurs, omissions et fautes professionnelles pour consultants, médecins, ingénieurs, cabinets et prestataires IT.',
    image: accident,
    icon: FaBriefcase,
    color: '#38BDF8',
    action: 'Voir RC Professionnelle',
    path: '/packs-micro',
  },
  {
    id: 'chantier',
    label: 'Chantier & BTP',
    eyebrow: 'Construction & Infrastructures',
    title: 'Couvrez vos ouvrages en construction et vos engins.',
    description: 'Protection globale des chantiers immobiliers, matériaux entreposés, engins de génie civil et responsabilité envers les riverains.',
    image: accident,
    icon: FaHardHat,
    color: '#EAB308',
    action: 'Découvrir offres BTP',
    path: '/packs-micro',
  },
  {
    id: 'micro',
    label: 'Micro-Assurance',
    eyebrow: 'Accessible dès 5 $/mois',
    title: 'La protection essentielle à portée de Mobile Money.',
    description: 'Souscription instantanée sans paperasse via M-Pesa, Airtel Money ou Orange Money pour travailleurs indépendants, commerçants et jeunes actifs.',
    image: santé,
    icon: FaMobileAlt,
    color: '#2DD4BF',
    action: 'Voir la micro-assurance',
    path: '/packs-micro',
  },
  {
    id: 'cyber',
    label: 'Cyber-Risques',
    eyebrow: 'Sécurité Numérique',
    title: 'Protégez vos données, vos serveurs et votre activité digitale.',
    description: 'Assistance cybersécurité 24h/24, restauration de systèmes et couverture contre les ransomwares et fuites de données pour startups et entreprises.',
    image: collective,
    icon: FaLock,
    color: '#A78BFA',
    action: 'Explorer cyber-risques',
    path: '/packs-micro',
  },
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
    <div className="min-h-screen w-full bg-[#050811] flex flex-col antialiased font-sans text-white transition-colors duration-300">
      <NavbarSecured />

      
            {/* ================= 1. SECTION HERO COMPACTE ================= */}
      <section className="hero-section relative overflow-hidden border-b border-slate-800 bg-[#090d16] pt-24 text-white sm:pt-16">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          
          {/* Barre d'onglets ultra-compacte */}
          <div className="mb-2 overflow-x-auto border-b border-slate-800/90 pb-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-1.5 pb-0.5">
              {products.map((item, index) => {
                const Icon = item.icon;
                const active = index === activeProduct;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveProduct(index)}
                    className={`flex min-w-[145px] sm:min-w-[185px] flex-1 items-center gap-2 border-b-2 px-2.5 py-2 text-left transition cursor-pointer ${
                      active ? 'border-[#00A3E0] bg-[#111827]' : 'border-transparent hover:bg-[#111827]/70'
                    }`}
                  >
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center"
                      style={{
                        color: active ? item.color : '#64748b',
                        backgroundColor: active ? `${item.color}18` : '#111827',
                      }}
                    >
                      <Icon size={12} />
                    </span>
                    <span className="truncate">
                      <strong className="block text-[11px] font-black text-white truncate">{item.label}</strong>
                      <small className="block text-[9px] text-slate-400 truncate">{item.eyebrow}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grille principale Hero */}
        <div className="mx-auto grid max-w-7xl items-center gap-4 px-3 pb-6 pt-1 sm:px-6 lg:min-h-[390px] lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-10 lg:px-8 lg:pb-8 lg:pt-3">
          
          {/* Colonne Gauche : Titre, Description & Boutons (Desktop uniquement) */}
          <div className="relative z-10 py-1 lg:py-2">
            <Motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <span className="hero-kicker hidden border-l-2 border-[#00A3E0] bg-[#111827] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#CE1126] shadow-sm lg:inline-flex">
                Protection accessible en RDC, en Afrique et dans le monde
              </span>

              <h1 className="mt-2.5 hidden max-w-xl text-3xl font-black leading-[1.02] tracking-tight text-white xl:text-5xl lg:block">
                Protégez ceux qui comptent, <span className="text-[#00A3E0]">où qu’ils vivent.</span>
              </h1>

              <p className="mt-3 hidden max-w-lg text-sm leading-relaxed text-slate-300 lg:block">
                ESNAS simplifie l’assurance pour vous et vos proches : choisissez une couverture, payez depuis votre pays et suivez chaque étape depuis un seul espace.
              </p>

              {/* BOUTONS D'ACTION : MASQUÉS SUR MOBILE */}
              <div className="mt-5 hidden lg:flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(product.path)}
                  className="px-4 py-2.5 bg-[#CE1126] hover:bg-[#a80d1e] text-white font-black text-[11px] uppercase tracking-[0.14em] inline-flex items-center gap-2 transition-colors rounded-none shadow-lg cursor-pointer"
                >
                  <span>{product.action}</span>
                  <FaArrowRight className="text-xs" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/work')}
                  className="px-4 py-2.5 bg-[#111827] hover:bg-slate-800 border border-slate-700 text-white font-black text-[11px] uppercase tracking-[0.14em] inline-flex items-center gap-2 transition-colors rounded-none cursor-pointer"
                >
                  <FaCalculator className="text-[#00A3E0] text-xs" />
                  <span>Simuler un devis</span>
                </button>
              </div>

              {/* BLOC VISUEL VERSION MOBILE UNIQUEMENT (SANS BOUTONS) */}
              <div 
                onClick={() => navigate(product.path)}
                className="relative mt-1 min-h-[260px] sm:min-h-[320px] overflow-hidden border border-slate-800 bg-[#07111f] shadow-xl lg:hidden cursor-pointer"
              >
                <AnimatePresence mode="wait">
                  <Motion.img
                    key={product.id}
                    src={product.image}
                    alt={product.label}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                    className="h-[260px] sm:h-[320px] w-full object-cover object-center opacity-75"
                  />
                </AnimatePresence>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050811] via-[#050811]/90 to-transparent p-4 flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="grid h-6 w-6 place-items-center"
                      style={{ backgroundColor: `${product.color}25`, color: product.color }}
                    >
                      <ProductIcon size={12} />
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-300">
                      {product.eyebrow}
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-black leading-tight text-white">
                    {product.title}
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-300 line-clamp-2 leading-snug">
                    {product.description}
                  </p>
                </div>
              </div>
            </Motion.div>
          </div>

          {/* Colonne Droite : Visuel & Carte Produit (DESKTOP UNIQUEMENT) */}
          <div className="relative hidden lg:block h-[350px] overflow-hidden border border-slate-800 bg-[#07111f] shadow-2xl">
            <AnimatePresence mode="wait">
              <Motion.img
                key={product.id}
                src={product.image}
                alt={product.label}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="h-full w-full object-cover object-center opacity-80"
              />
            </AnimatePresence>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050811] via-[#050811]/90 to-transparent p-5 flex items-end justify-between gap-4">
              <div className="max-w-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="grid h-7 w-7 place-items-center"
                    style={{ backgroundColor: `${product.color}25`, color: product.color }}
                  >
                    <ProductIcon size={14} />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                    {product.eyebrow}
                  </span>
                </div>

                <h2 className="text-lg font-black leading-snug text-white">
                  {product.title}
                </h2>

                <p className="mt-1 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate(product.path)}
                className="hidden lg:inline-flex shrink-0 items-center gap-2 bg-[#111827]/95 hover:bg-[#CE1126] border border-slate-700 hover:border-[#CE1126] px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-white transition-colors rounded-none cursor-pointer"
              >
                <span>Explorer</span>
                <FaArrowRight size={10} />
              </button>
            </div>
          </div>

        </div>
      </section>
</div>
  );
}