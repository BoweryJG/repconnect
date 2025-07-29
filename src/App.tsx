import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
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
import { twilioService } from './services/twilioService';
import { supabase } from './lib/supabase';
import { useStore } from './store/useStore';
import { adaptiveRenderer } from './lib/performance/AdaptiveRenderer';
import { useResponsive } from './hooks/useResponsive';
import { useAuth } from './auth/AuthContext';
import { DEMO_CONTACTS } from './lib/demoData';
import { usageTracker } from './lib/usageTracking';
import { voiceTimeTracker } from './lib/voiceTimeTracking';
import { ToastProvider, useToast } from './utils/toast';
import logger from './utils/logger';
import { harveyWebRTC } from './services/harveyWebRTC';
import { harveyService } from './services/harveyService';

// Core components that need to load immediately
import { SubtlePipelineBackground } from './components/effects/SubtlePipelineBackground';
import RepSpheresNavbar from './components/RepSpheresNavbar';
import { LoginModal } from './components/auth/LoginModal';
import GlobalLogoutModal from './components/common/GlobalLogoutModal';
import { CornerScrews } from './components/effects/PrecisionScrew';
import { LoadingFallback } from './components/LoadingFallback';
import { lazyWithPreload } from './utils/lazyWithPreload';

// Lazy load heavy components with optimized loading and preload capability
const DigitalRolodex = lazyWithPreload(() =>
  import(/* webpackChunkName: "rolodex" */ './components/DigitalRolodex').then((module) => ({
    default: module.DigitalRolodex,
  }))
);

const VirtualizedContactGrid = React.lazy(() =>
  import(/* webpackChunkName: "contact-grid" */ './components/VirtualizedContactGrid').then(
    (module) => ({ default: module.VirtualizedContactGrid })
  )
);

const CallInterface = React.lazy(() =>
  import(/* webpackChunkName: "call-interface" */ './components/CallInterface').then((module) => ({
    default: module.CallInterface,
  }))
);

const QuantumDialer = React.lazy(() =>
  import(/* webpackChunkName: "quantum-dialer" */ './components/QuantumDialer').then((module) => ({
    default: module.QuantumDialer,
  }))
);

const SyncDashboard = React.lazy(() =>
  import(/* webpackChunkName: "sync-dashboard" */ './components/SyncDashboard').then((module) => ({
    default: module.SyncDashboard,
  }))
);

const AISettings = React.lazy(() =>
  import(/* webpackChunkName: "ai-settings" */ './components/AISettings').then((module) => ({
    default: module.AISettings,
  }))
);

const PerformanceHistory = React.lazy(() =>
  import(/* webpackChunkName: "performance-history" */ './components/PerformanceHistory').then(
    (module) => ({ default: module.PerformanceHistory })
  )
);

const CallHistoryDashboard = React.lazy(() =>
  import(/* webpackChunkName: "call-history" */ './components/CallHistoryDashboard').then(
    (module) => ({ default: module.CallHistoryDashboard })
  )
);

const CompactEnrichmentWidget = React.lazy(() =>
  import(/* webpackChunkName: "enrichment-widget" */ './components/CompactEnrichmentWidget').then(
    (module) => ({ default: module.CompactEnrichmentWidget })
  )
);

const SubscriptionModal = React.lazy(() =>
  import(/* webpackChunkName: "auth" */ './components/auth/SubscriptionModal').then((module) => ({
    default: module.SubscriptionModal,
  }))
);

const InstantCoachConnect = React.lazy(
  () => import(/* webpackChunkName: "coach-connect" */ './components/InstantCoachConnect')
);

const HarveyLoadingScreen = React.lazy(() =>
  import(/* webpackChunkName: "harvey" */ './components/HarveyLoadingScreen').then((module) => ({
    default: module.HarveyLoadingScreen,
  }))
);

const HarveyActiveCallInterface = React.lazy(() =>
  import(/* webpackChunkName: "harvey" */ './components/HarveyActiveCallInterface').then(
    (module) => ({ default: module.HarveyActiveCallInterface })
  )
);

const HarveySettingsModal = React.lazy(() =>
  import(/* webpackChunkName: "harvey" */ './components/HarveySettingsModal').then((module) => ({
    default: module.HarveySettingsModal,
  }))
);

const AgentSelector = React.lazy(
  () => import(/* webpackChunkName: "agent-selector" */ './components/AgentSelector')
);

const ChatbotIntegration = React.lazy(
  () => import(/* webpackChunkName: "chatbot" */ './components/ChatbotLauncher/ChatbotIntegration')
);

const MissionControlDashboard = React.lazy(() =>
  import(/* webpackChunkName: "mission-control" */ './components/MissionControlDashboard').then(
    (module) => ({ default: module.MissionControlDashboard })
  )
);

function AppContent() {
  const { isMobile } = useResponsive();
  const { user, signOut } = useAuth();
  const { showSuccess, showError } = useToast();

  // AppContent rendered
  const [showDialer, setShowDialer] = useState(false);
  const [showMissionControl, setShowMissionControl] = useState(false);
  const [showSyncDashboard, setShowSyncDashboard] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showCoachConnect, setShowCoachConnect] = useState(false);
  const [showHarveySettings, setShowHarveySettings] = useState(false);
  const [showRepSpheresLoginModal, setShowRepSpheresLoginModal] = useState(false);
  const [showRepSpheresLogoutModal, setShowRepSpheresLogoutModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [viewMode, setViewMode] = useState<'rolodex' | 'grid'>('rolodex');
  const [gridDimensions, setGridDimensions] = useState({ width: 1200, height: 600 });
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showVoiceTimeWarning, setShowVoiceTimeWarning] = useState(false);
  const [harveyLoading, setHarveyLoading] = useState(false);

  // Debug auth state
  useEffect(() => {
    console.log('[App] Auth state changed:', {
      user: user?.email,
      userId: user?.id,
      isAuthenticated: !!user,
      isGuestMode,
      voiceTimeRemaining: voiceTimeTracker.getFormattedTimeRemaining(),
    });
  }, [user, isGuestMode]);

  const [harveyConnectionStatus, setHarveyConnectionStatus] = useState<
    'connecting' | 'connected' | 'failed' | 'reconnecting'
  >('connecting');
  const [harveyError, setHarveyError] = useState<string | undefined>();

  // Debug grid dimensions
  useEffect(() => {
    logger.debug('Grid dimensions updated:', gridDimensions);
  }, [gridDimensions]);

  const {
    contacts,
    addContact,
    setContacts,
    activeCall,
    setActiveCall,
    isCallInProgress,
    setCallInProgress,
    showLoginModal,
    setShowLoginModal,
    showSubscriptionModal,
    setShowSubscriptionModal,
    subscriptionTier,
    setSubscriptionTier,
  } = useStore();

  // Load contacts from Supabase on mount - only for authenticated users
  const loadContacts = useCallback(async () => {
    // Don't load contacts if user is not authenticated
    if (!user) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Supabase error:', error);
        throw error;
      }

      logger.info('Loaded contacts:', data?.length || 0);
      logger.debug('First contact:', data?.[0]); // Debug first contact

      // Convert Supabase data to Contact format and set all at once
      const formattedContacts =
        data?.map((contact: any) => ({
          id: crypto.randomUUID(),
          name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown',
          phoneNumber: contact.phone_number || contact.cell || '',
          email: contact.email,
          notes:
            contact.notes || `${contact.summary || ''}\n${contact.tech_interests || ''}`.trim(),
          tags: [
            contact.specialty,
            contact.lead_tier,
            contact.contact_priority,
            contact.territory,
          ].filter(Boolean),
          callCount: 0,
        })) || [];

      // Set all contacts at once, replacing any existing ones
      setContacts(formattedContacts);
    } catch (error) {
      logger.error('Error loading contacts:', error);
    }
  }, [user, setContacts]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Update subscription tier when user changes
  useEffect(() => {
    // Default to free tier for authenticated users
    if (user) {
      setSubscriptionTier('free');
    }
  }, [user, setSubscriptionTier]);

  // Handle demo mode and authentication
  useEffect(() => {
    // Don't interfere with auth callback
    if (window.location.pathname === '/auth/callback') {
      return;
    }

    if (user) {
      setIsGuestMode(false);
      // Load real contacts when authenticated
    } else {
      // Set as guest mode
      setIsGuestMode(true);
      // Load demo contacts
      setContacts(DEMO_CONTACTS as any);
    }
  }, [user, showLoginModal, setShowLoginModal, setContacts]);

  // Initialize adaptive renderer
  useEffect(() => {
    // Subscribe to quality changes
    const unsubscribe = adaptiveRenderer.subscribe(() => {
      // Quality changes are handled internally by the renderer
    });

    // Track bundle performance in development
    if (process.env.NODE_ENV === 'development') {
      // Bundle performance monitoring is initialized but no console output
    }

    // Preload likely next routes based on current location
    // const currentRoute = window.location.pathname;
    // const likelyRoutes = bundlePerformance.predictAndPreload(currentRoute);
    // likelyRoutes.forEach((route) => {
    //   SmartPreloader.preloadOnRoute(route);
    // });

    return () => {
      unsubscribe();
    };
  }, []);

  // Listen for voice time exceeded event
  useEffect(() => {
    const handleVoiceTimeExceeded = () => {
      showError(
        '🎙️ Voice trial ended! Sign in to continue your coaching journey with unlimited calls from 19 AI sales experts.'
      );
      setShowLoginModal(true);
      // Force end any active calls
      if (isCallInProgress) {
        setCallInProgress(false);
        setActiveCall(null);
        setHarveyLoading(false);
        setHarveyConnectionStatus('connecting');
        setHarveyError(undefined);
        harveyWebRTC.disconnect();
        voiceTimeTracker.endSession();
      }
    };

    window.addEventListener('voice-time-exceeded', handleVoiceTimeExceeded);
    return () => {
      window.removeEventListener('voice-time-exceeded', handleVoiceTimeExceeded);
    };
  }, [isCallInProgress, showError, setShowLoginModal, setCallInProgress, setActiveCall]);

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

  const checkVoiceTimeAndProceed = () => {
    if (!user) {
      if (!voiceTimeTracker.hasTimeRemaining()) {
        setShowLoginModal(true);
        return false;
      }

      const remainingSeconds = voiceTimeTracker.getRemainingSeconds();
      if (remainingSeconds <= 60 && remainingSeconds > 0) {
        showError(
          `⏰ Only ${voiceTimeTracker.getFormattedTimeRemaining()} left! Sign in now to continue your coaching session uninterrupted.`
        );
        setShowVoiceTimeWarning(true);
        setTimeout(() => setShowVoiceTimeWarning(false), 10000);
      }
    }
    return true;
  };

  const handleMakeCall = async (contact: any) => {
    if (!checkVoiceTimeAndProceed()) return;

    // Initialize Harvey first
    setHarveyLoading(true);
    setHarveyConnectionStatus('connecting');

    try {
      // Connect to Harvey
      await harveyWebRTC.connect({
        userId: user?.id || 'demo-user',
        onConnectionChange: (connected) => {
          setHarveyConnectionStatus(connected ? 'connected' : 'reconnecting');
          if (connected) {
            setHarveyLoading(false);
          }
        },
        onAudioReceived: (_audioData) => {
          logger.debug('Harvey audio received');
        },
      });

      // Give Harvey a moment to stabilize
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Pre-call whisper from Harvey
      if (harveyWebRTC) {
        // Send contact info to Harvey for pre-call analysis
        harveyWebRTC.sendVoiceCommand(`prepare: Calling ${contact.name} at ${contact.phoneNumber}`);

        // Emit pre-call coaching
        window.dispatchEvent(
          new CustomEvent('harvey-coaching', {
            detail: {
              type: 'coaching',
              message: `Calling ${contact.name}. Remember to lead with value.`,
              timestamp: Date.now(),
            },
          })
        );
      }
    } catch (error: any) {
      logger.error('Harvey connection failed:', error);
      setHarveyError('Failed to connect to Harvey. Proceeding without AI coaching.');
      setHarveyConnectionStatus('failed');
      // Continue with call even if Harvey fails
    }

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

      // Start voice time tracking for guest users
      if (!user) {
        voiceTimeTracker.startSession(contact.name || 'Unknown');
      }

      // Log to Supabase
      await supabase.from('calls').insert({
        contact_id: contact.id,
        phone_number: formattedNumber,
        type: 'outgoing',
        status: 'initiated',
        created_at: new Date().toISOString(),
      });

      // Harvey is now active during the call
      setHarveyLoading(false);
    } catch (error: any) {
      logger.error('Error making call:', error);
      setCallInProgress(false);
      setActiveCall(null);
      setHarveyLoading(false);
      harveyWebRTC.disconnect();

      // Show user-friendly error message
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details?.error ||
        error.message ||
        'Unknown error';
      showError(
        `Call failed: ${errorMessage}. Please check that the phone number is valid and Twilio account is active.`
      );
    }
  };

  const handleDialNumber = async (phoneNumber: string) => {
    if (!checkVoiceTimeAndProceed()) return;
    logger.debug('🔍 [APP DEBUG] Starting dial process for:', phoneNumber);

    // Initialize Harvey first
    setHarveyLoading(true);
    setHarveyConnectionStatus('connecting');

    try {
      // Connect to Harvey
      await harveyWebRTC.connect({
        userId: user?.id || 'demo-user',
        onConnectionChange: (connected) => {
          setHarveyConnectionStatus(connected ? 'connected' : 'reconnecting');
          if (connected) {
            setHarveyLoading(false);
          }
        },
        onAudioReceived: (_audioData) => {
          logger.debug('Harvey audio received');
        },
      });

      // Give Harvey a moment to stabilize
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Pre-call whisper from Harvey
      if (harveyWebRTC) {
        // Send contact info to Harvey for pre-call analysis
        harveyWebRTC.sendVoiceCommand(`prepare: Calling ${phoneNumber}`);

        // Emit pre-call coaching
        window.dispatchEvent(
          new CustomEvent('harvey-coaching', {
            detail: {
              type: 'coaching',
              message: `Calling ${phoneNumber}. Remember to lead with value.`,
              timestamp: Date.now(),
            },
          })
        );
      }
    } catch (error: any) {
      logger.error('Harvey connection failed:', error);
      setHarveyError('Failed to connect to Harvey. Proceeding without AI coaching.');
      setHarveyConnectionStatus('failed');
      // Continue with call even if Harvey fails
    }

    // Format the phone number to ensure it has country code
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    if (!formattedNumber.startsWith('1') && formattedNumber.length === 10) {
      formattedNumber = '1' + formattedNumber;
    }
    formattedNumber = '+' + formattedNumber;

    logger.debug('🔍 [APP DEBUG] Formatted number:', formattedNumber);

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
      logger.debug('🔍 [APP DEBUG] Calling twilioService.makeCall...');
      const result = await twilioService.makeCall(
        formattedNumber,
        undefined,
        undefined,
        { enableStream: true } // Enable real-time transcription
      );

      logger.info('✅ [APP DEBUG] Call initiated successfully:', result);

      // Start voice time tracking for guest users
      if (!user) {
        voiceTimeTracker.startSession(formattedNumber);
      }

      // Update activeCall with the call SID for transcription
      if (result.call && result.call.sid) {
        setActiveCall({
          ...activeCall!,
          callSid: result.call.sid,
        });
      }

      // Log to Supabase
      await supabase.from('calls').insert({
        phone_number: formattedNumber,
        type: 'outgoing',
        status: 'initiated',
        created_at: new Date().toISOString(),
        call_sid: result.call?.sid,
      });

      logger.info('✅ [APP DEBUG] Call logged to database');

      // Harvey is now active during the call
      setHarveyLoading(false);

      // Close dialer on success
      setShowDialer(false);
    } catch (error: any) {
      logger.error('❌ [APP DEBUG] Call failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setCallInProgress(false);
      setActiveCall(null);

      // Show user-friendly error message
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details?.error ||
        error.message ||
        'Unknown error';
      showError(
        `Call failed: ${errorMessage}. Please check that the phone number is valid and Twilio account is active.`
      );
    }
  };

  const handleEndCall = useCallback(
    async (callDuration?: number) => {
      // Submit call performance to Harvey for analysis
      if (activeCall && activeCall.callSid) {
        const duration = callDuration || activeCall.duration || 0;

        // Get call recording for Harvey's analysis
        try {
          const recordings = await twilioService.getCallRecordings(activeCall.callSid);
          if (recordings && recordings.length > 0) {
            // Send recording URL to Harvey for deep analysis
            harveyWebRTC.sendVoiceCommand(`analyze-recording: ${recordings[0].url}`);
          }
        } catch (error) {
          logger.error('Failed to get call recording:', error);
        }

        await harveyService.submitCallPerformance({
          callId: activeCall.callSid,
          duration: duration,
          outcome: 'follow-up', // This should be determined based on actual call outcome
          voiceMetrics: {
            // These would come from harveyWebRTC voice analysis
            confidence: 75,
            pace: 'normal',
          },
        });
      }

      setCallInProgress(false);
      setActiveCall(null);
      setHarveyLoading(false);
      setHarveyConnectionStatus('connecting');
      setHarveyError(undefined);
      harveyWebRTC.disconnect();

      // End voice time tracking for guest users
      if (!user) {
        voiceTimeTracker.endSession();
      }
    },
    [activeCall, user]
  );

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
        showSuccess('Contact added successfully!');
      } catch (error) {
        logger.error('Error adding contact:', error);
        showError('Failed to add contact. Please try again.');
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
      {/* Subtle Pipeline Background */}
      <SubtlePipelineBackground />

      {/* Voice Time Warning Banner */}
      {showVoiceTimeWarning && !user && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          style={{
            position: 'fixed',
            top: isMobile ? 64 : 76,
            left: 0,
            right: 0,
            background: 'linear-gradient(90deg, #FF6B35 0%, #F53969 100%)',
            padding: '12px 24px',
            textAlign: 'center',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Typography variant="body2" className="white-text-600">
            ⚡ Only {voiceTimeTracker.getFormattedTimeRemaining()} voice time left! Sign in to
            unlock unlimited AI coaching calls & save your progress 🚀
          </Typography>
        </motion.div>
      )}

      {/* Guest Mode Banner */}
      {isGuestMode && !showVoiceTimeWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            top: isMobile ? 64 : 76,
            left: 0,
            right: 0,
            background: 'linear-gradient(90deg, #4B96DC 0%, #00d4ff 100%)',
            padding: '8px 24px',
            textAlign: 'center',
            zIndex: 1000,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Typography variant="body2" className="white-text-500">
            🎯 Guest Mode | Unlimited chat + {voiceTimeTracker.getFormattedTimeRemaining()} voice
            time | Sign in to unlock: ✓ Save conversations ✓ Build your AI sales team ✓ Track
            progress ✓ Unlimited voice coaching
          </Typography>
        </motion.div>
      )}

      {/* Main App */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <RepSpheresNavbar
          user={user as any}
          appLinks={[
            { href: '#', label: 'Dialer', icon: 'dialer', onClick: () => setShowDialer(true) },
            {
              href: '#',
              label: 'Sync Dashboard',
              icon: 'sync',
              onClick: () => setShowSyncDashboard(true),
            },
            {
              href: '#',
              label: 'Mission Control',
              icon: 'control',
              onClick: () => setShowMissionControl(true),
            },
            {
              href: '#',
              label: 'AI Settings',
              icon: 'settings',
              onClick: () => setShowAISettings(true),
            },
            {
              href: '#',
              label: 'Performance',
              icon: 'chart',
              onClick: () => setShowPerformance(true),
            },
            {
              href: '#',
              label: 'Call History',
              icon: 'history',
              onClick: () => setShowCallHistory(true),
            },
            {
              href: '#',
              label: 'Coach Connect',
              icon: 'coach',
              onClick: () => setShowCoachConnect(true),
            },
            {
              href: '#',
              label: 'Harvey Settings',
              icon: 'harvey',
              onClick: () => setShowHarveySettings(true),
            },
          ]}
          onLogin={() => setShowRepSpheresLoginModal(true)}
          onSignup={() => setShowRepSpheresLoginModal(true)}
          onLogout={() => setShowRepSpheresLogoutModal(true)}
        />

        <div
          style={{
            padding: isMobile ? '8px' : '12px',
            paddingTop:
              isGuestMode || showVoiceTimeWarning
                ? isMobile
                  ? '120px'
                  : '140px'
                : isMobile
                  ? '80px'
                  : '96px',
          }}
        >
          <Container maxWidth="xl" className="container-responsive">
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
                  padding: isMobile ? '20px' : '36px',
                  marginBottom: isMobile ? '16px' : '32px',
                }}
              >
                {/* Cartier-Level Precision Screws */}
                <CornerScrews size="medium" grooveType="phillips" premium={true} />

                {/* Edge Mounts */}
                <div
                  className="bezel-edge-left"
                  style={{
                    position: 'absolute',
                    top: 12,
                    bottom: 12,
                    left: -3,
                    width: 2,
                    background:
                      'linear-gradient(to bottom, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.1))',
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
                    background:
                      'linear-gradient(to bottom, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.1))',
                    boxShadow: '0 0 6px rgba(236, 72, 153, 0.15)',
                    opacity: 0.6,
                    borderRadius: '0 2px 2px 0',
                  }}
                />
                {/* Header with title and widget */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: isMobile ? '16px' : '24px',
                    gap: '16px',
                  }}
                >
                  <Typography
                    variant="h5"
                    className="gradient-text"
                    style={{
                      fontWeight: 700,
                      fontSize: '1.5rem',
                      flex: '0 0 auto',
                      marginRight: 'auto',
                    }}
                  >
                    Quick Add Contact
                  </Typography>

                  {/* Instant Lead Enricher */}
                  <Suspense fallback={<LoadingFallback compact />}>
                    <CompactEnrichmentWidget
                      embedded={true}
                      onEnrichmentComplete={(leads) => {
                        // Add enriched leads to contacts
                        leads.forEach((lead) => {
                          if (lead.enriched) {
                            addContact({
                              name: lead.enriched.fullName || 'Unknown',
                              phoneNumber: lead.enriched.phone || lead.enriched.mobile || '',
                              email: lead.enriched.email || '',
                              notes: `${lead.enriched.company || ''} - ${lead.enriched.title || ''}`,
                              tags: [lead.enriched.segment, lead.enriched.industry].filter(Boolean),
                            });
                          }
                        });
                      }}
                    />
                  </Suspense>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '12px' : '16px',
                  }}
                >
                  <TextField
                    label="Name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    style={{ flex: 1 }}
                    className="text-field-custom"
                  />
                  <TextField
                    label="Phone Number"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    style={{ flex: 1 }}
                    className="text-field-custom"
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddContact}
                    disabled={!newContactName || !newContactPhone}
                    fullWidth={isMobile}
                    className="button-gradient"
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '32px',
                }}
              >
                <div>
                  <Typography
                    variant="h3"
                    className="gradient-text"
                    style={{
                      fontWeight: 800,
                      marginBottom: '8px',
                    }}
                  >
                    Your Contacts
                  </Typography>
                  <Typography variant="h5" className="text-secondary" style={{ fontWeight: 500 }}>
                    {contacts.length} connections
                  </Typography>
                </div>
                <Button
                  variant="outlined"
                  startIcon={viewMode === 'rolodex' ? <ViewModuleIcon /> : <DashboardIcon />}
                  onClick={() => setViewMode(viewMode === 'rolodex' ? 'grid' : 'rolodex')}
                  className="button-view-toggle"
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
                  { bottom: 12, right: 12, angle: '18deg' },
                ].map((pos, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      ...pos,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background:
                        'radial-gradient(circle at center, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.15) 40%, transparent 70%)',
                      boxShadow:
                        'inset 0 1px 2px rgba(0, 0, 0, 0.5), inset 0 -1px 1px rgba(255, 255, 255, 0.1), 0 1px 1px rgba(255, 255, 255, 0.05)',
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
                        background:
                          'radial-gradient(circle at 35% 35%, #e0e0e0 0%, #b8b8b8 15%, #888 40%, #555 70%, #222 100%)',
                        borderRadius: '50%',
                        boxShadow:
                          'inset 0 0.5px 1px rgba(255, 255, 255, 0.4), inset 0 -0.5px 1px rgba(0, 0, 0, 0.5), 0 0.5px 2px rgba(0, 0, 0, 0.8)',
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
                  background:
                    'linear-gradient(to bottom, rgba(255, 0, 255, 0.2), rgba(0, 255, 255, 0.1))',
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
                  background:
                    'linear-gradient(to bottom, rgba(255, 0, 255, 0.2), rgba(0, 255, 255, 0.1))',
                  boxShadow: '0 0 8px rgba(0, 255, 255, 0.15)',
                  opacity: 0.6,
                  borderRadius: '0 2px 2px 0',
                }}
              />

              {viewMode === 'rolodex' ? (
                <div style={{ height: '100%', padding: 24 }}>
                  <Suspense fallback={<LoadingFallback message="Loading contacts..." />}>
                    <DigitalRolodex
                      contacts={contacts}
                      onCall={handleMakeCall}
                      onToggleFavorite={(contact) => {
                        // TODO: Implement favorite toggle
                        logger.log('Toggle favorite:', contact);
                      }}
                    />
                  </Suspense>
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
                  <Suspense fallback={<LoadingFallback message="Loading grid view..." />}>
                    <VirtualizedContactGrid
                      contacts={contacts}
                      onContactClick={handleMakeCall}
                      selectedContactId={activeCall?.contactId}
                      width={gridDimensions.width}
                      height={gridDimensions.height}
                    />
                  </Suspense>
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
                  {user && (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        marginBottom: '32px',
                        fontSize: '16px',
                        fontWeight: 600,
                      }}
                    >
                      ✓ Welcome back, {user.email?.split('@')[0]}! You're signed in.
                    </div>
                  )}
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
                    <AutoAwesomeIcon className="icon-large-white" />
                  </div>
                  <Typography
                    variant="h5"
                    gutterBottom
                    className="gradient-text"
                    style={{ fontWeight: 700 }}
                  >
                    {user ? 'Ready to get started!' : 'No contacts yet'}
                  </Typography>
                  <Typography variant="body1" className="text-secondary-mb4">
                    {user
                      ? 'Add contacts above or click the chat icon in the bottom right to talk with AI agents'
                      : 'Add your first contact to get started with Pipeline Ultra'}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => document.querySelector('input')?.focus()}
                    className="button-gradient button-rounded"
                  >
                    Add First Contact
                  </Button>

                  {/* Bezel Screws */}
                  <div className="bezel-screws">
                    {[
                      { top: 24, left: 24 },
                      { top: 24, right: 24 },
                      { bottom: 24, left: 24 },
                      { bottom: 24, right: 24 },
                    ].map((pos, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute',
                          ...pos,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background:
                            'radial-gradient(circle at center, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.15) 40%, transparent 70%)',
                          boxShadow:
                            'inset 0 1px 2px rgba(0, 0, 0, 0.5), inset 0 -1px 1px rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            background:
                              'radial-gradient(circle at 35% 35%, #e0e0e0 0%, #888 40%, #222 100%)',
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

      {/* Harvey Loading Screen */}
      <Suspense fallback={null}>
        <HarveyLoadingScreen
          isLoading={harveyLoading}
          connectionStatus={harveyConnectionStatus}
          error={harveyError}
        />
      </Suspense>

      {/* Harvey Active Call Interface */}
      <Suspense fallback={null}>
        <HarveyActiveCallInterface
          isActive={isCallInProgress && harveyConnectionStatus === 'connected'}
          contactName={contacts.find((c) => c.id === activeCall?.contactId)?.name}
          phoneNumber={activeCall?.phoneNumber}
        />
      </Suspense>

      {/* Call Interface Overlay */}
      <AnimatePresence>
        {isCallInProgress && activeCall && (
          <Suspense fallback={<LoadingFallback message="Loading call interface..." />}>
            <CallInterface
              contact={{
                name: contacts.find((c) => c.id === activeCall.contactId)?.name || 'Unknown',
                phoneNumber: activeCall.phoneNumber,
                avatar: contacts.find((c) => c.id === activeCall.contactId)?.avatar,
              }}
              callSid={activeCall.callSid}
              onEndCall={handleEndCall}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Quantum Dialer */}
      <Suspense fallback={null}>
        <QuantumDialer
          isOpen={showDialer}
          onClose={() => setShowDialer(false)}
          onDial={handleDialNumber}
        />
      </Suspense>

      {/* Mission Control Dashboard */}
      <Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
            }}
          >
            <CircularProgress />
          </div>
        }
      >
        <MissionControlDashboard
          isOpen={showMissionControl}
          onClose={() => setShowMissionControl(false)}
        />
      </Suspense>

      {/* AI Settings Modal */}
      <Suspense fallback={null}>
        <AISettings open={showAISettings} onClose={() => setShowAISettings(false)} />
      </Suspense>

      {/* Performance History Modal */}
      <Suspense fallback={null}>
        <PerformanceHistory open={showPerformance} onClose={() => setShowPerformance(false)} />
      </Suspense>

      {/* Call History Dashboard */}
      <Suspense fallback={null}>
        <CallHistoryDashboard open={showCallHistory} onClose={() => setShowCallHistory(false)} />
      </Suspense>

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
                className="close-button-overlay"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 1,
                }}
              >
                <CloseIcon />
              </IconButton>
              <Suspense fallback={<LoadingFallback message="Loading sync dashboard..." />}>
                <SyncDashboard onClose={() => setShowSyncDashboard(false)} />
              </Suspense>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription Modal */}
      <Suspense fallback={null}>
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          currentTier={subscriptionTier}
        />
      </Suspense>

      {/* Harvey Settings Modal */}
      <Suspense fallback={null}>
        <HarveySettingsModal
          open={showHarveySettings}
          onClose={() => setShowHarveySettings(false)}
        />
      </Suspense>

      {/* Coach Connect Modal */}
      <AnimatePresence>
        {showCoachConnect && (
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
            onClick={() => setShowCoachConnect(false)}
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
                onClick={() => setShowCoachConnect(false)}
                className="close-button-overlay"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 1,
                }}
              >
                <CloseIcon />
              </IconButton>
              <Suspense fallback={<LoadingFallback message="Loading coach connect..." />}>
                <InstantCoachConnect />
              </Suspense>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent Selector FAB */}
      <Suspense fallback={null}>
        <AgentSelector />
      </Suspense>

      {/* Luxury Chatbot Launcher */}
      <Suspense fallback={null}>
        <ChatbotIntegration
          position="bottom-right"
          glowColor={user && contacts.length === 0 ? '#10B981' : '#3B82F6'}
        />
      </Suspense>

      {/* RepSpheres Auth Modals */}
      <LoginModal
        isOpen={showRepSpheresLoginModal}
        onClose={() => setShowRepSpheresLoginModal(false)}
        onEmailAuth={async () => {
          // Email auth not implemented yet
          showError('Email authentication coming soon');
        }}
      />

      <GlobalLogoutModal
        open={showRepSpheresLogoutModal}
        onClose={() => setShowRepSpheresLogoutModal(false)}
        onConfirm={async () => {
          try {
            await signOut();
            // Modal will close automatically due to page reload
          } catch (error) {
            logger.error('Logout error:', error);
            // Even on error, force logout
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
          }
        }}
      />

      {/* Session Warning Dialog is handled by AuthContext */}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
