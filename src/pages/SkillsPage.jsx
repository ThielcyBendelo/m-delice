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

      <main className="flex-grow mx-auto max-w-7xl px-6 py-24 w-full">
        
        {/* En-tête de page moderne */}
        <div className="mb-20 text-center flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-red-600 text-[px] font-black uppercase tracking-[em] border border-red-100"
          >
            <FaExclamationTriangle className="animate-pulse" /> Centre de Sinistre Digital
          </motion.div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-slate-900 uppercase leading-none mb-6">
            Déclaration de <span className="text-red-600 italic">Sinistre</span>
          </h1>
          <p className="max-w-3xl text-lg md:text-xl text-slate-950 font-bold leading-relaxed">
            Remplissez ce formulaire pour activer votre prise en charge immédiate. Nos experts ARCA analysent votre dossier sous 24 à 48 heures.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-[fr_fr] items-start">
          
          {/* Formulaire Principal (Style Luxe & Épuré) */}
          <motion.form 
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-10"
          >
            <div className="grid gap-10 sm:grid-cols-2">
              <div className="space-y-3">
                <label className="text-[px] font-black uppercase tracking-[em] text-slate-950 flex items-center gap-2">
                  <FaShieldAlt className="text-red-600" /> Numéro de police
                </label>
                <input
                  name="policyNumber"
                  value={formData.policyNumber}
                  onChange={handleChange}
                  type="text"
                  placeholder="EX : DRC-2026-045"
                  className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 focus:placeholder-transparent"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-[px] font-black uppercase tracking-[em] text-slate-950 flex items-center gap-2">
                  <FaUser className="text-red-600" /> Nom de l'Assuré
                </label>
                <input
                  name="insuredName"
                  value={formData.insuredName}
                  onChange={handleChange}
                  type="text"
                  placeholder="Nom complet du bénéficiaire"
                  className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 focus:placeholder-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid gap-10 sm:grid-cols-2">
              <div className="space-y-3">
                <label className="text-[px] font-black uppercase tracking-[em] text-slate-950 flex items-center gap-2">
                  <FaCalendarAlt className="text-red-600" /> Date du sinistre
                </label>
                <input
                  name="incidentDate"
                  value={formData.incidentDate}
                  onChange={handleChange}
                  type="date"
                  className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 text-slate-400"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-[px] font-black uppercase tracking-[em] text-slate-950 flex items-center gap-2">
                  <FaClipboardList className="text-red-600" /> Branche Concernée
                </label>
                <select
                  name="incidentType"
                  value={formData.incidentType}
                  onChange={handleChange}
                  className="w-full border-b-2 border-slate-100 bg-transparent py-4 text-lg font-bold outline-none transition focus:border-red-600 appearance-none"
                  required
                >
                  <option value="">Sélectionnez le type</option>
                  <option value="sante">Assurance Santé</option>
                  <option value="auto">Responsabilité Civile Auto</option>
                  <option value="habitation">Incendie / Habitation</option>
                  <option value="autre">Autres risques techniques</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[px] font-black uppercase tracking-[em] text-slate-950 flex items-center gap-2">
                <FaMoneyBillWave className="text-red-600" /> Montant Estimé (Facultatif)
              </label>
              <input
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                type="text"
                placeholder="Ex : 500 USD"
                className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 focus:placeholder-transparent"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[px] font-black uppercase tracking-[em] text-slate-950 flex items-center gap-2">
                Circonstances du Sinistre
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Décrivez précisément les faits..."
                className="w-full border-2 border-slate-100 bg-slate-50 p-6 text-base font-medium outline-none transition focus:border-red-600 rounded-3xl"
                required
              />
            </div>

            <div className="grid gap-10 sm:grid-cols-2">
              <div className="space-y-3">
                <label className="text-[px] font-black uppercase tracking-[em] text-slate-950 flex items-center gap-2">
                  <FaPhoneAlt className="text-red-600" /> Contact Téléphone
                </label>
                <input
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  type="tel"
                  placeholder="+243 ..."
                  className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-[px] font-black uppercase tracking-[em] text-slate-950 flex items-center gap-2">
                  <FaEnvelope className="text-red-600" /> Adresse Email
                </label>
                <input
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  type="email"
                  placeholder="email@example.com"
                  className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-12 py-5 bg-red-600 text-white font-black uppercase text-[px] tracking-[em] shadow-2xl hover:bg-red-700 transition-all active:scale-95"
            >
              Soumettre la déclaration
            </button>
          </motion.form>

          {/* Aside : Assistance & Rappel Légal (Noir Profond) */}
          <motion.aside 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-950 p-12 rounded-[rem] text-white shadow-2xl space-y-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full" />
            
            <div className="space-y-6">
              <span className="text-[px] font-black uppercase tracking-[em] text-red-600">Engagement DRC</span>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none text-white">
  Prise en charge <br /> Garantie.
</h2>

              <p className="text-slate-400 font-medium leading-relaxed">
                Chaque déclaration est traitée en priorité absolue pour garantir une réponse rapide à vos bénéficiaires.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-red-600">
                  <FaShieldAlt />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase tracking-widest text-white">Traçabilité Totale</p>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Recevez un numéro de dossier ARCA unique pour suivre l'évolution en temps réel.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-red-600">
                  <FaCheckCircle />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase tracking-widest text-white">Tiers-Payant</p>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Dans 80% des cas, aucun frais n'est déboursé par l'assuré en clinique partenaire.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
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
