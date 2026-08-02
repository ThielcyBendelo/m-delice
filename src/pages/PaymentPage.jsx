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

{/* ================= 1. CORE TRANSACTIONAL ROUTE (VERSION SOMBRE) ================= */}
<main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-24 pt-32 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start bg-[#090d16]">
  
  {/* COLONNE GAUCHE : RECAPITULATIF FINANCIER (COL 4) */}
  <div className="lg:col-span-4 space-y-6 w-full">
    
    {/* Boîte principale de Récapitulatif - Style Bento Sombre */}
    <div className="bg-[#111827] p-6 md:p-8 border border-slate-800 shadow-xl space-y-6 rounded-none text-left">
      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#CE1126]">Récapitulatif de commande</h3>
      
      {/* Infos du Pack */}
      <div className="pb-4 border-b border-slate-800">
        <p className="text-base font-black text-white uppercase tracking-tight">{selectedPack.name}</p>
        <p className="text-xs text-[#94a3b8] font-semibold mt-1">{selectedPack.coverageLimit}</p>
      </div>

      {/* Infos du Bénéficiaire */}
      <div className="py-4 border-b border-slate-800 space-y-3">
        <p className="text-[11px] font-black uppercase text-slate-300 tracking-wider">Bénéficiaire en RD Congo</p>
        <p className="text-sm font-bold text-white flex items-center gap-2">
          <FaUser className="text-[#CE1126] flex-shrink-0" size={12} /> {beneficiaryData.beneficiaryFirstName} {beneficiaryData.beneficiaryLastName}
        </p>
        <p className="text-xs font-black text-slate-400 flex items-center gap-2 font-mono">
          <FaPhone className="text-[#CE1126] flex-shrink-0" size={12} /> {beneficiaryData.beneficiaryPhone} ({beneficiaryData.beneficiaryCity})
        </p>
      </div>

      {/* Total Financier */}
      <div className="pt-4 flex items-center justify-between font-black text-white">
        <span className="text-xs uppercase tracking-wider text-slate-400">Total à payer</span>
        <span className="text-3xl md:text-4xl text-white tracking-tighter">{selectedPack.price} USD</span>
      </div>
    </div>

    {/* Bloc d'avertissement de Sécurité Chiffré Modernisé */}
    <div className="bg-emerald-950/30 border border-emerald-900/60 text-emerald-400 p-5 flex items-start gap-3 rounded-none text-left shadow-sm">
      <FaLock className="mt-0.5 flex-shrink-0 text-sm text-emerald-500" />
      <p className="text-xs font-semibold leading-relaxed">
        Vos informations d'identification de paiement sont entièrement chiffrées de bout en bout et transmises via un canal sécurisé isolé.
      </p>
    </div>
  </div>

{/* COLONNE DROITE : GUICHETS FINTECH DE PAIEMENT (COL 8 - SOMBRE ONYX) */}
<div className="lg:col-span-8 space-y-10 w-full text-left">
  <div className="bg-transparent space-y-8 rounded-none">
    
    {/* Sélection de la méthode de règlement - Boutons Horizontaux Bento */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => setPaymentMethod('card')}
        className={`p-5 border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.15em] rounded-none focus:outline-none ${
          paymentMethod === 'card'
            ? 'border-[#CE1126] bg-[#CE1126]/10 text-white'
            : 'border-slate-800 bg-[#111827] text-slate-400 hover:border-slate-600 hover:text-white'
        }`}
      >
        <FaCreditCard size={20} className={paymentMethod === 'card' ? 'text-[#CE1126]' : 'text-slate-400'} />
        <span>Diaspora (Carte / Stripe)</span>
      </button>

      <button
        type="button"
        onClick={() => setPaymentMethod('mobile_money')}
        className={`p-5 border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.15em] rounded-none focus:outline-none ${
          paymentMethod === 'mobile_money'
            ? 'border-[#CE1126] bg-[#CE1126]/10 text-white'
            : 'border-slate-800 bg-[#111827] text-slate-400 hover:border-slate-600 hover:text-white'
        }`}
      >
        <FaMobileAlt size={20} className={paymentMethod === 'mobile_money' ? 'text-[#CE1126]' : 'text-slate-400'} />
        <span>RDC Local (Mobile Money)</span>
      </button>
    </div>

    {/* Formulaire Transactionnel Épuré */}
    <form onSubmit={handlePaymentSubmit} className="space-y-8 bg-[#111827] p-6 md:p-10 border border-slate-800 rounded-none shadow-xl">
      
      {paymentMethod === 'card' ? (
        /* SECTION CARTE BANCAIRE INTERNATIONALE */
        <div className="space-y-6">
          <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 border-b border-slate-800 pb-3">
            Informations de Carte Internationale
          </h4>
          
          {/* Numéro de Carte */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Numéro de carte</label>
            <input 
              type="text" 
              maxLength="19" 
              placeholder="4242 •••• •••• 4242" 
              className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] focus:placeholder-transparent text-white rounded-none placeholder-slate-600" 
              required 
            />
          </div>

          {/* Expiration & CVC */}
          <div className="grid grid-cols-2 gap-8 md:gap-10">
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Date d'expiration</label>
              <input 
                type="text" 
                placeholder="MM / AA" 
                maxLength="5" 
                className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] text-center focus:placeholder-transparent text-white rounded-none placeholder-slate-600" 
                required 
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Code secret (CVC)</label>
              <input 
                type="password" 
                placeholder="•••" 
                maxLength="4" 
                className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] text-center focus:placeholder-transparent text-white rounded-none placeholder-slate-600" 
                required 
              />
            </div>
          </div>
        </div>
              ) : (
                /* SECTION MOBILE MONEY DE LA RDC (CINETPAY TUNNEL - SOMBRE ONYX) */
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 border-b border-slate-800 pb-3">
                    Opérateur Mobile Money (RDC)
                  </h4>
                  
                  {/* Grille des Opérateurs - Styles Carrés et Contrastés */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'mpesa', name: 'Vodacom M-Pesa' },
                      { id: 'airtel', name: 'Airtel Money' },
                      { id: 'orange', name: 'Orange Money' }
                    ].map((op) => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setMobileOperator(op.id)}
                        className={`p-4 border-2 text-center text-xs font-black uppercase tracking-wider transition-all rounded-none focus:outline-none ${
                          mobileOperator === op.id
                            ? 'border-white bg-white text-black shadow-lg'
                            : 'border-slate-800 bg-[#090d16] text-slate-400 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        {op.name}
                      </button>
                    ))}
                  </div>

                  {/* Saisie du numéro payeur */}
                  <div className="space-y-3">
                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Numéro de téléphone payeur (+243)
                    </label>
                    <input 
                      type="tel" 
                      placeholder="812345678" 
                      maxLength="9" 
                      className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] text-white font-mono rounded-none placeholder-slate-600" 
                      required 
                    />
                  </div>
                </div>
              )}

              {/* Validation finale : Boutons rectangulaires à fort contraste inversé */}
              <div className="pt-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-10 py-5 border-2 border-slate-700 bg-transparent text-white font-extrabold uppercase text-[11px] tracking-[0.25em] transition-all hover:bg-slate-800 hover:border-slate-600 flex items-center justify-center gap-2 rounded-none focus:outline-none"
                >
                  <FaArrowLeft size={10} className="text-[#CE1126]" /> Retour
                </button>
                
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-12 py-5 bg-white text-black font-black uppercase text-[11px] tracking-[0.25em] shadow-xl hover:bg-[#CE1126] hover:text-white transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2 flex-grow sm:flex-grow-0 rounded-none focus:outline-none"
                >
                  {isProcessing ? (
                    <>
                      <FaSpinner className="animate-spin" size={12} /> Traitement...
                    </>
                  ) : (
                    <>
                      Confirmer le règlement <FaArrowRight size={10} className="text-[#CE1126] group-hover:text-white" />
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
