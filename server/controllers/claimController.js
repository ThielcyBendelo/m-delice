import { sql, poolPromise } from '../config/dbConfig.js';

const claimController = {
    
    /**
     * 🛡️ ENREGISTREMENT D'UN SINISTRE ET CONTRÔLE ANTI-FRAUDE
     * Écrit le sinistre en base de données et met à jour le plafond glissant de l'assuré
     */
    async fileNewClaim(req, res) {
        const { policyNumber, eventDate, description, gpsLocation, estimatedCost, documentPath } = req.body;

        if (!policyNumber || !description || !gpsLocation || !estimatedCost || !documentPath) {
            return res.status(400).json({ success: false, message: "Tous les justificatifs et contrôles de sécurité sont obligatoires." });
        }

        try {
            const pool = await poolPromise;

            // 1. Récupération du contrat et vérification du solde restant
            const policyCheck = await pool.request()
                .input('PolicyNumber', sql.NVarChar, policyNumber.trim())
                .query('SELECT PolicyID, RemainingLimitUSD, IsActive, EndDate FROM InsurancePolicies WHERE PolicyNumber = @PolicyNumber');

            if (policyCheck.recordset.length === 0) {
                return res.status(404).json({ success: false, message: "Police d'assurance introuvable." });
            }

            const policy = policyCheck.recordset[0];
            const cost = parseFloat(estimatedCost);

            // 2. Contrôles de validité du contrat aux normes ARCA
            if (!policy.IsActive || new Date(policy.EndDate) < new Date()) {
                return res.status(400).json({ success: false, message: "Ce contrat d'assurance a expiré ou est suspendu." });
            }

            if (policy.RemainingLimitUSD < cost) {
                return res.status(400).json({ success: false, message: `Plafond insuffisant. Solde disponible : ${policy.RemainingLimitUSD} USD.` });
            }

            // 3. Lancement d'une transaction d'écriture et déduction du solde
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                const claimNumber = `DRC-SIN-${Date.now().toString().slice(-5)}`;

                // A. Insertion du sinistre
                const claimRequest = new sql.Request(transaction);
                await claimRequest
                    .input('ClaimNumber', sql.NVarChar, claimNumber)
                    .input('PolicyID', sql.Int, policy.PolicyID)
                    .input('EventDate', sql.DateTime, eventDate || new Date())
                    .input('Description', sql.NVarChar, description.trim())
                    .input('Gps', sql.NVarChar, gpsLocation)
                    .input('Cost', sql.Decimal(10, 2), cost)
                    .input('Doc', sql.NVarChar, documentPath)
                    .query(`
                        INSERT INTO Claims (ClaimNumber, PolicyID, EventDate, ClaimDescription, GpsLocation, EstimatedCostUSD, DocumentPath, ClaimStatus)
                        VALUES (@ClaimNumber, @PolicyID, @EventDate, @Description, @Gps, @Cost, @Doc, 'Approuvé')
                    `);

                // B. Déduction automatique du plafond de l'assuré dans la table des contrats
                const updatePolicyRequest = new sql.Request(transaction);
                await updatePolicyRequest
                    .input('PolicyID', sql.Int, policy.PolicyID)
                    .input('Cost', sql.Decimal(10, 2), cost)
                    .query(`
                        UPDATE InsurancePolicies 
                        SET RemainingLimitUSD = RemainingLimitUSD - @Cost 
                        WHERE PolicyID = @PolicyID
                    `);

                await transaction.commit();

                return res.status(201).json({
                    success: true,
                    message: "Sinistre traité et validé en Tiers-Payant.",
                    claimNumber,
                    remainingLimit: `${(policy.RemainingLimitUSD - cost).toFixed(2)} USD`
                });

            } catch (innerError) {
                await transaction.rollback();
                throw innerError;
            }

        } catch (error) {
            console.error("Erreur SQL Server lors du traitement du sinistre :", error);
            return res.status(500).json({ success: false, message: "Erreur technique lors de la validation de la prise en charge." });
        }
    }
};

export default claimController;
