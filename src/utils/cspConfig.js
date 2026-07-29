/**
 * 🛡️ Content Security Policy (CSP) Configuration - DRC Assurances Fintech
 * 
 * Cette configuration protège l'écosystème contre:
 * - Les attaques XSS (Cross-Site Scripting) sur les formulaires
 * - Le Clickjacking sur les tunnels transfrontaliers
 * - L'injection de scripts malveillants sur les passerelles de paiement
 * - L'intégration non autorisée d'iframes (anti-fraude)
 */

export const CSPConfig = {
  // Pour le développement local - headers relaxés pour Vite HMR et les tests
  development: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cinetpay.com', 'https://stripe.com'], // Inclus CinetPay & Stripe
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https://unsplash.com', 'https://*.stripe.com'], // Inclus Unsplash pour le blog
    // 🟢 CORRIGÉ : Ajout de l'IP numérique locale pour autoriser les liaisons directes de fetch
    'connect-src': ["'self'", 'http://localhost:*', 'http://127.0.0.1:*', 'https://cinetpay.com', 'https://api.stripe.com'],
    'frame-src': ["'self'", 'https://cinetpay.com', 'https://stripe.com'], // Autorise les fenêtres de paiement
  },

  // Pour la production - headers stricts et conformes aux audits ARCA
  production: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://cinetpay.com', 'https://stripe.com'], // Clés de confiance de nos passerelles
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https://unsplash.com', 'https://*.stripe.com', '/logo.png'],
    'connect-src': ["'self'", 'https://cinetpay.com', 'https://stripe.com', 'https://drcassurances.com'], // Remplacez par votre vrai domaine API
    'frame-src': ["'self'", 'https://cinetpay.com', 'https://stripe.com'],
     // Interdire l'embedding total hors domaine pour bloquer le clickjacking
    'form-action': ["'self'", 'https://cinetpay.com'], // Soumettre les données uniquement chez nous ou vers l'opérateur local
    'base-uri': ["'self'"],
    'upgrade-insecure-requests': [],
  },
};

/**
 * Génère la chaîne CSP complète
 * @param {Object} config - Configuration CSP
 * @returns {string} - Chaîne CSP formattée
 */
export const generateCSPHeader = (config) => {
  return Object.entries(config)
    .filter(([, values]) => values.length > 0)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
};

/**
 * Applique une meta CSP au document
 * Utile pour les applications React qui ne contrôlent pas les headers serveur
 */
export const applyCSPMeta = () => {
  // Détection de l'environnement via Vite
  const isDevelopment = import.meta.env.DEV;
  const config = isDevelopment ? CSPConfig.development : CSPConfig.production;
  const cspContent = generateCSPHeader(config);

  // Évite d'ajouter des doublons de balise meta CSP dans le head
  const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingMeta) {
    existingMeta.content = cspContent;
  } else {
    const metaTag = document.createElement('meta');
    metaTag.httpEquiv = 'Content-Security-Policy';
    metaTag.content = cspContent;
    document.head.appendChild(metaTag);
  }
};

/**
 * Logger les violations de CSP
 * Utile pour surveiller les tentatives de fraude sur les formulaires
 */
export const setupCSPViolationReporting = () => {
  document.addEventListener('securitypolicyviolation', (event) => {
    console.warn('🚨 CSP Violation Detected dans l’écosystème DRC Assurances:', {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      originalPolicy: event.originalPolicy,
    });
  });
};

/**
 * Exemple de headers CSP à configurer sur le serveur de production (Nginx/Express)
 */
export const serverHeadersExample = `
// Pour Express.js (Liaison Node-mssql SQL Server):
app.use((req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';
  const cspConfig = isDev ? CSPConfig.development : CSPConfig.production;
  const cspHeader = generateCSPHeader(cspConfig);
  
  res.setHeader('Content-Security-Policy', cspHeader);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});
`;

export default {
  CSPConfig,
  generateCSPHeader,
  applyCSPMeta,
  setupCSPViolationReporting,
  serverHeadersExample,
};
