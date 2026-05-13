import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import './index.css';

// ── Pages publiques
import LandingPage  from './pages/auth/LandingPage';
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// ── Super Admin
import DashboardPage from './pages/super-admin/DashboardPage';
import ProduitsAdminPage from './pages/super-admin/ProduitsPage';
import VentesAdminPage from './pages/super-admin/VentesPage';
import LivraisonsAdminPage from './pages/super-admin/LivraisonsPage';
import DemandesLivreursPage from './pages/super-admin/DemandesLivreursPage';
import DossiersJournaliersPage from './pages/super-admin/DossiersJournaliersPage';
import RapportsAdminPage from './pages/super-admin/RapportsPage';
import UtilisateursPage from './pages/super-admin/UtilisateursPage';
import ParametresPage from './pages/super-admin/ParametresPage';

// ── Gestionnaire
import GestionnaireDashboardPage from './pages/gestionnaire/DashboardPage';
import GestionnaireProduitsPage from './pages/gestionnaire/ProduitsPage';
import GestionnaireLivraisonsPage from './pages/gestionnaire/LivraisonsPage';
import GestionnaireRapportsPage from './pages/gestionnaire/RapportsPage';

// ── Coordinateur
import CoordinateurLivraisonsPage from './pages/coordinateur/LivraisonsPage';
import CoordinateurPositionsPage from './pages/coordinateur/PositionsPage';
import CoordinateurDemandesPage from './pages/coordinateur/DemandesPage';

// ── Vendeur
import VendeurProduitsPage from './pages/vendeur/ProduitsPage';
import VendeurVentesPage from './pages/vendeur/VentesPage';

// ── Livreur
import LivreurDemandesPage from './pages/livreur/DemandesPage';
import LivreurDossierPage from './pages/livreur/DossierPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'DM Sans, sans-serif', fontSize: 14, borderRadius: 10, border: '1px solid #dde5f4' },
            success: { iconTheme: { primary: '#0a9e6e', secondary: 'white' } },
            error:   { iconTheme: { primary: '#e53e3e', secondary: 'white' } },
          }}
        />

        <Routes>
          {/* ── Public ── */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Super Admin ── */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['super_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index                      element={<DashboardPage />} />
            <Route path="produits"            element={<ProduitsAdminPage />} />
            <Route path="ventes"              element={<VentesAdminPage />} />
            <Route path="livraisons"          element={<LivraisonsAdminPage />} />
            <Route path="demandes-livreurs"   element={<DemandesLivreursPage />} />
            <Route path="dossiers-journaliers"element={<DossiersJournaliersPage />} />
            <Route path="rapports"            element={<RapportsAdminPage />} />
            <Route path="utilisateurs"        element={<UtilisateursPage />} />
            <Route path="parametres"          element={<ParametresPage />} />
          </Route>

          {/* ── Gestionnaire ── */}
          <Route path="/gestionnaire" element={
            <ProtectedRoute roles={['gestionnaire', 'super_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard"  element={<GestionnaireDashboardPage />} />
            <Route path="produits"   element={<GestionnaireProduitsPage />} />
            <Route path="livraisons" element={<GestionnaireLivraisonsPage />} />
            <Route path="rapports"   element={<GestionnaireRapportsPage />} />
          </Route>

          {/* ── Coordinateur ── */}
          <Route path="/coordinateur" element={
            <ProtectedRoute roles={['coordinateur', 'super_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="livraisons" element={<CoordinateurLivraisonsPage />} />
            <Route path="positions"  element={<CoordinateurPositionsPage />} />
            <Route path="demandes"   element={<CoordinateurDemandesPage />} />
          </Route>

          {/* ── Vendeur ── */}
          <Route path="/vendeur" element={
            <ProtectedRoute roles={['vendeur', 'super_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="produits" element={<VendeurProduitsPage />} />
            <Route path="ventes"   element={<VendeurVentesPage />} />
          </Route>

          {/* ── Livreur ── */}
          <Route path="/livreur" element={
            <ProtectedRoute roles={['livreur', 'super_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="demandes" element={<LivreurDemandesPage />} />
            <Route path="dossier"  element={<LivreurDossierPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);