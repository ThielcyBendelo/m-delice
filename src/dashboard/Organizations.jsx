import React, { useEffect, useMemo, useState } from 'react';
import {
  FaArchive,
  FaBuilding,
  FaCar,
  FaCheckCircle,
  FaEdit,
  FaEnvelope,
  FaGraduationCap,
  FaHospital,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaPlane,
  FaPlus,
  FaPhone,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaUndo,
  FaUsers,
} from 'react-icons/fa';
import organizationService from '../services/organizationService';
import notificationService from '../services/notificationService';

const SECTORS = [
  { value: 'admin', label: 'Administration', icon: FaBuilding, color: 'text-slate-700 bg-slate-100' },
  { value: 'diaspora', label: 'Diaspora', icon: FaUsers, color: 'text-blue-700 bg-blue-50' },
  { value: 'hospital', label: 'Hôpital', icon: FaHospital, color: 'text-rose-700 bg-rose-50' },
  { value: 'education', label: 'Université / École', icon: FaGraduationCap, color: 'text-emerald-700 bg-emerald-50' },
  { value: 'travel_airline', label: 'Voyage / Compagnie aérienne', icon: FaPlane, color: 'text-cyan-700 bg-cyan-50' },
  { value: 'automobile', label: 'Agence / Société automobile', icon: FaCar, color: 'text-amber-700 bg-amber-50' },
];

const EMPTY_FORM = {
  organizationName: '',
  organizationType: 'hospital',
  registrationNumber: '',
  contactName: '',
  email: '',
  phone: '',
  country: 'RDC',
  city: '',
  address: '',
  notes: '',
};

function sectorFor(value) {
  return SECTORS.find((sector) => sector.value === value) || SECTORS[0];
}

function formFromRow(row) {
  return {
    organizationName: row.OrganizationName || '',
    organizationType: row.OrganizationType || 'hospital',
    registrationNumber: row.RegistrationNumber || '',
    contactName: row.ContactName || '',
    email: row.Email || '',
    phone: row.Phone || '',
    country: row.Country || '',
    city: row.City || '',
    address: row.Address || '',
    notes: row.Notes || '',
  };
}

function csvCell(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadOrganizationsCSV(rows) {
  if (!rows.length) return;

  const headers = [
    'Organisation',
    'Secteur',
    'RCCM / Référence',
    'Contact',
    'E-mail',
    'Téléphone',
    'Ville',
    'Pays',
    'Statut',
  ];

  const lines = rows.map((row) => {
    const sector = sectorFor(row.OrganizationType).label;
    return [
      row.OrganizationName,
      sector,
      row.RegistrationNumber,
      row.ContactName,
      row.Email,
      row.Phone,
      row.City,
      row.Country,
      row.IsActive ? 'Active' : 'Archivée',
    ].map(csvCell).join(';');
  });

  const csv = [headers.map(csvCell).join(';'), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `organisations_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Organizations() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await organizationService.list({
        q: search.trim(),
        type: sector,
        includeArchived,
      });
      setRows(data.organizations || []);
    } catch (requestError) {
      setError(requestError.userMessage || requestError.message || 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await organizationService.list({
          q: search.trim(),
          type: sector,
          includeArchived,
        });
        if (!cancelled) setRows(data.organizations || []);
      } catch (requestError) {
        if (!cancelled) setError(requestError.userMessage || requestError.message || 'Chargement impossible.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, sector, includeArchived]);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.IsActive).length,
    archived: rows.filter((row) => !row.IsActive).length,
    sectors: new Set(rows.map((row) => row.OrganizationType)).size,
    countries: new Set(rows.map((row) => (row.Country || '').trim()).filter(Boolean)).size,
  }), [rows]);

  const hasFilters = Boolean(search.trim() || sector || includeArchived);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, organizationType: sector || 'hospital' });
    setFormOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.OrganizationID);
    setForm(formFromRow(row));
    setFormOpen(true);
  }

  function openDetails(row) {
    setDetailRow(row);
  }

  async function copyToClipboard(value, label) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      notificationService.success(`${label} copié.`);
    } catch {
      notificationService.error(`Impossible de copier ${label.toLowerCase()}.`);
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await organizationService.update(editingId, form);
        notificationService.success('Organisation mise à jour.');
      } else {
        await organizationService.create(form);
        notificationService.success('Organisation créée.');
      }
      setFormOpen(false);
      await load();
    } catch (requestError) {
      notificationService.error(requestError.userMessage || requestError.message || 'Opération impossible.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row) {
    const currentlyActive = Boolean(row.IsActive);
    if (currentlyActive && !window.confirm(`Archiver « ${row.OrganizationName} » ?`)) return;
    setBusyId(row.OrganizationID);
    try {
      await organizationService.setActive(row.OrganizationID, !currentlyActive);
      notificationService.success(currentlyActive ? 'Organisation archivée.' : 'Organisation restaurée.');
      await load();
    } catch (requestError) {
      notificationService.error(requestError.userMessage || requestError.message || 'Opération impossible.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-full space-y-6 text-slate-100 animate-fadeIn">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-black uppercase text-[#00A3E0]">Référentiel privé</p>
          <h1 className="text-2xl font-black tracking-normal md:text-3xl">Organisations partenaires</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">
            Gestion multi-pays des structures habilitées à opérer avec ESNAS.
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
          <button
            type="button"
            onClick={openCreate}
            className="touch-target inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#00A3E0] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#0088bd]"
          >
            <FaPlus aria-hidden="true" /> Nouvelle organisation
          </button>
          <button
            type="button"
            onClick={() => downloadOrganizationsCSV(rows)}
            disabled={rows.length === 0}
            className="touch-target inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 text-sm font-black text-slate-100 shadow-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </header>

      <section className="admin-panel grid grid-cols-2 md:grid-cols-5">
        {[
          ['Références', stats.total],
          ['Actives', stats.active],
          ['Archivées', stats.archived],
          ['Secteurs représentés', stats.sectors],
          ['Pays représentés', stats.countries],
        ].map(([label, value], index) => (
          <div key={label} className={`px-3 py-4 sm:px-5 ${index > 0 ? 'border-l border-white/10' : ''}`}>
            <div className="text-xl font-black text-white sm:text-2xl">{value}</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:tracking-[0.18em] sm:text-xs">{label}</div>
          </div>
        ))}
      </section>

      <section className="admin-panel space-y-3 p-4 sm:p-5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSector('')}
            className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold ${!sector ? 'border-[#00A3E0] bg-[#00A3E0] text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'}`}
          >
            Tous les secteurs
          </button>
          {SECTORS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.value}
                onClick={() => setSector(item.value)}
                className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${sector === item.value ? 'border-[#00A3E0] bg-[#00A3E0] text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'}`}
              >
                <Icon aria-hidden="true" /> {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <FaSearch className="absolute left-3 top-3.5 text-slate-400" aria-hidden="true" />
            <span className="sr-only">Rechercher</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, RCCM, contact, ville..."
              className="touch-target h-11 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#00A3E0]"
            />
          </label>
          <label className="flex h-11 cursor-pointer items-center gap-2 text-sm font-bold text-slate-300">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(event) => setIncludeArchived(event.target.checked)}
              className="touch-target h-4 w-4 accent-[#00A3E0]"
            />
            Afficher les archives
          </label>
        </div>
      </section>

      {loading && (
        <div className="admin-panel flex items-center justify-center gap-2 py-16 text-sm font-bold text-slate-300">
          <FaSpinner className="animate-spin" /> Chargement du registre...
        </div>
      )}
      {error && <div className="admin-panel border-l-4 border-red-500 p-4 text-sm font-bold text-red-300">{error}</div>}

      {!loading && !error && (
        <div className="admin-panel flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm">
          <div className="text-slate-300">
            {hasFilters
              ? 'Filtres appliqués sur le registre des organisations.'
              : 'Vue complète du registre des organisations partenaires.'}
          </div>
          <button
            type="button"
            onClick={load}
            className="touch-target inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-bold text-slate-100 transition hover:bg-white/10"
          >
            <FaSpinner aria-hidden="true" className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="admin-panel overflow-hidden">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="p-4">Organisation</th><th className="p-4">Secteur</th><th className="p-4">Contact</th>
                  <th className="p-4">Localisation</th><th className="p-4">Statut</th><th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {rows.map((row) => {
                  const item = sectorFor(row.OrganizationType);
                  const Icon = item.icon;
                  return (
                    <tr key={row.OrganizationID} className={!row.IsActive ? 'opacity-55' : 'hover:bg-white/5'}>
                      <td className="p-4"><button type="button" onClick={() => openDetails(row)} className="text-left"><div className="font-black text-white transition hover:text-[#00A3E0]">{row.OrganizationName}</div><div className="text-xs text-slate-400">{row.RegistrationNumber || 'Référence non renseignée'}</div></button></td>
                      <td className="p-4"><span className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-bold ${item.color}`}><Icon /> {item.label}</span></td>
                      <td className="p-4"><div>{row.ContactName || '—'}</div><div className="text-xs text-slate-400">{row.Email || row.Phone || 'Aucune coordonnée'}</div></td>
                      <td className="p-4">{[row.City, row.Country].filter(Boolean).join(', ') || '—'}</td>
                      <td className="p-4"><span className={`inline-flex items-center gap-1 text-xs font-black ${row.IsActive ? 'text-emerald-600' : 'text-slate-400'}`}><FaCheckCircle /> {row.IsActive ? 'Active' : 'Archivée'}</span></td>
                      <td className="p-4"><div className="flex justify-end gap-2"><ActionButtons row={row} busyId={busyId} onEdit={openEdit} onToggle={toggleActive} onDetails={openDetails} /></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-white/5 lg:hidden">
            {rows.map((row) => {
              const item = sectorFor(row.OrganizationType);
              const Icon = item.icon;
              return (
                <article key={row.OrganizationID} className={`p-4 ${!row.IsActive ? 'opacity-55' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => openDetails(row)} className="text-left"><h2 className="font-black text-white transition hover:text-[#00A3E0]">{row.OrganizationName}</h2><p className="text-xs text-slate-400">{[row.City, row.Country].filter(Boolean).join(', ') || 'Localisation non renseignée'}</p></button>
                    <span className={`rounded-md p-2 ${item.color}`} title={item.label}><Icon /></span>
                  </div>
                  <div className="mt-3 text-xs text-slate-300">{row.ContactName || 'Aucun contact'} · {row.Email || row.Phone || 'Aucune coordonnée'}</div>
                  <div className="mt-4 flex items-center justify-between"><span className={`text-xs font-black ${row.IsActive ? 'text-emerald-600' : 'text-slate-400'}`}>{row.IsActive ? 'Active' : 'Archivée'}</span><div className="flex gap-2"><ActionButtons row={row} busyId={busyId} onEdit={openEdit} onToggle={toggleActive} onDetails={openDetails} /></div></div>
                </article>
              );
            })}
          </div>
          {rows.length === 0 && (
            <div className="py-16 text-center text-sm text-slate-300">
              <div>Aucune organisation ne correspond aux filtres.</div>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSector('');
                    setIncludeArchived(false);
                  }}
                  className="touch-target mt-4 inline-flex h-10 items-center rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-bold text-slate-100 transition hover:bg-white/10"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/65 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true">
          <form onSubmit={submit} className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-lg bg-white shadow-2xl dark:bg-slate-900 sm:rounded-lg">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div><h2 className="text-lg font-black">{editingId ? "Modifier l'organisation" : 'Nouvelle organisation'}</h2><p className="text-xs text-slate-500">Les champs marqués * sont obligatoires.</p></div>
              <button type="button" onClick={() => setFormOpen(false)} className="touch-target p-2 text-slate-500 hover:text-slate-900" title="Fermer"><FaTimes /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <Field label="Nom de l'organisation *" name="organizationName" value={form.organizationName} onChange={updateField} required />
              <label className="space-y-1 text-xs font-bold">Secteur *<select name="organizationType" value={form.organizationType} onChange={updateField} className="touch-target h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">{SECTORS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <Field label="RCCM / Agrément / Référence" name="registrationNumber" value={form.registrationNumber} onChange={updateField} />
              <Field label="Responsable / Point focal" name="contactName" value={form.contactName} onChange={updateField} />
              <Field label="E-mail" name="email" type="email" value={form.email} onChange={updateField} />
              <Field label="Téléphone" name="phone" type="tel" value={form.phone} onChange={updateField} />
              <Field label="Pays" name="country" value={form.country} onChange={updateField} />
              <Field label="Ville" name="city" value={form.city} onChange={updateField} />
              <div className="md:col-span-2"><Field label="Adresse" name="address" value={form.address} onChange={updateField} /></div>
              <label className="space-y-1 text-xs font-bold md:col-span-2">Notes<textarea name="notes" value={form.notes} onChange={updateField} rows={3} className="touch-target w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
              <button type="button" onClick={() => setFormOpen(false)} className="touch-target h-10 px-4 text-sm font-bold text-slate-600">Annuler</button>
              <button disabled={saving} type="submit" className="touch-target flex h-10 items-center gap-2 rounded-lg bg-[#00A3E0] px-5 text-sm font-black text-white disabled:opacity-50">{saving && <FaSpinner className="animate-spin" />}{editingId ? 'Enregistrer' : 'Créer'}</button>
            </div>
          </form>
        </div>
      )}

      {detailRow && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center bg-slate-950/65 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true">
          <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-lg bg-white shadow-2xl dark:bg-slate-900 sm:rounded-lg">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h2 className="text-lg font-black">{detailRow.OrganizationName}</h2>
                <p className="text-xs text-slate-500">{sectorFor(detailRow.OrganizationType).label}</p>
              </div>
              <button type="button" onClick={() => setDetailRow(null)} className="touch-target p-2 text-slate-500 hover:text-slate-900" title="Fermer">
                <FaTimes />
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <DetailField label="Statut" value={detailRow.IsActive ? 'Active' : 'Archivée'} highlight={detailRow.IsActive ? 'text-emerald-600' : 'text-slate-400'} />
              <DetailField label="Référence" value={detailRow.RegistrationNumber || 'Non renseignée'} />
              <DetailField label="Contact" value={detailRow.ContactName || 'Non renseigné'} />
              <DetailField label="E-mail" value={detailRow.Email || 'Non renseigné'} />
              <DetailField label="Téléphone" value={detailRow.Phone || 'Non renseigné'} />
              <DetailField label="Pays / Ville" value={[detailRow.Country, detailRow.City].filter(Boolean).join(' · ') || 'Non renseigné'} />
              <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 md:col-span-2">
                <button
                  type="button"
                  disabled={!detailRow.Email}
                  onClick={() => copyToClipboard(detailRow.Email, 'E-mail')}
                  className="touch-target inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <FaEnvelope aria-hidden="true" /> Copier l'e-mail
                </button>
                <button
                  type="button"
                  disabled={!detailRow.Phone}
                  onClick={() => copyToClipboard(detailRow.Phone, 'Téléphone')}
                  className="touch-target inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <FaPhone aria-hidden="true" /> Copier le téléphone
                </button>
                <button
                  type="button"
                  disabled={!detailRow.Email}
                  onClick={() => window.open(`mailto:${detailRow.Email}`, '_blank', 'noopener,noreferrer')}
                  className="touch-target inline-flex h-10 items-center gap-2 rounded-lg bg-[#00A3E0] px-4 text-sm font-black text-white transition hover:bg-[#0088bd] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaEnvelope aria-hidden="true" /> Envoyer un e-mail
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 md:col-span-2">
                <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                  <FaMapMarkerAlt aria-hidden="true" /> Adresse
                </div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{detailRow.Address || 'Non renseignée'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 md:col-span-2">
                <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                  <FaInfoCircle aria-hidden="true" /> Notes
                </div>
                <div className="whitespace-pre-wrap text-sm font-medium text-slate-700 dark:text-slate-200">{detailRow.Notes || 'Aucune note disponible.'}</div>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
              <button type="button" onClick={() => setDetailRow(null)} className="touch-target h-10 px-4 text-sm font-bold text-slate-600">Fermer</button>
              <button
                type="button"
                onClick={() => {
                  setForm(formFromRow(detailRow));
                  setEditingId(detailRow.OrganizationID);
                  setDetailRow(null);
                  setFormOpen(true);
                }}
                className="touch-target inline-flex h-10 items-center gap-2 rounded-lg bg-[#00A3E0] px-5 text-sm font-black text-white"
              >
                <FaEdit aria-hidden="true" /> Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, required = false }) {
  return <label className="space-y-1 text-xs font-bold">{label}<input name={name} type={type} value={value} onChange={onChange} required={required} className="touch-target h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#00A3E0] dark:border-slate-700 dark:bg-slate-950" /></label>;
}

function ActionButtons({ row, busyId, onEdit, onToggle, onDetails }) {
  const busy = busyId === row.OrganizationID;
  return <><button type="button" onClick={() => onDetails(row)} title="Voir les détails" className="touch-target rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700"><FaInfoCircle /></button><button type="button" disabled={busy} onClick={() => onEdit(row)} title="Modifier" className="touch-target rounded-md border border-slate-200 p-2 text-[#00A3E0] hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700"><FaEdit /></button><button type="button" disabled={busy} onClick={() => onToggle(row)} title={row.IsActive ? 'Archiver' : 'Restaurer'} className="touch-target rounded-md border border-slate-200 p-2 text-amber-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700">{busy ? <FaSpinner className="animate-spin" /> : row.IsActive ? <FaArchive /> : <FaUndo />}</button></>;
}

function DetailField({ label, value, highlight = '' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-black ${highlight}`}>{value}</div>
    </div>
  );
}