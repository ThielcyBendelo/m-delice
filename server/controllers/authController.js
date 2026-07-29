import { sql, poolPromise } from '../config/dbConfig.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Contrôleur de gestion des accès et de la sécurité d'authentification - DRC Assurances
 */
const authController = {

    /**
     * 1. INSCRIPTION DES COMPTES (Diaspora ou Partenaires)
     * Enregistre un nouvel utilisateur dans la table Users de SQL Server
     */
    async register(req, res) {
        const { lastName, firstName, email, password, role, country } = req.body;

        // Validation stricte des données requises
        if (!lastName || !firstName || !email || !password || !role) {
            return res.status(400).json({ success: false, message: "Veuillez remplir tous les champs obligatoires." });
        }

        try {
            const pool = await poolPromise;

            // Vérifier si l'adresse email existe déjà dans SQL Server
            const userCheck = await pool.request()
                .input('Email', sql.NVarChar, email.trim())
                .query('SELECT UserID FROM Users WHERE Email = @Email');

            if (userCheck.recordset.length > 0) {
                return res.status(400).json({ success: false, message: "Cette adresse email est déjà enregistrée." });
            }

            // Sécurisation du mot de passe (Hachage cryptographique)
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Insertion sécurisée de l'assuré dans la base de données
            await pool.request()
                .input('LastName', sql.NVarChar, lastName.trim())
                .input('FirstName', sql.NVarChar, firstName.trim())
                .input('Email', sql.NVarChar, email.trim())
                .input('PasswordHash', sql.NVarChar, hashedPassword)
                .input('UserRole', sql.NVarChar, role)
                .input('Country', sql.NVarChar, country || 'France')
                .query(`
                    INSERT INTO Users (LastName, FirstName, Email, PasswordHash, UserRole, CountryOfResidence)
                    VALUES (@LastName, @FirstName, @Email, @PasswordHash, @UserRole, @Country)
                `);

            return res.status(201).json({ success: true, message: "Compte créé avec succès." });

        } catch (error) {
            console.error("Erreur SQL Server lors de l'inscription :", error);
            return res.status(500).json({ success: false, message: "Erreur technique lors de l'écriture en base de données." });
        }
    },

    /**
     * 2. CONNEXION SÉCURISÉE (Fintech & ARCA)
     * Vérifie les identifiants et émet un jeton d'accès JWT valide
     */
    async login(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Veuillez saisir votre identifiant et votre mot de passe." });
        }

        try {
            const pool = await poolPromise;

            // Recherche de l'utilisateur dans SQL Server
            const result = await pool.request()
                .input('Email', sql.NVarChar, email.trim())
                .query('SELECT * FROM Users WHERE Email = @Email');

            if (result.recordset.length === 0) {
                return res.status(401).json({ success: false, message: "Identifiants incorrects ou compte introuvable." });
            }

            // Récupération de la première ligne d'enregistrement SQL
            const user = result.recordset[0];

            // Vérification et comparaison du mot de passe haché
            const isMatch = await bcrypt.compare(password, user.PasswordHash);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: "Identifiants incorrects ou mot de passe invalide." });
            }

            // Génération du jeton JWT crypté avec son rôle pour la Navbar/Routeur
            const token = jwt.sign(
                { id: user.UserID, role: user.UserRole },
                process.env.JWT_SECRET,
                { expiresIn: '24h' } // Session valide 24 heures aux normes ARCA
            );

            return res.status(200).json({
                success: true,
                token,
                user: {
                    id: user.UserID,
                    firstName: user.FirstName,
                    lastName: user.LastName,
                    email: user.Email,
                    role: user.UserRole,
                    country: user.CountryOfResidence
                }
            });

        } catch (error) {
            console.error("Erreur SQL Server lors de l'authentification :", error);
            return res.status(500).json({ success: false, message: "Erreur de communication avec le serveur d'authentification." });
        }
    }
};

export default authController;
