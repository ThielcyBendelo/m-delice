/**
 * 🛡️ CLIENT API SÉCURISÉ — DRC ASSURANCES FINTECH
 * Intègre les interceptors de sécurité, la protection anti-XSS CSRF
 * et la journalisation des transmissions exigée par l'ARCA.
 */

export class SecureAPIClient {
  constructor(baseURL = 'http://localhost:5000/api', timeout = 30000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.csrfToken = null;
    this.authToken = null;
    
    // 🟢 COMPATIBILITÉ : Structure de headers requise par authService pour l'injection à chaud
    this.defaults = {
      headers: {
        common: {}
      }
    };
  }

  /**
   * Initialiser le client API avec les tokens de sécurité
   */
  initialize(csrfToken = null, authToken = null) {
    this.csrfToken = csrfToken || this.generateCSRFToken();
    this.authToken = authToken;
    this.storeCSRFToken(this.csrfToken);
    
    if (this.authToken) {
      this.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
    }
  }

  /**
   * Générer un jeton cryptographique CSRF pour sécuriser les formulaires
   */
  generateCSRFToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  storeCSRFToken(token) {
    try {
      localStorage.setItem('csrf-token', token);
    } catch (e) {
      console.warn('❌ Erreur lors du stockage du CSRF token:', e);
    }
  }

  getCSRFToken() {
    return this.csrfToken || localStorage.getItem('csrf-token') || this.generateCSRFToken();
  }

  /**
   * Construire l'en-tête réseau aux normes bancaires PCI-DSS
   */
  buildHeaders(additionalHeaders = {}) {
    // Lecture des injections dynamiques de l'authService
    const dynamicAuth = this.defaults.headers.common['Authorization'];

    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-Token': this.getCSRFToken(),
      ...this.defaults.headers.common, // Injecte les en-têtes configurés globalement
      ...additionalHeaders,
    };

    if (dynamicAuth) {
      headers['Authorization'] = dynamicAuth;
    } else if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * REQUÊTE HTTP GET
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  /**
   * REQUÊTE HTTP POST
   */
  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(data), ...options });
  }

  /**
   * REQUÊTE HTTP PUT
   */
  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data), ...options });
  }

  /**
   * REQUÊTE HTTP DELETE
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }

  /**
   * Traitement asynchrone global avec contrôle des pannes réseau
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.buildHeaders(options.headers);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIError(`HTTP ${response.status}: ${response.statusText}`, response.status, response);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        // 🟢 COMPATIBILITÉ : Structure d'encapsulation de données Axios pour correspondre à response.data
        return {
          success: true,
          data: data, 
          status: response.status,
        };
      }

      return { success: true, data: null, status: response.status };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') throw new APIError('Requête expirée', 408);
      if (error instanceof APIError) throw error;
      throw new APIError(error.message || 'Erreur réseau', 0, null, error);
    }
  }
}

/**
 * Gestionnaire d'exceptions et de messages d'erreurs localisés
 */
export class APIError extends Error {
  constructor(message, statusCode = 0, response = null, originalError = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.response = response;
    this.originalError = originalError;
    this.userMessage = this.getUserMessage(statusCode, message);
  }

  getUserMessage(statusCode, message) {
    const errorMap = {
      400: 'Requête invalide. Vérifiez les informations saisies.',
      401: 'Session expirée. Veuillez vous reconnecter.',
      403: 'Accès refusé. Autorisation ARCA insuffisante.',
      404: 'Ressource ou point d’accès réseau introuvable.',
      408: 'Le serveur d’assurance met trop de temps à répondre.',
      500: 'Erreur interne SQL Server. Contactez l’administrateur.',
    };
    return errorMap[statusCode] || message || 'Une erreur de transmission est survenue.';
  }
}

/**
 * Interceptor de sécurité applicatif
 */
export const setupAPIInterceptors = (apiClient) => {
  const originalRequest = apiClient.request.bind(apiClient);

  apiClient.request = async function (endpoint, options = {}) {
    options.headers = this.buildHeaders(options.headers);

    if (import.meta.env.DEV) {
      console.log('🔒 [Fintech Security Client] Transmission :', {
        method: options.method || 'GET',
        endpoint,
        hasCSRF: !!options.headers['X-CSRF-Token'],
        hasAuth: !!options.headers['Authorization'],
      });
    }

    try {
      return await originalRequest(endpoint, options);
    } catch (error) {
      if (error.statusCode === 401) {
        localStorage.removeItem('drc_auth_token');
        localStorage.removeItem('drc_auth_user');
        window.location.href = '/login';
      }
      throw error;
    }
  };

  return apiClient;
};

// 🟢 INITIALISATION : URL de base par défaut vers l'API Node (Port 5000)
// 🟢 CORRIGÉ : Restauration de l'URL valide avec le port 5000 et le préfixe /api
export const secureAPIClient = new SecureAPIClient(
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
);


setupAPIInterceptors(secureAPIClient);
export default secureAPIClient;
