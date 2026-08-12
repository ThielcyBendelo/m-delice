import secureAPIClient from '../utils/secureAPIClient.js';
import authService from './authService.js';

const policyService = {
  mapBeneficiary(beneficiary) {
    return {
      lastName: beneficiary.beneficiaryLastName || beneficiary.lastName,
      firstName: beneficiary.beneficiaryFirstName || beneficiary.firstName,
      phone: beneficiary.beneficiaryPhone || beneficiary.phone,
      city: beneficiary.beneficiaryCity || beneficiary.city || null,
      address: beneficiary.beneficiaryAddress || beneficiary.address || null,
      nationalID:
        beneficiary.beneficiaryNationalID ||
        beneficiary.nationalID ||
        beneficiary.nationalId ||
        null,
    };
  },

  mapProduct(productDetails) {
    const price = parseFloat(productDetails.price);
    return {
      branch: productDetails.branch || 'Santé',
      coverageLevel: productDetails.coverageLevel || productDetails.level || 'Confort',
      price,
      name: productDetails.name || null,
    };
  },

  async purchaseWithPaymentFlow(beneficiary, productDetails, options = {}) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        return { success: false, error: "Vous devez être authentifié pour émettre une police d'assurance." };
      }
      if (!authService.isLoggedIn()) {
        return { success: false, error: 'Session expirée. Reconnectez-vous.' };
      }

      const gateway =
        options.gateway ||
        (options.paymentMethod === 'mobile_money' ? 'CinetPay_MobileMoney' : 'simulation');

      const payload = {
        beneficiary: this.mapBeneficiary(beneficiary),
        productDetails: this.mapProduct(productDetails),
        gateway,
        currency: options.currency || 'USD',
        quoteNumber: options.quoteNumber || undefined,
      };

      if (!payload.beneficiary.lastName || !payload.beneficiary.firstName || !payload.beneficiary.phone) {
        return { success: false, error: 'Bénéficiaire incomplet (nom, prénom, téléphone).' };
      }
      if (!payload.productDetails.price || payload.productDetails.price <= 0) {
        return { success: false, error: 'Montant du pack invalide.' };
      }

      const intentRes = await secureAPIClient.post('/payment/intent', payload);
      const intent = intentRes.data?.data || intentRes.data;
      if (!intent?.success && !intent?.transactionReference) {
        return {
          success: false,
          error: intent?.message || "Échec création de l'intention de paiement.",
        };
      }

      const confirmRes = await secureAPIClient.post('/payment/confirm', {
        transactionReference: intent.transactionReference,
        providerPayload: {
          source: 'checkout_ui',
          gateway,
          paymentMethod: options.paymentMethod || 'card',
          mobileOperator: options.mobileOperator || null,
          simulation: intent.simulation === true,
        },
      });
      const confirmed = confirmRes.data?.data || confirmRes.data;
      if (!confirmed?.success) {
        return {
          success: false,
          error: confirmed?.message || 'Paiement non confirmé.',
          transactionReference: intent.transactionReference,
          policyNumber: intent.policyNumber,
        };
      }

      return {
        success: true,
        policyNumber: confirmed.policyNumber || intent.policyNumber,
        transactionReference: intent.transactionReference,
        totalUSD: intent.totalUSD,
        taxArcaUSD: intent.taxArcaUSD,
        amountUSD: intent.amountUSD,
        simulation: intent.simulation === true,
        message: confirmed.message || 'Police activée.',
      };
    } catch (error) {
      console.error('purchaseWithPaymentFlow:', error);
      return {
        success: false,
        error: error.userMessage || error.message || 'Impossible de finaliser le paiement / la police.',
      };
    }
  },

  async purchasePolicy(beneficiary, productDetails, payment) {
    if (!payment?.forceLegacyCheckout) {
      return this.purchaseWithPaymentFlow(beneficiary, productDetails, {
        gateway: payment?.gateway,
        currency: payment?.currency,
        paymentMethod: payment?.paymentMethod,
        mobileOperator: payment?.mobileOperator,
      });
    }

    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        return { success: false, error: "Vous devez être authentifié pour émettre une police d'assurance." };
      }

      const payload = {
        buyerID: currentUser.id,
        beneficiary: this.mapBeneficiary(beneficiary),
        productDetails: this.mapProduct(productDetails),
        payment: {
          transactionReference: payment.transactionReference || ('TX-' + Date.now()),
          gateway: payment.gateway || 'legacy_checkout',
          currency: payment.currency || 'USD',
          exchangeRate: payment.exchangeRate || 1,
        },
      };

      const response = await secureAPIClient.post('/policy/checkout', payload);
      if (response?.data?.success) {
        return {
          success: true,
          policyNumber: response.data.policyNumber,
          message: "Fiche d'assuré synchronisée et quittance ARCA générée avec succès.",
        };
      }
      return { success: false, error: response?.data?.message || "Le régulateur a rejeté l'émission du certificat." };
    } catch (error) {
      console.error('purchasePolicy legacy:', error);
      return {
        success: false,
        error: error.userMessage || error.message || "Impossible d'enregistrer la police.",
      };
    }
  },

  async checkPolicyStatus(policyNumber) {
    if (!policyNumber || !String(policyNumber).trim()) {
      return { success: false, error: "Numéro de police d'assurance requis." };
    }
    try {
      const response = await secureAPIClient.get('/policy/verify/' + encodeURIComponent(String(policyNumber).trim()));
      const data = response.data?.data || response.data;
      if (data?.success) {
        return {
          success: true,
          valid: data.valid,
          isActive: data.valid,
          policy: data.policy,
          branch: data.policy?.InsuranceBranch || data.branch,
          coverage: data.policy?.CoverageLevel || data.coverage,
          remainingLimit: data.policy?.RemainingLimitUSD || data.remainingLimit,
          beneficiary: data.policy
            ? { firstName: data.policy.FirstName, lastName: data.policy.LastName, city: data.policy.City }
            : data.beneficiary,
        };
      }
      return { success: false, error: data?.message || 'Aucun contrat valide trouvé.' };
    } catch (error) {
      return {
        success: false,
        error: error.userMessage || error.message || 'Contrat introuvable ou expiré.',
      };
    }
  },
};

export default policyService;
