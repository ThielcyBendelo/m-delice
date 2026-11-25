import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
// import Footer from '../components/Footer';
import claimService from '../services/claimService.js';
import notificationService from '../services/notificationService';
import { 
  FaShieldAlt, FaCalendarAlt, FaUser, FaClipboardList, 
  FaMoneyBillWave, FaPhoneAlt, FaEnvelope, FaExclamationTriangle,
  FaCheckCircle, FaHome, FaCalculator, FaClock, FaFileMedical, FaArrowRight
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const estimatedCost = Number.parseFloat(String(formData.amount).replace(',', '.').replace(/[^0-9.]/g, ''));
    if (formData.amount && (!Number.isFinite(estimatedCost) || estimatedCost <= 0)) {
      notificationService.error('Saisissez un montant estimé valide en USD.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await claimService.fileClaim({
        policyNumber: formData.policyNumber.trim(),
        eventDate: formData.incidentDate,
        description: `${formData.insuredName.trim()} - ${formData.incidentType}: ${formData.description.trim()}`,
        estimatedCost: estimatedCost || 0,
      });
      if (!result.success) throw new Error(result.error);
      setSubmittedClaim(result);
      notificationService.success(`Déclaration enregistrée : ${result.claimNumber}`);
    } catch (error) {
      notificationService.error(error.message || 'Impossible de soumettre la déclaration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col antialiased font-sans">
      
      {/* ================= 1. MINI NAVBAR CONTEXTUELLE (MOBILE & DESKTOP) ================= */}
      <header className="sticky top-0 z-50 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/90">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-2">
          
          {/* Gauche : Retour Home + Titre */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              title="Retour à l'accueil"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111827] hover:bg-[#CE1126] border border-slate-800 hover:border-[#CE1126] text-slate-300 hover:text-white transition-colors duration-200 rounded-none shrink-0 cursor-pointer"
            >
              <FaHome className="text-xs sm:text-sm" />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">
                Accueil
              </span>
            </button>

            <div className="h-4 w-[1px] bg-slate-800 shrink-0" />

            <div className="flex items-center gap-2 truncate">
              <FaExclamationTriangle className="text-[#CE1126] text-xs sm:text-sm shrink-0" />
              <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white truncate">
                Sinistre <span className="text-slate-400 font-bold hidden md:inline">| Déclaration & Prise en charge</span>
              </h1>
            </div>
          </div>

          {/* Droite : Navigation rapide contextuelle */}
          <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              to="/work"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-[#111827] hover:bg-slate-800 border border-slate-800 transition-colors rounded-none"
            >
              <FaCalculator className="text-[#CE1126] text-xs" />
              <span className="hidden xs:inline">Simulateur</span>
            </Link>

            <a
              href="tel:+243000000000"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-[#CE1126]/20 hover:bg-[#CE1126] border border-[#CE1126]/50 transition-colors rounded-none"
            >
              <FaPhoneAlt className="text-xs animate-pulse" />
              <span>Urgence 24/7</span>
            </a>
          </nav>

        </div>
      </header>

      {/* ================= 2. CENTRE DE DÉCLARATION DE SINISTRE (COMPACT) ================= */}
      <main className="flex-grow mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6 w-full"> 
        
        {/* En-tête compact */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-800/80 pb-3 sm:pb-4">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#111827] text-[#CE1126] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.18em] border border-slate-800 rounded-none"
            >
              <FaExclamationTriangle className="text-[10px]" /> Centre de Sinistre Digital
            </motion.div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-white uppercase leading-none">
              Déclaration de <span className="text-[#CE1126]">Sinistre</span>
            </h2>
          </div>
          
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium max-w-md sm:text-right leading-snug">
            Activez votre prise en charge immédiate. Analyse par nos experts ARCA sous <span className="text-white font-bold">24 à 48 heures</span>.
          </p>
        </div>

        {/* Grille principale : Formulaire (Col 7) + Assistance & Suivi (Col 5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start w-full">
          
          {/* BLOC GAUCHE : FORMULAIRE PRINCIPAL (COL 7) */}
          <motion.form 
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7 space-y-4 bg-[#111827] p-4 sm:p-5 border border-slate-800 rounded-none shadow-xl text-left"
          >
            {/* Ligne 1 : Numéro de police & Nom de l'Assuré */}
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1.5">
                  <FaShieldAlt className="text-[#CE1126]" size={11} /> Numéro de police *
                </label>
                <input
                  name="policyNumber"
                  value={formData.policyNumber}
                  onChange={handleChange}
                  type="text"
                  placeholder="EX : DRC-2026-045"
                  className="w-full border border-slate-800 bg-[#090d16] px-3 py-2 text-xs sm:text-sm font-bold outline-none transition focus:border-[#CE1126] text-white rounded-none placeholder-slate-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1.5">
                  <FaUser className="text-[#CE1126]" size={11} /> Nom de l'Assuré *
                </label>
                <input
                  name="insuredName"
                  value={formData.insuredName}
                  onChange={handleChange}
                  type="text"
                  placeholder="Nom complet du bénéficiaire"
                  className="w-full border border-slate-800 bg-[#090d16] px-3 py-2 text-xs sm:text-sm font-bold outline-none transition focus:border-[#CE1126] text-white rounded-none placeholder-slate-600"
                  required
                />
              </div>
            </div>

            {/* Ligne 2 : Date du sinistre & Branche Concernée */}
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1.5">
                  <FaCalendarAlt className="text-[#CE1126]" size={11} /> Date du sinistre *
                </label>
                <input
                  name="incidentDate"
                  value={formData.incidentDate}
                  onChange={handleChange}
                  type="date"
                  className="w-full border border-slate-800 bg-[#090d16] px-3 py-2 text-xs sm:text-sm font-bold outline-none transition focus:border-[#CE1126] text-white rounded-none cursor-pointer"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1.5">
                  <FaClipboardList className="text-[#CE1126]" size={11} /> Branche Concernée *
                </label>
                <select
                  name="incidentType"
                  value={formData.incidentType}
                  onChange={handleChange}
                  className="w-full border border-slate-800 bg-[#090d16] px-3 py-2 text-xs sm:text-sm font-bold outline-none transition focus:border-[#CE1126] cursor-pointer text-white rounded-none"
                  required
                >
                  <option value="" className="bg-[#111827] text-slate-500">Sélectionnez le type</option>
                  <option value="sante" className="bg-[#111827] text-white">Assurance Santé / Médical</option>
                  <option value="auto" className="bg-[#111827] text-white">Responsabilité Civile Auto</option>
                  <option value="habitation" className="bg-[#111827] text-white">Incendie / Habitation</option>
                  <option value="scolaire" className="bg-[#111827] text-white">Assurance Scolarité</option>
                  <option value="voyage" className="bg-[#111827] text-white">Assurance Voyage</option>
                  <option value="autre" className="bg-[#111827] text-white">Autres risques techniques</option>
                </select>
              </div>
            </div>

            {/* Ligne 3 : Montant Estimé & Téléphone */}
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1.5">
                  <FaMoneyBillWave className="text-[#CE1126]" size={11} /> Montant Estimé (USD)
                </label>
                <input
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  type="text"
                  placeholder="Ex : 250 USD (Facultatif)"
                  className="w-full border border-slate-800 bg-[#090d16] px-3 py-2 text-xs sm:text-sm font-bold outline-none transition focus:border-[#CE1126] text-white rounded-none placeholder-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1.5">
                  <FaPhoneAlt className="text-[#CE1126]" size={11} /> Téléphone / WhatsApp *
                </label>
                <input
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  type="tel"
                  placeholder="+243 81 000 0000"
                  className="w-full border border-slate-800 bg-[#090d16] px-3 py-2 text-xs sm:text-sm font-bold outline-none transition focus:border-[#CE1126] text-white rounded-none placeholder-slate-600"
                  required
                />
              </div>
            </div>

            {/* Ligne 4 : Email de suivi */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1.5">
                <FaEnvelope className="text-[#CE1126]" size={11} /> Email de notification (Facultatif)
              </label>
              <input
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                type="email"
                placeholder="assure@exemple.cd"
                className="w-full border border-slate-800 bg-[#090d16] px-3 py-2 text-xs sm:text-sm font-bold outline-none transition focus:border-[#CE1126] text-white rounded-none placeholder-slate-600"
              />
            </div>

            {/* Ligne 5 : Circonstances du sinistre */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1.5">
                <FaFileMedical className="text-[#CE1126]" size={11} /> Circonstances & Détails *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Décrivez brièvement le lieu, l'heure et les faits constatés..."
                className="w-full border border-slate-800 bg-[#090d16] p-3 text-xs sm:text-sm font-medium outline-none transition focus:border-[#CE1126] text-white rounded-none placeholder-slate-600 resize-none"
                required
              />
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#CE1126] hover:bg-[#a80d1e] disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-all duration-200 shadow-lg rounded-none cursor-pointer"
            >
              <span>{isSubmitting ? 'Transmission en cours...' : 'Transmettre la déclaration'}</span>
              {!isSubmitting && <FaArrowRight className="text-xs" />}
            </button>
          </motion.form>

          {/* BLOC DROIT : RÉCAPITULATIF, STATUT & PROCÉDURE (COL 5 - STICKY) */}
          <div className="lg:col-span-5 w-full space-y-4 lg:sticky lg:top-18">
            
            {/* Carte de confirmation immédiate si dossier soumis */}
            {submittedClaim && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-950/40 border border-emerald-500/50 p-4 rounded-none space-y-2"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
                  <FaCheckCircle className="text-sm shrink-0" />
                  <span>Dossier Enregistré avec Succès</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Référence de suivi : <strong className="text-white font-mono bg-slate-900 px-2 py-0.5 border border-slate-700">{submittedClaim.claimNumber}</strong>
                </p>
                <p className="text-[10px] text-emerald-300/80">
                  Un gestionnaire vous contactera sur votre numéro WhatsApp/Téléphone sous peu.
                </p>
              </motion.div>
            )}

            {/* Carte Protocole de Prise en Charge */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#111827] border border-slate-800 rounded-none overflow-hidden shadow-xl"
            >
              <div className="bg-[#090d16] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 flex items-center gap-2">
                  <FaClock className="text-[#CE1126]" /> Protocole Express RDC
                </span>
                <span className="text-[9px] font-bold uppercase text-emerald-400">
                  24h – 48h
                </span>
              </div>

              <div className="p-4 space-y-3">
                <div className="space-y-2.5 text-[11px] text-slate-300">
                  <div className="flex items-start gap-2.5 bg-[#090d16] p-2.5 border border-slate-800/80">
                    <span className="text-[10px] font-black text-[#CE1126] bg-[#CE1126]/10 px-1.5 py-0.5 border border-[#CE1126]/30">01</span>
                    <div>
                      <p className="font-bold text-white text-[11px]">Enregistrement Numérique</p>
                      <p className="text-[10px] text-slate-400">Génération immédiate de votre numéro de sinistre.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-[#090d16] p-2.5 border border-slate-800/80">
                    <span className="text-[10px] font-black text-[#CE1126] bg-[#CE1126]/10 px-1.5 py-0.5 border border-[#CE1126]/30">02</span>
                    <div>
                      <p className="font-bold text-white text-[11px]">Justificatifs WhatsApp</p>
                      <p className="text-[10px] text-slate-400">Transmettez photos, ordonnances ou constat amiable directement à l'expert.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-[#090d16] p-2.5 border border-slate-800/80">
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/30">03</span>
                    <div>
                      <p className="font-bold text-white text-[11px]">Règlement & Tiers-Payant</p>
                      <p className="text-[10px] text-slate-400">Prise en charge hôpital/garage agréé ou remboursement Mobile Money.</p>
                    </div>
                  </div>
                </div>

                {/* Encart Assistance Directe */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-bold">
                      Assistance Sinistre Kinshasa / Provinces
                    </span>
                    <span className="text-xs font-black text-white">
                      Ligne directe 24h/24
                    </span>
                  </div>
                  <a
                    href="tel:+243000000000"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-[#CE1126] text-white text-[10px] font-black uppercase tracking-wider transition-colors rounded-none flex items-center gap-1.5"
                  >
                    <FaPhoneAlt className="text-[10px]" /> Appeler
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </main>
      </div>
  );
}