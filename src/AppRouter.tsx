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

export const AppRouter: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={premiumTheme}>
        <CssBaseline />
        <Router>
          <Routes>
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

            {/* Auth callback route */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Audio test route for debugging */}
            <Route path="/test/audio" element={<AudioTestComponent />} />

            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
