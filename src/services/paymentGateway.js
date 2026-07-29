import secureAPIClient from '../utils/secureAPIClient';
import notificationService from './notificationService';

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
      const response = await secureAPIClient.post('/api/payment/stripe-intent', {
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
  initializeCinetPayMobileMoney(pack, beneficiary, onSuccessCallback) {
    if (!window.CinetPay) {
      notificationService.error("Le module réseau CinetPay est actuellement introuvable. Vérifiez votre connexion.");
      return;
    }

    try {
      // 1. Configuration des clés d'infrastructure (Masquées en production via les variables d'environnement)
      window.CinetPay.setConfig({
        apikey: import.meta.env.VITE_CINETPAY_API_KEY || 'VOTRE_API_KEY_PAR_DEFAUT',
        site_id: import.meta.env.VITE_CINETPAY_SITE_ID || 'VOTRE_SITE_ID_PAR_DEFAUT',
        notify_url: 'https://drcassurances.com' // URL qui capte le Webhook de validation
      });

      // 2. Lancement de la modale de paiement Mobile Money multi-opérateurs
      window.CinetPay.production({
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
      window.CinetPay.waitResponse(async (data) => {
        if (data.status === "REFUSED") {
          notificationService.error("La transaction Mobile Money a été rejetée ou le solde est insuffisant.");
        } else if (data.status === "ACCEPTED") {
          notificationService.success("Paiement Mobile Money validé par l'opérateur local !");
          if (onSuccessCallback) onSuccessCallback(data);
        }
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
      const response = await secureAPIClient.post('/api/payment/checkout-success', fullPayload);
      
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
