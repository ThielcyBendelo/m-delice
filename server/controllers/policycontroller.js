import { sql, poolPromise } from '../config/dbConfig.js';

const policyController = {
    // Émission d'une nouvelle police d'assurance après paiement
    async checkoutAndIssuePolicy(req, res) {
        const { buyerID, beneficiary, productDetails, payment } = req.body;
        if (!buyerID || !beneficiary || !productDetails || !payment) {
            return res.status(400).json({ success: false, message: "Données incomplètes." });
        }
        try {
            const pool = await poolPromise;
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // Étape A : Bénéficiaire
                const bResult = await new sql.Request(transaction)
                    .input('LastName', sql.NVarChar, beneficiary.lastName.trim())
                    .input('FirstName', sql.NVarChar, beneficiary.firstName.trim())
                    .input('Phone', sql.NVarChar, beneficiary.phone.trim())
                    .input('City', sql.NVarChar, beneficiary.city)
                    .input('Address', sql.NVarChar, beneficiary.address.trim())
                    .input('NationalID', sql.NVarChar, beneficiary.nationalID || null)
                    .query(`INSERT INTO Beneficiaries (LastName, FirstName, WhatsAppPhone, City, HomeAddress, NationalID)
                            OUTPUT INSERTED.BeneficiaryID VALUES (@LastName, @FirstName, @Phone, @City, @Address, @NationalID)`);

                const beneficiaryID = bResult.recordset[0].BeneficiaryID;
                const policyNumber = `DRC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
                const annualLimitUSD = productDetails.coverageLevel.toLowerCase() === 'premium' ? 7500.00 : 3500.00;
                const endDate = new Date();
                endDate.setFullYear(endDate.getFullYear() + 1);

                // Étape B : Contrat
                const pResult = await new sql.Request(transaction)
                    .input('PolicyNumber', sql.NVarChar, policyNumber)
                    .input('BuyerID', sql.Int, buyerID)
                    .input('BeneficiaryID', sql.Int, beneficiaryID)
                    .input('Branch', sql.NVarChar, productDetails.branch)
                    .input('Level', sql.NVarChar, productDetails.coverageLevel)
                    .input('Limit', sql.Decimal(10, 2), annualLimitUSD)
                    .input('Start', sql.DateTime, new Date())
                    .input('End', sql.DateTime, endDate)
                    .query(`INSERT INTO InsurancePolicies (PolicyNumber, BuyerID, BeneficiaryID, InsuranceBranch, CoverageLevel, AnnualLimitUSD, RemainingLimitUSD, StartDate, EndDate)
                            OUTPUT INSERTED.PolicyID VALUES (@PolicyNumber, @BuyerID, @BeneficiaryID, @Branch, @Level, @Limit, @Limit, @Start, @End)`);

                const policyID = pResult.recordset[0].PolicyID;
                const amountUSD = parseFloat(productDetails.price);
                const taxUSD = amountUSD * 0.10;

                // Étape C : Paiement
                await new sql.Request(transaction)
                    .input('Tx', sql.NVarChar, payment.transactionReference)
                    .input('PID', sql.Int, policyID)
                    .input('Gateway', sql.NVarChar, payment.gateway)
                    .input('Amt', sql.Decimal(10, 2), amountUSD)
                    .input('Tax', sql.Decimal(10, 2), taxUSD)
                    .input('Total', sql.Decimal(10, 2), amountUSD + taxUSD)
                    .input('Cur', sql.NVarChar, payment.currency.toUpperCase())
                    .query(`INSERT INTO Payments (TransactionReference, PolicyID, GatewayUsed, AmountUSD, TaxArcaUSD, TotalPaidUSD, CurrencyReceived)
                            VALUES (@Tx, @PID, @Gateway, @Amt, @Tax, @Total, @Cur)`);

                await transaction.commit();
                return res.status(201).json({ success: true, policyNumber });
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (error) {
            console.error("Erreur SQL Policy:", error);
            return res.status(500).json({ success: false, message: "Erreur serveur." });
        }
    },

    // Vérification de validité d'une police pour l'hôpital
    async verifyPolicyStatus(req, res) {
        const { policyNumber } = req.params;
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('PolicyNumber', sql.NVarChar, policyNumber.trim())
                .query(`SELECT p.*, b.FirstName, b.LastName FROM InsurancePolicies p 
                        JOIN Beneficiaries b ON p.BeneficiaryID = b.BeneficiaryID WHERE p.PolicyNumber = @PolicyNumber`);

            if (result.recordset.length === 0) return res.status(404).json({ success: false, message: "Contrat introuvable." });
            return res.status(200).json({ success: true, policy: result.recordset[0] });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Erreur serveur." });
        }
    }
};

export default policyController;
