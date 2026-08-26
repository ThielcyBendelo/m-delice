import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowRight,
  FaCamera,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaCreditCard,
  FaFileInvoiceDollar,
  FaGlobe,
  FaIdCard,
  FaKey,
  FaLock,
  FaMoneyBillWave,
  FaSave,
  FaShieldAlt,
  FaSpinner,
  FaUserEdit,
} from 'react-icons/fa';
import authService from '../services/authService';
import dashboardService from '../services/dashboardService';
import notificationService from '../services/notificationService';
import { resolveAvatarUrl } from '../utils/avatarUrl';

function getInitials(user) {
  const first = String(user?.firstName || user?.FirstName || '').trim();
  const last = String(user?.lastName || user?.LastName || '').trim();
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'ES';
}

function formatRole(role) {
  const value = String(role || 'Diaspora');
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function readSessionUser() {
  return authService.getCurrentUser() || {};
}

function toDateValue(value) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState('');
  const [policies, setPolicies] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [currentUser, setCurrentUser] = useState(readSessionUser());
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
  });
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const user = readSessionUser();
    setCurrentUser(user);
    setProfileData({
      firstName: user.firstName || user.FirstName || '',
      lastName: user.lastName || user.LastName || '',
      phone: user.phone || user.Phone || '',
      country: user.country || user.CountryOfResidence || '',
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadActivity() {
      setActivityLoading(true);
      setActivityError('');
      try {
        const [policiesRes, paymentsRes, invoicesRes] = await Promise.all([
          dashboardService.getPolicies(),
          dashboardService.getPayments(),
          dashboardService.getInvoices(),
        ]);

        if (cancelled) return;
        setPolicies(Array.isArray(policiesRes.policies) ? policiesRes.policies : []);
        setPayments(Array.isArray(paymentsRes.payments) ? paymentsRes.payments : Array.isArray(paymentsRes.items) ? paymentsRes.items : []);
        setInvoices(Array.isArray(invoicesRes.invoices) ? invoicesRes.invoices : []);
      } catch (error) {
        if (!cancelled) {
          setActivityError(error.userMessage || error.message || 'Impossible de charger votre activité.');
        }
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    }

    loadActivity();
    return () => { cancelled = true; };
  }, []);

  const avatarUrl = resolveAvatarUrl(currentUser.avatarUrl || currentUser.AvatarUrl || currentUser.picture);
  const role = String(currentUser.role || 'Diaspora');
  const authProvider = String(currentUser.authProvider || currentUser.AuthProvider || 'local').toLowerCase();
  const accountType = authProvider === 'google' ? 'Compte Google' : 'Compte local';

  const summary = useMemo(() => ([
    {
      label: 'Nom affiché',
      value: `${profileData.firstName || currentUser.firstName || ''} ${profileData.lastName || currentUser.lastName || ''}`.trim() || 'Utilisateur ESNAS',
    },
    { label: 'Courriel', value: currentUser.email || '—' },
    { label: 'Accès', value: formatRole(role) },
    { label: 'Source', value: accountType },
  ]), [accountType, currentUser.email, currentUser.firstName, currentUser.lastName, profileData.firstName, profileData.lastName, role]);

  const activityStats = useMemo(() => {
    const activePolicies = policies.filter((policy) => policy.IsActive === true || policy.IsActive === 1 || String(policy.Status || '').toLowerCase() === 'active').length;
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.TotalPaidUSD || payment.totalPaidUSD || 0), 0);
    const completedPayments = payments.filter((payment) => String(payment.Status || payment.status || '').toLowerCase() === 'completed').length;
    return {
      policiesCount: policies.length,
      activePolicies,
      paymentsCount: payments.length,
      completedPayments,
      invoicesCount: invoices.length,
      totalPaid,
    };
  }, [invoices.length, payments, policies]);

  const recentActivity = useMemo(() => {
    const items = [
      ...policies.slice(0, 3).map((policy) => ({
        type: 'Police',
        label: policy.PolicyNumber,
        detail: `${policy.InsuranceBranch || 'Branche'} · ${policy.CoverageLevel || 'Formule'}`,
        date: policy.CreatedAt || policy.StartDate,
        tone: 'text-[#00A3E0]',
      })),
      ...payments.slice(0, 3).map((payment) => ({
        type: 'Paiement',
        label: payment.TransactionReference || `TX-${payment.PaymentID}`,
        detail: `${Number(payment.TotalPaidUSD || payment.totalPaidUSD || 0).toLocaleString('fr-FR')} USD · ${String(payment.Status || payment.status || '').toUpperCase()}`,
        date: payment.PaidAt || payment.CreatedAt,
        tone: 'text-emerald-500',
      })),
      ...invoices.slice(0, 3).map((invoice) => ({
        type: 'Facture',
        label: invoice.invoiceNo || invoice.invoiceNumber || invoice.transactionReference,
        detail: `${Number(invoice.totalPaidUSD || invoice.TotalPaidUSD || 0).toLocaleString('fr-FR')} USD`,
        date: invoice.paidAt || invoice.createdAt,
        tone: 'text-[#CE1126]',
      })),
    ];

    return items
      .filter((item) => item.label)
      .sort((a, b) => toDateValue(b.date) - toDateValue(a.date))
      .slice(0, 6);
  }, [invoices, payments, policies]);

  async function syncSession() {
    setLoading(true);
    try {
      await authService.initialize();
      const refreshed = readSessionUser();
      setCurrentUser(refreshed);
      setProfileData({
        firstName: refreshed.firstName || refreshed.FirstName || '',
        lastName: refreshed.lastName || refreshed.LastName || '',
        phone: refreshed.phone || refreshed.Phone || '',
        country: refreshed.country || refreshed.CountryOfResidence || '',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const response = await authService.updateProfile(profileData);
      if (response?.user) setCurrentUser(response.user);
      notificationService.success(response?.message || 'Profil mis à jour.');
      await syncSession();
    } catch (error) {
      notificationService.error(error.userMessage || error.message || 'Mise à jour impossible.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSecuritySubmit(event) {
    event.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      notificationService.error('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setSavingSecurity(true);
    try {
      const response = await authService.changePassword(securityData);
      notificationService.success(response?.message || 'Mot de passe mis à jour.');
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      notificationService.error(error.userMessage || error.message || 'Changement impossible.');
    } finally {
      setSavingSecurity(false);
    }
  }

  async function handleAvatarFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      notificationService.error('Format accepté : JPEG, PNG ou WebP.');
      event.target.value = '';
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      notificationService.error('La photo ne doit pas dépasser 1,5 Mo.');
      event.target.value = '';
      return;
    }

    setUploadingAvatar(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const response = await authService.updateAvatar({ dataUrl });
      if (response?.user) setCurrentUser(response.user);
      notificationService.success(response?.message || 'Avatar mis à jour.');
      await syncSession();
    } catch (error) {
      notificationService.error(error.userMessage || error.message || 'Avatar impossible à charger.');
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  }

  return (
    <div className="space-y-6 text-slate-100 animate-fadeIn">
      <header className="admin-panel overflow-hidden">
        <div className="bg-gradient-to-r from-[#00A3E0] via-[#005b84] to-[#CE1126] px-5 py-6 text-white sm:px-7">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/80">Profil professionnel</p>
          <h1 className="mt-2 text-2xl font-black tracking-normal md:text-3xl">Compte & sécurité</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85">
            Gérez votre identité, votre avatar et vos paramètres de sécurité sans quitter l’espace privé.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <aside className="admin-panel p-5 xl:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar du compte"
                  className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg dark:border-slate-800"
                />
              ) : (
                <div className="grid h-28 w-28 place-items-center rounded-full border-4 border-white bg-slate-100 text-3xl font-black text-[#00A3E0] shadow-lg dark:border-slate-800 dark:bg-slate-800">
                  {getInitials(currentUser)}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="touch-target absolute -bottom-1 -right-1 grid h-10 w-10 place-items-center rounded-full bg-[#00A3E0] text-white shadow-lg transition hover:bg-[#0082B3] disabled:opacity-60"
                title="Changer l'avatar"
              >
                {uploadingAvatar ? <FaSpinner className="animate-spin" /> : <FaCamera />}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarFile}
            />

            <div className="mt-4">
              <h2 className="text-xl font-black">
                {currentUser.firstName || currentUser.FirstName || 'Utilisateur'} {currentUser.lastName || currentUser.LastName || ''}
              </h2>
              <p className="text-sm text-slate-300">{currentUser.email || '—'}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#00A3E0]/20 bg-[#00A3E0]/10 px-3 py-1 text-xs font-black text-[#00A3E0]">
                <FaShieldAlt /> {formatRole(role)}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            {summary.map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-[10px] font-black uppercase text-slate-400">{item.label}</div>
                <div className="mt-1 text-sm font-bold">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
            <InfoRow icon={<FaGlobe className="text-[#00A3E0]" />} label="Pays" value={currentUser.country || currentUser.CountryOfResidence || 'RD Congo'} />
            <InfoRow icon={<FaIdCard className="text-[#FDD100]" />} label="Authentification" value={accountType} />
            <InfoRow icon={<FaCheckCircle className="text-emerald-500" />} label="Session" value={loading ? 'Vérification...' : 'Active'} />
          </div>
        </aside>

        <div className="space-y-6 xl:col-span-2">
          <section className="admin-panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <FaUserEdit className="text-[#00A3E0]" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Identité professionnelle</h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Prénom" value={profileData.firstName} onChange={(value) => setProfileData((prev) => ({ ...prev, firstName: value }))} />
              <Field label="Nom" value={profileData.lastName} onChange={(value) => setProfileData((prev) => ({ ...prev, lastName: value }))} />
              <Field label="Téléphone" value={profileData.phone} onChange={(value) => setProfileData((prev) => ({ ...prev, phone: value }))} />
              <Field label="Pays" value={profileData.country} onChange={(value) => setProfileData((prev) => ({ ...prev, country: value }))} />

              <div className="sm:col-span-2 flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={syncSession}
                  className="touch-target rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-100"
                >
                  Recharger
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="touch-target inline-flex items-center gap-2 rounded-lg bg-[#00A3E0] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0082B3] disabled:opacity-60"
                >
                  {savingProfile ? <FaSpinner className="animate-spin" /> : <FaSave />} Enregistrer le profil
                </button>
              </div>
            </form>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="admin-panel p-5 xl:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Mon activité</h2>
                  <p className="text-xs text-slate-300">Souscriptions, paiements et quittances récentes.</p>
                </div>
                <button type="button" onClick={() => navigate('/dashboard/invoices')} className="touch-target inline-flex items-center gap-2 text-xs font-black uppercase text-[#00A3E0]">
                  Voir tout <FaArrowRight />
                </button>
              </div>

              {activityLoading && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-300">
                  <FaSpinner className="animate-spin text-[#00A3E0]" /> Chargement de votre activité...
                </div>
              )}

              {activityError && !activityLoading && (
                <div className="rounded-lg border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">
                  {activityError}
                </div>
              )}

              {!activityLoading && !activityError && (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MetricCard title="Polices" value={activityStats.policiesCount} icon={<FaShieldAlt className="text-[#00A3E0]" />} />
                    <MetricCard title="Actives" value={activityStats.activePolicies} icon={<FaCheckCircle className="text-emerald-500" />} />
                    <MetricCard title="Paiements" value={activityStats.paymentsCount} icon={<FaCreditCard className="text-[#CE1126]" />} />
                    <MetricCard title="Quittances" value={activityStats.invoicesCount} icon={<FaFileInvoiceDollar className="text-[#FDD100]" />} />
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400"><FaMoneyBillWave /> Total payé</div>
                      <div className="mt-2 text-2xl font-black text-white">{activityStats.totalPaid.toLocaleString('fr-FR')} USD</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400"><FaClock /> Paiements validés</div>
                      <div className="mt-2 text-2xl font-black text-white">{activityStats.completedPayments}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400"><FaChartLine /> Progression</div>
                      <div className="mt-2 text-2xl font-black text-white">{activityStats.policiesCount ? Math.round((activityStats.activePolicies / activityStats.policiesCount) * 100) : 0}%</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="admin-panel p-5 text-white xl:col-span-1">
              <div className="mb-4 flex items-center gap-2">
                <FaClock className="text-[#00A3E0]" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white/80">Activité récente</h2>
              </div>

              <div className="space-y-3">
                {recentActivity.length === 0 && !activityLoading && !activityError && (
                  <p className="text-sm text-slate-300">Aucune activité trouvée pour le moment.</p>
                )}

                {recentActivity.map((item, index) => (
                  <div key={`${item.type}-${item.label}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className={`text-[10px] font-black uppercase ${item.tone}`}>{item.type}</div>
                        <div className="mt-1 text-sm font-black">{item.label}</div>
                        <div className="mt-1 text-xs text-slate-300">{item.detail}</div>
                      </div>
                      <div className="text-[10px] text-slate-400">{item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '—'}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                <button type="button" onClick={() => navigate('/dashboard/payments')} className="touch-target w-full rounded-lg bg-white px-4 py-2.5 text-sm font-black text-slate-900 transition hover:bg-slate-100">
                  Mes paiements
                </button>
                <button type="button" onClick={() => navigate('/dashboard/invoices')} className="touch-target w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-white transition hover:bg-white/10">
                  Mes quittances
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="admin-panel p-5">
              <div className="mb-4 flex items-center gap-2">
                <FaKey className="text-[#00A3E0]" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Sécurité réelle</h2>
              </div>

              <form onSubmit={handleSecuritySubmit} className="space-y-4">
                <Field label="Mot de passe actuel" type="password" value={securityData.currentPassword} onChange={(value) => setSecurityData((prev) => ({ ...prev, currentPassword: value }))} />
                <Field label="Nouveau mot de passe" type="password" value={securityData.newPassword} onChange={(value) => setSecurityData((prev) => ({ ...prev, newPassword: value }))} />
                <Field label="Confirmer le mot de passe" type="password" value={securityData.confirmPassword} onChange={(value) => setSecurityData((prev) => ({ ...prev, confirmPassword: value }))} />

                <button
                  type="submit"
                  disabled={savingSecurity}
                  className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#00A3E0] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0082B3] disabled:opacity-60"
                >
                  {savingSecurity ? <FaSpinner className="animate-spin" /> : <FaLock />} Mettre à jour le mot de passe
                </button>
              </form>
            </div>

            <div className="admin-panel p-5">
              <div className="mb-4 flex items-center gap-2">
                <FaShieldAlt className="text-[#CE1126]" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Bonnes pratiques</h2>
              </div>

              <ul className="space-y-3 text-sm text-slate-200">
                <li className="flex gap-2"><FaCheckCircle className="mt-0.5 text-emerald-500" /> Utilisez un mot de passe unique et long.</li>
                <li className="flex gap-2"><FaCheckCircle className="mt-0.5 text-emerald-500" /> Gardez un avatar professionnel et lisible.</li>
                <li className="flex gap-2"><FaCheckCircle className="mt-0.5 text-emerald-500" /> Vérifiez votre profil avant les opérations sensibles.</li>
                <li className="flex gap-2"><FaCheckCircle className="mt-0.5 text-emerald-500" /> Déconnectez-vous si vous utilisez un poste partagé.</li>
              </ul>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="space-y-1 text-xs font-bold uppercase tracking-wide text-slate-300">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="touch-target w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-white outline-none transition focus:border-[#00A3E0]"
      />
    </label>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-xs font-black uppercase text-slate-400">{label}</div>
        <div className="text-sm font-semibold text-slate-200">{value}</div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-black uppercase text-slate-400">{title}</div>
          <div className="mt-2 text-2xl font-black text-white">{value}</div>
        </div>
        <div className="text-xl">{icon}</div>
      </div>
    </div>
  );
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Lecture fichier impossible.'));
    reader.readAsDataURL(file);
  });
}