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
            
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
};