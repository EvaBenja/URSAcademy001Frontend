import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import './index.css';

// Auth
import LandingPage    from './pages/auth/LandingPage';
import LoginPage      from './pages/auth/LoginPage';
import RegisterPage   from './pages/auth/RegisterPage';

// Super Admin
import SADashboard    from './pages/super-admin/DashboardPage';
import SAProduits     from './pages/super-admin/ProduitsPage';
import SAVentes       from './pages/super-admin/VentesPage';
import SASuivi        from './pages/super-admin/SuiviLivraisons';
import SADossiers     from './pages/super-admin/DossiersJournaliers';
import SARapports     from './pages/super-admin/RapportsPage';
import SAUtilisateurs from './pages/super-admin/UtilisateursPage';

// Gestionnaire
import GestDashboard  from './pages/gestionnaire/DashboardPage';
import GestProduits   from './pages/gestionnaire/ProduitsPage';
import GestValidation from './pages/gestionnaire/ValidationVentesPage';
import GestClassement from './pages/gestionnaire/ClassementVendeursPage';
import GestDemandes   from './pages/gestionnaire/DemandesLivreursPage';
import GestLivraisons from './pages/gestionnaire/LivraisonsPage';
import GestRapports   from './pages/gestionnaire/RapportsPage';
import GestDepenses   from './pages/gestionnaire/DepensesPage';

// Coordinateur
import CoordLivraisons from './pages/coordinateur/LivraisonsPage';
import CoordPositions  from './pages/coordinateur/PositionsPage';
import CoordDemandes   from './pages/coordinateur/DemandesPage';

// Vendeur
import VendeurProduits from './pages/vendeur/ProduitsPage';
import VendeurVentes   from './pages/vendeur/VentesPage';

// Livreur
import LivreurLivraisons from './pages/livreur/MesLivraisons';
import LivreurHistorique from './pages/livreur/HistoriquePage';
import LivreurDemandes   from './pages/livreur/DemandesPage';
import LivreurDossiers   from './pages/livreur/DossierPage';

const Soon = ({ title }: { title: string }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
    <div style={{ textAlign:'center' }}>
      <div style={{ width:64, height:64, borderRadius:16, background:'#e0f0ff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1465BB" strokeWidth="1.5"><path d="M12 2v20M2 12h20"/></svg>
      </div>
      <p style={{ fontFamily:'Playfair Display,serif', fontSize:26, color:'#1465BB', marginBottom:8 }}>{title}</p>
      <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0' }}>Page en cours de développement…</p>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style:   { fontFamily:'DM Sans,sans-serif', fontSize:14, borderRadius:10, border:'1px solid #dde5f4' },
          success: { iconTheme:{ primary:'#0a9e6e', secondary:'white' } },
          error:   { iconTheme:{ primary:'#e53e3e', secondary:'white' } },
        }}/>
        <Routes>
          {/* Public */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Super Admin */}
          <Route path="/dashboard" element={<ProtectedRoute roles={['super_admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index                       element={<SADashboard />} />
            <Route path="produits"             element={<SAProduits />} />
            <Route path="ventes"               element={<SAVentes />} />
            <Route path="suivi-livraisons"     element={<SASuivi />} />
            <Route path="demandes-livreurs"    element={<GestDemandes />} />
            <Route path="dossiers-journaliers" element={<SADossiers />} />
            <Route path="rapports"             element={<SARapports />} />
            <Route path="utilisateurs"         element={<SAUtilisateurs />} />
            <Route path="parametres"           element={<Soon title="Paramètres" />} />
          </Route>

          {/* Gestionnaire */}
          <Route path="/gestionnaire" element={<ProtectedRoute roles={['gestionnaire','super_admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="dashboard"  element={<GestDashboard />} />
            <Route path="produits"   element={<GestProduits />} />
            <Route path="ventes"     element={<GestValidation />} />
            <Route path="classement" element={<GestClassement />} />
            <Route path="livraisons" element={<GestLivraisons />} />
            <Route path="demandes"   element={<GestDemandes />} />
            <Route path="dossiers"   element={<SADossiers />} />
            <Route path="rapports"   element={<GestRapports />} />
            <Route path="depenses"  element={<GestDepenses />} />
          </Route>

          {/* Coordinateur */}
          <Route path="/coordinateur" element={<ProtectedRoute roles={['coordinateur','super_admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="livraisons" element={<CoordLivraisons />} />
            <Route path="positions"  element={<CoordPositions />} />
            <Route path="demandes"   element={<CoordDemandes />} />
          </Route>

          {/* Vendeur */}
          <Route path="/vendeur" element={<ProtectedRoute roles={['vendeur','super_admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="produits" element={<VendeurProduits />} />
            <Route path="ventes"   element={<VendeurVentes />} />
          </Route>

          {/* Livreur */}
          <Route path="/livreur" element={<ProtectedRoute roles={['livreur','super_admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="livraisons" element={<LivreurLivraisons />} />
            <Route path="historique" element={<LivreurHistorique />} />
            <Route path="demandes"   element={<LivreurDemandes />} />
            <Route path="dossiers"   element={<LivreurDossiers />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
