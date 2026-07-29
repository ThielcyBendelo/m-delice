import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';

// ===== 🛡️ SÉCURITÉ INSTITUTIONNELLE =====
// Initialiser la sécurité CSP et les validations d'infrastructure
import { applyCSPMeta, setupCSPViolationReporting } from './utils/cspConfig';
import secureAPIClient from './utils/secureAPIClient';

// Appliquer Content Security Policy (Protection contre les injections)
applyCSPMeta();

// Logger les violations de sécurité sur les tunnels de paiement
setupCSPViolationReporting();

// Initialiser le client API sécurisé pour SQL Server & Fintech
secureAPIClient.initialize();

console.log('🛡️ Infrastructure de sécurité DRC Assurances initialisée');

// ===== INITIALISATION DE L'APPLICATION =====
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// ===== SERVICE WORKER (PWA Mobile-First) =====
// Active le cache hors-ligne pour les réseaux instables en RDC en production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW PWA connecté avec succès : ', registration);
    }).catch(registrationError => {
      console.log('Échec de la connexion du SW : ', registrationError);
    });
  });
}
