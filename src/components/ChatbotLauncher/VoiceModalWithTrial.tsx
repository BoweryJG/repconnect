import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, Phone, PhoneOff, Volume2, Clock, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  Alert,
} from '@mui/material';
import { WebRTCClient } from '../../services/webRTCClient';
import { useAuth } from '../../auth/useAuth';
import { trialVoiceService } from '../../services/trialVoiceService';
import './VoiceModalWithTrial.css';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName?: string;
  agentAvatar?: string;
  agentRole?: string;
  agentId?: string;
  voiceConfig?: {
    voiceId: string;
    stability: number;
    similarityBoost: number;
    style: number;
    useSpeakerBoost: boolean;
  };
}

interface TranscriptionLine {
  id: string;
  speaker: 'user' | 'agent' | 'system';
  text: string;
  timestamp: Date;
}

export default function VoiceModalWithTrial({
  isOpen,
  onClose,
  agentName = 'AI Assistant',
  agentAvatar = '/agent-avatar.jpg',
  agentRole = 'Your Personal AI Concierge',
  agentId,
  voiceConfig: _voiceConfig,
}: VoiceModalProps) {
  console.log(
    'VoiceModalWithTrial rendered - isOpen:',
    isOpen,
    'agentName:',
    agentName,
    'agentId:',
    agentId
  );
  const { user, session } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionLine[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle');
  const [isTrialSession, setIsTrialSession] = useState(false);
  const [remainingTime, setRemainingTime] = useState(300); // 5 minutes
  const [showTrialExpired, setShowTrialExpired] = useState(false);

  const webRTCClientRef = useRef<WebRTCClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const transcriptionRef = useRef<HTMLDivElement>(null);
  const transcriptionEndRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const remainingTimeInterval = useRef<NodeJS.Timeout | null>(null);

  // Update remaining time display
  useEffect(() => {
    if (isTrialSession && isCallActive) {
      remainingTimeInterval.current = setInterval(() => {
        const remaining = trialVoiceService.getRemainingTime();
        setRemainingTime(remaining);

        if (remaining <= 0) {
          handleTrialExpired();
        }
      }, 1000);
    }

    return () => {
      if (remainingTimeInterval.current) {
        clearInterval(remainingTimeInterval.current);
      }
    };
  }, [isTrialSession, isCallActive]);

  // Initialize WebRTC connection
  const initializeWebRTC = useCallback(async () => {
    try {
      setConnectionStatus('connecting');

      // Check if user is authenticated
      const isAuthenticated = !!user && !!session;

      if (!isAuthenticated && agentId) {
        // Start trial session
        const trialSession = await trialVoiceService.startTrialVoiceSession(
          agentId,
          handleTrialExpired
        );

        setIsTrialSession(true);
        setRemainingTime(trialSession.session.max_duration_seconds);

        // Add system message about trial
        addTranscriptionLine(
          'system',
          `Free 5-minute trial started. Sign up for unlimited access!`
        );
      }

      // Get backend URL
      const backendUrl =
        process.env.REACT_APP_AGENT_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

      // Create WebRTC client
      webRTCClientRef.current = new WebRTCClient({
        backendUrl: backendUrl,
        agentId: agentId!,
        userId: user?.id || 'guest-' + Date.now(),
        authToken: session?.access_token,
      });

      // Connect to signaling server
      await webRTCClientRef.current.connect();

      // Join room for this agent
      const roomId = `${agentName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      await webRTCClientRef.current.joinRoom(roomId);

      setConnectionStatus('connected');
    } catch (error: any) {
      console.error('Failed to initialize WebRTC:', error);
      setConnectionStatus('error');

      if (error.message.includes('trial has been used')) {
        setShowTrialExpired(true);
        addTranscriptionLine(
          'system',
          'Your free trial has been used today. Please sign up for unlimited access.'
        );
      }
    }
  }, [agentName, user, session, agentId]);

  const handleTrialExpired = () => {
    setShowTrialExpired(true);
    endCall();
    addTranscriptionLine(
      'system',
      'Your 5-minute trial has ended. Sign up for unlimited voice calls!'
    );
  };

  // Start the call
  const startCall = async () => {
    try {
      if (!webRTCClientRef.current) {
        await initializeWebRTC();
      }

      // Start audio transmission
      await webRTCClientRef.current!.startAudio();

      // Set up audio visualization
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      setIsCallActive(true);

      // Start audio level monitoring
      monitorAudioLevels();

      // Add initial greeting
      addTranscriptionLine('agent', `Hello! I'm ${agentName}. How can I help you today?`);
    } catch (error: any) {
      console.error('Failed to start call:', error);
      handleCallError(error);
      setConnectionStatus('error');
    }
  };

  // End the call
  const endCall = () => {
    if (webRTCClientRef.current) {
      webRTCClientRef.current.stopAudio();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    // End trial session if active
    if (isTrialSession) {
      trialVoiceService.endSession();
    }

    setIsCallActive(false);
    setConnectionStatus('idle');
  };

  const handleCallError = (error: any) => {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      addTranscriptionLine(
        'agent',
        'Microphone permission denied. Please allow microphone access and try again.'
      );
    } else if (error.name === 'NotFoundError') {
      addTranscriptionLine(
        'agent',
        'No microphone found. Please connect a microphone and try again.'
      );
    } else {
      addTranscriptionLine(
        'agent',
        'Failed to start voice call. Please check your connection and try again.'
      );
    }
  };

  const addTranscriptionLine = (speaker: TranscriptionLine['speaker'], text: string) => {
    const newLine: TranscriptionLine = {
      id: Date.now().toString(),
      speaker,
      text,
      timestamp: new Date(),
    };
    setTranscription((prev) => [...prev, newLine]);
  };

  const monitorAudioLevels = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const checkAudioLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      // Detect if user is speaking
      setIsUserSpeaking(average > 20);

      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  };

  const toggleMute = () => {
    // For now, just update the UI state
    // The actual muting would need to be implemented in WebRTCClient
    setIsMuted(!isMuted);

    // You could also stop/start the audio stream
    if (isMuted && webRTCClientRef.current) {
      // Currently muted, so unmute by restarting audio
      webRTCClientRef.current.startAudio().catch(console.error);
    } else if (!isMuted && webRTCClientRef.current) {
      // Currently unmuted, so mute by stopping audio
      webRTCClientRef.current.stopAudio();
    }
  };

  // Auto-scroll transcription
  useEffect(() => {
    transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isCallActive) {
        endCall();
      }
      if (webRTCClientRef.current) {
        webRTCClientRef.current.disconnect();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  console.log('VoiceModalWithTrial about to check isOpen:', isOpen);
  if (!isOpen) {
    console.log('VoiceModalWithTrial returning null because isOpen is false');
    return null;
  }

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth className="voice-modal-dialog">
      {/* Header */}
      <div className="voice-modal-header">
        <IconButton onClick={onClose} className="voice-modal-close-button">
          <X size={24} />
        </IconButton>

        <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <Avatar
            src={agentAvatar}
            alt={agentName}
            style={{
              width: 64,
              height: 64,
              border: '2px solid white',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            {agentAvatar === '/agent-avatar.jpg' ? '🤖' : agentName[0]}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {agentName}
            </Typography>
            <Typography variant="body2" style={{ opacity: 0.9 }}>
              {agentRole}
            </Typography>
          </Box>
        </div>

        {/* Trial Timer in Header */}
        {isTrialSession && isCallActive && (
          <div className="voice-modal-trial-timer">
            <Clock size={16} />
            <Typography variant="body2" fontWeight="medium">
              Trial Time Remaining: {formatTime(remainingTime)}
            </Typography>
          </div>
        )}
      </div>

      <DialogContent>
        {/* Trial Notice */}
        {showTrialExpired ? (
          <div className="voice-modal-error-container">
            <div className="voice-modal-error-icon">
              <AlertCircle size={32} color="#d32f2f" />
            </div>
            <Typography variant="h6" fontWeight="semibold">
              Trial Session Ended
            </Typography>
            <Typography color="text.secondary">
              Your 5-minute trial session has ended. Upgrade to Pro for unlimited voice
              conversations with your AI agents.
            </Typography>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 16 }}>
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
              <Button variant="contained" color="primary">
                Upgrade to Pro
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Main Content */}
            <div className="voice-modal-content">
              {/* Trial Timer Alert */}
              {isTrialSession && !isCallActive && (
                <Alert
                  severity="warning"
                  style={{ marginBottom: 16 }}
                  action={
                    <Button color="inherit" size="small">
                      Upgrade
                    </Button>
                  }
                  icon={<Clock size={20} />}
                >
                  Free 5-minute trial session. Sign up for unlimited voice calls!
                </Alert>
              )}

              {/* Connection Status */}
              <div className="voice-modal-status-section">
                <div className="voice-modal-connection-status">
                  <div className="voice-modal-indicator">
                    {connectionStatus === 'connected' && isUserSpeaking && (
                      <div className="voice-modal-pulse" />
                    )}
                    <Volume2 size={48} color="#666" />
                  </div>
                </div>

                <Box textAlign="center" mb={2}>
                  {connectionStatus === 'idle' && (
                    <Typography color="text.secondary">
                      Ready to start voice conversation
                    </Typography>
                  )}
                  {connectionStatus === 'connecting' && (
                    <Typography color="primary">Connecting to voice service...</Typography>
                  )}
                  {connectionStatus === 'connected' && (
                    <Typography color="success.main" fontWeight="medium">
                      Connected - You can speak now!
                    </Typography>
                  )}
                  {connectionStatus === 'error' && (
                    <Typography color="error">Connection error - Please try again</Typography>
                  )}
                </Box>
              </div>

              {/* Controls */}
              <div className="voice-modal-controls">
                {!isCallActive ? (
                  <Button
                    onClick={startCall}
                    disabled={connectionStatus === 'connecting'}
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<Phone size={20} />}
                    style={{ borderRadius: 12 }}
                  >
                    Start Call
                  </Button>
                ) : (
                  <>
                    <IconButton
                      onClick={toggleMute}
                      className={`voice-modal-mute-button ${isMuted ? 'muted' : ''}`}
                    >
                      {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </IconButton>
                    <Button
                      onClick={endCall}
                      variant="contained"
                      color="error"
                      size="large"
                      startIcon={<PhoneOff size={20} />}
                      style={{ borderRadius: 12 }}
                    >
                      End Call
                    </Button>
                  </>
                )}
              </div>

              {/* Transcription */}
              {transcription.length > 0 && (
                <div className="voice-modal-transcription-section">
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Conversation
                  </Typography>
                  <Paper
                    ref={transcriptionRef}
                    elevation={0}
                    className="voice-modal-transcription-paper"
                  >
                    <div className="voice-modal-transcription-content">
                      {transcription.map((line) => (
                        <Box key={line.id}>
                          <Typography
                            component="span"
                            variant="body2"
                            fontWeight="medium"
                            color={
                              line.speaker === 'user'
                                ? 'primary.main'
                                : line.speaker === 'agent'
                                  ? 'secondary.main'
                                  : 'text.secondary'
                            }
                          >
                            {line.speaker === 'user'
                              ? 'You'
                              : line.speaker === 'agent'
                                ? agentName
                                : 'System'}
                            :
                          </Typography>{' '}
                          <Typography component="span" variant="body2" color="text.primary">
                            {line.text}
                          </Typography>
                        </Box>
                      ))}
                      <div ref={transcriptionEndRef} />
                    </div>
                  </Paper>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
