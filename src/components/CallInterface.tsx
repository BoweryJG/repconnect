import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Slide,
} from '@mui/material';
import { motion } from 'framer-motion';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
// Removed glassmorphism imports - using inline styles for TypeScript compatibility
import { useStore } from '../store/useStore';

interface CallInterfaceProps {
  contact: {
    name: string;
    phoneNumber: string;
    avatar?: string;
  };
  onEndCall: () => void;
}

export const CallInterface: React.FC<CallInterfaceProps> = ({ contact, onEndCall }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative'>('neutral');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const { aiEnabled, transcriptionEnabled } = useStore();

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
    // Simulate AI transcription
    if (transcriptionEnabled && aiEnabled) {
      setIsTranscribing(true);
      const messages = [
        "Hello! Thanks for calling. How can I help you today?",
        "I understand your concern. Let me look into that for you.",
        "That's a great question. Based on our records...",
        "I appreciate your patience. Here's what I can do for you...",
      ];

      let index = 0;
      const interval = setInterval(() => {
        if (index < messages.length) {
          setTranscript(messages[index]);
          // Simulate sentiment analysis
          setSentiment(['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any);
          index++;
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [transcriptionEnabled, aiEnabled]);

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
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 500, p: 3 }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
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
          </Box>
        </motion.div>

        {/* Waveform Visualization */}
        <Box
          sx={{
            width: '100%',
            height: 80,
            mb: 4,
            borderRadius: 2,
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
          {isTranscribing && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <RecordVoiceOverIcon sx={{ color: 'primary.light', fontSize: 16 }} />
              <Typography variant="caption" color="primary.light">
                AI Listening
              </Typography>
            </Box>
          )}
        </Box>

        {/* AI Transcript */}
        {transcriptionEnabled && transcript && (
          <Slide direction="up" in={!!transcript}>
            <Box
              sx={{
                padding: 2,
                borderRadius: 1.5,
                mb: 3,
                minHeight: 80,
                position: 'relative',
                overflow: 'hidden',
                background: `${sentimentColors[sentiment]}22`,
                backdropFilter: 'blur(20px) saturate(200%)',
                WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                border: `1px solid ${sentimentColors[sentiment]}44`,
                '@keyframes shimmer': {
                  '0%': { backgroundPosition: '-200% 0' },
                  '100%': { backgroundPosition: '200% 0' },
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.1,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite',
                },
              }}
            >
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Real-time Transcript
              </Typography>
              <Typography variant="body2" color="white">
                {transcript}
              </Typography>
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
            </Box>
          </Slide>
        )}

        {/* Call Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <IconButton
              onClick={() => setIsMuted(!isMuted)}
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
              onClick={onEndCall}
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
        </Box>
      </Box>
    </motion.div>
  );
};