import secureAPIClient from '../utils/secureAPIClient';

/**
 * Service d'authentification et de gestion des rôles — ESNAS DRC
 */
const authService = {
  TOKEN_KEY: 'drc_auth_token',
  USER_KEY: 'drc_auth_user',

  async initialize() {
    try {
      const token = this.getToken();
      if (token) {
        secureAPIClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const me = await secureAPIClient.get('/auth/me');
          const data = me.data?.data || me.data;
          if (data?.user) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
          }
        } catch {
          // session locale conservée si /me échoue temporairement
        }
      }
    } catch (error) {
      console.error("Erreur initialisation session:", error);
    }
  },

  async login(email, password, turnstileToken = '') {
    try {
      const response = await secureAPIClient.post('/auth/login', {
        email: String(email || '').trim().toLowerCase(),
        password,
        turnstileToken,
      });

      const responseData = response.data?.data || response.data;

      if (responseData && responseData.token) {
        this.setSession(responseData.token, responseData.user);
        return { success: true, user: responseData.user };
      }
      return {
        success: false,
        error: responseData?.message || "Identifiants incorrects ou compte non activé.",
      };
    } catch (error) {
      console.error("Échec de connexion API:", error);
      return {
        success: false,
        error: error.userMessage || error.message || "Impossible de joindre le serveur d'authentification.",
      };
    }
  },

  async register(registrationData) {
    try {
      const response = await secureAPIClient.post('/auth/register', {
        ...registrationData,
        email: String(registrationData.email || '').trim().toLowerCase(),
        role: registrationData.role || 'Diaspora',
      });

      const responseData = response.data?.data || response.data;
      if (responseData && (responseData.success || response.status === 201)) {
        return {
          success: true,
          user: responseData.user,
          phoneVerification: responseData.phoneVerification || null,
        };
      }
      return {
        success: false,
        error: responseData?.message || "Échec de la création du compte.",
      };
    } catch (error) {
      console.error("Erreur inscription:", error);
      return {
        success: false,
        error: error.userMessage || error.message || "Erreur réseau.",
      };
    }
  },

  async verifyPhone(userId, challengeId, code) {
    try {
      const response = await secureAPIClient.post('/auth/phone/verify', {
        userId,
        challengeId,
        code: String(code || '').trim(),
      });
      const data = response.data?.data || response.data;
      return data?.success
        ? { success: true, message: data.message }
        : { success: false, error: data?.message || 'Code SMS invalide.' };
    } catch (error) {
      return { success: false, error: error.userMessage || error.message || 'Erreur de verification SMS.' };
    }
  },

  async resendPhoneVerification(userId) {
    try {
      const response = await secureAPIClient.post('/auth/phone/resend', { userId });
      const data = response.data?.data || response.data;
      return data?.success
        ? { success: true, message: data.message, phoneVerification: data.phoneVerification }
        : { success: false, error: data?.message || 'Impossible de renvoyer le code SMS.' };
    } catch (error) {
      return { success: false, error: error.userMessage || error.message || 'Erreur de renvoi SMS.' };
    }
  },

  /** Google Identity Services — credential = JWT ID token */
  async loginWithGoogle(credential, turnstileToken = '', verificationData = {}) {
    if (!credential) {
      return { success: false, error: 'Jeton Google manquant.' };
    }
    try {
      const response = await secureAPIClient.post('/auth/google', { credential, turnstileToken, ...verificationData });
      const responseData = response.data?.data || response.data;
      if (responseData?.requiresPhoneVerification) {
        return {
          success: true,
          requiresPhoneVerification: true,
          user: responseData.user,
          phoneVerification: responseData.phoneVerification,
        };
      }
      if (responseData?.token) {
        this.setSession(responseData.token, responseData.user);
        return { success: true, user: responseData.user };
      }
      return {
        success: false,
        error: responseData?.message || 'Échec connexion Google.',
      };
    } catch (error) {
      console.error('Google auth:', error);
      return {
        success: false,
        error: error.userMessage || error.message || 'Échec authentification Google.',
      };
    }
  },

  /** Compat : seul Google est supporté via GIS */
  async loginWithProvider(provider) {
    const p = String(provider || '').toLowerCase();
    if (p === 'google') {
      return { success: false, error: 'Utilisez le bouton Google.' };
    }
    return {
      success: false,
      error: `Le fournisseur « ${provider} » n'est plus supporté. Utilisez Google ou email/mot de passe.`,
    };
  },

  async getAuthConfig() {
    try {
      const response = await secureAPIClient.get('/auth/config');
      return response.data?.data || response.data || {};
    } catch {
      return {
        googleEnabled: Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID),
        googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || null,
      };
    }
  },

  async updateProfile(profileData) {
    const response = await secureAPIClient.patch('/auth/profile', profileData || {});
    const responseData = response.data?.data || response.data || {};
    if (responseData?.user) {
      this.setSession(this.getToken(), responseData.user);
    }
    return responseData;
  },

  async changePassword(passwordData) {
    const response = await secureAPIClient.patch('/auth/password', passwordData || {});
    return response.data?.data || response.data || {};
  },

  async requestPasswordReset(email, turnstileToken) {
    const response = await secureAPIClient.post('/auth/password/forgot', { email, turnstileToken });
    return response.data?.data || response.data || {};
  },

  async resetPassword(token, password, turnstileToken) {
    const response = await secureAPIClient.post('/auth/password/reset', { token, password, turnstileToken });
    return response.data?.data || response.data || {};
  },

  async updateAvatar(avatarData) {
    const response = await secureAPIClient.patch('/auth/avatar', avatarData || {});
    const responseData = response.data?.data || response.data || {};
    if (responseData?.user) {
      this.setSession(this.getToken(), responseData.user);
    }
    return responseData;
  },

  isLoggedIn() {
    const token = this.getToken();
    return Boolean(token);
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (!userStr) return null;

      const user = JSON.parse(userStr);
      return {
        ...user,
        role: user.role || 'Diaspora',
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur DRC',
      };
    } catch (error) {
      console.error("Erreur parsing utilisateur:", error);
      return null;
    }
  },

  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user || {}));
    secureAPIClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    delete secureAPIClient.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  },
};

export default authService;
