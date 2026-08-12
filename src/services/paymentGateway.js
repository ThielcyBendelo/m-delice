import secureAPIClient from '../utils/secureAPIClient';
import notificationService from './notificationService';

const CINETPAY_SDK_URL = 'https://cdn.cinetpay.com/seamless/main.js';

function loadCinetPaySdk() {
  if (window.CinetPay) return Promise.resolve(window.CinetPay);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CINETPAY_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.CinetPay), { once: true });
      existing.addEventListener('error', () => reject(new Error('Chargement CinetPay impossible.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = CINETPAY_SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.CinetPay) resolve(window.CinetPay);
      else reject(new Error('SDK CinetPay chargé mais indisponible.'));
    };
    script.onerror = () => reject(new Error('Chargement CinetPay impossible.'));
    document.head.appendChild(script);
  });
}

/**
 * Service Fintech de gestion des transactions transfrontalières
 */
const paymentGateway = {
  
  /**
   * ÉTAPE 1 : STRIPE (Diaspora - Cartes Bancaires / Apple Pay)
   * Initialise l'intention de paiement côté serveur et récupère le Token Secret (Client Secret)
   * @param {Object} pack - Le pack d'assurance sélectionné (id, price, name)
   * @param {Object} beneficiary - Les données du proche en RDC
   * @returns {Promise<string|null>} Le jeton secret Stripe pour le formulaire Front-end
   */
  async createStripePaymentIntent(pack, beneficiary) {
    try {
      // Appel sécurisé vers votre route API Node.js/Next.js
      const response = await secureAPIClient.post('/payment/stripe-intent', {
        amount: pack.price,
        currency: 'usd', // Devise de référence exigée par l'ARCA
        metadata: {
          packName: pack.name,
          beneficiaryName: `${beneficiary.beneficiaryFirstName} ${beneficiary.beneficiaryLastName}`,
          beneficiaryPhone: beneficiary.beneficiaryPhone
        }
      });

      if (response.data && response.data.clientSecret) {
        return response.data.clientSecret;
      }
      throw new Error("Jeton Stripe manquant dans la réponse du serveur.");
    } catch (error) {
      console.error("Erreur d'initialisation Stripe:", error);
      notificationService.error("Impossible d'initialiser la passerelle Stripe. Veuillez réessayer.");
      return null;
    }
  },

  /**
   * ÉTAPE 2 : CINETPAY (RDC Local - Mobile Money : Orange, M-Pesa, Airtel)
   * Prépare et lance l'interface CinetPay injectée graphiquement dans la page
   * @param {Object} pack - Le pack d'assurance sélectionné
   * @param {Object} beneficiary - Les données du proche en RDC
   * @param {Function} onSuccessCallback - Action à exécuter après succès du Mobile Money
   */
  async initializeCinetPayMobileMoney(pack, beneficiary, onSuccessCallback) {
    try {
      const apiKey = import.meta.env.VITE_CINETPAY_API_KEY;
      const siteId = import.meta.env.VITE_CINETPAY_SITE_ID;
      if (!apiKey || !siteId) {
        notificationService.error('CinetPay n’est pas configuré. Renseignez VITE_CINETPAY_API_KEY et VITE_CINETPAY_SITE_ID.');
        return;
      }

      const CinetPay = await loadCinetPaySdk();

      // 1. Configuration des clés d'infrastructure (Masquées en production via les variables d'environnement)
      CinetPay.setConfig({
        apikey: apiKey,
        site_id: siteId,
        notify_url: `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/webhook/cinetpay`,
        mode: import.meta.env.PROD ? 'PRODUCTION' : 'TEST',
      });

      // 2. Lancement de la modale de paiement Mobile Money multi-opérateurs
      CinetPay.getCheckout({
        amount: pack.price,
        currency: 'USD',
        description: `Souscription active du ${pack.name} pour ${beneficiary.beneficiaryFirstName}`,
        customer_name: beneficiary.beneficiaryFirstName,
        customer_surname: beneficiary.beneficiaryLastName,
        customer_email: 'client@drcassurances.com', // Protection anti-bug de chaîne coupée
        customer_phone_number: beneficiary.beneficiaryPhone,
        trans_id: `DRC-MM-${Date.now()}` // ID unique de transaction basé sur le timestamp
      });

      // 3. Écouteur de statut de transaction CinetPay
      CinetPay.waitResponse(async (data) => {
        if (data.status === "REFUSED") {
          notificationService.error("La transaction Mobile Money a été rejetée ou le solde est insuffisant.");
        } else if (data.status === "ACCEPTED") {
          notificationService.success("Paiement Mobile Money validé par l'opérateur local !");
          if (onSuccessCallback) onSuccessCallback(data);
        }
      });

      CinetPay.onError((data) => {
        console.error('Erreur CinetPay:', data);
        notificationService.error('La passerelle CinetPay a refusé la transaction.');
      });

    } catch (error) {
      console.error("Échec de la passerelle CinetPay:", error);
      notificationService.error("Erreur technique lors du traitement de votre portefeuille mobile.");
    }
  },

  /**
   * ÉTAPE 3 : FINALISATION DU CONTRAT EN BASE DE DONNÉES
   * Transmet la preuve de paiement au Back-end pour écrire dans SQL Server et déclencher le WhatsApp
   * @param {Object} fullPayload - Regroupe l'acheteur, le bénéficiaire, le pack et la preuve de transaction
   */
  async verifyAndRegisterPolicyInDatabase(fullPayload) {
    try {
      const response = await secureAPIClient.post('/payment/checkout-success', fullPayload);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          policyNumber: response.data.policyNumber,
          qrCode: response.data.qrCode
        };
      }
      return { success: false, error: "Le serveur a refusé d'émettre la quittance d'assurance." };
    } catch (error) {
      console.error("Erreur d'écriture SQL Server via API:", error);
      return { success: false, error: "Échec de connexion avec la base de données centrale." };
    }
  }
};

export default paymentGateway;
