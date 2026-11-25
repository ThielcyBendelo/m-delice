import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// import Footer from '../components/Footer';
import { 
  FaHospital, FaWrench, FaMapMarkerAlt, FaPhoneAlt, 
  FaCheckCircle, FaSearch, FaBriefcaseMedical, FaStar,
  FaHome, FaShieldAlt, FaCalculator, FaExclamationTriangle,
  FaBars, FaTimes, FaFilter, FaArrowRight, FaExternalLinkAlt
} from 'react-icons/fa';

// Import de l'image depuis votre dossier assets
import backgroundDrc from '../assets/background_drc.jpeg';

// Données du réseau de soins agréé ARCA en RDC
const partnersNetwork = [
  {
    id: 1,
    name: "Centre Médical de Kinshasa (CMK)",
    city: "Kinshasa",
    district: "Gombe",
    type: "Santé",
    specialty: "Hôpital Général & Urgences",
    phone: "+243 817 000 000",
    address: "Avenue de la Justice, Gombe, Kinshasa",
    rating: 4.8,
    image: backgroundDrc,
    hours: "Ouvert 24h/24 • 7j/7",
    description: "Établissement hospitalier de référence à Kinshasa offrant un plateau technique complet, des urgences médico-chirurgicales et une prise en charge directe sans avance de frais pour les assurés ESNAS.",
    features: ["Tiers-Payant Activé", "Urgences 24h/7", "Pharmacie Agréée"]
  },
  {
    id: 2,
    name: "Cliniques Universitaires de Lubumbashi",
    city: "Lubumbashi",
    district: "Mutoshi",
    type: "Santé",
    specialty: "Spécialités Médicales & Chirurgie",
    phone: "+243 997 000 000",
    address: "Route Kasapa, Lubumbashi",
    rating: 4.5,
    image: backgroundDrc,
    hours: "Ouvert 24h/24 • 7j/7",
    description: "Centre hospitalier majeur du Haut-Katanga doté de services spécialisés en pédiatrie, maternité, imagerie médicale et soins intensifs sous convention ARCA.",
    features: ["Tiers-Payant Activé", "Pédiatrie", "Maternité Prise en Charge"]
  },
  {
    id: 3,
    name: "Hôpital HEAL Africa",
    city: "Goma",
    district: "Les Volcans",
    type: "Santé",
    specialty: "Urgences & Soins Intensifs",
    phone: "+243 857 000 000",
    address: "Avenue du Rond-Point, Goma",
    rating: 4.6,
    image: backgroundDrc,
    hours: "Ouvert 24h/24 • 7j/7",
    description: "Hôpital tertiaire de pointe dans le Nord-Kivu reconnu pour la traumatologie, la chirurgie réparatrice et l'imagerie diagnostique haute précision.",
    features: ["Tiers-Payant Activé", "Traumatologie", "Scanner 3D"]
  },
  {
    id: 4,
    name: "Garage CFAO Motors Kinshasa",
    city: "Kinshasa",
    district: "Limete",
    type: "Automobile",
    specialty: "Réparation & Maintenance Flotte",
    phone: "+243 815 000 000",
    address: "Boulevard Lumumba, Limete, Kinshasa",
    rating: 4.7,
    image: backgroundDrc,
    hours: "Lun – Sam : 08h00 – 17h30",
    description: "Atelier agréé pour l'expertise rapide après sinistre automobile, le remplacement de pièces d'origine certifiées et la remise en état des véhicules assurés.",
    features: ["Prise en charge Directe", "Pièces d'Origine", "Expertise Sinistre"]
  }
];

export default function ProjectsPage() {
  const navigate = useNavigate();

  const [selectedCity, setSelectedCity] = useState("Tous");
  const [selectedType, setSelectedType] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activePartner, setActivePartner] = useState(null);

  const cities = ["Tous", "Kinshasa", "Lubumbashi", "Goma"];
  const types = ["Tous", "Santé", "Automobile"];

  const filteredPartners = partnersNetwork.filter(partner => {
    const matchCity = selectedCity === "Tous" || partner.city === selectedCity;
    const matchType = selectedType === "Tous" || partner.type === selectedType;
    const matchSearch =
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCity && matchType && matchSearch;
  });

  // Contenu réutilisable du Sidebar (Desktop fixe + Mobile drawer)
  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between bg-[#090d16] text-white select-none">
      <div className="space-y-5 p-4">
        {/* En-tête Sidebar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#CE1126] inline-block" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
              ESNAS <span className="text-[#00A3E0]">RÉSEAU</span>
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
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-[#111827] hover:bg-[#CE1126] border border-slate-800 hover:border-[#CE1126] text-xs font-black uppercase tracking-wider text-slate-200 hover:text-white transition-colors cursor-pointer"
        >
          <FaHome className="text-sm" />
          <span>Retour à l'Accueil</span>
        </button>

        {/* Filtre 1 : Villes RDC */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 flex items-center gap-1.5">
            <FaMapMarkerAlt className="text-[#CE1126]" /> Villes Couvertes
          </p>
          <div className="space-y-1">
            {cities.map((city) => {
              const active = selectedCity === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setSelectedCity(city);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#CE1126]/15 border-[#CE1126] text-white'
                      : 'bg-[#111827]/60 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span>{city === "Tous" ? "Toutes les villes (RDC)" : city}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#090d16] text-slate-300">
                    {city === "Tous"
                      ? partnersNetwork.length
                      : partnersNetwork.filter((p) => p.city === city).length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtre 2 : Type de prestataire */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 flex items-center gap-1.5">
            <FaFilter className="text-[#00A3E0]" /> Catégorie
          </p>
          <div className="space-y-1">
            {types.map((t) => {
              const active = selectedType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSelectedType(t);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#00A3E0]/15 border-[#00A3E0] text-white'
                      : 'bg-[#111827]/60 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {t === "Santé" ? (
                    <FaHospital className="text-[#CE1126] text-xs" />
                  ) : t === "Automobile" ? (
                    <FaWrench className="text-[#00A3E0] text-xs" />
                  ) : (
                    <FaBriefcaseMedical className="text-slate-400 text-xs" />
                  )}
                  <span>
                    {t === "Tous" ? "Tous les prestataires" : t === "Santé" ? "Structures Médicales" : "Garages Agréés"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bas du Sidebar : Navigation rapide & Badge ARCA */}
      <div className="p-4 border-t border-slate-800 bg-[#050811] space-y-2.5">
        <Link
          to="/work"
          className="w-full flex items-center justify-between px-3 py-2 bg-[#111827] hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-200 transition-colors"
        >
          <span className="flex items-center gap-2">
            <FaCalculator className="text-[#00A3E0]" /> Simuler un devis
          </span>
          <FaArrowRight size={10} className="text-slate-500" />
        </Link>

        <Link
          to="/sinistre"
          className="w-full flex items-center justify-between px-3 py-2 bg-[#111827] hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-200 transition-colors"
        >
          <span className="flex items-center gap-2">
            <FaExclamationTriangle className="text-[#CE1126]" /> Déclarer un sinistre
          </span>
          <FaArrowRight size={10} className="text-slate-500" />
        </Link>

        <div className="pt-1 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
          <span>Réseau Certifié ARCA RDC</span>
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
              className="fixed inset-y-0 left-0 w-68 max-w-[82vw] border-r border-slate-800 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ================= 2. ZONE PRINCIPALE (DÉCALÉE DE w-64 SUR DESKTOP) ================= */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        
        {/* NAVBAR MODERNE STICKY */}
        <header className="sticky top-0 z-30 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800">
          <div className="px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
            
            {/* Gauche : Bouton menu mobile + Titre */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 bg-[#111827] border border-slate-800 text-white hover:border-[#CE1126]"
                aria-label="Ouvrir les filtres"
              >
                <FaBars size={13} />
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="lg:hidden p-2 bg-[#111827] border border-slate-800 text-slate-300 hover:text-white"
                title="Accueil"
              >
                <FaHome size={13} />
              </button>

              <div className="truncate">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CE1126] block leading-none">
                  Tiers-Payant National
                </span>
                <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white truncate mt-0.5">
                  Prestataires Agréés ARCA
                </h1>
              </div>
            </div>

            {/* Centre / Droite : Barre de recherche rapide intégrée */}
            <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
              <div className="relative w-full max-w-[240px] sm:max-w-xs">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                <input
                  type="text"
                  placeholder="Hôpital, quartier, garage..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#111827] border border-slate-800 focus:border-[#00A3E0] text-xs font-bold text-white outline-none placeholder-slate-500 rounded-none"
                />
              </div>

              <Link
                to="/portail-hopital"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00A3E0]/15 hover:bg-[#00A3E0] border border-[#00A3E0]/40 text-[#00A3E0] hover:text-white text-[10px] font-black uppercase tracking-wider transition-colors shrink-0"
              >
                <FaHospital size={11} />
                <span>Vérif. Police</span>
              </Link>
            </div>
          </div>
        </header>

        {/* CONTENU DE LA GRILLE DES PARTENAIRES */}
        <main className="flex-grow px-3 sm:px-6 py-5 sm:py-6">
          
          {/* Bandeau résumé & filtres actifs */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 bg-[#111827] border border-slate-800 px-4 py-3">
            <p className="text-xs text-slate-300 font-medium">
              Présentez votre <span className="text-white font-bold">carte virtuelle ou QR Code WhatsApp</span> pour une prise en charge immédiate sans avance de frais.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider">
              <span className="px-2 py-0.5 bg-[#090d16] border border-slate-800 text-[#00A3E0]">
                {filteredPartners.length} établissement{filteredPartners.length > 1 ? 's' : ''}
              </span>
              {(selectedCity !== "Tous" || selectedType !== "Tous" || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCity("Tous");
                    setSelectedType("Tous");
                    setSearchQuery("");
                  }}
                  className="px-2 py-0.5 bg-[#CE1126]/20 border border-[#CE1126]/40 text-[#CE1126] hover:bg-[#CE1126] hover:text-white transition-colors cursor-pointer"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Grille des cartes partenaires avec image background_drc.jpeg */}
          {filteredPartners.length === 0 ? (
            <div className="bg-[#111827] border border-slate-800 text-center py-14 px-4 text-slate-400 font-black uppercase tracking-wider text-xs">
              Aucun prestataire ne correspond à vos critères dans cette zone.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-5">
              {filteredPartners.map((partner, idx) => (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  onClick={() => setActivePartner(partner)}
                  className="bg-[#111827] border border-slate-800 hover:border-[#CE1126] shadow-xl flex flex-col justify-between transition-all duration-300 group rounded-none overflow-hidden cursor-pointer"
                >
                  {/* Visuel supérieur de la carte avec background_drc.jpeg */}
                  <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-[#050811] border-b border-slate-800">
                    <img
                      src={partner.image}
                      alt={partner.name}
                      className="w-full h-full object-cover object-center opacity-70 group-hover:scale-105 group-hover:opacity-85 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent" />

                    {/* Badges superposés */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 bg-[#090d16]/90 border border-slate-700 text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                        <FaMapMarkerAlt className="text-[#CE1126]" />
                        {partner.city} • {partner.district}
                      </span>

                      <span className="px-2 py-1 bg-[#090d16]/90 border border-slate-700 text-[10px] font-black text-amber-400 flex items-center gap-1">
                        <FaStar size={10} /> {partner.rating}
                      </span>
                    </div>

                    {/* Icône type en bas à gauche de l'image */}
                    <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
                      <div className={`w-9 h-9 border border-slate-700 flex items-center justify-center shadow-md ${partner.type === 'Santé' ? 'bg-[#CE1126] text-white' : 'bg-[#00A3E0] text-white'}`}>
                        {partner.type === 'Santé' ? <FaHospital size={15} /> : <FaWrench size={15} />}
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#00A3E0] block">
                          {partner.specialty}
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-white leading-tight group-hover:text-[#CE1126] transition-colors">
                          {partner.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Corps de la carte */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-slate-500 shrink-0" size={11} />
                        <span className="truncate">{partner.address}</span>
                      </p>

                      {/* Tags des avantages */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {partner.features.map((feat, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#090d16] border border-slate-800 text-[10px] font-bold text-slate-300"
>
                              <FaCheckCircle className="text-emerald-400 text-[9px]" />
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Pied de carte : Téléphone + Bouton Plein Écran */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                        <FaPhoneAlt className="text-[#CE1126] text-[10px]" />
                        {partner.phone}
                      </span>

                      <span className="text-[10px] font-black uppercase tracking-wider text-[#00A3E0] group-hover:text-white flex items-center gap-1">
                        <span>Fiche complète</span>
                        <FaExternalLinkAlt size={9} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ================= 3. VUE PLEIN ÉCRAN GAUCHE / DROITE (DÉTAILS PARTENAIRE) ================= */}
      <AnimatePresence>
        {activePartner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#050811] flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden"
          >
            {/* MOITIÉ GAUCHE : IMAGE PLEINE HAUTEUR (background_drc.jpeg) */}
            <div className="relative w-full lg:w-1/2 h-64 sm:h-80 lg:h-full bg-[#090d16] shrink-0 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
              <img
                src={activePartner.image}
                alt={activePartner.name}
                className="w-full h-full object-cover object-center opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/30 to-transparent" />

              {/* Bouton Fermer en haut à droite sur mobile */}
              <button
                type="button"
                onClick={() => setActivePartner(null)}
                className="lg:hidden absolute top-4 right-4 px-3 py-2 bg-[#090d16]/90 border border-slate-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
              >
                <FaTimes /> Fermer
              </button>

              {/* Infos superposées en bas de l'image */}
              <div className="absolute bottom-5 left-5 right-5 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 bg-[#CE1126] text-white text-[10px] font-black uppercase tracking-widest">
                    Agréé ARCA RDC
                  </span>
                  <span className="px-2.5 py-1 bg-[#090d16]/90 border border-slate-700 text-white text-[10px] font-black uppercase tracking-wider">
                    {activePartner.city} • {activePartner.district}
                  </span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight">
                  {activePartner.name}
                </h2>
              </div>
            </div>

            {/* MOITIÉ DROITE : FICHE DÉTAILLÉE & ACTIONS */}
            <div className="w-full lg:w-1/2 lg:h-full lg:overflow-y-auto bg-[#090d16] p-5 sm:p-8 lg:p-10 flex flex-col justify-between">
              <div className="space-y-6">
                
                {/* Barre supérieure droite avec bouton Fermer */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-[#00A3E0]">
                      {activePartner.specialty}
                    </span>
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1 bg-[#111827] px-2 py-0.5 border border-slate-800">
                      <FaStar size={11} /> {activePartner.rating} / 5
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActivePartner(null)}
                    className="hidden lg:inline-flex items-center gap-2 px-3.5 py-2 bg-[#111827] hover:bg-[#CE1126] border border-slate-800 hover:border-[#CE1126] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <FaTimes /> Fermer
                  </button>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Présentation de l&apos;établissement
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {activePartner.description}
                  </p>
                </div>

                {/* Grille Coordonnées & Horaires */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#111827] p-3.5 border border-slate-800">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                      Adresse Physique
                    </span>
                    <span className="text-xs font-bold text-white mt-1 block">
                      {activePartner.address}
                    </span>
                  </div>

                  <div className="bg-[#111827] p-3.5 border border-slate-800">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                      Disponibilité & Accueil
                    </span>
                    <span className="text-xs font-bold text-emerald-400 mt-1 block">
                      {activePartner.hours}
                    </span>
                  </div>
                </div>

                {/* Services Tiers-Payant */}
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Services & Garanties Incluses
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activePartner.features.map((feat, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2.5 bg-[#111827] px-3 py-2.5 border border-slate-800 text-xs font-bold text-white"
                      >
                        <FaCheckCircle className="text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Boutons d'action en bas à droite */}
              <div className="pt-6 mt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                <a
                  href={`tel:${activePartner.phone.replace(/\s+/g, '')}`}
                  className="flex-1 py-3 px-4 bg-[#CE1126] hover:bg-[#a80d1e] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <FaPhoneAlt />
                  <span>Appeler ({activePartner.phone})</span>
                </a>

                <button
                  type="button"
                  onClick={() => navigate('/sinistre')}
                  className="flex-1 py-3 px-4 bg-[#111827] hover:bg-slate-800 border border-slate-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <FaExclamationTriangle className="text-[#00A3E0]" />
                  <span>Déclarer une prise en charge</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
