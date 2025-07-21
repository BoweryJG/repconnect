import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Typography,
  Grid,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Phone,
  Psychology,
  GpsFixed,
  AutoAwesome,
  Mic,
  Message,
  RecordVoiceOver,
} from '@mui/icons-material';
import { toast } from '../utils/toast';
import api from '../config/api';

interface Coach {
  id: string;
  name: string;
  personality_type: string;
  avatar_emoji?: string;
  voice_enabled: boolean;
  voice_id?: string;
  voice_name?: string;
  whisper_supported: boolean;
  coaching_style: any;
  specialties: string[];
  category: string;
  conversation_style?: any;
  signature_phrases?: string[];
  // Special fields for Harvey
  aggression_level?: number;
  is_harvey?: boolean;
}

const procedureCategories = [
  { id: 'yomi_robot', name: 'Yomi Dental Robot', icon: '🦷', color: 'primary' },
  { id: 'injectables', name: 'Injectables (Botox)', icon: '💉', color: 'secondary' },
  { id: 'fillers', name: 'Dermal Fillers', icon: '✨', color: 'info' },
  { id: 'emsculpt', name: 'EMSculpt NEO', icon: '💪', color: 'success' },
  { id: 'lasers', name: 'Aesthetic Lasers', icon: '🔬', color: 'error' },
  { id: 'microneedling', name: 'RF Microneedling', icon: '📍', color: 'warning' },
];

export default function InstantCoachConnect() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [availableCoaches, setAvailableCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    if (selectedCategory) {
      loadAvailableCoaches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // Timer for active session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession]);

  const loadAvailableCoaches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/repconnect/agents');
      const data = response.data;

      // Map agents to coaches format with voice info
      const coaches = (data.agents || []).map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        personality_type: agent.personality_type,
        avatar_emoji: agent.avatar_emoji,
        voice_enabled: agent.voice_enabled,
        voice_id: agent.voice_id,
        voice_name: agent.voice_name,
        whisper_supported: agent.whisper_supported,
        coaching_style: agent.coaching_style,
        specialties: agent.specialties || [],
        category: agent.agent_category,
        conversation_style: agent.conversation_style,
        signature_phrases: agent.signature_phrases || [],
        // Mark Harvey as special
        is_harvey: agent.name === 'Harvey Specter',
        aggression_level:
          agent.personality_profile?.aggression || (agent.name === 'Harvey Specter' ? 9 : 5),
      }));

      setAvailableCoaches(coaches);
    } catch (_error) {
      toast.error('Failed to load available coaches');
    } finally {
      setLoading(false);
    }
  }, []);

  const connectToCoach = async (coachId: string, coachName: string) => {
    setConnecting(coachId);
    try {
      const { data } = await api.post('/api/coaching/start-session', {
        repId: 'demo-rep-001',
        coachId,
        procedureCategory: selectedCategory,
        sessionType: 'practice_pitch',
      });

      // Request microphone permission and start WebRTC
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });

        // Start the active session UI
        const sessionData = {
          sessionId: data.session.id,
          roomId: data.session.webrtc_room_id,
          coachId: coachId,
          coachName: coachName,
          stream: stream,
          startTime: new Date(),
        };

        setActiveSession(sessionData);
        setSessionTime(0);

        // Store globally for other components
        (window as any).currentCoachingSession = sessionData;
      } catch (_micError) {
        toast.error(
          'Session created but microphone access was denied. Please enable microphone permissions and try again.'
        );
      }
    } catch (_error) {
      toast.error('Failed to connect to coach');
    } finally {
      setConnecting(null);
    }
  };

  const endSession = async () => {
    if (!activeSession) return;

    try {
      // Stop microphone stream
      if (activeSession.stream) {
        activeSession.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }

      // End session in backend
      await api.post(`/api/coaching/end-session/${activeSession.sessionId}`, {
        notes: `Session duration: ${Math.floor(sessionTime / 60)}:${(sessionTime % 60).toString().padStart(2, '0')}`,
      });

      // Clear session state
      setActiveSession(null);
      setSessionTime(0);
      (window as any).currentCoachingSession = null;
    } catch (_error) {
      toast.error('Failed to end session properly');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If there's an active session, show the coaching interface
  if (activeSession) {
    return (
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '24px',
          paddingTop: '64px',
        }}
      >
        <Card
          sx={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
          }}
        >
          <CardHeader
            title={
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Psychology color="primary" />
                  <Typography variant="h5" sx={{ color: 'white' }}>
                    Coaching with {activeSession.coachName}
                  </Typography>
                </div>
                <Typography variant="h4" sx={{ color: '#00d4ff', fontFamily: 'monospace' }}>
                  {formatTime(sessionTime)}
                </Typography>
              </div>
            }
            sx={{ pb: 1 }}
          />
          <CardContent>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}
            >
              <Chip icon={<Mic />} label="Microphone Active" color="success" variant="outlined" />
              <Chip
                icon={<GpsFixed />}
                label={`Room: ${activeSession.roomId.split('-').pop()}`}
                color="info"
                variant="outlined"
              />
            </div>

            <Paper
              sx={{
                p: 3,
                mb: 3,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: '#00d4ff' }}>
                <AutoAwesome /> AI Coach is ready to help you practice!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Start speaking to begin your practice session. The AI coach will respond with
                feedback, questions, and guidance specific to {selectedCategory} procedures.
              </Typography>
            </Paper>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="error"
                size="large"
                onClick={endSession}
                startIcon={<Phone />}
              >
                End Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '24px',
        paddingTop: '64px',
      }}
    >
      <div style={{ marginBottom: '32px' }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'white' }}>
          Instant Coach Connect
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Practice with AI coaches specialized in specific procedures
        </Typography>

        {/* Special Harvey Button */}
        <Paper
          sx={{
            mt: 3,
            p: 2,
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
            border: '2px solid #8B5CF6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                🔥 Need to Close NOW? Get Harvey.
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                The elite closer. Aggressive, direct, no excuses. "I don't have dreams, I have
                goals."
              </Typography>
            </div>
            <Button
              variant="contained"
              size="large"
              onClick={async () => {
                // Load coaches if not already loaded
                if (availableCoaches.length === 0) {
                  await loadAvailableCoaches();
                }
                // Find Harvey
                const harvey = availableCoaches.find((c) => c.name === 'Harvey Specter');
                if (harvey) {
                  connectToCoach(harvey.id, harvey.name);
                } else {
                  // Fetch Harvey directly
                  try {
                    const response = await api.get('/api/repconnect/agents/harvey');
                    const harveyAgent = response.data.agent;
                    connectToCoach(harveyAgent.id, harveyAgent.name);
                  } catch (error) {
                    toast.error('Harvey is not available right now');
                  }
                }
              }}
              sx={{
                backgroundColor: 'white',
                color: '#8B5CF6',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                },
              }}
            >
              Connect to Harvey
            </Button>
          </div>
        </Paper>
      </div>

      {/* Procedure Category Selection */}
      <div style={{ marginBottom: '32px' }}>
        <Typography variant="h5" component="h3" gutterBottom sx={{ color: 'white' }}>
          What do you want to practice?
        </Typography>
        <Grid container spacing={2}>
          {procedureCategories.map((category) => (
            <Grid item xs={6} sm={4} md={2} key={category.id}>
              <Paper
                elevation={selectedCategory === category.id ? 4 : 1}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  padding: 16,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor:
                    selectedCategory === category.id
                      ? 'rgba(99, 102, 241, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                  border:
                    selectedCategory === category.id
                      ? '2px solid #6366F1'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                  {category.icon}
                </Typography>
                <Typography variant="caption" display="block" sx={{ color: 'white' }}>
                  {category.name}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </div>

      {/* Available Coaches */}
      {selectedCategory && (
        <div>
          <Typography variant="h5" component="h3" gutterBottom sx={{ color: 'white' }}>
            Available Coaches
          </Typography>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <CircularProgress />
            </div>
          ) : (
            <Grid container spacing={3}>
              {availableCoaches.map((coach) => (
                <Grid item xs={12} md={6} lg={4} key={coach.id}>
                  <Card
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: coach.is_harvey
                        ? 'rgba(139, 92, 246, 0.1)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: coach.is_harvey
                        ? '2px solid #8B5CF6'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {coach.is_harvey && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                          padding: '4px 12px',
                          borderBottomLeftRadius: '8px',
                        }}
                      >
                        <Typography
                          variant="caption"
                          style={{ color: 'white', fontWeight: 'bold' }}
                        >
                          ELITE CLOSER
                        </Typography>
                      </div>
                    )}
                    <CardHeader
                      title={
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>{coach.name}</span>
                          {coach.voice_enabled && (
                            <Chip
                              icon={<Mic />}
                              label="Voice"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </div>
                      }
                      subheader={coach.personality_type}
                      titleTypographyProps={{ sx: { color: 'white' } }}
                      subheaderTypographyProps={{ sx: { color: 'text.secondary' } }}
                      action={<Chip label={coach.avatar_emoji || '🤖'} size="small" />}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {coach.signature_phrases?.[0] ||
                          `Expert in ${coach.specialties.slice(0, 2).join(', ')}`}
                      </Typography>

                      <Typography variant="subtitle2" gutterBottom>
                        Specialties:
                      </Typography>
                      <div style={{ marginBottom: '16px' }}>
                        {coach.specialties.slice(0, 3).map((specialty, i) => (
                          <Chip
                            key={i}
                            label={specialty}
                            size="small"
                            variant="outlined"
                            style={{ marginRight: '4px', marginBottom: '4px' }}
                          />
                        ))}
                      </div>

                      <Typography variant="subtitle2" gutterBottom>
                        Practice Scenarios:
                      </Typography>
                      <div
                        style={{
                          marginBottom: '16px',
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {specialization.mock_scenarios?.slice(0, 2).map((scenario, i) => (
                          <Chip key={i} label={scenario.name} size="small" variant="outlined" />
                        ))}
                      </div>

                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={
                          connecting === coach.id ? <CircularProgress size={16} /> : <Phone />
                        }
                        onClick={() => connectToCoach(coach.id, coach.name)}
                        disabled={connecting === coach.id || !coach.voice_enabled}
                        color={coach.is_harvey ? 'secondary' : 'primary'}
                      >
                        {connecting === coach.id
                          ? 'Connecting...'
                          : coach.voice_enabled
                            ? 'Connect Now'
                            : 'Voice Coming Soon'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </div>
      )}

      {/* Session Types */}
      {selectedCategory && !loading && availableCoaches.length > 0 && (
        <Card
          style={{
            marginTop: 32,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <CardHeader
            title="Session Options"
            subheader="Choose how you want to practice"
            titleTypographyProps={{ sx: { color: 'white' } }}
            subheaderTypographyProps={{ sx: { color: 'text.secondary' } }}
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Paper
                  style={{
                    padding: 16,
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <Message sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ color: 'white' }}>
                    Q&A Session
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ask anything about the product
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper
                  style={{
                    padding: 16,
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <GpsFixed sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ color: 'white' }}>
                    Objection Handling
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Practice tough objections
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper
                  style={{
                    padding: 16,
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <Psychology sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ color: 'white' }}>
                    Mock Consultation
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Full patient roleplay
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper
                  style={{
                    padding: 16,
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <AutoAwesome sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ color: 'white' }}>
                    Pitch Practice
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Perfect your presentation
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
