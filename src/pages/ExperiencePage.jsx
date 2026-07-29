import React from 'react';
import { motion } from 'framer-motion';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import { 
  FaBalanceScale, FaShieldAlt, FaCertificate, FaGavel, 
  FaCheckCircle, FaUserShield, FaBuilding, FaHandshake, FaArrowRight 
} from 'react-icons/fa';

// Importation de l'image de fond depuis vos assets
import background1 from '../assets/background1.png';

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
    <div className="min-h-screen bg-white flex flex-col antialiased font-sans">
      <NavbarSecured />

      {/* ================= 1. HEADER INSTITUTIONNEL MODERNE ================= */}
      <header className="relative flex flex-col bg-white overflow-hidden">
        {/* Visuel en haut (Format Bannière) */}
        <div className="w-full h-[vh] md:h-[vh] relative overflow-hidden bg-slate-900">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{ backgroundImage: `url(${background1})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>

        {/* Contenu textuel */}
        <div className="relative z-20 max-w-6xl mx-auto px-6 py-12 md:py-20 text-center flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <span className="px-4 py-1 text-[px] font-bold uppercase tracking-[em] text-slate-500 border-l-2 border-red-600">
              Conformité Réglementaire & Transparence
            </span>
            <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tight leading-none">
              Le Cadre Légal de l'Assurance <br />
              <span className="text-red-600 italic">en RD Congo</span>
            </h1>
            <p className="max-w-2xl mx-auto text-slate-600 text-lg md:text-xl leading-relaxed font-light">
              DRC Assurances apporte traçabilité et sécurité au marché congolais pour offrir à la diaspora un outil de protection fiable et certifié par l'ARCA.
            </p>
          </motion.div>
        </div>
      </header>

      {/* ================= 2. LES PILIERS DE LA CONFORMITÉ ================= */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-16 w-full space-y-24">
        
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-50 p-10 rounded-[rem] border border-slate-100 hover:shadow-xl hover:border-red-100 transition-all group"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                {pillar.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase mb-4 tracking-tight leading-tight">
                {pillar.title}
              </h3>
              <p className="text-slate-500 leading-relaxed font-medium text-sm">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </section>

        {/* ================= 3. RAPPEL DE LA LOI & OBLIGATIONS ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center bg-white p-6 md:p-12 rounded-[rem] border border-slate-100 shadow-sm">
          <div className="space-y-6">
            <span className="inline-block px-4 py-1.5 rounded-full bg-red-50 text-red-600 text-[px] font-black uppercase tracking-widest border border-red-100">
              Rappel de la Loi
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-none tracking-tighter">
              Les Assurances <br />
              <span className="text-red-600">Strictement Obligatoires</span>
            </h2>
            <p className="text-lg text-slate-600 font-medium leading-relaxed">
              L'Autorité de Régulation (ARCA) rappelle l'obligation de souscrire vos polices auprès de structures enregistrées localement sous peine de sanctions majeures.
            </p>
            <div className="flex gap-4 items-center pt-6 border-t border-slate-50">
              <div className="flex -space-x-3">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white border-4 border-white"><FaBuilding size={16} /></div>
                <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center text-white border-4 border-white"><FaHandshake size={16} /></div>
              </div>
              <p className="text-[px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                Synergie technologique <br /> & conformité ARCA
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-10 md:p-12 rounded-[rem] text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full" />
            <h4 className="text-xl font-black uppercase mb-8 tracking-tighter italic flex items-center gap-3">
              <FaShieldAlt className="text-red-600" /> Liste de Contrôle ARCA
            </h4>
            <ul className="space-y-6">
              {obligations.map((item, idx) => (
                <li key={idx} className="flex items-start gap-4 text-slate-300 group">
                  <FaCheckCircle className="text-red-600 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-sm md:text-base font-medium leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA Institutionnel */}
        <section className="text-center py-12">
           <button className="px-12 py-5 border-2 border-red-600 text-red-600 font-black uppercase text-[px] tracking-[em] hover:bg-red-600 hover:text-white transition-all active:scale-95 flex items-center gap-3 mx-auto">
             Consulter le Code des Assurances <FaArrowRight />
           </button>
        </section>

      </main>

      <Footer />
    </div>
  );
}
