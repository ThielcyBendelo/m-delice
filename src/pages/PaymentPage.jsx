import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavbarSecured from '../components/NavbarSecured';
import Footer from '../components/Footer';
import policyService from '../services/policyService.js';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
import secureAPIClient from '../utils/secureAPIClient';
// 🟢 CORRIGÉ : Ajout explicite de FaArrowRight dans les accolades d'importation
import { 
  FaCreditCard, FaMobileAlt, FaLock, FaUser, FaPhone, FaArrowLeft, FaSpinner,
  FaArrowRight 
} from 'react-icons/fa';
import { FaPaypal } from 'react-icons/fa6';

// Correspondance opérateur RDC -> code opérateur PawaPay (agrégateur Mobile Money)
const PAWAPAY_PROVIDERS = {
  mpesa: 'VODACOM_MPESA_COD',
  airtel: 'AIRTEL_COD',
  orange: 'ORANGE_COD',
};


export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // Récupération des données transmises par le tunnel d'achat précédent
  const selectedPack = useMemo(() => location.state?.selectedPack || {
    id: 1,
    name: "Pack Santé Famille - CONFORT",
    price: 45,
    branch: "Santé",
    coverageLevel: "Confort",
    coverageLimit: "Plafond annuel : 3 500 USD"
  }, [location.state?.selectedPack]);

  const beneficiaryData = location.state?.beneficiaryData || null;
  const paymentDetails = location.state?.paymentDetails || null;
  const hasBeneficiaryState = Boolean(location.state?.beneficiaryData);

  const [paymentMethod, setPaymentMethod] = useState(paymentDetails ? 'mobile_money' : 'card');
  const [mobileOperator, setMobileOperator] = useState(paymentDetails?.mobileOperator || 'mpesa');
  const [payerPhone, setPayerPhone] = useState(paymentDetails?.payerPhone?.replace(/^\+243/, '') || '');
  const [rememberMobileMoney, setRememberMobileMoney] = useState(false);
  const [billing, setBilling] = useState({ fullName: '', email: '', phone: '', address: '', region: '', city: '', postalCode: '', country: 'RDC' });
  const [billingStatus, setBillingStatus] = useState('');
  const [billingChallengeId, setBillingChallengeId] = useState('');
  const [billingCode, setBillingCode] = useState('');
  const [billingEmailVerified, setBillingEmailVerified] = useState(false);
  const [mobileMoneyPending, setMobileMoneyPending] = useState(null);

  useEffect(() => {
    if (paymentMethod !== 'mobile_money') return;
    try {
      const saved = JSON.parse(localStorage.getItem('esnas_mobile_money_preference') || 'null');
      if (saved?.phone) {
        setPayerPhone(saved.phone);
        setMobileOperator(saved.operator || 'mpesa');
        setRememberMobileMoney(true);
      }
    } catch {
      // Une préférence locale invalide ne doit pas bloquer le paiement.
    }
  }, [paymentMethod]);

  useEffect(() => {
    secureAPIClient.get('/payment/billing-profile').then((response) => {
      const profile = response.data?.billingProfile;
      if (profile) setBilling({ fullName: profile.FullName || profile.fullName || '', email: profile.email || '', phone: profile.phone || '', address: profile.address || '', region: profile.region || '', city: profile.city || '', postalCode: profile.postalCode || '', country: profile.country || 'RDC' });
    }).catch(() => {
      setBillingStatus('Vos informations de facturation seront demandées avant la confirmation.');
    });
  }, []);

  const updateBilling = (event) => {
    setBilling((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    if (event.target.name === 'email') setBillingEmailVerified(false);
  };

  const requestBillingVerification = async () => {
    setBillingStatus('Envoi du code de confirmation à votre adresse email...');
    try {
      const response = await secureAPIClient.post('/payment/billing-profile/email-verification', billing);
      setBillingChallengeId(response.data?.challengeId || '');
      setBillingStatus('Code envoyé. Consultez votre boîte email et saisissez le code à 6 chiffres.');
      notificationService.info('Un code de confirmation a été envoyé à votre adresse email.');
    } catch (error) {
      setBillingStatus(error.userMessage || 'Impossible d’envoyer le code de confirmation.');
      notificationService.error(error.userMessage || 'Impossible d’envoyer le code de confirmation.');
    }
  };

  const confirmBillingEmail = async () => {
    try {
      const response = await secureAPIClient.post('/payment/billing-profile/email-verification/confirm', { ...billing, challengeId: billingChallengeId, code: billingCode });
      if (!response.data?.success) throw new Error(response.data?.message || 'Code invalide.');
      setBillingEmailVerified(true);
      setBillingStatus('Adresse email confirmée. Vous pouvez maintenant enregistrer vos informations.');
      notificationService.success('Adresse email confirmée.');
    } catch (error) {
      setBillingEmailVerified(false);
      setBillingStatus(error.userMessage || error.message || 'Code invalide ou expiré.');
      notificationService.error(error.userMessage || error.message || 'Code invalide ou expiré.');
    }
  };

  const saveBilling = async () => {
    if (!billingEmailVerified) {
      await requestBillingVerification();
      return;
    }
    setBillingStatus('Enregistrement de vos informations de facturation...');
    try {
      const response = await secureAPIClient.put('/payment/billing-profile', billing);
      setBillingStatus(response.data?.message || 'Informations de facturation enregistrées.');
      notificationService.success('Vos informations de facturation sont enregistrées et pourront être réutilisées.');
    } catch (error) {
      setBillingStatus(error.userMessage || 'Impossible d’enregistrer ces informations.');
      notificationService.error(error.userMessage || 'Impossible d’enregistrer les informations de facturation.');
    }
  };

  const deleteBilling = async () => {
    try {
      await secureAPIClient.delete('/payment/billing-profile');
      setBilling({ fullName: '', email: '', phone: '', address: '', region: '', city: '', postalCode: '', country: 'RDC' });
      setBillingEmailVerified(false);
      setBillingStatus('Informations supprimées de votre profil.');
      notificationService.success('Informations de facturation supprimées.');
    } catch (error) {
      notificationService.error(error.userMessage || 'Impossible de supprimer ces informations.');
    }
  };

  useEffect(() => {
    if (!authService.isLoggedIn()) {
      notificationService.error('Connectez-vous pour finaliser le paiement.');
      navigate('/login', {
        replace: true,
        state: { from: '/passerelle-paiement', selectedPack, beneficiaryData, paymentDetails },
      });
      return;
    }
    if (!hasBeneficiaryState) {
      notificationService.info?.('Complétez d’abord l’identité du bénéficiaire.') ||
        notificationService.error('Complétez d’abord l’identité du bénéficiaire.');
      navigate('/inscription-beneficiaire', { replace: true, state: { selectedPack } });
    }
  }, [beneficiaryData, hasBeneficiaryState, navigate, paymentDetails, selectedPack]);

  useEffect(() => {
    if (!mobileMoneyPending?.transactionReference) return undefined;
    let cancelled = false;
    const checkStatus = async () => {
      const result = await policyService.getMobileMoneyStatus(mobileMoneyPending.transactionReference);
      if (cancelled || !result.success) return;
      if (result.status === 'completed') {
        setMobileMoneyPending(null);
        notificationService.success('Paiement Mobile Money confirmé. Votre police est maintenant active.');
        navigate('/dashboard', { state: { paymentSuccess: true, policyNumber: mobileMoneyPending.policyNumber, transactionReference: mobileMoneyPending.transactionReference } });
      } else if (result.status === 'failed') {
        setMobileMoneyPending((previous) => ({ ...previous, status: 'failed', statusLabel: result.label }));
      }
    };
    checkStatus();
    const timer = window.setInterval(checkStatus, 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [mobileMoneyPending, navigate]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!beneficiaryData) {
      notificationService.error('Données bénéficiaire manquantes.');
      navigate('/inscription-beneficiaire', { state: { selectedPack } });
      return;
    }
    if (!authService.isLoggedIn()) {
      notificationService.error('Session expirée.');
      navigate('/login');
      return;
    }
    if (!billing.fullName.trim() || !billing.email.trim() || !billing.phone.trim() || !billing.address.trim() || !billing.city.trim()) {
      notificationService.error('Complétez le nom, l’email, le téléphone, l’adresse et la ville avant de poursuivre.');
      setBillingStatus('Nom, email, téléphone, adresse et ville sont nécessaires pour établir votre facture.');
      return;
    }
    if (!billingEmailVerified) {
      notificationService.error('Confirmez votre adresse email avant de poursuivre le paiement.');
      setBillingStatus('Demandez puis confirmez le code reçu par email.');
      return;
    }
    if (paymentMethod === 'mobile_money' && !/^\d{9}$/.test(payerPhone)) {
      notificationService.error('Saisissez exactement 9 chiffres pour le numéro Mobile Money.');
      return;
    }

    setIsProcessing(true);

    try {
      notificationService.info("Création de l'intention de paiement et activation police (SQL)…");

      const gateway = paymentMethod === 'card' ? 'simulation'
        : paymentMethod === 'paypal' ? 'paypal'
        : 'CinetPay_MobileMoney';

      const mobileMoney = paymentMethod === 'mobile_money'
        ? { phoneNumber: `243${payerPhone}`, provider: PAWAPAY_PROVIDERS[mobileOperator] }
        : undefined;

      if (paymentMethod === 'mobile_money') {
        try {
          if (rememberMobileMoney) {
            localStorage.setItem('esnas_mobile_money_preference', JSON.stringify({ phone: payerPhone, operator: mobileOperator }));
          } else {
            localStorage.removeItem('esnas_mobile_money_preference');
          }
        } catch {
          // Le paiement ne dépend pas du stockage local.
        }
      }

      const result = await policyService.purchaseWithPaymentFlow(beneficiaryData, selectedPack, {
        gateway,
        currency: 'USD',
        paymentMethod,
        mobileOperator: paymentMethod === 'mobile_money' ? mobileOperator : null,
        mobileMoney,
        billingDetails: billing,
      });

      if (result.redirect) {
        notificationService.info('Redirection vers PayPal pour approbation…');
        window.location.href = result.redirectUrl;
        return;
      }

      if (result.pending) {
        notificationService.info('Demande Mobile Money envoyée. Confirmez-la sur votre téléphone; nous vérifions automatiquement le résultat.');
        setMobileMoneyPending({
          policyNumber: result.policyNumber,
          transactionReference: result.transactionReference,
          status: 'pending',
          statusLabel: 'En attente de confirmation opérateur',
        });
        return;
      }

      if (result.success) {
        const taxNote = result.taxArcaUSD != null ? ` (dont taxe ARCA ${result.taxArcaUSD} USD)` : '';
        notificationService.success(
          `Paiement confirmé${result.simulation ? ' [simulation]' : ''} ! Police ${result.policyNumber}${taxNote}`
        );
        navigate('/dashboard', { 
          state: { 
            paymentSuccess: true,
            policyNumber: result.policyNumber,
            transactionReference: result.transactionReference,
          } 
        });
      } else {
        notificationService.error(result.error || "Le régulateur a rejeté l'émission du certificat.");
      }
    } catch (error) {
      console.error("[Fintech Checkout Error]", error);
      notificationService.error(error.userMessage || error.message || "Échec lors de l'enregistrement de la police d'assurance.");
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
          <FaUser className="text-[#CE1126] flex-shrink-0" size={12} /> {beneficiaryData?.beneficiaryFirstName || '—'} {beneficiaryData?.beneficiaryLastName || ''}
        </p>
        <p className="text-xs font-black text-slate-400 flex items-center gap-2 font-mono">
          <FaPhone className="text-[#CE1126] flex-shrink-0" size={12} /> {beneficiaryData?.beneficiaryPhone || '—'} ({beneficiaryData?.beneficiaryCity || '—'})
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
  {mobileMoneyPending && <div className={`border p-5 ${mobileMoneyPending.status === 'failed' ? 'border-red-800 bg-red-950/30 text-red-300' : 'border-amber-700 bg-amber-950/30 text-amber-200'}`} aria-live="polite">
    <p className="text-[11px] font-black uppercase tracking-[0.18em]">Statut Mobile Money</p>
    <p className="mt-2 text-sm font-semibold">{mobileMoneyPending.statusLabel}</p>
    <p className="mt-2 text-xs leading-relaxed text-slate-300">Référence : <span className="font-mono">{mobileMoneyPending.transactionReference}</span>. {mobileMoneyPending.status === 'failed' ? 'Vous pouvez relancer un nouveau paiement.' : 'Gardez votre téléphone disponible et confirmez la demande USSD.'}</p>
  </div>}
  <div className="bg-transparent space-y-8 rounded-none">
    
    {/* Sélection de la méthode de règlement - Boutons Horizontaux Bento */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      <button
        type="button"
        onClick={() => setPaymentMethod('paypal')}
        className={`p-5 border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.15em] rounded-none focus:outline-none ${
          paymentMethod === 'paypal'
            ? 'border-[#CE1126] bg-[#CE1126]/10 text-white'
            : 'border-slate-800 bg-[#111827] text-slate-400 hover:border-slate-600 hover:text-white'
        }`}
      >
        <FaPaypal size={20} className={paymentMethod === 'paypal' ? 'text-[#CE1126]' : 'text-slate-400'} />
        <span>PayPal</span>
      </button>
    </div>

    <section className="bg-[#111827] p-6 md:p-8 border border-slate-800 shadow-xl space-y-5 rounded-none text-left">
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#CE1126]">Informations de facturation</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">Ces informations servent uniquement à établir votre facture et à rattacher le paiement à votre compte.</p>
      </div>
      <div className="space-y-3">
        <input name="fullName" value={billing.fullName} onChange={updateBilling} placeholder="Nom complet / raison sociale" autoComplete="name" className="w-full border border-slate-800 bg-[#090d16] px-3 py-3 text-sm font-semibold text-white outline-none focus:border-[#CE1126]" />
        <input type="email" name="email" value={billing.email} onChange={updateBilling} placeholder="Adresse email de facturation" autoComplete="email" className="w-full border border-slate-800 bg-[#090d16] px-3 py-3 text-sm font-semibold text-white outline-none focus:border-[#CE1126]" required />
        <input type="tel" name="phone" value={billing.phone} onChange={updateBilling} placeholder="Téléphone de facturation" autoComplete="tel" className="w-full border border-slate-800 bg-[#090d16] px-3 py-3 text-sm font-semibold text-white outline-none focus:border-[#CE1126]" required />
        <input name="address" value={billing.address} onChange={updateBilling} placeholder="Adresse de facturation" autoComplete="street-address" className="w-full border border-slate-800 bg-[#090d16] px-3 py-3 text-sm font-semibold text-white outline-none focus:border-[#CE1126]" />
        <div className="grid grid-cols-2 gap-3">
          <input name="region" value={billing.region} onChange={updateBilling} placeholder="Région / province" autoComplete="address-level1" className="w-full border border-slate-800 bg-[#090d16] px-3 py-3 text-sm font-semibold text-white outline-none focus:border-[#CE1126]" />
          <input name="city" value={billing.city} onChange={updateBilling} placeholder="Ville" autoComplete="address-level2" className="w-full border border-slate-800 bg-[#090d16] px-3 py-3 text-sm font-semibold text-white outline-none focus:border-[#CE1126]" required />
        </div>
        <input name="postalCode" value={billing.postalCode} onChange={updateBilling} placeholder="Code postal (facultatif)" autoComplete="postal-code" className="w-full border border-slate-800 bg-[#090d16] px-3 py-3 text-sm font-semibold text-white outline-none focus:border-[#CE1126]" />
        {billingChallengeId && !billingEmailVerified && <div className="flex gap-2">
          <input inputMode="numeric" maxLength="6" value={billingCode} onChange={(event) => setBillingCode(event.target.value.replace(/\D/g, ''))} placeholder="Code reçu par email" className="min-w-0 flex-1 border border-slate-800 bg-[#090d16] px-3 py-2 text-sm font-semibold text-white outline-none focus:border-[#CE1126]" />
          <button type="button" onClick={confirmBillingEmail} className="border border-emerald-700 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">Confirmer</button>
        </div>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={saveBilling} className="border border-slate-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:border-[#CE1126]">{billingEmailVerified ? 'Enregistrer ces informations' : 'Vérifier mon email'}</button>
          <button type="button" onClick={deleteBilling} className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Supprimer</button>
        </div>
        {billingStatus && <p className="text-[10px] leading-relaxed text-slate-400" aria-live="polite">{billingStatus}</p>}
      </div>
    </section>

    {/* Formulaire Transactionnel Épuré */}
    <form onSubmit={handlePaymentSubmit} className="space-y-8 bg-[#111827] p-6 md:p-10 border border-slate-800 rounded-none shadow-xl">
      
      {paymentMethod === 'card' ? (
        /* SECTION CARTE BANCAIRE INTERNATIONALE */
        <div className="space-y-6">
          <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 border-b border-slate-800 pb-3">
            Informations de Carte Internationale
          </h4>
          
          <div className="border border-slate-800 bg-[#090d16] p-5 text-sm leading-relaxed text-slate-300">
            Le paiement par carte est traité par le prestataire sécurisé configuré pour ESNAS. Les numéros de carte, la date d’expiration et le CVC ne sont pas enregistrés par ESNAS.
          </div>
        </div>
              ) : paymentMethod === 'mobile_money' ? (
                /* SECTION MOBILE MONEY DE LA RDC (AGRÉGATEUR PAWAPAY) */
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
                      value={payerPhone}
                      onChange={(event) => setPayerPhone(event.target.value.replace(/\D/g, ''))}
                      className="w-full border-b-2 border-slate-800 bg-transparent py-3 text-lg font-bold outline-none transition focus:border-[#CE1126] text-white font-mono rounded-none placeholder-slate-600" 
                      required 
                    />
                    <label className="flex items-start gap-2 text-[10px] leading-relaxed text-slate-400">
                      <input type="checkbox" checked={rememberMobileMoney} onChange={(event) => setRememberMobileMoney(event.target.checked)} className="mt-0.5 accent-[#CE1126]" />
                      Mémoriser uniquement ce numéro Mobile Money sur cet appareil pour faciliter le prochain paiement. Aucune donnée bancaire ne sera enregistrée.
                    </label>
                  </div>
                </div>
              ) : (
                /* SECTION PAYPAL : APPROBATION SUR PAYPAL.COM */
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 border-b border-slate-800 pb-3">
                    Paiement via PayPal
                  </h4>
                  <div className="bg-[#090d16] border border-slate-800 p-6 flex items-start gap-3">
                    <FaPaypal className="mt-0.5 flex-shrink-0 text-[#CE1126]" size={18} />
                    <p className="text-xs font-semibold leading-relaxed text-slate-300">
                      Vous serez redirigé vers PayPal pour approuver le règlement de {selectedPack.price} USD en toute sécurité, puis renvoyé automatiquement ici pour l'activation de la police.
                    </p>
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
