import React, { useState, useEffect, useCallback } from 'react';
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
import { SimpleGradientBackground } from './components/effects/SimpleGradientBackground';
import { twilioService } from './services/twilioService';
import { supabase } from './lib/supabase';
import { useStore } from './store/useStore';
import { glassmorphism } from './theme/glassmorphism';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [viewMode, setViewMode] = useState<'rolodex' | 'grid'>('rolodex');
  
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
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Add contacts to store
      data?.forEach(contact => {
        addContact({
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
        });
      });
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  }, [addContact]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

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
        {/* Simple Gradient Background */}
        <SimpleGradientBackground />
        
        {/* Performance Dashboard - Disabled */}
        {/* <PerformanceDashboard /> */}
        
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
              <>
                <Grid container spacing={3}>
                  {contacts.slice(0, 100).map((contact) => (
                    <Grid item xs={12} sm={6} md={4} key={contact.id}>
                      <ContactCard3D
                        contact={contact}
                        onCall={() => handleMakeCall(contact)}
                      />
                    </Grid>
                  ))}
                </Grid>
                {contacts.length > 100 && (
                  <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, opacity: 0.7 }}>
                    Showing first 100 contacts. Use Rolodex view to see all {contacts.length} contacts.
                  </Typography>
                )}
              </>
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