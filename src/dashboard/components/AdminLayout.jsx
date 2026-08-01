import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '../../services/authService';
import { 
  FaTachometerAlt, FaUsers, FaUserShield, FaCreditCard, 
  FaFileInvoiceDollar, FaChartBar, FaWhatsapp, FaUserCircle, 
  FaSignOutAlt, FaBars, FaTimes, FaCoins 
} from 'react-icons/fa';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const currentUser = authService.getCurrentUser() || {
    firstName: "Utilisateur",
    lastName: "Diaspora",
    role: "Diaspora"
  };

  // Liste des menus du tableau de bord calqués sur vos sous-routes d'assurance
  const menuItems = [
    { path: '/dashboard', label: 'Vue d’ensemble', icon: <FaTachometerAlt /> },
    { path: '/dashboard/clients', label: 'Bénéficiaires RDC', icon: <FaUsers /> },
    { path: '/dashboard/subscribers', label: 'Acheteurs Diaspora', icon: <FaUserShield /> },
    { path: '/dashboard/payments', label: 'Flux Transactions', icon: <FaCreditCard /> },
    { path: '/dashboard/invoices', label: 'Quittances ARCA', icon: <FaFileInvoiceDollar /> },
    { path: '/dashboard/analytics', label: 'Analyses Risques', icon: <FaChartBar /> },
    { path: '/dashboard/messages', label: 'Logs WhatsApp', icon: <FaWhatsapp /> },
    { path: '/dashboard/finance', label: 'Contrôle Forex', icon: <FaCoins /> },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    // 🟢 CORRIGÉ : Alignement forcé en ligne (flex-row) dès l'affichage sur ordinateur (lg:flex-row)
    <div style={{ display: 'flex', flexDirection: window.innerWidth > 1024 ? 'row' : 'column' }} className="min-h-screen bg-slate-100 dark:bg-slate-950 antialiased font-sans text-slate-800 dark:text-slate-100">

      {/* 📱 BARRE DE NAVIGATION MOBILE (Masquée sur PC) */}
      {/* 🟢 CORRIGÉ : Nettoyage du doublon accidentel pour restaurer le bandeau mobile corporate de ESNAS
 */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex justify-between items-center border-b border-[#00A3E0]/20 sticky top-0 z-50">
        <div className="flex flex-col">
          <span className="text-lg font-black text-white">ESNAS
</span>
          <span className="text-[8px] text-[#00A3E0] uppercase font-bold tracking-widest">Console de Gestion</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="text-white text-xl focus:outline-none"
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* 💻 SIDEBAR PRINCIPALE (PC & Mobile déplié) */}
      <aside style={{ display: window.innerWidth > 1024 ? 'flex' : (isMobileMenuOpen ? 'flex' : 'none'), width: '256px', minWidth: '256px' }} className="bg-slate-900 text-slate-300 flex-shrink-0 flex-col justify-between border-r border-slate-800 h-screen sticky top-0">

        <div>
          {/* Logo / Marque */}
          {/* 🟢 CORRIGÉ : Modification du point de rupture hidden en lg:block pour correspondre à l'aside */}
          <div style={{ display: window.innerWidth > 1024 ? 'block' : 'none' }} className="p-6 border-b border-slate-800">

            <span className="text-xl font-black bg-gradient-to-r from-[#00A3E0] via-[#CE1126] to-[#FDD100] text-transparent bg-clip-text font-serif tracking-wide block uppercase">
              ESNAS

            </span>
            <span className="text-[8px] uppercase tracking-[2px] text-slate-400 font-bold block mt-1">
              Espace Administration
            </span>
          </div>

          {/* Profil utilisateur connecté */}
          <div className="p-4 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-3">
            <FaUserCircle className="text-[#00A3E0] shrink-0" size={32} />
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-white truncate">{currentUser.firstName} {currentUser.lastName}</h4>
              <span className="text-[10px] text-[#FDD100] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-[#FDD100]/10 inline-block mt-0.5">
                {currentUser.role}
              </span>
            </div>
          </div>

          {/* Liste des onglets de navigation */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate(item.path);
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-xs lg:text-sm font-bold rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#00A3E0] text-white shadow-md'
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-[#00A3E0]'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pied de la Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 flex items-center gap-3 text-xs lg:text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors"
          >
            <FaSignOutAlt />
            <span>Déconnexion</span>
          </button>
        </div>

      </aside>

      {/* OVERLAY SOMBRE MOBILE */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* 🚀 CONTENU DYNAMIQUE CENTRAL */}
      {/* 🟢 CORRIGÉ : Ajustement de l'espacement pour s'aligner de manière fluide à côté du menu permanent */}
      <main className="flex-grow p-4 lg:p-8 overflow-y-auto h-screen bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
