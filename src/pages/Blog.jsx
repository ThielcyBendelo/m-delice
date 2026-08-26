import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Composants de structure
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';

// Icônes épurées
import { FaBookOpen, FaCalendarAlt, FaUser, FaArrowRight, FaShieldAlt, FaHeartbeat, FaCar } from 'react-icons/fa';

// Importation explicite de vos visuels locaux de réassurance
import background1 from '../assets/background_drc.jpeg';
import background2 from '../assets/background_drc.jpeg';

// Simulation de données d'articles harmonisées
const blogPosts = [
  {
    id: 1,
    category: "Régulation",
    icon: <FaShieldAlt className="text-[#CE1126]" />,
    title: "Comprendre la loi ARCA : Quelles sont les assurances obligatoires en RDC ?",
    excerpt: "Depuis la libéralisation du secteur des assurances par l'ARCA, plusieurs couvertures sont devenues strictement obligatoires pour les particuliers et entreprises en RD Congo. Faisons le point.",
    author: "Direction Technique ARCA",
    date: "15 Mai 2026",
    image: background1, 
  },
  {
    id: 2,
    category: "Diaspora & Santé",
    icon: <FaHeartbeat className="text-[#CE1126]" />,
    title: "Comment prendre soin de la santé de ses parents à Kinshasa depuis l'étranger ?",
    excerpt: "Envoyer de l'argent par agence lors d'une urgence médicale est stressant et coûteux. Découvrez comment la micro-assurance connectée transforme la prise en charge médicale des familles.",
    author: "Dr. Albert Mukendi",
    date: "02 Juin 2026",
    image: background2, 
  },
  {
    id: 3,
    category: "Automobile",
    icon: <FaCar className="text-[#CE1126]" />,
    title: "Contrat d'assurance Auto en RDC : Franchise, bonus et tiers-payant expliqués",
    excerpt: "Vous achetez ou renouvelez une assurance automobile pour un proche à Lubumbashi ou Kinshasa ? Voici les pièges à éviter et comment fonctionne le réseau de garages agréés en cas de sinistre.",
    author: "Service Sinistres DRC",
    date: "28 Juin 2026",
    image: background1, 
  }
];

export default function Blog() {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrer les articles de manière sécurisée
  const filteredPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased font-sans">
      {/* Barre de navigation sécurisée au sommet */}
      <NavbarSecured />

      {/* ================= 1. EN-TÊTE DU BLOG (Style Épuré International) ================= */}
      <header className="relative flex flex-col bg-white overflow-hidden border-b border-slate-100">
        <div className="relative z-20 max-w-6xl mx-auto px-6 py-20 pt-32 text-center flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full flex flex-col items-center">
            
            <span className="px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-950 border-l-2 border-[#CE1126]">
              <FaBookOpen className="inline mr-1" /> Guide de l'Assuré & Prévention
            </span>
            
            <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tight leading-none uppercase">
              L'Éducation Financière <br />
              <span className="text-[#CE1126] italic">en RD Congo</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-[#FDD100] text-lg md:text-xl leading-relaxed font-bold">
              Comprenez vos droits, optimisez vos contrats d'assurance et découvrez comment protéger au mieux vos proches restés au pays.
            </p>

            {/* Barre de recherche FinTech minimaliste sur Fond Blanc */}
            <div className="mt-6 w-full max-w-md">
              <input
                type="text"
                placeholder="Rechercher un article (ex: ARCA, Santé)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-b-2 border-slate-200 bg-transparent py-3 text-base font-bold outline-none transition focus:border-red-600 focus:placeholder-transparent text-slate-900 text-center"
              />
            </div>

          </motion.div>
        </div>
      </header>

      {/* ================= 2. GRILLE D'AFFICHAGE DES ARTICLES ================= */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-16 w-full">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-bold uppercase tracking-wider text-sm">
            Aucun article ne correspond à votre recherche.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredPosts.map((post, idx) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.05 }}
                className="bg-white rounded-[2rem] overflow-hidden shadow-md flex flex-col justify-between hover:shadow-2xl transition-all duration-500 border border-slate-100 group"
              >
                {/* Zone Image locale (Assets) */}
                <div className="relative h-56 w-full overflow-hidden bg-slate-950">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Badge de catégorie flottant style bento épuré */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 text-slate-900 border border-slate-100 z-10">
                    {post.icon}
                    <span>{post.category}</span>
                  </div>
                </div>

                {/* Contenu textuel interne */}
                <div className="p-8 flex-grow flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Métadonnées (Date & Auteur) */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><FaCalendarAlt className="text-red-600" /> {post.date}</span>
                      <span className="flex items-center gap-1.5"><FaUser className="text-slate-400" /> {post.author}</span>
                    </div>
                    {/* Titre de l'article */}
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-snug group-hover:text-[#CE1126] transition-colors duration-200">
                      {post.title}
                    </h3>
                    {/* Extrait descriptif */}
                    <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Bouton d'action final : Rectangulaire, Bordure Rouge, Contraste maximum */}
                  <div className="pt-8 mt-auto">
                    <button className="w-full py-4 border-2 border-[#CE1126] bg-white text-black font-extrabold uppercase text-[11px] tracking-[0.25em] shadow-sm transition-all hover:bg-[#CE1126] hover:text-white flex items-center justify-center gap-2">
                      Lire l'article <FaArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                </div>
              </motion.article>
            ))}
          </div>
        )}
      </main>

      {/* Pied de page unique */}
      <Footer />
    </div>
  );
}
