import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from 'react-router-dom';
import { FaChevronDown, FaQuestionCircle, FaShieldAlt, FaArrowRight } from "react-icons/fa";

// 🟢 TOUTES les chaînes sont maintenant fermées correctement
const faqs = [
  {
    question: "Comment fonctionne l'achat pour un proche en RDC ?",
    answer: "Depuis l'étranger, sélectionnez une formule (Santé, Auto, Scolaire), renseignez les coordonnées du bénéficiaire et payez par carte Votre proche reçoit sa carte virtuelle instantanément par WhatsApp",
  },
  {
    question: "ESNAS est-elle agréée par l'ARCA ?",
    answer: "Absolument Toutes nos offres et nos partenaires opèrent en stricte conformité avec la législation", 
  },
  {
    question: "Quels sont les moyens de paiement acceptés ?",
    answer: "Diaspora : Carte Bancaire, Stripe et PayPal En RDC : Mobile Money (M-Pesa, Orange Money, Airtel Money) Tout est sécurisé et instantané",
  },
  {
    question: "Comment le bénéficiaire peut-il se faire soigner ?",
    answer: "Le bénéficiaire présente simplement son QR Code en clinique partenaire L'établissement vérifie les droits en temps réel pour une prise en charge sans frais avancés",
  },
  {
    question: "Quel est le délai de traitement des sinistres ?",
    answer: "Déclaration directe via l'application Analyse en -h et règlements aux prestataires en moins de  jours ouvrés",
  },
];


function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-24 px-6 bg-white border-t border-slate-100 w-full relative overflow-hidden transition-all duration-500 ease-out hover:z-10 hover:border-red-100 hover:shadow-[0_25px_60px_-15px_rgba(206,17,38,0.12)]" id="faq">
      <div className="max-w-4xl mx-auto">
        
        {/* En-tête cinétique */}
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-red-600 text-[px] font-black uppercase tracking-[em] border border-red-100 mb-6"
          >
            <FaQuestionCircle /> Centre d'assistance
          </motion.div>
          
          <h2 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-6">
            Foire Aux <span className="text-red-600 italic">Questions</span>
          </h2>
          
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
            Tout ce que vous devez savoir sur la protection de vos proches en RDC.
          </p>
        </div>

        {/* Liste des FAQs */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div 
              key={idx}
              className={`border-b border-slate-100 transition-colors ${openIndex === idx ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'}`}
            >
              <button 
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full py-8 flex items-center justify-between text-left group"
              >
                <span className={`text-xl md:text-2xl font-black tracking-tight uppercase transition-colors ${openIndex === idx ? 'text-red-600' : 'text-slate-900'}`}>
                  {faq.question}
                </span>
                <motion.div 
                  animate={{ rotate: openIndex === idx ? 180 : 0 }}
                  className={`text-xl ${openIndex === idx ? 'text-red-600' : 'text-slate-300'}`}
                >
                  <FaChevronDown />
                </motion.div>
              </button>
              
              <AnimatePresence initial={false}>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-8 pr-12 text-lg text-slate-500 font-medium leading-relaxed italic">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Bannière d'aide */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="mt-20 relative p-12 rounded-[rem] bg-slate-950 overflow-hidden shadow-2xl"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-left">
              <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-2 italic">
                Besoin d'un contrat <span className="text-red-600">sur-mesure ?</span>
              </h3>
              <p className="text-slate-400 font-light">
                Nos experts ARCA conçoivent des solutions collectives pour les entreprises.
              </p>
            </div>

<Link
  to="/contact" // 🟢 REDIRECTION ACCENTUÉE : Pointe vers votre route de contact
  className="px-8 py-4 bg-white text-black font-black uppercase text-[11px] tracking-[0.25em] flex items-center gap-3 transition-all hover:bg-slate-50 active:scale-95 shadow-lg group inline-flex"
>
  Parler à un expert 
  {/* Micro-animation group-hover pour propulser la flèche rouge vers la droite au survol */}
  <FaArrowRight className="text-red-600 transition-transform duration-300 group-hover:translate-x-1.5" size={11} />
</Link>

          </div>
        </motion.div>

      </div>
    </section>
  );
}

export default FAQSection;
