import secureAPIClient from '../utils/secureAPIClient.js';
import authService from './authService.js';

/**
 * 🛡️ SERVICE CLIENT DES POLICES D'ASSURANCE & TIERS-PAYANT
 * Gère les souscriptions de la diaspora et les vérifications des hôpitaux en RDC
 */
const policyService = {

  /**
   * 1. SOUSCRIRE UN CONTRAT ET ÉMETTRE LA QUITTANCE (Flux Transfrontalier)
   * @param {Object} beneficiary - Données de l'assuré local (+243...)
   * @param {Object} productDetails - Formule, Branche (Santé, Auto) et Tarif en USD
   * @param {Object} payment - Référence de transaction Stripe/CinetPay et devise
   */
  async purchasePolicy(beneficiary, productDetails, payment) {
    try {
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser || !currentUser.id) {
        return { success: false, error: "Vous devez être authentifié pour émettre une police d'assurance." };
      }

      // Recomposition de la charge utile (Payload) conforme à policyController.js
      const payload = {
        buyerID: currentUser.id,
        beneficiary: {
          lastName: beneficiary.beneficiaryLastName,
          firstName: beneficiary.beneficiaryFirstName,
          phone: beneficiary.beneficiaryPhone,
          city: beneficiary.beneficiaryCity,
          address: beneficiary.beneficiaryAddress || 'Non spécifiée',
          nationalID: beneficiary.beneficiaryNationalID || null
        },
        productDetails: {
          branch: productDetails.branch || 'Santé',
          coverageLevel: productDetails.coverageLevel || 'Confort',
          price: productDetails.price
        },
        payment: {
          transactionReference: payment.transactionReference || `TX-${Date.now()}`,
          gateway: payment.gateway || 'Stripe_Card',
          currency: payment.currency || 'USD',
          exchangeRate: payment.exchangeRate || 1
        }
      };

      // Appel sécurisé vers notre routeur unique du serveur backend (Port 5000)
      const response = await secureAPIClient.post('/policy/checkout', payload);

      if (response && response.data && response.data.success) {
        return {
          success: true,
          policyNumber: response.data.policyNumber,
          message: "Fiche d'assuré synchronisée et quittance ARCA générée avec succès."
        };
      }

      return { success: false, error: "Le régulateur a rejeté l'émission du certificat." };
    } catch (error) {
      console.error("❌ Échec d'émission du contrat d'assurance :", error);
      return {
        success: false,
        error: error.userMessage || "Impossible d'enregistrer la police. Vérifiez la connexion de la base de données SQL Server."
      };
    }
  },

  /**
   * 🔍 VERIFICATION DE VALIDITÉ TIERS-PAYANT (Appelée par les Cliniques/Hôpitaux en RDC)
   * @param {string} policyNumber - Numéro officiel de contrat (ex: DRC-2026-89415)
   */
  async checkPolicyStatus(policyNumber) {
    if (!policyNumber || !policyNumber.trim()) {
      return { success: false, error: "Numéro de police d'assurance requis." };
    }

    try {
      // Appel réseau GET vers l'endpoint d'audit de notre serveur Node.js
      const response = await secureAPIClient.get(`/policy/verify/${policyNumber.trim()}`);

      if (response && response.data && response.data.success) {
        return {
          success: true,
          isActive: response.data.isActive,
          branch: response.data.branch,
          coverage: response.data.coverage,
          remainingLimit: response.data.remainingLimit,
          beneficiary: response.data.beneficiary
        };
      }
      return { success: false, error: "Aucun contrat valide trouvé." };
    } catch (error) {
      console.error(`❌ Échec de vérification du contrat ${policyNumber} :`, error);
      return {
        success: false,
        error: error.userMessage || "Contrat introuvable ou expiré."
      };
    }
  }
};

export default policyService;
