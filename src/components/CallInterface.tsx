import React, { useState, useEffect, useRef } from 'react';
import {
  Typography,
  IconButton,
  Avatar,
  Chip,
  Slide,
  CircularProgress,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
// Removed glassmorphism imports - using inline styles for TypeScript compatibility
import { useStore } from '../store/useStore';
import { transcriptionService } from '../services/transcriptionService';
import { harveyWebRTC } from '../services/harveyWebRTC';

interface CallInterfaceProps {
  contact: {
    name: string;
    phoneNumber: string;
    avatar?: string;
  };
  onEndCall: (_duration?: number) => void;
  callSid?: string;
}

export const CallInterface: React.FC<CallInterfaceProps> = ({ contact, onEndCall, callSid }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative'>('neutral');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [fullTranscript, setFullTranscript] = useState<string[]>([]);
  const [harveyConnected] = useState(false);
  const [harveyCoachingText, setHarveyCoachingText] = useState<string>('');
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const { aiEnabled, transcriptionEnabled, activeCall } = useStore();

  // Initialize microphone access
  useEffect(() => {
    const initializeMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;
      } catch (error) {
        setTranscriptionError(
          'Microphone access denied. Please allow microphone permissions and refresh.'
        );
      }
    };

    initializeMicrophone();

    // Cleanup on unmount
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Listen for Harvey coaching messages
  useEffect(() => {
    if (!aiEnabled) return;

    // Set up Harvey message listener
    const handleHarveyMessage = (event: CustomEvent) => {
      if (event.detail && event.detail.type === 'coaching') {
        setHarveyCoachingText(event.detail.message);
        // Clear coaching text after 5 seconds
        setTimeout(() => setHarveyCoachingText(''), 5000);
      }
    };

    window.addEventListener('harvey-coaching' as any, handleHarveyMessage);

    return () => {
      window.removeEventListener('harvey-coaching' as any, handleHarveyMessage);
    };
  }, [aiEnabled]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Simulate waveform animation
    const canvas = waveformRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const bars = 40;
    const barWidth = width / bars;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < bars; i++) {
        const barHeight = Math.random() * height * 0.7 + height * 0.15;
        const x = i * barWidth;
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#6366F1');
        gradient.addColorStop(1, '#8B5CF6');

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Start real-time transcription if enabled
    if (transcriptionEnabled && aiEnabled && (callSid || activeCall?.callSid)) {
      const currentCallSid = callSid || activeCall?.callSid;
      if (!currentCallSid) return;

      setIsConnecting(true);
      setIsTranscribing(true);

      // Start transcription service
      transcriptionService.startTranscription(
        currentCallSid,
        // On transcription update
        async (update) => {
          setIsConnecting(false);
          setTranscript(update.text);

          // Add to full transcript if it's a final transcription
          if (update.isFinal) {
            setFullTranscript((prev) => [...prev, update.text]);

            // Send transcription to Harvey for analysis
            if (harveyConnected && harveyWebRTC) {
              harveyWebRTC.sendVoiceCommand(`analyze: ${update.text}`);
            }
          }

          // Update sentiment
          if (update.sentiment) {
            setSentiment(update.sentiment);
          } else {
            // Analyze sentiment locally if not provided
            const sentimentResult = await transcriptionService.getSentimentAnalysis(update.text);
            setSentiment(sentimentResult);
          }
        },
        // On error
        (error) => {
          setTranscriptionError(error.message);
          setIsTranscribing(false);
          setIsConnecting(false);
        },
        // On complete
        () => {
          setIsTranscribing(false);
          setIsConnecting(false);
        }
      );

      // Cleanup on unmount
      return () => {
        transcriptionService.stopTranscription(currentCallSid);
      };
    }
  }, [transcriptionEnabled, aiEnabled, callSid, activeCall, harveyConnected]);

  const toggleMicrophone = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);

      // Notify Harvey of mute status
      if (harveyWebRTC) {
        harveyWebRTC.setMuted(!isMuted);
      }
    } else {
      setTranscriptionError(
        'Microphone not available. Please refresh and allow microphone access.'
      );
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sentimentColors = {
    positive: '#10B981',
    neutral: '#6366F1',
    negative: '#EF4444',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        backdropFilter: 'blur(16px) saturate(150%)',
        WebkitBackdropFilter: 'blur(16px) saturate(150%)',
      }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '500px',
          padding: '24px',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Avatar
              src={contact.avatar}
              alt={contact.name}
              sx={{
                width: 120,
                height: 120,
                margin: '0 auto',
                mb: 2,
                border: `4px solid ${sentimentColors[sentiment]}`,
                boxShadow: `0 0 40px ${sentimentColors[sentiment]}66`,
                transition: 'all 0.3s ease',
              }}
            />
            <Typography variant="h4" fontWeight="600" color="white" gutterBottom>
              {contact.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {contact.phoneNumber}
            </Typography>
            <Typography variant="h6" color="primary.light" mt={2}>
              {formatDuration(duration)}
            </Typography>
          </div>
        </motion.div>

        {/* Waveform Visualization */}
        <div
          style={{
            width: '100%',
            height: '80px',
            marginBottom: '32px',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'rgba(0,0,0,0.3)',
            position: 'relative',
          }}
        >
          <canvas
            ref={waveformRef}
            width={500}
            height={80}
            style={{
              width: '100%',
              height: '100%',
              opacity: 0.8,
            }}
          />
          {aiEnabled && transcriptionEnabled && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isConnecting ? (
                <CircularProgress size={16} sx={{ color: 'primary.light' }} />
              ) : isTranscribing ? (
                <FiberManualRecordIcon
                  sx={{
                    color: '#EF4444',
                    fontSize: 16,
                    animation: 'pulse 1.5s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.3 },
                      '100%': { opacity: 1 },
                    },
                  }}
                />
              ) : (
                <RecordVoiceOverIcon sx={{ color: 'primary.light', fontSize: 16 }} />
              )}
              <Typography variant="caption" color="primary.light">
                {isConnecting ? 'Connecting...' : isTranscribing ? 'AI Transcribing' : 'AI Ready'}
              </Typography>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {transcriptionError && (
          <Alert
            severity="error"
            onClose={() => setTranscriptionError(null)}
            sx={{
              marginBottom: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'white',
              '& .MuiAlert-icon': { color: '#EF4444' },
            }}
          >
            {transcriptionError}
          </Alert>
        )}

        {/* Harvey Coaching Overlay */}
        {aiEnabled && harveyCoachingText && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 24px',
              borderRadius: '24px',
              background:
                'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.15) 100%)',
              backdropFilter: 'blur(20px) saturate(200%)',
              WebkitBackdropFilter: 'blur(20px) saturate(200%)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              boxShadow: '0 4px 20px rgba(255, 215, 0, 0.2)',
              zIndex: 10,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#FFD700',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <RecordVoiceOverIcon sx={{ fontSize: 18 }} />
              {harveyCoachingText}
            </Typography>
          </motion.div>
        )}

        {/* AI Transcript */}
        {transcriptionEnabled && (transcript || fullTranscript.length > 0) && (
          <Slide direction="up" in={!!(transcript || fullTranscript.length > 0)}>
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '24px',
                minHeight: '80px',
                maxHeight: '200px',
                overflowY: 'auto',
                position: 'relative',
                background: `${sentimentColors[sentiment]}22`,
                backdropFilter: 'blur(20px) saturate(200%)',
                WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                border: `1px solid ${sentimentColors[sentiment]}44`,
              }}
            >
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Real-time Transcript
              </Typography>

              {/* Show full transcript history */}
              {fullTranscript.map((text, index) => (
                <Typography key={index} variant="body2" color="white" paragraph>
                  {text}
                </Typography>
              ))}

              {/* Show current transcript being spoken */}
              {transcript && (
                <Typography
                  variant="body2"
                  color="white"
                  sx={{
                    fontStyle: 'italic',
                    opacity: 0.8,
                  }}
                >
                  {transcript}
                </Typography>
              )}

              <Chip
                label={sentiment}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: sentimentColors[sentiment],
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            </div>
          </Slide>
        )}

        {/* Call Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <IconButton
              onClick={toggleMicrophone}
              sx={{
                width: 56,
                height: 56,
                background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)',
                border: `2px solid ${isMuted ? '#EF4444' : 'rgba(255,255,255,0.2)'}`,
                color: isMuted ? '#EF4444' : 'white',
                '&:hover': {
                  background: isMuted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.2)',
                },
              }}
            >
              {isMuted ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <IconButton
              onClick={() => onEndCall(duration)}
              sx={{
                width: 80,
                height: 80,
                color: 'white',
                background: 'rgba(239, 68, 68, 0.2)',
                backdropFilter: 'blur(20px) saturate(200%)',
                WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.4), 0 0 60px rgba(239, 68, 68, 0.3)',
                '&:hover': {
                  transform: 'scale(1.05)',
                  background: 'rgba(239, 68, 68, 0.3)',
                },
              }}
            >
              <CallEndIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <IconButton
              onClick={() => setSpeakerOn(!speakerOn)}
              sx={{
                width: 56,
                height: 56,
                background: speakerOn ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.1)',
                border: `2px solid ${speakerOn ? '#6366F1' : 'rgba(255,255,255,0.2)'}`,
                color: speakerOn ? '#6366F1' : 'white',
                '&:hover': {
                  background: speakerOn ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.2)',
                },
              }}
            >
              {speakerOn ? <VolumeUpIcon /> : <VolumeOffIcon />}
            </IconButton>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
