import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { EnrichedContact } from '../lib/mockData/enrichmentGenerator';
import { getEnrichedPublicContacts } from '../lib/mockData/enrichPublicContacts';
import { EnrichedContactCard } from './EnrichedContactCard';

export const PublicEnrichedDemo: React.FC = () => {
  const [contacts, setContacts] = useState<EnrichedContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<EnrichedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSegment, setFilterSegment] = useState('all');
  const [filterSpecialization, setFilterSpecialization] = useState('all');
  const [sortBy, setSortBy] = useState<'heatScore' | 'rating' | 'name'>('heatScore');

  useEffect(() => {
    loadEnrichedContacts();
  }, []);

  useEffect(() => {
    filterAndSortContacts();
  }, [contacts, searchQuery, filterSegment, filterSpecialization, sortBy, selectedTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEnrichedContacts = async () => {
    try {
      const enrichedData = await getEnrichedPublicContacts();
      setContacts(enrichedData);
    } catch (error) {
          } finally {
      setLoading(false);
    }
  };

  const filterAndSortContacts = () => {
    let filtered = [...contacts];

    // Tab filtering
    if (selectedTab === 1) { // Hot Leads
      filtered = filtered.filter(c => c.heatScore >= 80);
    } else if (selectedTab === 2) { // Champions
      filtered = filtered.filter(c => c.segment === 'champion');
    } else if (selectedTab === 3) { // Accepting Patients
      filtered = filtered.filter(c => c.acceptingNewPatients);
    }

    // Search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.practice_name.toLowerCase().includes(query) ||
        c.specialization.toLowerCase().includes(query) ||
        c.city.toLowerCase().includes(query)
      );
    }

    // Segment filtering
    if (filterSegment !== 'all') {
      filtered = filtered.filter(c => c.segment === filterSegment);
    }

    // Specialization filtering
    if (filterSpecialization !== 'all') {
      filtered = filtered.filter(c => c.specialization === filterSpecialization);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'heatScore':
          return b.heatScore - a.heatScore;
        case 'rating':
          return b.overallRating - a.overallRating;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredContacts(filtered);
  };

  const getStats = () => {
    return {
      total: contacts.length,
      avgHeatScore: Math.round(contacts.reduce((sum, c) => sum + c.heatScore, 0) / contacts.length),
      avgRating: (contacts.reduce((sum, c) => sum + c.overallRating, 0) / contacts.length).toFixed(1),
      champions: contacts.filter(c => c.segment === 'champion').length,
      acceptingPatients: contacts.filter(c => c.acceptingNewPatients).length,
      withTelehealth: contacts.filter(c => c.telehealth).length
    };
  };

  const getSpecializations = () => {
    const specs = new Set(contacts.map(c => c.specialization));
    return Array.from(specs).sort();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </div>
    );
  }

  const stats = getStats();

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingTop: 32, paddingBottom: 32 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              Enriched Medical & Dental Professionals
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              Explore our comprehensive database of {stats.total} fully enriched healthcare contacts
            </Typography>
            <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
              This is a demo showcasing our enrichment capabilities. Sign up to enrich your own contacts!
            </Alert>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              textAlign: 'center'
            }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total Contacts</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, rgba(255, 0, 64, 0.1) 0%, rgba(255, 0, 64, 0.05) 100%)',
              border: '1px solid rgba(255, 0, 64, 0.2)',
              textAlign: 'center'
            }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.avgHeatScore}</Typography>
              <Typography variant="body2" color="text.secondary">Avg Heat Score</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              textAlign: 'center'
            }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.avgRating}</Typography>
              <Typography variant="body2" color="text.secondary">Avg Rating</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              textAlign: 'center'
            }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.champions}</Typography>
              <Typography variant="body2" color="text.secondary">Champions</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              textAlign: 'center'
            }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.acceptingPatients}</Typography>
              <Typography variant="body2" color="text.secondary">Accepting New</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
              border: '1px solid rgba(147, 51, 234, 0.2)',
              textAlign: 'center'
            }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.withTelehealth}</Typography>
              <Typography variant="body2" color="text.secondary">Telehealth</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Paper sx={{ 
          p: 3, 
          mb: 3,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by name, practice, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Segment</InputLabel>
                <Select
                  value={filterSegment}
                  onChange={(e) => setFilterSegment(e.target.value)}
                  label="Segment"
                >
                  <MenuItem value="all">All Segments</MenuItem>
                  <MenuItem value="champion">Champions</MenuItem>
                  <MenuItem value="decision-maker">Decision Makers</MenuItem>
                  <MenuItem value="researcher">Researchers</MenuItem>
                  <MenuItem value="quick-win">Quick Wins</MenuItem>
                  <MenuItem value="cold">Cold</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Specialization</InputLabel>
                <Select
                  value={filterSpecialization}
                  onChange={(e) => setFilterSpecialization(e.target.value)}
                  label="Specialization"
                >
                  <MenuItem value="all">All Specializations</MenuItem>
                  {getSpecializations().map(spec => (
                    <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  label="Sort By"
                >
                  <MenuItem value="heatScore">Heat Score</MenuItem>
                  <MenuItem value="rating">Rating</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadIcon />}
                disabled
              >
                Export (Pro)
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 3, background: 'transparent' }}>
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            sx={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              '& .MuiTab-root': {
                fontSize: '16px',
                fontWeight: 500
              }
            }}
          >
            <Tab label={`All Contacts (${contacts.length})`} />
            <Tab 
              label={`🔥 Hot Leads (${contacts.filter(c => c.heatScore >= 80).length})`} 
              icon={<Chip size="small" label="Popular" color="error" />}
              iconPosition="end"
            />
            <Tab label={`👑 Champions (${stats.champions})`} />
            <Tab label={`✅ Accepting New (${stats.acceptingPatients})`} />
          </Tabs>
        </Paper>

        {/* Results Count */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Showing {filteredContacts.length} of {contacts.length} contacts
          </Typography>
          <Button
            variant="contained"
            startIcon={<TrendingUpIcon />}
            sx={{
              background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)'
            }}
          >
            Unlock All Features
          </Button>
        </div>

        {/* Contact Cards */}
        <AnimatePresence mode="wait">
          <Grid container spacing={3}>
            {filteredContacts.map((contact, index) => (
              <Grid item xs={12} md={6} lg={4} key={contact.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <EnrichedContactCard contact={contact} />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </AnimatePresence>

        {filteredContacts.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 64, paddingBottom: 64 }}>
            <Typography variant="h6" color="text.secondary">
              No contacts match your current filters
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => {
                setSearchQuery('');
                setFilterSegment('all');
                setFilterSpecialization('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
};