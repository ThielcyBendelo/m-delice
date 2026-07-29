import secureAPIClient from '../utils/secureAPIClient.js';

/**
 * 🛡️ SERVICE CLIENT DE TELE-DECLARATION DES SINISTRES
 * Enregistrement des sinistres et mise à jour automatique des soldes de couverture
 */
const claimService = {

  /**
   * ENREGISTRER UN NOUVEAU SINISTRE (Tiers-Payant Hôpital / Garage RDC)
   * @param {Object} claimData - Informations du sinistre (Police, description, coût, GPS, ordonnance)
   */
  async fileClaim(claimData) {
    try {
      // Recomposition du payload attendu par claimController.js
      const payload = {
        policyNumber: claimData.policyNumber,
        eventDate: claimData.eventDate || new Date(),
        description: claimData.description,
        gpsLocation: claimData.gpsLocation || '0.0000,0.0000', // Coordonnées de l'établissement
        estimatedCost: claimData.estimatedCost,
        documentPath: claimData.documentPath || 'https://drcassurances.com' // Ordonnance médicale/Constat
      };

      // Appel sécurisé vers la branche unique du serveur backend
      const response = await secureAPIClient.post('/claim/file-claim', payload);

      if (response && response.data && response.data.success) {
        return {
          success: true,
          claimNumber: response.data.claimNumber,
          remainingLimit: response.data.remainingLimit,
          message: "Prise en charge validée en Tiers-Payant. Le solde du contrat a été ajusté."
        };
      }

      return { success: false, error: "Le traitement automatique du sinistre a été rejeté." };
    } catch (error) {
      console.error("❌ Échec de télé-déclaration du sinistre :", error);
      return {
        success: false,
        error: error.userMessage || "Validation impossible. Le coût dépasse le plafond annuel disponible."
      };
    }
  }
};

export default claimService;
