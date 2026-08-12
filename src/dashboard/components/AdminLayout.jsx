import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaBuilding,
  FaChartBar,
  FaChevronLeft,
  FaCoins,
  FaCreditCard,
  FaFileInvoiceDollar,
  FaFileMedical,
  FaHeartbeat,
  FaHome,
  FaSearch,
  FaShieldAlt,
  FaSignOutAlt,
  FaTimes,
  FaUserCircle,
  FaUsers,
  FaUserShield,
  FaWhatsapp,
} from 'react-icons/fa';
import authService from '../../services/authService';

const STAFF_ROLES = new Set(['admin', 'agent', 'underwriter', 'claims_manager', 'finance']);

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Vue d’ensemble', icon: FaHome, roles: 'all', exact: true },
  { path: '/dashboard/verification', label: 'Vérification', icon: FaShieldAlt, roles: 'staff' },
  { path: '/dashboard/claims', label: 'Sinistres', icon: FaFileMedical, roles: ['admin', 'agent', 'underwriter', 'claims_manager'] },
  { path: '/dashboard/clients', label: 'Bénéficiaires', icon: FaUsers, roles: 'staff' },
  { path: '/dashboard/subscribers', label: 'Souscripteurs', icon: FaUserShield, roles: 'staff' },
  { path: '/dashboard/payments', label: 'Paiements', icon: FaCreditCard, roles: 'all' },
  { path: '/dashboard/invoices', label: 'Factures & quittances', icon: FaFileInvoiceDollar, roles: 'all' },
  { path: '/dashboard/analytics', label: 'Analyses & statistiques', icon: FaChartBar, roles: 'staff' },
  { path: '/dashboard/messages', label: 'Communications', icon: FaWhatsapp, roles: 'staff' },
  { path: '/dashboard/finance', label: 'Contrôle financier', icon: FaCoins, roles: ['admin', 'finance'] },
  { path: '/dashboard/organizations', label: 'Organisations', icon: FaBuilding, roles: ['admin'] },
  { path: '/dashboard/health', label: 'Santé du système', icon: FaHeartbeat, roles: ['admin'] },
  { path: '/dashboard/profile', label: 'Mon profil', icon: FaUserCircle, roles: 'all' },
];

function canAccess(item, role) {
  if (item.roles === 'all') return true;
  if (item.roles === 'staff') return STAFF_ROLES.has(role);
  return item.roles.includes(role);
}

function getInitials(user) {
  const first = String(user?.firstName || user?.FirstName || '').trim();
  const last = String(user?.lastName || user?.LastName || '').trim();
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'ES';
}

function Avatar({ user, size = 'h-10 w-10' }) {
  const [imageFailed, setImageFailed] = useState(false);
  const source = user?.avatarUrl || user?.AvatarUrl || user?.picture;

  if (source && !imageFailed) {
    return (
      <img
        src={source}
        alt="Avatar du compte"
        onError={() => setImageFailed(true)}
        className={`${size} shrink-0 rounded-full border-2 border-white/20 object-cover`}
      />
    );
  }

  return (
    <span className={`${size} grid shrink-0 place-items-center rounded-full bg-[#00A3E0] text-xs font-black text-white`}>
      {getInitials(user)}
    </span>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const currentUser = authService.getCurrentUser() || {};
  const role = String(currentUser.role || 'client').toLowerCase();
  const isStaff = STAFF_ROLES.has(role);
  const menuItems = NAV_ITEMS.filter((item) => canAccess(item, role));
  const displayName = currentUser.name
    || `${currentUser.firstName || currentUser.FirstName || ''} ${currentUser.lastName || currentUser.LastName || ''}`.trim()
    || 'Utilisateur ESNAS';

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') setMobileOpen(false);
    }

    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  function isActive(item) {
    return item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);
  }

  function logout() {
    authService.logout();
  }

  const navigation = (
    <>
      <div className="flex h-20 items-center justify-between border-b border-slate-800 px-5">
        {!collapsed && (
          <div>
            <div className="text-xl font-black text-white">ESNAS</div>
            <div className="text-[10px] font-bold uppercase text-[#00A3E0]">
              {isStaff ? 'Console de gestion' : 'Espace assuré'}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="touch-target hidden rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:block"
          title={collapsed ? 'Déployer le menu' : 'Réduire le menu'}
        >
          <FaChevronLeft className={collapsed ? 'rotate-180' : ''} />
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="touch-target rounded-md p-2 text-slate-400 hover:text-white lg:hidden"
          title="Fermer le menu"
        >
          <FaTimes />
        </button>
      </div>

      <button
        type="button"
        onClick={() => navigate('/dashboard/profile')}
        className={`touch-target flex items-center gap-3 border-b border-slate-800 p-4 text-left hover:bg-slate-800/70 ${collapsed ? 'justify-center' : ''}`}
      >
        <Avatar user={currentUser} />
        {!collapsed && (
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-white">{displayName}</span>
            <span className="block truncate text-[10px] font-bold uppercase text-[#FDD100]">{role}</span>
          </span>
        )}
      </button>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Navigation de l’espace privé">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <button
              type="button"
              key={item.path}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={`touch-target flex h-12 lg:h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-bold transition-colors ${collapsed ? 'justify-center' : ''} ${
                active ? 'bg-[#00A3E0] text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="shrink-0 text-base" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="safe-bottom border-t border-slate-800 p-3">
        <button
          type="button"
          onClick={logout}
          title={collapsed ? 'Déconnexion' : undefined}
          className={`touch-target flex h-12 lg:h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-bold text-red-400 hover:bg-red-500/10 ${collapsed ? 'justify-center' : ''}`}
        >
          <FaSignOutAlt /> {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </>
  );

  const activePage = menuItems.find((item) => isActive(item));

  return (
    <div className="admin-shell min-h-dvh text-slate-900 dark:text-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-white/10 bg-slate-950/90 backdrop-blur-xl transition-[width] duration-200 lg:flex ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {navigation}
      </aside>

      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
          />
          <aside id="admin-mobile-menu" className="fixed inset-y-0 left-0 z-50 flex w-[min(90vw,340px)] flex-col overflow-y-auto overscroll-contain border-r border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl lg:hidden">
            {navigation}
          </aside>
        </>
      )}

      <div className={`min-h-dvh transition-[padding] duration-200 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/75 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="touch-target rounded-md border border-white/10 p-2.5 text-slate-200 transition hover:bg-white/5 lg:hidden"
              title="Ouvrir le menu"
              aria-expanded={mobileOpen}
              aria-controls="admin-mobile-menu"
            >
              <FaBars />
            </button>
            <div className="min-w-0">
              <div className="truncate text-sm font-black sm:text-base">{activePage?.label || 'Espace privé'}</div>
              <div className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 sm:block">Accès sécurisé ESNAS · Multi-pays</div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/verification')}
              className="touch-target hidden rounded-md border border-white/10 p-2.5 text-slate-300 transition hover:bg-white/5 hover:text-[#00A3E0] sm:block"
              title="Recherche et vérification"
            >
              <FaSearch />
            </button>
            <button type="button" onClick={() => navigate('/dashboard/profile')} className="flex items-center gap-2" title="Mon profil">
              <Avatar user={currentUser} size="h-9 w-9" />
              <span className="hidden max-w-40 truncate text-xs font-black text-white md:block">{displayName}</span>
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1500px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}