import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCheckCircle, FaRegBuilding, FaGlobe, FaCertificate, 
  FaCar, FaGraduationCap, FaPlaneDeparture, FaChevronDown, 
  FaShieldAlt, FaExternalLinkAlt 
} from 'react-icons/fa';
import NavbarSecured from '../components/NavbarSecured'; // Ajustez le chemin selon votre structure
// Importez votre Footer ici ou utilisez la structure simplifiée intégrée au bas

export default function PartnersPage() {
  const [openFaq, setOpenFaq] = useState(null);

  // Écosystème étendu à 6 blocs de garanties (Médical, Auto, Scolarité, Voyage + Cadre Légal)
  const partners = [
    {
      id: "arca-comp",
      type: "Régulation & Conformité",
      name: "Agrément National ARCA",
      description: "ESNAs opère sous le contrôle rigoureux de l'Autorité de Régulation et de Contrôle des Assurances en RDC. Toutes nos polices sont co-émises par des assureurs locaux certifiés.",
      impact: "Garantie de légalité totale et conformité stricte avec le code des assurances congolais.",
      icon: <FaCertificate size={22} />,
      color: "#00A3E0"
    },
    {
      id: "global-re",
      type: "Réassurance Mondiale",
      name: "Pool de Réassureurs Top 10",
      description: "Les risques souscrits auprès de la diaspora sont cédés à des géants de la réassurance internationale basés à Londres, Munich et Johannesburg, protégeant vos fonds contre tout risque systémique.",
      impact: "Capacité financière de couverture virtuellement illimitée pour protéger vos proches.",
      icon: <FaGlobe size={22} />,
      color: "#CE1126"
    },
    {
      id: "medical-net",
      type: "Réseau Santé & Cliniques",
      name: "Tiers-Payant Médical Direct",
      description: "Un réseau interconnecté d'hôpitaux et centres de santé de référence à Kinshasa, Lubumbashi et Goma. Validation instantanée des urgences médicales via notre protocole QR Code.",
      impact: "Zéro avance de fonds requise pour vos bénéficiaires lors des admissions en clinique.",
      icon: <FaRegBuilding size={22} />,
      color: "#15cfe7"
    },
    {
      id: "auto-network",
      type: "Réseau Automobile & Experts",
      name: "Garages & Experts Agréés",
      description: "Pour notre solution Automobile, nous collaborons avec des réseaux de garages modernes et des experts certifiés ARCA pour évaluer et réparer les véhicules sinistrés au pays sans délais.",
      impact: "Prise en charge rectiligne des réparations et mise à disposition rapide de rapports d'expertise.",
      icon: <FaCar size={22} />,
      color: "#FDD835"
    },
    {
      id: "scolarite-trust",
      type: "Garantie Éducation",
      name: "Établissements & Banques",
      description: "Notre produit Scolarité est adossé à des trusts financiers sécurisés garantissant le versement direct et exclusif des frais d'études aux écoles et universités de vos enfants en RDC.",
      impact: "Sanctification du budget scolaire directement converti en scolarité réelle, excluant tout détournement.",
      icon: <FaGraduationCap size={22} />,
      color: "#9333EA"
    },
    {
      id: "voyage-assist",
      type: "Assistance Internationale",
      name: "Logistique Voyage & Rapatriement",
      description: "Notre volet Voyage s'appuie sur des plateformes d'assistance mondiales actives 24h/24 pour l'évacuation médicale, le rapatriement ou la gestion des pertes de bagages à l'aéroport de Ndjili et à l'international.",
      impact: "Prise en charge logistique et hospitalière immédiate dès le passage des frontières.",
      icon: <FaPlaneDeparture size={22} />,
      color: "#EA580C"
    }
  ];

  // FAQ professionnelle axée sur la réassurance et la confiance
  const faqs = [
    {
      q: "Comment puis-je vérifier la légalité des couvertures proposées par ESNAs ?",
      a: "Toutes nos offres sont construites en partenariat exclusif avec des compagnies d'assurances locales disposant d'un agrément officiel délivré par l'ARCA en RDC. Les numéros d'agréments et les conditions générales de chaque produit sont explicitement mentionnés lors de votre souscription."
    },
    {
      q: "Qu'est-ce que la réassurance mondiale et en quoi protège-t-elle mes fonds ?",
      a: "La réassurance est l'assurance des assureurs. En cédant une partie des risques à des réassureurs internationaux majeurs, ESNAs garantit que même en cas de sinistres massifs ou simultanés en RDC, les fonds nécessaires aux règlements et aux soins médicaux seront intégralement versés."
    },
    {
      q: "Le système de Tiers-Payant fonctionne-t-il pour l'automobile et la scolarité ?",
      a: "Oui, le modèle de transparence ESNAs s'applique partout. Pour la santé, la prise en charge est immédiate en clinique. Pour la scolarité, les fonds sont versés directement à l'établissement scolaire. Pour l'automobile, le règlement est géré directement auprès du garage agréé chargé des réparations."
    }
  ];

  return (
    <div className="bg-white min-h-screen font-sans w-full flex flex-col antialiased text-slate-900">
      
      {/* 1. BARRE DE NAVIGATION */}
      <NavbarSecured />

      {/* EN-TÊTE HERO DE LA PAGE PARTENAIRES */}
      <header className="bg-slate-950 text-white py-20 md:py-28 border-b border-slate-900 relative overflow-hidden rounded-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-950 to-[#CE1126]/10 opacity-70 z-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#CE1126] bg-[#CE1126]/10 px-4 py-1.5 border border-[#CE1126]/30 rounded-none inline-block">
            Sécurité Institutionnelle & Traçabilité
          </span>
          <h1 className="text-4xl md:text-7xl font-white text-slate-250 uppercase tracking-tight leading-none max-w-4xl">
            Garanties Financières <br />& <span className="text-[#00A3E0]">Pool Partenaires</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-250 font-medium max-w-2xl leading-relaxed">
            Découvrez l'infrastructure de régulation nationale ARCA et les leaders de la réassurance mondiale qui certifient et solidifient chaque produit souscrit sur ESNAs.
          </p>
        </div>
      </header>

      {/* 2. GRILLE INTERACTIVE DES 6 GRANDS BLOCS DE PARTENARIAT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 w-full flex flex-col space-y-12">
        <div className="border-b border-slate-100 pb-6 text-left">
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            Une infrastructure robuste par secteur d'activité
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {partners.map((partner, idx) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="bg-white border border-slate-200 p-8 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 rounded-none relative overflow-hidden group"
            >
              <div className="space-y-6">
                {/* En-tête de carte */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-none">
                    {partner.type}
                  </span>
                  <div 
                    className="w-10 h-10 border flex items-center justify-center rounded-none bg-slate-50 text-slate-900 transition-colors duration-300 group-hover:text-white"
                    style={{ '--hover-bg': partner.color }}
                  >
                    {partner.icon}
                  </div>
                </div>

                {/* Textes explicatifs */}
                <div className="space-y-3">
                  <h3 className="text-lg font-black uppercase text-slate-950 tracking-tight group-hover:text-[#CE1126] transition-colors">
                    {partner.name}
                  </h3>
                  <p className="text-lg text-slate-950 leading-relaxed font-semibold">
                    {partner.description}
                  </p>
                </div>
              </div>

              {/* Bloc d'impact / de garantie */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-start gap-3 bg-slate-50 p-4 rounded-none border border-dashed border-slate-200">
                <FaCheckCircle className="text-emerald-600 mt-0.5 flex-shrink-0" size={16} />
                <div className="text-xs font-bold text-slate-800 leading-snug">
                  <span className="text-slate-400 uppercase text-[9px] block font-black tracking-wider mb-0.5">Engagement ESNAs :</span>
                  {partner.impact}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. SECTION COMMERCIALE DE RÉASSURANCE / APPEL À LA VÉRIFICATION */}
      <section className="bg-slate-950 text-white py-16 px-4 sm:px-6 w-full rounded-none">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 border-l-4 border-[#CE1126] pl-6 md:pl-10">
          <div className="space-y-2 text-left">
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              Besoin de consulter les agréments officiels ?
            </h3>
            <p className="text-slate-400 text-sm font-semibold max-w-2xl">
              Consultez les agréments officiels de nos partenaires certifiés.
            </p>
          </div>
        </div>
      </section>

      {/* 4. BLOC DES FOIRE AUX QUESTIONS (FAQ) SPÉCIFIQUE PARTENAIRES */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 w-full space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-slate-900">
            Questions fréquentes & <span className="text-[#CE1126]">Garanties</span>
          </h2>
          <p className="text-slate-600 font-semibold text-base max-w-xl mx-auto">
            Des réponses claires pour lever toute ambiguïté sur la gestion et la sécurité de vos capitaux.
          </p>
        </div>

        <div className="space-y-4 w-full">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-slate-200 bg-white rounded-none">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full p-5 flex items-center justify-between gap-4 text-left font-black uppercase text-xs md:text-sm tracking-tight text-slate-900 hover:bg-slate-50 transition-colors rounded-none"
              >
                <span>{faq.q}</span>
                <motion.span
                  animate={{ rotate: openFaq === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[#CE1126] flex-shrink-0"
                >
                  <FaChevronDown size={14} />
                </motion.span>
              </button>
              
              <AnimatePresence initial={false}>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden border-t border-slate-100"
                  >
                    <div className="p-5 text-sm text-slate-600 font-medium leading-relaxed bg-slate-50/50">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FIN DU COMPOSANT : BASE DU FOOTER (Pour correspondre au style ESNAs) */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 text-center text-xs font-bold uppercase tracking-widest rounded-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-baseline font-black tracking-tight text-xl text-white uppercase select-none">
            ESNA<span className="text-[#CE1126] lowercase font-extrabold -ml-[1px]">s</span>
          </div>
          <p className="text-[10px] text-slate-500 normal-case font-semibold">
            © {new Date().getFullYear()} ESNAs Assurance RDC. Écosystème Numérique de confiance Diaspora. Tous droits réservés.
          </p>
        </div>
      </footer>

    </div>
  );
}
