import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
// 🟢 CORRIGÉ : Inclusion explicite de FaCheckCircle et de toutes les icônes requises pour le formulaire
import { 
  FaShieldAlt, FaCalendarAlt, FaUser, FaClipboardList, 
  FaMoneyBillWave, FaPhoneAlt, FaEnvelope, FaExclamationTriangle,
  FaCheckCircle 
} from 'react-icons/fa';


export default function ClaimsDeclarationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    policyNumber: '',
    insuredName: '',
    incidentDate: '',
    incidentType: '',
    amount: '',
    description: '',
    contactPhone: '',
    contactEmail: ''
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Envoi des données (Prisma/SQL ou API simulée)
    console.log('Déclaration soumise', formData);
    navigate('/confirmation-declaration');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased font-sans">
      <NavbarSecured />

{/* ================= CENTRE DE DECLARATION DE SINISTRE (VERSION SOMBRE ONYX) ================= */}
<main className="flex-grow mx-auto max-w-7xl px-4 sm:px-6 py-24 w-full bg-[#090d16]">
  
  {/* En-tête de page moderne */}
  <div className="mb-16 md:mb-20 text-center flex flex-col items-center">
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 bg-[#111827] text-[#CE1126] text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] border border-slate-800 rounded-none shadow-sm"
    >
      <FaExclamationTriangle className="animate-pulse" /> Centre de Sinistre Digital
    </motion.div>
    
    <h1 className="text-3xl md:text-7xl font-black tracking-tighter text-white uppercase leading-none mb-6">
      Déclaration de <span className="text-[#CE1126] italic normal-case">Sinistre</span>
    </h1>
    
    <p className="max-w-3xl text-base md:text-lg text-[#94a3b8] font-semibold leading-relaxed">
      Remplissez ce formulaire pour activer votre prise en charge immédiate. Nos experts ARCA analysent votre dossier sous 24 à 48 heures.
    </p>
  </div>

  {/* Grille de mise en page réactive */}
  <div className="grid gap-12 lg:grid-cols-[2fr_1fr] items-start w-full">
    
    {/* Formulaire Principal (Style Luxe Bento Sombre) */}
    <motion.form 
      onSubmit={handleSubmit}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8 bg-[#111827] p-6 md:p-10 border border-slate-800 rounded-none shadow-xl text-left"
    >
      {/* Ligne 1 : Numéro de police & Nom de l'Assuré */}
      <div className="grid gap-6 md:gap-10 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
            <FaShieldAlt className="text-[#CE1126]" size={12} /> Numéro de police
          </label>
          <input
            name="policyNumber"
            value={formData.policyNumber}
            onChange={handleChange}
            type="text"
            placeholder="EX : DRC-2026-045"
            className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] focus:placeholder-transparent text-white rounded-none placeholder-slate-600"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
            <FaUser className="text-[#CE1126]" size={12} /> Nom de l'Assuré
          </label>
          <input
            name="insuredName"
            value={formData.insuredName}
            onChange={handleChange}
            type="text"
            placeholder="Nom complet du bénéficiaire"
            className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] focus:placeholder-transparent text-white rounded-none placeholder-slate-600"
            required
          />
        </div>
      </div>

      {/* Ligne 2 : Date du sinistre & Branche Concernée */}
      <div className="grid gap-6 md:gap-10 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
            <FaCalendarAlt className="text-[#CE1126]" size={12} /> Date du sinistre
          </label>
          <input
            name="incidentDate"
            value={formData.incidentDate}
            onChange={handleChange}
            type="date"
            className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] text-white rounded-none cursor-pointer"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
            <FaClipboardList className="text-[#CE1126]" size={12} /> Branche Concernée
          </label>
          <div className="relative">
            <select
              name="incidentType"
              value={formData.incidentType}
              onChange={handleChange}
              className="w-full border-b-2 border-slate-800 bg-[#090d16] py-4 text-lg font-bold outline-none transition focus:border-[#CE1126] appearance-none cursor-pointer text-white rounded-none"
              required
            >
              <option value="" className="bg-[#111827] text-slate-500">Sélectionnez le type</option>
              <option value="sante" className="bg-[#111827] text-white">Assurance Santé</option>
              <option value="auto" className="bg-[#111827] text-white">Responsabilité Civile Auto</option>
              <option value="habitation" className="bg-[#111827] text-white">Incendie / Habitation</option>
              <option value="autre" className="bg-[#111827] text-white">Autres risques techniques</option>
            </select>
          </div>
        </div>
      </div>

                       {/* Montant Estimé */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
                <FaMoneyBillWave className="text-[#CE1126]" size={12} /> Montant Estimé (Facultatif)
              </label>
              <input
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                type="text"
                placeholder="Ex : 500 USD"
                className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] focus:placeholder-transparent text-white rounded-none placeholder-slate-600"
              />
            </div>

            {/* Circonstances du Sinistre (Textarea Bento Sombre) */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
                Circonstances du Sinistre
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Décrivez précisément les faits..."
                className="w-full border border-slate-800 bg-[#090d16] p-5 text-base font-semibold outline-none transition focus:border-[#CE1126] text-white rounded-none placeholder-slate-600 shadow-inner"
                required
              />
            </div>

            {/* Contacts : Téléphone & Email */}
            <div className="grid gap-6 md:gap-10 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
                  <FaPhoneAlt className="text-[#CE1126]" size={12} /> Contact Téléphone
                </label>
                <input
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  type="tel"
                  placeholder="+243 ..."
                  className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] text-white rounded-none placeholder-slate-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
                  <FaEnvelope className="text-[#CE1126]" size={12} /> Adresse Email
                </label>
                <input
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  type="email"
                  placeholder="email@example.com"
                  className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] text-white rounded-none placeholder-slate-600"
                  required
                />
              </div>
            </div>

            {/* Action finale : Bouton de validation rectangulaire blanc et rouge inversé */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full sm:w-auto px-12 py-5 bg-white text-black font-black uppercase text-[10px] md:text-[11px] tracking-[0.25em] shadow-xl hover:bg-[#CE1126] hover:text-white transition-all duration-300 rounded-none active:scale-[0.98] focus:outline-none"
              >
                Soumettre la déclaration
              </button>
            </div>
          </motion.form>

                    {/* Aside : Assistance & Rappel Légal (VERSION SOMBRE ONYX) */}
          <motion.aside 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#111827] p-8 md:p-12 text-white shadow-2xl space-y-12 relative overflow-hidden border border-slate-800 rounded-none text-left"
            /* 🟢 'rounded-none' rend le bloc strictement rectangulaire et bg-[#111827] s'intègre au thème */
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-none pointer-events-none" />
            
            <div className="space-y-4">
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-[#CE1126]">
                Engagement ESNAs
              </span>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none text-white">
                Prise en charge <br /> Garantie.
              </h2>
              <p className="text-sm text-[#94a3b8] font-semibold leading-relaxed">
                Chaque déclaration est traitée en priorité absolue pour garantir une réponse rapide à vos bénéficiaires.
              </p>
            </div>

            {/* Liste des atouts de traçabilité */}
            <div className="space-y-8">
              {/* Atout 1 */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-slate-950 border border-slate-800 flex items-center justify-center text-[#CE1126] rounded-none shrink-0 shadow-md">
                  <FaShieldAlt size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-wider text-white">Traçabilité Totale</p>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    Recevez un numéro de dossier ARCA unique pour suivre l'évolution en temps réel.
                  </p>
                </div>
              </div>

              {/* Atout 2 */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-slate-950 border border-slate-800 flex items-center justify-center text-[#CE1126] rounded-none shrink-0 shadow-md">
                  <FaCheckCircle size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-wider text-white">Tiers-Payant</p>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    Dans 80% des cas, aucun frais n'est déboursé par l'assuré en clinique partenaire.
                  </p>
                </div>
              </div>
            </div>

            {/* Note réglementaire de bas de bloc */}
            <div className="pt-6 border-t border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic leading-relaxed">
                * Sous réserve de conformité avec les conditions générales de votre contrat.
              </p>
            </div>
          </motion.aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
