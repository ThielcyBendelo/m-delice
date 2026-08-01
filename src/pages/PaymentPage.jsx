import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import policyService from '../services/policyService.js';
import notificationService from '../services/notificationService';
// 🟢 CORRIGÉ : Ajout explicite de FaArrowRight dans les accolades d'importation
import { 
  FaCreditCard, FaMobileAlt, FaShieldAlt, FaLock, 
  FaUser, FaPhone, FaCheckCircle, FaArrowLeft, FaSpinner,
  FaArrowRight 
} from 'react-icons/fa';


export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // Récupération des données transmises par le tunnel d'achat précédent
  const selectedPack = location.state?.selectedPack || {
    id: 1,
    name: "Pack Santé Famille - CONFORT",
    price: 45,
    branch: "Santé",
    coverageLevel: "Confort",
    coverageLimit: "Plafond annuel : 3 500 USD"
  };

  const beneficiaryData = location.state?.beneficiaryData || {
    beneficiaryLastName: 'Mbuyi',
    beneficiaryFirstName: 'Thérèse',
    beneficiaryPhone: '+243810000000',
    beneficiaryCity: 'Kinshasa',
    beneficiaryAddress: 'Avenue de la Justice, Gombe',
    beneficiaryNationalID: 'N-RDC-89215'
  };

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [mobileOperator, setMobileOperator] = useState('mpesa');

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      notificationService.info("Traitement de la transaction financière et chiffrement ARCA...");

      const mockTxRef = paymentMethod === 'card' 
        ? `STR-ch_${Math.random().toString(36).substring(2, 12)}` 
        : `CIN-MM-${Math.floor(10000000 + Math.random() * 90000000)}`;

      const paymentDetails = {
        transactionReference: mockTxRef,
        gateway: paymentMethod === 'card' ? 'Stripe_Card' : 'CinetPay_MobileMoney',
        currency: 'USD',
        exchangeRate: 1
      };

      const result = await policyService.purchasePolicy(beneficiaryData, selectedPack, paymentDetails);

      if (result.success) {
        notificationService.success(`Paiement approuvé ! Contrat officiel émis : ${result.policyNumber}`);
        navigate('/dashboard', { 
          state: { 
            paymentSuccess: true,
            policyNumber: result.policyNumber
          } 
        });
      } else {
        notificationService.error(result.error || "Le régulateur a rejeté l'émission du certificat.");
      }
    } catch (error) {
      console.error("[Fintech Checkout Error]", error);
      notificationService.error("Échec critique lors de l'enregistrement de la police d'assurance.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased font-sans">
      <NavbarSecured />

      {/* ================= 1. CORE TRANSACTIONAL ROUTE ================= */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-24 pt-32 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        
        {/* COLONNE GAUCHE : RECAPITULATIF FINANCIER (COL 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-600">Récapitulatif de commande</h3>
            
            <div className="pb-4 border-b border-slate-200">
              <p className="text-base font-black text-slate-900 uppercase tracking-tight">{selectedPack.name}</p>
              <p className="text-xs text-slate-400 font-medium italic mt-1">{selectedPack.coverageLimit}</p>
            </div>

            <div className="py-4 border-b border-slate-200 space-y-3">
              <p className="text-[11px] font-black uppercase text-slate-950 tracking-wider">Bénéficiaire en RD Congo</p>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FaUser className="text-red-600 flex-shrink-0" /> {beneficiaryData.beneficiaryFirstName} {beneficiaryData.beneficiaryLastName}
              </p>
              <p className="text-xs font-black text-slate-600 flex items-center gap-2 font-mono">
                <FaPhone className="text-red-600 flex-shrink-0" /> {beneficiaryData.beneficiaryPhone} ({beneficiaryData.beneficiaryCity})
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between font-black text-slate-900">
              <span className="text-sm uppercase tracking-wider text-slate-400">Total à payer</span>
              <span className="text-4xl text-slate-900 tracking-tighter">{selectedPack.price} USD</span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-6 rounded-2xl flex items-start gap-3">
            <FaLock className="mt-1 flex-shrink-0 text-sm text-emerald-600" />
            <p className="text-xs font-semibold leading-relaxed">
              Vos informations d'identification de paiement sont entièrement chiffrées de bout en bout et transmises via un canal sécurisé isolé.
            </p>
          </div>
        </div>

                {/* COLONNE DROITE : GUICHETS FINTECH DE PAIEMENT (COL 8) */}
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white p-2 md:p-4 space-y-8">
            
            {/* Sélection de la méthode de règlement */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 font-extrabold text-[11px] uppercase tracking-wider ${
                  paymentMethod === 'card'
                    ? 'border-[#CE1126] bg-red-50/50 text-[#CE1126]'
                    : 'border-slate-100 bg-slate-50/40 text-slate-400 hover:border-slate-200'
                }`}
              >
                <FaCreditCard size={18} />
                <span>Diaspora (Carte / Stripe)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('mobile_money')}
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 font-extrabold text-[11px] uppercase tracking-wider ${
                  paymentMethod === 'mobile_money'
                    ? 'border-[#CE1126] bg-red-50/50 text-[#CE1126]'
                    : 'border-slate-100 bg-slate-50/40 text-slate-400 hover:border-slate-200'
                }`}
              >
                <FaMobileAlt size={18} />
                <span>RDC Local (Mobile Money)</span>
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-8">
              
              {paymentMethod === 'card' ? (
                /* SECTION CARTE BANCAIRE INTERNATIONALE */
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Informations de Carte Internationale</h4>
                  <div className="space-y-3">
                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Numéro de carte</label>
                    <input type="text" maxLength="19" placeholder="4242 •••• •••• 4242" className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 focus:placeholder-transparent" required />
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Date d'expiration</label>
                      <input type="text" placeholder="MM / AA" maxLength="5" className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 text-center focus:placeholder-transparent" required />
                    </div>
                    {/* ─── 🟢 CORRIGÉ : Saisie du CVC rétablie et refermée proprement */}
                    <div className="space-y-3">
                      <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Code secret (CVC)</label>
                      <input type="password" placeholder="•••" maxLength="4" className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 text-center focus:placeholder-transparent" required />
                    </div>
                  </div>
                </div>
              ) : (
                /* SECTION MOBILE MONEY DE LA RDC (CINETPAY TUNNEL) */
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Opérateur Mobile Money (RDC)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'mpesa', name: 'Vodacom M-Pesa' },
                      { id: 'airtel', name: 'Airtel Money' },
                      { id: 'orange', name: 'Orange Money' }
                    ].map((op) => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setMobileOperator(op.id)}
                        className={`p-4 rounded-xl border-2 text-center text-xs font-black uppercase tracking-wider transition-all ${
                          mobileOperator === op.id
                            ? 'border-slate-950 bg-slate-50 text-slate-950'
                            : 'border-slate-100 bg-slate-50/40 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {op.name}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Numéro de téléphone payeur (+243)</label>
                    <input type="tel" placeholder="812345678" maxLength="9" className="w-full border-b-2 border-slate-100 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-red-600 font-mono" required />
                  </div>
                </div>
              )}

              {/* Validation finale : Bouton rectangulaire à fort contraste */}
              <div className="pt-6 flex flex-col sm:flex-row gap-6">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-10 py-5 border-2 border-slate-900 text-black font-extrabold uppercase text-[11px] tracking-[0.25em] transition-all hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <FaArrowLeft size={10} /> Retour
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-12 py-5 bg-red-600 text-white font-black uppercase text-[11px] tracking-[0.25em] shadow-2xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 flex-grow sm:flex-grow-0"
                >
                  {isProcessing ? (
                    <>
                      <FaSpinner className="animate-spin" size={12} /> Traitement...
                    </>
                  ) : (
                    <>
                      Confirmer le règlement <FaArrowRight size={10} />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
