import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Tabs,
  Tab,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Phone,
  Mic,
  VideoCall,
  Message,
  Psychology,
  GpsFixed,
  AutoAwesome
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';

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
  { id: 'microneedling', name: 'RF Microneedling', icon: '📍', color: 'warning' }
];

export default function InstantCoachConnect() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [availableCoaches, setAvailableCoaches] = useState<CoachSpecialization[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCategory) {
      loadAvailableCoaches();
    }
  }, [selectedCategory]);

  const loadAvailableCoaches = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/coaching/available-coaches/${selectedCategory}`);
      if (!response.ok) throw new Error('Failed to fetch coaches');
      
      const data = await response.json();
      setAvailableCoaches(data.coaches || []);
    } catch (error) {
      console.error('Error loading coaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectToCoach = async (coachId: string, coachName: string) => {
    setConnecting(coachId);
    try {
      const response = await fetch('http://localhost:3001/api/coaching/start-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          repId: 'demo-rep-001',
          coachId,
          procedureCategory: selectedCategory,
          sessionType: 'practice_pitch'
        })
      });

      if (!response.ok) throw new Error('Failed to start session');
      
      const data = await response.json();
      
      // In real implementation, this would initiate WebRTC connection
      alert(`Starting session with ${coachName}! Session ID: ${data.session.id}`);

    } catch (error) {
      console.error('Error connecting to coach:', error);
      alert('Failed to connect to coach');
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div 
      style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        padding: '24px', 
        paddingTop: '64px' 
      }}
    >
      <div style={{ marginBottom: '32px' }}>
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom 
          sx={{ color: 'white' }}
        >
          Instant Coach Connect
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Practice with AI coaches specialized in specific procedures
        </Typography>
      </div>

      {/* Procedure Category Selection */}
      <div style={{ marginBottom: '32px' }}>
        <Typography 
          variant="h5" 
          component="h3" 
          gutterBottom 
          sx={{ color: 'white' }}
        >
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
                  backgroundColor: selectedCategory === category.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: selectedCategory === category.id ? '2px solid #6366F1' : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                  {category.icon}
                </Typography>
                <Typography 
                  variant="caption" 
                  display="block" 
                  sx={{ color: 'white' }}
                >
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
          <Typography 
            variant="h5" 
            component="h3" 
            gutterBottom 
            sx={{ color: 'white' }}
          >
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
                      border: '1px solid rgba(255, 255, 255, 0.1)'
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
                          <Typography key={i} variant="caption" display="block" color="text.secondary">
                            • {q}
                          </Typography>
                        ))}
                      </div>

                      <Typography variant="subtitle2" gutterBottom>
                        Practice Scenarios:
                      </Typography>
                      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {specialization.mock_scenarios?.slice(0, 2).map((scenario, i) => (
                          <Chip key={i} label={scenario.name} size="small" variant="outlined" />
                        ))}
                      </div>

                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={connecting === specialization.coach_id ? <CircularProgress size={16} /> : <Phone />}
                        onClick={() => connectToCoach(specialization.coach_id, specialization.coach?.name || '')}
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
            border: '1px solid rgba(255, 255, 255, 0.1)'
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
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                  <Message sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography 
                    variant="subtitle2" 
                    sx={{ color: 'white' }}
                  >
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
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                  <GpsFixed sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  <Typography 
                    variant="subtitle2" 
                    sx={{ color: 'white' }}
                  >
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
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                  <Psychology sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                  <Typography 
                    variant="subtitle2" 
                    sx={{ color: 'white' }}
                  >
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
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                  <AutoAwesome sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                  <Typography 
                    variant="subtitle2" 
                    sx={{ color: 'white' }}
                  >
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