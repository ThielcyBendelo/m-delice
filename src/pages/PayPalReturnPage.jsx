import React, { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaHome } from 'react-icons/fa';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import policyService from '../services/policyService.js';

export default function PayPalReturnPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isCancelled = location.pathname.includes('annule');
  const transactionReference = searchParams.get('tx');

  const [status, setStatus] = useState(isCancelled ? 'cancelled' : 'loading');
  const [policyNumber, setPolicyNumber] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isCancelled) return;
    if (!transactionReference) {
      setStatus('error');
      setError('Référence de transaction manquante.');
      return;
    }
    (async () => {
      const result = await policyService.capturePaypal(transactionReference);
      if (result.success) {
        setPolicyNumber(result.policyNumber);
        setStatus('success');
      } else {
        setStatus('error');
        setError(result.error);
      }
    })();
  }, [isCancelled, transactionReference]);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased font-sans">
      <NavbarSecured />
      <main className="flex-grow max-w-2xl w-full mx-auto px-4 sm:px-6 py-24 pt-32 flex flex-col items-center text-center gap-6">
        {status === 'loading' && (
          <>
            <FaSpinner className="animate-spin text-[#CE1126]" size={40} />
            <h1 className="text-xl font-black uppercase tracking-wide">Confirmation du paiement PayPal en cours…</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <FaCheckCircle className="text-emerald-500" size={48} />
            <h1 className="text-xl font-black uppercase tracking-wide">Paiement confirmé</h1>
            <p className="text-slate-600">Votre police {policyNumber} est maintenant active.</p>
          </>
        )}
        {status === 'cancelled' && (
          <>
            <FaTimesCircle className="text-amber-500" size={48} />
            <h1 className="text-xl font-black uppercase tracking-wide">Paiement annulé</h1>
            <p className="text-slate-600">Vous avez annulé le paiement PayPal. Aucune somme n'a été débitée.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <FaTimesCircle className="text-red-500" size={48} />
            <h1 className="text-xl font-black uppercase tracking-wide">Échec de la confirmation</h1>
            <p className="text-slate-600">{error}</p>
          </>
        )}
        <Link
          to="/dashboard"
          className="mt-4 inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-black uppercase text-[11px] tracking-[0.2em] hover:bg-[#CE1126] transition-all"
        >
          <FaHome size={12} /> Retour au tableau de bord
        </Link>
      </main>
      <Footer />
    </div>
  );
}
