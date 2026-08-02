import React from 'react';
import { motion } from 'framer-motion';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import { 
  FaBalanceScale, FaShieldAlt, FaCertificate, FaGavel, 
  FaCheckCircle, FaUserShield, FaBuilding, FaHandshake, FaArrowRight 
} from 'react-icons/fa';

// Importation de l'image de fond depuis vos assets
import background1 from '../assets/background_drc.jpeg';

export default function ExperiencePage() {
  
  const pillars = [
    {
      icon: <FaGavel className="text-red- text-xl" />,
      title: "Légalisation & Code des Assurances",
      description: "Conformément à la Loi n° / en RDC, le marché est libéralisé Nous garantissons la validité juridique absolue de chaque contrat via nos partenaires agréés"
    },
    {
      icon: <FaCertificate className="text-red- text-xl" />,
      title: "Régulation par l'ARCA",
      description: "L'Autorité de Régulation (ARCA) veille à la protection des assurés Toutes nos formules respectent strictement les tarifs et obligations réglementaires"
    },
    {
    // 🟢 CORRIGÉ : L'icône FaUserShield est maintenant correctement fermée />
    icon: <FaUserShield className="text-red-600 text-xl" />,
    title: "Garantie des Fonds & Tiers-Payant",
    description: "Vos primes sont sécurisées sur des comptes réglementés. Le règlement s'effectue directement auprès des prestataires sans avance de frais pour vos proches."
  }
  ];

  const obligations = [
    "Assurance Responsabilité Civile Automobile (Obligatoire ARCA)",
    "Assurance Risques de Construction & Incendie",
    "Assurance Faculté à l'Importation (Marchandises)",
    "Assurance Frontière Terrestre & Maritime"
  ];

   return (
    <div className="min-h-screen bg-[#090d16] flex flex-col antialiased font-sans text-white">
      <NavbarSecured />

      {/* ================= 1. HEADER INSTITUTIONNEL MODERNE ================= */}
      <header className="relative flex flex-col bg-[#090d16] overflow-hidden border-b border-slate-900">
        {/* Visuel en haut (Format Bannière rectangulaire stricte) */}
        <div className="w-full h-[40vh] md:h-[50vh] relative overflow-hidden bg-slate-950 rounded-none">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 brightness-110 contrast-105"
            style={{ backgroundImage: `url(${background1})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent" />
        </div>

        {/* Contenu textuel */}
        <div className="relative z-20 max-w-6xl mx-auto px-6 py-12 md:py-20 text-center flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <span className="inline-block px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#CE1126] bg-[#CE1126]/10 border border-[#CE1126]/20 rounded-none">
              Conformité Réglementaire & Transparence
            </span>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-none uppercase">
              Le Cadre Légal de l'Assurance <br />
              <span className="text-[#CE1126] italic normal-case">en RD Congo</span>
            </h1>
            <p className="max-w-2xl mx-auto text-[#94a3b8] text-base md:text-xl leading-relaxed font-semibold">
              ESNAs apporte traçabilité et sécurité au marché congolais pour offrir à la diaspora un outil de protection fiable et certifié par l'ARCA.
            </p>
          </motion.div>
        </div>
      </header>

      {/* ================= 2. LES PILIERS DE LA CONFORMITÉ ================= */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-16 w-full space-y-20 md:space-y-24">
        
        {/* Grille des piliers en Bento Box carrée */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#111827] p-8 md:p-10 border border-slate-800 hover:shadow-2xl hover:border-[#CE1126]/40 transition-all duration-300 group rounded-none text-left"
            >
              <div className="w-14 h-14 bg-slate-950 border border-slate-800 flex items-center justify-center mb-8 shadow-md rounded-none text-[#CE1126]">
                {pillar.icon}
              </div>
              <h3 className="text-xl font-black text-white uppercase mb-4 tracking-tight leading-tight group-hover:text-[#CE1126] transition-colors">
                {pillar.title}
              </h3>
              <p className="text-[#94a3b8] leading-relaxed font-semibold text-sm">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </section>

        {/* ================= 3. RAPPEL DE LA LOI & OBLIGATIONS ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center bg-[#111827] p-6 md:p-12 border border-slate-800 shadow-xl rounded-none">
          <div className="space-y-6 text-left">
            <span className="inline-block px-4 py-1.5 bg-[#CE1126]/10 text-[#CE1126] text-[10px] font-black uppercase tracking-widest border border-[#CE1126]/20 rounded-none">
              Rappel de la Loi
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white leading-none tracking-tighter uppercase">
              Les Assurances <br />
              <span className="text-[#CE1126]">Strictement Obligatoires</span>
            </h2>
            <p className="text-base md:text-lg text-[#94a3b8] font-semibold leading-relaxed">
              L'Autorité de Régulation (ARCA) rappelle l'obligation de souscrire vos polices auprès de structures enregistrées localement sous peine de sanctions majeures.
            </p>
            <div className="flex gap-4 items-center pt-6 border-t border-slate-800">
              <div className="flex -space-x-3">
                <div className="w-11 h-11 rounded-none bg-[#CE1126] flex items-center justify-center text-white border-2 border-[#111827] shadow-md"><FaBuilding size={14} /></div>
                <div className="w-11 h-11 rounded-none bg-slate-950 flex items-center justify-center text-white border-2 border-[#111827] shadow-md"><FaHandshake size={14} /></div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                Synergie technologique <br /> & conformité ARCA
              </p>
            </div>
          </div>

          {/* Panneau de droite : Liste de contrôle en Onyx profond */}
          <div className="bg-slate-950 p-8 md:p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800 rounded-none text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#CE1126]/5 blur-3xl rounded-none pointer-events-none" />
            <h4 className="text-lg md:text-xl font-black uppercase mb-8 tracking-tight flex items-center gap-3">
              <FaShieldAlt className="text-[#CE1126]" size={16} /> Liste de Contrôle ARCA
            </h4>
            <ul className="space-y-5">
              {obligations.map((item, idx) => (
                <li key={idx} className="flex items-start gap-4 text-slate-300 group">
                  <FaCheckCircle className="text-[#CE1126] mt-1 flex-shrink-0 group-hover:scale-105 transition-transform" size={14} />
                  <span className="text-xs md:text-sm font-semibold leading-snug text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA Institutionnel Rectangulaire */}
        <section className="text-center py-6">
          <button className="px-10 py-5 border-2 border-white bg-white text-black font-black uppercase text-[11px] tracking-[0.25em] hover:bg-transparent hover:text-white transition-all duration-300 rounded-none active:scale-95 flex items-center gap-3 mx-auto shadow-xl">
            Consulter le Code des Assurances <FaArrowRight size={12} />
          </button>
        </section>

      </main>

      <Footer />
    </div>
  );
}
