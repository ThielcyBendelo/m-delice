import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import { FaUserPlus, FaArrowLeft, FaShieldAlt, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';

export default function InscriptionBeneficiairePage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Récupération sécurisée du pack choisi sur la page boutique
  const selectedPack = location.state?.selectedPack || null;

  // États du formulaire conformes aux exigences ARCA
  const [formData, setFormData] = useState({
    nomBeneficiaire: '',
    prenomBeneficiaire: '',
    telephoneCongo: '',
    provinceCongo: 'Kinshasa',
    communeCongo: '',
    lienParente: 'Parent'
  });

  // Liste des provinces majeures pour le ciblage des réseaux de soins
  const provincesRDC = [
    "Kinshasa", "Kongo Central", "Kwango", "Kwilu", "Mai-Ndombe", 
    "Equateur", "Nord-Ubangi", "Sud-Ubangi", "Mongala", "Tshuapa", 
    "Tshopo", "Bas-Uele", "Haut-Uele", "Ituri", "Nord-Kivu", 
    "Sud-Kivu", "Maniema", "Katanga / Haut-Katanga", "Lualaba", 
    "Haut-Lomami", "Tanganyika", "Kasai", "Kasai Central", 
    "Kasai Oriental", "Lomami", "Sankuru"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPack) return;

    // Redirige vers la boutique en transmettant les données validées
    navigate('/boutique', { 
      state: { 
        triggerPayment: true, 
        pack: selectedPack,
        beneficiaire: formData
      } 
    });
  };

  // Sécurité si l'utilisateur accède à la page sans avoir choisi de formule
if (!selectedPack) {
  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col justify-center items-center p-4 sm:p-6 antialiased font-sans text-white">
      {/* 🟢 Panneau central Bento - Fond Surface Sombre, Angles droits sans courbes */}
      <div className="text-center space-y-6 max-w-md w-full bg-[#111827] p-8 md:p-10 border border-slate-800 shadow-[0_30px_70px_rgba(0,0,0,0.6)] rounded-none">
        
        {/* Description Gris Argent Scannable */}
        <p className="text-xs md:text-sm font-black uppercase tracking-[0.15em] text-slate-400">
          Aucun pack sélectionné.
        </p>
        
        {/* 🟢 Bouton Principal : Fond blanc, texte noir, bascule rouge au survol */}
        <button 
          onClick={() => navigate('/simulateur')} 
          className="w-full py-4 border-2 border-white bg-white text-black font-extrabold uppercase text-[10px] md:text-[11px] tracking-[0.25em] transition-all duration-300 hover:bg-[#CE1126] hover:text-white hover:border-[#CE1126] rounded-none active:scale-[0.98] shadow-md"
        >
          Retourner au tarificateur
        </button>

      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased font-sans text-slate-900">
      <NavbarSecured />

     <main className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 py-16 pt-32 w-full space-y-10 bg-[#090d16]">
  
  {/* BOUTON RETOUR : Style épuré, tracking Fintech Sombre */}
  <button 
    onClick={() => navigate('/simulateur')}
    className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors focus:outline-none rounded-none"
  >
    <FaArrowLeft size={10} className="text-[#CE1126]" /> Retour au simulateur
  </button>

  {/* RÉCAPITULATIF DU PACK CHOISI : Bento Box Carrée Rectangle */}
  <div className="bg-[#111827] text-white p-6 md:p-8 border border-slate-800 border-t-4 border-t-[#CE1126] shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden rounded-none">
    <div className="absolute top-0 right-0 w-24 h-24 bg-[#CE1126]/5 rounded-none blur-2xl pointer-events-none" />
    
    <div className="space-y-2 relative z-10 text-left">
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#CE1126] bg-[#CE1126]/10 px-3 py-1 rounded-none border border-[#CE1126]/20">
        Formule Sélectionnée
      </span>
      <h2 className="text-2xl font-black uppercase tracking-tight mt-3 text-white">{selectedPack.name}</h2>
      <p className="text-xs text-slate-400 font-semibold">{selectedPack.coverageLimit || "Garantie Immédiate ARCA"}</p>
    </div>
    
    <div className="text-left sm:text-right shrink-0 relative z-10">
      <p className="text-4xl font-black text-white tracking-tighter">{selectedPack.price} USD</p>
      <p className="text-[10px] text-[#CE1126] font-black uppercase tracking-widest mt-1">Cotisation Mensuelle</p>
    </div>
  </div>

{/* FORMULAIRE D'INSCRIPTION (VERSION SOMBRE ONYX - RECTANGLE STRICT) */}
<motion.div 
  initial={{ opacity: 0, y: 25 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-transparent p-2 md:p-4 space-y-10 rounded-none text-left"
>
  <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
    {/* Conteneur d'icône Bento Sombre carré */}
    <div className="w-12 h-12 bg-[#111827] text-[#CE1126] border border-slate-800 flex items-center justify-center shadow-md rounded-none">
      <FaUserPlus size={20} />
    </div>
    <div>
      <h3 className="text-xl font-black text-white uppercase tracking-tight">Bénéficiaire en RD Congo</h3>
      <p className="text-sm text-[#94a3b8] font-semibold mt-1">Renseignez la personne qui utilisera les garanties sur place.</p>
    </div>
  </div>

  <form onSubmit={handleSubmit} className="space-y-8">
    
    {/* Saisie Nom / Prénom */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
      <div className="space-y-3">
        <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400">Nom de famille</label>
        <input 
          type="text" name="nomBeneficiaire" required placeholder="EX: MBIKAYI"
          value={formData.nomBeneficiaire} onChange={handleInputChange}
          className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] focus:placeholder-transparent text-white rounded-none uppercase placeholder-slate-600"
        />
      </div>
      <div className="space-y-3">
        <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400">Prénom</label>
        <input 
          type="text" name="prenomBeneficiaire" required placeholder="EX: Dieudonné"
          value={formData.prenomBeneficiaire} onChange={handleInputChange}
          className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] focus:placeholder-transparent text-white rounded-none placeholder-slate-600"
        />
      </div>
    </div>

    {/* Saisie Contact WhatsApp & Parenté */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
      <div className="space-y-3">
        <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 flex items-center gap-1.5">
          <FaPhoneAlt size={10} className="text-[#CE1126]" /> Numéro WhatsApp (Contact RDC)
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-0 bottom-3 text-lg font-bold text-slate-500 pointer-events-none">+243</span>
          <input 
            type="tel" name="telephoneCongo" required placeholder="812345678" minLength={9} maxLength={9}
            value={formData.telephoneCongo} onChange={(e) => setFormData(prev => ({ ...prev, telephoneCongo: e.target.value.replace(/\D/g, '') }))}
            className="w-full pl-14 border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] focus:placeholder-transparent text-white rounded-none placeholder-slate-600"
          />
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400">Lien de parenté</label>
        <div className="relative">
          <select 
            name="lienParente" value={formData.lienParente} onChange={handleInputChange}
            className="w-full border-b-2 border-slate-800 bg-[#090d16] py-4 text-lg font-bold outline-none transition focus:border-[#CE1126] appearance-none cursor-pointer text-white rounded-none"
          >
            <option value="Parent" className="bg-[#111827] text-white">Père / Mère</option>
            <option value="Enfant" className="bg-[#111827] text-white">Enfant / Mineur</option>
            <option value="FrereSoeur" className="bg-[#111827] text-white">Frère / Sœur</option>
            <option value="Conjoint" className="bg-[#111827] text-white">Époux / Épouse</option>
            <option value="Autre" className="bg-[#111827] text-white">Autre membre de la famille</option>
          </select>
        </div>
      </div>
    </div>

    {/* Sélection de la Province et Commune de résidence */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
      <div className="space-y-3">
        <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 flex items-center gap-1.5">
          <FaMapMarkerAlt size={10} className="text-[#CE1126]" /> Province de résidence
        </label>
        <div className="relative">
          <select 
            name="provinceCongo" value={formData.provinceCongo} onChange={handleInputChange}
            className="w-full border-b-2 border-slate-800 bg-[#090d16] py-4 text-lg font-bold outline-none transition focus:border-[#CE1126] appearance-none cursor-pointer text-white rounded-none"
          >
            {provincesRDC.map((prov) => (
              <option key={prov} value={prov} className="bg-[#111827] text-white">{prov}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400">Commune / Ville</label>
        <input 
          type="text" name="communeCongo" required placeholder="EX: Gombe ou Limete"
          value={formData.communeCongo} onChange={handleInputChange}
          className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] focus:placeholder-transparent text-white rounded-none placeholder-slate-600"
        />
      </div>
    </div>

    {/* Action finale : Rectangulaire, Blanche, Contraste maximum */}
    <div className="pt-6">
      <button
        type="submit"
        className="w-full sm:w-auto px-12 py-5 bg-white text-black font-black uppercase text-[11px] tracking-[0.25em] shadow-xl hover:bg-[#CE1126] hover:text-white transition-all duration-300 rounded-none active:scale-[0.98]"
      >
        Valider et passer au paiement
      </button>
    </div>
  </form>
</motion.div>
</main>

      <Footer />
    </div>
  );
}
