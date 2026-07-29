import secureAPIClient from '../utils/secureAPIClient';
import notificationService from './notificationService';

/**
 * Service de messagerie omnicanale (WhatsApp & SMS) pour DRC Assurances
 */
const whatsappSmsService = {

  /**
   * Déclenche l'envoi d'un message WhatsApp officiel via l'API sécurisée du Back-end (Twilio / Meta API)
   * @param {string} toPhone - Numéro du bénéficiaire local au format international (ex: +243810000000)
   * @param {string} beneficiaryName - Prénom et Nom du bénéficiaire en RDC
   * @param {string} buyerName - Prénom et Nom de l'acheteur de la diaspora
   * @param {string} policyNumber - Numéro unique de la police d'assurance généré dans SQL Server
   * @returns {Promise<Object>} Résultat de l'envoi (success: true/false)
   */
  async sendPolicyNotification(toPhone, beneficiaryName, buyerName, policyNumber) {
    try {
      // Nettoyage de sécurité élémentaire sur le numéro de téléphone
      const formattedPhone = toPhone.trim().replace(/\s+/g, '');

      // Appel sécurisé vers votre route API s'exécutant côté serveur (Node.js/Next.js)
      const response = await secureAPIClient.post('/api/notification/send-whatsapp', {
        to: formattedPhone,
        beneficiaryName,
        buyerName,
        policyNumber
      });

      if (response.data && response.data.success) {
        console.log(`[WhatsApp] Notification envoyée avec succès au numéro ${formattedPhone}`);
        return { success: true, messageId: response.data.messageId };
      }
      
      throw new Error(response.data.message || "Le serveur de messagerie n'a pas renvoyé de confirmation.");
    } catch (error) {
      console.error("Échec du service d'envoi WhatsApp/SMS:", error);
      
      // Notification visuelle de secours pour l'utilisateur sur le Front-end
      if (notificationService?.error) {
        notificationService.error("Le message WhatsApp automatique n'a pas pu être acheminé, mais le contrat est bien validé.");
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || "Erreur de liaison avec l'infrastructure réseau." 
      };
    }
  },

  /**
   * Envoi d'un SMS classique de secours si le bénéficiaire n'a pas de connexion Internet/WhatsApp active
   * @param {string} toPhone - Numéro local RDC
   * @param {string} text - Contenu brut du SMS
   */
  async sendEmergencySMS(toPhone, text) {
    try {
      const response = await secureAPIClient.post('/api/notification/send-sms', {
        to: toPhone.trim().replace(/\s+/g, ''),
        message: text
      });
      return response.data && response.data.success;
    } catch (error) {
      console.error("Échec d'envoi du SMS de secours:", error);
      return false;
    }
  }
};

export default whatsappSmsService;
