import crypto from 'crypto';

const buckets = new Map();

function clientKey(req, scope) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return `${scope}:${forwarded || req.ip || req.socket.remoteAddress || 'unknown'}`;
}

export function rateLimit({ scope, windowMs = 15 * 60 * 1000, max = 20 } = {}) {
  return (req, res, next) => {
    const key = clientKey(req, scope || req.path);
    const now = Date.now();
    const recent = (buckets.get(key) || []).filter((timestamp) => now - timestamp < windowMs);
    if (recent.length >= max) {
      const retryAfter = Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ success: false, message: 'Trop de tentatives. Réessayez plus tard.' });
    }
    recent.push(now);
    buckets.set(key, recent);
    if (buckets.size > 10000) {
      for (const [bucketKey, timestamps] of buckets) {
        if (!timestamps.some((timestamp) => now - timestamp < windowMs)) buckets.delete(bucketKey);
      }
    }
    return next();
  };
}

export async function verifyTurnstile(req, res, next) {
  const secret = String(process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '').trim();
  const token = String(req.body?.turnstileToken || req.headers['x-turnstile-token'] || '').trim();
  const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

  if (!secret) {
    if (isProduction) {
      return res.status(503).json({ success: false, message: 'Protection anti-robot non configurée.' });
    }
    return next();
  }
  if (!token || token.length > 2048) {
    return res.status(400).json({ success: false, message: 'Vérification anti-robot requise.' });
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(req.ip ? { remoteip: req.ip } : {}),
      }),
    });
    const result = await response.json();
    if (!response.ok || result.success !== true) {
      return res.status(403).json({ success: false, message: 'Vérification anti-robot refusée.' });
    }
    return next();
  } catch (error) {
    console.error('Turnstile verification:', error.message);
    return res.status(503).json({ success: false, message: 'Vérification anti-robot indisponible.' });
  }
}

export function hashSecurityToken(token) {
  return crypto.createHash('sha256').update(String(token), 'utf8').digest('hex');
}
