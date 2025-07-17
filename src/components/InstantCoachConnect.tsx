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
import { Phone, Psychology, GpsFixed, AutoAwesome, Mic, Message } from '@mui/icons-material';
import { toast } from '../utils/toast';

interface Coach {
  id: string;
  name: string;
  gender: string;
  personality_type: string;
  avatar_url?: string;
  coaching_style: any;
  specialties: string[];
}

interface CoachSpecialization {
  id: string;
  coach_id: string;
  procedure_category: string;
  expertise_description: string;
  common_questions: string[];
  mock_scenarios: any[];
  coach?: Coach;
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
  const [availableCoaches, setAvailableCoaches] = useState<CoachSpecialization[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    if (selectedCategory) {
      loadAvailableCoaches();
    }
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
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/coaching/available-coaches/${selectedCategory}`
      );
      if (!response.ok) throw new Error('Failed to fetch coaches');

      const data = await response.json();
      setAvailableCoaches(data.coaches || []);
    } catch (error) {
      toast.error('Failed to load available coaches');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  const connectToCoach = async (coachId: string, coachName: string) => {
    setConnecting(coachId);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/coaching/start-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repId: 'demo-rep-001',
            coachId,
            procedureCategory: selectedCategory,
            sessionType: 'practice_pitch',
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to start session');

      const data = await response.json();

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
      } catch (micError) {
        toast.error(
          'Session created but microphone access was denied. Please enable microphone permissions and try again.'
        );
      }
    } catch (error) {
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
      await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/coaching/end-session/${activeSession.sessionId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: `Session duration: ${Math.floor(sessionTime / 60)}:${(sessionTime % 60).toString().padStart(2, '0')}`,
          }),
        }
      );

      // Clear session state
      setActiveSession(null);
      setSessionTime(0);
      (window as any).currentCoachingSession = null;
    } catch (error) {
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
              {availableCoaches.map((specialization) => (
                <Grid item xs={12} md={6} lg={4} key={specialization.id}>
                  <Card
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <CardHeader
                      title={specialization.coach?.name}
                      subheader={specialization.coach?.personality_type}
                      titleTypographyProps={{ sx: { color: 'white' } }}
                      subheaderTypographyProps={{ sx: { color: 'text.secondary' } }}
                      action={
                        <Chip
                          label={specialization.coach?.gender === 'male' ? '👨‍💼' : '👩‍💼'}
                          size="small"
                        />
                      }
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {specialization.expertise_description}
                      </Typography>

                      <Typography variant="subtitle2" gutterBottom>
                        Common Questions:
                      </Typography>
                      <div style={{ marginBottom: '16px' }}>
                        {specialization.common_questions?.slice(0, 2).map((q, i) => (
                          <Typography
                            key={i}
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            • {q}
                          </Typography>
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
                          connecting === specialization.coach_id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <Phone />
                          )
                        }
                        onClick={() =>
                          connectToCoach(specialization.coach_id, specialization.coach?.name || '')
                        }
                        disabled={connecting === specialization.coach_id}
                      >
                        {connecting === specialization.coach_id ? 'Connecting...' : 'Connect Now'}
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
