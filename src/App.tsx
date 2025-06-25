import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Container,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CloseIcon from '@mui/icons-material/Close';
import SyncIcon from '@mui/icons-material/Sync';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { AnimatePresence, motion } from 'framer-motion';
import { premiumTheme } from './theme/premiumTheme';
import { DigitalRolodex } from './components/DigitalRolodex';
import { CallInterface } from './components/CallInterface';
import { PremiumGradientBackground } from './components/effects/PremiumGradientBackground';
import { VirtualizedContactGrid } from './components/VirtualizedContactGrid';
import { QuantumDialer } from './components/QuantumDialer';
import { PremiumNavbar } from './components/PremiumNavbar';
import { twilioService } from './services/twilioService';
import { supabase } from './lib/supabase';
import { useStore } from './store/useStore';
import { adaptiveRenderer } from './lib/performance/AdaptiveRenderer';
import { MissionControlDashboard } from './components/MissionControlDashboard';
import { SyncDashboard } from './components/SyncDashboard';
import { useResponsive } from './hooks/useResponsive';
import { createBezelCard, withBezelDesign, getScrewStyles } from './theme/premiumBezel';

function App() {
  const { isMobile } = useResponsive();
  const [showDialer, setShowDialer] = useState(false);
  const [showMissionControl, setShowMissionControl] = useState(false);
  const [showSyncDashboard, setShowSyncDashboard] = useState(false);
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

  const handleDialNumber = async (phoneNumber: string) => {
    setCallInProgress(true);
    setActiveCall({
      id: crypto.randomUUID(),
      contactId: '',
      phoneNumber: phoneNumber,
      duration: 0,
      timestamp: new Date(),
      type: 'outgoing',
    });

    try {
      await twilioService.makeCall(phoneNumber);
      
      // Log to Supabase
      await supabase.from('calls').insert({
        phone_number: phoneNumber,
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
      <div
        style={{
          minHeight: '100vh',
          position: 'relative',
          overflowX: 'hidden',
          background: '#0A0A0B',
        }}
      >
        {/* Premium Gradient Background */}
        <PremiumGradientBackground variant="aurora" />
        
        {/* Main App */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <PremiumNavbar 
            onDialerOpen={() => setShowDialer(true)}
            aiEnabled={aiEnabled}
            onAIToggle={toggleAI}
          />
          
          <Container maxWidth="xl" sx={{ mt: { xs: 8, sm: 12 }, pb: { xs: 4, sm: 8 }, px: { xs: 1, sm: 3 } }}>
            {/* Add Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box
                sx={{
                  ...createBezelCard(premiumTheme, {
                    showScrews: true,
                    showEdgeMounts: true,
                    glassEffect: true,
                    colorTheme: {
                      impossible: '99, 102, 241',
                      shift: '236, 72, 153',
                      deep: '139, 92, 246'
                    },
                    elevation: 1
                  }),
                  padding: isMobile ? '16px' : '32px',
                  marginBottom: isMobile ? '16px' : '32px',
                }}
              >
                {/* Bezel Screws */}
                <Box className="bezel-screws">
                  {[1, 2, 3, 4].map((idx) => (
                    <Box key={idx} sx={{ ...getScrewStyles(premiumTheme, {}, '10deg').wrapper }}>
                      <Box sx={{ ...getScrewStyles(premiumTheme, {}, '10deg').screw }}>
                        <Box sx={{ ...getScrewStyles(premiumTheme, {}, '10deg').jewel }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
                
                {/* Edge Mounts */}
                <Box className="bezel-edge-left" />
                <Box className="bezel-edge-right" />
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #D1D5DB 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Quick Add Contact
                </Typography>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '12px' : '16px', 
                  marginTop: isMobile ? '16px' : '24px' 
                }}>
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
                    fullWidth={isMobile}
                    sx={{ 
                      px: { xs: 3, sm: 4 },
                      py: { xs: 1.5, sm: 1.5 },
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
                </div>
              </Box>
            </motion.div>
            
            {/* View Mode Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
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
                </div>
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
              </div>
            </motion.div>
            
            {/* Contacts Display */}
            <Box
              sx={{
                ...createBezelCard(premiumTheme, {
                  showScrews: true,
                  showEdgeMounts: true,
                  glassEffect: true,
                  colorTheme: {
                    impossible: '255, 0, 255',
                    shift: '0, 255, 255',
                    deep: '255, 0, 170'
                  },
                  elevation: 2
                }),
                padding: 0,
                height: 'calc(100vh - 350px)',
                minHeight: 600,
              }}
            >
              {/* Bezel Screws */}
              <Box className="bezel-screws">
                {[1, 2, 3, 4].map((idx) => (
                  <Box key={idx} sx={{ ...getScrewStyles(premiumTheme, {}, '10deg').wrapper }}>
                    <Box sx={{ ...getScrewStyles(premiumTheme, {}, '10deg').screw }}>
                      <Box sx={{ ...getScrewStyles(premiumTheme, {}, '10deg').jewel }} />
                    </Box>
                  </Box>
                ))}
              </Box>
              
              {/* Edge Mounts */}
              <Box className="bezel-edge-left" />
              <Box className="bezel-edge-right" />
              
              {viewMode === 'rolodex' ? (
                <Box sx={{ height: '100%', p: 3 }}>
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
                    height: '100%',
                    width: '100%',
                    p: 3,
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
            </Box>
            
            {contacts.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Box
                  sx={{
                    ...createBezelCard(premiumTheme, {
                      showScrews: true,
                      showEdgeMounts: false,
                      glassEffect: true,
                      colorTheme: {
                        impossible: '99, 102, 241',
                        shift: '236, 72, 153',
                        deep: '139, 92, 246'
                      },
                      elevation: 1
                    }),
                    textAlign: 'center',
                    padding: '96px 32px',
                    maxWidth: '600px',
                    margin: '0 auto',
                  }}
                >
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 32px auto',
                      boxShadow: '0 20px 60px rgba(99, 102, 241, 0.4)',
                    }}
                  >
                    <AutoAwesomeIcon sx={{ fontSize: 60, color: 'white' }} />
                  </div>
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
                  
                  {/* Bezel Screws */}
                  <Box className="bezel-screws">
                    {[1, 2, 3, 4].map((idx) => (
                      <Box key={idx} sx={{ ...getScrewStyles(premiumTheme, {}, '10deg').wrapper }}>
                        <Box sx={{ ...getScrewStyles(premiumTheme, {}, '10deg').screw }}>
                          <Box sx={{ ...getScrewStyles(premiumTheme, {}, '10deg').jewel }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </motion.div>
            )}
          </Container>
        </div>
        
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

        {/* Quantum Dialer */}
        <QuantumDialer
          isOpen={showDialer}
          onClose={() => setShowDialer(false)}
          onDial={handleDialNumber}
        />

        {/* Mission Control Dashboard */}
        <MissionControlDashboard
          isOpen={showMissionControl}
          onClose={() => setShowMissionControl(false)}
        />

        {/* Sync Dashboard Modal */}
        <AnimatePresence>
          {showSyncDashboard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1300,
                background: 'rgba(0, 0, 0, 0.8)',
              }}
              onClick={() => setShowSyncDashboard(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#0a0a0a',
                  overflow: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <IconButton
                  onClick={() => setShowSyncDashboard(false)}
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1,
                    background: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.2)',
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
                <SyncDashboard />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
}

export default App;