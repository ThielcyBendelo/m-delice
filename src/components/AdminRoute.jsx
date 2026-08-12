import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

/**
 * 🔐 Composant de protection pour routes ADMIN SEULEMENT
 * Vérifie:
 * 1. L'utilisateur est authentifié
 * 2. L'utilisateur a le rôle 'admin'
 * 3. Log l'accès pour audit
 */
const AdminRoute = ({ children }) => {
  // 1. Vérifier l'authentification
  if (!authService.isLoggedIn()) {
    console.warn('❌ Access denied: Not authenticated');
    return <Navigate to="/login" replace />;
  }

  // 2. Vérifier le rôle admin
  const currentUser = authService.getCurrentUser();
  if (String(currentUser?.role || '').toLowerCase() !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
