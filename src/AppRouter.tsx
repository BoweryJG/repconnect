import React, { useEffect } from 'react';
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
import AudioTestComponent from './components/AudioTestComponent';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AgentEditor from './components/admin/AgentEditor';
import AdminRoute from './components/admin/AdminRoute';
import { AuthProvider } from './auth/AuthContext';
import { UnifiedAuthWrapper } from './auth/UnifiedAuthWrapper';
import { initializeUnifiedAuth } from './auth/initializeUnifiedAuth';

export const AppRouter: React.FC = () => {
  // Initialize unified auth on mount
  useEffect(() => {
    initializeUnifiedAuth();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={premiumTheme}>
        <CssBaseline />
        <Router>
          <UnifiedAuthWrapper>
            <AuthProvider>
              <AdminAuthProvider>
                <Routes>
                  {/* Auth callback is now handled by static HTML before React loads */}

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

                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AdminAuthProvider>
            </AuthProvider>
          </UnifiedAuthWrapper>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
