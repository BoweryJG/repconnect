import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { premiumTheme } from './theme/premiumTheme';
import App from './App';
import { LeadEnrichmentLanding } from './components/LeadEnrichmentLanding';
import { EnrichmentResults } from './components/EnrichmentResults';
import { PublicEnrichedDemo } from './components/PublicEnrichedDemo';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  LazyHarveySyndicate,
  LazyHarveyWarRoom,
  LazyHarveyCallQueueInterface,
  LazyHarveyBattleMode,
  LazyHarveyMetricsDashboard,
} from './components/lazy/LazyHarveyComponents';
import { AuthCallback } from './pages/AuthCallback';
import AudioTestComponent from './components/AudioTestComponent';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AgentEditor from './components/admin/AgentEditor';
import AdminRoute from './components/admin/AdminRoute';

export const AppRouter: React.FC = () => {
  // Debug logging
  React.useEffect(() => {
    console.log('[ROUTER DEBUG] Initial load');
    console.log('[ROUTER DEBUG] pathname:', window.location.pathname);
    console.log('[ROUTER DEBUG] hash:', window.location.hash);
    console.log('[ROUTER DEBUG] search:', window.location.search);
    console.log('[ROUTER DEBUG] full URL:', window.location.href);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={premiumTheme}>
        <CssBaseline />
        <AdminAuthProvider>
          <Router>
            <Routes>
              {/* Auth callback route - MUST BE FIRST to prevent interference */}
              <Route
                path="/auth/callback"
                element={
                  <div style={{ padding: '50px', background: 'red', color: 'white' }}>
                    <h1>AUTH CALLBACK ROUTE HIT!</h1>
                    <p>Path: {window.location.pathname}</p>
                    <p>Hash: {window.location.hash}</p>
                    <AuthCallback />
                  </div>
                }
              />

              {/* Main app routes */}
              <Route path="/" element={<App />} />

              {/* Lead enrichment routes */}
              <Route path="/enrich" element={<LeadEnrichmentLanding />} />
              <Route path="/enrich/results" element={<EnrichmentResults />} />
              <Route path="/demo" element={<PublicEnrichedDemo />} />

              {/* Harvey Syndicate routes - Lazy loaded */}
              <Route path="/harvey" element={<LazyHarveySyndicate />} />
              <Route path="/harvey/warroom" element={<LazyHarveyWarRoom />} />
              <Route path="/harvey/queue" element={<LazyHarveyCallQueueInterface />} />
              <Route path="/harvey/battle" element={<LazyHarveyBattleMode />} />
              <Route path="/harvey/metrics" element={<LazyHarveyMetricsDashboard />} />

              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/agents/new"
                element={
                  <AdminRoute>
                    <AgentEditor />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/agents/:id/edit"
                element={
                  <AdminRoute>
                    <AgentEditor />
                  </AdminRoute>
                }
              />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

              {/* Audio test route for debugging */}
              <Route path="/test/audio" element={<AudioTestComponent />} />

              {/* Catch all route to debug */}
              <Route
                path="*"
                element={
                  <div style={{ padding: '50px', background: 'yellow', color: 'black' }}>
                    <h1>CATCH ALL ROUTE - NO MATCH FOUND</h1>
                    <p>Requested path: {window.location.pathname}</p>
                    <p>Hash: {window.location.hash}</p>
                    <p>Full URL: {window.location.href}</p>
                    <p>If you see this on /auth/callback, the route is NOT matching!</p>
                  </div>
                }
              />
            </Routes>
          </Router>
        </AdminAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
