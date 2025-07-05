import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  LinearProgress,
  Chip,
  Alert,
  Snackbar,
  Fade,
  Stack,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Mic,
  MicOff,
  Phone,
  PhoneDisabled,
  VolumeUp,
  VolumeOff,
  SignalCellularAlt,
  Error as ErrorIcon,
  CheckCircle,
  WifiTethering
} from '@mui/icons-material';
import webRTCVoiceService from '../services/webRTCVoiceService';
import { webRTCSignalingService } from '../services/webRTCSignalingService';
import moshiWebRTCBridge from '../services/moshiWebRTCBridge';

interface WebRTCVoiceInterfaceProps {
  sessionId?: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  autoConnect?: boolean;
  showTranscript?: boolean;
}

interface ConnectionQuality {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  latency: number;
  packetLoss: number;
}

export const WebRTCVoiceInterface: React.FC<WebRTCVoiceInterfaceProps> = ({
  sessionId: propSessionId,
  onTranscript,
  onError,
  autoConnect = false,
  showTranscript = true
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [sessionId, setSessionId] = useState(propSessionId || '');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>({
    level: 'good',
    latency: 0,
    packetLoss: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Initialize services
  useEffect(() => {
    const initialize = async () => {
      try {
        await webRTCVoiceService.initialize();
        
        // Set up event listeners
        webRTCVoiceService.on('session-connected', handleSessionConnected);
        webRTCVoiceService.on('session-disconnected', handleSessionDisconnected);
        webRTCVoiceService.on('error', handleError);
        webRTCVoiceService.on('remote-stream', handleRemoteStream);

        // Set up Moshi bridge listeners
        moshiWebRTCBridge.on('transcript', handleMoshiTranscript);
        moshiWebRTCBridge.on('emotion', handleEmotion);
        moshiWebRTCBridge.on('error', handleMoshiError);

        if (autoConnect && sessionId) {
          await connect();
        }
      } catch (err) {
        console.error('Failed to initialize WebRTC:', err);
        setError('Failed to initialize voice service');
      }
    };

    initialize();

    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      webRTCVoiceService.removeAllListeners();
      moshiWebRTCBridge.removeAllListeners();
    };
  }, []);

  const handleSessionConnected = useCallback((connectedSessionId: string) => {
    console.log('Session connected:', connectedSessionId);
    setIsConnected(true);
    setIsConnecting(false);
    startAudioLevelMonitoring();
  }, []);

  const handleSessionDisconnected = useCallback((disconnectedSessionId: string) => {
    console.log('Session disconnected:', disconnectedSessionId);
    setIsConnected(false);
    stopAudioLevelMonitoring();
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('WebRTC error:', error);
    setError(error.message);
    onError?.(error);
  }, [onError]);

  const handleRemoteStream = useCallback((data: { sessionId: string; stream: MediaStream }) => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = data.stream;
      remoteAudioRef.current.play().catch(err => {
        console.error('Failed to play remote audio:', err);
      });
    }
  }, []);

  const handleMoshiTranscript = useCallback((data: {
    sessionId: string;
    text: string;
    isFinal: boolean;
    confidence: number;
  }) => {
    if (data.sessionId !== sessionId) return;

    if (data.isFinal) {
      setTranscript(prev => prev + ' ' + data.text);
      setInterimTranscript('');
    } else {
      setInterimTranscript(data.text);
    }

    onTranscript?.(data.text, data.isFinal);
  }, [sessionId, onTranscript]);

  const handleEmotion = useCallback((data: {
    sessionId: string;
    emotion: string;
    confidence: number;
  }) => {
    console.log('Emotion detected:', data);
  }, []);

  const handleMoshiError = useCallback((data: { sessionId: string; error: Error }) => {
    if (data.sessionId === sessionId) {
      handleError(data.error);
    }
  }, [sessionId, handleError]);

  const connect = async () => {
    if (isConnected || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      const newSessionId = sessionId || `voice-${Date.now()}`;
      setSessionId(newSessionId);

      // Start WebRTC session
      await webRTCVoiceService.startVoiceSession(newSessionId);
      
      // Connect to Moshi
      await moshiWebRTCBridge.connectToMoshi(newSessionId);

      // Join signaling room
      webRTCSignalingService.joinSession(newSessionId);
    } catch (err) {
      console.error('Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!isConnected && !isConnecting) return;

    try {
      if (sessionId) {
        await webRTCVoiceService.endVoiceSession(sessionId);
        await moshiWebRTCBridge.disconnect(sessionId);
        webRTCSignalingService.leaveSession(sessionId);
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    } finally {
      setIsConnected(false);
      setIsConnecting(false);
      setTranscript('');
      setInterimTranscript('');
    }
  };

  const toggleMute = async () => {
    if (!sessionId) return;
    
    const newMuted = !isMuted;
    await webRTCVoiceService.setMuted(sessionId, newMuted);
    setIsMuted(newMuted);
  };

  const handleVolumeChange = async (newVolume: number) => {
    if (!sessionId) return;
    
    await webRTCVoiceService.setVolume(sessionId, newVolume);
    setVolume(newVolume);
  };

  const startAudioLevelMonitoring = () => {
    const session = webRTCVoiceService.getSession(sessionId);
    if (!session?.localStream) return;

    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContextRef.current.createMediaStreamSource(session.localStream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    source.connect(analyserRef.current);

    const updateAudioLevel = () => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 255);

      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();
  };

  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // Monitor connection quality
  useEffect(() => {
    if (!isConnected || !sessionId) return;

    const interval = setInterval(async () => {
      try {
        const stats = await webRTCVoiceService.getConnectionStats(sessionId);
        
        // Extract relevant stats
        stats.forEach((report) => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            const latency = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : 0;
            const packetLoss = report.packetsLost || 0;
            
            let level: ConnectionQuality['level'] = 'excellent';
            if (latency > 300 || packetLoss > 5) level = 'poor';
            else if (latency > 150 || packetLoss > 2) level = 'fair';
            else if (latency > 50 || packetLoss > 0.5) level = 'good';
            
            setConnectionQuality({ level, latency, packetLoss });
          }
        });
      } catch (err) {
        console.error('Failed to get connection stats:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected, sessionId]);

  const getConnectionIcon = () => {
    const iconProps = { fontSize: 'small' as const };
    switch (connectionQuality.level) {
      case 'excellent':
        return <SignalCellularAlt {...iconProps} style={{ color: '#4caf50' }} />;
      case 'good':
        return <SignalCellularAlt {...iconProps} style={{ color: '#8bc34a' }} />;
      case 'fair':
        return <SignalCellularAlt {...iconProps} style={{ color: '#ff9800' }} />;
      case 'poor':
        return <SignalCellularAlt {...iconProps} style={{ color: '#f44336' }} />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" flexDirection="column" gap={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Voice Assistant</Typography>
            {isConnected && (
              <Tooltip title={`Latency: ${connectionQuality.latency.toFixed(0)}ms`}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  {getConnectionIcon()}
                  <Typography variant="caption" color="textSecondary">
                    {connectionQuality.level}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>

          <Box display="flex" justifyContent="center" gap={2}>
            <Tooltip title={isConnected ? 'Disconnect' : 'Connect'}>
              <span>
                <IconButton
                  size="large"
                  color={isConnected ? 'error' : 'primary'}
                  onClick={isConnected ? disconnect : connect}
                  disabled={isConnecting}
                  sx={{
                    background: theme => isConnected 
                      ? theme.palette.error.light 
                      : theme.palette.primary.light,
                    '&:hover': {
                      background: theme => isConnected 
                        ? theme.palette.error.main 
                        : theme.palette.primary.main,
                    }
                  }}
                >
                  {isConnecting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : isConnected ? (
                    <PhoneDisabled />
                  ) : (
                    <Phone />
                  )}
                </IconButton>
              </span>
            </Tooltip>

            {isConnected && (
              <>
                <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
                  <IconButton
                    size="large"
                    color={isMuted ? 'error' : 'default'}
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff /> : <Mic />}
                  </IconButton>
                </Tooltip>

                <Tooltip title={volume === 0 ? 'Unmute speaker' : 'Mute speaker'}>
                  <IconButton
                    size="large"
                    onClick={() => handleVolumeChange(volume === 0 ? 1 : 0)}
                  >
                    {volume === 0 ? <VolumeOff /> : <VolumeUp />}
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>

          {isConnected && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={audioLevel * 100}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme => theme.palette.grey[300],
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme => 
                      audioLevel > 0.7 ? theme.palette.error.main :
                      audioLevel > 0.3 ? theme.palette.success.main :
                      theme.palette.primary.main
                  }
                }}
              />
            </Box>
          )}

          {showTranscript && (transcript || interimTranscript) && (
            <Fade in>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: theme => theme.palette.grey[100],
                  borderRadius: 1,
                  maxHeight: 200,
                  overflowY: 'auto'
                }}
              >
                <Typography variant="body2">
                  {transcript}
                  {interimTranscript && (
                    <span style={{ opacity: 0.6, fontStyle: 'italic' }}>
                      {' '}{interimTranscript}
                    </span>
                  )}
                </Typography>
              </Box>
            </Fade>
          )}

          {isConnected && (
            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                icon={<WifiTethering />}
                label="WebRTC Connected"
                color="success"
                variant="outlined"
              />
              <Chip
                size="small"
                icon={<CheckCircle />}
                label="Moshi AI Active"
                color="primary"
                variant="outlined"
              />
            </Stack>
          )}
        </Box>
      </CardContent>

      <audio ref={remoteAudioRef} style={{ display: 'none' }} />

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Card>
  );
};