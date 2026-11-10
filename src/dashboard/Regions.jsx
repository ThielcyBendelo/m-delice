import React, { useEffect, useState } from 'react';
import dashboardService from '../services/dashboardService';

const emptyForm = { regionCode: '', regionName: '', countryCode: '' };

export default function Regions() {
  const [regions, setRegions] = useState([]);
  const [agents, setAgents] = useState([]);
  const [assignment, setAssignment] = useState({ userId: '', regionId: '' });
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadRegions() {
    setLoading(true);
    setError('');
    try {
      const [regionData, agentData] = await Promise.all([
        dashboardService.getRegions(),
        dashboardService.getAgents(),
      ]);
      setRegions(regionData.regions || []);
      setAgents(agentData.agents || []);
    } catch (loadError) {
      setError(loadError.userMessage || loadError.message || 'Impossible de charger les régions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegions();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await dashboardService.createRegion(form);
      setForm(emptyForm);
      setNotice('Région créée.');
      await loadRegions();
    } catch (saveError) {
      setError(saveError.userMessage || saveError.message || 'Impossible de créer la région.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleRegion(region) {
    setError('');
    setNotice('');
    try {
      await dashboardService.setRegionActive(region.RegionID, !region.IsActive);
      setNotice(`Région ${region.IsActive ? 'désactivée' : 'activée'}.`);
      await loadRegions();
    } catch (toggleError) {
      setError(toggleError.userMessage || toggleError.message || 'Impossible de modifier la région.');
    }
  }

  function selectAgent(event) {
    const userId = event.target.value;
    const agent = agents.find((item) => String(item.UserID) === userId);
    setAssignment({ userId, regionId: agent?.RegionID ? String(agent.RegionID) : '' });
  }

  async function assignAgent(event) {
    event.preventDefault();
    if (!assignment.userId || !assignment.regionId) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await dashboardService.assignUserRegion(assignment.userId, assignment.regionId);
      setNotice('Agent affecté à la région.');
      await loadRegions();
    } catch (assignError) {
      setError(assignError.userMessage || assignError.message || 'Impossible d’affecter l’agent.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6 p-4 sm:p-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600">Administration centrale</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">Régions & agents</h1>
        <p className="mt-1 text-sm text-slate-600">Préparez le routage régional sans modifier les comptes existants.</p>
      </header>

      {(error || notice) && (
        <div className={`border-l-4 px-4 py-3 text-sm ${error ? 'border-red-500 bg-red-50 text-red-800' : 'border-emerald-500 bg-emerald-50 text-emerald-800'}`}>
          {error || notice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <form onSubmit={submit} className="border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Nouvelle région</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Code
              <input name="regionCode" value={form.regionCode} onChange={updateField} placeholder="KIN-CENTRE" required maxLength={40} className="mt-1 block w-full border border-slate-300 px-3 py-2 uppercase outline-none focus:border-cyan-500" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Nom
              <input name="regionName" value={form.regionName} onChange={updateField} placeholder="Kinshasa Centre" required maxLength={120} className="mt-1 block w-full border border-slate-300 px-3 py-2 outline-none focus:border-cyan-500" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Code pays
              <input name="countryCode" value={form.countryCode} onChange={updateField} placeholder="CD" maxLength={10} className="mt-1 block w-full border border-slate-300 px-3 py-2 uppercase outline-none focus:border-cyan-500" />
            </label>
            <button type="submit" disabled={saving} className="w-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">
              {saving ? 'Création...' : 'Créer la région'}
            </button>
          </div>
        </form>

        <div className="border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900">Régions configurées</h2>
            <span className="text-sm text-slate-500">{regions.length} région(s)</span>
          </div>
          {loading ? (
            <p className="px-5 py-8 text-sm text-slate-500">Chargement...</p>
          ) : regions.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">Aucune région configurée.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {regions.map((region) => (
                <div key={region.RegionID} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900">{region.RegionName}</strong>
                      <span className={`text-xs font-bold uppercase ${region.IsActive ? 'text-emerald-600' : 'text-slate-400'}`}>{region.IsActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{region.RegionCode} {region.CountryCode ? `· ${region.CountryCode}` : ''}</p>
                    <p className="mt-2 text-xs text-slate-600">{region.ActiveAgentCount || 0} agent(s) · {region.ActiveOrganizationCount || 0} organisation(s)</p>
                  </div>
                  <button type="button" onClick={() => toggleRegion(region)} className="border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:border-cyan-500 hover:text-cyan-700">
                    {region.IsActive ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={assignAgent} className="border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Affecter un agent</h2>
            <p className="mt-1 text-sm text-slate-600">Un agent peut être affecté à une région active.</p>
          </div>
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{agents.length} compte(s) agent</span>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="block text-sm font-semibold text-slate-700">
            Agent
            <select value={assignment.userId} onChange={selectAgent} required className="mt-1 block w-full border border-slate-300 bg-white px-3 py-2 outline-none focus:border-cyan-500">
              <option value="">Sélectionner un agent</option>
              {agents.map((agent) => (
                <option key={agent.UserID} value={agent.UserID} disabled={!agent.UserIsActive}>
                  {agent.FirstName} {agent.LastName} · {agent.Email}{agent.UserIsActive ? '' : ' (inactif)'}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Région
            <select value={assignment.regionId} onChange={(event) => setAssignment((current) => ({ ...current, regionId: event.target.value }))} required className="mt-1 block w-full border border-slate-300 bg-white px-3 py-2 outline-none focus:border-cyan-500">
              <option value="">Sélectionner une région</option>
              {regions.filter((region) => region.IsActive).map((region) => (
                <option key={region.RegionID} value={region.RegionID}>{region.RegionName} · {region.RegionCode}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={saving || !agents.length} className="bg-cyan-700 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'Enregistrement...' : 'Affecter'}
          </button>
        </div>
        {assignment.userId && (
          <p className="mt-3 text-xs text-slate-500">
            Affectation actuelle : {agents.find((agent) => String(agent.UserID) === assignment.userId)?.RegionName || 'aucune'}
          </p>
        )}
      </form>
    </section>
  );
}
