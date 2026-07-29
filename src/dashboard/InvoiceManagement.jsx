import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaFileInvoiceDollar, FaSearch, FaDownload, FaPrint, 
  FaShieldAlt, FaBarcode, FaCalendarAlt, FaCheckCircle,
  FaFilePdf, FaFilter
} from 'react-icons/fa';
import notificationService from '../services/notificationService';

export default function InvoiceManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");

  // Simulation du registre des quittances et attestations certifiées ARCA
  const invoicesList = [
    {
      invoiceNo: "QTC-2026-0412",
      policyNumber: "DRC-2026-9821",
      buyer: "Jean Mbuyi",
      beneficiary: "Thérèse Mbuyi (Kinshasa)",
      issueDate: "14 Juin 2026",
      amount: "540.00 USD",
      taxARCA: "54.00 USD", // 10% Taxe réglementaire
      status: "Émise & Signée",
      colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      invoiceNo: "QTC-2026-0411",
      policyNumber: "DRC-2026-9820",
      buyer: "Sarah K.",
      beneficiary: "Arsène K. (Lubumbashi)",
      issueDate: "29 Juin 2026",
      amount: "348.00 USD",
      taxARCA: "34.80 USD",
      status: "Émise & Signée",
      colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      invoiceNo: "QTC-2026-0410",
      policyNumber: "DRC-2026-9819",
      buyer: "Marc L.",
      beneficiary: "Fiston L. (Goma)",
      issueDate: "02 Juillet 2026",
      amount: "180.00 USD",
      taxARCA: "18.00 USD",
      status: "En attente Visa",
      colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20"
    }
  ];

  const handleDownloadPdf = (invoiceNo) => {
    if (notificationService?.success) {
      notificationService.success(`Génération et téléchargement sécurisé du PDF pour la quittance ${invoiceNo}...`);
    }
  };

  const handlePrintCertificate = (policyNo) => {
    if (notificationService?.info) {
      notificationService.info(`Ouverture du module d'impression de l'attestation officielle ARCA liée au contrat ${policyNo}...`);
    }
  };

  // Filtrage combiné (Recherche textuelle + Statut)
  const filteredInvoices = invoicesList.filter(invoice => {
    const matchStatus = filterStatus === "Tous" || invoice.status === filterStatus;
    const matchSearch = invoice.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        invoice.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        invoice.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        invoice.beneficiary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen p-1 text-slate-800 dark:text-slate-100 animate-fadeIn">
      
      {/* --- EN-TÊTE DU MODULE FINANCIER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <FaFileInvoiceDollar className="text-[#00A3E0]" /> Gestion des Quittances & Attestations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Émission instantanée des reçus fiscaux, décompte des taxes réglementaires de l'ARCA et génération de chartes de conformité.</p>
        </div>
      </div>

      {/* --- INFRASTRUCTURE DE FILTRAGE DES FACTURES --- */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Recherche textuelle */}
        <div className="sm:col-span-2 relative flex items-center">
          <span className="absolute left-3.5 text-slate-400"><FaSearch size={14} /></span>
          <input
            type="text"
            placeholder="Rechercher par N° Quittance, Police, Acheteur Diaspora ou Bénéficiaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          />
        </div>

        {/* Filtrage par état */}
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400"><FaFilter size={12} /></span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="Émise & Signée">Émises & Signées</option>
            <option value="En attente Visa">En attente Visa</option>
          </select>
        </div>

      </div>

      {/* --- REGISTRE DES DOCUMENTS COMPTABLES --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FaShieldAlt className="text-[#00A3E0]" /> Grand Livre Comptable des Quittances
          </h3>
          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-md font-black flex items-center gap-1">
            <FaBarcode /> {filteredInvoices.length} Certificat(s) Archivés
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/20 dark:bg-slate-800/10">
                <th className="p-4">N° Quittance</th>
                <th className="p-4">N° Police Liée</th>
                <th className="p-4">Acheteur (Diaspora)</th>
                <th className="p-4">Bénéficiaire (RDC)</th>
                <th className="p-4">Date de Validation</th>
                <th className="p-4 text-center">Taxe ARCA (10%)</th>
                <th className="p-4 text-center">Montant TTC</th>
                <th className="p-4 text-center">Validation</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 font-medium">
              {filteredInvoices.map((invoice, idx) => (
                <tr key={idx} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  
                  {/* N° Quittance */}
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FaFilePdf className="text-red-500" size={13} /> {invoice.invoiceNo}
                  </td>
                  
                  {/* N° Police */}
                  <td className="p-4 font-mono text-slate-400 font-bold">{invoice.policyNumber}</td>

                  {/* Acheteur */}
                  <td className="p-4 font-black">{invoice.buyer}</td>

                  {/* Bénéficiaire */}
                  <td className="p-4 italic text-xs">{invoice.beneficiary}</td>

                  {/* Date */}
                  <td className="p-4 text-slate-400 font-semibold flex items-center gap-1.5 mt-2.5">
                    <FaCalendarAlt size={11} /> {invoice.issueDate}
                  </td>

                  {/* Taxe ARCA */}
                  <td className="p-4 text-center font-mono font-bold text-amber-500">{invoice.taxARCA}</td>

                  {/* Montant TTC */}
                  <td className="p-4 text-center font-black text-[#00A3E0] font-mono text-sm">{invoice.amount}</td>

                  {/* Statut Émission */}
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${invoice.colorClass}`}>
                      <FaCheckCircle size={9} /> {invoice.status}
                    </span>
                  </td>

                  {/* Boutons d'édition et d'impression */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleDownloadPdf(invoice.invoiceNo)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                        title="Télécharger la facture PDF"
                      >
                        <FaDownload size={11} />
                      </button>
                      <button
                        onClick={() => handlePrintCertificate(invoice.policyNumber)}
                        className="p-2 bg-[#00A3E0]/10 hover:bg-[#00A3E0] hover:text-white text-[#00A3E0] rounded-lg transition-all"
                        title="Imprimer l'attestation d'assurance officielle"
                      >
                        <FaPrint size={11} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}