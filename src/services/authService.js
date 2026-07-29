import secureAPIClient from '../utils/secureAPIClient';

/**
 * Service d'authentification et de gestion des rôles de l'écosystème — DRC Assurances
 */
const authService = {
  
  // 🟢 UNIQUE : Utilisation stricte des mêmes clés partout pour éviter les conflits de lecture
  TOKEN_KEY: 'drc_auth_token',
  USER_KEY: 'drc_auth_user',

  /**
   * Initialise la session au démarrage de l'application
   */
  async initialize() {
    try {
      const token = this.getToken();
      if (token) {
        secureAPIClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la session d'assurance:", error);
    }
  },

  /**
   * Connexion sécurisée à la plateforme (Liaison SQL Server via API)
   */
  async login(email, password) {
    try {
      const response = await secureAPIClient.post('/auth/login', { email, password });
      
      // Extraction adaptative selon la structure renvoyée par le client API
      const responseData = response.data?.data || response.data;

      if (responseData && responseData.token) {
        // Enregistrement immédiat dans le Local Storage
        this.setSession(responseData.token, responseData.user);
        return { success: true, user: responseData.user };
      }
      return { success: false, error: "Identifiants incorrects ou compte ARCA non activé." };
    } catch (error) {
      console.error("Échec de connexion API:", error);
      return { 
        success: false, 
        error: error.userMessage || "Impossible de joindre le serveur d'authentification." 
      };
    }
  },

  /**
   * Inscription d'un nouveau membre de la Diaspora
   */
  async register(registrationData) {
    try {
      const response = await secureAPIClient.post('/auth/register', {
        ...registrationData,
        role: 'Diaspora'
      });

      const responseData = response.data?.data || response.data;
      if (responseData && responseData.success) {
        return { success: true };
      }
      return { success: false, error: "Échec de la création du compte." };
    } catch (error) {
      console.error("Erreur lors de l'inscription Diaspora:", error);
      return { success: false, error: error.userMessage || "Erreur réseau." };
    }
  },

  /**
   * 🟢 CORRIGÉ : Vérifie de manière robuste si le jeton existe sous la BONNE clé
   */
  isLoggedIn() {
    const token = this.getToken();
    return token !== null && token !== undefined && token !== '';
  },

  /**
     /**
   * Récupère le profil et sécurise les variables contre les crashs de rendu React
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      
      // 🟢 SÉCURITÉ : On crée des alias pour que l'ancien et le nouveau code fonctionnent ensemble
      return {
        ...user,
        role: user.role || 'Diaspora',
        // Fusionne firstName et lastName pour recréer la variable 'name' si elle est appelée
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur DRC'
      };
    } catch (error) {
      console.error("Erreur de parsing de l'utilisateur d'assurance:", error);
      return null;
    }
  },


  /**
   * 🟢 CORRIGÉ : Utilise obligatoirement les clés centralisées du composant
   */
  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    secureAPIClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  /**
   * Récupère le jeton JWT actif
   */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  /**
   * Déconnexion complète et purge des jetons de sécurité
   */
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    delete secureAPIClient.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  }
};

export default authService;
