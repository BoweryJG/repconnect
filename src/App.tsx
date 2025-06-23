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
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { AnimatePresence, motion } from 'framer-motion';
import { premiumTheme } from './theme/premiumTheme';
import { DigitalRolodex } from './components/DigitalRolodex';
import { CallInterface } from './components/CallInterface';
import { PremiumGradientBackground } from './components/effects/PremiumGradientBackground';
import { VirtualizedContactGrid } from './components/VirtualizedContactGrid';
import { twilioService } from './services/twilioService';
import { supabase } from './lib/supabase';
import { useStore } from './store/useStore';
import { adaptiveRenderer } from './lib/performance/AdaptiveRenderer';
import { PerformanceDashboard } from './components/PerformanceDashboard';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [viewMode, setViewMode] = useState<'rolodex' | 'grid'>('rolodex');
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
    const unsubscribe = adaptiveRenderer.subscribe(() => {
      // Quality changes are handled internally by the renderer
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
    <ThemeProvider theme={premiumTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          position: 'relative',
          overflowX: 'hidden',
          background: '#0A0A0B',
        }}
      >
        {/* Premium Gradient Background */}
        <PremiumGradientBackground variant="aurora" />
        
        {/* Performance Dashboard */}
        <PerformanceDashboard />
        
        {/* Main App */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              background: 'rgba(10, 10, 11, 0.8)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            }}
          >
            <Toolbar sx={{ py: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                <AutoAwesomeIcon sx={{ color: '#6366F1', fontSize: 32 }} />
                <Typography 
                  variant="h5" 
                  component={motion.div}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  sx={{ 
                    fontWeight: 800,
                    fontSize: '1.75rem',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #6366F1 50%, #EC4899 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '200% 200%',
                    animation: 'gradient 3s ease infinite',
                    '@keyframes gradient': {
                      '0%': { backgroundPosition: '0% 50%' },
                      '50%': { backgroundPosition: '100% 50%' },
                      '100%': { backgroundPosition: '0% 50%' },
                    },
                  }}
                >
                  RepConnect Ultra
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  p: 1, 
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                  <Tooltip title="AI Assistant">
                    <IconButton
                      onClick={toggleAI}
                      sx={{
                        color: aiEnabled ? '#6366F1' : 'text.secondary',
                        background: aiEnabled ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        '&:hover': {
                          background: aiEnabled ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        },
                      }}
                    >
                      <AutoAwesomeIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Transcription">
                    <IconButton
                      onClick={toggleTranscription}
                      sx={{
                        color: transcriptionEnabled ? '#EC4899' : 'text.secondary',
                        background: transcriptionEnabled ? 'rgba(236, 72, 153, 0.1)' : 'transparent',
                        '&:hover': {
                          background: transcriptionEnabled ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        },
                      }}
                    >
                      <DashboardIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Button
                  startIcon={<SettingsIcon />}
                  onClick={() => setShowSettings(!showSettings)}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.15) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    px: 3,
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(236, 72, 153, 0.25) 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 32px 0 rgba(99, 102, 241, 0.4)',
                    },
                  }}
                >
                  Settings
                </Button>
              </Box>
            </Toolbar>
          </AppBar>
          
          <Container maxWidth="xl" sx={{ mt: 12, pb: 8 }}>
            {/* Add Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box
                sx={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                  padding: 4,
                  borderRadius: 3,
                  mb: 4,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -2,
                    left: -2,
                    right: -2,
                    bottom: -2,
                    background: 'linear-gradient(135deg, #6366F1, #EC4899, #3B82F6)',
                    backgroundSize: '300% 300%',
                    borderRadius: 'inherit',
                    opacity: 0.4,
                    filter: 'blur(10px)',
                    zIndex: -1,
                  },
                }}
              >
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #D1D5DB 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Quick Add Contact
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <TextField
                    label="Name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    sx={{ 
                      flex: 1,
                      '& .MuiInputLabel-root': {
                        color: 'text.secondary',
                      },
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.02)',
                        backdropFilter: 'blur(10px)',
                        '& input': {
                          color: 'text.primary',
                        },
                      },
                    }}
                  />
                  <TextField
                    label="Phone Number"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    sx={{ 
                      flex: 1,
                      '& .MuiInputLabel-root': {
                        color: 'text.secondary',
                      },
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.02)',
                        backdropFilter: 'blur(10px)',
                        '& input': {
                          color: 'text.primary',
                        },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddContact}
                    disabled={!newContactName || !newContactPhone}
                    sx={{ 
                      px: 4,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                      boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #818CF8 0%, #F472B6 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(99, 102, 241, 0.4)',
                      },
                      '&:disabled': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'text.disabled',
                      },
                    }}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
            </motion.div>
            
            {/* View Mode Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #6366F1 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}
                  >
                    Your Contacts
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: 'text.secondary',
                      fontWeight: 500,
                    }}
                  >
                    {contacts.length} connections
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={viewMode === 'rolodex' ? <ViewModuleIcon /> : <DashboardIcon />}
                  onClick={() => setViewMode(viewMode === 'rolodex' ? 'grid' : 'rolodex')}
                  sx={{ 
                    background: 'rgba(99, 102, 241, 0.1)',
                    backdropFilter: 'blur(10px)',
                    px: 3,
                    py: 1.5,
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: '#6366F1',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: '#6366F1',
                      background: 'rgba(99, 102, 241, 0.2)',
                      boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
                    }
                  }}
                >
                  {viewMode === 'rolodex' ? 'Grid View' : 'Rolodex View'}
                </Button>
              </Box>
            </motion.div>
            
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
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 12,
                    px: 4,
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 4,
                    maxWidth: 600,
                    mx: 'auto',
                  }}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 4,
                      boxShadow: '0 20px 60px rgba(99, 102, 241, 0.4)',
                    }}
                  >
                    <AutoAwesomeIcon sx={{ fontSize: 60, color: 'white' }} />
                  </Box>
                  <Typography 
                    variant="h5" 
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #D1D5DB 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    No contacts yet
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                    Add your first contact to get started with RepConnect Ultra
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => document.querySelector('input')?.focus()}
                    sx={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                      px: 4,
                      py: 1.5,
                      boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(99, 102, 241, 0.4)',
                      },
                    }}
                  >
                    Add First Contact
                  </Button>
                </Box>
              </motion.div>
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