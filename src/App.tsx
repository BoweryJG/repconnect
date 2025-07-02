import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Button,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { AnimatePresence, motion } from 'framer-motion';
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
import { SyncDashboard } from './components/SyncDashboard';
import { AISettings } from './components/AISettings';
import { PerformanceHistory } from './components/PerformanceHistory';
import { useResponsive } from './hooks/useResponsive';
import { CallHistoryDashboard } from './components/CallHistoryDashboard';
import { CompactEnrichmentWidget } from './components/CompactEnrichmentWidget';

// Lazy load heavy components
const MissionControlDashboard = React.lazy(() => import('./components/MissionControlDashboard').then(module => ({ default: module.MissionControlDashboard })));

function App() {
  const { isMobile } = useResponsive();
  const [showDialer, setShowDialer] = useState(false);
  const [showMissionControl, setShowMissionControl] = useState(false);
  const [showSyncDashboard, setShowSyncDashboard] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
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
        .order('created_at', { ascending: false });
      
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
    // Format the phone number to ensure it has country code
    let formattedNumber = contact.phoneNumber.replace(/\D/g, '');
    if (!formattedNumber.startsWith('1') && formattedNumber.length === 10) {
      formattedNumber = '1' + formattedNumber;
    }
    formattedNumber = '+' + formattedNumber;
    
    setCallInProgress(true);
    setActiveCall({
      id: crypto.randomUUID(),
      contactId: contact.id,
      phoneNumber: formattedNumber,
      duration: 0,
      timestamp: new Date(),
      type: 'outgoing',
    });

    try {
      await twilioService.makeCall(formattedNumber);
      
      // Log to Supabase
      await supabase.from('calls').insert({
        contact_id: contact.id,
        phone_number: formattedNumber,
        type: 'outgoing',
        status: 'initiated',
        created_at: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error making call:', error);
      setCallInProgress(false);
      setActiveCall(null);
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.error || error.response?.data?.details?.error || error.message || 'Unknown error';
      alert(`Call failed: ${errorMessage}\n\nPlease check:\n- Phone number is valid\n- Twilio account is active\n- Backend server is running`);
    }
  };

  const handleDialNumber = async (phoneNumber: string) => {
    console.log('🔍 [APP DEBUG] Starting dial process for:', phoneNumber);
    
    // Format the phone number to ensure it has country code
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    if (!formattedNumber.startsWith('1') && formattedNumber.length === 10) {
      formattedNumber = '1' + formattedNumber;
    }
    formattedNumber = '+' + formattedNumber;
    
    console.log('🔍 [APP DEBUG] Formatted number:', formattedNumber);
    
    setCallInProgress(true);
    setActiveCall({
      id: crypto.randomUUID(),
      contactId: '',
      phoneNumber: formattedNumber,
      duration: 0,
      timestamp: new Date(),
      type: 'outgoing',
    });

    try {
      console.log('🔍 [APP DEBUG] Calling twilioService.makeCall...');
      const result = await twilioService.makeCall(
        formattedNumber,
        undefined,
        undefined,
        { enableStream: true } // Enable real-time transcription
      );
      
      console.log('✅ [APP DEBUG] Call initiated successfully:', result);
      
      // Update activeCall with the call SID for transcription
      if (result.call && result.call.sid) {
        setActiveCall({
          ...activeCall!,
          callSid: result.call.sid
        });
      }
      
      // Log to Supabase
      await supabase.from('calls').insert({
        phone_number: formattedNumber,
        type: 'outgoing',
        status: 'initiated',
        created_at: new Date().toISOString(),
        call_sid: result.call?.sid
      });
      
      console.log('✅ [APP DEBUG] Call logged to database');
      
      // Close dialer on success
      setShowDialer(false);
    } catch (error: any) {
      console.error('❌ [APP DEBUG] Call failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setCallInProgress(false);
      setActiveCall(null);
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.error || error.response?.data?.details?.error || error.message || 'Unknown error';
      alert(`Call failed: ${errorMessage}\n\nPlease check:\n- Phone number is valid\n- Twilio account is active\n- Backend server is running`);
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
            onSyncDashboardOpen={() => setShowSyncDashboard(true)}
            onMissionControlOpen={() => setShowMissionControl(true)}
            onAISettingsOpen={() => setShowAISettings(true)}
            onPerformanceOpen={() => setShowPerformance(true)}
            onCallHistoryOpen={() => setShowCallHistory(true)}
          />
          
          <div style={{ padding: isMobile ? '8px' : '12px', paddingTop: isMobile ? '80px' : '96px' }}>
            <Container maxWidth="xl" sx={{ pb: { xs: 4, sm: 8 }, px: { xs: 2, sm: 4 } }}>
            {/* Add Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div
                style={{
                  position: 'relative',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  background: `linear-gradient(135deg,
                    rgba(26, 26, 26, 0.95) 0%,
                    rgba(30, 30, 30, 0.9) 25%,
                    rgba(28, 28, 28, 0.88) 50%,
                    rgba(30, 30, 30, 0.9) 75%,
                    rgba(26, 26, 26, 0.95) 100%
                  )`,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '24px',
                  boxShadow: `
                    0 4px 16px rgba(0, 0, 0, 0.2),
                    0 0 20px rgba(236, 72, 153, 0.08),
                    0 2px 10px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.06),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                  `,
                  overflow: 'hidden',
                  transformStyle: 'preserve-3d',
                  padding: isMobile ? '16px' : '32px',
                  marginBottom: isMobile ? '16px' : '32px',
                }}
              >
                {/* Bezel Screws */}
                <div className="bezel-screws">
                  {[
                    { top: 12, left: 12 },
                    { top: 12, right: 12 },
                    { bottom: 12, left: 12 },
                    { bottom: 12, right: 12 }
                  ].map((pos, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'absolute',
                        ...pos,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.15) 40%, transparent 70%)',
                        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5), inset 0 -1px 1px rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          background: 'radial-gradient(circle at 35% 35%, #e0e0e0 0%, #888 40%, #222 100%)',
                          borderRadius: '50%',
                          boxShadow: 'inset 0 0.5px 1px rgba(255, 255, 255, 0.3)',
                        }}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Edge Mounts */}
                <div 
                  className="bezel-edge-left"
                  style={{
                    position: 'absolute',
                    top: 12,
                    bottom: 12,
                    left: -3,
                    width: 2,
                    background: 'linear-gradient(to bottom, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.1))',
                    boxShadow: '0 0 6px rgba(236, 72, 153, 0.15)',
                    opacity: 0.6,
                    borderRadius: '2px 0 0 2px',
                  }}
                />
                <div 
                  className="bezel-edge-right"
                  style={{
                    position: 'absolute',
                    top: 12,
                    bottom: 12,
                    right: -3,
                    width: 2,
                    background: 'linear-gradient(to bottom, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.1))',
                    boxShadow: '0 0 6px rgba(236, 72, 153, 0.15)',
                    opacity: 0.6,
                    borderRadius: '0 2px 2px 0',
                  }}
                />
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
              </div>
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
            <div
              style={{
                position: 'relative',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                background: `linear-gradient(135deg,
                  rgba(26, 26, 26, 0.95) 0%,
                  rgba(30, 30, 30, 0.9) 25%,
                  rgba(28, 28, 28, 0.88) 50%,
                  rgba(30, 30, 30, 0.9) 75%,
                  rgba(26, 26, 26, 0.95) 100%
                )`,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.4),
                  0 0 40px rgba(0, 255, 255, 0.08),
                  0 4px 20px rgba(0, 0, 0, 0.6),
                  inset 0 1px 0 rgba(255, 255, 255, 0.06),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                `,
                overflow: 'hidden',
                transformStyle: 'preserve-3d',
                padding: 0,
                height: 'calc(100vh - 350px)',
                minHeight: 600,
              }}
            >
              {/* Bezel Screws */}
              <div className="bezel-screws">
                {[
                  { top: 12, left: 12, angle: '10deg' },
                  { top: 12, right: 12, angle: '22deg' },
                  { bottom: 12, left: 12, angle: '-12deg' },
                  { bottom: 12, right: 12, angle: '18deg' }
                ].map((pos, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      ...pos,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.15) 40%, transparent 70%)',
                      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5), inset 0 -1px 1px rgba(255, 255, 255, 0.1), 0 1px 1px rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: 10,
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: 6,
                        height: 6,
                        background: 'radial-gradient(circle at 35% 35%, #e0e0e0 0%, #b8b8b8 15%, #888 40%, #555 70%, #222 100%)',
                        borderRadius: '50%',
                        boxShadow: 'inset 0 0.5px 1px rgba(255, 255, 255, 0.4), inset 0 -0.5px 1px rgba(0, 0, 0, 0.5), 0 0.5px 2px rgba(0, 0, 0, 0.8)',
                        border: '0.5px solid rgba(0, 0, 0, 0.2)',
                        transform: `rotate(${pos.angle})`,
                      }}
                    />
                  </div>
                ))}
              </div>
              
              {/* Edge Mounts */}
              <div 
                className="bezel-edge-left"
                style={{
                  position: 'absolute',
                  top: 12,
                  bottom: 12,
                  left: -4,
                  width: 3,
                  background: 'linear-gradient(to bottom, rgba(255, 0, 255, 0.2), rgba(0, 255, 255, 0.1))',
                  boxShadow: '0 0 8px rgba(0, 255, 255, 0.15)',
                  opacity: 0.6,
                  borderRadius: '2px 0 0 2px',
                }}
              />
              <div 
                className="bezel-edge-right"
                style={{
                  position: 'absolute',
                  top: 12,
                  bottom: 12,
                  right: -4,
                  width: 3,
                  background: 'linear-gradient(to bottom, rgba(255, 0, 255, 0.2), rgba(0, 255, 255, 0.1))',
                  boxShadow: '0 0 8px rgba(0, 255, 255, 0.15)',
                  opacity: 0.6,
                  borderRadius: '0 2px 2px 0',
                }}
              />
              
              {viewMode === 'rolodex' ? (
                <div style={{ height: '100%', padding: 24 }}>
                  <DigitalRolodex
                    contacts={contacts}
                    onCall={handleMakeCall}
                    onToggleFavorite={(contact) => {
                      // TODO: Implement favorite toggle
                      console.log('Toggle favorite:', contact);
                    }}
                  />
                </div>
              ) : (
                <div 
                  ref={gridContainerRef}
                  style={{ 
                    height: '100%',
                    width: '100%',
                    padding: 24,
                  }}
                >
                  <VirtualizedContactGrid
                    contacts={contacts}
                    onContactClick={handleMakeCall}
                    selectedContactId={activeCall?.contactId}
                    width={gridDimensions.width}
                    height={gridDimensions.height}
                  />
                </div>
              )}
            </div>
            
            {contacts.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div
                  style={{
                    position: 'relative',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    background: `linear-gradient(135deg,
                      rgba(26, 26, 26, 0.95) 0%,
                      rgba(30, 30, 30, 0.9) 25%,
                      rgba(28, 28, 28, 0.88) 50%,
                      rgba(30, 30, 30, 0.9) 75%,
                      rgba(26, 26, 26, 0.95) 100%
                    )`,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '32px',
                    boxShadow: `
                      0 4px 16px rgba(0, 0, 0, 0.2),
                      0 0 20px rgba(99, 102, 241, 0.08),
                      0 2px 10px rgba(0, 0, 0, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.06),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                    `,
                    overflow: 'hidden',
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
                    Add your first contact to get started with Pipeline Ultra
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
                  <div className="bezel-screws">
                    {[
                      { top: 24, left: 24 },
                      { top: 24, right: 24 },
                      { bottom: 24, left: 24 },
                      { bottom: 24, right: 24 }
                    ].map((pos, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute',
                          ...pos,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.15) 40%, transparent 70%)',
                          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5), inset 0 -1px 1px rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            background: 'radial-gradient(circle at 35% 35%, #e0e0e0 0%, #888 40%, #222 100%)',
                            borderRadius: '50%',
                            boxShadow: 'inset 0 0.5px 1px rgba(255, 255, 255, 0.3)',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </Container>
          </div>
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
              callSid={activeCall.callSid}
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
        <React.Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></div>}>
          <MissionControlDashboard
            isOpen={showMissionControl}
            onClose={() => setShowMissionControl(false)}
          />
        </React.Suspense>

        {/* AI Settings Modal */}
        <AISettings
          open={showAISettings}
          onClose={() => setShowAISettings(false)}
        />

        {/* Performance History Modal */}
        <PerformanceHistory
          open={showPerformance}
          onClose={() => setShowPerformance(false)}
        />

        {/* Call History Dashboard */}
        <CallHistoryDashboard
          open={showCallHistory}
          onClose={() => setShowCallHistory(false)}
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
                <SyncDashboard onClose={() => setShowSyncDashboard(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact Enrichment Widget */}
        <CompactEnrichmentWidget 
          onEnrichmentComplete={(leads) => {
            // Add enriched leads to contacts
            leads.forEach(lead => {
              if (lead.enriched) {
                addContact({
                  name: lead.enriched.fullName || 'Unknown',
                  phoneNumber: lead.enriched.phone || lead.enriched.mobile || '',
                  email: lead.enriched.email || '',
                  notes: `${lead.enriched.company || ''} - ${lead.enriched.title || ''}`,
                  tags: [lead.enriched.segment, lead.enriched.industry].filter(Boolean)
                });
              }
            });
          }}
        />
      </div>
  );
}

export default App;