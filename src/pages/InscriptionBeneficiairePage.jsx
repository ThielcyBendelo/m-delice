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
      <div className="min-h-screen bg-white flex flex-col justify-center items-center p-6 antialiased font-sans">
        <div className="text-center space-y-6 max-w-md bg-white p-10 rounded-[2rem] border border-slate-100 shadow-xl">
          <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Aucun pack sélectionné.</p>
          <button 
            onClick={() => navigate('/simulateur')} 
            className="w-full py-4 border-2 border-[#CE1126] bg-white text-black font-extrabold uppercase text-[11px] tracking-[0.25em] transition-all hover:bg-[#CE1126] hover:text-white"
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

      <main className="flex-grow max-w-3xl mx-auto px-6 py-16 pt-32 w-full space-y-10">
        
        {/* BOUTON RETOUR (Style épuré, tracking Fintech) */}
        <button 
          onClick={() => navigate('/simulateur')}
          className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-600 transition-colors"
        >
          <FaArrowLeft size={10} /> Retour au simulateur
        </button>

        {/* RÉCAPITULATIF DU PACK CHOISI (Style Bento Noir Profond Corporate) */}
        <div className="bg-slate-950 text-white p-8 rounded-[2rem] border-t-4 border-[#CE1126] shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-2xl" />
          <div className="space-y-2 relative z-10">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-red-600 bg-red-600/10 px-3 py-1 rounded">
              Formule Sélectionnée
            </span>
            <h2 className="text-2xl font-black uppercase tracking-tight mt-2">{selectedPack.name}</h2>
            <p className="text-xs text-slate-400 font-medium">{selectedPack.coverageLimit || "Garantie Immédiate ARCA"}</p>
          </div>
          <div className="text-left sm:text-right shrink-0 relative z-10">
            <p className="text-4xl font-black text-white tracking-tighter">{selectedPack.price} USD</p>
            <p className="text-[10px] text-red-600 font-black uppercase tracking-widest mt-1">Cotisation Mensuelle</p>
          </div>
        </div>

        {/* FORMULAIRE D'INSCRIPTION (Style Minimaliste sur Fond Blanc) */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-2 md:p-4 space-y-10"
        >
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shadow-sm">
              <FaUserPlus size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Bénéficiaire en RD Congo</h3>
              <p className="text-sm text-slate-950 font-medium">Renseignez la personne qui utilisera les garanties sur place.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Saisie Nom / Prénom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400">Nom de famille</label>
                <input 
                  type="text" name="nomBeneficiaire" required placeholder="EX: MBIKAYI"
                  value={formData.nomBeneficiaire} onChange={handleInputChange}
                  className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 uppercase"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400">Prénom</label>
                <input 
                  type="text" name="prenomBeneficiaire" required placeholder="EX: Dieudonné"
                  value={formData.prenomBeneficiaire} onChange={handleInputChange}
                  className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600"
                />
              </div>
            </div>

            {/* Saisie Contact WhatsApp & Parenté */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 flex items-center gap-1.5">
                  <FaPhoneAlt size={10} className="text-red-600" /> Numéro WhatsApp (Contact RDC)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-0 bottom-3 text-lg font-bold text-slate-400 pointer-events-none">+243</span>
                  <input 
                    type="tel" name="telephoneCongo" required placeholder="812345678" minLength={9} maxLength={9}
                    value={formData.telephoneCongo} onChange={(e) => setFormData(prev => ({ ...prev, telephoneCongo: e.target.value.replace(/\D/g, '') }))}
                    className="w-full pl-14 border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400">Lien de parenté</label>
                <select 
                  name="lienParente" value={formData.lienParente} onChange={handleInputChange}
                  className="w-full border-b-2 border-slate-100 bg-transparent py-4 text-lg font-bold outline-none transition focus:border-red-600 appearance-none cursor-pointer"
                >
                  <option value="Parent">Père / Mère</option>
                  <option value="Enfant">Enfant / Mineur</option>
                  <option value="FrereSoeur">Frère / Sœur</option>
                  <option value="Conjoint">Époux / Épouse</option>
                  <option value="Autre">Autre membre de la famille</option>
                </select>
              </div>
            </div>

            {/* 🟢 COMPLET : Sélection de la Province (Données préservées) et Commune de résidence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 flex items-center gap-1.5">
                  <FaMapMarkerAlt size={10} className="text-red-600" /> Province de résidence
                </label>
                <select 
                  name="provinceCongo" value={formData.provinceCongo} onChange={handleInputChange}
                  className="w-full border-b-2 border-slate-100 bg-transparent py-4 text-lg font-bold outline-none transition focus:border-red-600 appearance-none cursor-pointer"
                >
                  {provincesRDC.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400">Commune / Ville</label>
                <input 
                  type="text" name="communeCongo" required placeholder="EX: Gombe ou Limete"
                  value={formData.communeCongo} onChange={handleInputChange}
                  className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600"
                />
              </div>
            </div>

            {/* Bouton d'action final : Rectangulaire, Rouge, Contraste maximum */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full sm:w-auto px-12 py-5 bg-red-600 text-white font-black uppercase text-[11px] tracking-[0.25em] shadow-2xl hover:bg-red-700 transition-all active:scale-95"
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
