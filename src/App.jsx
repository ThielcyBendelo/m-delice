import React, { Suspense } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Routes, Route } from 'react-router-dom';
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

// =========================================================================
// 2. SÉCURITÉ & AUTHENTIFICATION (Dossier src/components/)
// =========================================================================
import PrivateRoute from './components/PrivateRoute';
import ProfessionalSplashScreen from './components/ProfessionalSplashScreen';
import SecureLogin from './components/SecureLogin';
import SecureRegister from './components/SecureRegister';

// =========================================================================
// 3. ESPACE PRIVÉ & BACK-OFFICE (Dossier src/dashboard/)
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
              <p className="mt-4 text-sm font-bold text-[#00A3E0] tracking-wide animate-pulse">Initialisation de l'écosystème DRC Assurances...</p>
            </div>
          }>
            <Routes>
              {/* --- PORTAIL ASSURÉ PUBLIC --- */}
              <Route path="/" element={<Home />} />
              <Route path="/formules" element={<FormulesPage />} />
              <Route path="/packs-micro" element={<PacksMicroPage />} />
              <Route path="/simulateur" element={<SimulateurTarifPage />} />
              <Route path="/declaration-sinistre" element={<ClaimsDeclarationPage />} />
              <Route path="/reseau-soins" element={<NetworkPartnersPage />} />
              <Route path="/conformite-arca" element={<ComplianceArcaPage />} />
              <Route path="/inscription-beneficiaire" element={<BeneficiaryRegistrationPage />} />
              <Route path="/passerelle-paiement" element={<CheckoutPage />} />
              <Route path="/urgences-contact" element={<ContactSupportPage />} />
              <Route path="/temoignages" element={<TestimonialsPage />} />
              <Route path="/guide-prevention" element={<BlogPreventionPage />} />
              
              {/* --- ACCÈS SÉCURISÉS --- */}
              <Route path="/login" element={<SecureLogin />} />
              <Route path="/register" element={<SecureRegister />} />
              
              {/* --- ALIAS DE COMPATIBILITÉ --- */}
              <Route path="/services" element={<FormulesPage />} />
              <Route path="/boutique" element={<PacksMicroPage />} />
              <Route path="/work" element={<SimulateurTarifPage />} />
              <Route path="/skills" element={<ClaimsDeclarationPage />} />
              <Route path="/projects" element={<NetworkPartnersPage />} />
              <Route path="/experience" element={<ComplianceArcaPage />} />
              <Route path="/clients" element={<BeneficiaryRegistrationPage />} />
              <Route path="/paiement" element={<CheckoutPage />} />
              <Route path="/contact" element={<ContactSupportPage />} />
              <Route path="/blog" element={<BlogPreventionPage />} />
              <Route path="/dashboard-page" element={<DashboardPage />} />

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
              
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </div>
      )}
    </ThemeProvider>
  );
};

export default App;
