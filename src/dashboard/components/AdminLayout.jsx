import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { resolveAvatarUrl } from '../../utils/avatarUrl';
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
  { path: '/dashboard/regions', label: 'Régions & agents', icon: FaUsers, roles: ['admin'] },
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
  const source = resolveAvatarUrl(user?.avatarUrl || user?.AvatarUrl || user?.picture);

  useEffect(() => {
    setImageFailed(false);
  }, [source]);

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
      <div className="flex h-20 items-center justify-between border-b border-slate-200 px-4">
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-xl font-black tracking-tight text-slate-900">ESNAS</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#CE1126]">
              {isStaff ? 'Console de gestion' : 'Espace assuré'}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="touch-target hidden rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-[#CE1126] lg:block"
          title={collapsed ? 'Déployer le menu' : 'Réduire le menu'}
        >
          <FaChevronLeft className={collapsed ? 'rotate-180' : ''} />
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="touch-target rounded-md p-2 text-slate-600 transition hover:text-[#CE1126] lg:hidden"
          title="Fermer le menu"
        >
          <FaTimes />
        </button>
      </div>

      <div className="px-3 py-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard/profile')}
          className={`touch-target flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left shadow-sm transition hover:border-[#CE1126]/40 hover:bg-white ${collapsed ? 'justify-center' : ''}`}
        >
          <Avatar user={currentUser} />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-slate-900">{displayName}</span>
              <span className="mt-0.5 block truncate text-[10px] font-bold uppercase tracking-[0.16em] text-[#CE1126]">{role}</span>
            </span>
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Navigation de l’espace privé">
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Accès</span>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
            {menuItems.length} modules
          </span>
        </div>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            const accent = active
              ? 'border-[#CE1126]/30 bg-[#fff7f7] text-[#CE1126]'
              : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50 hover:text-[#00A3E0]';
            return (
              <button
                type="button"
                key={item.path}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                className={`group flex h-11 w-full items-center gap-3 rounded-lg border px-3 text-left transition-colors ${collapsed ? 'justify-center' : ''} ${accent}`}
              >
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${active ? 'bg-[#CE1126]/10 text-[#CE1126]' : 'bg-slate-100 text-[#00A3E0]'}`}>
                  <Icon className="text-sm" />
                </span>
                {!collapsed && (
                  <span className="block max-w-full truncate px-1 text-[12px] font-black leading-tight">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="safe-bottom border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={logout}
          title={collapsed ? 'Déconnexion' : undefined}
          className={`touch-target flex h-12 lg:h-11 w-full items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-bold text-red-700 transition hover:bg-red-100 ${collapsed ? 'justify-center' : ''}`}
        >
          <FaSignOutAlt /> {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </>
  );

  const activePage = menuItems.find((item) => isActive(item));
  const isDashboardHome = location.pathname === '/dashboard';

  return (
    <div className="admin-shell min-h-dvh bg-white text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-slate-200 bg-white shadow-[18px_0_30px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-[width] duration-200 lg:flex ${collapsed ? 'w-24' : 'w-[300px]'}`}
      >
        {navigation}
      </aside>

      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden"
          />
          <aside id="admin-mobile-menu" className="fixed inset-y-0 left-0 z-50 flex w-[min(90vw,360px)] flex-col overflow-y-auto overscroll-contain border-r border-slate-200 bg-white shadow-2xl backdrop-blur-xl lg:hidden">
            <div className="p-3">
              {navigation}
            </div>
          </aside>
        </>
      )}

      <div className={`min-h-dvh transition-[padding] duration-200 ${collapsed ? 'lg:pl-24' : 'lg:pl-[300px]'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="touch-target rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:border-[#CE1126] hover:text-[#CE1126] lg:hidden"
                title="Ouvrir le menu"
                aria-expanded={mobileOpen}
                aria-controls="admin-mobile-menu"
              >
                <FaBars />
              </button>
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-slate-900 sm:text-base">{activePage?.label || 'Espace privé'}</div>
                <div className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 sm:block">Accès sécurisé ESNAS · Multi-pays</div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard/verification')}
                className="touch-target hidden rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:border-[#CE1126] hover:text-[#CE1126] sm:block"
                title="Recherche et vérification"
              >
                <FaSearch />
              </button>
              <button type="button" onClick={() => navigate('/dashboard/profile')} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm transition hover:border-[#00A3E0]" title="Mon profil">
                <Avatar user={currentUser} size="h-9 w-9" />
                <span className="hidden max-w-40 truncate text-xs font-black text-slate-900 md:block">{displayName}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="admin-content p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1500px] border border-slate-200 bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-4 lg:p-6">
            {isDashboardHome && (
              <div className="mb-6 rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full border border-emerald-200 bg-emerald-500/10 p-2.5 text-emerald-600">
                      <Avatar user={currentUser} size="h-12 w-12" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Bienvenue</p>
                      <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-900 sm:text-3xl">{displayName}</h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#00A3E0]/20 bg-[#00A3E0]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#00A3E0]">
                      {role}
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                      Accès sécurisé
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {menuItems.slice(0, 3).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#CE1126]/40 hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef9ff] text-[#00A3E0]">
                            <Icon />
                          </span>
                          <span>
                            <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Module</span>
                            <span className="block text-sm font-black text-slate-800">{item.label}</span>
                          </span>
                        </div>
                        <span className="text-lg text-slate-400">›</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}