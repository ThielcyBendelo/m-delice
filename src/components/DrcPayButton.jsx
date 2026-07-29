import React, { useState } from 'react';
import { motion } from 'framer-motion';
import paymentGateway from '../services/paymentGateway';
import notificationService from '../services/notificationService';
import { FaMobileAlt, FaShieldAlt, FaSpinner } from 'react-icons/fa';

/**
 * Bouton transactionnel DrcPay pour le Mobile Money (CinetPay)
 * @param {Object} pack - Le pack d'assurance sélectionné
 * @param {Object} beneficiary - Les données du bénéficiaire local en RDC
 * @param {Function} onPaymentSuccess - Callback exécuté après validation de l'opérateur
 */
export default function DrcPayButton({ pack, beneficiary, onPaymentSuccess }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleMobileMoneyPayment = () => {
    // 1. Validation de sécurité : Empêcher de valider sans bénéficiaire
    if (!beneficiary || !beneficiary.beneficiaryPhone) {
      notificationService.error("Veuillez d'abord compléter l'identité du bénéficiaire en RDC.");
      return;
    }

    setIsLoading(true);

    try {
      notificationService.info("Ouverture du guichet unique Mobile Money (M-Pesa, Orange, Airtel)...");

      // 2. Déclenchement de la passerelle Fintech
      paymentGateway.initializeCinetPayMobileMoney(pack, beneficiary, async (paymentData) => {
        try {
          // Étape de secours : Écriture finale dans SQL Server via l'API globale
          const registrationPayload = {
            diasporaUser: {
              lastName: "Acheteur",
              firstName: "Diaspora",
              email: "client@drcassurances.com",
              country: "Étranger"
            },
            beneficiary: {
              lastName: beneficiary.beneficiaryLastName,
              firstName: beneficiary.beneficiaryFirstName,
              phone: beneficiary.beneficiaryPhone,
              city: beneficiary.beneficiaryCity
            },
            productID: pack.id || 1,
            paymentDetails: {
              gateway: 'CinetPay_MobileMoney',
              reference: paymentData.operator_id || paymentData.cpm_trans_id || `DRC-MM-${Date.now()}`,
              amount: pack.price,
              currency: 'USD',
              exchangeRate: 1.0
            }
          };

          const dbResult = await paymentGateway.verifyAndRegisterPolicyInDatabase(registrationPayload);

          if (dbResult.success) {
            if (onPaymentSuccess) {
              onPaymentSuccess(dbResult);
            }
          } else {
            notificationService.error(dbResult.error || "Erreur d'enregistrement du contrat.");
          }
        } catch (dbError) {
          console.error("Erreur post-paiement:", dbError);
        } finally {
          setIsLoading(false);
        }
      });

    } catch (error) {
      console.error("Erreur lors de l'appel DrcPayButton:", error);
      notificationService.error("Le traitement du paiement a échoué.");
      setIsLoading(false);
    } finally {
      // Sécurité : On débloque le bouton après quelques secondes si la modale ne s'ouvre pas
      setTimeout(() => setIsLoading(false), 5000);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      whileTap={{ scale: isLoading ? 1 : 0.98 }}
      type="button"
      disabled={isLoading}
      onClick={handleMobileMoneyPayment}
      className="w-full py-4 bg-[#FDD100] hover:bg-[#E5BD00] text-slate-900 rounded-xl font-black text-sm uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 border-b-4 border-[#C4A200] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <FaSpinner className="animate-spin text-slate-900" size={16} />
          <span>Connexion réseau en cours...</span>
        </>
      ) : (
        <>
          <FaMobileAlt size={16} />
          <span>Payer via Mobile Money RDC</span>
          <FaShieldAlt className="ml-auto text-slate-800/40" size={14} />
        </>
      )}
    </motion.button>
  );
}
