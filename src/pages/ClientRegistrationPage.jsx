import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import notificationService from '../services/notificationService';
import { 
  FaUser, FaPhone, FaMapMarkerAlt, FaIdCard, 
  FaShieldAlt, FaArrowRight, FaArrowLeft, FaInfoCircle 
} from 'react-icons/fa';

export default function ClientRegistrationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Récupération sécurisée du pack d'assurance sélectionné à l'étape précédente
  const selectedPack = location.state?.selectedPack || {
    id: 1,
    name: "Pack Santé Maman",
    price: 45,
    coverageLimit: "Plafond annuel : 3 500 USD"
  };

  // État initial du formulaire (Dualité Acheteur Diaspora / Bénéficiaire Local)
  const [formData, setFormData] = useState({
    beneficiaryLastName: '',
    beneficiaryFirstName: '',
    beneficiaryPhone: '+243', // Pré-remplissage avec l'indicatif de la RDC
    beneficiaryCity: 'Kinshasa',
    beneficiaryAddress: '',
    nationalID: '',
    buyerRelation: 'Parent' // Lien de parenté
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const citiesInRdc = [
    "Kinshasa", "Lubumbashi", "Goma", "Bukavu", 
    "Kisangani", "Kananga", "Mbuji-Mayi", "Matadi"
  ];

  const relations = ["Parent", "Conjoint(e)", "Enfant", "Frère / Sœur", "Employé(e)", "Autre"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation stricte du numéro de téléphone RDC
    if (!formData.beneficiaryPhone.startsWith('+243') || formData.beneficiaryPhone.length < 12) {
      notificationService.error("Le numéro WhatsApp doit être au format international RDC (ex: +243810000000)");
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (notificationService?.info) {
        notificationService.info("Validation des données du bénéficiaire...");
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      navigate('/passerelle-paiement', {
        state: {
          selectedPack,
          beneficiaryData: formData
        }
      });
    } catch (error) {
      notificationService.error("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased font-sans">
      <NavbarSecured />

      {/* ================= 1. SECTION CORE TUNNEL ================= */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-24 pt-32 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        
{/* COLONNE GAUCHE : Récapitulatif du Pack d'Assurance choisi (COL 4 - Bento Noir Profond) */}
<div className="lg:col-span-4">
  {/* 🟢 'rounded-none' rend le bloc strictement rectangulaire */}
  <div className="bg-slate-950 text-white p-8 border-t-4 border-t-[#CE1126] shadow-2xl space-y-6 sticky top-24 relative overflow-hidden rounded-none">
    <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-2xl" />
    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-600">Formule Sélectionnée</h3>
    <h2 className="text-2xl font-black text-white uppercase tracking-tight">{selectedPack.name}</h2>
    
    <div className="text-4xl font-black text-white tracking-tighter">
      {selectedPack.price} <span className="text-sm font-bold uppercase text-red-600 tracking-widest">USD / Mois</span>
    </div>
    
    {/* 🟢 Nettoyage des contrastes textuels sur fond noir */}
    <div className="border-t border-white/10 pt-6 space-y-4 text-sm font-medium text-slate-400 leading-relaxed">
      <p className="flex items-center gap-3">
        <FaInfoCircle className="text-red-600 flex-shrink-0" /> <span>{selectedPack.coverageLimit}</span>
      </p>
      {/* 🟢 Changé de text-slate-950 (invisible) à text-slate-300 pour une parfaite lisibilité */}
      <p className="text-sm font-semibold text-slate-300 leading-relaxed">
        En remplissant ce formulaire, vous initiez la création d'une carte d'assuré numérique ARCA rattachée à votre compte de la Diaspora.
      </p>
    </div>
  </div>
</div>


        {/* COLONNE DROITE : Formulaire d'identification du bénéficiaire local (COL 8) */}
        <div className="lg:col-span-8">
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-2 md:p-4 space-y-10"
          >
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shadow-sm">
                <FaShieldAlt size={20} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Identité du Bénéficiaire</h1>
                <p className="text-1xl text-slate-950 font-medium">Renseignez la personne physique qui utilisera les prestations en RDC.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Ligne 1 : Nom & Prénom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-950">Nom de famille</label>
                  <input
                    type="text"
                    name="beneficiaryLastName"
                    required
                    value={formData.beneficiaryLastName}
                    onChange={handleChange}
                    placeholder="Ex: Mbuyi"
                    className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 uppercase"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-950">Prénom</label>
                  <input
                    type="text"
                    name="beneficiaryFirstName"
                    required
                    value={formData.beneficiaryFirstName}
                    onChange={handleChange}
                    placeholder="Ex: Thérèse"
                    className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600"
                  />
                </div>
              </div>

              {/* Ligne 2 : WhatsApp & Lien de Parenté */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-950 flex items-center gap-1.5">
                    <FaPhone size={10} className="text-red-600" /> N° WhatsApp (Notification PWA)
                  </label>
                  <input
                    type="tel"
                    name="beneficiaryPhone"
                    required
                    value={formData.beneficiaryPhone}
                    onChange={handleChange}
                    placeholder="+243810000000"
                    className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 font-mono"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-950">Lien de parenté</label>
                  <select 
                    name="buyerRelation" 
                    value={formData.buyerRelation} 
                    onChange={handleChange}
                    className="w-full border-b-2 border-slate-100 bg-transparent py-4 text-lg font-bold outline-none transition focus:border-red-600 appearance-none cursor-pointer"
                  >
                    {relations.map((rel) => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ligne 3 : Pièce d'Identité Nationale & Ville */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-950 flex items-center gap-1.5">
                    <FaIdCard size={12} className="text-red-600" /> N° Carte d'Électeur / ID National
                  </label>
                  <input
                    type="text"
                    name="nationalID"
                    value={formData.nationalID}
                    onChange={handleChange}
                    placeholder="Ex: 12345-67890-12345"
                    className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 uppercase"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-950 flex items-center gap-1.5">
                    <FaMapMarkerAlt size={11} className="text-red-600" /> Ville de Résidence (RDC)
                  </label>
                  <select 
                    name="beneficiaryCity" 
                    value={formData.beneficiaryCity} 
                    onChange={handleChange}
                    className="w-full border-b-2 border-slate-100 bg-transparent py-4 text-lg font-bold outline-none transition focus:border-red-600 appearance-none cursor-pointer"
                  >
                    {citiesInRdc.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ligne 4 : Adresse Détaillée */}
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-950">Adresse Résidentielle Complète</label>
                <input
                  type="text"
                  name="beneficiaryAddress"
                  required
                  value={formData.beneficiaryAddress}
                  onChange={handleChange}
                  placeholder="Ex: N° 45, Avenue de la Justice, Gombe"
                  className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600"
                />
              </div>

              {/* Actions du tunnel transactionnel */}
              <div className="pt-6 flex flex-col sm:flex-row gap-6">
                <button
                  type="button"
                  onClick={() => navigate('/simulateur')}
                  className="px-10 py-5 border-2 border-slate-900 text-black font-extrabold uppercase text-[11px] tracking-[0.25em] transition-all hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <FaArrowLeft size={10} /> Modifier les options
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-12 py-5 bg-red-600 text-white font-black uppercase text-[11px] tracking-[0.25em] shadow-2xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Enregistrement..." : "Valider et passer au paiement"} <FaArrowRight size={10} />
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
