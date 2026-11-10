import { sql, poolPromise } from '../config/dbConfig.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import auditService from '../services/auditService.js';
import { getPhoneVerificationService } from '../services/phoneVerificationService.js';
import notificationService from '../services/notificationService.js';
import { hashSecurityToken } from '../middleware/securityMiddleware.js';

const AVATAR_MAX_BYTES = 1.5 * 1024 * 1024;
const AVATAR_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET manquant');
  return jwt.sign(
    { id: user.UserID, role: user.UserRole, email: user.Email },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

function publicUser(user) {
  return {
    id: user.UserID,
    firstName: user.FirstName,
    lastName: user.LastName,
    email: user.Email,
    role: user.UserRole,
    country: user.CountryOfResidence,
    phone: user.Phone || null,
    authProvider: user.AuthProvider || 'local',
    avatarUrl: user.AvatarUrl || null,
    isActive: user.IsActive !== false && user.IsActive !== 0,
    phoneVerified: user.PhoneVerifiedAt != null || user.PhoneVerificationRequired !== true,
  };
}

function cleanText(value, max = 120) {
  if (value == null) return null;
  const text = String(value).trim().replace(/\s+/g, ' ');
  if (!text) return null;
  return text.slice(0, max);
}

function isSafeHttpUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function isTransientAuthError(error) {
  const message = String(error?.message || '').toLowerCase();
  return [
    'login failed',
    'econnrefused',
    'etimedout',
    'timeout',
    'ecanceled',
    'esocket',
    'server is not currently able to handle this request',
    'the connection is broken',
    'jwt_secret manquant',
  ].some((token) => message.includes(token));
}

function parseImageDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const ext = AVATAR_MIME[mime];
  if (!ext) return null;
  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!buffer.length || buffer.length > AVATAR_MAX_BYTES) return null;
  return { ext, buffer, mime };
}

function validPassword(password) {
  const value = String(password || '');
  return value.length >= 8 && value.length <= 128
    && /[A-Z]/.test(value)
    && /[a-z]/.test(value)
    && /\d/.test(value);
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim())
    && String(email || '').length <= 255;
}

function removeLocalAvatarFile(avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== 'string') return;
  if (!avatarUrl.startsWith('/uploads/avatars/')) return;
  const fileName = path.basename(avatarUrl);
  if (!fileName || fileName.includes('..')) return;
  const absolute = path.join(process.cwd(), 'server', 'uploads', 'avatars', fileName);
  try {
    if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
  } catch {
    // best effort
  }
}

async function verifyGoogleIdToken(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const err = new Error('GOOGLE_CLIENT_ID non configure sur le serveur.');
    err.code = 'CONFIG';
    throw err;
  }

  const { OAuth2Client } = await import('google-auth-library');
  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email || !payload.sub) {
    const err = new Error('Jeton Google invalide.');
    err.code = 'INVALID';
    throw err;
  }
  if (!validEmail(payload.email)) {
    const err = new Error('L adresse email Google n est pas valide.');
    err.code = 'INVALID_EMAIL';
    throw err;
  }
  if (payload.email_verified !== true) {
    const err = new Error('Email Google non verifie.');
    err.code = 'UNVERIFIED';
    throw err;
  }
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)) {
    const err = new Error('Emetteur du jeton Google invalide.');
    err.code = 'INVALID_ISSUER';
    throw err;
  }

  const allowedDomains = String(process.env.GOOGLE_ALLOWED_DOMAINS || '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
  if (allowedDomains.length) {
    const emailDomain = String(payload.email).split('@').pop().toLowerCase();
    if (!allowedDomains.includes(emailDomain)) {
      const err = new Error('Ce domaine Google n est pas autorise.');
      err.code = 'DOMAIN_NOT_ALLOWED';
      throw err;
    }
  }
  return payload;
}

const authController = {
  async register(req, res) {
    const { lastName, firstName, email, password, role, country, phone, phoneCountryCode, phoneCountryIso } = req.body || {};

    if (!lastName || !firstName || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Nom, prenom, email, mot de passe et telephone sont obligatoires.' });
    }
    if (!validEmail(email)) {
      return res.status(400).json({ success: false, message: 'Saisissez une adresse email valide, par exemple nom@domaine.com.' });
    }
    if (!validPassword(password)) {
      return res.status(400).json({ success: false, message: 'Mot de passe : 8 caractères, une majuscule, une minuscule et un chiffre minimum.' });
    }
    const parsedPhone = parsePhoneNumberFromString(String(phone || ''), String(phoneCountryIso || '').toUpperCase());
    if (!parsedPhone || !parsedPhone.isValid() || String(parsedPhone.countryCallingCode) !== String(phoneCountryCode || '')) {
      return res.status(400).json({ success: false, message: 'Le numero de telephone ne correspond pas au pays et a son indicatif.' });
    }
    const normalizedPhone = parsedPhone.number;

    const safeRole = ['Diaspora', 'Client', 'Partner', 'Hospital'].includes(role) ? role : 'Diaspora';

    try {
      const pool = await poolPromise;

      const userCheck = await pool.request()
        .input('Email', sql.NVarChar, email.trim().toLowerCase())
        .query('SELECT UserID FROM Users WHERE Email = @Email');

      if (userCheck.recordset.length > 0) {
        return res.status(400).json({ success: false, message: 'Cette adresse email est deja enregistree.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const inserted = await pool.request()
        .input('LastName', sql.NVarChar, lastName.trim())
        .input('FirstName', sql.NVarChar, firstName.trim())
        .input('Email', sql.NVarChar, email.trim().toLowerCase())
        .input('PasswordHash', sql.NVarChar, hashedPassword)
        .input('UserRole', sql.NVarChar, safeRole)
        .input('Country', sql.NVarChar, country || 'France')
        .input('Phone', sql.NVarChar, normalizedPhone)
        .input('PhoneCountryCode', sql.NVarChar, parsedPhone.countryCallingCode)
        .query(`
          INSERT INTO Users (LastName, FirstName, Email, PasswordHash, UserRole, CountryOfResidence, Phone, PhoneCountryCode, AuthProvider, PhoneVerificationRequired)
          OUTPUT INSERTED.*
          VALUES (@LastName, @FirstName, @Email, @PasswordHash, @UserRole, @Country, @Phone, @PhoneCountryCode, 'local', 1)
        `);

      const user = inserted.recordset[0];
      const phoneVerification = await getPhoneVerificationService().createChallenge(user.UserID, user.Phone, { callingCode: phoneCountryCode });
      await auditService.log({
        actorUserId: user.UserID,
        action: 'auth.register',
        entityType: 'user',
        entityId: user.UserID,
        ipAddress: req.ip,
      });
      await notificationService.notifyAuthRegistered({
        userId: user.UserID,
        email: user.Email,
        firstName: user.FirstName,
      });

      return res.status(201).json({
        success: true,
        message: 'Profil créé. Un code de vérification a été envoyé par SMS. Votre compte sera activé après validation des informations.',
        user: publicUser(user),
        phoneVerification: {
          challengeId: phoneVerification.challengeId,
          maskedPhone: phoneVerification.maskedPhone,
          expiresAt: phoneVerification.expiresAt,
        },
      });
    } catch (error) {
      console.error('register:', error);
      // Fallback si colonnes Google pas encore migrees
      if (String(error.message || '').includes('AuthProvider') || String(error.message || '').includes('Invalid column')) {
        try {
          const pool = await poolPromise;
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          const inserted = await pool.request()
            .input('LastName', sql.NVarChar, lastName.trim())
            .input('FirstName', sql.NVarChar, firstName.trim())
            .input('Email', sql.NVarChar, email.trim().toLowerCase())
            .input('PasswordHash', sql.NVarChar, hashedPassword)
            .input('UserRole', sql.NVarChar, safeRole)
            .input('Country', sql.NVarChar, country || 'France')
            .input('Phone', sql.NVarChar, phone || null)
            .query(`
              INSERT INTO Users (LastName, FirstName, Email, PasswordHash, UserRole, CountryOfResidence, Phone)
              OUTPUT INSERTED.*
              VALUES (@LastName, @FirstName, @Email, @PasswordHash, @UserRole, @Country, @Phone)
            `);
          return res.status(201).json({ success: true, message: 'Compte cree avec succes.', user: publicUser(inserted.recordset[0]) });
        } catch (e2) {
          console.error('register fallback:', e2);
        }
      }
      return res.status(500).json({ success: false, message: 'Erreur technique lors de l ecriture en base.' });
    }
  },

  async verifyPhone(req, res) {
    const userId = Number(req.body?.userId);
    const challengeId = req.body?.challengeId;
    const code = req.body?.code;
    if (!Number.isInteger(userId) || !challengeId || !code) {
      return res.status(400).json({ success: false, message: 'Identifiant utilisateur, challenge et code requis.' });
    }
    try {
      const result = await getPhoneVerificationService().verifyChallenge(userId, challengeId, code);
      if (!result.valid) return res.status(400).json({ success: false, message: 'Code SMS invalide, expire ou bloque.', reasonCode: result.reasonCode });
      return res.status(200).json({ success: true, message: 'Numero de telephone verifie.' });
    } catch (error) {
      console.error('verifyPhone:', error);
      return res.status(500).json({ success: false, message: 'Erreur lors de la verification du telephone.' });
    }
  },

  async resendPhoneVerification(req, res) {
    const userId = Number(req.body?.userId);
    if (!Number.isInteger(userId)) return res.status(400).json({ success: false, message: 'Identifiant utilisateur requis.' });
    try {
      const pool = await poolPromise;
      const result = await pool.request().input('UserID', sql.Int, userId).query('SELECT UserID, Phone FROM Users WHERE UserID = @UserID');
      const user = result.recordset[0];
      if (!user?.Phone) return res.status(404).json({ success: false, message: 'Numero de telephone introuvable.' });
      const phoneVerification = await getPhoneVerificationService().createChallenge(user.UserID, user.Phone);
      return res.status(200).json({ success: true, message: 'Nouveau code SMS envoye.', phoneVerification: { challengeId: phoneVerification.challengeId, maskedPhone: phoneVerification.maskedPhone, expiresAt: phoneVerification.expiresAt } });
    } catch (error) {
      console.error('resendPhoneVerification:', error);
      return res.status(400).json({ success: false, message: error.message || 'Impossible de renvoyer le code SMS.' });
    }
  },

  async login(req, res) {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Identifiant et mot de passe requis.' });
    }

    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('Email', sql.NVarChar, email.trim().toLowerCase())
        .query('SELECT * FROM Users WHERE Email = @Email');

      if (!result.recordset.length) {
        return res.status(401).json({ success: false, message: 'Identifiants incorrects ou compte introuvable.' });
      }

      const user = result.recordset[0];
      if (user.IsActive === false || user.IsActive === 0) {
        return res.status(403).json({ success: false, message: 'Compte desactive.' });
      }

      if (String(user.AuthProvider || 'local').toLowerCase() === 'google' && !user.PasswordHash) {
        return res.status(400).json({
          success: false,
          message: 'Ce compte utilise Google. Cliquez sur Continuer avec Google.',
        });
      }

      const isMatch = await bcrypt.compare(password, user.PasswordHash || '');
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Identifiants incorrects ou mot de passe invalide.' });
      }

      let token;
      try {
        token = signToken(user);
      } catch (tokenError) {
        console.error('login token:', tokenError);
        return res.status(503).json({
          success: false,
          message: 'Configuration d authentification incomplète sur le serveur.',
        });
      }

      await auditService.log({
        actorUserId: user.UserID,
        action: 'auth.login',
        entityType: 'user',
        entityId: user.UserID,
        ipAddress: req.ip,
      });
      await notificationService.notifyAuthLogin({
        userId: user.UserID,
        email: user.Email,
        firstName: user.FirstName,
        provider: 'email et mot de passe',
      });

      return res.status(200).json({
        success: true,
        token,
        user: publicUser(user),
      });
    } catch (error) {
      console.error('login:', error);

      const messageText = String(error?.message || '');
      const isSchemaMismatch = /Invalid column name|Invalid object name|does not exist|PasswordHash|AuthProvider/.test(messageText);

      if (isSchemaMismatch) {
        return res.status(503).json({
          success: false,
          message: 'La base de données n est pas synchronisée avec l application. Exécutez la migration de schéma puis redémarrez le serveur.',
        });
      }

      const status = isTransientAuthError(error) ? 503 : 500;
      const message = status === 503
        ? 'Service d authentification temporairement indisponible. Réessayez dans un instant.'
        : 'Erreur de communication avec le serveur d authentification.';
      return res.status(status).json({ success: false, message });
    }
  },

  /**
   * Connexion / inscription Google via ID token (GIS)
   * Body: { credential }  // JWT Google Identity Services
   */
  async google(req, res) {
    const credential = req.body?.credential || req.body?.idToken || req.body?.token;
    const phone = req.body?.phone;
    const phoneCountryCode = req.body?.phoneCountryCode;
    const phoneCountryIso = String(req.body?.phoneCountryIso || '').toUpperCase();
    if (!credential) {
      return res.status(400).json({ success: false, message: 'credential Google manquant.' });
    }

    try {
      const payload = await verifyGoogleIdToken(credential);
      const email = String(payload.email).toLowerCase();
      const googleId = payload.sub;
      const firstName = payload.given_name || (payload.name || 'Utilisateur').split(' ')[0] || 'Utilisateur';
      const lastName = payload.family_name || (payload.name || '').split(' ').slice(1).join(' ') || 'Google';
      const avatarUrl = payload.picture || null;

      const pool = await poolPromise;
      let phoneVerification = null;

      // 1) Lookup by GoogleSub
      let user = null;
      try {
        const byGoogle = await pool.request()
          .input('GoogleSub', sql.NVarChar, googleId)
          .query('SELECT * FROM Users WHERE GoogleSub = @GoogleSub');
        user = byGoogle.recordset[0] || null;
      } catch {
        // colonne absente avant migration
      }

      // 2) Lookup by email
      if (!user) {
        const byEmail = await pool.request()
          .input('Email', sql.NVarChar, email)
          .query('SELECT * FROM Users WHERE Email = @Email');
        user = byEmail.recordset[0] || null;
      }

      if (user) {
        if (user.IsActive === false || user.IsActive === 0) {
          return res.status(403).json({ success: false, message: 'Compte desactive.' });
        }
        if (user.PhoneVerificationRequired === true && !user.PhoneVerifiedAt) {
          return res.status(403).json({ success: false, message: 'Vérifiez votre numéro de téléphone par SMS avant de vous connecter.' });
        }
        // Link GoogleSub if missing
        try {
          await pool.request()
            .input('UserID', sql.Int, user.UserID)
            .input('GoogleSub', sql.NVarChar, googleId)
            .input('AvatarUrl', sql.NVarChar, avatarUrl)
            .query(`
              UPDATE Users
              SET GoogleSub = COALESCE(GoogleSub, @GoogleSub),
                  AvatarUrl = COALESCE(@AvatarUrl, AvatarUrl),
                  AuthProvider = CASE WHEN AuthProvider IS NULL OR AuthProvider = 'local' THEN AuthProvider ELSE AuthProvider END,
                  UpdatedAt = SYSUTCDATETIME()
              WHERE UserID = @UserID
            `);
          // Re-read
          const refreshed = await pool.request()
            .input('UserID', sql.Int, user.UserID)
            .query('SELECT * FROM Users WHERE UserID = @UserID');
          user = refreshed.recordset[0] || user;
        } catch (linkErr) {
          console.warn('google link columns:', linkErr.message);
        }
      } else {
        // Create user Google
        const parsedPhone = parsePhoneNumberFromString(String(phone || ''), phoneCountryIso);
        if (!parsedPhone || !parsedPhone.isValid() || String(parsedPhone.countryCallingCode) !== String(phoneCountryCode || '')) {
          return res.status(400).json({ success: false, message: 'Pour créer un compte Google, fournissez un numéro valide correspondant à son pays.' });
        }
        const randomPass = crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(randomPass, 10);
        try {
          const inserted = await pool.request()
            .input('LastName', sql.NVarChar, lastName)
            .input('FirstName', sql.NVarChar, firstName)
            .input('Email', sql.NVarChar, email)
            .input('PasswordHash', sql.NVarChar, hash)
            .input('UserRole', sql.NVarChar, 'Diaspora')
            .input('Country', sql.NVarChar, 'France')
            .input('Phone', sql.NVarChar, parsedPhone.number)
            .input('PhoneCountryCode', sql.NVarChar, parsedPhone.countryCallingCode)
            .input('GoogleSub', sql.NVarChar, googleId)
            .input('AvatarUrl', sql.NVarChar, avatarUrl)
            .query(`
              INSERT INTO Users
                (LastName, FirstName, Email, PasswordHash, UserRole, CountryOfResidence, Phone, PhoneCountryCode, PhoneVerificationRequired, AuthProvider, GoogleSub, AvatarUrl)
              OUTPUT INSERTED.*
              VALUES
                (@LastName, @FirstName, @Email, @PasswordHash, @UserRole, @Country, @Phone, @PhoneCountryCode, 1, 'google', @GoogleSub, @AvatarUrl)
            `);
          user = inserted.recordset[0];
              phoneVerification = await getPhoneVerificationService().createChallenge(user.UserID, user.Phone, { callingCode: parsedPhone.countryCallingCode });
        } catch (createErr) {
          // Fallback without google columns
          if (String(createErr.message || '').includes('Invalid column') || String(createErr.message || '').includes('AuthProvider')) {
            return res.status(503).json({ success: false, message: 'La vérification téléphone Google nécessite la migration de sécurité du compte. Contactez l administrateur.' });
          } else {
            throw createErr;
          }
        }
      }

      if (phoneVerification) {
        return res.status(202).json({
          success: true,
          requiresPhoneVerification: true,
          user: publicUser(user),
          phoneVerification: {
            challengeId: phoneVerification.challengeId,
            maskedPhone: phoneVerification.maskedPhone,
            expiresAt: phoneVerification.expiresAt,
          },
          message: 'Identité Google validée. Un code SMS est requis pour terminer la création du compte.',
        });
      }

      const token = signToken(user);
      await auditService.log({
        actorUserId: user.UserID,
        action: 'auth.google',
        entityType: 'user',
        entityId: user.UserID,
        ipAddress: req.ip,
      });
      await notificationService.notifyAuthLogin({
        userId: user.UserID,
        email: user.Email,
        firstName: user.FirstName,
        provider: 'Google',
      });

      return res.status(200).json({
        success: true,
        token,
        user: publicUser(user),
        message: 'Connexion Google reussie.',
      });
    } catch (error) {
      console.error('google auth:', error);
      if (error.code === 'CONFIG') {
        return res.status(503).json({ success: false, message: error.message });
      }
      if (error.code === 'UNVERIFIED' || error.code === 'INVALID_EMAIL') {
        return res.status(400).json({ success: false, message: 'Cette adresse Google ne peut pas être utilisée : elle doit être réelle et vérifiée par Google.' });
      }
      if (error.code === 'DOMAIN_NOT_ALLOWED') {
        return res.status(403).json({ success: false, message: 'Le domaine de cette adresse Google n est pas autorisé pour ESNAS.' });
      }
      return res.status(401).json({ success: false, message: 'Google n a pas pu valider cette identité. Réessayez avec un compte Google vérifié.' });
    }
  },

  async requestPasswordReset(req, res) {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const generic = { success: true, message: 'Si cette adresse existe, un lien de réinitialisation a été envoyé.' };
    if (!email || !email.includes('@') || email.length > 255) return res.status(200).json(generic);

    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('Email', sql.NVarChar(255), email)
        .query('SELECT TOP (1) UserID, Email, FirstName FROM Users WHERE Email = @Email AND IsActive = 1');
      const user = result.recordset[0];
      if (!user) return res.status(200).json(generic);

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashSecurityToken(rawToken);
      const tokenId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await pool.request()
        .input('UserID', sql.Int, user.UserID)
        .query('UPDATE PasswordResetTokens SET UsedAt = COALESCE(UsedAt, SYSUTCDATETIME()) WHERE UserID = @UserID AND UsedAt IS NULL');
      await pool.request()
        .input('TokenID', sql.UniqueIdentifier, tokenId)
        .input('UserID', sql.Int, user.UserID)
        .input('TokenHash', sql.Char(64), tokenHash)
        .input('ExpiresAt', sql.DateTime2, expiresAt)
        .query('INSERT INTO PasswordResetTokens (PasswordResetTokenID, UserID, TokenHash, ExpiresAt) VALUES (@TokenID, @UserID, @TokenHash, @ExpiresAt)');

      const appUrl = String(process.env.PUBLIC_APP_URL || 'http://localhost:5173').replace(/\/$/, '');
      const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
      await notificationService.enqueue({
        userId: user.UserID,
        channel: 'email',
        templateKey: 'password_reset',
        recipient: user.Email,
        subject: 'Réinitialisation de votre mot de passe ESNAS',
        body: `Bonjour ${user.FirstName || ''},\n\nUtilisez ce lien dans les 30 minutes : ${resetUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
        relatedEntityType: 'user',
        relatedEntityId: user.UserID,
      });
      return res.status(200).json(generic);
    } catch (error) {
      console.error('requestPasswordReset:', error);
      return res.status(200).json(generic);
    }
  },

  async resetPassword(req, res) {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');
    if (!/^[a-f0-9]{64}$/i.test(token) || !validPassword(password)) {
      return res.status(400).json({ success: false, message: 'Jeton ou mot de passe invalide.' });
    }
    try {
      const pool = await poolPromise;
      const tokenHash = hashSecurityToken(token);
      const result = await pool.request()
        .input('TokenHash', sql.Char(64), tokenHash)
        .query(`SELECT TOP (1) t.*, u.IsActive FROM PasswordResetTokens t JOIN Users u ON u.UserID = t.UserID WHERE t.TokenHash = @TokenHash`);
      const reset = result.recordset[0];
      if (!reset || reset.UsedAt || reset.IsActive === false || new Date(reset.ExpiresAt) <= new Date()) {
        return res.status(400).json({ success: false, message: 'Lien invalide ou expiré.' });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      try {
        await new sql.Request(transaction)
          .input('UserID', sql.Int, reset.UserID)
          .input('PasswordHash', sql.NVarChar(255), passwordHash)
          .query('UPDATE Users SET PasswordHash = @PasswordHash, AuthProvider = N\'local\', UpdatedAt = SYSUTCDATETIME() WHERE UserID = @UserID');
        await new sql.Request(transaction)
          .input('TokenID', sql.UniqueIdentifier, reset.PasswordResetTokenID)
          .query('UPDATE PasswordResetTokens SET UsedAt = SYSUTCDATETIME() WHERE PasswordResetTokenID = @TokenID AND UsedAt IS NULL');
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
      return res.status(200).json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });
    } catch (error) {
      console.error('resetPassword:', error);
      return res.status(500).json({ success: false, message: 'Impossible de réinitialiser le mot de passe.' });
    }
  },

  async me(req, res) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('UserID', sql.Int, req.user.id)
        .query('SELECT * FROM Users WHERE UserID = @UserID');

      if (!result.recordset.length) {
        return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
      }

      return res.status(200).json({ success: true, user: publicUser(result.recordset[0]) });
    } catch (error) {
      console.error('me:', error);
      return res.status(500).json({ success: false, message: 'Erreur profil.' });
    }
  },

  /**
   * Mise à jour du profil professionnel (identité locale uniquement).
   * Body: { firstName, lastName, phone, country }
   * Email et rôle ne sont jamais modifiables ici.
   */
  async updateProfile(req, res) {
    const firstName = cleanText(req.body?.firstName, 80);
    const lastName = cleanText(req.body?.lastName, 80);
    const phone = cleanText(req.body?.phone, 40);
    const country = cleanText(req.body?.country, 80);

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Le prenom et le nom sont obligatoires.',
      });
    }

    try {
      const pool = await poolPromise;
      const existing = await pool.request()
        .input('UserID', sql.Int, req.user.id)
        .query('SELECT * FROM Users WHERE UserID = @UserID');

      if (!existing.recordset.length) {
        return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
      }

      const updated = await pool.request()
        .input('UserID', sql.Int, req.user.id)
        .input('FirstName', sql.NVarChar(80), firstName)
        .input('LastName', sql.NVarChar(80), lastName)
        .input('Phone', sql.NVarChar(40), phone || null)
        .input('Country', sql.NVarChar(80), country || null)
        .query(`
          UPDATE Users
          SET FirstName = @FirstName,
              LastName = @LastName,
              Phone = @Phone,
              CountryOfResidence = COALESCE(@Country, CountryOfResidence),
              UpdatedAt = SYSUTCDATETIME()
          OUTPUT INSERTED.*
          WHERE UserID = @UserID
        `);

      const user = updated.recordset[0];
      await auditService.log({
        actorUserId: req.user.id,
        action: 'auth.profile_update',
        entityType: 'user',
        entityId: req.user.id,
        details: { fields: ['firstName', 'lastName', 'phone', 'country'] },
        ipAddress: req.ip,
      });

      return res.status(200).json({
        success: true,
        message: 'Profil mis a jour.',
        user: publicUser(user),
      });
    } catch (error) {
      console.error('updateProfile:', error);
      return res.status(500).json({ success: false, message: 'Erreur lors de la mise a jour du profil.' });
    }
  },

  /**
   * Changement / définition de mot de passe réel (bcrypt).
   * Body: { currentPassword?, newPassword, confirmPassword? }
   */
  async changePassword(req, res) {
    const currentPassword = req.body?.currentPassword;
    const newPassword = req.body?.newPassword;
    const confirmPassword = req.body?.confirmPassword;

    if (!newPassword || !validPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.',
      });
    }
    if (confirmPassword != null && String(confirmPassword) !== String(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'La confirmation du mot de passe ne correspond pas.',
      });
    }
    if (String(newPassword).length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe trop long.',
      });
    }

    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('UserID', sql.Int, req.user.id)
        .query('SELECT * FROM Users WHERE UserID = @UserID');

      if (!result.recordset.length) {
        return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
      }

      const user = result.recordset[0];
      const provider = String(user.AuthProvider || 'local').toLowerCase();
      const hasLocalPassword = Boolean(user.PasswordHash) && provider !== 'google';

      // Comptes locaux : le mot de passe actuel est obligatoire.
      // Comptes Google : l'utilisateur JWT peut définir un mot de passe local (double accès).
      if (hasLocalPassword || (provider === 'local' && user.PasswordHash)) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            message: 'Mot de passe actuel requis.',
          });
        }
        const isMatch = await bcrypt.compare(String(currentPassword), user.PasswordHash || '');
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Mot de passe actuel incorrect.',
          });
        }
      } else if (provider === 'google' && user.PasswordHash && currentPassword) {
        // Si un mot de passe local a déjà été défini sur un compte Google, le vérifier.
        const isMatch = await bcrypt.compare(String(currentPassword), user.PasswordHash || '');
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Mot de passe actuel incorrect.',
          });
        }
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(String(newPassword), salt);

      await pool.request()
        .input('UserID', sql.Int, req.user.id)
        .input('PasswordHash', sql.NVarChar, hashedPassword)
        .query(`
          UPDATE Users
          SET PasswordHash = @PasswordHash,
              UpdatedAt = SYSUTCDATETIME()
          WHERE UserID = @UserID
        `);

      await auditService.log({
        actorUserId: req.user.id,
        action: 'auth.password_change',
        entityType: 'user',
        entityId: req.user.id,
        details: { provider },
        ipAddress: req.ip,
      });

      return res.status(200).json({
        success: true,
        message: 'Mot de passe mis a jour avec succes.',
      });
    } catch (error) {
      console.error('changePassword:', error);
      return res.status(500).json({ success: false, message: 'Erreur lors du changement de mot de passe.' });
    }
  },

  /**
   * Avatar : URL HTTPS externe ou data URL image (jpeg/png/webp), stockée en fichier local.
   * Body: { dataUrl } | { avatarUrl }
   */
  async updateAvatar(req, res) {
    const dataUrl = req.body?.dataUrl || req.body?.image || null;
    const externalUrl = cleanText(req.body?.avatarUrl, 500);

    try {
      const pool = await poolPromise;
      const existing = await pool.request()
        .input('UserID', sql.Int, req.user.id)
        .query('SELECT * FROM Users WHERE UserID = @UserID');

      if (!existing.recordset.length) {
        return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
      }

      const previous = existing.recordset[0];
      let nextAvatarUrl = previous.AvatarUrl || null;

      if (dataUrl) {
        const parsed = parseImageDataUrl(dataUrl);
        if (!parsed) {
          return res.status(400).json({
            success: false,
            message: 'Image invalide. Formats acceptes : JPEG, PNG, WebP (max 1.5 Mo).',
          });
        }

        const avatarsDir = path.join(process.cwd(), 'server', 'uploads', 'avatars');
        fs.mkdirSync(avatarsDir, { recursive: true });

        const fileName = `u${req.user.id}-${Date.now()}.${parsed.ext}`;
        const absolutePath = path.join(avatarsDir, fileName);
        fs.writeFileSync(absolutePath, parsed.buffer);
        nextAvatarUrl = `/uploads/avatars/${fileName}`;

        // Nettoyage best-effort de l'ancien avatar local
        removeLocalAvatarFile(previous.AvatarUrl);
      } else if (externalUrl) {
        if (!isSafeHttpUrl(externalUrl)) {
          return res.status(400).json({
            success: false,
            message: 'URL avatar non autorisee (HTTPS uniquement).',
          });
        }
        nextAvatarUrl = externalUrl;
        removeLocalAvatarFile(previous.AvatarUrl);
      } else if (req.body?.avatarUrl === null || req.body?.remove === true) {
        removeLocalAvatarFile(previous.AvatarUrl);
        nextAvatarUrl = null;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Fournissez dataUrl ou avatarUrl.',
        });
      }

      const updated = await pool.request()
        .input('UserID', sql.Int, req.user.id)
        .input('AvatarUrl', sql.NVarChar(500), nextAvatarUrl)
        .query(`
          UPDATE Users
          SET AvatarUrl = @AvatarUrl,
              UpdatedAt = SYSUTCDATETIME()
          OUTPUT INSERTED.*
          WHERE UserID = @UserID
        `);

      await auditService.log({
        actorUserId: req.user.id,
        action: 'auth.avatar_update',
        entityType: 'user',
        entityId: req.user.id,
        ipAddress: req.ip,
      });

      return res.status(200).json({
        success: true,
        message: 'Avatar mis a jour.',
        user: publicUser(updated.recordset[0]),
      });
    } catch (error) {
      console.error('updateAvatar:', error);
      // Fallback si colonne AvatarUrl absente
      if (String(error.message || '').includes('Invalid column') || String(error.message || '').includes('AvatarUrl')) {
        return res.status(503).json({
          success: false,
          message: 'Colonne AvatarUrl absente. Executez les migrations (npm run db:migrate).',
        });
      }
      return res.status(500).json({ success: false, message: 'Erreur lors de la mise a jour de l avatar.' });
    }
  },

  /** Config publique auth (client id Google pour le front) */
  async publicConfig(_req, res) {
    return res.status(200).json({
      success: true,
      googleClientId: process.env.GOOGLE_CLIENT_ID || null,
      googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID),
    });
  },
};

export default authController;
