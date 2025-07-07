import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Typography,
  Paper,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Gavel,
  Mic,
  MicOff,
  Warning,
  CheckCircle,
  TipsAndUpdates,
  Speed,
  Psychology,
  ExpandMore,
  ExpandLess,
  VolumeUp,
  VolumeOff,
} from '@mui/icons-material';
import { harveyWebRTC } from '../services/harveyWebRTC';
import { harveyService } from '../services/harveyService';

interface HarveyActiveCallInterfaceProps {
  isActive: boolean;
  contactName?: string;
  phoneNumber?: string;
  onClose?: () => void;
}

interface CoachingInsight {
  id: string;
  type: 'tip' | 'warning' | 'praise' | 'critical';
  message: string;
  timestamp: Date;
  urgency?: 'low' | 'medium' | 'high';
}

interface CallMetrics {
  talkRatio: number;
  pace: 'slow' | 'normal' | 'fast';
  confidence: number;
  objections: number;
  momentum: 'building' | 'steady' | 'losing';
}

export const HarveyActiveCallInterface: React.FC<HarveyActiveCallInterfaceProps> = ({
  isActive,
  contactName,
  phoneNumber,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [harveyVolume, setHarveyVolume] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');
  const [insights, setInsights] = useState<CoachingInsight[]>([]);
  const [metrics, setMetrics] = useState<CallMetrics>({
    talkRatio: 50,
    pace: 'normal',
    confidence: 75,
    objections: 0,
    momentum: 'steady',
  });
  const [harveyMode, setHarveyMode] = useState<string>('normal');
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isActive) {
      initializeHarvey();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isActive]);

  const initializeHarvey = async () => {
    try {
      // Get Harvey mode from localStorage
      const savedModes = localStorage.getItem('harveyModes');
      if (savedModes) {
        const modes = JSON.parse(savedModes);
        setHarveyMode(modes.coachingMode || 'normal');
      }

      // Initialize audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Connect to Harvey
      await harveyWebRTC.connect({
        userId: 'user',
        onConnectionChange: (connected) => {
          setConnectionStatus(connected ? 'connected' : 'reconnecting');
        },
        onAudioReceived: (audioData) => {
          if (harveyVolume) {
            playHarveyAudio(audioData);
          }
        },
        onVoiceAnalysis: (analysis) => {
          updateMetricsFromAnalysis(analysis);
        },
      });

      // Start initial coaching
      addInsight({
        id: Date.now().toString(),
        type: 'tip',
        message: getInitialMessage(),
        timestamp: new Date(),
        urgency: 'low',
      });

      // Simulate real-time insights
      startInsightGeneration();
    } catch (error) {
      console.error('Failed to initialize Harvey:', error);
      setConnectionStatus('reconnecting');
    }
  };

  const getInitialMessage = () => {
    switch (harveyMode) {
      case 'gentle':
        return "I'm here to help. Let's make this call count.";
      case 'aggressive':
        return "Time to close. No excuses, no hesitation.";
      case 'brutal':
        return "Show me you're not just another wannabe. Close or go home.";
      default:
        return "Let's see what you've got. Make it worth my time.";
    }
  };

  const playHarveyAudio = (audioData: string) => {
    if (!audioContextRef.current) return;
    
    const audio = new Audio(audioData);
    audio.volume = 0.3; // Harvey whispers
    audio.play();
  };

  const updateMetricsFromAnalysis = (analysis: any) => {
    setMetrics(prev => ({
      ...prev,
      confidence: analysis.confidence || prev.confidence,
      pace: analysis.pace || prev.pace,
    }));
  };

  const startInsightGeneration = () => {
    // Generate first insight quickly in mock mode
    setTimeout(() => generateInsight(), 3000);
    
    // Simulate Harvey's real-time insights
    const interval = setInterval(() => {
      if (Math.random() > 0.5) { // More frequent in mock mode
        generateInsight();
      }
    }, 8000); // Every 8 seconds

    return () => clearInterval(interval);
  };

  const generateInsight = () => {
    const insightTypes: Array<'tip' | 'warning' | 'praise' | 'critical'> = ['tip', 'warning', 'praise', 'critical'];
    const type = insightTypes[Math.floor(Math.random() * insightTypes.length)];
    
    const messages: Record<typeof type, string[]> = {
      tip: [
        "Ask about their current pain points now.",
        "Time to pivot - they're losing interest.",
        "Bridge to value proposition. Do it now.",
      ],
      warning: [
        "You're talking too much. Let them speak.",
        "Energy dropping. Pick up the pace.",
        "They're getting defensive. Soften approach.",
      ],
      praise: [
        "Good objection handling. Keep that energy.",
        "Perfect timing on that question.",
        "They're engaged. Push for commitment.",
      ],
      critical: [
        "Stop rambling. Get to the point.",
        "You just missed a buying signal. Pay attention.",
        "That was weak. Where's your conviction?",
      ],
    };

    const message = messages[type][Math.floor(Math.random() * messages[type].length)];
    
    addInsight({
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      urgency: type === 'critical' ? 'high' : type === 'warning' ? 'medium' : 'low',
    });
  };

  const addInsight = (insight: CoachingInsight) => {
    setInsights(prev => [insight, ...prev].slice(0, 5));
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    harveyWebRTC.setMuted(!isMuted);
  };

  const toggleHarveyVolume = () => {
    setHarveyVolume(!harveyVolume);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'tip': return <TipsAndUpdates sx={{ color: '#3B82F6' }} />;
      case 'warning': return <Warning sx={{ color: '#F59E0B' }} />;
      case 'praise': return <CheckCircle sx={{ color: '#10B981' }} />;
      case 'critical': return <Gavel sx={{ color: '#EF4444' }} />;
    }
  };

  const getMomentumColor = () => {
    switch (metrics.momentum) {
      case 'building': return '#10B981';
      case 'steady': return '#3B82F6';
      case 'losing': return '#EF4444';
    }
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        style={{
          position: 'fixed',
          right: 20,
          top: 80,
          width: 380,
          zIndex: 1200,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            background: 'rgba(26, 26, 26, 0.95)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%)',
              borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.div
                animate={{
                  boxShadow: connectionStatus === 'connected' 
                    ? ['0 0 10px rgba(255, 215, 0, 0.3)', '0 0 20px rgba(255, 215, 0, 0.5)', '0 0 10px rgba(255, 215, 0, 0.3)']
                    : '0 0 10px rgba(255, 215, 0, 0.1)',
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Gavel sx={{ fontSize: 24, color: '#000' }} />
              </motion.div>
              <div>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#FFD700' }}>
                  Harvey AI Coach
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {connectionStatus === 'connected' ? 'Active' : 'Reconnecting...'}
                </Typography>
              </div>
            </div>
            <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </div>

          <Collapse in={isExpanded}>
            <div style={{ padding: '16px' }}>
              {/* Call Info */}
              {contactName && (
                <div style={{ marginBottom: '16px' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Speaking with: <strong>{contactName}</strong>
                  </Typography>
                </div>
              )}

              {/* Metrics Dashboard */}
              <Paper
                sx={{
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 215, 0, 0.1)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Talk Ratio
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.talkRatio}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: metrics.talkRatio > 70 ? '#EF4444' : metrics.talkRatio < 30 ? '#F59E0B' : '#10B981',
                        },
                      }}
                    />
                  </div>
                  <div>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Confidence
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.confidence}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                        },
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <Chip
                    size="small"
                    icon={<Speed />}
                    label={`Pace: ${metrics.pace}`}
                    sx={{
                      background: 'rgba(255, 215, 0, 0.1)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                    }}
                  />
                  <Chip
                    size="small"
                    label={`Momentum: ${metrics.momentum}`}
                    sx={{
                      background: `${getMomentumColor()}20`,
                      border: `1px solid ${getMomentumColor()}`,
                      color: getMomentumColor(),
                    }}
                  />
                </div>
              </Paper>

              {/* Real-time Insights */}
              <Typography variant="subtitle2" sx={{ marginBottom: '8px', color: '#FFD700' }}>
                Live Coaching
              </Typography>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {insights.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                    Harvey is analyzing...
                  </Typography>
                ) : (
                  insights.map((insight, index) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Alert
                        severity={
                          insight.type === 'praise' ? 'success' :
                          insight.type === 'warning' ? 'warning' :
                          insight.type === 'critical' ? 'error' : 'info'
                        }
                        icon={getInsightIcon(insight.type)}
                        sx={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid',
                          borderColor: 
                            insight.type === 'praise' ? 'rgba(16, 185, 129, 0.5)' :
                            insight.type === 'warning' ? 'rgba(245, 158, 11, 0.5)' :
                            insight.type === 'critical' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)',
                          '& .MuiAlert-message': {
                            fontSize: '0.875rem',
                          },
                        }}
                      >
                        {insight.message}
                      </Alert>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <IconButton
                    size="small"
                    onClick={toggleMute}
                    sx={{
                      background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 215, 0, 0.1)',
                      border: '1px solid',
                      borderColor: isMuted ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 215, 0, 0.3)',
                      '&:hover': {
                        background: isMuted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 215, 0, 0.2)',
                      },
                    }}
                  >
                    {isMuted ? <MicOff sx={{ fontSize: 20 }} /> : <Mic sx={{ fontSize: 20 }} />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={toggleHarveyVolume}
                    sx={{
                      background: 'rgba(255, 215, 0, 0.1)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      '&:hover': {
                        background: 'rgba(255, 215, 0, 0.2)',
                      },
                    }}
                  >
                    {harveyVolume ? <VolumeUp sx={{ fontSize: 20 }} /> : <VolumeOff sx={{ fontSize: 20 }} />}
                  </IconButton>
                </div>
                <Chip
                  size="small"
                  label={`Mode: ${harveyMode?.toUpperCase() || 'NORMAL'}`}
                  sx={{
                    background: 'rgba(255, 215, 0, 0.1)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    color: '#FFD700',
                  }}
                />
              </div>
            </div>
          </Collapse>
        </Paper>
      </motion.div>
    </AnimatePresence>
  );
};