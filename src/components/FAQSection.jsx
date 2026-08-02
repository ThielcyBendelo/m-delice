import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from 'react-router-dom';
import { FaChevronDown, FaQuestionCircle, FaArrowRight } from "react-icons/fa";

const faqs = [
  {
    question: "Comment fonctionne l'achat pour un proche en RDC ?",
    answer: "Depuis l'étranger, sélectionnez une formule (Santé, Auto, Scolaire, Voyage), renseignez les coordonnées du bénéficiaire et payez par carte bancaire. Votre proche reçoit sa carte virtuelle d'assuré instantanément par WhatsApp.",
  },
  {
    question: "ESNAs est-elle agréée par l'ARCA ?",
    answer: "Absolument. Toutes nos offres et nos partenaires assureurs opèrent en stricte conformité avec la législation de l'ARCA et le Code des Assurances en vigueur en République Démocratique du Congo.", 
  },
  {
    question: "Quels sont les moyens de paiement acceptés ?",
    answer: "Pour la diaspora : Carte Bancaire, Stripe et PayPal. Pour les locaux en RDC : Mobile Money (M-Pesa, Orange Money, Airtel Money, Afrimoney). Tout notre écosystème est chiffré, sécurisé et instantané.",
  },
  {
    question: "Comment le bénéficiaire peut-il se faire soigner ?",
    answer: "Le bénéficiaire présente simplement son QR Code sur son smartphone dans l'une de nos cliniques partenaires. L'établissement vérifie les droits en temps réel pour une prise en charge directe sans aucun frais avancé.",
  },
  {
    question: "Quel est le délai de traitement des sinistres ?",
    answer: "La déclaration s'effectue directement via l'application. L'analyse est traitée en 24 heures et les règlements aux prestataires ou garages agréés sont finalisés en moins de 3 jours ouvrés.",
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-20 md:py-28 px-4 sm:px-6 bg-[#090d16] border-t border-slate-900 w-full relative overflow-hidden transition-all duration-500 ease-out hover:z-10 hover:border-red-950/40 hover:shadow-[0_25px_60px_-15px_rgba(206,17,38,0.25)]" id="faq">
      <div className="max-w-4xl mx-auto">
        
        {/* En-tête de section */}
        <div className="text-center mb-16 md:mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#111827] text-[#CE1126] text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] border border-slate-800 mb-6 rounded-none shadow-sm"
          >
            <FaQuestionCircle /> Centre d'assistance ESNAs
          </motion.div>
          
          <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none mb-6">
            Foire Aux <span className="text-[#CE1126] italic normal-case">Questions</span>
          </h2>
          
          <p className="text-base md:text-lg text-[#94a3b8] max-w-2xl mx-auto font-bold leading-relaxed">
            Tout ce que vous devez savoir sur la protection réglementaire, le Tiers-Payant et la prise en charge de vos proches au pays.
          </p>
        </div>

        {/* Liste des FAQs Bento Style */}
        <div className="space-y-4 w-full">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className={`border-b border-slate-900 transition-colors duration-200 rounded-none ${openIndex === idx ? 'bg-[#111827]/60' : 'hover:bg-[#111827]/20'}`}
            >
              <button 
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full py-6 md:py-7 flex items-center justify-between text-left group px-4 focus:outline-none rounded-none"
              >
                <span className={`text-base md:text-lg font-black tracking-tight uppercase transition-colors duration-200 ${openIndex === idx ? 'text-[#CE1126]' : 'text-white group-hover:text-[#CE1126]'}`}>
                  {faq.question}
                </span>
                <motion.div 
                  animate={{ rotate: openIndex === idx ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className={`text-lg flex-shrink-0 ${openIndex === idx ? 'text-[#CE1126]' : 'text-slate-500 group-hover:text-slate-300'}`}
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
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pb-6 px-4 pr-6 md:pr-12 text-sm text-[#94a3b8] font-semibold leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Bannière d'aide collective Fintech */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 md:mt-20 relative p-8 md:p-12 bg-[#111827] border border-slate-800 overflow-hidden shadow-2xl rounded-none text-center md:text-left"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#CE1126]/5 blur-3xl rounded-none pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 w-full">
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                Besoin d'un contrat <span className="text-[#CE1126] italic normal-case">sur-mesure ?</span>
              </h3>
              <p className="text-sm font-semibold text-[#94a3b8] max-w-xl">
                Nos experts ARCA conçoivent des solutions sur-mesure et collectives pour les associations de la diaspora et les entreprises.
              </p>
            </div>

            <Link
              to="/contact"
              className="w-full md:w-auto px-8 py-4 bg-white text-black font-extrabold uppercase text-[11px] tracking-[0.25em] flex items-center justify-center gap-3 transition-all hover:bg-[#CE1126] hover:text-white active:scale-95 shadow-lg group rounded-none shrink-0"
            >
              Parler à un expert 
              <FaArrowRight className="text-[#CE1126] group-hover:text-white transition-transform duration-300 group-hover:translate-x-1.5" size={12} />
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

export default FAQSection;
