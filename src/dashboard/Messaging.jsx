import React from 'react';
import { FaWhatsapp, FaEnvelope, FaClock } from 'react-icons/fa';

/**
 * Composant de supervision des flux de communication (Logs WhatsApp Twilio & Support)
 * Épuré des imports de chemins relatifs complexes pour garantir le succès du Build
 */
export default function Messaging() {
  const systemLogs = [
    { id: 1, type: "WhatsApp", target: "+243810000000", context: "Émission Carte Virtuelle Maman Thérèse", status: "Délivré", time: "Il y a 5 min" },
    { id: 2, type: "SMS", target: "+243990000000", context: "Alerte Secours - Renouvellement Auto", status: "Envoyé", time: "Il y a 20 min" }
  ];

  return (
    <div className="p-3 sm:p-6 space-y-6 min-h-screen text-slate-100">
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <FaWhatsapp className="text-green-500" /> Centre de Relations Omnicanal
        </h1>
        <p className="text-xs text-slate-300">Suivi en temps réel des notifications WhatsApp (API Twilio) et SMS de l'écosystème ESNAS
.</p>
      </div>

      {/* Tableau des logs de communication */}
      <div className="admin-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center gap-2">
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-400">Journal des transmissions</h3>
          <span className="text-xs font-mono bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">Passerelle Active</span>
        </div>
        
        <div className="divide-y divide-white/10">
          {systemLogs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded font-bold uppercase ${log.type === 'WhatsApp' ? 'bg-green-500/10 text-green-500' : 'bg-[#00A3E0]/10 text-[#00A3E0]'}`}>{log.type}</span>
                  <span className="font-mono text-slate-300 break-all">{log.target}</span>
                </div>
                <p className="text-slate-200 font-semibold">{log.context}</p>
              </div>
              <div className="text-left sm:text-right sm:space-y-1">
                <span className="text-emerald-500 font-bold block">● {log.status}</span>
                <span className="text-slate-400 flex items-center justify-end gap-1"><FaClock /> {log.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
