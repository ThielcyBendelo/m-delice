import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';

// Composants de structure
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';


// Icônes
import { FaShieldAlt, FaArrowRight, FaHeartbeat, FaCar, FaGraduationCap, FaPlaneDeparture, FaHospital, FaGlobeAfrica, FaUsers, FaLock, FaCheckCircle } from 'react-icons/fa';

// Assets (Vérifiez bien que ces fichiers existent dans src/assets/)
import santé from '../assets/santé.jpeg';
import auto from '../assets/auto.jpeg';
import scolarité from '../assets/scolarité.jpeg';
import voyage from '../assets/voyage.jpeg';
import accident from '../assets/accident.jpg';
import collective from '../assets/collective.jpg';
// import packDiaspo from '../assets/pack_diaspo.jpeg';
// import packMaman from '../assets/pack_maman.jpeg';
// import packScolaire from '../assets/pack_scolaire.jpeg';
// import tiersPayant from '../assets/tiers_payant.jpeg';

export default function Home() {
  const navigate = useNavigate();
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
      image: collective, // À remplacer idéalement par une image orientée "corporate/équipe" si disponible
      icon: FaUsers, // Changement d'icône (FaUsers ou FaBuilding) pour refléter l'aspect collectif
      color: '#00A3E0',
      action: 'Découvrir les offres entreprises',
      path: '/packs-micro', // Nouveau chemin adapté au parcours B2B
    },
    {
  id: 'accidents-prevoyance',
  label: 'Prévoyance Pro',
  eyebrow: 'Accidents du Travail & Prévoyance',
  title: 'Prémunissez votre entreprise, protégez vos équipes.',
  description: 'Une assurance privée complémentaire au régime obligatoire de la CNSS en RDC pour couvrir vos salariés face aux risques professionnels majeurs (accidents sur le lieu de travail, trajets, incapacités et secours d\'urgence).',
  image: accident, // Utilisez ici la nouvelle image générée dédiée à la prévoyance
  icon: FaShieldAlt, // Utilisation de FaShieldAlt (ou FaBriefcase/FaHardHat) pour marquer la protection et la sécurité au travail
  color: '#CE1126', // Utilisation du rouge de la charte RDC pour accentuer l'aspect sécurité/urgence, ou gardez '#00A3E0' selon vos préférences
  action: 'Découvrir les garanties prévoyance',
  path: '/prevoyance-entreprise', // Chemin mis à jour pour le produit Prévoyance
}
  ];
  const [activeProduct, setActiveProduct] = useState(0);
  // const partners = [
  //   { label: 'Réseau médical', title: 'Partenaires de soins', description: 'Un accès coordonné aux établissements et services de santé pour vos proches.', image: santé, icon: FaHospital, color: '#00A3E0' },
  //   { label: 'Protection diaspora', title: 'Garanties à distance', description: 'Suivez les besoins de votre famille depuis votre pays de résidence, avec une visibilité claire.', image: packDiaspo, icon: FaGlobeAfrica, color: '#7DD3FC' },
  //   { label: 'Familles', title: 'Protection familiale', description: 'Des solutions pensées pour prendre soin des personnes qui comptent au quotidien.', image: packMaman, icon: FaUsers, color: '#CE1126' },
  //   { label: 'Mobilité', title: 'Partenaires automobile', description: 'Une couverture pratique pour les déplacements et les imprévus sur le terrain.', image: auto, icon: FaCar, color: '#FDD100' },
  //   { label: 'Éducation', title: 'Avenir scolaire', description: 'Un accompagnement fiable pour protéger la continuité scolaire des enfants.', image: packScolaire, icon: FaGraduationCap, color: '#F59E0B' },
  //   { label: 'Voyage', title: 'Assistance internationale', description: 'Des garanties adaptées aux déplacements vers, depuis ou à travers l’Afrique.', image: voyage, icon: FaPlaneDeparture, color: '#38BDF8' },
  //   { label: 'Confiance', title: 'Cadre sécurisé', description: 'Une expérience suivie et documentée, construite autour de la conformité et de la transparence.', image: tiersPayant, icon: FaLock, color: '#10B981' },
  // ];
  // const [activePartner, setActivePartner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) setActiveProduct((current) => (current + 1) % products.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [products.length]);

  const product = products[activeProduct];
  const ProductIcon = product.icon;
  // const ActivePartnerIcon = partners[activePartner].icon;

  return (
    <div className="min-h-screen w-full bg-[#050811] flex flex-col antialiased font-sans text-slate-900 transition-colors duration-300">
      <NavbarSecured />

{/* ================= 1. SECTION HERO ================= */}
<section className="hero-section relative overflow-hidden border-b border-slate-800 bg-[#090d16] pt-24 text-white sm:pt-28">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Conteneur optimisé : force le défilement horizontal sur une seule ligne (mobile + desktop) sans afficher la barre de défilement brute */}
    <div className="mb-5 overflow-x-auto border-b border-slate-800 pb-2 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-2 pb-1">
        {products.map((item, index) => {
          const Icon = item.icon;
          const active = index === activeProduct;
          return (
            <button 
              key={item.id} 
              onClick={() => setActiveProduct(index)} 
              className={`flex min-w-[200px] sm:min-w-[240px] flex-1 items-center gap-3 border-b-2 px-3 py-3 text-left transition ${active ? 'border-[#00A3E0] bg-[#111827]' : 'border-transparent hover:bg-[#111827]'}`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center" style={{ color: active ? item.color : '#64748b', backgroundColor: active ? `${item.color}18` : '#111827' }}><Icon size={14} /></span>
              <span className="truncate"><strong className="block text-xs font-black text-white truncate">{item.label}</strong><small className="mt-0.5 block text-[10px] text-slate-500 truncate">{item.eyebrow}</small></span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
  
  <div className="mx-auto grid min-h-[560px] max-w-7xl items-center gap-8 px-4 pb-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:px-8 lg:pb-12">
    <div className="relative z-10 py-10 lg:py-16">
      <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        
        {/* ================= MASQUÉ SUR MOBILE (`hidden lg:inline-flex`) ================= */}
        <span className="hero-kicker hidden border-l-2 border-[#00A3E0] bg-[#111827] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#CE1126] shadow-sm lg:inline-flex">
          Protection accessible en RDC, en Afrique et partout dans le monde
        </span>
        
        {/* ================= MASQUÉ SUR MOBILE (`hidden lg:block`) ================= */}
        <h1 className="mt-6 hidden max-w-xl text-4xl font-black leading-[0.98] tracking-tight text-white sm:text-6xl lg:block">
          Protégez ceux qui comptent, <span className="text-[#00A3E0]">où qu’ils vivent.</span>
        </h1>
        
        {/* ================= MASQUÉ SUR MOBILE (`hidden lg:block`) ================= */}
        <p className="mt-6 hidden max-w-xl text-base leading-7 text-slate-300 sm:text-lg lg:block">
          ESNAS simplifie l’assurance pour vous et vos proches : choisissez une couverture, payez depuis votre pays et suivez chaque étape depuis un seul espace.
        </p>


        {/* ================= BLOC IMAGE VERSION MOBILE UNIQUEMENT ================= */}
        {/* ================= BLOC IMAGE VERSION MOBILE UNIQUEMENT ================= */}
<div className="relative mt-1 min-h-[300px] overflow-hidden bg-[#07111f] shadow-2xl shadow-black/30 sm:min-h-[380px] lg:hidden">
  <AnimatePresence mode="wait">
    <Motion.img 
      key={product.id} 
      src={product.image} 
      alt={product.label} 
      initial={{ opacity: 0, scale: 1.05 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.98 }} 
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} 
      className="absolute inset-0 h-full w-full object-cover" 
    />
  </AnimatePresence>
  
  {/* AMÉLIORATION 1 : Densification du dégradé intermédiaire (via-60 au lieu de via-20) */}
  <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/95 via-[#07111f]/60 to-transparent" />
  
  <AnimatePresence mode="wait">
    {/* AMÉLIORATION 2 : Ajout d'un fondu noir translucide localisé et de l'effet de flou pour isoler le texte des détails de l'image */}
    <Motion.div 
      key={`${product.id}-caption-mobile`} 
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      transition={{ duration: 0.45 }} 
      className="absolute inset-x-0 bottom-0 p-5 sm:p-7 text-white bg-gradient-to-t from-black/40 via-black/10 to-transparent backdrop-blur-[6px]"
    >
      {/* AMÉLIORATION 3 : Ajout d'ombres portées textuelles (drop-shadow) et augmentation de l'opacité du texte (white/90) */}
      <div className="mb-2 flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] drop-shadow-sm" style={{ color: product.color }}>
        <ProductIcon /> {product.eyebrow}
      </div>
      
      <h2 className="max-w-lg text-xl font-black leading-tight sm:text-2xl drop-shadow-md">
        {product.title}
      </h2>
      
      <p className="mt-2 max-w-xl text-xs leading-5 text-white/90 sm:text-sm font-medium drop-shadow-sm">
        {product.description}
      </p>
      
      <button 
        onClick={() => navigate(product.path)} 
        className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white hover:text-[#7DD3FC] drop-shadow-sm transition"
      >
        {product.action} <FaArrowRight size={11} />
      </button>
    </Motion.div>
  </AnimatePresence>
</div>

        {/* ========================================================================= */}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/packs-micro')} className="inline-flex items-center justify-center gap-3 bg-[#07111f] px-6 py-4 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-slate-900/15">
            Découvrir les protections <FaArrowRight size={12} />
          </Motion.button>
          <button onClick={() => navigate('/simulateur')} className="inline-flex items-center justify-center border border-slate-700 bg-transparent px-6 py-4 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:border-[#00A3E0] hover:text-[#00A3E0]">
            Simuler un tarif
          </button>
        </div>
      </Motion.div>
    </div>

    {/* ================= BLOC IMAGE VERSION DESKTOP UNIQUEMENT ================= */}
<div className="relative hidden pt-1 min-h-[330px] overflow-hidden bg-[#07111f] shadow-2xl shadow-black/30 sm:min-h-[420px] lg:block lg:min-h-[470px]">
  <AnimatePresence mode="wait">
    <Motion.img 
      key={product.id} 
      src={product.image} 
      alt={product.label} 
      initial={{ opacity: 0, scale: 1.05 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.98 }} 
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} 
      className="absolute inset-0 h-full w-full object-cover" 
    />
  </AnimatePresence>
  
  {/* AMÉLIORATION 1 : Augmentation de l'opacité du dégradé sombre (via-60 au lieu de via-10) pour assombrir la zone textuelle */}
  <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/95 via-[#07111f]/60 to-transparent" />
  
  <AnimatePresence mode="wait">
    {/* AMÉLIORATION 2 : Ajout d'un fond texturé subtil (bg-black/10), d'un flou d'arrière-plan (backdrop-blur-md) et d'un léger ombrage textuel pour détacher chaque lettre */}
    <Motion.div 
      key={`${product.id}-caption-desktop`} 
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      transition={{ duration: 0.45 }} 
      className="absolute inset-x-0 bottom-0 p-6 sm:p-9 text-white bg-gradient-to-t from-black/40 via-black/10 to-transparent backdrop-blur-[6px]"
    >
      {/* AMÉLIORATION 3 : Ajout de la classe drop-shadow-md sur les titres et textes pour garantir le contraste même si le fond est clair */}
      <div className="mb-4 flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] drop-shadow-sm" style={{ color: product.color }}>
        <ProductIcon /> {product.eyebrow}
      </div>
      
      <h2 className="max-w-lg text-2xl font-black leading-tight sm:text-4xl drop-shadow-md">
        {product.title}
      </h2>
      
      <p className="mt-3 max-w-xl text-sm leading-6 text-white/90 sm:text-base font-medium drop-shadow-sm">
        {product.description}
      </p>
      
      <button 
        onClick={() => navigate(product.path)} 
        className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white hover:text-[#7DD3FC] drop-shadow-sm transition"
      >
        {product.action} <FaArrowRight size={11} />
      </button>
    </Motion.div>
  </AnimatePresence>
</div>
</div>
</section>



{/* ================= 3. SECTION RÉASSURANCE ================= */}
{/* <section className="border-t border-slate-800 bg-[#050811] py-16 md:py-24">
  <Motion.div
    initial={{ opacity: 0, y: 30 }} 
    whileInView={{ opacity: 1, y: 0 }} 
    viewport={{ once: true }} 
    transition={{ duration: 0.8 }}
    className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
  >
    <div className="mb-10 max-w-3xl">
      <div className="mb-4 flex items-center gap-3 text-[#CE1126]"><FaShieldAlt /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Réassurance et confiance</span></div>
      <h3 className="text-3xl font-black uppercase leading-tight text-white md:text-5xl">Des partenaires pour protéger <span className="text-[#CE1126]">chaque étape.</span></h3>
      <p className="mt-4 text-base leading-7 text-slate-400">Découvrez les sept piliers qui structurent l’expérience ESNAS, de la prise en charge médicale au suivi sécurisé.</p>
    </div>
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
      <div className="relative min-h-[360px] overflow-hidden bg-[#111827] lg:min-h-[480px]">
        <AnimatePresence mode="wait"><Motion.img key={partners[activePartner].label} src={partners[activePartner].image} alt={partners[activePartner].title} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} className="absolute inset-0 h-full w-full object-cover" /></AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 sm:p-9"><p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: partners[activePartner].color }}>{partners[activePartner].label}</p><h4 className="mt-2 text-2xl font-black text-white sm:text-4xl">{partners[activePartner].title}</h4></div>
      </div>
      <div className="flex flex-col justify-between border border-slate-800 bg-[#090d16] p-5 sm:p-7">
        <div className="space-y-3"><div className="flex items-center gap-3" style={{ color: partners[activePartner].color }}><ActivePartnerIcon /><span className="text-xs font-black uppercase tracking-[0.16em]">Partenaire ESNAS</span></div><p className="text-sm leading-7 text-slate-300 sm:text-base">{partners[activePartner].description}</p><div className="flex items-center gap-2 text-xs font-bold text-emerald-400"><FaCheckCircle /> Engagement suivi et documenté</div></div>
        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">{partners.map((partner, index) => { const Icon = partner.icon; return <button key={partner.label} onClick={() => setActivePartner(index)} className={`flex items-center gap-2 border p-3 text-left text-[10px] font-black uppercase tracking-wider transition ${index === activePartner ? 'border-[#CE1126] bg-[#CE1126]/10 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-white'}`}><Icon style={{ color: partner.color }} />{partner.label}</button>; })}</div>
      </div>
    </div>
    <button onClick={() => navigate('/partenaires-garanties')} className="mt-8 inline-flex items-center gap-3 border border-white bg-white px-7 py-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-black transition hover:bg-transparent hover:text-white">Découvrir nos partenaires <FaArrowRight size={12} /></button>

  </Motion.div>
</section> */}

      <FAQSection />
      <Footer />
    </div>
  );
}
