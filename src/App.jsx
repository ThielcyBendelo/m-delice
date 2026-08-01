import React, { Suspense } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext.jsx';

// =========================================================================
// 1. PORTAIL PUBLIC : VITRINE & TUNNELS (Dossier src/pages/)
// =========================================================================
import Home from './pages/Home';
import FormulesPage from './pages/ServicesPage';         
import PacksMicroPage from './pages/BoutiquePage';       
import SimulateurTarifPage from './pages/WorkPage';       
import ClaimsDeclarationPage from './pages/SkillsPage';   
import NetworkPartnersPage from './pages/ProjectsPage';   
import ComplianceArcaPage from './pages/ExperiencePage';  
import BeneficiaryRegistrationPage from './pages/ClientRegistrationPage'; 
import CheckoutPage from './pages/PaymentPage';           
import ContactSupportPage from './pages/ContactPage';     
import TestimonialsPage from './pages/TestimonialsPage'; 
import BlogPreventionPage from './pages/Blog.jsx';       
import DashboardPage from './pages/DashboardPage';
import PartnersPage from './pages/PartnersPage';

// =========================================================================
// 2. UTILITAIRES DE NAVIGATION & FLUIDITÉ (Dossier src/components/)
// =========================================================================
import PageTransition from './components/PageTransition';
import ScrollToTop from './components/ScrollToTop';

// =========================================================================
// 3. SÉCURITÉ & AUTHENTIFICATION (Dossier src/components/)
// =========================================================================
import PrivateRoute from './components/PrivateRoute';
import ProfessionalSplashScreen from './components/ProfessionalSplashScreen';
import SecureLogin from './components/SecureLogin';
import SecureRegister from './components/SecureRegister';

// =========================================================================
// 4. ESPACE PRIVÉ & BACK-OFFICE (Dossier src/dashboard/)
// =========================================================================
import AdminLayout from './dashboard/components/AdminLayout';
import AdminHome from './dashboard/AdminHome';
import BeneficiariesTable from './dashboard/Clients';       
import BuyersDiasporaTable from './dashboard/Subscribers'; 
import TransactionsJournal from './dashboard/PaymentManagement'; 
import QuittancesGenerator from './dashboard/InvoiceManagement';  
import RiskAnalytics from './dashboard/Analytics';         
import SystemMessaging from './dashboard/Messaging';       
import AccountProfile from './dashboard/Profile';         
import ForexFinanceDashboard from './dashboard/FinanceDashboard'; 

// SOUS-COMPOSANT NÉCESSAIRE POUR INTERCEPTER LA LOCALISATION ET LE MODE WAIT
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* --- PORTAIL ASSURÉ PUBLIC --- */}
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/formules" element={<PageTransition><FormulesPage /></PageTransition>} />
        <Route path="/packs-micro" element={<PageTransition><PacksMicroPage /></PageTransition>} />
        <Route path="/simulateur" element={<PageTransition><SimulateurTarifPage /></PageTransition>} />
        <Route path="/declaration-sinistre" element={<PageTransition><ClaimsDeclarationPage /></PageTransition>} />
        <Route path="/reseau-soins" element={<PageTransition><NetworkPartnersPage /></PageTransition>} />
        <Route path="/conformite-arca" element={<PageTransition><ComplianceArcaPage /></PageTransition>} />
        <Route path="/inscription-beneficiaire" element={<PageTransition><BeneficiaryRegistrationPage /></PageTransition>} />
        <Route path="/passerelle-paiement" element={<PageTransition><CheckoutPage /></PageTransition>} />
        <Route path="/urgences-contact" element={<PageTransition><ContactSupportPage /></PageTransition>} />
        <Route path="/temoignages" element={<PageTransition><TestimonialsPage /></PageTransition>} />
        <Route path="/guide-prevention" element={<PageTransition><BlogPreventionPage /></PageTransition>} />
        <Route path="/partenaires-garanties" element={<PageTransition><PartnersPage /></PageTransition>} />
        
        {/* --- ACCÈS SÉCURISÉS --- */}
        <Route path="/login" element={<PageTransition><SecureLogin /></PageTransition>} />
        <Route path="/register" element={<PageTransition><SecureRegister /></PageTransition>} />
        
        {/* --- ALIAS DE COMPATIBILITÉ --- */}
        <Route path="/services" element={<PageTransition><FormulesPage /></PageTransition>} />
        <Route path="/boutique" element={<PageTransition><PacksMicroPage /></PageTransition>} />
        <Route path="/work" element={<PageTransition><SimulateurTarifPage /></PageTransition>} />
        <Route path="/skills" element={<PageTransition><ClaimsDeclarationPage /></PageTransition>} />
        <Route path="/projects" element={<PageTransition><NetworkPartnersPage /></PageTransition>} />
        <Route path="/experience" element={<PageTransition><ComplianceArcaPage /></PageTransition>} />
        <Route path="/clients" element={<PageTransition><BeneficiaryRegistrationPage /></PageTransition>} />
        <Route path="/paiement" element={<PageTransition><CheckoutPage /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactSupportPage /></PageTransition>} />
        <Route path="/blog" element={<PageTransition><BlogPreventionPage /></PageTransition>} />
        <Route path="/dashboard-page" element={<PageTransition><DashboardPage /></PageTransition>} />

        {/* =========================================================================
            4. ESPACE PRIVÉ ET GESTION (Layout Admin avec contrôle d'accès)
           ========================================================================= */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="clients" element={<BeneficiariesTable />} />
          <Route path="subscribers" element={<BuyersDiasporaTable />} />
          <Route path="payments" element={<TransactionsJournal />} />
          <Route path="invoices" element={<QuittancesGenerator />} />
          <Route path="analytics" element={<RiskAnalytics />} />
          <Route path="messages" element={<SystemMessaging />} />
          <Route path="profile" element={<AccountProfile />} />
          <Route path="finance" element={<ForexFinanceDashboard />} />
        </Route>
        
        <Route path="*" element={<PageTransition><Home /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const [splashDone, setSplashDone] = React.useState(false);

  return (
    <ThemeProvider>
      {!splashDone && (
        <ProfessionalSplashScreen onComplete={() => setSplashDone(true)} />
      )}
      
      {splashDone && (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300 font-['Saira']">
          
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
          
          <Suspense fallback={
            <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#00A3E0] border-t-transparent"></div>
              <p className="mt-4 text-sm font-bold text-[#00A3E0] tracking-wide animate-pulse">Initialisation de l'écosystème ESNAS...</p>
            </div>
          }>
            {/* L'utilitaire ScrollToTop est placé juste avant la structure des routes animées */}
            <ScrollToTop />
            <AnimatedRoutes />
          </Suspense>
        </div>
      )}
    </ThemeProvider>
  );
};

export default App;
