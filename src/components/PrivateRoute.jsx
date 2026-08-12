import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import authService from '../services/authService';

/**
 * Protège les routes dashboard : JWT requis.
 * Supporte children (App.jsx) OU <Outlet /> (nested routes).
 */
export default function PrivateRoute({ children }) {
  const location = useLocation();

  if (!authService.isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (children) {
    return children;
  }

  return <Outlet />;
}
