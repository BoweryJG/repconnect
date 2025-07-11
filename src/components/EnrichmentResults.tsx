import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EnrichmentEngine, EnrichedLead } from '../lib/enrichment/EnrichmentEngine';
import { supabase } from '../lib/supabase';
import { HottestLeadsShowcase } from './HottestLeadsShowcase';
import { LeadHeatMap } from './LeadHeatMap';

export const EnrichmentResults: React.FC = () => {
  const [enrichedLeads, setEnrichedLeads] = useState<EnrichedLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    loadEnrichedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEnrichedData = async () => {
    setIsLoading(true);
    try {
      const mode = searchParams.get('mode');

      if (mode === 'sample') {
        // Generate sample data
        const sampleLeads = EnrichmentEngine.generateSampleLeads(50);
        const enriched = await EnrichmentEngine.enrichLeads(sampleLeads, undefined, true);
        setEnrichedLeads(enriched);

        // Track analytics
        const sessionId = localStorage.getItem('enrichment_session');
        if (sessionId) {
          await supabase.from('enrichment_analytics').insert({
            session_id: sessionId,
            event_type: 'view_results',
            event_data: { mode: 'sample', count: enriched.length },
          });
        }
      } else {
        // Load from session storage
        const uploadId = sessionStorage.getItem('current_upload_id');
        const rawData = sessionStorage.getItem('enrichment_data');

        if (rawData && uploadId) {
          const parsedData = JSON.parse(rawData);
          const enriched = await EnrichmentEngine.enrichLeads(parsedData, uploadId, true);
          setEnrichedLeads(enriched);

          // Track view event
          await supabase.from('enrichment_analytics').insert({
            upload_id: uploadId,
            event_type: 'view_results',
            event_data: { count: enriched.length },
          });
        }
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const getTopLeads = () => {
    return [...enrichedLeads]
      .sort((a, b) => b.enriched.heatScore - a.enriched.heatScore)
      .slice(0, 10);
  };

  const getSegmentCounts = () => {
    const counts: Record<string, number> = {
      champion: 0,
      'decision-maker': 0,
      researcher: 0,
      'quick-win': 0,
      cold: 0,
    };

    enrichedLeads.forEach((lead) => {
      counts[lead.enriched.segment]++;
    });

    return counts;
  };

  const getAverageScore = () => {
    if (enrichedLeads.length === 0) return 0;
    const sum = enrichedLeads.reduce((acc, lead) => acc + lead.enriched.heatScore, 0);
    return Math.round(sum / enrichedLeads.length);
  };

  const handleExport = async () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enriched-leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Track export
    const uploadId = sessionStorage.getItem('current_upload_id');
    if (uploadId) {
      await supabase.from('enrichment_analytics').insert({
        upload_id: uploadId,
        event_type: 'export',
        event_data: { format: 'csv', count: enrichedLeads.length },
      });
    }
  };

  const generateCSV = () => {
    const headers = [
      'Full Name',
      'Email',
      'Phone',
      'Company',
      'Title',
      'Heat Score',
      'Segment',
      'Company Size',
      'Industry',
      'Location',
      'LinkedIn',
    ];

    const rows = enrichedLeads.map((lead) => [
      lead.enriched.fullName,
      lead.enriched.email,
      lead.enriched.phone,
      lead.enriched.company,
      lead.enriched.title,
      lead.enriched.heatScore,
      lead.enriched.segment,
      lead.enriched.companySize || '',
      lead.enriched.industry || '',
      lead.enriched.location || '',
      lead.enriched.linkedin || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  };

  const handleShare = async () => {
    // Generate shareable link or social media post
    const shareText = `I just enriched ${enrichedLeads.length} leads with Pipeline! Check out my top ${getTopLeads().length} hottest prospects 🔥`;

    if (navigator.share) {
      await navigator.share({
        title: 'My Enriched Leads',
        text: shareText,
        url: window.location.href,
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(shareText);
    }

    // Track share
    const uploadId = sessionStorage.getItem('current_upload_id');
    if (uploadId) {
      await supabase.from('enrichment_analytics').insert({
        upload_id: uploadId,
        event_type: 'share',
        event_data: { method: 'social' },
      });
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Enriching your leads...
          </Typography>
          <LinearProgress sx={{ width: 400, mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Analyzing {enrichedLeads.length || '...'} contacts
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 64 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(180deg, #1a1a1a 0%, transparent 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="xl">
          <div
            style={{
              paddingTop: 24,
              paddingBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/enrich')}
                variant="outlined"
              >
                New Upload
              </Button>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Your Enriched Leads
              </Typography>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <Button startIcon={<ShareIcon />} onClick={handleShare} variant="outlined">
                Share
              </Button>
              <Button startIcon={<DownloadIcon />} onClick={handleExport} variant="outlined">
                Export CSV
              </Button>
              <Button
                startIcon={<SaveIcon />}
                onClick={() => setShowSaveDialog(true)}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                }}
              >
                Save Results
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 3,
                background:
                  'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Enriched
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {enrichedLeads.length}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 3,
                background:
                  'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.2)',
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Average Heat Score
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {getAverageScore()}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 3,
                background:
                  'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Champions Found
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {getSegmentCounts().champion}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 3,
                background:
                  'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Quick Wins
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {getSegmentCounts()['quick-win']}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 4, background: 'transparent' }}>
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            sx={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              '& .MuiTab-root': {
                fontSize: '16px',
                fontWeight: 500,
              },
            }}
          >
            <Tab label="🔥 Hottest 10" />
            <Tab label="📊 Heat Map" />
            <Tab label="📋 All Leads" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {selectedTab === 0 && (
            <motion.div
              key="hottest"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <HottestLeadsShowcase leads={getTopLeads()} />
            </motion.div>
          )}

          {selectedTab === 1 && (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <LeadHeatMap leads={enrichedLeads} />
            </motion.div>
          )}

          {selectedTab === 2 && (
            <motion.div
              key="all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Paper
                sx={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Heat Score</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Company</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Segment</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {enrichedLeads.map((lead, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <LinearProgress
                                variant="determinate"
                                value={lead.enriched.heatScore}
                                sx={{
                                  width: 60,
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    background:
                                      lead.enriched.heatScore > 80
                                        ? 'linear-gradient(90deg, #ff6b6b 0%, #ff0040 100%)'
                                        : lead.enriched.heatScore > 60
                                          ? 'linear-gradient(90deg, #ffd43b 0%, #ff8800 100%)'
                                          : 'linear-gradient(90deg, #4ecdc4 0%, #00d4ff 100%)',
                                  },
                                }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {lead.enriched.heatScore}
                              </Typography>
                            </div>
                          </TableCell>
                          <TableCell>{lead.enriched.fullName}</TableCell>
                          <TableCell>{lead.enriched.email}</TableCell>
                          <TableCell>
                            <div>
                              <Typography variant="body2">{lead.enriched.company}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {lead.enriched.companySize} • {lead.enriched.industry}
                              </Typography>
                            </div>
                          </TableCell>
                          <TableCell>{lead.enriched.title}</TableCell>
                          <TableCell>
                            <Chip
                              label={lead.enriched.segment}
                              size="small"
                              color={
                                lead.enriched.segment === 'champion'
                                  ? 'error'
                                  : lead.enriched.segment === 'decision-maker'
                                    ? 'warning'
                                    : lead.enriched.segment === 'researcher'
                                      ? 'info'
                                      : lead.enriched.segment === 'quick-win'
                                        ? 'success'
                                        : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Tooltip title="Email">
                                <IconButton size="small">
                                  <EmailIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Call">
                                <IconButton size="small">
                                  <PhoneIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {lead.enriched.linkedin && (
                                <Tooltip title="LinkedIn">
                                  <IconButton
                                    size="small"
                                    onClick={() => window.open(lead.enriched.linkedin, '_blank')}
                                  >
                                    <LinkedInIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
        <DialogTitle>Save Your Enriched Leads</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Create a free account to:
          </Typography>
          <div style={{ paddingLeft: 16 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ Save and access your enriched leads anytime
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ Track engagement over time
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ Get 100 free enrichments every month
            </Typography>
            <Typography variant="body2">✓ Connect to your CRM</Typography>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Maybe Later</Button>
          <Button
            variant="contained"
            onClick={() => navigate('/auth')}
            sx={{
              background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
            }}
          >
            Create Free Account
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
