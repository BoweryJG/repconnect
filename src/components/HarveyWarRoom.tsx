import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Avatar,
  Button,
  LinearProgress,
  Tooltip,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  Phone,
  PhoneInTalk,
  PhoneMissed,
  Visibility,
  VolumeUp,
  VolumeOff,
  Timeline,
  TrendingUp,
  TrendingDown,
  EmojiEvents,
  Warning,
  Speed,
  Psychology,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Text } from '@react-three/drei';
import { harveyService } from '../services/harveyService';
import { harveyWebRTC } from '../services/harveyWebRTC';

interface ActiveCall {
  id: string;
  repName: string;
  repId: string;
  customerName: string;
  phoneNumber: string;
  duration: number;
  status: 'connecting' | 'active' | 'ending';
  confidence: number;
  sentiment: number;
  voiceMetrics: {
    pace: 'slow' | 'normal' | 'fast';
    tone: 'nervous' | 'confident' | 'aggressive' | 'uncertain';
    volume: number;
  };
  spectators: string[];
  harveyAdvice?: string;
}

interface BattleMode {
  active: boolean;
  rep1: ActiveCall | null;
  rep2: ActiveCall | null;
  winner?: string;
}

// 3D Visualization Component for Active Calls
const CallVisualization: React.FC<{ calls: ActiveCall[] }> = ({ calls }) => {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      
      {calls.map((call, index) => {
        const angle = (index / calls.length) * Math.PI * 2;
        const x = Math.cos(angle) * 5;
        const z = Math.sin(angle) * 5;
        const color = call.confidence > 70 ? '#10B981' : call.confidence > 40 ? '#F59E0B' : '#EF4444';
        
        return (
          <group key={call.id} position={[x, 0, z]}>
            <Sphere args={[1, 32, 32]}>
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.5}
                transparent
                opacity={0.8}
              />
            </Sphere>
            <Text
              position={[0, -1.5, 0]}
              fontSize={0.5}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {call.repName}
            </Text>
          </group>
        );
      })}
    </Canvas>
  );
};

export const HarveyWarRoom: React.FC = () => {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [battleMode, setBattleMode] = useState<BattleMode>({ active: false, rep1: null, rep2: null });
  const [selectedCall, setSelectedCall] = useState<ActiveCall | null>(null);
  const [isListening, setIsListening] = useState<{ [key: string]: boolean }>({});
  const [teamStats, setTeamStats] = useState({
    totalActive: 0,
    avgConfidence: 0,
    successRate: 0,
    hotStreak: 0,
  });
  
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    // Subscribe to real-time call updates
    const unsubscribe = harveyService.subscribeToUpdates((update) => {
      if (update.type === 'warroom') {
        handleWarRoomUpdate(update.data);
      }
    });

    // Initial load
    loadActiveCalls();

    return () => {
      unsubscribe();
      // Stop all audio streams
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  const loadActiveCalls = async () => {
    // In a real implementation, this would fetch from the backend
    // For now, we'll simulate some active calls
    const mockCalls: ActiveCall[] = [
      {
        id: '1',
        repName: 'Sarah Chen',
        repId: 'rep1',
        customerName: 'Tech Corp CEO',
        phoneNumber: '+1234567890',
        duration: 125,
        status: 'active',
        confidence: 85,
        sentiment: 0.7,
        voiceMetrics: { pace: 'normal', tone: 'confident', volume: 75 },
        spectators: ['John', 'Mike'],
        harveyAdvice: 'Push for the close. They\'re ready.',
      },
      {
        id: '2',
        repName: 'Mike Ross',
        repId: 'rep2',
        customerName: 'Startup Founder',
        phoneNumber: '+0987654321',
        duration: 45,
        status: 'active',
        confidence: 45,
        sentiment: -0.2,
        voiceMetrics: { pace: 'fast', tone: 'nervous', volume: 60 },
        spectators: ['Sarah'],
        harveyAdvice: 'Slow down. You\'re losing them.',
      },
    ];
    
    setActiveCalls(mockCalls);
    updateTeamStats(mockCalls);
  };

  const handleWarRoomUpdate = (data: any) => {
    if (data.type === 'call-started') {
      setActiveCalls(prev => [...prev, data.call]);
    } else if (data.type === 'call-updated') {
      setActiveCalls(prev => prev.map(call => 
        call.id === data.call.id ? data.call : call
      ));
    } else if (data.type === 'call-ended') {
      setActiveCalls(prev => prev.filter(call => call.id !== data.callId));
    } else if (data.type === 'battle-mode') {
      setBattleMode(data.battle);
    }
    
    updateTeamStats(activeCalls);
  };

  const updateTeamStats = (calls: ActiveCall[]) => {
    const active = calls.length;
    const avgConfidence = calls.reduce((sum, call) => sum + call.confidence, 0) / (active || 1);
    
    setTeamStats({
      totalActive: active,
      avgConfidence,
      successRate: 0.68, // Would be calculated from historical data
      hotStreak: 5, // Would track consecutive successes
    });
  };

  const toggleListenToCall = async (callId: string) => {
    const isCurrentlyListening = isListening[callId];
    
    if (isCurrentlyListening) {
      // Stop listening
      if (audioRefs.current[callId]) {
        audioRefs.current[callId].pause();
      }
      setIsListening(prev => ({ ...prev, [callId]: false }));
    } else {
      // Start listening
      setIsListening(prev => ({ ...prev, [callId]: true }));
      
      // In a real implementation, this would establish WebRTC connection
      // to listen to the specific call
      await harveyWebRTC.enterBattleMode(callId);
    }
  };

  const startBattleMode = (rep1Id: string, rep2Id: string) => {
    const rep1 = activeCalls.find(call => call.repId === rep1Id);
    const rep2 = activeCalls.find(call => call.repId === rep2Id);
    
    if (rep1 && rep2) {
      setBattleMode({
        active: true,
        rep1,
        rep2,
      });
      
      // Notify Harvey to start battle mode commentary
      harveyService.submitVoiceCommand('Start battle mode commentary');
    }
  };

  const getCallStatusColor = (call: ActiveCall) => {
    if (call.confidence > 70) return '#10B981';
    if (call.confidence > 40) return '#F59E0B';
    return '#EF4444';
  };

  const getVoiceMetricIcon = (metric: string) => {
    switch (metric) {
      case 'fast': return <Speed sx={{ color: '#F59E0B' }} />;
      case 'slow': return <Speed sx={{ color: '#3B82F6' }} />;
      case 'nervous': return <Warning sx={{ color: '#EF4444' }} />;
      case 'confident': return <Psychology sx={{ color: '#10B981' }} />;
      default: return <Psychology />;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0A0A0B 0%, #1A1A1B 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background: 'radial-gradient(circle at 50% 50%, #6366F1 0%, transparent 70%)',
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              HARVEY'S WAR ROOM
            </Typography>
            <Typography variant="h5" sx={{ color: 'text.secondary' }}>
              Live Performance Theater
            </Typography>
          </Box>
        </motion.div>

        {/* Team Stats Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Paper
            sx={{
              p: 3,
              mb: 4,
              background: 'rgba(26, 26, 26, 0.95)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ color: '#6366F1', fontWeight: 900 }}>
                    {teamStats.totalActive}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Active Calls
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ color: getCallStatusColor({ confidence: teamStats.avgConfidence } as any), fontWeight: 900 }}>
                    {teamStats.avgConfidence.toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Avg Confidence
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ color: '#10B981', fontWeight: 900 }}>
                    {(teamStats.successRate * 100).toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Success Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Typography variant="h3" sx={{ color: '#EF4444', fontWeight: 900 }}>
                      {teamStats.hotStreak}
                    </Typography>
                    <TrendingUp sx={{ fontSize: 40, color: '#EF4444' }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Hot Streak
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>

        {/* 3D Visualization */}
        {!battleMode.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Paper
              sx={{
                mb: 4,
                height: 400,
                background: 'rgba(26, 26, 26, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
              }}
            >
              <CallVisualization calls={activeCalls} />
            </Paper>
          </motion.div>
        )}

        {/* Battle Mode Display */}
        {battleMode.active && battleMode.rep1 && battleMode.rep2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Paper
              sx={{
                mb: 4,
                p: 3,
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
                border: '2px solid rgba(236, 72, 153, 0.5)',
              }}
            >
              <Typography variant="h4" sx={{ textAlign: 'center', mb: 3, fontWeight: 700 }}>
                ⚔️ BATTLE MODE ⚔️
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                  <CallCard call={battleMode.rep1} isBattle />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="h2" sx={{ color: '#EC4899' }}>
                      VS
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={5}>
                  <CallCard call={battleMode.rep2} isBattle />
                </Grid>
              </Grid>
            </Paper>
          </motion.div>
        )}

        {/* Active Calls Grid */}
        <Grid container spacing={3}>
          {activeCalls.map((call, index) => (
            <Grid item xs={12} md={6} lg={4} key={call.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <CallCard
                  call={call}
                  onListen={() => toggleListenToCall(call.id)}
                  isListening={isListening[call.id]}
                  onSelect={() => setSelectedCall(call)}
                />
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* No Active Calls */}
        {activeCalls.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" sx={{ color: 'text.secondary', mb: 2 }}>
              No active calls right now
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.disabled' }}>
              The war room is quiet. Time to make some calls.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Hidden audio elements for call streams */}
      {Object.keys(isListening).map(callId => (
        <audio
          key={callId}
          ref={el => { if (el) audioRefs.current[callId] = el; }}
          style={{ display: 'none' }}
        />
      ))}
    </Box>
  );
};

// Individual Call Card Component
const CallCard: React.FC<{
  call: ActiveCall;
  onListen?: () => void;
  isListening?: boolean;
  onSelect?: () => void;
  isBattle?: boolean;
}> = ({ call, onListen, isListening, onSelect, isBattle }) => {
  const statusColor = call.confidence > 70 ? '#10B981' : call.confidence > 40 ? '#F59E0B' : '#EF4444';
  
  return (
    <Card
      sx={{
        background: 'rgba(26, 26, 26, 0.95)',
        border: `1px solid ${isBattle ? statusColor : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: 2,
        overflow: 'hidden',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'all 0.3s',
        '&:hover': onSelect ? {
          transform: 'translateY(-5px)',
          boxShadow: `0 10px 40px ${statusColor}40`,
        } : {},
      }}
      onClick={onSelect}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: statusColor,
                  width: 12,
                  height: 12,
                  animation: 'pulse 2s infinite',
                },
              }}
            >
              <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.2)' }}>
                {call.repName.charAt(0)}
              </Avatar>
            </Badge>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {call.repName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {call.customerName}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onListen && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onListen();
                }}
                sx={{
                  background: isListening ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                }}
              >
                {isListening ? <VolumeUp /> : <VolumeOff />}
              </IconButton>
            )}
            <Chip
              icon={<PhoneInTalk />}
              label={`${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}`}
              size="small"
              sx={{ background: 'rgba(99, 102, 241, 0.2)' }}
            />
          </Box>
        </Box>

        {/* Confidence Meter */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Confidence
            </Typography>
            <Typography variant="body2" sx={{ color: statusColor, fontWeight: 700 }}>
              {call.confidence}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={call.confidence}
            sx={{
              height: 8,
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${statusColor} 0%, ${statusColor}CC 100%)`,
                borderRadius: 4,
              },
            }}
          />
        </Box>

        {/* Voice Metrics */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            icon={getVoiceMetricIcon(call.voiceMetrics.pace)}
            label={call.voiceMetrics.pace}
            size="small"
            sx={{ background: 'rgba(255, 255, 255, 0.05)' }}
          />
          <Chip
            icon={getVoiceMetricIcon(call.voiceMetrics.tone)}
            label={call.voiceMetrics.tone}
            size="small"
            sx={{ background: 'rgba(255, 255, 255, 0.05)' }}
          />
        </Box>

        {/* Harvey's Advice */}
        {call.harveyAdvice && (
          <Box
            sx={{
              p: 2,
              background: 'rgba(236, 72, 153, 0.1)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Typography variant="caption" sx={{ color: '#EC4899', fontWeight: 700 }}>
              HARVEY SAYS:
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              "{call.harveyAdvice}"
            </Typography>
          </Box>
        )}

        {/* Spectators */}
        {call.spectators.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Visibility sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {call.spectators.length} watching
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to get voice metric icon
const getVoiceMetricIcon = (metric: string) => {
  switch (metric) {
    case 'fast': return <Speed sx={{ color: '#F59E0B' }} />;
    case 'slow': return <Speed sx={{ color: '#3B82F6' }} />;
    case 'nervous': return <Warning sx={{ color: '#EF4444' }} />;
    case 'confident': return <Psychology sx={{ color: '#10B981' }} />;
    default: return <Psychology />;
  }
};