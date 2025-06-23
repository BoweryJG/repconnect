import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import { AnimatePresence } from 'framer-motion';
import { theme } from './theme';
import { ContactCard3D } from './components/ContactCard3D';
import { DigitalRolodex } from './components/DigitalRolodex';
import { CallInterface } from './components/CallInterface';
import { AdaptiveGradientBackground } from './components/effects/AdaptiveGradientBackground';
import { VirtualizedContactGrid } from './components/VirtualizedContactGrid';
import { twilioService } from './services/twilioService';
import { supabase } from './lib/supabase';
import { useStore } from './store/useStore';
import { glassmorphism } from './theme/glassmorphism';
import { adaptiveRenderer } from './lib/performance/AdaptiveRenderer';
import { performanceMonitor } from './lib/performance/PerformanceMonitor';
import { PerformanceDashboard } from './components/PerformanceDashboard';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [viewMode, setViewMode] = useState<'rolodex' | 'grid'>('rolodex');
  const [renderQuality, setRenderQuality] = useState<'ultra' | 'high' | 'medium' | 'low'>('high');
  const [gridDimensions, setGridDimensions] = useState({ width: 1200, height: 600 });
  const gridContainerRef = useRef<HTMLDivElement>(null);
  
  const {
    contacts,
    addContact,
    activeCall,
    setActiveCall,
    isCallInProgress,
    setCallInProgress,
    aiEnabled,
    toggleAI,
    transcriptionEnabled,
    toggleTranscription,
  } = useStore();

  // Load contacts from Supabase on mount
  const loadContacts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); // Add limit to avoid loading 5000+ contacts at once
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Loaded contacts:', data?.length || 0);
      console.log('First contact:', data?.[0]); // Debug first contact
      
      // Clear existing contacts first to avoid duplicates
      
      // Add contacts to store
      data?.forEach(contact => {
        const contactData = {
          name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown',
          phoneNumber: contact.phone_number || contact.cell || '',
          email: contact.email,
          notes: contact.notes || `${contact.summary || ''}\n${contact.tech_interests || ''}`.trim(),
          tags: [
            contact.specialty,
            contact.lead_tier,
            contact.contact_priority,
            contact.territory
          ].filter(Boolean),
        };
        console.log('Adding contact:', contactData.name); // Debug each contact
        addContact(contactData);
      });
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  }, [addContact]);

  useEffect(() => {
    console.log('useEffect running, calling loadContacts...');
    loadContacts();
  }, [loadContacts]);

  // Initialize adaptive renderer
  useEffect(() => {
    // Subscribe to quality changes
    const unsubscribe = adaptiveRenderer.subscribe((settings) => {
      // Map quality settings to simple quality level
      if (settings.particleCount >= 5000) {
        setRenderQuality('ultra');
      } else if (settings.particleCount >= 3000) {
        setRenderQuality('high');
      } else if (settings.particleCount >= 1500) {
        setRenderQuality('medium');
      } else {
        setRenderQuality('low');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Setup resize observer for grid dimensions
  useEffect(() => {
    if (!gridContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setGridDimensions({ width, height });
      }
    });

    resizeObserver.observe(gridContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [viewMode]);

  const handleMakeCall = async (contact: any) => {
    setCallInProgress(true);
    setActiveCall({
      id: crypto.randomUUID(),
      contactId: contact.id,
      phoneNumber: contact.phoneNumber,
      duration: 0,
      timestamp: new Date(),
      type: 'outgoing',
    });

    try {
      await twilioService.makeCall(contact.phoneNumber);
      
      // Log to Supabase
      await supabase.from('calls').insert({
        contact_id: contact.id,
        phone_number: contact.phoneNumber,
        type: 'outgoing',
        status: 'initiated',
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error making call:', error);
      setCallInProgress(false);
      setActiveCall(null);
    }
  };

  const handleEndCall = () => {
    setCallInProgress(false);
    setActiveCall(null);
  };

  const handleAddContact = async () => {
    if (newContactName && newContactPhone) {
      try {
        // Split name into first and last name
        const nameParts = newContactName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Insert into Supabase
        const { error } = await supabase
          .from('contacts')
          .insert({
            first_name: firstName,
            last_name: lastName,
            phone_number: newContactPhone,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Add to local store
        addContact({
          name: newContactName,
          phoneNumber: newContactPhone,
        });
        
        setNewContactName('');
        setNewContactPhone('');
      } catch (error) {
        console.error('Error adding contact:', error);
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
          position: 'relative',
          overflowX: 'hidden',
        }}
      >
        {/* Adaptive Gradient Background */}
        <AdaptiveGradientBackground quality={renderQuality} />
        
        {/* Performance Dashboard */}
        <PerformanceDashboard />
        
        {/* Main App */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <AppBar
            position="static"
            elevation={0}
            sx={{
              ...glassmorphism.dark,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
                RepConnect Ultra
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={aiEnabled}
                    onChange={toggleAI}
                    color="primary"
                  />
                }
                label="AI"
                sx={{ mr: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={transcriptionEnabled}
                    onChange={toggleTranscription}
                    color="secondary"
                  />
                }
                label="Transcription"
                sx={{ mr: 2 }}
              />
              
              <Button
                startIcon={<SettingsIcon />}
                onClick={() => setShowSettings(!showSettings)}
                sx={{ color: 'white' }}
              >
                Settings
              </Button>
            </Toolbar>
          </AppBar>
          
          <Container maxWidth="xl" sx={{ mt: 4, pb: 8 }}>
            {/* Add Contact Section */}
            <Box
              sx={{
                ...glassmorphism.dark,
                padding: 3,
                borderRadius: 2.5,
                mb: 4,
              }}
            >
              <Typography variant="h5" gutterBottom fontWeight="600">
                Quick Add Contact
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <TextField
                  label="Name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Phone Number"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddContact}
                  disabled={!newContactName || !newContactPhone}
                  sx={{ px: 4 }}
                >
                  Add
                </Button>
              </Box>
            </Box>
            
            {/* View Mode Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" fontWeight="700">
                Your Contacts ({contacts.length})
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setViewMode(viewMode === 'rolodex' ? 'grid' : 'rolodex')}
                sx={{ 
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                {viewMode === 'rolodex' ? 'Grid View' : 'Rolodex View'}
              </Button>
            </Box>
            
            {/* Contacts Display */}
            {viewMode === 'rolodex' ? (
              <Box sx={{ height: 'calc(100vh - 350px)', minHeight: 600 }}>
                <DigitalRolodex
                  contacts={contacts}
                  onCall={handleMakeCall}
                  onToggleFavorite={(contact) => {
                    // TODO: Implement favorite toggle
                    console.log('Toggle favorite:', contact);
                  }}
                />
              </Box>
            ) : (
              <Box 
                ref={gridContainerRef}
                sx={{ 
                  height: 'calc(100vh - 350px)', 
                  minHeight: 600,
                  width: '100%',
                }}
              >
                <VirtualizedContactGrid
                  contacts={contacts}
                  onContactClick={handleMakeCall}
                  selectedContactId={activeCall?.contactId}
                  width={gridDimensions.width}
                  height={gridDimensions.height}
                />
              </Box>
            )}
            
            {contacts.length === 0 && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 8,
                  opacity: 0.5,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  No contacts yet
                </Typography>
                <Typography variant="body2">
                  Add your first contact to get started
                </Typography>
              </Box>
            )}
          </Container>
        </Box>
        
        {/* Call Interface Overlay */}
        <AnimatePresence>
          {isCallInProgress && activeCall && (
            <CallInterface
              contact={{
                name: contacts.find(c => c.id === activeCall.contactId)?.name || 'Unknown',
                phoneNumber: activeCall.phoneNumber,
                avatar: contacts.find(c => c.id === activeCall.contactId)?.avatar,
              }}
              onEndCall={handleEndCall}
            />
          )}
        </AnimatePresence>
      </Box>
    </ThemeProvider>
  );
}

export default App;