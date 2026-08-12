import jwt from 'jsonwebtoken';

/**
 * Extrait le Bearer token de l'en-tête Authorization
 */
function extractToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== 'string') return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

/**
 * Middleware JWT obligatoire
 */
export function requireAuth(req, res, next) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET non configuré sur le serveur.',
      });
    }

    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise. Jeton manquant.',
      });
    }

    const payload = jwt.verify(token, secret);
    req.user = {
      id: payload.id,
      role: payload.role || 'Diaspora',
      email: payload.email || null,
    };
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Session invalide ou expirée. Reconnectez-vous.',
    });
  }
}

/**
 * Auth optionnelle : peupple req.user si token présent, sinon continue
 */
export function optionalAuth(req, _res, next) {
  try {
    const secret = process.env.JWT_SECRET;
    const token = extractToken(req);
    if (secret && token) {
      const payload = jwt.verify(token, secret);
      req.user = {
        id: payload.id,
        role: payload.role || 'Diaspora',
        email: payload.email || null,
      };
    }
  } catch {
    // ignore invalid token for optional paths
  }
  return next();
}

/**
 * Autorise uniquement certains rôles (après requireAuth)
 * @param  {...string} roles
 */
export function requireRole(...roles) {
  const allowed = roles.map((r) => String(r).toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentification requise.' });
    }
    const role = String(req.user.role || '').toLowerCase();
    if (!allowed.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé : rôle insuffisant.',
      });
    }
    return next();
  };
}

/** Rôles staff / admin métier */
export const STAFF_ROLES = ['admin', 'agent', 'underwriter', 'claims_manager', 'finance'];

export function requireStaff(req, res, next) {
  return requireRole(...STAFF_ROLES, 'Admin', 'Agent')(req, res, next);
}

export default { requireAuth, optionalAuth, requireRole, requireStaff, STAFF_ROLES };
